/* Locate Object Demo
This demo is an incomplete work-in-progress.
If you want to use a different camera than your computer's built in default,
1. Eval Picture.show_video_cameras()
2. Copy the ID of the camera you want to use.
3. Paste it in place of "webcam" in the below call to Robot.show_video
   The pasted ID should be wrapped in quotes.
*/
function locate_obj(){
    this.user_data.loc_obj =
        Picture.locate_object({
            mat_in1: this.user_data.foreground_pic,
            mat_in2: this.user_data.background_pic,
            mat_out: null,
            threshold: 30, //pixel values below this are ignored
            noise_size: 3, //filter out "salt and pepper" noise.
            //Larger values filter out larger specs, but eat into real content.
            out_format: "min_area_rect",
            avg_center: true,
            show: true})
}

function pick_up_obj(){
    let pic_x = this.user_data.loc_obj.center_x //0 to 320
    let pic_y = this.user_data.loc_obj.center_y //0 to 240
    let dex_x = pic_x / 320 * 0.747  //0 to 0.747
    let dex_y = pic_y / 240 * 0.747  //0 to 0.747
    dex_x -= 0.747 / 2 //center on table
    dex_y -= 0.747 / 2 //center on table
    dex_y += this.user_data.dex_y_offset //move away from Dexter's feet
    out("moving dexter to: " + dex_x + ", " + dex_y)
    return [Dexter.move_to([dex_x, dex_y, this.user_data.take_pic_point[2]]), //move above obj
            Dexter.move_to([dex_x, dex_y, this.user_data.dexter_down_z]),     //move down to obj
            Robot.wait_until(1),   //todo grab obj
            Dexter.move_to([dex_x, dex_y, this.user_data.take_pic_point[2]]), //move up
            Dexter.move_to([0.5, dex_y, this.user_data.take_pic_point[2]])    //move away
            //todo drop object
           ]
}

new Job({name: "loc_obj",
    user_data: {dex_y_offset: 0.15,
                take_pic_point: [0, (0.747 / 2) + 0.15, 0.3],
                dexter_down_z: 0.05},
    do_list: [Robot.show_video({content: "webcam", x: 600, y: 60}),
              function() {return Dexter.move_to(this.user_data.take_pic_point)},
              Human.task({title: "Clear the Scene",
                    task: 'Take a "background" picture.',
                    x: 250, y: 60, height: 120, width: 330}),
              Robot.take_picture({callback: "background_pic"}),
              Human.task({title: "Set the Scene",
                    task: "Place an object in view of the camera<br/>and take a foreground picture.",
                    x: 250, y: 60, height: 140, width: 330}),
              Robot.take_picture({callback: "foreground_pic"}),
              locate_obj,
              function(){inspect(this.user_data.loc_obj)},
              pick_up_obj
    ]})