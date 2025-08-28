import { useEffect, useRef, useState } from "react";
import { postSweep } from "../services/api";

type Props = { feeder: string; hours: number[] };

export default function SweepChart({ feeder, hours }: Props) {
  const [host, setHost] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const run = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await postSweep({ feeder_id: feeder, hours });
      draw(data.points);
      setHost(data.hosting_capacity);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const draw = (pts: { pv: number; violations: number }[]) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const W = c.width,
      H = c.height;
    ctx.clearRect(0, 0, W, H);

    // axes
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, H - 30);
    ctx.lineTo(W - 10, H - 30);
    ctx.stroke();

    const maxV = Math.max(...pts.map((p) => p.violations), 1);
    const toX = (pv: number) => 40 + pv * (W - 60);
    const toY = (viol: number) => H - 30 - (viol / maxV) * (H - 50);

    // line
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = toX(p.pv);
      const y = toY(p.violations);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // all zero이면 마커 표시 + 안내
    const allZero = pts.every((p) => p.violations === 0);
    if (allZero) {
      pts.forEach((p) => {
        const x = toX(p.pv);
        const y = toY(0);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillText("No violations across sweep", 50, 22);
    }

    // labels
    ctx.fillText("PV adoption", W / 2 - 20, H - 10);
    ctx.fillText("violations", 5, 20);
  };

  useEffect(() => {
    setHost(null); /* reset when feeder or hours change */
  }, [feeder, hours.join(",")]);

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={run} disabled={loading}>
        {loading ? "Running..." : "Run PV Sweep"}
      </button>
      {err && <div style={{ color: "crimson" }}>Error: {err}</div>}
      <div style={{ marginTop: 8 }}>
        Feeder: <b>{feeder}</b> Hours: {hours.join(", ")}
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={240}
        style={{ border: "1px solid #ddd", marginTop: 8 }}
      />
      {host !== null && (
        <div style={{ marginTop: 8 }}>
          Hosting capacity: <b>{host.toFixed(2)}</b>
        </div>
      )}
    </div>
  );
}
