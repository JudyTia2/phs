import React, { useState } from 'react';
import axios from 'axios';
import TimePicker from './TimePicker';

const ClientBooking = () => {
  const now = new Date();
  const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  const [clientName, setClientName] = useState('');
  const [dateTime, setDateTime] = useState(now);
  const [isRecurring, setIsRecurring] = useState(false);


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
const emptyFunction = () => {}; 
  const handleSubmit = (e) => {
    console.log(dateTime); 
    e.preventDefault();

    axios.post('http://localhost:5000/book', {
      client_name: clientName,
      psychologist_id: 1,
      date_time: dateTime,
      is_recurring: isRecurring,
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
          <TimePicker selectedDateTime={dateTime} onTimeChange={setDateTime} />
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
