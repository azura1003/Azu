const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const missileImg = new Image();
const bossImg = new Image();
const metalImg = new Image();

bgImg.src = './img/usa.png';
starImg.src = './img/static-star-level3.png';
missileImg.src = './img/poussieres-violet.png';
bossImg.src = './img/concurrents-protection.png';
metalImg.src = './img/metal.png';

let gamePlaying = false;
let gameOver = false;
let pause = false;
let starWidth = 51 * 1.2;
let starHeight = 36 * 2.0;
let starX, starY;
let missiles = [];
let lastMissileTime = 0;
let boss = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    directionX: 1,
    directionY: 1,
    health: 100, // Santé initiale du boss
};
let damageText = [];
let metalPlates = [
    { x: canvas.width / 2 - 50, y: 450, width: 80, height: 30 }, // Plaque de métal gauche
    { x: canvas.width / 2 + 130, y: 500, width: 80, height: 30 }  // Plaque de métal droite
];
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;

const speed = 2.0;

const resizeGame = () => {
    canvas.width = 431;
    canvas.height = 768;
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

// Fonction pour tirer des missiles aléatoires et multidirectionnels
const fireMissile = () => {
    const missileX = starX + starWidth / 2 - 10;
    const missileY = starY;
    missiles.push({ x: missileX, y: missileY, direction: Math.random() * 2 - 1 });

    if (Math.random() < 0.3) {
        const directions = [-1, -0.5, 0, 0.5, 1];
        directions.forEach(direction => {
            missiles.push({ x: missileX, y: missileY, direction });
        });
    }
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.y -= 3;
        missile.x += (missile.direction || 0) * 2;
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);

        if (missile.x > canvas.width || missile.x < 0 || missile.y < 0 || missile.y > canvas.height) {
            missiles.splice(index, 1);
        } else if (
            missile.x < boss.x + boss.width &&
            missile.x + 20 > boss.x &&
            missile.y < boss.y + boss.height &&
            missile.y + 20 > boss.y
        ) {
            missiles.splice(index, 1);
            boss.health -= 2; // Réduit la santé du boss de 2 pour chaque impact
            showDamageText("-2 HP"); // Affiche les dégâts reçus
        }
    });
};

const showDamageText = (text) => {
    damageText.push({ x: boss.x + boss.width / 2, y: boss.y, opacity: 1.0, text: text });
};

const updateDamageText = () => {
    damageText.forEach((text, index) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${text.opacity})`;
        ctx.font = "bold 20px Arial";
        ctx.fillText(text.text, text.x, text.y);
        text.y -= 1;
        text.opacity -= 0.02;
        if (text.opacity <= 0) {
            damageText.splice(index, 1);
        }
    });
};

const drawBossHealthBar = () => {
    const barWidth = 100;
    const barHeight = 10;
    const barX = boss.x;
    const barY = boss.y - 20;
    const healthPercentage = boss.health / 100;

    // Contour de la jauge de santé
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Remplissage vert de la jauge de santé
    ctx.fillStyle = 'green';
    ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
};

const updateBoss = () => {
    boss.x += boss.directionX * 2;
    boss.y += boss.directionY * 1;

    if (boss.x < 0 || boss.x + boss.width > canvas.width) {
        boss.directionX *= -1;
    }
    if (boss.y < 0 || boss.y + boss.height > canvas.height / 4) {
        boss.directionY *= -1;
    }

    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
    drawBossHealthBar(); // Dessine la jauge de santé
};

const drawMetalPlates = () => {
    metalPlates.forEach(plate => {
        ctx.drawImage(metalImg, plate.x, plate.y, plate.width, plate.height);
    });
};

// Rendu du jeu
const render = () => {
    if (pause) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    drawMetalPlates(); // Dessine les plaques de métal
    ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

    if (gamePlaying && !gameOver) {
        if (performance.now() - lastMissileTime > 800) {
            fireMissile();
            lastMissileTime = performance.now();
        }

        updateMissiles();
        updateBoss();
        updateDamageText();

        ctx.fillStyle = 'white';
        ctx.fillText(`Level 4`, 10, 50);
        ctx.fillText(`Score: ${score}`, 10, 90);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText('Cliquez pour commencer', 90, 535);
        ctx.font = "bold 30px courier";
    }

    window.requestAnimationFrame(render);
};

bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);
};

window.addEventListener('resize', resizeGame);

canvas.addEventListener('mousemove', (e) => {
    if (gamePlaying && !gameOver) {
        starX = e.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = e.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gamePlaying && !gameOver) {
        const touch = e.touches[0];
        starX = touch.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = touch.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

document.addEventListener('keydown', (e) => {
    if (!gamePlaying || gameOver) return;
    switch (e.key) {
        case 'ArrowUp':
            starY -= 10;
            break;
        case 'ArrowDown':
            starY += 10;
            break;
        case 'ArrowLeft':
            starX -= 10;
            break;
        case 'ArrowRight':
            starX += 10;
            break;
        default:
            break;
    }
});

document.addEventListener('click', () => {
    if (!gamePlaying && !gameOver) {
        gamePlaying = true;
        gameOver = false;
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);
        missiles = [];
        damageText = [];
        score = 0;
    }
});
