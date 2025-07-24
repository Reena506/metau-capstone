import moment from "moment";

export function shuffleArray(array) {
  // Makes sure each day has different event orders
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function adjustOverlappingEvents(events) {
  const adjusted = [];

  for (let i = 0; i < events.length; i++) {
    const evt = { ...events[i] };
    const start = moment(evt.start_time);
    const end = moment(evt.end_time);

    if (adjusted.length > 0) {
      const prevEnd = moment(adjusted[adjusted.length - 1].end_time);

      // If there's an overlap, move the event to start 30 minutes after previous ends
      if (start.isBefore(prevEnd)) {
        const newStart = moment(prevEnd).add(30, "minutes"); // Increased buffer
        const duration = end.diff(start, "minutes");
        evt.start_time = newStart.toISOString();
        evt.end_time = newStart.add(duration, "minutes").toISOString();
      }
    }

    adjusted.push(evt);
  }

  return adjusted;
}
