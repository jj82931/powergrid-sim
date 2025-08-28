import { useState } from "react";
import { postSim } from "../services/api";

type Props = {
  feeders: string[];
  pv: number;
  bat: number;
  hour: number;
};

type Row = {
  feeder_id: string;
  transformer_loading: number;
  min_voltage_pu: number;
  voltage_violation: number;
};

export default function CompareTab({ feeders, pv, bat, hour }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const runCompare = async () => {
    setErr(null);
    setLoading(true);
    try {
      const calls = feeders.map((f) =>
        postSim({ feeder_id: f, pv_adoption: pv, battery_adoption: bat, hour })
      );
      const out = await Promise.all(calls);
      setRows(
        out.map((o) => ({
          feeder_id: o.feeder_id,
          transformer_loading: o.transformer_loading,
          min_voltage_pu: o.min_voltage_pu,
          voltage_violation: o.voltage_violation,
        }))
      );
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={runCompare} disabled={loading}>
        {loading ? "Running..." : "Run Compare"}
      </button>
      {err && <div style={{ color: "crimson" }}>Error: {err}</div>}
      {rows.length > 0 && (
        <table
          style={{ marginTop: 12, borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Feeder</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Tx load</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Vmin pu</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>
                Violation
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feeder_id}>
                <td style={{ border: "1px solid #ddd", padding: 6 }}>
                  {r.feeder_id}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 6 }}>
                  {r.transformer_loading}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 6 }}>
                  {r.min_voltage_pu}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 6 }}>
                  {r.voltage_violation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
