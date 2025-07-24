import React, { useEffect, useState } from "react";
import "./BudgetSuggestions.css";
import BudgetSettings from "./BudgetSettings";
import BudgetAlert from "./BudgetAlert";
import SuggestionCard from "./SuggestionCard";
import { default_budget_allocations } from "../utils/budgetConstants";
import { loadBudgetAllocations, saveBudgetAllocations, resetBudgetAllocations } from "../utils/budgetAPI";
import { analyzeBudget, predictOverspending } from "../utils/budgetAnalysis";
import { generateSuggestions } from "../utils/budgetSugg";

const BudgetSuggestions = ({ expenses, budget, categories, tripId, tripStart, tripEnd }) => {
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectionAlert, setProjectionAlert] = useState(null);
  const [recommendedBudgetAllocations, setRecommendedBudgetAllocations] = useState(default_budget_allocations);

  // Load budget allocations from API
  const handleLoadBudgetAllocations = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      const allocations = await loadBudgetAllocations(tripId);
      setRecommendedBudgetAllocations(allocations);
      setError(null);
    } catch (err) {
      console.error('Error loading budget allocations:', err);
      setError('Failed to load budget allocations');
    } finally {
      setLoading(false);
    }
  };

  // Save budget allocations to API
  const handleSaveBudgetAllocations = async (newAllocations) => {
    if (!tripId) return false;
    
    try {
      setLoading(true);
      const allocations = await saveBudgetAllocations(tripId, newAllocations);
      setRecommendedBudgetAllocations(allocations);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error saving budget allocations:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset budget allocations to default
  const handleResetBudgetAllocations = async () => {
    if (!tripId) return false;
    
    try {
      setLoading(true);
      const allocations = await resetBudgetAllocations(tripId);
      setRecommendedBudgetAllocations(allocations);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error resetting budget allocations:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Analyze budget and generate suggestions
  const performBudgetAnalysis = () => {
    const analysis = analyzeBudget(expenses, budget, categories);
    
    setBudgetAlert(analysis.budgetAlert);

    if (analysis.shouldGenerateSuggestions) {
      const newSuggestions = generateSuggestions(
        analysis.categorySpending,
        analysis.spentPercentage,
        expenses,
        categories,
        recommendedBudgetAllocations,
        budget
      );
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle overspending prediction
  const handlePredictOverspending = () => {
    const prediction = predictOverspending(expenses, budget, tripStart, tripEnd);
    setProjectionAlert(prediction);
  };

  // Load allocations on component mount
  useEffect(() => {
    handleLoadBudgetAllocations();
  }, [tripId]);

  // Run budget analysis when data changes
  useEffect(() => {
    if (Object.keys(recommendedBudgetAllocations).length > 0) {
      performBudgetAnalysis();
    }
  }, [expenses, budget, recommendedBudgetAllocations]);

  // Update prediction when expenses change
  useEffect(() => {
    handlePredictOverspending();
  }, [expenses, tripStart, tripEnd]);

  return (
    <>
      <BudgetAlert 
        budgetAlert={budgetAlert}
        projectionAlert={projectionAlert}
        error={error}
      />

      <div className="budget-suggestions-header">
        <h3>Budget Suggestions</h3>
        <button
          className="setttings-btn"
          onClick={() => setShowSettings(true)}
          title="Customize budget allocations"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Customize Budget Allocation'}
        </button>
      </div>
      <BudgetSettings
        allocations={recommendedBudgetAllocations}
        onSave={handleSaveBudgetAllocations}
        onReset={handleResetBudgetAllocations}
        categories={categories}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        loading={loading}
      />
      {suggestions.length > 0 && (
        <div className="budget-suggestions-section">
          <div className="suggestions-container">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard 
                key={index} 
                suggestion={suggestion} 
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetSuggestions;

