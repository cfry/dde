
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
        let mat     = cv.imread(canvas_id) //convert still in canvas_id into OpenCV "mat" format
        let mod_mat = new cv.Mat(mat.rows, mat.cols, mat.type())
        cv.GaussianBlur(mat, mod_mat, new cv.Size(15, 15), 7, 7)
        cv.imshow("output_canvas_id", mod_mat);
        mat.delete();
        mod_mat.delete();
    }
}

show_window({content:
        `<input type="button" value="init" style="margin-left:4px;"/> 
  &nbsp;webcam video display.
 <input type="button" value="Snap Photo" style="margin-left:115px;"/>
  &nbsp;from webcam video.<br/>
 <video  id="video_id"  width="320" height="240" style="border-style:solid; border-width:1; margin:3px;" autoplay></video>
 <canvas id="canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas><br/>
  &nbsp;Photo processed to blur it. 
  <br/>
 <canvas id="output_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>
 `,
    title: "Bluring Webcam video with DDE and OpenCV",
    width: 700, height: 600, x: 300, y:25,
    callback: handle_webcam_video})