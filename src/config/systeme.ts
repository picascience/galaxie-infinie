// Grandeurs des systèmes solaires.
// Unité de longueur dans un système : le mètre. Unité de temps : la seconde.
//
// Tout le système est à l'échelle 1/10 environ : planètes, étoiles et orbites
// sont dix fois plus petites que dans la réalité. Comme tout est réduit dans
// la même proportion, le soleil garde dans le ciel la taille qu'on lui connaît.

/** Une « unité astronomique » du jeu : la distance Terre-Soleil divisée par 10 (m). */
export const UA = 1.5e10;
/** Rayon d'une étoile comme le Soleil, à l'échelle du jeu (m). */
export const RAYON_SOLAIRE = 7.0e7;
/** Nombre de mètres dans une année-lumière (pour passer de la galaxie au système). */
export const METRES_PAR_AL = 9.46e15;

/**
 * Durée d'une révolution pour une planète située à 1 UA d'une étoile comme
 * le Soleil (secondes). Le temps est accéléré pour que les orbites soient
 * visiblement animées : ici une « année » dure 2 heures.
 */
export const PERIODE_A_1_UA = 7200;

/** Durée minimale et maximale d'un jour sur une planète (secondes) : 15 à 60 minutes. */
export const DUREE_JOUR = [900, 3600] as const;

/** Nombre maximal de planètes et de lunes. */
export const MAX_PLANETES = 10;
export const MAX_LUNES = 4;

/** Rayon pour lequel la gravité vaut celle de la Terre, à densité égale (m). */
export const RAYON_GRAVITE_TERRESTRE = 6.37e5;

/**
 * Autour d'un corps, la caméra (puis le vaisseau) se déplace « avec » lui.
 * On entre dans sa zone à ENTREE × rayon, on en sort à SORTIE × rayon.
 */
export const ZONE_ENTREE = 25;
export const ZONE_SORTIE = 32;
