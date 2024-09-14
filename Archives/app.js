const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pieceImg = new Image();
const missileImg = new Image(); // New missile image

bgImg.src = './azura-bg.png';
starImg.src = './static-star.png';
pieceImg.src = './piece.png';
missileImg.src = './poussieres.png'; // Load missile image

let gamePlaying = false;
let gameOver = false;
let pieceCollected = false;
let pause = false;
let pauseStartTime;
let piecesPassed = 0;
let piecesCollected = 0;

const gravity = 0.5,
    speed = 6.2;

let initialSize, maxSize, starWidth, starHeight;
let starX, starY;
let missiles = []; // Array to store missiles
let lastMissileTime = 0; // To control missile firing rate

const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        initialSize = [canvas.width / 25, canvas.height / 37.5]; // Start size at 2x
        maxSize = [canvas.width / 10, canvas.height / 15];
    } else {
        canvas.width = 431;
        canvas.height = 768;

        initialSize = [51 * 0.4, 36 * 0.4]; // Start size at 2x
        maxSize = [51 * 1.2, 36 * 2.0]; // Maximum size
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

const showMessage = (message, callback) => {
    pieceCollected = true;
    pause = true;
    pauseStartTime = performance.now();
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
    showMessage('Bienvenue<br>l/etoile<br> représente le projet<br> azura vivez<br> notre aventure', () => {
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
    const missileY = starY + starHeight / 2 - 10; // Adjust missile starting position
    missiles.push({ x: missileX, y: missileY });
};

const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.x += 4; // Slower missile speed
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20); // Larger missile size

        // Remove missile if it goes out of bounds
        if (missile.x > canvas.width) {
            missiles.splice(index, 1);
        }
    });
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

                // Show message for the first and last piece
                if (piecesCollected === 1) {
                    showMessage("Hey, Collectez<br> les pieces pour<br> faire grossir <br> l'étoile", initPiece);
                } else if (piecesCollected === 5) {
                    showMessage("Bravo! ce que<br> vous avez collecté<br> represente notre<br> fiancement initial<br> par fonds propres", null);
                } else if (piecesCollected < 5) {
                    initPiece(); // Continue to add pieces until the star is fully grown
                }

                if (piecesCollected < 5 && messageIndex < messages.length) {
                    showMessage(messages[messageIndex]);
                    messageIndex++;
                }
            }
            if (piece[0] <= -30) {
                pieces.splice(index, 1);
                piecesPassed++;
                if (piecesCollected < 5) {
                    initPiece(); // Continue to add pieces until the star is fully grown
                }
            }
        });

        // Fire missiles at regular intervals
        if (piecesCollected >= 5 && timestamp - lastMissileTime > 1000) { // Fire a missile every 1000ms
            fireMissile();
            lastMissileTime = timestamp;
        }

        // Update and draw missiles
        updateMissiles();
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
        messageIndex = 0;
        pieces = [];
        initPiece();
        startTime = null;
        missiles = []; // Reset missiles
    }
});
