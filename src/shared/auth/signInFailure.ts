const messagesByFailureCode: Record<string, string> = {
  'auth/invalid-credential': 'E-Mail oder Passwort stimmt nicht.',
  'auth/invalid-login-credentials': 'E-Mail oder Passwort stimmt nicht.',
  'auth/wrong-password': 'E-Mail oder Passwort stimmt nicht.',
  'auth/user-not-found': 'E-Mail oder Passwort stimmt nicht.',
  'auth/invalid-email': 'Die E-Mail-Adresse ist nicht gültig.',
  'auth/user-disabled': 'Dieses Konto ist gesperrt.',
  'auth/network-request-failed':
    'Keine Verbindung. Die Anmeldung braucht Netz.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut versuchen.',
}

export function signInFailureMessage(failureCode: string): string {
  return messagesByFailureCode[failureCode] ?? 'Anmeldung fehlgeschlagen.'
}
