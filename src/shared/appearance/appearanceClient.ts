export type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface AppearanceClient {
  readInvertedColors(): boolean
  writeInvertedColors(invertedColors: boolean): void
}
