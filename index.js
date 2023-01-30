import * as fs from "fs";
import * as acorn from "acorn";

const content = fs.readFileSync("./app.svelte", "utf-8");
const ast = parse(content);
const analysis = analyze(ast);
const js = generate(ast, analysis);

fs.writeFileSync("./app.js", js, "utf-8");

function parse() {
  let i = 0;
  const ast = {};
  ast.html = parseFragments(() => i < content.length);

  return ast;

  function parseFragments(condition) {
    const fragments = [];
    while (condition()) {
      const fragment = parseFragment();
      if (fragment) {
        fragments.push(fragment);
      }
    }
    return fragments;
  }
  function parseFragment() {
    return parseScripts() ?? parseElement() ?? parseExpression() ?? parseText();
  }
  function parseScripts() {
    if (match("<script>")) {
      eat("<script>");
      const startIndex = i;
      const endIndex = content.indexOf("</script>", i);
      const code = content.slice(startIndex, endIndex);
      ast.script = acorn.parse(code, { ecmaVersion: 2022 });
      eat("</script>");
    }
  }
  function parseElement() {
    if (match("<")) {
      eat("<");
      const tagName = readWhileMatching(/[a-z]/);
      const attributes = parseAttributesList();
      eat(">");

      const endTag = `</${tagName}>`;

      const element = {
        type: "Element",
        name: tagName,
        attributes,
        children: parseFragments(() => !match(endTag)),
      };

      eat(endTag);

      return element;
    }
  }
  function parseAttributesList() {
    const attributes = [];
    skipWhiteSpaces();
  }
  function parseExpression() {}
  function parseText() {}
  function parseJavascript() {}

  function match(str) {
    return content.slice(i, i + str.length) === str;
  }

  function eat(str) {
    if (match(str)) {
      i += str.length;
    } else {
      throw new Error(`Parse error: expecting "${str}"`);
    }
  }

  function readWhileMatching(regex) {
    let startIndex = i;
    while (regex.text(content[i])) {
      i++;
    }

    return content.slice(startIndex, i);
  }

  function skipWhiteSpaces() {
    readWhileMatching(/[\s\n]]/);
  }
}
function analyze(ast) {}
function generate(ast, analysis) {}
