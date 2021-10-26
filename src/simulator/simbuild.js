class SimBuild{
    static j7_prev_angle = 0
    static j7_threshold = 20 //20 or below means gripper should be closed
    static is_gripper_open = false
    static template_object = null //if null, SimBuild is NOT inited. SimBuild.template_object is used in simutils.js

    static init(){
        if(SimX.objects) { SimX.remove_all() }
        else { SimX.objects = [] }
        SimX.ensure_simulate()
        this.gripper_closing = this.gripper_closing_sim_build
        this.gripper_opening = this.gripper_opening_sim_build
        setTimeout(function(){
            SimBuild.template_object = SimX.make_box({color: "blue",
                name: "sim_build_template",
                size: [0.1, 0.2, 0.4],
                position: [0.3,
                    0.5,
                    0.5],
                orientation: [0, 0, 0],
                castShadow: true,
                receiveShadow: true
            })
            }, 500) //gives chance for SimX.ensure_simulate to work before adding new box.
    }

    //maybe not useful. returns array of 3 but the numbers are huge.
    static ee_position_array_world(){
    //let ee_vec3 = sim.LINK5.position
    //let ee_vec3_world = sim.LINK5.localToWorld(ee_vec3)
    //let ee_arr_world = SimX.Vector3_to_array(ee_vec3_world)
    //return ee_arr_world
        let ee_obj = Simulate.sim.LINK5
        ee_obj.updateMatrixWorld();
        let ee_vec3_world = new THREE.Vector3()
        ee_obj.getWorldPosition(ee_vec3_world)
        let result = SimX.Vector3_to_array(ee_vec3_world)
        return result
    }

    //xyz is in dde coords
    static handle_j7_change = function(j7_angle, xyz, rob){
    //out("handle_j7_change j7_angle: " + j7_angle + " Dexter." + rob.name)
        if((j7_angle > this.j7_threshold) &&
            (this.j7_prev_angle <= this.j7_threshold)) {
            this.is_gripper_open = true
            let obj = SimX.object_containing_xyz(this.ee_position_array_world())
            this.gripper_opening.call(this, j7_angle, xyz, obj, rob)
        }
        else if((j7_angle <= this.j7_threshold) &&
            (this.j7_prev_angle > this.j7_threshold)) {
            this.is_gripper_open = false
            let obj = SimX.object_intersecting_object(sim.LINK5)
            this.gripper_closing.call(this, j7_angle, xyz, obj, rob)
        }
        this.j7_prev_angle = j7_angle
    }

    //xyz in dde coords
    static gripper_opening_default = function(j7_angle, xyz, obj, rob){
        let obj_name
        if(!obj) { obj_name = "no object" }
        else if(obj.name && (obj.name.length > 0)) {
            obj_name = obj.name
        }
        else { obj_name = "an object with no name" }
        out("gripper opening to degrees: " + j7_angle +
            " xyz: " + xyz +
            "<br/>with object: " + obj_name +
            " on Dexter." + rob.name)
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
        out("gripper closing to degrees: " + j7_angle +
            " xyz: " + xyz +
            "<br/>with object: " + obj_name +
            " on Dexter." + rob.name)
    }
//this is the "default-default" setting
    static gripper_closing = this.gripper_closing_default

    static made_obj_count = 0
    static gripper_now_holding_object = null

    static gripper_closing_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_closing_default(j7_angle, xyz, obj, rob)
        let new_obj
        if(obj === this.template_object){
            new_obj = obj.clone()
            new_obj.material = new THREE.MeshPhongMaterial({color:"black", shininess:90, specular:"white"}) //MeshBasicMaterial  must do so that
            //all the boxes we make with clone won't be the same color
            //they need their own "material" object to hold their own color.
            SimX.objects.push(new_obj)
            new_obj.name = "sim_build_obj_" + this.made_obj_count
            this.made_obj_count += 1
            SimX.set_color(new_obj, "random")
        }
        else {
            new_obj = obj
        }
        SimX.set_position(new_obj, [0, 0, 0])
        Simulate.sim.LINK5.add(new_obj)
        this.gripper_now_holding_object = new_obj
    }

    static gripper_opening_sim_build(j7_angle, xyz, obj, rob){
        this.gripper_opening_default(j7_angle, xyz, obj, rob)
        if(this.gripper_now_holding_object) {
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
}

globalThis.SimBuild = SimBuild