/**
 * @author rahul
 * 
 */

var fs = require("fs"); /// Only using this to create simulation pose file
var express = require('express');
var app = express();
var path = require('path');

var server = require('https').createServer({
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
  passphrase: '1234'
}, app);

var io = require('socket.io')(server);

var { config } = require('./config/environment');
console.info('config\t->', config)

server.listen(config.port, () => {
  console.log('Server listening at port %d', config.port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));


let rawdata = fs.readFileSync('./samples/dataframe.json');
// aruco-ip map
var univesalDataMap = {};
var scoreboard = {};

// if (config.env === "development") {
//   univesalDataMap = JSON.parse(rawdata);
// }

console.info('Dataframe\t->', univesalDataMap);

let playerList = ['0', '1']

io.on('connection', (socket) => {
  var arucoRegistration = false;
  var usernameRegistration = false;

  var playerId = playerList.pop();
  console.log('playerId', playerId)
  socket.playerId = playerId;
  socket.emit('playerId', playerId)

  // when the client emits 'dataframe', this listens and executes
  socket.on('dataframe', (data) => {
    if (!socket.playerId) return;
    univesalDataMap[socket.playerId ^ 1] = data
    // console.log(univesalDataMap)
    // emit in user channel also
    socket.broadcast.emit('dataframe', univesalDataMap);
  });

  // when the client emits 'register aruco', this listens and executes
  socket.on('register aruco', (arucoId) => {
    if (arucoRegistration) return;

    // we store the aruco id in the socket session for this client
    socket.arucoId = arucoId;
    arucoRegistration = true;
    socket.emit('registered', {
      arucoId
    });
    // echo globally (all clients) that a device has connected
    socket.broadcast.emit('aruco joined', {
      arucoId: socket.arucoId,
    });
    console.info(arucoId, 'registered')
  });

  // when the device disconnects.. perform this
  socket.on('disconnect', () => {
    if (arucoRegistration) {

      // echo globally that this client has left
      socket.broadcast.emit('unregister aruco', {
        arucoId: socket.arucoId,
      });

    }
    playerList.push(socket.playerId)
  });

  socket.on('hit', (data) => {
    if (!socket.username) return;
    scoreboard[socket.username] = data
    console.log(scoreboard)
    // emit in user channel also
    socket.emit('scoreboard', scoreboard);
  });

  socket.on('register user', (username) => {
    if (usernameRegistration) return;

    // we store the aruco id in the socket session for this client
    socket.username = username;
    usernameRegistration = true;
    socket.emit('user registered', {
      username
    });
    // echo globally (all clients) that a device has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
    });
    console.info(username, 'user registered')
  });


});

// setInterval(function(){ 
//   io.emit('mole', {
//     'mole': Math.floor(Math.random() * 3), 
//     'canHit': true
//   });
// }, 2000);