// Lecture du clavier, de la souris et de l'écran tactile.
// Ce fichier ne décide de rien : il note seulement ce que fait le joueur.
// C'est la caméra (puis le vaisseau, au jour 5) qui interprète ces informations.
//
// Les touches sont repérées par leur POSITION sur le clavier (event.code) et
// non par la lettre gravée dessus : « KeyW » est la touche Z d'un clavier
// AZERTY et la touche W d'un clavier QWERTY. Le jeu marche donc partout.

/** Rayon du manche tactile (pixels) : au-delà, la poussée est maximale. */
const RAYON_MANCHE = 70;

export class Entrees {
  /** Vrai quand la souris est « capturée » par le jeu (curseur masqué). */
  sourisCapturee = false;
  /** Manche tactile gauche : x vers la droite, y vers le bas, chacun entre −1 et 1. */
  readonly manche = { x: 0, y: 0 };

  private readonly touches = new Set<string>();
  private regardX = 0;
  private regardY = 0;
  private molette = 0;
  private boutonEnfonce = false;
  private doigtManche: number | null = null;
  private doigtRegard: number | null = null;
  private origineMancheX = 0;
  private origineMancheY = 0;
  private dernierRegardX = 0;
  private dernierRegardY = 0;
  // Détection d'une « tape » : un toucher bref, sans glisser.
  private debutTape = 0;
  private departTapeX = 0;
  private departTapeY = 0;
  private tape: { x: number; y: number } | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return; // on tape dans un champ de texte
      this.touches.add(e.code);
      // Ces touches font défiler ou quitter la page : on l'empêche pendant le jeu.
      if (e.code === 'Space' || e.code === 'F3' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.touches.delete(e.code));
    // Si la fenêtre perd le focus, on relâche tout (sinon une touche resterait « collée »).
    window.addEventListener('blur', () => this.touches.clear());

    // --- Souris ---
    canvas.addEventListener('mousedown', () => {
      this.boutonEnfonce = true;
    });
    window.addEventListener('mouseup', () => {
      this.boutonEnfonce = false;
    });
    window.addEventListener('mousemove', (e) => {
      // On tourne la tête si la souris est capturée, ou si un bouton est maintenu.
      if (this.sourisCapturee || this.boutonEnfonce) {
        this.regardX += e.movementX;
        this.regardY += e.movementY;
      }
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.molette += e.deltaY < 0 ? 1 : -1;
      },
      { passive: false },
    );
    document.addEventListener('pointerlockchange', () => {
      this.sourisCapturee = document.pointerLockElement === canvas;
    });

    // --- Écran tactile : moitié gauche = manche pour avancer, moitié droite = regard ---
    canvas.addEventListener('touchstart', (e) => this.debutToucher(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.mouvementToucher(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.finToucher(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.finToucher(e), { passive: false });
  }

  /** Demande au navigateur de capturer la souris (doit suivre un clic du joueur). */
  capturerSouris(): void {
    // Sur mobile la fonction n'existe pas ; certains navigateurs renvoient une promesse.
    const resultat = this.canvas.requestPointerLock?.() as unknown;
    if (resultat instanceof Promise) resultat.catch(() => undefined);
  }

  /** Vrai si la touche (repérée par sa position) est enfoncée. */
  appuyee(code: string): boolean {
    return this.touches.has(code);
  }

  /** Vaut 1 si la touche est enfoncée, 0 sinon (pratique pour les calculs). */
  valeur(code: string): number {
    return this.touches.has(code) ? 1 : 0;
  }

  /** Renvoie le mouvement de regard accumulé (pixels), puis le remet à zéro. */
  lireRegard(): { x: number; y: number } {
    const r = { x: this.regardX, y: this.regardY };
    this.regardX = 0;
    this.regardY = 0;
    return r;
  }

  /** Renvoie le nombre de crans de molette accumulés (+ = vers l'avant), puis le remet à zéro. */
  lireMolette(): number {
    const m = this.molette;
    this.molette = 0;
    return m;
  }

  /** Renvoie la dernière tape sur l'écran (position en pixels), puis l'oublie. */
  lireTape(): { x: number; y: number } | null {
    const t = this.tape;
    this.tape = null;
    return t;
  }

  /** Oublie tout ce qui a été accumulé (utile quand le jeu ignore les commandes un moment). */
  vider(): void {
    this.regardX = 0;
    this.regardY = 0;
    this.molette = 0;
    this.tape = null;
  }

  /** Simule des crans de molette (boutons « + » et « − » de l'écran tactile). */
  ajouterMolette(crans: number): void {
    this.molette += crans;
  }

  private debutToucher(e: TouchEvent): void {
    e.preventDefault();
    for (const doigt of Array.from(e.changedTouches)) {
      if (doigt.clientX < window.innerWidth / 2 && this.doigtManche === null) {
        this.doigtManche = doigt.identifier;
        this.origineMancheX = doigt.clientX;
        this.origineMancheY = doigt.clientY;
      } else if (this.doigtRegard === null) {
        this.doigtRegard = doigt.identifier;
        this.dernierRegardX = doigt.clientX;
        this.dernierRegardY = doigt.clientY;
      }
      this.debutTape = performance.now();
      this.departTapeX = doigt.clientX;
      this.departTapeY = doigt.clientY;
    }
  }

  private mouvementToucher(e: TouchEvent): void {
    e.preventDefault();
    for (const doigt of Array.from(e.changedTouches)) {
      if (doigt.identifier === this.doigtManche) {
        const dx = (doigt.clientX - this.origineMancheX) / RAYON_MANCHE;
        const dy = (doigt.clientY - this.origineMancheY) / RAYON_MANCHE;
        this.manche.x = Math.max(-1, Math.min(1, dx));
        this.manche.y = Math.max(-1, Math.min(1, dy));
      } else if (doigt.identifier === this.doigtRegard) {
        // Le doigt est moins précis qu'une souris : on amplifie un peu.
        this.regardX += (doigt.clientX - this.dernierRegardX) * 1.6;
        this.regardY += (doigt.clientY - this.dernierRegardY) * 1.6;
        this.dernierRegardX = doigt.clientX;
        this.dernierRegardY = doigt.clientY;
      }
    }
  }

  private finToucher(e: TouchEvent): void {
    e.preventDefault();
    for (const doigt of Array.from(e.changedTouches)) {
      const glisse = Math.abs(doigt.clientX - this.departTapeX) + Math.abs(doigt.clientY - this.departTapeY);
      if (performance.now() - this.debutTape < 300 && glisse < 12) this.tape = { x: doigt.clientX, y: doigt.clientY };
      if (doigt.identifier === this.doigtManche) {
        this.doigtManche = null;
        this.manche.x = 0;
        this.manche.y = 0;
      } else if (doigt.identifier === this.doigtRegard) {
        this.doigtRegard = null;
      }
    }
  }
}
