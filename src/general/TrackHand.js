import { HandLandmarker, FilesetResolver } from "./tasks-vision@0.10.0.js";  //"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
globalThis.HandLandmarker = HandLandmarker
globalThis.FilesetResolver = FilesetResolver

globalThis.TrackHand = class TrackHand {

    static make_show_window() {
        show_window({
            title: "Track Hand",
            x: 200, y: 0,
            content: `
                <div style="position: relative;">
                    <video id="trackhand_webcam_id" style="position: absolute" autoplay playsinline></video>
                    <canvas class="trackhand_output_canvas_id" id="output_canvas"></canvas>
                  </div>`
        })
    }

    static async init() { //was getVisionStuff()
        debugger;
        this.make_show_window()
        // MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
            "./vision-wasm" //https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        )
        const handLandmarker = await HandLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: "hand_landmarker.task",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numHands: 2,
            }
        );
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            trackhand_webcam_id.srcObject = stream;
            trackhand_webcam_id.addEventListener("loadeddata", predictWebcam);
        });

        async function predictWebcam() {
            console.log(handLandmarker.detectForVideo(trackhand_webcam_id, performance.now()));
            //window.requestAnimationFrame(predictWebcam);
        }
    }
} //end class