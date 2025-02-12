//started from https://github.com/bobbyroe/computer-vision/blob/main/index.js
//and https://github.com/bobbyroe/computer-vision/blob/main/getVisionStuff.js

import {
    HandLandmarker,
    FilesetResolver,
} from "./tasks-vision@0.10.0"  //"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
globalThis.HandLandmarker = HandLandmarker
globalThis.FilesetResolver = FilesetResolver

globalThis.TrackHand = class TrackHand {

    static make_show_window(){
        show_window({
            title: "Track Hand",
            x:200, y: 0,
            content: `
                <div style="position: relative;">
                    <video id="trackhand_webcam_id" style="position: absolute" autoplay playsinline></video>
                    <canvas class="trackhand_output_canvas_id" id="output_canvas"></canvas>
                  </div>`
        })
    }

    static async init(){ //was getVisionStuff()
        this.make_show_window()
        // MediaPipe
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0" // url orig had suffix  "/wasm " but that apparently no longer exists
        );
        const handLandmarker = await HandLandmarker.createFromOptions(
            filesetResolver,
            {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numHands: 2,
            }
        );

        const video = trackhand_webcam_id
        video.width = window.innerWidth;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "user" } })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.play();
                })
                .catch(function (error) {
                    console.error("Unable to access the camera/webcam.", error);
                });
        }
        return { video, handLandmarker };
    }
}
//export default getVisionStuff;
