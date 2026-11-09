// Tests des briques mathématiques : hachage, hasard à graine, fonctions « identiques partout ».
import { describe, expect, it } from 'vitest';
import { Aleatoire } from '../src/maths/aleatoire';
import { bruit3, bruitFractal } from '../src/maths/bruit';
import { atan2, cos, exp, ln, sin } from '../src/maths/fonctions';
import { hacher2, hacher3, hacher5, hacherTexte } from '../src/maths/hachage';

describe('hachage', () => {
  it('donne toujours les mêmes valeurs (valeurs de référence)', () => {
    // Si ces nombres changent, toutes les galaxies changent : ce test doit rester vert.
    expect(hacherTexte('GALAXIE-1')).toBe(1383061564);
    expect(hacher2(1, 2)).toBe(1684792619);
    expect(hacher3(-5, 0, 123456)).toBe(3729297744);
    expect(hacher5(1, 2, 3, 4, 5)).toBe(525730603);
  });

  it('change complètement quand une entrée change d’un cran', () => {
    expect(hacher3(10, 20, 30)).not.toBe(hacher3(10, 20, 31));
    expect(hacher3(10, 20, 30)).not.toBe(hacher3(20, 10, 30));
  });
});

describe('aléatoire à graine', () => {
  it('redonne la même suite pour la même graine', () => {
    const a = new Aleatoire(42);
    const b = new Aleatoire(42);
    for (let i = 0; i < 100; i++) expect(a.suivant()).toBe(b.suivant());
  });

  it('reste dans [0, 1[ et se répartit à peu près uniformément', () => {
    const alea = new Aleatoire(7);
    let somme = 0;
    for (let i = 0; i < 20000; i++) {
      const v = alea.suivant();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      somme += v;
    }
    expect(somme / 20000).toBeCloseTo(0.5, 1);
  });
});

describe('fonctions identiques partout', () => {
  it('exp, ln, cos, sin et atan2 sont précises à mieux que 1e-8', () => {
    for (let i = -400; i <= 400; i++) {
      const x = i * 0.0731;
      expect(Math.abs(exp(x) - Math.exp(x)) / Math.exp(x)).toBeLessThan(1e-8);
      expect(Math.abs(cos(x * 3) - Math.cos(x * 3))).toBeLessThan(1e-8);
      expect(Math.abs(sin(x * 3) - Math.sin(x * 3))).toBeLessThan(1e-8);
    }
    for (let i = 1; i <= 2000; i++) {
      const x = i * i * 0.0137;
      expect(Math.abs(ln(x) - Math.log(x))).toBeLessThan(1e-8);
    }
    for (let i = -20; i <= 20; i++) {
      for (let j = -20; j <= 20; j++) {
        if (i === 0 && j === 0) continue;
        expect(Math.abs(atan2(i * 0.37, j * 0.91) - Math.atan2(i * 0.37, j * 0.91))).toBeLessThan(1e-8);
      }
    }
  });
});

describe('bruit', () => {
  it('est déterministe, continu et borné', () => {
    expect(bruit3(5, 1.25, 2.5, 3.75)).toBe(bruit3(5, 1.25, 2.5, 3.75));
    expect(bruit3(5, 1.25, 2.5, 3.75)).not.toBe(bruit3(6, 1.25, 2.5, 3.75));
    let max = 0;
    for (let i = 0; i < 5000; i++) {
      const v = bruitFractal(3, i * 0.137, i * 0.071, i * 0.213, 5);
      max = Math.max(max, Math.abs(v));
      // Continuité : un tout petit déplacement change très peu la valeur.
      const voisin = bruitFractal(3, i * 0.137 + 1e-4, i * 0.071, i * 0.213, 5);
      expect(Math.abs(v - voisin)).toBeLessThan(0.01);
    }
    expect(max).toBeLessThan(1.5);
    expect(max).toBeGreaterThan(0.2);
  });
});
