import { useEffect, useState } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar";
import TypeFilter from "./components/TypeFilter";
import GenerationFilter from "./components/GenerationFilter";
import PokemonGrid from "./components/PokemonGrid";
import Pagination from "./components/Pagination";
import Modal from "./components/Modal";
import IntroScreen from "./components/IntroScreen";
import GamePage from "./components/GamePage";
import {
  TYPE_COLORS,
  TYPE_LABELS_KO,
  STAT_LABELS_KO,
  GENERATION_RANGES,
} from "./constants";

const FAVORITES_KEY = "pokeFavorites";
const POKEMON_LIMIT = 30;
const TOTAL_POKEMON = 1025;

const pokeballImg = "/pokeball.jpg";
const typeIcon = (type) =>
  `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;

function App() {
  const [activePage, setActivePage] = useState("pokedex");
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [generationFilter, setGenerationFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [evoChain, setEvoChain] = useState(null);
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filterMode, setFilterMode] = useState("type");
  const [showIntro, setShowIntro] = useState(true);

  const ALL_POKEMON_IDS = Array.from(
    { length: TOTAL_POKEMON },
    (_, i) => i + 1
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
      const merge = (prev, next) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        next.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      };
      setPokemonList((prev) => merge(prev, results));
      setFilteredList((prev) => merge(prev, results));
    }
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

  const handleSearch = async (e) => {
    const value = e.target.value.trim();
    setSearch(value);
    if (!value) return fetchPokemons(1, true);

    setLoading(true);
    const allRes = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    const allData = await allRes.json();
    const allNames = allData.results.map((p) => p.name);
    const results = await fetchPokemonsByNames(allNames);

    const isKorean = /[ㄱ-ㅎ|가-힣]/.test(value);
    const filtered = results.filter((p) =>
      isKorean
        ? p.koreanName.includes(value)
        : p.name.includes(value.toLowerCase())
    );
    setPokemonList(filtered);
    setFilteredList(filtered);
    setTypeFilter([]);
    setPage(1);
    setLoading(false);
  };

  const handleTypeFilter = async (type) => {
    let newFilters = [...typeFilter];
    if (newFilters.includes(type)) {
      newFilters = newFilters.filter((t) => t !== type);
    } else if (newFilters.length < 2) {
      newFilters.push(type);
    }
    setTypeFilter(newFilters);
    if (newFilters.length === 0) return fetchPokemons(1, true);

    setLoading(true);
    const typeResults = await Promise.all(
      newFilters.map(async (t) => {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${t}`);
        const data = await res.json();
        return data.pokemon.map((p) => p.pokemon.name);
      })
    );
    const intersected = typeResults.reduce((a, b) =>
      a.filter((n) => b.includes(n))
    );
    const results = await fetchPokemonsByNames(intersected);
    setPokemonList(results);
    setFilteredList(results);
    setPage(1);
    setLoading(false);
  };

  const handleGenerationFilter = async (gen) => {
    if (generationFilter === gen) {
      setGenerationFilter(null);
      return fetchPokemons(1, true);
    }
    setLoading(true);
    setGenerationFilter(gen);
    setTypeFilter([]);
    const [start, end] = GENERATION_RANGES[gen];
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const results = await fetchPokemonsByNames(ids.map((id) => id.toString()));
    setPokemonList(results);
    setFilteredList(results);
    setPage(1);
    setLoading(false);
  };

  const openModal = (p) => {
    setSelected(p);
    fetchEvolutionChain(p.speciesUrl);
  };

  const closeModal = () => {
    document.querySelector(".modal")?.classList.add("hide");
    setTimeout(() => {
      setSelected(null);
      setEvoChain(null);
    }, 300);
  };

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
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

  const selectFromEvo = (name) => {
    const p = pokemonList.find((p) => p.name === name);
    if (p) openModal(p);
  };

  const goToPrevPokemon = () => {
    const currentIndex = ALL_POKEMON_IDS.indexOf(selected.id);
    const prevId =
      currentIndex > 0
        ? ALL_POKEMON_IDS[currentIndex - 1]
        : ALL_POKEMON_IDS.at(-1);
    loadAndOpenPokemon(prevId);
  };

  const goToNextPokemon = () => {
    const currentIndex = ALL_POKEMON_IDS.indexOf(selected.id);
    const nextId =
      currentIndex < ALL_POKEMON_IDS.length - 1
        ? ALL_POKEMON_IDS[currentIndex + 1]
        : ALL_POKEMON_IDS[0];
    loadAndOpenPokemon(nextId);
  };

  const loadAndOpenPokemon = async (id) => {
    let p = pokemonList.find((p) => p.id === id);
    if (!p) {
      const details = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${id}`
      ).then((r) => r.json());
      const species = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`
      ).then((r) => r.json());
      const koreanName =
        species.names.find((n) => n.language.name === "ko")?.name ||
        details.name;
      p = { ...details, koreanName, speciesUrl: species.url };
      setPokemonList((prev) => [...prev, p]);
    }
    openModal(p);
  };

  const applyFilter = (list, tab = activeTab) => {
    const filtered =
      tab === "favorites" ? list.filter((p) => favorites.includes(p.id)) : list;
    setFilteredList(filtered);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const filtering =
      typeFilter.length ||
      activeTab === "favorites" ||
      search ||
      generationFilter !== null;
    if (!filtering && pokemonList.length < newPage * POKEMON_LIMIT) {
      fetchPokemons(newPage);
    }
  };

  const getStatColor = (v) =>
    v >= 90 ? "#81c784" : v >= 50 ? "#ffeb3b" : "#e57373";

  const paginated = filteredList.slice(
    (page - 1) * POKEMON_LIMIT,
    page * POKEMON_LIMIT
  );

  const isFiltering =
    typeFilter.length ||
    activeTab === "favorites" ||
    search ||
    generationFilter !== null;

  const totalPages = isFiltering
    ? Math.ceil(filteredList.length / POKEMON_LIMIT)
    : Math.ceil(TOTAL_POKEMON / POKEMON_LIMIT);

  return (
    <>
      {showIntro && <IntroScreen />}
      <div className={`app ${showIntro ? "hidden" : "visible"}`}>
        {/* 헤더 탭 */}
        <header className="app-header">
          <nav className="nav-tabs">
            <button
              onClick={() => setActivePage("pokedex")}
              className={activePage === "pokedex" ? "active" : ""}
            >
              도감
            </button>
            <button
              onClick={() => setActivePage("game")}
              className={activePage === "game" ? "active" : ""}
            >
              게임
            </button>
            <button
              onClick={() => setActivePage("anime")}
              className={activePage === "anime" ? "active" : ""}
            >
              애니
            </button>
          </nav>
        </header>

        {activePage === "pokedex" && (
          <>
            <h1>포켓몬 도감</h1>
            {!selected && (
              <>
                <SearchBar
                  search={search}
                  handleSearch={handleSearch}
                  filterMode={filterMode}
                  setFilterMode={setFilterMode}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  fetchPokemons={fetchPokemons}
                  applyFilter={applyFilter}
                  pokemonList={pokemonList}
                  setPage={setPage}
                />
                {filterMode === "type" && (
                  <TypeFilter
                    typeFilter={typeFilter}
                    handleTypeFilter={handleTypeFilter}
                    TYPE_COLORS={TYPE_COLORS}
                    typeIcon={typeIcon}
                  />
                )}
                {filterMode === "generation" && (
                  <GenerationFilter
                    generationFilter={generationFilter}
                    handleGenerationFilter={handleGenerationFilter}
                  />
                )}
                <PokemonGrid
                  paginated={paginated}
                  loading={loading}
                  TYPE_COLORS={TYPE_COLORS}
                  TYPE_LABELS_KO={TYPE_LABELS_KO}
                  typeIcon={typeIcon}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  openModal={openModal}
                  pokeballImg={pokeballImg}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
            {selected && (
              <Modal
                selected={selected}
                closeModal={closeModal}
                goToPrevPokemon={goToPrevPokemon}
                goToNextPokemon={goToNextPokemon}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                TYPE_COLORS={TYPE_COLORS}
                TYPE_LABELS_KO={TYPE_LABELS_KO}
                typeIcon={typeIcon}
                STAT_LABELS_KO={STAT_LABELS_KO}
                getStatColor={getStatColor}
                evoChain={evoChain}
                selectFromEvo={selectFromEvo}
                pokeballImg={pokeballImg}
              />
            )}
          </>
        )}

        {activePage === "game" && <GamePage />}

        {activePage === "anime" && (
          <div className="anime-page">
            <h1>포켓몬 애니메이션</h1>
            <p>추가예정</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
