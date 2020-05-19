# pm.js
Prototype: pattern matching as an extension of the ES6 destructuring

## TL;DR

```javascript
const {distinct} = require('pm.js');

const adoptCatOrDog = distinct`${
    ({cat: {name}}) => adoptCat(name)
}${
    ({dog: {name}}) => adoptDog(name)
}`;
```

is an equivalent of

```javascript
const adoptCatOrDog = ({cat, dog}) => {
    if(cat && dog)
        throw TypeError("More than one alternative matches");
    return cat ? adoptCat(cat.name) : adoptDog(dog.name);
}
```

```javascript
const {firstOf} = require('pm.js');

const findByNameOrAddress = firstOf`${
    ({name: {first, last}}) => findByName(first, last)
}${
    ({address: {street, city, state}}) => findByAddress(street, city, state)
}${
    () => null
}`;
```

is an equivalent of

```javascript
const findByNameOrAddress = ({name, address}) {
    return name ? findByName(name.first, name.last)
         : address ? findByAddress(address.street, adress.city, address.state)
         : null;
}
```

## Rationale

ES6 destructuring provides the basics of the [pattern matching](https://en.wikipedia.org/wiki/Pattern_matching) syntax for variable initializations,
assignments and function calls. It does not, however, provide the key ability to select matching pattern from the set of alternatives based on
supplied data. This library seeks to prototype this ability with minimum of tooling in order to evaluate its usefulness in the context of JavaScript.

## API

The library exports two freestanding functions, `firstOf()` and `distinct()`, intended to be used as tags for
[ES6 template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). The template strings must not contain
anything other than whitespace and function definitions as placeholder expressions. Either of the tagged templates evaluate to a wrapper function
that calls exactly one of the supplied alternative function definitions passing it the argument values and `this` it received from the caller, or throws a
`TypeError` exception.

Either `firstOf()` or `distinct()` guarantee that the definition it selects is able to complete its argument destructuring: that is, no attempt will
be made to match a structured array (`[`_fields..._`]`) or object (`{`_fields..._`}`) member without an explicit initializer against a non-conformal value.
Array members require a matching array-like data value (verified via `Array.isArray()`) and the object members require a non-null object value. In short
the library prevents the ES6 runtime from throwing an exception due to an unsuccessful destructuring of the function arguments.

Both `firstOf()` and `distinct()` ignore non-structured members, `...rest`,  or explicitly initialized structured members for the purposes of the match.
This is in  keeping with the ES6 runtime behavior for argument destructuring: binding arguments to `undefined` values as well as to data values inside
the initializer provided for an ancestor member. No attempt is made to check or enforce any restrictions on the resulting _argument values_ (although
this capability may be an important future addition to this library), only on the feasibility of performing the destructuring.

Either `firstOf` or `distinct()` throw a `TypeError` when _none_ of the provided alternatives can be successfully called with supplied arguments. The
difference between the two APIs is in the behavior when _more than one_ of the alternatives can potentially work. In this case, `firstOf()` executes
the first matching alternatice, based on the order of placeholders in the template literal, and `distinct()` throws a `TypeError` exception.

## Implementation notes

* No extended JavaScript syntax is proposed hereby: the implementation is intentionally a runtime facility rather than an extension to a build tool, such as
[Babel transpiler](https://babeljs.io/) to make trying it in different contexts as simple as possible. The library has no runtime dependencies, other than
the ES6 features it uses: destructuring syntax, template literals and `WeakMap`.

* The implementation uses the somewhat awkward syntax based on template literals for performance reasons: the analysis of the supplied alternate
function bodies is performed only once during first call and the resulting wrapper function is cached, relying on the stability and
uniqueness guarantees for the first argument of tag function.

* [A relatively simple parsing code](parse.js) for the function declarations supports a wide subset of ES6 syntax -- comments, anonymous and
named functions, arrow functions, arbitrary initializing expressions, member renaming, rest, quoted property names in object members -- but introduces
a number of restrictions:

 * No template literals in initializers;
 * No regular expression literals in initializers;
 * No computed object property names; the `[`_property_`]:`_alias_ syntax is supported only when _property_ is a valid string or numeric literal. This
last restriction is more of a semantic than a syntax issue as references to closure variables from the computed property name could not be resolved
from the wrapper code without using `eval()`.

* Do not pass dynamically computed \[function\] values into template placeholders: they are cached alongside the template on first call.

