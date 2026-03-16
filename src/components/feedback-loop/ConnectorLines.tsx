'use client'

export default function ConnectorLines({ panelOpen }: { panelOpen: boolean }) {
  if (!panelOpen) return null

  const dotX   = 452
  const arrowX = 514
  const arrowY = 180

  const origins = [66, 186, 306]

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 560,
        height: 400,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {origins.map((y, i) => (
        <path
          key={i}
          d={`M ${dotX} ${y} C ${dotX + 40} ${y}, ${arrowX - 40} ${arrowY}, ${arrowX} ${arrowY}`}
          fill="none"
          stroke="#a0c4cc"
          strokeWidth={1.5}
          opacity={0.75}
        />
      ))}
      <polygon
        points={`${arrowX + 2},${arrowY} ${arrowX - 9},${arrowY - 6} ${arrowX - 9},${arrowY + 6}`}
        fill="#1e2d3d"
      />
    </svg>
  )
}