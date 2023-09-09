var inputDecimalNumber = 0,
  inpPrecision = "sp";

const outputs = {
  table: {
    sign: document.getElementById("output-sign"),
    mantissa: document.getElementById("output-mantissa"),
    exponent: document.getElementById("output-exponent"),
  },
  rep: {
    sign: document.getElementById("output-rep-sign"),
    mantissa: document.getElementById("output-rep-mantissa"),
    exponent: document.getElementById("output-rep-exponent"),
  },
};

function decimalNumberInputOnKeyUp(event) {
  inputDecimalNumber =
    event.target.value !== "" ? event.target.valueAsNumber : 0;
  getOutput();
}

function precisionInputOnChange(event) {
  inpPrecision = event.target.value;
  getOutput();
}

function getOutput() {
  const sign = Math.sign(inputDecimalNumber);
  outputs.table.sign.value = sign >= 0 ? 0 : 1;
  outputs.rep.sign.value = sign >= 0 ? "+" : "-";

  const [bin, exp] = convertDecToBinary();

  outputs.table.mantissa.value = bin;
  outputs.rep.mantissa.value = bin;

  outputs.table.exponent.value = exp;
  outputs.rep.exponent.value = exp;
}

function convertDecToBinary() {
  const [num, frac] = inputDecimalNumber.toString().split(".");
  const mantissaLength = inpPrecision === "sp" ? 23 : 52;
  const exponentLength = inpPrecision === "sp" ? 8 : 11;

  let binNum = "";

  if (num !== "0") {
    let r,
      n = Number(num);
    n *= Math.sign(n);
    while (n != 0) {
      r = n % 2;
      n = parseInt(n / 2);
      binNum = r.toString() + binNum;
    }
  } else binNum = "0";

  let binExp = (binNum.slice(1).length + 127).toString(2);
  binExp = "0".repeat(exponentLength - binExp.length) + binExp;

  if (!frac || frac === "" || Number(frac) === 0)
    return [
      "0".repeat(mantissaLength - binNum.length) + binNum,
      binNum === "0" ? "0".repeat(exponentLength) : binNum,
    ];

  const numcount = mantissaLength - binNum.length + 1;
  let binFrac = "";
  let n = Number("." + frac),
    i = 0,
    contains1 = false,
    isg1 = false,
    currMatissaLength = numcount;
  while (i < currMatissaLength) {
    n *= 2;
    isg1 = n >= 1;
    console.log(isg1);
    contains1 ||= isg1;
    binFrac += isg1 ? "1" : "0";
    n -= isg1 ? 1 : 0;
    if (!contains1) currMatissaLength += 1;
    console.log(currMatissaLength);
    i++;
  }

  console.log(binFrac);

  if (binNum.length === 1 && binFrac.indexOf("1") !== -1) {
    const ptmovecount = binFrac.indexOf("1") + 1;
    const slicedBinFrac = binFrac.slice(ptmovecount);
    binExp = (-ptmovecount + 127).toString(2);
    binExp = "0".repeat(exponentLength - binExp.length) + binExp;
    return [
      slicedBinFrac + "0".repeat(mantissaLength - slicedBinFrac.length),
      binExp,
    ];
  }

  return [`${binNum.slice(1)}${binFrac}`, binExp];
}
