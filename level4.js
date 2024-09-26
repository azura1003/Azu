const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Chargement des images
const bgImg = new Image();
const starImg = new Image();
const missileImg = new Image();
const bossImg = new Image();
const metalImg = new Image();
const attackImg = new Image();
const bossMissileImg = new Image();
const angryImg = new Image();
const impactImg = new Image();
const finalBossImg = new Image();

bgImg.src = './img/usa.png';
starImg.src = './img/static-star-level3.png';
missileImg.src = './img/poussieres-violet.png';
bossImg.src = './img/concurrents-protection.png';
metalImg.src = './img/metal.png';
attackImg.src = './img/bande.png';
bossMissileImg.src = './img/dislike.png';
angryImg.src = './img/angry.png';
impactImg.src = './img/impact.png';
finalBossImg.src = './img/mark.png';

// Variables du jeu
let endSequence = false; // Indique si la séquence de fin est en cours
let finalBossSequence = false; // Indique si la séquence du boss final est en cours
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
    y: 0, // Sera initialisé dans resizeGame()
    width: 200,
    height: 20,
    progress: 0,
    active: false,
    flashing: false
};

let bossAttackType = 'dislike';
let bossAttacking = true;

const speed = 2.0;

// Variables pour la séquence de fin
let creditsY = canvas.height; // Position initiale du texte défilant
const creditsText = [
    "Merci d'avoir joué à Azura Game!",
    "Ce jeu a été entièrement codé par Noor, fondateur de Azura.",
    "C'est une manière originale de montrer notre parcours sur le projet.",
    "Nous espérons que vous avez apprécié l'expérience.",
    "Fin."
];

let finalBossMessageShown = false;
let finalBossResponse = ''; // Stocke la réponse du joueur
let finalMessageDisplayed = false; // Indique si le message final est affiché
let finalBossOpacity = 0; // Pour l'effet de fade-in du boss final

// Fonction pour redimensionner le jeu
const resizeGame = () => {
    canvas.width = 431;
    canvas.height = 768;
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
    loadingBar.y = starY + starHeight + 80;
};

// Fonction pour tirer un missile
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

// Fonction pour le tir des missiles du boss
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

// Mise à jour des missiles
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

// Affichage du texte de dégâts
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

// Affichage de la barre de vie du boss
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

// Affichage de la barre de chargement
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

// Mise à jour du boss
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

// Dessiner les plaques métalliques
const drawMetalPlates = () => {
    metalPlates.forEach(plate => {
        ctx.drawImage(metalImg, plate.x, plate.y, plate.width, plate.height);
    });
};

// Démarrer l'attaque du boss
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

// Vérifier si l'étoile est derrière une plaque
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

// Collision de l'étoile avec le boss
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
            gamePlaying = false; // Arrête le jeu
            endSequence = true; // Démarre la séquence de fin
            setTimeout(() => {
                impactEffect.active = false;
                startEndSequence(); // Démarre la séquence de fin
            }, 2000);
            clearInterval(collisionInterval);
        } else {
            starX += (boss.x - starX) * 0.02;
            starY += (boss.y - starY) * 0.02;
        }
    }, 20);
};

// Démarrer la séquence de fin
const startEndSequence = () => {
    // Positionner l'étoile en bas de l'écran
    starX = canvas.width / 2 - starWidth / 2;
    starY = canvas.height - starHeight - 20; // Ajustez si nécessaire

    // Initialiser la position du texte
    creditsY = canvas.height;

    // Assurer que la séquence de fin est active
    endSequence = true;
};

// Afficher le texte défilant des crédits
const renderScrollingText = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner l'étoile en bas de l'écran
    ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

    // Définir les propriétés du texte
    ctx.fillStyle = 'white';
    ctx.font = "bold 20px Arial";
    ctx.textAlign = 'center';

    let lineHeight = 30; // Ajuster l'espacement entre les lignes
    creditsText.forEach((line, index) => {
        let y = creditsY + index * lineHeight;
        // Effet de fondu
        let alpha = 1;
        if (y < canvas.height / 2) {
            alpha = Math.max(0, (y - canvas.height / 4) / (canvas.height / 4));
        }
        ctx.globalAlpha = alpha;
        ctx.fillText(line, canvas.width / 2, y);
    });
    ctx.globalAlpha = 1.0; // Réinitialiser l'opacité

    // Déplacer le texte vers le haut plus lentement
    creditsY -= 0.5; // Ajustez la vitesse de défilement si nécessaire

    // Vérifier si le texte a entièrement défilé
    if (creditsY + creditsText.length * lineHeight < 0) {
        endSequence = false;
        finalBossSequence = true;
    }
};

// Afficher la séquence du boss final
const renderFinalBossSequence = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner le boss final avec effet de fade-in
    if (finalBossOpacity < 1) {
        finalBossOpacity += 0.01; // Ajustez la vitesse du fade-in
    }
    ctx.globalAlpha = finalBossOpacity;
    ctx.drawImage(finalBossImg, canvas.width / 2 - 100, 100, 200, 200);
    ctx.globalAlpha = 1.0; // Réinitialiser l'opacité

    // Afficher le message du boss
    ctx.fillStyle = 'white';
    ctx.font = "bold 18px Arial";
    ctx.textAlign = 'center';
    let message = "Bravo, petite étoile tu es devenue bien grande, et comme tu commences à faire de l'ombre à mes projets j'aimerais t'acheter pour 80 millions de $. Acceptes-tu ?";
    wrapText(ctx, message, canvas.width / 2, 350, 400, 24);

    // Afficher les boutons Oui et Non
    if (!finalBossMessageShown && finalBossOpacity >= 1) {
        createChoiceButtons();
        finalBossMessageShown = true;
    }
};

// Fonction pour gérer le texte multi-ligne
const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    let words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
};

// Créer les boutons de choix Oui et Non
const createChoiceButtons = () => {
    // Créer le bouton Oui
    const yesButton = document.createElement('button');
    yesButton.innerText = 'Oui';
    yesButton.style.position = 'absolute';
    yesButton.style.left = '40%';
    yesButton.style.top = '70%';
    yesButton.style.padding = '10px 20px';
    yesButton.style.fontSize = '18px';
    document.body.appendChild(yesButton);

    // Créer le bouton Non
    const noButton = document.createElement('button');
    noButton.innerText = 'Non';
    noButton.style.position = 'absolute';
    noButton.style.left = '55%';
    noButton.style.top = '70%';
    noButton.style.padding = '10px 20px';
    noButton.style.fontSize = '18px';
    document.body.appendChild(noButton);

    // Gestion des clics sur les boutons
    yesButton.addEventListener('click', () => {
        finalBossResponse = 'Oui';
        document.body.removeChild(yesButton);
        document.body.removeChild(noButton);
        showFinalMessage();
    });

    noButton.addEventListener('click', () => {
        finalBossResponse = 'Non';
        document.body.removeChild(yesButton);
        document.body.removeChild(noButton);
        showFinalMessage();
    });
};

// Afficher le message final
const showFinalMessage = () => {
    finalMessageDisplayed = true;

    // Débloquer les niveaux 3 et 4
    let unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels')) || [1];
    if (!unlockedLevels.includes(3)) {
        unlockedLevels.push(3);
    }
    if (!unlockedLevels.includes(4)) {
        unlockedLevels.push(4);
    }
    localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));

    setTimeout(() => {
        window.location.href = 'index.html'; // Rediriger vers le menu de sélection de niveau
    }, 3000);
};

// Rendu du message final
const renderFinalMessage = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = "bold 20px Arial";
    ctx.textAlign = 'center';
    let finalMessage = "Nous n'y sommes pas encore ! C'est le scénario rêvé et pour y arriver nous avons besoin de votre soutien... Merci à tous";
    wrapText(ctx, finalMessage, canvas.width / 2, canvas.height / 2 - 50, 400, 30);
};

// Fonction de rendu principal
const render = () => {
    if (pause) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (endSequence) {
        // Gestion de la séquence de fin
        renderScrollingText();
    } else if (finalBossSequence) {
        if (finalMessageDisplayed) {
            renderFinalMessage();
        } else {
            // Gestion de la séquence du boss final
            renderFinalBossSequence();
        }
    } else {
        // Code existant pour le rendu du jeu
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
            ctx.font = "bold 30px courier";
            ctx.fillText(`Score: ${score}`, 10, 50);

        } else if (gameOver) {
            ctx.fillStyle = 'white';
            ctx.font = "bold 30px courier";
            ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
            ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
            ctx.fillText(`Cliquez pour recommencer`, canvas.width / 2 - 150, canvas.height / 2 + 50);

            // Réinitialiser certaines variables
            loadingBar.active = false;
            loadingBar.flashing = false;
        } else {
            // Écran d'accueil avant le démarrage du jeu
            ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
            ctx.fillStyle = 'white';
            ctx.font = "bold 30px courier";
            ctx.fillText('Cliquez pour démarrer', 90, 535);
        }
    }

    window.requestAnimationFrame(render);
};

// Chargement initial
bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);
};

// Gestion des mouvements de l'étoile
canvas.addEventListener('mousemove', (e) => {
    if (gamePlaying && !gameOver && !endSequence && !finalBossSequence) {
        starX = e.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = e.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gamePlaying && !gameOver && !endSequence && !finalBossSequence) {
        const touch = e.touches[0];
        starX = touch.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = touch.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

document.addEventListener('keydown', (e) => {
    if (!gamePlaying || gameOver || pause || endSequence || finalBossSequence) return;
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

// Gestion des clics pour démarrer ou redémarrer le jeu
document.addEventListener('click', () => {
    if (!gamePlaying && !gameOver && !endSequence && !finalBossSequence) {
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
        bossMissiles = [];
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
