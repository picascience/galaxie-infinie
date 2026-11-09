// Préréglages graphiques : bas, moyen, haut.
// Le menu de réglages arrivera plus tard ; pour l'instant le jeu choisit seul,
// et l'on peut forcer un réglage avec « ?qualite=bas » dans l'adresse.

export type NomQualite = 'bas' | 'moyen' | 'haut';

export interface Prereglage {
  nom: NomQualite;
  /** Finesse maximale de l'image (1 = un point calculé par pixel CSS). */
  rapportPixelsMax: number;
  /** Autour du joueur, on charge (2 × rayon + 1)³ secteurs par niveau d'étoiles. */
  rayonSecteurs: number;
  /** Nombre de points lumineux du nuage galactique. */
  particulesGalaxie: number;
}

export const PREREGLAGES: Record<NomQualite, Prereglage> = {
  bas: { nom: 'bas', rapportPixelsMax: 1.5, rayonSecteurs: 2, particulesGalaxie: 110_000 },
  moyen: { nom: 'moyen', rapportPixelsMax: 1.5, rayonSecteurs: 3, particulesGalaxie: 160_000 },
  haut: { nom: 'haut', rapportPixelsMax: 2, rayonSecteurs: 3, particulesGalaxie: 300_000 },
};

/** Vrai sur téléphone ou tablette (écran tactile sans souris précise). */
export function estAppareilTactile(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Choix automatique au premier lancement : « bas » sur mobile, « haut » sur ordinateur. */
export function choisirQualite(demande: string | null): Prereglage {
  if (demande === 'bas' || demande === 'moyen' || demande === 'haut') return PREREGLAGES[demande];
  return estAppareilTactile() ? PREREGLAGES.bas : PREREGLAGES.haut;
}
