import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from './appearanceClient'
import {
  createLocalStorageAppearanceClient,
  INVERTED_COLORS_KEY,
} from './localStorageAppearanceClient'

function storageHolding(storedValue: string | null) {
  const written: Record<string, string> = {}
  const storage: DeviceStorage = {
    getItem: (key) => (key === INVERTED_COLORS_KEY ? storedValue : null),
    setItem: (key, value) => {
      written[key] = value
    },
  }
  return { storage, written }
}

const throwingStorage: DeviceStorage = {
  getItem() {
    throw new Error('storage is blocked')
  },
  setItem() {
    throw new Error('storage is blocked')
  },
}

describe('localStorageAppearanceClient', () => {
  it('reads a remembered switch as turned on', () => {
    const { storage } = storageHolding('true')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readInvertedColors()).toBe(true)
  })

  it('reads a remembered switch as turned off', () => {
    const { storage } = storageHolding('false')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readInvertedColors()).toBe(false)
  })

  it('reads an unknown value as turned off', () => {
    const { storage } = storageHolding('maybe')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readInvertedColors()).toBe(false)
  })

  it('reads nothing remembered as turned off', () => {
    const { storage } = storageHolding(null)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readInvertedColors()).toBe(false)
  })

  it('remembers the switch turned on', () => {
    const { storage, written } = storageHolding(null)

    createLocalStorageAppearanceClient(storage).writeInvertedColors(true)

    expect(written).toEqual({ [INVERTED_COLORS_KEY]: 'true' })
  })

  it('remembers the switch turned off', () => {
    const { storage, written } = storageHolding('true')

    createLocalStorageAppearanceClient(storage).writeInvertedColors(false)

    expect(written).toEqual({ [INVERTED_COLORS_KEY]: 'false' })
  })

  it('stays usable without any storage', () => {
    const client = createLocalStorageAppearanceClient(null)

    expect(client.readInvertedColors()).toBe(false)
    expect(() => client.writeInvertedColors(true)).not.toThrow()
  })

  it('stays usable while the storage refuses to be read', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readInvertedColors()).toBe(false)
  })

  it('stays usable while the storage refuses to be written', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(() => client.writeInvertedColors(true)).not.toThrow()
  })
})
