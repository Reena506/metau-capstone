import React from "react";

const SuggestionCard = ({ suggestion }) => {
  return (
    <div className={`suggestion-card ${suggestion.priority}`}>
      <h4 className="suggestion-title">{suggestion.title}</h4>
      <p className="suggestion-description">{suggestion.description}</p>
      <ul className="suggestion-items">
        {suggestion.items.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionCard;
