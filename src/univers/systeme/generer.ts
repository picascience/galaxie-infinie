// Génération d'un système solaire à partir de la graine de son étoile.
// Même étoile = même système, toujours : tout vient de tirages à graine.

import {
  DUREE_JOUR,
  MAX_LUNES,
  MAX_PLANETES,
  PERIODE_A_1_UA,
  RAYON_GRAVITE_TERRESTRE,
  RAYON_SOLAIRE,
  UA,
} from '../../config/systeme';
import { Aleatoire } from '../../maths/aleatoire';
import { DEUX_PI } from '../../maths/fonctions';
import { hacher2 } from '../../maths/hachage';
import { CLASSES_ETOILES, ecrireCouleurEtoile } from '../galaxie/etoiles';
import { nomEtoile } from '../galaxie/noms';
import type { Couleur, IdType } from '../planetes/types/definition';
import { IDS_TYPES, TYPES_PLANETES } from '../planetes/types/registre';
import type { Anneaux, Ceinture, Corps, EtoileSysteme, Orbite, Systeme } from './modele';

/** Ce que la galaxie sait de l'étoile principale. */
export interface EtoileSource {
  graine: number;
  classe: number;
  luminosite: number;
  temperature: number;
  binaire: boolean;
}

// Chances de chaque type de planète selon la température, dans l'ordre de
// IDS_TYPES : rocheuse, océanique, glacée, désertique, volcanique, gazeuse, cristalline, toxique.
const POIDS_PLANETES: readonly (readonly [number, readonly number[]])[] = [
  [700, [3, 0, 0, 2, 6, 0.3, 0.5, 0.5]], // brûlant
  [400, [3, 0, 0, 5, 3, 0.5, 1, 2]], // chaud
  [250, [2, 5, 0, 3, 0.5, 0.5, 1.5, 2.5]], // tempéré : l'eau liquide est possible
  [130, [3, 0.3, 4, 1, 0.3, 4, 2, 0.5]], // froid
  [0, [1.5, 0, 5, 0, 0, 5, 1.5, 0]], // glacial
];

const CHIFFRES_ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const LETTRES_LUNES = ['a', 'b', 'c', 'd'];

/** Racine quatrième, sans Math.pow (voir src/maths/fonctions.ts). */
function racine4(x: number): number {
  return Math.sqrt(Math.sqrt(x));
}

/** Tire un type au sort selon des poids. */
function tirerType(alea: Aleatoire, poids: readonly number[], pourLune: boolean): IdType {
  let total = 0;
  for (let i = 0; i < IDS_TYPES.length; i++) {
    if (pourLune && !TYPES_PLANETES[IDS_TYPES[i]!].lunePossible) continue;
    total += poids[i]!;
  }
  let tirage = alea.suivant() * total;
  let dernier: IdType = 'rocheuse';
  for (let i = 0; i < IDS_TYPES.length; i++) {
    const id = IDS_TYPES[i]!;
    if (pourLune && !TYPES_PLANETES[id].lunePossible) continue;
    if (poids[i]! <= 0) continue;
    dernier = id;
    tirage -= poids[i]!;
    if (tirage < 0) return id;
  }
  return dernier;
}

function poidsPourTemperature(temperature: number): readonly number[] {
  for (const [seuil, poids] of POIDS_PLANETES) {
    if (temperature >= seuil) return poids;
  }
  return POIDS_PLANETES[POIDS_PLANETES.length - 1]![1];
}

/** Fait varier légèrement une couleur (chaque planète a sa nuance). */
function varier(c: Couleur, v: Couleur): Couleur {
  const borne = (x: number) => (x > 1 ? 1 : x);
  return [borne(c[0] * v[0]), borne(c[1] * v[1]), borne(c[2] * v[2])];
}

/** Fabrique une planète ou une lune. */
function creerCorps(
  graine: number,
  nom: string,
  type: IdType,
  estLune: boolean,
  rayon: number,
  orbite: Orbite,
  temperatureEquilibre: number,
): Corps {
  const def = TYPES_PLANETES[type];
  const alea = new Aleatoire(hacher2(graine, 11));
  // Les géantes gazeuses ont des couleurs bien plus variées que les autres.
  const ampleur = type === 'gazeuse' ? 0.4 : 0.13;
  const variation: Couleur = [
    1 + alea.intervalle(-ampleur, ampleur),
    1 + alea.intervalle(-ampleur, ampleur),
    1 + alea.intervalle(-ampleur, ampleur),
  ];
  const densite = alea.intervalle(def.densite[0], def.densite[1]);
  const dureeJour =
    type === 'gazeuse' ? alea.intervalle(600, 1500) : alea.intervalle(DUREE_JOUR[0], DUREE_JOUR[1]);
  return {
    graine,
    nom,
    type,
    estLune,
    rayon,
    orbite,
    dureeJour,
    inclinaisonAxe: alea.intervalle(0, 0.6),
    gravite: 9.81 * (rayon / RAYON_GRAVITE_TERRESTRE) * densite,
    temperature: temperatureEquilibre + def.effetDeSerre,
    couleurBasse: varier(def.couleurBasse, variation),
    couleurMoyenne: varier(def.couleurMoyenne, variation),
    couleurHaute: varier(def.couleurHaute, variation),
    anneaux: null,
    lunes: [],
  };
}

/** Calcule le système solaire complet d'une étoile. */
export function genererSysteme(source: EtoileSource): Systeme {
  const alea = new Aleatoire(hacher2(source.graine, 1));
  const nom = nomEtoile(source.graine);
  const nomCourt = nom.split(' ')[0]!;

  // ---------- Étoiles ----------
  const classe = CLASSES_ETOILES[source.classe]!;
  const couleur = new Float32Array(3);
  ecrireCouleurEtoile(source.temperature, couleur, 0);
  const principale: EtoileSysteme = {
    nom: source.binaire ? `${nom} A` : nom,
    classe: source.classe,
    rayon: RAYON_SOLAIRE * alea.intervalle(classe.rayon[0], classe.rayon[1]),
    luminosite: source.luminosite,
    temperature: source.temperature,
    couleur: [couleur[0]!, couleur[1]!, couleur[2]!],
    orbite: { rayon: 0, periode: 1, phase: 0, inclinaison: 0, noeud: 0 },
  };
  const etoiles: EtoileSysteme[] = [principale];
  let ecartBinaire = 0;

  if (source.binaire) {
    // La compagne est une petite étoile : naine rouge (0), naine blanche (1) ou naine orange (2).
    const tirage = alea.suivant();
    const indice = tirage < 0.6 ? 0 : tirage < 0.75 ? 1 : 2;
    const c2 = CLASSES_ETOILES[indice]!;
    const t2 = alea.intervalle(c2.temperature[0], c2.temperature[1]);
    ecrireCouleurEtoile(t2, couleur, 0);
    const compagne: EtoileSysteme = {
      nom: `${nom} B`,
      classe: indice,
      rayon: RAYON_SOLAIRE * alea.intervalle(c2.rayon[0], c2.rayon[1]),
      luminosite: alea.intervalle(c2.luminosite[0], c2.luminosite[1]),
      temperature: t2,
      couleur: [couleur[0]!, couleur[1]!, couleur[2]!],
      orbite: { rayon: 0, periode: 1, phase: 0, inclinaison: 0, noeud: 0 },
    };
    // Les deux étoiles tournent autour de leur centre commun, à l'opposé l'une de l'autre.
    ecartBinaire = (principale.rayon + compagne.rayon) * alea.intervalle(5, 10);
    const m1 = racine4(principale.luminosite);
    const m2 = racine4(compagne.luminosite);
    const part = m2 / (m1 + m2);
    const periode = alea.intervalle(500, 1500);
    const phase = alea.intervalle(0, DEUX_PI);
    principale.orbite = { rayon: ecartBinaire * part, periode, phase, inclinaison: 0, noeud: 0 };
    compagne.orbite = { rayon: ecartBinaire * (1 - part), periode, phase: phase + DEUX_PI / 2, inclinaison: 0, noeud: 0 };
    etoiles.push(compagne);
  }

  let luminositeTotale = 0;
  for (const e of etoiles) luminositeTotale += e.luminosite;
  const racineL = Math.sqrt(luminositeTotale);
  // « Masse » approximative du système, pour la vitesse des orbites.
  const masse = Math.min(20, Math.max(0.15, racine4(luminositeTotale)));

  // ---------- Planètes et ceintures ----------
  const emplacements = 1 + Math.round(((alea.suivant() + alea.suivant()) / 2) * (MAX_PLANETES - 1));
  const planetes: Corps[] = [];
  const ceintures: Ceinture[] = [];

  // Première orbite : proche de l'étoile, mais jamais dedans.
  let distance = alea.intervalle(0.18, 0.45) * racineL * UA;
  const distanceMin = Math.max(6 * principale.rayon, 4 * ecartBinaire);
  if (distance < distanceMin) distance = distanceMin;

  for (let i = 0; i < emplacements; i++) {
    // Chaque emplacement a son propre tirage : ajouter un détail à une planète
    // ne change jamais les suivantes.
    const a = new Aleatoire(hacher2(source.graine, 100 + i));
    const ua = distance / UA;
    // (Jamais moins d'une demi-heure par tour : sinon le soleil filerait dans le ciel des planètes proches.)
    const periode = Math.max(1800, (PERIODE_A_1_UA * ua * Math.sqrt(ua)) / Math.sqrt(masse));
    const temperature = (278 * racine4(luminositeTotale)) / Math.sqrt(ua);
    const ecartSuivant = a.intervalle(1.45, 1.95);
    const estCeinture = i > 0 && ceintures.length < 2 && a.suivant() < 0.14;

    if (estCeinture) {
      ceintures.push({
        rayonInterieur: distance * 0.92,
        rayonExterieur: distance * 1.1,
        periode,
        graine: hacher2(source.graine, 500 + i),
      });
    } else {
      const type = tirerType(a, poidsPourTemperature(temperature), false);
      const def = TYPES_PLANETES[type];
      const rayon = a.intervalle(def.rayonKm[0], def.rayonKm[1]) * 1000;
      const orbite: Orbite = {
        rayon: distance,
        periode,
        phase: a.intervalle(0, DEUX_PI),
        inclinaison: a.intervalle(-0.05, 0.05),
        noeud: a.intervalle(0, DEUX_PI),
      };
      const graine = hacher2(source.graine, 200 + i);
      const planete = creerCorps(graine, `${nomCourt} ${CHIFFRES_ROMAINS[planetes.length]!}`, type, false, rayon, orbite, temperature);

      // Anneaux : fréquents autour des géantes gazeuses, rares ailleurs.
      const chanceAnneaux = type === 'gazeuse' ? 0.45 : type === 'glacee' ? 0.08 : 0.03;
      let limiteInterieure = rayon * 3.2;
      if (a.suivant() < chanceAnneaux) {
        const interieur = rayon * a.intervalle(1.35, 1.7);
        const exterieur = interieur + rayon * a.intervalle(0.5, 1.2);
        const nuance = a.intervalle(0.75, 1);
        const anneaux: Anneaux = {
          rayonInterieur: interieur,
          rayonExterieur: exterieur,
          couleur: [nuance, nuance * a.intervalle(0.85, 0.98), nuance * a.intervalle(0.65, 0.9)],
          graine: hacher2(graine, 3),
        };
        planete.anneaux = anneaux;
        limiteInterieure = exterieur * 1.3;
      }

      // Lunes : elles doivent tenir dans la zone où la planète « domine » l'étoile.
      const tirageLunes = a.suivant();
      const voulues = type === 'gazeuse' ? a.entier(1, MAX_LUNES) : tirageLunes < 0.5 ? 0 : tirageLunes < 0.85 ? 1 : 2;
      const limiteExterieure = distance * 0.03;
      let rayonOrbite = Math.max(limiteInterieure, rayon * a.intervalle(5, 8));
      for (let l = 0; l < voulues && rayonOrbite < limiteExterieure; l++) {
        const al = new Aleatoire(hacher2(graine, 50 + l));
        const typeLune = tirerType(al, poidsPourTemperature(temperature), true);
        const maxLune = Math.min(type === 'gazeuse' ? 400e3 : 280e3, rayon * 0.5);
        const rayonLune = al.intervalle(60e3, Math.max(70e3, maxLune));
        const tours = rayonOrbite / (rayon * 6);
        const orbiteLune: Orbite = {
          rayon: rayonOrbite,
          periode: 700 * tours * Math.sqrt(tours),
          phase: al.intervalle(0, DEUX_PI),
          inclinaison: al.intervalle(-0.12, 0.12),
          noeud: al.intervalle(0, DEUX_PI),
        };
        planete.lunes.push(
          creerCorps(hacher2(graine, 60 + l), `${planete.nom}-${LETTRES_LUNES[l]!}`, typeLune, true, rayonLune, orbiteLune, temperature),
        );
        rayonOrbite *= al.intervalle(1.5, 1.9);
      }
      planetes.push(planete);
    }
    distance *= ecartSuivant;
  }

  return { graine: source.graine, nom, etoiles, planetes, ceintures, luminositeTotale };
}
