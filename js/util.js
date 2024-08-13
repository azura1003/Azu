export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');

export const bgImg = new Image();
bgImg.src = './img/azura-bg.png';

export let pieceCollected = false;
export let pause = false;
export let gamePlaying = false; // Declare and export gamePlaying

export const resizeGame = () => {
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 431;
        canvas.height = 768;
    }
};

export const showMessage = (message, callback) => {
    pieceCollected = true;
    pause = true;
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

export const showWelcomeMessage = () => {
    showMessage('Bienvenue<br>l/etoile<br> représente le projet<br> azura vivez<br> notre aventure', () => {
        gamePlaying = true; // Set gamePlaying to true
        startTime = performance.now();
    });
};

