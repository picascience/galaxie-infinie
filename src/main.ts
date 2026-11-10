// Point d'entrée du jeu : il affiche l'écran d'accueil puis crée le jeu.
// Toute la logique est dans src/noyau/jeu.ts.
//
// Paramètres possibles dans l'adresse de la page :
//   ?graine=TEXTE     choisit la galaxie
//   ?sys=ADRESSE      système de départ (rempli automatiquement pendant le jeu)
//   ?qualite=bas      force un réglage graphique (bas, moyen, haut)
// Paramètres réservés aux tests automatiques :
//   ?auto=1           saute l'écran d'accueil
//   ?corps=N          place la caméra devant le corps numéro N du système
//   ?carte=1          ouvre la carte galactique dès le départ
//   ?sauter=1         avec carte=1 : saute vers la première étoile visée
//   ?pos=x,y,z        démarre sur la carte à cette position (années-lumière)
//   ?cap=lacet,tangage   direction du regard sur la carte (degrés)
//   ?effet=0.8        force l'effet hyperespace (0 à 1)
//   ?mesures=1        affiche le panneau de mesures dès le départ

import './interface/styles.css';
import './rendu/shaders';
import { GRAINE_PAR_DEFAUT } from './config/echelles';
import { estAppareilTactile } from './config/graphismes';
import { afficherAccueil, nettoyerGraine } from './interface/accueil';
import { Jeu } from './noyau/jeu';

const parametres = new URLSearchParams(window.location.search);
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const interfaceJeu = document.getElementById('interface') as HTMLElement;
const tactile = estAppareilTactile();

function lancer(graine: string): Jeu {
  // On note la graine dans l'adresse : recharger la page ou partager le lien
  // redonne exactement la même galaxie.
  parametres.set('graine', graine);
  window.history.replaceState(null, '', `?${parametres.toString()}`);
  return new Jeu(canvas, interfaceJeu, graine, parametres, tactile);
}

const graineDemandee = nettoyerGraine(parametres.get('graine') ?? GRAINE_PAR_DEFAUT);
if (parametres.get('auto') === '1' || parametres.has('sys')) {
  lancer(graineDemandee);
} else {
  afficherAccueil(interfaceJeu, graineDemandee, tactile, (graine) => {
    // Une autre graine = une autre galaxie : l'ancien système de l'adresse ne vaut plus.
    lancer(graine).capturerSouris();
  });
}
