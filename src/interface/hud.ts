// Affichage de bord (HUD) : les informations posées par-dessus l'image 3D.
// Tout est en HTML simple. Ce fichier crée les éléments une fois ; le jeu
// ne fait ensuite que changer leurs textes selon le mode (système ou carte).

export interface BoutonHud {
  texte: string;
  action: () => void;
}

export class Hud {
  private readonly racine: HTMLDivElement;
  private readonly zones: Record<string, HTMLElement> = {};
  private readonly boutons: HTMLElement;
  private readonly aide: HTMLElement;
  private readonly message: HTMLElement;
  private finMessage = 0;
  private signatureBoutons = '';

  /** Appelée quand le joueur touche un bouton de vitesse (+1 ou −1 cran). */
  surVitesse: (crans: number) => void = () => undefined;

  constructor(parent: HTMLElement, tactile: boolean) {
    this.racine = document.createElement('div');
    this.racine.className = 'hud';
    this.racine.innerHTML = `
      <div class="viseur"></div>
      <div class="haut-gauche">
        <div class="titre" data-r="hg-titre"></div>
        <div class="valeur" data-r="hg-valeur"></div>
        <div class="discret" data-r="hg-detail"></div>
      </div>
      <div class="haut-droite">
        <div class="titre" data-r="hd-titre"></div>
        <div class="valeur" data-r="hd-valeur"></div>
        <div class="discret" data-r="hd-detail"></div>
      </div>
      <div class="bas-gauche">
        <div class="titre" data-r="bg-titre"></div>
        <div class="valeur" data-r="bg-ligne1"></div>
        <div class="valeur" data-r="bg-ligne2"></div>
      </div>
      <div class="bas-centre" data-r="fiche">
        <div class="titre" data-r="fiche-titre"></div>
        <div class="etoile-nom" data-r="fiche-nom"></div>
        <div class="discret" data-r="fiche-detail"></div>
      </div>
      <div class="message cache" data-r="message"></div>
      <div class="panneau aide cache" data-r="aide"></div>
      <div class="boutons" data-r="boutons"></div>
      <div class="tactile ${tactile ? '' : 'cache'}">
        <button type="button" data-v="1" aria-label="Plus vite">+</button>
        <button type="button" data-v="-1" aria-label="Moins vite">−</button>
      </div>`;
    parent.appendChild(this.racine);
    for (const element of Array.from(this.racine.querySelectorAll<HTMLElement>('[data-r]'))) {
      this.zones[element.dataset.r!] = element;
    }
    this.boutons = this.zones['boutons']!;
    this.aide = this.zones['aide']!;
    this.message = this.zones['message']!;
    for (const bouton of Array.from(this.racine.querySelectorAll<HTMLButtonElement>('.tactile button'))) {
      bouton.addEventListener('click', () => this.surVitesse(Number(bouton.dataset.v)));
    }
  }

  /** Change le texte d'une zone (seulement s'il a changé, pour ne pas fatiguer le navigateur). */
  private ecrire(zone: string, texte: string): void {
    const element = this.zones[zone]!;
    if (element.textContent !== texte) element.textContent = texte;
  }

  hautGauche(titre: string, valeur: string, detail: string): void {
    this.ecrire('hg-titre', titre);
    this.ecrire('hg-valeur', valeur);
    this.ecrire('hg-detail', detail);
  }

  hautDroite(titre: string, valeur: string, detail: string): void {
    this.ecrire('hd-titre', titre);
    this.ecrire('hd-valeur', valeur);
    this.ecrire('hd-detail', detail);
  }

  basGauche(titre: string, ligne1: string, ligne2: string): void {
    this.ecrire('bg-titre', titre);
    this.ecrire('bg-ligne1', ligne1);
    this.ecrire('bg-ligne2', ligne2);
  }

  /** Fiche du bas de l'écran (étoile visée, par exemple). Un titre vide la masque. */
  fiche(titre: string, nom: string, detail: string): void {
    this.zones['fiche']!.classList.toggle('cache', titre === '');
    this.ecrire('fiche-titre', titre);
    this.ecrire('fiche-nom', nom);
    this.ecrire('fiche-detail', detail);
  }

  /** Définit les boutons cliquables (utiles surtout sur écran tactile). */
  definirBoutons(liste: readonly BoutonHud[]): void {
    const signature = liste.map((b) => b.texte).join('|');
    if (signature === this.signatureBoutons) return;
    this.signatureBoutons = signature;
    this.boutons.innerHTML = '';
    for (const b of liste) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = b.texte;
      bouton.addEventListener('click', (e) => {
        e.stopPropagation();
        b.action();
      });
      this.boutons.appendChild(bouton);
    }
  }

  /** Définit le contenu du rappel des commandes : liste de [touche, action]. */
  definirAide(titre: string, lignes: readonly (readonly [string, string])[]): void {
    this.aide.innerHTML = '';
    const h = document.createElement('h2');
    h.textContent = titre;
    const table = document.createElement('table');
    for (const [touche, action] of lignes) {
      const tr = table.insertRow();
      tr.insertCell().textContent = touche;
      tr.insertCell().textContent = action;
    }
    this.aide.append(h, table);
  }

  basculerAide(): void {
    this.aide.classList.toggle('cache');
  }

  /** Affiche un court message au centre de l'écran pendant quelques secondes. */
  annoncer(texte: string, secondes = 3.5): void {
    this.message.textContent = texte;
    this.message.classList.remove('cache');
    this.finMessage = performance.now() + secondes * 1000;
  }

  /** À appeler régulièrement : efface le message quand son temps est écoulé. */
  mettreAJour(): void {
    if (this.finMessage > 0 && performance.now() > this.finMessage) {
      this.message.classList.add('cache');
      this.finMessage = 0;
    }
  }

  /** Masque ou affiche tout le HUD (pendant le saut hyperespace). */
  rendreVisible(visible: boolean): void {
    this.racine.classList.toggle('efface', !visible);
  }
}
