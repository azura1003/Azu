const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pipeTopImg = new Image();
const pipeBottomImg = new Image();
const pieceImg = new Image();

bgImg.src = './azura-bg.png';
starImg.src = './static-star.png'; // Assurez-vous que cette image se trouve dans le bon répertoire
pipeTopImg.src = './pipe-top.png'; // Assurez-vous que cette image se trouve dans le bon répertoire
pipeBottomImg.src = './pipe-bottom.png'; // Assurez-vous que cette image se trouve dans le bon répertoire
pieceImg.src = './piece.png'; // Assurez-vous que cette image se trouve dans le bon répertoire

// general settings
let gamePlaying = false;
let gameOver = false;
let pieceCollected = false;

const gravity = 0.5,
    speed = 6.2,
    size = [51, 36],
    jump = -11.5,
    cTenth = canvas.width / 10;

const pipeWidth = 78; // Largeur des tuyaux (ou obstacles)
const pipeGap = 200; // Espace entre les tuyaux supérieur et inférieur
const minPipeDistance = 200; // Distance minimale entre deux tuyaux

// New size for the star (réduit légèrement la taille)
const newSize = [size[0] * 1.2, size[1] * 2.0];
const margin = 60; // Marge pour réduire la sensibilité des collisions

let index = 0,
    meilleurScore = localStorage.getItem('meilleurScore') || 0, // Lire le meilleur score depuis le localStorage
    flight,
    flyHeight = (canvas.height / 2) - (newSize[1] / 2),
    score = 0, // Score actuel
    pipes = [],
    pieces = [],
    startTime = null; // Temps de départ pour le délai

// Fonction pour initialiser les tuyaux avec un délai
const initPipes = () => {
    pipes = Array(3).fill().map((_, i) => [
        canvas.width + i * (pipeWidth + minPipeDistance) + 1000, // Ajoutez un délai de 1000 pixels
        Math.random() * (canvas.height / 2)
    ]);
};

// Fonction pour initialiser les pièces
const initPieces = () => {
    pieces = Array(2).fill().map(() => {
        const pipe = pipes[Math.floor(Math.random() * pipes.length)];
        return [
            pipe[0] + pipeWidth + minPipeDistance / 2, // Positionner la pièce entre les tuyaux
            pipe[1] + pipeGap / 2 - 15 // Centrer verticalement la pièce entre les tuyaux
        ];
    });
};

// Fonction pour vérifier les collisions avec les tuyaux
const checkCollision = (pipe) => {
    const pipeTop = {
        x: pipe[0],
        y: 0,
        width: pipeWidth,
        height: pipe[1]
    };

    const pipeBottom = {
        x: pipe[0],
        y: pipe[1] + pipeGap,
        width: pipeWidth,
        height: canvas.height - pipe[1] - pipeGap
    };

    const star = {
        x: (canvas.width / 2) - (newSize[0] / 2) + margin,
        y: flyHeight + margin,
        width: newSize[0] - 2 * margin,
        height: newSize[1] - 2 * margin
    };

    // Check collision with top pipe
    if (star.x < pipeTop.x + pipeTop.width &&
        star.x + star.width > pipeTop.x &&
        star.y < pipeTop.height &&
        star.y + star.height > pipeTop.y) {
        return true;
    }

    // Check collision with bottom pipe
    if (star.x < pipeBottom.x + pipeBottom.width &&
        star.x + star.width > pipeBottom.x &&
        star.y < pipeBottom.y + pipeBottom.height &&
        star.y + star.height > pipeBottom.y) {
        return true;
    }

    return false;
};

// Fonction pour vérifier les collisions avec les pièces
const checkPieceCollision = (piece) => {
    const star = {
        x: (canvas.width / 2) - (newSize[0] / 2),
        y: flyHeight,
        width: newSize[0],
        height: newSize[1]
    };

    return star.x < piece[0] + 30 && star.x + star.width > piece[0] &&
           star.y < piece[1] + 30 && star.y + star.height > piece[1];
};

// Fonction pour afficher un message en pop-up et mettre le jeu en pause
const showMessage = (message) => {
    pieceCollected = true;
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
    messageDiv.innerText = message;
    document.body.appendChild(messageDiv);
    document.addEventListener('click', () => {
        document.body.removeChild(messageDiv);
        pieceCollected = false;
    }, { once: true });
};

const render = (timestamp) => {
    if (!startTime) startTime = timestamp;
    index++;
    const bgX = -((index * (speed / 2)) % bgImg.width);
    ctx.drawImage(bgImg, bgX, 0, bgImg.width, canvas.height);
    if (bgX + bgImg.width < canvas.width) {
        ctx.drawImage(bgImg, bgX + bgImg.width, 0, bgImg.width, canvas.height);
    }

    if (gamePlaying && !gameOver && !pieceCollected && timestamp - startTime > 300) {
        pipes.forEach(pipe => {
            pipe[0] -= speed;
            ctx.drawImage(pipeTopImg, pipe[0], 0, pipeWidth, pipe[1]);
            ctx.drawImage(pipeBottomImg, pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] - pipeGap);
            if (pipe[0] + pipeWidth < canvas.width / 2 && !pipe[2]) {
                score++;
                pipe[2] = true;
            }
            if (checkCollision(pipe)) {
                gameOver = true;
                gamePlaying = false;
                if (score > meilleurScore) {
                    meilleurScore = score;
                    localStorage.setItem('meilleurScore', meilleurScore);
                }
            }
            if (pipe[0] <= -pipeWidth) {
                pipe[0] = canvas.width + (pipeWidth + minPipeDistance) * (pipes.length - 1);
                pipe[1] = Math.random() * (canvas.height / 2);
                pipe[2] = false;
            }
        });

        pieces.forEach((piece, index) => {
            piece[0] -= speed;
            ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
            if (checkPieceCollision(piece)) {
                pieces.splice(index, 1);
                showMessage('Piece collected!');
            }
            if (piece[0] <= -30) {
                const pipe = pipes[Math.floor(Math.random() * pipes.length)];
                piece[0] = pipe[0] + pipeWidth + minPipeDistance / 2;
                piece[1] = pipe[1] + pipeGap / 2 - 15;
            }
        });
    }

    if (gamePlaying && !gameOver) {
        ctx.drawImage(starImg, (canvas.width / 2) - (newSize[0] / 2), flyHeight, newSize[0], newSize[1]);
        flight += gravity;
        flyHeight = Math.min(flyHeight + flight, canvas.height - newSize[1]);
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.fillText(`Game Over`, canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText(`Click to Restart`, canvas.width / 2 - 100, canvas.height / 2 + 50);
        ctx.font = "bold 30px courier";
    } else {
        ctx.drawImage(starImg, (canvas.width / 2) - (newSize[0] / 2), (canvas.height / 2) - (newSize[1] / 2), newSize[0], newSize[1]);
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);
        ctx.fillStyle = 'white';
        ctx.fillText(`meilleur score: ${meilleurScore}`, 85, 245);
        ctx.fillText('cliquez pour jouer', 90, 535);
        ctx.font = "bold 30px courier";
    }

    window.requestAnimationFrame(render);
};

bgImg.onload = () => window.requestAnimationFrame(render);

// Initialiser les tuyaux et les pièces
initPipes();
initPieces();

document.addEventListener('click', () => {
    if (!gamePlaying && !gameOver) {
        gamePlaying = true;
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);
        flight = jump;
        score = 0;
        initPipes();
        initPieces();
        startTime = null;
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);
        flight = jump;
        score = 0;
        initPipes();
        initPieces();
        startTime = null;
    } else if (!pieceCollected) {
        flight = jump;
    }
});

window.onclick = () => {
    if (gamePlaying && !gameOver && !pieceCollected) {
        flight = jump;
    }
};
