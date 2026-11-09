// Shader de fragments des étoiles proches : un cœur brillant et un léger halo.

varying vec3 vCouleur;
varying float vEclat;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;      // 0 au centre du point, 1 au bord
  if (r2 > 1.0) discard;

  float coeur = exp(-r2 * 9.0);
  float halo = (1.0 - r2) * (1.0 - r2) * 0.3;
  // Le cœur tire vers le blanc, le halo garde la couleur de l'étoile.
  vec3 teinte = mix(vCouleur, vec3(1.0), coeur * 0.55);
  gl_FragColor = vec4(teinte * (coeur + halo) * vEclat, 1.0);
}
