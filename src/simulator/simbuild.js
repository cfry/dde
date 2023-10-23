globalThis.SimBuild = class SimBuild{
    static j7_threshold     //with yoga mat fingers, min distance is 50
    static j7_prev_angle_degrees
    static gripper_now_holding_object3d
    static now_editing_object3d

    static init(){
        if(SimObj.objects) { SimObj.remove_all() }
        SimObj.objects = [] //just to be sure
        this.j7_threshold = 60 //above this number of degrees, the gripper is considered open
        this.j7_prev_angle_degrees = 0
        this.gripper_now_holding_object3d = null
        this.now_editing_object3d = null

        SimObj.ensure_simulate()
        this.gripper_closing = this.gripper_closing_sim_build
        this.gripper_opening = this.gripper_opening_sim_build
    }

    //returns dialog_dom_elt or null, so good to see if SimBuild is in use.
    static dialog_dom_elt(){
        let dialog_maybe = SW.windows_of_title("Make Objects in Simulator")
        if(dialog_maybe && Array.isArray(dialog_maybe) && (dialog_maybe.length > 0)){
            return dialog_maybe[0]
        }
        else { return null }
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
            let obj = SimObj.newest_object_intersecting_object(Simulate.sim.LINK7)
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
            " xyz: " + xyz
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
            " xyz: " + xyz
        )
    }
    //this is the "default-default" setting
    static gripper_closing = this.gripper_closing_default

    static gripper_opening_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_opening_default(j7_angle, xyz, obj, rob)
        if(this.gripper_now_holding_object3d) { //let go of the held object.
            /*let the_obj = this.gripper_now_holding_object3d
            the_obj.updateMatrixWorld()
            let the_obj_vec3_world = new THREE.Vector3()
            the_obj.getWorldPosition(the_obj_vec3_world) //populate the_obj_vec3_world
              sim.table.add(the_obj) //add automatically removes it from its previous parent
            let local_vec3 = the_obj.worldToLocal(the_obj_vec3_world) //converts the pos in the_obj_vec3_world into the local space of sim.table, modifying the_obj_vec3_world
            the_obj.position = local_vec3
            the_obj.updateMatrix()
            the_obj.updateMatrixWorld()
            */
            Simulate.sim.table.attach(this.gripper_now_holding_object3d)
            this.gripper_now_holding_object3d = null
            out("Gripper now not holding an object: ")

        }
        //this.set_position(new_obj, [0, 0, 0])
    }

    static gripper_closing_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_closing_default(j7_angle, xyz, obj, rob)
        if(this.gripper_now_holding_object3d){ } //can't pick up an obj if you're holding one
        else if (!obj) {} //no object to pick up
        else {
            Simulate.sim.LINK7.attach(obj) //Simulate.sim.LINK7.add(obj) //if you use add, the position and scale of obj get all screwed up, so use attach
            this.gripper_now_holding_object3d = obj
            out("Gripper now holding object3d of: " + this.gripper_now_holding_object3d.name)
        }
    }



    // see: https://threejs.org/docs/#api/en/geometries/
    static geometry_names = [
        "Box",
        "Capsule",  //not in THREE 0.118
        "Circle",
        "Cone",
        "Cylinder",
        "Dodecahedron",
        //"Edges",    //not in THREE 0.118. in 0.157 but doesn't do anything without additional args
        "Extrude", //not in THREE 0.118. in 0.157. as is, just puts in a cube. not new behavior, but leave in for now.
        "Icosahedron",
        "Lathe",  //not in THREE 0.118. in 0.157. makes a small shape of 2 cones with their bases together.
        "Octahedron",
        "Plane",
        //"Polyhedron", //not in THREE 0.118 in 0.157 but doesn't do anything wilut further args.
        "Ring",
        "Shape",  //not in THREE 0.118 n 0,157 makes a triangle. (2D)
        "Sphere",
        "Tetrahedron",
        "Torus",
        "TorusKnot",
        //"Tube",      //not in THREE 0.118 in 0.157 makes an odd, partial tube semi-di shape. Not useful and confusing. Needs more args.
        //"Wireframe"  //not in THREE 0.118 in 0.157 but doesn't do anything without more args.
    ]

    //has to return an object, even if it has to make it
    //called by show_dialog when not passed a object3d which is the normal way
    //NO allow dialog to not have an object3d
   /* static object3d_for_dialog(object3d=null){
        if(object3d)  { return object3d }
        else if(SimObj.objects.length > 0){
            return Utils.last(SimObj.objects)
        }
        else {
            object3d = SimObj.make_object3d({geometry: "Box"}) //will stick the new box on SimObj.objects
            return object3d
        }
    }*/

    static show_dialog(object3d_or_name=null){
        if(globalThis.SimBuild_doc_id) { DocCode.open_doc(SimBuild_doc_id) }
        let name_html = "<select name='the_name' data-oninput='true' title='Choose an object3d to edit.'>"
        for(let obj of SimObj.objects){ //might be none
            name_html += "<option>" + obj.name + "</option>"
        }
        name_html += "</select>"
        let options  = ""
        for(let geo_name of this.geometry_names) {
            options += "<option>" + geo_name + "</option>"
        }
        let object3d = SimObj.get_object3d(object3d_or_name) //must do BEFORE making the show_window so that the making of htis obj won't try to populate the window
                                                    //warning: often null
        if(!object3d && SimObj.has_objects){
            object3d = Utils.last(SimObj.objects)
        }
        show_window({title: "Make Objects in Simulator",
                     content: `
         <input type="button" name="ref_name" value="name" class="simbuild_insert_button" title="Insert a reference to this object into the editor."/> : ` + name_html +
                         `<input type='button' value='Insert whole object'  style='margin-left:20px;'
                                title='Inserts the source code\nfor re-creating this object3d\ninto the editor.'/> &nbsp;
                                <input type='button' value='Insert all'
                                title='Inserts the source code\n for all object3ds\ninto the editor.'/>                               
         <p/>  
         <input type="button" name="insert_geometry" value="geometry" class="simbuild_insert_button" title="Insert a call to setting geometry into the editor."/> : 
         <select name="geometry" 
                           data-oninput='true'> ` +
                           options +
                   `</select><p/>
        <input type="button" name="insert_scale" value="scale" class="simbuild_insert_button" title="Insert a call to setting scale into the editor."/> :  
               x: <input name="scale_x" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/> &nbsp;
               y: <input name="scale_y" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/> &nbsp;
               z: <input name="scale_z" type="number" min="0.01" max="2" step="0.01" value="0.2" data-oninput='true'/>
               <p/>
        <input type="button" name="insert_position" value="position" class="simbuild_insert_button" title="Insert a call to setting position into the editor."/> :  
               x: <input name="position_x" type="number" min="-2" max="2" step="0.01" value="0.0" data-oninput='true'/> &nbsp;
               y: <input name="position_y" type="number" min="-2" max="2" step="0.01" value="0.3" data-oninput='true'/> &nbsp;
               z: <input name="position_z" type="number" min="-2" max="2" step="0.01" value="0.1" data-oninput='true'/>
               <p/>
        <input type="button" name="insert_orientation" value="orientation" class="simbuild_insert_button" title="Insert a call to setting orientation into the editor."/> :  
               x: <input name="orientation_x" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/> &nbsp;
               y: <input name="orientation_y" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/> &nbsp;
               z: <input name="orientation_z" type="number" min="-180" max="180" step="1" value="0" data-oninput='true'/>
               <p/>
        <input type="button" name="insert_color" value="color" class="simbuild_insert_button" title="Insert a call to setting color into the editor."/> :  
         <input name="color" type="color" data-oninput='true' value="#ffffff" title="Click to change the color"/> &nbsp;
         
         <input type="button" name="insert_multi_color" value="multi_color" class="simbuild_insert_button" 
              title="Insert a call to setting multi-color object sides into the editor.\nThis is done by changing the material from\n'MeshNormal' (multi_color) to 'MeshPhong' (single_color)."/> :  
              <input name="multi_color" type="checkbox" data-oninput='true'/>  &nbsp;
                
         <input type="button" name="insert_wireframe" value="wireframe" class="simbuild_insert_button" title="Insert a call to setting wireframe object edges into the editor."/> :  
              <input name="wireframe" type="checkbox" data-oninput='true'/> 
         <hr style="border: 2px solid black;"/>
         <input type="button" value="Make object"  title="Clones the currently edited object."/>
         <p/>
         <input type="button" value="Inspect this" title="Inspect the inner details of the currently edited object."/> &nbsp;
         <input type="button" value="Inspect all"  title="Inspect the inner details of all object3ds."/> &nbsp;
         
         <input type="button" value="Remove this" title="Remove the currently edited object from the simulator."/>  &nbsp;
         <input type="button" value="Remove all"  title="Remove all object3ds from the simulator."/>
        `,
            height: 355,
            width:  440, //the "name" select box, with a long name, requires a wider window.
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
        let new_object3d
        if(vals.clicked_button_value === "Make object"){ //the only clausd that can cope with no object3d
            if(!object3d){ //can't clone it so we have to make a default one
                let new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                    "my_object3d")
                if (!new_name) {
                    return
                } //user canceled so don't make a new object
                else {
                    new_object3d = SimObj.make_object3d({name: new_name})
                    SimBuild.populate_dialog_from_object(new_object3d)
                }
            }
            else {
                let new_name = SimObj.unique_name_for_object3d_or_null(object3d.name)
                if (!new_name) { //unlikely as have to make a lot of objects with numerical suffixes, but *could* happen
                    new_name = ""
                }
                new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                    new_name)
                if (!new_name) {
                    return
                } //user canceled so don't make a new object
                else {
                    /*let new_object3d = SimObj.make_copy_of_object3d(SimBuild.now_editing_object3d, new_name)
                    //SimObj.set_wireframe(new_object3d, true ) //just so it will look different, but doesn't work as wireframe hidden by opaque orig object.

                    //so we'll be able to SEE the new obj, not just a duplicate on top of what it copied.
                    let dialog_dom_elt = SimBuild.dialog_dom_elt()
                    let multi_color_dom_elt = dialog_dom_elt.querySelector("[name=multi_color]")
                    let multi_color_val = multi_color_dom_elt.value
                    multi_color_dom_elt.value = !multi_color_val

                    let wireframer_dom_elt = dialog_dom_elt.querySelector("[name=wireframe]")
                    wireframer_dom_elt.checked = true
                     */
                    let new_object3d = SimObj.make_copy_of_object3d(object3d, new_name)
                    out("The new object is visually identical to the previously edited object.<br/>" +
                        "Change something in the new object to make it stand out.", "green")
                    SimBuild.populate_dialog_from_object(new_object3d)
                }
            }
        }
        else if (!object3d) {
            shouldnt("SimBuild.dialog_cb got no object3d to edit.")
        }
        else if (vals.clicked_button_value === "ref_name"){
            let src = "SimObj." + object3d.name + "\n"
            Editor.insert(src)
        }
        else if (vals.clicked_button_value === "Insert whole object"){
            let src = to_source_code({value: object3d})
            Editor.insert(src + "\n")
        }
        else if (vals.clicked_button_value === "Insert all"){
            let src = SimObj.all_objects_source_code()
            Editor.insert(src + "\n")
        }
        else if (vals.clicked_button_value === "the_name"){
            SimBuild.populate_dialog_from_object(object3d)
        }
        else if(vals.clicked_button_value === "insert_geometry"){
            let ref = "SimObj." + object3d.name
            let class_name = SimObj.get_geometry_short_name(object3d)
            let src = 'SimObj.set_geometry(' + ref + ', "' + class_name + '")\n'
            Editor.insert(src)
        }
        else if(vals.clicked_button_value === "geometry"){
            /*let gm_name = vals.geometry + "Geometry"
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
            })*/
            SimObj.set_geometry(object3d, vals.geometry)
        }

        else if (vals.clicked_button_value == "insert_scale") {
            let ref = "SimObj." + object3d.name
            let arr = SimObj.get_scale(object3d)
            let arr_str = to_source_code({value: arr})
            let src = 'SimObj.set_scale(' + ref + ', ' + arr_str + ')\n'
            Editor.insert(src)
        }

        else if (vals.clicked_button_value.startsWith("scale")) {
           SimObj.set_scale(object3d,[vals.scale_x, vals.scale_y, vals.scale_z])
        }

        else if (vals.clicked_button_value == "insert_position") {
            let ref = "SimObj." + object3d.name
            let arr = SimObj.get_position(object3d)
            let arr_str = to_source_code({value: arr})
            let src = 'SimObj.set_position(' + ref + ', ' + arr_str + ')\n'
            Editor.insert(src)
        }
        else if (vals.clicked_button_value.startsWith("position")) {
            SimObj.set_position(object3d,[vals.position_x, vals.position_y, vals.position_z])
        }
        else if (vals.clicked_button_value == "insert_orientation") {
            let ref = "SimObj." + object3d.name
            let arr = SimObj.get_orientation(object3d)
            let arr_str = to_source_code({value: arr})
            let src = 'SimObj.set_orientation(' + ref + ', ' + arr_str + ')\n'
            Editor.insert(src)
        }
        else if (vals.clicked_button_value.startsWith("orientation")) {
            SimObj.set_orientation(object3d,[vals.orientation_x, vals.orientation_y, vals.orientation_z])
        }
        else if (vals.clicked_button_value === "insert_color"){
            let ref = "SimObj." + object3d.name
            let arr = SimObj.get_color(object3d)
            let arr_str = to_source_code({value: arr})
            let src = 'SimObj.set_color(' + ref + ', ' + arr_str + ')\n'
            Editor.insert(src)
        }
        else if (vals.clicked_button_value === "color"){
            let color = vals.color
            let rgb_arr = Utils.hex_to_rgb_integer_array(color)
            rgb_arr[0] = rgb_arr[0] / 256
            rgb_arr[1] = rgb_arr[1] / 256
            rgb_arr[2] = rgb_arr[2] / 256
            SimObj.set_color(object3d, rgb_arr)
        }
        else if (vals.clicked_button_value === "insert_multi_color"){
            let ref = "SimObj." + object3d.name
            let short_material_name = SimObj.get_material_short_name(object3d)
            let src = 'SimObj.set_material(' + ref + ', "' + short_material_name + '")\n'
            Editor.insert(src)
        }
        else if (vals.clicked_button_value === "multi_color"){
            /*if(vals.multi_color) {
                SimObj.set_color(object3d, null)
            }
            else{
                let color = vals.color
                let rgb_arr = Utils.hex_to_rgb_integer_array(color)
                rgb_arr[0] = rgb_arr[0] / 256
                rgb_arr[1] = rgb_arr[1] / 256
                rgb_arr[2] = rgb_arr[2] / 256
                SimObj.set_color(object3d, rgb_arr)
            }*/
            let material = (vals.multi_color ? "MeshNormal" : "MeshPhong")
            SimObj.set_material(object3d, material)
        }
        else if (vals.clicked_button_value === "insert_wireframe"){
            let ref = "SimObj." + object3d.name
            let wireframe_val = SimObj.get_wireframe(object3d)
            let src = 'SimObj.set_wireframe(' + ref + ", " + wireframe_val + ')\n'
            Editor.insert(src)
        }
        else if (vals.clicked_button_value === "wireframe"){
            SimObj.set_wireframe(object3d, vals.wireframe)
        }
        else if (vals.clicked_button_value === "Inspect this"){
            inspect(object3d)
        }
        else if (vals.clicked_button_value === "Inspect all"){
            inspect(SimObj.objects)
        }

        else if (vals.clicked_button_value === "Remove this"){
            let short_name = SimObj.get_geometry_short_name(object3d)
            if(confirm("Remove " + short_name + " object: " + object3d.name + "?")) {
                SimObj.remove(object3d)
            }
        }
        else if (vals.clicked_button_value === "Remove all"){
            if(confirm("Remove all objects?")) {
                SimObj.remove_all()
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

    static populate_dialog_property(object3d, prop_name, value,
                                    value_prop_name="value"){ //but should be "checked" for checkboxes
        if(object3d === SimBuild.now_editing_object3d) {
            let dialog_dom_elt = SimBuild.dialog_dom_elt()
            if (dialog_dom_elt) {
                let css_sel = "[name=" + prop_name + "]"
                let widget_dom_elt = dialog_dom_elt.querySelector(css_sel)
                widget_dom_elt[value_prop_name] = value
            }
        }
    }

    //obj defaults to last SimObj made.
    //but if no arg passed in and no objects made, do nothing.
    //This method expects the <option> tag for the name of object3d to
    //aready be in the_name select tag.
    static populate_dialog_from_object(object3d){
        let dialog_dom_elt = SimBuild.dialog_dom_elt()
        if(!dialog_dom_elt) {  return }
        else if (!object3d) {
            this.disable_inputs()
            return
        }
        else {
            this.enable_inputs()
            SimBuild.now_editing_object3d = object3d

            SimBuild.add_object3d_to_the_name(object3d) //adds an option tag under the select, but only if there's not one there for object3D.name
            this.populate_dialog_property(object3d, "the_name", object3d.name)


            let geo_short_name = SimObj.get_geometry_short_name(object3d)
            SimBuild.populate_dialog_property(object3d, "geometry", geo_short_name)

            let scale_arr = SimObj.get_scale(object3d)
            SimBuild.populate_dialog_property(object3d, "scale_x", scale_arr[0])
            SimBuild.populate_dialog_property(object3d, "scale_y", scale_arr[1])
            SimBuild.populate_dialog_property(object3d, "scale_z", scale_arr[2])


            let position_arr = SimObj.get_position(object3d)
            SimBuild.populate_dialog_property(object3d, "position_x", position_arr[0])
            SimBuild.populate_dialog_property(object3d, "position_y", position_arr[1])
            SimBuild.populate_dialog_property(object3d, "position_z", position_arr[2])


            let orientation_arr = SimObj.get_orientation(object3d)
            SimBuild.populate_dialog_property(object3d, "orientation_x", orientation_arr[0])
            SimBuild.populate_dialog_property(object3d, "orientation_y", orientation_arr[1])
            SimBuild.populate_dialog_property(object3d, "orientation_z", orientation_arr[2])


            let color_0_to_1 = SimObj.get_color(object3d) //null or arr of 0 to 1 integers
            if(color_0_to_1) {
                let color_0_to_255 = [Math.round(color_0_to_1[0] * 256),
                    Math.round(color_0_to_1[1] * 256),
                    Math.round(color_0_to_1[2] * 256)
                ]
                let hex_color = Utils.rgb_integer_array_to_hex(color_0_to_255)
                SimBuild.populate_dialog_property(object3d, "color", hex_color)
            }
            //multi_color checkbox is now if true, use material "MeshNormal" otherwise use "MeshPhong"
            //let orig_multi_color_dialog_val = dialog_dom_elt.querySelector("[name=multi_color]").checked
            let new_multi_color_dialog_val = (object3d.material instanceof THREE.MeshNormalMaterial)
            SimBuild.populate_dialog_property(object3d, "multi_color", new_multi_color_dialog_val, "checked")


            let new_wireframe_val = SimObj.get_wireframe(object3d) //a boolean
            SimBuild.populate_dialog_property(object3d, "wireframe", new_wireframe_val, "checked")
        }
    }

    static add_object3d_to_the_name(object3d) {
        let dialog_dom_elt = SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let select_dom_elt = dialog_dom_elt.querySelector("[name=the_name]")
            if (select_dom_elt) {
                for (let child of select_dom_elt.children) {
                    if (child.innerHTML === object3d.name) { //already has option for this name
                        return
                    }
                }
                select_dom_elt.insertAdjacentHTML(
                    "afterbegin",
                    "<option>" + object3d.name + "</option>")
            }
        }
    }

    static remove_object3d_from_the_name_menu(object3d) {
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let the_select_dom_elt = dialog_dom_elt.querySelector("[name=the_name]")
            //let inner_selector = "[innerHTML=" + object3d.name + "]" //fails. I can't find a way to use selector to select innerHTML oct 1, 2023
            //let the_option_dom_elt = the_select_dom_elt.querySelector(inner_selector)
            for(let a_option_dom_elt of the_select_dom_elt.childNodes){
                if(a_option_dom_elt.innerHTML === object3d.name){
                    a_option_dom_elt.remove() //let run for more iterations just in case > 1 of that name get in the select dom elt
                }
            }
        }
    }

    static disable_inputs(){
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if(dialog_dom_elt) {
            let inputs = dialog_dom_elt.querySelectorAll("input")
            for (let a_in of inputs) {
                if (a_in.value !== "Make object") {
                    a_in.setAttribute("disabled", "")
                }
            }
            inputs = dialog_dom_elt.querySelectorAll("select")
            for (let a_in of inputs) {
                a_in.setAttribute("disabled", "")
            }
        }
    }

    static enable_inputs(){
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if(dialog_dom_elt) {
            let inputs = dialog_dom_elt.querySelectorAll("input")
            for (let a_in of inputs) {
                a_in.removeAttribute("disabled")
            }
            inputs = dialog_dom_elt.querySelectorAll("select")
            for (let a_in of inputs) {
                a_in.removeAttribute("disabled")
            }
        }
    }
}