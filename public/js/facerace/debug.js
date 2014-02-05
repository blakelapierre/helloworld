angular.module('faceraceDebug', [])
.directive('objectEditor', function() {
	return {
		template: 
			'<div class="object-editor">' +
				'<div ng-repeat="(key, value) in object" ng-click="expand[key] = !expand[key]">' +
					'<span ng-class="{glyphicon:true, \'glyphicon-plus\': !expand[key], \'glyphicon-minus\': expand[key]}" class="glyphicon glyphicon-plus"></span><span>{{key}}</span>' +
					'<div ng-show="expand[key]" object="value">{{value}}</div>' +
				'</div>' +
			'</div>',
		scope: {
			object: '='
		},

		link: function($scope, element, attributes) {
			$scope.expand = {};

			$scope.toggle = function() {
				console.log('t', arguments);
			};
		}
	};
});