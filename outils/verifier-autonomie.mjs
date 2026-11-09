// Test d'autonomie : vérifie que le site construit (dossier dist/) ne peut
// faire aucun appel réseau.
//   1. La page contient la règle de sécurité qui bloque toute connexion.
//   2. La page ne charge aucun fichier venant d'un autre site.
//   3. Le code livré n'utilise aucune fonction d'accès au réseau.
// Lancé par « npm run verifier » et par GitHub Actions avant chaque mise en ligne.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOSSIER = 'dist';
const erreurs = [];

function lister(dossier) {
  const fichiers = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) fichiers.push(...lister(chemin));
    else fichiers.push(chemin);
  }
  return fichiers;
}

const fichiers = lister(DOSSIER);

// 1 et 2 : la page.
const page = readFileSync(join(DOSSIER, 'index.html'), 'utf8');
if (!/Content-Security-Policy/.test(page) || !/connect-src 'none'/.test(page)) {
  erreurs.push("index.html : la règle de sécurité « connect-src 'none' » est absente.");
}
for (const lien of page.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
  if (/^(?:[a-z]+:)?\/\//i.test(lien[1])) erreurs.push(`index.html : fichier externe « ${lien[1]} ».`);
}

// 3 : le code et les styles.
const INTERDITS = [
  [/\bfetch\s*\(/, 'fetch('],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/sendBeacon/, 'sendBeacon'],
  [/\bimportScripts\b/, 'importScripts'],
  [/\bWebTransport\b/, 'WebTransport'],
  [/RTCPeerConnection/, 'RTCPeerConnection'],
];
// Seules adresses tolérées : des identifiants de formats standard (jamais contactés).
const ADRESSES_TOLEREES = /^https?:\/\/www\.w3\.org\//;

let octets = 0;
for (const fichier of fichiers) {
  octets += statSync(fichier).size;
  if (!/\.(js|css|html)$/.test(fichier)) continue;
  const contenu = readFileSync(fichier, 'utf8');
  for (const [motif, nom] of INTERDITS) {
    if (motif.test(contenu)) erreurs.push(`${fichier} : utilise ${nom}.`);
  }
  for (const adresse of contenu.matchAll(/https?:\/\/[^\s"'`)\\]+/g)) {
    if (!ADRESSES_TOLEREES.test(adresse[0])) erreurs.push(`${fichier} : adresse Internet « ${adresse[0]} ».`);
  }
}

if (erreurs.length > 0) {
  console.error('ÉCHEC du test d’autonomie :');
  for (const e of [...new Set(erreurs)]) console.error('  - ' + e);
  process.exit(1);
}
console.log(`Test d'autonomie réussi : ${fichiers.length} fichiers, ${(octets / 1024).toFixed(0)} Ko, aucun accès réseau.`);
