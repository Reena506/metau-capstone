// Default budget allocation percentages
export const default_budget_allocations = {
  Food: 30,
  Transport: 10,
  Lodging: 25,
  Activities: 20,
  Shopping: 10,
  Other: 5,
};

// Budget alert thresholds
export const alert_thresholds = {
  exceeded: 100,
  critical: 90,
  warning: 75,
  caution: 50,
};

// Category-specific money-saving tips
export const category_tips = {
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

// Emergency tips by category
export const emergency_tips = {
  Food: ["Cook instead of dining out", "Look for happy hour specials"],
  Transport: ["Use public transport only", "Walk when possible"],
  Lodging: [
    "Avoid room service/extras",
    "Look for immediate check-out savings",
  ],
  Activities: ["Cancel paid activities", "Find free alternatives"],
  Shopping: [
    "Stop all shopping immediately",
    "Return recent purchases if possible",
  ],
  Other: ["Cut all miscellaneous expenses", "Postpone non-essentials"],
};

// Suggestion types and priorities
export const suggestion_types = {
  outliers: "outliers",
  rebalancing: "rebalancing",
  frequency: "frequency",
  emergency: "emergency",
  allocation: "allocation",
  reallocation: "reallocation",
};

export const priority_levels = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

// Outlier detection settings
export const outlier_settings = {
  min_expenses_for_analysis: 2,
  base_threshold_multiplier: 1.5, // 50% above average
  min_allocation_multiplier: 0.8,
  max_allocation_multiplier: 1.5,
  allocation_scaling_factor: 20,
};

// Suggestion limits
export const suggestion_limits = {
  max_suggestions: 5,
  max_emergency_items: 6,
  min_reallocation_amount: 10,
};
