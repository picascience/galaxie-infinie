// Bruit cohérent en 3D (« bruit de gradient ») et bruit fractal.
// Il servira au relief des planètes (jour 3). Comme le reste de src/maths,
// il n'utilise que des opérations exactes : même graine = même relief partout.

import { hacher3, melanger32 } from './hachage';

/** Courbe d'adoucissement de degré 5 (dérivées nulles en 0 et en 1). */
function adoucir(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Produit scalaire entre un gradient pseudo-aléatoire du coin et le vecteur (dx, dy, dz). */
function gradient(graine: number, ix: number, iy: number, iz: number, dx: number, dy: number, dz: number): number {
  const h = melanger32(hacher3(ix, iy, iz) ^ graine) & 15;
  // 12 directions (les arêtes d'un cube), comme dans le bruit de Perlin amélioré.
  const u = h < 8 ? dx : dy;
  const v = h < 4 ? dy : h === 12 || h === 14 ? dx : dz;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Bruit de gradient 3D, valeur approximativement dans [−1, 1]. */
export function bruit3(graine: number, x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = adoucir(fx);
  const v = adoucir(fy);
  const w = adoucir(fz);

  const n000 = gradient(graine, ix, iy, iz, fx, fy, fz);
  const n100 = gradient(graine, ix + 1, iy, iz, fx - 1, fy, fz);
  const n010 = gradient(graine, ix, iy + 1, iz, fx, fy - 1, fz);
  const n110 = gradient(graine, ix + 1, iy + 1, iz, fx - 1, fy - 1, fz);
  const n001 = gradient(graine, ix, iy, iz + 1, fx, fy, fz - 1);
  const n101 = gradient(graine, ix + 1, iy, iz + 1, fx - 1, fy, fz - 1);
  const n011 = gradient(graine, ix, iy + 1, iz + 1, fx, fy - 1, fz - 1);
  const n111 = gradient(graine, ix + 1, iy + 1, iz + 1, fx - 1, fy - 1, fz - 1);

  const x00 = n000 + (n100 - n000) * u;
  const x10 = n010 + (n110 - n010) * u;
  const x01 = n001 + (n101 - n001) * u;
  const x11 = n011 + (n111 - n011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

/**
 * Bruit fractal : somme de plusieurs « octaves » de bruit, chacune deux fois
 * plus fine et deux fois plus faible que la précédente.
 */
export function bruitFractal(graine: number, x: number, y: number, z: number, octaves: number): number {
  let somme = 0;
  let amplitude = 0.5;
  let frequence = 1;
  for (let i = 0; i < octaves; i++) {
    somme += amplitude * bruit3(graine + i * 1013, x * frequence, y * frequence, z * frequence);
    amplitude *= 0.5;
    frequence *= 2;
  }
  return somme;
}
