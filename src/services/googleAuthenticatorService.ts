function normalizeBase32(value: string): string {
  return value.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
}

function base32ToBytes(secret: string): number[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = normalizeBase32(secret);
  let bits = '';

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 secret');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return bytes;
}

function counterToBytes(counter: number): number[] {
  const bytes = new Array<number>(8).fill(0);
  let current = counter;

  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = current & 0xff;
    current = Math.floor(current / 256);
  }

  return bytes;
}

function leftRotate(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function sha1(messageBytes: number[]): number[] {
  const bytes = [...messageBytes];
  const bitLength = BigInt(bytes.length) * 8n;

  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  for (let index = 7; index >= 0; index -= 1) {
    bytes.push(Number((bitLength >> BigInt(index * 8)) & 0xffn));
  }

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = new Array<number>(80).fill(0);

    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4;
      words[index] = (
        (bytes[base] << 24) |
        (bytes[base + 1] << 16) |
        (bytes[base + 2] << 8) |
        bytes[base + 3]
      ) >>> 0;
    }

    for (let index = 16; index < 80; index += 1) {
      words[index] = leftRotate(words[index - 3] ^ words[index - 8] ^ words[index - 14] ^ words[index - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let index = 0; index < 80; index += 1) {
      let f = 0;
      let k = 0;

      if (index < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5a827999;
      } else if (index < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (leftRotate(a, 5) + f + e + k + words[index]) >>> 0;
      e = d;
      d = c;
      c = leftRotate(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4].flatMap((word) => [
    (word >>> 24) & 0xff,
    (word >>> 16) & 0xff,
    (word >>> 8) & 0xff,
    word & 0xff,
  ]);
}

function hmacSha1(keyBytes: number[], messageBytes: number[]): number[] {
  const blockSize = 64;
  let normalizedKey = [...keyBytes];

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha1(normalizedKey);
  }

  if (normalizedKey.length < blockSize) {
    normalizedKey = normalizedKey.concat(new Array<number>(blockSize - normalizedKey.length).fill(0));
  }

  const outerKeyPad = normalizedKey.map((byte) => byte ^ 0x5c);
  const innerKeyPad = normalizedKey.map((byte) => byte ^ 0x36);

  return sha1([...outerKeyPad, ...sha1([...innerKeyPad, ...messageBytes])]);
}

export function generateGoogleAuthenticatorCode(secret: string, timestamp = Date.now(), period = 30, digits = 6): string {
  const key = base32ToBytes(secret);
  const counter = Math.floor(timestamp / 1000 / period);
  const message = counterToBytes(counter);
  const bytes = hmacSha1(key, message);
  const offset = bytes[bytes.length - 1] & 0x0f;

  const binary = (
    ((bytes[offset] & 0x7f) << 24) |
    ((bytes[offset + 1] & 0xff) << 16) |
    ((bytes[offset + 2] & 0xff) << 8) |
    (bytes[offset + 3] & 0xff)
  );

  return String(binary % 10 ** digits).padStart(digits, '0');
}

export function verifyGoogleAuthenticatorCode(code: string, secret: string, window = 1): boolean {
  const normalizedCode = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const now = Date.now();

  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = generateGoogleAuthenticatorCode(secret, now + offset * 30000);
    if (candidate === normalizedCode) {
      return true;
    }
  }

  return false;
}

export function buildGoogleAuthenticatorUri(issuer: string, accountLabel: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const issuerParam = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerParam}&algorithm=SHA1&digits=6&period=30`;
}