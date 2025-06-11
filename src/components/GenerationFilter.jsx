// components/GenerationFilter.jsx
import React from "react";

const GenerationFilter = ({ generationFilter, handleGenerationFilter }) => {
  return (
    <div className="generations">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
        <button
          key={gen}
          className={generationFilter === gen ? "active-generation" : ""}
          onClick={() => handleGenerationFilter(gen)}
        >
          {gen}세대
        </button>
      ))}
    </div>
  );
};

export default GenerationFilter;
