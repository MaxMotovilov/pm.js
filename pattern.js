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
    return {
        arrayAt: key => ({arrayAt}) => arrayAt(key),
        hashAt: key => ({hashAt}) => hashAt(key),
        up: n => ({up}) => up(n),

        result(commands) {
            return args => {
                const
                    stack = [args],
                    implementations = {
                        arrayAt(key) {
                            const value = stack[stack.length-1][key];
                            return Array.isArray(value) && stack.push(value);
                        },
                        hashAt(key) {
                            const value = stack[stack.length-1][key];
                            return value && typeof value==='object' && stack.push(value);
                        },
                        up(n) {
                            stack.splice(-n);
                            return true;
                        }
                    }
                return commands.every(command => command(implementations));
            }
        }
    }
}
