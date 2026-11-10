// Registre des types de planètes : la liste de tous les types connus du jeu.
// Pour ajouter un type : créer son fichier dans ce dossier, puis l'ajouter ici
// (et dans la liste IdType de definition.ts).

import { cristalline } from './cristalline';
import type { DefinitionType, IdType } from './definition';
import { desertique } from './desertique';
import { gazeuse } from './gazeuse';
import { glacee } from './glacee';
import { oceanique } from './oceanique';
import { rocheuse } from './rocheuse';
import { toxique } from './toxique';
import { volcanique } from './volcanique';

export const TYPES_PLANETES: Readonly<Record<IdType, DefinitionType>> = {
  rocheuse,
  oceanique,
  glacee,
  desertique,
  volcanique,
  gazeuse,
  cristalline,
  toxique,
};

/** Tous les identifiants, dans un ordre fixe (important pour le déterminisme). */
export const IDS_TYPES: readonly IdType[] = [
  'rocheuse',
  'oceanique',
  'glacee',
  'desertique',
  'volcanique',
  'gazeuse',
  'cristalline',
  'toxique',
];
