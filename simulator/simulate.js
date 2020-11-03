/**
 * Created by Fry on 10/29/15.
 */
/*
from http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene
    http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/ //kinda complex weather app that uses the web but very good for tutorial info
        http://complexity.zone/cardboard_solarsystem/ //augmented reality usjing threejs and your phone's camera to mix palents and your reality.
            ttrhejs tutorial: http://content.udacity-data.com/cs291/notes/UdacityLesson6Lights.pdf

*/

//canvas { width: 100%; height: 100% }

var THREE = require('three')
var THREE_Text2D = require('three-text2d')
var THREE_GLTFLoader = require('three-gltf-loader') //using the examples folder like this is depricated three/examples/js/loaders/GLTFLoader.js')


var sim = {} //used to store sim "global" vars
sim.hi_rez = true

//var THREE_font_loader = new THREE.FontLoader();
var init_simulation_done = false
function init_simulation_maybe(){
    if(init_simulation_done) {}
    else {
        init_simulation_done = true //needs to be done first as if init_simulation has already started we don't
         //dont want to start it again.
        init_simulation()

    }
}
function init_simulation(){
  try{
    init_mouse()
    sim.enable_rendering = false
    //for organization: https://discoverthreejs.com/book/first-steps/lights-color-action/
    sim.container = sim_graphics_pane_id //a div that contains a canvas
    sim.scene  = new THREE.Scene();
    sim.scene.name = "scene"
    sim.scene.background = new THREE.Color( 0xBBBBBB ) // 0x000000black is the default
    createRenderer()
    createCamera()
    createLights()
    if(sim.hi_rez) { createMeshGLTF() }
    else           { createMeshBoxes() }
  }
  catch(err){
          console.log("init_simulation errored with: " + err.stack)
  }
}

function createCamera(){
    //https://discoverthreejs.com/book/first-steps/first-scene/
    sim.camera = new THREE.PerspectiveCamera(
          75, //field of view in degrees. determines ratio of far clipping region is to near clipping region
          window.innerWidth / window.innerHeight, //aspect ratio, If not same as canvas width and height,
                                                  //the image will be distorted.
          0.1, //1, //0.1,   //distance between camera and near clipping plane. Must be > 0.
          4 //4      // 3 is too small and clips the table. was: 1000   //distance between camera an far clipping plane. Must be > near.
          );
    sim.camera.name = "camera"
    sim.camera.position.x = 0  //to the right of the screen.
    sim.camera.position.y = 1  //up is positive
    sim.camera.position.z = 2  //2; //toward the viewer (out of the screen) is positive. 2
    sim.camera.zoom = 1        //1 is the default.  0.79 //has no effect.

    //new(75, width/height, 0.1, 4) pos[0, 1, 2]

    //camera.position.set( -15, 10, 15 );
    //camera.lookAt( scene.position );
}

function createLights(){
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
    sim.scene.add ( light );

  //directional light
    const dcolor = 0xFFFFFF;
    const dintensity = 0.5;
    //	const intensity = 0.35;		//	To see the helpers easier.
    const dlight = new THREE.DirectionalLight ( dcolor, dintensity );
    dlight.position.set ( 4, 4, 2 );
    dlight.target.name = "directional_light_target"
    dlight.target.position.set ( 0, 0, 0 );
    dlight.castShadow = true;
    sim.scene.add ( dlight );
    sim.scene.add ( dlight.target );

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
		sim.scene.add ( light ); }

	//	Directional Light
	//
	{ 	const color = 0xFFFFFF;
		const intensity = 0.5;
		const light = new THREE.DirectionalLight ( color, intensity );
		light.position.set ( 4, 4, 2 );
		light.target.position.set ( 0, 0, 0 );
	//	light.castShadow = true;
		sim.scene.add ( light );
		sim.scene.add ( light.target ); }
*/
}

function createRenderer(){
    sim.renderer = new THREE.WebGLRenderer({ antialias:true });//antialias helps with drawing the table lines. //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
    sim.renderer.setSize( //sim.container.clientWidth, sim.container.clientHeight) //causes no canvas to appear
                           window.innerWidth, window.innerHeight );
    //renderer.setPixelRatio( window.devicePixelRatio );  //causes no canvas to appear
    //sim_graphics_pane_id.innerHTML = "" //done in video.js
    sim.renderer.shadowMap.enabled = true;
    sim.container.appendChild(sim.renderer.domElement)
}

//simulator using actual Dexter CAD. the GLTF was created by using the
//fusion 360 exporter of FBX, then converting that to .gltf, then
//processing in video.js to clean it up.
function createMeshGLTF(){
    sim.table_width  = 0.447675,  //width was 1
    sim.table_length = 0.6985,  //length was 2
    sim.table_height = 0.01905  //height (thickness of Dexcell surface). This is 3/4 of an inch. was:  0.1)
    sim.table = draw_table(sim.scene, sim.table_width, sim.table_length, sim.table_height)

    sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
    sim.J0.rotation.y = Math.PI //radians for 180 degrees
    sim.J0.name = "J0"
    sim.J0.position.y = (sim.table_height / 2) //+ (leg_height / 2) //0.06 //for orig boxes model, leg)height was positive, but for legless dexter mounted on table, its probably 0
    sim.J0.position.x = (sim.table_length / 2)  //the edge of the table
                         - 0.12425 //the distance from the edge of the table that Dexter is placed
    sim.table.add(sim.J0)

    let loader = new THREE_GLTFLoader()

    loader.load(__dirname + "/HDIMeterModel.gltf", //select_val,
                fix_up_gltf_and_add,
                undefined,
                function (err) {
                    console.error( err );
                }
    )

}

//copied from video_js with slight mods
function fix_up_gltf_and_add(gltf_object3D) {
//              sim.scene.add(gltf.scene)
    let root = gltf_object3D.scene;
    let c0 = root.children[0]
    c0.scale.set(0.001, 0.001, 0.001);
    //	Remove imported lights, cameras. Just want Object3D.
    let objs = [];
    c0.children.forEach ( c => {
        if ( c.constructor.name === 'Object3D' ) {
            objs.push(c); } } );
    c0.children = objs;
    //	sim.scene.add(root)
    sim.J0.add(root) //fry added in J0 to shift dexter to back of the table.

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

    set_joints_in_sim()
}

//copied from video.js. for fixing gltf child-parent relationships.
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
}

function set_joints_in_sim(){
    sim.LINK1 = sim.scene.getObjectByName("DexterHDI_MainPivot_KinematicAssembly_v21")
    sim.LINK2 = sim.scene.getObjectByName("DexterHDI_Link2_KinematicAssembly_v51")
    sim.LINK3 = sim.scene.getObjectByName("DexterHDI_Link3_KinematicAssembly_v21")
    sim.LINK4 = sim.scene.getObjectByName("DexterHDI_Link4_KinematicAssembly_v31")
    sim.LINK5 = sim.scene.getObjectByName("DexterHDI_Link5_KinematicAssembly_v21")
    sim.LINK6 = sim.scene.getObjectByName("DexterHDI_Link6_KinematicAssembly_v31")
    sim.LINK7 = sim.scene.getObjectByName("DexterHDI_Link7_KinematicAssembly_v21")

    sim.J1 = sim.LINK1
    sim.J2 = sim.LINK2
    sim.J3 = sim.LINK3
    sim.J4 = sim.LINK4
    sim.J5 = sim.LINK5
    sim.J6 = sim.LINK6
    sim.J7 = sim.LINK7
}

//xyz is in dexter coords, ie z is UP
function create_marker_mesh(xyz, rotxyz) { //radius, length, sides
   let geom = new THREE.ConeGeometry( 0.05,    0.2,     8)
   let mat  = new THREE.MeshPhongMaterial( { color: 0xFF0000} ); //normal material shows different color for each cube face, easier to see the 3d shape.
   let the_mesh = new THREE.Mesh(geom, mat)
   the_mesh.name = "marker"
   the_mesh.position.x = xyz[1] * -1
   the_mesh.position.y = xyz[2]   //input z goes to Y in Three. in THREE is up, so grab the z from the input
   the_mesh.position.z = xyz[0] * -1
   the_mesh.rotation.x = degrees_to_radians(rotxyz[1]) * -1
   the_mesh.rotation.y = degrees_to_radians(rotxyz[2])
   the_mesh.rotation.z = degrees_to_radians(rotxyz[0])
   sim.table.add(the_mesh)

}

//the orig simulator with crude geometry boxes.
function createMeshBoxes(){
                     //Dexcell dimensions
    sim.table_width  = 0.447675,  //width was 1
    sim.table_length = 0.6985,  //length was 2
    sim.table_height = 0.01905  //height (thickness of Dexcell surface). This is 3/4 of an inch. was:  0.1)
    sim.table = draw_table(sim.scene, sim.table_width, sim.table_length, sim.table_height)

    //draw_tool_rack(sim.table, 0.1, 0.3, 0.6) //gets in the way of >>> +Y text
    //draw_caption(sim.table, "Dexter 5-axis Robot Simulation")
    /*draw_help("To rotate table, mouse-down then drag.<br/>" +
              "To zoom, shift-down then mouse-down then drag.<br/>" +
              "To pan, alt or option down, then mouse-down, then drag.")
              his is now in the Documentation under Simulate.
    */
    let leg_length = Dexter.LEG_LENGTH //m / 1000000 //(Dexter.LINK1 / 1000000) / 0.8 //2
    let leg_width  = leg_length / 6 //8
    let leg_height = leg_width

    sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
    sim.J0.name = "J0"
    sim.J0.position.y = (sim.table_height / 2) + (leg_height / 2) //0.06
    sim.J0.position.x = (sim.table_length / 2)  //the edge of the table
                         - 0.12425 //the distance from the edge of the table that Dexter is placed
    sim.table.add(sim.J0)


    draw_legs(sim.J0, leg_width, leg_length, leg_height)         //0.04, 0.4)

    sim.J1 = new THREE.Object3D();
    sim.J1.name = "J1"
    sim.J1.position.y  = 0.05 //0.1
    sim.J0.add(sim.J1)

    //sim.table.add(sim.J1) //scene.add(J1)

    sim.LINK1_height  = Dexter.LINK1 //m / 1000000 //0.5
    sim.LINK1_width   = Dexter.LINK1_AVERAGE_DIAMETER //m / 1000000 //sim.LINK1_height / 1  //0.3
    sim.LINK1         = draw_link(sim.J1, sim.LINK1_width, sim.LINK1_height)
    sim.LINK1.name = "LINK1"
    sim.J2            = new THREE.Object3D()
    sim.J2.name = "J2"
    sim.J2.position.y = sim.LINK1_height / 2.0
    //sim.J2.position.z = sim.LINK1_width  / 2.0
    sim.LINK1.add(sim.J2)

    //sim.J2 = new THREE.Object3D();
    //sim.J1.add(sim.J2);

    sim.LINK2_height  = Dexter.LINK2 //m / 1000000 // 1.0
    sim.LINK2_width   = Dexter.LINK2_AVERAGE_DIAMETER //m / 1000000 //sim.LINK2_height / 4, //0.2,
    sim.LINK2         = draw_link(sim.J2, sim.LINK2_width, sim.LINK2_height)
    sim.LINK2.name = "LINK2"
    let circuit_board = draw_circuit_board(sim.LINK2, sim.LINK2_width, sim.LINK2_height)
    //LINK2.position.y += 0.12 //extra rise to arm0 to get it to appear to sit on top of the legs.
    sim.J3            = new THREE.Object3D();
    sim.J3.name = "J3"
    sim.J3.position.y = sim.LINK2_height / 2.0
    sim.LINK2.add(sim.J3)

    sim.LINK3_height  = Dexter.LINK3 //m / 1000000 //0.9
    sim.LINK3_width   = Dexter.LINK3_AVERAGE_DIAMETER //m / 1000000 //sim.LINK3_height / 6 // 0.1
    sim.LINK3         = draw_link(sim.J3, sim.LINK3_width, sim.LINK3_height)
    sim.LINK3.name = "LINK3"
    sim.J4            = new THREE.Object3D();
    sim.J4.name = "J4"
    sim.J4.position.y = sim.LINK3_height / 2.0
    sim.LINK3.add(sim.J4)

    sim.LINK4_height  = Dexter.LINK4 //m / 1000000 //0.8
    sim.LINK4_width   = Dexter.LINK4_AVERAGE_DIAMETER //m / 1000000 //sim.LINK4_height / 4 // 0.05
    sim.LINK4         = draw_link(sim.J4, sim.LINK4_width, sim.LINK4_height)
    sim.LINK4.name = "LINK4"
    sim.J5            = new THREE.Object3D();
    sim.J5.name = "J5"
    sim.J5.position.y = sim.LINK4_height / 2.0
    sim.J5.rotation.z = Math.PI / 2
    sim.LINK4.add(sim.J5)

    sim.LINK5_height = Dexter.LINK5 //m / 1000000 //0.125
    sim.LINK5_width  = Dexter.LINK5_AVERAGE_DIAMETER //m / 1000000 //sim.LINK5_height / 4 //0.05
    sim.LINK5        = draw_link(sim.J5, sim.LINK5_width, sim.LINK5_height)
    sim.LINK5.name = "LINK5"
    //below only for the "random flailing demo"
}


var render_demo = function () {
    if(!sim.LINK2_bending) { //initialize demo
        sim.LINK2_bending = "+" //start out increasing link2 bending
        sim.LINK3_bending = "+"
        sim.LINK3_bending = "+"
        sim.LINK4_bending = "+"
    }
    if (sim.enable_rendering){
        requestAnimationFrame( render_demo );
        sim.J1.rotation.y += 0.001 //twisting the base.
        //ossolate arm0 bending
        if (sim.LINK2_bending == "+") {
            if (sim.J2.rotation.z > 0.5) {
                sim.LINK2_bending = "-"
                sim.J2.rotation.z -= 0.01
            }
            else {
                sim.J2.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J2.rotation.z < -0.5){
            sim.LINK2_bending = "+"
            sim.J2.rotation.z += 0.01
        }
        else {
            sim.J2.rotation.z -= 0.01
        }

        if (sim.LINK3_bending == "+") {
            if (sim.J3.rotation.z > 2.5) {
                sim.LINK3_bending = "-"
                sim.J3.rotation.z -= 0.01
            }
            else {
                sim.J3.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J3.rotation.z < -2.5){
            sim.LINK3_bending = "+"
            sim.J3.rotation.z += 0.01
        }
        else {
            sim.J3.rotation.z -= 0.01
        }

        if (sim.LINK4_bending == "+") {
            if (sim.J4.rotation.z > 2.5) {
                sim.LINK4_bending = "-"
                sim.J4.rotation.z -= 0.01
            }
            else {
                sim.J4.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J4.rotation.z < -2.5){
            sim.LINK4_bending = "+"
            sim.J4.rotation.z += 0.01
        }
        else {
            sim.J4.rotation.z -= 0.01
        }

        sim.J5.rotation.x += 0.02 //5th axis end effector twist

        //rotate table when user clicks down and drags.
        if (sim.mouseDown){
            sim_handle_mouse_move()
        }
        sim.renderer.render(sim.scene, sim.camera);
    }
};

function sim_handle_mouse_move(){
    var mouseX_diff =  sim.mouseX - sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
    var mouseY_diff =  sim.mouseY - sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
    if (sim.shiftDown){
        //alert(camera.zoom)  //camera.zoom starts at 1
        var zoom_increment = mouseX_diff / 100.0
        sim.camera.zoom = sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
        sim.camera.updateProjectionMatrix()
    }
    else if (sim.altDown){
        var panX_inc = mouseX_diff / 100
        var panY_inc = mouseY_diff / 100
        sim.table.position.x =  sim.tableX_at_mouseDown + panX_inc
        sim.table.position.y =  sim.tableY_at_mouseDown - panY_inc
    }
    else {
        sim.table.rotation.x = sim.rotationX_at_mouseDown + (mouseY_diff / 100)
        sim.table.rotation.y = sim.rotationY_at_mouseDown + (mouseX_diff / 100)
    }
}

// 2 * Math.PI  radians == 360 degrees
// (2 * Math.PI) / 360  == 0.017453292519943295  radians per degree
// 0.00000484813681109536 radians per arc_second
function arc_seconds_to_radians(arc_seconds){
    return 0.00000484813681109536 * arc_seconds
}

function degrees_to_radians(degrees){
    return (Math.PI * degrees ) / 180
}

//set up drag mouse to rotate table
function init_mouse(){
    sim.mouseX_at_mouseDown    = 0
    sim.mouseY_at_mouseDown    = 0
    sim.tableX_at_mouseDown    = 0
    sim.tableY_at_mouseDown    = 0
    sim.zoom_at_mouseDown      = 1
    sim.rotationX_at_mouseDown = 0
    sim.rotationY_at_mouseDown = 0

    sim_graphics_pane_id.addEventListener("mousedown", function(event) {
        sim.mouseDown              = true
        sim.shiftDown              = event.shiftKey
        sim.altDown                = event.altKey
        sim.mouseX_at_mouseDown    = event.clientX
        sim.mouseY_at_mouseDown    = event.clientY
        sim.tableX_at_mouseDown    = sim.table.position.x
        sim.tableY_at_mouseDown    = sim.table.position.y
        sim.zoom_at_mouseDown      = sim.camera.zoom
        sim.rotationX_at_mouseDown = sim.table.rotation.x
        sim.rotationY_at_mouseDown = sim.table.rotation.y
    }, false);

    sim_graphics_pane_id.addEventListener('mousemove', function(event) {
        if (sim.mouseDown){
            sim.mouseX = event.clientX;
            sim.mouseY = event.clientY;
            sim_handle_mouse_move()
            sim.renderer.render(sim.scene, sim.camera);
        }
    }, false);

    sim_graphics_pane_id.addEventListener("mouseup", function(event) {
        sim.mouseDown = false
        sim.shiftDown = false
        sim.altDown   = false
    }, false);
}

function draw_table(parent, table_width, table_length, table_height){
    var geometryt    = new THREE.BoxGeometry(table_length, table_height, table_width);
    var materialt    = new THREE.MeshPhongMaterial( { color: 0xFFFFFF} ); //normal material shows different color for each cube face, easier to see the 3d shape.
    sim.table        = new THREE.Mesh(geometryt, materialt)
    sim.table.name = "table"
    sim.table.receiveShadow = true;
    sim.table.position.x = -2.4 //-3.85
    sim.table.position.y = 2 //2.47
    sim.table.position.z = -1 //0

    sim.table.rotation.x = 1 //0 //0.53
    sim.table.rotation.y = 5 //5 shows table with +x to right, and +y away from camera. 1.8 //0 //-0.44
    sim.table.rotation.z = 0
    parent.add(sim.table)

    //draw lines on table
    var sizew = table_width
    let step = 0.05 //dexcell holes are 0.25 apart and 0,0 is in the CENTER of one of the cells
                    // that has 4 holes as corners 0.2;
    var sizel = table_length
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: 'gray'});
    var line_height = table_height //- 0.045
    for ( var i = - sizew / 2.0; i <= sizew / 2.0; i += step) {
        geometry.vertices.push(new THREE.Vector3(-sizel / 2.0, line_height, i));  //( - size, - 0.04, i ));
        geometry.vertices.push(new THREE.Vector3(sizel / 2.0, line_height, i));
    }
    for ( var i = - sizel / 2.0; i <= sizel / 2.0; i += step){
        geometry.vertices.push(new THREE.Vector3(i,  line_height,  -sizew / 2.0));  //( - size, - 0.04, i ));
        geometry.vertices.push(new THREE.Vector3(i , line_height, sizew / 2.0));

        //geometry.vertices.push(new THREE.Vector3( i,  line_height, - size ));
        //geometry.vertices.push(new THREE.Vector3( i,  line_height, size ));
    }
    var line = new THREE.LineSegments( geometry, material ); //new THREE.Line( geometry, material, THREE.LinePieces);
    line.name = "table_line_segments"
    sim.table.add(line);

    let x_text_mesh = new THREE_Text2D.MeshText2D(">> +X", { align: THREE_Text2D.textAlign.left, font: '30px Arial', fillStyle: '#00FF00', antialias: true })
    x_text_mesh.name = "x_axis_label"
    x_text_mesh.scale.set(0.007, 0.007, 0.007) // = THREE.Vector3(0.1, 0.1, 0.1)
    x_text_mesh.position.set(0.11, 0.055, -0.2) //= THREE.Vector3(20, 8, -10)
    //For the XYZ in THREE (not in dde & robot)
    //Three +x is further away from the tool rack in the horiz plane
    //Three +y is up on the screen. equiv to DDE Z
    //+z is in horiz plane towards the camera, orthogonal to x
    //text_mesh.position.y = 8 //0, -1
    //text_mesh.position.z = -10
    x_text_mesh.rotation.x = 1.5708 //90 degrees, now parallel to plane of table with the letters readable from the top
    x_text_mesh.rotation.z = -1.5708
    sim.table.add(x_text_mesh)

    let y_text_mesh = new THREE_Text2D.MeshText2D(">> +Y", { align: THREE_Text2D.textAlign.left, font: '30px Arial', fillStyle: '#00FF00', antialias: true })
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
    sim.table.add(y_text_mesh)

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
    sim.table.add(z_text_mesh)

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
    sim.table.add(table_bottom_text_mesh)



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
        //sim.table.add(table_text);
        table_text_mesh.position.y  = 0 //-0.4
        table_text_mesh.position.x  = 0 //-0.8
        parent.add(table_text_mesh);
    } )*/

    return sim.table
}

//now not used
function draw_tool_rack(parent, width, height, depth){
    var geometryt    = new THREE.BoxGeometry(width, height, depth);
    var materialt    = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube fface, easier to see the 3d shape.
    sim.rack         = new THREE.Mesh(geometryt, materialt)
    sim.rack.position.y  = 0.2
    sim.rack.position.x  = -0.9
    sim.rack.name = "rack"
    parent.add(sim.rack)
    var text2 = document.createElement('div');
    text2.style.position = 'absolute';
    text2.style.color = "white"
    text2.style.fontSize = "20px"
    text2.style.backgroundColor = "black";
    text2.innerHTML  = "Tool<br/>Rack";
    text2.style.top  = 500 + 'px';
    text2.style.left = text2.style.left = ((window.innerWidth / 2) - 330) + 'px' //keeps text just to left of took rack even if width of window is resized.
    sim_graphics_pane_id.appendChild(text2);
    return sim.rack
}

function draw_legs(parent, leg_width, leg_length, leg_height) {
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

function draw_link (parent, width, height){
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
function draw_circuit_board (parent, link2_width, link_2_height){
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



function draw_caption(parent, text){
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
    text2.style.left = ((window.innerWidth / 2) - 200) + 'px'  //keeps teh caption centerd under the table despite differnt window widths. //140 + 'px';
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

function draw_help(text) {
    var text2 = document.createElement('div');
    text2.style.position = 'absolute';
    text2.style.color = "white"
    text2.style.fontSize = "14px"
    text2.style.backgroundColor = "black";
    text2.innerHTML = text;
    text2.style.top = 45 + 'px';
    text2.style.left = 10 + 'px' //((window.innerWidth / 2) - 200) + 'px'  //keeps teh caption centerd under the table despite differnt window widths. //140 + 'px';
    sim_graphics_pane_id.appendChild(text2);
}


//_________STL VIEWER ________
function stl_init_viewer(){
        stl_init_mouse()
        sim.enable_rendering = false
        sim.scene  = new THREE.Scene();
        sim.camera = new THREE.PerspectiveCamera(75, //75,
            window.innerWidth / window.innerHeight, 0.1, 1000);
        sim.camera.position.z = 2; //2
        sim.camera.position.y = 1
        sim.camera.zoom.zoom = 4 //0.79 //has no effect.

        //camera.position.set( -15, 10, 15 );
        //camera.lookAt( scene.position );

        sim.renderer = new THREE.WebGLRenderer();
        sim.renderer.setSize( window.innerWidth, window.innerHeight );
        sim_graphics_pane_id.innerHTML = "" //clear out the previous contents
        sim_graphics_pane_id.appendChild(sim.renderer.domElement);
}

function stl_render(){
    requestAnimationFrame(stl_render)
    if (sim.mouseDown){
        stl_sim_handle_mouse_move()
    }
    sim.renderer.render(sim.scene, sim.camera);
}

function fbx_render(){
    requestAnimationFrame(fbx_render)
    if (sim.mouseDown){
        stl_sim_handle_mouse_move()
    }
    sim.renderer.render(sim.scene, sim.camera) //don't pass camera as 2nd arg because the fbx file already has a camera in it.
}

function gltf_render(){
//  requestAnimationFrame(gltf_render)
//  if (sim.mouseDown){
//      stl_sim_handle_mouse_move()
//  }
    sim.renderer.render(sim.scene, sim.camera);
    requestAnimationFrame(gltf_render)
}

function stl_init_mouse(){
    sim.mouseX_at_mouseDown    = 0
    sim.mouseY_at_mouseDown    = 0
    //sim.tableX_at_mouseDown    = 0
    //sim.tableY_at_mouseDown    = 0
    sim.zoom_at_mouseDown      = 1
    sim.rotationX_at_mouseDown = 0
    sim.rotationY_at_mouseDown = 0

    sim_graphics_pane_id.addEventListener("mousedown", function(event) {
        sim.mouseDown              = true
        sim.shiftDown              = event.shiftKey
        sim.altDown                = event.altKey
        sim.mouseX_at_mouseDown    = event.clientX
        sim.mouseY_at_mouseDown    = event.clientY
        //sim.tableX_at_mouseDown    = sim.table.position.x
        //sim.tableY_at_mouseDown    = sim.table.position.y
        sim.zoom_at_mouseDown      = sim.camera.zoom
        sim.rotationX_at_mouseDown = sim.table.rotation.x
        sim.rotationY_at_mouseDown = sim.table.rotation.y
    }, false);

    sim_graphics_pane_id.addEventListener('mousemove', function(event) {
        if (sim.mouseDown){
            sim.mouseX = event.clientX;
            sim.mouseY = event.clientY;
            stl_sim_handle_mouse_move()
            sim.renderer.render(sim.scene, sim.camera);
        }
    }, false);

    sim_graphics_pane_id.addEventListener("mouseup", function(event) {
        sim.mouseDown = false
        sim.shiftDown = false
        sim.altDown   = false
    }, false);
}
//from https://stackoverflow.com/questions/27095251/how-to-rotate-a-three-perspectivecamera-around-on-object
var stl_camera_angle = 0;
var stl_camera_radius = 500;
function stl_sim_handle_mouse_move(){
    var mouseX_diff =  sim.mouseX - sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
    var mouseY_diff =  sim.mouseY - sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
    if (sim.shiftDown){
        //alert(camera.zoom)  //camera.zoom starts at 1
        let zoom_increment = mouseX_diff / 100.0
        sim.camera.zoom = sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
        sim.camera.updateProjectionMatrix()
    }
    else if (sim.altDown){
        let panX_inc = mouseX_diff / 100
        let panY_inc = mouseY_diff / 100
        sim.camera.position.x =  sim.camera.position.x + panX_inc
        sim.camera.position.y =  sim.camera.position.y - panY_inc
    }
    else {
        //sim.table.rotation.x = sim.rotationX_at_mouseDown + (mouseY_diff / 100)
        //sim.table.rotation.y = sim.rotationY_at_mouseDown + (mouseX_diff / 100)
        sim.camera.position.x = stl_camera_radius * Math.cos( stl_camera_angle );
        sim.camera.position.z = stl_camera_radius * Math.sin( stl_camera_angle );
        stl_camera_angle += 0.01;
    }
}


