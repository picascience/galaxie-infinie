// Géante gazeuse : une immense boule de gaz aux bandes colorées. On ne s'y pose pas.
import type { DefinitionType } from './definition';

export const gazeuse: DefinitionType = {
  id: 'gazeuse',
  nom: 'Géante gazeuse',
  rayonKm: [3000, 7000],
  densite: [0.15, 0.4],
  atterrissage: false,
  lunePossible: false,
  aspect: 'bandes',
  couleurBasse: [0.55, 0.38, 0.24],
  couleurMoyenne: [0.82, 0.7, 0.52],
  couleurHaute: [0.94, 0.9, 0.8],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.9, 0.8, 0.65],
  atmosphere: 0.8,
  nuages: 0,
  glacePolaire: 0,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 0,
};
