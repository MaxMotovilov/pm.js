"use strict";

module.exports = function() {
    const
        queue = [],
        nesting = [],
        {arrayAt, hashAt, up, result} = code();

    function add(check, depth) {
        if(nesting.length>depth) {
            queue.push(up(nesting.length-depth));
            nesting.splice(depth);
        }
        nesting.push(queue.length);
        queue.push(check);
    }

    function drop(depth) {
        if(nesting.length>depth) {
            nesting.splice(depth+1);
            queue.splice(nesting.pop());
        }
    }

    function finish() {
        return result(queue);
    }

    return {
        openArray(key, depth) {
            add(arrayAt(key), depth);
        },
        openHash(key, depth) {
            add(hashAt(key), depth);
        },
        drop,
        finish
    }
}

function code() {
    const keys = [], code = [], stack = ['_'];

    function add(key, inner) {
        return () => {
            const v = varName(keys.length);
            keys.push(key);
            code.push(`if(${inner(stack[stack.length-1], v, key)}) return false;`);
            stack.push(v);
        }
    }

    return {
        arrayAt: key => add(key, (prev, next, key) => `!Array.isArray(${next}=${prev}[${key}])`),
        hashAt: key => add(key, (prev, next, key) => `!(${next}=${prev}${dotOrSub(key)})||typeof ${next}!=='object'`),
        up: n => () => stack.splice(-n),

        result(commands) {
            commands.forEach(cmd => cmd());
            return new Function(
                '_',
                `let ${keys.map((_, i) => varName(i)).join(',')};` +
                code.join('') +
                'return true;'
            );
        }
    }
}

function varName(n) {
    let name = "";
    ++n;
    do {
        --n;
        name += String.fromCharCode('a'.charCodeAt(0) + (n%26));
        n = Math.floor(n/26);
    } while(n>0);

    return name;
}

function literal(val) {
    if(typeof val==='string')
        return `"${val.replace(/[\\"]/g, '\\$&')}"`;
    else
        return val.toString();
}

function dotOrSub(val) {
    if(typeof val==='string' && /^[a-z_$][a-z0-9_$]*$/.test(val))
        return `.${val}`;
    else
        return `[${literal(val)}]`;
}
