export const generateAvailability = (date, bookings) => {
    const workingHours = { start: 9, end: 17 }; // 9:00 AM to 5:00 PM
    const interval = 15; // 15-minute slots
    const duration = 60; // 60-minute sessions
    const minAvailableDuration = duration + interval; // 75 minutes
    let slots = [];
  
    const start = new Date(date);
    start.setHours(workingHours.start, 0, 0, 0);
  
    const end =  new Date(date);
    end.setHours(workingHours.end, 0, 0, 0);
    var previousBooking;
    for (let time = start; time < end; time.setMinutes(time.getMinutes() + interval)) {
      const slotTime = new Date(time);
      const isBooked = bookings.some(
         (booking) => new Date(booking.date_time).getTime() === slotTime.getTime() 
     );
  
      slots.push({
        hour: slotTime.getHours(),
        minute: slotTime.getMinutes(),
        available: !isBooked,
      });
    
      if (isBooked) {
        if (previousBooking) {
          const diff = (time - previousBooking) / 60000 - duration;
          if (diff < minAvailableDuration) {
                      // Remove slots that fall within the range between previousBooking and current time
            const prevBooking = new Date(previousBooking);
            slots = slots.filter(slot => {
              const slotTime = new Date(date);
              slotTime.setHours(slot.hour, slot.minute, 0, 0);
              return slotTime <= prevBooking || slotTime >= time;
            });          
          }
        }
        previousBooking = new Date(time);  
        time.setMinutes(time.getMinutes() + (interval * 3));
      }
    }
    
    slots = slots.filter(slot => {
      return slot.available;
    });

  return slots;
  };
  