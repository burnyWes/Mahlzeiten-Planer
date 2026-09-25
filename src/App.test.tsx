import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import { createInMemoryMealsClient } from './meals/api/inMemoryMealsClient'
import { createInMemorySuppliesClient } from './meals/api/inMemorySuppliesClient'
import { createInMemoryWeekPlanClient } from './meals/api/inMemoryWeekPlanClient'
import { createInMemoryAuthClient } from './shared/auth/inMemoryAuthClient'
import { createInMemoryKnownItemsClient } from './shopping/api/inMemoryKnownItemsClient'
import { createInMemoryKnownUnitsClient } from './shopping/api/inMemoryKnownUnitsClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'
import { DEFAULT_UNITS } from './shopping/domain/knownUnit'

const household = {
  email: 'haushalt@example.com',
  password: 'geheim',
  userId: 'household',
}

function renderApp(
  storageWarning?: string,
  appearanceClient = createInMemoryAppearanceClient(),
) {
  const appUpdateClient = createInMemoryAppUpdateClient()
  render(
    <App
      authClient={createInMemoryAuthClient(household)}
      createShoppingListClient={() => createInMemoryShoppingListClient()}
      createMealsClient={() => createInMemoryMealsClient()}
      createWeekPlanClient={() => createInMemoryWeekPlanClient()}
      createSuppliesClient={() => createInMemorySuppliesClient()}
      createKnownItemsClient={() => createInMemoryKnownItemsClient()}
      createKnownUnitsClient={() =>
        createInMemoryKnownUnitsClient(
          DEFAULT_UNITS.map((name) => ({ name, lastUsedAt: 0, timesUsed: 0 })),
        )
      }
      appUpdateClient={appUpdateClient}
      appearanceClient={appearanceClient}
      storageWarning={storageWarning}
    />,
  )
  return appUpdateClient
}

function invertedColorsOnTheDocument() {
  return document.documentElement.dataset.invertedColors
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

  it('inverts the colours of the document for a device that asked for it', () => {
    renderApp(undefined, createInMemoryAppearanceClient(true))

    expect(invertedColorsOnTheDocument()).toBe('true')
  })

  it('leaves the colours of the document alone without that wish', () => {
    renderApp(undefined, createInMemoryAppearanceClient(false))

    expect(invertedColorsOnTheDocument()).toBe('false')
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
