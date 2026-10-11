/**
 * Pixel-art icons drawn from tiny text bitmaps. Each character is one pixel:
 *   #  current colour (ink)     o  gold      w  white      b  light blue
 *   r  red      g  green      y  yellow     .  transparent
 * Rendered as SVG squares with crisp edges, so they stay sharp at any size.
 */

const ART = {
  mic: [
    '....##....',
    '...####...',
    '...####...',
    '...####...',
    '.#.####.#.',
    '.#.####.#.',
    '.##.##.##.',
    '..######..',
    '....##....',
    '..######..',
  ],
  send: [
    '.....#....',
    '.....##...',
    '.....###..',
    '#########.',
    '##########',
    '#########.',
    '.....###..',
    '.....##...',
    '.....#....',
  ],
  repeat: [
    '...####.#.',
    '..#....##.',
    '.#....###.',
    '.#........',
    '.#........',
    '.#......#.',
    '.#......#.',
    '..#....#..',
    '...####...',
  ],
  undo: [
    '..#.......',
    '.##.......',
    '#######...',
    '.##....#..',
    '..#.....#.',
    '........#.',
    '........#.',
    '.......#..',
    '..#####...',
  ],
  cross: [
    '##......##',
    '###....###',
    '.###..###.',
    '..######..',
    '...####...',
    '...####...',
    '..######..',
    '.###..###.',
    '###....###',
    '##......##',
  ],
  check: [
    '.........#',
    '........##',
    '.......###',
    '#.....###.',
    '##...###..',
    '###.###...',
    '.#####....',
    '..###.....',
    '...#......',
  ],
  speaker: [
    '....#.....',
    '...##...#.',
    '#####.#..#',
    '#####..#.#',
    '#####..#.#',
    '#####.#..#',
    '...##...#.',
    '....#.....',
  ],
  hand: [
    '...#.#....',
    '.#.#.#.#..',
    '.#.#.#.#..',
    '.#.#.#.#.#',
    '.#######.#',
    '.########.',
    '.#######..',
    '..######..',
    '...####...',
  ],
  keyboard: [
    '##########',
    '#........#',
    '#.#.#.#.##',
    '#........#',
    '#.######.#',
    '#........#',
    '##########',
  ],
  warning: [
    '....##....',
    '...####...',
    '...#..#...',
    '..##..##..',
    '..##..##..',
    '.###..###.',
    '.########.',
    '####..####',
    '##########',
  ],
  play: [
    '##......',
    '####....',
    '######..',
    '########',
    '######..',
    '####....',
    '##......',
  ],
  coin: [
    '...####...',
    '..#oooo#..',
    '.#oowooo#.',
    '#oowoo#oo#',
    '#oowoo#oo#',
    '#oowoo#oo#',
    '#ooooo#oo#',
    '.#ooooooo#',
    '..#oooo#..',
    '...####...',
  ],
  coinEmpty: [
    '...####...',
    '..#....#..',
    '.#......#.',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '.#......#.',
    '..#....#..',
    '...####...',
  ],
  heart: [
    '.##...##.',
    '#rr#.#rr#',
    '#rwrrrrr#',
    '#rrrrrrr#',
    '.#rrrrr#.',
    '..#rrr#..',
    '...#r#...',
    '....#....',
  ],
  heartEmpty: [
    '.##...##.',
    '#..#.#..#',
    '#...#...#',
    '#.......#',
    '.#.....#.',
    '..#...#..',
    '...#.#...',
    '....#....',
  ],
  star: [
    '....#....',
    '...#y#...',
    '...#y#...',
    '####yy###',
    '#yyyyyyy#',
    '.#yyyyy#.',
    '.#yy#yy#.',
    '#yy#.#yy#',
    '###...###',
  ],
  starEmpty: [
    '....#....',
    '...#.#...',
    '...#.#...',
    '####.####',
    '#.......#',
    '.#.....#.',
    '.#..#..#.',
    '#..#.#..#',
    '###...###',
  ],
  skull: [
    '..#####..',
    '.#######.',
    '#########',
    '#..###..#',
    '#..###..#',
    '####.####',
    '.#######.',
    '.#.#.#.#.',
  ],
  zzz: [
    '.....#####',
    '........#.',
    '.......#..',
    '###...####',
    '..#.......',
    '.#........',
    '###.......',
  ],
  puzzle: [
    '....##....',
    '...####...',
    '##########',
    '##########',
    '.#########',
    '.#########',
    '##########',
    '##########',
    '##########',
  ],
  speakerBody: [
    '....#',
    '...##',
    '#####',
    '#####',
    '#####',
    '#####',
    '...##',
    '....#',
  ],
  arc: [
    '#.',
    '.#',
    '.#',
    '.#',
    '.#',
    '.#',
    '#.',
  ],
  cloud: [
    '..........#####..........',
    '........##wwwww##........',
    '.......#wwwwwwwww#.......',
    '...####wwwwwwwwwww#......',
    '..#wwwwwwwwwwwwwwww###...',
    '.#wwwwwwwwwwwwwwwwwwww#..',
    '#wwwwbwwwwwwwbwwwwwwwww#.',
    '#wwwbbbwwwwwbbbwwwwbwwww#',
    '.#bbbbbbbbbbbbbbbbbbbbb#.',
    '..#####################..',
  ],
} as const

export type PixelIconName = keyof typeof ART

const PALETTE: Record<string, string> = {
  o: '#ffc21a',
  w: '#ffffff',
  b: '#b9e3ff',
  r: '#e8433a',
  g: '#61c98b',
  y: '#ffd84d',
}

interface PixelIconProps {
  name: PixelIconName
  /** Height in CSS pixels. */
  size?: number
  className?: string
  /** Accessible name; omit for decorative icons. */
  label?: string
}

export function PixelIcon({ name, size = 24, className = '', label }: PixelIconProps) {
  const rows = ART[name]
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const rects = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch === '.') continue
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={ch === '#' ? 'currentColor' : PALETTE[ch]} />)
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      height={size}
      width={(size * w) / h}
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rects}
    </svg>
  )
}
