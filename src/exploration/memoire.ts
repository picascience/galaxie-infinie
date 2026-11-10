// Mémoire du jeu, conservée dans le navigateur (localStorage).
// Toutes les clés commencent par « galaxie-infinie:v1: » : ainsi le jeu ne se
// mélange pas avec les autres sites publiés à la même adresse GitHub Pages.
// Si le navigateur refuse le stockage (navigation privée…), le jeu continue
// simplement sans mémoire.

const PREFIXE = 'galaxie-infinie:v1:';

function lire<T>(cle: string, defaut: T): T {
  try {
    const texte = window.localStorage.getItem(PREFIXE + cle);
    return texte === null ? defaut : (JSON.parse(texte) as T);
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    window.localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
  } catch {
    // Stockage plein ou interdit : tant pis, on continue sans enregistrer.
  }
}

/** Un système déjà visité. */
export interface Visite {
  /** Adresse de l'étoile (voir texteAdresse). */
  adresse: string;
  nom: string;
  /** Position dans la galaxie (al). */
  x: number;
  y: number;
  z: number;
}

/** Mémoire propre à une galaxie (donc à une graine). */
export class Memoire {
  private visites: Visite[];

  constructor(private readonly graine: string) {
    const lues = lire<unknown>(`visites:${graine}`, []);
    this.visites = Array.isArray(lues) ? (lues as Visite[]).filter((v) => typeof v?.adresse === 'string') : [];
  }

  /** Liste des systèmes visités, du plus ancien au plus récent. */
  get systemesVisites(): readonly Visite[] {
    return this.visites;
  }

  estVisite(adresse: string): boolean {
    return this.visites.some((v) => v.adresse === adresse);
  }

  /** Note un système comme visité et comme « dernier système ». */
  noterVisite(visite: Visite): void {
    this.visites = this.visites.filter((v) => v.adresse !== visite.adresse);
    this.visites.push(visite);
    // Garde-fou : on ne conserve que les 500 derniers.
    if (this.visites.length > 500) this.visites = this.visites.slice(-500);
    ecrire(`visites:${this.graine}`, this.visites);
    ecrire(`dernier:${this.graine}`, visite.adresse);
  }

  /** Adresse du dernier système visité (null si aucun). */
  get dernierSysteme(): string | null {
    const adresse = lire<unknown>(`dernier:${this.graine}`, null);
    return typeof adresse === 'string' ? adresse : null;
  }
}
