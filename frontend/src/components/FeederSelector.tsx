type Props = {
  feeders: string[];
  value: string;
  onChange: (v: string) => void;
};
export default function FeederSelector({ feeders, value, onChange }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {feeders.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}
