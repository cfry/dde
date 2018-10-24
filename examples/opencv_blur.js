var cv = require("opencv.js")

function handle_hello_opencv(vals){
    if(vals.clicked_button_value == "show images"){
       src_image_id.src = vals.file_input_id
        setTimeout(function(){ //need to delay until image is loaded
            let src_mat = cv.imread(src_image_id)
            let dst_mat = new cv.Mat(src_mat.rows, src_mat.cols, src_mat.type())
            cv.GaussianBlur(src_mat, dst_mat, new cv.Size(15, 15), 7, 7)
            cv.imshow("output_canvas_id", dst_mat);
            src_mat.delete();
            dst_mat.delete();
        }, 100)
    }
}

show_window({
content:
`<b>Hello OpenCV.js</b><br/>
 Choose a file with an extension of<br/>
 .gif, .jpeg or .png<br/>
 then click on "show image".<br/>
 The image on the left has no cv processing.<br/>
 The right is digested & displayed by cv.<br/>
<input type="file" id="file_input_id"
       accept="image/gif, image/jpeg, image/png"/>
<input type="button" value="show images"/> (may have to click twice)
<p/>
<img id="src_image_id"></img>
<canvas id="output_canvas_id"></canvas>`,
height: 600, width:600,
callback: handle_hello_opencv
})