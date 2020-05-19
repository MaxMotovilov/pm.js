"use strict";

const {parseHeading, parseTemplate} = require('./parse');

exports.firstOf = matchPattern(firstMatch);
exports.distinct = matchPattern(onlyMatch);

const cachedSelector = (cache => (template, make) => {
    let selector = cache.get(template);
    if(!selector)
        cache.set(template, selector = make());
    return selector;
})(new WeakMap);

function matchPattern(strategy) {
    return (template, ...functions) => {
        const makeSelector = () => {
            parseTemplate(template);
            return strategy(functions.map(fn => parseHeading(fn.toString())));
        }

        return function(...args) {
            return functions[cachedSelector(template, makeSelector)(args)].apply(this, args);
        }
    }
}

function firstMatch(patterns) {
    return args => assertValid(
        patterns.findIndex(pattern => pattern(args)),
        index => index>=0,
        "Arguments don't match any of the patterns"
    );
}

function onlyMatch(patterns) {
    const first = firstMatch(patterns);
    return args => assertValid(
        first(args),
        index => !patterns.slice(index+1).some(pattern => pattern(args)),
        "Arguments match multiple patterns"
    );
}

function assertValid(value, isValid, message) {
    if(!isValid(value))
        throw TypeError(message);
    else
        return value;
}

