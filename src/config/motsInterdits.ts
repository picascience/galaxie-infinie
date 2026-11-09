// Fragments de mots qu'un nom généré ne doit jamais contenir.
// Les noms sont fabriqués par assemblage de syllabes : un hasard malheureux
// pourrait former un mot grossier, ou le nom d'une divinité, d'une figure
// mythologique ou d'une personne. Tout nom qui contient l'un de ces
// fragments est rejeté et remplacé par un autre.
// (La comparaison se fait en minuscules, sans accents.)

export const FRAGMENTS_INTERDITS: readonly string[] = [
  // Grossièretés et mots déplacés (français et anglais)
  'con', 'cul', 'pute', 'put', 'merd', 'bite', 'nique', 'salo', 'encul', 'chier', 'pisse',
  'fuck', 'fuk', 'shit', 'dick', 'cock', 'cunt', 'slut', 'anus', 'anal', 'sex', 'porn',
  'nazi', 'kill', 'mort', 'tuer', 'viol', 'rape', 'negr', 'nig', 'fag', 'pede', 'gay',
  'ass', 'tit', 'pis', 'cac', 'pet', 'vag', 'pen', 'bit', 'zob', 'kak',
  // Divinités, figures religieuses ou mythologiques
  'dieu', 'god', 'deus', 'dea', 'allah', 'ilah', 'rab', 'yahv', 'jehov', 'christ', 'jesu',
  'isa', 'mari', 'mose', 'mous', 'boud', 'budd', 'brahm', 'vishn', 'shiv', 'kali', 'krish',
  'zeus', 'hera', 'ares', 'hade', 'apol', 'athen', 'herm', 'odin', 'thor', 'loki', 'frey',
  'isis', 'osir', 'horu', 'anub', 'seth', 'baal', 'ishtar', 'mard', 'lilith', 'eden',
  'jupit', 'satur', 'nept', 'plut', 'venu', 'mars', 'mercur', 'uran', 'titan', 'atla',
  'satan', 'diab', 'demon', 'luci', 'iblis', 'djinn', 'jinn', 'ange', 'angel', 'saint', 'sant',
  'idol', 'totem', 'zodia', 'astro', 'theo', 'deo', 'div',
];
