import { max, re } from "mathjs";
import { BoxGeometry, CylinderGeometry, MeshPhongMaterial, SphereGeometry } from "three";

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
        let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        let mesh = new THREE.Mesh(geometry,new MeshPhongMaterial({color:color}));
        mesh.position.set(pos.x,pos.y,pos.z);
        mesh.scale.set(size.x,size.y,size.z);
        Simulate.sim.scene.add(mesh);
        return new PhysicsObject(mesh,mass);
    }
    static createSphere(radius,pos,mass,color)
    {
        let geometry = new THREE.SphereGeometry( 1 );
        let mesh = new THREE.Mesh(geometry,new MeshPhongMaterial({color:color}));
        mesh.position.set(pos.x,pos.y,pos.z);
        mesh.scale.set(radius,radius,radius);
        Simulate.sim.scene.add(mesh);
        return new PhysicsObject(mesh,mass,PhysicsObject.Shape.SPHERE);
    }
    static showCollider = false;
    constructor(mesh,mass=1,colliderType)
    {
        //Variable init
        this.zeroVec = new Ammo.btVector3(0,0,0);
        this.tempAmmoPos =  new Ammo.btVector3();
        this.tempAmmoQuat =  new Ammo.btQuaternion();

        this.tempThreePosition0 = new THREE.Vector3();
        this.tempThreePosition1 = new THREE.Vector3();
        this.tempThreeQuat = new THREE.Quaternion();

        this.mesh = mesh;
        this.mass = mass;


        //Compute the dimensions of the collider
        if(colliderType != undefined)
        {
            switch(colliderType)
            {
                case PhysicsObject.Shape.BOX:
                    this.colliderInfo = PhysicsObject.computeBoxCollider(mesh);
                    break;
                case PhysicsObject.Shape.SPHERE:
                    this.colliderInfo = PhysicsObject.computeSphereCollider(mesh);
                    break;
                case PhysicsObject.Shape.CYLINDER:
                    this.colliderInfo = PhysicsObject.computeCylinderCollider(mesh);
                    break;
            }
        }
        else
        {
            this.colliderInfo = PhysicsObject.computeBestCollider(mesh);
        }
        


        // Get the position and rotation of the mesh
        let meshPostion = new THREE.Vector3();
        let meshQuaternion = new THREE.Quaternion();
        this.mesh.getWorldPosition(meshPostion);
        this.mesh.getWorldQuaternion(meshQuaternion);

        meshPostion.add(this.colliderInfo.offset);



        //Create a wireframe to show bounding box for debug
        {
            let colliderFrameGeometry;

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
    
            let colliderFrameEdges = new THREE.EdgesGeometry( colliderFrameGeometry ); 
            this.colliderLines = new THREE.LineSegments(colliderFrameEdges, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) ); 
            Simulate.sim.scene.add(this.colliderLines );
        }
        

        // Create Rigidbody
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3(Simulate.physicsScale *  meshPostion.x, Simulate.physicsScale * meshPostion.y, Simulate.physicsScale * meshPostion.z ) )
        transform.setRotation( new Ammo.btQuaternion( meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w ) );
        let motionState = new Ammo.btDefaultMotionState( transform );
    
        switch(this.colliderInfo.type)
        {
            case PhysicsObject.Shape.BOX:
                this.colShape = new Ammo.btBoxShape( new Ammo.btVector3( Simulate.physicsScale * this.colliderInfo.size.x * 0.5, Simulate.physicsScale * this.colliderInfo.size.y * 0.5, Simulate.physicsScale * this.colliderInfo.size.z * 0.5 ) );
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

    static computeBestCollider(mesh)
    {
        let boxCol = PhysicsObject.computeBoxCollider(mesh);
        let sphereCol = PhysicsObject.computeSphereCollider(mesh);
        let cylinderCol = PhysicsObject.computeCylinderCollider(mesh);
        let cols = [boxCol,sphereCol,cylinderCol];

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
    static computeCylinderCollider(mesh,axis)
    {
        let center = new THREE.Vector3();
        let size = new THREE.Vector3();

        let scale = new THREE.Vector3();
        mesh.getWorldScale(scale);

        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        geoBB.getSize(size);
        geoBB.getCenter(center);

        let points = mesh.geometry.attributes.position.count;

        let maxDistYZ = 0;
        let maxDistZX = 0;
        let maxDistXY = 0;

        for(let i = 0; i < points; i++)
        {
            let x = mesh.geometry.attributes.position.getX(i)*scale.x;
            let y = mesh.geometry.attributes.position.getY(i)*scale.y;
            let z = mesh.geometry.attributes.position.getZ(i)*scale.z;
            let distYZ = Math.sqrt((y-center.y)**2+(z-center.z)**2);
            let distZX = Math.sqrt((z-center.z)**2+(x-center.x)**2);
            let distXY = Math.sqrt((x-center.x)**2+(y-center.y)**2);

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
        let xVolume = Math.PI * maxDistYZ**2 * size.x;
        let yVolume = Math.PI * maxDistZX**2 * size.y;
        let zVolume = Math.PI * maxDistXY**2 * size.z;
        let volumes = [xVolume,yVolume,zVolume];
        let dists = [maxDistYZ,maxDistZX,maxDistXY];
        let heights = [size.x,size.y,size.z];

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

    static computeSphereCollider(mesh)
    {
        let center = new THREE.Vector3();
        let scale = new THREE.Vector3();
        mesh.getWorldScale(scale);

        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        geoBB.getCenter(center);

        let points = mesh.geometry.attributes.position.count;
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
    static computeBoxCollider(mesh)
    {
        let center = new THREE.Vector3();
        let size = new THREE.Vector3();

        let scale = new THREE.Vector3();

        mesh.getWorldScale(scale);

        mesh.geometry.computeBoundingBox();
        let geoBB = mesh.geometry.boundingBox;
        geoBB.min.multiply(scale);
        geoBB.max.multiply(scale);

        geoBB.getSize(size);
        geoBB.getCenter(center);

        return {type:PhysicsObject.Shape.BOX,offset:center,size:size,volume:size.x*size.y*size.z};
    }
    
    update()
    {
        let motionState = this.rigid_body.getMotionState();
        this.colliderLines.visible = PhysicsObject.showCollider;

        if ( motionState ) {
            if(this.kinematic) {
                this.mesh.getWorldPosition(this.tempThreePosition0);
                this.mesh.getWorldQuaternion(this.tempThreeQuat);

                this.tempThreePosition1.set(
                    this.colliderInfo.offset.x,
                    this.colliderInfo.offset.y,
                    this.colliderInfo.offset.z
                );

                this.tempThreePosition1.applyQuaternion(this.tempThreeQuat);

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

                this.tempAmmoPos.setValue(
                    (this.tempThreePosition0.x + this.tempThreePosition1.x)*Simulate.physicsScale,
                    (this.tempThreePosition0.y + this.tempThreePosition1.y)*Simulate.physicsScale,
                    (this.tempThreePosition0.z + this.tempThreePosition1.z)*Simulate.physicsScale
                );

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


                this.mesh.quaternion.set( q.x(), q.y(), q.z(), q.w());
                this.mesh.position.set(
                    -this.colliderInfo.offset.x,
                    -this.colliderInfo.offset.y,
                    -this.colliderInfo.offset.z
                );

                this.mesh.position.applyQuaternion(this.mesh.quaternion);

                this.mesh.position.x += p.x()/Simulate.physicsScale;
                this.mesh.position.y += p.y()/Simulate.physicsScale;
                this.mesh.position.z += p.z()/Simulate.physicsScale;

                this.colliderLines.position.set(p.x()/Simulate.physicsScale,p.y()/Simulate.physicsScale,p.z()/Simulate.physicsScale);
                this.colliderLines.quaternion.set(q.x(),q.y(),q.z(),q.w());
            }
        }

        // this.helper.update();

        // this.boundingBox.setFromObject(this.mesh);
        // let gripperInside = this.boundingBox.containsPoint(Simulate.gripperLocation);
        // if(gripperInside)
        // {

        //     let aboveThresh = Simulate.currentJ7Pos <= this.gripperThreshold ;

        //     if(aboveThresh)
        //     {
        //         if(!(Simulate.lastJ7Pos <= this.gripperThreshold))
        //         {
        //             // this.helper.material.color.set(0x00FF00);
        //             this.grab();
        //         }
        //         else
        //         {
        //             // this.helper.material.color.set(0xFF8000);
        //         }
        //     }
        //     else if(!this.held)
        //     {
        //         // this.helper.material.color.set(0xFFFF00);
        //     }  
        // }


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
