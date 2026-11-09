// Shader de sommets du nuage galactique.
// Chaque point est une tache de lumière de plusieurs centaines d'années-lumière,
// qui représente des millions d'étoiles trop lointaines pour être vues une à une.

attribute vec3 couleur;
attribute float taille;          // diamètre de la tache (al)

uniform float uFacteurProjection; // convertit une taille (al) à une distance (al) en pixels
uniform float uTailleMax;         // taille maximale d'un point à l'écran (pixels)
uniform float uIntensite;
uniform float uProcheDebut;       // en dessous de cette distance (al), la tache est invisible
uniform float uProcheFin;         // au-dessus, elle est pleinement visible

varying vec3 vCouleur;
varying float vIntensite;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(length(mv.xyz), 1.0);

  float pixels = taille * uFacteurProjection / dist;
  float pixelsAffiches = clamp(pixels, 1.0, uTailleMax);
  // Conservation de la lumière : si le point est dessiné plus gros ou plus petit
  // que sa vraie taille, on corrige son intensité en proportion.
  float energie = min((pixels * pixels) / (pixelsAffiches * pixelsAffiches), 3.0);
  // Les taches très proches s'effacent : les vraies étoiles prennent le relais.
  float proche = smoothstep(uProcheDebut, uProcheFin, dist);

  vCouleur = couleur;
  vIntensite = uIntensite * energie * proche;
  gl_PointSize = pixelsAffiches;
  gl_Position = projectionMatrix * mv;
}
