// Affichage d'un système solaire : étoiles, planètes, lunes, anneaux,
// ceintures d'astéroïdes et tracé des orbites.
//
// Ce fichier ne décide de rien : il dessine le système décrit par
// src/univers/systeme. À chaque image il calcule où se trouve chaque corps
// (en double précision), puis place les objets 3D par rapport à la caméra.

import * as THREE from 'three';
import { Aleatoire } from '../../maths/aleatoire';
import { CLASSES_ETOILES } from '../../univers/galaxie/etoiles';
import type { DefinitionType } from '../../univers/planetes/types/definition';
import { TYPES_PLANETES } from '../../univers/planetes/types/registre';
import type { Ceinture, Corps, EtoileSysteme, Orbite, Systeme } from '../../univers/systeme/modele';
import { positionOrbite } from '../../univers/systeme/orbites';
import type { PositionDouble } from '../moteur';
import { anneauFragment, corpsSommets, etoileFragment, haloFragment, haloSommets, planeteFragment } from '../shaders';

/** Un corps du système tel que le reste du jeu le voit (étoile, planète ou lune). */
export interface CorpsAffiche {
  nom: string;
  /** Texte court décrivant le corps : « Naine rouge », « Océanique »… */
  description: string;
  genre: 'etoile' | 'planete' | 'lune';
  /** Rang du corps autour duquel il tourne (−1 : le centre du système). */
  parent: number;
  rayon: number;
  orbite: Orbite;
  /** Position par rapport au centre du système (m), recalculée à chaque image. */
  abs: PositionDouble;
  /** Données d'origine. */
  corps: Corps | null;
  etoile: EtoileSysteme | null;
  /** Objets 3D. */
  maille: THREE.Mesh;
  materiau: THREE.ShaderMaterial;
  halo: THREE.Mesh | null;
  anneau: THREE.Mesh | null;
  ligneOrbite: THREE.LineLoop | null;
}

const AXE_X = new THREE.Vector3(1, 0, 0);
const AXE_Y = new THREE.Vector3(0, 1, 0);
const AXE_Z = new THREE.Vector3(0, 0, 1);
const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpP: PositionDouble = { x: 0, y: 0, z: 0 };

/** Cercle de rayon 1 dans le plan horizontal : sert à tracer toutes les orbites. */
function creerCercle(segments: number): THREE.BufferGeometry {
  const points = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points[i * 3] = Math.cos(a);
    points[i * 3 + 2] = Math.sin(a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(points, 3));
  return g;
}

export class VueSysteme {
  readonly groupe = new THREE.Group();
  /** Tous les corps : d'abord les étoiles, puis chaque planète suivie de ses lunes. */
  readonly corps: CorpsAffiche[] = [];
  /** Affiche ou masque le tracé des orbites. */
  orbitesVisibles = true;

  private readonly sphere: THREE.SphereGeometry;
  private readonly cercle = creerCercle(256);
  private readonly carre = new THREE.PlaneGeometry(1, 1);
  private readonly ceintures: { donnees: Ceinture; points: THREE.Points }[] = [];
  private readonly reperes: THREE.Points;
  private readonly aLiberer: { dispose(): void }[] = [];

  constructor(
    readonly systeme: Systeme,
    detailSpheres: number,
  ) {
    this.sphere = new THREE.SphereGeometry(1, detailSpheres * 2, detailSpheres);
    this.aLiberer.push(this.sphere, this.cercle, this.carre);

    for (const etoile of systeme.etoiles) this.ajouterEtoile(etoile);
    for (const planete of systeme.planetes) {
      const rang = this.ajouterPlanete(planete, -1);
      for (const lune of planete.lunes) this.ajouterPlanete(lune, rang);
    }
    for (const ceinture of systeme.ceintures) this.ajouterCeinture(ceinture);

    // Petits points lumineux : ils signalent les corps trop lointains pour
    // apparaître comme des disques (moins d'un pixel).
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.corps.length * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.corps.length * 3), 3));
    const m = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.reperes = new THREE.Points(g, m);
    this.reperes.frustumCulled = false;
    this.groupe.add(this.reperes);
    this.aLiberer.push(g, m);

    this.calculerPositions(0);
  }

  // ---------- Construction ----------

  private ajouterEtoile(etoile: EtoileSysteme): void {
    const couleur = new THREE.Color(etoile.couleur[0], etoile.couleur[1], etoile.couleur[2]);
    const materiau = new THREE.ShaderMaterial({
      vertexShader: corpsSommets,
      fragmentShader: etoileFragment,
      uniforms: { uCouleur: { value: couleur }, uTemps: { value: 0 } },
    });
    const maille = new THREE.Mesh(this.sphere, materiau);
    maille.scale.setScalar(etoile.rayon);
    maille.frustumCulled = false;

    const materiauHalo = new THREE.ShaderMaterial({
      vertexShader: haloSommets,
      fragmentShader: haloFragment,
      uniforms: { uCouleur: { value: couleur }, uIntensite: { value: 1 }, uCoeur: { value: 0.1 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(this.carre, materiauHalo);
    halo.frustumCulled = false;
    halo.renderOrder = 2;
    this.groupe.add(maille, halo);
    this.aLiberer.push(materiau, materiauHalo);

    this.corps.push({
      nom: etoile.nom,
      description: CLASSES_ETOILES[etoile.classe]!.nom,
      genre: 'etoile',
      parent: -1,
      rayon: etoile.rayon,
      orbite: etoile.orbite,
      abs: { x: 0, y: 0, z: 0 },
      corps: null,
      etoile,
      maille,
      materiau,
      halo,
      anneau: null,
      ligneOrbite: null,
    });
  }

  private ajouterPlanete(c: Corps, parent: number): number {
    const def: DefinitionType = TYPES_PLANETES[c.type];
    const etoile = this.systeme.etoiles[0]!;
    // La lumière de l'étoile colore légèrement tout ce qu'elle éclaire.
    const lumiere = new THREE.Color(etoile.couleur[0], etoile.couleur[1], etoile.couleur[2]).lerp(new THREE.Color(1, 1, 1), 0.55);
    const alea = new Aleatoire(c.graine);
    const materiau = new THREE.ShaderMaterial({
      vertexShader: corpsSommets,
      fragmentShader: planeteFragment,
      uniforms: {
        uCouleurBasse: { value: new THREE.Color(...c.couleurBasse) },
        uCouleurMoyenne: { value: new THREE.Color(...c.couleurMoyenne) },
        uCouleurHaute: { value: new THREE.Color(...c.couleurHaute) },
        uCouleurOcean: { value: new THREE.Color(...def.couleurOcean) },
        uCouleurAtmosphere: { value: new THREE.Color(...def.couleurAtmosphere) },
        uCouleurLueur: { value: new THREE.Color(...def.couleurLueur) },
        uCouleurEtoile: { value: lumiere },
        uVersEtoile: { value: new THREE.Vector3(1, 0, 0) },
        uDecalage: { value: new THREE.Vector3(alea.intervalle(0, 60), alea.intervalle(0, 60), alea.intervalle(0, 60)) },
        uBandes: { value: def.aspect === 'bandes' ? 1 : 0 },
        uOcean: { value: def.ocean },
        uAtmosphere: { value: def.atmosphere },
        uNuages: { value: def.nuages },
        uGlace: { value: def.glacePolaire },
        uLueur: { value: def.lueur },
        uTemps: { value: 0 },
      },
    });
    const maille = new THREE.Mesh(this.sphere, materiau);
    maille.scale.setScalar(c.rayon);
    maille.frustumCulled = false;
    this.groupe.add(maille);
    this.aLiberer.push(materiau);

    let anneau: THREE.Mesh | null = null;
    if (c.anneaux) {
      const g = new THREE.RingGeometry(c.anneaux.rayonInterieur, c.anneaux.rayonExterieur, 160, 1);
      const m = new THREE.ShaderMaterial({
        vertexShader: corpsSommets,
        fragmentShader: anneauFragment,
        uniforms: {
          uCouleur: { value: new THREE.Color(...c.anneaux.couleur) },
          uCouleurEtoile: { value: lumiere },
          uVersEtoile: materiau.uniforms.uVersEtoile!,
          uRayonInterieur: { value: c.anneaux.rayonInterieur },
          uRayonExterieur: { value: c.anneaux.rayonExterieur },
          uRayonPlanete: { value: c.rayon },
          uGraine: { value: (c.anneaux.graine % 1000) / 10 },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      anneau = new THREE.Mesh(g, m);
      anneau.frustumCulled = false;
      anneau.renderOrder = 1;
      // L'anneau est dans le plan de l'équateur de la planète (axe incliné).
      anneau.quaternion.setFromAxisAngle(AXE_Z, c.inclinaisonAxe).multiply(tmpQ.setFromAxisAngle(AXE_X, -Math.PI / 2));
      this.groupe.add(anneau);
      this.aLiberer.push(g, m);
    }

    // Tracé de l'orbite : le cercle commun, agrandi et incliné comme l'orbite.
    const materiauLigne = new THREE.LineBasicMaterial({
      color: c.estLune ? 0x5f7f99 : 0x7fd4ff,
      transparent: true,
      opacity: c.estLune ? 0.22 : 0.3,
      depthWrite: false,
    });
    const ligne = new THREE.LineLoop(this.cercle, materiauLigne);
    ligne.scale.setScalar(c.orbite.rayon);
    ligne.quaternion.setFromAxisAngle(AXE_Y, c.orbite.noeud).multiply(tmpQ.setFromAxisAngle(AXE_X, c.orbite.inclinaison));
    ligne.frustumCulled = false;
    this.groupe.add(ligne);
    this.aLiberer.push(materiauLigne);

    this.corps.push({
      nom: c.nom,
      description: def.nom,
      genre: c.estLune ? 'lune' : 'planete',
      parent,
      rayon: c.rayon,
      orbite: c.orbite,
      abs: { x: 0, y: 0, z: 0 },
      corps: c,
      etoile: null,
      maille,
      materiau,
      halo: null,
      anneau,
      ligneOrbite: ligne,
    });
    return this.corps.length - 1;
  }

  private ajouterCeinture(ceinture: Ceinture): void {
    // Vue de loin, une ceinture est une poussière de petits points gris.
    // (Les rochers en 3D autour du joueur viendront avec les objets de surface.)
    const nombre = 5000;
    const alea = new Aleatoire(ceinture.graine);
    const positions = new Float32Array(nombre * 3);
    const epaisseur = (ceinture.rayonExterieur - ceinture.rayonInterieur) * 0.12;
    for (let i = 0; i < nombre; i++) {
      const angle = alea.suivant() * Math.PI * 2;
      // Plus de rochers au milieu de la ceinture que sur ses bords.
      const t = (alea.suivant() + alea.suivant()) / 2;
      const r = ceinture.rayonInterieur + (ceinture.rayonExterieur - ceinture.rayonInterieur) * t;
      positions[i * 3] = r * Math.cos(angle);
      positions[i * 3 + 1] = (alea.suivant() + alea.suivant() - 1) * epaisseur;
      positions[i * 3 + 2] = r * Math.sin(angle);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      color: 0x9a8f80,
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const points = new THREE.Points(g, m);
    points.frustumCulled = false;
    this.groupe.add(points);
    this.aLiberer.push(g, m);
    this.ceintures.push({ donnees: ceinture, points });
  }

  // ---------- À chaque image ----------

  /** Calcule la position de chaque corps à l'instant t (s), par rapport au centre du système. */
  calculerPositions(t: number): void {
    for (const c of this.corps) {
      positionOrbite(c.orbite, t, tmpP);
      if (c.parent >= 0) {
        // Les parents sont toujours rangés avant leurs lunes : leur position est déjà à jour.
        const p = this.corps[c.parent]!.abs;
        c.abs.x = p.x + tmpP.x;
        c.abs.y = p.y + tmpP.y;
        c.abs.z = p.z + tmpP.z;
      } else {
        c.abs.x = tmpP.x;
        c.abs.y = tmpP.y;
        c.abs.z = tmpP.z;
      }
    }
  }

  /**
   * Place tous les objets 3D par rapport à la caméra (origine flottante).
   * @param t          temps du jeu (s)
   * @param camera     position de la caméra par rapport au centre du système (m)
   * @param orientation orientation de la caméra
   * @param facteurProjection pixels par unité de taille à distance 1
   * @param rapportPixels finesse de l'écran
   */
  mettreAJour(t: number, camera: PositionDouble, orientation: THREE.Quaternion, facteurProjection: number, rapportPixels: number): void {
    const etoile = this.corps[0]!;
    const positions = this.reperes.geometry.getAttribute('position') as THREE.BufferAttribute;
    const couleurs = this.reperes.geometry.getAttribute('color') as THREE.BufferAttribute;
    (this.reperes.material as THREE.PointsMaterial).size = 3 * rapportPixels;

    for (let i = 0; i < this.corps.length; i++) {
      const c = this.corps[i]!;
      const x = c.abs.x - camera.x;
      const y = c.abs.y - camera.y;
      const z = c.abs.z - camera.z;
      const distance = Math.sqrt(x * x + y * y + z * z);
      c.maille.position.set(x, y, z);
      c.materiau.uniforms.uTemps!.value = t;
      const rayonPixels = (c.rayon / Math.max(distance, 1)) * facteurProjection;

      if (c.halo) {
        // Étoile : le halo fait toujours face à la caméra et garde une taille
        // minimale à l'écran, pour que l'étoile reste visible de très loin.
        const demiTaille = Math.max(c.rayon * 9, distance * 0.045);
        c.halo.position.set(x, y, z);
        c.halo.quaternion.copy(orientation);
        c.halo.scale.setScalar(demiTaille * 2);
        const m = c.halo.material as THREE.ShaderMaterial;
        m.uniforms.uCoeur!.value = Math.max(c.rayon / demiTaille, 0.015);
        m.uniforms.uIntensite!.value = 1;
      } else {
        // Planète ou lune : rotation sur elle-même autour de son axe incliné.
        const corps = c.corps!;
        const tours = t / corps.dureeJour;
        tmpQ.setFromAxisAngle(AXE_Z, corps.inclinaisonAxe);
        tmpQ2.setFromAxisAngle(AXE_Y, (tours - Math.floor(tours)) * Math.PI * 2);
        c.maille.quaternion.copy(tmpQ).multiply(tmpQ2);
        // Direction de l'étoile principale vue de la planète.
        tmpV.set(etoile.abs.x - c.abs.x, etoile.abs.y - c.abs.y, etoile.abs.z - c.abs.z).normalize();
        (c.materiau.uniforms.uVersEtoile!.value as THREE.Vector3).copy(tmpV);
        if (c.anneau) c.anneau.position.set(x, y, z);
      }

      if (c.ligneOrbite) {
        // Le centre de l'orbite est le parent (ou le centre du système).
        const p = c.parent >= 0 ? this.corps[c.parent]!.abs : null;
        c.ligneOrbite.position.set((p ? p.x : 0) - camera.x, (p ? p.y : 0) - camera.y, (p ? p.z : 0) - camera.z);
        c.ligneOrbite.visible = this.orbitesVisibles;
      }

      // Point lumineux de repérage quand le corps est plus petit qu'un pixel et demi.
      positions.setXYZ(i, x, y, z);
      const eclat = c.halo ? 0 : rayonPixels < 1.5 ? 0.85 : 0;
      const teinte = c.corps ? c.corps.couleurMoyenne : ([1, 1, 1] as const);
      couleurs.setXYZ(i, (0.4 + 0.6 * teinte[0]) * eclat, (0.4 + 0.6 * teinte[1]) * eclat, (0.4 + 0.6 * teinte[2]) * eclat);
    }
    positions.needsUpdate = true;
    couleurs.needsUpdate = true;

    for (const ceinture of this.ceintures) {
      ceinture.points.position.set(-camera.x, -camera.y, -camera.z);
      const tours = t / ceinture.donnees.periode;
      ceinture.points.rotation.y = -(tours - Math.floor(tours)) * Math.PI * 2;
      (ceinture.points.material as THREE.PointsMaterial).size = 1.6 * rapportPixels;
    }
  }

  /** Libère la mémoire de la carte graphique quand on quitte le système. */
  liberer(): void {
    this.groupe.removeFromParent();
    for (const objet of this.aLiberer) objet.dispose();
  }
}
