// tests.js

// This test suite is designed to be run in a browser environment
// where script.js has already been loaded, making its global variables
// (like 'board', 'BOARD_SIZE') and functions (like 'canPlacePiece') available.

// --- Configuration for Tests ---
const TEST_BOARD_SIZE = 9; // Should match BOARD_SIZE in script.js if testing against global

// --- Simple Assertion Function ---
function assert(condition, message) {
    if (!condition) {
        console.error("Assertion Failed:", message);
    } else {
        console.log("Assertion Passed:", message ? message.replace("Failed", "Passed").replace("Test", "Test Case") : "Unnamed assertion");
    }
}

// --- Test Wrapper for canPlacePiece ---
// This function allows testing canPlacePiece with different board states
// by temporarily overriding the global 'board' variable from script.js.
function canPlacePiece_testWrapper(testBoardSetup, shape, startRow, startCol) {
    const originalGlobalBoard = window.board; // Store original global board
    const originalBoardSize = window.BOARD_SIZE; // Store original global BOARD_SIZE

    window.board = testBoardSetup;    // Set board for test
    window.BOARD_SIZE = testBoardSetup.length; // Assume square board, set BOARD_SIZE for test

    let result;
    try {
        // Call the global canPlacePiece function from script.js
        result = window.canPlacePiece(shape, startRow, startCol);
    } catch (e) {
        console.error("Error during canPlacePiece_testWrapper execution:", e);
        result = false; // Assume failure if an error occurs
    }

    window.board = originalGlobalBoard; // Restore original global board
    window.BOARD_SIZE = originalBoardSize; // Restore original BOARD_SIZE
    return result;
}

// --- Test Cases for canPlacePiece ---
function runCanPlacePieceTests() {
    console.log("--- Running Tests for canPlacePiece ---");
    let currentTestBoard;

    // Test Case 1: Valid placement - Simple piece on empty board
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape1 = [[1, 1]]; // 1x2 piece
    assert(canPlacePiece_testWrapper(currentTestBoard, shape1, 0, 0), "Test Case 1 Failed: Simple valid placement on empty board.");

    // Test Case 2: Invalid placement - Piece off board (top-left)
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape1, -1, 0), "Test Case 2 Failed: Piece off board (top-left).");

    // Test Case 3: Invalid placement - Piece off board (bottom-right)
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape3 = [[1, 1], [1, 1]]; // 2x2 piece
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape3, TEST_BOARD_SIZE - 1, TEST_BOARD_SIZE - 1), "Test Case 3 Failed: 2x2 piece off board (bottom-right).");
    
    // Test Case 4: Valid placement - Piece at edge
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(canPlacePiece_testWrapper(currentTestBoard, shape1, TEST_BOARD_SIZE - 1, TEST_BOARD_SIZE - 2), "Test Case 4 Failed: 1x2 piece valid at bottom edge.");

    // Test Case 5: Invalid placement - Collision with existing block
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    currentTestBoard[1][1] = 1; // Place an obstacle
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape1, 1, 0), "Test Case 5 Failed: Collision with block at [1][1].");
    
    // Test Case 6: Valid placement - L-shape on empty board
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape6 = [[1,0],[1,0],[1,1]]; // L-shape
    assert(canPlacePiece_testWrapper(currentTestBoard, shape6, 0, 0), "Test Case 6 Failed: L-shape valid placement on empty board.");

    // Test Case 7: Valid placement - 3x3 piece on empty 9x9 board
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape7 = [[1,1,1],[1,1,1],[1,1,1]]; // 3x3 piece
    assert(canPlacePiece_testWrapper(currentTestBoard, shape7, 0, 0), "Test Case 7 Failed: 3x3 piece valid on empty board.");

    // Test Case 8: Invalid placement - 3x3 piece too close to edge
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape7, TEST_BOARD_SIZE - 2, 0), "Test Case 8 Failed: 3x3 piece invalid too close to bottom edge.");

    console.log("--- canPlacePiece Tests Complete ---");
}

// --- Function to Run All Test Suites ---
// To use: Ensure script.js is loaded, then load this tests.js file.
// Open the browser console and type: runAllBlockBlastTests()
function runAllBlockBlastTests() {
    console.log("Starting all BlockBlast test suites...");
    runCanPlacePieceTests();
    // console.log("--- Tests for clearCompletedLines (Not Implemented) ---");
    // console.log("--- Tests for Adaptive Piece Generation (Not Implemented) ---");
    console.log("All BlockBlast test suites finished.");
}

// Optional: Automatically run tests if a certain condition is met, or provide a button in HTML to trigger them.
// For now, manual execution via console is intended.
