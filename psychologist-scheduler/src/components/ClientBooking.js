import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimePicker from './TimePicker';

const ClientBooking = () => {
  const [bookings, setBookings] = useState([]);
  const now = new Date();
  const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  const [clientName, setClientName] = useState('');
  const [dateTime, setDateTime] = useState(now);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    // Fetch all bookings for the psychologist (ID: 1 in this example)
    axios.get('http://localhost:5000/schedule/1')
      .then(response => { 
        setBookings(response.data);
        return response.data;
      })
      //.then((data) => {setAvailability(generateAvailability(new Date(), data))})
      //.then((data) => {setAvailability(generateAvailability(new Date("2024-12-17T09:00:00"), data))})
      .catch(error => console.error(error));
  }, []);

//   useEffect(() => {
//     // Set initial time to the nearest 15-minute interval
//     const now = new Date();
//     const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
//     now.setMinutes(roundedMinutes);
//     now.setSeconds(0);
//     setDateTime(now);
//     console.log("effect time "+ now); 
//   }, [clientName]);
// }


  const handleSubmit = (e) => {
    console.log(dateTime); 
    e.preventDefault();

    axios.post('http://localhost:5000/book', {
      client_name: clientName,
      psychologist_id: 1,
      date_time: dateTime,
      is_recurring: isRecurring,
      timezoneOffset: dateTime.getTimezoneOffset()
    })
      .then(() => alert('Booking request submitted!'))
      .catch(error => console.error(error));
  };
  return (
    <div>
      <h1>Book a Session</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Client Name:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Date and Time:</label>
          <TimePicker onDateTimeChange={setDateTime} bookings={bookings} />
        </div>
        <div>
          <label>Recurring Weekly:</label>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
        </div>
        <button type="submit">Request Booking</button>
      </form>
    </div>
  );
};
export default ClientBooking;
