import { alert_thresholds } from "./budgetConstants.js";

// Calculate spending per category
export const calculateCategorySpending = (expenses, categories, budget) => {
  return categories
    .map((category) => {
      const categoryTotal = expenses
        .filter((exp) => exp.category === category)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      return {
        category,
        total: categoryTotal,
        percentage: budget > 0 ? (categoryTotal / budget) * 100 : 0,
        count: expenses.filter((exp) => exp.category === category).length,
      };
    })
    .filter((item) => item.total > 0);
};

// Determine budget alert level and message
export const determineBudgetAlert = (totalSpent, budget) => {
  const remaining = budget - totalSpent;
  const spentPercentage = (totalSpent / budget) * 100;

  let alertLevel = "";
  let alertMessage = "";

  if (spentPercentage >= alert_thresholds.exceeded) {
    alertLevel = "exceeded";
    alertMessage = `Budget exceeded by $${Math.abs(remaining).toFixed(2)}!`;
  } else if (spentPercentage >= alert_thresholds.critical) {
    alertLevel = "critical";
    alertMessage = `Critical: Only $${remaining.toFixed(2)} remaining (${(
      100 - spentPercentage
    ).toFixed(1)}% left)`;
  } else if (spentPercentage >= alert_thresholds.warning) {
    alertLevel = "warning";
    alertMessage = `Warning: $${remaining.toFixed(2)} remaining (${(
      100 - spentPercentage
    ).toFixed(1)}% left)`;
  } else if (spentPercentage >= alert_thresholds.caution) {
    alertLevel = "caution";
    alertMessage = `Caution: $${remaining.toFixed(2)} remaining (${(
      100 - spentPercentage
    ).toFixed(1)}% left)`;
  }

  return alertLevel ? { level: alertLevel, message: alertMessage } : null;
};

// Main budget analysis function
export const analyzeBudget = (expenses, budget, categories) => {
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const remaining = budget - totalSpent;
  const spentPercentage = (totalSpent / budget) * 100;

  const categorySpending = calculateCategorySpending(
    expenses,
    categories,
    budget
  );
  const budgetAlert = determineBudgetAlert(totalSpent, budget);

  return {
    totalSpent,
    remaining,
    spentPercentage,
    categorySpending,
    budgetAlert,
    shouldGenerateSuggestions: spentPercentage >= alert_thresholds.caution,
  };
};

// Predict overspending based on current pace
export const predictOverspending = (expenses, budget, tripStart, tripEnd) => {
  if (!tripStart || !tripEnd || expenses.length === 0) return null;

  const start = new Date(tripStart);
  const end = new Date(tripEnd);
  const now = new Date();

  const totalTripDays = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  );
  const daysElapsed = Math.max(
    1,
    Math.ceil((now - start) / (1000 * 60 * 60 * 24))
  );

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgDailySpend = totalSpent / daysElapsed;
  const projectedTotalSpend = avgDailySpend * totalTripDays;

  const overrun = projectedTotalSpend - budget;

  if (projectedTotalSpend > budget) {
    return {
      level: "high",
      message: `At your current rate, you'll exceed your budget by $${overrun.toFixed(
        2
      )}. Consider adjusting your spending pace.`,
      projectedTotal: projectedTotalSpend,
      overrun,
    };
  }

  return null;
};
