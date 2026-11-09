// Configuration de Vite : l'outil qui lance le jeu en développement
// et qui fabrique le site final (dossier dist/).
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Règle de sécurité « aucun réseau ».
 * Elle est ajoutée dans la page au moment de la construction du site.
 * Le navigateur refuse alors toute connexion sortante (connect-src 'none')
 * et tout fichier qui ne vient pas du site lui-même.
 * (En développement on ne l'ajoute pas : Vite a besoin d'une connexion
 * locale pour recharger la page quand on modifie le code.)
 */
const REGLE_AUCUN_RESEAU = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function regleAucunReseau(): Plugin {
  return {
    name: 'galaxie-regle-aucun-reseau',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- REGLE_AUCUN_RESEAU -->',
        `<meta http-equiv="Content-Security-Policy" content="${REGLE_AUCUN_RESEAU}">`,
      );
    },
  };
}

export default defineConfig({
  // Chemins relatifs : le site marche quel que soit son adresse sur GitHub Pages.
  base: './',
  plugins: [regleAucunReseau()],
  build: {
    target: 'es2022',
    // Le « polyfill » de préchargement de Vite utilise fetch() : on le retire
    // pour que le site ne fasse réellement aucun appel réseau.
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1500,
  },
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
