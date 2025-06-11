// components/PokemonGrid.jsx
import React from "react";
import PokemonCard from "./PokemonCard";

const PokemonGrid = ({
  paginated,
  loading,
  TYPE_COLORS,
  TYPE_LABELS_KO,
  typeIcon,
  favorites,
  toggleFavorite,
  openModal,
  pokeballImg,
}) => {
  return (
    <div
      className="pokemon-grid"
      style={{ display: loading ? "block" : "grid" }}
    >
      {loading ? (
        <div className="loading-spinner">
          <img src={pokeballImg} alt="loading" />
        </div>
      ) : (
        paginated.map((p) => (
          <PokemonCard
            key={p.id}
            pokemon={p}
            TYPE_COLORS={TYPE_COLORS}
            TYPE_LABELS_KO={TYPE_LABELS_KO}
            typeIcon={typeIcon}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onClick={openModal}
          />
        ))
      )}
    </div>
  );
};

export default PokemonGrid;
