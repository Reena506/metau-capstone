import React, { useState, useEffect } from 'react';
const APP_URL = import.meta.env.VITE_APP_URL;

const BudgetSettings = ({
  allocations,
  onSave,
  onReset,
  categories,
  isOpen,
  onClose,
  loading=false,
  tripId,
}) => {
  const [tempAllocations, setTempAllocations] = useState(allocations);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState({});
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load presets from API
  const loadPresets = async () => {
    try {
      setLoadingPresets(true);
      const url = tripId
        ? `${APP_URL}/trips/allocation-presets?tripId=${tripId}`
        : `${APP_URL}/trips/allocation-presets`;
      const response = await fetch(url, {
        credentials: 'include',
        headers:{
            'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load presets');
      }
      
      const data = await response.json();
      setPresets(data.presets);
      setError(null);
    } catch (err) {
      console.error('Error loading presets:', err);
      setError('Failed to load presets');
    } finally {
      setLoadingPresets(false);
    }
  };

  // Update temp allocations when allocations prop changes
  useEffect(() => {
    setTempAllocations(allocations);
  }, [allocations]);

  // Load presets when component opens
  useEffect(() => {
    if (isOpen && Object.keys(presets).length === 0) {
      loadPresets();
    }
  }, [isOpen]);

  const handleChange = (category, value) => {
    setTempAllocations(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
  };

  const total = Object.values(tempAllocations).reduce((sum, val) => sum + val, 0);

  const applyPreset = (presetName) => {
    const preset = presets[presetName];
    if (preset) {
      setTempAllocations(preset);
      setShowPresets(false);
    }
  };

  const handleSave = async () => {
    if (total !== 100) {
      setError('Allocations must sum to 100%');
      return;
    }

    try {
      setSaveLoading(true);
      setError(null);
      const success = await onSave(tempAllocations);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to save allocations');
      }
    } catch (err) {
      console.error('Error saving allocations:', err);
      setError('Failed to save allocations');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetLoading(true);
      setError(null);
      const success = await onReset();
      
      if (success) {
        setError(null);
      } else {
        setError('Failed to reset allocations');
      }
    } catch (err) {
      console.error('Error resetting allocations:', err);
      setError('Failed to reset allocations');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCancel = () => {
    setTempAllocations(allocations);
    setError(null);
    onClose();
  };

  const autoBalance = () => {
    const remaining = 100 - total;
    const numCategories = categories.length;
    const adjustment = Math.floor(remaining / numCategories);
    const remainder = remaining % numCategories;

    const balanced = { ...tempAllocations };
    categories.forEach((category, index) => {
      balanced[category] += adjustment;
      if (index < remainder) {
        balanced[category] += 1;
      }
      // Ensure no negative values
      if (balanced[category] < 0) {
        balanced[category] = 0;
      }
    });

    setTempAllocations(balanced);
  };

  if (!isOpen) return null;

  return (
    <div className="allocation-settings-overlay">
      <div className="allocation-settings">
        <div className="allocation-header">
          <h4>Customize Budget Allocations</h4>
          <button 
            className="close-btn" 
            onClick={handleCancel}
            disabled={saveLoading || resetLoading}
          >
            x
          </button>
        </div>
        
        <div className="allocation-content">
          {error && (
            <div className="allocation-error">
              {error}
            </div>
          )}

          {/* Preset Buttons */}
          <div className="preset-section">
            <button
              className="preset-toggle"
              onClick={() => setShowPresets(!showPresets)}
              disabled={loadingPresets}
            >
               Use Preset {loadingPresets ?  '': (showPresets ? '🔽' : '➡️')}
            </button>
            
            {showPresets && (
              <div className="preset-buttons">
                {loadingPresets ? (
                  <div className="preset-loading">Loading presets...</div>
                ) : (
                  Object.keys(presets).map(presetName => (
                    <button
                      key={presetName}
                      className="preset-btn"
                      onClick={() => applyPreset(presetName)}
                      disabled={saveLoading || resetLoading}
                    >
                      {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Allocation Sliders */}
          <div className="allocation-sliders">
            {categories.map(category => (
              <div key={category} className="allocation-row">
                <div className="allocation-label">
                  <span className="category-name">{category}</span>
                </div>
                <input
                  type="range"
                  className="allocation-slider"
                  min="0"
                  max="60"
                  value={tempAllocations[category] || 0}
                  onChange={(e) => handleChange(category, e.target.value)}
                  disabled={saveLoading || resetLoading || loading}
                />
                <input
                  type="number"
                  className="allocation-input"
                  min="0"
                  max="100"
                  value={tempAllocations[category] || 0}
                  onChange={(e) => handleChange(category, e.target.value)}
                  disabled={saveLoading || resetLoading || loading}
                />
              </div>
            ))}
          </div>
          
          {/* Total and Controls */}
          <div className="allocation-summary">
            <div className={`total-display ${total !== 100 ? 'invalid' : 'valid'}`}>
              <span>Total: {total}%</span>
              {total !== 100 && (
                <span className="total-warning">
                  {total > 100 ? `${total - 100}% over` : `${100 - total}% remaining`}
                </span>
              )}
            </div>
            
            {total !== 100 && (
              <button 
                className="auto-balance-btn" 
                onClick={autoBalance}
                disabled={saveLoading || resetLoading || loading}
              >
                ⚖️ Auto Balance
              </button>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="allocation-actions">
            <button
              className="reset-btn"
              onClick={handleReset}
              disabled={saveLoading || resetLoading || loading}
            >
              {resetLoading ? 'Resetting...' : 'Reset to Default'}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancel}
              disabled={saveLoading || resetLoading}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={total !== 100 || saveLoading || resetLoading || loading}
            >
              {saveLoading ? 'Saving...' : 'Save Allocations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSettings;
