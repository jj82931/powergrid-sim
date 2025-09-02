from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from .data import list_feeders, load_network
from .sim import simulate, pv_sweep
from .cache import cache_get, cache_set

app = FastAPI(title="lv-mini-twin")

# CORS for Vite dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional static mount to serve raw JSON files too
app.mount("/networks", StaticFiles(directory="data/networks"), name="networks")

class SimIn(BaseModel):
    feeder_id: str
    pv_adoption: float = Field(ge=0.0, le=1.0)
    battery_adoption: float = Field(ge=0.0, le=1.0)
    hour: int = Field(ge=0, le=95)

@app.get("/feeders")
def feeders():
    return {"feeders": list_feeders()}

@app.post("/simulate")
def simulate_api(inp: SimIn):
    key = f"sim:{inp.feeder_id}:{inp.pv_adoption}:{inp.battery_adoption}:{inp.hour}"
    c = cache_get(key)
    if c:
        return c
    res = simulate(inp.feeder_id, inp.pv_adoption, inp.battery_adoption, inp.hour)
    cache_set(key, res)
    return res

class SweepIn(BaseModel):
    feeder_id: str
    hours: list[int]

@app.post("/sweep")
def sweep_api(inp: SweepIn):
    return pv_sweep(inp.feeder_id, inp.hours)

# network JSON API
@app.get("/net/{feeder_id}")
def get_network(feeder_id: str):
    return load_network(feeder_id)
