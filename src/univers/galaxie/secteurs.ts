// Génération des étoiles, secteur par secteur.
//
// L'espace est découpé en cubes (« secteurs »). Les étoiles d'un secteur ne
// sont jamais stockées : on les recalcule à la demande à partir de la graine
// de la galaxie et des coordonnées du secteur. Le résultat est toujours le même.

import { MAX_CANDIDATES_PAR_SECTEUR, NIVEAUX_SECTEURS, PLAFOND_DENSITE } from '../../config/echelles';
import { Aleatoire } from '../../maths/aleatoire';
import { hacher2, hacher5 } from '../../maths/hachage';
import { densiteEtoiles, type ParametresGalaxie } from './densite';
import { CLASSES_ETOILES, FAMILLES_PAR_NIVEAU, PART_BINAIRES, ecrireCouleurEtoile } from './etoiles';

/** Les étoiles d'un secteur, rangées dans des tableaux compacts. */
export interface DonneesSecteur {
  niveau: number;
  /** Coordonnées entières du secteur. */
  sx: number;
  sy: number;
  sz: number;
  /** Nombre d'étoiles. */
  nombre: number;
  /** Positions dans le secteur (al), 3 nombres par étoile, entre 0 et la taille du secteur. */
  positions: Float32Array;
  /** Couleurs RVB, 3 nombres par étoile. */
  couleurs: Float32Array;
  /** Éclat de chaque étoile (multiples de l'éclat du Soleil). */
  luminosites: Float32Array;
  /** Température de surface de chaque étoile (kelvins). */
  temperatures: Float32Array;
  /** Famille de chaque étoile (indice dans CLASSES_ETOILES). */
  classes: Uint8Array;
  /** 1 si l'étoile est un système binaire, 0 sinon. */
  binaires: Uint8Array;
  /** Graine propre à chaque étoile : elle servira à générer son système solaire. */
  graines: Uint32Array;
}

/** Graine d'un secteur : dépend de la galaxie, du niveau et des coordonnées. */
export function graineSecteur(p: ParametresGalaxie, niveau: number, sx: number, sy: number, sz: number): number {
  return hacher5(p.graine, niveau, sx, sy, sz);
}

/** Calcule toutes les étoiles d'un secteur. */
export function genererSecteur(p: ParametresGalaxie, niveau: number, sx: number, sy: number, sz: number): DonneesSecteur {
  const taille = NIVEAUX_SECTEURS[niveau]!.taille;
  const familles = FAMILLES_PAR_NIVEAU[niveau]!;
  const x0 = sx * taille;
  const y0 = sy * taille;
  const z0 = sz * taille;

  // 1. Densité maximale probable dans le secteur : on regarde le centre et les 8 coins.
  let densiteMax = densiteEtoiles(p, x0 + taille / 2, y0 + taille / 2, z0 + taille / 2);
  for (let coin = 0; coin < 8; coin++) {
    const d = densiteEtoiles(
      p,
      x0 + (coin & 1 ? taille : 0),
      y0 + (coin & 2 ? taille : 0),
      z0 + (coin & 4 ? taille : 0),
    );
    if (d > densiteMax) densiteMax = d;
  }

  const graine = graineSecteur(p, niveau, sx, sy, sz);
  if (densiteMax < 1e-9) return secteurVide(niveau, sx, sy, sz);

  // 2. Nombre d'étoiles « candidates » : densité × volume × part des familles de ce niveau.
  //    La borne est un peu majorée, puis chaque candidate est gardée ou non (étape 3).
  let borne = densiteMax * 1.5;
  if (borne > PLAFOND_DENSITE) borne = PLAFOND_DENSITE;
  const alea = new Aleatoire(graine);
  const moyenne = borne * taille * taille * taille * familles.partTotale;
  let candidates = Math.floor(moyenne);
  if (alea.suivant() < moyenne - candidates) candidates++;
  if (candidates > MAX_CANDIDATES_PAR_SECTEUR) candidates = MAX_CANDIDATES_PAR_SECTEUR;
  if (candidates === 0) return secteurVide(niveau, sx, sy, sz);

  const positions = new Float32Array(candidates * 3);
  const couleurs = new Float32Array(candidates * 3);
  const luminosites = new Float32Array(candidates);
  const temperatures = new Float32Array(candidates);
  const classes = new Uint8Array(candidates);
  const binaires = new Uint8Array(candidates);
  const graines = new Uint32Array(candidates);

  // 3. Tirage des étoiles. Chaque candidate consomme toujours 8 nombres
  //    aléatoires, qu'elle soit gardée ou non : la suite reste stable.
  let n = 0;
  for (let i = 0; i < candidates; i++) {
    const lx = alea.suivant() * taille;
    const ly = alea.suivant() * taille;
    const lz = alea.suivant() * taille;
    const tirageGarde = alea.suivant();
    const tirageFamille = alea.suivant();
    const tirageEclat = alea.suivant();
    const tirageTemperature = alea.suivant();
    const tirageBinaire = alea.suivant();

    // On garde la candidate avec une probabilité égale à (densité ici) / (borne).
    if (densiteEtoiles(p, x0 + lx, y0 + ly, z0 + lz) < tirageGarde * borne) continue;

    let f = 0;
    while (f < familles.cumul.length - 1 && tirageFamille > familles.cumul[f]!) f++;
    const indiceClasse = familles.classes[f]!;
    const classe = CLASSES_ETOILES[indiceClasse]!;

    positions[n * 3] = lx;
    positions[n * 3 + 1] = ly;
    positions[n * 3 + 2] = lz;
    // Les étoiles peu lumineuses sont plus fréquentes : on élève le tirage au carré.
    const [lMin, lMax] = classe.luminosite;
    luminosites[n] = lMin + (lMax - lMin) * tirageEclat * tirageEclat;
    const [tMin, tMax] = classe.temperature;
    temperatures[n] = tMin + (tMax - tMin) * tirageTemperature;
    ecrireCouleurEtoile(temperatures[n]!, couleurs, n * 3);
    classes[n] = indiceClasse;
    binaires[n] = tirageBinaire < PART_BINAIRES ? 1 : 0;
    graines[n] = hacher2(graine, i);
    n++;
  }

  return {
    niveau,
    sx,
    sy,
    sz,
    nombre: n,
    positions: positions.subarray(0, n * 3),
    couleurs: couleurs.subarray(0, n * 3),
    luminosites: luminosites.subarray(0, n),
    temperatures: temperatures.subarray(0, n),
    classes: classes.subarray(0, n),
    binaires: binaires.subarray(0, n),
    graines: graines.subarray(0, n),
  };
}

function secteurVide(niveau: number, sx: number, sy: number, sz: number): DonneesSecteur {
  return {
    niveau,
    sx,
    sy,
    sz,
    nombre: 0,
    positions: new Float32Array(0),
    couleurs: new Float32Array(0),
    luminosites: new Float32Array(0),
    temperatures: new Float32Array(0),
    classes: new Uint8Array(0),
    binaires: new Uint8Array(0),
    graines: new Uint32Array(0),
  };
}

/**
 * Mémoire des secteurs déjà calculés, pour ne pas les recalculer à chaque image.
 * Quand elle est pleine, les secteurs les plus anciens sont oubliés
 * (ils seront recalculés à l'identique si on y revient).
 */
export class CacheSecteurs {
  private readonly secteurs = new Map<string, DonneesSecteur>();

  constructor(
    private readonly parametres: ParametresGalaxie,
    private readonly capacite = 6000,
  ) {}

  obtenir(niveau: number, sx: number, sy: number, sz: number): DonneesSecteur {
    const cle = `${niveau}:${sx}:${sy}:${sz}`;
    let secteur = this.secteurs.get(cle);
    if (secteur) {
      // On le remet en fin de liste : il vient de servir.
      this.secteurs.delete(cle);
    } else {
      secteur = genererSecteur(this.parametres, niveau, sx, sy, sz);
      if (this.secteurs.size >= this.capacite) {
        const plusAncien = this.secteurs.keys().next().value;
        if (plusAncien !== undefined) this.secteurs.delete(plusAncien);
      }
    }
    this.secteurs.set(cle, secteur);
    return secteur;
  }

  get taille(): number {
    return this.secteurs.size;
  }
}

/** Adresse d'une étoile dans la galaxie : son secteur et son rang dans ce secteur. */
export interface AdresseEtoile {
  niveau: number;
  sx: number;
  sy: number;
  sz: number;
  indice: number;
}

/** Tout ce qu'on sait d'une étoile vue depuis la galaxie. */
export interface EtoileGalaxie extends AdresseEtoile {
  /** Graine de l'étoile : c'est elle qui engendre tout son système solaire. */
  graine: number;
  /** Position dans la galaxie (al), en double précision. */
  x: number;
  y: number;
  z: number;
  classe: number;
  luminosite: number;
  temperature: number;
  binaire: boolean;
}

/** Écrit une adresse sous forme de texte court, par exemple « 1:650:1:0:12 ». */
export function texteAdresse(a: AdresseEtoile): string {
  return `${a.niveau}:${a.sx}:${a.sy}:${a.sz}:${a.indice}`;
}

/** Relit une adresse écrite par texteAdresse (null si le texte est invalide). */
export function lireAdresse(texte: string | null): AdresseEtoile | null {
  if (!texte) return null;
  const n = texte.split(':').map(Number);
  if (n.length !== 5 || !n.every(Number.isInteger)) return null;
  if (n[0]! < 0 || n[0]! >= NIVEAUX_SECTEURS.length || n[4]! < 0) return null;
  return { niveau: n[0]!, sx: n[1]!, sy: n[2]!, sz: n[3]!, indice: n[4]! };
}

/** Retrouve une étoile dans un secteur déjà calculé (null si le rang n'existe pas). */
export function etoileDuSecteur(s: DonneesSecteur, indice: number): EtoileGalaxie | null {
  if (indice < 0 || indice >= s.nombre) return null;
  const taille = NIVEAUX_SECTEURS[s.niveau]!.taille;
  return {
    niveau: s.niveau,
    sx: s.sx,
    sy: s.sy,
    sz: s.sz,
    indice,
    graine: s.graines[indice]!,
    x: s.sx * taille + s.positions[indice * 3]!,
    y: s.sy * taille + s.positions[indice * 3 + 1]!,
    z: s.sz * taille + s.positions[indice * 3 + 2]!,
    classe: s.classes[indice]!,
    luminosite: s.luminosites[indice]!,
    temperature: s.temperatures[indice]!,
    binaire: s.binaires[indice] === 1,
  };
}
