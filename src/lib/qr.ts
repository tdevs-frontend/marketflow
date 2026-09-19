/**
 * A QR encoder, in byte mode at error-correction level M.
 *
 * Here rather than from a package, and emphatically not from an image service,
 * because of the one string this product ever needs to encode: an `otpauth://`
 * URI containing a TOTP shared secret. That secret is the second factor. Posting
 * it to `api.qrserver.com` to get a PNG back would hand the whole of two-factor
 * authentication to a third party in the name of drawing a square, and it would
 * do it silently, over the network, from the merchant's own browser.
 *
 * So: no network, no dependency, no secret leaving the tab. `encodeQr` returns a
 * matrix of booleans and the caller decides how to draw it — `components/settings/qr-code`
 * renders it as a single SVG path.
 *
 * Scope is deliberately narrow. Byte mode only, because a URI is bytes; level M
 * only, because that is what authenticator QR codes use and a level picker would
 * be a parameter with one caller; versions 1–15, which tops out around 400 bytes
 * and is roughly triple the longest `otpauth` URI this product can build. Past
 * that it throws rather than silently truncating, because a QR code that scans
 * and yields a truncated secret is the worst possible outcome — it looks like it
 * worked.
 *
 * Implements ISO/IEC 18004. The section names below are that document's.
 */

/* -------------------------------------------------------------------------- */
/* GF(256)                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Log and antilog tables for GF(2^8) with primitive polynomial 0x11D.
 *
 * Reed–Solomon needs multiplication in this field on every codeword, and doing
 * it by carry-less multiply each time is a loop inside a loop inside a loop.
 * Two 256-entry tables turn it into an add.
 */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  /* Duplicated into the top half so `EXP[a + b]` never needs a modulo. */
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

const mul = (a: number, b: number): number =>
  a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];

/** The generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);

  for (let i = 0; i < degree; i += 1) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }

  return poly;
}

/** Polynomial long division; the remainder is the error-correction block. */
function errorCorrection(data: Uint8Array, ecLength: number): Uint8Array {
  const generator = generatorPoly(ecLength);
  const remainder = new Uint8Array(ecLength);

  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecLength - 1] = 0;

    if (factor !== 0) {
      for (let i = 0; i < ecLength; i += 1) {
        remainder[i] ^= mul(generator[i + 1], factor);
      }
    }
  }

  return remainder;
}

/* -------------------------------------------------------------------------- */
/* Version tables (level M)                                                   */
/* -------------------------------------------------------------------------- */

interface VersionSpec {
  /** Error-correction codewords per block. */
  ec: number;
  /** [blockCount, dataCodewordsPerBlock] for the short group, then the long. */
  groups: [count: number, dataCodewords: number][];
}

/** Table 13–22 of the spec, level M, versions 1–15. */
const VERSIONS: VersionSpec[] = [
  { ec: 10, groups: [[1, 16]] },
  { ec: 16, groups: [[1, 28]] },
  { ec: 26, groups: [[1, 44]] },
  { ec: 18, groups: [[2, 32]] },
  { ec: 24, groups: [[2, 43]] },
  { ec: 16, groups: [[4, 27]] },
  { ec: 18, groups: [[4, 31]] },
  { ec: 22, groups: [[2, 38], [2, 39]] },
  { ec: 22, groups: [[3, 36], [2, 37]] },
  { ec: 26, groups: [[4, 43], [1, 44]] },
  { ec: 30, groups: [[1, 50], [4, 51]] },
  { ec: 22, groups: [[6, 36], [2, 37]] },
  { ec: 22, groups: [[8, 37], [1, 38]] },
  { ec: 24, groups: [[4, 40], [5, 41]] },
  { ec: 24, groups: [[5, 41], [5, 42]] },
];

/** Alignment pattern centre coordinates, by version. */
const ALIGNMENT: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
];

const dataCodewords = (spec: VersionSpec): number =>
  spec.groups.reduce((total, [count, size]) => total + count * size, 0);

/** Bits in the character-count field: 8 below version 10, 16 from 10 up. */
const countBits = (version: number): number => (version < 10 ? 8 : 16);

/** How many raw bytes fit, after the mode indicator and the count field. */
function byteCapacity(version: number): number {
  const spec = VERSIONS[version - 1];
  return Math.floor((dataCodewords(spec) * 8 - 4 - countBits(version)) / 8);
}

/* -------------------------------------------------------------------------- */
/* Bit stream                                                                 */
/* -------------------------------------------------------------------------- */

class BitBuffer {
  private bits: number[] = [];

  push(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  get length(): number {
    return this.bits.length;
  }

  /** Pads to a byte boundary and packs. Callers add the terminator first. */
  toBytes(): Uint8Array {
    while (this.bits.length % 8 !== 0) this.bits.push(0);

    const out = new Uint8Array(this.bits.length / 8);
    for (let i = 0; i < this.bits.length; i += 1) {
      out[i >> 3] |= this.bits[i] << (7 - (i % 8));
    }
    return out;
  }
}

/**
 * Data codewords for `bytes`, padded to the version's capacity.
 *
 * The 0xEC / 0x11 alternation at the end is not arbitrary filler — it is the
 * pad pattern the spec names, chosen because it produces a well-mixed module
 * pattern rather than a large blank region that would trip the mask penalties.
 */
function encodeData(bytes: Uint8Array, version: number): Uint8Array {
  const spec = VERSIONS[version - 1];
  const capacity = dataCodewords(spec);

  const buffer = new BitBuffer();
  buffer.push(0b0100, 4); /* byte mode */
  buffer.push(bytes.length, countBits(version));
  for (const byte of bytes) buffer.push(byte, 8);

  /* Terminator: up to four zero bits, or fewer if the stream is nearly full. */
  buffer.push(0, Math.min(4, capacity * 8 - buffer.length));

  const packed = buffer.toBytes();
  const out = new Uint8Array(capacity);
  out.set(packed);

  for (let i = packed.length; i < capacity; i += 1) {
    out[i] = (i - packed.length) % 2 === 0 ? 0xec : 0x11;
  }

  return out;
}

/**
 * Splits into blocks, computes each block's EC, and interleaves both.
 *
 * Interleaving is what makes the error correction worth having: a coffee stain
 * covers a contiguous region of the symbol, and spreading each block's
 * codewords across the whole thing turns one unrecoverable block into a few
 * recoverable errors in every block.
 */
function buildCodewords(bytes: Uint8Array, version: number): Uint8Array {
  const spec = VERSIONS[version - 1];
  const data = encodeData(bytes, version);

  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let offset = 0;
  for (const [count, size] of spec.groups) {
    for (let i = 0; i < count; i += 1) {
      const block = data.subarray(offset, offset + size);
      offset += size;
      dataBlocks.push(block);
      ecBlocks.push(errorCorrection(block, spec.ec));
    }
  }

  const out: number[] = [];

  const longest = Math.max(...dataBlocks.map((block) => block.length));
  for (let i = 0; i < longest; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) out.push(block[i]);
    }
  }

  for (let i = 0; i < spec.ec; i += 1) {
    for (const block of ecBlocks) out.push(block[i]);
  }

  return Uint8Array.from(out);
}

/* -------------------------------------------------------------------------- */
/* Matrix                                                                     */
/* -------------------------------------------------------------------------- */

/** `null` means "still free for data" — the placement walk depends on it. */
type Grid = (boolean | null)[][];

function placeFunctionPatterns(grid: Grid, version: number) {
  const size = grid.length;

  const finder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const y = row + r;
        const x = col + c;
        if (y < 0 || y >= size || x < 0 || x >= size) continue;

        const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const onEdge = r === 0 || r === 6 || c === 0 || c === 6;
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[y][x] = inRing && (onEdge || inCore);
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  /* Timing patterns, which also fix the parity of every alignment centre. */
  for (let i = 8; i < size - 8; i += 1) {
    const dark = i % 2 === 0;
    grid[6][i] = dark;
    grid[i][6] = dark;
  }

  /*
   * Alignment patterns sit at every combination of the version's centre
   * coordinates, minus the three that would land on a finder — which the spec
   * identifies by *index*: first/first, first/last and last/first.
   *
   * It has to be the index rule and not "skip anything already drawn". From
   * version 7 there are centres like (6, 22) that lie on the timing row and are
   * nonetheless real alignment patterns; an occupancy test skips exactly those,
   * and the symbol it produces has finder patterns, timing and a valid format
   * block — so it *looks* right — while a scanner that uses the alignment grid
   * to correct for perspective finds nothing where it expects a pattern.
   *
   * Overwriting the timing modules underneath is correct and lossless: centres
   * are always even, so the alternating column the pattern writes on row 6
   * reproduces the timing parity exactly.
   */
  const centres = ALIGNMENT[version - 1];
  const last = centres.length - 1;

  for (let i = 0; i < centres.length; i += 1) {
    for (let j = 0; j < centres.length; j += 1) {
      const onFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === last) ||
        (i === last && j === 0);
      if (onFinder) continue;

      const row = centres[i];
      const col = centres[j];

      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          grid[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }

  /* The dark module. Always set, always here, and the spec gives no reason. */
  grid[size - 8][8] = true;

  /* Reserve the format areas so the data walk skips them. */
  for (let i = 0; i < 9; i += 1) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
  }
  for (let i = 0; i < 8; i += 1) {
    if (grid[8][size - 1 - i] === null) grid[8][size - 1 - i] = false;
    if (grid[size - 1 - i][8] === null) grid[size - 1 - i][8] = false;
  }

  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const row = Math.floor(i / 3);
      const col = size - 11 + (i % 3);
      grid[row][col] = false;
      grid[col][row] = false;
    }
  }
}

/** True where a module belongs to a function pattern rather than to the data. */
function reservedMask(version: number, size: number): boolean[][] {
  const probe: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  placeFunctionPatterns(probe, version);
  return probe.map((row) => row.map((cell) => cell !== null));
}

/**
 * The zigzag walk: two columns at a time, right to left, alternating direction.
 *
 * Column 6 is skipped entirely — it is the vertical timing pattern, and the
 * pairing is defined over the columns that remain.
 */
function placeData(grid: Grid, codewords: Uint8Array, reserved: boolean[][]) {
  const size = grid.length;
  let bit = 0;
  let upward = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5;

    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;

      for (const col of [right, right - 1]) {
        if (reserved[row][col]) continue;

        const byte = codewords[bit >> 3];
        const value = byte === undefined ? 0 : (byte >> (7 - (bit % 8))) & 1;
        grid[row][col] = value === 1;
        bit += 1;
      }
    }

    upward = !upward;
  }
}

const MASKS: ((row: number, col: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/**
 * The four penalty rules, scored together.
 *
 * They exist to pick the mask that scans most reliably: long same-colour runs
 * confuse the sampler, 2×2 blocks defeat the grid estimate, the 1:1:3:1:1
 * sequence is what the finder pattern looks like and must not appear in the
 * data, and a badly unbalanced light/dark ratio loses the threshold.
 */
function penalty(grid: boolean[][]): number {
  const size = grid.length;
  let score = 0;

  const scoreLine = (line: boolean[]) => {
    let run = 1;
    for (let i = 1; i < size; i += 1) {
      if (line[i] === line[i - 1]) {
        run += 1;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        run = 1;
      }
    }

    /* Rule 3, evaluated over the run of eleven the spec names, in both
       orientations, with the required four light modules on either side. */
    for (let i = 0; i + 6 < size; i += 1) {
      const window = line.slice(i, i + 7);
      const finderLike =
        window[0] && !window[1] && window[2] && window[3] && window[4] &&
        !window[5] && window[6];
      if (!finderLike) continue;

      const before = line.slice(Math.max(0, i - 4), i);
      const after = line.slice(i + 7, i + 11);
      const clearBefore = before.length === 4 && before.every((v) => !v);
      const clearAfter = after.length === 4 && after.every((v) => !v);
      if (clearBefore || clearAfter) score += 40;
    }
  };

  for (let i = 0; i < size; i += 1) {
    scoreLine(grid[i]);
    scoreLine(grid.map((row) => row[i]));
  }

  for (let r = 0; r + 1 < size; r += 1) {
    for (let c = 0; c + 1 < size; c += 1) {
      const first = grid[r][c];
      if (
        grid[r][c + 1] === first &&
        grid[r + 1][c] === first &&
        grid[r + 1][c + 1] === first
      ) {
        score += 3;
      }
    }
  }

  const dark = grid.reduce(
    (total, row) => total + row.filter(Boolean).length,
    0,
  );
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/** BCH(15,5) format information, masked with 0x5412 as the spec requires. */
function formatBits(mask: number): number {
  /* Level M is 0b00; the mask index occupies the low three bits. */
  const data = mask;
  let value = data << 10;

  for (let i = 4; i >= 0; i -= 1) {
    if ((value >> (10 + i)) & 1) value ^= 0x537 << i;
  }

  return ((data << 10) | value) ^ 0x5412;
}

/** BCH(18,6) version information, for versions 7 and up. */
function versionBits(version: number): number {
  let value = version << 12;

  for (let i = 5; i >= 0; i -= 1) {
    if ((value >> (12 + i)) & 1) value ^= 0x1f25 << i;
  }

  return (version << 12) | value;
}

function writeFormat(grid: boolean[][], mask: number) {
  const size = grid.length;
  const bits = formatBits(mask);

  const bit = (index: number) => ((bits >> index) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) {
    grid[8][i] = bit(i);
    grid[i][8] = bit(14 - i);
  }

  grid[8][7] = bit(6);
  grid[8][8] = bit(7);
  grid[7][8] = bit(8);

  for (let i = 9; i <= 14; i += 1) {
    grid[14 - i][8] = bit(i);
  }

  for (let i = 0; i <= 7; i += 1) {
    grid[8][size - 1 - i] = bit(i);
  }

  for (let i = 8; i <= 14; i += 1) {
    grid[size - 15 + i][8] = bit(i);
  }
}

function writeVersion(grid: boolean[][], version: number) {
  if (version < 7) return;

  const size = grid.length;
  const bits = versionBits(version);

  for (let i = 0; i < 18; i += 1) {
    const value = ((bits >> i) & 1) === 1;
    const row = Math.floor(i / 3);
    const col = size - 11 + (i % 3);
    grid[row][col] = value;
    grid[col][row] = value;
  }
}

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export interface QrMatrix {
  /** `size × size`, row-major. `true` is a dark module. */
  modules: boolean[][];
  size: number;
  version: number;
}

/**
 * Encodes `text` as a QR matrix, choosing the smallest version that fits.
 *
 * Throws rather than truncating when the text is too long. A truncated QR code
 * still scans — it just yields the wrong secret, and the merchant finds out
 * when a code they carefully typed in is rejected forever.
 */
export function encodeQr(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text);

  const version = VERSIONS.findIndex(
    (_, index) => bytes.length <= byteCapacity(index + 1),
  );
  if (version === -1) {
    throw new RangeError(
      `${bytes.length} bytes is past the ${byteCapacity(VERSIONS.length)}-byte limit of this encoder.`,
    );
  }

  const actual = version + 1;
  const size = 17 + actual * 4;
  const codewords = buildCodewords(bytes, actual);

  const base: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  placeFunctionPatterns(base, actual);
  const reserved = reservedMask(actual, size);
  placeData(base, codewords, reserved);

  /* Nothing is left unset after the walk; the assertion is the `?? false`. */
  const plain = base.map((row) => row.map((cell) => cell ?? false));

  let best: boolean[][] | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < MASKS.length; mask += 1) {
    const candidate = plain.map((row, r) =>
      row.map((cell, c) => (reserved[r][c] ? cell : cell !== MASKS[mask](r, c))),
    );

    writeFormat(candidate, mask);
    writeVersion(candidate, actual);

    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return { modules: best ?? plain, size, version: actual };
}
