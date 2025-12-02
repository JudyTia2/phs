# Psychologist Scheduling System (GovHealth Demo)

A production-style **backend scheduling platform** designed for healthcare and government workflows.  
This project showcases **distributed architecture, async task processing, structured logging, monitoring, and clean DevOps practices**—built with the same principles used in enterprise systems.

---

## 🌐 Live Demo

**App:** https://phs-70gu.onrender.com/  
**Psychologist View:** https://phs-70gu.onrender.com/psychologist

---

## 🔑 Features

- Psychologist & client scheduling workflow  
- Async report generation (FastAPI → Redis → Celery)
- Idempotency keys & job-status polling  
- Structured JSON logging with request tracing  
- Health checks for reliability  
- Prometheus/Grafana observability foundation  
- Clean multi-service Docker Compose orchestration  
- Extensible for authentication, audit logs, RBAC

---

## 🛠 Tech Stack

### **Backend**
- FastAPI (REST APIs)
- Celery (distributed tasks)
- Redis (queue + caching)
- Structured logging (JSON)
- Prometheus Python client

### **Frontend**
- React (basic scheduling dashboards)

### **Infrastructure**
- Docker & Docker Compose  
- Prometheus + Grafana  
- GitHub Actions (CI-ready)

---

## 🏗 System Architecture

```
                +-------------------+
                |      React UI     |
                +-------------------+
                          |
                          v
                +-------------------+
                |    FastAPI API    |
                | (Logging + Tracing)|
                +-------------------+
                          |
                          v
                +-------------------+
                |    Redis Queue    |
                +-------------------+
                          |
                          v
                +-------------------+
                |   Celery Worker   |
                | (Async Reports)   |
                +-------------------+

                +-------------------+
                | Prometheus/Grafana|
                |   Monitoring       |
                +-------------------+
```

---

## 💡 Key Engineering Highlights

This project demonstrates production-ready engineering practices:

### **Backend Architecture**
- Distributed async task execution (API → Queue → Worker)
- Idempotent API design (ensures safe retries)
- Job-status polling for long-running operations
- Clean separation between API, worker, and storage layers
- Unified error envelope with global exception handling

### **Observability & Logging**
- Structured JSON logs (API + worker)
- End-to-end request tracing (`X-Request-ID`)
- Worker logs include task_id, idem_key, duration_ms
- `/healthz` endpoint for container orchestration
- Prometheus metrics endpoint (`/metrics`)
- Grafana dashboards integrated

### **DevOps Foundations**
- Multi-service orchestration via Docker Compose  
- Networked FastAPI / Redis / Celery / Monitoring stack  
- Ready for CI/CD (linting, testing, builds)  
- Clean environment setup with `.env` and config modules  

### **Healthcare / Government-Friendly Design**
- Clear auditability and traceability patterns  
- Deterministic behavior (idempotency, structured logs)  
- Extensible for RBAC, authentication, and compliance  
- Architecture consistent with healthcare IT and public-sector systems  

---

## 📦 Running Locally

```bash
git clone https://github.com/JudyTia2/phs.git
cd phs
docker compose up --build
```

Services:

- **Frontend:** http://localhost:3000  
- **API:** http://localhost:5000  
- **Metrics:** http://localhost:5000/metrics  
- **Grafana:** http://localhost:3001 (admin/admin)

---

## 📘 Core API Flow (Example)

1. **User clicks “Generate Report”**
2. Frontend sends:
   ```
   POST /reports
   Idempotency-Key: <uuid>
   ```
3. API enqueues Celery task with metadata  
4. Worker processes task and logs trace  
5. Frontend polls:  
   ```
   GET /jobs/{id}
   ```
6. Frontend updates when job is `done`

---

## 🔄 Future Enhancements (Planned)

These items follow standard enterprise extension patterns:

- Expanded Prometheus metrics (histograms, task performance)
- JWT-based authentication (admin / psychologist roles)
- Basic audit logging middleware  
- Additional unit tests (API + async workflows)
- GitHub Actions pipeline (CI for linting/tests)
- Sample data generator for demo environments  

---

## 📫 Contact

**Duohui Tian**  
Backend Engineer – Montreal, QC  
📧 jkl12zys@gmail.com  
🔗 LinkedIn: https://linkedin.com/in/duohui-tian-3821a0151
