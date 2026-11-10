// Point d'accès unique aux shaders GLSL.
// Les fichiers .glsl sont importés sous forme de texte (« ?raw »).
// Le morceau commun « bruit » est enregistré auprès de Three.js pour que les
// shaders puissent l'inclure avec la ligne « #include <bruit> ».

import * as THREE from 'three';
import anneauFragment from './anneau.frag.glsl?raw';
import bruit from './bruit.glsl?raw';
import corpsSommets from './corps.vert.glsl?raw';
import etoileFragment from './etoile.frag.glsl?raw';
import haloFragment from './halo.frag.glsl?raw';
import haloSommets from './halo.vert.glsl?raw';
import hyperespaceFragment from './hyperespace.frag.glsl?raw';
import hyperespaceSommets from './hyperespace.vert.glsl?raw';
import planeteFragment from './planete.frag.glsl?raw';

(THREE.ShaderChunk as Record<string, string>)['bruit'] = bruit;

export {
  anneauFragment,
  corpsSommets,
  etoileFragment,
  haloFragment,
  haloSommets,
  hyperespaceFragment,
  hyperespaceSommets,
  planeteFragment,
};
