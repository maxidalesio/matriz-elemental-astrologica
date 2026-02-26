import { Type } from "@google/genai";

export enum Element {
  Fuego = "Fuego",
  Tierra = "Tierra",
  Aire = "Aire",
  Agua = "Agua",
}

export enum Modality {
  Cardinal = "Cardinal",
  Fijo = "Fijo",
  Mutable = "Mutable",
}

export interface SignInfo {
  element: Element;
  modality: Modality;
}

export const SIGN_DATA: Record<string, SignInfo> = {
  Aries: { element: Element.Fuego, modality: Modality.Cardinal },
  Tauro: { element: Element.Tierra, modality: Modality.Fijo },
  Géminis: { element: Element.Aire, modality: Modality.Mutable },
  Cáncer: { element: Element.Agua, modality: Modality.Cardinal },
  Leo: { element: Element.Fuego, modality: Modality.Fijo },
  Virgo: { element: Element.Tierra, modality: Modality.Mutable },
  Libra: { element: Element.Aire, modality: Modality.Cardinal },
  Escorpio: { element: Element.Agua, modality: Modality.Fijo },
  Sagitario: { element: Element.Fuego, modality: Modality.Mutable },
  Capricornio: { element: Element.Tierra, modality: Modality.Cardinal },
  Acuario: { element: Element.Aire, modality: Modality.Fijo },
  Piscis: { element: Element.Agua, modality: Modality.Mutable },
};

export interface PlanetScores {
  elementScore: number;
  modalityScore: number;
}

export const PLANET_SCORES: Record<string, PlanetScores> = {
  Ascendente: { elementScore: 10, modalityScore: 2 },
  Luna: { elementScore: 7, modalityScore: 2 },
  Sol: { elementScore: 7, modalityScore: 2 },
  Mercurio: { elementScore: 5, modalityScore: 1 },
  Venus: { elementScore: 5, modalityScore: 1 },
  Marte: { elementScore: 4, modalityScore: 1 },
  Júpiter: { elementScore: 4, modalityScore: 1 },
  Saturno: { elementScore: 3, modalityScore: 1 },
  "Nodo Norte": { elementScore: 1, modalityScore: 1 },
  "Regente del Ascendente (RA)": { elementScore: 1, modalityScore: 1 },
  Urano: { elementScore: 0, modalityScore: 1 },
  Neptuno: { elementScore: 0, modalityScore: 1 },
  Plutón: { elementScore: 0, modalityScore: 1 },
  Quirón: { elementScore: 0, modalityScore: 1 },
  "Nodo Sur": { elementScore: 0, modalityScore: 1 },
};

export interface PlanetaryPosition {
  planeta: string;
  signo: string;
}

export interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  utcOffset?: number;
}

export interface SavedPerson extends BirthData {
  id: number;
  created_at: string;
}

export interface CalculationResult {
  luz: Element[];
  mascara: Element[];
  sombra: Element[];
  totalesElemento: Record<Element, number>;
  totalesModalidad: Record<Modality, number>;
  conteoPlanetasElemento: Record<Element, number>;
  regenteAscendente?: {
    planeta: string;
    signo: string;
    signoAscendente: string;
  };
}
