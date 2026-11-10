// Panneau « Système » : la liste des étoiles, planètes et lunes du système
// où l'on se trouve. Un clic sur une ligne y emmène la caméra.

import type { VueSysteme } from '../rendu/systeme/vueSysteme';

export class PanneauSysteme {
  private readonly element: HTMLDivElement;
  private lignes: HTMLButtonElement[] = [];

  constructor(parent: HTMLElement, visible: boolean) {
    this.element = document.createElement('div');
    this.element.className = 'panneau systeme';
    if (!visible) this.element.classList.add('cache');
    parent.appendChild(this.element);
  }

  basculer(): void {
    this.element.classList.toggle('cache');
  }

  masquer(masque: boolean): void {
    this.element.classList.toggle('efface', masque);
  }

  /** Remplit la liste pour un nouveau système. `choisir` reçoit le rang du corps cliqué. */
  definir(vue: VueSysteme, choisir: (rang: number) => void): void {
    this.element.innerHTML = '';
    const titre = document.createElement('h2');
    titre.textContent = `Système ${vue.systeme.nom}`;
    this.element.appendChild(titre);
    this.lignes = [];
    let numero = 0;
    vue.corps.forEach((c, rang) => {
      const ligne = document.createElement('button');
      ligne.type = 'button';
      ligne.className = `ligne ${c.genre}`;
      const prefixe = c.genre === 'planete' && ++numero <= 9 ? `${numero}` : '';
      const extras = c.corps?.anneaux ? ' · anneaux' : '';
      ligne.innerHTML = '<kbd></kbd><b></b><span></span>';
      (ligne.children[0] as HTMLElement).textContent = prefixe;
      (ligne.children[1] as HTMLElement).textContent = c.nom;
      (ligne.children[2] as HTMLElement).textContent = c.description + extras;
      ligne.addEventListener('click', (e) => {
        e.stopPropagation();
        choisir(rang);
      });
      this.element.appendChild(ligne);
      this.lignes.push(ligne);
    });
    if (vue.systeme.ceintures.length > 0) {
      const note = document.createElement('div');
      note.className = 'note';
      const n = vue.systeme.ceintures.length;
      note.textContent = n === 1 ? "1 ceinture d'astéroïdes" : `${n} ceintures d'astéroïdes`;
      this.element.appendChild(note);
    }
  }

  /** Met en évidence la ligne du corps le plus proche. */
  surligner(rang: number): void {
    this.lignes.forEach((ligne, i) => ligne.classList.toggle('proche', i === rang));
  }
}
