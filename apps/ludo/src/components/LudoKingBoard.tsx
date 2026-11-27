import React, { useMemo } from 'react';
import {
  COLOR_START_OFFSETS,
  HOME_RUN_COORDINATES,
  SAFE_TRACK_INDICES,
  TRACK_COORDINATES,
} from '../utils/ludoConstants';

/**
 * The classic cross board, drawn on the same 15 x 15 grid the token engine uses
 * (see TRACK_COORDINATES, HOME_RUN_COORDINATES, YARD_SLOT_COORDINATES).
 * Pure artwork: tokens are positioned by GameBoard on top of it, so board and
 * piece logic can never drift apart.
 */

const PATH = '#FFFFFF';
const EDGE = '#DCD5C6';
const COLORS = {
  red: '#E8364F',
  blue: '#2F80ED',
  yellow: '#F7B500',
  green: '#27AE60',
} as const;
type Color = keyof typeof COLORS;

// Top-left cell of each corner yard. Red is top-left, blue top-right, yellow bottom-right, green bottom-left.
const YARD_ORIGIN: Record<Color, { x: number; y: number }> = {
  red: { x: 0, y: 0 },
  blue: { x: 9, y: 0 },
  yellow: { x: 9, y: 9 },
  green: { x: 0, y: 9 },
};

// Centre triangles: each one points at the middle and sits against its own arm.
const CENTRE_TRIANGLES: Array<{ color: Color; points: string }> = [
  { color: 'red', points: '6,6 6,9 7.5,7.5' },
  { color: 'blue', points: '6,6 9,6 7.5,7.5' },
  { color: 'yellow', points: '9,6 9,9 7.5,7.5' },
  { color: 'green', points: '6,9 9,9 7.5,7.5' },
];

const starPoints = (cx: number, cy: number, outer = 0.36, inner = 0.155): string => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(3)},${(cy + radius * Math.sin(angle)).toFixed(3)}`);
  }
  return pts.join(' ');
};

const inCross = (r: number, c: number) => (r >= 6 && r <= 8) || (c >= 6 && c <= 8);

export const LudoKingBoard: React.FC = () => {
  const startCells = useMemo(() => {
    const map = new Map<string, Color>();
    (Object.keys(COLOR_START_OFFSETS) as Color[]).forEach((color) => {
      const cell = TRACK_COORDINATES[COLOR_START_OFFSETS[color]];
      map.set(`${cell.r}_${cell.c}`, color);
    });
    return map;
  }, []);

  const laneCells = useMemo(() => {
    const map = new Map<string, Color>();
    (Object.keys(HOME_RUN_COORDINATES) as Color[]).forEach((color) => {
      HOME_RUN_COORDINATES[color].forEach((cell) => map.set(`${cell.r}_${cell.c}`, color));
    });
    return map;
  }, []);

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (!inCross(r, c)) continue;
      const key = `${r}_${c}`;
      const color = startCells.get(key) ?? laneCells.get(key);
      cells.push(
        <rect
          key={key}
          x={c}
          y={r}
          width={1}
          height={1}
          fill={color ? COLORS[color] : PATH}
          stroke={EDGE}
          strokeWidth={0.04}
        />,
      );
    }
  }

  const stars = [...SAFE_TRACK_INDICES]
    .filter((idx) => !Object.values(COLOR_START_OFFSETS).includes(idx))
    .map((idx) => {
      const cell = TRACK_COORDINATES[idx];
      return <polygon key={`star-${idx}`} points={starPoints(cell.c + 0.5, cell.r + 0.5)} fill={COLORS.yellow} stroke="#B98200" strokeWidth={0.03} />;
    });

  const yards = (Object.keys(YARD_ORIGIN) as Color[]).map((color) => {
    const { x, y } = YARD_ORIGIN[color];
    const slots = [
      [x + 1.9, y + 1.9],
      [x + 4.1, y + 1.9],
      [x + 1.9, y + 4.1],
      [x + 4.1, y + 4.1],
    ];
    return (
      <g key={`yard-${color}`}>
        <rect x={x} y={y} width={6} height={6} rx={0.45} fill={COLORS[color]} />
        <rect x={x + 0.9} y={y + 0.9} width={4.2} height={4.2} rx={0.7} fill={PATH} />
        {slots.map(([sx, sy]) => (
          <circle key={`${color}-${sx}-${sy}`} cx={sx} cy={sy} r={0.42} fill={COLORS[color]} opacity={0.16} />
        ))}
      </g>
    );
  });

  return (
    <svg viewBox="0 0 15 15" className="w-full h-full block" role="img" aria-label="Ludo board" shapeRendering="geometricPrecision">
      <rect x={0} y={0} width={15} height={15} rx={0.6} fill={PATH} />
      {cells}
      {CENTRE_TRIANGLES.map((t) => (
        <polygon key={`centre-${t.color}`} points={t.points} fill={COLORS[t.color]} />
      ))}
      <polygon points="7.5,7.5 6.6,7.5 7.5,6.6 8.4,7.5 7.5,8.4" fill="#FFFFFF" opacity={0.9} />
      {stars}
      {yards}
    </svg>
  );
};
