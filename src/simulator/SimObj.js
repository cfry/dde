import {LineMaterial} from "three/examples/jsm/lines/LineMaterial.js"

globalThis.SimObj = class SimObj{
    static dde_objects  = [] //scene, table, dexter
    static user_objects = []
    static array_to_Vector3(arr) { return new THREE.Vector3(arr[0], arr[1], arr[2])}
    static Vector3_to_array(vec3) { return [vec3.x, vec3.y, vec3.z] }

    static rad_to_deg(rad) {return rad * globalThis._rad}
    static deg_to_rad(deg) {return deg / globalThis._rad}

    static ensure_simulate(){
        let sim_val = DDE_DB.persistent_get("default_dexter_simulate")
        if((sim_val !== true) || (sim_val !== "both")) {
            DDE_DB.persistent_set("default_dexter_simulate", true)
        }
        if(!globalThis.simulate_radio_true_id.checked) {
            globalThis.simulate_radio_true_id.checked = true
        }
        if(DDEVideo.misc_pane_menu_selection !== "Simulate Dexter"){
            DDEVideo.show_in_misc_pane("Simulate Dexter")
        }
    }

    static dde_object_names = ["scene", "table", "dexter"]

    static init_dde_objects() {
       //SimObj.remove_all()
       this.scene   = Simulate.sim.scene
       this.table   = Simulate.sim.table
       this.dexter  = Simulate.sim.J0

       this.dde_objects = []
        //below is kludge for this.table not be available in first draft of physics sim
        for (let object3d of [this.scene, this.table, this.dexter]){
             if(object3d) {
                this.dde_objects.push(object3d)
             }
        }
    }

    //Returns an array who's first elt is "scene" and who's
    //last elt is the initially passed object3d.name
    //when called from the outside, don't pass in result.
    //recursively calls itself to build up the returned array
    static ancestor_names(object3d, result=[]){
        result.unshift(object3d.name)
        if(object3d.name === "scene"){
            return result
        }
        else if (!object3d.parent){ //unlikely to hit but just in case
            return result
        }
        else {
            return this.ancestor_names(object3d.parent, result)
        }
    }

    //returns a copy of object3d.children, without BoxHelper, if any
    static get_children(object3d_or_name, include_non_user_objects=false){
        let object3d = this.get_object3d(object3d_or_name)
        if(object3d.children.length === 0) { return [] }
        else if(!include_non_user_objects && (object3d === this.scene)) {
            let kids = []
            for(let a_object3d of this.user_objects){
                if(this.get_parent(a_object3d) === this.scene){
                    kids.push(a_object3d)
                }
            }
            return kids
        }
        else {
            let children_sans_helper = []
            for(let child of object3d.children){
                if(!(child instanceof THREE.BoxHelper)){
                    children_sans_helper.push(child)
                }
            }
            return children_sans_helper
        }
    }

    static has_user_objects(){
        return (this.user_objects.length > 0)
    }

    static is_object3d(object3d_maybe){
        return object3d_maybe instanceof THREE.Object3D // used to use THREE.Mesh here, but that fails for end effector in the dexter gltf model
    }

    static is_dde_object3d(object3d_or_name){
        let object3d = this.get_object3d(object3d_or_name)
        if(!object3d) { return false }
        else {
            let the_name = SimObj.get_name(object3d)
            return this.dde_object_names.includes(the_name)
        }
    }
    static is_user_object3d(object3d_or_name){
        let object3d = this.get_object3d(object3d_or_name)
        if(!object3d) { return false }
        else {
            //return !this.is_dde_object3d(object3d)
            return this.user_objects.includes(object3d)
        }
    }


    static scene_and_user_objects(){
        return [SimObj.scene].concat(this.user_objects)
    }
    static scene_and_user_objects_names(){
        let result = ["scene"]
        for(let object3d of this.user_objects){
            let name = SimObj.get_name(object3d)
            result.push(name)
        }
        return result
    }

    //dde  xyz ->
    //3js -xzy  ???
    //setting x moves it to y neg
    //setting y moves it to z pos
    //setting z moves it to x neg
    static position_dde_to_three(array_of_3){
        return [array_of_3[1] * -1, //fixes dde y positioning
                array_of_3[2],
                array_of_3[0] * -1 //fixes dde x positionng
        ]
    }
    static position_three_to_dde(array_of_3){
        let dde_x = array_of_3[2] * -1 //fixes dde x positionng
        //dde_x = ((dde_x === 0) ? 0 : dde_x * -1) //ensure that we don't get any JS -0's
        let dde_y = array_of_3[0]  * -1 //fixes dde y positioning
        //dde_y = ((dde_y === 0) ? 0 : dde_y * -1)
        let dde_z = array_of_3[1]
        //dde_z = ((dde_z === 0) ? 0 : dde_z * -1)

        return [dde_x, dde_y, dde_z]
    }

    static orientation_dde_to_three(array_of_3){
        return [array_of_3[1] / globalThis._rad,
                array_of_3[2] / globalThis._rad  * -1, //dde's z axis
                array_of_3[0] / globalThis._rad
              ]
    }

    static orientation_three_to_dde(array_of_3){
        return [array_of_3[2] * globalThis._rad,
                array_of_3[0] * globalThis._rad,
                array_of_3[1] * globalThis._rad  * -1, //dde's z axis
        ]
    }

    static vector3_to_dde(vec3){
        let dde_x = vec3.z  //z -> x
        //dde_x = ((dde_x === 0) ? 0 : dde_x * -1) //ensure that we don't get any JS -0's
        let dde_y = vec3.x  //x -> y
        //dde_y = ((dde_y === 0) ? 0 : dde_y * -1)
        let dde_z = vec3.y  //y -> z
        //dde_z = ((dde_z === 0) ? 0 : dde_z * -1)
        return [dde_x, dde_y, dde_z]
    }

    static scale_dde_to_three(array_of_3){
        let result = this.position_dde_to_three(array_of_3)
        result[0] = ((result[0] < 0) ? result[0] * -1 : result[0])
        result[1] = ((result[1] < 0) ? result[1] * -1 : result[1])
        result[2] = ((result[2] < 0) ? result[2] * -1 : result[2])
        return result
    }

    static scale_three_to_dde(array_of_3){
        let result = this.position_three_to_dde(array_of_3)
        result[0] = ((result[0] < 0) ? result[0] * -1 : result[0])
        result[1] = ((result[1] < 0) ? result[1] * -1 : result[1])
        result[2] = ((result[2] < 0) ? result[2] * -1 : result[2])
        return result
    }

    //returns an existing object3d or null if none matches object3d_or_name
    static get_object3d(object3d_or_name=null) {
        if (typeof (object3d_or_name) === "string") {
            let object3d = SimObj[object3d_or_name]
            if (object3d) {
                return object3d
            }
            else { return null }
        }
        else if (this.is_object3d(object3d_or_name)) {
            return object3d_or_name
        }
        else if (!object3d_or_name) {
            return null
        }
        else {
            dde_error("SimObj.get_object3d called with: " + object3d_or_name
                + " which does not represent an object.")
        }
    }

    /*
    static get_bounding_box(object3d_or_name) {
        //from https://discourse.threejs.org/t/bounding-box-is-calculated-wrong/1763/5
        let bbox = new THREE.Box3() //.setFromObject(obj)
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.geometry.computeBoundingBox()
        bbox.copy(object3d.geometry.boundingBox )
        object3d.updateMatrixWorld( true ); // ensure world matrix is up to date
        bbox.applyMatrix4( object3d.matrixWorld )
        return bbox
    }*/

    //in world coords. bounding box is aligned to the world grid
    static get_bounding_box(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let bbox = new THREE.Box3().setFromObject(object3d) //from https://threejs.org/docs/?q=Box3#api/en/math/Box3, should return result in world coords.
        return bbox
    }

    //result in world coords, dde array of x, y, z
    static get_center(object3d_or_name){
        let bbox = SimObj.get_bounding_box(object3d_or_name)
        let center_vec3 = new THREE.Vector3()
        bbox.getCenter(center_vec3)  //now center_vec3 is full
        let result = SimObj.vector3_to_dde(center_vec3)
        return result
    }




    //xyz is in DDE coordinates
    //this fn is broken due to I can't figure out the proper
    //position transformations.
    /*static object_contains_xyz(object3d_or_name, xyz){
        let object3d       = this.get_object3d(object3d_or_name)
        let xyz_three_arr  = this.position_dde_to_three(xyz)
        let xyz_three_vec3 = this.array_to_Vector3(xyz_three_arr)
        let xyz_three_vec3_table = Simulate.sim.table.localToWorld(xyz_three_vec3)
        let xyz_three_vec3_world = object3d.localToWorld(xyz_three_vec3)

        let bbox = this.get_bounding_box(object3d)
        let bbox_min_vec3 = bbox.min
        let bbox_max_vec3 = bbox.max
        let bbox_min_vec3_world = object3d.localToWorld(bbox_min_vec3)
        let bbox_max_vec3_world = object3d.localToWorld(bbox_max_vec3)

        let result = bbox.containsPoint(bbox_max_vec3_world)
        return result
    }*/

    //xyz is dde xyz, in world coords. returns boolean
    static object_contains_xyz(object3d_or_name, xyz){
        let object3d       = this.get_object3d(object3d_or_name)
        let xyz_three_arr  = this.position_dde_to_three(xyz)
        let xyz_three_vec3 = this.array_to_Vector3(xyz_three_arr)
        let bbox = this.get_bounding_box(object3d) //should be in world coords
        let result = bbox.containsPoint(xyz_three_vec3)
        return result
    }

    //xyz is in dde coordinates
    //returns the latest (newest) object found that contains xyz or null if none.
    //this fn is broken due to I can't figure out the proper
    //position transformations.
    static object_containing_xyz(xyz){
        if(!this.user_objects) { return null }
        for(let i = this.user_objects.length - 1; i >= 0; i--){
            let obj = this.user_objects[i]
            if(this.object_contains_xyz(obj, xyz)){
                return obj
            }
        }
        return null
    }


    static newest_object_intersecting_object(object3d_or_name){
        if(!this.user_objects) { return null }
        let main_obj = this.get_object3d(object3d_or_name)
        for(let i = (this.user_objects.length - 1); i >= 0; i--){
            let obj = this.user_objects[i]
            if((obj !== main_obj) && this.does_object_intersect_object(main_obj, obj)){
                return obj
            }
        }
        return null
    }

    //returns all objects in this.user_objects that intersects with
    //the passed in object, or null if none
    static objects_intersecting_object(object3d_or_name){
        if(!this.user_objects) { return null }
        let main_obj = this.get_object3d(object3d_or_name)
        let result = []
        for(let obj of this.user_objects){
            if((obj !== main_obj) && this.does_object_intersect_object(main_obj, obj)){
                result.push(obj)
            }
        }
        return result
    }


    /*static does_object_intersect_object(object3d_or_name1, object3d_or_name2){
        let object1 = this.get_object3d(object3d_or_name1)
        let object2 = this.get_object3d(object3d_or_name2)
        //from https://discourse.threejs.org/t/collisions-two-objects/4125/3
        // detectCollisionCubes
        object1.geometry.computeBoundingBox(); //not needed if its already calculated
        object2.geometry.computeBoundingBox();
        object1.updateMatrixWorld();
        object2.updateMatrixWorld();
        let box1 = object1.geometry.boundingBox.clone();
        box1.applyMatrix4(object1.matrixWorld);
        let box2 = object2.geometry.boundingBox.clone();
        box2.applyMatrix4(object2.matrixWorld);
        return box1.intersectsBox(box2);
    }*/

    static does_object_intersect_object(object3d_or_name1, object3d_or_name2) {
        let object1 = this.get_object3d(object3d_or_name1)
        let object2 = this.get_object3d(object3d_or_name2)
        let box1    = new THREE.Box3().setFromObject(object1) //world axis aligned
        let box2    = new THREE.Box3().setFromObject(object2) //world axis aligned
        return box1.intersectsBox(box2)
    }

    /*static does_object_intersect_object(object3d_or_name1, object3d_or_name2) {
        let object1 = this.get_object3d(object3d_or_name1)
        let object2 = this.get_object3d(object3d_or_name2)
        let box1    = object1.position.clone() //copy so as not to over-write
        object1.localToWorld(box1) //fills box1 with world coords
        let box2    = object2.position.clone() //copy so as not to over-write
        object2.localToWorld(box2) //fills box2 with world coords
        return box1.intersectsBox(box2)
    }*/

    //not now used
    static make_cylinder({name= "my_cylinder",
                             scale         = [1, 1, 1],
                             top_diameter   = 1,
                             bottom_diameter = 1,
                             height         = 1,
                             sides          = 12,
                             position      = [0, 0, 0], //dde coords
                             orientation   = [0, 0, 0], //dde coords
                             color         = [1, 1, 1], //0x00ff00
                             is_dynamic     = false,
                             mass           = 1 //in grams
                         } = {}) {
        let geometry = new THREE.CylinderGeometry(top_diameter / 2, bottom_diameter / 2, height, sides)
        return this.make_object3d({name: name, geometry: geometry, scale: scale, position: position, orientation: orientation, color: color, is_dynamic: is_dynamic, mass: mass })
    }

    static is_line(object3d){
        return object3d instanceof THREE_extra.Line2
    }

    static make_non_line_from_line_object3d(object3d, geometry){
        let result = this.make_object3d({
                            name: object3d.name,
                            parent: object3d.parent,
                            geometry: geometry,
                            points: this.get_points(object3d), //[[0, 0, 0], this.get_position(object3d)],
                            line_width: this.get_line_width(object3d),
                            //material: use default
                            scale: this.get_scale(object3d),
                            position: this.get_position(object3d),
                            color: this.get_color(object3d),
                            is_dynamic: this.get_is_dynamic(object3d),
                            mass: this.get_mass(object3d),
                            overwrite: true

        })
        result.userData.points = object3d.userData.points
    }

    //called by set_geometry when switching geo from something else to a line
    static make_line_from_object3d(object3d){
        if(this.is_line(object3d)) {
            return object3d //no change needed
        }
        else {
            let line_width = this.get_line_width(object3d) //((object3d.userData.line_width) ? object3d.userData.line_width : 10)
            let name = this.get_name(object3d)
            let parent = this.get_parent(object3d)  //must capture as "remove' removes the parent
            this.remove(object3d) //must do or can't make object with same name
            let geometry = new THREE_extra.LineGeometry();
            let material =  new THREE_extra.LineMaterial({
                //color: three_color, // 'red',
                linewidth: line_width, // in pixels
                //vertexColors: true,
                dashed: false,
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight) //necesasry to give line a visible width
            })
            let points
            if(object3d.userData.points) {
                points = object3d.userData.points
            }
            else {
                points = [[0, 0, 0.2], this.get_position(object3d)]
            }
            let scale = this.get_scale(object3d)
            let position = this.get_position(object3d)
            let orientation = this.get_orientation(object3d)
            let color = this.get_color(object3d)
            let result = this.make_object3d({
                name: name,
                parent: parent,
                geometry: geometry,
                points: points,
                line_width: line_width,
                material: material,
                scale: scale,
                position: position,
                orientation: orientation,
                color: color,
                wireframe: false,
                //no physics on lines
                is_dynamic: false,
                mass: 1.,
                overwrite: true
            })
            return result
        }
    }

    /* causes infinite recursion so don't use. call make_object instead
    static make_line ({name="my_line",
                          parent = "scene",
                          //geometry="Box", //must be a string
                          points = [[0, 0, 0], [0.5, 0, 0]], //an array of arrays. inner elements are 3 long foe x, y ,z
                                             //effectively the "geometry" but not standard SimObj geometry
                          line_width = 10
                          scale= [0.2, 0.2, 0.2],
                          position=[0, 0.3, 0.1],
                          orientation=[0, 0, 0],
                          //material = "MeshNormal", //must be a string. for one-color objects. use "MeshNormal" for a multi_color material that ignores the "color" passed in here
                          color=[0, 0, 0]
                         } = {}){
        let geometry = new THREE_extra.LineGeometry();
        let material =  new THREE_extra.LineMaterial({
            //color: three_color, // 'red',
            linewidth: line_width, // in pixels
            //vertexColors: true,
            //resolution:  // to be set by renderer, eventually
            dashed: false,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight) //necesasry to give line a visible width
        })
        return this.make_object3d({
            name: name,
            parent: parent,
            geometry: geometry,
            points: points,
            scale: scale,
            position: position,
            orientation: orientation,
            material: material,
            color: color,
            wireframe: false,
            //no physics on lines
            is_dynamic: false,
            mass: 1
        })
    } */

    //pass in an instance of a THREE.Geometry.
    //see https://threejs.org/docs/#api/en/geometries for 20 or so geometries.

    static geometry_to_geometry_instance(geometry){
        let geometry_inst
        if ((geometry.isBufferGeometry) || (geometry instanceof THREE_extra.LineGeometry)){
            geometry_inst = geometry
        }
        else if (typeof (geometry) === "string") {
            if (!(geometry.endsWith("Geometry"))) {
                geometry = geometry + "Geometry"
            }
            geometry = Utils.capitalize_string(geometry)
            let geometry_class = ((geometry === "LineGeometry") ? THREE_extra.LineGeometry : THREE[geometry])
            if(!geometry_class){
                let mess = "SimObj.geometry_to_geometry_instance passed: " + geometry +
                    " which is not one of the valid geometries of:<br/>" +
                    SimBuild.geometry_names.join(", ")
                Talk.display_warning(mess)
                dde_error(mess)
            }
            geometry_inst = new geometry_class()
        }
        else if(Utils.is_class(geometry)){
            geometry_inst = new geometry()
        }
        else {
            dde_error("In SimObj.geometry_to_geometry_instance, could not convert: " + geometry + " into a geometry instance.")
        }
        return geometry_inst
    }

    //Materials used in SimObj: "MeshNormalMaterial", "MeshPhongMaterial", THREE_extra.LineMaterial
    //can be passed "Box", "BoxMaterial" THREE.BoXMaterial, and instance of BoxMatrial (in which it cloaes it)
    static material_to_material_instance(material) {
        let material_inst
        if (material instanceof THREE.Material) {
            material_inst = material.clone() //because material gets modified due to color & wireframe, and we don't want those mods to be "inherited" between different objects
        }
        else if (typeof (material) === "string") {
            if (!material.endsWith("Material")) {
                material = material + "Material"
            }
            let material_class
            if (material === "LineMaterial") {
                material_class = THREE_extra.LineMaterial
            } else {
                material_class = THREE[material]
            }
            material_inst = new material_class()
        }
        if(Utils.is_class(material)){
            material_inst = new material()
        }
        return material_inst
    }

    static make_object3d({name="my_object3d",
                          parent = "scene",
                          geometry="Box", //must be a string
                          points =  [[0, 0, 0], [0.5, 0.5, 0]], //same as make_line, only used when geometey is "Line"
                          line_width = 10, //same as make_line, only used when geometey is "Line"
                          scale= [0.2, 0.2, 0.2],
                          position=[0, 0.3, 0.1],
                          orientation=[0, 0, 0],
                          material = "MeshNormal", //must be a string. for one-color objects. use "MeshNormal" for a multi_color material that ignores the "color" passed in here
                          color=[1, 1, 1],
                          wire_frame = false,
                          is_dynamic = false,
                          mass = 1, //in grams
                          overwrite = false //permit this new object to happen even if one alredy exists
                         } = {}) { //[1, 1, 1] is white, corresponding to #ffffff
        if (parent === "user_origin") {
            warning('"user_origin" is no longer a valid object.<br/>' +
                "The normal top level user object now has a parent of: 'scene'<br/." +
                "so we're going to use that instead.")
            parent = "scene"
        }
        let old_obj_of_name = this.get_object3d(name)
        if (old_obj_of_name){
            if (overwrite) {
                this.remove(name) //for SimObj, a "name" is unique within the children
            }
            else {
                warning("Attempt to make_object3d with name: " + "<br/>" +
                    "but an object of that name already exists.<br/>" +
                    "If you want to make a new object of that name,<br/>" +
                    'Call <code>SimObj.remove("' + name + '")</code> to remove the old one first.')
                return
            }
        }

        //no object of tha passed in name exists, and new obj is not a Line.
        let geometry_inst = this.geometry_to_geometry_instance(geometry)
        let material_inst = this.material_to_material_instance(material)
        let object3d
        if(geometry_inst instanceof THREE_extra.LineGeometry){
            object3d = new THREE_extra.Line2(geometry_inst, material_inst)
        }
        else {
            object3d = new THREE.Mesh(geometry_inst, material_inst)
        }
        object3d.name = name
       //if(typeof(material) === "object") {
       //     material = material.clone() //because material gets modified due to color & wireframe, and we don't want those mods to be "inherited" between different objects
       // }
       // object3d = this.set_geometry(object3d, geometry, true)  //true for is_new_object3d // in the case that
                   //geometry is LineGeometry and object3d is NOT a line, we create a new object.
        this.set_points(object3d, points)
        //this.set_material(object3d, material)
        this.set_line_width(object3d, line_width)
        this.set_color(object3d, color) //creates and sets the material property of the Mesh
        this.set_wire_frame(object3d, wire_frame)
        this.set_scale(object3d, scale, true) //true for is_new_object3d
        this.set_position(object3d, position, true) //keep as dde_coordinates
        this.set_orientation(object3d, orientation, true) //keep as dde_coordinates
        this.make_object3d_given_object(object3d, parent, is_dynamic, mass)
        let a_pos = this.get_physics_object(object3d) //needs to be done after set_scale, but cant' be done first time we call set_scale on this object3d
        return object3d
    }

    //called by both make_object3d and  make_copy_of_object3d
    static make_object3d_given_object(object3d, parent= "scene",
                                      is_dynamic = false,
                                      mass = 1 //in grams
                                     ){
        this[object3d.name] = object3d
        SimObj.set_parent(object3d, parent) //adds object3d to the scene since its adding it to the parent which should already be in the scene
        let adding_first_object = !SimObj.has_user_objects()
        let new_name = SimObj.get_name(object3d)
        if(!SimObj.dde_object_names.includes(new_name)) {
            SimObj.user_objects.push(object3d)
        }
        this.interaction_add(object3d)
        //SimUtils.render()
       this.set_physics_object(object3d, is_dynamic, mass) //make non-dynamic
       if(SimBuild.dialog_is_showing()) {
            if (adding_first_object) {
                SimBuild.populate_dialog_from_object(object3d) //might as well maie it the edited object and enable dialog widgets
            }
            else {
                SimBuild.populate_dialog_from_object_if_now_editing(object3d)
            }
        }
        return object3d
    }

    //patterned after simple example at: https://github.com/markuslerner/THREE.Interactive/blob/master/examples/simple.html
    //init code also in Simulate.js, method: static init_interaction_manager()
    static interaction_add(object3d){
        globalThis.interactionManager.add(object3d); //can be done twice on same object3d without a "duplicate" interaction
        if(object3d._listeners && object3d._listeners.click) { } //we don't want to add interactions or listeners twice when refreshing the simulator
        else {
            //globalThis.interactionManager.add(object3d); //enables clicking on obj in sim pane. Not needed with the "auto" option
            //problems with the mouseover, mouseout OR mouseenter, mouseleave:
            //sometimes triggers when mouse enters the whole sim pane and
            //that sometimes makes mouse automatically start re-orienting the scene.
            /*object3d.addEventListener('mouseover', (event) => { //when mouse enters the obj
                document.body.style.cursor = 'pointer';
                console.log("mouseover: " + event);
                event.stopPropagation();
            })
            object3d.addEventListener('mouseout', (event) => { //when mouse leaves the obj
                document.body.style.cursor = 'default';
                console.log("mouseout: " + event);
                event.stopPropagation();
            })*/
            object3d.addEventListener('click', (event) => {
                let object3d_maybe = event.target
                if (SimObj.is_user_object3d(object3d_maybe)) {
                    SimBuild.populate_dialog_from_object(object3d_maybe)
                    console.log("mouseclick: " + event);
                    event.stopPropagation()
                }
            })
        }
    }

    //called by Simulate.init_simulation and when resizing the Sim pane.
    static refresh(){
        if(this.user_objects.length > 0) {
            Simulate.init_interaction_manager() //disposes of existing interactionManager if any
            //and creates a new one. Without doing this, after refresh, clicking on objects won't work.
            let sorted_user_objects = this.sort_parents_first(SimObj.user_objects)
            for (let object3d of sorted_user_objects) {
                object3d.userData.parent_name = object3d.parent.name
            }
            this.remove_all() //removes all user objects form scene but  also removes the parent from each object3d
            for (let object3d of sorted_user_objects) {
                let parent = SimObj.get_object3d(object3d.userData.parent_name)
                let is_dynamic = this.get_is_dynamic(object3d)
                let mass_in_grams = this.get_mass(object3d)
                SimObj.make_object3d_given_object(object3d, parent, is_dynamic, mass_in_grams)
                //SimObj[object3d.name] = object3d //because remove_all removes this binding, so restore it
                //SimObj.user_objects.push(object3d) //also removed by remove_all
                //parent.add(object3d)
            }
            //SimUtils.render()
        }
    }

    //tries for a unique_name with the prefix up to 1k suffixes, and if it can't,
    //find one, returns null
    static unique_name_for_object3d_or_null(base_object3d_name = "my_object3d"){
        if(!SimObj[base_object3d_name]) {
            return base_object3d_name
        }
        else {
            let existing_parts = base_object3d_name.split("_")
            let last_existing_part = Utils.last(existing_parts)
            let num = parseInt(last_existing_part)
            let prefix
            if (Number.isNaN(num)) {
                prefix = base_object3d_name
                num = 1
            } else {
                let all_but_last_existing_parts = existing_parts.slice(0, -1) //cut off the last elt
                prefix = all_but_last_existing_parts.join("_")
            }
            for (let i = num; i < 1000; i++) {
                let new_name = prefix + "_" + i
                if (!SimObj[new_name]) {
                    return new_name
                }
            }
            return null
        }
    }

    /* failed to make proper copis of children.
    static make_copy_of_object3d(object3d_or_name, name = null, copy_descendents_too=false){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(!name){
            name = this.unique_name_for_object3d_or_null(SimObj.get_name(object3d))
        }
        if(!name) {
            dde_error("You called SimObj with no name.<br/>" +
                      "There are already 1k object with that name followed by a number.<br>" +
                      "Please supply a unique name.")
        }
        // the below 3 lines are similar to lines in make_object3d
        let a_copy = object3d.clone(copy_descendents_too) //false means we will NOT copy the descendents (children) just object3d itself
        a_copy.name = name
        a_copy.material = object3d.material.clone() //needed or the same material will be used as object3d meaning we can't set their colors differently
        this[name] = a_copy
        let is_dynamic = this.get_is_dynamic(object3d)
        let mass_in_grams = this.get_mass(object3d)
        //also called by make_object3d
        this.make_object3d_given_object(a_copy, object3d.parent, is_dynamic, mass_in_grams)
        return a_copy
    }*/

    /* failed to make proper copis of children.
    static make_copy_of_object3d(object3d_or_name, name = null, copy_descendents_too=false, parent_of_copy){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(!name){
            name = this.unique_name_for_object3d_or_null(SimObj.get_name(object3d))
        }
        if(!name) {
            dde_error("You called SimObj with no name.<br/>" +
                "There are already 1k object with that name followed by a number.<br>" +
                "Please supply a unique name.")
        }
        if(!parent_of_copy){
            parent_of_copy = this.get_parent(object3d)
        }
        let copy_of_object3d = this.make_object3d({
            name: name,
            parent: parent_of_copy,
            geometry: this.get_geometry_short_name(object3d),
            material: this.get_material_short_name(object3d),
            scale: this.get_scale(object3d),
            position: this.get_position(object3d),
            orientation: this.get_orientation(object3d),
            color: this.get_color(object3d),
            wire_frame: this.get_wire_frame(object3d),
            is_dynamic: this.get_is_dynamic(object3d),
            mass: this.get_mass(object3d)
        })
        if(copy_descendents_too) {
            for (let child of SimObj.get_children(object3d)) {
                this.make_copy_of_object3d(child, undefined, copy_descendents_too, copy_of_object3d)
            }
        }
        return copy_of_object3d
    }*/

    //called by SimBuild dialog box "Copy object" button
    static make_copy_of_object3d(object3d_or_name, name = null, copy_descendents_too=false){
        let object3d_orig = SimObj.get_object3d(object3d_or_name)
        if(!name){
            name = this.unique_name_for_object3d_or_null(SimObj.get_name(object3d_orig))
        }
        if(!name) {
            dde_error("You called SimObj with no name.<br/>" +
                "There are already 1k object with that name followed by a number.<br>" +
                "Please supply a unique name.")
        }
        // the below 3 lines are similar to lines in make_object3d
        let orig_po = SimObj.get_physics_object(object3d_orig)
        let po_cache = []
        this.remove_and_cache_physics_objects(object3d_orig, po_cache)  //todo In object3d_orig, I have to remove all the po's of all the children, removemer them, then restore them
        let object3d_copy = object3d_orig.clone(copy_descendents_too) //false means we will NOT copy the descendents (children) just object3d itself
        this.restore_physics_objects(object3d_orig, po_cache)  //because clone fails due to circularity of the po so remove it, then place it back
        object3d_copy.name = name
        this.make_copy_of_object3d_aux(object3d_orig, object3d_copy, copy_descendents_too)
        object3d_orig.parent.add(object3d_copy)
        //SimBuild.populate_dialog_from_object(object3d_copy)  //don't do. Simbuild callback populates dialog with object3d_copy
        return object3d_copy
    }

    static remove_and_cache_physics_objects(object3d_orig, po_cache=[]){
        let a_po = this.get_physics_object(object3d_orig)
        object3d_orig.userData.physObj = po_cache.length //replace po so we can call clone on it without error
        po_cache.push(a_po) //cache po for use by restore_physics_objects
        for(let child of object3d_orig.children){ //recurse
            this.remove_and_cache_physics_objects(child, po_cache)
        }
    }

    //restore the physobj
    static restore_physics_objects(object3d_orig, po_cache){
        let po_index = object3d_orig.userData.physObj
        if(!Utils.is_integer(po_index)){
            shouldnt("SimObj.restore_pos got non intenger po_index of: " + po_index)
        }
        else {
            object3d_orig.userData.physObj = po_cache[po_index] //restore
            for(let child of object3d_orig.children){ //recurse
                this.restore_physics_objects(child, po_cache)
            }
        }
    }

    //called for the top level coped object AND each of its kids.
    //object3d has already been cloned
    static make_copy_of_object3d_aux(object3d_orig, object3d_copy, copy_descendents_too=false){
        //name processing
        if(this.scene_and_user_objects_names().includes(object3d_copy.name)) { //we don't want duplicates
            let new_name = name = this.unique_name_for_object3d_or_null(object3d_copy.name)
            object3d_copy.name = new_name
        }
        this[object3d_copy.name] = object3d_copy
        SimObj.user_objects.push(object3d_copy)

        object3d_copy.material = object3d_orig.material.clone() //needed or the same material will be used as object3d meaning we can't set their colors differently
        this.interaction_add(object3d_copy)
        SimBuild.add_object3d_to_the_name_menu(object3d_copy)

        //physics
        let is_dynamic = this.get_is_dynamic(object3d_orig)
        let mass_in_grams = this.get_mass(object3d_orig)
        this.set_physics_object(object3d_copy, is_dynamic, mass_in_grams)

        //recursion
        if(copy_descendents_too) {
            for (let i = 0; i < object3d_orig.children.length; i++) {
                let object3d_orig_child = object3d_orig.children[i]
                let object3d_copy_child = object3d_copy.children[i]
                this.make_copy_of_object3d_aux(object3d_orig_child, object3d_copy_child)
            }
        }
    }

    static remove(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(object3d) {
                let index = this.user_objects.indexOf(object3d)
                this.user_objects.splice(index, 1) //remove it from array, modifying the array, and now the array is  1 shorter.
                if(SimBuild.gripper_now_holding_object === object3d) {
                    SimBuild.gripper_now_holding_object = null
                }
                let the_name = SimObj.get_name(object3d)
                if (this[the_name]) {
                    delete this[the_name]
                }
                SimBuild.remove_object3d_from_the_name_menu(object3d)
                if(object3d === SimBuild.now_editing_object3d){
                    if(this.has_user_objects()){
                        let obj_to_edit = Utils.last(this.user_objects)
                        SimBuild.populate_dialog_from_object(obj_to_edit)
                    }
                    else { //we removed the last object, so disable dialog inputs if dialog is up
                        SimBuild.populate_dialog_from_object(null) //disables inputs
                    }
                }
                //SimUtils.render()
            let a_po = this.get_physics_object(object3d)
            if(a_po) {
                a_po.destroy()
            }

            //put this after a_po.destroy, because destroy will remove the parent,
            //and if the parent is NOT there. destroy will error.
            if(object3d.parent) { //just in case we deleted the parent.
                object3d.removeFromParent() //  THREE js method to remove the object
            }
            globalThis.interactionManager.remove(object3d)
        }
        //else apparently object3d_or_name is already gone, so do nothing.
    }

    static remove_all(){
        for(let i = (SimObj.user_objects.length - 1); i >= 0; i--){
            let object3d = SimObj.user_objects[i]
            this.remove(object3d)
        }
    }

    static get_name(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(object3d === SimObj.dexter) { return "dexter"}
        else { return object3d.name }
    }

    //see SimObj.remove for what needs to be done
    //called by TalkObject.js
    static set_name(object3d_or_name, new_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let old_name = object3d.name
        delete this[old_name]
        SimBuild.remove_object3d_from_the_name_menu(object3d)
        this[new_name] = object3d
        object3d.name = new_name
        SimBuild.add_object3d_to_the_name_menu(object3d) //now has its new name
        SimBuild.populate_dialog_from_object_if_now_editing(object3d)
    }

    static get_parent(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.parent
    }

    static set_parent(object3d_or_name, new_parent="scene") {
        let object3d = SimObj.get_object3d(object3d_or_name)
        new_parent = SimObj.get_object3d(new_parent)
        if(object3d === new_parent){
            dde_error("In SimObj.set_parent, attempt to set the parent of: " + object3d.name + " to itself.")
        }
        else if((object3d === SimObj.scene) && (new_parent !== null)) {
            dde_error("You can't set the parent of scene. Attempt to set it to: " + new_parent.name)
        }
        else if (new_parent.children.includes(object3d)) {} //nothing to do.
        else {
            if(new_parent !== SimObj.scene) {
                SimObj.scene.attach(object3d) //if new_parent happens to be a descendent of object3d when
                //this method is called, we get an infinite recursion when we call
                // new_parent.attach(object3d)  below. So circumvent that by first remove
            }
            new_parent.attach(object3d)
            let a_pos = this.get_physics_object(object3d) //needs to be done after set_scale, but cant' be done first time we call set_scale on this object3d
        }
        SimBuild.populate_dialog_from_object_if_now_editing(object3d)
        //SimUtils.render()
    }

    static is_descendent_of(object3d_maybe_descendent, ancestor){
         let ans_children = SimObj.get_children(ancestor)
         if(ans_children.includes(object3d_maybe_descendent)){
             return true
         }
         else {
             for(let lower_ancestor of ans_children){
                 let is_desc = this.is_descendent_of(object3d_maybe_descendent, lower_ancestor)
                 if(is_desc) {
                     return true
                 }
             }
             return false
         }
    }


    //returns array of [x, y, z] meters, in dde coords
    static get_position(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let array_of_3 = [object3d.position.x, object3d.position.y, object3d.position.z]
        return SimObj.position_three_to_dde(array_of_3)
    }

    //array_of_3 in dde_coords
    static set_position(object3d_or_name, array_of_3 = [0, 0, 0], is_new_object3d = false){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_pos = this.position_dde_to_three(array_of_3)
        object3d.position.x = three_pos[0]
        object3d.position.y = three_pos[1]
        object3d.position.z = three_pos[2]
        SimBuild.populate_dialog_property(object3d, "position_x", array_of_3[0])
        SimBuild.populate_dialog_property(object3d, "position_y", array_of_3[1])
        SimBuild.populate_dialog_property(object3d, "position_z", array_of_3[2])
        if(!is_new_object3d){  //we don't want to do when we are first creating object3d as it will error as there will be no physicsobj but DO what to do if we are just changing the scale
            let a_pos = this.get_physics_object(object3d)
        }
        //SimUtils.render()
    }

    //returns array of [x_deg, y_deg, z_deg] in DDE coords
    static get_orientation(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let euler_rotation = object3d.rotation
        let three_orientation = [this.rad_to_deg(euler_rotation._x),
            this.rad_to_deg(euler_rotation._y),
            this.rad_to_deg(euler_rotation._z)
        ]
        return this.position_three_to_dde(three_orientation)
    }

    static get_orientation(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let rads_in_three = [object3d.rotation._x, object3d.rotation._y, object3d.rotation._z]
        let dde_orientation = this.orientation_three_to_dde(rads_in_three)
        return dde_orientation
    }

    static set_orientation(object3d_or_name, orientation = [0, 0, 0], is_new_object3d = false){
        let object3d = SimObj.get_object3d(object3d_or_name)
        //let rads_in_dde = [orientation[0] / globalThis._rad,
        //                   orientation[1] / globalThis._rad,
        //                   orientation[2] / globalThis._rad]
        let rads_in_three = this.orientation_dde_to_three(orientation)
        //obj.rotateX(rads_in_three[0]) //todo find set rotations
        //obj.rotateY(rads_in_three[1])
        //obj.rotateZ(rads_in_three[2])
        //obj.rotation.set([rads_in_three[0], rads_in_three[1], rads_in_three[2]])

        object3d.rotation.x = rads_in_three[0]
        object3d.rotation.y = rads_in_three[1]
        object3d.rotation.z = rads_in_three[2]

        if(!is_new_object3d){  //we don't want to do when we are first creating object3d as it will error as there will be no physicsobj but DO what to do if we are just changing the scale
            let a_pos = this.get_physics_object(object3d)
        }

        /*the below 2 lines fail on rotation personal factory write just like the above 3 lines,
        //by skewing instead of rotataing

        let a_euler = new THREE.Euler( rads_in_three[0], rads_in_three[1], rads_in_three[2], 'XYZ' )
        object3d.setRotationFromEuler(a_euler
         */

        /*object3d.rotation.x = orientation[0] / globalThis._rad
        object3d.rotation.y = orientation[1] / globalThis._rad
        object3d.rotation.z = orientation[2] / globalThis._rad*/


        SimBuild.populate_dialog_property(object3d, "orientation_x", orientation[0])
        SimBuild.populate_dialog_property(object3d, "orientation_y", orientation[1])
        SimBuild.populate_dialog_property(object3d, "orientation_z", orientation[2])
        //SimUtils.render()
    }

    static get_scale(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_scale = [object3d.scale.x, object3d.scale.y, object3d.scale.z]
        return this.scale_three_to_dde(three_scale)
    }

    //scale in dde_coords
    static set_scale(object3d_or_name, scale = [1, 1, 1], is_new_object3d=false){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_scale = this.scale_dde_to_three(scale)
        object3d.scale.x = three_scale[0]
        object3d.scale.y = three_scale[1]
        object3d.scale.z = three_scale[2]
        SimBuild.populate_dialog_property(object3d, "scale_x", scale[0])
        SimBuild.populate_dialog_property(object3d, "scale_y", scale[1])
        SimBuild.populate_dialog_property(object3d, "scale_z", scale[2])
        let a_pos = this.get_physics_object(object3d)
        if(a_pos){
            a_pos.updateCollider()
        }
        //SimUtils.render()
    }
    static get_geometry(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.geometry
    }

    //the Geometry string like "Box", without a "Geometry" suffix
    static get_geometry_short_name(object3d_or_name){
        let object3d = this.get_object3d(object3d_or_name)
        if(!object3d.geometry) { return null }
        let the_class = Utils.get_class_of_instance(object3d.geometry)
        let class_name = Utils.function_name(the_class)
        let name_parts = class_name.split(".")
        let last_class = Utils.last(name_parts)
        let geo_index = last_class.indexOf("Geometry")
        if(geo_index > 0){
            last_class = last_class.slice(0, geo_index)
        }
        return last_class
    }

    static two_d_shape_names = ["Circle", "Plane", "Ring", "Shape"]

    static is_geometry_a_2d_shape(geometry_or_name){
        let geo_name = geometry_or_name
        if(geometry_or_name instanceof THREE.BufferGeometry){
            geo_name = geometry_or_name.type //ie "CircleGeometry"
        }
        return Utils.starts_with_one_of(geo_name, this.two_d_shape_names)
    }

    //this set_prop is the only one that returns an object3d. This is necessary since
    //if geometry happnes to be "Line", "LineGeomotry" or an instance of LineGeometry,
    //we must make a new object3d to create a line, we can't simply plop a LineGeometry
    //into an existing NON-lINE geometry
    static set_geometry(object3d_or_name, geometry="Box", is_new_object3d = false) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        //let geometry_class
        let geometry_inst = this.geometry_to_geometry_instance(geometry)
       /* if (typeof (geometry) === "string") {
            if (!(geometry.endsWith("Geometry"))) {
                geometry = geometry + "Geometry"
            }
            geometry_class = ((geometry === "LineGeometry") ? THREE_extra.LineGeometry : THREE[geometry])
        }
        else if (geometry instanceof THREE_extra.LineGeometry){
            geometry_inst = geometry
        }
        else if (Utils.is_class(geometry)) {
            geometry_class = geometry
        }
        else if (typeof(geometry) === "object"){
            geometry_inst = geometry
        }
        else {
            shouldnt("SimObj.set_geometry passed geometry: " + geometry + " that isn't valid.l")
        }*/
        //we've set either geometry_class or geometry_inst

        if (this.is_line(object3d)) {
            if (//(geometry_class === THREE_extra.LineGeometry) ||
                object3d.geometry === geometry_inst) { //this is already a line and passed a LineGeometry inst that's the same as the existing one, so THIS is as is
                SimBuild.populate_dialog_property(object3d, "geometry", "Line")
                return object3d
            }
            else if(geometry_inst instanceof THREE_extra.LineGeometry){
                //geometry_inst = geometry
                object3d.geometry = geometry_inst
                let a_pos = this.get_physics_object(object3d)
                if (a_pos) {
                    a_pos.updateCollider()
                }
                let short_name = SimObj.get_geometry_short_name(object3d)
                SimBuild.populate_dialog_property(object3d, "geometry", short_name)
                return object3d
            }
            else { //new geometry is not a line
                let new_object3d = this.make_non_line_from_line_object3d(object3d, geometry_inst)
                SimBuild.populate_dialog_property(new_object3d, "geometry", "Line")
                return new_object3d
            }
        }
        else { //this is NOT a line
            if (//(geometry_class === THREE_extra.LineGeometry) ||
                //(geometry_inst && (
                    geometry_inst instanceof THREE_extra.LineGeometry) {
                //ie we have to change to a new object3d that supports Line.
                let new_object3d = this.make_line_from_object3d(object3d)
                //let a_pos = this.get_physics_object(new_object3d)
                //if (a_pos) {
                //    a_pos.updateCollider()
                //}
                //let short_name = SimObj.get_geometry_short_name(new_object3d)
                //SimBuild.populate_dialog_property(new_object3d, "geometry", short_name) //short_name is going to be "Line"
                return new_object3d
            }
            /*if(!geometry_inst){
                if(!geometry_class){
                    shouldnt("SimObj.set_geometry passed invalid geometry: " + geometry)
                    let a_pos = this.get_physics_object(object3d)
                    if (a_pos) {
                        a_pos.updateCollider()
                    }
                    let short_name = SimObj.get_geometry_short_name(object3d)
                    SimBuild.populate_dialog_property(object3d, "geometry", short_name)
                    return object3d
                }
                else {
                   geometry_inst = new geometry_class()
                }
            }*/
           //do the usual of resetting the geometry of object3d.
            object3d.geometry = geometry_inst
            if (this.is_geometry_a_2d_shape(object3d.geometry)) {
                object3d.material.side = THREE.DoubleSide
                object3d.material.depthWrite = false
            }
            let a_pos = this.get_physics_object(object3d)
            if (a_pos) {
                a_pos.updateCollider()
            }
            let short_name = SimObj.get_geometry_short_name(object3d)
            SimBuild.populate_dialog_property(object3d, "geometry", short_name)
            return object3d
        }
    }

    static get_points(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.userData.points
    }
    static set_points(object3d_or_name, points) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        //object3d.points = points
        object3d.userData.points = points
        if(this.is_line(object3d)) {
            let points_in_three = []
            for (let point_in_dde of points) {
                let point_in_three = this.position_dde_to_three(point_in_dde)
                points_in_three.push(point_in_three)
            }
            let flat_positions = []
            for (let point of points_in_three) {
                flat_positions.push(point[0])
                flat_positions.push(point[1])
                flat_positions.push(point[2])
            }
            object3d.geometry.setPositions(flat_positions) // https://jsfiddle.net/10ydqb6e/
        }
        SimBuild.populate_dialog_property(object3d, "points", points)
    }

    static get_line_width(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return (object3d.userData.line_width ? object3d.userData.line_width : 10)
    }
    static set_line_width(object3d_or_name, line_width){
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.userData.line_width = line_width
        if(object3d.material instanceof THREE_extra.LineMaterial){
            let old_line_width = object3d.material.linewidth
            if(line_width !== old_line_width){
                object3d.material.linewidth = line_width
            }
        }
        //else just leave line_width in userData.
        SimBuild.populate_dialog_property(object3d, "line_width", line_width)
    }

    static get_material(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.material
    }

    static is_multi_color(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(object3d.material instanceof THREE.MeshNormalMaterial){
            return true
        }
        else { return false }
    }

    //similar to SimObj.get_geometry_short_name
    static get_material_short_name(object3d_or_name_or_material){
        let material
        if(typeof(object3d_or_name_or_material) === "string"){
            let object3d = SimObj.get_object3d(object3d_or_name_or_material)
            material = object3d.material
        }
        else if (SimObj.is_object3d(object3d_or_name_or_material)){
            material = object3d_or_name_or_material.material
        }
        else if (object3d_or_name_or_material instanceof THREE.Material){
            material = object3d_or_name_or_material
        }
        else {
            shouldnt("SimObj.material_short_name called with invalid arg: " + object3d_or_name_or_material)
        }
        let the_class  = Utils.get_class_of_instance(material) //different as material is a function, not a proper class
        let class_name = Utils.function_name(the_class)
        let name_parts = class_name.split(".")
        let last_class = Utils.last(name_parts)
        let geo_index = last_class.indexOf("Material")
        if(geo_index > 0){
            last_class = last_class.slice(0, geo_index)
        }
        return last_class
    }

    static set_material(object3d_or_name, material="MeshNormalMaterial"){ //This is the multi-color material. The "one colored material" is MeshStandardMaterial
        let object3d = SimObj.get_object3d(object3d_or_name)
        let material_inst = this.material_to_material_instance(material)
        if(object3d.material === material_inst) {
            return
        }
        if(this.is_line(object3d)) {
            return  //can't set the material of a line, its set when its created and can't be altered, and it MUST be LineMaterial
        }

        material_inst.wireframe = (object3d.material ? object3d.material.wireframe : false)
        if (this.is_geometry_a_2d_shape(object3d.geometry)){
            material_inst.side = THREE.DoubleSide
            material_inst.depthWrite = false
        }
        let three_color = object3d.userData.three_color
        if (material_inst.color && three_color){
            material_inst.color.set(three_color)
        }
        object3d.material = material_inst
        let multi_color_val = this.is_multi_color(object3d)  //material instanceof THREE.MeshNormalMaterial)
        SimBuild.populate_dialog_property(object3d, "multi_color", multi_color_val, "checked")
        //SimUtils.render()
    }

    static get_wire_frame(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(!object3d.material) { return false }
        else { return object3d.material.wireframe }
    }

    //wireframe is true or false
    static set_wire_frame(object3d_or_name, wire_frame=true){
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.material.wireframe = wire_frame
        //object3d.material.wireframeLinewidth = 1 //regardless of the value you set, this is 1. limitation of Chrome and WebGL.
        SimBuild.populate_dialog_property(object3d, "wire_frame", wire_frame, "checked")
        //SimUtils.render()
    }

    //returns an array of 3 floats, 0 to 1 for r, g, b. This is what I call "three_color"
    static get_color(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(!object3d.material) { return null }
        if(object3d.material.color) {
            return object3d.material.color.toArray()
        }
        else if(object3d.userData.three_color) { //should hit for MeshNormalMaterial
            let three_color = object3d.userData.three_color
            return SimObj.three_color_rgb_object_to_array_of_numbers(three_color)
        }
        else { return [1, 1, 1] } //can happen if the obj is a multi-colored one that has no userData calor
    }

    //returns arr of 3 numbers, 0 to 1
    static three_color_rgb_object_to_array_of_numbers(three_color){
        return [three_color.r, three_color.g, three_color.b]
    }


    static three_color_to_hex(three_color){
        let color_array_of_0_to_256 = [Math.round(three_color.r * 256),
            Math.round(three_color.g * 256),
            Math.round(three_color.b * 256)]
        let hex_color = Utils.rgb_integer_array_to_hex(color_array_of_0_to_256)
        return hex_color
    }

    static highlight_color = new THREE.Color(0.99, 1, 0.01) //This is barely different than the standard yellow, but
                                          //needs to be very likely unique.
                   //so that object3d.userData.three_color is never set to it

    //color arg can be null, the default, makes a multi-colored obj.
    // "random" (different each time)
    // an array of 3 floats, (0 to 1, for r, g, b)
    //or any THREE js color
    //If object3d doesn't have a material, this doesn't error, just doesn't attempt to set the color

    //color can be:
    // - HTML color names like
    // - "blue" (a string) //the 140 HTML standard colors,
    // - "0x0000ff"  (a string of hex)
    // - an instance of THREE.Color (basicaly a json like obj with r, g, b as floats from 0 to 1)
    // - [0, 0, 1] ie an array rgb with each a float, 0 to 1
    // - "rgb(255, 0, 0)" a string ie the CSS format for RGB
    //if its some bad data, makes a valid "white" color
    static set_color(object3d_or_name, color = null) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(color instanceof THREE.Color) { //threejs json object of r, g anf b as 0 to 1 floats
            object3d.material.color.set(color)
            return
        }
        if (color === "random") {
            color = [Math.random(), Math.random(), Math.random]
        }
        let three_color = (Array.isArray(color) ? new THREE.Color(color[0], color[1], color[2]) :
                                                         new THREE.Color(color)  //handles strings like blue or "#ffff00"
                                 )
        if (three_color) {
            if(object3d.material && object3d.material.color) { //does not hit on MeshNormalMaterial since that has no color
                object3d.material.color.set(three_color)
            } //see https://discourse.threejs.org/t/three-js-objects-failing-to-render-failed-to-execute-uniform3fv-on-webgl2renderingcontext-overload-resolution-failed/30736
            if(!three_color.equals(this.highlight_color)) { //so that we can restore the orig color after highlighting. See SimBuild.set_now_editing_object3d
                object3d.userData.three_color = three_color //since MeshNormalMaterial can't store a color,
                SimBuild.populate_dialog_property(object3d, "color", three_color)
            }
            //we're cashing color so that if we switch to Phong Material, we can grab the color
            //in userData and use it.
            //SimUtils.render()
        }
    }

    static get_visible(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.visible

    }

    static set_visible(object3d_or_name, bool=true){
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.visible = bool
        SimBuild.populate_dialog_property(object3d, "visible", bool)
        //SimUtils.render()
    }

    //PhysicsObject methods
    static get_physics_object(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        /* Should work, but is unreliable.
        for(let a_po of Simulate.physicsBodies){
            if(a_po.mesh === object3d) {
                return a_po
            }
        }
        return null*/
        let a_po = object3d.userData.physObj
        return a_po
    }
    static set_physics_object(object3d_or_name,
                              is_dynamic= false,
                              mass = 1 //in grams
                              ){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let a_po = new PhysicsObject(object3d)
        if(is_dynamic) {} //a_po is dynamic by default
        else {
            a_po.makeKinematic() //ie not dynamic, so that the Make Object dialog can control its position
            console.log("new Phys_obj is non-dynamic")
        }
        a_po.mass = mass / 1000
    }

    static get_is_dynamic(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let a_po = this.get_physics_object(object3d)
        if(!a_po || a_po.kinematic) { //if no phsyObj, then it can't be dynamic.
            return false
        }
        else {
            return true
        }
    }

    static set_is_dynamic(object3d_or_name, bool) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let a_po = this.get_physics_object(object3d)
        if(bool) {
            a_po.makeDynamic()
        }
        else {
            a_po.makeKinematic()
            console.log("phys_obj set to non-dynamic")
        }
    }

    static get_mass(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let a_po = this.get_physics_object(object3d)
        let mass_in_kg = a_po.mass
        let mass_in_grams = mass_in_kg * 1000
        return mass_in_grams
    }

    static set_mass(object3d_or_name, mass_in_grams) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let a_po = this.get_physics_object(object3d)
        let mass_in_kg = mass_in_grams / 1000
        a_po.setMass(mass_in_kg)
    }

    static show(object3d_or_name, kind=""){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if      (kind === "show_all") {
            for(let obj of this.user_objects){
                obj.visible = true
            }
        }
        else if (kind === "hide_all") {
            for(let obj of this.user_objects){
                obj.visible = false
            }
        }
        else if (kind === "show_this")    { object3d.visible = true }
        else if (kind === "hide_this")    { object3d.visible = false }
        else if (kind === "show_only_this"){
            for(let obj of this.user_objects){
                if(obj === object3d){ obj.visible = true }
                else {obj.visible = false  }
            }
        }
        else if (kind === "hide_only_this") {
            for(let obj of this.user_objects){
                if(obj === object3d){ obj.visible = false }
                else {obj.visible = true  }
            }
        }
        else if(kind === "show_colliders") {
            PhysicsObject.showColliders = true
        }
        else if(kind === "hide_colliders") {
            PhysicsObject.showColliders = false
        }
        else if (kind === "show_dexter")    { this.dexter.visible = true }
        else if (kind === "hide_dexter")    { this.dexter.visible = false }
        else { shouldnt("SimObj.show passed invalid kind: " + kind) }

        //SimUtils.render()
    }

    //returns null if failed, otherwise a new array of the same length
    //of object3ds. It will be in a different order, if
    //a parent is not in the list first.
    //object3ds array is NOT modified.
    static sort_parents_first(object3ds=SimObj.user_objects){
        let result = []
        while(result.length < object3ds.length){
            let made_progress = false
            for(let obj of object3ds){
                if(result.includes(obj)) {} //we already got it
                else if(this.is_dde_object3d(obj.parent) ||
                  result.includes(obj.parent)){
                    result.push(obj)
                    made_progress = true
                }
            }
            if(!made_progress) {
                dde_error("In SimObj.sort_parents_first")
            }
        }
        return result
    }

    static all_user_objects_source_code(){
        let objs_src = ""
        let objs_for_source = this.sort_parents_first()
        for(let obj of objs_for_source){
            let obj_src = to_source_code({value: obj})
            objs_src += "  " + (obj_src + "\n\n")
        }
        let src = "function restore_simulator_object3ds() {\n" +
                   objs_src +
                   "}\n"
        return src
    }
}

THREE.Mesh.prototype.to_source_code =
    function({value, indent="", depth=0}){
        //value is the object3d.
        //if it is highlighted, we want to get its orig color, NOT the highlight color
        let object3d = value
        //let three_color = (object3d.userData.three_color ? object3d.userData.three_color :
                                                //SimObj.get_color(object3d))
        let arr = SimObj.get_color(value) //SimObj.three_color_rgb_object_to_array_of_numbers(three_color)
        let color_str = "[" + arr[0] + ", " + arr[1] + ", " + arr[2] + "]"
        let line_attrs = ""
        if(SimObj.is_line(value)) {
            line_attrs = ",\n    line_width: " + value.userData.line_width +
                         ",\n    points: "     + to_source_code({value: value.userData.points})
        }
        return "SimObj.make_object3d({" +
            'name: "'       + SimObj.get_name(object3d)                                 + '", ' +
            'parent: "'     + SimObj.get_name(object3d.parent)                          + '", ' +
            'geometry: "'   + SimObj.get_geometry_short_name(object3d)                  + '",\n    ' +
            'scale: '       + to_source_code({value: SimObj.get_scale(object3d)})       + ', '  +
            'position: '    + to_source_code({value: SimObj.get_position(object3d)})    + ', '  +
            'orientation: ' + to_source_code({value: SimObj.get_orientation(object3d)}) + ',\n    ' +
            'material: "'   + SimObj.get_material_short_name(object3d)                  + '", ' +
            'color: '       + color_str                                                 + ',\n    ' +
            'wireframe: '   + SimObj.get_wire_frame(object3d)                           + ', '  +//boolean if true, object responds to gravity
            'is_dynamic: '  + SimObj.get_is_dynamic(object3d)                           + ', '  +//boolean
            'mass: '        + SimObj.get_mass(object3d)    +  //in grams
            line_attrs +
            "\n})"
    }
// to_source_code({value: SimObj.my_object3d})