const fs = require('fs');
const path = require('path');
const sleep = require('sleep').sleep;

const TH = require('./test_helper');
const H = require('../lib/versioneer/helpers.js');
const GitRepo = require('../lib/versioneer/git_repo.js');
const InvalidRepoError = require('../lib/versioneer/invalid_repo_error.js');

if (TH.is_test_ci()) {
    H.system('git config --global user.name test');
    H.system('git config --global user.email test@example.com');
}

module.exports = {
    setUp: function (callback) {
        process.chdir(path.join(__dirname, 'repo'));
        if (fs.existsSync('.git')) {
            throw new Error('Unknown git directory detected in test/repo.');
        }
        H.backquote(
            'git init && git add .keep && git config user.name test && git config user.email test@example.com'
        );
        this.git_created = true;
        this.q = new GitRepo(path.join(process.cwd(), '.keep'), {
            environment: 'development'
        });
        this.no_rc_test = function (callback) {
            var x = this.q._prereleases.pop();
            callback.call(this);
            this.q._prereleases.push(x);
        };
        callback();
    },
    tearDown: function (callback) {
        if (this.git_created) {
            TH.delete_folder('.git')
        }
        this.git_created = false;
        fs.unlink('a', TH.ignore);
        fs.unlink('b', TH.ignore);
        fs.unlink('c', TH.ignore);
        callback();
    },

    test_not_a_git_repo: function (test) {
        try {
            new GitRepo('/tmp/versioneer.invalid');
            test.ok(false);
        } catch (e) {
            test.equals(e.name, 'InvalidRepoError');
        }
        test.done();
    },

    test_no_commits: function (test) {
        test.equals(this.q.commits_since_release(), 0);
        test.ok(this.q.is_filesystem_dirty());
        test.equals(this.q.release(), '0.0');
        test.equals(this.q.version(), '0.1.alpha1');
        test.done();
    },

    test_one_commit_no_tags: function (test) {
        H.system('git add .keep && git commit -m Initial');
        test.equals(this.q.commits_since_release(), 1);
        test.ok(!this.q.is_filesystem_dirty());
        test.equals(this.q.release(), '0.0');
        test.equals(this.q.version(), '0.1.beta1');
        // Production
        this.q.environment('production');
        test.equals(this.q.version(), '0.1.rc1');
        this.no_rc_test(function () {
            test.equals(this.q.version(), '0.0.1');
        });
        test.done();
    },

    test_two_commits_no_tags: function (test) {
        H.system('git add .keep && git commit -m Initial');
        H.system('git commit --allow-empty -m Second');
        test.equals(this.q.commits_since_release(), 2);
        test.ok(!this.q.is_filesystem_dirty());
        test.equals(this.q.release(), '0.0');
        test.equals(this.q.version(), '0.1.beta2');
        // Become dirty
        H.system('touch a && git add a');
        test.ok(this.q.is_filesystem_dirty());
        test.equals(this.q.version(), '0.1.alpha3');
        // Production
        this.q.environment('production');
        test.equals(this.q.version(), '0.1.rc2');
        this.no_rc_test(function () {
            test.equals(this.q.version(), '0.0.2');
        });
        test.done();
    },

    test_one_tag: function (test) {
        H.system('git add .keep && git commit -m Initial');
        H.system('git tag -am v0.5 v0.5');
        test.equals(this.q.commits_since_release(), 0);
        test.ok(!this.q.is_filesystem_dirty());
        test.equals(this.q.release(), '0.5');
        test.equals(this.q.version(), '0.5');
        // Become dirty
        H.system('touch a && git add a');
        test.equals(this.q.version(), '0.6.alpha1');
        // Production
        this.q.environment('production');
        test.equals(this.q.version(), '0.5');
        this.no_rc_test(function () {
            test.equals(this.q.version(), '0.5');
        });
        test.done();
    },

    test_one_tag_one_commit: function (test) {
        H.system('git add .keep && git commit -m Initial');
        H.system('git tag -am v0.5.3 v0.5.3');
        H.system('git commit --allow-empty -m Second');
        test.equals(this.q.commits_since_release(), 1);
        test.ok(!this.q.is_filesystem_dirty());
        test.equals(this.q.release(), '0.5.3');
        test.equals(this.q.version(), '0.6.beta1');
        // Production
        this.q.environment('production');
        test.equals(this.q.version(), '0.6.rc1');
        this.no_rc_test(function () {
            test.equals(this.q.version(), '0.5.4');
        });
        test.done();
    },

    test_two_tags: function (test) {
        H.system('git add .keep && git commit -m Initial');
        H.system('git tag -am v0.5 v0.5');
        H.system('git commit --allow-empty -m Second');
        H.system('git tag -am v0.6.1 v0.6.1');
        test.equals(this.q.release(), '0.6.1');
        // Production
        this.q.environment('production');
        test.equals(this.q.release(), '0.6.1');
        this.no_rc_test(function () {
            test.equals(this.q.version(), '0.6.1');
        });
        test.done();
    },

    test_tag_search_non_alphabetical: function (test) {
        H.system('git add .keep && git commit -m Initial');
        H.system('git tag -am v0.2 v0.2');
        sleep(1); // ensure next tag has different timestamp

        H.system('git commit --allow-empty -m Second');
        H.system('git tag -am v0.4 v0.4');
        sleep(1);

        H.system('git commit --allow-empty -m Third');
        H.system('git tag -am v0.3 v0.3');
        sleep(1);

        H.system('git commit --allow-empty -m Fourth');
        H.system('git tag -am v0.1-rc1 v0.1-rc1');
        sleep(1);

        // v0.3 is the commit-recent tag matching the release pattern,
        //   but intentionally not the next alphabetically.
        test.equals(this.q.release(), '0.3');
        test.done();
    },

    test_tag_search_commit_order: function (test) {
        H.system('git add .keep && git commit -m Initial');
        sleep(1); // ensure next tag has different timestamp
        H.system('git commit --allow-empty -m Second');
        sleep(1);
        H.system('git commit --allow-empty -m Third');
        sleep(1);
        H.system('git commit --allow-empty -m Fourth');
        sleep(1);

        H.system('git tag -am v0.1-rc1 v0.1-rc1');
        H.system('git tag -a v0.2 HEAD~3 -m v0.2');
        H.system('git tag -a v0.3 HEAD^ -m v0.3');
        H.system('git tag -a v0.4 HEAD~2 -m v0.4');

        // v0.2 is the commit-recent tag matching the release pattern,
        //   but intentionally not the most recent tag added.
        test.equals(this.q.release(), '0.3');
        test.done();
    }
};
