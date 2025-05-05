// Game constants and variables will go here
const BOARD_SIZE = 9;
const PIECE_AREA_COUNT = 3; // Number of pieces available at a time
const PARTICLES_ENABLED = true; // Activar/desactivar partículas para dispositivos de bajo rendimiento

// --- Firebase Initialization and Auth Logic (v9 Compat) ---

// Import functions from the SDKs you need (assuming scripts are loaded in HTML)
// No se necesitan imports con la versión compat, usamos el objeto global firebase

// Uncomment if you use analytics:
// const { getAnalytics } = firebase.analytics;

// COPIA AQUÍ TU CONFIGURACIÓN DE FIREBASE
// Reemplaza este objeto vacío con tu configuración real
const firebaseConfig = {
    apiKey: "AIzaSyBL5r4EdRahfJezyMbV9BwtjuUJQ6ChzYc",
    authDomain: "blockblast-fe52b.firebaseapp.com",
    projectId: "blockblast-fe52b",
    storageBucket: "blockblast-fe52b.appspot.com",
    messagingSenderId: "540943521967",
    appId: "1:540943521967:web:f283b859e1c6eebf491c5a",
    measurementId: "G-8Z14MVF6YE"
};

let firebaseApp;
let firebaseAuth; // Usamos el estilo v8/compat
let googleProvider;
// let analytics; // Uncomment if you use analytics

// DOM Elements for Login
let loginScreenElement;
let gameWrapperElement;
let emailInputElement;
let passwordInputElement;
let loginButtonElement;
let signupButtonElement;
let googleSigninButtonElement;
let authErrorElement;
let loadingIndicatorElement;
let logoutButtonElement; // Botón de logout en el juego

// DOM Elements
let gameBoardElement;
let pieceContainerElement;
let scoreElement;
let comboDisplayElement;
let gameOverScreenElement;
let finalScoreElement;
let restartButtonElement;
let playAgainButtonElement;
let feedbackTextElement; // Elemento para texto de feedback

// Game State
let board = []; // 2D array representing the board state (0 = empty, 1-7 = piece color)
let score = 0;
let currentPieces = []; // Array to hold the 3 current piece elements
let draggedPiece = null; // Info about the piece being dragged { element, pieceData, offset }
let isGameOver = false;
let comboMultiplier = 0;
let consecutiveClears = 0; // Para combos extendidos
let particleContainer = null; // Contenedor para partículas

// Audios
const audioFiles = {
    good: 'good.mp3',
    great: 'great.mp3',
    fantastic: 'fantastic.mp3',
    excellent: 'excellent.mp3',
    unbelievable: 'unbelievable.mp3',
    // Opcional: añadir más sonidos
    // place: 'audios/place.mp3',
    // gameover: 'audios/gameover.mp3'
};
let sounds = {};

// Piece Definitions (shape and color class)
// 0 = empty, 1 = block
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
    // L-Shape (3 variations)
    { shape: [[1, 0], [1, 0], [1, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[0, 1], [0, 1], [1, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1, 1], [1, 0, 0]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1, 1], [0, 0, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1], [0, 1], [0, 1]], colorClass: 'color-5', points: 5 },
    { shape: [[1, 1], [1, 0], [1, 0]], colorClass: 'color-5', points: 5 },
    // T-Shape (4 variations)
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
    // Other interesting shapes
    { shape: [[1, 1, 0], [0, 1, 1]], colorClass: 'color-2', points: 4 }, // S-shape
    { shape: [[0, 1, 1], [1, 1, 0]], colorClass: 'color-2', points: 4 }, // Z-shape
    { shape: [[1]], colorClass: 'color-4', points: 1 }, // Extra 1x1
    { shape: [[1, 1]], colorClass: 'color-5', points: 2 }, // Extra 1x2
    { shape: [[1], [1]], colorClass: 'color-6', points: 2 }, // Extra 2x1
];


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing login elements and Firebase...");
    // Get Login DOM Elements
    loginScreenElement = document.getElementById('login-screen');
    emailInputElement = document.getElementById('email');
    passwordInputElement = document.getElementById('password');
    loginButtonElement = document.getElementById('login-button');
    signupButtonElement = document.getElementById('signup-button');
    googleSigninButtonElement = document.getElementById('google-signin-button');
    authErrorElement = document.getElementById('auth-error');
    loadingIndicatorElement = document.getElementById('loading-indicator');
    gameWrapperElement = document.getElementById('game-wrapper'); // Get wrapper early for hiding

    showLoading(true); // Mostrar carga mientras inicializa Firebase
    initializeFirebase(); // Initialize Firebase and Auth listeners

    // NO iniciar el juego aquí, esperar a onAuthStateChanged
    // startGame(); <-- NO LLAMAR AQUÍ
});

function initializeFirebase() {
    try {
        // Solo inicializa si la config tiene valores
        if (firebaseConfig.apiKey) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseAuth = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();
            // analytics = firebase.analytics(); // Estilo compat
            console.log("Firebase initialized successfully (compat).");
            setupAuthListeners(); // Configurar listeners DESPUÉS de inicializar
        } else {
            console.error("Firebase config is missing. Please paste your configuration object in script.js");
            showAuthError("Error de configuración. Contacta al administrador.");
            showLoading(false);
        }
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showAuthError("No se pudo conectar con el servicio de autenticación.");
        showLoading(false);
    }
}

function showLoading(isLoading) {
    if (loadingIndicatorElement) {
        loadingIndicatorElement.classList.toggle('hidden', !isLoading);
    }
     // Deshabilitar botones mientras carga
    if (loginButtonElement) loginButtonElement.disabled = isLoading;
    if (signupButtonElement) signupButtonElement.disabled = isLoading;
    if (googleSigninButtonElement) googleSigninButtonElement.disabled = isLoading;
}

function showAuthError(message) {
    if (authErrorElement) {
        authErrorElement.textContent = message;
    }
    // Opcional: quitar el error después de un tiempo
    // setTimeout(() => { if (authErrorElement) authErrorElement.textContent = ''; }, 5000);
}

function setupAuthListeners() {
    if (!firebaseAuth) {
        console.error("FirebaseAuth instance not available in setupAuthListeners.");
        return;
    }

    // Listen for auth state changes
    firebaseAuth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log("User signed in:", user.uid);
            showGame();
            startGameIfNeeded();
        } else {
            // User is signed out
            console.log("User signed out.");
            showLoginScreen();
            // Podríamos querer limpiar el estado del juego aquí si es necesario
            // resetGame(); // Implementar si se necesita
        }
        showLoading(false);
    });

    // Email/Password Login
    loginButtonElement.addEventListener('click', async () => {
        const email = emailInputElement.value;
        const password = passwordInputElement.value;
        showLoading(true);
        showAuthError(''); // Clear previous errors
        try {
            await firebaseAuth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged manejará el resto
        } catch (error) {           
            console.error("Login Error:", error.code, error.message);
             showAuthError(getFriendlyAuthErrorMessage(error));
             showLoading(false);
        }
    });

    // Email/Password Signup
    signupButtonElement.addEventListener('click', async () => {
        const email = emailInputElement.value;
        const password = passwordInputElement.value;
        showLoading(true);
        showAuthError('');
        try {
            await firebaseAuth.createUserWithEmailAndPassword(email, password);
             // onAuthStateChanged manejará el resto
        } catch (error) {
            console.error("Signup Error:", error.code, error.message);
             showAuthError(getFriendlyAuthErrorMessage(error));
             showLoading(false);
        }
    });

    // Google Sign-In
    googleSigninButtonElement.addEventListener('click', async () => {
        showLoading(true);
        showAuthError('');
        try {
            await firebaseAuth.signInWithPopup(googleProvider);
            // onAuthStateChanged manejará el resto
        } catch (error) {
             console.error("Google Sign-In Error:", error.code, error.message);
             // Manejar errores específicos como popup cerrado
             if (error.code !== 'auth/popup-closed-by-user') {
                 showAuthError(getFriendlyAuthErrorMessage(error));
             }
            showLoading(false);
        }
    });
}

function getFriendlyAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'El formato del correo electrónico no es válido.';
        case 'auth/user-disabled':
            return 'Esta cuenta de usuario ha sido deshabilitada.';
        case 'auth/user-not-found':
            return 'No se encontró ninguna cuenta con este correo electrónico.';
        case 'auth/wrong-password':
            return 'La contraseña es incorrecta.';
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/operation-not-allowed':
             return 'El inicio de sesión con correo/contraseña no está habilitado.';
         case 'auth/popup-closed-by-user':
             return ''; // No mostrar error si el usuario cierra el popup
         case 'auth/cancelled-popup-request':
             return ''; // No mostrar error
        default:
            return 'Ocurrió un error de autenticación. Inténtalo de nuevo.';
    }
}

function showLoginScreen() {
    if (loginScreenElement) loginScreenElement.classList.remove('hidden');
    if (gameWrapperElement) gameWrapperElement.classList.add('hidden');
    document.body.classList.remove('game-active');
}

function showGame() {
    if (loginScreenElement) loginScreenElement.classList.add('hidden');
    if (gameWrapperElement) gameWrapperElement.classList.remove('hidden');
    document.body.classList.add('game-active');
}

let gameInitialized = false; // Flag to prevent multiple initializations

function startGameIfNeeded() {
    if (!gameInitialized) {
        console.log("User logged in, initializing game...");
        initializeGameElements(); // Asegurarse de que los elementos del juego estén listos
        startGame();
        gameInitialized = true;
    }
}

function initializeGameElements() {
    console.log("Initializing game elements...");
    // Get Game DOM Elements
    gameWrapperElement = document.getElementById('game-wrapper'); // Wrapper general
    gameBoardElement = document.getElementById('game-board');
    pieceContainerElement = document.getElementById('piece-container');
    scoreElement = document.getElementById('score');
    comboDisplayElement = document.getElementById('combo-display');
    gameOverScreenElement = document.getElementById('game-over-screen');
    finalScoreElement = document.getElementById('final-score');
    restartButtonElement = document.getElementById('restart-button');
    playAgainButtonElement = document.getElementById('play-again-button');
    feedbackTextElement = document.getElementById('feedback-text');
    particleContainer = document.getElementById('particle-container');
    logoutButtonElement = document.getElementById('logout-button'); // Botón de logout

    // Add Game Event Listeners (only if elements exist)
    if (restartButtonElement) restartButtonElement.addEventListener('click', startGame);
    if (playAgainButtonElement) playAgainButtonElement.addEventListener('click', startGame);
    if (logoutButtonElement) {
        logoutButtonElement.addEventListener('click', async () => {
            try {
                await firebaseAuth.signOut();
                gameInitialized = false; // Permitir reinicializar el juego si vuelve a entrar
            } catch (error) {
                console.error("Logout Error:", error);
            }
        });
    }

    // Crear el contenedor de partículas (si no existe)
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        // Añadir al wrapper del juego en lugar de directamente al body o game-container
        if(gameWrapperElement) gameWrapperElement.appendChild(particleContainer);
    }

     // Precargar audios
    preloadAudios();
    console.log("Game elements initialized.");
}

function startGame() {
    // Asegurarse de que los elementos del juego existen antes de usarlos
    if (!gameBoardElement || !pieceContainerElement) {
        console.warn("Game elements not ready, delaying startGame().");
        // Intentar inicializarlos de nuevo podría ser una opción,
        // pero onAuthStateChanged debería haberlos preparado.
        initializeGameElements(); 
        if (!gameBoardElement) { // Si aún no están listos, salir
            console.error("Cannot start game: Elements missing after re-init attempt.");
            return;
        }
    }

    console.log("Starting new game...");
    isGameOver = false;
    score = 0;
    comboMultiplier = 0;
    consecutiveClears = 0;
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));

    // Clear Board and Piece Container DOM
    gameBoardElement.innerHTML = '';
    pieceContainerElement.innerHTML = '';
    gameOverScreenElement.classList.add('hidden');
    if(feedbackTextElement) feedbackTextElement.className = ''; // Limpiar feedback
    updateScore(0, true); // Reset score display
    updateComboDisplay(0);

    // Create Board Cells
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            gameBoardElement.appendChild(cell);
            addDropListeners(cell);
        }
    }

    // Generate Initial Pieces
    currentPieces = [];
    generateNewPieces();

    console.log("Game started. Board and pieces initialized.");
    // NO comprobar game over aquí, se hace después de generar piezas
}

function createBoard() {
    gameBoardElement.innerHTML = ''; // Clear previous board
    gameBoardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, var(--cell-size))`;
    gameBoardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, var(--cell-size))`;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            // Add drag-and-drop listeners to each cell
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            gameBoardElement.appendChild(cell);
        }
    }
    console.log("Board created with cells.");
}

function getRandomPiece() {
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    return PIECES[randomIndex];
}

function generateNewPieces() {
    pieceContainerElement.innerHTML = ''; // Clear existing pieces
    currentPieces = []; // Clear the array of piece elements

    for (let i = 0; i < PIECE_AREA_COUNT; i++) {
        const pieceData = getRandomPiece();
        const pieceElement = createPieceElement(pieceData);
        pieceContainerElement.appendChild(pieceElement);
        currentPieces.push(pieceElement); // Store the element
    }
    console.log("Generated new pieces:", currentPieces.length);
}

function createPieceElement(pieceData) {
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece');
    pieceElement.draggable = true;
    pieceElement.dataset.piece = JSON.stringify(pieceData); // Store piece data

    const shape = pieceData.shape;
    const rows = shape.length;
    const cols = shape[0].length;

    pieceElement.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
    pieceElement.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    pieceElement.style.width = `calc(${cols} * var(--cell-size) + ${cols - 1} * var(--gap-size))`;
    pieceElement.style.height = `calc(${rows} * var(--cell-size) + ${rows - 1} * var(--gap-size))`;


    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('piece-cell');
            if (shape[r][c] === 1) {
                cell.classList.add(pieceData.colorClass);
                // Store relative position for drag calculations
                cell.dataset.relRow = r;
                cell.dataset.relCol = c;
            } else {
                cell.classList.add('empty'); // Style empty cells transparently
            }
            pieceElement.appendChild(cell);
        }
    }

    // Add drag event listeners
    pieceElement.addEventListener('dragstart', handleDragStart);
    pieceElement.addEventListener('dragend', handleDragEnd);

     // Touch event listeners for mobile
    pieceElement.addEventListener('touchstart', handleTouchStart, { passive: false }); // Need preventDefault
    pieceElement.addEventListener('touchmove', handleTouchMove, { passive: false }); // Need preventDefault
    pieceElement.addEventListener('touchend', handleTouchEnd);


    return pieceElement;
}

// --- Drag and Drop Handlers ---

let touchStartX, touchStartY;
let elementBeingTouched = null;
let touchClone = null; // Clone for visual feedback during touch drag
let currentTouchTarget = null; // Cell the touch is currently over
// Variable to store the specific sub-cell within the piece that touch started on
let touchStartRelative = { row: 0, col: 0 };

function handleTouchStart(e) {
    if (isGameOver || e.touches.length !== 1) return; // Only handle single touch
    // Prevent default scrolling/zooming behavior
    e.preventDefault();

    elementBeingTouched = e.currentTarget; // The piece element
    const touch = e.touches[0];

    // Find the specific piece-cell that was touched
    const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (targetCell && targetCell.classList.contains('piece-cell') && !targetCell.classList.contains('empty')) {
        touchStartRelative.row = parseInt(targetCell.dataset.relRow);
        touchStartRelative.col = parseInt(targetCell.dataset.relCol);
    } else {
        // If touch didn't start on a valid part of the piece, abort
        console.log("Touch did not start on a solid piece cell.");
        elementBeingTouched = null;
        return;
    }

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    const pieceData = JSON.parse(elementBeingTouched.dataset.piece);
    draggedPiece = {
        element: elementBeingTouched,
        pieceData: pieceData,
        // Offset calculation now considers which part of the piece was touched
        offset: {
            x: touchStartRelative.col * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size').replace('px', '')) + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap-size').replace('px', ''))) + (touch.clientX - targetCell.getBoundingClientRect().left),
            y: touchStartRelative.row * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size').replace('px', '')) + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap-size').replace('px', ''))) + (touch.clientY - targetCell.getBoundingClientRect().top)
        }
    };


    // Create a visual clone for dragging
    touchClone = elementBeingTouched.cloneNode(true);
    touchClone.style.position = 'absolute';
    touchClone.style.zIndex = '1000';
    touchClone.style.opacity = '0.7';
    touchClone.style.pointerEvents = 'none'; // Ignore pointer events on the clone
    // Apply the scale transform directly for consistent look with dragging
    touchClone.style.transform = 'scale(1.1)';
    document.body.appendChild(touchClone);


    // Initial positioning of the clone based on calculated offset
    touchClone.style.left = `${touch.clientX - draggedPiece.offset.x}px`;
    touchClone.style.top = `${touch.clientY - draggedPiece.offset.y}px`;


    elementBeingTouched.style.opacity = '0.4'; // Dim original piece
    elementBeingTouched.classList.add('dragging'); // Use dragging class for consistency
    console.log("Touch start on piece, rel:", touchStartRelative.row, touchStartRelative.col);
}

function handleTouchMove(e) {
    if (!elementBeingTouched || !touchClone || isGameOver || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    // Move the clone visually
    touchClone.style.left = `${currentX - draggedPiece.offset.x}px`;
    touchClone.style.top = `${currentY - draggedPiece.offset.y}px`;

    // --- Highlighting Logic ---
    // Hide clone temporarily to find element underneath
    touchClone.style.display = 'none';
    const elementUnderTouch = document.elementFromPoint(currentX, currentY);
    touchClone.style.display = ''; // Show clone again

    let targetBoardCell = null;
    if (elementUnderTouch) {
        // Check if the element is a board cell or inside the game board container
        if (elementUnderTouch.classList.contains('cell')) {
            targetBoardCell = elementUnderTouch;
        } else if (gameBoardElement.contains(elementUnderTouch)) {
            // Maybe it's over a gap or edge, find nearest cell?
            // For simplicity, let's only highlight if directly over a .cell
            // More advanced: find closest cell based on coordinates.
        }
    }

    // Manage highlighting based on the targetBoardCell
    if (targetBoardCell) {
        // If we moved to a new cell
        if (targetBoardCell !== currentTouchTarget) {
            // Remove highlight from the previous cell
            if (currentTouchTarget) {
                removeDragOverHighlight();
            }
            // Add highlight to the new cell
            addDragOverHighlight(targetBoardCell);
            currentTouchTarget = targetBoardCell; // Update the current target
        }
    } else {
        // If we moved off the board or onto an invalid element
        if (currentTouchTarget) {
            removeDragOverHighlight();
            currentTouchTarget = null; // No longer over a valid target
        }
    }
}


function handleTouchEnd(e) {
    if (!elementBeingTouched || isGameOver || e.changedTouches.length !== 1) return;
    console.log("Touch end");


    // --- Find Drop Target ---
    let finalTargetCell = null;
    if (touchClone) { // Use clone's last position for potentially better accuracy
         // Hide clone before elementFromPoint
         touchClone.style.display = 'none';
         const touch = e.changedTouches[0];
         const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
         touchClone.style.display = ''; // Restore display immediately if needed elsewhere

        if (elementUnderTouch && elementUnderTouch.classList.contains('cell')) {
            finalTargetCell = elementUnderTouch;
        }
    } else { // Fallback if clone wasn't created or removed early
         const touch = e.changedTouches[0];
         const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
         if (elementUnderTouch && elementUnderTouch.classList.contains('cell')) {
            finalTargetCell = elementUnderTouch;
        }
    }


    // --- Process Drop ---
    if (finalTargetCell && draggedPiece) {
        // Calculate the potential top-left corner for placement check
        const targetRow = parseInt(finalTargetCell.dataset.row);
        const targetCol = parseInt(finalTargetCell.dataset.col);
        const potentialStartRow = targetRow - touchStartRelative.row;
        const potentialStartCol = targetCol - touchStartRelative.col;

        handleDropLogic(potentialStartRow, potentialStartCol);
    } else {
        // Reset original piece if drop was invalid or outside board
        elementBeingTouched.style.opacity = '1';
        elementBeingTouched.classList.remove('dragging');
        console.log("Touch ended outside board or on invalid target");
    }

    // --- Cleanup ---
    // Remove the visual clone
    if (touchClone && touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
    }
    touchClone = null;

    // Clean up highlights if any remain
    if (currentTouchTarget) {
        removeDragOverHighlight();
    }

    // Reset state variables
    // draggedPiece is reset inside handleDropLogic or if drop is invalid
    if (elementBeingTouched) { // Reset opacity if not handled by successful drop
        elementBeingTouched.style.opacity = '1';
        elementBeingTouched.classList.remove('dragging');
    }
    elementBeingTouched = null;
    currentTouchTarget = null;
    touchStartRelative = { row: 0, col: 0 }; // Reset relative start
}

// --- Utility functions for highlighting ---
// Store currently highlighted cells to easily remove them
let highlightedCells = [];

function addDragOverHighlight(targetCellElement) {
    if (!draggedPiece) return;

    // Clear previous highlights first
    removeDragOverHighlight(); // Call without args to clear all

    const targetRow = parseInt(targetCellElement.dataset.row);
    const targetCol = parseInt(targetCellElement.dataset.col);
    const pieceData = draggedPiece.pieceData;
    const shape = pieceData.shape;

    // Calculate the effective top-left corner based on where the drag/touch started relative to the piece
    const startRow = targetRow - (draggedPiece.relativeStart ? draggedPiece.relativeStart.row : touchStartRelative.row);
    const startCol = targetCol - (draggedPiece.relativeStart ? draggedPiece.relativeStart.col : touchStartRelative.col);

    let canPlace = true;
    highlightedCells = []; // Reset list for new highlight attempt

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                const currentCell = gameBoardElement.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);

                if (!currentCell || board[boardRow]?.[boardCol] !== 0) { // Check bounds and if cell is occupied
                    canPlace = false;
                    // Highlight the invalid spot (if it exists on board)
                    if (currentCell) {
                        currentCell.classList.add('invalid-placement');
                        highlightedCells.push(currentCell); // Add to list for cleanup
                    } else {
                        // Optionally provide feedback if trying to place out of bounds
                    }
                } else {
                    // Highlight valid spot
                    currentCell.classList.add('drag-over');
                    highlightedCells.push(currentCell); // Add to list for cleanup
                }
            }
        }
    }

     // Store placement validity globally for drop check (less ideal, but simpler than passing)
     // Alternatively, check canPlacePiece again directly in handleDropLogic
     window.currentPlacementValid = canPlace; // Use a temporary global or pass data differently
     console.log("Highlight check - canPlace:", canPlace);
}

function removeDragOverHighlight() {
    highlightedCells.forEach(cell => {
        cell.classList.remove('drag-over');
        cell.style.backgroundColor = '';
        cell.classList.remove('invalid-placement');
    });
    highlightedCells = []; // Clear the list
    window.currentPlacementValid = false; // Reset validity flag
}


function handleDragStart(event) {
    if (isGameOver) {
        event.preventDefault();
        return;
    }

    // Find the specific cell within the piece that was clicked
    const targetCell = event.target.closest('.piece-cell');
    let relRow = 0, relCol = 0;
    if (targetCell && !targetCell.classList.contains('empty')) {
        relRow = parseInt(targetCell.dataset.relRow);
        relCol = parseInt(targetCell.dataset.relCol);
    } else {
        // If drag didn't start on a solid part, maybe default to 0,0 or abort?
        // For simplicity, let's default to 0,0 if it's not a cell (e.g., gap)
        // This might feel slightly off if dragging from a gap.
    }

    const pieceElement = event.currentTarget; // The .piece element
    draggedPiece = {
        element: pieceElement,
        pieceData: JSON.parse(pieceElement.dataset.piece),
        relativeStart: { row: relRow, col: relCol } // Store where drag started relative to piece
        // offset: Not strictly needed for standard HTML D&D, but keep if useful
    };
    console.log("Drag start, rel:", relRow, relCol);

    event.dataTransfer.effectAllowed = 'move';
    // Optional: Set a custom drag image (can improve visuals)
    // Create a clone, style it, append to body temporarily, use setDragImage, then remove.
    // e.dataTransfer.setDragImage(pieceElement, e.offsetX, e.offsetY); // Basic, uses element itself

    // Make the original piece semi-transparent using CSS class
    setTimeout(() => { // Timeout needed for drag image capture
        pieceElement.classList.add('dragging');
    }, 0);
}

function handleDragEnd(event) {
     console.log("Drag end");
     // Restore original piece visibility if it wasn't successfully dropped
     // The 'dragging' class is removed here or in handleDropLogic
     if (draggedPiece && draggedPiece.element) {
         draggedPiece.element.classList.remove('dragging');
     }
     // Clean up any lingering highlights
     removeDragOverHighlight();

    draggedPiece = null; // Clear dragged piece info
    window.currentPlacementValid = false; // Reset flag
}

function handleDragOver(event) {
    // ¡IMPORTANTE! Prevenir el comportamiento por defecto para permitir el drop.
    event.preventDefault(); 
    // console.log('[handleDragOver] Firing over cell:', event.target);
    event.dataTransfer.dropEffect = 'move'; // Indicate visually that a move is possible
    // La clase 'drag-over' ahora se maneja en handleDragEnter/Leave para evitar flickering
    // event.target.classList.add('drag-over'); 
}

function handleDragEnter(event) {
    event.preventDefault(); 
    const targetCell = event.target.closest('.cell');
    if (targetCell && !targetCell.classList.contains('occupied') && draggedPiece) {
        console.log('[handleDragEnter] Entered cell:', targetCell.dataset.row, targetCell.dataset.col);
        // Add highlight based on the cell entered
        addDragOverHighlight(targetCell);
    } else {
        // console.log('[handleDragEnter] Entered non-target or occupied cell');
    }
}

function handleDragLeave(event) {
    const targetCell = event.target.closest('.cell');
    const relatedTarget = event.relatedTarget ? event.relatedTarget.closest('.cell') : null;

    // Check if leaving the board or moving to a non-cell element
    if (!relatedTarget || !relatedTarget.contains(event.target)) { 
        // Only remove highlight if truly leaving the potential placement area
        // This logic helps prevent flickering when moving between adjacent highlighted cells
        const isLeavingHighlightedArea = highlightedCells.length > 0 && !highlightedCells.some(cell => cell === relatedTarget);

        if (isLeavingHighlightedArea || !relatedTarget) {
            console.log('[handleDragLeave] Leaving highlighted area or board.');
             removeDragOverHighlight();
        }
    }
}

function handleDrop(event) {
    console.log('[handleDrop] Drop event fired on cell:', event.target);
    event.preventDefault(); // Prevent default browser action (like opening link)
    // event.target.classList.remove('drag-over'); // Highlight removed by removeDragOverHighlight in handleDropLogic

    if (!draggedPiece) {
        console.error("Drop event fired but no draggedPiece info available.");
    // We need the offset calculated in dragStart { offsetX, offsetY }
    // Correction: For mouse drag, we use relativeStart defined in handleDragStart
    const startRow = targetRow - draggedPiece.relativeStart.row;
    const startCol = targetCol - draggedPiece.relativeStart.col;

    console.log(`[handleDrop] Dropped on cell (${targetRow}, ${targetCol}). Calculated piece origin: (${startRow}, ${startCol})`);

    handleDropLogic(startRow, startCol);
}


// Updated logic for placing piece, expects calculated top-left coords
function handleDropLogic(startRow, startCol) {
     // draggedPiece should be set by dragstart or touchstart
     if (!draggedPiece) {
         console.error("handleDropLogic called without draggedPiece set!");
         return;
     }
 
     const pieceData = draggedPiece.pieceData;
     const pieceElement = draggedPiece.element;
     console.log(`[handleDropLogic] Attempting placement for piece at (${startRow}, ${startCol})`); // Log inicial
 
     let placedWithoutClearing = false;
 
     // Final check for placement validity using the calculated start coords
     if (canPlacePiece(pieceData.shape, startRow, startCol)) {
         console.log(`[handleDropLogic] Placement valid at (${startRow}, ${startCol}). Placing piece.`);
         placePiece(pieceData, startRow, startCol);
         updateScore(pieceData.points); // Add points for placing the piece

         // Check if lines will be cleared *before* actually clearing them
         const linesWillClear = checkLinesToClear(startRow, startCol, pieceData.shape);

         // Remove the placed piece from the container and state
         pieceElement.remove();
         currentPieces = currentPieces.filter(p => p !== pieceElement);

          // Clear completed lines/squares and update score (handles combo increase)
         const clearedCount = clearCompletedLines(); // Returns number of cleared cells

         if (clearedCount === 0) {
             placedWithoutClearing = true;
         }

         // Generate new pieces if the container is empty
         if (pieceContainerElement.childElementCount === 0) {
             console.log("Piece container empty, generating new pieces.");
             generateNewPieces();
         }

         // Check for game over AFTER placing and potentially generating new pieces
         // Delay this check slightly if clearCompletedLines has an animation?
         // clearCompletedLines already checks game over after its timeout. No need here?
         // Let's keep it simple for now: check immediately after placing/generating.
         // If clearCompletedLines runs, it might re-check anyway.
         if (checkGameOver()) {
             handleGameOver();
         }

         // Reset combo if piece placed and nothing cleared
         if (placedWithoutClearing) {
             resetCombo();
         }

     } else {
         console.log(`Cannot place piece at (${startRow}, ${startCol}).`);
         // Piece snaps back visually via dragend/touchend cleanup
         pieceElement.classList.remove('dragging'); // Ensure class removal on fail
     }

      // Final cleanup after any drop attempt
      removeDragOverHighlight();
      draggedPiece = null; // Crucial to reset state AFTER handling the logic
      window.currentPlacementValid = false;
}


function canPlacePiece(shape, startRow, startCol) {
    // console.log(`[canPlacePiece] Checking shape at (${startRow}, ${startCol})`); // Log detallado opcional
    const rows = shape.length;
    const cols = shape[0].length;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;

                // Check bounds
                if (boardRow >= BOARD_SIZE || boardCol >= BOARD_SIZE || boardRow < 0 || boardCol < 0) {
                    console.log(`[canPlacePiece] FAILED: Out of bounds at (${boardRow}, ${boardCol}) for shape starting at (${startRow}, ${startCol})`);
                    return false;
                }
                // Check if cell is already occupied
                if (board[boardRow][boardCol] !== 0) {
                    console.log(`[canPlacePiece] FAILED: Cell (${boardRow}, ${boardCol}) is occupied (value: ${board[boardRow][boardCol]}) for shape starting at (${startRow}, ${startCol})`);
                    return false;
                }
            }
        }
    }
    return true; // Can be placed
}

function placePiece(pieceData, startRow, startCol) {
    const shape = pieceData.shape;
    const colorIndex = PIECES.findIndex(p => p.shape === pieceData.shape && p.colorClass === pieceData.colorClass);
    const colorId = colorIndex !== -1 ? colorIndex + 1 : 1;
    
    // Efecto de "flash" en el tablero al colocar pieza
    gameBoardElement.classList.add('board-flash');
    setTimeout(() => gameBoardElement.classList.remove('board-flash'), 100);

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                if (boardRow < BOARD_SIZE && boardCol < BOARD_SIZE) {
                    board[boardRow][boardCol] = colorId; // Update board state
                    const cellElement = gameBoardElement.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    cellElement.classList.add('occupied', pieceData.colorClass);
                    // Trigger placement animation
                    cellElement.classList.remove('placed');
                    void cellElement.offsetWidth; // Trigger reflow
                    cellElement.classList.add('placed');
                    
                    // Crear partículas para la pieza colocada
                    if (PARTICLES_ENABLED) {
                        createPlacementParticles(cellElement, pieceData.colorClass);
                    }
                    
                    // Remove animation class after it finishes
                    setTimeout(() => cellElement.classList.remove('placed'), 350); // Match CSS duration
                }
            }
        }
    }
    console.log(`Piece placed at (${startRow}, ${startCol})`);

    // Opcional: Sonido al colocar pieza
    // playSound('place');
}

// Crear partículas al colocar una pieza
function createPlacementParticles(cellElement, colorClass) {
    if (!particleContainer) return;
    
    const rect = cellElement.getBoundingClientRect();
    const containerRect = particleContainer.getBoundingClientRect();
    
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    
    // Extraer el color base de la pieza
    const computedStyle = window.getComputedStyle(cellElement);
    const bgColor = computedStyle.backgroundColor || '#ffffff';
    
    // Crear 8-12 partículas por celda
    const particleCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
        createParticle(centerX, centerY, bgColor);
    }
}

// Crear partículas para líneas limpiadas
function createClearingParticles(cellElement) {
    if (!particleContainer) return;
    
    const rect = cellElement.getBoundingClientRect();
    const containerRect = particleContainer.getBoundingClientRect();
    
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    
    // Partículas con colores brillantes para las líneas eliminadas
    const particleColors = ['#ffff00', '#ffffff', '#ffff88'];
    const particleCount = 8 + Math.floor(Math.random() * 8); // Más partículas para la eliminación
    
    for (let i = 0; i < particleCount; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        createParticle(centerX, centerY, color, 1.2); // Más velocidad
    }
}

// Función genérica para crear partículas
function createParticle(x, y, color, speedMultiplier = 1) {
    if (!particleContainer) return;
    
    const particle = document.createElement('div');
    
    // Estilos de partículas
    particle.style.position = 'absolute';
    particle.style.width = `${3 + Math.random() * 4}px`;
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = color;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.boxShadow = `0 0 ${2 + Math.random() * 3}px ${color}`;
    
    // Posición inicial
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Calcular velocidad y dirección aleatoria
    const angle = Math.random() * 2 * Math.PI;
    const speed = (1 + Math.random() * 2) * speedMultiplier;
    const tx = Math.cos(angle) * speed * 20; // Distancia máxima que viaja
    const ty = Math.sin(angle) * speed * 20;
    
    // Establecer animación con CSS variables para la dirección
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.animation = `particle-fade ${0.5 + Math.random() * 0.5}s forwards`;
    
    // Añadir al contenedor y limpiar después
    particleContainer.appendChild(particle);
    setTimeout(() => {
        if (particle.parentNode === particleContainer) {
            particleContainer.removeChild(particle);
        }
    }, 1000); // Garantizar limpieza después de la animación
}

function updateScore(pointsToAdd) {
    score += pointsToAdd;
    scoreElement.textContent = score;

    // Trigger score animation
    scoreElement.classList.remove('updated');
    void scoreElement.offsetWidth; // Forzar reflow
    scoreElement.classList.add('updated');
    setTimeout(() => scoreElement.classList.remove('updated'), 200);

    // Crea una notificación flotante con los puntos ganados
    if (pointsToAdd > 0) {
        const floatingPoints = document.createElement('div');
        floatingPoints.className = 'floating-points';
        floatingPoints.textContent = `+${pointsToAdd}`;
        floatingPoints.style.position = 'absolute';
        floatingPoints.style.color = 'gold';
        floatingPoints.style.fontWeight = 'bold';
        floatingPoints.style.fontSize = '1.5em';
        floatingPoints.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
        floatingPoints.style.pointerEvents = 'none';
        
        // Posicionar cerca del puntaje
        const scoreRect = scoreElement.getBoundingClientRect();
        const headerRect = document.querySelector('.game-header').getBoundingClientRect();
        floatingPoints.style.left = `${scoreRect.right - headerRect.left + 5}px`;
        floatingPoints.style.top = `${scoreRect.top - headerRect.top}px`;
        floatingPoints.style.animation = 'float-up 1.2s ease-out forwards';
        
        document.querySelector('.game-header').appendChild(floatingPoints);
        
        // Limpiar después de la animación
        setTimeout(() => {
            if (floatingPoints.parentNode) {
                floatingPoints.parentNode.removeChild(floatingPoints);
            }
        }, 1200);
    }

    console.log("Score updated:", score);
}

function updateComboDisplay() {
    if (comboMultiplier > 1) {
        // Mensajes de combo más interesantes según el multiplicador
        let comboText = `Combo x${comboMultiplier}!`;
        if (comboMultiplier >= 5) {
            comboText = `¡SUPER COMBO x${comboMultiplier}!`;
        } else if (comboMultiplier >= 3) {
            comboText = `¡Gran Combo x${comboMultiplier}!`;
        }
        
        comboDisplayElement.textContent = comboText;
        comboDisplayElement.classList.add('visible');
        
        // Añadir clase especial para combos grandes
        comboDisplayElement.classList.remove('mega-combo');
        if (comboMultiplier >= 4) {
            comboDisplayElement.classList.add('mega-combo');
        }
    } else {
        comboDisplayElement.classList.remove('visible');
        comboDisplayElement.classList.remove('mega-combo');
        // Clear text after fade out
        setTimeout(() => { comboDisplayElement.textContent = ''; }, 300);
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

function clearCompletedLines() {
    let rowsToClear = [];
    let colsToClear = [];
    let cellsToClearElements = new Set();

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r].every(cellValue => cellValue !== 0)) {
            rowsToClear.push(r);
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cellElement = gameBoardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (cellElement) cellsToClearElements.add(cellElement);
            }
        }
    }

    // Check columns
    for (let c = 0; c < BOARD_SIZE; c++) {
        let colFull = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (board[r][c] === 0) {
                colFull = false;
                break;
            }
        }
        if (colFull) {
            colsToClear.push(c);
            for (let r = 0; r < BOARD_SIZE; r++) {
                 const cellElement = gameBoardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                 if (cellElement) cellsToClearElements.add(cellElement);
            }
        }
    }

    // Calcular el número de líneas (filas + columnas únicas) limpiadas
    const uniqueLinesCleared = new Set([...rowsToClear, ...colsToClear.map(c => `col-${c}`)]).size;

    const numCellsToClear = cellsToClearElements.size;

    if (numCellsToClear === 0) {
        if (checkGameOver()) {
            handleGameOver();
        }
        return 0;
    }

    console.log(`Cells to clear: ${numCellsToClear}, Lines/Cols Cleared: ${uniqueLinesCleared}`);

    // Animate and mark cells for clearing
    cellsToClearElements.forEach(cellElement => {
        cellElement.classList.add('clearing');
        // Remove color class immediately for animation background to show
        PIECES.forEach(p => cellElement.classList.remove(p.colorClass));
        // Remove placed animation if it's still running
        cellElement.classList.remove('placed');
        
        // Crear partículas en cada celda eliminada
        if (PARTICLES_ENABLED) {
            createClearingParticles(cellElement);
        }
    });

    // Reproducir sonido y mostrar texto según las líneas limpiadas
    let feedbackText = "";
    let soundToPlay = null;
    let isUnbelievable = false;

    switch (uniqueLinesCleared) {
        case 1:
            feedbackText = "Good!";
            soundToPlay = 'good';
            break;
        case 2:
            feedbackText = "Great!";
            soundToPlay = 'great';
            break;
        case 3:
            feedbackText = "Fantastic!";
            soundToPlay = 'fantastic';
            break;
        case 4:
            feedbackText = "Excellent!";
            soundToPlay = 'excellent';
            break;
        case 5:
        default: // Para 5 o más líneas
            feedbackText = "Unbelievable!";
            soundToPlay = 'unbelievable';
            isUnbelievable = true;
            break;
    }

    if (soundToPlay) {
        playSound(soundToPlay);
    }

    if (feedbackText && feedbackTextElement) {
        feedbackTextElement.textContent = feedbackText;
        feedbackTextElement.className = 'show-feedback'; // Reset class
        void feedbackTextElement.offsetWidth; // Trigger reflow
        if (isUnbelievable) {
            feedbackTextElement.classList.add('show-unbelievable');
        } else {
            feedbackTextElement.classList.remove('show-unbelievable'); // Asegurarse de quitarla si no es
        }
        // Opcional: quitar la clase después de la animación para permitir reutilización
        const animationDuration = isUnbelievable ? 1800 : 1500;
        setTimeout(() => {
            feedbackTextElement.className = ''; // Limpiar clases
            feedbackTextElement.textContent = '';
        }, animationDuration);
    }

    // Calculate score for clearing lines
    // Base score per cell + bonus for clearing more cells at once
    let pointsPerCell = 10; // Increased points per cell

    // Increment and apply combo multiplier
    consecutiveClears++;
    comboMultiplier++;
    console.log("Combo increased to:", comboMultiplier);
    updateComboDisplay();

    // Añadir efecto de "sacudida" del tablero para líneas grandes
    if (numCellsToClear >= BOARD_SIZE) {
        gameBoardElement.classList.add('board-shake');
        setTimeout(() => gameBoardElement.classList.remove('board-shake'), 500);
    }

    // Calculate bonus based on number of cells cleared and combo
    let clearBonus = Math.pow(numCellsToClear, 1.7); // Bonus exponencial más pronunciado
    let comboBonus = comboMultiplier > 1 ? comboMultiplier * 0.75 : 1;
    let pointsForClearing = Math.round((numCellsToClear * pointsPerCell + clearBonus) * comboBonus);

    // Delay state update and score until animation finishes
    const animationDuration = 400;
    setTimeout(() => {
        // Update board state
        rowsToClear.forEach(r => {
            for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 0;
        });
        colsToClear.forEach(c => {
            for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = 0;
        });

        // Update DOM (remove classes)
        cellsToClearElements.forEach(cellElement => {
            cellElement.classList.remove('occupied', 'clearing');
            PIECES.forEach(p => cellElement.classList.remove(p.colorClass));
        });

        updateScore(pointsForClearing);
        console.log(`Cleared ${numCellsToClear} cells (${uniqueLinesCleared} lines/cols). Awarded ${pointsForClearing} points.`);

        // Check game over again *after* clearing lines, as this might free up space.
        if (checkGameOver()) {
            handleGameOver();
        }

    }, animationDuration);

    return numCellsToClear;
}

// Helper function to check if placing a piece *will* clear lines
// Used to determine if combo should be reset
function checkLinesToClear(startRow, startCol, shape) {
    let boardCopy = board.map(row => [...row]); // Create a temporary copy
    let willClear = false;

    // Temporarily place piece on copy
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                if (boardRow < BOARD_SIZE && boardCol < BOARD_SIZE) {
                    boardCopy[boardRow][boardCol] = 1; // Mark as occupied (value doesn't matter)
                }
            }
        }
    }

    // Check rows in the copy
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (boardCopy[r].every(cellValue => cellValue !== 0)) {
            willClear = true;
            break;
        }
    }

    // Check columns in the copy (if no row found yet)
    if (!willClear) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            let colFull = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (boardCopy[r][c] === 0) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) {
                willClear = true;
                break;
            }
        }
    }

    return willClear;
}

function checkGameOver() {
    // If no pieces left to place, not game over (should generate new ones)
    if (currentPieces.length === 0 && pieceContainerElement.childElementCount === 0) {
        console.log("CheckGameOver: No pieces available, but not necessarily game over yet.");
        return false; // Need to generate new pieces first
    }

    // Check if ANY of the current pieces can be placed anywhere on the board
    for (const pieceElement of currentPieces) {
        // Ensure pieceElement is valid and has data
        if (!pieceElement || !pieceElement.dataset || !pieceElement.dataset.piece) {
            console.warn("CheckGameOver: Found invalid piece element in currentPieces.");
            continue; // Skip this invalid entry
        }
        const pieceData = JSON.parse(pieceElement.dataset.piece);
        const shape = pieceData.shape;

        // Try placing this piece anchored at every possible board cell
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                 // Try placing the piece with its top-left corner at (r, c)
                if (canPlacePiece(shape, r, c)) {
                    console.log(`CheckGameOver: Piece can fit at (${r}, ${c})`);
                    return false; // Found a possible placement
                }
            }
        }
    }

    // If loop completes, no piece can be placed anywhere
    console.log("CheckGameOver: No available piece can be placed.");
    return true; // Game Over
}

function handleGameOver() {
    isGameOver = true;
    finalScoreElement.textContent = score;
    gameOverScreenElement.classList.remove('hidden');
    console.log("GAME OVER! Final Score:", score);
    
    // Añadir animación de fin de juego más dramática
    if (PARTICLES_ENABLED) {
        // Crear explosión de partículas
        const boardRect = gameBoardElement.getBoundingClientRect();
        const containerRect = particleContainer.getBoundingClientRect();
        
        const centerX = boardRect.left - containerRect.left + boardRect.width / 2;
        const centerY = boardRect.top - containerRect.top + boardRect.height / 2;
        
        // Partículas en varias oleadas
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                for (let j = 0; j < 20; j++) {
                    const colorIndex = j % 7;
                    const colors = ['#ff595e', '#ffd166', '#54c059', '#2d8fff', '#bf83fb', '#ff924c', '#5fc9f8'];
                    createParticle(centerX, centerY, colors[colorIndex], 1.5);
                }
            }, i * 200);
        }
    }
    
    // Optional: Add animation or visual effect for game over
    pieceContainerElement.innerHTML = ''; // Clear remaining pieces visually

    // Opcional: Sonido de Game Over
    // playSound('gameover');
}

// Función para precargar audios
function preloadAudios() {
    console.log("Preloading audios...");
    for (const key in audioFiles) {
        sounds[key] = new Audio(audioFiles[key]);
        sounds[key].preload = 'auto';
        // Evitar error si la carga falla
        sounds[key].onerror = () => {
            console.warn(`Could not load audio: ${audioFiles[key]}`);
            sounds[key] = null; // Marcar como no disponible
        };
        sounds[key].oncanplaythrough = () => {
           // console.log(`Audio loaded: ${key}`);
        };
    }
}

// Función para reproducir sonido (manejando errores)
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0; // Reiniciar si ya estaba sonando
        sounds[soundName].play().catch(e => console.warn(`Error playing sound ${soundName}:`, e));
    }
}

// Add Drop Listeners (Add logs inside)
function addDropListeners(cell) {
    // console.log('[addDropListeners] Adding listeners to cell:', cell.dataset.row, cell.dataset.col);
    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('dragenter', handleDragEnter);
    cell.addEventListener('dragleave', handleDragLeave);
    cell.addEventListener('drop', handleDrop);
}

// Add Drag Listeners (Existing)
function addDragListeners(pieceElement, pieceData) {
   // ... (código existente)
} 