import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import { createInMemoryMealsClient } from './meals/api/inMemoryMealsClient'
import { createInMemoryAuthClient } from './shared/auth/inMemoryAuthClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'

const household = {
  email: 'haushalt@example.com',
  password: 'geheim',
  userId: 'household',
}

function renderApp(storageWarning?: string) {
  const appUpdateClient = createInMemoryAppUpdateClient()
  render(
    <App
      authClient={createInMemoryAuthClient(household)}
      createShoppingListClient={() => createInMemoryShoppingListClient()}
      createMealsClient={() => createInMemoryMealsClient()}
      appUpdateClient={appUpdateClient}
      storageWarning={storageWarning}
    />,
  )
  return appUpdateClient
}

async function signIn() {
  await userEvent.type(screen.getByLabelText('E-Mail'), household.email)
  await userEvent.type(screen.getByLabelText('Passwort'), household.password)
  await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
}

const updateOffer = { name: 'Neue Version laden' }

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

  it('offers nothing while no new version waits', () => {
    renderApp()

    expect(screen.queryByRole('button', updateOffer)).not.toBeInTheDocument()
  })

  it('offers a waiting new version instead of reloading on its own', async () => {
    const appUpdateClient = renderApp()
    await signIn()

    act(() => appUpdateClient.releaseUpdate(() => {}))

    expect(screen.getByRole('button', updateOffer)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Neue Version verfügbar.',
    )
  })

  it('loads the new version only once the household asks for it', async () => {
    let loadedVersions = 0
    const appUpdateClient = renderApp()

    act(() =>
      appUpdateClient.releaseUpdate(() => {
        loadedVersions += 1
      }),
    )
    expect(loadedVersions).toBe(0)

    await userEvent.click(screen.getByRole('button', updateOffer))

    expect(loadedVersions).toBe(1)
  })
})
