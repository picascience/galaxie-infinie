// Ce qu'est un « type de planète » pour le jeu.
// Chaque type est décrit dans son propre fichier de ce dossier, puis inscrit
// dans registre.ts. Pour ajouter un type : copier un fichier, changer ses
// valeurs, l'ajouter au registre.
// (Les jours suivants ajouteront ici le relief, l'atmosphère et les objets de surface.)

/** Couleur : rouge, vert, bleu, chacun entre 0 et 1. */
export type Couleur = readonly [number, number, number];

/** Identifiants des types de planètes. */
export type IdType =
  | 'rocheuse'
  | 'oceanique'
  | 'glacee'
  | 'desertique'
  | 'volcanique'
  | 'gazeuse'
  | 'cristalline'
  | 'toxique';

export interface DefinitionType {
  id: IdType;
  /** Nom affiché au joueur. */
  nom: string;
  /** Rayon minimal et maximal (km). */
  rayonKm: readonly [number, number];
  /** Densité par rapport à la Terre (sert à calculer la gravité). */
  densite: readonly [number, number];
  /** Faux pour les géantes gazeuses : on ne peut pas s'y poser. */
  atterrissage: boolean;
  /** Vrai si une lune peut être de ce type. */
  lunePossible: boolean;
  /** Aspect vu de loin : relief et continents, ou bandes de nuages. */
  aspect: 'relief' | 'bandes';
  /** Couleurs du sol : terrains bas, moyens, hauts. */
  couleurBasse: Couleur;
  couleurMoyenne: Couleur;
  couleurHaute: Couleur;
  /** Part de la surface couverte par un océan (0 = aucun). */
  ocean: number;
  couleurOcean: Couleur;
  /** Couleur du halo d'atmosphère, et son épaisseur apparente (0 = pas d'atmosphère). */
  couleurAtmosphere: Couleur;
  atmosphere: number;
  /** Part du ciel couverte de nuages (0 = aucun). */
  nuages: number;
  /** Étendue des calottes de glace aux pôles (0 = aucune). */
  glacePolaire: number;
  /** Lueur propre du sol dans les creux (lave, cristaux), visible la nuit. */
  lueur: number;
  couleurLueur: Couleur;
  /** Chaleur ajoutée par l'effet de serre (kelvins). */
  effetDeSerre: number;
}
