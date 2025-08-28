import { useEffect, useState } from "react";
import { getNetwork, Network } from "../services/api";

type Props = { feeder: string; network?: Network };

export default function SvgLineView({ feeder, network: netProp }: Props) {
  const [net, setNet] = useState<Network | null>(netProp || null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!netProp && feeder) {
      getNetwork(feeder)
        .then((n) => {
          if (alive) setNet(n);
        })
        .catch((e) => setErr(String(e)));
    } else {
      setNet(netProp || null);
    }
    return () => {
      alive = false;
    };
  }, [feeder, netProp]);

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!net) return <div>Loading network...</div>;

  const xs = net.buses.map((b) => b.x);
  const ys = net.buses.map((b) => b.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const pad = 10;
  const W = 500,
    H = 300;
  const sx = (x: number) =>
    pad + (x - minX) * ((W - 2 * pad) / Math.max(1, maxX - minX));
  const sy = (y: number) =>
    H - pad - (y - minY) * ((H - 2 * pad) / Math.max(1, maxY - minY));

  const busIndex = new Map(net.buses.map((b, i) => [b.id, i]));

  return (
    <div style={{ marginTop: 12 }}>
      <h3>SVG Line View</h3>
      <svg
        width={W}
        height={H}
        style={{ border: "1px solid #ddd", background: "#fff" }}
      >
        {/* lines */}
        {net.lines.map((ln, i) => {
          const fi = busIndex.get(ln.from) ?? 0;
          const ti = busIndex.get(ln.to) ?? 0;
          const fb = net.buses[fi],
            tb = net.buses[ti];
          return (
            <line
              key={i}
              x1={sx(fb.x)}
              y1={sy(fb.y)}
              x2={sx(tb.x)}
              y2={sy(tb.y)}
              stroke="#444"
              strokeWidth={1.5}
            />
          );
        })}
        {/* buses */}
        {net.buses.map((b, i) => (
          <g key={b.id}>
            <circle cx={sx(b.x)} cy={sy(b.y)} r={3} fill="#0a84ff" />
            {i % 5 === 0 && (
              <text x={sx(b.x) + 5} y={sy(b.y) - 5} fontSize="10">
                {b.id}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
