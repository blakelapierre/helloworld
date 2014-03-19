var facerace = facerace || {};

facerace.DriveCamera = function( fov, aspect, near, far, target, config ) {
	THREE.PerspectiveCamera.call( this, fov, aspect, near, far );

	this._temps = {
		direction: new THREE.Vector3(),
		speed: new THREE.Vector3(),
		rotation: new THREE.Quaternion(),
		controlsQuaternion: new THREE.Quaternion(),
		deltaQuaternion: new THREE.Quaternion(),
		previousControlsQuaternion: new THREE.Quaternion(),
		adjustmentQuaternion: new THREE.Quaternion(),
		targetQuaternion: new THREE.Quaternion(),
		identityQuaternion: new THREE.Quaternion(),
		lookAtTarget: new THREE.Vector3(),
		displace: new THREE.Vector3()
	};

	this.target = target;

	config = config || {};
	this.config = config;
	this.config.offset = config.offset || new THREE.Vector3(0, 0, 0);

	this.updateDriveCamera();
};

facerace.DriveCamera.prototype = Object.create( THREE.PerspectiveCamera.prototype );

facerace.DriveCamera.prototype.setTarget = function( target ) {
	this.target = target;
};

facerace.DriveCamera.prototype.updateDriveCamera = function() {
	if (this.target == null) return;

	var target	 	= this.target,
		config		= this.config,
		temps 		= this._temps,
		player		= target.simulatorPlayer,
		state		= player.prediction,
		controls	= state.controls,
		d 			= state.metrics.direction,
		direction 	= temps.direction.set( Math.sin( d ), Math.cos( d ), 0 ),
		speed 		= temps.speed.fromArray( state.metrics.velocity ).length(),
		moveBack 	= parseInt( config.trailDistance ) + ( speed / 5 ),
		moveUp		= speed / 4;

	direction.normalize().multiplyScalar( moveBack );

	this.position.copy( target.position );
	this.position.add( config.offset );
	this.position.z += moveUp;
	this.position.sub( direction );

	this.up.set( 0, 0, 1 ); // our quaternions will modify 'up', we reset it so that we'll revert back
	
	temps.lookAtTarget.copy( target.position );
	temps.lookAtTarget.add( config.offset );

	this.lookAt( temps.lookAtTarget );

	temps.controlsQuaternion.fromArray( controls.quaternion || [0, 0, 0, 1] );

	temps.deltaQuaternion.multiplyQuaternions( temps.controlsQuaternion, temps.previousControlsQuaternion.conjugate() );

	temps.adjustmentQuaternion.multiplyQuaternions( temps.adjustmentQuaternion, temps.deltaQuaternion );


	// temps.targetQuaternion.slerp

	temps.targetQuaternion.multiplyQuaternions( this.quaternion, temps.adjustmentQuaternion );

	temps.adjustmentQuaternion.slerp( temps.identityQuaternion, 0.05 );

	this.quaternion.slerp( temps.targetQuaternion, 0.25 );
	
	// this.quaternion.multiplyQuaternions( this.quaternion, temps.deltaQuaternion );

	temps.previousControlsQuaternion.copy( temps.controlsQuaternion );

	// transition = final * initial^-1 /*(conguate)*/

	// this.position.copy( target.position );
	// //this.position.sub( direction );
	// this.position.add(config.offset );

	// temps.lookAtTarget.copy( target.position );

	// //this.lookAt( temps.lookAtTarget );

	// //this.position.add( config.offset );

	// var turn = -clamp( -controls.turn, -Math.PI, Math.PI ),
	// 	angle = Math.sin( turn / Math.PI ) * ( Math.PI / 3 );

	// controls.quaternion = controls.quaternion || [0, 0, 0, 0];

	// temps.targetRotation.set( controls.quaternion[0], controls.quaternion[1], controls.quaternion[2], controls.quaternion[3] ).normalize();

	// // temps.targetRotation.set( 0, 0, Math.sin( angle ), Math.cos( angle ) ).normalize();
	// temps.targetRotation.multiplyQuaternions( this.quaternion, temps.targetRotation );

	// this.quaternion.slerp( temps.targetRotation, 0.5 );

	// temps.displace.copy( direction );
	// temps.displace.applyQuaternion( this.quaternion );
	// //temps.displace.multiplyScalar( moveBack );
	// this.position.sub( temps.displace );

	// this.lookAt( temps. lookAtTarget );

	// this.position.copy( target.position );
	// this.position.add( config.offset );
	// this.position.z += 20;

	// this.translateZ ( moveBack );

	//this.lookAt( target.position );


	//controls.quaternion = controls.quaternion || [0, 0, 0, 0];
	//temps.targetQuaternion.fromArray( controls.quaternion );
	//this.quaternion.slerp( temps.targetQuaternion, 0.5 );

	// temps.targetQuaternion.fromArray( controls.quaternion );
	// this.position.applyQuaternion(temps.targetQuaternion);

	// this.lookAt( target.position );

	
	//direction.applyQuaternion( this.quaternion );

	// this.position.sub(direction);


//	console.log(temps.displace);
	
	this.fov = parseInt( config.fov ) + ( speed / 60 );

	this.updateProjectionMatrix();
};