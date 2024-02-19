/*This demo uses your computer's webcam to capture video.
A snapshot of that video is grabbed.
It is converted to a gray-scale image.
Faces are identified in the image, as rectangles
defined as x, y, width, height.
Those 4 numbers are printed into the Output pane.
A red rectangle is drawn around recognized faces.

Camera code inspired by https://davidwalsh.name/browser-camera
Requires net connection to get the face model.
Models of objects other than faces are at:
https://github.com/opencv/opencv/tree/master/data/
On the "request.get" line below, use that first arg
as an example of how to convert https://github.com/opencv/opencv urls
into the url format used by this demo.
*/

//BUG in init_face_classifier() causes this to fail

var faceClassifier = undefined

function init_face_classifier(){
    debugger;
    if(!faceClassifier) { //calling the below code twice in a dde session will error
        let face_file_path = "host://dde/vision/lbpcascade_frontalface.xml"
        DDEFile.read_file_async(face_file_path,
            function(err, content){
                if(err) {
                    warning("Could not find file: " + face_file_path)
                }
                else {
                    cv.FS_createDataFile('/', "model.xml", content, true, true, false) // can't create a file
                    faceClassifier = new cv.CascadeClassifier();
                    faceClassifier.load("model.xml"); //IFF I could just supply the content instead
                    if(faceClassifier.empty() == false) {
                        out("Model loaded into classifier.")
                    }
                }
            }
        )
    }
}

init_face_classifier()

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
        debugger;
        let context = canvas_id.getContext('2d')
        context.drawImage(video_id, 0, 0, 320, 240)
        let mat          = cv.imread(canvas_id)
        let mod_mat      = new cv.Mat(700, 700, cv.CV_8UC1)
        cv.cvtColor(mat, mod_mat, cv.COLOR_RGBA2GRAY) //gray picture
        cv.imshow("out1_canvas_id", mod_mat)
        //cv.cvtColor(mat, mod_mat, cv.COLOR_RGBA2BGR)
        //cv.imshow("out2_canvas_id", mod_mat)
        face_reco(mod_mat, mat)
        mat.delete()
        mod_mat.delete()
    }
}

function face_reco(faceMat, //gray mat to find faces in
                   rgbMat   //color mat to draw rectangles on
){
    let size     = faceMat.size() //not used
    let faceVect = new cv.RectVector();
    /* Scale down the input frame
       cv.pyrDown(grayMat, faceMat);
       if (videoWidth > 320) cv.pyrDown(faceMat, faceMat);
     */
    // Processing the frame to find faces
    faceClassifier.detectMultiScale(faceMat, faceVect);
    // Draw rectangle around faces
    for (let i = 0; i < faceVect.size(); i++) {
        let xRatio = 1 //videoWidth/size.width;
        let yRatio = 1 //videoHeight/size.height;
        let face = faceVect.get(i);
        let x = face.x*xRatio;
        let y = face.y*yRatio;
        let w = face.width*xRatio;
        let h = face.height*yRatio;
        let point1 = new cv.Point(x, y);
        let point2 = new cv.Point(x + w, y + h);
        cv.rectangle(rgbMat, point1, point2, [255, 0, 0, 255]);
        out('Face ' + i + ' detected at: x: ' + x + " y: " + y + ' width: ' + w + ' height: ' + h)
    }
    cv.imshow("out2_canvas_id", rgbMat) //display red rects around faces
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
  Draw red rectangle around faces.</span><br/>
 <canvas id="out1_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>
 <canvas id="out2_canvas_id" width="320" height="240" style="border-style:solid; border-width:1; margin:3px;""></canvas>

 `,
    title: "Face Recognition with DDE and OpenCV",
    width: 700, height: 600, x: 300, y:25,
    callback: handle_webcam_video})