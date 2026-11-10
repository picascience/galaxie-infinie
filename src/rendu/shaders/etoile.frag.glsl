// Shader de fragments de la surface d'une étoile : une sphère lumineuse et
// granuleuse, plus sombre sur les bords (comme le vrai Soleil).

#include <common>
#include <logdepthbuf_pars_fragment>
#include <bruit>

uniform vec3 uCouleur;
uniform float uTemps;

varying vec3 vLocal;
varying vec3 vNormale;
varying vec3 vMonde;

void main() {
  #include <logdepthbuf_fragment>
  vec3 p = normalize(vLocal);
  vec3 vue = normalize(-vMonde);
  float face = max(dot(normalize(vNormale), vue), 0.0);

  // Granulation qui bouillonne lentement, et quelques taches plus sombres.
  float grain = bruitFractal(p * 14.0 + vec3(0.0, uTemps * 0.05, 0.0));
  float taches = smoothstep(0.62, 0.8, bruitFractal(p * 3.0 + vec3(uTemps * 0.004)));
  float surface = 0.82 + 0.36 * grain - 0.35 * taches;

  float assombrissement = 0.35 + 0.65 * pow(face, 0.45);
  vec3 couleur = mix(uCouleur, vec3(1.0), 0.3 * face) * surface * assombrissement * 1.12;
  gl_FragColor = vec4(couleur, 1.0);
}
