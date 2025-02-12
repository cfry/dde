/* Locate Object Demo
This demo is an incomplete work-in-progress.
If you want to use a different camera than your computer's built in default,
1. Eval Picture.show_video_cameras()
2. Copy the ID of the camera you want to use.
3. Paste it in place of "webcam" in the below call to IO.show_video
   The pasted ID should be wrapped in quotes.

The Job created by evaling this code:
 1. Moves Dexter's end effector to above the workspace.
 2. Takes a picture of the background.
 3. Instructs you to place an object on the workspace.
 4. Takes a 2nd picture.
 5. The location of the object is computed from the difference between
 the two pictures.
 6. Dexter moves to the object and attempts to pick it up.
 Note that because the camera is not calibrated to the workspace,
 it usually won't actually pick up the object.
 But it is a start.

 To give the demo:
 1. Eval the code.
 2. Click on the Job button to start it.
 3. Follow the humna instuctions to take pictures.
*/
Picture.init()

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
    return [Dexter.ungrasp(),
            Control.wait_until(1), //wait until fingers are open
            Dexter.move_to([dex_x, dex_y, this.user_data.take_pic_point[2]]), //move above obj
            Dexter.move_to([dex_x, dex_y, this.user_data.dexter_down_z]),     //move down to obj
            Dexter.empty_instruction_queue(), //wait until move completed
            Dexter.grasp(),
            Control.wait_until(1), //wait until fingers closed
            Dexter.move_to([dex_x, dex_y, this.user_data.take_pic_point[2]]), //move up
            Dexter.move_to([0.5, dex_y, this.user_data.take_pic_point[2]]), //move away
            Dexter.empty_instruction_queue(), //wait until move complete
            Dexter.ungrasp() //drop object
           ]
}

new Job({name: "loc_obj",
    user_data: {dex_y_offset: 0.15,
                take_pic_point: [0, (0.747 / 2) + 0.15, 0.3],
                dexter_down_z: 0.05},
    do_list: [IO.show_video({content: "webcam", x: 600, y: 60}),
              function() {return Dexter.move_to(this.user_data.take_pic_point)},
              Human.task({title: "Clear the Scene",
                    task: 'Take a "background" picture<br/>by clicking <b>Continue Job</b>',
                    x: 250, y: 60, height: 120, width: 330}),
              IO.take_picture({callback: "background_pic"}),
              Human.task({title: "Set the Scene",
                    task: "Place an object in view of the camera<br/>and take a foreground picture<br/>by clicking <b>Continue Job</b>",
                    x: 250, y: 60, height: 140, width: 330}),
              IO.take_picture({callback: "foreground_pic"}),
              locate_obj,
              function(){inspect(this.user_data.loc_obj)},
              pick_up_obj
    ]})