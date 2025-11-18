FROM python:3.9-slim

# --- Python defaults ---
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1) Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copy ALL project files into /app
COPY . .

# 3) Copy start.sh to a fixed path and make it executable AS ROOT
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 4) Create non-root user
RUN addgroup --system app && adduser --system --group app

# 5) 把 /app 和 /start.sh 的所有权改成 app:app（关键一步）
RUN chown -R app:app /app /start.sh

# 6) Drop privileges
USER app

EXPOSE 8000

# 7) Entry point: run our start script
CMD ["/start.sh"]
