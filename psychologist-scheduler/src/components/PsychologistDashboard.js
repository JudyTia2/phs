import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimePicker from './TimePicker';
//import { generateAvailability } from './availabilityUtils';
import '../styles.css'; // Import the CSS file
import ReportButton from "./ReportButton";


const PsychologistDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modifiedTime, setModifiedTime] = useState(null);
  const [applyToRecurring, setApplyToRecurring] = useState(false);
  //const [availability, setAvailability] = useState([]); 
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  

  useEffect(() => {
    // Fetch all bookings for the psychologist (ID: 1 in this example)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    axios.get(`${API_BASE_URL}/schedule/1`)
    //axios.get('https://backend-9z9u.onrender.com/schedule/1')
      .then(response => { 
        setBookings(response.data);
        return response.data;
      })
      //.then((data) => {setAvailability(generateAvailability(new Date(), data))})
      //.then((data) => {setAvailability(generateAvailability(new Date("2024-12-17T09:00:00"), data))})
      .catch(error => console.error(error));
  }, []);

  const handleApprove = (id) => {
    axios.put(`${API_BASE_URL}/approve/${id}`)
      .then(() => {
        setBookings(bookings.map(booking => booking.id === id ? { ...booking, status: 'Approved' } : booking));
      })
      .catch(error => console.error(error));
    };
  

  const handleReject = (id) => {
    axios.delete(`${API_BASE_URL}/cancel/${id}`) // Simulating rejection
      .then(() => {
        setBookings(bookings.filter(booking => booking.id !== id));
      })
      .catch(error => console.error(error));
  };

  const handleModify = (booking) => {
    setSelectedBooking(booking);
    // Set the initial time for the time picker to the booking's current time
    const initialDateTime = new Date(booking.date_time);
    initialDateTime.setHours(9, 0, 0, 0); // Set to 9:00 AM
    setModifiedTime(initialDateTime);
  };

  const handleModifySubmit = () => {
      // Ensure modifiedTime is a valid Date object
      if (!(modifiedTime instanceof Date)) {
      console.error('Invalid time selected');
      return; // Prevent submission if time is invalid
    }

    const newDateTime = modifiedTime; // Use modifiedTime directly
    if (!applyToRecurring) {
      // Apply changes to the entire recurring series
      axios.put(`${API_BASE_URL}/add_exception/${selectedBooking.id}/`, { exception_date:newDateTime, timezoneOffset: newDateTime.getTimezoneOffset() }) // Use selectedBooking.id directly
        .then(() => {
                    // Apply changes to a single instance
          if (!selectedBooking.exceptions) {
            selectedBooking.exceptions = [];
          }
          setBookings(bookings.map(booking => booking.id === selectedBooking.id ? { ...booking, status: 'Pending', exceptions: booking.exceptions.push(newDateTime)} : booking));
        })
        .catch(error => console.error(error));
      setSelectedBooking(null);
    } else {
    axios.put(`${API_BASE_URL}/modify/${selectedBooking.id}`, { newDateTime, timezoneOffset: newDateTime.getTimezoneOffset() }) // Use selectedBooking.id directly
      .then(() => {
        setBookings(bookings.map(booking => booking.id === selectedBooking.id ? { ...booking, status: 'Pending', date_time: newDateTime } : booking));
      })
      .catch(error => console.error(error));
    setSelectedBooking(null); // Clear selected booking after submission
   // setBookings(bookings.map(booking => booking.id === selectedBooking ? { ...booking, status: 'Pending', date_time:newDateTime} : booking));
    }
  };

  const handleDelete = (id) => {
    axios.delete(`${API_BASE_URL}/cancel/${id}`)
      .then(() => {
        setBookings(bookings.filter(booking => booking.id !== id));
      })
      .catch(error => console.error(error));
  };


  return (
    <div>
      <h1>Psychologist Dashboard</h1>
      <h2>Pending Bookings</h2>
      <ul>
        {bookings.filter(booking => booking.status === 'Pending').map(booking => (
          <li key={booking.id}>
            {booking.client_name} - {new Date(booking.date_time).toLocaleString()} - {booking.is_recurring ? 'Recurring' : 'One-time'}
            <button onClick={() => handleApprove(booking.id)}>Approve</button>
            <button onClick={() => handleReject(booking.id)}>Reject</button>
          </li>
        ))}
      </ul>
       {selectedBooking && (
        <div>
          <h2>Modify Booking for {selectedBooking.client_name}</h2>
          <TimePicker  onDateTimeChange={setModifiedTime} bookings={bookings} />
          <label>
            <input
              type="checkbox"
              checked={applyToRecurring}
              onChange={() => setApplyToRecurring(!applyToRecurring)}
            />
            Apply to entire recurring series
          </label>
          <div class ='centerbutton'>
          <button onClick={() => setSelectedBooking(null)}>Cancel</button>
          <button onClick={handleModifySubmit}>Save Changes</button>
          </div>
        </div>
      )}

      <h2>Approved Bookings</h2>
      <ul>
        {bookings.filter(booking => booking.status === 'Approved').map(booking => (
          <li key={booking.id}>
            {booking.client_name} - {new Date(booking.date_time).toLocaleString()} - {booking.is_recurring ? 'Recurring' : 'One-time'}
            <button onClick={() => handleModify(booking)}>Modify</button>
            <button onClick={() => handleDelete(booking.id)}>Delete</button>
            {booking.exceptions && booking.exceptions.length > 0 && (
              <ul>
                <li>Exceptions:</li>
                {booking.exceptions.map((exception, index) => (
                  <li key={index}>{new Date(exception).toLocaleString()}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "20px" }}>
        <h3>Monthly Report</h3>
        <ReportButton month="2025-11" apiBase={API_BASE_URL} />
      </div>
      <footer>
      <p><a href='https://www.linkedin.com/in/duohui-tian-3821a0151/'>2025 @Copyright: Duohui Tian</a></p>
      </footer>
    </div>
  );
};

export default PsychologistDashboard;