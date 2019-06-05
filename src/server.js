/**
 * @author rahul
 * 
 */

var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require("fs"); /// Only using this to create simulation pose file

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

if (config.env === "development") {
  univesalDataMap = JSON.parse(rawdata);
}

console.info('Dataframe\t->', univesalDataMap);

io.on('connection', (socket) => {
  var arucoRegistration = false;

  // when the client emits 'dataframe', this listens and executes
  socket.on('dataframe', (data) => {
    univesalDataMap[socket.arucoId] = data

    // emit in user channel also
    socket.emit('dataframe', univesalDataMap);

    // we tell the client to execute 'dataframe'
    socket.broadcast.emit('dataframe', univesalDataMap);
    // fs.appendFile("./pose_test_5.json", JSON.stringify(univesalDataMap, null, 4), (err) => {
    //   if (err) {
    //       console.error(err);
    //       return;
    //     };
    //    console.log("File has been created");
    //   });

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
  });
});
