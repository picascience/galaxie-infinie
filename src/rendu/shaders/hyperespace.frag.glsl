// Shader de fragments de l'effet hyperespace : des traits de lumière qui
// fuient depuis le centre de l'écran, comme des étoiles étirées par la vitesse.

uniform float uTemps;
uniform float uForce;   // 0 = invisible, 1 = effet complet

varying vec2 vEcran;

float hasard1(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

void main() {
  float r = length(vEcran);
  float angle = atan(vEcran.y, vEcran.x);

  vec3 couleur = vec3(0.0);
  // Trois couches de traits, de finesses et de vitesses différentes.
  for (int c = 0; c < 3; c++) {
    float nombre = 90.0 + 70.0 * float(c);
    float secteur = floor((angle / 6.2831853 + 0.5) * nombre);
    float h = hasard1(secteur + 31.0 * float(c));
    float h2 = hasard1(secteur * 1.7 + 5.0 + 13.0 * float(c));
    // Position du trait le long de son rayon : il part du centre et accélère.
    float avance = fract(h + uTemps * (0.5 + 0.9 * h2));
    float tete = avance * avance * 1.6;
    float longueur = 0.05 + 0.5 * avance * uForce;
    float trait = smoothstep(tete - longueur, tete, r) * (1.0 - smoothstep(tete, tete + 0.012, r));
    // Finesse du trait dans son secteur angulaire.
    float centre = abs(fract((angle / 6.2831853 + 0.5) * nombre) - 0.5);
    trait *= smoothstep(0.34, 0.04, centre) * step(0.55, h2);
    vec3 teinte = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.95, 0.9), h);
    couleur += teinte * trait * (0.5 + avance);
  }

  // Lueur bleutée au centre, là où tout converge.
  float lueur = exp(-r * 5.0) * 0.9 + exp(-r * 1.6) * 0.18;
  couleur += vec3(0.55, 0.75, 1.0) * lueur;
  // Voile sombre : le décor s'efface pendant le saut.
  float voile = 0.92 * uForce;
  gl_FragColor = vec4(couleur * uForce, voile);
}
