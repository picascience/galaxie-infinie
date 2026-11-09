// Les familles d'étoiles de la galaxie : leur fréquence, leur éclat,
// leur température (donc leur couleur).

/** Description d'une famille d'étoiles. */
export interface ClasseEtoile {
  /** Nom affiché au joueur. */
  nom: string;
  /** Niveau de secteur (0 = visible de près seulement … 3 = visible de très loin). */
  niveau: number;
  /** Part de cette famille parmi toutes les étoiles (la somme vaut 1). */
  part: number;
  /** Éclat minimal et maximal, en multiples de l'éclat du Soleil. */
  luminosite: readonly [number, number];
  /** Température de surface minimale et maximale (kelvins). */
  temperature: readonly [number, number];
  /** Rayon minimal et maximal, en multiples du rayon du Soleil. */
  rayon: readonly [number, number];
}

export const CLASSES_ETOILES: readonly ClasseEtoile[] = [
  { nom: 'Naine rouge', niveau: 0, part: 0.74, luminosite: [0.002, 0.08], temperature: [2500, 3900], rayon: [0.1, 0.6] },
  { nom: 'Naine blanche', niveau: 0, part: 0.05, luminosite: [0.001, 0.02], temperature: [8000, 25000], rayon: [0.008, 0.02] },
  { nom: 'Naine orange', niveau: 1, part: 0.12, luminosite: [0.1, 0.6], temperature: [3900, 5200], rayon: [0.6, 0.9] },
  { nom: 'Naine jaune', niveau: 1, part: 0.06, luminosite: [0.6, 1.8], temperature: [5200, 6200], rayon: [0.9, 1.3] },
  { nom: 'Étoile blanche', niveau: 2, part: 0.025, luminosite: [2, 40], temperature: [6200, 10000], rayon: [1.3, 2.5] },
  { nom: 'Géante rouge', niveau: 3, part: 0.004, luminosite: [80, 1500], temperature: [3300, 4800], rayon: [10, 80] },
  { nom: 'Géante bleue', niveau: 3, part: 0.001, luminosite: [2000, 50000], temperature: [12000, 35000], rayon: [5, 15] },
];

/** Probabilité qu'une étoile soit en réalité un couple d'étoiles (système binaire). */
export const PART_BINAIRES = 0.3;

// Couleur d'une étoile selon sa température (du rouge-orangé au bleuté).
// Table simple, lue par interpolation : [température, rouge, vert, bleu].
const TABLE_COULEURS: readonly (readonly [number, number, number, number])[] = [
  [2500, 1.0, 0.5, 0.26],
  [3500, 1.0, 0.64, 0.4],
  [4500, 1.0, 0.78, 0.58],
  [5500, 1.0, 0.91, 0.8],
  [6500, 1.0, 0.98, 0.96],
  [8000, 0.84, 0.89, 1.0],
  [12000, 0.7, 0.79, 1.0],
  [35000, 0.58, 0.69, 1.0],
];

/** Écrit dans `sortie` (à partir de `position`) la couleur RVB d'une étoile de température donnée. */
export function ecrireCouleurEtoile(temperature: number, sortie: Float32Array, position: number): void {
  const table = TABLE_COULEURS;
  let i = 0;
  while (i < table.length - 2 && temperature > table[i + 1]![0]) i++;
  const a = table[i]!;
  const b = table[i + 1]!;
  let t = (temperature - a[0]) / (b[0] - a[0]);
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  sortie[position] = a[1] + (b[1] - a[1]) * t;
  sortie[position + 1] = a[2] + (b[2] - a[2]) * t;
  sortie[position + 2] = a[3] + (b[3] - a[3]) * t;
}

/** Pour chaque niveau : les familles présentes et leur part cumulée (pour tirer au sort). */
export interface FamillesDuNiveau {
  /** Part de toutes les étoiles qui appartiennent à ce niveau. */
  partTotale: number;
  /** Numéros des familles (indices dans CLASSES_ETOILES). */
  classes: number[];
  /** Parts cumulées, ramenées entre 0 et 1. */
  cumul: number[];
}

export const FAMILLES_PAR_NIVEAU: readonly FamillesDuNiveau[] = [0, 1, 2, 3].map((niveau) => {
  const classes: number[] = [];
  let partTotale = 0;
  CLASSES_ETOILES.forEach((classe, i) => {
    if (classe.niveau === niveau) {
      classes.push(i);
      partTotale += classe.part;
    }
  });
  let somme = 0;
  const cumul = classes.map((i) => {
    somme += CLASSES_ETOILES[i]!.part / partTotale;
    return somme;
  });
  return { partTotale, classes, cumul };
});
