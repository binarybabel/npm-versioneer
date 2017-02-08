'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const H = require('./helpers.js');
const RuntimeError = require('./runtime_error');
const MissingConfigError = require('./missing_config_error.js');
const BypassRepo = require('./bypass_repo.js');

function Config(directory_or_config_file, repo_options) {
    if (!repo_options) repo_options = {};

    if (fs.existsSync(directory_or_config_file)) {
        var stat = fs.lstatSync(directory_or_config_file);
        if (stat.isDirectory()) {
            this._config_base = directory_or_config_file;
            this._config_file = path.join(directory_or_config_file, Config.DEFAULT_FILE);
            if (!fs.existsSync(this._config_file)) {
                throw new MissingConfigError('Versioneer config file does not exist. ' + this._config_file);
            }
        } else {
            this._config_file = directory_or_config_file;
            this._config_base = path.dirname(directory_or_config_file);
        }
    } else {
        throw new RuntimeError('Versioneer base path does not exist. ' + directory_or_config_file);
    }

    var params = yaml.safeLoad(fs.readFileSync(this._config_file, 'utf8'));
    this._lock_file = path.join(this._config_base, H.obj_delete(params, 'lock_file') || Config.DEFAULT_LOCK);
    this._repo = false;
    this._repo_type = (H.capitalize(H.obj_delete(params, 'type')) || Config.DEFAULT_TYPE) + 'Repo'
    this._repo_options = H.obj_merge({}, params, repo_options);

    H.attr_reader(this, 'config_file');
    H.attr_reader(this, 'config_base');
    H.attr_reader(this, 'lock_file');

    this.is_locked = function () {
        return fs.existsSync(this._lock_file);
    };

    this.repo = function () {
        if (this._repo) return this._repo;
        if (this.is_locked()) {
            this._repo = new BypassRepo(this._config_base, {release: this.version()});
        } else {
            var RepoClass = require('./' + H.underscore(this._repo_type) + '.js');
            this._repo = new RepoClass(this._config_base, this._repo_options);
        }
        return this._repo;
    };

    this.version = function () {
        if (this.is_locked()) {
            return fs.readFileSync(this._lock_file).toString().trim();
        } else {
            return this.repo().version();
        }
    };

    this.release = function () {
        return this.repo().release();
    };

    this.lock = function (version) {
        this._repo = false;
        if (!version) version = this.repo().toString();
        if (!version || version.length == 0) {
            throw new RuntimeError('Cannot lock. Version neither given nor detected.');
        }
        fs.writeFileSync(this._lock_file, version);
    };

    this.unlock = function () {
        this._repo = false;
        if (fs.existsSync(this._lock_file)) {
            fs.unlinkSync(this._lock_file);
        }
    };

    this.toString = function () {
      return this.version().toString();
    };
}

Config.DEFAULT_TYPE = 'Git';
Config.DEFAULT_FILE = '.versioneer.yml';
Config.DEFAULT_LOCK = 'version.lock';

module.exports = Config;
