const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('app.js', 'utf8');
const ast = acorn.parse(code, { ecmaVersion: 2022, locations: true });

function walk(node) {
    if (!node) return;
    if (node.loc && node.loc.end.line === 12879) {
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression' || node.type === 'BlockStatement' || node.type === 'IfStatement' || node.type === 'AssignmentExpression') {
            console.log(`Node ${node.type} at line ${node.loc.start.line} spans to the end of the file!`);
        }
    }
    for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
            walk(node[key]);
        }
    }
}
walk(ast);
