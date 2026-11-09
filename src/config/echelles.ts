// Toutes les grandeurs de la galaxie, réunies au même endroit.
// Unité de longueur à l'échelle galactique : l'année-lumière (al).

/** Rayon du disque de la galaxie (al). */
export const RAYON_GALAXIE = 50_000;
/** Distance sur laquelle la densité du disque est divisée par e ≈ 2,7 (al). */
export const ECHELLE_RADIALE = 11_000;
/** Demi-épaisseur caractéristique du disque (al). */
export const ECHELLE_VERTICALE = 350;
/** Rayon du bulbe central (al). */
export const RAYON_BULBE = 4_500;
/** Aplatissement vertical du bulbe (1 = sphère). */
export const APLATISSEMENT_BULBE = 0.6;

/** Densité de référence du disque (étoiles par al³), avant atténuation. */
export const DENSITE_DISQUE = 0.045;
/** Densité au cœur du bulbe (étoiles par al³). */
export const DENSITE_BULBE = 0.02;
/**
 * Plafond de densité pour les étoiles réellement générées.
 * Sans lui, le centre de la galaxie contiendrait trop d'étoiles à afficher.
 */
export const PLAFOND_DENSITE = 0.02;

/**
 * Les étoiles sont rangées en 4 niveaux selon leur éclat.
 * Plus une étoile est brillante, plus on la voit de loin : ses secteurs
 * sont donc plus grands. `taille` = côté d'un secteur cubique (al).
 */
export const NIVEAUX_SECTEURS = [
  { taille: 16 }, // naines rouges et naines blanches : visibles de près seulement
  { taille: 40 }, // naines orange et jaunes
  { taille: 100 }, // étoiles blanches
  { taille: 250 }, // géantes rouges et bleues : visibles de très loin
] as const;

/** Nombre maximal d'étoiles candidates par secteur (garde-fou). */
export const MAX_CANDIDATES_PAR_SECTEUR = 4096;

/** Position de départ du joueur (al) : dans le disque, à mi-chemin du bord. */
export const POSITION_DEPART = { x: 26_000, y: 40, z: 0 } as const;

/** Graine utilisée si le joueur n'en choisit pas. */
export const GRAINE_PAR_DEFAUT = 'GALAXIE-1';
