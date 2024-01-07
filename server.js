const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://26.117.70.106:3000",
    methods: ["GET", "POST"],
  },
});

//http://26.117.70.106:3000
//http://localhost:3000

app.use(cors());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", (socket) => {
  console.log("Пользователь подключен");

  socket.on("updateCount", (value) => {
    socket.broadcast.emit("updateValue", value);
  });

  socket.on("disconnect", () => {
    console.log("Пользователь отключен");
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
