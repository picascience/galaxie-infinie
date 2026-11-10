// Le moteur de rendu : il possède le « renderer » Three.js, les scènes et les caméras.
//
// Deux principes pour gérer les très grandes distances :
//
// 1. ORIGINE FLOTTANTE. La caméra reste toujours au point (0, 0, 0) de la scène.
//    Ce n'est pas elle qui avance : c'est le monde qu'on place autour d'elle.
//    Les vraies positions sont calculées en double précision (les nombres
//    JavaScript), puis on n'envoie à la carte graphique que la différence
//    « objet − caméra », petite, donc précise même en simple précision.
//
// 2. PROFONDEUR LOGARITHMIQUE. Le tampon de profondeur répartit sa précision
//    de façon logarithmique : on peut afficher dans la même image un objet à
//    1 m et un autre à des milliards de kilomètres sans scintillement.
//
// L'image est dessinée en trois passes, de la plus lointaine à la plus proche :
//   a. le FOND : la galaxie et ses étoiles (unité : l'année-lumière) ;
//   b. le SYSTÈME solaire où l'on se trouve (unité : le mètre) ;
//   c. les EFFETS plein écran (hyperespace).
// Les deux premières ont chacune leur caméra, orientées de la même façon.

import * as THREE from 'three';
import type { Prereglage } from '../config/graphismes';

/** Position en double précision (nombres JavaScript ordinaires). */
export interface PositionDouble {
  x: number;
  y: number;
  z: number;
}

export class Moteur {
  readonly renderer: THREE.WebGLRenderer;
  /** Fond : galaxie et étoiles lointaines (années-lumière). */
  readonly sceneFond = new THREE.Scene();
  readonly cameraFond: THREE.PerspectiveCamera;
  /** Système solaire courant (mètres). */
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  /** Effets plein écran. */
  readonly sceneEffets = new THREE.Scene();
  private readonly cameraEffets = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  /** Finesse réelle de l'image (pixels calculés par pixel CSS). */
  rapportPixels = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly prereglage: Prereglage,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: prereglage.nom !== 'bas',
      alpha: false,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 1);
    // On efface et on compte nous-mêmes, car une image = plusieurs passes.
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;

    // Champ de vision de 60°. Les plans proche et lointain sont très écartés :
    // c'est la profondeur logarithmique qui rend cela possible.
    this.cameraFond = new THREE.PerspectiveCamera(60, 1, 1e-4, 1e7);
    this.camera = new THREE.PerspectiveCamera(60, 1, 1, 1e15);

    this.redimensionner();
    window.addEventListener('resize', () => this.redimensionner());
  }

  /** Adapte l'image à la taille de la fenêtre. */
  redimensionner(): void {
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    this.rapportPixels = Math.min(window.devicePixelRatio || 1, this.prereglage.rapportPixelsMax);
    this.renderer.setPixelRatio(this.rapportPixels);
    this.renderer.setSize(largeur, hauteur, false);
    this.canvas.style.width = `${largeur}px`;
    this.canvas.style.height = `${hauteur}px`;
    for (const camera of [this.cameraFond, this.camera]) {
      camera.aspect = largeur / hauteur;
      camera.updateProjectionMatrix();
    }
  }

  /** Largeur de l'écran divisée par sa hauteur. */
  get rapportEcran(): number {
    return this.camera.aspect;
  }

  /**
   * Nombre de pixels occupés à l'écran par un objet de taille 1 situé à la distance 1.
   * (Sert à calculer la taille apparente des objets.)
   */
  get facteurProjection(): number {
    const hauteurPixels = window.innerHeight * this.rapportPixels;
    const demiAngle = (this.camera.fov * Math.PI) / 360;
    return hauteurPixels / (2 * Math.tan(demiAngle));
  }

  /** Oriente les deux caméras de la même façon. */
  orienter(orientation: THREE.Quaternion): void {
    this.cameraFond.quaternion.copy(orientation);
    this.camera.quaternion.copy(orientation);
    this.cameraFond.updateMatrixWorld();
    this.camera.updateMatrixWorld();
  }

  /** Dessine une image complète. */
  rendre(): void {
    const r = this.renderer;
    r.info.reset();
    r.clear();
    r.render(this.sceneFond, this.cameraFond);
    r.clearDepth();
    r.render(this.scene, this.camera);
    if (this.sceneEffets.children.length > 0) {
      r.clearDepth();
      r.render(this.sceneEffets, this.cameraEffets);
    }
  }
}
