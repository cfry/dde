import * as handTrack from 'handtrackjs';
globalThis.handTrack = handTrack

// from https://codepen.io/victordibia/pen/RdWbEY
var video
var canvas
var context
var trackButton
var updateNote

let isVideo = false;
let model = null;

const modelParams = {
    flipHorizontal: true,   // flip e.g for video
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.6,    // confidence threshold for predictions.
}

function make_show_window() {
    show_window({
        title: "Track Hand",
        x: 200, y: 0,
        content: `<div>
                    <button onclick="toggleVideo()" id="trackbutton"  type="button">
                      Toggle Video
                    </button> &nbsp;
                    <span id="updatenote"> loading model ..</span>
                  </div>
                  <!--  <video id="trackhand_webcam_id" style="position: absolute" autoplay playsinline></video>
                    <canvas class="trackhand_output_canvas_id" id="output_canvas"></canvas> -->
                    <video autoplay="autoplay" id="myvideo" style="width:450px; height:338px; display:none;"></video>
                    <canvas id="canvas" style="width:450px; height:338px;"></canvas>
                 `
    })
}

function init_track_hand(){
    make_show_window()
    // Load the model.
    setTimeout(function() {
    handTrack.load(modelParams).then(lmodel => {
        // detect objects in the image.
        model = lmodel
        updateNote = document.getElementById("updatenote");
        updateNote.innerText = "Loaded Model!"
        trackButton = document.getElementById("trackbutton");
        trackButton.disabled = false
    })}, 1000);
}
globalThis.init_track_hand = init_track_hand

function startVideo() {
    video = document.getElementById("myvideo");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            updateNote.innerText = "Video started. Now tracking"
            isVideo = true
            runDetection()
        } else {
            updateNote.innerText = "Please enable video"
        }
    });
}

function toggleVideo() {
    if (!isVideo) {
        updateNote.innerText = "Starting video"
        startVideo();
    } else {
        updateNote.innerText = "Stopping video"
        handTrack.stopVideo(video)
        isVideo = false;
        updateNote.innerText = "Video stopped"
    }
}
globalThis.toggleVideo = toggleVideo

function runDetection() {
    model.detect(video).then(predictions => {
        console.log("Predictions: ", predictions);
        model.renderPredictions(predictions, canvas, context, video);
        if (isVideo) {
            requestAnimationFrame(runDetection);
        }
    });
}