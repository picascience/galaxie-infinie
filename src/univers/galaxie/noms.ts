// Noms des étoiles : des syllabes inventées, assemblées à partir de la
// graine de l'étoile. Aucun nom réel : ni personne, ni mythologie, ni marque.

import { FRAGMENTS_INTERDITS } from '../../config/motsInterdits';
import { Aleatoire } from '../../maths/aleatoire';
import { hacher2 } from '../../maths/hachage';

const DEBUTS = ['b', 'd', 'f', 'g', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v', 'z', 'br', 'dr', 'kr', 'tr', 'vl', 'sk', 'th', 'sh', 'ch', ''];
const VOYELLES = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o', 'ia', 'eo', 'ou', 'ae'];
const FINS = ['', '', '', 'n', 'r', 'l', 's', 'x', 'th', 'm'];

/** Vrai si le nom contient un fragment interdit. */
export function nomInterdit(nom: string): boolean {
  const simple = nom.toLowerCase();
  for (const fragment of FRAGMENTS_INTERDITS) {
    if (simple.includes(fragment)) return true;
  }
  return false;
}

function fabriquerNom(alea: Aleatoire): string {
  const syllabes = alea.entier(2, 3);
  let nom = '';
  for (let i = 0; i < syllabes; i++) {
    nom += alea.choisir(DEBUTS) + alea.choisir(VOYELLES);
  }
  nom += alea.choisir(FINS);
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

/**
 * Nom d'une étoile à partir de sa graine, par exemple « Velmora 4821 ».
 * Le numéro (4 chiffres) joue le rôle de numéro de catalogue.
 */
export function nomEtoile(graineEtoile: number): string {
  // Si un nom est refusé par le filtre, on en fabrique un autre (essai suivant).
  for (let essai = 0; essai < 50; essai++) {
    const alea = new Aleatoire(hacher2(graineEtoile, 7000 + essai));
    const nom = fabriquerNom(alea);
    if (nom.length >= 4 && !nomInterdit(nom)) {
      const numero = 1000 + (hacher2(graineEtoile, 99) % 9000);
      return `${nom} ${numero}`;
    }
  }
  // Ne devrait jamais arriver ; nom neutre de secours.
  return `Étoile ${graineEtoile % 100000}`;
}
