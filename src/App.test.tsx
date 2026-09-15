import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAuthClient } from './shared/auth/inMemoryAuthClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'

const household = {
  email: 'haushalt@example.com',
  password: 'geheim',
  userId: 'household',
}

function renderApp(storageWarning?: string) {
  return render(
    <App
      authClient={createInMemoryAuthClient(household)}
      createShoppingListClient={() => createInMemoryShoppingListClient()}
      storageWarning={storageWarning}
    />,
  )
}

async function signIn() {
  await userEvent.type(screen.getByLabelText('E-Mail'), household.email)
  await userEvent.type(screen.getByLabelText('Passwort'), household.password)
  await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
}

describe('App', () => {
  it('keeps the live region in the document from the first render', () => {
    renderApp()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the shopping list once the household is signed in', async () => {
    renderApp()
    await signIn()

    expect(
      await screen.findByRole('heading', {
        name: 'Einkaufsliste, nichts offen',
      }),
    ).toBeInTheDocument()
  })

  it('announces that this device cannot store anything', () => {
    renderApp('Ohne Speicher auf diesem Gerät.')

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ohne Speicher auf diesem Gerät.',
    )
  })
})
