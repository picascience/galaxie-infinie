// Shader de sommets de l'effet hyperespace : un triangle qui couvre tout l'écran.

varying vec2 vEcran;
uniform float uRapport;   // largeur / hauteur de l'écran

void main() {
  vEcran = position.xy * vec2(uRapport, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
