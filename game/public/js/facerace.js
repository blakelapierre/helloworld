var angular = require('angular');

module.exports = angular.module('facerace', [])
	.directive('facerace', require('./faceraceDirective'));