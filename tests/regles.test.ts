// Tests des règles du projet, vérifiées directement dans le code source :
//   1. aucun appel réseau nulle part ;
//   2. pas de hasard non reproductible ;
//   3. dans la génération de l'univers, uniquement des fonctions « identiques partout ».
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function listerFichiers(dossier: string): string[] {
  const resultat: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) resultat.push(...listerFichiers(chemin));
    else if (/\.(ts|glsl|css|html)$/.test(nom)) resultat.push(chemin);
  }
  return resultat;
}

/** Retire les commentaires pour ne tester que le code réel. */
function sansCommentaires(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const fichiers = [...listerFichiers('src'), 'index.html'];

describe('règle « aucun réseau »', () => {
  const interdits = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/, /sendBeacon/, /https?:\/\//, /importScripts/];
  it('aucun fichier du jeu ne contient d’appel réseau ni d’adresse Internet', () => {
    for (const fichier of fichiers) {
      const code = sansCommentaires(readFileSync(fichier, 'utf8'));
      for (const motif of interdits) {
        expect(motif.test(code), `${fichier} contient ${motif}`).toBe(false);
      }
    }
  });
});

describe('règle « déterminisme »', () => {
  it('Math.random n’est utilisé nulle part', () => {
    for (const fichier of fichiers) {
      const code = sansCommentaires(readFileSync(fichier, 'utf8'));
      expect(/Math\.random/.test(code), `${fichier} utilise Math.random`).toBe(false);
    }
  });

  it('src/maths et src/univers n’utilisent pas les fonctions Math imprécises', () => {
    const motif = /Math\.(exp|log|log2|log10|pow|sin|cos|tan|atan|atan2|asin|acos|sinh|cosh|tanh|cbrt|hypot|expm1|log1p)\b/;
    for (const fichier of fichiers) {
      if (!/src[\\/](maths|univers)[\\/]/.test(fichier)) continue;
      const code = sansCommentaires(readFileSync(fichier, 'utf8'));
      expect(motif.test(code), `${fichier} utilise une fonction Math interdite`).toBe(false);
    }
  });

  it('src/maths et src/univers n’importent jamais Three.js', () => {
    for (const fichier of fichiers) {
      if (!/src[\\/](maths|univers)[\\/]/.test(fichier)) continue;
      const code = readFileSync(fichier, 'utf8');
      expect(/from\s+['"]three/.test(code), `${fichier} importe Three.js`).toBe(false);
    }
  });
});
