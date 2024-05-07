/**
 * Created by Fry on 10/29/15.
 */
/*
from http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene
    http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/ //kinda complex weather app that uses the web but very good for tutorial info
        http://complexity.zone/cardboard_solarsystem/ //augmented reality usjing threejs and your phone's camera to mix palents and your reality.
            ttrhejs tutorial: http://content.udacity-data.com/cs291/notes/UdacityLesson6Lights.pdf

Threejs and webxr
https://www.youtube.com/watch?v=smvF0seF4XE  useless.
references a mozilla Hello world app.
https://mixedreality.mozilla.org/hello-webxr   but goes to a bad page.

maybe: https://www.youtube.com/watch?v=slU0qKhegvk threejs and webxr

*/

console.log("is it building?")

//import * as THREE from '../../node_modules/three/build/three.module.js'
//import * as THREE from 'three/build/three.module.js'
import * as THREE from 'three'
globalThis.THREE = THREE
import { InteractionManager } from 'three.interactive'; //to enable clicking on object3d's in sim pane. Fron nom pkg three.interative
//see https://github.com/markuslerner/THREE.Interactive
globalThis.InteractionManager
// globalThis.interactionManager is inited below in the "init" method.


import { FontLoader } from 'three/addons/loaders/FontLoader.js'
const a_font_loader = new FontLoader();
//globalThis.hel_font = null
a_font_loader.load(//'node_modules/three/examples/fonts/helvetiker_bold.typeface.json', //THREE doc on this path is woefully insufficient. I patterned this after https://www.youtube.com/watch?v=l7K9AMnesJQ Without "node_modules/" on the front, it doesn't work
                   './third_party/helvetiker_bold.typeface.json',
                   //'../../third_party/helvetiker_bold.typeface',
                   //'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', //todo make this not depend on a web connection
    function(font) {
           globalThis.hel_font = font
       }
)

//import THREE_Text2D from 'three-text2d'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//import THREE_GLTFLoader from 'three-gltf-loader' //using the examples folder like this is depricated three/examples/js/loaders/GLTFLoader.js')
//see: https://github.com/johh/three-gltf-loader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//From https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content
import { VRButton } from 'three/addons/webxr/VRButton.js'; //VR  search this file for "//VR" to see all Virtual Reality code


globalThis.Simulate = class Simulate {
    // Creates an div containing the simulator and it's UI
    // This can be appended and removed from the main DOM while still remain intact
    // This allows the simulator to be hidden and shown without it being reinitiallized
    // NOTE: DO NOT RUN THIS OUTSIDE OF simulate.js! IT SHOULD ONLY EVER RUN ONCE DURING INIT!
    static make_sim_ui() {
        //Creates a template which the HTML is placed inside of

        let sim_div = document.createElement("div");
        sim_div.style="margin:0";
        sim_div.innerHTML =
        `
        <div id="sim_pane_header_top_row_id" style="white-space:nowrap;"> 
        <b>Move Dur: </b><span id="sim_pane_move_dur_id"></span> s
        <button onclick="SimUtils.render_joints_smart()" 
            title="Grab the joint angles from the selection&#13;and change the simulator to show them.&#13;Works on arrays, comma separated arg lists,&#13;and whole instruction calls.&#13;With 3 numbers, treats them as XYZ if they are in range.">
            Render selected joints</button>
        <button onclick="SimBuild.show_dialog()" title="Make additional 3D objects in the Simulator pane.">SimBuild</button>
        <span title="Inspect simulator Details." 
        onclick="SimUtils.inspect_dexter_sim_instance()" 
        style="margin-left:5px;color:blue;cursor:help;font-weight:bold;"> &#9432; </span>       
        
        
        </div>
        <div id="sim_pane_header_alignment_id" style="white-space:nowrap;">
        <b title="X position of end effector in meters.">X: </b><span id="sim_pane_x_id" style="min-width:50px; text-align:left; display:inline-block"></span>
        <b title="Y position of end effector in meters."> Y: </b><span id="sim_pane_y_id" style="min-width:50px; text-align:left; display:inline-block"></span>
        <b title="Z position of end effector in meters."> Z: </b><span id="sim_pane_z_id" style="min-width:50px; text-align:left; display:inline-block"></span>
        Alignment: <button onclick="Simulate.align_cam(0)">X-Side</button> 
        <button onclick="Simulate.align_cam(1)">Y-Side</button> 
        <button onclick="Simulate.align_cam(2)">Z-Top</button> 
        <button onclick="Simulate.align_cam(3)">Home</button> 
        </div>
       
        <div style="white-space:nowrap;">
        <b title="Joint 1 angle in degrees."> J1: </b><span id="sim_pane_j1_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 2 angle in degrees."> J2: </b><span id="sim_pane_j2_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 3 angle in degrees."> J3: </b><span id="sim_pane_j3_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 4 angle in degrees."> J4: </b><span id="sim_pane_j4_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 5 angle in degrees."> J5: </b><span id="sim_pane_j5_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 6 angle in degrees."> J6: </b><span id="sim_pane_j6_id" style="min-width:30px; text-align:left; display:inline-block"></span>
        <b title="Joint 7 angle in degrees."> J7: </b><span id="sim_pane_j7_id" style="min-width:30px; text-align:left; display:inline-block"></span></div>
        <div id="sim_graphics_pane_id" style="cursor:grab;"></div>
        `;
        
        return sim_div;
    }

    static canSize;
    static goalRotation = {x:Math.PI*0.25,y:Math.PI*0.25};
    static goalPosition = {x:0,y:0,z:-1};
    static pRotation = {x:Math.PI*0.25,y:Math.PI*0.25};
    static pPosition = {x:0,y:0,z:-1};

    static sim = {} //used to store sim "global" vars

    static simulatorUI;

//var THREE_font_loader = new THREE.FontLoader();
    static simulation_initialized = false;
    static update_in_progress = false;
    // static init_simulation_done = false

    // static init_simulation_maybe(){
    //     if(this.init_simulation_done) {}
    //     else {
    //         this.init_simulation_done = true //needs to be done first as if init_simulation has already started we don't
    //          //dont want to start it again.
    //         this.init_simulation()

    //     }
    // }
    /*
    Returns an documentation fragment containing the simulator which can be appended to the DOM directly with appendChild
    If the simulator has not yet been initialized, this will initialize the simulator
    It the simulator has been initialized already, this will resize the viewport to the correct size
     */
    static append_simulation(pane_id)
    {
        if(!this.update_in_progress)
        {
            this.update_in_progress = true;
            // Create the UI if the simulator hasn't yet been initialized
            if(!this.simulation_initialized)
            {
                this.simulatorUI  = this.make_sim_ui();
            }
    
            // Append the simulator to the pane
            pane_id.innerHTML = "";
            pane_id.appendChild(this.simulatorUI);
    
            //Initialize the simulator if it has not been initialized already
            if(!this.simulation_initialized)
            {
                this.init_simulation();
                this.simulation_initialized = true;
            }
            else
            {
                this.resize();
            }
            this.update_in_progress = false;
        }
    }

    static init_simulation(){
        if(!this.simulation_initialized)
        {
            this.updateCanSize();
            try{
                this.init_mouse()
                this.sim.enable_rendering = false
                //for organization: https://discoverthreejs.com/book/first-steps/lights-color-action/
                this.sim.container = sim_graphics_pane_id //a div that contains a canvas
                this.sim.scene  = new THREE.Scene();
                this.sim.scene.name = "scene"
                this.sim.scene.background = new THREE.Color(0xFFF5E0) //0xFFF6C7) //0xFFFFFF) //0xBBBBBB ) // 0x000000black is the default
                this.createRenderer()
                this.createCamera()
                this.createLights()
                this.createMeshGLTF() 

                SimBuild.init()
                this.init_interaction_manager()
                SimObj.refresh() //does nothing if no SimObjs. Otherwise makes sure they are in the scene and refreshes
            }
            catch(err){
                    console.log("init_simulation errored with: " + err.message + "\n" + err.stack)
            }

            //this.sim.renderer.render(this.sim.scene, this.sim.camera) //Sadly this didn't work so
            // stil doing BOTH the below setAnimationLoop and inSimqueueJ  SimUtils, calling prime the pump to avoid bad rednering of Dexter

            //from https://threejs.org/docs/index.html#manual/en/introduction/How-to-create-VR-content
            this.sim.renderer.setAnimationLoop( function () { //VR
                //Simulate.sim.renderer.render( Simulate.sim.scene, Simulate.sim.camera );
                Simulate.do_animation_loop()
            } )
        }
        else
        {
            console.warn("Warning: Simulation attempt was made after the simulator was initialized");
            debugger;
        }
        
    }

    //called by SimObj.refresh() and Simulate.init()
    static init_interaction_manager(){
        if(globalThis.interactionManager) {
            globalThis.interactionManager.dispose()
            globalThis.interactionManager = undefined
        }
        //see https://github.com/markuslerner/THREE.Interactive/blob/master/examples/auto-add.html
        globalThis.interactionManager = new InteractionManager(
            this.sim.renderer,
            this.sim.camera,
            this.sim.renderer.domElement
            //{ autoAdd: true, scene: this.sim.scene} //autoAdd seems not to word
        )
    }

    static createCamera(){
        //https://discoverthreejs.com/book/first-steps/first-scene/
        this.sim.camera = new THREE.PerspectiveCamera(
              75, //field of view in degrees. determines ratio of far clipping region is to near clipping region
            this.canSize.width / this.canSize.height, //aspect ratio, If not same as canvas width and height,
                                                      //the image will be distorted.
              0.1, //1, //0.1,   //distance between camera and near clipping plane. Must be > 0.
              4 //4      // 3 is too small and clips the table. was: 1000   //distance between camera an far clipping plane. Must be > near.
              );
        this.sim.camera.name = "camera"
        this.sim.camera.position.x = 0  //to the right of the screen.
        this.sim.camera.position.y = 0  //up is positive
        this.sim.camera.position.z = 1  //2; //toward the viewer (out of the screen) is positive. 2
        this.sim.camera.zoom = 1        //1 is the default.  0.79 //has no effect.

        //new(75, width/height, 0.1, 4) pos[0, 1, 2]

        //camera.position.set( -15, 10, 15 );
        //camera.lookAt( scene.position );
    }

    static createLights(){
              /* doesn't do anything //var light = new THREE.PointLight( 0xFFFF00 );
       var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
       light.position.set( 10, 10, 10 );
       scene.add( light );
       */
    //renderer.setClearColor( 0xdddddd, 1); //makes a gray background color instead of black
      //from Brad, App.js
      //ambient light
        const color = 0xFFFFFF;
        const intensity = 1 //0.75;
        const light = new THREE.AmbientLight ( color, intensity );
        this.sim.scene.add ( light );

      //directional light
        const dcolor = 0xFFFFFF;
        const dintensity = 1 //0.5;
        //	const intensity = 0.35;		//	To see the helpers easier.
        const dlight = new THREE.DirectionalLight ( dcolor, dintensity );
        dlight.position.set ( 4, 4, 2 );
        dlight.target.name = "directional_light_target"
        dlight.target.position.set ( 0, 0, 0 );
        dlight.castShadow = true;
        this.sim.scene.add ( dlight );
        this.sim.scene.add ( dlight.target );

        dlight.shadow.camera.left	= -1.5;
        dlight.shadow.camera.right	=  1.5;
        dlight.shadow.camera.top	=  1.5;
        dlight.shadow.camera.bottom	= -1.5;
    /* Brad's version aug 22, 2020  semantically the same as above except fry has
        dlight.castShadow = true;
        and the extra 4 last lines of "dlight.shadow.camera.left	= -1.5;" , etc.
        /
        //	Ambient Light
        //
        {	const color = 0xFFFFFF;
            const intensity = 0.75;
            const light = new THREE.AmbientLight ( color, intensity );
            this.sim.scene.add ( light ); }

        //	Directional Light
        //
        { 	const color = 0xFFFFFF;
            const intensity = 0.5;
            const light = new THREE.DirectionalLight ( color, intensity );
            light.position.set ( 4, 4, 2 );
            light.target.position.set ( 0, 0, 0 );
        //	light.castShadow = true;
            this.sim.scene.add ( light );
            this.sim.scene.add ( light.target ); }
    */
    }

    static VR_but_dom_elt

    static createRenderer(){
        this.sim.renderer = new THREE.WebGLRenderer({ antialias:true });//antialias helps with drawing the table lines. //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
        this.sim.renderer.setSize( //this.sim.container.clientWidth, this.sim.container.clientHeight) //causes no canvas to appear
        this.canSize.width, this.canSize.height);
        //renderer.setPixelRatio( globalThis.devicePixelRatio );  //causes no canvas to appear
        //sim_graphics_pane_id.innerHTML = "" //done in video.js
        this.sim.renderer.shadowMap.enabled = true;
        this.sim.container.appendChild(this.sim.renderer.domElement)
        this.VR_but_dom_elt = VRButton.createButton( this.sim.renderer )  //VR makes global dom elt "VRButton" odd. the orig class VRButton var is over-ridden??? Don't depend on it!
        this.VR_but_dom_elt.style.backgroundColor = "#ffd6c2"
        this.VR_but_dom_elt.style.color = "black"
        // sim_pane_header_alignment_id.append(vr_but)           //VR //put right after the "Alignment: " buttons
        this.sim.container.append(this.VR_but_dom_elt)           //VR
        //sim_pane_move_dur_id.append(this.VR_but_dom_elt) //even if I try to place the button outside of the canvas, it does their anyway.
        //but not the button doesn't actually appear here. It appears IN the real sim rendering pane,
        //at the bottom in an "overlay" which will usually say, in a box,  "VR NOT SUPPORTED"
        this.sim.renderer.xr.enabled = true;                     //VR
        this.sim.renderer.xr.setReferenceSpaceType( 'local' );   //VR  from threejs.org webxr_vr_rollercoaster.html
        //this.init_vr()
    }

    static xrSession
    //from https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession
    //with fry mods
    static init_vr(){ //VR
        if (navigator.xr) {
            navigator.xr.isSessionSupported("immersive-vr").then((isSupported) => {
                if (isSupported) {
                    Simulate.VR_but_dom_elt.addEventListener("click", vr_onButtonClicked);
                    Simulate.VR_but_dom_elt.textContent = "Enter XR";
                    Simulate.VR_but_dom_elt.disabled = false;
                } else {
                    console.error("WebXR doesn't support immersive-vr mode!");
                }
            });
        } else {
            console.error("WebXR is not available!");
        }

        function vr_onButtonClicked() {
            if (!Simulate.xrSession) {
                navigator.xr.requestSession("immersive-vr").then((session) => { //requestSession creates the WEbXR session
                    Simulate.xrSession = session;
                    // onSessionStarted() not shown for reasons of brevity and clarity.
                    //onSessionStarted(Simulate.xrSession); //not defined
                });
            } else {
                // Button is a toggle button.
                Simulate.xrSession.end().then(() => (Simulate.xrSession = null));
            }
        }
    }

//simulator using actual Dexter CAD. the GLTF was created by using the
//fusion 360 exporter of FBX, then converting that to .gltf, then
//processing in video.js to clean it up.
    static createMeshGLTF(){
        this.sim.table_width  = 0.447675,  //width was 1
        this.sim.table_length = 0.6985,    //length was 2
        this.sim.table_height = 0.01905    //height (thickness of Dexcell surface). This is 3/4 of an inch. was:  0.1)
        this.sim.table = this.draw_table(this.sim.scene, this.sim.table_width, this.sim.table_length, this.sim.table_height)



        this.sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
        this.sim.J0.rotation.y = Math.PI //radians for 180 degrees
        this.sim.J0.name = "J0"
        this.sim.J0.position.y = (this.sim.table_height / 2) //+ (leg_height / 2) //0.06 //for orig boxes model, leg)height was positive, but for legless dexter mounted on table, its probably 0
        this.sim.J0.position.x = (this.sim.table_length / 2)  //the edge of the table
                                 //- 0.12425 the distance from the edge of the table that Dexter is placed
        this.sim.table.add(this.sim.J0)

        let loader = new GLTFLoader //THREE_GLTFLoader()
        console.log("cur file simulate.js: " + globalThis.location.pathname)
        loader.load(//__dirname + "/HDIMeterModel.gltf", //select_val, //fails
                    //"./HDIMeterModel.gltf", //fails
                    "simulator_server_files/HDIMeterModel.gltf",
                    function(gltf_object3D) { Simulate.fix_up_gltf_and_add(gltf_object3D) }, //modified for dde4
                    this.undefined,
                    function (err) {
                        console.error( err );
                    }
        )

    }

//copied from video_js with slight mods
    static fix_up_gltf_and_add(gltf_object3D) {
    //              this.sim.scene.add(gltf.scene)
        let root = gltf_object3D.scene;
        let c0 = root.children[0]
        c0.scale.set(0.001, 0.001, 0.001);
        //	Remove imported lights, cameras. Just want Object3D.
        let objs = [];
        c0.children.forEach ( c => {
            if ( c.constructor === THREE.Object3D //c instanceof THREE.Object3D //c.constructor.name === 'Object3D'
               ) {
                objs.push(c); } } );
        c0.children = objs;
        //	this.sim.scene.add(root)
        this.sim.J0.add(root) //fry added in J0 to shift dexter to back of the table.

        //	Set link parent-child relationships.
        //
        Simulate.do_animation_loop()

        //	Now link.
        this.chainLink ( objs[0].children, 7 );
        this.chainLink ( objs[0].children, 6 );
        this.chainLink ( objs[0].children, 5 );
        this.chainLink ( objs[0].children, 4 );
        this.chainLink ( objs[0].children, 3 );
        this.chainLink ( objs[0].children, 2 );
        this.chainLink ( objs[0].children, 1 );

        this.set_joints_in_sim()
    }

    //copied from video.js. for fixing gltf child-parent relationships.
    static chainLink ( children, i ) {
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
    }

    static set_joints_in_sim(){
        this.sim.LINK1 = this.sim.scene.getObjectByName("DexterHDI_MainPivot_KinematicAssembly_v21")
        this.sim.LINK2 = this.sim.scene.getObjectByName("DexterHDI_Link2_KinematicAssembly_v51")
        this.sim.LINK3 = this.sim.scene.getObjectByName("DexterHDI_Link3_KinematicAssembly_v21")
        this.sim.LINK4 = this.sim.scene.getObjectByName("DexterHDI_Link4_KinematicAssembly_v31")
        this.sim.LINK5 = this.sim.scene.getObjectByName("DexterHDI_Link5_KinematicAssembly_v21")
        this.sim.LINK6 = this.sim.scene.getObjectByName("DexterHDI_Link6_KinematicAssembly_v31")
        this.sim.LINK7 = this.sim.scene.getObjectByName("DexterHDI_Link7_KinematicAssembly_v21")

        this.sim.J1 = this.sim.LINK1
        this.sim.J2 = this.sim.LINK2
        this.sim.J3 = this.sim.LINK3
        this.sim.J4 = this.sim.LINK4
        this.sim.J5 = this.sim.LINK5
        this.sim.J6 = this.sim.LINK6
        this.sim.J7 = this.sim.LINK7
    }


    static do_animation_loop(){
        if (SimUtils.is_simulator_showing()) {
            if(globalThis.interactionManager) {
                interactionManager.update();
            }
            Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
        }
    }

    static sim_handle_mouse_move(){
        var mouseX_diff =  this.sim.mouseX - this.sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
        var mouseY_diff =  this.sim.mouseY - this.sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
        if (this.sim.shiftDown){
            //alert(camera.zoom)  //camera.zoom starts at 1
            var zoom_increment = mouseX_diff / 100.0
            this.sim.camera.zoom = this.sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
            this.sim.camera.updateProjectionMatrix()
        }
        else if (this.sim.altDown || (this.sim.button == 1)){
            var panX_inc = mouseX_diff / 100
            var panY_inc = mouseY_diff / 100
            this.sim.table.position.x =  this.sim.tableX_at_mouseDown + panX_inc
            this.sim.table.position.y =  this.sim.tableY_at_mouseDown - panY_inc
        }
        else {
            let newX = this.sim.rotationX_at_mouseDown + (mouseY_diff / 100);
            if(newX<=Math.PI*0.5&&newX>=-Math.PI*0.5)this.sim.table.rotation.x = newX;
            this.sim.table.rotation.y = this.sim.rotationY_at_mouseDown + (mouseX_diff / 100)
        }
    }



    //set up drag mouse to rotate table
    static init_mouse(){
        this.sim.mouseX_at_mouseDown    = 0
        this.sim.mouseY_at_mouseDown    = 0
        this.sim.tableX_at_mouseDown    = 0
        this.sim.tableY_at_mouseDown    = 0
        this.sim.zoom_at_mouseDown      = 1
        this.sim.rotationX_at_mouseDown = 0
        this.sim.rotationY_at_mouseDown = 0

        sim_graphics_pane_id.addEventListener("mousedown", function(event) {
            //must use Simulate, not "this" for referncing "sim".
            Simulate.sim.button = event.button
            Simulate.sim.mouseDown              = true
            Simulate.sim.shiftDown              = event.shiftKey
            Simulate.sim.altDown                = event.altKey
            Simulate.sim.mouseX_at_mouseDown    = event.clientX
            Simulate.sim.mouseY_at_mouseDown    = event.clientY
            Simulate.sim.tableX_at_mouseDown    = Simulate.sim.table.position.x
            Simulate.sim.tableY_at_mouseDown    = Simulate.sim.table.position.y
            Simulate.sim.zoom_at_mouseDown      = Simulate.sim.camera.zoom
            Simulate.sim.rotationX_at_mouseDown = Simulate.sim.table.rotation.x
            Simulate.sim.rotationY_at_mouseDown = Simulate.sim.table.rotation.y
        }, false);

        sim_graphics_pane_id.addEventListener('mousemove', function(event) {
            //must use Simulate, not "this" for referncing "sim".
            if (Simulate.sim.mouseDown){
                Simulate.sim.mouseX = event.clientX;
                Simulate.sim.mouseY = event.clientY;
                Simulate.sim_handle_mouse_move()
                //Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
            }
        }, false);

        sim_graphics_pane_id.addEventListener("mouseup", function(event) {
            Simulate.sim.mouseDown = false
            Simulate.sim.shiftDown = false
            Simulate.sim.altDown   = false
        }, false);
    }

    static draw_table(parent, table_width, table_length, table_height){
        var geometryt    = new THREE.BoxGeometry(table_length, table_height, table_width);
        var materialt    = new THREE.MeshPhongMaterial( { color: 0xFFFFFF} ); //normal material shows different color for each cube face, easier to see the 3d shape.
        this.sim.table   = new THREE.Mesh(geometryt, materialt)
        this.sim.table.name = "table"
        this.sim.table.receiveShadow = true;

        this.sim.table.position.x = 0 //-3.85
        this.sim.table.position.y = 0 //2.47
        this.sim.table.position.z = -1 //0

        this.sim.table.rotation.x = Math.PI*0.25 //0 //0.53
        this.sim.table.rotation.y = Math.PI*0.25 //5 shows table with +x to right, and +y away from camera. 1.8 //0 //-0.44
        this.sim.table.rotation.z = 0
        parent.add(this.sim.table)

        //draw lines on table
        var sizew = table_width
        let step = 0.05 //dexcell holes are 0.25 apart and 0,0 is in the CENTER of one of the cells
                        // that has 4 holes as corners 0.2;
        var sizel = table_length
        var geometry = new THREE.BufferGeometry();
        var line_height = table_height //- 0.045
        let points = []
        for ( var i = - sizew / 2.0; i <= sizew / 2.0; i += step) {
            points.push(new THREE.Vector3(-sizel / 2.0, line_height, i));  //( - size, - 0.04, i ));
            points.push(new THREE.Vector3(sizel / 2.0, line_height, i));
        }
        for ( var i = - sizel / 2.0; i <= sizel / 2.0; i += step){
            points.push(new THREE.Vector3(i,  line_height,  -sizew / 2.0));  //( - size, - 0.04, i ));
            points.push(new THREE.Vector3(i , line_height, sizew / 2.0));
        }
        geometry.setFromPoints(points)

        var material = new THREE.LineBasicMaterial({color: 'gray'});
        var line = new THREE.LineSegments( geometry, material ); //new THREE.Line( geometry, material, THREE.LinePieces);
        line.name = "table_line_segments"
        this.sim.table.add(line);

        //let x_text_mesh = new THREE_Text2D.MeshText2D(">> +X", { align: THREE_Text2D.textAlign.left, font: '30px Arial', fillStyle: '#00FF00', antialias: true })
        if(globalThis.hel_font) { //protect against failure to load the font. Don't do the below if no font as it will error in the console, but rest of code will still run
            let text_geo
            let text_material
            let text_mesh

            //______X label______
            text_geo = new TextGeometry(">> +X", //, {font: globalThis.hel_font})
                {
                    font: hel_font,
                    size:  20, //100 is the default
                    height: 5 //50 is the default
                })
            text_geo.name = "x_axis_label"
            text_geo.scale(0.007, 0.007, 0.007) // = THREE.Vector3(0.1, 0.1, 0.1)
            text_geo.translate(0.22, //0.11,
                               -0.28, //0,    //0.055,
                               0     //-0.2
                               )
            text_geo.rotateX(0) //1.5708)
            text_geo.rotateY(1.5708)
            text_geo.rotateZ(1.5708)
            text_material = new THREE.MeshPhongMaterial()
            text_material.color.set("#00FF00")
            text_mesh = new THREE.Mesh(text_geo, text_material)
            //this.sim.table.add(x_text_mesh)
            this.sim.table.add(text_mesh)

        
            //______Y label______
            text_geo = new TextGeometry(">> +Y", //, {font: globalThis.hel_font})
                {  font: hel_font,
                    size:  20, //100 is the default
                    height: 5 //50 is the default
                })
            text_geo.name = "y_axis_label"
            text_material = new THREE.MeshPhongMaterial()
            text_material.color.set("#00FF00")
            text_mesh = new THREE.Mesh(text_geo, text_material)
            text_mesh.rotateX(1.5708) //0) //1.5708)
            text_mesh.rotateY(0) //1.5708)
            text_mesh.rotateZ(Math.PI)//1.5708)
            text_mesh.scale.x = 0.007
            text_mesh.scale.y = 0.007
            text_mesh.scale.z = 0.007
            text_mesh.translateX(0.4) //0.22) //0.11, //moves in dde y axis
            text_mesh.translateY(0) //-0.28, //0,    //0.055, //moves in dde x axis
            text_mesh.translateZ(0)//______Y label______
            this.sim.table.add(text_mesh)

            //________Z Label
            text_geo = new TextGeometry(">> +Z", //, {font: globalThis.hel_font})
                {  font: hel_font,
                    size:  20, //100 is the default
                    height: 5 //50 is the default
                })
            text_geo.name = "z_axis_label"
            text_material = new THREE.MeshPhongMaterial()
            text_material.color.set("#00FF00")
            text_mesh = new THREE.Mesh(text_geo, text_material)
            text_mesh.rotateX(-1.5708) //0) //dde y axis rotation 1.5708)
            text_mesh.rotateY(1.5708) //1.5708)0) //1.5708)
            text_mesh.rotateZ(-Math.PI)//1.5708)
            text_mesh.scale.x = 0.007
            text_mesh.scale.y = 0.007
            text_mesh.scale.z = 0.007
            text_mesh.translateX(0) //dde z axis 0.4) //0.22) //0.11, //moves in dde y axis
            text_mesh.translateY(0)   //dde x axis -0.8) //-0.28, //0,    //0.055, //moves in dde x axis
            text_mesh.translateZ(0.5) //dde y axis 0)
            this.sim.table.add(text_mesh)

        }

        return this.sim.table
    }

    static align_cam(position) {
        switch(position)
        {
            case(0):
                this.goalRotation.x = 0;
                this.goalRotation.y = Math.PI;
            break;

            case(1):
                this.goalRotation.x = 0;
                this.goalRotation.y = Math.PI*0.5;
            break;

            case(2):
                this.goalRotation.x = Math.PI*0.5;
                this.goalRotation.y = Math.PI*0.5;
            break;

            case(3):
                this.goalRotation.x = Math.PI*0.25;
                this.goalRotation.y = Math.PI*0.25;
                this.goalPosition.x = 0;
                this.goalPosition.y = 0;
                this.goalPosition.z = -1;
            break;
        }
    }

    static updateRotation() {
        if(this.pRotation.x != this.sim.table.rotation.x || this.pRotation.y != this.sim.table.rotation.y)
        {
            this.goalRotation.x = this.sim.table.rotation.x;
            this.goalRotation.y = this.sim.table.rotation.y;
        }
        this.sim.table.rotation.x -= (this.sim.table.rotation.x - this.goalRotation.x)*0.04;
        this.sim.table.rotation.y -= (this.sim.table.rotation.y - this.goalRotation.y)*0.04;
        this.pRotation.x = this.sim.table.rotation.x;
        this.pRotation.y = this.sim.table.rotation.y;
    }

    static updatePosition() {
        if(this.pPosition.x != this.sim.table.position.x || this.pPosition.y != this.sim.table.position.y || this.pPosition.z != this.sim.table.position.z)
        {
            this.goalPosition.x = this.sim.table.position.x;
            this.goalPosition.y = this.sim.table.position.y;
            this.goalPosition.z = this.sim.table.position.z;
        }
        this.sim.table.position.x -= (this.sim.table.position.x - this.goalPosition.x)*0.04;
        this.sim.table.position.y -= (this.sim.table.position.y - this.goalPosition.y)*0.04;
        this.sim.table.position.z -= (this.sim.table.position.z - this.goalPosition.z)*0.04;
        this.pPosition.x = this.sim.table.position.x;
        this.pPosition.y = this.sim.table.position.y;
        this.pPosition.z = this.sim.table.position.z;
    }

    static resize()
    {
        this.updateCanSize();
        this.sim.renderer.domElement.width = this.canSize.width;
        this.sim.renderer.domElement.height = this.canSize.height;
        Simulate.sim.camera.aspect = this.canSize.width/this.canSize.height;
        Simulate.sim.camera.updateProjectionMatrix();
        this.sim.renderer.setSize(this.canSize.width,this.canSize.height);

    }
    static updateCanSize()
    {
        if(this.canSize == undefined)
        {
            this.canSize  =
            {
                width: 0,
                height: 0
            };
        }
        this.canSize.width = misc_pane_id.clientWidth-50;
        this.canSize.height = DDE_DB.persistent_get("dde_window_height") - DDE_DB.persistent_get("top_right_panel_height") - 220;
    }
    static clearResourceTree(root)
    {
        if(root == undefined)
        {
            return;
        }
        if(root.material)
        {
            root.material.dispose();
        }
        if(root.geometry)
        {
            root.geometry.dispose();
        }
        if(root.children != undefined)
        {
            if(typeof(root.children.length) == "number")
            {
                for(let i = 0; i < root.children.length; i++)
                {
                    clearResourceTree(root.children[i]);
                }
            }
        }

        if(root.dispose != undefined)
        {
            try
            {
                root.dispose()
            }
            catch
            {}
        }
    }
    static destroySimulation()
    {
        init_simulation_done = false;
        simKilled = true;
        try
        {
            destroy_mouse();
        }
        catch
        {

        }
        clear_out_sim_graphics_pane_id();
        clearResourceTree(sim.scene);
        let hi_rez = sim.hi_rez; 
        sim = {};
        sim.hi_rez = hi_rez;
    }
    static destroy_mouse()
    {
        sim_graphics_pane_id.removeEventListener("mousedown", simMouseDownListener, false);

        sim_graphics_pane_id.removeEventListener('mousemove', simMouseMoveListener, false);

        sim_graphics_pane_id.removeEventListener("mouseup", simMouseUpListener, false);
    }
} //end class Simulate

