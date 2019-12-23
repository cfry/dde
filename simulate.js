/**
 * Created by Fry on 10/29/15.
 */
/*
from http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene
    http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/ //kinda complex weather app that uses the web but very good for tutorial info
        http://complexity.zone/cardboard_solarsystem/ //augmentaed reality usjing threejs and your phone's camera to mix palents and your reality.
            ttrhejs tutorial: http://content.udacity-data.com/cs291/notes/UdacityLesson6Lights.pdf

*/

//canvas { width: 100%; height: 100% }

var sim = {} //used to store sim "global" vars

//called by ready
function init_simulation(){
  try{
    init_mouse()
    sim.enable_rendering = false
    sim.scene  = new THREE.Scene();
    sim.camera = new THREE.PerspectiveCamera(75, //75,
                                window.innerWidth / window.innerHeight, 0.1, 1000);
    sim.camera.position.z = 2; //2
    sim.camera.position.y = 1
    sim.camera.zoom.zoom = 4 //0.79 //has no effect.

//camera.position.set( -15, 10, 15 );
//camera.lookAt( scene.position );

    sim.renderer = new THREE.WebGLRenderer(); //example: https://threejs.org/docs/#Manual/Introduction/Creating_a_scene
    sim.renderer.setSize( window.innerWidth, window.innerHeight );
    //sim_graphics_pane_id.innerHTML = "" //done in video.js
    sim_graphics_pane_id.appendChild(sim.renderer.domElement);

/* doesn't do anything //var light = new THREE.PointLight( 0xFFFF00 );
 var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
 light.position.set( 10, 10, 10 );
 scene.add( light );
 */
//renderer.setClearColor( 0xdddddd, 1); //makes a gray background color instead of black

    sim.table = draw_table(sim.scene, 1, 2, 0.1)
    sim.table.position.x = -2.4 //-3.85
    sim.table.position.y = 2 //2.47
    sim.table.position.z = -1 //0

    sim.table.rotation.x = 0.53
    sim.table.rotation.y = -0.44
    sim.table.rotation.z = 0

    draw_tool_rack(sim.table, 0.1, 0.3, 0.6)
    draw_caption(sim.table, "Dexter 5-axis Robot Simulation")
    /*draw_help("To rotate table, mouse-down then drag.<br/>" +
              "To zoom, shift-down then mouse-down then drag.<br/>" +
              "To pan, alt or option down, then mouse-down, then drag.")
              his is now in the Documentation under Simulate.
    */
    sim.J0 = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
    sim.J0.position.y  = 0.06
    sim.table.add(sim.J0)

    let leg_length = Dexter.LEG_LENGTH //m / 1000000 //(Dexter.LINK1 / 1000000) / 0.8 //2
    let leg_width  = leg_length / 6 //8
    draw_legs(sim.J0, leg_width, leg_length)         //0.04, 0.4)

    sim.J1 = new THREE.Object3D();
    sim.J0.add(sim.J1)
    sim.J1.position.y  = 0.1
    sim.table.add(sim.J1) //scene.add(J1)

    sim.LINK1_height  = Dexter.LINK1 //m / 1000000 //0.5
    sim.LINK1_width   = Dexter.LINK1_AVERAGE_DIAMETER //m / 1000000 //sim.LINK1_height / 1  //0.3
    sim.LINK1         = draw_arm(sim.J1, sim.LINK1_width, sim.LINK1_height)
    sim.J2            = new THREE.Object3D()
    sim.J2.position.y = sim.LINK1_height / 2.0
    //sim.J2.position.z = sim.LINK1_width  / 2.0
    sim.LINK1.add(sim.J2)

    //sim.J2 = new THREE.Object3D();
    //sim.J1.add(sim.J2);

    sim.LINK2_height  = Dexter.LINK2 //m / 1000000 // 1.0
    sim.LINK2_width   = Dexter.LINK2_AVERAGE_DIAMETER //m / 1000000 //sim.LINK2_height / 4, //0.2,
    sim.LINK2         = draw_arm(sim.J2, sim.LINK2_width, sim.LINK2_height)
    //LINK2.position.y += 0.12 //extra rise to arm0 to get it to appear to sit on top of the legs.
    sim.J3            = new THREE.Object3D();
    sim.J3.position.y = sim.LINK2_height / 2.0
    sim.LINK2.add(sim.J3)

    sim.LINK3_height  = Dexter.LINK3 //m / 1000000 //0.9
    sim.LINK3_width   = Dexter.LINK3_AVERAGE_DIAMETER //m / 1000000 //sim.LINK3_height / 6 // 0.1
    sim.LINK3         = draw_arm(sim.J3, sim.LINK3_width, sim.LINK3_height)
    sim.J4            = new THREE.Object3D();
    sim.J4.position.y = sim.LINK3_height / 2.0
    sim.LINK3.add(sim.J4)

    sim.LINK4_height  = Dexter.LINK4 //m / 1000000 //0.8
    sim.LINK4_width   = Dexter.LINK4_AVERAGE_DIAMETER //m / 1000000 //sim.LINK4_height / 4 // 0.05
    sim.LINK4         = draw_arm(sim.J4, sim.LINK4_width, sim.LINK4_height)
    sim.J5            = new THREE.Object3D();
    sim.J5.position.y = sim.LINK4_height / 2.0
    sim.J5.rotation.z = Math.PI / 2
    sim.LINK4.add(sim.J5)

    sim.LINK5_height = Dexter.LINK5 //m / 1000000 //0.125
    sim.LINK5_width  = Dexter.LINK5_AVERAGE_DIAMETER //m / 1000000 //sim.LINK5_height / 4 //0.05
    sim.LINK5        = draw_arm(sim.J5, sim.LINK5_width, sim.LINK5_height)
    //below only for the "random flailing demo"
    LINK2_bending = "+" //start out increaing arm0 bending
    LINK3_bending = "+"
    LINK3_bending = "+"
    LINK4_bending = "+"
  }
    catch(err){
        console.log("init_simulation errored with: " + err.stack)
    }
}

var render_demo = function () {
    if (sim.enable_rendering){
        requestAnimationFrame( render_demo );
        sim.J1.rotation.y += 0.001 //twisting the base.
        //ossolate arm0 bending
        if (LINK2_bending == "+") {
            if (sim.J2.rotation.z > 0.5) {
                LINK2_bending = "-"
                sim.J2.rotation.z -= 0.01
            }
            else {
                sim.J2.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J2.rotation.z < -0.5){
            LINK2_bending = "+"
            sim.J2.rotation.z += 0.01
        }
        else {
            sim.J2.rotation.z -= 0.01
        }

        if (LINK3_bending == "+") {
            if (sim.J3.rotation.z > 2.5) {
                LINK3_bending = "-"
                sim.J3.rotation.z -= 0.01
            }
            else {
                sim.J3.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J3.rotation.z < -2.5){
            LINK3_bending = "+"
            sim.J3.rotation.z += 0.01
        }
        else {
            sim.J3.rotation.z -= 0.01
        }

        if (LINK4_bending == "+") {
            if (sim.J4.rotation.z > 2.5) {
                LINK4_bending = "-"
                sim.J4.rotation.z -= 0.01
            }
            else {
                sim.J4.rotation.z += 0.01
            }
        }
        //we are in "-" bend mode
        else if(sim.J4.rotation.z < -2.5){
            LINK4_bending = "+"
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
    var materialt    = new THREE.MeshBasicMaterial( { color: 0xFFFFFF} ); //normal material shows different color for each cube fface, easier to see the 3d shape.
    sim.table        = new THREE.Mesh(geometryt, materialt)
    sim.table.position.y  = 0 //-0.9
    sim.table.position.x  = -2
    parent.add(sim.table)
    //draw lines on table
    var sizew = table_width, step = 0.2;
    var sizel = table_length
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: 'gray'});
    var line_height = table_height - 0.045
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
    sim.table.add(line);

    return sim.table
}

function draw_tool_rack(parent, width, height, depth){
    var geometryt    = new THREE.BoxGeometry(width, height, depth);
    var materialt    = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube fface, easier to see the 3d shape.
    sim.rack         = new THREE.Mesh(geometryt, materialt)
    sim.rack.position.y  = 0.2
    sim.rack.position.x  = -0.9
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

function draw_legs(parent, leg_width, leg_length) {
    var geometryleg = new THREE.BoxGeometry(leg_length, leg_width, leg_width);
    var materialleg = new THREE.MeshNormalMaterial({}); //normal material shows differnt color for each cube face, easier to see the 3d shape.
    var angle_between_legs_in_rad = (2 * Math.PI) / 6  //360 / 6 = 60 degrees //angles are in radians. 2PI rad = 360 degrees
    for (var i = 0; i < 6; i++) {
        var leg = new THREE.Mesh(geometryleg, materialleg);
        leg.position.x = leg_length / 2.0
        var pivotleg = new THREE.Object3D();
        pivotleg.rotation.y = angle_between_legs_in_rad * i
        pivotleg.add(leg)
        parent.add(pivotleg)
    }
}

function draw_arm (parent, width, height){
    var geometry = new THREE.BoxGeometry(width, height, width);
    var material = new THREE.MeshNormalMaterial({}); //normal material shows different color for each cube face, easier to see the 3d shape.
    //var material = THREE.MeshLambertMaterial( { color: 0xFF0000 } ); errors in threejs code :this.setValues is not a funciton"
    //var material    = new THREE.MeshBasicMaterial( { color: 0xAAFFAA} ); //doesn't error but just shows 1 color for whole object and no change with directional lighting.

    var arm = new THREE.Mesh(geometry, material);
    arm.position.y = (height / 2.0) - (width / 2.0)
    parent.add(arm)
    return arm
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

//render();
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

