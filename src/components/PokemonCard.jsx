// components/PokemonCard.jsx
import React from "react";

const PokemonCard = ({
  pokemon,
  TYPE_COLORS,
  TYPE_LABELS_KO,
  typeIcon,
  favorites,
  toggleFavorite,
  onClick,
}) => {
  const types = pokemon.types.map((t) => t.type.name);

  const bgStyle =
    types.length === 1
      ? TYPE_COLORS[types[0]]
      : `linear-gradient(135deg, ${TYPE_COLORS[types[0]]}, ${
          TYPE_COLORS[types[1]]
        })`;

  return (
    <div
      className="pokemon-card"
      style={{ background: bgStyle }}
      onClick={() => onClick(pokemon)}
    >
      <img
        src={
          pokemon.sprites.versions["generation-v"]["black-white"].animated
            .front_default || pokemon.sprites.front_default
        }
        alt={pokemon.name}
      />

      <h3>{pokemon.koreanName}</h3>

      <div className="card-types">
        {types.map((type) => (
          <span
            className="card-type"
            key={type}
            style={{
              background: TYPE_COLORS[type],
              border: "1px solid black",
            }}
          >
            <img src={typeIcon(type)} alt={type} />
            {TYPE_LABELS_KO[type] || type}
          </span>
        ))}
      </div>

      <button
        className="fav-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(pokemon.id);
        }}
      >
        {favorites.includes(pokemon.id) ? "💖" : "🤍"}
      </button>
    </div>
  );
};

export default PokemonCard;
