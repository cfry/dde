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
a_font_loader.load(//'node_modules/three/examples/fonts/helvetiker_bold.typeface.json', //THREE doc on Simulate path is woefully insufficient. I patterned Simulate after https://www.youtube.com/watch?v=l7K9AMnesJQ Without "node_modules/" on the front, it doesn't work
                   './third_party/helvetiker_bold.typeface.json',
                   //'../../third_party/helvetiker_bold.typeface',
                   //'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', //todo make Simulate not depend on a web connection
    function(font) {
           globalThis.hel_font = font
       }
)

//import THREE_Text2D from 'three-text2d'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//import THREE_GLTFLoader from 'three-gltf-loader' //using the examples folder like Simulate is depricated three/examples/js/loaders/GLTFLoader.js')
//see: https://github.com/johh/three-gltf-loader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//From https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content
import { VRButton } from 'three/addons/webxr/VRButton.js'; //VR  search Simulate file for "//VR" to see all Virtual Reality code
import { e } from 'mathjs';


globalThis.Simulate = class Simulate {
    // Creates an div containing the simulator and it's UI
    // Simulate can be appended and removed from the main DOM while still remain intact
    // Simulate allows the simulator to be hidden and shown without it being reinitiallized
    // NOTE: DO NOT RUN Simulate OUTSIDE OF simulate.js! IT SHOULD ONLY EVER RUN ONCE DURING INIT!
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
        center_x:Simulate.default_orbit.center_x,
        center_y:Simulate.default_orbit.center_y,
        center_z:Simulate.default_orbit.center_z,
        rotation_yaw  : Simulate.default_orbit.rotation_yaw  ,
        rotation_pitch: Simulate.default_orbit.rotation_pitch,
        zoom:Simulate.default_orbit.zoom,
        radius:2
    }
    static target_orbit = 
    {
        center_x:Simulate.default_orbit.center_x,
        center_y:Simulate.default_orbit.center_y,
        center_z:Simulate.default_orbit.center_z,
        rotation_yaw  : Simulate.default_orbit.rotation_yaw  ,
        rotation_pitch: Simulate.default_orbit.rotation_pitch,
        zoom:Simulate.default_orbit.zoom,
        radius:2
    }
    // static init_simulation_done = false

    // static init_simulation_maybe(){
    //     if(Simulate.init_simulation_done) {}
    //     else {
    //         Simulate.init_simulation_done = true //needs to be done first as if init_simulation has already started we don't
    //          //dont want to start it again.
    //         Simulate.init_simulation()

    //     }
    // }
    /*
    Returns an documentation fragment containing the simulator which can be appended to the DOM directly with appendChild
    If the simulator has not yet been initialized, Simulate will initialize the simulator
    It the simulator has been initialized already, Simulate will resize the viewport to the correct size
     */
    static append_simulation(pane_id)
    {
        if(!Simulate.update_in_progress)
        {
            Simulate.update_in_progress = true;
            // Create the UI if the simulator hasn't yet been initialized
            if(!Simulate.simulation_initialized)
            {
                Simulate.simulatorUI  = Simulate.make_sim_ui();
            }
    
            // Append the simulator to the pane
            pane_id.innerHTML = "";
            pane_id.appendChild(Simulate.simulatorUI);
    
            //Initialize the simulator if it has not been initialized already
            if(!Simulate.simulation_initialized)
            {
                Ammo().then( Simulate.init_simulation );
            }
            else
            {
                Simulate.resize();
            }
            pane_id.style.overflow="hidden";
            Simulate.update_in_progress = false;
        }
    }

    static init_simulation(){
        if(!Simulate.simulation_initialized)
        {
            Simulate.updateCanSize();
            try{

                Simulate.init_mouse();
                Simulate.sim.enable_rendering = false
                //for organization: https://discoverthreejs.com/book/first-steps/lights-color-action/
                Simulate.sim.container = sim_graphics_pane_id //a div that contains a canvas
                Simulate.sim.scene  = new THREE.Scene();
                Simulate.sim.scene.name = "scene"
                Simulate.sim.scene.background = new THREE.Color(0xFFF5E0) //0xFFF6C7) //0xFFFFFF) //0xBBBBBB ) // 0x000000black is the default
                Simulate.createRenderer()
                Simulate.createCamera()
                Simulate.createLights()


                Simulate.initPhysicsWorld();

                Simulate.createMeshGLTF() ;
                Simulate.sim.axes = Simulate.createAxisHelper(new THREE.Vector3(0.3,0.3,0.0));
                Simulate.sim.axes.position.set(1.0,0.075,1.0);
                
                // let joints = [Simulate.sim.J0,Simulate.sim.J1,Simulate.sim.J2,Simulate.sim.J3,Simulate.sim.J4];
                // for(let j of joints)
                // {
                //     let meshes = Simulate.getMeshes(j);
                //     for(let mesh of meshes)
                //     {
                //         let obj = new PhysicsObject(mesh,0,PhysicsObject.Shape.BOX);
                //         obj.makeKinematic();
                //     }
                // }
                

                SimBuild.init()
                Simulate.init_interaction_manager()
                SimObj.refresh() //does nothing if no SimObjs. Otherwise makes sure they are in the scene and refreshes
            }
            catch(err){
                    console.log("init_simulation errored with: " + err.message + "\n" + err.stack)
            }

            //Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera) //Sadly Simulate didn't work so
            // stil doing BOTH the below setAnimationLoop and inSimqueueJ  SimUtils, calling prime the pump to avoid bad rednering of Dexter

            //from https://threejs.org/docs/index.html#manual/en/introduction/How-to-create-VR-content
            Simulate.sim.renderer.setAnimationLoop( function () { //VR
                //Simulate.sim.renderer.render( Simulate.sim.scene, Simulate.sim.camera );
                Simulate.do_animation_loop()
            } );

            Simulate.simulation_initialized = true;
        }
        else
        {
            console.warn("Warning: Simulation attempt was made after the simulator was initialized");
            debugger;
        }
        
    }
    static enableArmPhysics()
    {
        let meshes = Simulate.getMeshes(Simulate.sim.J0);
        for(let mesh of meshes)
        {
            let obj = new PhysicsObject(mesh,0);
            obj.makeKinematic();
        }
    }
    static getMeshes(obj3d){
        let out = [];
        for(let i = 0; i < obj3d.children.length; i++)
        {
            let child = obj3d.children[i];
            if(child.isMesh)
            {
                out.push(child);
            }
            if(child.children.length > 0 && child != Simulate.sim.J6)
            {
                let subMeshes = Simulate.getMeshes(child);
                for(let j = 0; j < subMeshes.length; j++)
                {
                    out.push(subMeshes[j]);
                }
            }
        }
        return out;
    }

    static physicsWorld;
    static physicsScale = 10.0;
    static physicsBodies = [];
    static initPhysicsWorld()
    {
        let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();
    
        Simulate.physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        Simulate.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    }
    
    static updatePhysics( deltaTime ){

        // Step world
        Simulate.physicsWorld.stepSimulation( deltaTime, 10 );

        // Update rigid bodies
        for ( let i = 0; i < Simulate.physicsBodies.length; i++ ) {
            Simulate.physicsBodies[i].update();
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
            Simulate.sim.renderer,
            Simulate.sim.camera,
            Simulate.sim.renderer.domElement
            //{ autoAdd: true, scene: Simulate.sim.scene} //autoAdd seems not to word
        )
    }

    static createCamera(){
        //https://discoverthreejs.com/book/first-steps/first-scene/
        Simulate.sim.camera = new THREE.PerspectiveCamera(
              75, //field of view in degrees. determines ratio of far clipping region is to near clipping region
            Simulate.canSize.width / Simulate.canSize.height, //aspect ratio, If not same as canvas width and height,
                                                      //the image will be distorted.
              0.1, //1, //0.1,   //distance between camera and near clipping plane. Must be > 0.
              10 //4      // 3 is too small and clips the table. was: 1000   //distance between camera an far clipping plane. Must be > near.
              );
        Simulate.sim.camera.name = "camera"
        Simulate.sim.camera.rotation.order = "YXZ";
        Simulate.update_camera();

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
        Simulate.sim.scene.add ( light );

      //directional light
        const dcolor = 0xFFFFFF;
        const dintensity = 1 //0.5;
        //	const intensity = 0.35;		//	To see the helpers easier.
        const dlight = new THREE.DirectionalLight ( dcolor, dintensity );
        dlight.position.set ( 4, 4, 2 );
        dlight.target.name = "directional_light_target"
        dlight.target.position.set ( 0, 0, 0 );
        dlight.castShadow = true;
        Simulate.sim.scene.add ( dlight );
        Simulate.sim.scene.add ( dlight.target );

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
            Simulate.sim.scene.add ( light ); }

        //	Directional Light
        //
        { 	const color = 0xFFFFFF;
            const intensity = 0.5;
            const light = new THREE.DirectionalLight ( color, intensity );
            light.position.set ( 4, 4, 2 );
            light.target.position.set ( 0, 0, 0 );
        //	light.castShadow = true;
            Simulate.sim.scene.add ( light );
            Simulate.sim.scene.add ( light.target ); }
    */
    }

    static VR_but_dom_elt

    static createRenderer(){
        Simulate.sim.renderer = new THREE.WebGLRenderer({ antialias:true });//antialias helps with drawing the table lines. //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
        Simulate.sim.renderer.setSize( //Simulate.sim.container.clientWidth, Simulate.sim.container.clientHeight) //causes no canvas to appear
        Simulate.canSize.width, Simulate.canSize.height);
        //renderer.setPixelRatio( globalThis.devicePixelRatio );  //causes no canvas to appear
        //sim_graphics_pane_id.innerHTML = "" //done in video.js
        Simulate.sim.renderer.shadowMap.enabled = true;
        Simulate.sim.container.appendChild(Simulate.sim.renderer.domElement)
        Simulate.VR_but_dom_elt = VRButton.createButton( Simulate.sim.renderer )  //VR makes global dom elt "VRButton" odd. the orig class VRButton var is over-ridden??? Don't depend on it!
        Simulate.VR_but_dom_elt.style.backgroundColor = "#ffd6c2"
        Simulate.VR_but_dom_elt.style.color = "black"
        // sim_pane_header_alignment_id.append(vr_but)           //VR //put right after the "Alignment: " buttons
        Simulate.sim.container.append(Simulate.VR_but_dom_elt)           //VR
        //sim_pane_move_dur_id.append(Simulate.VR_but_dom_elt) //even if I try to place the button outside of the canvas, it does their anyway.
        //but not the button doesn't actually appear here. It appears IN the real sim rendering pane,
        //at the bottom in an "overlay" which will usually say, in a box,  "VR NOT SUPPORTED"
        Simulate.sim.renderer.xr.enabled = true;                     //VR
        Simulate.sim.renderer.xr.setReferenceSpaceType( 'local' );   //VR  from threejs.org webxr_vr_rollercoaster.html
        //Simulate.init_vr()
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
    static gltfLoader;
    static createMeshGLTF(){
        Simulate.sim.table_width = 2.0 //= 0.447675,  //width was 1
        Simulate.sim.table_length = 2.0//0.6985,    //length was 2
        Simulate.sim.table_height = 0.02//0.01905    //height (thickness of Dexcell surface). Simulate is 3/4 of an inch. was:  0.1)
        Simulate.new_draw_table(Simulate.sim.table_width, Simulate.sim.table_length, Simulate.sim.table_height)
        // Simulate.sim.table.position.x = -(Simulate.sim.table_width / 4);
        Simulate.sim.table.position.y = -(Simulate.sim.table_height / 2);
        Simulate.sim.table.position.z = 0;



        Simulate.sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
        Simulate.sim.J0.rotation.y = Math.PI //radians for 180 degrees
        Simulate.sim.J0.name = "J0"

                                 //- 0.12425 the distance from the edge of the table that Dexter is placed
        Simulate.sim.scene.add(Simulate.sim.J0)

        let loader = new GLTFLoader //THREE_GLTFLoader()
        Simulate.gltfLoader = loader;
        console.log("cur file simulate.js: " + globalThis.location.pathname)
        loader.load(//__dirname + "/HDIMeterModel.gltf", //select_val, //fails
                    //"./HDIMeterModel.gltf", //fails
                    "simulator_server_files/HDIMeterModel.gltf",
                    function(gltf_object3D) { Simulate.fix_up_gltf_and_add(gltf_object3D) }, //modified for dde4
                    Simulate.undefined,
                    function (err) {
                        console.error( err );
                    }
        )

    }

//copied from video_js with slight mods
    static fix_up_gltf_and_add(gltf_object3D) {
    //              Simulate.sim.scene.add(gltf.scene)
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
        //	Simulate.sim.scene.add(root)
        Simulate.sim.J0.add(root) //fry added in J0 to shift dexter to back of the table.

        //	Set link parent-child relationships.
        //
        Simulate.do_animation_loop()

        //	Now link.
        Simulate.chainLink ( objs[0].children, 7 );
        Simulate.chainLink ( objs[0].children, 6 );
        Simulate.chainLink ( objs[0].children, 5 );
        Simulate.chainLink ( objs[0].children, 4 );
        Simulate.chainLink ( objs[0].children, 3 );
        Simulate.chainLink ( objs[0].children, 2 );
        Simulate.chainLink ( objs[0].children, 1 );

        Simulate.set_joints_in_sim()
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
        Simulate.sim.LINK1 = Simulate.sim.scene.getObjectByName("DexterHDI_MainPivot_KinematicAssembly_v21")
        Simulate.sim.LINK2 = Simulate.sim.scene.getObjectByName("DexterHDI_Link2_KinematicAssembly_v51")
        Simulate.sim.LINK3 = Simulate.sim.scene.getObjectByName("DexterHDI_Link3_KinematicAssembly_v21")
        Simulate.sim.LINK4 = Simulate.sim.scene.getObjectByName("DexterHDI_Link4_KinematicAssembly_v31")
        Simulate.sim.LINK5 = Simulate.sim.scene.getObjectByName("DexterHDI_Link5_KinematicAssembly_v21")
        Simulate.sim.LINK6 = Simulate.sim.scene.getObjectByName("DexterHDI_Link6_KinematicAssembly_v31")
        Simulate.sim.LINK7 = Simulate.sim.scene.getObjectByName("DexterHDI_Link7_KinematicAssembly_v21")

        Simulate.sim.J1 = Simulate.sim.LINK1
        Simulate.sim.J2 = Simulate.sim.LINK2
        Simulate.sim.J3 = Simulate.sim.LINK3
        Simulate.sim.J4 = Simulate.sim.LINK4
        Simulate.sim.J5 = Simulate.sim.LINK5
        Simulate.sim.J6 = Simulate.sim.LINK6
        Simulate.sim.J7 = Simulate.sim.LINK7
    }

    static gripperBox;

    // Change this variable to speed up or slow down the simulation
    static simulationRate = 1.0;

    static do_animation_loop(){
        if (SimUtils.is_simulator_showing()) {
            if(globalThis.interactionManager) {
                interactionManager.update();
            }

            if(Simulate.sim.J6 != undefined)
            {
                if(Simulate.gripperBox == undefined)
                {
                    Simulate.gripperBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)), new THREE.LineBasicMaterial( { color: 0xff0000 }));
                    Simulate.gripperBox.scale.set(0.0,0.25,0.6);
                    Simulate.gripperBox.position.set(0,0,-0.65);
                    Simulate.sim.J6.add(Simulate.gripperBox);
                    Simulate.gripperBox.visible = false;
                }

                Simulate.update_joints();
            }
            Simulate.update_camera();
            Simulate.updateText();
            Simulate.updatePhysics((Simulate.simulationRate/Simulate.targetFramerate));
            Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
            Simulate.lastJ7Pos = Simulate.currentJ7Pos;
        }
    }


    static jointsTarget = [0,0,0,0,0,0,0];
    static atTarget = true;
    static endIntructionOnTargetReached = false;

    static dexter_sim_instance;
    static targetFramerate = 60;

    static lastJ7Pos = 180;
    static currentJ7Pos = 180;

    static dynamixel_320_to_rad(steps)
    {
        let out = (Math.PI*Socket.DEGREES_PER_DYNAMIXEL_320_UNIT*steps/180) ;
        // if(out<0)
        // {
        //     out = Math.PI*2 + out;
        // }
        return out;
    }

    static rad_to_dynamixel_320(rads)
    {
        return 180*rads/(Math.PI*Socket.DEGREES_PER_DYNAMIXEL_320_UNIT);
    }

    /* List of places that reference Simulate:
    simqueue.js 119 add_to_queue; Updates target position for J6 and J7 as Simulate happens as soon as an a command is added to the queue
    simutils.js 65 render_multi; Updates joints 1-5 when an a command is actually run
    */
    static update_joints()
    {
        if(Simulate.dexter_sim_instance != undefined)
        {
            let max_speed_rad = Math.PI*Simulate.dexter_sim_instance.parameters["AngularSpeed"] / (3600*180);
            let max_speed_rad_servo = Kin.dynamixel_320_degrees_per_second * Math.PI/180;
            
            
            let joint_diffs = [];
            let max_diff = 0;
            // Get the differences between the current arm angles and target arm angles and also save the highest difference in a variable
            for(let i = 0; i < 7; i++)
            {
                let current_angle_rads = Math.PI*Simulate.dexter_sim_instance.angles_dexter_units[i]/ (3600*180);
                if(i == 5)
                {
                    current_angle_rads = Simulate.dynamixel_320_to_rad(Simulate.dexter_sim_instance.angles_dexter_units[i]- Socket.J6_OFFSET_SERVO_UNITS);
                }
                if(i == 6)
                {
                    current_angle_rads = Simulate.dynamixel_320_to_rad(Simulate.dexter_sim_instance.angles_dexter_units[i]);
                }

                
                let joint_diff = Simulate.jointsTarget[i]-current_angle_rads;
                if(isNaN(joint_diff))
                {
                    joint_diff = 0;
                }
                joint_diffs.push(joint_diff);
                
                if(Math.abs(joint_diff) > max_diff && i < 5)
                {
                    max_diff = Math.abs(joint_diff);
                }
            }
            
            
            // If the arm is within 2 times the minimum possible step size then consider it to be at the target
            if(max_diff < max_speed_rad *(Simulate.simulationRate/Simulate.targetFramerate) * 2)
            {
                // Set the current angle to the target angle to eliminate any remaining error
                for(let i = 0; i < 5; i++)
                {
                    Simulate.dexter_sim_instance.angles_dexter_units[i] = Simulate.jointsTarget[i] * (3600*180) / Math.PI;
                }
                // If it wasn't at the target position before but it is now, tell the queue that the action is done
                if(!Simulate.atTarget)
                {
                    Simulate.dexter_sim_instance.queue_instance.done_with_instruction();
                    Simulate.atTarget = true;
                }
            }

            let j6_at_target = false;
            if(Math.abs(joint_diffs[5]) < max_speed_rad_servo * (Simulate.simulationRate/Simulate.targetFramerate) * 1.01)
            {
                j6_at_target = true;
                Simulate.dexter_sim_instance.angles_dexter_units[5] =  Simulate.rad_to_dynamixel_320(Simulate.jointsTarget[5]) + Socket.J6_OFFSET_SERVO_UNITS;
            }

            let j7_at_target = false;
            if(Math.abs(joint_diffs[6]) < max_speed_rad_servo * (Simulate.simulationRate/Simulate.targetFramerate) * 1.01)
            {
                j7_at_target = true;
                Simulate.dexter_sim_instance.angles_dexter_units[6] =  Simulate.rad_to_dynamixel_320(Simulate.jointsTarget[6]);
            }


            // Stop the movement if told to stop
            if(Simulate.dexter_sim_instance.queue_instance.stop_ongoing && !Simulate.atTarget)
            {
                // Set target angle to the current angle so that the arm stays in place
                for(let i = 0; i < 5; i++)
                {
                    Simulate.jointsTarget[i] = Math.PI * Simulate.dexter_sim_instance.angles_dexter_units[i] / (3600*180);
                    if(Simulate.endIntructionOnTargetReached)
                    {
                        Simulate.dexter_sim_instance.queue_instance.done_with_instruction();
                    }
                    Simulate.atTarget = true;
                }
            }

            // Update the arm
            for(let i = 0; i < 7; i++)
            {
                // Calculate how far the arm needs to move Simulate frame
                let joint_step_rad = (Simulate.simulationRate/Simulate.targetFramerate) * max_speed_rad * joint_diffs[i] / max_diff;

                // If it is not already at the target position, move the arm by the step calculated above
                if(!Simulate.atTarget && i < 5)
                {
                    Simulate.dexter_sim_instance.angles_dexter_units[i] += joint_step_rad * (3600*180) / Math.PI;
                }
                // Get the new joint angle in radians
                let updated_angle_rad = Math.PI*Simulate.dexter_sim_instance.angles_dexter_units[i]/ (3600*180);

                if(i == 5)
                {
                    updated_angle_rad = Simulate.dynamixel_320_to_rad(Simulate.dexter_sim_instance.angles_dexter_units[i]- Socket.J6_OFFSET_SERVO_UNITS);
                }
                if(i == 6)
                {
                    updated_angle_rad = Simulate.dynamixel_320_to_rad(Simulate.dexter_sim_instance.angles_dexter_units[i]);
                }

                // Update the joint in the sim
                let y_or_z = (((i === 0) || (i === 4)) ? "y" : "z");
                if(i < 5) // Joints 1 - 5
                {
                    Simulate.sim["J"+(i+1)].rotation[y_or_z] = -updated_angle_rad;
                }
                else if(i == 5) // Joint 6
                {
                    Simulate.sim["J"+(i+1)].rotation[y_or_z] = updated_angle_rad;
                }
                else // Joint 7
                {
                    let angle_deg = updated_angle_rad*180/Math.PI;
                    let new_xpos = ((angle_deg * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
                    new_xpos *= 10;
                    Simulate.gripperBox.scale.x = (new_xpos-0.018);
                    Simulate.gripperBox.position.x = (new_xpos-0.018)/2;
                    Simulate.sim.J7.position.setX(new_xpos);
                }
                

                // Update the text value in the sim header
                globalThis["sim_pane_j" + (i+1) + "_id"].innerHTML = Math.round(updated_angle_rad*180/Math.PI);

                if(i==6)
                {
                    Simulate.currentJ7Pos = updated_angle_rad*180/Math.PI;
                }
            }

            let servo_step_rad = (Simulate.simulationRate/Simulate.targetFramerate) * max_speed_rad_servo * (180) / (Math.PI*Socket.DEGREES_PER_DYNAMIXEL_320_UNIT);
            if(!j6_at_target)
            {
                Simulate.dexter_sim_instance.angles_dexter_units[5] += Math.sign( joint_diffs[5]) * servo_step_rad ;
            }
            if(!j7_at_target)
            {
                Simulate.dexter_sim_instance.angles_dexter_units[6] += Math.sign( joint_diffs[6]) * servo_step_rad ;
            }

        }
    }

    static update_xyz_in_sim_pane()
    {
        let xyz = Kin.J_angles_to_xyz(angle_degrees_array, rob_pose)[0]

        let str_length
        let x = xyz[0]
        if(x < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(SimUtils.is_simulator_showing()) {
            sim_pane_x_id.innerHTML = ("" + x).substring(0, str_length)
        }
        let y = xyz[1]
        if(y < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(SimUtils.is_simulator_showing()) {
            sim_pane_y_id.innerHTML = ("" + y).substring(0, str_length)
        }
        let z = xyz[2]
        if(z < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(SimUtils.is_simulator_showing()) {
            sim_pane_z_id.innerHTML = ("" + z).substring(0, str_length)
        }
    }

    //set up drag mouse to rotate table

    static orbit_speed = 5.0;
    static   pan_speed = 2.5;
    static init_mouse(){

        sim_graphics_pane_id.addEventListener("mousedown", (event) => {
            Simulate.mouse.down = true;
            Simulate.mouse.shiftDown = event.shiftKey;
            Simulate.mouse.ctrlDown  = event.ctrlKey ;
        }, false);

        sim_graphics_pane_id.addEventListener("wheel",(event)=>{
            Simulate.orbit.zoom *=1.05**(-event.deltaY*0.02);
            Simulate.target_orbit.zoom = Simulate.orbit.zoom;
        });

        window.addEventListener('mousemove', (event) => {
            Simulate.mouse.shiftDown = event.shiftKey;
            Simulate.mouse.ctrlDown  = event.ctrlKey ;
            Simulate.mouse.altDown   = event.altKey ;
            Simulate.mouse.x  = event.offsetX;
            Simulate.mouse.y  = event.offsetY;
            Simulate.mouse.mX = -event.movementX;
            Simulate.mouse.mY = -event.movementY;

            if(Simulate.mouse.down && !Simulate.mouse.shiftDown && !Simulate.mouse.altDown)
            {
                Simulate.orbit.rotation_yaw   += Simulate.orbit_speed*Simulate.mouse.mX/Simulate.canSize.height;
                Simulate.orbit.rotation_pitch += Simulate.orbit_speed*Simulate.mouse.mY/Simulate.canSize.height;
                Simulate.orbit.rotation_pitch = Math.min(Math.max(Simulate.orbit.rotation_pitch,-Math.PI/2),Math.PI/2);

                Simulate.target_orbit.rotation_yaw   = Simulate.orbit.rotation_yaw   ;
                Simulate.target_orbit.rotation_pitch = Simulate.orbit.rotation_pitch ;
            }
            else if(Simulate.mouse.down && Simulate.mouse.shiftDown)
            {
                Simulate.pan_orbit(
                     Simulate.pan_speed*Simulate.mouse.mX/(Simulate.canSize.height*Simulate.orbit.zoom),
                    -Simulate.pan_speed*Simulate.mouse.mY/(Simulate.canSize.height*Simulate.orbit.zoom)
                )
            }
            else if(Simulate.mouse.down && Simulate.mouse.altDown){
                Simulate.orbit.zoom *=1.05**(-Simulate.mouse.mY*-0.04);  //should be drag up makes dexter bigger.
                Simulate.target_orbit.zoom = Simulate.orbit.zoom;
            }
        }, false);


        window.addEventListener("mouseup", (event) => {
            Simulate.mouse.down = false;
        }, false);
    }

    static pan_orbit(x_movement,y_movement)
    {
        // Unit vector pointing to the right from the camera's point of view
        let x_vec = {
            x:  Math.cos(Simulate.orbit.rotation_yaw),
            y:  0,
            z: -Math.sin(Simulate.orbit.rotation_yaw)
        };
        // Unit vector pointing up from the camera's point of view
        let y_vec = {
            x: Math.sin(Simulate.orbit.rotation_yaw)*Math.sin(Simulate.orbit.rotation_pitch),
            y:                               1.0*Math.cos(Simulate.orbit.rotation_pitch),
            z: Math.cos(Simulate.orbit.rotation_yaw)*Math.sin(Simulate.orbit.rotation_pitch)
        };

        Simulate.orbit.center_x += x_movement * x_vec.x + y_movement * y_vec.x;
        Simulate.orbit.center_y += x_movement * x_vec.y + y_movement * y_vec.y;
        Simulate.orbit.center_z += x_movement * x_vec.z + y_movement * y_vec.z;

        Simulate.target_orbit.center_x = Simulate.orbit.center_x;
        Simulate.target_orbit.center_y = Simulate.orbit.center_y;
        Simulate.target_orbit.center_z = Simulate.orbit.center_z;
    }
    
    static update_camera()
    {
        Simulate.update_camera_smooth_tracking();
        Simulate.sim.camera.rotation.y = Simulate.orbit.rotation_yaw;
        Simulate.sim.camera.rotation.x = Simulate.orbit.rotation_pitch;


        Simulate.sim.camera.position.x = Simulate.orbit.center_x+Simulate.orbit.radius*Math.cos(Simulate.orbit.rotation_pitch)*Math.sin(Simulate.orbit.rotation_yaw);
        Simulate.sim.camera.position.z = Simulate.orbit.center_z+Simulate.orbit.radius*Math.cos(Simulate.orbit.rotation_pitch)*Math.cos(Simulate.orbit.rotation_yaw);
        Simulate.sim.camera.position.y = Simulate.orbit.center_y+Simulate.orbit.radius*Math.sin(-Simulate.orbit.rotation_pitch);


        Simulate.sim.camera.zoom = Simulate.orbit.zoom;
        Simulate.sim.camera.updateProjectionMatrix();
    }
    static camera_track_step = 0.05;
    static camera_track_zoom_step = 0.05;
    static update_camera_smooth_tracking()
    {
        let center_x_diff = Simulate.target_orbit.center_x-Simulate.orbit.center_x;
        let center_x_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(center_x_diff));
        Simulate.orbit.center_x += Math.sign(center_x_diff)*Math.min(center_x_speed,Math.abs(center_x_diff));

        let center_y_diff = Simulate.target_orbit.center_y-Simulate.orbit.center_y;
        let center_y_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(center_y_diff));
        Simulate.orbit.center_y += Math.sign(center_y_diff)*Math.min(center_y_speed,Math.abs(center_y_diff));

        let center_z_diff = Simulate.target_orbit.center_z-Simulate.orbit.center_z;
        let center_z_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(center_z_diff));
        Simulate.orbit.center_z += Math.sign(center_z_diff)*Math.min(center_z_speed,Math.abs(center_z_diff));

        let yaw_diff = Simulate.target_orbit.rotation_yaw-Simulate.orbit.rotation_yaw;
        yaw_diff %= 2*Math.PI;
        if(yaw_diff<0){yaw_diff+=2*Math.PI}
        if(yaw_diff>Math.PI){yaw_diff-=2*Math.PI}

        let yaw_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(yaw_diff));
        Simulate.orbit.rotation_yaw   += Math.sign(yaw_diff)*Math.min(yaw_speed,Math.abs(yaw_diff));
        
        let pitch_diff = Simulate.target_orbit.rotation_pitch-Simulate.orbit.rotation_pitch;
        let pitch_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(pitch_diff));
        Simulate.orbit.rotation_pitch   += Math.sign(pitch_diff)*Math.min(pitch_speed,Math.abs(pitch_diff));

        let zoom_diff = 1.0/Simulate.target_orbit.zoom-1.0/Simulate.orbit.zoom;
        let zoom_speed = Simulate.camera_track_step*Math.sqrt(Math.abs(zoom_diff));
        Simulate.orbit.zoom   = 1.0/(1.0/Simulate.orbit.zoom+Math.sign(zoom_diff)*Math.min(zoom_speed,Math.abs(zoom_diff)));
    }
    static new_draw_table(width,length,height)
    {
        let physTable = PhysicsObject.createBox({x:width,y:height,z:length},{x:0,y:0,z:0},0,0xFFFFFF);
        physTable.makeKinematic();
        physTable.rigid_body.setFriction(0.7);
        let table = physTable.mesh;
        table.name = "table";
        Simulate.sim.table = table;

        let tableTex = new THREE.TextureLoader().load( "assets/DexterGrid.png" );
        tableTex.wrapS = THREE.RepeatWrapping;
        tableTex.wrapT = THREE.RepeatWrapping;
        tableTex.repeat.set(1,1);
        physTable.mesh.material.map = tableTex;
    }

    static createAxisHelper(position)
    {
        let xArrow = Simulate.createArrowMesh(new THREE.Vector3( 0.0, 0.0, -0.5),0xff0000);
        let yArrow = Simulate.createArrowMesh(new THREE.Vector3(-0.5, 0.0,  0.0),0x00ff00);
        let zArrow = Simulate.createArrowMesh(new THREE.Vector3( 0.0, 0.5,  0.0),0x0000ff);

        let xText = Simulate.createCameraFacingText("X",0xff0000,0.1);
        let yText = Simulate.createCameraFacingText("Y",0x00ff00,0.1);
        let zText = Simulate.createCameraFacingText("Z",0x0000ff,0.1);

        let axes = new THREE.Group();

        axes.add(xArrow);
        axes.add(yArrow);
        axes.add(zArrow);

        axes.add(xText);
        axes.add(yText);
        axes.add(zText);

        xText.geometry.translate(-0.05,-0.05,-0.05)
        yText.geometry.translate(-0.05,-0.05,-0.05)
        zText.geometry.translate(-0.05,-0.05,-0.05)

        xText.position.set(  0.0,  0.0, -0.5);
        yText.position.set(-0.5,  0.0,   0.0);
        zText.position.set(  0.0, 0.55,   0.0);

        axes.position.set(position.x,position.y,position.z);
        Simulate.sim.scene.add(axes);
        return axes;
    }

    static cameraFacingText = [];
    static updateText()
    {
        for(let text of Simulate.cameraFacingText)
        {
            text.quaternion.copy(Simulate.sim.camera.quaternion);
        }
    }
    static createCameraFacingText(text,color,size)
    {
        let geometry = new TextGeometry(text,
            {
                font:hel_font
            }
        );
        geometry.scale(size/100,size/100,0.05*1/1000);
        let textMesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:color}));
        Simulate.sim.scene.add(textMesh);
        Simulate.cameraFacingText.push(textMesh);
        return textMesh;
    }

    /**
     * @param {THREE.Vector3} direction Vector representing the direction (and magnitude) of the arrow
     * @param {Number} color Color of the arrow in hex
     * @param {Number} thickness Diameter of the arrow base
     * @param {Number} endDiameter Diameter of the base of the cone at the end of the arrow
     * @param {Number} endLength Length of the cone at the end of the arrow
     */
    static createArrowMesh(direction,color=0x0000ff,thickness=0.03,endDiameter=thickness+0.05,endLength=0.1)
    {
        let length = direction.length()-endLength;

        let cylinderGeo = new THREE.CylinderGeometry(thickness/2,thickness/2,length);
        cylinderGeo.translate(0,length/2,0);
        let cylinder = new THREE.Mesh(cylinderGeo,new THREE.MeshPhongMaterial({color:color}));

        let coneGeo = new THREE.ConeGeometry(endDiameter/2,endLength);
        let cone = new THREE.Mesh(coneGeo,new THREE.MeshPhongMaterial({color:color}));
        cone.position.y = length;
        cylinder.add(cone);
        Simulate.setArrowDirection(cylinder,direction);
        
        Simulate.sim.scene.add(cylinder);
        // cylinderGeo.translate(0,-0.25/2,0)
        return cylinder;
    }
    static setArrowDirection(arrow,direction)
    {
        let normDirection = direction.clone();
        normDirection.normalize();
        
        
        let r = Math.hypot(normDirection.x,normDirection.z);
        let azimuth = Math.atan2(r,normDirection.y);
    
        let quatX = Math.sin(azimuth/2);
        let quatY = Math.cos(azimuth/2);
    
        arrow.quaternion.set(0,0,0,0);    
        if(r!=0)
        {
            arrow.quaternion.x =  quatX*normDirection.z/r;
            arrow.quaternion.z = -quatX*normDirection.x/r;
        }
        arrow.quaternion.w = quatY;
    }

    static draw_table(parent, table_width, table_length, table_height){
        // draw lines on table
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
        Simulate.sim.table.add(line);

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
            //Simulate.sim.table.add(x_text_mesh)
            Simulate.sim.table.add(text_mesh)

        
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
            Simulate.sim.table.add(text_mesh)

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
            Simulate.sim.table.add(text_mesh)

        }

        return Simulate.sim.table
    }
 
    static align_cam(position) {
        Simulate.target_orbit.rotation_yaw = Simulate.target_orbit.rotation_yaw  % (2*Math.PI);
        if(Simulate.target_orbit.rotation_yaw<0)
        {
            Simulate.target_orbit.rotation_yaw+=Math.PI*2;
        }
        switch(position)
        {
            case(0):
            Simulate.target_orbit.rotation_pitch = 0.0;
            Simulate.target_orbit.rotation_yaw   = Math.round(Simulate.orbit.rotation_yaw/Math.PI)*Math.PI;
            break;

            case(1):
                Simulate.target_orbit.rotation_pitch = 0.0;
                Simulate.target_orbit.rotation_yaw   = Math.round((Simulate.orbit.rotation_yaw-0.5*Math.PI)/Math.PI)*Math.PI+0.5*Math.PI;
            break;

            case(2):
                Simulate.target_orbit.rotation_pitch = -Math.PI/2;
                Simulate.target_orbit.rotation_yaw   = Math.round(2.0*Simulate.orbit.rotation_yaw/Math.PI)*Math.PI/2.0;
            break;

            case(3):
            radius:2
                Simulate.target_orbit.rotation_pitch = Simulate.default_orbit.rotation_pitch ;
                Simulate.target_orbit.rotation_yaw   = Simulate.default_orbit.rotation_yaw   ;
                Simulate.target_orbit.center_x = Simulate.default_orbit.center_x;
                Simulate.target_orbit.center_y = Simulate.default_orbit.center_y;
                Simulate.target_orbit.center_z = Simulate.default_orbit.center_z;
                Simulate.target_orbit.zoom = Simulate.default_orbit.zoom;;
            break;
        }
    }

    static resize()
    {
        Simulate.updateCanSize();
        Simulate.sim.renderer.domElement.width = Simulate.canSize.width;
        Simulate.sim.renderer.domElement.height = Simulate.canSize.height;
        Simulate.sim.camera.aspect = Simulate.canSize.width/Simulate.canSize.height;
        Simulate.sim.camera.updateProjectionMatrix();
        Simulate.sim.renderer.setSize(Simulate.canSize.width,Simulate.canSize.height);

    }
    static updateCanSize()
    {
        if(Simulate.canSize == undefined)
        {
            Simulate.canSize  =
            {
                width: 0,
                height: 0
            };
        }
        Simulate.canSize.width = misc_pane_id.clientWidth-50;
        Simulate.canSize.height = sim_pane_content_id.clientHeight-sim_pane_header_id.clientHeight;
        // Simulate.canSize.height = DDE_DB.persistent_get("dde_window_height") - DDE_DB.persistent_get("top_right_panel_height") - 220;
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

