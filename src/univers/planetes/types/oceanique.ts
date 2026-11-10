// Planète océanique : de l'eau liquide presque partout, quelques terres, des nuages.
import type { DefinitionType } from './definition';

export const oceanique: DefinitionType = {
  id: 'oceanique',
  nom: 'Océanique',
  rayonKm: [500, 1100],
  densite: [0.9, 1.1],
  atterrissage: true,
  lunePossible: false,
  aspect: 'relief',
  couleurBasse: [0.2, 0.38, 0.16],
  couleurMoyenne: [0.42, 0.42, 0.24],
  couleurHaute: [0.62, 0.58, 0.52],
  ocean: 0.68,
  couleurOcean: [0.03, 0.16, 0.38],
  couleurAtmosphere: [0.35, 0.6, 1.0],
  atmosphere: 1,
  nuages: 0.45,
  glacePolaire: 0.14,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 30,
};
