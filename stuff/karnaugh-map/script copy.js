const MAP_CONTAINER_CLASS = "grid w-fit";
const MAP_CONTENT_CONTAINER_CLASS =
  "col-start-2 row-start-2 grid w-fit divide-x divide-y divide-amber-500/40 border-t-2 border-l-2 border-amber-500 relative";
const MAP_COL_HEADER_CONTAINER_CLASS =
  "grid grid-rows-1 divide-x divide-transparent border-l-2 border-transparent";
const MAP_ROW_HEADER_CONTAINER_CLASS =
  "row-start-2 col-start-1 grid grid-cols-1 divide-y divide-transparent border-t-2 border-transparent";
const MAP_CONTENT_CELL_CONTAINER_CLASS =
  "bg-amber-600/10 place-self-stretch relative h-16 w-16 flex items-center justify-center";
const MAP_CONTENT_CELL_OUTPUT_CLASS = "text-lg";
const MAP_CONTENT_CELL_TERM_CLASS = "text-sm absolute bottom-1 right-2";

const mapContentContainer = document.getElementById("map-content-container");
const mapColHeaderContainer = document.getElementById(
  "map-col-header-container"
);
const mapRowHeaderContainer = document.getElementById(
  "map-row-header-container"
);
const outputExpression = document.getElementById("output-expression");
const expressionInputElement = document.getElementById("expression-input");

var expressions = Array("a'b'c'd'+a'b'c'd+a'bc'd+a'bcd");
var variables = [];
var minTerms = [];
var map = [];
var i = 0;

getOutput();

function executeButtonClick() {}

function getOutput() {
  let currExpression = expressions[expressions.length - 1];
  currExpression = normalizeExpression(currExpression);
  let currTerms = currExpression
    .split("+")
    .map((v) => Array.from(v).map((d) => booleanRepFromNormalized(d)));
  let xorCurrTerms = currTerms
    .slice(0, currTerms.length - 1)
    .map((v, i) => xor(v, currTerms[i + 1]));
  let changedCurrTerms = xorCurrTerms.reduce((p, c) =>
    c.map(
      (x, i) => (p[i] ? x | p[i] : x),
      xorCurrTerms.map(() => 0)
    )
  );
  console.log(currTerms, changedCurrTerms);
}

function normalizeExpression(exp) {
  exp = (exp ?? "a").toUpperCase().replace(/ /g, "");
  (exp.match(/[A-Z]'/g) ?? []).forEach((match) => {
    exp = exp.replace(match, match[0].toLowerCase());
  });
  exp =
    exp.indexOf("+") === exp.length - 1 ? exp.slice(0, exp.length - 1) : exp;
  return exp;
}

function denormalizeExpression(exp) {
  exp = (exp ?? "a'").replace(/ /g, "");
  (Array.from(new Set(exp.match(/[a-z]/g))) ?? []).forEach((match) => {
    exp = exp.replace(RegExp(match, "g"), match + "'");
  });
  return exp;
}

function booleanRepFromNormalized(n) {
  return n.toLowerCase() === n ? 0 : 1;
}

function xor(a, b) {
  return a.map((v, i) => v ^ b[i]);
}
