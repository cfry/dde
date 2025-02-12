/* This code gets hung up when I have the script of
<script               src="./third_party/opencv.js"></script>  in index.html
so I commented that out and
npn install npm install @techstark/opencv-js
but upon launching dde4, got error on initialization of:
Uncaught TypeError: Failed to resolve module specifier "fs". Relative references must start with either "/", "./", or "../".
But thein notice my package.json had: "opencv.js": "^1.2.1",
so I did:    npm uninstall opencv.js
but this didn't help (although still probabably the right thing to do.)
BUT: no loading opencv fixes the trackhand problem!
And I got rid of the redundanot opencv.js in package.json
(redundant with the <script /> tag loading opencv in dde4 index.html)
and replaced it with TechStark opencv-js from NPM,
but maybe due to rollup, launching dde4 errors.
MY plea for help at:
https://github.com/TechStark/opencv-js/issues/72
and
https://github.com/rollup/plugins/issues/1757   titled: converting webpack config to rollup
 */
//Aug 13 bug: with ooencv4_10_0 now loading in script tag at bottom of index.html
//build process completes. launching dde4 in browser competes fine,
//and cv defined ,and can run blob detector fine.
//but calling TrackHand.init() will hang dde as if in an infinite loop
//and have to close browser tab to escape it.
//opencv.ai has consultants and a hand tracker. Maybe that's best.


//import { HandLandmarker, FilesetResolver } from "./tasks-vision@0.10.0.js";  //"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
// needs npm install @mediapipe/tasks-vision
//see tutorial: https://medium.com/@kiyo07/integrating-mediapipe-tasks-vision-for-hand-landmark-detection-in-react-a2cfb9d543c7
//import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision"; //todo interferes with opencv-js

//pretty good tutorial at: https://www.google.com/search?q=HandLandmarker.createFromOptions+VIDEO&oq=HandLandmarker.createFromOptions+VIDEO&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRigATIHCAMQIRigATIHCAQQIRigAdIBCDY0MThqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8#fpstate=ive&vld=cid:b5b63332,vid:hV5S4iQhNkI,st:0
//except that no code available like the speaker claims, but see:
// https://codepen.io/mediapipe-preview/pen/gOKBGPN

/* disabled just becuase requires internet, uncomment when get net connecting but still has problems.
import { HandLandmarker, FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
globalThis.HandLandmarker = HandLandmarker
globalThis.FilesetResolver = FilesetResolver

 */


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
        this.make_show_window()
        // MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
            "./vision-wasm"
            //"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        )
        const handLandmarker = await HandLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: //"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                                    "hand_landmarker.task",
                    //delegate: "GPU",
                },
                runningMode: "VIDEO", //needs to be a string. default it "IMAGE" but use "VIDEO" for my purposes.
                numHands: 1,
            }
        );  //bug calling this in vision_wasm_internal.js, line 1267, function "lookup"
            //calls lookup function at least many many times line 1897,
            //looks like infinite loop.
        //suspicious: If I launch dde4 with dev tools already oopen, it wiln break on
        //opencv.js on
        // lookup: (function(parent, name) {
        //                     throw FS.genericErrors[ERRNO_CODES.ENOENT]
        //and seems to be in an infinite loop too. If I close dev tools at that point,
        //dde4 loads fine.
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            trackhand_webcam_id.srcObject = stream;
            trackhand_webcam_id.addEventListener("loadeddata", predictWebcam);
        });

        async function predictWebcam() {
            let result = handLandmarker.detectForVideo(trackhand_webcam_id, performance.now())
            // see https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js for a description of  the result
            //note especially that z from the result means "depth" or what in DDE is the Y axis.
            //The 21 hand landmarks are also presented in world coordinates.
            // Each landmark is composed of x, y, and z, representing real-world 3D coordinates in meters
            // with the origin at the hand’s geometric center.
            //so to get the overall hand position, I want NON world coords ie the "Landmarks" not "World Landmrks"
            //the designation of "world" for center of hand relative is wrong, but that's google for you.
            //nnumbers for x,y, z are in meters.
            console.log(result)
            window.requestAnimationFrame(predictWebcam);
        }
    }
} //end class