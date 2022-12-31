const express = require("express");
// const CryptoJS = require("crypto-js");
// const { TaskTimer } = require("tasktimer");
const axios = require("axios").default;
const moment = require("moment");

var cors = require("cors");

const http = require("http");
const socketIo = require("socket.io");

const {
  generateServerSeed,
  combine,
  randomString,
  getCrashPoint,
} = require("./utils");
const app = express();
app.use(cors());
const port = process.env.PORT || 5000; 
let running = true;
roudBetting = true;

const server = http.createServer(app);
//const io = socketIo(server);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000","https://safaribust.netlify.app"], //https://demo.safaribust.co.ke
  },
});

let interval;
let socketList = [];
let liveData = [];
let nextLive = [];
let round = 0;
let chats=[]
io.on("connection", (socket) => {
  console.log("New client connected");
  if (!socketList.includes(socket)) {
    socketList.push(socket);
  }
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 20);
  interval = setInterval(() => getApiAndEmit2(socket), 20);
  socket.on("event", (data, callback) => {
   
    let dt = { round: round, data: data };
    if (data) {
      liveData.push(dt);
      callback("Received");
    } else {
      callback("event 1 not received");
    }
  });
  socket.on("chat", (data, callback) => {
    if (data) {
      chats.push(data);
      callback("Received");
    } else {
      callback("event 1 not received");
    }
  });
  socket.on("event2", (data, callback) => {
    if (data) {
      let index = liveData.findIndex(
        (obj) =>
          obj?.round === round - 1 && obj?.data?.username === data?.username
      );
      try {
        liveData[index].data.at = data?.at;
        liveData[index].data.win = data?.win;
        nextLive.push(data);
        callback(data);
      } catch (error) {
        console.log(error);
      }
    } else {
      callback("event 2 not received");
    }
  });
  socket.on("event3", (data, callback) => {
    if (data) {
      try {
        const newArr = liveData.filter(
          (item) =>
            item?.data?.username !== data?.username && item.round === round - 1
        );
        liveData = newArr;
        callback("Deleted");
      } catch (error) {}
    } else {
      callback("Not deleted");
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    var i = socketList.indexOf(socket);
    socketList.splice(i, 1);
  });
});
/**Algorithm */
let clientSeed = randomString(20);
let serverSeed = "";
let results = [];
let nonce = 0;
let crashPoint = "1.00";

let time = 0.98;

const crushSetter = () => {
  serverSeed = generateServerSeed();
  nonce = results.length + 1;
  const combination = combine(serverSeed, clientSeed, nonce);
  crashPoint = (getCrashPoint(combination) / 100).toFixed(2);
  const newResult = {
    serverSeed,
    clientSeed,
    nonce,
    point: crashPoint,
    round: round,
    time: moment().format("MMMM Do YYYY, h:mm:ss a"),
  };
  serverSeed = generateServerSeed();

  if (crashPoint > 20) {
    return crushSetter();
  }

  return results.push(newResult);
};
var something = (function () {
  var executed = false;
  return function () {
    if (!executed) {
      executed = true;
      crushSetter();
    }
  };
})();

something();
var id = setInterval(timer, 50); //call test every 10 seconds.
let cd;
let countDown = 5;

function hello() {
  countDown = countDown - 1;
}
function timer() {
  time = time + 0.01;
  running = true;
  roudBetting = true;
  if (running === true) {
    cd = setInterval(hello, 1000);
  }
  // console.log(time.toFixed(2))
  if (time.toFixed(2) === parseFloat(crashPoint).toFixed(2)) {
    stop();
    //console.log(crashPoint)
    running = false;
    if (running === false) {
      cd = setInterval(hello, 1000);
    }
    setTimeout(() => {
      crushSetter();
      time = 0.98;
      id = setInterval(timer, 50);
      roudBetting = false;
      round += 1;
    }, 5000);
  }
}
function stop() {
  // call this to stop your interval.
  clearInterval(id);
}

const getApiAndEmit = (socket) => {
  const response = {
    data: results[results.length - 1],
    //game:results,
    time: time,
    running: running,
    cd: countDown,
    users: socketList.length,
    liveBets: liveData,
    round: round,
  };
  // console.log(response.liveBets)
  // Emitting a new message. Will be consumed by the client
  io.sockets.emit("FromAPI", response);
};
const getApiAndEmit2 = (socket) => {
  io.sockets.emit("FromAPI2", chats);
};
//this is the verification url
app.get("/verify", (req, res, next) => {
  console.log("here")
  const combination = combine(serverSeed, clientSeed, nonce);
  const result = (getCrashPoint(combination) / 100).toFixed(2);
  res.status(200).json({ status: 200, result: result });
  next();
});
server.listen(port, () => console.log(`Listening on port ${port}`));

// #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
