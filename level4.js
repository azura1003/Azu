const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const missileImg = new Image();
const bossImg = new Image();
const metalImg = new Image();
const attackImg = new Image();
const bossMissileImg = new Image();
const angryImg = new Image();
const impactImg = new Image();

bgImg.src = './img/usa.png';
starImg.src = './img/static-star-level3.png';
missileImg.src = './img/poussieres-violet.png';
bossImg.src = './img/concurrents-protection.png';
metalImg.src = './img/metal.png';
attackImg.src = './img/bande.png';
bossMissileImg.src = './img/dislike.png';
angryImg.src = './img/angry.png';
impactImg.src = './img/impact.png';

let gamePlaying = false;
let gameOver = false;
let pause = false;
let starWidth = 51 * 1.2;
let starHeight = 36 * 2.0;
let starX, starY;
let missiles = [];
let bossMissiles = [];
let lastMissileTime = 0;
let lastBossMissileTime = 0;
let boss = {
    x: canvas.width / 2 - 60,
    y: 50,
    width: 120,
    height: 120,
    directionX: 1,
    directionY: 1,
    health: 50,
};
let impactEffect = { active: false, x: 0, y: 0, opacity: 1.0 };
let attack = { x: 0, y: -100, width: canvas.width, height: 50, active: false, direction: 'left' };
let damageText = [];
let metalPlates = [
    { x: canvas.width / 2 - 50, y: 450, width: 80, height: 30 },
    { x: canvas.width / 2 + 130, y: 500, width: 80, height: 30 }
];
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;

let loadingBar = {
    x: canvas.width / 2 - 100,
    y: starY + starHeight + 80,
    width: 200,
    height: 20,
    progress: 0,
    active: false,
    flashing: false
};

let bossAttackType = 'dislike';
let bossAttacking = true;

const speed = 2.0;

const resizeGame = () => {
    canvas.width = 431;
    canvas.height = 768;
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
    loadingBar.y = starY + starHeight + 80;
};

const fireMissile = () => {
    if (!bossAttacking) return;

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

const fireBossMissile = () => {
    if (!boss || !bossAttacking) return;
    const missileX = boss.x + boss.width / 2 - 10;
    const missileY = boss.y + boss.height;
    const img = bossAttackType === 'dislike' ? bossMissileImg : angryImg;

    bossMissiles.push({ x: missileX, y: missileY, direction: Math.random() * 2 - 1, img });

    if (Math.random() < 0.3) {
        const directions = [-1, -0.5, 0, 0.5, 1];
        directions.forEach(direction => {
            bossMissiles.push({ x: missileX, y: missileY, direction, img });
        });
    }

    bossAttackType = bossAttackType === 'dislike' ? 'angry' : 'dislike';
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.y -= 1.5;
        missile.x += (missile.direction || 0) * 1;
        ctx.drawImage(missileImg, missile.x, missile.y, 100, 100);

        if (missile.x > canvas.width || missile.x < 0 || missile.y < 0 || missile.y > canvas.height) {
            missiles.splice(index, 1);
        } else if (boss &&
            missile.x < boss.x + boss.width &&
            missile.x + 100 > boss.x &&
            missile.y < boss.y + boss.height &&
            missile.y + 100 > boss.y
        ) {
            missiles.splice(index, 1);
            boss.health = Math.max(0, boss.health - 2);
            showDamageText("-2 HP");
            if (boss.health === 0 && !attack.active && !loadingBar.active) {
                startBossAttack();
                startLoadingBar();
            }
        }
    });

    bossMissiles.forEach((missile, index) => {
        missile.y += 1.5;
        missile.x += (missile.direction || 0) * 1;
        ctx.drawImage(missile.img, missile.x, missile.y, 40, 40);

        if (missile.x > canvas.width || missile.x < 0 || missile.y > canvas.height) {
            bossMissiles.splice(index, 1);
        } else if (
            missile.x < starX + starWidth &&
            missile.x + 40 > starX &&
            missile.y < starY + starHeight &&
            missile.y + 40 > starY &&
            !isStarBehindPlate()
        ) {
            showDamageText("-10 HP");
            gameOver = true;
        }
    });
};

const showDamageText = (text) => {
    if (boss) {
        damageText.push({ x: boss.x + boss.width / 2, y: boss.y, opacity: 1.0, text: text });
    }
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
    if (boss) {
        const barWidth = 120;
        const barHeight = 10;
        const barX = boss.x;
        const barY = boss.y - 20;
        const healthPercentage = boss.health / 50;

        ctx.fillStyle = 'red';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = 'green';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }
};

const drawLoadingBar = () => {
    if (loadingBar.active) {
        ctx.fillStyle = 'grey';
        ctx.fillRect(loadingBar.x, loadingBar.y, loadingBar.width, loadingBar.height);
        ctx.fillStyle = loadingBar.flashing ? 'white' : 'green';
        ctx.fillRect(loadingBar.x, loadingBar.y, loadingBar.width * (loadingBar.progress / 100), loadingBar.height);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${loadingBar.progress}%`, loadingBar.x + loadingBar.width / 2 - 10, loadingBar.y + 15);

        if (loadingBar.progress >= 100) {
            loadingBar.flashing = !loadingBar.flashing;
            bossAttacking = false;
        }
    }
};

const startLoadingBar = () => {
    loadingBar.active = true;
    loadingBar.progress = 0;
    const loadingInterval = setInterval(() => {
        if (loadingBar.progress >= 100) {
            clearInterval(loadingInterval);
            loadingBar.flashing = true;
        } else {
            loadingBar.progress += 1;
        }
    }, 100);
};

const updateBoss = () => {
    if (boss) {
        boss.x += boss.directionX * 2;
        boss.y += boss.directionY * 1;

        if (boss.x < 0 || boss.x + boss.width > canvas.width) {
            boss.directionX *= -1;
        }
        if (boss.y < 0 || boss.y + boss.height > canvas.height / 4) {
            boss.directionY *= -1;
        }

        ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
        drawBossHealthBar();
    }
};

const drawMetalPlates = () => {
    metalPlates.forEach(plate => {
        ctx.drawImage(metalImg, plate.x, plate.y, plate.width, plate.height);
    });
};

const startBossAttack = () => {
    attack.active = true;
    attack.y = -attack.height;

    const attackInterval = setInterval(() => {
        if (!attack.active) {
            clearInterval(attackInterval);
            return;
        }

        attack.y += 5;

        if (attack.y > canvas.height) {
            attack.active = false;
            attack.direction = attack.direction === 'left' ? 'right' : 'left';
            attack.x = attack.direction === 'left' ? 0 : canvas.width - attack.width;
            clearInterval(attackInterval);
        }

        if (
            starX + starWidth > attack.x && 
            starX < attack.x + attack.width &&
            starY + starHeight > attack.y && 
            starY < attack.y + attack.height &&
            !isStarBehindPlate()
        ) {
            showDamageText("-1000000 HP");
            gameOver = true;
        }
    }, 20);
};

const isStarBehindPlate = () => {
    return metalPlates.some(plate => {
        return (
            starX + starWidth > plate.x &&
            starX < plate.x + plate.width &&
            starY + starHeight > plate.y &&
            starY < plate.y + plate.height
        );
    });
};

const starCollisionWithBoss = () => {
    const collisionInterval = setInterval(() => {
        if (!boss) {
            clearInterval(collisionInterval);
            return;
        }
        if (
            starX + starWidth > boss.x &&
            starX < boss.x + boss.width &&
            starY + starHeight > boss.y &&
            starY < boss.y + boss.height
        ) {
            impactEffect.active = true;
            impactEffect.x = boss.x;
            impactEffect.y = boss.y;
            boss = null;
            setTimeout(() => {
                impactEffect.active = false;
                startEndSequence(); // Démarrer les crédits après l'impact
            }, 2000);
            clearInterval(collisionInterval);
        } else {
            starX += (boss.x - starX) * 0.02;
            starY += (boss.y - starY) * 0.02;
        }
    }, 20);
};

const startEndSequence = () => {
    let endInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black'; // Changer le fond en noir
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        starX = canvas.width / 2 - starWidth / 2;
        starY = canvas.height - starHeight;
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

        // Affichage des messages de fin
        ctx.fillStyle = 'white';
        ctx.font = "bold 20px Arial";
        ctx.fillText("Crédits : merci d'avoir joué à Azuzu, le jeu est maintenant fini.", canvas.width / 2 - 200, 50);
        ctx.fillText("Ce jeu a été entièrement codé par Noor, fondateur de Azura.", canvas.width / 2 - 200, 80);
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, 100);
            ctx.fillText("C'est une manière un peu originale de montrer notre parcours sur le projet", canvas.width / 2 - 200, 50);
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, 100);
                ctx.fillText("Mais attendez qui voilà ? :o ...", canvas.width / 2 - 200, 50);
                clearInterval(endInterval);
            }, 3000);
        }, 3000);
    }, 50);
};

const render = () => {
    if (pause) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    if (boss) updateBoss();
    updateMissiles();
    updateDamageText();
    drawMetalPlates();
    drawLoadingBar();

    if (gamePlaying && !gameOver) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

        if (Date.now() - lastMissileTime > 1600 && bossAttacking) {
            fireMissile();
            lastMissileTime = Date.now();
        }

        if (Date.now() - lastBossMissileTime > 3000 && bossAttacking) {
            fireBossMissile();
            lastBossMissileTime = Date.now();
        }

        if (attack.active) {
            ctx.drawImage(attackImg, attack.x, attack.y, attack.width, attack.height);
        }

        if (impactEffect.active) {
            ctx.globalAlpha = impactEffect.opacity;
            ctx.drawImage(impactImg, impactEffect.x, impactEffect.y, 200, 200);
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
        loadingBar.active = false;
        loadingBar.flashing = false;
    } else {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.fillStyle = 'white';
        ctx.fillText('Click to Start', 90, 535);
        ctx.font = "bold 30px courier";
    }

    window.requestAnimationFrame(render);
};

bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);
};

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
    if (!gamePlaying || gameOver || pause) return;
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
        boss = {
            x: canvas.width / 2 - 60,
            y: 50,
            width: 120,
            height: 120,
            directionX: 1,
            directionY: 1,
            health: 50,
        };
        missiles = [];
        damageText = [];
        attack.active = false;
        score = 0;
        loadingBar.active = false;
        loadingBar.flashing = false;
        bossAttacking = true;
    }

    if (loadingBar.progress >= 100) {
        starCollisionWithBoss();
        loadingBar.active = false;
        loadingBar.flashing = false;
    }
});
