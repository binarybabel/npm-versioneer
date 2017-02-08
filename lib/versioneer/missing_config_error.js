'use strict';

const RuntimeError = require('./runtime_error.js');

module.exports = function MissingConfigError(message) {
    RuntimeError.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
};

require('util').inherits(module.exports, RuntimeError);
