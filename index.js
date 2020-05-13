"use strict";

const parseHeading = require('./parse');

exports.firstOf = matchPattern(firstMatch);
exports.distinct = matchPattern(onlyMatch);

const selector = Symbol('pm.js: pattern selector');

function matchPattern(strategy) {
    return (template, ...functions) => function(...args) {
        return functions[
            (template[selector] || (
                template[selector] = strategy(functions.map(fn => parseHeading(fn.toString())))
            ))(args)
        ].apply(this, args);
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
        index => !patterns.slice(index).some(pattern => pattern(args)),
        "Arguments match multiple patterns"
    );
}

function assertValid(value, isValid, message) {
    if(!isValid(value))
        throw TypeError(message);
    else
        return value;
}

