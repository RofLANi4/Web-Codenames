# Web Codenames

Web Codenames is a web-based implementation of the popular board game "Codenames." The game allows players to form two teams and compete to guess words based on their associations. This project aims to provide a fun and interactive platform for playing Codenames online with friends.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Gameplay](#gameplay)

## Features

- Two teams: Red and Blue.
- Real-time gameplay with Socket.IO.
- Player roles: Master and Player.
- Bot Masters for single-player or practice sessions.
- Word associations to guide players in guessing.
- Timer to keep the game pace.
- Game state persistence.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RofLANi4/Web-Codenames.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Web-Codenames
   ```
3. Install the dependencies
   ```bash
   npm install
   ```

## Usage

1. Start the server:

   ```bash
   node server.js
   ```

2. In a separate terminal, start the React development server:

   ```bash
   npm start
   ```

3. Open your web browser and navigate to http://localhost:3000.

## Gameplay

### Starting the Game

1. Join a team by clicking on the respective buttons: "Join Red Master", "Join Blue Master", "Join Red Player", or "Join Blue Player".
2. Once all players have joined, click the "Start Game" button.

### Playing the Game

- Masters: Provide associations for the words on the board.
- Players: Guess the words based on the associations provided by the master.
- Bot Masters: Automatically provide associations based on the remaining unguessed words.

### Word Selection

- Click on a word to select it. If you are a player, your team must collectively select the word to guess it.
- The game tracks the number of votes for each word and reveals the word when the required number of votes is reached.

### Timer

- The timer keeps track of the game time. Ensure your team guesses words before the time runs out.
