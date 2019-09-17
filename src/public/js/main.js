// var video, canvas, context, imageData, detector, canvas1, poseNet, poseVideoInstance, poses = [];
// var posit;
// var modelSize = 35.0; //millimeters
// var vidId = '';

// var socket = io();
// var canvas_width, canvas_height;
// // var socket3 = io.connect('http://localhost:3000/getusermedia.html');
// var enrollButton = false; //Enroll button. Pressed to enrol a marker. 
// var checkButton = false; // Check button. On clicking, the main dataframe on the server is checked for registered aruco id
// var sendPoseButton = false;  // On press. Pose of person starts getting emitted to server.
// var fetchPoseButton = false; //On press. IP of device is sent to socket and pose is fetched

// var user_Data = {}; //contains marker id and corresponding pose value
// var user_pose_Dat = {}; //json used to emit ip,pose pair

// var user_ip; // ip of user stored in variable using getIP function
// var poses_received = {}; //pose recieved from server using fetchPoseButton and socket 2
// var keypoints_fetched = {};
// var human_pose_fetched = {};
var scale_x = 250;
var scale_y = 250;

// // var norm_X = 0.0;
// // var norm_Y = 0.0;
// var enrolledMarker;



// var videoWidth = 640;
// var videoHeight = 480;

// var canvasWidth, canvasHeight, Rx, Ry = 0;
// var hostFeedCanvas;
// function setup() {
//     // aspect ratio 4:3
//     // width x height
//     // 640 x 480

//     canvasWidth = screen.width > videoWidth ? videoWidth : screen.width;
//     canvasHeight = canvasWidth * 0.75;

//     var x = (windowWidth - canvasWidth) / 2;
//     var y = (windowHeight - canvasHeight) / 2;

//     // console.log(windowWidth, width)
//     // https://stackoverflow.com/questions/45724955/find-new-coordinates-of-a-point-after-image-resize
//     Rx = canvasWidth / videoWidth
//     Ry = canvasHeight / videoHeight

//     background(255)
//     // canvas1 = createCanvas(canvas_width,canvas_height);
//     canvas1 = createCanvas(canvasWidth, canvasHeight);
//     canvas1.position(x, y); // canvas position
//     canvas1.parent('myContainer');
//     canvas = canvas1.canvas;
//     context = canvas.getContext("2d");
//     canvas.width = canvasWidth
//     canvas.height = canvasHeight
//     // video = createVideo([vidId],vidLoadMainVideo);
//     // video.size(canvasWidth, canvasHeight);

//     // poseVideoInstance = createVideo([vidId],vidLoadPoseVideoInstance);
//     // poseVideoInstance.size(videoWidth, videoHeight)

//     video = createCapture({
//         audio: false,
//         video: {
//           facingMode: {
//             exact: "environment"
//           }
//         }
//       });
//     video.size(canvasWidth, canvasHeight);

//     poseVideoInstance = createCapture({
//         audio: false,
//         video: {
//           facingMode: {
//             exact: "environment"
//           }
//         }
//       });
//     poseVideoInstance.size(videoWidth, videoHeight)

//     $("#poseNetStatus").text('loading');
//     poseNet = ml5.poseNet(poseVideoInstance, modelLoaded);
//     var fetchedPose = [];
//     poseNet.on('pose', function (results) {
//         poses = results; //poses recieved
//         assignplayerInViewPose(poses);  
//     });
//     // Hide the video element, and just show the canvas
//     video.hide();
//     poseVideoInstance.hide()
//     detector = new AR.Detector();
//     // posit = new POS.Posit(modelSize, canvas.width);

//     // Define Number of Holes to create
//     initHoles(3);
//     createRegistration();
//     requestAnimationFrame(tick);

//     // socket = socket.io.connect('http://localhost:3000')
// }


// var holes = [];
// function initHoles(nos) {
//     var xF = canvas.width/6
//     var yF = canvas.width/8

//     for (let j = 0; j < nos; j++) {
//         holes.push({
//             'x': xF + 2 * j * xF,
//             'y': yF,
//             'r': 50,
//             'hasMole': false,
//         })
//     }
//     for (let j = 0; j < nos - 1; j++) {
//         holes.push({
//             'x': 2*xF + 2 * j * xF,
//             'y': yF * 3,
//             'r': 50,
//             'hasMole': false,
//         })
//     }
// }

// setInterval(wakeMoles, 2000);

// function wakeMoles(){
//     if(!startGameFlag) return;
//     holes[moleIndex].hasMole = false;
//     moleIndex = Math.floor(Math.random() * 5);
//     holes[moleIndex].hasMole = true;
//     canHit = true;
//     updateScore();
// }


// let usernameInput, registerButton, startButton;
// function createRegistration() {
//     usernameInput = createInput();
//     usernameInput.position(20, 65);

//     registerButton = createButton('submit');
//     registerButton.position(usernameInput.x + usernameInput.width, 65);
//     registerButton.mousePressed(registerUser);

//     textAlign(CENTER);
//     textSize(50);
// }

// function registerUser(username) {
//     console.log(usernameInput.value())
//     socket.emit('register user', usernameInput.value());
// }

// function startGame() {
//     startGameFlag = true;
//     startButton.hide();
//     updateScore();
// }

// let scoreText;
// function updateScore(){
//     console.log(pad(hit,3))
//     if(scoreText) scoreText.hide();
//     scoreText = createButton(pad(hit,3));
//     scoreText.position((windowWidth - canvasWidth) / 2, 0);
//     scoreText.size(canvas.width, (windowHeight - canvasHeight) / 2)
//     scoreText.style('font-family', 'Courier New');
//     scoreText.style('font-size', (windowHeight - canvasHeight)/4);
// }

// function pad(num, size) {
//     var s = num+"";
//     while (s.length < size) s = "0" + s;
//     return s;
// }

// socket.on('user registered', (data) => {
//     usernameInput.hide();
//     registerButton.hide();

//     startButton = createButton('Start');
//     startButton.position((windowWidth - canvasWidth) / 2, 0);
//     startButton.size(canvas.width, (windowHeight - canvasHeight) / 2)
//     startButton.mousePressed(startGame);
// })

// socket.on('scoreboard', (data) => {
//     console.log(data)
// })

// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let modelLoaded = false;
let video;
let poseNet;
let playerInViewPose, playerPose, playerId;
let poses = [];
var socket = io();

var videoWidth = 640;
var videoHeight = 480;

var captureWidth = 600;
var captureHeight = 500;

var canvasWidth, canvasHeight, Rx, Ry = 0;

const posnetModelInit = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: false,
    minConfidence: 0.15,
    maxPoseDetections: 5,
    scoreThreshold: 0.5,
    nmsRadius: 30,
    detectionType: 'multiple', // detectionType - Optional. A String value to run 'single' or 'multiple' estimation.
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2
};

// detectionType - Optional. A String value to run 'single' or 'multiple' estimation.
const detectionType = 'multiple'

function preload() {

}

// norm_coords_fetched = normalize_coords(keypoint.position.x,keypoint.position.y);
// x_norm_fetched = norm_coords_fetched[0];
// y_norm_feteched = norm_coords_fetched[1];
// ellipse((x_norm_fetched * Rx*scale_x)+100, (y_norm_feteched* Ry*scale_y)+100, 10, 10);

function normalizeCoordinates(x, y, captureWidth, captureHeight) {
    x /= width;
    y /= height;
    // console.log('norm_X is::',norm_X)
    return [x * (canvasWidth / captureWidth) * scale_x, y * (canvasHeight / captureHeight) * scale_y];

}

function setup() {
    // aspect ratio 4:3
    // width x height
    // 640 x 480
    canvasWidth = screen.width // 2 // > videoWidth ? videoWidth: screen.width;
    canvasHeight = screen.height // 2 // canvasWidth * 0.75;

    videoWidth = canvasWidth / 2;
    videoHeight = videoHeight * 0.75

    var x = (windowWidth - canvasWidth) / 2;
    var y = (windowHeight - canvasHeight) / 2;

    // console.log(windowWidth, width)

    var cnv = createCanvas(canvasWidth, screen.height);
    cnv.position(0, 0)

    if (navigator.deviceMemory == 8) {
        constraints = {
            video: {
                facingMode: 'user',
                width: 600,
                height: 500,
            },
            audio: false,
        }
    } else {
        constraints = {
            video: {
                facingMode: 'environment',
                width: 600,
                height: 500,
            },
            audio: false,
        }
    }
    console.log(constraints)
    video = createCapture(constraints);
    video.position(0, 0)

    console.log('Live Stream(width:height)', video.width, video.height)
    // https://stackoverflow.com/questions/45724955/find-new-coordinates-of-a-point-after-image-resize
    Rx = videoWidth / 600
    Ry = videoHeight / 500

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, posnetModelInit, detectionType, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function (results) {
        assignPlayerInViewPose(results)
        poses = results;
    });
    // Hide the video element, and just show the canvas
    video.hide();

    requestAnimationFrame(tick);
}

function modelReady() {
    modelLoaded = true;
    select('#status').html('Model Loaded');
    select('#deviceId').html('Device Id :> ' + playerId);
    select('#poseSharedBy').html('Pose Shared By :> ' + String(playerId ^ 1));
}

function tick() {
    requestAnimationFrame(tick);
    // fullscreen(true);
    background(200)
    image(video, 0, canvasHeight - videoHeight, videoWidth, videoHeight);
    // clear();

    // We can call both functions to draw all keypoints and the skeletons
    // drawKeypoints();
    // drawSkeleton();

    if (playerInViewPose) {
        sendDataFrame(playerInViewPose)
        // We can call both functions to draw all keypoints and the skeletons
        drawKeypoints(0, canvasHeight - videoHeight);
        drawSkeleton(0, canvasHeight - videoHeight);
    }

    if (playerPose) {
        drawPlayerKeypointsNormalized(canvasWidth / 2, canvasHeight - videoHeight)
        drawPlayerSkeletonNormalized(canvasWidth / 2, canvasHeight - videoHeight)
    }

    drawMeta()
}

function drawMeta() {
    if (modelLoaded) text('Model Loaded', 0, 10); else text('Model Loading', 0, 10);
    if (playerPose) {
        text('Device Id :> ' + String(playerId), 0, 22);
        text('Pose Shared By :> ' + String(playerId ^ 1), 0, 34);
    }

}

// function draw() {
//     // image(video, 0, 0, width, height);
//     clear();
//     // We can call both functions to draw all keypoints and the skeletons
//     // drawKeypoints();
//     drawSkeleton();

//     if(playerInViewPose){
//         sendDataFrame(playerInViewPose)
//     }

//     if(playerPose){
//         drawPlayerKeypoints()
//     }
// }

// A function to draw ellipses over the detected keypoints
function drawKeypoints(padWidth, padHeight) {
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
                ellipse(keypoint.position.x * Rx + padWidth, keypoint.position.y * Ry + padHeight, 5, 5);
            }
        }
    }
}

// A function to draw ellipses over the detected keypoints
function drawPlayerKeypoints(padWidth, padHeight) {
    // Loop through all the poses detected
    for (let i = 0; i < playerPose.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = playerPose[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x + padWidth, keypoint.position.y + padHeight, 10, 10);
            }
        }
    }
}

// A function to draw ellipses over the detected keypoints
function drawPlayerKeypointsNormalized(padWidth, padHeight) {
    // Loop through all the poses detected
    for (let i = 0; i < playerPose.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = playerPose[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                var pos = normalizeCoordinates(keypoint.position.x, keypoint.position.y, playerPose[i].captureWidth, playerPose[i].captureHeight)
                ellipse(pos[0] + padWidth, pos[1] + padHeight, 5, 5);
            }
        }
    }
}

// A function to draw the skeletons
function drawPlayerSkeleton(padWidth, padHeight) {
    // Loop through all the skeletons detected
    for (let i = 0; i < playerPose.length; i++) {
        let skeleton = playerPose[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x + padWidth, partA.position.y + padHeight, partB.position.x + padWidth, partB.position.y + padHeight);
        }
    }
}

function drawPlayerSkeletonNormalized(padWidth, padHeight) {
    // Loop through all the skeletons detected
    for (let i = 0; i < playerPose.length; i++) {
        let skeleton = playerPose[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            var posA = normalizeCoordinates(partA.position.x, partA.position.y, playerPose[i].captureWidth, playerPose[i].captureHeight)
            var posB = normalizeCoordinates(partB.position.x, partB.position.y, playerPose[i].captureWidth, playerPose[i].captureHeight)
            line(posA[0] + padWidth, posA[1] + padHeight, posB[0] + padWidth, posB[1] + padHeight);
        }
    }
}


// A function to draw the skeletons
function drawSkeleton(padWidth, padHeight) {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x * Rx + padWidth, partA.position.y * Ry + padHeight, partB.position.x * Rx + padWidth, partB.position.y * Ry + padHeight);
        }
    }
}

function assignPlayerInViewPose(poses) {
    let confidence = 0;
    for (let index = 0; index < poses.length; index++) {
        const pose = poses[index];
        if (pose.pose.score > confidence) {
            confidence = pose.pose.score;
            playerInViewPose = pose;
        }
    }
    // console.log(playerInViewPose, confidence)
    if (playerInViewPose) {
        playerInViewPose.canvasWidth = canvasWidth;
        playerInViewPose.canvasHeight = canvasHeight;
        playerInViewPose.padWidth = canvasWidth / 2;
        playerInViewPose.padHeight = canvasHeight - 500;
        playerInViewPose.captureWidth = 600;
        playerInViewPose.captureHeight = 500;
    }

}

const sendDataFrame = (playerInViewPose) => {
    // console.log(playerInViewPose)
    socket.emit('dataframe', {
        pose: playerInViewPose
    });
}

socket.on('dataframe', (data) => {
    console.log('Pose Recived', data[playerId])
    playerPose = [data[playerId].pose];
});


socket.on('playerId', (data) => {
    console.log('playerId =>', data)
    playerId = data;
})