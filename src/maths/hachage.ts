// Hachage entier : transforme des nombres (graine, coordonnées…) en un
// nombre « mélangé » de 32 bits. C'est la base du déterminisme du jeu :
// les mêmes entrées donnent toujours la même sortie, sur tout appareil,
// car on n'utilise que des opérations entières exactes.

/** Mélange final des bits (même recette que l'algorithme MurmurHash3). */
export function melanger32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Ajoute une valeur entière à un hachage en cours. */
function combiner(h: number, valeur: number): number {
  // `| 0` ramène tout sur 32 bits : le résultat reste exact et identique partout.
  const melange = (h ^ (valeur | 0)) | 0;
  return melanger32((melange + 0x9e3779b9 + ((h << 6) | 0) + (h >>> 2)) | 0);
}

/** Hache deux entiers. */
export function hacher2(a: number, b: number): number {
  return combiner(combiner(0x2545f491, a), b);
}

/** Hache trois entiers. */
export function hacher3(a: number, b: number, c: number): number {
  return combiner(combiner(combiner(0x2545f491, a), b), c);
}

/** Hache cinq entiers (graine, niveau et coordonnées d'un secteur, par exemple). */
export function hacher5(a: number, b: number, c: number, d: number, e: number): number {
  return combiner(combiner(combiner(combiner(combiner(0x2545f491, a), b), c), d), e);
}

/** Transforme un texte (la graine tapée par le joueur) en nombre de 32 bits. */
export function hacherTexte(texte: string): number {
  // Algorithme FNV-1a, suivi d'un mélange final.
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return melanger32(h);
}
