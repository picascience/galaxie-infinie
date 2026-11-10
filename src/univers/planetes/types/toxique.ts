// Planète toxique : une atmosphère épaisse, jaune-vert, au-dessus de mers acides.
import type { DefinitionType } from './definition';

export const toxique: DefinitionType = {
  id: 'toxique',
  nom: 'Toxique',
  rayonKm: [500, 1200],
  densite: [0.9, 1.2],
  atterrissage: true,
  lunePossible: false,
  aspect: 'relief',
  couleurBasse: [0.36, 0.34, 0.12],
  couleurMoyenne: [0.5, 0.46, 0.2],
  couleurHaute: [0.62, 0.56, 0.36],
  ocean: 0.35,
  couleurOcean: [0.3, 0.42, 0.08],
  couleurAtmosphere: [0.75, 0.85, 0.3],
  atmosphere: 1.3,
  nuages: 0.7,
  glacePolaire: 0,
  lueur: 0,
  couleurLueur: [0, 0, 0],
  effetDeSerre: 180,
};
