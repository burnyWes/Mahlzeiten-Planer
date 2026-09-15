import axe from 'axe-core'

export async function accessibilityViolations(
  container: Element,
): Promise<string[]> {
  const results = await axe.run(container)
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help}`,
  )
}
