"use strict";

const
    test = require('tape-catch'),
    {firstOf, distinct} = require('../index');

test('Documented API [index.js]', ({equal, looseEqual, throws, end}) => {
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
            barfs([1]), works({0: 1}),

        distinct`${
            ({a}, b) => (equal(a, 1), looseEqual(b, null))
        }${
            (a, {b}) => (looseEqual(a, null), equal(b, 1))
        }`,
            works({a:1}), works(null, {b:1}), barfs({a:1}, {b:1}), barfs(),

        firstOf`${
            ({a}, b) => equal(a, 1)
        }${
            (a, {b}) => (looseEqual(a, null), equal(b, 1))
        }`,
            works({a:1}), works(null, {b:1}), works({a:1}, {b:1}), barfs()

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
