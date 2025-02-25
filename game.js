document.addEventListener('DOMContentLoaded', () => {
    // 获取游戏元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const levelElement = document.getElementById('level');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const helpBtn = document.getElementById('help-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const gameHelp = document.getElementById('game-help');
    const closeHelpBtn = document.getElementById('close-help');
    const notificationsContainer = document.getElementById('notifications');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreElement = document.getElementById('final-score');
    const finalHighScoreElement = document.getElementById('final-high-score');
    const finalLevelElement = document.getElementById('final-level');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // 游戏参数
    let snake = [];             // 蛇身体
    let foods = [];             // 食物数组
    let obstacles = [];         // 障碍物数组
    let powerUps = [];          // 道具数组
    let gridSize = 20;          // 格子大小
    let gridWidth, gridHeight;  // 游戏网格尺寸
    let direction = '';         // 蛇移动方向
    let nextDirection = '';     // 下一个方向
    let gameInterval;           // 游戏循环
    let score = 0;              // 得分
    let level = 1;              // 当前关卡
    let speed = 150;            // 游戏速度(毫秒)
    let gameRunning = false;    // 游戏状态
    let isPaused = false;       // 暂停状态
    let powerUpActive = null;   // 当前激活的道具
    let powerUpTimer = null;    // 道具计时器
    let powerUpEndEffect = null; // 道具结束效果函数
    let powerUpEndTime = 0;     // 道具结束时间
    let highScore = localStorage.getItem('snakeHighScore') || 0; // 最高分
    let isInvincible = false;   // 无敌状态

    // 食物类型
    const foodTypes = [
        { color: '#F44336', points: 10, chance: 0.7, type: 'regular' },    // 普通食物
        { color: '#FFC107', points: 20, chance: 0.2, type: 'bonus' },      // 奖励食物
        { color: '#9C27B0', points: 30, chance: 0.1, type: 'special' }     // 特殊食物
    ];

    // 道具类型
    const powerUpTypes = [
        { 
            color: '#2196F3', 
            type: 'speed', 
            duration: 5000, 
            effect: () => {
                const originalSpeed = speed;
                speed = Math.max(50, speed - 50);
                clearInterval(gameInterval);
                gameInterval = setInterval(update, speed);
                return () => {
                    speed = originalSpeed;
                    clearInterval(gameInterval);
                    if (gameRunning && !isPaused) {
                        gameInterval = setInterval(update, speed);
                    }
                };
            },
            icon: '<i class="fas fa-bolt"></i>'
        },
        { 
            color: '#CDDC39', 
            type: 'invincible', 
            duration: 5000, 
            effect: () => {
                isInvincible = true;
                return () => { isInvincible = false; };
            },
            icon: '<i class="fas fa-shield-alt"></i>'
        },
        { 
            color: '#FF5722', 
            type: 'shorter', 
            duration: 0, 
            effect: () => {
                if (snake.length > 2) {
                    snake = snake.slice(0, Math.ceil(snake.length / 2));
                }
                return () => {};
            },
            icon: '<i class="fas fa-cut"></i>'
        }
    ];
    
    // 设置游戏画布尺寸
    function setupCanvas() {
        // 适应屏幕宽度
        let maxWidth = window.innerWidth > 500 ? 400 : window.innerWidth - 40;
        // 确保宽度是gridSize的倍数
        maxWidth = Math.floor(maxWidth / gridSize) * gridSize;
        
        // 高度是宽度的3/4
        let height = Math.floor((maxWidth * 0.75) / gridSize) * gridSize;
        
        canvas.width = maxWidth;
        canvas.height = height;
        
        gridWidth = canvas.width / gridSize;
        gridHeight = canvas.height / gridSize;
    }
    
    // 初始化游戏
    function initGame() {
        setupCanvas();
        
        // 隐藏游戏结束覆盖层
        gameOverOverlay.classList.remove('active');
        
        // 初始蛇位置 (居中)
        snake = [
            {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)}
        ];
        
        // 重置状态
        foods = [];
        obstacles = [];
        powerUps = [];
        direction = '';
        nextDirection = '';
        score = 0;
        level = 1;
        speed = 150;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        isInvincible = false;
        
        // 取消任何活动的道具
        if (powerUpTimer) {
            clearTimeout(powerUpTimer);
            powerUpTimer = null;
        }
        powerUpActive = null;
        powerUpEndEffect = null;
        
        // 设置关卡
        setupLevel(level);
        
        // 生成第一个食物
        generateFood();
        
        // 绘制初始状态
        draw();
        
        // 显示最高分
        updateScoreDisplay();
        
        // 显示开始游戏通知
        showNotification('游戏准备就绪！', '#4CAF50');
    }
    
    // 设置关卡
    function setupLevel(level) {
        obstacles = [];
        
        // 根据关卡设置障碍物
        if (level >= 2) {
            // 关卡2：添加四个固定障碍物
            const obstaclePositions = [
                { x: Math.floor(gridWidth / 4), y: Math.floor(gridHeight / 4) },
                { x: Math.floor(gridWidth * 3 / 4), y: Math.floor(gridHeight / 4) },
                { x: Math.floor(gridWidth / 4), y: Math.floor(gridHeight * 3 / 4) },
                { x: Math.floor(gridWidth * 3 / 4), y: Math.floor(gridHeight * 3 / 4) }
            ];
            
            obstaclePositions.forEach(pos => {
                if (!isPositionOccupied(pos)) {
                    obstacles.push(pos);
                }
            });
        }
        
        if (level >= 3) {
            // 关卡3：添加中心十字障碍物
            const centerX = Math.floor(gridWidth / 2);
            const centerY = Math.floor(gridHeight / 2);
            
            for (let i = -2; i <= 2; i++) {
                if (i !== 0) { // 跳过中心点
                    const hPos = { x: centerX + i, y: centerY };
                    const vPos = { x: centerX, y: centerY + i };
                    
                    if (!isPositionOccupied(hPos)) obstacles.push(hPos);
                    if (!isPositionOccupied(vPos)) obstacles.push(vPos);
                }
            }
        }
        
        if (level >= 4) {
            // 关卡4：添加随机障碍物
            const numObstacles = 5 + (level - 4) * 2; // 关卡越高障碍物越多
            for (let i = 0; i < numObstacles; i++) {
                generateObstacle();
            }
        }
    }
    
    // 生成障碍物
    function generateObstacle() {
        let attempts = 0;
        while (attempts < 20) { // 最多尝试20次
            const obstacle = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // 确保障碍物不出现在蛇身上或其他物体上
            if (!isPositionOccupied(obstacle)) {
                obstacles.push(obstacle);
                return true;
            }
            attempts++;
        }
        return false;
    }
    
    // 生成食物
    function generateFood() {
        // 清理过期食物
        foods = foods.filter(food => !food.expired);
        
        // 确保至少有一个食物在场上
        if (foods.length < 1 + Math.floor(level / 3)) {
            generateNewFood();
        }
    }
    
    // 生成新食物
    function generateNewFood() {
        let attempts = 0;
        while (attempts < 20) { // 最多尝试20次
            // 选择食物类型
            const foodType = selectFoodType();
            
            const newFood = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight),
                type: foodType.type,
                points: foodType.points,
                color: foodType.color,
                expired: false,
                created: Date.now()
            };
            
            // 特殊食物会消失
            if (foodType.type === 'special' || foodType.type === 'bonus') {
                setTimeout(() => {
                    newFood.expired = true;
                }, 5000 + level * 1000); // 食物持续时间随关卡增加
            }
            
            // 确保食物不出现在蛇身上或障碍物上
            if (!isPositionOccupied(newFood)) {
                foods.push(newFood);
                
                // 随机生成道具(5%概率)
                if (Math.random() < 0.05 * level) {
                    generatePowerUp();
                }
                
                return true;
            }
            attempts++;
        }
        return false;
    }
    
    // 选择食物类型
    function selectFoodType() {
        const rand = Math.random();
        let cumulativeChance = 0;
        
        for (const type of foodTypes) {
            cumulativeChance += type.chance;
            if (rand < cumulativeChance) {
                return type;
            }
        }
        
        return foodTypes[0]; // 默认返回普通食物
    }
    
    // 生成道具
    function generatePowerUp() {
        if (powerUps.length >= 2) return false; // 限制场上道具数量
        
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        let attempts = 0;
        while (attempts < 20) {
            const powerUp = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight),
                type: powerUpType.type,
                color: powerUpType.color,
                effect: powerUpType.effect,
                duration: powerUpType.duration,
                icon: powerUpType.icon,
                expired: false,
                created: Date.now()
            };
            
            // 道具5-10秒后消失
            setTimeout(() => {
                powerUp.expired = true;
            }, 5000 + Math.random() * 5000);
            
            if (!isPositionOccupied(powerUp)) {
                powerUps.push(powerUp);
                return true;
            }
            attempts++;
        }
        return false;
    }
    
    // 检查位置是否被占用
    function isPositionOccupied(pos) {
        // 检查是否与蛇重叠
        for (let segment of snake) {
            if (segment.x === pos.x && segment.y === pos.y) {
                return true;
            }
        }
        
        // 检查是否与食物重叠
        for (let food of foods) {
            if (food.x === pos.x && food.y === pos.y) {
                return true;
            }
        }
        
        // 检查是否与障碍物重叠
        for (let obstacle of obstacles) {
            if (obstacle.x === pos.x && obstacle.y === pos.y) {
                return true;
            }
        }
        
        // 检查是否与道具重叠
        for (let powerUp of powerUps) {
            if (powerUp.x === pos.x && powerUp.y === pos.y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 绘制游戏画面
    function draw() {
        // 清空画布
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // 水平线
        for (let y = 0; y <= gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * gridSize);
            ctx.lineTo(canvas.width, y * gridSize);
            ctx.stroke();
        }
        
        // 垂直线
        for (let x = 0; x <= gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0);
            ctx.lineTo(x * gridSize, canvas.height);
            ctx.stroke();
        }
        
        // 绘制障碍物
        ctx.fillStyle = '#795548';
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 1, gridSize - 1);
            
            // 添加光晕效果
            ctx.shadowColor = '#795548';
            ctx.shadowBlur = 5;
            ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 1, gridSize - 1);
            ctx.shadowBlur = 0;
        });
        
        // 绘制食物
        foods.forEach(food => {
            // 绘制食物底部阴影
            ctx.shadowColor = food.color;
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = food.color;
            ctx.beginPath();
            ctx.arc(
                food.x * gridSize + gridSize / 2,
                food.y * gridSize + gridSize / 2,
                gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // 为特殊食物添加闪烁效果
            if (food.type === 'special' || food.type === 'bonus') {
                const timeSinceCreation = Date.now() - food.created;
                if (Math.floor(timeSinceCreation / 200) % 2 === 0) {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(
                        food.x * gridSize + gridSize / 2,
                        food.y * gridSize + gridSize / 2,
                        gridSize / 2 - 5,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }
            }
        });
        
        // 绘制道具
        powerUps.forEach(powerUp => {
            // 绘制道具底部阴影
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = powerUp.color;
            ctx.beginPath();
            ctx.arc(
                powerUp.x * gridSize + gridSize / 2,
                powerUp.y * gridSize + gridSize / 2,
                gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // 绘制道具图标
            ctx.fillStyle = 'white';
            const iconTemp = document.createElement('div');
            iconTemp.innerHTML = powerUp.icon;
            const iconEl = iconTemp.firstChild;
            
            // 利用Font Awesome的类名来决定使用什么Unicode字符
            let iconChar = '⚡'; // 默认闪电
            if (iconEl.classList.contains('fa-shield-alt')) {
                iconChar = '🛡️';
            } else if (iconEl.classList.contains('fa-cut')) {
                iconChar = '✂️';
            }
            
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconChar, powerUp.x * gridSize + gridSize/2, powerUp.y * gridSize + gridSize/2);
        });
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            const radius = gridSize / 2 - 1;
            const x = segment.x * gridSize + gridSize / 2;
            const y = segment.y * gridSize + gridSize / 2;
            
            // 设置蛇的颜色
            if (index === 0) {
                // 蛇头颜色
                ctx.fillStyle = isInvincible ? '#FFD700' : '#388E3C';
            } else {
                // 蛇身颜色
                ctx.fillStyle = isInvincible ? '#FFA500' : '#4CAF50';
                
                // 如果有速度道具激活，添加闪烁效果
                if (powerUpActive === 'speed') {
                    if (Math.floor(Date.now() / 100) % 2 === 0) {
                        ctx.fillStyle = '#2196F3';
                    }
                }
            }
            
            // 绘制蛇的圆形部分
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 为蛇头添加眼睛
            if (index === 0) {
                ctx.fillStyle = 'white';
                
                // 根据移动方向决定眼睛位置
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeOffset = radius * 0.4;
                const eyeRadius = radius * 0.2;
                
                switch(direction) {
                    case 'up':
                        eyeX1 = x - eyeOffset;
                        eyeY1 = y - eyeOffset;
                        eyeX2 = x + eyeOffset;
                        eyeY2 = y - eyeOffset;
                        break;
                    case 'down':
                        eyeX1 = x - eyeOffset;
                        eyeY1 = y + eyeOffset;
                        eyeX2 = x + eyeOffset;
                        eyeY2 = y + eyeOffset;
                        break;
                    case 'left':
                        eyeX1 = x - eyeOffset;
                        eyeY1 = y - eyeOffset;
                        eyeX2 = x - eyeOffset;
                        eyeY2 = y + eyeOffset;
                        break;
                    case 'right':
                    default:
                        eyeX1 = x + eyeOffset;
                        eyeY1 = y - eyeOffset;
                        eyeX2 = x + eyeOffset;
                        eyeY2 = y + eyeOffset;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
                ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 如果不是最后一段，连接当前段和下一段
            if (index < snake.length - 1) {
                const nextSegment = snake[index + 1];
                const nextX = nextSegment.x * gridSize + gridSize / 2;
                const nextY = nextSegment.y * gridSize + gridSize / 2;
                
                // 仅当两个段相邻时绘制连接线
                const dx = Math.abs(segment.x - nextSegment.x);
                const dy = Math.abs(segment.y - nextSegment.y);
                
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(nextX, nextY);
                    ctx.lineWidth = radius * 1.8;
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.stroke();
                }
            }
        });
        
        // 如果游戏暂停，显示暂停信息
        if (isPaused && gameRunning) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('暂停', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Arial';
            ctx.fillText('点击任意方向键继续', canvas.width / 2, canvas.height / 2 + 30);
        }
        
        // 如果有激活中的道具，显示倒计时
        if (powerUpActive && powerUpTimer) {
            const activeType = powerUpTypes.find(p => p.type === powerUpActive);
            if (activeType && activeType.duration > 0) {
                ctx.font = '14px Arial';
                ctx.fillStyle = activeType.color;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                
                const timeLeft = Math.ceil((powerUpEndTime - Date.now()) / 1000);
                const iconTemp = document.createElement('div');
                iconTemp.innerHTML = activeType.icon;
                const iconEl = iconTemp.firstChild;
                
                // 利用Font Awesome的类名来决定使用什么Unicode字符
                let iconChar = '⚡'; // 默认闪电
                if (iconEl.classList.contains('fa-shield-alt')) {
                    iconChar = '🛡️';
                }
                
                ctx.fillText(`${iconChar} ${timeLeft}s`, canvas.width - 10, 10);
            }
        }
    }
    
    // 更新游戏状态
    function update() {
        // 如果暂停，不更新
        if (isPaused) return;
        
        // 如果没有方向，不更新
        if (!direction) return;
        
        // 更新方向
        if (nextDirection) {
            direction = nextDirection;
            nextDirection = '';
        }
        
        // 获取蛇头
        const head = {...snake[0]};
        
        // 根据方向移动
        switch (direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // 检查是否吃到食物
        let foodEaten = false;
        let foodIndex = -1;
        
        for (let i = 0; i < foods.length; i++) {
            if (head.x === foods[i].x && head.y === foods[i].y) {
                foodEaten = true;
                foodIndex = i;
                break;
            }
        }
        
        // 检查是否吃到道具
        let powerUpCollected = false;
        let powerUpIndex = -1;
        
        for (let i = 0; i < powerUps.length; i++) {
            if (head.x === powerUps[i].x && head.y === powerUps[i].y) {
                powerUpCollected = true;
                powerUpIndex = i;
                break;
            }
        }
        
        // 检查游戏结束条件
        if (!isInvincible) {
            // 检查撞墙
            if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
                gameOver();
                return;
            }
            
            // 检查撞到障碍物
            for (let obstacle of obstacles) {
                if (head.x === obstacle.x && head.y === obstacle.y) {
                    gameOver();
                    return;
                }
            }
            
            // 检查撞到自己
            for (let segment of snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver();
                    return;
                }
            }
        } else {
            // 无敌状态下处理边界
            if (head.x < 0) head.x = gridWidth - 1;
            else if (head.x >= gridWidth) head.x = 0;
            
            if (head.y < 0) head.y = gridHeight - 1;
            else if (head.y >= gridHeight) head.y = 0;
        }
        
        // 添加新的头部
        snake.unshift(head);
        
        // 如果吃到食物
        if (foodEaten && foodIndex !== -1) {
            // 获取食物类型和分数
            const food = foods[foodIndex];
            
            // 增加分数
            score += food.points;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                updateScoreDisplay();
                
                // 显示最高分通知
                if (score > 0) { // 避免初始化时显示
                    showNotification('新的最高分！', '#FF5722');
                }
            }
            
            // 根据食物类型显示不同通知
            if (food.type === 'bonus') {
                showNotification(`+${food.points}分 奖励食物！`, '#FFC107');
            } else if (food.type === 'special') {
                showNotification(`+${food.points}分 特殊食物！`, '#9C27B0');
            }
            
            // 移除被吃掉的食物
            foods.splice(foodIndex, 1);
            
            // 升级判断：每100分升一级
            if (score >= level * 100) {
                levelUp();
            }
            
            // 增加速度
            if (score % 50 === 0 && speed > 50) {
                speed -= 5;
                clearInterval(gameInterval);
                gameInterval = setInterval(update, speed);
                
                // 显示速度提升通知
                showNotification('速度提升！', '#2196F3');
            }
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除尾部
            snake.pop();
        }
        
        // 如果吃到道具
        if (powerUpCollected && powerUpIndex !== -1) {
            const powerUp = powerUps[powerUpIndex];
            activatePowerUp(powerUp);
            powerUps.splice(powerUpIndex, 1);
        }
        
        // 清理过期的食物和道具
        foods = foods.filter(food => !food.expired);
        powerUps = powerUps.filter(powerUp => !powerUp.expired);
        
        // 如果食物数量不足，生成新食物
        if (foods.length < 1 + Math.floor(level / 3)) {
            generateNewFood();
        }
        
        // 重新绘制
        draw();
    }
    
    // 升级
    function levelUp() {
        level++;
        
        // 更新关卡显示
        levelElement.textContent = level;
        
        // 显示升级提示
        const originalFillStyle = ctx.fillStyle;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#FFC107';
        ctx.textAlign = 'center';
        ctx.fillText(`升级到 ${level} 级!`, canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('游戏将变得更具挑战性', canvas.width / 2, canvas.height / 2 + 20);
        
        // 显示通知
        showNotification(`恭喜！升级到${level}级！`, '#FFC107');
        
        // 暂停游戏一会儿
        isPaused = true;
        setTimeout(() => {
            isPaused = false;
            
            // 设置新关卡
            setupLevel(level);
            ctx.fillStyle = originalFillStyle;
        }, 2000);
    }
    
    // 激活道具
    function activatePowerUp(powerUp) {
        // 如果已有激活的道具，取消其效果
        if (powerUpActive && powerUpEndEffect) {
            powerUpEndEffect();
            clearTimeout(powerUpTimer);
        }
        
        // 应用新道具效果
        powerUpActive = powerUp.type;
        powerUpEndEffect = powerUp.effect();
        
        // 显示通知
        let notificationText = '';
        let notificationColor = '';
        
        switch (powerUp.type) {
            case 'speed':
                notificationText = '获得加速道具！';
                notificationColor = '#2196F3';
                break;
            case 'invincible':
                notificationText = '获得无敌道具！';
                notificationColor = '#CDDC39';
                break;
            case 'shorter':
                notificationText = '蛇身减半！';
                notificationColor = '#FF5722';
                break;
        }
        
        showNotification(notificationText, notificationColor);
        
        // 如果道具有持续时间，设置计时器
        if (powerUp.duration > 0) {
            powerUpEndTime = Date.now() + powerUp.duration;
            powerUpTimer = setTimeout(() => {
                if (powerUpEndEffect) powerUpEndEffect();
                powerUpActive = null;
                powerUpEndEffect = null;
                powerUpTimer = null;
                
                // 显示道具结束通知
                showNotification('道具效果已结束', '#607D8B');
            }, powerUp.duration);
        } else {
            // 如果没有持续时间，立即结束效果
            powerUpActive = null;
            powerUpEndEffect = null;
        }
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        gameRunning = false;
        startBtn.style.display = 'none';
        restartBtn.style.display = 'block';
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 更新游戏结束覆盖层中的分数
        finalScoreElement.textContent = score;
        finalHighScoreElement.textContent = highScore;
        finalLevelElement.textContent = level;
        
        // 显示游戏结束覆盖层
        gameOverOverlay.classList.add('active');
        
        // 显示游戏结束通知
        showNotification('游戏结束！', '#F44336');
    }
    
    // 更新分数显示
    function updateScoreDisplay() {
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        levelElement.textContent = level;
    }
    
    // 开始游戏
    function startGame() {
        if (gameRunning) return;
        
        initGame();
        gameRunning = true;
        isPaused = false;
        direction = 'right'; // 默认向右开始
        gameInterval = setInterval(update, speed);
        
        startBtn.style.display = 'none';
        restartBtn.style.display = 'block';
        
        // 显示开始游戏通知
        showNotification('游戏开始！', '#4CAF50');
    }
    
    // 暂停游戏
    function togglePause() {
        if (!gameRunning) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameInterval);
            showNotification('游戏暂停', '#607D8B');
        } else {
            gameInterval = setInterval(update, speed);
            showNotification('游戏继续', '#4CAF50');
        }
        
        draw();
    }
    
    // 重新开始游戏
    function restartGame() {
        clearInterval(gameInterval);
        if (powerUpTimer) {
            clearTimeout(powerUpTimer);
        }
        startGame();
    }
    
    // 设置方向
    function setDirection(dir) {
        // 如果游戏暂停，恢复游戏
        if (isPaused) {
            isPaused = false;
            gameInterval = setInterval(update, speed);
            draw();
            return;
        }
        
        // 防止180度转弯
        if (direction === 'up' && dir === 'down') return;
        if (direction === 'down' && dir === 'up') return;
        if (direction === 'left' && dir === 'right') return;
        if (direction === 'right' && dir === 'left') return;
        
        nextDirection = dir;
    }
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setDirection('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                setDirection('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setDirection('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                setDirection('right');
                break;
            case ' ':  // 空格键暂停
                e.preventDefault();
                togglePause();
                break;
        }
    });
    
    // 触摸控制 - 方向按钮
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning) setDirection('up');
    });
    
    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning) setDirection('down');
    });
    
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning) setDirection('left');
    });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning) setDirection('right');
    });
    
    // 鼠标控制 - 方向按钮（兼容PC）
    upBtn.addEventListener('click', () => {
        if (gameRunning) setDirection('up');
    });
    
    downBtn.addEventListener('click', () => {
        if (gameRunning) setDirection('down');
    });
    
    leftBtn.addEventListener('click', () => {
        if (gameRunning) setDirection('left');
    });
    
    rightBtn.addEventListener('click', () => {
        if (gameRunning) setDirection('right');
    });
    
    // 添加触摸滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameRunning || isPaused) return;
        
        e.preventDefault();
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 确定滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 0) {
                setDirection('right');
            } else {
                setDirection('left');
            }
        } else {
            // 垂直滑动
            if (diffY > 0) {
                setDirection('down');
            } else {
                setDirection('up');
            }
        }
        
        // 更新起始点，使滑动更流畅
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }, { passive: false });
    
    // 显示通知消息
    function showNotification(message, color = '#4CAF50') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.backgroundColor = color;
        
        notificationsContainer.appendChild(notification);
        
        // 3秒后移除通知
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // 游戏相关事件处理
    function setupGameEvents() {
        // 帮助按钮点击事件
        helpBtn.addEventListener('click', () => {
            gameHelp.style.display = 'flex';
            // 如果游戏正在运行，暂停游戏
            if (gameRunning && !isPaused) {
                togglePause();
            }
        });
        
        // 关闭帮助按钮点击事件
        closeHelpBtn.addEventListener('click', () => {
            gameHelp.style.display = 'none';
        });
        
        // 暂停按钮点击事件
        pauseBtn.addEventListener('click', () => {
            if (gameRunning) {
                togglePause();
            }
        });
        
        // 再玩一次按钮点击事件
        playAgainBtn.addEventListener('click', () => {
            gameOverOverlay.classList.remove('active');
            restartGame();
        });
    }
    
    // 游戏按钮
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    // 屏幕尺寸变化时重新适应
    window.addEventListener('resize', () => {
        if (gameRunning) {
            // 保存当前游戏状态
            clearInterval(gameInterval);
            setupCanvas();
            draw();
            if (!isPaused) {
                gameInterval = setInterval(update, speed);
            }
        } else {
            setupCanvas();
            initGame();
        }
    });
    
    // 阻止滑动时的浏览器默认行为
    document.addEventListener('touchmove', (e) => {
        if (gameRunning) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 设置游戏事件
    setupGameEvents();
    
    // 初始化游戏
    initGame();
}); 
