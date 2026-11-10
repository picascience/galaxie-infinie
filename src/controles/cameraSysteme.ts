// Caméra libre à l'intérieur d'un système solaire (jours 2 à 4).
//
// Deux idées la distinguent de la caméra de la carte galactique :
//
// 1. VITESSE ADAPTATIVE. La vitesse est proportionnelle à la distance du corps
//    le plus proche : on traverse le système en quelques secondes, mais on
//    ralentit tout seul en approchant d'une planète.
//
// 2. REPÈRE ATTACHÉ. Près d'une planète, la caméra est « attachée » à elle :
//    sa position est mémorisée par rapport à la planète, qui l'emporte donc
//    dans sa course autour de l'étoile. Sans cela, la planète filerait sous
//    nos yeux à des milliers de kilomètres par seconde.

import * as THREE from 'three';
import { ZONE_ENTREE, ZONE_SORTIE } from '../config/systeme';
import type { PositionDouble } from '../rendu/moteur';
import type { VueSysteme } from '../rendu/systeme/vueSysteme';
import type { Entrees } from './entrees';

const CRAN_MAX = 14;
const SENSIBILITE = 0.0022;
const VITESSE_ROULIS = 1.2;
const REACTIVITE = 3.5;
/** Durée d'un trajet automatique vers un corps (s). */
const DUREE_TRAJET = 2.6;

const AXE_X = new THREE.Vector3(1, 0, 0);
const AXE_Y = new THREE.Vector3(0, 1, 0);
const AXE_Z = new THREE.Vector3(0, 0, 1);

export class CameraSysteme {
  readonly orientation = new THREE.Quaternion();
  /** Position par rapport au centre du système (m). Recalculée à chaque image. */
  readonly abs: PositionDouble = { x: 0, y: 0, z: 0 };
  /** Rang du corps auquel la caméra est attachée (−1 : aucun, on suit le centre du système). */
  ancre = -1;
  /** Cran de vitesse (0 à CRAN_MAX). */
  cran = 8;
  /** Rang du corps le plus proche et distance à sa surface (m). */
  corpsProche = 0;
  altitude = 0;

  /** Position par rapport à l'ancre (m). */
  private readonly rel: PositionDouble = { x: 0, y: 0, z: 0 };
  private readonly vitesse = new THREE.Vector3();
  private readonly cible = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();
  private trajet: { depart: THREE.Vector3; arrivee: THREE.Vector3; de: THREE.Quaternion; vers: THREE.Quaternion; t: number } | null = null;

  /** Vitesse réelle (m/s). */
  get vitesseActuelle(): number {
    return this.vitesse.length();
  }

  /** Vrai pendant un trajet automatique. */
  get enTrajet(): boolean {
    return this.trajet !== null;
  }

  /** Point d'observation d'un corps : côté éclairé, un peu de biais. Résultat par rapport au corps. */
  private pointDeVue(vue: VueSysteme, rang: number, sortie: THREE.Vector3): void {
    const c = vue.corps[rang]!;
    if (c.genre === 'etoile') {
      sortie.set(0.5, 0.25, 0.83).normalize().multiplyScalar(c.rayon * 9);
      return;
    }
    const etoile = vue.corps[0]!.abs;
    const versEtoile = new THREE.Vector3(etoile.x - c.abs.x, etoile.y - c.abs.y, etoile.z - c.abs.z).normalize();
    const cote = new THREE.Vector3().crossVectors(versEtoile, AXE_Y).normalize();
    // Recul plus grand s'il y a des anneaux, pour les voir en entier.
    const recul = c.anneau && c.corps?.anneaux ? c.corps.anneaux.rayonExterieur * 2.6 : c.rayon * 4.2;
    sortie.copy(versEtoile).multiplyScalar(0.72).addScaledVector(cote, 0.62).addScaledVector(AXE_Y, 0.3).normalize().multiplyScalar(recul);
  }

  /** Orientation qui regarde le centre de l'ancre depuis la position `rel`. */
  private regarderCentre(rel: THREE.Vector3, sortie: THREE.Quaternion): void {
    const m = new THREE.Matrix4().lookAt(rel, new THREE.Vector3(0, 0, 0), AXE_Y);
    sortie.setFromRotationMatrix(m);
  }

  /** Pose immédiatement la caméra devant un corps. */
  placer(vue: VueSysteme, rang: number): void {
    const v = new THREE.Vector3();
    this.pointDeVue(vue, rang, v);
    this.ancre = rang;
    this.rel.x = v.x;
    this.rel.y = v.y;
    this.rel.z = v.z;
    this.regarderCentre(v, this.orientation);
    this.vitesse.set(0, 0, 0);
    this.trajet = null;
    this.calculerAbs(vue);
  }

  /** Lance un trajet automatique vers un corps. */
  allerVers(vue: VueSysteme, rang: number): void {
    const c = vue.corps[rang]!;
    // On passe tout de suite dans le repère du corps visé.
    const depart = new THREE.Vector3(this.abs.x - c.abs.x, this.abs.y - c.abs.y, this.abs.z - c.abs.z);
    const arrivee = new THREE.Vector3();
    this.pointDeVue(vue, rang, arrivee);
    const vers = new THREE.Quaternion();
    this.regarderCentre(arrivee, vers);
    this.ancre = rang;
    this.rel.x = depart.x;
    this.rel.y = depart.y;
    this.rel.z = depart.z;
    this.vitesse.set(0, 0, 0);
    this.trajet = { depart, arrivee, de: this.orientation.clone(), vers, t: 0 };
  }

  private calculerAbs(vue: VueSysteme): void {
    const a = this.ancre >= 0 ? vue.corps[this.ancre]!.abs : null;
    this.abs.x = (a ? a.x : 0) + this.rel.x;
    this.abs.y = (a ? a.y : 0) + this.rel.y;
    this.abs.z = (a ? a.z : 0) + this.rel.z;
  }

  /**
   * À appeler à chaque image, APRÈS vue.calculerPositions().
   * @param dt durée de l'image (s)
   */
  mettreAJour(dt: number, entrees: Entrees, vue: VueSysteme): void {
    this.cran = Math.max(0, Math.min(CRAN_MAX, this.cran + entrees.lireMolette()));
    const regard = entrees.lireRegard();

    if (this.trajet) {
      // --- Trajet automatique : on glisse du départ à l'arrivée, en douceur ---
      const tr = this.trajet;
      tr.t = Math.min(1, tr.t + dt / DUREE_TRAJET);
      const k = tr.t * tr.t * tr.t * (tr.t * (tr.t * 6 - 15) + 10);
      this.rel.x = tr.depart.x + (tr.arrivee.x - tr.depart.x) * k;
      this.rel.y = tr.depart.y + (tr.arrivee.y - tr.depart.y) * k;
      this.rel.z = tr.depart.z + (tr.arrivee.z - tr.depart.z) * k;
      this.orientation.slerpQuaternions(tr.de, tr.vers, Math.min(1, k * 1.6));
      if (tr.t >= 1) this.trajet = null;
    } else {
      // --- Pilotage manuel ---
      const roulis = (entrees.valeur('KeyQ') - entrees.valeur('KeyE')) * VITESSE_ROULIS * dt;
      this.tourner(AXE_Y, -regard.x * SENSIBILITE);
      this.tourner(AXE_X, -regard.y * SENSIBILITE);
      this.tourner(AXE_Z, roulis);
      this.orientation.normalize();

      const x = entrees.valeur('KeyD') - entrees.valeur('KeyA') + entrees.manche.x;
      const y = entrees.valeur('Space') - entrees.valeur('KeyC');
      const z = entrees.valeur('KeyS') - entrees.valeur('KeyW') + entrees.manche.y;
      this.cible.set(x, y, z);
      if (this.cible.lengthSq() > 1) this.cible.normalize();
      const pousse = entrees.appuyee('ShiftLeft') || entrees.appuyee('ShiftRight') ? 4 : 1;
      this.cible.multiplyScalar(this.vitesseMax * pousse).applyQuaternion(this.orientation);
      this.vitesse.lerp(this.cible, 1 - Math.exp(-dt * REACTIVITE));
      // Garde-fou : en une image, on ne parcourt jamais plus de la moitié de la
      // distance qui nous sépare du corps le plus proche. Impossible, donc, de
      // « sauter » par-dessus une planète entre deux images, même à vitesse maximale.
      let pas = dt;
      const parcours = this.vitesse.length() * dt;
      const limite = Math.max(this.altitude * 0.5, 50);
      if (parcours > limite) pas = dt * (limite / parcours);
      this.rel.x += this.vitesse.x * pas;
      this.rel.y += this.vitesse.y * pas;
      this.rel.z += this.vitesse.z * pas;
    }

    this.calculerAbs(vue);
    this.examinerCorps(vue);
  }

  /** Suit simplement son ancre, sans lire les commandes (pendant un saut hyperespace). */
  suivre(vue: VueSysteme): void {
    this.calculerAbs(vue);
  }

  /** Vitesse maximale en ce moment (m/s) : elle grandit avec la distance au corps le plus proche. */
  get vitesseMax(): number {
    const distance = Math.max(2e3, Math.min(this.altitude, 4e11));
    return 0.6 * Math.pow(10, (this.cran - 8) / 4) * distance;
  }

  /** Trouve le corps le plus proche, empêche de le traverser et choisit l'ancre. */
  private examinerCorps(vue: VueSysteme): void {
    let proche = 0;
    let altitudeMin = Infinity;
    let ancreVoulue = -1;
    let meilleureProximite = Infinity;
    for (let i = 0; i < vue.corps.length; i++) {
      const c = vue.corps[i]!;
      let dx = this.abs.x - c.abs.x;
      let dy = this.abs.y - c.abs.y;
      let dz = this.abs.z - c.abs.z;
      let d = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Collision : on ne descend pas sous la surface (avec une petite marge).
      const plancher = c.rayon * (c.genre === 'etoile' ? 1.08 : 1.003);
      if (d < plancher && !this.trajet) {
        const k = plancher / Math.max(d, 1);
        dx *= k;
        dy *= k;
        dz *= k;
        d = plancher;
        this.deplacerAbs(vue, c.abs.x + dx, c.abs.y + dy, c.abs.z + dz);
      }

      const altitude = d - c.rayon;
      if (altitude < altitudeMin) {
        altitudeMin = altitude;
        proche = i;
      }
      // Ancre : parmi les corps dont la zone nous contient, celui dont on est le
      // plus près en proportion de sa taille (distance ÷ rayon). Près d'une
      // planète c'est elle qui l'emporte ; près d'une de ses lunes, c'est la lune.
      // L'ancre actuelle est favorisée, pour éviter les allers-retours.
      if (c.genre !== 'etoile') {
        const actuelle = i === this.ancre;
        const proximite = (d / c.rayon) * (actuelle ? 0.7 : 1);
        if (d < c.rayon * (actuelle ? ZONE_SORTIE : ZONE_ENTREE) && proximite < meilleureProximite) {
          ancreVoulue = i;
          meilleureProximite = proximite;
        }
      }
    }
    this.corpsProche = proche;
    this.altitude = altitudeMin;
    if (!this.trajet && ancreVoulue !== this.ancre) this.changerAncre(vue, ancreVoulue);
  }

  /** Change d'ancre sans bouger la caméra. */
  private changerAncre(vue: VueSysteme, rang: number): void {
    const ancienne = this.ancre >= 0 ? vue.corps[this.ancre]!.abs : null;
    this.ancre = rang;
    this.deplacerAbs(vue, this.abs.x, this.abs.y, this.abs.z);
    // La vitesse était mesurée par rapport à l'ancienne ancre : on repart en douceur.
    if (ancienne) this.vitesse.multiplyScalar(0.5);
  }

  /** Place la caméra à une position absolue donnée (met à jour la position relative). */
  private deplacerAbs(vue: VueSysteme, x: number, y: number, z: number): void {
    const a = this.ancre >= 0 ? vue.corps[this.ancre]!.abs : null;
    this.rel.x = x - (a ? a.x : 0);
    this.rel.y = y - (a ? a.y : 0);
    this.rel.z = z - (a ? a.z : 0);
    this.abs.x = x;
    this.abs.y = y;
    this.abs.z = z;
  }

  private tourner(axe: THREE.Vector3, angle: number): void {
    if (angle === 0) return;
    this.rotation.setFromAxisAngle(axe, angle);
    this.orientation.multiply(this.rotation);
  }
}
