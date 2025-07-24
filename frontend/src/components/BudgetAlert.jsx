import React from "react";

const BudgetAlert = ({ budgetAlert, projectionAlert, error }) => {
  return (
    <>
      {error && <div className="budget-error">{error}</div>}

      {budgetAlert && (
        <div className={`budget-alert ${budgetAlert.level}`}>
          {budgetAlert.message}
        </div>
      )}

      {projectionAlert && (
        <div className="budget-alert predictive">{projectionAlert.message}</div>
      )}
    </>
  );
};

export default BudgetAlert;
