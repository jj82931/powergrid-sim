import { useEffect, useMemo, useState } from "react";
import { getNetwork, type Network } from "../services/api";

type Props = { feeder: string; network?: Network };

export default function SvgLineView({ feeder, network }: Props) {
  const [net, setNet] = useState<Network | null>(network ?? null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (network) {
      setNet(network);
      setErr(null);
      return;
    }
    let alive = true;
    setNet(null);
    setErr(null);
    getNetwork(feeder)
      .then((n) => {
        if (alive) setNet(n);
      })
      .catch((e) => {
        if (alive) setErr(String(e));
      });
    return () => {
      alive = false;
    };
  }, [feeder, network]);

  const view = useMemo(() => {
    if (!net) return null;

    const buses = net.buses;
    const lines = net.lines;

    const W = 680,
      H = 300,
      pad = 20;

    const xs = buses.map((b) => b.x);
    const ys = buses.map((b) => b.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);

    const spanX = Math.max(1e-6, maxX - minX);
    let spanY = maxY - minY;
    const yFlat = Math.abs(spanY) < 1e-6;
    if (yFlat) spanY = 1;

    const sx = (W - 2 * pad) / spanX;
    const sy = (H - 2 * pad) / spanY;

    const mapX = (x: number) => pad + (x - minX) * sx;
    const mapY = (y: number) => (yFlat ? H / 2 : H - pad - (y - minY) * sy);

    const css = getComputedStyle(document.documentElement);
    const STROKE = (css.getPropertyValue("--accent") || "#22d3ee").trim();
    const NODE = (css.getPropertyValue("--primary") || "#4f7cff").trim();
    const MUTED = (css.getPropertyValue("--muted") || "#9aa3b2").trim();

    const lineElems = lines.map((ln, idx) => {
      const f = buses.find((b) => b.id === ln.from)!;
      const t = buses.find((b) => b.id === ln.to)!;
      return (
        <line
          key={`l-${idx}`}
          x1={mapX(f.x)}
          y1={mapY(f.y)}
          x2={mapX(t.x)}
          y2={mapY(t.y)}
          stroke={STROKE}
          strokeWidth={2}
          strokeLinecap="round"
          strokeOpacity={0.9}
        />
      );
    });

    const labelEvery = Math.max(1, Math.ceil(buses.length / 10));
    const nodeElems = buses.map((b, i) => (
      <g key={b.id}>
        <circle cx={mapX(b.x)} cy={mapY(b.y)} r={3.2} fill={NODE} />
        {i % labelEvery === 0 && (
          <text
            x={mapX(b.x)}
            y={mapY(b.y) + 12}
            fontSize={10}
            textAnchor="middle"
            fill={MUTED}
          >
            {b.id}
          </text>
        )}
      </g>
    ));

    return (
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          background: "rgba(255,255,255,.02)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        {lineElems}
        {nodeElems}
      </svg>
    );
  }, [net]);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>SVG Line View</h3>
      {!net && !err && <div style={{ color: "var(--muted)" }}>Loading...</div>}
      {err && <div style={{ color: "tomato" }}>Error: {err}</div>}
      {view}
    </div>
  );
}
