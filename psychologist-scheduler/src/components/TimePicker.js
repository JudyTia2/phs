import React, { useState } from 'react';
import Calendar from 'react-calendar'; // Install with `npm install react-calendar`
//import 'react-calendar/dist/Calendar.css';
import './TimePicker.css'; // Custom styles for the time grid
import 'react-datepicker/dist/react-datepicker.css';
import { generateAvailability } from './availabilityUtils';

const TimePicker = ({ onDateTimeChange, bookings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [availability, setAvailability] = useState([]); 
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAvailability(generateAvailability(date, bookings)); // Update availability when date changes
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(time.hour, time.minute);
    onDateTimeChange(dateTime);
  };

  const renderTimeGrid = () => {
    const hours = Array.from({ length:  17 - 9 + 1 }, (_, i) => i + 9); // 9 to 17 (5 PM)
    const minutes = [0, 15, 30, 45];

    return (
      <div className="time-grid">
        {hours.map((hour) =>
          minutes.map((minute) => {
            const time = { hour, minute };
            const isAvailable = availability.some(
              (slot) =>
                slot.hour === hour && slot.minute === minute && slot.available
            );

            return (
              <button
                key={`${hour}:${minute}`}
                className={`time-slot ${isAvailable ? 'available' : 'unavailable'} ${
                  selectedTime &&
                  selectedTime.hour === hour &&
                  selectedTime.minute === minute
                    ? 'selected'
                    : ''
                }`}
                disabled={!isAvailable}
                onClick={() => handleTimeClick(time)}
              >
                {`${hour.toString().padStart(2, '0')}:${minute
                  .toString()
                  .padStart(2, '0')}`}
              </button>
            );
          })
        )}
      </div>
    );
  };
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && date <= new Date()) {
      return 'past-date';
    }
    return null;
  };
  return (
    <div className="time-picker">
      <h3>Select a Date</h3>
      <Calendar onChange={handleDateChange} value={selectedDate}  minDate={new Date()}  tileClassName={tileClassName}/>
      <h3>Select a Time</h3>
      {renderTimeGrid()}
    </div>
  );
};

export default TimePicker;
