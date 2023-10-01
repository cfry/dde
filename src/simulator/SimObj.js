globalThis.SimObj = class SimObj{
    static objects = [] //all objects
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

    static is_object3d(object3d_maybe){
        return object3d_maybe instanceof THREE.Object3D // used to use THREE.Mesh here, but that fails for end effector in the dexter gltf model
    }
    static get_object3d(object3d_or_name){
        if(typeof(object3d_or_name) === "string") {
            return Simulate.sim.table.getObjectByName(object3d_or_name)
        }
        else if(typeof(object3d_or_name) === "number"){
            return Simulate.sim.table.getObjectById(object3d_or_name)
        }
        else if (this.is_object3d(object3d_or_name)) {
            return object3d_or_name
        }
        else { dde_error("SimObj.get_object3d called with: " + object3d_or_name
            + " which does not represent an object.")
        }
    }

    static get_bounding_box(object3d_or_name) {
        //from https://discourse.threejs.org/t/bounding-box-is-calculated-wrong/1763/5
        let bbox = new THREE.Box3() //.setFromObject(obj)
        let obj = SimObj.get_object3d(object3d_or_name)
        obj.geometry.computeBoundingBox()
        bbox.copy(obj.geometry.boundingBox )
        obj.updateMatrixWorld( true ); // ensure world matrix is up to date
        bbox.applyMatrix4( obj.matrixWorld )
        return bbox
        //from https://threejs.org/docs/index.html#api/en/math/Box3
        //obj.geometry.computeBoundingBox()

        //bbox.copy(obj.geometry.boundingBox ).applyMatrix4( obj.matrixWorld );
        //return bbox
    }

    //xyz is in DDE coordinates
    //this fn is broken due to I can't figure out the proper
    //position transformations.
    static object_contains_xyz(object3d_or_name, xyz){
        let obj = this.get_object3d(object3d_or_name)
        let xyz_three_arr = this.position_dde_to_three(xyz)
        let xyz_three_vec3 = this.array_to_Vector3(xyz_three_arr)
        let xyz_three_vec3_table = Simulate.sim.table.localToWorld(xyz_three_vec3)
        let xyz_three_vec3_world = obj.localToWorld(xyz_three_vec3)

        let bbox = this.get_bounding_box(obj)
        let bbox_min_vec3 = bbox.min
        let bbox_max_vec3 = bbox.max
        let bbox_min_vec3_world = obj.localToWorld(bbox_min_vec3)
        let bbox_max_vec3_world = obj.localToWorld(bbox_max_vec3)

        let result = bbox.containsPoint(bbox_max_vec3_world)
        return result
    }

    //xyz is in dde coordinates
    //returns the first object found that contains xyz or null if none.
    //this fn is broken due to I can't figure out the proper
    //position transformations.
    static object_containing_xyz(xyz){
        if(!this.objects) { return null }
        for(let obj of this.objects){
            if(this.object_contains_xyz(obj, xyz)){
                return obj
            }
        }
        return null
    }

    //returns the first object in this.objects that intersects with
    //the passed in object, or null if none
    static object_intersecting_object(object3d_or_name){
        if(!this.objects) { return null }
        let main_obj = this.get_object3d(object3d_or_name)
        for(let obj of this.objects){
            if(this.does_object_intersect_object(main_obj, obj)){
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
        let box1    = new THREE.Box3().setFromObject(object1)
        let box2    = new THREE.Box3().setFromObject(object2)
        return box1.intersectsBox(box2)
    }

    /*static make_box({name = "my_box",
                    scale = [1, 1, 1], //dde coordinates
                    position = [0, 0, 0], //dde coordinates
                    orientation = [0, 0, 0], //dde coordinates
                    color = null //0x00ff00
                        } = {}){
        this.remove(name) //for SimObj, a "name" is unique within the children
                          //of a parent. the "default parent" is scene.table
        let three_scale = this.scale_dde_to_three(scale)
        let geom = new THREE.BoxGeometry(three_scale[0], three_scale[1], three_scale[2])
        let mat = (color ? new THREE.MeshPhongMaterial({color: color}) : //  MeshBasicMaterial
                           new THREE.MeshNormalMaterial({}))
        //mat.side = THREE.DoubleSide //From https://threejs.org/docs/index.html#manual/en/introduction/FAQ
        let obj = new THREE.Mesh(geom, mat)
        obj.name = name
        this[name] = obj
        this.set_position(obj, position) //keep as dde_coordinates
        this.set_orientation(obj, orientation) //keep as dde_coordinates
        this.set_color(obj, color)
        Simulate.sim.J0.add(obj) //sim.table.add(obj)
        SimUtils.render_once_with_prev_args_maybe()
        SimObj.objects.push(obj)
        return obj
    }*/

    static make_box({name = "my_box",
                               scale = [1, 1, 1], //dde coordinates
                               position = [0, 0, 0], //dde coordinates
                               orientation = [0, 0, 0], //dde coordinates
                               color = null //0x00ff00
                           } = {}){
        let geometry = "Box"
        return this.make_object3d({name: name, geometry: geometry, scale: scale, position: position, orientation: orientation, color: color})
    }

    /*static make_cylinder({name          = "my_cylinder",
                      top_diameter = 1,
                      bottom_diameter = 1,
                      height        = 1,
                      sides         = 12,
                      position      = [0, 0, 0], //dde coords
                      orientation   = [0, 0, 0], //dde coords
                      color         = null, //0x00ff00
                     } = {}){
        this.remove(name)
        let geom = new THREE.CylinderGeometry(top_diameter / 2, bottom_diameter / 2, height, sides)
        let mat = (color ? new THREE.MeshBasicMaterial({color: color}) :
                           new THREE.MeshNormalMaterial({}))
        let obj = new THREE.Mesh(geom, mat)
        obj.name = name
        this.set_position(obj, position)
        this.set_orientation(obj, orientation)
        this.set_color(obj, color)
        Simulate.sim.J0.add(obj)
        SimUtils.render_once_with_prev_args_maybe()
        SimObj.objects.push(obj)
        return obj
    }*/

    static make_cylinder({name= "my_cylinder",
                             scale = [1, 1, 1],
                             top_diameter = 1,
                             bottom_diameter = 1,
                             height        = 1,
                             sides         = 12,
                             position      = [0, 0, 0], //dde coords
                             orientation   = [0, 0, 0], //dde coords
                             color         = null, //0x00ff00
                         } = {}) {
        let geometry = new THREE.CylinderGeometry(top_diameter / 2, bottom_diameter / 2, height, sides)
        return this.make_object3d({name: name, geometry: geometry, scale: scale, position: position, orientation: orientation, color: color})
    }

    //pass in an instance of a Threejs Geometry.
    //see https://threejs.org/docs/#api/en/geometries for 20 or so geometries.

    static make_object3d({name="my_object3d",
                          geometry="Box",
                          scale= [0.2, 0.2, 0.2],
                          position=[0, 0.3, 0],
                          orientation=[0, 0, 0],
                          color=null}){
        this.remove(name) //for SimObj, a "name" is unique within the children
                          //of a parent. the "default parent" is scene.table
        //let mat = (color ? new THREE.MeshPhongMaterial() : //{color: color}) : //  MeshBasicMaterial
        //                   new THREE.MeshNormalMaterial({}))
        //mat.side = THREE.DoubleSide //From https://threejs.org/docs/index.html#manual/en/introduction/FAQ
        if(typeof(geometry) === "string"){
            let class_name = geometry + "Geometry"
            geometry = new THREE[class_name]()
        }
        let object3d = new THREE.Mesh(geometry) //, mat)
        object3d.name = name
        this[name] = object3d
        this.set_color(object3d, color) //creates and sets the material property of the Mesh
        this.set_scale(object3d, scale)
        this.set_position(object3d, position) //keep as dde_coordinates
        this.set_orientation(object3d, orientation) //keep as dde_coordinates

        Simulate.sim.J0.add(object3d) //sim.table.add(obj)
        SimUtils.render_once_with_prev_args_maybe()
        SimObj.objects.push(object3d)
        SimBuild.add_object3d_to_the_name(object3d)
        return object3d
    }

    static remove(object3d_or_name) {
        let obj = SimObj.get_object3d(object3d_or_name)
        if(obj) {
            let the_name = obj.name
            //sim.table.remove(obj)
            if (obj) {
                obj.parent.remove(obj)
                let index = object.indexOf(obj)
                this.object.splice(index, 1) //remove it from array, modifying the array, and now the array is  1 shorter.
                if(SimBuild.gripper_now_holding_object === obj) {
                    SimBuild.gripper_now_holding_object = null
                }
                if (this[the_name]) {
                    delete this[the_name]
                }
                SimUtils.render_once_with_prev_args_maybe()
            }
        }
    }

    static remove_all(remove_template_too = true){
        let template = null
        for(let obj of this.objects.slice()) { //make a copy of objects array so we aren't removing from same array we're looping over.
            let name = obj.name
            this.remove(obj)
        }
    }

    //returns array of [x, y, z] meters, in dde coords
    static get_position(object3d_or_name) {
        let obj = SimObj.get_object3d(object3d_or_name)
        let array_of_3 = [obj.position.x, obj.position.y, obj.position.z]
        return SimObj.position_three_to_dde(array_of_3)
    }

    //array_of_3 in dde_coords
    static set_position(object3d_or_name, array_of_3 = [0, 0, 0]){
        let obj = SimObj.get_object3d(object3d_or_name)
        let three_pos = this.position_dde_to_three(array_of_3)
        obj.position.x = three_pos[0]
        obj.position.y = three_pos[1]
        obj.position.z = three_pos[2]
        SimUtils.render_once_with_prev_args_maybe()
    }

    //returns array of [x_deg, y_deg, z_deg] in DDE coords
    static get_orientation(object3d_or_name){
        let obj = SimObj.get_object3d(object3d_or_name)
        let euler_rotation = obj.rotation
        let three_orientation = [this.rad_to_deg(euler_rotation._x),
            this.rad_to_deg(euler_rotation._y),
            this.rad_to_deg(euler_rotation._z)
        ]
        return this.position_three_to_dde(three_orientation)
    }

    static set_orientation(object3d_or_name, orientation = [0, 0, 0]){
        let obj = SimObj.get_object3d(object3d_or_name)
        let rads_in_dde = [orientation[0] / _rad,
                           orientation[1] / _rad,
                           orientation[2] / _rad]
        let rads_in_three = this.position_dde_to_three(rads_in_dde)
        //obj.rotateX(rads_in_three[0]) //todo find setrotations
        //obj.rotateY(rads_in_three[1])
        //obj.rotateZ(rads_in_three[2])
        //obj.rotation.set([rads_in_three[0], rads_in_three[1], rads_in_three[2]])
        obj.rotation.x = rads_in_three[0]
        obj.rotation.y = rads_in_three[1]
        obj.rotation.z = rads_in_three[2]
        SimUtils.render_once_with_prev_args_maybe()
    }

    static get_scale(object3d_or_name){
        let obj = SimObj.get_object3d(object3d_or_name)
        let three_scale = [obj.scale.x, obj.scale.y, obj.scale.z]
        return this.scale_three_to_dde(three_scale)
    }

    //scale in dde_coords
    static set_scale(object3d_or_name, scale = [1, 1, 1]){
        let obj = SimObj.get_object3d(object3d_or_name)
        let three_scale = this.scale_dde_to_three(scale)
        obj.scale.x = three_scale[0]
        obj.scale.y = three_scale[1]
        obj.scale.z = three_scale[2]
        SimUtils.render_once_with_prev_args_maybe()
    }

    //returns an array of 3 floats, 0 to 1 for r, g, b.
    static get_color(object3d_or_name){
        let obj = SimObj.get_object3d(object3d_or_name)
        if(obj.material.color) {
            return obj.material.color.toArray()
        }
        else { return null } //the multi-color
    }

    //color arg can be null (the default, makes a multi-colored obj.
    // "random" (different each time)
    // an array of 3 floats, (0 to 1, for r, g, b)
    //or any Threejs color
    static set_color(object3d_or_name, color = null){
        let obj = SimObj.get_object3d(object3d_or_name)
        if(color === "random") {
            color = new THREE.Color(Math.random(), Math.random(), Math.random())
        }
        else if (Array.isArray(color)){
            color = new THREE.Color(color[0], color[1], color[2])
        }
        //else  color is null,
        if(color) { //obj.material.setValues({color: color})
            obj.material = new THREE.MeshPhongMaterial({color: color})
        }
        else      {
            obj.material = new THREE.MeshNormalMaterial({})
        } //the multi-no color
        SimUtils.render_once_with_prev_args_maybe()
    }
}