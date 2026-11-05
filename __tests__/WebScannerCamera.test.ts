import { getCameraCapabilityMessage, getCameraErrorMessage } from '../web/src/components/scanner/cameraErrors';

describe('diagnostic caméra du scanner Web', () => {
  it('n’affiche pas d’avertissement quand HTTPS et le navigateur sont compatibles', () => {
    expect(getCameraCapabilityMessage(true, true)).toBeNull();
  });

  it('n’affiche l’avertissement HTTPS que dans un contexte non sécurisé', () => {
    expect(getCameraCapabilityMessage(false, true)).toContain('HTTPS');
  });

  it('explique quand le navigateur ne fournit pas l’API caméra', () => {
    expect(getCameraCapabilityMessage(true, false)).toContain('navigateur');
  });

  it.each([
    ['NotAllowedError', 'autorisez la caméra'],
    ['NotFoundError', 'Aucune caméra'],
    ['NotReadableError', 'occupée ou indisponible'],
    ['OverconstrainedError', 'Aucune caméra'],
  ])('explique le cas %s', (name, expectedMessage) => {
    expect(getCameraErrorMessage({ name })).toContain(expectedMessage);
  });
});
