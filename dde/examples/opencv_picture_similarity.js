/* Picture Similarity Demo
Take two pictures and get their similarity score.
If you want to use a different camera than your computer's built in default,
1. Eval Picture.show_video_cameras()
2. Copy the ID of the camera you want to use.
3. Paste it in place of "webcam" in the below call to IO.show_video
   The pasted ID should be wrapped in quotes.
*/
new Job({name: "pic_sim",
    user_data: {take_pic_point: [0, (0.747 / 2) + 0.15, 0.3]},
    do_list: [
        IO.show_video({content: "webcam", x: 600, y: 60}),
        function() {return Dexter.move_to(this.user_data.take_pic_point)},
        Human.task({title: "Take First Picture",
                    task: 'Click continue to snap the 1st picture.',
                    x: 250, y: 60, height: 120, width: 330}),
        IO.take_picture({callback: "background_pic"}),
        Human.task({title: "Take Second Picture",
                    task: "Click continue to snap the 2nd picture.",
                    x: 250, y: 60, height: 140, width: 330}),
        IO.take_picture({callback: "foreground_pic"}),
        function() {
                    let sim = Picture.mats_similarity_by_color( //mats_similarity_by_average_color, mats_similarity_by_detect_blobs
                        {mat_in1: this.user_data.background_pic,
                         mat_in2: this.user_data.foreground_pic})
                     out("Picture similarity score: " + sim + 
                         "<br/>(range: 0 to 1, where 1 means very similar)")
        }
    ]})