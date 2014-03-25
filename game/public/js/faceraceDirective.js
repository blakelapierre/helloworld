var angular = require('angular');

module.exports = function FaceraceDirective () {
	return {
		restrict: 'E',
		template: require('./faceraceTemplate.html'),
		link: function($scope, element, attributes) { },
		controller:  ['$scope', function($scope) {
			
		}]
	};
};