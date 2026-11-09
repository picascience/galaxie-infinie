// Le « nuage galactique » : quelques centaines de milliers de points lumineux
// qui représentent, de loin, la lumière cumulée des milliards d'étoiles.
// C'est lui qui dessine la bande lumineuse dans le ciel et la spirale vue
// de l'extérieur. Les étoiles individuelles proches sont gérées à part
// (voir secteurs.ts).

import {
  APLATISSEMENT_BULBE,
  ECHELLE_RADIALE,
  ECHELLE_VERTICALE,
  RAYON_BULBE,
  RAYON_GALAXIE,
} from '../../config/echelles';
import { Aleatoire } from '../../maths/aleatoire';
import { DEUX_PI, cos, ln, sin } from '../../maths/fonctions';
import { hacher2 } from '../../maths/hachage';
import { facteurBras, type ParametresGalaxie } from './densite';

export interface NuageGalactique {
  nombre: number;
  /** Positions par rapport au centre de la galaxie (al), 3 nombres par point. */
  positions: Float32Array;
  /** Couleurs RVB, 3 nombres par point. */
  couleurs: Float32Array;
  /** Diamètre de chaque tache lumineuse (al). */
  tailles: Float32Array;
}

/** Part des points consacrée au bulbe central. */
const PART_BULBE = 0.22;

export function genererNuageGalactique(p: ParametresGalaxie, nombre: number): NuageGalactique {
  const alea = new Aleatoire(hacher2(p.graine, 2));
  const positions = new Float32Array(nombre * 3);
  const couleurs = new Float32Array(nombre * 3);
  const tailles = new Float32Array(nombre);

  let n = 0;
  let securite = nombre * 40;
  while (n < nombre && securite-- > 0) {
    let x: number;
    let y: number;
    let z: number;
    let rouge: number;
    let vert: number;
    let bleu: number;
    let taille: number;

    if (alea.suivant() < PART_BULBE) {
      // Bulbe : la somme de 3 tirages donne une répartition « en cloche ».
      const cloche = () => (alea.suivant() + alea.suivant() + alea.suivant() - 1.5) * 1.4;
      x = cloche() * RAYON_BULBE;
      y = cloche() * RAYON_BULBE * APLATISSEMENT_BULBE;
      z = cloche() * RAYON_BULBE;
      // Vieilles étoiles : lumière chaude, jaune-orangé.
      const nuance = alea.suivant();
      // (Le bulbe est très dense : chaque point y est volontairement moins lumineux,
      // sinon le centre de la galaxie serait une tache blanche uniforme.)
      rouge = 0.5;
      vert = 0.39 + 0.05 * nuance;
      bleu = 0.25 + 0.07 * nuance;
      taille = alea.intervalle(260, 520);
    } else {
      // Disque : le rayon suit la décroissance exponentielle de la densité.
      const r = -ECHELLE_RADIALE * ln((1 - alea.suivant()) * (1 - alea.suivant()));
      const theta = alea.suivant() * DEUX_PI;
      const tirage = alea.suivant();
      const cote = alea.suivant() < 0.5 ? -1 : 1;
      const hauteur = -ECHELLE_VERTICALE * ln(1 - alea.suivant());
      const nuance = alea.suivant();
      const tirageTaille = alea.suivant();
      if (r > RAYON_GALAXIE) continue;
      // On garde davantage de points dans les bras qu'entre les bras.
      const bras = facteurBras(p, r, theta);
      if (tirage * 2.25 > bras) continue;
      x = r * cos(theta);
      z = r * sin(theta);
      y = cote * hauteur;
      const dansUnBras = (bras - 0.35) / 1.9; // 0 entre les bras, 1 au cœur d'un bras
      if (nuance < 0.035 * dansUnBras) {
        // Quelques régions de formation d'étoiles : teinte rosée.
        rouge = 1.0;
        vert = 0.45;
        bleu = 0.6;
      } else {
        // Jeunes étoiles bleutées dans les bras, lumière plus jaune ailleurs.
        rouge = 0.95 - 0.3 * dansUnBras + 0.05 * nuance;
        vert = 0.86 - 0.08 * dansUnBras + 0.05 * nuance;
        bleu = 0.72 + 0.28 * dansUnBras;
      }
      taille = 170 + 260 * tirageTaille;
    }

    positions[n * 3] = x;
    positions[n * 3 + 1] = y;
    positions[n * 3 + 2] = z;
    couleurs[n * 3] = rouge;
    couleurs[n * 3 + 1] = vert;
    couleurs[n * 3 + 2] = bleu;
    tailles[n] = taille;
    n++;
  }

  return {
    nombre: n,
    positions: positions.subarray(0, n * 3),
    couleurs: couleurs.subarray(0, n * 3),
    tailles: tailles.subarray(0, n),
  };
}
