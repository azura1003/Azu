document.addEventListener('DOMContentLoaded', () => {
    const level1Button = document.getElementById('level-1');
    const level2Button = document.getElementById('level-2');
    const level3Button = document.getElementById('level-3');

    // Check if Levels 2 and 3 are unlocked
    const level2Unlocked = localStorage.getItem('level2Unlocked') === 'true';
    const level3Unlocked = localStorage.getItem('level3Unlocked') === 'true';

    if (level2Unlocked) {
        level2Button.disabled = false; // Enable Level 2 button if unlocked
    }

    if (level3Unlocked) {
        level3Button.disabled = false; // Enable Level 3 button if unlocked
    }

    // Start Level 1
    level1Button.addEventListener('click', () => {
        startLevel('app.js'); // Fichier JavaScript pour le Niveau 1
    });

    // Start Level 2
    level2Button.addEventListener('click', () => {
        startLevel('level2.js'); // Fichier JavaScript pour le Niveau 2
    });

    // Start Level 3
    level3Button.addEventListener('click', () => {
        startLevel('level3.js'); // Fichier JavaScript pour le Niveau 3
    });
});

function startLevel(scriptSrc) {
    // Hide the menu and show the canvas
    document.getElementById('level-select').style.display = 'none';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';

    // Load and start the level's game logic
    const script = document.createElement('script');
    script.src = scriptSrc;
    document.body.appendChild(script);
}
