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
    const vars = [], code = [], stack = ['_'];

    function add(key, inner) {
        return next => {
            const v = varName(stack.length-1);
            code.push(`if(${inner(stack[stack.length-1], v, key, !next || next.up)}) return false;`);
            stack.push(v);
            if(vars.length+1<stack.length)
                vars.push(v);
        }
    }

    return {
        arrayAt: key => add(key, (prev, next, key, opt) => `!Array.isArray(${opt ? '' : next+'='}${prev}${dotOrSub(key)})`),
        hashAt: key => add(key, (prev, next, key) => `!(${next}=${prev}${dotOrSub(key)})||typeof ${next}!=='object'`),
        up: n => Object.assign(() => stack.splice(-n), {up: true}),

        result(commands) {
            commands.forEach((cmd, i) => cmd(commands[i+1]));
            return new Function(
                '_',
                `let ${vars.join(',')};` +
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
