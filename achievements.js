// Achievements System
class AchievementsSystem {
    constructor() {
        this.achievements = {
            firstHit: {
                id: 'firstHit',
                title: '🎯 Перший Удар',
                description: 'Відбий м\'яч хоча б 1 раз',
                condition: (stats) => stats.hits >= 1,
                unlocked: false
            },
            streak: {
                id: 'streak',
                title: '🔥 Серія',
                description: 'Відбий 20 м\'ячів підряд без пропуску',
                condition: (stats) => stats.currentStreak >= 20,
                unlocked: false
            },
            blockHunter: {
                id: 'blockHunter',
                title: '🧱 Мисливець на блоки',
                description: 'Знищ 50 блоків',
                condition: (stats) => stats.blocksDestroyed >= 50,
                unlocked: false
            },
            survival: {
                id: 'survival',
                title: '🕓 Виживання',
                description: 'Протримайся 2 хвилини',
                condition: (stats) => stats.playTime >= 120, // 120 seconds = 2 minutes
                unlocked: false
            },
            lastLife: {
                id: 'lastLife',
                title: '💀 Один крок до провалу',
                description: 'Залишся з останнім життям',
                condition: (stats) => stats.lives === 1,
                unlocked: false
            },
            gameGod: {
                id: 'gameGod',
                title: '🧠 Бог гри',
                description: 'Набери 100 очок без жодної втрати життя',
                condition: (stats) => stats.score >= 100 && stats.lives === stats.initialLives,
                unlocked: false
            }
        };

        this.stats = {
            hits: 0,
            currentStreak: 0,
            blocksDestroyed: 0,
            playTime: 0,
            lives: 3,
            initialLives: 3,
            score: 0
        };

        this.loadAchievements();
    }

    // Load achievements from localStorage
    loadAchievements() {
        const savedAchievements = localStorage.getItem('achievements');
        if (savedAchievements) {
            const parsed = JSON.parse(savedAchievements);
            Object.keys(parsed).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key].unlocked = parsed[key];
                }
            });
        }
    }

    // Save achievements to localStorage
    saveAchievements() {
        const achievementsToSave = {};
        Object.keys(this.achievements).forEach(key => {
            achievementsToSave[key] = this.achievements[key].unlocked;
        });
        localStorage.setItem('achievements', JSON.stringify(achievementsToSave));
    }

    // Update game statistics
    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        this.checkAchievements();
    }

    // Check all achievements
    checkAchievements() {
        Object.values(this.achievements).forEach(achievement => {
            if (!achievement.unlocked && achievement.condition(this.stats)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    // Unlock an achievement
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.saveAchievements();
        this.showAchievementNotification(achievement);
    }

    // Show achievement notification
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.title.split(' ')[0]}</div>
            <div class="achievement-content">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Add animation class
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }

    // Get all achievements
    getAllAchievements() {
        return Object.values(this.achievements);
    }

    // Reset all achievements (for testing)
    resetAchievements() {
        Object.values(this.achievements).forEach(achievement => {
            achievement.unlocked = false;
        });
        this.saveAchievements();
    }
}

// Export the AchievementsSystem
window.AchievementsSystem = AchievementsSystem; 