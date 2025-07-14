import moment from "moment";

const eventsPerDayMap = {
  //set number of activities per day
  relaxed: 3,
  moderate: 5,
  busy: 7,
};

const activityNames = {
  //name for each type of activity, might change later
  breakfast: "Breakfast",
  morning_activity: "Morning Sightseeing",
  cultural_site: "Cultural Site Visit",
  lunch: "Lunch",
  afternoon_activity: "Afternoon Exploration",
  outdoor_activity: "Outdoor Activity",
  afternoon_rest: "Free Time",
  shopping: "Shopping",
  dinner: "Dinner",
  evening_entertainment: "Evening Entertainment",
  nightlife: "Nightlife",
};

const activityPool = [
  //possible activities and their duration/times also might change later
  { type: "breakfast", duration: 60, early: "8:00", late: "9:00" },
  { type: "morning_activity", duration: 150, early: "9:30", late: "10:30" },
  { type: "cultural_site", duration: 120, early: "11:00", late: "12:00" },
  { type: "lunch", duration: 90, early: "13:00", late: "14:00" },
  { type: "afternoon_activity", duration: 120, early: "14:30", late: "15:30" },
  { type: "outdoor_activity", duration: 180, early: "15:00", late: "16:00" },
  { type: "afternoon_rest", duration: 120, early: "16:00", late: "17:00" },
  { type: "shopping", duration: 90, early: "17:30", late: "18:30" },
  { type: "dinner", duration: 90, early: "19:00", late: "20:00" },
  { type: "evening_entertainment", duration: 120, early: "20:30", late: "21:30" },
  { type: "nightlife", duration: 90, early: "22:00", late: "23:00" },
];

export function generateItinerary(formData) {
  //loops through each of the dates and calls generateDayEvents to create schedule
  const {
    startDate,
    endDate,
    scheduleStyle,
    dailyStart,
    specificPlaces,
    destination,
    goal,
  } = formData;

  const start = moment(startDate);
  const end = moment(endDate);
  const totalDays = end.diff(start, "days") + 1;
  const eventsPerDay = eventsPerDayMap[scheduleStyle];
  const generatedEvents = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDate = moment(start).add(dayIndex, "days");
    const dayEvents = generateDayEvents(
      currentDate,
      eventsPerDay,
      dailyStart,
      specificPlaces,
      destination,
      goal
    );
    generatedEvents.push(...dayEvents);
  }

  return generatedEvents;
}

function generateDayEvents(
  currentDate,
  eventsPerDay,
  dailyStart,
  specificPlaces,
  destination,
  goal
) {
  const events = [];

  const specificForDay = specificPlaces.filter(
    (place) =>
      place.place && place.day && moment(place.day).isSame(currentDate, "day") //filters for specific places user wants on that day
  );

  // Add user-specific events first
  specificForDay.forEach((specificPlace) => {
    const startTime = moment(
      `${currentDate.format("YYYY-MM-DD")} ${specificPlace.time || "10:00"}`
    );
    const endTime = moment(startTime).add(
      specificPlace.duration || 120,
      "minutes"
    );

    events.push({
      event: specificPlace.place,
      date: currentDate.toISOString(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location: `${specificPlace.place}, ${destination}`,
      isSpecified: true,
    });
  });

  // Calculate how many more events we need to add
  const remainingSlots = Math.max(0, eventsPerDay - specificForDay.length);
  
  // If we already have enough events from user specifications, just return sorted events
  if (remainingSlots <= 0) {
    events.sort((a, b) => moment(a.start_time).diff(moment(b.start_time)));
    return adjustOverlappingEvents(events);
  }

  let filteredActivityPool = [...activityPool];

  // goal filtering logic 
  if (goal === "relax") {
    // Prioritize relaxed activities but keep meals
    filteredActivityPool = filteredActivityPool.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "afternoon_rest",
        "shopping",
        "morning_activity",
      ].includes(a.type)
    );
  } else if (goal === "explore") {
    // Prioritize exploration activities but keep meals
    filteredActivityPool = filteredActivityPool.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "morning_activity",
        "outdoor_activity",
        "cultural_site",
        "afternoon_activity",
      ].includes(a.type)
    );
  } else if (goal === "food") {
    // Prioritize food activities but include some sightseeing
    filteredActivityPool = filteredActivityPool.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "morning_activity",
        "shopping",
        "cultural_site",
      ].includes(a.type)
    );
  } else if (goal === "none") {
    // Keep all activities available
    filteredActivityPool = [...activityPool];
  }

  const shuffled = shuffleArray(filteredActivityPool); //shuffles the pool
  let selected = [];

  // Only add activities up to the remaining slots
  for (let i = 0; i < shuffled.length && selected.length < remainingSlots; i++) {
    const activity = shuffled[i];
    const timeKey = dailyStart === "early" ? "early" : "late"; //sets time based on user preference
    const startTime = moment(
      `${currentDate.format("YYYY-MM-DD")} ${activity[timeKey]}`
    );
    const endTime = moment(startTime).add(activity.duration, "minutes");

    // Check for conflicts with ALL existing events (including user-specific ones)
    const hasConflict = events.some((evt) => {
      const evtStart = moment(evt.start_time);
      const evtEnd = moment(evt.end_time);
      
      // More robust overlap detection with buffer time
      return (
        startTime.isBefore(evtEnd.add(15, "minutes")) &&
        endTime.isAfter(evtStart.subtract(15, "minutes"))
      );
    });

    if (!hasConflict) {
      events.push({
        event: activityNames[activity.type],
        date: currentDate.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: `${destination} - ${activity.type.replace("_", " ")}`,
        isSpecified: false,
      });
      selected.push(activity);
    }
  }

  events.sort((a, b) => moment(a.start_time).diff(moment(b.start_time))); //sorts all events
  return adjustOverlappingEvents(events);
}

function adjustOverlappingEvents(events) {
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

function shuffleArray(array) {
  //makes sure each day has different event orders
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
