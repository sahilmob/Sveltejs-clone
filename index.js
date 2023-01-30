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
      i = endIndex;
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

    while (!match(">")) {
      attributes.push(parseAttribute());
      skipWhiteSpaces();
    }

    return attributes;
  }

  function parseAttribute() {
    const name = readWhileMatching(/[^=]/);
    eat("={");
    const value = parseJavascript();
    eat("}");

    return {
      type: "Attribute",
      name,
      value,
    };
  }

  function parseExpression() {
    if (match("{")) {
      eat("{");
      const expression = parseJavascript();
      eat("}");
      return {
        type: "Expression",
        expression,
      };
    }
  }

  function parseText() {
    const text = readWhileMatching(/[^<{]/);
    if (text.trim() !== "") {
      return {
        type: "Text",
        value: text,
      };
    }
  }
  function parseJavascript() {
    const js = acorn.parseExpressionAt(content, i, { ecmaVersion: 2020 });
    i = js.end;
    return js;
  }

  function match(str) {
    return content.slice(i, i + str.length) === str;
  }

  function eat(str) {
    if (match(str)) {
      i += str.length;
    } else {
      throw new Error(
        `Parse error: expecting "${str}" got "${content.slice(
          i,
          i + str.length
        )}"`
      );
    }
  }

  function readWhileMatching(regex) {
    let startIndex = i;
    while (i < content.length && regex.test(content[i])) {
      i++;
    }

    return content.slice(startIndex, i);
  }

  function skipWhiteSpaces() {
    readWhileMatching(/[\s\n]/);
  }
}
function analyze(ast) {}
function generate(ast, analysis) {}
