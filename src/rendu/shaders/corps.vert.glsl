// Shader de sommets commun aux sphères (étoiles et planètes) et aux anneaux.
// La caméra est toujours à l'origine de la scène (origine flottante).

#include <common>
#include <logdepthbuf_pars_vertex>

varying vec3 vLocal;    // position sur l'objet, avant rotation (suit la rotation de la planète)
varying vec3 vNormale;  // normale dans le repère de la scène
varying vec3 vRelatif;  // position par rapport au centre de l'objet, dans le repère de la scène
varying vec3 vMonde;    // position par rapport à la caméra

void main() {
  vLocal = position;
  vNormale = normalize(mat3(modelMatrix) * normal);
  vRelatif = mat3(modelMatrix) * position;
  vec4 monde = modelMatrix * vec4(position, 1.0);
  vMonde = monde.xyz;
  gl_Position = projectionMatrix * viewMatrix * monde;
  #include <logdepthbuf_vertex>
}
