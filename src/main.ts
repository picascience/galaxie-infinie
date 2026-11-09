// Point d'entrée du jeu : il assemble les modules et lance la boucle.
//
// Étape actuelle (jour 1) : on vole librement dans la galaxie.
//
// Paramètres possibles dans l'adresse de la page :
//   ?graine=TEXTE     choisit la galaxie
//   ?qualite=bas      force un réglage graphique (bas, moyen, haut)
//   ?auto=1           saute l'écran d'accueil
//   ?pos=x,y,z        position de départ (années-lumière)
//   ?cap=lacet,tangage   direction du regard au départ (degrés)
//   ?mesures=1        affiche le panneau de mesures dès le départ
// (Les quatre derniers servent surtout aux tests automatiques.)

import './interface/styles.css';
import { GRAINE_PAR_DEFAUT, POSITION_DEPART } from './config/echelles';
import { choisirQualite, estAppareilTactile } from './config/graphismes';
import { CameraLibre } from './controles/cameraLibre';
import { Entrees } from './controles/entrees';
import { afficherAccueil, nettoyerGraine } from './interface/accueil';
import { Hud } from './interface/hud';
import { PanneauMesures } from './interface/mesures';
import { Boucle } from './noyau/boucle';
import { ChampEtoiles } from './rendu/espace/champEtoiles';
import { FondGalactique } from './rendu/espace/fondGalactique';
import { Moteur, type PositionDouble } from './rendu/moteur';
import { creerParametresGalaxie, estimerNombreEtoiles } from './univers/galaxie/densite';
import { CacheSecteurs } from './univers/galaxie/secteurs';

const parametres = new URLSearchParams(window.location.search);
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const interfaceJeu = document.getElementById('interface') as HTMLElement;
const tactile = estAppareilTactile();

/** Lit une liste de nombres dans l'adresse, par exemple « ?pos=100,0,-50 ». */
function lireNombres(nom: string, combien: number): number[] | null {
  const texte = parametres.get(nom);
  if (!texte) return null;
  const valeurs = texte.split(',').map(Number);
  return valeurs.length === combien && valeurs.every(Number.isFinite) ? valeurs : null;
}

/** Crée la galaxie de la graine donnée et lance l'exploration. */
function lancerJeu(graine: string): void {
  // On note la graine dans l'adresse : recharger la page ou partager le lien
  // redonne exactement la même galaxie.
  parametres.set('graine', graine);
  window.history.replaceState(null, '', `?${parametres.toString()}`);

  const prereglage = choisirQualite(parametres.get('qualite'));
  const galaxie = creerParametresGalaxie(graine);

  // --- Rendu ---
  const moteur = new Moteur(canvas, prereglage);
  const cache = new CacheSecteurs(galaxie);
  const champ = new ChampEtoiles(cache, prereglage.rayonSecteurs);
  const fond = new FondGalactique(galaxie, prereglage.particulesGalaxie);
  moteur.scene.add(fond.points, champ.groupe);

  // --- Caméra et commandes ---
  const pos = lireNombres('pos', 3);
  const depart: PositionDouble = pos ? { x: pos[0]!, y: pos[1]!, z: pos[2]! } : POSITION_DEPART;
  const camera = new CameraLibre(depart);
  // Par défaut on regarde vers le centre de la galaxie.
  const cap = lireNombres('cap', 2) ?? [90, 0];
  camera.orienter(cap[0]!, cap[1]!);
  const entrees = new Entrees(canvas);

  // --- Interface ---
  const hud = new Hud(interfaceJeu, graine, galaxie.nombreBras, estimerNombreEtoiles(galaxie), tactile);
  hud.surVitesse = (crans) => entrees.ajouterMolette(crans);
  const mesures = new PanneauMesures(interfaceJeu, parametres.get('mesures') === '1');
  canvas.addEventListener('click', () => {
    if (!tactile && !entrees.sourisCapturee) entrees.capturerSouris();
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyH') hud.basculerAide();
    if (e.code === 'F3') mesures.basculer();
    if (e.code === 'KeyG') window.location.search = ''; // retour à l'écran d'accueil
  });

  champ.toutConstruire(camera.position);

  // --- Boucle de jeu ---
  let tempsDepuisHud = 1;
  const boucle = new Boucle((dt) => {
    camera.mettreAJour(dt, entrees);
    champ.mettreAJour(camera.position, camera.vitesseActuelle, moteur.rapportPixels);
    fond.mettreAJour(camera.position, moteur);
    moteur.camera.quaternion.copy(camera.orientation);
    moteur.rendre();

    // Les textes n'ont pas besoin d'être rafraîchis à chaque image : 5 fois par seconde suffisent.
    tempsDepuisHud += dt;
    if (tempsDepuisHud >= 0.2) {
      tempsDepuisHud = 0;
      hud.mettreAJour({
        position: camera.position,
        vitesse: camera.vitesseActuelle,
        vitesseMax: camera.vitesseMax,
        etoilesAffichees: champ.nombreEtoiles,
        etoileProche: champ.etoileLaPlusProche(camera.position),
      });
      const info = moteur.renderer.info.render;
      mesures.mettreAJour({
        imagesParSeconde: boucle.imagesParSeconde,
        msParImage: boucle.msParImage,
        msPireImage: boucle.msPireImage,
        appelsDeDessin: info.calls,
        points: info.points,
        triangles: info.triangles,
        secteursEnMemoire: cache.taille,
        qualite: prereglage.nom,
        rapportPixels: moteur.rapportPixels,
      });
    }
  });
  boucle.demarrer();
}

// --- Démarrage ---
const graineDemandee = nettoyerGraine(parametres.get('graine') ?? GRAINE_PAR_DEFAUT);
if (parametres.get('auto') === '1') {
  lancerJeu(graineDemandee);
} else {
  afficherAccueil(interfaceJeu, graineDemandee, tactile, (graine) => {
    lancerJeu(graine);
    // Le clic sur « Explorer » autorise la capture de la souris : on la demande tout de suite.
    if (!tactile) canvas.click();
  });
}
