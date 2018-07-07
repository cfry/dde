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
    function video_changed(){
        var select_val = videos_id.value
        if (select_val == "Choose File") {
            select_val = choose_file()
        }
        console.log(select_val)
        if ((select_val == "All")   ||
            (select_val == "None")  ||
            (select_val.startsWith("Job: "))   ||
            (select_val.startsWith("Robot: "))) {
            video_player_id.style.display      = "none";
            clear_out_sim_graphics_pane_id()
            init_simulation()
            sim_graphics_pane_id.style.display = "inline";
        }
        //else if (select_val == "Simulate Dexter") {
        //    init_simulation()
        //}
        else if (select_val.endsWith(".jpg") ||
                 select_val.endsWith(".png") ||
                 select_val.endsWith(".gif") ||
                 select_val.endsWith(".bmp") ||
                 select_val.endsWith(".svg")
                ){
            sim_graphics_pane_id.innerHTML = "<img style='width:370px;' src='" + select_val + "'/>"
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
        else {
            //play_youtube_video(select_val)
            show_page(select_val)
        }
    }
    //function show_url(url){
    //    /*sim_graphics_pane_id.style.display = "none";
    //   video_player_id.style.display         = "inline";
    //    video_player.loadVideoById(youtube_id)
    //    */
    //    window.open(url) //"https://youtu.be/6o0gkU9SgdQ"
    //} */