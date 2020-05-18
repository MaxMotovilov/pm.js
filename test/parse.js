"use strict";

const
    test = require('tape-catch'),
    {parseHeading} = require('../parse');

test('parseHeading() [parse.js]', ({ok, notOk, end}) => {
    [
        function() {}
    ,
        function(x) {}
    ,
        function foo() {}
    ,
        () => {}
    ,
        x => x
    ,
        (x=1) => {}
    ,
        ([,a,b]) => {}, yes([]), no({}), no(),
    ,
        ([a,,b]) => {}, yes([]), no({}), no(),
    ,
        ([a=(c+d),,b]) => {}, yes([]), no({}), no(),
    ,
        ([a,[b]]) => {}, yes([,[]]), no([]), no({}), no(),
    ,
        ([a,[b]=[1]]) => {}, yes([]), no({}), no(),
    ,
        ({a, b}) => {}, yes({}), yes([]), no(),
    ,
        ({a=1, b:{c}}) => {}, yes({b:{}}), yes({b:[]}), no({}), no([]), no(),
    ,
        ({1:a, "-":b=2}) => {}, yes({}), yes([]), no(),
    ,
        ({a, [0xff]:[{b}]}) => {}, yes({255:[{}]}), yes({255:[[]]}), no({255:{}}), no({}), no()
    ].reduce(
        (last, what) => (what.isPredicate ? (what(last), last) : parse(what)), null
    );
    end();

    function parse(source) {
        const result = parseHeading(source.toString());
        result.source = source;
        return result;
    }

    function yes(...testValues) {
        const result = patternMatcher => ok(patternMatcher(testValues), `${format(testValues)} matches ${patternMatcher.source}`);
        result.isPredicate = true;
        return result;
    }

    function no(...testValues) {
        const result = patternMatcher => notOk(patternMatcher(testValues), `${format(testValues)} does not match ${patternMatcher.source}`);
        result.isPredicate = true;
        return result;
    }
});

function format(testValues) {
    return `(${testValues.map(v => JSON.stringify(v)).join(', ')})`;
}
