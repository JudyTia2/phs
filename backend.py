import json
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from sqlalchemy import Boolean
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from typing import Optional
from sqlalchemy import select


from flask_marshmallow import Marshmallow
from datetime import datetime, timedelta
from flask_cors import CORS
from sqlalchemy.dialects.postgresql import JSON

class Base(DeclarativeBase):
    pass

# Initialize the Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///schedule.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

db = SQLAlchemy(app, model_class=Base)
ma = Marshmallow(app)



class Psychologist(db.Model):
    __tablename__ = "psychologist"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="psychologist")

class Client(db.Model):
    __tablename__ = "client"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))

    booking: Mapped["Booking"] = relationship("Booking", back_populates="client")

class Booking(db.Model):
    __tablename__ = "booking"
    id: Mapped[int] = mapped_column(primary_key=True)
    date_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    # Mapped[Optional[dict]] is a good way to represent a nullable JSON column.
    exceptions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) 
    
    # We can also use a mapped_column for the status to define the length and default
    status: Mapped[str] = mapped_column(String(20), default='Pending')
    client_id: Mapped[int] = mapped_column(ForeignKey("client.id"), unique=True)  # unique ensures one booking per client
    client: Mapped["Client"] = relationship("Client", back_populates="booking")
    psychologist_id: Mapped[int] = mapped_column(ForeignKey("psychologist.id"))
    psychologist: Mapped["Psychologist"] = relationship("Psychologist", back_populates="bookings")

# Schema for serializing data
class BookingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Booking
        load_instance = True

booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)


import os, redis
r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

from tasks.reporting import generate_report

@app.post("/reports")
def create_report():
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return jsonify({"error": "Missing Idempotency-Key"}), 400

    done = r.get(f"done:{idem_key}")
    if done:
        return jsonify(json.loads(done))

    # Atomic set: only allow one inflight per key
    ok = r.set(f"inflight:{idem_key}", "1", nx=True, ex=3600)
    if not ok:
        return jsonify({"status": "inflight", "poll": f"/jobs/{idem_key}"}), 202

    async_res = generate_report.delay(idem_key, request.json or {})
    r.setex(f"task:{idem_key}", 3600, async_res.id)
    return jsonify({"status": "accepted", "poll": f"/jobs/{idem_key}"}), 202


@app.get("/jobs/<key>")
def poll_job(key):
    done = r.get(f"done:{key}")
    if done:
        return jsonify(json.loads(done))
    task_id = r.get(f"task:{key}")
    if not task_id:
        return jsonify({"status": "unknown"}), 404
    # 简版轮询：让 worker 在任务完成时写入 done:key，明天补
    return jsonify({"status": "inflight"}), 202


# Add exception to a booking
@app.route('/add_exception/<int:id>/', methods=['PUT'])
def add_exception(id):
    stmt = db.select(Booking).where(Booking.id == id)
    booking = db.session.scalars(stmt).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    data = request.json
    exception_date = data['exception_date']
    if not exception_date:
        return jsonify({'error': 'Exception date is required'}), 400

    if booking.exceptions is None:
        booking.exceptions = []

    local_dt = datetime.strptime(data['exception_date'], '%Y-%m-%dT%H:%M:%S.%fZ')
    timezone_offset = data['timezoneOffset']
    offset = timedelta(minutes=timezone_offset)
    local_time = local_dt - offset
    booking.exceptions.append(local_time.isoformat())
    db.session.commit()

    return jsonify({'message': 'Exception added successfully'}), 200

# Routes
@app.route('/book', methods=['POST'])
def book_time():
    """Client books a time slot"""
    print("Reached this part of the code!")
    data = request.json
    client_name = data['client_name']
    # Create and commit the new client first to get an ID
    c1 = Client(name=client_name)
    db.session.add(c1)
    db.session.commit()

    psychologist_id = data['psychologist_id']
    local_dt = datetime.strptime(data['date_time'], '%Y-%m-%dT%H:%M:%S.%fZ')
    timezone_offset = data['timezoneOffset']
    offset = timedelta(minutes=timezone_offset)
    local_time = local_dt - offset
    date_time = local_time
    is_recurring = data.get('is_recurring', False)

    new_booking = Booking(
        client_id=c1.id,
        psychologist_id=psychologist_id,
        date_time=date_time,
        is_recurring=is_recurring
    )
    db.session.add(new_booking)
    db.session.commit()
    return booking_schema.jsonify(new_booking), 201

@app.route('/approve/<int:booking_id>', methods=['PUT'])
def approve_booking(booking_id):
    """Psychologist approves a booking"""
    stmt = db.select(Booking).where(Booking.id == booking_id)
    booking = db.session.scalars(stmt).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    booking.status = 'Approved'
    db.session.commit()
    return booking_schema.jsonify(booking)

@app.route('/modify/<int:booking_id>', methods=['PUT'])
def modify_booking(booking_id):
    """Client or psychologist modifies a booking (requires approval)"""
    stmt = db.select(Booking).where(Booking.id == booking_id)
    booking = db.session.scalars(stmt).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    data = request.json
    local_dt = datetime.strptime(data['newDateTime'], '%Y-%m-%dT%H:%M:%S.%fZ')
    timezone_offset = data['timezoneOffset']
    offset = timedelta(minutes=timezone_offset)
    local_time = local_dt - offset
    booking.date_time = local_time
    booking.status = 'Pending'  # Reset approval
    db.session.commit()
    return booking_schema.jsonify(booking)

@app.route('/cancel/<int:booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    """Either client or psychologist cancels a booking"""
    stmt = db.select(Booking).where(Booking.id == booking_id)
    booking = db.session.scalars(stmt).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    db.session.delete(booking)
    db.session.commit()
    return jsonify({'message': 'Booking canceled'}), 200

@app.route('/schedule/<int:psychologist_id>', methods=['GET'])
def get_schedule(psychologist_id):
    """Get all bookings for a psychologist"""
    stmt = db.select(Booking).where(Booking.psychologist_id == psychologist_id)
    bookings = db.session.scalars(stmt).all()
    return bookings_schema.jsonify(bookings)

with app.app_context():
    db.create_all()

    # Check if a Psychologist already exists
    first_psychologist = db.session.query(Psychologist).first()
    
    if not first_psychologist:
        # If no psychologist exists, create one
        new_psychologist = Psychologist(name="Dr. Alex")
        db.session.add(new_psychologist)
        db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
# if __name__ == '__main__':
#     # Ensure this entire block is within the application context.
#     with app.app_context():
#         # First, create all tables. This is crucial.
#         db.create_all()
        
#         # # Second, after the tables are created, perform the query.
#         # first_psychologist = db.session.query(Psychologist).first()

#         # if not first_psychologist:
#         #     print("No psychologist found, creating one.")
#         #     new_psychologist = Psychologist(name="Dr. Alex")
#         #     db.session.add(new_psychologist)
#         #     db.session.commit()
#         # else:
#         #     print(f"Psychologist '{first_psychologist.name}' already exists.")

#     app.run(host='0.0.0.0', port=5000)
