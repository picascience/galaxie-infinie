// Planète volcanique : roche noire, coulées de lave qui rougeoient dans la nuit.
import type { DefinitionType } from './definition';

export const volcanique: DefinitionType = {
  id: 'volcanique',
  nom: 'Volcanique',
  rayonKm: [200, 700],
  densite: [1.0, 1.3],
  atterrissage: true,
  lunePossible: true,
  aspect: 'relief',
  couleurBasse: [0.16, 0.1, 0.09],
  couleurMoyenne: [0.2, 0.18, 0.17],
  couleurHaute: [0.34, 0.31, 0.3],
  ocean: 0,
  couleurOcean: [0, 0, 0],
  couleurAtmosphere: [0.9, 0.45, 0.3],
  atmosphere: 0.5,
  nuages: 0,
  glacePolaire: 0,
  lueur: 1,
  couleurLueur: [1.0, 0.35, 0.05],
  effetDeSerre: 60,
};
