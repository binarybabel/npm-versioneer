'use strict';

exports.addClass = function (name) {
    var _ = String(name).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    var f = './versioneer/' + _ + '.js';
    exports[name] = require(f);
};

exports.addClass('RuntimeError');
exports.addClass('MissingConfigError');
exports.addClass('InvalidRepoError');
exports.addClass('Core');
exports.addClass('Repo');
exports.addClass('BypassRepo');
exports.addClass('GitRepo');
// exports.addClass('Config');
