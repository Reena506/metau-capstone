import React, { useEffect, useState } from "react";
import "./BudgetSuggestions.css";
import BudgetSettings from "./BudgetSettings";
const APP_URL = import.meta.env.VITE_APP_URL;
const BudgetSuggestions = ({ expenses, budget, categories, tripId, tripStart, tripEnd }) => {
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectionAlert, setProjectionAlert]=useState(null);

  const [recommendedBudgetAllocations, setRecommendedBudgetAllocations] = useState({
    Food: 30,
    Transport: 10,
    Lodging: 25,
    Activities: 20,
    Shopping: 10,
    Other: 5,
  });
  
  // Load budget allocations from API
  const loadBudgetAllocations = async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const response = await fetch(`${APP_URL}/trips/${tripId}/budget-allocations`,{
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load budget allocations');
      }
      
      const data = await response.json();
      setRecommendedBudgetAllocations(data.allocations);
      setError(null);
    } catch (err) {
      console.error('Error loading budget allocations:', err);
      setError('Failed to load budget allocations');
    } finally {
      setLoading(false);
    }
  };

  // Save budget allocations to API
  const saveBudgetAllocations = async (newAllocations) => {
    if (!tripId) return false;
    
    try {
      setLoading(true);
      const response =  await fetch(`${APP_URL}/trips/${tripId}/budget-allocations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials:'include',
        body: JSON.stringify({
          allocations: newAllocations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save budget allocations');
      }

      const data = await response.json();
      setRecommendedBudgetAllocations(data.allocations);
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
  const resetBudgetAllocations = async () => {
    if (!tripId) return false;
    
    try {
      setLoading(true);
      const response = await fetch(`${APP_URL}/trips/${tripId}/budget-allocations`, {
        method: 'DELETE',
        credentials:'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset budget allocations');
      }

      const data = await response.json();
      setRecommendedBudgetAllocations(data.allocations);
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

  const analyzeBudget = () => {
    const totalSpent = expenses.reduce(
      //sums all expenses in order to find remaining and spentPercntage
      (sum, e) => sum + parseFloat(e.amount),
      0
    );
    const remaining = budget - totalSpent;
    const spentPercentage = (totalSpent / budget) * 100;

    // calculate spending per category
    const categorySpending = categories
      .map((category) => {
        const categoryTotal = expenses //filters expenses to category and sums their amounts
          .filter((exp) => exp.category === category)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        return {
          //returns an object
          category,
          total: categoryTotal,
          percentage: budget > 0 ? (categoryTotal / budget) * 100 : 0,
          count: expenses.filter((exp) => exp.category === category).length,
        };
      })
      .filter((item) => item.total > 0); //filters out categories with zero spending

    // Detect budget status
    let alertLevel = "";
    let alertMessage = "";

    if (spentPercentage >= 100) {
      alertLevel = "exceeded";
      alertMessage = `Budget exceeded by $${Math.abs(remaining).toFixed(2)}!`;
    } else if (spentPercentage >= 90) {
      alertLevel = "critical";
      alertMessage = `Critical: Only $${remaining.toFixed(2)} remaining (${(
        100 - spentPercentage
      ).toFixed(1)}% left)`;
    } else if (spentPercentage >= 75) {
      alertLevel = "warning";
      alertMessage = `Warning: $${remaining.toFixed(2)} remaining (${(
        100 - spentPercentage
      ).toFixed(1)}% left)`;
    } else if (spentPercentage >= 50) {
      alertLevel = "caution";
      alertMessage = `Caution: $${remaining.toFixed(2)} remaining (${(
        100 - spentPercentage
      ).toFixed(1)}% left)`;
    }

    setBudgetAlert(
      alertLevel ? { level: alertLevel, message: alertMessage } : null
    ); //updates alert state

    // Generate suggestions if budget is concerning
    if (spentPercentage >= 50) {
      generateSuggestions(
        categorySpending,
        totalSpent,
        remaining,
        spentPercentage
      );
    } else {
      setSuggestions([]);
    }
  };

  const generateSuggestions = (categorySpending, spentPercentage) => {
    const newSuggestions = [];

    // Find outliers
    const outliers = findOutliers();
    if (outliers.length > 0) {
      const totalOutlierSavings = outliers.reduce(
        (sum, outlier) => sum + outlier.potentialSaving,
        0
      );
      newSuggestions.push({
        type: "outliers",
        title: "High-Value Outliers Detected",
        description: `Found ${
          outliers.length
        } unusually high expenses that could save you $${totalOutlierSavings.toFixed(
          2
        )}`,
        items: outliers.map(
          (outlier) =>
            `${outlier.title} ($${outlier.amount.toFixed(
              2
            )}) - $${outlier.potentialSaving.toFixed(2)} above average`
        ),
        priority: "high",
      });
    }

    // Dynamic category rebalancing based on allocations
    categorySpending.forEach((cat) => {
      const recommendedPercentage = recommendedBudgetAllocations[cat.category] || 0;
      const actualPercentage = cat.percentage;
      const deviation = actualPercentage - recommendedPercentage;
     
      // If spending significantly more than recommended allocation
      if (deviation > 10) {
        const excessAmount = (deviation / 100) * budget;
        const suggestedReduction = excessAmount * 0.7; // Suggest reducing 70% of excess
       
        newSuggestions.push({
          type: "rebalancing",
          title: `${cat.category} Budget Rebalancing`,
          description: `${cat.category} is ${deviation.toFixed(1)}% over your target allocation (${actualPercentage.toFixed(1)}% vs ${recommendedPercentage}% recommended)`,
          items: [
            `Consider reducing ${cat.category} spending by $${suggestedReduction.toFixed(2)}`,
            `This would bring you closer to your ${recommendedPercentage}% target`,
            `Look for alternatives or bundle deals in ${cat.category}`,
          ],
          priority: deviation > 20 ? "high" : "medium",
        });
      }
    });

    //frequency-based suggestions using allocations
    const frequentCategories = categorySpending.filter((cat) => cat.count >= 3);
    frequentCategories.forEach((cat) => {
      const avgExpense = cat.total / cat.count;
      const recommendedPercentage = recommendedBudgetAllocations[cat.category] || 0;
      const recommendedTotal = (recommendedPercentage / 100) * budget;
      const recommendedAvg = cat.count > 0 ? recommendedTotal / cat.count : 0;
     
      // If average expense is significantly higher than what the allocation would suggest
      if (avgExpense > recommendedAvg * 1.3) {
        const targetAverage = recommendedAvg;
        newSuggestions.push({
          type: "frequency",
          title: `${cat.category} Frequent Expense Optimization`,
          description: `Your ${cat.count} ${cat.category} expenses average $${avgExpense.toFixed(2)}, above your target of $${targetAverage.toFixed(2)} per expense`,
          items: [
            `Try to limit each ${cat.category} expense to $${targetAverage.toFixed(2)}`,
            `Look for bulk discounts or packages for ${cat.category}`,
            `Research alternative options in ${cat.category}`,
          ],
          priority: "medium",
        });
      }
    });

    //  Emergency suggestions for critical budget status
    if (spentPercentage >= 90) {
      // Identify categories that are most over budget to prioritize cuts
      const overBudgetCategories = categorySpending
        .filter(cat => {
          const recommended = recommendedBudgetAllocations[cat.category] || 0;
          return cat.percentage > recommended;
        })
        .sort((a, b) => {
          const aDeviation = a.percentage - (recommendedBudgetAllocations[a.category] || 0);
          const bDeviation = b.percentage - (recommendedBudgetAllocations[b.category] || 0);
          return bDeviation - aDeviation;
        });

      const emergencyItems = [
        "Pause all non-essential purchases",
        "Review and cancel any planned activities",
        "Look for free alternatives for remaining activities",
      ];

      // Add specific suggestions for most over-budget categories
      if (overBudgetCategories.length > 0) {
        const topOverspender = overBudgetCategories[0];
        emergencyItems.push(`Immediately reduce ${topOverspender.category} spending - it's your biggest overspend`);
      }

      emergencyItems.push(...getCategorySpecificEmergencyTips(overBudgetCategories));

      newSuggestions.push({
        type: "emergency",
        title: "Emergency Budget Actions",
        description: "Immediate actions needed to stay within budget",
        items: emergencyItems.slice(0, 6), // Limit to 6 items
        priority: "critical",
      });
    }

    // Enhanced allocation-based suggestions
    categorySpending.forEach((cat) => {
      const recommended = recommendedBudgetAllocations[cat.category];
      if (!recommended) return;

      const actual = cat.percentage;
      const deviation = actual - recommended;

      if (Math.abs(deviation) > 5) {
        const items = [];
       
        if (deviation > 0) {
          const excessAmount = (deviation / 100) * budget;
          items.push(
            `You're spending $${excessAmount.toFixed(2)} more than your ${recommended}% target`,
            `Consider reducing expenses by $${(excessAmount * 0.6).toFixed(2)} to get back on track`
          );
          items.push(...getCategorySpecificTips(cat.category).slice(0, 2));
        } else {
          const underAmount = Math.abs((deviation / 100) * budget);
          items.push(
            `You're ${Math.abs(deviation).toFixed(1)}% under budget in ${cat.category}`,
            `You could reallocate $${underAmount.toFixed(2)} from other categories or enjoy more ${cat.category} experiences`
          );
        }

        newSuggestions.push({
          type: "allocation",
          title: `${cat.category} Budget Allocation Check`,
          description: `${cat.category}: ${actual.toFixed(1)}% actual vs ${recommended}% target`,
          items: items,
          priority: Math.abs(deviation) > 15 ? "medium" : "low",
        });
      }
    });

    // reallocation suggestions between categories
    const overBudgetCats = categorySpending.filter(cat => {
      const recommended = recommendedBudgetAllocations[cat.category] || 0;
      return cat.percentage > recommended + 5;
    });

    const underBudgetCats = categorySpending.filter(cat => {
      const recommended = recommendedBudgetAllocations[cat.category] || 0;
      return cat.percentage < recommended - 5;
    });

    if (overBudgetCats.length > 0 && underBudgetCats.length > 0) {
      const topOver = overBudgetCats[0];
      const topUnder = underBudgetCats[0];
      const suggestedTransfer = Math.min(
        (topOver.percentage - recommendedBudgetAllocations[topOver.category]) / 2,
        (recommendedBudgetAllocations[topUnder.category] - topUnder.percentage) / 2
      );
      const transferAmount = (suggestedTransfer / 100) * budget;

      if (transferAmount > 10) { // Only suggest if meaningful amount
        newSuggestions.push({
          type: "reallocation",
          title: "Smart Budget Reallocation",
          description: `Balance your spending between categories`,
          items: [
            `Consider moving $${transferAmount.toFixed(2)} from ${topOver.category} to ${topUnder.category}`,
            `This would better align with your target allocations`,
            `${topOver.category} would go from ${topOver.percentage.toFixed(1)}% to ${(topOver.percentage - suggestedTransfer).toFixed(1)}%`,
            `${topUnder.category} would go from ${topUnder.percentage.toFixed(1)}% to ${(topUnder.percentage + suggestedTransfer).toFixed(1)}%`
          ],
          priority: "medium",
        });
      }
    }

    setSuggestions(newSuggestions.slice(0, 5)); // Increased to 5 suggestions
  };

  // Enhanced outlier detection using category allocations
  const findOutliers = () => {
    const outliers = [];

    categories.forEach((category) => {
      const categoryExpenses = expenses.filter(
        (exp) => exp.category === category
      );
      if (categoryExpenses.length < 2) return;

      const amounts = categoryExpenses.map((exp) => parseFloat(exp.amount));
      const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
     
      // Use allocation-based threshold: if category has higher allocation, allow higher variance
      const recommendedPercentage = recommendedBudgetAllocations[category] || 5;
      const baseThreshold = 1.5; // 50% above average
      const allocationMultiplier = Math.max(0.8, Math.min(1.5, recommendedPercentage / 20)); // Scale based on allocation
      const threshold = average * (baseThreshold * allocationMultiplier);

      categoryExpenses.forEach((expense) => {
        const amount = parseFloat(expense.amount);
        if (amount > threshold) {
          outliers.push({
            ...expense,
            amount,
            category,
            average,
            potentialSaving: amount - average,
          });
        }
      });
    });

    return outliers.sort((a, b) => b.potentialSaving - a.potentialSaving);
  };

  // Get emergency tips based on over-budget categories
  const getCategorySpecificEmergencyTips = (overBudgetCategories) => {
    const tips = [];
    overBudgetCategories.slice(0, 2).forEach(cat => {
      const categoryTips = {
        Food: ["Cook instead of dining out", "Look for happy hour specials"],
        Transport: ["Use public transport only", "Walk when possible"],
        Lodging: ["Avoid room service/extras", "Look for immediate check-out savings"],
        Activities: ["Cancel paid activities", "Find free alternatives"],
        Shopping: ["Stop all shopping immediately", "Return recent purchases if possible"],
        Other: ["Cut all miscellaneous expenses", "Postpone non-essentials"]
      };
     
      const categorySpecificTips = categoryTips[cat.category] || [`Reduce ${cat.category} spending immediately`];
      tips.push(...categorySpecificTips);
    });
   
    return tips;
  };
  const predictOverspending = () => {
  if (!tripStart || !tripEnd || expenses.length === 0) return;

  const start = new Date(tripStart);
  const end = new Date(tripEnd); 
  const now = new Date();

  const totalTripDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgDailySpend = totalSpent / daysElapsed;
  const projectedTotalSpend = avgDailySpend * totalTripDays;

  const overrun = projectedTotalSpend - budget;

  if (projectedTotalSpend > budget) {
    setProjectionAlert({
      level: "high",
      message: `At your current rate, you'll exceed your budget by $${overrun.toFixed(2)}. Consider adjusting your spending pace.`,
    });
  } else {
    setProjectionAlert(null);
  }
};


useEffect(()=>{
  predictOverspending();
},[expenses, tripStart, tripEnd])

  // Get category-specific money-saving tips
  const getCategorySpecificTips = (category) => {
    const tips = {
      Food: [
        "Cook meals instead of dining out",
        "Look for lunch specials and happy hour deals",
        "Share large portions with others",
        "Visit local markets for affordable snacks",
      ],
      Transport: [
        "Use public transportation instead of ubers/lyfts",
        "Walk or bike for short distances",
        "Look for transportation passes",
        "Share rides with other travelers in your group",
      ],
      Lodging: [
        "Consider staying slightly outside the city",
        "Look for accommodations with kitchen facilities",
        "Book longer stays for better rates",
        "Check for last-minute deals",
      ],
      Activities: [
        "Look for free tours and attractions",
        "Check for student or other group discounts",
        "Visit during off-peak hours",
        "Look for city tourism cards with bundled attractions",
      ],
      Shopping: [
        "Set a daily shopping limit",
        "Focus on unique local items only",
        "Compare prices at different stores",
        "Avoid impulse purchases",
      ],
      Other: [
        "Review miscellaneous expenses for necessities",
        "Look for free alternatives",
        "Bundle services when possible",
      ],
    };

    return tips[category] || [];
  };

  const handleSaveAllocations = async (newAllocations) => {
    const success = await saveBudgetAllocations(newAllocations);
    return success;
  };

  const handleResetAllocations = async () => {
    const success = await resetBudgetAllocations();
    return success;
  };

  useEffect(() => {
    loadBudgetAllocations();
  }, [tripId]);

  // Run budget analysis whenever expenses, budget, or allocations change
  useEffect(() => {
    if (Object.keys(recommendedBudgetAllocations).length > 0) {
      analyzeBudget();
    }
  }, [expenses, budget, recommendedBudgetAllocations]);

  return (
    <>
      {error && (
        <div className="budget-error">
          {error}
        </div>
      )}
      {budgetAlert && (
        <div className={`budget-alert ${budgetAlert.level}`}>
          {budgetAlert.message}
        </div>
      )}
      {projectionAlert&&(
        <div className="budget-alert predictive">
          {projectionAlert.message}
        </div>
      )}
      {/* settings */}
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
        onSave={handleSaveAllocations}
        onReset={handleResetAllocations}
        categories={categories}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        loading={loading}
      />
      {suggestions.length > 0 && (
        <div className="budget-suggestions-section">
          <div className="suggestions-container">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-card ${suggestion.priority}`}
              >
                <h4 className="suggestion-title">{suggestion.title}</h4>
                <p className="suggestion-description">
                  {suggestion.description}
                </p>
                <ul className="suggestion-items">
                  {suggestion.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetSuggestions;
