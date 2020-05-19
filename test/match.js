"use strict";

const
    test = require('tape-catch'),
    {firstOf, distinct} = require('../index');

test('Documented API [index.js]', ({equal, throws, end}) => {
    [
        firstOf`${
            ([x]) => equal(x, 1, '[] matched')
        }${
            ({0:x}) => equal(x, 1, '{} matched')
        }`,
            works([1]), works({0: 1}),

        distinct`${
            ([x]) => equal(x, 1, '[] matched')
        }${
            ({0:x}) => equal(x, 1, '{} matched')
        }`,
            barfs([1]), works({0: 1})
    ].reduce(
        (last, what) => (what.isPredicate ? (what(last), last) : what), null
    );
    end();

    function works(...testValues) {
        const result = patternMatcher => patternMatcher(...testValues);
        result.isPredicate = true;
        return result;
    }

    function barfs(...testValues) {
        const result = patternMatcher => throws(() => patternMatcher(...testValues), TypeError);
        result.isPredicate = true;
        return result;
    }
});
