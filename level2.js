const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const missileImg = new Image();
const monsterImg = new Image();
const fakeBossImg = new Image();
const rainImg = new Image(); 

bgImg.src = './img/level2-bg.png';
starImg.src = './img/static-star-level2.png';
missileImg.src = './img/poussieres.png';
monsterImg.src = './img/cyber.png';
fakeBossImg.src = './img/fake.png';
rainImg.src = './img/rain1.png';

let gamePlaying = false;
let gameOver = false;
let pause = false;
let starWidth = 51 * 1.2;
let starHeight = 36 * 2.0;
let starX, starY;
let missiles = [];
let lastMissileTime = 0;
let monsters = [];
let monsterWaveActive = false;
let waveStartTime = null;
let fakeBoss = null;
let flashEffect = false;
let flashStartTime = null;
let rainDrops = [];
let lastFlashTime = 0;
let nextFlashTime = 0;
let damageText = [];
let damageInterval;
let puzzleShown = false;
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;

const speed = 2.0; // Vitesse réduite
let health = 100;

const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = 431;
        canvas.height = 768;
    } else {
        canvas.width = 431;
        canvas.height = 768;
    }
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);

    rainDrops = [];
    for (let i = 0; i < 100; i++) {
        rainDrops.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 15 + 10,
            speed: Math.random() * 2 + 1 // Vitesse de la pluie ajustée
        });
    }
};

let index = 0;

const fireMissile = () => {
    const missileX = starX + starWidth;
    const missileY = starY + starHeight / 2 - 10;
    missiles.push({ x: missileX, y: missileY });

    if (Math.random() < 0.3) {
        const directions = [-1, -0.5, 0, 0.5, 1];
        directions.forEach(direction => {
            missiles.push({ x: missileX, y: missileY, direction });
        });
    }
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.x += 3; // Vitesse du missile réduite
        missile.y += (missile.direction || 0) * 2;
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);

        if (missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
            missiles.splice(index, 1);
        }
    });
};

const initMonsterWave = () => {
    monsterWaveActive = true;
    waveStartTime = performance.now();
    const spawnInterval = setInterval(() => {
        if (performance.now() - waveStartTime > 10000) {
            clearInterval(spawnInterval);
            monsterWaveActive = false;
            setTimeout(spawnFakeBoss, 5000);
        } else {
            const monster = {
                x: canvas.width,
                y: Math.random() * (canvas.height - 40),
                width: 40,
                height: 40
            };
            monsters.push(monster);
        }
    }, 300); // Rythme d'apparition des monstres réduit
};

const updateMonsters = () => {
    monsters.forEach((monster, index) => {
        monster.x -= 2; // Vitesse des monstres réduite

        ctx.drawImage(monsterImg, monster.x, monster.y, monster.width, monster.height);

        missiles.forEach((missile, missileIndex) => {
            if (
                missile.x < monster.x + monster.width &&
                missile.x + 20 > monster.x &&
                missile.y < monster.y + monster.height &&
                missile.y + 20 > monster.y
            ) {
                monsters.splice(index, 1);
                missiles.splice(missileIndex, 1);
            }
        });

        if (
            monster.x < starX + starWidth &&
            monster.x + monster.width > starX &&
            monster.y < starY + starHeight &&
            monster.y + monster.height > starY
        ) {
            health -= 10;
            score -= 10;
            showDamageText();
            if (health <= 0) {
                gameOver = true;
            }
        }

        if (monster.x + monster.width < 0) {
            monsters.splice(index, 1);
        }
    });
};

const spawnFakeBoss = () => {
    fakeBoss = {
        x: starX,
        y: starY,
        width: starWidth,
        height: starHeight
    };
    startDamageInterval();
};

const updateFakeBoss = () => {
    if (fakeBoss) {
        fakeBoss.x += (starX - fakeBoss.x) * 0.05;
        fakeBoss.y += (starY - fakeBoss.y) * 0.05;
        ctx.drawImage(fakeBossImg, fakeBoss.x, fakeBoss.y, fakeBoss.width, fakeBoss.height);
    }
};

const startDamageInterval = () => {
    damageInterval = setInterval(() => {
        showDamageText();
        health -= 10;
        score -= 10;
        if (health <= 0) {
            clearInterval(damageInterval);
            gameOver = true;
        }
    }, 1000);
    setTimeout(showPuzzle, 20000); // Afficher le puzzle après 20 secondes
};

const stopDamageInterval = () => {
    clearInterval(damageInterval);
};

const showDamageText = () => {
    damageText.push({ x: starX + starWidth / 2, y: starY, opacity: 1.0 });
};

const updateDamageText = () => {
    damageText.forEach((text, index) => {
        ctx.fillStyle = `rgba(255, 0, 0, ${text.opacity})`;
        ctx.font = "bold 20px Arial";
        ctx.fillText("-10 HP", text.x, text.y);
        text.y -= 1;
        text.opacity -= 0.02;
        if (text.opacity <= 0) {
            damageText.splice(index, 1);
        }
    });
};

const showPuzzle = () => {
    stopDamageInterval(); // Arrête les dégâts continus

    const puzzleDiv = document.createElement('div');
    puzzleDiv.style.position = 'fixed';
    puzzleDiv.style.top = '50%';
    puzzleDiv.style.left = '50%';
    puzzleDiv.style.transform = 'translate(-50%, -50%)';
    puzzleDiv.style.padding = '20px';
    puzzleDiv.style.backgroundColor = 'black';
    puzzleDiv.style.color = 'white';
    puzzleDiv.style.fontSize = '20px';
    puzzleDiv.style.zIndex = '1000';
    puzzleDiv.innerHTML = `
        <p>Pour que Azufake vous lâche, il faut répondre à cette question que seul un gamer pourra répondre :</p>
        <p>De quelle couleur est le Pokémon de type électrique de Sacha ?</p>
        <button id="redButton">Rouge</button>
        <button id="yellowButton">Jaune</button>
    `;

    document.body.appendChild(puzzleDiv);

    document.getElementById('redButton').addEventListener('click', () => {
        puzzleDiv.remove();
        gameOver = true;
        showMessage("Mauvaise réponse! C'était Jaune! Game Over.");
    });

    document.getElementById('yellowButton').addEventListener('click', () => {
        puzzleDiv.remove();
        fakeBoss = null; // Azufake disparaît
        showMessage("Bonne réponse! Azufake a disparu!");
    });
};

const startFlashingEffect = () => {
    flashEffect = true;
    flashStartTime = performance.now();
    lastFlashTime = performance.now();
    nextFlashTime = 5000 + Math.random() * 5000;
};

const renderFlashingEffect = () => {
    const currentTime = performance.now();

    if (currentTime - lastFlashTime > nextFlashTime) {
        lastFlashTime = currentTime;
        nextFlashTime = 5000 + Math.random() * 5000;
        flashStartTime = currentTime;
    }

    if (flashEffect && currentTime - flashStartTime < 100) {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (flashEffect && currentTime - flashStartTime < 200) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (flashEffect && currentTime - flashStartTime < 300) {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};

const renderRain = () => {
    rainDrops.forEach((drop) => {
        ctx.drawImage(rainImg, drop.x, drop.y, 1, drop.length);
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
        }
    });
};

const showMessage = (message, callback) => {
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
        pause = false;
        if (callback) callback();
        window.requestAnimationFrame(render);
    }, { once: true });
};

const render = (timestamp) => {
    if (pause) return;

    index++;
    const bgX = -((index * (speed / 2)) % bgImg.width);

    ctx.drawImage(bgImg, bgX, 0, bgImg.width, canvas.height);
    if (bgX + bgImg.width < canvas.width) {
        ctx.drawImage(bgImg, bgX + bgImg.width, 0, bgImg.width, canvas.height);
    }

    renderRain();
    renderFlashingEffect();
    updateDamageText();

    if (gamePlaying && !gameOver) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

        if (timestamp - lastMissileTime > 800) {
            fireMissile();
            lastMissileTime = timestamp;
        }

        updateMissiles();
        if (monsterWaveActive) updateMonsters();
        if (fakeBoss) updateFakeBoss();

        ctx.fillStyle = 'white';
        ctx.fillText(`Level 2`, 10, 50);
        ctx.fillText(`Score: ${score}`, 10, 90);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
    } else {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.fillStyle = 'white';
        ctx.fillText('cliquez pour commencer', 90, 535);
        ctx.font = "bold 30px courier";
    }

    window.requestAnimationFrame(render);
};

bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);

    setTimeout(() => {
        showMessage("Les ailes que vous avez récupérées augmentent votre cadence de tir et ajoutent un sort multiple", () => {
            gamePlaying = true;
        });
    }, 2000);

    setTimeout(() => {
        showMessage("Oh non une attaque informatique, vite evitez là sinon notre projet va périr !!", () => {
            initMonsterWave();
        });
    }, 5000);

    setTimeout(() => {
        showMessage("Mais...Mais c'est quoi ça ? On dirait une pâle copie de notre projet!", () => {
            setTimeout(showPuzzle, 16000);
        });
    }, 16000);
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
        monsters = [];
        fakeBoss = null;
        score = 0;
    }
});

startFlashingEffect();
