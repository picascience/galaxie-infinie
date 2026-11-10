// Tests de la génération des systèmes solaires.
import { describe, expect, it } from 'vitest';
import { MAX_LUNES, MAX_PLANETES } from '../src/config/systeme';
import { hacher2 } from '../src/maths/hachage';
import { CLASSES_ETOILES } from '../src/univers/galaxie/etoiles';
import { nomInterdit } from '../src/univers/galaxie/noms';
import { IDS_TYPES, TYPES_PLANETES } from '../src/univers/planetes/types/registre';
import { genererSysteme, type EtoileSource } from '../src/univers/systeme/generer';
import type { Corps } from '../src/univers/systeme/modele';
import { positionOrbite } from '../src/univers/systeme/orbites';

/** Fabrique une étoile de test à partir d'un simple numéro. */
function etoileDeTest(i: number): EtoileSource {
  const classe = i % CLASSES_ETOILES.length;
  const c = CLASSES_ETOILES[classe]!;
  return {
    graine: hacher2(i, 77),
    classe,
    luminosite: (c.luminosite[0] + c.luminosite[1]) / 2,
    temperature: (c.temperature[0] + c.temperature[1]) / 2,
    binaire: i % 3 === 0,
  };
}

describe('systèmes solaires', () => {
  it('le même système est toujours généré à l’identique', () => {
    for (let i = 0; i < 50; i++) {
      expect(JSON.stringify(genererSysteme(etoileDeTest(i)))).toBe(JSON.stringify(genererSysteme(etoileDeTest(i))));
    }
  });

  it('correspond à la valeur de référence (identique sur tout appareil)', () => {
    const s = genererSysteme(etoileDeTest(3));
    const resume = `${s.nom}|${s.etoiles.length}|${s.planetes.map((p) => `${p.type}:${Math.round(p.rayon)}:${p.lunes.length}`).join(',')}|${s.ceintures.length}`;
    expect(resume).toBe(REFERENCE);
  });

  it('respecte les règles : 1 à 10 planètes, orbites croissantes, rien dans l’étoile', () => {
    const vus = new Set<string>();
    let avecAnneaux = 0;
    let avecCeinture = 0;
    for (let i = 0; i < 600; i++) {
      const s = genererSysteme(etoileDeTest(i));
      expect(s.planetes.length).toBeGreaterThanOrEqual(1);
      expect(s.planetes.length).toBeLessThanOrEqual(MAX_PLANETES);
      expect(s.etoiles.length).toBe(i % 3 === 0 ? 2 : 1);
      if (s.ceintures.length > 0) avecCeinture++;
      let precedente = 0;
      for (const p of s.planetes) {
        vus.add(p.type);
        expect(p.orbite.rayon).toBeGreaterThan(precedente);
        expect(p.orbite.rayon).toBeGreaterThan(5 * s.etoiles[0]!.rayon);
        precedente = p.orbite.rayon;
        verifierCorps(p);
        expect(p.lunes.length).toBeLessThanOrEqual(MAX_LUNES);
        if (p.anneaux) {
          avecAnneaux++;
          expect(p.anneaux.rayonInterieur).toBeGreaterThan(p.rayon);
          expect(p.anneaux.rayonExterieur).toBeGreaterThan(p.anneaux.rayonInterieur);
        }
        for (const l of p.lunes) {
          verifierCorps(l);
          expect(TYPES_PLANETES[l.type].lunePossible).toBe(true);
          expect(l.rayon).toBeLessThan(p.rayon);
          expect(l.orbite.rayon).toBeGreaterThan((p.anneaux?.rayonExterieur ?? p.rayon) + l.rayon);
        }
      }
    }
    // Sur 600 systèmes, les 8 types doivent tous apparaître, ainsi que des anneaux et des ceintures.
    expect(vus.size).toBe(IDS_TYPES.length);
    expect(avecAnneaux).toBeGreaterThan(20);
    expect(avecCeinture).toBeGreaterThan(20);
  });

  it('les noms des planètes et des lunes passent le filtre', () => {
    for (let i = 0; i < 200; i++) {
      for (const p of genererSysteme(etoileDeTest(i)).planetes) {
        expect(nomInterdit(p.nom.split(' ')[0]!)).toBe(false);
        expect(p.nom).toMatch(/^\p{Lu}\p{Ll}+ [IVX]+$/u);
      }
    }
  });
});

function verifierCorps(c: Corps): void {
  const def = TYPES_PLANETES[c.type];
  expect(c.rayon).toBeGreaterThan(50e3);
  if (!c.estLune) {
    expect(c.rayon).toBeGreaterThanOrEqual(def.rayonKm[0] * 1000);
    expect(c.rayon).toBeLessThanOrEqual(def.rayonKm[1] * 1000);
  }
  expect(c.gravite).toBeGreaterThan(0);
  expect(c.orbite.periode).toBeGreaterThan(0);
  expect(c.dureeJour).toBeGreaterThan(0);
}

describe('orbites', () => {
  it('un corps reste à distance constante et revient à son point de départ après une période', () => {
    const o = { rayon: 2.5e10, periode: 5000, phase: 1.2, inclinaison: 0.04, noeud: 2.2 };
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    positionOrbite(o, 1234, a);
    positionOrbite(o, 1234 + 3 * o.periode, b);
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)).toBeLessThan(1);
    for (let t = 0; t < 5000; t += 137) {
      positionOrbite(o, t, a);
      expect(Math.abs(Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) - o.rayon)).toBeLessThan(1);
    }
  });
});

const REFERENCE = 'Fakriavlou 4169|2|toxique:890737:0,rocheuse:303156:0,glacee:324600:0,rocheuse:605184:1,cristalline:357345:0,rocheuse:882339:0|0';
