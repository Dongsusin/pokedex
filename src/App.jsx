import { useEffect, useState } from "react";
import "./App.css";

const TYPE_COLORS = {
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  psychic: "#F85888",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  fairy: "#EE99AC",
  normal: "#A8A878",
  fighting: "#C03028",
  flying: "#A890F0",
  poison: "#A040A0",
  ground: "#E0C068",
  rock: "#B8A038",
  bug: "#A8B820",
  ghost: "#705898",
  steel: "#B8B8D0",
};

const TYPE_LABELS_KO = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  electric: "전기",
  grass: "풀",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리",
};

const STAT_LABELS_KO = {
  hp: "체력",
  attack: "공격",
  defense: "방어",
  "special-attack": "특수공격",
  "special-defense": "특수방어",
  speed: "스피드",
};

const pokeballImg =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

const typeIcon = (type) =>
  `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;

const FAVORITES_KEY = "pokeFavorites";
const POKEMON_LIMIT = 30;
const TOTAL_POKEMON = 1025;

function EvolutionChain({ chain, onSelect, pokemonList }) {
  const [loadedData, setLoadedData] = useState({});

  useEffect(() => {
    if (!chain) return;

    const queue = [];
    const collectNames = (node) => {
      queue.push(node.species.name);
      node.evolves_to.forEach(collectNames);
    };
    collectNames(chain);

    const fetchMissing = async () => {
      const newData = {};
      for (const name of queue) {
        if (pokemonList.some((p) => p.name === name)) continue;
        if (loadedData[name]) continue;

        try {
          const details = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${name}`
          ).then((r) => r.json());
          const species = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${details.id}`
          ).then((r) => r.json());
          const koreanName =
            species.names.find((n) => n.language.name === "ko")?.name || name;
          newData[name] = {
            image: details.sprites.front_default,
            koreanName,
          };
        } catch {
          newData[name] = {
            image: null,
            koreanName: name,
          };
        }
      }
      setLoadedData((prev) => ({ ...prev, ...newData }));
    };

    fetchMissing();
  }, [chain, pokemonList]);

  const renderCondition = (evoDetail) => {
    if (!evoDetail) return null;

    if (evoDetail.min_level) {
      return `레벨 ${evoDetail.min_level} 이상`;
    } else if (evoDetail.item) {
      return `${evoDetail.item.name} 사용`;
    } else if (evoDetail.trigger?.name === "trade") {
      return "교환 시 진화";
    } else if (evoDetail.min_happiness) {
      return "친밀도 진화";
    } else if (evoDetail.trigger?.name) {
      return `${evoDetail.trigger.name} 조건`;
    } else {
      return "조건 없음";
    }
  };

  const renderChain = (node) => {
    const name = node.species.name;
    const p = pokemonList.find((p) => p.name === name);
    const image = p?.sprites?.front_default || loadedData[name]?.image;
    const koreanName = p?.koreanName || loadedData[name]?.koreanName || name;

    const current = (
      <div className="evo-step" onClick={() => onSelect(name)} key={name}>
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <div style={{ width: 80, height: 80, background: "#eee" }} />
        )}
        <div>{koreanName}</div>
      </div>
    );

    if (!node.evolves_to || node.evolves_to.length === 0) {
      return [current];
    }

    // 여러 진화 갈래를 가로로 렌더링
    const chainElements = [current];
    node.evolves_to.forEach((child, index) => {
      const evoDetail = child.evolution_details?.[0];
      const conditionText = renderCondition(evoDetail);

      chainElements.push(
        <div className="evo-arrow-wrapper" key={`arrow-${name}-${index}`}>
          <div className="evo-arrow">➡️</div>
          <div className="evo-condition">{conditionText}</div>
        </div>
      );

      const nextChain = renderChain(child);
      chainElements.push(...nextChain);
    });

    return chainElements;
  };

  if (!chain) return null;
  return <div className="evolution-chain">{renderChain(chain)}</div>;
}

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [evoChain, setEvoChain] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const ALL_POKEMON_IDS = Array.from(
    { length: TOTAL_POKEMON },
    (_, i) => i + 1
  );

  const goToPrevPokemon = async () => {
    if (!selected) return;

    const currentId = selected.id;
    const currentIndex = ALL_POKEMON_IDS.indexOf(currentId);
    const prevId =
      currentIndex <= 0
        ? ALL_POKEMON_IDS[ALL_POKEMON_IDS.length - 1]
        : ALL_POKEMON_IDS[currentIndex - 1];

    await loadAndOpenPokemon(prevId);
  };

  const goToNextPokemon = async () => {
    if (!selected) return;

    const currentId = selected.id;
    const currentIndex = ALL_POKEMON_IDS.indexOf(currentId);
    const nextId =
      currentIndex >= ALL_POKEMON_IDS.length - 1
        ? ALL_POKEMON_IDS[0]
        : ALL_POKEMON_IDS[currentIndex + 1];

    await loadAndOpenPokemon(nextId);
  };

  const loadAndOpenPokemon = async (id) => {
    let p = pokemonList.find((p) => p.id === id);

    if (!p) {
      try {
        const details = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${id}`
        ).then((r) => r.json());
        const species = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${id}`
        ).then((r) => r.json());
        const koreanName =
          species.names.find((n) => n.language.name === "ko")?.name ||
          details.name;
        p = {
          ...details,
          koreanName,
          speciesUrl: `https://pokeapi.co/api/v2/pokemon-species/${details.id}`,
        };
        setPokemonList((prev) => [...prev, p]);
      } catch {
        return;
      }
    }

    openModal(p);
  };

  useEffect(() => {
    fetchPokemons(1);
  }, []);

  const fetchPokemons = async (pageNum, reset = false) => {
    setLoading(true);
    const offset = (pageNum - 1) * POKEMON_LIMIT;
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_LIMIT}&offset=${offset}`
    );
    const data = await res.json();

    const results = await Promise.all(
      data.results.map(async (p) => {
        const details = await fetch(p.url).then((r) => r.json());
        const species = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${details.id}`
        ).then((r) => r.json());
        const koreanName =
          species.names.find((n) => n.language.name === "ko")?.name ||
          details.name;
        return {
          ...details,
          koreanName,
          speciesUrl: `https://pokeapi.co/api/v2/pokemon-species/${details.id}`,
        };
      })
    );

    if (reset) {
      setPokemonList(results);
      setFilteredList(results);
    } else {
      setPokemonList((prev) => {
        const unique = new Map(prev.map((p) => [p.id, p]));
        results.forEach((p) => unique.set(p.id, p));
        return Array.from(unique.values());
      });

      setFilteredList((prev) => {
        const updated = [...prev];
        results.forEach((p) => {
          if (!updated.some((prevP) => prevP.id === p.id)) {
            updated.push(p);
          }
        });
        return updated;
      });
    }

    setLoading(false);
  };

  const fetchEvolutionChain = async (speciesUrl) => {
    try {
      const speciesData = await fetch(speciesUrl).then((r) => r.json());
      if (speciesData.evolution_chain?.url) {
        const evoData = await fetch(speciesData.evolution_chain.url).then((r) =>
          r.json()
        );
        setEvoChain(evoData.chain);
      } else {
        setEvoChain(null);
      }
    } catch {
      setEvoChain(null);
    }
  };

  const openModal = (p) => {
    setSelected(p);
    fetchEvolutionChain(p.speciesUrl);
  };

  const closeModal = () => {
    document.querySelector(".modal").classList.add("hide");
    setTimeout(() => {
      setSelected(null);
      setEvoChain(null);
    }, 300);
  };

  const getStatColor = (value) => {
    if (value >= 90) return "#81c784"; // green
    if (value >= 50) return "#ffeb3b"; // yellow
    return "#e57373"; // red
  };

  const handleSearch = async (e) => {
    const value = e.target.value.trim();
    setSearch(value);

    if (!value) {
      setActiveTab("all");
      await fetchPokemons(1, true);
      return;
    }

    setLoading(true);

    // 전체 포켓몬 이름만 먼저 가져오기
    const allRes = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    const allData = await allRes.json();
    const allNames = allData.results.map((p) => p.name);

    // 모든 포켓몬의 상세정보 + 한글이름 fetch
    const results = await fetchPokemonsByNames(allNames);

    // value가 한글인지 영어인지 감지
    const isKorean = /[ㄱ-ㅎ|가-힣]/.test(value);

    // 검색어 기준 필터
    const filtered = results.filter((p) => {
      if (isKorean) {
        return p.koreanName.includes(value);
      } else {
        return p.name.includes(value.toLowerCase());
      }
    });

    setPokemonList(filtered);
    setFilteredList(filtered);
    setTypeFilter([]);
    setActiveTab("all");
    setPage(1);
    setLoading(false);
  };

  const applyFilter = (list, tab = activeTab) => {
    let filtered = [...list];

    if (tab === "favorites") {
      filtered = filtered.filter((p) => favorites.includes(p.id));
    }

    setFilteredList(filtered);
    setPage(1);
  };

  const handleTypeFilter = async (type) => {
    let newFilters = [...typeFilter];

    // 타입 추가/제거
    if (newFilters.includes(type)) {
      newFilters = newFilters.filter((t) => t !== type);
    } else {
      if (newFilters.length >= 2) return;
      newFilters.push(type);
    }

    setTypeFilter(newFilters);

    // 🔄 모든 타입 선택 해제 시 전체 다시 불러오기
    if (newFilters.length === 0) {
      setTypeFilter([]);
      setActiveTab("all");
      setPage(1);
      await fetchPokemons(1, true); // ✅ 전체 리셋 모드로 fetch
      return;
    }

    setLoading(true);

    // 선택된 모든 타입의 포켓몬 fetch
    const typeResults = await Promise.all(
      newFilters.map(async (t) => {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${t}`);
        const data = await res.json();
        return data.pokemon.map((p) => p.pokemon.name);
      })
    );

    // 타입 간 교집합 구하기
    const intersectedNames = typeResults.reduce((acc, cur) =>
      acc.filter((name) => cur.includes(name))
    );

    // 해당 포켓몬들 불러오기
    const results = await fetchPokemonsByNames(intersectedNames);

    // 전체 목록 및 필터 목록 갱신
    setPokemonList(results);
    setFilteredList(results);
    setPage(1);
    setLoading(false);
  };

  const fetchPokemonsByNames = async (names) => {
    const results = await Promise.all(
      names.map(async (name) => {
        try {
          const details = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${name}`
          ).then((r) => r.json());
          const species = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${details.id}`
          ).then((r) => r.json());
          const koreanName =
            species.names.find((n) => n.language.name === "ko")?.name ||
            details.name;

          return {
            ...details,
            koreanName,
            speciesUrl: `https://pokeapi.co/api/v2/pokemon-species/${details.id}`,
          };
        } catch {
          return null;
        }
      })
    );

    return results.filter(Boolean).sort((a, b) => a.id - b.id);
  };

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const selectFromEvo = (name) => {
    const p = pokemonList.find((p) => p.name === name);
    if (p) openModal(p);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);

    const isFiltering =
      typeFilter.length > 0 || activeTab === "favorites" || search;

    // ✅ 필터링 중이면 fetch 금지 (이미 필터링된 목록만 보여줌)
    if (!isFiltering) {
      const requiredCount = newPage * POKEMON_LIMIT;
      if (pokemonList.length < requiredCount) {
        fetchPokemons(newPage);
      }
    }
  };

  const paginated = filteredList.slice(
    (page - 1) * POKEMON_LIMIT,
    page * POKEMON_LIMIT
  );

  const isFiltering =
    typeFilter.length > 0 || activeTab === "favorites" || search;

  const totalPages = isFiltering
    ? Math.ceil(filteredList.length / POKEMON_LIMIT)
    : Math.ceil(TOTAL_POKEMON / POKEMON_LIMIT);

  return (
    <div
      className="app"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Escape" && closeModal()}
    >
      <h1>포켓몬 도감</h1>

      {!selected && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <input
              value={search}
              onChange={handleSearch}
              placeholder="이름으로 검색"
            />
            <button
              onClick={() => {
                const newTab = activeTab === "favorites" ? "all" : "favorites";
                setActiveTab(newTab);
                applyFilter(pokemonList, newTab); // ← 여기에 newTab을 명시
              }}
              className={`favorite-toggle ${
                activeTab === "favorites" ? "active-favorite" : ""
              }`}
            >
              즐겨찾기
            </button>
          </div>

          <div className="types">
            {Object.keys(TYPE_COLORS).map((type) => (
              <button
                key={type}
                className={typeFilter.includes(type) ? "active-type" : ""}
                style={{
                  "--type-color": TYPE_COLORS[type],
                }}
                onClick={() => handleTypeFilter(type)}
              >
                <img src={typeIcon(type)} alt={type} />
              </button>
            ))}
          </div>

          <div
            className="pokemon-grid"
            style={{ display: loading ? "block" : "grid" }}
          >
            {loading ? (
              <div className="loading-spinner">
                <img src={pokeballImg} alt="loading" />
              </div>
            ) : (
              paginated.map((p) => {
                const types = p.types.map((t) => t.type.name);
                const bgStyle =
                  types.length === 1
                    ? TYPE_COLORS[types[0]]
                    : `linear-gradient(135deg, ${TYPE_COLORS[types[0]]}, ${
                        TYPE_COLORS[types[1]]
                      })`;
                return (
                  <div
                    key={p.id}
                    className="pokemon-card"
                    style={{ background: bgStyle }}
                    onClick={() => openModal(p)}
                  >
                    <img
                      src={
                        p.sprites.versions["generation-v"]["black-white"]
                          .animated.front_default || p.sprites.front_default
                      }
                      alt={p.name}
                    />

                    <h3>{p.koreanName}</h3>

                    <div className="card-types">
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
                    </div>

                    <button
                      className="fav-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                    >
                      {favorites.includes(p.id) ? "💖" : "🤍"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}

      {selected && (
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
                selected.sprites.versions["generation-v"]["black-white"]
                  .animated.front_default ||
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
                pokemonList={pokemonList}
              />
            ) : (
              <p>진화 정보가 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
