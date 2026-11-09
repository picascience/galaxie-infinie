// La boucle de jeu : elle appelle la fonction `image` avant chaque
// rafraîchissement de l'écran (60 fois par seconde sur la plupart des écrans)
// et mesure au passage la fluidité.

export class Boucle {
  /** Images par seconde, moyennées sur une demi-seconde. */
  imagesParSeconde = 0;
  /** Durée moyenne d'une image (millisecondes). */
  msParImage = 0;
  /** Durée de l'image la plus lente de la dernière demi-seconde (millisecondes). */
  msPireImage = 0;

  private precedent = 0;
  private cumul = 0;
  private compteur = 0;
  private pire = 0;
  private enMarche = false;

  /**
   * @param image fonction appelée à chaque image ; `dt` = temps écoulé depuis
   *              l'image précédente, en secondes.
   */
  constructor(private readonly image: (dt: number) => void) {}

  demarrer(): void {
    if (this.enMarche) return;
    this.enMarche = true;
    this.precedent = performance.now();
    requestAnimationFrame(this.tour);
  }

  private readonly tour = (maintenant: number): void => {
    if (!this.enMarche) return;
    const ecart = maintenant - this.precedent;
    this.precedent = maintenant;

    // Mesures de fluidité.
    this.cumul += ecart;
    this.compteur++;
    if (ecart > this.pire) this.pire = ecart;
    if (this.cumul >= 500) {
      this.msParImage = this.cumul / this.compteur;
      this.imagesParSeconde = 1000 / this.msParImage;
      this.msPireImage = this.pire;
      this.cumul = 0;
      this.compteur = 0;
      this.pire = 0;
    }

    // Si l'onglet a été mis en pause, on évite un bond énorme : dt plafonné à 0,1 s.
    this.image(Math.min(ecart / 1000, 0.1));
    requestAnimationFrame(this.tour);
  };
}
