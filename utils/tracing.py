# utils/tracing.py

def task_log_extra(request_id: str, **kwargs):
    """
    Build a structured 'extra' dict for Celery task logs.

    This keeps log fields consistent across all tasks.
    """
    extra = {"request_id": request_id}
    extra.update(kwargs)
    return extra
