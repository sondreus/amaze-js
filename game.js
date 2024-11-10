const N = 49;

// Make path
function drawPath() {
  const svg = document.getElementById('path-overlay');
  svg.innerHTML = ''; // Clear existing path

  if (position.path.length < 2) return; // Need at least 2 points to draw a line

  const gameBoard = document.querySelector('.game-board');
  const buttonSize = gameBoard.clientWidth / 7; // Assuming a 7x7 grid
  const buttonMargin = 1; // Adjust based on your grid-gap
  const totalSize = buttonSize + buttonMargin;

  // Set SVG viewBox to match game board dimensions
  svg.setAttribute('viewBox', `0 0 ${gameBoard.clientWidth} ${gameBoard.clientHeight}`);

  let pathD = '';
  
  // Array to hold visited coordinates
  let visitedCoordinates = [];
  
  // Array to hold coordinate pairs
  let coordinatePairs = [];

  position.path.forEach((buttonIndex, index) => {
    const col = ((buttonIndex - 1) % 7);
    const row = Math.floor((buttonIndex - 1) / 7);
    const x = col * totalSize + buttonSize / 2;
    const y = row * totalSize + buttonSize / 2;

    if (index === 0) {
      pathD += `M ${x} ${y}`; // Move to the first point
    } else {
      pathD += ` L ${x} ${y}`; // Normal line drawing
    }

    // Record the visited coordinates using cell number as ID
    visitedCoordinates.push(buttonIndex);

    // Create a pair from the current and previous button indices
    if (index > 0) {
      const previousButtonIndex = position.path[index - 1];
      const pair = [Math.min(previousButtonIndex, buttonIndex), Math.max(previousButtonIndex, buttonIndex)];
      coordinatePairs.push(pair);
    }
    
    previousPoint = { x, y }; // Update previous point for next iteration
  });

  // Draw the main path with normal thickness
  const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  mainPath.setAttribute('d', pathD);
  mainPath.setAttribute('fill', 'none');
  mainPath.setAttribute('stroke', 'gold');
  mainPath.setAttribute('stroke-width', '3'); // Normal thickness for non-retraced lines
  mainPath.setAttribute('stroke-linecap', 'round');
  mainPath.setAttribute('stroke-linejoin', 'round');

  svg.appendChild(mainPath);

  // Find duplicated pairs
  let duplicatePairs = {};
  
  coordinatePairs.forEach(pair => {
    const key = pair.join('-'); // Create a unique key for each pair
    duplicatePairs[key] = (duplicatePairs[key] || 0) + 1; // Count occurrences of each pair
  });

  // Draw curved lines for duplicated pairs
  Object.keys(duplicatePairs).forEach(key => {
    if (duplicatePairs[key] > 1) {
      const [start, end] = key.split('-').map(Number); // Get start and end from key
      
      const startCol = (start - 1) % 7;
      const startRow = Math.floor((start - 1) / 7);
      const endCol = (end - 1) % 7;
      const endRow = Math.floor((end - 1) / 7);

      // Calculate positions for the curve
      const startX = startCol * totalSize + buttonSize / 2;
      const startY = startRow * totalSize + buttonSize / 2;
      const endX = endCol * totalSize + buttonSize / 2;
      const endY = endRow * totalSize + buttonSize / 2;

      // Calculate control point for the curve (midpoint with an offset)
      const controlX = (startX + endX) / 2 - (totalSize / 4);
      const controlY = (startY + endY) / 2 - (totalSize / 4); // Adjust control point up for curvature

      // Create a new path element for the curved line
      const curveLinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      curveLinePath.setAttribute('d', `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
      curveLinePath.setAttribute('fill', 'none');
      curveLinePath.setAttribute('stroke', 'gold'); // Keep color gold for duplicates
      curveLinePath.setAttribute('stroke-width', '3'); 
      curveLinePath.setAttribute('stroke-linecap', 'round');
      curveLinePath.setAttribute('stroke-linejoin', 'round');

      svg.appendChild(curveLinePath); // Append the curved line to the SVG
    }
  });
}

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
let currentMapIndex = 1; // daysDiff + 10;  
let maps;
let currentMap;

async function loadMapData() {
  const response = await fetch('map_data.json');
  maps = await response.json();
  return maps;
}

let loaded_mapCharacters = [' '];

// Example sentence
const exampleSentence = "All men by nature desire to know".split("");  // Split into array of characters
const examplePath = [17, 10, 3, 2, 1, 8, 15, 22, 23, 24, 31, 32, 39, 38, 45, 46, 47, 40, 41, 34, 27, 26, 19, 12, 13, 20, 21, 14, 7, 6, 5, 4, 11, 18, 25];

// Initialize the map array (letter, number pairs)
let mapText = [];

// Populate mapText based on the examplePath and exampleSentence
for (let i = 0; i < examplePath.length; i++) {
  mapText.push({ letter: exampleSentence[i], number: examplePath[i] });
}

// Add missing positions (1 to 49) with empty string for letters
for (let i = 1; i <= 49; i++) {
  if (!examplePath.includes(i)) {
    mapText.push({ letter: "", number: i });
  }
}

// Sort the mapText array by number
mapText.sort((a, b) => a.number - b.number);

// Extract and return the letters as a sorted result
const result = mapText.map(item => item.letter);  // Just extract letters, do not join into string

// Optional: To log the result array as in the example format:
console.log(result);

loaded_mapCharacters = result;  // Already in array format

console.log(loaded_mapCharacters); // Just to verify the final array

async function createGameBoard(mapData, buttonCharacters) {
  // Clear the existing game board
  gameBoard.innerHTML = '';
  resetGameState();

  for (let i = 1; i <= N; i++) {
    const button = document.createElement('button');
    button.classList.add('game-button', 'no-border-button');
    button.style.backgroundColor = valueToColor(buttonColors[`button${i}`]);
    button.id = `button${i}`;
    button.addEventListener('click', () => handleButtonClick(i));

    // Set the character for the button
    button.innerHTML = buttonCharacters[i - 1] || ''; // Default to empty if out of bounds

    if (mapData[i - 1] === "0") {
      buttonColors[`button${i}`] = 0;
      blocked.push(i);
      button.style.backgroundColor = valueToColor(0); // Set blocked color immediately
    } else if (mapData[i - 1] === "2") {
      button.dataset.maxVisits = 2;
      const recycleIcon = document.createElement('span');
      recycleIcon.innerHTML = '🔄'; // Unicode recycle symbol
      recycleIcon.classList.add('recycle-icon');
      button.appendChild(recycleIcon);
    } else {
      buttonColors[`button${i}`] = 1;
      button.dataset.maxVisits = 1;
    }

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
    createGameBoard(maps[currentMapIndex], loaded_mapCharacters);
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
    createGameBoard(maps[currentMapIndex], loaded_mapCharacters);
  });
  gameBoard.appendChild(switchMapButton);

  // Update the CSS for button positioning
  document.querySelector('.next-map-button').style.gridColumn = '7';
  document.querySelector('.share-button').style.gridColumn = '6';
  document.querySelector('.restart-button').style.gridColumn = '1';

  currentMap = mapData;
  drawPath();
}

async function loadGame() {
// Load the map data from the JSON file
await loadMapData();

// Initialize the game board with the first map
gameBoard = document.getElementById('game-board');
await createGameBoard(maps[currentMapIndex], loaded_mapCharacters);




// No letters beyond first game:
loaded_mapCharacters = new Array(49).fill(' ');


}

loadGame();

// Helper functions
function valueToColor(value, fade = 1) {
  if (value === 0) return 'gray'; // Blocked square color
  if (value === 1) return 'black'; // Default square color
  if (value === 2) return `rgba(28, 120, 86, ${fade})`; // Visited square color
  if (value === 5) return 'white'; // Unused in this context, but kept for completeness
}

function updateButtonColor(j, path) {
  const buttonElement = document.getElementById(`button${j}`);
  const maxVisits = parseInt(buttonElement.dataset.maxVisits) || 1;
  const isInPath = path.includes(j);
  const currentVisits = path.filter(pos => pos === j).length;

  // console.log(`Button ${j}: Element: %o, Max Visits: ${maxVisits}, times in path: ${currentVisits}`, buttonElement);

  if (isInPath) {
      // If the square is in the path, show it as visited regardless of single or double visit
      const fadePercentage = 1 - (Math.log(getPositionInPath(j, path) + 1)) / 5;
      buttonElement.style.transition = 'background-color 0.25s ease';
      buttonElement.style.backgroundColor = valueToColor(2, fadePercentage); // Use visited color (2)
  } else {
      // If not in path, show original color
      buttonElement.style.backgroundColor = valueToColor(buttonColors[`button${j}`], 1);
  }

  if (currentVisits < maxVisits && maxVisits == 2){
      // If not in path, show original color
      buttonElement.style.backgroundColor = valueToColor(1, 0);
  }

  // Show/hide recycle icon for double-visit squares
  if (maxVisits === 2) {
      const recycleIcon = buttonElement.querySelector('.recycle-icon');
      if (recycleIcon) {
          recycleIcon.style.display = isInPath ? 'none' : 'block';
      }
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
  const col = Math.ceil(index / 7);
  const row = index % 7 === 0 ? 7 : index % 7;
  const neighbors = [
    (col > 1) ? (col - 2) * 7 + row : 0,
    (col < 7) ? (col) * 7 + row : 0,
    (row > 1) ? (col - 1) * 7 + row - 1 : 0,
    (row < 7) ? (col - 1) * 7 + row + 1 : 0
  ];
  return neighbors.filter(n => n > 0 && n <= N && n !== index);
}

function updatePosition(index) {
  return index;
}

function handleButtonClick(i, loaded_mapCharacters) {
  if (!blocked.includes(i)) {
    const buttonElement = document.getElementById(`button${i}`);
    const maxVisits = parseInt(buttonElement.dataset.maxVisits) || 1;
    const currentVisits = position.path.filter(pos => pos === i).length;

    // Log the button state
        console.log(`Button ${i}: Element: %o, Max Visits: ${maxVisits}, Current Visits: ${currentVisits}`, buttonElement);

    if (position.index === null || getNeighbors(position.index).includes(i)) {
      
      if (currentVisits < maxVisits) {
        buttonColors[`button${i}`] = incrementer(buttonColors[`button${i}`], i);
        position.index = updatePosition(i);
        position.path.push(i);
        buttonClicks[`button${i}`]++;


        // Logic to manage the recycling icon and checkmark
        if (maxVisits === 2) {
          const checkmarkIcon = buttonElement.querySelector('.checkmark-icon');
          const recycleIcon = buttonElement.querySelector('.recycle-icon');

          // Hide recycle icon and show checkmark if visited once
          if (currentVisits + 1 === 1) {
              if (recycleIcon) {
                  recycleIcon.style.display = 'none'; // Hide recycling icon
              }
              if (!checkmarkIcon) {
                const checkmarkIcon = document.createElement('span');
                checkmarkIcon.innerHTML = '✔️'; // Unicode checkmark symbol
                checkmarkIcon.classList.add('checkmark-icon'); // Add a class for styling if needed
                buttonElement.appendChild(checkmarkIcon); // Append checkmark icon to the button
            } else {
              checkmarkIcon.style.display = 'block';
            }

          } else if (currentVisits > 0) {
              // Hide checkmark icon
              if (checkmarkIcon) {
                checkmarkIcon.style.display = 'none'; // Hide checkmark for other cases
            }
          }
        }
      
        // Check if the map is completed
        const uniqueVisits = new Set(position.path).size;
        const totalSquares = N - blocked.length;
        const doubleVisitSquares = currentMap.split('').filter(char => char === '2').length;
        if (uniqueVisits === totalSquares && position.path.length === totalSquares + doubleVisitSquares) {
          mapCompleted = true;
          switchMapButton.classList.add('glow-big-gold-button');
          shareButton.classList.add('gold-button');
        }
      }
      

    } else if (position.index === i) {
      // Remove the button from the path and update the position.index
      const index = position.path.lastIndexOf(i);
      if (index !== -1) {
        position.path.splice(index);
        if (position.path.length > 0) {
          position.index = position.path[position.path.length - 1];
        } else {
          position.index = null;
        }
        buttonClicks[`button${i}`]++;
        buttonColors[`button${i}`] = decrementColor(buttonColors[`button${i}`], i);

        // Logic to manage the recycling icon and checkmark
        if (maxVisits === 2) {
          
          const checkmarkIcon = buttonElement.querySelector('.checkmark-icon');
          const recycleIcon = buttonElement.querySelector('.recycle-icon');

          // Hide recycle icon and show checkmark if visited once
          if (currentVisits - 1 === 1) {
              if (recycleIcon) {
                  recycleIcon.style.display = 'none'; // Hide recycling icon
              }
              checkmarkIcon.style.display = 'block'

          } else if (currentVisits - 1 === 0) {
            if (checkmarkIcon) {
              checkmarkIcon.style.display = 'none'; // Hide recycling icon
            }  
          }
          recycleIcon.style.display = 'block';
        
              // Hide checkmark icon
//              if (checkmarkIcon) {
 //               checkmarkIcon.style.display = 'none'; // Hide checkmark for other cases
  //          }
          }

        // Check if the map is no longer completed
        mapCompleted = false;
        switchMapButton.classList.remove('glow-big-gold-button');
        shareButton.classList.remove('gold-button');
      }
    }

    // Update borders and colors
    for (let j = 1; j <= N; j++) {
      const buttonElement = document.getElementById(`button${j}`);
      const maxVisits = parseInt(buttonElement.dataset.maxVisits) || 1;
      const currentVisits = position.path.filter(pos => pos === j).length;

      if (
        (position.index === null && !blocked.includes(j)) ||
        (getNeighbors(position.index).includes(j) && !blocked.includes(j) && currentVisits < maxVisits)
      ) {
        buttonElement.classList.add('glow-button');
      } else {
        buttonElement.classList.remove('glow-button');
      }

      if (position.index !== null && j === position.index) {
        buttonElement.classList.remove('glow-button');
        buttonElement.classList.add('glow-gold-button');
      } else {
        buttonElement.classList.remove('glow-gold-button');
      }

      updateButtonColor(j, position.path);
    }

    console.log(1 - Math.log(position.path.length + 1) / 10);
    console.log(getPositionInPath(i, position.path));
    console.log(position.path)

//    console.log(`Button ${41}:
 //     Element: %o
  //    Max Visits: ${parseInt(document.getElementById(`button${41}`).dataset.maxVisits) || 1}
   //   In Path: ${position.path.includes(41)}`);

    // Log the button click vector
    logButtonClickVector();

    // debug
  //  console.log(blocked);
  //  console.log(position.path);
  }
  drawPath();

  // Display current sentence generated
  printPathAsCharacters()
}

function decrementColor(value, position) {
  if (value === 2) return 1; // 
  if (value === 1) return 1; //
  return value; // For any other case (shouldn't happen)
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
  drawPath();
}

const completionMessageElement = document.getElementById('completion-message');
completionMessageElement.innerText = "Find the hidden message...";

// This can be used to get characters from the button indices
function printPathAsCharacters() {
  const pathMessage = position.path.map(index => {
      return loaded_mapCharacters[index - 1] || '?'; // Use '?' if out of bounds
  }).join('');

  const pathMessageElement = document.getElementById('path-message');
  const completionMessageElement = document.getElementById('completion-message');

  if (mapCompleted) { // Check if the game is solved
      pathMessageElement.innerText = `${pathMessage}`;
      pathMessageElement.style.color = 'gold'; // Change text color to gold
      completionMessageElement.innerText = "Aristotle, Metaphysics";

  } else {
      pathMessageElement.innerText = `${pathMessage}`;
      pathMessageElement.style.color = 'white'; // Keep text color white
      completionMessageElement.innerText = "Find the hidden message...";
  }

  console.log('Current Path:', pathMessage);
}

function convertToEmojis(mapData, maxPerLine = 7) {
  const emojiMap = {
    '0': '🪨',
    '1': '🟩',
    '2': '🔄'
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
