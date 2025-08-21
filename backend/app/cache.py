# 간단한 메모리 캐시 TTL
import time
_CACHE = {}
_TTL = 300.0

def cache_get(key: str):
    v = _CACHE.get(key)
    if not v:
        return None
    if time.time() - v[0] > _TTL:
        _CACHE.pop(key, None)
        return None
    return v[1]

def cache_set(key: str, value):
    _CACHE[key] = (time.time(), value)