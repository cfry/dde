globalThis.SimObj = class SimObj{
    static dde_objects  = [] //scene, table, dexter
    static user_objects = []
    static array_to_Vector3(arr) { return new THREE.Vector3(arr[0], arr[1], arr[2])}
    static Vector3_to_array(vec3) { return [vec3.x, vec3.y, vec3.z] }

    static rad_to_deg(rad) {return rad * _rad}
    static deg_to_rad(deg) {return deg / _rad}

    static ensure_simulate(){
        let sim_val = DDE_DB.persistent_get("default_dexter_simulate")
        if((sim_val !== true) || (sim_val !== "both")) {
            DDE_DB.persistent_set("default_dexter_simulate", true)
        }
        if(!simulate_radio_true_id.checked) {
            simulate_radio_true_id.checked = true
        }
        if(DDEVideo.misc_pane_menu_selection !== "Simulate Dexter"){
            DDEVideo.show_in_misc_pane("Simulate Dexter")
        }
    }

    static dde_object_names = ["scene", "table", "dexter", "user_origin"]

    static init_dde_objects() {
       //SimObj.remove_all()
       this.scene   = Simulate.sim.scene
       this.table   = Simulate.sim.table
       this.dexter  = Simulate.sim.J0

        /*let dpos = this.get_position(this.dexter).slice() //copy
       dpos[2] = 0.01
       this.make_object3d({name: "user_origin",
                           parent: this.table,
                           geometry:    "Ring",
                           scale:       [0.2, 0.2, 0.2],
                           color:       [1, 0, 0],
                           wireframe:   false,
                           material:    "MeshPhongMaterial",
                           position:    dpos,
                           orientation: [0, 90, 180]//this.get_orientation(this.dexter)
                         })

         */
       //this.user_origin.setAttribute("radius", 0.5)
       //this.table.add(this.user_origin)
       this.make_user_origin_object3d()
       this.dde_objects = [this.scene, this.table, this.dexter, this.user_origin] //beware, user_origin starts out at same pos as J0, but can change.

    }

    static make_user_origin_object3d(){
        //see Simulate.js
        let object3d        = new THREE.Object3D(); //0,0,0 //does not move w.r.t table.
        object3d.name       = "user_origin" //this.sim.J0.name = "J0"
        object3d.rotation.y = Simulate.sim.J0.rotation.y //= Math.PI //radians for 180 degrees
        object3d.position.y = Simulate.sim.J0.position.y // = (this.sim.table_height / 2) //+ (leg_height / 2) //0.06 //for orig boxes model, leg)height was positive, but for legless dexter mounted on table, its probably 0
        object3d.position.x = Simulate.sim.J0.position.x // = (this.sim.table_length / 2)  //the edge of the table
        //- 0.12425 the distance from the edge of the table that Dexter is placed
        Simulate.sim.table.add(object3d)

        //see make_object3d_given_object
        SimObj.user_origin = object3d
        SimBuild.add_object3d_to_the_name_menu(object3d)
    }

    static has_objects(){
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
            return !this.is_dde_object3d(object3d)
        }
    }


    static dde_and_user_objects(){
        return this.dde_objects.concat(this.user_objects)
    }
    static dde_and_user_objects_names(){
        let result = []
        for(let object3d of this.dde_and_user_objects()){
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
        return [array_of_3[1], array_of_3[2], array_of_3[0] ]
    }
    static position_three_to_dde(array_of_3){
        let dde_x = array_of_3[2]
        //dde_x = ((dde_x === 0) ? 0 : dde_x * -1) //ensure that we don't get any JS -0's
        let dde_y = array_of_3[0]
        //dde_y = ((dde_y === 0) ? 0 : dde_y * -1)
        let dde_z = array_of_3[1]
        //dde_z = ((dde_z === 0) ? 0 : dde_z * -1)

        return [dde_x, dde_y, dde_z]
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


    //will return null if passed null or undefined or false or nothing
    /*static get_object3d(object3d_or_name=null){
        if(typeof(object3d_or_name) === "string") {
            return Simulate.sim.table.getObjectByName(object3d_or_name)
        }
        else if(typeof(object3d_or_name) === "number"){
            return Simulate.sim.table.getObjectById(object3d_or_name)
        }
        else if (this.is_object3d(object3d_or_name)) {
            return object3d_or_name
        }
        else if (!object3d_or_name) {
            return null
        }
        else { dde_error("SimObj.get_object3d called with: " + object3d_or_name
            + " which does not represent an object.")
        }
    }*/

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

    //in world coords. boujding box is aligned to the world grid
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

    //xyz is dde xyz, in world coords.
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

    /*
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
    }*/

    //returns the first object in this.objects that intersects with
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



    static newest_object_intersecting_xyz(xyz){
        if(!this.user_objects) { return null }
        for(let i = (this.user_objects.length - 1); i >= 0; i--){
            let obj = this.user_objects[i]
            if((obj !== main_obj) && this.does_object_intersect_xyz(obj, xyz)){
                return obj
            }
        }
        return null
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

    static make_cylinder({name= "my_cylinder",
                             scale = [1, 1, 1],
                             top_diameter = 1,
                             bottom_diameter = 1,
                             height        = 1,
                             sides         = 12,
                             position      = [0, 0, 0], //dde coords
                             orientation   = [0, 0, 0], //dde coords
                             color         = [1, 1, 1], //0x00ff00
                         } = {}) {
        let geometry = new THREE.CylinderGeometry(top_diameter / 2, bottom_diameter / 2, height, sides)
        return this.make_object3d({name: name, geometry: geometry, scale: scale, position: position, orientation: orientation, color: color})
    }

    //pass in an instance of a Threejs Geometry.
    //see https://threejs.org/docs/#api/en/geometries for 20 or so geometries.

    static make_object3d({name="my_object3d",
                          parent_or_name = "user_origin",
                          geometry="Box",
                          scale= [0.2, 0.2, 0.2],
                          position=[0, 0.3, 0.1],
                          orientation=[0, 0, 0],
                          material = "MeshNormal", //for one-color objects. use "MeshNormal" for a multi_color material that ignores the "color" passed in here
                          color=[1, 1, 1],
                          wireframe = false} = {}){ //[1, 1, 1] is white, corresponding to #ffffff
        this.remove(name) //for SimObj, a "name" is unique within the children
                          //of a parent. the "default parent" is scene.table
        //let mat = (color ? new THREE.MeshPhongMaterial() : //{color: color}) : //  MeshBasicMaterial
        //                   new THREE.MeshNormalMaterial({}))
        //mat.side = THREE.DoubleSide //From https://threejs.org/docs/index.html#manual/en/introduction/FAQ
        /* if(typeof(geometry) === "string"){
            if(!(geometry.endsWith("Geometry"))){
                geometry = geometry + "Geometry"
            }
            geometry = new THREE[geometry]()
        }*/
        let object3d = new THREE.Mesh()
        object3d.name = name
        this[name] = object3d
        this.set_geometry(object3d, geometry)
        this.set_material(object3d, material)
        this.set_color(object3d, color) //creates and sets the material property of the Mesh
        this.set_wireframe(object3d, wireframe)
        this.set_scale(object3d, scale)
        this.set_position(object3d, position) //keep as dde_coordinates
        this.set_orientation(object3d, orientation) //keep as dde_coordinates

        return this.make_object3d_given_object(object3d, parent_or_name)
    }

    //called by both make_object3d and  make_copy_of_object3d
    static make_object3d_given_object(object3d, parent_or_name="user_origin"){
        //Simulate.sim.J0.add(object3d) //sim.table.add(obj)
        //if(parent === SimObj.user_origin) { parent = SimObj.dexter } //todo get rid of this line!
        //parent.add(object3d)
        SimObj.set_parent(object3d, parent_or_name)
        let adding_first_object = !SimObj.has_objects()
        let new_name = SimObj.get_name(object3d)
        if(!SimObj.dde_object_names.includes(new_name)) {
            SimObj.user_objects.push(object3d)
        }
        if(adding_first_object){
            SimBuild.populate_dialog_from_object(object3d) //might as well maie it the edited object and enable dialog widgets
        }

        SimBuild.add_object3d_to_the_name_menu(object3d)
        SimBuild.add_object3d_to_the_parent_menu(object3d)

        SimUtils.render()
        return object3d
    }

    //called by Simulate.init_simulation
    static refresh(){
        if(this.user_objects.length > 0) {
            for (let object3d of this.user_objects) {
                if (!this.user_origin.children.includes(object3d)) {
                    this.user_origin.add(object3d)  //because object3d's effectively removed when Simulate.init_simulation() is called
                }
            }
            SimUtils.render()
        }
    }

    //tries for a unique_name with the prefix up to 1k suffixes, and if can't
    //find one, returns null
    static unique_name_for_object3d_or_null(existing_object3d_name = "my_object3d"){
        let existing_parts = existing_object3d_name.split("_")
        let last_existing_part = Utils.last(existing_parts)
        let num = parseInt(last_existing_part)
        let prefix
        if(Number.isNaN(num)) {
            prefix = existing_object3d_name
            num = 1
        }
        else {
            let all_but_last_existing_parts = existing_parts.slice(0, -1) //cut off the last elt
            prefix = all_but_last_existing_parts.join("_")
        }
        for(let i = num; i < 1000; i++){
            let new_name = prefix + "_" + i
            if(!SimObj[new_name]){
                return new_name
            }
        }
        return null
    }

    static make_copy_of_object3d(object3d_or_name, name = null){
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
        let a_copy = object3d.clone(false) //false means we will NOT copy the descendents (children) just object3d itself
        a_copy.name = name
        a_copy.material = object3d.material.clone() //needed or the same material will be used as object3d meaning we can't set their colors differently
        this[name] = a_copy

        //also called by make_object3d
        return this.make_object3d_given_object(copy, object3d.parent)
    }

    static remove(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(object3d) {
            if (object3d) {
                //object3d.parent.remove(object3d)
                object3d.removeFromParent() //  THREEjs method to remove the object
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
                    if(this.has_objects()){
                        let obj_to_edit = Utils.last(this.user_objects)
                        SimBuild.populate_dialog_from_object(obj_to_edit)
                    }
                    else { //we removed the last object, so disable dialog inputs if dialog is up
                        SimBuild.populate_dialog_from_object(null) //disables inputs
                    }
                }
                SimUtils.render()
            }
        }
        //else apparently object3d_or_name is already gone, so do nothing.
    }

    static remove_all(){
        for(let object3d of this.user_objects.slice()) { //make a copy of objects array so we aren't removing from same array we're looping over.
            this.remove(object3d)
        }
    }

    static get_name(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(object3d === SimObj.dexter) { return "dexter"}
        else { return object3d.name }
    }

    static get_parent(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.parent
    }

    static set_parent(object3d_or_name, parent_or_name=user_origin) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        parent = SimObj.get_object3d(parent_or_name)
        if(parent === SimObj.user_origin){
            parent.add(object3d)
        }
        else {
            parent.attach(object3d)
        }
        SimBuild.populate_dialog_from_object_if_now_editing(object3d)
        SimUtils.render()
    }


    //returns array of [x, y, z] meters, in dde coords
    static get_position(object3d_or_name) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let array_of_3 = [object3d.position.x, object3d.position.y, object3d.position.z]
        return SimObj.position_three_to_dde(array_of_3)
    }

    //array_of_3 in dde_coords
    static set_position(object3d_or_name, array_of_3 = [0, 0, 0]){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_pos = this.position_dde_to_three(array_of_3)
        object3d.position.x = three_pos[0]
        object3d.position.y = three_pos[1]
        object3d.position.z = three_pos[2]
        SimBuild.populate_dialog_property(object3d, "position_x", array_of_3[0])
        SimBuild.populate_dialog_property(object3d, "position_y", array_of_3[1])
        SimBuild.populate_dialog_property(object3d, "position_z", array_of_3[2])

        SimUtils.render()
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

    static set_orientation(object3d_or_name, orientation = [0, 0, 0]){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let rads_in_dde = [orientation[0] / _rad,
                           orientation[1] / _rad,
                           orientation[2] / _rad]
        let rads_in_three = this.position_dde_to_three(rads_in_dde)
        //obj.rotateX(rads_in_three[0]) //todo find setrotations
        //obj.rotateY(rads_in_three[1])
        //obj.rotateZ(rads_in_three[2])
        //obj.rotation.set([rads_in_three[0], rads_in_three[1], rads_in_three[2]])
        object3d.rotation.x = rads_in_three[0]
        object3d.rotation.y = rads_in_three[1]
        object3d.rotation.z = rads_in_three[2]
        SimBuild.populate_dialog_property(object3d, "orientation_x", orientation[0])
        SimBuild.populate_dialog_property(object3d, "orientation_y", orientation[1])
        SimBuild.populate_dialog_property(object3d, "orientation_z", orientation[2])
        SimUtils.render()
    }

    static get_scale(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_scale = [object3d.scale.x, object3d.scale.y, object3d.scale.z]
        return this.scale_three_to_dde(three_scale)
    }

    //scale in dde_coords
    static set_scale(object3d_or_name, scale = [1, 1, 1]){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_scale = this.scale_dde_to_three(scale)
        object3d.scale.x = three_scale[0]
        object3d.scale.y = three_scale[1]
        object3d.scale.z = three_scale[2]
        SimBuild.populate_dialog_property(object3d, "scale_x", scale[0])
        SimBuild.populate_dialog_property(object3d, "scale_y", scale[1])
        SimBuild.populate_dialog_property(object3d, "scale_z", scale[2])

        SimUtils.render()
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

    static set_geometry(object3d_or_name="MeshNormal", geometry){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(typeof(geometry) === "string"){
            if(!(geometry.endsWith("Geometry"))){
                geometry = geometry + "Geometry"
            }
            geometry = new THREE[geometry]()
        }
        object3d.geometry = geometry
        let val = SimObj.get_geometry_short_name(object3d)
        SimBuild.populate_dialog_property(object3d, "geometry", val)
        SimUtils.render()
    }

    static get_material(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.material
    }

    //similar to SimObj.get_geometry_short_name
    static get_material_short_name(object3d_or_name_or_material){
        let material
        if(typeof(object3d_or_name_or_material) === "string"){
            let object3d = SimObj.get_object3d(object3d_or_name)
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

    static set_material(object3d_or_name, material){
        let object3d = SimObj.get_object3d(object3d_or_name)
        let making_new_material = false
        if(typeof(material) === "string"){
            if(!(material.endsWith("Material"))){
                material = material + "Material"
            }
            material = new THREE[material]()
            // causes bugSimObj.set_wireframe(object3d_or_name, object3d.material.wireframe) //use wireframe boolean from the old material in object3d
            material.wireframe = (object3d.material ? object3d.material.wireframe : false)
            if (this.is_geometry_a_2d_shape(object3d.geometry)){
                material.side = THREE.DoubleSide
                material.depthWrite = false
            }
            making_new_material = true
        }
        let three_color = object3d.userData.three_color
        if (making_new_material && material.color && three_color){
            material.color.set(three_color)
        }
        object3d.material = material
        let multi_color_val = (material instanceof THREE.MeshNormalMaterial)
        SimBuild.populate_dialog_property(object3d, "multi_color", multi_color_val, "checked")
        SimUtils.render()
    }

    //returns an array of 3 floats, 0 to 1 for r, g, b.
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
        else { return null } //shouldn't happen
    }

    static get_visible(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        return object3d.visible

    }

    static set_visible(object3d_or_name, bool=true){
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.visible = bool
        SimBuild.populate_dialog_property(object3d, "visible", bool)
        SimUtils.render()
    }

    static show(object3d_or_name, kind=""){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if     (kind === "show_this")    { object3d.visible = true }
        else if(kind === "hide_this")    { object3d.visible = false }
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
        else if (kind === "show_all") {
            for(let obj of this.user_objects){
                obj.visible = true
            }
        }
        else if (kind === "hide_all") {
            for(let obj of this.user_objects){
                obj.visible = false
            }
        }
        else { shouldnt("SimObj.show passed invalid kind: " + kind) }

        SimUtils.render()
    }

    //returns arr of 3 numbers, 0 to 1
    static three_color_rgb_object_to_array_of_numbers(three_color){
        return [three_color.r, three_color.g, three_color.b]
    }

    //color arg can be null (the default, makes a multi-colored obj.
    // "random" (different each time)
    // an array of 3 floats, (0 to 1, for r, g, b)
    //or any Threejs color
    //If object3d doesn't have a material, this doesn't error, just doesn't attempt to set the color
    static set_color(object3d_or_name, color = null) {
        let object3d = SimObj.get_object3d(object3d_or_name)
        let three_color
        if (color === "random") {
            three_color = new THREE.Color(Math.random(), Math.random(), Math.random())
        }
        else if (Array.isArray(color)) {
            three_color = new THREE.Color(color[0], color[1], color[2])
        }
        if (three_color) {
            if(object3d.material && object3d.material.color) { //does not hit on MeshNormalMaterial since that has no color
                object3d.material.color.set(three_color)
            } //see https://discourse.threejs.org/t/three-js-objects-failing-to-render-failed-to-execute-uniform3fv-on-webgl2renderingcontext-overload-resolution-failed/30736
            object3d.userData.three_color = three_color //since MeshNormalMaterial can't store a color,
            //we're cashing color so that if we switch to Phong Material, we can grab the color
            //in userData and use it.
            let color_array_of_0_to_256 = [Math.round(color[0] * 256),
                                           Math.round(color[1] * 256),
                                           Math.round(color[2] * 256)]
            let hex_color = Utils.rgb_integer_array_to_hex(color_array_of_0_to_256)
            SimBuild.populate_dialog_property(object3d, "color", hex_color)
            SimUtils.render()
        }
    }
    static get_wireframe(object3d_or_name){
        let object3d = SimObj.get_object3d(object3d_or_name)
        if(!object3d.material) { return false }
        else { return object3d.material.wireframe }
    }

    //wireframe is true or false
    static set_wireframe(object3d_or_name, wireframe){
        let object3d = SimObj.get_object3d(object3d_or_name)
        object3d.material.wireframe = wireframe
        SimBuild.populate_dialog_property(object3d, "wireframe", wireframe, "checked")
        SimUtils.render()
    }

    static all_objects_source_code(){
        let objs_src = ""
        for(let obj of this.objects){
            let obj_src = to_source_code({value: obj})
            objs_src += "  " + (obj_src + "\n\n")
        }
        let src = "function restore_simulator_object3ds(){\n" +
                   objs_src +
                   "}\n"
        return src
    }
}

THREE.Mesh.prototype.to_source_code =
    function({value, indent="", depth=0}){
        return "SimObj.make_object3d({" +
            'name: "'       + SimObj.get_name(value) + '", ' +
            'parent: "'     + SimObj.get_name(value.parent) + '", ' +
            'geometry: "'   + SimObj.get_geometry_short_name(value)                     + '",\n    ' +
            'scale: '       + to_source_code({value: SimObj.get_scale(value)})       + ', '  +
            'position: '    + to_source_code({value: SimObj.get_position(value)})    + ', '  +
            'orientation: ' + to_source_code({value: SimObj.get_orientation(value)}) + ',\n    '  +
            'material: "'   + SimObj.get_material_short_name(value)                  + '", ' +
            'color: '       + to_source_code({value: SimObj.get_color(value)})       + ', '  +
            'wireframe: '   + SimObj.get_wireframe(value)                            + //boolean
            "})"
    }
// to_source_code({value: SimObj.my_object3d})