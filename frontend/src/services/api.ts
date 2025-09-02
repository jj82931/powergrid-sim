const BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

async function parseJson(r: Response) {
  const text = await r.text(); // 먼저 텍스트로 읽음
  if (!r.ok)
    throw new Error(`HTTP ${r.status} ${r.statusText}: ${text.slice(0, 200)}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json"))
    throw new Error(`Expected JSON, got ${ct}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export async function getFeeders() {
  const r = await fetch(`${BASE}/feeders`);
  return parseJson(r);
}

export async function postSim(body: any) {
  const r = await fetch(`${BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function postSweep(body: any) {
  const r = await fetch(`${BASE}/sweep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function getNetwork(id: string) {
  const r = await fetch(`${BASE}/net/${id}`);
  return parseJson(r);
}
