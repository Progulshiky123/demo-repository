// Отримання посилань на HTML-елементи
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const highScoreDisplay = document.getElementById('high-score');
const livesDisplay = document.getElementById('lives');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('final-score');
const achievementsButton = document.getElementById('achievementsButton');
const achievementsMenu = document.getElementById('achievements-menu');
const achievementsList = document.getElementById('achievements-list');
const closeAchievementsButton = document.getElementById('closeAchievementsButton');

// Ініціалізація системи досягнень
const achievementsSystem = new AchievementsSystem();
const highScoreFinalDisplay = document.getElementById('high-score-display');

// Налаштування гри
const containerWidth = gameContainer.clientWidth;
const containerHeight = gameContainer.clientHeight;
const playerWidth = player.clientWidth;
const playerHeight = player.clientHeight;

const playerSpeed = 8; // Швидкість руху гравця
const bulletSpeed = 10; // Швидкість польоту кулі
const enemySpeed = 2; // Швидкість руху ворогів
const GAME_DURATION = 60; // Тривалість гри в секундах

let playerX = (containerWidth - playerWidth) / 2; // Початкова позиція гравця по X
let score = 0;
let isGameOver = false;
let timeLeft = GAME_DURATION;
let highScore = localStorage.getItem('highScore') || 0;
let gameStartTime = 0;
let currentStreak = 0;
let lives = 3;

let bullets = []; // Масив для куль
let enemies = []; // Масив для ворогів

let gameInterval; // Головний ігровий цикл
let enemySpawnInterval; // Інтервал для створення ворогів
let timerInterval;
let statsUpdateInterval; // Інтервал для оновлення статистики

let keysPressed = {}; // Об'єкт для відстеження натиснутих клавіш

// --- Функції гри ---

// Функція для оновлення позиції гравця
function updatePlayerPosition() {
    if (keysPressed['ArrowLeft']) {
        playerX = Math.max(0, playerX - playerSpeed);
    }
    if (keysPressed['ArrowRight']) {
        playerX = Math.min(containerWidth - playerWidth, playerX + playerSpeed);
    }
    player.style.left = `${playerX}px`;
}

// Функція для створення кулі
function createBullet() {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    // Куля з'являється по центру гравця зверху
    bullet.style.left = `${playerX + playerWidth / 2 - 2.5}px`; // 2.5 - половина ширини кулі
    bullet.style.bottom = `${playerHeight}px`; // З'являється над гравцем
    gameContainer.appendChild(bullet);

    bullets.push({ element: bullet, y: playerHeight }); // Зберігаємо елемент і його Y-координату

    // Оновлюємо статистику для досягнень
    achievementsSystem.updateStats({
        hits: achievementsSystem.stats.hits + 1,
        currentStreak: currentStreak + 1
    });
}

// Функція для руху куль
function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y += bulletSpeed; // Куля рухається вгору
        bullet.element.style.bottom = `${bullet.y}px`;

        // Видаляємо кулі, які вийшли за межі екрану
        if (bullet.y > containerHeight) {
            gameContainer.removeChild(bullet.element);
            bullets.splice(index, 1);
            // Скидаємо серію при пропуску кулі
            currentStreak = 0;
            achievementsSystem.updateStats({ currentStreak: 0 });
        }
    });
}

// Функція для створення ворога
function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    // Ворог з'являється у випадковому місці по X зверху екрану
    const randomX = Math.floor(Math.random() * (containerWidth - 40)); // 40 - ширина ворога
    enemy.style.left = `${randomX}px`;
    enemy.style.top = `0px`; // З'являється зверху
    gameContainer.appendChild(enemy);

    enemies.push({ element: enemy, x: randomX, y: 0 }); // Зберігаємо елемент і його координати
}

// Функція для оновлення відображення життів
function updateLivesDisplay() {
    livesDisplay.textContent = '❤️'.repeat(lives);
}

// Функція для руху ворогів
function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed; // Ворог рухається вниз
        enemy.element.style.top = `${enemy.y}px`;

        // Перевірка зіткнення ворога з гравцем
        if (enemy.y + 40 >= containerHeight - playerHeight && // 40 - висота ворога
            enemy.x + 40 >= playerX && enemy.x <= playerX + playerWidth) {
            lives--;
            updateLivesDisplay(); // Оновлюємо відображення життів
            if (lives <= 0) {
                endGame();
            } else {
                // Видаляємо ворога при втраті життя
                gameContainer.removeChild(enemy.element);
                enemies.splice(index, 1);
                // Оновлюємо статистику для досягнень
                achievementsSystem.updateStats({ lives });
            }
        }

        // Видаляємо ворогів, які досягли низу (пропустили)
        if (enemy.y > containerHeight) {
            gameContainer.removeChild(enemy.element);
            enemies.splice(index, 1);
            // Скидаємо серію при пропуску ворога
            currentStreak = 0;
            achievementsSystem.updateStats({ currentStreak: 0 });
        }
    });
}

// Функція для створення ефекту зіткнення
function createCollisionEffect(x, y) {
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.width = '40px';
    effect.style.height = '40px';
    effect.style.borderRadius = '50%';
    effect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
    effect.style.animation = 'collision 0.5s ease-out forwards';
    effect.style.zIndex = '6';
    gameContainer.appendChild(effect);

    // Видаляємо ефект після завершення анімації
    setTimeout(() => {
        gameContainer.removeChild(effect);
    }, 500);
}

// Функція для анімації зміни рахунку
function animateScoreChange() {
    scoreDisplay.style.transform = 'scale(1.2)';
    scoreDisplay.style.color = '#ffd700';
    setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
        scoreDisplay.style.color = '#fff';
    }, 200);
}

// Додаємо стилі для анімацій
const style = document.createElement('style');
style.textContent = `
    @keyframes collision {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Оновлюємо функцію перевірки зіткнень
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const bulletRect = bullet.element.getBoundingClientRect();
            const enemyRect = enemy.element.getBoundingClientRect();

            if (
                bulletRect.left < enemyRect.right &&
                bulletRect.right > enemyRect.left &&
                bulletRect.top < enemyRect.bottom &&
                bulletRect.bottom > enemyRect.top
            ) {
                // Створюємо ефект зіткнення
                const collisionX = (bulletRect.left + enemyRect.left) / 2;
                const collisionY = (bulletRect.top + enemyRect.top) / 2;
                createCollisionEffect(collisionX, collisionY);

                // Оновлюємо рахунок з анімацією
                score++;
                scoreDisplay.textContent = score;
                animateScoreChange();

                // Видаляємо кулю та ворога
                gameContainer.removeChild(bullet.element);
                bullets.splice(bulletIndex, 1);
                gameContainer.removeChild(enemy.element);
                enemies.splice(enemyIndex, 1); // Видаляємо ворога

                // Оновлюємо статистику для досягнень
                achievementsSystem.updateStats({
                    score,
                    blocksDestroyed: achievementsSystem.stats.blocksDestroyed + 1
                });
            }
        });
    });
}

// Функція для оновлення статистики
function updateStats() {
    const currentTime = Date.now();
    const playTime = Math.floor((currentTime - gameStartTime) / 1000); // Конвертуємо в секунди

    achievementsSystem.updateStats({
        playTime,
        score,
        lives,
        currentStreak
    });
}

// Головний ігровий цикл
function gameLoop() {
    if (isGameOver) return;

    updatePlayerPosition();
    moveBullets();
    moveEnemies();
    checkCollisions(); // Перевіряємо зіткнення кожного кадру
}

// Функція для оновлення таймера
function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// Функція для оновлення рекорду
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = `Рекорд: ${highScore}`;
    }
}

// Функція для початку гри
function startGame() {
    isGameOver = false;
    score = 0;
    lives = 3;
    currentStreak = 0;
    gameStartTime = Date.now();

    timeLeft = GAME_DURATION;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    updateLivesDisplay(); // Оновлюємо відображення життів
    highScoreDisplay.textContent = `Рекорд: ${highScore}`;
    playerX = (containerWidth - playerWidth) / 2; // Скидаємо позицію гравця
    player.style.left = `${playerX}px`;

    // Видаляємо всі існуючі кулі та ворогів
    bullets.forEach(b => gameContainer.removeChild(b.element));
    bullets = [];
    enemies.forEach(e => gameContainer.removeChild(e.element));
    enemies = [];

    gameOverScreen.classList.remove('active'); // Приховуємо екран Game Over

    // Запускаємо ігровий цикл
    gameInterval = setInterval(gameLoop, 20); // Оновлюємо кожні 20 мс (50 кадрів/сек)

    // Запускаємо генерацію ворогів
    enemySpawnInterval = setInterval(createEnemy, 1500); // Новий ворог кожні 1.5 секунди

    // Запускаємо оновлення статистики
    statsUpdateInterval = setInterval(updateStats, 1000); // Оновлюємо статистику кожну секунду

    // Ініціалізуємо статистику для досягнень
    achievementsSystem.updateStats({
        hits: 0,
        currentStreak: 0,
        blocksDestroyed: 0,
        playTime: 0,
        lives: 3,
        initialLives: 3,
        score: 0
    });
    timerInterval = setInterval(updateTimer, 1000);
}

// Функція для завершення гри
function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(enemySpawnInterval);
    clearInterval(timerInterval);
    clearInterval(statsUpdateInterval);

    updateHighScore();
    gameContainer.style.animation = 'gameOver 0.5s ease-out';
    finalScoreDisplay.textContent = score;
    highScoreFinalDisplay.textContent = highScore;
    gameOverScreen.classList.add('active');
}
// Додаємо стилі для анімації завершення гри
const gameOverStyle = document.createElement('style');
gameOverStyle.textContent = `
    @keyframes gameOver {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(gameOverStyle);

// Функція для відображення меню досягнень
function showAchievementsMenu() {
    achievementsList.innerHTML = ''; // Очищаємо список

    // Отримуємо всі досягнення
    const achievements = achievementsSystem.getAllAchievements();

    // Створюємо елементи для кожного досягнення
    achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
        achievementElement.innerHTML = `
            <div class="achievement-icon">${achievement.title.split(' ')[0]}</div>
            <div class="achievement-info">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        achievementsList.appendChild(achievementElement);
    });

    achievementsMenu.classList.add('active');
}

// --- Обробники подій ---

// Рух гравця по клавішах (утримування)
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    // Стріляємо при натисканні пробілу
    if (e.key === ' ') {
        createBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// Клік миші теж стріляє
gameContainer.addEventListener('click', createBullet);

// Кнопка перезапуску
restartButton.addEventListener('click', startGame);

// Кнопка досягнень
achievementsButton.addEventListener('click', showAchievementsMenu);

// Кнопка закриття меню досягнень
closeAchievementsButton.addEventListener('click', () => {
    achievementsMenu.classList.remove('active');
});

// Запускаємо гру при завантаженні сторінки
document.addEventListener('DOMContentLoaded', startGame);