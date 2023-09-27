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

const isStateLoggingEnabled = true;
var expression = "0,5,7,8,9,10,11,14,15";
var variables = ["A", "B", "C", "D"];
var groupsSets = [];
var inputMinTerms = [];
var map = [];

const variablesInputElement = document.getElementById("variables-input");
const mintermsInputElement = document.getElementById("minterms-input");

getOutput();

function expressionInputOnKeyUp(event) {
  if (event.target.value === "") return;
  expression = event.target.value;
  getOutput();
}

function getOutput() {
  if (expression === "") return;
  if (variables.length < 2) return;
  inputMinTerms = expression.split(",");
  const binMinTermsCombinations = inputMinTerms.map((v) =>
    getBinary(v, variables.length)
  );
  const minTermCombinations = getCombinations(variables);
  updateDisplay(
    variables,
    Object.keys(minTermCombinations)
      .filter(
        (k) => binMinTermsCombinations.findIndex((bmtc) => bmtc === k) !== -1
      )
      .map((k) => minTermCombinations[k]),
    []
  );
  const groupingBy1Count = getGroupingBy1Count(binMinTermsCombinations);
  while (
    groupsSets.length > 0
      ? groupsSets[groupsSets.length - 1].length !== 0
      : true
  ) {
    groupsSets.push(
      getGroupingByAdj(
        groupsSets.length > 0
          ? groupsSets[groupsSets.length - 1]
          : groupingBy1Count
      )
    );
  }
  groupsSets = groupsSets.slice(0, groupsSets.length - 1);

  updatedGroupSets = [];
  groupsSets
    .slice(0, groupsSets.length - 1)
    .forEach((groupSet, groupSetI) => {});

  console.log(groupsSets);
}

function getBinary(num, nBits) {
  const bin = Number(num).toString(2);
  return "0".repeat(nBits - bin.length) + bin;
}

function getGroupingBy1Count(binMinTermsCombinations) {
  let groups = [];
  for (let countOf1 = 0; countOf1 <= variables.length; countOf1++) {
    let currGroup = {};
    binMinTermsCombinations.forEach((c) => {
      const matches = c.match(/1/g);
      if (matches !== null && matches.length === countOf1) currGroup[c] = c;
    });
    if (Object.values(currGroup).length > 0) groups.push(currGroup);
  }
  return groups;
}

function getGroupingByAdj(groups) {
  const adjGroups = [];
  groups.slice(0, groups.length - 1).forEach((group, groupi) => {
    const nextGroup = groups[groupi + 1];
    let currGroup = {};
    const groupKeys = Object.keys(group);
    const groupValues = Object.values(group);
    const nextGroupKeys = Object.keys(nextGroup);
    const nextGroupValues = Object.values(nextGroup);
    groupValues.forEach((gItem, gIndex) => {
      const arrGItem = Array.from(gItem);
      nextGroupValues.forEach((ngItem, nGIndex) => {
        const arrNGItem = Array.from(ngItem);
        const xor = arrGItem.map((c, i) => (c !== arrNGItem[i] ? 1 : 0));
        if (xor.filter((v) => v === 1).length === 1)
          currGroup[groupKeys[gIndex] + "," + nextGroupKeys[nGIndex]] = xor
            .map((v, i) => (v === 1 ? "-" : arrNGItem[i]))
            .join("");
      });
    });
    if (Object.values(currGroup).length > 0) adjGroups.push(currGroup);
  });
  return adjGroups;
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
  const mapRowCount = Math.pow(2, Math.floor(currVariables.length / 2));

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
        appendMapHeaderContainerChild(
          colCombinations[getGreyCode(j, colVars.length)],
          mapColHeaderContainer
        );
    }
    appendMapHeaderContainerChild(
      rowCombinations[getGreyCode(i, rowVars.length)],
      mapRowHeaderContainer
    );
  }

  currAdjacents.forEach((a) => {
    const marker = document.createElement("div");
    const leastColValue = a.reduce((p, c) => (c[1] < p ? c[1] : p), a[0][1]);
    const leastRowValue = a.reduce((p, c) => (c[0] < p ? c[0] : p), a[0][0]);
    const greatestColValue = a.reduce((p, c) => (c[1] > p ? c[1] : p), a[0][1]);
    const greatestRowValue = a.reduce((p, c) => (c[0] > p ? c[0] : p), a[0][0]);
    const colDist = Math.abs(leastColValue - greatestColValue) + 1;
    const rowDist = Math.abs(leastRowValue - greatestRowValue) + 1;
    marker.className = `absolute top-[${a[0][0] * 4}rem] left-[${
      a[0][1] * 4
    }rem] w-[${Math.abs(
      (colDist === 0 ? a.length : colDist === a.length - 1 ? 1 : colDist) * 4 -
        0.5
    )}rem] h-[${Math.abs(
      (rowDist === 0 ? a.length : rowDist === a.length - 1 ? 1 : rowDist) * 4 -
        0.5
    )}rem] m-1 rounded z-20 !border-2 !border-emerald-500`;
    mapContentContainer.appendChild(marker);
  });
}

function refreshContainer(container, containerClass) {
  container.innerHTML = "";
  container.className = containerClass;
}

function appendMapHeaderContainerChild(colComb, container) {
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

function sortGroup(group) {
  return group.sort((a, b) => {
    const fT = a[0] - b[0];
    const sT = a[1] - b[1];
    return fT === 0 ? sT : fT;
  });
}

function checkValidAdj(groups, group, mapRowCount, mapColCount) {
  const log2Length = Math.log(group.length) / Math.log(2);
  // console.log(
  //   group,
  //   group.length > 1,
  //   parseInt(log2Length) === log2Length,
  //   group
  //     .slice(1)
  //     .reduce(
  //       (p, c) => [
  //         ((c[0] - p[1][0] === mapRowCount - 1 ||
  //           Math.abs(c[0] - p[1][0]) <= 1) &&
  //         (c[1] - p[1][1] === mapColCount - 1 || Math.abs(c[1] - p[1][1]) <= 1)
  //           ? true
  //           : false) && p[0],
  //         c,
  //       ],
  //       [true, group[0]]
  //     )[0],
  //   groups.findIndex((g) =>
  //     g.reduce(
  //       (p, c) => group.findIndex((pt) => rcTermEquals(pt, c)) !== -1 && p,
  //       true
  //     )
  //   ) === -1
  // );
  return (
    group.length > 1 &&
    parseInt(log2Length) === log2Length &&
    group
      .slice(1)
      .reduce(
        (p, c) => [
          ((c[0] - p[1][0] === mapRowCount - 1 ||
            Math.abs(c[0] - p[1][0]) <= 1) &&
          (c[1] - p[1][1] === mapColCount - 1 || Math.abs(c[1] - p[1][1]) <= 1)
            ? true
            : false) && p[0],
          c,
        ],
        [true, group[0]]
      )[0] &&
    groups.findIndex((g) =>
      g.reduce(
        (p, c) => group.findIndex((pt) => rcTermEquals(pt, c)) !== -1 && p,
        true
      )
    ) === -1
  );
}

function checkAdjExistsInGroups(groups, adj) {
  return groups.reduce((p, c) => {
    const finder = adj.length <= c.length ? adj : c;
    const findee = adj.length <= c.length ? c : adj;
    return (
      finder.reduce(
        (frp, frc) =>
          findee.findIndex((fei) => rcTermEquals(frc, fei)) !== -1 && frp,
        true
      ) && p
    );
  }, true);
  // return !groups.reduce((p, c) => {
  //   const finder = adj.length <= c.length ? adj : c;
  //   const findee = adj.length <= c.length ? c : adj;
  //   return (
  //     finder.findIndex(
  //       (fri) => findee.findIndex((fei) => rcTermEquals(fri, fei)) !== -1
  //     ) === -1 && p
  //   );
  // }, true);
}
