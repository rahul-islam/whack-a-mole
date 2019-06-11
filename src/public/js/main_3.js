let capture;
var video, canvas, context, imageData, detector, canvas1, poseNet, poses = [];
var posit;
var modelSize = 35.0; //millimeters

var socket = io();
var canvas_width,canvas_height;
// var socket3 = io.connect('http://localhost:3000/getusermedia.html');
var enrollButton = false; //Enroll button. Pressed to enrol a marker. 
var checkButton = false; // Check button. On clicking, the main dataframe on the server is checked for registered aruco id
var sendPoseButton = false;  // On press. Pose of person starts getting emitted to server.
var fetchPoseButton = false; //On press. IP of device is sent to socket and pose is fetched
var socket1 = io();  // pose is emitted using this socket
var socket2 = io(); // ip transmitted
// var socket3 = io();
var user_Data = {}; //contains marker id and corresponding pose value
var user_pose_Dat = {}; //json used to emit ip,pose pair

var user_ip; // ip of user stored in variable using getIP function
var poses_received = {}; //pose recieved from server using fetchPoseButton and socket 2
var keypoints_fetched = {};
var human_pose_fetched = {};

var enrolled_marker;
// var socket;
// socket.emit('register aruco', 'A')
socket.on('dataframe', (data) => {
    // console.log(socket.arucoId);
    poses_received  = data
    console.log('enrolled_marker is:::')
    console.log(enrolled_marker)

});


const sendDataFrame = (poses,marker_id) => {
    socket.emit('dataframe', {
        human: [{
            pose: poses,
            id : marker_id
        }]
    });

}

function modelLoaded() {
    console.log('Model Loaded!');
}
function setup() {
  canvas=createCanvas(640, 480);
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
    var fetchedPose = [];
    poseNet.on('pose', function (results) {
        poses = results; //poses recieved  
        console.log(poses)
        
    });
    // Hide the video element, and just show the canvas
    

    detector = new AR.Detector();
    posit = new POS.Posit(modelSize, canvas.width);
}

function draw() 
{
  background(0);
  image(capture, 0, 0, 100, 100);
  drawKeypoints();
//   filter(INVERT);
}

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
                fill(0, 255, 255);
                noStroke();
                ellipse(((keypoint.position.x)/4)+25,(keypoint.position.y)/4,5,5);
                // ellipse((keypoint.position.x)*(canvas_width/displayWidth),(keypoint.position.y-100)*(canvas_height/displayHeight),5,5);
                // ellipse(keypoint.position.x-100/2, keypoint.position.y-100/2,5,5);
            }
        }
    }
}