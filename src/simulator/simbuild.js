globalThis.SimBuild = class SimBuild{
    static j7_threshold     //with yoga mat fingers, min distance is 50
    static j7_prev_angle_degrees
    static gripper_now_holding_object
    static now_editing_object3d

    static init(){
        if(SimObj.objects) { SimObj.remove_all() }
        SimObj.objects = [] //just to be sure
        this.j7_threshold = 60 //above this number of degrees, the gripper is considered open
        this.j7_prev_angle_degrees = 0
        this.gripper_now_holding_object = null
        this.now_editing_object3d = null

        SimObj.ensure_simulate()
        this.gripper_closing = this.gripper_closing_sim_build
        this.gripper_opening = this.gripper_opening_sim_build
    }
    static is_gripper_open(j7_angle_degrees){
        return (j7_angle_degrees > this.j7_threshold)
    }

    //maybe not useful. returns array of 3 but the numbers are huge.
    static ee_position_array_world(){
        let ee_obj = Simulate.sim.LINK7
        ee_obj.updateMatrixWorld();
        let ee_vec3_world = new THREE.Vector3()
        ee_obj.getWorldPosition(ee_vec3_world)
        let result = SimObj.Vector3_to_array(ee_vec3_world)
        return result
    }

    //xyz is in dde coords.
    //called from SimUtils.render_j7
    static handle_j7_change = function(j7_angle_degrees, xyz, rob){
    //out("handle_j7_change j7_angle: " + j7_angle + " Dexter." + rob.name)
        if( this.is_gripper_open(this.j7_prev_angle_degrees) && //gripper was open
           !this.is_gripper_open(j7_angle_degrees)) {      //but now its closed
            let obj = SimObj.object_intersecting_object(Simulate.sim.LINK7)
            this.gripper_closing.call(this, j7_angle_degrees, xyz, obj, rob)
        }
        else if(!this.is_gripper_open(this.j7_prev_angle_degrees) && //gripper was closed
                 this.is_gripper_open(j7_angle_degrees)){       //but now its open
            let obj = SimObj.object_containing_xyz(this.ee_position_array_world())
            this.gripper_opening.call(this, j7_angle_degrees, xyz, obj, rob)
        }

        this.j7_prev_angle_degrees = j7_angle_degrees
    }

    //xyz in dde coords
    //Just makes a print statement, no actions
    static gripper_opening_default = function(j7_angle, xyz, obj, rob){
        let obj_name
        if(!obj) { obj_name = "no object" }
        else if(obj.name && (obj.name.length > 0)) {
            obj_name = obj.name
        }
        else { obj_name = "an object with no name" }
        out("On Dexter." + rob.name  + "<br/>" +
            "gripper opening to degrees: " + j7_angle +
            " xyz: " + xyz +
            "<br/>gripper_now_holding_object: " + obj_name
        )

    }
    static gripper_opening = this.gripper_opening_default

//xyz in dde coords
    static gripper_closing_default = function(j7_angle, xyz, obj, rob){
        let obj_name
        if(!obj) { obj_name = "no object" }
        else if(obj.name && (obj.name.length > 0)) {
            obj_name = obj.name
        }
        else { obj_name = "an object with no name" }
            out("On Dexter." + rob.name + "<br/>" +
                "gripper closing to degrees: " + j7_angle +
                " xyz: " + xyz +
                "<br/>gripper_now_holding_object: " + obj_name
            )
    }
//this is the "default-default" setting
    static gripper_closing = this.gripper_closing_default

    static gripper_closing_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_closing_default(j7_angle, xyz, obj, rob)
        if(this.gripper_now_holding_object){ } //can't pick up an obj if you're holding one
        else if (!obj) {} //no object to pick up
        else {
            Simulate.sim.LINK7.attach(obj) //Simulate.sim.LINK7.add(obj) //if you use add, the position and scale of obj get all screwed up, so use attach
            this.gripper_now_holding_object = obj
        }
    }

    static gripper_opening_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_opening_default(j7_angle, xyz, obj, rob)
        if(this.gripper_now_holding_object) { //let go of the held object.
            /*let the_obj = this.gripper_now_holding_object
            the_obj.updateMatrixWorld()
            let the_obj_vec3_world = new THREE.Vector3()
            the_obj.getWorldPosition(the_obj_vec3_world) //populate the_obj_vec3_world
              sim.table.add(the_obj) //add automatically removes it from its previous parent
            let local_vec3 = the_obj.worldToLocal(the_obj_vec3_world) //converts the pos in the_obj_vec3_world into the local space of sim.table, modifying the_obj_vec3_world
            the_obj.position = local_vec3
            the_obj.updateMatrix()
            the_obj.updateMatrixWorld()
            */
            Simulate.sim.table.attach(this.gripper_now_holding_object)
            this.gripper_now_holding_object = null
        }
        //this.set_position(new_obj, [0, 0, 0])
    }

    // see: https://threejs.org/docs/#api/en/geometries/
    static geometry_names = [
        "Box", "Capsule", "Circle", "Cone", "Cylinder", "Dodecahedron",
        "Edges", "Extrude", "Icosahedron", "Lathe", "Octahedron",
        "Plane", "Polyhedron", "Ring", "Shape", "Sphere",
        "Tetrahedron", "Torus", "TorusKnot", "Tube", "WireFrame"
    ]

    static show_dialog(object3d=null){
        let name_html = "<select name='the_name' data-oninput='true' title='Choose an object3d to edit.'>"
        for(let a_name of SimObj.objects){
            name_html += "<option>" + a_name + "</option>"
        }
        name_html += "</select>"
        let options  = ""
        for(let geo_name of this.geometry_names) {
            options += "<option>" + geo_name + "</option>"
        }
        show_window({title: "Make Objects in Simulator",
                     content: `
         name: ` + name_html +
         `<p/>  
         geometry: <select name="geometry" 
                           data-oninput='true'> ` +
                           options +
                   `</select><p/>
         scale 
               x: <input name="scale_x" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/> &nbsp;
               y: <input name="scale_y" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/> &nbsp;
               z: <input name="scale_z" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/>
               <p/>
         position 
               x: <input name="position_x" type="number" min="0.01" max="2" step="0.01" value="0.0" data-oninput='true'/> &nbsp;
               y: <input name="position_y" type="number" min="0.01" max="2" step="0.01" value="0.3" data-oninput='true'/> &nbsp;
               z: <input name="position_z" type="number" min="0.01" max="2" step="0.01" value="0.1" data-oninput='true'/>
               <p/>
         orientation 
               x: <input name="orientation_x" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/> &nbsp;
               y: <input name="orientation_y" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/> &nbsp;
               z: <input name="orientation_z" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/>
               <p/>
         single-color: <input name="color" type="color" data-oninput='true'> &nbsp;
                multi-color: <input name="multi_color" type="checkbox" data-oninput='true'/>
         <p/>
         <input type="button" value="make object"/>
        `,
                      callback: "SimBuild.dialog_cb"

        })
       //give dialog chance to render
        //will do nothing if object3d not passed in AND SimObj.objects is empty
        setTimeout(function () {
                SimBuild.populate_dialog_from_object(object3d)
            },
            100)
    }

    static dialog_cb(vals){
        let object3d = SimObj.get_object3d(vals.the_name)
        if(vals.clicked_button_value === "make object"){
            let color = vals.color
            let rgb_arr = Utils.hex_to_rgb_integer_array(color)
            rgb_arr[0] = rgb_arr[0] / 256
            rgb_arr[1] = rgb_arr[1] / 256
            rgb_arr[2] = rgb_arr[2] / 256
            SimObj.make_box({
                name: vals.the_name,
                scale: [vals.scale_x, vals.scale_y, vals.scale_z],
                position: [vals.position_x, vals.position_y, vals.position_z],
                orientation: [vals.orientation_x, vals.orientation_y, vals.orientation_z],
                color: rgb_arr
            })
        }
        else if(object3d) {
            if (vals.clicked_button_value === "the_name"){
                SimBuild.populate_dialog_from_object()
            }
            else if(vals.clicked_button_value === "geometry"){
                let gm_name = vals.geometry + "Geometry"
                let gm_src = "new THREE." + gm_name + "()"
                let gm = eval(gm_src)
                //let gm = //new THREE[gm_name]() //sometimes works, sometimes doesn't
                SimObj.make_object3d({ //removes old same_named object3d, if any
                    name:        vals.the_name,
                    geometry:    gm,
                    position:    SimObj.get_position(object3d),
                    scale:       SimObj.get_scale(object3d),
                    orientation: SimObj.get_orientation(object3d),
                    color:       SimObj.get_color(object3d)
                })
            }
            else if (vals.clicked_button_value.startsWith("scale")) {
               SimObj.set_scale(object3d,[vals.scale_x, vals.scale_y, vals.scale_z])
            }
            else if (vals.clicked_button_value.startsWith("position")) {
                SimObj.set_position(object3d,[vals.position_x, vals.position_y, vals.position_z])
            }
            else if (vals.clicked_button_value.startsWith("orientation")) {
                SimObj.set_orientation(object3d,[vals.orientation_x, vals.orientation_y, vals.orientation_z])
            }
            else if (vals.clicked_button_value === "color"){
                let color = vals.color
                let rgb_arr = Utils.hex_to_rgb_integer_array(color)
                rgb_arr[0] = rgb_arr[0] / 256
                rgb_arr[1] = rgb_arr[1] / 256
                rgb_arr[2] = rgb_arr[2] / 256
                SimObj.set_color(object3d, rgb_arr)
            }
            else if (vals.clicked_button_value === "multi_color"){
                if(vals.multi_color) {
                    SimObj.set_color(object3d, null)
                }
                else{
                    let color = vals.color
                    let rgb_arr = Utils.hex_to_rgb_integer_array(color)
                    rgb_arr[0] = rgb_arr[0] / 256
                    rgb_arr[1] = rgb_arr[1] / 256
                    rgb_arr[2] = rgb_arr[2] / 256
                    SimObj.set_color(object3d, rgb_arr)
                }
            }
        }
        else if (vals.clicked_button_value === "close_button"){
            SimBuild.now_editing_object3d = null
        }
        else {
            shouldnt("In SimBuild.dialog.cb got invalid clicked_button_value of: " +
                     vals.clicked_button_value )
        }
    }

    //obj defaults to last SimObj made.
    //but if no arg passed in and no objects made, do nothing.
    static populate_dialog_from_object(object3d){
        if(!object3d){
            if(SimObj.objects.length === 0) {
                SimObj.make_object3d({geometry: "Box"}) //will stick the new box on SimObj.objects
            }
            object3d = Utils.last(SimObj.objects)
        }
        if(!object3d) { return } //don't change dialog
        SimBuild.now_editing_object3d = object3d
        var dialog_dom_elt = SW.windows_of_title("Make Objects in Simulator")[0]
        let scale_arr = SimObj.get_scale(object3d)
        dialog_dom_elt.querySelector("[name=scale_x]").value = scale_arr[0]
        dialog_dom_elt.querySelector("[name=scale_y]").value = scale_arr[1]
        dialog_dom_elt.querySelector("[name=scale_z]").value = scale_arr[2]

        let position_arr = SimObj.get_position(object3d)
        dialog_dom_elt.querySelector("[name=position_x]").value = position_arr[0]
        dialog_dom_elt.querySelector("[name=position_y]").value = position_arr[1]
        dialog_dom_elt.querySelector("[name=position_z]").value = position_arr[2]

        let orientation_arr = SimObj.get_orientation(object3d)
        dialog_dom_elt.querySelector("[name=orientation_x]").value = orientation_arr[0]
        dialog_dom_elt.querySelector("[name=orientation_y]").value = orientation_arr[1]
        dialog_dom_elt.querySelector("[name=orientation_z]").value = orientation_arr[2]

        let color_0_to_1 = SimObj.get_color(object3d) //null or arr of 0 to 1 integers
        let actual_color_is_null = (color_0_to_1 ? false : true)
        if (actual_color_is_null) {
            color_0_to_1 = [0, 0, 0] //black
        }
        let color_0_to_255 = [Math.round(color_0_to_1[0] * 256),
                              Math.round(color_0_to_1[1] * 256),
                              Math.round(color_0_to_1[2] * 256)
        ]
        let hex_color = Utils.rgb_integer_array_to_hex(color_0_to_255)
        dialog_dom_elt.querySelector("[name=color]").value = hex_color

        let multi_color_dialog_val
        if(actual_color_is_null) { multi_color_dialog_val = true }
        else                     { multi_color_dialog_val = false }
        dialog_dom_elt.querySelector("[name=multi_color]").checked = multi_color_dialog_val
    }

    static add_object3d_to_the_name(object3d) {
        let dialogs = SW.windows_of_title("Make Objects in Simulator")
        if (dialogs) {
            dialogs[0].querySelector("[name=the_name]").insertAdjacentHTML(
                "afterbegin",
                "<option>" + object3d.name + "</option>")
        }
    }
}