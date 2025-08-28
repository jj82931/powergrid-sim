from fastapi import FastAPI, Request
from pydantic import BaseModel, Field
import time, logging
from .data import list_feeders
from .sim import simulate, pv_sweep
from .cache import cache_get, cache_set
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("api")

app = FastAPI(title="lv-mini-twin")

@app.middleware("http")
async def log_timing(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    dt_ms = round((time.perf_counter() - t0) * 1000, 2)
    logger.info({"path": request.url.path, "status": response.status_code, "ms": dt_ms})
    return response

class SimIn(BaseModel):
    feeder_id: str
    pv_adoption: float = Field(ge=0.0, le=1.0)
    battery_adoption: float = Field(ge=0.0, le=1.0)
    hour: int = Field(ge=0, le=95)

class SweepIn(BaseModel):
    feeder_id: str
    hours: list[int]

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

@app.post("/sweep")
def sweep_api(inp: SweepIn):
    return pv_sweep(inp.feeder_id, inp.hours)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/network/{feeder_id}")
def network_api(feeder_id: str):
    from .data import load_network
    try:
        return load_network(feeder_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="feeder not found")