//Create Mesh Boxes for simple box model

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