const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();
const pipeTopImg = new Image();
const pipeBottomImg = new Image();
const pieceImg = new Image();

bgImg.src = './azura-bg.png';
starImg.src = './static-star.png';
pipeTopImg.src = './pipe-top.png';
pipeBottomImg.src = './pipe-bottom.png';
pieceImg.src = './piece.png';

let gamePlaying = false;
let gameOver = false;
let pieceCollected = false;
let pause = false;
let pauseStartTime;
let piecesPassed = 0;

const gravity = 0.5,
    speed = 6.2,
    jump = -11.5;

let pipeWidth, pipeGap, minPipeDistance, newSize, margin, cTenth;

const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        pipeWidth = canvas.width / 5;
        pipeGap = canvas.height / 4;
        minPipeDistance = canvas.width / 3;
        newSize = [canvas.width / 10, canvas.height / 15];
        margin = canvas.width / 50;
        cTenth = canvas.width / 10;
    } else {
        canvas.width = 431;
        canvas.height = 768;

        pipeWidth = 78;
        pipeGap = 200;
        minPipeDistance = 200;
        newSize = [51 * 1.2, 36 * 2.0];
        margin = 60;
        cTenth = canvas.width / 10;
    }
    flyHeight = (canvas.height / 2) - (newSize[1] / 2);
};

let index = 0,
    meilleurScore = localStorage.getItem('meilleurScore') || 0,
    flight,
    score = 0,
    pipes = [],
    pieces = [],
    startTime = null;

const messages = [
    "Azura<br> c'est 3 ans de dev!",
    "1500+ inscriptions<br> organiques",
    "un réseau social<br> inspiré des jeux",
    "Unique en son genre",
    "Attention<br> les obstacles arrivent"
];

let messageIndex = 0;

const initPipes = () => {
    pipes = Array(3).fill().map((_, i) => [
        canvas.width + i * (pipeWidth + minPipeDistance) + 1000,
        Math.random() * (canvas.height / 2) + pipeGap / 2,
        false
    ]);
};

const initPiece = () => {
    if (pieces.length < 5 && piecesPassed < 5) {
        pieces.push([
            canvas.width + 500 + pieces.length * 200,
            Math.random() * (canvas.height - 30)
        ]);
    }
};

const checkCollision = (pipe) => {
    const pipeTop = {
        x: pipe[0],
        y: 0,
        width: pipeWidth,
        height: pipe[1] - pipeGap / 2
    };

    const pipeBottom = {
        x: pipe[0],
        y: pipe[1] + pipeGap / 2,
        width: pipeWidth,
        height: canvas.height - pipe[1] - pipeGap / 2
    };

    const star = {
        x: (canvas.width / 2) - (newSize[0] / 2) + margin,
        y: flyHeight + margin,
        width: newSize[0] - 2 * margin,
        height: newSize[1] - 2 * margin
    };

    if (star.x < pipeTop.x + pipeTop.width &&
        star.x + star.width > pipeTop.x &&
        star.y < pipeTop.height &&
        star.y + star.height > pipeTop.y) {
        return true;
    }

    if (star.x < pipeBottom.x + pipeBottom.width &&
        star.x + star.width > pipeBottom.x &&
        star.y < pipeBottom.y + pipeBottom.height &&
        star.y + star.height > pipeBottom.y) {
        return true;
    }

    return false;
};

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
    showMessage('Hey collectez<br>les pieces.', () => {
        gamePlaying = true;
        startTime = performance.now();
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
        pipes.forEach(pipe => {
            pipe[0] -= speed;
            ctx.drawImage(pipeTopImg, pipe[0], 0, pipeWidth, pipe[1] - pipeGap / 2);
            ctx.drawImage(pipeBottomImg, pipe[0], pipe[1] + pipeGap / 2, pipeWidth, canvas.height - pipe[1] - pipeGap / 2);
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
                pipe[1] = Math.random() * (canvas.height / 2) + pipeGap / 2;
                pipe[2] = false;
            }
        });

        pieces.forEach((piece, index) => {
            piece[0] -= speed;
            ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
            if (checkPieceCollision(piece)) {
                pieces.splice(index, 1);
                piecesPassed++;
                if (messageIndex < messages.length) {
                    showMessage(messages[messageIndex]);
                    messageIndex++;
                }
                initPiece();
            }
            if (piece[0] <= -30) {
                pieces.splice(index, 1);
                piecesPassed++;
                initPiece();
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
    } else if (pieceCollected) {
        ctx.drawImage(starImg, (canvas.width / 2) - (newSize[0] / 2), flyHeight, newSize[0], newSize[1]);
        pipes.forEach(pipe => {
            ctx.drawImage(pipeTopImg, pipe[0], 0, pipeWidth, pipe[1] - pipeGap / 2);
            ctx.drawImage(pipeBottomImg, pipe[0], pipe[1] + pipeGap / 2, pipeWidth, canvas.height - pipe[1] - pipeGap / 2);
        });
        pieces.forEach(piece => {
            ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
        });
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else {
        ctx.drawImage(starImg, (canvas.width / 2) - (newSize[0] / 2), (canvas.height / 2) - (newSize[1] / 2), newSize[0], newSize[1]);
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);
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
initPipes();

document.addEventListener('click', () => {
    if (!gamePlaying && !gameOver && !pieceCollected) {
        showWelcomeMessage();
    } else if (gameOver) {
        gamePlaying = true;
        gameOver = false;
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);
        flight = jump;
        score = 0;
        piecesPassed = 0;
        messageIndex = 0;
        pipes = [];
        initPipes();
        pieces = [];
        initPiece();
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
