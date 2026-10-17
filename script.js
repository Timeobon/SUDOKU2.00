// =====================================================
//  SUDOKU - script.js
//  À relier au HTML avec : <script src="script.js"></script>
//  (juste avant </body>)
// =====================================================

// ---------- 1. Les éléments de la page ----------
const cases = document.querySelectorAll("#grille input");        // les 81 cases (de 0 à 80)
const boutonsChiffres = document.querySelectorAll("#chiffres button");
const boutonReset = document.getElementById("reset");
const boutonIndice = document.getElementById("indice");
const texteChances = document.getElementById("chances");         // le texte "Chances : 3/3"

// ---------- 2. Réglages et mémoire du jeu ----------
const CASES_A_VIDER = 45;   // plus ce nombre est grand, plus c'est difficile
const CHANCES_MAX = 3;      // nombre d'erreurs autorisées avant de perdre
let solution = [];          // la grille complète et correcte (81 chiffres)
let indicesRestants = 3;    // nombre d'indices par partie
let chancesRestantes = 3;   // chances qu'il reste au joueur
let partieTerminee = false; // true quand on a perdu
let caseActive = null;      // la dernière case sur laquelle on a cliqué

// ---------- 3. Les règles du sudoku ----------

// Est-ce qu'on peut mettre ce chiffre dans cette case ?
// (pas déjà dans la ligne, la colonne ou le bloc 3x3)
function peutPlacer(grille, index, chiffre) {
  const ligne = Math.floor(index / 9);
  const colonne = index % 9;

  for (let i = 0; i < 9; i++) {
    if (grille[ligne * 9 + i] === chiffre) return false;     // même ligne
    if (grille[i * 9 + colonne] === chiffre) return false;   // même colonne
  }

  const debutLigne = ligne - (ligne % 3);
  const debutColonne = colonne - (colonne % 3);
  for (let l = 0; l < 3; l++) {
    for (let c = 0; c < 3; c++) {
      if (grille[(debutLigne + l) * 9 + debutColonne + c] === chiffre) return false; // même bloc
    }
  }
  return true;
}

// Mélange un tableau au hasard
function melanger(tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
  return tableau;
}

// ---------- 4. Création d'une grille ----------

// Remplit toute la grille au hasard en respectant les règles
function remplir(grille) {
  const index = grille.indexOf(0);          // première case vide
  if (index === -1) return true;            // plus de case vide : terminé

  for (const chiffre of melanger([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (peutPlacer(grille, index, chiffre)) {
      grille[index] = chiffre;
      if (remplir(grille)) return true;
      grille[index] = 0;                    // impasse : on revient en arrière
    }
  }
  return false;
}

// Compte les solutions possibles (on s'arrête à "limite")
// Sert à vérifier qu'une grille n'a qu'une seule solution
function compterSolutions(grille, limite) {
  const index = grille.indexOf(0);
  if (index === -1) return 1;

  let total = 0;
  for (let chiffre = 1; chiffre <= 9; chiffre++) {
    if (peutPlacer(grille, index, chiffre)) {
      grille[index] = chiffre;
      total += compterSolutions(grille, limite - total);
      grille[index] = 0;
      if (total >= limite) break;
    }
  }
  return total;
}

// Affiche la grille de départ dans les cases
function afficher(depart) {
  cases.forEach((c, i) => {
    c.value = depart[i] === 0 ? "" : depart[i];
    c.readOnly = depart[i] !== 0;                    // chiffres de départ non modifiables
    c.classList.remove("indice", "active", "faux");
  });
}

// ---------- 5. Nouvelle partie (aussi utilisée par Reset) ----------
function nouvellePartie() {
  // 1. grille complète au hasard
  solution = new Array(81).fill(0);
  remplir(solution);

  // 2. on retire des chiffres, un par un, dans un ordre aléatoire
  const depart = [...solution];
  const ordre = melanger([...Array(81).keys()]);
  let retirees = 0;

  for (const index of ordre) {
    if (retirees >= CASES_A_VIDER) break;
    const sauvegarde = depart[index];
    depart[index] = 0;
    if (compterSolutions([...depart], 2) === 1) {
      retirees++;                // la grille garde une solution unique : on garde ce retrait
    } else {
      depart[index] = sauvegarde; // sinon on remet le chiffre
    }
  }

  // 3. affichage et remise à zéro
  afficher(depart);
  caseActive = null;
  partieTerminee = false;
  indicesRestants = 3;
  chancesRestantes = CHANCES_MAX;
  majBoutonIndice();
  majChances();
  majBoutonsChiffres();
}

// ---------- 6. Chances et erreurs ----------

// Désactive (grise) le bouton d'un chiffre quand ses 9 exemplaires sont bien posés
function majBoutonsChiffres() {
  boutonsChiffres.forEach((bouton) => {
    const chiffre = bouton.textContent;
    let total = 0;
    cases.forEach((c, i) => {
      if (c.value === chiffre && c.value === String(solution[i])) total++;   // seulement les bons chiffres
    });
    bouton.disabled = total === 9;
  });
}

// Met à jour le texte au-dessus du tableau
function majChances() {
  texteChances.textContent = "Chances : " + chancesRestantes + "/" + CHANCES_MAX;
}

// Appelée à chaque mauvais chiffre
function perdreUneChance() {
  chancesRestantes--;
  majChances();

  if (chancesRestantes === 0) {
    partieTerminee = true;
    cases.forEach((c) => (c.readOnly = true));      // on bloque toute la grille
    majBoutonIndice();                              // et l'indice
    setTimeout(() => alert("Perdu ! Appuie sur ↺ pour rejouer."), 50);
  }
}

// Écrit un chiffre dans une case et vérifie s'il est bon
function placer(c, chiffre) {
  if (partieTerminee || c.readOnly) return;

  c.value = chiffre;
  majBoutonsChiffres();
  const index = [...cases].indexOf(c);

  if (chiffre === String(solution[index])) {
    c.classList.remove("faux");                     // bon chiffre
    verifierVictoire();
  } else {
    c.classList.add("faux");                        // mauvais chiffre : case en rouge
    perdreUneChance();
  }
}

// Vide une case
function effacer(c) {
  if (partieTerminee || c.readOnly) return;
  c.value = "";
  c.classList.remove("faux");
  majBoutonsChiffres();
}

// ---------- 7. Sélection d'une case et clavier ----------
cases.forEach((c) => {
  // Quand on clique dans une case, on la mémorise
  c.addEventListener("focus", () => {
    if (caseActive) caseActive.classList.remove("active");
    caseActive = c;
    c.classList.add("active");
  });

  // Clavier d'ordinateur : chiffres 1 à 9 pour écrire, Retour/Suppr pour effacer
  c.addEventListener("keydown", (e) => {
    if (e.key >= "1" && e.key <= "9" && e.key.length === 1) {
      e.preventDefault();
      placer(c, e.key);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      effacer(c);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();                           // bloque les lettres et le 0
    }
  });

  // Clavier de téléphone : on récupère le chiffre tapé
  c.addEventListener("input", () => {
    const chiffre = c.value.replace(/[^1-9]/g, "").slice(0, 1);
    if (chiffre === "") {
      effacer(c);
    } else {
      placer(c, chiffre);
    }
  });
});

// ---------- 8. Boutons chiffres ----------
boutonsChiffres.forEach((bouton) => {
  bouton.addEventListener("click", () => {
    if (!caseActive) return;                        // aucune case choisie
    placer(caseActive, bouton.textContent);
  });
});

// ---------- 9. Bouton Reset ----------
boutonReset.addEventListener("click", nouvellePartie);

// ---------- 10. Bouton Indice (3 par partie) ----------
function majBoutonIndice() {
  boutonIndice.disabled = indicesRestants === 0 || partieTerminee;
  boutonIndice.title = "Indice (" + indicesRestants + " restant" + (indicesRestants > 1 ? "s" : "") + ")";
}

boutonIndice.addEventListener("click", () => {
  if (indicesRestants <= 0 || partieTerminee) return;

  // Cases vides ou fausses : celles qui ne contiennent pas le bon chiffre
  const aTrouver = [];
  cases.forEach((c, i) => {
    if (c.value !== String(solution[i])) aTrouver.push(i);
  });
  if (aTrouver.length === 0) return;

  // On en choisit une au hasard et on y écrit le bon chiffre
  const i = aTrouver[Math.floor(Math.random() * aTrouver.length)];
  cases[i].value = solution[i];
  cases[i].readOnly = true;
  cases[i].classList.remove("faux");
  cases[i].classList.add("indice");
  majBoutonsChiffres();

  indicesRestants--;
  majBoutonIndice();
  verifierVictoire();
});

// ---------- 11. Victoire ----------
function verifierVictoire() {
  const gagne = [...cases].every((c, i) => c.value === String(solution[i]));
  if (gagne) {
    setTimeout(() => alert("Bravo, tu as gagné !"), 50);
  }
}

// ---------- 12. Lancement au chargement de la page ----------
nouvellePartie();