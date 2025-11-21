import json, os, redis
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, ForeignKey, DateTime, Boolean, create_engine
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session
from sqlalchemy.dialects.postgresql import JSON

from database import Base, engine, get_db
from tasks.reporting import generate_report

import logging
import json
import uuid
import time
from starlette.middleware.base import BaseHTTPMiddleware



# JSON logger configuration
logger = logging.getLogger("psychologist health")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)

class JsonRequestFormatter(logging.Formatter):
    def format(self, record):
        msg = record.msg
        if not isinstance(msg, dict):
            msg = {"message": str(msg)}
        msg.setdefault("level", record.levelname)
        msg.setdefault("logger", record.name)
        return json.dumps(msg, ensure_ascii=False)

handler.setFormatter(JsonRequestFormatter())
logger.handlers.clear()
logger.addHandler(handler)


# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        # store on request.state so handlers can use it later if needed
        request.state.request_id = request_id
        start_time = time.perf_counter()
        response = await call_next(request)
        # compute latency in ms
        latency_ms = (time.perf_counter() - start_time) * 1000
        response.headers["Access-Control-Allow-Origin"] = "https://phs-70gu.onrender.com"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["X-Request-ID"] = request_id
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "client": request.client.host if request.client else None,
            "latency_ms": round(latency_ms, 2),  # round to 2 decimals
            # you can add more fields later, e.g. "user_id"
        }
        logger.info(log_data)
        
        return response

app.add_middleware(RequestLoggingMiddleware)

# Redis client
r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

# SQLAlchemy Models
class Psychologist(Base):
    __tablename__ = "psychologist"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="psychologist")

class Client(Base):
    __tablename__ = "client"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    booking: Mapped["Booking"] = relationship("Booking", back_populates="client")

class Booking(Base):
    __tablename__ = "booking"
    id: Mapped[int] = mapped_column(primary_key=True)
    date_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    exceptions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='Pending')
    client_id: Mapped[int] = mapped_column(ForeignKey("client.id"), unique=True)
    client: Mapped["Client"] = relationship("Client", back_populates="booking")
    psychologist_id: Mapped[int] = mapped_column(ForeignKey("psychologist.id"))
    psychologist: Mapped["Psychologist"] = relationship("Psychologist", back_populates="bookings")

# Pydantic Schemas for data validation and serialization
class BookingBase(BaseModel):
    date_time: datetime
    is_recurring: bool = False

class BookingCreate(BaseModel):
    client_name: str
    psychologist_id: int
    date_time: str # Assuming ISO format string from frontend
    timezoneOffset: int
    is_recurring: bool = False

class BookingUpdate(BaseModel):
    newDateTime: str
    timezoneOffset: int

class ExceptionCreate(BaseModel):
    exception_date: str
    timezoneOffset: int

class BookingSchema(BookingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    client_id: int
    psychologist_id: int
    exceptions: Optional[list] = None


@app.post("/reports", status_code=202)
async def create_report(request: Request, idempotency_key: Optional[str] = Header(None)):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Missing Idempotency-Key")

    done = r.get(f"done:{idempotency_key}")
    if done:
        return json.loads(done)

    ok = r.set(f"inflight:{idempotency_key}", "1", nx=True, ex=3600)
    if not ok:
        return {"status": "inflight", "poll": f"/jobs/{idempotency_key}"}

    payload = await request.json()
    async_res = generate_report.delay(idempotency_key, payload or {})
    r.setex(f"task:{idempotency_key}", 3600, async_res.id)
    return {"status": "accepted", "poll": f"/jobs/{idempotency_key}"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/jobs/{key}")
def poll_job(key: str):
    done = r.get(f"done:{key}")
    if done:
        return json.loads(done)
    task_id = r.get(f"task:{key}")
    if not task_id:
        raise HTTPException(status_code=404, detail={"status": "unknown"})
    return {"status": "inflight"}

@app.put('/add_exception/{booking_id}/', response_model=BookingSchema)
def add_exception(booking_id: int, data: ExceptionCreate, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    local_dt = datetime.strptime(data.exception_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    offset = timedelta(minutes=data.timezoneOffset)
    local_time = local_dt - offset

    if booking.exceptions is None:
        booking.exceptions = []
    booking.exceptions.append(local_time.isoformat())
    db.commit()
    db.refresh(booking)
    return booking

@app.post('/book', status_code=201, response_model=BookingSchema)
def book_time(data: BookingCreate, db: Session = Depends(get_db)):
    client = Client(name=data.client_name)
    db.add(client)
    db.commit()
    db.refresh(client)

    local_dt = datetime.strptime(data.date_time, '%Y-%m-%dT%H:%M:%S.%fZ')
    offset = timedelta(minutes=data.timezoneOffset)
    date_time = local_dt - offset

    new_booking = Booking(
        client_id=client.id,
        psychologist_id=data.psychologist_id,
        date_time=date_time,
        is_recurring=data.is_recurring
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.put('/approve/{booking_id}', response_model=BookingSchema)
def approve_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = 'Approved'
    db.commit()
    db.refresh(booking)
    return booking

@app.put('/modify/{booking_id}', response_model=BookingSchema)
def modify_booking(booking_id: int, data: BookingUpdate, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    local_dt = datetime.strptime(data.newDateTime, '%Y-%m-%dT%H:%M:%S.%fZ')
    offset = timedelta(minutes=data.timezoneOffset)
    booking.date_time = local_dt - offset
    booking.status = 'Pending'
    db.commit()
    db.refresh(booking)
    return booking

@app.delete('/cancel/{booking_id}')
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": "Booking canceled"}

@app.get('/schedule/{psychologist_id}', response_model=List[BookingSchema])
def get_schedule(psychologist_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.psychologist_id == psychologist_id).all()
    return bookings

@app.on_event("startup")
def startup_event():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Check if a Psychologist already exists
        first_psychologist = session.query(Psychologist).first()
        if not first_psychologist:
            # If no psychologist exists, create one
            new_psychologist = Psychologist(name="Dr. Alex")
            session.add(new_psychologist)
            session.commit()
