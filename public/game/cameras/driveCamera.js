var facerace = facerace || {};

facerace.DriveCamera = function( fov, aspect, near, far, target, config ) {
	THREE.PerspectiveCamera.call( this, fov, aspect, near, far );

	this._temps = {
		direction: new THREE.Vector3(),
		speed: new THREE.Vector3(),
		rotation: new THREE.Quaternion()
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
		controls	= player.controls,
		d 			= player.direction,
		direction 	= temps.direction.set( Math.sin( d ), Math.cos( d ), 0 ),
		speed 		= temps.speed.fromArray( player.velocity ).length(),
		moveBack 	= parseInt( config.trailDistance ) + ( speed / 5 );

	direction.normalize();
	direction.multiplyScalar( moveBack );

	this.position.copy( target.position );
	this.position.sub( direction );
	this.position.z = parseInt( config.heightFromGround ) + ( speed / 10 );

	this.lookAt( target.position );

	this.position.add( config.offset );

	var turn = -clamp( controls.turn, -1, 1 ),
		angle = turn / 90 * Math.PI;

	this.quaternion.multiply( temps.rotation.set( 0, 0, Math.sin( angle ), Math.cos( angle ) ).normalize());
	
	this.fov = parseInt( config.fov ) + ( speed / 60 );

	this.updateProjectionMatrix();
};