# GitHub Copilot Instructions for CSS Mixin and Macro Polyfill

## Project Overview

This is a JavaScript polyfill and PostCSS plugin for [CSS @mixin, @macro, and @apply rules](https://drafts.csswg.org/css-mixins/). The polyfill provides browser support for CSS mixins and macros as specified in the W3C CSS Mixins specification.

<!-- TODO: Update this section if the official specification changes.
https://drafts.csswg.org/css-mixins/ -->

## Official WCAG CSS mixin and macro rule Specification

5. Defining Mixins
   A mixin is in many ways similar to a custom function, but rather than extending/upgrading custom properties, mixins extend/upgrade nested style rules, making them reusable and customizable with arguments.

For example, the following code sets up a mixin applying all the properties you need for a "gradient text" effect, including guarding it with supports queries:
@mixin --gradient-text(
--from <color>: mediumvioletred,
--to <color>: teal,
--angle: to bottom right,
) {
--gradient: linear-gradient(var(--angle), var(--from), var(--to));
@result {
color: var(--from, var(--to));

    @supports (background-clip: text) or (-webkit-background-clip: text) {
      background: var(--gradient, var(--from));
      color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
    }

}
}

h1 {
@apply --gradient-text(pink, powderblue);
}
Note that this example also uses a local variable --gradient, which is accessible inside the mixin to aid in readability, but won’t pollute the element’s actual styles.

This is roughly equivalent to writing a nested style rule literally into the `h1` styles:

h1 {
--from: pink;
--to: powderblue;
--angle: to bottom right;
color: var(--from, var(--to));

@supports (background-clip: text) or (-webkit-background-clip: text) {
--gradient: linear-gradient(var(--angle), var(--from), var(--to));
background: var(--gradient, var(--from));
color: transparent;
-webkit-background-clip: text;
background-clip: text;
}
}
(except that none of those custom properties actually show up in the element’s styles)

The entire @mixin feature is experimental and under active development, and is much less stable than @function. Expect things to change frequently for now.

5.1. The @mixin rule
The @mixin rule defines a mixin, and consists of a name, a list of mixin parameters, and a mixin body. (Identical to @function, save that it lacks a return type.)

<@mixin> = @mixin <function-token> <function-parameter>#? )
{
<declaration-rule-list>
}

If a default value and a parameter type are both provided, then the default value must parse successfully according to that parameter type’s syntax. Otherwise, the @mixin rule is invalid.

A @mixin rule cannot be a nested group rule; it is invalid within the body of a style rule.

5.1.1. The Mixin Prelude
The <function-token> production must start with two dashes (U+002D HYPHEN-MINUS), similar to <dashed-ident>, or else the definition is invalid.

The name of the resulting mixin is given by the name of the <function-token>. The optional mixin parameters are given by the <function-parameter> values (defaulting to an empty set).

The name of a @mixin rule is a tree-scoped name. If more than one @mixin exists for a given name, then the rule in the stronger cascade layer wins, and rules defined later win within the same layer.

If the mixin parameters contain the same <custom-property-name> more than once, then the @mixin rule is invalid.

5.1.2. The Mixin Body
The body of a mixin accepts conditional group rules, such as @media, and custom properties, providing local variables.

Note: This is identical to a function body, except for the lack of a result descriptor.

Additionally, the mixin body must contain a @result rule, giving the mixin’s substitution result. A @mixin without a @result is invalid.

Unknown properties and rules are invalid and ignored, but do not make the @mixin rule itself invalid.

5.2. The @result Rule
Within a @mixin rule, the @result rule specifies the mixin result, a nested declarations rule similar to the result descriptor in custom functions. It’s what the @apply rule will be substituted with.

<@result> = @result {
<declaration-rule-list>
}
The body of a @result rule acts as a nested declarations rule, and accepts the same properties and rules that a normal nested declarations rule would. In particular, further mixins can be invoked (via the @apply rule) within a @result.

Note: Custom properties inside of a @result actually define properties that will be emitted by the mixin; they are not local variables. They can still be accessed by var(), but as element styles, which are a lower priority than local variables or mixin parameters; see § 5.3 Arguments and Local Variables for details.

The @result body can also contain the @contents rule, allowing a contents block passed to the mixin to be substituted in.

A mixin can contain multiple @result rules, and all of them are concatenated, in order, to form the mixin result. @result rules inside of false conditional group rules are not included in the mixin result.

Note: It’s possible for a mixin to end up with an empty mixin result, because all of its @result rules are inside of false conditionals. This will simply mean the mixin substitutes with nothing, making it a no-op; weird, but not invalid.

The mixin result is a scoped style rule, with the scoping root being the element the mixin’s styles are being applied to. (Unlike a traditional @scope rule, the scoping root here can be a pseudo-element, if the mixin is being applied to one.) There are no scoping limits.

5.3. Arguments and Local Variables
Identical to function bodies, within a mixin body the var() function can access local variables (the custom properties defined in the mixin body, outside the @result rule), mixin parameters (the values passed to the mixin, or set to default values), and custom properties defined at the call site (the element recieving the mixin styles, or another mixin calling this mixin).

Just like in custom functions, earlier things in that list "win" over later things; a local variable named --foo will be seen by var(--foo) instead of a mixin parameter or custom property on the element of the same name. See § 7.2 Evaluating Mixins for details on this behavior.

For example, the following mixin use:
@mixin --shadowed-values(--color2: green, --color3: green) {
--color3: blue;
@result {
background: linear-gradient(var(--color1), var(--color2), var(--color3));
}
}
p {
--color1: red;
--color2: red;
--color3: red;
@apply --shadowed-values();
}
will produce a linear-gradient(red, green, blue) value, taking --color-1 from the outside (since nothing overrides it), --color2 from the mixin parameter (overriding the value from the element), and --color3 from the local variable in the mixin body (overriding both the value from the element and the mixin parameter of that name).

5.3.1. Variable "Hygiene"
Because mixins can apply styles to multiple elements at once, care must be taken to ensure that local variables and mixin parameters work "as expected" across the mixin’s styles, even if custom properties on the element define clashing names. Similarly, care must be taken to ensure that variables passed into a mixin, such as by @apply --mix(var(--foo)), resolve "as expected" to the custom property on the element, even if the mixin defines a local variable or mixin parameter with the same name.

To achieve this, local variables and mixin parameters in a mixin (both in the mixin body and the mixin result) are hygienically renamed, to ensure that references to them work correctly across elements and inheritance.

Hygienic renaming changes the names of local variables and mixin parameters to an unobservable, guaranteed non-clashing name, its hygienic name. (They remember their original name, however.)

If a var() in the mixin body would reference a local variable or mixin parameter with its original name, the reference is rewritten to use the hygienic name instead. The same applies to variable unit references and style() references in an if() test.

Note: This list is not necessarily exhaustive. If future features allow referencing the value of a custom property on an element, they will also be interpreted as referencing the hygienic name when used inside a mixin.

Hygienic renaming extends to nested mixins and to invoked custom functions, if they contain "unbound" variable references that would match a hygienically renamed local variable or mixin parameter. (This preserves the ability of mixins to "override" custom properties implicitly used by nested mixins or functions, the same way that nested function calls can.)

Otherwise, such "unbound" references are left undisturbed, so they’ll still match the appropriate custom property in the element context.

Note: For example, the inherit() function intrinsically reaches outside of the current context, referencing the value one "level" up. Even if a local variable with the same name exists in the current mixin, it won’t cause the inherit()'s reference to be rewritten. (But if it ends up referencing a local variable higher in the "call stack", it’ll be rewritten to coordinate with that one.)

For example, given the following styles and mixin:
@mixin --triple-border(--size <length>) {
@result {
&, & > _, & > _ > \* {
border-width: var(--size);
}
}
}
section {
@apply --triple-border(5px);
}
section > h1 {
--size: 10px;
}
section > h1 > small {
--size: 20px;
}
The mixin parameter --size is hygienically renamed, resulting in the applied styles being equivalent to something like:

section {
--f7bd60b7: 5px;
border-width: var(--f7bd60b7);
}
section > h1 {
--size: 10px;
border-width: var(--f7bd60b7);
}
section > h1 > small {
--size: 20px;
border-width: var(--f7bd60b7);
}
Even though the child and grandchild elements set the same custom property as the mixin result, they don’t influence the result. Instead, the mixin result is changed to reference an un-clashable variable name, allowing inheritance to safely transmit the original value to the descendants, ensuring that all three borders are the same size, as the author intended.

Note: While hygienic renaming ensures that descendants won’t accidentally pick up the wrong variable value, and § 7.2 Evaluating Mixins ensures that element-dependent arguments passed to the mixin (like @apply --foo(1em);) will resolve against the applying element too, using any other element-dependent reference in the mixin result will evaluate as normal for their placement in the styles.

For example, in the following variant of the previous example:
@mixin --triple-border() {
@result {
&, & > _, & > _ > \* {
border-width: .2em;
}
}
}
section {
font-size: 10px;
@apply --triple-border;
}
section > h1 {
font-size: 20px;
}
section > h1 > small {
font-size: 15px;
}
The applied mixin will be equivalent to:

section {
font-size: 10px;
border-width: .2em;
}
section > h1 {
font-size: 20px
border-width: .2em;
}
section > h1 > small {
font-size: 15px;
border-width: .2em;
}
Which will give three different border-width values: 2px, 4px, and 3px.

This is likely often a desirable behavior, but if it’s not, we should have a workaround. The following _doesn’t_ work, due to the mixin body becoming the function body of an anonymous function, which is evaluated on each element and thus inherits that element’s em length.

@function --as-length(--x <length>) returns <length> { result: var(--x); }
@mixin --triple-border() {
--em: --as-length(1em);
@result {
&, & > _, & > _ > _ {
border-width: calc(0.2 _ var(--em));
}
}
}
I think the only way that works is to have an extra argument that you don’t expect the user to pass, since arguments get lifted onto the applying element and hygienically renamed:

@mixin --triple-border(--em <length>: 1em) {
@result {
&, & > _, & > _ > _ {
border-width: calc(0.2 _ var(--em));
}
}
}
But this is clumsy. :(

5.4. The @contents Rule
In addition to accepting arguments passed by the <dashed-function> in the @apply rule, a mixin can accept a contents block. Any mixin can be passed a contents block, by giving the @apply rule invoking the mixin a block.

This allows the invoker of the mixin to pass an entire style block, which the mixin can then substitute into itself. This is useful, for example, if the mixin handles some common conditions for the author, and substitutes the contents block into a predefined @media or @container rule.

The syntax of a @contents at-rule is:

<@contents> = @contents [ { <declaration-list> } ]?

That is, it is either an empty statement ended immediately by a semicolon, or a fallback block treated as a nested declarations rule. The empty statement form behaves identically to passing an empty block.

If the @apply rule invoking the mixin passed a contents block, the @contents is replaced with the contents block, treating it as a nested declarations rule.

Otherwise (if the @apply rule did not pass a contents block), the @contents rule is replaced with its fallback block, treating it as a nested declarations rule.

Outside of an @result rule, the @contents rule is invalid and ignored.

Note: It’s valid for an @apply rule to pass a contents block, but the mixin not use it.

For example, the following mixins abstracts the cases that the page would consider to be appropriate for a "single column" layout, allowing the rest of the page to handle the case without worrying about the details, so the conditions can be adjusted in the future if necessary:
@mixin --one-column() {
@result {
@media (width <= 800px) {
@contents;
}
}
}
@mixin --two-column() {
@result {
@media (width > 800px) {
@contents;
}
}
}
body {
@apply --one-column {
display: flex;
flex-flow: column;
}
@apply --two-column {
display: grid;
grid-template-columns: ;
}
} 6. Defining Macros
A macro is a simplified variant of a mixin, that very directly substitutes its body into its @apply-ing rule.

It does not take any arguments (besides possibly a @contents block) or define local variables (and thus doesn’t use a @result rule to separate its result from its (nonexistent) body) and does not impose a "scoping" semantic on its result rules. Otherwise, it is identical to a mixin.

For simple mixins that are just meant to make it easier to include a commonly-repeated block of styles, macros can be slightly shorter/easier to use:
@macro --reset-list {
margin: 0;
padding: 0;
list-style: none;
}
.foo {
@apply --reset-list;
}
In cases like this, the _result_ of defining this as a mixin or macro are identical. That is, one could equally write this slightly more verbose definition:

@mixin --reset-list() {
@result {
margin: 0;
padding: 0;
list-style: none;
}
}
In more complex cases, though, their behaviors can differ; see § 7.4 Mixin/Macro Differences.

6.1. The @macro rule
The @macro rule defines a macro, and consists of a name and a macro body. (Similar to a mixin result block.)

<@macro> = @macro <dashed-ident>
{
<declaration-rule-list>
}
A @macro rule cannot be a nested group rule; it is invalid within the body of a style rule.

6.1.1. The Macro Prelude
The name of the resulting macro is given by the <dashed-ident> in its prelude.

The name of a @macro rule is a tree-scoped name, and functions identically to a @mixin name. Macros and mixins share the same namespace; if two are defined with the same name, the last one wins (just like having two mixins with the same name).

6.1.2. The Macro Body
The body of a @macro rule acts as a nested declarations rule, and accepts the same properties and rules that a normal nested declarations rule would. In particular, further mixins and macros can be invoked (via the @apply rule) within a @macro.

Note: This is identical to the body of a mixin’s @result rule. As macros don’t have any arguments or local variables, they don’t need to mark their result separately to distinguish local variables from custom properties that will get added to the element’s style.

Unknown properties and rules are invalid and ignored, but do not make the @macro rule itself invalid.

Identically to mixins, the body of a @macro rule can contain a @contents rule, which will substitute itself with a passed contents block, or potentially a fallback block.

The @contents example provided in § 5.4 The @contents Rule used @mixin, but it could equally be written with @macro, as it does not use any arguments:
@macro --one-column {
@media (width <= 800px) {
@contents;
}
}
@macro --two-column {
@media (width > 800px) {
@contents;
}
}
body {
@apply --one-column {
display: flex;
flex-flow: column;
}
@apply --two-column {
display: grid;
grid-template-columns: ;
}
} 7. Using Mixins and Macros
The result of a mixin or macro application is substituted into the body of another style rule as a nested declarations rule via the @apply rule.

7.1. The @apply Rule
The @apply rule applies a mixin or macro, causing it to substitute into the rule in place of the @apply rule itself.

Its grammar is:

<@apply> = @apply [ <dashed-ident> | <dashed-function> ] [ { <declaration-list> } ]?;

For example, a mixin can be applied in any of these ways:
.foo {
@apply --one;
/_ Invokes the --one mixin, with no arguments or contents. _/

@apply --two(blue);
/_ Invokes --two with one argument, and no contents. _/

@apply --three {color: red;}
/_ Invokes --three with no arguments, but with contents. _/

@apply --four(blue) {color: red;}
/_ Invokes --four with both an argument and contents. _/
}
The @apply rule is only valid in the body of a style rule or nested group rule; using it in any other context causes it to be invalid and ignored.

@apply rules are processed before any styles are applied, as they effectively modify the stylesheet itself. (Similar, in effect, to how conditional group rules adjust which properties and rules are active in a stylesheet before styles are applied.)

The @apply rule applies the mixin or macro named by the <dashed-ident> or the <dashed-function>’s name. If no such mixin or macro exists, the @apply does nothing.

If passed a <dashed-function>, the arguments passed to the <dashed-function> are mapped to the mixin’s arguments; if more arguments are passed than the length of the mixin’s argument list, the @apply application does nothing. (Passing too few arguments is fine; the missing arguments take their default values instead.) A <dashed-ident> passes no arguments. (That is, @apply --foo; is identical to @apply --foo();.) For these purposes, a macro is treated as having a zero-length argument list; @apply --my-macro(); is valid.

If the @apply rule has a <declaration-list> block, that block is passed as the mixin or macro’s contents block.

Applying a mixin without arguments, or with an empty argument list, is identical. That is, these two invocations do exactly the same thing:
.foo {
@apply --no-args;
}
.bar {
@apply --no-args();
}
Passing a contents block is not the same; omitting the block entirely triggers @contents fallback, while passing an empty block will substitute the empty block:

@mixin --just-contents() {
@result {
@contents { color: red; }
/_ `color: red` is the fallback content _/
}
}

.foo {
@apply --just-contents;
/_ fallback, substitutes with `color: red;` _/
}
.bar {
@apply --just-contents {};
/_ substitutes with nothing at all _/
}
7.2. Evaluating Mixins
At a high level, mixins are applied by substituting their contents at the location they’re @apply'd.

Unfortunately, the exact mechanics of mixin substitution are somewhat more complicated, to ensure that local references, variables, and other concepts work in a "natural" way.

When a mixin is applied, the @apply rule referencing it is replaced with the mixin result, with each property value in the mixin result having its value replaced by an anonymous custom function with the following properties:

The function parameters are identical to the mixin parameters. (The function’s invocation has some adjustments; see below.)

The function body is identical to the mixin body, minus any @result rules, plus a result descriptor containing the original value of the property this anonymous function is replacing.

Additionally, the arguments passed to the mixin are evaluated and stored on the @apply'd element, to ensure they obtain the "expected" value from that element, rather than unexpectedly evaluating in a descendant element’s context:

For every mixin parameter, a custom property is added to the top level of the mixin result, with a hygienic name and a value of the corresponding @apply() argument. This custom property is unobservable to the page; it only exists for UA purposes.

Also, a custom property registration with that name, a syntax of the parameter type, an inherit flag of "true", and no initial value, is added to the tree of that element.

Each anonymous function invocation has its arguments set to var() functions referring to the corresponding custom property name created in the previous bullet point.

For example, given the following mixin:
@mixin --same-size(--size <length>) {
@result {
&, & > _ {
width: calc(10 _ var(--size));
}
}
}
.parent {
font-size: 10px;
@apply --same-size(1em);
}
.parent > .child {
font-size: 20px;
}
This will desugar into approximately:

@property --magic-arg1 {
syntax: "<length>";
inherits: true;
/_ initial-value: don't worry about it; _/
}
@function --anonfunc1(--arg1) {
result: calc(10 _ var(--arg1));
}
@function --anonfunc2(--arg1) {
result: calc(10 _ var(--arg1));
}
.parent {
font-size: 10px;
--magic-arg1: 1em; /_ resolves based on font-size here _/
width: --anonfunc1(var(--magic-arg1));
}
.parent > .child {
font-size: 20px;
width: --anonfunc2(var(--magic-arg1));
/_ --magic-arg1 is 10px, since it was resolved on the parent _/
}
Note: In practice, this anonymous custom function can usually be completely hypothetical, and a direct substitution used instead. It’s required only to make variables and other element-relative values resolve correctly.

When mixins are nested (one invoked via @apply inside the @result of another), the desugaring nests as well, in the obvious way. For example:
div {
@apply --colorized-squish(tomato);
}

/_ "wraps" an element in colored arrows _/
@mixin --squish(--left-color <color>,
--right-color <color>: var(--left-color)) {
@result {
&::before {
content: "🡆";
background-color: var(--left-color);
}
&::after {
content: "🡄";
background-color: var(--right-color);
}
}
}

/_ colors the element, and auto-generates a border color
and the "squish" colors from it _/
@mixin --colorized-squish(--color <color>) {
@result {
background-color: var(--color);
border: 2px solid oklch(from var(--color) calc(l - 0.1) c h);
@apply --squish(oklch(from var(--color) calc(l - 0.3) c h),
oklch(from var(--color) calc(l - 0.2) c h));
}
}
This desugars in two steps, inside-out. First, the --squish() is unfolded into the --colorized-squish() mixin:

div {
@apply --colorized-squish(tomato);
}

@mixin --colorized-squish(--color <color>) {
/_ Lift the `@apply squish();` arguments out into local vars _/
--s-arg1: oklch(from var(--color) calc(l - 0.3) c h);
--s-arg2: oklch(from var(--color) calc(l - 0.2) c h);
@result {
background-color: var(--color);
border: 2px solid oklch(from var(--color) calc(l - 0.1) c h);
/_ Replace the `@apply --squish();` with its @result,
transformed to wrap the property values in
anonymous functions. _/
&::before {
content: --s1(var(--s-arg1), var(--s-arg2));
background-color: --s2(var(--s-arg1), var(--s-arg2));
}
&::after {
content: --s3(var(--s-arg1), var(--s-arg2));
background-color: --s4(var(--s-arg1), var(--s-arg2));
}
}
}
@function --s1(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: "🡆";
}
@function --s2(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: var(--left-color);
}
@function --s3(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: "🡄";
}
@function --s4(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: var(--right-color);
}
Then the --colorized-squish() mixin is unfolded into the div rule:

div {
/_ Lift the `@apply --colorized-squish();` argument out into a var _/
--cs-arg1: tomato;
/_ Replace the `@apply --colorized-squish();` with (part of)
its @result, again with values wrapped in anonymous functions. _/
background-color: --cs1(var(--cs-arg1));
border: --cs2(var(--cs-arg1));
&::before {
/_ Note that --cs-arg1 is inherited here from div _/
content: --cs3(var(--cs-arg1));
background-color: --cs4(var(--cs-arg1));
}
&::after {
content: --cs5(var(--cs-arg1));
background-color: --cs6(var(--cs-arg1));
}
}
@function --cs1(--color <color>) {
result: var(--color);
}
@function --cs2(--color <color>) {
result: 2px solid oklch(from var(--color) calc(l - 0.1) c h);
}

/_ These four generated functions all look identical, they
just call into the correct generated function from
--squish()'s unfolding. _/
@function --cs3(--color <color>) {
/_ The --colorized-squish() local vars (created by the
first desugaring) are turned into function local vars. _/
--s-arg1: oklch(from var(--color) calc(l - 0.3) c h);
--s-arg2: oklch(from var(--color) calc(l - 0.2) c h);
result: --s1(var(--s-arg1), var(--s-arg2));
}
@function --cs4(--color <color>) {
--s-arg1: oklch(from var(--color) calc(l - 0.3) c h);
--s-arg2: oklch(from var(--color) calc(l - 0.2) c h);
result: --s2(var(--s-arg1), var(--s-arg2));
}
@function --cs5(--color <color>) {
--s-arg1: oklch(from var(--color) calc(l - 0.3) c h);
--s-arg2: oklch(from var(--color) calc(l - 0.2) c h);
result: --s3(var(--s-arg1), var(--s-arg2));
}
@function --cs6(--color <color>) {
--s-arg1: oklch(from var(--color) calc(l - 0.3) c h);
--s-arg2: oklch(from var(--color) calc(l - 0.2) c h);
result: --s4(var(--s-arg1), var(--s-arg2));
}

/_ These are copied from the previous desugaring _/
@function --s1(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: "🡆";
}
@function --s2(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: var(--left-color);
}
@function --s3(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: "🡄";
}
@function --s4(--left-color <color>,
--right-color <color>: var(--left-color)) {
result: var(--right-color);
}
Note that all the custom property and function names are given short, somewhat meaningful names here, for readability, but actually are hygienically renamed and guaranteed to be unreferencable by author code. Only the user agent ever sees or can use them, to do this desugaring.

Desugaring outside-in
7.3. Evaluating Macros
Macros work similarly to mixins, in that they substitute their macro body at the location they’re @apply'd. Contrary to mixins, macros are substituted simply and literally, with no transforms performed on their content.

7.4. Mixin/Macro Differences
The basic differences between mixins and macros are obvious:

Mixins can take arguments; macros can’t.

Mixins can have local variables, and wrap their result in @result; macros don’t, and just use their contents directly as their result.

The subtler difference is that, because mixins have arguments and local variables which they don’t want to "leak" into the page’s general styles, and which they want to resolve on the applying element (so var() functions, em values, etc passed as arguments or set as locals all work "as expected"), they treat their results as scoped style rules. Macros don’t impose this restriction, which makes them useful in some cases where mixins can’t be used, but which also limits their abilities in some other cases.

For example, the following mixin and macro are identical:
@mixin --mix1() {
@result {
width: 20em; > .bar {
width: 10em;
}
}
}
@macro --mac1() {
width: 20em;

> .bar {

    width: 10em;

}
}
.foo {
@apply --mix1; /_ or --mac1 _/
font-size: 20px;
/_ width is 20em, so 400px _/

> .bar {

    font-size: 10px;
    /* width is 10em, so 100px;

}
}
Despite the mixin/macro _appearing_ to set the .bar child to half the .foo parent’s width, because they use em units and the elements have different font-size values, the child ends up 1/4 the width of the parent instead.

The mixin could be rewritten like this:

@function --as-length(--x <length>) { result: var(--x); }
@mixin --mix2() {
--em: --as-length(1em);
@result {
width: 20--em; /_ using custom units _/ > .bar {
width: 10--em;
}
}
}
.foo {
@apply --mix2;
font-size: 20px;
/_ width is 20--em and --em is 20px, so 400px _/

> .bar {

    font-size: 10px;
    /* width is 10--em and --em is still 20px, so 200px;

}
}
...which resolves the --em local variable on .foo (to a length of 20px), and then uses that in both places. A macro cannot reproduce this, unless you actually emit a --em custom property onto the element, where styles outside of the macro could see it.

On the other hand, the following can be done with a macro:

@macro --mac2() {
width: 20em;

- .bar { /_ sibling, not child! _/
  width: 10em;
  }
  }
  .foo {
  @apply --mac2;
  font-size: 20px;
  /_ width is 20em, so 400px _/
- .bar { /_ again, sibling! _/
  font-size: 10px;
  /\* width is 10em, so 100px;
  }
  }
  A mixin can’t reproduce this, unless you lift it up to applying on a parent element, with the mixin styling its two children.

## Project Structure and Key Components

### Core Packages

- `packages/css-mixin-polyfill/` - Main JavaScript polyfill
- `packages/postcss-transform-mixins/` - PostCSS plugin for build-time transformation
- `packages/stylelint-config-mixin/` - Stylelint configuration for linting CSS mixinusage

### Key Files

- `packages/css-mixin-polyfill/src/index.js` - Main polyfill runtime
- `packages/css-mixin-polyfill/src/transform.js` - CSS transformation logic
- `test/fixtures/` - CSS test fixture pairs (_.input.css / _.expected.css)
- `test/fixtures-validation/` - Playwright-based browser validation tests

### Testing Infrastructure

- Vitest for unit tests
- Playwright for browser-based fixture validation
- XO for linting (strict ESLint configuration)

## Syntax Rules and Implementation Guidelines

### CSS mixin Syntax

When working with CSS mixins, always follow the official WCAG specification syntax as included in the previous section "Official WCAG CSS mixin Specification".

### Code Style Requirements

- Use ES modules with modern JavaScript syntax
- Follow XO linting rules (extends ESLint strict configuration)
- Use `/* eslint-disable rule-name */` blocks only when necessary for browser automation
- Prefer functional programming patterns
- Use meaningful variable names and comprehensive JSDoc comments, instead of TypeScript within our source code, but still provide type definitions for public APIs

### Testing Requirements

- All new CSS syntax must have corresponding fixture pairs in `test/fixtures/`
- Fixture files must follow naming convention: `name.input.css` / `name.expected.css`
- Browser validation tests must pass in Chromium, Firefox, and WebKit
- Unit tests should cover edge cases and error conditions

### Browser Compatibility

- Support modern browsers with ES module capability
- Graceful degradation for older browsers via UMD build
- Auto-initialization in browser environments
- Clean cleanup of event listeners and observers

## Development Workflow

1. **CSS Syntax Changes**: Update both polyfill logic and PostCSS plugin
2. **New Features**: Add fixture tests first, then implement functionality
3. **Bug Fixes**: Create minimal reproduction test case before fixing
4. **Performance**: Profile with large CSS files and many DOM elements

## Important Implementation Notes

### Polyfill Behavior

- Must evaluate conditions at runtime based on current browser state
- Should handle dynamic viewport changes for media queries
- Must respect CSS cascade and specificity rules
- Should not interfere with native CSS mixin or macro support when available

### Error Handling

- Debug mode should provide helpful error messages
- Should not break page rendering on malformed CSS

### Performance Considerations

- Minimize DOM queries and style recalculations
- Cache compiled CSS transformations when possible

## File Naming and Organization

- Use kebab-case for files and directories
- Suffix test files with `.test.js`
- Suffix fixture files with `.input.css` / `.expected.css`
- Group related functionality in dedicated directories
- Keep configuration files at appropriate levels (root, package, or feature-specific)

## When Making Changes

1. **Always** check the WCAG specification above for syntax correctness
2. **Always** add fixture tests for new CSS functionality
3. **Always** run the full test suite including browser validation
4. **Always** update documentation when changing public APIs
5. **Always** bear in mind that the developer's main job is to read, not write, code. Therefore, avoid unnecessary complexity, abbreviations and short forms of parameters, for example in CLI usage.
6. **Always** try to avoid setting up separate fixtures for each output (Polyfill, PostCSS plugin or Lightning CSS plugin) and use the same fixture for all of them if possible. If there are any differences, try changing the fixture so that it can be used for all of them. For example, change the colour values in the fixture so that they produce the same output.
7. **Consider** performance impact on large stylesheets and DOM trees

This project aims to provide a complete, specification-compliant implementation of CSS mixinality for browsers that don't yet support it natively.
