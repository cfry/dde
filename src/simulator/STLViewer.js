

globalThis.STLViewer = class STLViewer
{
    //_________STL VIEWER ________
    static stl_init_viewer(){
        this.stl_init_mouse()
        this.sim.enable_rendering = false
        this.sim.scene  = new THREE.Scene();
        this.sim.camera = new THREE.PerspectiveCamera(75, //75,
            globalThis.innerWidth / globalThis.innerHeight, 0.1, 1000);
        this.sim.camera.position.z = 2; //2
        this.sim.camera.position.y = 1
        this.sim.camera.zoom.zoom = 4 //0.79 //has no effect.

        //camera.position.set( -15, 10, 15 );
        //camera.lookAt( scene.position );

        this.sim.renderer = new THREE.WebGLRenderer();
        this.sim.renderer.setSize( globalThis.innerWidth, globalThis.innerHeight );
        sim_graphics_pane_id.innerHTML = "" //clear out the previous contents
        sim_graphics_pane_id.appendChild(this.sim.renderer.domElement);
    }

    static stl_render(){
        requestAnimationFrame(this.stl_render)
        if (this.sim.mouseDown){
            this.stl_sim_handle_mouse_move()
        }
        this.sim.renderer.render(this.sim.scene, this.sim.camera);
    }


    static stl_init_mouse(){
        this.sim.mouseX_at_mouseDown    = 0
        this.sim.mouseY_at_mouseDown    = 0
        //this.sim.tableX_at_mouseDown    = 0
        //this.sim.tableY_at_mouseDown    = 0
        this.sim.zoom_at_mouseDown      = 1
        this.sim.rotationX_at_mouseDown = 0
        this.sim.rotationY_at_mouseDown = 0

        sim_graphics_pane_id.addEventListener("mousedown", function(event) {
            Simulate.sim.mouseDown              = true
            Simulate.sim.shiftDown              = event.shiftKey
            Simulate.sim.altDown                = event.altKey
            Simulate.sim.mouseX_at_mouseDown    = event.clientX
            Simulate.sim.mouseY_at_mouseDown    = event.clientY
            //Simulate.sim.tableX_at_mouseDown    = this.sim.table.position.x
            //Simulate.sim.tableY_at_mouseDown    = this.sim.table.position.y
            Simulate.sim.zoom_at_mouseDown      = Simulate.sim.camera.zoom
            Simulate.sim.rotationX_at_mouseDown = Simulate.sim.table.rotation.x
            Simulate.sim.rotationY_at_mouseDown = Simulate.sim.table.rotation.y
        }, false);

        sim_graphics_pane_id.addEventListener('mousemove', function(event) {
            if (Simulate.sim.mouseDown){
                Simulate.sim.mouseX = event.clientX;
                Simulate.sim.mouseY = event.clientY;
                Simulate.stl_sim_handle_mouse_move()
                //Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera);
                // SimUtils.render()
            }
        }, false);

        sim_graphics_pane_id.addEventListener("mouseup", function(event) {
            Simulate.sim.mouseDown = false
            Simulate.sim.shiftDown = false
            Simulate.sim.altDown   = false
        }, false);
    }
    //from https://stackoverflow.com/questions/27095251/how-to-rotate-a-three-perspectivecamera-around-on-object
    static stl_camera_angle = 0;
    static stl_camera_radius = 500;
    static stl_sim_handle_mouse_move(){
        var mouseX_diff =  this.sim.mouseX - this.sim.mouseX_at_mouseDown //positive if moving right, neg if moving left
        var mouseY_diff =  this.sim.mouseY - this.sim.mouseY_at_mouseDown //positive if moving right, neg if moving left
        if (this.sim.shiftDown){ //zoom
            //alert(camera.zoom)  //camera.zoom starts at 1
            let zoom_increment = mouseX_diff / 100.0
            this.sim.camera.zoom = this.sim.zoom_at_mouseDown + zoom_increment //(spdy * 0.1)
            this.sim.camera.updateProjectionMatrix()
        }
        else if (this.sim.altDown){ //pan
            let panX_inc = mouseX_diff / 100
            let panY_inc = mouseY_diff / 100
            this.sim.camera.position.x =  this.sim.camera.position.x + panX_inc
            this.sim.camera.position.y =  this.sim.camera.position.y - panY_inc
        }
        else { //rotate
            //this.sim.table.rotation.x = this.sim.rotationX_at_mouseDown + (mouseY_diff / 100)
            //this.sim.table.rotation.y = this.sim.rotationY_at_mouseDown + (mouseX_diff / 100)
            this.sim.camera.position.x = this.stl_camera_radius * Math.cos( this.stl_camera_angle );
            this.sim.camera.position.z = this.stl_camera_radius * Math.sin( this.stl_camera_angle );
            this.stl_camera_angle += 0.01;
        }
    }
    static fbx_render(){        
        requestAnimationFrame(this.fbx_render)        
        if (this.sim.mouseDown){            
            this.stl_sim_handle_mouse_move()
        }        
        this.sim.renderer.render(this.sim.scene, this.sim.camera) //don't pass camera as 2nd arg because the fbx file already has a camera in it.    
    }
}
