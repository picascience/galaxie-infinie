// Description d'un système solaire : ses étoiles, ses planètes, leurs lunes,
// leurs anneaux et ses ceintures d'astéroïdes.
// Ce ne sont que des données : l'affichage est fait ailleurs (src/rendu/systeme).

import type { Couleur, IdType } from '../planetes/types/definition';

/** Orbite circulaire autour d'un centre (étoile pour une planète, planète pour une lune). */
export interface Orbite {
  /** Distance au centre (m). */
  rayon: number;
  /** Durée d'un tour (s). */
  periode: number;
  /** Angle de départ sur l'orbite (radians). */
  phase: number;
  /** Inclinaison du plan de l'orbite (radians). */
  inclinaison: number;
  /** Direction vers laquelle le plan est incliné (radians). */
  noeud: number;
}

export interface Anneaux {
  /** Bord intérieur et bord extérieur, mesurés depuis le centre de la planète (m). */
  rayonInterieur: number;
  rayonExterieur: number;
  couleur: Couleur;
  graine: number;
}

/** Une planète ou une lune. */
export interface Corps {
  graine: number;
  nom: string;
  type: IdType;
  /** Vrai pour une lune. */
  estLune: boolean;
  /** Rayon (m). */
  rayon: number;
  orbite: Orbite;
  /** Durée d'un tour sur elle-même (s). */
  dureeJour: number;
  /** Inclinaison de l'axe de rotation (radians). */
  inclinaisonAxe: number;
  /** Gravité à la surface (m/s²). */
  gravite: number;
  /** Température moyenne (kelvins). */
  temperature: number;
  /** Couleurs propres à ce corps (celles de son type, légèrement variées). */
  couleurBasse: Couleur;
  couleurMoyenne: Couleur;
  couleurHaute: Couleur;
  anneaux: Anneaux | null;
  lunes: Corps[];
}

export interface EtoileSysteme {
  nom: string;
  /** Famille (indice dans CLASSES_ETOILES). */
  classe: number;
  /** Rayon (m). */
  rayon: number;
  /** Éclat, en multiples de celui du Soleil. */
  luminosite: number;
  temperature: number;
  couleur: Couleur;
  /** Orbite autour du centre du système (rayon nul pour une étoile seule). */
  orbite: Orbite;
}

export interface Ceinture {
  rayonInterieur: number;
  rayonExterieur: number;
  /** Durée d'un tour de la ceinture (s). */
  periode: number;
  graine: number;
}

export interface Systeme {
  graine: number;
  nom: string;
  etoiles: EtoileSysteme[];
  planetes: Corps[];
  ceintures: Ceinture[];
  /** Éclat total des étoiles du système. */
  luminositeTotale: number;
}
