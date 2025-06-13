import React from "react";

const GenerationFilter = ({ generationFilter, handleGenerationFilter }) => {
  return (
    <div className="generations">
      {/* 1세대부터 9세대까지 버튼 생성 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
        <button
          key={gen}
          // 현재 선택된 세대 적용
          className={generationFilter === gen ? "active-generation" : ""}
          // 버튼 클릭 시 해당 세대 설정
          onClick={() => handleGenerationFilter(gen)}
        >
          {gen}세대
        </button>
      ))}
    </div>
  );
};

export default GenerationFilter;
