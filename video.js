//https://developers.google.com/youtube/iframe_api_reference
  /* this code failed on chrome app dueto security restrictions,
     so for now I just show  a url in a separate browser window
     when the select value changes.

    function init_video(){
    // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    var video_player;

    function onYouTubeIframeAPIReady() {
        video_player = new YT.Player('video_player_id', {
            height: '390',
            width:  '640',
            events: {
                'onReady': onPlayerReady
            }
        });
    }

    function onPlayerReady(event) {
        event.target.setVolume(100);
        event.target.playVideo();
    }
    */

    //gets rid of innHTML and all the event listeners, needed when switching
    //between dexter sim and stl view
    //https://stackoverflow.com/questions/9251837/how-to-remove-all-listeners-in-an-element
    function clear_out_sim_graphics_pane_id(){
        var new_element = sim_graphics_pane_id.cloneNode(false);
        sim_graphics_pane_id.parentNode.replaceChild(new_element, sim_graphics_pane_id);
    }

    var prev_make_instruction_src = undefined
    function misc_pane_menu_changed(select_val){
        if(MakeInstruction.is_shown()) { prev_make_instruction_src = MakeInstruction.dialog_to_instruction_src() }
        if(select_val instanceof Event) { select_val = misc_pane_menu_id.value }
        else {misc_pane_menu_id.value = select_val } //used when user clicks the demo button.
        if (select_val == "Choose File") {
            select_val = choose_file()
        }
        console.log(select_val)
        if (select_val == "Simulate Dexter") {
            //video_player_id.style.display      = "none";
            sim_pane_content_id.innerHTML =
               'Simulate Job/Robot: <select id="job_or_robot_to_simulate_id">' +
                '</select> <div id="sim_graphics_pane_id"></div>'
            refresh_job_or_robot_to_simulate_id()
            open_doc(simulate_pane_doc_id)
            init_simulation()
            //sim.renderer.render(sim.scene, sim.camera);
            SimUtils.render_once_with_prev_args_maybe() //restore sim graphics to prev state
        }
        else if (select_val.endsWith(".jpg") ||
                 select_val.endsWith(".png") ||
                 select_val.endsWith(".gif") ||
                 select_val.endsWith(".bmp") ||
                 select_val.endsWith(".svg")
                ){
            sim_pane_content_id.innerHTML = "<img style='width:100%;' src='" + select_val + "'/>"
        }
        else if (select_val.endsWith(".stl")){
            clear_out_sim_graphics_pane_id()
            stl_init_viewer()
            var STLLoader = require('three-stl-loader')(THREE)
            var loader = new STLLoader()
            loader.load(select_val, function (geometry) {
                var material = new THREE.MeshNormalMaterial()
                var mesh = new THREE.Mesh(geometry, material)
                sim.scene.add(mesh)
            })
            stl_render()
        }
       // else if (select_val.startsWith("http")){
            ////play_youtube_video(select_val)
            //show_page(select_val) //this doesn't show the page in the SIm pane,
            //so I decided to remove it
            //the below fails
        //    let content = get_page(select_val)
        //    sim_graphics_pane_id.innerHTML = content
        //}
        else if (select_val == "Reference Manual"){
            let div_html = `<div contenteditable='false' 
                                style='height:300px; width:300px; padding:5%; background-color:#DDDDDD; overflow:scroll;'>` +
                             "<div style='font-size:18px; font-weight:700;'>Reference Manual</div>"
            let content = file_content(__dirname + "/doc/ref_man.html")
            //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
            sim_pane_content_id.innerHTML = div_html + content + "</div>"
        }
        else if (select_val.endsWith(".txt")  ||
                 select_val.endsWith(".js")   ||
                 select_val.endsWith(".json") ||
                 select_val.endsWith(".dde")){
            let div_html = `<div title="Click to choose a different file." onclick='sim_pane_menu_changed(\"Choose File\")' style='padding:7px; font-size:12px; font-weight:600;background-color:rgb(184, 187, 255);'>` +
                            select_val + "</div>" +
              "<div contenteditable='false' style='height:300px; width:800px; padding:5%; background-color:white; overflow:scroll;'>"

            let content = file_content(select_val)
            content = replace_substrings(content, "<", "&lt;")
            //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
            sim_pane_content_id.innerHTML = div_html + "<pre>" + content + "</pre></div>"
        }
        else if (select_val = "Make Instruction"){
           MakeInstruction.show(prev_make_instruction_src) //if arg value is undefined, show show's the default move_all_joints, otherwise, its previous state
           open_doc(make_instruction_pane_doc_id)
        }
        else //if (select_val.endsWith(".html") || select_val.endsWith(".htm"))
             {
            let div_html = "<div contenteditable='false' style='height:300px; width:300px; padding:5%; background-color:white; overflow:scroll;'>"
            let content = file_content(select_val)
            //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
            sim_pane_content_id.innerHTML = div_html + content + "</div>"
        }
    }
    //user changed the selected menu item. Must capture this in a global var so
    //dexSim can read it even when the sim dialog is not up.
    function job_or_robot_to_simulate_changed(){
        let new_val = job_or_robot_to_simulate_id.value
        out(new_val)
    }
    function refresh_job_or_robot_to_simulate_id(){
        if(window["job_or_robot_to_simulate_id"]){
            let options_html = "<option>All</option>\n"
            for(let job of Job.all_jobs()){
                options_html += "<option>Job." + job.name + "</option>\n"
            }
            for(let robot_name of Dexter.all_names){
                options_html += "<option>Dexter." + robot_name + "</option>\n"
            }
            job_or_robot_to_simulate_id.innerHTML = options_html
        }
    }

var {replace_substrings} = require("./core/utils.js")