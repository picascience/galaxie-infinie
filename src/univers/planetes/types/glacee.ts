// Planète glacée : une croûte de glace craquelée, blanche et bleutée.
import type { DefinitionType } from './definition';

export const glacee: DefinitionType = {
  id: 'glacee',
  nom: 'Glacée',
  rayonKm: [200, 800],
  densite: [0.4, 0.8],
  atterrissage: true,
  lunePossible: true,
  aspect: 'relief',
  couleurBasse: [0.55, 0.7, 0.85],
  couleurMoyenne: [0.8, 0.88, 0.95],
  couleurHaute: [0.97, 0.98, 1.0],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.7, 0.85, 1.0],
  atmosphere: 0.35,
  nuages: 0.12,
  glacePolaire: 0,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 0,
};
