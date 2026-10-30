export function isStaleSnapshot<Document>(
  unconfirmed: Document | null,
  arriving: Document,
  same: (one: Document, other: Document) => boolean,
): boolean {
  return unconfirmed !== null && !same(unconfirmed, arriving)
}
