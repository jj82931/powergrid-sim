type Props = {
  pv: number;
  setPv: (v: number) => void;
  bat: number;
  setBat: (v: number) => void;
  hour: number;
  setHour: (v: number) => void;
  onPreset: (name: string) => void;
};

export default function Controls({
  pv,
  setPv,
  bat,
  setBat,
  hour,
  setHour,
  onPreset,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 480 }}>
      <div>
        PV {pv.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={pv}
          onChange={(e) => setPv(parseFloat(e.target.value))}
        />
      </div>
      <div>
        BAT {bat.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={bat}
          onChange={(e) => setBat(parseFloat(e.target.value))}
        />
      </div>
      <div>
        Hour {hour}
        <input
          type="range"
          min={0}
          max={95}
          step={1}
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value))}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onPreset("morning")}>Preset Morning</button>
        <button onClick={() => onPreset("noon")}>Preset Noon</button>
        <button onClick={() => onPreset("evening")}>Preset Evening</button>
        <button onClick={() => onPreset("highpv")}>Preset High PV</button>
      </div>
    </div>
  );
}
