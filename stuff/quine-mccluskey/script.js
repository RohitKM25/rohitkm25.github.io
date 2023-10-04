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

const expressions = [
  "2,3,5,7,8,10,12,13,15",
  "0,1,2,5,6,7,8,9,10,14",
  "2,6,8,9,10,11,14,15",
  "4,8,10,11,12,15",
];
const isStateLoggingEnabled = true;
//var expression = "0,5,7,8,9,10,11,14,15";
var expression = expressions[0];
var variables = ["A", "B", "C", "D"];
var groupsSets = [];
var inputMinTerms = [];
var map = [];
var getReducedGroupSetImplicantStatesRunCount = 0;

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
  inputMinTerms = expression.split(",").map((v) => Number(v));
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
  groupsSets.push(groupingBy1Count);
  while (groupsSets[groupsSets.length - 1].length !== 0)
    groupsSets.push(getGroupingByAdj(groupsSets[groupsSets.length - 1]));
  groupsSets = groupsSets.slice(0, groupsSets.length - 1);

  const compiledGroupSet = [...groupsSets[groupsSets.length - 1]];
  for (let i = groupsSets.length - 2; i >= 0; i--) {
    const groupSet = groupsSets[i];
    const groupSetKeys = groupSet.map((group) => Object.keys(group));
    const compiledGroupSetKeys = compiledGroupSet
      .map((group) => Object.keys(group))
      .reduce((p, c) => p + c.join(";"), "");

    groupSetKeys.forEach((gks, gsi) => {
      gks.forEach((gk) => {
        if (!compiledGroupSetKeys.includes(gk)) {
          compiledGroupSet.push({ [gk]: groupSet[gsi][gk] });
        }
      });
    });
  }

  const uniqueGroupsSet = [];
  for (let i = 0; i < compiledGroupSet.length; i++) {
    const group = compiledGroupSet[i];
    Object.keys(group).forEach((gk) => {
      if (
        uniqueGroupsSet.reduce(
          (p, c) => Object.values(c)[0] !== group[gk] && p,
          true
        )
      ) {
        uniqueGroupsSet.push({ [gk]: group[gk] });
      }
    });
  }
  groupsSets.push(uniqueGroupsSet);

  console.log(groupsSets);

  const groupSetMinTerms = [];
  uniqueGroupsSet.forEach((g) => {
    const groupItemKey = Object.keys(g)[0];
    groupSetMinTerms.push({
      [groupItemKey]: [
        g[groupItemKey],
        groupItemKey.split(",").map((b) => Number("0b" + b)),
      ],
    });
  });
  console.log(groupSetMinTerms);

  const [groupSetImplicantStates, reducedGroupSetUnusedMinTerms] =
    getReducedGroupSetImplicantStates(groupSetMinTerms, inputMinTerms);

  // const reducedGroupSetImplicantStates = groupSetImplicantStates.filter(
  //   (v) => Object.values(v)[0][3].length > 0
  // );
  // const reducedGroupSetUnusedMinTerms = inputMinTerms
  //   .filter(
  //     (i) =>
  //       !Array.from(
  //         new Set(
  //           reducedGroupSetImplicantStates.reduce(
  //             (p, c) => p.concat(Object.values(c)[0][1]),
  //             []
  //           )
  //         )
  //       ).includes(Number(i))
  //   )
  //   .map((n) => Number(n));
  // console.log(reducedGroupSetUnusedMinTerms);

  // if (reducedGroupSetUnusedMinTerms.length > 0) {
  //   const currGroupSetMinTerms = groupSetImplicantStates
  //     .filter((v) => Object.values(v)[0][3].length === 0)
  //     .map((v) => {
  //       return { [Object.keys(v)[0]]: Object.values(v)[0].slice(0, 2) };
  //     });

  //   let currReducedGroupSetImplicantsStates = [];
  //   currGroupSetMinTerms.forEach((g) => {
  //     const groupItemKey = Object.keys(g)[0];
  //     const implicants = g[groupItemKey][1];
  //     const implicantsCount = implicants.length;
  //     const primeImplicants = [];
  //     implicants.forEach((cImp) => {
  //       const isImpPrime = reducedGroupSetUnusedMinTerms.includes(cImp);
  //       if (isImpPrime) primeImplicants.push(cImp);
  //     });
  //     currReducedGroupSetImplicantsStates.push({
  //       [groupItemKey]: [
  //         g[groupItemKey][0],
  //         implicants,
  //         implicantsCount,
  //         primeImplicants,
  //       ],
  //     });
  //   });

  //   currReducedGroupSetImplicantsStates = currReducedGroupSetImplicantsStates
  //     .filter((v) => Object.values(v)[0][3].length > 0)
  //     .sort(
  //       (a, b) => Object.values(b)[0][3].length - Object.values(a)[0][3].length
  //     );
  //   let filteredCurrReducedGroupSetImplicantsStates = [];
  //   const firstCRGSIS = currReducedGroupSetImplicantsStates[0];
  //   filteredCurrReducedGroupSetImplicantsStates.push(firstCRGSIS);
  //   filteredCurrReducedGroupSetImplicantsStates =
  //     filteredCurrReducedGroupSetImplicantsStates.concat(
  //       currReducedGroupSetImplicantsStates.filter(
  //         (v) =>
  //           !Object.values(v)[0][3].reduce(
  //             (p, ci) => Object.values(firstCRGSIS)[0][3].includes(ci) && p,
  //             true
  //           )
  //       )
  //     );

  //   const res = groupSetImplicantStates
  //     .concat(filteredCurrReducedGroupSetImplicantsStates)
  //     .map((v) =>
  //       repFromExpression(expFromBinRep(Object.values(v)[0][0], variables))
  //     );
  //   console.log(res);
  // } else {
  const res = groupSetImplicantStates.map((v) =>
    repFromExpression(expFromBinRep(Object.values(v)[0][0], variables))
  );
  console.log(res);
}

function tabulateGroupSet(gmt, title) {
  let obj = {};
  gmt.forEach((g) => {
    obj[Object.keys(g)[0]] = g[Object.keys(g)[0]].map((v) => {
      const o = `${v.toString()}${v[0] ? " " : ""}${
        v[0] ? "arr-" + typeof v[0] : ""
      }`;
      return o !== "" ? o : [];
    });
  });
  title ? console.log(title) : undefined;
  console.table(obj);
}

function getReducedGroupSetImplicantStates(
  groupSetMinTerms,
  sourceMinTerms,
  prevGroupSetImplicantStates
) {
  // if (getReducedGroupSetImplicantStatesRunCount > 2) return;
  getReducedGroupSetImplicantStatesRunCount++;
  console.log(
    `getReducedGroupSetImplicantStates>>> ${getReducedGroupSetImplicantStatesRunCount} ------------------------`
  );

  const groupSetImplicantStates = [];
  groupSetMinTerms.forEach((g) => {
    const groupItemKey = Object.keys(g)[0];
    const implicants = g[groupItemKey][1];
    const implicantsCount = implicants.length;
    const primeImplicants = [];
    const implicantsInSource = [];
    implicants.forEach((cImp) => {
      if (!sourceMinTerms.includes(cImp)) return;
      implicantsInSource.push(cImp);
      const isImpPrime = groupSetMinTerms
        .filter((v) => Object.keys(v)[0] !== groupItemKey)
        .reduce((p, c) => !Object.values(c)[0][1].includes(cImp) && p, true);
      if (isImpPrime) primeImplicants.push(cImp);
    });
    groupSetImplicantStates.push({
      [groupItemKey]: [
        g[groupItemKey][0],
        implicants,
        implicantsCount,
        primeImplicants,
        implicantsInSource,
      ],
    });
  });
  console.log(sourceMinTerms);
  tabulateGroupSet(
    groupSetImplicantStates,
    `Group Set Implicant States ${getReducedGroupSetImplicantStatesRunCount}`
  );

  let reducedGroupSetImplicantStates = groupSetImplicantStates.filter(
    (v) => Object.values(v)[0][3].length > 0
  );

  if (reducedGroupSetImplicantStates.length === 0)
    reducedGroupSetImplicantStates = [];
  let tempGroupSetImplicantStates = groupSetImplicantStates;
  while (true) {
    const currMinTerms = inputMinTerms
      .filter(
        (i) =>
          !Array.from(
            new Set(
              reducedGroupSetImplicantStates.reduce(
                (p, c) => p.concat(Object.values(c)[0][1]),
                []
              )
            )
          ).includes(i)
      )
      .map((n) => Number(n));
    const groupSetWeightages = tempGroupSetImplicantStates
      .map((v, i) => [
        v,
        i,
        currMinTerms.reduce(
          (p, c) => (Object.values(v)[0][4].includes(c) ? 1 : 0) + p,
          0
        ) / Object.values(v)[0][4].length,
      ])
      .filter((v) => v[2] > 0)
      .sort((a, b) => a[2] - b[2]);
    console.log(currMinTerms, groupSetWeightages);
    if (groupSetWeightages.length > 0) {
      const largestWeightage =
        groupSetWeightages[groupSetWeightages.length - 1];
      reducedGroupSetImplicantStates.push(largestWeightage[0]);
      tempGroupSetImplicantStates = tempGroupSetImplicantStates.filter(
        (_, i) => i !== largestWeightage[1]
      );
    } else break;
  }

  if (prevGroupSetImplicantStates)
    reducedGroupSetImplicantStates = reducedGroupSetImplicantStates.concat(
      prevGroupSetImplicantStates
    );
  tabulateGroupSet(
    reducedGroupSetImplicantStates,
    `Reduced Group Set Implicant States ${getReducedGroupSetImplicantStatesRunCount}`
  );

  const reducedGroupSetUnusedMinTerms = inputMinTerms
    .filter(
      (i) =>
        !Array.from(
          new Set(
            reducedGroupSetImplicantStates.reduce(
              (p, c) => p.concat(Object.values(c)[0][1]),
              []
            )
          )
        ).includes(i)
    )
    .map((n) => Number(n));
  console.log(reducedGroupSetUnusedMinTerms);

  if (reducedGroupSetUnusedMinTerms.length > 0) {
    const currGroupSetMinTerms = groupSetImplicantStates
      .filter((v) => Object.values(v)[0][3].length === 0)
      .map((v) => {
        return { [Object.keys(v)[0]]: Object.values(v)[0].slice(0, 2) };
      });
    tabulateGroupSet(
      currGroupSetMinTerms,
      `Curr Group Set Min Terms ${getReducedGroupSetImplicantStatesRunCount}`
    );
    const [nextGroupSetImplicantStates, nextReducedGroupSetUnusedMinTerms] =
      getReducedGroupSetImplicantStates(
        currGroupSetMinTerms,
        reducedGroupSetUnusedMinTerms,
        reducedGroupSetImplicantStates
      );
    tabulateGroupSet(
      nextGroupSetImplicantStates,
      `Next Group Set Implicant States ${getReducedGroupSetImplicantStatesRunCount}`
    );
    if (
      nextGroupSetImplicantStates.reduce(
        (p, c) => Object.values(c)[0][3].length > 0 || p,
        false
      )
    )
      return [nextGroupSetImplicantStates, reducedGroupSetUnusedMinTerms];
  }
  return [reducedGroupSetImplicantStates, reducedGroupSetUnusedMinTerms];
}

function getBinary(num, nBits) {
  const bin = num.toString(2);
  return "0".repeat(nBits - bin.length) + bin;
}

function getGroupingBy1Count(binMinTermsCombinations) {
  let groups = [];
  for (let countOf1 = 0; countOf1 <= variables.length; countOf1++) {
    let currGroup = {};
    binMinTermsCombinations.forEach((c) => {
      const matches = c.match(/1/g);
      if (matches !== null ? matches.length === countOf1 : countOf1 === 0)
        currGroup[c] = c;
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

function expFromBinRep(bin, currVariables) {
  let ret = "";
  let lBin = bin.split("");
  for (let i = 0; i < lBin.length; i++) {
    const curr = lBin[i];
    if (curr === "-") continue;
    ret += variableFromValue(Number(curr), currVariables[i]);
  }
  return ret;
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