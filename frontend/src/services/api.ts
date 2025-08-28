export type SimInput = {
  feeder_id: string;
  pv_adoption: number;
  battery_adoption: number;
  hour: number;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getFeeders(): Promise<{ feeders: string[] }> {
  const r = await fetch(`${API_BASE}/feeders`);
  if (!r.ok) throw new Error("failed to fetch feeders");
  return r.json();
}

export async function postSim(body: SimInput): Promise<any> {
  const r = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("failed to run simulate");
  return r.json();
}

export async function postSweep(body: {
  feeder_id: string;
  hours: number[];
}): Promise<{
  points: { pv: number; violations: number }[];
  hosting_capacity: number;
}> {
  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const r = await fetch(`${API_BASE}/sweep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("failed to run sweep");
  return r.json();
}
