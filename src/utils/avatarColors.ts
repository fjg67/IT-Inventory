export type AvatarColor = {
  bg: string;
  text: string;
  shadow: string;
};

const AVATAR_PALETTE: AvatarColor[] = [
  { bg: '#1D4ED8', text: '#BFDBFE', shadow: 'rgba(29,78,216,0.30)' },
  { bg: '#B45309', text: '#FDE68A', shadow: 'rgba(180,83,9,0.30)' },
  { bg: '#B91C1C', text: '#FECACA', shadow: 'rgba(185,28,28,0.30)' },
  { bg: '#0E7490', text: '#A5F3FC', shadow: 'rgba(14,116,144,0.30)' },
  { bg: '#6D28D9', text: '#DDD6FE', shadow: 'rgba(109,40,217,0.30)' },
  { bg: '#065F46', text: '#A7F3D0', shadow: 'rgba(6,95,70,0.30)' },
  { bg: '#92400E', text: '#FDE68A', shadow: 'rgba(146,64,14,0.30)' },
  { bg: '#1F2937', text: '#D1D5DB', shadow: 'rgba(31,41,55,0.30)' },
];

export const getAvatarColor = (initials: string): AvatarColor => {
  if (!initials) return AVATAR_PALETTE[0];
  const sum = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};
