// Écran d'accueil : le joueur choisit sa graine puis lance l'exploration.
// Le clic sur « Explorer » sert aussi d'autorisation au navigateur pour
// capturer la souris.

import { GRAINE_PAR_DEFAUT } from '../config/echelles';

/** Longueur maximale d'une graine. */
const LONGUEUR_MAX = 32;

/** Nettoie une graine tapée par le joueur (espaces en trop, longueur). */
export function nettoyerGraine(texte: string | null): string {
  const propre = (texte ?? '').trim().slice(0, LONGUEUR_MAX);
  return propre.length > 0 ? propre : GRAINE_PAR_DEFAUT;
}

/**
 * Affiche l'écran d'accueil.
 * @param graineInitiale graine proposée dans le champ
 * @param tactile        vrai sur téléphone ou tablette (le rappel des commandes change)
 * @param demarrer       appelée avec la graine choisie quand le joueur valide
 */
export function afficherAccueil(
  parent: HTMLElement,
  graineInitiale: string,
  tactile: boolean,
  demarrer: (graine: string) => void,
): void {
  const ecran = document.createElement('div');
  ecran.className = 'accueil';
  const commandes = tactile
    ? 'Pouce gauche : avancer · pouce droit : regarder · boutons + et − : vitesse'
    : 'Z Q S D : se déplacer · souris : regarder · molette : vitesse · H : aide';
  ecran.innerHTML = `
    <form class="accueil-cadre">
      <h1>Galaxie Infinie</h1>
      <p class="sous-titre">Des milliards d'étoiles, calculées à partir d'une graine.</p>
      <label for="graine">Graine de la galaxie</label>
      <input id="graine" type="text" maxlength="${LONGUEUR_MAX}" autocomplete="off" autocapitalize="characters" spellcheck="false" />
      <button class="bouton" type="submit">Explorer</button>
      <p class="note">
        La même graine donne toujours la même galaxie, sur tous les appareils.<br />
        ${commandes}
      </p>
    </form>`;
  parent.appendChild(ecran);

  const champ = ecran.querySelector('input') as HTMLInputElement;
  champ.value = graineInitiale;
  (ecran.querySelector('form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    ecran.remove();
    demarrer(nettoyerGraine(champ.value));
  });
}
