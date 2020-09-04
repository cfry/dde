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
var THREE = require('three')
var THREE_GLTFLoader = require('three-gltf-loader')

function clear_out_sim_graphics_pane_id(){
    if(window.sim_graphics_pane_id){
        var new_element = sim_graphics_pane_id.cloneNode(false);
        sim_graphics_pane_id.parentNode.replaceChild(new_element, sim_graphics_pane_id)
    }
}

var prev_make_instruction_src = undefined
//choose_file_onlu matters if select_val == "Choose File", and is only passed in
//when initing DDE
function misc_pane_menu_changed(select_val, choose_file_path = ""){
    if(MakeInstruction.is_shown()) {
        prev_make_instruction_src = MakeInstruction.dialog_to_instruction_src()
    }
    if(select_val instanceof Event) { select_val = misc_pane_menu_id.value }
    else {misc_pane_menu_id.value = select_val } //used when user clicks the demo button.
    let select_val_started_as_choose_file = false
    if (select_val == "Choose File") {
        select_val_started_as_choose_file = true
        if(choose_file_path == "") {
            select_val = choose_file()
        }
        else {
            select_val = choose_file_path
        }
    }
    let prev_val = persistent_get("misc_pane_content")
    try {
    if (select_val == "Simulate Dexter") {
        //video_player_id.style.display      = "none";
        sim_pane_content_id.innerHTML =
           '<div style="white-space:nowrap;">Simulate Job/Robot: <select id="job_or_robot_to_simulate_id">' +
            '</select><b style="margin-left:15px;">Move Dur: </b><span id="sim_pane_move_dur_id"></span> s' +
            ' <button onclick="SimBuild.init()">Load SimBuild</button></div>' +
            '<b title="X position of end effector in meters.">X: </b><span id="sim_pane_x_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
            '<b title="Y position of end effector in meters."> Y: </b><span id="sim_pane_y_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
            '<b title="Z position of end effector in meters."> Z: </b><span id="sim_pane_z_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
            '<div style="white-space:nowrap;">' +
            '<b title="Joint 1 angle in degrees."> J1: </b><span id="sim_pane_j1_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
            '<b title="Joint 2 angle in degrees."> J2: </b><span id="sim_pane_j2_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
            '<b title="Joint 3 angle in degrees."> J3: </b><span id="sim_pane_j3_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
            '<b title="Joint 4 angle in degrees."> J4: </b><span id="sim_pane_j4_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
            '<b title="Joint 5 angle in degrees."> J5: </b><span id="sim_pane_j5_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
            '<b title="Joint 6 angle in degrees."> J6: </b><span id="sim_pane_j6_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
            '<b title="Joint 7 angle in degrees."> J7: </b><span id="sim_pane_j7_id" style="min-width:30px; text-align:left; display:inline-block"></span></div>' +
            '<div id="sim_graphics_pane_id"></div>'
        refresh_job_or_robot_to_simulate_id()
        open_doc(simulate_pane_doc_id)
        init_simulation()
        //sim.renderer.render(sim.scene, sim.camera);
        SimUtils.render_once_with_prev_args_maybe() //restore sim graphics to prev state
    }

    else if (select_val.endsWith(".stl")){
        if(file_exists(select_val)){
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
            warning("Could not find file: " + select_val)
            misc_pane_menu_id.value = prev_val  //reset to what it was before the person chose the item, which we know is good
            return
        }
    }
    else if (select_val.endsWith(".fbx")){
        clear_out_sim_graphics_pane_id()
        stl_init_viewer()
        // from https://github.com/ckddbs/three-fbx-loader/commit/b3bc39bef2a4253abf2acc780870a03f5f9cd510
        var FBXLoader = require('three-fbx-loader')
        var loader = new FBXLoader()
        //loader.load(select_val, function (object) { sim.scene.add(object)})
        loader.load(select_val,
                    function (object) {
                        // object3d is a THREE.Group (THREE.Object3D)
                        //const mixer = new THREE.AnimationMixer(object3d);
                        // animations is a list of THREE.AnimationClip
                        //mixer.clipAction(object3d.animations[0]).play();
                        //https://discourse.threejs.org/t/fbx-model-default-material-is-meshphongmaterial-how-to-change/2855/2
                       object.traverse( function ( child ) {

                            if ( child.type === "Mesh" ) {
                                // switch the material here - you'll need to take the settings from the
                                //original material, or create your own new settings, something like:
                                const oldMat = child.material;
                                //https://discourse.threejs.org/t/fbx-model-default-material-is-meshphongmaterial-how-to-change/2855/2
                                //says in is experience, all fbx files have only material of MeshPhongMaterial, but at least one of
                                //Dexter's materials from fusion 360 is an ARRAY of 3 MeshPhongMaterial. Maybe that causes a problem
                                const old_color = (Array.isArray(oldMat) ? oldMat[0].color : oldMat.color)
                                child.material = new THREE.MeshNormalMaterial({})
                                       //new THREE.MeshLambertMaterial( {color: old_color, map: oldMat.map,} );
                                /*let geom = child.geometry
                                geom.scale(0.001, 0.001, 0.001)
                                let pos = child.position
                                child.position.set(pos.x * 0.001,
                                                   pos.y * 0.001,
                                                   pos.z * 0.001)
                                */
                                sim.scene.add(child)
                            }
                        } );

                        //var mixer = new THREE.AnimationMixer( object );
                        //var action = mixer.clipAction( object.animations[ 0 ] );
                        //action.play();
                      //   sim.scene.add(object)
                    },
                    undefined,
                    function (err) {
                        console.error( err );
                    }
        )
        setTimeout(fbx_render, 400)
    }
    else if (select_val.endsWith(".gltf")){
//      clear_out_sim_graphics_pane_id()
//      stl_init_viewer()
        // from https://github.com/ckddbs/three-fbx-loader/commit/b3bc39bef2a4253abf2acc780870a03f5f9cd510
        //https://threejs.org/docs/#examples/en/loaders/GLTFLoader
        var loader = new THREE_GLTFLoader()

		function chainLink ( children, i ) {
			//	The  previous link (base if i is 0).
			let linkPrv = children[i-1];
			let Lprv = new THREE.Matrix4();
			Lprv.copy ( linkPrv.matrix );

			let nLprv = new THREE.Matrix4();
			nLprv.getInverse ( Lprv );

			//	The link's position WRT base.
			let link = children[i];
			let B = new THREE.Matrix4();
			B.copy ( link.matrix );

			//	The link's position WRT the previous link.
			let L = nLprv.multiply ( B );

			//	Remove the link from the current object tree.
			children.splice ( i, 1 );

			//	Add it as a child to the previous link.
			link.matrix.identity();
			linkPrv.add ( link );

			//	Set it's position.
			let p = new THREE.Vector3();
			let q = new THREE.Quaternion();
			let s = new THREE.Vector3();
			L.decompose ( p, q, s );
			link.position.set ( p.x, p.y, p.z );
			link.setRotationFromQuaternion ( q );
		}	//	chainLink()

        loader.load(select_val,
            function (gltf) {
//              sim.scene.add(gltf.scene)
				let root = gltf.scene;
				let c0 = root.children[0]
				c0.scale.set(0.001, 0.001, 0.001);
				//	Remove imported lights, cameras. Just want Object3D.
				let objs = [];
				c0.children.forEach ( c => {
					if ( c.constructor.name === 'Object3D' ) {
						objs.push(c); } } );
				c0.children = objs;
			//	sim.scene.add(root)
				sim.table.add(root)
				
				//	Set link parent-child relationships.
				//
				gltf_render();		 //	One render here to set the matrices.

				//	Now link.
   				chainLink ( objs[0].children, 7 );
				chainLink ( objs[0].children, 6 );
				chainLink ( objs[0].children, 5 );
				chainLink ( objs[0].children, 4 );
				chainLink ( objs[0].children, 3 );
				chainLink ( objs[0].children, 2 );
				chainLink ( objs[0].children, 1 );
         },
            undefined,
            function (err) {
                console.error( err );
            }
        )
    //  setTimeout(gltf_render, 400)
    }
   // else if (select_val.startsWith("http")){
        ////play_youtube_video(select_val)
        //show_page(select_val) //this doesn't show the page in the Misc pane,
        //so I decided to remove it
        //the below fails
    //    let content = get_page(select_val)
    //    sim_graphics_pane_id.innerHTML = content
    //}
    else if(select_val === "Dexter Photo"){
        let file_name = __dirname + "/doc/HD+Robotics-8517.jpg" //Dexter and Kent
        sim_pane_content_id.innerHTML = "<img src='" + file_name + "' style='width:100%;'/>"
    }
    else if(select_val === "Dexter Architecture"){
        let file_name = __dirname + "/doc/dexter_architecture.jpg"
        sim_pane_content_id.innerHTML = "<img src='" + file_name + "' style='width:100%;'/>"
    }
    else if (select_val == "Reference Manual"){
        let div_html = `<div contenteditable='false' 
                            style='height:300px; width:300px; padding:5%; background-color:#DDDDDD; overflow:scroll;'>` +
                         "<div style='font-size:18px; font-weight:700;'>Reference Manual</div>"
        let content = read_file(__dirname + "/doc/ref_man.html")
        //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
        sim_pane_content_id.innerHTML = div_html + content + "</div>"
    }
    else if (select_val.endsWith(".jpg") ||
        select_val.endsWith(".png") ||
        select_val.endsWith(".gif") ||
        select_val.endsWith(".bmp") ||
        select_val.endsWith(".svg")
    ){
        if(file_exists(select_val)){
            let div_html = `<div title="Click to choose a different file." onclick='misc_pane_menu_changed(\"Choose File\")' style='padding:7px; font-size:12px; font-weight:600;background-color:rgb(184, 187, 255);'>` +
                             select_val + "</div>" +
                            "<img style='width:100%;' src='" + select_val + "'/>"
            sim_pane_content_id.innerHTML = div_html
        }
        else {
            warning("Could not find file: " + select_val + "<br/>to show in the Misc pane.")
            misc_pane_menu_id.value = prev_val  //reset to what it was before the person chose the item, which we know is good
            return
        }
    }
    else if (select_val.endsWith(".txt")  ||
             select_val.endsWith(".js")   ||
             select_val.endsWith(".json") ||
             select_val.endsWith(".dde")){
        if(file_exists(select_val)){
            let div_html = `<div title="Click to choose a different file." onclick='misc_pane_menu_changed(\"Choose File\")' style='padding:7px; font-size:12px; font-weight:600;background-color:rgb(184, 187, 255);'>` +
                            select_val + "</div>" +
              "<div contenteditable='false' style='height:300px; width:800px; padding:5%; background-color:white; overflow:scroll;'>"

            let content = read_file(select_val)
            content = replace_substrings(content, "<", "&lt;")
            //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
            sim_pane_content_id.innerHTML = div_html + "<pre>" + content + "</pre></div>"
        }
        else {
            warning("Could not find file: " + select_val + "<br/>to show in the Misc pane.")
            misc_pane_menu_id.value = prev_val  //reset to what it was before the person chose the item, which we know is good
            return
        }
    }
    else if (select_val == "Make Instruction"){
       MakeInstruction.show(prev_make_instruction_src) //if arg value is undefined, show show's the default move_all_joints, otherwise, its previous state
       open_doc(make_instruction_pane_doc_id)
    }
    else if(file_exists(select_val)) { //select_val could be: (select_val.endsWith(".html") || select_val.endsWith(".htm") ||
         //some random other file that hopefully can be displayed as html.
         //but if we get an error, the below catch will catch it.
        let div_html = `<div title="Click to choose a different file." onclick='misc_pane_menu_changed(\"Choose File\")' style='padding:7px; font-size:12px; font-weight:600;background-color:rgb(184, 187, 255);'>` +
            select_val + "</div>" +
            "<div contenteditable='false' style='height:300px; width:800px; padding:5%; background-color:white; overflow:scroll;'>"
        let content = read_file(select_val)
        //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
        sim_pane_content_id.innerHTML = div_html + content + "</div>"
    }
    else {
        warning("Could not find file: " + select_val + "<br/>to show in the Misc pane.")
        misc_pane_menu_id.value = prev_val  //reset to what it was before the person chose the item, which we know is good
        return
    }
    } //end try
    catch(err){
        warning("Could not load: " + select_val  + "<br/>into the Misc pane.")
        misc_pane_menu_id.value = prev_val  //reset to what it was before the person chose the item, which we know is good
        return
    }
    if(select_val !== prev_val){
        if(select_val_started_as_choose_file) {
            persistent_set("misc_pane_content", "Choose File")
        }
        else {
            persistent_set("misc_pane_content", select_val)
        }
    }
    if(select_val_started_as_choose_file && (select_val !== "") && (select_val !== undefined)){
        persistent_set("misc_pane_choose_file_path", select_val)
    }

}

function refresh_job_or_robot_to_simulate_id(){
    if(window["job_or_robot_to_simulate_id"]){
        let options_html = "<option>All</option>\n<option>Dexter.default</option>"
        for(let job of Job.all_jobs()){
            options_html += "<option>Job." + job.name + "</option>\n"
        }
        //for(let robot_name of Dexter.all_names){
        //    options_html += "<option>Dexter." + robot_name + "</option>\n"
        //}
        job_or_robot_to_simulate_id.innerHTML = options_html
    }
}
//returns a string
function job_or_robot_to_simulate_name(){
    if(job_or_robot_to_simulate_id.value) {
        return job_or_robot_to_simulate_id.value
    }
    else { return "Dexter.default" }
}

var {replace_substrings} = require("./core/utils.js")
