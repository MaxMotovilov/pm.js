"use strict";

module.exports = function() {
    const tree = {}, stack = [{tree}];

    return {
        add(depth, key) {
            while(stack.length>depth+1)
                stack.pop();
            if(stack.length!=depth+1)
                throw Error(`BUG: nothing at depth ${depth} (inserting ${key})`);
            if(!stack[depth].tree) {
                if(depth<1)
                    throw Error(`BUG: orphaned key ${stack[depth]} at root  (inserting ${key})`);
                stack[depth] = {key: stack[depth], tree: (
                    stack[depth-1].tree[stack[depth]]={}
                )}
            }
            stack.push(key);
        },

        drop(depth) {
            while(stack.length>depth+2)
                stack.pop();
            if(stack.length!=depth+2)
                throw Error(`BUG: no key at depth ${depth}`);
            if(stack[depth+1].key)
                delete stack[depth].tree[stack[depth+1].key];
            stack.pop();
        },

        requireArray(depth) {
            if(stack.length!=depth+2 || stack[depth+1].tree)
                throw Error(`BUG: stack out of sync at ${depth}`);
            stack[depth+1] = {key: stack[depth+1], tree: (
                stack[depth].tree[stack[depth+1]]=[]
            )}
        },

        finish() {
            console.log(JSON.stringify(tree));
        }
    }
}

