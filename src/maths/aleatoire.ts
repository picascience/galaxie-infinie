// Générateur pseudo-aléatoire à graine.
// Contrairement à Math.random (interdit dans le projet), il redonne
// exactement la même suite de nombres quand on repart de la même graine.

export class Aleatoire {
  private etat: number;

  constructor(graine: number) {
    this.etat = graine >>> 0;
  }

  /** Nombre réel dans [0, 1[. (Algorithme « mulberry32 ».) */
  suivant(): number {
    this.etat = (this.etat + 0x6d2b79f5) >>> 0;
    let t = this.etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Nombre réel dans [min, max[. */
  intervalle(min: number, max: number): number {
    return min + (max - min) * this.suivant();
  }

  /** Entier dans [min, max] (bornes comprises). */
  entier(min: number, max: number): number {
    return min + Math.floor(this.suivant() * (max - min + 1));
  }

  /** Un élément d'une liste, choisi au hasard. */
  choisir<T>(liste: readonly T[]): T {
    return liste[Math.floor(this.suivant() * liste.length)]!;
  }
}
