// 테트리스 게임 - Vibe Coding 스타일 🎮

// 게임 설정
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// 색상 매핑
const colorMap = {
    'I': '#00ffff',
    'O': '#ffff00',
    'T': '#ff00ff',
    'S': '#00ff00',
    'Z': '#ff0000',
    'J': '#0000ff',
    'L': '#ff8800'
};

// 테트로미노 정의 (7가지 종류) - 색상 16진수값 포함
const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: 'I', hexColor: '#00ffff', name: 'I' },
    O: { shape: [[1,1], [1,1]], color: 'O', hexColor: '#ffff00', name: 'O' },
    T: { shape: [[0,1,0], [1,1,1]], color: 'T', hexColor: '#ff00ff', name: 'T' },
    S: { shape: [[0,1,1], [1,1,0]], color: 'S', hexColor: '#00ff00', name: 'S' },
    Z: { shape: [[1,1,0], [0,1,1]], color: 'Z', hexColor: '#ff0000', name: 'Z' },
    J: { shape: [[1,0,0], [1,1,1]], color: 'J', hexColor: '#0000ff', name: 'J' },
    L: { shape: [[0,0,1], [1,1,1]], color: 'L', hexColor: '#ff8800', name: 'L' }
};

// 게임 상태
let gameBoard = [];
let currentPiece = null;
let nextPiece = null;
let currentPos = { x: 0, y: 0 };
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lines = 0;
let level = 1;
let gameSpeed = 1000;
let gameLoopId = null;

// 초기화
function initBoard() {
    gameBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
}

// 게임 시작
function startGame() {
    initBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameSpeed = 1000;
    gameRunning = true;
    gamePaused = false;
    
    updateUI();
    generateNextPiece();
    spawnNewPiece();
    renderGame();
    renderNextPiece();
    gameLoop();
}

// 다음 블록 생성
function generateNextPiece() {
    const types = Object.keys(TETROMINOS);
    const randomType = types[Math.floor(Math.random() * types.length)];
    nextPiece = JSON.parse(JSON.stringify(TETROMINOS[randomType]));
}

// 새 블록 생성
function spawnNewPiece() {
    currentPiece = JSON.parse(JSON.stringify(nextPiece));
    currentPos = { x: 3, y: 0 };
    
    // 다음 블록 미리 생성
    generateNextPiece();
    renderNextPiece();
    
    // 게임 오버 체크 (블록이 생성될 위치에 이미 블록이 있으면)
    if (!canMove(currentPos.x, currentPos.y, currentPiece.shape)) {
        endGame();
    }
}

// 게임 루프
function gameLoop() {
    if (!gameRunning || gamePaused) {
        gameLoopId = setTimeout(gameLoop, gameSpeed);
        return;
    }
    
    // 블록을 아래로 이동할 수 있으면 이동
    if (canMove(currentPos.x, currentPos.y + 1, currentPiece.shape)) {
        currentPos.y++;
    } else {
        // 이동 불가능하면 블록을 고정
        lockPiece();
        
        // 완성된 라인 확인 및 삭제
        const deletedLines = deleteCompletedLines();
        
        // 점수 계산
        if (deletedLines > 0) {
            const points = [0, 100, 300, 500, 800][deletedLines] || 800;
            score += points;
            lines += deletedLines;
            
            // 레벨 상승 (10라인마다)
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                gameSpeed = Math.max(100, 1000 - (level - 1) * 100);
            }
        }
        
        // 새 블록 생성
        spawnNewPiece();
    }
    
    renderGame();
    updateUI();
    gameLoopId = setTimeout(gameLoop, gameSpeed);
}

// 블록 이동 가능 여부 확인
function canMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                // 경계 확인
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                // 다른 블록과의 충돌 확인
                if (newY >= 0 && gameBoard[newY][newX] !== null) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 블록 회전 (시계방향)
function rotatePiece() {
    const shape = currentPiece.shape;
    const rotated = [];
    
    for (let col = 0; col < shape[0].length; col++) {
        const row = [];
        for (let r = shape.length - 1; r >= 0; r--) {
            row.push(shape[r][col]);
        }
        rotated.push(row);
    }
    
    // 회전 가능한지 확인
    if (canMove(currentPos.x, currentPos.y, rotated)) {
        currentPiece.shape = rotated;
    }
}

// 블록 고정
function lockPiece() {
    const shape = currentPiece.shape;
    const color = currentPiece.color;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const y = currentPos.y + row;
                const x = currentPos.x + col;
                
                if (y >= 0) {
                    gameBoard[y][x] = color;
                }
            }
        }
    }
}

// 완성된 라인 삭제
function deleteCompletedLines() {
    let deletedCount = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (gameBoard[row].every(cell => cell !== null)) {
            gameBoard.splice(row, 1);
            gameBoard.unshift(Array(COLS).fill(null));
            deletedCount++;
        }
    }
    
    return deletedCount;
}

// 게임 렌더링
function renderGame() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // 게임 보드 표시
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const block = document.createElement('div');
            block.className = 'block';
            
            if (gameBoard[y][x]) {
                block.style.background = colorMap[gameBoard[y][x]];
                block.classList.add('filled', gameBoard[y][x]);
            } else {
                block.classList.add('empty');
            }
            
            board.appendChild(block);
        }
    }
    
    // 현재 블록 표시
    if (currentPiece) {
        const shape = currentPiece.shape;
        const blocks = board.querySelectorAll('.block');
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = currentPos.x + col;
                    const y = currentPos.y + row;
                    
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                        const index = y * COLS + x;
                        blocks[index].style.background = currentPiece.hexColor;
                        blocks[index].classList.add('filled', currentPiece.color);
                    }
                }
            }
        }
    }
}

// 다음 블록 미리보기 렌더링
function renderNextPiece() {
    const nextBoard = document.getElementById('nextBoard');
    nextBoard.innerHTML = '';
    
    // 4x4 미리보기 그리드
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const block = document.createElement('div');
            block.className = 'block empty';
            nextBoard.appendChild(block);
        }
    }
    
    // 다음 블록 표시 (중앙에 배치)
    if (nextPiece) {
        const shape = nextPiece.shape;
        const blocks = nextBoard.querySelectorAll('.block');
        
        // 도형을 중앙에 배치하기 위한 offset 계산
        const offsetX = Math.floor((4 - shape[0].length) / 2);
        const offsetY = Math.floor((4 - shape.length) / 2);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col;
                    const y = offsetY + row;
                    const index = y * 4 + x;
                    blocks[index].style.background = nextPiece.hexColor;
                    blocks[index].classList.remove('empty');
                    blocks[index].classList.add('filled', nextPiece.color);
                }
            }
        }
    }
}

// UI 업데이트
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 게임 오버
function endGame() {
    gameRunning = false;
    clearTimeout(gameLoopId);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOverModal').style.display = 'block';
}

// 일시정지 토글
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? '계속' : '일시정지';
}

// 키보드 입력
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (canMove(currentPos.x - 1, currentPos.y, currentPiece.shape)) {
                currentPos.x--;
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (canMove(currentPos.x + 1, currentPos.y, currentPiece.shape)) {
                currentPos.x++;
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (canMove(currentPos.x, currentPos.y + 1, currentPiece.shape)) {
                currentPos.y++;
            }
            break;
        case ' ':
            e.preventDefault();
            rotatePiece();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
    renderGame();
});
