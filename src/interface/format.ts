// Mise en forme des nombres affichés au joueur, « à la française ».

/** Écrit un nombre avec des espaces entre les milliers et une virgule décimale : 26 000,5 */
export function nombre(valeur: number, decimales = 0): string {
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

/** Distance dans la galaxie, en années-lumière. */
export function distanceAl(d: number): string {
  return d < 100 ? `${nombre(d, 1)} al` : `${nombre(d)} al`;
}

/** Vitesse dans la galaxie, en années-lumière par seconde. */
export function vitesseAl(v: number): string {
  if (v < 1) return `${nombre(v, 2)} al/s`;
  if (v < 100) return `${nombre(v, 1)} al/s`;
  return `${nombre(v)} al/s`;
}

/** Distance dans un système solaire, donnée en mètres. */
export function distanceMetres(d: number): string {
  const km = d / 1000;
  if (km < 1) return `${nombre(d)} m`;
  if (km < 100) return `${nombre(km, 1)} km`;
  if (km < 1e6) return `${nombre(km)} km`;
  if (km < 1e9) return `${nombre(km / 1e6, 1)} millions de km`;
  return `${nombre(km / 1e9, 1)} milliards de km`;
}

/** Vitesse dans un système solaire, donnée en mètres par seconde. */
export function vitesseMetres(v: number): string {
  const kms = v / 1000;
  if (kms < 1) return `${nombre(v)} m/s`;
  if (kms < 100) return `${nombre(kms, 1)} km/s`;
  return `${nombre(kms)} km/s`;
}
