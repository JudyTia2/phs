import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimePicker from './TimePicker';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles.css'; // Import the CSS file

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
    axios.get('https://backend-9z9u.onrender.com/schedule/1')
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

    axios.post('https://backend-9z9u.onrender.com/book', {
      client_name: clientName,
      psychologist_id: 1,
      date_time: dateTime,
      is_recurring: isRecurring,
      timezoneOffset: dateTime.getTimezoneOffset()
    })
    .then(response => {
      toast.success('Booking request submitted!', {
        position: "top-center",
        autoClose: 3000, // Close after 3 seconds
      });
      // Add the new booking to the list
        setBookings([...bookings, response.data]);
        
        // --- SOLUTION: Reset the form fields after a successful submit ---
        setClientName(''); // Clear the client name field
        setIsRecurring(false); // Reset the checkbox
        
        // Reset the dateTime state to a new initial value
        const now = new Date();
        const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        setDateTime(now);
    })
      .catch(error => console.error(error));
  };
  return (
    <div>
      <h1>Book a Session</h1>
      <TimePicker onDateTimeChange={setDateTime} bookings={bookings} />
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
          <label>Recurring Weekly:</label>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
        </div>
        <button type="submit">Request Booking</button>
      </form>
      <ToastContainer />
      <footer>
      <p><a href='https://www.linkedin.com/in/duohui-tian-3821a0151/'>2025 @Copyright: Duohui Tian</a></p>
      </footer>
    </div>
  );
};
export default ClientBooking;
