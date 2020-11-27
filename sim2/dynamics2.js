/*
		 1         2         3         4         5         6         7         8
12345678901234567890123456789012345678901234567890123456789012345678901234567890

	dynamics2.js

*/

const { DexterSim2 }			= require ( './dexter' );


module.exports.dynamics2 = ( function() {

	let self = {};

	let Ammo = null;

	let quatRotate = null;

	let dispatcher = null;

	let broadphase = null;

	let world = null;

	let ground = null;

	let numLinks = 0;

	let multiBody = null;

	let jointMotors = null;
	
	let inverseModel = null;

	let nSteps = 0;
	
	let shapes		= [];
	let	colliders	= [];
	

	//	Could not expose the btBrodphaseProxy CollisionFilterGroups enum.
	//	So, for now, ...
	let CollisionFilter = { 
		DefaultFilter:		1,
		StaticFilter:		2,
		KinematicFilter:	4,
		DebrisFilter:		8,
		SensorTrigger:		16,
		CharacterFilter:	32,
		AllFilter:			-1 };

	let CollisionFlags = {
		CF_STATIC_OBJECT:						1,
		CF_KINEMATIC_OBJECT:					2,
		CF_NO_CONTACT_RESPONSE:					4,
		CF_CUSTOM_MATERIAL_CALLBACK:			8,
		CF_CHARACTER_OBJECT:					16,
		CF_DISABLE_VISUALIZE_OBJECT:			32,
		CF_DISABLE_SPU_COLLISION_PROCESSING:	64,
		CF_HAS_CONTACT_STIFFNESS_DAMPING:		128,
		CF_HAS_CUSTOM_DEBUG_RENDERING_COLOR:	256,
		CF_HAS_FRICTION_ANCHOR:					512,
		CF_HAS_COLLISION_SOUND_TRIGGER:			1024 };

	self.ground = null;
	self.blocks = [];

	self.init = function() {
		return window.Ammo().then ( () => {
			Ammo = window.Ammo;
			quatRotate = (new Ammo.btQuaternion ( 0, 0, 0, 1 )).quatRotate;
			return 'ready';
		} );
	};	//	init()

	self.createEmptyDynamicsWorld = function() {
		let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher ( collisionConfiguration );
		broadphase = new Ammo.btSimpleBroadphase ( 1000 );
		let solver = new Ammo.btMultiBodyConstraintSolver();
		world = new Ammo.btMultiBodyDynamicsWorld ( dispatcher,
													broadphase,
													solver,
													collisionConfiguration );
		world.setGravity ( new Ammo.btVector3 ( 0, -9.8, 0 ) );
	};


//	self.createDexterWorld = function ( block ) {
//
//		self.createGround();
//
//		self.createBlock ( block.w, block.h, block.l );
//
//	}	//	createDexterWorld()


	self.createGround = function ( w, l, h ) {

		let extents = new Ammo.btVector3 ( w/2, h/2, l/2 );
		let groundShape = new Ammo.btBoxShape ( extents );

		let groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		let orgn = new Ammo.btVector3 ( 0, -h/2, 0 );
		groundTransform.setOrigin ( orgn );

		let mass = 0;		//	Ground is not dynamic (does not move).
		let inertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );

		/*
		ground = new Ammo.btMultiBody ( 0,
									    mass,
									    inertiaDiag,
									    true,			//	fixed 
									    false );		//	can sleep

		ground.setBaseWorldTransform ( groundTransform );	
		ground.finalizeMultiDof();
		ground.setAngularDamping ( 0.10 );
		ground.setLinearDamping ( 2.00 );
		world.addMultiBody ( ground );
		
		let colsn = new Ammo.btMultiBodyLinkCollider ( ground, -1 );
		colsn.setCollisionShape ( groundShape );

		colsn.setWorldTransform ( groundTransform );

		let collisionFilterGroup = CollisionFilter.StaticFilter;
		let collisionFilterMask  =   CollisionFilter.AllFilter
								   ^ CollisionFilter.StaticFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		ground.setBaseCollider ( colsn );
		*/
		let motionState = new Ammo.btDefaultMotionState();
		motionState.setWorldTransform ( groundTransform );
		ground = new Ammo.btRigidBody ( mass,
										motionState,
										groundShape, 
										inertiaDiag );
		ground.setDamping ( 2.0,	//	linear
							0.1 );	//	angular
		world.addRigidBody ( ground );


		let colsn = new Ammo.btGhostObject();
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( groundShape );
		colsn.setWorldTransform ( groundTransform );
		let collisionFilterGroup = CollisionFilter.StaticFilter;
		let collisionFilterMask  =   CollisionFilter.AllFilter
								   ^ CollisionFilter.StaticFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );


		colliders.push ( { name:	'ground',
						   partOf:	'world',
						   isBlock:	false,
						   exts:	extents,
						   colsn:	colsn } );

		self.ground = ground;

	}	//	createGround()


	self.setBlockColliderWorldTransform = function ( blk ) {
		let posr = blk.block.getCenterOfMassPosition();
		let wtl  = blk.block.getOrientation().inverse();
		let tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		let orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), 
										   wtl.w() );
		tr.setRotation ( orn );
		blk.colsn.setWorldTransform ( tr );
	}	//	setBlockColliderWorldTransform()
	
	self.createBlock = function ( bSim2, name, x, y, z, w, l, h ) {

		let extents = new Ammo.btVector3 ( w/2, h/2, l/2 );
		let blockShape = new Ammo.btBoxShape ( extents );

		let blockTransform = new Ammo.btTransform();
		blockTransform.setIdentity();
		let v = new Ammo.btVector3 ( 1, 1, 1 );
	//	let v = new Ammo.btVector3 ( 0, 0, 1 );
	//	let v = new Ammo.btVector3 ( 0, 1, 0 );
		let q = new Ammo.btQuaternion();
	//	q.setRotation ( v, Math.PI / 10 );
		q.setRotation ( v, Math.PI / 9 );
		blockTransform.setRotation ( q );

		//	Drop from ...
	//	let orgn = new Ammo.btVector3 ( -0.5, 0.5, 0 );
		let orgn = new Ammo.btVector3 ( x, y, z );
		blockTransform.setOrigin ( orgn );

		let mass = 0.1;
		let inertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		blockShape.calculateLocalInertia ( mass, inertiaDiag );

		/*
		let block = new Ammo.btMultiBody ( 0,
										   mass,
										   inertiaDiag,
										   false,			//	fixed 
										   false );			//	can sleep

		block.setBaseWorldTransform ( blockTransform );	
		block.finalizeMultiDof();
		block.setAngularDamping ( 0.10 );
		block.setLinearDamping ( 0.10 );
		world.addMultiBody ( block );

		let colsn = new Ammo.btMultiBodyLinkCollider ( block, -1 );
		colsn.setCollisionShape ( blockShape );
		let posr = block.getBasePos();
		let wtl  = block.getWorldToBaseRot().inverse();
		let tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		let orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), 
										   wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );

		let collisionFilterGroup = CollisionFilter.DefaultFilter;
		let collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		block.setBaseCollider ( colsn );
		*/

		let motionState = new Ammo.btDefaultMotionState();
		motionState.setWorldTransform ( blockTransform );
		let block = new Ammo.btRigidBody ( mass,
										   motionState,
										   blockShape, 
										   inertiaDiag );
		block.setDamping ( 0.1,		//	linear
						   0.1 );	//	angular

		//	Setting lowwer friction helps link6 not being turned on contact.
		//	There is a contactStiffness setting also. ?  In btCollisionObject.
		if ( bSim2 ) {
			block.setFriction ( 0.3 ); }	//	default is 0.5
		else {
			block.setFriction ( 0.1 ); }

		world.addRigidBody ( block );


		let blk = { name:	name,
					block:	block,
					colsn:	null};
		self.blocks.push ( blk );

		block.setUserIndex ( colliders.length );

		colliders.push ( { name:	name,
						   partOf:	'world',
						   isBlock:	true,
						   exts:	extents,
						   body:	block,
						   colsn:	null } );

		/*
		let colsn = new Ammo.btGhostObject();
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( blockShape );
		//	This colsn object and the block are sharing the same space so
		//	that through this "ghost" we can call to see if there is an
		//	overlap of the block and another object. But we don't want any
		//	response from this ghost.
		colsn.setCollisionFlags ( CollisionFlags.CF_NO_CONTACT_RESPONSE );

		let blk = { name:	name,
					block:	block,
					colsn:	colsn };
		self.blocks.push ( blk );
		self.setBlockColliderWorldTransform ( blk );

		let collisionFilterGroup = CollisionFilter.DefaultFilter;
		let collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );

		colliders.push ( { name:	name,
						   partOf:	'world',
						   isBlock:	true,
						   exts:	extents,
						   colsn:	colsn } );
		*/
	}	//	createBlock()


	self.disableContactResponse = function ( name ) {
		const sW = 'dynamics disableContactResponse()';
		let c = colliders.find ( c => c.name === name );
		if ( ! c ) {
			console.error ( sW + ': collider "' + name + '" not found' ); 
			return; }
		if ( c.colsn ) {
			c.colsn.setCollisionFlags ( CollisionFlags.CF_NO_CONTACT_RESPONSE );
			return; }
		if ( c.body ) {
			c.body.setCollisionFlags ( CollisionFlags.CF_NO_CONTACT_RESPONSE );
			return; }
	}	//	disableContactResponse()

	self.enableContactResponse = function ( name ) {
		const sW = 'dynamics enableContactResponse()';
		let c = colliders.find ( c => c.name === name );
		if ( ! c ) {
			console.error ( sW + ': collider "' + name + '" not found' ); 
			return; }
		if ( c.colsn ) {
			c.colsn.setCollisionFlags ( 0 );
			return; }
		if ( c.body ) {
			c.body.setCollisionFlags ( 0 );
			return; }
	}	//	enableContactResponse()
	
	self.positionBlock = function ( name, p, r ) {
		const sW = 'dynamics positionBlock()';
		let c = colliders.find ( c => c.name === name );
		if ( ! c ) {
			console.error ( sW + ': collider "' + name + '" not found' ); 
			return; }
		if ( ! c.body ) {
			console.error ( sW + ': expected block to be a btRigidBody' );
			return; }
	
		let block = c.body;
		let ms = block.getMotionState();
		if ( ms ) {
			Ammo.destroy ( ms ); }

		let blockTransform = new Ammo.btTransform();
		blockTransform.setIdentity();
		let v = new Ammo.btVector3 ( p.x, p.y, p.z );
		let q = new Ammo.btQuaternion ( r.x, r.y, r.z, r.w );
		blockTransform.setRotation ( q );
		blockTransform.setOrigin ( v );

		ms = new Ammo.btDefaultMotionState();
		ms.setWorldTransform ( blockTransform );
		block.setMotionState ( ms );

		let zero = new Ammo.btVector3 ( 0, 0, 0 );
		block.setLinearVelocity ( zero );
		block.setAngularVelocity ( zero );
		Ammo.destroy ( zero );
	}	//	positionBlock()

	self.createMultiBody = function ( config, bSim2 ) {
		const sW = 'dynamics2 createMultiBody()';

	//	numLinks = 6;		//	The moving finger pad is part of the compound
	//						//	shape of link 6.
		numLinks = 7;		//	The moving finger pad is dynamically "fixed".

		multiBody = null;

		//	The base.
		//
		let obj   = config.base.obj;
		let bbDef = config.base.bbDef;
		let baseHalfExtents = new Ammo.btVector3 ( bbDef.w / 2,
												   bbDef.h / 2,
												   bbDef.l / 2 );
		let baseMass = 0;		//	For now the base does not move.
		let baseInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		multiBody = new Ammo.btMultiBody ( numLinks,
										   baseMass,
										   baseInertiaDiag,
										   true,		//	fixed base
										   false );		//	can sleep
		let baseWorldTransform = new Ammo.btTransform();
		baseWorldTransform.setIdentity();
		let p0 = obj.position;
		let o0 = new Ammo.btVector3 ( p0.x, 
									  p0.y + (bbDef.h / 2), 
									  p0.z );
		baseWorldTransform.setOrigin ( o0 );
		multiBody.setBaseWorldTransform ( baseWorldTransform );

		//	The links.
		//	
		//	COM:	Center Of Momentum
		//	https://en.wikipedia.org/wiki/Center-of-momentum_frame
		//
		let parentComToCurrentCom 		= null;
		let currentPivotToCurrentCom	= null;
		let	parentComToCurrentPivot		= null;
		let pop							= null;
		let op							= null;
		let pw2							= null;
		let ph2							= null;
		let pl2							= null;
		let ppwl						= null;
		let pwl							= null;
		let w2							= null;
		let h2							= null;
		let l2							= null;
		let x							= null;
		let y							= null;
		let z							= null;
		let linkHalfExtents				= [];
		let compoundShape				= null;
		let localTransform				= null;
		let shape						= null;
		let linkInertiaDiag				= null;
		let rotParentToCurrent			= null;
		let jointAxis					= null;

		//	Link 1
		//
		obj = config.link1.obj;
		pw2 = config.base.bbDef.w / 2;
		ph2 = config.base.bbDef.h / 2;
		pl2 = config.base.bbDef.l / 2;
		w2  = config.link1.bbDef.w / 2;
		h2  = config.link1.bbDef.h / 2;
		l2  = config.link1.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = 0;
		y = ph2;
		z = 0;
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = 0;
		y = h2;
		z = 0;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[0] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK1_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		jointAxis	 = new Ammo.btVector3 ( 0, 1, 0 );
		multiBody.setupRevolute ( 
			0,							//	Link index.
			DexterSim2.LINK1_MASS,
			linkInertiaDiag,
			0 - 1,						//	Parent index. Yes, -1.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
		//	false );					//	Do not disable parent collision.
			true );						//	Do     disable parent collision.

		//	Link 2
		//
		pop = config.link1.obj.position;
		pw2 = config.link1.bbDef.w / 2;
		ph2 = config.link1.bbDef.h / 2;
		pl2 = config.link1.bbDef.l / 2;
		op  = config.link2.obj.position;
		pwl = config.link2.bbDef.posWrtLink.getPosition();
		w2  = config.link2.bbDef.w / 2;
		h2  = config.link2.bbDef.h / 2;
		l2  = config.link2.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = 0;
		y = (op.y / 10) - ph2;
		z = (op.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = pwl.x / 10;
		y = pwl.y / 10;
		z = pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[1] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK2_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		jointAxis	 = new Ammo.btVector3 ( 0, 0, 1 );
		multiBody.setupRevolute ( 
			1,							//	Link index.
			DexterSim2.LINK2_MASS,
			linkInertiaDiag,
			1 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
		//	false );					//	Do not disable parent collision.
			true );						//	Do     disable parent collision.
	
		//	Link 3
		//
		pop  = config.link2.obj.position;
		ppwl = config.link2.bbDef.posWrtLink.getPosition();
		pw2  = config.link2.bbDef.w / 2;
		ph2  = config.link2.bbDef.h / 2;
		pl2  = config.link2.bbDef.l / 2;
		op   = config.link3.obj.position;
		pwl  = config.link3.bbDef.posWrtLink.getPosition();
		w2   = config.link3.bbDef.w / 2;
		h2   = config.link3.bbDef.h / 2;
		l2   = config.link3.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = 0;
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = pwl.x / 10;
		y = pwl.y / 10;
		z = pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[2] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK3_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		jointAxis	 = new Ammo.btVector3 ( 0, 0, 1 );
		multiBody.setupRevolute ( 
			2,							//	Link index.
			DexterSim2.LINK3_MASS,
			linkInertiaDiag,
			2 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
			false );					//	Do not disable parent collision.

		//	Link 4
		//
		pop  = config.link3.obj.position;
		ppwl = config.link3.bbDef.posWrtLink.getPosition();
		pw2  = config.link3.bbDef.w / 2;
		ph2  = config.link3.bbDef.h / 2;
		pl2  = config.link3.bbDef.l / 2;
		op   = config.link4.obj.position;
		pwl  = config.link4.bbDef.posWrtLink.getPosition();
		w2   = config.link4.bbDef.w / 2;
		h2   = config.link4.bbDef.h / 2;
		l2   = config.link4.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = 0;
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = pwl.x / 10;
		y = pwl.y / 10;
		z = pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[3] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK4_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		jointAxis	 = new Ammo.btVector3 ( 0, 0, 1 );
		multiBody.setupRevolute ( 
			3,							//	Link index.
			DexterSim2.LINK4_MASS,
			linkInertiaDiag,
			3 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
			false );					//	Do not disable parent collision.

		//	Link 5
		//
		pop  = config.link4.obj.position;
		ppwl = config.link4.bbDef.posWrtLink.getPosition();
		pw2  = config.link4.bbDef.w / 2;
		ph2  = config.link4.bbDef.h / 2;
		pl2  = config.link4.bbDef.l / 2;
		op   = config.link5.obj.position;
		pwl  = config.link5.bbDef.posWrtLink.getPosition();
		w2   = config.link5.bbDef.w / 2;
		h2   = config.link5.bbDef.h / 2;
		l2   = config.link5.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = 0;
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = pwl.x / 10;
		y = pwl.y / 10;
		z = pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[4] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK5_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
	//	rotParentToCurrent.setRotation ( new Ammo.btVector3 ( 0, 0, 1 ),
	//									 Math.PI / 2 );
		jointAxis	 = new Ammo.btVector3 (  0, 1, 0 );
	//	jointAxis	 = new Ammo.btVector3 ( -1, 0, 0 );
		multiBody.setupRevolute ( 
			4,							//	Link index.
			DexterSim2.LINK5_MASS,
			linkInertiaDiag,
			4 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
			false );					//	Do not disable parent collision.

		//	Link 6
		//
		pop  = config.link5.obj.position;
		ppwl = config.link5.bbDef.posWrtLink.getPosition();
		pw2  = config.link5.bbDef.w / 2;
		ph2  = config.link5.bbDef.h / 2;
		pl2  = config.link5.bbDef.l / 2;
		op   = config.link6.obj.position;
		pwl  = config.link6.bbDef.posWrtLink.getPosition();
		w2   = config.link6.bbDef.w / 2;
		h2   = config.link6.bbDef.h / 2;
		l2   = config.link6.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = (op.x / 10) - (ppwl.x / 10);
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x = -pwl.x / 10;	//	Signs because of the rotation of this joint's
		y =  pwl.y / 10;	//	coord frame wrt parent's.
		z = -pwl.z / 10;	//
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		//	w and l are swapped because of this joint's coord frame rotation
		//	wrt parent's.
		linkHalfExtents.push ( new Ammo.btVector3 ( l2, h2, w2 ) );

		shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.LINK6_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;

	//	compoundShape = new Ammo.btCompoundShape ( true, 2 );
	//	shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
	//	localTransform = new Ammo.btTransform ( );
	//	localTransform.setIdentity();
	//	compoundShape.addChildShape ( localTransform, shape );
	//	shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
	//	localTransform = new Ammo.btTransform ( );
	//	localTransform.setIdentity();
	//	localTransform.setOrigin ( new Ammo.btVector3 ( config.link6.finger.x, 
	//													0, 0 ) );
	//	compoundShape.addChildShape ( localTransform, shape );
	//	linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
	//	compoundShape.calculateLocalInertia ( DexterSim2.LINK6_MASS,
	//										  linkInertiaDiag );
	//	Ammo.destroy ( compoundShape );
	//	compoundShape = null;

		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		//	Rotate this joint's coord frame wrt parent's.
		rotParentToCurrent.setRotation ( new Ammo.btVector3 ( 0, 1, 0 ), 
										 -Math.PI / 2 );
		jointAxis	 = new Ammo.btVector3 ( 0, 0, -1 );
		multiBody.setupRevolute ( 
			5,							//	Link index.
			DexterSim2.LINK6_MASS,
			linkInertiaDiag,
			5 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
			false );					//	Do not disable parent collision.

		/*	The moving finger pad is part of the compound shape of link 6.
		//	Moving Finger
		//
		pop  = config.link6.obj.position;
		ppwl = config.link6.bbDef.posWrtLink.getPosition();
		pw2  = config.link6.bbDef.w / 2;
		ph2  = config.link6.bbDef.h / 2;
		pl2  = config.link6.bbDef.l / 2;
	//	op   = config.finger.obj.position;
		op   = config.finger.posWrtParent;
		pwl  = config.finger.bbDef.posWrtLink.getPosition();
		w2   = config.finger.bbDef.w / 2;
		h2   = config.finger.bbDef.h / 2;
		l2   = config.finger.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = (op.x / 10) - (ppwl.x / 10);
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x =  pwl.x / 10;
		y =  pwl.y / 10;
		z =  pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( w2, h2, l2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[6] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.FINGER_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		//	Rotate this joint's coord frame wrt parent's.
		rotParentToCurrent.setRotation ( new Ammo.btVector3 ( 0, 1, 0 ), 
										 Math.PI );
		jointAxis	 = new Ammo.btVector3 ( 1, 0, 0 );	//	not a hinge
		multiBody.setupPrismatic ( 
			6,							//	Link index.
			DexterSim2.FINGER_MASS,
			linkInertiaDiag,
			6 - 1,						//	Parent index.
			rotParentToCurrent,
			jointAxis	,
			parentComToCurrentPivot,
			currentPivotToCurrentCom,
			true );					//	Disable parent collision.
		*/

		//	Add the moving finger as a fixed shape?
		//
		pop  = config.link6.obj.position;
		ppwl = config.link6.bbDef.posWrtLink.getPosition();
		pw2  = config.link6.bbDef.w / 2;
		ph2  = config.link6.bbDef.h / 2;
		pl2  = config.link6.bbDef.l / 2;
	//	op   = config.finger.obj.position;
		op   = config.finger.posWrtParent;
		pwl  = config.finger.bbDef.posWrtLink.getPosition();
		w2   = config.finger.bbDef.w / 2;
		h2   = config.finger.bbDef.h / 2;
		l2   = config.finger.bbDef.l / 2;
		//	Vector from parent COM to joint axis in parent's frame.
		x = (op.x / 10) - (ppwl.x / 10);
		y = (op.y / 10) - (ppwl.y / 10);
		z = (op.z / 10) - (ppwl.z / 10);
		parentComToCurrentPivot = new Ammo.btVector3 ( x, y, z );
		//	Vector from joint axis to curent COM in current frame.
		x =  pwl.x / 10;
		y =  pwl.y / 10;
		z =  pwl.z / 10;
		currentPivotToCurrentCom = new Ammo.btVector3 ( x, y, z );
		linkHalfExtents.push ( new Ammo.btVector3 ( l2, h2, w2 ) );
		shape = new Ammo.btBoxShape ( linkHalfExtents[6] );
		linkInertiaDiag = new Ammo.btVector3 ( 0, 0, 0 );
		shape.calculateLocalInertia ( DexterSim2.FINGER_MASS, linkInertiaDiag );
		Ammo.destroy ( shape );
		shape = null;
		rotParentToCurrent = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		//	Rotate this joint's coord frame wrt parent's.
		rotParentToCurrent.setRotation ( new Ammo.btVector3 ( 0, 1, 0 ), 
										 Math.PI );
		multiBody.setupFixed ( 
			6,							//	Link index.
			DexterSim2.FINGER_MASS,
			linkInertiaDiag,
			6 - 1,						//	Parent index.
			rotParentToCurrent,
			parentComToCurrentPivot,
			currentPivotToCurrentCom );

		
		multiBody.finalizeMultiDof();

		world.addMultiBody ( multiBody );

		multiBody.setCanSleep ( false );

		multiBody.setHasSelfCollision ( false );

		multiBody.setUseGyroTerm ( false );

		multiBody.setLinearDamping ( 2.00 );
		multiBody.setAngularDamping ( 1.00 );

		//	Collisions
		//
		let world_to_local	= [];
		let local_origin	= [];
		let colsn			= null;
		let tr				= null;
		let orn				= null;
		let collisionFilterGroup	= null;
		let collisionFilterMask		= null;

		//	Collisions - Base
		//
		//	Again, modeling the base as a box. For now.
		//
		world_to_local.push ( multiBody.getWorldToBaseRot() );
		let o = multiBody.getBasePos();
		local_origin.push ( new Ammo.btVector3 ( o.x(), o.y(), o.z() ) );
		
		shape = new Ammo.btBoxShape ( baseHalfExtents );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, -1 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );

		tr = new Ammo.btTransform();
		tr.setIdentity();
	//	let lo = local_origin[0];
	//	tr.setOrigin ( new Ammo.btVector3 ( lo.x(), lo.y(), lo.z() ) );
		tr.setOrigin ( new Ammo.btVector3 ( 0,
											baseHalfExtents.y(), 
										 	0 ) );	
		orn = new Ammo.btQuaternion ( 0, 0, 0, 1 );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );

		collisionFilterGroup = CollisionFilter.StaticFilter;
		collisionFilterMask  =   CollisionFilter.AllFilter
							   ^ CollisionFilter.StaticFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		multiBody.setBaseCollider ( colsn );
		colliders.push ( { name:	'base',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	baseHalfExtents,
						   colsn:	colsn } );

		for ( let i = 0; i < numLinks; i++ ) {
			let parent = multiBody.getParent ( i );
			let parentToLocalRot = multiBody.getParentToLocalRot ( i );
			let worldToLocal = world_to_local[parent + 1];
			let m = parentToLocalRot.op_mulq ( worldToLocal );
			let w2l = new Ammo.btQuaternion ( m.x(), m.y(), m.z(), m.w() );
			world_to_local.push ( w2l );

			let inv = world_to_local[i + 1].inverse();
			let rv  = multiBody.getRVector ( i );
			let rot = quatRotate ( inv, rv );
			let lo  = local_origin[parent + 1];
		//	let a   = lo.op_add ( rot );
			let a = new Ammo.btVector3 ( lo.x(), lo.y(), lo.z() );
			a.op_add ( rot );
		//	local_origin.push ( a );
			local_origin.push ( new Ammo.btVector3 ( a.x(), a.y(), a.z() ) );
		}	//	for ( numLinks )


		//	Collisions - Links
		//
		let posr = null;
		let wtl  = null;
		let link = null;

		//	Collisions - Link 1
		//	
		posr = local_origin[1];
		wtl  = world_to_local[1];
		shape = new Ammo.btBoxShape ( linkHalfExtents[0] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 0 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 0 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-1',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[0],
						   colsn:	colsn } );
		
		//	Collisions - Link 2
		//	
		posr = local_origin[2];
		wtl  = world_to_local[2];
		shape = new Ammo.btBoxShape ( linkHalfExtents[1] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 1 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 1 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-2',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[1],
						   colsn:	colsn } );

		//	Collisions - Link 3
		//	
		posr = local_origin[3];
		wtl  = world_to_local[3];
		shape = new Ammo.btBoxShape ( linkHalfExtents[2] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 2 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 2 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-3',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[2],
						   colsn:	colsn } );
		
		//	Collisions - Link 4
		//	
		posr = local_origin[4];
		wtl  = world_to_local[4];
		shape = new Ammo.btBoxShape ( linkHalfExtents[3] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 3 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 3 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-4',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[3],
						   colsn:	colsn } );

		//	Collisions - Link 5
		//	
		posr = local_origin[5];
		wtl  = world_to_local[5];
		shape = new Ammo.btBoxShape ( linkHalfExtents[4] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 4 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 4 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-5',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[4],
						   colsn:	colsn } );

		//	Collisions - Link 6
		//	
		posr = local_origin[6];
		wtl  = world_to_local[6];
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 5 );
		colsn.setUserIndex ( colliders.length );

		shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
		shapes.push ( shape );
		colsn.setCollisionShape ( shape );

	//	compoundShape = new Ammo.btCompoundShape ( true, 2 );
	//	shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
	//	localTransform = new Ammo.btTransform ( );
	//	localTransform.setIdentity();
	//	compoundShape.addChildShape ( localTransform, shape );
	//	shape = new Ammo.btBoxShape ( linkHalfExtents[5] );
	//	localTransform = new Ammo.btTransform ( );
	//	localTransform.setIdentity();
	//	localTransform.setOrigin ( new Ammo.btVector3 ( config.link6.finger.x, 
	//													0, 0 ) );
	//	compoundShape.addChildShape ( localTransform, shape );
	//	shapes.push ( compoundShape );
	//	colsn.setCollisionShape ( compoundShape );

		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 5 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'link-6',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[5],
						   colsn:	colsn,
						   shape:	compoundShape } );

		/*	The moving finger pad is part of the compound shape of link 6.
		//	Collisions - Link 7 - Moving Finger
		//	
		posr = local_origin[7];
		wtl  = world_to_local[7];
		shape = new Ammo.btBoxShape ( linkHalfExtents[6] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 6 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 6 );
		link.set_m_collider ( colsn );
		colliders.push ( { name:	'finger',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[6],
						   colsn:	colsn } );
		*/

		//	The moving finger is a fixed link.
		//	
		posr = local_origin[7];
		wtl  = world_to_local[7];
		shape = new Ammo.btBoxShape ( linkHalfExtents[6] );
		shapes.push ( shape );
		colsn = new Ammo.btMultiBodyLinkCollider ( multiBody, 6 );
		colsn.setUserIndex ( colliders.length );
		colsn.setCollisionShape ( shape );
		tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin ( posr );
		orn = new Ammo.btQuaternion ( -wtl.x(), -wtl.y(), -wtl.z(), wtl.w() );
		tr.setRotation ( orn );
		colsn.setWorldTransform ( tr );
		collisionFilterGroup = CollisionFilter.DefaultFilter;
		collisionFilterMask  = CollisionFilter.AllFilter;
		world.addCollisionObject ( colsn, collisionFilterGroup, 
										  collisionFilterMask );
		link = multiBody.getLink ( 6 );
		link.set_m_collider ( colsn );
		ppwl = config.link6.bbDef.posWrtLink.getPosition();
		op   = config.finger.posWrtParent;
		colliders.push ( { name:	'finger',
						   partOf:	'robot',
						   isBlock:	false,
						   exts:	linkHalfExtents[6],
						   colsn:	colsn,
						   x:		(op.x / 10) - (ppwl.x / 10) } );

		if ( ! multiBody ) {
			return null; }

		//	MultiBody tree.
		//
		let id_creator = new Ammo.btMultiBodyTreeCreator();

		if ( -1 === id_creator.createFromBtMultiBody ( multiBody, false ) ) {
			console.error ( sW + ': failed to create creator' ); }
		else {
			inverseModel = id_creator.CreateMultiBodyTree ( id_creator ); }

		//	For stepSimulation2().
		if ( bSim2 ) {
			self.createJointMotors(); }

		return multiBody;

	};	//	createMultiBody()

	self.createJointMotors = function() {
		const sW = 'dynamics2 createJointMotors()';
		if ( ! world ) {
			console.error ( sW + ': call createEmptyDynamicsWorld() before '
							   + 'this' );
			return; }
		if ( ! multiBody ) {
			console.error ( sW + ': call createMultiBody() before this' );
			return; }

		jointMotors = [];

		let i = null, numDofs = multiBody.getNumDofs();

		for ( i = 0; i < numDofs; i++ ) {
			let motor 
				= new Ammo.btMultiBodyJointMotor ( multiBody,
												   i,	//	link index
												   0,	//	dof index
												   0,	//	desired velocity
												   1 );	//	max impulse
			motor.setPositionTarget ( 0, 0 );
			motor.setVelocityTarget ( 0, 1 );
			multiBody.getLink ( i ).m_userPtr = motor.ptr;
			world.addMultiBodyConstraint ( motor );
			motor.finalizeMultiDof();
			jointMotors.push ( motor ); }

	}	//	createJointMotors()

	function getGroundAndBlocks ( ground, blocks ) {
		if ( self.ground ) {
		//	ground.ammoQ = self.ground.getWorldToBaseRot();
		//	ground.ammoP = self.ground.getBasePos(); }
			ground.ammoQ = self.ground.getOrientation();
			ground.ammoP = self.ground.getCenterOfMassPosition(); }
			
		if ( self.blocks ) {
			self.blocks.forEach ( b => {
			//	self.setBlockColliderWorldTransform ( b );
				let o  = b.block.getOrientation();
				let bo = new Ammo.btQuaternion ( o.x(), o.y(), o.z(), o.w() );
				blocks.push ( { name:	b.name,
							//	ammoQ:	b.block.getWorldToBaseRot(),
							//	ammoP:	b.block.getBasePos() } );
								ammoQ:	bo,
								ammoP:	b.block.getCenterOfMassPosition() } );
			} ); }
	}	//	getGroundAndBlocks()

	function setFingerPosition ( pos ) {
		if ( ! multiBody ) {
			return; }
		//	Set the position of the fixed link.
		let c7 = colliders.find ( c => c.name === 'finger' );
		if ( c7 ) {
			let x = c7.x + pos;
			multiBody.getLink ( 6 ).setX ( x ); } 
	}	//	setFingerPosition()

	//	This (including the comments) is pretty much copied from Bullet3's 
	//	InverseDynamicsExample::stepSimulation().
	//
	//	The only major difference from the example is that all the parameters
	//	except deltaTime are of the class instance in the example.
	//
	self.stepSimulation1 = function ( deltaTime,
									  qd,			//	joint target values
									  useInverseModel,
									  jc,			//	joint current values
									  kp, kd,
									  jv,			//	joint velocities
									  jt,			//	joint torques
									  ground,
									  blocks ) {

		const sW  = 'dynamics2 stepSimulation1()';
		let num_dofs	= 0;
		let nu			= null;
		let qdot		= null;
		let q			= null;
		let joint_force	= null;
		let pd_control	= null;
		
		if ( ! multiBody ) {
			jc.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );
			jv.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );
			jt.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 ); }

		if ( multiBody ) {
			num_dofs = multiBody.getNumDofs();
			setFingerPosition ( qd[6] ); 
			
			nu			= new Ammo.vecx ( num_dofs );
			qdot		= new Ammo.vecx ( num_dofs );
			q			= new Ammo.vecx ( num_dofs );
			joint_force	= new Ammo.vecx ( num_dofs );
			pd_control	= new Ammo.vecx ( num_dofs );
			
			//	Compute joint forces from one of two control laws:
			//	
			//	1)	"Computed torque" control, which gives perfect, decoupled,
			//		linear second order error dynamics per dof in case of a
			//		perfect model and (and negligible time discretization 
			//		effects).
			//	
			//	2)	Decoupled PD control per joint, without a model.
			//
			for ( let dof = 0; dof < num_dofs; dof++ ) {
				q.set ( dof, multiBody.getJointPos ( dof ) );
				qdot.set ( dof, multiBody.getJointVel ( dof ) );

			//	const qd_dot = 0;
			//	const qd_ddot = 0;
			//	const qd_dot  = 1.0;
			//	const qd_ddot = 0.1;
				const qd_dot  =  qd[dof] - q.get ( dof );
				const qd_ddot =  qd_dot  - qdot.get ( dof );

				//	pd_control is either desired joint torque for pd control,
				//	or the feedback contribution to nu.
				//
			//	pd_control.set ( dof,   kd * (qd_dot - qdot.get ( dof )) 
			//						  + kp * (qd[dof] - q.get ( dof )) );

				let a =   kd * (qd_dot - qdot.get ( dof )) 
						+ kp * (qd[dof] - q.get ( dof ));
			//	a /= 20;
				pd_control.set ( dof, a );

				//	nu is the desired joint acceleration for computed torque 
				//	control.
				//	
			//	nu.set ( dof,  qd_ddot + pd_control.get ( dof ) );
				a = qd_ddot + pd_control.get ( dof );
			//	if ( Math.abs ( a ) > 10 ) {
			//		a /= 5; }
			//	a /= 10;
			//	if ( dof === 5 ) {
			//		console.log ( sW + ': a ' + a + '  qd_dot ' + qd_dot ); 
			//		a *= (qd_dot * 10); }
				nu.set ( dof,  a );
			}

		//	//	The moving finger collision shape is part of link 6. Update
		//	//	its position.
		//	let c6 = colliders.find ( c => c.name === 'link-6' );
		//	if ( c6 ) {
		//		let lt = new Ammo.btTransform();	//	local transform
		//		lt.setIdentity();
		//		lt.setOrigin ( new Ammo.btVector3 ( qd[6], 0, 0 ) );
		//		c6.shape.updateChildTransform ( 1, lt, true ); }

			nSteps += 1;

			if ( useInverseModel ) {
				//	Calculate joint forces corresponding to desired 
				//	accelerations nu.
				let r = inverseModel.calculateInverseDynamics ( q, qdot, nu, 
																joint_force );
				if ( -1 !== r ) {
				//	let anu = [];
					//	Use inverse model: apply joint force corresponding to
					//	desired acceleration nu.
					for ( let dof = 0; dof < num_dofs; dof++ ) {
						let vel = qdot.get ( dof );
						jv.push ( vel );
						let trq = joint_force.get ( dof );
						jt.push ( trq );
						multiBody.addJointTorque ( dof, trq ); 

				//		anu.push ( nu.get ( dof ) );
					}

				//	console.log ( 'nu: ' + anu );
				}
			}
			else {
				for ( let dof = 0; dof < num_dofs; dof++ )
				{
					//	No model: just apply PD control law.
					multiBody.addJointTorque ( dof, pd_control.get ( dof ) );
				}
				jv.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );		//	for now
				jt.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );		//
			}
		}	//	if ( multiBody )
	
		
		if ( world ) {
			// 	todo(thomas) check that this is correct:
			//	want to advance by 10ms, with 1ms timesteps
		//	world.stepSimulation ( 0.001, 0 );
		//	world.stepSimulation ( 1 / 60, 1 ); }
			world.stepSimulation ( deltaTime, 1 ); }

		if ( multiBody ) {
			multiBody.forwardKinematics();

			for ( let dof = 0; dof < num_dofs; dof++ ) {
				jc.push ( multiBody.getJointPos ( dof ) ); } }

		getGroundAndBlocks ( ground, blocks );
		
		if ( multiBody ) {
			Ammo.destroy ( nu );
			Ammo.destroy ( qdot );
			Ammo.destroy ( q );
			Ammo.destroy ( joint_force );
			Ammo.destroy ( pd_control ); }

	};	//	stepSimulation1()


	self.stepSimulation2 = function ( deltaTime,
									  qd,			//	joint target values
									  jc,			//	joint current values
									  kp, kd,
									  jv,			//	joint velocities
									  jt,			//	joint torques
									  ground,
									  blocks ) {

		let num_dofs = 0;

		if ( ! multiBody ) {
			jc.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );
			jv.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 );
			jt.splice ( 0, 0, 0, 0, 0, 0, 0, 0, 0 ); }

		if ( multiBody ) {
			num_dofs = multiBody.getNumDofs(); 
			setFingerPosition ( qd[6] ); }
			

		if ( jointMotors ) {
			jointMotors.forEach ( ( motor, i ) => {
				let desiredVelocity = 0.1;
				let desiredPosition = qd[i];
				let maxImp = 1000 * deltaTime;
				motor.setVelocityTarget ( desiredVelocity, kd );
				motor.setPositionTarget ( desiredPosition, kp );
				motor.setMaxAppliedImpulse ( maxImp );
			} ); }
			
		if ( world ) {
		//	//	The moving finger collision shape is part of link 6. Update
		//	//	its position.
		//	let c6 = colliders.find ( c => c.name === 'link-6' );
		//	if ( c6 ) {
		//		let lt = new Ammo.btTransform();	//	local transform
		//		lt.setIdentity();
		//		lt.setOrigin ( new Ammo.btVector3 ( qd[6], 0, 0 ) );
		//		c6.shape.updateChildTransform ( 1, lt, true ); }
		
			if ( multiBody ) {
				for ( let dof = 0; dof < num_dofs; dof++ ) {
					let dampingCoefficient = 0.1;
					let damping = -dampingCoefficient 
									* multiBody.getJointVel ( dof );
					multiBody.addJointTorque ( dof, damping ); } }

			world.stepSimulation ( deltaTime, 1 ); }

		if ( multiBody ) {
			for ( let dof = 0; dof < num_dofs; dof++ ) {
				jc.push ( multiBody.getJointPos ( dof ) ); 
				jv.push ( multiBody.getJointVel ( dof ) );
				jt.push ( multiBody.getJointTorque ( dof ) ); } }

		getGroundAndBlocks ( ground, blocks );
		
	}	//	stepSimulation2()


	self.getCollisionObjectPositions = function ( overlappingObjects ) {
		let poses = [];
		colliders.forEach ( col => {
			if ( col.colsn ) {
				let t = col.colsn.getWorldTransform();
				let o = t.getOrigin();
				let q = t.getRotation();
			//	if ( col.name === 'block-a' ) {
			//		q = q.inverse(); }
				poses.push ( { name:	col.name,
							   partOf:	col.partOf,
							   isBlock:	col.isBlock,
							   w:	col.exts.x() * 2,
							   h:	col.exts.y() * 2,
							   l:	col.exts.z() * 2,
							   px:	o.x(),
							   py:	o.y(),
							   pz:	o.z(),
							   qx:	q.getAxis().x(),
							   qy:	q.getAxis().y(),
							   qz:	q.getAxis().z(),
							   qa:	q.getAngle() } );
				if ( (col.name === 'link-6') && col.shape ) {
					let cs = col.shape;						//	compound shape
					let tr = cs.getChildTransform ( 1 );	//	moving finger
					t = t.op_mul ( tr );
					let o = t.getOrigin();
					let q = t.getRotation();
					poses.push ( { name:	'finger',
								   partOf:	col.partOf,
								   isBlock:	col.isBlock,
								   w:	col.exts.x() * 2,
								   h:	col.exts.y() * 2,
								   l:	col.exts.z() * 2,
								   px:	o.x(),
								   py:	o.y(),
								   pz:	o.z(),
								   qx:	q.getAxis().x(),
								   qy:	q.getAxis().y(),
								   qz:	q.getAxis().z(),
								   qa:	q.getAngle() } ); }
				if ( col.partOf === 'world' ) {
					let n = col.colsn.getNumOverlappingObjects();
					if ( n > 0 ) {
						let oo = { name:	col.name,
								   lappers:	[] };
						for ( let i = 0; i < n; i++ ) {
							let co = col.colsn.getOverlappingObject ( i );
							let collider = colliders[co.getUserIndex()];
							oo.lappers.push ( collider.name ); }
						overlappingObjects.push ( oo ); } } }
		} );

	//	if ( broadphase ) {
	//		let pc   = broadphase.getOverlappingPairCache();
	//		let pair = new Ammo.btCollidingPair();
	//		let i = 0;
	//		while ( true ) {
	//			if ( pc.getCollidingPair ( i, pair ) ) {
	//				let oo = { a: pair.idx0 >= 0 ? colliders[pair.idx0]
	//											 : { name: '?' },
	//						   b: pair.idx1 >= 0 ? colliders[pair.idx1]
	//											 : { name: '?' } };
	//				overlappingObjects.push ( oo );
	//				i += 1; }
	//			else {
	//				break; } } }

		if ( dispatcher ) {
			let numManifolds = dispatcher.getNumManifolds();
			for ( let i = 0; i < numManifolds; i++ ) {
				let contactManifold 
					= dispatcher.getManifoldByIndexInternal ( i );
				let numContacts = contactManifold.getNumContacts();
				if ( numContacts < 1 ) {
					continue; }
				//	Collision Objects
				let co0 = contactManifold.getBody0();
				let co1 = contactManifold.getBody1();
				let idx0 = co0.getUserIndex();
				let idx1 = co1.getUserIndex();
				let oo = { a: idx0 >= 0 ? colliders[idx0] : { name: '?' },
						   b: idx1 >= 0 ? colliders[idx1] : { name: '?' },
						   numContacts: numContacts };
				overlappingObjects.push ( oo ); } }

		return poses;
	}	//	getCollisionObjectPositions()

	return self;
} )();


//	dynamics2.js
