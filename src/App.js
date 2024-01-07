import "./App.css";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://26.117.70.106:4000");

//http://26.117.70.106:4000
//http://localhost:4000

function App() {
  const [count, setCount] = useState(0);

  const increment = () => {
    const newValue = count + 1;
    setCount(newValue);
    socket.emit("updateCount", newValue);
  };

  const clearCount = () => {
    setCount(0);
    socket.emit("updateCount", 0);
  };

  useEffect(() => {
    console.log("useEffect запущен");
    socket.on("updateValue", (value) => {
      console.log("Новое знчение:", value);
      setCount(value);
    });
    return () => {
      socket.off("updateCount");
    };
  }, []);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>Увеличить</button>
      <button onClick={clearCount}>Очистить поле</button>
    </div>
  );
}

export default App;
