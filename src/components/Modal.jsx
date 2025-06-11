// components/Modal.jsx
import React from "react";
import EvolutionChain from "./EvolutionChain";

const Modal = ({
  selected,
  closeModal,
  goToPrevPokemon,
  goToNextPokemon,
  favorites,
  toggleFavorite,
  TYPE_COLORS,
  TYPE_LABELS_KO,
  typeIcon,
  STAT_LABELS_KO,
  getStatColor,
  evoChain,
  selectFromEvo,
  pokeballImg,
}) => {
  if (!selected) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="close" onClick={closeModal}>
          ×
        </button>

        <div className="modal-header">
          <h2>
            {selected.koreanName} ({selected.name})
          </h2>
        </div>

        <div className="modal-nav">
          <button onClick={goToPrevPokemon}>← 이전</button>
          <button
            className="fav-btn"
            onClick={() => toggleFavorite(selected.id)}
          >
            {favorites.includes(selected.id) ? "💖" : "🤍"}
          </button>
          <button onClick={goToNextPokemon}>다음 →</button>
        </div>

        <img
          src={
            selected.sprites.versions["generation-v"]["black-white"].animated
              .front_default ||
            selected.sprites.other["official-artwork"].front_default
          }
          alt={selected.name}
        />

        <div className="types-detail">
          {selected.types.map((t) => (
            <span
              key={t.type.name}
              style={{ background: TYPE_COLORS[t.type.name] }}
            >
              <img src={typeIcon(t.type.name)} alt={t.type.name} />
              {TYPE_LABELS_KO[t.type.name] || t.type.name}
            </span>
          ))}
        </div>

        <div className="stats">
          {selected.stats.map((stat) => (
            <div key={stat.stat.name}>
              <strong>
                {STAT_LABELS_KO[stat.stat.name] || stat.stat.name}
              </strong>
              <div className="bar">
                <div
                  className="fill"
                  style={{
                    width: `${stat.base_stat / 2}%`,
                    backgroundColor: getStatColor(stat.base_stat),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <h3>진화 트리</h3>
        {evoChain ? (
          <EvolutionChain
            chain={evoChain}
            onSelect={selectFromEvo}
            pokemonList={[selected]}
          />
        ) : (
          <p>진화 정보가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default Modal;
