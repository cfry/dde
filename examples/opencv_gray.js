//Caution: converting an image to b&w doesn't work for all images.
Picture.init() //var cv = require("opencv.js")

function handle_hello_opencv(vals){
    if(vals.clicked_button_value == "show images"){
        src_image_id.src = vals.file_input_id
        setTimeout(function(){ //need to delay until image is loaded
            let mat          = cv.imread(src_image_id)
            let gray_mat     = new cv.Mat(700, 700, cv.CV_8UC1)
            cv.cvtColor(mat, gray_mat, cv.COLOR_RGBA2GRAY)
            cv.imshow("output_canvas_id", gray_mat)
            mat.delete()
            gray_mat.delete()
        }, 100)
    }
}

show_window({
    content:
    `<b>Hello OpenCV.js</b><br/>
     1. Choose a file with an extension of .gif, .jpeg or .png<br/>
     2. Click on "show image".<br/>
     The image on the left has no cv processing.<br/>
     The right is changed to gray by cv.<br/>
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
