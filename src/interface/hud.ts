// Affichage de bord (HUD) : les informations posées par-dessus l'image 3D.
// Tout est en HTML simple ; ce fichier crée les éléments une fois, puis
// ne fait que changer leur texte.

import type { InfoEtoile } from '../rendu/espace/champEtoiles';
import type { PositionDouble } from '../rendu/moteur';

/** Écrit un nombre « à la française » : 26 000,5 */
function nombre(valeur: number, decimales = 0): string {
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

/** Écrit une vitesse en années-lumière par seconde, avec une précision adaptée. */
function vitesse(v: number): string {
  if (v < 1) return `${nombre(v, 2)} al/s`;
  if (v < 100) return `${nombre(v, 1)} al/s`;
  return `${nombre(v)} al/s`;
}

/** Écrit une distance en années-lumière. */
function distance(d: number): string {
  return d < 100 ? `${nombre(d, 1)} al` : `${nombre(d)} al`;
}

export interface EtatHud {
  position: PositionDouble;
  vitesse: number;
  vitesseMax: number;
  etoilesAffichees: number;
  etoileProche: InfoEtoile | null;
}

export class Hud {
  /** Appelée quand le joueur touche un bouton de vitesse (+1 ou −1 cran). */
  surVitesse: (crans: number) => void = () => undefined;

  private readonly racine: HTMLDivElement;
  private readonly position: HTMLElement;
  private readonly allure: HTMLElement;
  private readonly etoiles: HTMLElement;
  private readonly proche: HTMLElement;
  private readonly aide: HTMLElement;

  constructor(parent: HTMLElement, graine: string, nombreBras: number, totalEtoiles: number, tactile: boolean) {
    this.racine = document.createElement('div');
    this.racine.className = 'hud';
    const milliards = nombre(totalEtoiles / 1e9, 1);
    this.racine.innerHTML = `
      <div class="viseur"></div>
      <div class="haut-gauche">
        <div class="titre">Galaxie</div>
        <div class="valeur" data-r="graine"></div>
        <div class="discret">${nombreBras} bras spiraux · environ ${milliards} milliards d'étoiles</div>
      </div>
      <div class="haut-droite">
        <div class="titre">Étoiles affichées</div>
        <div class="valeur" data-r="etoiles">0</div>
        <div class="discret">${tactile ? '' : 'H : aide · F3 : mesures'}</div>
      </div>
      <div class="bas-gauche">
        <div class="titre">Position (années-lumière)</div>
        <div class="valeur" data-r="position"></div>
        <div class="valeur" data-r="allure"></div>
      </div>
      <div class="bas-centre">
        <div class="titre">Étoile la plus proche</div>
        <div data-r="proche"></div>
      </div>
      <div class="panneau aide cache" data-r="aide">
        <h2>Commandes</h2>
        <table>
          <tr><td>Z Q S D</td><td>avancer, reculer, aller à gauche ou à droite (W A S D sur clavier QWERTY)</td></tr>
          <tr><td>Espace / C</td><td>monter / descendre</td></tr>
          <tr><td>A / E</td><td>pencher à gauche / à droite</td></tr>
          <tr><td>Souris</td><td>regarder (clic pour capturer la souris, Échap pour la libérer)</td></tr>
          <tr><td>Molette</td><td>régler la vitesse</td></tr>
          <tr><td>Maj</td><td>vitesse × 10</td></tr>
          <tr><td>H</td><td>afficher ou masquer cette aide</td></tr>
          <tr><td>F3</td><td>panneau de mesures</td></tr>
          <tr><td>G</td><td>changer de graine</td></tr>
        </table>
      </div>
      <div class="tactile ${tactile ? '' : 'cache'}">
        <button type="button" data-v="1" aria-label="Plus vite">+</button>
        <button type="button" data-v="-1" aria-label="Moins vite">−</button>
      </div>`;
    parent.appendChild(this.racine);

    const repere = (nom: string) => this.racine.querySelector(`[data-r="${nom}"]`) as HTMLElement;
    repere('graine').textContent = graine; // textContent : la graine est affichée telle quelle, jamais interprétée
    this.position = repere('position');
    this.allure = repere('allure');
    this.etoiles = repere('etoiles');
    this.proche = repere('proche');
    this.aide = repere('aide');

    for (const bouton of Array.from(this.racine.querySelectorAll<HTMLButtonElement>('.tactile button'))) {
      bouton.addEventListener('click', () => this.surVitesse(Number(bouton.dataset.v)));
    }
  }

  /** Affiche ou masque le rappel des commandes. */
  basculerAide(): void {
    this.aide.classList.toggle('cache');
  }

  /** Met à jour les textes (appelée quelques fois par seconde, pas à chaque image). */
  mettreAJour(etat: EtatHud): void {
    const p = etat.position;
    const centre = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    this.position.textContent = `x ${nombre(p.x, 1)}   y ${nombre(p.y, 1)}   z ${nombre(p.z, 1)}`;
    this.allure.textContent = `centre à ${distance(centre)} · vitesse ${vitesse(etat.vitesse)} (max ${vitesse(etat.vitesseMax)})`;
    this.etoiles.textContent = nombre(etat.etoilesAffichees);

    const e = etat.etoileProche;
    if (e) {
      const famille = e.binaire ? `${e.famille}, système binaire` : e.famille;
      this.proche.innerHTML = '';
      const nom = document.createElement('div');
      nom.className = 'etoile-nom';
      nom.textContent = e.nom;
      const detail = document.createElement('div');
      detail.className = 'discret';
      detail.textContent = `${famille} · ${distance(e.distance)}`;
      this.proche.append(nom, detail);
    } else {
      this.proche.textContent = '—';
    }
  }
}
