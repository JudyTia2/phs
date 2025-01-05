from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from datetime import datetime, timedelta
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///schedule.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

db = SQLAlchemy(app)
ma = Marshmallow(app)


# Models
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(100), nullable=False)
    psychologist_id = db.Column(db.Integer, nullable=False)
    date_time = db.Column(db.DateTime, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected

    def __repr__(self):
        return f'<Booking {self.client_name} @ {self.date_time}>'

# Schema for serializing data
class BookingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Booking
        load_instance = True

booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)

# Routes
@app.route('/book', methods=['POST'])
def book_time():
    """Client books a time slot"""
    print("Reached this part of the code!")
    data = request.json
    client_name = data['client_name']
    psychologist_id = data['psychologist_id']
    date_time = datetime.fromisoformat(data['date_time'])
    is_recurring = data.get('is_recurring', False)

    new_booking = Booking(
        client_name=client_name,
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
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    booking.status = 'Approved'
    db.session.commit()
    return booking_schema.jsonify(booking)

@app.route('/modify/<int:booking_id>', methods=['PUT'])
def modify_booking(booking_id):
    """Client or psychologist modifies a booking (requires approval)"""
    booking = Booking.query.get(booking_id)
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
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    db.session.delete(booking)
    db.session.commit()
    return jsonify({'message': 'Booking canceled'}), 200

@app.route('/schedule/<int:psychologist_id>', methods=['GET'])
def get_schedule(psychologist_id):
    """Get all bookings for a psychologist"""
    bookings = Booking.query.filter_by(psychologist_id=psychologist_id).all()
    return bookings_schema.jsonify(bookings)

# Database initialization
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
