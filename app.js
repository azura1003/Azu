const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgImg = new Image();
const starImg = new Image();

bgImg.src = './azura-bg.png';
starImg.src = './static-star.png';  // Assurez-vous que cette image se trouve dans le bon répertoire

// general settings
let gamePlaying = false;

const gravity = 0.5,
    speed = 6.2,
    size = [51, 36],
    jump = -11.5,
    cTenth = canvas.width / 10;

// New size for the star
const newSize = [size[0] * 1.5, size[1] * 2.5];

let index = 0,
    meilleurScore = 0,
    flight,
    flyHeight = (canvas.height / 2) - (newSize[1] / 2),  // Center vertically initially
    ScoreActuel,
    pipe,
    pipes;

const render = () => {
    // make the pile and star moving
    index++;

    // Calculate the x position for the background image
    const bgX = -((index * (speed / 2)) % bgImg.width);

    // Draw the first part of the background
    ctx.drawImage(
        bgImg,
        bgX,
        0,
        bgImg.width,
        canvas.height
    );

    // Draw the second part of the background
    if (bgX + bgImg.width < canvas.width) {
        ctx.drawImage(
            bgImg,
            bgX + bgImg.width,
            0,
            bgImg.width,
            canvas.height
        );
    }

    // draw star
    if (gamePlaying) {
        // Code pour le jeu en cours
        ctx.drawImage(
            starImg,
            (canvas.width / 2) - (newSize[0] / 2),  // Center horizontally
            flyHeight,
            newSize[0],
            newSize[1]
        );
        flight += gravity;
        flyHeight = Math.min(flyHeight + flight, canvas.height - newSize[1]);
    } else {
        ctx.drawImage(
            starImg,
            (canvas.width / 2) - (newSize[0] / 2),  // Center horizontally
            (canvas.height / 2) - (newSize[1] / 2),  // Center vertically
            newSize[0],
            newSize[1]
        );
        flyHeight = (canvas.height / 2) - (newSize[1] / 2);  // Center vertically
        ctx.fillStyle = 'white';
        ctx.fillText(`meilleur score: ${meilleurScore}`, 85, 245);
        ctx.fillText('clickez pour jouer', 90, 535);
        ctx.font = "bold 30px courier";
    }

    // tell the browser to perform anim
    window.requestAnimationFrame(render);
};

bgImg.onload = render;

// commencer le jeu
document.addEventListener('click', () => gamePlaying = true);
window.onclick = () => flight = jump;
