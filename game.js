const N = 25;

// Game state
let position = {
  index: null,
  path: []
};
let buttonColors = {};
let buttonBorders = {};
let buttonClicks = {};
let mapCompleted = false;
let switchMapButton;

// Initialize game state
for (let i = 1; i <= N; i++) {
  buttonBorders[`button${i}`] = 2;
  buttonColors[`button${i}`] = 1;
  buttonClicks[`button${i}`] = 0;
}

// Define the map data as a string
//mapData = "001100110011000111111"
let blocked = [];
let gameBoard;
let currentMapIndex = 0;
let maps;

async function loadMapData() {
  const response = await fetch('map_data.json');
  maps = await response.json();
  return maps;
}

async function createGameBoard(mapData) {
  // Clear the existing game board
  gameBoard.innerHTML = '';
  
  // Reset the game state
  resetGameState();

  for (let i = 1; i <= N; i++) {
    if (mapData[i - 1] === "0") {
      buttonColors[`button${i}`] = 0;
      blocked.push(i);
    } else {
      buttonColors[`button${i}`] = 1;
    }
  }
  console.log(blocked)

  // Create the game board
  for (let i = 1; i <= N; i++) {
    const button = document.createElement('button');
    button.classList.add('game-button', 'no-border-button');
    button.style.backgroundColor = valueToColor(buttonColors[`button${i}`]);
    button.id = `button${i}`;
    button.addEventListener('click', () => handleButtonClick(i));
    gameBoard.appendChild(button);
  }

  if (position.index == null) {
    for (let j = 1; j <= N; j++) {
      const buttonElement = document.getElementById(`button${j}`);
      buttonElement.classList.add('glow-button');
    }
  }

  // Add the "Next Map" and "Restart" buttons
  switchMapButton = document.createElement('button');
  switchMapButton.textContent = '>>';
  switchMapButton.classList.add('next-map-button');
  switchMapButton.classList.toggle('glow-gold-button', mapCompleted);
  switchMapButton.addEventListener('click', () => {
    currentMapIndex = (currentMapIndex + 1) % maps.length;
    createGameBoard(maps[currentMapIndex]);
  });
  gameBoard.appendChild(switchMapButton);

  const restartButton = document.createElement('button');
  restartButton.innerHTML = '&#8635;'; // Restart symbol
  restartButton.classList.add('next-map-button');
  restartButton.addEventListener('click', () => {
    resetGameState();
    createGameBoard(maps[currentMapIndex]);
  });
  gameBoard.appendChild(restartButton);
}

async function loadGame() {
// Load the map data from the JSON file
await loadMapData();

// Initialize the game board with the first map
gameBoard = document.getElementById('game-board');
await createGameBoard(maps[currentMapIndex]);
}

loadGame();

// Helper functions
function valueToColor(value) {
  if (value === 1) return 'black';
  if (value === 2) return '#1c7856';
  if (value === 0) return 'gray';
  if (value === 5) return 'white';
}

function incrementer(value, position) {
  if (value === 0) {
    return 0;
  }
  if (value === 1) {
    return value + 1;
  }
  if (value === 2) {
    return 1;
  }
}

function getNeighbors(index) {
  const col = Math.ceil(index / 5);
  const row = index % 5 === 0 ? 5 : index % 5;
  const neighbors = [
    (col > 1) ? (col - 2) * 5 + row : 0,
    (col < 5) ? (col) * 5 + row : 0,
    (row > 1) ? (col - 1) * 5 + row - 1 : 0,
    (row < 5) ? (col - 1) * 5 + row + 1 : 0
  ];
  return neighbors.filter(n => n > 0 && n <= N && n !== index);
}

function updatePosition(index) {
  return index;
}

function handleButtonClick(i) {
  if (!blocked.includes(i)) {
    if (
      position.index === null ||
      (getNeighbors(position.index).includes(i) && !position.path.includes(i))
    ) {
      buttonColors[`button${i}`] = incrementer(buttonColors[`button${i}`], i);
      position.index = updatePosition(i);
      position.path.push(i);
      buttonClicks[`button${i}`]++;

      // Check if the map is completed
      if (position.path.length === N - blocked.length) {
        mapCompleted = true;
        switchMapButton.classList.add('glow-gold-button');
      }
    } else if (position.index === i) {
      // Remove the button from the path and update the position.index
      const index = position.path.indexOf(i);
      if (index !== -1) {
        position.path.splice(index, 1);
      }
      // Update position.index_l1 based on the new position.path
      if (position.path.length > 0) {
        position.index = position.path[position.path.length - 1];
      } else {
        position.index = null;
      }
      buttonClicks[`button${i}`]++;
      buttonColors[`button${i}`] = incrementer(buttonColors[`button${i}`], i);

      // Check if the map is no longer completed
      if (position.path.length !== N - blocked.length) {
        mapCompleted = false;
        switchMapButton.classList.remove('glow-gold-button');
      }
    }

      // Update borders
    for (let j = 1; j <= N; j++) {
      const buttonElement = document.getElementById(`button${j}`);
      if (
          position.index === null ||
          (getNeighbors(position.index).includes(j) &&
          !blocked.includes(j) &&
          !position.path.includes(j))
        ) {
          buttonElement.classList.add('glow-button');
        } else {
          buttonElement.classList.remove('glow-button');
        }

        // Set index glow
        if (position.index !== null && j === position.index) {
          buttonElement.classList.remove('glow-button');
          buttonElement.classList.add('glow-gold-button');
        } else {
          buttonElement.classList.remove('glow-gold-button');
        }
      }
    }

  document.getElementById(`button${i}`).style.backgroundColor = valueToColor(buttonColors[`button${i}`]);

  // Log the button click vector
  logButtonClickVector();

  // debug
  console.log(blocked)

}

function logButtonClickVector() {
  const clickVector = [];
  for (let i = 1; i <= N; i++) {
    clickVector.push(buttonClicks[`button${i}`]);
  }
}

function resetGameState() {
  position = {
    index: null,
    path: []
  };
  buttonColors = {};
  buttonBorders = {};
  buttonClicks = {};
  mapCompleted = false;

  // Initialize game state
  for (let i = 1; i <= N; i++) {
    buttonBorders[`button${i}`] = 2;
    buttonColors[`button${i}`] = 1;
    buttonClicks[`button${i}`] = 0;
  }

  blocked = [];
}