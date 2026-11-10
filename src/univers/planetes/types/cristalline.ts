// Planète cristalline : un sol sombre semé de vastes champs de cristaux violets et turquoise.
import type { DefinitionType } from './definition';

export const cristalline: DefinitionType = {
  id: 'cristalline',
  nom: 'Cristalline',
  rayonKm: [150, 500],
  densite: [0.9, 1.3],
  atterrissage: true,
  lunePossible: true,
  aspect: 'relief',
  couleurBasse: [0.2, 0.14, 0.34],
  couleurMoyenne: [0.42, 0.3, 0.62],
  couleurHaute: [0.55, 0.85, 0.88],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.7, 0.5, 1.0],
  atmosphere: 0.4,
  nuages: 0,
  glacePolaire: 0,
  lueur: 0.35,
  couleurLueur: [0.5, 0.9, 1.0],
  effetDeSerre: 0,
};
