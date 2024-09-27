const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pieceImg = new Image();
const businessImg = new Image();
const ambianceAudio = new Audio('./audio/level3-ambiance.mp3'); // Ambiance audio for level 3
ambianceAudio.loop = true;
ambianceAudio.volume = 0.5; // Adjust the volume as needed

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
let businessX = canvas.width / 2 + 50; // Position of 'business.png'
let businessY = canvas.height / 2;
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let messageText = ''; // In-game message text
let messageTimer; // Timer to display the temporary message
let shakeDuration = 0; // Shake duration
let fadingEffect = false; // Determines if the fading effect is ongoing
let fadeOpacity = 1; // Current opacity of the star
let oscillationSpeed = 0.02; // Star oscillation speed
let flashEffect = false; // Determines if the flash effect is active
let flashDuration = 0; // Duration of the flash effect
let finalShakeEffect = false; // Indicator for the intense final shake
let gainTexts = []; // List of gains to display

const speed = 2.0;

const resizeGame = () => {
    canvas.width = 431;
    canvas.height = 768;
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

// Function to start ambiance music
const startLevelAmbiance = () => {
    ambianceAudio.play().catch((error) => {
        console.error('Error playing audio:', error);
    });
};

// Function to stop ambiance music
const stopLevelAmbiance = () => {
    ambianceAudio.pause();
    ambianceAudio.currentTime = 0; // Reset to the beginning for the next play
};

// Initialize pieces
const initPieces = () => {
    pieces = [];
    for (let i = 0; i < 5; i++) {
        pieces.push({
            x: businessX + 30,
            y: businessY - 20,
            falling: false,
        });
    }
};

// Function to throw pieces
const throwPiece = (index) => {
    if (index < pieces.length) {
        pieces[index].falling = true;
        setTimeout(() => {
            throwPiece(index + 1);
        }, 1000); // Throw a piece every second
    }
};

// Function to update pieces
const updatePieces = () => {
    pieces.forEach((piece) => {
        if (piece.falling) {
            piece.y += 2; // Adjust the fall speed here
            if (piece.y > canvas.height) {
                piece.falling = false; // Stop falling when the piece is off-screen
            }
            ctx.drawImage(pieceImg, piece.x, piece.y, 20, 20);

            if (
                piece.y > starY &&
                piece.y < starY + starHeight &&
                piece.x > starX &&
                piece.x < starX + starWidth
            ) {
                piece.falling = false;
                score += 15000; // Score for each collected piece
                pieceCollected++;
                localStorage.setItem('score', score);
            }
        }
    });
};

// Function to display in-game messages
const showMessageInGame = (text) => {
    messageText = text; // Set the message text
    clearTimeout(messageTimer); // Clear the previous timer
    messageTimer = setTimeout(() => {
        messageText = ''; // Clear the text after 3 seconds
    }, 3000);
};

// Function to display intro messages
const showIntroMessage = (message, callback) => {
    pause = true; // Pause the game
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

    // Add listener to close the message
    messageDiv.querySelector('button').addEventListener('click', () => {
        document.body.removeChild(messageDiv);
        pause = false; // Resume the game after the message
        if (callback) callback();
        window.requestAnimationFrame(render);
    });
};

// Function to show riddle
const showRiddle = (riddle, callback) => {
    pause = true; // Pause the game
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
                showMessageInGame('Bonne réponse !');
                riddleDiv.remove();
                pause = false; // Resume the game after a correct answer
                if (callback) callback();
                window.requestAnimationFrame(render);
            } else {
                showMessageInGame('Mauvaise réponse ! Essayez encore.');
            }
        });
    });
};

// Shake effect function
const startShakeEffect = () => {
    const shakeInterval = setInterval(() => {
        if (fadingEffect || finalShakeEffect) {
            const offsetX = Math.random() * 10 - 5; // Generate a random horizontal offset
            const offsetY = Math.random() * 10 - 5; // Generate a random vertical offset
            canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`; // Apply offset to canvas
        } else {
            clearInterval(shakeInterval);
            canvas.style.transform = 'translate(0, 0)'; // Reset canvas position
        }
    }, 100); // Repeat every 100ms (less frequent)
};

// Fading and oscillation function with flashing
const startFadingEffect = (onComplete) => {
    fadingEffect = true; // Start fading and oscillation
    flashEffect = true; // Activate flash effect
    const fadeInterval = setInterval(() => {
        if (fadingEffect) {
            fadeOpacity -= 0.02; // Decrease opacity more slowly to prolong the effect
            starWidth += Math.sin(oscillationSpeed) * 0.5; // Oscillate star width
            starHeight += Math.sin(oscillationSpeed) * 0.5; // Oscillate star height
            oscillationSpeed += 0.05; // Increase oscillation speed

            if (fadeOpacity <= 0) {
                clearInterval(fadeInterval);
                flashEffect = true; // Continue flashing until the new visual appears
                fadeOpacity = 0; // Keep opacity at 0
                starImg.src = './img/static-star-level3.png'; // Change star image
                setTimeout(() => {
                    startAppearEffect(onComplete); // Start appear effect after a short delay
                }, 500); // Delay before starting the appearance
            }
        }
    }, 100); // Repeat every 100ms to prolong the effect
};

// Appearance function with fade and light effects
const startAppearEffect = (onComplete) => {
    fadeOpacity = 0; // Start with 0 opacity for the new visual
    const appearInterval = setInterval(() => {
        if (fadeOpacity < 1) {
            fadeOpacity += 0.05; // Gradually increase opacity
            flashEffect = true; // Continue flash effect
        } else {
            clearInterval(appearInterval);
            fadeOpacity = 1; // Ensure opacity is fully at 1
            flashEffect = false; // Stop flash effect
            if (onComplete) onComplete();
        }
    }, 100); // Repeat every 100ms for smooth fade
};

// Transition to level 4
const transitionToLevel4 = () => {
    setTimeout(() => {
        window.location.href = 'level4.html'; // Redirect to level 4 after 1 second
    }, 1000); // 1 second delay after the transformation
};

// Display star gains
const displayGains = () => {
    const gains = ['+1 sort','+100 impact', '+100 vitesse', '+100 puissance', '+1 attaque Ultime'];

    gains.forEach((gain, index) => {
        setTimeout(() => {
            gainTexts.push({
                text: gain,
                x: starX + starWidth / 2,
                y: starY,
                opacity: 1.0,
            });
        }, index * 500); // Each gain starts at 500ms intervals
    });

    setInterval(() => {
        gainTexts.forEach((gain, index) => {
            if (gain.opacity > 0) {
                gain.opacity -= 0.04; // Reduce opacity faster
                gain.y -= 1; // Move text up faster
            } else {
                gainTexts.splice(index, 1); // Remove text when it becomes invisible
            }
        });
    }, 50); // Repeat every 50ms for smooth movement

    // Call the transition after displaying the gains
    setTimeout(transitionToLevel4, 2000); // 2-second delay to display the gains before the transition
};

// Flash function
const renderFlashEffect = () => {
    if (flashEffect) {
        const currentTime = performance.now();
        if (currentTime - flashDuration > 200) {
            // Make flashes less frequent
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashDuration = currentTime + 200; // More time between flashes
        } else if (currentTime - flashDuration > 100) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
};

// Game render
const render = () => {
    if (pause) return; // Stop rendering if the game is paused

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    if (!fadingEffect) {
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
    } else {
        ctx.globalAlpha = fadeOpacity; // Apply opacity to the star
        ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
        ctx.globalAlpha = 1; // Reset opacity for other drawings
    }

    ctx.drawImage(businessImg, businessX, businessY, 100, 100); // Display 'business.png'
    updatePieces();

    // Display the gains text
    gainTexts.forEach((gain) => {
        ctx.fillStyle = `rgba(0, 255, 0, ${gain.opacity})`; // Green text
        ctx.font = 'bold 20px Arial';
        ctx.fillText(gain.text, gain.x, gain.y);
    });

    // Display the in-game message text with a black background, positioned lower
    if (messageText) {
        // Apply special style only for the message "Ohhh... Elle se transforme."
        if (messageText.includes('Ohhh')) {
            ctx.fillStyle = 'black';
            ctx.fillRect(canvas.width / 2 - 160, 190, 320, 150); // Adjusted black rectangle
            ctx.fillStyle = 'white';
            ctx.font = 'bold 18px Arial';
            const lines = messageText.split('\n'); // Handle line breaks
            lines.forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2 - ctx.measureText(line).width / 2, 210 + i * 25);
            });
        } else {
            // Standard display for other messages
            ctx.fillStyle = 'black';
            ctx.fillRect(canvas.width / 2 - 150, 200, 300, 40); // Black rectangle behind the text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(messageText, canvas.width / 2 - ctx.measureText(messageText).width / 2, 230); // Slightly lower text
        }
    }

    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 50);
    ctx.font = 'bold 30px courier';

    renderFlashEffect(); // Display the flash effect

    window.requestAnimationFrame(render);
};

// Background load
bgImg.onload = () => {
    resizeGame();
    window.requestAnimationFrame(render);

    setTimeout(() => {
        showIntroMessage("Petite étoile je peux t'aider à briller mais pour ça tu dois répondre à mes devinettes", () => {
            setTimeout(() => {
                showRiddle(
                    {
                        question: 'Quelle est la première chose à faire avant de lancer un nouveau produit sur le marché ?',
                        options: [
                            '1. Embaucher une équipe de vente qui porte des costumes encore plus chers que votre produit.',
                            "2. Faire une étude de marché, parce qu'il vaut mieux savoir si quelqu'un veut vraiment acheter votre invention révolutionnaire.",
                        ],
                        correctAnswer: 1,
                    },
                    () => {
                        initPieces();
                        throwPiece(0); // Start throwing pieces after the riddle

                        setTimeout(() => {
                            showRiddle(
                                {
                                    question: "Quelle est la qualité essentielle d'un entrepreneur à succès ?",
                                    options: [
                                        "1. La persévérance, car même quand tout va mal, il faut garder le sourire… et peut-être investir dans des actions de caféine.",
                                        "2. La richesse initiale, sauf que vous n'avez pas gagné à la loterie, pas encore.",
                                    ],
                                    correctAnswer: 0,
                                },
                                () => {
                                    initPieces(); // Initialize pieces after the second question
                                    throwPiece(0); // Throw pieces after the second question
                                    setTimeout(() => {
                                        showMessageInGame(
                                            "Ohhh\nMais que se passe t'il ?\nLe financement a rendu l'étoile\nbien plus puissante!\nElle se transforme."
                                        );
                                        setTimeout(() => {
                                            startShakeEffect(); // Start indefinite shake effect
                                            setTimeout(() => {
                                                startFadingEffect(() => {
                                                    finalShakeEffect = true; // Activate final shake
                                                    setTimeout(() => {
                                                        finalShakeEffect = false; // Stop final shake
                                                        displayGains(); // Display star gains
                                                    }, 2000); // Duration of intense final shake
                                                }); // Start fade and oscillation effect
                                            }, 5000); // Prolong fade
                                        }, 5000); // Prolong shake
                                    }, 7000); // Display the message after 7 seconds
                                }
                            );
                        }, 5000); // 5-second delay after the first riddle
                    }
                );
            }, 5000); // 5-second delay after the first message
        });
    }, 3000); // 3-second delay before displaying the first message
};

// Event listeners for star movement control
window.addEventListener('resize', resizeGame);

canvas.addEventListener('mousemove', (e) => {
    if (gamePlaying && !gameOver && !pause) {
        // Check that the game is not paused
        starX = e.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = e.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gamePlaying && !gameOver && !pause) {
        // Check that the game is not paused
        const touch = e.touches[0];
        starX = touch.clientX - canvas.getBoundingClientRect().left - starWidth / 2;
        starY = touch.clientY - canvas.getBoundingClientRect().top - starHeight / 2;
    }
});

document.addEventListener('keydown', (e) => {
    if (!gamePlaying || gameOver || pause) return; // Check that the game is not paused
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
        startLevelAmbiance(); // Start ambiance when game starts
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        starX = (canvas.width / 2) - (starWidth / 2);
        starY = (canvas.height / 2) - (starHeight / 2);
        pieces = [];
        pieceCollected = 0;
        score = 0;
        stopLevelAmbiance(); // Stop ambiance when restarting
    }
});
