import { Element, Modality, PlanetaryPosition, SIGN_DATA, PLANET_SCORES, CalculationResult } from "../types";

const RULERS: Record<string, string> = {
  Aries: "Marte",
  Tauro: "Venus",
  Géminis: "Mercurio",
  Cáncer: "Luna",
  Leo: "Sol",
  Virgo: "Mercurio",
  Libra: "Venus",
  Escorpio: "Plutón",
  Sagitario: "Júpiter",
  Capricornio: "Saturno",
  Acuario: "Urano",
  Piscis: "Neptuno",
};

export function calculateMatrix(positions: PlanetaryPosition[]): CalculationResult {
  const totalesElemento: Record<Element, number> = {
    [Element.Fuego]: 0,
    [Element.Tierra]: 0,
    [Element.Aire]: 0,
    [Element.Agua]: 0,
  };

  const conteoPlanetasElemento: Record<Element, number> = {
    [Element.Fuego]: 0,
    [Element.Tierra]: 0,
    [Element.Aire]: 0,
    [Element.Agua]: 0,
  };

  const totalesModalidad: Record<Modality, number> = {
    [Modality.Cardinal]: 0,
    [Modality.Fijo]: 0,
    [Modality.Mutable]: 0,
  };

  // Find Ascendant
  const ascendantPos = positions.find(p => p.planeta === "Ascendente");
  let regenteInfo: CalculationResult["regenteAscendente"] = undefined;

  if (ascendantPos) {
    const rulerName = RULERS[ascendantPos.signo];
    if (rulerName) {
      const rulerPos = positions.find(p => p.planeta === rulerName);
      if (rulerPos) {
        regenteInfo = {
          planeta: rulerName,
          signo: rulerPos.signo,
          signoAscendente: ascendantPos.signo
        };
      }
    }
  }

  positions.forEach((pos) => {
    const signInfo = SIGN_DATA[pos.signo];
    const planetScore = PLANET_SCORES[pos.planeta];

    if (signInfo && planetScore) {
      totalesElemento[signInfo.element] += planetScore.elementScore;
      totalesModalidad[signInfo.modality] += planetScore.modalityScore;
      conteoPlanetasElemento[signInfo.element] += 1;
    }
  });

  // Add Regente del Ascendente (RA) score if found
  if (regenteInfo) {
    const raScore = PLANET_SCORES["Regente del Ascendente (RA)"];
    const signInfo = SIGN_DATA[regenteInfo.signo];
    if (raScore && signInfo) {
      totalesElemento[signInfo.element] += raScore.elementScore;
      totalesModalidad[signInfo.modality] += raScore.modalityScore;
      // Note: We don't increment count here as the planet is already counted once
    }
  }

  // Classification Logic with Tie-breaking
  // We rank elements by:
  // 1. Score (descending)
  // 2. Planet Count (descending)
  const elementStats = (Object.keys(totalesElemento) as Element[]).map(el => ({
    element: el,
    score: totalesElemento[el],
    count: conteoPlanetasElemento[el]
  }));

  // Sort by score DESC, then count DESC
  const ranked = [...elementStats].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.count - a.count;
  });

  // Distribution:
  // Rank 1 & 2 -> LUZ
  // Rank 3 -> MÁSCARA
  // Rank 4 -> SOMBRA
  
  // Note: If there are perfect ties (same score and same count), the order is stable but arbitrary.
  // This ensures there is ALWAYS one element in each category (2 in Luz, 1 in Mascara, 1 in Sombra).
  
  const finalLuz = [ranked[0].element, ranked[1].element];
  const finalMascara = [ranked[2].element];
  const finalSombra = [ranked[3].element];

  return {
    luz: finalLuz,
    mascara: finalMascara,
    sombra: finalSombra,
    totalesElemento,
    totalesModalidad,
    conteoPlanetasElemento,
    regenteAscendente: regenteInfo,
  };
}
