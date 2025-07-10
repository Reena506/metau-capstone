import React, { useState } from 'react';
import { generateItinerary } from '../utils/generateItinerary';

const ItineraryModal = ({
  isOpen,
  onClose,
  onGenerate,
  loading,
  error
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    scheduleStyle: 'moderate',
    dailyStart: 'early',
    specificPlaces: [{ place: '', day: '', time: '' }],
    destination: '',
    goal: 'none'
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSpecificPlaceChange = (index, field, value) => {
    const newSpecificPlaces = [...formData.specificPlaces];
    newSpecificPlaces[index][field] = value;
    setFormData(prev => ({
      ...prev,
      specificPlaces: newSpecificPlaces
    }));
  };

  const addSpecificPlace = () => {
    setFormData(prev => ({
      ...prev,
      specificPlaces: [...prev.specificPlaces, { place: '', day: '', time: '' }]
    }));
  };

  const removeSpecificPlace = (index) => {
    if (formData.specificPlaces.length > 1) {
      setFormData(prev => ({
        ...prev,
        specificPlaces: prev.specificPlaces.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    // Specific places validation
    const tripStart = new Date(formData.startDate);
    const tripEnd = new Date(formData.endDate);
    
    formData.specificPlaces.forEach((place, index) => {
      if (place.place && place.day) {
        const placeDate = new Date(place.day);
        if (placeDate < tripStart || placeDate > tripEnd) {
          errors[`specificPlace_${index}`] = 'Date must be within trip dates';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
    
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const generatedEvents = generateItinerary(formData);
    onGenerate(generatedEvents);
  };

  const resetForm = () => {
    setFormData({
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '18:00',
      scheduleStyle: 'moderate',
      dailyStart: 'early',
      specificPlaces: [{ place: '', day: '', time: '' }],
      destination: '',
      goal: 'none' 
    });
    setValidationErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Generate Your Itinerary</h2>
          <button className="close-button" onClick={handleClose}>
            x
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>Trip Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.destination ? 'error' : ''}`}
                placeholder="e.g., Paris, Tokyo, New York"
                required
              />
              {validationErrors.destination && (
                <div className="validation-error">{validationErrors.destination}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.startDate ? 'error' : ''}`}
                required
              />
              {validationErrors.startDate && (
                <div className="validation-error">{validationErrors.startDate}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.endDate ? 'error' : ''}`}
                required
              />
              {validationErrors.endDate && (
                <div className="validation-error">{validationErrors.endDate}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Your Preferences</h3>
          <div className="form-group">
            <label className="form-label">Schedule Style</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="scheduleStyle"
                  value="relaxed"
                  checked={formData.scheduleStyle === 'relaxed'}
                  onChange={handleInputChange}
                />
                Relaxed (3 events/day)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="scheduleStyle"
                  value="moderate"
                  checked={formData.scheduleStyle === 'moderate'}
                  onChange={handleInputChange}
                />
                Moderate (5 events/day)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="scheduleStyle"
                  value="busy"
                  checked={formData.scheduleStyle === 'busy'}
                  onChange={handleInputChange}
                />
                Busy (7 events/day)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Daily Start Preference</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="dailyStart"
                  value="early"
                  checked={formData.dailyStart === 'early'}
                  onChange={handleInputChange}
                />
                Early Bird (Start around 8 AM)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="dailyStart"
                  value="late"
                  checked={formData.dailyStart === 'late'}
                  onChange={handleInputChange}
                />
                Night Owl (Start around 10 AM)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Travel Goal</label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="none">None</option>
              <option value="relax">Relax</option>
              <option value="explore">Explore</option>
              <option value="food">Foodie</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Specific Places (Optional)</h3>
          {formData.specificPlaces.map((place, index) => (
            <div key={index} className="specific-place-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Place name"
                  value={place.place}
                  onChange={(e) => handleSpecificPlaceChange(index, 'place', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  value={place.day}
                  onChange={(e) => handleSpecificPlaceChange(index, 'day', e.target.value)}
                  className={`form-input ${validationErrors[`specificPlace_${index}`] ? 'error' : ''}`}
                />
                {validationErrors[`specificPlace_${index}`] && (
                  <div className="validation-error">{validationErrors[`specificPlace_${index}`]}</div>
                )}
              </div>
              <div className="form-group">
                <input
                  type="time"
                  value={place.time}
                  onChange={(e) => handleSpecificPlaceChange(index, 'time', e.target.value)}
                  className="form-input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSpecificPlace(index)}
                className="btn btn-danger btn-small"
                disabled={formData.specificPlaces.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSpecificPlace}
            className="btn btn-secondary"
          >
            Add Specific Place
          </button>
        </div>

        <div className="button-group">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Itinerary'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryModal;

