//inspired by https://davidwalsh.name/browser-camera

var cv = require("opencv.js")

function handle_webcam_video(vals){ //vals contains name-value pairs for each
    //html elt in show_window's content with a name.
    if(vals.clicked_button_value == "init"){ // Clicked button value holds the name of the clicked button.
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                //video_id.src = window.URL.createObjectURL(stream);
                video_id.srcObject = stream //jan 2024
                video_id.play();
            })
        }
    }
    else if (vals.clicked_button_value == "Snap Photo"){
        let context = canvas_id.getContext('2d')
        context.drawImage(video_id, 0, 0, 320, 240)
        let mat          = cv.imread(canvas_id)
        let mod_mat      = new cv.Mat(700, 700, cv.CV_8UC1)
        cv.cvtColor(mat, mod_mat, cv.COLOR_RGBA2GRAY)
        cv.imshow("out1_canvas_id", mod_mat)
        cv.cvtColor(mat, mod_mat, cv.COLOR_RGBA2BGR)
        cv.imshow("out2_canvas_id", mod_mat)
        mat.delete()
        mod_mat.delete()

    }
}

show_window({content:
    `<input type="button" value="init" style="margin-left:4px;"/> 
  &nbsp;webcam video display.
 <input type="button" value="Snap Photo" style="margin-left:115px;"/>
  &nbsp;from webcam video.<br/>
 <video  id="video_id"  width="320" height="240" style="border-style:solid; border-width:1; margin:3px;" autoplay></video>
 <canvas id="canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas><br/>
  &nbsp;Photo processed to Black and White. 
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  Photo processed swapping red and blue.</span><br/>
 <canvas id="out1_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>
 <canvas id="out2_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>

 `,
    title: "Processing Webcam video with DDE and OpenCV",
    width: 700, height: 600, x: 300, y:25,
    callback: handle_webcam_video})