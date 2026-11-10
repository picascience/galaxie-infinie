// Repères à l'écran : de petites étiquettes HTML posées sur les corps
// célestes (nom et distance) ou sur les étoiles de la carte.
// Les étiquettes sont créées une fois puis réutilisées d'une image à l'autre.

export class Reperes {
  private readonly racine: HTMLDivElement;
  private readonly etiquettes: HTMLDivElement[] = [];
  private utilisees = 0;

  constructor(parent: HTMLElement) {
    this.racine = document.createElement('div');
    this.racine.className = 'reperes';
    parent.appendChild(this.racine);
  }

  /** À appeler au début de chaque image, avant les appels à `poser`. */
  debut(): void {
    this.utilisees = 0;
  }

  /**
   * Pose une étiquette.
   * @param x, y   position à l'écran (pixels CSS)
   * @param nom    première ligne
   * @param detail seconde ligne (peut être vide)
   * @param genre  apparence : 'corps', 'lune', 'cible', 'ici' ou 'visite'
   */
  poser(x: number, y: number, nom: string, detail: string, genre: string): void {
    let e = this.etiquettes[this.utilisees];
    if (!e) {
      e = document.createElement('div');
      e.innerHTML = '<i></i><b></b><span></span>';
      this.racine.appendChild(e);
      this.etiquettes.push(e);
    }
    this.utilisees++;
    const classe = `repere ${genre}`;
    if (e.className !== classe) e.className = classe;
    e.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    const b = e.children[1] as HTMLElement;
    const s = e.children[2] as HTMLElement;
    if (b.textContent !== nom) b.textContent = nom;
    if (s.textContent !== detail) s.textContent = detail;
  }

  /** À appeler à la fin de chaque image : masque les étiquettes non utilisées. */
  fin(): void {
    for (let i = this.utilisees; i < this.etiquettes.length; i++) {
      const e = this.etiquettes[i]!;
      if (e.className !== 'repere cache') e.className = 'repere cache';
    }
  }
}
