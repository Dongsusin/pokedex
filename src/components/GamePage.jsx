import { useState, useEffect } from "react";

const GENERATION_LABELS = [
  "세대 1",
  "세대 2",
  "세대 3",
  "세대 4",
  "세대 5",
  "세대 6",
  "세대 7",
  "세대 8",
  "세대 9",
];

const REGION_KO = {
  kanto: "관동",
  johto: "성도",
  hoenn: "호연",
  sinnoh: "신오",
  unova: "이슈",
  kalos: "칼로스",
  alola: "알로라",
  galar: "가라르",
  paldea: "팔데아",
};

const VERSION_GROUPS_KO = {
  "red-blue": "레드·블루",
  yellow: "옐로우",
  "red-green-japan": "레드.그린",
  "blue-japan": "블루",
  "gold-silver": "골드·실버",
  crystal: "크리스탈",
  "ruby-sapphire": "루비·사파이어",
  emerald: "에메랄드",
  "firered-leafgreen": "파이어레드·리프그린",
  colosseum: "콜로세움",
  xd: "포켓몬 XD",
  "diamond-pearl": "다이아몬드·펄",
  platinum: "플래티넘",
  "heartgold-soulsilver": "하트골드·소울실버",
  "black-white": "블랙·화이트",
  "black-2-white-2": "블랙2·화이트2",
  "x-y": "X·Y",
  "omega-ruby-alpha-sapphire": "오메가루비·알파사파이어",
  "sun-moon": "썬·문",
  "the-isle-of-armor": "갑옷의 외딴섬",
  "the-crown-tundra": "왕관의 설원",
  "brilliant-diamond-and-shining-pearl": "브릴리언트 다이아몬드·샤이닝 펄",
  "ultra-sun-ultra-moon": "울트라썬·울트라문",
  "lets-go-pikachu-lets-go-eevee": "레츠고! 피카츄·이브이",
  "sword-shield": "소드·실드",
  "brilliant-diamond-shining-pearl": "브릴리언트 다이아몬드·샤이닝 펄",
  "legends-arceus": "레전드 아르세우스",
  "scarlet-violet": "스칼렛·바이올렛",
  "the-teal-mask": "제로의 비보",
  "the-indigo-disk": "남청의 원반",
};

function GamePage() {
  const [generationId, setGenerationId] = useState(1);
  const [generationData, setGenerationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenerationData(generationId);
  }, [generationId]);

  const fetchGenerationData = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/generation/${id}`);
      const data = await res.json();
      setGenerationData(data);
    } catch (err) {
      console.error("세대 데이터 불러오기 실패:", err);
      setGenerationData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-page">
      <h2>포켓몬 게임 세대별 정보</h2>

      {/* 세대 선택 버튼 */}
      <div className="gen-buttons">
        {GENERATION_LABELS.map((label, idx) => (
          <button
            key={idx}
            onClick={() => setGenerationId(idx + 1)}
            className={generationId === idx + 1 ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p>로딩 중...</p>}

      {!loading && generationData && (
        <div className="gen-info">
          <h3>{GENERATION_LABELS[generationId - 1]}</h3>
          <p>
            <strong>지역:</strong>{" "}
            {REGION_KO[generationData.main_region.name] ??
              generationData.main_region.name}
          </p>
          <p>
            <strong>관련 게임:</strong>{" "}
            {generationData.version_groups
              .map((v) => VERSION_GROUPS_KO[v.name] ?? v.name)
              .join(", ")}
          </p>

          <h4>등장 포켓몬 ({generationData.pokemon_species.length}마리)</h4>
          <div className="pokemon-list">
            {generationData.pokemon_species
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => {
                const id = p.url.split("/").filter(Boolean).pop();
                const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                return (
                  <div key={p.name} className="pokemon-card-game">
                    <img src={imgUrl} alt={p.name} />
                    <p>{p.name}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
