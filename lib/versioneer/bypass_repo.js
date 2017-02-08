'use strict';

const Repo = require('./repo.js');
const InvalidRepoError = require('./invalid_repo_error.js');
const H = require('./helpers.js');

function BypassRepo (directory, options) {
    if (!options) options = Object.new;
    if (options['invalid']) {
        throw new InvalidRepoError(String(directory));
    }

    H.attr_accessor(this, 'release'); // Not writable in abstract Repo.

    BypassRepo.super_.call(this, directory, options);
    this.name = this.constructor.name;

    H.attr_accessor(this, 'release'); // Overwritten by abstract Repo.
    H.attr_accessor(this, 'commits_since_release');
    H.attr_accessor(this, 'is_filesystem_dirty');

    this._commits_since_release = 0;
    this._filesystem_dirty = false;
}

require('util').inherits(BypassRepo, Repo);
module.exports = BypassRepo;
