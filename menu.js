document.addEventListener('DOMContentLoaded', () => {
    const level1Button = document.getElementById('level-1');
    const level2Button = document.getElementById('level-2');

    // Check if Level 2 is unlocked
    const level2Unlocked = localStorage.getItem('level2Unlocked') === 'true';

    if (level2Unlocked) {
        level2Button.disabled = false; // Enable Level 2 button if unlocked
    }

    // Start Level 1
    level1Button.addEventListener('click', () => {
        startLevel1();
    });

    // Start Level 2
    level2Button.addEventListener('click', () => {
        startLevel2();
    });
});

function startLevel1() {
    // Hide the menu and show the canvas
    document.getElementById('level-select').style.display = 'none';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';

    // Load and start Level 1 game logic
    const script = document.createElement('script');
    script.src = 'app.js'; // Assuming `app.js` is your Level 1 script
    document.body.appendChild(script);
}

function startLevel2() {
    // Hide the menu and show the canvas
    document.getElementById('level-select').style.display = 'none';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';

    // Load and start Level 2 game logic
    const script = document.createElement('script');
    script.src = 'level2.js'; // Assuming `level2.js` is your Level 2 script
    document.body.appendChild(script);
}