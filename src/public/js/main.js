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
// var scale_x = 100;
// var scale_y = 100;

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


var holes = [];
function initHoles(nos) {
    var xF = width / 6
    var yF = width / 8

    for (let j = 0; j < nos; j++) {
        holes.push({
            'x': xF + 2 * j * xF,
            'y': yF,
            'r': 50,
            'hasMole': false,
        })
    }
    for (let j = 0; j < nos - 1; j++) {
        holes.push({
            'x': 2 * xF + 2 * j * xF,
            'y': yF * 3,
            'r': 50,
            'hasMole': false,
        })
    }
}

setInterval(wakeMoles, 2000);

function wakeMoles() {
    if (!startGameFlag) return;
    holes[moleIndex].hasMole = false;
    moleIndex = Math.floor(Math.random() * 5);
    holes[moleIndex].hasMole = true;
    canHit = true;
    updateScore();
}


let usernameInput, registerButton, startButton;
function createRegistration() {
    usernameInput = createInput();
    usernameInput.position(20, 65);

    registerButton = createButton('submit');
    registerButton.position(usernameInput.x + usernameInput.width, 65);
    registerButton.mousePressed(registerUser);

    textAlign(CENTER);
    textSize(50);
}

function registerUser(username) {
    console.log(usernameInput.value())
    socket.emit('register user', usernameInput.value());
}

function startGame() {
    startGameFlag = true;
    startButton.hide();
    updateScore();
}

let scoreText;
function updateScore() {
    console.log(pad(hit, 3))
    if (scoreText) scoreText.hide();
    scoreText = createButton(pad(hit, 3));
    scoreText.position((windowWidth - canvasWidth) / 2, 0);
    scoreText.size(width, (windowHeight - canvasHeight) / 2)
    scoreText.style('font-family', 'Courier New');
    scoreText.style('font-size', (windowHeight - canvasHeight) / 4);
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let playerInViewPose, playerPose, playerId;
let poses = [];
var socket = io();

var videoWidth = 640;
var videoHeight = 480;

var canvasWidth, canvasHeight, Rx, Ry = 0;

let missed = 0;
let hit = 0;
let canHit = true;
var moleIndex = 0;
var hand, handx, handy, correct, gameFont;
var startGameFlag = false;


function preload() {
    hand = loadImage("./images/thanos.gif");
    correct = loadSound('./sounds/correct.mp3');
    gameFont = loadFont('./fonts/PixelMiners-KKal.otf');
}

function setup() {
    // aspect ratio 4:3
    // width x height
    // 640 x 480

    canvasWidth = screen.width > videoWidth ? videoWidth : screen.width;
    canvasHeight = canvasWidth * 0.75;

    var x = (windowWidth - canvasWidth) / 2;
    var y = (windowHeight - canvasHeight) / 2;

    // console.log(windowWidth, width)
    // https://stackoverflow.com/questions/45724955/find-new-coordinates-of-a-point-after-image-resize
    Rx = canvasWidth / videoWidth
    Ry = canvasHeight / videoHeight

    var cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.position(x, y);
    background(255, 0, 200);

    let constraints;
    if (navigator.deviceMemory == 8) {
        constraints = VIDEO
    } else {
        constraints = {
            video: {
                facingMode: {
                    exact: "environment"
                }
            },
            audio: false,
        }
    }
    console.log(constraints)
    video = createCapture(constraints);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function (results) {
        assignPlayerInViewPose(results)
        poses = results;
    });
    // Hide the video element, and just show the canvas
    video.hide();


    // Define Number of Holes to create
    initHoles(3);
    // createRegistration();
    socket.emit('register user', playerId);
    requestAnimationFrame(tick);
}

function modelReady() {
    select('#status').html('Model Loaded');
}

function tick() {
    requestAnimationFrame(tick);
    // image(video, 0, 0, width, height);
    clear();

    if (startGameFlag) {
        // console.log('lol')
        drawHole();
        evaluateHit();
    }
    // drawHole();
    // We can call both functions to draw all keypoints and the skeletons
    // drawKeypoints();
    // drawSkeleton();

    if (playerInViewPose) {
        sendDataFrame(playerInViewPose)
    }

    if (playerPose) {
        drawPlayerKeypoints()
        drawPlayerSkeleton()
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

// A function to draw ellipses over the detected keypoints
function drawPlayerKeypoints() {
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
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawPlayerSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < playerPose.length; i++) {
        let skeleton = playerPose[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}

// A function to draw the skeletons
// function drawSkeleton() {
//     // Loop through all the skeletons detected
//     for (let i = 0; i < poses.length; i++) {
//         let skeleton = poses[i].skeleton;
//         // For every skeleton, loop through all body connections
//         for (let j = 0; j < skeleton.length; j++) {
//             let partA = skeleton[j][0];
//             let partB = skeleton[j][1];
//             stroke(255, 0, 0);
//             line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
//         }
//     }
// }

function assignPlayerInViewPose(poses) {
    let confidence = 0;
    for (let index = 0; index < poses.length; index++) {
        const pose = poses[index];
        if (pose.pose.rightWrist.confidence > confidence) {
            confidence = pose.pose.rightWrist.confidence;
            playerInViewPose = pose;
        }
    }
    // console.log(playerInViewPose, confidence)
}

function drawHole() {
    for (let index = 0; index < holes.length; index++) {
        const hole = holes[index];
        if (hole.hasMole) {
            let c = color(65); // Update 'c' with grayscale value
            fill(c); // Use updated 'c' as fill color
            circle(hole.x, hole.y, hole.r);
        } else {
            let c = color(255, 204, 0);
            fill(c);
            circle(hole.x, hole.y, hole.r);
        }
    }
}

function isInside(circle_x, circle_y, rad, x, y) {
    if ((x - circle_x) * (x - circle_x) +
        (y - circle_y) * (y - circle_y) <= rad * rad)
        return true;
    else
        return false;
}

function evaluateHit() {
    if (playerPose && playerPose[0].pose.rightWrist.confidence > 0.4) {
        // var rNorm = normalize_coords(playerPose.pose.rightWrist.x, playerPose.pose.rightWrist.y)
        // handx = rNorm[0]*Rx*canvas.width
        // handy = rNorm[1]*Ry*canvas.height
        var isHit = isInside(holes[moleIndex].x, holes[moleIndex].y, holes[moleIndex].r, playerPose[0].pose.rightWrist.x, playerPose[0].pose.rightWrist.y);

        if (isHit && holes[moleIndex].hasMole && canHit) {
            hit = hit + 10;
            canHit = false;
            hitPlay()
            // wakeMoles()
            socket.emit('hit', {
                hit,
                missed,
            });
        }
    }
}

function hitPlay() {
    if (correct.isPlaying()) {
        // .isPlaying() returns a boolean
        correct.stop();
        //   background(255, 0, 0);
    } else {
        correct.play();
        //   background(0, 255, 0);
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
    // socket.emit('register user', playerId);
})

socket.on('user registered', (data) => {
    // usernameInput.hide();
    // registerButton.hide();

    startButton = createButton('Start');
    startButton.position((windowWidth - canvasWidth) / 2, 0);
    startButton.size(width, (windowHeight - canvasHeight) / 2)
    startButton.mousePressed(startGame);
})

socket.on('scoreboard', (data) => {
    console.log(data)
})
