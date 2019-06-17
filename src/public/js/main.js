var video, canvas, context, imageData, detector, canvas1, poseNet, poseVideoInstance, poses = [];
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

var enrolledMarker;
// var socket;
// socket.emit('register aruco', 'A')
socket.on('dataframe', (data) => {
    // console.log(socket.arucoId);
    poses_received  = data
    console.log('enrolledMarker is:::')
    // console.log(enrolledMarker)

});

const sendDataFrame = (poses,marker_id) => {
    socket.emit('dataframe', {
        human: [{
            pose: poses,
            id : marker_id
        }]
    });

}

var videoWidth = 640;
var videoHeight = 480;

var canvasWidth, canvasHeight, Rx, Ry = 0;
var hostFeedCanvas;
function setup() {
    // aspect ratio 4:3
    // width x height
    // 640 x 480

    canvasWidth = screen.width;
    canvasHeight = screen.width * 0.75;

    // https://stackoverflow.com/questions/45724955/find-new-coordinates-of-a-point-after-image-resize
    Rx = canvasWidth/videoWidth
    Ry = canvasHeight/videoHeight

    background(255)
    // canvas1 = createCanvas(canvas_width,canvas_height);
    canvas1 = createCanvas(canvasWidth, canvasHeight);
    var cent_x = (displayWidth - width) / 2;
    var cent_y = (displayHeight - height) / 2;

    canvas1.parent('myContainer');
    canvas = canvas1.canvas;
    context = canvas.getContext("2d");
    canvas.width = canvasWidth
    canvas.height = canvasHeight

  
    video = createCapture(VIDEO);
    video.size(canvasWidth, canvasHeight);

    poseVideoInstance = createCapture(VIDEO);
    poseVideoInstance.size(videoWidth,videoHeight)

    $("#poseNetStatus").text('loading');
    poseNet = ml5.poseNet(poseVideoInstance, modelLoaded);
    var fetchedPose = [];
    poseNet.on('pose', function (results) {
        poses = results; //poses recieved  
        // console.log(poses)
    });
    // Hide the video element, and just show the canvas
    video.hide(); 
    poseVideoInstance.hide()
    detector = new AR.Detector();
    posit = new POS.Posit(modelSize, canvas.width);

    requestAnimationFrame(tick);

    // socket = socket.io.connect('http://localhost:3000')
}



function return_max_score_pose(pose_obj)
{
    var keys = Object.keys(pose_obj)  //All keys in pose_fetched obj
    // console.log('keys are as follows:')
    console.log(keys)
    console.log(pose_obj)
    var max_key;
    var max_score = 0;
    var max_index=0;
    for (let i=0 ; i<keys.length ; i++)
    {
        for(let j=0; j<pose_obj[keys[i]]['human'].length;j++)
        {
            id = pose_obj[keys[i]]['human'][j]['id']
          
            if(id==enrolledMarker)
            {
                console.log('Id is:::')
                console.log(id)
                console.log('human pose is')
                console.log(pose_obj[keys[i]]['human'][j]['pose'][0]['pose'])
                // if(poses[keys[i]]['human'][j]['pose'].length > 0)
                // {
                // score = pose_obj[keys[i]]['human'][j]['pose'][0].score
                score = pose_obj[keys[i]]['human'][0]['pose'][0]['pose'].score
                console.log('score is:::')
                console.log(score)
                if(parseFloat(score) > max_score)
                {
                    max_key=keys[i]
                    max_score = score
                    max_index =j
                    // console.log('new score is::')
                    // console.log(max_score)
                    
                }
            // }
    
            }
            
            
        }
   
    }
    console.log('max key is')
    console.log(max_key)
    console.log('max sore is::')
    console.log(max_score)
    max_pose = pose_obj[max_key]['human'][max_index]['pose'][0]
    console.log('max pose is::')
    console.log(max_pose['pose']['keypoints'].length)
    return max_pose

}


function modelLoaded() {
    console.log('Model Loaded!');
    $("#poseNetStatus").text('loaded');
    $("#poseNetStatus").toggleClass('badge-secondary badge-primary');
}

function tick() {
    requestAnimationFrame(tick);

    if(!!enrolledMarker){
        image(video, 0, 0, videoWidth, videoHeight);
        imageData = context.getImageData(0, 0, videoWidth, videoHeight);    
        clear();
        image(video, 0, 0, videoWidth/6, videoHeight/6);
    } else {
        image(video, 0, 0, canvas.width, canvas.height);
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);    
    }
    
    var markers = detector.detect(imageData); //markers detected at this step

    if(enrollButton){
        if(markers.length == 1){
            marker_id = markers[markers.length-1].id.toString();
            socket.emit('register aruco',marker_id)
            enrolledMarker = marker_id.toString()
            enrollButton = false
            toggleControl();
            $("#registeredAruco").text(enrolledMarker);
            console.info('Marker Registered:\t', enrolledMarker);
        } else{
            console.info('multiple marker in same frame')
        }
    }

    if(!enrolledMarker){
        drawCorners(markers); //marker corners drawn
        drawId(markers); //marker id written
        drawKeypoints(); //pose keypoints drawn
        drawSkeleton(); //pose skeleton drawn    
         //fetched skeleton is drawn
    }

    if (Object.keys(keypoints_fetched).length != 0 && keypoints_fetched.constructor === Object != 0) {
        drawKeypoints_fetched();  //check if poses_recieved.length is not 0 on pressing fetch_button and draw them
        drawSkeleton_fetched();
    }

    if (sendPoseButton) {
        sendDataFrame(poses,marker_id)
    }
    if (fetchPoseButton) {
        keypoints_fetched=return_max_score_pose(poses_received)
    }

    function newFunction() {
        console.log(poses);
    }
}



// function snapshot() {
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);
//     imageData = context.getImageData(0, 0, canvas.width, canvas.height);
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
            if (keypoint.score > 0.4) {
                fill(0, 255, 255);
                noStroke();
                // ellipse(((keypoint.position.x)/4)+25,(keypoint.position.y)/4,5,5);
                ellipse(((keypoint.position.x * Rx)),(keypoint.position.y * Ry),10,10);
                // ellipse((keypoint.position.x)*(canvas_width/displayWidth),(keypoint.position.y-100)*(canvas_height/displayHeight),5,5);
                // ellipse(keypoint.position.x-100/2, keypoint.position.y-100/2,5,5);
            }
        }
    }
}


function drawKeypoints_fetched() {
    // Loop through all the poses detected
    // for (let i = 0; i < poses_received.length; i++) {
    // For each pose detected, loop through all the keypoints
    // let pose = poses_received[0].pose;
    console.log(keypoints_fetched['pose']['keypoints'])
    for (let j = 0; j < keypoints_fetched['pose']['keypoints'].length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = keypoints_fetched['pose']['keypoints'][j];
        console.log('keypoint is')
        console.log(keypoint)
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
            fill(0, 255, 0);
            noStroke();
            // ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            ellipse(((keypoint.position.x * Rx)),(keypoint.position.y * Ry),5,5);
        }
    }
    // }
}

var pointSize = 3;



// function draw()
// {
//     // background(0)
//     image(video, 0, 0,canvas_width/4,canvas_height/4);
    
//     // drawCorners(markers); //marker corners drawn
//     // drawId(markers); //marker id written
//     // drawKeypoints(); //pose keypoints drawn
//     // drawSkeleton(); //pose skeleton drawn
// }

// function windowResized() {
//     resizeCanvas(640,480);
//  }

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke('#14dfe2');
            strokeWeight(3);
            // line((partA.position.x/4)+25, (partA.position.y)/4,((partB.position.x)/4)+25, (partB.position.y)/4);
            line((partA.position.x * Rx), (partA.position.y * Ry),((partB.position.x * Rx)), (partB.position.y * Ry));
        }
    }
}

function drawSkeleton_fetched() {
    // Loop through all the skeletons detected
    // for (let i = 0; i < poses.length; i++) {
        // let skeleton = poses[i].skeleton;
        let skeleton = keypoints_fetched.skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke('#14dfe2');
            strokeWeight(3);
            // line((partA.position.x/4)+25, (partA.position.y)/4,((partB.position.x)/4)+25, (partB.position.y)/4);
            line((partA.position.x * Rx), (partA.position.y * Ry),((partB.position.x * Rx)), (partB.position.y * Ry));
        }
    // }
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
    if (!enrollButton) {
        enrollButton = true
    }
}

function check()  //function used to change value of check button
{
    if (!checkButton) {
        checkButton = true
    }
}

function sendPose() {
    // if(sendPoseButton==false)
    // {
    sendPoseButton = !sendPoseButton
    // }
}

function fetchPose() {
    // if(sendPoseButton==false)
    // {
    fetchPoseButton = !fetchPoseButton
    // }
}
function logPose() {
    if (sendPoseButton) {
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

        //ENROLLMENT SECTION WHICH HAS BEEN MOVED TO TICK FUNCTION

        // if (enrollButton) {
        //     if (poses.length != 0) {
        //         // user_Data[ip]=markers[i].id

        //         maker_id = markers[i].id.toString();
        //         user_Data[maker_id] = [user_ip, poses[poses.length - 1]];
        //         str = JSON.stringify(user_Data);
        //         alert(str)
        //         Enrollment(markers[i].id, poses[poses.length - 1]) //calling enrollment function using the marker caught
        //         // console.log(poses[poses.length-1])
        //         // console.log('Going to emit data using socket')
        //         // var dummy = {x:'sdfasdf',y:'sdfsadfasd'}
        //         var socket = io();
        //         socket.emit('dummy', user_Data);
        //         console.log('Trying to emit data using socket')
        //         //   socket.emit('updatePlayer', function(){
        //         //   console.log('testing');
        //         // })
        //         enrollButton = false  // button is set to false once alert window pop ups
        //     }
        //     else {
        //         // user_Data[ip]=markers[i].id
        //         Enrollment(markers[i].id, 0)
        //         console.log('Going to emit data using socket')
        //         var dummy = { x: 'sdfasdf', y: 'sdfsadfasd' }
        //         socket.emit('dummy', user_Data);
        //         console.log('Trying to emit data using socket')
        //         // socket.emit('updatePlayer', function(){
        //         // console.log('testing');
        //         // })           
        //         enrollButton = false
        //     }
        // }

        if (checkButton) {
            maker_id = markers[i].id.toString();
            console.log('Emitting maker id')
            var socket = io();
            socket.emit('dummy2', maker_id);
            console.log('Emitting maker id done')
            if (maker_id in user_Data) {
                alert('Key is present')
                alert('IP of user is::' + user_Data[maker_id].toString())
                checkButton = false;
            }
            else {
                alert('Key is not present')
                checkButton = false;
            }
        }

    }
}

/**
 * 
 */

function toggleControl() {
    $("#checkButton").toggle();
    $("#sendPoseButton").toggle();
    $("#fetchPoseButton").toggle();
    $("#restartButton").toggle();
    $("#enrollButton").toggle();
}

function restart() {
    toggleControl() 
    location.reload(true);
}