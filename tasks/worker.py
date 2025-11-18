# tasks/worker.py
import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("govhealth", broker=redis_url, backend=redis_url)
celery_app.conf.task_default_queue = "default"
celery_app.conf.task_routes = {"tasks.reporting.*": {"queue": "reports"}}
if REDIS_URL and REDIS_URL.startswith("rediss://"):
    celery_app.conf.broker_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE,  # Demo 用，关闭证书校验
    }
    celery_app.conf.redis_backend_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE,  # 同上
    }