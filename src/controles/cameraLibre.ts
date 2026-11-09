// Caméra libre de développement (jours 1 à 4).
// Elle permet de se déplacer partout dans la galaxie, dans toutes les
// directions, à des vitesses allant d'une promenade entre étoiles voisines
// à la traversée de la galaxie en quelques secondes.
// Le vrai vaisseau la remplacera au jour 5.

import * as THREE from 'three';
import type { PositionDouble } from '../rendu/moteur';
import type { Entrees } from './entrees';

/** Vitesse du premier cran (années-lumière par seconde). */
const VITESSE_MIN = 0.05;
/** Nombre de crans de vitesse ; 4 crans multiplient la vitesse par 10. */
const CRAN_MAX = 22;
/** Radians de rotation par pixel de déplacement de la souris. */
const SENSIBILITE = 0.0022;
/** Vitesse de roulis au clavier (radians par seconde). */
const VITESSE_ROULIS = 1.2;
/** Réactivité : plus c'est grand, plus la caméra atteint vite la vitesse voulue. */
const REACTIVITE = 3.5;

const AXE_X = new THREE.Vector3(1, 0, 0);
const AXE_Y = new THREE.Vector3(0, 1, 0);
const AXE_Z = new THREE.Vector3(0, 0, 1);

export class CameraLibre {
  /** Position dans la galaxie (al), en double précision. */
  readonly position: PositionDouble;
  /** Orientation de la caméra. */
  readonly orientation = new THREE.Quaternion();
  /** Cran de vitesse actuel (0 à CRAN_MAX). */
  cran = 8;

  private readonly vitesse = new THREE.Vector3();
  private readonly cible = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();

  constructor(depart: PositionDouble) {
    this.position = { x: depart.x, y: depart.y, z: depart.z };
  }

  /** Vitesse maximale au cran actuel (al/s). */
  get vitesseMax(): number {
    return VITESSE_MIN * Math.pow(10, this.cran / 4);
  }

  /** Vitesse réelle en ce moment (al/s). */
  get vitesseActuelle(): number {
    return this.vitesse.length();
  }

  /** Oriente la caméra : `lacet` = gauche/droite, `tangage` = haut/bas (degrés). */
  orienter(lacetDegres: number, tangageDegres: number): void {
    this.orientation.setFromAxisAngle(AXE_Y, (lacetDegres * Math.PI) / 180);
    this.rotation.setFromAxisAngle(AXE_X, (tangageDegres * Math.PI) / 180);
    this.orientation.multiply(this.rotation);
  }

  /** À appeler à chaque image. `dt` = durée de l'image (secondes). */
  mettreAJour(dt: number, entrees: Entrees): void {
    // 1. Réglage de la vitesse (molette, ou boutons + et − sur écran tactile).
    this.cran += entrees.lireMolette();
    this.cran = Math.max(0, Math.min(CRAN_MAX, this.cran));

    // 2. Rotation. Dans l'espace il n'y a ni haut ni bas : on tourne autour
    //    des axes de la caméra elle-même.
    const regard = entrees.lireRegard();
    const roulis = (entrees.valeur('KeyQ') - entrees.valeur('KeyE')) * VITESSE_ROULIS * dt;
    this.tourner(AXE_Y, -regard.x * SENSIBILITE);
    this.tourner(AXE_X, -regard.y * SENSIBILITE);
    this.tourner(AXE_Z, roulis);
    this.orientation.normalize();

    // 3. Direction voulue, dans le repère de la caméra (−z = droit devant).
    const x = entrees.valeur('KeyD') - entrees.valeur('KeyA') + entrees.manche.x;
    const y = entrees.valeur('Space') - entrees.valeur('KeyC');
    const z = entrees.valeur('KeyS') - entrees.valeur('KeyW') + entrees.manche.y;
    this.cible.set(x, y, z);
    if (this.cible.lengthSq() > 1) this.cible.normalize();
    const pousse = entrees.appuyee('ShiftLeft') || entrees.appuyee('ShiftRight') ? 10 : 1;
    this.cible.multiplyScalar(this.vitesseMax * pousse).applyQuaternion(this.orientation);

    // 4. Inertie douce : la vitesse rejoint progressivement la vitesse voulue.
    this.vitesse.lerp(this.cible, 1 - Math.exp(-dt * REACTIVITE));

    // 5. Déplacement, en double précision.
    this.position.x += this.vitesse.x * dt;
    this.position.y += this.vitesse.y * dt;
    this.position.z += this.vitesse.z * dt;
  }

  private tourner(axe: THREE.Vector3, angle: number): void {
    if (angle === 0) return;
    this.rotation.setFromAxisAngle(axe, angle);
    this.orientation.multiply(this.rotation);
  }
}
