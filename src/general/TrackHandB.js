/* https://victordibia.com/handtrack.js/#/
  https://www.npmjs.com/package/handtrackjs/v/0.0.12
  uses tensorflowjs  big but can be loaded via cdn
https://victordibia.com/handtrack.js/#/docs
https://towardsdatascience.com/handtrackjs-677c29c1d585
 */

import * as handTrack from 'handtrackjs';
globalThis.handTrack = handTrack

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

    static seconds_between_frames = 2
    static intervalID
    static model

    static async init() { //was getVisionStuff()
        this.stop()
        this.make_show_window()
        //const img = document.getElementById('trackhand_webcam_id');

        this.model = await handTrack.load();
        //handTrack.startVideo(img)
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            trackhand_webcam_id.srcObject = stream;
            //trackhand_webcam_id.addEventListener("loadeddata", predictWebcam);
        });
        trackhand_webcam_id.onloadeddata = (event) => {
                TrackHand.capture_data()
        }
    }

    static stop() {
        if (this.intervalID) {
            clearInterval(this.intervalID)
        }
        if (this.model){
            this.model.dispose()
        }
    }

    static async capture_data() { //was predictWebcam
        let predictions = await this.model.detect(trackhand_webcam_id);
        out(predictions)
        if(predictions.length > 0){ // && (predications[0].score > 0.5)){
            TrackHand.process_data(predications[0])
        }
        setTimeout(function() {
            TrackHand.capture_data()
        }, TrackHand.seconds_between_frames * 1000)
    }

    static process_data(predication){
        let bbox = predication.bbox
        out(bbox)
        let instr = this.bounding_box_to_instruction(bbox)
        if(instr) {
            out(instr)
        }
    }

    static bounding_box_to_instruction(bbox) {

    }
} //end class