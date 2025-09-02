from .rules import advice
from .data import list_feeders, load_network
from .sim import simulate, pv_sweep
from .cache import cache_get, cache_set
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


app = FastAPI(title="lv-mini-twin")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://powergrid-sim.vercel.app/",
    ]

# CORS for Vite dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app$",
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
        # 과거 캐시에 advice가 없던 버전 대비
        if "advice" not in c:
            c["advice"] = advice(c["transformer_loading"], c["min_voltage_pu"], c["voltage_violation"])
            cache_set(key, c)
        return c

    res = simulate(inp.feeder_id, inp.pv_adoption, inp.battery_adoption, inp.hour)
    # 여기서 반드시 advice를 붙인다
    res["advice"] = advice(res["transformer_loading"], res["min_voltage_pu"], res["voltage_violation"])
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


# 테스트 호환 별칭
@app.get("/network/{feeder_id}")
def get_network_alias(feeder_id: str):
    return load_network(feeder_id)
