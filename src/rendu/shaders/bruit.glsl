// Fonctions de bruit partagées par plusieurs shaders (incluses par « #include <bruit> »).
// Ici le bruit ne sert qu'à l'apparence : il n'a pas besoin d'être identique
// au bit près d'un appareil à l'autre (contrairement à la génération de l'univers).

float hasard(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Bruit lisse en 3D, entre 0 et 1.
float bruit(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hasard(i), hasard(i + vec3(1, 0, 0)), f.x),
        mix(hasard(i + vec3(0, 1, 0)), hasard(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hasard(i + vec3(0, 0, 1)), hasard(i + vec3(1, 0, 1)), f.x),
        mix(hasard(i + vec3(0, 1, 1)), hasard(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

// Bruit fractal : 5 couches de plus en plus fines. Résultat entre 0 et 1 environ.
float bruitFractal(vec3 p) {
  float somme = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    somme += amplitude * bruit(p);
    p = p * 2.03 + vec3(11.7, 5.3, 8.1);
    amplitude *= 0.5;
  }
  return somme / 0.96875;
}
