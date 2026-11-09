# Galaxie Infinie

Jeu d'exploration spatiale procédurale qui tourne entièrement dans le navigateur.
Tout est calculé sur place à partir d'une **graine** : aucune IA, aucun serveur,
aucun appel réseau, aucun fichier image ou son.

**Jouer :** https://picascience.github.io/galaxie-infinie/

> Projet en cours de construction, sur 7 étapes. Ce README sera complété à la dernière.

## Où en est le projet

| Jour | Contenu | État |
| --- | --- | --- |
| 1 | Fondations, galaxie par secteurs, champ d'étoiles, caméra libre | fait |
| 2 | Systèmes solaires, carte galactique, hyperespace | à venir |
| 3 | Terrain des planètes (sphère cubique, quadtree, Web Workers) | à venir |
| 4 | Atmosphère, océans, nuages, 8 types de planètes | à venir |
| 5 | Vaisseau, pilotage, atterrissage | à venir |
| 6 | Objets de surface, scanner, journal, marqueurs | à venir |
| 7 | Optimisation, mode iPhone, documentation complète | à venir |

## Commandes (jour 1 : caméra libre)

| Touche | Action |
| --- | --- |
| Z Q S D (ou W A S D) | avancer, reculer, gauche, droite |
| Espace / C | monter / descendre |
| A / E | pencher à gauche / à droite |
| Souris | regarder (clic pour capturer la souris, Échap pour la libérer) |
| Molette | régler la vitesse |
| Maj | vitesse × 10 |
| H | aide |
| F3 | panneau de mesures |
| G | changer de graine |

Sur téléphone : pouce gauche pour avancer, pouce droit pour regarder, boutons + et − pour la vitesse.

## Lancer le jeu sur son ordinateur

Il faut [Node.js](https://nodejs.org) version 22 ou plus récente.

```
npm install        (une seule fois : télécharge les outils)
npm run dev        (lance le jeu ; ouvrir l'adresse affichée dans Chrome)
npm run verifier   (types + tests + construction + test d'autonomie)
```

## Organisation du code

```
src/
├─ main.ts        point d'entrée : assemble les modules
├─ config/        échelles de la galaxie, préréglages graphiques, mots interdits
├─ noyau/         boucle de jeu
├─ maths/         hachage, hasard à graine, bruit, fonctions « identiques partout »
├─ univers/       génération déterministe (aucun affichage, jamais de Three.js)
│  └─ galaxie/    forme spirale, secteurs d'étoiles, familles d'étoiles, noms
├─ rendu/         affichage avec Three.js et shaders GLSL
├─ controles/     clavier, souris, tactile, caméra libre
└─ interface/     écran d'accueil, affichage de bord, panneau de mesures
tests/            tests automatiques (déterminisme, règles du projet)
outils/           test d'autonomie du site construit
```

Trois règles tiennent le projet :

1. `src/univers` et `src/maths` ne font que calculer. Ils n'utilisent ni Three.js,
   ni `Math.random`, ni les fonctions `Math.sin`, `Math.exp`… dont le résultat
   peut varier d'un navigateur à l'autre. Même graine = même galaxie partout.
2. `src/rendu` ne décide jamais du contenu : il dessine ce que `univers` décrit.
3. Aucun appel réseau : la page livrée contient une règle de sécurité qui bloque
   toute connexion, et un test le vérifie avant chaque mise en ligne.
