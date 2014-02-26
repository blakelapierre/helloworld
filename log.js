var fs = require('fs'),
	winston = require('winston');

exports.Log = function(config) {
	config = config || {};

	if (!config.transports) {
		var filename = 'log.log';
		if (fs.existsSync(filename)) fs.unlinkSync(filename);
		config.transports = [
			new winston.transports.Console(),
			new winston.transports.File({
				filename: filename, 
				level: 'debug',
				json: false
			})
		];
	}

	return new winston.Logger(config);
};