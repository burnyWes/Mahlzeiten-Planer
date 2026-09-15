import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const domainFilePath = 'src/shopping/domain/boundaryProbe.ts'
const uiFilePath = 'src/shopping/ui/boundaryProbe.ts'

async function brokenRulesFor(source: string, filePath: string) {
  const [result] = await new ESLint().lintText(source, { filePath })
  return result.messages.map((message) => message.ruleId)
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

  it('allows the same imports outside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      uiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})
