// Shader de fragments des anneaux d'une planète : des bandes concentriques
// plus ou moins denses, avec l'ombre de la planète portée dessus.

#include <common>
#include <logdepthbuf_pars_fragment>
#include <bruit>

uniform vec3 uCouleur;
uniform vec3 uCouleurEtoile;
uniform vec3 uVersEtoile;
uniform float uRayonInterieur;
uniform float uRayonExterieur;
uniform float uRayonPlanete;
uniform float uGraine;

varying vec3 vLocal;
varying vec3 vRelatif;

void main() {
  #include <logdepthbuf_fragment>
  float r = length(vLocal.xy);
  float t = (r - uRayonInterieur) / (uRayonExterieur - uRayonInterieur);
  if (t < 0.0 || t > 1.0) discard;

  // Bandes : plusieurs couches de bruit qui ne dépendent que de la distance au centre.
  float large = bruit(vec3(t * 9.0, uGraine, 0.0));
  float fines = bruit(vec3(t * 70.0, uGraine, 3.0));
  float tresFines = bruit(vec3(t * 260.0, uGraine, 7.0));
  float densite = smoothstep(0.15, 0.75, large) * (0.45 + 0.55 * fines) * (0.75 + 0.25 * tresFines);
  densite *= smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.93, t);

  // Ombre de la planète : ce point de l'anneau voit-il l'étoile ?
  float versSoleil = dot(vRelatif, uVersEtoile);
  float ecart2 = dot(vRelatif, vRelatif) - versSoleil * versSoleil;
  float ombre = versSoleil < 0.0 ? smoothstep(uRayonPlanete * 0.96, uRayonPlanete * 1.04, sqrt(ecart2)) : 1.0;

  vec3 couleur = uCouleur * uCouleurEtoile * (0.55 + 0.45 * fines) * (0.06 + 0.94 * ombre);
  gl_FragColor = vec4(couleur, densite * 0.9);
}
