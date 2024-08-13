const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImgLevel2 = new Image();
const starImgLevel2 = new Image();
const missileImg = new Image();
const bossMissileImg = new Image();

bgImgLevel2.src = './img/azura-bg-2.png'; // Nouveau background pour le niveau 2
starImgLevel2.src = './img/new-star.png'; // Nouveau visuel pour l'étoile
missileImg.src = './img/poussieres.png'; // Image des missiles de l'étoile
bossMissileImg.src = './img/poussieresnoir.png'; // Image des missiles du boss

let gamePlaying = false;
let gameOver = false;
let pause = false;
let boss = null;
let bossMissiles = [];
let missiles = [];
let lastMissileTime = 0;
let lastBossMissileTime = 0;

let initialSize, starWidth, starHeight;
let starX, starY;

const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        initialSize = [canvas.width / 25, canvas.height / 37.5];
    } else {
        canvas.width = 431;
        canvas.height = 768;

        initialSize = [51 * 0.4, 36 * 0.4];
    }
    starWidth = initialSize[0];
    starHeight = initialSize[1];
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

const fireMissile = () => {
    const missileX = starX + starWidth;
    const missileY = starY + starHeight / 2 - 10;
    missiles.push({ x: missileX, y: missileY });

    // 50% chance to fire in multiple directions
    if (Math.random() < 0.5) {
        const directions = [-1, -0.5, 0, 0.5, 1];
        directions.forEach(direction => {
            missiles.push({ x: missileX, y: missileY, direction });
        });
    }
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.x += 4;
        missile.y += missile.direction ? missile.direction * 2 : 0;
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);

        if (missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
            missiles.splice(index, 1);
        }
    });
};

const initBoss = () => {
    boss = {
        x: canvas.width - 120,
        y: canvas.height / 2 - 60,
        width: 120,
        height: 120,
        health: 20, // Augmenter la santé du boss pour le niveau 2
        directionY: 2
    };
};

const fireBossMissile = () => {
    if (boss) {
        const missileX = boss.x;
        const missileY = boss.y + boss.height / 2 - 10;
        bossMissiles.push({ x: missileX, y: missileY, direction: 0 });

        // Le boss envoie des missiles dans plusieurs directions
        const directions = [-1, -0.5, 0, 0.5, 1];
        directions.forEach(direction => {
            bossMissiles.push({ x: missileX, y: missileY, direction });
        });
    }
};

const updateBossMissiles = () => {
    bossMissiles.forEach((missile, index) => {
        missile.x -= 4;
        missile.y += missile.direction * 2;
        ctx.drawImage(bossMissileImg, missile.x, missile.y, 20, 20);

        if (missile.x + 20 < 0 || missile.y < 0 || missile.y > canvas.height) {
            bossMissiles.splice(index, 1);
        }

        if (
            missile.x < starX + starWidth &&
            missile.x + 20 > starX &&
            missile.y < starY + starHeight &&
            missile.y + 20 > starY
        ) {
            gameOver = true;
        }
    });
};

const updateBoss = () => {
    if (boss) {
        boss.y += boss.directionY;

        if (boss.y <= 0 || boss.y + boss.height >= canvas.height) {
            boss.directionY *= -1;
        }

        ctx.drawImage(bossHaterImg, boss.x, boss.y, boss.width, boss.height);

        ctx.fillStyle = "red";
        ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(boss.x, boss.y - 10, (boss.health / 20) * boss.width, 5);

        missiles.forEach((missile, index) => {
            if (
                missile.x < boss.x + boss.width &&
                missile.x + 20 > boss.x &&
                missile.y < boss.y + boss.height &&
                missile.y + 20 > boss.y
            ) {
                boss.health--;
                missiles.splice(index, 1);

                if (boss.health <= 0) {
                    boss = null;
                    // Afficher un message de victoire ou passer au niveau suivant
                }
            }
        });
    }
};

const render = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (pause) {
        return;
    }

    index++;
    const bgX = -((index * (speed / 2)) % bgImgLevel2.width);

    ctx.drawImage(bgImgLevel2, bgX, 0, bgImgLevel2.width, canvas.height);
    if (bgX + bgImgLevel2.width < canvas.width) {
        ctx.drawImage(bgImgLevel2, bgX + bgImgLevel2.width, 0, bgImgLevel2.width, canvas.height);
    }

    if (gamePlaying && !gameOver && !pieceCollected && timestamp - startTime > 300) {
        updateMissiles();
        updateBoss();
        updateBossMissiles();
    }

    if (gamePlaying && !gameOver) {
        ctx.drawImage(starImgLevel2, starX, starY, starWidth, starHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
    }

    if (!pieceCollected) {
        window.requestAnimationFrame(render);
    }
};

bgImgLevel2.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);
};

window.addEventListener('resize', resizeGame);

initBoss();

canvas.addEventListener('mousemove', (e) => {
    if (gamePlaying && !gameOver) {
        updateStarPosition(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gamePlaying && !gameOver) {
        const touch = e.touches[0];
        updateStarPosition(touch.clientX - canvas.getBoundingClientRect().left, touch.clientY - canvas.getBoundingClientRect().top);
    }
});

document.addEventListener('click', () => {
    if (!gamePlaying && !gameOver) {
        gamePlaying = true;
        startTime = performance.now();
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        starWidth = initialSize[0];
        starHeight = initialSize[1];
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);
        score = 0;
        initBoss();
        startTime = null;
        missiles = [];
        bossMissiles = [];
    }
});

setInterval(() => {
    if (boss && Date.now() - lastBossMissileTime > 1000) {
        fireBossMissile();
        lastBossMissileTime = Date.now();
    }
}, 1000);
