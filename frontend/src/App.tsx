// frontend/src/App.tsx
import { useEffect, useState } from "react";
import FeederSelector from "./components/FeederSelector";
import Controls from "./components/Controls";
import ResultsCard from "./components/ResultsCard";
import CompareTab from "./components/CompareTab";
import SweepChart from "./components/SweepChart";
import SvgLineView from "./components/SvgLineView";
import MapView from "./components/MapView";
import { getFeeders, postSim } from "./services/api";

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
  const [hours, setHours] = useState<number[]>([28, 48, 74]);

  useEffect(() => {
    getFeeders()
      .then((d) => {
        setFeeders(d.feeders || []);
        if (d.feeders?.length) setFeeder(d.feeders[0]);
      })
      .catch((e) => setErr(String(e)));
  }, []);

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
    <div className="app">
      <div className="hero">
        <h1 className="brand">LV Mini Twin</h1>
        <p className="subtitle">Quick scenario KPIs for synthetic LV feeders</p>
      </div>
      {/* How to use - quick guide for reviewers */}
      <details className="card" style={{ marginTop: 8 }}>
        <summary>
          <b>How to use</b>
        </summary>
        <div style={{ marginTop: 8, lineHeight: 1.5 }}>
          <ol style={{ margin: "0 0 8px 16px" }}>
            <li>Select a feeder, then adjust PV, BAT, and Hour sliders.</li>
            <li>
              Click <b>Run simulation</b> to compute KPIs for the current
              scenario.
            </li>
            <li>
              Open <b>Compare</b> to run the same scenario across multiple
              feeders and view a table.
            </li>
            <li>
              Open <b>PV Sweep</b> to sweep PV adoption from 0.0 to 1.0 at
              selected hours and see violations and hosting capacity.
            </li>
            <li>
              Open <b>Network</b> to view a simple SVG line diagram and a basic
              map of bus locations.
            </li>
          </ol>

          <div>
            <b>KPI definitions</b>
            <br />
            <b>Transformer loading</b>: Approximate transformer load ratio. 1.0
            means around nameplate level.
            <br />
            <b>Min voltage p.u.</b>: Minimum per-unit voltage across all buses.
            Below 0.94 indicates undervoltage risk.
            <br />
            <b>Voltage violation</b>: 0 means no violation, 1 means under or
            over voltage detected.
          </div>

          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            Note: This is a synthetic, student-level demo. Guidance is rule
            based only. No automatic design proposals, no paid APIs, offline
            friendly by default.
          </div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            Tip: For a stress case, try feeder_11. It has a long thin line with
            higher impedance, so undervoltage is more likely.
          </div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            Tip: Use feeder_11 and hours 28,74. It starts with undervoltage at
            low PV and stabilizes as PV adoption increases.
          </div>
        </div>
      </details>
      {/* 탭 바 */}
      <div className="tabs">
        <button
          className="tab"
          onClick={() => setTab("run")}
          disabled={tab === "run"}
          aria-current={tab === "run" ? "page" : undefined}
        >
          Run
        </button>
        <button
          className="tab"
          onClick={() => setTab("compare")}
          disabled={tab === "compare"}
          aria-current={tab === "compare" ? "page" : undefined}
        >
          Compare
        </button>
        <button
          className="tab"
          onClick={() => setTab("sweep")}
          disabled={tab === "sweep"}
          aria-current={tab === "sweep" ? "page" : undefined}
        >
          PV Sweep
        </button>
        <button
          className="tab"
          onClick={() => setTab("network")}
          disabled={tab === "network"}
          aria-current={tab === "network" ? "page" : undefined}
        >
          Network
        </button>
      </div>
      {err && <div style={{ color: "crimson" }}>Error: {err}</div>}
      {/* 공통 컨트롤 패널 */}
      <div className="panel card">
        <div className="row inline">
          <label>Feeder</label>
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

        {/* 프리셋 버튼 묶음이 Controls 안에 없다면 여기 추가 */}
        {/* <div className="presetbar">...</div> */}
      </div>
      {/* 탭별 뷰 */}
      {/* Run 탭 실행 버튼 */}
      {tab === "run" && (
        <div className="card">
          <div className="tabs" style={{ marginTop: 0 }}>
            <button
              data-testid="run-sim"
              aria-label="Run simulation"
              className="btn primary"
              onClick={run}
              disabled={!feeder || loading}
            >
              {loading ? "Running..." : "Run simulation"}
            </button>
          </div>
          <ResultsCard result={res} scenario={{ feeder, pv, bat, hour }} />
        </div>
      )}
      {tab === "compare" && (
        <div className="card">
          <CompareTab feeders={feeders} pv={pv} bat={bat} hour={hour} />
        </div>
      )}
      {tab === "sweep" && (
        <div className="card">
          <div className="row inline">
            <label>Hours CSV</label>
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
              type="text"
            />
          </div>
          <SweepChart feeder={feeder} hours={hours} />
        </div>
      )}
      {tab === "network" && (
        <div className="card">
          <SvgLineView feeder={feeder} />
          <MapView feeder={feeder} />
        </div>
      )}
    </div>
  );
}
