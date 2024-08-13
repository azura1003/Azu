import { canvas, ctx, bgImg, resizeGame, showMessage, showWelcomeMessage } from './util.js';
import { initStar, drawStar, updateStarPosition, growStar, starX, starY, starWidth, starHeight } from './entities.js';
import { pieces, initPiece, updatePieces, checkPieceCollision } from './entities.js';
import { fireMissile, updateMissiles, missiles } from './entities.js';
import { haters, initHater, updateHaters } from './entities.js';

let gamePlaying = false;
let gameOver = false;
let piecesCollected = 0;
let pieceCollected = false;
let pause = false;
let index = 0;
let score = 0;
let meilleurScore = localStorage.getItem('meilleurScore') || 0;
let startTime = null;

const render = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (pause) {
        return;
    }

    index++;
    const bgX = -((index * (6.2 / 2)) % bgImg.width);

    ctx.drawImage(bgImg, bgX, 0, bgImg.width, canvas.height);
    if (bgX + bgImg.width < canvas.width) {
        ctx.drawImage(bgImg, bgX + bgImg.width, 0, bgImg.width, canvas.height);
    }

    if (gamePlaying && !gameOver && !pieceCollected && timestamp - startTime > 300) {
        updatePieces();
        updateMissiles();
        updateHaters();

        pieces.forEach((piece, index) => {
            if (checkPieceCollision(starX, starY, starWidth, starHeight)) {
                pieces.splice(index, 1);
                piecesCollected++;
                growStar(piecesCollected);
                if (piecesCollected === 1) {
                    showMessage("Hey, Collectez<br> les pieces pour<br> faire grossir <br> l'étoile", initPiece);
                } else if (piecesCollected === 5) {
                    showMessage("Bravo! ce que<br> vous avez collecté<br> represente notre<br> fiancement initial<br> par fonds propres", () => {
                        gamePlaying = true;
                        startTime = performance.now();
                    });
                } else if (piecesCollected < 5) {
                    initPiece();
                }
            }
        });

        haters.forEach((hater, index) => {
            missiles.forEach((missile, mIndex) => {
                if (missile.x < hater.x + hater.width &&
                    missile.x + missile.width > hater.x &&
                    missile.y < hater.y + hater.height &&
                    missile.y + missile.height > hater.y) {
                    haters[index].health--;
                    missiles.splice(mIndex, 1);
                    if (haters[index].health <= 0) {
                        haters.splice(index, 1);
                    }
                }
            });
        });
    }

    drawStar();

    if (gamePlaying && !gameOver) {
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
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.font = "bold 30px courier";
    } else {
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

initStar();
initPiece();
initHater();

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
        initStar();
        score = 0;
        piecesCollected = 0;
        initPiece();
        initHater();
        startTime = null;
    }
});

setInterval(() => {
    if (piecesCollected >= 5) {
        fireMissile(starX, starY, starWidth);
    }
}, 1000);
