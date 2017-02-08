const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const TH = require('./test_helper');
const H = require('../lib/versioneer/helpers.js');
const Config = require('../lib/versioneer/config.js');
const InvalidRepoError = require('../lib/versioneer/invalid_repo_error.js');

const DEFAULT_FILE = Config.DEFAULT_FILE;
const OTHER_FILE = 'versioneer-other.yml';
const LOCK_FILE = Config.DEFAULT_LOCK;

function configure(data, index) {
    if (!data) data = {};
    if (!index) index = 1;
    if (!data['type']) data['type'] = 'Bypass';
    var dump = yaml.safeDump(data);
    var filename = [DEFAULT_FILE, OTHER_FILE][index - 1];
    fs.writeFileSync(filename, dump);
}

module.exports = {
    setUp: function (callback) {
        process.chdir(path.join(__dirname, 'repo'));

        this.build = function () {
            this.q = new Config(process.cwd());
            return this.q;
        };

        callback();
    },
    tearDown: function (callback) {
        TH.rm_f(DEFAULT_FILE);
        TH.rm_f(OTHER_FILE);
        TH.rm_f(LOCK_FILE);
        callback();
    },

    test_invalid_dir: function (test) {
        try {
            new Config(path.join(__dirname, 'no-repo'));
            test.ok(false);
        } catch (e) {
            test.equals(e.name, 'RuntimeError');
        }
        test.done();
    },

    test_missing_config: function (test) {
        try {
            this.build();
            test.ok(false);
        } catch (e) {
            test.equals(e.name, 'MissingConfigError');
        }
        test.done();
    },

    test_invalid_type: function (test) {
        configure({type: 'anothervcs'});
        try {
            this.build().version();
            test.ok(false);
        } catch (e) {
            test.equals(e.name, 'Error');
        }
        test.done();
    },

    test_release: function (test) {
        configure({release: '1.0'});
        test.equals(this.build().release(), '1.0');
        test.done();
    },

    test_version_lock: function (test) {
        configure({release: '1.1'});
        this.build();
        test.equals(this.q.version(), '1.1');
        this.q.lock();
        this.q.repo().commits_since_release(1);
        test.equals(this.q.version(), '1.1');
        this.q.unlock();
        this.q.repo().commits_since_release(1);
        test.notEqual('1.1', this.q.version());
        test.done();
    },

    test_version_lock_manual: function (test) {
        configure({release: '1.2'});
        this.build();
        test.equals(this.q.version(), '1.2');
        this.q.lock('1.1');
        test.equals(this.q.version(), '1.1');
        test.done();
    },

    test_version_lock_invalid_repo: function (test) {
        configure({release: '1.3', invalid: true});
        try {
            this.build().version();
            test.ok(false);
        } catch (e) {
            test.equals(e.name, 'InvalidRepoError');
        }
        configure({release: '1.3'});
        this.build().lock();
        configure({release: '1.4', invalid: true});
        test.equals(this.build().version(), '1.3');
        test.done();
    },

    test_other_version_file: function (test) {
        configure({release: '2.0'}, 2);
        this.q = new Config(path.join(__dirname, 'repo', OTHER_FILE));
        test.equals(this.q.version(), '2.0');
        test.done();
    }
};
