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
import { e } from 'mathjs';


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
        <div id="sim_pane_header_id">
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
        </div>
        <div id="sim_graphics_pane_id" style="cursor:grab;"></div>
        `;
        
        return sim_div;
    }


    static mouse = {
        x:0,
        y:0,
        mX:0,
        mY:0,
        down:false,
        shiftDown:false,
        ctrlDown:false
    }

    static canSize;

    

    static sim = {} //used to store sim "global" vars

    static simulatorUI;

//var THREE_font_loader = new THREE.FontLoader();
    static simulation_initialized = false;
    static update_in_progress = false;

    static default_orbit = 
    {
        center_x:0.0,
        center_y:0.306,
        center_z:0.0 ,
        rotation_yaw:   -0.25*Math.PI,
        rotation_pitch: -0.25*Math.PI,
        zoom:2.0,
        radius:2
    };
    static orbit = 
    {
        center_x:this.default_orbit.center_x,
        center_y:this.default_orbit.center_y,
        center_z:this.default_orbit.center_z,
        rotation_yaw  : this.default_orbit.rotation_yaw  ,
        rotation_pitch: this.default_orbit.rotation_pitch,
        zoom:this.default_orbit.zoom,
        radius:2
    }
    static target_orbit = 
    {
        center_x:this.default_orbit.center_x,
        center_y:this.default_orbit.center_y,
        center_z:this.default_orbit.center_z,
        rotation_yaw  : this.default_orbit.rotation_yaw  ,
        rotation_pitch: this.default_orbit.rotation_pitch,
        zoom:this.default_orbit.zoom,
        radius:2
    }
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
            pane_id.style.overflow="hidden";
            this.update_in_progress = false;
        }
    }

    static init_simulation(){
        if(!this.simulation_initialized)
        {
            this.updateCanSize();
            try{
                this.init_mouse();
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
        this.sim.camera.rotation.order = "YXZ";
        this.update_camera();

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

            Simulate.update_camera();
            Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
        }
    }

    // static sim_handle_mouse_move(){
    //     var mouseX_diff =  this.sim.mouseX - this.sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
    //     var mouseY_diff =  this.sim.mouseY - this.sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
    //     if (this.sim.shiftDown){
    //         //alert(camera.zoom)  //camera.zoom starts at 1
    //         var zoom_increment = mouseX_diff / 100.0
    //         this.sim.camera.zoom = this.sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
    //         this.sim.camera.updateProjectionMatrix()
    //     }
    //     else if (this.sim.altDown || (this.sim.button == 1)){
    //         var panX_inc = mouseX_diff / 100
    //         var panY_inc = mouseY_diff / 100
    //         this.sim.table.position.x =  this.sim.tableX_at_mouseDown + panX_inc
    //         this.sim.table.position.y =  this.sim.tableY_at_mouseDown - panY_inc
    //     }
    //     else {
    //         let newX = this.sim.rotationX_at_mouseDown + (mouseY_diff / 100);
    //         if(newX<=Math.PI*0.5&&newX>=-Math.PI*0.5)this.sim.table.rotation.x = newX;
    //         this.sim.table.rotation.y = this.sim.rotationY_at_mouseDown + (mouseX_diff / 100)
    //     }
    // }

    //set up drag mouse to rotate table

    static orbit_speed = 5.0;
    static   pan_speed = 2.5;
    static init_mouse(){

        sim_graphics_pane_id.addEventListener("mousedown", (event) => {
            this.mouse.down = true;
            this.mouse.shiftDown = event.shiftKey;
            this.mouse.ctrlDown  = event.ctrlKey ;
        }, false);

        sim_graphics_pane_id.addEventListener("wheel",(event)=>{
            Simulate.orbit.zoom *=1.05**(-event.deltaY*0.02);
            this.target_orbit.zoom = this.orbit.zoom;
        });

        window.addEventListener('mousemove', (event) => {
            event.preventDefault();
            this.mouse.shiftDown = event.shiftKey;
            this.mouse.ctrlDown  = event.ctrlKey ;
            this.mouse.x  = event.offsetX;
            this.mouse.y  = event.offsetY;
            this.mouse.mX = -event.movementX;
            this.mouse.mY = -event.movementY;

            if(this.mouse.down && !this.mouse.shiftDown)
            {
                this.orbit.rotation_yaw   += this.orbit_speed*this.mouse.mX/this.canSize.height;
                this.orbit.rotation_pitch += this.orbit_speed*this.mouse.mY/this.canSize.height;
                this.orbit.rotation_pitch = Math.min(Math.max(this.orbit.rotation_pitch,-Math.PI/2),Math.PI/2);

                this.target_orbit.rotation_yaw   = this.orbit.rotation_yaw   ;
                this.target_orbit.rotation_pitch = this.orbit.rotation_pitch ;
            }
            else if(this.mouse.down && this.mouse.shiftDown)
            {
                this.pan_orbit(
                     this.pan_speed*this.mouse.mX/(this.canSize.height*this.orbit.zoom),
                    -this.pan_speed*this.mouse.mY/(this.canSize.height*this.orbit.zoom)
                )
            }
        }, false);


        window.addEventListener("mouseup", (event) => {
            this.mouse.down = false;
        }, false);
    }

    static pan_orbit(x_movement,y_movement)
    {
        // Unit vector pointing to the right from the camera's point of view
        let x_vec = {
            x:  Math.cos(this.orbit.rotation_yaw),
            y:  0,
            z: -Math.sin(this.orbit.rotation_yaw)
        };
        // Unit vector pointing up from the camera's point of view
        let y_vec = {
            x: Math.sin(this.orbit.rotation_yaw)*Math.sin(this.orbit.rotation_pitch),
            y:                               1.0*Math.cos(this.orbit.rotation_pitch),
            z: Math.cos(this.orbit.rotation_yaw)*Math.sin(this.orbit.rotation_pitch)
        };

        this.orbit.center_x += x_movement * x_vec.x + y_movement * y_vec.x;
        this.orbit.center_y += x_movement * x_vec.y + y_movement * y_vec.y;
        this.orbit.center_z += x_movement * x_vec.z + y_movement * y_vec.z;

        this.target_orbit.center_x = this.orbit.center_x;
        this.target_orbit.center_y = this.orbit.center_y;
        this.target_orbit.center_z = this.orbit.center_z;
    }
    
    static update_camera()
    {
        this.update_camera_smooth_tracking();
        this.sim.camera.rotation.y = this.orbit.rotation_yaw;
        this.sim.camera.rotation.x = this.orbit.rotation_pitch;


        this.sim.camera.position.x = this.orbit.center_x+this.orbit.radius*Math.cos(this.orbit.rotation_pitch)*Math.sin(this.orbit.rotation_yaw);
        this.sim.camera.position.z = this.orbit.center_z+this.orbit.radius*Math.cos(this.orbit.rotation_pitch)*Math.cos(this.orbit.rotation_yaw);
        this.sim.camera.position.y = this.orbit.center_y+this.orbit.radius*Math.sin(-this.orbit.rotation_pitch);


        Simulate.sim.camera.zoom = Simulate.orbit.zoom;
        Simulate.sim.camera.updateProjectionMatrix();
    }
    static camera_track_step = 0.05;
    static camera_track_zoom_step = 0.05;
    static update_camera_smooth_tracking()
    {
        let center_x_diff = this.target_orbit.center_x-this.orbit.center_x;
        let center_x_speed = this.camera_track_step*Math.sqrt(Math.abs(center_x_diff));
        this.orbit.center_x += Math.sign(center_x_diff)*Math.min(center_x_speed,Math.abs(center_x_diff));

        let center_y_diff = this.target_orbit.center_y-this.orbit.center_y;
        let center_y_speed = this.camera_track_step*Math.sqrt(Math.abs(center_y_diff));
        this.orbit.center_y += Math.sign(center_y_diff)*Math.min(center_y_speed,Math.abs(center_y_diff));

        let center_z_diff = this.target_orbit.center_z-this.orbit.center_z;
        let center_z_speed = this.camera_track_step*Math.sqrt(Math.abs(center_z_diff));
        this.orbit.center_z += Math.sign(center_z_diff)*Math.min(center_z_speed,Math.abs(center_z_diff));

        let yaw_diff = this.target_orbit.rotation_yaw-this.orbit.rotation_yaw;
        yaw_diff %= 2*Math.PI;
        if(yaw_diff<0){yaw_diff+=2*Math.PI}
        if(yaw_diff>Math.PI){yaw_diff-=2*Math.PI}

        let yaw_speed = this.camera_track_step*Math.sqrt(Math.abs(yaw_diff));
        this.orbit.rotation_yaw   += Math.sign(yaw_diff)*Math.min(yaw_speed,Math.abs(yaw_diff));
        
        let pitch_diff = this.target_orbit.rotation_pitch-this.orbit.rotation_pitch;
        let pitch_speed = this.camera_track_step*Math.sqrt(Math.abs(pitch_diff));
        this.orbit.rotation_pitch   += Math.sign(pitch_diff)*Math.min(pitch_speed,Math.abs(pitch_diff));

        let zoom_diff = 1.0/this.target_orbit.zoom-1.0/this.orbit.zoom;
        let zoom_speed = this.camera_track_step*Math.sqrt(Math.abs(zoom_diff));
        this.orbit.zoom   = 1.0/(1.0/this.orbit.zoom+Math.sign(zoom_diff)*Math.min(zoom_speed,Math.abs(zoom_diff)));
    }

    static draw_table(parent, table_width, table_length, table_height){
        var geometryt    = new THREE.BoxGeometry(table_length, table_height, table_width);
        var materialt    = new THREE.MeshPhongMaterial( { color: 0xFFFFFF} ); //normal material shows different color for each cube face, easier to see the 3d shape.
        this.sim.table   = new THREE.Mesh(geometryt, materialt)
        this.sim.table.name = "table"
        this.sim.table.receiveShadow = true;

        this.sim.table.position.x = 0 //-3.85
        this.sim.table.position.y = 0 //2.47
        this.sim.table.position.z = 0 //0

        this.sim.table.rotation.x = 0; //0 //0.53
        this.sim.table.rotation.y = 0; //5 shows table with +x to right, and +y away from camera. 1.8 //0 //-0.44
        this.sim.table.rotation.z = 0;
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
        this.target_orbit.rotation_yaw = this.target_orbit.rotation_yaw  % (2*Math.PI);
        if(this.target_orbit.rotation_yaw<0)
        {
            this.target_orbit.rotation_yaw+=Math.PI*2;
        }
        switch(position)
        {
            case(0):
            this.target_orbit.rotation_pitch = 0.0;
            this.target_orbit.rotation_yaw   = Math.round(this.orbit.rotation_yaw/Math.PI)*Math.PI;
            break;

            case(1):
                this.target_orbit.rotation_pitch = 0.0;
                this.target_orbit.rotation_yaw   = Math.round((this.orbit.rotation_yaw-0.5*Math.PI)/Math.PI)*Math.PI+0.5*Math.PI;
            break;

            case(2):
                this.target_orbit.rotation_pitch = -Math.PI/2;
                this.target_orbit.rotation_yaw   = Math.round(2.0*this.orbit.rotation_yaw/Math.PI)*Math.PI/2.0;
            break;

            case(3):
            radius:2
                this.target_orbit.rotation_pitch = this.default_orbit.rotation_pitch ;
                this.target_orbit.rotation_yaw   = this.default_orbit.rotation_yaw   ;
                this.target_orbit.center_x = this.default_orbit.center_x;
                this.target_orbit.center_y = this.default_orbit.center_y;
                this.target_orbit.center_z = this.default_orbit.center_z;
                this.target_orbit.zoom = this.default_orbit.zoom;;
            break;
        }
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
        this.canSize.height = sim_pane_content_id.clientHeight-sim_pane_header_id.clientHeight;
        // this.canSize.height = DDE_DB.persistent_get("dde_window_height") - DDE_DB.persistent_get("top_right_panel_height") - 220;
    }

    //Can be used to free simulator memory
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

