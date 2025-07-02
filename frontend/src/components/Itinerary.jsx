import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Itinerary.css';

const APP_URL = import.meta.env.VITE_APP_URL;
const localizer = momentLocalizer(moment); //formats dates and times

const Itinerary = () => {
  const { tripId } = useParams();
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [eventForm, setEventForm] = useState({
    event: '',
    date: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${APP_URL}/trips/${tripId}/events`, {  //get request to backend API
          method:'GET',
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch events');

        const eventsData = await response.json();
        const transformedEvents = eventsData.map(event => ({
          id: event.id,
          title: event.event,
          start: new Date(event.start_time),  //maps over events and converts into calendar friendly format
          end: new Date(event.end_time),
          resource: {
            location: event.location,  //custom components
            date: event.date,
            originalEvent: event
          }
        }));

        setEvents(transformedEvents);  //updates components state
        setError('');
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchEvents();
    }
  }, [tripId]);//runs only when tripId changes

  const handleSelectSlot = ({ start, end }) => {  //user clicks on time slot and sets up form
    setSelectedEvent(null);
    setIsEditing(false);
    setEventForm({
      event: '',
      date: moment(start).format('YYYY-MM-DD'),
      start_time: moment(start).format('YYYY-MM-DDTHH:mm'),
      end_time: moment(end).format('YYYY-MM-DDTHH:mm'),
      location: ''
    });
    setShowEventModal(true);
  };

  const handleSelectEvent = (event) => {   //user clicks on existing event to view and edit
    setSelectedEvent(event); 
    setIsEditing(true);
    setEventForm({
      event: event.resource.originalEvent.event,
      date: moment(event.resource.originalEvent.date).format('YYYY-MM-DD'),
      start_time: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      end_time: moment(event.end).format('YYYY-MM-DDTHH:mm'),
      location: event.resource.originalEvent.location
    });
    setShowEventModal(true);
  };

  const handleInputChange = (e) => {     //updates eventform
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchAndUpdateEvents = async () => {     //used in save and delete to uppdate events
    try {
      setLoading(true);
      const response = await fetch(`${APP_URL}/trips/${tripId}/events`, {
        credentials: 'include'
      });
      const data = await response.json();
      const formatted = data.map(event => ({
        id: event.id,
        title: event.event,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        resource: {
          location: event.location,
          date: event.date,
          originalEvent: event
        }
      }));
      setEvents(formatted);
      setError('');
    } catch (err) {
      setError('Failed to refresh events');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (e) => {   //checks for required fields and sends post for new event or put to edit event
    e.preventDefault();

    if (!eventForm.event || !eventForm.location || !eventForm.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        ...eventForm,
        date: new Date(eventForm.date).toISOString(),
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: new Date(eventForm.end_time).toISOString()
      };

      const url = isEditing && selectedEvent
        ? `${APP_URL}/trips/${tripId}/events/${selectedEvent.id}`
        : `${APP_URL}/trips/${tripId}/events`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });

      if (!response.ok) throw new Error('Failed to save event');

      await fetchAndUpdateEvents();
      setShowEventModal(false);
      setError('');
    } catch (err) {
      setError('Failed to save event');
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {                             //sends delete request 
    if (!selectedEvent || !window.confirm('Delete this event?')) return;     //asks user for confirmation

    try {
      setLoading(true);
      const response = await fetch(`${APP_URL}/trips/${tripId}/events/${selectedEvent.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete event');

      await fetchAndUpdateEvents();
      setShowEventModal(false);
      setError('');
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    } finally {
      setLoading(false);
    }
  };

  const EventComponent = ({ event }) => (     //shows title and location on calendar
    <div className="custom-event">
      <strong>{event.title}</strong>
      <div className="event-location">📍 {event.resource.location}</div>
    </div>
  );

  return (
    <div className="itinerary-calendar-container">
      {loading && (
        <div className="loading-overlay">
          <div>Loading...</div>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['week', 'day']}
        step={30}
        timeslots={2}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        components={{ event: EventComponent }}
      />

      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? 'Edit Event' : 'New Event'}
              </h2>
              <button className="close-button" onClick={() => setShowEventModal(false)}>
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  name="event"
                  value={eventForm.event}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={eventForm.location}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={eventForm.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={eventForm.start_time}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={eventForm.end_time}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="button-group">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Itinerary;


