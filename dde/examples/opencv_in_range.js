//inspired by https://davidwalsh.name/browser-camera

function handle_webcam_video(vals){ //vals contains name-value pairs for each
    //html elt in show_window's content with a name.
    if(vals.clicked_button_value == "init"){ // Clicked button value holds the name of the clicked button.
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                //video_id.src = window.URL.createObjectURL(stream);
                video_id.srcObject = stream //jan 2024
                video_id.play(); //show camera output into DOM elt video_id
            })
        }
    }
    else if (vals.clicked_button_value == "Snap Photo"){
        let context = canvas_id.getContext('2d')
        context.drawImage(video_id, 0, 0, 320, 240) //grab a still from video_id and show in canvas_id
        let src_mat  = cv.imread("canvas_id");
        let dst_mat  = new cv.Mat();
        let low_mat  = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [0, 0, 0, 0]);
        let high_mat = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [150, 150, 150, 255]);
        cv.inRange(src_mat, low_mat, high_mat, dst_mat);
        cv.imshow("output_canvas_id", dst_mat);
        src_mat.delete(); dst_mat.delete(); low_mat.delete(); high_mat.delete();
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
 <canvas id="output_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>

 `,
    title: "Processing Webcam video with DDE and OpenCV",
    width: 700, height: 600, x: 300, y:25,
    callback: handle_webcam_video})
