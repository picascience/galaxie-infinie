// Shader de fragments d'une planète vue de loin.
// Il fabrique l'apparence de la surface (continents, océans, glaces, nuages,
// bandes des géantes gazeuses) à partir de bruit, puis l'éclaire par l'étoile.
// Le vrai relief, vu de près, arrivera avec le terrain (jour 3).

#include <common>
#include <logdepthbuf_pars_fragment>
#include <bruit>

uniform vec3 uCouleurBasse;
uniform vec3 uCouleurMoyenne;
uniform vec3 uCouleurHaute;
uniform vec3 uCouleurOcean;
uniform vec3 uCouleurAtmosphere;
uniform vec3 uCouleurLueur;
uniform vec3 uCouleurEtoile;
uniform vec3 uVersEtoile;   // direction de l'étoile (repère de la scène)
uniform vec3 uDecalage;     // rend chaque planète différente
uniform float uBandes;      // 1 = géante gazeuse, 0 = planète à relief
uniform float uOcean;       // part de la surface sous l'eau
uniform float uAtmosphere;
uniform float uNuages;
uniform float uGlace;
uniform float uLueur;
uniform float uTemps;

varying vec3 vLocal;
varying vec3 vNormale;
varying vec3 vMonde;

void main() {
  #include <logdepthbuf_fragment>
  vec3 p = normalize(vLocal);
  vec3 n = normalize(vNormale);
  vec3 vue = normalize(-vMonde);
  float jour = dot(n, uVersEtoile);
  // Limite jour/nuit adoucie (un peu plus quand il y a une atmosphère).
  float lumiere = smoothstep(-0.08 - 0.1 * uAtmosphere, 0.25, jour) * max(jour * 0.85 + 0.15, 0.0);

  vec3 couleur;
  float brillance = 0.0;
  float lueur = 0.0;

  if (uBandes > 0.5) {
    // --- Géante gazeuse : bandes parallèles à l'équateur, déformées par des tourbillons ---
    vec3 q = p * vec3(2.0, 7.0, 2.0) + uDecalage;
    q.x += uTemps * 0.01;
    float remous = bruitFractal(q) - 0.5;
    float latitude = p.y + 0.09 * remous;
    float bande = 0.5 + 0.5 * sin(latitude * (9.0 + 8.0 * fract(uDecalage.x)) + 3.0 * bruit(vec3(latitude * 4.0) + uDecalage));
    float fin = bruitFractal(p * vec3(3.0, 24.0, 3.0) + uDecalage * 2.0 + vec3(uTemps * 0.02, 0.0, 0.0));
    couleur = mix(uCouleurBasse, uCouleurMoyenne, smoothstep(0.15, 0.6, bande));
    couleur = mix(couleur, uCouleurHaute, smoothstep(0.6, 0.95, bande) * 0.8);
    couleur *= 0.85 + 0.3 * fin;
  } else {
    // --- Planète à relief ---
    vec3 q = p * 2.2 + uDecalage;
    // On déforme les coordonnées pour obtenir des côtes découpées plutôt que des taches rondes.
    q += 0.35 * (vec3(bruitFractal(q + 3.1), bruitFractal(q + 7.7), bruitFractal(q + 1.3)) - 0.5);
    float h = bruitFractal(q);
    float detail = bruitFractal(p * 9.0 + uDecalage);
    h = h + 0.12 * (detail - 0.5);

    // Niveau de la mer : choisi pour couvrir à peu près la part demandée.
    float niveau = mix(0.2, 0.62, uOcean);
    float terre = smoothstep(niveau - 0.004, niveau + 0.004, h);
    float altitude = clamp((h - niveau) / (0.85 - niveau), 0.0, 1.0);
    vec3 sol = mix(uCouleurBasse, uCouleurMoyenne, smoothstep(0.0, 0.35, altitude));
    sol = mix(sol, uCouleurHaute, smoothstep(0.35, 0.8, altitude));
    sol *= 0.82 + 0.36 * detail;
    float profondeur = clamp((niveau - h) * 5.0, 0.0, 1.0);
    vec3 mer = mix(uCouleurOcean * 1.6, uCouleurOcean * 0.55, profondeur);
    couleur = mix(mer, sol, max(terre, step(uOcean, 0.001)));
    brillance = (1.0 - terre) * step(0.001, uOcean);

    // Lueur du sol dans les creux (lave, cristaux) : elle ne dépend pas du soleil.
    float creux = 1.0 - smoothstep(0.0, 0.22, abs(bruitFractal(p * 5.0 + uDecalage * 3.0) - 0.5) * 2.0);
    lueur = uLueur * creux * (1.0 - smoothstep(0.3, 0.7, altitude));

    // Calottes de glace aux pôles.
    float pole = abs(p.y) + 0.08 * (detail - 0.5);
    float glace = smoothstep(1.0 - uGlace - 0.03, 1.0 - uGlace + 0.03, pole) * step(0.001, uGlace);
    couleur = mix(couleur, vec3(0.93, 0.96, 1.0), glace);
    brillance *= 1.0 - glace;

    // Nuages : une couche de bruit qui dérive lentement.
    vec3 c = p * 3.2 + uDecalage * 1.7 + vec3(uTemps * 0.004, 0.0, uTemps * 0.002);
    c += 0.5 * (vec3(bruitFractal(c * 0.7), 0.0, bruitFractal(c * 0.7 + 4.0)) - 0.25);
    float nuage = smoothstep(1.0 - uNuages * 0.75, 1.05 - uNuages * 0.45, bruitFractal(c) + 0.25);
    vec3 teinteNuage = mix(vec3(1.0), uCouleurAtmosphere, 0.25 * step(1.01, uAtmosphere));
    couleur = mix(couleur, teinteNuage, nuage * 0.92);
    brillance *= 1.0 - nuage;
    lueur *= 1.0 - nuage * 0.8;
  }

  vec3 eclaire = couleur * uCouleurEtoile * lumiere;

  // Reflet du soleil sur l'eau.
  vec3 demi = normalize(uVersEtoile + vue);
  eclaire += uCouleurEtoile * pow(max(dot(n, demi), 0.0), 90.0) * 0.7 * brillance * step(0.0, jour);

  // Halo d'atmosphère : plus marqué sur le bord de la planète, côté jour.
  float bord = pow(1.0 - max(dot(n, vue), 0.0), 3.0);
  float cote = smoothstep(-0.25, 0.4, jour);
  eclaire = mix(eclaire, uCouleurAtmosphere * uCouleurEtoile * cote, clamp(bord * 0.75 * uAtmosphere, 0.0, 0.85));
  // Un voile léger sur tout le côté jour.
  eclaire += uCouleurAtmosphere * 0.06 * uAtmosphere * lumiere;

  eclaire += uCouleurLueur * lueur * (1.0 - 0.6 * lumiere);
  // Un soupçon de lumière ambiante : le côté nuit n'est pas totalement noir.
  eclaire += couleur * 0.012;

  gl_FragColor = vec4(eclaire, 1.0);
}
