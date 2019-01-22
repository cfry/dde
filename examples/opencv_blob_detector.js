/*https://www.learnopencv.com/blob-detection-using-opencv-python-c/
is a good tutorial on usng the SimpleBlobDector,
though all examples are in Python and C++
It does help you understand the meaning of the params

After using the dialog and adjusting sliders, the
resuling values for the sliders are stored in
the global variable sbd_params,
which can be used in your own call to making a SimpleBlobDector.
Just type in sbd_params to the command line and it return
to inspect it, then copy the output and paste into your program.
*/
dde_version_between("2.1.15", null, "warn") 
//started from the opencv.js code test file: tests/test_features2d.js
var cv = require("opencv.js")
//var jpeg = require('jpeg-js');
var sbd_params = {}; //Parameters for SimpleBlobDetector
sbd_params.thresholdStep       = 10;
sbd_params.minThreshold        = 50;
sbd_params.maxThreshold        = 220;
sbd_params.minRepeatability    = 2;
sbd_params.minDistBetweenBlobs = 10;

sbd_params.filterByColor = true; //true to filter by color or false to not filter by color
sbd_params.blobColor     = 0;    //0 to select darker blobs, 255 for lighter blobs

sbd_params.filterByArea = true; //true to filter by area, false to not filter by area.
sbd_params.minArea      = 40;   //area is in pixels
sbd_params.maxArea      = 700   //a non negative integer  Number.MAX_VALUE; 

sbd_params.filterByCircularity = true; //true to filter by circularity, false to not filter by circularity
sbd_params.minCircularity = 0; //0 means the furthest from a circle you can get.
sbd_params.maxCircularity = 1; //1 means perfect circle. 0.785 is a square.

sbd_params.filterByInertia = false;//true to filterByInertia by inertia, false to not filter by inertia
sbd_params.minInertiaRatio = 0.1; //0 to 1. 0 means a line, 1 means a circle
sbd_params.maxInertiaRatio = 1;   //0 to 1. An ellipse is recognized by a value between 0 and 1. 

sbd_params.filterByConvexity = false; //true to filter by convexivity, false to not filter by cinvexivity
sbd_params.minConvexity = 0.95; //0 to 1  0 means lots of concave parts of the perimeter (like a star)
sbd_params.maxConvexity = 1;    //0 to 1. 1 means no concave parts of the perimeter (like a cricle)

var sbd_sort_by = "size"

function handle_keypoints_opencv(vals){
    if      (vals.clicked_button_value == "sort_by_x")    { sbd_sort_by = "x" }
    else if (vals.clicked_button_value == "sort_by_y")    { sbd_sort_by = "y" }
    else if (vals.clicked_button_value == "sort_by_size_id") { sbd_sort_by = "size" }
    else if (vals.clicked_button_value == "sort_by_pt")   { sbd_sort_by = "pt" }
    var image_path = __dirname + "/examples/snickerdoodle_board.png"
    src_image_id.src = image_path //vals.file_input_id
    let white_level = vals.white_level_id //0 to 255
    sbd_params.minCircularity = vals.minCircularity_id
    sbd_params.maxCircularity = vals.maxCircularity_id
    sbd_params.minArea = vals.minArea_id
    sbd_params.maxArea = vals.maxArea_id
    //this setTimeout gives src_image_id.src = image_path a chance to load
    //before we use it in cv.imread("src_image_id")
    //otherwise we get an error when first bringing up this demo
    setTimeout(function (){handle_keypoints_opencv_aux(sbd_params, white_level)},
        100)
}

function handle_keypoints_opencv_aux(sbd_params, white_level){
    let src_mat  = cv.imread("src_image_id");
    let dst_mat  = new cv.Mat();
    let low_mat  = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [0, 0, 0, 0]);
    let high_mat = new cv.Mat(src_mat.rows , src_mat.cols, src_mat.type(), [white_level, white_level, white_level, 255]);
    cv.inRange(src_mat, low_mat, high_mat, dst_mat);
    cv.imshow("output_canvas_id", dst_mat);

    let detector  = new cv.SimpleBlobDetector(sbd_params);
    let keypoints = new cv.KeyPointVector();
    //var image = cv.Mat.ones(5, 5, cv.CV_8UC3);
    detector.detect(dst_mat, keypoints);
    let dst_mat2  = new cv.Mat();
    cv.drawKeypoints(dst_mat, keypoints, dst_mat2,
                     cv.Scalar.all(-1), //draw each point in a different color
                     cv.DrawMatchesFlags_DRAW_RICH_KEYPOINTS //draw points at size of found point
                     )
    display_keypoint_data(keypoints)
    cv.imshow("output_canvas2_id", dst_mat2) //dst_mat  image_with_keypoints);

    src_mat.delete(); dst_mat.delete(); low_mat.delete(); high_mat.delete(); dst_mat2.delete()
}

function sbd_data_table_header() {
	return "Keypoints Data <table><tr>" +
                    "<th><input type='button' name='sort_by_pt'   value=' pt '/></th>"   +
                    "<th><input type='button' name='sort_by_x'    value=' x ' style='width:54px;'/></th>"    +
                    "<th><input type='button' name='sort_by_y'    value=' y ' style='width:62px;'/></th>"    +
                    "<th><input type='button' id='sort_by_size_id' value=' size ' style='width:62px;'/></th>" +
                    "</tr></table>\n"
}

function keypoints_to_array(keypoints) {
	let number_of_points = keypoints.size()
	let points_array = []
	for(let i = 0; i < number_of_points; i++){ points_array.push(keypoints.get(i)) }
    return points_array
}
function display_keypoint_data(keypoints){
    let data_html = "<table>"
    let number_of_points = keypoints.size()
    let points_array = keypoints_to_array(keypoints)
    if (sbd_sort_by == "pt") {}
    else if ((sbd_sort_by == "x") || (sbd_sort_by == "y")) {
       points_array.sort(function(a, b) { 
           if      (a.pt[sbd_sort_by] <  b.pt[sbd_sort_by]) { return -1 }
           else if (a.pt[sbd_sort_by] == b.pt[sbd_sort_by]) { return  0 }
           else                                             { return  1 }
     })}
    else {
       points_array.sort(function(a, b) { 
           if      (a[sbd_sort_by] <  b[sbd_sort_by]) { return -1 }
           else if (a[sbd_sort_by] == b[sbd_sort_by]) { return  0 }
           else                                       { return  1 }
    })}       
    for(let i = 0; i < number_of_points; i++){
          let kp = points_array[i]
          data_html += "<tr><td>"  + i +
                       "</td><td>" + ("" + kp.pt.x).substring(0, 6)  + 
                       "</td><td>" + ("" + kp.pt.y).substring(0, 6)  +
                       //"</td><td>" + ("" + kp.angle).substring(0, 6) +
                       "</td><td>" + ("" + kp.size).substring(0, 6)  +  
                       "</td></tr>"
    }
    data_id.innerHTML = data_html + "</table>"
}

show_window({
    content:
    `<table><tr><td style="vertical-align:top;">
      Original<br/>
      <img id="src_image_id"></img><br/>
       B & W White level: 0<input type="range"  id="white_level_id"  value="150"  min="0" max="255" data-oninput='true'/>255<br/>
      <canvas id="output_canvas_id"></canvas><br/>
       Keypoints Marked with thin colored circles.<br/>
       Circularity: min: 0<input style="width:50px;" type="range" id="minCircularity_id" value="0.5" min="0" max="1" step="0.02" data-oninput='true'/>1
                    max: 0<input style="width:50px;" type="range" id="maxCircularity_id" value="1"   min="0" max="1" step="0.02" data-oninput='true'/>1<br/>
       <span style="margin-left:43px;">
       Area:</span> min: 0<input style="width:50px;" type="range" id="minArea_id" value="40"   min="0" max="700" step="0.02" data-oninput='true'/>700
                    max: 0<input style="width:50px;" type="range" id="maxArea_id" value="700"  min="0" max="700" step="0.02" data-oninput='true'/>700<br/>
     
      <canvas id="output_canvas2_id"></canvas>
    </td>
    <td style="vertical-align:top;">` +
      sbd_data_table_header() +
    `<span id="data_id"/> </td>
    </tr></table>`
    ,
    x: 50, y: 50, width: 800, height: 600,
    title: "OpenCV.js simple blob dector",
    callback: handle_keypoints_opencv,
    init_elt_id: "sort_by_size_id"
})

var {dde_version_between} = require("../core/utis.js")
