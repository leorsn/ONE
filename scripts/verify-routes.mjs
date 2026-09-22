import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? files(name) : /\.tsx?$/.test(name) ? [name] : [];
  });
}
const routes = new Set(['/']);
for (const file of files('app')) {
  if (/\/(?:_|\+)/.test(file)) continue;
  const route = '/' + file.slice(4).replace(/\.tsx?$/, '').replace(/\/?index$/, '');
  routes.add(route);
  routes.add(route.replace(/\/\([^/]+\)/g, '') || '/');
}
const missing = [];
let checked = 0;
function inspect(value, file) {
  if (!value) return;
  if (ts.isAsExpression(value) || ts.isParenthesizedExpression(value)) return inspect(value.expression, file);
  if (ts.isConditionalExpression(value)) { inspect(value.whenTrue, file); inspect(value.whenFalse, file); return; }
  if (ts.isObjectLiteralExpression(value)) {
    for (const prop of value.properties) if (ts.isPropertyAssignment(prop) && prop.name.getText().replace(/['"]/g, '') === 'pathname') inspect(prop.initializer, file);
  }
  if (ts.isStringLiteralLike(value) && value.text.startsWith('/')) {
    checked++;
    const target = value.text.split(/[?#]/)[0];
    if (!routes.has(target)) missing.push(`${file}: ${target}`);
  }
}
for (const file of [...files('app'), ...files('src')]) {
  const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isCallExpression(node) && /^router\.(push|replace|navigate)$/.test(node.expression.getText(tree))) inspect(node.arguments[0], file);
    if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'href' && node.initializer) inspect(ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer, file);
    ts.forEachChild(node, visit);
  }
  visit(tree);
}
if (missing.length) throw new Error(`Unresolved routes:\n${missing.join('\n')}`);
console.log(`Verified ${checked} literal navigation targets against ${routes.size} route paths. Dynamic params still require runtime/device acceptance.`);
