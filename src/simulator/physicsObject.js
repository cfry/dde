globalThis.PhysicsObject = class PhysicsObject
{
    static Shape = 
    {
        BOX:0,
        SPHERE:1,
        CYLINDER:2
    }
    static createBox(size,pos,mass,color)
    {
        return new PhysicsObject(PhysicsObject.Shape.BOX,size,pos,mass,color);
    }
    static createSphere(radius,pos,mass,color)
    {
        return new PhysicsObject(PhysicsObject.Shape.SPHERE,radius,pos,mass,color);
    }
    constructor(shape,size,pos,mass,color)
    {
        this.mass = mass;
        this._createRigidBody(shape,size,pos,mass);

        this.zeroVec = new Ammo.btVector3(0,0,0);
        this.tempAmmoPos =  new Ammo.btVector3();
        this.tempAmmoQuat =  new Ammo.btQuaternion();

        this.tempThreePosition =  new THREE.Vector3();
        this.tempThreeQuat =  new THREE.Quaternion();


        this.boundingBox = new THREE.Box3();

        // this.helper = new THREE.BoxHelper(this.mesh);
        // Simulate.sim.scene.add(this.helper);

        this.gripperThreshold = 100;
    }
    _createGenericMesh(shape,size,pos,color)
    {
        switch(shape)
        {
            case PhysicsObject.Shape.BOX:
                this.meshGeometry = new THREE.BoxGeometry( 1, 1, 1 );
                break;

            case PhysicsObject.Shape.SPHERE:
                this.meshGeometry = new THREE.SphereGeometry(1);
                break;
            case PhysicsObject.Shape.CYLINDER:
                this.meshGeometry = new THREE.CylinderGeometry(1,1,1);
                break;
        }


        this.material = new THREE.MeshPhongMaterial({color: color});
    
        //Create Three.js Block
        this.mesh = new THREE.Mesh(this.meshGeometry, this.material);
    
        this.mesh.position.set(pos.x, pos.y, pos.z);

        switch(shape)
        {
            case PhysicsObject.Shape.BOX:
                this.mesh.scale.set(size.x, size.y, size.z);
                break;
            case PhysicsObject.Shape.SPHERE:
                this.mesh.scale.set(size, size, size);
                break;
            case PhysicsObject.Shape.CYLINDER:
                this.mesh.scale.set(size.x, size.y, size.z);
            break;
        }


        Simulate.sim.scene.add(this.mesh);
    }
    _createRigidBody(shape,size,pos,mass)
    {
        let quat = {x: 0, y: 0, z: 0, w: 1};

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3(Simulate.physicsScale *  pos.x, Simulate.physicsScale * pos.y, Simulate.physicsScale * pos.z ) )
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        let motionState = new Ammo.btDefaultMotionState( transform );
    
        switch(shape)
        {
            case PhysicsObject.Shape.BOX:
                this.colShape = new Ammo.btBoxShape( new Ammo.btVector3( Simulate.physicsScale * size.x * 0.5, Simulate.physicsScale * size.y * 0.5, Simulate.physicsScale * size.z * 0.5 ) );
                break;
            case PhysicsObject.Shape.SPHERE:
                this.colShape = new Ammo.btSphereShape( Simulate.physicsScale * size);
                break;
            case PhysicsObject.Shape.CYLINDER:
                this.colShape = new Ammo.btCylinderShape(new Ammo.btVector3( Simulate.physicsScale * size.x, Simulate.physicsScale * size.y * 0.5, Simulate.physicsScale * size.z) );
            break;
        }
        

        this.colShape.setMargin( 0.05 );
    
        this.localInertia = new Ammo.btVector3( 0, 0, 0 );
        this.colShape.calculateLocalInertia( mass, this.localInertia );
    
        let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, this.colShape, this.localInertia );
        this.rigid_body = new Ammo.btRigidBody( rbInfo );
        this.rigid_body.setFriction(0.9);
        this.rigid_body.setRollingFriction(0.01);

    
    
        Simulate.physicsWorld.addRigidBody( this.rigid_body );
        Simulate.physicsBodies.push(this);
    }
    update()
    {
        let motionState = this.rigid_body.getMotionState();

        if ( motionState ) {
            if(this.kinematic) {

                this.mesh.getWorldPosition(this.tempThreePosition);
                this.tempThreePosition.multiplyScalar(Simulate.physicsScale);
                this.tempAmmoPos.setValue(this.tempThreePosition.x,this.tempThreePosition.y,this.tempThreePosition.z);

                this.mesh.getWorldQuaternion(this.tempThreeQuat);
                this.tempAmmoQuat.setValue(this.tempThreeQuat.x,this.tempThreeQuat.y,this.tempThreeQuat.z,this.tempThreeQuat.w);

                Simulate.tmpTrans.setIdentity();
                Simulate.tmpTrans.setOrigin( this.tempAmmoPos ); 
                Simulate.tmpTrans.setRotation( this.tempAmmoQuat ); 

                motionState.setWorldTransform(Simulate.tmpTrans);

            }
            else {
                motionState.getWorldTransform( Simulate.tmpTrans );
                let p = Simulate.tmpTrans.getOrigin();
                let q = Simulate.tmpTrans.getRotation();
                this.mesh.position.set( p.x()/Simulate.physicsScale, p.y()/Simulate.physicsScale, p.z()/Simulate.physicsScale );
                this.mesh.quaternion.set( q.x(), q.y(), q.z(), q.w() );
            }
        }
        // this.helper.update();

        this.boundingBox.setFromObject(this.mesh);
        let gripperInside = this.boundingBox.containsPoint(Simulate.gripperLocation);
        if(gripperInside)
        {

            let aboveThresh = Simulate.currentJ7Pos <= this.gripperThreshold ;

            if(aboveThresh)
            {
                if(!(Simulate.lastJ7Pos <= this.gripperThreshold))
                {
                    // this.helper.material.color.set(0x00FF00);
                    this.grab();
                }
                else
                {
                    // this.helper.material.color.set(0xFF8000);
                }
            }
            else if(!this.held)
            {
                // this.helper.material.color.set(0xFFFF00);
            }  
        }


    }

    static MotionState = {
        ACTIVE : 1,
        ISLAND_SLEEPING : 2, 
        WANTS_DEACTIVATION : 3,
        DISABLE_DEACTIVATION : 4,
        DISABLE_SIMULATION : 5
    };
    static CollisionFlags = 
    {
        CF_STATIC_OBJECT: 1,
        CF_KINEMATIC_OBJECT: 2,
        CF_NO_CONTACT_RESPONSE: 4,
        CF_CUSTOM_MATERIAL_CALLBACK: 8,//this allows per-triangle material (friction/restitution)
        CF_CHARACTER_OBJECT: 16,    
        CF_DISABLE_VISUALIZE_OBJECT: 32, //disable debug drawing
        CF_DISABLE_SPU_COLLISION_PROCESSING: 64//disable parallel/SPU processing
    };
    grab()
    {
        this.makeKinematic()
        this.held = true;
        Simulate.sim.J6.attach(this.mesh);
    }

    makeKinematic()
    {

        this.rigid_body.setActivationState( PhysicsObject.MotionState.DISABLE_DEACTIVATION );
        this.rigid_body.setCollisionFlags( PhysicsObject.CollisionFlags.CF_KINEMATIC_OBJECT );

        this.rigid_body.setMassProps(0, this.zeroVec);
        this.rigid_body.setLinearVelocity( this.zeroVec)
        this.rigid_body.setAngularVelocity( this.zeroVec)
        this.rigid_body.updateInertiaTensor();
        this.kinematic = true;
    }

    makeDynamic()
    {
        this.colShape.calculateLocalInertia( this.mass, this.localInertia );
        
        this.rigid_body.setActivationState( PhysicsObject.MotionState.ACTIVE );
        this.rigid_body.setCollisionFlags( 0 );

        this.rigid_body.setMassProps(this.mass, this.localInertia);
        this.rigid_body.setLinearVelocity( this.zeroVec)
        this.rigid_body.setAngularVelocity( this.zeroVec);
        this.rigid_body.updateInertiaTensor();
        this.kinematic = false;
    }

    release()
    {
        this.mesh.parent.remove(this.mesh);
        this.mesh.matrixWorld.decompose( this.mesh.position, this.mesh.quaternion,this.mesh.scale);
        Simulate.sim.scene.add(this.mesh);

        this.makeDynamic();

        this.held = false;
    }
}
