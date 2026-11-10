// Planète désertique : du sable et de la roche ocre, un air sec et poussiéreux.
import type { DefinitionType } from './definition';

export const desertique: DefinitionType = {
  id: 'desertique',
  nom: 'Désertique',
  rayonKm: [300, 1000],
  densite: [0.8, 1.1],
  atterrissage: true,
  lunePossible: true,
  aspect: 'relief',
  couleurBasse: [0.62, 0.4, 0.22],
  couleurMoyenne: [0.82, 0.62, 0.36],
  couleurHaute: [0.92, 0.8, 0.58],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.95, 0.7, 0.45],
  atmosphere: 0.6,
  nuages: 0.06,
  glacePolaire: 0.05,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 10,
};
