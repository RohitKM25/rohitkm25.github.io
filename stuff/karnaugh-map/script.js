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

const exprmtlExpresions = [
  "abcdef+ab'cdef+abcdef'+ab'cdef'+a'b'c'd'e'f'+a'b'c'd'e'f+a'b'c'd'ef+a'b'c'd'ef'+a'b'cd'e'f'+a'b'cd'e'f+a'b'cd'ef+a'b'cd'ef'+a'bcd'e'f'+a'bcd'e'f+a'bcd'ef+a'bcd'ef'+a'bc'd'e'f'+a'bc'd'e'f+a'bc'd'ef+a'bc'd'ef'",
  "a'b'c'd'e'f'+a'b'c'd'e'f+a'b'c'd'ef+a'b'c'd'ef'+a'b'c'de'f'+a'b'c'def+a'b'c'de'f+a'b'c'de'f'",
  "abcdef+ab'cdef",
  "a'b'c'd'+a'b'cd'+ab'c'd'+ab'cd'",
  "abc+a'bc+a'b'c",
  "ab+a'b",
  "a'b'c'd'+a'b'c'd+a'bc'd+a'bcd",
  "a'bc'd+a'bcd+abc'd+abcd+a'b'c'd'+a'b'cd'",
  "a'b'c'd'+a'b'c'd+a'b'cd+a'b'cd'+a'bc'd'+a'bc'd+a'bcd+a'bcd'",
  "a'bc'd'+a'bc'd+abc'd",
];
const isStateLoggingEnabled = true;
var expression = exprmtlExpresions[5];
var previousExpression = "";
var variables = [];
var inputMinTerms = [];
var map = [];

const expressionInputElement = document.getElementById("expression-input");

getOutput();

function executeButtonClick() {
  if (expressionInputElement.value === "") return;
  expression = expressionInputElement.value;
  getOutput();
}

function getOutput() {
  if (expression === "") return;
  let currExpression = getNormalizedExpression(expression);
  variables = getVariables(currExpression);
  if (variables.length < 2) return;
  inputMinTerms = getMinTerms(currExpression, variables);
  solveMap();
}

function solveMap() {
  if (isStateLoggingEnabled)
    console.log("<-----", expression.toUpperCase(), "----->");
  const mapColCount = Math.pow(2, Math.ceil(variables.length / 2));
  const mapRowCount = Math.pow(2, Math.floor(variables.length / 2));
  if (isStateLoggingEnabled) console.log("Row Count:", mapRowCount);
  if (isStateLoggingEnabled) console.log("Column Count:", mapColCount);

  const rowVars = variables.slice(0, Math.floor(variables.length / 2));
  const colVars = variables.slice(
    Math.floor(variables.length / 2),
    variables.length
  );
  if (isStateLoggingEnabled) console.log("Row Combinations:", ...rowVars);
  if (isStateLoggingEnabled) console.log("Column Combinations:", ...colVars);

  const rowCombinations = getCombinations(rowVars);
  const colCombinations = getCombinations(colVars);
  if (isStateLoggingEnabled)
    console.log("Row Combinations:", ...Object.values(rowCombinations));
  if (isStateLoggingEnabled)
    console.log("Column Combinations:", ...Object.values(colCombinations));

  map = [];
  for (let i = 0; i < mapRowCount; i++) {
    for (let j = 0; j < mapColCount; j++) {
      const minTermValue = combinationExists(
        rowCombinations[getGreyCode(i, rowVars.length)] +
          colCombinations[getGreyCode(j, colVars.length)],
        inputMinTerms
      )
        ? "1"
        : "0";
      map.push([i, j, minTermValue]);
    }
  }
  if (isStateLoggingEnabled) console.log("Map:", map);

  let groups = [];
  for (let termIndex = 0; termIndex < map.length; termIndex++) {
    const term = map[termIndex];
    if (term[2] !== "1") continue;
    let adj = [];
    for (
      let rowIndexIncrmnt = -mapRowCount + 1;
      rowIndexIncrmnt <= mapRowCount;
      rowIndexIncrmnt++
    ) {
      let rowIndex = term[0] + rowIndexIncrmnt;
      rowIndex =
        rowIndex >= mapRowCount
          ? rowIndex - mapRowCount
          : rowIndex < 0
          ? rowIndex + mapRowCount
          : rowIndex;
      const match = map.find(
        (mi) => mi[0] === rowIndex && mi[1] === term[1] && mi[2] === "1"
      );
      adj = sortGroup(adj);
      if (match && adj.findIndex((fv) => rcTermEquals(fv, match)) === -1)
        adj.push(match);
    }

    if (checkValidAdj(groups, adj, mapRowCount, mapColCount)) {
      groups.push(adj);
    }

    adj = [];
    for (
      let colIndexIncrmnt = -mapColCount + 1;
      colIndexIncrmnt <= mapColCount;
      colIndexIncrmnt++
    ) {
      let colIndex = term[0] + colIndexIncrmnt;
      colIndex =
        colIndex >= mapColCount
          ? colIndex - mapColCount
          : colIndex < 0
          ? colIndex + mapColCount
          : colIndex;
      const match = map.find(
        (mi) => mi[0] === term[0] && mi[1] === colIndex && mi[2] === "1"
      );
      adj = sortGroup(adj);
      if (match && adj.findIndex((fv) => rcTermEquals(fv, match)) === -1)
        adj.push(match);
    }

    if (checkValidAdj(groups, adj, mapRowCount, mapColCount)) {
      groups.push(adj);
    }
  }

  if (groups.length === 0) {
    updateDisplay(variables, inputMinTerms, groups);
    outputExpression.value = repFromExpression(
      inputMinTerms.join("+")
    ).toUpperCase();
    return;
  }
  if (isStateLoggingEnabled) console.log("Original Groups:", ...groups);

  let reducedGroups = [];
  groups.forEach((group, i) => {
    let currGroup = [];
    let pushedIndices = [];
    currGroup.push(...group);
    for (let ii = 0; ii < groups.length; ii++) {
      const iv = groups[ii];
      if (i === ii || pushedIndices.includes(ii)) continue;
      // const ivRowDiff = iv[iv.length - 1][0] - iv[0][0];
      // const ivColDiff = iv[iv.length - 1][1] - iv[0][1];
      // const currGroupRowDiff =
      //   currGroup[currGroup.length - 1][0] - currGroup[0][0];
      // const currGroupColDiff =
      //   currGroup[currGroup.length - 1][1] - currGroup[0][1];
      if (
        //iv.includes(currGroup[currGroup.length - 1]) &&
        // (ivRowDiff === currGroupRowDiff &&
        //   ivColDiff === currGroupColDiff &&
        //   (ivRowDiff === 0
        //     ? Math.abs(iv[0][0] - currGroup[0][0]) === 1
        //     : ivColDiff === 0
        //     ? Math.abs(iv[0][1] - currGroup[0][1]) === 1
        //     : false)) ||
        iv.findIndex((v) =>
          rcTermEquals(v, currGroup[currGroup.length - 1])
        ) !== -1
      ) {
        currGroup.push(
          ...iv.filter(
            (v) =>
              !rcTermEquals(v, currGroup[currGroup.length - 1]) &&
              currGroup.findIndex((fv) => rcTermEquals(fv, v)) === -1
          )
        );
        pushedIndices.push(ii);
        ii = 0;
        currGroup = sortGroup(currGroup);
      }
    }
    const currGroupLengthLog = Math.log(currGroup.length) / Math.log(2);
    if (
      parseInt(currGroupLengthLog) === currGroupLengthLog &&
      (Math.abs(currGroup[0][0] - currGroup[currGroup.length - 1][0]) <=
        (parseInt(currGroup.length / 2) - 1) * 1 ||
        Math.abs(currGroup[0][0] - currGroup[currGroup.length - 1][0]) ===
          mapRowCount - 1) &&
      (Math.abs(currGroup[0][1] - currGroup[currGroup.length - 1][1]) ===
        mapColCount - 1 ||
        Math.abs(currGroup[0][1] - currGroup[currGroup.length - 1][1]) <=
          (parseInt(currGroup.length / 2) - 1) * 1)
    )
      reducedGroups.push(currGroup);
    else reducedGroups.push(group);
  });
  groups = reducedGroups.sort((a, b) => b.length - a.length);
  if (isStateLoggingEnabled) console.log("Reduced Groups:", ...groups);

  let updatedGroups = groups.slice(0, 1);
  groups.slice(1).forEach((adj) => {
    if (!checkAdjExistsInGroups(updatedGroups, adj)) {
      updatedGroups.push(adj);
    }
  });
  groups = updatedGroups;
  if (isStateLoggingEnabled) console.log("Updated Groups:", ...groups);

  let weightages = groups.map((g, gi) => {
    let count = 0;
    g.forEach((pt) => {
      count += groups.reduce((p, v, i) => {
        if (gi === i) return p;
        return v.findIndex((m) => rcTermEquals(m, pt)) === -1 && p;
      }, true)
        ? 1
        : 0;
    });
    return count;
  });
  groups = groups.filter((_, i) => weightages[i] > 0);
  if (isStateLoggingEnabled) console.log("Weighed Groups:", ...groups);

  let groupless = map.filter(
    (v) =>
      v[2] === "1" &&
      groups.reduce(
        (p, c) => c.findIndex((a) => rcTermEquals(v, a)) === -1 && p,
        false
      )
  );
  groups.push(...groupless.map((gl) => [gl]));

  updateDisplay(variables, inputMinTerms, groups);

  if (
    inputMinTerms.length >= Object.values(getCombinations(variables)).length
  ) {
    outputExpression.value = "1";
    if (isStateLoggingEnabled)
      console.log(`Resultant Expression: ${outputExpression.value}`);
    return;
  }

  let compliedChangeExpression = "";
  groups.forEach((group, groupi) => {
    let xors = [variables.map(() => 0)];

    for (let i = 0; i < group.length - 1; i++) {
      if (i === 0) xors = [];
      const currC = group[i];
      const nextC = group[i + 1];

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
      xors.map(() => 0)
    );

    let comb = "";
    changed.forEach((c, i) => {
      if (c !== 0) return;
      if (i < Math.floor(changed.length / 2)) {
        comb += rowCombinations[getGreyCode(group[0][0], rowVars.length)][i];
      } else {
        comb +=
          colCombinations[getGreyCode(group[0][1], colVars.length)][
            Math.abs(i - Math.floor(changed.length / 2))
          ];
      }
    });
    comb = repFromExpression(comb);
    if (isStateLoggingEnabled)
      console.log(
        `Compile Group ${groupi}:
        Adj Change     : ${xors.join("; ")}
        Net Change     : ${changed}
        Resultant Term : ${comb}`
      );
    if (compliedChangeExpression.length > 0) compliedChangeExpression += "+";
    compliedChangeExpression += comb;
  });
  outputExpression.value = compliedChangeExpression.toUpperCase();
  if (isStateLoggingEnabled)
    console.log(`Resultant Expression: ${outputExpression.value}`);
  if (isStateLoggingEnabled) console.log("");
}

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
