// Planète rocheuse : un monde de pierre nue, couvert de cratères, sans air ou presque.
import type { DefinitionType } from './definition';

export const rocheuse: DefinitionType = {
  id: 'rocheuse',
  nom: 'Rocheuse',
  rayonKm: [250, 900],
  densite: [0.8, 1.2],
  atterrissage: true,
  lunePossible: true,
  aspect: 'relief',
  couleurBasse: [0.3, 0.27, 0.25],
  couleurMoyenne: [0.5, 0.46, 0.42],
  couleurHaute: [0.72, 0.69, 0.65],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.6, 0.6, 0.65],
  atmosphere: 0.08,
  nuages: 0,
  glacePolaire: 0,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 0,
};
