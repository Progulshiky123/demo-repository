// Отримання посилань на HTML-елементи
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('final-score');

// Налаштування гри
const containerWidth = gameContainer.clientWidth;
const containerHeight = gameContainer.clientHeight;
const playerWidth = player.clientWidth;
const playerHeight = player.clientHeight;

const playerSpeed = 8; // Швидкість руху гравця
const bulletSpeed = 10; // Швидкість польоту кулі
const enemySpeed = 2; // Швидкість руху ворогів

let playerX = (containerWidth - playerWidth) / 2; // Початкова позиція гравця по X
let score = 0;
let isGameOver = false;

let bullets = []; // Масив для куль
let enemies = []; // Масив для ворогів

let gameInterval; // Головний ігровий цикл
let enemySpawnInterval; // Інтервал для створення ворогів

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

// Функція для руху ворогів
function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed; // Ворог рухається вниз
        enemy.element.style.top = `${enemy.y}px`;

        // Перевірка зіткнення ворога з гравцем
        if (enemy.y + 40 >= containerHeight - playerHeight && // 40 - висота ворога
            enemy.x + 40 >= playerX && enemy.x <= playerX + playerWidth) {
            endGame(); // Кінець гри, якщо ворог доторкнувся гравця
        }

        // Видаляємо ворогів, які досягли низу (пропустили)
        if (enemy.y > containerHeight) {
            gameContainer.removeChild(enemy.element);
            enemies.splice(index, 1);
            // Можна додати втрату життя або зменшення рахунку тут
        }
    });
}

// Функція для перевірки зіткнень кулі з ворогом
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            // Отримуємо реальні розміри та позиції елементів
            const bulletRect = bullet.element.getBoundingClientRect();
            const enemyRect = enemy.element.getBoundingClientRect();

            // Перевірка накладання прямокутників (найпростіший спосіб)
            if (
                bulletRect.left < enemyRect.right &&
                bulletRect.right > enemyRect.left &&
                bulletRect.top < enemyRect.bottom &&
                bulletRect.bottom > enemyRect.top
            ) {
                // Зіткнення!
                score++;
                scoreDisplay.textContent = score;

                // Видаляємо кулю та ворога
                gameContainer.removeChild(bullet.element);
                bullets.splice(bulletIndex, 1); // Видаляємо кулю
                gameContainer.removeChild(enemy.element);
                enemies.splice(enemyIndex, 1); // Видаляємо ворога
            }
        });
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

// Функція для початку гри
function startGame() {
    isGameOver = false;
    score = 0;
    scoreDisplay.textContent = score;
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
}

// Функція для завершення гри
function endGame() {
    isGameOver = true;
    clearInterval(gameInterval); // Зупиняємо ігровий цикл
    clearInterval(enemySpawnInterval); // Зупиняємо генерацію ворогів

    finalScoreDisplay.textContent = score; // Показуємо фінальний рахунок
    gameOverScreen.classList.add('active'); // Показуємо екран завершення
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

// Запускаємо гру при завантаженні сторінки (можна додати стартовий екран)
document.addEventListener('DOMContentLoaded', startGame); // Автоматично запускаємо гру при завантаженні