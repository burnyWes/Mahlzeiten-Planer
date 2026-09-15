import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const SUPERSAMPLING = 4
const BACKGROUND = [0x14, 0x53, 0x2d]
const PAPER = [0xff, 0xff, 0xff]
const LINE = [0x6b, 0x72, 0x80]
const BOX = [0x37, 0x41, 0x51]
const CHECK = [0x15, 0x80, 0x3d]

function createCanvas(size) {
  return { size, pixels: new Float64Array(size * size * 4) }
}

function paintPixel(canvas, x, y, color) {
  const offset = (y * canvas.size + x) * 4
  canvas.pixels[offset] = color[0]
  canvas.pixels[offset + 1] = color[1]
  canvas.pixels[offset + 2] = color[2]
  canvas.pixels[offset + 3] = 255
}

function isInsideRoundedRectangle(x, y, rectangle) {
  const { left, top, width, height, radius } = rectangle
  const right = left + width
  const bottom = top + height
  if (x < left || x >= right || y < top || y >= bottom) return false
  const nearestCornerX = Math.min(Math.max(x, left + radius), right - radius)
  const nearestCornerY = Math.min(Math.max(y, top + radius), bottom - radius)
  const distanceX = x - nearestCornerX
  const distanceY = y - nearestCornerY
  return distanceX * distanceX + distanceY * distanceY <= radius * radius
}

function paintRoundedRectangle(canvas, rectangle, color) {
  const firstX = Math.max(0, Math.floor(rectangle.left))
  const lastX = Math.min(
    canvas.size - 1,
    Math.ceil(rectangle.left + rectangle.width),
  )
  const firstY = Math.max(0, Math.floor(rectangle.top))
  const lastY = Math.min(
    canvas.size - 1,
    Math.ceil(rectangle.top + rectangle.height),
  )
  for (let y = firstY; y <= lastY; y += 1) {
    for (let x = firstX; x <= lastX; x += 1) {
      if (isInsideRoundedRectangle(x + 0.5, y + 0.5, rectangle)) {
        paintPixel(canvas, x, y, color)
      }
    }
  }
}

function distanceToSegment(x, y, from, to) {
  const segmentX = to[0] - from[0]
  const segmentY = to[1] - from[1]
  const lengthSquared = segmentX * segmentX + segmentY * segmentY
  const projection =
    lengthSquared === 0
      ? 0
      : Math.min(
          1,
          Math.max(
            0,
            ((x - from[0]) * segmentX + (y - from[1]) * segmentY) /
              lengthSquared,
          ),
        )
  const closestX = from[0] + projection * segmentX
  const closestY = from[1] + projection * segmentY
  return Math.hypot(x - closestX, y - closestY)
}

function paintPolyline(canvas, points, thickness, color) {
  const radius = thickness / 2
  for (let y = 0; y < canvas.size; y += 1) {
    for (let x = 0; x < canvas.size; x += 1) {
      for (let index = 0; index + 1 < points.length; index += 1) {
        const distance = distanceToSegment(
          x + 0.5,
          y + 0.5,
          points[index],
          points[index + 1],
        )
        if (distance <= radius) {
          paintPixel(canvas, x, y, color)
          break
        }
      }
    }
  }
}

function downsample(canvas, factor) {
  const size = canvas.size / factor
  const rgba = Buffer.alloc(size * size * 4)
  const samplesPerPixel = factor * factor
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let red = 0
      let green = 0
      let blue = 0
      let coverage = 0
      for (let sampleY = 0; sampleY < factor; sampleY += 1) {
        for (let sampleX = 0; sampleX < factor; sampleX += 1) {
          const offset =
            ((y * factor + sampleY) * canvas.size + x * factor + sampleX) * 4
          const sampleAlpha = canvas.pixels[offset + 3] / 255
          red += canvas.pixels[offset] * sampleAlpha
          green += canvas.pixels[offset + 1] * sampleAlpha
          blue += canvas.pixels[offset + 2] * sampleAlpha
          coverage += sampleAlpha
        }
      }
      const offset = (y * size + x) * 4
      rgba[offset] = coverage === 0 ? 0 : Math.round(red / coverage)
      rgba[offset + 1] = coverage === 0 ? 0 : Math.round(green / coverage)
      rgba[offset + 2] = coverage === 0 ? 0 : Math.round(blue / coverage)
      rgba[offset + 3] = Math.round((coverage / samplesPerPixel) * 255)
    }
  }
  return { size, rgba }
}

function compositeOnto(image, backgroundColor) {
  const rgb = Buffer.alloc(image.size * image.size * 3)
  for (let index = 0; index < image.size * image.size; index += 1) {
    const alpha = image.rgba[index * 4 + 3] / 255
    for (let channel = 0; channel < 3; channel += 1) {
      rgb[index * 3 + channel] = Math.round(
        image.rgba[index * 4 + channel] * alpha +
          backgroundColor[channel] * (1 - alpha),
      )
    }
  }
  return rgb
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, checksum])
}

function encodePng(size, pixels, bytesPerPixel) {
  const stride = size * bytesPerPixel
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header.writeUInt8(8, 8)
  header.writeUInt8(bytesPerPixel === 4 ? 6 : 2, 9)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function renderShoppingListIcon({ size, cornerRadiusRatio, contentScale }) {
  const canvas = createCanvas(size * SUPERSAMPLING)
  const full = canvas.size
  const unit = (fraction) => fraction * full
  const scaled = (fraction) => fraction * contentScale
  const centered = (fraction) => (fraction - 0.5) * contentScale + 0.5

  paintRoundedRectangle(
    canvas,
    {
      left: 0,
      top: 0,
      width: full,
      height: full,
      radius: unit(cornerRadiusRatio),
    },
    BACKGROUND,
  )
  paintRoundedRectangle(
    canvas,
    {
      left: unit(centered(0.2)),
      top: unit(centered(0.16)),
      width: unit(scaled(0.6)),
      height: unit(scaled(0.68)),
      radius: unit(scaled(0.05)),
    },
    PAPER,
  )

  const rowCenters = [0.33, 0.5, 0.67]
  rowCenters.forEach((rowCenter, index) => {
    const boxSize = scaled(0.1)
    const boxLeft = unit(centered(0.27))
    const boxTop = unit(centered(rowCenter)) - unit(boxSize) / 2
    paintRoundedRectangle(
      canvas,
      {
        left: boxLeft,
        top: boxTop,
        width: unit(boxSize),
        height: unit(boxSize),
        radius: unit(scaled(0.02)),
      },
      index === 0 ? CHECK : BOX,
    )
    if (index === 0) {
      paintPolyline(
        canvas,
        [
          [boxLeft + unit(scaled(0.024)), boxTop + unit(scaled(0.054))],
          [boxLeft + unit(scaled(0.043)), boxTop + unit(scaled(0.072))],
          [boxLeft + unit(scaled(0.078)), boxTop + unit(scaled(0.03))],
        ],
        unit(scaled(0.016)),
        PAPER,
      )
    }
    paintRoundedRectangle(
      canvas,
      {
        left: unit(centered(0.42)),
        top: unit(centered(rowCenter)) - unit(scaled(0.028)),
        width: unit(scaled(index === 2 ? 0.22 : 0.31)),
        height: unit(scaled(0.056)),
        radius: unit(scaled(0.028)),
      },
      LINE,
    )
  })

  return downsample(canvas, SUPERSAMPLING)
}

const publicDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
)

const iconsToGenerate = [
  {
    fileName: 'icon-192.png',
    size: 192,
    cornerRadiusRatio: 0.22,
    contentScale: 1,
    opaque: false,
  },
  {
    fileName: 'icon-512.png',
    size: 512,
    cornerRadiusRatio: 0.22,
    contentScale: 1,
    opaque: false,
  },
  {
    fileName: 'icon-maskable-512.png',
    size: 512,
    cornerRadiusRatio: 0,
    contentScale: 0.8,
    opaque: false,
  },
  {
    fileName: 'apple-touch-icon.png',
    size: 180,
    cornerRadiusRatio: 0,
    contentScale: 1,
    opaque: true,
  },
]

for (const icon of iconsToGenerate) {
  const image = renderShoppingListIcon(icon)
  const png = icon.opaque
    ? encodePng(image.size, compositeOnto(image, BACKGROUND), 3)
    : encodePng(image.size, image.rgba, 4)
  writeFileSync(join(publicDirectory, icon.fileName), png)
  process.stdout.write(
    `${icon.fileName} ${image.size}x${image.size} ${png.length} bytes\n`,
  )
}
