// Shader de sommets des étoiles proches.
// Chaque étoile est un point. Sa taille et son éclat à l'écran dépendent
// de sa luminosité réelle et de sa distance à la caméra.

attribute vec3 couleur;
attribute float luminosite;

uniform float uRayonVisible;   // au-delà de cette distance (al), l'étoile n'est plus chargée
uniform float uEchellePixels;  // finesse de l'écran (pour garder la même taille apparente)
uniform float uOpacite;        // 0 = niveau masqué, 1 = visible
uniform vec4 uExclue;          // xyz : étoile à ne pas dessiner ; w : 1 si la règle est active

varying vec3 vCouleur;
varying float vEclat;

void main() {
  // La caméra est toujours à l'origine : mv est la position vue depuis la caméra.
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(length(mv.xyz), 1e-4);

  // Lumière reçue : elle diminue avec le carré de la distance.
  float flux = luminosite / (dist * dist);
  // L'œil perçoit l'éclat de façon logarithmique (comme les magnitudes des astronomes).
  float magnitude = log2(flux) / 3.3219;
  float b = clamp((magnitude + 5.5) / 4.8, 0.0, 1.6);

  // Fondu en bordure de zone chargée : les étoiles apparaissent en douceur.
  float fondu = 1.0 - smoothstep(0.7 * uRayonVisible, uRayonVisible, dist);

  // L'étoile du système où l'on se trouve est dessinée en 3D, pas comme un point.
  if (uExclue.w > 0.5 && distance(position, uExclue.xyz) < 0.02) fondu = 0.0;

  vCouleur = couleur;
  vEclat = b * (0.22 + 1.2 * b) * fondu * uOpacite;
  gl_PointSize = (1.5 + 4.6 * b * b) * uEchellePixels;
  gl_Position = projectionMatrix * mv;
}
