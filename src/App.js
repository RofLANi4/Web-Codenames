import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://26.117.70.106:4000");
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

function App() {
  const [gameState, setGameState] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [associationWord, setAssociationWord] = useState("");
  const [activeTeam, setActiveTeam] = useState("red");
  const [showMasterControls, setShowMasterControls] = useState(true);
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId && socket.id) {
      localStorage.setItem("userId", socket.id);
    } else if (localStorage.getItem("userId") !== socket.id) {
      socket.id = localStorage.getItem("userId");
    }
  }, []);

  useEffect(() => {
    socket.on("updateGameState", (gameState) => {
      if (gameState !== null) {
        setGameState(gameState);
      }
    });
    return () => {
      socket.off("updateGameState");
    };
  }, []);

  useEffect(() => {
    socket.on("gameStarted", () => {
      setIsGameStarted(true);
    });
    return () => {
      socket.off("gameStarted");
    };
  }, []);

  useEffect(() => {
    socket.on("gameRestarted", (time) => {
      setTimer(time);
      setIsGameStarted(false);
    });
    return () => {
      socket.off("gameRestarted");
    };
  }, []);

  useEffect(() => {
    socket.on("clearActiveUsers", (activeUsers) => {
      setActiveUsers(activeUsers);
    });
    return () => {
      socket.off("clearActiveUsers");
    };
  }, []);

  useEffect(() => {
    socket.on("clickReaction", (userId, method) => {
      if (method === "remove") {
        setActiveUsers([]);
      } else
        setActiveUsers((prevActiveUsers) => {
          if (prevActiveUsers.includes(userId)) {
            return prevActiveUsers.filter((user) => user !== userId);
          } else {
            return [...prevActiveUsers, userId];
          }
        });
    });

    return () => {
      socket.off("clickReaction");
    };
  }, []);

  useEffect(() => {
    socket.on("updateActiveTeam", (team) => {
      setActiveTeam(team);
    });
    return () => {
      socket.off("updateActiveTeam");
    };
  }, []);

  useEffect(() => {
    const handleRestartTime = (time) => {
      if (time === 0) {
        socket.emit("changeActiveTeam", activeTeam, gameState, "add");
      }
      setTimer(time);
    };

    socket.on("restartTime", handleRestartTime);

    return () => {
      socket.off("restartTime", handleRestartTime);
    };
  }, [activeTeam, gameState]);

  const joinMaster = (team, playerOrBot) => {
    if (playerOrBot === "player") {
      const nickname = prompt("Введіть нік:");
      if (nickname !== null && nickname !== "") {
        socket.emit("joinMaster", team, nickname, socket.id);
      } else {
        alert("Нік не може бути пустим");
      }
    } else if (playerOrBot === "bot" && team === "blue") {
      socket.emit("joinMaster", team, "Бот Санчізес", "blueBot");
    } else socket.emit("joinMaster", team, "Бот Чіназес", "redBot");
  };

  const joinPlayer = (team) => {
    const nickname = prompt("Введіть нік:");
    if (nickname !== null && nickname !== "") {
      socket.emit("joinPlayer", team, nickname, socket.id);
    } else {
      alert("Нік не може бути пустим");
    }
  };

  const restartGame = () => {
    setActiveUsers([]);
    socket.emit("restartGame");
  };

  const startGame = () => {
    setActiveUsers([]);
    socket.emit("startGame");
  };

  const isUserMaster = (socketId) => {
    const user = gameState.users.find((user) => user.id === socketId);
    return user && user.role === "master";
  };

  const isUserPlayer = (socketId) => {
    const user = gameState.users.find((user) => user.id === socketId);
    return user && user.role === "player";
  };

  const toggleWordSelection = (index, userId) => {
    if (!isUserMaster(userId) && isUserPlayer(userId)) {
      const word = gameState.coloredWords[index];

      if (
        gameState &&
        gameState.coloredWords &&
        gameState.coloredWords[index]
      ) {
        if (isNaN(word.selectedCount)) {
          word.selectedCount = 0;
        }
        if (word) {
          socket.emit(
            "toggleWordSelection",
            gameState,
            index,
            activeUsers,
            activeTeam
          );
        }
      }
    }
  };

  const chekingWhoClicked = (userId) => {
    socket.emit("buttonClicked", userId);
  };

  const showWhoClicked = (userId) => {
    return activeUsers.includes(userId) ? "active" : "";
  };

  const submitAssociation = (color) => {
    socket.emit("submitAssociation", gameState, associationWord, color);
    setAssociationWord("");
  };

  useEffect(() => {
    socket.on("changeMasterControle", (masterControle) => {
      setShowMasterControls(masterControle);
    });
    return () => socket.off("changeMasterControle");
  }, []);

  const changeActiveTeam = () => {
    socket.emit("changeActiveTeam", activeTeam, gameState, "add");
  };

  const firstAssociation = () => {
    socket.emit("firstAssociation", gameState);
  };

  const handleButtonClick = () => {
    socket.emit("changeMasterControle", false);
  };

  return (
    <div className="App">
      <h1>Codenames Game by Artem Zhowtovatiuk</h1>
      <div className="role-selection">
        <button onClick={() => joinMaster("red", "player")}>
          Join Red Master
        </button>
        <button onClick={() => joinMaster("blue", "player")}>
          Join Blue Master
        </button>
        <button onClick={() => joinPlayer("red")}>Join Red Player</button>
        <button onClick={() => joinPlayer("blue")}>Join Blue Player</button>
        <button onClick={() => joinMaster("red", "bot")}>
          Join Red Bot Master
        </button>
        <button onClick={() => joinMaster("blue", "bot")}>
          Join Blue Bot Master
        </button>
        <button onClick={changeActiveTeam}>Switch Active Team</button>
      </div>
      <div className="restart-game">
        <button onClick={restartGame}>Restart Game</button>
      </div>
      {!isGameStarted && <button onClick={startGame}>Start Game</button>}
      {gameState && gameState.coloredWords && isGameStarted && (
        <div className="game-board">
          <div className="main-row">
            {/*КОМАНДА ЧЕРВОНИХ*/}
            <div className={`team red`}>
              <div className="players">
                {gameState.users
                  .filter(
                    (user) => user.team === "red" && user.role === "master"
                  )
                  .map((user) => (
                    <div key={user.id}>{user.nickname} (Майстер)</div>
                  ))}
                {gameState.users
                  .filter(
                    (user) => user.team === "red" && user.role === "player"
                  )
                  .map((user) => (
                    <div key={user.id} className={showWhoClicked(user.id)}>
                      {user.nickname}
                    </div>
                  ))}
              </div>
              <div className="associations">
                <div className="associations-words">
                  <ul>
                    {gameState.associations &&
                      gameState.associations["red"].map(
                        (association, index) => (
                          <li key={index}>{association}</li>
                        )
                      )}
                  </ul>
                </div>
                {gameState.users
                  .filter(
                    (user) =>
                      user.id === socket.id &&
                      user.role === "master" &&
                      user.team === "red"
                  )
                  .map(
                    (user) =>
                      activeTeam === "red" &&
                      showMasterControls && (
                        <div className="master-controls" key={user.id}>
                          <input
                            type="text"
                            value={associationWord}
                            onChange={(e) => setAssociationWord(e.target.value)}
                            placeholder="Введіть слово"
                          />
                          <button
                            onClick={() => {
                              submitAssociation("red");
                              if (!gameState.associations) {
                                firstAssociation();
                              }
                              handleButtonClick();
                            }}
                          >
                            Додати
                          </button>
                        </div>
                      )
                  )}
                {activeTeam === "blue" ||
                  (activeTeam !== "blue" && (
                    <div className="timer">{timer} сек</div>
                  ))}
                <p className="words-left-red">
                  {
                    gameState.coloredWords.filter(
                      (word) => word.color === "red" && word.guessed === false
                    ).length
                  }
                </p>
              </div>
            </div>
            {/*ПОЛЕ ЗІ СЛОВАМИ*/}
            <div className="words-field">
              <div className="words">
                {gameState.coloredWords.map((words, index) => (
                  <div
                    key={index}
                    className={`word ${
                      isUserMaster(socket.id)
                        ? `word-${words.color}`
                        : words.guessed
                        ? `word-${words.color}`
                        : ""
                    }`}
                  >
                    <div
                      onClick={() => {
                        if (
                          isUserPlayer(socket.id) &&
                          !words.guessed &&
                          gameState.users.find((user) => user.id === socket.id)
                            .team === activeTeam
                        ) {
                          toggleWordSelection(index, socket.id);

                          chekingWhoClicked(socket.id);
                        }
                      }}
                      lang="uk"
                      className={`word-box`}
                    >
                      <p lang="uk">{words.word.word}</p>
                      {words.selectedCount > 0 && (
                        <div className="selected-count">
                          <p>{words.selectedCount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/*КОМАНДА СИНІХ*/}
            <div className={`team blue`}>
              <div className="players">
                {gameState.users
                  .filter(
                    (user) => user.team === "blue" && user.role === "master"
                  )
                  .map((user) => (
                    <div key={user.id}>{user.nickname} (Майстер)</div>
                  ))}
                {gameState.users
                  .filter(
                    (user) => user.team === "blue" && user.role === "player"
                  )
                  .map((user) => (
                    <div key={user.id} className={showWhoClicked(user.id)}>
                      {user.nickname}
                    </div>
                  ))}
              </div>
              <div className="associations">
                <div className="associations-words">
                  <ul>
                    {gameState.associations &&
                      gameState.associations["blue"].map(
                        (association, index) => (
                          <li key={index}>{association}</li>
                        )
                      )}
                  </ul>
                </div>
                {gameState.users
                  .filter(
                    (user) =>
                      user.id === socket.id &&
                      user.role === "master" &&
                      user.team === "blue"
                  )
                  .map(
                    (user) =>
                      activeTeam === "blue" &&
                      showMasterControls && (
                        <div className="master-controls" key={user.id}>
                          <input
                            type="text"
                            value={associationWord}
                            onChange={(e) => setAssociationWord(e.target.value)}
                            placeholder="Введіть слово"
                          />
                          <button
                            onClick={() => {
                              submitAssociation("blue");
                              if (!gameState.associations) {
                                firstAssociation();
                              }
                              handleButtonClick();
                            }}
                          >
                            Додати
                          </button>
                        </div>
                      )
                  )}
                {activeTeam === "red" ||
                  (activeTeam !== "red" && (
                    <div className="timer">{timer} сек</div>
                  ))}
                <p className="words-left-blue">
                  {
                    gameState.coloredWords.filter(
                      (word) => word.color === "blue" && word.guessed === false
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
