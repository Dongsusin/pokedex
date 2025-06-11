// components/SearchBar.jsx
import React from "react";

const SearchBar = ({
  search,
  handleSearch,
  filterMode,
  setFilterMode,
  activeTab,
  setActiveTab,
  fetchPokemons,
  applyFilter,
  pokemonList,
  setPage,
}) => {
  const handleFavoritesToggle = () => {
    const newTab = activeTab === "favorites" ? "all" : "favorites";
    setActiveTab(newTab);
    setPage(1);
    if (newTab === "all") {
      fetchPokemons(1, true);
    } else {
      applyFilter(pokemonList, newTab);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "1rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      <input
        value={search}
        onChange={handleSearch}
        placeholder="이름으로 검색"
      />
      <button
        className={`tab-button ${filterMode === "type" ? "active" : ""}`}
        onClick={() => setFilterMode("type")}
      >
        타입 필터
      </button>
      <button
        className={`tab-button ${filterMode === "generation" ? "active" : ""}`}
        onClick={() => setFilterMode("generation")}
      >
        세대 필터
      </button>
      <button
        className={`tab-button ${activeTab === "favorites" ? "active" : ""}`}
        onClick={handleFavoritesToggle}
      >
        즐겨찾기
      </button>
    </div>
  );
};

export default SearchBar;
