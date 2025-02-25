document.addEventListener('DOMContentLoaded', () => {
    // 获取游戏元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // 游戏参数
    let snake = [];             // 蛇身体
    let food = {};              // 食物位置
    let gridSize = 20;          // 格子大小
    let gridWidth, gridHeight;  // 游戏网格尺寸
    let direction = '';         // 蛇移动方向
    let nextDirection = '';     // 下一个方向
    let gameInterval;           // 游戏循环
    let score = 0;              // 得分
    let speed = 150;            // 游戏速度(毫秒)
    let gameRunning = false;    // 游戏状态
    
    // 设置游戏画布尺寸
    function setupCanvas() {
        // 适应屏幕宽度
        let maxWidth = window.innerWidth > 500 ? 400 : window.innerWidth - 30;
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
        
        // 初始蛇位置 (居中)
        snake = [
            {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)}
        ];
        
        // 重置状态
        direction = '';
        nextDirection = '';
        score = 0;
        scoreElement.textContent = score;
        
        // 生成第一个食物
        generateFood();
        
        // 绘制初始状态
        draw();
    }
    
    // 生成食物
    function generateFood() {
        while (true) {
            food = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // 确保食物不出现在蛇身上
            let onSnake = false;
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
            
            if (!onSnake) break;
        }
    }
    
    // 绘制游戏画面
    function draw() {
        // 清空画布
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        ctx.fillStyle = '#4CAF50';
        snake.forEach((segment, index) => {
            // 蛇头颜色更深
            if (index === 0) ctx.fillStyle = '#388E3C';
            
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
            
            // 恢复蛇身颜色
            if (index === 0) ctx.fillStyle = '#4CAF50';
        });
        
        // 绘制食物
        ctx.fillStyle = '#F44336';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    }
    
    // 更新游戏状态
    function update() {
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
        
        // 检查游戏结束条件：撞墙
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            gameOver();
            return;
        }
        
        // 检查游戏结束条件：撞到自己
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                gameOver();
                return;
            }
        }
        
        // 添加新的头部
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 增加速度
            if (score % 50 === 0 && speed > 50) {
                speed -= 10;
                clearInterval(gameInterval);
                gameInterval = setInterval(update, speed);
            }
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除尾部
            snake.pop();
        }
        
        // 重新绘制
        draw();
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        gameRunning = false;
        startBtn.style.display = 'none';
        restartBtn.style.display = 'block';
        
        // 绘制游戏结束信息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '20px Arial';
        ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
    
    // 开始游戏
    function startGame() {
        if (gameRunning) return;
        
        initGame();
        gameRunning = true;
        direction = 'right'; // 默认向右开始
        gameInterval = setInterval(update, speed);
        
        startBtn.style.display = 'none';
        restartBtn.style.display = 'block';
    }
    
    // 重新开始游戏
    function restartGame() {
        clearInterval(gameInterval);
        startGame();
    }
    
    // 设置方向
    function setDirection(dir) {
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
            gameInterval = setInterval(update, speed);
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
    
    // 初始化游戏
    initGame();
}); 