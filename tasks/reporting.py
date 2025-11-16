import os, time, json, redis
from .worker import celery_app

r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

@celery_app.task(name="tasks.reporting.generate_report",
                 bind=True,
                 autoretry_for=(Exception,),
                 retry_backoff=True,
                 retry_kwargs={"max_retries": 3})
def generate_report(self, idem_key: str, payload: dict) -> dict:
    # Simulate a time-consuming operation
    time.sleep(2)

    # Build fake result (later you can save to DB)
    result = {"status": "done", "key": idem_key,
              "result": {"items": 3, "month": payload.get("month")}}

    # ✅ Write result back to Redis (expires in 1 hour)
    r.setex(f"done:{idem_key}", 3600, json.dumps(result))
    # ✅ Clean inflight marker
    r.delete(f"inflight:{idem_key}")
    return result
