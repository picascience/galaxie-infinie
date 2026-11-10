// Affichage des étoiles proches, une par une.
//
// Pour chacun des 4 niveaux d'étoiles, on garde chargés les secteurs qui
// entourent la caméra. Quand la caméra change de secteur, on reconstruit la
// liste des étoiles de ce niveau (les secteurs déjà calculés sont en mémoire).

import * as THREE from 'three';
import { NIVEAUX_SECTEURS } from '../../config/echelles';
import { etoileDuSecteur, type AdresseEtoile, type CacheSecteurs, type DonneesSecteur, type EtoileGalaxie } from '../../univers/galaxie/secteurs';
import type { PositionDouble } from '../moteur';
import fragment from '../shaders/etoiles.frag.glsl?raw';
import sommets from '../shaders/etoiles.vert.glsl?raw';

/** État d'affichage d'un niveau d'étoiles. */
interface NiveauAffiche {
  /** Numéro du niveau (0 à 3). */
  indice: number;
  taille: number;
  points: THREE.Points;
  materiau: THREE.ShaderMaterial;
  geometrie: THREE.BufferGeometry;
  capacite: number;
  nombre: number;
  /** Secteur « d'ancrage » : celui de la caméra lors de la dernière reconstruction. */
  ax: number;
  ay: number;
  az: number;
  /** Faux tant que le niveau n'a pas été construit, ou après avoir été masqué. */
  aJour: boolean;
  secteurs: DonneesSecteur[];
}

export class ChampEtoiles {
  readonly groupe = new THREE.Group();
  private readonly niveaux: NiveauAffiche[] = [];
  /** Étoile masquée du champ d'étoiles (null : aucune). */
  etoileExclue: EtoileGalaxie | null = null;

  constructor(
    private readonly cache: CacheSecteurs,
    private readonly rayon: number,
  ) {
    NIVEAUX_SECTEURS.forEach(({ taille }, indice) => {
      const materiau = new THREE.ShaderMaterial({
        vertexShader: sommets,
        fragmentShader: fragment,
        uniforms: {
          uRayonVisible: { value: rayon * taille },
          uEchellePixels: { value: 1 },
          uOpacite: { value: 1 },
          uExclue: { value: new THREE.Vector4(0, 0, 0, 0) },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const geometrie = new THREE.BufferGeometry();
      const points = new THREE.Points(geometrie, materiau);
      points.frustumCulled = false;
      points.renderOrder = -1;
      this.groupe.add(points);
      this.niveaux.push({ indice, taille, points, materiau, geometrie, capacite: 0, nombre: 0, ax: 0, ay: 0, az: 0, aJour: false, secteurs: [] });
    });
  }

  /** Nombre total d'étoiles actuellement affichées. */
  get nombreEtoiles(): number {
    let total = 0;
    for (const niveau of this.niveaux) if (niveau.points.visible) total += niveau.nombre;
    return total;
  }

  /**
   * À appeler à chaque image.
   * @param camera   position de la caméra dans la galaxie (al)
   * @param vitesse  vitesse de la caméra (al/s)
   * @param echellePixels finesse de l'écran
   */
  mettreAJour(camera: PositionDouble, vitesse: number, echellePixels: number): void {
    let reconstructionFaite = false;
    for (const niveau of this.niveaux) {
      const t = niveau.taille;
      niveau.materiau.uniforms.uEchellePixels!.value = echellePixels;

      // À très grande vitesse, on traverse des dizaines de secteurs par seconde :
      // inutile de charger des étoiles qu'on n'aurait pas le temps de voir.
      const tropRapide = vitesse > t * 12;
      niveau.points.visible = !tropRapide;
      if (tropRapide) {
        niveau.aJour = false;
        continue;
      }

      const sx = Math.floor(camera.x / t);
      const sy = Math.floor(camera.y / t);
      const sz = Math.floor(camera.z / t);
      const aChangeDeSecteur = sx !== niveau.ax || sy !== niveau.ay || sz !== niveau.az;
      // Une seule reconstruction par image, pour ne jamais bloquer l'affichage.
      if ((!niveau.aJour || aChangeDeSecteur) && !reconstructionFaite) {
        this.reconstruire(niveau, sx, sy, sz);
        reconstructionFaite = true;
      }
      niveau.points.visible = niveau.aJour;

      // Origine flottante : on place le coin du secteur d'ancrage par rapport à la caméra.
      niveau.points.position.set(niveau.ax * t - camera.x, niveau.ay * t - camera.y, niveau.az * t - camera.z);

      // Étoile à ne pas dessiner (celle du système où l'on se trouve).
      const exclue = niveau.materiau.uniforms.uExclue!.value as THREE.Vector4;
      const e = this.etoileExclue;
      if (e && e.niveau === niveau.indice) {
        exclue.set(e.x - niveau.ax * t, e.y - niveau.ay * t, e.z - niveau.az * t, 1);
      } else {
        exclue.w = 0;
      }
    }
  }

  /** Force la construction immédiate de tous les niveaux (au démarrage). */
  toutConstruire(camera: PositionDouble): void {
    for (const niveau of this.niveaux) {
      const t = niveau.taille;
      this.reconstruire(niveau, Math.floor(camera.x / t), Math.floor(camera.y / t), Math.floor(camera.z / t));
    }
  }

  /** Rassemble les étoiles de tous les secteurs autour du secteur (sx, sy, sz). */
  private reconstruire(niveau: NiveauAffiche, sx: number, sy: number, sz: number): void {
    const r = this.rayon;
    const t = niveau.taille;
    const secteurs: DonneesSecteur[] = [];
    let total = 0;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const secteur = this.cache.obtenir(niveau.indice, sx + dx, sy + dy, sz + dz);
          if (secteur.nombre > 0) {
            secteurs.push(secteur);
            total += secteur.nombre;
          }
        }
      }
    }

    // On agrandit les tableaux seulement quand c'est nécessaire.
    // (Y compris la toute première fois, même s'il n'y a aucune étoile ici.)
    if (total > niveau.capacite || !niveau.geometrie.getAttribute('position')) {
      niveau.capacite = Math.ceil(total * 1.3) + 256;
      niveau.geometrie.dispose();
      niveau.geometrie = new THREE.BufferGeometry();
      niveau.geometrie.setAttribute('position', new THREE.BufferAttribute(new Float32Array(niveau.capacite * 3), 3));
      niveau.geometrie.setAttribute('couleur', new THREE.BufferAttribute(new Float32Array(niveau.capacite * 3), 3));
      niveau.geometrie.setAttribute('luminosite', new THREE.BufferAttribute(new Float32Array(niveau.capacite), 1));
      niveau.points.geometry = niveau.geometrie;
    }

    const positions = niveau.geometrie.getAttribute('position') as THREE.BufferAttribute;
    const couleurs = niveau.geometrie.getAttribute('couleur') as THREE.BufferAttribute;
    const luminosites = niveau.geometrie.getAttribute('luminosite') as THREE.BufferAttribute;
    const tabPositions = positions.array as Float32Array;
    let n = 0;
    for (const s of secteurs) {
      // Décalage du secteur par rapport au secteur d'ancrage (al).
      const ox = (s.sx - sx) * t;
      const oy = (s.sy - sy) * t;
      const oz = (s.sz - sz) * t;
      for (let i = 0; i < s.nombre; i++) {
        tabPositions[(n + i) * 3] = ox + s.positions[i * 3]!;
        tabPositions[(n + i) * 3 + 1] = oy + s.positions[i * 3 + 1]!;
        tabPositions[(n + i) * 3 + 2] = oz + s.positions[i * 3 + 2]!;
      }
      (couleurs.array as Float32Array).set(s.couleurs, n * 3);
      (luminosites.array as Float32Array).set(s.luminosites, n);
      n += s.nombre;
    }
    positions.needsUpdate = true;
    couleurs.needsUpdate = true;
    luminosites.needsUpdate = true;
    niveau.geometrie.setDrawRange(0, total);

    niveau.nombre = total;
    niveau.secteurs = secteurs;
    niveau.ax = sx;
    niveau.ay = sy;
    niveau.az = sz;
    niveau.aJour = true;
  }

  /** Cherche l'étoile la plus proche de la caméra parmi les étoiles chargées. */
  etoileLaPlusProche(camera: PositionDouble): EtoileGalaxie | null {
    let meilleurD2 = Infinity;
    let meilleurSecteur: DonneesSecteur | null = null;
    let meilleurIndice = -1;
    for (const niveau of this.niveaux) {
      if (!niveau.aJour) continue;
      const t = niveau.taille;
      for (const s of niveau.secteurs) {
        // On ne fouille que les secteurs voisins immédiats de la caméra.
        if (Math.abs(s.sx - niveau.ax) > 1 || Math.abs(s.sy - niveau.ay) > 1 || Math.abs(s.sz - niveau.az) > 1) continue;
        const ox = s.sx * t - camera.x;
        const oy = s.sy * t - camera.y;
        const oz = s.sz * t - camera.z;
        for (let i = 0; i < s.nombre; i++) {
          const dx = ox + s.positions[i * 3]!;
          const dy = oy + s.positions[i * 3 + 1]!;
          const dz = oz + s.positions[i * 3 + 2]!;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < meilleurD2) {
            meilleurD2 = d2;
            meilleurSecteur = s;
            meilleurIndice = i;
          }
        }
      }
    }
    return meilleurSecteur ? etoileDuSecteur(meilleurSecteur, meilleurIndice) : null;
  }

  /**
   * Cherche l'étoile visible la plus proche d'une direction de visée.
   * @param camera    position de la caméra (al)
   * @param direction direction visée (vecteur de longueur 1)
   * @param angleMax  écart maximal toléré (radians)
   * @param ignoree   étoile à ne jamais renvoyer (celle où l'on se trouve)
   */
  viser(camera: PositionDouble, direction: THREE.Vector3, angleMax: number, ignoree: AdresseEtoile | null): EtoileGalaxie | null {
    const cosMin = Math.cos(angleMax);
    let meilleurCos = cosMin;
    let meilleurSecteur: DonneesSecteur | null = null;
    let meilleurIndice = -1;
    for (const niveau of this.niveaux) {
      if (!niveau.aJour || !niveau.points.visible) continue;
      const t = niveau.taille;
      const porteeMax = this.rayon * t;
      for (const s of niveau.secteurs) {
        const ox = s.sx * t - camera.x;
        const oy = s.sy * t - camera.y;
        const oz = s.sz * t - camera.z;
        const memeSecteur = ignoree !== null && ignoree.niveau === s.niveau && ignoree.sx === s.sx && ignoree.sy === s.sy && ignoree.sz === s.sz;
        for (let i = 0; i < s.nombre; i++) {
          const dx = ox + s.positions[i * 3]!;
          const dy = oy + s.positions[i * 3 + 1]!;
          const dz = oz + s.positions[i * 3 + 2]!;
          const scalaire = dx * direction.x + dy * direction.y + dz * direction.z;
          if (scalaire <= 0) continue; // derrière la caméra
          const d2 = dx * dx + dy * dy + dz * dz;
          // Test rapide sans racine carrée : cos² > cosMin².
          if (scalaire * scalaire < meilleurCos * meilleurCos * d2) continue;
          // On ne vise que les étoiles réellement visibles à l'écran (assez de lumière reçue, pas en bordure de zone).
          if (s.luminosites[i]! < 3.2e-6 * d2 || d2 > porteeMax * porteeMax * 0.72) continue;
          if (memeSecteur && ignoree!.indice === i) continue;
          meilleurCos = scalaire / Math.sqrt(d2);
          meilleurSecteur = s;
          meilleurIndice = i;
        }
      }
    }
    return meilleurSecteur ? etoileDuSecteur(meilleurSecteur, meilleurIndice) : null;
  }
}
