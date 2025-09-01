import { useEffect, useState } from "react";
import FeederSelector from "./components/FeederSelector";
import Controls from "./components/Controls";
import ResultsCard from "./components/ResultsCard";
import { getFeeders, postSim } from "./services/api";
import CompareTab from "./components/CompareTab";
import SweepChart from "./components/SweepChart";
import SvgLineView from "./components/SvgLineView";
import MapView from "./components/MapView";
import { toCSV, downloadCSV } from "./utils/csv";

export default function App() {
  const [feeders, setFeeders] = useState<string[]>([]);
  const [feeder, setFeeder] = useState("");
  const [pv, setPv] = useState(0);
  const [bat, setBat] = useState(0);
  const [hour, setHour] = useState(12);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"run" | "compare" | "sweep" | "network">(
    "run"
  );
  const [hours, setHours] = useState<number[]>([28, 48, 74]); // 기본 3개 시점

  useEffect(() => {
    getFeeders()
      .then((d) => {
        setFeeders(d.feeders || []);
        if (d.feeders?.length) setFeeder(d.feeders[0]);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  // 최초 1회 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem("scenario");
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.feeder === "string") setFeeder(s.feeder);
        if (typeof s.pv === "number") setPv(s.pv);
        if (typeof s.bat === "number") setBat(s.bat);
        if (typeof s.hour === "number") setHour(s.hour);
      }
    } catch (_e) {}
  }, []);

  // 변경시 저장 - 아주 단순하게 저장
  useEffect(() => {
    const s = { feeder, pv, bat, hour };
    localStorage.setItem("scenario", JSON.stringify(s));
  }, [feeder, pv, bat, hour]);

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

  const exportRunCSV = () => {
    if (!res) return;
    const row = {
      feeder_id: res.feeder_id,
      hour: res.hour,
      pv_adoption: pv,
      battery_adoption: bat,
      transformer_loading: res.transformer_loading,
      min_voltage_pu: res.min_voltage_pu,
      voltage_violation: res.voltage_violation,
      advice: res.advice || "",
    };
    const csv = toCSV([row]);
    downloadCSV(`run_${res.feeder_id}_${res.hour}.csv`, csv);
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>LV Mini Twin</h1>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button
          onClick={() => setTab("run")}
          disabled={tab === "run"}
          aria-current={tab === "run" ? "page" : undefined}
          style={{ fontWeight: tab === "run" ? "bold" : "normal" }}
          title="Switch to Run tab"
        >
          Run
        </button>
        <button
          onClick={() => setTab("compare")}
          disabled={tab === "compare"}
          aria-current={tab === "compare" ? "page" : undefined}
          style={{ fontWeight: tab === "compare" ? "bold" : "normal" }}
        >
          Compare
        </button>
        <button
          onClick={() => setTab("sweep")}
          disabled={tab === "sweep"}
          aria-current={tab === "sweep" ? "page" : undefined}
          style={{ fontWeight: tab === "sweep" ? "bold" : "normal" }}
        >
          PV Sweep
        </button>
        <button
          onClick={() => setTab("network")}
          disabled={tab === "network"}
          aria-current={tab === "network" ? "page" : undefined}
          style={{ fontWeight: tab === "network" ? "bold" : "normal" }}
        >
          Network
        </button>
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

      {tab === "run" && (
        <>
          <button
            data-testid="run-sim"
            aria-label="Run simulation"
            onClick={run}
            disabled={!feeder || loading}
          >
            {loading ? "Running..." : "Run simulation"}
          </button>

          {/* 내보내기와 인쇄 */}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={exportRunCSV} disabled={!res}>
              Export CSV
            </button>
            <button onClick={() => window.print()} disabled={!res}>
              Print summary
            </button>
          </div>

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

      {tab === "network" && (
        <>
          <SvgLineView feeder={feeder} />
          <MapView feeder={feeder} />
        </>
      )}
    </div>
  );
}
