export type Credentials = {
  email: string
  password: string
}

export function areCredentialsComplete(credentials: Credentials): boolean {
  return (
    credentials.email.trim().length > 0 &&
    credentials.password.trim().length > 0
  )
}
