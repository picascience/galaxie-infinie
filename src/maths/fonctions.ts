// Fonctions mathématiques « identiques partout ».
//
// Pourquoi ne pas utiliser Math.exp, Math.cos, Math.log… ?
// Parce que leur dernier chiffre peut différer entre Chrome et Safari.
// Une différence minuscule suffirait à créer une étoile de plus ou de
// moins dans un secteur : la galaxie ne serait plus la même partout.
//
// Les versions ci-dessous n'utilisent que + − × ÷, des opérations que tous
// les appareils calculent exactement de la même façon. Leur précision
// (environ 8 chiffres) suffit largement pour générer l'univers.
//
// RÈGLE : dans src/maths et src/univers, on utilise ces fonctions et jamais
// Math.exp / Math.log / Math.cos / Math.sin / Math.atan2 / Math.pow
// (un test automatique le vérifie).

export const PI = 3.141592653589793;
export const DEUX_PI = 6.283185307179586;
const DEMI_PI = 1.5707963267948966;
const QUART_PI = 0.7853981633974483;
const LN2 = 0.6931471805599453;

// Table des puissances de 2 (exactes), de 2^-1000 à 2^1000.
const DECALAGE = 1000;
const PUISSANCES_DE_2 = new Float64Array(2 * DECALAGE + 1);
PUISSANCES_DE_2[DECALAGE] = 1;
for (let i = 1; i <= DECALAGE; i++) {
  PUISSANCES_DE_2[DECALAGE + i] = PUISSANCES_DE_2[DECALAGE + i - 1]! * 2;
  PUISSANCES_DE_2[DECALAGE - i] = PUISSANCES_DE_2[DECALAGE - i + 1]! / 2;
}

/** Exponentielle e^x. */
export function exp(x: number): number {
  if (x > 690) x = 690;
  if (x < -690) return 0;
  // e^x = 2^k × e^r, avec r petit (|r| ≤ 0,35) : la série converge très vite.
  const k = Math.round(x / LN2);
  const r = x - k * LN2;
  let s = 1;
  for (let n = 13; n >= 1; n--) s = 1 + (r / n) * s;
  return s * PUISSANCES_DE_2[k + DECALAGE]!;
}

/** Logarithme naturel ln(x), pour x > 0. */
export function ln(x: number): number {
  if (!(x > 0)) return -1e300;
  // On ramène x dans [0,75 ; 1,5[ en comptant les divisions par 2.
  let e = 0;
  while (x >= 1.5) {
    x *= 0.5;
    e++;
  }
  while (x < 0.75) {
    x *= 2;
    e--;
  }
  // ln(x) = 2 × atanh((x−1)/(x+1)), développé en série.
  const t = (x - 1) / (x + 1);
  const t2 = t * t;
  let s = 0;
  for (let n = 17; n >= 1; n -= 2) s = 1 / n + t2 * s;
  return e * LN2 + 2 * t * s;
}

/** Cosinus (angle en radians). */
export function cos(x: number): number {
  // Réduction dans [−π, π], puis dans [−π/2, π/2] grâce à cos(x) = −cos(x − π).
  x = x - DEUX_PI * Math.round(x / DEUX_PI);
  let signe = 1;
  if (x > DEMI_PI) {
    x -= PI;
    signe = -1;
  } else if (x < -DEMI_PI) {
    x += PI;
    signe = -1;
  }
  const x2 = x * x;
  let s = 1;
  for (let n = 18; n >= 2; n -= 2) s = 1 - (x2 / (n * (n - 1))) * s;
  return signe * s;
}

/** Sinus (angle en radians). */
export function sin(x: number): number {
  return cos(x - DEMI_PI);
}

/** Angle du point (x, y), dans ]−π, π]. */
export function atan2(y: number, x: number): number {
  if (x === 0 && y === 0) return 0;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  // On se ramène à atan(a) avec a dans [0, 1], puis dans [−0,42 ; 0,42].
  let a = ax > ay ? ay / ax : ax / ay;
  let base = 0;
  if (a > 0.41421356237) {
    a = (a - 1) / (a + 1);
    base = QUART_PI;
  }
  const a2 = a * a;
  let s = 0;
  for (let n = 21; n >= 1; n -= 2) s = 1 / n - a2 * s;
  let r = base + a * s;
  if (ay > ax) r = DEMI_PI - r;
  if (x < 0) r = PI - r;
  return y < 0 ? -r : r;
}

/** Ramène x entre min et max. */
export function borner(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

/** Mélange linéaire : a quand t = 0, b quand t = 1. */
export function melange(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Transition douce de 0 à 1 quand x passe de a à b. */
export function transitionDouce(a: number, b: number, x: number): number {
  const t = borner((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
