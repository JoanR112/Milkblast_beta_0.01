const TEST_BOARD_SIZE = 9; 

function assert(condition, message) {
    if (!condition) {
        console.error("Assertion Failed:", message);
    } else {
        console.log("Assertion Passed:", message ? message.replace("Failed", "Passed").replace("Test", "Test Case") : "Unnamed assertion");
    }
}


function canPlacePiece_testWrapper(testBoardSetup, shape, startRow, startCol) {
    const originalGlobalBoard = window.board; 
    const originalBoardSize = window.BOARD_SIZE; 

    window.board = testBoardSetup;    
    window.BOARD_SIZE = testBoardSetup.length; 

    let result;
    try {
        
        result = window.canPlacePiece(shape, startRow, startCol);
    } catch (e) {
        console.error("Error during canPlacePiece_testWrapper execution:", e);
        result = false; 
    }

    window.board = originalGlobalBoard; 
    window.BOARD_SIZE = originalBoardSize; 
    return result;
}


function runCanPlacePieceTests() {
    console.log("--- Running Tests for canPlacePiece ---");
    let currentTestBoard;

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape1 = [[1, 1]]; 
    assert(canPlacePiece_testWrapper(currentTestBoard, shape1, 0, 0), "Test Case 1 Failed: Simple valid placement on empty board.");

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape1, -1, 0), "Test Case 2 Failed: Piece off board (top-left).");

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape3 = [[1, 1], [1, 1]]; 
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape3, TEST_BOARD_SIZE - 1, TEST_BOARD_SIZE - 1), "Test Case 3 Failed: 2x2 piece off board (bottom-right).");
    
    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(canPlacePiece_testWrapper(currentTestBoard, shape1, TEST_BOARD_SIZE - 1, TEST_BOARD_SIZE - 2), "Test Case 4 Failed: 1x2 piece valid at bottom edge.");

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    currentTestBoard[1][1] = 1; 
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape1, 1, 0), "Test Case 5 Failed: Collision with block at [1][1].");
    
    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape6 = [[1,0],[1,0],[1,1]]; 
    assert(canPlacePiece_testWrapper(currentTestBoard, shape6, 0, 0), "Test Case 6 Failed: L-shape valid placement on empty board.");

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    let shape7 = [[1,1,1],[1,1,1],[1,1,1]]; 
    assert(canPlacePiece_testWrapper(currentTestBoard, shape7, 0, 0), "Test Case 7 Failed: 3x3 piece valid on empty board.");

    
    currentTestBoard = Array(TEST_BOARD_SIZE).fill(null).map(() => Array(TEST_BOARD_SIZE).fill(0));
    assert(!canPlacePiece_testWrapper(currentTestBoard, shape7, TEST_BOARD_SIZE - 2, 0), "Test Case 8 Failed: 3x3 piece invalid too close to bottom edge.");

    console.log("--- canPlacePiece Tests Complete ---");
}


function runAllBlockBlastTests() {
    console.log("Starting all BlockBlast test suites...");
    runCanPlacePieceTests();
    
    
    console.log("All BlockBlast test suites finished.");
}
