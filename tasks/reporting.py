import os, time, json, redis
from .worker import celery_app
from utils.tracing import task_log_extra 

import logging
logger = logging.getLogger(__name__)


r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

@celery_app.task(name="tasks.reporting.generate_report",
                 bind=True,
                 autoretry_for=(Exception,),
                 retry_backoff=True,
                 retry_kwargs={"max_retries": 3})
def generate_report(self, request_id: str, idem_key: str, payload: dict) -> dict:
    # Record start time for latency measurement (in ms).
    start = time.time()

    # Log the task start with correlation IDs.
    logger.info(
        "report_task_started",
        extra=task_log_extra(
            request_id,
            task_id=self.request.id,
            idem_key=idem_key,
            retries=self.request.retries,
        ),
    )

    try:
        # Simulate a time-consuming operation
        time.sleep(2)

        # Build fake result (later you can save to DB)
        result = {
            "status": "done",
            "key": idem_key,
            "result": {"items": 3, "month": payload.get("month")},
        }

        # ✅ Write result back to Redis (expires in 1 hour)
        r.setex(f"done:{idem_key}", 3600, json.dumps(result))
        # ✅ Clean inflight marker
        r.delete(f"inflight:{idem_key}")

        # Compute duration in milliseconds.
        duration_ms = round((time.time() - start) * 1000, 2)

        # Log successful completion.
        logger.info(
            "report_task_finished",
            extra=task_log_extra(
                request_id,
                task_id=self.request.id,
                idem_key=idem_key,
                duration_ms=duration_ms,
                status="success",
                retries=self.request.retries,
            ),
        )

        return result

    except Exception as e:
        # Even on failure we still want to log how long it ran.
        duration_ms = round((time.time() - start) * 1000, 2)

        # Log the failure with error details.
        logger.error(
            "report_task_failed",
            extra=task_log_extra(
                request_id,
                task_id=self.request.id,
                idem_key=idem_key,
                duration_ms=duration_ms,
                status="failed",
                retries=self.request.retries,
                error=str(e),
            ),
        )

        # Re-raise so Celery can handle retries according to our config.
        raise
