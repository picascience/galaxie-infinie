// Panneau de mesures (touche F3) : il montre la fluidité et la charge de
// travail de la carte graphique. Il sert à vérifier les budgets de performance.

export interface Mesures {
  imagesParSeconde: number;
  msParImage: number;
  msPireImage: number;
  appelsDeDessin: number;
  points: number;
  triangles: number;
  secteursEnMemoire: number;
  qualite: string;
  rapportPixels: number;
}

export class PanneauMesures {
  private readonly element: HTMLDivElement;

  constructor(parent: HTMLElement, visible: boolean) {
    this.element = document.createElement('div');
    this.element.className = 'panneau mesures';
    if (!visible) this.element.classList.add('cache');
    parent.appendChild(this.element);
  }

  get visible(): boolean {
    return !this.element.classList.contains('cache');
  }

  basculer(): void {
    this.element.classList.toggle('cache');
  }

  mettreAJour(m: Mesures): void {
    if (!this.visible) return;
    const n = (v: number) => Math.round(v).toLocaleString('fr-FR');
    this.element.textContent = [
      `images/s      ${m.imagesParSeconde.toFixed(0)}`,
      `ms par image  ${m.msParImage.toFixed(1)}  (pire ${m.msPireImage.toFixed(0)})`,
      `appels dessin ${n(m.appelsDeDessin)}`,
      `points        ${n(m.points)}`,
      `triangles     ${n(m.triangles)}`,
      `secteurs      ${n(m.secteursEnMemoire)}`,
      `qualité       ${m.qualite} (×${m.rapportPixels.toFixed(2)})`,
    ].join('\n');
  }
}
