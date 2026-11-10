// Le chef d'orchestre : il possède tous les modules et décide, à chaque image,
// de ce qui est mis à jour et dessiné.
//
// Le jeu est toujours dans l'un de ces trois états :
//   « systeme » : on se déplace dans un système solaire ;
//   « carte »   : on parcourt la galaxie pour choisir une étoile ;
//   « saut »    : saut hyperespace en cours vers l'étoile choisie.

import * as THREE from 'three';
import { POSITION_DEPART } from '../config/echelles';
import { choisirQualite, type Prereglage } from '../config/graphismes';
import { CameraLibre } from '../controles/cameraLibre';
import { CameraSysteme } from '../controles/cameraSysteme';
import { Entrees } from '../controles/entrees';
import { Memoire } from '../exploration/memoire';
import { distanceAl, distanceMetres, nombre, vitesseAl, vitesseMetres } from '../interface/format';
import { Hud } from '../interface/hud';
import { PanneauMesures } from '../interface/mesures';
import { PanneauSysteme } from '../interface/panneauSysteme';
import { Reperes } from '../interface/reperes';
import { EffetHyperespace } from '../rendu/effets/hyperespace';
import { ChampEtoiles } from '../rendu/espace/champEtoiles';
import { FondGalactique } from '../rendu/espace/fondGalactique';
import { Moteur, type PositionDouble } from '../rendu/moteur';
import { VueSysteme } from '../rendu/systeme/vueSysteme';
import { creerParametresGalaxie, estimerNombreEtoiles, type ParametresGalaxie } from '../univers/galaxie/densite';
import { CLASSES_ETOILES } from '../univers/galaxie/etoiles';
import { nomEtoile } from '../univers/galaxie/noms';
import { CacheSecteurs, etoileDuSecteur, lireAdresse, texteAdresse, type EtoileGalaxie } from '../univers/galaxie/secteurs';
import { genererSysteme } from '../univers/systeme/generer';
import { Boucle } from './boucle';

type Etat = 'systeme' | 'carte' | 'saut';

/** Durée totale d'un saut hyperespace (s) et moment où l'on change de système. */
const DUREE_SAUT = 3.4;
const MOMENT_CHANGEMENT = 1.7;
/** Écart maximal entre le viseur et une étoile pour la sélectionner (radians). */
const ANGLE_VISEE = 0.045;

const AIDE_COMMUNE: readonly (readonly [string, string])[] = [
  ['Z Q S D', 'avancer, reculer, aller à gauche ou à droite (W A S D en QWERTY)'],
  ['Espace / C', 'monter / descendre'],
  ['A / E', 'pencher à gauche / à droite'],
  ['Souris', 'regarder (clic pour capturer la souris, Échap pour la libérer)'],
  ['Molette', 'régler la vitesse'],
  ['Maj', 'aller plus vite'],
];

export class Jeu {
  private readonly prereglage: Prereglage;
  private readonly galaxie: ParametresGalaxie;
  private readonly moteur: Moteur;
  private readonly cache: CacheSecteurs;
  private readonly champ: ChampEtoiles;
  private readonly fond: FondGalactique;
  private readonly effet: EffetHyperespace;
  private readonly entrees: Entrees;
  private readonly cameraCarte: CameraLibre;
  private readonly cameraSysteme = new CameraSysteme();
  private readonly memoire: Memoire;
  private readonly hud: Hud;
  private readonly reperes: Reperes;
  private readonly panneau: PanneauSysteme;
  private readonly mesures: PanneauMesures;
  private readonly boucle: Boucle;
  private readonly texteGalaxie: string;

  private etat: Etat = 'carte';
  /** Temps du jeu (s) : il fait avancer les orbites. */
  private temps = 0;
  private vue: VueSysteme | null = null;
  /** Étoile du système où l'on se trouve (null tant qu'on n'est entré dans aucun). */
  private etoileCourante: EtoileGalaxie | null = null;
  /** Étoile sélectionnée sur la carte, et le nombre de planètes de son système. */
  private etoileVisee: EtoileGalaxie | null = null;
  private planetesVisees = 0;
  private saut: { t: number; cible: EtoileGalaxie; charge: boolean } | null = null;
  /** Force de l'effet hyperespace imposée par l'adresse (tests), sinon −1. */
  private effetForce = -1;
  private tempsDepuisTextes = 1;
  private tempsDepuisVisee = 1;

  private readonly tmpV = new THREE.Vector3();
  private readonly tmpDirection = new THREE.Vector3();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    interfaceJeu: HTMLElement,
    private readonly graine: string,
    private readonly parametres: URLSearchParams,
    private readonly tactile: boolean,
  ) {
    this.prereglage = choisirQualite(parametres.get('qualite'));
    this.galaxie = creerParametresGalaxie(graine);
    this.memoire = new Memoire(graine);
    const milliards = nombre(estimerNombreEtoiles(this.galaxie) / 1e9, 1);
    this.texteGalaxie = `${this.galaxie.nombreBras} bras spiraux · environ ${milliards} milliards d'étoiles`;

    // --- Rendu ---
    this.moteur = new Moteur(canvas, this.prereglage);
    this.cache = new CacheSecteurs(this.galaxie);
    this.champ = new ChampEtoiles(this.cache, this.prereglage.rayonSecteurs);
    this.fond = new FondGalactique(this.galaxie, this.prereglage.particulesGalaxie);
    this.moteur.sceneFond.add(this.fond.points, this.champ.groupe);
    this.effet = new EffetHyperespace(this.moteur);

    // --- Commandes ---
    this.entrees = new Entrees(canvas);
    this.cameraCarte = new CameraLibre(POSITION_DEPART);
    this.cameraCarte.orienter(90, 0);

    // --- Interface ---
    this.reperes = new Reperes(interfaceJeu);
    this.hud = new Hud(interfaceJeu, tactile);
    this.hud.surVitesse = (crans) => this.entrees.ajouterMolette(crans);
    this.panneau = new PanneauSysteme(interfaceJeu, !tactile && window.innerWidth > 900);
    this.mesures = new PanneauMesures(interfaceJeu, parametres.get('mesures') === '1');
    canvas.addEventListener('click', () => {
      if (!tactile && !this.entrees.sourisCapturee) this.entrees.capturerSouris();
    });
    window.addEventListener('keydown', (e) => this.touche(e));

    this.demarrer();
    this.boucle = new Boucle((dt) => this.image(dt));
    this.boucle.demarrer();
  }

  // ---------------------------------------------------------------- Démarrage

  /** Choisit où le joueur commence : dernier système visité, système demandé, ou étoile de départ. */
  private demarrer(): void {
    const p = this.parametres;
    const effet = Number(p.get('effet'));
    if (p.has('effet') && Number.isFinite(effet)) this.effetForce = effet;

    // « ?pos=x,y,z » : on démarre sur la carte, à cet endroit (sert aux tests).
    const pos = this.lireNombres('pos', 3);
    if (pos) {
      this.cameraCarte.position.x = pos[0]!;
      this.cameraCarte.position.y = pos[1]!;
      this.cameraCarte.position.z = pos[2]!;
      const cap = this.lireNombres('cap', 2);
      if (cap) this.cameraCarte.orienter(cap[0]!, cap[1]!);
      this.champ.toutConstruire(this.cameraCarte.position);
      this.entrerDansLaCarte();
      return;
    }

    // Sinon on démarre dans un système : celui de l'adresse, le dernier visité, ou le plus proche du point de départ.
    let etoile: EtoileGalaxie | null = null;
    for (const texte of [p.get('sys'), this.memoire.dernierSysteme]) {
      const adresse = lireAdresse(texte);
      if (adresse && !etoile) {
        etoile = etoileDuSecteur(this.cache.obtenir(adresse.niveau, adresse.sx, adresse.sy, adresse.sz), adresse.indice);
      }
    }
    if (!etoile) {
      this.champ.toutConstruire(POSITION_DEPART);
      etoile = this.champ.etoileLaPlusProche(POSITION_DEPART);
    }
    if (!etoile) {
      // Ne devrait pas arriver (il y a toujours des étoiles près du départ) : on ouvre la carte.
      this.entrerDansLaCarte();
      return;
    }
    this.chargerSysteme(etoile);
    this.champ.toutConstruire(etoile);
    const corps = Number(p.get('corps'));
    if (p.has('corps') && Number.isInteger(corps) && corps >= 0 && corps < this.vue!.corps.length) {
      this.cameraSysteme.placer(this.vue!, corps);
    }
    this.etat = 'systeme';
    this.definirModeSysteme();
    if (p.get('carte') === '1') this.ouvrirCarte();
  }

  private lireNombres(nom: string, combien: number): number[] | null {
    const texte = this.parametres.get(nom);
    if (!texte) return null;
    const valeurs = texte.split(',').map(Number);
    return valeurs.length === combien && valeurs.every(Number.isFinite) ? valeurs : null;
  }

  // ------------------------------------------------------------------ Actions

  /** Remplace le système affiché par celui de l'étoile donnée. */
  private chargerSysteme(etoile: EtoileGalaxie): void {
    this.vue?.liberer();
    const systeme = genererSysteme(etoile);
    const vue = new VueSysteme(systeme, this.prereglage.nom === 'bas' ? 24 : 48);
    this.moteur.scene.add(vue.groupe);
    this.vue = vue;
    this.etoileCourante = etoile;
    vue.calculerPositions(this.temps);

    // Arrivée : devant une planète océanique s'il y en a une, sinon devant la première planète.
    let arrivee = vue.corps.findIndex((c) => c.corps?.type === 'oceanique' && c.genre === 'planete');
    if (arrivee < 0) arrivee = vue.corps.findIndex((c) => c.genre === 'planete');
    this.cameraSysteme.placer(vue, arrivee);
    this.cameraSysteme.cran = 8;

    this.panneau.definir(vue, (rang) => this.allerVers(rang));
    const adresse = texteAdresse(etoile);
    this.memoire.noterVisite({ adresse, nom: systeme.nom, x: etoile.x, y: etoile.y, z: etoile.z });
    // L'adresse de la page retient le système : recharger la page y ramène.
    this.parametres.set('sys', adresse);
    window.history.replaceState(null, '', `?${this.parametres.toString()}`);
  }

  /** Lance un trajet automatique vers un corps du système. */
  private allerVers(rang: number): void {
    if (this.etat !== 'systeme' || !this.vue || rang < 0 || rang >= this.vue.corps.length) return;
    this.cameraSysteme.allerVers(this.vue, rang);
  }

  private ouvrirCarte(): void {
    if (this.etat !== 'systeme' || !this.etoileCourante) return;
    // La caméra de la carte part de notre étoile, un peu en retrait, dans la même direction.
    const e = this.etoileCourante;
    this.cameraCarte.orientation.copy(this.cameraSysteme.orientation);
    this.tmpV.set(0, 0, 1).applyQuaternion(this.cameraCarte.orientation);
    this.cameraCarte.position.x = e.x + this.tmpV.x * 0.3;
    this.cameraCarte.position.y = e.y + this.tmpV.y * 0.3;
    this.cameraCarte.position.z = e.z + this.tmpV.z * 0.3;
    this.cameraCarte.arreter();
    this.entrerDansLaCarte();
  }

  private entrerDansLaCarte(): void {
    this.etat = 'carte';
    this.etoileVisee = null;
    this.entrees.vider();
    this.hud.definirAide('Carte galactique', [
      ...AIDE_COMMUNE,
      ['Viseur', "pointer une étoile pour la sélectionner (ou la toucher sur écran tactile)"],
      ['Entrée', "sauter vers l'étoile sélectionnée"],
      ['M', 'revenir au système'],
      ['H / F3 / G', 'aide / mesures / changer de graine'],
    ]);
  }

  private fermerCarte(): void {
    if (this.etat !== 'carte' || !this.vue) return;
    this.etat = 'systeme';
    this.entrees.vider();
    this.definirModeSysteme();
  }

  private definirModeSysteme(): void {
    this.hud.definirAide('Dans un système', [
      ...AIDE_COMMUNE,
      ['1 à 9', 'aller vers la planète de ce numéro'],
      ['P', 'liste des planètes (un clic sur une ligne y emmène)'],
      ['O', 'afficher ou masquer les orbites'],
      ['M', 'carte galactique'],
      ['H / F3 / G', 'aide / mesures / changer de graine'],
    ]);
  }

  private lancerSaut(): void {
    if (this.etat !== 'carte' || !this.etoileVisee) return;
    this.saut = { t: 0, cible: this.etoileVisee, charge: false };
    this.etat = 'saut';
  }

  private touche(e: KeyboardEvent): void {
    if (e.repeat || e.target instanceof HTMLInputElement) return;
    switch (e.code) {
      case 'KeyH':
        this.hud.basculerAide();
        break;
      case 'F3':
        this.mesures.basculer();
        break;
      case 'KeyG':
        window.location.search = ''; // retour à l'écran d'accueil
        break;
      case 'KeyM':
        if (this.etat === 'systeme') this.ouvrirCarte();
        else this.fermerCarte();
        break;
      case 'KeyP':
        this.panneau.basculer();
        break;
      case 'KeyO':
        if (this.vue) this.vue.orbitesVisibles = !this.vue.orbitesVisibles;
        break;
      case 'Enter':
      case 'NumpadEnter':
        this.lancerSaut();
        break;
      default: {
        // Chiffres 1 à 9 : aller vers la planète correspondante.
        const chiffre = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
        if (chiffre && this.vue) {
          let numero = 0;
          const rang = this.vue.corps.findIndex((c) => c.genre === 'planete' && ++numero === Number(chiffre[1]));
          this.allerVers(rang);
        }
      }
    }
  }

  // ------------------------------------------------------------ Chaque image

  private image(dt: number): void {
    this.temps += dt;
    const moteur = this.moteur;
    let orientation: THREE.Quaternion;
    let positionGalaxie: PositionDouble;
    let vitesseGalaxie = 0;
    let forceEffet = 0;

    if (this.etat === 'saut' && this.saut) {
      // --- Saut hyperespace : l'effet monte, on change de système, l'effet retombe ---
      const s = this.saut;
      s.t += dt;
      this.entrees.vider();
      if (!s.charge && s.t >= MOMENT_CHANGEMENT) {
        this.chargerSysteme(s.cible);
        this.champ.toutConstruire(s.cible);
        s.charge = true;
      }
      forceEffet = Math.min(1, s.t / 0.9, (DUREE_SAUT - s.t) / 0.9);
      if (s.t >= DUREE_SAUT) {
        this.saut = null;
        this.etat = 'systeme';
        this.definirModeSysteme();
        this.hud.annoncer(`Arrivée dans le système ${this.vue!.systeme.nom}`);
      }
    }

    // Un saut part toujours de la carte : tant que le nouveau système n'est pas chargé, on la voit encore.
    const dansLaCarte = this.etat === 'carte' || (this.saut !== null && !this.saut.charge);
    if (this.etat === 'carte') {
      this.cameraCarte.mettreAJour(dt, this.entrees);
      vitesseGalaxie = this.cameraCarte.vitesseActuelle;
    } else if (this.etat === 'systeme' && this.vue) {
      this.vue.calculerPositions(this.temps);
      this.cameraSysteme.mettreAJour(dt, this.entrees, this.vue);
    } else if (this.vue && !dansLaCarte) {
      this.vue.calculerPositions(this.temps);
      this.cameraSysteme.suivre(this.vue);
    }

    if (dansLaCarte || !this.etoileCourante) {
      orientation = this.cameraCarte.orientation;
      positionGalaxie = this.cameraCarte.position;
      this.champ.etoileExclue = null;
    } else {
      orientation = this.cameraSysteme.orientation;
      positionGalaxie = this.etoileCourante;
      this.champ.etoileExclue = this.etoileCourante;
    }

    if (this.vue) {
      this.vue.groupe.visible = !dansLaCarte;
      if (!dansLaCarte) {
        this.vue.mettreAJour(this.temps, this.cameraSysteme.abs, orientation, moteur.facteurProjection, moteur.rapportPixels);
      }
    }
    this.champ.mettreAJour(positionGalaxie, vitesseGalaxie, moteur.rapportPixels);
    this.fond.mettreAJour(positionGalaxie, moteur);
    moteur.orienter(orientation);
    this.effet.mettreAJour(this.effetForce >= 0 ? this.effetForce : forceEffet, dt);
    moteur.rendre();

    // --- Interface ---
    const enSaut = this.etat === 'saut';
    this.hud.rendreVisible(!enSaut);
    this.panneau.masquer(this.etat !== 'systeme');
    this.reperes.debut();
    if (this.etat === 'carte') {
      this.viser(dt);
      this.poserReperesCarte();
    } else if (this.etat === 'systeme') {
      this.poserReperesSysteme();
    }
    this.reperes.fin();

    // Les textes n'ont pas besoin d'être rafraîchis à chaque image : 5 fois par seconde suffisent.
    this.tempsDepuisTextes += dt;
    if (this.tempsDepuisTextes >= 0.2) {
      this.tempsDepuisTextes = 0;
      this.ecrireTextes();
    }
  }

  // ------------------------------------------------------------------- Carte

  /** Met à jour l'étoile sélectionnée : celle sous le viseur, ou celle que le joueur vient de toucher. */
  private viser(dt: number): void {
    const camera = this.moteur.cameraFond;
    const tape = this.entrees.lireTape();
    let direction: THREE.Vector3 | null = null;
    if (tape) {
      // Rayon qui part de l'œil et passe par le point touché.
      direction = this.tmpDirection
        .set((tape.x / window.innerWidth) * 2 - 1, 1 - (tape.y / window.innerHeight) * 2, 0.5)
        .unproject(camera)
        .normalize();
    } else if (!this.tactile) {
      this.tempsDepuisVisee += dt;
      if (this.tempsDepuisVisee < 0.1) return; // 10 recherches par seconde suffisent
      this.tempsDepuisVisee = 0;
      direction = this.tmpDirection.set(0, 0, -1).applyQuaternion(this.cameraCarte.orientation);
    }
    if (!direction) return;
    const trouvee = this.champ.viser(this.cameraCarte.position, direction, tape ? ANGLE_VISEE * 1.5 : ANGLE_VISEE, this.etoileCourante);
    // Si rien n'est sous le viseur, on garde la sélection précédente.
    if (trouvee && (!this.etoileVisee || texteAdresse(trouvee) !== texteAdresse(this.etoileVisee))) {
      this.etoileVisee = trouvee;
      this.planetesVisees = genererSysteme(trouvee).planetes.length;
    }
    // « ?sauter=1 » (tests automatiques) : saute vers la première étoile sélectionnée.
    if (this.etoileVisee && this.parametres.get('sauter') === '1') {
      this.parametres.delete('sauter');
      this.lancerSaut();
    }
  }

  /** Projette un point (donné par rapport à la caméra) sur l'écran. Renvoie false s'il est derrière ou hors champ. */
  private projeter(x: number, y: number, z: number, camera: THREE.PerspectiveCamera, sortie: { x: number; y: number }): boolean {
    const v = this.tmpV.set(x, y, z);
    const longueur = v.length();
    if (longueur === 0) return false;
    // On ramène le point à distance 1 : la projection reste précise quelle que soit l'échelle.
    v.divideScalar(longueur);
    this.tmpDirection.set(0, 0, -1).applyQuaternion(camera.quaternion);
    if (v.dot(this.tmpDirection) < 0.05) return false;
    v.multiplyScalar(10).project(camera);
    if (Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return false;
    sortie.x = (v.x * 0.5 + 0.5) * window.innerWidth;
    sortie.y = (0.5 - v.y * 0.5) * window.innerHeight;
    return true;
  }

  private readonly ecran = { x: 0, y: 0 };

  private poserReperesCarte(): void {
    const cam = this.cameraCarte.position;
    const camera = this.moteur.cameraFond;
    const ici = this.etoileCourante;
    const adresseIci = ici ? texteAdresse(ici) : '';
    const adresseVisee = this.etoileVisee ? texteAdresse(this.etoileVisee) : '';

    // Systèmes déjà visités (les 60 plus récents, s'ils sont à moins de 2 000 al).
    const visites = this.memoire.systemesVisites;
    for (let i = visites.length - 1; i >= Math.max(0, visites.length - 60); i--) {
      const v = visites[i]!;
      if (v.adresse === adresseIci || v.adresse === adresseVisee) continue;
      const dx = v.x - cam.x;
      const dy = v.y - cam.y;
      const dz = v.z - cam.z;
      if (dx * dx + dy * dy + dz * dz > 4e6) continue;
      if (this.projeter(dx, dy, dz, camera, this.ecran)) this.reperes.poser(this.ecran.x, this.ecran.y, v.nom, 'déjà visité', 'visite');
    }
    if (ici && adresseIci !== adresseVisee && this.projeter(ici.x - cam.x, ici.y - cam.y, ici.z - cam.z, camera, this.ecran)) {
      this.reperes.poser(this.ecran.x, this.ecran.y, 'Vous êtes ici', nomEtoile(ici.graine), 'ici');
    }
    const e = this.etoileVisee;
    if (e && this.projeter(e.x - cam.x, e.y - cam.y, e.z - cam.z, camera, this.ecran)) {
      this.reperes.poser(this.ecran.x, this.ecran.y, nomEtoile(e.graine), '', 'cible');
    }
  }

  // ----------------------------------------------------------------- Système

  private poserReperesSysteme(): void {
    const vue = this.vue;
    if (!vue) return;
    const cam = this.cameraSysteme.abs;
    const camera = this.moteur.camera;
    const hauteur = window.innerHeight;
    const ancre = this.cameraSysteme.ancre;
    for (let i = 0; i < vue.corps.length; i++) {
      const c = vue.corps[i]!;
      const dx = c.abs.x - cam.x;
      const dy = c.abs.y - cam.y;
      const dz = c.abs.z - cam.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      // Assez gros à l'écran : inutile de l'étiqueter, on le voit (son nom est dans le coin de l'écran).
      const rayonPixels = ((c.rayon / distance) * this.moteur.facteurProjection) / this.moteur.rapportPixels;
      if (rayonPixels > Math.min(36, hauteur * 0.22)) continue;
      if (c.genre === 'lune') {
        // Les lunes ne sont étiquetées que si l'on est près de leur planète.
        const parent = vue.corps[c.parent]!;
        const px = parent.abs.x - cam.x;
        const py = parent.abs.y - cam.y;
        const pz = parent.abs.z - cam.z;
        const procheDuParent = Math.sqrt(px * px + py * py + pz * pz) < c.orbite.rayon * 6;
        if (!procheDuParent && ancre !== i) continue;
      }
      if (!this.projeter(dx, dy, dz, camera, this.ecran)) continue;
      this.reperes.poser(this.ecran.x, this.ecran.y, c.nom, distanceMetres(distance - c.rayon), c.genre === 'lune' ? 'lune' : 'corps');
    }
  }

  // ------------------------------------------------------------------ Textes

  private ecrireTextes(): void {
    const hud = this.hud;
    hud.mettreAJour();
    if (this.etat === 'carte') {
      const p = this.cameraCarte.position;
      hud.hautGauche('Carte galactique', this.graine, this.texteGalaxie);
      hud.hautDroite('Étoiles affichées', nombre(this.champ.nombreEtoiles), this.tactile ? '' : 'H : aide · M : retour');
      hud.basGauche(
        'Position (années-lumière)',
        `x ${nombre(p.x, 1)}   y ${nombre(p.y, 1)}   z ${nombre(p.z, 1)}`,
        `vitesse ${vitesseAl(this.cameraCarte.vitesseActuelle)} (max ${vitesseAl(this.cameraCarte.vitesseMax)})`,
      );
      const e = this.etoileVisee;
      if (e) {
        const origine = this.etoileCourante ?? p;
        const d = Math.sqrt((e.x - origine.x) ** 2 + (e.y - origine.y) ** 2 + (e.z - origine.z) ** 2);
        const famille = CLASSES_ETOILES[e.classe]!.nom + (e.binaire ? ', système binaire' : '');
        const planetes = this.planetesVisees === 1 ? '1 planète' : `${this.planetesVisees} planètes`;
        const visite = this.memoire.estVisite(texteAdresse(e)) ? ' · déjà visité' : '';
        hud.fiche('Étoile sélectionnée', nomEtoile(e.graine), `${famille} · ${planetes} · à ${distanceAl(d)}${visite}`);
      } else {
        hud.fiche('Étoile sélectionnée', '—', this.tactile ? 'Touche une étoile pour la sélectionner' : 'Pointe le viseur sur une étoile');
      }
      const boutons = [];
      if (e) boutons.push({ texte: 'Sauter', action: () => this.lancerSaut() });
      if (this.vue) boutons.push({ texte: 'Retour', action: () => this.fermerCarte() });
      hud.definirBoutons(boutons);
    } else if (this.vue) {
      const vue = this.vue;
      const s = vue.systeme;
      const etoiles = s.etoiles.map((e) => CLASSES_ETOILES[e.classe]!.nom.toLowerCase()).join(' + ');
      const planetes = s.planetes.length === 1 ? '1 planète' : `${s.planetes.length} planètes`;
      hud.hautGauche('Système', s.nom, `${etoiles} · ${planetes}`);
      hud.hautDroite('Galaxie', this.graine, this.tactile ? '' : 'H : aide · M : carte · P : planètes');
      const proche = vue.corps[this.cameraSysteme.corpsProche]!;
      hud.basGauche(
        'Corps le plus proche',
        `${proche.nom} · ${proche.description}`,
        `altitude ${distanceMetres(this.cameraSysteme.altitude)} · vitesse ${vitesseMetres(this.cameraSysteme.vitesseActuelle)}`,
      );
      hud.fiche('', '', '');
      hud.definirBoutons([
        { texte: 'Carte', action: () => this.ouvrirCarte() },
        { texte: 'Planètes', action: () => this.panneau.basculer() },
      ]);
      this.panneau.surligner(this.cameraSysteme.corpsProche);
    }

    const info = this.moteur.renderer.info.render;
    this.mesures.mettreAJour({
      imagesParSeconde: this.boucle.imagesParSeconde,
      msParImage: this.boucle.msParImage,
      msPireImage: this.boucle.msPireImage,
      appelsDeDessin: info.calls,
      points: info.points,
      triangles: info.triangles,
      secteursEnMemoire: this.cache.taille,
      qualite: this.prereglage.nom,
      rapportPixels: this.moteur.rapportPixels,
    });
  }

  /** Demande la capture de la souris (appelée juste après le clic sur « Explorer »). */
  capturerSouris(): void {
    if (!this.tactile) this.canvas.click();
  }
}
