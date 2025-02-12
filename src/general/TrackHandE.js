import * as handTrack from 'handtrackjs';
globalThis.handTrack = handTrack

// from https://codepen.io/victordibia/pen/RdWbEY
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
        x: 200, y: 0, width:450, height:390,
        content: `<div>
                    <button onclick="toggleVideo()" id="trackhand_trackbutton_id"  type="button">
                      Toggle Video
                    </button> &nbsp;
                    <span id="trackhand_updatenote_id"> loading model ..</span>
                  </div>
                  <video autoplay="autoplay" id="trackhand_video_id" style="width:450px; height:338px; display:none;"></video>
                  <canvas id="trackhand_canvas_id" style="width:450px; height:338px;"></canvas>`
    })
}

function init_track_hand(){
    make_show_window()
    // Load the model.
    setTimeout(function() {
        handTrack.load(modelParams).then(lmodel => {
            // detect objects in the image.
            model = lmodel
            trackhand_updatenote_id.innerText = "Loaded Model!"
            //trackhand_trackbutton_id.disabled = false
        })}, 1000);
}
globalThis.init_track_hand = init_track_hand

function startVideo() {
    handTrack.startVideo(trackhand_video_id).then(function (status) {
        console.log("video started", status);
        if (status) {
            trackhand_updatenote_id.innerText = "Video started. Now tracking"
            isVideo = true
            runDetection()
        } else {
            trackhand_updatenote_id.innerText = "Please enable video"
        }
    });
}

function toggleVideo() {
    if (!isVideo) {
        trackhand_updatenote_id.innerText = "Starting video"
        startVideo();
    } else {
        trackhand_updatenote_id.innerText = "Stopping video"
        handTrack.stopVideo(trackhand_video_id)
        isVideo = false;
        trackhand_updatenote_id.innerText = "Video stopped"
    }
}
globalThis.toggleVideo = toggleVideo

function runDetection() {
    model.detect(trackhand_video_id).then(predictions => {
        console.log("Predictions: ", predictions);
        let context = trackhand_canvas_id.getContext("2d");
        model.renderPredictions(predictions, trackhand_canvas_id, context, trackhand_video_id);
        if (isVideo) {
            requestAnimationFrame(runDetection);
        }
    });
}