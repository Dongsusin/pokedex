import { useEffect, useState } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar";
import TypeFilter from "./components/TypeFilter";
import GenerationFilter from "./components/GenerationFilter";
import PokemonGrid from "./components/PokemonGrid";
import Pagination from "./components/Pagination";
import Modal from "./components/Modal";
import IntroScreen from "./components/IntroScreen";
import {
  TYPE_COLORS,
  TYPE_LABELS_KO,
  STAT_LABELS_KO,
  GENERATION_RANGES,
} from "./constants";
// 로컬 스토리지 키와 포켓몬 개수
const FAVORITES_KEY = "pokeFavorites";
const POKEMON_LIMIT = 30;
const TOTAL_POKEMON = 1025;
// 포켓볼 이미지 및 타입 아이콘 경로 함수
const pokeballImg = "/pokeball.jpg";
const typeIcon = (type) =>
  `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;

function App() {
  // 상태 변수들 선언
  const [pokemonList, setPokemonList] = useState([]); // 전체 포켓몬 목록
  const [filteredList, setFilteredList] = useState([]); // 필터링된 포켓몬 목록
  const [selected, setSelected] = useState(null); // 선택된 포켓몬 (Modal용)
  const [search, setSearch] = useState(""); // 검색어
  const [typeFilter, setTypeFilter] = useState([]); // 타입 필터 (최대 2개)
  const [generationFilter, setGenerationFilter] = useState(null); // 세대 필터
  const [page, setPage] = useState(1); // 현재 페이지
  const [evoChain, setEvoChain] = useState(null); // 진화 정보
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
  );
  // 즐겨찾기 포켓몬 ID 리스트
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [activeTab, setActiveTab] = useState("all"); // 탭 상태
  const [filterMode, setFilterMode] = useState("type"); // 필터 모드
  const [showIntro, setShowIntro] = useState(true); // 인트로 화면 표시 여부
  // 전체 포켓몬 ID 배열
  const ALL_POKEMON_IDS = Array.from(
    { length: TOTAL_POKEMON },
    (_, i) => i + 1
  );
  // 2초 후 인트로 화면 숨기기
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  // 첫 페이지 로딩 시 포켓몬 불러오기
  useEffect(() => {
    fetchPokemons(1);
  }, []);
  // 포켓몬 데이터 API에서 가져오기
  const fetchPokemons = async (pageNum, reset = false) => {
    setLoading(true);
    const offset = (pageNum - 1) * POKEMON_LIMIT;

    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_LIMIT}&offset=${offset}`
    );
    const data = await res.json();
    // 각 포켓몬의 상세 정보와 한국어 이름 가져오기
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
    // 결과 병합 또는 초기화
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
  // 이름(영문/한글)으로 포켓몬 검색
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
  // 검색 핸들러
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
  // 타입 필터 핸들러
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
  // 세대 필터 핸들러
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
  // 모달 열기
  const openModal = (p) => {
    setSelected(p);
    fetchEvolutionChain(p.speciesUrl);
  };
  // 모달 닫기
  const closeModal = () => {
    document.querySelector(".modal")?.classList.add("hide");
    setTimeout(() => {
      setSelected(null);
      setEvoChain(null);
    }, 300);
  };
  // 즐겨찾기 추가/제거
  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };
  // 진화 체인 데이터 가져오기
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
  // 진화 포켓몬 선택 시 정보 표시
  const selectFromEvo = (name) => {
    const p = pokemonList.find((p) => p.name === name);
    if (p) openModal(p);
  };
  // 이전 포켓몬 보기
  const goToPrevPokemon = () => {
    const currentIndex = ALL_POKEMON_IDS.indexOf(selected.id);
    const prevId =
      currentIndex > 0
        ? ALL_POKEMON_IDS[currentIndex - 1]
        : ALL_POKEMON_IDS.at(-1);
    loadAndOpenPokemon(prevId);
  };
  // 다음 포켓몬 보기
  const goToNextPokemon = () => {
    const currentIndex = ALL_POKEMON_IDS.indexOf(selected.id);
    const nextId =
      currentIndex < ALL_POKEMON_IDS.length - 1
        ? ALL_POKEMON_IDS[currentIndex + 1]
        : ALL_POKEMON_IDS[0];
    loadAndOpenPokemon(nextId);
  };
  // ID로 포켓몬 불러와서 모달로 열기
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
  //필터링 적용
  const applyFilter = (list, tab = activeTab) => {
    const filtered =
      tab === "favorites" ? list.filter((p) => favorites.includes(p.id)) : list;
    setFilteredList(filtered);
    setPage(1);
  };
  // 페이지 변경 핸들러
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
  // 능력치 색상 반환
  const getStatColor = (v) =>
    v >= 90 ? "#81c784" : v >= 50 ? "#ffeb3b" : "#e57373";
  // 현재 페이지에 해당하는 포켓몬 목록
  const paginated = filteredList.slice(
    (page - 1) * POKEMON_LIMIT,
    page * POKEMON_LIMIT
  );
  // 필터링 여부 확인
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
      {/* 인트로 화면 */}
      {showIntro && <IntroScreen />}
      {/* 메인 앱 */}
      <div className={`app ${showIntro ? "hidden" : "visible"}`}>
        <h1>포켓몬 도감</h1>
        {/* 모달이 아닐 때만 UI 표시 */}
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
            {/* 필터 컴포넌트 (타입 or 세대) */}
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
            {/* 포켓몬 카드 그리드 */}
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
            {/* 페이지네이션 */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
        {/* 포켓몬 상세 모달 */}
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
      </div>
    </>
  );
}

export default App;
