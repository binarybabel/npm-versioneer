const H = require('../lib/versioneer/helpers.js');

module.exports = {
    test_ver_segments: function (test) {
        test.deepEqual(H.ver_segments('1.0.0.pre1'), ['1', '0', '0', 'pre', '1']);
        test.done();
    },
    test_ver_release: function (test) {
        test.equal(H.ver_release('1.0.0.pre1'), '1.0.0');
        test.done();
    }
};
