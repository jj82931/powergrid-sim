// frontend/src/services/api.ts
export type Bus = { id: string; x: number; y: number };
export type Line = { from: string; to: string };
export type Network = { buses: Bus[]; lines: Line[] };

const BASE =
  ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(
    /\/$/,
    ""
  ) || "http://127.0.0.1:8000";

async function parseJson(r: Response) {
  const text = await r.text();
  if (!r.ok)
    throw new Error(`HTTP ${r.status} ${r.statusText}: ${text.slice(0, 200)}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json"))
    throw new Error(`Expected JSON, got ${ct}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export async function getFeeders(): Promise<{ feeders: string[] }> {
  const r = await fetch(`${BASE}/feeders`);
  return parseJson(r);
}

export async function postSim(body: {
  feeder_id: string;
  pv_adoption: number;
  battery_adoption: number;
  hour: number;
}): Promise<any> {
  const r = await fetch(`${BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function postSweep(body: {
  feeder_id: string;
  hours: number[];
}): Promise<{
  feeder_id: string;
  hours: number[];
  points: { pv: number; violations: number }[];
  hosting_capacity: number;
}> {
  const r = await fetch(`${BASE}/sweep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function getNetwork(id: string): Promise<Network> {
  const r = await fetch(`${BASE}/net/${id}`);
  return parseJson(r);
}
