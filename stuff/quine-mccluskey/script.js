const MAP_CONTAINER_CLASS = "grid";
const MAP_CONTENT_CONTAINER_CLASS =
  "col-start-2 row-start-2 grid w-fit border-l border-t border-transparent relative";
const MAP_COL_HEADER_CONTAINER_CLASS =
  "grid grid-rows-1 divide-x divide-amber-500/40 border-l-2 border-b-2 border-amber-600 sticky top-0 bg-fuchsia-950 z-10";
const MAP_ROW_HEADER_CONTAINER_CLASS =
  "row-start-2 col-start-1 grid grid-cols-1 divide-y divide-amber-500/40 border-t-2 border-r-2 border-amber-600 sticky left-0 bg-fuchsia-950 z-10";
const MAP_CONTENT_CELL_CONTAINER_CLASS =
  "bg-amber-600/10 place-self-stretch relative h-14 w-14 md:h-16 md:w-16 flex items-center justify-center transition-all border-t border-l border-amber-500/40";
const MAP_CONTENT_CELL_OUTPUT_CLASS = "text-base md:text-lg transition-all";
const MAP_CONTENT_CELL_TERM_CLASS =
  "text-xs md:text-sm absolute bottom-1 right-2 transition-all";

const mapOutput = document.getElementById("output-map");
const mapContainer = document.getElementById("map-container");

const mapContentContainer = document.getElementById("map-content-container");
const mapColHeaderContainer = document.getElementById(
  "map-col-header-container"
);
const mapRowHeaderContainer = document.getElementById(
  "map-row-header-container"
);
const mapCurrGroupStateTitle = document.getElementById(
  "map-curr-groups-state-title"
);
const groupStatesSelectionList = document.getElementById(
  "groups-states-selection-list"
);
const outputGroups = document.getElementById("output-groups");
const outputGroupsCheckbox = document.getElementById("output-groups-collapsed");

const outputReductions = document.getElementById("output-reductions");

const outputReductionsCheckbox = document.getElementById(
  "output-reductions-collapsed"
);

const currGroupsStateValue = document.getElementById("curr-groups-state-value");
const outputExpression = document.getElementById("output-expression");

const expressions = [
  "2,3,5,7,8,10,12,13,15",
  "0,1,2,5,6,7,8,9,10,14",
  "2,6,8,9,10,11,14,15",
  "4,8,10,11,12,15",
  "5,7,11,12,27,29",
];
const dontcares = ["14,20,21,22,23"];
const isStateLoggingEnabled = true;
//var expression = "0,5,7,8,9,10,11,14,15";
var expression = expressions[1];
var dontcare = dontcares[0];
var variables = ["A", "B", "C", "D", "E"];
var groupsSetsState = [];
var inputMinTerms = [];
var dontCareMinTerms = [];
var map = [];
var getReducedGroupSetImplicantStatesRunCount = 0;
outputGroupsCheckbox.checked = false;
outputReductionsCheckbox.checked = false;

const variablesInputElement = document.getElementById("variables-input");
const mintermsInputElement = document.getElementById("minterms-input");
const dontcaresInputElement = document.getElementById("dontcares-input");

mintermsInputElement.value = expression;
dontcaresInputElement.value = dontcare;
variablesInputElement.value = variables.join(",");
getOutput();

function executeButtonOnClick() {
  if (mintermsInputElement.value === "" || variablesInputElement === "") return;
  expression = mintermsInputElement.value;
  dontcare = dontcaresInputElement.value;
  variables = variablesInputElement.value.split(",");
  getOutput();
}

function getOutput() {
  if (expression === "") return;
  if (variables.length < 2) return;
  inputMinTerms = expression.split(",").map((v) => Number(v));
  dontCareMinTerms = dontcare.split(",").map((v) => Number(v));
  let totInputMinTerms = inputMinTerms.slice();
  dontcare ? totInputMinTerms.push(...dontCareMinTerms) : undefined;
  groupsSetsState = [];
  const binMinTermsCombinations = totInputMinTerms.map((v) =>
    getBinary(v, variables.length)
  );
  const binDontCareMinTermsCombinations = dontcare
    ? dontCareMinTerms.map((v) => getBinary(v, variables.length))
    : [];
  const minTermCombinations = getCombinations(variables);
  if (variables.length < 5)
    updateDisplay(
      variables,
      Object.keys(minTermCombinations)
        .filter(
          (k) => binMinTermsCombinations.findIndex((bmtc) => bmtc === k) !== -1
        )
        .map((k) => minTermCombinations[k]),
      Object.keys(minTermCombinations)
        .filter(
          (k) =>
            binDontCareMinTermsCombinations.findIndex((bmtc) => bmtc === k) !==
            -1
        )
        .map((k) => minTermCombinations[k]),
      []
    );
  const groupingBy1Count = getGroupingBy1Count(binMinTermsCombinations);
  let groupsSets = [groupingBy1Count];
  //groupsSetsState.push(["Grouping by Count of One", groupingBy1Count]);

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

  showGroupingGridsFromGroupsSet(groupsSets, compiledGroupSet);

  groupsSetsState.push(["Compiled Groups", compiledGroupSet]);

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

  const groupSetImplicantStates = getReducedGroupSetImplicantStates(
    groupSetMinTerms,
    inputMinTerms
  );

  groupsSetsState.push([
    "Reduced Groups",
    getGroupSetFromImplicantStates(groupSetImplicantStates),
  ]);

  const res = groupSetImplicantStates.map((v) =>
    repFromExpression(expFromBinRep(Object.values(v)[0][0], variables))
  );
  outputExpression.value = res.join(" + ");
}

function showGroupingGridsFromGroupsSet(groupsSets, compiledGroupSets) {
  const compiledGroups = compiledGroupSets
    .map((groupSet) => Object.keys(groupSet))
    .reduce((p, c) => [...p, ...c], []);
  outputGroups.innerHTML = "";
  groupsSets.forEach((groupsSet, gsi) => {
    const currAdjacentGroupsContainer = document.createElement("div");

    const currAdjacentGroupsTitle = document.createElement("p");
    currAdjacentGroupsTitle.innerText = `Grouping ${gsi}`;
    currAdjacentGroupsTitle.className = "text-lg font-bold";

    const currAdjacentGroups = document.createElement("div");
    currAdjacentGroups.className = `w-full md:w-fit max-[300px]:flex flex-col grid grid-cols-3 grid-rows-[repeat(${groupsSet.length},1fr)] my-2 border border-amber-600`;
    currAdjacentGroups.innerHTML = groupsSet
      .map(
        (v, i) =>
          `<div class="p-2 md:w-[250px] flex flex-col items-center justify-center text-base font-semibold ${
            i > 0 ? "border-t" : ""
          } border-amber-600/70"><p class="text-center">${
            gsi === 0
              ? `Grouping by ${Object.values(v)[0].split("1").length - 1} ones`
              : `Group ${i}->${i + 1}`
          }</p></div><div class="border-l max-[300px]:border-t ${
            i > 0 ? "border-t" : ""
          } border-amber-600/70 px-8 py-2 col-span-2 flex flex-col items-start justify-center">` +
          Object.keys(v)
            .map(
              (k) =>
                `<p class="${
                  compiledGroups.includes(k)
                    ? "underline underline-offset-4"
                    : ""
                }">${(k.includes(",")
                  ? k.split(",").map((ki) => Number("0b" + ki))
                  : [Number("0b" + k)]
                )
                  .map(
                    (ki) =>
                      `<span class="${
                        dontCareMinTerms.includes(ki) ? "text-amber-50/60" : ""
                      }">m<sub>${ki}</sub></span>`
                  )
                  .join("-")}: ${v[k]}</p>`
            )
            .join("") +
          "</div>"
      )
      .join("");

    currAdjacentGroupsContainer.appendChild(currAdjacentGroupsTitle);
    currAdjacentGroupsContainer.appendChild(currAdjacentGroups);

    outputGroups.appendChild(currAdjacentGroupsContainer);
  });
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

function getReducedGroupSetImplicantStates(groupSetMinTerms, sourceMinTerms) {
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
        .reduce(
          (p, c) =>
            (dontcare ? !dontCareMinTerms.includes(cImp) : true) &&
            !Object.values(c)[0][1].includes(cImp) &&
            p,
          true
        );
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

  getReductionGridElementFromImplicantStates(
    groupSetImplicantStates,
    sourceMinTerms
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

    getReductionGridElementFromImplicantStates(
      tempGroupSetImplicantStates,
      currMinTerms
    );
    const groupSetWeightages = tempGroupSetImplicantStates
      .map((v, i) => [
        v,
        i,
        currMinTerms.reduce(
          (p, c) => (Object.values(v)[0][4].includes(c) ? 1 : 0) + p,
          0
        ) / Object.values(v)[0][4].length,
        Object.values(v)[0][4].length,
      ])
      .filter((v) => v[2] > 0)
      .sort((a, b) => a[2] - b[2])
      .sort((a, b) => a[3] - b[3]);
    if (groupSetWeightages.length > 0) {
      const largestWeightage =
        groupSetWeightages[groupSetWeightages.length - 1];
      reducedGroupSetImplicantStates.push(largestWeightage[0]);
      tempGroupSetImplicantStates = tempGroupSetImplicantStates.filter(
        (_, i) => i !== largestWeightage[1]
      );
    } else break;
  }

  return reducedGroupSetImplicantStates;
}

function getReductionGridElementFromImplicantStates(implicantStates, minTerms) {
  implicantStates = implicantStates.filter((v) =>
    Object.values(v)[0][1].reduce((p, c) => p || minTerms.includes(c), false)
  );

  if (implicantStates.length === 0) return;

  const grid = document.createElement("div");
  grid.className =
    "w-fit max-w-full flex border border-amber-600 text-lg flex-none w-fit overflow-x-auto";

  const groupColumn = document.createElement("div");
  groupColumn.className = `grid grid-cols-1 divide-y divide-amber-600/70 border-r border-amber-600/70 flex-none bg-fuchsia-950`;
  const groupColumnTitle = document.createElement("div");

  groupColumnTitle.className = "border-b border-amber-600/70 px-2";
  groupColumnTitle.innerHTML = "<p>Groups</p>";
  groupColumn.appendChild(groupColumnTitle);

  implicantStates.forEach((iState) => {
    const key = Object.keys(iState)[0];
    const groupColumnItem = document.createElement("div");
    groupColumnItem.className = "px-2";
    groupColumnItem.innerHTML = `<p>${(key.includes(",")
      ? key.split(",").map((ki) => Number("0b" + ki))
      : [Number("0b" + key)]
    )
      .map(
        (ki) =>
          `<span class="${
            dontCareMinTerms.includes(ki) ? "text-amber-50/60" : ""
          }">m<sub>${ki}</sub></span>`
      )
      .join(",")}</p>`;
    groupColumn.appendChild(groupColumnItem);
  });

  grid.appendChild(groupColumn);

  const expressionColumn = document.createElement("div");
  expressionColumn.className = `grid grid-cols-1 divide-y divide-amber-600/70 border-r border-amber-600/70 flex-none bg-fuchsia-950 sticky left-0`;
  const expressionColumnTitle = document.createElement("div");

  expressionColumnTitle.className = "border-b border-amber-600/70 px-2";
  expressionColumnTitle.innerHTML = "<p>Expression</p>";
  expressionColumn.appendChild(expressionColumnTitle);

  implicantStates.forEach((iState) => {
    const binInStates = Object.values(iState)[0][0];
    const expressionColumnItem = document.createElement("div");
    expressionColumnItem.className = "px-2";
    expressionColumnItem.innerHTML = `<p>${repFromExpression(
      expFromBinRep(binInStates, variables)
    )}</p>`;
    expressionColumn.appendChild(expressionColumnItem);
  });

  grid.appendChild(expressionColumn);

  const implicantColumns = document.createElement("div");
  implicantColumns.className = `flex-col items-stretch divide-x divide-y divide-amber-600/70`;
  const implicantColumnsTitle = document.createElement("div");

  implicantColumnsTitle.className = `grid grid-cols-[repeat(${minTerms.length},1fr)] divide-x divide-amber-600/70 border-l border-b border-amber-600/70`;
  minTerms.forEach((m) => {
    const implicantColumnsMinTerm = document.createElement("p");
    implicantColumnsMinTerm.className = "text-center w-8 h-8";
    implicantColumnsMinTerm.innerText = m;
    implicantColumnsTitle.appendChild(implicantColumnsMinTerm);
  });
  implicantColumns.appendChild(implicantColumnsTitle);

  implicantStates.forEach((iState) => {
    const minTermsInStates = Object.values(iState)[0][1];
    const implicantColumnsItem = document.createElement("div");
    implicantColumnsItem.className = `grid grid-cols-[repeat(${minTerms.length},1fr)] divide-x divide-amber-600/70`;
    minTerms.forEach((m) => {
      const implicantColumnsMinTerm = document.createElement("p");
      implicantColumnsMinTerm.className = "text-center w-8 h-8";
      implicantColumnsMinTerm.innerText = minTermsInStates.includes(m)
        ? "X"
        : "";
      implicantColumnsItem.appendChild(implicantColumnsMinTerm);
    });
    implicantColumns.appendChild(implicantColumnsItem);
  });

  grid.appendChild(implicantColumns);

  outputReductions.appendChild(grid);
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

function getGroupSetFromImplicantStates(implicantStates) {
  return implicantStates.map((v) => {
    const key = Object.keys(v)[0];
    return { [key]: v[key][0] };
  });
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

function updateDisplay(
  currVariables,
  currInputMinTerms,
  currDontCareMinTerms,
  currAdjacents
) {
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

  mapContainer.className = `${MAP_CONTAINER_CLASS} grid-cols-${
    mapColCount + 1
  } grid-rows-${mapRowCount + 1} overflow-x-auto max-w-[90vw]`;

  refreshContainer(
    mapContentContainer,
    `${MAP_CONTENT_CONTAINER_CLASS} col-span-${mapColCount} row-span-${mapRowCount} grid-cols-[repeat(${mapColCount},1fr)] grid-rows-[repeat(${mapRowCount},1fr)]`
  );

  refreshContainer(
    mapColHeaderContainer,
    `${MAP_COL_HEADER_CONTAINER_CLASS} col-span-${mapColCount} grid-cols-[repeat(${mapColCount},1fr)]`
  );

  refreshContainer(
    mapRowHeaderContainer,
    `${MAP_ROW_HEADER_CONTAINER_CLASS} row-span-${mapRowCount} grid-rows-[repeat(${mapRowCount},1fr)]`
  );

  for (let i = 0; i < mapRowCount; i++) {
    for (let j = 0; j < mapColCount; j++) {
      const rowGreyCode = getGreyCode(i, rowVars.length);
      const colGreyCode = getGreyCode(j, colVars.length);

      const curr = document.createElement("div");
      curr.className = MAP_CONTENT_CELL_CONTAINER_CLASS;

      const currOut = document.createElement("output");
      currOut.className = MAP_CONTENT_CELL_OUTPUT_CLASS;
      const currCombination =
        rowCombinations[rowGreyCode] + colCombinations[colGreyCode];
      currOut.value = currInputMinTerms.includes(currCombination)
        ? currDontCareMinTerms.includes(currCombination)
          ? "X"
          : "1"
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
    )}rem] m-1 rounded -z-10 !bg-green-800/70 !border-2 !border-emerald-500`;

    mapContentContainer.appendChild(marker);
  });

  mapOutput.classList.remove("hidden");
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
    "place-self-stretch relative h-14 w-14 md:h-16 md:w-16 flex flex-col items-center justify-end pb-2";
  currExp.className = "text-xs md:text-sm";
  currExp.textContent = repFromExpression(colComb);
  currValue.className = "text-[0.50rem] md:text-xs";
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
