angular.module('facerace', ['angular-gestures', 'faceraceDebug']);

jsondiffpatch.config.objectHash = function(obj) { return obj.id || JSON.stringify(obj); };