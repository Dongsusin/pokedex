import React, { useEffect, useState, useRef } from "react";

const EvolutionChain = ({ chain, onSelect, pokemonList }) => {
  const [loadedData, setLoadedData] = useState({}); // API로 추가 로딩한 포켓몬 데이터 저장
  const containerRef = useRef(null); // 진화 체인 컨테이너 참조

  // 화면 리사이즈 시 오버플로우 여부를 체크하여 클래스 추가
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkOverflow = () => {
      if (container.scrollWidth > container.clientWidth) {
        container.classList.add("overflowing");
      } else {
        container.classList.remove("overflowing");
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [chain, loadedData]);

  // 진화 체인의 포켓몬 데이터를 가져옴 (로컬에 없는 경우만)
  useEffect(() => {
    if (!chain) return;

    const queue = [];
    const collectNames = (node) => {
      queue.push(node.species.name); // 현재 포켓몬 이름 추가
      node.evolves_to.forEach(collectNames); // 재귀적으로 다음 진화 단계 탐색
    };
    collectNames(chain);

    const fetchMissing = async () => {
      const newData = {};
      for (const name of queue) {
        // 이미 로드되었거나 리스트에 존재하면 무시
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
            image: details.sprites.front_default, // 포켓몬 이미지
            koreanName,
          };
        } catch {
          // 실패할 경우 기본 데이터로 대체
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

  // 진화 조건을 텍스트로 변환
  const renderCondition = (evoDetail) => {
    if (!evoDetail) return null;
    if (evoDetail.min_level) return `레벨 ${evoDetail.min_level} 이상`;
    if (evoDetail.item) return `${evoDetail.item.name} 사용`;
    if (evoDetail.trigger?.name === "trade") return "교환 시 진화";
    if (evoDetail.min_happiness) return "친밀도 진화";
    if (evoDetail.trigger?.name) return `${evoDetail.trigger.name} 조건`;
    return "조건 없음";
  };

  // 재귀적으로 진화 체인을 렌더링
  const renderChain = (node) => {
    const name = node.species.name;
    const p = pokemonList.find((p) => p.name === name);
    const image = p?.sprites?.front_default || loadedData[name]?.image;
    const koreanName = p?.koreanName || loadedData[name]?.koreanName || name;

    // 현재 포켓몬 표시
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

    // 더 이상 진화가 없다면 현재 노드만 반환
    if (!node.evolves_to || node.evolves_to.length === 0) return [current];

    const chainElements = [current];

    // 각 다음 단계 진화에 대해 화살표와 조건, 다음 노드 재귀적으로 렌더링
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

  return (
    <div className="evolution-chain" ref={containerRef}>
      {renderChain(chain)}
    </div>
  );
};

export default EvolutionChain;
