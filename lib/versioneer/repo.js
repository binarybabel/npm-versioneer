'use strict';

const path = require('path');

const Core = require('./core.js');
const H = require('./helpers.js');

function Repo(directory, options) {
    if (!options) options = {};

    this._directory = directory;
    this._environment = null;

    this._bump_segment = 'minor';
    this._prereleases = ['alpha', 'beta', 'rc'];
    this._release_pattern = /^v?([0-9\.]+)$/;
    this._starting_release = '0.0';

    // Ruby conversion notes:
    // * Options to be applied after all accessors are defined.

    H.attr_accessor(this, 'starting_release');
    H.attr_accessor(this, 'prereleases');
    H.attr_accessor(this, 'bump_segment');

    this.environment = function (value) {
        if (typeof value != 'undefined') {
            this._environment = value;
        }
        var env = this._environment;
        if (env) return this._environment;

        env = process.env.VERSIONEER_ENV;
        if (env) return this._environment;

        env = process.env.NODE_ENV;
        if (env) return this._environment;

        env = process.env.ENV;
        if (env) return this._environment;

        return 'development';
    };

    // Apply options.
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            if (typeof options[key] != 'undefined') {
                try {
                    this[key](options[key]);
                } catch (e) {
                    console.log('Repo option errored: ' + key);
                    throw e;
                }
            }
        } else {
            console.log('Unknown repo option: ' + key);
        }
    }

    this.release_pattern = function (value) {
        if (typeof value != 'undefined') {
            if (typeof value == 'string') {
                this._release_pattern = new RegExp(value);
            } else {
                this._release_pattern = value;
            }
        }
        return this._release_pattern;
    };

    this.release = function () {
        return this.starting_release();
    };

    this.commits_since_release = function () {
        return 0;
    };

    this.is_filesystem_dirty = function () {
        return true;
    };

    this.version = function () {
        var prerelease;
        var prereleases = this.prereleases();
        var num_commits = this.commits_since_release();

        if (this.environment() == 'production') {
            if (this.bump_segment() == 'minor' && !prereleases[2] && num_commits > 0) {
                // Use commits as addition to patch level, instead of release candidate.
                return Core.bump(H.ver_release(this.release()), 'patch', false, num_commits);
            } else if (num_commits > 0) {
                prerelease = prereleases[2] + String(num_commits);
            }
        } else if (this.is_filesystem_dirty()) {
            prerelease = prereleases[0] + String(num_commits + 1);
        } else if (num_commits > 0) {
            prerelease = prereleases[1] + String(num_commits);
        }

        if (prerelease) {
            return Core.bump(this.release(), this.bump_segment(), prerelease);
        }

        return this.release();
    };

    this.toString = function () {
        return this.version();
    };
}

module.exports = Repo;
