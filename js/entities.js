import { ctx, canvas } from './util.js';

const starImg = new Image();
starImg.src = './img/static-star.png';

export let starX = 0;
export let starY = 0;
export let starWidth = 0;
export let starHeight = 0;
export let pieces = [];
export let missiles = [];
export let haters = [];

let initialSize, maxSize;

export const initStar = () => {
    if (window.innerWidth <= 768) {
        initialSize = [canvas.width / 25, canvas.height / 37.5];
        maxSize = [canvas.width / 10, canvas.height / 15];
    } else {
        initialSize = [51 * 0.4, 36 * 0.4];
        maxSize = [51 * 1.2, 36 * 2.0];
    }
    starWidth = initialSize[0];
    starHeight = initialSize[1];
    starX = (canvas.width / 2) - (starWidth / 2);
    starY = (canvas.height / 2) - (starHeight / 2);
};

export const drawStar = () => {
    ctx.drawImage(starImg, starX, starY, starWidth, starHeight);
};

export const updateStarPosition = (x, y) => {
    starX = x - starWidth / 2;
    starY = y - starHeight / 2;
};

export const growStar = (piecesCollected) => {
    if (piecesCollected <= 5) {
        const growthFactor = piecesCollected / 5;
        starWidth = initialSize[0] + growthFactor * (maxSize[0] - initialSize[0]);
        starHeight = initialSize[1] + growthFactor * (maxSize[1] - initialSize[1]);
    } else {
        starWidth = maxSize[0];
        starHeight = maxSize[1];
    }
};

export const initPiece = () => {
    pieces.push([
        canvas.width + 500 + pieces.length * 200,
        Math.random() * (canvas.height - 30)
    ]);
};

export const updatePieces = () => {
    pieces.forEach((piece, index) => {
        piece[0] -= 6.2;
        ctx.drawImage(pieceImg, piece[0], piece[1], 30, 30);
    });
};

export const checkPieceCollision = (x, y, width, height) => {
    return pieces.some((piece, index) => {
        const collision = x < piece[0] + 30 && x + width > piece[0] &&
                          y < piece[1] + 30 && y + height > piece[1];
        if (collision) pieces.splice(index, 1);
        return collision;
    });
};

export const fireMissile = (x, y, width) => {
    const missileX = x + width;
    const missileY = y + height / 2 - 10;
    missiles.push({ x: missileX, y: missileY });
};

export const updateMissiles = () => {
    missiles.forEach((missile, index) => {
        missile.x += 4;
        ctx.drawImage(missileImg, missile.x, missile.y, 20, 20);
        if (missile.x > canvas.width) missiles.splice(index, 1);
    });
};

const haterImg = new Image();
haterImg.src = './img/haters.png';

export const initHater = () => {
    haters.push({
        x: canvas.width + 500 + haters.length * 300,
        y: Math.random() * (canvas.height - 50),
        width: 50,
        height: 50,
        health: 2
    });
};

export const updateHaters = () => {
    haters.forEach(hater => {
        hater.x -= 2;
        ctx.drawImage(haterImg, hater.x, hater.y, hater.width, hater.height);
    });
};

