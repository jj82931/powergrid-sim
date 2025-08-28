import { useEffect, useState } from "react";
import { getNetwork, Network } from "../services/api";

type Props = { feeder: string };

export default function MapView({ feeder }: Props) {
  const [net, setNet] = useState<Network | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getNetwork(feeder)
      .then((n) => {
        if (alive) setNet(n);
      })
      .catch((e) => setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [feeder]);

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!net) return <div>Loading map...</div>;

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

  return (
    <div style={{ marginTop: 12 }}>
      <h3>Simple Map View</h3>
      <svg
        width={W}
        height={H}
        style={{ border: "1px solid #ddd", background: "#f8f8f8" }}
      >
        {net.buses.map((b) => (
          <circle key={b.id} cx={sx(b.x)} cy={sy(b.y)} r={4} fill="#2b8a3e" />
        ))}
      </svg>
    </div>
  );
}
