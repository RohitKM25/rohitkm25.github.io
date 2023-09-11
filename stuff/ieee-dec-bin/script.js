var inputDecimalNumber = "0",
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
  inputDecimalNumber = event.target.value ?? "0";
  document.getElementById("output-input-length").value =
    event.target.value.replace(".", "").length;
  getOutput();
}

function precisionInputOnChange(event) {
  inpPrecision = event.target.value;
  getOutput();
}

function getOutput() {
  const sign = Math.sign(
    !Number.isNaN(Number(inputDecimalNumber)) ? Number(inputDecimalNumber) : 0
  );
  outputs.table.sign.value = sign >= 0 ? 0 : 1;
  outputs.rep.sign.value = sign >= 0 ? "+" : "-";

  const [bin, exp] = convertDecToBinary();

  outputs.table.mantissa.value = bin;
  outputs.rep.mantissa.value = bin;

  outputs.table.exponent.value = exp;
  outputs.rep.exponent.value = exp;
}

function convertDecToBinary() {
  const [num, frac] = inputDecimalNumber.split(".");
  const mantissaLength = inpPrecision === "sp" ? 23 : 52;
  const exponentLength = inpPrecision === "sp" ? 8 : 11;
  const exponentExcess = inpPrecision === "sp" ? 127 : 1023;

  const binInt = convertIntegerDecimalToBinary(num);
  const binFrac = convertFractionDecimalToBinary(frac, mantissaLength);

  if (!binInt || !binFrac)
    return ["0".repeat(mantissaLength - 1) + "1", "1".repeat(exponentLength)];
  else if (binInt === "0" && binFrac === "0")
    return ["0".repeat(mantissaLength), "0".repeat(exponentLength)];

  let bin = `${binInt}.${binFrac}`;

  const indexOfPointBin = bin.indexOf(".");
  const indexOfOneBin = bin.indexOf("1");
  const expBias = indexOfPointBin > indexOfOneBin;
  const exp = expBias ? indexOfPointBin - 1 : -indexOfOneBin + 1;

  bin = bin.replace(".", "");
  bin = bin.slice(bin.indexOf("1") + 1);

  if (exp > exponentExcess)
    return ["0".repeat(mantissaLength), "1".repeat(exponentLength)];
  else if (exp < 1 - exponentExcess)
    return ["0".repeat(mantissaLength - 1) + "1", "0".repeat(exponentLength)];

  let binExp = (exp + exponentExcess).toString(2);
  binExp = "0".repeat(exponentLength - binExp.length) + binExp;

  bin =
    bin.slice(0, mantissaLength) +
    (mantissaLength > bin.length
      ? "0".repeat(mantissaLength - bin.length)
      : "");

  return [bin, binExp];
}

function convertIntegerDecimalToBinary(num) {
  if (Number.isNaN(Number(num))) return undefined;
  if (Number(num) === 0) return "0";
  let binInt = "";
  let r,
    n = BigInt(num);
  n *= n >= 0 ? 1n : -1n;
  while (n != 0) {
    console.log(r, n);
    r = Number(n % 2n);
    n = BigInt(n / 2n);
    binInt = r.toString() + binInt;
  }
  console.log(binInt);
  return binInt;
}

function convertFractionDecimalToBinary(frac, mantissaLength) {
  let mfrac = !frac ? "" : frac;

  if (Number.isNaN(Number(mfrac))) return undefined;
  if (Number(mfrac) === 0) return "0";

  let binFrac = "",
    n = Number("." + frac),
    i = 0,
    contains1 = false,
    isg1 = false,
    currMantissaLength = mantissaLength;
  while (i < currMantissaLength) {
    n *= 2;
    isg1 = n >= 1;
    currMantissaLength += contains1 ? 0 : 1;
    contains1 ||= isg1;
    binFrac += isg1 ? "1" : "0";
    n -= isg1 ? 1 : 0;
    i++;
  }
  return binFrac;
}
