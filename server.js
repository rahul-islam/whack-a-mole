/**
 * @author rahul
 * 
 */

var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// aruco-ip map
univesalDataMap = {}

io.on('connection', (socket) => {
  var arucoRegistration = false;

  // when the client emits 'new message', this listens and executes
  socket.on('dataframe', (data) => {
      univesalDataMap[socket.arucoId] = data
      
    // we tell the client to execute 'new message'
    socket.broadcast.emit('dataframe', univesalDataMap );
  }); 

  // when the client emits 'add user', this listens and executes
  socket.on('register aruco', (arucoId) => {
    if (arucoRegistration) return;

    // we store the username in the socket session for this client
    socket.arucoId = arucoId;
    arucoRegistration = true;
    socket.emit('registered', {
      arucoId
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('aruco joined', {
        arucoId: socket.arucoId,
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (arucoRegistration) {

      // echo globally that this client has left
      socket.broadcast.emit('unregister aruco', {
        arucoId: socket.arucoId,
      });
    }
  });
});
