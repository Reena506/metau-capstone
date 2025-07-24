import {
  category_tips,
  emergency_tips,
  suggestion_types,
  priority_levels,
  outlier_settings,
  suggestion_limits,
} from "./budgetConstants.js";

// Find outlier expenses using allocation-based thresholds
export const findOutliers = (
  expenses,
  categories,
  recommendedBudgetAllocations
) => {
  const outliers = [];

  categories.forEach((category) => {
    const categoryExpenses = expenses.filter(
      (exp) => exp.category === category
    );
    if (categoryExpenses.length < outlier_settings.min_expenses_for_analysis)
      return;

    const amounts = categoryExpenses.map((exp) => parseFloat(exp.amount));
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

    const recommendedPercentage = recommendedBudgetAllocations[category] || 5;
    const baseThreshold = outlier_settings.base_threshold_multiplier;
    const allocationMultiplier = Math.max(
      outlier_settings.min_allocation_multiplier,
      Math.min(
        outlier_settings.max_allocation_multiplier,
        recommendedPercentage / outlier_settings.allocation_scaling_factor
      )
    );
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

// Generate outlier suggestions
export const generateOutlierSuggestions = (outliers) => {
  if (outliers.length === 0) return [];

  const totalOutlierSavings = outliers.reduce(
    (sum, outlier) => sum + outlier.potentialSaving,
    0
  );

  return [
    {
      type: suggestion_types.outliers,
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
      priority: priority_levels.high,
    },
  ];
};

// Generate rebalancing suggestions based on allocations
export const generateRebalancingSuggestions = (
  categorySpending,
  recommendedBudgetAllocations,
  budget
) => {
  const suggestions = [];

  categorySpending.forEach((cat) => {
    const recommendedPercentage =
      recommendedBudgetAllocations[cat.category] || 0;
    const actualPercentage = cat.percentage;
    const deviation = actualPercentage - recommendedPercentage;

    if (deviation > 10) {
      const excessAmount = (deviation / 100) * budget;
      const suggestedReduction = excessAmount * 0.7;

      suggestions.push({
        type: suggestion_types.rebalancing,
        title: `${cat.category} Budget Rebalancing`,
        description: `${cat.category} is ${deviation.toFixed(
          1
        )}% over your target allocation (${actualPercentage.toFixed(
          1
        )}% vs ${recommendedPercentage}% recommended)`,
        items: [
          `Consider reducing ${
            cat.category
          } spending by $${suggestedReduction.toFixed(2)}`,
          `This would bring you closer to your ${recommendedPercentage}% target`,
          `Look for alternatives or bundle deals in ${cat.category}`,
        ],
        priority:
          deviation > 20 ? priority_levels.high : priority_levels.medium,
      });
    }
  });

  return suggestions;
};

// Generate emergency suggestions for critical budget status
export const generateEmergencySuggestions = (
  categorySpending,
  recommendedBudgetAllocations,
  spentPercentage
) => {
  if (spentPercentage < 90) return [];

  const overBudgetCategories = categorySpending
    .filter((cat) => {
      const recommended = recommendedBudgetAllocations[cat.category] || 0;
      return cat.percentage > recommended;
    })
    .sort((a, b) => {
      const aDeviation =
        a.percentage - (recommendedBudgetAllocations[a.category] || 0);
      const bDeviation =
        b.percentage - (recommendedBudgetAllocations[b.category] || 0);
      return bDeviation - aDeviation;
    });

  const emergencyItems = [
    "Pause all non-essential purchases",
    "Review and cancel any planned activities",
    "Look for free alternatives for remaining activities",
  ];

  if (overBudgetCategories.length > 0) {
    const topOverspender = overBudgetCategories[0];
    emergencyItems.push(
      `Immediately reduce ${topOverspender.category} spending - it's your biggest overspend`
    );
  }

  // Add category-specific emergency tips
  const categoryTips = [];
  overBudgetCategories.slice(0, 2).forEach((cat) => {
    const tips = emergency_tips[cat.category] || [
      `Reduce ${cat.category} spending immediately`,
    ];
    categoryTips.push(...tips);
  });

  emergencyItems.push(...categoryTips);

  return [
    {
      type: suggestion_types.emergency,
      title: "Emergency Budget Actions",
      description: "Immediate actions needed to stay within budget",
      items: emergencyItems.slice(0, suggestion_limits.max_emergency_items),
      priority: priority_levels.critical,
    },
  ];
};

// Generate allocation-based suggestions
export const generateAllocationSuggestions = (
  categorySpending,
  recommendedBudgetAllocations,
  budget
) => {
  const suggestions = [];

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
          `You're spending $${excessAmount.toFixed(
            2
          )} more than your ${recommended}% target`,
          `Consider reducing expenses by $${(excessAmount * 0.6).toFixed(
            2
          )} to get back on track`
        );
        const categoryTips = category_tips[cat.category] || [];
        items.push(...categoryTips.slice(0, 2));
      } else {
        const underAmount = Math.abs((deviation / 100) * budget);
        items.push(
          `You're ${Math.abs(deviation).toFixed(1)}% under budget in ${
            cat.category
          }`,
          `You could reallocate $${underAmount.toFixed(
            2
          )} from other categories or enjoy more ${cat.category} experiences`
        );
      }

      suggestions.push({
        type: suggestion_types.allocation,
        title: `${cat.category} Budget Allocation Check`,
        description: `${cat.category}: ${actual.toFixed(
          1
        )}% actual vs ${recommended}% target`,
        items: items,
        priority:
          Math.abs(deviation) > 15
            ? priority_levels.medium
            : priority_levels.low,
      });
    }
  });

  return suggestions;
};

// Generate smart reallocation suggestions
export const generateReallocationSuggestions = (
  categorySpending,
  recommendedBudgetAllocations,
  budget
) => {
  const overBudgetCats = categorySpending.filter((cat) => {
    const recommended = recommendedBudgetAllocations[cat.category] || 0;
    return cat.percentage > recommended + 5;
  });

  const underBudgetCats = categorySpending.filter((cat) => {
    const recommended = recommendedBudgetAllocations[cat.category] || 0;
    return cat.percentage < recommended - 5;
  });

  if (overBudgetCats.length === 0 || underBudgetCats.length === 0) return [];

  const topOver = overBudgetCats[0];
  const topUnder = underBudgetCats[0];
  const suggestedTransfer = Math.min(
    (topOver.percentage - recommendedBudgetAllocations[topOver.category]) / 2,
    (recommendedBudgetAllocations[topUnder.category] - topUnder.percentage) / 2
  );
  const transferAmount = (suggestedTransfer / 100) * budget;

  if (transferAmount <= suggestion_limits.min_reallocation_amount) return [];

  return [
    {
      type: suggestion_limits.reallocation,
      title: "Smart Budget Reallocation",
      description: `Balance your spending between categories`,
      items: [
        `Consider moving $${transferAmount.toFixed(2)} from ${
          topOver.category
        } to ${topUnder.category}`,
        `This would better align with your target allocations`,
        `${topOver.category} would go from ${topOver.percentage.toFixed(
          1
        )}% to ${(topOver.percentage - suggestedTransfer).toFixed(1)}%`,
        `${topUnder.category} would go from ${topUnder.percentage.toFixed(
          1
        )}% to ${(topUnder.percentage + suggestedTransfer).toFixed(1)}%`,
      ],
      priority: priority_levels.medium,
    },
  ];
};

// Main suggestion generation function
export const generateSuggestions = (
  categorySpending,
  spentPercentage,
  expenses,
  categories,
  recommendedBudgetAllocations,
  budget
) => {
  const allSuggestions = [];

  // Find and suggest outliers
  const outliers = findOutliers(
    expenses,
    categories,
    recommendedBudgetAllocations
  );
  allSuggestions.push(...generateOutlierSuggestions(outliers));

  // Generate rebalancing suggestions
  allSuggestions.push(
    ...generateRebalancingSuggestions(
      categorySpending,
      recommendedBudgetAllocations,
      budget
    )
  );

  // Generate emergency suggestions if needed
  allSuggestions.push(
    ...generateEmergencySuggestions(
      categorySpending,
      recommendedBudgetAllocations,
      spentPercentage
    )
  );

  // Generate allocation suggestions
  allSuggestions.push(
    ...generateAllocationSuggestions(
      categorySpending,
      recommendedBudgetAllocations,
      budget
    )
  );

  // Generate reallocation suggestions
  allSuggestions.push(
    ...generateReallocationSuggestions(
      categorySpending,
      recommendedBudgetAllocations,
      budget
    )
  );

  return allSuggestions.slice(0, suggestion_limits.max_suggestions);
};
