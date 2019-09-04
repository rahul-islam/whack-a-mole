var video, canvas, context, imageData, detector, canvas1, poseNet, poseVideoInstance, poses = [];
var posit;
var modelSize = 35.0; //millimeters
var vidId = '';

var socket = io();
var canvas_width, canvas_height;
// var socket3 = io.connect('http://localhost:3000/getusermedia.html');
var enrollButton = false; //Enroll button. Pressed to enrol a marker. 
var checkButton = false; // Check button. On clicking, the main dataframe on the server is checked for registered aruco id
var sendPoseButton = false;  // On press. Pose of person starts getting emitted to server.
var fetchPoseButton = false; //On press. IP of device is sent to socket and pose is fetched

var user_Data = {}; //contains marker id and corresponding pose value
var user_pose_Dat = {}; //json used to emit ip,pose pair

var user_ip; // ip of user stored in variable using getIP function
var poses_received = {}; //pose recieved from server using fetchPoseButton and socket 2
var keypoints_fetched = {};
var human_pose_fetched = {};
var scale_x = 100;
var scale_y = 100;

// var norm_X = 0.0;
// var norm_Y = 0.0;
var enrolledMarker;



var videoWidth = 640;
var videoHeight = 480;

var canvasWidth, canvasHeight, Rx, Ry = 0;
var hostFeedCanvas;
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

    background(255)
    // canvas1 = createCanvas(canvas_width,canvas_height);
    canvas1 = createCanvas(canvasWidth, canvasHeight);
    canvas1.position(x, y); // canvas position
    canvas1.parent('myContainer');
    canvas = canvas1.canvas;
    context = canvas.getContext("2d");
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    // video = createVideo([vidId],vidLoadMainVideo);
    // video.size(canvasWidth, canvasHeight);

    // poseVideoInstance = createVideo([vidId],vidLoadPoseVideoInstance);
    // poseVideoInstance.size(videoWidth, videoHeight)

    video = createCapture(VIDEO);
    video.size(canvasWidth, canvasHeight);

    poseVideoInstance = createCapture(VIDEO);
    poseVideoInstance.size(videoWidth, videoHeight)

    $("#poseNetStatus").text('loading');
    poseNet = ml5.poseNet(poseVideoInstance, modelLoaded);
    var fetchedPose = [];
    poseNet.on('pose', function (results) {
        poses = results; //poses recieved  
    });
    // Hide the video element, and just show the canvas
    video.hide();
    poseVideoInstance.hide()
    detector = new AR.Detector();
    posit = new POS.Posit(modelSize, canvas.width);

    requestAnimationFrame(tick);

    // socket = socket.io.connect('http://localhost:3000')
}

