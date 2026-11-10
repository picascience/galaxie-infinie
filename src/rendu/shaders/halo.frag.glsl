// Shader de fragments du halo d'une étoile : un éclat qui s'estompe doucement.

#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 uCouleur;
uniform float uIntensite;
uniform float uCoeur;   // taille du disque de l'étoile dans le carré (0 à 1)

varying vec2 vCarre;

void main() {
  #include <logdepthbuf_fragment>
  float r = length(vCarre);
  if (r > 1.0) discard;
  float bord = 1.0 - r;
  // Un éclat vif près du disque, puis une longue traîne très douce.
  float proche = uCoeur * uCoeur / (r * r + uCoeur * uCoeur * 0.5);
  float halo = (0.55 * proche + 0.18 * bord * bord * bord) * bord;
  gl_FragColor = vec4(mix(uCouleur, vec3(1.0), clamp(proche * 0.5, 0.0, 0.8)) * halo * uIntensite, 1.0);
}
