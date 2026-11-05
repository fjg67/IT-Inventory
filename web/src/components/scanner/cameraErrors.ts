export function getCameraCapabilityMessage(
  isSecureContext: boolean,
  mediaDevicesAvailable: boolean,
): string | null {
  if (!isSecureContext) {
    return 'La caméra nécessite une connexion sécurisée (HTTPS). Ouvrez cette page avec HTTPS, puis réessayez.';
  }
  if (!mediaDevicesAvailable) {
    return 'Ce navigateur ne donne pas accès à la caméra. Utilisez Safari ou Chrome à jour, ou saisissez le code manuellement.';
  }
  return null;
}

export function getCameraErrorMessage(error: unknown): string {
  const name = error instanceof Error || (typeof error === 'object' && error !== null && 'name' in error)
    ? String(error.name)
    : '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'L’accès à la caméra est bloqué ou refusé. Dans Safari, ouvrez Réglages pour ce site web, autorisez la caméra, puis rechargez la page.';
  }
  if (name === 'NotFoundError') {
    return 'Aucune caméra n’a été détectée sur cet appareil.';
  }
  if (name === 'NotReadableError') {
    return 'La caméra est occupée ou indisponible. Fermez les autres applications ou onglets qui l’utilisent, puis réessayez.';
  }
  if (name === 'SecurityError') {
    return 'La caméra nécessite une connexion sécurisée (HTTPS). Ouvrez cette page avec HTTPS, puis réessayez.';
  }
  if (name === 'OverconstrainedError') {
    return 'Aucune caméra ne correspond aux paramètres demandés. Essayez une autre caméra ou saisissez le code manuellement.';
  }
  return 'Impossible de démarrer la caméra. Vérifiez les autorisations du site et réessayez.';
}

export async function queryCameraPermission(): Promise<PermissionState | undefined> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return undefined;
  try {
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state;
  } catch {
    return undefined;
  }
}
