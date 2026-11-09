// Forme de la galaxie : combien d'étoiles y a-t-il en chaque point de l'espace ?
// La galaxie est un disque mince avec des bras spiraux et un bulbe central.
// Repère : le disque est dans le plan (x, z) ; l'axe y est perpendiculaire.

import {
  APLATISSEMENT_BULBE,
  DENSITE_BULBE,
  DENSITE_DISQUE,
  ECHELLE_RADIALE,
  ECHELLE_VERTICALE,
  PLAFOND_DENSITE,
  RAYON_BULBE,
  RAYON_GALAXIE,
} from '../../config/echelles';
import { Aleatoire } from '../../maths/aleatoire';
import { DEUX_PI, PI, atan2, cos, exp, ln, sin } from '../../maths/fonctions';
import { hacher2, hacherTexte } from '../../maths/hachage';

/** Ce qui distingue une galaxie d'une autre. Tout découle de la graine. */
export interface ParametresGalaxie {
  /** Graine telle que le joueur l'a tapée. */
  graineTexte: string;
  /** Graine transformée en nombre de 32 bits. */
  graine: number;
  /** Nombre de bras spiraux (2 à 5). */
  nombreBras: number;
  /** Serrage de la spirale (plus c'est grand, plus les bras s'enroulent). */
  enroulement: number;
  /** Orientation de départ des bras (radians). */
  phase: number;
}

/** Construit les paramètres d'une galaxie à partir de sa graine. */
export function creerParametresGalaxie(graineTexte: string): ParametresGalaxie {
  const graine = hacherTexte(graineTexte);
  const alea = new Aleatoire(hacher2(graine, 1));
  const nombreBras = alea.entier(2, 5);
  // Angle d'ouverture des bras, entre 16° et 26° (plus il est grand, plus les bras sont ouverts).
  const angle = (alea.intervalle(16, 26) * PI) / 180;
  const enroulement = cos(angle) / sin(angle);
  const phase = alea.intervalle(0, DEUX_PI);
  return { graineTexte, graine, nombreBras, enroulement, phase };
}

/**
 * Renforcement dû aux bras spiraux au point de rayon r et d'angle theta.
 * Résultat : environ 0,35 entre les bras, jusqu'à 2,25 au cœur d'un bras.
 */
export function facteurBras(p: ParametresGalaxie, r: number, theta: number): number {
  const rayon = r < 1000 ? 1000 : r;
  // Spirale logarithmique : l'angle du bras augmente avec le logarithme du rayon.
  const angle = p.nombreBras * (theta - p.enroulement * ln(rayon / 1000)) + p.phase;
  const onde = 0.5 + 0.5 * cos(angle);
  const bras = onde * onde * onde;
  const facteur = 0.35 + 1.9 * bras;
  // Près du centre, les bras s'effacent progressivement.
  const t = r >= 3000 ? 1 : r / 3000;
  return 1 + (facteur - 1) * t;
}

/** Densité « vraie » de la galaxie (étoiles par al³), sans plafond. */
export function densiteBrute(p: ParametresGalaxie, x: number, y: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);
  const hauteur = Math.abs(y);

  // Bulbe central : une boule un peu aplatie.
  const yb = y / APLATISSEMENT_BULBE;
  const d2 = (r * r + yb * yb) / (RAYON_BULBE * RAYON_BULBE);
  const bulbe = d2 < 40 ? DENSITE_BULBE * exp(-d2) : 0;

  // Disque : s'atténue vers le bord et quand on s'éloigne du plan.
  const bord = 1 - (r * r) / (RAYON_GALAXIE * RAYON_GALAXIE);
  if (bord <= 0 || hauteur > 30 * ECHELLE_VERTICALE) return bulbe;
  const coupure = bord > 0.25 ? 1 : bord * 4;
  const disque =
    DENSITE_DISQUE *
    exp(-r / ECHELLE_RADIALE - hauteur / ECHELLE_VERTICALE) *
    facteurBras(p, r, atan2(z, x)) *
    coupure;

  return disque + bulbe;
}

/** Densité utilisée pour créer les étoiles : la densité vraie, plafonnée. */
export function densiteEtoiles(p: ParametresGalaxie, x: number, y: number, z: number): number {
  const d = densiteBrute(p, x, y, z);
  return d > PLAFOND_DENSITE ? PLAFOND_DENSITE : d;
}

/**
 * Estime le nombre total d'étoiles de la galaxie en additionnant la densité
 * sur une grille. (Les étoiles ne sont jamais stockées : on ne peut que compter ainsi.)
 */
export function estimerNombreEtoiles(p: ParametresGalaxie): number {
  const pasR = 160;
  const pasTheta = 16;
  const pasY = 120;
  const demiHauteur = 3000;
  const dr = RAYON_GALAXIE / pasR;
  const dTheta = DEUX_PI / pasTheta;
  const dy = (2 * demiHauteur) / pasY;
  let total = 0;
  for (let i = 0; i < pasR; i++) {
    const r = (i + 0.5) * dr;
    for (let j = 0; j < pasTheta; j++) {
      const theta = (j + 0.5) * dTheta;
      const x = r * cos(theta);
      const z = r * sin(theta);
      let colonne = 0;
      for (let k = 0; k < pasY; k++) {
        colonne += densiteEtoiles(p, x, -demiHauteur + (k + 0.5) * dy, z);
      }
      total += colonne * dy * r * dr * dTheta;
    }
  }
  return total;
}
