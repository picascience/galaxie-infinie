// Effet visuel du saut hyperespace : des traits de lumière plein écran.
// Il est posé par-dessus l'image ; pendant qu'il masque le décor, le jeu
// remplace le système de départ par le système d'arrivée.

import * as THREE from 'three';
import type { Moteur } from '../moteur';
import { hyperespaceFragment, hyperespaceSommets } from '../shaders';

export class EffetHyperespace {
  private readonly maille: THREE.Mesh;
  private readonly materiau: THREE.ShaderMaterial;
  private temps = 0;

  constructor(private readonly moteur: Moteur) {
    // Un seul grand triangle suffit à couvrir tout l'écran.
    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.materiau = new THREE.ShaderMaterial({
      vertexShader: hyperespaceSommets,
      fragmentShader: hyperespaceFragment,
      uniforms: { uTemps: { value: 0 }, uForce: { value: 0 }, uRapport: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // Mélange : lumière de l'effet + décor assombri par le voile.
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.maille = new THREE.Mesh(geometrie, this.materiau);
    this.maille.frustumCulled = false;
  }

  /**
   * @param force 0 = effet absent, 1 = effet complet
   * @param dt    durée de l'image (s)
   */
  mettreAJour(force: number, dt: number): void {
    const visible = force > 0.001;
    if (visible && !this.maille.parent) this.moteur.sceneEffets.add(this.maille);
    if (!visible && this.maille.parent) this.moteur.sceneEffets.remove(this.maille);
    if (!visible) return;
    this.temps += dt;
    this.materiau.uniforms.uTemps!.value = this.temps;
    this.materiau.uniforms.uForce!.value = force;
    this.materiau.uniforms.uRapport!.value = this.moteur.rapportEcran;
  }
}
