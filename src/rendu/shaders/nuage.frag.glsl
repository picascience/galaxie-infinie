// Shader de fragments du nuage galactique : une tache douce, sans bord net.

varying vec3 vCouleur;
varying float vIntensite;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  if (r2 > 1.0) discard;
  float profil = exp(-r2 * 4.0) - 0.0183;   // s'annule exactement au bord
  gl_FragColor = vec4(vCouleur * profil * vIntensite, 1.0);
}
