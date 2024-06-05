globalThis.SimBuild = class SimBuild{
    static j7_threshold     //with yoga mat fingers, min distance is 50
    static j7_prev_angle_degrees
    static gripper_now_holding_object3d
    static now_editing_object3d
    static now_editing_object3d_box_helper

    static init(){
        this.j7_threshold = 60 //above this number of degrees, the gripper is considered open
        this.j7_prev_angle_degrees = 0
        this.gripper_now_holding_object3d = null
        this.set_now_editing_object3d(null)

        //SimObj.ensure_simulate()
        SimObj.init_dde_objects() //must be after SimObj.ensure_simulate
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
            let xyz = SimObj.get_center( Simulate.sim.LINK7)
            let obj = SimObj.object_containing_xyz(xyz)


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
            obj_name = SimObj.get_name(obj)
        }
        else { obj_name = "an object with no name" }
            out("On Dexter." + rob.name + "<br/>" +
                "gripper closing to degrees: " + j7_angle +
                " xyz: " + xyz + " on object3d: " + obj_name
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
            let obj_name = SimObj.get_name(this.gripper_now_holding_object3d)
            let obj_name_html = `<a href='#' onclick='inspect(SimObj["` + obj_name + `"])'>` + obj_name + `</a>`
            out("Gripper dropped object: " + obj_name_html)
            this.gripper_now_holding_object3d = null
        }
        else {
            out("Gripper was not holding an object when it opened.")
        }
        //this.set_position(new_obj, [0, 0, 0])
    }

    static gripper_closing_sim_build(j7_angle, xyz, object3d, rob){
        this.gripper_closing_default(j7_angle, xyz, object3d, rob)
        if(this.gripper_now_holding_object3d){ } //can't pick up an obj if you're holding one
        else if (!object3d) {
            out("Gripper didn't close on an object.")
        }
        else {
            Simulate.sim.LINK7.attach(object3d) //Simulate.sim.LINK7.add(obj) //if you use add, the position and scale of obj get all screwed up, so use attach
            this.gripper_now_holding_object3d = object3d
            let obj_name = SimObj.get_name(object3d)
            let obj_name_html = `<a href='#' onclick='inspect(SimObj["` + obj_name + `"])'>` + obj_name + `</a>`
            out("Gripper now holding object3d: " + obj_name_html)
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
        //"Polyhedron", //not in THREE 0.118 in 0.157 but doesn't do anything with further args.
        "Ring",
        "Shape",  //not in THREE 0.118 n 0,157 makes a triangle. (2D)
        "Sphere",
        "Tetrahedron",
        "Torus",
        "TorusKnot",
        //"Tube",      //not in THREE 0.118 in 0.157 makes an odd, partial tube semi-di shape. Not useful and confusing. Needs more args.
        //"Wireframe"  //not in THREE 0.118 in 0.157 but doesn't do anything without more args.
    ]

    static handle_children(event){
        let dom_elt = event.target
        let val = dom_elt.value //name of a child object3d OR the top item of "children". User *shouldn't& pick it, but just in case they do,
        if((val === "1 child") || (val.endsWith(" children"))){} //don't even call show_dialog. Leave dialog as is
        else {
            SimBuild.show_dialog(val)
        }
    }

    static object_path_html(object3d=SimObj.user_origin){
        let ancestor_names = SimObj.ancestor_names(object3d)
        let result = ""
        for(let name of ancestor_names){
            let the_name = "path_part_" + name
            if(name === object3d.name) {
                result += "<b>" + object3d.name + "</b> / "
            }
            else {
                result += "<input type='button' class='link_like_button' name='" + the_name + "' value='" + name + `' onclick="SimBuild.show_dialog('` + name + `')"/> / ` //html now doesn't permit "name" attribute on span tags nor clickability
            }
        }
        result += " <select name='children' onchange='SimBuild.handle_children(event)' title='Choose a child of the current object to edit.'>"
        let obj_children = SimObj.get_children(object3d)
        result += "<option>" + obj_children.length + " children" + "</option>"
        for (let kid of obj_children){
            result += "<option>" + kid.name + "</option>"
        }
        result += "</select>"
        //needed the below code because Chrome compiler optimizer has a bug making result undefined.
        return result
    }

    static dialog_is_showing(){
        return (globalThis.simbuild_path_id ? true : false)
    }

    static show_dialog(object3d_or_name= "user_origin"){
        if(!this.dialog_is_showing()) { DocCode.open_doc(globalThis.SimBuild_doc_id) }
        let object3d = SimObj.get_object3d(object3d_or_name) //must do BEFORE making the show_window so that the making of this obj won't try to populate the window
        //warning: often null

        let path_html = "<div id='simbuild_path_id'>" +
                        "path: " + this.object_path_html(object3d) +
                        "</div><div style='height:6px;'></div>"

        let parent_html = "parent: <select name='the_parent' data-oninput='true' title='Choose a new parent for the current object.'> &nbsp; "
        for(let name of SimObj.dde_and_user_objects_names()){ //might be none
            let sel_html = ""
            if(name === "user_origin") {sel_html = " selected " }
            parent_html += "<option " + sel_html + ">" + name + "</option>"
        }
        parent_html += "</select> &nbsp; "

        let name_html = "name: <select name='the_name' data-oninput='true' title='Choose another object3d to edit.'>"
        let name_options_html = "" //used for both name and parent menus
        for(let name of SimObj.dde_and_user_objects_names()){ //might be none
            name_options_html += "<option>" + name + "</option>"
        }
        name_html += (name_options_html + "</select><div style='height:6px;'></div>")

        let geometry_html = "geometry: " +
            "<select name='geometry' data-oninput='true'>"
            for(let geo_name of this.geometry_names) {
                geometry_html += "<option>" + geo_name + "</option>"
            }
        geometry_html += "</select><div style='height:6px;'></div>"

        let scale_html = `scale: &nbsp; 
               x: <input name="scale_x" type="number" min="0.01" step="0.01" value="0.2" data-oninput='true' style='max-width:75px;'/> &nbsp;
               y: <input name="scale_y" type="number" min="0.01" step="0.01" value="0.2" data-oninput='true' style='max-width:75px;'/> &nbsp;
               z: <input name="scale_z" type="number" min="0.01" step="0.01" value="0.2" data-oninput='true' style='max-width:75px;'/>
               <div style='height:6px;'></div>`

        let position_html = `position: &nbsp; 
               x: <input name="position_x" type="number"  step="0.01" value="0.0" data-oninput='true' style='max-width:75px;'/> &nbsp;
               y: <input name="position_y" type="number"  step="0.01" value="0.3" data-oninput='true' style='max-width:75px;'/> &nbsp;
               z: <input name="position_z" type="number"  step="0.01" value="0.1" data-oninput='true' style='max-width:75px;'/>
               <div style='height:6px;'></div>`

        let orientation_html = `orientation:  &nbsp; 
               x: <input name="orientation_x" type="number" min="-180" max="180" step="1" value="0" data-oninput='true' style='max-width:75px;'/> &nbsp;
               y: <input name="orientation_y" type="number" min="-180" max="180" step="1" value="0" data-oninput='true' style='max-width:75px;'/> &nbsp;
               z: <input name="orientation_z" type="number" min="-180" max="180" step="1" value="0" data-oninput='true' style='max-width:75px;'/>
               <div style='height:6px;'></div>`

       let color_kind_html =
         `<label title="Select a single color for the object.\nChoose that color by clicking on the color to the right.">
              <input name="color_kind" type="radio" value="single_color" data-oninput="true"/>single_color</label>  &nbsp;
         <input name="color" type="color" data-oninput='true' value="#ffffff" title="Click to change the new color to set."/>  &nbsp;
         <label title="Select the multi-color material. &#13; Colors each side of the object differently.">
              <input name="color_kind" type="radio" value="multi_color" data-oninput="true"/>multi_color</label>  &nbsp;    
         <label title="Select the wire frame material.">
              <input name="wire_frame" type="checkbox" value="wire_frame" data-oninput="true"/>wire_frame</label>   
          <div style='height:6px;'></div>`

       let physics_html =
           `<label title="When checked, Object is affected by gravity.">
               <input type="checkbox" name="is_dynamic" data-oninput="true"/> is_dynamic &nbsp; 
           </label>
           <label title="Mass is directly proportional to weight.">
               mass: <input name="mass" type="number" step="0.1" value="1.0" data-oninput='true' style="width:60px;"/> grams  &nbsp; &nbsp; &nbsp;
           </label>`

       let show_html = '<select name="simobj_show" data-onchange="true">'
        for(let kind of ["show_all", "hide_all", "show_this", "hide_this", "show_only_this", "hide_only_this", "show_colliders", "hide_colliders", "show_dexter", "hide_dexter"]){
            show_html += ' <option>' + kind + '</option>'
        }
       show_html += "</select>"

       let bottom_buttons_html =
         `<hr style="border: 2px solid black;"/>
         <input type="button" value="Make object"         title="Makes a new basic box (cube) for you to customize."/> &nbsp;
         <input type="button" value="Copy object"         title="Makes a copy of the currently edited object.&#13;You have to move it to see it!"/> &nbsp;

         <input type='button' value='Insert object' title='Inserts the source code &#13; for re-creating this object3d  &#13; into the editor.'/> &nbsp;
         <input type='button' value='Insert all'          title='Inserts the source code &#13; for all object3ds  &#13; into the editor.'/> 
         <p/>
         <input type="button" value="Inspect object" title="Inspect the inner details of the currently edited object."/> &nbsp;
         <input type="button" value="Inspect all"  title="Inspect the inner details of all object3ds."/> &nbsp;
         
         <input type="button" value="Remove object" title="Remove the currently edited object from the simulator."/>  &nbsp;
         <input type="button" value="Remove all"  title="Remove all user object3ds from the simulator."/>`

       let content =
             path_html +
             parent_html + name_html +
             geometry_html + scale_html + position_html + orientation_html +
             color_kind_html + physics_html +  show_html +
             bottom_buttons_html

       show_window({title: "Make Objects in Simulator",
                     content: content,
                     height: 370,
                     width:  470, //the "name" select box, with a long name, requires a wider window.
                     callback: "SimBuild.dialog_cb"
        })
       //give dialog chance to render
        //will do nothing if object3d not passed
        setTimeout(function () {
                SimBuild.populate_dialog_from_object(object3d)
            },
            100)
    }

    static dialog_cb(vals){
        let object3d = SimObj.get_object3d(vals.the_name)
        if (vals.clicked_button_value === "close_button"){
            SimBuild.set_now_editing_object3d(null)
        }

        else if (vals.clicked_button_value === "the_name"){
            let new_object3d_name = vals.the_name
            let new_object3d = SimObj[new_object3d_name]
            //SimBuild.populate_dialog_from_object(object3d)
            SimBuild.show_dialog(new_object3d)
        }
        else if (vals.clicked_button_value === "the_parent"){
            let par = SimObj.get_object3d(vals.the_parent)
            if(SimObj.is_dde_object3d(object3d)){
                warning("You can't set the parent of dde system object3d's such as: " + SimObj.get_name(object3d))
            }
            else if(par === object3d){
                warning("You can't set the parent of an object to itself.")
            }
            else {
                if(SimObj.is_dde_object3d(par) && par !== SimObj.user_origin){
                    par = SimObj.user_origin  //don't allow user to add objects anywhere but under user_origin
                    //after init and  cur obj is user_origin with its PARENT of table,
                    //the dialog will show that, but then if user clicks on make_object, we don't want to
                    //make TABLE its parent, we want user_origin to be its parent.
                }
                SimObj.set_parent(object3d, par)
                SimBuild.show_dialog(object3d) //we still show the orig object3d, but since it has a new parent, the first row of hte dialog changes so much that we must reshow the entire dialog
            }
        }

        else if(vals.clicked_button_value === "geometry"){
            SimObj.set_geometry(object3d, vals.geometry)
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
        else if (vals.clicked_button_value === "simobj_show") {
            let kind = vals.simobj_show
            SimObj.show(object3d, kind)
        }
        else if (vals.clicked_button_value === "color"){
            let color = vals.color
            let rgb_arr = Utils.hex_to_rgb_integer_array(color)
            rgb_arr[0] = rgb_arr[0] / 256
            rgb_arr[1] = rgb_arr[1] / 256
            rgb_arr[2] = rgb_arr[2] / 256
            SimObj.set_color(object3d, rgb_arr)
        }
        else if (vals.clicked_button_value === "color_kind"){
            let color_kind = vals.color_kind
            if(color_kind === "single_color"){
                let color = vals.color
                let rgb_arr = Utils.hex_to_rgb_integer_array(color)
                rgb_arr[0] = rgb_arr[0] / 256
                rgb_arr[1] = rgb_arr[1] / 256
                rgb_arr[2] = rgb_arr[2] / 256
                SimObj.set_material(object3d, "MeshStandardMaterial")
                SimObj.set_color(object3d, rgb_arr)
            }
            else if(color_kind === "multi_color"){
                SimObj.set_material(object3d, "MeshNormalMaterial")
            }
            //else if (color_kind === "wire_frame"){
            //    SimObj.set_wire_frame(object3d, vals.wire_frame)
            else {
                shouldnt("dialg_cb got invalid color_kind of: " + color_kind)
            }
        }

        else if (vals.clicked_button_value === "wire_frame"){
            SimObj.set_wire_frame(object3d, vals.wire_frame)
        }
        else if (vals.clicked_button_value === "is_dynamic"){
            let checkbox_val = vals.is_dynamic
            SimObj.set_is_dynamic(object3d, checkbox_val)
            if(checkbox_val){
                SimBuild.disable_dynamic_inputs()
                warning("When an object is dynamic, its position and orientation<br/>" +
                        "are controlled by the physics simulator,<br/>" +
                        "not by the controls in the dialog box.")
            }
            else {
                SimBuild.enable_inputs()
                out("You can now re-position and re-orient the object with the dialog box controls.<br/>" +
                    "The physics simulator is disabled for this object.", "green")
            }
        }
        else if (vals.clicked_button_value === "mass"){
            let mass = vals.mass //in grams
            SimObj.set_mass(object3d, mass)
        }
    //____________________________________________________________
        else if(vals.clicked_button_value === "Make object"){ //the only clause that can cope with no object3d
            let new_name = SimObj.unique_name_for_object3d_or_null()
            if (!new_name) { //unlikely as have to make a lot of objects with numerical suffixes, but *could* happen
                new_name = ""
            }
            new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                new_name)
            if (!new_name) {  //user canceled so don't make a new object
                return
            }
            else {
                let new_object3d = SimObj.make_object3d({name: new_name})
                //SimBuild.populate_dialog_from_object(new_object3d) //fails for dynamically created widgets because
                // SW.install_submit_window_fns is not called. //not redundant with make_object3d
                SimBuild.show_dialog(new_object3d)
            }
        }
        else if(vals.clicked_button_value === "Copy object") {
            if (!object3d || !SimObj.is_user_object3d(object3d)){
                warning("No user object to copy.&#13;Use the 'Make object' button to make a new object.")
            }
            else {
                let new_name = SimObj.unique_name_for_object3d_or_null(object3d.name)
                if (!new_name) { //unlikely as have to make a lot of objects with numerical suffixes, but *could* happen
                    new_name = ""
                }
                new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                    new_name)
                if (!new_name) {  //user canceled so don't make a new object
                    return
                }
                else {
                    let copy_descendents_too
                    if(SimObj.get_children(object3d).length === 0) { //doesn't include BoxHelper
                        copy_descendents_too = false //there aren't any
                    }
                    else {
                        copy_descendents_too = confirm("Copy the descendents of " + object3d.name + " too?")
                    }
                    let new_object3d = SimObj.make_copy_of_object3d(object3d, new_name, copy_descendents_too)
                    //SimBuild.populate_dialog_from_object(new_object3d) //not redundant with make_copy_of_object3d
                    SimBuild.show_dialog(new_object3d)
                }
            }
        }
        else if (!object3d) {
            warning("There is no selected objecct.<br/>" +
                "Please click on an object in the simulator pane or<br/>" +
                "select one from a menu in the SimBuild dialog box.")
        }
        else if (vals.clicked_button_value === "Insert object"){
            let src = to_source_code({value: object3d})
            Editor.insert(src + "\n")
        }
        else if (vals.clicked_button_value === "Insert all"){
            let src = SimObj.all_user_objects_source_code()
            Editor.insert(src + "\n")
        }

        else if(vals.clicked_button_value === "Make object"){ //the only clause that can cope with no object3d
            let new_name = SimObj.unique_name_for_object3d_or_null()
            if (!new_name) { //unlikely as have to make a lot of objects with numerical suffixes, but *could* happen
                new_name = ""
            }
            new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                new_name)
            if (!new_name) {  //user canceled so don't make a new object
                return
            }
            else {
                let new_object3d = SimObj.make_object3d({name: new_name})
                //SimBuild.populate_dialog_from_object(new_object3d) //fails for dynamically created widgets because
                // SW.install_submit_window_fns is not called. //not redundant with make_object3d
                SimBuild.show_dialog(new_object3d)
            }
        }
        else if(vals.clicked_button_value === "Copy object") {
            if (!object3d || !SimObj.is_user_object3d(object3d)){
                warning("No user object to copy.&#13;Use the 'Make object' button to make a new object.")
            }
            else {
                let new_name = SimObj.unique_name_for_object3d_or_null(object3d.name)
                if (!new_name) { //unlikely as have to make a lot of objects with numerical suffixes, but *could* happen
                    new_name = ""
                }
                new_name = prompt("Enter a name for the new object3d in the Simulator pane.\nYou can't change this, so choose wisely.",
                    new_name)
                if (!new_name) {  //user canceled so don't make a new object
                    return
                }
                else {
                    let copy_descendents_too
                    if(SimObj.get_children(object3d).length === 0) { //doesn't include BoxHelper
                        copy_descendents_too = false //there aren't any
                    }
                    else {
                        copy_descendents_too = confirm("Copy the descendents of " + object3d.name + " too?")
                    }
                    let new_object3d = SimObj.make_copy_of_object3d(object3d, new_name, copy_descendents_too)
                    //SimBuild.populate_dialog_from_object(new_object3d) //not redundant with make_copy_of_object3d
                    SimBuild.show_dialog(new_object3d)
                }
            }
        }
        else if (!object3d) {
            warning("There is no selected objecct.<br/>" +
                "Please click on an object in the simulator pane or<br/>" +
                "select one from a menu in the SimBuild dialog box.")
        }
        else if (vals.clicked_button_value === "Insert object"){
            let src = to_source_code({value: object3d})
            Editor.insert(src + "\n")
        }
        else if (vals.clicked_button_value === "Insert all"){
            let src = SimObj.all_user_objects_source_code()
            Editor.insert(src + "\n")
        }
        else if (vals.clicked_button_value === "Inspect object"){
            let a_po = SimObj.get_physics_object(object3d)
            inspect([a_po, object3d])
        }
        else if (vals.clicked_button_value === "Inspect all"){
            let result = {}
            for(let a_po of Simulate.physicsBodies){
                let object3d = a_po.mesh
                result[object3d.name] = [a_po, object3d]
            }
            inspect(result)
        }

        else if (vals.clicked_button_value === "Remove object"){
            let short_name = SimObj.get_geometry_short_name(object3d)
            if(!short_name) { //no short_name geometry
                short_name = ""
            }
            if(confirm("Remove " + short_name + " object: " + SimObj.get_name(object3d) + "?")) {
                SimObj.remove(object3d)
            }
        }
        else if (vals.clicked_button_value === "Remove all"){
            if(confirm("Remove all (" + SimObj.user_objects.length + ") user objects from the simulator?")) {
                SimObj.remove_all()
            }
        }
        else {
            shouldnt("In SimBuild.dialog.cb got invalid clicked_button_value of: " +
                     vals.clicked_button_value )
        }
    }

    static populate_dialog_property(object3d, prop_name, value,
                                    value_prop_name="value"){ //but should be "checked" for checkboxes
        if(object3d === SimBuild.now_editing_object3d) {
            if(value instanceof THREE.Color) {
                value = SimObj.three_color_to_hex(value)
            }
            let dialog_dom_elt = SimBuild.dialog_dom_elt()
            if (dialog_dom_elt) {
                let css_sel = "[name=" + prop_name + "]"
                let widget_dom_elt = dialog_dom_elt.querySelector(css_sel)
                if(widget_dom_elt) {
                    widget_dom_elt[value_prop_name] = value
                }
                else {
                    let css_sel = "[value=" + prop_name + "]" //good for radio buttons like "multi_value"
                    let widget_dom_elt = dialog_dom_elt.querySelector(css_sel)
                    if(widget_dom_elt) {
                        widget_dom_elt[value_prop_name] = value
                    }
                    else {
                        shouldnt("SimBuild.populate_dialog_property got invalid prop_name: " + prop_name)
                    }
                }
            }
        }
    }

    static refresh(){
        this.populate_dialog_from_object_if_now_editing(this.now_editing_object3d)
    }
    static populate_dialog_from_object_if_now_editing(object3d){
        if(this.dialog_is_showing() && (object3d === this.now_editing_object3d)) {
            this.populate_dialog_from_object (object3d)
        }
    }

    /* puts yellow BoxHelper box around now_editing object. But that's too distracting
    static set_now_editing_object3d(object3d=null){
        if(this.now_editing_object3d_box_helper) { //get rid of the old one if any
            this.now_editing_object3d_box_helper.removeFromParent()
        }
        this.now_editing_object3d = object3d
        if(object3d){ //ie non null
            //this.now_editing_object3d_box_helper = new THREE.BoxHelper(object3d, 0xffff00) //yellow
            //object3d.attach(this.now_editing_object3d_box_helper)
            SimUtils.render() //or the helper box won't be shown.
        }
    }*/

    static set_now_editing_object3d(object3d=null){
        //if(object3d === this.now_editing_object3d) { return } //nothing to do
        let old_obj = this.now_editing_object3d
        if(old_obj && old_obj.userData.three_color) {
            //old_obj.material.color = old_obj.userData.color //restore old obj back to orig color
            SimObj.set_color(old_obj, old_obj.userData.three_color)
        }
        if(object3d){
            this.now_editing_object3d = object3d
            if(object3d.material && object3d.material.color) { //if it doesn't have a color, don't try to set it. user_origin doesn't have a color
                 //object3d.userData.color = SimObj.get_color(object3d)
                //object3d.material.color = 0xffff00 //but this format fails yellow for highlighting
                SimObj.set_color(object3d, SimObj.highlight_color) //won't set object3d.userData.color
            }
        }
        if (old_obj || this.now_editing_object3d) {
            // SimUtils.render()
        }
    }

    //obj defaults to last SimObj made.
    //but if no arg passed in and no objects made, do nothing.
    //This method expects the <option> tag for the name of object3d to
    //already be in the_name select tag.
    static populate_dialog_from_object(object3d){
        SimBuild.set_now_editing_object3d(object3d) //do even if object3d is null
        let dialog_dom_elt = SimBuild.dialog_dom_elt()
        if(!dialog_dom_elt) {  return }
        else if (!object3d || (SimObj.user_objects.length === 0)) {
            this.disable_inputs()
            out("To make a new object3d in the simulator pane,<br/>click the <b>Make Object</b> button.", "green")
            return
        }
        else {
            globalThis.simbuild_path_id.innerHTML = this.object_path_html(object3d)
            this.enable_inputs()
            if(SimObj.get_is_dynamic(object3d)){
                this.disable_dynamic_inputs()
            }
            SimBuild.add_object3d_to_the_name_menu(object3d) //adds an option tag under the select, but only if there's not one there for object3D.name
            SimBuild.add_object3d_to_the_parent_menu(object3d)
            this.populate_dialog_property(object3d, "the_name", SimObj.get_name(object3d))
            let par = SimObj.get_parent(object3d)
            //occasionally errors here. par is null so doesn't have a name.
            this.populate_dialog_property(object3d, "the_parent", SimObj.get_name(par))


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


            let three_color = object3d.userData.three_color //null or arr of 0 to 1 integers
            if(three_color) {
                let hex_color = SimObj.three_color_to_hex(three_color)
                SimBuild.populate_dialog_property(object3d, "color", hex_color)
            }
            //multi_color checkbox is now if true, use material "MeshNormal" otherwise use "MeshStandard"
            //let orig_multi_color_dialog_val = dialog_dom_elt.querySelector("[name=multi_color]").checked
            let new_multi_color_val = (object3d.material instanceof THREE.MeshNormalMaterial)
            SimBuild.populate_dialog_property(object3d, "multi_color", new_multi_color_val, "checked")

            let new_wire_frame_val = SimObj.get_wire_frame(object3d) //a boolean
            SimBuild.populate_dialog_property(object3d, "wire_frame", new_wire_frame_val, "checked")

            let new_is_dynamic_val = SimObj.get_is_dynamic(object3d)
            SimBuild.populate_dialog_property(object3d, "is_dynamic", new_is_dynamic_val, "checked")
        }
    }

    static add_object3d_to_the_name_menu(object3d) {
        let dialog_dom_elt = SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let select_dom_elt = dialog_dom_elt.querySelector("[name=the_name]")
            if (select_dom_elt) {
                let the_name = SimObj.get_name(object3d)
                for (let child of select_dom_elt.children) {
                    if (child.innerHTML === the_name) { //already has option for this name
                        return //object3d already in th menu
                    }
                }
                select_dom_elt.insertAdjacentHTML(
                    "afterbegin",
                    "<option>" + the_name + "</option>")
            }
        }
    }

    static add_object3d_to_the_parent_menu(object3d) {
        let dialog_dom_elt = SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let select_dom_elt = dialog_dom_elt.querySelector("[name=the_parent]")
            if (select_dom_elt) {
                let the_name = SimObj.get_name(object3d)
                for (let child of select_dom_elt.children) {
                    if (child.innerHTML === the_name) { //already has option for this name
                        return //object3d already in the menu
                    }
                }
                select_dom_elt.insertAdjacentHTML(
                    "afterbegin",
                    "<option>" + the_name + "</option>")
            }
        }
    }

    static remove_object3d_from_the_name_menu(object3d) {
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let the_select_dom_elt = dialog_dom_elt.querySelector("[name=the_name]")
            for(let a_option_dom_elt of the_select_dom_elt.childNodes){
                let the_name = SimObj.get_name(object3d)
                if(a_option_dom_elt.innerHTML === the_name){
                    a_option_dom_elt.remove() //let run for more iterations just in case > 1 of that name get in the select dom elt
                }
            }
        }
    }

    static remove_object3d_from_the_parent_menu(object3d) {
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if (dialog_dom_elt) {
            let the_select_dom_elt = dialog_dom_elt.querySelector("[name=the_parent]")
            for(let a_option_dom_elt of the_select_dom_elt.childNodes){
                let the_name = SimObj.get_name(SimObj.get_parent(object3d))
                if(a_option_dom_elt.innerHTML === the_name){
                    a_option_dom_elt.remove() //let run for more iterations just in case > 1 of that name get in the select dom elt
                }
            }
        }
    }

    //certain object3d attributes can't be modified when is_dynamic === true
    static disable_dynamic_inputs(){
        let inputs = SimBuild.dialog_dom_elt().querySelectorAll("input")
        for (let a_in of inputs) {
            if (Utils.starts_with_one_of(a_in.name, ["scale", "position", "orientation"])){
                a_in.setAttribute("disabled", "")
            }
        }
    }

    static disable_inputs(){
        let dialog_dom_elt =  SimBuild.dialog_dom_elt()
        if(dialog_dom_elt) {
            let inputs = dialog_dom_elt.querySelectorAll("input")
            for (let a_in of inputs) {
                if (a_in.value !== "Make object"){
                    a_in.setAttribute("disabled", "")
                }
            }
            inputs = dialog_dom_elt.querySelectorAll("select")
            for (let a_in of inputs) {
                if (a_in.name !== "simobj_show"){ //so we can show/hide dexter without another object being edited, like at the beginning of a session
                    a_in.setAttribute("disabled", "")
                }
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