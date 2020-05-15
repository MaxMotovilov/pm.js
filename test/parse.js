"use strict";

const {parseHeading} = require('../parse');

function test(fn) {
    try {
        parseHeading(fn.toString());
    } catch(err) {
        console.log(err);
        console.log(`in ${fn.toString()}`);
    }
}

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
    ([,a,b]) => {}
,
    ([a,,b]) => {}
,
    ([a=(c+d),,b]) => {}
,
    ([a,[b]]) => {}
,
    ([a,[b]=[1]]) => {}
,
    ({a, b}) => {}
,
    ({a=1, b:{c}}) => {}
,
    ({1:a, "-":b=2}) => {}
,
    ({a, [0xff]:[{b}]}) => {}
].forEach(test);
