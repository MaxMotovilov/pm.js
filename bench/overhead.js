"use strict";

const {firstOf} = require('../index');

const
    getProp = ({prop}) => prop,
    getTwoProps = ({prop1}, {prop2}) => prop1+prop2;

function test(what, arg1, arg2) {
    const wrapped = firstOf`${what}`;
    const unpacked = (...args) => what(...args);

    const
        raw = time(what, arg1, arg2, 100000000, `Raw: ${what.toString()}`),
        baseline = time(unpacked, arg1, arg2, 10000000, `Baseline: ${what.toString()}`, raw);
    time(wrapped, arg1, arg2, 10000000, `Wrapped: ${what.toString()}`, baseline, raw);
}

test(getProp, {prop:1});
test(getTwoProps, {prop1:1}, {prop2:2});

function shorten(n) {
    return n.toString().replace(/000$/, 'K').replace(/000K$/, 'M');
}

function time(what, arg1, arg2, count, title, ...bases) {
    const start = Date.now();
    for(let i=0; i<count; ++i)
        what(arg1, arg2);
    const t = Date.now() - start;

    console.log(`${title}: ${t}ms per ${shorten(count)}`, ...bases.map(base => `+${Math.floor(100*(t/1000/count-base)/base)}%`));

    return t/1000/count;
}
