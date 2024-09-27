document.addEventListener('DOMContentLoaded', () => {
    const level1Button = document.getElementById('level1-button');
    const level2Button = document.getElementById('level2-button');
    const level3Button = document.getElementById('level3-button');
    const level4Button = document.getElementById('level4-button');

    // Débloquer tous les niveaux par défaut
    let unlockedLevels = [1, 2, 3, 4]; // Tous les niveaux sont débloqués

    // Activer les boutons de niveau
    for (let level = 1; level <= 4; level++) {
        const levelButton = document.getElementById(`level${level}-button`);
        levelButton.disabled = !unlockedLevels.includes(level);
    }

    // Gestion des clics sur les boutons de niveau
    level1Button.addEventListener('click', () => {
        startLevel('app.js'); // Fichier JavaScript pour le Niveau 1
    });

    level2Button.addEventListener('click', () => {
        startLevel('level2.js'); // Fichier JavaScript pour le Niveau 2
    });

    level3Button.addEventListener('click', () => {
        startLevel('level3.js'); // Fichier JavaScript pour le Niveau 3
    });

    level4Button.addEventListener('click', () => {
        startLevel('level4.js'); // Fichier JavaScript pour le Niveau 4
    });
});

function startLevel(scriptSrc) {
    // Masquer le menu et afficher le canvas
    document.getElementById('level-select').style.display = 'none';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';

    // Charger et démarrer la logique du niveau
    const script = document.createElement('script');
    script.src = scriptSrc;
    document.body.appendChild(script);
}
