// Game constants and variables
const BOARD_SIZE = 9;
const PIECE_AREA_COUNT = 3;
const PARTICLES_ENABLED = true;

// DOM Elements
let gameBoardElement;
let pieceContainerElement;
let scoreElement;
let comboDisplayElement;
let gameOverScreenElement;
let finalScoreElement;
let restartButtonElement;
let playAgainButtonElement;
let feedbackTextElement;
let particleContainer = null;

// Game State
let board = [];
let score = 0;
let currentPieces = [];
let draggedPiece = null;
let isGameOver = false;
let comboMultiplier = 0;
let consecutiveClears = 0;
let highlightedCells = []; // For drag highlight
let touchStartRelative = { row: 0, col: 0 }; // For touch

// Audios
const audioFiles = {
    good: 'good.mp3',
    great: 'great.mp3',
    fantastic: 'fantastic.mp3',
    excellent: 'excellent.mp3',
    unbelievable: 'unbelievable.mp3',
};
let sounds = {};

// Piece Definitions
const PIECES = [
    // Single Block (1x1)
    { shape: [[1]], colorClass: 'color-1', points: 1 },
    // Domino (1x2)
    { shape: [[1, 1]], colorClass: 'color-2', points: 2 },
    // Domino Vertical (2x1)
    { shape: [[1], [1]], colorClass: 'color-2', points: 2 },
    // Trio (1x3)
    { shape: [[1, 1, 1]], colorClass: 'color-3', points: 3 },
    // Trio Vertical (3x1)
    { shape: [[1], [1], [1]], colorClass: 'color-3', points: 3 },
    // Square (2x2)
    { shape: [[1, 1], [1, 1]], colorClass: 'color-4', points: 4 },
    // L-Shape (Multiple variations for variety)
    { shape: [[1, 0], [1, 0], [1, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[0, 1], [0, 1], [1, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1, 1], [1, 0, 0]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1, 1], [0, 0, 1]], colorClass: 'color-5', points: 5 },
    // T-Shape (Multiple variations)
    { shape: [[1, 1, 1], [0, 1, 0]], colorClass: 'color-6', points: 5 },
    { shape: [[0, 1, 0], [1, 1, 1]], colorClass: 'color-6', points: 5 },
    { shape: [[1, 0], [1, 1], [1, 0]], colorClass: 'color-6', points: 5 },
    { shape: [[0, 1], [1, 1], [0, 1]], colorClass: 'color-6', points: 5 },
    // Line (1x4)
    { shape: [[1, 1, 1, 1]], colorClass: 'color-7', points: 4 },
    // Line Vertical (4x1)
    { shape: [[1], [1], [1], [1]], colorClass: 'color-7', points: 4 },
    // Large Square (3x3)
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], colorClass: 'color-1', points: 9 },
    // Other shapes
    { shape: [[1, 1, 0], [0, 1, 1]], colorClass: 'color-2', points: 4 }, // S-shape
    { shape: [[0, 1, 1], [1, 1, 0]], colorClass: 'color-2', points: 4 }, // Z-shape
];

// --- Initialization --- 
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing game...");
    initializeGameElements();
    preloadAudios();
    startGame();
});

function initializeGameElements() {
    console.log("Initializing game elements...");
    gameBoardElement = document.getElementById('game-board');
    pieceContainerElement = document.getElementById('piece-container');
    scoreElement = document.getElementById('score');
    comboDisplayElement = document.getElementById('combo-display');
    gameOverScreenElement = document.getElementById('game-over-screen');
    finalScoreElement = document.getElementById('final-score');
    restartButtonElement = document.getElementById('restart-button');
    playAgainButtonElement = document.getElementById('play-again-button');
    feedbackTextElement = document.getElementById('feedback-text');

    // Add Event Listeners
    if (restartButtonElement) restartButtonElement.addEventListener('click', startGame);
    if (playAgainButtonElement) playAgainButtonElement.addEventListener('click', startGame);

    // Create particle container
    if (PARTICLES_ENABLED && !document.getElementById('particle-container')) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        // Append to the main game container or body
        document.querySelector('.game-container')?.appendChild(particleContainer) || document.body.appendChild(particleContainer);
    }
    console.log("Game elements initialized.");
}

function preloadAudios() {
    console.log("Preloading audios...");
    for (const key in audioFiles) {
        sounds[key] = new Audio(audioFiles[key]);
        sounds[key].preload = 'auto';
        sounds[key].onerror = () => {
            console.warn(`Could not load audio: ${audioFiles[key]}`);
            sounds[key] = null;
        };
    }
}

// --- Game Core Logic --- 
function startGame() {
    if (!gameBoardElement || !pieceContainerElement) {
        console.error("Cannot start game: Core elements not found.");
        return;
    }
    console.log("Starting new game...");
    isGameOver = false;
    score = 0;
    comboMultiplier = 0;
    consecutiveClears = 0;
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));

    // Reset UI
    gameBoardElement.innerHTML = '';
    pieceContainerElement.innerHTML = '';
    gameOverScreenElement.classList.add('hidden');
    if(feedbackTextElement) feedbackTextElement.className = '';
    updateScore(0); // Pass 0 to reset display
    updateComboDisplay(); // Reset combo display

    // Create Board Cells
    gameBoardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, var(--cell-size))`;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            addDropListeners(cell);
            gameBoardElement.appendChild(cell);
        }
    }

    // Generate Initial Pieces
    currentPieces = [];
    generateNewPieces();

    console.log("Game started. Board and pieces initialized.");
}

function getRandomPiece() {
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    return { ...PIECES[randomIndex] }; // Return a copy
}

function generateNewPieces() {
    pieceContainerElement.innerHTML = '';
    currentPieces = [];
    for (let i = 0; i < PIECE_AREA_COUNT; i++) {
        const pieceData = getRandomPiece();
        const pieceElement = createPieceElement(pieceData);
        pieceContainerElement.appendChild(pieceElement);
        currentPieces.push(pieceElement);
    }
    // Check game over immediately after generating new pieces
    if (checkGameOver()) {
        handleGameOver();
    }
    console.log("Generated new pieces:", currentPieces.length);
}

function createPieceElement(pieceData) {
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece');
    pieceElement.draggable = true;
    // Store data stringified for simplicity
    pieceElement.dataset.piece = JSON.stringify(pieceData);

    const shape = pieceData.shape;
    const rows = shape.length;
    const cols = shape[0].length;

    pieceElement.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
    pieceElement.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    pieceElement.style.width = `calc(${cols} * var(--cell-size) + ${cols > 1 ? (cols - 1) * 2 : 0}px)`; // Adjust for gap
    pieceElement.style.height = `calc(${rows} * var(--cell-size) + ${rows > 1 ? (rows - 1) * 2 : 0}px)`; // Adjust for gap

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('piece-cell');
            if (shape[r][c] === 1) {
                cell.classList.add(pieceData.colorClass);
                cell.dataset.relRow = r;
                cell.dataset.relCol = c;
            } else {
                cell.classList.add('empty');
            }
            pieceElement.appendChild(cell);
        }
    }

    addDragListeners(pieceElement);
    addTouchListeners(pieceElement);

    return pieceElement;
}

// --- Drag and Drop Logic --- 
function addDropListeners(cell) {
    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('dragenter', handleDragEnter);
    cell.addEventListener('dragleave', handleDragLeave);
    cell.addEventListener('drop', handleDrop);
}

function addDragListeners(pieceElement) {
    pieceElement.addEventListener('dragstart', handleDragStart);
    pieceElement.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(event) {
    if (isGameOver) return event.preventDefault();

    const targetCell = event.target.closest('.piece-cell');
    let relRow = 0, relCol = 0;
    if (targetCell && !targetCell.classList.contains('empty')) {
        relRow = parseInt(targetCell.dataset.relRow);
        relCol = parseInt(targetCell.dataset.relCol);
    }

    const pieceElement = event.currentTarget;
    draggedPiece = {
        element: pieceElement,
        pieceData: JSON.parse(pieceElement.dataset.piece),
        relativeStart: { row: relRow, col: relCol }
    };
    console.log("Drag start, rel:", relRow, relCol);

    event.dataTransfer.effectAllowed = 'move';
    // Make the original piece semi-transparent using CSS class
    setTimeout(() => pieceElement.classList.add('dragging'), 0);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
    event.preventDefault();
    const targetCell = event.target.closest('.cell');
    if (targetCell && !targetCell.classList.contains('occupied') && draggedPiece) {
        console.log('[handleDragEnter] Entered cell:', targetCell.dataset.row, targetCell.dataset.col);
        addDragOverHighlight(targetCell);
    }
}

function handleDragLeave(event) {
    const relatedTarget = event.relatedTarget ? event.relatedTarget.closest('.cell') : null;
    if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
        const isLeavingHighlightedArea = highlightedCells.length > 0 && !highlightedCells.some(cell => cell === relatedTarget);
        if (isLeavingHighlightedArea || !relatedTarget) {
            console.log('[handleDragLeave] Leaving highlighted area or board.');
            removeDragOverHighlight();
        }
    }
}

function handleDrop(event) {
    console.log('[handleDrop] Drop event fired on cell:', event.target);
    event.preventDefault();

    if (!draggedPiece) return console.error("Drop event fired but no draggedPiece info available.");

    const targetCell = event.target.closest('.cell');
    if (!targetCell) return removeDragOverHighlight(); // Dropped outside valid cell

    const targetRow = parseInt(targetCell.dataset.row);
    const targetCol = parseInt(targetCell.dataset.col);
    const startRow = targetRow - draggedPiece.relativeStart.row;
    const startCol = targetCol - draggedPiece.relativeStart.col;

    console.log(`[handleDrop] Dropped on cell (${targetRow}, ${targetCol}). Calculated piece origin: (${startRow}, ${startCol})`);

    // Use the globally stored validity flag (set by addDragOverHighlight)
    if (window.currentPlacementValid) {
        handleDropLogic(startRow, startCol);
    } else {
        console.log("Drop ignored: Placement was marked as invalid.");
        removeDragOverHighlight();
        // Reset dragged piece visual state in dragend
    }
}

function handleDragEnd(event) {
    console.log("Drag end");
    if (draggedPiece && draggedPiece.element) {
        draggedPiece.element.classList.remove('dragging');
    }
    removeDragOverHighlight();
    draggedPiece = null;
    window.currentPlacementValid = false;
}

// --- Touch Logic --- 
function addTouchListeners(pieceElement) {
    pieceElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    pieceElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    pieceElement.addEventListener('touchend', handleTouchEnd);
    pieceElement.addEventListener('touchcancel', handleTouchEnd); // Treat cancel like end
}

let touchClone = null; // Clone for visual feedback
let currentTouchTarget = null; // Cell the touch is currently over

function handleTouchStart(e) {
    if (isGameOver || e.touches.length !== 1) return;
    e.preventDefault();

    const pieceElement = e.currentTarget;
    const touch = e.touches[0];

    const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
    let relRow = 0, relCol = 0;
    if (targetCell && targetCell.classList.contains('piece-cell') && !targetCell.classList.contains('empty')) {
        relRow = parseInt(targetCell.dataset.relRow);
        relCol = parseInt(targetCell.dataset.relCol);
    } else {
        return; // Touch didn't start on a solid part
    }
    touchStartRelative = { row: relRow, col: relCol };

    draggedPiece = {
        element: pieceElement,
        pieceData: JSON.parse(pieceElement.dataset.piece),
        relativeStart: touchStartRelative // Use same structure for consistency
    };

    // Create and position clone
    touchClone = pieceElement.cloneNode(true);
    touchClone.style.position = 'absolute';
    touchClone.style.zIndex = '1000';
    touchClone.style.opacity = '0.7';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.transform = 'scale(1.1)'; // Apply hover effect
    document.body.appendChild(touchClone);

    // Calculate offset from top-left of piece element to touch point
    const pieceRect = pieceElement.getBoundingClientRect();
    draggedPiece.touchOffset = {
        x: touch.clientX - pieceRect.left,
        y: touch.clientY - pieceRect.top
    };

    // Initial position based on touch offset
    touchClone.style.left = `${touch.clientX - draggedPiece.touchOffset.x}px`;
    touchClone.style.top = `${touch.clientY - draggedPiece.touchOffset.y}px`;

    pieceElement.classList.add('dragging'); // Dim original
    console.log("Touch start, rel:", touchStartRelative.row, touchStartRelative.col);
}

function handleTouchMove(e) {
    if (!draggedPiece || !touchClone || isGameOver || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    // Move the clone
    touchClone.style.left = `${currentX - draggedPiece.touchOffset.x}px`;
    touchClone.style.top = `${currentY - draggedPiece.touchOffset.y}px`;

    // Highlighting Logic
    touchClone.style.display = 'none';
    const elementUnderTouch = document.elementFromPoint(currentX, currentY);
    touchClone.style.display = '';

    let targetBoardCell = elementUnderTouch ? elementUnderTouch.closest('.cell') : null;

    if (targetBoardCell) {
        if (targetBoardCell !== currentTouchTarget) {
            removeDragOverHighlight();
            addDragOverHighlight(targetBoardCell);
            currentTouchTarget = targetBoardCell;
        }
    } else {
        if (currentTouchTarget) {
            removeDragOverHighlight();
            currentTouchTarget = null;
        }
    }
}

function handleTouchEnd(e) {
    if (!draggedPiece || isGameOver) return; // Ensure draggedPiece exists
    console.log("Touch end");

    let finalTargetCell = currentTouchTarget; // Use the last known cell from touchmove

    if (finalTargetCell) {
        const targetRow = parseInt(finalTargetCell.dataset.row);
        const targetCol = parseInt(finalTargetCell.dataset.col);
        const startRow = targetRow - draggedPiece.relativeStart.row;
        const startCol = targetCol - draggedPiece.relativeStart.col;

        console.log(`[TouchEnd] Target cell (${targetRow}, ${targetCol}). Calculated origin: (${startRow}, ${startCol})`);

        // Rely on validity check from addDragOverHighlight
        if (window.currentPlacementValid) {
             handleDropLogic(startRow, startCol);
        } else {
            console.log("TouchEnd ignored: Placement was marked as invalid.");
            removeDragOverHighlight();
            draggedPiece.element.classList.remove('dragging'); // Restore original
        }
    } else {
        // Finger lifted outside a valid drop target
         removeDragOverHighlight();
         if (draggedPiece.element) {
             draggedPiece.element.classList.remove('dragging');
         }
         console.log("Touch ended outside board or on invalid target");
    }

    // Cleanup
    if (touchClone && touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
    }
    touchClone = null;
    currentTouchTarget = null;
    if (draggedPiece && draggedPiece.element) {
         draggedPiece.element.classList.remove('dragging'); // Ensure removal
    }
    draggedPiece = null;
    window.currentPlacementValid = false;
}

// --- Placement and Clearing Logic --- 

// Shared logic for drop and touch end
function handleDropLogic(startRow, startCol) {
    if (!draggedPiece) return console.error("handleDropLogic called without draggedPiece set!");

    const pieceData = draggedPiece.pieceData;
    const pieceElement = draggedPiece.element;
    console.log(`[handleDropLogic] Attempting placement for piece at (${startRow}, ${startCol})`);

    if (canPlacePiece(pieceData.shape, startRow, startCol)) {
        console.log(`[handleDropLogic] Placement valid at (${startRow}, ${startCol}). Placing piece.`);
        placePiece(pieceData, startRow, startCol);
        updateScore(pieceData.points);

        // Remove the placed piece from the container and state
        pieceElement.remove();
        const pieceIndex = currentPieces.indexOf(pieceElement);
        if (pieceIndex > -1) currentPieces.splice(pieceIndex, 1);

        // Clear completed lines/squares (handles combo increase)
        const clearedCount = clearCompletedLines();

        // Reset combo if piece placed and nothing cleared
        if (clearedCount === 0) {
            resetCombo();
        }

        // Generate new pieces if the container is empty
        if (pieceContainerElement.childElementCount === 0) {
            console.log("Piece container empty, generating new pieces.");
            generateNewPieces();
        } else {
             // If not empty, still need to check if game over for remaining pieces
             if (checkGameOver()) {
                 handleGameOver();
             }
        }
    } else {
        console.log(`Cannot place piece at (${startRow}, ${startCol}).`);
        // Piece snaps back visually via dragend/touchend cleanup
        if (pieceElement) pieceElement.classList.remove('dragging');
    }

    // Final cleanup after any drop attempt
    removeDragOverHighlight();
    draggedPiece = null;
    window.currentPlacementValid = false;
}

function canPlacePiece(shape, startRow, startCol) {
    const rows = shape.length;
    const cols = shape[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                if (boardRow < 0 || boardRow >= BOARD_SIZE || boardCol < 0 || boardCol >= BOARD_SIZE || board[boardRow]?.[boardCol] !== 0) {
                    // console.log(`[canPlacePiece] FAILED at (${boardRow}, ${boardCol})`); // Verbose log
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(pieceData, startRow, startCol) {
    const shape = pieceData.shape;
    // Find a unique ID (e.g., index + 1) or use color class itself if state only needs visual info
    const pieceId = PIECES.findIndex(p => p.colorClass === pieceData.colorClass) + 1 || 1; // Example ID

    gameBoardElement.classList.add('board-flash');
    setTimeout(() => gameBoardElement.classList.remove('board-flash'), 100);

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                if (boardRow < BOARD_SIZE && boardCol < BOARD_SIZE) {
                    board[boardRow][boardCol] = pieceId; // Update state
                    const cellElement = gameBoardElement.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    if (cellElement) {
                        cellElement.classList.add('occupied', pieceData.colorClass, 'placed');
                        if (PARTICLES_ENABLED) createPlacementParticles(cellElement, pieceData.colorClass);
                        setTimeout(() => cellElement.classList.remove('placed'), 350);
                    }
                }
            }
        }
    }
    console.log(`Piece placed at (${startRow}, ${startCol})`);
    // playSound('place');
}

function clearCompletedLines() {
    let rowsToClear = [];
    let colsToClear = [];
    let cellsToClearElements = new Set();

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r].every(cellValue => cellValue !== 0)) {
            rowsToClear.push(r);
        }
    }
    // Check columns
    for (let c = 0; c < BOARD_SIZE; c++) {
        let colFull = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (board[r][c] === 0) { colFull = false; break; }
        }
        if (colFull) colsToClear.push(c);
    }

    // Collect unique cells to clear
    rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) {
            cellsToClearElements.add(gameBoardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
        }
    });
    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) {
            cellsToClearElements.add(gameBoardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
        }
    });

    const uniqueLinesCleared = new Set([...rowsToClear, ...colsToClear.map(c => `col-${c}`)]).size;
    const numCellsToClear = cellsToClearElements.size;

    if (numCellsToClear === 0) return 0; // Nothing to clear

    console.log(`Cells to clear: ${numCellsToClear}, Lines/Cols Cleared: ${uniqueLinesCleared}`);
    consecutiveClears++;
    comboMultiplier++;
    updateComboDisplay();

    // Animate clearing
    cellsToClearElements.forEach(cellElement => {
        if (cellElement) {
            cellElement.classList.add('clearing');
            PIECES.forEach(p => cellElement.classList.remove(p.colorClass));
            if (PARTICLES_ENABLED) createClearingParticles(cellElement);
        }
    });

    // Play sound and show feedback text
    handleClearFeedback(uniqueLinesCleared);

    // Calculate score
    let pointsPerCell = 10;
    let clearBonus = Math.pow(numCellsToClear, 1.7);
    let comboBonus = comboMultiplier > 1 ? comboMultiplier * 0.75 : 1;
    let pointsForClearing = Math.round((numCellsToClear * pointsPerCell + clearBonus) * comboBonus);

    // Shake board on large clears
    if (numCellsToClear >= BOARD_SIZE) {
        gameBoardElement.classList.add('board-shake');
        setTimeout(() => gameBoardElement.classList.remove('board-shake'), 500);
    }

    // Delay state update
    setTimeout(() => {
        // Update board state
        cellsToClearElements.forEach(cell => {
             if (cell) board[cell.dataset.row][cell.dataset.col] = 0;
        });
        // Update DOM
        cellsToClearElements.forEach(cellElement => {
            if (cellElement) cellElement.classList.remove('occupied', 'clearing');
        });
        updateScore(pointsForClearing);
        console.log(`Cleared ${numCellsToClear} cells (${uniqueLinesCleared} lines/cols). Awarded ${pointsForClearing} points.`);
        // Check game over again after clearing
        if (checkGameOver()) handleGameOver();
    }, 400); // Animation duration

    return numCellsToClear;
}

function handleClearFeedback(linesCleared) {
    let feedbackText = "";
    let soundToPlay = null;
    let isUnbelievable = false;

    switch (linesCleared) {
        case 1: feedbackText = "Good!"; soundToPlay = 'good'; break;
        case 2: feedbackText = "Great!"; soundToPlay = 'great'; break;
        case 3: feedbackText = "Fantastic!"; soundToPlay = 'fantastic'; break;
        case 4: feedbackText = "Excellent!"; soundToPlay = 'excellent'; break;
        default: // 5 or more
             if (linesCleared > 0) { // Only show for actual clears >= 5
                 feedbackText = "Unbelievable!";
                 soundToPlay = 'unbelievable';
                 isUnbelievable = true;
             }
            break;
    }

    if (soundToPlay) playSound(soundToPlay);

    if (feedbackText && feedbackTextElement) {
        feedbackTextElement.textContent = feedbackText;
        feedbackTextElement.className = 'show-feedback';
        void feedbackTextElement.offsetWidth;
        if (isUnbelievable) feedbackTextElement.classList.add('show-unbelievable');
        else feedbackTextElement.classList.remove('show-unbelievable');

        const animationDuration = isUnbelievable ? 1800 : 1500;
        setTimeout(() => {
            if (feedbackTextElement) {
                 feedbackTextElement.className = '';
                 feedbackTextElement.textContent = '';
            }
        }, animationDuration);
    }
}

function checkGameOver() {
    if (currentPieces.length === 0 && pieceContainerElement.childElementCount > 0) {
         // Pieces are visually present but not in state array - likely error, treat as game over?
         console.warn("Piece elements exist but currentPieces array is empty. Potential state mismatch.");
         // Let's try regenerating state from DOM as a fallback, though this indicates a bug
         currentPieces = Array.from(pieceContainerElement.querySelectorAll('.piece'));
         if (currentPieces.length === 0) return true; // If still no pieces, definitely game over
    }
    if (currentPieces.length === 0) return false; // No pieces, not game over yet (should generate)

    for (const pieceElement of currentPieces) {
        if (!pieceElement || !pieceElement.dataset || !pieceElement.dataset.piece) continue;
        try {
            const pieceData = JSON.parse(pieceElement.dataset.piece);
            const shape = pieceData.shape;
            for (let r = 0; r <= BOARD_SIZE - shape.length; r++) {
                for (let c = 0; c <= BOARD_SIZE - shape[0].length; c++) {
                    if (canPlacePiece(shape, r, c)) {
                        // console.log(`CheckGameOver: Piece can fit at (${r}, ${c})`);
                        return false; // Found a placement
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing piece data during game over check:", e, pieceElement.dataset.piece);
            continue; // Skip this piece if data is corrupt
        }
    }
    console.log("CheckGameOver: No available piece can be placed.");
    return true;
}

function handleGameOver() {
    if (isGameOver) return; // Prevent multiple calls
    isGameOver = true;
    finalScoreElement.textContent = score;
    gameOverScreenElement.classList.remove('hidden');
    console.log("GAME OVER! Final Score:", score);

    // Game Over Effects
    if (PARTICLES_ENABLED) {
        // Explosion effect
        const boardRect = gameBoardElement.getBoundingClientRect();
        const containerRect = particleContainer.getBoundingClientRect();
        const centerX = boardRect.left - containerRect.left + boardRect.width / 2;
        const centerY = boardRect.top - containerRect.top + boardRect.height / 2;
        for (let i = 0; i < 50; i++) { // More particles for game over
             const colors = ['#ff595e', '#ffd166', '#54c059', '#2d8fff', '#bf83fb', '#ff924c', '#5fc9f8'];
             createParticle(centerX, centerY, colors[i % colors.length], 2); // Faster
        }
    }
    pieceContainerElement.innerHTML = ''; // Clear remaining pieces visually
    // playSound('gameover');
}

// --- Utility and UI Functions --- 

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.warn(`Error playing sound ${soundName}:`, e));
    }
}

function updateScore(pointsToAdd) {
    if (typeof pointsToAdd === 'number') {
        score += pointsToAdd;
    }
    scoreElement.textContent = score;

    if (pointsToAdd > 0) {
        // Score animation
        scoreElement.classList.remove('updated');
        void scoreElement.offsetWidth;
        scoreElement.classList.add('updated');
        setTimeout(() => scoreElement.classList.remove('updated'), 200);
        // Floating points
        createFloatingPoints(pointsToAdd);
    }
    console.log("Score updated:", score);
}

function createFloatingPoints(points) {
     const floatingPoints = document.createElement('div');
     floatingPoints.className = 'floating-points';
     floatingPoints.textContent = `+${points}`;
     // Positioning relative to the score element within the header
     const scoreRect = scoreElement.getBoundingClientRect();
     const headerRect = scoreElement.closest('.game-header').getBoundingClientRect(); // Find header
     floatingPoints.style.left = `${scoreRect.right - headerRect.left + 10}px`; // Relative to header left
     floatingPoints.style.top = `${scoreRect.top - headerRect.top}px`;      // Relative to header top
     floatingPoints.style.animation = 'float-up 1.2s ease-out forwards';
     scoreElement.closest('.game-header').appendChild(floatingPoints);
     setTimeout(() => floatingPoints.remove(), 1200);
}

function updateComboDisplay() {
    if (comboMultiplier > 1) {
        let comboText = `Combo x${comboMultiplier}!`;
        if (comboMultiplier >= 5) comboText = `¡SUPER COMBO x${comboMultiplier}!`;
        else if (comboMultiplier >= 3) comboText = `¡Gran Combo x${comboMultiplier}!`;

        comboDisplayElement.textContent = comboText;
        comboDisplayElement.classList.add('visible');
        comboDisplayElement.classList.toggle('mega-combo', comboMultiplier >= 4);
    } else {
        comboDisplayElement.classList.remove('visible', 'mega-combo');
        // Clear text after fade out for cleaner state
        // setTimeout(() => { if(comboMultiplier <= 1) comboDisplayElement.textContent = ''; }, 300);
    }
}

function resetCombo() {
    if (comboMultiplier > 0) {
        console.log("Combo Reset.");
        comboMultiplier = 0;
        consecutiveClears = 0;
        updateComboDisplay();
    }
}

// --- Particle Functions --- 

function createPlacementParticles(cellElement, colorClass) {
    if (!particleContainer) return;
    const rect = cellElement.getBoundingClientRect();
    const containerRect = particleContainer.getBoundingClientRect();
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    const computedStyle = window.getComputedStyle(cellElement);
    const bgColor = computedStyle.backgroundColor || '#ffffff';
    const particleCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
        createParticle(centerX, centerY, bgColor);
    }
}

function createClearingParticles(cellElement) {
    if (!particleContainer) return;
    const rect = cellElement.getBoundingClientRect();
    const containerRect = particleContainer.getBoundingClientRect();
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    const particleColors = ['#ffff00', '#ffffff', '#ffff88'];
    const particleCount = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < particleCount; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        createParticle(centerX, centerY, color, 1.2);
    }
}

function createParticle(x, y, color, speedMultiplier = 1) {
    if (!particleContainer) return;
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = `${3 + Math.random() * 4}px`;
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = color;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.boxShadow = `0 0 ${2 + Math.random() * 3}px ${color}`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    const angle = Math.random() * 2 * Math.PI;
    const speed = (1 + Math.random() * 2) * speedMultiplier;
    const tx = Math.cos(angle) * speed * 20;
    const ty = Math.sin(angle) * speed * 20;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.animation = `particle-fade ${0.5 + Math.random() * 0.5}s forwards`;

    particleContainer.appendChild(particle);
    //setTimeout(() => particle.remove(), 1000); // Temporarily comment out to check if it causes the syntax error
}

// Highlight function for drag over
function addDragOverHighlight(targetCellElement) {
    if (!draggedPiece) return;
    removeDragOverHighlight(); // Clear previous

    const targetRow = parseInt(targetCellElement.dataset.row);
    const targetCol = parseInt(targetCellElement.dataset.col);
    const shape = draggedPiece.pieceData.shape;
    // Use relativeStart from draggedPiece (set in dragstart/touchstart)
    const startRow = targetRow - draggedPiece.relativeStart.row;
    const startCol = targetCol - draggedPiece.relativeStart.col;

    let canPlace = true;
    highlightedCells = []; // Reset list

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                const currentCell = gameBoardElement.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);

                if (!currentCell || board[boardRow]?.[boardCol] !== 0) {
                    canPlace = false;
                    if (currentCell) {
                        currentCell.classList.add('invalid-placement');
                        highlightedCells.push(currentCell);
                    }
                } else {
                    currentCell.classList.add('drag-over');
                    highlightedCells.push(currentCell);
                }
            }
        }
    }
    window.currentPlacementValid = canPlace; // Update validity flag
    console.log("Highlight check - canPlace:", canPlace);
}

function removeDragOverHighlight() {
    highlightedCells.forEach(cell => {
        cell.classList.remove('drag-over', 'invalid-placement');
    });
    highlightedCells = [];
    window.currentPlacementValid = false;
} 