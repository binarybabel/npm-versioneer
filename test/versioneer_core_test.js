const Core = require('../lib/versioneer/core.js');

module.exports = {
    setUp: function (callback) {
        callback();
    },
    test_bump: function (test) {
        test.equals(Core.bump('0.0.0', 'patch'), '0.0.1');
        test.equals(Core.bump('0.0', 'patch'), '0.0.1');
        test.equals(Core.bump('0.0.0', 'minor'), '0.1');
        test.equals(Core.bump('0.0.1', 'minor'), '0.1');
        test.equals(Core.bump('0.0.1', 'minor', 'pre1'), '0.1.pre1');
        test.equals(Core.bump('0.0.2', false, 'pre1'), '0.0.2.pre1');
        test.equals(Core.bump('0.0.2.pre1', false, 'pre2'), '0.0.2.pre2');
        test.done();
    }
};
