(function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Chargement des images
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

    // Variables de jeu
    let gamePlaying = false;
    let gameOver = false;
    let pause = false;

    const starWidth = 51 * 1.2;
    const starHeight = 36 * 2.0;
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

    let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;

    const moveSequence = ['up', 'down', 'right', 'left'];
    let currentMoveIndex = 0;
    let arrows = [];

    const speed = 2.0;

    // Détection de l'appareil mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Variables pour la détection des mouvements sur ordinateur
    let sequenceStartPosition = null;
    let movementInProgress = false;

    // Points de validation sur l'écran
    const validationPoints = {
        up: { x: canvas.width / 2, y: 50, radius: 10, validated: false },
        down: { x: canvas.width / 2, y: canvas.height - 50, radius: 10, validated: false },
        left: { x: 50, y: canvas.height / 2, radius: 10, validated: false },
        right: { x: canvas.width - 50, y: canvas.height / 2, radius: 10, validated: false },
    };

    // Fonction de redimensionnement du jeu
    const resizeGame = () => {
        canvas.width = 431;
        canvas.height = 768;
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);

        // Définir les points de validation avec les nouvelles dimensions
        validationPoints.up.x = canvas.width / 2;
        validationPoints.up.y = 50;
        validationPoints.down.x = canvas.width / 2;
        validationPoints.down.y = canvas.height - 50;
        validationPoints.left.x = 50;
        validationPoints.left.y = canvas.height / 2;
        validationPoints.right.x = canvas.width - 50;
        validationPoints.right.y = canvas.height / 2;

        rainDrops = [];
        for (let i = 0; i < 100; i++) {
            rainDrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 15 + 10,
                speed: Math.random() * 2 + 1
            });
        }
    };

    // Fonction pour lancer l'effet de flash
    const startFlashingEffect = () => {
        flashEffect = true;
        flashStartTime = performance.now();
        lastFlashTime = performance.now();
        nextFlashTime = 5000 + Math.random() * 5000;
    };

    // Fonction de rendu de l'effet de flash
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

    // Rendu de la pluie
    const renderRain = () => {
        rainDrops.forEach((drop) => {
            ctx.drawImage(rainImg, drop.x, drop.y, 1, drop.length);
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                drop.y = -drop.length;
            }
        });
    };

    // Fonction pour afficher les messages cliquables
    const showMessage = (message, callback) => {
        pause = true;
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.padding = '20px';
        messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageDiv.style.color = 'white';
        messageDiv.style.fontSize = '20px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.cursor = 'pointer';
        messageDiv.style.borderRadius = '10px';
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);

        // Ajouter un écouteur pour fermer le message au clic
        messageDiv.addEventListener(
            'click',
            (e) => {
                e.stopPropagation(); // Empêcher la propagation de l'événement
                document.body.removeChild(messageDiv);
                pause = false;
                if (callback) callback();
            },
            { once: true }
        );
    };

    // Fonction pour tirer des missiles
    const fireMissile = () => {
        const missileX = starX + starWidth;
        const missileY = starY + starHeight / 2 - 10;
        missiles.push({ x: missileX, y: missileY });

        if (Math.random() < 0.3) {
            const directions = [-1, -0.5, 0, 0.5, 1];
            directions.forEach((direction) => {
                missiles.push({ x: missileX, y: missileY, direction });
            });
        }
    };

    // Mise à jour des missiles
    const updateMissiles = () => {
        for (let i = missiles.length - 1; i >= 0; i--) {
            const missile = missiles[i];
            missile.x += 3;
            missile.y += (missile.direction || 0) * 2;
            ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);

            if (missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
                missiles.splice(i, 1);
            }
        }
    };

    // Initialisation de la vague de monstres
    const initMonsterWave = () => {
        monsterWaveActive = true;
        waveStartTime = performance.now();
        const spawnInterval = setInterval(() => {
            if (performance.now() - waveStartTime > 10000) {
                clearInterval(spawnInterval);
                monsterWaveActive = false;
                showMessage("Mais... Mais c'est quoi ça ? On dirait une pâle copie de notre projet !", () => {
                    setTimeout(() => {
                        spawnFakeBoss();
                        setTimeout(() => {
                            showMessage("Pour vaincre le FakeAzu, vous devez reproduire la séquence de mouvements.", () => {
                                showMoveSequence();
                            });
                        }, 2000);
                    }, 2000);
                });
            } else {
                const monster = {
                    x: canvas.width,
                    y: Math.random() * (canvas.height - 40),
                    width: 40,
                    height: 40,
                };
                monsters.push(monster);
            }
        }, 300);
    };

    // Mise à jour des monstres
    const updateMonsters = () => {
        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            monster.x -= 2;

            ctx.drawImage(monsterImg, monster.x, monster.y, monster.width, monster.height);

            // Vérifier les collisions avec les missiles
            for (let j = missiles.length - 1; j >= 0; j--) {
                const missile = missiles[j];
                if (
                    missile.x < monster.x + monster.width &&
                    missile.x + 20 > monster.x &&
                    missile.y < monster.y + monster.height &&
                    missile.y + 20 > monster.y
                ) {
                    monsters.splice(i, 1);
                    missiles.splice(j, 1);
                    score += 10; // Ajouter des points au score
                    break;
                }
            }

            // Vérifier les collisions avec l'étoile
            if (
                monster.x < starX + starWidth &&
                monster.x + monster.width > starX &&
                monster.y < starY + starHeight &&
                monster.y + monster.height > starY
            ) {
                showDamageText();
            }

            // Supprimer les monstres hors écran
            if (monster.x + monster.width < 0) {
                monsters.splice(i, 1);
            }
        }
    };

    // Apparition du FakeAzu
    const spawnFakeBoss = () => {
        fakeBoss = {
            x: starX,
            y: starY,
            width: starWidth,
            height: starHeight,
        };
        startDamageInterval();
        sequenceStartPosition = { x: starX, y: starY };
        movementInProgress = false;
    };

    // Mise à jour du FakeAzu
    const updateFakeBoss = () => {
        if (fakeBoss) {
            fakeBoss.x += (starX - fakeBoss.x) * 0.05;
            fakeBoss.y += (starY - fakeBoss.y) * 0.05;
            ctx.drawImage(fakeBossImg, fakeBoss.x, fakeBoss.y, fakeBoss.width, fakeBoss.height);
        }
    };

    // Intervalle de dégâts du FakeAzu
    const startDamageInterval = () => {
        damageInterval = setInterval(() => {
            showDamageText();
        }, 1000);
    };

    // Arrêter l'intervalle de dégâts
    const stopDamageInterval = () => {
        clearInterval(damageInterval);
    };

    // Afficher les dégâts à l'écran
    const showDamageText = () => {
        damageText.push({ x: starX + starWidth / 2, y: starY, opacity: 1.0 });
    };

    // Mise à jour des textes de dégâts
    const updateDamageText = () => {
        for (let i = damageText.length - 1; i >= 0; i--) {
            const text = damageText[i];
            ctx.fillStyle = `rgba(255, 0, 0, ${text.opacity})`;
            ctx.font = 'bold 20px Arial';
            ctx.fillText('-10 HP', text.x, text.y);
            text.y -= 1;
            text.opacity -= 0.02;
            if (text.opacity <= 0) {
                damageText.splice(i, 1);
            }
        }
    };

    // Fonction pour dessiner les points de validation
    const drawValidationPoints = () => {
        for (let key in validationPoints) {
            const point = validationPoints[key];
            if (!fakeBoss) continue; // N'affiche les points qu'après le FakeAzu
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            ctx.fillStyle = point.validated ? 'green' : 'white';
            ctx.fill();
            ctx.closePath();
        }
    };

    // Afficher la séquence de mouvements
    const showMoveSequence = () => {
        for (let key in validationPoints) {
            validationPoints[key].validated = false;
        }
        currentMoveIndex = 0;
        arrows = moveSequence.map((move, index) => ({
            direction: move,
            x: (canvas.width / 2) - 60 + index * 50,
            y: canvas.height - 100,
            validated: false,
        }));

        if (isMobile) {
            showInputButtons();
        }
    };

    // Dessiner les flèches de la séquence en bas de l'écran
    const drawSequenceArrows = () => {
        arrows.forEach((arrow, index) => {
            ctx.fillStyle = arrow.validated ? 'green' : 'gray';
            ctx.font = 'bold 45px Arial'; // Grossissement des flèches
            ctx.fillText(getArrowSymbol(arrow.direction), (canvas.width / 2) - 60 + index * 50, canvas.height - 50);
        });
    };

    // Obtenir le symbole de la flèche selon la direction
    const getArrowSymbol = (direction) => {
        switch (direction) {
            case 'up':
                return '↑';
            case 'down':
                return '↓';
            case 'left':
                return '←';
            case 'right':
                return '→';
            default:
                return '';
        }
    };

    // Vérifier si le mouvement correspond à la séquence
    const checkMove = (move) => {
        if (move === moveSequence[currentMoveIndex]) {
            validationPoints[move].validated = true;
            arrows[currentMoveIndex].validated = true;
            currentMoveIndex++;
            if (currentMoveIndex === moveSequence.length) {
                fakeBoss = null;
                stopDamageInterval();
                removeInputButtons();
                showMessage("Bravo ! Azufake a disparu !", () => {
                    setTimeout(() => {
                        localStorage.setItem('level3Unlocked', 'true');
                        window.location.href = 'level3.html';
                    }, 3000);
                });
            }
        } else {
            for (let key in validationPoints) {
                validationPoints[key].validated = false;
            }
            for (let i = 0; i < arrows.length; i++) {
                arrows[i].validated = false;
            }
            currentMoveIndex = 0;
            showMessage('Séquence incorrecte ! Réessayez.', () => {
                showMoveSequence();
            });
        }
    };

    // Afficher les boutons de mouvement sur mobile
    const showInputButtons = () => {
        if (!isMobile) return;

        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach((direction) => {
            const button = document.createElement('button');
            button.innerText = getArrowSymbol(direction);
            button.classList.add('arrow-button');
            switch (direction) {
                case 'up':
                    button.style.left = 'calc(50% - 25px)';
                    button.style.bottom = '220px';
                    break;
                case 'down':
                    button.style.left = 'calc(50% - 25px)';
                    button.style.bottom = '120px';
                    break;
                case 'left':
                    button.style.left = 'calc(50% - 125px)';
                    button.style.bottom = '170px';
                    break;
                case 'right':
                    button.style.left = 'calc(50% + 25px)';
                    button.style.bottom = '170px';
                    break;
            }
            button.addEventListener('click', () => {
                checkMove(direction);
            });
            document.body.appendChild(button);
        });
    };

    // Supprimer les boutons de mouvement
    const removeInputButtons = () => {
        const buttons = document.querySelectorAll('button.arrow-button');
        buttons.forEach((button) => {
            document.body.removeChild(button);
        });
    };

    // Fonction d'initialisation du jeu
    const initLevel2Game = () => {
        resizeGame();
        window.requestAnimationFrame(render);
    };

    // Fonction de rendu principal
    let index = 0;
    const render = (timestamp) => {
        index++;
        const bgX = -((index * (speed / 2)) % bgImg.width);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, bgX, 0, bgImg.width, canvas.height);
        if (bgX + bgImg.width < canvas.width) {
            ctx.drawImage(bgImg, bgX + bgImg.width, 0, bgImg.width, canvas.height);
        }

        renderRain();
        renderFlashingEffect();
        drawValidationPoints();
        drawSequenceArrows();
        updateDamageText();

        if (gamePlaying && !gameOver) {
            ctx.drawImage(starImg, starX, starY, starWidth, starHeight);

            if (!pause) {
                if (timestamp - lastMissileTime > 800) {
                    fireMissile();
                    lastMissileTime = timestamp;
                }

                updateMissiles();
                if (monsterWaveActive) updateMonsters();
                if (fakeBoss) updateFakeBoss();
            }

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`Level 2`, 10, 50);
            ctx.fillText(`Score: ${score}`, 10, 80);
        } else if (gameOver) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 30px courier';
            ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
            ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
            ctx.fillText(`Cliquez pour recommencer`, canvas.width / 2 - 150, canvas.height / 2 + 50);
        } else {
            ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 30px courier';
            ctx.fillText('Cliquez pour commencer', 25, 300);
        }

        window.requestAnimationFrame(render);
    };

    // Événement de déplacement de la souris
    canvas.addEventListener('mousemove', (e) => {
        if (gamePlaying && !gameOver) {
            starX = e.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
            starY = e.clientY - canvas.getBoundingClientRect().top - starHeight / 2;

            for (let key in validationPoints) {
                const point = validationPoints[key];
                const distance = Math.hypot(starX + starWidth / 2 - point.x, starY + starHeight / 2 - point.y);
                if (distance <= point.radius && !point.validated) {
                    checkMove(key);
                    break;
                }
            }
        }
    });

    // Événement de déplacement tactile
    canvas.addEventListener('touchmove', (e) => {
        if (gamePlaying && !gameOver) {
            const touch = e.touches[0];
            starX = touch.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
            starY = touch.clientY - canvas.getBoundingClientRect().top - starHeight / 2;

            for (let key in validationPoints) {
                const point = validationPoints[key];
                const distance = Math.hypot(starX + starWidth / 2 - point.x, starY + starHeight / 2 - point.y);
                if (distance <= point.radius && !point.validated) {
                    checkMove(key);
                    break;
                }
            }
        }
    });

    // Événement de pression sur les touches fléchées (ordinateur)
    document.addEventListener('keydown', (e) => {
        if (!gamePlaying || gameOver) return;
        if (!fakeBoss) return;
        if (isMobile) return;
        switch (e.key) {
            case 'ArrowUp':
                checkMove('up');
                break;
            case 'ArrowDown':
                checkMove('down');
                break;
            case 'ArrowLeft':
                checkMove('left');
                break;
            case 'ArrowRight':
                checkMove('right');
                break;
            default:
                break;
        }
    });

    // Événement de clic pour démarrer le jeu ou le redémarrer après Game Over
    document.addEventListener('click', () => {
        if (!gamePlaying && !gameOver) {
            gamePlaying = true;
            gameOver = false;
            starX = (canvas.width / 2) - (starWidth / 2);
            starY = (canvas.height / 2) - (starHeight / 2);
            showMessage("Les ailes que vous avez récupérées augmentent votre cadence de tir et ajoutent un sort multiple", () => {
                setTimeout(() => {
                    showMessage("Oh non, une cyberattaque ! Vite, évitez-la sinon notre projet va périr !!", () => {
                        initMonsterWave();
                    });
                }, 3000);
            });
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

    // Initialiser le jeu lorsque les images sont chargées
    bgImg.onload = () => {
        initLevel2Game();
    };

    window.addEventListener('resize', resizeGame);
    startFlashingEffect();
})();
