export default function GrainOverlay() {
  const svgUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{
        zIndex: 9990,
        backgroundImage: svgUri,
        backgroundSize: '200px 200px',
        opacity: 0.045,
        animation: 'grain-shift 4s steps(6) infinite',
        mixBlendMode: 'overlay',
      }}
      aria-hidden="true"
    />
  )
}
