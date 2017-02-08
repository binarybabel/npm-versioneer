'use strict';

const os = require('os');
const cp = require('child_process');

/****************************************/
/*  Generic  */
/****************************************/

exports.num_of_lines = function (input) {
    if (typeof input != 'string' || input.trim().length == 0) {
        return 0;
    }
    return input.trim().split("\n").length;
};

exports.has_lines = function (input) {
    return exports.num_of_lines(input) > 0;
};

/****************************************/
/*  Platform Specific  */
/****************************************/

exports.is_windows = function () {
    return (os.type() == 'Windows_NT');
};

exports.platform = function () {
    if (exports.is_windows()) {
        return 'windows';
    }
    return 'unix';
};

exports.cl_no_stdout = function () {
    return {
        unix: '>/dev/null',
        windows: '>nul'
    }[exports.platform()];
};

exports.cl_no_stderr = function () {
    return {
        unix: '2>/dev/null',
        windows: '2>nul'
    }[exports.platform()];
};

exports.cl_silence = function () {
    return {
        unix: '>/dev/null 2>&1',
        windows: '>nul 2>&1'
    }[exports.platform()];
};


/****************************************/
/*  Ruby Ports  */
/****************************************/

exports.attr_accessor = function (func, name) {
    func[name] = function (value) {
        if (typeof value != 'undefined') {
            func['_' + name] = value;
        }
        return func['_' + name];
    };
};

exports.attr_reader = function (func, name) {
    func[name] = function () {
        return func['_' + name];
    };
};

exports.underscore = function (string) {
    return string.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
};

exports.backquote = function (command) {
    try {
        if (command instanceof Array) {
            command = command.join(' ');
        }
        return cp.execSync(command).toString();
    } catch (e) {
        return "";
    }
};

exports.system = function (command) {
    if (command instanceof Array) {
        command = command.join(' ');
    }
    try {
        console.log(cp.execSync(command).toString());
        return 0;
    } catch (e) {
        return e.status;
    }
};

exports.capitalize = function (string) {
    if (typeof string == 'undefined') return undefined;
    return string.charAt(0).toUpperCase() + string.slice(1);
};

exports.obj_merge = function (target) {
    var sources = [].slice.call(arguments, 1);
    for (var i in sources) {
        var source = sources[i];
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] != 'undefined') {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
};

exports.obj_delete = function (object, key) {
    var value = object[key];
    if (typeof value != 'undefined') {
        object[key] = undefined;
    }
    return value;
};

// Ruby conversion notes:
// * Additional functions ported from Gem::Version
// * https://github.com/rubygems/rubygems/blob/master/lib/rubygems/version.rb

exports.ver_is_prerelease = function (version) {
    return !!String(version).match(/[a-zA-Z]/);
};

exports.ver_segments = function (version) {
    return version.match(/[0-9]+|[a-z]+/gi);
};

exports.ver_release = function (version) {
    while (exports.ver_is_prerelease(version)) {
        var segments = exports.ver_segments(version);
        segments.pop();
        version = segments.join('.');
    }
    return version;
};

exports.ver_release_segments = function (version) {
    return exports.ver_segments(exports.ver_release(version));
};

exports.ver_bump = function (version) {
    var segments = exports.ver_release_segments(version);
    if (segments.length > 1)
        segments.pop();
    var last = parseInt(segments.pop());
    segments.push(String(last + 1));
    return segments.join('.');
};
