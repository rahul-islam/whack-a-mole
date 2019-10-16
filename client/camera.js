/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import dat from 'dat.gui';
import Stats from 'stats.js';
import io from 'socket.io-client';

import {AR} from './js/aruco';

import {drawBoundingBox, drawKeypoints, drawSkeleton, isMobile, toggleLoadingUI, tryResNetButtonName, tryResNetButtonText, updateTryResNetButtonDatGuiCss, drawCorners, drawId} from './demo_util';

// const socket = io('https://192.168.43.100:3000/');
const socket = io();

const videoCaptureWidth = 600;
const videoCaptureHeight = 500;

let videoPreviewWidth, videoPreviewHeight;

const stats = new Stats();

let playerId, playerInViewPose, playerPose, sentBy;


/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoCaptureWidth;
  video.height = videoCaptureHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: mobile ? 'environment': 'user',
      width: mobile ? undefined : videoCaptureWidth,
      height: mobile ? undefined : videoCaptureHeight,
    },
  });
  video.srcObject = stream;

  // setup video  preview size
  videoPreviewWidth = 300 // screen.width / 2;
  videoPreviewHeight = videoPreviewWidth * (videoCaptureHeight / videoCaptureWidth) // videoPreviewWidth * (videoCaptureHeight / videoCaptureWidth)

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = isMobile() ? 0.50 : 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 513;

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 32;
const defaultResNetInputResolution = 257;

const guiState = {
  algorithm: 'multi-pose',
  input: {
    architecture: 'MobileNetV1',
    outputStride: defaultMobileNetStride,
    inputResolution: defaultMobileNetInputResolution,
    multiplier: defaultMobileNetMultiplier,
    quantBytes: defaultQuantBytes
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 5,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    showBoundingBox: false,
    showAruco: true,
  },
  net: null,
};

/**
 * Sets up dat.gui controller on the top-right of the window
 */
function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  const gui = new dat.GUI({width: 0});

  let architectureController = null;
  guiState[tryResNetButtonName] = function() {
    architectureController.setValue('ResNet50')
  };
  gui.add(guiState, tryResNetButtonName).name(tryResNetButtonText);
  updateTryResNetButtonDatGuiCss();

  // The single-pose algorithm is faster and simpler but requires only one
  // person to be in the frame or results will be innaccurate. Multi-pose works
  // for more than 1 person
  const algorithmController =
      gui.add(guiState, 'algorithm', ['single-pose', 'multi-pose']);

  // The input parameters have the most effect on accuracy and speed of the
  // network
  let input = gui.addFolder('Input');
  // Architecture: there are a few PoseNet models varying in size and
  // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
  // fastest, but least accurate.
  architectureController =
      input.add(guiState.input, 'architecture', ['MobileNetV1', 'ResNet50']);
  guiState.architecture = guiState.input.architecture;
  // Input resolution:  Internally, this parameter affects the height and width
  // of the layers in the neural network. The higher the value of the input
  // resolution the better the accuracy but slower the speed.
  let inputResolutionController = null;
  function updateGuiInputResolution(
      inputResolution,
      inputResolutionArray,
  ) {
    if (inputResolutionController) {
      inputResolutionController.remove();
    }
    guiState.inputResolution = inputResolution;
    guiState.input.inputResolution = inputResolution;
    inputResolutionController =
        input.add(guiState.input, 'inputResolution', inputResolutionArray);
    inputResolutionController.onChange(function(inputResolution) {
      guiState.changeToInputResolution = inputResolution;
    });
  }

  // Output stride:  Internally, this parameter affects the height and width of
  // the layers in the neural network. The lower the value of the output stride
  // the higher the accuracy but slower the speed, the higher the value the
  // faster the speed but lower the accuracy.
  let outputStrideController = null;
  function updateGuiOutputStride(outputStride, outputStrideArray) {
    if (outputStrideController) {
      outputStrideController.remove();
    }
    guiState.outputStride = outputStride;
    guiState.input.outputStride = outputStride;
    outputStrideController =
        input.add(guiState.input, 'outputStride', outputStrideArray);
    outputStrideController.onChange(function(outputStride) {
      guiState.changeToOutputStride = outputStride;
    });
  }

  // Multiplier: this parameter affects the number of feature map channels in
  // the MobileNet. The higher the value, the higher the accuracy but slower the
  // speed, the lower the value the faster the speed but lower the accuracy.
  let multiplierController = null;
  function updateGuiMultiplier(multiplier, multiplierArray) {
    if (multiplierController) {
      multiplierController.remove();
    }
    guiState.multiplier = multiplier;
    guiState.input.multiplier = multiplier;
    multiplierController =
        input.add(guiState.input, 'multiplier', multiplierArray);
    multiplierController.onChange(function(multiplier) {
      guiState.changeToMultiplier = multiplier;
    });
  }

  // QuantBytes: this parameter affects weight quantization in the ResNet50
  // model. The available options are 1 byte, 2 bytes, and 4 bytes. The higher
  // the value, the larger the model size and thus the longer the loading time,
  // the lower the value, the shorter the loading time but lower the accuracy.
  let quantBytesController = null;
  function updateGuiQuantBytes(quantBytes, quantBytesArray) {
    if (quantBytesController) {
      quantBytesController.remove();
    }
    guiState.quantBytes = +quantBytes;
    guiState.input.quantBytes = +quantBytes;
    quantBytesController =
        input.add(guiState.input, 'quantBytes', quantBytesArray);
    quantBytesController.onChange(function(quantBytes) {
      guiState.changeToQuantBytes = +quantBytes;
    });
  }

  function updateGui() {
    if (guiState.input.architecture === 'MobileNetV1') {
      updateGuiInputResolution(
          defaultMobileNetInputResolution, [257, 353, 449, 513, 801]);
      updateGuiOutputStride(defaultMobileNetStride, [8, 16]);
      updateGuiMultiplier(defaultMobileNetMultiplier, [0.50, 0.75, 1.0])
    } else {  // guiState.input.architecture === "ResNet50"
      updateGuiInputResolution(
          defaultResNetInputResolution, [257, 353, 449, 513, 801]);
      updateGuiOutputStride(defaultResNetStride, [32, 16]);
      updateGuiMultiplier(defaultResNetMultiplier, [1.0]);
    }
    updateGuiQuantBytes(defaultQuantBytes, [1, 2, 4]);
  }

  updateGui();
  input.open();
  // Pose confidence: the overall confidence in the estimation of a person's
  // pose (i.e. a person detected in a frame)
  // Min part confidence: the confidence that a particular estimated keypoint
  // position is accurate (i.e. the elbow's position)
  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

  let multi = gui.addFolder('Multi Pose Detection');
  multi.add(guiState.multiPoseDetection, 'maxPoseDetections')
      .min(1)
      .max(20)
      .step(1);
  multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  // nms Radius: controls the minimum distance between poses that are returned
  // defaults to 20, which is probably fine for most use cases
  multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
  multi.open();

  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.add(guiState.output, 'showBoundingBox');
  output.add(guiState.output, 'showAruco')
  // output.open();


  architectureController.onChange(function(architecture) {
    // if architecture is ResNet50, then show ResNet50 options
    updateGui();
    guiState.changeToArchitecture = architecture;
  });

  algorithmController.onChange(function(value) {
    switch (guiState.algorithm) {
      case 'single-pose':
        multi.close();
        single.open();
        break;
      case 'multi-pose':
        single.close();
        multi.open();
        break;
    }
  });
}

/**
 * Sets up a frames per second panel on the top-left of the window
 */
function setupFPS() {
  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('main').appendChild(stats.dom);
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, net, arucoDetector) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  // In memory canvas to store frame foraruco detection
  const inMemoryCanvas = document.createElement('canvas');
  const inMemoryCanvasCxt = inMemoryCanvas.getContext('2d');

  inMemoryCanvas.width = videoCaptureWidth; // videoCaptureWidth;
  inMemoryCanvas.height = videoCaptureHeight; // videoCaptureHeight;
  
  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true;

  canvas.width = videoPreviewWidth * 2; // videoCaptureWidth;
  canvas.height = videoPreviewHeight; // videoCaptureHeight;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.changeToArchitecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
      });
      toggleLoadingUI(false);
      guiState.architecture = guiState.changeToArchitecture;
      guiState.changeToArchitecture = null;
    }

    if (guiState.changeToMultiplier) {
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: +guiState.changeToMultiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.multiplier = +guiState.changeToMultiplier;
      guiState.changeToMultiplier = null;
    }

    if (guiState.changeToOutputStride) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: +guiState.changeToOutputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.outputStride = +guiState.changeToOutputStride;
      guiState.changeToOutputStride = null;
    }

    if (guiState.changeToInputResolution) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: +guiState.changeToInputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.inputResolution = +guiState.changeToInputResolution;
      guiState.changeToInputResolution = null;
    }

    if (guiState.changeToQuantBytes) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.changeToQuantBytes
      });
      toggleLoadingUI(false);
      guiState.quantBytes = guiState.changeToQuantBytes;
      guiState.changeToQuantBytes = null;
    }

    // Begin monitoring code for frames per second
    stats.begin();

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case 'single-pose':
        const pose = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'single-person'
        });
        poses = poses.concat(pose);
        minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
        break;
      case 'multi-pose':
        let all_poses = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'multi-person',
          maxDetections: guiState.multiPoseDetection.maxPoseDetections,
          scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
          nmsRadius: guiState.multiPoseDetection.nmsRadius
        });

        poses = poses.concat(all_poses);
        minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;
        break;
    }

    inMemoryCanvasCxt.drawImage(video, 0, 0);
    let imageData = inMemoryCanvasCxt.getImageData(0, 0, videoCaptureWidth, videoCaptureHeight);
    let markers = arucoDetector.detect(imageData);
    // console.log(markers)
    if(markers){
      poses = couplePoseMarker(poses, markers, minPoseConfidence);
      markers = fixMarkers(markers, (videoPreviewWidth/videoCaptureWidth), (videoPreviewHeight/videoCaptureHeight))
    }
    // ctx.clearRect(0, 0, 300, 300);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ctx.fillRect(20, 20, 150, 100);
    // console.log(playerId)
    // text
    if(playerId){
      ctx.font = "20px";
      ctx.fillStyle = "white";
      ctx.fillText('Device Id :> ' + playerId, videoPreviewWidth + 2, 12);
      ctx.fillText('Pose Shared By :> ' + String(sentBy), videoPreviewWidth + 2, 24);  
    }

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoPreviewWidth, 0);
      ctx.drawImage(video, 0, 0, videoPreviewWidth, videoPreviewHeight);
      ctx.restore();
    }

    
    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    poses.forEach(({score, keypoints, markerId, sentBy}) => {
      if (score >= minPoseConfidence) {
        if(markers.length > 0) {
          var df = JSON.parse(JSON.stringify({
            score, 
            keypoints,
            'playerId': markerId,
            'sentBy': sentBy
          }));
          // console.log(df)
          sendDataFrame(df);
        }

        keypoints = fixKeypoints(keypoints, (videoPreviewWidth/videoCaptureWidth), (videoPreviewHeight/videoCaptureHeight))
        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
        }
        if (guiState.output.showAruco) {
          drawCorners(markers, ctx);
          drawId(markers, ctx)
        }
      }
    });

    if (playerPose) {
      // console.log('print player pose')
      var playerKp = fixKeypoints(playerPose, (videoPreviewWidth/videoCaptureWidth), (videoPreviewHeight/videoCaptureHeight), (canvas.width - videoPreviewWidth), 0)
      if (guiState.output.showPoints) {
        drawKeypoints(playerKp, minPartConfidence, ctx);
      }
      if (guiState.output.showSkeleton) {
        drawSkeleton(playerKp, minPartConfidence, ctx);
      }
      if (guiState.output.showBoundingBox) {
        drawBoundingBox(playerKp, ctx);
      }
    }
    // End monitoring code for frames per second
    stats.end();

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

function couplePoseMarker(poses, markers, minPoseConfidence){
  // console.log(poses)
  poses.forEach((pose) => {
    if (pose.score >= minPoseConfidence) {
      var markerId, markerDistance = 9999;
      for (let i = 0; i < markers.length; i++) {
        const corners = markers[i].corners;
        const cornerDistance = getDistance(corners[0].x, corners[0].y, pose.keypoints[0].position.x, pose.keypoints[0].position.y)
        if(markerDistance > cornerDistance){
          markerDistance = cornerDistance;
          markerId = markers[i].id
        }
      }
      pose['markerId'] = markerId;
      pose['sentBy'] = playerId;
    }
  });
  return poses;
}

function fixMarkers(markers, Rx, Ry, padWidth=0, padHeight=0) {
  for (let i = 0; i < markers.length; i++) {
    const corners = markers[i].corners;
    for (let j = 0; j !== corners.length; ++ j){
      corners[j].x = videoPreviewWidth - (corners[j].x * Rx + padWidth);
      corners[j].y = (corners[j].y) * Ry + padHeight;
    }
    markers[i].corners = corners;
  }
  return markers;
}

function fixKeypoints(keypoints, Rx, Ry, padWidth=0, padHeight=0) {
  for (let index = 0; index < keypoints.length; index++) {
    const keypoint = keypoints[index];
    keypoints[index].position.x = keypoint.position.x * Rx + padWidth
    keypoints[index].position.y = keypoint.position.y * Ry + padHeight
  }
  return keypoints;
}
/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
export async function bindPage() {
  toggleLoadingUI(true);
  const net = await posenet.load({
    architecture: guiState.input.architecture,
    outputStride: guiState.input.outputStride,
    inputResolution: guiState.input.inputResolution,
    multiplier: guiState.input.multiplier,
    quantBytes: guiState.input.quantBytes
  });
  toggleLoadingUI(false);

  let video;
  let arucoDetector;

  try {
    video = await loadVideo();
    arucoDetector = new AR.Detector();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  setupGui([], net);
  // setupFPS();
  detectPoseInRealTime(video, net, arucoDetector);
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
bindPage();

// aruco
function getDistance(x1, y1, x2, y2) {
  var x = x2 - x1
  var y = y2 - y1
  var mag = Math.sqrt(x * x + y * y)
  return mag
}


// socket
const sendDataFrame = (playerInViewPose) => {
  // console.log(playerInViewPose)
  socket.emit('dataframe', {
      keypoints: playerInViewPose.keypoints,
      score: playerInViewPose.score,
      playerId: playerInViewPose.playerId,
      sentBy: playerInViewPose.sentBy
  });
}

socket.on('connect', function () {
  console.log('Sockets are connected')
});

socket.on('dataframe', (data) => {
  console.log('Pose Recived', data)
  if(data[playerId]){
    playerPose = data[playerId].keypoints;
    sentBy = data[playerId].sentBy;
  }
});


socket.on('playerId', (data) => {
  if(typeof data == 'object') {
    console.log(data.error) 
    alert(data.error)
    return;
  }
  console.log('playerId =>', data)
  playerId = data;
})

// misc
export function registerPlayerId() {
  var playerId = document.getElementById('playerId').value;
  socket.emit('register playerId', playerId);
}