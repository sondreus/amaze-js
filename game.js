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
let blocked = [];
let gameBoard;
const currentDate = new Date();
const referenceDate = new Date(2024, 4, 27);
const daysDiff = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
let currentMapIndex = daysDiff + 10;
let maps;
let currentMap;

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
      if (!blocked.includes(j)){
      buttonElement.classList.add('glow-button');
      }
    }
  }

  // Add the "Restart", "Share" and "Next Map" buttons
  
  const restartButton = document.createElement('button');
  restartButton.innerHTML = '&#8635;'; // Restart symbol
  restartButton.classList.add('restart-button');
  restartButton.addEventListener('click', () => {
    resetGameState();
    createGameBoard(maps[currentMapIndex]);
  });
  gameBoard.appendChild(restartButton);
  
  // Add the "Share" button
  shareButton = document.createElement('button');
  shareButton.innerHTML = `
  <svg id="Footer-module_shareIcon__wOwOt" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" class="game-icon" data-testid="icon-share">
    <path fill="var(--white)" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z">
    </path>
  </svg>
`; // Restart symbol; // Share symbol
  shareButton.classList.add('share-button');
  shareButton.classList.toggle('gold-button', mapCompleted);
  shareButton.addEventListener('click', shareMap);
  gameBoard.appendChild(shareButton);

  switchMapButton = document.createElement('button');
  switchMapButton.textContent = '>>';
  switchMapButton.classList.add('next-map-button');
  switchMapButton.classList.toggle('glow-big-gold-button', mapCompleted);
  switchMapButton.addEventListener('click', () => {
    currentMapIndex = (currentMapIndex + 1) % maps.length;
    createGameBoard(maps[currentMapIndex]);
  });
  gameBoard.appendChild(switchMapButton);

  currentMap = mapData;
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
function valueToColor(value, fade) {
  if (value === 1) return 'black';
  if (value === 2) return `rgba(28, 120, 86, ${fade})`; // '#1c7856';
  if (value === 0) return 'gray';
  if (value === 5) return 'white';
}

function updateButtonColor(j, position) {
  const buttonElement = document.getElementById(`button${j}`);
  const currentPosition = getPositionInPath(j, position);
  const fadePercentage = 1 - (Math.log(currentPosition + 1)) / 5;

  // Check if the button is not in the first position of the path
  if (currentPosition > 1) {
    const fadePercentage = 1 - (Math.log(currentPosition) / 5);
    buttonElement.style.transition = 'background-color 1s ease';
    buttonElement.style.backgroundColor = valueToColor(buttonColors[`button${j}`], fadePercentage);
  } else {
    // If the button is in the first position, set the color without any fade effect
    buttonElement.style.transition = 'background-color 0.25s ease';
    buttonElement.style.backgroundColor = valueToColor(buttonColors[`button${j}`], 1);
  }
}

function getPositionInPath(i, path) {
  const index = path.indexOf(i);
  if (index !== -1) {
    return path.length - index; // Return the position (1-based index)
  } else {
    return 0; // Return 0 if the value is not in the path
  }
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
        switchMapButton.classList.add('glow-big-gold-button');
        shareButton.classList.add('gold-button');
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
        switchMapButton.classList.remove('glow-big-gold-button');
        shareButton.classList.remove('gold-button');
      }
    }

      // Update borders
    for (let j = 1; j <= N; j++) {
      const buttonElement = document.getElementById(`button${j}`);
      if (
          (position.index === null &&
          !blocked.includes(j)) ||
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
        // Update colors
       // document.getElementById(`button${j}`).style.backgroundColor = valueToColor(buttonColors[`button${j}`], 1 - (Math.log(getPositionInPath(j, position.path) + 1)) / 5);
       updateButtonColor(j, position.path)
      }
    }

  console.log(1 - Math.log(position.path.length + 1) / 10)
  console.log(getPositionInPath(i, position.path))


  // Log the button click vector
  logButtonClickVector();

  // debug
  console.log(blocked)
  console.log(position.path)

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


function convertToEmojis(mapData, maxPerLine = 5) {
  const emojiMap = {
    '0': '&#129704;',  // "🪨"
    '1': '&#129001;',  // "🟩"
    '2': '&#9989;'     // "✅"
  };

  let emojiString = '';
  let lineCount = 0;

  for (let i = 0; i < mapData.length; i++) {
    const char = mapData[i];
    emojiString += emojiMap[char] || char;

    if ((i + 1) % maxPerLine === 0) {
      emojiString += '\n';
      lineCount++;
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).replace(',', ',');

  const result = `${currentDate}\n${emojiString.replace(/&#129704;/g, '🪨').replace(/&#129001;/g, '🟩').replace(/&#9989;/g, '✅')}\nsondreus.github.io/amaze-js`;

  return result;
}

//console.log(currentMap);
//console.log(convertToEmojis("1100011110110100101001110"));

function shareMap() {
  // Generate a shareable link or image based on the current map
  const currentMap = maps[currentMapIndex];
  const shareLink = convertToEmojis(currentMap)

  // Open a share dialog or copy the link to the clipboard
  // You can use the Web Share API or a custom implementation
  if (false) {
    navigator.share({
      title: 'Check out this map!',
      url: shareLink,
    });
  } else {
    // Fallback to copying the link to the clipboard
    navigator.clipboard.writeText(shareLink);
    // Change the button icon or color
    changeShareButtonState();
    setTimeout(() => {
      showCopiedMessage();
    }, 100);
  }
}

function changeShareButtonState() {
  const shareButton = document.querySelector('.share-button');

  // Change the button icon
  shareButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
    </svg>
  `;

  // Change the button color
  shareButton.classList.add('text-green-500');

  // Reset the button state after a certain duration
  setTimeout(() => {
    shareButton.innerHTML = `
      <svg id="Footer-module_shareIcon__wOwOt" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" class="game-icon" data-testid="icon-share">
        <path fill="var(--white)" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z">
        </path>
      </svg>
    `;
    shareButton.classList.remove('text-green-500');
  }, 2000);
}

// Get the close tutorial button element
const closeTutorialButton = document.getElementById('closeTutorial');

// Set a timeout to apply the glow effect after 5 seconds
setTimeout(function() {
  closeTutorialButton.style.backgroundColor = 'gold';
  closeTutorialButton.style.color = 'black';
  closeTutorialButton.style.fontWeight = 'bold';
  closeTutorialButton.style.animation = 'glow 1.25s ease-in-out infinite alternate';
  closeTutorialButton.style.transform = 'scale(1.2)';
  closeTutorialButton.style.transition = 'transform 0.3s ease';
}, 20000); // 5000 milliseconds = 5 seconds

// Get the tutorial screen and close button elements
const tutorialScreen = document.getElementById('tutorialScreen');
const closeButton = document.getElementById('closeTutorial');

// Show the tutorial screen initially
window.onload = function() {
  tutorialScreen.style.display = 'flex';
};

// Hide the tutorial screen when the close button is clicked
closeButton.addEventListener('click', function() {
  tutorialScreen.style.display = 'none';
  // Start your game logic here
});
/*
function showCopiedMessage() {
  const copiedMessage = document.createElement('div');
  copiedMessage.textContent = 'Copied to clipboard';
  copiedMessage.classList.add('copied-message');

  document.body.appendChild(copiedMessage);

  setTimeout(() => {
    copiedMessage.classList.add('hide');
    setTimeout(() => {
      document.body.removeChild(copiedMessage);
    }, 300);
  }, 2000);
}

// Get the modal and the close button
const modal = document.getElementById("game-explanation-modal");
const closeButton = document.getElementById("close-game-explanation");

// Show the modal when the page loads
window.onload = function() {
  modal.style.display = "block";
};

// Hide the modal when the close button is clicked
closeButton.onclick = function() {
  modal.style.display = "none";
};

// Hide the modal when the user clicks outside the modal
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

*/
