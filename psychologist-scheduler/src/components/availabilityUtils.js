export const generateAvailability = (date, bookings) => {
  const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };
  const workingHours = { start: 9, end: 18 }; // 9:00 AM to 6:00 PM
  const interval = 15; // 15-minute slots
  const duration = 60; // 60-minute sessions
  const minGap = duration; // Minimum gap required for a booking

  const start = new Date(date).setHours(workingHours.start, 0, 0, 0);
  const end = new Date(date).setHours(workingHours.end, 0, 0, 0);

  // Generate all booking times including recurring bookings
  const allBookings = [];
  bookings.forEach(booking => {
    const bookingDate = new Date(booking.date_time);
   // allBookings.push(bookingDate);

    if (booking.is_recurring) {
      // Generate recurring bookings (e.g., weekly)
      const recurrenceEnd = new Date(date);
      recurrenceEnd.setMonth(recurrenceEnd.getMonth() + 1); // Example: consider recurring bookings for the next month

      let nextBookingDate = new Date(bookingDate);
      while (nextBookingDate < recurrenceEnd) {
       

        // Ensure exceptions is an array
        const exceptions = booking.exceptions || [];
        // Check if there is an exception for this week
        const hasException = exceptions.some(exception => {
          const exceptionDate = new Date(exception);
          return (
            exceptionDate.getFullYear() === nextBookingDate.getFullYear() &&
            getWeekNumber(exceptionDate) === getWeekNumber(nextBookingDate)
          );
        });
        if (nextBookingDate <= end && !hasException) {
          allBookings.push(new Date(nextBookingDate));
        }
        nextBookingDate.setDate(nextBookingDate.getDate() + 7); // Weekly recurrence
      }
    }
    // Add exceptions
    if (booking.exceptions) {
      booking.exceptions.forEach(exception => {
        allBookings.push(new Date(exception));
      });
    }
  });
  // Sort bookings and map them to timestamps
  const sortedBookings = allBookings
    .map(booking =>booking.getTime())
    .sort((a, b) => a - b);

  const slots = [];

  for (let time = start; time < end; time += interval * 60000) {
    const slotEnd = time + duration * 60000;

    // Skip slots that extend beyond working hours
    if (slotEnd > end) break;

    // Check if this slot overlaps with any booking
    const hasOverlap = sortedBookings.some(
      bookingTime =>
        (bookingTime >= time && bookingTime < slotEnd) || // Booking starts within the slot
        (bookingTime + duration * 60000 > time && bookingTime <= time) // Booking overlaps the slot
    );

    // Ensure there's a sufficient gap before and after bookings
    const isAvailable = !hasOverlap && sortedBookings.every(bookingTime => {
      const gapBefore = time - (bookingTime + duration * 60000);
      const gapAfter = bookingTime - slotEnd;
      return gapBefore >= minGap || gapAfter >= minGap;
    });

    if (isAvailable) {
      const slotTime = new Date(time);
      slots.push({
        hour: slotTime.getHours(),
        minute: slotTime.getMinutes(),
        available: true,
      });
    }
  }

  return slots;
};
