type Props = {
  result: any | null;
  scenario?: { feeder: string; pv: number; bat: number; hour: number };
};

export default function ResultsCard({ result, scenario }: Props) {
  if (!result) return null;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Results</h3>

      {scenario && (
        <div
          style={{
            margin: "6px 0 10px 0",
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          Scenario • Feeder <b>{scenario.feeder}</b> • PV{" "}
          {scenario.pv.toFixed(2)} • BAT {scenario.bat.toFixed(2)} • Hour{" "}
          {scenario.hour}
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Transformer loading</div>
          <div className="kpi-value">{result.transformer_loading}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Min voltage (p.u.)</div>
          <div className="kpi-value">{result.min_voltage_pu}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Voltage violation</div>
          <div className="kpi-value">{result.voltage_violation}</div>
        </div>
      </div>

      {result.advice && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "rgba(79,124,255,.10)",
          }}
        >
          <b>Advice:</b> {result.advice}
        </div>
      )}

      <details style={{ marginTop: 10 }}>
        <summary>Show raw JSON</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}
