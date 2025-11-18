FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1) Install dependencies as root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copy your code
COPY . .

# 3) Copy start.sh and make it executable AS ROOT
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 4) Create non-root user and give ownership of start.sh
RUN addgroup --system app && adduser --system --group app && chown app:app /start.sh

# 5) Drop privileges
USER app

EXPOSE 8000

# 6) Use the start script as entrypoint
CMD ["/start.sh"]
