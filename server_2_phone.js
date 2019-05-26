var express = require('express');

var app = express();
var server = app.listen(3000);
var user_data_new = []
var maker_id_recieved 
var dummy_ip = '10.128.88.2'
var data_to_send = {}
// var connect = require("connect");
app.use(express.static(__dirname + '/public'));
// var app = connect().use(connect.static(__dirname + '/public'));


// aruco id closest 
console.log("My socket server is running")

var io = require('socket.io')(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
// io.sockets.on('connection',
//   // We are given a websocket object in our function
//   function (socket) {
  
//     console.log("We have a new client: " + socket.id);
//     socket.on('data',function show_data(data)
//     {
//     str = JSON.stringify(data);
//     console.log(str);
//     }) 
//   });

 io.sockets.on('connection',newConnection);
 function newConnection(socket){
  console.log("We have a new client: " + socket.id);
  socket.on('dummy',inData)
  function inData(data)
  {
    console.log(data);
    user_data_new.push(data)
    console.log('After pushing data looks like this')
    console.log(user_data_new)
  }
  socket.on('dummy2',checkButton)
  function checkButton(data)
  {
    maker_id_recieved = data;
    console.log('Marker id sent is '+data)
    for(var i = 0; i < user_data_new.length; i += 1)
    {
      if(maker_id_recieved in user_data_new[i])
      {
        console.log('Key present for '+ user_data_new[i][maker_id_recieved])
        continue
      }
      else{
        continue
        // console.log('Key not present currently. Please enroll first')
      }

    }
  }
  socket.on('dummy3',getPose)
  function getPose(data)
  {
    // console.log(data)
    let pose = data;
    // console.log(data['data'])
    // for (let j = 0; j < pose.length; j++) {
     
    //   var x = pose[j].position.x
    //   var y = pose[j].position.y
    //   console.log('x is ::'+x+' and y is::'+y)
    console.log('Data to send is')
    data_to_send[data['data']['ip']]={'pose':data['data']['pose']}
    // socket.broadcast.emit('dummy4',data_to_send);
    
    console.log(data_to_send)
    // }

  }
  socket.on('dummy5',sendPose)
  function sendPose(data)
  {
    console.log('ip recieved is::')
    console.log(data_to_send[data]['pose']['pose'])
    socket.emit('dummy4',data_to_send[data]['pose']['pose']);
    console.log('resending data done')
    // if(data==dummy_ip)
    // {
      // socket.emit('dummy4',data_to_send[data]);
      // console.log('resending data done')
    // }
  }

  // function fetchPose
  // console.log('Going to send the data out')
  // io.emit('dummy4',data_to_send);
  // console.log('Data has been sent successfully')
 }