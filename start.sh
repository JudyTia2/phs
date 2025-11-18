#!/bin/sh
set -e

# 1) Start Celery worker in background
python -m celery -A tasks.reporting:celery_app worker -l info -Q reports,default &

# If your Celery app is defined elsewhere, adjust:
#   python -m celery -A tasks.worker:celery_app worker -l info -Q reports,default &
#   python -m celery -A tasks.reporting:app worker -l info -Q reports,default &
#   python -m celery -A tasks.reporting:celery worker -l info -Q reports,default &

# 2) Start FastAPI with uvicorn in foreground
uvicorn main:app --host 0.0.0.0 --port 8000
