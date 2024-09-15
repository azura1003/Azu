const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pieceImg = new Image();
const businessImg = new Image();

bgImg.src = './img/level3-bg.png';
starImg.src = './img/static-star-level2.png';
pieceImg.src = './img/piece2.png';
businessImg.src = './img/business.png';

let gamePlaying = false;
let gameOver = false;
let pause = false;
let starWidth = 51 * 1.2;
let starHeight = 36 * 2.0;
let starX, starY;
let pieces = [];
let pieceCollected = 0;
let businessX = canvas.width / 2 + 50; // Position de 'business.png'
let businessY = canvas.height / 2;
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let messageText = ''; // Texte du message in-game
let messageTimer; // Timer pour afficher le message temporairement
let shakeDuration = 0; // Durée du tremblement
let fadingEffect = false; // Détermine si l'effet de fondu est en cours
let fadeOpacity = 1; // Opacité actuelle de l'étoile
let oscillationSpeed = 0.02; // Vitesse d'oscillation de l'étoile
let flashEffect = false; // Détermine si l'effet de flash est actif
let flashDuration = 0; // Durée de l'effet de flash
let finalShakeEffect = false; // Indicateur pour le tremblement final intense
let gainTexts = []; // Liste des gains à afficher

const speed = 2.0;

const resizeGame = () => {
    canvas.width = 431;
    canvas.height = 768;
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

// Initialiser les pièces
const initPieces = () => {
    pieces = [];
    for (let i = 0; i < 5; i++) {
        pieces.push({
            x: businessX + 30,
            y: businessY - 20,
            falling: false
        });
    }
};

// Fonction pour lancer les pièces
const throwPiece = (index) => {
    if (index < pieces.length) {
        pieces[index].falling = true;
        setTimeout(() => {
            throwPiece(index + 1);
        }, 1000); // Lancer une pièce toutes les secondes
    }
};

// Fonction pour mettre à jour les pièces
const updatePieces = () => {
    pieces.forEach((piece) => {
        if (piece.falling) {
            piece.y += 2; // Ajuster la vitesse de chute ici
            if (piece.y > canvas.height) {
                piece.falling = false; // Arrête la chute quand la pièce est hors de l'écran
            }
            ctx.drawImage(pieceImg, piece.x, piece.y, 20, 20);

            if (
                piece.y > starY && piece.y < starY + starHeight &&
                piece.x > starX && piece.x < starX + starWidth
            ) {
                piece.falling = false;
                score += 15000; // Score pour chaque pièce collectée
                pieceCollected++;
                localStorage.setItem('score', score);
            }
        }
    });
};

// Fonction pour afficher un message in-game
const showMessageInGame = (text) => {
    messageText = text; // Définit le texte du message
    clearTimeout(messageTimer); // Efface le timer précédent
    messageTimer = setTimeout(() => {
        messageText = ''; // Efface le texte après 3 secondes
    }, 3000);
};

// Fonction pour afficher le message d'introduction
const showIntroMessage = (message, callback) => {
    pause = true; // Met le jeu en pause
    const messageDiv = document.createElement('div');
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.padding = '20px';
    messageDiv.style.width = '300px';
    messageDiv.style.backgroundColor = 'black';
    messageDiv.style.color = 'white';
    messageDiv.style.fontSize = '18px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.textAlign = 'center';
    messageDiv.innerHTML = `<p>${message}</p><button>Continuer</button>`;
    document.body.appendChild(messageDiv);

    // Ajouter un écouteur pour fermer le message
    messageDiv.querySelector('button').addEventListener('click', () => {
        document.body.removeChild(messageDiv);
        pause = false; // Reprendre le jeu après le message
        if (callback) callback();
        window.requestAnimationFrame(render);
    });
};

// Fonction pour afficher la devinette
const showRiddle = (riddle, callback) => {
    pause = true; // Met le jeu en pause
    const riddleDiv = document.createElement('div');
    riddleDiv.style.position = 'fixed';
    riddleDiv.style.top = '50%';
    riddleDiv.style.left = '50%';
    riddleDiv.style.transform = 'translate(-50%, -50%)';
    riddleDiv.style.padding = '20px';
    riddleDiv.style.width = '300px';
    riddleDiv.style.backgroundColor = 'black';
    riddleDiv.style.color = 'white';
    riddleDiv.style.fontSize = '18px';
    riddleDiv.style.zIndex = '1000';
    riddleDiv.style.textAlign = 'center';
    riddleDiv.innerHTML = `
        <p>${riddle.question}</p>
        ${riddle.options.map((option, i) => `<button style="margin: 5px;">${option}</button>`).join('')}
    `;
    document.body.appendChild(riddleDiv);

    riddleDiv.querySelectorAll('button').forEach((button, index) => {
        button.addEventListener('click', () => {
            if (index === riddle.correctAnswer) {
                showMessageInGame("Bonne réponse !");
                riddleDiv.remove();
                pause = false; // Reprendre le jeu après une bonne réponse
                if (callback) callback();
                window.requestAnimationFrame(render);
            } else {
                showMessageInGame("Mauvaise réponse ! Essayez encore.");
            }
        });
    });
};

// Fonction de tremblement de terre
const startShakeEffect = () => {
    const shakeInterval = setInterval(() => {
        if (fadingEffect || finalShakeEffect) {
            const offsetX = Math.random() * 10 - 5; // Génère un décalage horizontal aléatoire
            const offsetY = Math.random() * 10 - 5; // Génère un décalage vertical aléatoire
            canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`; // Applique le décalage au canvas
        } else {
            clearInterval(shakeInterval);
            canvas.style.transform = 'translate(0, 0)'; // Réinitialise la position du canvas
        }
    }, 100); // Répète toutes les 100ms (moins fréquent)
};

// Fonction de fondu et oscillation avec clignotement
const startFadingEffect = (onComplete) => {
    fadingEffect = true; // Démarre l'effet de fondu et d'oscillation
    flashEffect = true; // Active l'effet de flash
    const fadeInterval = setInterval(() => {
        if (fadingEffect) {
            fadeOpacity -= 0.02; // Diminue plus lentement l'opacité pour prolonger l'effet
            starWidth += Math.sin(oscillationSpeed) * 0.5; // Oscille la largeur de l'étoile
            starHeight += Math.sin(oscillationSpeed) * 0.5; // Oscille la hauteur de l'étoile
            oscillationSpeed += 0.05; // Augmente la vitesse d'oscillation

            if (fadeOpacity <= 0) {
                clearInterval(fadeInterval);
                flashEffect = true; // Continue l'effet de flash jusqu'à l'apparition du nouveau visuel
                fadeOpacity = 0; // Garde l'opacité à 0
                starImg.src = './img/static-star-level3.png'; // Change l'image de l'étoile
                setTimeout(() => {
                    startAppearEffect(onComplete); // Démarre l'effet d'apparition après un petit délai
                }, 500); // Délai avant de commencer l'apparition
            }
        }
    }, 100); // Répète toutes les 100ms pour prolonger l'effet
};

// Fonction d'apparition avec fondu et effets lumineux
const startAppearEffect = (onComplete) => {
    fadeOpacity = 0; // Commence avec une opacité de 0 pour le nouveau visuel
    const appearInterval = setInterval(() => {
        if (fadeOpacity < 1) {
            fadeOpacity += 0.05; // Augmente progressivement l'opacité
            flashEffect = true; // Continue l'effet de flash
        } else {
            clearInterval(appearInterval);
            fadeOpacity = 1; // Assure que l'opacité est complètement à 1
            flashEffect = false; // Arrête l'effet de flash
            if (onComplete) onComplete();
        }
    }, 100); // Répète toutes les 100ms pour un effet de fondu fluide
};

// Fonction pour gérer la transition vers le niveau 4
const transitionToLevel4 = () => {
    setTimeout(() => {
        window.location.href = 'level4.html'; // Redirige vers le niveau 4 après 1 seconde
    }, 1000); // Délai de 1 seconde après la fin de la transformation
};

// Fonction pour afficher les gains de l'étoile
const displayGains = () => {
    const gains = [
        "+1 sort",
        "+100 vitesse",
        "+100 puissance"
    ];

    gains.forEach((gain, index) => {
        setTimeout(() => {
            gainTexts.push({
                text: gain,
                x: starX + starWidth / 2,
                y: starY,
                opacity: 1.0
            });
        }, index * 500); // Chaque gain commence à 500ms d'intervalle
    });

    setInterval(() => {
        gainTexts.forEach((gain, index) => {
            if (gain.opacity > 0) {
                gain.opacity -= 0.04; // Réduit plus rapidement l'opacité
                gain.y -= 1; // Monte plus rapidement le texte
            } else {
                gainTexts.splice(index, 1); // Supprime le texte lorsqu'il devient invisible
            }
        });
    }, 50); // Répète toutes les 50ms pour un mouvement fluide

    // Appeler la transition après avoir affiché les gains
    setTimeout(transitionToLevel4, 2000); // Délai de 2 secondes pour afficher les gains avant la transition
};

// Fonction de flash
const renderFlashEffect = () => {
    if (flashEffect) {
        const currentTime = performance.now();
        if (currentTime - flashDuration > 200) { // Rend les clignotements moins fréquents
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashDuration = currentTime + 200; // Plus de temps entre les flashes
        } else if (currentTime - flashDuration > 100) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
};

// Rendu du jeu
const render = () => {
    if (pause) return; // Si le jeu est en pause, arrêter le rendu

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
    if (!fadingEffect) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
    } else {
        ctx.globalAlpha = fadeOpacity; // Applique l'opacité à l'étoile
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.globalAlpha = 1; // Réinitialise l'opacité pour d'autres dessins
    }

    ctx.drawImage(businessImg, businessX, businessY, 100, 100); // Affiche 'business.png'
    updatePieces();

    // Affiche le texte des gains
    gainTexts.forEach((gain) => {
        ctx.fillStyle = `rgba(0, 255, 0, ${gain.opacity})`; // Texte vert
        ctx.font = "bold 20px Arial";
        ctx.fillText(gain.text, gain.x, gain.y);
    });

    // Affiche le texte du message in-game avec un fond noir, positionné plus bas
    if (messageText) {
        // Appliquer le style spécial uniquement pour le message "Ohhh... Elle se transforme."
        if (messageText.includes("Ohhh")) {
            ctx.fillStyle = 'black';
            ctx.fillRect(canvas.width / 2 - 160, 190, 320, 150); // Rectangle noir ajusté
            ctx.fillStyle = 'white';
            ctx.font = "bold 18px Arial";
            const lines = messageText.split('\n'); // Gérer les sauts de ligne
            lines.forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2 - ctx.measureText(line).width / 2, 210 + i * 25);
            });
        } else {
            // Affichage standard pour les autres messages
            ctx.fillStyle = 'black';
            ctx.fillRect(canvas.width / 2 - 150, 200, 300, 40); // Rectangle noir en arrière-plan du texte
            ctx.fillStyle = 'white';
            ctx.font = "bold 20px Arial";
            ctx.fillText(messageText, canvas.width / 2 - ctx.measureText(messageText).width / 2, 230); // Texte légèrement plus bas
        }
    }

    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 50);
    ctx.font = "bold 30px courier";

    renderFlashEffect(); // Affiche l'effet de flash

    window.requestAnimationFrame(render);
};

// Chargement du fond
bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);

    setTimeout(() => {
        showIntroMessage("Petite étoile je peux t'aider à briller mais pour ça tu dois répondre à mes devinettes", () => {
            setTimeout(() => {
                showRiddle({
                    question: "Quelle est la première chose à faire avant de lancer un nouveau produit sur le marché ?",
                    options: [
                        "1. Embaucher une équipe de vente qui porte des costumes encore plus chers que votre produit.",
                        "2. Faire une étude de marché, parce qu'il vaut mieux savoir si quelqu'un veut vraiment acheter votre invention révolutionnaire."
                    ],
                    correctAnswer: 1
                }, () => {
                    initPieces();
                    throwPiece(0); // Commence à lancer les pièces après la devinette

                    setTimeout(() => {
                        showRiddle({
                            question: "Quelle est la qualité essentielle d'un entrepreneur à succès ?",
                            options: [
                                "1. La persévérance, car même quand tout va mal, il faut garder le sourire… et peut-être investir dans des actions de caféine.",
                                "2. La richesse initiale, sauf que vous n'avez pas gagné à la loterie, pas encore."
                            ],
                            correctAnswer: 0
                        }, () => {
                            initPieces(); // Initialiser les pièces après la deuxième question
                            throwPiece(0); // Lancer les pièces après la deuxième question
                            setTimeout(() => {
                                showMessageInGame("Ohhh\nMais que se passe t'il ?\nLe financement a rendu l'étoile\nbien plus puissante!\nElle se transforme.");
                                setTimeout(() => {
                                    startShakeEffect(); // Démarre l'effet de tremblement indéfini
                                    setTimeout(() => {
                                        startFadingEffect(() => {
                                            finalShakeEffect = true; // Active le tremblement final
                                            setTimeout(() => {
                                                finalShakeEffect = false; // Arrête le tremblement final
                                                displayGains(); // Affiche les gains de l'étoile
                                            }, 2000); // Durée du tremblement final intense
                                        }); // Démarre l'effet de fondu et d'oscillation
                                    }, 5000); // Prolonge le fondu
                                }, 5000); // Prolonge le tremblement
                            }, 7000); // Affiche le message après 7 secondes
                        });
                    }, 5000); // Délai de 5 secondes après la première devinette
                });
            }, 5000); // Délai de 5 secondes après le premier message
        });
    }, 3000); // Délai de 3 secondes avant d'afficher le premier message
};

// Écouteurs d'événements pour contrôler le mouvement de l'étoile
window.addEventListener('resize', resizeGame);

canvas.addEventListener('mousemove', (e) => {
    if (gamePlaying && !gameOver && !pause) {  // Vérifier que le jeu n'est pas en pause
        starX = e.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = e.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gamePlaying && !gameOver && !pause) {  // Vérifier que le jeu n'est pas en pause
        const touch = e.touches[0];
        starX = touch.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = touch.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

document.addEventListener('keydown', (e) => {
    if (!gamePlaying || gameOver || pause) return; // Vérifier que le jeu n'est pas en pause
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
        pieces = [];
        pieceCollected = 0;
        score = 0;
    }
});
