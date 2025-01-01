import React, { useState, useEffect } from 'react';
const TimePicker = ({ selectedDateTime, onTimeChange }) => {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17,22];
  const minutes = [0, 15, 30, 45];

  const [selectedDate, setSelectedDate] = useState(
   selectedDateTime ? selectedDateTime : new Date()
  );

  const [selectedHour, setSelectedHour] = useState(selectedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(selectedDate.getMinutes());

  //  useEffect(() => {
  //   const newDate = new Date(selectedDateTime);
  //   setSelectedDate(newDate);
  //   setSelectedHour(newDate.getHours());
  //   setSelectedMinute(newDate.getMinutes());
  //   console.log("selectedDateTime "+ selectedDateTime);
  // }, [selectedDateTime]);
  
  const handleDateTimeChange = (newDate, newHour, newMinute) => {
    const updatedDate = new Date(newDate);
    updatedDate.setHours(newHour);
    updatedDate.setMinutes(newMinute);
    setSelectedDate(updatedDate);
    setSelectedHour(newHour);
    setSelectedMinute(newMinute);
    onTimeChange(updatedDate);
  };

  const handleDateChange = (event) => {
    const selectedDateString = event.target.value;
    const newDate = new Date(`${selectedDateString}T09:00:00`);
    handleDateTimeChange(newDate, selectedHour, selectedMinute);
  };

    
  // };
  function formatDate(dateString) {
    // 1. Extract year, month, and day from the input string
    if(dateString === 'Invalid Date') return "2025-12-01";
    const parts = dateString.split(/[/ ]/); // Split by "/" or " "
    const year = parts[0];
    const month = parts[1].padStart(2, '0'); // Pad month with leading zero if needed
    const day = parts[2].padStart(2, '0'); 
  
    // 2. Construct the formatted date string
    const formattedDate = `${year}-${month}-${day}`; 
    return formattedDate;
  }


  const handleHourChange = (event) => {
    const newHour = parseInt(event.target.value, 10);
    handleDateTimeChange(selectedDate, newHour, selectedMinute);
  };

  const handleMinuteChange = (event) => {
    const newMinute = parseInt(event.target.value, 10);
    handleDateTimeChange(selectedDate, selectedHour, newMinute);
  };

  console.log("rendering TimePicker "+ selectedDate);

  return (
    <div>
      <label htmlFor="date">Date:</label>
      <input
        type="date"
        id="date"
        value={formatDate(selectedDate.toLocaleString())}
        onChange={handleDateChange}
      />
      <select
      value={selectedHour} 
      onChange={handleHourChange}>
        {hours.map(hour => (
          <option key={hour} value={hour}>{hour}:00</option>
        ))}
      </select>
      <select
      value={selectedMinute} 
      onChange={handleMinuteChange}>
        {minutes.map(minute => (
          <option key={minute} value={minute}>{minute}</option>
        ))}
      </select>
    </div>
  );
};
export default TimePicker;