import React, { useEffect, useState } from "react";
import "./BudgetSuggestions.css";

const BudgetSuggestions = ({ expenses, budget, categories }) => {
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

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

    // Sort categories by spending (highest first)
    const sortedCategories = [...categorySpending].sort(
      (a, b) => b.total - a.total
    );

    // Identify outliers
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

    //  Category rebalancing suggestions
    if (sortedCategories.length > 1) {
      const topCategory = sortedCategories[0]; //gets top category

      if (topCategory.percentage > 40) {
        //if top category is 40% or above of total budget suggest 20% reduction
        const suggestedReduction = topCategory.total * 0.2;
        newSuggestions.push({
          type: "rebalancing",
          title: " Budget Rebalancing Opportunity",
          description: `${
            topCategory.category
          } accounts for ${topCategory.percentage.toFixed(1)}% of your budget`,
          items: [
            `Consider reducing ${
              topCategory.category
            } spending by $${suggestedReduction.toFixed(2)}`,
            `This would free up ${((suggestedReduction / budget) * 100).toFixed(
              1
            )}% of your budget`,
            `Look for alternatives or bundle deals in ${topCategory.category}`,
          ],
          priority: topCategory.percentage > 50 ? "high" : "medium",
        });
      }
    }

    //  Frequency-based suggestions
    //if there are more than 3 in a category and avg is obove 50 it is a frequent expense
    const frequentCategories = categorySpending.filter((cat) => cat.count >= 3);
    frequentCategories.forEach((cat) => {
      const avgExpense = cat.total / cat.count;
      if (avgExpense > 50) {
        newSuggestions.push({
          type: "frequency",
          title: " Frequent Expense Optimization",
          description: `You have ${cat.count} ${
            cat.category
          } expenses averaging $${avgExpense.toFixed(2)}`,
          items: [
            `Look for bulk discounts or packages for ${cat.category}`,
            `Consider setting a daily limit of $${(avgExpense * 0.8).toFixed(
              2
            )} for ${cat.category}`,
            `Research alternative options in ${cat.category}`,
          ],
          priority: "medium",
        });
      }
    });

    //  Emergency suggestions for critical budget status
    if (spentPercentage >= 90) {
      newSuggestions.push({
        type: "emergency",
        title: " Emergency Budget Actions",
        description: "Immediate actions needed to stay within budget",
        items: [
          "Pause all non-essential purchases",
          "Review and cancel any planned activities",
          "Look for free alternatives for remaining activities",
          "Consider cooking instead of dining out",
          "Use public transport instead of ubers/lyfts",
        ],
        priority: "critical",
      });
    }

    //  category-specific suggestions
    //if a category is more than 25% of sbudget provide specific suggestiosn
    categorySpending.forEach((cat) => {
      if (cat.percentage > 25) {
        const categoryTips = getCategorySpecificTips(cat.category, cat.total);
        if (categoryTips.length > 0) {
          newSuggestions.push({
            type: "category-specific",
            title: ` ${cat.category} Optimization Tips`,
            description: `${cat.category} is ${cat.percentage.toFixed(
              1
            )}% of your budget`,
            items: categoryTips,
            priority: "medium",
          });
        }
      }
    });

    setSuggestions(newSuggestions.slice(0, 4)); // Limit to 4 suggestions 
  };

  // Find outlier expenses
  //if there are more than 2 expenses in the category, find the average of the expenses, if an expense is 50% above the average, it is an outlier
  const findOutliers = () => {
    const outliers = [];

    categories.forEach((category) => {
      const categoryExpenses = expenses.filter(
        (exp) => exp.category === category
      );
      if (categoryExpenses.length < 2) return;

      const amounts = categoryExpenses.map((exp) => parseFloat(exp.amount));
      const average =
        amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const threshold = average * 1.5; // 50% above average

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

  // Run budget analysis whenever expenses or budget changes
  useEffect(() => {
    analyzeBudget();
  }, [expenses, budget]);

  return (
    <>
      {/* Budget Alert */}
      {budgetAlert && (
        <div className={`budget-alert ${budgetAlert.level}`}>
          {budgetAlert.message}
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="budget-suggestions-section">
          <h3>Budget Suggestions</h3>
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
