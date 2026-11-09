// Tests de la génération de la galaxie : même graine = même galaxie.
import { describe, expect, it } from 'vitest';
import { NIVEAUX_SECTEURS, POSITION_DEPART } from '../src/config/echelles';
import { hacher2 } from '../src/maths/hachage';
import { creerParametresGalaxie, densiteBrute, estimerNombreEtoiles } from '../src/univers/galaxie/densite';
import { CLASSES_ETOILES } from '../src/univers/galaxie/etoiles';
import { nomEtoile, nomInterdit } from '../src/univers/galaxie/noms';
import { genererNuageGalactique } from '../src/univers/galaxie/nuage';
import { genererSecteur, type DonneesSecteur } from '../src/univers/galaxie/secteurs';

/** Résume toutes les données d'un secteur en un seul nombre (son « empreinte »). */
function empreinte(s: DonneesSecteur): number {
  let h = s.nombre;
  const ajouter = (tableau: Float32Array | Uint8Array | Uint32Array) => {
    const octets = new Uint8Array(tableau.buffer, tableau.byteOffset, tableau.byteLength);
    for (let i = 0; i < octets.length; i++) h = hacher2(h, octets[i]!);
  };
  ajouter(s.positions);
  ajouter(s.couleurs);
  ajouter(s.luminosites);
  ajouter(s.classes);
  ajouter(s.binaires);
  ajouter(s.graines);
  return h;
}

/** Secteur qui contient la position de départ, pour un niveau donné. */
function secteurDeDepart(niveau: number): [number, number, number] {
  const t = NIVEAUX_SECTEURS[niveau]!.taille;
  return [Math.floor(POSITION_DEPART.x / t), Math.floor(POSITION_DEPART.y / t), Math.floor(POSITION_DEPART.z / t)];
}

describe('paramètres de la galaxie', () => {
  it('découlent entièrement de la graine', () => {
    const a = creerParametresGalaxie('GALAXIE-1');
    const b = creerParametresGalaxie('GALAXIE-1');
    const c = creerParametresGalaxie('GALAXIE-2');
    expect(a).toEqual(b);
    expect(a.graine).not.toBe(c.graine);
    expect(a.nombreBras).toBeGreaterThanOrEqual(2);
    expect(a.nombreBras).toBeLessThanOrEqual(5);
  });
});

describe('secteurs', () => {
  const p = creerParametresGalaxie('GALAXIE-1');

  it('deux calculs du même secteur donnent exactement les mêmes étoiles', () => {
    for (let niveau = 0; niveau < 4; niveau++) {
      const [sx, sy, sz] = secteurDeDepart(niveau);
      expect(empreinte(genererSecteur(p, niveau, sx, sy, sz))).toBe(empreinte(genererSecteur(p, niveau, sx, sy, sz)));
    }
  });

  it('correspond aux valeurs de référence (identiques sur tout appareil)', () => {
    // Empreintes calculées une fois pour la graine « GALAXIE-1 ».
    // Si ce test échoue, c'est que la galaxie a changé : ne modifier ces
    // nombres que si le changement est voulu.
    const obtenu = [0, 1, 2, 3].map((niveau) => {
      const [sx, sy, sz] = secteurDeDepart(niveau);
      const s = genererSecteur(p, niveau, sx, sy, sz);
      return `${s.nombre}:${empreinte(s)}`;
    });
    expect(obtenu).toEqual(REFERENCE);
  });

  it('une autre graine donne d’autres étoiles', () => {
    const autre = creerParametresGalaxie('GALAXIE-2');
    const [sx, sy, sz] = secteurDeDepart(3);
    expect(empreinte(genererSecteur(p, 3, sx, sy, sz))).not.toBe(empreinte(genererSecteur(autre, 3, sx, sy, sz)));
  });

  it('les étoiles restent dans leur secteur et leur famille correspond au niveau', () => {
    for (let niveau = 0; niveau < 4; niveau++) {
      const taille = NIVEAUX_SECTEURS[niveau]!.taille;
      const [sx, sy, sz] = secteurDeDepart(niveau);
      const s = genererSecteur(p, niveau, sx, sy, sz);
      for (let i = 0; i < s.nombre; i++) {
        for (let k = 0; k < 3; k++) {
          expect(s.positions[i * 3 + k]).toBeGreaterThanOrEqual(0);
          expect(s.positions[i * 3 + k]).toBeLessThanOrEqual(taille);
        }
        expect(CLASSES_ETOILES[s.classes[i]!]!.niveau).toBe(niveau);
      }
    }
  });

  it('il n’y a aucune étoile très loin au-dessus du disque', () => {
    expect(genererSecteur(p, 3, 100, 80, 0).nombre).toBe(0);
  });
});

describe('forme de la galaxie', () => {
  const p = creerParametresGalaxie('GALAXIE-1');

  it('contient plusieurs milliards d’étoiles', () => {
    expect(estimerNombreEtoiles(p)).toBeGreaterThan(5e9);
  });

  it('est plus dense au centre qu’au bord, et dans le plan qu’au-dessus', () => {
    expect(densiteBrute(p, 2000, 0, 0)).toBeGreaterThan(densiteBrute(p, 40000, 0, 0));
    expect(densiteBrute(p, 26000, 0, 0)).toBeGreaterThan(densiteBrute(p, 26000, 2000, 0));
    expect(densiteBrute(p, 60000, 0, 0)).toBe(0);
  });

  it('le nuage galactique est reproductible', () => {
    const a = genererNuageGalactique(p, 2000);
    const b = genererNuageGalactique(p, 2000);
    expect(a.nombre).toBe(2000);
    expect(Array.from(a.positions.subarray(0, 300))).toEqual(Array.from(b.positions.subarray(0, 300)));
  });
});

describe('noms', () => {
  it('sont reproductibles, bien formés et passent le filtre', () => {
    for (let i = 0; i < 3000; i++) {
      const nom = nomEtoile(hacher2(i, 5));
      expect(nom).toBe(nomEtoile(hacher2(i, 5)));
      expect(nom).toMatch(/^\p{Lu}\p{Ll}+ \d{4}$/u);
      expect(nomInterdit(nom.split(' ')[0]!)).toBe(false);
    }
  });

  it('le filtre refuse les mots déplacés et les noms de divinités ou de mythologie', () => {
    for (const mot of ['Zeusar', 'Thoria', 'Merdon', 'Venura', 'Satanix']) {
      expect(nomInterdit(mot)).toBe(true);
    }
  });
});

// Valeurs de référence : « nombre d'étoiles : empreinte » pour les 4 niveaux.
const REFERENCE = ['20:3207924201', '67:1145519862', '141:370637290', '409:2441430602'];
