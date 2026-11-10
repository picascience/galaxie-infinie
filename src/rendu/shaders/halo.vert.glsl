// Shader de sommets du halo d'une étoile : un carré toujours tourné vers la caméra.

#include <common>
#include <logdepthbuf_pars_vertex>

varying vec2 vCarre;

void main() {
  vCarre = position.xy * 2.0;   // de −1 à 1 d'un bord à l'autre
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
