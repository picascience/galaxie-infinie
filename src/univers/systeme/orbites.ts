// Position d'un corps sur son orbite à un instant donné.
// C'est une simple formule : pas de simulation, donc pas d'erreur qui
// s'accumule. Le même instant donne toujours la même position.

import { DEUX_PI, cos, sin } from '../../maths/fonctions';
import type { Orbite } from './modele';

/**
 * Écrit dans `sortie` la position du corps par rapport au centre de son orbite (m).
 * @param t temps du jeu (s)
 */
export function positionOrbite(o: Orbite, t: number, sortie: { x: number; y: number; z: number }): void {
  if (o.rayon === 0) {
    sortie.x = 0;
    sortie.y = 0;
    sortie.z = 0;
    return;
  }
  // Fraction de tour accomplie (entre 0 et 1) : garde toute la précision même après des heures de jeu.
  const tours = t / o.periode;
  const angle = o.phase + DEUX_PI * (tours - Math.floor(tours));
  // Cercle dans le plan horizontal…
  const x = o.rayon * cos(angle);
  const z = o.rayon * sin(angle);
  // … que l'on incline…
  const y1 = -z * sin(o.inclinaison);
  const z1 = z * cos(o.inclinaison);
  // … puis que l'on fait pivoter autour de l'axe vertical.
  const c = cos(o.noeud);
  const s = sin(o.noeud);
  sortie.x = x * c + z1 * s;
  sortie.y = y1;
  sortie.z = -x * s + z1 * c;
}
