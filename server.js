const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://26.117.70.106:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let words = [];


const wordSchema = new mongoose.Schema({
  word: String,
  associations: [String], // Масив асоціацій для кожного слова
});


const Word = mongoose.model("Word", wordSchema);


mongoose
  .connect(
    "mongodb+srv://Zhovtovatiuk:12345@cluster0.fjkkmek.mongodb.net/Codenames",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Підключення до бази даних успішне");
    updateWords();
  })
  .catch((err) => console.error("Помилка підключення до бази даних:", err));


async function updateWords() {
  try {
    const wordsFromDB = await Word.find({});


    words = wordsFromDB.map((wordObj) => ({
      word: wordObj.word,
      associations: wordObj.associations,
    }));

  } catch (error) {
    console.error("Помилка при отриманні слів з бази даних:", error);
  }
}

let gameState = {
  users: [],
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


let previousAssociations = new Set();

function selectAssociation(activeTeam) {
  const currentTeam = activeTeam;
  const unguessedWords = gameState.coloredWords.filter(
    (word) => word.guessed === false && word.color === currentTeam
  );


  let associationFrequency = {};

  unguessedWords.forEach((wordObj) => {
    wordObj.word.associations.forEach((assoc) => {
      if (associationFrequency[assoc]) {
        associationFrequency[assoc]++;
      } else {
        associationFrequency[assoc] = 1;
      }
    });
  });


  let maxFrequency = 0;
  let bestAssociation = null;

  for (let assoc in associationFrequency) {
    if (
      associationFrequency[assoc] > maxFrequency &&
      !previousAssociations.has(assoc)
    ) {
      maxFrequency = associationFrequency[assoc];
      bestAssociation = assoc;
    }
  }


  if (!bestAssociation && unguessedWords.length > 0) {
    for (let wordObj of unguessedWords) {
      for (let assoc of wordObj.word.associations) {
        if (!previousAssociations.has(assoc)) {
          bestAssociation = assoc;
          break;
        }
      }
      if (bestAssociation) break;
    }
  }


  if (!bestAssociation) {
    previousAssociations.clear();
    bestAssociation = unguessedWords[0].word.associations[0];
  }

  // Добавить выбранную ассоциацию в предыдущие ассоциации
  previousAssociations.add(bestAssociation);
  console.log(bestAssociation, maxFrequency);

  return `${bestAssociation} ${maxFrequency}`;
}

function generateColoredWords(
  words,
  blueCount,
  redCount,
  whiteCount,
  blackCount
) {
  const coloredWords = [];
  const wordColors = [];


  for (let i = 0; i < blueCount; i++) {
    let index;
    do {
      index = Math.floor(Math.random() * words.length);
    } while (wordColors[index] !== undefined); // Проверяем, что слово еще не было выбрано
    wordColors[index] = "blue";
  }


  for (let i = 0; i < redCount; i++) {
    let index;
    do {
      index = Math.floor(Math.random() * words.length);
    } while (wordColors[index] !== undefined); // Проверяем, что слово еще не было выбрано
    wordColors[index] = "red";
  }


  for (let i = 0; i < whiteCount; i++) {
    let index;
    do {
      index = Math.floor(Math.random() * words.length);
    } while (wordColors[index] !== undefined); // Проверяем, что слово еще не было выбрано
    wordColors[index] = "white";
  }

  
  for (let i = 0; i < blackCount; i++) {
    let index;
    do {
      index = Math.floor(Math.random() * words.length);
    } while (wordColors[index] !== undefined); // Проверяем, что слово еще не было выбрано
    wordColors[index] = "black";
  }

 
  for (let i = 0; i < words.length; i++) {
    coloredWords.push({
      word: words[i],
      color: wordColors[i],
      guessed: false,
    });
  }

  return coloredWords;
}

let timer = 120;
let intervalId;
let method = "add";

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("joinMaster", (team, nickname, userId) => {
    const master = { id: userId, nickname, team, role: "master" };
    if (userId === "redBot") {
      setTimeout(() => {
        if (!gameState.associations) {
          gameState.associations = { red: [], blue: [] };
        }
        gameState.associations["red"].push(selectAssociation("red"));
        socket.emit("updateGameState", gameState);
        startTimer();
      }, 5000);
    }
    gameState.users.push(master);
    socket.emit("updateGameState", gameState);
  });

  socket.on("startGame", () => {
    gameState.isGameStarted = true;

    const blueCount = 10;
    const redCount = 9;
    const whiteCount = 4;
    const blackCount = 2;

    const coloredWords = generateColoredWords(
      shuffleArray(words).slice(0, 25),
      blueCount,
      redCount,
      whiteCount,
      blackCount
    );

    gameState.coloredWords = coloredWords;

    io.emit("updateGameState", gameState);
    io.emit("gameStarted");
  });

  socket.on("restartGame", () => {
    gameState.users.length = 0;
    if (intervalId) {
      clearInterval(intervalId);
    }
    gameState.associations = { red: [], blue: [] };

    timer = 120;
    io.emit("updateActiveTeam", "red");
    io.emit("gameRestarted", timer);
    io.emit("updateGameState", gameState);
  });

  socket.on("joinPlayer", (team, nickname, userId) => {
    const player = { id: userId, nickname, team, role: "player" };
    gameState.users.push(player);
    socket.emit("updateGameState", gameState);
    socket.broadcast.emit("updateGameState", gameState);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("buttonClicked", (id) => {
    io.emit("clickReaction", id, method);
  });
  socket.on("changeMasterControle", (masterControle) => {
    io.emit("changeMasterControle", masterControle);
  });

  socket.on(
    "toggleWordSelection",
    (gameState, index, activeUsers, activeTeam) => {
      const word = gameState.coloredWords[index];
      if (word) {
        if (activeUsers.indexOf(socket.id) !== -1) {
          if (word.selectedCount > 0) {
            word.selectedCount--;
          } else word.selectedCount = 0;
        } else {
          word.selectedCount++;
          if (
            word.selectedCount ===
            gameState.users.filter(
              (user) => user.role === "player" && user.team === activeTeam
            ).length
          ) {
            word.guessed = true;
            word.selectedCount = 0;
            if (word.color === activeTeam) {
              io.emit("updateGameState", gameState);
              timer += 15;
              method = "remove";
              return;
            } else if (word.color === "white") {
              changeActiveTeam(activeTeam, gameState);
              method = "remove";
              return;
            } else if (word.color === "black") {
              endGame();
              return;
            } else {
              changeActiveTeam(activeTeam, gameState);
              method = "remove";
              return;
            }
          }
        }

        io.emit("updateGameState", gameState);

        function endGame() {
          gameState.coloredWords.forEach((word) => (word.guessed = true));
          if (intervalId) {
            clearInterval(intervalId);
          }
          io.emit("updateGameState", gameState);
        }
      }
    }
  );
  function changeActiveTeam(activeTeam, gameState) {
    if (intervalId) {
      clearInterval(intervalId);
    }
    timer = 120;
    if (activeTeam === "red") {
      activeTeam = "blue";
    } else activeTeam = "red";
    if (
      gameState.users &&
      gameState.users.length > 0 &&
      gameState.users[0].id.includes("Bot")
    ) {
      setTimeout(() => {
        gameState.associations[activeTeam].push(selectAssociation(activeTeam));
        socket.emit("updateGameState", gameState);
      }, 5000);
    }
    gameState.coloredWords.forEach((word) => (word.selectedCount = 0));
    io.emit("updateActiveTeam", activeTeam, timer);
    io.emit("updateGameState", gameState);
    io.emit("changeMasterControle", true);
    startTimer();
  }
  socket.on("submitAssociation", (gameState, associationWord, color) => {
    if (!gameState.associations) {
      gameState.associations = { red: [], blue: [] };
    }
    gameState.associations[color].push(associationWord);
    io.emit("updateGameState", gameState);
  });

  socket.on("changeActiveTeam", (activeTeam, gameState, methodParam) => {
    method = methodParam;
    changeActiveTeam(activeTeam, gameState);
  });

  socket.on("firstAssociation", (gameStates) => {
    gameState = gameStates;
    if (intervalId) {
      clearInterval(intervalId);
    }
    timer = 120;
    startTimer();
  });

  function startTimer() {
    intervalId = setInterval(() => {
      timer--;
      io.emit("restartTime", timer);
      if (timer === 0) {
        clearInterval(intervalId);
      }
    }, 1000);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
