export var SimX = class SimX{
    static objects = []
    static array_to_Vector3(arr) { return new THREE.Vector3(arr[0], arr[1], arr[2])}
    static Vector3_to_array(vec3) { return [vec3.x, vec3.y, vec3.z] }

    static rad_to_deg(rad) {return rad * _rad}
    static deg_to_rad(deg) {return deg / _rad}

    static ensure_simulate(){
        let sim_val = persistent_get("default_dexter_simulate")
        if((sim_val !== true) || (sim_val !== "both")) {
            persistent_set("default_dexter_simulate", true)
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
        let three_x = array_of_3[1]
        three_x = ((three_x === -0) ? 0 : three_x * -1) //ensure that we don't pass in a js -0 to three
        let three_y = array_of_3[2]
        let three_z = array_of_3[0]
        three_z = ((three_z === -0) ? 0 : three_z * -1) //ensure that we don't pass in a js -0 to three

        return [three_x, three_y, three_z]
    }
    static position_three_to_dde(array_of_3){
        let dde_x = array_of_3[2]
        dde_x = ((dde_x === 0) ? 0 : dde_x * -1) //ensure that we don't get any JS -0's
        let dde_y = array_of_3[2]
        dde_y = ((dde_y === 0) ? 0 : dde_y * -1)
        let dde_z = array_of_3[1]
        return [dde_x, dde_y, dde_z]
    }

    static size_dde_to_three(array_of_3){
        let result = this.position_dde_to_three(array_of_3)
        result[0] = ((result[0] < 0) ? result[0] * -1 : result[0])
        result[1] = ((result[1] < 0) ? result[1] * -1 : result[1])
        result[2] = ((result[2] < 0) ? result[2] * -1 : result[2])
        return result
    }

    static size_three_to_dde(array_of_3){
        let result = this.position_three_to_dde(array_of_3)
        result[0] = ((result[0] < 0) ? result[0] * -1 : result[0])
        result[1] = ((result[1] < 0) ? result[1] * -1 : result[1])
        result[2] = ((result[2] < 0) ? result[2] * -1 : result[2])
        return result
    }

    static is_object(object_maybe){
        return object_maybe instanceof THREE.Object3D // used to use THREE.Mesh here, but that fails for end effector in the dexter gltf model
    }
    static get_object(object_or_name){
        if(typeof(object_or_name) === "string") {
            return sim.table.getObjectByName(object_or_name)
        }
        else if(typeof(object_or_name) === "number"){
            return sim.table.getObjectById(object_or_name)
        }
        else if (this.is_object(object_or_name)) {
            return object_or_name
        }
        else { dde_error("SimX.get_object called with: " + object_or_name
            + " which does not represent an object.")
        }
    }

    static get_bounding_box(object_or_name) {
        //from https://discourse.threejs.org/t/bounding-box-is-calculated-wrong/1763/5
        let bbox = new THREE.Box3() //.setFromObject(obj)
        let obj = SimX.get_object(object_or_name)
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
    static object_contains_xyz(object_or_name, xyz){
        let obj = this.get_object(object_or_name)
        let xyz_three_arr = this.position_dde_to_three(xyz)
        let xyz_three_vec3 = this.array_to_Vector3(xyz_three_arr)
        let xyz_three_vec3_table = sim.table.localToWorld(xyz_three_vec3)
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
    static object_intersecting_object(object_or_name){
        if(!this.objects) { return null }
        let main_obj = this.get_object(object_or_name)
        for(let obj of this.objects){
            if(this.does_object_intersect_object(main_obj, obj)){
                return obj
            }
        }
        return null
    }

    static does_object_intersect_object(object_or_name1, object_or_name2){
        let object1 = this.get_object(object_or_name1)
        let object2 = this.get_object(object_or_name2)
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
    }

    static make_box({size = [1, 1, 1], //dde coordinates
                        position = [0, 0, 0], //dde coordinates
                        orientation = [0, 0, 0], //dde coordinates
                        color = null, //0x00ff00
                        name = "my_box"} = {}){
        this.remove(name) //for SimX, a "name" is unique within the children
                          //of a parent. the "default parent" is scene.table
        let three_size = this.size_dde_to_three(size)
        let geom = new THREE.BoxGeometry(three_size[0], three_size[1], three_size[2])
        let mat = (color ? new THREE.MeshPhongMaterial({color: color}) : //  MeshBasicMateria
            new THREE.MeshNormalMaterial({}))
        //mat.side = THREE.DoubleSide //From https://threejs.org/docs/index.html#manual/en/introduction/FAQ
        //todo should be unnecessary but helps in debugging invisible objects
        let obj = new THREE.Mesh(geom, mat)
        obj.name = name
        this.set_position(obj, position) //keep as dde_coordinates
        //this.set_orientation(obj, orientation) //keep as dde_coordinates
        // todo set_orientation now causes the obj to become invisible.
        this.set_color(obj, color)
        sim.J0.add(obj) //sim.table.add(obj)
        SimUtils.render_once_with_prev_args_maybe()
        SimX.objects.push(obj)
        return obj
    }

    static make_cylinder({top_diameter = 1,
                             bottom_diameter = 1,
                             height        = 1,
                             sides         = 12,
                             position      = [0, 0, 0], //dde coords
                             orientation   = [0, 0, 0], //dde coords
                             color         = null, //0x00ff00
                             name          = "my_cylinder"} = {}){
        let geom = new THREE.CylinderGeometry(top_diameter / 2, bottom_diameter / 2, height, sides)
        let mat = (color ? new THREE.MeshBasicMaterial({color: color}) :
            new THREE.MeshNormalMaterial({}))
        let obj = new THREE.Mesh(geom, mat)
        obj.name = name
        this.set_position(obj, position)
        this.set_orientation(obj, orientation)
        this.set_color(obj, color)
        sim.J0.add(obj)
        SimUtils.render_once_with_prev_args_maybe()
        SimX.objects.push(obj)
        return obj
    }

    static remove(object_or_name) {
        let obj = SimX.get_object(object_or_name)
        //sim.table.remove(obj)
        if(obj){
            obj.parent.remove(obj)
            delete this.objects[this.objects.indexOf(obj)]
            SimUtils.render_once_with_prev_args_maybe()
        }
    }

    static remove_all(remove_template_too = true){
        let template = null
        for(let obj of this.objects.slice()) { //make a copy of objects array so we aren't removing from same array we're looping over.
            let name = obj.name
            if((name === "sim_build_template") &&
                !remove_template_too) { //don't remove it
            }
            else { this.remove(obj) }
        }
    }

    //returns array of [x, y, z] meters, in dde coords
    static get_position(object_or_name) {
        let obj = SimX.get_object(object_or_name)
        let array_of_3 = [obj.position.x, obj.position.y, obj.position.z]
        return SimX.position_three_to_dde(array_of_3)
    }

    //array_of_3 in dde_coords
    static set_position(object_or_name, array_of_3 = [0, 0, 0]){
        let obj = SimX.get_object(object_or_name)
        let three_pos = this.position_dde_to_three(array_of_3)
        obj.position.x = three_pos[0]
        obj.position.y = three_pos[1]
        obj.position.z = three_pos[2]
        SimUtils.render_once_with_prev_args_maybe()
    }

    //returns array of [x_deg, y_deg, z_deg] in DDE coords
    static get_orientation(object_or_name){
        let obj = SimX.get_object(object_or_name)
        let euler_rotation = obj.rotation
        let three_orientation = [this.rad_to_deg(euler_rotation._x),
            this.rad_to_deg(euler_rotation._y),
            this.rad_to_deg(euler_rotation._z)
        ]
        return this.position_three_to_dde(three_orientation)
    }

    static set_orientation(object_or_name, orientation = [0, 0, 0]){
        let obj = SimX.get_object(object_or_name)
        let rads_in_dde = [orientation[0] / _rad,
            orientation[1] / _rad,
            orientation[2] / _rad]
        let rads_in_three = this.position_dde_to_three(rads_in_dde)
        obj.rotateX(rads_in_three[0])
        obj.rotateY(rads_in_three[1])
        obj.rotateZ(rads_in_three[3])
        SimUtils.render_once_with_prev_args_maybe()
    }

    //size in dde_coords
    static set_size(object_or_name, size = [1, 1, 1]){
        let obj = SimX.get_object(object_or_name)
        let three_size = this.position_dde_to_three(size)
        if (obj.geometry instanceof THREE.CylinderGeometry){
            let sides = obj.geometry.parameters.radialSegments
            //first & 2nd args below are radius's but we pass in overall width, so cut it in half,
            //and call that the top radius
            //use the 2nd size elt to mean the BOTTOM radius
            //and third to mean length of cylinder
            let new_geom = new THREE.CylinderGeometry(three_size[0] / 2,
                three_size[1] / 2,
                three_size[2],
                sides)
            obj.geometry = new_geom
        }
        else if(obj.geometry instanceof THREE.BoxGeometry){
            obj.scale.x = three_size[0]
            obj.scale.y = three_size[1]
            obj.scale.z = three_size[2]
        }
        else {
            dde_error("Sim.set_size asked to set the size of unsuppored geometry: " +
                obj.geometry)
        }
        SimUtils.render_once_with_prev_args_maybe()
    }
    static set_color(object_or_name, color = null){
        let obj = SimX.get_object(object_or_name)
        if(color === "random") {
            color = new THREE.Color(Math.random(), Math.random(), Math.random())
        }
        if(color) { obj.material.setValues({color: color}) }
        else      { obj.material = new THREE.MeshNormalMaterial({}) } //the multi-no color
        SimUtils.render_once_with_prev_args_maybe()
    }
}