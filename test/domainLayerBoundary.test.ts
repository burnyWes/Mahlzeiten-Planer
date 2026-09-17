import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const domainFilePath = 'src/shopping/domain/boundaryProbe.ts'
const uiFilePath = 'src/shopping/ui/boundaryProbe.ts'
const mealsDomainFilePath = 'src/meals/domain/boundaryProbe.ts'
const mealsUiFilePath = 'src/meals/ui/boundaryProbe.ts'
const mealsApiFilePath = 'src/meals/api/boundaryProbe.ts'
const shoppingApiFilePath = 'src/shopping/api/boundaryProbe.ts'
const sharedDomainFilePath = 'src/shared/domain/boundaryProbe.ts'
const sharedUiFilePath = 'src/shared/ui/boundaryProbe.ts'

async function brokenRulesFor(source: string, filePath: string) {
  const [result] = await new ESLint().lintText(source, { filePath })
  return result.messages.map((message) => message.ruleId)
}

function importOf(module: string) {
  return `import { probe } from '${module}'\nexport const reexported = probe\n`
}

describe('domain layer boundary', () => {
  it('rejects a framework import inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a firebase import inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { getFirestore } from 'firebase/firestore'\nexport const probe = getFirestore\n`,
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects reaching into neighbouring layers from domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { client } from '../api/shoppingListClient'\nexport const probe = client\n`,
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects the shared user interface inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/ui/announcement'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a shared module other than the shared domain inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/auth/credentials'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a framework import inside the domain of meals', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      mealsDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the same imports outside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      uiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('api layer boundary', () => {
  it('rejects the user interface inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../ui/useMeals'),
      mealsApiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the domain inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../domain/meal'),
      mealsApiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('bounded context boundary', () => {
  it('rejects an import of meals inside shopping', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../meals/domain/meal'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects an import of shopping inside meals', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shopping/domain/shoppingItem'),
      mealsDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects an import of shopping inside the user interface of meals', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shopping/ui/useShoppingList'),
      mealsUiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a context inside the shared domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shopping/domain/shoppingItem'),
      sharedDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a context inside the shared user interface', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../meals/ui/MealsArea'),
      sharedUiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects an import of meals inside the api of shopping', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../meals/domain/meal'),
      shoppingApiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the shared quantity in both contexts', async () => {
    const inShopping = await brokenRulesFor(
      importOf('../../shared/domain/quantity'),
      domainFilePath,
    )
    const inMeals = await brokenRulesFor(
      importOf('../../shared/domain/quantity'),
      mealsDomainFilePath,
    )

    expect(inShopping).not.toContain('no-restricted-imports')
    expect(inMeals).not.toContain('no-restricted-imports')
  })
})
