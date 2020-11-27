
const dat 			= require ( 'dat.gui' );

const THREE = window.THREE	= require ( 'three' );
require ( 'three/examples/js/loaders/GLTFLoader' );

const OrbitControls	= require ( 'three-orbitcontrols' );

const { dynamics2 }	= require ( './dynamics2' );
const { Dexter }	= require ( './dexter' );

let App = (function() {

	let self = {};

	self.gui			= null;

	self.canvas			= null;
	self.renderer3D		= null;
	self.scene			= null;

	self.fov			= 10;
	self.aspect			= 2;
	self.near			= 0.01;
	self.far			= 100;
	self.camera 		= null;

	self.light			= null;
	self.clock			= null;

	self.orbitControls	= null;
	
	self.bShowingCoordFrames	= false;
	self.coordFrames			= [];

	self.ground 		= null;

	self.blockColor 	= '833';
	self.blocks			= {};

	self.dropBlocksFrom = { x:	-0.5, 
							y:	 0.5, 
							z:	-0.5 };
		
	self.rogueBlockName	= null;
	
	//	Finger Pad Maker
	self.fpm			= { wf: null };		//	WireFrame

	self.runningDeltaTime = [];
	self.averageDeltaTime = 0;

	self.velocityControl2 = {
		J1: { move: [], maxVel:  1.00, acl: 10.00, vel: 0, pos: 0 },
		J2: { move: [], maxVel:  1.00, acl: 10.00, vel: 0, pos: 0 },
		J3: { move: [], maxVel:  1.00, acl: 10.00, vel: 0, pos: 0 },
		J4: { move: [], maxVel:  1.00, acl: 10.00, vel: 0, pos: 0 },
		J5: { move: [], maxVel:  1.00, acl: 10.00, vel: 0, pos: 0 },
		J6: { move: [], maxVel: 10.00, acl: 40.00, vel: 0, pos: 0 } };

	//	If true then use stepSimulation2().
	//	Else stepSimulation1().
	self.bSim2 = true;

	if ( self.bSim2 ) {
		//	For stepSimulation2().
		self.kp =   70;			//	Spring
		self.kd = 1000; }		//	Damping
	else {
		//	For stepSimulation1().
	//	self.kp =  400;			//	Spring
		self.kp =  600;			//	Spring
	//	self.kd =   20;			//	Damping
		self.kd =   60; }		//	Damping
	
	//	These are facters. They are multiplied by each joint's velocity and acceleration.
	self.jointVA = {	
		velocity:		{ value:	1.0,
						  ctrl:		null },
		acceleration:	{ value:	1.0,
						  ctrl:		null } };

	self.jt	= {};			//	Joint Target values.
	self.ee = {};			//	End Effector values.

	//	From where block(s) is/are dropped that Dexter picks up.
	self.abovePickupPoint 	= { x: 0.5, y: 0.1, z: -0.4 };
		
	self.grasping	= null;		//	Set to name of block when is block
								//	is grasped.
	
	//	Script statements.
	self.grab = null;

	self.script = [
		{ j1:  46, j2: -76, j3: -28, j4:  20,  j5:  -4,	j6:  72, v0: 0.2 },
		{ camera: { atX: 0.49, atY: 0.03, atZ: -0.34,
					fmX: 1.12, fmY: 0.62, fmZ:  0.78 } },
		{ j1:  46, j2: -83, j3: -28, j4:  20,  j5:  -4,	j6:  72, v0: 0.2 },

		{ j1:  41, j2: -80, j3: -36, j4:  29,  j5:  -4,	j6:  69, v0: 0.2 },
		{ f: 0.50, v0: 0.2 },
		{ j1:  37, j2: -80, j3: -36, j4:  29,  j5:  -4,	j6:  69, v0: 0.2 },

		{ pause:	500 },
		{ f: 0.43, v0: 0.2 },
		{ pause:	500 },
		{ f: 0.38, v0: 0.2 },
		{ pause:	500 },
		{ f: 0.34, v0: 0.2 },
		{ pause:	500 },
		{ f: 0.30, v0: 0.2 },
	//	Should be contact on both pads. 
	//	Disable collision contact on pads, or/and block.
	//	Attach block to link 6.
	//	...
		{ grab: { blkName: '', numContacts: 1, nAttempts: 10 } },

		//	Move up.
		{ j1:  38, j2: -77, j3: -33, j4:  36,  j5:  -4,	j6:  69, v0: 0.2 },
		{ camera: { atX: 0.11, atY: 0.22, atZ: -0.08,
					fmX: 3.75, fmY: 1.41, fmZ:  1.52 } },
		{ j1:  38, j2: -45, j3:  -90, j4: 45,  j5:  -4,	j6:  69, v0: 0.2 },
		{ j1:  38, j2: -25, j3: -125, j4: 60,  j5:  -4,	j6:  69, v0: 0.2 },
		{ camera: { atX:  0.15, atY: 0.20, atZ: -0.35,
					fmX: -3.13, fmY: 0.67, fmZ: -2.85 } },
		{ j1: 143, j2: -25, j3: -125, j4: 60,  j5:  -4,	j6:  69, v0: 0.2 },
		{ camera: { atX:  0.06, atY: 0.33, atZ: -0.36,
					fmX:  2.52, fmY: 1.67, fmZ: -4.94 } },
		{ j1: 135, j2: -63, j3: -39, j4:  60,  j5:  -4,	j6:  69, v0: 0.2 },
		{ f: 0.43, v0: 0.2 },
		{ release: { } },
		{ pause:	1000 },
		{ f: 0.24, v0: 0.2 },
		{ j1:   0, j2:   0, j3:   0, j4:   0,  j5:   0,	j6:   0, v0: 10.0 },
		{ camera: { atX: -0.05, atY: 0.36, atZ: -0.04,
					fmX:  2.68, fmY: 3.29, fmZ:  5.18 } },
	];

	self.iScript	= 0;		//	Script statement index
	
	//	Velocity Zero Callback. For running "scripts".
	self.v0CB		= null;
	//	Try to average the velocities across multiple frames.
	self.jvMax		= [];

	//	From where block(s) is/are dropped that Dexter picks up.
	self.abovePickupPoint 	= { x: 0.5, y: 0.1, z: -0.4 };
	
	self.grasping	= null;		//	Set to name of block when a block
								//	is grasped.
	
	//	HiRes Dexter
	self.c0c0		= null;

	//	Bounding Boxes
	self.HiResBBs 	= [];
	self.HiResBB	= null;
	self.iHiResBB	= 0;

	self.bCreateStationaryFingerPad	= false;
	self.bGotStationaryFingerPad	= true;
	self.bCreateMovingFingerPad		= false;
	self.bGotMovingFingerPad		= true;
	self.mfpf						= 0.022;	//	Mvg Fgr Pad Fudge

	self.bHiResDynamicsEnabled	= true;
	self.bHiResStepSim			= true;
	self.bCreateHiResDexter		= true;
	self.bHiResMoveEnabled		= true;;

	class ColorGUIHelper {
		constructor(object, prop) {
			this.object = object;
			this.prop = prop; 
		}
		get value() {
			return `#${this.object[this.prop].getHexString()}`;
		}
		set value(hexString) {
			this.object[this.prop].set(hexString);
		}
	}	//	ColorGUIHelper

	class KPKDGUIHelper {
		constructor ( app, v ) {
			this.app = app;
			this.v   = v;
		}
		get k() {
			let v = this.app[this.v];
			return v;
		}
		set k ( v ) {
			this.app[this.v] = v;
		}
	}	//	KPKDGUIHelper()

	class VAGUIHelper {
		constructor ( app, v ) {
			this.app = app;
			this.v   = v;
		}
		get va() {
			let v = this.app.jointVA[this.v].value;
			return v;
		}
		set va ( v ) {
			this.app.jointVA[this.v].value = v;
		}
	}	//	VAGUIHelper()

	class JointGUIHelper {
		constructor ( app, joint ) {
			this.app   = app;
			this.joint = joint;
		//	this.axis  = axis;
		}
		get j() {
			let v = this.app.jt[this.joint].value;
			return v * 180 / Math.PI;
		}
		set j(v) {
			v *= Math.PI / 180;
			this.app.jt[this.joint].value = v;
		}
	}	//	JointGUIHelper()

	class FingerGUIHelper {
		constructor ( app, finger ) {
			this.app	= app;
			this.finger	= finger;
		}
		get f() {
			let v = this.app.ee[this.finger].value;
			return v;
		}
		set f(v) {
			this.app.ee[this.finger].value = v;
		}
	}	//	FingerGUIHelper()

	class FingerPadMakerGUIHelper {
		constructor ( app, param ) {
			this.app   = app;
			this.param = param;
		}
		get p() {
			let v = this.app.fpm[this.param].value;
			return v;
		}
		set p(v) {
			this.app.fpm[this.param].value = v;
		}
	}	//	FingerPadMakerGUIHelper()

	self.makeXYZGUI = function ( parent, vector3, name, onChangeFn ) {
		const folder = parent.addFolder ( name );
		folder.add ( vector3, 'x', -10, 10 )
			.onChange ( onChangeFn );
		folder.add ( vector3, 'y', 0, 10 )
			.onChange ( onChangeFn );
		folder.add ( vector3, 'z', -10, 10 )
			.onChange ( onChangeFn );
	//	folder.open();
	}	//	makeXYZGUI()


	self.create3dScene = function() {
		self.canvas = document.getElementById ( 'd1-canvas' );
		console.log ( self.canvas );

		function updateGui() {
			let oc = self.orbitControls;
			if ( ! oc ) {
				return; }
			if ( self.lookAtXCtrl ) { 
				self.lookAtXCtrl.setValue ( oc.target.x ); }
			if ( self.lookAtYCtrl ) { 
				self.lookAtYCtrl.setValue ( oc.target.y ); }
			if ( self.lookAtZCtrl ) { 
				self.lookAtZCtrl.setValue ( oc.target.getComponent ( 2 ) ); }
			let p = self.camera.position;
			if ( self.lookFmXCtrl ) {
				self.lookFmXCtrl.setValue ( p.x ) ; }
			if ( self.lookFmYCtrl ) {
				self.lookFmYCtrl.setValue ( p.y ) ; }
			if ( self.lookFmZCtrl ) {
				self.lookFmZCtrl.setValue ( p.z ) ; }
		}

		self.renderer3D = new THREE.WebGLRenderer ( { canvas: 	 self.canvas,
													  antialias: true} );
		self.renderer3D.setSize ( self.canvas.clientWidth,
								  self.canvas.clientHeight, false );
		self.renderer3D.shadowMap.enabled = true;	

		self.createCamera();

		self.scene = new THREE.Scene();
		self.scene.background = new THREE.Color ( 'darkgreen' );
		self.scene.onBeforeRender = updateGui;
	}	//	create3dScene()
	
	self.createFloor = function() {
		const loader = new THREE.TextureLoader();
		loader.load ( 'checker.png', texture => {
			const planeSize = 2;
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.magFilter = THREE.NearestFilter;
			const repeats = planeSize * 5;
			texture.repeat.set ( repeats, repeats );

			let a = planeSize;
			const planeGeo = new THREE.PlaneBufferGeometry ( a, a );
			const planeMat = new THREE.MeshPhongMaterial ( { 
											map:	texture,
											side:	THREE.DoubleSide } );
			const mesh = new THREE.Mesh ( planeGeo, planeMat );
			mesh.rotation.x = Math.PI * -.5;
			mesh.receiveShadow = true;
			self.scene.add ( mesh );
		} ); 
	}	//	createFloor()

	self.createCamera = function() {
		self.fov	= 10;
		self.aspect	= 2;  // the canvas default
		self.near	= 0.01;
		self.far	= 100;
		self.camera = new THREE.PerspectiveCamera ( self.fov,  
													self.aspect,  
													self.near,  
													self.far);
		self.camera.position.set ( 2.68, 3.29,  5.18 );

		self.orbitControls = new OrbitControls ( self.camera, self.canvas );

		self.orbitControls.target.set ( -0.05, 0.36, -0.04 ); 

		self.orbitControls.update();

		const folder = self.gui.addFolder ( 'Camera' );
	//	folder.open();
		let target   = self.orbitControls.target;
		let position = self.camera.position;
		self.lookAtX = target.getComponent ( 0 );
		self.lookAtXCtrl = folder.add ( self, 'lookAtX', -5, 5, 0.01 )
			.name ( 'Look At X' ); 
		self.lookAtY = target.getComponent ( 1 );
		self.lookAtYCtrl = folder.add ( self, 'lookAtY', -5, 5, 0.01 )
			.name ( 'Look At Y' ); 
		self.lookAtZ = target.getComponent ( 2 );
		self.lookAtZCtrl = folder.add ( self, 'lookAtZ', -5, 5, 0.01 )
			.name ( 'Look At Z' ); 
		self.lookFmX = position.x;
		self.lookFmXCtrl = folder.add ( self, 'lookFmX', -10, 10, 0.01 )
			.name ( 'Look From X' ); 
		self.lookFmY = position.y;
		self.lookFmYCtrl = folder.add ( self, 'lookFmY', -10, 10, 0.01 )
			.name ( 'Look From Y' ); 
		self.lookFmZ = position.z;
		self.lookFmZCtrl = folder.add ( self, 'lookFmZ', -10, 10, 0.01 )
			.name ( 'Look From Z' ); 
	}	//	createCamera()

	self.createAmbientLight = function() {	
		const color = 0xFFFFFF;
		const intensity = 0.75;
	//	const intensity = 0.35;		//	To see the helpers easier.
	//	const intensity = 0.60;		//	To see the helpers easier.
		const light = new THREE.AmbientLight ( color, intensity );
		self.scene.add ( light ); 

		const folder = self.gui.addFolder ( 'Ambient Light' );
	//	folder.open();
		folder.addColor ( new ColorGUIHelper ( light, 'color' ), 'value' )
			.name ( 'color' );
		folder.add ( light, 'intensity', 0, 2, 0.01 ); 
	}	//	createAmbientLight()

	self.createDirectionalLight = function() {
	 	const color = 0xFFFFFF;
		const intensity = 0.5;
	//	const intensity = 0.35;		//	To see the helpers easier.
		const light = new THREE.DirectionalLight ( color, intensity );
		light.position.set ( 4, 4, 2 );
		light.target.position.set ( 0, 0, 0 );
		light.castShadow = true;
		self.scene.add ( light );
		self.scene.add ( light.target );

		light.shadow.camera.left	= -1.5;
		light.shadow.camera.right	=  1.5;
		light.shadow.camera.top		=  1.5;
		light.shadow.camera.bottom	= -1.5;

		let cameraHelper = null, helper = null;
	//	cameraHelper = new THREE.CameraHelper ( light.shadow.camera );
	//	this.scene.add ( cameraHelper );

	//	helper = new THREE.DirectionalLightHelper ( light );
	//	this.scene.add ( helper );

		function updateCamera() {
			//	Update the light target's matrixWorld because it's needed 
			//	by the helper
			light.target.updateMatrixWorld();
			//	Update the light's shadow camera's projection matrix.
			light.shadow.camera.updateProjectionMatrix();
			//	And now update the camera helper we're using to show the 
			//	light's shadow camera.
			if ( cameraHelper ) {
				cameraHelper.update(); }
		}
		updateCamera();

		class DimensionGUIHelper {
			constructor ( obj, minProp, maxProp ) {
				this.obj = obj;
				this.minProp = minProp;
				this.maxProp = maxProp;
			}
			get value() {
				return this.obj[this.maxProp] * 2;
			}
			set value(v) {
				this.obj[this.maxProp] = v /  2;
				this.obj[this.minProp] = v / -2;
			}
		}

		class MinMaxGUIHelper {
			constructor ( obj, minProp, maxProp, minDif ) {
				this.obj = obj;
				this.minProp = minProp;
				this.maxProp = maxProp;
				this.minDif = minDif;
			}
			get min() {
				return this.obj[this.minProp];
			}
			set min(v) {
				this.obj[this.minProp] = v;
				this.obj[this.maxProp] = Math.max ( this.obj[this.maxProp], 
													v + this.minDif );
			}
			get max() {
				return this.obj[this.maxProp];
			}
			set max(v) {
				this.obj[this.maxProp] = v;
				this.min = this.min;  // self will call the min setter
			}
		}

		const folder = self.gui.addFolder ( 'Dirctional Light' );
	//	folder.open();
		folder.addColor ( new ColorGUIHelper ( light, 'color' ), 'value' )
			.name ( 'color' );
		folder.add ( light, 'intensity', 0, 2, 0.01 ); 

		self.makeXYZGUI ( folder, 
						 light.position, 'position', updateCamera );
		self.makeXYZGUI ( folder, 
						 light.target.position, 'target', updateCamera );
	
		//	subfolder
		const sf = folder.addFolder ( 'Shadow Camera' );
	//	sf.open();
		sf.add ( new DimensionGUIHelper ( light.shadow.camera, 'left', 
															   'right'), 
				 'value', 0.5, 10 )
			.name ( 'width' )
			.onChange ( updateCamera );
		sf.add ( new DimensionGUIHelper ( light.shadow.camera, 'bottom', 
															   'top'), 
				 'value', 0.5, 10 )
			.name ( 'height' )
			.onChange ( updateCamera );
		const minMaxGUIHelper = new MinMaxGUIHelper ( light.shadow.camera, 
													  'near', 'far', 0.1 );
		sf.add ( minMaxGUIHelper, 'min', 0.1, 50, 0.1 )
			.name ( 'near')
			.onChange ( updateCamera );
		sf.add ( minMaxGUIHelper, 'max', 0.1, 50, 0.1 )
			.name ( 'far')
			.onChange ( updateCamera );
		sf.add ( light.shadow.camera, 'zoom', 0.01, 1.5, 0.01 )
			.onChange ( updateCamera );
	}	//	createDirectionalLight()

	self.createFingerPadControls = function() {
		let folder = this.gui.addFolder ( 'Create Finger Pad' );
		folder.close();
		let fpmGUIHelper = null;
		let ctrl = null;

		function change ( v ) {
			let o = this.object;
			console.log ( 'FPM ' + o.param + ' ' + v );
			let fpm = o.app.fpm;
			if ( ! fpm.wf ) {
				return; }
			if ( o.param === 'x' || o.param === 'y' || o.param === 'z' ) {
				fpm.wf.position[o.param] = v; }
			if ( o.param === 'w' || o.param === 'h' || o.param === 'l' ) {
				let parent = fpm.wf.parent;
				parent.remove ( fpm.wf );
				fpm.wf = null;
				let def = { x: fpm.x.value, y: fpm.y.value, z: fpm.z.value,
							w: fpm.w.value, h: fpm.h.value, l: fpm.l.value };
				self.createFingerPad ( parent, def );
			} 
		}	//	change()

		self.fpm['x'] = { param:	'x', value: 0, ctrl: null };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'x' );
		ctrl = folder.add ( fpmGUIHelper, 'p', -1, 1, 0.01 ).name ( 'X' );
		self.fpm['x'].ctrl = ctrl;
		ctrl.onChange ( change );

		self.fpm['y'] = { param:	'y', value: 0 };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'y' );
		ctrl = folder.add ( fpmGUIHelper, 'p', -1, 1, 0.01 ).name ( 'Y' );
		self.fpm['y'].ctrl = ctrl;
		ctrl.onChange ( change );

		self.fpm['z'] = { param:	'z', value: 0 };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'z' );
		ctrl = folder.add ( fpmGUIHelper, 'p', -1, 1, 0.01 ).name ( 'Z' );
		self.fpm['z'].ctrl = ctrl;
		ctrl.onChange ( change );

		self.fpm['w'] = { param:	'w', value: 0.01 };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'w' );
		ctrl = folder.add ( fpmGUIHelper, 'p', 0, 0.02, 0.001 )
					 .name ( 'Width' );
		self.fpm['w'].ctrl = ctrl;
		ctrl.onChange ( change );

		self.fpm['h'] = { param:	'h', value: 0.03 };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'h' );
		ctrl = folder.add ( fpmGUIHelper, 'p', 0, 0.04, 0.001 )
					 .name ( 'Height' );
		self.fpm['h'].ctrl = ctrl;
		ctrl.onChange ( change );

		self.fpm['l'] = { param:	'l', value: 0.08 };
		fpmGUIHelper = new FingerPadMakerGUIHelper ( self, 'l' );
		ctrl = folder.add ( fpmGUIHelper, 'p', 0, 0.10, 0.001 )
					 .name ( 'Length' );
		self.fpm['l'].ctrl = ctrl;
		ctrl.onChange ( change );
	}	//	createFingerPadControls()

	self.createKpKdControls = function() {
		//	kp, kd
		let kpkdGUIHelper = null;
		let folder = self.gui.addFolder ( 'Kp, Kd' );
		folder.open();
		kpkdGUIHelper = new KPKDGUIHelper ( self, 'kp' );
		folder.add ( kpkdGUIHelper, 'k', 0, 1000, 1 ).name ( 'Kp' );
		kpkdGUIHelper = new KPKDGUIHelper ( self, 'kd' );
		folder.add ( kpkdGUIHelper, 'k', 0, 2000,  1 ).name ( 'Kd' );
	}	//	createKpKdControls()

	self.createJointVelocityAccelerationControls = function() {
		const sW = 'App createJointVelocityAccelerationControls()';
		let folder = self.gui.addFolder ( 'Joint Velocity, Acceleration' );
		folder.open();
		let vaGUIHelper = null;
		let ctrl = null;

		vaGUIHelper = new VAGUIHelper ( self, 'velocity' );
		ctrl = folder.add ( vaGUIHelper, 'va', 0.1, 10, 0.1 ).name ( 'Velocity' );
		self.jointVA['velocity'].ctrl = ctrl;


		vaGUIHelper = new VAGUIHelper ( self, 'acceleration' );
		ctrl = folder.add ( vaGUIHelper, 'va', 0.1, 10, 0.1 ).name ( 'Acceleration' );
		self.jointVA['acceleration'].ctrl = ctrl;

	}	//	createJointVelocityAccelerationControls()
		
	self.createJointControls = function() {
		const sW = 'App createJointControls()';
		let folder = self.gui.addFolder ( 'Joint Targets' );
		folder.open();
		let jointGUIHelper = null;
		let ctrl = null;

		function updateTarget ( v ) {
			const sW2 = sW + ' updateTarget(): ' + this.object.joint
										  + '  ' + JSON.stringify ( v );
		//	let vc = self.velocityControl[this.object.joint];
		//	vc.target = v * Math.PI / 180;
			let vc = self.velocityControl2[this.object.joint];
			if ( vc.move.length === 0 ) {
				console.log ( sW2 + ': stop false' );
				vc.move.push ( { tgtPos:	v * Math.PI / 180,
								 pos:		vc.pos,
								 stop:		false } ); }
			else {
				console.log ( sW2 + ': stop true' );
				let mv = vc.move[0];
				mv.stop = true; }
		}	//	updateTarget()

		self.jt['J1'] = { axis:	'y', value: 0, ctrl: null };
		jointGUIHelper = new JointGUIHelper ( self, 'J1' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J1' )
				.onChange ( updateTarget );
		self.jt['J1'].ctrl = ctrl;

		self.jt['J2'] = { axis:	'z', value: 0 };
		jointGUIHelper = new JointGUIHelper ( self, 'J2' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J2' )
				.onChange ( updateTarget );
		self.jt['J2'].ctrl = ctrl;

		self.jt['J3'] = { axis:	'z', value: 0 };
		jointGUIHelper = new JointGUIHelper ( self, 'J3' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J3' )
				.onChange ( updateTarget );
		self.jt['J3'].ctrl = ctrl;

		self.jt['J4'] = { axis:	'z', value: 0 };
		jointGUIHelper = new JointGUIHelper ( self, 'J4' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J4' )
				.onChange ( updateTarget );
		self.jt['J4'].ctrl = ctrl;

		self.jt['J5'] = { axis:	'y', value: 0 };
		jointGUIHelper = new JointGUIHelper ( self, 'J5' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J5' )
				.onChange ( updateTarget );
		self.jt['J5'].ctrl = ctrl;

		self.jt['J6'] = { axis:	'z', value: 0 };
		jointGUIHelper = new JointGUIHelper ( self, 'J6' );
		ctrl = folder.add ( jointGUIHelper, 'j', -180, 180, 1 ).name ( 'J6' )
				.onChange ( updateTarget );
		self.jt['J6'].ctrl = ctrl;
	}	//	createJointControls()
	
	self.createEndEffectorControls = function() {
		let folder = self.gui.addFolder ( 'End Effector' );
		folder.open();
		let fingerGUIHelper = null;
		let ctrl = null;

		self.ee['Finger'] = { axis:	'x', value: 0.24, ctrl: null };
		fingerGUIHelper = new FingerGUIHelper ( self, 'Finger' );
		ctrl = folder.add ( fingerGUIHelper, 'f', 0, 0.5, 0.01 )
					 .name ( 'Finger' );
		self.ee['Finger'].ctrl = ctrl;
	}	//	createEndEffectorControls()


	self.resizeRendererToDisplaySize = function() {
		let h = self.canvas.parentElement.clientHeight;
		self.canvas.style.height = h + 'px';

		const pixelRatio = window.devicePixelRatio;
	//	const pixelRatio = 1;

		const width  = self.canvas.clientWidth  * pixelRatio | 0;
		const height = self.canvas.clientHeight * pixelRatio | 0;
		
		const needResize =    self.canvas.width  !== width 
						   || self.canvas.height !== height;

		if ( needResize ) {
			self.renderer3D.setSize ( width, height, false ); 
			self.camera.aspect =   self.canvas.clientWidth 
								 / self.canvas.clientHeight;
			self.camera.updateProjectionMatrix(); }
	}	//	resizeRendererToDisplaySize()

	self.createCoordFrame = function ( parent, scale, opacity, bWireframe, depthTest ) {
		let obj = new THREE.Object3D();
		let radCyl = 0.02;
		let lenCyl = 1.0;
		let radCon = radCyl * 2.0;
		let hgtCon = radCyl * 3.0;
		let mtxScale = new THREE.Matrix4();
		mtxScale.makeScale ( scale, scale, scale );

		opacity		= (typeof opacity    === 'number')   ? opacity 
													     : 0;
		bWireframe	= (typeof bWireframe === 'boolean') && bWireframe;

		depthTest	= (typeof depthTest  === 'boolean') && depthTest;

		function arrow ( name, color, mtxCyl, mtxCon ) {
			let geo = null, mat = null, cylinder = null, cone = null;
			geo = new THREE.CylinderGeometry ( radCyl,		//	radiusTop
											   radCyl,		//	radiusBottom
											   lenCyl,		//	height
									bWireframe ? 4 : 8 );	//	radialSegments
			if ( bWireframe ) {
				const lines	= self.createWireframe ( geo );
				let mat = lines.material;
				mat.color = new THREE.Color ( color );
				if ( opacity ) {
					mat.depthTest	= depthTest;
					mat.opacity		= opacity;
					mat.transparent	= true; }
				lines.applyMatrix ( mtxCyl.multiply ( mtxScale ) );
				lines.name = 'Coord_Frame_' + name + '_Cylinder';
			//	parent.add ( lines ); }
				obj.add ( lines ); }
			else {
				mat = new THREE.MeshPhongMaterial ( { color: color } );
				if ( opacity ) {
					mat.depthTest	= depthTest;
					mat.opacity		= opacity;
					mat.transparent	= true; }
				cylinder = new THREE.Mesh ( geo, mat );
				cylinder.name = 'Coord_Frame_' + name + '_Cylinder';
				cylinder.applyMatrix ( mtxCyl.multiply ( mtxScale ) );
			//	parent.add ( cylinder ); }
				obj.add ( cylinder ); }

			geo    = new THREE.ConeGeometry ( radCon,		//	base radius
											  hgtCon,		//	height
									bWireframe ? 4 : 8 );	//	radialSegments
			if ( bWireframe ) {
				const lines	= self.createWireframe ( geo );
				let mat = lines.material;
				mat.color = new THREE.Color ( color );
				if ( opacity ) {
					mat.depthTest	= depthTest;
					mat.opacity		= opacity;
					mat.transparent	= true; }
				lines.applyMatrix ( mtxCon.multiply ( mtxScale ) );
				lines.applyMatrix ( mtxCon.multiply ( mtxScale ) );
			//	parent.add ( lines ); }
				obj.add ( lines ); }
			else {
				cone   = new THREE.Mesh ( geo, mat );
				cylinder.name = 'Coord_Frame_' + name + '_Cone';
				cone.applyMatrix ( mtxCon.multiply ( mtxScale ) );
			//	parent.add ( cone ); } }
				obj.add ( cone ); } }

		let vec = null, mtxCyl = null, mtxCon = null;

		mtxCyl = new THREE.Matrix4();
		mtxCyl.makeRotationZ ( -Math.PI / 2 );
		vec = new THREE.Vector3 ( lenCyl / 2, 0, 0 );
		mtxCyl.setPosition ( vec.multiplyScalar ( scale ) );
		mtxCon = new THREE.Matrix4();
		mtxCon.makeRotationZ ( -Math.PI / 2 );
		vec = new THREE.Vector3 ( lenCyl + (hgtCon / 2), 0, 0 );
		mtxCon.setPosition ( vec.multiplyScalar ( scale ) );
		arrow ( 'X', 0xFF0000, mtxCyl, mtxCon );
			
		mtxCyl = new THREE.Matrix4();
		vec = new THREE.Vector3 ( 0, lenCyl / 2, 0 );
		mtxCyl.setPosition ( vec.multiplyScalar ( scale ) );
		mtxCon = new THREE.Matrix4();
		vec = new THREE.Vector3 ( 0, lenCyl + (hgtCon / 2), 0 );
		mtxCon.setPosition ( vec.multiplyScalar ( scale ) );
		arrow ( 'Y', 0x00FF00, mtxCyl, mtxCon );
		
		mtxCyl = new THREE.Matrix4();
		mtxCyl.makeRotationX ( Math.PI / 2 );
		vec = new THREE.Vector3 ( 0, 0, lenCyl / 2 );
		mtxCyl.setPosition ( vec.multiplyScalar ( scale ) );
		mtxCon = new THREE.Matrix4();
		mtxCon.makeRotationX ( Math.PI / 2 );
		vec = new THREE.Vector3 ( 0, 0, lenCyl + (hgtCon / 2) );
		mtxCon.setPosition ( vec.multiplyScalar ( scale ) );
		arrow ( 'Z', 0x0000FF, mtxCyl, mtxCon );

		obj.visible = self.bShowingCoordFrames;
		parent.add ( obj );
		self.coordFrames.push ( obj );
		return obj;
	}	//	createCoordFrame()

	self.createGround = function ( parent ) {
		let w = 2, l = 2, h = 1;
		dynamics2.createGround ( w, l, h );
		const geo = new THREE.BoxGeometry ( w, h, l ); 
		const mat = new THREE.MeshPhongMaterial ( { color: '#8AC' } );
		let ground = new THREE.Mesh ( geo, mat );
			ground.castShadow = false;
			ground.position.y = -2.01;
			ground.visible = false;		//	For now. Use the checker board.
		parent.add ( ground );
		return ground;
	}	//	createGround()

	self.createAndDropBlock = function ( parent, dropFrom ) {
		let i = Object.keys ( self.blocks ).length;
		//	Name 'block-a', 'block-b', 'block-c', ...
		let name = 'block-' + String.fromCharCode ( 'a'.charCodeAt ( 0 ) + i );
		//	Cycle the colors red, green, blue, red, green, ...
		self.blockColor = self.blockColor.slice ( 1 ) + self.blockColor.slice ( 0, 1 );
	//	let block = self.createBlock ( name, parent, 0.04, 0.04, 0.04, 
		let block = self.createBlock ( name, parent, 0.03, 0.03, 0.03, 
									   '#' + self.blockColor, 
									   dropFrom );
		self.blocks[name] = block;
		return name;
	}	//	createAndDropBlock()

	self.createBlocks = function ( parent ) {
		let numBlocks = 23, iBlock = 0;
		//	Drop the one Dexter will grab first.
		self.rogueBlockName = self.createAndDropBlock ( parent, self.abovePickupPoint  );
		iBlock += 1;
		//	Now, the rest.
		function next() {
			if ( iBlock >= numBlocks ) {
				return; }
			self.createAndDropBlock ( parent, self.dropBlocksFrom );
			iBlock += 1;
			window.setTimeout ( next, 100 ); }
		next();
	}	//	createBlocks()

	self.createBlock = function ( name, parent, w, l, h, color, dropFrom ) {
		let p = dropFrom ? dropFrom : self.dropBlocksFrom;
		dynamics2.createBlock ( self.bSim2, name, p.x, p.y, p.z, w, l, h ); 
		const geo = new THREE.BoxGeometry ( w, h, l );
		const mat = new THREE.MeshPhongMaterial ( 
			{ color: (typeof color === 'string') ? color: '#683' } );
		let block = new THREE.Mesh ( geo, mat );
			block.castShadow = true;
		parent.add ( block );
		self.blocks[name] = block;
		return block;
	}	//	createBlock()

	self.chainLink = function ( i ) {
		//	The  previous link (base if i is 0).
		let linkPrv = self.c0c0.children[i-1];
		let Lprv = new THREE.Matrix4();
		Lprv.copy ( linkPrv.matrix );

		let nLprv = new THREE.Matrix4();
		nLprv.getInverse ( Lprv );

		//	The link's position WRT base.
		let link = self.c0c0.children[i];
		let B = new THREE.Matrix4();
		B.copy ( link.matrix );

		//	The link's position WRT the previous link.
		let L = nLprv.multiply ( B );

		//	Remove the link from the current object tree.
		self.c0c0.children.splice ( i, 1 );

		//	Add it as a child to the previous link.
		link.matrix.identity();
		linkPrv.add ( link );

		//	Set it's position.
		let p = new THREE.Vector3();
		let q = new THREE.Quaternion();
		let s = new THREE.Vector3();
		L.decompose ( p, q, s );
		link.position.set ( p.x, p.y, p.z );
		link.setRotationFromQuaternion ( q );
		return link;
	}	//	chainLink()

	self.castShadow = function ( obj ) {
		if ( ! obj ) {
			return; }
		if ( obj.constructor.name === 'Mesh' ) {
			obj.castShadow = true; }
		if ( ! Array.isArray ( obj.children ) ) {
			return; }
		obj.children.forEach ( c => self.castShadow ( c ) );
	}	//	castShadow()

	self.gatherBoundingBoxes = function ( iLink, link ) {
		const sW = 'App gatherBoundingBoxes()';
		self.HiResBBs[iLink] = { link: 	link,
								 bbs:	[] };
		let a = self.HiResBBs[iLink].bbs;
		function cBB ( obj, mesh ) {
			a.push ( { obj:		obj,
					   mesh:	mesh,
					   helper:	null } );
			if ( obj ) {
				obj.children.forEach ( c => {
					if ( c.constructor.name === 'Object3D' ) {
						cBB ( c, null ); }
					if ( c.constructor.name === 'Mesh' ) {
						cBB ( null, c ); } } ); }

			if ( mesh ) {
				mesh.children.forEach ( c => {
					if ( c.constructor.name === 'Object3D' ) {
						cBB ( c, null ); }
					if ( c.constructor.name === 'Mesh' ) {
						cBB ( null, c ); } } ); }
		}
		cBB ( link, null );
		console.log ( 'a.length ' + a.length );
	}	//	gatherBoundingBoxes()

	self.defineBoundingBox = function ( iLink, link, bbObjName ) {
		const sW = 'App defineBoundingBox()';
		let a = self.HiResBBs[iLink].bbs;
		if ( ! Array.isArray ( a ) ) {
			return; }
		let o = a.find ( o => o.obj && o.obj.name === bbObjName );
		if ( ! o ) {
			return; }
		let linkObjForBB = o.obj;
		let bbox  = new THREE.Box3().setFromObject ( linkObjForBB );
		let helper = new THREE.Box3Helper ( bbox, 0 );
			helper.updateMatrixWorld ( true );
		let Lw = link.matrixWorld;			//	link wrt world
		let BBw = helper.matrixWorld;		//	box wrt world

		let nLw = new THREE.Matrix4();
			nLw.getInverse ( Lw );

		let BBl = nLw.multiply ( BBw );		//	box wrt link

		//	Create a wireframe to represent the bounding box.
		let bbSize = new THREE.Vector3();
		bbox.getSize ( bbSize );
		console.log ( sW + ': bbSize ' + bbSize.x
						 + '  ' + bbSize.y
						 + '  ' + bbSize.z );

		return { posWrtLink:	BBl,
				 w:				bbSize.x,
				 h:				bbSize.y,
				 l:				bbSize.z};
	}	//	defineBoundingBox()

	self.attachFingerPad = function ( finger, padName, def ) {
		let obj = new THREE.Object3D();
		obj.name = padName;
		const color	= new THREE.Color ( 0.2, 0.2, 0.9 );	//	blue?
		const geo	= new THREE.BoxGeometry ( def.w, def.h, def.l );
		const mat	= new THREE.MeshPhongMaterial ( { color: color } );
		mat.opacity		= 0.6;
		mat.transparent	= true;
		let pad = new THREE.Mesh ( geo, mat );
		pad.name = padName;
		pad.scale.set ( 10, 10, 10 );		//	Note scale.

		obj.add ( pad );			//	Bounding box works better on Object3D.
		finger.add ( obj );

		obj.position.set ( def.x, def.y, def.z );
		return obj;
	}	//	attachFingerPad()

	self.getLinks = function ( grp ) {
		const sW = 'App getLinks()';
		let c0    = grp.children[0];
		self.c0c0  = c0.children[0];
		
		Dexter.HiRes.base = self.c0c0.children[0];

		Dexter.HiRes.link7 = self.chainLink ( 7 );
		Dexter.HiRes.link6 = self.chainLink ( 6 );
		Dexter.HiRes.link5 = self.chainLink ( 5 );
		Dexter.HiRes.link4 = self.chainLink ( 4 );
		Dexter.HiRes.link3 = self.chainLink ( 3 );
		Dexter.HiRes.link2 = self.chainLink ( 2 );
		Dexter.HiRes.link1 = self.chainLink ( 1 );

		//	Link 7 position.x will open/close the gripper (move the finger).
		//	x = -0.5		appears to be fully open
		//	x =  0.02		fully closed
		let l7 = Dexter.HiRes.link7;
		
		//	Likewise finger positon.x. However the sign is changed and the
		//	values are slightly different. Since 0 here is fully closed this
		//	finger object is used in this app.
		//	x = 0.5		appears to be fully open
		//	x = 0.0		fully closed
		Dexter.HiRes.finger = l7.children[0].children[0].children[0];

		//	Dexter configuration, bounding box definition.
		let config = {}, bbDef = null, def = null;
		
		//	Bounding boxes.
		//	All bounding boxes from the link and its children.
		
		self.castShadow ( Dexter.HiRes.base );
	
		self.createCoordFrame ( Dexter.HiRes.base, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 0, Dexter.HiRes.base );
		//	Default bounding box for the link.
		bbDef = self.defineBoundingBox ( 0, Dexter.HiRes.base, 
								 'DexterHDI_Link1_KinematicAssembly_v1' );
		config.base = { obj:	Dexter.HiRes.base,
						bbDef:	bbDef };

		self.createCoordFrame ( Dexter.HiRes.link1, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 1, Dexter.HiRes.link1 );
		bbDef = self.defineBoundingBox ( 1, Dexter.HiRes.link1, 
								 'HDI-210-001_MainPivot_v461' );
		config.link1 = { obj:	Dexter.HiRes.link1,
						 bbDef:	bbDef };

		self.createCoordFrame ( Dexter.HiRes.link2, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 2, Dexter.HiRes.link2 );
		bbDef = self.defineBoundingBox ( 2, Dexter.HiRes.link2, 
								 'DexterHDI_Link2_KinematicAssembly_v5' );
		config.link2 = { obj:	Dexter.HiRes.link2,
						 bbDef:	bbDef };

		self.createCoordFrame ( Dexter.HiRes.link3, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 3, Dexter.HiRes.link3 );
		bbDef = self.defineBoundingBox ( 3, Dexter.HiRes.link3, 
								 'HDI_L3Skins_v541' );
		config.link3 = { obj:	Dexter.HiRes.link3,
						 bbDef:	bbDef };

		self.createCoordFrame ( Dexter.HiRes.link4, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 4, Dexter.HiRes.link4 );
		bbDef = self.defineBoundingBox ( 4, Dexter.HiRes.link4, 
								 'HDI_DiffSkins_v371' );
		config.link4 = { obj:	Dexter.HiRes.link4,
						 bbDef:	bbDef };

		self.createCoordFrame ( Dexter.HiRes.link5, 0.50, 0.8, false );
		self.gatherBoundingBoxes ( 5, Dexter.HiRes.link5 );
		bbDef = self.defineBoundingBox ( 5, Dexter.HiRes.link5, 
							//	 'HDI-950-000_GripperCover_v91' );
								 'DexterHDI_Link5_KinematicAssembly_v2' );
		config.link5 = { obj:	Dexter.HiRes.link5,
						 bbDef:	bbDef };

		//	Link 6
		//
		if ( self.bGotStationaryFingerPad ) {
			//	Attach finger pads.
			//	These numbers were determined previously with the Finger Pad 
			//	controls and the createFingerPad() calls below.
			//	The stationary finger -
			def = { x:	 0.01,
					y:	 0.00,
					z:	-0.65,
					w:	 0.005,
					h:	 0.026,
					l:	 0.060 };
			self.attachFingerPad ( Dexter.HiRes.link6, 
								   'Stationary_Finger_Pad', def ); }
		self.gatherBoundingBoxes ( 6, Dexter.HiRes.link6 );
		self.createCoordFrame ( Dexter.HiRes.link6, 0.50, 0.8, false );
		if ( self.bCreateStationaryFingerPad ) {
			//	Finger pad for stationary finger.
			def = { x: self.fpm.x.value,
					y: self.fpm.y.value,
					z: self.fpm.z.value,
					w: self.fpm.w.value, 
					h: self.fpm.h.value,
					l: self.fpm.l.value };
			self.createFingerPad ( Dexter.HiRes.link6, def ); }
		if ( self.bGotStationaryFingerPad ) {
			bbDef = self.defineBoundingBox ( 6, Dexter.HiRes.link6, 
								 	 'Stationary_Finger_Pad' ); }
		else {
			bbDef = self.defineBoundingBox ( 6, Dexter.HiRes.link6, 
									 'CenterGripper_v11' ); }
		config.link6 = { obj:	Dexter.HiRes.link6,
						 bbDef:	bbDef,
					finger: { x: (self.ee.Finger.value + self.mfpf) / 10 } };

		//	Moving Finger
		//
		if ( self.bGotMovingFingerPad ) {
			def = { x:	-0.17, 
					y:	-0.03,
					z:	 0.36,
					w:	 0.005,
					h:	 0.026,
					l:	 0.060 };
			self.attachFingerPad ( Dexter.HiRes.finger, 
								   'Moving_Finger_Pad', def ); }
		//	Try self. Note that Dexter.HiRes.finger is set above.
		self.gatherBoundingBoxes ( 7, Dexter.HiRes.finger );
		self.createCoordFrame ( Dexter.HiRes.finger, 0.40, 0.8, false );
		if ( self.bCreateMovingFingerPad ) {
			def = { x: self.fpm.x.value,
					y: self.fpm.y.value,
					z: self.fpm.z.value,
					w: self.fpm.w.value, 
					h: self.fpm.h.value,
					l: self.fpm.l.value };
			self.createFingerPad ( Dexter.HiRes.finger, def ); }
		if ( self.bGotMovingFingerPad ) {
			bbDef = self.defineBoundingBox ( 7, Dexter.HiRes.finger, 
							'Moving_Finger_Pad' ); }
		else {
			bbDef = self.defineBoundingBox ( 7, Dexter.HiRes.finger, 
							'TI1-420-002_ParallelGripperDynamicFinger_v2' ); }
		Dexter.HiRes.finger.position.x = self.ee.Finger.value;
		//	The finger is not a direct child of link6. So ...
		let L6w = Dexter.HiRes.link6.matrixWorld;	//	link6 wrt world
		let Fw = Dexter.HiRes.finger.matrixWorld;	//	finger wrt world
		let nL6w = new THREE.Matrix4();
			nL6w.getInverse ( L6w );
		let Fl6 = nL6w.multiply ( Fw );		//	finger wrt link6
		config.finger = { obj:		Dexter.HiRes.finger,
						  posWrtParent:	Fl6.getPosition(),
						  bbDef:	bbDef };

		dynamics2.createMultiBody ( config, self.bSim2 ); 

	}	//	getLinks()

	self.importDexterFromGltf = function() {
		const sW = 'App importDexterFromGltf()';
		const gltfLoader = new THREE.GLTFLoader();
		const url = 'HDIMeterModel.gltf';
		gltfLoader.load ( url, ( gltf ) => {
			const root = gltf.scene;
			console.log ( sW + ': Done? ' );

			let c0 = root.children[0]
			c0.scale.set ( 0.001, 0.001, 0.001 );
			c0.children.splice ( 1 );	//	Remove imported lights, cameras.

			
			//	Before setting the links render the scene to set the object matrices.	
			self.scene.add ( root );
			self.renderer3D.render ( self.scene, self.camera ); 

			//	Define dexter for dynamics.
			self.getLinks ( root );
		} );
	}	//	importDexterFromGltf()

	self.moveCamera = function ( to, cb ) {
		let atX = this.lookAtX;
		let atY = this.lookAtY;
		let atZ = this.lookAtZ;
		let fmX = this.lookFmX;
		let fmY = this.lookFmY;
		let fmZ = this.lookFmZ;

		let dAtx = to.atX - atX;
		let dAty = to.atY - atY;
		let dAtz = to.atZ - atZ;
		let dFmx = to.fmX - fmX;
		let dFmy = to.fmY - fmY;
		let dFmz = to.fmZ - fmZ
		let self = this;
		let nSteps = 80, i = 0;
		function next() {
			if ( i >= nSteps ) {
				if ( cb ) {
					cb(); }
				return; }
			atX += dAtx / nSteps;
			atY += dAty / nSteps;
			atZ += dAtz / nSteps;
			fmX += dFmx / nSteps;
			fmY += dFmy / nSteps;
			fmZ += dFmz / nSteps;
			self.orbitControls.target.set ( atX, atY, atZ ); 
			self.camera.position.set ( fmX, fmY, fmZ );
			self.orbitControls.update();
			i += 1;
			window.setTimeout ( next, 20 ); }
		next();
	}	//	moveCamera()

	self.graspBlock = function ( blkName ) {
		const sW = 'App graspBlock()';
		let block = self.blocks[blkName];
		if ( ! block ) {
			console.error ( sW + ': block not found' ); 
			return; }

		dynamics2.disableContactResponse ( 'link-6' );
		dynamics2.disableContactResponse ( 'finger' );
		dynamics2.disableContactResponse ( blkName );
		
		let L6w = Dexter.HiRes.link6.matrixWorld;	//	link6 wrt world
		let Bw  = block.matrixWorld;				//	block wrt world
		let nL6w = new THREE.Matrix4();
			nL6w.getInverse ( L6w );
		let B6 = nL6w.multiply ( Bw );		//	block wrt link6
	
		block.parent.remove ( block );

		let p = new THREE.Vector3();
		let q = new THREE.Quaternion();
		let s = new THREE.Vector3();
		B6.decompose ( p, q, s );
		block.position.set ( p.x, p.y, p.z );
		block.setRotationFromQuaternion ( q );
		block.scale.set ( 10, 10, 10 );
		
		Dexter.HiRes.link6.add ( block );

		self.grasping = blkName;
	}	//	graspBlock()

	self.releaseBlock = function ( blkName ) {
		const sW = 'App releaseBlock()';
		let block = self.blocks[blkName];
		if ( ! block ) {
			console.error ( sW + ': block not found' ); 
			return; }

		let p = new THREE.Vector3();
		let q = new THREE.Quaternion();
		let s = new THREE.Vector3();
		block.matrixWorld.decompose ( p, q, s );

		block.parent.remove();
		block.scale.set ( 1, 1, 1 );
	
		dynamics2.positionBlock ( blkName, p, q );

		dynamics2.enableContactResponse ( 'link-6' );
		dynamics2.enableContactResponse ( 'finger' );
		dynamics2.enableContactResponse ( blkName );

		self.scene.add ( block );
	
		self.grasping = null;
	}	//	releaseBlock()
	
	self.scriptStatement = function ( next ) {
		const sW = 'App scriptStatement()';
		let j1Ctrl = self.jt['J1'].ctrl;
		let j2Ctrl = self.jt['J2'].ctrl;
		let j3Ctrl = self.jt['J3'].ctrl;
		let j4Ctrl = self.jt['J4'].ctrl;
		let j5Ctrl = self.jt['J5'].ctrl;
		let j6Ctrl = self.jt['J6'].ctrl;
		let fCtrl  = self.ee['Finger'].ctrl;

		self.grab = null;

		if ( self.iScript >= self.script.length ) {
			self.iScript = 0;		//	Start over.
			self.v0CB = null;
			return; }
		let s = self.script[self.iScript];
		console.log (   'is ' + self.iScript 
					  + '   ' + JSON.stringify ( s ) );
		if ( s.camera ) {
			self.moveCamera ( s.camera, next );
			self.v0CB = null;
			self.jvMax = [];
			self.iScript += 1;
			return; }
		if ( s.pause ) {
			if ( next ) {
				window.setTimeout ( next, s.pause ); }
			self.v0CB = null;
			self.jvMax = [];
			self.iScript += 1;
			return; }
		if ( s.grab ) {
			self.grab = s.grab;
			self.grab.blkName = self.rogueBlockName;
			self.grab.cb = next;
			self.iScript += 1;
			return; }
		if ( s.release ) {
			if ( ! self.grasping ) {
				console.error ( sW + ': not grasping' ); }
			else {
				self.releaseBlock ( self.grasping ); }
			self.iScript += 1;
			return; }
		if ( typeof s.f === 'number' ) {
			fCtrl.setValue ( s.f ); }
		if ( typeof s.j1 === 'number' ) {
			j1Ctrl.setValue ( s.j1 ); }
		if ( typeof s.j2 === 'number' ) {
			j2Ctrl.setValue ( s.j2 ); }
		if ( typeof s.j3 === 'number' ) {
			j3Ctrl.setValue ( s.j3 ); }
		if ( typeof s.j4 === 'number' ) {
			j4Ctrl.setValue ( s.j4 ); }
		if ( typeof s.j5 === 'number' ) {
			j5Ctrl.setValue ( s.j5 ); }
		if ( typeof s.j6 === 'number' ) {
			j6Ctrl.setValue ( s.j6 ); }
		self.v0CB = { is: self.iScript, v0: s.v0, cb: next } 
		self.jvMax = [];
		self.iScript += 1;
	}	//	scriptStatement()

	self.stepScript = function ( o ) {
		const sW = 'App stepScript()';
		console.log ( sW );
		self.scriptStatement ( () => {
			self.grab = null;
			self.v0CB = null } );	
	}	//	stepScript()

	self.runScript = function ( o ) {
		const sW = 'App runScript()';
		console.log ( sW );
		function next() {
			self.scriptStatement ( next ); }
		next();
	}	//	runScript()

	self.checkScriptStatementBeingDone = function ( jvAbsMax ) {
		//	Haven't Accumulated enough velocity readings?
		if (  self.jvMax.length < 10 ) {
			self.jvMax.push ( jvAbsMax ); 
			return; }
		self.jvMax.shift();
		self.jvMax.push ( jvAbsMax ); 
		if ( ! self.v0CB ) {	//	No script statement interested in velocity?
			return; }

		let max = 0;
		self.jvMax.forEach ( v => { 
			if ( v > max ) {
				max = v; } } );
		console.log ( sW + ': is ' + self.v0CB.is
						 + '  max ' + max 
						 + '  v0 ' + self.v0CB.v0 );
		if ( self.v0CB.cb && (max <= self.v0CB.v0) ) {
			self.v0CB.cb(); }  
	}	//	checkScriptStatementBeingDone()

	self.calculateRunningAverageDeltaTime = function ( deltaTime ) {
		if ( self.runningDeltaTime.length >= 5 ) {
			self.runningDeltaTime = self.runningDeltaTime.slice ( 1 ); }
		self.runningDeltaTime.push ( deltaTime );
		let sum = 0;
		self.runningDeltaTime.forEach ( dt => sum += dt );
		self.averageDeltaTime = sum / self.runningDeltaTime.length;
	}	//	calculateRunningAverageDeltaTime()


	self.jointNextPosition2 = function ( joint ) {
		const sW = 'App jointNextPosition2() ' + joint;

		//	J1: { move: [], maxVel: 1.00, acl: 1.00, vel: 0, pos: 0 },
		//	
		//	Each move is like -
		//		{ tgtPos:	,
		//		  pos:		,
		//		  stop:		  }

		let vc = self.velocityControl2[joint];

		let mv = null;
		let ad = null;

		while ( true ) {
			if ( vc.move.length === 0 ) {
				break; }
			mv = vc.move[0];
			ad = Math.abs ( mv.tgtPos - mv.pos );	//	distance remaining
			if ( ad !== 0 ) {
				break; }
			console.log ( sW + ': tgt ' + mv.tgtPos
							 + '  pos ' + mv.pos + '  move.slice()' );
			vc.move = vc.move.slice ( 1 ); 
			mv = null; }

		if ( ! mv ) {
			return vc.pos; }
		
		let vFctr = self.jointVA['velocity'].value;
		let aFctr = self.jointVA['acceleration'].value;

		let adt = self.averageDeltaTime;
		let av = Math.abs ( vc.vel );				//	current velocity

		if ( av > 0 ) {
			//	Time remainin to get to target at current velocity.
			let dt = ad / av;
			//	Acceleeration time.
			let at = vc.vel / vc.acl;
			//	If time to decelerate is greater than remaining distance
			//	time then decelerate.
			if ( (at >= dt) || mv.stop ) {
				let dv = aFctr * vc.acl * adt;
				if ( vc.vel - dv < 0 ) {
					vc.vel = 0; }
				else {
					vc.vel -= dv; } }
			else {
				//	Accelerate?
				if ( av < vc.maxVel ) {
					vc.vel += aFctr * vc.acl * adt; } } }
		else {
			//	Current velocity is 0.  Must be starting move.
			vc.vel = aFctr * vc.acl * adt; }

		if ( vc.vel > vc.maxVel ) {
			vc.vel = vc.maxVel; }

		let d = vFctr * vc.vel * adt;

		if ( d === 0 ) {
			vc.vel = 0;
			if ( mv.stop ) {
				mv.tgtPos = mv.pos; } 
			else {
				mv.pos = mv.tgtPos; } }
		else {
			if ( mv.tgtPos > mv.pos ) {
				mv.pos += d;
				if ( mv.pos >= mv.tgtPos ) {
					vc.vel = 0;
					mv.pos = mv.tgtPos; } }
			else {
				mv.pos -= d;
				if ( mv.pos <= mv.tgtPos ) {
					vc.vel = 0;
					mv.pos = mv.tgtPos; } } }

		vc.pos = mv.pos;
		return mv.pos;
	}	//	jointNextPosition2()

	self.updateJointPositions = function ( jc, jv ) {
		let axis = null, a = null, jvAbsMax = 0;

		axis = self.jt['J1'].axis;
		if ( Dexter.HiRes.link1 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link1.rotation[axis] = jc[0]; }
		a = Math.abs ( jv[0] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }
	
		axis = self.jt['J2'].axis;
		if ( Dexter.HiRes.link2 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link2.rotation[axis] = jc[1]; }
		a = Math.abs ( jv[1] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }
	
		axis = self.jt['J3'].axis;
		if ( Dexter.HiRes.link3 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link3.rotation[axis] = jc[2]; }
		a = Math.abs ( jv[2] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }

		axis = self.jt['J4'].axis;
		if ( Dexter.HiRes.link4 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link4.rotation[axis] = jc[3]; }
		a = Math.abs ( jv[3] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }

		axis = self.jt['J5'].axis;
		if ( Dexter.HiRes.link5 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link5.rotation[axis] = jc[4]; }
		a = Math.abs ( jv[4] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }

		axis = self.jt['J6'].axis;
		if ( Dexter.HiRes.link6 && self.bHiResMoveEnabled ) {
			Dexter.HiRes.link6.rotation[axis] = jc[5]; }
		a = Math.abs ( jv[5] );
		if ( a > jvAbsMax ) {
			jvAbsMax = a; }


		axis = self.ee.Finger.axis;
		if ( Dexter.HiRes.finger && self.bHiResMoveEnabled ) {
			Dexter.HiRes.finger.position[axis] = self.ee.Finger.value; } 
	
		return jvAbsMax;
	}	//	updateJointPositions()

	self.getJointTargetPositions = function ( deltaTime, jTgtPos ) {
		self.calculateRunningAverageDeltaTime ( deltaTime );

		jTgtPos.push ( self.jointNextPosition2 ( 'J1' ) );
		jTgtPos.push ( self.jointNextPosition2 ( 'J2' ) );
		jTgtPos.push ( self.jointNextPosition2 ( 'J3' ) );
		jTgtPos.push ( self.jointNextPosition2 ( 'J4' ) );
		jTgtPos.push ( self.jointNextPosition2 ( 'J5' ) );
		jTgtPos.push ( self.jointNextPosition2 ( 'J6' ) );

		//	Need to specify the moving finger position. Just push it on
		//	jTgtPos[].
		jTgtPos.push ( (self.ee['Finger'].value + (2 * self.mfpf)) / 10 );
	}	//	getJointTargetPositions()

	self.updateBlockPositions = function ( dynBlocks ) {
		dynBlocks.forEach ( b => {
			if ( b.name === self.grasping ) {
				return; }
			let q = new THREE.Quaternion();
			let a = b.ammoQ.getAxis();
			let v = new THREE.Vector3 ( a.x(), a.y(), a.z() );
			q.setFromAxisAngle ( v, b.ammoQ.getAngle() ); 
			let p = new THREE.Vector3 ( b.ammoP.x(), b.ammoP.y(), b.ammoP.z() );
			let block = self.blocks[b.name];
			if ( block ) {
				block.position.set ( p.x, p.y, p.z );
				block.setRotationFromQuaternion ( q ); } } );
	}	//	updateBlockPositions()

	self.checkCollisions = function() {
		//	Are we even interested in collisions (do we want to grab somethoing)?
		if ( ! self.grab ) {
			return; }
		
		let g = self.grab;

		if ( ! g.nAttempts ) {
			console.log ( 'out of grab attempts' );
			g.cb();
			return; }

		g.nAttempts -= 1;

		//	Collisions?
		let olos = [];		//	pairs (a and b) of Over Lapping Objects
		dynamics2.getCollisionObjectPositions ( olos );
	
		let l6 = null;
		let f  = null;
		for ( let i = 0; i < olos.length; i++ ) {
			let o = olos[i];
			if (   (! l6)
				&& (o.a.name === 'link-6')
				&& (o.b.name === g.blkName)
				&& (o.numContacts >= g.numContacts ) ) {
				l6 = o; }
			if (   (! l6)
				&& (o.a.name === g.blkName)
				&& (o.b.name === 'link-6')
				&& (o.numContacts >= g.numContacts ) ) {
				l6 = o; }
			if (   (! f)
				&& (o.a.name === 'finger')
				&& (o.b.name === g.blkName)
				&& (o.numContacts >= g.numContacts ) ) {
				f = o; }
			if (   (! f)
				&& (o.a.name === g.blkName)
				&& (o.b.name === 'finger')
				&& (o.numContacts >= g.numContacts ) ) {
				f = o; } 
			if ( l6 && f ) {
				self.graspBlock ( g.blkName ); 
				g.cb();
				break; } } 

	}	//	checkCollisions()


	self.render3D = function() {
		self.resizeRendererToDisplaySize();

		//	Time since the last frame was completed.
		//
		let deltaTime = self.clock.getDelta();		//	seconds

		//	The positions of Dexter's joints we want.
		//
		let jTgtPos = [];		//	Joint target values.

		self.getJointTargetPositions ( deltaTime, jTgtPos );

		//	The position, velocity and torque of joints, and the psoitions of 
		//	other things that may collied - what physics and dynamics tells us.
		//
		let jCurPos = [];		//	Joint current values.
		let jCurVel = [];		//	Joint velocities.
		let jCurTrq = [];		//	Joint applied torques.
		let curGround = {};
		let curBlocks = [];

		dynamics2.stepSimulation2 ( deltaTime, jTgtPos,       jCurPos,
									self.kp / 1000, 
									self.kd / 1000, 
									jCurVel, jCurTrq, curGround, curBlocks ); 

		//	Given what dynamics has told us, update the psition of joints, blocks
		//	in ThreeJS.
		//
		let jvAbsMax = self.updateJointPositions ( jCurPos, jCurVel );

		self.updateBlockPositions ( curBlocks );

		//	Draw everything.
		//
		self.renderer3D.render ( self.scene, self.camera ); 
	
		//	Maybe we are expecting a collision or two?
		//
		self.checkCollisions();

		//	When JavaScript is ready, do another frame.
		//
		window.requestAnimationFrame ( self.render3D );
	
		//	If we are executing a script statement that moves Dexter then
		//	jvAbsMax will help us determine if the move is completed.
		//
		self.checkScriptStatementBeingDone ( jvAbsMax );

	}	//	render3D()

	const sW = 'App()';
	console.log ( sW );

	dynamics2.init().then ( status => {
		console.log ( sW + ': dynamics status: ' + status );
		dynamics2.createEmptyDynamicsWorld();
		//	Ground and blocks are involved in collisions.
		self.ground = self.createGround ( self.scene );
		self.createBlocks ( self.scene );
		self.importDexterFromGltf();
		self.runScript ( null );
	} );

	self.gui = new dat.GUI();
	self.gui.domElement.id = 'gui';

	self.create3dScene();

	//	World coordinate frame.
	let cf = self.createCoordFrame ( self.scene, 
									 0.30, 		//	scale
									 0.3, 		//	opacity
									 false,		//	not a wireframe
									 true );	//	do depth test
	cf.visible = true;		//	world coord frame always visible

	self.createFloor();

	self.createAmbientLight();

	self.createDirectionalLight();		//	Shadows

	self.createFingerPadControls();
	
	self.createKpKdControls();			//	Joint spring and damper

	self.createJointVelocityAccelerationControls();

	self.createJointControls();
	
	self.createEndEffectorControls();
	
	self.clock = new THREE.Clock();

	window.requestAnimationFrame ( self.render3D );

} )();

