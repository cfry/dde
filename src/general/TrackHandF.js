//DOC: eval TrackHand.init() to poop up show_window, then click button: ToggleVideo

import * as handTrack from 'handtrackjs';
globalThis.handTrack = handTrack

// from https://codepen.io/victordibia/pen/RdWbEY
globalThis.TrackHand = class TrackHand {
    static isVideo = false;
    static model = null;
    static modelParams = {
        flipHorizontal: true,   // flip e.g for video
        maxNumBoxes: 1,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.6,    // confidence threshold for predictions.
    }
    static xyz_history = []
    static filter_length = 10
    static x_out_filter
    static y_out_filter
    static z_out_filter

    static make_show_window() {
        show_window({
            title: "Track Hand",
            x: 0, y: 20, width: 450, height: 390,
            content: `<div>
                    <button onclick="TrackHand.toggleVideo()" id="trackhand_trackbutton_id"  type="button">
                      Toggle Video
                    </button> &nbsp;
                    <span id="trackhand_updatenote_id"> Loading model ...</span> &nbsp;
                    <button onclick="TrackHand.plot_xyz_history()" type="button">
                      Plot History
                    </button>
                  </div>
                  <video autoplay="autoplay" id="trackhand_video_id" style="width:450px; height:338px; display:none;"></video>
                  <canvas id="trackhand_canvas_id" style="width:450px; height:338px;"></canvas>`
        })
    }

    static init() {
        TrackHand.make_show_window()
        this.x_out_filter = new LowPassFilter(this.filter_length)
        this.y_out_filter = new LowPassFilter(this.filter_length)
        this.z_out_filter = new LowPassFilter(this.filter_length)

        if((Job.talk_internal) && Job.talk_internal.is_active()){
            Job.talk_internal.stop_for_reason("interrupted",
                "re-initialization of Job.talk_internal")
        }
        new Job ({name: "talk_internal",
            robot: Dexter.dexter_default,
            when_do_list_done: "wait",
            do_list: [
            ]
        }).start()
        this.xyz_history = []
        // Load the model.
        setTimeout(function () {
            handTrack.load(TrackHand.modelParams).then(lmodel => {
                // detect objects in the image.
                TrackHand.model = lmodel
                trackhand_updatenote_id.innerText = "Model loaded."
                //trackhand_trackbutton_id.disabled = false
            })
        }, 1000);
    }

    static startVideo() {
        this.xyz_history = []
        this.plot_xyz_history()
        handTrack.startVideo(trackhand_video_id).then(function (status) {
            console.log("video started", status);
            if (status) {
                trackhand_updatenote_id.innerText = "Video started. Now tracking"
                TrackHand.isVideo = true
                TrackHand.runDetection()
            } else {
                trackhand_updatenote_id.innerText = "Please enable video"
            }
        });
    }

    static toggleVideo() {
        if (!TrackHand.isVideo) {
            trackhand_updatenote_id.innerText = "Starting video"
            TrackHand.startVideo();
        } else {
            trackhand_updatenote_id.innerText = "Stopping video"
            handTrack.stopVideo(trackhand_video_id)
            TrackHand.isVideo = false;
            trackhand_updatenote_id.innerText = "Video stopped"
        }
    }

    static runDetection() {
        TrackHand.model.detect(trackhand_video_id).then(predictions => {
            console.log("Predictions: ", predictions);
            let context = trackhand_canvas_id.getContext("2d");
            TrackHand.model.renderPredictions(predictions, trackhand_canvas_id, context, trackhand_video_id);
            if(predictions.length > 0){
                TrackHand.process_data(predictions[0])
            }
            if (TrackHand.isVideo) {
                requestAnimationFrame(TrackHand.runDetection);
            }
        });
    }

    static process_data(predication){
        let bbox = predication.bbox
        out("process_data: bbox detected: " + bbox[0] + ", " + bbox[1] + ", " + bbox[2] + ", " + bbox[3])
        let instr = this.bounding_box_to_instruction(bbox)
        if(instr) {
            out("process_data: sending istr: " + instr)
            Job.insert_instruction(instr,
                                   {job: "talk_internal", offset: "end"})
        }
    }

    static bounding_box_to_instruction(bbox) {
        //bbox is of the form: [x, y, width, height] https://towardsdatascience.com/handtrackjs-677c29c1d585
        let x_in = bbox[0]
        let y_in = bbox[1]
        let width_in = bbox[2] //unused
        let height_in = bbox[3] //as height of rect gets larger, that means the rect is closer to the camera, and so end effector sould move close Dexter base, and so hight is inversley proportional to y_out
        //bbox x, -1.2 to 492              for move_to x -0.7 to 0.7
        //bbox y   1.9 to 449              for move_to z  0   to 0.9
        //bbox h   65 to 296 (far to near) for move_to y, .7  to 0 the smaller the height, the greater the move-to y
        let x_out = this.interpolate (-1.2, 492,    -0.7,    0.7, x_in)
        //x_out = Math.max( -0.7, x_out)
        //x_out = Math.min(  0.7, x_out)
        let y_out = this.interpolate (65,   296,    0,   0.7, height_in, true) * -1 //true means inverse. the -1 siwtches Y moving hand up from driving robot down to driving it up.
        //y_out = Math.max( 0, y_out)
        //y_out = Math.min( 0.7, y_out)
        let z_out = this.interpolate (1.9,  449,    0,       0.9, y_in)
        //z_out = Math.max(0, z_out)
        //z_out = Math.min(0.9, z_out)
        if(this.x_out_filter.the_array[0] === undefined) { //initialize the filters with the current xyz pos
            //now when we add our first, hand-detected xyz new val, it won't "jump" to the new val since we low_pass filter it,
            //so we gradually go to the new position
            let rob = Job.talk_internal.robot
            let xyz = rob.rs.xyz()[0]
            this.x_out_filter.filter(xyz[0])
            this.y_out_filter.filter(xyz[1])
            this.z_out_filter.filter(xyz[2])
        }

        x_out = this.x_out_filter.filter(x_out)
        y_out = this.y_out_filter.filter(y_out)
        z_out = this.z_out_filter.filter(z_out)

        let angles_out =  this.coerce_xyz_into_angles(x_out, y_out, z_out)
        if(angles_out) {
            return Dexter.move_all_joints(angles_out)
        }
        else {  //ignore this position
            return null
        }
    }

    //pass invert=true for h_to_y
    static interpolate (min_in, max_in, min_out, max_out, actual_in, invert=false){
        let range_in = max_in - min_in
        let actual_in_shift_toward_0 = actual_in - min_in
        let proportion_in = actual_in_shift_toward_0 / range_in
        let range_out = max_out - min_out
        let actual_out_units = (range_out * proportion_in)
        let actual_out
        if(invert) {
            actual_out = max_out - actual_out_units
        }
        else {
            actual_out = actual_out_units + min_out
        }
        return actual_out
    }

    /* First clamp the x, y, z to be front and above table
       2nd clamp the joint angles to front and above the table
     */
    static coerce_xyz_into_angles(x, y, z){
        x = Utils.clamp(x, -0.7, 0.7)
        y = Utils.clamp(y, 0.1, 0.7)
        z = Utils.clamp(z, 0, 0.9)
        let angles
            try { angles = Kin.xyz_to_J_angles([x, y, z]) }
            catch(err) {
            out("coerce_xyz: rejected 1: " + err.message)
            return null
            } //not sure why this happens, maybe "out of reach",  but it does happen so just ignore this position
        let [j1, j2, j3, j4, j5, j6, j7] = angles
        j1 = Utils.clamp(j1, -90, 90)
        j2 = Utils.clamp(j2, -45, 97)
        j3 = Utils.clamp(j3, 0, 90)
        j4 = Utils.clamp(j4, 0, 90)
        j5 = Utils.clamp(j5, -90, 90)
        let new_angles = [j1, j2, j3, j4, j5, j6, j7] //just pass through j6 and j7

        let [new_xyz, direction, config] = Kin.J_angles_to_xyz(new_angles)
        if(Kin.is_in_reach(new_xyz, direction, config)) {
            out("coerce_xyz: in reach xyz: " + new_xyz, "blue")
            this.xyz_history.push(new_xyz)
            TrackHand.plot_xyz_history()
            return new_angles
        }
        else {
            out("coerce_xyz: rejects, out of reach")
            return null
        }  //ie ignore this position
    }

    static plot_xyz_history(array_of_xyz_elts){
        if(!array_of_xyz_elts) {
            array_of_xyz_elts = TrackHand.xyz_history
        }
        let x_elts = []
        let y_elts = []
        let z_elts = []
        for(let xyz of array_of_xyz_elts){
            x_elts.push(xyz[0])
            y_elts.push(xyz[1])
            z_elts.push(xyz[2])
        }
        //TrackHand.xyz_history = []  //clear history to get ready for next time user calls plot_xyz_history
        Plot.show(null,
            [{type: "scatter",
                name: "x",
                mode: "lines+markers", //lines between points and dots (markers) on the points
                y: x_elts,
                line: {color: "red"}
                 },
                {type: "scatter",
                    name: "y",
                    mode: "lines+markers", //lines between points and dots (markers) on the points
                    y: y_elts,
                    line: {color: "green"}
                },
                {type: "scatter",
                    name: "z",
                    mode: "lines+markers", //lines between points and dots (markers) on the points
                    y: z_elts,
                    line: {color: "blue"}
                }
            ],
            null,
            null,
            {x: 450,y: 20}
        )
    }

} //end class TrackHand