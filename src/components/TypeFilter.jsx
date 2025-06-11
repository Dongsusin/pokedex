// components/TypeFilter.jsx
import React from "react";

const TypeFilter = ({
  typeFilter,
  handleTypeFilter,
  TYPE_COLORS,
  typeIcon,
}) => {
  return (
    <div className="types">
      {Object.keys(TYPE_COLORS).map((type) => (
        <button
          key={type}
          className={typeFilter.includes(type) ? "active-type" : ""}
          style={{ "--type-color": TYPE_COLORS[type] }}
          onClick={() => handleTypeFilter(type)}
        >
          <img src={typeIcon(type)} alt={type} />
        </button>
      ))}
    </div>
  );
};

export default TypeFilter;
