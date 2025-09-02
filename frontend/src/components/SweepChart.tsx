import { useEffect, useRef, useState } from "react";
import { postSweep } from "../services/api";

type Point = { pv: number; violations: number };

type Props = {
  feeder: string;
  hours: number[];
};

export default function SweepChart({ feeder, hours }: Props) {
  const [points, setPoints] = useState<Point[]>([]);
  const [hc, setHc] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // API 호출
  const run = async () => {
    setErr(null);
    setLoading(true);
    try {
      const url = (import.meta as any).env?.VITE_API_URL || "";
      const r = await fetch(url + "/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeder_id: feeder, hours }),
      });
      const js = await postSweep({ feeder_id: feeder, hours });
      const pts: Point[] = (js.points || []).map((p: any) => ({
        pv: Number(p.pv),
        violations: Number(p.violations),
      }));
      setPoints(pts);
      setHc(Number(js.hosting_capacity ?? 0));
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  // 캔버스 렌더
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI
    const cssW = canvas.clientWidth || 720;
    const cssH = canvas.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW;
    const h = cssH;

    // 테마 색
    const css = getComputedStyle(document.documentElement);
    const AXIS = (css.getPropertyValue("--muted") || "#9aa3b2").trim();
    const LINE = (css.getPropertyValue("--accent") || "#22d3ee").trim();

    // 배경 지우기
    ctx.clearRect(0, 0, w, h);

    // 축
    ctx.strokeStyle = AXIS;
    ctx.fillStyle = AXIS;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, h - 30);
    ctx.lineTo(w - 12, h - 30); // x
    ctx.moveTo(40, 18);
    ctx.lineTo(40, h - 30); // y
    ctx.stroke();
    ctx.font = "12px system-ui";
    ctx.fillText("violations", 10, 14);
    ctx.fillText("PV adoption", w / 2 - 40, h - 8);

    if (!points.length) return;

    // 데이터 범위
    const maxViol = Math.max(1, ...points.map((p) => p.violations));

    // 라인
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = 40 + p.pv * (w - 60);
      const y = h - 30 - (p.violations / maxViol) * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 포인트
    ctx.fillStyle = LINE;
    points.forEach((p) => {
      const x = 40 + p.pv * (w - 60);
      const y = h - 30 - (p.violations / maxViol) * (h - 60);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points]);

  return (
    <div className="card">
      <div className="row inline">
        <label>Hours CSV</label>
        {/* App에서 문자열을 파싱해 hours 상태를 갱신하므로 여기선 표시만 */}
        <input
          style={{ opacity: 0.85 }}
          defaultValue={hours.join(",")}
          readOnly
          title="Edit in parent control"
        />
      </div>

      <div className="tabs" style={{ marginTop: 8 }}>
        <button className="btn" onClick={run} disabled={loading || !feeder}>
          {loading ? "Running..." : "Run PV Sweep"}
        </button>
      </div>

      <div style={{ margin: "6px 0 10px 0" }}>
        Feeder: <b>{feeder}</b> Hours: {hours.join(", ")}
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 6,
        }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: 260 }} />
      </div>

      <div style={{ marginTop: 10 }}>
        <b>Hosting capacity: {hc.toFixed(2)}</b>
      </div>

      {err && <div style={{ color: "tomato", marginTop: 8 }}>Error: {err}</div>}
    </div>
  );
}
