// Affichage du nuage galactique : la bande lumineuse dans le ciel,
// et la spirale entière quand on sort de la galaxie.

import * as THREE from 'three';
import { RAYON_GALAXIE } from '../../config/echelles';
import type { ParametresGalaxie } from '../../univers/galaxie/densite';
import { genererNuageGalactique } from '../../univers/galaxie/nuage';
import type { Moteur, PositionDouble } from '../moteur';
import fragment from '../shaders/nuage.frag.glsl?raw';
import sommets from '../shaders/nuage.vert.glsl?raw';

export class FondGalactique {
  readonly points: THREE.Points;
  private readonly materiau: THREE.ShaderMaterial;

  /** Intensité de base : moins il y a de particules, plus chacune doit être lumineuse. */
  private readonly intensiteDeBase: number;

  constructor(parametres: ParametresGalaxie, nombreParticules: number) {
    this.intensiteDeBase = (0.014 * 300_000) / nombreParticules;
    const nuage = genererNuageGalactique(parametres, nombreParticules);

    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute('position', new THREE.BufferAttribute(nuage.positions, 3));
    geometrie.setAttribute('couleur', new THREE.BufferAttribute(nuage.couleurs, 3));
    geometrie.setAttribute('taille', new THREE.BufferAttribute(nuage.tailles, 1));

    this.materiau = new THREE.ShaderMaterial({
      vertexShader: sommets,
      fragmentShader: fragment,
      uniforms: {
        uFacteurProjection: { value: 1 },
        uTailleMax: { value: 64 },
        uIntensite: { value: 1 },
        uProcheDebut: { value: 400 },
        uProcheFin: { value: 3000 },
      },
      // Les lumières s'additionnent ; le fond ne cache jamais rien.
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometrie, this.materiau);
    this.points.frustumCulled = false;
    this.points.renderOrder = -2;
  }

  /** À appeler à chaque image : replace la galaxie autour de la caméra (origine flottante). */
  mettreAJour(camera: PositionDouble, moteur: Moteur): void {
    // Le centre de la galaxie est en (0, 0, 0) : vu de la caméra, il est en −caméra.
    this.points.position.set(-camera.x, -camera.y, -camera.z);
    this.materiau.uniforms.uFacteurProjection!.value = moteur.facteurProjection;

    // « Exposition » automatique, comme un appareil photo ou un œil qui s'adapte.
    // Dans le disque, on regarde à travers des milliers d'années-lumière d'étoiles :
    // la bande est très lumineuse. Vue de l'extérieur, la galaxie est bien plus
    // pâle : on augmente alors progressivement sa luminosité.
    const rayon = Math.sqrt(camera.x * camera.x + camera.z * camera.z);
    const auDessus = THREE.MathUtils.smoothstep(Math.abs(camera.y), 800, 15_000);
    const auDela = THREE.MathUtils.smoothstep(rayon, RAYON_GALAXIE * 0.85, RAYON_GALAXIE * 1.4);
    const dehors = Math.max(auDessus, auDela);
    this.materiau.uniforms.uIntensite!.value = this.intensiteDeBase * (1 + 3.5 * dehors);
    this.materiau.uniforms.uTailleMax!.value = 64 * moteur.rapportPixels;
  }
}
