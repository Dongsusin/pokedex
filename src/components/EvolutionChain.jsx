import React, { useEffect, useState, useRef } from "react";

const EvolutionChain = ({ chain, onSelect, pokemonList }) => {
  const [loadedData, setLoadedData] = useState({});
  const containerRef = useRef(null);

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
    if (evoDetail.min_level) return `레벨 ${evoDetail.min_level} 이상`;
    if (evoDetail.item) return `${evoDetail.item.name} 사용`;
    if (evoDetail.trigger?.name === "trade") return "교환 시 진화";
    if (evoDetail.min_happiness) return "친밀도 진화";
    if (evoDetail.trigger?.name) return `${evoDetail.trigger.name} 조건`;
    return "조건 없음";
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

    if (!node.evolves_to || node.evolves_to.length === 0) return [current];

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
  return (
    <div className="evolution-chain" ref={containerRef}>
      {renderChain(chain)}
    </div>
  );
};

export default EvolutionChain;
