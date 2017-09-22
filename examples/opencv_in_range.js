//Caution: converting an image to b&w doesn't work for all images.
var cv = require("opencv.js")

function handle_hello_opencv(vals){
    if(vals.clicked_button_value == "show images"){
        src_image_id.src = vals.file_input_id
        let src_mat  = cv.imread("src_image_id");
		let dst_mat  = new cv.Mat();
		let low_mat  = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [0, 0, 0, 0]);
		let high_mat = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [150, 150, 150, 255]);
		cv.inRange(src_mat, low_mat, high_mat, dst_mat);
		cv.imshow("output_canvas_id", dst_mat);
		src_mat.delete(); dst_mat.delete(); low_mat.delete(); high_mat.delete();   
    }
}

show_window({
    content:
    `<b>Hello OpenCV.js</b><br/>
     Choose a file with an extension of<br/>
     .gif, .jpeg or .png<br/>
     then click on "show image".<br/>
     The image on the left has no cv processing.<br/>
     The right is changed to black & white by cv.<br/>
     You may have to click on "Show Images" twice to show the 2nd image.<br/>
    <input type="file" id="file_input_id"
           accept="image/gif, image/jpeg, image/png"/>
    <input type="button" value="show images"/>
    <p/>
    <img id="src_image_id"></img>
    <canvas id="output_canvas_id"></canvas>`,
    x: 50, y: 50, width: 800, height: 600,
    callback: handle_hello_opencv
})
