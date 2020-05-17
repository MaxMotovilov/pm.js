"use strict";

const pattern = require('./pattern');

exports.parseTemplate =
    template => {
        if(!template.every(fragment => /^\s*$/.test(fragment)))
            throw SyntaxError("Non-space characters should not be present in the template literal");
    }

exports.parseHeading =
    source => {
        const [match] = /^function(?:\s+\w+)?/.exec(source) || [];
        return parse(
            match ? source.substr(match.length) : source,
            match ? '' : '=>'
        );
    }

// FIXME: does not handle regular expression and string template literals
function collapseCommentsAndStrings(source) {
    let inside, matchNo = 0;
    const
        strings = [],
        matches = [],
        begin = '\ufffe',
        end = '\uffff',
        suffixFor = {'//': '\n', '/*': '*/', '"': '"', "'": "'"},
        comment = repl => () => repl,
        string = value => (strings.push(value), `"${strings.length-1}"`),
        replacers = {'//': comment('\n'), '/*': comment(' '), '"': string, "'": string}

    return [
        source.replace(
            /\/\/|\/\*|\*\/|\\.|["'\n]/g,
            token => (
                token==suffixFor[inside] ? (inside = null, end) :
                !inside && token in suffixFor ? (matches.push(replacers[inside = token]), begin) :
                token
            )
        ).replace(
            /\ufffe([^\uffff]*)\uffff/g,
            (_, match) => matches[matchNo++](match)
        ),
        strings
    ];
}

const tokenMatcher = ((cache={}) =>
    (tokens, anywhere) => {
        const id = (anywhere ? '-' : '') + tokens.join('-');
        return cache[id] || (cache[id] =
            new RegExp(`\\s*(${tokens.map(toRegExp).join('|')})`, anywhere ? 'g' : 'gy')
        );
    }
)();

function toRegExp(token) {
    const symbols = {
        name: '[A-Za-z_\\$][A-Za-z0-9_\\$]*',
        string: '"\\d+"',
        number: '[+\\-]?\\s*(?:0[bB][01]+|0[xX][\\da-fA-F]+|(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+\\-]?\\d+)?)'
    }
    return symbols[token] || token.replace(/[\\()[\]{}.*+?^$]/g, '\\$&');
}

function tokenList(tokens) {
    return tokens.length==1 ? tokens[0] : tokens.slice(0, tokens.length-1).join(' ') + ' or ' + tokens[tokens.length-1];
}

const brackets = {'(':')', '[':']', '{':'}'}

function parse(source, terminator) {
    let offs=0, strings, depth=0;
    const terminators = [];

    [source, strings] = collapseCommentsAndStrings(source);

    if(terminator)
        terminators.push(terminator);

    const
        {add, drop, requireArray, finish} = pattern(),
        currentTerminator = () => terminators[terminators.length-1],
        nextToken = (...choices) => match(tokenMatcher(choices), choices),
        maybeNextToken = (...choices) => match(tokenMatcher(choices)),
        tokenAhead = (...choices) => match(tokenMatcher([...choices, ',', currentTerminator()], true), ['expression']),
        isAName = token => /[A-Za-z_\$]/.test(token[0]),
        isAString = token => token[0]=='"',
        isANumber = token => /\d|\./.test(token[0]),
        stringValue = token => strings[token.substring(1, token.length-1)];

    if(maybeNextToken('('))
        terminators.push(')');

    listedArguments();

    while(terminators.length)
        nextToken(terminators.pop());

    return finish();

    function match(regexp, mustMatch) {
        regexp.lastIndex = offs;
        const [, token] = regexp.exec(source) || [];
        if(token)
            offs = regexp.lastIndex;
        else if(mustMatch) {
            throw SyntaxError(`Expected ${tokenList(mustMatch)} after ${cleanSource(0, offs)}`);
        }
        return token;
    }

    function cleanSource(...substrArgs) {
        return source.substr(...substrArgs).replace(
            /"\d+"/g, token => '"' + stringValue(token) + '"'
        );
    }

    function listedArguments() {
        let token, index=0;

        do {
            token = nextToken('[', '{', ',', '...', 'name', currentTerminator());
            if(token!=currentTerminator() && token!=',') {
                if(token=='...') {
                    nextToken('name');
                } else {
                    add(depth, index);
                    maybeNested(token);
                }
                token = maybeInitializer();
            }
            ++index;
        } while(token==',');

        if(token!=currentTerminator())
            throw SyntaxError(`Expected ${currentTerminator()}, got ${token} in ${cleanSource(0, offs)} before ${cleanSource(offs)}`);

        terminators.pop();
    }

    function namedArguments() {
        let token;

        do {
            token = nextToken('[', '...', 'name', 'string', 'number', currentTerminator());
            if(token!=currentTerminator()) {
                if(token=='...') {
                    nextToken('name');
                } else {
                    if(token=='[') {
                        // FIXME: does not support expressions as computed property names, only numeric or string literals
                        token = nextToken('string', 'number');
                        nextToken(']');
                    }

                    add(depth, isAString(token) ? stringValue(token) : isANumber(token) ? Number(token) : token);

                    if((isAName(token) ? maybeNextToken : nextToken)(':'))
                        maybeNested(nextToken('name', '{', '['));
                }

                token = maybeInitializer();
            }
        } while(token==',');

        terminators.pop();
    }

    function maybeNested(token) {
        if(token=='[' || token=='{') {
            terminators.push(brackets[token]);
            if(token=='[')
                requireArray(depth);
            ++depth;
            if(token=='[')
                listedArguments();
            else
                namedArguments();
            --depth;
        }
    }

    function maybeInitializer() {
        // Current terminator may be =>, so match standalone = after it
        let token = nextToken(',', currentTerminator(), '=');

        if(token=='=') {
            drop(depth);
            const top = terminators.length;
            while(
                (token = tokenAhead('(', '[', '{')) in brackets ||
                top<terminators.length
            ) {
                if(token in brackets)
                    terminators.push(brackets[token]);
                else if(token==currentTerminator())
                    terminators.pop();
            }
        }

        return token;
    }
}

