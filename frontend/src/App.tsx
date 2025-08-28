import { useEffect, useState } from "react";
import FeederSelector from "./components/FeederSelector";
import Controls from "./components/Controls";
import ResultsCard from "./components/ResultsCard";
import { getFeeders, postSim } from "./services/api";
import CompareTab from "./components/CompareTab";
import SweepChart from "./components/SweepChart";

export default function App() {
  const [feeders, setFeeders] = useState<string[]>([]);
  const [feeder, setFeeder] = useState("");
  const [pv, setPv] = useState(0);
  const [bat, setBat] = useState(0);
  const [hour, setHour] = useState(12);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"run" | "compare" | "sweep">("run");
  const [hours, setHours] = useState<number[]>([28, 48, 74]); // 기본 3개 시점

  useEffect(() => {
    getFeeders()
      .then((d) => {
        setFeeders(d.feeders || []);
        if (d.feeders?.length) setFeeder(d.feeders[0]);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const onPreset = (name: string) => {
    if (name === "morning") {
      setHour(28);
      setPv(0.2);
      setBat(0.1);
    }
    if (name === "noon") {
      setHour(48);
      setPv(0.6);
      setBat(0.1);
    }
    if (name === "evening") {
      setHour(74);
      setPv(0.1);
      setBat(0.2);
    }
    if (name === "highpv") {
      setHour(48);
      setPv(0.9);
      setBat(0.0);
    }
  };

  const run = async () => {
    setErr(null);
    setLoading(true);
    try {
      const out = await postSim({
        feeder_id: feeder,
        pv_adoption: pv,
        battery_adoption: bat,
        hour,
      });
      setRes(out);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>LV Mini Twin</h1>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button onClick={() => setTab("run")}>Run</button>
        <button onClick={() => setTab("compare")}>Compare</button>
        <button onClick={() => setTab("sweep")}>PV Sweep</button>
      </div>

      {err && <div style={{ color: "crimson" }}>Error: {err}</div>}

      {/* 공통 컨트롤 */}
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <div>
          <label>Feeder </label>
          <FeederSelector
            feeders={feeders}
            value={feeder}
            onChange={setFeeder}
          />
        </div>
        <Controls
          pv={pv}
          setPv={setPv}
          bat={bat}
          setBat={setBat}
          hour={hour}
          setHour={setHour}
          onPreset={(name) => {
            if (name === "morning") {
              setHour(28);
              setPv(0.2);
              setBat(0.1);
            }
            if (name === "noon") {
              setHour(48);
              setPv(0.6);
              setBat(0.1);
            }
            if (name === "evening") {
              setHour(74);
              setPv(0.1);
              setBat(0.2);
            }
            if (name === "highpv") {
              setHour(48);
              setPv(0.9);
              setBat(0.0);
            }
          }}
        />
      </div>

      {/* 탭별 뷰 */}
      {tab === "run" && (
        <>
          <button onClick={run} disabled={!feeder || loading}>
            {loading ? "Running..." : "Run"}
          </button>
          <ResultsCard result={res} />
        </>
      )}

      {tab === "compare" && (
        <CompareTab feeders={feeders} pv={pv} bat={bat} hour={hour} />
      )}

      {tab === "sweep" && (
        <>
          <div style={{ marginTop: 8 }}>
            <label>Hours CSV </label>
            <input
              placeholder="e.g. 28,48,74"
              defaultValue={hours.join(",")}
              onBlur={(e) => {
                const nums = e.target.value
                  .split(",")
                  .map((s) => parseInt(s.trim()))
                  .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 95);
                if (nums.length) setHours(nums);
              }}
            />
          </div>
          <SweepChart feeder={feeder} hours={hours} />
        </>
      )}
    </div>
  );
}
