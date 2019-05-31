var video, canvas, context, imageData, detector, canvas1, poseNet, poses = [];
var socket = io();
// var socket3 = io.connect('http://localhost:3000/getusermedia.html');
var button_value = false; //Enroll button. Pressed to enrol a marker. 
var button_value_2 = false; // Check button. On clicking, the main dataframe on the server is checked for registered aruco id
var button_value_3 = false;  // On press. Pose of person starts getting emitted to server.
var button_value_4 = false; //On press. IP of device is sent to socket and pose is fetched
var socket1 = io();  // pose is emitted using this socket
var socket2 = io(); // ip transmitted
// var socket3 = io();
var user_Data = {}; //contains marker id and corresponding pose value
var user_pose_Dat = {}; //json used to emit ip,pose pair

var user_ip; // ip of user stored in variable using getIP function
var poses_received = {}; //pose recieved from server using button_value_4 and socket 2
// var socket;
socket.emit('register aruco', 'A')
socket.on('dataframe', (data) => {
    console.log(data);
});

const sendDataFrame = (poses) => {
    socket.emit('dataframe', {
        human: {
            pose: poses
        }
    });
}

function setup() {
    alert(screen.width)

    // canvas1 = createCanvas(screen.width-50, 480);
    canvas1 = createCanvas(640, 480);
    canvas1.parent('myContainer');
    // canvas2 = createCanvas(640,80);
    video = createCapture(VIDEO);
    video.size(width, height);
    canvas = canvas1.canvas;

    context = canvas.getContext("2d");
    canvas.width = parseInt(canvas.style.width);
    canvas.height = parseInt(canvas.style.height);
    // socket = socket.io.connect('http://localhost:3000')
    poseNet = ml5.poseNet(video, modelLoaded);
    fetchedPose = [];
    poseNet.on('pose', function (results) {
        poses = results; //poses recieved  
        // console.log(poses)
        sendDataFrame(poses)
    });
    // Hide the video element, and just show the canvas
    video.hide();

    detector = new AR.Detector();

    requestAnimationFrame(tick);

    // socket = socket.io.connect('http://localhost:3000')
}


function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
        iceServers: []
    }),
        noop = function () { },
        localIPs = {},
        ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

    //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer().then(function (sdp) {
        sdp.sdp.split('\n').forEach(function (line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });

        pc.setLocalDescription(sdp, noop, noop);
    }).catch(function (reason) {
        // An error occurred, so handle the failure to connect
    });

    //listen for candidate events
    pc.onicecandidate = function (ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}

var dummy_ip = '10.128.88.2'
getUserIP(function (ip) {
    user_ip = ip.toString()
    alert("Got IP! :" + ip);
});


function modelLoaded() {
    console.log('Model Loaded!');
}

// var socket1 = io();
// var socket2 = io();
// var socket3 = io();
function tick() {
    requestAnimationFrame(tick);
    image(video, 0, 0, width, height);
    imageData = context.getImageData(0, 0, width, height);
    var markers = detector.detect(imageData); //markers detected at this step
    drawCorners(markers); //marker corners drawn
    drawId(markers); //marker id written
    drawKeypoints(); //pose keypoints drawn
    drawSkeleton(); //pose skeleton drawn
    if (Object.getOwnPropertyNames(poses_received).length != 0) {
        drawKeypoints_fetched();  //check if poses_recieved.length is not 0 on pressing fetch_button and draw them
    }
    if (button_value_3) {
        // logPose();  
        console.log('Emitting pose to server')
        // user_pose_Dat[user_ip]=[poses[poses.length-1]]; 
        user_pose_Dat['data'] = { 'ip': user_ip, 'pose': poses[poses.length - 1] }
        // console.log(user_pose_Dat[user_ip][0].pose.keypoints)
        // socket1.emit('dummy3',user_pose_Dat[user_ip][0].pose.keypoints);
        socket1.emit('dummy3', user_pose_Dat);
        //  console.log(button_value_3)
    }
    if (button_value_4) {
        socket2.emit('dummy5', user_ip)

        socket2.on('dummy4', function (data) {


            // console.log(data['pose_data'])

            console.log('data fetched from server is::')
            // console.log(data)
            // if(data['pose_data']['ip']==dummy_ip)
            // {
            // poses_received = data['pose'][user_ip]
            poses_received = data
            console.log('results is::')
            console.log(poses)
            console.log('recieved')
            console.log(poses_received['keypoints'][0])
            // drawKeypoints_fetched();
            // }
        });

    }


}

function get_and_draw(data) {
    console.log('The server has a message for you: ')
    // console.log(data)
}
function snapshot() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}


function drawKeypoints_fetched() {
    // Loop through all the poses detected
    // for (let i = 0; i < poses_received.length; i++) {
    // For each pose detected, loop through all the keypoints
    // let pose = poses_received[0].pose;
    for (let j = 0; j < poses_received['keypoints'].length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = poses_received['keypoints'][j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
            fill(0, 255, 0);
            noStroke();
            ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        }
    }
    // }
}

var pointSize = 3;

function drawCoordinates_on_cavas(x, y) {
    console.log('inside function')
    var ctx = document.getElementById("canvas").getContext("2d");


    ctx.fillStyle = "#ff2626"; // Red color

    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2, true);
    ctx.fill();
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}

function drawCorners(markers) {
    var corners, corner, i, j;

    context.lineWidth = 3;

    for (i = 0; i !== markers.length; ++i) {
        corners = markers[i].corners;

        context.strokeStyle = "red";
        context.beginPath();

        for (j = 0; j !== corners.length; ++j) {
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }

        context.stroke();
        context.closePath();

        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

//The following function is just used for debugging and notifying that marker has been enrolled
function Enrollment(marker_id, pose_lenth) {
    if (pose_lenth == 0) {
        alert(marker_id);

        //  alert(user_Data);
    }
    else {
        console.log(pose_lenth)
        alert(marker_id + ' pose detected')
        // user_Data[marker_id]=ip;
        // alert(user_Data);
    }
    //document.write ("This is a warning message!");
}

function change()  //function used to change value of enroll button
{
    if (!button_value) {
        button_value = true
    }
}

function check()  //function used to change value of check button
{
    if (!button_value_2) {
        button_value_2 = true
    }
}

function sendPose() {
    // if(button_value_3==false)
    // {
    button_value_3 = !button_value_3
    // }
}

function fetchPose() {
    // if(button_value_3==false)
    // {
    button_value_4 = !button_value_4
    // }
}
function logPose() {
    if (button_value_3) {
        // var socket = io();
        // socket.emit('dummy3',user_Data);
        // console.log('dfnasdhfWDFJbdf')
        console.log(poses[poses.length - 1])

    }
}
function drawId(markers) {
    var corners, corner, x, y, i, j;

    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++i) {
        corners = markers[i].corners;

        x = Infinity;
        y = Infinity;

        for (j = 0; j !== corners.length; ++j) {
            corner = corners[j];

            x = Math.min(x, corner.x);
            y = Math.min(y, corner.y);
        }

        context.strokeText(markers[i].id, x, y)

        if (button_value) {
            if (poses.length != 0) {
                // user_Data[ip]=markers[i].id

                maker_id = markers[i].id.toString();
                user_Data[maker_id] = [user_ip, poses[poses.length - 1]];
                str = JSON.stringify(user_Data);
                alert(str)
                Enrollment(markers[i].id, poses[poses.length - 1]) //calling enrollment function using the marker caught
                // console.log(poses[poses.length-1])
                // console.log('Going to emit data using socket')
                // var dummy = {x:'sdfasdf',y:'sdfsadfasd'}
                var socket = io();
                socket.emit('dummy', user_Data);
                console.log('Trying to emit data using socket')
                //   socket.emit('updatePlayer', function(){
                //   console.log('testing');
                // })
                button_value = false  // button is set to false once alert window pop ups
            }
            else {
                // user_Data[ip]=markers[i].id
                Enrollment(markers[i].id, 0)
                console.log('Going to emit data using socket')
                var dummy = { x: 'sdfasdf', y: 'sdfsadfasd' }
                socket.emit('dummy', user_Data);
                console.log('Trying to emit data using socket')
                // socket.emit('updatePlayer', function(){
                // console.log('testing');
                // })           
                button_value = false
            }
        }

        if (button_value_2) {
            maker_id = markers[i].id.toString();
            console.log('Emitting maker id')
            var socket = io();
            socket.emit('dummy2', maker_id);
            console.log('Emitting maker id done')
            if (maker_id in user_Data) {
                alert('Key is present')
                alert('IP of user is::' + user_Data[maker_id].toString())
                button_value_2 = false;
            }
            else {
                alert('Key is not present')
                button_value_2 = false;
            }
        }

    }
}