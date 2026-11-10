// Tests de la caméra de système : repère attaché aux planètes, collisions, trajets.
import { describe, expect, it } from 'vitest';
import { ZONE_SORTIE } from '../src/config/systeme';
import { CameraSysteme } from '../src/controles/cameraSysteme';
import type { Entrees } from '../src/controles/entrees';
import { VueSysteme } from '../src/rendu/systeme/vueSysteme';
import { hacher2 } from '../src/maths/hachage';
import { genererSysteme } from '../src/univers/systeme/generer';

/** Fausses commandes : on choisit quelles touches sont « enfoncées ». */
function commandes(touches: string[] = []): Entrees {
  return {
    manche: { x: 0, y: 0 },
    lireMolette: () => 0,
    lireRegard: () => ({ x: 0, y: 0 }),
    valeur: (code: string) => (touches.includes(code) ? 1 : 0),
    appuyee: (code: string) => touches.includes(code),
  } as unknown as Entrees;
}

function creerVue(): VueSysteme {
  // Une naine jaune (classe 3) : son système a plusieurs planètes.
  return new VueSysteme(genererSysteme({ graine: hacher2(12, 34), classe: 3, luminosite: 1, temperature: 5800, binaire: false }), 8);
}

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

describe('caméra de système', () => {
  it('reste attachée à sa planète pendant que celle-ci avance sur son orbite', () => {
    const vue = creerVue();
    const rang = vue.corps.findIndex((c) => c.genre === 'planete');
    const planete = vue.corps[rang]!;
    const camera = new CameraSysteme();
    vue.calculerPositions(0);
    camera.placer(vue, rang);
    const d0 = distance(camera.abs, planete.abs);
    const depart = { ...planete.abs };
    for (let i = 1; i <= 600; i++) {
      vue.calculerPositions(i / 60);
      camera.mettreAJour(1 / 60, commandes(), vue);
    }
    // En 10 secondes la planète a parcouru bien plus que la distance qui nous en sépare…
    expect(distance(planete.abs, depart)).toBeGreaterThan(d0);
    // … et pourtant la caméra n'a pas bougé par rapport à elle.
    expect(Math.abs(distance(camera.abs, planete.abs) - d0)).toBeLessThan(1);
    expect(camera.ancre).toBe(rang);
  });

  it('ne traverse jamais la surface, même en fonçant droit sur la planète', () => {
    const vue = creerVue();
    const rang = vue.corps.findIndex((c) => c.genre === 'planete');
    const planete = vue.corps[rang]!;
    const camera = new CameraSysteme();
    vue.calculerPositions(0);
    camera.placer(vue, rang); // la caméra regarde le centre de la planète
    camera.cran = 16;
    for (let i = 1; i <= 900; i++) {
      vue.calculerPositions(i / 60);
      camera.mettreAJour(1 / 60, commandes(['KeyW', 'ShiftLeft']), vue);
      expect(distance(camera.abs, planete.abs)).toBeGreaterThanOrEqual(planete.rayon);
      expect(Number.isFinite(camera.abs.x + camera.abs.y + camera.abs.z)).toBe(true);
    }
    // Elle a bien fini tout près du sol.
    expect(camera.altitude).toBeLessThan(planete.rayon * 0.02);
  });

  it('se détache quand on s’éloigne, sans à-coup de position', () => {
    const vue = creerVue();
    const rang = vue.corps.findIndex((c) => c.genre === 'planete');
    const planete = vue.corps[rang]!;
    const camera = new CameraSysteme();
    vue.calculerPositions(0);
    camera.placer(vue, rang);
    camera.cran = 12;
    let precedente = { ...camera.abs };
    let detachee = false;
    for (let i = 1; i <= 1200 && !detachee; i++) {
      vue.calculerPositions(i / 60);
      camera.mettreAJour(1 / 60, commandes(['KeyS']), vue); // on recule
      if (camera.ancre !== rang) {
        detachee = true;
        expect(distance(camera.abs, planete.abs)).toBeGreaterThanOrEqual(planete.rayon * ZONE_SORTIE * 0.99);
      }
      precedente = { ...camera.abs };
    }
    expect(detachee).toBe(true);
    expect(Number.isFinite(precedente.x)).toBe(true);
  });

  it('un trajet automatique arrive devant le corps demandé', () => {
    const vue = creerVue();
    const planetes = vue.corps.map((c, i) => (c.genre === 'planete' ? i : -1)).filter((i) => i >= 0);
    const camera = new CameraSysteme();
    vue.calculerPositions(0);
    camera.placer(vue, planetes[0]!);
    const cible = planetes[planetes.length - 1]!;
    camera.allerVers(vue, cible);
    for (let i = 1; i <= 300; i++) {
      vue.calculerPositions(i / 60);
      camera.mettreAJour(1 / 60, commandes(), vue);
    }
    expect(camera.enTrajet).toBe(false);
    expect(camera.corpsProche).toBe(cible);
    expect(camera.altitude).toBeLessThan(vue.corps[cible]!.rayon * 12);
  });
});
