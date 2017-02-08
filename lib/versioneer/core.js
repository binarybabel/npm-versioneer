'use strict';

const H = require('./helpers.js');

exports.segment_to_i = function (segment) {
    return ['major', 'minor', 'patch'].indexOf(segment);
};

exports.bump = function (version, bump_segment, prerelease_suffix, bump_count) {
    var length = 3;
    if (bump_segment) length = exports.segment_to_i(bump_segment) + 1;

    if (H.ver_is_prerelease(version) || !bump_segment) {
        if (prerelease_suffix)
            return H.ver_release_segments(version).concat(String(prerelease_suffix)).join('.');
        else
            return version;
    } else {
        var next_version = version;
        if (!bump_count)
            bump_count = 1;
        for (var i = 0; i < bump_count; i++) {
            var segments = H.ver_release_segments(next_version).slice(0, length);
            while (segments.length < length + 1) {// ver_bump strips last segment
                segments.push('0');
            }
            next_version = H.ver_bump(segments.join('.'));
        }
        if (prerelease_suffix)
            next_version += '.' + prerelease_suffix;
        return next_version;
    }
};
