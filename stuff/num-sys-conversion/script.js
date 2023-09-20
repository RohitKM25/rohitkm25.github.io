const numSystems = {
  2: ["0", "1"],
  8: ["0", "1", "2", "3", "4", "5", "6", "7"],
  10: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  16: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ],
};

var inputNumberSystem = "10",
  inputNumber = "0",
  inputOutputNumberSystem = "2";

const output = document.getElementById("output-number");

function numberInputOnKeyUp(event) {
  inputNumber = event.target.value ?? "0";
  getOutput();
}

function inputNumberSystemInputOnChange(event) {
  inputNumberSystem = event.target.value;
  getOutput();
}
function outputNumberSystemInputOnChange(event) {
  inputOutputNumberSystem = event.target.value;
  getOutput();
}

function getOutput() {
  const sign = inputNumber.includes("-") ? "-" : "";
  output.value = sign + convertFromDecimal(convertToDecimal(inputNumber));
}

function convertToDecimal(num) {
  let currNum = num.replace("-", "");
  if (Number(currNum) === 0) return "0";
  const radix = Number(inputNumberSystem);
  let outDec = 0;
  let i = currNum.length - 1;
  const indexOfPt = currNum.indexOf(".");
  let w = currNum.indexOf(".") !== -1 ? indexOfPt - currNum.length + 1 : 0;
  while (i >= 0) {
    if (currNum[i] === ".") {
      i--;
      continue;
    }
    const indexOfDigit = numSystems[radix].indexOf(currNum[i].toLowerCase());
    if (indexOfDigit === -1) return 0;
    outDec += indexOfDigit * Math.pow(radix, w);
    i--;
    w++;
  }
  return outDec;
}

function convertFromDecimal(num) {
  const [int, frac] = num.toString().split(".");
  const radix = Number(inputOutputNumberSystem);
  let out = "";
  if (Number(int) === 0) out = "0.";
  else {
    let n = Number(int);
    while (n != 0) {
      out = numSystems[radix][n % radix] + out;
      n = Math.floor(n / radix);
    }
    out += ".";
  }
  if (!frac || Number(frac) === 0) out += "0";
  else {
    let n = Number("." + frac),
      i = 0,
      maxFracPrecision = 32;
    let curr, flooredCurr;
    while (i < maxFracPrecision) {
      curr = n * radix;
      flooredCurr = Math.floor(curr);
      out += numSystems[radix][flooredCurr];
      n = curr - flooredCurr;
      if (n === 0) break;
      i++;
    }
  }
  return out;
}
