/**
 * Created by Fry on 10/29/15.
 */
/*
from http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene
    http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/ //kinda complex weather app that uses the web but very good for tutorial info
        http://complexity.zone/cardboard_solarsystem/ //augmented reality usjing threejs and your phone's camera to mix palents and your reality.
            ttrhejs tutorial: http://content.udacity-data.com/cs291/notes/UdacityLesson6Lights.pdf

*/

//import * as THREE from '../../node_modules/three/build/three.module.js'
//import * as THREE from 'three/build/three.module.js'
import * as THREE from 'three'
globalThis.THREE = THREE

import { FontLoader } from 'three/addons/loaders/FontLoader.js'
const a_font_loader = new FontLoader();
//globalThis.hel_font = null
a_font_loader.load(//'node_modules/three/examples/fonts/helvetiker_bold.typeface.json', //THREE doc on this path is woefully insufficient. I patterned this after https://www.youtube.com/watch?v=l7K9AMnesJQ Without "node_modules/" on the front, it doesn't work
                   //'./third_party/helvetiker_bold.typeface',
                   //'../../third_party/helvetiker_bold.typeface',
                   'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', //todo make this not depend on a web connection
    function(font) {
           globalThis.hel_font = font
       }
)

//import THREE_Text2D from 'three-text2d'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//import THREE_GLTFLoader from 'three-gltf-loader' //using the examples folder like this is depricated three/examples/js/loaders/GLTFLoader.js')
//see: https://github.com/johh/three-gltf-loader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

globalThis.Simulate = class Simulate {
    static make_sim_html() {
        return `
        <div style="white-space:nowrap;"> 
        <b>Move Dur: </b><span id="sim_pane_move_dur_id"></span> s
        <button onclick="SimUtils.render_joints_smart()" 
            title="Grab the joint angles from the selection&#13;and change the simulator to show them.&#13;Works on arrays, comma separated arg lists,&#13;and whole instruction calls.&#13;With 3 numbers, treats them as XYZ if they are in range.">
            Render selected joints</button>
        <button onclick="SimBuild.show_dialog()" title="Make additional 3D objects in the Simulator pane.">SimBuild</button>
        <span title="Inspect simulator Details." 
        onclick="SimUtils.inspect_dexter_sim_instance()" 
        style="margin-left:15px;color:blue;cursor:help;font-weight:bold;"> &#9432; </span>       
        
        
        </div>
        <div style="white-space:nowrap;">
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
        `
    }

    static canSize;
    static goalRotation = {x:Math.PI*0.25,y:Math.PI*0.25};
    static goalPosition = {x:0,y:0,z:-1};
    static pRotation = {x:Math.PI*0.25,y:Math.PI*0.25};
    static pPosition = {x:0,y:0,z:-1};

    static sim = {hi_rez: true} //used to store sim "global" vars

//var THREE_font_loader = new THREE.FontLoader();

    static init_simulation_done = false

    static init_simulation_maybe(){
        if(this.init_simulation_done) {}
        else {
            this.init_simulation_done = true //needs to be done first as if init_simulation has already started we don't
             //dont want to start it again.
            this.init_simulation()

        }
    }

    static init_simulation(){
          this.canSize  =
          {
            width: misc_pane_id.clientWidth-50,
            height: DDE_DB.persistent_get("dde_window_height") - DDE_DB.persistent_get("top_right_panel_height") - 220
          };

          try{
            this.init_mouse()
            this.sim.enable_rendering = false
            //for organization: https://discoverthreejs.com/book/first-steps/lights-color-action/
            this.sim.container = sim_graphics_pane_id //a div that contains a canvas
            this.sim.scene  = new THREE.Scene();
            this.sim.scene.name = "scene"
            this.sim.scene.background = new THREE.Color( 0xBBBBBB ) // 0x000000black is the default
            this.createRenderer()
            this.createCamera()
            this.createLights()
            if(this.sim.hi_rez) { this.createMeshGLTF() }
            else                { this.createMeshBoxes() }
            SimBuild.init()
            SimObj.refresh() //does nothing if no SimObjs. Otherwise makes sure they are in the scene and refreshes
          }
          catch(err){
                  console.log("init_simulation errored with: " + err.message + "\n" + err.stack)
          }
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
        const intensity = 0.75;
        const light = new THREE.AmbientLight ( color, intensity );
        this.sim.scene.add ( light );

      //directional light
        const dcolor = 0xFFFFFF;
        const dintensity = 0.5;
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

    static createRenderer(){
        this.sim.renderer = new THREE.WebGLRenderer({ antialias:true });//antialias helps with drawing the table lines. //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
        this.sim.renderer.setSize( //this.sim.container.clientWidth, this.sim.container.clientHeight) //causes no canvas to appear
        this.canSize.width, this.canSize.height);
        //renderer.setPixelRatio( globalThis.devicePixelRatio );  //causes no canvas to appear
        //sim_graphics_pane_id.innerHTML = "" //done in video.js
        this.sim.renderer.shadowMap.enabled = true;
        this.sim.container.appendChild(this.sim.renderer.domElement)
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
        this.gltf_render();		 //	One render here to set the matrices.

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

    //xyz is in dexter coords, ie z is UP
    static create_marker_mesh(xyz, rotxyz) { //radius, length, sides
       let geom = new THREE.ConeGeometry( 0.05,    0.2,     8)
       let mat  = new THREE.MeshPhongMaterial( { color: 0xFF0000} ); //normal material shows different color for each cube face, easier to see the 3d shape.
       let the_mesh = new THREE.Mesh(geom, mat)
       the_mesh.name = "marker"
       the_mesh.position.x = xyz[1] * -1
       the_mesh.position.y = xyz[2]   //input z goes to Y in Three. in THREE is up, so grab the z from the input
       the_mesh.position.z = xyz[0] * -1
       the_mesh.rotation.x = SimUtils.degrees_to_radians(rotxyz[1]) * -1
       the_mesh.rotation.y = SimUtils.degrees_to_radians(rotxyz[2])
       the_mesh.rotation.z = SimUtils.degrees_to_radians(rotxyz[0])
       this.sim.table.add(the_mesh)
    }

//the orig simulator with crude geometry boxes.
    static createMeshBoxes(){
                         //Dexcell dimensions
        this.sim.table_width  = 0.447675,  //width was 1
        this.sim.table_length = 0.6985,  //length was 2
        this.sim.table_height = 0.01905  //height (thickness of Dexcell surface). This is 3/4 of an inch. was:  0.1)
        this.sim.table = this.draw_table(this.sim.scene, this.sim.table_width, this.sim.table_length, this.sim.table_height)

        //this.draw_tool_rack(this.sim.table, 0.1, 0.3, 0.6) //gets in the way of >>> +Y text
        //this.draw_caption(this.sim.table, "Dexter 5-axis Robot Simulation")
        /*this.draw_help("To rotate table, mouse-down then drag.<br/>" +
                  "To zoom, shift-down then mouse-down then drag.<br/>" +
                  "To pan, alt or option down, then mouse-down, then drag.")
                  his is now in the Documentation under Simulate.
        */
        let leg_length = Dexter.LEG_LENGTH //m / 1000000 //(Dexter.LINK1 / 1000000) / 0.8 //2
        let leg_width  = leg_length / 6 //8
        let leg_height = leg_width

        this.sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
        this.sim.J0.name = "J0"
        this.sim.J0.position.y = (this.sim.table_height / 2) + (leg_height / 2) //0.06
        this.sim.J0.position.x = (this.sim.table_length / 2)  //the edge of the table
                             - 0.12425 //the distance from the edge of the table that Dexter is placed
        this.sim.table.add(this.sim.J0)


        this.draw_legs(this.sim.J0, leg_width, leg_length, leg_height)         //0.04, 0.4)

        this.sim.J1 = new THREE.Object3D();
        this.sim.J1.name = "J1"
        this.sim.J1.position.y  = 0.05 //0.1
        this.sim.J0.add(this.sim.J1)

        //this.sim.table.add(this.sim.J1) //scene.add(J1)

        this.sim.LINK1_height  = Dexter.LINK1 //m / 1000000 //0.5
        this.sim.LINK1_width   = Dexter.LINK1_AVERAGE_DIAMETER //m / 1000000 //this.sim.LINK1_height / 1  //0.3
        this.sim.LINK1         = this.draw_link(this.sim.J1, this.sim.LINK1_width, this.sim.LINK1_height)
        this.sim.LINK1.name = "LINK1"
        this.sim.J2            = new THREE.Object3D()
        this.sim.J2.name = "J2"
        this.sim.J2.position.y = this.sim.LINK1_height / 2.0
        //this.sim.J2.position.z = this.sim.LINK1_width  / 2.0
        this.sim.LINK1.add(this.sim.J2)

        //this.sim.J2 = new THREE.Object3D();
        //this.sim.J1.add(this.sim.J2);

        this.sim.LINK2_height  = Dexter.LINK2 //m / 1000000 // 1.0
        this.sim.LINK2_width   = Dexter.LINK2_AVERAGE_DIAMETER //m / 1000000 //this.sim.LINK2_height / 4, //0.2,
        this.sim.LINK2         = draw_link(this.sim.J2, this.sim.LINK2_width, this.sim.LINK2_height)
        this.sim.LINK2.name = "LINK2"
        let circuit_board = this.draw_circuit_board(this.sim.LINK2, this.sim.LINK2_width, this.sim.LINK2_height)
        //LINK2.position.y += 0.12 //extra rise to arm0 to get it to appear to sit on top of the legs.
        this.sim.J3            = new THREE.Object3D();
        this.sim.J3.name = "J3"
        this.sim.J3.position.y = this.sim.LINK2_height / 2.0
        this.sim.LINK2.add(this.sim.J3)

        this.sim.LINK3_height  = Dexter.LINK3 //m / 1000000 //0.9
        this.sim.LINK3_width   = Dexter.LINK3_AVERAGE_DIAMETER //m / 1000000 //this.sim.LINK3_height / 6 // 0.1
        this.sim.LINK3         = this.draw_link(this.sim.J3, this.sim.LINK3_width, this.sim.LINK3_height)
        this.sim.LINK3.name = "LINK3"
        this.sim.J4            = new THREE.Object3D();
        this.sim.J4.name = "J4"
        this.sim.J4.position.y = this.sim.LINK3_height / 2.0
        this.sim.LINK3.add(this.sim.J4)

        this.sim.LINK4_height  = Dexter.LINK4 //m / 1000000 //0.8
        this.sim.LINK4_width   = Dexter.LINK4_AVERAGE_DIAMETER //m / 1000000 //this.sim.LINK4_height / 4 // 0.05
        this.sim.LINK4         = this.draw_link(this.sim.J4, this.sim.LINK4_width, this.sim.LINK4_height)
        this.sim.LINK4.name = "LINK4"
        this.sim.J5            = new THREE.Object3D();
        this.sim.J5.name = "J5"
        this.sim.J5.position.y = this.sim.LINK4_height / 2.0
        this.sim.J5.rotation.z = Math.PI / 2
        this.sim.LINK4.add(this.sim.J5)

        this.sim.LINK5_height = Dexter.LINK5 //m / 1000000 //0.125
        this.sim.LINK5_width  = Dexter.LINK5_AVERAGE_DIAMETER //m / 1000000 //this.sim.LINK5_height / 4 //0.05
        this.sim.LINK5        = this.draw_link(this.sim.J5, this.sim.LINK5_width, this.sim.LINK5_height)
        this.sim.LINK5.name = "LINK5"
        //below only for the "random flailing demo"
    }


    static render_demo = function () {
        if(!this.sim.LINK2_bending) { //initialize demo
            this.sim.LINK2_bending = "+" //start out increasing link2 bending
            this.sim.LINK3_bending = "+"
            this.sim.LINK3_bending = "+"
            this.sim.LINK4_bending = "+"
        }
        if (this.sim.enable_rendering){
            requestAnimationFrame( this.render_demo );
            this.sim.J1.rotation.y += 0.001 //twisting the base.
            //ossolate arm0 bending
            if (this.sim.LINK2_bending == "+") {
                if (this.sim.J2.rotation.z > 0.5) {
                    this.sim.LINK2_bending = "-"
                    this.sim.J2.rotation.z -= 0.01
                }
                else {
                    this.sim.J2.rotation.z += 0.01
                }
            }
            //we are in "-" bend mode
            else if(this.sim.J2.rotation.z < -0.5){
                this.sim.LINK2_bending = "+"
                this.sim.J2.rotation.z += 0.01
            }
            else {
                this.sim.J2.rotation.z -= 0.01
            }

            if (this.sim.LINK3_bending == "+") {
                if (this.sim.J3.rotation.z > 2.5) {
                    this.sim.LINK3_bending = "-"
                    this.sim.J3.rotation.z -= 0.01
                }
                else {
                    this.sim.J3.rotation.z += 0.01
                }
            }
            //we are in "-" bend mode
            else if(this.sim.J3.rotation.z < -2.5){
                this.sim.LINK3_bending = "+"
                this.sim.J3.rotation.z += 0.01
            }
            else {
                this.sim.J3.rotation.z -= 0.01
            }

            if (this.sim.LINK4_bending == "+") {
                if (this.sim.J4.rotation.z > 2.5) {
                    this.sim.LINK4_bending = "-"
                    this.sim.J4.rotation.z -= 0.01
                }
                else {
                    this.sim.J4.rotation.z += 0.01
                }
            }
            //we are in "-" bend mode
            else if(this.sim.J4.rotation.z < -2.5){
                this.sim.LINK4_bending = "+"
                this.sim.J4.rotation.z += 0.01
            }
            else {
                this.sim.J4.rotation.z -= 0.01
            }

            this.sim.J5.rotation.x += 0.02 //5th axis end effector twist

            //rotate table when user clicks down and drags.
            /*if (this.sim.mouseDown){
                this.sim_handle_mouse_move()
            }*/
            //this.sim.renderer.render(this.sim.scene, this.sim.camera);
        }
    };

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
                Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
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

           /* //______Y label______
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
            text_mesh.translateZ(0)     //-0.2
            this.sim.table.add(text_mesh)
            */
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
        /*let y_text_mesh = new THREE_Text2D.MeshText2D(">> +Y", { align: THREE_Text2D.textAlign.left, font: '30px Arial', fillStyle: '#00FF00', antialias: true })
        y_text_mesh.name = "y_axis_label"
        y_text_mesh.scale.set(0.007, 0.007, 0.007) // = THREE.Vector3(0.1, 0.1, 0.1)
        y_text_mesh.position.set(-0.2, 0.055, 0.11) //= THREE.Vector3(20, 8, -10)
                            //For the XYZ in THREE (not in dde & robot)
                            //Three +x is further away from the tool rack in the horiz plane
                            // Three +y is up on the screen, DDE Z. the 0.05 val is just barely above the table surface
                            //+z is in horiz plane towards the camera, orthogonal to x
                            //dexter has +z pointing up
        //text_mesh.position.y = 8 //0, -1
        //text_mesh.position.z = -10
        y_text_mesh.rotation.x = Math.PI / -2 //-1.5708 //90 degrees, now parallel to plane of table with the letters readable from the top
        y_text_mesh.rotation.z = Math.PI
        this.sim.table.add(y_text_mesh)

        let z_text_mesh = new THREE_Text2D.MeshText2D(">> +Z", { align: THREE_Text2D.textAlign.left, font: '20px Arial', fillStyle: '#00FF00', antialias: true })
        z_text_mesh.name = "z_axis_label"
        z_text_mesh.scale.set(0.007, 0.007, 0.007) // = THREE.Vector3(0.1, 0.1, 0.1)
        z_text_mesh.position.set(0.4, //1,
                                 0.055,
                                 0.2 //0 //-0.3) //= THREE.Vector3(20, 8, -10)
                                 )
        //For the XYZ in THREE (not in dde & robot)
        //+x is further away from the tool rack in the horiz plane
        // y is up and down on the screen
        //+z is in horiz plane towards the camera, orthogonal to x
        //text_mesh.position.y = 8 //0, -1
        //text_mesh.position.z = -10
        z_text_mesh.rotation.x = Math.PI //0 //-1.5708 //90 degrees, now parallel to plane of table with the letters readable from the top
        z_text_mesh.rotation.z = Math.PI / -2 //-1.5708
        z_text_mesh.rotation.y = -Math.PI / -2 //was +Math
        this.sim.table.add(z_text_mesh)

        let table_bottom_text_mesh = new THREE_Text2D.MeshText2D("Dexcell", { align: THREE_Text2D.textAlign.left, font: '20px Arial', fillStyle: '#FF0000', antialias: true })
        table_bottom_text_mesh.name = "table_bottom_label"
        table_bottom_text_mesh.scale.set(0.007, 0.007, 0.007) // = THREE.Vector3(0.1, 0.1, 0.1)
        table_bottom_text_mesh.position.set(0.35, //0.4  1,
            0.01, //0.055,
            0.22 //0.2 //0 //-0.3) //= THREE.Vector3(20, 8, -10)
        )
        table_bottom_text_mesh.rotation.x = 0 //Math.PI //0 //-1.5708 //90 degrees, now parallel to plane of table with the letters readable from the top
        table_bottom_text_mesh.rotation.z = 0 //Math.PI / -2 //-1.5708
        table_bottom_text_mesh.rotation.y = -Math.PI / -2 //was +Math
        this.sim.table.add(table_bottom_text_mesh)
*/
        //todo dde4 something like the below applied to the labels of text above
        //might work for dde4
        //see https://threejs.org/docs/#examples/en/geometries/TextGeometry
        //note that helvetiker_regular.typeface.json is in
        //dde4 node_modules/three/examples/fonts/helvetiker_regular.typeface.json
        /*THREE_font_loader.load( 'user_tools/helvetiker_regular.typeface.json', function ( font ) {
            let text_geometry = new THREE.TextGeometry( 'Hello three.js and something much longer to see!', {
                font: font,
                size: 80,
                height: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            } )
            let text_materialt    = new THREE.MeshBasicMaterial( { color: 0xFFFFFF} );
            let table_text_mesh  = new THREE.Mesh(text_geometry, text_materialt)
            //this.sim.table.add(table_text);
            table_text_mesh.position.y  = 0 //-0.4
            table_text_mesh.position.x  = 0 //-0.8
            parent.add(table_text_mesh);
        } )*/

        return this.sim.table
    }

    //now not used
    static draw_tool_rack(parent, width, height, depth){
        var geometryt    = new THREE.BoxGeometry(width, height, depth);
        var materialt    = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube fface, easier to see the 3d shape.
        this.sim.rack         = new THREE.Mesh(geometryt, materialt)
        this.sim.rack.position.y  = 0.2
        this.sim.rack.position.x  = -0.9
        this.sim.rack.name = "rack"
        parent.add(this.sim.rack)
        var text2 = document.createElement('div');
        text2.style.position = 'absolute';
        text2.style.color = "white"
        text2.style.fontSize = "20px"
        text2.style.backgroundColor = "black";
        text2.innerHTML  = "Tool<br/>Rack";
        text2.style.top  = 500 + 'px';
        text2.style.left = text2.style.left = ((globalThis.innerWidth / 2) - 330) + 'px' //keeps text just to left of took rack even if width of window is resized.
        sim_graphics_pane_id.appendChild(text2);
        return this.sim.rack
    }

    static draw_legs(parent, leg_width, leg_length, leg_height) {
        var geometryleg = new THREE.BoxGeometry(leg_length, leg_width, leg_height);
        var materialleg = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube face, easier to see the 3d shape.
        var angle_between_legs_in_rad = (2 * Math.PI) / 6  //360 / 6 = 60 degrees //angles are in radians. 2PI rad = 360 degrees
        for (var i = 0; i < 6; i++) {
            var leg = new THREE.Mesh(geometryleg, materialleg);
            leg.name = "leg" + i
            leg.position.x = leg_length / 2.0
            var pivotleg = new THREE.Object3D();
            pivotleg.name = "pivotleg" + i
            pivotleg.rotation.y = angle_between_legs_in_rad * i
            pivotleg.add(leg)
            parent.add(pivotleg)
        }
    }

    static draw_link (parent, width, height){
        var geometry = new THREE.BoxGeometry(width, height, width);
        var material = new THREE.MeshNormalMaterial({}); //normal material shows different color for each cube face, easier to see the 3d shape.
        //var material = THREE.MeshLambertMaterial( { color: 0xFF0000 } ); errors in threejs code :this.setValues is not a funciton"
        //var material    = new THREE.MeshBasicMaterial( { color: 0xAAFFAA} ); //doesn't error but just shows 1 color for whole object and no change with directional lighting.

        var arm = new THREE.Mesh(geometry, material);
        arm.position.y = (height / 2.0) - (width / 2.0)
        parent.add(arm)
        return arm
    }

    //oarent in Link2
    static draw_circuit_board (parent, link2_width, link_2_height){
        var geometry = new THREE.BoxGeometry(link2_width, link_2_height / 2, link2_width / 2);
        var material = new THREE.MeshBasicMaterial( { color: 0x941100} ) //maroon color of the circuit board
        //var material = THREE.MeshLambertMaterial( { color: 0xFF0000 } ); errors in threejs code :this.setValues is not a funciton"
        //var material    = new THREE.MeshBasicMaterial( { color: 0xAAFFAA} ); //doesn't error but just shows 1 color for whole object and no change with directional lighting.

        var circuit_board = new THREE.Mesh(geometry, material);
        circuit_board.position.y = 0 //(link_2_height / 8.0) //- (link2_width / 2.0)
        circuit_board.position.x = 0 //link2_width * 2  //this should probably be 0
        circuit_board.position.z = link2_width * -0.7
        parent.add(circuit_board)
        return circuit_board
    }



    static draw_caption(parent, text){
        var text2 = document.createElement('div');
        text2.style.position = 'absolute';
        //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
        //text2.style.width = 100;
        //text2.style.height = 100;
        text2.style.color = "white"
        text2.style.fontSize = "36px"
        text2.style.backgroundColor = "black";
        text2.innerHTML = text;
        text2.style.top = 675 + 'px';
        text2.style.left = ((globalThis.innerWidth / 2) - 200) + 'px'  //keeps teh caption centerd under the table despite differnt window widths. //140 + 'px';
        sim_graphics_pane_id.appendChild(text2);

        /* uysing 3d text is busted. Maybe becuse the size ahd height are less than 1?
         var geometry = new THREE.TextGeometry(text, {size:0.1, height:0.4});  //doc at http://threejs.org/docs/#Reference/Extras.Geometries/TextGeometry
         var material = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube face, easier to see the 3d shape.
         var textobj = new THREE.Mesh(geometry, material);
         textobj.position.y = -0.05 //(height / 2.0) - (width / 2.0)
         parent.add(textobj)
         return textobj
         */
    }

    static draw_help(text) {
        var text2 = document.createElement('div');
        text2.style.position = 'absolute';
        text2.style.color = "white"
        text2.style.fontSize = "14px"
        text2.style.backgroundColor = "black";
        text2.innerHTML = text;
        text2.style.top = 45 + 'px';
        text2.style.left = 10 + 'px' //((globalThis.innerWidth / 2) - 200) + 'px'  //keeps teh caption centerd under the table despite differnt window widths. //140 + 'px';
        sim_graphics_pane_id.appendChild(text2);
    }


    //_________STL VIEWER ________
    static stl_init_viewer(){
            this.stl_init_mouse()
            this.sim.enable_rendering = false
            this.sim.scene  = new THREE.Scene();
            this.sim.camera = new THREE.PerspectiveCamera(75, //75,
                globalThis.innerWidth / globalThis.innerHeight, 0.1, 1000);
            this.sim.camera.position.z = 2; //2
            this.sim.camera.position.y = 1
            this.sim.camera.zoom.zoom = 4 //0.79 //has no effect.

            //camera.position.set( -15, 10, 15 );
            //camera.lookAt( scene.position );

            this.sim.renderer = new THREE.WebGLRenderer();
            this.sim.renderer.setSize( globalThis.innerWidth, globalThis.innerHeight );
            sim_graphics_pane_id.innerHTML = "" //clear out the previous contents
            sim_graphics_pane_id.appendChild(this.sim.renderer.domElement);
    }

    static stl_render(){
        requestAnimationFrame(this.stl_render)
        if (this.sim.mouseDown){
            this.stl_sim_handle_mouse_move()
        }
        this.sim.renderer.render(this.sim.scene, this.sim.camera);
    }

    static fbx_render(){
        requestAnimationFrame(this.fbx_render)
        if (this.sim.mouseDown){
            this.stl_sim_handle_mouse_move()
        }
        this.sim.renderer.render(this.sim.scene, this.sim.camera) //don't pass camera as 2nd arg because the fbx file already has a camera in it.
    }

    static gltf_render(){
        console.log("top gltf_render")
    //  requestAnimationFrame(this.gltf_render)
    //  if (this.sim.mouseDown){
    //      this.stl_sim_handle_mouse_move()
    //  }
        //Must use Simulate. and not this.  below because requestAnimationFrame
        //calls its arg fn without a "this" of Simulate
        //so must make gltf_render not need a "this".
        Simulate.updateRotation(); //unnecessary jul 26. 2023
        Simulate.updatePosition(); //unnecessary jul 26. 2023
        Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
        //requestAnimationFrame(Simulate.gltf_render)
    }

    static stl_init_mouse(){
        this.sim.mouseX_at_mouseDown    = 0
        this.sim.mouseY_at_mouseDown    = 0
        //this.sim.tableX_at_mouseDown    = 0
        //this.sim.tableY_at_mouseDown    = 0
        this.sim.zoom_at_mouseDown      = 1
        this.sim.rotationX_at_mouseDown = 0
        this.sim.rotationY_at_mouseDown = 0

        sim_graphics_pane_id.addEventListener("mousedown", function(event) {
            Simulate.sim.mouseDown              = true
            Simulate.sim.shiftDown              = event.shiftKey
            Simulate.sim.altDown                = event.altKey
            Simulate.sim.mouseX_at_mouseDown    = event.clientX
            Simulate.sim.mouseY_at_mouseDown    = event.clientY
            //Simulate.sim.tableX_at_mouseDown    = this.sim.table.position.x
            //Simulate.sim.tableY_at_mouseDown    = this.sim.table.position.y
            Simulate.sim.zoom_at_mouseDown      = Simulate.sim.camera.zoom
            Simulate.sim.rotationX_at_mouseDown = Simulate.sim.table.rotation.x
            Simulate.sim.rotationY_at_mouseDown = Simulate.sim.table.rotation.y
        }, false);

        sim_graphics_pane_id.addEventListener('mousemove', function(event) {
            if (Simulate.sim.mouseDown){
                Simulate.sim.mouseX = event.clientX;
                Simulate.sim.mouseY = event.clientY;
                Simulate.stl_sim_handle_mouse_move()
                Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
            }
        }, false);

        sim_graphics_pane_id.addEventListener("mouseup", function(event) {
            Simulate.sim.mouseDown = false
            Simulate.sim.shiftDown = false
            Simulate.sim.altDown   = false
        }, false);
    }
//from https://stackoverflow.com/questions/27095251/how-to-rotate-a-three-perspectivecamera-around-on-object
    static stl_camera_angle = 0;
    static stl_camera_radius = 500;
    static stl_sim_handle_mouse_move(){
        var mouseX_diff =  this.sim.mouseX - this.sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
        var mouseY_diff =  this.sim.mouseY - this.sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
        if (this.sim.shiftDown){
            //alert(camera.zoom)  //camera.zoom starts at 1
            let zoom_increment = mouseX_diff / 100.0
            this.sim.camera.zoom = this.sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
            this.sim.camera.updateProjectionMatrix()
        }
        else if (this.sim.altDown){
            let panX_inc = mouseX_diff / 100
            let panY_inc = mouseY_diff / 100
            this.sim.camera.position.x =  this.sim.camera.position.x + panX_inc
            this.sim.camera.position.y =  this.sim.camera.position.y - panY_inc
        }
        else {
            //this.sim.table.rotation.x = this.sim.rotationX_at_mouseDown + (mouseY_diff / 100)
            //this.sim.table.rotation.y = this.sim.rotationY_at_mouseDown + (mouseX_diff / 100)
            this.sim.camera.position.x = this.stl_camera_radius * Math.cos( this.stl_camera_angle );
            this.sim.camera.position.z = this.stl_camera_radius * Math.sin( this.stl_camera_angle );
            this.stl_camera_angle += 0.01;
        }
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
} //end class Simulate

