const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pieceImg = new Image();
const missileImg = new Image();
const haterImg = new Image();
const bossHaterImg = new Image();
const bossMissileImg = new Image();
const equipmentImg = new Image(); // New equipment image

bgImg.src = './img/azura-bg.png';
starImg.src = './img/static-star.png';
pieceImg.src = './img/piece.png';
missileImg.src = './img/poussieres.png';
haterImg.src = './img/haters.png';
bossHaterImg.src = './img/boss-hater.png';
bossMissileImg.src = './img/poussieresnoir.png';
equipmentImg.src = './img/wings.png'; // Load equipment image

let gamePlaying = false;
let gameOver = false;
let pieceCollected = false;
let pause = false;
let piecesPassed = 0;
let piecesCollected = 0;
let haterMessageShown = false;
let boss = null;
let bossMissiles = [];
let missiles = [];
let equipment = null;
let lastMissileTime = 0;
let lastBossMissileTime = 0;
let haters = [];

const gravity = 0.5,
    speed = 6.2;

let initialSize, maxSize, starWidth, starHeight;
let starX, starY;

const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        initialSize = [canvas.width / 25, canvas.height / 37.5];
        maxSize = [canvas.width / 10, canvas.height / 15];
    } else {
        canvas.width = 431;
        canvas.height = 768;

        initialSize = [51 * 0.4, 36 * 0.4];
        maxSize = [51 * 1.2, 36 * 2.0];
    }
    starWidth = initialSize[0];
    starHeight = initialSize[1];
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

let index = 0,
    meilleurScore = localStorage.getItem('meilleurScore') || 0,
    score = 0,
    pieces = [],
    startTime = null;

const messages = [];

let messageIndex = 0;

const initPiece = () => {
    pieces.push([
        canvas.width + 500 + pieces.length * 200,
        Math.random() * (canvas.height - 30)
    ]);
};

const checkPieceCollision = (piece) => {
    const star = {
        x: starX,
        y: starY,
        width: starWidth,
        height: starHeight
    };

    return star.x < piece[0] + 30 && star.x + star.width > piece[0] &&
           star.y < piece[1] + 30 && star.y + star.height > piece[1];
};

const checkEquipmentCollision = () => {
    if (equipment) {
        const star = {
            x: starX,
            y: starY,
            width: starWidth,
            height: starHeight
        };

        return star.x < equipment.x + equipment.width &&
               star.x + star.width > equipment.x &&
               star.y < equipment.y + equipment.height &&
               star.y + star.height > equipment.y;
    }
    return false;
};

const showMessage = (message, callback) => {
    pieceCollected = true;
    pause = true;
    const messageDiv = document.createElement('div');
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.padding = '10px';
    messageDiv.style.backgroundColor = 'black';
    messageDiv.style.color = 'white';
    messageDiv.style.fontSize = '20px';
    messageDiv.style.zIndex = '1000';
    messageDiv.innerHTML = message;
    document.body.appendChild(messageDiv);
    document.addEventListener('click', () => {
        document.body.removeChild(messageDiv);
        pieceCollected = false;
        pause = false;
        if (callback) callback();
        window.requestAnimationFrame(render);
    }, { once: true });
};

const showWelcomeMessage = () => {
    showMessage('Bienvenue<br>l\'étoile<br> représente le projet<br> azura vivez<br> notre aventure', () => {
        gamePlaying = true;
        startTime = performance.now();
    });
};

const updateStarPosition = (x, y) => {
    starX = x - starWidth / 2;
    starY = y - starHeight / 2;
};

const growStar = () => {
    piecesCollected++;
    if (piecesCollected <= 5) {
        const growthFactor = piecesCollected / 5;
        starWidth = initialSize[0] + growthFactor * (maxSize[0] - initialSize[0]);
        starHeight = initialSize[1] + growthFactor * (maxSize[1] - initialSize[1]);
    } else {
        starWidth = maxSize[0];
        starHeight = maxSize[1];
    }
};

const fireMissile = () => {
    const missileX = starX + starWidth;
    const missileY = starY + starHeight / 2 - 10;
    missiles.push({ x: missileX, y: missileY });
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.x += 4;
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);

        if (missile.x > canvas.width) {
            missiles.splice(index, 1);
        }
    });
};

const initHater = () => {
    const hater = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 60),
        width: 60,
        height: 60,
        health: 2
    };
    haters.push(hater);
};

const updateHaters = () => {
    haters.forEach((hater, index) => {
        hater.x -= 2;

        ctx.fillStyle = "red";
        ctx.fillRect(hater.x, hater.y - 10, hater.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(hater.x, hater.y - 10, (hater.health / 2) * hater.width, 5);

        ctx.drawImage(haterImg, hater.x, hater.y, hater.width, hater.height);

        missiles.forEach((missile, missileIndex) => {
            if (
                missile.x < hater.x + hater.width &&
                missile.x + 20 > hater.x &&
                missile.y < hater.y + hater.height &&
                missile.y + 20 > hater.y
            ) {
                hater.health--;
                missiles.splice(missileIndex, 1);

                if (hater.health <= 0) {
                    haters.splice(index, 1);
                }
            }
        });

        if (
            hater.x < starX + starWidth &&
            hater.x + hater.width > starX &&
            hater.y < starY + starHeight &&
            hater.y + hater.height > starY
        ) {
            gameOver = true;
        }

        if (hater.x + hater.width < 0) {
            haters.splice(index, 1);
        }
    });
};

const initBoss = () => {
    boss = {
        x: canvas.width - 120,
        y: canvas.height / 2 - 60,
        width: 120,
        height: 120,
        health: 15,
        directionY: 2
    };
};

const fireBossMissile = () => {
    if (boss) {
        const missileX = boss.x;
        const missileY = boss.y + boss.height / 2 - 10;
        bossMissiles.push({ x: missileX, y: missileY, direction: 0 });

        // Random chance to fire in five directions
        if (Math.random() < 0.3) { // 30% chance
            const directions = [-1, -0.5, 0, 0.5, 1];
            directions.forEach(direction => {
                bossMissiles.push({ x: missileX, y: missileY, direction });
            });
        }
    }
};

const updateBossMissiles = () => {
    bossMissiles.forEach((missile, index) => {
        missile.x -= 4;
        missile.y += missile.direction * 2; // Move in different directions
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
        ctx.fillRect(boss.x, boss.y - 10, (boss.health / 15) * boss.width, 5);

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
                    equipment = {
                        x: canvas.width / 2 - 30,
                        y: canvas.height / 2 - 30,
                        width: 60,
                        height: 60
                    };
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
    const bgX = -((index * (speed / 2)) % bgImg.width);

    ctx.drawImage(bgImg, bgX, 0, bgImg.width, canvas.height);
    if (bgX + bgImg.width < canvas.width) {
        ctx.drawImage(bgImg, bgX + bgImg.width, 0, bgImg.width, canvas.height);
    }

    if (gamePlaying && !gameOver && !pieceCollected && timestamp - startTime > 300) {
        pieces.forEach((piece, index) => {
            piece[0] -= speed;
            ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
            if (checkPieceCollision(piece)) {
                pieces.splice(index, 1);
                piecesPassed++;
                growStar();

                if (piecesCollected === 1) {
                    showMessage("Hey, Collectez<br> les pieces pour<br> faire grossir <br> l'étoile", initPiece);
                } else if (piecesCollected === 5) {
                    showMessage("Bravo! ce que<br> vous avez collecté<br> represente notre<br> fiancement initial<br> par fonds propres", () => {
                        showMessage("Attention! Les haters arrivent!", () => {
                            haterMessageShown = true;
                            for (let i = 0; i < 5; i++) {
                                setTimeout(initHater, i * 1000);
                            }
                            setTimeout(initBoss, 6000);
                        });
                    });
                } else if (piecesCollected < 5) {
                    initPiece();
                }
            }
        });

        if (piecesCollected >= 5 && timestamp - lastMissileTime > 1000) {
            fireMissile();
            lastMissileTime = timestamp;
        }

        updateMissiles();
        updateHaters();
        updateBoss();
        updateBossMissiles();

        if (equipment && checkEquipmentCollision()) {
            equipment = null;
            showMessage("Bravo vous avez battu la démotivation, vous avez obtenu des ailes qui vont vous aider à durant l'étape 2 du projet");
        }
    }

    if (equipment) {
        ctx.drawImage(equipmentImg, equipment.x, equipment.y, equipment.width, equipment.height);
    }

    if (gamePlaying && !gameOver) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
    } else if (pieceCollected) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        pieces.forEach(piece => {
            ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
        });
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(`meilleur score: ${meilleurScore}`, 85, 245);
        ctx.fillText('cliquez pour jouer', 90, 535);
        ctx.font = "bold 30px courier";
    }

    if (!pieceCollected) {
        window.requestAnimationFrame(render);
    }
};

bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);
};

window.addEventListener('resize', resizeGame);

initPiece();

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
    if (!gamePlaying && !gameOver && !pieceCollected) {
        showWelcomeMessage();
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        starWidth = initialSize[0];
        starHeight = initialSize[1];
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);
        score = 0;
        piecesPassed = 0;
        piecesCollected = 0;
        haterMessageShown = false;
        pieces = [];
        boss = null;
        bossMissiles = [];
        haters = [];
        equipment = null;
        initPiece();
        startTime = null;
        missiles = [];
    }
});

setInterval(() => {
    if (boss && Date.now() - lastBossMissileTime > 1000) {
        fireBossMissile();
        lastBossMissileTime = Date.now();
    }
}, 1000);
