type Props = { result: any | null };

export default function ResultsCard({ result }: Props) {
  if (!result) return null;
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h3>Results</h3>
      <div>Transformer loading: {result.transformer_loading}</div>
      <div>Min voltage (p.u.): {result.min_voltage_pu}</div>
      <div>Voltage violation: {result.voltage_violation}</div>
      {result.advice && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#f5f7ff",
            border: "1px solid #dfe3ff",
            borderRadius: 6,
          }}
        >
          <b>Advice:</b> {result.advice}
        </div>
      )}
      <pre style={{ background: "#f7f7f7", padding: 8 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
