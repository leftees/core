/* Example of how to parse, manipulate and generate code with sourcemap support */

//V: Stores original source code
//H: The whole example depends on this code - DO NOT EDIT
var code = "var t = 0;\nt++;";

//O: Stores the generated AST from code
var ast = native.parser.js.parse(code,{ 'attachComment': true, 'range': true, 'comment': true, 'loc': true, 'tag': true, 'source': 'test.js' });

//C: Manipulating the code: changing the var name, adding an expression statement between original lines, switching position of the two original lines
ast.body[0].declarations[0].id.name = 'da'
ast.body.push(ast.body[1]);
ast.body[1] = {};
ast.body[1].type = "ExpressionStatement";
ast.body[1].expression = {
    prefix: false,
    type: "UpdateExpression",
    operator: "++",
    argument: { name: "l", type: "Identifier" }
};
ast.body.push(ast.body[0]);
ast.body[0]=ast.body[2];

//C: Generating new code from AST and getting sourcemap
var gen = native.parser.js.codegen(ast, {
    format: {
        indent: {
            style: '  ',
            base: 0,
            adjustMultilineComment: false
        },
        newline: '\n',
        space: ' ',
        json: false,
        renumber: false,
        hexadecimal: false,
        quotes: 'single',
        escapeless: false,
        compact: false,
        parentheses: !false,
        semicolons: !false,
        safeConcatenation: true
    },
    parse: null,
    comment: !false,
    tag: false,

    sourceMap: true,
    sourceMapRoot: null,
    sourceMapWithCode: true,
    sourceContent: code,

    directive: false,
    verbatim: undefined
});

//V: Stores the new code as string
var generated = gen.code;

//V: Stores the sourcemap code as string
var map = gen.map.toString();

//C: Creating a sourcemap consumer to test code
var smc = new native.parser.js.sourcemap.SourceMapConsumer(gen.map.toJSON());
smc.originalPositionFor({ line: 1, column: 1});
