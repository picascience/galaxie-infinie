// Le moteur de rendu : il possède le « renderer » Three.js, la scène et la caméra.
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
//    10 cm et un autre à des milliards de kilomètres sans scintillement.

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
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  /** Finesse réelle de l'image (pixels calculés par pixel CSS). */
  rapportPixels = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly prereglage: Prereglage,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 1);

    // Champ de vision de 60°. Les plans proche et lointain sont très écartés :
    // c'est la profondeur logarithmique qui rend cela possible.
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1e7);
    this.camera.position.set(0, 0, 0);

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
    this.camera.aspect = largeur / hauteur;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Nombre de pixels occupés à l'écran par un objet de taille 1 situé à la distance 1.
   * (Sert aux shaders qui dessinent des points de taille « réelle ».)
   */
  get facteurProjection(): number {
    const hauteurPixels = window.innerHeight * this.rapportPixels;
    const demiAngle = (this.camera.fov * Math.PI) / 360;
    return hauteurPixels / (2 * Math.tan(demiAngle));
  }

  /** Dessine une image. */
  rendre(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
