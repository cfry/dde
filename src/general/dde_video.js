//https://developers.google.com/youtube/iframe_api_reference
  /* this code failed on chrome app due to security restrictions,
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
import * as THREE from 'three'
//import THREE_GLTFLoader from 'three-gltf-loader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//import OrbitControls    from 'three-orbitcontrols'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import {STLLoader}      from 'three-stl-loader' //(THREE)
//import * as FBXLoader from 'three-fbx-loader' //todo dde4 errors with
   //FBXLoader is not defined while loading node_modules/three-fbx-loader.index.js

class DDEVideo {
    static clear_out_sim_graphics_pane_id(){
        if(globalThis.sim_graphics_pane_id){
            var new_element = sim_graphics_pane_id.cloneNode(false);
            sim_graphics_pane_id.parentNode.replaceChild(new_element, sim_graphics_pane_id)
        }
    }

    static prev_make_instruction_src = undefined
    static init_sim_in_process = false
//choose_file_path matters if select_val == "Choose File", and is only passed in
//when initing DDE/ It is the full file path of the file to be shown
//see ready.js $('#misc_pane_menu_id').on('select' ...)

//Use the below global var for "reading" the misc_pane_menu_label and
//the function for setting it.
//neigher of these are good for DDE users, they're system level.
//Users should use: show_in_misc_pane
    static misc_pane_menu_selection //workaround for $("#misc_pane_menu_id").jqxComboBox('val') jqxwidget bug
    //this does NOT do the action of the selection, just changes the text shown in the menu.

    static set_misc_pane_menu_selection(label){
        this.misc_pane_menu_selection = label
        $('#misc_pane_menu_id').jqxComboBox('val', label)
    }

    //in code below' don't use "this'.
    static show_in_misc_pane(content, arg1 = "", arg2){
    //if Choose File is called from outside dialog, and user cancels, we don't want to
    //change the combo_box value OR persistent save it.
    //But if user doesn't cancel, we DO want to change the combo box value, and,
    //if the value is good, persistent save it.
        if (content === "Choose File") {
            content = choose_file() //will be undefined if user cancels the dialog box.
            if(content) {
                $("#misc_pane_menu_id").jqxComboBox('unselectItem', "Choose File") //must do!
               // just let it fall through ////old: return show_in_misc_pane(content) //$('#misc_pane_menu_id').jqxComboBox('val', content) //causes show_in_misc_pane to be called with the chosen value
                DDEVideo.set_misc_pane_menu_selection(content)

            }
            else { //user canceled from choose file dialog so don't persistent-save the value.
                //leave combo_box val at "choose file" which won't match content, but we might
                // not want to "refresh" the content, and since that always happens
                //if we did $('#misc_pane_menu_id').jqxComboBox('val', the_prev_val),
                //just leave it as "Choose File"
                let prev_val = DDE_DB.persistent_get("misc_pane_content")
                DDEVideo.set_misc_pane_menu_selection(prev_val)
                return
            }
        }
        //let orig_content = $('#misc_pane_menu_id').jqxComboBox('val') //warning: this doesn't always get the
        //content showing in the combo box. Bug in jqxwidgets. So just always set it.
        if(content !== DDEVideo.misc_pane_menu_selection) {
            let label = content
            if((typeof(content) === "string") && content.startsWith("<")) {
                label = "HTML"
            }
            DDEVideo.set_misc_pane_menu_selection(label)
        }
            //$('#misc_pane_menu_id').jqxComboBox('val', content) //this will cause combon box's onchange event, defined in ready.js to call show_in_misc_pane again,
            // but this new time, content WILL equal what's in the combo-box val so tis clause doesn't hit
           // setTimeout(function() {
           //     show_in_misc_pane(content)
           // }, 100)
           //return //note that calling $("#misc_pane_menu_id").jqxComboBox('val', content), will cause
                  //show_in_misc_pane to be called again due to the combo box's on select.

        if(MakeInstruction.is_shown()) { //so that in case this or some later call to show_in_misc_pane
                                         // is "Make Instruction", we know what content to fill it with
            DDEVideo.prev_make_instruction_src = MakeInstruction.dialog_to_instruction_src()
        }
        let content_is_good = false //presume bad until proven otherwise, esp because some of the time we don't find out
        // if it's bad until after a callback, and we don't want to save a bad value.
        // we'd rather leave the prev good value in the persistent save.
        if(content instanceof HTMLElement){
            sim_pane_content_id.innerHTML = ""
            let content_copy = content.cloneNode(true) //true means copy all children on down.
                //must copy because otherwise content is removed from its original place and put here,
                //but we want to leave it in its button_column for example.
            sim_pane_content_id.appendChild(content_copy)
            return
            //do not attempt to save the elt persistently. We just don't return to this if we launch dde.
        }
        //content = content.replaceAll(content, "__dirname", __dirname)//dde4 todo comment in once file system works
        if((content == "Simulate Dexter") && DDEVideo.init_sim_in_process){
            return
        }
        else {
            DDEVideo.init_sim_in_process = false
        }
        try {
        if (content === "Simulate Dexter") {
            DDEVideo.init_sim_in_process = true
                sim_pane_content_id.innerHTML = Simulate.make_sim_html();
                //    '<div style="white-space:nowrap;"> ' + //Simulate Job/Robot: <select id="job_or_robot_to_simulate_id">' +
                //     '<b>Move Dur: </b><span id="sim_pane_move_dur_id"></span> s' +
                //     ' <button onclick="SimBuild.init()">Load SimBuild</button> ' +
                //     '<span title="Inspect simulator Details." ' +
                //     'onclick="SimUtils.inspect_dexter_sim_instance()" ' +
                //     'style="margin-left:15px;color:blue;cursor:pointer;font-weight:bold;"> &#9432; </span> ' +
                //     '</div>' +

                //     '<b title="X position of end effector in meters.">X: </b><span id="sim_pane_x_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
                //     '<b title="Y position of end effector in meters."> Y: </b><span id="sim_pane_y_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
                //     '<b title="Z position of end effector in meters."> Z: </b><span id="sim_pane_z_id" style="min-width:50px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;

                //     '<div style="white-space:nowrap;">' +
                //     '<b title="Joint 1 angle in degrees."> J1: </b><span id="sim_pane_j1_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +  //"margin-left:5px;
                //     '<b title="Joint 2 angle in degrees."> J2: </b><span id="sim_pane_j2_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
                //     '<b title="Joint 3 angle in degrees."> J3: </b><span id="sim_pane_j3_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
                //     '<b title="Joint 4 angle in degrees."> J4: </b><span id="sim_pane_j4_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
                //     '<b title="Joint 5 angle in degrees."> J5: </b><span id="sim_pane_j5_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
                //     '<b title="Joint 6 angle in degrees."> J6: </b><span id="sim_pane_j6_id" style="min-width:30px; text-align:left; display:inline-block"></span>' +
                //     '<b title="Joint 7 angle in degrees."> J7: </b><span id="sim_pane_j7_id" style="min-width:30px; text-align:left; display:inline-block"></span></div>' +
                //     '<div id="sim_graphics_pane_id"></div>'
                setTimeout(function () { //I did this timeout because once I saw this break during init giving us an error and causing the simulator pane not to render.
                    DocCode.open_doc(simulate_pane_doc_id)
                }, 200)
                Simulate.init_simulation()
                //sim.renderer.render(sim.scene, sim.camera);
                setTimeout(function() {
                             SimUtils.render_multi_with_prev_args_maybe()},
                           100)
           //}
            content_is_good = true
        }
        else if (content === "create_dexter_marker"){
            sim_pane_content_id.innerHTML ='<div id="sim_graphics_pane_id"></div>'
            Simulate.init_simulation()
            let xyz = arg1
            let rotzyz = (arg2 ? arg2 : [0, 0, 0])
            Simulate.create_marker_mesh(xyz, rotzyz)
            Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
            //SimUtils.render_once_with_prev_args_maybe()
            content_is_good = true
        }
        else if(content === "Dexter Photo"){
            let file_name = "./doc/HD+Robotics-8517.jpg"
                    //"../doc/HD+Robotics-8517.jpg"
                    //__dirname +
                    //"/general/doc/HD+Robotics-8517.jpg" //Dexter and Kent
            sim_pane_content_id.innerHTML = "<img src='" + file_name + "' style='width:100%;'/>"
            content_is_good = true
        }
        else if(content === "Dexter Architecture"){
            let file_name = "./doc/dexter_architecture.jpg"
            sim_pane_content_id.innerHTML = "<img src='" + file_name + "' style='width:100%;'/>"
            content_is_good = true
        }
        else if (content === "Reference Manual"){
            sim_pane_content_id.innerHTML = reference_manual_id.outerHTML
            content_is_good = true
        }
        else if (content === "Make Instruction"){
            let src = ((arg1 === "") ? DDEVideo.prev_make_instruction_src : arg1)
                               //instr, show_doc, set_misc_pane_menu_label
            MakeInstruction.show(src,   true,     false) //if arg value is undefined, show the default move_all_joints, otherwise, its previous state
                  //must pass set_misc_pane_menu_label as false or will get infinite loop.
            DocCode.open_doc(make_instruction_pane_doc_id)
            content_is_good = true
        }
        else if (content === "Haddington Website"){ //Will work for https:// ...
            content = "<iframe src='http://www.hdrobotic.com' width='100%' height='100%'/>" //no way to catch an error like 404 here due to security restrictions.
            sim_pane_content_id.innerHTML = content
            content_is_good = true
        }
        else if (content === "Reward Board"){
            sim_pane_content_id.innerHTML = Metrics.make_html()
            content_is_good = true
        }
        else if (content.startsWith("http")){ //Will work for https:// ...
                // Put before extension checking because of http://foo.jpg could be displayed if http checking before extension checking
            content = "<iframe src='" + content + "' width='100%' height='100%'/>" //no way to catch an error like 404 here due to security restrictions.
            sim_pane_content_id.innerHTML = content
            //might error with file not found or can't use content, so don't persist the url just in case.
        }

        else if (content.endsWith(".stl")){
            if(file_exists(content)){
                sim_pane_content_id.innerHTML = '<div id="sim_graphics_pane_id"></div>'

                //from: init_simulation()
                let the_scene = new THREE.Scene();
                the_scene.name = "scene"
                the_scene.background = new THREE.Color( 0x000000 ) // 0x000000black is the default
                    //from createRenderer
                    let the_renderer = new THREE.WebGLRenderer({ antialias:true });//antialias helps with drawing the table lines. //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
                    the_renderer.setSize( //sim.container.clientWidth, sim.container.clientHeight) //causes no canvas to appear
                        globalThis.innerWidth, globalThis.innerHeight );
                    //renderer.setPixelRatio( globalThis.devicePixelRatio );  //causes no canvas to appear
                    //sim_graphics_pane_id.innerHTML = "" //done in video.js
                    //sim.renderer.shadowMap.enabled = true;
                    sim_pane_content_id.appendChild(the_renderer.domElement)
                    //createCamera() //sets sim.camera
                    //let the_camera = sim.camera
                    var the_camera = new THREE.PerspectiveCamera( 10, 2, 0.01, 100 );
                    var the_controls = new OrbitControls( the_camera, the_renderer.domElement );
                    the_controls.target.set(0, 0, 0)  //orientation of cam. what its looking at.
                    the_camera.position.set( 2.5, 3.3, 5.2);

                    the_controls.update();
                //clear_out_sim_graphics_pane_id()
                //Simulate.stl_init_viewer()
                function animate() {
                    requestAnimationFrame( animate );
                    // r equired if controls.enableDamping or controls.autoRotate are set to true
                    the_controls.update();
                    the_renderer.render( the_scene, the_camera );
                }
                var loader = new STLLoader()
                loader.load(content, function (geometry) {
                    var material = new THREE.MeshNormalMaterial()
                    var mesh = new THREE.Mesh(geometry, material)
                    mesh.scale.set(0.001, 0.001, 0.001)
                    mesh.name = content
                    the_scene.add(mesh)
                    //the_renderer.render(sim.scene, sim.camera)
                    animate()
                })
                /*let geometryt    = new THREE.BoxGeometry(1, 1, 1);
                let materialt    = new THREE.MeshNormalMaterial({});
                let mesh         = new THREE.Mesh(geometryt, materialt)
                the_scene.add(mesh)

                // from https://threejs.org/docs/#examples/en/controls/OrbitControls

                animate()*/
                content_is_good = true
            }
            else {
                warning("Could not find file: " + content)
            }
        }
        else if (content.endsWith(".fbx")){
            DDEVideo.clear_out_sim_graphics_pane_id()
            Simulate.stl_init_viewer()
            // from https://github.com/ckddbs/three-fbx-loader/commit/b3bc39bef2a4253abf2acc780870a03f5f9cd510
            let loader = new FBXLoader()
            //loader.load(content, function (object) { Simulate.sim.scene.add(object)})
            loader.load(content,
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
                                    Simulate.sim.scene.add(child)
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
        else if (content.endsWith(".gltf")){
    //      clear_out_sim_graphics_pane_id()
    //      Simulate.stl_init_viewer()
            // from https://github.com/ckddbs/three-fbx-loader/commit/b3bc39bef2a4253abf2acc780870a03f5f9cd510
            //https://threejs.org/docs/#examples/en/loaders/GLTFLoader
            var loader = new GLTFLoader()

            function chainLink ( children, i ) {
                //	The  previous link (base if i is 0).
                let linkPrv = children[i-1];
                let Lprv = new THREE.Matrix4();
                Lprv.copy ( linkPrv.matrix );

                let nLprv = new THREE.Matrix4();
                nLprv.copy( Lprv ).invert(); //was nLprv.getInverse ( Lprv );

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

            loader.load(content,
                function (gltf) {
    //              Simulate.sim.scene.add(gltf.scene)
                    let root = gltf.scene;
                    let c0 = root.children[0]
                    c0.scale.set(0.001, 0.001, 0.001);
                    //	Remove imported lights, cameras. Just want Object3D.
                    let objs = [];
                    c0.children.forEach ( c => {
                        if ( c.constructor.name === 'Object3D' ) {
                            objs.push(c); } } );
                    c0.children = objs;
                //	Simulate.sim.scene.add(root)
                    Simulate.sim.table.add(root)

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
        else if (content.endsWith(".jpg") ||
                 content.endsWith(".png") ||
                 content.endsWith(".gif") ||
                 content.endsWith(".bmp") ||
                 content.endsWith(".svg")
        ){
            let div_html = "<img style='width:100%;' src='" + content + "'/>"
            sim_pane_content_id.innerHTML = div_html
            content_is_good = true

        }
        else if (content.endsWith(".txt")  ||
                 content.endsWith(".js")   ||
                 content.endsWith(".json") ||
                 content.endsWith(".dde")){
            if(globalThis.file_exists && file_exists(content)){
                let div_html =
                  "<div contenteditable='false' style='height:300px; width:800px; padding:5%; background-color:white; overflow:scroll;'>"

                content = read_file(content)
                content = content.replaceAll("<", "&lt;")
                //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
                sim_pane_content_id.innerHTML = div_html + "<pre>" + content + "</pre></div>"
                content_is_good = true
            }
            else {
                warning("Could not find file: " + content + "<br/>to show in the Misc pane.")
            }
        }

        else if(globalThis.file_exists && file_exists(content)) { //content could be: (content.endsWith(".html") || content.endsWith(".htm") ||
             //some random other file that hopefully can be displayed as html.
             //but if we get an error, the below catch will catch it.
            let div_html =
                "<div contenteditable='false' style='height:300px; width:800px; padding:5%; background-color:white; overflow:scroll;'>"
            content = read_file(content)
            //sim_graphics_pane_id.style = "width:97%; height:90%; padding:5%; background-color:white; overflow:scroll !important;"
            sim_pane_content_id.innerHTML = div_html + content + "</div>"
            content_is_good = true //questionable, but maybe ok
        }
        //display any old html.
        else if((typeof(content) === "string") && content.startsWith("<")){
            sim_pane_content_id.innerHTML = content
        }
        else {
            warning("Could not find file: " + content + "<br/>to show in the Misc pane.")
            return
        }
        } //end try
        catch(err){
            warning("Could not load: " + content  +
                    "<br/>into the Misc pane because: " + err.message)
            content_is_good = false
        }
        if(content_is_good){
            DDE_DB.persistent_set("misc_pane_content", content)
        }
    }

//////// toggle_misc_pane_size
    static orig_left_splitter_pane_size = null //init on startup
    static orig_top_splitter_pane_size  = null
    static misc_pane_should_increase    = null

//the top level fn. determines if we are to grow or to shrink misc_pane.
//referenced by on_ready
    static toggle_misc_pane_size(){
        if(!DDEVideo.orig_left_splitter_pane_size){
            DDEVideo.orig_left_splitter_pane_size = //global var
                $('#outer_splitter_id').jqxSplitter('panels')[0].size
            DDEVideo.orig_top_splitter_pane_size = //global var
                $('#right_splitter_id').jqxSplitter('panels')[0].size
            DDEVideo.misc_pane_should_increase = true //global var
        }
        if (DDEVideo.misc_pane_should_increase) { DDEVideo.increase_misc_pane_size() }
        else  {  DDEVideo.decrease_misc_pane_size() }
    }

    //use DDEVideo instead of "this" below as this fn is called recursively
    //perhaps withot the correct subject.
    static increase_misc_pane_size(){
        let left_width = $('#outer_splitter_id').jqxSplitter('panels')[0].size //the width of the Editor & output pane
        let top_width  = $('#right_splitter_id').jqxSplitter('panels')[0].size //the height of the Doc pane
        let keep_going = false
        if(left_width > 0) {
            let new_size = (DDE_DB.persistent_get("animate_ui") ? left_width - 6 : 0)
            $('#outer_splitter_id').jqxSplitter({panels: [{ size: new_size}]})
            keep_going = true
        }
        if(top_width > 0) {
            let new_size = (DDE_DB.persistent_get("animate_ui") ? top_width - 2 : 0)
            $('#right_splitter_id').jqxSplitter({panels: [{ size: new_size}]})
            keep_going = true
        }
        if(keep_going){
            setTimeout(DDEVideo.increase_misc_pane_size, 3)
        }
        else { //we're done
            DDEVideo.misc_pane_should_increase = false //next time we toggle, shrink
            console.log("done with increase. now misc_pane_should_increase: " + DDEVideo.misc_pane_should_increase)
        }
    }

    static decrease_misc_pane_size(){
        console.log("top of decrease_misc_pane_size")
        let left_width = $('#outer_splitter_id').jqxSplitter('panels')[0].size
        let top_width  = $('#right_splitter_id').jqxSplitter('panels')[0].size
        let keep_going = false
        if(left_width < DDEVideo.orig_left_splitter_pane_size) {
            let new_size = (DDE_DB.persistent_get("animate_ui") ? left_width + 6 : DDEVideo.orig_left_splitter_pane_size)
            $('#outer_splitter_id').jqxSplitter({panels: [{ size: new_size}]})
            keep_going = true
        }
        if(top_width < DDEVideo.orig_top_splitter_pane_size) {
            let new_size = (DDE_DB.persistent_get("animate_ui") ? top_width + 2 : DDEVideo.orig_top_splitter_pane_size)
            $('#right_splitter_id').jqxSplitter({panels: [{ size: new_size}]})
            keep_going = true
        }
        if(keep_going){
            setTimeout(DDEVideo.decrease_misc_pane_size, 4)
        }
        else { //we're done
            DDEVideo.misc_pane_should_increase = true //next time we toggle, shrink
            DDEVideo.orig_left_splitter_pane_size = null //and reset the min size for when we shrink after that

        }
    }
} //end DDEVideo class

globalThis.DDEVideo = DDEVideo
