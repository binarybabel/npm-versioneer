'use strict';

const fs = require('fs');
const path = require('path');

const Repo = require('./repo.js');
const InvalidRepoError = require('./invalid_repo_error.js');
const H = require('./helpers.js');

function GitRepo(directory_or_file, options) {
    var directory = directory_or_file;
    if (!fs.existsSync(path.join(directory_or_file, '.git'))) {
        if (H.has_lines(H.backquote([
                'git ls-files', directory_or_file, '--error-unmatch', H.cl_no_stderr()
            ]))) {
            directory = H.backquote([
                'cd', path.dirname(directory_or_file),
                '&& git rev-parse --show-toplevel', H.cl_no_stderr()
            ]);
        } else {
            throw new InvalidRepoError("Not part of a Git repo. " + directory_or_file);
        }
    }

    GitRepo.super_.call(this, directory, options);
    this.name = this.constructor.name;

    var release_ref = function () {
        var cmd = 'git describe --abbrev=0 --tags';
        var ref = H.backquote([cmd, H.cl_no_stderr()]).trim();
        if (ref.length == 0) return null;

        if (ref.match(this.release_pattern())) {
            return ref;
        } else {
            // Iterate through tags in date order for first match.
            var lines, i;
            if (H.is_windows()) {
                lines = H.backquote(['git tag --sort=-*creatordate', H.cl_no_stderr()]).trim().split("\n");
                for (i in lines) {
                    if (lines[i].match(this.release_pattern())) {
                        return lines[i];
                    }
                }
            } else {
                lines = H.backquote(["git for-each-ref --sort='-*creatordate' --format '%(objecttype)=%(refname)'", H.cl_no_stderr()]).trim().split("\n");
                for (i in lines) {
                    var y = lines[i].trim().split('=');
                    var ref_name = y[1].split('/').pop();

                    if (y[0] == 'tag' && ref_name.match(this.release_pattern())) {
                        return ref_name;
                    }
                }
            }
        }
    };

    var first_ref = function () {
        var cmd = 'git rev-list HEAD';
        var ref = H.backquote([cmd, H.cl_no_stderr(), ' | tail -n 1']).trim();
        if (ref.length == 0) return null;
        return ref;
    };

    var release_ = this.release;
    this.release = function () {
        var ref = release_ref.call(this);
        if (ref) {
            return ref.match(this.release_pattern())[1];
        } else {
            return release_.call(this);
        }
    };

    this.commits_since_release = function () {
        var offset = 0;
        var ref = release_ref.call(this);
        if (!ref) {
            ref = first_ref.call(this);
            if (!ref) return 0;
            offset = 1;
        }
        return H.num_of_lines(H.backquote([
                'git log', ref + '...HEAD', '--pretty=oneline', H.cl_no_stderr()
            ])) + offset;
    };

    this.is_filesystem_dirty = function(){
        return H.system('git diff-index --quiet HEAD -- ' + H.cl_silence()) != 0;
    };
}

require('util').inherits(GitRepo, Repo);
module.exports = GitRepo;
