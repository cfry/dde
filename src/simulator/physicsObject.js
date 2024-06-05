import { max, re } from "mathjs";
import { AmbientLight, BoxGeometry, CylinderGeometry, MeshPhongMaterial, SphereGeometry } from "three";

globalThis.PhysicsObject = class PhysicsObject
{
    static Shape = 
    {
        BOX:0,
        SPHERE:1,
        CYLINDER:2
    }
    
    // If set to true, a box will be drawn around each physics object representing its collider.
    static showColliders = false;


    // If set to true, the bounding box around each object that is used for object pickup will be shown
    static showGripperBox = false;
    

    // Create a box
    static createBox(size,pos,mass,color)
    {
        let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        let mesh = new THREE.Mesh(geometry,new MeshPhongMaterial({color:color}));
        mesh.position.set(pos.x,pos.y,pos.z);
        mesh.scale.set(size.x,size.y,size.z);
        Simulate.sim.scene.add(mesh);
        return new PhysicsObject(mesh,mass);
    }

    //Create a ssphere
    static createSphere(radius,pos,mass,color)
    {
        let geometry = new THREE.SphereGeometry( 1 );
        let mesh = new THREE.Mesh(geometry,new MeshPhongMaterial({color:color}));
        mesh.position.set(pos.x,pos.y,pos.z);
        mesh.scale.set(radius,radius,radius);
        Simulate.sim.scene.add(mesh);
        return new PhysicsObject(mesh,mass,PhysicsObject.Shape.SPHERE);
    }

    /**
     * @param {THREE.Mesh} mesh Mesh used to create the physics object
     * @param {Number} mass The desired mass of the object. A mass of 0 will make the object static
     * @param {Number} colliderType The type of collider. If this is not specified, the collider type which best fits the object will be determined automatically. Specify using PhysicsObject.Shape
     */
    constructor(mesh,mass=1,colliderType)
    {
        this.tempThreePosition0 = new THREE.Vector3();
        this.tempThreePosition1 = new THREE.Vector3();
        this.tempThreeQuat = new THREE.Quaternion();

        this.mesh = mesh;
        this.mass = mass;
        this._initAmmo();


        //Create a wireframe to show bounding box for debug
        {
            let colliderFrameGeometry;

            // Create a geometry of the correct shape and size
            switch(this.colliderInfo.type)
            {
                case PhysicsObject.Shape.BOX:
                    colliderFrameGeometry = new BoxGeometry(this.colliderInfo.size.x,this.colliderInfo.size.y,this.colliderInfo.size.z);
                    break;
                case PhysicsObject.Shape.SPHERE:
                    colliderFrameGeometry = new SphereGeometry(this.colliderInfo.radius);
                    break;
                case PhysicsObject.Shape.CYLINDER:
                    colliderFrameGeometry = new CylinderGeometry(this.colliderInfo.radius,this.colliderInfo.radius,this.colliderInfo.height);
                    switch(this.colliderInfo.axis)
                    {
                        case 0:
                            colliderFrameGeometry.rotateZ(0.5*Math.PI);
                            break;
                        case 2:
                            colliderFrameGeometry.rotateX(0.5*Math.PI);
                            break;
                    }
                break;
            }
            
            //Create a geometry that just represents the edges of the collider
            let colliderFrameEdges = new THREE.EdgesGeometry( colliderFrameGeometry ); 

            //Create a lines segments object. This object is what is added to the scene and corresponds with the physics object. Note: this is purely for debug and does not affect the operation of anything else in any way
            this.colliderLines = new THREE.LineSegments(colliderFrameEdges, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) ); 
            Simulate.sim.scene.add(this.colliderLines );
            this.clawIntersectTriangle = new THREE.Triangle();
            
            colliderFrameGeometry.dispose();
            colliderFrameEdges.dispose();
        }


        // Bounding box used for object pickup
        this.pickupBox = new THREE.Box3();

        //Object to show where the pickupBox is to make debugging easier
        this.pickupHelper = new THREE.Box3Helper(this.pickupBox,0xff00ff);
        Simulate.sim.scene.add(this.pickupHelper);

        // Theshold for the claw to be closed to pickup the object
        this.gripperThreshold = 200;

        this.held = false;

        this.mesh.userData.physObj = this;
    }

    updateCollider()
    {
        this._destroyAmmo();
        this._initAmmo();
        // switch(this.colliderInfo.type)
        // {
        //     case PhysicsObject.Shape.BOX:
        //         Simulate.physicsWorld.removeRigidBody(this.rigid_body);
        //         this.colliderInfo = PhysicsObject.computeBoxCollider(this.mesh);
        //         this.colScaleVec.setValue(Simulate.physicsScale * this.colliderInfo.size.x, Simulate.physicsScale * this.colliderInfo.size.y, Simulate.physicsScale * this.colliderInfo.size.z)
        //         this.colShape.setLocalScaling(this.colScaleVec);
        //         this.colShape.setMargin( 0.05 );
        //         this.colShape.calculateLocalInertia( mass, this.localInertia );
        //         Simulate.physicsWorld.addRigidBody(this.rigid_body);
        //     break;
                

        // }
    }

    _initAmmo(colliderType)
    {
        //List of all ammo objects for memory management purposes
        this.ammoObjects = [];
        //Variable init
        this.zeroVec = new Ammo.btVector3(0,0,0);
        this.tempAmmoPos =  new Ammo.btVector3();
        this.tempAmmoQuat =  new Ammo.btQuaternion();
        this.tempAmmoTrans =  new Ammo.btTransform();;

        this.ammoObjects.push(this.zeroVec);
        this.ammoObjects.push(this.tempAmmoPos);
        this.ammoObjects.push(this.tempAmmoQuat);
        this.ammoObjects.push(this.tempAmmoTrans);
        //Compute the dimensions of the collider
        if(colliderType != undefined)
        {
            switch(colliderType)
            {
                case PhysicsObject.Shape.BOX:
                    this.colliderInfo = PhysicsObject.computeBoxCollider(this.mesh);
                    break;
                case PhysicsObject.Shape.SPHERE:
                    this.colliderInfo = PhysicsObject.computeSphereCollider(this.mesh);
                    break;
                case PhysicsObject.Shape.CYLINDER:
                    this.colliderInfo = PhysicsObject.computeCylinderCollider(this.mesh);
                    break;
            }
        }
        else
        {
            this.colliderInfo = PhysicsObject.computeBestCollider(this.mesh);
        }
    
        // Get the position and rotation of the mesh in world coordinates. Getting the .position or .quaternion parameter of the mesh will not work, as it is relative to the position of it's parent
        let meshPostion = new THREE.Vector3();
        let meshQuaternion = new THREE.Quaternion();
        this.mesh.getWorldPosition(meshPostion);
        this.mesh.getWorldQuaternion(meshQuaternion);

        meshPostion.add(this.colliderInfo.offset);

        // Create Rigidbody

        // Note: All cordinates in physical space are scaled by Simulate.physicsScale so that the physics aren't broken due to everything being tiny

        // Create a transform representing the position and rotation of the physical object
        let transform = new Ammo.btTransform();
        let ammoOrigin =  new Ammo.btVector3(Simulate.physicsScale *  meshPostion.x, Simulate.physicsScale * meshPostion.y, Simulate.physicsScale * meshPostion.z );
        let ammoQuat = new Ammo.btQuaternion( meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w ) ;

        this.ammoObjects.push(transform);
        this.ammoObjects.push(ammoOrigin);
        this.ammoObjects.push(ammoQuat);

        // Set the position and rotation of the object based on the mesh's WORLD coordinates
        transform.setIdentity();
        transform.setOrigin(ammoOrigin)
        transform.setRotation(ammoQuat);

        // Create a motion state to initialize the rigidBody from the above transform. The motionState represents the state of the object in physical space (position, orientation, velocity etc)
        let motionState = new Ammo.btDefaultMotionState( transform );
        this.ammoObjects.push(motionState);


        this.colScaleVec = new Ammo.btVector3(); 
        
    
        // Create the collider. This collider is just the shape that is used to compute collisions. It is used to initialize the rigidBody so that it knows what shape it is
        switch(this.colliderInfo.type)
        {
            case PhysicsObject.Shape.BOX:
                this.colShape = new Ammo.btBoxShape( new Ammo.btVector3(0.5,0.5,0.5) );
                break;
            case PhysicsObject.Shape.SPHERE:
                this.colShape = new Ammo.btSphereShape( Simulate.physicsScale * this.colliderInfo.radius);
                break;
            case PhysicsObject.Shape.CYLINDER:
                switch(this.colliderInfo.axis)
                {
                    case 0:
                        this.colShape = new Ammo.btCylinderShapeX(new Ammo.btVector3( 
                            Simulate.physicsScale * this.colliderInfo.height * 0.5,
                            Simulate.physicsScale * this.colliderInfo.radius,
                            Simulate.physicsScale * this.colliderInfo.radius
                        ));
                        break;
                    case 1:
                        this.colShape = new Ammo.btCylinderShape(new Ammo.btVector3( 
                            Simulate.physicsScale * this.colliderInfo.radius,
                            Simulate.physicsScale * this.colliderInfo.height * 0.5, 
                            Simulate.physicsScale * this.colliderInfo.radius
                        ) );
                        break;
                    case 2:
                        this.colShape = new Ammo.btCylinderShapeZ(
                            new Ammo.btVector3(
                                Simulate.physicsScale * this.colliderInfo.radius, 
                                Simulate.physicsScale * this.colliderInfo.radius, 
                                Simulate.physicsScale * this.colliderInfo.height * 0.5
                            ) );
                        break;
                }
                break;
        } 
        this.colScaleVec.setValue(Simulate.physicsScale * this.colliderInfo.size.x, Simulate.physicsScale * this.colliderInfo.size.y, Simulate.physicsScale * this.colliderInfo.size.z)
        this.colShape.setLocalScaling(this.colScaleVec);
        this.ammoObjects.push(this.colShape);
        
        

        // Set the margin for error that is used when calculating collisions
        this.colShape.setMargin( 0.05 );
        
    
        //Calculate the inertia of the object. Note: YOU CANNOT SET MASS WITHOUT THIS STEP. 
        this.localInertia = new Ammo.btVector3( 0, 0, 0 );
        this.colShape.calculateLocalInertia( this.mass, this.localInertia );
        this.ammoObjects.push(this.localInertia);
    
        // Create the rigidbody. This is what represents the physical object in the scene.
        let rbInfo = new Ammo.btRigidBodyConstructionInfo( this.mass, motionState, this.colShape, this.localInertia );
        this.rigid_body = new Ammo.btRigidBody( rbInfo );
        this.rigid_body.setFriction(0.9);
        this.rigid_body.setRollingFriction(0.01);

        this.ammoObjects.push(rbInfo);
        this.ammoObjects.push(this.rigid_body);

    
        // Add the rigidbody to the world, and add this object to the list of physicsBodies in Simulate
        Simulate.physicsWorld.addRigidBody( this.rigid_body );
        this.index = Simulate.physicsBodies.length
        Simulate.physicsBodies.push(this);
    }

    _destroyAmmo()
    {
        Simulate.physicsBodies.splice(this.index,1);
        Simulate.physicsWorld.removeRigidBody(this.rigid_body);
        for(let obj of this.ammoObjects)
        {
            Ammo.destroy(obj);
        }
        this.ammoObjects = [];
    }

    /** Remove the object from the scene and remove it
     * @param {boolean} [disposeGeometry=true] Will remove the mesh from its parent and dispose of its geometry
     * @param {boolean} [disposeMaterial=true] Will remove the mesh from its parent and dispose of its material
    */
    destroy(disposeGeometry = true, disposeMaterial = true)
    {
        this._destroyAmmo();
        delete this.mesh.userData.physObj;

        
        this.colliderLines.parent.remove(this.colliderLines);
        this.colliderLines.geometry.dispose();
        this.colliderLines.material.dispose();
        
        this.pickupHelper.parent.remove(this.pickupHelper);
        this.pickupHelper.dispose();

        if(disposeGeometry || disposeMaterial)
        {
            if(this.mesh.parent) { this.mesh.parent.remove(this.mesh); }
            if(disposeGeometry)
            {
                this.mesh.geometry.dispose();
            }
            if(disposeMaterial)
            {
                this.mesh.material.dispose();
            }
        }
    }

    // Compute the best collider to use for a given mesh
    static computeBestCollider(mesh)
    {
        // Compute the collider dimensions (size, position etc) for each type of collider
        let boxCol = PhysicsObject.computeBoxCollider(mesh);
        let sphereCol = PhysicsObject.computeSphereCollider(mesh);
        let cylinderCol = PhysicsObject.computeCylinderCollider(mesh);
        let cols = [boxCol,sphereCol,cylinderCol];

        /*  Choose the collider with the lowest volume.
         Volume is used to choose the collider because if the volume is lower, that means if fits the object more closely
         A perfect collider would have a volume equal to the volume of the mesh */
        let bestVol = Infinity;
        let bestCol;
        for(let i = 0; i < cols.length; i++)
        {
            if(cols[i].volume < bestVol)
            {
                bestCol = cols[i];
                bestVol = bestCol.volume;
            }
        }
        return bestCol;
    }
    // Compute the dimensions for a cylindrical collider around a mesh
    static computeCylinderCollider(mesh,axis)
    {
        // Get the size and center of the bounding box around the geometry. 
        // The geometry is used instead of the mesh itself so that the box will be aligned relative to the object rather than the world.
        let center = new THREE.Vector3();
        let size = new THREE.Vector3();

        // Get the WORLD scale of the mesh. This scale takes into account the scale of the object AND it's parents
        let scale = new THREE.Vector3();
        mesh.getWorldScale(scale);

        // Compute the bounding box of the mesh geometry and scale it by the world scale of the mesh. 
        // Scaling the bounding box ensures the dimensions of the bounding box are in world coordinates
        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        // Get the size and center of the bounding box.
        // Note that the center of the bounding box is relative to the origin of the object, NOT the origin of the world.
        geoBB.getSize(size);
        geoBB.getCenter(center);

        // Get the number of points in the geometry
        let points = mesh.geometry.attributes.position.count;

        // Initialize variables for the the maximum distance of any point from each cental axis (in the planes YZ, ZX, and XY)
        /* If a cylinder is created with its central axis positioned on the center of the bounding box, the radius can be set
        to the corresponding maxDist because there will be no points further away guarantying that the cylinder will enclose the entire mesh
        */
        let maxDistYZ = 0;
        let maxDistZX = 0;
        let maxDistXY = 0;

        // Iterate through every point in the geometry
        for(let i = 0; i < points; i++)
        {
            // Get the position of the point scaled by the world scale of the mesh
            let x = mesh.geometry.attributes.position.getX(i)*scale.x;
            let y = mesh.geometry.attributes.position.getY(i)*scale.y;
            let z = mesh.geometry.attributes.position.getZ(i)*scale.z;

            // Get the distance in each plane of the point to the center of the bounding box
            let distYZ = Math.sqrt((y-center.y)**2+(z-center.z)**2);
            let distZX = Math.sqrt((z-center.z)**2+(x-center.x)**2);
            let distXY = Math.sqrt((x-center.x)**2+(y-center.y)**2);

            // If this distance is greater than the current maximum distance, set the maximum distance to the current distance
            if(distYZ > maxDistYZ){
                maxDistYZ = distYZ;
            }
            if(distZX > maxDistZX){
                maxDistZX = distZX;
            }
            if(distXY > maxDistXY){
                maxDistXY = distXY;
            }
        }
        // Get the volume of the x, y and z aligned cylinders
        let xVolume = Math.PI * maxDistYZ**2 * size.x;
        let yVolume = Math.PI * maxDistZX**2 * size.y;
        let zVolume = Math.PI * maxDistXY**2 * size.z;
        let volumes = [xVolume,yVolume,zVolume];
        let dists = [maxDistYZ,maxDistZX,maxDistXY];
        let heights = [size.x,size.y,size.z];

        // Choose the cylinder with the lowest volume, as it fits the mesh best
        let minVolume = Infinity;
        let bestAxis = axis;
        if(axis == undefined)
        {
            for(let i = 0; i < 3; i++)
            {
                if(volumes[i] < minVolume)
                {
                    bestAxis = i;
                    minVolume = volumes[i];                    
                }
            }
        }
        else
        {
            minVolume = volumes[bestAxis];
        }
        
        return {
            type:PhysicsObject.Shape.CYLINDER,
            offset:center,
            axis:bestAxis,
            radius:dists[bestAxis],
            height:heights[bestAxis],
            volume:minVolume
        };
    }

    // Compute the dimensions for a spherical collider around a mesh
    static computeSphereCollider(mesh)
    {
        // Get the center of the bounding box around the geometry. 
        // The geometry is used instead of the mesh itself so that the box will be aligned relative to the object rather than the world.

        let center = new THREE.Vector3();
        let scale = new THREE.Vector3();

        // Get the WORLD scale of the mesh. This scale takes into account the scale of the object AND it's parents
        mesh.getWorldScale(scale);

        // Compute the bounding box of the mesh geometry and scale it by the world scale of the mesh. 
        // Scaling the bounding box ensures the dimensions of the bounding box are in world coordinates
        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        // Get the center of the bounding box.
        // Note that the center of the bounding box is relative to the origin of the object, NOT the origin of the world.
        geoBB.getCenter(center);

        // Get the number of points in the geometry
        let points = mesh.geometry.attributes.position.count;

        // Find the greatest distance of any point from the center of the bounding box.
        // If a sphere is created with this radius, all of the points will be inside of it.
        let maxDist = 0;
        for(let i = 0; i < points; i++)
        {
            let x = mesh.geometry.attributes.position.getX(i)*scale.x;
            let y = mesh.geometry.attributes.position.getY(i)*scale.y;
            let z = mesh.geometry.attributes.position.getZ(i)*scale.z;
            let dist = Math.sqrt((x-center.x)**2+(y-center.y)**2+(z-center.z)**2);
            if(dist > maxDist)
            {
                maxDist = dist;
            }
        }
        
        return {type:PhysicsObject.Shape.SPHERE,offset:center,radius:maxDist,volume:(4/3)*Math.PI*maxDist**3};
    }

    // Get the dimensions for a box collider around a mesh
    static computeBoxCollider(mesh)
    {
        // Get the size and center of the bounding box around the geometry. 
        // The geometry is used instead of the mesh itself so that the box will be aligned relative to the object rather than the world.

        let center = new THREE.Vector3();
        let size = new THREE.Vector3();

        // Get the WORLD scale of the mesh. This scale takes into account the scale of the object AND it's parents
        let scale = new THREE.Vector3();
        mesh.getWorldScale(scale);

        // Compute the bounding box of the mesh geometry and scale it by the world scale of the mesh. 
        // Scaling the bounding box ensures the dimensions of the bounding box are in world coordinates
        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        // Get the size and center of the bounding box
        geoBB.getSize(size);
        geoBB.getCenter(center);

        return {type:PhysicsObject.Shape.BOX,offset:center,size:size,volume:size.x*size.y*size.z};
    }
    
    // Update the object. This is called for every physics object every frame. 
    update()
    {
        // set the visibilty of the colliderLines based on PhysicsObject.showColliders. 
        this.colliderLines.visible = PhysicsObject.showColliders;

        /* Synchronize the rigidBody with the mesh
        If the object is dynamic (moves around on its own according to physics), the mesh will be updated from the rigidBody.
        If the object is kinematic (controlled by the user and not updated by physics) the rigidBody will be update by the mesh
        UPDATING THE MESH TO MOVE AN OBJECT WILL ONLY WORK IF THE OBJECT IS KINEMATIC
        */
        {
            // Get the motion state of the rigidbody. This represents the current position, rotation, velocity etc of the object. 
            let motionState = this.rigid_body.getMotionState();

            // If the motion state is defined, synchronize the mesh and rigidBody
            if ( motionState ) {
                if(this.kinematic) {  // The object is kinematic; Update the rigidBody using the mesh

                    // Get the world position and rotation of the mesh. this.tempThreePosition0 is the world position of the mesh
                    this.mesh.getWorldPosition(this.tempThreePosition0);
                    this.mesh.getWorldQuaternion(this.tempThreeQuat);
    
                    // Set this.tempThreePosition1 to the offset of the colldier. 
                    // This is necessary because the center of the collider is sometimes offset from the origin of the mesh meaning that the rigidBody needs to be offset
                    this.tempThreePosition1.set(
                        this.colliderInfo.offset.x,
                        this.colliderInfo.offset.y,
                        this.colliderInfo.offset.z
                    );
    
                    // Rotate the offset by the rotation of the mesh so it is in the correct position relative to the mesh
                    this.tempThreePosition1.applyQuaternion(this.tempThreeQuat);
    
                    // Update the colliderLines debugging helper
                    this.colliderLines.position.set(
                        (this.tempThreePosition0.x + this.tempThreePosition1.x),
                        (this.tempThreePosition0.y + this.tempThreePosition1.y),
                        (this.tempThreePosition0.z + this.tempThreePosition1.z)
                    );
                    this.colliderLines.quaternion.set(
                        this.tempThreeQuat.x,
                        this.tempThreeQuat.y,
                        this.tempThreeQuat.z,
                        this.tempThreeQuat.w
                    );

                    // Turn the new position of the rigid body into an ammo vector
                    this.tempAmmoPos.setValue(
                        (this.tempThreePosition0.x + this.tempThreePosition1.x)*Simulate.physicsScale,
                        (this.tempThreePosition0.y + this.tempThreePosition1.y)*Simulate.physicsScale,
                        (this.tempThreePosition0.z + this.tempThreePosition1.z)*Simulate.physicsScale
                    );
                    
                    // Turn the new rotation of the rigid body into an ammo quaternion
                    this.tempAmmoQuat.setValue(this.tempThreeQuat.x,this.tempThreeQuat.y,this.tempThreeQuat.z,this.tempThreeQuat.w);
    
                    // Turn the ammo vector and ammo quaternion into an ammo transform
                    this.tempAmmoTrans.setIdentity(); 
                    this.tempAmmoTrans.setOrigin( this.tempAmmoPos ); 
                    this.tempAmmoTrans.setRotation( this.tempAmmoQuat ); 
    
                    // Set the world transform of the mesh
                    motionState.setWorldTransform(this.tempAmmoTrans);
    
                }
                else { // The object is dynamic; update the mesh using the rigidBody

                    // Get the position and rotation of the rigid body
                    motionState.getWorldTransform( this.tempAmmoTrans);
                    let p = this.tempAmmoTrans.getOrigin();
                    let q = this.tempAmmoTrans.getRotation();
    
    
                    // Set the rotation of the mesh
                    this.mesh.quaternion.set( q.x(), q.y(), q.z(), q.w());

                    // Set the position of the mesh to the collider offset
                    this.mesh.position.set(
                        -this.colliderInfo.offset.x,
                        -this.colliderInfo.offset.y,
                        -this.colliderInfo.offset.z
                    );
                    
                    // Rotate the offset so it is correct relative to the rotation of the mesh
                    this.mesh.position.applyQuaternion(this.mesh.quaternion);
    
                    // Move the mesh (now offset so that the center of the collider on the mesh is at origin ) to the position of the rigidBody
                    this.mesh.position.x += p.x()/Simulate.physicsScale;
                    this.mesh.position.y += p.y()/Simulate.physicsScale;
                    this.mesh.position.z += p.z()/Simulate.physicsScale;
    
                    // Update the position of the colliderLines debug helper thing
                    this.colliderLines.position.set(p.x()/Simulate.physicsScale,p.y()/Simulate.physicsScale,p.z()/Simulate.physicsScale);
                    this.colliderLines.quaternion.set(q.x(),q.y(),q.z(),q.w());
                }
            }
        }
        

        this.pickupHelper.visible = PhysicsObject.showGripperBox && (!this.kinematic || this.held);
        if(!this.kinematic || this.held)
        {
            //Update the pickup box 
            this.mesh.geometry.computeBoundingBox();
            this.pickupBox.setFromObject(this.mesh,true);


            let gripperInside = false;
            if(Simulate.gripperBox != undefined)
            {
                for(let i = 0; i < 3; i++)
                {
                    let y = (i-1)*0.5;
                    this.clawIntersectTriangle.a.set(-0.5, y ,-0.5);
                    this.clawIntersectTriangle.b.set( 0.0, y , 0.5);
                    this.clawIntersectTriangle.c.set( 0.5, y ,-0.5);
        
                    this.clawIntersectTriangle.a.applyMatrix4(Simulate.gripperBox.matrixWorld);
                    this.clawIntersectTriangle.b.applyMatrix4(Simulate.gripperBox.matrixWorld);
                    this.clawIntersectTriangle.c.applyMatrix4(Simulate.gripperBox.matrixWorld);
        
                    if(this.pickupBox.intersectsTriangle(this.clawIntersectTriangle)){
                        gripperInside = true;
                    }
                }
            }

            let aboveThresh = Simulate.currentJ7Pos <= this.gripperThreshold ;
            if(gripperInside && aboveThresh && !(Simulate.lastJ7Pos <= this.gripperThreshold) && !this.kinematic)
            {
                this.grab();
            }
            if(this.held && !aboveThresh)
            {
                this.release();
            }
    
            if(this.held)
            {
                this.pickupHelper.material.color.set(0xff00ff);
            }
            else if(gripperInside && aboveThresh)
            {
                this.pickupHelper.material.color.set(0xFF8000);
            }
            else if(gripperInside)
            {
                this.pickupHelper.material.color.set(0xFFFF00);
            }
            else
            {
                this.pickupHelper.material.color.set(0x00ffff);
            }
        }
        
        

    }

    // Enum representing the posible states for the object to be in
    static MotionState = {
        ACTIVE : 1,
        ISLAND_SLEEPING : 2, 
        WANTS_DEACTIVATION : 3,
        DISABLE_DEACTIVATION : 4,
        DISABLE_SIMULATION : 5
    };

    // Flags for different collision behaviours
    static CollisionFlags = 
    {
        CF_STATIC_OBJECT: 1, // Static (doesn't move)
        CF_KINEMATIC_OBJECT: 2, // Kinematic (can be moved by user code, but doesn't move on its own from physics)
        CF_NO_CONTACT_RESPONSE: 4,
        CF_CUSTOM_MATERIAL_CALLBACK: 8,//this allows per-triangle material (friction/restitution)
        CF_CHARACTER_OBJECT: 16,    
        CF_DISABLE_VISUALIZE_OBJECT: 32, //disable debug drawing
        CF_DISABLE_SPU_COLLISION_PROCESSING: 64//disable parallel/SPU processing
    };

    // Attach the object to the gripper. This will cause it to maintain its current position, but now locked to the gripper
    grab()
    {
        // Make the object kinematic so that we can move it using the arm
        this.makeKinematic();

        // Mark the object as held
        this.held = true;

        // Attach the mesh to J6 so that it moves with the arm
        Simulate.sim.J6.attach(this.mesh);
    }

    // Make it so that the object is controlled by the user instead of the physics engine
    makeKinematic()
    {
        // Tell ammo that this is not a kinematic ovject
        this.rigid_body.setActivationState( PhysicsObject.MotionState.DISABLE_DEACTIVATION );
        this.rigid_body.setCollisionFlags( PhysicsObject.CollisionFlags.CF_KINEMATIC_OBJECT );

        // Set the mass of the object to zero so that it doesn't move
        this.rigid_body.setMassProps(0, this.zeroVec);

        // Set the velocity of the object to zero so that collisions aren't weird
        this.rigid_body.setLinearVelocity( this.zeroVec)
        this.rigid_body.setAngularVelocity( this.zeroVec)
        this.rigid_body.updateInertiaTensor();

        // The object is now kinematic
        this.kinematic = true;
    }

    // Make the object move around on its own due to physics
    makeDynamic()
    {
        this.rigid_body.setActivationState( PhysicsObject.MotionState.ACTIVE );
        this.rigid_body.setCollisionFlags( 0 );

        // Set the mass of the object back to what it was before
        this.colShape.calculateLocalInertia( this.mass, this.localInertia );
        this.rigid_body.setMassProps(this.mass, this.localInertia);

        this.rigid_body.setLinearVelocity( this.zeroVec)
        this.rigid_body.setAngularVelocity( this.zeroVec);
        this.rigid_body.updateInertiaTensor();

        this.kinematic = false;
    }

    // Release the object from the arm. (this will remove it from its parent and enable physics)
    release()
    {
        // Remove the object from its parent
        this.mesh.parent.remove(this.mesh);

        // Set the position, rotation, and scale of the mesh based on its world transform so that it stays where it was before
        this.mesh.matrixWorld.decompose( this.mesh.position, this.mesh.quaternion,this.mesh.scale);

        // Put the mesh back in the scene because removing it from it's parent removed it from the scene
        Simulate.sim.scene.add(this.mesh);

        // Mark the object as not held
        this.held = false;

        // Enable physics for the object again
        this.makeDynamic();
    }
}
