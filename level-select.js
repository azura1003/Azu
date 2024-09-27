document.addEventListener('DOMContentLoaded', () => {
    const level1Button = document.getElementById('level1-button');
    const level2Button = document.getElementById('level2-button');
    const level3Button = document.getElementById('level3-button');
    const level4Button = document.getElementById('level4-button');
    const resetButton = document.getElementById('reset-game');
    const finalScoreDisplay = document.getElementById('final-score');

    // Initialize score to 0 if not present
    let finalScore = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
    finalScoreDisplay.textContent = `Score Final: ${finalScore}`;

    // Unlock all levels by default
    let unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels')) || [1, 2, 3, 4];
    localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels)); // Ensure all levels are unlocked

    // Enable buttons for unlocked levels
    for (let level = 1; level <= 4; level++) {
        const levelButton = document.getElementById(`level${level}-button`);
        levelButton.disabled = !unlockedLevels.includes(level);
    }

    // Add event listeners for level buttons
    level1Button.addEventListener('click', () => {
        startLevel('app.js'); // Start level 1
    });

    level2Button.addEventListener('click', () => {
        startLevel('level2.js'); // Start level 2
    });

    level3Button.addEventListener('click', () => {
        startLevel('level3.js'); // Start level 3
    });

    level4Button.addEventListener('click', () => {
        startLevel('level4.js'); // Start level 4
    });

    // Reset game: Clear localStorage, reset score to 0, and reload page with all levels unlocked
    resetButton.addEventListener('click', () => {
        localStorage.clear();
        localStorage.setItem('score', '0'); // Reset score to 0
        localStorage.setItem('unlockedLevels', JSON.stringify([1, 2, 3, 4])); // Unlock all levels
        window.location.reload();
    });
});

function startLevel(scriptSrc) {
    // Hide the level selection menu and show the canvas
    document.getElementById('level-select').style.display = 'none';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';

    // Load and start the level script
    const script = document.createElement('script');
    script.src = scriptSrc;
    document.body.appendChild(script);
}
