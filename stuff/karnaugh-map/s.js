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

var expressions = Array("a'b'c'd'+a'b'c'd+a'bc'd+a'bcd");
var end = false;
var variableSets = [];
var inputMinTermSets = [];
var adjacentSets = [];
var map = [];
var i = 0;

const expressionInputElement = document.getElementById("expression-input");

getOutput();

function executeButtonClick() {
  if (expressionInputElement.value === "") return;
  expressions = [];
  expressions.push(expressionInputElement.value);
  end = false;
  getOutput();
}

function getOutput() {
  if (expressions.length === 0) return;
  let currExpression = getNormalizedExpression(
    expressions[expressions.length - 1]
  );
  variableSets.push(getVariables(currExpression));
  inputMinTermSets.push(
    getMinTerms(currExpression, variableSets[variableSets.length - 1])
  );
  console.log(inputMinTermSets);
  getMap();
}

function getMap() {
  const mapColCount = Math.pow(
    2,
    Math.ceil(variableSets[variableSets.length - 1].length / 2)
  );
  const mapRowCount =
    Math.floor(variableSets[variableSets.length - 1].length / 2) * 2;

  const rowVars = variableSets[variableSets.length - 1].slice(
    0,
    Math.floor(variableSets[variableSets.length - 1].length / 2)
  );
  const colVars = variableSets[variableSets.length - 1].slice(
    Math.floor(variableSets[variableSets.length - 1].length / 2),
    variableSets[variableSets.length - 1].length
  );

  const rowCombinations = getCombinations(rowVars);
  const colCombinations = getCombinations(colVars);

  map = [];
  for (let i = 0; i < mapRowCount; i++) {
    for (let j = 0; j < mapColCount; j++) {
      const minTermValue = combinationExists(
        rowCombinations[getGreyCode(i, rowVars.length)] +
          colCombinations[getGreyCode(j, colVars.length)],
        inputMinTermSets[inputMinTermSets.length - 1]
      )
        ? "1"
        : "0";
      map.push([i, j, minTermValue]);
    }
  }

  let adjs = [];
  for (let termIndex = 0; termIndex < map.length; termIndex++) {
    const term = map[termIndex];
    if (term[2] !== "1") continue;
    let adj = [];
    for (let rowIndex = -mapRowCount; rowIndex <= mapRowCount; rowIndex++) {
      const match = map.find(
        (mi) =>
          mi[0] === term[0] + rowIndex && mi[1] === term[1] && mi[2] === "1"
      );
      if (match) adj.push(match);
    }
    if (checkValidAdj(adjs, adj, mapRowCount, mapColCount)) adjs.push(adj);
    adj = [];
    for (let colIndex = -mapRowCount; colIndex <= mapColCount; colIndex++) {
      const match = map.find(
        (mi) =>
          mi[0] === term[0] && mi[1] === term[1] + colIndex && mi[2] === "1"
      );
      if (match) adj.push(match);
    }
    if (checkValidAdj(adjs, adj, mapRowCount, mapColCount)) adjs.push(adj);
  }
  adjacentSets.push(adjs);
  updateDisplay(
    variableSets[variableSets.length - 1],
    inputMinTermSets[inputMinTermSets.length - 1],
    adjs
  );

  let out = "";
  adjs.forEach((a) => {
    let xors = [];
    for (let i = 0; i < a.length - 1; i++) {
      const currC = a[i];
      const nextC = a[i + 1];

      const currTermGreyCode = Array.from(
        [
          getGreyCode(currC[0], rowVars.length),
          getGreyCode(currC[1], colVars.length),
        ].join("")
      );
      const nextTermGreyCode = Array.from(
        [
          getGreyCode(nextC[0], rowVars.length),
          getGreyCode(nextC[1], colVars.length),
        ].join("")
      );

      xors.push(currTermGreyCode.map((fT, j) => nextTermGreyCode[j] ^ fT));
    }

    const changed = xors.reduce(
      (px, cx) => cx.map((x, i) => (px[i] ? x | px[i] : x)),
      xors.map((v) => 0)
    );
    let comb = "";

    changed.forEach((c, i) => {
      if (c !== 0) return;
      if (i <= Math.floor(a[0].length / 2)) {
        comb += rowCombinations[getGreyCode(a[0][0], rowVars.length)][i];
      } else {
        comb +=
          colCombinations[getGreyCode(a[0][1], colVars.length)][i - a.length];
      }
    });

    comb = repFromExpression(comb);
    out += comb + "+";
  });
  out = out.slice(0, out.length - 1);
  if (out === "" || expressions[expressions.length - 1] === out) {
    if (expressions[expressions.length - 1] === out) {
      expressions = expressions.slice(0, expressions.length - 1);
    }
    outputExpression.value = expressions[expressions.length - 1].toUpperCase();
    updateDisplay(variableSets[0], inputMinTermSets[0], adjacentSets[0]);
  } else {
    expressions.push(out);
    updateDisplay(
      variableSets[variableSets.length - 1],
      inputMinTermSets[inputMinTermSets.length - 1],
      adjs
    );
    getOutput();
  }
}

// function getDiff(){
//   let exp = expressions[expressions.length-1];
//   exp = exp.includes('+')?exp.split('+'):exp;
//   let currExpression = getNormalizedExpression(
//     expressions[expressions.length - 1]
//   );
//   variableSets.push(getVariables(currExpression));
//   inputMinTermSets.push(
//     getMinTerms(currExpression, variableSets[variableSets.length - 1])
//   );
// }

function getNormalizedExpression(expression) {
  if (expression === "") return;
  let currExpression = expression;
  currExpression = (currExpression ?? "a").toUpperCase().replace(/ /g, "");
  (currExpression.match(/[A-Z]'/g) ?? []).forEach((match) => {
    currExpression = currExpression.replace(match, match[0].toLowerCase());
  });
  return currExpression;
}

function getVariables(expression) {
  const varMatchs = expression.match(/([a-z]|[A-Z])/g);
  if (varMatchs === null) return;
  return Array.from(
    new Set(expression.match(/([a-z]|[A-Z])/g).map((v) => v.toUpperCase()))
  );
}

function getMinTerms(expression, currVariables) {
  let currInputMinTerms = [];
  let currMinTerms = expression.split("+");
  currMinTerms.forEach((v) => {
    if (v === "") return;
    if (currVariables.length > v.length) {
      currInputMinTerms = [
        ...currInputMinTerms,
        ...Object.values(
          getCombinations(
            currVariables.filter((cv) => !v.toUpperCase().includes(cv)),
            {
              [valueFromVariable(v).toString()]: v,
            }
          )
        ),
      ];
    } else currInputMinTerms.push(v);
  });
  return currInputMinTerms;
}

function updateDisplay(currVariables, currInputMinTerms, currAdjacents) {
  const mapColCount = Math.pow(2, Math.ceil(currVariables.length / 2));
  const mapRowCount = Math.floor(currVariables.length / 2) * 2;

  const rowVars = currVariables.slice(0, Math.floor(currVariables.length / 2));
  const colVars = currVariables.slice(
    Math.floor(currVariables.length / 2),
    currVariables.length
  );

  const rowCombinations = getCombinations(rowVars);
  const colCombinations = getCombinations(colVars);

  document.getElementById("map-row-term").value = repFromExpression(
    rowVars.join("")
  );
  document.getElementById("map-col-term").value = repFromExpression(
    colVars.join("")
  );

  document.getElementById(
    "map-container"
  ).className = `${MAP_CONTAINER_CLASS} grid-cols-${
    mapColCount + 1
  } grid-rows-${mapRowCount + 1}`;

  refreshContainer(
    mapContentContainer,
    `${MAP_CONTENT_CONTAINER_CLASS} col-span-${mapColCount} row-span-${mapRowCount} grid-cols-${mapColCount} grid-rows-${mapRowCount}`
  );

  refreshContainer(
    mapColHeaderContainer,
    `${MAP_COL_HEADER_CONTAINER_CLASS} col-span-${mapColCount} grid-cols-${mapColCount}`
  );

  refreshContainer(
    mapRowHeaderContainer,
    `${MAP_ROW_HEADER_CONTAINER_CLASS} row-span-${mapRowCount} grid-rows-${mapRowCount}`
  );

  for (let i = 0; i < mapRowCount; i++) {
    for (let j = 0; j < mapColCount; j++) {
      const rowGreyCode = getGreyCode(i, rowVars.length);
      const colGreyCode = getGreyCode(j, colVars.length);

      const curr = document.createElement("div");
      curr.className = MAP_CONTENT_CELL_CONTAINER_CLASS;

      const currOut = document.createElement("output");
      currOut.className = MAP_CONTENT_CELL_OUTPUT_CLASS;
      currOut.value = combinationExists(
        rowCombinations[rowGreyCode] + colCombinations[colGreyCode],
        currInputMinTerms
      )
        ? "1"
        : "0";

      const currTerm = document.createElement("output");
      currTerm.className = MAP_CONTENT_CELL_TERM_CLASS;
      currTerm.innerHTML = `m<sub>${Number(
        "0b" + rowGreyCode + colGreyCode
      )}<sub/>`;

      curr.append(currOut, currTerm);
      mapContentContainer.appendChild(curr);

      if (i === 0)
        appendMapColHeaderContainerChild(
          colCombinations[getGreyCode(j, colVars.length)],
          mapColHeaderContainer
        );
    }
    appendMapColHeaderContainerChild(
      rowCombinations[getGreyCode(i, rowVars.length)],
      mapRowHeaderContainer
    );
  }

  currAdjacents.forEach((a) => {
    const marker = document.createElement("div");
    const colDist = Math.abs(a[0][1] - a[a.length - 1][1]);
    const rowDist = Math.abs(a[0][0] - a[a.length - 1][0]);
    marker.className = `absolute top-[${a[0][0] * 4}rem] left-[${
      a[0][1] * 4
    }rem] w-[${Math.abs(
      (rowDist === 0 ? a.length : rowDist === a.length - 1 ? 1 : rowDist) * 4 -
        0.5
    )}rem] h-[${Math.abs(
      (colDist === 0 ? a.length : colDist === a.length - 1 ? 1 : colDist) * 4 -
        0.5
    )}rem] m-1 rounded z-20 !border-2 !border-emerald-500`;
    mapContentContainer.appendChild(marker);
  });
}

function refreshContainer(container, containerClass) {
  container.innerHTML = "";
  container.className = containerClass;
}

function appendMapColHeaderContainerChild(colComb, container) {
  const curr = document.createElement("div");
  const currExp = document.createElement("p");
  const currValue = document.createElement("p");
  curr.className =
    "place-self-stretch relative h-16 w-16 flex flex-col items-center justify-end pb-2";
  currExp.className = "text-sm";
  currExp.textContent = repFromExpression(colComb);
  currValue.className = "text-xs";
  currValue.textContent = valueFromExpression(colComb);
  curr.append(currExp, currValue);
  container.appendChild(curr);
}

function appendMapRowHeaderContainerChild(rowComb) {
  const curr = document.createElement("div");
  const currExp = document.createElement("p");
  const currValue = document.createElement("p");
  curr.className =
    "place-self-stretch relative h-16 w-16 space-x-2 flex items-center justify-between pr-2";
  currExp.className = "text-sm";
  currExp.textContent = repFromExpression(rowComb);
  currValue.className = "text-xs";
  currValue.textContent = valueFromExpression(rowComb);
  curr.append(currExp, currValue);
  mapRowHeaderContainer.appendChild(curr);
}

function getCombinations(vars, currCombinations = { "": "" }) {
  if (vars.length === 0) return currCombinations;
  let cc = {};
  Object.entries(currCombinations).map(([key, v]) => {
    for (let i = 0; i < 2; i++) {
      cc[key + i.toString()] = v + variableFromValue(i, vars[0]);
    }
  });
  return getCombinations(vars.slice(1), cc);
}

function variableFromValue(val, variable) {
  return val === 0 ? variable.toLowerCase() : variable.toUpperCase();
}

function valueFromExpression(exp) {
  return exp
    ? Array.from(exp)
        .map((v) => valueFromVariable(v).toString())
        .join("")
    : undefined;
}

function valueFromVariable(variable) {
  return variable.toLowerCase() === variable ? 0 : 1;
}

function repFromExpression(exp) {
  return exp
    ? Array.from(exp)
        .map((v) => repFromVariable(v))
        .join("")
    : undefined;
}

function repFromVariable(variable) {
  return (
    variable.toUpperCase() + (variable.toLowerCase() === variable ? "'" : "")
  );
}

function getGreyCode(num = 0, digits) {
  let bin = num.toString(2);
  let out = bin[0];
  for (let i = 1; i < bin.length; i++) {
    out += (bin[i - 1] ^ bin[i]).toString(2);
  }
  const rep = digits - out.length;
  return "0".repeat(rep > -1 ? rep : 0) + out;
}

function combinationExists(comb, currInputMinTerms) {
  const varArr = Array.from(comb);
  let exists = false;
  for (const minTerm of Object.values(currInputMinTerms)) {
    exists = true;
    for (const c of varArr) {
      exists &&= minTerm.includes(c);
    }
    if (exists) break;
  }
  return exists;
}

function rcTermEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function checkValidAdj(adjs, adj, mapRowCount, mapColCount) {
  const log2Length = Math.log(adj.length) / Math.log(2);
  return (
    log2Length !== 0 &&
    parseInt(log2Length) === log2Length &&
    adj.reduce(
      (p, c) =>
        (c[0] - p[1][0] === mapRowCount - 1 || Math.abs(c[0] - p[1][0]) <= 1) &&
        (c[1] - p[1][1] === mapColCount - 1 || Math.abs(c[1] - p[1][1]) <= 1)
          ? [true, c]
          : [false, c],
      [false, adj[0]]
    )[0] &&
    adjs.findIndex((a) =>
      a.reduce(
        (p, c) => adj.findIndex((cc) => rcTermEquals(cc, c)) !== -1 && p,
        true
      )
    ) === -1
  );
}
