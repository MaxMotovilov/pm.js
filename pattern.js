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
    const tree = [], stack = [tree];
    return {
        arrayAt(key) {
            return () => stack.push(stack[stack.length-1][key] = []);
        },
        hashAt(key) {
            return () => stack.push(stack[stack.length-1][key] = {});
        },
        up(n) {
            return () => stack.splice(stack.length-n);
        },
        result(list) {
            list.forEach(list => list());
            console.log(JSON.stringify(tree));
        }
    }
}
