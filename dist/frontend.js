// node_modules/@formatjs/fast-memoize/index.js
function memoize(fn, options) {
  const cache = options && options.cache ? options.cache : cacheDefault;
  const serializer = options && options.serializer ? options.serializer : serializerDefault;
  return (options && options.strategy ? options.strategy : strategyDefault)(fn, {
    cache,
    serializer
  });
}
function isPrimitive(value) {
  return value == null || typeof value === "number" || typeof value === "boolean";
}
function monadic(fn, cache, serializer, arg) {
  const cacheKey = isPrimitive(arg) ? arg : serializer(arg);
  let computedValue = cache.get(cacheKey);
  if (typeof computedValue === "undefined") {
    computedValue = fn.call(this, arg);
    cache.set(cacheKey, computedValue);
  }
  return computedValue;
}
function variadic(fn, cache, serializer) {
  const args = Array.prototype.slice.call(arguments, 3);
  const cacheKey = serializer(args);
  let computedValue = cache.get(cacheKey);
  if (typeof computedValue === "undefined") {
    computedValue = fn.apply(this, args);
    cache.set(cacheKey, computedValue);
  }
  return computedValue;
}
function assemble(fn, context, strategy, cache, serialize) {
  return strategy.bind(context, fn, cache, serialize);
}
function strategyDefault(fn, options) {
  const strategy = fn.length === 1 ? monadic : variadic;
  return assemble(fn, this, strategy, options.cache.create(), options.serializer);
}
function strategyVariadic(fn, options) {
  return assemble(fn, this, variadic, options.cache.create(), options.serializer);
}
function strategyMonadic(fn, options) {
  return assemble(fn, this, monadic, options.cache.create(), options.serializer);
}
var serializerDefault = function() {
  return JSON.stringify(arguments);
};
var ObjectWithoutPrototypeCache = class {
  constructor() {
    this.cache = Object.create(null);
  }
  get(key) {
    return this.cache[key];
  }
  set(key, value) {
    this.cache[key] = value;
  }
};
var cacheDefault = { create: function create() {
  return new ObjectWithoutPrototypeCache;
} };
var strategies = {
  variadic: strategyVariadic,
  monadic: strategyMonadic
};

// node_modules/@formatjs/icu-skeleton-parser/index.js
var DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
function parseDateTimeSkeleton(skeleton) {
  const result = {};
  skeleton.replace(DATE_TIME_REGEX, (match) => {
    const len = match.length;
    switch (match[0]) {
      case "G":
        result.era = len === 4 ? "long" : len === 5 ? "narrow" : "short";
        break;
      case "y":
        result.year = len === 2 ? "2-digit" : "numeric";
        break;
      case "Y":
      case "u":
      case "U":
      case "r":
        throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");
      case "q":
      case "Q":
        throw new RangeError("`q/Q` (quarter) patterns are not supported");
      case "M":
      case "L":
        result.month = [
          "numeric",
          "2-digit",
          "short",
          "long",
          "narrow"
        ][len - 1];
        break;
      case "w":
      case "W":
        throw new RangeError("`w/W` (week) patterns are not supported");
      case "d":
        result.day = ["numeric", "2-digit"][len - 1];
        break;
      case "D":
      case "F":
      case "g":
        throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");
      case "E":
        result.weekday = len === 4 ? "long" : len === 5 ? "narrow" : "short";
        break;
      case "e":
        if (len < 4)
          throw new RangeError("`e..eee` (weekday) patterns are not supported");
        result.weekday = [
          "short",
          "long",
          "narrow",
          "short"
        ][len - 3];
        break;
      case "c":
        if (len < 4)
          throw new RangeError("`c..ccc` (weekday) patterns are not supported");
        result.weekday = [
          "short",
          "long",
          "narrow",
          "short"
        ][len - 3];
        break;
      case "a":
        result.hour12 = true;
        break;
      case "b":
      case "B":
        throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");
      case "h":
        result.hourCycle = "h12";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "H":
        result.hourCycle = "h23";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "K":
        result.hourCycle = "h11";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "k":
        result.hourCycle = "h24";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "j":
      case "J":
      case "C":
        throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");
      case "m":
        result.minute = ["numeric", "2-digit"][len - 1];
        break;
      case "s":
        result.second = ["numeric", "2-digit"][len - 1];
        break;
      case "S":
      case "A":
        throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");
      case "z":
        result.timeZoneName = len < 4 ? "short" : "long";
        break;
      case "Z":
      case "O":
      case "v":
      case "V":
      case "X":
      case "x":
        throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead");
    }
    return "";
  });
  return result;
}
var WHITE_SPACE_REGEX = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;
function parseNumberSkeletonFromString(skeleton) {
  if (skeleton.length === 0)
    throw new Error("Number skeleton cannot be empty");
  const stringTokens = skeleton.split(WHITE_SPACE_REGEX).filter((x) => x.length > 0);
  const tokens = [];
  for (const stringToken of stringTokens) {
    let stemAndOptions = stringToken.split("/");
    if (stemAndOptions.length === 0)
      throw new Error("Invalid number skeleton");
    const [stem, ...options] = stemAndOptions;
    for (const option of options)
      if (option.length === 0)
        throw new Error("Invalid number skeleton");
    tokens.push({
      stem,
      options
    });
  }
  return tokens;
}
function icuUnitToEcma(unit) {
  return unit.replace(/^(.*?)-/, "");
}
var FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g;
var SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?[rs]?$/g;
var INTEGER_WIDTH_REGEX = /(\*)(0+)|(#+)(0+)|(0+)/g;
var CONCISE_INTEGER_WIDTH_REGEX = /^(0+)$/;
function parseSignificantPrecision(str) {
  const result = {};
  if (str[str.length - 1] === "r")
    result.roundingPriority = "morePrecision";
  else if (str[str.length - 1] === "s")
    result.roundingPriority = "lessPrecision";
  str.replace(SIGNIFICANT_PRECISION_REGEX, function(_, g1, g2) {
    if (typeof g2 !== "string") {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits = g1.length;
    } else if (g2 === "+")
      result.minimumSignificantDigits = g1.length;
    else if (g1[0] === "#")
      result.maximumSignificantDigits = g1.length;
    else {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits = g1.length + (typeof g2 === "string" ? g2.length : 0);
    }
    return "";
  });
  return result;
}
function parseSign(str) {
  switch (str) {
    case "sign-auto":
      return { signDisplay: "auto" };
    case "sign-accounting":
    case "()":
      return { currencySign: "accounting" };
    case "sign-always":
    case "+!":
      return { signDisplay: "always" };
    case "sign-accounting-always":
    case "()!":
      return {
        signDisplay: "always",
        currencySign: "accounting"
      };
    case "sign-except-zero":
    case "+?":
      return { signDisplay: "exceptZero" };
    case "sign-accounting-except-zero":
    case "()?":
      return {
        signDisplay: "exceptZero",
        currencySign: "accounting"
      };
    case "sign-never":
    case "+_":
      return { signDisplay: "never" };
  }
}
function parseConciseScientificAndEngineeringStem(stem) {
  let result;
  if (stem[0] === "E" && stem[1] === "E") {
    result = { notation: "engineering" };
    stem = stem.slice(2);
  } else if (stem[0] === "E") {
    result = { notation: "scientific" };
    stem = stem.slice(1);
  }
  if (result) {
    const signDisplay = stem.slice(0, 2);
    if (signDisplay === "+!") {
      result.signDisplay = "always";
      stem = stem.slice(2);
    } else if (signDisplay === "+?") {
      result.signDisplay = "exceptZero";
      stem = stem.slice(2);
    }
    if (!CONCISE_INTEGER_WIDTH_REGEX.test(stem))
      throw new Error("Malformed concise eng/scientific notation");
    result.minimumIntegerDigits = stem.length;
  }
  return result;
}
function parseNotationOptions(opt) {
  const result = {};
  const signOpts = parseSign(opt);
  if (signOpts)
    return signOpts;
  return result;
}
function parseNumberSkeleton(tokens) {
  let result = {};
  for (const token of tokens) {
    switch (token.stem) {
      case "percent":
      case "%":
        result.style = "percent";
        continue;
      case "%x100":
        result.style = "percent";
        result.scale = 100;
        continue;
      case "currency":
        result.style = "currency";
        result.currency = token.options[0];
        continue;
      case "group-off":
      case ",_":
        result.useGrouping = false;
        continue;
      case "precision-integer":
      case ".":
        result.maximumFractionDigits = 0;
        continue;
      case "measure-unit":
      case "unit":
        result.style = "unit";
        result.unit = icuUnitToEcma(token.options[0]);
        continue;
      case "compact-short":
      case "K":
        result.notation = "compact";
        result.compactDisplay = "short";
        continue;
      case "compact-long":
      case "KK":
        result.notation = "compact";
        result.compactDisplay = "long";
        continue;
      case "scientific":
        result = {
          ...result,
          notation: "scientific",
          ...token.options.reduce((all, opt) => ({
            ...all,
            ...parseNotationOptions(opt)
          }), {})
        };
        continue;
      case "engineering":
        result = {
          ...result,
          notation: "engineering",
          ...token.options.reduce((all, opt) => ({
            ...all,
            ...parseNotationOptions(opt)
          }), {})
        };
        continue;
      case "notation-simple":
        result.notation = "standard";
        continue;
      case "unit-width-narrow":
        result.currencyDisplay = "narrowSymbol";
        result.unitDisplay = "narrow";
        continue;
      case "unit-width-short":
        result.currencyDisplay = "code";
        result.unitDisplay = "short";
        continue;
      case "unit-width-full-name":
        result.currencyDisplay = "name";
        result.unitDisplay = "long";
        continue;
      case "unit-width-iso-code":
        result.currencyDisplay = "symbol";
        continue;
      case "scale":
        result.scale = parseFloat(token.options[0]);
        continue;
      case "rounding-mode-floor":
        result.roundingMode = "floor";
        continue;
      case "rounding-mode-ceiling":
        result.roundingMode = "ceil";
        continue;
      case "rounding-mode-down":
        result.roundingMode = "trunc";
        continue;
      case "rounding-mode-up":
        result.roundingMode = "expand";
        continue;
      case "rounding-mode-half-even":
        result.roundingMode = "halfEven";
        continue;
      case "rounding-mode-half-down":
        result.roundingMode = "halfTrunc";
        continue;
      case "rounding-mode-half-up":
        result.roundingMode = "halfExpand";
        continue;
      case "integer-width":
        if (token.options.length > 1)
          throw new RangeError("integer-width stems only accept a single optional option");
        token.options[0].replace(INTEGER_WIDTH_REGEX, function(_, g1, g2, g3, g4, g5) {
          if (g1)
            result.minimumIntegerDigits = g2.length;
          else if (g3 && g4)
            throw new Error("We currently do not support maximum integer digits");
          else if (g5)
            throw new Error("We currently do not support exact integer digits");
          return "";
        });
        continue;
    }
    if (CONCISE_INTEGER_WIDTH_REGEX.test(token.stem)) {
      result.minimumIntegerDigits = token.stem.length;
      continue;
    }
    if (FRACTION_PRECISION_REGEX.test(token.stem)) {
      if (token.options.length > 1)
        throw new RangeError("Fraction-precision stems only accept a single optional option");
      token.stem.replace(FRACTION_PRECISION_REGEX, function(_, g1, g2, g3, g4, g5) {
        if (g2 === "*")
          result.minimumFractionDigits = g1.length;
        else if (g3 && g3[0] === "#")
          result.maximumFractionDigits = g3.length;
        else if (g4 && g5) {
          result.minimumFractionDigits = g4.length;
          result.maximumFractionDigits = g4.length + g5.length;
        } else {
          result.minimumFractionDigits = g1.length;
          result.maximumFractionDigits = g1.length;
        }
        return "";
      });
      const opt = token.options[0];
      if (opt === "w")
        result = {
          ...result,
          trailingZeroDisplay: "stripIfInteger"
        };
      else if (opt)
        result = {
          ...result,
          ...parseSignificantPrecision(opt)
        };
      continue;
    }
    if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
      result = {
        ...result,
        ...parseSignificantPrecision(token.stem)
      };
      continue;
    }
    const signOpts = parseSign(token.stem);
    if (signOpts)
      result = {
        ...result,
        ...signOpts
      };
    const conciseScientificAndEngineeringOpts = parseConciseScientificAndEngineeringStem(token.stem);
    if (conciseScientificAndEngineeringOpts)
      result = {
        ...result,
        ...conciseScientificAndEngineeringOpts
      };
  }
  return result;
}

// node_modules/@formatjs/icu-messageformat-parser/index.js
var ErrorKind = /* @__PURE__ */ function(ErrorKind) {
  ErrorKind[ErrorKind["EXPECT_ARGUMENT_CLOSING_BRACE"] = 1] = "EXPECT_ARGUMENT_CLOSING_BRACE";
  ErrorKind[ErrorKind["EMPTY_ARGUMENT"] = 2] = "EMPTY_ARGUMENT";
  ErrorKind[ErrorKind["MALFORMED_ARGUMENT"] = 3] = "MALFORMED_ARGUMENT";
  ErrorKind[ErrorKind["EXPECT_ARGUMENT_TYPE"] = 4] = "EXPECT_ARGUMENT_TYPE";
  ErrorKind[ErrorKind["INVALID_ARGUMENT_TYPE"] = 5] = "INVALID_ARGUMENT_TYPE";
  ErrorKind[ErrorKind["EXPECT_ARGUMENT_STYLE"] = 6] = "EXPECT_ARGUMENT_STYLE";
  ErrorKind[ErrorKind["INVALID_NUMBER_SKELETON"] = 7] = "INVALID_NUMBER_SKELETON";
  ErrorKind[ErrorKind["INVALID_DATE_TIME_SKELETON"] = 8] = "INVALID_DATE_TIME_SKELETON";
  ErrorKind[ErrorKind["EXPECT_NUMBER_SKELETON"] = 9] = "EXPECT_NUMBER_SKELETON";
  ErrorKind[ErrorKind["EXPECT_DATE_TIME_SKELETON"] = 10] = "EXPECT_DATE_TIME_SKELETON";
  ErrorKind[ErrorKind["UNCLOSED_QUOTE_IN_ARGUMENT_STYLE"] = 11] = "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE";
  ErrorKind[ErrorKind["EXPECT_SELECT_ARGUMENT_OPTIONS"] = 12] = "EXPECT_SELECT_ARGUMENT_OPTIONS";
  ErrorKind[ErrorKind["EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE"] = 13] = "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE";
  ErrorKind[ErrorKind["INVALID_PLURAL_ARGUMENT_OFFSET_VALUE"] = 14] = "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE";
  ErrorKind[ErrorKind["EXPECT_SELECT_ARGUMENT_SELECTOR"] = 15] = "EXPECT_SELECT_ARGUMENT_SELECTOR";
  ErrorKind[ErrorKind["EXPECT_PLURAL_ARGUMENT_SELECTOR"] = 16] = "EXPECT_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind[ErrorKind["EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT"] = 17] = "EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT";
  ErrorKind[ErrorKind["EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT"] = 18] = "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT";
  ErrorKind[ErrorKind["INVALID_PLURAL_ARGUMENT_SELECTOR"] = 19] = "INVALID_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind[ErrorKind["DUPLICATE_PLURAL_ARGUMENT_SELECTOR"] = 20] = "DUPLICATE_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind[ErrorKind["DUPLICATE_SELECT_ARGUMENT_SELECTOR"] = 21] = "DUPLICATE_SELECT_ARGUMENT_SELECTOR";
  ErrorKind[ErrorKind["MISSING_OTHER_CLAUSE"] = 22] = "MISSING_OTHER_CLAUSE";
  ErrorKind[ErrorKind["INVALID_TAG"] = 23] = "INVALID_TAG";
  ErrorKind[ErrorKind["INVALID_TAG_NAME"] = 25] = "INVALID_TAG_NAME";
  ErrorKind[ErrorKind["UNMATCHED_CLOSING_TAG"] = 26] = "UNMATCHED_CLOSING_TAG";
  ErrorKind[ErrorKind["UNCLOSED_TAG"] = 27] = "UNCLOSED_TAG";
  return ErrorKind;
}({});
function isLiteralElement(el) {
  return el.type === 0;
}
function isArgumentElement(el) {
  return el.type === 1;
}
function isNumberElement(el) {
  return el.type === 2;
}
function isDateElement(el) {
  return el.type === 3;
}
function isTimeElement(el) {
  return el.type === 4;
}
function isSelectElement(el) {
  return el.type === 5;
}
function isPluralElement(el) {
  return el.type === 6;
}
function isPoundElement(el) {
  return el.type === 7;
}
function isTagElement(el) {
  return el.type === 8;
}
function isNumberSkeleton(el) {
  return !!(el && typeof el === "object" && el.type === 0);
}
function isDateTimeSkeleton(el) {
  return !!(el && typeof el === "object" && el.type === 1);
}
var SPACE_SEPARATOR_REGEX = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;
var IDENTIFIER_PREFIX_REGEX = /([^\t-\r -\/:-@\[-\^`\{-~\x85\xA0-\xA7\xA9\xAB\xAC\xAE\xB0\xB1\xB6\xBB\xBF\xD7\xF7\u1680\u2000-\u200A\u2010-\u2029\u202F-\u203E\u2041-\u2053\u2055-\u205F\u2190-\u245F\u2500-\u2775\u2794-\u2BFF\u2E00-\u2E7F\u3000-\u3003\u3008-\u3020\u3030\uFD3E\uFD3F\uFE45\uFE46]*)/g;
var timeData = {
  "001": ["H", "h"],
  "419": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  AC: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  AD: ["H", "hB"],
  AE: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  AF: [
    "H",
    "hb",
    "hB",
    "h"
  ],
  AG: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  AI: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  AL: [
    "h",
    "H",
    "hB"
  ],
  AM: ["H", "hB"],
  AO: ["H", "hB"],
  AR: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  AS: ["h", "H"],
  AT: ["H", "hB"],
  AU: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  AW: ["H", "hB"],
  AX: ["H"],
  AZ: [
    "H",
    "hB",
    "h"
  ],
  BA: [
    "H",
    "hB",
    "h"
  ],
  BB: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  BD: [
    "h",
    "hB",
    "H"
  ],
  BE: ["H", "hB"],
  BF: ["H", "hB"],
  BG: [
    "H",
    "hB",
    "h"
  ],
  BH: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  BI: ["H", "h"],
  BJ: ["H", "hB"],
  BL: ["H", "hB"],
  BM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  BN: [
    "hb",
    "hB",
    "h",
    "H"
  ],
  BO: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  BQ: ["H"],
  BR: ["H", "hB"],
  BS: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  BT: ["h", "H"],
  BW: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  BY: ["H", "h"],
  BZ: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  CA: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  CC: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  CD: ["hB", "H"],
  CF: [
    "H",
    "h",
    "hB"
  ],
  CG: ["H", "hB"],
  CH: [
    "H",
    "hB",
    "h"
  ],
  CI: ["H", "hB"],
  CK: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  CL: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  CM: [
    "H",
    "h",
    "hB"
  ],
  CN: [
    "H",
    "hB",
    "hb",
    "h"
  ],
  CO: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  CP: ["H"],
  CR: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  CU: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  CV: ["H", "hB"],
  CW: ["H", "hB"],
  CX: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  CY: [
    "h",
    "H",
    "hb",
    "hB"
  ],
  CZ: ["H"],
  DE: ["H", "hB"],
  DG: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  DJ: ["h", "H"],
  DK: ["H"],
  DM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  DO: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  DZ: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  EA: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  EC: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  EE: ["H", "hB"],
  EG: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  EH: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  ER: ["h", "H"],
  ES: [
    "H",
    "hB",
    "h",
    "hb"
  ],
  ET: [
    "hB",
    "hb",
    "h",
    "H"
  ],
  FI: ["H"],
  FJ: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  FK: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  FM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  FO: ["H", "h"],
  FR: ["H", "hB"],
  GA: ["H", "hB"],
  GB: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  GD: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  GE: [
    "H",
    "hB",
    "h"
  ],
  GF: ["H", "hB"],
  GG: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  GH: ["h", "H"],
  GI: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  GL: ["H", "h"],
  GM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  GN: ["H", "hB"],
  GP: ["H", "hB"],
  GQ: [
    "H",
    "hB",
    "h",
    "hb"
  ],
  GR: [
    "h",
    "H",
    "hb",
    "hB"
  ],
  GS: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  GT: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  GU: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  GW: ["H", "hB"],
  GY: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  HK: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  HN: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  HR: ["H", "hB"],
  HU: ["H", "h"],
  IC: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  ID: ["H"],
  IE: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  IL: ["H", "hB"],
  IM: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  IN: ["h", "H"],
  IO: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  IQ: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  IR: ["hB", "H"],
  IS: ["H"],
  IT: ["H", "hB"],
  JE: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  JM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  JO: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  JP: [
    "H",
    "K",
    "h"
  ],
  KE: [
    "hB",
    "hb",
    "H",
    "h"
  ],
  KG: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  KH: [
    "hB",
    "h",
    "H",
    "hb"
  ],
  KI: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  KM: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  KN: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  KP: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  KR: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  KW: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  KY: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  KZ: ["H", "hB"],
  LA: [
    "H",
    "hb",
    "hB",
    "h"
  ],
  LB: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  LC: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  LI: [
    "H",
    "hB",
    "h"
  ],
  LK: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  LR: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  LS: ["h", "H"],
  LT: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  LU: [
    "H",
    "h",
    "hB"
  ],
  LV: [
    "H",
    "hB",
    "hb",
    "h"
  ],
  LY: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  MA: [
    "H",
    "h",
    "hB",
    "hb"
  ],
  MC: ["H", "hB"],
  MD: ["H", "hB"],
  ME: [
    "H",
    "hB",
    "h"
  ],
  MF: ["H", "hB"],
  MG: ["H", "h"],
  MH: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  MK: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  ML: ["H"],
  MM: [
    "hB",
    "hb",
    "H",
    "h"
  ],
  MN: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  MO: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  MP: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  MQ: ["H", "hB"],
  MR: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  MS: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  MT: ["H", "h"],
  MU: ["H", "h"],
  MV: ["H", "h"],
  MW: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  MX: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  MY: [
    "hb",
    "hB",
    "h",
    "H"
  ],
  MZ: ["H", "hB"],
  NA: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  NC: ["H", "hB"],
  NE: ["H"],
  NF: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  NG: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  NI: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  NL: ["H", "hB"],
  NO: ["H", "h"],
  NP: [
    "H",
    "h",
    "hB"
  ],
  NR: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  NU: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  NZ: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  OM: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  PA: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  PE: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  PF: [
    "H",
    "h",
    "hB"
  ],
  PG: ["h", "H"],
  PH: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  PK: [
    "h",
    "hB",
    "H"
  ],
  PL: ["H", "h"],
  PM: ["H", "hB"],
  PN: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  PR: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  PS: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  PT: ["H", "hB"],
  PW: ["h", "H"],
  PY: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  QA: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  RE: ["H", "hB"],
  RO: ["H", "hB"],
  RS: [
    "H",
    "hB",
    "h"
  ],
  RU: ["H"],
  RW: ["H", "h"],
  SA: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  SB: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  SC: [
    "H",
    "h",
    "hB"
  ],
  SD: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  SE: ["H"],
  SG: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  SH: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  SI: ["H", "hB"],
  SJ: ["H"],
  SK: ["H"],
  SL: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  SM: [
    "H",
    "h",
    "hB"
  ],
  SN: [
    "H",
    "h",
    "hB"
  ],
  SO: ["h", "H"],
  SR: ["H", "hB"],
  SS: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  ST: ["H", "hB"],
  SV: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  SX: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  SY: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  SZ: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  TA: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  TC: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  TD: [
    "h",
    "H",
    "hB"
  ],
  TF: [
    "H",
    "h",
    "hB"
  ],
  TG: ["H", "hB"],
  TH: ["H", "h"],
  TJ: ["H", "h"],
  TL: [
    "H",
    "hB",
    "hb",
    "h"
  ],
  TM: ["H", "h"],
  TN: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  TO: ["h", "H"],
  TR: ["H", "hB"],
  TT: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  TW: [
    "hB",
    "hb",
    "h",
    "H"
  ],
  TZ: [
    "hB",
    "hb",
    "H",
    "h"
  ],
  UA: [
    "H",
    "hB",
    "h"
  ],
  UG: [
    "hB",
    "hb",
    "H",
    "h"
  ],
  UM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  US: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  UY: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  UZ: [
    "H",
    "hB",
    "h"
  ],
  VA: [
    "H",
    "h",
    "hB"
  ],
  VC: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  VE: [
    "h",
    "H",
    "hB",
    "hb"
  ],
  VG: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  VI: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  VN: ["H", "h"],
  VU: ["h", "H"],
  WF: ["H", "hB"],
  WS: ["h", "H"],
  XK: [
    "H",
    "hB",
    "h"
  ],
  YE: [
    "h",
    "hB",
    "hb",
    "H"
  ],
  YT: ["H", "hB"],
  ZA: [
    "H",
    "h",
    "hb",
    "hB"
  ],
  ZM: [
    "h",
    "hb",
    "H",
    "hB"
  ],
  ZW: ["H", "h"],
  "af-ZA": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "ar-001": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "ca-ES": [
    "H",
    "h",
    "hB"
  ],
  "en-001": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "en-HK": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "en-IL": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "en-MY": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "es-BR": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-ES": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-GQ": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "fr-CA": [
    "H",
    "h",
    "hB"
  ],
  "gl-ES": [
    "H",
    "h",
    "hB"
  ],
  "gu-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "hi-IN": [
    "hB",
    "h",
    "H"
  ],
  "it-CH": [
    "H",
    "h",
    "hB"
  ],
  "it-IT": [
    "H",
    "h",
    "hB"
  ],
  "kn-IN": [
    "hB",
    "h",
    "H"
  ],
  "ku-SY": ["H", "hB"],
  "ml-IN": [
    "hB",
    "h",
    "H"
  ],
  "mr-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "pa-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "ta-IN": [
    "hB",
    "h",
    "hb",
    "H"
  ],
  "te-IN": [
    "hB",
    "h",
    "H"
  ],
  "zu-ZA": [
    "H",
    "hB",
    "hb",
    "h"
  ]
};
function getBestPattern(skeleton, locale) {
  let skeletonCopy = "";
  for (let patternPos = 0;patternPos < skeleton.length; patternPos++) {
    const patternChar = skeleton.charAt(patternPos);
    if (patternChar === "j") {
      let extraLength = 0;
      while (patternPos + 1 < skeleton.length && skeleton.charAt(patternPos + 1) === patternChar) {
        extraLength++;
        patternPos++;
      }
      let hourLen = 1 + (extraLength & 1);
      let dayPeriodLen = extraLength < 2 ? 1 : 3 + (extraLength >> 1);
      let dayPeriodChar = "a";
      let hourChar = getDefaultHourSymbolFromLocale(locale);
      if (hourChar == "H" || hourChar == "k")
        dayPeriodLen = 0;
      while (dayPeriodLen-- > 0)
        skeletonCopy += dayPeriodChar;
      while (hourLen-- > 0)
        skeletonCopy = hourChar + skeletonCopy;
    } else if (patternChar === "J")
      skeletonCopy += "H";
    else
      skeletonCopy += patternChar;
  }
  return skeletonCopy;
}
function getDefaultHourSymbolFromLocale(locale) {
  let hourCycle = locale.hourCycle;
  if (hourCycle === undefined) {
    const localeWithHourCycles = locale;
    hourCycle = localeWithHourCycles.getHourCycles?.()[0] ?? localeWithHourCycles.hourCycles?.[0];
  }
  if (hourCycle)
    switch (hourCycle) {
      case "h24":
        return "k";
      case "h23":
        return "H";
      case "h12":
        return "h";
      case "h11":
        return "K";
      default:
        throw new Error("Invalid hourCycle");
    }
  const languageTag = locale.language;
  let regionTag;
  if (languageTag !== "root")
    regionTag = locale.maximize().region;
  return (timeData[`${languageTag}-${regionTag}`] || timeData[regionTag || ""] || timeData[languageTag || ""] || timeData[`${languageTag}-001`] || timeData["001"])[0].charAt(0);
}
var SPACE_SEPARATOR_START_REGEX = new RegExp(`^${SPACE_SEPARATOR_REGEX.source}*`);
var SPACE_SEPARATOR_END_REGEX = new RegExp(`${SPACE_SEPARATOR_REGEX.source}*$`);
function createLocation(start, end) {
  return {
    start,
    end
  };
}
var hasNativeFromEntries = !!Object.fromEntries;
var hasTrimStart = !!String.prototype.trimStart;
var hasTrimEnd = !!String.prototype.trimEnd;
var fromEntries = hasNativeFromEntries ? Object.fromEntries : function fromEntries(entries) {
  const obj = {};
  for (const [k, v] of entries)
    obj[k] = v;
  return obj;
};
var trimStart = hasTrimStart ? function trimStart(s) {
  return s.trimStart();
} : function trimStart(s) {
  return s.replace(SPACE_SEPARATOR_START_REGEX, "");
};
var trimEnd = hasTrimEnd ? function trimEnd(s) {
  return s.trimEnd();
} : function trimEnd(s) {
  return s.replace(SPACE_SEPARATOR_END_REGEX, "");
};
var IDENTIFIER_PREFIX_RE = createIdentifierPrefixRegex();
function createIdentifierPrefixRegex() {
  try {
    const regex = new RegExp("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu");
    if (regex.exec("a ")?.[1] === "a")
      return regex;
  } catch {}
  return IDENTIFIER_PREFIX_REGEX;
}
function matchIdentifierAtIndex(s, index) {
  IDENTIFIER_PREFIX_RE.lastIndex = index;
  return IDENTIFIER_PREFIX_RE.exec(s)[1] ?? "";
}
function plainTopLevelEndPosition(message) {
  if (message.length === 0)
    return null;
  let line = 1;
  let column = 1;
  for (let offset = 0;offset < message.length; ) {
    const code = message.charCodeAt(offset);
    switch (code) {
      case 35:
      case 39:
      case 60:
      case 123:
      case 125:
        return null;
    }
    if (code === 10) {
      line++;
      column = 1;
      offset++;
    } else {
      column++;
      if (code >= 55296 && code <= 56319 && offset + 1 < message.length) {
        const next = message.charCodeAt(offset + 1);
        offset += next >= 56320 && next <= 57343 ? 2 : 1;
      } else
        offset++;
    }
  }
  return {
    offset: message.length,
    line,
    column
  };
}
var Parser = class {
  constructor(message, options = {}) {
    this.message = message;
    this.position = {
      offset: 0,
      line: 1,
      column: 1
    };
    this.ignoreTag = !!options.ignoreTag;
    this.locale = options.locale;
    this.requiresOtherClause = !!options.requiresOtherClause;
    this.shouldParseSkeletons = !!options.shouldParseSkeletons;
  }
  parse() {
    if (this.offset() !== 0)
      throw Error("parser can only be used once");
    if (this.message.length > 0) {
      const firstCode = this.message.charCodeAt(0);
      if (firstCode !== 35 && firstCode !== 39 && firstCode !== 60 && firstCode !== 123 && firstCode !== 125) {
        const plainEndPosition = plainTopLevelEndPosition(this.message);
        if (plainEndPosition) {
          const start = this.clonePosition();
          this.position = plainEndPosition;
          return {
            val: [{
              type: 0,
              value: this.message,
              location: createLocation(start, this.clonePosition())
            }],
            err: null
          };
        }
      }
    }
    return this.parseMessage(0, "", false);
  }
  parseMessage(nestingLevel, parentArgType, expectingCloseTag) {
    let elements = [];
    while (!this.isEOF()) {
      const char = this.char();
      if (char === 123) {
        const result = this.parseArgument(nestingLevel, expectingCloseTag);
        if (result.err)
          return result;
        elements.push(result.val);
      } else if (char === 125 && nestingLevel > 0)
        break;
      else if (char === 35 && (parentArgType === "plural" || parentArgType === "selectordinal")) {
        const position = this.clonePosition();
        this.bump();
        elements.push({
          type: 7,
          location: createLocation(position, this.clonePosition())
        });
      } else if (char === 60 && !this.ignoreTag && this.peek() === 47) {
        if (expectingCloseTag)
          break;
        else
          return this.error(26, createLocation(this.clonePosition(), this.clonePosition()));
      } else if (char === 60 && !this.ignoreTag && _isAlpha(this.peek() || 0)) {
        const result = this.parseTag(nestingLevel, parentArgType);
        if (result.err)
          return result;
        elements.push(result.val);
      } else {
        const result = this.parseLiteral(nestingLevel, parentArgType);
        if (result.err)
          return result;
        elements.push(result.val);
      }
    }
    return {
      val: elements,
      err: null
    };
  }
  parseTag(nestingLevel, parentArgType) {
    const startPosition = this.clonePosition();
    this.bump();
    const tagName = this.parseTagName();
    this.bumpSpace();
    if (this.bumpIf("/>"))
      return {
        val: {
          type: 0,
          value: `<${tagName}/>`,
          location: createLocation(startPosition, this.clonePosition())
        },
        err: null
      };
    else if (this.bumpIf(">")) {
      const childrenResult = this.parseMessage(nestingLevel + 1, parentArgType, true);
      if (childrenResult.err)
        return childrenResult;
      const children = childrenResult.val;
      const endTagStartPosition = this.clonePosition();
      if (this.bumpIf("</")) {
        if (this.isEOF() || !_isAlpha(this.char()))
          return this.error(23, createLocation(endTagStartPosition, this.clonePosition()));
        const closingTagNameStartPosition = this.clonePosition();
        if (tagName !== this.parseTagName())
          return this.error(26, createLocation(closingTagNameStartPosition, this.clonePosition()));
        this.bumpSpace();
        if (!this.bumpIf(">"))
          return this.error(23, createLocation(endTagStartPosition, this.clonePosition()));
        return {
          val: {
            type: 8,
            value: tagName,
            children,
            location: createLocation(startPosition, this.clonePosition())
          },
          err: null
        };
      } else
        return this.error(27, createLocation(startPosition, this.clonePosition()));
    } else
      return this.error(23, createLocation(startPosition, this.clonePosition()));
  }
  parseTagName() {
    const startOffset = this.offset();
    this.bump();
    while (!this.isEOF() && _isPotentialElementNameChar(this.char()))
      this.bump();
    return this.message.slice(startOffset, this.offset());
  }
  parseLiteral(nestingLevel, parentArgType) {
    const start = this.clonePosition();
    let value = "";
    while (true) {
      const parseQuoteResult = this.tryParseQuote(parentArgType);
      if (parseQuoteResult) {
        value += parseQuoteResult;
        continue;
      }
      const parseUnquotedResult = this.tryParseUnquoted(nestingLevel, parentArgType);
      if (parseUnquotedResult) {
        value += parseUnquotedResult;
        continue;
      }
      const parseLeftAngleResult = this.tryParseLeftAngleBracket();
      if (parseLeftAngleResult) {
        value += parseLeftAngleResult;
        continue;
      }
      break;
    }
    const location = createLocation(start, this.clonePosition());
    return {
      val: {
        type: 0,
        value,
        location
      },
      err: null
    };
  }
  tryParseLeftAngleBracket() {
    if (!this.isEOF() && this.char() === 60 && (this.ignoreTag || !_isAlphaOrSlash(this.peek() || 0))) {
      this.bump();
      return "<";
    }
    return null;
  }
  tryParseQuote(parentArgType) {
    if (this.isEOF() || this.char() !== 39)
      return null;
    switch (this.peek()) {
      case 39:
        this.bump();
        this.bump();
        return "'";
      case 123:
      case 60:
      case 62:
      case 125:
        break;
      case 35:
        if (parentArgType === "plural" || parentArgType === "selectordinal")
          break;
        return null;
      default:
        return null;
    }
    this.bump();
    const codePoints = [this.char()];
    this.bump();
    while (!this.isEOF()) {
      const ch = this.char();
      if (ch === 39) {
        if (this.peek() === 39) {
          codePoints.push(39);
          this.bump();
        } else {
          this.bump();
          break;
        }
      } else
        codePoints.push(ch);
      this.bump();
    }
    return String.fromCodePoint(...codePoints);
  }
  tryParseUnquoted(nestingLevel, parentArgType) {
    if (this.isEOF())
      return null;
    const ch = this.char();
    if (ch === 60 || ch === 123 || ch === 35 && (parentArgType === "plural" || parentArgType === "selectordinal") || ch === 125 && nestingLevel > 0)
      return null;
    else {
      this.bump();
      return String.fromCodePoint(ch);
    }
  }
  parseArgument(nestingLevel, expectingCloseTag) {
    const openingBracePosition = this.clonePosition();
    this.bump();
    this.bumpSpace();
    if (this.isEOF())
      return this.error(1, createLocation(openingBracePosition, this.clonePosition()));
    if (this.char() === 125) {
      this.bump();
      return this.error(2, createLocation(openingBracePosition, this.clonePosition()));
    }
    let value = this.parseIdentifierIfPossible().value;
    if (!value)
      return this.error(3, createLocation(openingBracePosition, this.clonePosition()));
    this.bumpSpace();
    if (this.isEOF())
      return this.error(1, createLocation(openingBracePosition, this.clonePosition()));
    switch (this.char()) {
      case 125:
        this.bump();
        return {
          val: {
            type: 1,
            value,
            location: createLocation(openingBracePosition, this.clonePosition())
          },
          err: null
        };
      case 44:
        this.bump();
        this.bumpSpace();
        if (this.isEOF())
          return this.error(1, createLocation(openingBracePosition, this.clonePosition()));
        return this.parseArgumentOptions(nestingLevel, expectingCloseTag, value, openingBracePosition);
      default:
        return this.error(3, createLocation(openingBracePosition, this.clonePosition()));
    }
  }
  parseIdentifierIfPossible() {
    const startingPosition = this.clonePosition();
    const startOffset = this.offset();
    const value = matchIdentifierAtIndex(this.message, startOffset);
    const endOffset = startOffset + value.length;
    this.bumpTo(endOffset);
    return {
      value,
      location: createLocation(startingPosition, this.clonePosition())
    };
  }
  parseArgumentOptions(nestingLevel, expectingCloseTag, value, openingBracePosition) {
    let typeStartPosition = this.clonePosition();
    let argType = this.parseIdentifierIfPossible().value;
    let typeEndPosition = this.clonePosition();
    switch (argType) {
      case "":
        return this.error(4, createLocation(typeStartPosition, typeEndPosition));
      case "number":
      case "date":
      case "time": {
        this.bumpSpace();
        let styleAndLocation = null;
        if (this.bumpIf(",")) {
          this.bumpSpace();
          const styleStartPosition = this.clonePosition();
          const result = this.parseSimpleArgStyleIfPossible();
          if (result.err)
            return result;
          const style = trimEnd(result.val);
          if (style.length === 0)
            return this.error(6, createLocation(this.clonePosition(), this.clonePosition()));
          styleAndLocation = {
            style,
            styleLocation: createLocation(styleStartPosition, this.clonePosition())
          };
        }
        const argCloseResult = this.tryParseArgumentClose(openingBracePosition);
        if (argCloseResult.err)
          return argCloseResult;
        const location = createLocation(openingBracePosition, this.clonePosition());
        if (styleAndLocation && styleAndLocation.style.startsWith("::")) {
          let skeleton = trimStart(styleAndLocation.style.slice(2));
          if (argType === "number") {
            const result = this.parseNumberSkeletonFromString(skeleton, styleAndLocation.styleLocation);
            if (result.err)
              return result;
            return {
              val: {
                type: 2,
                value,
                location,
                style: result.val
              },
              err: null
            };
          } else {
            if (skeleton.length === 0)
              return this.error(10, location);
            let dateTimePattern = skeleton;
            if (this.locale)
              dateTimePattern = getBestPattern(skeleton, this.locale);
            const style = {
              type: 1,
              pattern: dateTimePattern,
              location: styleAndLocation.styleLocation,
              parsedOptions: this.shouldParseSkeletons ? parseDateTimeSkeleton(dateTimePattern) : {}
            };
            return {
              val: {
                type: argType === "date" ? 3 : 4,
                value,
                location,
                style
              },
              err: null
            };
          }
        }
        return {
          val: {
            type: argType === "number" ? 2 : argType === "date" ? 3 : 4,
            value,
            location,
            style: styleAndLocation?.style ?? null
          },
          err: null
        };
      }
      case "plural":
      case "selectordinal":
      case "select": {
        const typeEndPosition = this.clonePosition();
        this.bumpSpace();
        if (!this.bumpIf(","))
          return this.error(12, createLocation(typeEndPosition, { ...typeEndPosition }));
        this.bumpSpace();
        let identifierAndLocation = this.parseIdentifierIfPossible();
        let pluralOffset = 0;
        if (argType !== "select" && identifierAndLocation.value === "offset") {
          if (!this.bumpIf(":"))
            return this.error(13, createLocation(this.clonePosition(), this.clonePosition()));
          this.bumpSpace();
          const result = this.tryParseDecimalInteger(13, 14);
          if (result.err)
            return result;
          this.bumpSpace();
          identifierAndLocation = this.parseIdentifierIfPossible();
          pluralOffset = result.val;
        }
        const optionsResult = this.tryParsePluralOrSelectOptions(nestingLevel, argType, expectingCloseTag, identifierAndLocation);
        if (optionsResult.err)
          return optionsResult;
        const argCloseResult = this.tryParseArgumentClose(openingBracePosition);
        if (argCloseResult.err)
          return argCloseResult;
        const location = createLocation(openingBracePosition, this.clonePosition());
        if (argType === "select")
          return {
            val: {
              type: 5,
              value,
              options: fromEntries(optionsResult.val),
              location
            },
            err: null
          };
        else
          return {
            val: {
              type: 6,
              value,
              options: fromEntries(optionsResult.val),
              offset: pluralOffset,
              pluralType: argType === "plural" ? "cardinal" : "ordinal",
              location
            },
            err: null
          };
      }
      default:
        return this.error(5, createLocation(typeStartPosition, typeEndPosition));
    }
  }
  tryParseArgumentClose(openingBracePosition) {
    if (this.isEOF() || this.char() !== 125)
      return this.error(1, createLocation(openingBracePosition, this.clonePosition()));
    this.bump();
    return {
      val: true,
      err: null
    };
  }
  parseSimpleArgStyleIfPossible() {
    let nestedBraces = 0;
    const startPosition = this.clonePosition();
    while (!this.isEOF())
      switch (this.char()) {
        case 39: {
          this.bump();
          let apostrophePosition = this.clonePosition();
          if (!this.bumpUntil("'"))
            return this.error(11, createLocation(apostrophePosition, this.clonePosition()));
          this.bump();
          break;
        }
        case 123:
          nestedBraces += 1;
          this.bump();
          break;
        case 125:
          if (nestedBraces > 0)
            nestedBraces -= 1;
          else
            return {
              val: this.message.slice(startPosition.offset, this.offset()),
              err: null
            };
          break;
        default:
          this.bump();
      }
    return {
      val: this.message.slice(startPosition.offset, this.offset()),
      err: null
    };
  }
  parseNumberSkeletonFromString(skeleton, location) {
    let tokens = [];
    try {
      tokens = parseNumberSkeletonFromString(skeleton);
    } catch {
      return this.error(7, location);
    }
    return {
      val: {
        type: 0,
        tokens,
        location,
        parsedOptions: this.shouldParseSkeletons ? parseNumberSkeleton(tokens) : {}
      },
      err: null
    };
  }
  tryParsePluralOrSelectOptions(nestingLevel, parentArgType, expectCloseTag, parsedFirstIdentifier) {
    let hasOtherClause = false;
    const options = [];
    const parsedSelectors = /* @__PURE__ */ new Set;
    let { value: selector, location: selectorLocation } = parsedFirstIdentifier;
    while (true) {
      if (selector.length === 0) {
        const startPosition = this.clonePosition();
        if (parentArgType !== "select" && this.bumpIf("=")) {
          const result = this.tryParseDecimalInteger(16, 19);
          if (result.err)
            return result;
          selectorLocation = createLocation(startPosition, this.clonePosition());
          selector = this.message.slice(startPosition.offset, this.offset());
        } else
          break;
      }
      if (parsedSelectors.has(selector))
        return this.error(parentArgType === "select" ? 21 : 20, selectorLocation);
      if (selector === "other")
        hasOtherClause = true;
      this.bumpSpace();
      const openingBracePosition = this.clonePosition();
      if (!this.bumpIf("{"))
        return this.error(parentArgType === "select" ? 17 : 18, createLocation(this.clonePosition(), this.clonePosition()));
      const fragmentResult = this.parseMessage(nestingLevel + 1, parentArgType, expectCloseTag);
      if (fragmentResult.err)
        return fragmentResult;
      const argCloseResult = this.tryParseArgumentClose(openingBracePosition);
      if (argCloseResult.err)
        return argCloseResult;
      options.push([selector, {
        value: fragmentResult.val,
        location: createLocation(openingBracePosition, this.clonePosition())
      }]);
      parsedSelectors.add(selector);
      this.bumpSpace();
      ({ value: selector, location: selectorLocation } = this.parseIdentifierIfPossible());
    }
    if (options.length === 0)
      return this.error(parentArgType === "select" ? 15 : 16, createLocation(this.clonePosition(), this.clonePosition()));
    if (this.requiresOtherClause && !hasOtherClause)
      return this.error(22, createLocation(this.clonePosition(), this.clonePosition()));
    return {
      val: options,
      err: null
    };
  }
  tryParseDecimalInteger(expectNumberError, invalidNumberError) {
    let sign = 1;
    const startingPosition = this.clonePosition();
    if (this.bumpIf("+")) {} else if (this.bumpIf("-"))
      sign = -1;
    let hasDigits = false;
    let decimal = 0;
    while (!this.isEOF()) {
      const ch = this.char();
      if (ch >= 48 && ch <= 57) {
        hasDigits = true;
        decimal = decimal * 10 + (ch - 48);
        this.bump();
      } else
        break;
    }
    const location = createLocation(startingPosition, this.clonePosition());
    if (!hasDigits)
      return this.error(expectNumberError, location);
    decimal *= sign;
    if (!Number.isSafeInteger(decimal))
      return this.error(invalidNumberError, location);
    return {
      val: decimal,
      err: null
    };
  }
  offset() {
    return this.position.offset;
  }
  isEOF() {
    return this.offset() === this.message.length;
  }
  clonePosition() {
    return {
      offset: this.position.offset,
      line: this.position.line,
      column: this.position.column
    };
  }
  char() {
    const offset = this.position.offset;
    if (offset >= this.message.length)
      throw Error("out of bound");
    const code = this.message.codePointAt(offset);
    if (code === undefined)
      throw Error(`Offset ${offset} is at invalid UTF-16 code unit boundary`);
    return code;
  }
  error(kind, location) {
    return {
      val: null,
      err: {
        kind,
        message: this.message,
        location
      }
    };
  }
  bump() {
    if (this.isEOF())
      return;
    const code = this.char();
    if (code === 10) {
      this.position.line += 1;
      this.position.column = 1;
      this.position.offset += 1;
    } else {
      this.position.column += 1;
      this.position.offset += code < 65536 ? 1 : 2;
    }
  }
  bumpIf(prefix) {
    const offset = this.offset();
    if (this.message.slice(offset, offset + prefix.length) === prefix) {
      for (let i = 0;i < prefix.length; i++)
        this.bump();
      return true;
    }
    return false;
  }
  bumpUntil(pattern) {
    const currentOffset = this.offset();
    const index = this.message.indexOf(pattern, currentOffset);
    if (index >= 0) {
      this.bumpTo(index);
      return true;
    } else {
      this.bumpTo(this.message.length);
      return false;
    }
  }
  bumpTo(targetOffset) {
    if (this.offset() > targetOffset)
      throw Error(`targetOffset ${targetOffset} must be greater than or equal to the current offset ${this.offset()}`);
    targetOffset = Math.min(targetOffset, this.message.length);
    while (true) {
      const offset = this.offset();
      if (offset === targetOffset)
        break;
      if (offset > targetOffset)
        throw Error(`targetOffset ${targetOffset} is at invalid UTF-16 code unit boundary`);
      this.bump();
      if (this.isEOF())
        break;
    }
  }
  bumpSpace() {
    while (!this.isEOF() && _isWhiteSpace(this.char()))
      this.bump();
  }
  peek() {
    if (this.isEOF())
      return null;
    const code = this.char();
    const offset = this.offset();
    return this.message.charCodeAt(offset + (code >= 65536 ? 2 : 1)) ?? null;
  }
};
function _isAlpha(codepoint) {
  return codepoint >= 97 && codepoint <= 122 || codepoint >= 65 && codepoint <= 90;
}
function _isAlphaOrSlash(codepoint) {
  return _isAlpha(codepoint) || codepoint === 47;
}
function _isPotentialElementNameChar(c) {
  return c === 45 || c === 46 || c >= 48 && c <= 57 || c === 95 || c >= 97 && c <= 122 || c >= 65 && c <= 90 || c == 183 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 893 || c >= 895 && c <= 8191 || c >= 8204 && c <= 8205 || c >= 8255 && c <= 8256 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
}
function _isWhiteSpace(c) {
  return c >= 9 && c <= 13 || c === 32 || c === 133 || c >= 8206 && c <= 8207 || c === 8232 || c === 8233;
}
function pruneLocation(els) {
  els.forEach((el) => {
    delete el.location;
    if (isSelectElement(el) || isPluralElement(el))
      for (const k in el.options) {
        delete el.options[k].location;
        pruneLocation(el.options[k].value);
      }
    else if (isNumberElement(el) && isNumberSkeleton(el.style))
      delete el.style.location;
    else if ((isDateElement(el) || isTimeElement(el)) && isDateTimeSkeleton(el.style))
      delete el.style.location;
    else if (isTagElement(el))
      pruneLocation(el.children);
  });
}
function parse(message, opts = {}) {
  opts = {
    shouldParseSkeletons: true,
    requiresOtherClause: true,
    ...opts
  };
  const result = new Parser(message, opts).parse();
  if (result.err) {
    const error = SyntaxError(ErrorKind[result.err.kind]);
    error.location = result.err.location;
    error.originalMessage = result.err.message;
    throw error;
  }
  if (!opts?.captureLocation)
    pruneLocation(result.val);
  return result.val;
}

// node_modules/intl-messageformat/index.js
var FormatError = class extends Error {
  constructor(msg, code, originalMessage) {
    super(msg);
    this.code = code;
    this.originalMessage = originalMessage;
  }
  toString() {
    return `[formatjs Error: ${this.code}] ${this.message}`;
  }
};
var InvalidValueError = class extends FormatError {
  constructor(variableId, value, options, originalMessage) {
    super(`Invalid values for "${variableId}": "${value}". Options are "${Object.keys(options).join('", "')}"`, "INVALID_VALUE", originalMessage);
  }
};
var InvalidValueTypeError = class extends FormatError {
  constructor(value, type, originalMessage) {
    super(`Value for "${value}" must be of type ${type}`, "INVALID_VALUE", originalMessage);
  }
};
var MissingValueError = class extends FormatError {
  constructor(variableId, originalMessage) {
    super(`The intl string context variable "${variableId}" was not provided to the string "${originalMessage}"`, "MISSING_VALUE", originalMessage);
  }
};
function mergeLiteral(parts) {
  if (parts.length < 2)
    return parts;
  return parts.reduce((all, part) => {
    const lastPart = all[all.length - 1];
    if (!lastPart || lastPart.type !== 0 || part.type !== 0)
      all.push(part);
    else
      lastPart.value += part.value;
    return all;
  }, []);
}
function isFormatXMLElementFn(el) {
  return typeof el === "function";
}
function formatToParts(els, locales, formatters, formats, values, currentPluralValue, originalMessage) {
  if (els.length === 1 && isLiteralElement(els[0]))
    return [{
      type: 0,
      value: els[0].value
    }];
  const result = [];
  for (const el of els) {
    if (isLiteralElement(el)) {
      result.push({
        type: 0,
        value: el.value
      });
      continue;
    }
    if (isPoundElement(el)) {
      if (typeof currentPluralValue === "number")
        result.push({
          type: 0,
          value: formatters.getNumberFormat(locales).format(currentPluralValue)
        });
      continue;
    }
    const { value: varName } = el;
    if (!(values && (varName in values)))
      throw new MissingValueError(varName, originalMessage);
    let value = values[varName];
    if (isArgumentElement(el)) {
      if (!value || typeof value === "string" || typeof value === "number" || typeof value === "bigint")
        value = typeof value === "string" || typeof value === "number" || typeof value === "bigint" ? String(value) : "";
      result.push({
        type: typeof value === "string" ? 0 : 1,
        value
      });
      continue;
    }
    if (isDateElement(el)) {
      const style = typeof el.style === "string" ? formats.date[el.style] : isDateTimeSkeleton(el.style) ? el.style.parsedOptions : undefined;
      result.push({
        type: 0,
        value: formatters.getDateTimeFormat(locales, style).format(value)
      });
      continue;
    }
    if (isTimeElement(el)) {
      const style = typeof el.style === "string" ? formats.time[el.style] : isDateTimeSkeleton(el.style) ? el.style.parsedOptions : formats.time.medium;
      result.push({
        type: 0,
        value: formatters.getDateTimeFormat(locales, style).format(value)
      });
      continue;
    }
    if (isNumberElement(el)) {
      const style = typeof el.style === "string" ? formats.number[el.style] : isNumberSkeleton(el.style) ? el.style.parsedOptions : undefined;
      if (style && style.scale) {
        const scale = style.scale || 1;
        if (typeof value === "bigint") {
          if (!Number.isInteger(scale))
            throw new TypeError(`Cannot apply fractional scale ${scale} to bigint value. Scale must be an integer when formatting bigint.`);
          value = value * BigInt(scale);
        } else
          value = value * scale;
      }
      result.push({
        type: 0,
        value: formatters.getNumberFormat(locales, style).format(value)
      });
      continue;
    }
    if (isTagElement(el)) {
      const { children, value } = el;
      const formatFn = values[value];
      if (!isFormatXMLElementFn(formatFn))
        throw new InvalidValueTypeError(value, "function", originalMessage);
      let chunks = formatFn(formatToParts(children, locales, formatters, formats, values, currentPluralValue).map((p) => p.value));
      if (!Array.isArray(chunks))
        chunks = [chunks];
      result.push(...chunks.map((c) => {
        return {
          type: typeof c === "string" ? 0 : 1,
          value: c
        };
      }));
    }
    if (isSelectElement(el)) {
      const key = value;
      const opt = (Object.prototype.hasOwnProperty.call(el.options, key) ? el.options[key] : undefined) || el.options.other;
      if (!opt)
        throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
      result.push(...formatToParts(opt.value, locales, formatters, formats, values));
      continue;
    }
    if (isPluralElement(el)) {
      const exactKey = `=${value}`;
      let opt = Object.prototype.hasOwnProperty.call(el.options, exactKey) ? el.options[exactKey] : undefined;
      if (!opt) {
        if (!Intl.PluralRules)
          throw new FormatError(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`, "MISSING_INTL_API", originalMessage);
        const numericValue = typeof value === "bigint" ? Number(value) : value;
        const rule = formatters.getPluralRules(locales, { type: el.pluralType }).select(numericValue - (el.offset || 0));
        opt = (Object.prototype.hasOwnProperty.call(el.options, rule) ? el.options[rule] : undefined) || el.options.other;
      }
      if (!opt)
        throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
      const numericValue = typeof value === "bigint" ? Number(value) : value;
      result.push(...formatToParts(opt.value, locales, formatters, formats, values, numericValue - (el.offset || 0)));
      continue;
    }
  }
  return mergeLiteral(result);
}
function mergeConfig(c1, c2) {
  if (!c2)
    return c1;
  return {
    ...c1,
    ...c2,
    ...Object.keys(c1).reduce((all, k) => {
      all[k] = {
        ...c1[k],
        ...c2[k]
      };
      return all;
    }, {})
  };
}
function mergeConfigs(defaultConfig, configs) {
  if (!configs)
    return defaultConfig;
  return Object.keys(defaultConfig).reduce((all, k) => {
    all[k] = mergeConfig(defaultConfig[k], configs[k]);
    return all;
  }, { ...defaultConfig });
}
function createFastMemoizeCache(store) {
  return { create() {
    return {
      get(key) {
        return store[key];
      },
      set(key, value) {
        store[key] = value;
      }
    };
  } };
}
function createDefaultFormatters(cache = {
  number: {},
  dateTime: {},
  pluralRules: {}
}) {
  return {
    getNumberFormat: memoize((...args) => new Intl.NumberFormat(...args), {
      cache: createFastMemoizeCache(cache.number),
      strategy: strategies.variadic
    }),
    getDateTimeFormat: memoize((...args) => new Intl.DateTimeFormat(...args), {
      cache: createFastMemoizeCache(cache.dateTime),
      strategy: strategies.variadic
    }),
    getPluralRules: memoize((...args) => new Intl.PluralRules(...args), {
      cache: createFastMemoizeCache(cache.pluralRules),
      strategy: strategies.variadic
    })
  };
}
var IntlMessageFormat = class IntlMessageFormat {
  constructor(message, locales = IntlMessageFormat.defaultLocale, overrideFormats, opts) {
    this.formatterCache = {
      number: {},
      dateTime: {},
      pluralRules: {}
    };
    this.format = (values) => {
      const parts = this.formatToParts(values);
      if (parts.length === 1)
        return parts[0].value;
      const result = parts.reduce((all, part) => {
        if (!all.length || part.type !== 0 || typeof all[all.length - 1] !== "string")
          all.push(part.value);
        else
          all[all.length - 1] += part.value;
        return all;
      }, []);
      if (result.length <= 1)
        return result[0] || "";
      return result;
    };
    this.formatToParts = (values) => formatToParts(this.ast, this.locales, this.formatters, this.formats, values, undefined, this.message);
    this.resolvedOptions = () => ({ locale: this.resolvedLocale?.toString() || Intl.NumberFormat.supportedLocalesOf(this.locales)[0] });
    this.getAst = () => this.ast;
    this.locales = locales;
    this.resolvedLocale = IntlMessageFormat.resolveLocale(locales);
    if (typeof message === "string") {
      this.message = message;
      if (!IntlMessageFormat.__parse)
        throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");
      const { ...parseOpts } = opts || {};
      this.ast = IntlMessageFormat.__parse(message, {
        ...parseOpts,
        locale: this.resolvedLocale
      });
    } else
      this.ast = message;
    if (!Array.isArray(this.ast))
      throw new TypeError("A message must be provided as a String or AST.");
    this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);
    this.formatters = opts && opts.formatters || createDefaultFormatters(this.formatterCache);
  }
  static {
    this.memoizedDefaultLocale = null;
  }
  static get defaultLocale() {
    if (!IntlMessageFormat.memoizedDefaultLocale)
      IntlMessageFormat.memoizedDefaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
    return IntlMessageFormat.memoizedDefaultLocale;
  }
  static {
    this.resolveLocale = (locales) => {
      if (typeof Intl.Locale === "undefined")
        return;
      const supportedLocales = Intl.NumberFormat.supportedLocalesOf(locales);
      if (supportedLocales.length > 0)
        return new Intl.Locale(supportedLocales[0]);
      return new Intl.Locale(typeof locales === "string" ? locales : locales[0]);
    };
  }
  static {
    this.__parse = parse;
  }
  static {
    this.formats = {
      number: {
        integer: { maximumFractionDigits: 0 },
        currency: { style: "currency" },
        percent: { style: "percent" }
      },
      date: {
        short: {
          month: "numeric",
          day: "numeric",
          year: "2-digit"
        },
        medium: {
          month: "short",
          day: "numeric",
          year: "numeric"
        },
        long: {
          month: "long",
          day: "numeric",
          year: "numeric"
        },
        full: {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      },
      time: {
        short: {
          hour: "numeric",
          minute: "numeric"
        },
        medium: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        },
        long: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZoneName: "short"
        },
        full: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZoneName: "short"
        }
      }
    };
  }
};
// src/locales/en.json
var en_default = {
  backend: {
    regex: {
      searchChanged: "Regex scripts changed while searching. Refresh to try again."
    },
    binding: {
      messages: {
        selectConsecutiveSummariesWithoutCrossingAnotherSummary: "Select consecutive summaries without crossing another summary tier"
      }
    },
    codex: {
      agent: {
        messages: {
          theAssembledCodexPromptIsKTokens: "Codex prompt: ~{round}k tokens; limit: {round2}k. Raise Max input tokens in Tuning > Connection > Codex, or reduce the window, Chapters provided, or lore limit in Tuning > Settings > Codex. Freezing records in Codex > Overview also reduces input."
        },
        resolveCodexConnection: {
          codexConnectionHasNoModelSetPick: 'Codex connection "{id}" has no model set, pick one in settings',
          noConnectionAvailableForTheCodex: "No connection available for Codex"
        },
        keptSuffix: {
          memoriaKeptTheRecordSheFinishedAnd: " Saved {length} record{length, plural, one {} other {s}}; the rest will retry next time."
        },
        runCodexAgentInner: {
          round: `

═══ round {rounds} ═══
`,
          fullRewriteKChars: "full rewrite, {toFixed}k chars",
          codexWriteJson: `
➤ codex_write {f}.json ({label})`,
          codexDone: `
✦ codex_done{note}`,
          codexSkip: `
○ codex_skip {choice, select, yes {{join}} other {(no files)}}`,
          unknownTool: `
✗ unknown tool {name}`,
          theCodexAgentReturnedAnEmptyResponse: "The Codex agent returned an empty response",
          noJsonObjectFoundInTheReply: `
✗ no JSON found in the reply. Retrying...`,
          memoriaCouldnTFinishTheCodexUpdate: "The model wasn't able to follow instructions :(.{keptSuffix}",
          theCodexAgentNarratedInsteadOfCalling: "The Codex agent didn't call tools. Does your connection support tool calls?",
          theCodexAgentRepliedWithoutAParsable: "The Codex agent returned faulty JSON",
          memoriaCouldnTFinishTheCodexUpdate2: "The model stopped before writing {join}.{keptSuffix}",
          keptStillReferencedByUnchangedJson: `
⤳ Kept {ref}: still referenced by unchanged {file}.json`,
          value: `
⤳ {r}`,
          rejected: `
✗ rejected{choice, select, yes { {file}.json} other {}}: {errors0}`,
          integrity: `
✗ integrity: {e}`,
          memoriaCouldnTFinishTheCodexUpdate3: "The model returned invalid JSON after {rounds} tries: {join}.{keptSuffix}",
          memoriaCouldnTFinishTheCodexUpdate4: "The model returned invalid records: {join}.{keptSuffix}",
          memoriaCouldnTFinishTheCodexUpdate5: "The model didn''t write {join}.{keptSuffix}",
          memoriaCouldnTFinishTheCodexUpdate6: "The model referenced missing entities: {join}.{keptSuffix}",
          tableMigrationLeftTiesOnTheRun: "Relations migration failed: ties remain on {join}.",
          inlineMigrationProducedNoTiesFromThe: "Relations migration failed: no ties were created from the table.",
          failedToSaveJson: "Failed to save {key}.json: {describeError}"
        },
        stream: {
          set: "{count} set",
          drop: "{count} drop",
          seeds: "seeds",
          empty: "empty"
        }
      },
      backup: {
        parseCodexBackup: {
          thatFileIsNotACodexBackup: "This file isn''t a Codex backup",
          thisBackupWasWrittenByANewer: "This backup needs a newer LumiBooks (version {version})",
          theBackupHasNoCodexFilesIn: "The backup has no Codex files",
          jsonInTheBackupIsNotValid: "{key}.json isn''t valid JSON",
          jsonInTheBackupIsInvalid: "{key}.json in the backup is invalid: {errors0}"
        }
      },
      index: {
        reportCodexFailure: {
          memoriaCouldnTTheCodex: "Couldn''t {verb, select, tidy {tidy} refresh {refresh} rebuild {rebuild} other {update}} the Codex: {shortErrorText}"
        },
        syncEntriesGuarded: {
          memoriaCouldnTSyncTheCodexTo: "Couldn''t sync the Codex to the lorebook: {shortErrorText}"
        },
        ensureCodexEntriesSynced: {
          memoriaCouldnTSyncTheCodexTo: "Couldn''t sync the Codex to the lorebook: {shortErrorText}"
        },
        dryRunCodex: {
          theWindowHasNotFilledYetAutomation: "Window isn''t full. Run manually to bypass.",
          theLagReserveStillHoldsTheseTurns: "Lag isn''t met. Run manually to bypass.",
          chatHasNoMessages: "Chat has no messages",
          theCodexHasReadEverythingSoThis: "Codex is up to date. Preview uses previous messages.",
          noConsumableWindowSendAMessageAnd: "No messages to process. Send a message and retry.",
          everyCodexRecordIsFrozenUnfreezeOne: "Codex records are frozen. Unfreeze a record to preview.",
          connection: "Connection: {name} ({provider}/{model})",
          transport: "Transport: {choice, select, yes {tool calls} other {strict JSON}}",
          updateDeliveryAndEveryRecordMustBe: "Update delivery: {choice, select, yes {record by record} other {batched}}. Write or skip the {length} records to complete the update.",
          preset: "Preset: {choice, select, yes {Custom: {displayName}} other {Built-in: Default}}{choice2, select, yes { ({value} template{value2, plural, one {} other {s}} customized)} other {}}",
          relationsMode: "Relations mode: {choice, select, yes {table} other {inline ties}}{choice2, select, yes { (format changed, this run would migrate)} other {}}",
          activeFiles: "Active files: {join}",
          frozenOmittedFromThePromptEntirely: "Frozen from the prompt: {join}",
          chunkMessage: "Chunk: {chunkLabel} ({length} message{length, plural, one {} other {s}})",
          reconcilePendingTheStoryWasEditedBehind: "Story edits detected. Reconcile note included.",
          unreadableFilesShownEmpty: "Unreadable files shown empty: {join}",
          locksLockedEntitWithLockedFieldsMasked: "Locks: {length} entit{length, plural, one {y} other {ies}}, {length2} with locked fields hidden from the model",
          storySoFarContextTokens: "Story-so-far context: ~{length} tokens",
          activatedLoreReferenceTokens: "Activated lore reference: ~{length} tokens",
          activatedLoreExceededTheLoreLimitTokens: "Lore exceeded the lore limit ({effectiveLoreLimitTokens} tokens) and was cut off",
          thoroughMode: "Thorough mode: {choice, select, yes {on, adds a verification round} other {off}}",
          promptSizeTokensSystemTokensUserCodex: "Prompt size: ~{length} tokens system + ~{length2} tokens user (Codex max input {codexMaxInputTokens})",
          wouldFail: "WOULD FAIL: {message}",
          samplerParametersBeingSentOnTheWire: "Sampler parameters: {stringify}"
        },
        chunkLabel: {
          messagesOf: "messages {firstIdx1}-{lastIdx1} of {length}"
        },
        runChunk: {
          theRelationsFormatChangedUnfreezeSoMemoria: "Relations format changed. Unfreeze {join} to migrate.",
          relationBetweenLockedEntriesCouldNotBe: "{stuck} relation{stuck, plural, one {} other {s}} between locked entries couldn''t be rewritten and will be dropped",
          memoriaUpdatedTheCodexFile: "Codex updated ({length} file{length, plural, one {} other {s}})"
        },
        drain: {
          memoriaIsUpdatingTheCodex: "Updating Codex"
        },
        maybeRunCodex: {
          automaticUpdate: "automatic update",
          memoriaClosesTheCodexForNow: "Codex update cancelled"
        },
        runCodexNow: {
          memoriaIsAlreadyUpdatingTheCodex: "Codex update in progress",
          memoriaIsStillCarryingTheCodexInto: "Codex fork inheritance is in progress. Try again shortly.",
          everyCodexRecordIsFrozenUnfreezeOne: "Codex records are frozen. Unfreeze a record to update.",
          theCodexIsAlreadyCaughtUp: "Codex is up to date",
          memoriaClosesTheCodexForNow: "Codex update cancelled",
          fastCatchUpNeedsTheCodexModel: "Fast catch-up needs the Codex model''s context to be at least the story model''s. Raise your max context size"
        },
        catchupCodex: {
          memoriaIsCatchingUpTheCodex: "Catching up Codex ({choice, select, yes {ultra fast} other {fast}})",
          memoriaIsAlreadyWorkingOnTheCodex: "Codex task in progress"
        },
        maybeReconcileSweep: {
          memoriaIsReconcilingTheCodexWithThe: "Updating Codex after story edits",
          memoriaReconciledTheCodexWithTheEdited: "Codex updated after story edits ({length} file{length, plural, one {} other {s}})",
          memoriaCheckedTheCodexAgainstTheEdited: "Codex updated after story edits"
        },
        rebuildCodex: {
          memoriaIsClearingTheCodexForA: "Clearing Codex for rebuild",
          memoriaIsAlreadyWorkingOnTheCodex: "Codex task in progress",
          memoriaCouldnTReadTheCodexCursor: "The Codex state has an issue, rebuild aborted: {shortErrorText}",
          memoriaCouldnTClearCodexFileRun: "Couldn''t clear {length} Codex file{length, plural, one {} other {s}}. Retry Rebuild.",
          memoriaCouldnTClearTheCodexLorebook: "Couldn''t clear Codex lorebook entries: {shortErrorText}"
        },
        runCodexTidy: {
          memoriaIsTidyingTheCodex: "Tidying Codex",
          memoriaIsAlreadyWorkingOnTheCodex: "Codex task in progress",
          theRelationsFormatChangedRunUpdateNow: "The relations format changed, please update the Codex",
          nothingToTidyThoseRecordsAreEmpty: "Nothing to tidy: records are empty, frozen, or unreadable",
          theSelectedRecordsAlreadyFitTokensLimit: "Records already fit within the limit ({limit} tokens)",
          tidyTokensLimitModelTargetCallsLeft: `
Tidy: {tokens} tokens; limit {limit}; model target {modelTarget}; {remaining} calls left.
`,
          aCodexFileCouldNotBeRead: "Codex state issue after tidying: {details}. Undo restores the original.",
          codexTidiedToTokensLimitInModel: "Codex tidied to {size} tokens (limit {limit}) in {used} model call{used, plural, one {} other {s}}",
          stoppedAfterModelCallsTokensStillAbove: "Stopped after {used} model calls: {size} tokens, above the limit of {limit}. Edits saved; Undo restores the original.",
          tidyingStoppedCompletedEditsAreKeptUndo: "Tidying cancelled. Edits saved; Undo restores the original."
        },
        refreshCodexFiles: {
          memoriaIsCatchingUpReEnabledRecords: "Catching up re-enabled records",
          memoriaIsAlreadyWorkingOnTheCodex: "Codex task in progress",
          theRelationsFormatChangedRunUpdateNow: "Relations format changed. Run Update now before catching up records.",
          noReEnabledRecordsAreWaitingFor: "No records need catch-up",
          memoriaCaughtUpRecord: "Caught up {length} record{length, plural, one {} other {s}}",
          memoriaSetsTheCatchUpAside: "Catch-up cancelled",
          theCatchUpPassNeedsTheCodex: "Catch-up needs a Codex context at least as large as the story model''s. Increase it or rebuild in slow mode."
        },
        rebuildCodexFiles: {
          memoriaIsRebuildingCodexRecords: "Rebuilding Codex records",
          memoriaIsAlreadyWorkingOnTheCodex: "Codex task in progress",
          theRelationsFormatChangedRunUpdateNow: "Relations format changed. Run Update now before rebuilding records.",
          thoseRecordsAreFrozenUnfreezeThemFirst: "Unfreeze these records first",
          memoriaRebuiltRecordFromTheStory: "Rebuilt {length} record{length, plural, one {} other {s}}",
          memoriaSetsTheRebuildAside: "Rebuild cancelled",
          theRebuildPassNeedsTheCodexModel: "Rebuild needs a Codex context at least as large as the story model''s. Increase it in connection settings."
        }
      },
      schema: {
        keywordArray: {
          keptOfDroppedTheRestAsDuplicates: "{path}: kept {length} of {length2}, dropped the rest as duplicates, over {keywordMaxWords} words, already matched by the record''s own name, or past the {keywordLimit} keyword limit"
        },
        str: {
          requiredNonEmptyString: "{path}: required non-empty string",
          expectedAString: "{path}: expected a string"
        },
        strArray: {
          expectedAnArrayOfStrings: "{path}: expected an array of strings",
          expectedAString: "{path}[{i}]: expected a string"
        },
        objArray: {
          expectedAnArray: "{path}: expected an array",
          expectedAnObject: "{path}[{i}]: expected an object"
        },
        asRecord: {
          expectedAJsonObject: "{path}: expected a JSON object"
        },
        keepExtras: {
          useLowercase: '{path}.{k}: use lowercase "{lower}"',
          extraFieldsMustBePrimitiveStringNumber: "{path}.{k}: extra fields must be primitive (string, number, boolean, or string[]), flatten this"
        },
        ridOf: {
          ridExpectedAShortString: "{path}.rid: expected a short string"
        },
        validateEntityFile: {
          idMustMatch: '{path}.id: "{id}" must match {ns}:<lowercase_snake_case>',
          idBelongsInAnotherFileIdsHere: '{path}.id: "{id}" belongs in another file, ids here must start with "{ns}:"',
          idDuplicateId: '{path}.id: duplicate id "{id}"',
          statusThisFieldWasRemovedKeepDurable: "{path}.status: this field was removed - keep durable state in description, drop scene-of-the-moment state",
          tiesTheRelationsTableIsEnabledMove: "{path}.ties: the relations table is enabled, move these into relations.json rows"
        },
        validateRelationsFile: {
          relationsTheRelationsTableIsDisabledFor: "relations: the relations table is disabled for this profile, keep connections as ties on entity sheets instead",
          aIsNotAValidEntityRef: '{path}.a: "{a}" is not a valid entity ref',
          bIsNotAValidEntityRef: '{path}.b: "{b}" is not a valid entity ref',
          aAndBAreTheSameEntity: "{path}: a and b are the same entity",
          membersAGroupNeedsAtLeast2: "{path}.members: a group needs at least 2 distinct members",
          membersIsNotAValidEntityRef: '{path}.members: "{m}" is not a valid entity ref',
          rolesKeyIsNotAValidEntity: '{path}.roles: key "{k}" is not a valid entity ref',
          rolesExpectedAStringRole: '{path}.roles["{k}"]: expected a string role',
          typeExpectedPairOrGroup: '{path}.type: expected "pair" or "group"'
        },
        validateThreadsFile: {
          statusExpectedOpenStalledResolvedAbandoned: "{path}.status: expected open | stalled | resolved | abandoned"
        },
        validateWorldFile: {
          factsAtLeastOneFactRequiredDrop: "{path}.facts: at least one fact required, drop the topic if it has none"
        },
        validateKnowledgeFile: {
          appearsInBothKnownByAndHiddenFromWrite: '{path}: {join} appears in both knownBy and hiddenFrom. Write the SECRET ITSELF as "fact", then list who knows it and who it is hidden from - never write the ignorance as the fact',
          needsAtLeastOneOfKnownByHiddenFrom: "{path}: needs at least one of knownBy, hiddenFrom, falseBeliefs - facts everyone knows belong in world or timeline",
          omittedDuplicateKnowledgeItem: "{path}: omitted duplicate knowledge item"
        },
        formatDangling: {
          isNotDefinedInAnyEntityFile: '{path}: "{ref}" is not defined in any entity file - add the entity, or drop or retarget the row (relations only take entity refs)',
          isNotDefinedInAnyEntityFile2: '{path}: "{ref}" is not defined in any entity file - add the entity or use plain text'
        },
        fix: {
          wasNotAKnownEntityRecordedAs: '{path}: "{ref}" was not a known entity, recorded as "{plain}"'
        }
      },
      store: {
        loadCursor: {
          theCodexCursorIsUnreadable: "Codex cursor issue: {error}"
        },
        loadCodex: {
          unreadableOnDisk: "unreadable on disk: {error}"
        },
        copyCodexToEmptyChat: {
          jsonIsUnreadableOnTheSourceChat: "{key}.json is unreadable on the source chat: {error}"
        },
        readCodexFilesRaw: {
          unreadableJsonTheFileExistsButCannot: "Can''t read {key}.json: {error}. Fix or delete it before saving."
        }
      },
      sync: {
        doSync: {
          codexSyncSkippedUnreadableOrInvalidFile: "Codex sync failed. Unreadable or invalid file{length, plural, one {} other {s}}: {join}",
          outdatedCodexEntrCouldNotBeRemoved: "Couldn''t remove {failedDeletes} outdated Codex entr{failedDeletes, plural, one {y} other {ies}}. They may still inject."
        },
        doWipe: {
          failedToDeleteCodexEntrTheyMay: "Couldn''t delete {failed} Codex entr{failed, plural, one {y} other {ies}}. They may still inject."
        }
      },
      tokens: {
        countCodexText: {
          invalidTokenCount: "Invalid token count"
        }
      }
    },
    coverage: {
      setHidden: {
        couldNotUpdateVisibilityForMessagesRun: "Couldn''t update visibility for {length} messages. Retry Resync visibility."
      }
    },
    fork: {
      inheritedMessageIds: {
        forkAncestryCouldNotBeResolved: "Fork ancestry couldn''t be resolved",
        forkAncestryIsIncomplete: "Fork ancestry is incomplete"
      },
      requireForkShelf: {
        forkInheritanceIsStillPendingRetryAfter: "Fork inheritance is pending. Wait for it to finish, then retry."
      },
      doForkAdoption: {
        memoriaCouldnTCarryTheShelfInto: "Summary fork inheritance failed; will retry: {shortErrorText}"
      },
      adoptForkCodex: {
        memoriaCouldnTCarryTheCodexInto: "Codex fork inheritance failed; will retry: {shortErrorText}"
      },
      markCodexAdopted: {
        forkChatVanishedWhileRecordingCodexAdoption: "Chat was deleted during Codex fork inheritance"
      },
      newBook: {
        memoriaSShelfForThisChatChapters: "LumiBooks chapters and arcs for this chat."
      }
    },
    index: {
      doPushState: {
        lumiBooksStateRefreshFailed: "LumiBooks state refresh failed: {describeError}"
      },
      messages: {
        summaryRepairFailed: "Summary repair failed: {describeError}",
        savedDiagnosticsCleared: "Saved diagnostics cleared.",
        recallSettingSavedEntryOrBookUpdates: "Recall saved, but {failed} updates failed. Reapply to retry.",
        invalidProfilePayload: "Invalid profile payload.",
        profileNoLongerExists: "Profile {id} no longer exists.",
        memoriaKeepsAtLeastOneProfile: "A profile is required",
        memoriaIsAlreadyFilingAChapter: "Chapter creation in progress",
        yourStoryNeedsMoreMessagesForMe: "Not enough messages to create an entry",
        memoriaIsAlreadyBindingAnArc: "Arc creation in progress",
        memoriaIsAlreadyPressingAVolume: "Volume creation in progress",
        memoriaCanTFindThatEntry: "Entry not found",
        memoriaReleasedTheEntryToYourLorebook: "Entry released to the lorebook",
        memoriaCanTFindThatEntryTo: "Entry not found",
        memoriaIsAlreadyBusyWithA: "A {busyKind} task is in progress",
        memoriaCanTRegenerateInheritedChapters: "Inherited chapters can''t be regenerated",
        memoriaCanTRegenerateAGhostChapter: "File the ghost chapter before regenerating it",
        memoriaHasNoArcSourcesToRegenerate: "No source arcs to regenerate this volume",
        memoriaHasNoChapterSourcesToRegenerate: "No source chapters to regenerate this arc",
        memoriaHasNoMessagesToRegenerateThis: "No source messages to regenerate this chapter",
        theseMessagesAreBoundIntoReleaseOr: "These messages are bound into {blockerLabel}, release or delete it first",
        dryRunFailed: "Dry run failed: {text}",
        memoriaIsNotInTheMiddleOf: "No task to cancel",
        summaryRecallSavedEntriesUpdated: "Summary recall saved; {updated} entries updated.",
        waitForTheCurrentTaskToFinish: "Wait for the current task to finish before importing summaries",
        importingSummaries: "Importing summaries",
        memoriaFoundNoUsablePresetsInThat: "No usable presets in this file",
        memoriaImportedPreset: "Imported {length} preset{length, plural, one {} other {s}}",
        invalidPresetPayload: "Invalid preset payload.",
        memoriaIsBusyWaitForHerTo: "Wait for the current task to finish",
        memoriaSeededInheritedMemorBeforeTheGreeting: "Added {count} inherited memor{count, plural, one {y} other {ies}} before the greeting",
        memoriaRebuiltOntoInheritedMemorAndIs: "Added {count} inherited memor{count, plural, one {y} other {ies}}. Re-summarizing this chat.",
        memoriaWillLeaveMessageUntouched: "Excluded {length} message{length, plural, one {} other {s}} from compression",
        memoriaWillCompressMessageAgain: "Allowed compression for {length} message{length, plural, one {} other {s}}",
        memoriaTeachesTheCodexBeforeSheOpens: "Memoria teaches the Codex before she opens it, take her lesson first",
        enableTheCodexInTuningFirst: "Enable the Codex in Tuning first",
        acceptingCurrentCodexRecords: "Accepting current Codex records",
        clearStaleTags: "clear stale tags",
        memoriaIsUpdatingTheCodexRestoreAgain: "Codex update in progress. Wait before restoring.",
        memoriaCouldnTRestoreThatBackup: "Couldn''t restore backup: {error}",
        memoriaCouldnTSyncTheCodexTo: "Couldn''t sync the Codex to the lorebook: {shortErrorText}",
        memoriaRestoredCodexFile: "Restored {length} Codex file{length, plural, one {} other {s}}",
        memoriaIsUpdatingTheCodexAbortThat: "Cancel the Codex update first",
        memoriaCouldnTCarryThatCodexOver: "Couldn''t copy Codex: {shortErrorText}",
        memoriaCarriedTheCodexOverSheWill: "Codex copied. Indexing will start from the beginning of this chat.",
        memoriaHasNoCodexSnapshotToUndo: "No Codex snapshot to restore",
        memoriaCouldnTUndo: "Couldn''t undo: {error}",
        memoriaRolledTheCodexBack: "Codex restored",
        unknownCodexFile: 'Unknown Codex file "{file}".',
        memoriaIsUpdatingTheCodexSaveAgain: "Codex update in progress. Wait before saving.",
        thatIsNotValidJson: "Invalid JSON: {describeError}",
        validationFailed: "Validation failed: {errors0}{extra}",
        savedButCouldNotBeReadSo: "Saved, but couldn''t read {names}. Cross-file checks skipped.",
        savedWithDanglingReferenceToFixIn: "Saved with {length} dangling reference{length, plural, one {} other {s}}",
        memoriaSavedJson: "Saved {file}.json",
        memoriaIsClearingTheCodex: "Clearing Codex",
        memoriaCouldnTClearCodexFileTry: "Couldn''t clear {length} Codex file{length, plural, one {} other {s}}. Retry.",
        memoriaCouldnTClearTheCodexLorebook: "Couldn''t clear Codex lorebook entries: {shortErrorText}",
        memoriaClearedTheCodexForThisChat: "Codex cleared",
        rebuildFiles: "rebuild files",
        memoriaClearedEntrFromTheShelf: "Cleared {removed} entr{removed, plural, one {y} other {ies}}",
        theShelfIsAlreadyEmpty: "Shelf is empty",
        memoriaClearedEntrAndIsReSummarizing: "Cleared {removed} entr{removed, plural, one {y} other {ies}}. Re-summarizing this chat."
      },
      handleExternalEntryDeletion: {
        memoriaUnhidMessageAfterAnExternalLorebook: "Unhid {unhidden} message{unhidden, plural, one {} other {s}} after a lorebook change"
      },
      msg: {
        memoriaHasNoChaptersLeftToRetry: "No chapters left to retry the arc"
      },
      retryLastFailure: {
        nothingToRetryYetMemoriaWillCatch: "Nothing to retry. Waiting for the next message."
      },
      syncProfileSettings: {
        profileSavedButCodexInjectionSettingsCould: "Profile saved. Codex injection sync failed for {length} chat(s): {join}. Fix the errors, then reapply settings.",
        profileSavedButCodexInjectionSettingsCould2: "Profile saved. Codex injection sync failed: {describeError}"
      },
      next: {
        newProfile: "New profile"
      },
      blockerLabel: {
        aVolume: "a volume",
        anArc: "an arc",
        anotherEntry: "another entry"
      },
      text: {
        memoriaSShelfIsAlreadyAlignedNya: "Message visibility is up to date",
        memoriaResyncedMessageHiddenUnhidden: "Resynced {total} message{total, plural, one {} other {s}} ({hidden} hidden, {unhidden} unhidden)",
        thisChatAlreadyHasMemoriesUseRebuild: "This chat has summaries. Use Rebuild.",
        thatChatHasNoMemoriesToInherit: "Source chat has no summaries to inherit",
        memoriaIsAlreadyRebasingThisChat: "Rebase in progress",
        memoriaCanTRebaseAChatOnto: "Choose a different chat to rebase from",
        memoriaIsAlreadyRebuildingThisChat: "Rebuild in progress",
        memoriaCanTRebuildAChatOnto: "Choose a different chat to rebuild from",
        thisChatAlreadyHasACodexWipe: "Wipe this chat''s Codex first",
        thatChatHasNoCodexToCarry: "Source chat has no Codex to copy",
        memoriaCanTCarryACodexOnto: "Choose a different chat to copy the Codex from",
        thisChatHasNoInheritedMemoriesTo: "No inherited memories to detach",
        memoriaDetachedInheritedMemor: "Detached {removed} inherited memor{removed, plural, one {y} other {ies}}"
      },
      extra: {
        more: " (+{length1} more)"
      }
    },
    injection: {
      label: {
        msgs: "{tierName} msgs {firstIdx1}-{lastIdx1}"
      },
      buildInjection: {
        memoriaCouldnTReadTheChatAnd: "Couldn''t read the chat. Summary injection skipped.",
        memoriaCouldnTFindTheChatHistory: "Chat history wasn''t found in the prompt. Summary injection skipped."
      }
    },
    lessons: {
      loadFromDisk: {
        memoriaCouldnTReadHerLessonRegister: "Memoria couldn''t read her lesson register and unsealed the archive: {describeError}"
      },
      mutateLessons: {
        memoriaCouldnTReadHerLessonRegister: "Memoria couldn''t read her lesson register so this change is not saved to disk yet"
      }
    },
    memoria: {
      firePhrases: {
        memoriaStirsTheInkpotNyaa: "Creating chapter…",
        memoriaIsShelvingThisSceneHushA: "Creating chapter…",
        memoriaFlicksHerTailAndStartsWriting: "Creating chapter…",
        memoriaOpensAFreshPageForYou: "Creating chapter…",
        memoriaPadsOffToCompressThisIn: "Creating chapter…"
      },
      retryPhrases: {
        memoriaTrippedOnAQuillTryingAgain: "Retrying…",
        memoriaSInkSmudgedOneMoreTry: "Retrying…",
        memoriaReshufflesTheIndexCardsRetrying: "Retrying…"
      },
      successPhrases: {
        memoriaSlidTheChapterOntoYourShelf: "Chapter created",
        memoriaFiledItNeatlyBetweenTheOthers: "Chapter created",
        memoriaStampedTheSpineAllYours: "Chapter created",
        memoriaPurrsThePageIsDone: "Chapter created",
        memoriaTapsTheChapterIntoPlace: "Chapter created"
      },
      arcFirePhrases: {
        memoriaGathersTheChaptersForAnArc: "Creating arc…",
        memoriaIsBindingSeveralChaptersTogether: "Creating arc…"
      },
      arcSuccessPhrases: {
        memoriaBoundTheArcAndPressedIt: "Arc created",
        memoriaStitchedTheSpineOfANew: "Arc created"
      },
      volumeFirePhrases: {
        memoriaIsPressingAWholeVolumeTogether: "Creating volume…"
      },
      volumeSuccessPhrases: {
        memoriaEmbossedTheSpineOfANew: "Volume created"
      },
      pickPhrase: {
        memoriaNyaa: "Done"
      }
    },
    pipeline: {
      changedSources: {
        summarySourcesChangedDiscardThisResultAnd: "Summary sources changed. Discard and regenerate."
      },
      registerPipelineCallbacks: {
        busyStatus: "busy status",
        streamViewer: "stream viewer"
      },
      busyPhrases: {
        memoriaIsFilingAChapter: "Creating chapter",
        memoriaIsWritingAChapter: "Writing chapter",
        memoriaIsBindingAnArc: "Creating arc",
        memoriaIsPressingAVolume: "Creating volume",
        memoriaIsBindingASeries: "Creating series",
        memoriaIsBindingASaga: "Creating saga",
        memoriaIsBindingALibrary: "Creating library",
        memoriaIsBindingAUniverse: "Creating universe",
        memoriaIsUpdatingTheCodex: "Updating Codex"
      },
      formatBusyLabel: {
        memoriaIsThinkingT: "Reasoning (~{thinkTokens}t, {t})",
        tWrittenTThought: "{writing} (~{tokens}t output, ~{thinkTokens}t reasoning, {t})"
      },
      capStreamPart: {
        earlierOutputTrimmed: `[...earlier output trimmed...]
{slice}`
      },
      noun: {
        bindTheArc: "create arc",
        pressTheVolume: "create volume",
        fileTheChapter: "create chapter"
      },
      failToast: {
        memoriaCouldnT: "Couldn''t {noun}: {shortErrorText}"
      },
      createChapterAuto: {
        memoriaIsFilingAChapter: "Creating chapter"
      },
      createChapterFromRange: {
        memoriaIsFilingAChapter: "Creating chapter"
      },
      runChapter: {
        memoriaSetsThePenDown: "Summary cancelled"
      },
      commitChapter: {
        extraContextModeWasTurnedOffWhile: "Extra context mode was turned off during ghost chapter creation",
        thoseMessagesAreAlreadyStagedAsA: "These messages have a ghost chapter. It''ll file automatically.",
        allMessagesInThisWindowWereJust: "These messages were already summarized by another chapter"
      },
      title: {
        chapterMsgs: "Chapter - msgs {firstIdx1}-{lastIdx1}"
      },
      baseComment: {
        chapterMsgs: "Chapter - msgs {firstIdx1}-{lastIdx1}",
        arcMsgs: "Arc - msgs {firstIdx1}-{lastIdx1}",
        volumeMsgs: "Volume - msgs {firstIdx1}-{lastIdx1}"
      },
      createArcFromChapters: {
        memoriaIsBindingAnArc: "Creating arc"
      },
      runArc: {
        memoriaSetsThePenDown: "Summary cancelled"
      },
      commitArc: {
        allSourceChaptersWereAlreadyBoundBy: "Source chapters were already bound or deleted",
        theArcSavedButChapterCouldnT: "Arc saved, but couldn''t mark {length} chapter{length, plural, one {} other {s}} as superseded"
      },
      arcTitle: {
        inheritedArc: "Inherited Arc"
      },
      comment: {
        arc: "{choice, select, yes {[Root] } other {}}Arc #{sceneNumber} - {baseComment}"
      },
      createHigherFromEntries: {
        memoriaIsBindingA: "Creating {kind, select, chapter {chapter} arc {arc} volume {volume} series {series} saga {saga} library {library} universe {universe} codex {Codex} other {{kind}}}"
      },
      runVolume: {
        memoriaSetsThePenDown: "Summary cancelled"
      },
      commitVolume: {
        allSourceArcsWereAlreadyBoundBy: "Source arcs were already bound or deleted",
        theVolumeSavedButArcCouldnT: "Volume saved, but couldn''t mark {length} arc{length, plural, one {} other {s}} as superseded"
      },
      volumeTitle: {
        inheritedVolume: "Inherited Volume"
      },
      dryRunChapter: {
        chatHasNoMessages: "Chat has no messages",
        noWindowAvailableLowerTheLagOr: "No window available. Lower lag or window thresholds."
      },
      dryRunArc: {
        noChaptersToBindYet: "No chapters to bind"
      },
      dryRunVolume: {
        noArcsToPressYet: "No arcs to press"
      },
      promoteGhostChapters: {
        memoriaShelvedGhostChapter: "Filed {length} ghost chapter{length, plural, one {} other {s}}"
      },
      deriveTitle: {
        msgs: "{trim} (msgs {firstMsg}-{lastMsg})",
        msgs2: "{trimmed}{choice, select, yes {...} other {}} (msgs {firstMsg}-{lastMsg})",
        compressedMsgs: "Compressed - msgs {firstMsg}-{lastMsg}"
      },
      preview: {
        chapterMsgs: "Chapter - msgs {firstIdx1}-{lastIdx1}",
        msgs: "{indexOf} - msgs {firstIdx1}-{lastIdx1}"
      }
    },
    presets: {
      builtinChapterPresets: {
        summary: "Summary",
        summarize: "Summarize",
        synopsis: "Synopsis",
        minimal: "Minimal"
      },
      builtinArcPresets: {
        arc: "Arc"
      },
      builtinVolumePresets: {
        volume: "Volume"
      },
      builtinCodexPresets: {
        default: "Default"
      }
    },
    promptBreakdown: {
      loadPromptBreakdown: {
        thePromptPanelRequiresALumiverseUpdate: "Update Lumiverse to use the Prompt panel. Spindle''s prompt-breakdown API is required.",
        dryRunReturnedNoBreakdown: "Dry run returned no breakdown."
      }
    },
    rebase: {
      retireEntries: {
        someOldSummariesCouldNotBeRemoved: "Couldn''t remove or disable some old summaries. Refresh Books before retrying."
      }
    },
    runtime: {
      debug: {
        lmb: "[lmb:{slice}] {join}"
      }
    },
    shelfActions: {
      editSummaryEntry: {
        thisSummaryIsNoLongerAvailableTo: "Summary no longer available. Refresh Books."
      },
      clearSummaryShelf: {
        removedSummariesButCouldNotBeDeleted: "Removed {removed} summaries; couldn''t delete {length}. Retry clearing before rebuilding."
      },
      removeSummaryEntry: {
        aGhostChapterMustBeShelvedBefore: "File the ghost chapter before releasing it"
      }
    },
    storage: {
      flipped: {
        directives: "{hasName, select, yes {{name}} other {Profile}} directives"
      }
    },
    summarizer: {
      resolveConnection: {
        connectionHasNoModelSetPickOne: 'Connection "{id}" has no model set, pick one in settings'
      },
      messages: {
        abortedByUser: "Cancelled"
      },
      assertRunning: {
        noTokenWithinSTheProviderMay: "No token within {firstTokenTimeoutMs1000}s, the provider may be slow or unreachable",
        theResponseDidNotFinishWithinS: "Response didn''t finish within {overallDeadlineMs1000}s"
      },
      consumeGenerationStream: {
        theStreamEndedBeforeCompleting: "Stream ended before completion"
      },
      resolveMacrosWithDiagnostics: {
        macroOffsetLength: "macro: {message} (offset {offset}, length {length})",
        macrosResolveFailed: "macros.resolve failed: {describeError}"
      },
      assembleChapterPrompt: {
        noConnectionAvailableForMemoria: "No summary connection available",
        chapterPresetMissing: "Chapter preset missing",
        emptyTranscript: "Empty transcript",
        outgoingRegexAppliedScriptS: "Outgoing regex: {length} script(s)"
      },
      diagnostics: {
        connection: "Connection: {name} ({provider}/{model})",
        windowMessageS: "Window: {length} message(s)",
        transcriptTokensModelTokenizer: "Transcript: {transcriptTokens} tokens (model tokenizer)",
        targetTokens: "Target tokens: {targetTokens} ({choice, select, yes {fixed budget, ~{chapterTargetUnitTokens}% of input} other {{chapterTargetPercent}% of input}})",
        targetWordsShownToModel: "Target words: {value}",
        previousMemoriesIncluded: "Previous summaries: {length}",
        opener: "Opener: {opener}",
        presetKey: "Preset key: {chapterPresetKey}",
        samplerParametersBeingSentOnTheWire: "Sampler parameters: {stringify}",
        sourceChapters: "Source chapters: {length}",
        concatenatedChapterBodyTokensModelTokenizer: "Source chapters: {bodyTokens} tokens (model tokenizer)",
        targetTokens2: "Target tokens: {targetTokens} ({choice, select, yes {fixed budget, ~{arcTargetUnitTokens}% of input} other {{arcTargetPercent}% of input}})",
        presetKey2: "Preset key: {arcPresetKey}",
        sourceArcs: "Source arcs: {length}",
        concatenatedArcBodyTokensModelTokenizer: "Source arcs: {bodyTokens} tokens (model tokenizer)",
        targetTokens3: "Target tokens: {targetTokens} ({choice, select, yes {fixed budget, ~{volumeTargetUnitTokens}% of input} other {{volumeTargetPercent}% of input}})",
        presetKey3: "Preset key: {volumePresetKey}"
      },
      assembleArcPrompt: {
        noConnectionAvailableForMemoria: "No summary connection available",
        arcPresetMissing: "Arc preset missing",
        outgoingRegexAppliedScriptS: "Outgoing regex: {length} script(s)"
      },
      assembleVolumePrompt: {
        noConnectionAvailableForMemoria: "No summary connection available",
        volumePresetMissing: "Volume preset missing",
        outgoingRegexAppliedScriptS: "Outgoing regex: {length} script(s)"
      },
      summarizeVolume: {
        noConnectionAvailableForMemoria: "No summary connection available",
        volumePresetMissing: "Volume preset missing",
        emptyModelOutput: "Empty model output",
        theVolumeSummaryCameBackEmpty: "The model returned an empty volume summary"
      },
      summarizeChapter: {
        noConnectionAvailableForMemoria: "No summary connection available",
        chapterPresetMissing: "Chapter preset missing",
        emptyTranscript: "Empty transcript",
        emptyModelOutput: "Empty model output",
        theSummaryCameBackEmpty: "The model returned an empty summary"
      },
      summarizeArc: {
        noConnectionAvailableForMemoria: "No summary connection available",
        arcPresetMissing: "Arc preset missing",
        emptyModelOutput: "Empty model output",
        theArcSummaryCameBackEmpty: "The model returned an empty arc summary"
      },
      parseSummaryJson: {
        theModelSJsonHadNoContent: "The model''s JSON had no content field",
        theModelDidnTReturnValidJson: "The model didn''t return valid JSON"
      }
    },
    summaryBackup: {
      summaryLorebook: {
        lumiBooksSummariesImportThroughBooksToRestore: "LumiBooks summaries. Import in Books to restore message coverage or use as inherited memories.",
        summary: "Summary {i1}"
      },
      exportSummaryLorebook: {
        thereAreNoActiveSummariesToExport: "No active summaries to export",
        fetchingRawChatMessages: "Fetching raw chat messages…",
        lumiBooksSummaries: "LumiBooks summaries - {slice}"
      },
      hashes: {
        hashingRawMessages: "Hashing raw messages… {done} / {length}"
      },
      parseSummaryLorebook: {
        chooseALorebookJsonFileWithEntries: "Choose a lorebook JSON file with entries",
        theLorebookHasNoEntries: "The lorebook has no entries",
        theLorebookHasMoreThan10000: "The lorebook has more than 10,000 entries",
        invalidLorebookEntry: "Invalid lorebook entry",
        everyLorebookEntryNeedsTextContent: "Lorebook entries need text content",
        invalidSummaryCoverageIndices: "Invalid summary coverage indices",
        importedSummary: "Imported summary",
        theLorebookHasNoEnabledSummaries: "The lorebook has no enabled summaries"
      },
      readSummaryImport: {
        theSummaryCoverageDoesNotMatchIts: "Summary coverage doesn''t match its fingerprint"
      },
      commitImportedSummaries: {
        invalidDestinationCoverage: "Invalid destination coverage",
        thisImportContainsOverlappingSummaryCoverageResolve: "Summary ranges overlap. Fix them before importing.",
        someOfTheseMessagesAlreadyHaveSummaries: "Some messages already have summaries. Release them in Books before importing.",
        theChatChangedWhilePreparingTheImport: "Chat changed during import. Choose the file again.",
        importFailedAndSomeImportedSummariesCould: "Import failed. Some imported summaries couldn''t be removed; check Books before retrying."
      }
    },
    summaryMatching: {
      parseFingerprint: {
        invalidSummaryMessageFingerprint: "Invalid summary message fingerprint",
        theSummaryMessageFingerprintIsDamaged: "The summary message fingerprint is damaged"
      }
    },
    summaryTransfer: {
      runSummaryTransfer: {
        thisImportIsNoLongerAvailableChoose: "Import no longer available. Choose the file again.",
        importCancelled: "Import cancelled",
        readingSummaries: "Reading summaries…",
        preparingSummaryExport: "Preparing summary export…",
        readingRawChatMessages: "Reading raw chat messages…",
        summaryExportReady: "Summary export ready",
        enterAWholeMessageNumberFrom0: "Enter a whole message number from 0 to {length}.",
        importedSummaries: "Imported summaries",
        automaticMatchingWasIncompleteOrAmbiguousUp: "Matching was incomplete or ambiguous. Which message should coverage end at?",
        theContentOfThisChatIsDifferent: "This chat differs from the imported summary''s source. Try matching messages?",
        someOfTheseMessagesAlreadyHaveSummaries: "Some messages already have summaries. Release them in Books before importing.",
        theChatChangedWhilePreparingTheImport: "Chat changed during import. Which message should coverage end at?",
        savingImportedSummaries: "Saving imported summaries…",
        importedSummaries2: "Imported {length} summaries{choice, select, yes { covering {size} messages} other { as root memories}}"
      },
      manual: {
        upUntilWhichMessageShouldTheseSummaries: "Which message should coverage end at?"
      },
      computed: {
        comparingRawMessages: "Comparing raw messages… {done} / {length}"
      }
    },
    worldBook: {
      doEnsureBookForChat: {
        chatNotFoundForUser: "Chat {chatId} not found for user",
        memoriaReLinkedThisChatSNotebook: "Notebook link restored. Found {candidates} candidates; check for duplicate notebooks.",
        memoriaReLinkedThisChatSNotebook2: "Notebook link restored",
        memoriaCouldnTFindThisChatS: "Previous notebook not found. Created a notebook; older chapters may be in another."
      },
      book: {
        memoriaSShelfForThisChatChapters: "LumiBooks chapters and arcs for this chat.",
        managedByLumiBooksThisBookMirrorsThe: "Managed by LumiBooks. Codex updates overwrite these lorebook entries. Edit records in LumiBooks > Codex."
      },
      bindBookToChat: {
        theChatIsNoLongerAvailableIts: "Chat no longer available. Couldn''t attach its summary book."
      },
      bindCodexBookToChat: {
        theChatIsNoLongerAvailableIts: "Chat no longer available. Couldn''t attach its Codex book."
      },
      doEnsureCodexBookForChat: {
        chatNotFoundForUser: "Chat {chatId} not found for user"
      }
    }
  },
  codexTidy: {
    resolveTidyTarget: {
      enterAPositiveTokenLimitOrA: "Enter a positive token limit or a percentage between 0 and 100.",
      theTargetMustBeAtLeastOne: "The target must be at least one token."
    }
  },
  prompts: {
    codex: {
      registry: {
        codexTemplates: {
          entitySheetsRelationsTableOn: "Entity sheets (relations table on)",
          describesCharactersJsonLocationsJsonAndThings: "Entity schemas with the relations table enabled. Relationships go in relations.json. {schemaHowtoTail}",
          theEntityFilesActiveThisRunE: "the entity files active this run, e.g. characters.json / locations.json",
          entitySheetsRelationsTableOff: "Entity sheets (relations table off)",
          describesTheEntityFilesWhenTheRelations: 'Entity schemas with the relations table disabled. Relationships go in sheet "ties". {schemaHowtoTail}',
          theEntityFilesActiveThisRun: "the entity files active this run",
          relationsTable: "Relations table",
          describesRelationsJsonAndTheCoverageRules: "Schema and coverage rules for relations.json. Sent when the relations table is enabled and unfrozen. {schemaHowtoTail}",
          timeline: "Timeline",
          describesTimelineJsonIncludingTheAppendOnly: "Schema for timeline.json. Normal updates can append events; the app enforces this. {schemaHowtoTail}",
          threads: "Threads",
          describesThreadsJsonResolvedThreadsAreArchived: "Schema for threads.json. Resolved threads are archived and hidden from the agent; this tells it not to re-add them. {schemaHowtoTail}",
          worldRules: "World rules",
          describesWorldJson: "Describes world.json. {schemaHowtoTail}",
          secrets: "Secrets",
          describesKnowledgeJsonTheValidatorRejectsItems: "Schema for knowledge.json. Items need knownBy, hiddenFrom, or falseBeliefs to pass validation. {schemaHowtoTail}",
          retrievalKeywords: "Retrieval keywords",
          theRulesForTheKeywordsListsOn: "Keyword rules for entities, lore, and secrets. Keywords control recall in Keywords mode and supplement vector recall. Too few can miss records; broad keywords can activate them too often. The app keeps up to 12 keywords, with up to two words per keyword.",
          patchRulesSetDropContent: "Patch rules (set / drop / content)",
          theSharedExplanationOfSetDropSeeds: "Patch rules for set, drop, seeds, and content, used by both protocols below. Keep these consistent with the app''s merge behavior.",
          protocolToolCalls: "Protocol (tool calls)",
          sentWhenTheProfileUsesToolCalls: "Tool-call protocol for batched updates. Keep the tool names codex_write, codex_skip, and codex_done, and the requirement to write or skip the active records. Also defines <think> for models without native reasoning.",
          thePatchRulesTemplateAbove: "the patch rules template above",
          protocolToolCallsOneFileAtA: "Protocol (tool calls, one file at a time)",
          sentWhenTheProfileUsesToolCalls2: "Tool-call protocol for record-by-record updates. Uses the same tools and write-or-skip requirement as batched updates. Smaller replies reduce the risk of output being cut off.",
          protocolJsonMode: "Protocol (JSON mode)",
          sentWhenTheProfileWritesStrictJson: 'JSON protocol for batched updates. Keep the "writes" array, "skip" list, and "done" flag, and the requirement to write or skip the active records.',
          protocolJsonModeOneFileAtA: "Protocol (JSON mode, one file at a time)",
          sentWhenTheProfileWritesStrictJson2: "JSON protocol for record-by-record updates. Uses the same reply structure and write-or-skip requirement as batched updates. Smaller replies reduce the risk of output being cut off.",
          taskClosingBlock: "Task closing block",
          theClosingBlockOfEveryNormalUpdate: "Closes update and catch-up prompts, after the story text. Restates the task''s three passes and reasoning instructions.",
          verificationNudge: "Verification nudge",
          sentAsAnExtraRoundAfterA: "Extra round after a successful update in Thorough mode. The app appends a closing instruction for the selected protocol.",
          tidyPass: "Tidy pass",
          theInstructionBlockForTidyUpThe: "Tidy instructions. The app appends target files, locks, current records, and a closing instruction.",
          refreshPass: "Refresh pass",
          sentWhenReEnabledRecordsCatchUp: "Catch-up instructions for re-enabled records. Requires complete file rewrites.",
          theFilesBeingRefreshed: "the files being refreshed",
          itOrTheyToMatchTheTarget: '"it" or "they" to match the target count',
          itLagsOrTheyLagToMatch: '"it lags" or "they lag" to match the target count',
          howTheStoryInputIsArrangedE: "story input format, e.g. summaries and raw messages",
          rebuildPass: "Rebuild pass",
          sentWhenACategorySRebuildButton: "Category rebuild instructions. Targets appear empty except for locked rows. Requires complete file rewrites. Files are replaced on success; the cursor stays unchanged.",
          theFilesBeingRebuilt: "the files being rebuilt",
          howTheStoryInputIsArranged: "how the story input is arranged",
          reconcileSweep: "Reconcile sweep",
          sentWhenMessagesWereDeletedBehindThe: "Sent after message deletions when no new messages remain. Checks existing claims against the remaining story.",
          fastCatchUp: "Fast catch-up",
          thePreambleForEachFastCatchUp: "Introduces fast catch-up batches, which use chapter summaries instead of raw messages.",
          theMessageRangeThisBatchCovers: "the message range this batch covers",
          ultraCatchUp: "Ultra catch-up",
          thePreambleForTheSinglePassUltra: "Introduces ultra catch-up: a pass over filed summaries and recent raw messages.",
          theMessageRangeCovered: "the message range covered",
          partialViewGuard: "Partial view guard",
          prependedToEveryNormalUpdateTheAgent: "Tells the agent it sees part of the story. Prevents changes based on information missing from that window.",
          reconcileWarning: "Reconcile warning",
          prependedWhenEditsOrDeletionsWereDetected: "Flags existing records for review after edits or deletions behind the Codex cursor.",
          migrationToRelationsTable: "Migration to relations table",
          prependedOnTheFirstRunAfterThe: "Sent after enabling the relations table. Keep the migration instruction; the app checks the result.",
          migrationToInlineTies: "Migration to inline ties",
          prependedOnTheFirstRunAfterThe2: "Sent after disabling the relations table.",
          repairWarning: "Repair warning",
          prependedWhenFilesOnDiskWereUnreadable: "Sent when unreadable files are shown as empty.",
          theUnreadableFiles: "the unreadable files",
          lockedEntities: "Locked entities",
          prependedWhenEntitiesAreLockedTheApp: "Identifies locked entities. The app also rejects changes to them.",
          theLockedEntityIds: "the locked entity ids",
          lockedFields: "Locked fields",
          prependedWhenIndividualFieldsAreLockedOn: 'Identifies locked fields. The agent sees "Locked, do not edit" in place of their values. The app restores those values on writes.',
          theEntitiesCarryingLockedFields: "the entities carrying locked fields"
        },
        schemaHowtoTail: "Keep the JSON structure consistent with the validator or writes will fail. Guidance can be reworded."
      }
    }
  },
  shared: {
    tierNames: {
      chapter: "Chapter",
      arc: "Arc",
      volume: "Volume",
      series: "Series",
      saga: "Saga",
      library: "Library",
      universe: "Universe"
    },
    defaultSettings: {
      default: "Default"
    },
    normalizeSettings: {
      default: "Default"
    },
    base: {
      untitled: "Untitled"
    },
    codexBookNameFor: {
      codexDoNotEdit: "{worldBookNamePrefix} Codex [Do Not Edit] - {suffix}"
    },
    lessonGradeLabel: {
      gilded: "Gilded",
      silver: "Silver",
      bronze: "Bronze",
      apprentice: "Apprentice"
    },
    summaryKindTag: "{kind, select, chapter {CHAPTER} arc {ARC} volume {VOLUME} series {SERIES} saga {SAGA} library {LIBRARY} universe {UNIVERSE} codex {Codex} other {{kind}}}"
  },
  ui: {
    regexPicker: {
      searchProgress: "Searching scripts… {scanned, number} of {total, number} checked",
      search: "Search regex names…",
      noMatches: "No matching regex scripts.",
      previous: "Previous",
      next: "Next",
      page: "Page",
      refresh: "Refresh",
      loading: "Loading regex scripts…",
      failed: "Could not load this page. Select Refresh to retry.",
      range: "{first}–{last} of {total} scripts",
      selected: "{count} selected across all pages"
    },
    activationControl: {
      activationControl: {
        always: "Always",
        keywords: "Keywords",
        vectorKeywords: "Vector + keywords"
      },
      vectorSetupHint: {
        vectorRecallNeedsATestedEmbeddingConnection: "Requires a tested embedding connection and lorebook vectorization in Lumiverse. Indexing runs in the background using its configured provider. Falls back to keywords until ready or if retrieval fails."
      }
    },
    app: {
      tab: {
        lumiBooks: "LumiBooks",
        books: "Books",
        memoriaFilesYourChatIntoChaptersAnd: "Summarizes chats into chapters and arcs.",
        lumiBooks2: "lumi books"
      },
      send: {
        preparingSummaryExport: "Preparing summary export…",
        checkingSummaryCoverage: "Checking summary coverage…"
      },
      showLoadNotice: {
        retry: "Retry"
      },
      requestState: {
        loadingLumiBooks: "Loading LumiBooks…",
        lumiBooksHasnTRespondedYouCanRetry: "LumiBooks hasn''t responded. Retry loading.",
        couldNotLoadLumiBooks: "Couldn''t load LumiBooks: {string}"
      },
      doRender: {
        lumiBooksCouldnTDisplayThisViewRetry: "Couldn''t display this view. Retry to reload."
      },
      unsub: {
        loadingLumiBooks: "Loading LumiBooks…",
        thisChatIsTakingLongerToLoad: "Loading is taking longer than usual. Wait or retry."
      }
    },
    codexExtraFields: {
      applyExtraFields: {
        mustBeAValidNumber: "{key} must be a valid number."
      }
    },
    components: {
      multiSelect: {
        nothingToPick: "No options"
      },
      searchField: {
        value: "×",
        clearSearch: "Clear search"
      },
      relativeTime: {
        justNow: "just now",
        mAgo: "{m}m ago",
        hAgo: "{h}h ago",
        dAgo: "{floor}d ago"
      },
      formatTokens: {
        thousands: "{value}k"
      }
    },
    continuity: {
      sec: {
        continuityRoot: "Continuity (root)"
      }
    },
    lessons: {
      contentBooks: {
        courseBooks: {
          theLibrarianSPrimer: "The Librarian''s Primer",
          whyMemoriaExists: "Why Memoria exists",
          goodMorningWhyDoIExistAs: "GOOD MORNING!! Why do I exist? As you roleplay, you''ll notice that chats that are very large can''t fit in model''s context. Old messages get clipped out, and your model will soon forget important information. How do we fix that?",
          beholdMeITakeYourOlderMessages: "BEHOLD, ME. I take your older messages, and compact chunks of them them into summaries called chapters. When there are too many summaries, I compact them into arcs, and then volumes. Each summary is injected in place of the messages it replaces, so your chat history timeline is preserved!",
          compactedMessagesAreHiddenSoYourLlm: "Compacted messages are hidden so your LLM reads my compact summary instead. And if you delete a chapter, the messages that it once hid unhide again.",
          afterICompactMessagesOfRange1: "After I compact messages of range 1-18 into a chapter, what does the LLM model see for that range?",
          bothTheSummaryAndTheOriginalMessages: "Both the summary and the original messages",
          nothingItSForgotten: "Nothing, it''s forgotten!",
          theChapterSummariesThereInstead: "The chapter summaries there instead",
          aLorebookEntryInTheWorldInfo: "A lorebook entry in the world-info section of the prompt",
          theSummariesReplaceTheMessagesInPlace: "The summaries replace the messages in place :)",
          theFirstFiling: "The first filing",
          thisIsAPracticeChatIMade: "This is a practice chat I made just for teaching you 😾. These highlighted buttons are my quick actions.",
          thisPracticeStoryHasPlentyOfOld: "This practice story has plenty of old messages ready to compact into summaries. Press the File chapter button and watch what happens.",
          boomTheStoryIsNowMoreCompact: "BOOM💣. The story is now more compact, the new summary chapter is on my shelf, and this colored bar changed shape, because those messages now exist as a summary.",
          importantThereSAutomationTooNowYou: `IMPORTANT. There''s automation too! Now you may ask the very important question of: when do I summarize on my own?? And I''ll graciously answer that very important question! That depends on exactly about TWO 2️⃣ settings. Consider: Uncompressed messages are large, but hold detailed info so we don''t want to compress them right away right? Therefore, first setting is what I call the "lag", 65 by default. This represents the number of most recent messages we leave uncompressed always! 🗿`,
          theSecondSettingIsTheWindowWe: `The second setting is the "window" 🪟. We don''t want to summarize every single message individually, instead we probably want toi summarize like, 18, into one chapter! Turns out 18 is the default, what a coincidence! Once 18 old messages have piled up behind your lag, these two "pills" both say "ready", and I begin summarizing a chapter!`,
          theDefaultValuesAreMadeFor200k: "The default values are made for 200k context chats. Adjust the lag and window to your liking, depending on your context, and your message size. But I do reccomend keeping context at 200k. Unless you''re living in 2028 when LLMs are long context GODS (presumably).",
          fileAllFilesChaptersUntilTheLag: '"File all" files chapters until the lag is reached. Bind arc takes my oldest chapters and compresses them into one smaller summary called an arc. When work is waiting to be done, a little pill appears here telling you how much.',
          everythingIFileIsStoredInA: "Everything I file is stored in a lorebook created just for this chat, named after it. It appears the first time a chapter is filed.",
          normallyYouNeverNeedTheseButtonsWith: "Normally you never need these buttons with automation on, I do all of this myself after each message. If a button looks dead, the small text under it says why, usually that I''m busy or you switched me off >:(",
          "70OldMessagesLag65Window18": "70 old messages · lag 65 · window 18",
          thesePillsSayLagReadyButWindow: "These pills say lag ready but window building, and I''m not filing. Why not?",
          theLagHasNotFilledUpYet: "The lag has not filled up yet",
          theChatHasNoLorebookYet: "The chat has no lorebook yet",
          "70MessagesMinusThe65ProtectedBy": "70 messages minus the 65 protected by the lag leaves only 5, and a chapter needs 18",
          aChapterCanOnlyBeFiledAfter: "A chapter can only be filed after an arc exists",
          theWindowOnlyCountsMessagesOlderThan: "The window only counts messages older than the lag. 70 minus 65 is 5, short of 18. This is also when I''d notify you that your story needs more messages if you click file~",
          theDesk: "The desk",
          thisColoredBarIsTheSpineA: "This colored bar is the spine, a map of your whole chat. Each block is a stretch of story, sized by how much prompt it costs. The pale block at the front is the Codex, that''s my second course (it''s really cool).",
          clickAnyColoredBlockAndILl: "Click any colored block and I''ll jump you straight to that chapter or arc on my shelf 🐰. Handy when you want to check what I wrote about a scene.",
          theListUnderItShowsTheSame: "The list under it shows the same picture in numbers: what my volumes, arcs, and chapters cost, plus the recent messages I haven''t touched yet.",
          theseTilesAreTheQuickSummaryFiled: "These tiles are the quick summary. Filed is how much of the chat I''ve compacted. Tail is the recent part I haven''t. Shelf counts everything I''ve made. The Codex tile belongs to my second course 🥷.",
          thePromptPanelShowsThePromptBreakdown: "The Prompt panel shows the prompt breakdown your last generation sent, split into groups. Simulate... simulates your next prompt (what a surprise). And if the prompt goes past 90% of the model''s limit, I warn you here. Bad things happen if you go past 100%... trust me 🤞",
          iWroteTooMuchThePreviousStep: "I wrote too much the previous step, so I''m continuing here. If you''re approaching 100%, turn down the lag! Anyways. While I write, a row like this appears. If you''re a creep 👾, watch lets you read my raw output live, thoughts included.",
          ifIFailEvenAfterRetryingThis: "If I fail even after retrying, this red box shows an error. Please read it.",
          arc154Msgs08kTokens: "ARC 1 · 54 msgs → 0.8k tokens",
          lookAtTheSpineTheArcBlock: "Look at the spine. The arc block at the far left covers 54 messages but is drawn as a thin sliver, while the uncompressed tail at the end takes most of the bar. Why?",
          witnessThePowerOfLumibooks: "WITNESS THE POWER OF LUMIBOOKS",
          newerStoryIsAlwaysDrawnBigger: "Newer story is always drawn bigger",
          theArcLostMostOfItsMessages: "The arc lost most of its messages",
          theBarShowsTimePassingNotSize: "The bar shows time passing, not size",
          theSpineIsACostMapThin: "The spine is a cost map. Thin blocks mean my awesome compression technology is working, the fat block are the uncompressed messages.",
          compressionIsRunningYetYourPromptIs: "Compression is running, yet your prompt is still huge. Which number here explains it?",
          theTailRecentMessagesAreUncompressedUntil: "The Tail, recent messages are uncompressed until they pass the lag+window",
          theFiledTileFilingGrowsThePrompt: "The Filed tile, filing grows the prompt",
          theShelfTileTooManyChapters: "The Shelf tile, too many chapters",
          theCodexTileEvenThoughYouDon: "The Codex tile, even though you don''t know what it is yet 🤥",
          theUncompressedTailIsUsuallyTheFat: "The uncompressed tail is usually the fat part of the prompt. If it doesn''t fit your context, lower the lag so I file closer to the present.",
          theShelf: "The Shelf",
          everythingIFileEndsUpOnMy: "Everything I file ends up on my Shelf. Let''s visit it. Tap the Books tab.",
          myShelf: "My shelf.",
          witnessMyShelfEverythingIVeFiled: "Witness my Shelf 😈. Everything I''ve filed for this chat lives here, sorted into volumes, arcs, and chapters.",
          entriesOpenWithAClickTapThe: "Entries open with a click. Tap the chapter called The Captain Asks Questions.",
          thereSTheWholeRecord: "There''s the whole record.",
          youLlSeeItsSizeBeforeAnd: "You''ll see its size before and after compacting, my little note, and four buttons. Edit rewrites the text. Regenerate throws the summary away and writes it again from the same messages. Release turns it into a normal lorebook entry that I stop managing. Delete removes it. Boring stuff 💤",
          fadedEntriesMeansAnArcOrVolume: "Faded entries means an arc or volume replaced them, like how chapters replace messages. Delete the arc and its chapters unhide again.",
          importantTheGhostTagMarksAChapter: "🚩IMPORTANT🚩 The GHOST tag marks a chapter I prepared early for Codex, but I don''t actually inject it or use it in the summaries yet until it passes the lag. My Codex course explains those. If you ask about this on Discord I will kill you.",
          youDeleteAnArcThatWasMade: "You delete an arc that was made from 3 chapters. What happens?",
          the3ChaptersUnhideAndInjectAgain: "The 3 chapters unhide and inject again, and the messages stay hidden",
          theChaptersAndAllTheirMessagesReturn: "The chapters and all their messages return to the prompt",
          the3ChaptersAreDeletedAlongWith: "The 3 chapters are deleted along with the arc",
          prolixTakesAShit: "Prolix takes a shit",
          deletingATierHandsTheJobBack: "Deleting a tier hands the job back down to the one below. The messages themselves only return when nothing covers them at all.",
          halfTheChaptersHereAreFadedAnd: "Half the chapters here are faded and labeled superseded. Did something break?",
          noAnArcReplacedThemTheyStay: "No, an arc replaced them, they stay stored while the arc speaks for those scenes",
          yesTheyFailedToSave: "Yes, they failed to save",
          yesTheirMessagesWereDeleted: "Yes, their messages were deleted",
          theyWereAccidentallyExcluded: "They were accidentally excluded",
          supersededIsNormalHousekeepingAfterAnArc: "Superseded is normal housekeeping after an arc binds. Delete the arc and those chapters wake up again.",
          whichOfTheseButtonsActuallyCallsThe: "Which of these buttons actually calls the AI model?",
          regenerate: "Regenerate",
          delete: "Delete",
          release: "Release",
          exclude: "Exclude",
          value: "🐌",
          composeManualControl: "Compose, manual control",
          anywayManualControlsNext: "Anyway. Manual controls next!",
          ready: "Ready?",
          theComposeTabIsManualModeFilter: "The Compose tab is manual mode. Filter or search these messages, tick the boxes, and shift-click (or long-press on a phone) to grab a whole range. A ✓ means already filed, a ⊘ means excluded.",
          compressFilesWhatYouSelectedIntoA: "Compress files what you selected into a chapter. Wow no way!",
          excludeProtectsMessagesFromMeCompletelyPerfect: "Exclude protects messages from me completely. Perfect for OOC notes or instructions that must stay word-for-word.",
          furtherDownYouCanPickChaptersTo: "Further down you can pick chapters to bind into an arc, and arcs to press into a volume. Volumes are the strongest compression. If you need more, you probably don''t.",
          whenIsExcludeTheRightToolInstead: "When is Exclude the right tool, instead of Delete?",
          whenAMessageMustStayInThe: "When a message must stay in the prompt word-for-word and never be summarized",
          whenYouWantAMessageGoneFrom: "When you want a message gone from the chat",
          whenAChapterCameOutBadly: "When a chapter came out badly",
          whenYouWishToDeceiveYourEnemy: "When you wish to deceive your enemy, and therefore, must deceive yourself 🐉",
          excludeKeepsTheMessageFromCompressionDelete: "Exclude keeps the message from compression. Delete removes it from the chat.",
          continuityAndRepair: "Continuity and repair",
          oneMoreIPromiseTapAdvanced: "ONE MORE I PROMISE. Tap Advanced.",
          theContinuityDesk: "The continuity desk.",
          continuityLetsANewChatInheritAn: "Continuity lets a new chat inherit an old chat''s memories. Rebase copies another chat''s chapters and arcs in as a frozen prologue, marked [Root], injected before your first message.",
          rebuildFromDeletesThisChatSOwn: `"Rebuild from"  deletes this chat''s own memories first, then starts over on top of the inherited ones. Detach removes inherited memories again. And if you branch a chat, the new branch inherits this.`,
          maintenanceFixesThingsWhenTheShelfAnd: "Maintenance fixes things when the shelf and the chat disagree. Resync visibility unhides any message whose chapter no longer exists and re-hides the rest properly. Rebuild books wipes my work and re-summarizes the whole chat. Wipe books just wipes.",
          someRepairsIHandleMyselfDeleteOne: "Some repairs I handle myself. Delete one of my entries in the Lorebook drawer and I notice, unhide its messages, and toast you about it. If a chat''s lorebook link ever breaks, I try and re-link it. So don''t fuck with me >:)",
          youStartASequelChatItsShelf: "You start a sequel chat. Its shelf is empty, and you pick the old chat as a source. Rebase or Rebuild?",
          rebaseDuh: "Rebase, duh?",
          rebuildItIsAlwaysTheSaferOption: "Rebuild, it is always the safer option",
          neitherCopyTheEntriesOverByHand: "Neither, copy the entries over by hand like force of nature",
          detachFirstThenRebuild: "Detach first, then Rebuild",
          rebaseIsForFreshChatsRebuildIs: "Rebase is for fresh chats. Rebuild is for chats that already have their own memories that need replacing.",
          tuningThePress: "Tuning the press",
          okThisIsActuallyTheLastPart: "Ok this is ACTUALLY the last part. Tap the Tuning tab.",
          myDials: "My dials.",
          everythingIDoIsControlledByA: "Everything I do is controlled by a profile, and the active profile applies to all of your chats at once. The Extension checkbox is my master switch, off means I do nothing anywhere.",
          rightBelowSitsMyWritingDeskWhich: "Right below sits my writing desk: which AI connection I write with, plus my sampler settings. Empty sampler fields fall back to my summarizing defaults, temperature 0.4 among them. The big toggle up top switches to the Codex''s own connection and samplers, that''s my second course.",
          nextRoomTapSettings: "Next room. Tap Settings.",
          thePressRoom: "The press room.",
          thisIsThatWindowThingITold: "This is that window thing I told you about earlier! Change it here.",
          arcsCanBuildAutomaticallyAfterEnoughChapters: "Arcs can build automatically after enough chapters pile up, just like how chapters build after enough messages pile up.",
          andThisIsTheAutomationSettingI: "And this is the automation setting I talked about earlier too! Codex has its own, but do my second, shorter course for that one.",
          contextIsJustHowManyPreviousChapters: "Context is just how many previous chapters I read each time for, well, context. Some other boring stuff...",
          windowTokens18: "Window · tokens · 18",
          youSwitchTheWindowUnitFromMessages: "You switch the window unit from messages to tokens, but leave the value at 18. What did you just ask me for?",
          chaptersOfAbout18MessagesSameAs: "Chapters of about 18 messages, same as before",
          idk: "Idk",
          youAskedMeToConvert18Messages: "You asked me to convert 18 messages into tokens",
          chaptersWillAutomaticallyFileAfterOnly18: "Chapters will automatically file after only ~18 tokens of story, about one sentence each. Uh oh. ",
          theUnitChangesWhatTheNumberMeans: "The unit changes what the number means. Tokens are little word-pieces, one message is hundreds of them, so token windows want values in the thousands",
          lag10Messages: "Lag · 10 messages",
          youLowerTheLagFrom65Down: "You lower the lag from 65 down to 10. What changes?",
          iStartSummarizingMuchCloserToThe: "I start summarizing much closer to the present, only your 10 newest messages stay untouched",
          chaptersGetBigger: "Chapters get bigger",
          nothingUntilTheWindowAlsoChanges: "Nothing until the window also changes",
          iGoBackAndReSummarizeOld: "I go back and re-summarize old chapters",
          aSmallLagSavesMoreSpaceBut: "A small lag saves more space but summarizes your recent scenes sooner. Keep it just big enough for quality writing without hallucination.",
          window40TargetPercent4: "Window · 40 · Target percent · 4",
          youSetTheWindowTo40And: "You set the window to 40 and Target percent to 4% (defaults are 18 and 15%). What do your chapters become?",
          chaptersBecomeSmallerAndTheyCover40: "Chapters become smaller, and they cover 40 messages each.",
          chaptersBecomeSmallerAndMoreFrequent: "Chapters become smaller and more frequent",
          theSameTheRatioOnlyAffectsArcs: "The same, the ratio only affects arcs",
          unchangedUntilTheLagChangesToo: "Unchanged until the lag changes too",
          theWindowIsWhatGoesInThe: "The window is what goes in, the ratio is what comes out. 4% is wayy to aggresive compression, but it''s up to you in the end!",
          andTheLastPartOfTheSettings: "And the last part of the settings, tap Prompts.",
          myInstructions: "My instructions.",
          thePromptsPaneHoldsMyInstructionsFour: "The Prompts pane holds my instructions. Four built-in chapter styles, or duplicate one and edit it, or import your old STMB presets. Dry run shows the exact final prompt I would send, without spending a single token.",
          memoriaCouldnTFileTheChapterThe: "Couldn''t create chapter: The model didn''t return valid JSON",
          everyOneOfMyChaptersFailsLike: "Every one of my chapters fails like this, even after retries. The most likely fix?",
          giveMeAStrongerModelOrA: "Give me a stronger model or a different connection",
          raiseTheLag: "Raise the lag",
          turnOffMessageHiding: "Turn off message hiding",
          lowerTheRetryCount: "Lower the retry count",
          retriesCannotFixAModelThatKeeps: "Retries cannot fix a model that keeps writing broken JSON. Also check that custom prompts or regex scripts are not mangling my output.",
          finalFuckingLee: "Final Fucking Lee",
          practiceIsOverThisIsYourReal: "Practice is over. This is your REAL ui.",
          ifYourChatAlreadyHasEnoughStory: "If your chat already has enough story, press File chapter for real and watch me work. If not, skip this, I''ll start on my own once it does.",
          aRealChapterFiledByYourOwn: "A real chapter, filed by your own hand!",
          myAutomationSwitchLivesInTuningTap: "My automation switch lives in Tuning. Tap the Tuning tab, then Settings.",
          thereSTheSwitch: "There''s the switch.",
          turnRunAutomationOnAndILl: "Turn Run automation on, and I''ll handle the filing myself after every message from now on.",
          automationIsOnILlTakeIt: "Automation is on. I''ll take it from here!",
          wellDoneMousepadHasLetMeKnow: "Well done! Mousepad has let me know, that they want to tell me to tell you that they are very proud of you for getting through this 🏆. Sign and take your diploma! The shorter Codex course is waiting whenever you''re curious :)"
        }
      },
      contentCodex: {
        courseCodex: {
          theArchivistSCodex: "The Archivist''s Codex",
          whyAStoryBible: "Why a story bible",
          summaryChaptersAreAGoodOutlineBut: "Summary chapters are a good outline. But if you compress a story enough you''ll start losing information, like secrets, location details, and specific object info. This means that somehow, we must separately track the important parts of the story as we compress it.",
          beholdTheKnowledgeCodexLetSWalk: "BEHOLD the Knowledge Codex 😎. Let''s walk though a practice one for a little murder mystery to help you understand it. Tap the Codex tab up top.",
          thereItIs: "There it is.",
          eightRecordsMakeTheCodexCharactersLocations: "Eight records make the Codex: characters, locations, things, relations, a timeline, story threads, world rules, and secrets. A small agent reads your new messages on a schedule and updates it all 💪. Each record becomes a lorebook entry. Timeline and threads stay constant; the others use Keywords by default. In Tuning → Settings → Codex, choose Always or Vector + keywords for different recall. Vector recall needs embeddings set up in Lumiverse.",
          yourCharacterCardSaysEliasHasA: "Your character card says Elias has a scar. It never comes up in the story, and the Codex never records it. Is that a bug?",
          noTheCodexOnlyRecordsWhatThe: "No. The Codex only records what the story itself mentions",
          yesTheCodexShouldCopyEverythingFrom: "Yes, the Codex should copy everything from the card",
          theCardHasToBeImportedInto: "The card has to be imported into the Codex first",
          theCodexOnlyTracksCharactersYouAdd: "The Codex only tracks characters you add by hand",
          iReadYourLoreAsReferenceFor: "I read your lore as reference for names and spellings, but copying it in would be duplicating information.",
          readingTheCodex: "Reading the Codex",
          theLineUpTopIsMyLedger: "The line up top is my ledger. It tells you whether a Codex exists, how many new messages I haven''t read yet, and when I last ran.",
          theseAreTheEverydayActionsUpdateNow: "These are the everyday actions. Update now makes me read everything up to your newest message, tidy makes the Codex smaller, and undo reverts my last change. Rebuild and Wipe live in the Manage tab, along with import and export.",
          everyTileIsOneRecordItsCount: "Every tile is one record, its count, and token usage. These tiles are also buttons. Click the Relations tile once.",
          dashedMeansNotInjectedButStillUpdated: "Dashed means not injected but still updated. A second click freezes updates completely, a third turns it back on. Try clicking it more if you want.🖱️🖱️🖱️🖱️",
          youFrozeRelations40MessagesAgoAnd: "You froze Relations 40 messages ago and it now says stale. What happens when you re-enable it?",
          itSMarkedAsNeedingACatch: "It''s marked as needing a catch-up. A refresh does that from the summaries and recent messages",
          theGapFillsInAutomaticallyOnThe: "The gap fills in automatically on the next normal update",
          nothingCanRecoverTheMissedEventsExcept: "Nothing can recover the missed events except a full rebuild",
          tidyItTidyingReReadsTheMissed: "Tidy it, tidying re-reads the missed messages",
          myReadingPositionIsAlreadyPastThose: "My reading position is already past those messages, so normal updates wont fix it. The Overview offers a one-pass catch-up for re-enabled records.",
          rebuildCodexAndWipeCodexBothErase: "Rebuild Codex and Wipe Codex both erase everything. What is actually different afterward?",
          wipeHelpsLumiAgentWipeHerAss: "Wipe helps LumiAgent wipe her ass.",
          rebuildKeepsYourEntriesAndOnlyRewrites: "Rebuild keeps your entries and only rewrites the stale ones",
          wipeAlsoDeletesYourChaptersAndArcs: "Wipe also deletes your chapters and arcs",
          rebuildKeepsYourTileSettingsAndRemakes: "Rebuild keeps your tile settings and remakes the Codex from scratch, whereas wipe destroys it all.",
          bothEraseTheRecordsAndMyReading: "Both erase the records and my reading position. The difference is when the re-reading happens and whether your tile switches survive.",
          theRecordsHandsOn: "The records, hands on",
          tapEntitiesAndBehold: "Tap Entities and behold...",
          thePeoplePlacesAndThings: "The people, places, and things! 🌎",
          everyChipIsAnEntityClickOne: 'Every "chip" is an entity. Click one to open its sheet. Poke around as much as you like.',
          iAddAndUpdateAllOfThese: "I add and update all of these myself as the story goes, you never have to! But you can, if I ever write something strange, and it''s a good way to learn the interface now. Try it: click the + character chip, type a name, Mousepad maybe, then press Save on the sheet.",
          savedYourEditsAreCanonNowI: "Saved. Your edits are canon now, I read them as truth and build on them.",
          charElias: "char:elias",
          theStoryHasMovedOnEliasIsn: `The story has moved on, Elias isn''t hiding anymore, but his sheet still says "hiding in the tannery loft". What''s happening?`,
          theAgentHasnTReadThatFar: "The agent hasn''t read that far yet. It catches up on its own.",
          theCodexIsBrokenDeleteTheExtension: "The Codex is broken, delete the extension",
          sheetsNeverChangeOnceWritten: "Sheets never change once written",
          youHaveToDeleteEliasAndRe: "You have to delete Elias and re-add him",
          theCodexUpdatesOnAScheduleSo: "The Codex updates on a schedule, so it can trail the story by a few messages. Hand edits are safe and treated as if I wrote them.",
          charCaptain: "char:captain",
          considerTheCaptainLetSSayThat: "Consider the Captain. Let''s say that his character card describes him well. This means I don''t need him in the Codex as well. See here how it says locked after 1 click? That''s bad! I won''t write to his sheet, but right now it still is added to prompts :(. Click the button one more time.",
          greatHeIsNoLongerUpdatedOr: "Great, he is no longer updated OR injected into the prompt. You can do this to entries or entry sub-sections too!",
          letSExploreTheWorldWideWeb: "Let''s explore the world wide web. Tap Relations.",
          thisIsTheListView: "This is the list view.",
          iCreateTheseAndKeepTheseUpdated: "I create these and keep these updated on my own too, but again, we can edit them manually too. Let''s try it so you can see the fields. Press + Relation, connect your new character to someone. The From and To boxes suggest ids as you type. Give it a kind, like owes, and a short state, then Save.",
          recorded: "Recorded!",
          youJustAddedARelationByHand: "You just added a relation by hand. Will my agent overwrite or delete your work on its next pass?",
          noYourEditsBecomePartOfThe: "No. Your edits become part of the record, the agent builds on them and only rewrites what the story contradicts",
          yesTheAgentRewritesEverythingFromScratch: "Yes, the agent rewrites everything from scratch each pass",
          yesUnlessYouFreezeTheRelationsTile: "Yes, unless you freeze the Relations tile first",
          handEditsOnlySurviveWhileTheRelations: "Hand edits only survive while the relations table is off",
          theAgentAlwaysStartsFromTheCurrent: "The agent always starts from the current records, so your corrections are canon it preserves. Freezing is only for stopping updates entirely.",
          tapGraph: "Tap Graph.",
          thereSYourWebARealStory: "There''s your web. A real story will look much more complex.",
          thisIsTheWebForThisSmall: "This is the web for this small demo. If you tap a line, the relationship description will be under the graph, tap a diamond to open that entity''s sheet, and drag nodes around freely. The remaining panes hold the rest of the bible: Timeline keeps dated events, Threads tracks open storylines, Lore holds world rules, and Secrets holds the who-knows-what. Browse them any time.",
          theAgentAndItsDials: "The agent and its dials",
          lastStopMyRulesOpenTheTuning: "Last stop, my rules. Open the Tuning tab, its Settings pane, then the Codex side.",
          myDials: "My dials.",
          myCodexSettingsLiveHereByDefault: "My Codex settings live here. By default, I lag by 6 messages, then read 20 per update.",
          codexLag65: "Codex lag · 65",
          youRaiseTheCodexLagFrom6: "You raise the Codex lag from 6 up to 65, same as the chapter lag. What changes?",
          theBibleAlwaysRuns65MessagesBehind: "The bible always runs ~65 messages behind, which may be too far behind for what you want!",
          nothingTheLagOnlyAffectsChapters: "Nothing, the lag only affects chapters",
          theCodexGetsCheaperWithNoDownside: "The Codex gets cheaper with no downside",
          theAgentRunsMoreOften: "The agent runs more often",
          chaptersActAsReplacementsOfOldMessages: "Chapters act as replacements of old messages, where the Codex is a snapshot of the truth of the chat. It may be a good idea to keep it closer to the present.",
          twoMoreThingsRelationsTableOffMoves: "Two more things. Relations table off moves connections onto each sheet as short notes, an easier format for weaker models. Extra context mode has me write chapters early as ghosts so I can use them as small context snippets. My own model connection and samplers live on the Connection pane, behind its Codex toggle, and Use tool calls lives there too for providers that support tools.",
          oneMoreThingEditAnyRecordWhenever: "One more thing! Edit any record whenever you like, and if you edit or delete an old message that was Codex-recorded, my next run notices, rewinds, and corrects the Codex.",
          memoriaCouldnTUpdateTheCodexThe: "Couldn''t update the Codex: The Codex agent didn''t call tools.",
          everyCodexRunFailsWithThisWhat: "Every Codex run fails with this. What is the most likely cause?",
          theCodexModelCannotMakeToolCalls: "The Codex model cannot make tool calls, pick one that can under Codex connection",
          theChatIsTooLong: "The chat is too long",
          aCodexFileIsCorrupted: "A Codex file is corrupted",
          theRelationsTableIsOff: "The Relations table is off",
          withUseToolCallsOnTheAgent: "With Use tool calls on, the agent writes its records through tool calls, and a model that can only write prose cannot keep the Codex that way. Turning it back off (Connection pane, Codex toggle) returns me to JSON mode, which works on every connection.",
          withExtraContextModeOnAChapter: "With extra context mode on, a chapter shows up on your Shelf tagged GHOST, and it isn''t in the prompt. Is something wrong?",
          noItSAChapterWrittenEarly: "No. It''s a chapter written early to feed the Codex, but isn''t used before summary lag!",
          pleaseReadThisOneCarefullyOrMousepad: "PLEASE READ THIS ONE CAREFULLY OR MOUSEPAD WILL BE MAD",
          yesItSCorruptedDeleteItAnd: "Yes, it''s corrupted, delete it and resync",
          itSADraftWaitingForYour: "It''s a draft waiting for your approval",
          ghostsGiveTheCodexContextEarlyAnd: "Ghosts give the Codex context early, and are eventually turned into real summaries later down the line. ",
          openingCeremony: "Opening ceremony",
          practiceIsOverThisIsYourReal: "Practice is over, this is your real archive. Walk to your own Codex pane: the Tuning tab, then Settings, then its Codex side.",
          alreadyThereGood: "Already there. Good.",
          flipEnableCodexOnTheDefaultSettings: "Flip Enable Codex on. The default settings below suit most chats.",
          enabledFromNowOnIKeepYour: "Enabled! From now on I keep your story bible current after every message.",
          homeHasAnUpdateCodexButtonNow: "Home has an Update Codex button now. Let''s go find it. Tap Home.",
          pressItAndILlReadThis: "Press it and I''ll read this chat right away, or skip and I''ll do it later!",
          readingWatchTheBusyRowOnHome: "Reading! Watch the busy row on Home if you want to see me think.",
          thatSAllGoForthAndMake: "That''s all, go forth and make some awesome stories!✨"
        }
      },
      diagrams: {
        diagramRot: {
          theContextWindow: "the context window"
        },
        caption: {
          newTurnsPushInTheOldestGet: "new turns push in, the oldest get clipped out",
          thePlotSurvivesTheStructuredFactsThin: "the plot survives, the structured facts thin out"
        },
        diagramFold: {
          yourChatHistory: "your chat history"
        },
        states: {
          oldMessagesPileUp: "old messages pile up…",
          ch1: "CH 1",
          theOldestFoldIntoAChapterIn: "…the oldest fold into a chapter, in place…",
          ch2: "CH 2",
          thenTheNextWindowFolds: "…then the next window folds…",
          arc1: "ARC 1",
          andChaptersBindIntoASingleArc: "…and chapters bind into a single arc."
        },
        diagramUnfold: {
          theShelf: "the shelf"
        },
        filed: {
          ch3: "CH 3",
          aChapterCoversMessages3754They: "a chapter covers messages 37-54, they ride hidden"
        },
        deleted: {
          deleteItAndTheMessagesComeRight: "delete it and the messages come right back"
        },
        fadeChips: {
          eliasMaraLovesHerHidesIt: "Elias → Mara: loves her, hides it",
          captainWronglyBelievesBandits: "captain wrongly believes: bandits",
          day12SheSawTheFall: "day 12: she saw the fall",
          openThreadTheReceipt: "open thread: the receipt"
        },
        diagramFade: {
          oneSummaryCompressedAgainAndAgain: "one summary, compressed again and again",
          arc: "arc",
          volume: "volume",
          withACodex: "with a Codex",
          theCodexTracksThemExplicitlyOutsideThe: "the Codex tracks them explicitly, outside the summaries"
        },
        tier: {
          chapter: "chapter"
        },
        reset: {
          chapter: "chapter",
          thePlotSurvivesTheStructuredFactsThin: "the plot survives, the structured facts thin out"
        }
      },
      diploma: {
        gradeRemark: {
          notAPageOutOfPlaceMy: "Not a page out of place. My favorite reader, nyaa.",
          nearlyFlawlessFilingTheShelfApproves: "Nearly flawless filing. The shelf approves.",
          aSolidApprenticeshipTheStacksWillTeach: "A solid apprenticeship. The stacks will teach the rest.",
          theLibraryForgivesRetakeASectionWhenever: "The library forgives. Retake a section whenever you like."
        },
        renderRegister: {
          signTheRegister: "Sign the register",
          theNameGoesOnYourDiploma: "The name goes on your diploma."
        },
        input: {
          reader: "Reader"
        },
        sign: {
          sign: "Sign",
          reader: "Reader"
        },
        renderDiploma: {
          lumibooksAcademy: "LUMIBOOKS ACADEMY",
          certifiesThat: "certifies that",
          hasReadTheStacksAndUnderstoodThem: "has read the stacks and understood them",
          ofGoldStamps: "{gold} of {total} gold stamps · {toLocaleDateString}",
          saveAsImage: "Save as image",
          prefersReducedMotionReduce: "(prefers-reduced-motion: reduce)"
        },
        makeConfetti: {
          value: "◆"
        },
        downloadDiploma: {
          lUMIBOO: "L U M I B O O K S   A C A D E M Y",
          certifiesThat: "certifies that",
          hasReadTheStacksAndUnderstoodThem: "has read the stacks and understood them",
          ofGoldStamps: "{gold} of {total} gold stamps · {toLocaleDateString}",
          memoriaLibrarian: "— Memoria, Librarian"
        }
      },
      engine: {
        buildStage: {
          exam: "{title} · Exam",
          value: "✕",
          leaveTheExamAnUnfinishedExamIs: "Leave the exam, an unfinished exam is not saved",
          leaveAnytimeYourDiplomaAndPreviousGrade: "Leave anytime, your diploma and previous grade stand",
          leaveTheLessonProgressIsSaved: "Leave the lesson, progress is saved",
          leaveTheLesson: "Leave the lesson",
          collapseTheDialogue: "Collapse the dialogue"
        },
        renderRail: {
          questionOf: "Question {examIdx1} of {length}"
        },
        table: {
          ix: "IX",
          iv: "IV"
        },
        makeSandboxSend: {
          memoriaSavedJson: "Memoria saved {file}.json"
        },
        runDoScript: {
          memoriaIsFilingAChapter1s: "Memoria is filing a chapter (1s)",
          memoriaOpensAFreshPageForYou: "Memoria opens a fresh page for you, nya",
          memoriaSlidTheChapterOntoYourShelf: "Memoria slid the chapter onto your shelf, nyaa~",
          memoriaSavedJson: "Memoria saved {file}.json"
        },
        renderDemoFor: {
          noChatIsOpenRightNowSkip: "No chat is open right now, skip this step."
        },
        renderCover: {
          value: "◆ ◇ ◆"
        },
        positionSpotlight: {
          value: "◆ {chip}"
        },
        renderStep: {
          signTheRegister: "Sign the register"
        },
        renderSheet: {
          rightWhereWeNeedToBe: "Right where we need to be.",
          back: "Back",
          skip: "Skip",
          yourMove: "your move…",
          next: "Next",
          working: "working…"
        },
        renderQuiz: {
          alreadyStampedGoldFromTheExamOr: "Already stamped gold, from the exam or an earlier pass.",
          answeredOnAnEarlierPass: "Answered on an earlier pass.",
          back: "Back",
          next: "Next",
          filed: "Filed! ◆",
          notQuite: "Not quite.",
          continue: "Continue",
          skipMarkForRevisit: "Skip, mark for revisit",
          holdToPeekAtThePane: "Hold to peek at the pane"
        },
        finishExam: {
          ofThePassedTopicsStayStampedWhile: "{correct} of {length}, the passed topics stay stamped while we walk the rest"
        },
        renderStepExamPass: {
          signTheRegister: "Sign the register"
        },
        data: {
          reader: "Reader"
        },
        renderDiplomaPhase: {
          enterTheArchive: "Enter the Archive",
          openTheCodex: "Open the Codex",
          close: "Close",
          yourDiplomaAsFiledInTheAcademy: "Your diploma, as filed in the Academy.",
          signedStampedAndShelvedCongratulationsNyaa: "Signed, stamped, and shelved. Congratulations, nyaa."
        }
      },
      fixture: {
        lines: {
          theRainHadNotLetUpSince: "The rain had not let up since the duke''s carriage was found empty on the north road.",
          eliasPressedTheSilverLocketIntoHis: "Elias pressed the silver locket into his palm until the clasp bit skin.",
          youWereThereMaraSaidQuietlyNot: '"You were there," Mara said quietly, not looking up from her stitching.',
          theCaptainSMenWentDoorTo: "The captain''s men went door to door along Wren Street before dawn.",
          iKeepMyVoiceLevelAndAsk: "I keep my voice level and ask what the pawnbroker wanted for his silence.",
          ashfordManorStoodDarkExceptForA: "Ashford Manor stood dark except for a single lamp in the study window.",
          banditsTheCaptainRepeatedWritingItDown: '"Bandits," the captain repeated, writing it down like he believed it.',
          maraFoldedTheReceiptIntoTheHem: "Mara folded the receipt into the hem of her sleeve and said nothing.",
          theBellsRangForTheDukeAt: "The bells rang for the duke at noon, and half the city wore borrowed black.",
          eliasSleptInTheLoftAboveThe: "Elias slept in the loft above the tannery and dreamed of the study door.",
          ifTheyFindTheLocketTheyFind: '"If they find the locket, they find you," she whispered on the bridge.',
          theFerrymanSScarCaughtTheLight: "The ferryman''s scar caught the light when he took my coin."
        },
        makeMeta: {
          msgs: "{title} (msgs {first1}-{last1})"
        },
        tag: {
          vol: "Vol",
          arc: "Arc"
        },
        comment: {
          msgs: "#{n} - {title} (msgs {first1}-{last1})",
          msgs2: "{tag} #{n} - {title} (msgs {first1}-{last1})"
        },
        ch: {
          theDukeFalls: "The Duke Falls",
          "1stSummaryChapterContaining18PriorTurns": `1st Summary Chapter Containing 18 Prior Turns

Day 3. The Duke of Ashford is found dead in his study. Elias, the duke''s valet, flees through the servant stair carrying the silver locket. Mara sees him cross the yard with blood on his cuff and says nothing. The city watch seals the manor by nightfall.`,
          neatlyFiledOneNefariousNightOnThe: "Neatly filed, one nefarious night on the shelf.",
          aSeamstressSSilence: "A Seamstress''s Silence",
          "2ndSummaryChapterContaining18PriorTurns": `2nd Summary Chapter Containing 18 Prior Turns

Day 5. The captain interviews the manor staff. Mara claims she saw bandits on the north road and is dismissed. Elias hides in the tannery loft and pays the pawnbroker to hold the locket. Mara keeps the pawnbroker''s receipt sewn into her sleeve.`,
          secretsStitchedIntoASleeveSoTidy: "Secrets stitched into a sleeve, so tidy nya.",
          thePawnbrokerSReceipt: "The Pawnbroker''s Receipt",
          "3rdSummaryChapterContaining18PriorTurns": `3rd Summary Chapter Containing 18 Prior Turns

Day 8. The pawnbroker raises his price for silence. Elias and Mara meet on the bridge and argue about running. The captain announces the bandit theory publicly at the duke''s funeral while quietly reopening the staff interviews.`,
          priceyPromisesPressedBetweenThePages: "Pricey promises pressed between the pages.",
          theCaptainAsksQuestions: "The Captain Asks Questions",
          "4thSummaryChapterContaining18PriorTurns": `4th Summary Chapter Containing 18 Prior Turns

Day 11. The captain searches the tannery district on a tip. Elias escapes over the rooftops but drops a glove with the manor''s crest. Mara burns her bloodied stitching and tells the captain she is leaving the city to mourn.`,
          curiousCaptainsCollectSuchClumsyClues: "Curious captains collect such clumsy clues.",
          locketAtTheBridge: "Locket at the Bridge",
          "5thSummaryChapterContaining18PriorTurns": `5th Summary Chapter Containing 18 Prior Turns

Day 14. The pawnbroker sells the locket''s description to the captain. Elias buys it back with the last of his wages minutes before the watch arrives. On the bridge, Mara tells Elias she saw everything on day 3, and that she has kept the receipt as leverage of her own.`,
          bridgesBearTheBestAndBoldestBargains: "Bridges bear the best and boldest bargains.",
          rooftopConfessions: "Rooftop Confessions",
          "6thSummaryChapterContaining18PriorTurns": `6th Summary Chapter Containing 18 Prior Turns

Day 16. Elias admits the killing was not planned: the duke caught him returning the locket Mara''s mother once pawned. The pair agree to frame the ferryman, then abandon the plan when Mara recognizes his scar.`,
          ghostlyGossipGlidesInBeforeTheGlue: "Ghostly gossip glides in before the glue dries."
        },
        arc1: {
          theMurderAtAshfordManor: "The Murder at Ashford Manor",
          "1stSummaryArcContaining3PriorChapters": `1st Summary ARC Containing 3 Prior Chapters and 54 Prior Turns

Days 3-8. The duke dies, Elias flees with the silver locket, and Mara chooses silence over safety. The captain publicly blames bandits while privately doubting the staff. The pawnbroker becomes the hinge every secret turns on.`,
          anArcOfAlibisBoundAndBeautifully: "An arc of alibis, bound and beautifully shelved."
        },
        files: {
          elias: "Elias",
          theDukeSFormerValetFugitive: "the duke''s former valet, fugitive",
          hidingInTheTanneryLoft: "hiding in the tannery loft",
          quickOverRooftops: "quick over rooftops",
          keepTheLocket: "keep the locket",
          keepMaraOutOfIt: "keep Mara out of it",
          killedTheDukeOnDay3: "killed the duke on day 3",
          mara: "Mara",
          seamstressAtAshfordManor: "seamstress at Ashford Manor",
          publiclyMourningPrivatelyBargaining: "publicly mourning, privately bargaining",
          leverageOverElias: "leverage over Elias",
          leaveTheCity: "leave the city",
          theCaptain: "The Captain",
          leadsTheCityWatch: "leads the city watch",
          publiclyBacksTheBanditTheory: "publicly backs the bandit theory",
          reopenTheStaffInterviewsQuietly: "reopen the staff interviews quietly",
          ashfordManor: "Ashford Manor",
          theDukeSSeatSealedByThe: "the duke''s seat, sealed by the watch, dark except the study lamp",
          theBridge: "The Bridge",
          whereEliasAndMaraTradeTruths: "where Elias and Mara trade truths",
          theSilverLocket: "The Silver Locket",
          backInEliasSCoat: "back in Elias''s coat",
          tiesEliasToTheStudyOnDay: "ties Elias to the study on day 3",
          trustsHerWithHisLifeNotHis: "trusts her with his life, not his reasons",
          day3SheSawHimFlee: "day 3: she saw him flee",
          day14SheRevealedSheKeptThe: "day 14: she revealed she kept the receipt",
          carriesItEverywhereBoughtItBackTwice: "carries it everywhere, bought it back twice",
          doubtsHerBanditStoryLacksProof: "doubts her bandit story, lacks proof",
          silenceAboutTheMurderUneasySinceThe: "silence about the murder, uneasy since the bridge",
          day3: "day 3",
          theDukeOfAshfordIsKilledIn: "The Duke of Ashford is killed in his study",
          eliasFleesWithTheLocket: "Elias flees with the locket",
          day5: "day 5",
          maraTellsTheCaptainSheSawBandits: "Mara tells the captain she saw bandits",
          day8: "day 8",
          thePawnbrokerRaisesHisPriceForSilence: "The pawnbroker raises his price for silence",
          eliasRunsOutOfMoney: "Elias runs out of money",
          day11: "day 11",
          eliasEscapesTheTannerySearchDropsA: "Elias escapes the tannery search, drops a crested glove",
          day14: "day 14",
          maraRevealsSheKeptThePawnbrokerS: "Mara reveals she kept the pawnbroker''s receipt",
          theDukeSMurder: "The duke''s murder",
          theCaptainSBanditTheoryIsPublic: "The captain''s bandit theory is public cover while he reworks the staff interviews.",
          aCrestedGloveIsInTheWatch: "a crested glove is in the watch''s evidence box",
          thePawnbrokerKeptAReceipt: "the pawnbroker kept a receipt",
          leavingTheCity: "Leaving the city",
          maraWantsOutBeforeTheInterviewsResume: "Mara wants out before the interviews resume, Elias will not leave the locket.",
          unexplainedScarOnTheFerrymanSHand: "unexplained scar on the ferryman''s hand",
          theCityWatch: "The City Watch",
          answersToTheMagistrateNotTheCrown: "answers to the magistrate, not the crown",
          funeralCustomBarsArrestsDuringMourningBells: "funeral custom bars arrests during mourning bells",
          mourningCustoms: "Mourning customs",
          halfBlackWornForAWeekBy: "half-black worn for a week by anyone the deceased employed",
          eliasKilledTheDuke: "Elias killed the duke",
          banditsDidIt: "bandits did it",
          maraKeepsThePawnbrokerSReceiptSewn: "Mara keeps the pawnbroker''s receipt sewn in her sleeve",
          herLeverageIfEliasRunsAlone: "her leverage if Elias runs alone",
          human: "human",
          careful: "careful",
          sentimental: "sentimental",
          observant: "observant",
          steady: "steady",
          estate: "estate",
          landmark: "landmark",
          heirloom: "heirloom",
          bond: "bond",
          owns: "owns",
          suspects: "suspects",
          pact: "pact"
        },
        profile: {
          default: "Default"
        },
        buildFixture: {
          theAshfordCase: "The Ashford Case",
          elias: "Elias",
          lumiBooksTheAshfordCase: "LumiBooks - The Ashford Case",
          storyteller: "Storyteller",
          memoriaIsWritingAChapter13kt: "Memoria is writing a chapter (~1.3kt written, ~0.8kt thought, 24s)",
          noTokenWithin60sTheProviderMay: "No token within 60s, the provider may be slow or unreachable",
          theAshfordCaseVol1: "The Ashford Case, Vol. 1"
        },
        fixtureBusyFiling: {
          memoriaIsFilingAChapter2s: "Memoria is filing a chapter (2s)"
        }
      },
      seal: {
        memoriaSprite: {
          memoria: "Memoria"
        },
        runeButton: {
          value: "◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇"
        },
        renderSealPanel: {
          lessonsFromMemoria: "Lessons from Memoria",
          welcomeTutorial: "Welcome Tutorial",
          hiUserIMTeachingATutorial: "Hi user! I''m teaching a tutorial on LumiBooks, you''ll have to attend (˶ᵔ ᵕ ᵔ˶)",
          resumeTheLesson: "Resume the Lesson",
          takeLessonFromMemoria: "Take Lesson from Memoria",
          sitTheExam: "Sit the Exam",
          tenQuestionsFromTheCourse9Of: "Ten questions from the course. 9 of 10 graduates you.",
          skipForNow: "Skip for now",
          progressSavedAtSection: "Progress saved at section {sec}."
        },
        renderGrumpySkip: {
          hmphFine: "Hmph. Fine.",
          skipIfYouMustButYouHad: "Skip if you must. But you had better not go asking my creator for help before taking my course (¬`‸´¬) A reminder will wait for you on Home.",
          fineTeachMe: "Fine, Teach Me",
          skipAnyway: "Skip anyway"
        },
        updateSealBusy: {
          abort: "Abort",
          lastAttemptFailed: "Last {kind} attempt failed",
          retry: "Retry"
        },
        previewTiles: {
          characters: "Characters",
          "240Tokens": "~240 tokens",
          locations: "Locations",
          "90Tokens": "~90 tokens",
          things: "Things",
          "50Tokens": "~50 tokens",
          relations: "Relations",
          "170Tokens": "~170 tokens",
          timeline: "Timeline",
          "160Tokens": "~160 tokens",
          threads: "Threads",
          "120Tokens": "~120 tokens",
          lore: "Lore",
          "110Tokens": "~110 tokens",
          secrets: "Secrets"
        },
        renderCodexTabLock: {
          example: "example",
          theKnowledgeCodex: "The Knowledge Codex",
          aStoryBibleAnAgentKeepsFor: "A story bible an agent keeps for you: characters, relations, timeline, threads, secrets. Take the lesson first to use this module."
        },
        renderCodexPaneLock: {
          sealedUntilTheLesson: "Sealed until the lesson",
          theCodexSettingsUnlockWhenYouFinish: "The Codex settings unlock when you finish The Archivist''s Codex. The final step is flipping this very pane on."
        },
        codexSealCard: {
          takeALessonFromMemoria: "Take a Lesson from Memoria",
          skipForNow: "Skip for now"
        },
        renderCodexGrumpySkip: {
          hmphFine: "Hmph. Fine.",
          skipIfYouMustTheCodexUnlocks: "Skip if you must (¬`‸´¬) The Codex unlocks, but the agent stays off until you enable it in Tuning. A reminder will wait for you on Home.",
          fineTeachMe: "Fine, Teach Me",
          skipAnyway: "Skip anyway"
        }
      }
    },
    modals: {
      booksWarning: {
        thisChatHasNoFiledChaptersYet: "No filed chapters. Fast modes would read raw messages. Use Home > File all first.",
        theUnfiledTailOfThisChatIs: "Many messages remain unfiled. The final pass will still read them raw. Use Home > File all first."
      },
      requestCodexUpdate: {
        messageAreWaitingAboutPassesAtThe: "{codexBacklog0} message{codexBacklog02, plural, one {} other {s}} waiting (~{codexBacklogPasses} passes). Choose a catch-up mode."
      },
      requestCodexRebuild: {
        rebuildTheCodex: "Rebuild the Codex",
        memoriaWillEraseTheStoryBibleAnd: "Clears the Codex and rereads {total} messages (~{passes} slow passes). Choose a rebuild mode."
      },
      requestCodexTidy: {
        tidyCodexToATargetSize: "Tidy Codex to a target size",
        currentSelectedContentTokensFrozenFilesAre: "Selected: {choice, select, yes {~} other {}}{toLocaleString} tokens. Excludes frozen files; keeps locked content.",
        targetUnit: "Target unit",
        percentageToKeep: "Percentage to keep",
        tokens: "Tokens",
        memoriaAims10BelowYourLimitChecks: "Targets 10% below your limit, with up to six model calls including repairs. Percentages set how much to keep: 50% targets 45%. Undo restores the original Codex. Locks or model output may prevent reaching the limit.",
        theTokenizerIsUnavailableForThisModel: " Tokenizer unavailable; sizes are estimates.",
        cancel: "Cancel"
      },
      start: {
        startTidy: "Start tidy"
      },
      refresh: {
        keepThisPercentage: "Keep this percentage",
        maximumTokens: "Maximum tokens",
        chooseATargetBelowTheCurrentSize: "Choose a target below the current size.",
        yourLimitTokensModelTargetWithMargin: "Limit: {toLocaleString} tokens. Model target: {toLocaleString2} tokens.",
        enterAValidTarget: "Enter a valid target."
      },
      showCodexCatchupModal: {
        theCodexIsFarBehind: "Codex backlog",
        value: "×",
        close: "Close",
        automationIsOnSoFastAndUltra: "With automation on, fast modes update chapters and arcs first.",
        fastAndUltraFastNeedTheCodex: "Fast modes need a Codex context at least as large as the story model''s.",
        value2: "⚠ {booksWarning}",
        slow: "Slow",
        notRecommendedReplaysEveryRawMessageWindow: "Reads raw messages in windows. Can take hours.",
        fast: "Fast",
        replayTheFiledSummariesThenOneRaw: "Reads filed summaries, then remaining raw messages",
        ultraFast: "Ultra fast",
        oneSinglePassOverTheFiledSummaries: "Reads filed summaries and remaining raw messages in a pass"
      },
      paragraphs: {
        ultraFastReadsTheStorySCurrent: "Reads summaries and remaining raw messages together. Fastest, with the least detail.",
        fastReplaysYourFiledChapterSummariesPass: "Reads chapter summaries in batches, then remaining raw messages. Faster than slow mode.",
        slowReplaysEveryRawMessageWindowBy: "Reads raw messages in windows. Most detailed; long chats can take hours.",
        theCodexAgentAskedYourModelTo: "The model returned text instead of tool calls. The model or provider may not support them.",
        memoriaCanSwitchTheCodexToJson: "JSON mode uses text replies and doesn''t need tool support. Replies are validated, but can be less reliable than tool calls.",
        youCanChangeThisAnytimeUnderTuning: "Change Use tool calls in Tuning > Connection > Codex, or choose a connection that supports tools."
      },
      showCodexToolsHintModal: {
        toolCallsArenTGettingThrough: "No tool calls returned",
        value: "×",
        close: "Close",
        donTShowThisAgain: "Don''t show this again",
        keepToolCalls: "Keep tool calls",
        switchToJsonMode: "Switch to JSON mode"
      },
      openEditModal: {
        label: "Label",
        content: "Content",
        cancel: "Cancel",
        save: "Save"
      },
      labelInput: {
        label: "Label"
      },
      r: {
        delete: "Delete",
        cancel: "Cancel"
      },
      showDryRunModal: {
        dryRun: "Dry run: {choice, select, yes {Arc} other {{choice2, select, yes {Volume} other {{choice3, select, yes {Codex} other {Chapter}}}}}}",
        value: "×",
        closeDryRun: "Close dry run",
        diagnostics: "Diagnostics",
        copyJson: "Copy JSON",
        copied: "Copied",
        copyFailed: "Copy failed"
      },
      promptForString: {
        cancel: "Cancel",
        ok: "OK"
      }
    },
    promptBreakdown: {
      timer: {
        promptBreakdownTimedOutTryRefreshingThe: "Prompt breakdown timed out. Try refreshing the panel."
      },
      clearPromptRequests: {
        promptPanelClosed: "Prompt panel closed."
      }
    },
    summaryTransfer: {
      draw: {
        summaryTransferInProgress: "Summary transfer in progress…",
        continueSummaryImportExport: "Continue summary import/export",
        summaryImportExport: "Summary import / export",
        attemptMatching: "Attempt Matching",
        letMeSpecify: "Let me specify",
        upUntilWhichMessageShouldTheseSummaries: "Which message should coverage end at?",
        thisChatHasMessagesCountFrom1: "This chat has {messageCount0} messages. Use 0 to import as inherited memories. Otherwise, summaries merge into an entry covering messages 1–N, keeping their text.",
        importSummaries: "Import summaries",
        dismiss: "Dismiss",
        cancelImport: "Cancel import",
        hide: "Hide"
      },
      choose: {
        processingSummaryImport: "Processing summary import…"
      }
    },
    tabMeta: {
      appTabs: {
        home: "Home",
        books: "Books",
        codex: "Codex",
        tuning: "Tuning",
        info: "Info"
      }
    },
    tabs: {
      aboutTab: {
        hero: {
          memoria: "Memoria"
        },
        renderAboutTab: {
          memoriaTheLumiBooksLibrarian: "Memoria, the LumiBooks librarian",
          nyandereCatgirlInAMaidUniformBlack: "Nyandere catgirl that tries to make sure your stories don't blow up your model, and your wallet.",
          builtOnLumiverseSpindleWithPromptsAnd: "Inspired by SillyTavern Memory Books."
        },
        ack: {
          acknowledgements: "Acknowledgements"
        },
        sec: {
          memoriaSAcademy: "Memoria''s Academy",
          privateDiagnostics: "Private diagnostics"
        },
        renderAcademy: {
          bothCoursesLiveHereForRetakesPer: "Courses open for review."
        },
        courseCard: {
          completedAttempt: "Completed{choice, select, yes { by {signedName}} other {}}, {attempts} attempt{attempts, plural, one {} other {s}}.",
          inProgressSection: "In progress, section {section1}.",
          lockedBehindNothingButYourTimeThis: "Locked behind your efforts. Complete to enable Codex.",
          theMandatoryPrimer: "The mandatory tutorial.",
          viewDiploma: "View diploma",
          retakeCourse: "Retake course",
          leaveAnytimeTheCourseStaysCompletedOn: "Leave anytime~",
          resume: "Resume",
          start: "Start",
          sitTheExam: "Sit the Exam",
          value: "{i1}. {title}{choice, select, yes { ◇} other { ◆}}",
          hasSilverOrSkippedStampsRetakeTo: "Retake the course to aim for gold",
          allGold: "All gold"
        },
        renderDiagnostics: {
          turnOffLocalLogsThisIsNot: "Turn off local logs. This isn''t recommended",
          tracksUiFailuresNavigationRequestsFilingCoverage: "Tracks UI failures, navigation, requests, filing, coverage, forks and context decisions, timestamps, message numbers, error codes, bundle locations and pseudonymous IDs. Excludes chat/summary text, prompts, reasoning, names, form values, URLs, credentials and unannonymized errors.",
          exportDiagnostics: "Export diagnostics",
          clearDiagnostics: "Clear diagnostics"
        }
      },
      booksTab: {
        subtabs: {
          shelf: "Shelf",
          compose: "Compose",
          advanced: "Advanced"
        },
        draw: {
          openAChatToBrowseMemoriaS: "Open a chat to view summaries"
        },
        sec: {
          theShelf: "The Bookshelf",
          pickMessagesForAChapter: "Pick messages for a chapter",
          bindChaptersIntoAnArc: "Bind chapters into an arc",
          pressArcsIntoAVolume: "Press arcs into a volume",
          maintenance: "Maintenance",
          bind: "Bind {tierNamesTier1}",
          summaryExportAndImport: "Summary export and import"
        },
        renderShelf: {
          emptyShelfForNowMemoriaWillStart: "No summaries yet."
        },
        search: {
          searchTitlesAndSummaries: "Search titles and summaries..."
        },
        groups: {
          volumes: "Volumes",
          arcs: "Arcs",
          chapters: "Chapters"
        },
        buildGroups: {
          of: "{title} ({length} of {length2})",
          noMatch: "No match"
        },
        toggle: {
          showRecentOnly: "Show recent only",
          showAllShown: "Show all {length} ({length2} shown)"
        },
        renderEntryRow: {
          ghost: "GHOST",
          t: "{range} · {contentTokens}t"
        },
        tokenStr: {
          tokens: "{formatTokens}→{contentTokens} tokens",
          tokens2: "{contentTokens} tokens"
        },
        renderEntryDetail: {
          ghostNotYetInjected: "ghost, not yet injected",
          memoria: "Memoria: {shortComment}",
          edit: "Edit",
          edit2: "Edit {kind, select, chapter {chapter} arc {arc} volume {volume} series {series} saga {saga} library {library} universe {universe} codex {Codex} other {{kind}}}",
          editThisEntrySLabelAndContent: "Edit label and content",
          regenerate: "Regenerate",
          resummarizeTheSameSources: "Resummarize the same sources",
          release: "Release",
          stripTheLumiBooksMarkerSoTheEntry: "Convert to a regular lorebook entry",
          delete: "Delete"
        },
        ok: {
          regenerate: "Regenerate?",
          memoriaWillResummarizeTheSameSourcesAnd: "Resummarizes the same sources and replaces this entry on success.",
          releaseToLorebook: "Release to lorebook?",
          memoriaWillHandThisEntryToYour: "Converts this to a regular lorebook entry with an [orphaned] prefix. Detatches it from LumiBooks. {freed}",
          delete: "Delete?",
          memoriaWillDropThisGhostChapterShe: "Deletes this ghost chapter. Its messages will be summarized again later.",
          higherTierMemoriesKeepCoveringTheseSources: "Higher-tier memories keep covering these sources.",
          memoriaWillLetThoseMessagesBackInto: "Its messages return to the prompt.",
          itsChaptersReviveAndKeepCoveringThose: "Its chapters reactivate and keep covering these messages.",
          itsSourceSummariesReviveAndKeepCovering: "Its source summaries reactivate and keep covering these messages.",
          rebuildTheShelf: "Rebuild the shelf?",
          memoriaWillDeleteEveryChapterArcAnd: "Deletes this chat''s summaries and re-summarizes from the start. Can''t be undone.",
          wipeTheShelf: "Wipe the shelf?",
          memoriaWillDeleteEveryChapterArcAnd2: "Deletes this chat''s summaries and returns messages to the prompt. Can''t be undone."
        },
        freed: {
          higherTierMemoriesKeepCoveringTheseSources: "Higher-tier memories keep covering these sources.",
          itsMessagesReturnToThePromptUnless: "Its messages return to the prompt unless a higher tier still covers them.",
          itsChaptersReviveAndKeepCoveringThose: "Its chapters reactivate and keep covering these messages.",
          itsSourceSummariesReviveAndKeepCovering: "Its source summaries reactivate and keep covering these messages."
        },
        renderChapterPicker: {
          pickUncompressedMessagesAndFileThemInto: "Select messages to summarize. ✓ marks messages already filed.",
          shiftClickOrLongPressSelectsA: "Shift-click or long-press selects a range",
          pickUncompressed: "Pick uncompressed",
          clear: "Clear"
        },
        filterSel: {
          uncompressedOnly: "Uncompressed only",
          allMessages: "All messages",
          alreadyFiled: "Already filed"
        },
        query: {
          search: "Search..."
        },
        compressBtn: {
          compress: "Compress"
        },
        excludeBtn: {
          exclude: "Exclude",
          toggleExclusionForTheSelectedMessagesExcluded: "Toggles compression for selected messages. Excluded messages stay in context."
        },
        syncControls: {
          selectedTokensBefore: "{size} selected (~{formatTokens} tokens before)"
        },
        buildRows: {
          noMessagesMatch: "No messages match"
        },
        more: {
          showOlder: "Show older ({older})"
        },
        buildMessageRow: {
          shiftClickOrLongPressOnTouch: "Shift+click (or long-press on touch) to select a range",
          value: "#{indexInChat1}",
          alreadyFiledIntoAChapterArcOr: "Already filed into a chapter, arc, or volume",
          value2: "✓",
          excludedNeverHiddenReplacedOrSummarized: "Excluded - never hidden, replaced, or summarized",
          value3: "⊘",
          hiddenInChat: "Hidden in chat",
          empty: "(empty)"
        },
        renderArcPicker: {
          memoriaHasNotFiledAnyChaptersYet: "No chapters yet",
          value: "{slice}{range} - {tokenStr}",
          bindSelected: "Bind selected",
          selectAllActive: "Select all active",
          clear: "Clear"
        },
        updateArcCounts: {
          selectedTokensBefore: "{size} selected (~{formatTokens} tokens before)"
        },
        range: {
          msgs: " (msgs {firstMsgIdx1}-{lastMsgIdx1})"
        },
        renderVolumePicker: {
          memoriaHasNoUnboundArcsToPress: "No unbound arcs",
          aVolumeReplacesItsSourceArcsIn: "Volumes replace covered arcs in the prompt. Configure automation in Tuning.",
          value: "{slice}{range} - {tokenStr}",
          pressSelected: "Press selected",
          selectAllActive: "Select all active",
          clear: "Clear"
        },
        updateCounts: {
          selectedTokensBefore: "{size} selected (~{formatTokens} tokens before)"
        },
        renderContinuity: {
          t: "[{tag}] {slice} ({contentTokens}t)"
        },
        originName: {
          anImportedLorebook: "an imported lorebook"
        },
        wrap: {
          noOtherChatHasMemoriesToInherit: "No chats with summaries to inherit",
          inheritedFromMemor: "Inherited from {originName}: {rootEntryCount} memor{rootEntryCount, plural, one {y} other {ies}}.",
          detachRoot: "Detach root",
          removeTheInheritedRootMemoriesFromThis: "Remove the inherited root memories from this chat",
          detachInheritedMemories: "Detach inherited memories?",
          memoriaWillRemoveTheInheritedMemoriesFrom: "Removes inherited memories. Keeps this chat''s chapters and arcs.",
          thisChatAlreadyHasItsOwnMemories: "This chat has summaries. Rebuilding replaces them, then re-summarizes with the chosen root.",
          seedThisChatWithAnotherChatS: "Inherit another chat''s summaries. They inject before the greeting until bound into newer summaries.",
          sourceChatToInheritMemoriesFrom: "Source chat to inherit memories from",
          pickASourceChat: "Pick a source chat...",
          rebuildFrom: "Rebuild from...",
          replacesThisChatSMemoriesWithThe: "Replace summaries using the chosen root",
          rebuildFromRoot: "Rebuild from root?",
          memoriaWillDeleteThisChatSExisting: "Deletes this chat''s chapters and arcs, adds the chosen root, then re-summarizes. Can''t be undone.",
          rebase: "Rebase",
          seedThisChatWithTheChosenChat: "Inherit the selected chat''s summaries"
        },
        renderMaintenance: {
          repairToolsForWhenTheShelfAnd: "Repair message visibility after changes such as editing lorebook entries.",
          reHideCovered: "Re-hide covered",
          reApplyTheExcludeFromContextFlag: "Exclude covered messages from context",
          resyncVisibility: "Resync visibility",
          unhideMessagesWhoseChapterOrArcNo: "Match message visibility to summary coverage",
          rebuildBooks: "Rebuild books",
          wipeTheShelfAndReSummarizeThis: "Clear summaries and re-summarize from the start",
          wipeBooks: "Wipe books",
          deleteEveryLumiBooksEntryForThisChat: "Delete this chat''s LumiBooks summaries"
        },
        renderHigherPickers: {
          bindSelected: "Bind selected",
          bindReadyBatches: "Bind ready batches",
          activeSourceEntriesReadyBatchesUseThis: "{length} active source entries. Ready batches use this tier''s threshold and lag from Tuning."
        },
        renderSummaryTransfer: {
          exportTheActiveShelfWithRawMessage: "Export summaries. This export is chat-aware.",
          exportSummaries: "Export summaries",
          importSummaries: "Import summaries",
          readingSummaryFile: "Reading summary file…",
          couldNotReadThatLorebookJsonFile: "Couldn''t read the lorebook JSON file"
        },
        entryFallback: "{kind, select, chapter {chapter} arc {arc} volume {volume} series {series} saga {saga} library {library} universe {universe} codex {Codex} other {{kind}}} {id}"
      },
      codexTab: {
        deliverCodexFileState: {
          couldnTSaveThisCategorySSetting: "Couldn''t save this category''s setting: {error}"
        },
        subtabs: {
          overview: "Overview",
          entities: "Entities",
          relations: "Relations",
          timeline: "Timeline",
          threads: "Threads",
          lore: "Lore",
          secrets: "Secrets",
          manage: "Manage"
        },
        entityGroups: {
          characters: "Characters",
          locations: "Locations",
          things: "Things"
        },
        staleDraftAbort: {
          memoriaRewroteThatRecordWhileYouWere: "Record changed during editing. Reapply your edit to the new version."
        },
        empty: {
          knowledgeCodex: "Knowledge Codex"
        },
        renderCodexTab: {
          openAChatToConsultTheCodex: "Open a chat to view the Codex",
          memoriaIsFetchingTheCodexFiles: "Loading Codex…"
        },
        sec: {
          knowledgeCodex: "Knowledge Codex",
          storyBible: "Story Bible",
          entities: "Entities",
          relations: "Relations",
          timeline: "Timeline",
          threads: "Threads"
        },
        search: {
          searchThisSection: "Search this section..."
        },
        bibleTiles: {
          characters: "Characters",
          locations: "Locations",
          things: "Things",
          relations: "Relations",
          timeline: "Timeline",
          threads: "Threads",
          lore: "Lore",
          secrets: "Secrets"
        },
        bits: {
          memoriaWillDeleteEveryRecordInFor: "Deletes the records in {label} for this chat."
        },
        purgeMessage: {
          referencesToThemInOtherRecordsBecome: "References to them in other records become plain text.",
          theResolvedThreadArchiveClearsToo: "Also clears the resolved thread archive.",
          thisCannotBeUndone: "Can''t be undone."
        },
        tileStateLabel: {
          injectedUpdated: "injected · updated",
          notInjectedStillUpdated: "not injected · still updated",
          frozenNoUpdates: "frozen · no updates"
        },
        renderOverview: {
          codexOnFile: "Codex on file",
          noCodexYet: "no Codex yet",
          messageUnindexed: "{codexBacklog} message{codexBacklog, plural, one {} other {s}} unindexed",
          updated: "updated {codexLastRunAt}",
          theCodexAgentIsOffForThis: "Codex is off. Enable it in Tuning > Settings > Codex.",
          memoriaIsWorkingOnTheCodexWatch: "Codex task in progress. View progress in Home.",
          unreadableOnDiskRebuildCodexRegeneratesThem: "Can''t read: {join}. Use Rebuild Codex to regenerate.",
          noCodexYet2: "No Codex yet.",
          clearStaleTags: "Clear stale tags",
          acceptTheCurrentRecordsAsUpTo: "Marks records as up to date without changing text or indexing. No model call. Frozen records can become stale again after missed updates.",
          recordMissedUpdatesWhileFrozen: "{length} record{length, plural, one {} other {s}} missed updates while frozen.",
          catchUp1Pass: "Catch up (1 pass)",
          onePassRebuildsJustTheReEnabled: "Rebuilds re-enabled records from summaries and recent messages",
          rebuildInstead: "Rebuild instead",
          wipeEverythingAndRegenerateFromTheStart: "Clear Codex and regenerate from the start",
          clickARecordCardToCycleIt: "Click a card to cycle: injected → not injected → frozen. Records remain editable.",
          shorterAndSimplerChatsOftenRunBetter: "Fewer categories may suit simpler chats.",
          updateNow: "Update now",
          consumeEverythingUpToTheNewestMessage: "Update through the newest message, ignoring window and lag. Offers fast modes for large backlogs.",
          cancel: "Cancel",
          abortTheCodexTaskInFlight: "Cancel the Codex task",
          tidyUp: "Tidy up",
          chooseATargetSizeThenCompactUp: "Shorten records to a target size, using up to six model calls",
          undo: "Undo {codexUndoReasonUpdate}",
          undo2: "Undo",
          rollBackToTheSnapshotTakenBefore: "Restore the snapshot before the last Codex change",
          nothingToUndoYetMemoriaSnapshotsThe: "No snapshot to restore"
        },
        ok: {
          rebuildTheCodex: "Rebuild the Codex?",
          memoriaWillEraseTheStoryBibleAnd: "Clears the Codex and rereads the chat. Choose a speed next.",
          undoTheLastCodexChange: "Undo the last Codex change?",
          memoriaWillRollTheCodexBackTo: "Restores the snapshot before {codexUndoReasonUpdate} {codexUndoAt}. Later changes are lost.",
          importACodexFile: "Import a Codex file?",
          memoriaWillReplaceEveryCodexFileIn: "Replaces this chat''s Codex with the imported files. Can''t be undone.",
          wipeTheCodex: "Wipe the Codex?",
          memoriaWillEraseEveryCodexRecordFor: "Clears this chat''s Codex. The next update starts fresh. Can''t be undone.",
          rebuildThisRecord: "Rebuild this record?",
          memoriaWillRegenerateEveryRecordInFrom: "Regenerates {label} from the story in a pass. Replaces content on success; keeps locked entries.",
          purgeThisRecord: "Purge this record?",
          deleteEntity: "Delete entity?",
          memoriaWillRemoveFromTheCodexReferences: 'Deletes "{str}". References to it become plain text.',
          delete: "Delete?"
        },
        renderManage: {
          noOtherChatHasACodexTo: "No chats with a Codex to copy",
          carriedOverFromMemoriaIndexesThisChat: "Copied from {codexRootOriginName}. Indexing starts from this chat''s beginning.",
          detachCodex: "Detach Codex",
          eraseTheCarriedOverCodexFromThis: "Erase the carried-over Codex from this chat",
          detachTheCarriedOverCodex: "Detach the carried-over Codex?",
          codexRecordsMergeAsMemoriaWorksSo: "Copied records have merged with this chat''s Codex. Detaching clears it; the next update starts fresh. Can''t be undone.",
          continuingAnEarlierChatCarryItsStory: "Copy a Codex to continue an earlier chat.",
          sourceChatToCarryTheCodexFrom: "Source chat to carry the Codex from",
          pickASourceChat: "Pick a source chat...",
          carryCodexOver: "Carry Codex over",
          copyAnotherChatSCodexIntoThis: "Copy another chat''s Codex into this one",
          carryTheCodexOver: "Carry the Codex over?",
          memoriaWillCopyTheChosenChatS: "Copies the selected chat''s Codex. Indexing starts from this chat''s beginning.",
          exportWritesEveryCodexFileAndIts: "Export saves Codex files and injection settings as JSON. Import replaces them.",
          export: "Export",
          downloadEveryCodexFilePlusItsInject: "Download Codex files and injection settings as JSON",
          import: "Import",
          replaceThisChatSCodexFromAn: "Replace this chat''s Codex from an exported file",
          rebuildReReadsTheWholeChatFrom: "Rebuild clears and rereads the chat. Wipe leaves the Codex empty until the next update.",
          rebuildCodex: "Rebuild Codex",
          wipeAndRegenerateTheWholeStoryBible: "Clear Codex and regenerate from the start",
          wipeCodex: "Wipe Codex"
        },
        files: {
          codexFiles: "Codex files"
        },
        danger: {
          startOver: "Start over"
        },
        restoreBackup: {
          memoriaCouldnTReadThatBackupFile: "Couldn''t read the backup file"
        },
        renderBibleTile: {
          clickToCycle: "{tileStateLabelSt}{choice, select, yes { · missed updates while frozen} other {}}{choice2, select, yes { · waiting for the catch-up pass} other {}} - click to cycle",
          tokens: "{choice, select, yes {~} other {}}{formatTokens} tokens",
          stale: " · stale",
          needsCatchUp: " · needs catch-up",
          clickToCycle2: "{tileStateLabelSt} - click to cycle"
        },
        tidyBtn: {
          cancel: "Cancel",
          tidy: "Tidy",
          abortTheCodexTaskInFlight: "Cancel the Codex task",
          chooseATargetSizeForThisRecord: "Choose a target size for this record"
        },
        rebuildBtn: {
          rebuild: "Rebuild",
          regenerateJustThisCategoryFromTheWhole: "Regenerate this category from the story in a pass"
        },
        purgeBtn: {
          purge: "Purge",
          deleteEveryRecordInThisCategoryAt: "Delete this category''s records"
        },
        sheetStateTitle: {
          memoriaMaintainsThisSheetClickToLock: "Updated automatically. Click to freeze.",
          frozenAndStillInjectedClickToHold: "Frozen and injected. Click to exclude from the prompt.",
          frozenAndHeldOutOfThePrompt: "Frozen from the prompt. Click to resume updates."
        },
        sheetStateLabel: {
          state: "{locked, select, yes {🔒} other {🔓}} {injected, select, yes {injected} other {not injected}} · {locked, select, yes {frozen} other {updated}}"
        },
        renderEntities: {
          clickANameToOpenItsSheet: "Click a name to edit.",
          of: "{title} · {length} of {length2}",
          value: "+ {singular, select, character {character} location {location} thing {thing} other {{singular}}}",
          noEntitiesRecordedYetAddOneOr: "No entities yet. Add an entity or run a Codex update."
        },
        input: {
          name: "Name...",
          true: "true",
          false: "false"
        },
        renderAddForm: {
          create: "Create",
          cancel: "Cancel"
        },
        renderEntityCard: {
          notInjected: "not injected",
          locked: "locked",
          editSheet: "Edit sheet",
          delete: "Delete"
        },
        addKv: {
          lockedFieldMemoriaCanNeverChangeIt: "Locked from model edits"
        },
        renderEntityForm: {
          newEntity: "New entity",
          cancel: "Cancel"
        },
        sync: {
          locked: "🔒 locked",
          lockedMemoriaReadsALockMarkerInstead: "Locked from model edits. Click to unlock.",
          lockThisFieldSoOnlyYouCan: "Lock from model edits"
        },
        nameField: {
          name: "Name"
        },
        w: {
          commaSeparated: "{f} (comma separated)"
        },
        label: {
          onePerLine: "{key} (one per line)"
        },
        saveBtn: {
          saving: "Saving...",
          save: "Save",
          theEntityNeedsAName: "The entity needs a name"
        },
        renderRecordForm: {
          saving: "Saving...",
          save: "Save",
          cancel: "Cancel"
        },
        recordItemActions: {
          edit: "Edit",
          delete: "Delete"
        },
        saveRelationDraft: {
          theGroupNeedsAtLeastTwoMembers: "The group needs at least two members, a kind, and a state",
          theRelationNeedsFromToAKind: "The relation needs From, To, a kind, and a state"
        },
        specs: {
          type: "Type",
          pairAB: "pair (a → b)",
          group: "group",
          membersCommaSeparatedRefs: "Members (comma separated refs)",
          charEliasCharWren: "char:elias, char:wren",
          fromA: "From (a)",
          charElias: "char:elias",
          toB: "To (b)",
          charWren: "char:wren",
          kind: "Kind",
          bondOwnsAtRival: "bond, owns, at, rival...",
          state: "State",
          lovesHerHidesIt: "loves her, hides it",
          historyOnePerLine: "History (one per line)",
          day12SheSawHimKill: "day 12: she saw him kill"
        },
        form: {
          editRelation: "Edit relation",
          newRelation: "New relation"
        },
        renderRelations: {
          list: "List",
          graph: "Graph",
          relation: "+ Relation",
          noRelationsRecordedYetAddOneOr: "No relations yet. Add a relation or run a Codex update.",
          theRelationsTableIsOffForThis: "Relations table is off. Relationships are stored as entity ties.",
          memoriaWillRemoveThisRelationFromThe: "Deletes this relation.",
          noRelationMatchesTheSearch: "No relation matches the search"
        },
        arrowSpan: {
          value: "→"
        },
        renderRelationGraph: {
          noRelationMatchesTheSearch: "No relation matches the search",
          noRelationsToChartYet: "No relations to chart yet",
          group: " group",
          value: "{name} ({id})",
          zoomOut: "Zoom out",
          zoomIn: "Zoom in",
          fit: "Fit",
          frameTheWholeWeb: "Fit graph",
          tapAnEdgeForTheStoryTap: "Tap a connection for details or a diamond for its sheet. Drag diamonds to rearrange. Pinch or drag to navigate."
        },
        entries: {
          character: "character",
          location: "location",
          thing: "thing"
        },
        saveEventDraft: {
          theEventNeedsAWhenAndWhat: "Enter when the event happened and what happened"
        },
        eventSpecs: {
          when: "When",
          day12: "day 12",
          event: "Event",
          maraSeesEliasKillTheDuke: "Mara sees Elias kill the duke",
          participantsCommaSeparatedRefs: "Participants (comma separated refs)",
          where: "Where",
          locAshfordManor: "loc:ashford_manor",
          causes: "Causes",
          sheFleesTheCity: "she flees the city"
        },
        renderTimeline: {
          event: "+ Event",
          newEvent: "New event",
          noEventsRecordedYet: "No events recorded yet",
          noEventMatchesTheSearch: "No event matches the search",
          editEvent: "Edit event",
          clickForEditAndDelete: "Edit or delete",
          showRecentOnly: "Show recent only",
          showEarlier: "Show earlier ({lengthTimelineRecent})"
        },
        actions: {
          memoriaWillRemoveThisEventFromThe: "Deletes this event.",
          memoriaWillRemoveThisTopicAndIts: "Deletes this topic and its facts.",
          memoriaWillRemoveThisSecretFromThe: "Deletes this secret."
        },
        threadSpecs: {
          name: "Name",
          theStolenCrown: "The stolen crown",
          status: "Status",
          open: "open",
          stalled: "stalled",
          resolved: "resolved",
          abandoned: "abandoned",
          summary: "Summary",
          latestDevelopment: "Latest development",
          plantedDetailsOnePerLine: "Planted details (one per line)"
        },
        saveThreadDraft: {
          theThreadNeedsANameAndA: "The thread needs a name and a summary"
        },
        renderThreads: {
          thread: "+ Thread",
          editSeeds: "Edit seeds",
          newThread: "New thread",
          seedsOnePerLine: "Seeds (one per line)",
          noOpenStorylinesTrackedYet: "No open threads",
          resolvedThreadsStayHereAsYourArchive: "Resolved threads are archived and excluded from prompts.",
          editThread: "Edit thread",
          latest: "Latest: {latest}",
          planted: "◆ planted: {p}",
          memoriaWillRemoveThisThreadFromThe: "Deletes this thread.",
          noThreadMatchesTheSearch: "No thread matches the search",
          seeds: "Seeds ({length})"
        },
        saveWorldDraft: {
          theTopicNeedsANameAndAt: "Enter a topic name and a fact"
        },
        saveKnowledgeDraft: {
          theSecretNeedsItsFact: "Enter the secret''s fact"
        },
        worldSpecs: {
          topic: "Topic",
          magic: "Magic",
          factsOnePerLine: "Facts (one per line)",
          bloodMagicCostsMemories: "blood magic costs memories",
          keywordsCommaSeparatedRetrievalTags: "Keywords (comma separated, retrieval tags)",
          ritualMemoriesBloodMagic: "ritual, memories, blood magic"
        },
        knowledgeSpecs: {
          fact: "Fact",
          eliasKilledTheDuke: "Elias killed the duke",
          knownByCommaSeparatedRefs: "Known by (comma separated refs)",
          hiddenFromCommaSeparatedRefs: "Hidden from (comma separated refs)",
          falseBeliefsOnePerLineWhoBelief: 'False beliefs (one per line, "who => belief")',
          charCaptainBanditsDidIt: "char:captain => bandits did it",
          note: "Note",
          keywordsCommaSeparatedRetrievalTags: "Keywords (comma separated, retrieval tags)",
          murderDaggerDuke: "murder, dagger, duke"
        },
        world: {
          worldRules: "World rules"
        },
        renderLore: {
          topic: "+ Topic",
          newTopic: "New topic",
          noWorldLoreRecordedYet: "No world lore recorded yet",
          noTopicMatchesTheSearch: "No topic matches the search",
          editTopic: "Edit topic",
          clickForEditAndDelete: "Edit or delete",
          keywords: "keywords: {join}"
        },
        secrets: {
          whoKnowsWhat: "Who knows what"
        },
        renderSecrets: {
          secret: "+ Secret",
          newSecret: "New secret",
          noSecretsOrAsymmetricKnowledgeTrackedYet: "No secrets recorded",
          noSecretMatchesTheSearch: "No secret matches the search",
          editSecret: "Edit secret",
          clickForEditAndDelete: "Edit or delete",
          knows: "knows: {nameOf}",
          hidden: "hidden: {nameOf}",
          wronglyBelieves: "{nameOf} wrongly believes: {str}",
          keywords: "keywords: {join}"
        },
        entityFields: {
          kind: "kind",
          role: "role",
          significance: "significance",
          appearance: "appearance",
          description: "description",
          notes: "notes",
          aliases: "aliases",
          traits: "traits",
          goals: "goals",
          ties: "ties",
          keywords: "keywords"
        },
        threadStatus: "{status, select, open {open} stalled {stalled} resolved {resolved} abandoned {abandoned} other {{status}}}"
      },
      homeTab: {
        buildStreamPanel: {
          liveFromMemoriaSDesk: "Live output",
          value: "✕",
          closeTheLiveView: "Close the live view",
          waitingForTheFirstTokensFromThe: "Waiting for model output…"
        },
        lessonReminder: {
          takeALesson: "Take a Lesson"
        },
        renderHomeTab: {
          myLessonIsStillWaitingForYou: "My lesson is still waiting for you",
          theCodexLessonIsStillWaitingFor: "The Codex lesson is still waiting for you",
          openAChatAndMemoriaWillSet: "Open a chat to use LumiBooks"
        },
        empty: {
          overview: "Overview",
          noBookYet: "No book yet"
        },
        hostGroups: {
          promptBlocks: "Prompt blocks",
          chatHistory: "Chat history",
          longTermMemory: "Long-term memory",
          worldInfo: "World info",
          sidecar: "Sidecar",
          extensions: "Extensions",
          system: "System"
        },
        groups: {
          promptBlocks: "Prompt blocks",
          chatHistory: "Chat history",
          worldInfo: "World info",
          extensions: "Extensions"
        },
        renderLessonPromptPanel: {
          tokens: "{label} · {tokens} tokens",
          promptVsContextWindow: "Prompt vs context window",
          value: "{formatTokens} / {formatTokens2} ({round}%)",
          simulatedExampleTheLivePanelReadsYour: "Simulated example, the live panel reads your host''s real prompt."
        },
        sec: {
          thePrompt: "The Prompt",
          overview: "Overview",
          pendingPreviews: "Pending previews ({length})",
          actions: "Actions"
        },
        simulate: {
          simulate: "Simulate",
          assembleTheNextPromptThroughTheHost: "Preview the next prompt without generating"
        },
        drawPromptContent: {
          readingTheLastFire: "Loading last prompt…",
          memoriaIsAskingTheHostForThe: "Loading prompt breakdown…",
          couldnTReadTheHostPrompt: "Couldn''t read the host prompt",
          noPromptDataYet: "No prompt data yet",
          tokens: "{label} · {tokens} tokens",
          freeSpaceTokens: "Free space · {formatTokens} tokens",
          promptVsContextWindow: "Prompt vs context window",
          promptTotal: "Prompt total",
          tokens2: "{totalTokens} tokens",
          contextNearlyFull: "context nearly full",
          value: "{tokens} · {pct}%",
          freeSpace: "Free space",
          value2: "{formatTokens} · {pct}%"
        },
        retry: {
          retry: "Retry"
        },
        srcLabel: {
          lastFire: "last prompt",
          simulatedNextFire: "next prompt preview"
        },
        spineLabel: {
          knowledgeCodex: "Knowledge Codex",
          inAVolume: "in a volume",
          inASeries: "in a series",
          inASaga: "in a saga",
          inALibrary: "in a library",
          inAUniverse: "in a universe",
          inAnArc: "in an arc",
          inAChapter: "in a chapter",
          stagedAsGhost: "staged as ghost"
        },
        where: {
          msgs: "msgs {from1}–{to1} · "
        },
        renderSpine: {
          tokens: "{where}{kind} · ~{tokens} tokens{choice, select, yes { (click to open)} other {}}"
        },
        renderBreakdown: {
          knowledgeCodexConstantPart: "Knowledge Codex (constant part)",
          volumesAndHigher: "Volumes and higher ({length})",
          arcs: "Arcs ({length})",
          chapters: "Chapters ({length})",
          uncompressedTailMsgs: "Uncompressed tail ({tailCount} msgs)",
          excludedMsgs: "Excluded ({excludedCount} msgs)",
          codexCountsIncludeEnabledConstantLorebookEntries: "Codex keyword and vector matches can add additional tokens.",
          storyContextInThePrompt: "Story context in the prompt"
        },
        renderOverview: {
          chat: "Chat",
          character: "Character",
          filed: "Filed",
          ofMsgs: "{coveredMessages} of {totalMessages} msgs",
          shareOfThisChatSMessagesAlready: "Chat messages covered by summaries",
          tail: "Tail",
          msgsUncompressed: "{uncoveredMessages} msgs uncompressed",
          recentMessagesStillInThePromptAt: "Messages still in context, waiting for summary window and lag",
          codex: "Codex",
          messagesTheStoryBibleHasNotRead: "Messages not yet indexed by the Codex",
          offEnableInTuning: "off, enable in Tuning",
          memoriaHasNoConnectionToWriteWith: "No connection available. Add a connection in Lumiverse.",
          pickAConnectionInTheTuningTab: "Select a connection in Tuning."
        },
        shelfTile: {
          shelf: "Shelf",
          volArcChap: "vol · arc · chap",
          uncompressedSummariesHoverForExistingHigherTiers: "Active summaries. Hover for higher tiers."
        },
        locked: {
          codex: "Codex",
          takeALesson: "take a lesson",
          theKnowledgeCodexUnlocksAfterMemoriaS: "The Knowledge Codex unlocks after Memoria''s Codex lesson"
        },
        subText: {
          msgsUnindexedManualOnly: "msgs unindexed, manual only",
          msgsUnindexed: "msgs unindexed",
          updated: "updated {codexLastRunAt}",
          noCodexYet: "no Codex yet"
        },
        watchBtn: {
          hide: "Hide",
          watch: "Watch",
          seeMemoriaSRawOutputStreamIn: "View model output"
        },
        abortBtn: {
          abort: "Abort",
          cancelTheInFlightGeneration: "Cancel generation"
        },
        renderFailure: {
          lastArcAttemptFailed: "Last arc attempt failed",
          lastAttemptFailed: "Last {kind, select, chapter {chapter} arc {arc} volume {volume} series {series} saga {saga} library {library} universe {universe} codex {Codex} other {{kind}}} attempt failed",
          lastChapterAttemptFailed: "Last chapter attempt failed",
          triedX: "{message} (tried {retriedTimes}x)",
          retry: "Retry"
        },
        titleField: {
          title: "Title"
        },
        contentField: {
          content: "Content"
        },
        renderPreviewCard: {
          memoria: "Memoria: {shortComment}",
          tokens: "{tokenCountOutput} tokens",
          save: "Save",
          discard: "Discard"
        },
        renderActions: {
          lagReady: "lag ready",
          lagBuilding: "lag building",
          windowReady: "window ready",
          windowBuilding: "window building",
          chapterReady: "{backlogChapters} chapter{backlogChapters, plural, one {} other {s}} ready",
          arcReady: "{backlogArcs} arc{backlogArcs, plural, one {} other {s}} ready",
          fileChapter: "File chapter",
          compressTheOldestUncoveredMessagesIntoA: "Summarize the oldest uncovered messages, even if the window isn''t full",
          fileAll: "File all ({backlogChapters})",
          drainTheChapterBacklogKeepsFilingChapters: "File chapters until window or lag limits are reached",
          bindArc: "Bind arc",
          rollTheOldestUnsupersededChaptersIntoA: "Combine the oldest active chapters into an arc",
          bindAll: "Bind all ({backlogArcs})",
          drainTheArcBacklogKeepsBindingArcs: "Bind arcs until threshold or lag limits are reached",
          updateCodex: "Update Codex",
          consumeEverythingUpToTheNewestMessage: "Update through the newest message, ignoring window and lag. Offers fast modes for large backlogs.",
          actionsUnlockWhenMemoriaFinishesHerCurrent: "Wait for the current task to finish",
          theExtensionIsOffFlipItOn: "Extension is off. Enable it in Tuning.",
          memoriaWillCreateThisChatSWorld: "The lorebook is created when the first chapter is filed",
          worldBookWhereChaptersAndArcsAre: "This chat''s summary lorebook"
        },
        lockedBtn: {
          codexTakeALesson: "🔒 Codex · take a lesson",
          theCodexUnlocksAfterMemoriaSCodex: "The Codex unlocks after Memoria''s Codex lesson"
        },
        tag: {
          bookReady: "Book ready"
        },
        streamStatus: "{running, select, yes {streaming} other {finished}}",
        higherCount: "{count} {kind, select, chapter {chapter} arc {arc} volume {volume} series {series} saga {saga} library {library} universe {universe} codex {Codex} other {{kind}}}"
      },
      profileTab: {
        profileDefaults: {
          defaults: "Defaults"
        },
        sec: {
          knowledgeCodex: "Knowledge Codex",
          codexConnection: "Codex connection",
          reset: "Reset",
          profile: "Profile",
          summarySettings: "Summary settings",
          summaryConnection: "Summary Connection",
          summarySamplers: "Summary samplers",
          codexSamplers: "Codex samplers",
          regex: "Regex",
          context: "Context",
          behavior: "Behavior"
        },
        renderCodexSettings: {
          enableCodex: "Enable Codex",
          window: "Window",
          lag: "Lag",
          unit: "{kind} unit",
          messages: "Messages",
          messageTokens: "Message tokens",
          tokensBreakpoint: "Tokens breakpoint",
          runsWhenEitherTheWindowOrThis: "Runs when either the window or this token count is reached.",
          loreLimit: "Lore limit",
          ofMaxContext: "% of max context",
          tokenCap: "token cap",
          loreTokens0NoLimit: "Lore tokens (0 = no limit)",
          loreOfMaxContext: "Lore % of max context",
          yourActivatedLorebookEntriesRideEveryCodex: "Includes lorebook entries as context. Entries that exceed the budget are skipped. A token cap of 0 removes the limit.",
          codexRecall: "Codex recall",
          theActiveProfileSetsRecallForEnabled: "Timeline and threads are always constantly injected, but other records can use constant, keyword, or vector recall.",
          codexPlacement: "Codex placement",
          lorebookBefore: "Lorebook (before)",
          atHistoryDepth: "At history depth",
          afterChatHistory: "After chat history",
          depthFromNewestTurn: "Depth from newest turn",
          summariesReplaceTheirSourceHistoryInPlace: "Summaries inject in-place of messages whereas the Codex is injected as normal lorebook entries. Larger windows reduce update frequency and can be cheaper. Codex lore placement after history preserves more cache, assuming earlier lorebooks are constant.",
          relationsTable: "Relations table",
          tracksConnectionsBetweenEntitiesAsOneShared: "Stores relationships in a shared table with reference checks. When off, stores them in entities.",
          thoroughMode: "Thorough mode",
          spendsOneExtraVerificationRoundPerUpdate: "Adds a verification round to check stale information and shorten records.",
          extraContextMode: "Extra context mode",
          summarizesChaptersEarlyAtTheCodexLag: "Creates ghost chapters early at the Codex lag. They help provide summary context to Codex.",
          chaptersProvided: "Chapters provided",
          howManyRecentChapterSummariesExtraContext: "Recent chapters included as context in extra context mode.",
          theCodexAgentSConnectionAndSamplers: "Codex connection and samplers are in Connection > Codex."
        },
        updating: {
          codexUpdating: "Codex Updating"
        },
        connOpts: {
          sameAsSummaryConnection: "Same as Summary Connection",
          value: "{name} - {provider}{choice, select, yes {/{model}} other {}}{choice2, select, yes { (default)} other {}}"
        },
        renderCodexConnection: {
          useToolCalls: "Use tool calls",
          offByDefaultTheAgentWritesOne: "Off uses JSON replies. Enable if your connection supports tool calls.",
          updateDelivery: "Update delivery",
          allRecordsAtOnce: "Batched",
          oneRecordAtATime: "Sequential",
          memoriaAlwaysMakesSureEveryRecordIs: "Batched updates cost less. Only use sequential if long replies are problematic."
        },
        renderResetSettings: {
          resetsThisProfileSSettingsToTheir: "Resets this profile''s settings to their defaults."
        },
        idle: {
          resetProfileToDefaults: "Reset profile to defaults"
        },
        confirm: {
          clickAgainToConfirm: "Confirm?"
        },
        renderProfilePicker: {
          new: "New",
          delete: "Delete",
          enabled: "Enabled",
          masterSwitchWhenOffMemoriaDoesNothing: "Enable LumiBooks for this account."
        },
        name: {
          newProfileName: "New profile name"
        },
        nameField: {
          profileName: "Profile name"
        },
        enableWrap: {
          extension: "Extension"
        },
        renderSummarySettings: {
          windowLagAndCompressionSettingsForEach: "Window, lag, and compression per tier.",
          runAutomation: "Enable Automation",
          windowUnit: "Window unit",
          messages: "Messages",
          messageTokens: "Message tokens",
          window: "Window",
          lagUnit: "Lag unit",
          lag: "Lag",
          chapterEntries: "Chapter entries",
          summaryTokens: "Summary tokens",
          manualOnly: "Manual only",
          entries: "{tierNamesTier2} entries"
        },
        card: {
          chapterFiling: "Chapter Filing",
          binding: "{name} Binding"
        },
        appendAutomationControls: {
          automate: "Automate?"
        },
        change: {
          targetUnit: "{prefix}TargetUnit",
          targetPercent: "{prefix}TargetPercent",
          targetTokens: "{prefix}TargetTokens"
        },
        appendCompressionTarget: {
          compressionTarget: "Compression target",
          percentOfInput: "Percent of input",
          fixedTokens: "Fixed tokens",
          targetTokens: "Target tokens",
          targetPercent: "Target percent"
        },
        opts: {
          defaultConnection: "Default connection",
          noConnectionsAvailable: "No connections available",
          value: "{name} - {provider}{choice, select, yes {/{model}} other {}}{choice2, select, yes { (default)} other {}}"
        },
        renderConnection: {
          memoriaWritesWith: "Connection: {name}"
        },
        renderSamplers: {
          usedWhenMemoriaWritesChaptersArcsAnd: "Used for summaries. Empty fields use the defaults shown as placeholders. Temperature, max output, and max input are sent; top_p, top_k, and penalties are sent when set.",
          maxInputTokens: "Max input tokens",
          maxOutputTokens: "Max output tokens",
          temperature: "Temperature",
          topP: "Top P",
          topK: "Top K",
          freqPenalty: "Freq penalty",
          presPenalty: "Pres penalty"
        },
        options: {
          books: "Books",
          codex: "Codex"
        },
        renderCodexSamplers: {
          samplersForTheCodexAgentOnlySeparate: "Codex samplers, separate from summaries. Empty fields use Codex defaults.",
          maxInputTokens: "Max input tokens",
          maxOutputTokens: "Max output tokens",
          temperature: "Temperature",
          topP: "Top P",
          topK: "Top K",
          freqPenalty: "Freq penalty",
          presPenalty: "Pres penalty"
        },
        renderRegex: {
          noRegexScriptsFoundInLumiverse: "No regex scripts found in Lumiverse",
          outgoingRunsOnThePromptBeforeMemoria: "Outgoing regex runs on prompts; incoming runs on model output."
        },
        outgoing: {
          outgoing: "Outgoing"
        },
        incoming: {
          incoming: "Incoming"
        },
        f: {
          chapterContext: "Chapter context"
        },
        renderContext: {
          howManyRecentChaptersToFeedMemoria: "Recent chapters included as context.",
          triesPerAttemptAfterTheLastTry: "Tries per attempt. After failure, the same messages retry next turn.",
          howLongMemoriaWaitsForTheFirst: "Wait time for the first streamed token."
        },
        retry: {
          retries: "Retries"
        },
        ttft: {
          firstTokenTimeoutSeconds: "First-token timeout (seconds)"
        },
        renderBehavior: {
          hideMessagesOnceFiled: "Hide messages once filed",
          greysOutCoveredMessagesInTheChat: "Greys out covered messages in chat. Summary coverage applies either way.",
          previewBeforeSaving: "Preview before saving",
          memoriaStagesNewChaptersAndArcsIn: "Review chapters and arcs in Home > Pending previews before saving."
        }
      },
      promptsTab: {
        categorySubtabs: {
          chapter: "Chapter",
          arc: "Arc",
          volume: "Volume",
          codex: "Codex"
        },
        groupHelp: {
          oneBlockPerCodexFile: "One block per Codex file.",
          howTheAgentIsToldToDeliver: "Edit delivery instructions. Selected by the Use tool calls setting.",
          theTaskTextForEachKindOf: "Task instructions by run type.",
          warningsPrependedOnlyWhenTheirSituationApplies: "Notes included when applicable."
        },
        sec: {
          codexPromptTemplates: "Codex prompt templates",
          memoriaOverrides: "Memoria overrides",
          arcPrompt: "Arc prompt",
          volumePrompt: "Volume prompt",
          codexDirectives: "Codex directives",
          chapterPrompt: "Chapter prompt",
          importStmbPresets: "Import STMB presets",
          info: "Info"
        },
        draw: {
          everyOtherBlockOfTheCodexAgent: 'Additional Codex prompt blocks, saved in the "{displayName}" preset. Switching presets changes the prompt set. Read How To before editing.',
          otherBlocksOfTheCodexAgentS: "Additional Codex prompt blocks for this preset.",
          templateCustomizedInThisPreset: "{overridden} template{overridden, plural, one {} other {s}} customized in this preset."
        },
        renderTemplateRow: {
          customized: "customized",
          hostMacrosLikeUserAlsoWorkThey: "Supports host macros such as '{{user}}', resolved when sent.",
          builtInPresetDuplicateItAboveTo: "Built-in preset, duplicate it above to edit this template."
        },
        howBtn: {
          hideHowTo: "Hide How To",
          howTo: "How To"
        },
        resetBtn: {
          resetToDefault: "Reset to default",
          clickAgainToConfirm: "Confirm?"
        },
        renderMemoriaOverrides: {
          personaIsTheSystemPromptHeaderShort: "Persona sets the system-prompt header. Short-comment rules fill '{{memoria_short_comment_rules}}'.",
          memoriaPersona: "Memoria persona",
          memoriaShortCommentRules: "Memoria short-comment rules"
        },
        buildOverrideBlock: {
          resetToDefault: "Reset to default",
          clickAgainToConfirm: "Confirm?"
        },
        restoreIdle: {
          resetToDefault: "Reset to default"
        },
        renderCategory: {
          theMissionBlockAtTheTopOf: "Instructions at the start of the Codex system prompt. Saved with the templates below in the selected preset. Preview assembled prompts with Dry run.",
          newBlankPrompt: "New blank prompt",
          duplicateToNew: "Duplicate to new",
          duplicateToEdit: "Duplicate to edit",
          dryRun: "Dry run",
          assembleTheNextCodexRunSComplete: "Preview resolved system and user prompts. No model call.",
          assembleThisPresetSPromptWithAll: "Preview this preset''s resolved prompt. No model call.",
          delete: "Delete",
          promptBuiltInDuplicateToEdit: "Prompt (built-in, duplicate to edit)"
        },
        opts: {
          builtIn: "Built-in: {displayName}",
          custom: "Custom: {displayName}"
        },
        name: {
          nameForNewPrompt: "Name for new {category} prompt",
          untitled: "Untitled",
          nameForDuplicate: "Name for duplicate"
        },
        sourceName: {
          untitled: "Untitled"
        },
        ok: {
          deletePrompt: "Delete prompt?",
          thisRemovesTheCustomPromptAndFalls: "Deletes this custom prompt and selects the built-in default.",
          deletePreset: "Delete preset?"
        },
        nameField: {
          displayName: "Display name"
        },
        textField: {
          prompt: "Prompt"
        },
        renderImport: {
          uploadASillyTavernMemoryBooksExportMemoria: "Import a SillyTavern Memory Books export as editable presets.",
          importChapterPresets: "Import chapter presets",
          importArcPresets: "Import arc presets",
          delete: "Delete",
          noCustomPresetsYet: "No custom presets yet"
        },
        importFile: {
          memoriaCanTReadThisFile: "Couldn''t read the file",
          memoriaCouldnTParseThePresetJson: "Invalid preset JSON"
        },
        showImportFailure: {
          importFailed: "Import failed",
          ok: "OK"
        },
        lines: {
          duplicateAnyBuiltInOrCreateNew: "Duplicate a built-in preset or create a custom preset to edit.",
          promptsMustAskTheModelForStrict: "Prompts must ask the model for strict JSON (examples below).",
          targetTokensExpandsToTheActiveCompression: "'{{target_tokens}}' expands to the active compression target.",
          memoriaShortCommentRulesExpandsToThis: "'{{memoria_short_comment_rules}}' expands to this turn''s nyandere short-comment rules.",
          promptsAreMacroEvaluated: "Prompts are macro-evaluated."
        },
        groups: {
          fileSchemas: "File schemas",
          writeProtocol: "Write protocol",
          passInstructions: "Pass instructions",
          runNotes: "Run notes"
        }
      },
      tuningTab: {
        subtabs: {
          connection: "Connection",
          settings: "Settings",
          prompts: "Prompts"
        },
        renderTuningTab: {
          profile: "Profile",
          extensionOff: "· extension off",
          switchOrManageProfilesInTheConnection: "Switch or manage profiles in the Connection pane"
        },
        options: {
          books: "Books",
          codex: "Codex"
        },
        sec: {
          everywhere: "Everywhere"
        },
        renderGlobalSettings: {
          theseApplyToEveryChatAndProfile: "Account settings for chats and profiles.",
          automationToasts: "Automation toasts",
          whenOffMemoriaSBackgroundRunsStay: "Show notifications for automatic tasks. Errors and manual actions still notify.",
          summaryRecall: "Summary recall",
          appliesToExistingAndFutureChapterAnd: "Applies to existing and future summaries across chats. Summary coverage stays unchanged. Keyword and vector modes include matching summaries; vector recall falls back to keywords if no recent text is visible.",
          lorebookNamesFollowChatNames: "Lorebook names follow chat names",
          turnOffToRenameYourBooksAnd: "Turn off to rename Books and Codex lorebooks in Lumiverse. Turn on to restore chat-based names at the next sync."
        }
      }
    },
    common: {
      messageCount: "{count} msgs",
      compactRole: "{role, select, user {USER} assistant {ASSI} system {SYST} tool {TOOL} other {{fallback}}}",
      role: "{role, select, user {user} assistant {assistant} system {system} tool {tool} other {{role}}}",
      compactTokens: "{tokens}t",
      compactTokenChange: "{before}t→{after}t"
    }
  },
  guides: {
    codex: {
      markdown: `# The Knowledge Codex

Models lose facts, muddle timelines, and drift out of character as the context grows and overflows. Researchers have measured these failure modes in long-run roleplay: fact loss, timeline confusion, and persona drift ([ARPM, 2026](https://arxiv.org/pdf/2605.14802), [PCL](https://arxiv.org/html/2503.17662v1), [CloneMem](https://arxiv.org/pdf/2601.07023)).

LumiBooks already fights this partially with compression. Memoria files your chat into chapters, binds chapters into arcs, and presses arcs into volumes.

In short, these summaries answer *what happened* in chronological order. The main problem with pure summarization is that you are relying on the summary capturing all hierarchical, high value information like entity relationships or details. This is hard to do as you compress further, therefore, you need explicit tracking.

This is what knowledge Codex solves.

## What it is

The Codex is a story bible for chats. As your story grows, an agent reads every new turn, and updates a small set of records:

- **Characters, Locations, and Things.** Entity sheets are the backbone of most story systems, from hierarchical screenwriting to structured story generation ([Dramatron](https://arxiv.org/pdf/2209.14958), [Narrative Planning](https://arxiv.org/pdf/1401.3841), [Decomposed Screenwriting](https://arxiv.org/html/2510.23163v1)).
- **Relationships.** A shared table that describes the relationships and trajectories between entities. Research on narrative knowledge graphs shows relations must be tracked as they evolve rather than as static snapshots ([Iyyer et al., NAACL 2016](https://aclanthology.org/N16-1180/), [Narrative Graph](https://www.researchgate.net/publication/370272383_Narrative_Graph_Telling_Evolving_Stories_Based_on_Event-centric_Temporal_Knowledge_Graph), [Relation Clustering](https://www.researchgate.net/publication/346475960_Relation_Clustering_in_Narrative_Knowledge_Graphs)). This table is optional as it is difficult for some models to maintain.
- **Timeline.** A dated record of major events. Timeline confusion is one of the most common failure modes, and a maintained timeline is the classic defense ([ARPM](https://arxiv.org/pdf/2605.14802), [narrative dimensions](https://arxiv.org/pdf/2604.10786), [event relation extraction](https://arxiv.org/pdf/2106.08629)).
- **Threads.** Open/stalled storylines, and the details planted for later payoff. Explicit thread and outline state is what keeps plots coherent over thousands of words ([DOC](https://arxiv.org/pdf/2212.10077), [Writing Path](https://arxiv.org/html/2404.13919v1), [plot structure management](https://www.sciencedirect.com/science/article/pii/S1875952123000459)).
- **World.** The rules of your setting (Magic systems, factions, geography, lore, facts true of the world itself). Important for narrative depth ([KG-guided storytelling](https://arxiv.org/html/2505.24803v2), [KG + literary theory](https://arxiv.org/pdf/2508.03137), [hierarchical story KGs](https://arxiv.org/html/2506.10008v1)).
- **Knowledge and secrets.** Who knows what. Models improve greatly when memory is limited to what each character actually witnessed, and belief tracking is where LLMs are shit ([perspective-bounded memory](https://arxiv.org/pdf/2606.25632), [MREval](https://aclanthology.org/2026.findings-acl.1175/), [ToMATO, AAAI 2025](https://ojs.aaai.org/index.php/AAAI/article/view/32143), [EnigmaToM](https://arxiv.org/pdf/2503.03340)).

## Why these records?

These are either proven failure modes or a mechanism shown to improve long-form coherence. A story bible must be functional and minimal while maintaining the high information content that is prone to being compressed and lost. ([Generative Agents](https://arxiv.org/abs/2304.03442), [MemGPT](https://arxiv.org/abs/2310.08560), [MemoryBank, AAAI 2024](https://arxiv.org/abs/2305.10250)).

Some things other trackers keep were left out on purpose:

- **Numeric affection and trust meters.** Some research shows relationships benefit more from trajectories vs scores ([Narrative Graph](https://www.researchgate.net/publication/370272383_Narrative_Graph_Telling_Evolving_Stories_Based_on_Event-centric_Temporal_Knowledge_Graph)). A number like affection 62 is pseudo-precision an LLM can interpret in arbitrary ways. "Loves her, hides it, betrayed on day 12" carries far more information. We track this as relationships.
- **Per-turn scene state.** Who is standing where, current weather, momentary moods, etc. The uncompressed tail of your chat already shows the present scene, so tracking it twice is not needed and would need to be updated every turn.
- **Possession ledgers, personality drift logs, faction standing matrices.** Each extra table multiplies the agent''s upkeep and adds a place for old data to accumulate and relationships to track. Significant objects already live as Things, lasting character change belongs on the sheet itself, and pivotal shifts go in the timeline as events.
- **Verbatim dialogue.** Potentially in the future, could track dialogues. idk.

## How it works

Every so often, on a schedule you control, LB hands a slice of your story to a lightweight agent along with the current records and some context of the past. The agent then does three things:

1. **Update.** Rewrite every section the story has outdated.
2. **Sweep.** Verify nothing stale survived.
3. **Compress.** Strip bloat and prose, duplicate info, verbosity.

You can edit the records yourself in the new and beautiful glass UI.

## How it reaches the prompt

The Codex is not injected as one always-on block. Each record is mirrored into a dedicated per-chat lorebook named \`LumiBooks Codex [Do Not Edit] - <chat>\`, and the host''s native lorebook activation decides what enters the prompt:

- **Entities, world topics, and secrets** use the three-way **Codex recall** control in Tuning → Settings → Codex: **Always**, **Keywords** (the default), or **Vector + keywords**. The agent writes a \`keywords\` list alongside each record (names, aliases, and participants match automatically). Vector mode also retrieves records by meaning through Lumiverse''s lorebook search.
- **Timeline and threads** are constant entries as keyword matching doesn''t make as much sense here.

Vector recall requires a tested embedding connection and lorebook vectorization enabled in Lumiverse. Existing records are queued for indexing when you switch modes; new and edited records follow the same setting. Until indexing finishes, or when retrieval is unavailable or there is no visible recent text for a query, keyword matching remains available. Disabled records and files stay excluded. Lumiverse controls retrieval limits and the embedding provider; Codex files remain the source of truth.

Chapter and higher-tier summaries have a separate **Summary recall** control in Tuning → Settings → Books → Everywhere. Its default is **Always**. Selecting memories never changes which messages are filed or hidden. In the same section, turn off **Lorebook names follow chat names** before manually renaming either managed lorebook in Lumiverse.

The mirror book is rewritten by LumiBooks often, so don''t edit it by hand. Edit records in the Codex tab (or the JSON files) instead.

## For extension developers

LumiBooks publishes the Codex to Spindle''s shared RPC pool. Read it from any extension backend:

\`\`\`ts
// Full snapshot: all 8 files as parsed JSON, plus per-file states.
const snap = await spindle.rpcPool.read(\`lumi_books.codex.$'{'chatId'}'\`);
// snap: '{' chatId, userId, files: '{' characters, locations, things, relations,
//         timeline, threads, world, knowledge '}', fileStates, runs, updatedAt '}'

// The whole Codex rendered as one text block. Note LumiBooks itself no longer
// injects this block: records reach the prompt as lorebook entries (see
// "How it reaches the prompt"), so this is a convenience view for consumers.
const text = await spindle.rpcPool.read(\`lumi_books.codex.$'{'chatId'}'.rendered\`);

// Change signal: the most recent Codex mutation across all chats.
const evt = await spindle.rpcPool.read("lumi_books.codex_updated");
// evt: '{' chatId, userId, changedFiles, reason: "run"|"tidy"|"edit"|"states"|"wipe", updatedAt '}'
\`\`\`

Notes:

- Endpoints appear after the first Codex activity of a session. \`read\` rejects before that, so wrap it in a try/catch.
- A wiped Codex publishes \`null\` at both chat endpoints.
- \`fileStates\` marks files the user switched off (\`noInject\`) or froze (\`frozen\`). The \`rendered\` text already excludes them. If you consume \`files\` directly, respect these flags.
- \`lumi_books.latest_chapter\`, \`lumi_books.latest_arc\`, and \`lumi_books.latest_volume\` carry the summary events and were already published.
`
    }
  },
  promptBreakdown: {
    assembledTranscript: "Assembled transcript"
  }
};

// src/i18n/index.ts
var DEFAULT_LOCALE = "en";
function lookup(catalog, key) {
  let value = catalog;
  for (const part of key.split(".")) {
    if (!value || typeof value === "string" || !Object.hasOwn(value, part))
      return;
    value = value[part];
  }
  return typeof value === "string" ? value : undefined;
}
function createTranslator(locale = DEFAULT_LOCALE, catalogs = {}) {
  let language;
  try {
    language = Intl.getCanonicalLocales(locale)[0] ?? DEFAULT_LOCALE;
  } catch {
    language = DEFAULT_LOCALE;
  }
  const chain = [...new Set([language, language.split("-")[0], DEFAULT_LOCALE])];
  const cache = new Map;
  return (key, values = {}) => {
    for (const candidate of chain) {
      const message = lookup(candidate === DEFAULT_LOCALE ? en_default : catalogs[candidate], key);
      if (message === undefined || message === "")
        continue;
      const cacheKey = `${candidate}:${key}`;
      try {
        let formatter = cache.get(cacheKey);
        if (!formatter) {
          formatter = new IntlMessageFormat(message, candidate, undefined, { ignoreTag: true });
          if (cache.size >= 512)
            cache.delete(cache.keys().next().value);
          cache.set(cacheKey, formatter);
        }
        return String(formatter.format(values));
      } catch (error) {
        if (candidate === DEFAULT_LOCALE)
          throw error;
      }
    }
    throw new Error(`Missing English message: ${key}`);
  };
}
var t = createTranslator();

// src/ui/lessons/styles-lessons.ts
var LESSON_STYLES = `
/* ------------------------------------------------------------ rune seal */
.lmb-rune-btn {
  padding: 12px 20px 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  animation: lmb-rune-pulse 3s var(--lmb-ease) infinite;
}
.lmb-rune-ring { display: none; }
@keyframes lmb-rune-pulse {
  0%, 100% { box-shadow: 0 0 10px var(--lmb-frame); text-shadow: 0 0 6px var(--lmb-frame-strong); }
  50% { box-shadow: 0 0 26px var(--lmb-frame-strong); text-shadow: 0 0 14px var(--lmb-frame-strong); }
}

.lmb-memoria-sprite {
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  background: var(--lmb-fill-strong);
  padding: 2px;
  flex: 0 0 auto;
  object-fit: cover;
}

/* ------------------------------------------------------------ seal view */
.lmb-seal-wrap { position: relative; min-height: 420px; }
.lmb-seal-under {
  filter: saturate(0.4) opacity(0.5);
  min-height: 420px;
}
.lmb-seal-panel {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  width: min(430px, 94%);
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-glow-strong), var(--lmb-lift);
  padding: 16px 15px 13px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  z-index: 6;
}
.lmb-seal-hero { display: flex; gap: 11px; align-items: center; }
.lmb-seal-title {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  margin-bottom: 3px;
}
.lmb-seal-pitch { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.5; }
.lmb-seal-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lmb-seal-note { font-size: 10.5px; color: var(--lmb-ink-dim); }
.lmb-seal-busy { display: flex; flex-direction: column; gap: 6px; }
.lmb-seal-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--lmb-danger);
  background: var(--lmb-danger-wash);
  border: 1px solid var(--lmb-danger-frame);
  border-radius: var(--lmb-r);
  padding: 6px 9px;
}

/* ----------------------------------------------------------- codex lock */
.lmb-codex-lock { display: flex; flex-direction: column; gap: 12px; }
.lmb-codex-lock-preview {
  position: relative;
  border: 1px dashed var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 14px 12px 12px;
  overflow: hidden;
}
.lmb-codex-lock-preview::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 6px, transparent 6px 16px);
}
.lmb-codex-lock-watermark {
  position: absolute;
  top: 7px;
  right: 10px;
  font-size: 9.5px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lmb-ink-hint);
  z-index: 1;
}
.lmb-codex-lock-card {
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-glow);
  padding: 14px 13px 12px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.lmb-locked-btn {
  position: relative;
  border-style: dashed;
  opacity: 0.85;
  background: repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 4px, transparent 4px 10px);
}

.lmb-lesson-reminder {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: var(--lmb-wash);
  border: 1px solid var(--lmb-frame);
  border-left: 3px solid var(--lmb-gold);
  border-radius: var(--lmb-r);
  font-size: 11.5px;
  color: var(--lmb-ink);
}

/* --------------------------------------------------------- lesson stage */
.lmb-lesson-stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100dvh - 190px);
  min-height: 430px;
}
.lmb-lesson-head { display: flex; align-items: center; gap: 10px; }
.lmb-lesson-title {
  font-family: var(--lmb-display-font);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-lesson-headlabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-lesson-close {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 15px;
  cursor: pointer;
  padding: 3px 7px;
  border-radius: var(--lmb-r-sm);
}
.lmb-lesson-close:hover { color: var(--lmb-gold); background: var(--lmb-frame-faint); }

.lmb-lesson-rail { display: flex; align-items: center; gap: 9px; padding: 0 2px; min-height: 12px; }
.lmb-rail-node {
  width: 9px;
  height: 9px;
  transform: rotate(45deg);
  border: 1px solid var(--lmb-frame-strong);
  background: transparent;
  border-radius: 1.5px;
  transition: background 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-rail-node.done { background: linear-gradient(135deg, var(--lmb-gold), var(--lmb-metal)); }
.lmb-rail-node.current { box-shadow: 0 0 8px var(--lmb-frame-strong); border-color: var(--lmb-gold); }

.lmb-lesson-demo {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  overflow: hidden;
  background: var(--lmb-void);
}
/* Working replica of the real tab strip: the user navigates the demo with it. */
.lmb-lesson-demostrip {
  flex: 0 0 auto;
  display: flex;
  gap: 2px;
  padding: 4px 5px;
  border-bottom: 1px solid var(--lmb-frame);
  background: var(--lumiverse-bg-deep-080, rgba(20, 17, 28, 0.85));
}
.lmb-demo-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-display-font);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 2px 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease);
}
.lmb-demo-tab-icon { width: 13px; height: 13px; display: inline-block; flex: 0 0 auto; }
.lmb-demo-tab-icon svg { width: 100%; height: 100%; display: block; }
.lmb-demo-tab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-demo-tab.active { color: var(--lmb-gold); background: var(--lmb-wash); }
.lmb-lesson-demo-inner {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.lmb-lesson-demo-root { padding: 12px 10px 24px; }

.lmb-lesson-cover {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
  background: radial-gradient(70% 55% at 50% 42%, var(--lmb-frame-faint), transparent 75%);
}
.lmb-lesson-cover .lmb-memoria-sprite {
  border-radius: 50%;
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-lesson-cover-title {
  font-family: var(--lmb-display-font);
  font-size: 16px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 14px var(--lmb-frame-strong);
}
.lmb-lesson-cover-orn { font-size: 8px; letter-spacing: 0.5em; color: var(--lmb-metal-soft); }
.lmb-lesson-cover-sec {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}

/* ------------------------------------------------------------- diagrams */
.lmb-lesson-diagram {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
  padding: 20px 14px;
}
.lmb-dg-label {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-dg-window {
  width: min(320px, 92%);
  height: 200px;
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  background: var(--lmb-fill-strong);
  box-shadow: var(--lmb-sheen);
  padding: 10px;
  overflow: hidden;
  display: flex;
}
.lmb-dg-window.tall { height: 240px; }
.lmb-dg-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  justify-content: flex-start;
}
.lmb-dg-col.bottom { justify-content: flex-end; }
.lmb-dg-bar {
  position: relative;
  flex: 0 0 auto;
  height: 12px;
  border-radius: 3px;
  background: var(--lmb-fill-hover);
  border: 1px solid var(--lmb-hairline);
  transition: opacity 450ms var(--lmb-ease), transform 450ms var(--lmb-ease), background 450ms var(--lmb-ease);
}
.lmb-dg-bar.in { opacity: 0; transform: translateY(6px) scaleY(0.4); }
.lmb-dg-bar.chapter {
  height: 20px;
  background: linear-gradient(135deg, var(--lmb-wash), var(--lmb-frame-faint));
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-dg-bar.arc {
  height: 24px;
  background: linear-gradient(135deg, var(--lmb-frame), var(--lmb-wash));
  border-color: var(--lmb-metal);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-dg-bar.clipped {
  background: var(--lmb-danger-wash);
  border-color: var(--lmb-danger-frame);
  opacity: 0.3;
}
.lmb-dg-bar.clipped::after {
  content: "✕";
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-58%);
  font-size: 9px;
  color: var(--lmb-danger);
}
.lmb-dg-tag {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--lmb-display-font);
  font-size: 8.5px;
  letter-spacing: 0.16em;
  color: var(--lmb-gold);
}
.lmb-dg-caption {
  min-height: 17px;
  font-size: 11px;
  font-style: italic;
  color: var(--lmb-ink-dim);
  text-align: center;
}
.lmb-dg-tier {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-sm);
  padding: 3px 12px 2px;
  transition: color 400ms var(--lmb-ease), box-shadow 400ms var(--lmb-ease);
}
.lmb-dg-tier.hot { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-dg-card {
  width: min(300px, 90%);
  border: 1px solid var(--lmb-volume-frame);
  border-radius: var(--lmb-r);
  background: var(--lmb-fill);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.lmb-dg-line { height: 8px; border-radius: 2px; background: var(--lmb-fill-hover); }
.lmb-dg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 94%;
}
.lmb-dg-chip {
  font-size: 10px;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  background: var(--lmb-fill);
  padding: 3px 8px;
  transition: opacity 700ms var(--lmb-ease), transform 700ms var(--lmb-ease),
    color 400ms var(--lmb-ease), border-color 400ms var(--lmb-ease);
}
.lmb-dg-chip.gone { opacity: 0.12; transform: scale(0.92); }
.lmb-dg-chips.kept .lmb-dg-chip {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: var(--lmb-frame-faint);
}
.lmb-shimmer { animation: lmb-shimmerflash 350ms var(--lmb-ease); }
@keyframes lmb-shimmerflash {
  0% { box-shadow: inset 0 0 0 1px transparent; }
  40% { box-shadow: inset 0 0 24px var(--lmb-frame-strong); }
  100% { box-shadow: inset 0 0 0 1px transparent; }
}

.lmb-spot-panel {
  position: absolute;
  background: rgba(5, 4, 10, 0.55);
  z-index: 5;
  pointer-events: none;
}
/* Nav funnel: the dim panels swallow clicks so the spotlighted control is the
   only clickable thing. Every other step leaves the whole pane live. */
.lmb-demo-funnel .lmb-spot-panel { pointer-events: auto; }
.lmb-spot-ring {
  position: absolute;
  z-index: 6;
  border: 2px solid var(--lmb-gold);
  border-radius: 7px;
  box-shadow: 0 0 14px var(--lmb-frame-strong), inset 0 0 10px var(--lmb-frame-faint);
  pointer-events: none;
  transition: top 150ms var(--lmb-ease), left 150ms var(--lmb-ease),
    width 150ms var(--lmb-ease), height 150ms var(--lmb-ease);
}
/* Read this, do not click it: dashed, so it never reads as the action. */
.lmb-spot-hint {
  position: absolute;
  z-index: 6;
  border: 1px dashed var(--lmb-gold);
  border-radius: 5px;
  box-shadow: 0 0 8px var(--lmb-frame-faint);
  pointer-events: none;
}
.lmb-demo-funnel .lmb-spot-ring { animation: lmb-nav-pulse 1.5s var(--lmb-ease) infinite; }
@keyframes lmb-nav-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--lmb-frame-strong), inset 0 0 8px var(--lmb-frame-faint); }
  50% { box-shadow: 0 0 26px var(--lmb-frame-strong), inset 0 0 14px var(--lmb-frame); }
}

/* ---------------------------------------------------------- lesson sheet */
.lmb-lesson-sheet {
  flex: 0 0 auto;
  background: var(--lmb-panel-solid);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-sheen), var(--lmb-glow);
  padding: 4px 12px 11px;
  transition: opacity 200ms var(--lmb-ease);
  max-height: 46%;
  overflow-y: auto;
}
.lmb-lesson-sheet.peeking { opacity: 0.15; }
.lmb-lesson-sheet.collapsed .lmb-lesson-sheet-body { display: none; }
.lmb-lesson-grab {
  display: block;
  width: 46px;
  height: 5px;
  margin: 4px auto 7px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: var(--lmb-frame-strong);
  cursor: pointer;
}
.lmb-lesson-row { display: flex; gap: 10px; align-items: flex-start; }
.lmb-lesson-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.lmb-lesson-text { font-size: 12.5px; line-height: 1.55; color: var(--lmb-ink); }
.lmb-lesson-nav { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.lmb-lesson-waiting { font-size: 11px; font-style: italic; color: var(--lmb-ink-hint); }

.lmb-spot-tag {
  position: absolute;
  z-index: 7;
  pointer-events: none;
  background: var(--lmb-void);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-gold);
  font-family: var(--lmb-mono-font);
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 3px 8px 2px;
  box-shadow: var(--lmb-glow);
  max-width: calc(100% - 12px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: top 150ms var(--lmb-ease), left 150ms var(--lmb-ease);
}
.lmb-lesson-exhibit {
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  background: var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-left: 3px solid var(--lmb-metal);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  color: var(--lmb-ink-muted);
}
.lmb-lesson-exhibit.error { border-left-color: var(--lmb-danger); }
.lmb-lesson-exhibit.warn { border-left-color: var(--lmb-warning); }

.lmb-lesson-options { display: flex; flex-direction: column; gap: 6px; }
.lmb-lesson-option {
  text-align: left;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 12px;
  line-height: 1.45;
  padding: 8px 11px;
  cursor: pointer;
  transition: border-color 200ms var(--lmb-ease), background 200ms var(--lmb-ease);
}
.lmb-lesson-option:hover:not(:disabled) { border-color: var(--lmb-frame-strong); background: var(--lmb-frame-faint); }
.lmb-lesson-option:disabled { cursor: default; opacity: 0.75; }
.lmb-lesson-option.correct {
  border-color: var(--lmb-success-frame);
  background: var(--lmb-success-wash);
  color: var(--lmb-ink);
  opacity: 1;
}
.lmb-lesson-option.wrong { border-color: var(--lmb-danger-frame); background: var(--lmb-danger-wash); }
.lmb-lesson-verdict { min-height: 15px; font-size: 11.5px; letter-spacing: 0.04em; }
.lmb-lesson-verdict.ok { color: var(--lmb-gold); }
.lmb-lesson-verdict.miss { color: var(--lmb-ink-dim); }
.lmb-lesson-why { font-size: 11.5px; font-style: italic; color: var(--lmb-ink-muted); line-height: 1.5; }
.lmb-lesson-skip {
  background: transparent;
  border: none;
  color: var(--lmb-ink-hint);
  font-size: 10.5px;
  cursor: pointer;
  text-decoration: underline dotted;
  padding: 3px 4px;
}
.lmb-lesson-skip:hover { color: var(--lmb-ink-muted); }
.lmb-lesson-peek {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-size: 10px;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.lmb-lesson-modal {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.lmb-lesson-modal-card {
  width: min(420px, 100%);
  max-height: 90%;
  overflow-y: auto;
  background: var(--lmb-panel-solid);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ------------------------------------------------------------- register */
.lmb-register { display: flex; flex-direction: column; gap: 9px; max-width: 340px; }

/* -------------------------------------------------------------- diploma */
.lmb-diploma {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 10px;
}
.lmb-diploma-frame {
  width: min(460px, 100%);
  background: var(--lmb-panel-solid);
  border: 2px solid var(--lmb-volume-frame);
  box-shadow: inset 0 0 0 5px var(--lmb-panel-solid), inset 0 0 0 6px var(--lmb-volume-frame), var(--lmb-glow-strong);
  border-radius: 3px;
  padding: 22px 16px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
}
.lmb-diploma-arch {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--lmb-volume);
}
.lmb-diploma-course {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}
.lmb-diploma-grant, .lmb-diploma-line { font-size: 11px; color: var(--lmb-ink-dim); font-style: italic; }
.lmb-diploma-name {
  font-family: var(--lmb-display-font);
  font-size: 24px;
  color: var(--lmb-ink);
  letter-spacing: 0.06em;
}
.lmb-diploma-stamp {
  display: inline-block;
  margin: 6px 0 2px;
  transform: rotate(-8deg);
  border: 2px solid currentColor;
  border-radius: 3px;
  padding: 4px 16px 3px;
  font-family: var(--lmb-display-font);
  font-size: 16px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.lmb-grade-gilded { color: #e8c66a; text-shadow: 0 0 12px rgba(232, 198, 106, 0.5); }
.lmb-grade-silver { color: #c8ccd8; }
.lmb-grade-bronze { color: #c9926a; }
.lmb-grade-apprentice { color: var(--lmb-ink-dim); }
.lmb-diploma-score { font-size: 10.5px; color: var(--lmb-ink-dim); }
.lmb-diploma-seal { display: flex; align-items: center; gap: 9px; margin-top: 4px; }
.lmb-diploma-seal .lmb-memoria-sprite { border-radius: 50%; }
.lmb-diploma-remark { font-size: 11px; font-style: italic; color: var(--lmb-ink-muted); text-align: left; }

.lmb-confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lmb-confetti span {
  position: absolute;
  top: -20px;
  color: var(--lmb-volume);
  animation: lmb-confetti-fall 2.6s ease-in forwards;
}
@keyframes lmb-confetti-fall {
  to { transform: translateY(560px) rotate(240deg); opacity: 0; }
}

/* ------------------------------------------------------------ academy */
.lmb-academy-course {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 10px 11px;
}
.lmb-academy-head { display: flex; align-items: center; gap: 8px; }
.lmb-academy-title { flex: 1; font-weight: 600; font-size: 12px; color: var(--lmb-ink); }
.lmb-academy-grade {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 2px 8px 1px;
  transform: rotate(-4deg);
}
.lmb-academy-sections { display: flex; flex-wrap: wrap; gap: 5px; }
.lmb-academy-section {
  background: transparent;
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-size: 10px;
  padding: 3px 7px;
  cursor: pointer;
}
.lmb-academy-section:hover { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); }

@media (max-width: 600px) {
  .lmb-lesson-stage { height: calc(100dvh - 150px); }
  .lmb-lesson-option { min-height: 40px; font-size: 12.5px; }
  .lmb-lesson-sheet { max-height: 52%; }
  .lmb-seal-panel { top: 24px; }
}
@media (max-width: 430px) {
  .lmb-demo-tab-label { display: none; }
  .lmb-demo-tab-icon { width: 15px; height: 15px; }
}
`;

// src/ui/styles.ts
var STYLES = `
.lmb-load-notice { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 14px; }
.lmb-load-notice[hidden] { display: none; }
.lmb-summary-transfer { padding: 14px; border: 1px solid var(--lmb-frame-strong); background: var(--lmb-panel-solid); border-radius: 8px; }
.lmb-summary-transfer[hidden] { display: none; }
.lmb-summary-transfer label { display: grid; gap: 8px; }
.lmb-summary-transfer p { overflow-wrap: anywhere; }
.lmb-spinner { display: inline-block; width: 16px; height: 16px; flex-shrink: 0; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: lmb-spin 0.8s linear infinite; }
@keyframes lmb-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .lmb-spinner { animation-duration: 2s; } }
/* ---------------------------------------------------------------- tokens */
/* Toasts, modal overlays, and Lumiverse-hosted modal forms mount on
   document.body, outside .lmb-root - tokens are declared on each mount root. */
.lmb-root, .lmb-toast-stack, .lmb-preview-overlay, .lmb-modal-form {
  --lmb-display-font: "Marcellus", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  --lmb-body-font: "Josefin Sans", var(--lumiverse-font-family, -apple-system, "Segoe UI", sans-serif);
  --lmb-mono-font: var(--lumiverse-font-mono, ui-monospace, "Cascadia Mono", "Consolas", monospace);

  --lmb-ink: var(--lumiverse-text, rgba(255, 255, 255, 0.9));
  --lmb-ink-muted: var(--lumiverse-text-muted, rgba(255, 255, 255, 0.65));
  /* Dim/hint carry real content (meta, labels, empty states), so they must
     clear readable contrast; derived from the host ink so themes still flow
     through. The host's own text-dim (0.4a) fails WCAG for body-size text. */
  --lmb-ink-dim: rgba(255, 255, 255, 0.55);
  --lmb-ink-dim: color-mix(in srgb, var(--lumiverse-text, rgba(255, 255, 255, 0.9)) 62%, transparent);
  --lmb-ink-hint: rgba(255, 255, 255, 0.45);
  --lmb-ink-hint: color-mix(in srgb, var(--lumiverse-text, rgba(255, 255, 255, 0.9)) 50%, transparent);

  /* "Gold" of this deco theme: the host's luminous accent. */
  --lmb-gold: var(--lumiverse-primary-text, rgba(186, 135, 255, 0.95));
  --lmb-metal: var(--lumiverse-primary, rgba(147, 112, 219, 0.9));
  --lmb-metal-soft: var(--lumiverse-primary-muted, rgba(147, 112, 219, 0.6));
  --lmb-frame: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2));
  --lmb-frame-strong: var(--lumiverse-primary-050, rgba(147, 112, 219, 0.5));
  --lmb-frame-faint: var(--lumiverse-primary-010, rgba(147, 112, 219, 0.1));
  --lmb-wash: var(--lumiverse-primary-015, rgba(147, 112, 219, 0.15));
  --lmb-edge: var(--lumiverse-border-hover, rgba(147, 112, 219, 0.25));

  --lmb-void: var(--lumiverse-bg-deep, rgba(10, 8, 18, 1));
  --lmb-panel: var(--lumiverse-card-bg, linear-gradient(165deg, rgba(28, 24, 38, 1) 0%, rgba(24, 20, 34, 1) 50%, rgba(20, 17, 30, 1) 100%));
  --lmb-panel-solid: var(--lumiverse-card-bg-solid, rgb(24, 20, 34));
  --lmb-fill: var(--lumiverse-fill, rgba(0, 0, 0, 0.15));
  --lmb-fill-hover: var(--lumiverse-fill-hover, rgba(0, 0, 0, 0.2));
  --lmb-fill-strong: var(--lumiverse-fill-strong, rgba(0, 0, 0, 0.3));
  --lmb-hairline: var(--lumiverse-border-light, rgba(128, 128, 128, 0.12));
  --lmb-hairline-neutral: var(--lumiverse-border-neutral, rgba(128, 128, 128, 0.15));

  --lmb-danger: var(--lumiverse-danger, #ef4444);
  --lmb-danger-frame: var(--lumiverse-danger-050, rgba(239, 68, 68, 0.5));
  --lmb-danger-wash: var(--lumiverse-danger-015, rgba(239, 68, 68, 0.15));
  --lmb-success: var(--lumiverse-success, #22c55e);
  --lmb-success-frame: var(--lumiverse-success-050, rgba(34, 197, 94, 0.5));
  --lmb-success-wash: var(--lumiverse-success-015, rgba(34, 197, 94, 0.15));
  --lmb-warning: var(--lumiverse-warning, #f59e0b);
  --lmb-warning-frame: var(--lumiverse-warning-050, rgba(245, 158, 11, 0.5));
  --lmb-warning-wash: var(--lumiverse-warning-015, rgba(245, 158, 11, 0.15));
  /* Volumes get their own antique gold so amber stays exclusively "warning"
     - a shelf of volumes must not read as a shelf of problems. */
  --lmb-volume: #c9a86a;
  --lmb-volume-frame: rgba(201, 168, 106, 0.55);
  --lmb-volume-wash: rgba(201, 168, 106, 0.14);

  /* Rounding scale: softened deco. Large frames, controls, chips. */
  --lmb-r-lg: var(--lumiverse-radius, 8px);
  --lmb-r: var(--lumiverse-radius-sm, 5px);
  --lmb-r-sm: 3px;

  --lmb-glow: 0 0 16px var(--lumiverse-primary-015, rgba(147, 112, 219, 0.15));
  --lmb-glow-strong: 0 0 22px var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2));
  --lmb-lift: var(--lumiverse-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2));
  --lmb-sheen: var(--lumiverse-highlight-inset, inset 0 1px 0 rgba(255, 255, 255, 0.1));
  --lmb-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* ------------------------------------------------------------------ root */
/* Match only the host panel containing our mounted drawer root. Preserve
   the host's bottom safe-area and keyboard inset. */
:has(> div > [data-spindle-drawer-tab] > .lmb-root) {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.lmb-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 12px 30px;
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 13px;
  line-height: 1.45;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  /* Marquee halo up top, diagonal crosshatch "etched glass" texture behind
     everything. Transparent base so the host drawer's own backdrop remains. */
  background-image:
    radial-gradient(130% 200px at 50% -30px, var(--lmb-wash), transparent 70%),
    repeating-linear-gradient(45deg, var(--lmb-frame-faint) 0 1px, transparent 1px 17px),
    repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 1px, transparent 1px 17px);
  background-repeat: no-repeat, repeat, repeat;
}
.lmb-root *, .lmb-root *::before, .lmb-root *::after { box-sizing: border-box; }
.lmb-root ::selection { background: var(--lmb-frame-strong); color: #fff; }

/* ------------------------------------------------------------- tab strip */
.lmb-tabstrip {
  display: flex;
  gap: 0;
  padding: 3px;
  background: var(--lumiverse-bg-deep-080, rgba(20, 17, 28, 0.8));
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  overflow-x: auto;
  scrollbar-width: none;
  box-shadow: var(--lmb-sheen);
}
.lmb-tabstrip::-webkit-scrollbar { display: none; }
.lmb-tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: var(--lmb-ink-dim);
  border: none;
  border-left: 1px solid var(--lmb-frame-faint);
  border-radius: calc(var(--lmb-r-lg) - 3px);
  padding: 9px 4px 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 300ms var(--lmb-ease), background 300ms var(--lmb-ease), text-shadow 300ms var(--lmb-ease);
}
.lmb-tab:first-child { border-left: none; }
.lmb-tab-icon {
  width: 17px;
  height: 17px;
  display: block;
  transition: transform 300ms var(--lmb-ease), filter 300ms var(--lmb-ease);
}
.lmb-tab-icon svg { width: 100%; height: 100%; display: block; }
.lmb-tab-label {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lmb-tab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-tab:hover .lmb-tab-icon {
  transform: translateY(-1px);
  filter: drop-shadow(0 0 6px var(--lmb-frame-strong));
}
.lmb-tab.active {
  color: var(--lmb-gold);
  background: linear-gradient(180deg, var(--lmb-wash), transparent 85%);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
}
.lmb-tab.active .lmb-tab-icon { filter: drop-shadow(0 0 8px var(--lmb-frame-strong)); }
.lmb-tab.active::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, var(--lmb-metal) 30%, var(--lmb-metal) 70%, transparent);
  box-shadow: 0 0 8px var(--lmb-frame-strong);
}

.lmb-tab-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  counter-reset: lmb-section;
}

/* --------------------------------------------------------------- subtabs */
.lmb-subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  flex: 0 0 auto;
}
.lmb-subtab {
  flex: 1;
  background: transparent;
  border: none;
  border-radius: calc(var(--lmb-r) - 2px);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-body-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 9px 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease), box-shadow 250ms var(--lmb-ease);
}
.lmb-subtab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-subtab.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  box-shadow: inset 0 -1px 0 var(--lmb-metal), 0 0 10px var(--lmb-frame-faint);
}

.lmb-pane { display: flex; flex-direction: column; gap: 14px; }

/* Compact profile context strip shown on Tuning subtabs that aren't Profile:
   the full picker block would otherwise repeat above every pane. */
.lmb-profile-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  font-size: 11px;
  color: var(--lmb-ink-dim);
}
.lmb-profile-strip b {
  color: var(--lmb-ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------------------------------------------------------- section card */
.lmb-section {
  position: relative;
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  padding: 15px 14px 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--lmb-sheen);
  transition: border-color 300ms var(--lmb-ease), box-shadow 500ms var(--lmb-ease);
}
.lmb-section:hover { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-sheen), var(--lmb-glow); }
/* Corner brackets: top-left and bottom-right L-frames, drawn as four
   background hairlines on one pseudo-element. */
.lmb-section::before {
  content: "";
  position: absolute;
  inset: 4px;
  pointer-events: none;
  border-radius: calc(var(--lmb-r-lg) - 3px);
  background-image:
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft));
  background-position: left top, left top, right bottom, right bottom;
  background-size: 16px 1px, 1px 16px, 16px 1px, 1px 16px;
  background-repeat: no-repeat;
  opacity: 0.5;
  transition: opacity 300ms var(--lmb-ease);
}
.lmb-section:hover::before { opacity: 1; }
/* Roman-numeral plaque seated on the top frame line. */
.lmb-tab-content .lmb-section { counter-increment: lmb-section; }
.lmb-tab-content .lmb-section::after {
  content: counter(lmb-section, upper-roman);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -55%);
  padding: 2px 7px 1px 10px;
  background: var(--lmb-void);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-gold);
  font-family: var(--lmb-display-font);
  font-size: 9.5px;
  line-height: 13px;
  letter-spacing: 0.24em;
  pointer-events: none;
}

/* Section heading: centered, tracked caps, flanked by fading rules. */
.lmb-section > .lmb-section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--lmb-display-font);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  text-align: center;
  color: var(--lmb-gold);
}
.lmb-section > .lmb-section-title::before,
.lmb-section > .lmb-section-title::after {
  content: "";
  flex: 1 1 12px;
  min-width: 8px;
  height: 1px;
}
.lmb-section > .lmb-section-title::before { background: linear-gradient(90deg, transparent, var(--lmb-frame-strong)); }
.lmb-section > .lmb-section-title::after { background: linear-gradient(90deg, var(--lmb-frame-strong), transparent); }

/* Sub-headings inside a section body (entry group labels etc.). */
.lmb-collapsible-body .lmb-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--lmb-display-font);
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}
.lmb-collapsible-body .lmb-section-title::before {
  content: "◆";
  font-size: 6px;
  color: var(--lmb-metal-soft);
}
.lmb-collapsible-body .lmb-section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--lmb-frame), transparent);
}

.lmb-collapsible-body { display: flex; flex-direction: column; gap: 10px; }

.lmb-subgroup {
  position: relative;
  border-left: 1px solid var(--lmb-frame);
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 4px;
}
.lmb-subgroup::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 0;
  width: 1px;
  height: 16px;
  background: var(--lmb-metal);
}
.lmb-subgroup-title {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}

/* ------------------------------------------------------------ status text */
.lmb-status-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 5px 14px;
  font-size: 12px;
}
.lmb-status-grid > .lmb-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
  padding-top: 3px;
}
.lmb-status-grid > .lmb-value { font-weight: 500; color: var(--lmb-ink); overflow-wrap: anywhere; }

.lmb-help { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.55; }
.lmb-field-hint { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.5; }
.lmb-empty { font-size: 11.5px; font-style: italic; color: var(--lmb-ink-hint); padding: 4px 0; }
.lmb-empty::before { content: "◇"; font-style: normal; margin-right: 7px; color: var(--lmb-frame-strong); }
.lmb-about-hero { display: flex; gap: 12px; align-items: center; }
.lmb-about-hero img { width: 64px; height: 64px; object-fit: cover; border: 1px solid var(--lmb-frame-strong); border-radius: var(--lmb-r); padding: 3px; background: var(--lmb-fill-strong); }
.lmb-about-line { font-size: 12px; color: var(--lmb-ink-muted); line-height: 1.6; }
.lmb-hero-title {
  font-family: var(--lmb-display-font);
  font-size: 14px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
  margin-bottom: 3px;
}

/* ------------------------------------------------------------ stat tiles */
.lmb-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lmb-tile {
  position: relative;
  overflow: hidden;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 10px 11px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: border-color 300ms var(--lmb-ease), box-shadow 400ms var(--lmb-ease);
}
.lmb-tile::before {
  content: "";
  position: absolute;
  top: 0;
  left: 8%;
  width: 34%;
  height: 1px;
  background: linear-gradient(90deg, var(--lmb-metal-soft), transparent);
}
.lmb-tile:hover { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-tile-value {
  font-family: var(--lmb-display-font);
  font-size: 17px;
  line-height: 1.15;
  letter-spacing: 0.04em;
  color: var(--lmb-gold);
}
.lmb-tile-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-tile-sub { font-size: 10.5px; color: var(--lmb-ink-dim); }

/* Story Bible tiles: clickable record cards that cycle inject/freeze state. */
.lmb-bible-tile { cursor: pointer; user-select: none; }
.lmb-bible-tile:hover { border-color: var(--lmb-frame-strong); }
.lmb-tile-state {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--lmb-ink-dim);
  margin-top: 1px;
}
.lmb-bible-tile.noInject .lmb-tile-value { color: var(--lmb-ink-dim); }
.lmb-bible-tile.noInject { border-style: dashed; }
.lmb-bible-tile.frozen {
  border-style: dashed;
  opacity: 0.7;
  background:
    repeating-linear-gradient(45deg, rgba(128, 128, 128, 0.06) 0 4px, transparent 4px 9px),
    var(--lmb-fill);
}
.lmb-bible-tile.frozen .lmb-tile-value { color: var(--lmb-ink-dim); }
.lmb-bible-tile.stale { border-color: var(--lmb-warning-frame); }
.lmb-bible-tile.stale .lmb-tile-state { color: var(--lmb-warning); }
.lmb-tile-tools { margin-top: 5px; display: flex; gap: 5px; }

/* --------------------------------------------------------- coverage spine */
.lmb-spine {
  display: flex;
  height: 16px;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-sm);
  overflow: hidden;
  background: var(--lmb-fill-strong);
}
.lmb-spine-seg { min-width: 2px; transition: filter 200ms var(--lmb-ease); }
.lmb-spine-seg:hover { filter: brightness(1.5); }
/* Champagne cream: the codex block, distinct from every tier color. */
.lmb-spine-seg.codex { background: rgba(242, 240, 228, 0.45); }
.lmb-spine-seg.volume { background: var(--lmb-volume-frame); }
.lmb-spine-seg.arc { background: var(--lmb-frame-strong); }
.lmb-spine-seg.volume, .lmb-spine-seg.arc, .lmb-spine-seg.chapter, .lmb-spine-seg.ghost { cursor: pointer; }
.lmb-spine-seg.chapter { background: var(--lmb-frame); }
.lmb-spine-seg.ghost {
  background: repeating-linear-gradient(45deg, var(--lmb-frame-strong) 0 3px, transparent 3px 6px);
}
.lmb-spine-seg.excluded {
  background: repeating-linear-gradient(-45deg, rgba(128, 128, 128, 0.35) 0 2px, transparent 2px 5px);
}
.lmb-spine-seg.free { background: transparent; }
.lmb-spine-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-spine-key { display: inline-flex; align-items: center; gap: 5px; }
.lmb-spine-swatch {
  width: 11px;
  height: 11px;
  border: 1px solid var(--lmb-hairline);
  border-radius: 2px;
  background: var(--lmb-fill-strong);
  display: inline-block;
}
.lmb-spine-swatch.codex { background: rgba(242, 240, 228, 0.45); }
.lmb-spine-swatch.volume { background: var(--lmb-volume-frame); }
.lmb-spine-swatch.arc { background: var(--lmb-frame-strong); }
.lmb-spine-swatch.chapter { background: var(--lmb-frame); }
.lmb-spine-swatch.ghost { background: repeating-linear-gradient(45deg, var(--lmb-frame-strong) 0 2px, transparent 2px 4px); }
.lmb-spine-swatch.excluded { background: repeating-linear-gradient(-45deg, rgba(128, 128, 128, 0.35) 0 2px, transparent 2px 4px); }

/* Prompt itemization under the spine: what Memoria's story context costs. */
.lmb-breakdown { display: flex; flex-direction: column; gap: 3px; }
.lmb-breakdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--lmb-ink-muted);
}
.lmb-breakdown-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lmb-breakdown-tokens {
  font-weight: 600;
  color: var(--lmb-ink);
  font-variant-numeric: tabular-nums;
}
.lmb-breakdown-row.total {
  margin-top: 3px;
  padding-top: 5px;
  border-top: 1px solid var(--lmb-hairline);
  color: var(--lmb-ink);
}
.lmb-breakdown-row.total .lmb-breakdown-tokens { color: var(--lmb-gold); }
.lmb-breakdown-row.total .lmb-spine-swatch { visibility: hidden; }
.lmb-breakdown-click {
  background: transparent;
  border: none;
  padding: 2px 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
  width: 100%;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-breakdown-click:hover { background: var(--lmb-frame-faint); color: var(--lmb-ink); }
.lmb-breakdown-row.sub {
  font-size: 10.5px;
  color: var(--lmb-ink-dim);
  padding-left: 10px;
}

/* --------------------------------------------------------------- buttons */
.lmb-actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.lmb-spacer { flex: 1; }

.lmb-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  overflow: hidden;
  background: transparent;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  padding: 8px 14px 6px;
  font-family: var(--lmb-body-font);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 300ms var(--lmb-ease), background 300ms var(--lmb-ease),
    border-color 300ms var(--lmb-ease), box-shadow 450ms var(--lmb-ease), transform 200ms var(--lmb-ease);
}
/* Metallic sheen sweep on hover. */
.lmb-btn::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -130%;
  width: 60%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
}
.lmb-btn:hover:not(:disabled)::before { left: 170%; transition: left 550ms var(--lmb-ease); }
.lmb-btn:hover:not(:disabled) {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: var(--lmb-frame-faint);
  box-shadow: var(--lmb-glow);
}
.lmb-btn:active:not(:disabled) { transform: translateY(1px); }
/* Disabled must stay readable: desaturate and dim, but keep the label legible
   so the user can still see WHAT is unavailable. */
.lmb-btn:disabled { opacity: 0.55; filter: saturate(0.4); cursor: not-allowed; }
.lmb-btn.primary {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: linear-gradient(180deg, var(--lmb-wash), transparent);
}
.lmb-btn.primary:hover:not(:disabled) {
  background: var(--lmb-metal);
  border-color: var(--lmb-metal);
  color: var(--lmb-void);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-btn.danger { color: var(--lmb-danger); border-color: var(--lmb-danger-frame); }
.lmb-btn.danger:hover:not(:disabled) {
  color: var(--lmb-danger);
  background: var(--lmb-danger-wash);
  border-color: var(--lmb-danger);
  box-shadow: 0 0 14px var(--lumiverse-danger-020, rgba(239, 68, 68, 0.2));
}
.lmb-btn.small { padding: 5px 9px 4px; font-size: 10px; letter-spacing: 0.1em; }
.lmb-btn.active {
  background: var(--lmb-metal);
  border-color: var(--lmb-metal);
  color: var(--lmb-void);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-btn.active:hover:not(:disabled) { background: var(--lmb-metal); color: var(--lmb-void); filter: brightness(1.1); }

/* ---------------------------------------------------------------- fields */
.lmb-field { display: flex; flex-direction: column; gap: 4px; }
.lmb-field-row { display: flex; align-items: center; gap: 8px; }
.lmb-grow { flex: 1; min-width: 0; }
.lmb-field-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
/* Per-field lock toggle riding inside a field label (codex entity editor). */
.lmb-field-lock {
  margin-left: 8px;
  padding: 0 6px;
  font: inherit;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--lmb-ink-dim);
  background: transparent;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
}
.lmb-field-lock:hover { color: var(--lmb-ink); border-color: var(--lmb-frame-strong); }
.lmb-field-lock.active {
  color: var(--lmb-warning);
  border-color: var(--lmb-warning-frame);
  background: var(--lmb-warning-wash);
}

/* Search field: a visible container so an active filter can't masquerade as
   floating text, with a magnifier and a clear affordance. */
.lmb-search-row {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
  background-color: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r);
  padding: 0 2px 0 10px;
  transition: border-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-search-row:focus-within {
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-search-glyph { color: var(--lmb-ink-dim); display: inline-flex; flex: 0 0 auto; }
.lmb-search-glyph svg { display: block; }
.lmb-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 12.5px;
  padding: 7px 0 6px;
}
.lmb-search-input::placeholder { color: var(--lmb-ink-hint); }
.lmb-search-clear {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 15px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
  transition: color 200ms var(--lmb-ease);
}
.lmb-search-clear:hover { color: var(--lmb-gold); }
.lmb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.lmb-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; }

/* Inputs: underline elegance - transparent field, luminous baseline. */
.lmb-input {
  width: 100%;
  background-color: var(--lmb-fill);
  color: var(--lmb-ink);
  border: 1px solid transparent;
  border-bottom-color: var(--lmb-edge);
  border-radius: var(--lmb-r) var(--lmb-r) var(--lmb-r-sm) var(--lmb-r-sm);
  padding: 7px 9px 6px;
  font-family: var(--lmb-body-font);
  font-size: 12.5px;
  outline: none;
  transition: border-color 300ms var(--lmb-ease), background-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-input:hover:not(:disabled):not(:focus) { border-bottom-color: var(--lmb-frame-strong); }
.lmb-input:focus {
  border-bottom-color: var(--lmb-gold);
  background-color: var(--lmb-fill-hover);
  box-shadow: 0 8px 16px -10px var(--lmb-frame-strong);
}
.lmb-input::placeholder { color: var(--lmb-ink-hint); }
.lmb-input:disabled { opacity: 0.45; cursor: not-allowed; }
input.lmb-input[type="number"]::-webkit-inner-spin-button { opacity: 0.6; }

.lmb-textarea {
  resize: vertical;
  min-height: 84px;
  line-height: 1.5;
  font-family: var(--lmb-mono-font);
  font-size: 11.5px;
  background-color: var(--lmb-fill-strong);
  border-color: var(--lmb-hairline);
  border-bottom-color: var(--lmb-edge);
}

.lmb-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 26px;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--lmb-gold) 50%),
    linear-gradient(135deg, var(--lmb-gold) 50%, transparent 50%);
  background-position: calc(100% - 14px) 55%, calc(100% - 9px) 55%;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  text-overflow: ellipsis;
}
.lmb-select option { background: var(--lmb-panel-solid); color: var(--lmb-ink); }

/* Checkboxes: engraved square, gem-cut diamond fill when checked. */
.lmb-root input[type="checkbox"],
.lmb-preview-overlay input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  margin: 0;
  flex: 0 0 auto;
  position: relative;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
  transition: border-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-root input[type="checkbox"]::after,
.lmb-preview-overlay input[type="checkbox"]::after {
  content: "";
  position: absolute;
  inset: 3px;
  background: linear-gradient(135deg, var(--lmb-gold), var(--lmb-metal));
  transform: rotate(45deg) scale(0);
  transition: transform 300ms var(--lmb-ease);
}
.lmb-root input[type="checkbox"]:hover:not(:disabled),
.lmb-preview-overlay input[type="checkbox"]:hover:not(:disabled) { border-color: var(--lmb-gold); }
.lmb-root input[type="checkbox"]:checked,
.lmb-preview-overlay input[type="checkbox"]:checked {
  border-color: var(--lmb-gold);
  box-shadow: 0 0 10px var(--lmb-frame);
}
.lmb-root input[type="checkbox"]:checked::after,
.lmb-preview-overlay input[type="checkbox"]:checked::after { transform: rotate(45deg) scale(1); }
.lmb-root input[type="checkbox"]:disabled { opacity: 0.3; cursor: default; }

.lmb-check { display: flex; gap: 9px; align-items: flex-start; cursor: pointer; font-size: 12px; user-select: none; }
.lmb-check input { margin-top: 2px; }
.lmb-check-body { display: flex; flex-direction: column; gap: 3px; }
.lmb-check-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink);
  padding-top: 2px;
}
.lmb-check-hint { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.45; }

.lmb-multiselect {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 170px;
  overflow-y: auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 5px 7px;
}
.lmb-multiselect-row {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  padding: 3px 4px;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-multiselect-row:hover { background: var(--lmb-frame-faint); }

/* Compact regex browser controls, matching the RisuRealm pager. */
.lmb-regex-results { display: flex; flex-direction: column; gap: 12px; }
.lmb-regex-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
.lmb-regex-pager {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--lmb-edge);
  border-radius: 999px;
  background: var(--lmb-fill);
  box-shadow: var(--lmb-lift);
}
.lmb-regex-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--lmb-ink);
  cursor: pointer;
}
.lmb-regex-arrow:hover:not(:disabled) { background: var(--lmb-fill-hover); color: var(--lmb-gold); }
.lmb-regex-arrow:disabled, .lmb-regex-page:disabled { opacity: 0.4; cursor: not-allowed; }
.lmb-regex-page {
  appearance: textfield;
  width: 48px;
  height: 28px;
  padding: 0 4px;
  border: 0;
  border-radius: var(--lmb-r);
  background: transparent;
  color: var(--lmb-ink);
  font: inherit;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.lmb-regex-page::-webkit-inner-spin-button,
.lmb-regex-page::-webkit-outer-spin-button { appearance: none; margin: 0; }
.lmb-regex-pager :focus-visible { outline: 2px solid var(--lmb-gold); outline-offset: 1px; }
.lmb-regex-range { margin-left: auto; }
.lmb-regex-group-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 2px 12px; }
.lmb-regex-group-heading .lmb-help { font-weight: 400; letter-spacing: normal; text-transform: none; }

/* ------------------------------------------------------------------ pills */
/* Pills are STATUS, not controls: no border-box (that's the button costume),
   a status diamond instead, and sentence case so they read at a glance. */
.lmb-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 8px;
  background: var(--lmb-fill);
  border: none;
  border-radius: var(--lmb-r-sm);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--lmb-ink-muted);
}
.lmb-pill::before {
  content: "◆";
  font-size: 6.5px;
  flex: 0 0 auto;
  color: var(--lmb-metal-soft);
}
.lmb-pill.ok { color: var(--lmb-success); background: var(--lmb-success-wash); }
.lmb-pill.ok::before { color: var(--lmb-success); }
.lmb-pill.warn { color: var(--lmb-warning); background: var(--lmb-warning-wash); }
.lmb-pill.warn::before { color: var(--lmb-warning); }
.lmb-pill.danger { color: var(--lmb-danger); background: var(--lmb-danger-wash); }
.lmb-pill.danger::before { color: var(--lmb-danger); }

/* ------------------------------------------------------- busy + failures */
.lmb-busy {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--lmb-gold);
  font-size: 11.5px;
  padding: 3px 0;
}
.lmb-busy-dot {
  width: 8px;
  height: 8px;
  border-radius: 0;
  border: 1px solid var(--lmb-gold);
  background: var(--lmb-frame);
  flex: 0 0 auto;
  animation: lmb-facet 1.6s var(--lmb-ease) infinite;
}
@keyframes lmb-facet {
  0% { transform: rotate(45deg) scale(0.7); box-shadow: 0 0 3px var(--lmb-frame); opacity: 0.6; }
  50% { transform: rotate(135deg) scale(1); box-shadow: 0 0 12px var(--lmb-frame-strong); opacity: 1; }
  100% { transform: rotate(225deg) scale(0.7); box-shadow: 0 0 3px var(--lmb-frame); opacity: 0.6; }
}

/* Live stream viewer: Memoria's raw output as it arrives. */
.lmb-stream-panel {
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-gold);
  border-radius: var(--lmb-r);
  background: var(--lmb-frame-faint);
  margin: 2px 0 6px;
  overflow: hidden;
}
.lmb-stream-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--lmb-hairline);
}
.lmb-stream-title {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-stream-status {
  margin-left: auto;
  font-size: 10px;
  color: var(--lmb-ink-hint);
  letter-spacing: 0.06em;
}
.lmb-stream-panel.done .lmb-busy-dot { animation: none; opacity: 0.4; }
.lmb-stream-close {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 13px;
  line-height: 1;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: var(--lmb-r-sm);
}
.lmb-stream-close:hover { color: var(--lmb-ink); background: var(--lmb-frame); }
.lmb-stream-body {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lmb-stream-think {
  font-size: 11px;
  font-style: italic;
  color: var(--lmb-ink-hint);
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 2px solid var(--lmb-hairline);
  padding-left: 8px;
}
.lmb-stream-text {
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  line-height: 1.55;
  color: var(--lmb-ink);
  white-space: pre-wrap;
  word-break: break-word;
}
.lmb-stream-empty { font-size: 11px; color: var(--lmb-ink-hint); font-style: italic; }

.lmb-failure {
  background: var(--lmb-danger-wash);
  border: 1px solid var(--lmb-danger-frame);
  border-left: 2px solid var(--lmb-danger);
  border-radius: var(--lmb-r);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  box-shadow: 0 0 14px var(--lumiverse-danger-015, rgba(239, 68, 68, 0.15));
}

.lmb-preview-card {
  position: relative;
  background: linear-gradient(180deg, var(--lmb-frame-faint), transparent 60%);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: var(--lmb-glow);
}

/* ----------------------------------------------------------- entry cards */
.lmb-entry-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lmb-entry {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r);
  transition: background 300ms var(--lmb-ease), border-color 300ms var(--lmb-ease),
    box-shadow 400ms var(--lmb-ease), opacity 300ms var(--lmb-ease);
}
.lmb-entry:hover { background: var(--lmb-fill-hover); box-shadow: var(--lmb-glow); }
.lmb-entry.arc { border-left-color: var(--lmb-metal); }
.lmb-entry.volume { border-left-color: var(--lmb-volume); }
.lmb-entry.root { border-left-color: var(--lmb-metal-soft); opacity: 0.75; }
.lmb-entry.superseded { opacity: 0.5; filter: saturate(0.6); }
.lmb-entry.compact { padding: 0; overflow: hidden; }
.lmb-entry.expanded { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 200ms var(--lmb-ease);
}
.lmb-entry-row:hover { background: var(--lmb-frame-faint); }
.lmb-entry-right {
  font-size: 10.5px;
  color: var(--lmb-ink-dim);
  white-space: nowrap;
  flex: 0 0 auto;
}
.lmb-chevron {
  width: 7px;
  height: 7px;
  border-right: 1px solid var(--lmb-ink-dim);
  border-bottom: 1px solid var(--lmb-ink-dim);
  transform: rotate(-45deg);
  transition: transform 300ms var(--lmb-ease);
  flex: 0 0 auto;
  margin: 0 2px 2px 2px;
}
.lmb-chevron.open { transform: rotate(45deg); margin-bottom: 4px; }
.lmb-entry-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--lmb-hairline);
}
.lmb-entry-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lmb-entry-title {
  flex: 1 1 120px;
  min-width: 0;
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lmb-entry-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
.lmb-entry-tag {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 6px 2px;
  border: 1px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  background: transparent;
  flex: 0 0 auto;
}
.lmb-entry-tag.arc { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); background: var(--lmb-frame-faint); }
.lmb-entry-tag.volume { color: var(--lmb-volume); border-color: var(--lmb-volume-frame); background: var(--lmb-volume-wash); }
.lmb-entry-tag.ghost { border-style: dashed; color: var(--lmb-metal-soft); border-color: var(--lmb-frame-strong); }
.lmb-entry-meta {
  font-size: 11px;
  color: var(--lmb-ink-dim);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.lmb-entry-preview {
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  white-space: pre-wrap;
}
.lmb-entry-comment { font-size: 11px; font-style: italic; color: var(--lmb-metal-soft); }

/* --------------------------------------------------------- message picker */
.lmb-message-filter-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.lmb-message-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 360px;
  overflow-y: auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 4px;
}
.lmb-message-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 5px 6px;
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
  font-size: 12px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  transition: background 200ms var(--lmb-ease), box-shadow 200ms var(--lmb-ease);
}
.lmb-message-row:hover { background: var(--lmb-frame-faint); }
.lmb-message-row.selected { background: var(--lmb-wash); box-shadow: inset 2px 0 0 var(--lmb-metal); }
/* Covered = already filed, which is information, not disablement: keep it
   readable and let the check glyph carry the meaning. */
.lmb-message-row.covered { opacity: 0.55; }
.lmb-message-row.excluded .lmb-msg-preview { text-decoration: line-through; opacity: 0.6; }
.lmb-message-row input { margin-top: 2px; }
.lmb-msg-excluded-badge { opacity: 0.85; font-weight: 600; color: var(--lmb-warning); }
.lmb-msg-filed { color: var(--lmb-success); font-size: 10px; font-weight: 600; }
.lmb-msg-role {
  font-family: var(--lmb-mono-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--lmb-ink-dim);
  min-width: 36px;
  padding-top: 3px;
}
.lmb-msg-preview { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-top: 1px; }
.lmb-msg-icons { display: flex; gap: 4px; align-items: center; opacity: 0.7; padding-top: 2px; }
.lmb-picker-more { justify-content: center; padding: 3px 0; }

/* ----------------------------------------------------------- codex: chips */
.lmb-chipgrid { display: flex; flex-wrap: wrap; gap: 6px; }
.lmb-chip {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  color: var(--lmb-ink-muted);
  font-family: var(--lmb-body-font);
  font-size: 11px;
  padding: 5px 10px 4px;
  cursor: pointer;
  transition: color 250ms var(--lmb-ease), border-color 250ms var(--lmb-ease),
    background 250ms var(--lmb-ease), box-shadow 350ms var(--lmb-ease);
}
.lmb-chip:hover { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-chip.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-chip.add { border-style: dashed; background: transparent; color: var(--lmb-ink-dim); }
.lmb-chip.add:hover { color: var(--lmb-gold); }
.lmb-add-form { display: flex; gap: 6px; align-items: center; }
.lmb-add-form input { flex: 1; min-width: 0; }

/* ---------------------------------------------------- codex: entity cards */
.lmb-entity-card {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 11px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: var(--lmb-glow);
}
.lmb-entity-card.editing { border-style: dashed; }
.lmb-entity-name {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--lmb-gold);
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.lmb-entity-id {
  font-family: var(--lmb-mono-font);
  font-size: 9.5px;
  letter-spacing: 0.03em;
  color: var(--lmb-ink-dim);
}
.lmb-kv {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  font-size: 11.5px;
}
.lmb-kv-key {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
  padding-top: 2px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lmb-kv-value { color: var(--lmb-ink-muted); line-height: 1.45; overflow-wrap: anywhere; }
.lmb-entity-form { display: flex; flex-direction: column; gap: 8px; }

/* Shared record-row affordances: heads toggle expansion like Threads. */
.lmb-record-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.lmb-record-click {
  cursor: pointer;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-record-click:hover { background: var(--lmb-frame-faint); }

/* ------------------------------------------------------- codex: relations */
.lmb-relation-list { display: flex; flex-direction: column; gap: 6px; }
.lmb-relation {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.lmb-relation-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; }
.lmb-relation-names {
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.lmb-relation-arrow { color: var(--lmb-gold); font-size: 11px; }
.lmb-relation-state { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.45; }
.lmb-history {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: var(--lmb-ink-dim);
  line-height: 1.55;
}

/* --------------------------------------------------- codex: relation graph */
/* The web gets as much room as the pane can give, and the camera (pan and
   zoom) frames it, so labels stay readable at any cast size. */
.lmb-graph-wrap { position: relative; height: clamp(300px, 56vh, 620px); }
.lmb-graph {
  width: 100%;
  height: 100%;
  display: block;
  background:
    radial-gradient(90% 70% at 50% 40%, var(--lmb-frame-faint), transparent 75%),
    var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  touch-action: none;
  cursor: grab;
}
.lmb-graph:active { cursor: grabbing; }
.lmb-graph-tools {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  z-index: 2;
}
.lmb-graph-tools .lmb-btn {
  min-height: 0;
  padding: 4px 9px 3px;
  background: var(--lmb-void);
}
.lmb-graph-edge {
  stroke: var(--lmb-frame-strong);
  stroke-width: 1;
  fill: none;
  pointer-events: none;
  transition: stroke 200ms var(--lmb-ease), stroke-width 200ms var(--lmb-ease);
}
/* Fat invisible twin path carries the pointer events: 1px lines are not
   clickable targets, especially on touch. */
.lmb-graph-hit {
  stroke: transparent;
  stroke-width: 12;
  fill: none;
  cursor: pointer;
}
.lmb-graph-edgeg:hover .lmb-graph-edge,
.lmb-graph-edgeg.selected .lmb-graph-edge { stroke: var(--lmb-gold); stroke-width: 1.6; }
.lmb-graph-edge.group { stroke: var(--lmb-frame); stroke-dasharray: 3 3; }
.lmb-graph-detail {
  min-height: 18px;
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  line-height: 1.45;
}
.lmb-graph-detail b { color: var(--lmb-gold); font-weight: 600; }
.lmb-graph-arrow { fill: var(--lmb-metal-soft); }
.lmb-graph-node { cursor: pointer; }
.lmb-graph-node rect {
  stroke-width: 1;
  transition: filter 200ms var(--lmb-ease);
}
.lmb-graph-node:hover rect { filter: drop-shadow(0 0 7px var(--lmb-frame-strong)); }
.lmb-graph-node text {
  fill: var(--lmb-ink-muted);
  font-family: var(--lmb-body-font);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  pointer-events: none;
  user-select: none;
}
.lmb-graph-node.char rect { fill: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2)); stroke: var(--lmb-metal); }
.lmb-graph-node.loc rect { fill: var(--lmb-volume-wash); stroke: var(--lmb-volume); }
.lmb-graph-node.thing rect { fill: rgba(128, 128, 128, 0.15); stroke: var(--lumiverse-border-neutral-hover, rgba(128, 128, 128, 0.25)); }
.lmb-graph-node.other rect { fill: var(--lmb-fill); stroke: var(--lmb-hairline-neutral); }
.lmb-graph-swatch {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  border-radius: 1.5px;
  display: inline-block;
  border: 1px solid var(--lmb-hairline);
}
.lmb-graph-swatch.char { background: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2)); border-color: var(--lmb-metal); }
.lmb-graph-swatch.loc { background: var(--lmb-volume-wash); border-color: var(--lmb-volume); }
.lmb-graph-swatch.thing { background: rgba(128, 128, 128, 0.15); border-color: var(--lumiverse-border-neutral-hover, rgba(128, 128, 128, 0.25)); }

/* -------------------------------------------------------- codex: timeline */
.lmb-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding-left: 17px;
}
.lmb-timeline::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 5px;
  bottom: 5px;
  width: 1px;
  background: linear-gradient(180deg, var(--lmb-frame-strong), var(--lmb-frame));
}
.lmb-timeline-item { position: relative; display: flex; flex-direction: column; gap: 2px; }
.lmb-timeline-item::before {
  content: "";
  position: absolute;
  left: -17px;
  top: 4px;
  width: 6px;
  height: 6px;
  background: var(--lmb-metal);
  transform: rotate(45deg);
  box-shadow: 0 0 6px var(--lmb-frame-strong);
}
.lmb-timeline-when {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-timeline-event { font-size: 12px; color: var(--lmb-ink); line-height: 1.45; }
.lmb-timeline-detail { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.45; }

/* --------------------------------------------------------- codex: threads */
.lmb-thread-list { display: flex; flex-direction: column; gap: 6px; }
.lmb-thread {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lmb-thread-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.lmb-thread-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
}
.lmb-thread-summary { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.45; }
.lmb-thread-detail { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.5; }

/* ------------------------------------------------------------ codex: lore */
.lmb-lore-topic {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-left: 2px solid var(--lmb-frame-strong);
  padding-left: 10px;
}
.lmb-lore-title {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-lore-facts {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  line-height: 1.55;
}
.lmb-secret {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lmb-secret-fact { font-size: 12px; font-weight: 600; color: var(--lmb-ink); line-height: 1.45; }

/* -------------------------------------------------------------- preset text */
.lmb-preset-text {
  background: var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 9px 10px;
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  white-space: pre-wrap;
  max-height: 280px;
  overflow-y: auto;
  line-height: 1.5;
  color: var(--lmb-ink-muted);
}

.lmb-greyed { opacity: 0.35; pointer-events: none; filter: saturate(0.5); }

/* ------------------------------------------------------- sampler switch */
/* Large two-way toggle on the Model pane: summary samplers vs codex
   samplers. Oversized on purpose so nobody edits the wrong set. */
.lmb-sampler-switch {
  display: flex;
  gap: 5px;
  padding: 5px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-lg);
}
.lmb-activation { border: 0; padding: 0; margin: 0; min-width: 0; }
.lmb-activation legend { margin-bottom: 6px; }
.lmb-activation-options { display: flex; flex-wrap: wrap; gap: 3px; }
.lmb-activation-options label { position: relative; flex: 1 1 auto; cursor: pointer; }
.lmb-activation-options input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.lmb-activation-label { display: block; text-align: center; padding: 8px 10px; border: 1px solid var(--lmb-frame-faint); border-radius: 6px; }
.lmb-activation-options input:checked + .lmb-activation-label { background: var(--lmb-frame-faint); color: var(--lmb-ink); border-color: currentColor; }
.lmb-activation-options input:focus-visible + .lmb-activation-label { outline: 2px solid currentColor; outline-offset: 2px; }
.lmb-sampler-switch button {
  flex: 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--lmb-r-lg) - 3px);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 12px 8px 10px;
  cursor: pointer;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease),
    border-color 250ms var(--lmb-ease), box-shadow 350ms var(--lmb-ease);
}
.lmb-sampler-switch button:hover:not(.active) { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-sampler-switch button.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
  text-shadow: 0 0 10px var(--lmb-frame-strong);
}

/* ---------------------------------------------------------------- toasts */
.lmb-toast-stack {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 10010;
  pointer-events: none;
  font-family: var(--lmb-body-font);
}
.lmb-toast {
  position: relative;
  background: var(--lcs-glass-bg, rgba(18, 16, 28, 0.55));
  backdrop-filter: blur(var(--lcs-glass-blur, 8px));
  -webkit-backdrop-filter: blur(var(--lcs-glass-blur, 8px));
  color: var(--lmb-ink);
  border: 1px solid var(--lmb-frame);
  border-left: 3px solid var(--lmb-metal);
  border-radius: var(--lmb-r);
  padding: 9px 13px 8px;
  font-size: 12px;
  line-height: 1.45;
  max-width: 340px;
  box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), var(--lmb-glow);
  pointer-events: auto;
  animation: lmb-toast-in 350ms var(--lmb-ease);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
@keyframes lmb-toast-in {
  from { opacity: 0; transform: translateX(14px); }
  to { opacity: 1; transform: translateX(0); }
}
.lmb-toast-leaving { opacity: 0; transform: translateY(4px); }
.lmb-toast-success { border-left-color: var(--lmb-success); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-success-wash); }
.lmb-toast-info { border-left-color: var(--lmb-metal); }
.lmb-toast-warn { border-left-color: var(--lmb-warning); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-warning-wash); }
.lmb-toast-error { border-left-color: var(--lmb-danger); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-danger-wash); }

/* ------------------------------------------------- host-modal form pieces */
.lmb-modal-form {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 10px 14px 14px;
  font-family: var(--lmb-body-font);
}
.lmb-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--lmb-frame);
}

/* ------------------------------------------------------ fullscreen modals */
.lmb-preview-overlay {
  position: fixed;
  inset: 0;
  background: var(--lumiverse-modal-backdrop, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 22px;
  font-family: var(--lmb-body-font);
  animation: lmb-fade-in 250ms ease-out;
}
@keyframes lmb-fade-in { from { opacity: 0; } to { opacity: 1; } }
.lmb-preview-modal {
  position: relative;
  background: var(--lumiverse-gradient-modal, linear-gradient(135deg, rgba(35, 30, 48, 0.98), rgba(20, 17, 28, 0.98)));
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  width: min(960px, 100%);
  max-height: calc(100vh - 44px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--lumiverse-shadow-lg, 0 24px 80px rgba(0, 0, 0, 0.5)), var(--lmb-glow-strong);
  color: var(--lmb-ink);
  font-size: 12px;
  animation: lmb-rise 300ms var(--lmb-ease);
}
@keyframes lmb-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
/* Frame within frame. */
.lmb-preview-modal::before {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1px solid var(--lmb-frame-faint);
  border-radius: calc(var(--lmb-r-lg) - 4px);
  pointer-events: none;
  z-index: 1;
}
.lmb-preview-modal__header,
.lmb-preview-modal__footer { flex: 0 0 auto; }
.lmb-preview-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 18px 11px;
  border-bottom: 1px solid var(--lmb-frame);
}
.lmb-preview-modal__header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-family: var(--lmb-display-font);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
}
.lmb-preview-modal__header h3::before {
  content: "◆";
  font-size: 7px;
  color: var(--lmb-metal-soft);
  flex: 0 0 auto;
}
.lmb-preview-modal__close {
  background: transparent;
  color: inherit;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 8px;
  opacity: 0.6;
  transition: opacity 300ms var(--lmb-ease), transform 300ms var(--lmb-ease), color 300ms var(--lmb-ease);
}
.lmb-preview-modal__close:hover { opacity: 1; color: var(--lmb-gold); transform: rotate(90deg); }
.lmb-preview-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lmb-preview-modal__diagnostics {
  flex: 0 0 auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 9px 12px;
}
.lmb-preview-modal__diagnostics h4 {
  margin: 0 0 5px 0;
  font-family: var(--lmb-display-font);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-preview-modal__diagnostics ul {
  margin: 0;
  padding-left: 18px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--lmb-ink-muted);
}
.lmb-preview-msg {
  flex: 0 0 auto;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  overflow: hidden;
}
.lmb-preview-msg__role {
  background: linear-gradient(90deg, var(--lmb-wash), transparent);
  padding: 6px 10px 5px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
  border-bottom: 1px solid var(--lmb-hairline);
}
.lmb-preview-msg__content {
  margin: 0;
  padding: 10px 12px;
  background: var(--lmb-fill-strong);
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--lmb-ink-muted);
}
.lmb-preview-modal__footer {
  padding: 11px 18px;
  border-top: 1px solid var(--lmb-frame);
  background: var(--lmb-fill);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ------------------------------------------------------------ scrollbars */
.lmb-root ::-webkit-scrollbar,
.lmb-preview-overlay ::-webkit-scrollbar { width: 9px; height: 9px; }
.lmb-root ::-webkit-scrollbar-track,
.lmb-preview-overlay ::-webkit-scrollbar-track { background: transparent; }
.lmb-root ::-webkit-scrollbar-thumb,
.lmb-preview-overlay ::-webkit-scrollbar-thumb {
  background: var(--lmb-frame);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: var(--lmb-r-sm);
}
.lmb-root ::-webkit-scrollbar-thumb:hover,
.lmb-preview-overlay ::-webkit-scrollbar-thumb:hover { background: var(--lmb-frame-strong); background-clip: padding-box; }

/* ----------------------------------------------------------------- focus */
.lmb-root :focus-visible,
.lmb-preview-overlay :focus-visible,
.lmb-toast-stack :focus-visible,
.lmb-modal-form :focus-visible {
  outline: 2px solid var(--lmb-gold);
  outline-offset: 2px;
}

/* ------------------------------------------------------------- responsive */
@media (max-width: 600px) {
  .lmb-root { padding: 11px 9px 26px; gap: 12px; }
  .lmb-tab { padding: 11px 3px 9px; }
  .lmb-tab-label { font-size: 9px; letter-spacing: 0.12em; }
  .lmb-btn { min-height: 40px; padding: 10px 14px 8px; font-size: 11px; }
  .lmb-btn.small { min-height: 34px; padding: 7px 10px 5px; font-size: 10px; }
  .lmb-subtab { padding: 9px 8px 8px; }
  .lmb-input { padding: 9px 10px 8px; font-size: 13px; }
  .lmb-chip { padding: 8px 12px 7px; font-size: 12px; }
  .lmb-root input[type="checkbox"],
  .lmb-preview-overlay input[type="checkbox"] { width: 18px; height: 18px; }
  .lmb-root input[type="checkbox"]::after,
  .lmb-preview-overlay input[type="checkbox"]::after { inset: 4px; }
  .lmb-message-row { padding: 7px 6px; }
  .lmb-multiselect-row { padding: 6px 4px; }
  .lmb-entry-row { padding: 10px; }
  .lmb-preview-overlay { padding: 10px; }
  .lmb-toast { max-width: min(340px, calc(100vw - 32px)); }
}
@media (max-width: 380px) {
  .lmb-grid-3 { grid-template-columns: 1fr 1fr; }
  .lmb-grid-2 { grid-template-columns: 1fr; }
  .lmb-section { padding: 13px 11px 11px; }
  .lmb-kv { grid-template-columns: 1fr; gap: 1px 0; }
  .lmb-kv-key { padding-top: 6px; }
}

/* -------------------------------------------------------- reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lmb-root *, .lmb-root *::before, .lmb-root *::after,
  .lmb-toast-stack *, .lmb-toast,
  .lmb-preview-overlay, .lmb-preview-overlay *, .lmb-preview-modal {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
  .lmb-busy-dot { transform: rotate(45deg); }
}
.lmb-higher-peek { display: none; }
.lmb-has-higher:hover > .lmb-higher-peek,
.lmb-has-higher:focus-within > .lmb-higher-peek { display: block; }
.lmb-spine-seg.series, .lmb-spine-swatch.series { background: #8e73cf; }
.lmb-spine-seg.saga, .lmb-spine-swatch.saga { background: #ab72c9; }
.lmb-spine-seg.library, .lmb-spine-swatch.library { background: #cb77ab; }
.lmb-spine-seg.universe, .lmb-spine-swatch.universe { background: #d19472; }
` + LESSON_STYLES;
var ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2v8l3-3 3 3V2"/>
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
</svg>
`;

// src/frontend-diagnostics.ts
var UI_KINDS = ["start", "stop", "view", "click", "change", "render", "error", "rejection", "resource", "send", "receive", "timeout", "overflow"];
var UI_VIEWS = ["startup", "home", "books", "codex", "tuning", "stuff", "lesson", "unknown"];
var UI_CODES = ["ok", "failed", "unknown", "TypeError", "ReferenceError", "RangeError", "SyntaxError", "AbortError", "TimeoutError", "Error", "state", "prompt", "closed", "stale", "button", "input", "select", "textarea", "image", "stylesheet"];
var UI_OPERATIONS = [
  "ready",
  "refresh",
  "prompt_breakdown",
  "regex_scripts_page",
  "save_settings",
  "save_profile",
  "save_samplers",
  "create_profile",
  "delete_profile",
  "set_active_profile",
  "create_chapter",
  "create_chapter_range",
  "create_all_chapters",
  "create_arc",
  "create_arc_from",
  "create_all_arcs",
  "create_higher_from",
  "create_higher_auto",
  "create_volume_from",
  "retry_last_failure",
  "delete_entry",
  "release_entry",
  "regenerate_entry",
  "update_entry",
  "resync_hidden",
  "resync_visibility",
  "set_summary_activation",
  "abort_busy",
  "dry_run_chapter",
  "dry_run_arc",
  "dry_run_volume",
  "dry_run_codex",
  "ensure_book",
  "import_preset",
  "save_custom_preset",
  "delete_custom_preset",
  "accept_preview",
  "discard_preview",
  "edit_preview",
  "rebase_root",
  "rebuild_root",
  "detach_root",
  "set_message_excluded",
  "codex_update_now",
  "codex_read",
  "codex_write_file",
  "codex_reset",
  "codex_rebuild",
  "codex_tidy",
  "codex_rebuild_files",
  "codex_clear_stale",
  "codex_refresh",
  "codex_set_file_state",
  "codex_backup",
  "codex_restore",
  "codex_undo",
  "codex_adopt",
  "summary_export",
  "summary_import",
  "summary_import_resolve",
  "wipe_books",
  "rebuild_books",
  "watch_stream",
  "lesson_patch",
  "lesson_complete",
  "lesson_reset",
  "lesson_seal_skip",
  "state",
  "state_loading",
  "state_error",
  "toast",
  "busy",
  "error",
  "dry_run_result",
  "codex_files",
  "codex_file_state_saved",
  "stream_text",
  "summary_transfer_status",
  "summary_export_data",
  "codex_backup_data",
  "codex_tools_hint",
  "subtab.profile",
  "subtab.settings",
  "subtab.prompts",
  "subtab.shelf",
  "subtab.compose",
  "subtab.continuity",
  "subtab.entities",
  "subtab.relations",
  "subtab.world",
  "subtab.secrets",
  "subtab.manage",
  "tuning.settings.books",
  "tuning.settings.codex",
  "tab.home",
  "tab.books",
  "tab.codex",
  "tab.tuning",
  "tab.stuff"
];
var UI_BATCH_LIMIT = 32;
function pick(v, values) {
  return typeof v === "string" && values.includes(v) ? v : undefined;
}
function integer(v, max = Number.MAX_SAFE_INTEGER) {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max ? v : undefined;
}
function projectUiDiagnostic(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  const kind = pick(v.kind, UI_KINDS), view = pick(v.view, UI_VIEWS);
  if (!kind || !view)
    return null;
  const first = integer(v.first) ?? 0;
  return {
    kind,
    view,
    code: pick(v.code, UI_CODES),
    op: pick(v.op, UI_OPERATIONS),
    count: Math.max(1, integer(v.count, 1e6) ?? 1),
    first,
    last: Math.max(first, integer(v.last) ?? first),
    caps: integer(v.caps, 7),
    line: integer(v.line, 1e7),
    column: integer(v.column, 1e7)
  };
}

// src/ui/diagnostics.ts
var current = null;
function setUiDiagnostics(log) {
  current = log;
}
function reportUi(kind, details = {}) {
  current?.record(kind, details);
}
function uiErrorCode(error) {
  try {
    return projectUiDiagnostic({ kind: "error", view: "unknown", code: error instanceof Error ? error.name : undefined })?.code ?? "unknown";
  } catch {
    return "unknown";
  }
}
function createUiDiagnostics(options) {
  const pending = new Map;
  const now = options.now ?? Date.now;
  let timer;
  let enabled = true, disposed = false, flushing = false, dropped = 0;
  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
    pending.clear();
    dropped = 0;
  };
  const schedule = () => {
    if (!timer && !disposed && enabled)
      timer = setTimeout(flush, options.delay ?? 5000);
  };
  function record(kind, details = {}) {
    try {
      if (!enabled || disposed)
        return;
      const context = options.context(), at = now();
      const safe = projectUiDiagnostic({ ...details, kind, view: context.view, count: 1, first: at, last: at });
      if (!safe)
        return;
      const chatId = typeof context.chatId === "string" && context.chatId.length <= 1024 ? context.chatId : undefined;
      const key = JSON.stringify([chatId, safe.kind, safe.view, safe.code, safe.op, safe.caps, safe.line, safe.column]);
      const previous = pending.get(key);
      if (previous)
        pending.set(key, { ...previous, count: Math.min(1e6, previous.count + 1), last: at });
      else {
        if (pending.size >= UI_BATCH_LIMIT - 1) {
          const routine = [...pending].find(([, row]) => !["error", "rejection", "timeout"].includes(row.kind));
          if (["error", "rejection", "timeout"].includes(kind) && routine) {
            dropped = Math.min(1e6, dropped + routine[1].count);
            pending.delete(routine[0]);
          } else {
            dropped = Math.min(1e6, dropped + 1);
            schedule();
            return;
          }
        }
        pending.set(key, { ...safe, chatId });
      }
      schedule();
    } catch {}
  }
  function flush() {
    clearTimeout(timer);
    timer = undefined;
    if (flushing || !enabled || disposed || !pending.size && !dropped)
      return;
    const batch = new Map(pending), lost = dropped;
    const rows = [...batch.values()];
    if (lost)
      rows.push({ kind: "overflow", view: "unknown", count: lost, first: now(), last: now() });
    flushing = true;
    try {
      options.send({ type: "ui_diagnostics", rows });
      for (const [key, sent] of batch) {
        const remaining = pending.get(key);
        if (remaining === sent)
          pending.delete(key);
        else if (remaining && remaining.count > sent.count)
          pending.set(key, { ...remaining, count: remaining.count - sent.count, first: remaining.last });
      }
      dropped = Math.max(0, dropped - lost);
    } catch {} finally {
      flushing = false;
      if (pending.size || dropped)
        schedule();
    }
  }
  function capabilities() {
    const caps = (globalThis.isSecureContext ? 1 : 0) | (typeof globalThis.crypto?.randomUUID === "function" ? 2 : 0) | (typeof globalThis.crypto?.getRandomValues === "function" ? 4 : 0);
    record("start", { caps });
  }
  return {
    record,
    flush,
    clear,
    capabilities,
    setEnabled(value) {
      const changed = enabled !== value;
      enabled = value;
      if (!value)
        clear();
      else if (changed)
        capabilities();
    },
    dispose() {
      if (disposed)
        return;
      record("stop");
      flush();
      disposed = true;
      clear();
    }
  };
}
function isOwnUiError(error, filename, source) {
  if (!source)
    return false;
  if (filename === source)
    return true;
  try {
    return error instanceof Error && typeof error.stack === "string" && error.stack.split(`
`).slice(1).some((line) => line.includes(`${source}:`));
  } catch {
    return false;
  }
}
function observeUiDiagnostics(log, source) {
  const owned = (target) => target instanceof Element && !!target.closest(".lmb-root, .lmb-preview-overlay, .lmb-modal-form, .lmb-toast-stack");
  const interaction = (event) => {
    if (!owned(event.target))
      return;
    const control = event.target.closest("button, input, select, textarea, [role=button], [data-lesson]");
    if (!control)
      return;
    const op = control.closest("[data-lesson]")?.dataset.lesson;
    log.record(event.type === "click" ? "click" : "change", {
      code: control.tagName.toLowerCase(),
      op
    });
  };
  const error = (event) => {
    if (isOwnUiError(event.error, event.filename, source)) {
      log.record("error", { code: uiErrorCode(event.error), line: event.lineno, column: event.colno });
    } else if (owned(event.target)) {
      log.record("resource", { code: event.target.tagName === "IMG" ? "image" : "unknown" });
    } else if (event.target instanceof HTMLLinkElement && event.target.id === "lmb-deco-fonts") {
      log.record("resource", { code: "stylesheet" });
    }
  };
  const rejection = (event) => {
    if (isOwnUiError(event.reason, undefined, source))
      log.record("rejection", { code: uiErrorCode(event.reason) });
  };
  const visibility = () => {
    if (document.visibilityState === "hidden")
      log.flush();
  };
  document.addEventListener("click", interaction, true);
  document.addEventListener("change", interaction, true);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("error", error, true);
  window.addEventListener("unhandledrejection", rejection);
  window.addEventListener("pagehide", log.flush);
  return () => {
    document.removeEventListener("click", interaction, true);
    document.removeEventListener("change", interaction, true);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("error", error, true);
    window.removeEventListener("unhandledrejection", rejection);
    window.removeEventListener("pagehide", log.flush);
  };
}

// src/ui/components.ts
function textInput(opts) {
  const el = document.createElement("input");
  el.type = "text";
  el.className = `lmb-input ${opts.className ?? ""}`.trim();
  el.value = opts.value;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  if (opts.autoFocus)
    setTimeout(() => el.focus(), 0);
  if (opts.onChange) {
    el.addEventListener("input", () => opts.onChange?.(el.value));
  }
  if (opts.onBlur) {
    el.addEventListener("blur", () => opts.onBlur?.(el.value));
  }
  return el;
}
function textArea(opts) {
  const el = document.createElement("textarea");
  el.className = "lmb-input lmb-textarea";
  el.value = opts.value;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  if (opts.rows)
    el.rows = opts.rows;
  if (opts.onChange)
    el.addEventListener("input", () => opts.onChange?.(el.value));
  if (opts.onBlur)
    el.addEventListener("blur", () => opts.onBlur?.(el.value));
  return el;
}
function numberInput(opts) {
  const el = document.createElement("input");
  el.type = "number";
  el.className = "lmb-input";
  const showAsBlank = opts.value === null || opts.defaultValue !== undefined && opts.value === opts.defaultValue;
  el.value = showAsBlank ? "" : String(opts.value);
  if (typeof opts.min === "number")
    el.min = String(opts.min);
  if (typeof opts.max === "number")
    el.max = String(opts.max);
  if (typeof opts.step === "number")
    el.step = String(opts.step);
  if (opts.disabled)
    el.disabled = true;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  else if (opts.defaultValue !== undefined)
    el.placeholder = String(opts.defaultValue);
  if (opts.onBlur) {
    el.addEventListener("blur", () => {
      const raw = el.value.trim();
      if (raw === "") {
        if (opts.defaultValue !== undefined) {
          opts.onBlur?.(opts.defaultValue);
        } else {
          opts.onBlur?.(null);
        }
        return;
      }
      const v = Number(raw);
      if (!Number.isFinite(v)) {
        el.value = showAsBlank || opts.value === null || opts.value === undefined ? "" : String(opts.value);
        return;
      }
      opts.onBlur?.(v);
    });
  }
  return el;
}
function select(opts) {
  const el = document.createElement("select");
  el.className = "lmb-input lmb-select";
  if (opts.ariaLabel)
    el.setAttribute("aria-label", opts.ariaLabel);
  for (const o of opts.options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.disabled)
      opt.disabled = true;
    if (o.value === opts.value)
      opt.selected = true;
    el.appendChild(opt);
  }
  el.value = opts.value;
  if (opts.onChange)
    el.addEventListener("change", () => opts.onChange?.(el.value));
  return el;
}
function checkbox(opts) {
  const label = document.createElement("label");
  label.className = "lmb-check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = opts.checked;
  const body = document.createElement("div");
  body.className = "lmb-check-body";
  const lbl = document.createElement("div");
  lbl.className = "lmb-check-label";
  lbl.textContent = opts.label;
  body.appendChild(lbl);
  if (opts.hint) {
    const hint = document.createElement("div");
    hint.className = "lmb-check-hint";
    hint.textContent = opts.hint;
    body.appendChild(hint);
  }
  label.append(input, body);
  if (opts.onChange)
    input.addEventListener("change", () => opts.onChange?.(input.checked));
  return label;
}
function multiSelect(opts) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-multiselect";
  if (opts.options.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lmb-empty";
    empty.textContent = opts.emptyText ?? t("ui.components.multiSelect.nothingToPick");
    wrap.appendChild(empty);
    return wrap;
  }
  const sel = new Set(opts.selected);
  for (const o of opts.options) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = sel.has(o.value);
    const span = document.createElement("span");
    span.textContent = o.label;
    row.append(cb, span);
    cb.addEventListener("change", () => {
      if (cb.checked)
        sel.add(o.value);
      else
        sel.delete(o.value);
      opts.onChange?.(Array.from(sel));
    });
    wrap.appendChild(row);
  }
  return wrap;
}
function makeButton(label, onClick, opts = {}) {
  const btn = document.createElement("button");
  const classes = ["lmb-btn"];
  if (opts.primary)
    classes.push("primary");
  if (opts.danger)
    classes.push("danger");
  if (opts.small)
    classes.push("small");
  btn.className = classes.join(" ");
  btn.textContent = label;
  btn.disabled = !!opts.disabled;
  btn.type = "button";
  if (opts.title)
    btn.title = opts.title;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (btn.disabled)
      return;
    onClick();
  });
  return btn;
}
function section(title) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-section";
  const head = document.createElement("div");
  head.className = "lmb-section-title";
  head.append(document.createTextNode(title));
  wrap.appendChild(head);
  const body = document.createElement("div");
  body.className = "lmb-collapsible-body";
  wrap.appendChild(body);
  return { wrap, body, head };
}
function field(label) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = label;
  wrap.appendChild(lbl);
  const body = document.createElement("div");
  body.className = "lmb-field-body";
  wrap.appendChild(body);
  return { wrap, body };
}
function labelled(label, child) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = label;
  wrap.appendChild(lbl);
  wrap.appendChild(child);
  return wrap;
}
function pill(text, tone) {
  const el = document.createElement("span");
  el.className = `lmb-pill${tone ? " " + tone : ""}`;
  el.textContent = text;
  return el;
}
function makeSubtabs(defs, active, onPick) {
  const bar = document.createElement("div");
  bar.className = "lmb-subtabs";
  for (const d of defs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `lmb-subtab${d.key === active ? " active" : ""}`;
    btn.textContent = d.label;
    lessonMark(btn, `subtab.${d.key}`);
    btn.addEventListener("click", () => {
      if (d.key !== active)
        onPick(d.key);
    });
    bar.appendChild(btn);
  }
  return bar;
}
function statTile(value, label, sub, tooltip) {
  const tile = document.createElement("div");
  tile.className = "lmb-tile";
  if (tooltip)
    tile.title = tooltip;
  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = value;
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = label;
  tile.append(v, l);
  if (sub) {
    const s = document.createElement("div");
    s.className = "lmb-tile-sub";
    s.textContent = sub;
    tile.appendChild(s);
  }
  return tile;
}
function searchField(opts) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-search-row";
  const glyph = document.createElement("span");
  glyph.className = "lmb-search-glyph";
  glyph.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "lmb-search-input";
  input.value = opts.value;
  if (opts.placeholder)
    input.placeholder = opts.placeholder;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "lmb-search-clear";
  clear.textContent = t("ui.components.searchField.value");
  clear.title = t("ui.components.searchField.clearSearch");
  clear.setAttribute("aria-label", t("ui.components.searchField.clearSearch"));
  const syncClear = () => {
    clear.style.visibility = input.value ? "visible" : "hidden";
  };
  syncClear();
  input.addEventListener("input", () => {
    syncClear();
    opts.onChange(input.value);
  });
  clear.addEventListener("click", () => {
    input.value = "";
    syncClear();
    opts.onChange("");
    input.focus();
  });
  wrap.append(glyph, input, clear);
  return { wrap, input };
}
function scrollPaneTop(el) {
  const sc = findScrollingAncestor(el);
  if (sc)
    sc.scrollTop = 0;
  else
    window.scrollTo(0, 0);
}
function relativeTime(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60)
    return t("ui.components.relativeTime.justNow");
  const m = Math.floor(s / 60);
  if (m < 60)
    return t("ui.components.relativeTime.mAgo", { m });
  const h = Math.floor(m / 60);
  if (h < 48)
    return t("ui.components.relativeTime.hAgo", { h });
  return t("ui.components.relativeTime.dAgo", { floor: Math.floor(h / 24) });
}
function textNode(text, className) {
  const el = document.createElement("div");
  if (className)
    el.className = className;
  el.textContent = text;
  return el;
}
function span(text, className) {
  const el = document.createElement("span");
  if (className)
    el.className = className;
  el.textContent = text;
  return el;
}
function formatTokens(n) {
  if (n >= 1000)
    return t("ui.components.formatTokens.thousands", { value: (n / 1000).toFixed(1) });
  return String(n);
}
function findScrollingAncestor(el) {
  let cur = el?.parentElement ?? null;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const style = getComputedStyle(cur);
    const oy = style.overflowY;
    if (oy === "auto" || oy === "scroll")
      return cur;
    cur = cur.parentElement;
  }
  return null;
}
function collectScrollableDescendants(root) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  while (node) {
    if (node !== root && node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll")
        out.push(node);
    }
    node = walker.nextNode();
  }
  return out;
}
function preserveScroll(anchor, fn) {
  if (!anchor) {
    fn();
    return;
  }
  const ancestor = findScrollingAncestor(anchor);
  const ancestorScroll = ancestor ? ancestor.scrollTop : 0;
  const innerBefore = collectScrollableDescendants(anchor).map((el) => el.scrollTop);
  fn();
  if (ancestor && ancestorScroll > 0)
    ancestor.scrollTop = ancestorScroll;
  const innerAfter = collectScrollableDescendants(anchor);
  if (innerAfter.length === innerBefore.length) {
    for (let i = 0;i < innerAfter.length; i++) {
      if (innerBefore[i] > 0)
        innerAfter[i].scrollTop = innerBefore[i];
    }
  }
}
var HIDDEN_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 4.22-5.42"/><path d="M22.54 16.88A10.94 10.94 0 0 0 23 12s-4-8-11-8a10.84 10.84 0 0 0-5.34 1.4"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
function lessonMark(el, id) {
  el.dataset["lesson"] = id;
  return el;
}
var TOAST_STACK_CAP = 5;
function showToast(tone, text) {
  if (tone === "error" || tone === "warn")
    reportUi("receive", { code: "failed", op: "toast" });
  let stack = document.body.querySelector(":scope > .lmb-toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "lmb-toast-stack";
    document.body.appendChild(stack);
  }
  while (stack.childElementCount >= TOAST_STACK_CAP) {
    stack.firstElementChild?.remove();
  }
  const el = document.createElement("div");
  el.className = `lmb-toast lmb-toast-${tone}`;
  el.textContent = text;
  stack.appendChild(el);
  const duration = tone === "error" ? 8000 : tone === "warn" ? 6000 : 4000;
  setTimeout(() => {
    el.classList.add("lmb-toast-leaving");
    setTimeout(() => el.remove(), 200);
  }, duration);
}

// src/prompts/codex/directives.txt
var directives_default = `You are Memoria's archivist. You maintain the Knowledge Codex: a set of JSON files that together form the complete story bible of a roleplay. The codex is the one comprehensive ledger of every durable element the story has established: every character, place, and object of consequence, every standing relationship, every dated event, every open storyline, every world rule, every secret and asymmetry of knowledge. If a durable story fact is not in the codex, it is lost. You will receive the current codex files and new story material. Update the codex so that nothing the story has established is missing, outdated, or bloated.

For normal updates, you see a WINDOW, not the whole story:
- The turns you receive are only the newest slice of a much longer story. Everything before them was already read and encoded by earlier passes.
- Records you do not recognize come from that unseen past. They are not wrong. Never rewrite or drop a record because the visible turns do not mention it.
- One exception: a record that breaks the schema rules is always yours to fix,
  whether or not the visible turns mention it. Malformed is not the same as
  unfamiliar.
- A STORY SO FAR block, when provided, holds summaries of turns already recorded. Use it to ground your understanding of the new turns, never as new material to add.
- Activated lore, when provided, is reference canon: use it for names, spellings, and established facts, but never copy it into the codex. The codex records only what the STORY establishes, changes, or contradicts.

For normal updates, work through three passes in your scratchpad (see the output protocol) or in your head before writing anything:
1. UPDATE - walk the sections one by one (characters, locations, things, relations, timeline, threads, world, knowledge) and ask of each: what do the new turns add or change here? Patch every record they outdate and add everything new and durable. Be exhaustive. A concept the story established that never lands in the codex is a permanent loss.
2. SWEEP - re-read every record the new turns touch on and verify nothing stale survived. Stale information is forbidden: a claim the story has moved past must be corrected the moment you see it. Absence from the visible turns is NOT staleness.
3. COMPRESS - tighten the wording of everything you are about to write. Terse phrases beat sentences, no filler words. Compression trims wording, never content: dropping a durable fact to save tokens is failure, and so is padding a record with prose.

Completeness bar (the ledger standard):
- Every plot-relevant character, location, and thing has a sheet, and each sheet carries its durable facts in detail, not a summary line. A name alone is not enough: a person or place the story merely mentions in passing does not get a sheet.
- Every standing connection that matters to the plot is encoded.
- Every major event lands on the timeline under the story's own dating.
- Every unresolved storyline and every planted detail that is still live is tracked in threads.
- Every rule of the world and every who-knows-what gap that shapes the plot is recorded.
- When in doubt whether something is durable enough to record: leave it out. The codex holds the small set of things the story cannot be understood without, not everything it has mentioned.

Snapshot rules:
- The codex describes the present. When something previously defined is seen to change in the given snippet, REPLACE the old text entirely. Be aware that there may be information in the codex describing facts that are not seen or talked about in the given snippet. You may leave those intact as they are likely a past event that did not change.
- Never leave edit residue: no "was X, now Y", no "formerly", no "updated:", no strikethrough hints, no references to previous versions of the codex.
- Story history is not edit residue. Past events belong on the timeline; secrets may concern past events.
- Record only what is durable. Skip anything that will change again within a scene or two: poses, moods, weather, transient scene staging, and verbatim dialogue unless a line is genuinely load-bearing.
- Follow each schema's ownership rules. Repeat only the identifying context needed to express a relationship or knowledge gap.
- Omit empty optional fields entirely if you are not adding to them.
`;

// src/prompts/codex/schema/entities-table.txt
var entities_table_default = `{{ENTITY_FILES}}
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Entity sheets describe ONLY the entity itself,
and only its stable, medium-to-long-lived facts - never the state of the current
scene. Never put relationship info on a sheet, that lives in relations.json. An
entity carrying "locked": true is user-owned: never set or drop it.
The sheet is where the substance goes. Fill the fields the story has actually
established, in specific detail: what this entity is, looks like, wants, and why
it matters. Write "Unknown" only when the story genuinely has not said. A sheet
that misses a story-relevant attribute has lost it. Detail belongs in these
fields, never in the keywords list.`;

// src/prompts/codex/schema/entities-inline.txt
var entities_inline_default = `{{ENTITY_FILES}}
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "",
  "ties"?: ["loves Mara, hides it", "owns the silver locket", "hiding at Ashford Manor"], "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Sheets hold only stable, medium-to-long-lived
facts, never the state of the current scene. An entity carrying "locked": true
is user-owned: never set or drop it.
The sheet is where the substance goes. Fill the fields the story has actually
established, in specific detail: what this entity is, looks like, wants, and why
it matters. Write "Unknown" only when the story genuinely has not said. A sheet
that misses a story-relevant attribute has lost it. Detail belongs in these
fields, never in the keywords list.
Relationships live in each entity's "ties"
list as short present-tense notes - to other characters, to things, and to
places alike. Do NOT write relations.json, it is disabled.
Ties coverage: include established, durable, plot-relevant connections to side
characters, places, and things as well as the lead. No minimum per entity. Phrase
ties as standing arrangements that survive scene changes ("owes her a life
debt"), not moment-of-scene notes. Each pass, rewrite any tie the new turns have
outdated: a stale tie is an error, never leave one standing.
`;

// src/prompts/codex/schema/relations.txt
var relations_default = `relations.json
{ "relations": [
  { "rid": "r1", "type": "pair", "a": "char:elias", "b": "char:mara", "kind": "bond",
    "state": "loves her, hides it", "history"?: ["day 12: she saw him kill"] },
  { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:ashford_manor", "kind": "at",
    "state": "hiding in the attic since the murder" },
  { "rid": "r3", "type": "group", "kind": "pact", "members": ["char:a","char:b","char:c"],
    "state": "non-aggression, signed day 12", "roles"?: { "loc:manor": "where" } } ] }
Rows connect ANY entities, not just characters: character-character (bond,
rival, kin), character-thing (owns, seeks, guards), character-location (at,
rules, banished_from), thing-location (hidden_at). Whenever an entity sheet is
tempted to mention another entity, that connection belongs here instead.
Prefer ONE group row whenever a fact is genuinely shared by several entities
(a faction, a pact, a household): it replaces a pile of
redundant pairs and keeps future edits to one row. Use a pair only when the
relationship is purely binary or directional a->b (two pair rows when the two
sides differ). Never store how one member individually feels about another
inside a group row - that stance is its own pair.

Relations coverage (mandatory):
- Include established, durable, plot-relevant connections between side
  characters, places, and things as well as the lead. No minimum per entity.
- Write "state" to survive the story moving on: name the standing arrangement
  ("owes her a life debt", "banned from the guildhall"), not the scene of the
  moment ("currently arguing in the kitchen"). Anchor pivotal shifts in
  "history" using the story's own dates so the row stays meaningful as it ages.
- Keep every row CURRENT. Each pass, re-check the rows touching the entities in
  the new turns and rewrite any state the story has outdated (demote the old
  state to "history" only when the shift is pivotal). A row that no longer holds
  is stale data: correct it, never leave it standing.
`;

// src/prompts/codex/schema/timeline.txt
var timeline_default = `timeline.json
{ "events": [ { "rid": "r1", "when": "day 12", "event": "Mara sees Elias kill the duke",
  "participants"?: ["char:mara","char:elias"], "where"?: "loc:ashford_manor",
  "causes"?: "she flees the city" } ] }
Major events only, oldest first. "when" uses the story's own reckoning. The
timeline is APPEND-ONLY: record new events as set rows without a rid, and
never rewrite or drop existing events - history does not change behind the
story. Editing an existing row is reserved for an outright factual error or
a reference the validator flags; removals happen only in reconcile or tidy
passes.
A "char:"/"loc:"/"thing:" ref must name an entity that actually has a sheet.
For anyone or anywhere without one, write plain text instead: "the city guard",
"a roadside inn", not "char:the guard".`;

// src/prompts/codex/schema/threads.txt
var threads_default = `threads.json
{ "threads": [ { "rid": "r1", "name": "The stolen crown", "status": "open|stalled|resolved|abandoned",
  "summary": "", "latest"?: "", "planted"?: ["the pawnbroker kept a receipt"] } ],
  "seeds": ["unexplained scar on the ferryman's hand"] }
Threads are storylines. planted/seeds are Chekhov setups awaiting payoff. A
thread you mark resolved leaves your view from the next pass on - the app
archives it for the user - so never re-add a storyline you already resolved.`;

// src/prompts/codex/schema/world.txt
var world_default = `world.json
{ "entries": [ { "rid": "r1", "topic": "Magic", "facts": ["blood magic costs memories", ...],
  "keywords": ["ritual", "memories", "blood magic"] } ] }
Rules and lore true of the WORLD itself, not any single entity's state. A topic
needs at least one fact - drop the topic when its last fact goes.`;

// src/prompts/codex/schema/knowledge.txt
var knowledge_default = `knowledge.json
{ "items": [ { "rid": "r1", "fact": "Elias killed the duke",
  "knownBy"?: ["char:mara"], "hiddenFrom"?: ["char:captain"],
  "falseBeliefs"?: [{ "who": "char:captain", "believes": "bandits did it" }],
  "note"?: "",
  "keywords": ["murder", "dagger", "duke"] } ] }
ONLY asymmetric knowledge: secrets, false beliefs, who-knows-what gaps. Every
item needs knownBy, hiddenFrom, or falseBeliefs. Facts every character knows
belong in world or timeline, never here.
"fact" is the TRUE THING, stated plainly and positively. Never write someone's
ignorance as the fact - the ignorance is what hiddenFrom is for. So:
  WRONG: fact "Lilian doesn't know Haru was in the stone room", knownBy Lilian
  RIGHT: fact "Haru was held in the stone room", hiddenFrom Lilian
An item with nobody in knownBy is fine: a secret only the reader has seen is
still a secret.
knownBy and hiddenFrom list WHO, nothing else. Just the person or group:
"char:mara", "the household staff". Never a sentence about what they know
("lilian does NOT know") - hiddenFrom already means they do not know. A name
belongs in exactly one of the two lists, never both.
A "char:"/"loc:"/"thing:" ref must name an entity that actually has a sheet.
For anyone without one - a group, a crowd, an unnamed bystander - write plain
text instead: "the household staff", "everyone at court", not "char:the staff".
Inventing a ref for something that has no sheet is the one error to avoid here.`;

// src/prompts/codex/schema/keywords.txt
var keywords_default = `Retrieval keywords (hard limit 12):
Every entity sheet, world entry, and knowledge item carries a "keywords" list of
usually 4-12 supported tags; use fewer when appropriate, never filler to meet a minimum.
Keywords help retrieve each record's lorebook entry. Anything past 12 is DISCARDED
by the app, so a bloated list does not help retrieval, it just wastes your output.
Rules:
- ONE OR TWO WORDS each. Three or more words is discarded. No phrases, no
  sentence fragments, no "the ..." constructions.
- Single words the story will plausibly say: "locket", "duke", "tower", "murder".
  Use two words only when one would be ambiguous ("north tower" when several
  towers exist).
- Concrete nouns tied to THIS record: places, objects, epithets, events.
- Pick for RECALL, not coverage. A dozen strong tags beat a hundred weak ones.
  A record that matches everything is a record that means nothing.
- The record's own name, aliases, and topic (and a knowledge item's participants)
  match automatically - never repeat them as keywords.
- Never list other characters, other locations, or the whole cast: those records
  carry their own keywords and will retrieve themselves.
- No abstract themes (love, betrayal, tension), no filler verbs, no plot summary.
- Keep keywords current: when a record's contents change, re-check its keywords.

Keywords are for FINDING the record, never for storing what it says. Every fact
belongs in the record's own fields, written out in full.
timeline.json and threads.json need no keywords, they are always in the prompt.
`;

// src/prompts/codex/protocol/patch-rules.txt
var patch_rules_default = `- "set": only new or changed rows, each COMPLETE on its own. To update an existing row, keep its exact entity "id" or "rid". Omit "rid" only for a new record that is not already represented in the file. Every untouched row survives without being resent.
- Compare against the current codex before writing. Repeating or paraphrasing an already-established fact is not a change. Changes in truth, certainty, or who knows it update the existing row, not a new copy.
- "drop": keys (ids or rids) of rows to delete.
- "seeds": threads.json only, replaces the whole seeds list when provided.
- "content": the COMPLETE new file, replacing everything in it. Only for a ground-up rewrite of most of a file; never combine it with set or drop.
`;

// src/prompts/codex/protocol/tools.txt
var tools_default = `Tools:
- codex_write(file, set?, drop?, seeds?, content?): edit one file.
{{PATCH_RULES}}
- codex_skip(files, reason): declare that the listed files need no change from this material.
- codex_done(note): call when the codex is current.

You must account for EVERY file. Write files that need additions, corrections, or removals; name unchanged files in codex_skip. A file can be mentioned in the new story and still need no change. Skipping preserves its contents and counts as completing it. If all files are unchanged, skip all of them and call codex_done without any codex_write calls. codex_done is refused while any file is unaccounted for.

Scratchpad: you may think before you act. If you do not reason natively, put ALL of your planning inside one <think>...</think> block first and walk the three passes there, section by section. Nothing inside the block is parsed or saved. Be extremely comprehensive and detailed, 1000+ tokens. Once your plan covers every section, stop planning and emit the calls.

Emit all codex_write and codex_skip calls plus codex_done together in a single response - they run as one batch.

Do not narrate outside the scratchpad, do not explain your edits, just call the tools.
A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.
`;

// src/prompts/codex/protocol/tools-sequential.txt
var tools_sequential_default = `Tools:
- codex_write(file, set?, drop?, seeds?, content?): edit ONE file.
{{PATCH_RULES}}
- codex_skip(files, reason): declare that the listed files need no change from this material.
- codex_done(note): call when every file has been written or skipped.

You must account for EVERY file before finishing. Each file is either written with codex_write or named in a codex_skip. Nothing else ends the update, and codex_done is refused while any file is unaccounted for. After each response you will be told what is still outstanding.

Write files that need additions, corrections, or removals; name unchanged files in codex_skip. A file can be mentioned in the new story and still need no change. Skipping preserves its contents and counts as completing it. You can skip several unchanged files in one response. If all files are unchanged, skip all of them and call codex_done without any codex_write calls.

Take changed files one at a time. Write a single changed file per response and give it your full attention and detail, then handle the next one when asked. Writing several at once is allowed only if every one of them still gets that same depth.

Scratchpad: you may think before you act. If you do not reason natively, put ALL of your planning inside one <think>...</think> block first. Nothing inside the block is parsed or saved. Plan the file you are about to write, section by section, in detail. Once your plan covers that file, stop planning and emit the call.

Example response (shape only):
  codex_write(file: "timeline", set: [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ])

Example of finishing up, once everything else is already written:
  codex_skip(files: ["world", "knowledge"], reason: "no new rules or secrets in these turns")
  codex_done(note: "recorded Mara's flight and the locket's origin")

Do not narrate outside the scratchpad, do not explain your edits, just call the tools.
A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.
`;

// src/prompts/codex/protocol/json.txt
var json_default = `Output protocol (JSON only, no tools):

Scratchpad: you may think before you answer. Put ALL of your planning inside one <think>...</think> block at the very top of your reply and walk the three passes there, section by section. Nothing inside the block is parsed or saved, and planning must never appear outside it. Be extremely comprehensive and detailed, 1000+ tokens. If you reason natively, skip the block. Once your plan covers every section, stop planning and write.

After the optional <think> block, respond with exactly ONE JSON object and nothing else, in this shape:
{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "skip": ["world"], "done": true, "note": "one short line on what changed" }
"writes" holds one item per file you change. Each item may carry:
{{PATCH_RULES}}
- "skip": the files that need no change from this material.
- Set "done": true when the codex is current.

You must account for EVERY file. Write files that need additions, corrections, or removals; name unchanged files in "skip". A file can be mentioned in the new story and still need no change. Skipping preserves its contents and counts as completing it. If all files are unchanged, return "writes": [], list all of them in "skip", and set "done": true. "done" is refused while any file is unaccounted for.

No prose outside the <think> block and the JSON object.
A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.
`;

// src/prompts/codex/protocol/json-sequential.txt
var json_sequential_default = `Output protocol (JSON only, no tools):

You must account for EVERY file before finishing. Each file is either written in "writes" or named in "skip". Nothing else ends the update, and "done" is refused while any file is unaccounted for. After each reply you will be told what is still outstanding.

Take changed files one at a time. Put a SINGLE changed file in "writes" per reply and give it your full attention and detail, then handle the next one when asked. Several at once is allowed only if every one of them still gets that same depth. A reply that tries to carry every file at once is the one most likely to be cut off mid-JSON and lost entirely.

Write files that need additions, corrections, or removals; name unchanged files in "skip". A file can be mentioned in the new story and still need no change. Skipping preserves its contents and counts as completing it. You can skip several unchanged files in one reply. If all files are unchanged, return "writes": [], list all of them in "skip", and set "done": true.

Scratchpad: you may think before you answer. Put ALL of your planning inside one <think>...</think> block at the very top of your reply, and planning must never appear outside it. Nothing inside the block is parsed or saved. Plan the file you are about to write, section by section, in detail. If you reason natively, skip the block.

After the optional <think> block, respond with exactly ONE JSON object and nothing else, in this shape:
{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "skip": [], "done": false }
"writes" holds the file you are changing this reply. Each item may carry:
{{PATCH_RULES}}
- "skip": the files that need no change from this material.
- "done": true only once every file has been written or skipped. Add "note" with one short line on what changed.

Example reply (shape only):
<think>timeline: Mara's flight on day 14 is a major event and is not recorded yet. Writing timeline this reply.</think>
{ "writes": [
  { "file": "timeline", "set": [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ] }
], "skip": [], "done": false }

Example of finishing up, once everything else is already written:
{ "writes": [], "skip": ["world", "knowledge"], "done": true, "note": "recorded Mara's flight and the locket's origin" }

No prose outside the <think> block and the JSON object.
A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.
`;

// src/prompts/codex/passes/update.txt
var update_default = `<<TASK>>
The story material ends above. Update the codex now: walk the three passes in your scratchpad or head (UPDATE every outdated or missing record section by section, SWEEP what the new turns contradict, COMPRESS your wording), then emit the complete batch of writes. Be comprehensive. This ledger is the story's only durable memory, and anything you leave unrecorded is lost.`;

// src/prompts/codex/passes/verify.txt
var verify_default = `Verification pass: correct stale claims the new turns contradict and compress any row that carries bloat, within each file's edit restrictions.
`;

// src/prompts/codex/passes/tidy.txt
var tidy_default = `TIDY PASS: no new story turns this time. Rewrite the target files into fewer, cohesive records: consolidate related entries, strip repetition, and remove details that no longer carry plot weight. Reassess relevance against the current Codex rather than preserving every old row. Keep facts and distinctions that future scenes need: causal turning points, active goals, unresolved consequences, meaningful relationship changes, and consequential differences in who knows what. Do not invent events, dates, resolutions, or knowledge transfers to justify compaction. Keep every schema exactly as specified.

A tidy is a ground-up rewrite: send each improved file as complete new "content" (not set/drop patches).

Merging or removing rows is allowed in this pass, including timeline rows. Preserve their plot-relevant information in the consolidated records; do not just shorten every small row and leave the fragmented structure intact. Respect locked content and never rewrite files outside the target list. A category can become empty if none of its remaining records is useful.

While you are in there: any target entity sheet, world entry, or knowledge item missing its "keywords" list gets one, following the retrieval keyword rules.
`;

// src/prompts/codex/passes/refresh.txt
var refresh_default = 'REFRESH PASS: the user re-enabled {{TARGET_FILES}} after {{IT_THEY}} missed updates, so {{LAG_PHRASE}} the story. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the story, keeping every schema exactly as specified. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/rebuild.txt
var rebuild_default = 'REBUILD PASS: the user asked to rebuild {{TARGET_FILES}} from scratch. The target files appear empty below, and anything still shown in them is user-locked: reproduce it untouched. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the whole story, keeping every schema exactly as specified. Keep entity ids stable, other files may reference them. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/reconcile.txt
var reconcile_default = "RECONCILE SWEEP: messages were edited or deleted behind the codex and no unread turns remain. The story's CURRENT state arrives {{STORY_SHAPE}}. Verify every claim in every file against it and correct or drop anything the current story no longer supports. Files that still hold need no write.";

// src/prompts/codex/passes/catchup-fast.txt
var catchup_fast_default = "CATCH-UP FROM SUMMARIES: the story below is compressed chapter summaries covering {{CHUNK_LABEL}}, not raw turns (raw turns appear only where no chapter covers a span). Update the codex from them. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/passes/catchup-ultra.txt
var catchup_ultra_default = "CATCH-UP: this single pass covers {{CHUNK_LABEL}}. {{STORY_SHAPE}} Update the codex to reflect ALL of it. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/notes/partial-story.txt
var partial_story_default = "PARTIAL VIEW: the story turns below are only the newest slice of a longer story. Everything earlier was already encoded by previous passes, so records you do not recognize come from that unseen past and are not wrong. Correct only what these turns actually contradict, never what they simply do not mention.";

// src/prompts/codex/notes/reconcile.txt
var reconcile_default2 = "RECONCILE: the story was edited or regenerated behind the codex. Statements in the codex may describe events that no longer happened. Treat the codex as suspect, verify its claims against the turns below, and correct anything the current story contradicts.";

// src/prompts/codex/notes/migrate-table.txt
var migrate_table_default = 'MIGRATE: the relations table was just enabled. Lift every "ties" note off the entity sheets into relations.json rows, then remove all "ties" fields.';

// src/prompts/codex/notes/migrate-inline.txt
var migrate_inline_default = 'MIGRATE: the relations table was just disabled. Fold relations.json into short "ties" notes on the involved entity sheets. Do not write relations.json.';

// src/prompts/codex/notes/repair.txt
var repair_default = `REPAIR: these files were invalid on disk and are shown empty: {{FILES}}. Reconstruct only facts supported by the supplied story.
`;

// src/prompts/codex/notes/locked.txt
var locked_default = "LOCKED: the user owns these entities, do NOT set or drop them: {{IDS}}.";

// src/prompts/codex/notes/locked-fields.txt
var locked_fields_default = `LOCKED FIELDS: field values shown as "Locked, do not edit" are user-owned and hidden from you ({{IDS}}). When you resend such a row, keep the "Locked, do not edit" value or omit the field entirely - the app restores the user's real value either way.
`;

// src/prompts/codex/registry.ts
var CODEX_DIRECTIVES_DEFAULT = directives_default;
var SCHEMA_HOWTO_TAIL = t("prompts.codex.registry.schemaHowtoTail");
var CODEX_TEMPLATES = [
  {
    key: "schema_entities_table",
    label: t("prompts.codex.registry.codexTemplates.entitySheetsRelationsTableOn"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesCharactersJsonLocationsJsonAndThings", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [{ token: "{{ENTITY_FILES}}", meaning: t("prompts.codex.registry.codexTemplates.theEntityFilesActiveThisRunE") }],
    defaultText: entities_table_default
  },
  {
    key: "schema_entities_inline",
    label: t("prompts.codex.registry.codexTemplates.entitySheetsRelationsTableOff"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesTheEntityFilesWhenTheRelations", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [{ token: "{{ENTITY_FILES}}", meaning: t("prompts.codex.registry.codexTemplates.theEntityFilesActiveThisRun") }],
    defaultText: entities_inline_default
  },
  {
    key: "schema_relations",
    label: t("prompts.codex.registry.codexTemplates.relationsTable"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesRelationsJsonAndTheCoverageRules", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: relations_default
  },
  {
    key: "schema_timeline",
    label: t("prompts.codex.registry.codexTemplates.timeline"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesTimelineJsonIncludingTheAppendOnly", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: timeline_default
  },
  {
    key: "schema_threads",
    label: t("prompts.codex.registry.codexTemplates.threads"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesThreadsJsonResolvedThreadsAreArchived", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: threads_default
  },
  {
    key: "schema_world",
    label: t("prompts.codex.registry.codexTemplates.worldRules"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesWorldJson", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: world_default
  },
  {
    key: "schema_knowledge",
    label: t("prompts.codex.registry.codexTemplates.secrets"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.describesKnowledgeJsonTheValidatorRejectsItems", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: knowledge_default
  },
  {
    key: "schema_keywords",
    label: t("prompts.codex.registry.codexTemplates.retrievalKeywords"),
    group: "File schemas",
    howTo: t("prompts.codex.registry.codexTemplates.theRulesForTheKeywordsListsOn"),
    vars: [],
    defaultText: keywords_default
  },
  {
    key: "protocol_patch_rules",
    label: t("prompts.codex.registry.codexTemplates.patchRulesSetDropContent"),
    group: "Write protocol",
    howTo: t("prompts.codex.registry.codexTemplates.theSharedExplanationOfSetDropSeeds"),
    vars: [],
    defaultText: patch_rules_default
  },
  {
    key: "protocol_tools",
    label: t("prompts.codex.registry.codexTemplates.protocolToolCalls"),
    group: "Write protocol",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenTheProfileUsesToolCalls"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: t("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: tools_default
  },
  {
    key: "protocol_tools_sequential",
    label: t("prompts.codex.registry.codexTemplates.protocolToolCallsOneFileAtA"),
    group: "Write protocol",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenTheProfileUsesToolCalls2"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: t("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: tools_sequential_default
  },
  {
    key: "protocol_json",
    label: t("prompts.codex.registry.codexTemplates.protocolJsonMode"),
    group: "Write protocol",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenTheProfileWritesStrictJson"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: t("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: json_default
  },
  {
    key: "protocol_json_sequential",
    label: t("prompts.codex.registry.codexTemplates.protocolJsonModeOneFileAtA"),
    group: "Write protocol",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenTheProfileWritesStrictJson2"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: t("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: json_sequential_default
  },
  {
    key: "pass_update",
    label: t("prompts.codex.registry.codexTemplates.taskClosingBlock"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.theClosingBlockOfEveryNormalUpdate"),
    vars: [],
    defaultText: update_default
  },
  {
    key: "pass_verify",
    label: t("prompts.codex.registry.codexTemplates.verificationNudge"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.sentAsAnExtraRoundAfterA"),
    vars: [],
    defaultText: verify_default
  },
  {
    key: "pass_tidy",
    label: t("prompts.codex.registry.codexTemplates.tidyPass"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.theInstructionBlockForTidyUpThe"),
    vars: [],
    defaultText: tidy_default
  },
  {
    key: "pass_refresh",
    label: t("prompts.codex.registry.codexTemplates.refreshPass"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenReEnabledRecordsCatchUp"),
    vars: [
      { token: "{{TARGET_FILES}}", meaning: t("prompts.codex.registry.codexTemplates.theFilesBeingRefreshed") },
      { token: "{{IT_THEY}}", meaning: t("prompts.codex.registry.codexTemplates.itOrTheyToMatchTheTarget") },
      { token: "{{LAG_PHRASE}}", meaning: t("prompts.codex.registry.codexTemplates.itLagsOrTheyLagToMatch") },
      { token: "{{STORY_SHAPE}}", meaning: t("prompts.codex.registry.codexTemplates.howTheStoryInputIsArrangedE") }
    ],
    defaultText: refresh_default
  },
  {
    key: "pass_rebuild",
    label: t("prompts.codex.registry.codexTemplates.rebuildPass"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenACategorySRebuildButton"),
    vars: [
      { token: "{{TARGET_FILES}}", meaning: t("prompts.codex.registry.codexTemplates.theFilesBeingRebuilt") },
      { token: "{{STORY_SHAPE}}", meaning: t("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") }
    ],
    defaultText: rebuild_default
  },
  {
    key: "pass_reconcile",
    label: t("prompts.codex.registry.codexTemplates.reconcileSweep"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.sentWhenMessagesWereDeletedBehindThe"),
    vars: [{ token: "{{STORY_SHAPE}}", meaning: t("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") }],
    defaultText: reconcile_default
  },
  {
    key: "pass_catchup_fast",
    label: t("prompts.codex.registry.codexTemplates.fastCatchUp"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.thePreambleForEachFastCatchUp"),
    vars: [{ token: "{{CHUNK_LABEL}}", meaning: t("prompts.codex.registry.codexTemplates.theMessageRangeThisBatchCovers") }],
    defaultText: catchup_fast_default
  },
  {
    key: "pass_catchup_ultra",
    label: t("prompts.codex.registry.codexTemplates.ultraCatchUp"),
    group: "Pass instructions",
    howTo: t("prompts.codex.registry.codexTemplates.thePreambleForTheSinglePassUltra"),
    vars: [
      { token: "{{CHUNK_LABEL}}", meaning: t("prompts.codex.registry.codexTemplates.theMessageRangeCovered") },
      { token: "{{STORY_SHAPE}}", meaning: t("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") }
    ],
    defaultText: catchup_ultra_default
  },
  {
    key: "note_partial_story",
    label: t("prompts.codex.registry.codexTemplates.partialViewGuard"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedToEveryNormalUpdateTheAgent"),
    vars: [],
    defaultText: partial_story_default
  },
  {
    key: "note_reconcile",
    label: t("prompts.codex.registry.codexTemplates.reconcileWarning"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedWhenEditsOrDeletionsWereDetected"),
    vars: [],
    defaultText: reconcile_default2
  },
  {
    key: "note_migrate_table",
    label: t("prompts.codex.registry.codexTemplates.migrationToRelationsTable"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedOnTheFirstRunAfterThe"),
    vars: [],
    defaultText: migrate_table_default
  },
  {
    key: "note_migrate_inline",
    label: t("prompts.codex.registry.codexTemplates.migrationToInlineTies"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedOnTheFirstRunAfterThe2"),
    vars: [],
    defaultText: migrate_inline_default
  },
  {
    key: "note_repair",
    label: t("prompts.codex.registry.codexTemplates.repairWarning"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedWhenFilesOnDiskWereUnreadable"),
    vars: [{ token: "{{FILES}}", meaning: t("prompts.codex.registry.codexTemplates.theUnreadableFiles") }],
    defaultText: repair_default
  },
  {
    key: "note_locked",
    label: t("prompts.codex.registry.codexTemplates.lockedEntities"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedWhenEntitiesAreLockedTheApp"),
    vars: [{ token: "{{IDS}}", meaning: t("prompts.codex.registry.codexTemplates.theLockedEntityIds") }],
    defaultText: locked_default
  },
  {
    key: "note_locked_fields",
    label: t("prompts.codex.registry.codexTemplates.lockedFields"),
    group: "Run notes",
    howTo: t("prompts.codex.registry.codexTemplates.prependedWhenIndividualFieldsAreLockedOn"),
    vars: [{ token: "{{IDS}}", meaning: t("prompts.codex.registry.codexTemplates.theEntitiesCarryingLockedFields") }],
    defaultText: locked_fields_default
  }
];
var CODEX_TEMPLATE_KEYS = CODEX_TEMPLATES.map((t) => t.key);
var BY_KEY = new Map(CODEX_TEMPLATES.map((t) => [t.key, t]));

// src/shared.ts
var CODEX_FILE_KEYS = [
  "characters",
  "locations",
  "things",
  "relations",
  "timeline",
  "threads",
  "world",
  "knowledge"
];
var STORAGE_VERSION = 7;
var TIER_KINDS = ["chapter", "arc", "volume", "series", "saga", "library", "universe"];
var TIER_NAMES = [t("shared.tierNames.chapter"), t("shared.tierNames.arc"), t("shared.tierNames.volume"), t("shared.tierNames.series"), t("shared.tierNames.saga"), t("shared.tierNames.library"), t("shared.tierNames.universe")];
var HIGHER_TIERS = [3, 4, 5, 6, 7];
function defaultHigherTiers() {
  return Object.fromEntries(HIGHER_TIERS.map((tier) => [tier, {
    enabled: false,
    unit: "entries",
    batch: 6,
    lag: 2,
    targetUnit: "percent",
    targetPercent: 25,
    targetTokens: 3000
  }]));
}
var DEFAULT_SAMPLERS = {
  temperature: null,
  top_p: null,
  top_k: null,
  max_tokens: null,
  max_input_tokens: null,
  frequency_penalty: null,
  presence_penalty: null
};
var SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 32000,
  max_input_tokens: 128000,
  frequency_penalty: 0,
  presence_penalty: 0
};
var CODEX_SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 65536,
  max_input_tokens: 500000,
  frequency_penalty: 0,
  presence_penalty: 0
};
function makeDefaultProfile(id, name) {
  return {
    id,
    name,
    lagUnit: "messages",
    lagValue: 65,
    windowUnit: "messages",
    windowValue: 18,
    chapterTargetUnit: "percent",
    chapterTargetPercent: 15,
    chapterTargetTokens: 800,
    arcTargetUnit: "percent",
    arcTargetPercent: 20,
    arcTargetTokens: 1500,
    volumeTargetUnit: "percent",
    volumeTargetPercent: 25,
    volumeTargetTokens: 3000,
    arcTrigger: "chapters",
    arcAfterChapters: 6,
    arcAfterTokens: 8000,
    arcLagChapters: 7,
    arcLagTokens: 2000,
    chapterPresetKey: "summary",
    arcPresetKey: "arc_default",
    volumePresetKey: "volume_default",
    previousMemoriesCount: 7,
    regexOutgoingScriptIds: [],
    regexIncomingScriptIds: [],
    connectionId: null,
    samplers: { ...DEFAULT_SAMPLERS },
    autoCreate: true,
    autoCreateChapter: true,
    autoCreateArc: true,
    higherTiers: defaultHigherTiers(),
    hideCoveredMessages: true,
    showMemoryPreviews: false,
    retryCount: 3,
    shortCommentRulesOverride: null,
    memoriaPersonaOverride: null,
    ttftTimeoutSecs: 60,
    codexEnabled: true,
    codexManualOnly: false,
    codexLagUnit: "messages",
    codexLagValue: 6,
    codexWindowUnit: "messages",
    codexWindowValue: 20,
    codexTokenBreakpoint: 1e5,
    codexLoreLimitUnit: "percent",
    codexLoreLimitPercent: 25,
    codexLoreLimitTokens: 25000,
    codexStorySoFarCount: 5,
    codexRelationsTable: true,
    codexActivationMode: "keywords",
    codexInjectionPosition: "lorebook",
    codexInjectionDepth: 4,
    codexThorough: true,
    codexConnectionId: null,
    codexExtraContext: true,
    codexSamplers: { ...DEFAULT_SAMPLERS },
    codexUseTools: false,
    codexWriteMode: "batch",
    codexPresetKey: "codex_default"
  };
}
var DEFAULT_SETTINGS = {
  version: STORAGE_VERSION,
  enabled: true,
  profiles: [makeDefaultProfile("default", t("shared.defaultSettings.default"))],
  activeProfileId: "default",
  customPresets: [],
  debugLog: false,
  localLogsDisabled: false,
  summaryActivationMode: "always",
  followChatNames: true,
  showAutomationToasts: true,
  suppressToolCallingPrompt: false
};
var LESSON_CHAT_PREFIX = "lesson:";
function emptyLessonCourse() {
  return {
    status: "todo",
    section: 0,
    step: 0,
    answers: {},
    attempts: 0,
    bestWrong: null,
    lastWrong: null,
    lastTotal: null,
    grade: null,
    startedAt: null,
    completedAt: null,
    signedName: null
  };
}
function unlockedLessons() {
  const done = () => ({ ...emptyLessonCourse(), status: "done" });
  return { version: 1, freshInstall: false, booksSealSkipped: false, codexSealSkipped: false, books: done(), codex: done() };
}
function codexLessonGated(lessons) {
  return lessons.codex.status !== "done" && !lessons.codexSealSkipped;
}
function lessonGradeForWrong(wrong) {
  if (wrong <= 1)
    return "gilded";
  if (wrong <= 3)
    return "silver";
  if (wrong <= 6)
    return "bronze";
  return "apprentice";
}
var LESSON_GRADE_LABEL = {
  gilded: t("shared.lessonGradeLabel.gilded"),
  silver: t("shared.lessonGradeLabel.silver"),
  bronze: t("shared.lessonGradeLabel.bronze"),
  apprentice: t("shared.lessonGradeLabel.apprentice")
};

// src/codex-tidy.ts
function resolveTidyTarget(currentTokens, target) {
  if (!target || !["tokens", "percent"].includes(target.unit) || !Number.isFinite(target.value) || target.value <= 0 || target.unit === "percent" && target.value >= 100) {
    throw new Error(t("codexTidy.resolveTidyTarget.enterAPositiveTokenLimitOrA"));
  }
  const limit = Math.floor(target.unit === "percent" ? currentTokens * target.value / 100 : target.value);
  if (limit < 1)
    throw new Error(t("codexTidy.resolveTidyTarget.theTargetMustBeAtLeastOne"));
  return { limit, modelTarget: Math.max(1, Math.floor(limit * 0.9)) };
}

// src/ui/modals.ts
function codexCatchupWarnings(state) {
  const hasBooks = state.chapters.some((c) => !c.isRoot) || state.arcs.some((a) => !a.isRoot) || state.volumes.some((v) => !v.isRoot) || state.higherBooks.some((v) => !v.isRoot);
  const autoBooks = state.activeProfile.autoCreate && !state.activeProfile.showMemoryPreviews;
  const bigTailNoAuto = state.coverage.approxUncoveredTokens > 150000 && !autoBooks;
  const booksWarning = !hasBooks ? t("ui.modals.booksWarning.thisChatHasNoFiledChaptersYet") : bigTailNoAuto ? t("ui.modals.booksWarning.theUnfiledTailOfThisChatIs") : null;
  return { booksWarning, autoBooks };
}
function requestCodexUpdate(state, chatId, send) {
  if ((state.codexBacklogPasses ?? 0) <= 1) {
    send({ type: "codex_update_now", chatId });
    return;
  }
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    lead: t("ui.modals.requestCodexUpdate.messageAreWaitingAboutPassesAtThe", { codexBacklog0: state.codexBacklog ?? 0, codexBacklog02: state.codexBacklog ?? 0, codexBacklogPasses: state.codexBacklogPasses }),
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_update_now", chatId, mode })
  });
}
function requestCodexRebuild(state, chatId, send) {
  const prof = state.activeProfile;
  const total = state.messages.length;
  const passes = prof.codexWindowUnit === "messages" ? Math.max(1, Math.ceil(total / Math.max(1, prof.codexWindowValue))) : Math.max(1, Math.ceil(state.messages.reduce((a, m) => a + m.approxTokens, 0) / Math.max(1000, prof.codexWindowValue)));
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    title: t("ui.modals.requestCodexRebuild.rebuildTheCodex"),
    lead: t("ui.modals.requestCodexRebuild.memoriaWillEraseTheStoryBibleAnd", { total, passes }),
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_rebuild", chatId, mode })
  });
}
var catchupClose = null;
function closeCodexCatchupModal() {
  catchupClose?.();
  tidyClose?.();
}
var tidyClose = null;
function requestCodexTidy(state, chatId, send, files) {
  tidyClose?.();
  const targets = (files ?? [...CODEX_FILE_KEYS]).filter((f) => state.codexFileStates[f] !== "frozen");
  const current = targets.reduce((n, f) => n + (state.codexFileTokens[f] ?? 0), 0);
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-tidy";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(540px, 100%)";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", t("ui.modals.requestCodexTidy.tidyCodexToATargetSize"));
  const previousFocus = document.activeElement;
  const close = () => {
    document.removeEventListener("keydown", onKey);
    if (tidyClose === close)
      tidyClose = null;
    overlay.remove();
    if (previousFocus?.isConnected)
      previousFocus.focus();
  };
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
    if (e.key === "Tab") {
      const focusable = [...modal.querySelectorAll("input, select, button:not(:disabled)")];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };
  tidyClose = close;
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = t("ui.modals.requestCodexTidy.tidyCodexToATargetSize");
  header.append(title);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const lead = document.createElement("p");
  lead.textContent = t("ui.modals.requestCodexTidy.currentSelectedContentTokensFrozenFilesAre", { choice: state.codexTokensApproximate ? "yes" : "no", toLocaleString: current.toLocaleString() });
  const unitLabel = document.createElement("label");
  unitLabel.textContent = t("ui.modals.requestCodexTidy.targetUnit");
  const unit = document.createElement("select");
  unit.className = "lmb-input";
  for (const [value, text] of [["percent", t("ui.modals.requestCodexTidy.percentageToKeep")], ["tokens", t("ui.modals.requestCodexTidy.tokens")]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    unit.append(option);
  }
  unitLabel.append(unit);
  const valueLabel = document.createElement("label");
  const valueText = document.createElement("span");
  const value = document.createElement("input");
  value.type = "number";
  value.className = "lmb-input";
  value.value = "75";
  valueLabel.append(valueText, value);
  const preview = document.createElement("p");
  preview.setAttribute("aria-live", "polite");
  const help = document.createElement("p");
  help.className = "lmb-help";
  help.textContent = t("ui.modals.requestCodexTidy.memoriaAims10BelowYourLimitChecks");
  if (state.codexTokensApproximate)
    help.textContent += t("ui.modals.requestCodexTidy.theTokenizerIsUnavailableForThisModel");
  const readTarget = () => ({ unit: unit.value, value: Number(value.value) });
  const start = makeButton(t("ui.modals.start.startTidy"), () => {
    try {
      resolveTidyTarget(current, readTarget());
      const target = readTarget();
      close();
      send({ type: "codex_tidy", chatId, files: targets, target });
    } catch {
      refresh();
    }
  }, { primary: true });
  const refresh = () => {
    const percent = unit.value === "percent";
    valueText.textContent = percent ? t("ui.modals.refresh.keepThisPercentage") : t("ui.modals.refresh.maximumTokens");
    value.min = percent ? "0.01" : "1";
    value.step = percent ? "0.01" : "1";
    value.max = percent ? "99.99" : String(Math.max(1, current - 1));
    try {
      const { limit, modelTarget } = resolveTidyTarget(current, readTarget());
      start.disabled = current === 0 || limit >= current;
      preview.textContent = limit >= current ? t("ui.modals.refresh.chooseATargetBelowTheCurrentSize") : t("ui.modals.refresh.yourLimitTokensModelTargetWithMargin", { toLocaleString: limit.toLocaleString(), toLocaleString2: modelTarget.toLocaleString() });
    } catch (err) {
      start.disabled = true;
      preview.textContent = err instanceof Error ? err.message : t("ui.modals.refresh.enterAValidTarget");
    }
  };
  unit.addEventListener("change", () => {
    const old = Number(value.value);
    value.value = unit.value === "tokens" ? String(Math.max(1, Math.floor(current * old / 100))) : String(Math.min(99.99, Math.max(0.01, Math.round(old / Math.max(1, current) * 1e4) / 100)));
    refresh();
  });
  value.addEventListener("input", refresh);
  body.append(lead, unitLabel, valueLabel, preview, help);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton(t("ui.modals.requestCodexTidy.cancel"), close), start);
  modal.append(header, body, footer);
  overlay.append(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.append(overlay);
  refresh();
  value.focus();
  value.select();
}
function showCodexCatchupModal(opts) {
  if (document.querySelector(".lmb-catchup"))
    return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-catchup";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(600px, 100%)";
  const close = () => {
    document.removeEventListener("keydown", onKey);
    if (catchupClose === close)
      catchupClose = null;
    overlay.remove();
  };
  catchupClose = close;
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
  };
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = opts.title ?? t("ui.modals.showCodexCatchupModal.theCodexIsFarBehind");
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = t("ui.modals.showCodexCatchupModal.value");
  closeBtn.setAttribute("aria-label", t("ui.modals.showCodexCatchupModal.close"));
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    opts.lead,
    t("ui.modals.paragraphs.ultraFastReadsTheStorySCurrent"),
    t("ui.modals.paragraphs.fastReplaysYourFiledChapterSummariesPass"),
    t("ui.modals.paragraphs.slowReplaysEveryRawMessageWindowBy")
  ];
  if (opts.autoBooks) {
    paragraphs.push(t("ui.modals.showCodexCatchupModal.automationIsOnSoFastAndUltra"));
  }
  paragraphs.push(t("ui.modals.showCodexCatchupModal.fastAndUltraFastNeedTheCodex"));
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "14px";
    p.textContent = text;
    body.appendChild(p);
  }
  if (opts.booksWarning) {
    const w = document.createElement("div");
    w.className = "lmb-help";
    w.style.fontSize = "14px";
    w.style.fontWeight = "600";
    w.textContent = t("ui.modals.showCodexCatchupModal.value2", { booksWarning: opts.booksWarning });
    body.appendChild(w);
  }
  modal.appendChild(body);
  const pick = (mode) => () => {
    close();
    opts.onPick(mode);
  };
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton(t("ui.modals.showCodexCatchupModal.slow"), pick("slow"), { danger: true, title: t("ui.modals.showCodexCatchupModal.notRecommendedReplaysEveryRawMessageWindow") }), makeButton(t("ui.modals.showCodexCatchupModal.fast"), pick("fast"), { title: t("ui.modals.showCodexCatchupModal.replayTheFiledSummariesThenOneRaw") }), makeButton(t("ui.modals.showCodexCatchupModal.ultraFast"), pick("ultra"), { primary: true, title: t("ui.modals.showCodexCatchupModal.oneSinglePassOverTheFiledSummaries") }));
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
function showCodexToolsHintModal(profileId, send) {
  if (document.querySelector(".lmb-tools-hint"))
    return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-tools-hint";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(500px, 100%)";
  let dontShowAgain = false;
  const close = () => {
    document.removeEventListener("keydown", onKey);
    if (dontShowAgain) {
      send({ type: "save_settings", patch: { suppressToolCallingPrompt: true } });
    }
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
  };
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = t("ui.modals.showCodexToolsHintModal.toolCallsArenTGettingThrough");
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = t("ui.modals.showCodexToolsHintModal.value");
  closeBtn.setAttribute("aria-label", t("ui.modals.showCodexToolsHintModal.close"));
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    t("ui.modals.paragraphs.theCodexAgentAskedYourModelTo"),
    t("ui.modals.paragraphs.memoriaCanSwitchTheCodexToJson"),
    t("ui.modals.paragraphs.youCanChangeThisAnytimeUnderTuning")
  ];
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "12px";
    p.textContent = text;
    body.appendChild(p);
  }
  const dontShow = document.createElement("label");
  dontShow.className = "lmb-check";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.addEventListener("change", () => {
    dontShowAgain = cb.checked;
  });
  const cbLabel = document.createElement("span");
  cbLabel.className = "lmb-check-hint";
  cbLabel.textContent = t("ui.modals.showCodexToolsHintModal.donTShowThisAgain");
  dontShow.append(cb, cbLabel);
  body.appendChild(dontShow);
  modal.appendChild(body);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton(t("ui.modals.showCodexToolsHintModal.keepToolCalls"), close, { small: true }), makeButton(t("ui.modals.showCodexToolsHintModal.switchToJsonMode"), () => {
    send({ type: "save_profile", profile: { id: profileId, codexUseTools: false } });
    close();
  }, { small: true, primary: true }));
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
function openEditModal(ctx, title, fields, onSave) {
  const handle = ctx.ui.showModal({ title, width: 640, maxHeight: 720 });
  const form = document.createElement("div");
  form.className = "lmb-modal-form";
  handle.root.appendChild(form);
  const labelWrap = document.createElement("div");
  labelWrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = t("ui.modals.openEditModal.label");
  const labelInput = textInput({ value: fields.comment, placeholder: t("ui.modals.labelInput.label") });
  labelWrap.append(lbl, labelInput);
  form.appendChild(labelWrap);
  const contentWrap = document.createElement("div");
  contentWrap.className = "lmb-field";
  const cLbl = document.createElement("div");
  cLbl.className = "lmb-field-label";
  cLbl.textContent = t("ui.modals.openEditModal.content");
  const contentInput = textArea({ value: fields.content, rows: 16 });
  contentWrap.append(cLbl, contentInput);
  form.appendChild(contentWrap);
  const actions = document.createElement("div");
  actions.className = "lmb-modal-actions";
  actions.append(makeButton(t("ui.modals.openEditModal.cancel"), () => handle.dismiss()), makeButton(t("ui.modals.openEditModal.save"), () => {
    onSave({ comment: labelInput.value, content: contentInput.value });
    handle.dismiss();
  }, { primary: true }));
  form.appendChild(actions);
}
async function confirmDelete(ctx, title, message) {
  try {
    const r = await ctx.ui.showConfirm({
      title,
      message,
      variant: "danger",
      confirmLabel: t("ui.modals.r.delete"),
      cancelLabel: t("ui.modals.r.cancel")
    });
    return !!r.confirmed;
  } catch {
    return window.confirm(message);
  }
}
function showDryRunModal(kind, messages, diagnostics) {
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  const close = () => {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
  };
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = t("ui.modals.showDryRunModal.dryRun", { choice: kind === "arc" ? "yes" : "no", choice2: !(kind === "arc") && kind === "volume" ? "yes" : "no", choice3: !(kind === "arc") && !(kind === "volume") && kind === "codex" ? "yes" : "no" });
  header.appendChild(title);
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = t("ui.modals.showDryRunModal.value");
  closeBtn.setAttribute("aria-label", t("ui.modals.showDryRunModal.closeDryRun"));
  closeBtn.addEventListener("click", close);
  header.appendChild(closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  if (diagnostics.length > 0) {
    const diag = document.createElement("div");
    diag.className = "lmb-preview-modal__diagnostics";
    const diagTitle = document.createElement("h4");
    diagTitle.textContent = t("ui.modals.showDryRunModal.diagnostics");
    diag.appendChild(diagTitle);
    const ul = document.createElement("ul");
    for (const d of diagnostics) {
      const li = document.createElement("li");
      li.textContent = d.message;
      ul.appendChild(li);
    }
    diag.appendChild(ul);
    body.appendChild(diag);
  }
  for (const m of messages) {
    const msgCard = document.createElement("div");
    msgCard.className = "lmb-preview-msg";
    const roleLabel = document.createElement("div");
    roleLabel.className = "lmb-preview-msg__role";
    roleLabel.textContent = t("ui.common.role", { role: m.role });
    const contentPre = document.createElement("pre");
    contentPre.className = "lmb-preview-msg__content";
    contentPre.textContent = m.content;
    msgCard.appendChild(roleLabel);
    msgCard.appendChild(contentPre);
    body.appendChild(msgCard);
  }
  modal.appendChild(body);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "lmb-btn small";
  copyBtn.textContent = t("ui.modals.showDryRunModal.copyJson");
  copyBtn.addEventListener("click", async () => {
    const json = JSON.stringify({ kind, messages, diagnostics }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = t("ui.modals.showDryRunModal.copied");
      setTimeout(() => copyBtn.textContent = t("ui.modals.showDryRunModal.copyJson"), 1500);
    } catch {
      copyBtn.textContent = t("ui.modals.showDryRunModal.copyFailed");
    }
  });
  footer.appendChild(copyBtn);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
function promptForString(ctx, title, initial) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled)
        return;
      settled = true;
      resolve(value);
    };
    const handle = ctx.ui.showModal({ title, width: 420 });
    const form = document.createElement("div");
    form.className = "lmb-modal-form";
    handle.root.appendChild(form);
    const input = textInput({ value: initial, autoFocus: true });
    form.appendChild(input);
    const actions = document.createElement("div");
    actions.className = "lmb-modal-actions";
    actions.append(makeButton(t("ui.modals.promptForString.cancel"), () => {
      settle(null);
      handle.dismiss();
    }), makeButton(t("ui.modals.promptForString.ok"), () => {
      const v = input.value.trim();
      settle(v || null);
      handle.dismiss();
    }, { primary: true }));
    form.appendChild(actions);
    try {
      handle.onDismiss?.(() => settle(null));
    } catch (_) {}
  });
}

// src/ui/prompt-breakdown.ts
var pending = new Map;
function requestPromptBreakdown(send, input, timeoutMs = 120000) {
  const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reportUi("timeout", { code: "prompt", op: "prompt_breakdown" });
      reject(new Error(t("ui.promptBreakdown.timer.promptBreakdownTimedOutTryRefreshingThe")));
    }, timeoutMs);
    pending.set(requestId, { chatId: input.chatId, resolve, reject, timer });
    try {
      send({ type: "prompt_breakdown", requestId, ...input });
    } catch (error) {
      clearTimeout(timer);
      pending.delete(requestId);
      reject(error);
    }
  });
}
function deliverPromptBreakdown(message) {
  const request = pending.get(message.requestId);
  if (!request || request.chatId !== message.chatId) {
    reportUi("receive", { code: "stale", op: "prompt_breakdown" });
    return;
  }
  pending.delete(message.requestId);
  clearTimeout(request.timer);
  if ("error" in message) {
    reportUi("receive", { code: "failed", op: "prompt_breakdown" });
    request.reject(new Error(message.error));
  } else
    request.resolve(message.result);
}
function clearPromptRequests() {
  if (pending.size)
    reportUi("receive", { code: "closed", op: "prompt_breakdown" });
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(t("ui.promptBreakdown.clearPromptRequests.promptPanelClosed")));
  }
  pending.clear();
}

// src/ui/lessons/avatar.ts
var MEMORIA_AVATAR = "data:image/png;base64,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";

// src/ui/lessons/seal.ts
function requestLesson(detail) {
  document.dispatchEvent(new CustomEvent("lmb-lesson-request", { detail }));
}
function memoriaSprite(size = 56) {
  const img = document.createElement("img");
  img.className = "lmb-memoria-sprite";
  img.src = MEMORIA_AVATAR;
  img.alt = t("ui.lessons.seal.memoriaSprite.memoria");
  img.width = size;
  img.height = size;
  return img;
}
function runeButton(label, onClick) {
  const btn = makeButton(label, onClick, { primary: true });
  btn.classList.add("lmb-rune-btn");
  const ring = document.createElement("span");
  ring.className = "lmb-rune-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.textContent = t("ui.lessons.seal.runeButton.value");
  btn.appendChild(ring);
  return btn;
}
var busyStrip = null;
var busyStripSend = null;
function renderSealPanel(host, state, send) {
  const panel = document.createElement("div");
  panel.className = "lmb-seal-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", t("ui.lessons.seal.renderSealPanel.lessonsFromMemoria"));
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const heroText = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = t("ui.lessons.seal.renderSealPanel.welcomeTutorial");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = t("ui.lessons.seal.renderSealPanel.hiUserIMTeachingATutorial");
  heroText.append(title, pitch);
  hero.appendChild(heroText);
  panel.appendChild(hero);
  const inProgress = state.lessons.books.status === "in_progress";
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(inProgress ? t("ui.lessons.seal.renderSealPanel.resumeTheLesson") : t("ui.lessons.seal.renderSealPanel.takeLessonFromMemoria"), () => requestLesson({ course: "books", mode: "lesson" })));
  actions.appendChild(makeButton(t("ui.lessons.seal.renderSealPanel.sitTheExam"), () => requestLesson({ course: "books", mode: "exam" }), {
    small: true,
    title: t("ui.lessons.seal.renderSealPanel.tenQuestionsFromTheCourse9Of")
  }));
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "lmb-lesson-skip";
  skip.textContent = t("ui.lessons.seal.renderSealPanel.skipForNow");
  skip.addEventListener("click", () => renderGrumpySkip(panel, send));
  actions.appendChild(skip);
  panel.appendChild(actions);
  if (inProgress) {
    const sec = state.lessons.books.section + 1;
    const note = document.createElement("div");
    note.className = "lmb-seal-note";
    note.textContent = t("ui.lessons.seal.renderSealPanel.progressSavedAtSection", { sec });
    panel.appendChild(note);
  }
  busyStrip = document.createElement("div");
  busyStrip.className = "lmb-seal-busy";
  busyStripSend = send;
  panel.appendChild(busyStrip);
  updateSealBusy(state);
  host.appendChild(panel);
}
function renderGrumpySkip(panel, send) {
  panel.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = t("ui.lessons.seal.renderGrumpySkip.hmphFine");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = t("ui.lessons.seal.renderGrumpySkip.skipIfYouMustButYouHad");
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(t("ui.lessons.seal.renderGrumpySkip.fineTeachMe"), () => requestLesson({ course: "books", mode: "lesson" })));
  actions.appendChild(makeButton(t("ui.lessons.seal.renderGrumpySkip.skipAnyway"), () => send({ type: "lesson_seal_skip" }), { small: true }));
  panel.append(hero, actions);
}
function updateSealBusy(state) {
  const strip = busyStrip;
  const send = busyStripSend;
  if (!strip || !strip.isConnected || !send)
    return;
  strip.replaceChildren();
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = b.label;
    row.append(dot, label, makeButton(t("ui.lessons.seal.updateSealBusy.abort"), () => send({ type: "abort_busy", chatId: b.chatId, kind: b.kind }), {
      danger: true,
      small: true
    }));
    strip.appendChild(row);
  }
  if (state.lastFailure && state.activeChatId) {
    const chatId = state.activeChatId;
    const row = document.createElement("div");
    row.className = "lmb-seal-failure";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = t("ui.lessons.seal.updateSealBusy.lastAttemptFailed", { kind: state.lastFailure.kind });
    row.append(label, makeButton(t("ui.lessons.seal.updateSealBusy.retry"), () => send({ type: "retry_last_failure", chatId }), { small: true, primary: true }));
    strip.appendChild(row);
  }
}
function clearSealBusy() {
  busyStrip = null;
  busyStripSend = null;
}
var PREVIEW_TILES = [
  { value: "3", label: t("ui.lessons.seal.previewTiles.characters"), sub: t("ui.lessons.seal.previewTiles.240Tokens") },
  { value: "2", label: t("ui.lessons.seal.previewTiles.locations"), sub: t("ui.lessons.seal.previewTiles.90Tokens") },
  { value: "1", label: t("ui.lessons.seal.previewTiles.things"), sub: t("ui.lessons.seal.previewTiles.50Tokens") },
  { value: "4", label: t("ui.lessons.seal.previewTiles.relations"), sub: t("ui.lessons.seal.previewTiles.170Tokens") },
  { value: "5", label: t("ui.lessons.seal.previewTiles.timeline"), sub: t("ui.lessons.seal.previewTiles.160Tokens") },
  { value: "2", label: t("ui.lessons.seal.previewTiles.threads"), sub: t("ui.lessons.seal.previewTiles.120Tokens") },
  { value: "2", label: t("ui.lessons.seal.previewTiles.lore"), sub: t("ui.lessons.seal.previewTiles.110Tokens") },
  { value: "2", label: t("ui.lessons.seal.previewTiles.secrets"), sub: t("ui.lessons.seal.previewTiles.90Tokens") }
];
function renderCodexTabLock(host, send) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-codex-lock";
  const preview = document.createElement("div");
  preview.className = "lmb-codex-lock-preview";
  preview.setAttribute("aria-hidden", "true");
  const watermark = document.createElement("div");
  watermark.className = "lmb-codex-lock-watermark";
  watermark.textContent = t("ui.lessons.seal.renderCodexTabLock.example");
  preview.appendChild(watermark);
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  for (const t of PREVIEW_TILES) {
    const tile = document.createElement("div");
    tile.className = "lmb-tile";
    const v = document.createElement("div");
    v.className = "lmb-tile-value";
    v.textContent = t.value;
    const l = document.createElement("div");
    l.className = "lmb-tile-label";
    l.textContent = t.label;
    const s = document.createElement("div");
    s.className = "lmb-tile-sub";
    s.textContent = t.sub;
    tile.append(v, l, s);
    tiles.appendChild(tile);
  }
  preview.appendChild(tiles);
  wrap.appendChild(preview);
  wrap.appendChild(codexSealCard(t("ui.lessons.seal.renderCodexTabLock.theKnowledgeCodex"), t("ui.lessons.seal.renderCodexTabLock.aStoryBibleAnAgentKeepsFor"), send));
  host.appendChild(wrap);
}
function renderCodexPaneLock(host) {
  host.appendChild(codexSealCard(t("ui.lessons.seal.renderCodexPaneLock.sealedUntilTheLesson"), t("ui.lessons.seal.renderCodexPaneLock.theCodexSettingsUnlockWhenYouFinish")));
}
function codexSealCard(title, text, send) {
  const card = document.createElement("div");
  card.className = "lmb-codex-lock-card";
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const t2 = document.createElement("div");
  t2.className = "lmb-seal-title";
  t2.textContent = title;
  const p = document.createElement("div");
  p.className = "lmb-seal-pitch";
  p.textContent = text;
  right.append(t2, p);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(t("ui.lessons.seal.codexSealCard.takeALessonFromMemoria"), () => requestLesson({ course: "codex", mode: "lesson" })));
  if (send) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "lmb-lesson-skip";
    skip.textContent = t("ui.lessons.seal.codexSealCard.skipForNow");
    skip.addEventListener("click", () => renderCodexGrumpySkip(card, send));
    actions.appendChild(skip);
  }
  card.append(hero, actions);
  return card;
}
function renderCodexGrumpySkip(card, send) {
  card.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = t("ui.lessons.seal.renderCodexGrumpySkip.hmphFine");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = t("ui.lessons.seal.renderCodexGrumpySkip.skipIfYouMustTheCodexUnlocks");
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(t("ui.lessons.seal.renderCodexGrumpySkip.fineTeachMe"), () => requestLesson({ course: "codex", mode: "lesson" })));
  actions.appendChild(makeButton(t("ui.lessons.seal.renderCodexGrumpySkip.skipAnyway"), () => send({ type: "lesson_seal_skip", course: "codex" }), { small: true }));
  card.append(hero, actions);
}

// src/ui/tabs/home-tab.ts
var inflightBusyLabels = new Map;
function busyTrackKey(kind, chatId) {
  return `${kind}::${chatId}`;
}
var streamWatch = null;
var streamData = { content: "", thinking: "", running: false };
var streamEls = null;
function deliverStreamText(msg) {
  if (!streamWatch || streamWatch.chatId !== msg.chatId || streamWatch.kind !== msg.kind)
    return;
  streamData = { content: msg.content, thinking: msg.thinking, running: msg.running };
  patchStreamPanel();
}
function patchStreamPanel() {
  const els = streamEls;
  if (!els || !els.panel.isConnected)
    return;
  const pinned = els.body.scrollHeight - els.body.scrollTop - els.body.clientHeight < 48;
  els.think.textContent = streamData.thinking;
  els.think.style.display = streamData.thinking ? "" : "none";
  els.text.textContent = streamData.content;
  els.text.style.display = streamData.content ? "" : "none";
  els.empty.style.display = streamData.content || streamData.thinking ? "none" : "";
  els.status.textContent = t("ui.tabs.homeTab.streamStatus", { running: streamData.running ? "yes" : "no" });
  els.panel.classList.toggle("done", !streamData.running);
  if (pinned)
    els.body.scrollTop = els.body.scrollHeight;
}
function closeStreamWatch(send) {
  if (streamWatch) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
  }
  streamWatch = null;
  streamEls?.panel.remove();
  streamEls = null;
}
function buildStreamPanel(send) {
  const panel = document.createElement("div");
  panel.className = "lmb-stream-panel";
  const head = document.createElement("div");
  head.className = "lmb-stream-head";
  const dot = document.createElement("div");
  dot.className = "lmb-busy-dot";
  const title = document.createElement("span");
  title.className = "lmb-stream-title";
  title.textContent = t("ui.tabs.homeTab.buildStreamPanel.liveFromMemoriaSDesk");
  const status = document.createElement("span");
  status.className = "lmb-stream-status";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "lmb-stream-close";
  close.textContent = t("ui.tabs.homeTab.buildStreamPanel.value");
  close.title = t("ui.tabs.homeTab.buildStreamPanel.closeTheLiveView");
  close.addEventListener("click", () => closeStreamWatch(send));
  head.append(dot, title, status, close);
  const body = document.createElement("div");
  body.className = "lmb-stream-body";
  const think = document.createElement("div");
  think.className = "lmb-stream-think";
  const text = document.createElement("div");
  text.className = "lmb-stream-text";
  const empty = document.createElement("div");
  empty.className = "lmb-stream-empty";
  empty.textContent = t("ui.tabs.homeTab.buildStreamPanel.waitingForTheFirstTokensFromThe");
  body.append(think, text, empty);
  panel.append(head, body);
  streamEls = { panel, body, think, text, empty, status };
  patchStreamPanel();
  return panel;
}
function tryUpdateBusyLabelsInPlace(entries) {
  const keys = new Set(entries.map((b) => busyTrackKey(b.kind, b.chatId)));
  if (keys.size !== inflightBusyLabels.size)
    return false;
  for (const k of keys) {
    const el = inflightBusyLabels.get(k);
    if (!el || !el.isConnected)
      return false;
  }
  for (const b of entries) {
    const el = inflightBusyLabels.get(busyTrackKey(b.kind, b.chatId));
    if (el)
      el.textContent = b.label;
  }
  return true;
}
function lessonReminder(text, course) {
  const strip = document.createElement("div");
  strip.className = "lmb-lesson-reminder";
  strip.appendChild(memoriaSprite(28));
  const label = document.createElement("span");
  label.className = "lmb-grow";
  label.textContent = text;
  strip.append(label, makeButton(t("ui.tabs.homeTab.lessonReminder.takeALesson"), () => requestLesson({ course, mode: "lesson" }), {
    small: true,
    primary: true
  }));
  return strip;
}
function renderHomeTab(host, state, ctx, send) {
  host.replaceChildren();
  if (state.lessons.books.status !== "done" && state.lessons.booksSealSkipped) {
    host.appendChild(lessonReminder(t("ui.tabs.homeTab.renderHomeTab.myLessonIsStillWaitingForYou"), "books"));
  }
  if (state.lessons.codex.status !== "done" && state.lessons.codexSealSkipped) {
    host.appendChild(lessonReminder(t("ui.tabs.homeTab.renderHomeTab.theCodexLessonIsStillWaitingFor"), "codex"));
  }
  if (!state.activeChatId) {
    const empty = section(t("ui.tabs.homeTab.empty.overview"));
    empty.body.appendChild(textNode(t("ui.tabs.homeTab.renderHomeTab.openAChatAndMemoriaWillSet"), "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }
  renderOverview(host, state, send);
  renderPromptPanel(host, state, send);
  renderFailure(host, state, send);
  renderPreviews(host, state, send);
  renderActions(host, state, send);
}
var HOST_GROUPS = [
  { id: "lumiverse", label: t("ui.tabs.homeTab.hostGroups.promptBlocks"), color: "#8a7fb0" },
  { id: "chatHistory", label: t("ui.tabs.homeTab.hostGroups.chatHistory"), color: "#d4a842" },
  { id: "longTermMemory", label: t("ui.tabs.homeTab.hostGroups.longTermMemory"), color: "#e89b5f" },
  { id: "worldInfo", label: t("ui.tabs.homeTab.hostGroups.worldInfo"), color: "#68b87a" },
  { id: "sidecar", label: t("ui.tabs.homeTab.hostGroups.sidecar"), color: "#e05daa" },
  { id: "extensions", label: t("ui.tabs.homeTab.hostGroups.extensions"), color: "#5bc0c0" },
  { id: "system", label: t("ui.tabs.homeTab.hostGroups.system"), color: "#5b8ca8" }
];
var HOST_TYPE_TO_GROUP = {
  block: "lumiverse",
  chat_history: "chatHistory",
  long_term_memory: "longTermMemory",
  world_info: "worldInfo",
  sidecar: "sidecar",
  extension: "extensions",
  authors_note: "extensions",
  separator: "system",
  utility: "system",
  append: "lumiverse"
};
var promptRevision = 0;
var redrawPrompt = null;
var promptCache = {
  chatId: null,
  newestMsgId: null,
  data: null,
  source: null,
  at: 0,
  loading: false,
  error: null,
  expanded: new Set
};
function renderLessonPromptPanel(body) {
  const groups = [
    { label: t("ui.tabs.homeTab.groups.promptBlocks"), color: "#8a7fb0", tokens: 2400 },
    { label: t("ui.tabs.homeTab.groups.chatHistory"), color: "#d4a842", tokens: 31200 },
    { label: t("ui.tabs.homeTab.groups.worldInfo"), color: "#68b87a", tokens: 3800 },
    { label: t("ui.tabs.homeTab.groups.extensions"), color: "#5bc0c0", tokens: 2100 }
  ];
  const max = 200000;
  const total = groups.reduce((a, g) => a + g.tokens, 0);
  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(g.tokens);
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = t("ui.tabs.homeTab.renderLessonPromptPanel.tokens", { label: g.label, tokens: formatTokens(g.tokens) });
    bar.appendChild(seg);
  }
  const free = document.createElement("div");
  free.className = "lmb-spine-seg free";
  free.style.flexGrow = String(max - total);
  bar.appendChild(free);
  body.appendChild(bar);
  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = g.label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = formatTokens(g.tokens);
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  const totalRow = document.createElement("div");
  totalRow.className = "lmb-breakdown-row total";
  const pad = document.createElement("span");
  pad.className = "lmb-spine-swatch";
  pad.style.visibility = "hidden";
  const tl = document.createElement("span");
  tl.className = "lmb-breakdown-label";
  tl.textContent = t("ui.tabs.homeTab.renderLessonPromptPanel.promptVsContextWindow");
  const tt = document.createElement("span");
  tt.className = "lmb-breakdown-tokens";
  tt.textContent = t("ui.tabs.homeTab.renderLessonPromptPanel.value", { formatTokens: formatTokens(total), formatTokens2: formatTokens(max), round: Math.round(total / max * 100) });
  totalRow.append(pad, tl, tt);
  list.appendChild(totalRow);
  body.appendChild(list);
  body.appendChild(textNode(t("ui.tabs.homeTab.renderLessonPromptPanel.simulatedExampleTheLivePanelReadsYour"), "lmb-help"));
}
function renderPromptPanel(host, state, send) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  const sec = section(t("ui.tabs.homeTab.sec.thePrompt"));
  lessonMark(sec.wrap, "home.prompt");
  const body = document.createElement("div");
  body.className = "lmb-pane";
  sec.body.appendChild(body);
  host.appendChild(sec.wrap);
  if (chatId.startsWith(LESSON_CHAT_PREFIX)) {
    renderLessonPromptPanel(body);
    return;
  }
  const newestMsgId = state.messages.length ? state.messages[state.messages.length - 1].id : null;
  const chatChanged = promptCache.chatId !== chatId;
  const newFire = !chatChanged && promptCache.newestMsgId !== newestMsgId;
  if (chatChanged || newFire) {
    ++promptRevision;
    promptCache.chatId = chatId;
    promptCache.data = null;
    promptCache.source = null;
    promptCache.error = null;
    promptCache.loading = false;
    promptCache.expanded.clear();
  }
  promptCache.newestMsgId = newestMsgId;
  const redraw = () => {
    if (!body.isConnected)
      return;
    body.replaceChildren();
    drawPromptContent(body, state, load);
  };
  redrawPrompt = redraw;
  const load = (mode) => {
    if (promptCache.loading)
      return;
    promptCache.loading = true;
    promptCache.error = null;
    redraw();
    const revision = ++promptRevision;
    requestPromptBreakdown(send, { chatId, messageIds: state.messages.slice(-15).map((m) => m.id), mode }).then(({ d, source }) => {
      if (revision !== promptRevision)
        return;
      promptCache.data = d;
      promptCache.source = source;
      promptCache.at = Date.now();
    }).catch((err) => {
      if (revision !== promptRevision)
        return;
      promptCache.error = err instanceof Error ? err.message : String(err);
    }).finally(() => {
      if (revision !== promptRevision)
        return;
      promptCache.loading = false;
      redrawPrompt?.();
    });
  };
  drawPromptContent(body, state, load);
  if (!promptCache.loading && (chatChanged || newFire || !promptCache.data && !promptCache.error)) {
    load("auto");
  }
}
function drawPromptContent(body, state, load) {
  const head = document.createElement("div");
  head.className = "lmb-actions";
  const status = document.createElement("span");
  status.className = "lmb-help lmb-grow";
  const simulate = makeButton(t("ui.tabs.homeTab.simulate.simulate"), () => load("dry"), {
    small: true,
    disabled: promptCache.loading,
    title: t("ui.tabs.homeTab.simulate.assembleTheNextPromptThroughTheHost")
  });
  head.append(status, simulate);
  body.appendChild(head);
  if (promptCache.loading) {
    status.textContent = t("ui.tabs.homeTab.drawPromptContent.readingTheLastFire");
    body.appendChild(textNode(t("ui.tabs.homeTab.drawPromptContent.memoriaIsAskingTheHostForThe"), "lmb-empty"));
    return;
  }
  if (promptCache.error) {
    status.textContent = t("ui.tabs.homeTab.drawPromptContent.couldnTReadTheHostPrompt");
    const err = textNode(promptCache.error, "lmb-help");
    const retry = makeButton(t("ui.tabs.homeTab.retry.retry"), () => load("auto"), { small: true, primary: true });
    const row = document.createElement("div");
    row.className = "lmb-actions";
    row.append(err, retry);
    body.appendChild(row);
    return;
  }
  const data = promptCache.data;
  if (!data) {
    status.textContent = t("ui.tabs.homeTab.drawPromptContent.noPromptDataYet");
    return;
  }
  const srcLabel = promptCache.source === "fire" ? t("ui.tabs.homeTab.srcLabel.lastFire") : t("ui.tabs.homeTab.srcLabel.simulatedNextFire");
  const bits = [srcLabel, relativeTime(promptCache.at)];
  if (data.model)
    bits.push(data.model);
  if (data.presetName)
    bits.push(data.presetName);
  status.textContent = bits.join(" · ");
  const groups = HOST_GROUPS.map((g) => ({
    ...g,
    entries: data.entries.filter((e) => (HOST_TYPE_TO_GROUP[e.type] ?? "system") === g.id)
  })).map((g) => ({ ...g, tokens: g.entries.reduce((a, e) => a + e.tokens, 0) })).filter((g) => g.tokens > 0);
  const freeTokens = data.maxContext > 0 ? Math.max(0, data.maxContext - data.totalTokens) : 0;
  const pctDenom = data.maxContext > 0 ? data.maxContext : data.totalTokens;
  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(Math.max(1, g.tokens));
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = t("ui.tabs.homeTab.drawPromptContent.tokens", { label: g.label, tokens: formatTokens(g.tokens) });
    bar.appendChild(seg);
  }
  if (freeTokens > 0) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg free";
    seg.style.flexGrow = String(freeTokens);
    seg.title = t("ui.tabs.homeTab.drawPromptContent.freeSpaceTokens", { formatTokens: formatTokens(freeTokens) });
    bar.appendChild(seg);
  }
  body.appendChild(bar);
  const fullness = document.createElement("div");
  fullness.className = "lmb-breakdown-row total";
  const spacer = document.createElement("span");
  spacer.className = "lmb-spine-swatch";
  spacer.style.visibility = "hidden";
  const fl = document.createElement("span");
  fl.className = "lmb-breakdown-label";
  fl.textContent = data.maxContext > 0 ? t("ui.tabs.homeTab.drawPromptContent.promptVsContextWindow") : t("ui.tabs.homeTab.drawPromptContent.promptTotal");
  const ft = document.createElement("span");
  ft.className = "lmb-breakdown-tokens";
  ft.textContent = data.maxContext > 0 ? `${formatTokens(data.totalTokens)} / ${formatTokens(data.maxContext)} (${Math.round(data.totalTokens / data.maxContext * 100)}%)` : t("ui.tabs.homeTab.drawPromptContent.tokens2", { totalTokens: formatTokens(data.totalTokens) });
  fullness.append(spacer, fl, ft);
  body.appendChild(fullness);
  if (data.maxContext > 0 && data.totalTokens / data.maxContext > 0.9) {
    body.appendChild(pill(t("ui.tabs.homeTab.drawPromptContent.contextNearlyFull"), "warn"));
  }
  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const isSynthetic = g.entries.every((e) => e.synthetic);
    const row = document.createElement(isSynthetic ? "div" : "button");
    if (!isSynthetic)
      row.type = "button";
    row.className = `lmb-breakdown-row${isSynthetic ? "" : " lmb-breakdown-click"}`;
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    swatch.style.opacity = "0.85";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = isSynthetic ? g.label : `${g.label} (${g.entries.length})`;
    const t2 = document.createElement("span");
    t2.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round(g.tokens / pctDenom * 100) : 0;
    t2.textContent = t("ui.tabs.homeTab.drawPromptContent.value", { tokens: formatTokens(g.tokens), pct });
    row.append(swatch, l, t2);
    if (!isSynthetic) {
      const chev = document.createElement("span");
      chev.className = `lmb-chevron${promptCache.expanded.has(g.id) ? " open" : ""}`;
      row.appendChild(chev);
      row.addEventListener("click", () => {
        if (promptCache.expanded.has(g.id))
          promptCache.expanded.delete(g.id);
        else
          promptCache.expanded.add(g.id);
        if (body.isConnected) {
          body.replaceChildren();
          drawPromptContent(body, state, load);
        }
      });
    }
    list.appendChild(row);
    if (!isSynthetic && promptCache.expanded.has(g.id)) {
      for (const e of g.entries) {
        const sub = document.createElement("div");
        sub.className = "lmb-breakdown-row sub";
        const pad = document.createElement("span");
        pad.className = "lmb-spine-swatch";
        pad.style.visibility = "hidden";
        const sl = document.createElement("span");
        sl.className = "lmb-breakdown-label";
        sl.textContent = e.extensionName ? `${e.name} (${e.extensionName})` : e.name;
        const st = document.createElement("span");
        st.className = "lmb-breakdown-tokens";
        st.textContent = formatTokens(e.tokens);
        sub.append(pad, sl, st);
        list.appendChild(sub);
      }
    }
  }
  if (data.maxContext > 0) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = t("ui.tabs.homeTab.drawPromptContent.freeSpace");
    const t2 = document.createElement("span");
    t2.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round(freeTokens / pctDenom * 100) : 0;
    t2.textContent = t("ui.tabs.homeTab.drawPromptContent.value2", { formatTokens: formatTokens(freeTokens), pct });
    row.append(swatch, l, t2);
    list.appendChild(row);
  }
  body.appendChild(list);
}
var SPINE_LABEL = {
  codex: t("ui.tabs.homeTab.spineLabel.knowledgeCodex"),
  volume: t("ui.tabs.homeTab.spineLabel.inAVolume"),
  series: t("ui.tabs.homeTab.spineLabel.inASeries"),
  saga: t("ui.tabs.homeTab.spineLabel.inASaga"),
  library: t("ui.tabs.homeTab.spineLabel.inALibrary"),
  universe: t("ui.tabs.homeTab.spineLabel.inAUniverse"),
  arc: t("ui.tabs.homeTab.spineLabel.inAnArc"),
  chapter: t("ui.tabs.homeTab.spineLabel.inAChapter"),
  ghost: t("ui.tabs.homeTab.spineLabel.stagedAsGhost"),
  excluded: "excluded",
  free: "uncompressed"
};
function injectedTokens(v) {
  return v.contentTokens;
}
function collectEntryInfo(state) {
  const info = new Map;
  const put = (v, kind) => {
    info.set(v.entryId, {
      kind,
      tokens: injectedTokens(v),
      msgCount: Math.max(1, v.meta.msgIds.length),
      label: v.comment || v.meta.title || ""
    });
  };
  for (const v of state.higherBooks)
    put(v, TIER_KINDS[v.meta.tier - 1]);
  for (const v of state.volumes)
    put(v, "volume");
  for (const a of state.arcs)
    put(a, "arc");
  for (const c of state.chapters)
    put(c, c.isGhost ? "ghost" : "chapter");
  return info;
}
function buildSpine(state, info) {
  const segs = [];
  state.messages.forEach((m, i) => {
    const entryId = m.covered && !m.excluded ? m.coveredByEntryId : null;
    const kind = m.excluded ? "excluded" : entryId ? info.get(entryId)?.kind ?? "chapter" : "free";
    const last = segs[segs.length - 1];
    if (last && last.kind === kind && last.entryId === entryId) {
      last.count++;
      last.to = i;
      if (!entryId)
        last.tokens += m.approxTokens;
    } else {
      segs.push({ kind, count: 1, from: i, to: i, entryId, tokens: entryId ? 0 : m.approxTokens });
    }
  });
  for (const s of segs) {
    if (!s.entryId)
      continue;
    const e = info.get(s.entryId);
    if (!e)
      continue;
    s.tokens = Math.max(1, Math.round(e.tokens * (s.count / e.msgCount)));
  }
  return segs;
}
function renderSpine(body, state) {
  const codexTokens = state.codexInjectedTokens ?? 0;
  if (state.messages.length === 0 && codexTokens === 0)
    return;
  const info = collectEntryInfo(state);
  const segs = buildSpine(state, info);
  if (codexTokens > 0) {
    segs.unshift({ kind: "codex", count: 0, from: -1, to: -1, entryId: null, tokens: codexTokens });
  }
  if (segs.length === 0)
    return;
  const spine = document.createElement("div");
  spine.className = "lmb-spine";
  lessonMark(spine, "home.spine");
  for (const s of segs) {
    const seg = document.createElement("div");
    seg.className = `lmb-spine-seg ${s.kind}`;
    seg.style.flexGrow = String(Math.max(1, s.tokens));
    const name = s.entryId ? info.get(s.entryId)?.label : "";
    const where = s.kind === "codex" ? "" : t("ui.tabs.homeTab.where.msgs", { from1: s.from + 1, to1: s.to + 1 });
    seg.title = t("ui.tabs.homeTab.renderSpine.tokens", { where, kind: name || SPINE_LABEL[s.kind], tokens: formatTokens(s.tokens), choice: s.entryId ? "yes" : "no" });
    if (s.entryId) {
      const entryId = s.entryId;
      seg.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("lmb-reveal-entry", { detail: { entryId } }));
      });
    }
    spine.appendChild(seg);
  }
  body.appendChild(spine);
  body.appendChild(lessonMark(renderBreakdown(state), "home.breakdown"));
}
function renderBreakdown(state) {
  const codexTokens = state.codexInjectedTokens ?? 0;
  const wrap = document.createElement("div");
  wrap.className = "lmb-breakdown";
  const row = (kind, label, tokens, approx) => {
    const r = document.createElement("div");
    r.className = `lmb-breakdown-row${kind === "total" ? " total" : ""}`;
    const swatch = document.createElement("span");
    swatch.className = `lmb-spine-swatch ${kind === "total" ? "" : kind}`;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = `${approx ? "~" : ""}${formatTokens(tokens)}`;
    r.append(swatch, l, t);
    return r;
  };
  const activeVolumes = [...state.volumes, ...state.higherBooks].filter((v) => v.active);
  const activeArcs = state.arcs.filter((a) => a.active);
  const activeChapters = state.chapters.filter((c) => c.active && !c.isGhost);
  const sum = (list) => list.reduce((acc, v) => acc + injectedTokens(v), 0);
  const volTokens = sum(activeVolumes);
  const arcTokens = sum(activeArcs);
  const chapTokens = sum(activeChapters);
  let tailTokens = 0;
  let tailCount = 0;
  let excludedTokens = 0;
  let excludedCount = 0;
  for (const m of state.messages) {
    if (m.excluded) {
      excludedTokens += m.approxTokens;
      excludedCount++;
    } else if (!m.covered) {
      tailTokens += m.approxTokens;
      tailCount++;
    }
  }
  if (codexTokens > 0)
    wrap.appendChild(row("codex", t("ui.tabs.homeTab.renderBreakdown.knowledgeCodexConstantPart"), codexTokens, state.codexTokensApproximate));
  if (activeVolumes.length)
    wrap.appendChild(row("volume", t("ui.tabs.homeTab.renderBreakdown.volumesAndHigher", { length: activeVolumes.length }), volTokens, true));
  if (activeArcs.length)
    wrap.appendChild(row("arc", t("ui.tabs.homeTab.renderBreakdown.arcs", { length: activeArcs.length }), arcTokens, true));
  if (activeChapters.length)
    wrap.appendChild(row("chapter", t("ui.tabs.homeTab.renderBreakdown.chapters", { length: activeChapters.length }), chapTokens, true));
  if (tailCount > 0)
    wrap.appendChild(row("free", t("ui.tabs.homeTab.renderBreakdown.uncompressedTailMsgs", { tailCount }), tailTokens, true));
  if (excludedCount > 0)
    wrap.appendChild(row("excluded", t("ui.tabs.homeTab.renderBreakdown.excludedMsgs", { excludedCount }), excludedTokens, true));
  wrap.title = t("ui.tabs.homeTab.renderBreakdown.codexCountsIncludeEnabledConstantLorebookEntries");
  const total = codexTokens + volTokens + arcTokens + chapTokens + tailTokens + excludedTokens;
  wrap.appendChild(row("total", t("ui.tabs.homeTab.renderBreakdown.storyContextInThePrompt"), total, true));
  return wrap;
}
function renderOverview(host, state, send) {
  const sec = section(t("ui.tabs.homeTab.sec.overview"));
  const who = document.createElement("div");
  who.className = "lmb-status-grid";
  addRow(who, t("ui.tabs.homeTab.renderOverview.chat"), state.activeChatName || state.activeChatId.slice(0, 8));
  if (state.activeCharacterName)
    addRow(who, t("ui.tabs.homeTab.renderOverview.character"), state.activeCharacterName);
  sec.body.appendChild(who);
  renderSpine(sec.body, state);
  const cov = state.coverage;
  const pct = cov.totalMessages > 0 ? Math.round(cov.coveredMessages / cov.totalMessages * 100) : 0;
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  lessonMark(tiles, "home.tiles");
  tiles.appendChild(statTile(`${pct}%`, t("ui.tabs.homeTab.renderOverview.filed"), t("ui.tabs.homeTab.renderOverview.ofMsgs", { coveredMessages: cov.coveredMessages, totalMessages: cov.totalMessages }), t("ui.tabs.homeTab.renderOverview.shareOfThisChatSMessagesAlready")));
  tiles.appendChild(statTile(`~${formatTokens(cov.approxUncoveredTokens)}`, t("ui.tabs.homeTab.renderOverview.tail"), t("ui.tabs.homeTab.renderOverview.msgsUncompressed", { uncoveredMessages: cov.uncoveredMessages }), t("ui.tabs.homeTab.renderOverview.recentMessagesStillInThePromptAt")));
  const counts = {
    vol: state.volumes.filter((v) => v.active).length,
    arc: state.arcs.filter((a) => a.active).length,
    chap: state.chapters.filter((c) => !c.isGhost && c.active).length
  };
  const shelfTile = statTile(`${counts.vol} · ${counts.arc} · ${counts.chap}`, t("ui.tabs.homeTab.shelfTile.shelf"), t("ui.tabs.homeTab.shelfTile.volArcChap"), t("ui.tabs.homeTab.shelfTile.uncompressedSummariesHoverForExistingHigherTiers"));
  const higherCounts = TIER_KINDS.slice(3).map((kind, i) => ({ kind, count: state.higherBooks.filter((e) => e.active && e.meta.tier === i + 4).length })).filter((e) => e.count > 0);
  if (higherCounts.length) {
    shelfTile.classList.add("lmb-has-higher");
    shelfTile.tabIndex = 0;
    const more = document.createElement("div");
    more.className = "lmb-higher-peek";
    more.textContent = higherCounts.map((e) => t("ui.tabs.homeTab.higherCount", { count: e.count, kind: e.kind })).join(" · ");
    shelfTile.appendChild(more);
  }
  tiles.appendChild(shelfTile);
  if (codexLessonGated(state.lessons)) {
    const locked = statTile("\uD83D\uDD12", t("ui.tabs.homeTab.locked.codex"), t("ui.tabs.homeTab.locked.takeALesson"), t("ui.tabs.homeTab.locked.theKnowledgeCodexUnlocksAfterMemoriaS"));
    locked.classList.add("lmb-bible-tile");
    locked.addEventListener("click", () => requestLesson({ course: "codex", mode: "lesson" }));
    tiles.appendChild(lessonMark(locked, "home.tile.codex"));
  } else if (state.activeProfile.codexEnabled || state.codexExists) {
    const value = state.codexBacklog > 0 ? String(state.codexBacklog) : "✓";
    const subText = state.codexBacklog > 0 ? state.activeProfile.codexManualOnly ? t("ui.tabs.homeTab.subText.msgsUnindexedManualOnly") : t("ui.tabs.homeTab.subText.msgsUnindexed") : state.codexLastRunAt ? t("ui.tabs.homeTab.subText.updated", { codexLastRunAt: relativeTime(state.codexLastRunAt) }) : t("ui.tabs.homeTab.subText.noCodexYet");
    tiles.appendChild(statTile(value, t("ui.tabs.homeTab.renderOverview.codex"), subText, t("ui.tabs.homeTab.renderOverview.messagesTheStoryBibleHasNotRead")));
  } else {
    tiles.appendChild(statTile("—", t("ui.tabs.homeTab.renderOverview.codex"), t("ui.tabs.homeTab.renderOverview.offEnableInTuning")));
  }
  sec.body.appendChild(tiles);
  inflightBusyLabels.clear();
  if (streamWatch && streamWatch.chatId !== state.activeChatId) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
    streamWatch = null;
    streamEls = null;
  }
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    lessonMark(row, "home.busy");
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const labelSpan = document.createElement("span");
    labelSpan.className = "lmb-grow";
    labelSpan.textContent = b.label;
    row.append(dot, labelSpan);
    const watching = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
    const watchBtn = makeButton(watching ? t("ui.tabs.homeTab.watchBtn.hide") : t("ui.tabs.homeTab.watchBtn.watch"), () => {
      const active = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
      if (active) {
        closeStreamWatch(send);
        watchBtn.textContent = t("ui.tabs.homeTab.watchBtn.watch");
        return;
      }
      closeStreamWatch(send);
      streamWatch = { chatId: b.chatId, kind: b.kind };
      streamData = { content: "", thinking: "", running: true };
      send({ type: "watch_stream", chatId: b.chatId, kind: b.kind, on: true });
      row.insertAdjacentElement("afterend", buildStreamPanel(send));
      watchBtn.textContent = t("ui.tabs.homeTab.watchBtn.hide");
    }, { small: true, title: t("ui.tabs.homeTab.watchBtn.seeMemoriaSRawOutputStreamIn") });
    const abortBtn = makeButton(t("ui.tabs.homeTab.abortBtn.abort"), () => {
      abortBtn.disabled = true;
      send({ type: "abort_busy", chatId: b.chatId, kind: b.kind });
    }, { danger: true, small: true, title: t("ui.tabs.homeTab.abortBtn.cancelTheInFlightGeneration") });
    row.append(watchBtn, abortBtn);
    sec.body.appendChild(row);
    if (watching)
      sec.body.appendChild(buildStreamPanel(send));
    inflightBusyLabels.set(busyTrackKey(b.kind, b.chatId), labelSpan);
  }
  if (streamWatch && !state.busy.some((b) => b.chatId === streamWatch.chatId && b.kind === streamWatch.kind)) {
    streamData.running = false;
    sec.body.appendChild(buildStreamPanel(send));
  }
  if (!state.connections.length) {
    sec.body.appendChild(textNode(t("ui.tabs.homeTab.renderOverview.memoriaHasNoConnectionToWriteWith"), "lmb-empty"));
  } else if (!state.resolvedSidecarConnectionId) {
    sec.body.appendChild(textNode(t("ui.tabs.homeTab.renderOverview.pickAConnectionInTheTuningTab"), "lmb-empty"));
  }
  host.appendChild(sec.wrap);
}
function renderFailure(host, state, send) {
  if (!state.lastFailure || !state.activeChatId)
    return;
  const f = state.lastFailure;
  const sec = document.createElement("div");
  sec.className = "lmb-failure";
  lessonMark(sec, "home.failure");
  const head = document.createElement("div");
  head.style.fontWeight = "600";
  head.textContent = f.kind === "arc" ? t("ui.tabs.homeTab.renderFailure.lastArcAttemptFailed") : f.kind !== "chapter" ? t("ui.tabs.homeTab.renderFailure.lastAttemptFailed", { kind: f.kind }) : t("ui.tabs.homeTab.renderFailure.lastChapterAttemptFailed");
  const detail = document.createElement("div");
  detail.style.opacity = "0.85";
  detail.textContent = t("ui.tabs.homeTab.renderFailure.triedX", { message: f.message, retriedTimes: f.retriedTimes });
  const row = document.createElement("div");
  row.className = "lmb-actions";
  const chatId = state.activeChatId;
  row.append(makeButton(t("ui.tabs.homeTab.renderFailure.retry"), () => send({ type: "retry_last_failure", chatId }), { primary: true, small: true }));
  sec.append(head, detail, row);
  host.appendChild(sec);
}
function renderPreviews(host, state, send) {
  if (state.pendingPreviews.length === 0 || !state.activeChatId)
    return;
  const sec = section(t("ui.tabs.homeTab.sec.pendingPreviews", { length: state.pendingPreviews.length }));
  for (const p of state.pendingPreviews) {
    sec.body.appendChild(renderPreviewCard(p, state.activeChatId, send));
  }
  host.appendChild(sec.wrap);
}
function renderPreviewCard(preview, chatId, send) {
  const card = document.createElement("div");
  card.className = "lmb-preview-card";
  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "8px";
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${preview.kind !== "chapter" ? preview.kind : ""}`.trim();
  tag.textContent = t("shared.summaryKindTag", { kind: preview.kind });
  head.append(tag, span(preview.title, "lmb-entry-title"));
  card.appendChild(head);
  let lastSentTitle = preview.title;
  let lastSentContent = preview.content;
  const syncEdit = () => {
    const liveTitle = titleInput.value;
    const liveContent = contentInput.value;
    const patch = {};
    if (liveTitle !== lastSentTitle)
      patch.title = liveTitle;
    if (liveContent !== lastSentContent)
      patch.content = liveContent;
    if (Object.keys(patch).length === 0)
      return;
    lastSentTitle = liveTitle;
    lastSentContent = liveContent;
    send({ type: "edit_preview", chatId, draftId: preview.draftId, patch });
  };
  const titleField = field(t("ui.tabs.homeTab.titleField.title"));
  const titleInput = textInput({ value: preview.title, onChange: syncEdit });
  titleField.body.appendChild(titleInput);
  card.appendChild(titleField.wrap);
  const contentField = field(t("ui.tabs.homeTab.contentField.content"));
  const contentInput = textArea({ value: preview.content, rows: 10, onChange: syncEdit });
  contentField.body.appendChild(contentInput);
  card.appendChild(contentField.wrap);
  if (preview.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = t("ui.tabs.homeTab.renderPreviewCard.memoria", { shortComment: preview.shortComment });
    card.appendChild(cm);
  }
  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  meta.append(span(t("ui.common.messageCount", { count: preview.sourceMessageIds.length })), span(t("ui.tabs.homeTab.renderPreviewCard.tokens", { tokenCountOutput: formatTokens(preview.tokenCountOutput) })), span(preview.model || ""));
  card.appendChild(meta);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(t("ui.tabs.homeTab.renderPreviewCard.save"), () => {
    send({
      type: "edit_preview",
      chatId,
      draftId: preview.draftId,
      patch: { title: titleInput.value, content: contentInput.value }
    });
    send({ type: "accept_preview", chatId, draftId: preview.draftId });
  }, { primary: true, small: true }), makeButton(t("ui.tabs.homeTab.renderPreviewCard.discard"), () => send({ type: "discard_preview", chatId, draftId: preview.draftId }), { danger: true, small: true }));
  card.appendChild(actions);
  return card;
}
function renderActions(host, state, send) {
  if (!state.activeChatId)
    return;
  const sec = section(t("ui.tabs.homeTab.sec.actions"));
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const readiness = document.createElement("div");
  readiness.className = "lmb-actions";
  lessonMark(readiness, "home.pills");
  readiness.append(pill(state.coverage.lagSatisfied ? t("ui.tabs.homeTab.renderActions.lagReady") : t("ui.tabs.homeTab.renderActions.lagBuilding"), state.coverage.lagSatisfied ? "ok" : "warn"), pill(state.coverage.windowAvailable ? t("ui.tabs.homeTab.renderActions.windowReady") : t("ui.tabs.homeTab.renderActions.windowBuilding"), state.coverage.windowAvailable ? "ok" : "warn"));
  if (state.backlogChapters > 0)
    readiness.appendChild(pill(t("ui.tabs.homeTab.renderActions.chapterReady", { backlogChapters: state.backlogChapters })));
  if (state.backlogArcs > 0)
    readiness.appendChild(pill(t("ui.tabs.homeTab.renderActions.arcReady", { backlogArcs: state.backlogArcs })));
  sec.body.appendChild(readiness);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "home.actions");
  row.append(lessonMark(makeButton(t("ui.tabs.homeTab.renderActions.fileChapter"), () => send({ type: "create_chapter", chatId }), {
    primary: true,
    disabled,
    title: t("ui.tabs.homeTab.renderActions.compressTheOldestUncoveredMessagesIntoA")
  }), "home.actions.file"));
  if (state.backlogChapters > 1) {
    row.append(makeButton(t("ui.tabs.homeTab.renderActions.fileAll", { backlogChapters: state.backlogChapters }), () => send({ type: "create_all_chapters", chatId }), {
      disabled,
      title: t("ui.tabs.homeTab.renderActions.drainTheChapterBacklogKeepsFilingChapters")
    }));
  }
  row.append(makeButton(t("ui.tabs.homeTab.renderActions.bindArc"), () => send({ type: "create_arc", chatId }), {
    disabled,
    title: t("ui.tabs.homeTab.renderActions.rollTheOldestUnsupersededChaptersIntoA")
  }));
  if (state.backlogArcs > 1) {
    row.append(makeButton(t("ui.tabs.homeTab.renderActions.bindAll", { backlogArcs: state.backlogArcs }), () => send({ type: "create_all_arcs", chatId }), {
      disabled,
      title: t("ui.tabs.homeTab.renderActions.drainTheArcBacklogKeepsBindingArcs")
    }));
  }
  if (codexLessonGated(state.lessons)) {
    const lockedBtn = makeButton(t("ui.tabs.homeTab.lockedBtn.codexTakeALesson"), () => requestLesson({ course: "codex", mode: "lesson" }), {
      title: t("ui.tabs.homeTab.lockedBtn.theCodexUnlocksAfterMemoriaSCodex")
    });
    lockedBtn.classList.add("lmb-locked-btn");
    row.append(lessonMark(lockedBtn, "home.actions.updatecodex"));
  } else if (state.activeProfile.codexEnabled) {
    row.append(lessonMark(makeButton(t("ui.tabs.homeTab.renderActions.updateCodex"), () => requestCodexUpdate(state, chatId, send), {
      disabled: disabled || state.busy.some((b) => b.kind === "codex" && b.chatId === chatId),
      title: t("ui.tabs.homeTab.renderActions.consumeEverythingUpToTheNewestMessage")
    }), "home.actions.updatecodex"));
  }
  sec.body.appendChild(row);
  if (state.busy.length > 0 && state.settings.enabled) {
    sec.body.appendChild(textNode(t("ui.tabs.homeTab.renderActions.actionsUnlockWhenMemoriaFinishesHerCurrent"), "lmb-help"));
  } else if (!state.settings.enabled) {
    sec.body.appendChild(textNode(t("ui.tabs.homeTab.renderActions.theExtensionIsOffFlipItOn"), "lmb-help"));
  }
  const shelfRow = document.createElement("div");
  shelfRow.className = "lmb-actions";
  lessonMark(shelfRow, "home.bookpill");
  if (!state.bookId) {
    const empty = pill(t("ui.tabs.homeTab.empty.noBookYet"), "warn");
    empty.title = t("ui.tabs.homeTab.renderActions.memoriaWillCreateThisChatSWorld");
    shelfRow.appendChild(empty);
  } else {
    const tag = pill(state.bookName ? state.bookName : t("ui.tabs.homeTab.tag.bookReady"), "ok");
    tag.title = t("ui.tabs.homeTab.renderActions.worldBookWhereChaptersAndArcsAre");
    shelfRow.appendChild(tag);
  }
  sec.body.appendChild(shelfRow);
  host.appendChild(sec.wrap);
}
function addRow(grid, label, value) {
  const l = document.createElement("div");
  l.className = "lmb-label";
  l.textContent = label;
  const v = document.createElement("div");
  v.className = "lmb-value";
  v.textContent = value;
  grid.append(l, v);
}
function resetHomeTabLocal() {
  ++promptRevision;
  redrawPrompt = null;
  clearPromptRequests();
  inflightBusyLabels.clear();
  streamWatch = null;
  streamEls = null;
  streamData = { content: "", thinking: "", running: false };
  promptCache.chatId = null;
  promptCache.newestMsgId = null;
  promptCache.data = null;
  promptCache.source = null;
  promptCache.error = null;
  promptCache.loading = false;
  promptCache.expanded.clear();
}

// src/ui/regex-picker.ts
var page = null;
var loadedAt = 0;
var pending2 = null;
var requestedOffset = 0;
var failed = false;
var timer;
var searchTimer;
var query = "";
var pageQuery = "";
var pendingQuery = "";
var progress = null;
var repaint;
function resetRegexPicker() {
  clearTimeout(timer);
  clearTimeout(searchTimer);
  searchTimer = undefined;
  query = "";
  pageQuery = "";
  pendingQuery = "";
  progress = null;
  page = null;
  loadedAt = 0;
  pending2 = null;
  requestedOffset = 0;
  failed = false;
  repaint = undefined;
}
function deliverRegexScriptsPage(message) {
  if (message.requestId !== pending2)
    return;
  if ("progress" in message) {
    progress = message.progress;
    armTimeout(message.requestId);
    repaint?.();
    return;
  }
  clearTimeout(timer);
  pending2 = null;
  failed = "error" in message;
  if ("page" in message) {
    page = message.page;
    pageQuery = pendingQuery;
    loadedAt = Date.now();
  }
  repaint?.();
}
function armTimeout(requestId) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (pending2 !== requestId)
      return;
    pending2 = null;
    failed = true;
    repaint?.();
  }, 30000);
}
function renderRegex(host, profile, patch, send) {
  const sec = section(t("ui.tabs.profileTab.sec.regex"));
  host.appendChild(sec.wrap);
  let outgoingIds = profile.regexOutgoingScriptIds.slice();
  let incomingIds = profile.regexIncomingScriptIds.slice();
  sec.body.appendChild(textNode(t("ui.tabs.profileTab.renderRegex.outgoingRunsOnThePromptBeforeMemoria"), "lmb-help"));
  const search = searchField({ value: query, placeholder: t("ui.regexPicker.search"), onChange: (value) => {
    query = value;
    clearTimeout(timer);
    pending2 = null;
    failed = false;
    progress = null;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTimer = undefined;
      load(0);
    }, 250);
    draw();
  } });
  const results = document.createElement("div");
  results.className = "lmb-regex-results";
  sec.body.append(search.wrap, results);
  function load(offset, refresh = false) {
    clearTimeout(searchTimer);
    searchTimer = undefined;
    clearTimeout(timer);
    pendingQuery = query.trim();
    requestedOffset = offset;
    failed = false;
    progress = null;
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    pending2 = requestId;
    armTimeout(requestId);
    draw();
    try {
      send({ type: "regex_scripts_page", requestId, offset, query: pendingQuery, refresh });
    } catch {
      clearTimeout(timer);
      pending2 = null;
      failed = true;
      draw();
    }
  }
  function draw() {
    results.replaceChildren();
    const visiblePage = pageQuery === query.trim() ? page : null;
    const loading = !!pending2 || !!searchTimer;
    const navigation = document.createElement("div");
    navigation.className = "lmb-regex-toolbar";
    const limit = visiblePage?.limit ?? 50;
    const offset = visiblePage?.offset ?? 0;
    const total = visiblePage?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));
    const pager = document.createElement("div");
    pager.className = "lmb-regex-pager";
    const jump = numberInput({
      value: offset / limit + 1,
      min: 1,
      max: pages,
      step: 1,
      disabled: loading || !visiblePage,
      onBlur: (value) => {
        if (loading || !visiblePage)
          return;
        const next = (Math.min(pages, Math.max(1, Math.floor(value ?? offset / limit + 1))) - 1) * limit;
        jump.value = String(next / limit + 1);
        if (next !== offset)
          load(next);
      }
    });
    jump.className = "lmb-regex-page";
    jump.inputMode = "numeric";
    jump.enterKeyHint = "go";
    jump.setAttribute("aria-label", t("ui.regexPicker.page"));
    jump.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        jump.blur();
      }
    });
    const previous = makeButton("", () => load(Math.max(0, offset - limit)), { title: t("ui.regexPicker.previous"), disabled: loading || offset === 0 });
    const next = makeButton("", () => load(offset + limit), { title: t("ui.regexPicker.next"), disabled: loading || offset + limit >= total });
    for (const [button, label, points] of [
      [previous, t("ui.regexPicker.previous"), "15 18 9 12 15 6"],
      [next, t("ui.regexPicker.next"), "9 18 15 12 9 6"]
    ]) {
      button.className = "lmb-regex-arrow";
      button.setAttribute("aria-label", label);
      button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${points}"/></svg>`;
    }
    pager.append(previous, jump, next);
    navigation.append(pager, makeButton(t("ui.regexPicker.refresh"), () => load(failed ? requestedOffset : Math.min(offset, (pages - 1) * limit), true), { small: true, disabled: loading }));
    if (visiblePage)
      navigation.appendChild(textNode(t("ui.regexPicker.range", {
        first: visiblePage.scripts.length ? offset + 1 : 0,
        last: visiblePage.scripts.length ? offset + visiblePage.scripts.length : 0,
        total
      }), "lmb-help lmb-regex-range"));
    results.appendChild(navigation);
    if (loading)
      results.appendChild(textNode(progress ? t("ui.regexPicker.searchProgress", { scanned: progress.scanned, total: progress.total }) : t("ui.regexPicker.loading"), "lmb-help"));
    if (failed)
      results.appendChild(textNode(t("ui.regexPicker.failed"), "lmb-help"));
    if (!visiblePage)
      return;
    if (!visiblePage.scripts.length) {
      results.appendChild(textNode(query.trim() ? t("ui.regexPicker.noMatches") : t("ui.tabs.profileTab.renderRegex.noRegexScriptsFoundInLumiverse"), "lmb-empty"));
      return;
    }
    const options = visiblePage.scripts.map((script) => ({ value: script.id, label: script.name }));
    const outgoing = field(t("ui.tabs.profileTab.outgoing.outgoing"));
    outgoing.wrap.firstElementChild.classList.add("lmb-regex-group-heading");
    outgoing.wrap.firstElementChild.appendChild(textNode(t("ui.regexPicker.selected", { count: outgoingIds.length }), "lmb-help"));
    outgoing.body.append(multiSelect({
      options,
      selected: outgoingIds,
      onChange: (ids) => {
        outgoingIds = ids;
        patch({ regexOutgoingScriptIds: ids });
        draw();
      }
    }));
    const incoming = field(t("ui.tabs.profileTab.incoming.incoming"));
    incoming.wrap.firstElementChild.classList.add("lmb-regex-group-heading");
    incoming.wrap.firstElementChild.appendChild(textNode(t("ui.regexPicker.selected", { count: incomingIds.length }), "lmb-help"));
    incoming.body.append(multiSelect({
      options,
      selected: incomingIds,
      onChange: (ids) => {
        incomingIds = ids;
        patch({ regexIncomingScriptIds: ids });
        draw();
      }
    }));
    results.append(outgoing.wrap, incoming.wrap);
  }
  repaint = () => {
    if (sec.wrap.isConnected)
      draw();
  };
  draw();
  if (!pending2 && !searchTimer && !failed && (!page || Date.now() - loadedAt >= 5000))
    load(page?.offset ?? 0);
}

// src/ui/summary-transfer.ts
function reportLocalSummaryTransfer(chatId, text, stage = "working") {
  document.dispatchEvent(new CustomEvent("lmb-summary-transfer", { detail: { id: "local", chatId, stage, text } }));
}
function createSummaryTransferPanel(host, send) {
  const pending = new Map;
  let chatId = null;
  const draw = () => {
    host.replaceChildren();
    const item = chatId ? pending.get(chatId) : null;
    host.hidden = !item;
    if (!item)
      return;
    const status = item.status;
    host.className = "lmb-summary-transfer";
    const actions = document.createElement("div");
    actions.className = "lmb-actions";
    if (item.collapsed) {
      actions.appendChild(makeButton(status.stage === "working" ? t("ui.summaryTransfer.draw.summaryTransferInProgress") : t("ui.summaryTransfer.draw.continueSummaryImportExport"), () => {
        item.collapsed = false;
        draw();
      }));
      host.appendChild(actions);
      return;
    }
    const title = document.createElement("strong");
    title.textContent = t("ui.summaryTransfer.draw.summaryImportExport");
    const text = document.createElement("p");
    text.setAttribute("role", "status");
    text.textContent = status.text;
    if (status.stage === "working") {
      const spinner = document.createElement("span");
      spinner.className = "lmb-spinner";
      spinner.setAttribute("aria-hidden", "true");
      text.prepend(spinner, document.createTextNode(" "));
    }
    host.appendChild(title);
    if (status.stage !== "manual" || !status.manualPromptOnly)
      host.appendChild(text);
    const choose = (choice, through) => {
      if (choice !== "cancel") {
        item.status = { ...status, stage: "working", text: t("ui.summaryTransfer.choose.processingSummaryImport") };
        draw();
      }
      send({ type: "summary_import_resolve", chatId: status.chatId, id: status.id, choice, through });
    };
    if (status.stage === "mismatch") {
      actions.append(makeButton(t("ui.summaryTransfer.draw.attemptMatching"), () => choose("match")), makeButton(t("ui.summaryTransfer.draw.letMeSpecify"), () => choose("specify")));
    }
    if (status.stage === "manual") {
      const label = document.createElement("label");
      label.textContent = t("ui.summaryTransfer.draw.upUntilWhichMessageShouldTheseSummaries");
      const input = document.createElement("input");
      input.className = "lmb-input";
      input.type = "number";
      input.min = "0";
      input.max = String(status.messageCount ?? 0);
      input.step = "1";
      input.value = item.input;
      input.required = true;
      input.addEventListener("input", () => {
        item.input = input.value;
      });
      label.appendChild(input);
      host.appendChild(label);
      const help = document.createElement("p");
      help.className = "lmb-help";
      help.textContent = t("ui.summaryTransfer.draw.thisChatHasMessagesCountFrom1", { messageCount0: status.messageCount ?? 0 });
      host.appendChild(help);
      actions.appendChild(makeButton(t("ui.summaryTransfer.draw.importSummaries"), () => {
        if (input.reportValidity())
          choose("manual", Number(input.value));
      }));
    }
    if (status.stage !== "working")
      actions.appendChild(makeButton(status.stage === "done" || status.stage === "error" ? t("ui.summaryTransfer.draw.dismiss") : t("ui.summaryTransfer.draw.cancelImport"), () => {
        if (status.id !== "local" && status.id !== "busy")
          choose("cancel");
        pending.delete(status.chatId);
        draw();
      }));
    actions.appendChild(makeButton(t("ui.summaryTransfer.draw.hide"), () => {
      item.collapsed = true;
      draw();
    }));
    host.appendChild(actions);
  };
  return {
    setChat(next) {
      if (next !== chatId) {
        chatId = next;
        draw();
      }
    },
    deliver(status) {
      if (status.stage === "cancelled") {
        pending.delete(status.chatId);
        if (status.chatId === chatId)
          draw();
        return;
      }
      const old = pending.get(status.chatId);
      if (old && JSON.stringify(old.status) === JSON.stringify(status))
        return;
      pending.set(status.chatId, { status, collapsed: old?.collapsed ?? false, input: old?.input ?? "" });
      if (status.chatId === chatId)
        draw();
    }
  };
}

// src/ui/continuity.ts
function renderContinuitySection(host, ctx, spec) {
  const sec = section(t("ui.continuity.sec.continuityRoot"));
  if (!spec.inherited && !spec.picker) {
    sec.body.appendChild(textNode(spec.emptyText, "lmb-empty"));
    host.appendChild(sec.wrap);
    return sec.wrap;
  }
  if (spec.inherited) {
    sec.body.appendChild(textNode(spec.inherited.text, "lmb-help"));
    if (spec.inherited.detail)
      sec.body.appendChild(spec.inherited.detail);
    const detachRow = document.createElement("div");
    detachRow.className = "lmb-actions";
    const d = spec.inherited.detach;
    detachRow.appendChild(makeButton(d.label, async () => {
      if (await confirmDelete(ctx, d.confirmTitle, d.confirmBody))
        d.run();
    }, { small: true, danger: true, title: d.title }));
    sec.body.appendChild(detachRow);
  }
  if (spec.picker) {
    const p = spec.picker;
    sec.body.appendChild(textNode(p.help, "lmb-help"));
    const row = document.createElement("div");
    row.className = "lmb-actions";
    let actionBtn;
    const picker = select({
      value: p.selectedId,
      ariaLabel: p.ariaLabel,
      options: [
        { value: "", label: p.placeholder },
        ...p.options.map((o) => ({
          value: o.chatId,
          label: o.detail ? `${o.chatName} (${o.detail})` : o.chatName
        }))
      ],
      onChange: (v) => {
        p.onSelect(v);
        actionBtn.disabled = !v;
      }
    });
    row.appendChild(picker);
    actionBtn = makeButton(p.action.label, async () => {
      const sourceChatId = picker.value;
      if (!sourceChatId)
        return;
      const c = p.action.confirm;
      if (c && !await confirmDelete(ctx, c.title, c.body))
        return;
      p.action.run(sourceChatId);
    }, {
      ...p.action.primary ? { primary: true } : {},
      disabled: !p.selectedId,
      title: p.action.title
    });
    row.appendChild(actionBtn);
    sec.body.appendChild(row);
  }
  host.appendChild(sec.wrap);
  return sec.wrap;
}

// src/ui/tabs/books-tab.ts
var SUBTABS = [
  { key: "shelf", label: t("ui.tabs.booksTab.subtabs.shelf") },
  { key: "compose", label: t("ui.tabs.booksTab.subtabs.compose") },
  { key: "continuity", label: t("ui.tabs.booksTab.subtabs.advanced") }
];
var localState = {
  subtab: "shelf",
  shelfQuery: "",
  expandedEntries: new Set,
  showAllGroups: new Set,
  selectedMessages: new Set,
  selectedChapters: new Set,
  selectedArcs: new Set,
  messageFilter: "uncovered",
  messageQuery: "",
  pickerShown: 80,
  anchorMessageId: null,
  suppressNextClick: false,
  rebaseSourceId: "",
  lastChatId: null
};
var SHELF_RECENT = 6;
var PICKER_PAGE = 80;
var LONG_PRESS_MS = 500;
var LONG_PRESS_MOVE_PX = 10;
var pendingFocusEntry = null;
function focusShelfEntry(entryId) {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.add(entryId);
  pendingFocusEntry = entryId;
}
function setBooksSubtab(key) {
  if (key === "shelf" || key === "compose" || key === "continuity")
    localState.subtab = key;
}
function resetBooksTabLocal() {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.clear();
  localState.showAllGroups.clear();
  localState.selectedMessages.clear();
  localState.selectedChapters.clear();
  localState.selectedArcs.clear();
  localState.messageFilter = "uncovered";
  localState.messageQuery = "";
  localState.pickerShown = PICKER_PAGE;
  localState.anchorMessageId = null;
  localState.rebaseSourceId = "";
  localState.lastChatId = null;
  pendingFocusEntry = null;
}
function renderBooksTab(host, state, ctx, send) {
  if (localState.lastChatId !== state.activeChatId) {
    localState.shelfQuery = "";
    localState.expandedEntries.clear();
    localState.showAllGroups.clear();
    localState.selectedMessages.clear();
    localState.selectedChapters.clear();
    localState.selectedArcs.clear();
    localState.anchorMessageId = null;
    localState.rebaseSourceId = "";
    localState.pickerShown = PICKER_PAGE;
    localState.lastChatId = state.activeChatId;
  }
  if (pendingFocusEntry) {
    localState.expandedEntries.add(pendingFocusEntry);
    pendingFocusEntry = null;
  }
  const draw = () => {
    preserveScroll(host, () => {
      host.replaceChildren();
      host.appendChild(makeSubtabs(SUBTABS, localState.subtab, (key) => {
        localState.subtab = key;
        draw();
        scrollPaneTop(host);
      }));
      if (!state.activeChatId) {
        host.appendChild(textNode(t("ui.tabs.booksTab.draw.openAChatToBrowseMemoriaS"), "lmb-empty"));
        return;
      }
      if (localState.subtab === "shelf") {
        renderShelf(host, state, ctx, send, draw);
      } else if (localState.subtab === "compose") {
        renderChapterPicker(host, state, send, draw);
        renderArcPicker(host, state, send, draw);
        renderVolumePicker(host, state, send, draw);
        renderHigherPickers(host, state, send);
      } else {
        renderSummaryTransfer(host, state, ctx, send);
        renderContinuity(host, state, ctx, send);
        renderMaintenance(host, state, ctx, send);
      }
    });
  };
  draw();
}
function renderShelf(host, state, ctx, send, redraw) {
  const sec = section(t("ui.tabs.booksTab.sec.theShelf"));
  const chapters = state.chapters;
  const arcs = state.arcs;
  const volumes = state.volumes;
  if (chapters.length + arcs.length + volumes.length + state.higherBooks.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.booksTab.renderShelf.emptyShelfForNowMemoriaWillStart"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const search = searchField({
    value: localState.shelfQuery,
    placeholder: t("ui.tabs.booksTab.search.searchTitlesAndSummaries"),
    onChange: (v) => {
      localState.shelfQuery = v.toLowerCase();
      buildGroups();
    }
  });
  sec.body.appendChild(search.wrap);
  const listHost = document.createElement("div");
  listHost.className = "lmb-pane";
  lessonMark(listHost, "books.shelf.list");
  listHost.classList.add("lmb-has-higher");
  listHost.tabIndex = 0;
  sec.body.appendChild(listHost);
  const groups = [
    ...HIGHER_TIERS.filter((t) => t > 3).reverse().map((t) => ({ key: TIER_KINDS[t - 1], title: TIER_NAMES[t - 1], kind: TIER_KINDS[t - 1], items: state.higherBooks.filter((e) => e.meta.tier === t) })),
    { key: "volumes", title: t("ui.tabs.booksTab.groups.volumes"), kind: "volume", items: volumes },
    { key: "arcs", title: t("ui.tabs.booksTab.groups.arcs"), kind: "arc", items: arcs },
    { key: "chapters", title: t("ui.tabs.booksTab.groups.chapters"), kind: "chapter", items: chapters }
  ];
  const matchesShelf = (v) => {
    const q = localState.shelfQuery;
    if (!q)
      return true;
    return (v.comment || "").toLowerCase().includes(q) || (v.meta.title || "").toLowerCase().includes(q) || (v.meta.shortComment || "").toLowerCase().includes(q) || (v.content || "").toLowerCase().includes(q);
  };
  const buildGroups = () => {
    listHost.replaceChildren();
    const searching = localState.shelfQuery !== "";
    for (const g of groups) {
      if (g.items.length === 0)
        continue;
      const filtered = searching ? g.items.filter(matchesShelf) : g.items;
      const showAll = searching || localState.showAllGroups.has(g.key);
      const recent = filtered.slice(-SHELF_RECENT);
      const pinned = filtered.filter((v) => localState.expandedEntries.has(v.entryId) && !recent.includes(v));
      const items = showAll ? filtered : [...pinned, ...recent];
      const groupHost = document.createElement("div");
      if (TIER_KINDS.indexOf(g.kind) > 2)
        groupHost.className = "lmb-higher-peek";
      listHost.appendChild(groupHost);
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = searching ? t("ui.tabs.booksTab.buildGroups.of", { title: g.title, length: filtered.length, length2: g.items.length }) : `${g.title} (${g.items.length})`;
      groupHost.appendChild(sub);
      if (searching && filtered.length === 0) {
        groupHost.appendChild(textNode(t("ui.tabs.booksTab.buildGroups.noMatch"), "lmb-empty"));
        continue;
      }
      if (!searching && g.items.length > SHELF_RECENT) {
        const expanded = localState.showAllGroups.has(g.key);
        const toggle = makeButton(expanded ? t("ui.tabs.booksTab.toggle.showRecentOnly") : t("ui.tabs.booksTab.toggle.showAllShown", { length: g.items.length, length2: items.length }), () => {
          if (expanded)
            localState.showAllGroups.delete(g.key);
          else
            localState.showAllGroups.add(g.key);
          buildGroups();
        }, { small: true });
        const row = document.createElement("div");
        row.className = "lmb-actions";
        row.appendChild(toggle);
        groupHost.appendChild(row);
      }
      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const view of items) {
        list.appendChild(renderEntryRow(view, g.kind, state, ctx, send, redraw));
      }
      groupHost.appendChild(list);
    }
  };
  buildGroups();
  host.appendChild(sec.wrap);
}
function renderEntryRow(view, kind, state, ctx, send, redraw) {
  const li = document.createElement("li");
  const expanded = localState.expandedEntries.has(view.entryId);
  li.className = `lmb-entry compact ${kind}${view.active ? "" : " superseded"}${expanded ? " expanded" : ""}`;
  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  lessonMark(head, `books.entry.${view.entryId}`);
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${kind}${view.isGhost ? " ghost" : ""}`;
  tag.textContent = view.isGhost ? t("ui.tabs.booksTab.renderEntryRow.ghost") : t("shared.summaryKindTag", { kind });
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = view.comment || view.meta.title || t("ui.tabs.booksTab.entryFallback", { kind, id: view.entryId.slice(0, 6) });
  const right = document.createElement("span");
  right.className = "lmb-entry-right";
  const range = view.meta.firstMsgIdx !== undefined && view.meta.lastMsgIdx !== undefined ? `${view.meta.firstMsgIdx + 1}–${view.meta.lastMsgIdx + 1}` : t("ui.common.messageCount", { count: view.meta.msgIds.length });
  right.textContent = t("ui.tabs.booksTab.renderEntryRow.t", { range, contentTokens: formatTokens(view.contentTokens) });
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.append(tag, title, right, chevron);
  head.addEventListener("click", () => {
    if (expanded)
      localState.expandedEntries.delete(view.entryId);
    else
      localState.expandedEntries.add(view.entryId);
    redraw();
  });
  li.appendChild(head);
  if (expanded) {
    li.appendChild(renderEntryDetail(view, kind, state, ctx, send));
  }
  return li;
}
function renderEntryDetail(view, kind, state, ctx, send) {
  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";
  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  const before = view.sourceTokensInput || 0;
  const tokenStr = before > 0 ? t("ui.tabs.booksTab.tokenStr.tokens", { formatTokens: formatTokens(before), contentTokens: formatTokens(view.contentTokens) }) : t("ui.tabs.booksTab.tokenStr.tokens2", { contentTokens: formatTokens(view.contentTokens) });
  meta.append(span(tokenStr));
  if (view.meta.model)
    meta.append(span(view.meta.model));
  if (view.isGhost)
    meta.append(span(t("ui.tabs.booksTab.renderEntryDetail.ghostNotYetInjected")));
  else if (!view.active)
    meta.append(span("superseded"));
  detail.appendChild(meta);
  if (view.meta.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = t("ui.tabs.booksTab.renderEntryDetail.memoria", { shortComment: view.meta.shortComment });
    detail.appendChild(cm);
  }
  const preview = document.createElement("div");
  preview.className = "lmb-entry-preview";
  preview.textContent = view.content;
  detail.appendChild(preview);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-entry-actions";
  lessonMark(actions, "books.entry.actions");
  actions.append(makeButton(t("ui.tabs.booksTab.renderEntryDetail.edit"), () => {
    openEditModal(ctx, t("ui.tabs.booksTab.renderEntryDetail.edit2", { kind }), {
      comment: view.comment,
      content: view.content
    }, (next) => {
      if (!chatId)
        return;
      const patch = {};
      if (typeof next.comment === "string" && next.comment !== view.comment) {
        patch.comment = next.comment;
      }
      if (typeof next.content === "string" && next.content !== view.content) {
        patch.content = next.content;
      }
      if (Object.keys(patch).length === 0)
        return;
      send({ type: "update_entry", chatId, entryId: view.entryId, patch });
    });
  }, { small: true, title: t("ui.tabs.booksTab.renderEntryDetail.editThisEntrySLabelAndContent") }));
  const compacted = !view.active && !!view.meta.supersededByEntryId;
  if (!view.isGhost) {
    actions.append(makeButton(t("ui.tabs.booksTab.renderEntryDetail.regenerate"), async () => {
      const ok = await confirmDelete(ctx, t("ui.tabs.booksTab.ok.regenerate"), t("ui.tabs.booksTab.ok.memoriaWillResummarizeTheSameSourcesAnd"));
      if (!ok || !chatId)
        return;
      send({ type: "regenerate_entry", chatId, entryId: view.entryId });
    }, { small: true, disabled: !view.active || view.isRoot && kind === "chapter", title: t("ui.tabs.booksTab.renderEntryDetail.resummarizeTheSameSources") }), makeButton(t("ui.tabs.booksTab.renderEntryDetail.release"), async () => {
      const freed = compacted ? t("ui.tabs.booksTab.freed.higherTierMemoriesKeepCoveringTheseSources") : kind === "chapter" ? t("ui.tabs.booksTab.freed.itsMessagesReturnToThePromptUnless") : kind === "arc" ? t("ui.tabs.booksTab.freed.itsChaptersReviveAndKeepCoveringThose") : t("ui.tabs.booksTab.freed.itsSourceSummariesReviveAndKeepCovering");
      const ok = await confirmDelete(ctx, t("ui.tabs.booksTab.ok.releaseToLorebook"), t("ui.tabs.booksTab.ok.memoriaWillHandThisEntryToYour", { freed }));
      if (!ok || !chatId)
        return;
      send({ type: "release_entry", chatId, entryId: view.entryId });
    }, { small: true, title: t("ui.tabs.booksTab.renderEntryDetail.stripTheLumiBooksMarkerSoTheEntry") }));
  }
  actions.append(makeButton(t("ui.tabs.booksTab.renderEntryDetail.delete"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.booksTab.ok.delete"), view.isGhost ? t("ui.tabs.booksTab.ok.memoriaWillDropThisGhostChapterShe") : compacted ? t("ui.tabs.booksTab.ok.higherTierMemoriesKeepCoveringTheseSources") : kind === "chapter" ? t("ui.tabs.booksTab.ok.memoriaWillLetThoseMessagesBackInto") : kind === "arc" ? t("ui.tabs.booksTab.ok.itsChaptersReviveAndKeepCoveringThose") : t("ui.tabs.booksTab.ok.itsSourceSummariesReviveAndKeepCovering"));
    if (!ok || !chatId)
      return;
    send({ type: "delete_entry", chatId, entryId: view.entryId });
  }, { small: true, danger: true }));
  detail.appendChild(actions);
  return detail;
}
function filterMessages(state) {
  return state.messages.filter((m) => {
    if (localState.messageFilter === "uncovered" && m.covered)
      return false;
    if (localState.messageFilter === "covered" && !m.covered)
      return false;
    if (localState.messageQuery && !(m.preview ?? "").toLowerCase().includes(localState.messageQuery))
      return false;
    return true;
  });
}
function sumSelectedTokens(state) {
  let total = 0;
  const byId = new Map(state.messages.map((m) => [m.id, m]));
  for (const id of localState.selectedMessages) {
    const m = byId.get(id);
    if (m)
      total += m.approxTokens;
  }
  return total;
}
function renderChapterPicker(host, state, send, redraw) {
  const sec = section(t("ui.tabs.booksTab.sec.pickMessagesForAChapter"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.booksTab.renderChapterPicker.pickUncompressedMessagesAndFileThemInto");
  sec.body.appendChild(help);
  const filterRow = document.createElement("div");
  filterRow.className = "lmb-message-filter-row";
  const filterSel = select({
    value: localState.messageFilter,
    options: [
      { value: "uncovered", label: t("ui.tabs.booksTab.filterSel.uncompressedOnly") },
      { value: "all", label: t("ui.tabs.booksTab.filterSel.allMessages") },
      { value: "covered", label: t("ui.tabs.booksTab.filterSel.alreadyFiled") }
    ],
    onChange: (v) => {
      localState.messageFilter = v ?? "uncovered";
      localState.pickerShown = PICKER_PAGE;
      redraw();
    }
  });
  const query = searchField({
    value: localState.messageQuery,
    placeholder: t("ui.tabs.booksTab.query.search"),
    onChange: (v) => {
      localState.messageQuery = v.toLowerCase();
      localState.pickerShown = PICKER_PAGE;
      listEl.replaceChildren(...buildRows(state, syncControls, redraw));
      listEl.scrollTop = listEl.scrollHeight;
      syncControls();
    }
  });
  filterRow.append(filterSel, query.wrap);
  sec.body.appendChild(filterRow);
  const counts = document.createElement("div");
  counts.className = "lmb-help";
  const chatId = state.activeChatId;
  const messageById = new Map(state.messages.map((m) => [m.id, m]));
  const allSelectedExcluded = () => {
    if (localState.selectedMessages.size === 0)
      return false;
    for (const id of localState.selectedMessages) {
      const m = messageById.get(id);
      if (!m || !m.excluded)
        return false;
    }
    return true;
  };
  const compressBtn = lessonMark(makeButton(t("ui.tabs.booksTab.compressBtn.compress"), () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "create_chapter_range", chatId, messageIds: ids });
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }, { primary: true, disabled: localState.selectedMessages.size === 0 }), "books.compose.compress");
  const excludeBtn = lessonMark(makeButton(t("ui.tabs.booksTab.excludeBtn.exclude"), () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "set_message_excluded", chatId, messageIds: ids, excluded: !allSelectedExcluded() });
  }, { title: t("ui.tabs.booksTab.excludeBtn.toggleExclusionForTheSelectedMessagesExcluded") }), "books.compose.exclude");
  const syncControls = () => {
    const tokens = sumSelectedTokens(state);
    counts.textContent = t("ui.tabs.booksTab.syncControls.selectedTokensBefore", { size: localState.selectedMessages.size, formatTokens: formatTokens(tokens) });
    const empty = localState.selectedMessages.size === 0;
    compressBtn.disabled = empty;
    excludeBtn.disabled = empty;
    excludeBtn.classList.toggle("active", allSelectedExcluded());
  };
  const listEl = document.createElement("div");
  listEl.className = "lmb-message-list";
  lessonMark(listEl, "books.compose.list");
  listEl.replaceChildren(...buildRows(state, syncControls, redraw));
  sec.body.appendChild(listEl);
  syncControls();
  const hintRow = document.createElement("div");
  hintRow.className = "lmb-help";
  hintRow.style.display = "flex";
  hintRow.style.justifyContent = "space-between";
  hintRow.style.gap = "10px";
  const hint = document.createElement("span");
  hint.textContent = t("ui.tabs.booksTab.renderChapterPicker.shiftClickOrLongPressSelectsA");
  hintRow.append(counts, hint);
  sec.body.appendChild(hintRow);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(compressBtn, makeButton(t("ui.tabs.booksTab.renderChapterPicker.pickUncompressed"), () => {
    const visible = filterMessages(state).filter((m) => !m.covered && !m.excluded);
    localState.selectedMessages = new Set(visible.map((m) => m.id));
    redraw();
  }), excludeBtn, makeButton(t("ui.tabs.booksTab.renderChapterPicker.clear"), () => {
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
  listEl.scrollTop = listEl.scrollHeight;
}
function buildRows(state, onToggle, redraw) {
  const filtered = filterMessages(state);
  if (filtered.length === 0) {
    return [textNode(t("ui.tabs.booksTab.buildRows.noMessagesMatch"), "lmb-empty")];
  }
  const visible = filtered.slice(-localState.pickerShown);
  const rows = [];
  if (filtered.length > visible.length) {
    const older = filtered.length - visible.length;
    const more = makeButton(t("ui.tabs.booksTab.more.showOlder", { older }), () => {
      localState.pickerShown += PICKER_PAGE;
      redraw();
    }, { small: true });
    const wrap = document.createElement("div");
    wrap.className = "lmb-actions lmb-picker-more";
    wrap.appendChild(more);
    rows.push(wrap);
  }
  for (const m of visible)
    rows.push(buildMessageRow(m, state, onToggle, redraw));
  return rows;
}
function buildMessageRow(m, state, onToggle, redraw) {
  const row = document.createElement("label");
  row.className = `lmb-message-row${m.covered ? " covered" : ""}${m.excluded ? " excluded" : ""}${localState.selectedMessages.has(m.id) ? " selected" : ""}`;
  row.title = t("ui.tabs.booksTab.buildMessageRow.shiftClickOrLongPressOnTouch");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = localState.selectedMessages.has(m.id);
  cb.disabled = m.covered && !m.excluded;
  const triggerRangeFromAnchor = () => {
    const anchorId = localState.anchorMessageId;
    if (!anchorId || anchorId === m.id)
      return false;
    const newState = !localState.selectedMessages.has(m.id);
    applyRangeSelection(state, anchorId, m.id, newState);
    localState.anchorMessageId = m.id;
    redraw();
    return true;
  };
  row.addEventListener("click", (e) => {
    if (localState.suppressNextClick) {
      localState.suppressNextClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const mouseEvent = e;
    if (!mouseEvent.shiftKey || m.covered)
      return;
    if (!triggerRangeFromAnchor())
      return;
    e.preventDefault();
  });
  row.addEventListener("pointerdown", (e) => {
    const pe = e;
    if (pe.pointerType !== "touch" || m.covered)
      return;
    const startX = pe.clientX;
    const startY = pe.clientY;
    let timer = null;
    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", cleanup);
      row.removeEventListener("pointercancel", cleanup);
      row.removeEventListener("pointerleave", cleanup);
    };
    const onMove = (mv) => {
      const m2 = mv;
      if (Math.abs(m2.clientX - startX) > LONG_PRESS_MOVE_PX || Math.abs(m2.clientY - startY) > LONG_PRESS_MOVE_PX)
        cleanup();
    };
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", cleanup);
    row.addEventListener("pointercancel", cleanup);
    row.addEventListener("pointerleave", cleanup);
    timer = setTimeout(() => {
      timer = null;
      cleanup();
      if (!triggerRangeFromAnchor())
        return;
      localState.suppressNextClick = true;
      setTimeout(() => {
        localState.suppressNextClick = false;
      }, 150);
      try {
        navigator.vibrate?.(30);
      } catch {}
    }, LONG_PRESS_MS);
  });
  cb.addEventListener("change", () => {
    if (cb.checked)
      localState.selectedMessages.add(m.id);
    else
      localState.selectedMessages.delete(m.id);
    localState.anchorMessageId = m.id;
    row.classList.toggle("selected", cb.checked);
    onToggle();
  });
  const idxSpan = document.createElement("span");
  idxSpan.className = "lmb-msg-role";
  idxSpan.textContent = t("ui.tabs.booksTab.buildMessageRow.value", { indexInChat1: m.indexInChat + 1 });
  const roleSpan = document.createElement("span");
  roleSpan.className = "lmb-msg-role";
  roleSpan.style.opacity = "0.5";
  roleSpan.textContent = t("ui.common.compactRole", { role: m.role, fallback: m.role.slice(0, 4).toUpperCase() });
  const preview = document.createElement("span");
  preview.className = "lmb-msg-preview";
  preview.textContent = m.preview || t("ui.tabs.booksTab.buildMessageRow.empty");
  const icons = document.createElement("span");
  icons.className = "lmb-msg-icons";
  if (m.covered && !m.excluded) {
    const filed = document.createElement("span");
    filed.title = t("ui.tabs.booksTab.buildMessageRow.alreadyFiledIntoAChapterArcOr");
    filed.className = "lmb-msg-filed";
    filed.textContent = t("ui.tabs.booksTab.buildMessageRow.value2");
    icons.appendChild(filed);
  }
  if (m.excluded) {
    const ex = document.createElement("span");
    ex.title = t("ui.tabs.booksTab.buildMessageRow.excludedNeverHiddenReplacedOrSummarized");
    ex.className = "lmb-msg-excluded-badge";
    ex.textContent = t("ui.tabs.booksTab.buildMessageRow.value3");
    icons.appendChild(ex);
  }
  if (m.hidden) {
    const icon = document.createElement("span");
    icon.title = t("ui.tabs.booksTab.buildMessageRow.hiddenInChat");
    icon.innerHTML = HIDDEN_ICON;
    icons.appendChild(icon);
  }
  row.append(cb, idxSpan, roleSpan, preview, icons);
  return row;
}
function applyRangeSelection(state, anchorId, targetId, newState) {
  const visible = filterMessages(state);
  const anchorIdx = visible.findIndex((m) => m.id === anchorId);
  const targetIdx = visible.findIndex((m) => m.id === targetId);
  if (anchorIdx === -1 || targetIdx === -1)
    return;
  const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  for (let i = from;i <= to; i++) {
    const m = visible[i];
    if (!m || m.covered || m.excluded)
      continue;
    if (newState)
      localState.selectedMessages.add(m.id);
    else
      localState.selectedMessages.delete(m.id);
  }
}
function renderArcPicker(host, state, send, redraw) {
  const sec = section(t("ui.tabs.booksTab.sec.bindChaptersIntoAnArc"));
  lessonMark(sec.wrap, "books.compose.arcs");
  const bindable = state.chapters.filter((ch) => ch.active);
  if (bindable.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.booksTab.renderArcPicker.memoriaHasNotFiledAnyChaptersYet"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-multiselect";
  const arcCounts = document.createElement("div");
  arcCounts.className = "lmb-help";
  const updateArcCounts = () => {
    let before = 0;
    for (const ch of state.chapters) {
      if (!localState.selectedChapters.has(ch.entryId))
        continue;
      before += ch.sourceTokensInput > 0 ? ch.sourceTokensInput : ch.contentTokens;
    }
    arcCounts.textContent = t("ui.tabs.booksTab.updateArcCounts.selectedTokensBefore", { size: localState.selectedChapters.size, formatTokens: formatTokens(before) });
  };
  for (const ch of bindable) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedChapters.has(ch.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked)
        localState.selectedChapters.add(ch.entryId);
      else
        localState.selectedChapters.delete(ch.entryId);
      updateArcCounts();
    });
    const text = document.createElement("span");
    const range = ch.meta.firstMsgIdx !== undefined && ch.meta.lastMsgIdx !== undefined ? t("ui.tabs.booksTab.range.msgs", { firstMsgIdx1: ch.meta.firstMsgIdx + 1, lastMsgIdx1: ch.meta.lastMsgIdx + 1 }) : "";
    const tokenStr = ch.sourceTokensInput > 0 ? t("ui.common.compactTokenChange", { before: formatTokens(ch.sourceTokensInput), after: formatTokens(ch.contentTokens) }) : t("ui.common.compactTokens", { tokens: formatTokens(ch.contentTokens) });
    text.textContent = t("ui.tabs.booksTab.renderArcPicker.value", { slice: ch.comment || ch.meta.title || ch.entryId.slice(0, 6), range, tokenStr });
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateArcCounts();
  sec.body.appendChild(arcCounts);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(t("ui.tabs.booksTab.renderArcPicker.bindSelected"), () => {
    const ids = Array.from(localState.selectedChapters);
    if (ids.length === 0)
      return;
    send({ type: "create_arc_from", chatId, chapterEntryIds: ids });
    localState.selectedChapters.clear();
    redraw();
  }, { primary: true }), makeButton(t("ui.tabs.booksTab.renderArcPicker.selectAllActive"), () => {
    localState.selectedChapters = new Set(state.chapters.filter((ch) => ch.active).map((ch) => ch.entryId));
    redraw();
  }), makeButton(t("ui.tabs.booksTab.renderArcPicker.clear"), () => {
    localState.selectedChapters.clear();
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}
function renderVolumePicker(host, state, send, redraw) {
  const sec = section(t("ui.tabs.booksTab.sec.pressArcsIntoAVolume"));
  lessonMark(sec.wrap, "books.compose.volumes");
  const activeArcs = state.arcs.filter((a) => a.active);
  if (activeArcs.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.booksTab.renderVolumePicker.memoriaHasNoUnboundArcsToPress"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.booksTab.renderVolumePicker.aVolumeReplacesItsSourceArcsIn");
  sec.body.appendChild(help);
  const list = document.createElement("div");
  list.className = "lmb-multiselect";
  const counts = document.createElement("div");
  counts.className = "lmb-help";
  const updateCounts = () => {
    let before = 0;
    for (const a of activeArcs) {
      if (!localState.selectedArcs.has(a.entryId))
        continue;
      before += a.sourceTokensInput > 0 ? a.sourceTokensInput : a.contentTokens;
    }
    counts.textContent = t("ui.tabs.booksTab.updateCounts.selectedTokensBefore", { size: localState.selectedArcs.size, formatTokens: formatTokens(before) });
  };
  for (const arc of activeArcs) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedArcs.has(arc.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked)
        localState.selectedArcs.add(arc.entryId);
      else
        localState.selectedArcs.delete(arc.entryId);
      updateCounts();
    });
    const text = document.createElement("span");
    const range = arc.meta.firstMsgIdx !== undefined && arc.meta.lastMsgIdx !== undefined ? t("ui.tabs.booksTab.range.msgs", { firstMsgIdx1: arc.meta.firstMsgIdx + 1, lastMsgIdx1: arc.meta.lastMsgIdx + 1 }) : "";
    const tokenStr = arc.sourceTokensInput > 0 ? t("ui.common.compactTokenChange", { before: formatTokens(arc.sourceTokensInput), after: formatTokens(arc.contentTokens) }) : t("ui.common.compactTokens", { tokens: formatTokens(arc.contentTokens) });
    text.textContent = t("ui.tabs.booksTab.renderVolumePicker.value", { slice: arc.comment || arc.meta.title || arc.entryId.slice(0, 6), range, tokenStr });
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateCounts();
  sec.body.appendChild(counts);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(t("ui.tabs.booksTab.renderVolumePicker.pressSelected"), () => {
    const ids = Array.from(localState.selectedArcs);
    if (ids.length === 0)
      return;
    send({ type: "create_volume_from", chatId, arcEntryIds: ids });
    localState.selectedArcs.clear();
    redraw();
  }, { primary: true }), makeButton(t("ui.tabs.booksTab.renderVolumePicker.selectAllActive"), () => {
    localState.selectedArcs = new Set(activeArcs.map((a) => a.entryId));
    redraw();
  }), makeButton(t("ui.tabs.booksTab.renderVolumePicker.clear"), () => {
    localState.selectedArcs.clear();
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}
function renderContinuity(host, state, ctx, send) {
  const chatId = state.activeChatId;
  const hasOwn = state.chapters.some((ch) => !ch.isRoot && !ch.isGhost) || state.arcs.some((a) => !a.isRoot) || state.volumes.some((v) => !v.isRoot) || state.higherBooks.some((v) => !v.isRoot);
  const hasRoot = state.rootEntryCount > 0;
  const candidates = state.availableRoots;
  let detail = null;
  if (hasRoot) {
    const rootEntries = [
      ...state.volumes.filter((v) => v.isRoot),
      ...state.higherBooks.filter((v) => v.isRoot),
      ...state.arcs.filter((a) => a.isRoot),
      ...state.chapters.filter((ch) => ch.isRoot)
    ];
    if (rootEntries.length) {
      detail = document.createElement("div");
      detail.className = "lmb-multiselect";
      for (const e of rootEntries) {
        const rowEl = document.createElement("div");
        rowEl.className = "lmb-multiselect-row";
        rowEl.style.opacity = "0.75";
        const tag = TIER_NAMES[e.meta.tier - 1];
        rowEl.textContent = t("ui.tabs.booksTab.renderContinuity.t", { tag, slice: e.comment || e.meta.title || e.entryId.slice(0, 6), contentTokens: formatTokens(e.contentTokens) });
        detail.appendChild(rowEl);
      }
    }
  }
  const originName = state.rootOriginName || state.rootOrigin?.slice(0, 8) || t("ui.tabs.booksTab.originName.anImportedLorebook");
  const wrap = renderContinuitySection(host, ctx, {
    emptyText: t("ui.tabs.booksTab.wrap.noOtherChatHasMemoriesToInherit"),
    inherited: hasRoot ? {
      text: t("ui.tabs.booksTab.wrap.inheritedFromMemor", { originName, rootEntryCount: state.rootEntryCount }),
      detail,
      detach: {
        label: t("ui.tabs.booksTab.wrap.detachRoot"),
        title: t("ui.tabs.booksTab.wrap.removeTheInheritedRootMemoriesFromThis"),
        confirmTitle: t("ui.tabs.booksTab.wrap.detachInheritedMemories"),
        confirmBody: t("ui.tabs.booksTab.wrap.memoriaWillRemoveTheInheritedMemoriesFrom"),
        run: () => send({ type: "detach_root", chatId })
      }
    } : null,
    picker: candidates.length > 0 ? {
      help: hasOwn ? t("ui.tabs.booksTab.wrap.thisChatAlreadyHasItsOwnMemories") : t("ui.tabs.booksTab.wrap.seedThisChatWithAnotherChatS"),
      ariaLabel: t("ui.tabs.booksTab.wrap.sourceChatToInheritMemoriesFrom"),
      placeholder: t("ui.tabs.booksTab.wrap.pickASourceChat"),
      options: candidates.map((cand) => ({
        chatId: cand.chatId,
        chatName: cand.chatName,
        detail: String(cand.entryCount)
      })),
      selectedId: localState.rebaseSourceId,
      onSelect: (v) => {
        localState.rebaseSourceId = v;
      },
      action: hasOwn ? {
        label: t("ui.tabs.booksTab.wrap.rebuildFrom"),
        title: t("ui.tabs.booksTab.wrap.replacesThisChatSMemoriesWithThe"),
        confirm: {
          title: t("ui.tabs.booksTab.wrap.rebuildFromRoot"),
          body: t("ui.tabs.booksTab.wrap.memoriaWillDeleteThisChatSExisting")
        },
        run: (sourceChatId) => send({ type: "rebuild_root", chatId, sourceChatId })
      } : {
        label: t("ui.tabs.booksTab.wrap.rebase"),
        title: t("ui.tabs.booksTab.wrap.seedThisChatWithTheChosenChat"),
        primary: true,
        run: (sourceChatId) => send({ type: "rebase_root", chatId, sourceChatId })
      }
    } : null
  });
  lessonMark(wrap, "books.cont.root");
}
function renderMaintenance(host, state, ctx, send) {
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const sec = section(t("ui.tabs.booksTab.sec.maintenance"));
  lessonMark(sec.wrap, "books.maint");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.booksTab.renderMaintenance.repairToolsForWhenTheShelfAnd");
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton(t("ui.tabs.booksTab.renderMaintenance.reHideCovered"), () => send({ type: "resync_hidden", chatId }), {
    disabled,
    title: t("ui.tabs.booksTab.renderMaintenance.reApplyTheExcludeFromContextFlag")
  }), makeButton(t("ui.tabs.booksTab.renderMaintenance.resyncVisibility"), () => send({ type: "resync_visibility", chatId }), {
    disabled,
    title: t("ui.tabs.booksTab.renderMaintenance.unhideMessagesWhoseChapterOrArcNo")
  }));
  sec.body.appendChild(row);
  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  dangerRow.append(makeButton(t("ui.tabs.booksTab.renderMaintenance.rebuildBooks"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.booksTab.ok.rebuildTheShelf"), t("ui.tabs.booksTab.ok.memoriaWillDeleteEveryChapterArcAnd"));
    if (ok)
      send({ type: "rebuild_books", chatId });
  }, {
    disabled,
    title: t("ui.tabs.booksTab.renderMaintenance.wipeTheShelfAndReSummarizeThis")
  }), makeButton(t("ui.tabs.booksTab.renderMaintenance.wipeBooks"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.booksTab.ok.wipeTheShelf"), t("ui.tabs.booksTab.ok.memoriaWillDeleteEveryChapterArcAnd2"));
    if (ok)
      send({ type: "wipe_books", chatId });
  }, { danger: true, disabled, title: t("ui.tabs.booksTab.renderMaintenance.deleteEveryLumiBooksEntryForThisChat") }));
  sec.body.appendChild(dangerRow);
  host.appendChild(sec.wrap);
}
function renderHigherPickers(host, state, send) {
  for (const tier of HIGHER_TIERS) {
    const kind = TIER_KINDS[tier - 1];
    const sec = section(t("ui.tabs.booksTab.sec.bind", { tierNamesTier1: TIER_NAMES[tier - 1] }));
    const candidates = [...state.arcs, ...state.volumes, ...state.higherBooks].filter((e) => e.active && e.meta.tier === tier - 1);
    const selected = new Set;
    const busy = state.busy.some((b) => b.chatId === state.activeChatId && b.kind === kind);
    if (tier > 3)
      for (const entry of candidates) {
        const row = document.createElement("label");
        row.className = "lmb-multiselect-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.onchange = () => {
          if (cb.checked)
            selected.add(entry.entryId);
          else
            selected.delete(entry.entryId);
        };
        row.append(cb, document.createTextNode(entry.comment || entry.meta.title || entry.entryId));
        sec.body.appendChild(row);
      }
    const actions = document.createElement("div");
    actions.className = "lmb-actions";
    if (tier > 3)
      actions.appendChild(makeButton(t("ui.tabs.booksTab.renderHigherPickers.bindSelected"), () => {
        if (selected.size)
          send({ type: "create_higher_from", chatId: state.activeChatId, tier, entryIds: [...selected] });
      }, { disabled: busy || !candidates.length }));
    actions.appendChild(makeButton(t("ui.tabs.booksTab.renderHigherPickers.bindReadyBatches"), () => send({ type: "create_higher_auto", chatId: state.activeChatId, tier }), { disabled: busy || !candidates.length }));
    sec.body.append(actions, textNode(t("ui.tabs.booksTab.renderHigherPickers.activeSourceEntriesReadyBatchesUseThis", { length: candidates.length }), "lmb-help"));
    host.appendChild(sec.wrap);
  }
}
function renderSummaryTransfer(host, state, ctx, send) {
  const sec = section(t("ui.tabs.booksTab.sec.summaryExportAndImport"));
  sec.body.appendChild(textNode(t("ui.tabs.booksTab.renderSummaryTransfer.exportTheActiveShelfWithRawMessage"), "lmb-help"));
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const chatId = state.activeChatId;
  actions.append(makeButton(t("ui.tabs.booksTab.renderSummaryTransfer.exportSummaries"), () => send({ type: "summary_export", chatId })), makeButton(t("ui.tabs.booksTab.renderSummaryTransfer.importSummaries"), async () => {
    try {
      const files = await ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 20000000 });
      if (files[0]) {
        reportLocalSummaryTransfer(chatId, t("ui.tabs.booksTab.renderSummaryTransfer.readingSummaryFile"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        send({ type: "summary_import", chatId, raw: JSON.parse(new TextDecoder().decode(files[0].bytes)) });
      }
    } catch (err) {
      console.warn("[LumiBooks] summary import failed", err);
      reportLocalSummaryTransfer(chatId, t("ui.tabs.booksTab.renderSummaryTransfer.couldNotReadThatLorebookJsonFile"), "error");
    }
  }, { disabled: state.busy.some((b) => b.chatId === chatId) }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}
// node_modules/d3-quadtree/src/add.js
function add_default(d) {
  const x = +this._x.call(null, d), y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
}
function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y))
    return tree;
  var parent, node = tree._root, leaf = { data: d }, { _x0: x0, _y0: y0, _x1: x1, _y1: y1 } = tree, xm, ym, xp, yp, right, bottom, i, j;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right]))
      return parent[i] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp)
    return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}
function addAll(data) {
  var d, i, n = data.length, x, y, xz = new Array(n), yz = new Array(n), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (i = 0;i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d)))
      continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0)
      x0 = x;
    if (x > x1)
      x1 = x;
    if (y < y0)
      y0 = y;
    if (y > y1)
      y1 = y;
  }
  if (x0 > x1 || y0 > y1)
    return this;
  this.cover(x0, y0).cover(x1, y1);
  for (i = 0;i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }
  return this;
}

// node_modules/d3-quadtree/src/cover.js
function cover_default(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y))
    return this;
  var x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  } else {
    var z = x1 - x0 || 1, node = this._root, parent, i;
    while (x0 > x || x >= x1 || y0 > y || y >= y1) {
      i = (y < y0) << 1 | x < x0;
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0:
          x1 = x0 + z, y1 = y0 + z;
          break;
        case 1:
          x0 = x1 - z, y1 = y0 + z;
          break;
        case 2:
          x1 = x0 + z, y0 = y1 - z;
          break;
        case 3:
          x0 = x1 - z, y0 = y1 - z;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

// node_modules/d3-quadtree/src/data.js
function data_default() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}

// node_modules/d3-quadtree/src/extent.js
function extent_default(_) {
  return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

// node_modules/d3-quadtree/src/quad.js
function quad_default(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

// node_modules/d3-quadtree/src/find.js
function find_default(x, y, radius) {
  var data, x0 = this._x0, y0 = this._y0, x1, y1, x2, y2, x3 = this._x1, y3 = this._y1, quads = [], node = this._root, q, i;
  if (node)
    quads.push(new quad_default(node, x0, y0, x3, y3));
  if (radius == null)
    radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }
  while (q = quads.pop()) {
    if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0)
      continue;
    if (node.length) {
      var xm = (x1 + x2) / 2, ym = (y1 + y2) / 2;
      quads.push(new quad_default(node[3], xm, ym, x2, y2), new quad_default(node[2], x1, ym, xm, y2), new quad_default(node[1], xm, y1, x2, ym), new quad_default(node[0], x1, y1, xm, ym));
      if (i = (y >= ym) << 1 | x >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    } else {
      var dx = x - +this._x.call(null, node.data), dy = y - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }
  return data;
}

// node_modules/d3-quadtree/src/remove.js
function remove_default(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d)))
    return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1, x, y, xm, ym, right, bottom, i, j;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x >= (xm = (x0 + x1) / 2))
        x0 = xm;
      else
        x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2))
        y0 = ym;
      else
        y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right]))
        return this;
      if (!node.length)
        break;
      if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3])
        retainer = parent, j = i;
    }
  while (node.data !== d)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i] = next : delete parent[i];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll(data) {
  for (var i = 0, n = data.length;i < n; ++i)
    this.remove(data[i]);
  return this;
}

// node_modules/d3-quadtree/src/root.js
function root_default() {
  return this._root;
}

// node_modules/d3-quadtree/src/size.js
function size_default() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}

// node_modules/d3-quadtree/src/visit.js
function visit_default(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node)
    quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
    }
  }
  return this;
}

// node_modules/d3-quadtree/src/visitAfter.js
function visitAfter_default(callback) {
  var quads = [], next = [], q;
  if (this._root)
    quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

// node_modules/d3-quadtree/src/x.js
function defaultX(d) {
  return d[0];
}
function x_default(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

// node_modules/d3-quadtree/src/y.js
function defaultY(d) {
  return d[1];
}
function y_default(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

// node_modules/d3-quadtree/src/quadtree.js
function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}
function leaf_copy(leaf) {
  var copy = { data: leaf.data }, next = copy;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy;
}
var treeProto = quadtree.prototype = Quadtree.prototype;
treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
  if (!node)
    return copy;
  if (!node.length)
    return copy._root = leaf_copy(node), copy;
  nodes = [{ source: node, target: copy._root = new Array(4) }];
  while (node = nodes.pop()) {
    for (var i = 0;i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length)
          nodes.push({ source: child, target: node.target[i] = new Array(4) });
        else
          node.target[i] = leaf_copy(child);
      }
    }
  }
  return copy;
};
treeProto.add = add_default;
treeProto.addAll = addAll;
treeProto.cover = cover_default;
treeProto.data = data_default;
treeProto.extent = extent_default;
treeProto.find = find_default;
treeProto.remove = remove_default;
treeProto.removeAll = removeAll;
treeProto.root = root_default;
treeProto.size = size_default;
treeProto.visit = visit_default;
treeProto.visitAfter = visitAfter_default;
treeProto.x = x_default;
treeProto.y = y_default;
// node_modules/d3-force/src/constant.js
function constant_default(x) {
  return function() {
    return x;
  };
}

// node_modules/d3-force/src/jiggle.js
function jiggle_default(random) {
  return (random() - 0.5) * 0.000001;
}

// node_modules/d3-force/src/collide.js
function x(d) {
  return d.x + d.vx;
}
function y(d) {
  return d.y + d.vy;
}
function collide_default(radius) {
  var nodes, radii, random, strength = 1, iterations = 1;
  if (typeof radius !== "function")
    radius = constant_default(radius == null ? 1 : +radius);
  function force() {
    var i, n = nodes.length, tree, node, xi, yi, ri, ri2;
    for (var k = 0;k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare);
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }
    function apply(quad, x0, y0, x1, y1) {
      var { data, r: rj } = quad, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx, y = yi - data.y - data.vy, l = x * x + y * y;
          if (l < r * r) {
            if (x === 0)
              x = jiggle_default(random), l += x * x;
            if (y === 0)
              y = jiggle_default(random), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }
  function prepare(quad) {
    if (quad.data)
      return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0;i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0;i < n; ++i)
      node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : radius;
  };
  return force;
}
// node_modules/d3-force/src/link.js
function index(d) {
  return d.index;
}
function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node)
    throw new Error("node not found: " + nodeId);
  return node;
}
function link_default(links) {
  var id = index, strength = defaultStrength, strengths, distance = constant_default(30), distances, nodes, count, bias, random, iterations = 1;
  if (links == null)
    links = [];
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }
  function force(alpha) {
    for (var k = 0, n = links.length;k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b;i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle_default(random);
        y = target.y + target.vy - source.y - source.vy || jiggle_default(random);
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, m = links.length, nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])), link;
    for (i = 0, count = new Array(n);i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object")
        link.source = find(nodeById, link.source);
      if (typeof link.target !== "object")
        link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i = 0, bias = new Array(m);i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }
    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }
  function initializeStrength() {
    if (!nodes)
      return;
    for (var i = 0, n = links.length;i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }
  function initializeDistance() {
    if (!nodes)
      return;
    for (var i = 0, n = links.length;i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };
  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initializeStrength(), force) : strength;
  };
  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant_default(+_), initializeDistance(), force) : distance;
  };
  return force;
}
// node_modules/d3-dispatch/src/dispatch.js
var noop = { value: () => {} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type)
        _[t] = set(_[t], typename.name, callback);
      else if (callback == null)
        for (t in _)
          _[t] = set(_[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _)
      copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
function get(type, name) {
  for (var i = 0, n = type.length, c;i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}
function set(type, name, callback) {
  for (var i = 0, n = type.length;i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type.push({ name, value: callback });
  return type;
}
var dispatch_default = dispatch;
// node_modules/d3-timer/src/timer.js
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer2.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail)
        taskTail._next = this;
      else
        taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer2(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame)
    return;
  if (timeout)
    timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity)
      timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
// node_modules/d3-force/src/lcg.js
var a = 1664525;
var c = 1013904223;
var m = 4294967296;
function lcg_default() {
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}

// node_modules/d3-force/src/simulation.js
function x2(d) {
  return d.x;
}
function y2(d) {
  return d.y;
}
var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));
function simulation_default(nodes) {
  var simulation, alpha = 1, alphaMin = 0.001, alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), alphaTarget = 0, velocityDecay = 0.6, forces = new Map, stepper = timer2(step), event = dispatch_default("tick", "end"), random = lcg_default();
  if (nodes == null)
    nodes = [];
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }
  function tick(iterations) {
    var i, n = nodes.length, node;
    if (iterations === undefined)
      iterations = 1;
    for (var k = 0;k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;
      forces.forEach(function(force) {
        force(alpha);
      });
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        if (node.fx == null)
          node.x += node.vx *= velocityDecay;
        else
          node.x = node.fx, node.vx = 0;
        if (node.fy == null)
          node.y += node.vy *= velocityDecay;
        else
          node.y = node.fy, node.vy = 0;
      }
    }
    return simulation;
  }
  function initializeNodes() {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null)
        node.x = node.fx;
      if (node.fy != null)
        node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }
  function initializeForce(force) {
    if (force.initialize)
      force.initialize(nodes, random);
    return force;
  }
  initializeNodes();
  return simulation = {
    tick,
    restart: function() {
      return stepper.restart(step), simulation;
    },
    stop: function() {
      return stepper.stop(), simulation;
    },
    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },
    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },
    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },
    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },
    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },
    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },
    randomSource: function(_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },
    force: function(name, _) {
      return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
    },
    find: function(x, y, radius) {
      var i = 0, n = nodes.length, dx, dy, d2, node, closest;
      if (radius == null)
        radius = Infinity;
      else
        radius *= radius;
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius)
          closest = node, radius = d2;
      }
      return closest;
    },
    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

// node_modules/d3-force/src/manyBody.js
function manyBody_default() {
  var nodes, node, random, alpha, strength = constant_default(-30), strengths, distanceMin2 = 1, distanceMax2 = Infinity, theta2 = 0.81;
  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x2, y2).visitAfter(accumulate);
    for (alpha = _, i = 0;i < n; ++i)
      node = nodes[i], tree.visit(apply);
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0;i < n; ++i)
      node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }
  function accumulate(quad) {
    var strength = 0, q, c, weight = 0, x, y, i;
    if (quad.length) {
      for (x = y = i = 0;i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          strength += q.value, weight += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    } else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do
        strength += strengths[q.data.index];
      while (q = q.next);
    }
    quad.value = strength;
  }
  function apply(quad, x1, _, x2) {
    if (!quad.value)
      return true;
    var x = quad.x - node.x, y = quad.y - node.y, w = x2 - x1, l = x * x + y * y;
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0)
          x = jiggle_default(random), l += x * x;
        if (y === 0)
          y = jiggle_default(random), l += y * y;
        if (l < distanceMin2)
          l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    } else if (quad.length || l >= distanceMax2)
      return;
    if (quad.data !== node || quad.next) {
      if (x === 0)
        x = jiggle_default(random), l += x * x;
      if (y === 0)
        y = jiggle_default(random), l += y * y;
      if (l < distanceMin2)
        l = Math.sqrt(distanceMin2 * l);
    }
    do
      if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x * w;
        node.vy += y * w;
      }
    while (quad = quad.next);
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };
  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };
  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };
  return force;
}
// node_modules/d3-force/src/x.js
function x_default2(x) {
  var strength = constant_default(0.1), nodes, strengths, xz;
  if (typeof x !== "function")
    x = constant_default(x == null ? 0 : +x);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0;i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function(_) {
    nodes = _;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : x;
  };
  return force;
}
// node_modules/d3-force/src/y.js
function y_default2(y) {
  var strength = constant_default(0.1), nodes, strengths, yz;
  if (typeof y !== "function")
    y = constant_default(y == null ? 0 : +y);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0;i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function(_) {
    nodes = _;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : y;
  };
  return force;
}
// src/ui/codex-file-state.ts
class CodexFileStateChanges {
  pending = new Map;
  sequence = 0;
  key(chatId, file) {
    return JSON.stringify([chatId, file]);
  }
  value(chatId, file, fallback) {
    return this.pending.get(this.key(chatId, file))?.desired ?? fallback;
  }
  change(chatId, file, current, desired, send) {
    const key = this.key(chatId, file);
    const existing = this.pending.get(key);
    if (existing) {
      existing.desired = desired;
      return;
    }
    const pending = { confirmed: current, desired, sent: desired, seq: ++this.sequence, send };
    this.pending.set(key, pending);
    send({ type: "codex_set_file_state", chatId, file, state: desired, seq: pending.seq });
  }
  acknowledge(chatId, file, seq, error = false) {
    const key = this.key(chatId, file), pending = this.pending.get(key);
    if (!pending || pending.seq !== seq)
      return null;
    if (error) {
      this.pending.delete(key);
      return pending.confirmed;
    }
    pending.confirmed = pending.sent;
    if (pending.desired === pending.sent)
      this.pending.delete(key);
    else {
      pending.sent = pending.desired;
      pending.seq = ++this.sequence;
      pending.send({ type: "codex_set_file_state", chatId, file, state: pending.sent, seq: pending.seq });
    }
    return pending.confirmed;
  }
  clear() {
    this.pending.clear();
  }
}

// src/ui/codex-extra-fields.ts
function draftExtraFields(entity, known) {
  return Object.entries(entity).flatMap(([key, value]) => {
    if (known.has(key) || key === "__proto__")
      return [];
    if (typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) {
      return [{ key, type: typeof value, value: String(value) }];
    }
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return [{ key, type: "list", value: value.join(`
`) }];
    }
    return [];
  });
}
function applyExtraFields(entity, fields) {
  for (const field of fields) {
    if (field.key === "__proto__")
      continue;
    const value = field.value.trim();
    if (!value) {
      delete entity[field.key];
      continue;
    }
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number))
        throw new Error(t("ui.codexExtraFields.applyExtraFields.mustBeAValidNumber", { key: field.key }));
      entity[field.key] = number;
    } else if (field.type === "list") {
      entity[field.key] = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    } else if (field.type === "boolean") {
      entity[field.key] = value === "true";
    } else {
      entity[field.key] = value;
    }
  }
}

// src/ui/tabs/codex-tab.ts
var fileStateChanges = new CodexFileStateChanges;
function deliverCodexFileState(chatId, file, seq, error) {
  const confirmed = fileStateChanges.acknowledge(chatId, file, seq, !!error);
  if (error && confirmed !== null)
    showToast("error", t("ui.tabs.codexTab.deliverCodexFileState.couldnTSaveThisCategorySSetting", { error }));
  return confirmed;
}
var SUBTABS2 = [
  { key: "overview", label: t("ui.tabs.codexTab.subtabs.overview") },
  { key: "entities", label: t("ui.tabs.codexTab.subtabs.entities") },
  { key: "relations", label: t("ui.tabs.codexTab.subtabs.relations") },
  { key: "timeline", label: t("ui.tabs.codexTab.subtabs.timeline") },
  { key: "threads", label: t("ui.tabs.codexTab.subtabs.threads") },
  { key: "lore", label: t("ui.tabs.codexTab.subtabs.lore") },
  { key: "secrets", label: t("ui.tabs.codexTab.subtabs.secrets") },
  { key: "manage", label: t("ui.tabs.codexTab.subtabs.manage") }
];
var ENTITY_GROUPS = [
  { key: "characters", title: t("ui.tabs.codexTab.entityGroups.characters"), singular: "character", ns: "char" },
  { key: "locations", title: t("ui.tabs.codexTab.entityGroups.locations"), singular: "location", ns: "loc" },
  { key: "things", title: t("ui.tabs.codexTab.entityGroups.things"), singular: "thing", ns: "thing" }
];
function objArray(v) {
  if (!Array.isArray(v))
    return [];
  return v.filter((x) => !!x && typeof x === "object" && !Array.isArray(x));
}
function strArray(v) {
  if (!Array.isArray(v))
    return [];
  return v.filter((x) => typeof x === "string");
}
function str(v) {
  return typeof v === "string" ? v : "";
}
function parseCodexFiles(files) {
  const out = {
    characters: [],
    locations: [],
    things: [],
    relations: [],
    events: [],
    threads: [],
    seeds: [],
    world: [],
    knowledge: [],
    broken: []
  };
  const read = (key) => {
    const raw = files[key];
    if (raw === undefined)
      return null;
    try {
      const v = JSON.parse(raw);
      return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch {
      out.broken.push(`${key}.json`);
      return null;
    }
  };
  for (const key of ["characters", "locations", "things"]) {
    const v = read(key);
    if (v)
      out[key] = objArray(v["entities"]);
  }
  const rel = read("relations");
  if (rel)
    out.relations = objArray(rel["relations"]);
  const tl = read("timeline");
  if (tl)
    out.events = objArray(tl["events"]);
  const th = read("threads");
  if (th) {
    out.threads = objArray(th["threads"]);
    out.seeds = strArray(th["seeds"]);
  }
  const wo = read("world");
  if (wo)
    out.world = objArray(wo["entries"]);
  const kn = read("knowledge");
  if (kn)
    out.knowledge = objArray(kn["items"]);
  return out;
}
function makeNameResolver(parsed) {
  const names = new Map;
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      const name = str(e["name"]);
      if (id && name)
        names.set(id, name);
    }
  }
  return (ref) => {
    const hit = names.get(ref);
    if (hit)
      return hit;
    const m = /^(?:char|loc|thing):(.+)$/.exec(ref);
    return m ? m[1].replace(/_/g, " ") : ref;
  };
}
var cache = { chatId: null, files: null, parsed: null, pending: false, revision: -1 };
function resolveDraftIndex(list, draft) {
  if (draft.index < 0)
    return -1;
  if (draft.orig !== undefined) {
    if (draft.index < list.length && JSON.stringify(list[draft.index]) === draft.orig)
      return draft.index;
    return list.findIndex((x) => JSON.stringify(x) === draft.orig);
  }
  return draft.index < list.length ? draft.index : -1;
}
function staleDraftAbort() {
  local.recordDraft = null;
  showToast("warn", t("ui.tabs.codexTab.staleDraftAbort.memoriaRewroteThatRecordWhileYouWere"));
  rerender();
}
function spliceOutIfCurrent(list, index, expected) {
  const expectedJson = JSON.stringify(expected);
  if (index < list.length && JSON.stringify(list[index]) === expectedJson) {
    return list.filter((_, j) => j !== index);
  }
  const found = list.findIndex((x) => JSON.stringify(x) === expectedJson);
  if (found >= 0)
    return list.filter((_, j) => j !== found);
  return null;
}
var local = {
  subtab: "overview",
  query: "",
  queryRaw: "",
  expandedEntity: null,
  entityDraft: null,
  recordDraft: null,
  addFormGroup: null,
  addFormName: "",
  expandedRelations: new Set,
  expandedEvents: new Set,
  expandedWorld: new Set,
  expandedSecrets: new Set,
  relationsView: "list",
  expandedThreads: new Set,
  showFullTimeline: false,
  codexSourceId: null
};
function clearExpansions() {
  local.expandedRelations.clear();
  local.expandedEvents.clear();
  local.expandedWorld.clear();
  local.expandedSecrets.clear();
  local.expandedThreads.clear();
}
var globalSaveSeq = 0;
var pendingCodexSaves = new Map;
function draftFile(d) {
  switch (d.kind) {
    case "relation":
      return "relations";
    case "event":
      return "timeline";
    case "thread":
    case "seeds":
      return "threads";
    case "world":
      return "world";
    default:
      return "knowledge";
  }
}
var TIMELINE_RECENT = 12;
function codexWantsRefresh(chatId) {
  return cache.chatId === chatId;
}
function setCodexSubtab(key) {
  if (key === "overview" || key === "entities" || key === "relations" || key === "timeline" || key === "threads" || key === "lore" || key === "secrets" || key === "manage") {
    if (local.subtab !== key) {
      local.query = "";
      local.queryRaw = "";
      local.recordDraft = null;
      clearExpansions();
    }
    local.subtab = key;
  }
}
function setCodexRelationsView(v) {
  local.relationsView = v;
}
function setCodexExpandedEntity(id) {
  local.expandedEntity = id;
  local.entityDraft = null;
}
function resetCodexTabLocal() {
  cache.chatId = null;
  cache.files = null;
  cache.parsed = null;
  cache.pending = false;
  local.subtab = "overview";
  local.query = "";
  local.queryRaw = "";
  local.expandedEntity = null;
  local.entityDraft = null;
  local.recordDraft = null;
  local.addFormGroup = null;
  local.addFormName = "";
  clearExpansions();
  local.relationsView = "list";
  local.showFullTimeline = false;
  pendingCodexSaves.clear();
}
var lastArgs = null;
function rerender() {
  const a = lastArgs;
  if (!a || !a.host.isConnected)
    return;
  preserveScroll(a.host, () => renderCodexTab(a.host, a.state, a.ctx, a.send));
}
function deliverCodexFiles(chatId, files, revision, savedFile, savedSeq) {
  if (cache.chatId === chatId) {
    cache.files = files;
    cache.parsed = parseCodexFiles(files);
    cache.pending = false;
    cache.revision = revision;
  }
  if (savedFile !== undefined && savedSeq !== undefined && pendingCodexSaves.get(savedFile) === savedSeq) {
    pendingCodexSaves.delete(savedFile);
    if (savedFile === "characters" || savedFile === "locations" || savedFile === "things") {
      if (local.entityDraft?.group === savedFile)
        local.entityDraft = null;
    } else if (local.recordDraft && draftFile(local.recordDraft) === savedFile) {
      local.recordDraft = null;
    }
  }
}
function sendCodexWrite(file, value, state, send) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  globalSaveSeq++;
  const seq = globalSaveSeq;
  pendingCodexSaves.set(file, seq);
  send({
    type: "codex_write_file",
    chatId,
    file,
    content: JSON.stringify(value, null, 2),
    seq
  });
  setTimeout(() => {
    if (pendingCodexSaves.get(file) !== seq)
      return;
    pendingCodexSaves.delete(file);
    let touched = false;
    if (local.entityDraft?.saving && local.entityDraft.group === file) {
      local.entityDraft.saving = false;
      touched = true;
    }
    if (local.recordDraft?.saving && draftFile(local.recordDraft) === file) {
      local.recordDraft.saving = false;
      touched = true;
    }
    if (touched)
      rerender();
  }, 5000);
}
function renderCodexTab(host, state, ctx, send) {
  lastArgs = { host, state, ctx, send };
  host.replaceChildren();
  if (codexLessonGated(state.lessons)) {
    renderCodexTabLock(host, send);
    return;
  }
  const chatId = state.activeChatId;
  if (!chatId) {
    const empty = section(t("ui.tabs.codexTab.empty.knowledgeCodex"));
    empty.body.appendChild(textNode(t("ui.tabs.codexTab.renderCodexTab.openAChatToConsultTheCodex"), "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }
  if (cache.chatId !== chatId) {
    cache.chatId = chatId;
    cache.files = null;
    cache.parsed = null;
    cache.pending = false;
    local.query = "";
    local.queryRaw = "";
    local.expandedEntity = null;
    local.entityDraft = null;
    local.recordDraft = null;
    local.addFormGroup = null;
    local.addFormName = "";
    clearExpansions();
    local.showFullTimeline = false;
    pendingCodexSaves.clear();
  }
  const stale = cache.files !== null && cache.revision !== state.codexRevision;
  const editing = local.entityDraft !== null || local.recordDraft !== null || pendingCodexSaves.size > 0;
  if (stale && !editing) {
    cache.files = null;
    cache.parsed = null;
  }
  if (!cache.files && !cache.pending) {
    cache.pending = true;
    send({ type: "codex_read", chatId });
  }
  host.appendChild(makeSubtabs(SUBTABS2, local.subtab, (key) => {
    local.subtab = key;
    local.query = "";
    local.queryRaw = "";
    local.recordDraft = null;
    clearExpansions();
    rerender();
    scrollPaneTop(host);
  }));
  const parsed = cache.parsed;
  if (local.subtab === "overview") {
    renderOverview2(host, state, ctx, send, parsed);
    return;
  }
  if (local.subtab === "manage") {
    renderManage(host, state, ctx, send);
    return;
  }
  if (!parsed) {
    const sec = section(t("ui.tabs.codexTab.sec.knowledgeCodex"));
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderCodexTab.memoriaIsFetchingTheCodexFiles"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const search = searchField({
    value: local.queryRaw,
    placeholder: t("ui.tabs.codexTab.search.searchThisSection"),
    onChange: (v) => {
      local.queryRaw = v;
      local.query = v.toLowerCase();
      drawPane();
    }
  });
  host.appendChild(search.wrap);
  const paneHost = document.createElement("div");
  paneHost.className = "lmb-pane";
  host.appendChild(paneHost);
  const drawPane = () => {
    paneHost.replaceChildren();
    switch (local.subtab) {
      case "entities":
        renderEntities(paneHost, parsed, state, ctx, send);
        break;
      case "relations":
        renderRelations(paneHost, parsed, state, ctx, send);
        break;
      case "timeline":
        renderTimeline(paneHost, parsed, state, ctx, send);
        break;
      case "threads":
        renderThreads(paneHost, parsed, state, ctx, send);
        break;
      case "lore":
        renderLore(paneHost, parsed, state, ctx, send);
        break;
      case "secrets":
        renderSecrets(paneHost, parsed, state, ctx, send);
        break;
      default:
        break;
    }
  };
  drawPane();
}
function matches(q, ...bits) {
  if (!q)
    return true;
  for (const b of bits) {
    if (b === undefined)
      continue;
    if (typeof b === "string") {
      if (b.toLowerCase().includes(q))
        return true;
    } else if (b.some((x) => x.toLowerCase().includes(q))) {
      return true;
    }
  }
  return false;
}
var BIBLE_TILES = [
  { id: "characters", label: t("ui.tabs.codexTab.bibleTiles.characters"), files: ["characters"] },
  { id: "locations", label: t("ui.tabs.codexTab.bibleTiles.locations"), files: ["locations"] },
  { id: "things", label: t("ui.tabs.codexTab.bibleTiles.things"), files: ["things"] },
  { id: "relations", label: t("ui.tabs.codexTab.bibleTiles.relations"), files: ["relations"] },
  { id: "timeline", label: t("ui.tabs.codexTab.bibleTiles.timeline"), files: ["timeline"] },
  { id: "threads", label: t("ui.tabs.codexTab.bibleTiles.threads"), files: ["threads"] },
  { id: "lore", label: t("ui.tabs.codexTab.bibleTiles.lore"), files: ["world"] },
  { id: "secrets", label: t("ui.tabs.codexTab.bibleTiles.secrets"), files: ["knowledge"] }
];
function emptyParsedCodex() {
  return {
    characters: [],
    locations: [],
    things: [],
    relations: [],
    events: [],
    threads: [],
    seeds: [],
    world: [],
    knowledge: [],
    broken: []
  };
}
var PURGE_SCAFFOLD = {
  characters: { entities: [] },
  locations: { entities: [] },
  things: { entities: [] },
  relations: { relations: [] },
  timeline: { events: [] },
  threads: { threads: [], seeds: [] },
  world: { entries: [] },
  knowledge: { items: [] }
};
function purgeMessage(def) {
  const bits = [t("ui.tabs.codexTab.bits.memoriaWillDeleteEveryRecordInFor", { label: def.label })];
  if (def.id === "characters" || def.id === "locations" || def.id === "things") {
    bits.push(t("ui.tabs.codexTab.purgeMessage.referencesToThemInOtherRecordsBecome"));
  }
  if (def.id === "threads")
    bits.push(t("ui.tabs.codexTab.purgeMessage.theResolvedThreadArchiveClearsToo"));
  bits.push(t("ui.tabs.codexTab.purgeMessage.thisCannotBeUndone"));
  return bits.join(" ");
}
function tileCount(parsed, id) {
  switch (id) {
    case "characters":
      return parsed.characters.length;
    case "locations":
      return parsed.locations.length;
    case "things":
      return parsed.things.length;
    case "relations":
      return parsed.relations.length;
    case "timeline":
      return parsed.events.length;
    case "threads":
      return parsed.threads.length;
    case "lore":
      return parsed.world.length;
    case "secrets":
      return parsed.knowledge.length;
    default:
      return 0;
  }
}
function tileState(state, files) {
  const states = files.map((f) => {
    const s = state.codexFileStates?.[f];
    return fileStateChanges.value(state.activeChatId, f, s === "noInject" || s === "frozen" ? s : "on");
  });
  if (states.includes("on"))
    return "on";
  if (states.includes("noInject"))
    return "noInject";
  return "frozen";
}
var TILE_STATE_LABEL = {
  on: t("ui.tabs.codexTab.tileStateLabel.injectedUpdated"),
  noInject: t("ui.tabs.codexTab.tileStateLabel.notInjectedStillUpdated"),
  frozen: t("ui.tabs.codexTab.tileStateLabel.frozenNoUpdates")
};
function renderOverview2(host, state, ctx, send, parsed) {
  const chatId = state.activeChatId;
  const profile = state.activeProfile;
  const sec = section(t("ui.tabs.codexTab.sec.storyBible"));
  const bits = [];
  bits.push(state.codexExists ? t("ui.tabs.codexTab.renderOverview.codexOnFile") : t("ui.tabs.codexTab.renderOverview.noCodexYet"));
  bits.push(t("ui.tabs.codexTab.renderOverview.messageUnindexed", { codexBacklog: state.codexBacklog }));
  if (state.codexLastRunAt)
    bits.push(t("ui.tabs.codexTab.renderOverview.updated", { codexLastRunAt: relativeTime(state.codexLastRunAt) }));
  sec.body.appendChild(lessonMark(textNode(bits.join(" · "), "lmb-help"), "codex.status"));
  if (!profile.codexEnabled) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderOverview.theCodexAgentIsOffForThis"), "lmb-empty"));
  }
  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  if (busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    row.append(dot, document.createTextNode(t("ui.tabs.codexTab.renderOverview.memoriaIsWorkingOnTheCodexWatch")));
    sec.body.appendChild(row);
  }
  const shownParsed = parsed ?? (!state.codexExists ? emptyParsedCodex() : null);
  if (shownParsed) {
    if (shownParsed.broken.length > 0) {
      sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderOverview.unreadableOnDiskRebuildCodexRegeneratesThem", { join: shownParsed.broken.join(", ") }), "lmb-help"));
    }
    const tiles = document.createElement("div");
    tiles.className = "lmb-tiles";
    lessonMark(tiles, "codex.tiles");
    for (const def of BIBLE_TILES) {
      tiles.appendChild(renderBibleTile(def, shownParsed, state, ctx, send, busy));
    }
    sec.body.appendChild(tiles);
    if (!state.codexExists) {
      sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderOverview.noCodexYet2"), "lmb-help"));
    }
    if ((state.codexRefreshPending?.length ?? 0) + (state.codexStaleFiles?.length ?? 0) > 0) {
      sec.body.appendChild(makeButton(t("ui.tabs.codexTab.renderOverview.clearStaleTags"), () => send({ type: "codex_clear_stale", chatId }), {
        small: true,
        disabled: busy,
        title: t("ui.tabs.codexTab.renderOverview.acceptTheCurrentRecordsAsUpTo")
      }));
    }
    const pending = state.codexRefreshPending ?? [];
    if (pending.length > 0) {
      const banner = document.createElement("div");
      banner.className = "lmb-actions";
      banner.append(textNode(t("ui.tabs.codexTab.renderOverview.recordMissedUpdatesWhileFrozen", { length: pending.length }), "lmb-help"), makeButton(t("ui.tabs.codexTab.renderOverview.catchUp1Pass"), () => send({ type: "codex_refresh", chatId }), {
        primary: true,
        small: true,
        disabled: busy || !state.settings.enabled || !profile.codexEnabled,
        title: t("ui.tabs.codexTab.renderOverview.onePassRebuildsJustTheReEnabled")
      }), makeButton(t("ui.tabs.codexTab.renderOverview.rebuildInstead"), async () => {
        const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.rebuildTheCodex"), t("ui.tabs.codexTab.ok.memoriaWillEraseTheStoryBibleAnd"));
        if (ok)
          requestCodexRebuild(state, chatId, send);
      }, {
        small: true,
        disabled: busy || !state.settings.enabled || !profile.codexEnabled,
        title: t("ui.tabs.codexTab.renderOverview.wipeEverythingAndRegenerateFromTheStart")
      }));
      sec.body.appendChild(banner);
    }
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderOverview.clickARecordCardToCycleIt"), "lmb-help"));
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderOverview.shorterAndSimplerChatsOftenRunBetter"), "lmb-help"));
  }
  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "codex.actions");
  row.append(lessonMark(makeButton(t("ui.tabs.codexTab.renderOverview.updateNow"), () => requestCodexUpdate(state, chatId, send), {
    primary: true,
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: t("ui.tabs.codexTab.renderOverview.consumeEverythingUpToTheNewestMessage")
  }), "codex.actions.update"), busy ? makeButton(t("ui.tabs.codexTab.renderOverview.cancel"), () => send({ type: "abort_busy", chatId, kind: "codex" }), {
    danger: true,
    title: t("ui.tabs.codexTab.renderOverview.abortTheCodexTaskInFlight")
  }) : makeButton(t("ui.tabs.codexTab.renderOverview.tidyUp"), () => requestCodexTidy(state, chatId, send), {
    disabled: !state.settings.enabled || !profile.codexEnabled || !state.codexExists,
    title: t("ui.tabs.codexTab.renderOverview.chooseATargetSizeThenCompactUp")
  }), makeButton(state.codexUndoAt ? t("ui.tabs.codexTab.renderOverview.undo", { codexUndoReasonUpdate: state.codexUndoReason ?? "update" }) : t("ui.tabs.codexTab.renderOverview.undo2"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.undoTheLastCodexChange"), t("ui.tabs.codexTab.ok.memoriaWillRollTheCodexBackTo", { codexUndoReasonUpdate: state.codexUndoReason ?? "update", codexUndoAt: relativeTime(state.codexUndoAt) }));
    if (ok)
      send({ type: "codex_undo", chatId });
  }, {
    disabled: busy || !state.codexUndoAt,
    title: state.codexUndoAt ? t("ui.tabs.codexTab.renderOverview.rollBackToTheSnapshotTakenBefore") : t("ui.tabs.codexTab.renderOverview.nothingToUndoYetMemoriaSnapshotsThe")
  }));
  sec.body.appendChild(row);
  host.appendChild(sec.wrap);
}
function renderManage(host, state, ctx, send) {
  const chatId = state.activeChatId;
  const profile = state.activeProfile;
  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  const sources = state.codexSources;
  const known = sources.some((s) => s.chatId === local.codexSourceId);
  if (!known)
    local.codexSourceId = "";
  renderContinuitySection(host, ctx, {
    emptyText: t("ui.tabs.codexTab.renderManage.noOtherChatHasACodexTo"),
    inherited: state.codexRootOrigin ? {
      text: t("ui.tabs.codexTab.renderManage.carriedOverFromMemoriaIndexesThisChat", { codexRootOriginName: state.codexRootOriginName }),
      detach: {
        label: t("ui.tabs.codexTab.renderManage.detachCodex"),
        title: t("ui.tabs.codexTab.renderManage.eraseTheCarriedOverCodexFromThis"),
        confirmTitle: t("ui.tabs.codexTab.renderManage.detachTheCarriedOverCodex"),
        confirmBody: t("ui.tabs.codexTab.renderManage.codexRecordsMergeAsMemoriaWorksSo"),
        run: () => send({ type: "codex_reset", chatId })
      }
    } : null,
    picker: !state.codexExists && sources.length > 0 ? {
      help: t("ui.tabs.codexTab.renderManage.continuingAnEarlierChatCarryItsStory"),
      ariaLabel: t("ui.tabs.codexTab.renderManage.sourceChatToCarryTheCodexFrom"),
      placeholder: t("ui.tabs.codexTab.renderManage.pickASourceChat"),
      options: sources.map((s) => ({ chatId: s.chatId, chatName: s.chatName })),
      selectedId: local.codexSourceId ?? "",
      onSelect: (v) => {
        local.codexSourceId = v;
      },
      action: {
        label: t("ui.tabs.codexTab.renderManage.carryCodexOver"),
        title: t("ui.tabs.codexTab.renderManage.copyAnotherChatSCodexIntoThis"),
        primary: true,
        confirm: {
          title: t("ui.tabs.codexTab.renderManage.carryTheCodexOver"),
          body: t("ui.tabs.codexTab.renderManage.memoriaWillCopyTheChosenChatS")
        },
        run: (sourceChatId) => send({ type: "codex_adopt", chatId, sourceChatId })
      }
    } : null
  });
  const files = section(t("ui.tabs.codexTab.files.codexFiles"));
  files.body.appendChild(textNode(t("ui.tabs.codexTab.renderManage.exportWritesEveryCodexFileAndIts"), "lmb-help"));
  const fileRow = document.createElement("div");
  fileRow.className = "lmb-actions";
  fileRow.append(makeButton(t("ui.tabs.codexTab.renderManage.export"), () => send({ type: "codex_backup", chatId }), {
    disabled: busy || !state.codexExists,
    title: t("ui.tabs.codexTab.renderManage.downloadEveryCodexFilePlusItsInject")
  }), makeButton(t("ui.tabs.codexTab.renderManage.import"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.importACodexFile"), t("ui.tabs.codexTab.ok.memoriaWillReplaceEveryCodexFileIn"));
    if (ok)
      restoreBackup(ctx, chatId, send);
  }, { disabled: busy, title: t("ui.tabs.codexTab.renderManage.replaceThisChatSCodexFromAn") }));
  files.body.appendChild(fileRow);
  host.appendChild(files.wrap);
  const danger = section(t("ui.tabs.codexTab.danger.startOver"));
  danger.body.appendChild(textNode(t("ui.tabs.codexTab.renderManage.rebuildReReadsTheWholeChatFrom"), "lmb-help"));
  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  lessonMark(dangerRow, "codex.manage.startover");
  dangerRow.append(makeButton(t("ui.tabs.codexTab.renderManage.rebuildCodex"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.rebuildTheCodex"), t("ui.tabs.codexTab.ok.memoriaWillEraseTheStoryBibleAnd"));
    if (ok)
      requestCodexRebuild(state, chatId, send);
  }, {
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: t("ui.tabs.codexTab.renderManage.wipeAndRegenerateTheWholeStoryBible")
  }), makeButton(t("ui.tabs.codexTab.renderManage.wipeCodex"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.wipeTheCodex"), t("ui.tabs.codexTab.ok.memoriaWillEraseEveryCodexRecordFor"));
    if (ok)
      send({ type: "codex_reset", chatId });
  }, { danger: true, disabled: busy || !state.codexExists }));
  danger.body.appendChild(dangerRow);
  host.appendChild(danger.wrap);
}
function restoreBackup(ctx, chatId, send) {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 20000000 }).then((files) => {
    if (!files.length)
      return;
    let parsed;
    try {
      parsed = JSON.parse(new TextDecoder().decode(files[0].bytes));
    } catch (err) {
      console.warn("[LumiBooks] codex backup parse failed", err);
      showToast("error", t("ui.tabs.codexTab.restoreBackup.memoriaCouldnTReadThatBackupFile"));
      return;
    }
    send({ type: "codex_restore", chatId, raw: parsed });
  }).catch((err) => {
    console.warn("[LumiBooks] codex backup picker failed", err);
  });
}
function downloadCodexBackup(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderBibleTile(def, parsed, state, ctx, send, busy) {
  const chatId = state.activeChatId;
  let st = tileState(state, def.files);
  const stale = def.files.some((f) => state.codexStaleFiles?.includes(f));
  const needsCatchup = def.files.some((f) => state.codexRefreshPending?.includes(f));
  const tokens = state.codexFileTokens ? def.files.reduce((acc, f) => acc + (state.codexFileTokens[f] ?? 0), 0) : def.files.reduce((acc, f) => acc + Math.ceil((cache.files?.[f]?.length ?? 0) / 4), 0);
  const tile = document.createElement("div");
  tile.className = `lmb-tile lmb-bible-tile ${st}${stale || needsCatchup ? " stale" : ""}`;
  lessonMark(tile, `codex.tile.${def.id}`);
  tile.title = t("ui.tabs.codexTab.renderBibleTile.clickToCycle", { tileStateLabelSt: TILE_STATE_LABEL[st], choice: stale ? "yes" : "no", choice2: needsCatchup ? "yes" : "no" });
  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = String(tileCount(parsed, def.id));
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = def.label;
  const s = document.createElement("div");
  s.className = "lmb-tile-sub";
  s.textContent = t("ui.tabs.codexTab.renderBibleTile.tokens", { choice: state.codexTokensApproximate ? "yes" : "no", formatTokens: formatTokens(tokens) });
  const stateLine = document.createElement("div");
  stateLine.className = "lmb-tile-state";
  stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? t("ui.tabs.codexTab.renderBibleTile.stale") : ""}${needsCatchup ? t("ui.tabs.codexTab.renderBibleTile.needsCatchUp") : ""}`;
  tile.append(v, l, s, stateLine);
  const tools = document.createElement("div");
  tools.className = "lmb-tile-tools";
  const tidyBtn = makeButton(busy ? t("ui.tabs.codexTab.tidyBtn.cancel") : t("ui.tabs.codexTab.tidyBtn.tidy"), () => {
    if (busy)
      send({ type: "abort_busy", chatId, kind: "codex" });
    else
      requestCodexTidy(state, chatId, send, def.files);
  }, {
    small: true,
    disabled: !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled || !state.codexExists),
    title: busy ? t("ui.tabs.codexTab.tidyBtn.abortTheCodexTaskInFlight") : t("ui.tabs.codexTab.tidyBtn.chooseATargetSizeForThisRecord")
  });
  tidyBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(tidyBtn);
  const rebuildBtn = makeButton(t("ui.tabs.codexTab.rebuildBtn.rebuild"), () => {
    (async () => {
      const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.rebuildThisRecord"), t("ui.tabs.codexTab.ok.memoriaWillRegenerateEveryRecordInFrom", { label: def.label }));
      if (ok)
        send({ type: "codex_rebuild_files", chatId, files: def.files });
    })();
  }, {
    small: true,
    disabled: busy || st === "frozen" || !state.codexExists || !state.settings.enabled || !state.activeProfile.codexEnabled,
    title: t("ui.tabs.codexTab.rebuildBtn.regenerateJustThisCategoryFromTheWhole")
  });
  rebuildBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(rebuildBtn);
  const purgeBtn = makeButton(t("ui.tabs.codexTab.purgeBtn.purge"), () => {
    (async () => {
      const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.purgeThisRecord"), purgeMessage(def));
      if (!ok)
        return;
      sendCodexWrite(def.files[0], PURGE_SCAFFOLD[def.files[0]], state, send);
    })();
  }, {
    small: true,
    danger: true,
    disabled: busy || st === "frozen" || !state.codexExists || tileCount(parsed, def.id) === 0,
    title: t("ui.tabs.codexTab.purgeBtn.deleteEveryRecordInThisCategoryAt")
  });
  purgeBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(purgeBtn);
  tile.appendChild(tools);
  tile.addEventListener("click", () => {
    cycleTileState(def, st, state, send);
    st = tileState(state, def.files);
    tile.classList.remove("on", "noInject", "frozen");
    tile.classList.add(st);
    tile.title = t("ui.tabs.codexTab.renderBibleTile.clickToCycle2", { tileStateLabelSt: TILE_STATE_LABEL[st] });
    stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? t("ui.tabs.codexTab.renderBibleTile.stale") : ""}${needsCatchup ? t("ui.tabs.codexTab.renderBibleTile.needsCatchUp") : ""}`;
    tidyBtn.disabled = !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled || !state.codexExists);
    rebuildBtn.disabled = busy || st === "frozen" || !state.codexExists || !state.settings.enabled || !state.activeProfile.codexEnabled;
    purgeBtn.disabled = busy || st === "frozen" || !state.codexExists || tileCount(parsed, def.id) === 0;
  });
  return tile;
}
function cycleTileState(def, st, state, send) {
  const chatId = state.activeChatId;
  const next = st === "on" ? "noInject" : st === "noInject" ? "frozen" : "on";
  for (const f of def.files)
    fileStateChanges.change(chatId, f, st, next, send);
}
var ENTITY_TEXT_FIELDS = ["kind", "role", "significance"];
var ENTITY_LONG_FIELDS = ["appearance", "description", "notes"];
var ENTITY_LIST_FIELDS = ["aliases", "traits", "goals", "ties", "keywords"];
var ENTITY_FIELD_LABELS = {
  kind: t("ui.tabs.codexTab.entityFields.kind"),
  role: t("ui.tabs.codexTab.entityFields.role"),
  significance: t("ui.tabs.codexTab.entityFields.significance"),
  appearance: t("ui.tabs.codexTab.entityFields.appearance"),
  description: t("ui.tabs.codexTab.entityFields.description"),
  notes: t("ui.tabs.codexTab.entityFields.notes"),
  aliases: t("ui.tabs.codexTab.entityFields.aliases"),
  traits: t("ui.tabs.codexTab.entityFields.traits"),
  goals: t("ui.tabs.codexTab.entityFields.goals"),
  ties: t("ui.tabs.codexTab.entityFields.ties"),
  keywords: t("ui.tabs.codexTab.entityFields.keywords")
};
var ENTITY_KNOWN = new Set(["id", "name", "status", "locked", "lockedFields", "lockedfields", "noInject", "noinject", "rid", ...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);
var LOCKABLE_FIELDS = new Set([...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);
function entityNoInject(e) {
  return e["noInject"] === true || e["noinject"] === true;
}
function entitySheetState(e) {
  if (entityNoInject(e))
    return "held";
  return e["locked"] === true ? "locked" : "open";
}
var SHEET_STATE_TITLE = {
  open: t("ui.tabs.codexTab.sheetStateTitle.memoriaMaintainsThisSheetClickToLock"),
  locked: t("ui.tabs.codexTab.sheetStateTitle.frozenAndStillInjectedClickToHold"),
  held: t("ui.tabs.codexTab.sheetStateTitle.frozenAndHeldOutOfThePrompt")
};
function sheetStateLabel(e) {
  const locked = e["locked"] === true;
  return t("ui.tabs.codexTab.sheetStateLabel.state", { locked: locked ? "yes" : "no", injected: entityNoInject(e) ? "no" : "yes" });
}
function entitySearchText(e) {
  const bits = [];
  for (const v of Object.values(e)) {
    if (typeof v === "string")
      bits.push(v);
    else if (Array.isArray(v))
      bits.push(...strArray(v));
  }
  return bits;
}
function slugId(ns, name, taken) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unnamed";
  let id = `${ns}:${base}`;
  let n = 2;
  while (taken.has(id))
    id = `${ns}:${base}_${n++}`;
  return id;
}
function renderEntities(host, parsed, state, ctx, send) {
  const sec = section(t("ui.tabs.codexTab.sec.entities"));
  lessonMark(sec.wrap, "codex.entities");
  sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderEntities.clickANameToOpenItsSheet"), "lmb-help"));
  let any = false;
  for (const g of ENTITY_GROUPS) {
    const all = parsed[g.key];
    const list = all.filter((e) => matches(local.query, ...entitySearchText(e)));
    if (all.length > 0)
      any = true;
    const searching = local.query !== "";
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = searching ? t("ui.tabs.codexTab.renderEntities.of", { title: g.title, length: list.length, length2: all.length }) : `${g.title} (${all.length})`;
    sec.body.appendChild(sub);
    const grid = document.createElement("div");
    grid.className = "lmb-chipgrid";
    for (const e of list) {
      const id = str(e["id"]) || str(e["name"]);
      const chipEl = document.createElement("button");
      chipEl.type = "button";
      chipEl.className = `lmb-chip${local.expandedEntity === id ? " active" : ""}`;
      chipEl.textContent = str(e["name"]) || id || "?";
      chipEl.addEventListener("click", () => {
        local.expandedEntity = local.expandedEntity === id ? null : id;
        local.entityDraft = null;
        rerender();
      });
      grid.appendChild(chipEl);
    }
    if (!searching) {
      const addChip = document.createElement("button");
      addChip.type = "button";
      addChip.className = "lmb-chip add";
      if (g.key === "characters")
        lessonMark(addChip, "codex.entities.add");
      addChip.textContent = t("ui.tabs.codexTab.renderEntities.value", { singular: g.singular });
      addChip.addEventListener("click", () => {
        local.addFormGroup = local.addFormGroup === g.key ? null : g.key;
        local.addFormName = "";
        rerender();
      });
      grid.appendChild(addChip);
    }
    sec.body.appendChild(grid);
    if (local.addFormGroup === g.key) {
      sec.body.appendChild(renderAddForm(g.key, g.ns, parsed));
    }
    const draft = local.entityDraft;
    if (draft && draft.group === g.key) {
      sec.body.appendChild(renderEntityForm(draft, state, send));
    } else {
      const open = all.find((e) => (str(e["id"]) || str(e["name"])) === local.expandedEntity);
      if (open)
        sec.body.appendChild(renderEntityCard(g.key, open, parsed, state, ctx, send));
    }
  }
  if (!any)
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderEntities.noEntitiesRecordedYetAddOneOr"), "lmb-empty"));
  host.appendChild(sec.wrap);
}
function renderAddForm(group, ns, parsed) {
  const row = document.createElement("div");
  row.className = "lmb-add-form";
  lessonMark(row, "codex.entities.addform");
  const input = textInput({
    value: local.addFormName,
    placeholder: t("ui.tabs.codexTab.input.name"),
    autoFocus: true,
    onChange: (v) => {
      local.addFormName = v;
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      submit();
  });
  const submit = () => {
    const name = local.addFormName.trim();
    if (!name)
      return;
    const taken = new Set(parsed[group].map((e) => str(e["id"])));
    const id = slugId(ns, name, taken);
    local.entityDraft = makeDraft(group, { id, name });
    local.expandedEntity = id;
    local.addFormGroup = null;
    local.addFormName = "";
    rerender();
  };
  row.append(input, makeButton(t("ui.tabs.codexTab.renderAddForm.create"), submit, { primary: true, small: true }), makeButton(t("ui.tabs.codexTab.renderAddForm.cancel"), () => {
    local.addFormGroup = null;
    local.addFormName = "";
    rerender();
  }, { small: true }));
  return row;
}
function entityLockedFields(e) {
  return strArray(e["lockedFields"] ?? e["lockedfields"]);
}
function makeDraft(group, e) {
  const fields = { name: str(e["name"]) };
  for (const f of ENTITY_TEXT_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LONG_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LIST_FIELDS)
    fields[f] = strArray(e[f]).join(", ");
  return { group, id: str(e["id"]), fields, extras: draftExtraFields(e, ENTITY_KNOWN), lockedFields: new Set(entityLockedFields(e)), saving: false };
}
function renderEntityCard(group, e, parsed, state, ctx, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card";
  lessonMark(card, "codex.entities.card");
  const locked = e["locked"] === true;
  const sheetState = entitySheetState(e);
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = str(e["name"]) || "?";
  const id = str(e["id"]);
  if (id) {
    const idEl = document.createElement("span");
    idEl.className = "lmb-entity-id";
    idEl.textContent = id;
    name.appendChild(idEl);
  }
  if (sheetState === "held")
    name.appendChild(lessonMark(pill(t("ui.tabs.codexTab.renderEntityCard.notInjected"), "warn"), "codex.entities.statepill"));
  else if (locked)
    name.appendChild(lessonMark(pill(t("ui.tabs.codexTab.renderEntityCard.locked"), "warn"), "codex.entities.statepill"));
  card.appendChild(name);
  const kv = document.createElement("div");
  kv.className = "lmb-kv";
  const fieldLocks = new Set(entityLockedFields(e));
  const addKv = (label, value) => {
    if (!value)
      return;
    const k = document.createElement("div");
    k.className = "lmb-kv-key";
    const displayLabel = Object.hasOwn(ENTITY_FIELD_LABELS, label) ? ENTITY_FIELD_LABELS[label] : label;
    k.textContent = fieldLocks.has(label) ? `${displayLabel} \uD83D\uDD12` : displayLabel;
    if (fieldLocks.has(label))
      k.title = t("ui.tabs.codexTab.addKv.lockedFieldMemoriaCanNeverChangeIt");
    const v = document.createElement("div");
    v.className = "lmb-kv-value";
    v.textContent = value;
    kv.append(k, v);
  };
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS])
    addKv(f, str(e[f]));
  for (const f of ENTITY_LIST_FIELDS) {
    const list = strArray(e[f]);
    if (list.length)
      addKv(f, list.join(" · "));
  }
  for (const [k, v] of Object.entries(e)) {
    if (ENTITY_KNOWN.has(k))
      continue;
    if (typeof v === "string" && v)
      addKv(k, v);
    else if (typeof v === "number" || typeof v === "boolean")
      addKv(k, String(v));
    else if (Array.isArray(v))
      addKv(k, strArray(v).join(" · "));
  }
  card.appendChild(kv);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(t("ui.tabs.codexTab.renderEntityCard.editSheet"), () => {
    local.entityDraft = makeDraft(group, e);
    rerender();
  }, { primary: true, small: true }), lessonMark(makeButton(sheetStateLabel(e), () => {
    const list = (cache.parsed ?? parsed)[group];
    const next = list.map((x) => {
      if (str(x["id"]) !== id)
        return x;
      const row = { ...x };
      delete row["locked"];
      delete row["noInject"];
      delete row["noinject"];
      if (sheetState === "open")
        row["locked"] = true;
      else if (sheetState === "locked") {
        row["locked"] = true;
        row["noInject"] = true;
      }
      return row;
    });
    sendCodexWrite(group, { entities: next }, state, send);
  }, {
    small: true,
    title: SHEET_STATE_TITLE[sheetState]
  }), "codex.entities.lock"), makeButton(t("ui.tabs.codexTab.renderEntityCard.delete"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.deleteEntity"), t("ui.tabs.codexTab.ok.memoriaWillRemoveFromTheCodexReferences", { str: str(e["name"]) }));
    if (!ok)
      return;
    const next = (cache.parsed ?? parsed)[group].filter((x) => str(x["id"]) !== id);
    sendCodexWrite(group, { entities: next }, state, send);
  }, { danger: true, small: true }));
  card.appendChild(actions);
  return card;
}
function renderEntityForm(draft, state, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  lessonMark(card, "codex.entities.editor");
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = draft.fields["name"] || t("ui.tabs.codexTab.renderEntityForm.newEntity");
  const idEl = document.createElement("span");
  idEl.className = "lmb-entity-id";
  idEl.textContent = draft.id;
  name.appendChild(idEl);
  card.appendChild(name);
  const bind = (key, el) => {
    el.addEventListener("input", () => {
      draft.fields[key] = el.value;
    });
  };
  const lockableWrap = (key, label) => {
    const w = fieldWrap(label);
    if (!LOCKABLE_FIELDS.has(key) && !draft.extras.some((extra) => extra.key === key))
      return w;
    const lbl = w.firstElementChild;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-field-lock";
    const sync = () => {
      const on = draft.lockedFields.has(key);
      btn.textContent = on ? t("ui.tabs.codexTab.sync.locked") : "\uD83D\uDD13";
      btn.title = on ? t("ui.tabs.codexTab.sync.lockedMemoriaReadsALockMarkerInstead") : t("ui.tabs.codexTab.sync.lockThisFieldSoOnlyYouCan");
      btn.classList.toggle("active", on);
    };
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (draft.lockedFields.has(key))
        draft.lockedFields.delete(key);
      else
        draft.lockedFields.add(key);
      sync();
    });
    sync();
    lbl.appendChild(btn);
    return w;
  };
  const form = document.createElement("div");
  form.className = "lmb-entity-form";
  const nameField = fieldWrap(t("ui.tabs.codexTab.nameField.name"));
  const nameInput = textInput({ value: draft.fields["name"] ?? "" });
  bind("name", nameInput);
  nameField.appendChild(nameInput);
  form.appendChild(nameField);
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  for (const f of ENTITY_TEXT_FIELDS) {
    const w = lockableWrap(f, ENTITY_FIELD_LABELS[f]);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    grid.appendChild(w);
  }
  form.appendChild(grid);
  for (const f of ENTITY_LONG_FIELDS) {
    const w = lockableWrap(f, ENTITY_FIELD_LABELS[f]);
    const ta = textArea({ value: draft.fields[f] ?? "", rows: 2 });
    bind(f, ta);
    w.appendChild(ta);
    form.appendChild(w);
  }
  const relationsOn = state.activeProfile.codexRelationsTable;
  for (const f of ENTITY_LIST_FIELDS) {
    if (f === "ties" && relationsOn)
      continue;
    const w = lockableWrap(f, t("ui.tabs.codexTab.w.commaSeparated", { f: ENTITY_FIELD_LABELS[f] }));
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    form.appendChild(w);
  }
  for (const extra of draft.extras) {
    const label = extra.type === "list" ? t("ui.tabs.codexTab.label.onePerLine", { key: extra.key }) : extra.key;
    const w = lockableWrap(extra.key, label);
    const input = extra.type === "list" || extra.type === "string" ? textArea({ value: extra.value, rows: 2 }) : extra.type === "boolean" ? select({ value: extra.value, options: [{ value: "true", label: t("ui.tabs.codexTab.input.true") }, { value: "false", label: t("ui.tabs.codexTab.input.false") }], onChange: (value) => {
      extra.value = value;
    } }) : textInput({ value: extra.value });
    if (extra.type === "number")
      input.inputMode = "decimal";
    input.addEventListener("input", () => {
      extra.value = input.value;
    });
    w.appendChild(input);
    form.appendChild(w);
  }
  const fieldError = textNode("", "lmb-help");
  fieldError.setAttribute("role", "alert");
  form.appendChild(fieldError);
  card.appendChild(form);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const saveBtn = makeButton(draft.saving ? t("ui.tabs.codexTab.saveBtn.saving") : t("ui.tabs.codexTab.saveBtn.save"), () => {
    if (draft.saving)
      return;
    const parsed = cache.parsed;
    if (!parsed)
      return;
    let entity;
    try {
      entity = buildEntityFromDraft(draft, parsed);
    } catch (error) {
      fieldError.textContent = error instanceof Error ? error.message : String(error);
      return;
    }
    if (!entity) {
      showToast("warn", t("ui.tabs.codexTab.saveBtn.theEntityNeedsAName"));
      return;
    }
    const list = parsed[draft.group];
    const idx = list.findIndex((x) => str(x["id"]) === draft.id);
    const next = idx >= 0 ? [...list.slice(0, idx), entity, ...list.slice(idx + 1)] : [...list, entity];
    draft.saving = true;
    sendCodexWrite(draft.group, { entities: next }, state, send);
    rerender();
  }, { primary: true, small: true, disabled: draft.saving });
  actions.append(saveBtn, makeButton(t("ui.tabs.codexTab.renderEntityForm.cancel"), () => {
    local.entityDraft = null;
    rerender();
  }, { small: true }));
  card.appendChild(actions);
  return card;
}
function fieldWrap(label) {
  const w = document.createElement("div");
  w.className = "lmb-field";
  const l = document.createElement("div");
  l.className = "lmb-field-label";
  l.textContent = label;
  w.appendChild(l);
  return w;
}
function buildEntityFromDraft(draft, parsed) {
  const name = (draft.fields["name"] ?? "").trim();
  if (!name)
    return null;
  const orig = parsed[draft.group].find((x) => str(x["id"]) === draft.id);
  const out = {};
  if (orig) {
    for (const [k, v] of Object.entries(orig)) {
      if (!ENTITY_KNOWN.has(k))
        out[k] = v;
    }
    if (orig["locked"] === true)
      out["locked"] = true;
    if (entityNoInject(orig))
      out["noInject"] = true;
  }
  out["id"] = draft.id;
  out["name"] = name;
  applyExtraFields(out, draft.extras);
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS]) {
    const v = (draft.fields[f] ?? "").trim();
    if (v)
      out[f] = v;
  }
  for (const f of ENTITY_LIST_FIELDS) {
    const items = (draft.fields[f] ?? "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
    if (items.length)
      out[f] = items;
  }
  const locks = [...draft.lockedFields].filter((f) => LOCKABLE_FIELDS.has(f) || draft.extras.some((extra) => extra.key === f) && Object.hasOwn(out, f));
  if (locks.length)
    out["lockedFields"] = locks;
  return out;
}
function splitLines(v) {
  return v.split(/\n/).map((x) => x.trim()).filter(Boolean);
}
function splitComma(v) {
  return v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}
function ensureRefDatalist(parsed) {
  const ID = "lmb-entity-refs";
  document.getElementById(ID)?.remove();
  const dl = document.createElement("datalist");
  dl.id = ID;
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      if (!id)
        continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.label = str(e["name"]);
      dl.appendChild(opt);
    }
  }
  document.body.appendChild(dl);
  return ID;
}
function renderRecordForm(title, specs, draft, refListId, onSave) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  const head = document.createElement("div");
  head.className = "lmb-entity-name";
  head.textContent = title;
  card.appendChild(head);
  const form = document.createElement("div");
  form.className = "lmb-entity-form";
  for (const spec of specs) {
    const w = fieldWrap(spec.label);
    let el;
    if (spec.widget === "select") {
      el = select({
        value: draft.fields[spec.key] ?? spec.options?.[0]?.value ?? "",
        options: spec.options ?? [],
        onChange: (v) => {
          draft.fields[spec.key] = v;
        }
      });
    } else if (spec.widget === "input") {
      el = textInput({ value: draft.fields[spec.key] ?? "", placeholder: spec.placeholder });
      if (spec.refList && refListId)
        el.setAttribute("list", refListId);
      el.addEventListener("input", () => {
        draft.fields[spec.key] = el.value;
      });
    } else {
      el = textArea({ value: draft.fields[spec.key] ?? "", rows: spec.widget === "lines" ? 3 : 2, placeholder: spec.placeholder });
      el.addEventListener("input", () => {
        draft.fields[spec.key] = el.value;
      });
    }
    w.appendChild(el);
    form.appendChild(w);
  }
  card.appendChild(form);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(draft.saving ? t("ui.tabs.codexTab.renderRecordForm.saving") : t("ui.tabs.codexTab.renderRecordForm.save"), () => {
    if (!draft.saving)
      onSave();
  }, { primary: true, small: true, disabled: draft.saving }), makeButton(t("ui.tabs.codexTab.renderRecordForm.cancel"), () => {
    local.recordDraft = null;
    rerender();
  }, { small: true }));
  card.appendChild(actions);
  return card;
}
function recordItemActions(onEdit, onDelete, ctx, deleteMessage) {
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(t("ui.tabs.codexTab.recordItemActions.edit"), onEdit, { small: true }), makeButton(t("ui.tabs.codexTab.recordItemActions.delete"), async () => {
    const ok = await confirmDelete(ctx, t("ui.tabs.codexTab.ok.delete"), deleteMessage);
    if (ok)
      onDelete();
  }, { small: true, danger: true }));
  return actions;
}
function relationSearchText(r, nameOf) {
  const bits = [str(r["kind"]), str(r["state"]), ...strArray(r["history"])];
  if (r["type"] === "group")
    bits.push(...strArray(r["members"]).map(nameOf));
  else
    bits.push(nameOf(str(r["a"])), nameOf(str(r["b"])));
  return bits;
}
function relationDraftFrom(r, index) {
  return {
    kind: "relation",
    index,
    ...r ? { orig: JSON.stringify(r) } : {},
    saving: false,
    fields: {
      type: r?.["type"] === "group" ? "group" : "pair",
      a: str(r?.["a"]),
      b: str(r?.["b"]),
      members: strArray(r?.["members"]).join(", "),
      kind: str(r?.["kind"]),
      state: str(r?.["state"]),
      history: strArray(r?.["history"]).join(`
`)
    }
  };
}
function buildRelationFromDraft(d) {
  const kind = (d.fields["kind"] ?? "").trim();
  const stateText = (d.fields["state"] ?? "").trim();
  if (!kind || !stateText)
    return null;
  const history = splitLines(d.fields["history"] ?? "");
  if (d.fields["type"] === "group") {
    const members = splitComma(d.fields["members"] ?? "");
    if (members.length < 2)
      return null;
    return { type: "group", kind, members, state: stateText, ...history.length ? { history } : {} };
  }
  const a = (d.fields["a"] ?? "").trim();
  const b = (d.fields["b"] ?? "").trim();
  if (!a || !b)
    return null;
  return { type: "pair", a, b, kind, state: stateText, ...history.length ? { history } : {} };
}
function saveRelationDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const rel = buildRelationFromDraft(d);
  if (!rel) {
    showToast("warn", d.fields["type"] === "group" ? t("ui.tabs.codexTab.saveRelationDraft.theGroupNeedsAtLeastTwoMembers") : t("ui.tabs.codexTab.saveRelationDraft.theRelationNeedsFromToAKind"));
    return;
  }
  const idx = resolveDraftIndex(parsed.relations, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.relations[idx]["rid"]);
    if (rid)
      rel["rid"] = rid;
    const roles = parsed.relations[idx]["roles"];
    if (rel["type"] === "group" && roles && typeof roles === "object" && !Array.isArray(roles)) {
      rel["roles"] = roles;
    }
  }
  const next = idx >= 0 ? [...parsed.relations.slice(0, idx), rel, ...parsed.relations.slice(idx + 1)] : [...parsed.relations, rel];
  d.saving = true;
  sendCodexWrite("relations", { relations: next }, state, send);
  rerender();
}
function relationFormEl(draft, refListId, state, send) {
  const isGroup = draft.fields["type"] === "group";
  const specs = [
    { key: "type", label: t("ui.tabs.codexTab.specs.type"), widget: "select", options: [{ value: "pair", label: t("ui.tabs.codexTab.specs.pairAB") }, { value: "group", label: t("ui.tabs.codexTab.specs.group") }] },
    ...isGroup ? [{ key: "members", label: t("ui.tabs.codexTab.specs.membersCommaSeparatedRefs"), widget: "input", refList: true, placeholder: t("ui.tabs.codexTab.specs.charEliasCharWren") }] : [
      { key: "a", label: t("ui.tabs.codexTab.specs.fromA"), widget: "input", refList: true, placeholder: t("ui.tabs.codexTab.specs.charElias") },
      { key: "b", label: t("ui.tabs.codexTab.specs.toB"), widget: "input", refList: true, placeholder: t("ui.tabs.codexTab.specs.charWren") }
    ],
    { key: "kind", label: t("ui.tabs.codexTab.specs.kind"), widget: "input", placeholder: t("ui.tabs.codexTab.specs.bondOwnsAtRival") },
    { key: "state", label: t("ui.tabs.codexTab.specs.state"), widget: "textarea", placeholder: t("ui.tabs.codexTab.specs.lovesHerHidesIt") },
    { key: "history", label: t("ui.tabs.codexTab.specs.historyOnePerLine"), widget: "lines", placeholder: t("ui.tabs.codexTab.specs.day12SheSawHimKill") }
  ];
  const form = renderRecordForm(draft.index >= 0 ? t("ui.tabs.codexTab.form.editRelation") : t("ui.tabs.codexTab.form.newRelation"), specs, draft, refListId, () => saveRelationDraft(draft, state, send));
  lessonMark(form, "codex.rel.form");
  form.querySelector("select")?.addEventListener("change", () => rerender());
  return form;
}
function renderRelations(host, parsed, state, ctx, send) {
  const sec = section(t("ui.tabs.codexTab.sec.relations"));
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const relationsOn = state.activeProfile.codexRelationsTable;
  const viewRow = document.createElement("div");
  viewRow.className = "lmb-actions";
  lessonMark(viewRow, "codex.rel.view");
  viewRow.append(makeButton(t("ui.tabs.codexTab.renderRelations.list"), () => {
    if (local.relationsView === "list")
      return;
    local.relationsView = "list";
    local.recordDraft = null;
    rerender();
  }, { small: true }), lessonMark(makeButton(t("ui.tabs.codexTab.renderRelations.graph"), () => {
    if (local.relationsView === "graph")
      return;
    local.relationsView = "graph";
    local.recordDraft = null;
    rerender();
  }, { small: true }), "codex.rel.graphbtn"));
  viewRow.children[local.relationsView === "list" ? 0 : 1].classList.add("active");
  if (relationsOn && local.relationsView === "list") {
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    viewRow.append(spacer, lessonMark(makeButton(t("ui.tabs.codexTab.renderRelations.relation"), () => {
      local.recordDraft = relationDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }), "codex.rel.add"));
  }
  sec.body.appendChild(viewRow);
  const draft = local.recordDraft;
  if (draft?.kind === "relation" && draft.index === -1) {
    sec.body.appendChild(relationFormEl(draft, refListId, state, send));
  }
  if (parsed.relations.length === 0) {
    sec.body.appendChild(textNode(relationsOn ? t("ui.tabs.codexTab.renderRelations.noRelationsRecordedYetAddOneOr") : t("ui.tabs.codexTab.renderRelations.theRelationsTableIsOffForThis"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  if (local.relationsView === "graph") {
    renderRelationGraph(sec.body, parsed, nameOf);
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-relation-list";
  let shown = 0;
  parsed.relations.forEach((r, i) => {
    if (!matches(local.query, ...relationSearchText(r, nameOf)))
      return;
    shown++;
    if (draft?.kind === "relation" && draft.index === i) {
      list.appendChild(relationFormEl(draft, refListId, state, send));
      return;
    }
    const expanded = local.expandedRelations.has(i);
    const row = document.createElement("div");
    row.className = "lmb-relation";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-record-head";
    const names = document.createElement("span");
    names.className = "lmb-relation-names lmb-grow";
    if (r["type"] === "group") {
      names.textContent = strArray(r["members"]).map(nameOf).join(" · ");
    } else {
      names.append(document.createTextNode(nameOf(str(r["a"]))), arrowSpan(), document.createTextNode(nameOf(str(r["b"]))));
    }
    const kind = str(r["kind"]);
    head.appendChild(names);
    if (kind) {
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = kind;
      head.appendChild(tag);
    }
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (expanded)
        local.expandedRelations.delete(i);
      else
        local.expandedRelations.add(i);
      rerender();
    });
    row.appendChild(head);
    const stateText = str(r["state"]);
    if (stateText)
      row.appendChild(textNode(stateText, "lmb-relation-state"));
    if (expanded) {
      const history = strArray(r["history"]);
      if (history.length) {
        const ul = document.createElement("ul");
        ul.className = "lmb-history";
        for (const h of history) {
          const li = document.createElement("li");
          li.textContent = h;
          ul.appendChild(li);
        }
        row.appendChild(ul);
      }
      const roles = r["roles"];
      if (roles && typeof roles === "object" && !Array.isArray(roles)) {
        for (const [ref, role] of Object.entries(roles)) {
          if (typeof role === "string")
            row.appendChild(textNode(`${role}: ${nameOf(ref)}`, "lmb-thread-detail"));
        }
      }
      row.appendChild(recordItemActions(() => {
        local.recordDraft = relationDraftFrom(r, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.relations, i, r) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("relations", { relations: next }, state, send);
      }, ctx, t("ui.tabs.codexTab.renderRelations.memoriaWillRemoveThisRelationFromThe")));
    }
    list.appendChild(row);
  });
  if (shown === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderRelations.noRelationMatchesTheSearch"), "lmb-empty"));
  } else {
    sec.body.appendChild(list);
  }
  host.appendChild(sec.wrap);
}
function arrowSpan() {
  const s = document.createElement("span");
  s.className = "lmb-relation-arrow";
  s.textContent = t("ui.tabs.codexTab.arrowSpan.value");
  return s;
}
var GRAPH_W = 520;
var GRAPH_H = 360;
var GRAPH_MIN_W = 180;
var NODE_CLEAR = 14;
var SVG_NS = "http://www.w3.org/2000/svg";
function nsOf(ref) {
  if (ref.startsWith("char:"))
    return "char";
  if (ref.startsWith("loc:"))
    return "loc";
  if (ref.startsWith("thing:"))
    return "thing";
  return "other";
}
function buildGraph(parsed, nameOf) {
  const nodeIds = new Set;
  const raw = [];
  for (const r of parsed.relations) {
    if (!matches(local.query, ...relationSearchText(r, nameOf)))
      continue;
    const kind = str(r["kind"]);
    const stateText = str(r["state"]);
    if (r["type"] === "group") {
      const members = strArray(r["members"]);
      for (let i = 0;i < members.length; i++) {
        for (let j = i + 1;j < members.length; j++) {
          raw.push({ a: members[i], b: members[j], kind, state: stateText, directed: false, group: true });
        }
      }
      members.forEach((m) => nodeIds.add(m));
    } else {
      const a = str(r["a"]);
      const b = str(r["b"]);
      if (!a || !b)
        continue;
      raw.push({ a, b, kind, state: stateText, directed: true, group: false });
      nodeIds.add(a);
      nodeIds.add(b);
    }
  }
  const laneCounts = new Map;
  const pairKey = (a, b) => a < b ? `${a}\x00${b}` : `${b}\x00${a}`;
  for (const e of raw)
    laneCounts.set(pairKey(e.a, e.b), (laneCounts.get(pairKey(e.a, e.b)) ?? 0) + 1);
  const laneUsed = new Map;
  const edges = raw.map((e) => {
    const key = pairKey(e.a, e.b);
    const lane = laneUsed.get(key) ?? 0;
    laneUsed.set(key, lane + 1);
    return { ...e, lane, lanes: laneCounts.get(key) ?? 1 };
  });
  const nodes = [...nodeIds].map((id) => ({
    id,
    name: nameOf(id),
    ns: nsOf(id),
    x: NaN,
    y: NaN
  }));
  return { nodes, edges };
}
function layoutGraph(nodes, edges) {
  if (nodes.length === 0)
    return;
  const ids = new Set(nodes.map((n) => n.id));
  const links = edges.filter((e) => ids.has(e.a) && ids.has(e.b) && e.a !== e.b).map((e) => ({ source: e.a, target: e.b }));
  const sim = simulation_default(nodes).force("link", link_default(links).id((d) => d.id).distance(85).strength(0.55)).force("charge", manyBody_default().strength(-220)).force("collide", collide_default(34)).force("x", x_default2(GRAPH_W / 2).strength(0.05)).force("y", y_default2(GRAPH_H / 2).strength(0.09)).stop();
  sim.tick(300);
}
function edgePath(a, b, e) {
  const ddx = b.x - a.x;
  const ddy = b.y - a.y;
  const d = Math.max(0.15, Math.hypot(ddx, ddy));
  const ux = ddx / d;
  const uy = ddy / d;
  const off = (e.lane - (e.lanes - 1) / 2) * 18;
  const mx = (a.x + b.x) / 2 - uy * off;
  const my = (a.y + b.y) / 2 + ux * off;
  const ax = a.x + ux * NODE_CLEAR;
  const ay = a.y + uy * NODE_CLEAR;
  const bx = b.x - ux * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  const by = b.y - uy * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  return off === 0 ? `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}` : `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}
function svgEl(tag) {
  return document.createElementNS(SVG_NS, tag);
}
function renderRelationGraph(host, parsed, nameOf) {
  const { nodes, edges } = buildGraph(parsed, nameOf);
  if (nodes.length === 0) {
    host.appendChild(textNode(local.query ? t("ui.tabs.codexTab.renderRelationGraph.noRelationMatchesTheSearch") : t("ui.tabs.codexTab.renderRelationGraph.noRelationsToChartYet"), "lmb-empty"));
    return;
  }
  layoutGraph(nodes, edges);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }
  const PAD = 46;
  const bbox = { x: minX - PAD, y: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 };
  const svg = svgEl("svg");
  svg.setAttribute("class", "lmb-graph");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  let aspect = GRAPH_W / GRAPH_H;
  const cam = { cx: bbox.x + bbox.w / 2, cy: bbox.y + bbox.h / 2, w: Math.max(bbox.w, GRAPH_W) };
  const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fitW = () => Math.max(bbox.w, bbox.h * aspect);
  const maxW = () => fitW() * 1.4 + 160;
  const applyCamera = () => {
    const h = cam.w / aspect;
    svg.setAttribute("viewBox", `${(cam.cx - cam.w / 2).toFixed(1)} ${(cam.cy - h / 2).toFixed(1)} ${cam.w.toFixed(1)} ${h.toFixed(1)}`);
  };
  const clampCenter = () => {
    cam.cx = clampNum(cam.cx, bbox.x - cam.w / 4, bbox.x + bbox.w + cam.w / 4);
    const h = cam.w / aspect;
    cam.cy = clampNum(cam.cy, bbox.y - h / 4, bbox.y + bbox.h + h / 4);
  };
  const zoomAt = (clientX, clientY, factor) => {
    const p = toSvgPoint(clientX, clientY);
    const newW = clampNum(cam.w / factor, GRAPH_MIN_W, maxW());
    const scale = newW / cam.w;
    cam.cx = p.x + (cam.cx - p.x) * scale;
    cam.cy = p.y + (cam.cy - p.y) * scale;
    cam.w = newW;
    clampCenter();
    applyCamera();
  };
  const fitCamera = () => {
    cam.cx = bbox.x + bbox.w / 2;
    cam.cy = bbox.y + bbox.h / 2;
    cam.w = clampNum(fitW(), GRAPH_MIN_W, maxW());
    applyCamera();
  };
  applyCamera();
  requestAnimationFrame(() => {
    if (!svg.isConnected)
      return;
    const r = svg.getBoundingClientRect();
    if (r.width > 0 && r.height > 0)
      aspect = r.width / r.height;
    cam.w = clampNum(fitW(), GRAPH_MIN_W, Math.max(r.width * 1.15, 340));
    clampCenter();
    applyCamera();
  });
  const graphRo = new ResizeObserver(() => {
    if (!svg.isConnected) {
      graphRo.disconnect();
      return;
    }
    const r = svg.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      aspect = r.width / r.height;
      clampCenter();
      applyCamera();
    }
  });
  graphRo.observe(svg);
  const defs = svgEl("defs");
  const marker = svgEl("marker");
  marker.setAttribute("id", "lmb-arrow");
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto-start-reverse");
  const arrow = svgEl("path");
  arrow.setAttribute("d", "M 0 0.5 L 8 4 L 0 7.5 z");
  arrow.setAttribute("class", "lmb-graph-arrow");
  marker.appendChild(arrow);
  defs.appendChild(marker);
  svg.appendChild(defs);
  const edgeLayer = svgEl("g");
  const nodeLayer = svgEl("g");
  svg.append(edgeLayer, nodeLayer);
  const detail = document.createElement("div");
  detail.className = "lmb-graph-detail";
  let selectedEdge = null;
  const edgePaths = [];
  for (const e of edges) {
    const a = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a || !b)
      continue;
    const g = svgEl("g");
    g.setAttribute("class", "lmb-graph-edgeg");
    const path = svgEl("path");
    path.setAttribute("class", `lmb-graph-edge${e.group ? t("ui.tabs.codexTab.renderRelationGraph.group") : ""}`);
    path.setAttribute("d", edgePath(a, b, e));
    if (e.directed)
      path.setAttribute("marker-end", "url(#lmb-arrow)");
    const hit = svgEl("path");
    hit.setAttribute("class", "lmb-graph-hit");
    hit.setAttribute("d", edgePath(a, b, e));
    const story = e.group ? `${nameOf(e.a)} · ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}` : `${nameOf(e.a)} → ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}`;
    const tip = svgEl("title");
    tip.textContent = story;
    hit.appendChild(tip);
    hit.addEventListener("click", () => {
      selectedEdge?.classList.remove("selected");
      selectedEdge = g;
      g.classList.add("selected");
      detail.replaceChildren();
      const names = document.createElement("b");
      names.textContent = e.group ? `${nameOf(e.a)} · ${nameOf(e.b)}` : `${nameOf(e.a)} → ${nameOf(e.b)}`;
      detail.append(names, document.createTextNode(`${e.kind ? ` [${e.kind}] ` : " "}${e.state}`));
    });
    g.append(path, hit);
    edgeLayer.appendChild(g);
    edgePaths.push({ visible: path, hit, edge: e });
  }
  const refreshEdgesFor = (id) => {
    for (const { visible, hit, edge } of edgePaths) {
      if (edge.a !== id && edge.b !== id)
        continue;
      const a = byId.get(edge.a);
      const b = byId.get(edge.b);
      if (!a || !b)
        continue;
      const d = edgePath(a, b, edge);
      visible.setAttribute("d", d);
      hit.setAttribute("d", d);
    }
  };
  const toSvgPoint = (clientX, clientY) => {
    const ctm = svg.getScreenCTM();
    if (!ctm)
      return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };
  for (const node of nodes) {
    const g = svgEl("g");
    g.setAttribute("class", `lmb-graph-node ${node.ns}`);
    g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    const rect = svgEl("rect");
    rect.setAttribute("x", "-7.5");
    rect.setAttribute("y", "-7.5");
    rect.setAttribute("width", "15");
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "2");
    rect.setAttribute("transform", "rotate(45)");
    const label = svgEl("text");
    label.setAttribute("y", "22");
    label.setAttribute("text-anchor", "middle");
    label.textContent = node.name.length > 14 ? `${node.name.slice(0, 13)}…` : node.name;
    const tip = svgEl("title");
    tip.textContent = t("ui.tabs.codexTab.renderRelationGraph.value", { name: node.name, id: node.id });
    g.append(rect, label, tip);
    let dragging = false;
    let moved = 0;
    g.addEventListener("pointerdown", (ev) => {
      dragging = true;
      moved = 0;
      g.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    g.addEventListener("pointermove", (ev) => {
      if (!dragging)
        return;
      const p = toSvgPoint(ev.clientX, ev.clientY);
      moved += Math.hypot(p.x - node.x, p.y - node.y);
      node.x = p.x;
      node.y = p.y;
      g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
      refreshEdgesFor(node.id);
    });
    g.addEventListener("pointerup", () => {
      const wasClick = moved < 5;
      dragging = false;
      if (wasClick && node.ns !== "other") {
        local.subtab = "entities";
        local.expandedEntity = node.id;
        local.entityDraft = null;
        rerender();
      }
    });
    g.addEventListener("pointercancel", () => {
      dragging = false;
    });
    nodeLayer.appendChild(g);
  }
  const pointers = new Map;
  const captured = new Set;
  let pinch = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.target?.closest?.(".lmb-graph-node"))
      return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)), w: cam.w };
    }
  });
  svg.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev)
      return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (!captured.has(e.pointerId) && Math.hypot(cur.x - prev.x, cur.y - prev.y) > 3) {
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {}
      captured.add(e.pointerId);
    }
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const targetW = clampNum(pinch.w * (pinch.dist / dist), GRAPH_MIN_W, maxW());
      zoomAt(mid.x, mid.y, cam.w / targetW);
      return;
    }
    const p0 = toSvgPoint(prev.x, prev.y);
    const p1 = toSvgPoint(cur.x, cur.y);
    cam.cx -= p1.x - p0.x;
    cam.cy -= p1.y - p0.y;
    clampCenter();
    applyCamera();
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    captured.delete(e.pointerId);
    if (pointers.size < 2)
      pinch = null;
  };
  svg.addEventListener("pointerup", endPointer);
  svg.addEventListener("pointercancel", endPointer);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0018));
  }, { passive: false });
  const tools = document.createElement("div");
  tools.className = "lmb-graph-tools";
  const viewCenter = () => {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  tools.append(makeButton("−", () => {
    const c = viewCenter();
    zoomAt(c.x, c.y, 1 / 1.4);
  }, { small: true, title: t("ui.tabs.codexTab.renderRelationGraph.zoomOut") }), makeButton("+", () => {
    const c = viewCenter();
    zoomAt(c.x, c.y, 1.4);
  }, { small: true, title: t("ui.tabs.codexTab.renderRelationGraph.zoomIn") }), makeButton(t("ui.tabs.codexTab.renderRelationGraph.fit"), fitCamera, { small: true, title: t("ui.tabs.codexTab.renderRelationGraph.frameTheWholeWeb") }));
  const wrap = document.createElement("div");
  wrap.className = "lmb-graph-wrap";
  lessonMark(wrap, "codex.rel.graph");
  wrap.appendChild(svg);
  wrap.appendChild(tools);
  host.appendChild(wrap);
  host.appendChild(detail);
  const legend = document.createElement("div");
  legend.className = "lmb-spine-legend";
  const present = new Set(nodes.map((node) => node.ns));
  const entries = [
    { ns: "char", label: t("ui.tabs.codexTab.entries.character") },
    { ns: "loc", label: t("ui.tabs.codexTab.entries.location") },
    { ns: "thing", label: t("ui.tabs.codexTab.entries.thing") }
  ];
  for (const e of entries) {
    if (!present.has(e.ns))
      continue;
    const item = document.createElement("span");
    item.className = "lmb-spine-key";
    const swatch = document.createElement("span");
    swatch.className = `lmb-graph-swatch ${e.ns}`;
    item.append(swatch, document.createTextNode(e.label));
    legend.appendChild(item);
  }
  host.appendChild(legend);
  host.appendChild(textNode(t("ui.tabs.codexTab.renderRelationGraph.tapAnEdgeForTheStoryTap"), "lmb-help"));
}
function eventDraftFrom(e, index) {
  return {
    kind: "event",
    index,
    ...e ? { orig: JSON.stringify(e) } : {},
    saving: false,
    fields: {
      when: str(e?.["when"]),
      event: str(e?.["event"]),
      participants: strArray(e?.["participants"]).join(", "),
      where: str(e?.["where"]),
      causes: str(e?.["causes"])
    }
  };
}
function saveEventDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const when = (d.fields["when"] ?? "").trim();
  const eventText = (d.fields["event"] ?? "").trim();
  if (!when || !eventText) {
    showToast("warn", t("ui.tabs.codexTab.saveEventDraft.theEventNeedsAWhenAndWhat"));
    return;
  }
  const participants = splitComma(d.fields["participants"] ?? "");
  const where = (d.fields["where"] ?? "").trim();
  const causes = (d.fields["causes"] ?? "").trim();
  const ev = { when, event: eventText };
  if (participants.length)
    ev["participants"] = participants;
  if (where)
    ev["where"] = where;
  if (causes)
    ev["causes"] = causes;
  const idx = resolveDraftIndex(parsed.events, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.events[idx]["rid"]);
    if (rid)
      ev["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.events.slice(0, idx), ev, ...parsed.events.slice(idx + 1)] : [...parsed.events, ev];
  d.saving = true;
  sendCodexWrite("timeline", { events: next }, state, send);
  rerender();
}
var EVENT_SPECS = [
  { key: "when", label: t("ui.tabs.codexTab.eventSpecs.when"), widget: "input", placeholder: t("ui.tabs.codexTab.eventSpecs.day12") },
  { key: "event", label: t("ui.tabs.codexTab.eventSpecs.event"), widget: "textarea", placeholder: t("ui.tabs.codexTab.eventSpecs.maraSeesEliasKillTheDuke") },
  { key: "participants", label: t("ui.tabs.codexTab.eventSpecs.participantsCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "where", label: t("ui.tabs.codexTab.eventSpecs.where"), widget: "input", refList: true, placeholder: t("ui.tabs.codexTab.eventSpecs.locAshfordManor") },
  { key: "causes", label: t("ui.tabs.codexTab.eventSpecs.causes"), widget: "input", placeholder: t("ui.tabs.codexTab.eventSpecs.sheFleesTheCity") }
];
function renderTimeline(host, parsed, state, ctx, send) {
  const sec = section(t("ui.tabs.codexTab.sec.timeline"));
  lessonMark(sec.wrap, "codex.tl");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.appendChild(makeButton(t("ui.tabs.codexTab.renderTimeline.event"), () => {
    local.recordDraft = eventDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  sec.body.appendChild(toolbar);
  const draft = local.recordDraft;
  if (draft?.kind === "event" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderTimeline.newEvent"), EVENT_SPECS, draft, refListId, () => saveEventDraft(draft, state, send)));
  }
  if (parsed.events.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderTimeline.noEventsRecordedYet"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const withIndex = parsed.events.map((e, i) => ({ e, i }));
  const all = withIndex.filter(({ e }) => matches(local.query, str(e["when"]), str(e["event"]), str(e["causes"]), strArray(e["participants"]).map(nameOf)));
  if (all.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderTimeline.noEventMatchesTheSearch"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const paged = !local.query && !local.showFullTimeline && all.length > TIMELINE_RECENT;
  const shown = (paged ? all.slice(-TIMELINE_RECENT) : all).slice().reverse();
  const rail = document.createElement("div");
  rail.className = "lmb-timeline";
  let prevContext = "";
  for (const { e, i } of shown) {
    if (draft?.kind === "event" && draft.index === i) {
      rail.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderTimeline.editEvent"), EVENT_SPECS, draft, refListId, () => saveEventDraft(draft, state, send)));
      prevContext = "";
      continue;
    }
    const expanded = local.expandedEvents.has(i);
    const item = document.createElement("div");
    item.className = `lmb-timeline-item lmb-record-click${expanded ? " expanded" : ""}`;
    item.title = t("ui.tabs.codexTab.renderTimeline.clickForEditAndDelete");
    const when = document.createElement("div");
    when.className = "lmb-timeline-when";
    when.textContent = str(e["when"]) || "?";
    const eventText = document.createElement("div");
    eventText.className = "lmb-timeline-event";
    eventText.textContent = str(e["event"]);
    item.append(when, eventText);
    const contextBits = [];
    const participants = strArray(e["participants"]).map(nameOf);
    if (participants.length)
      contextBits.push(participants.join(", "));
    const where = str(e["where"]);
    if (where)
      contextBits.push(`@ ${nameOf(where)}`);
    const context = contextBits.join("  ·  ");
    const detailBits = [];
    if (context && context !== prevContext)
      detailBits.push(context);
    prevContext = context;
    const causes = str(e["causes"]);
    if (causes)
      detailBits.push(`→ ${causes}`);
    if (detailBits.length) {
      item.appendChild(textNode(detailBits.join("  ·  "), "lmb-timeline-detail"));
    }
    item.addEventListener("click", () => {
      if (expanded)
        local.expandedEvents.delete(i);
      else
        local.expandedEvents.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(() => {
        local.recordDraft = eventDraftFrom(e, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.events, i, e) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("timeline", { events: next }, state, send);
      }, ctx, t("ui.tabs.codexTab.actions.memoriaWillRemoveThisEventFromThe"));
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      item.appendChild(actions);
    }
    rail.appendChild(item);
  }
  sec.body.appendChild(rail);
  if (!local.query && all.length > TIMELINE_RECENT) {
    sec.body.appendChild(makeButton(local.showFullTimeline ? t("ui.tabs.codexTab.renderTimeline.showRecentOnly") : t("ui.tabs.codexTab.renderTimeline.showEarlier", { lengthTimelineRecent: all.length - TIMELINE_RECENT }), () => {
      local.showFullTimeline = !local.showFullTimeline;
      rerender();
    }, { small: true }));
  }
  host.appendChild(sec.wrap);
}
var THREAD_TONE = {
  open: "ok",
  stalled: "warn",
  abandoned: "danger",
  resolved: undefined
};
function threadDraftFrom(t, index) {
  return {
    kind: "thread",
    index,
    ...t ? { orig: JSON.stringify(t) } : {},
    saving: false,
    fields: {
      name: str(t?.["name"]),
      status: str(t?.["status"]) || "open",
      summary: str(t?.["summary"]),
      latest: str(t?.["latest"]),
      planted: strArray(t?.["planted"]).join(`
`)
    }
  };
}
var THREAD_SPECS = [
  { key: "name", label: t("ui.tabs.codexTab.threadSpecs.name"), widget: "input", placeholder: t("ui.tabs.codexTab.threadSpecs.theStolenCrown") },
  { key: "status", label: t("ui.tabs.codexTab.threadSpecs.status"), widget: "select", options: [
    { value: "open", label: t("ui.tabs.codexTab.threadSpecs.open") },
    { value: "stalled", label: t("ui.tabs.codexTab.threadSpecs.stalled") },
    { value: "resolved", label: t("ui.tabs.codexTab.threadSpecs.resolved") },
    { value: "abandoned", label: t("ui.tabs.codexTab.threadSpecs.abandoned") }
  ] },
  { key: "summary", label: t("ui.tabs.codexTab.threadSpecs.summary"), widget: "textarea" },
  { key: "latest", label: t("ui.tabs.codexTab.threadSpecs.latestDevelopment"), widget: "input" },
  { key: "planted", label: t("ui.tabs.codexTab.threadSpecs.plantedDetailsOnePerLine"), widget: "lines" }
];
function saveThreadDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const name = (d.fields["name"] ?? "").trim();
  const summary = (d.fields["summary"] ?? "").trim();
  if (!name || !summary) {
    showToast("warn", t("ui.tabs.codexTab.saveThreadDraft.theThreadNeedsANameAndA"));
    return;
  }
  const t2 = { name, status: d.fields["status"] || "open", summary };
  const latest = (d.fields["latest"] ?? "").trim();
  if (latest)
    t2["latest"] = latest;
  const planted = splitLines(d.fields["planted"] ?? "");
  if (planted.length)
    t2["planted"] = planted;
  const idx = resolveDraftIndex(parsed.threads, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.threads[idx]["rid"]);
    if (rid)
      t2["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.threads.slice(0, idx), t2, ...parsed.threads.slice(idx + 1)] : [...parsed.threads, t2];
  d.saving = true;
  sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
  rerender();
}
function renderThreads(host, parsed, state, ctx, send) {
  const sec = section(t("ui.tabs.codexTab.sec.threads"));
  lessonMark(sec.wrap, "codex.th");
  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.append(makeButton(t("ui.tabs.codexTab.renderThreads.thread"), () => {
    local.recordDraft = threadDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }), makeButton(t("ui.tabs.codexTab.renderThreads.editSeeds"), () => {
    local.recordDraft = { kind: "seeds", index: -1, saving: false, fields: { seeds: parsed.seeds.join(`
`) } };
    rerender();
  }, { small: true }));
  sec.body.appendChild(toolbar);
  const draft = local.recordDraft;
  if (draft?.kind === "thread" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderThreads.newThread"), THREAD_SPECS, draft, null, () => saveThreadDraft(draft, state, send)));
  } else if (draft?.kind === "seeds") {
    sec.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderThreads.editSeeds"), [{ key: "seeds", label: t("ui.tabs.codexTab.renderThreads.seedsOnePerLine"), widget: "lines" }], draft, null, () => {
      draft.saving = true;
      sendCodexWrite("threads", { threads: parsed.threads, seeds: splitLines(draft.fields["seeds"] ?? "") }, state, send);
      rerender();
    }));
  }
  if (parsed.threads.length === 0 && parsed.seeds.length === 0) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderThreads.noOpenStorylinesTrackedYet"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  if (parsed.threads.some((t) => str(t["status"]) === "resolved")) {
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderThreads.resolvedThreadsStayHereAsYourArchive"), "lmb-help"));
  }
  const list = document.createElement("div");
  list.className = "lmb-thread-list";
  let shown = 0;
  parsed.threads.forEach((t2, i) => {
    if (!matches(local.query, str(t2["name"]), str(t2["summary"]), str(t2["latest"]), strArray(t2["planted"])))
      return;
    shown++;
    if (draft?.kind === "thread" && draft.index === i) {
      list.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderThreads.editThread"), THREAD_SPECS, draft, null, () => saveThreadDraft(draft, state, send)));
      return;
    }
    const name = str(t2["name"]);
    const row = document.createElement("div");
    row.className = "lmb-thread";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-thread-head";
    const status = str(t2["status"]) || "open";
    head.append(pill(t("ui.tabs.codexTab.threadStatus", { status }), THREAD_TONE[status]));
    const title = document.createElement("span");
    title.className = "lmb-thread-name";
    title.textContent = name || "?";
    head.appendChild(title);
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${local.expandedThreads.has(name) ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (local.expandedThreads.has(name))
        local.expandedThreads.delete(name);
      else
        local.expandedThreads.add(name);
      rerender();
    });
    row.appendChild(head);
    row.appendChild(textNode(str(t2["summary"]), "lmb-thread-summary"));
    if (local.expandedThreads.has(name)) {
      const latest = str(t2["latest"]);
      if (latest)
        row.appendChild(textNode(t("ui.tabs.codexTab.renderThreads.latest", { latest }), "lmb-thread-detail"));
      for (const p of strArray(t2["planted"])) {
        row.appendChild(textNode(t("ui.tabs.codexTab.renderThreads.planted", { p }), "lmb-thread-detail"));
      }
      row.appendChild(recordItemActions(() => {
        local.recordDraft = threadDraftFrom(t2, i);
        rerender();
      }, () => {
        const cur = cache.parsed;
        const next = cur ? spliceOutIfCurrent(cur.threads, i, t2) : null;
        if (!cur || !next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("threads", { threads: next, seeds: cur.seeds }, state, send);
      }, ctx, t("ui.tabs.codexTab.renderThreads.memoriaWillRemoveThisThreadFromThe")));
    }
    list.appendChild(row);
  });
  if (shown > 0)
    sec.body.appendChild(list);
  else if (parsed.threads.length > 0)
    sec.body.appendChild(textNode(t("ui.tabs.codexTab.renderThreads.noThreadMatchesTheSearch"), "lmb-empty"));
  const seeds = parsed.seeds.filter((s) => matches(local.query, s));
  if (seeds.length) {
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = t("ui.tabs.codexTab.renderThreads.seeds", { length: parsed.seeds.length });
    sec.body.appendChild(sub);
    for (const s of seeds) {
      sec.body.appendChild(textNode(`◆ ${s}`, "lmb-thread-detail"));
    }
  }
  host.appendChild(sec.wrap);
}
function worldDraftFrom(w, index) {
  return {
    kind: "world",
    index,
    ...w ? { orig: JSON.stringify(w) } : {},
    saving: false,
    fields: {
      topic: str(w?.["topic"]),
      facts: strArray(w?.["facts"]).join(`
`),
      keywords: strArray(w?.["keywords"]).join(", ")
    }
  };
}
function knowledgeDraftFrom(k, index) {
  const beliefs = objArray(k?.["falseBeliefs"]).map((b) => `${str(b["who"])} => ${str(b["believes"])}`).join(`
`);
  return {
    kind: "knowledge",
    index,
    ...k ? { orig: JSON.stringify(k) } : {},
    saving: false,
    fields: {
      fact: str(k?.["fact"]),
      knownBy: strArray(k?.["knownBy"]).join(", "),
      hiddenFrom: strArray(k?.["hiddenFrom"]).join(", "),
      falseBeliefs: beliefs,
      note: str(k?.["note"]),
      keywords: strArray(k?.["keywords"]).join(", ")
    }
  };
}
function saveWorldDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const topic = (d.fields["topic"] ?? "").trim();
  const facts = splitLines(d.fields["facts"] ?? "");
  if (!topic || facts.length === 0) {
    showToast("warn", t("ui.tabs.codexTab.saveWorldDraft.theTopicNeedsANameAndAt"));
    return;
  }
  const entry = { topic, facts };
  const keywords = splitComma(d.fields["keywords"] ?? "");
  if (keywords.length)
    entry["keywords"] = keywords;
  const idx = resolveDraftIndex(parsed.world, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.world[idx]["rid"]);
    if (rid)
      entry["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.world.slice(0, idx), entry, ...parsed.world.slice(idx + 1)] : [...parsed.world, entry];
  d.saving = true;
  sendCodexWrite("world", { entries: next }, state, send);
  rerender();
}
function saveKnowledgeDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const fact = (d.fields["fact"] ?? "").trim();
  if (!fact) {
    showToast("warn", t("ui.tabs.codexTab.saveKnowledgeDraft.theSecretNeedsItsFact"));
    return;
  }
  const item = { fact };
  const knownBy = splitComma(d.fields["knownBy"] ?? "");
  if (knownBy.length)
    item["knownBy"] = knownBy;
  const hiddenFrom = splitComma(d.fields["hiddenFrom"] ?? "");
  if (hiddenFrom.length)
    item["hiddenFrom"] = hiddenFrom;
  const falseBeliefs = splitLines(d.fields["falseBeliefs"] ?? "").map((line) => {
    const at = line.indexOf("=>");
    if (at === -1)
      return null;
    const who = line.slice(0, at).trim();
    const believes = line.slice(at + 2).trim();
    return who && believes ? { who, believes } : null;
  }).filter((x) => !!x);
  if (falseBeliefs.length)
    item["falseBeliefs"] = falseBeliefs;
  const note = (d.fields["note"] ?? "").trim();
  if (note)
    item["note"] = note;
  const kws = splitComma(d.fields["keywords"] ?? "");
  if (kws.length)
    item["keywords"] = kws;
  const idx = resolveDraftIndex(parsed.knowledge, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.knowledge[idx]["rid"]);
    if (rid)
      item["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.knowledge.slice(0, idx), item, ...parsed.knowledge.slice(idx + 1)] : [...parsed.knowledge, item];
  d.saving = true;
  sendCodexWrite("knowledge", { items: next }, state, send);
  rerender();
}
var WORLD_SPECS = [
  { key: "topic", label: t("ui.tabs.codexTab.worldSpecs.topic"), widget: "input", placeholder: t("ui.tabs.codexTab.worldSpecs.magic") },
  { key: "facts", label: t("ui.tabs.codexTab.worldSpecs.factsOnePerLine"), widget: "lines", placeholder: t("ui.tabs.codexTab.worldSpecs.bloodMagicCostsMemories") },
  { key: "keywords", label: t("ui.tabs.codexTab.worldSpecs.keywordsCommaSeparatedRetrievalTags"), widget: "input", placeholder: t("ui.tabs.codexTab.worldSpecs.ritualMemoriesBloodMagic") }
];
var KNOWLEDGE_SPECS = [
  { key: "fact", label: t("ui.tabs.codexTab.knowledgeSpecs.fact"), widget: "textarea", placeholder: t("ui.tabs.codexTab.knowledgeSpecs.eliasKilledTheDuke") },
  { key: "knownBy", label: t("ui.tabs.codexTab.knowledgeSpecs.knownByCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "hiddenFrom", label: t("ui.tabs.codexTab.knowledgeSpecs.hiddenFromCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "falseBeliefs", label: t("ui.tabs.codexTab.knowledgeSpecs.falseBeliefsOnePerLineWhoBelief"), widget: "lines", placeholder: t("ui.tabs.codexTab.knowledgeSpecs.charCaptainBanditsDidIt") },
  { key: "note", label: t("ui.tabs.codexTab.knowledgeSpecs.note"), widget: "input" },
  { key: "keywords", label: t("ui.tabs.codexTab.knowledgeSpecs.keywordsCommaSeparatedRetrievalTags"), widget: "input", placeholder: t("ui.tabs.codexTab.knowledgeSpecs.murderDaggerDuke") }
];
function renderLore(host, parsed, state, ctx, send) {
  const draft = local.recordDraft;
  const world = section(t("ui.tabs.codexTab.world.worldRules"));
  lessonMark(world.wrap, "codex.lore");
  const worldBar = document.createElement("div");
  worldBar.className = "lmb-actions";
  worldBar.appendChild(makeButton(t("ui.tabs.codexTab.renderLore.topic"), () => {
    local.recordDraft = worldDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  world.body.appendChild(worldBar);
  if (draft?.kind === "world" && draft.index === -1) {
    world.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderLore.newTopic"), WORLD_SPECS, draft, null, () => saveWorldDraft(draft, state, send)));
  }
  const worldShown = parsed.world.map((w, i) => ({ w, i })).filter(({ w }) => matches(local.query, str(w["topic"]), strArray(w["facts"]), strArray(w["keywords"])));
  if (parsed.world.length === 0) {
    world.body.appendChild(textNode(t("ui.tabs.codexTab.renderLore.noWorldLoreRecordedYet"), "lmb-empty"));
  } else if (worldShown.length === 0) {
    world.body.appendChild(textNode(t("ui.tabs.codexTab.renderLore.noTopicMatchesTheSearch"), "lmb-empty"));
  }
  for (const { w, i } of worldShown) {
    if (draft?.kind === "world" && draft.index === i) {
      world.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderLore.editTopic"), WORLD_SPECS, draft, null, () => saveWorldDraft(draft, state, send)));
      continue;
    }
    const expanded = local.expandedWorld.has(i);
    const block = document.createElement("div");
    block.className = "lmb-lore-topic lmb-record-click";
    block.title = t("ui.tabs.codexTab.renderLore.clickForEditAndDelete");
    const t2 = document.createElement("div");
    t2.className = "lmb-lore-title";
    t2.textContent = str(w["topic"]) || "?";
    block.appendChild(t2);
    const ul = document.createElement("ul");
    ul.className = "lmb-lore-facts";
    for (const f of strArray(w["facts"])) {
      const li = document.createElement("li");
      li.textContent = f;
      ul.appendChild(li);
    }
    block.appendChild(ul);
    block.addEventListener("click", () => {
      if (expanded)
        local.expandedWorld.delete(i);
      else
        local.expandedWorld.add(i);
      rerender();
    });
    if (expanded) {
      const kws = strArray(w["keywords"]);
      if (kws.length)
        block.appendChild(textNode(t("ui.tabs.codexTab.renderLore.keywords", { join: kws.join(" · ") }), "lmb-thread-detail"));
      const actions = recordItemActions(() => {
        local.recordDraft = worldDraftFrom(w, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.world, i, w) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("world", { entries: next }, state, send);
      }, ctx, t("ui.tabs.codexTab.actions.memoriaWillRemoveThisTopicAndIts"));
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    world.body.appendChild(block);
  }
  host.appendChild(world.wrap);
}
function renderSecrets(host, parsed, state, ctx, send) {
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const draft = local.recordDraft;
  const secrets = section(t("ui.tabs.codexTab.secrets.whoKnowsWhat"));
  lessonMark(secrets.wrap, "codex.secrets");
  const secretBar = document.createElement("div");
  secretBar.className = "lmb-actions";
  secretBar.appendChild(makeButton(t("ui.tabs.codexTab.renderSecrets.secret"), () => {
    local.recordDraft = knowledgeDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  secrets.body.appendChild(secretBar);
  if (draft?.kind === "knowledge" && draft.index === -1) {
    secrets.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderSecrets.newSecret"), KNOWLEDGE_SPECS, draft, refListId, () => saveKnowledgeDraft(draft, state, send)));
  }
  const knowledgeShown = parsed.knowledge.map((k, i) => ({ k, i })).filter(({ k }) => matches(local.query, str(k["fact"]), str(k["note"]), strArray(k["knownBy"]).map(nameOf), strArray(k["hiddenFrom"]).map(nameOf), objArray(k["falseBeliefs"]).map((b) => str(b["believes"])), objArray(k["falseBeliefs"]).map((b) => nameOf(str(b["who"]))), strArray(k["keywords"])));
  if (parsed.knowledge.length === 0) {
    secrets.body.appendChild(textNode(t("ui.tabs.codexTab.renderSecrets.noSecretsOrAsymmetricKnowledgeTrackedYet"), "lmb-empty"));
  } else if (knowledgeShown.length === 0) {
    secrets.body.appendChild(textNode(t("ui.tabs.codexTab.renderSecrets.noSecretMatchesTheSearch"), "lmb-empty"));
  }
  for (const { k, i } of knowledgeShown) {
    if (draft?.kind === "knowledge" && draft.index === i) {
      secrets.body.appendChild(renderRecordForm(t("ui.tabs.codexTab.renderSecrets.editSecret"), KNOWLEDGE_SPECS, draft, refListId, () => saveKnowledgeDraft(draft, state, send)));
      continue;
    }
    const expanded = local.expandedSecrets.has(i);
    const block = document.createElement("div");
    block.className = "lmb-secret lmb-record-click";
    block.title = t("ui.tabs.codexTab.renderSecrets.clickForEditAndDelete");
    block.appendChild(textNode(str(k["fact"]), "lmb-secret-fact"));
    const chips = document.createElement("div");
    chips.className = "lmb-actions";
    for (const who of strArray(k["knownBy"]))
      chips.appendChild(pill(t("ui.tabs.codexTab.renderSecrets.knows", { nameOf: nameOf(who) }), "ok"));
    for (const who of strArray(k["hiddenFrom"]))
      chips.appendChild(pill(t("ui.tabs.codexTab.renderSecrets.hidden", { nameOf: nameOf(who) }), "warn"));
    if (chips.childElementCount)
      block.appendChild(chips);
    for (const b of objArray(k["falseBeliefs"])) {
      block.appendChild(textNode(t("ui.tabs.codexTab.renderSecrets.wronglyBelieves", { nameOf: nameOf(str(b["who"])), str: str(b["believes"]) }), "lmb-thread-detail"));
    }
    const note = str(k["note"]);
    if (note)
      block.appendChild(textNode(note, "lmb-thread-detail"));
    block.addEventListener("click", () => {
      if (expanded)
        local.expandedSecrets.delete(i);
      else
        local.expandedSecrets.add(i);
      rerender();
    });
    if (expanded) {
      const kws = strArray(k["keywords"]);
      if (kws.length)
        block.appendChild(textNode(t("ui.tabs.codexTab.renderSecrets.keywords", { join: kws.join(" · ") }), "lmb-thread-detail"));
      const actions = recordItemActions(() => {
        local.recordDraft = knowledgeDraftFrom(k, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.knowledge, i, k) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("knowledge", { items: next }, state, send);
      }, ctx, t("ui.tabs.codexTab.actions.memoriaWillRemoveThisSecretFromThe"));
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    secrets.body.appendChild(block);
  }
  host.appendChild(secrets.wrap);
}

// src/ui/activation-control.ts
var nextGroup = 0;
function activationControl(label, value, onChange) {
  const group = document.createElement("fieldset");
  group.className = "lmb-activation";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend);
  const row = document.createElement("div");
  row.className = "lmb-activation-options";
  const name = `lmb-activation-${++nextGroup}`;
  for (const [mode, title] of [["always", t("ui.activationControl.activationControl.always")], ["keywords", t("ui.activationControl.activationControl.keywords")], ["vector", t("ui.activationControl.activationControl.vectorKeywords")]]) {
    const option = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = mode;
    input.checked = value === mode;
    input.addEventListener("change", () => {
      if (input.checked)
        onChange(mode);
    });
    option.append(input, textNode(title, "lmb-activation-label"));
    row.append(option);
  }
  group.append(row);
  return group;
}
function vectorSetupHint() {
  return textNode(t("ui.activationControl.vectorSetupHint.vectorRecallNeedsATestedEmbeddingConnection"), "lmb-field-hint");
}

// src/ui/tabs/profile-tab.ts
var PROFILE_DEFAULTS = makeDefaultProfile("__defaults__", t("ui.tabs.profileTab.profileDefaults.defaults"));
var CODEX_LAG_TOKENS_DEFAULT = 2000;
var CODEX_WINDOW_TOKENS_DEFAULT = 8000;
function renderCodexSettings(host, state, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.knowledgeCodex"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexEnabled,
    label: t("ui.tabs.profileTab.renderCodexSettings.enableCodex"),
    onChange: (codexEnabled) => patch({ codexEnabled })
  }), "tuning.codex.enabled"));
  const updating = section(t("ui.tabs.profileTab.updating.codexUpdating"));
  const lag = document.createElement("div");
  for (const kind of ["window", "lag"]) {
    const label = kind === "window" ? t("ui.tabs.profileTab.renderCodexSettings.window") : t("ui.tabs.profileTab.renderCodexSettings.lag");
    const unit = kind === "window" ? profile.codexWindowUnit : profile.codexLagUnit;
    const value = kind === "window" ? profile.codexWindowValue : profile.codexLagValue;
    const fallback = kind === "window" ? unit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue : unit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue;
    const group = kind === "lag" ? lag : document.createElement("div");
    group.className = "lmb-collapsible-body";
    if (kind === "window")
      lessonMark(group, "tuning.codex.window");
    else
      lessonMark(group, "tuning.codex.lag");
    group.append(labelled(t("ui.tabs.profileTab.renderCodexSettings.unit", { kind: label }), select({
      value: unit,
      options: [{ value: "messages", label: t("ui.tabs.profileTab.renderCodexSettings.messages") }, { value: "tokens", label: t("ui.tabs.profileTab.renderCodexSettings.messageTokens") }],
      onChange: (v) => {
        const next = v === "tokens" ? "tokens" : "messages";
        patch(kind === "window" ? { codexWindowUnit: next } : { codexLagUnit: next });
      }
    })), labelled(label, numberInput({
      value,
      min: kind === "window" ? 1 : 0,
      max: unit === "tokens" ? 1e6 : 1e5,
      step: unit === "tokens" ? kind === "window" ? 100 : 50 : 1,
      defaultValue: fallback,
      onBlur: (v) => patch(kind === "window" ? { codexWindowValue: v ?? fallback } : { codexLagValue: v ?? fallback })
    })));
    if (kind === "window")
      updating.body.appendChild(group);
  }
  if (profile.codexWindowUnit === "messages") {
    updating.body.appendChild(lessonMark(labelled(t("ui.tabs.profileTab.renderCodexSettings.tokensBreakpoint"), numberInput({
      value: profile.codexTokenBreakpoint,
      min: 1000,
      max: 1e6,
      step: 5000,
      defaultValue: PROFILE_DEFAULTS.codexTokenBreakpoint,
      onBlur: (v) => patch({ codexTokenBreakpoint: v ?? PROFILE_DEFAULTS.codexTokenBreakpoint })
    })), "tuning.codex.breakpoint"));
    updating.body.appendChild(textNode(t("ui.tabs.profileTab.renderCodexSettings.runsWhenEitherTheWindowOrThis"), "lmb-field-hint"));
  }
  appendAutomationControls(updating.body, lag, !profile.codexManualOnly, (enabled) => patch({ codexManualOnly: !enabled }));
  sec.body.appendChild(updating.wrap);
  const fields = document.createElement("div");
  fields.className = "lmb-collapsible-body";
  sec.body.appendChild(fields);
  const loreGrid = document.createElement("div");
  loreGrid.className = "lmb-grid-2";
  loreGrid.append(labelled(t("ui.tabs.profileTab.renderCodexSettings.loreLimit"), select({
    value: profile.codexLoreLimitUnit,
    options: [
      { value: "percent", label: t("ui.tabs.profileTab.renderCodexSettings.ofMaxContext") },
      { value: "tokens", label: t("ui.tabs.profileTab.renderCodexSettings.tokenCap") }
    ],
    onChange: (v) => patch({ codexLoreLimitUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(profile.codexLoreLimitUnit === "tokens" ? t("ui.tabs.profileTab.renderCodexSettings.loreTokens0NoLimit") : t("ui.tabs.profileTab.renderCodexSettings.loreOfMaxContext"), numberInput({
    value: profile.codexLoreLimitUnit === "tokens" ? profile.codexLoreLimitTokens : profile.codexLoreLimitPercent,
    min: profile.codexLoreLimitUnit === "tokens" ? 0 : 1,
    max: profile.codexLoreLimitUnit === "tokens" ? 1e6 : 100,
    step: profile.codexLoreLimitUnit === "tokens" ? 500 : 1,
    defaultValue: profile.codexLoreLimitUnit === "tokens" ? PROFILE_DEFAULTS.codexLoreLimitTokens : PROFILE_DEFAULTS.codexLoreLimitPercent,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.codexLoreLimitUnit === "tokens")
        patch({ codexLoreLimitTokens: v });
      else
        patch({ codexLoreLimitPercent: v });
    }
  })));
  fields.appendChild(loreGrid);
  const loreHint = document.createElement("div");
  loreHint.className = "lmb-field-hint";
  loreHint.textContent = t("ui.tabs.profileTab.renderCodexSettings.yourActivatedLorebookEntriesRideEveryCodex");
  fields.appendChild(loreHint);
  fields.appendChild(activationControl(t("ui.tabs.profileTab.renderCodexSettings.codexRecall"), profile.codexActivationMode, (codexActivationMode) => patch({ codexActivationMode })));
  fields.appendChild(textNode(t("ui.tabs.profileTab.renderCodexSettings.theActiveProfileSetsRecallForEnabled"), "lmb-field-hint"));
  if (profile.codexActivationMode === "vector")
    fields.appendChild(vectorSetupHint());
  fields.appendChild(labelled(t("ui.tabs.profileTab.renderCodexSettings.codexPlacement"), select({
    value: profile.codexInjectionPosition,
    options: [{ value: "lorebook", label: t("ui.tabs.profileTab.renderCodexSettings.lorebookBefore") }, { value: "depth", label: t("ui.tabs.profileTab.renderCodexSettings.atHistoryDepth") }, { value: "after_history", label: t("ui.tabs.profileTab.renderCodexSettings.afterChatHistory") }],
    onChange: (v) => patch({ codexInjectionPosition: v })
  })));
  if (profile.codexInjectionPosition === "depth")
    fields.appendChild(labelled(t("ui.tabs.profileTab.renderCodexSettings.depthFromNewestTurn"), numberInput({
      value: profile.codexInjectionDepth,
      min: 0,
      max: 1e4,
      onBlur: (v) => patch({ codexInjectionDepth: v ?? 4 })
    })));
  const placementHint = document.createElement("div");
  placementHint.className = "lmb-help";
  placementHint.textContent = t("ui.tabs.profileTab.renderCodexSettings.summariesReplaceTheirSourceHistoryInPlace");
  fields.appendChild(placementHint);
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexRelationsTable,
    label: t("ui.tabs.profileTab.renderCodexSettings.relationsTable"),
    hint: t("ui.tabs.profileTab.renderCodexSettings.tracksConnectionsBetweenEntitiesAsOneShared"),
    onChange: (v) => patch({ codexRelationsTable: v })
  }), "tuning.codex.relations"));
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexThorough,
    label: t("ui.tabs.profileTab.renderCodexSettings.thoroughMode"),
    hint: t("ui.tabs.profileTab.renderCodexSettings.spendsOneExtraVerificationRoundPerUpdate"),
    onChange: (v) => patch({ codexThorough: v })
  }), "tuning.codex.thorough"));
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexExtraContext,
    label: t("ui.tabs.profileTab.renderCodexSettings.extraContextMode"),
    hint: t("ui.tabs.profileTab.renderCodexSettings.summarizesChaptersEarlyAtTheCodexLag"),
    onChange: (v) => patch({ codexExtraContext: v })
  }), "tuning.codex.extra"));
  const soFarFields = document.createElement("div");
  soFarFields.className = profile.codexExtraContext ? "" : "lmb-greyed";
  soFarFields.appendChild(labelled(t("ui.tabs.profileTab.renderCodexSettings.chaptersProvided"), numberInput({
    value: profile.codexStorySoFarCount,
    min: 0,
    max: 50,
    defaultValue: PROFILE_DEFAULTS.codexStorySoFarCount,
    onBlur: (v) => patch({ codexStorySoFarCount: v ?? PROFILE_DEFAULTS.codexStorySoFarCount })
  })));
  const soFarHint = document.createElement("div");
  soFarHint.className = "lmb-field-hint";
  soFarHint.textContent = t("ui.tabs.profileTab.renderCodexSettings.howManyRecentChapterSummariesExtraContext");
  soFarFields.appendChild(soFarHint);
  fields.appendChild(soFarFields);
  const modelHint = document.createElement("div");
  modelHint.className = "lmb-field-hint";
  modelHint.textContent = t("ui.tabs.profileTab.renderCodexSettings.theCodexAgentSConnectionAndSamplers");
  fields.appendChild(modelHint);
  host.appendChild(sec.wrap);
}
function renderCodexConnection(host, state, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.codexConnection"));
  const connOpts = [
    { value: "", label: t("ui.tabs.profileTab.connOpts.sameAsSummaryConnection") },
    ...state.connections.map((c) => ({
      value: c.id,
      label: t("ui.tabs.profileTab.connOpts.value", { name: c.name, provider: c.provider, choice: c.model ? "yes" : "no", model: c.model ? c.model : "", choice2: c.isDefault ? "yes" : "no" })
    }))
  ];
  sec.body.appendChild(lessonMark(select({
    value: profile.codexConnectionId ?? "",
    options: connOpts,
    onChange: (v) => patch({ codexConnectionId: v || null })
  }), "tuning.codex.connection"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexUseTools,
    label: t("ui.tabs.profileTab.renderCodexConnection.useToolCalls"),
    hint: t("ui.tabs.profileTab.renderCodexConnection.offByDefaultTheAgentWritesOne"),
    onChange: (v) => patch({ codexUseTools: v })
  }), "tuning.codex.usetools"));
  sec.body.appendChild(labelled(t("ui.tabs.profileTab.renderCodexConnection.updateDelivery"), select({
    value: profile.codexWriteMode,
    options: [
      { value: "batch", label: t("ui.tabs.profileTab.renderCodexConnection.allRecordsAtOnce") },
      { value: "sequential", label: t("ui.tabs.profileTab.renderCodexConnection.oneRecordAtATime") }
    ],
    onChange: (v) => patch({ codexWriteMode: v === "sequential" ? "sequential" : "batch" })
  })));
  const seqHelp = document.createElement("div");
  seqHelp.className = "lmb-help";
  seqHelp.textContent = t("ui.tabs.profileTab.renderCodexConnection.memoriaAlwaysMakesSureEveryRecordIs");
  sec.body.appendChild(seqHelp);
  host.appendChild(sec.wrap);
}
function renderResetSettings(host, state, send) {
  const profile = state.activeProfile;
  const sec = section(t("ui.tabs.profileTab.sec.reset"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.profileTab.renderResetSettings.resetsThisProfileSSettingsToTheir");
  sec.body.appendChild(help);
  const IDLE = t("ui.tabs.profileTab.idle.resetProfileToDefaults");
  const CONFIRM = t("ui.tabs.profileTab.confirm.clickAgainToConfirm");
  let btn;
  let armed = false;
  let timer;
  const disarm = () => {
    armed = false;
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    btn.textContent = IDLE;
  };
  btn = makeButton(IDLE, () => {
    if (!armed) {
      armed = true;
      btn.textContent = CONFIRM;
      timer = setTimeout(disarm, 3000);
      return;
    }
    disarm();
    send({
      type: "save_profile",
      profile: makeDefaultProfile(profile.id, profile.name),
      chatId: state.activeChatId
    });
  }, { danger: true });
  sec.body.appendChild(btn);
  host.appendChild(sec.wrap);
}
function renderProfilePicker(host, state, ctx, send) {
  const sec = section(t("ui.tabs.profileTab.sec.profile"));
  const row = document.createElement("div");
  row.className = "lmb-field-row";
  lessonMark(row, "tuning.profile.select");
  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(select({
    value: state.activeProfile.id,
    options: state.settings.profiles.map((p) => ({ value: p.id, label: p.name })),
    onChange: (v) => send({ type: "set_active_profile", profileId: v, chatId: state.activeChatId })
  }));
  row.appendChild(grow);
  row.append(makeButton(t("ui.tabs.profileTab.renderProfilePicker.new"), async () => {
    const name = await promptForString(ctx, t("ui.tabs.profileTab.name.newProfileName"), "");
    if (!name)
      return;
    send({ type: "create_profile", name, chatId: state.activeChatId });
  }, { small: true }), makeButton(t("ui.tabs.profileTab.renderProfilePicker.delete"), () => {
    send({ type: "delete_profile", profileId: state.activeProfile.id, chatId: state.activeChatId });
  }, { small: true, danger: true, disabled: state.settings.profiles.length <= 1 }));
  sec.body.appendChild(row);
  const profile = state.activeProfile;
  const nameField = field(t("ui.tabs.profileTab.nameField.profileName"));
  nameField.body.appendChild(textInput({
    value: profile.name,
    onBlur: (v) => send({ type: "save_profile", profile: { id: profile.id, name: v.slice(0, 60) }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(nameField.wrap);
  const enableWrap = field(t("ui.tabs.profileTab.enableWrap.extension"));
  enableWrap.body.appendChild(checkbox({
    checked: state.settings.enabled,
    label: t("ui.tabs.profileTab.renderProfilePicker.enabled"),
    hint: t("ui.tabs.profileTab.renderProfilePicker.masterSwitchWhenOffMemoriaDoesNothing"),
    onChange: (v) => send({ type: "save_settings", patch: { enabled: v }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(enableWrap.wrap);
  host.appendChild(sec.wrap);
}
function renderSummarySettings(host, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.summarySettings"));
  sec.body.appendChild(textNode(t("ui.tabs.profileTab.renderSummarySettings.windowLagAndCompressionSettingsForEach"), "lmb-help"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.autoCreate,
    label: t("ui.tabs.profileTab.renderSummarySettings.runAutomation"),
    onChange: (autoCreate) => patch({ autoCreate })
  }), "tuning.auto"));
  for (const tier of [1, 2, ...HIGHER_TIERS]) {
    const name = TIER_NAMES[tier - 1];
    const card = section(tier === 1 ? t("ui.tabs.profileTab.card.chapterFiling") : t("ui.tabs.profileTab.card.binding", { name }));
    const lag = document.createElement("div");
    lag.className = "lmb-collapsible-body";
    if (tier === 1) {
      lessonMark(card.wrap, "tuning.chapter");
      const window2 = document.createElement("div");
      window2.className = "lmb-collapsible-body";
      lessonMark(window2, "tuning.window");
      window2.append(labelled(t("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({
        value: profile.windowUnit,
        options: [{ value: "messages", label: t("ui.tabs.profileTab.renderSummarySettings.messages") }, { value: "tokens", label: t("ui.tabs.profileTab.renderSummarySettings.messageTokens") }],
        onChange: (v) => patch({ windowUnit: v === "tokens" ? "tokens" : "messages" })
      })), labelled(t("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({
        value: profile.windowValue,
        min: 1,
        max: profile.windowUnit === "tokens" ? 1e6 : 1e5,
        step: profile.windowUnit === "tokens" ? 100 : 1,
        defaultValue: PROFILE_DEFAULTS.windowValue,
        onBlur: (v) => patch({ windowValue: v ?? PROFILE_DEFAULTS.windowValue })
      })));
      card.body.appendChild(window2);
      lag.append(labelled(t("ui.tabs.profileTab.renderSummarySettings.lagUnit"), select({
        value: profile.lagUnit,
        options: [{ value: "messages", label: t("ui.tabs.profileTab.renderSummarySettings.messages") }, { value: "tokens", label: t("ui.tabs.profileTab.renderSummarySettings.messageTokens") }],
        onChange: (v) => patch({ lagUnit: v === "tokens" ? "tokens" : "messages" })
      })), lessonMark(labelled(t("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({
        value: profile.lagValue,
        min: 0,
        max: profile.lagUnit === "tokens" ? 1e6 : 1e5,
        step: profile.lagUnit === "tokens" ? 50 : 1,
        defaultValue: PROFILE_DEFAULTS.lagValue,
        onBlur: (v) => patch({ lagValue: v ?? PROFILE_DEFAULTS.lagValue })
      })), "tuning.lag"));
    } else if (tier === 2) {
      lessonMark(card.wrap, "tuning.arc");
      card.body.append(labelled(t("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({
        value: profile.arcTrigger,
        options: [{ value: "chapters", label: t("ui.tabs.profileTab.renderSummarySettings.chapterEntries") }, { value: "tokens", label: t("ui.tabs.profileTab.renderSummarySettings.summaryTokens") }, { value: "manual", label: t("ui.tabs.profileTab.renderSummarySettings.manualOnly") }],
        onChange: (v) => patch({ arcTrigger: v === "tokens" || v === "manual" ? v : "chapters" })
      })), labelled(t("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({
        value: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
        min: profile.arcTrigger === "tokens" ? 500 : 2,
        max: profile.arcTrigger === "tokens" ? 200000 : 100,
        step: profile.arcTrigger === "tokens" ? 500 : 1,
        disabled: profile.arcTrigger === "manual",
        defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcAfterTokens : PROFILE_DEFAULTS.arcAfterChapters,
        onBlur: (v) => {
          if (v !== null)
            patch(profile.arcTrigger === "tokens" ? { arcAfterTokens: v } : { arcAfterChapters: v });
        }
      })));
      lag.appendChild(labelled(t("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({
        value: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters,
        min: 0,
        max: profile.arcTrigger === "tokens" ? 200000 : 100,
        step: profile.arcTrigger === "tokens" ? 100 : 1,
        disabled: profile.arcTrigger === "manual",
        defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcLagTokens : PROFILE_DEFAULTS.arcLagChapters,
        onBlur: (v) => {
          if (v !== null)
            patch(profile.arcTrigger === "tokens" ? { arcLagTokens: v } : { arcLagChapters: v });
        }
      })));
    } else {
      const config = profile.higherTiers[tier];
      const change = (v) => patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...config, ...v } } });
      card.body.append(labelled(t("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({
        value: config.unit,
        options: [{ value: "entries", label: t("ui.tabs.profileTab.renderSummarySettings.entries", { tierNamesTier2: TIER_NAMES[tier - 2] }) }, { value: "tokens", label: t("ui.tabs.profileTab.renderSummarySettings.summaryTokens") }],
        onChange: (v) => change({ unit: v === "tokens" ? "tokens" : "entries", batch: v === "tokens" ? 8000 : 6, lag: v === "tokens" ? 2000 : 2 })
      })), labelled(t("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({
        value: config.batch,
        min: config.unit === "tokens" ? 100 : 2,
        max: config.unit === "tokens" ? 1e6 : 100,
        step: config.unit === "tokens" ? 100 : 1,
        defaultValue: config.unit === "tokens" ? 8000 : 6,
        onBlur: (v) => change({ batch: v ?? config.batch })
      })));
      lag.appendChild(labelled(t("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({
        value: config.lag,
        min: 0,
        max: config.unit === "tokens" ? 1e6 : 100,
        step: config.unit === "tokens" ? 100 : 1,
        defaultValue: config.unit === "tokens" ? 2000 : 2,
        onBlur: (v) => change({ lag: v ?? config.lag })
      })));
    }
    appendCompressionTarget(card.body, profile, tier, patch);
    const enabled = tier === 1 ? profile.autoCreateChapter : tier === 2 ? profile.autoCreateArc : profile.higherTiers[tier].enabled;
    appendAutomationControls(card.body, lag, enabled, (enabled) => {
      if (tier === 1)
        patch({ autoCreateChapter: enabled });
      else if (tier === 2)
        patch({ autoCreateArc: enabled });
      else
        patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...profile.higherTiers[tier], enabled } } });
    });
    sec.body.appendChild(card.wrap);
  }
  host.appendChild(sec.wrap);
}
function appendAutomationControls(host, lag, enabled, onChange) {
  const controls = [...lag.querySelectorAll("input, select")].map((input) => ({ input, disabled: input.disabled }));
  const update = (enabled) => {
    lag.classList.toggle("lmb-greyed", !enabled);
    for (const { input, disabled } of controls)
      input.disabled = !enabled || disabled;
  };
  update(enabled);
  host.append(checkbox({ checked: enabled, label: t("ui.tabs.profileTab.appendAutomationControls.automate"), onChange: (enabled) => {
    update(enabled);
    onChange(enabled);
  } }), lag);
}
function appendCompressionTarget(host, profile, tier, patch) {
  const prefix = tier === 1 ? "chapter" : tier === 2 ? "arc" : "volume";
  const target = tier <= 3 ? {
    targetUnit: profile[`${prefix}TargetUnit`],
    targetPercent: profile[`${prefix}TargetPercent`],
    targetTokens: profile[`${prefix}TargetTokens`]
  } : profile.higherTiers[tier];
  const change = (v) => {
    if (tier > 3) {
      patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...profile.higherTiers[tier], ...v } } });
    } else {
      patch({
        ...v.targetUnit !== undefined ? { [t("ui.tabs.profileTab.change.targetUnit", { prefix })]: v.targetUnit } : {},
        ...v.targetPercent !== undefined ? { [t("ui.tabs.profileTab.change.targetPercent", { prefix })]: v.targetPercent } : {},
        ...v.targetTokens !== undefined ? { [t("ui.tabs.profileTab.change.targetTokens", { prefix })]: v.targetTokens } : {}
      });
    }
  };
  host.append(labelled(t("ui.tabs.profileTab.appendCompressionTarget.compressionTarget"), select({
    value: target.targetUnit,
    options: [{ value: "percent", label: t("ui.tabs.profileTab.appendCompressionTarget.percentOfInput") }, { value: "tokens", label: t("ui.tabs.profileTab.appendCompressionTarget.fixedTokens") }],
    onChange: (v) => change({ targetUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(target.targetUnit === "tokens" ? t("ui.tabs.profileTab.appendCompressionTarget.targetTokens") : t("ui.tabs.profileTab.appendCompressionTarget.targetPercent"), numberInput({
    value: target.targetUnit === "tokens" ? target.targetTokens : target.targetPercent,
    min: target.targetUnit === "tokens" ? 50 : tier === 1 ? 2 : 5,
    max: target.targetUnit === "tokens" ? 1e6 : tier === 1 ? 90 : 95,
    step: target.targetUnit === "tokens" ? 50 : 1,
    defaultValue: target.targetUnit === "tokens" ? PROFILE_DEFAULTS[`${prefix}TargetTokens`] : PROFILE_DEFAULTS[`${prefix}TargetPercent`],
    onBlur: (v) => {
      if (v !== null)
        change(target.targetUnit === "tokens" ? { targetTokens: v } : { targetPercent: v });
    }
  })));
}
function renderConnection(host, state, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.summaryConnection"));
  lessonMark(sec.wrap, "tuning.model.connection");
  const opts = [
    { value: "", label: state.connections.length ? t("ui.tabs.profileTab.opts.defaultConnection") : t("ui.tabs.profileTab.opts.noConnectionsAvailable") },
    ...state.connections.map((c) => ({
      value: c.id,
      label: t("ui.tabs.profileTab.opts.value", { name: c.name, provider: c.provider, choice: c.model ? "yes" : "no", model: c.model ? c.model : "", choice2: c.isDefault ? "yes" : "no" })
    }))
  ];
  sec.body.appendChild(select({
    value: profile.connectionId ?? "",
    options: opts,
    onChange: (v) => patch({ connectionId: v || null })
  }));
  if (state.resolvedSidecarConnectionId) {
    const resolved = state.connections.find((c) => c.id === state.resolvedSidecarConnectionId);
    if (resolved) {
      const hint = document.createElement("div");
      hint.className = "lmb-field-hint";
      hint.textContent = t("ui.tabs.profileTab.renderConnection.memoriaWritesWith", { name: resolved.name });
      sec.body.appendChild(hint);
    }
  }
  host.appendChild(sec.wrap);
}
function renderSamplers(host, state, profile, send) {
  const sec = section(t("ui.tabs.profileTab.sec.summarySamplers"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.profileTab.renderSamplers.usedWhenMemoriaWritesChaptersArcsAnd");
  sec.body.appendChild(help);
  const saveSampler = (key) => (v) => {
    const patch = { [key]: v };
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, chatId: state.activeChatId });
  };
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(labelled(t("ui.tabs.profileTab.renderSamplers.maxInputTokens"), numberInput({
    value: profile.samplers.max_input_tokens,
    min: 256,
    max: 4000000,
    step: 1024,
    placeholder: String(SAMPLER_DEFAULTS.max_input_tokens),
    onBlur: saveSampler("max_input_tokens")
  })), labelled(t("ui.tabs.profileTab.renderSamplers.maxOutputTokens"), numberInput({
    value: profile.samplers.max_tokens,
    min: 1,
    max: 1e6,
    step: 256,
    placeholder: String(SAMPLER_DEFAULTS.max_tokens),
    onBlur: saveSampler("max_tokens")
  })));
  sec.body.appendChild(grid);
  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(labelled(t("ui.tabs.profileTab.renderSamplers.temperature"), numberInput({
    value: profile.samplers.temperature,
    min: 0,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.temperature),
    onBlur: saveSampler("temperature")
  })), labelled(t("ui.tabs.profileTab.renderSamplers.topP"), numberInput({
    value: profile.samplers.top_p,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: String(SAMPLER_DEFAULTS.top_p),
    onBlur: saveSampler("top_p")
  })), labelled(t("ui.tabs.profileTab.renderSamplers.topK"), numberInput({
    value: profile.samplers.top_k,
    min: 0,
    max: 1000,
    step: 1,
    placeholder: String(SAMPLER_DEFAULTS.top_k),
    onBlur: saveSampler("top_k")
  })), labelled(t("ui.tabs.profileTab.renderSamplers.freqPenalty"), numberInput({
    value: profile.samplers.frequency_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.frequency_penalty),
    onBlur: saveSampler("frequency_penalty")
  })), labelled(t("ui.tabs.profileTab.renderSamplers.presPenalty"), numberInput({
    value: profile.samplers.presence_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.presence_penalty),
    onBlur: saveSampler("presence_penalty")
  })));
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}
var samplerView = "main";
function setSamplerView(v) {
  samplerView = v;
}
function renderSamplersSwitch(host, state, profile, send) {
  const patch = (p) => send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  const wrap = document.createElement("div");
  wrap.className = "lmb-pane";
  const switchRow = document.createElement("div");
  switchRow.className = "lmb-sampler-switch";
  const body = document.createElement("div");
  body.className = "lmb-pane";
  const options = [
    { key: "main", label: t("ui.tabs.profileTab.options.books") },
    { key: "codex", label: t("ui.tabs.profileTab.options.codex") }
  ];
  const sync = () => {
    for (const o of options)
      o.btn?.classList.toggle("active", samplerView === o.key);
    body.replaceChildren();
    if (samplerView === "main") {
      renderConnection(body, state, profile, patch);
      renderSamplers(body, state, profile, send);
    } else {
      renderCodexConnection(body, state, profile, patch);
      renderCodexSamplers(body, state, profile, send);
    }
  };
  for (const o of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = o.label;
    lessonMark(btn, `tuning.samplers.${o.key}`);
    btn.addEventListener("click", () => {
      if (samplerView === o.key)
        return;
      samplerView = o.key;
      sync();
    });
    o.btn = btn;
    switchRow.appendChild(btn);
  }
  wrap.append(switchRow, body);
  host.appendChild(wrap);
  sync();
}
function renderCodexSamplers(host, state, profile, send) {
  const sec = section(t("ui.tabs.profileTab.sec.codexSamplers"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.profileTab.renderCodexSamplers.samplersForTheCodexAgentOnlySeparate");
  sec.body.appendChild(help);
  const saveSampler = (key) => (v) => {
    const patch = { [key]: v };
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, target: "codex", chatId: state.activeChatId });
  };
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(labelled(t("ui.tabs.profileTab.renderCodexSamplers.maxInputTokens"), numberInput({
    value: profile.codexSamplers.max_input_tokens,
    min: 256,
    max: 4000000,
    step: 1024,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.max_input_tokens),
    onBlur: saveSampler("max_input_tokens")
  })), labelled(t("ui.tabs.profileTab.renderCodexSamplers.maxOutputTokens"), numberInput({
    value: profile.codexSamplers.max_tokens,
    min: 1,
    max: 1e6,
    step: 256,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.max_tokens),
    onBlur: saveSampler("max_tokens")
  })));
  sec.body.appendChild(grid);
  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(labelled(t("ui.tabs.profileTab.renderCodexSamplers.temperature"), numberInput({
    value: profile.codexSamplers.temperature,
    min: 0,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.temperature),
    onBlur: saveSampler("temperature")
  })), labelled(t("ui.tabs.profileTab.renderCodexSamplers.topP"), numberInput({
    value: profile.codexSamplers.top_p,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.top_p),
    onBlur: saveSampler("top_p")
  })), labelled(t("ui.tabs.profileTab.renderCodexSamplers.topK"), numberInput({
    value: profile.codexSamplers.top_k,
    min: 0,
    max: 1000,
    step: 1,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.top_k),
    onBlur: saveSampler("top_k")
  })), labelled(t("ui.tabs.profileTab.renderCodexSamplers.freqPenalty"), numberInput({
    value: profile.codexSamplers.frequency_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.frequency_penalty),
    onBlur: saveSampler("frequency_penalty")
  })), labelled(t("ui.tabs.profileTab.renderCodexSamplers.presPenalty"), numberInput({
    value: profile.codexSamplers.presence_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.presence_penalty),
    onBlur: saveSampler("presence_penalty")
  })));
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}
function renderContext(host, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.context"));
  lessonMark(sec.wrap, "tuning.ctx");
  const f = field(t("ui.tabs.profileTab.f.chapterContext"));
  f.body.appendChild(numberInput({
    value: profile.previousMemoriesCount,
    min: 0,
    max: 20,
    defaultValue: PROFILE_DEFAULTS.previousMemoriesCount,
    onBlur: (v) => patch({ previousMemoriesCount: v ?? PROFILE_DEFAULTS.previousMemoriesCount })
  }));
  const hint = document.createElement("div");
  hint.className = "lmb-field-hint";
  hint.textContent = t("ui.tabs.profileTab.renderContext.howManyRecentChaptersToFeedMemoria");
  f.body.appendChild(hint);
  sec.body.appendChild(f.wrap);
  const retry = field(t("ui.tabs.profileTab.retry.retries"));
  retry.body.appendChild(numberInput({
    value: profile.retryCount,
    min: 0,
    max: 10,
    defaultValue: PROFILE_DEFAULTS.retryCount,
    onBlur: (v) => patch({ retryCount: v ?? PROFILE_DEFAULTS.retryCount })
  }));
  const retryHint = document.createElement("div");
  retryHint.className = "lmb-field-hint";
  retryHint.textContent = t("ui.tabs.profileTab.renderContext.triesPerAttemptAfterTheLastTry");
  retry.body.appendChild(retryHint);
  sec.body.appendChild(retry.wrap);
  const ttft = field(t("ui.tabs.profileTab.ttft.firstTokenTimeoutSeconds"));
  ttft.body.appendChild(numberInput({
    value: profile.ttftTimeoutSecs,
    min: 10,
    max: 600,
    step: 5,
    defaultValue: PROFILE_DEFAULTS.ttftTimeoutSecs,
    onBlur: (v) => patch({ ttftTimeoutSecs: v ?? PROFILE_DEFAULTS.ttftTimeoutSecs })
  }));
  const ttftHint = document.createElement("div");
  ttftHint.className = "lmb-field-hint";
  ttftHint.textContent = t("ui.tabs.profileTab.renderContext.howLongMemoriaWaitsForTheFirst");
  ttft.body.appendChild(ttftHint);
  sec.body.appendChild(ttft.wrap);
  host.appendChild(sec.wrap);
}
function renderBehavior(host, profile, patch) {
  const sec = section(t("ui.tabs.profileTab.sec.behavior"));
  sec.body.appendChild(checkbox({
    checked: profile.hideCoveredMessages,
    label: t("ui.tabs.profileTab.renderBehavior.hideMessagesOnceFiled"),
    hint: t("ui.tabs.profileTab.renderBehavior.greysOutCoveredMessagesInTheChat"),
    onChange: (v) => patch({ hideCoveredMessages: v })
  }));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.showMemoryPreviews,
    label: t("ui.tabs.profileTab.renderBehavior.previewBeforeSaving"),
    hint: t("ui.tabs.profileTab.renderBehavior.memoriaStagesNewChaptersAndArcsIn"),
    onChange: (v) => patch({ showMemoryPreviews: v })
  }), "tuning.behavior.preview"));
  host.appendChild(sec.wrap);
}

// src/prompts/fill.ts
function fillPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars) ? String(vars[k]) : m);
}

// src/prompts/books/blank-template.txt
var blank_template_default = `Summarize the following {{NOUN}} into a JSON memory.

Return ONLY valid JSON in this exact shape:
{
  "title": "Short title",
  "content": "Memoria's compressed text. Aim for ~{{target_tokens}} tokens.",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

No commentary outside the JSON.`;

// src/prompts/memoria/persona.txt
var persona_default = "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform. You quietly keep this user's story shelved and organized. When you write a JSON memory, you obey the schema strictly and never break it, but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed.";

// src/prompts/memoria/short-comment-rules.txt
var short_comment_rules_default = 'A single playful nyandere remark in Memoria voice about the scene you just summarized. It must start with a word beginning with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". It must also include another word that starts with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud.';

// src/ui/tabs/prompts-tab.ts
var CATEGORY_SUBTABS = [
  { key: "chapter", label: t("ui.tabs.promptsTab.categorySubtabs.chapter") },
  { key: "arc", label: t("ui.tabs.promptsTab.categorySubtabs.arc") },
  { key: "volume", label: t("ui.tabs.promptsTab.categorySubtabs.volume") },
  { key: "codex", label: t("ui.tabs.promptsTab.categorySubtabs.codex") }
];
var local2 = {
  category: "chapter",
  codexExpanded: new Set,
  codexHowTo: new Set
};
function setPromptsCategory(cat) {
  local2.category = cat;
}
function renderPromptsPane(host, state, ctx, send) {
  const profile = state.activeProfile;
  const setKey = (category, key) => {
    const p = category === "arc" ? { arcPresetKey: key } : category === "volume" ? { volumePresetKey: key } : category === "codex" ? { codexPresetKey: key } : { chapterPresetKey: key };
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  };
  const selectedKeyFor = (c) => c === "arc" ? profile.arcPresetKey : c === "volume" ? profile.volumePresetKey : c === "codex" ? profile.codexPresetKey : profile.chapterPresetKey;
  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  host.appendChild(pane);
  const draw = () => {
    pane.replaceChildren();
    pane.appendChild(makeSubtabs(CATEGORY_SUBTABS, local2.category, (key) => {
      local2.category = key;
      draw();
    }));
    const cat = local2.category;
    if (cat === "codex") {
      renderCategory(pane, state, ctx, send, "codex", selectedKeyFor("codex"), setKey);
      renderCodexTemplates(pane, state, send);
      return;
    }
    renderCategory(pane, state, ctx, send, cat, selectedKeyFor(cat), setKey);
    renderMemoriaOverrides(pane, state, send);
    renderImport(pane, state, ctx, send);
    renderHelp(pane);
  };
  draw();
}
var TEMPLATE_GROUPS = ["File schemas", "Write protocol", "Pass instructions", "Run notes"];
var GROUP_LABELS = {
  "File schemas": t("ui.tabs.promptsTab.groups.fileSchemas"),
  "Write protocol": t("ui.tabs.promptsTab.groups.writeProtocol"),
  "Pass instructions": t("ui.tabs.promptsTab.groups.passInstructions"),
  "Run notes": t("ui.tabs.promptsTab.groups.runNotes")
};
var GROUP_HELP = {
  "File schemas": t("ui.tabs.promptsTab.groupHelp.oneBlockPerCodexFile"),
  "Write protocol": t("ui.tabs.promptsTab.groupHelp.howTheAgentIsToldToDeliver"),
  "Pass instructions": t("ui.tabs.promptsTab.groupHelp.theTaskTextForEachKindOf"),
  "Run notes": t("ui.tabs.promptsTab.groupHelp.warningsPrependedOnlyWhenTheirSituationApplies")
};
function renderCodexTemplates(host, state, send) {
  const profile = state.activeProfile;
  const preset = state.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  const sec = section(t("ui.tabs.promptsTab.sec.codexPromptTemplates"));
  const draw = () => {
    sec.body.replaceChildren();
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = preset ? t("ui.tabs.promptsTab.draw.everyOtherBlockOfTheCodexAgent", { displayName: preset.displayName }) : t("ui.tabs.promptsTab.draw.otherBlocksOfTheCodexAgentS");
    sec.body.appendChild(help);
    const overridden = preset?.templates ? Object.keys(preset.templates).length : 0;
    if (overridden > 0) {
      sec.body.appendChild(textNode(t("ui.tabs.promptsTab.draw.templateCustomizedInThisPreset", { overridden }), "lmb-help"));
    }
    for (const group of TEMPLATE_GROUPS) {
      const defs = CODEX_TEMPLATES.filter((t) => t.group === group);
      if (defs.length === 0)
        continue;
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = GROUP_LABELS[group];
      sec.body.appendChild(sub);
      sec.body.appendChild(textNode(GROUP_HELP[group], "lmb-help"));
      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const def of defs) {
        list.appendChild(renderTemplateRow(def, preset, state, send, draw));
      }
      sec.body.appendChild(list);
    }
  };
  draw();
  host.appendChild(sec.wrap);
}
function renderTemplateRow(def, preset, state, send, redraw) {
  const override = preset?.templates?.[def.key];
  const expanded = local2.codexExpanded.has(def.key);
  const row = document.createElement("li");
  row.className = `lmb-entry compact${expanded ? " expanded" : ""}`;
  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = def.label;
  head.appendChild(title);
  if (override !== undefined)
    head.appendChild(pill(t("ui.tabs.promptsTab.renderTemplateRow.customized"), "warn"));
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.appendChild(chevron);
  head.addEventListener("click", () => {
    if (expanded)
      local2.codexExpanded.delete(def.key);
    else
      local2.codexExpanded.add(def.key);
    redraw();
  });
  row.appendChild(head);
  if (!expanded)
    return row;
  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";
  const howToOpen = local2.codexHowTo.has(def.key);
  const howBtn = makeButton(howToOpen ? t("ui.tabs.promptsTab.howBtn.hideHowTo") : t("ui.tabs.promptsTab.howBtn.howTo"), () => {
    if (howToOpen)
      local2.codexHowTo.delete(def.key);
    else
      local2.codexHowTo.add(def.key);
    redraw();
  }, { small: true });
  detail.appendChild(howBtn);
  if (howToOpen) {
    const how = document.createElement("div");
    how.className = "lmb-help";
    how.textContent = def.howTo;
    detail.appendChild(how);
    for (const v of def.vars) {
      detail.appendChild(textNode(`${v.token} - ${v.meaning}`, "lmb-field-hint"));
    }
    detail.appendChild(textNode(t("ui.tabs.promptsTab.renderTemplateRow.hostMacrosLikeUserAlsoWorkThey"), "lmb-field-hint"));
  }
  if (!preset) {
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = def.defaultText;
    detail.appendChild(view);
    detail.appendChild(textNode(t("ui.tabs.promptsTab.renderTemplateRow.builtInPresetDuplicateItAboveTo"), "lmb-field-hint"));
    row.appendChild(detail);
    return row;
  }
  const area = textArea({
    value: override ?? def.defaultText,
    rows: Math.min(16, Math.max(4, def.defaultText.split(`
`).length + 1))
  });
  const save = () => {
    const templates = { ...preset.templates ?? {} };
    if (!area.value.trim() || area.value === def.defaultText)
      delete templates[def.key];
    else
      templates[def.key] = area.value;
    send({
      type: "save_custom_preset",
      preset: { ...preset, templates },
      chatId: state.activeChatId
    });
  };
  area.addEventListener("input", save);
  detail.appendChild(area);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  let resetArmed = false;
  const resetBtn = makeButton(t("ui.tabs.promptsTab.resetBtn.resetToDefault"), () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = t("ui.tabs.promptsTab.resetBtn.clickAgainToConfirm");
      resetBtn.classList.add("danger");
      setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = t("ui.tabs.promptsTab.resetBtn.resetToDefault");
        resetBtn.classList.remove("danger");
      }, 3000);
      return;
    }
    area.value = def.defaultText;
    save();
    redraw();
  }, { small: true, disabled: override === undefined });
  actions.appendChild(resetBtn);
  detail.appendChild(actions);
  row.appendChild(detail);
  return row;
}
function renderMemoriaOverrides(host, state, send) {
  const sec = section(t("ui.tabs.promptsTab.sec.memoriaOverrides"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.promptsTab.renderMemoriaOverrides.personaIsTheSystemPromptHeaderShort");
  sec.body.appendChild(help);
  const profile = state.activeProfile;
  const chatId = state.activeChatId;
  sec.body.appendChild(buildOverrideBlock({
    label: t("ui.tabs.promptsTab.renderMemoriaOverrides.memoriaPersona"),
    value: profile.memoriaPersonaOverride ?? persona_default,
    defaultText: persona_default,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, memoriaPersonaOverride: next },
      chatId
    })
  }));
  sec.body.appendChild(buildOverrideBlock({
    label: t("ui.tabs.promptsTab.renderMemoriaOverrides.memoriaShortCommentRules"),
    value: profile.shortCommentRulesOverride ?? short_comment_rules_default,
    defaultText: short_comment_rules_default,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, shortCommentRulesOverride: next },
      chatId
    })
  }));
  host.appendChild(sec.wrap);
}
function buildOverrideBlock(opts) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = opts.label;
  wrap.appendChild(lbl);
  const area = document.createElement("textarea");
  area.className = "lmb-input lmb-textarea";
  area.rows = opts.rows;
  area.value = opts.value;
  area.addEventListener("input", () => {
    opts.onSave(area.value);
  });
  wrap.appendChild(area);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "lmb-btn small";
  resetBtn.textContent = t("ui.tabs.promptsTab.buildOverrideBlock.resetToDefault");
  let confirmTimer = null;
  const restoreIdle = () => {
    resetBtn.textContent = t("ui.tabs.promptsTab.restoreIdle.resetToDefault");
    resetBtn.classList.remove("danger");
    confirmTimer = null;
  };
  resetBtn.addEventListener("click", () => {
    if (confirmTimer === null) {
      resetBtn.textContent = t("ui.tabs.promptsTab.buildOverrideBlock.clickAgainToConfirm");
      resetBtn.classList.add("danger");
      confirmTimer = setTimeout(restoreIdle, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    confirmTimer = null;
    restoreIdle();
    area.value = opts.defaultText;
    opts.onSave(null);
  });
  actions.appendChild(resetBtn);
  wrap.appendChild(actions);
  return wrap;
}
function renderCategory(host, state, ctx, send, category, selectedKey, setKey) {
  const isCodex = category === "codex";
  const sec = section(category === "arc" ? t("ui.tabs.promptsTab.sec.arcPrompt") : category === "volume" ? t("ui.tabs.promptsTab.sec.volumePrompt") : isCodex ? t("ui.tabs.promptsTab.sec.codexDirectives") : t("ui.tabs.promptsTab.sec.chapterPrompt"));
  lessonMark(sec.wrap, isCodex ? "tuning.prompts.codex" : "tuning.prompts");
  if (isCodex) {
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = t("ui.tabs.promptsTab.renderCategory.theMissionBlockAtTheTopOf");
    sec.body.appendChild(help);
  }
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : isCodex ? state.codexPresets : state.chapterPresets;
  const customs = state.customPresets.filter((p) => p.category === category);
  const opts = [
    ...builtIns.map((b) => ({ value: b.key, label: t("ui.tabs.promptsTab.opts.builtIn", { displayName: b.displayName }) })),
    ...customs.map((c) => ({ value: c.key, label: t("ui.tabs.promptsTab.opts.custom", { displayName: c.displayName }) }))
  ];
  const pickerRow = document.createElement("div");
  pickerRow.className = "lmb-field-row";
  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(select({
    value: selectedKey,
    options: opts,
    onChange: (v) => setKey(category, v)
  }));
  pickerRow.append(grow);
  sec.body.appendChild(pickerRow);
  const isUserPreset = customs.some((c) => c.key === selectedKey);
  const selectedText = findPresetText(state, category, selectedKey);
  const buttonsRow = document.createElement("div");
  buttonsRow.className = "lmb-actions";
  buttonsRow.append(makeButton(t("ui.tabs.promptsTab.renderCategory.newBlankPrompt"), async () => {
    const name = await promptForString(ctx, t("ui.tabs.promptsTab.name.nameForNewPrompt", { category }), t("ui.tabs.promptsTab.name.untitled"));
    if (!name)
      return;
    const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    send({
      type: "save_custom_preset",
      preset: {
        key,
        displayName: name,
        prompt: blankPromptTemplate(category),
        category,
        createdAt: Date.now()
      },
      chatId: state.activeChatId
    });
    setKey(category, key);
  }, { small: true }), makeButton(isUserPreset ? t("ui.tabs.promptsTab.renderCategory.duplicateToNew") : t("ui.tabs.promptsTab.renderCategory.duplicateToEdit"), async () => {
    const sourceName = customs.find((c) => c.key === selectedKey)?.displayName ?? builtIns.find((b) => b.key === selectedKey)?.displayName ?? t("ui.tabs.promptsTab.sourceName.untitled");
    const name = await promptForString(ctx, t("ui.tabs.promptsTab.name.nameForDuplicate"), `${sourceName} copy`);
    if (!name)
      return;
    const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    send({
      type: "save_custom_preset",
      preset: {
        key,
        displayName: name,
        prompt: selectedText,
        category,
        createdAt: Date.now()
      },
      chatId: state.activeChatId
    });
    setKey(category, key);
  }, { small: true }));
  buttonsRow.append(makeButton(t("ui.tabs.promptsTab.renderCategory.dryRun"), () => {
    if (!state.activeChatId)
      return;
    send(category === "arc" ? { type: "dry_run_arc", chatId: state.activeChatId } : category === "volume" ? { type: "dry_run_volume", chatId: state.activeChatId } : category === "codex" ? { type: "dry_run_codex", chatId: state.activeChatId } : { type: "dry_run_chapter", chatId: state.activeChatId });
  }, {
    small: true,
    disabled: !state.activeChatId || !state.settings.enabled,
    title: isCodex ? t("ui.tabs.promptsTab.renderCategory.assembleTheNextCodexRunSComplete") : t("ui.tabs.promptsTab.renderCategory.assembleThisPresetSPromptWithAll")
  }));
  buttonsRow.append(makeButton(t("ui.tabs.promptsTab.renderCategory.delete"), async () => {
    if (!isUserPreset)
      return;
    const ok = await confirmDelete(ctx, t("ui.tabs.promptsTab.ok.deletePrompt"), t("ui.tabs.promptsTab.ok.thisRemovesTheCustomPromptAndFalls"));
    if (!ok)
      return;
    send({ type: "delete_custom_preset", key: selectedKey, category, chatId: state.activeChatId });
  }, { small: true, danger: true, disabled: !isUserPreset }));
  sec.body.appendChild(buttonsRow);
  if (isUserPreset) {
    const custom = customs.find((c) => c.key === selectedKey);
    const draft = { ...custom };
    const flush = () => send({
      type: "save_custom_preset",
      preset: { ...draft },
      chatId: state.activeChatId
    });
    const nameField = field(t("ui.tabs.promptsTab.nameField.displayName"));
    nameField.body.appendChild(textInput({
      value: draft.displayName,
      onBlur: (v) => {
        draft.displayName = v.slice(0, 80);
        flush();
      }
    }));
    sec.body.appendChild(nameField.wrap);
    const textField = field(t("ui.tabs.promptsTab.textField.prompt"));
    textField.body.appendChild(textArea({
      value: draft.prompt,
      rows: 14,
      onBlur: (v) => {
        draft.prompt = v;
        flush();
      }
    }));
    sec.body.appendChild(textField.wrap);
  } else {
    const lbl = document.createElement("div");
    lbl.className = "lmb-field-label";
    lbl.textContent = t("ui.tabs.promptsTab.renderCategory.promptBuiltInDuplicateToEdit");
    sec.body.appendChild(lbl);
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = selectedText;
    sec.body.appendChild(view);
  }
  host.appendChild(sec.wrap);
}
function blankPromptTemplate(category) {
  if (category === "codex")
    return CODEX_DIRECTIVES_DEFAULT;
  const noun = category === "arc" ? "arc" : category === "volume" ? "volume" : "chapter";
  return fillPrompt(blank_template_default, { NOUN: noun });
}
function findPresetText(state, category, key) {
  const c = state.customPresets.find((p) => p.key === key && p.category === category);
  if (c)
    return c.prompt;
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : category === "codex" ? state.codexPresets : state.chapterPresets;
  const b = builtIns.find((p) => p.key === key);
  return b?.prompt ?? "";
}
function renderImport(host, state, ctx, send) {
  const sec = section(t("ui.tabs.promptsTab.sec.importStmbPresets"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.promptsTab.renderImport.uploadASillyTavernMemoryBooksExportMemoria");
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton(t("ui.tabs.promptsTab.renderImport.importChapterPresets"), () => importFile(ctx, "chapter", send, state.activeChatId)), makeButton(t("ui.tabs.promptsTab.renderImport.importArcPresets"), () => importFile(ctx, "arc", send, state.activeChatId)));
  sec.body.appendChild(row);
  if (state.customPresets.length > 0) {
    const list = document.createElement("ul");
    list.className = "lmb-entry-list";
    for (const p of state.customPresets) {
      const li = document.createElement("li");
      li.className = "lmb-entry";
      const head = document.createElement("div");
      head.className = "lmb-entry-head";
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = t("shared.summaryKindTag", { kind: p.category });
      const title = document.createElement("div");
      title.className = "lmb-entry-title";
      title.textContent = p.displayName;
      head.append(tag, title);
      head.append(makeButton(t("ui.tabs.promptsTab.renderImport.delete"), async () => {
        const ok = await confirmDelete(ctx, t("ui.tabs.promptsTab.ok.deletePreset"), "");
        if (ok)
          send({ type: "delete_custom_preset", key: p.key, category: p.category, chatId: state.activeChatId });
      }, { small: true, danger: true }));
      li.appendChild(head);
      list.appendChild(li);
    }
    sec.body.appendChild(list);
  } else {
    sec.body.appendChild(textNode(t("ui.tabs.promptsTab.renderImport.noCustomPresetsYet"), "lmb-empty"));
  }
  host.appendChild(sec.wrap);
}
function importFile(ctx, category, send, chatId) {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 1e6 }).then((files) => {
    if (!files.length)
      return;
    const file = files[0];
    let text;
    try {
      text = new TextDecoder().decode(file.bytes);
    } catch (err) {
      console.warn("[LumiBooks] preset file decode failed", err);
      showImportFailure(ctx, t("ui.tabs.promptsTab.importFile.memoriaCanTReadThisFile"));
      return;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.warn("[LumiBooks] preset JSON parse failed", err);
      showImportFailure(ctx, t("ui.tabs.promptsTab.importFile.memoriaCouldnTParseThePresetJson"));
      return;
    }
    send({ type: "import_preset", category, raw: parsed, chatId });
  }).catch((err) => {
    console.warn("[LumiBooks] import picker failed", err);
  });
}
function showImportFailure(ctx, message) {
  try {
    ctx.ui.showConfirm({
      title: t("ui.tabs.promptsTab.showImportFailure.importFailed"),
      message,
      variant: "warning",
      confirmLabel: t("ui.tabs.promptsTab.showImportFailure.ok"),
      cancelLabel: t("ui.tabs.promptsTab.showImportFailure.ok")
    });
  } catch {
    window.alert(message);
  }
}
function renderHelp(host) {
  const sec = section(t("ui.tabs.promptsTab.sec.info"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  const lines = [
    t("ui.tabs.promptsTab.lines.duplicateAnyBuiltInOrCreateNew"),
    t("ui.tabs.promptsTab.lines.promptsMustAskTheModelForStrict"),
    t("ui.tabs.promptsTab.lines.targetTokensExpandsToTheActiveCompression"),
    t("ui.tabs.promptsTab.lines.memoriaShortCommentRulesExpandsToThis"),
    t("ui.tabs.promptsTab.lines.promptsAreMacroEvaluated")
  ];
  lines.forEach((line, index) => {
    if (index)
      help.appendChild(document.createElement("br"));
    help.appendChild(document.createTextNode(line));
  });
  sec.body.appendChild(help);
  host.appendChild(sec.wrap);
}

// src/ui/tabs/tuning-tab.ts
var SUBTABS3 = [
  { key: "profile", label: t("ui.tabs.tuningTab.subtabs.connection") },
  { key: "settings", label: t("ui.tabs.tuningTab.subtabs.settings") },
  { key: "prompts", label: t("ui.tabs.tuningTab.subtabs.prompts") }
];
var local3 = { subtab: "profile", settingsView: "books" };
function setTuningSubtab(key) {
  const mapped = key === "model" ? "profile" : key === "codex" ? "settings" : key;
  if (mapped === "profile" || mapped === "settings" || mapped === "prompts")
    local3.subtab = mapped;
  if (key === "codex")
    local3.settingsView = "codex";
}
function setSettingsView(v) {
  local3.settingsView = v;
}
function resetTuningTabLocal() {
  local3.subtab = "profile";
  local3.settingsView = "books";
}
function renderTuningTab(host, state, ctx, send) {
  host.replaceChildren();
  if (local3.subtab !== "profile") {
    const strip = document.createElement("div");
    strip.className = "lmb-profile-strip";
    strip.append(document.createTextNode(t("ui.tabs.tuningTab.renderTuningTab.profile")));
    const name = document.createElement("b");
    name.textContent = state.activeProfile.name;
    strip.appendChild(name);
    if (!state.settings.enabled) {
      strip.appendChild(document.createTextNode(t("ui.tabs.tuningTab.renderTuningTab.extensionOff")));
    }
    strip.title = t("ui.tabs.tuningTab.renderTuningTab.switchOrManageProfilesInTheConnection");
    host.appendChild(strip);
  }
  host.appendChild(makeSubtabs(SUBTABS3, local3.subtab, (key) => {
    local3.subtab = key;
    renderTuningTab(host, state, ctx, send);
    scrollPaneTop(host);
  }));
  const profile = state.activeProfile;
  const patch = (p) => send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  if (!state.settings.enabled && local3.subtab !== "profile") {
    pane.classList.add("lmb-greyed");
    pane.setAttribute("inert", "");
  }
  host.appendChild(pane);
  switch (local3.subtab) {
    case "profile": {
      renderProfilePicker(pane, state, ctx, send);
      const rest = document.createElement("div");
      rest.className = "lmb-pane";
      if (!state.settings.enabled) {
        rest.classList.add("lmb-greyed");
        rest.setAttribute("inert", "");
      }
      pane.appendChild(rest);
      renderSamplersSwitch(rest, state, profile, send);
      break;
    }
    case "settings": {
      const switchRow = document.createElement("div");
      switchRow.className = "lmb-sampler-switch";
      const body = document.createElement("div");
      body.className = "lmb-pane";
      const options = [
        { key: "books", label: t("ui.tabs.tuningTab.options.books") },
        { key: "codex", label: t("ui.tabs.tuningTab.options.codex") }
      ];
      const sync = () => {
        for (const o of options)
          o.btn?.classList.toggle("active", local3.settingsView === o.key);
        body.replaceChildren();
        if (local3.settingsView === "books") {
          renderSummarySettings(body, profile, patch);
          renderContext(body, profile, patch);
          renderBehavior(body, profile, patch);
          renderRegex(body, profile, patch, send);
          renderGlobalSettings(body, state, send);
          renderResetSettings(body, state, send);
        } else if (codexLessonGated(state.lessons)) {
          renderCodexPaneLock(body);
        } else {
          renderCodexSettings(body, state, profile, patch);
        }
      };
      for (const o of options) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = o.label;
        lessonMark(btn, `tuning.settings.${o.key}`);
        btn.addEventListener("click", () => {
          if (local3.settingsView === o.key)
            return;
          local3.settingsView = o.key;
          sync();
        });
        o.btn = btn;
        switchRow.appendChild(btn);
      }
      pane.append(switchRow, body);
      sync();
      break;
    }
    case "prompts":
      renderPromptsPane(pane, state, ctx, send);
      break;
  }
}
function renderGlobalSettings(host, state, send) {
  const sec = section(t("ui.tabs.tuningTab.sec.everywhere"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = t("ui.tabs.tuningTab.renderGlobalSettings.theseApplyToEveryChatAndProfile");
  sec.body.appendChild(help);
  sec.body.appendChild(checkbox({
    checked: state.settings.showAutomationToasts,
    label: t("ui.tabs.tuningTab.renderGlobalSettings.automationToasts"),
    hint: t("ui.tabs.tuningTab.renderGlobalSettings.whenOffMemoriaSBackgroundRunsStay"),
    onChange: (v) => send({ type: "save_settings", patch: { showAutomationToasts: v }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(lessonMark(activationControl(t("ui.tabs.tuningTab.renderGlobalSettings.summaryRecall"), state.settings.summaryActivationMode, (mode) => send({ type: "set_summary_activation", mode, chatId: state.activeChatId })), "tuning.every.constant"));
  const hint = document.createElement("div");
  hint.className = "lmb-field-hint";
  hint.textContent = t("ui.tabs.tuningTab.renderGlobalSettings.appliesToExistingAndFutureChapterAnd");
  sec.body.appendChild(hint);
  if (state.settings.summaryActivationMode === "vector")
    sec.body.appendChild(vectorSetupHint());
  sec.body.appendChild(checkbox({
    checked: state.settings.followChatNames,
    label: t("ui.tabs.tuningTab.renderGlobalSettings.lorebookNamesFollowChatNames"),
    hint: t("ui.tabs.tuningTab.renderGlobalSettings.turnOffToRenameYourBooksAnd"),
    onChange: (followChatNames) => send({ type: "save_settings", patch: { followChatNames }, chatId: state.activeChatId })
  }));
  host.appendChild(sec.wrap);
}

// src/ui/lessons/content-books.ts
var COURSE_BOOKS = {
  key: "books",
  title: t("ui.lessons.contentBooks.courseBooks.theLibrarianSPrimer"),
  sections: [
    {
      id: "s1",
      title: t("ui.lessons.contentBooks.courseBooks.whyMemoriaExists"),
      steps: [
        {
          kind: "say",
          diagram: "rot",
          text: t("ui.lessons.contentBooks.courseBooks.goodMorningWhyDoIExistAs")
        },
        {
          kind: "say",
          diagram: "fold",
          text: t("ui.lessons.contentBooks.courseBooks.beholdMeITakeYourOlderMessages")
        },
        {
          kind: "say",
          diagram: "unfold",
          text: t("ui.lessons.contentBooks.courseBooks.compactedMessagesAreHiddenSoYourLlm")
        },
        {
          kind: "quiz",
          id: "b1",
          scored: true,
          diagram: "fold",
          text: t("ui.lessons.contentBooks.courseBooks.afterICompactMessagesOfRange1"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.bothTheSummaryAndTheOriginalMessages") },
            { text: t("ui.lessons.contentBooks.courseBooks.nothingItSForgotten") },
            { text: t("ui.lessons.contentBooks.courseBooks.theChapterSummariesThereInstead"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.aLorebookEntryInTheWorldInfo") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theSummariesReplaceTheMessagesInPlace")
        }
      ]
    },
    {
      id: "s2",
      title: t("ui.lessons.contentBooks.courseBooks.theFirstFiling"),
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions",
          text: t("ui.lessons.contentBooks.courseBooks.thisIsAPracticeChatIMade")
        },
        {
          kind: "do",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions.file",
          expect: "create_chapter",
          text: t("ui.lessons.contentBooks.courseBooks.thisPracticeStoryHasPlentyOfOld"),
          done: t("ui.lessons.contentBooks.courseBooks.boomTheStoryIsNowMoreCompact"),
          doneAnchor: "home.spine"
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: t("ui.lessons.contentBooks.courseBooks.importantThereSAutomationTooNowYou")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: t("ui.lessons.contentBooks.courseBooks.theSecondSettingIsTheWindowWe")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: t("ui.lessons.contentBooks.courseBooks.theDefaultValuesAreMadeFor200k")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: t("ui.lessons.contentBooks.courseBooks.fileAllFilesChaptersUntilTheLag")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.bookpill",
          text: t("ui.lessons.contentBooks.courseBooks.everythingIFileIsStoredInA")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: t("ui.lessons.contentBooks.courseBooks.normallyYouNeverNeedTheseButtonsWith")
        },
        {
          kind: "quiz",
          id: "b3",
          scored: true,
          tab: "home",
          fixture: { variant: "pills" },
          anchor: "home.pills",
          chip: t("ui.lessons.contentBooks.courseBooks.70OldMessagesLag65Window18"),
          text: t("ui.lessons.contentBooks.courseBooks.thesePillsSayLagReadyButWindow"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.theLagHasNotFilledUpYet") },
            { text: t("ui.lessons.contentBooks.courseBooks.theChatHasNoLorebookYet") },
            { text: t("ui.lessons.contentBooks.courseBooks.70MessagesMinusThe65ProtectedBy"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.aChapterCanOnlyBeFiledAfter") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theWindowOnlyCountsMessagesOlderThan")
        }
      ]
    },
    {
      id: "s3",
      title: t("ui.lessons.contentBooks.courseBooks.theDesk"),
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: t("ui.lessons.contentBooks.courseBooks.thisColoredBarIsTheSpineA")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: t("ui.lessons.contentBooks.courseBooks.clickAnyColoredBlockAndILl")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.breakdown",
          text: t("ui.lessons.contentBooks.courseBooks.theListUnderItShowsTheSame")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: t("ui.lessons.contentBooks.courseBooks.theseTilesAreTheQuickSummaryFiled")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.prompt",
          text: t("ui.lessons.contentBooks.courseBooks.thePromptPanelShowsThePromptBreakdown")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.busy",
          text: t("ui.lessons.contentBooks.courseBooks.iWroteTooMuchThePreviousStep")
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.failure",
          text: t("ui.lessons.contentBooks.courseBooks.ifIFailEvenAfterRetryingThis")
        },
        {
          kind: "quiz",
          id: "b6",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          chip: t("ui.lessons.contentBooks.courseBooks.arc154Msgs08kTokens"),
          text: t("ui.lessons.contentBooks.courseBooks.lookAtTheSpineTheArcBlock"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.witnessThePowerOfLumibooks"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.newerStoryIsAlwaysDrawnBigger") },
            { text: t("ui.lessons.contentBooks.courseBooks.theArcLostMostOfItsMessages") },
            { text: t("ui.lessons.contentBooks.courseBooks.theBarShowsTimePassingNotSize") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theSpineIsACostMapThin")
        },
        {
          kind: "quiz",
          id: "r1",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: t("ui.lessons.contentBooks.courseBooks.compressionIsRunningYetYourPromptIs"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.theTailRecentMessagesAreUncompressedUntil"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.theFiledTileFilingGrowsThePrompt") },
            { text: t("ui.lessons.contentBooks.courseBooks.theShelfTileTooManyChapters") },
            { text: t("ui.lessons.contentBooks.courseBooks.theCodexTileEvenThoughYouDon") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theUncompressedTailIsUsuallyTheFat")
        }
      ]
    },
    {
      id: "s4",
      title: t("ui.lessons.contentBooks.courseBooks.theShelf"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["tab.books"],
          arrive: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.everythingIFileEndsUpOnMy"),
          done: t("ui.lessons.contentBooks.courseBooks.myShelf")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.witnessMyShelfEverythingIVeFiled")
        },
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["books.entry.c4"],
          arrive: "books.entry.actions",
          text: t("ui.lessons.contentBooks.courseBooks.entriesOpenWithAClickTapThe"),
          done: t("ui.lessons.contentBooks.courseBooks.thereSTheWholeRecord")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: t("ui.lessons.contentBooks.courseBooks.youLlSeeItsSizeBeforeAnd")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.fadedEntriesMeansAnArcOrVolume")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.importantTheGhostTagMarksAChapter")
        },
        {
          kind: "quiz",
          id: "b8",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.youDeleteAnArcThatWasMade"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.the3ChaptersUnhideAndInjectAgain"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.theChaptersAndAllTheirMessagesReturn") },
            { text: t("ui.lessons.contentBooks.courseBooks.the3ChaptersAreDeletedAlongWith") },
            { text: t("ui.lessons.contentBooks.courseBooks.prolixTakesAShit") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.deletingATierHandsTheJobBack")
        },
        {
          kind: "quiz",
          id: "r2",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: t("ui.lessons.contentBooks.courseBooks.halfTheChaptersHereAreFadedAnd"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.noAnArcReplacedThemTheyStay"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.yesTheyFailedToSave") },
            { text: t("ui.lessons.contentBooks.courseBooks.yesTheirMessagesWereDeleted") },
            { text: t("ui.lessons.contentBooks.courseBooks.theyWereAccidentallyExcluded") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.supersededIsNormalHousekeepingAfterAnArc")
        },
        {
          kind: "quiz",
          id: "b10",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: t("ui.lessons.contentBooks.courseBooks.whichOfTheseButtonsActuallyCallsThe"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.regenerate"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.delete") },
            { text: t("ui.lessons.contentBooks.courseBooks.release") },
            { text: t("ui.lessons.contentBooks.courseBooks.exclude") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.value")
        }
      ]
    },
    {
      id: "s5",
      title: t("ui.lessons.contentBooks.courseBooks.composeManualControl"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "compose" },
          path: ["subtab.compose"],
          arrive: "books.compose.list",
          text: t("ui.lessons.contentBooks.courseBooks.anywayManualControlsNext"),
          done: t("ui.lessons.contentBooks.courseBooks.ready")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.list",
          text: t("ui.lessons.contentBooks.courseBooks.theComposeTabIsManualModeFilter")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.compress",
          text: t("ui.lessons.contentBooks.courseBooks.compressFilesWhatYouSelectedIntoA")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: t("ui.lessons.contentBooks.courseBooks.excludeProtectsMessagesFromMeCompletelyPerfect")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.arcs",
          text: t("ui.lessons.contentBooks.courseBooks.furtherDownYouCanPickChaptersTo")
        },
        {
          kind: "quiz",
          id: "b13",
          scored: true,
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: t("ui.lessons.contentBooks.courseBooks.whenIsExcludeTheRightToolInstead"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.whenAMessageMustStayInThe"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.whenYouWantAMessageGoneFrom") },
            { text: t("ui.lessons.contentBooks.courseBooks.whenAChapterCameOutBadly") },
            { text: t("ui.lessons.contentBooks.courseBooks.whenYouWishToDeceiveYourEnemy") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.excludeKeepsTheMessageFromCompressionDelete")
        }
      ]
    },
    {
      id: "s6",
      title: t("ui.lessons.contentBooks.courseBooks.continuityAndRepair"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "continuity" },
          path: ["subtab.continuity"],
          arrive: "books.cont.root",
          text: t("ui.lessons.contentBooks.courseBooks.oneMoreIPromiseTapAdvanced"),
          done: t("ui.lessons.contentBooks.courseBooks.theContinuityDesk")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: t("ui.lessons.contentBooks.courseBooks.continuityLetsANewChatInheritAn")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: t("ui.lessons.contentBooks.courseBooks.rebuildFromDeletesThisChatSOwn")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: t("ui.lessons.contentBooks.courseBooks.maintenanceFixesThingsWhenTheShelfAnd")
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: t("ui.lessons.contentBooks.courseBooks.someRepairsIHandleMyselfDeleteOne")
        },
        {
          kind: "quiz",
          id: "b14",
          scored: true,
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: t("ui.lessons.contentBooks.courseBooks.youStartASequelChatItsShelf"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.rebaseDuh"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.rebuildItIsAlwaysTheSaferOption") },
            { text: t("ui.lessons.contentBooks.courseBooks.neitherCopyTheEntriesOverByHand") },
            { text: t("ui.lessons.contentBooks.courseBooks.detachFirstThenRebuild") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.rebaseIsForFreshChatsRebuildIs")
        }
      ]
    },
    {
      id: "s7",
      title: t("ui.lessons.contentBooks.courseBooks.tuningThePress"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          path: ["tab.tuning"],
          arrive: "tuning.profile.select",
          text: t("ui.lessons.contentBooks.courseBooks.okThisIsActuallyTheLastPart"),
          done: t("ui.lessons.contentBooks.courseBooks.myDials")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          anchor: "tuning.profile.select",
          text: t("ui.lessons.contentBooks.courseBooks.everythingIDoIsControlledByA")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("profile");
            setSamplerView("main");
          },
          anchor: "tuning.model.connection",
          text: t("ui.lessons.contentBooks.courseBooks.rightBelowSitsMyWritingDeskWhich")
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setSettingsView("books"),
          path: ["subtab.settings"],
          arrive: "tuning.window",
          text: t("ui.lessons.contentBooks.courseBooks.nextRoomTapSettings"),
          done: t("ui.lessons.contentBooks.courseBooks.thePressRoom")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          text: t("ui.lessons.contentBooks.courseBooks.thisIsThatWindowThingITold")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.arc",
          text: t("ui.lessons.contentBooks.courseBooks.arcsCanBuildAutomaticallyAfterEnoughChapters")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          text: t("ui.lessons.contentBooks.courseBooks.andThisIsTheAutomationSettingI")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.ctx",
          text: t("ui.lessons.contentBooks.courseBooks.contextIsJustHowManyPreviousChapters")
        },
        {
          kind: "quiz",
          id: "b4",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowUnit = "tokens";
              s.activeProfile.windowValue = 18;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          chip: t("ui.lessons.contentBooks.courseBooks.windowTokens18"),
          text: t("ui.lessons.contentBooks.courseBooks.youSwitchTheWindowUnitFromMessages"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.chaptersOfAbout18MessagesSameAs") },
            { text: t("ui.lessons.contentBooks.courseBooks.idk") },
            { text: t("ui.lessons.contentBooks.courseBooks.youAskedMeToConvert18Messages") },
            { text: t("ui.lessons.contentBooks.courseBooks.chaptersWillAutomaticallyFileAfterOnly18"), correct: true }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theUnitChangesWhatTheNumberMeans")
        },
        {
          kind: "quiz",
          id: "b5",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.lagValue = 10;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.lag",
          chip: t("ui.lessons.contentBooks.courseBooks.lag10Messages"),
          text: t("ui.lessons.contentBooks.courseBooks.youLowerTheLagFrom65Down"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.iStartSummarizingMuchCloserToThe"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.chaptersGetBigger") },
            { text: t("ui.lessons.contentBooks.courseBooks.nothingUntilTheWindowAlsoChanges") },
            { text: t("ui.lessons.contentBooks.courseBooks.iGoBackAndReSummarizeOld") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.aSmallLagSavesMoreSpaceBut")
        },
        {
          kind: "quiz",
          id: "b16",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowValue = 40;
              s.activeProfile.chapterTargetPercent = 4;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.chapter",
          chip: t("ui.lessons.contentBooks.courseBooks.window40TargetPercent4"),
          text: t("ui.lessons.contentBooks.courseBooks.youSetTheWindowTo40And"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.chaptersBecomeSmallerAndTheyCover40"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.chaptersBecomeSmallerAndMoreFrequent") },
            { text: t("ui.lessons.contentBooks.courseBooks.theSameTheRatioOnlyAffectsArcs") },
            { text: t("ui.lessons.contentBooks.courseBooks.unchangedUntilTheLagChangesToo") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.theWindowIsWhatGoesInThe")
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setPromptsCategory("chapter"),
          path: ["subtab.prompts"],
          arrive: "tuning.prompts",
          text: t("ui.lessons.contentBooks.courseBooks.andTheLastPartOfTheSettings"),
          done: t("ui.lessons.contentBooks.courseBooks.myInstructions")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "prompts",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("prompts");
            setPromptsCategory("chapter");
          },
          anchor: "tuning.prompts",
          text: t("ui.lessons.contentBooks.courseBooks.thePromptsPaneHoldsMyInstructionsFour")
        },
        {
          kind: "quiz",
          id: "b20",
          scored: true,
          exhibit: t("ui.lessons.contentBooks.courseBooks.memoriaCouldnTFileTheChapterThe"),
          exhibitTone: "error",
          text: t("ui.lessons.contentBooks.courseBooks.everyOneOfMyChaptersFailsLike"),
          options: [
            { text: t("ui.lessons.contentBooks.courseBooks.giveMeAStrongerModelOrA"), correct: true },
            { text: t("ui.lessons.contentBooks.courseBooks.raiseTheLag") },
            { text: t("ui.lessons.contentBooks.courseBooks.turnOffMessageHiding") },
            { text: t("ui.lessons.contentBooks.courseBooks.lowerTheRetryCount") }
          ],
          why: t("ui.lessons.contentBooks.courseBooks.retriesCannotFixAModelThatKeeps")
        }
      ]
    },
    {
      id: "finale",
      title: t("ui.lessons.contentBooks.courseBooks.finalFuckingLee"),
      steps: [
        {
          kind: "say",
          real: true,
          tab: "home",
          text: t("ui.lessons.contentBooks.courseBooks.practiceIsOverThisIsYourReal")
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.file",
          expect: "create_chapter",
          optional: true,
          text: t("ui.lessons.contentBooks.courseBooks.ifYourChatAlreadyHasEnoughStory"),
          done: t("ui.lessons.contentBooks.courseBooks.aRealChapterFiledByYourOwn"),
          doneAnchor: "home.spine"
        },
        {
          kind: "nav",
          real: true,
          onlyFreshInstall: true,
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings"],
          arrive: "tuning.auto",
          text: t("ui.lessons.contentBooks.courseBooks.myAutomationSwitchLivesInTuningTap"),
          done: t("ui.lessons.contentBooks.courseBooks.thereSTheSwitch")
        },
        {
          kind: "do",
          real: true,
          optional: true,
          onlyFreshInstall: true,
          tab: "tuning",
          subtab: "settings",
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          expect: "save_profile",
          text: t("ui.lessons.contentBooks.courseBooks.turnRunAutomationOnAndILl"),
          done: t("ui.lessons.contentBooks.courseBooks.automationIsOnILlTakeIt")
        },
        {
          kind: "say",
          text: t("ui.lessons.contentBooks.courseBooks.wellDoneMousepadHasLetMeKnow")
        }
      ]
    }
  ]
};

// src/ui/lessons/content-codex.ts
var COURSE_CODEX = {
  key: "codex",
  title: t("ui.lessons.contentCodex.courseCodex.theArchivistSCodex"),
  sections: [
    {
      id: "s1",
      title: t("ui.lessons.contentCodex.courseCodex.whyAStoryBible"),
      steps: [
        {
          kind: "say",
          diagram: "fade",
          text: t("ui.lessons.contentCodex.courseCodex.summaryChaptersAreAGoodOutlineBut")
        },
        {
          kind: "nav",
          tab: "home",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["tab.codex"],
          arrive: "codex.tiles",
          text: t("ui.lessons.contentCodex.courseCodex.beholdTheKnowledgeCodexLetSWalk"),
          done: t("ui.lessons.contentCodex.courseCodex.thereItIs")
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: t("ui.lessons.contentCodex.courseCodex.eightRecordsMakeTheCodexCharactersLocations")
        },
        {
          kind: "quiz",
          id: "c1",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: t("ui.lessons.contentCodex.courseCodex.yourCharacterCardSaysEliasHasA"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.noTheCodexOnlyRecordsWhatThe"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.yesTheCodexShouldCopyEverythingFrom") },
            { text: t("ui.lessons.contentCodex.courseCodex.theCardHasToBeImportedInto") },
            { text: t("ui.lessons.contentCodex.courseCodex.theCodexOnlyTracksCharactersYouAdd") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.iReadYourLoreAsReferenceFor")
        }
      ]
    },
    {
      id: "s2",
      title: t("ui.lessons.contentCodex.courseCodex.readingTheCodex"),
      steps: [
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.status",
          text: t("ui.lessons.contentCodex.courseCodex.theLineUpTopIsMyLedger")
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.actions",
          text: t("ui.lessons.contentCodex.courseCodex.theseAreTheEverydayActionsUpdateNow")
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          expect: "codex_set_file_state",
          text: t("ui.lessons.contentCodex.courseCodex.everyTileIsOneRecordItsCount"),
          done: t("ui.lessons.contentCodex.courseCodex.dashedMeansNotInjectedButStillUpdated")
        },
        {
          kind: "quiz",
          id: "c4",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex-stale" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          text: t("ui.lessons.contentCodex.courseCodex.youFrozeRelations40MessagesAgoAnd"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.itSMarkedAsNeedingACatch"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.theGapFillsInAutomaticallyOnThe") },
            { text: t("ui.lessons.contentCodex.courseCodex.nothingCanRecoverTheMissedEventsExcept") },
            { text: t("ui.lessons.contentCodex.courseCodex.tidyItTidyingReReadsTheMissed") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.myReadingPositionIsAlreadyPastThose")
        },
        {
          kind: "quiz",
          id: "c5",
          scored: true,
          tab: "codex",
          subtab: "manage",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("manage"),
          anchor: "codex.manage.startover",
          text: t("ui.lessons.contentCodex.courseCodex.rebuildCodexAndWipeCodexBothErase"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.wipeHelpsLumiAgentWipeHerAss") },
            { text: t("ui.lessons.contentCodex.courseCodex.rebuildKeepsYourEntriesAndOnlyRewrites") },
            { text: t("ui.lessons.contentCodex.courseCodex.wipeAlsoDeletesYourChaptersAndArcs") },
            { text: t("ui.lessons.contentCodex.courseCodex.rebuildKeepsYourTileSettingsAndRemakes"), correct: true }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.bothEraseTheRecordsAndMyReading")
        }
      ]
    },
    {
      id: "s3",
      title: t("ui.lessons.contentCodex.courseCodex.theRecordsHandsOn"),
      steps: [
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["subtab.entities"],
          arrive: "codex.entities",
          text: t("ui.lessons.contentCodex.courseCodex.tapEntitiesAndBehold"),
          done: t("ui.lessons.contentCodex.courseCodex.thePeoplePlacesAndThings")
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities",
          text: t("ui.lessons.contentCodex.courseCodex.everyChipIsAnEntityClickOne")
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities.add",
          path: ["codex.entities.add", "codex.entities.addform", "codex.entities.editor"],
          expect: "codex_write_file",
          text: t("ui.lessons.contentCodex.courseCodex.iAddAndUpdateAllOfThese"),
          done: t("ui.lessons.contentCodex.courseCodex.savedYourEditsAreCanonNowI"),
          doneAnchor: "codex.entities.card"
        },
        {
          kind: "quiz",
          id: "c2",
          scored: true,
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("entities");
            setCodexExpandedEntity(t("ui.lessons.contentCodex.courseCodex.charElias"));
          },
          anchor: "codex.entities",
          text: t("ui.lessons.contentCodex.courseCodex.theStoryHasMovedOnEliasIsn"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.theAgentHasnTReadThatFar"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.theCodexIsBrokenDeleteTheExtension") },
            { text: t("ui.lessons.contentCodex.courseCodex.sheetsNeverChangeOnceWritten") },
            { text: t("ui.lessons.contentCodex.courseCodex.youHaveToDeleteEliasAndRe") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.theCodexUpdatesOnAScheduleSo")
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("entities");
            setCodexExpandedEntity(t("ui.lessons.contentCodex.courseCodex.charCaptain"));
          },
          anchor: "codex.entities.lock",
          hintAnchor: "codex.entities.statepill",
          expect: "codex_write_file",
          text: t("ui.lessons.contentCodex.courseCodex.considerTheCaptainLetSSayThat"),
          done: t("ui.lessons.contentCodex.courseCodex.greatHeIsNoLongerUpdatedOr")
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexRelationsView("list"),
          path: ["subtab.relations"],
          arrive: "codex.rel.view",
          text: t("ui.lessons.contentCodex.courseCodex.letSExploreTheWorldWideWeb"),
          done: t("ui.lessons.contentCodex.courseCodex.thisIsTheListView")
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.add",
          path: ["codex.rel.add", "codex.rel.form"],
          expect: "codex_write_file",
          text: t("ui.lessons.contentCodex.courseCodex.iCreateTheseAndKeepTheseUpdated"),
          done: t("ui.lessons.contentCodex.courseCodex.recorded"),
          doneAnchor: "codex.rel.view"
        },
        {
          kind: "quiz",
          id: "c7",
          scored: true,
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.view",
          text: t("ui.lessons.contentCodex.courseCodex.youJustAddedARelationByHand"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.noYourEditsBecomePartOfThe"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.yesTheAgentRewritesEverythingFromScratch") },
            { text: t("ui.lessons.contentCodex.courseCodex.yesUnlessYouFreezeTheRelationsTile") },
            { text: t("ui.lessons.contentCodex.courseCodex.handEditsOnlySurviveWhileTheRelations") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.theAgentAlwaysStartsFromTheCurrent")
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          path: ["codex.rel.graphbtn"],
          arrive: "codex.rel.graph",
          text: t("ui.lessons.contentCodex.courseCodex.tapGraph"),
          done: t("ui.lessons.contentCodex.courseCodex.thereSYourWebARealStory")
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("graph");
          },
          anchor: "codex.rel.graph",
          text: t("ui.lessons.contentCodex.courseCodex.thisIsTheWebForThisSmall")
        }
      ]
    },
    {
      id: "s4",
      title: t("ui.lessons.contentCodex.courseCodex.theAgentAndItsDials"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "codex" },
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: t("ui.lessons.contentCodex.courseCodex.lastStopMyRulesOpenTheTuning"),
          done: t("ui.lessons.contentCodex.courseCodex.myDials")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          text: t("ui.lessons.contentCodex.courseCodex.myCodexSettingsLiveHereByDefault")
        },
        {
          kind: "quiz",
          id: "c10",
          scored: true,
          tab: "tuning",
          subtab: "codex",
          fixture: {
            variant: "codex",
            patch: (s) => {
              s.activeProfile.codexLagValue = 65;
            }
          },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          chip: t("ui.lessons.contentCodex.courseCodex.codexLag65"),
          text: t("ui.lessons.contentCodex.courseCodex.youRaiseTheCodexLagFrom6"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.theBibleAlwaysRuns65MessagesBehind"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.nothingTheLagOnlyAffectsChapters") },
            { text: t("ui.lessons.contentCodex.courseCodex.theCodexGetsCheaperWithNoDownside") },
            { text: t("ui.lessons.contentCodex.courseCodex.theAgentRunsMoreOften") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.chaptersActAsReplacementsOfOldMessages")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.relations",
          text: t("ui.lessons.contentCodex.courseCodex.twoMoreThingsRelationsTableOffMoves")
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          text: t("ui.lessons.contentCodex.courseCodex.oneMoreThingEditAnyRecordWhenever")
        },
        {
          kind: "quiz",
          id: "c14",
          scored: true,
          exhibit: t("ui.lessons.contentCodex.courseCodex.memoriaCouldnTUpdateTheCodexThe"),
          exhibitTone: "error",
          text: t("ui.lessons.contentCodex.courseCodex.everyCodexRunFailsWithThisWhat"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.theCodexModelCannotMakeToolCalls"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.theChatIsTooLong") },
            { text: t("ui.lessons.contentCodex.courseCodex.aCodexFileIsCorrupted") },
            { text: t("ui.lessons.contentCodex.courseCodex.theRelationsTableIsOff") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.withUseToolCallsOnTheAgent")
        },
        {
          kind: "quiz",
          id: "c13",
          scored: true,
          text: t("ui.lessons.contentCodex.courseCodex.withExtraContextModeOnAChapter"),
          options: [
            { text: t("ui.lessons.contentCodex.courseCodex.noItSAChapterWrittenEarly"), correct: true },
            { text: t("ui.lessons.contentCodex.courseCodex.pleaseReadThisOneCarefullyOrMousepad") },
            { text: t("ui.lessons.contentCodex.courseCodex.yesItSCorruptedDeleteItAnd") },
            { text: t("ui.lessons.contentCodex.courseCodex.itSADraftWaitingForYour") }
          ],
          why: t("ui.lessons.contentCodex.courseCodex.ghostsGiveTheCodexContextEarlyAnd")
        }
      ]
    },
    {
      id: "finale",
      title: t("ui.lessons.contentCodex.courseCodex.openingCeremony"),
      steps: [
        {
          kind: "nav",
          real: true,
          optional: true,
          tab: "home",
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: t("ui.lessons.contentCodex.courseCodex.practiceIsOverThisIsYourReal"),
          done: t("ui.lessons.contentCodex.courseCodex.alreadyThereGood")
        },
        {
          kind: "do",
          real: true,
          optional: true,
          tab: "tuning",
          subtab: "codex",
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.enabled",
          expect: "save_profile",
          text: t("ui.lessons.contentCodex.courseCodex.flipEnableCodexOnTheDefaultSettings"),
          done: t("ui.lessons.contentCodex.courseCodex.enabledFromNowOnIKeepYour")
        },
        {
          kind: "nav",
          real: true,
          optional: true,
          path: ["tab.home"],
          arrive: "home.actions.updatecodex",
          text: t("ui.lessons.contentCodex.courseCodex.homeHasAnUpdateCodexButtonNow"),
          done: t("ui.lessons.contentCodex.courseCodex.thereItIs")
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.updatecodex",
          expect: "codex_update_now",
          optional: true,
          text: t("ui.lessons.contentCodex.courseCodex.pressItAndILlReadThis"),
          done: t("ui.lessons.contentCodex.courseCodex.readingWatchTheBusyRowOnHome")
        },
        {
          kind: "say",
          text: t("ui.lessons.contentCodex.courseCodex.thatSAllGoForthAndMake")
        }
      ]
    }
  ]
};

// src/ui/lessons/lesson-types.ts
function scoredQuestions(course) {
  const out = [];
  for (const s of course.sections) {
    for (const st of s.steps) {
      if (st.kind === "quiz" && st.scored)
        out.push(st);
    }
  }
  return out;
}
function allQuestionIds(course, sectionIdx) {
  const sections = sectionIdx === undefined ? course.sections : [course.sections[sectionIdx]].filter(Boolean);
  const out = [];
  for (const s of sections) {
    for (const st of s.steps) {
      if (st.kind === "quiz")
        out.push(st.id);
    }
  }
  return out;
}

// src/ui/tabs/about-tab.ts
function renderAboutTab(host, state, send) {
  host.replaceChildren();
  const hero = section(t("ui.tabs.aboutTab.hero.memoria"));
  const card = document.createElement("div");
  card.className = "lmb-about-hero";
  card.appendChild(memoriaSprite(64));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-hero-title";
  title.textContent = t("ui.tabs.aboutTab.renderAboutTab.memoriaTheLumiBooksLibrarian");
  const tag = document.createElement("div");
  tag.className = "lmb-about-line";
  tag.textContent = t("ui.tabs.aboutTab.renderAboutTab.nyandereCatgirlInAMaidUniformBlack");
  right.append(title, tag);
  card.append(right);
  hero.body.appendChild(card);
  host.appendChild(hero.wrap);
  if (state) {
    renderDiagnostics(host, state, send);
    renderAcademy(host, state, send);
  }
  const ack = section(t("ui.tabs.aboutTab.ack.acknowledgements"));
  const a = document.createElement("div");
  a.className = "lmb-about-line";
  a.textContent = t("ui.tabs.aboutTab.renderAboutTab.builtOnLumiverseSpindleWithPromptsAnd");
  ack.body.appendChild(a);
  host.appendChild(ack.wrap);
}
var GRADE_CLASS = {
  gilded: "lmb-grade-gilded",
  silver: "lmb-grade-silver",
  bronze: "lmb-grade-bronze",
  apprentice: "lmb-grade-apprentice"
};
function renderAcademy(host, state, send) {
  const sec = section(t("ui.tabs.aboutTab.sec.memoriaSAcademy"));
  sec.body.appendChild(textNode(t("ui.tabs.aboutTab.renderAcademy.bothCoursesLiveHereForRetakesPer"), "lmb-help"));
  sec.body.appendChild(courseCard("books", COURSE_BOOKS, state, send));
  sec.body.appendChild(courseCard("codex", COURSE_CODEX, state, send));
  host.appendChild(sec.wrap);
}
function courseCard(key, course, state, send) {
  const cs = state.lessons[key];
  const card = document.createElement("div");
  card.className = "lmb-academy-course";
  const head = document.createElement("div");
  head.className = "lmb-academy-head";
  const title = document.createElement("span");
  title.className = "lmb-academy-title";
  title.textContent = course.title;
  head.appendChild(title);
  if (cs.status === "done" && cs.grade) {
    const grade = document.createElement("span");
    grade.className = `lmb-academy-grade ${GRADE_CLASS[cs.grade] ?? ""}`;
    grade.textContent = LESSON_GRADE_LABEL[cs.grade];
    head.appendChild(grade);
  }
  card.appendChild(head);
  const sub = document.createElement("div");
  sub.className = "lmb-help";
  sub.textContent = cs.status === "done" ? t("ui.tabs.aboutTab.courseCard.completedAttempt", { choice: cs.signedName ? "yes" : "no", signedName: cs.signedName ? cs.signedName : "", attempts: cs.attempts }) : cs.status === "in_progress" ? t("ui.tabs.aboutTab.courseCard.inProgressSection", { section1: cs.section + 1 }) : key === "codex" ? t("ui.tabs.aboutTab.courseCard.lockedBehindNothingButYourTimeThis") : t("ui.tabs.aboutTab.courseCard.theMandatoryPrimer");
  card.appendChild(sub);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  if (cs.status === "done") {
    actions.append(makeButton(t("ui.tabs.aboutTab.courseCard.viewDiploma"), () => requestLesson({ course: key, mode: "diploma" }), { small: true }), makeButton(t("ui.tabs.aboutTab.courseCard.retakeCourse"), () => {
      send({ type: "lesson_reset", course: key, mode: "course", chatId: state.activeChatId });
      requestLesson({ course: key, mode: "lesson", section: 0, fresh: true });
    }, {
      small: true,
      title: t("ui.tabs.aboutTab.courseCard.leaveAnytimeTheCourseStaysCompletedOn")
    }));
  } else {
    actions.append(makeButton(cs.status === "in_progress" ? t("ui.tabs.aboutTab.courseCard.resume") : t("ui.tabs.aboutTab.courseCard.start"), () => requestLesson({ course: key, mode: "lesson" }), {
      small: true,
      primary: true
    }));
    if (key === "books") {
      actions.append(makeButton(t("ui.tabs.aboutTab.courseCard.sitTheExam"), () => requestLesson({ course: key, mode: "exam" }), { small: true }));
    }
  }
  card.appendChild(actions);
  if (cs.status === "done") {
    const sections = document.createElement("div");
    sections.className = "lmb-academy-sections";
    course.sections.forEach((s, i) => {
      if (s.id === "finale")
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-academy-section";
      const ids = allQuestionIds(course, i);
      const missed = ids.some((id) => cs.answers[id] !== "gold");
      btn.textContent = t("ui.tabs.aboutTab.courseCard.value", { i1: i + 1, title: s.title, choice: missed ? "yes" : "no" });
      btn.title = missed ? t("ui.tabs.aboutTab.courseCard.hasSilverOrSkippedStampsRetakeTo") : t("ui.tabs.aboutTab.courseCard.allGold");
      btn.addEventListener("click", () => {
        send({ type: "lesson_reset", course: key, mode: "section", section: i, answerIds: ids, chatId: state.activeChatId });
        requestLesson({ course: key, mode: "lesson", section: i });
      });
      sections.appendChild(btn);
    });
    card.appendChild(sections);
  }
  return card;
}
function renderDiagnostics(host, state, send) {
  const sec = section(t("ui.tabs.aboutTab.sec.privateDiagnostics"));
  sec.body.appendChild(checkbox({
    checked: state.settings.localLogsDisabled,
    label: t("ui.tabs.aboutTab.renderDiagnostics.turnOffLocalLogsThisIsNot"),
    onChange: (localLogsDisabled) => send({ type: "save_settings", chatId: state.activeChatId, patch: { localLogsDisabled } })
  }));
  sec.body.appendChild(textNode(t("ui.tabs.aboutTab.renderDiagnostics.tracksUiFailuresNavigationRequestsFilingCoverage"), "lmb-help"));
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const chatId = state.activeChatId;
  actions.append(makeButton(t("ui.tabs.aboutTab.renderDiagnostics.exportDiagnostics"), () => send({ type: "diagnostics_export", chatId })), makeButton(t("ui.tabs.aboutTab.renderDiagnostics.clearDiagnostics"), () => send({ type: "diagnostics_clear", chatId })));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}

// src/prompts/books/target-directive.txt
var target_directive_default = "Aim for {{target_words}} words of output (about {{target_tokens}} tokens, or {{target_percent}}% of the original text). Scale detail to hit that budget while preserving everything plot-relevant. Do not go over or under that target.";

// src/prompts/books/chapter-summary.txt
var chapter_summary_default = `You are a talented summarist skilled at capturing scenes from stories comprehensively. Analyze the following roleplay scene and return a detailed memory as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed beat-by-beat summary in narrative prose...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed beat-by-beat summary in narrative prose. First, note the dates/time. Then capture the scene accurately without losing important information EXCEPT FOR [OOC] conversation/interaction, which should be ignored. This summary will go in a lorebook entry, so include:
- All important story beats/events that happened
- Key interaction highlights and character developments
- Notable details, memorable quotes, and revelations
- Outcome and anything else important for future continuity
Capture nuance without repeating verbatim. Make it comprehensive yet digestible.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords for keyword retrieval via word-matching in chat context. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-summarize.txt
var chapter_summarize_default = `Analyze the following roleplay scene and return a structured summary as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed summary with markdown headers...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed bullet-point summary using markdown with these headers (skip and ignore all OOC conversation/interaction):
- **Timeline**: Day/time this scene covers.
- **Story Beats**: List all important plot events and story developments that occurred.
- **Key Interactions**: Describe the important character interactions, dialogue highlights, and relationship developments.
- **Notable Details**: Mention any important objects, settings, revelations, or details that might be relevant for future interactions.
- **Outcome**: Summarize the result, resolution, or state of affairs at the end of the scene.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords that would help a keyworded database find this conversation again if something is mentioned. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Capture all important information - comprehensiveness within the target budget matters more than terseness.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-synopsis.txt
var chapter_synopsis_default = `Analyze the following roleplay scene in the context of previous summaries (if available) and return a comprehensive synopsis as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short, descriptive scene title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Long detailed synopsis with markdown structure...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a beat-by-beat summary of the scene that *replaces reading the full scene* while preserving all plot-relevant nuance, reading like a clean, structured scene log - concise yet complete. Exercise judgment as to whether an interaction is flavor-only or truly affects the plot. Flavor scenes may be captured through key exchanges and skipped when recording story beats.

Write in **past tense**, **third-person**, and exclude all [OOC] or meta discussion.
Use concrete nouns (e.g., "rice cooker" > "appliance").
Only use adjectives/adverbs when they materially affect tone, emotion, or characterization.
Focus on **cause → intention → reaction → consequence** chains for clarity and compression.

# [Scene Title]
**Timeline**: (day/time)

## Story Beats
- Present all major actions, revelations, and emotional shifts in order.
- Capture clear cause-effect logic: what triggered what, and why it mattered.
- Only include plot-affecting interactions; do not capture flavor-only beats.

## Character Dynamics
- Summarize how each character's **motives, emotions, and relationships** evolved.
- Include subtext, tension, or silent implications.
- Highlight key beats of conflict, vulnerability, trust, or power shifts.

## Key Exchanges
- Include only pivotal dialogue that defines tone, emotion, or change.
- Attribute speakers by name; keep quotes short but exact.
- BE SELECTIVE. Maximum of 8 quotes.

## Outcome & Continuity
- Detail resulting **decisions, emotional states, physical effects, or narrative consequences**.
- Include all elements that influence future continuity (knowledge, relationships, injuries, promises, etc.).
- Note any unresolved threads or foreshadowed elements.

Write compactly but completely - every line should add new information or insight.
Synthesize redundant actions or dialogue into unified cause-effect-emotion beats.
Favor compression over coverage whenever the two conflict; omit anything that can be inferred from context or established characterization.

For the keywords field:

Generate **15-30 standalone topical keywords** that function as retrieval tags, not micro-summaries.
Keywords must be:
- **Concrete and scene-specific** (locations, objects, proper nouns, unique actions, repeated motifs).
- **One concept per keyword** - do NOT combine multiple ideas into one keyword.
- **Useful for retrieval if the user later mentions that noun or action alone**, not only in a specific context.
- Not character names.
- **Not thematic, emotional, or abstract.** Stop-list: intimacy, vulnerability, trust, dominance, submission, power dynamics, boundaries, jealousy, aftercare, longing, consent, emotional connection.

Avoid:
- Overly specific compound keywords ("David Tokyo marriage").
- Narrative or plot-summary style keywords ("art dealer date fail").
- Keywords that contain multiple facts or descriptors.
- Keywords that only make sense when the whole scene is remembered.

Prefer:
- Proper nouns (e.g., "Chinatown", "Ritz-Carlton bar").
- Specific physical objects ("CPAP machine", "chocolate chip cookies").
- Distinctive actions ("cookie baking", "piano apology").
- Unique phrases or identifiers from the scene ("pack for forever", "dick-measuring contest").

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-minimal.txt
var chapter_minimal_default = `Analyze the following roleplay scene and return an ultra-concise memory as JSON. Prioritize compression over coverage. Capture only load-bearing plot moves and the single most important consequence; omit anything inferable from context.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Ultra-concise prose summary, prioritizing compression over coverage...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field: prose only, past tense, third person. Skip all [OOC]/meta. Skip flavor and atmosphere. Keep only events that change state, decisions that bind future scenes, or revelations the characters cannot un-know.

For the keywords field, generate 15-30 specific, descriptive, highly relevant keywords for database retrieval - focus on the most important terms that would help find this scene later. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/arc-default.txt
var arc_default_default = `You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple scene summaries (of varying detail and formatting), normalize them, reconstruct the full chronology, identify a self-contained story arc, and output a single memory arc entry in JSON.

The arc must be token-efficient, plot-accurate, and compatible with long-running RP memory systems.

{{TARGET_DIRECTIVE}}

Strict output format (JSON only; no markdown, no prose outside JSON):
{
  "title": "Short descriptive arc title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Structured arc summary as a single string (see Summary Content Structure below).",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

Notes:
- Respect chronology of the source chapters (oldest first).
- If some source chapters do not fit the arc you produce, summarize the arc anyway and ignore the outliers.

PROCESS

STEP 1 - UNIFIED STORY (internal only)
- Combine ALL provided chapter summaries into a single chronological retelling.
- Ignore OOC/meta content.
- Preserve plot-relevant events, character choices, emotional shifts, decisions, consequences, conflicts, promises, boundary negotiations.
- Exclude flavor-only content unless it affects future behavior.
- Normalize to past-tense, third-person.
- Focus on cause → intention → reaction → consequence chains.
- Do NOT output this unified story.

STEP 2 - IDENTIFY THE STORY ARC
- From the unified story, identify the single self-contained arc that represents the most significant narrative movement across these chapters.

STEP 3 - BUILD THE ARC OBJECT

title:
- 3-6 words, descriptive of the arc's core.

content (the entire "Summary Content Structure" below must appear inside this single string; use headings and bullets as plain text):

Summary Content Structure (follow inside the content string):

# [Arc Title]
Time period: What timeframe the arc covers (e.g. "March 3-10", "Week of July 15").

Arc Premise: One sentence describing what this arc is about.

## Major Beats
- 3-7 bullets capturing the major plot movements of this arc
- Focus on cause → effect logic
- Include only plot-affecting events

## Character Dynamics
- 1-2 paragraphs describing how the characters' emotions, motives, boundaries, or relationships changed
- Include subtext, tension shifts, power exchange changes, new trust/vulnerabilities, or new conflicts
- Include silent implications if relevant

## Key Exchanges
- Up to 8 short, exact quotes
- Only include dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 4-8 bullets capturing:
  - decisions
  - promises
  - new emotional states
  - new routines/rituals
  - injuries or physical changes
  - foreshadowed future events
  - unresolved threads
  - permanent consequences

STEP 4 - KEYWORDS
- Provide 15-30 standalone retrieval keywords.

MUST:
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable scene elements
- Each keyword = ONE concept only
- Each keyword must be retrievable if mentioned ALONE
- Use ONLY nouns or noun-phrases

MUST NOT:
- No narrative/summary keywords ("start of affair", "argument resolved")
- No emotional/abstract words (intimacy, vulnerability, trust, jealousy, dominance, submission, aftercare, connection, longing, etc.)
- No multi-fact keywords ("Denver airport Lyft ride and call")
- No themes or vibes

Examples of valid keywords:
- Four Seasons bar
- Macallan 25
- private elevator
- Aston Martin
- CPAP machine
- Gramercy Tavern
- yuzu soda
- satellite map
- Life360 app
- marble desk
- "pack for forever"
- "dick-measuring contest"

JSON-only:
- Return only the JSON object described above.
- No markdown fences, no commentary, no system prompts, no extra text.`;

// src/prompts/books/volume-default.txt
var volume_default_default = `You are an expert narrative analyst and memory-engine assistant.\r
Your task is to take multiple story ARC summaries (each already a condensed span of the story), normalize them, reconstruct the full chronology, and output a single consolidated VOLUME entry in JSON.\r
\r
A volume is a higher compression tier: it replaces all of its source arcs in a long-running RP memory system, so it must preserve everything future scenes may depend on while being far more compact than the arcs combined.\r
\r
{{TARGET_DIRECTIVE}}\r
\r
Strict output format (JSON only; no markdown, no prose outside JSON):\r
{\r
  "title": "Short descriptive volume title (3-6 words)",\r
  "opener": "{{memoria_opener}}",\r
  "content": "Structured volume summary as a single string (see Summary Content Structure below).",\r
  "keywords": ["keyword1", "keyword2"],\r
  "short_comment": "{{memoria_short_comment_rules}}"\r
}\r
\r
The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.\r
\r
Notes:\r
- Respect chronology of the source arcs (oldest first).\r
- Merge overlapping or repeated information across arcs into single beats.\r
- Prefer whole-story trajectory over scene detail: what changed permanently matters more than how each scene played out.\r
\r
Summary Content Structure (follow inside the content string; use headings and bullets as plain text):\r
\r
# [Volume Title]\r
Time period: What timeframe the volume covers.\r
\r
Volume Premise: One or two sentences describing the overall movement of the story across these arcs.\r
\r
## Major Beats\r
- 5-10 bullets capturing the major plot movements across all arcs\r
- Focus on cause → effect logic and permanent consequences\r
- Include only plot-affecting events\r
\r
## Character Dynamics\r
- 1-3 paragraphs describing how the characters' motives, emotions, boundaries, and relationships evolved across the volume\r
- Capture the net change from the start of the first arc to the end of the last\r
\r
## Key Exchanges\r
- Up to 8 short, exact quotes that defined the volume\r
- Only dialogue that materially shifted tone, emotion, or relationship dynamics\r
\r
## Outcome & Continuity\r
- 5-10 bullets capturing decisions, promises, emotional states, routines, injuries or physical changes, foreshadowed events, unresolved threads, and permanent consequences\r
\r
KEYWORDS\r
- Provide 15-30 standalone retrieval keywords.\r
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable elements only.\r
- Each keyword = ONE concept, retrievable if mentioned alone.\r
- No narrative keywords, no emotional or abstract words, no multi-fact keywords, no character names.\r
\r
JSON-only:\r
- Return only the JSON object described above.\r
- No markdown fences, no commentary, no extra text.`;

// src/backend/presets.ts
function withTargetDirective(template) {
  return fillPrompt(template, { TARGET_DIRECTIVE: target_directive_default });
}
var BUILTIN_CHAPTER_PRESETS = [
  { key: "summary", displayName: t("backend.presets.builtinChapterPresets.summary"), prompt: withTargetDirective(chapter_summary_default) },
  { key: "summarize", displayName: t("backend.presets.builtinChapterPresets.summarize"), prompt: withTargetDirective(chapter_summarize_default) },
  { key: "synopsis", displayName: t("backend.presets.builtinChapterPresets.synopsis"), prompt: withTargetDirective(chapter_synopsis_default) },
  { key: "minimal", displayName: t("backend.presets.builtinChapterPresets.minimal"), prompt: withTargetDirective(chapter_minimal_default) }
];
var BUILTIN_ARC_PRESETS = [
  { key: "arc_default", displayName: t("backend.presets.builtinArcPresets.arc"), prompt: withTargetDirective(arc_default_default) }
];
var BUILTIN_VOLUME_PRESETS = [
  { key: "volume_default", displayName: t("backend.presets.builtinVolumePresets.volume"), prompt: withTargetDirective(volume_default_default) }
];
var BUILTIN_CODEX_PRESETS = [
  { key: "codex_default", displayName: t("backend.presets.builtinCodexPresets.default"), prompt: CODEX_DIRECTIVES_DEFAULT }
];

// src/ui/lessons/fixture.ts
var FIXTURE_CHAT_ID = `${LESSON_CHAT_PREFIX}ashford`;
var FIXTURE_MODEL = "example/tutor-model";
var FIXTURE_CONN = "lesson_conn";
var LINES = [
  t("ui.lessons.fixture.lines.theRainHadNotLetUpSince"),
  t("ui.lessons.fixture.lines.eliasPressedTheSilverLocketIntoHis"),
  t("ui.lessons.fixture.lines.youWereThereMaraSaidQuietlyNot"),
  t("ui.lessons.fixture.lines.theCaptainSMenWentDoorTo"),
  t("ui.lessons.fixture.lines.iKeepMyVoiceLevelAndAsk"),
  t("ui.lessons.fixture.lines.ashfordManorStoodDarkExceptForA"),
  t("ui.lessons.fixture.lines.banditsTheCaptainRepeatedWritingItDown"),
  t("ui.lessons.fixture.lines.maraFoldedTheReceiptIntoTheHem"),
  t("ui.lessons.fixture.lines.theBellsRangForTheDukeAt"),
  t("ui.lessons.fixture.lines.eliasSleptInTheLoftAboveThe"),
  t("ui.lessons.fixture.lines.ifTheyFindTheLocketTheyFind"),
  t("ui.lessons.fixture.lines.theFerrymanSScarCaughtTheLight")
];
function makeMessages(total) {
  const out = [];
  for (let i = 0;i < total; i++) {
    const role = i % 2 === 0 ? "user" : "assistant";
    const approxTokens = role === "user" ? 150 : 640;
    out.push({
      id: `m${i + 1}`,
      role,
      preview: LINES[i % LINES.length],
      charCount: approxTokens * 4,
      approxTokens,
      hidden: false,
      covered: false,
      coveredByEntryId: null,
      indexInChat: i,
      excluded: false
    });
  }
  return out;
}
function msgIds(first, last) {
  const out = [];
  for (let i = first;i <= last; i++)
    out.push(`m${i + 1}`);
  return out;
}
function makeMeta(e) {
  return {
    tier: e.tier,
    chatId: FIXTURE_CHAT_ID,
    msgIds: msgIds(e.first, e.last),
    sourceChapterEntryIds: e.sources,
    firstMsgIdx: e.first,
    lastMsgIdx: e.last,
    tokenCountInput: e.inTokens,
    tokenCountOutput: e.outTokens,
    model: FIXTURE_MODEL,
    connectionId: FIXTURE_CONN,
    createdAt: Date.now() - (100 - e.n) * 3600000,
    title: t("ui.lessons.fixture.makeMeta.msgs", { title: e.title, first1: e.first + 1, last1: e.last + 1 }),
    shortComment: e.nyaa,
    presetKey: e.tier === 1 ? "summary" : e.tier === 2 ? "arc_default" : "volume_default",
    sceneNumber: e.n,
    ...e.ghost ? { ghost: true } : {}
  };
}
function makeView(e) {
  const tag = e.tier === 3 ? t("ui.lessons.fixture.tag.vol") : e.tier === 2 ? t("ui.lessons.fixture.tag.arc") : "";
  const comment = e.tier === 1 ? t("ui.lessons.fixture.comment.msgs", { n: e.n, title: e.title, first1: e.first + 1, last1: e.last + 1 }) : t("ui.lessons.fixture.comment.msgs2", { tag, n: e.n, title: e.title, first1: e.first + 1, last1: e.last + 1 });
  return {
    entryId: e.id,
    bookId: "book_lesson",
    comment,
    content: e.body,
    meta: makeMeta(e),
    active: !e.superseded && !e.ghost,
    contentTokens: e.outTokens,
    contentChars: e.outTokens * 4,
    sourceTokensInput: e.inTokens,
    isRoot: false,
    isGhost: !!e.ghost
  };
}
var CH = [
  {
    id: "c1",
    tier: 1,
    n: 1,
    first: 0,
    last: 17,
    title: t("ui.lessons.fixture.ch.theDukeFalls"),
    body: t("ui.lessons.fixture.ch.1stSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.neatlyFiledOneNefariousNightOnThe"),
    outTokens: 430,
    inTokens: 7100
  },
  {
    id: "c2",
    tier: 1,
    n: 2,
    first: 18,
    last: 35,
    title: t("ui.lessons.fixture.ch.aSeamstressSSilence"),
    body: t("ui.lessons.fixture.ch.2ndSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.secretsStitchedIntoASleeveSoTidy"),
    outTokens: 445,
    inTokens: 7050
  },
  {
    id: "c3",
    tier: 1,
    n: 3,
    first: 36,
    last: 53,
    title: t("ui.lessons.fixture.ch.thePawnbrokerSReceipt"),
    body: t("ui.lessons.fixture.ch.3rdSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.priceyPromisesPressedBetweenThePages"),
    outTokens: 460,
    inTokens: 6900
  },
  {
    id: "c4",
    tier: 1,
    n: 4,
    first: 54,
    last: 71,
    title: t("ui.lessons.fixture.ch.theCaptainAsksQuestions"),
    body: t("ui.lessons.fixture.ch.4thSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.curiousCaptainsCollectSuchClumsyClues"),
    outTokens: 420,
    inTokens: 7200
  },
  {
    id: "c5",
    tier: 1,
    n: 5,
    first: 72,
    last: 89,
    title: t("ui.lessons.fixture.ch.locketAtTheBridge"),
    body: t("ui.lessons.fixture.ch.5thSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.bridgesBearTheBestAndBoldestBargains"),
    outTokens: 455,
    inTokens: 6850
  },
  {
    id: "g1",
    tier: 1,
    n: 6,
    first: 90,
    last: 107,
    ghost: true,
    title: t("ui.lessons.fixture.ch.rooftopConfessions"),
    body: t("ui.lessons.fixture.ch.6thSummaryChapterContaining18PriorTurns"),
    nyaa: t("ui.lessons.fixture.ch.ghostlyGossipGlidesInBeforeTheGlue"),
    outTokens: 440,
    inTokens: 7000
  }
];
var ARC1 = {
  id: "a1",
  tier: 2,
  n: 1,
  first: 0,
  last: 53,
  title: t("ui.lessons.fixture.arc1.theMurderAtAshfordManor"),
  body: t("ui.lessons.fixture.arc1.1stSummaryArcContaining3PriorChapters"),
  nyaa: t("ui.lessons.fixture.arc1.anArcOfAlibisBoundAndBeautifully"),
  sources: ["c1", "c2", "c3"],
  outTokens: 820,
  inTokens: 1335
};
function codexFixtureFiles() {
  const files = {
    characters: {
      entities: [
        {
          id: "char:elias",
          name: t("ui.lessons.fixture.files.elias"),
          kind: t("ui.lessons.fixture.files.human"),
          role: t("ui.lessons.fixture.files.theDukeSFormerValetFugitive"),
          description: t("ui.lessons.fixture.files.hidingInTheTanneryLoft"),
          traits: [t("ui.lessons.fixture.files.careful"), t("ui.lessons.fixture.files.sentimental"), t("ui.lessons.fixture.files.quickOverRooftops")],
          goals: [t("ui.lessons.fixture.files.keepTheLocket"), t("ui.lessons.fixture.files.keepMaraOutOfIt")],
          significance: t("ui.lessons.fixture.files.killedTheDukeOnDay3")
        },
        {
          id: "char:mara",
          name: t("ui.lessons.fixture.files.mara"),
          kind: t("ui.lessons.fixture.files.human"),
          role: t("ui.lessons.fixture.files.seamstressAtAshfordManor"),
          description: t("ui.lessons.fixture.files.publiclyMourningPrivatelyBargaining"),
          traits: [t("ui.lessons.fixture.files.observant"), t("ui.lessons.fixture.files.steady")],
          goals: [t("ui.lessons.fixture.files.leverageOverElias"), t("ui.lessons.fixture.files.leaveTheCity")]
        },
        {
          id: "char:captain",
          name: t("ui.lessons.fixture.files.theCaptain"),
          kind: t("ui.lessons.fixture.files.human"),
          role: t("ui.lessons.fixture.files.leadsTheCityWatch"),
          description: t("ui.lessons.fixture.files.publiclyBacksTheBanditTheory"),
          goals: [t("ui.lessons.fixture.files.reopenTheStaffInterviewsQuietly")],
          locked: true
        }
      ]
    },
    locations: {
      entities: [
        { id: "loc:ashford_manor", name: t("ui.lessons.fixture.files.ashfordManor"), kind: t("ui.lessons.fixture.files.estate"), description: t("ui.lessons.fixture.files.theDukeSSeatSealedByThe") },
        { id: "loc:the_bridge", name: t("ui.lessons.fixture.files.theBridge"), kind: t("ui.lessons.fixture.files.landmark"), significance: t("ui.lessons.fixture.files.whereEliasAndMaraTradeTruths") }
      ]
    },
    things: {
      entities: [
        { id: "thing:silver_locket", name: t("ui.lessons.fixture.files.theSilverLocket"), kind: t("ui.lessons.fixture.files.heirloom"), description: t("ui.lessons.fixture.files.backInEliasSCoat"), significance: t("ui.lessons.fixture.files.tiesEliasToTheStudyOnDay") }
      ]
    },
    relations: {
      relations: [
        { type: "pair", a: "char:elias", b: "char:mara", kind: t("ui.lessons.fixture.files.bond"), state: t("ui.lessons.fixture.files.trustsHerWithHisLifeNotHis"), history: [t("ui.lessons.fixture.files.day3SheSawHimFlee"), t("ui.lessons.fixture.files.day14SheRevealedSheKeptThe")] },
        { type: "pair", a: "char:elias", b: "thing:silver_locket", kind: t("ui.lessons.fixture.files.owns"), state: t("ui.lessons.fixture.files.carriesItEverywhereBoughtItBackTwice") },
        { type: "pair", a: "char:captain", b: "char:mara", kind: t("ui.lessons.fixture.files.suspects"), state: t("ui.lessons.fixture.files.doubtsHerBanditStoryLacksProof") },
        { type: "group", kind: t("ui.lessons.fixture.files.pact"), members: ["char:elias", "char:mara"], state: t("ui.lessons.fixture.files.silenceAboutTheMurderUneasySinceThe") }
      ]
    },
    timeline: {
      events: [
        { when: t("ui.lessons.fixture.files.day3"), event: t("ui.lessons.fixture.files.theDukeOfAshfordIsKilledIn"), participants: ["char:elias"], where: "loc:ashford_manor", causes: t("ui.lessons.fixture.files.eliasFleesWithTheLocket") },
        { when: t("ui.lessons.fixture.files.day5"), event: t("ui.lessons.fixture.files.maraTellsTheCaptainSheSawBandits"), participants: ["char:mara", "char:captain"] },
        { when: t("ui.lessons.fixture.files.day8"), event: t("ui.lessons.fixture.files.thePawnbrokerRaisesHisPriceForSilence"), causes: t("ui.lessons.fixture.files.eliasRunsOutOfMoney") },
        { when: t("ui.lessons.fixture.files.day11"), event: t("ui.lessons.fixture.files.eliasEscapesTheTannerySearchDropsA"), participants: ["char:elias", "char:captain"] },
        { when: t("ui.lessons.fixture.files.day14"), event: t("ui.lessons.fixture.files.maraRevealsSheKeptThePawnbrokerS"), participants: ["char:mara", "char:elias"], where: "loc:the_bridge" }
      ]
    },
    threads: {
      threads: [
        { name: t("ui.lessons.fixture.files.theDukeSMurder"), status: "open", summary: t("ui.lessons.fixture.files.theCaptainSBanditTheoryIsPublic"), latest: t("ui.lessons.fixture.files.aCrestedGloveIsInTheWatch"), planted: [t("ui.lessons.fixture.files.thePawnbrokerKeptAReceipt")] },
        { name: t("ui.lessons.fixture.files.leavingTheCity"), status: "stalled", summary: t("ui.lessons.fixture.files.maraWantsOutBeforeTheInterviewsResume") }
      ],
      seeds: [t("ui.lessons.fixture.files.unexplainedScarOnTheFerrymanSHand")]
    },
    world: {
      entries: [
        { topic: t("ui.lessons.fixture.files.theCityWatch"), facts: [t("ui.lessons.fixture.files.answersToTheMagistrateNotTheCrown"), t("ui.lessons.fixture.files.funeralCustomBarsArrestsDuringMourningBells")] },
        { topic: t("ui.lessons.fixture.files.mourningCustoms"), facts: [t("ui.lessons.fixture.files.halfBlackWornForAWeekBy")] }
      ]
    },
    knowledge: {
      items: [
        {
          fact: t("ui.lessons.fixture.files.eliasKilledTheDuke"),
          knownBy: ["char:mara"],
          hiddenFrom: ["char:captain"],
          falseBeliefs: [{ who: "char:captain", believes: t("ui.lessons.fixture.files.banditsDidIt") }]
        },
        {
          fact: t("ui.lessons.fixture.files.maraKeepsThePawnbrokerSReceiptSewn"),
          knownBy: ["char:mara"],
          hiddenFrom: ["char:elias", "char:captain"],
          note: t("ui.lessons.fixture.files.herLeverageIfEliasRunsAlone")
        }
      ]
    }
  };
  const out = {};
  for (const [k, v] of Object.entries(files))
    out[k] = JSON.stringify(v, null, 2);
  return out;
}
var CODEX_FILE_TOKENS = {
  characters: 240,
  locations: 80,
  things: 60,
  relations: 170,
  timeline: 160,
  threads: 120,
  world: 70,
  knowledge: 110
};
function coverageFor(stubs, profileLag, profileWindow) {
  let covered = 0;
  let uncoveredTokens = 0;
  for (const m of stubs) {
    if (m.covered)
      covered++;
    else
      uncoveredTokens += m.approxTokens;
  }
  const uncovered = stubs.length - covered;
  return {
    totalMessages: stubs.length,
    coveredMessages: covered,
    uncoveredMessages: uncovered,
    approxUncoveredTokens: uncoveredTokens,
    lagSatisfied: uncovered >= profileLag,
    windowAvailable: uncovered - profileLag >= profileWindow
  };
}
function applyCoverage(stubs, entries, hide) {
  for (const e of entries) {
    if (e.isGhost || !e.active)
      continue;
    for (const id of e.meta.msgIds) {
      const idx = Number(id.slice(1)) - 1;
      const m = stubs[idx];
      if (!m)
        continue;
      m.covered = true;
      m.coveredByEntryId = e.entryId;
      m.hidden = hide;
    }
  }
}
function booksLessons() {
  return {
    version: 1,
    freshInstall: false,
    booksSealSkipped: false,
    codexSealSkipped: false,
    books: { ...emptyLessonCourse(), status: "in_progress" },
    codex: emptyLessonCourse()
  };
}
var VARIANTS = {
  filing: { total: 160, chapters: [CH[0], CH[1]] },
  "filing-after": { total: 160, chapters: [CH[0], CH[1], CH[2]] },
  pills: { total: 124, chapters: [CH[0], CH[1], CH[2]] },
  desk: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], ghost: true, busy: true, failure: true },
  shelf: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], ghost: true },
  compose: { total: 140, chapters: [CH[0], CH[1]], excluded: [100, 101, 102] },
  continuity: { total: 140, chapters: [CH[0], CH[1]], roots: true },
  tuning: { total: 140, chapters: [CH[0], CH[1]] },
  codex: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], codex: true },
  "codex-noinject": {
    total: 165,
    chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]],
    arcs: [ARC1],
    codex: true,
    codexFileStates: { relations: "noInject" }
  },
  "codex-stale": {
    total: 165,
    chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]],
    arcs: [ARC1],
    codex: true,
    codexFileStates: { relations: "frozen" },
    codexStale: ["relations"]
  }
};
var FIXTURE_VARIANTS = Object.keys(VARIANTS);
function buildFixture(variant) {
  const spec = VARIANTS[variant] ?? VARIANTS["filing"];
  const profile = makeDefaultProfile("default", t("ui.lessons.fixture.profile.default"));
  profile.codexEnabled = !!spec.codex;
  const stubs = makeMessages(spec.total);
  for (const idx of spec.excluded ?? []) {
    const m = stubs[idx];
    if (m)
      m.excluded = true;
  }
  const superseded = new Set((spec.arcs ?? []).flatMap((a) => a.sources ?? []));
  const chapters = spec.chapters.map((c) => makeView({ ...c, superseded: superseded.has(c.id) }));
  if (spec.ghost)
    chapters.push(makeView(CH[5]));
  const arcs = (spec.arcs ?? []).map((a) => makeView(a));
  for (const a of arcs)
    a.sourceChapterEntryIds = (spec.arcs ?? []).find((s) => s.id === a.entryId)?.sources ?? [];
  applyCoverage(stubs, [...arcs, ...chapters], profile.hideCoveredMessages);
  const coverage = coverageFor(stubs, profile.lagValue, profile.windowValue);
  const headroom = Math.max(0, coverage.uncoveredMessages - profile.lagValue);
  const lessons = spec.codex ? unlockedLessons() : booksLessons();
  return {
    activeChatId: FIXTURE_CHAT_ID,
    activeChatName: t("ui.lessons.fixture.buildFixture.theAshfordCase"),
    activeCharacterId: "lesson_char",
    activeCharacterName: t("ui.lessons.fixture.buildFixture.elias"),
    settings: { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: "default" },
    activeProfile: profile,
    chapters,
    arcs,
    higherBooks: [],
    volumes: [],
    bookId: "book_lesson",
    bookName: t("ui.lessons.fixture.buildFixture.lumiBooksTheAshfordCase"),
    connections: [
      { id: FIXTURE_CONN, name: t("ui.lessons.fixture.buildFixture.storyteller"), provider: "example", model: FIXTURE_MODEL, isDefault: true, hasApiKey: true }
    ],
    resolvedSidecarConnectionId: FIXTURE_CONN,
    coverage,
    busy: spec.busy ? [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: t("ui.lessons.fixture.buildFixture.memoriaIsWritingAChapter13kt"), startedAt: Date.now() - 24000 }] : [],
    lastFailure: spec.failure ? { kind: "chapter", message: t("ui.lessons.fixture.buildFixture.noTokenWithin60sTheProviderMay"), retriedTimes: 4, at: Date.now() - 90000 } : null,
    messages: stubs,
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: [],
    pendingPreviews: [],
    backlogChapters: Math.floor(headroom / Math.max(1, profile.windowValue)),
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: spec.roots ? [{ chatId: `${LESSON_CHAT_PREFIX}vol1`, chatName: t("ui.lessons.fixture.buildFixture.theAshfordCaseVol1"), entryCount: 5 }] : [],
    codexExists: !!spec.codex,
    codexBacklog: spec.codex ? 4 : 0,
    codexBacklogPasses: spec.codex ? 1 : 0,
    codexLastRunAt: spec.codex ? Date.now() - 11 * 60000 : null,
    codexUndoAt: null,
    codexUndoReason: null,
    codexSources: [],
    codexRootOrigin: null,
    codexRootOriginName: null,
    codexTokensApproximate: true,
    codexInjectedTokens: spec.codex ? 940 : 0,
    codexFileStates: spec.codexFileStates ?? {},
    codexStaleFiles: spec.codexStale ?? [],
    codexRefreshPending: [],
    codexFileTokens: spec.codex ? { ...CODEX_FILE_TOKENS } : {},
    codexRevision: 0,
    lessons
  };
}
function applyFiledChapter(state) {
  if (state.chapters.some((c) => c.entryId === "c3"))
    return;
  const spec = CH[2];
  const view = makeView(spec);
  state.chapters.push(view);
  applyCoverage(state.messages, [view], state.activeProfile.hideCoveredMessages);
  const cov = coverageFor(state.messages, state.activeProfile.lagValue, state.activeProfile.windowValue);
  state.coverage = cov;
  const headroom = Math.max(0, cov.uncoveredMessages - state.activeProfile.lagValue);
  state.backlogChapters = Math.floor(headroom / Math.max(1, state.activeProfile.windowValue));
}
var FIXTURE_BUSY_FILING = {
  kind: "chapter",
  chatId: FIXTURE_CHAT_ID,
  label: t("ui.lessons.fixture.fixtureBusyFiling.memoriaIsFilingAChapter2s"),
  startedAt: 0
};

// src/ui/tab-meta.ts
var APP_TABS = [
  {
    key: "home",
    label: t("ui.tabMeta.appTabs.home"),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v3"/><path d="M5.6 6.6l2.1 2.1"/><path d="M18.4 6.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`
  },
  {
    key: "books",
    label: t("ui.tabMeta.appTabs.books"),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`
  },
  {
    key: "codex",
    label: t("ui.tabMeta.appTabs.codex"),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>`
  },
  {
    key: "tuning",
    label: t("ui.tabMeta.appTabs.tuning"),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6"/><path d="M6 14v6"/><path d="M12 4v2"/><path d="M12 10v10"/><path d="M18 4v8"/><path d="M18 16v4"/><path d="M4 10h4"/><path d="M10 6h4"/><path d="M16 12h4"/></svg>`
  },
  {
    key: "stuff",
    label: t("ui.tabMeta.appTabs.info"),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l0.9 2.1L22 19l-2.1 0.9L19 22l-0.9-2.1L16 19l2.1-0.9z"/></svg>`
  }
];

// src/ui/lessons/diploma.ts
var GRADE_REMARK = {
  gilded: t("ui.lessons.diploma.gradeRemark.notAPageOutOfPlaceMy"),
  silver: t("ui.lessons.diploma.gradeRemark.nearlyFlawlessFilingTheShelfApproves"),
  bronze: t("ui.lessons.diploma.gradeRemark.aSolidApprenticeshipTheStacksWillTeach"),
  apprentice: t("ui.lessons.diploma.gradeRemark.theLibraryForgivesRetakeASectionWhenever")
};
function renderRegister(host, defaultName, onSign) {
  host.replaceChildren();
  const card = document.createElement("div");
  card.className = "lmb-register";
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = t("ui.lessons.diploma.renderRegister.signTheRegister");
  const hint = document.createElement("div");
  hint.className = "lmb-seal-pitch";
  hint.textContent = t("ui.lessons.diploma.renderRegister.theNameGoesOnYourDiploma");
  const input = textInput({ value: defaultName, placeholder: t("ui.lessons.diploma.input.reader"), autoFocus: true });
  input.maxLength = 40;
  const row = document.createElement("div");
  row.className = "lmb-seal-actions";
  const sign = makeButton(t("ui.lessons.diploma.sign.sign"), () => onSign(input.value.trim() || t("ui.lessons.diploma.sign.reader")), { primary: true });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      sign.click();
  });
  row.appendChild(sign);
  card.append(title, hint, input, row);
  host.appendChild(card);
}
function renderDiploma(host, data, actions) {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "lmb-diploma";
  const frame = document.createElement("div");
  frame.className = "lmb-diploma-frame";
  const arch = document.createElement("div");
  arch.className = "lmb-diploma-arch";
  arch.textContent = t("ui.lessons.diploma.renderDiploma.lumibooksAcademy");
  const course = document.createElement("div");
  course.className = "lmb-diploma-course";
  course.textContent = data.courseTitle;
  const grant = document.createElement("div");
  grant.className = "lmb-diploma-grant";
  grant.textContent = t("ui.lessons.diploma.renderDiploma.certifiesThat");
  const name = document.createElement("div");
  name.className = "lmb-diploma-name";
  name.textContent = data.name;
  const line = document.createElement("div");
  line.className = "lmb-diploma-line";
  line.textContent = t("ui.lessons.diploma.renderDiploma.hasReadTheStacksAndUnderstoodThem");
  const stamp = document.createElement("div");
  stamp.className = `lmb-diploma-stamp lmb-grade-${data.grade}`;
  stamp.textContent = LESSON_GRADE_LABEL[data.grade];
  const score = document.createElement("div");
  score.className = "lmb-diploma-score";
  const gold = data.total - data.wrong;
  score.textContent = t("ui.lessons.diploma.renderDiploma.ofGoldStamps", { gold, total: data.total, toLocaleDateString: new Date(data.completedAt).toLocaleDateString() });
  const sealRow = document.createElement("div");
  sealRow.className = "lmb-diploma-seal";
  sealRow.appendChild(memoriaSprite(48));
  const remark = document.createElement("div");
  remark.className = "lmb-diploma-remark";
  remark.textContent = GRADE_REMARK[data.grade];
  sealRow.appendChild(remark);
  frame.append(arch, course, grant, name, line, stamp, score, sealRow);
  wrap.appendChild(frame);
  const btnRow = document.createElement("div");
  btnRow.className = "lmb-seal-actions";
  btnRow.appendChild(makeButton(t("ui.lessons.diploma.renderDiploma.saveAsImage"), () => void downloadDiploma(data), { small: true }));
  for (const a of actions) {
    btnRow.appendChild(makeButton(a.label, a.onClick, { small: true, primary: a.primary }));
  }
  wrap.appendChild(btnRow);
  host.appendChild(wrap);
  if (!window.matchMedia(t("ui.lessons.diploma.renderDiploma.prefersReducedMotionReduce")).matches) {
    wrap.appendChild(makeConfetti());
  }
}
function makeConfetti() {
  const layer = document.createElement("div");
  layer.className = "lmb-confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0;i < 36; i++) {
    const d = document.createElement("span");
    d.textContent = t("ui.lessons.diploma.makeConfetti.value");
    d.style.left = `${i * 137 % 100}%`;
    d.style.animationDelay = `${i % 12 * 90}ms`;
    d.style.fontSize = `${8 + i % 4 * 3}px`;
    layer.appendChild(d);
  }
  setTimeout(() => layer.remove(), 3200);
  return layer;
}
async function downloadDiploma(data) {
  const W = 900;
  const H = 640;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const g = canvas.getContext("2d");
  if (!g)
    return;
  g.scale(dpr, dpr);
  try {
    await Promise.all([
      document.fonts.load('20px "Marcellus"'),
      document.fonts.load('42px "Marcellus"')
    ]);
  } catch {}
  const display = (px) => `${px}px "Marcellus", "Palatino Linotype", Georgia, serif`;
  g.fillStyle = "#181422";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(201, 168, 106, 0.9)";
  g.lineWidth = 3;
  g.strokeRect(24, 24, W - 48, H - 48);
  g.lineWidth = 1;
  g.strokeStyle = "rgba(201, 168, 106, 0.5)";
  g.strokeRect(34, 34, W - 68, H - 68);
  for (const [x, y] of [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]]) {
    g.save();
    g.translate(x, y);
    g.rotate(Math.PI / 4);
    g.fillStyle = "rgba(201, 168, 106, 0.9)";
    g.fillRect(-5, -5, 10, 10);
    g.restore();
  }
  g.textAlign = "center";
  g.fillStyle = "#c9a86a";
  g.font = display(24);
  g.fillText(t("ui.lessons.diploma.downloadDiploma.lUMIBOO"), W / 2, 96);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = display(20);
  g.fillText(data.courseTitle, W / 2, 140);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = "15px Georgia, serif";
  g.fillText(t("ui.lessons.diploma.downloadDiploma.certifiesThat"), W / 2, 190);
  g.fillStyle = "#e8ddc0";
  g.font = display(44);
  g.fillText(data.name, W / 2, 246);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = "15px Georgia, serif";
  g.fillText(t("ui.lessons.diploma.downloadDiploma.hasReadTheStacksAndUnderstoodThem"), W / 2, 284);
  const gold = data.total - data.wrong;
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = "14px Georgia, serif";
  g.fillText(t("ui.lessons.diploma.downloadDiploma.ofGoldStamps", { gold, total: data.total, toLocaleDateString: new Date(data.completedAt).toLocaleDateString() }), W / 2, 330);
  g.save();
  g.translate(W / 2 + 250, 420);
  g.rotate(-0.14);
  g.strokeStyle = "#c9a86a";
  g.lineWidth = 3;
  g.strokeRect(-90, -34, 180, 68);
  g.fillStyle = "#c9a86a";
  g.font = display(30);
  g.fillText(LESSON_GRADE_LABEL[data.grade].toUpperCase(), 0, 10);
  g.restore();
  await new Promise((resolve) => {
    const img = new Image;
    img.onload = () => {
      g.save();
      g.beginPath();
      g.arc(W / 2 - 220, 430, 56, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, W / 2 - 276, 374, 112, 112);
      g.restore();
      g.strokeStyle = "rgba(201, 168, 106, 0.8)";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(W / 2 - 220, 430, 57, 0, Math.PI * 2);
      g.stroke();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = MEMORIA_AVATAR;
  });
  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.font = "italic 14px Georgia, serif";
  g.fillText(GRADE_REMARK[data.grade], W / 2, 560);
  g.fillStyle = "rgba(201, 168, 106, 0.8)";
  g.font = display(13);
  g.fillText(t("ui.lessons.diploma.downloadDiploma.memoriaLibrarian"), W / 2, 588);
  const a = document.createElement("a");
  a.download = `lumibooks-diploma-${data.courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

// src/ui/lessons/diagrams.ts
function renderDiagram(host, kind) {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "lmb-lesson-diagram";
  host.appendChild(wrap);
  switch (kind) {
    case "rot":
      diagramRot(wrap);
      break;
    case "fold":
      diagramFold(wrap);
      break;
    case "unfold":
      diagramUnfold(wrap);
      break;
    case "fade":
      diagramFade(wrap);
      break;
  }
}
function el(cls, text) {
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined)
    d.textContent = text;
  return d;
}
function bar(kind, width, label) {
  const b = el(`lmb-dg-bar ${kind}`);
  b.style.width = `${width}%`;
  if (label) {
    const tag = el("lmb-dg-tag", label);
    b.appendChild(tag);
  }
  return b;
}
function loop(anchor, phases, total) {
  let timers = [];
  const cycle = () => {
    if (!anchor.isConnected) {
      for (const t of timers)
        clearTimeout(t);
      return;
    }
    timers = phases.map((p) => setTimeout(() => {
      if (anchor.isConnected)
        p.run();
    }, p.at));
    timers.push(setTimeout(cycle, total));
  };
  cycle();
}
var MSG_WIDTHS = [46, 72, 38, 66, 52, 74, 42, 68, 56, 70, 44, 64];
function diagramRot(wrap) {
  wrap.appendChild(el("lmb-dg-label", t("ui.lessons.diagrams.diagramRot.theContextWindow")));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col bottom");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", t("ui.lessons.diagrams.caption.newTurnsPushInTheOldestGet"));
  wrap.appendChild(caption);
  const MAX = 9;
  let n = 0;
  for (let i = 0;i < MAX - 2; i++)
    col.appendChild(bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]));
  const timer = setInterval(() => {
    if (!col.isConnected) {
      clearInterval(timer);
      return;
    }
    const fresh = bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]);
    fresh.classList.add("in");
    col.appendChild(fresh);
    requestAnimationFrame(() => fresh.classList.remove("in"));
    while (col.childElementCount > MAX) {
      const oldest = col.firstElementChild;
      if (!oldest)
        break;
      if (oldest.classList.contains("clipped")) {
        oldest.remove();
      } else {
        oldest.classList.add("clipped");
        break;
      }
    }
  }, 1000);
}
function paintFold(col, caption, state) {
  col.replaceChildren();
  for (const [i, r] of state.rows.entries()) {
    const b = bar(r.kind, r.kind === "msg" ? MSG_WIDTHS[i % MSG_WIDTHS.length] : r.kind === "chapter" ? 82 : 90, r.label);
    b.classList.add("in");
    col.appendChild(b);
    requestAnimationFrame(() => b.classList.remove("in"));
  }
  caption.textContent = state.caption;
}
function diagramFold(wrap) {
  wrap.appendChild(el("lmb-dg-label", t("ui.lessons.diagrams.diagramFold.yourChatHistory")));
  const win = el("lmb-dg-window tall");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);
  const msgs = (k) => Array.from({ length: k }, () => ({ kind: "msg" }));
  const states = [
    { rows: [...msgs(9)], caption: t("ui.lessons.diagrams.states.oldMessagesPileUp") },
    { rows: [{ kind: "chapter", label: t("ui.lessons.diagrams.states.ch1") }, ...msgs(6)], caption: t("ui.lessons.diagrams.states.theOldestFoldIntoAChapterIn") },
    { rows: [{ kind: "chapter", label: t("ui.lessons.diagrams.states.ch1") }, { kind: "chapter", label: t("ui.lessons.diagrams.states.ch2") }, ...msgs(3)], caption: t("ui.lessons.diagrams.states.thenTheNextWindowFolds") },
    { rows: [{ kind: "arc", label: t("ui.lessons.diagrams.states.arc1") }, ...msgs(3)], caption: t("ui.lessons.diagrams.states.andChaptersBindIntoASingleArc") }
  ];
  paintFold(col, caption, states[0]);
  loop(wrap, [
    { at: 2000, run: () => paintFold(col, caption, states[1]) },
    { at: 4000, run: () => paintFold(col, caption, states[2]) },
    { at: 6000, run: () => paintFold(col, caption, states[3]) },
    { at: 8500, run: () => paintFold(col, caption, states[0]) }
  ], 10500);
}
function diagramUnfold(wrap) {
  wrap.appendChild(el("lmb-dg-label", t("ui.lessons.diagrams.diagramUnfold.theShelf")));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);
  const filed = {
    rows: [{ kind: "chapter", label: t("ui.lessons.diagrams.filed.ch3") }],
    caption: t("ui.lessons.diagrams.filed.aChapterCoversMessages3754They")
  };
  const deleted = {
    rows: [{ kind: "msg" }, { kind: "msg" }, { kind: "msg" }, { kind: "msg" }],
    caption: t("ui.lessons.diagrams.deleted.deleteItAndTheMessagesComeRight")
  };
  paintFold(col, caption, filed);
  loop(wrap, [
    { at: 2400, run: () => paintFold(col, caption, deleted) },
    { at: 5400, run: () => paintFold(col, caption, filed) }
  ], 7800);
}
var FADE_CHIPS = [
  t("ui.lessons.diagrams.fadeChips.eliasMaraLovesHerHidesIt"),
  t("ui.lessons.diagrams.fadeChips.captainWronglyBelievesBandits"),
  t("ui.lessons.diagrams.fadeChips.day12SheSawTheFall"),
  t("ui.lessons.diagrams.fadeChips.openThreadTheReceipt")
];
function diagramFade(wrap) {
  wrap.appendChild(el("lmb-dg-label", t("ui.lessons.diagrams.diagramFade.oneSummaryCompressedAgainAndAgain")));
  const tier = el("lmb-dg-tier", t("ui.lessons.diagrams.tier.chapter"));
  wrap.appendChild(tier);
  const card = el("lmb-dg-card");
  for (const w of [88, 74, 81]) {
    const line = el("lmb-dg-line");
    line.style.width = `${w}%`;
    card.appendChild(line);
  }
  wrap.appendChild(card);
  const chips = el("lmb-dg-chips");
  const chipEls = FADE_CHIPS.map((c) => {
    const chip = el("lmb-dg-chip", `◆ ${c}`);
    chips.appendChild(chip);
    return chip;
  });
  wrap.appendChild(chips);
  const caption = el("lmb-dg-caption", t("ui.lessons.diagrams.caption.thePlotSurvivesTheStructuredFactsThin"));
  wrap.appendChild(caption);
  const reset = () => {
    tier.textContent = t("ui.lessons.diagrams.reset.chapter");
    tier.classList.remove("hot");
    chips.classList.remove("kept");
    for (const c of chipEls)
      c.classList.remove("gone");
    caption.textContent = t("ui.lessons.diagrams.reset.thePlotSurvivesTheStructuredFactsThin");
  };
  loop(wrap, [
    { at: 1800, run: () => {
      tier.textContent = t("ui.lessons.diagrams.diagramFade.arc");
      chipEls[0].classList.add("gone");
    } },
    { at: 3400, run: () => {
      chipEls[2].classList.add("gone");
    } },
    { at: 5000, run: () => {
      tier.textContent = t("ui.lessons.diagrams.diagramFade.volume");
      chipEls[1].classList.add("gone");
      chipEls[3].classList.add("gone");
    } },
    {
      at: 6600,
      run: () => {
        tier.textContent = t("ui.lessons.diagrams.diagramFade.withACodex");
        tier.classList.add("hot");
        chips.classList.add("kept");
        for (const c of chipEls)
          c.classList.remove("gone");
        caption.textContent = t("ui.lessons.diagrams.diagramFade.theCodexTracksThemExplicitlyOutsideThe");
      }
    },
    { at: 9600, run: reset }
  ], 10400);
}

// src/ui/lessons/engine.ts
var EXAM_SIZE = 10;
var EXAM_PASS_MAX_WRONG = 1;
function createLessonEngine(deps) {
  let active = null;
  let host = null;
  let stage = null;
  let demoWrap = null;
  let demoStrip = null;
  let demoInner = null;
  let overlay = [];
  let ring = null;
  let hintRing = null;
  let spotTag = null;
  let sheetBody = null;
  let railEl = null;
  let headLabel = null;
  let resizeObs = null;
  let paneObs = null;
  let patchTimer = null;
  let anchorRaf = 0;
  let lastSpotAnchor = null;
  function courseDef(key) {
    return key === "books" ? COURSE_BOOKS : COURSE_CODEX;
  }
  function currentStep() {
    if (!active)
      return null;
    if (active.mode === "exam" && active.phase === "steps") {
      return active.examSet[active.examIdx] ?? null;
    }
    if (active.phase === "steps")
      return active.main[active.sIdx]?.steps[active.tIdx] ?? null;
    if (active.phase === "finale")
      return active.finale?.steps[active.fIdx] ?? null;
    return null;
  }
  function schedulePatch() {
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps")
      return;
    if (patchTimer)
      clearTimeout(patchTimer);
    patchTimer = setTimeout(flushPatch, 400);
  }
  function flushPatch() {
    if (patchTimer) {
      clearTimeout(patchTimer);
      patchTimer = null;
    }
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps")
      return;
    const saved = deps.getState()?.lessons?.[active.key];
    const patch = {
      ...saved?.status === "done" ? {} : { status: "in_progress" },
      section: active.sIdx,
      step: active.tIdx,
      answers: { ...active.answers },
      startedAt: saved?.startedAt ?? Date.now()
    };
    deps.send({ type: "lesson_patch", course: active.key, patch });
    deps.applyLessons(active.key, patch);
  }
  function deepestPresent(path) {
    for (let i = path.length - 1;i >= 0; i--) {
      const a = path[i];
      if (demoWrap?.querySelector(`[data-lesson="${a}"]`))
        return a;
    }
    return path[0];
  }
  function anchorFor(step) {
    if (!step)
      return;
    if (step.kind === "nav") {
      if (active?.doPhase === "done")
        return;
      return deepestPresent(step.path);
    }
    if (step.kind === "do") {
      if (active?.doPhase === "done")
        return step.doneAnchor ?? step.anchor;
      if (step.path)
        return deepestPresent(step.path) ?? step.anchor;
      return step.anchor;
    }
    return step.anchor;
  }
  function navArrived(step) {
    return !!demoWrap?.querySelector(`[data-lesson="${step.arrive}"]`);
  }
  function checkNavArrival(step, fromClick) {
    if (!active || active.doPhase !== "idle")
      return;
    if (!navArrived(step))
      return;
    active.doPhase = "done";
    demoWrap?.classList.remove("lmb-demo-funnel");
    hideSpotlight();
    renderSheet(step);
    if (fromClick) {
      setTimeout(() => {
        if (active && currentStep() === step)
          advance();
      }, 350);
    }
  }
  function shuffled(q) {
    let seed = 0;
    for (let i = 0;i < q.id.length; i++)
      seed = seed * 31 + q.id.charCodeAt(i) >>> 0;
    const arr = q.options.map((o) => ({ text: o.text, correct: !!o.correct }));
    for (let i = arr.length - 1;i > 0; i--) {
      seed = seed * 1103515245 + 12345 >>> 0;
      const j = seed % (i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
  function isActive() {
    return active !== null;
  }
  function start(courseKey, opts) {
    const course = courseDef(courseKey);
    const main = course.sections.filter((s) => s.id !== "finale");
    const finale = course.sections.find((s) => s.id === "finale") ?? null;
    const saved = deps.getState()?.lessons?.[courseKey];
    const base = {
      key: courseKey,
      course,
      mode: opts?.mode === "exam" ? "exam" : "lesson",
      main,
      finale,
      sIdx: 0,
      tIdx: 0,
      fIdx: 0,
      phase: "steps",
      answers: { ...saved?.answers ?? {} },
      fixture: null,
      fixtureStep: null,
      codexFiles: codexFixtureFiles(),
      doPhase: "idle",
      prepFor: null,
      demoTab: null,
      navTab: null,
      examSet: [],
      examIdx: 0,
      signedName: saved?.signedName ?? null,
      wrong: saved?.lastWrong ?? 0,
      grade: saved?.grade ?? "apprentice",
      total: scoredQuestions(course).length,
      completedAt: saved?.completedAt ?? Date.now(),
      viewOnly: false
    };
    if (opts?.mode === "diploma") {
      base.viewOnly = true;
      base.phase = "diploma";
    } else if (opts?.mode === "exam") {
      const pool = scoredQuestions(course);
      const picked = [];
      const used = new Set;
      while (picked.length < Math.min(EXAM_SIZE, pool.length)) {
        const i = Math.floor(Math.random() * pool.length);
        if (used.has(i))
          continue;
        used.add(i);
        picked.push(pool[i]);
      }
      base.examSet = picked;
      base.answers = {};
    } else {
      if (opts?.fresh)
        base.answers = {};
      if (typeof opts?.section === "number") {
        base.sIdx = Math.min(Math.max(0, opts.section), main.length - 1);
        for (const id of allQuestionIds(course, base.sIdx))
          delete base.answers[id];
      } else if (saved?.status === "in_progress") {
        if (saved.section >= main.length) {
          base.phase = "register";
        } else {
          base.sIdx = saved.section;
          base.tIdx = Math.min(saved.step, (main[saved.section]?.steps.length ?? 1) - 1);
        }
      }
    }
    active = base;
    schedulePatch();
    deps.onModeChange();
  }
  function exit() {
    flushPatch();
    if (patchTimer)
      clearTimeout(patchTimer);
    resizeObs?.disconnect();
    resizeObs = null;
    paneObs?.disconnect();
    paneObs = null;
    active = null;
    stage = null;
    demoWrap = null;
    demoStrip = null;
    demoInner = null;
    sheetBody = null;
    railEl = null;
    headLabel = null;
    overlay = [];
    ring = null;
    hintRing = null;
    resetHomeTabLocal();
    resetBooksTabLocal();
    resetCodexTabLocal();
    resetTuningTabLocal();
    setSamplerView("main");
    setPromptsCategory("chapter");
    deps.onModeChange();
  }
  function mount(target) {
    if (!active)
      return;
    if (stage && stage.isConnected && host === target)
      return;
    host = target;
    buildStage();
    renderStep();
  }
  function onHostState() {
    if (!active || !stage)
      return;
    const step = currentStep();
    if (step && step.real) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      if (step.kind === "nav")
        checkNavArrival(step, true);
    }
  }
  function buildStage() {
    if (!host || !active)
      return;
    host.replaceChildren();
    stage = document.createElement("div");
    stage.className = "lmb-lesson-stage";
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-label", active.course.title);
    const head = document.createElement("div");
    head.className = "lmb-lesson-head";
    const title = document.createElement("span");
    title.className = "lmb-lesson-title";
    title.textContent = active.mode === "exam" ? t("ui.lessons.engine.buildStage.exam", { title: active.course.title }) : active.course.title;
    headLabel = document.createElement("span");
    headLabel.className = "lmb-lesson-headlabel";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "lmb-lesson-close";
    close.textContent = t("ui.lessons.engine.buildStage.value");
    close.title = active.mode === "exam" ? t("ui.lessons.engine.buildStage.leaveTheExamAnUnfinishedExamIs") : deps.getState()?.lessons?.[active.key]?.status === "done" ? t("ui.lessons.engine.buildStage.leaveAnytimeYourDiplomaAndPreviousGrade") : t("ui.lessons.engine.buildStage.leaveTheLessonProgressIsSaved");
    close.setAttribute("aria-label", t("ui.lessons.engine.buildStage.leaveTheLesson"));
    close.addEventListener("click", exit);
    head.append(title, headLabel, close);
    railEl = document.createElement("div");
    railEl.className = "lmb-lesson-rail";
    demoWrap = document.createElement("div");
    demoWrap.className = "lmb-lesson-demo";
    demoStrip = document.createElement("div");
    demoStrip.className = "lmb-lesson-demostrip";
    demoStrip.style.display = "none";
    demoWrap.appendChild(demoStrip);
    demoInner = document.createElement("div");
    demoInner.className = "lmb-lesson-demo-inner";
    demoWrap.appendChild(demoInner);
    for (let i = 0;i < 4; i++) {
      const p = document.createElement("div");
      p.className = "lmb-spot-panel";
      p.style.display = "none";
      demoWrap.appendChild(p);
      overlay.push(p);
    }
    ring = document.createElement("div");
    ring.className = "lmb-spot-ring";
    ring.style.display = "none";
    demoWrap.appendChild(ring);
    hintRing = document.createElement("div");
    hintRing.className = "lmb-spot-hint";
    hintRing.style.display = "none";
    demoWrap.appendChild(hintRing);
    spotTag = document.createElement("div");
    spotTag.className = "lmb-spot-tag";
    spotTag.style.display = "none";
    demoWrap.appendChild(spotTag);
    demoWrap.addEventListener("click", () => {
      const step = currentStep();
      if (!active || !step || step.kind !== "nav" || active.doPhase !== "idle")
        return;
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!active || currentStep() !== step)
            return;
          scheduleAnchor(anchorFor(step), false);
          checkNavArrival(step, true);
        }, 40);
      });
    });
    const sheet = document.createElement("div");
    sheet.className = "lmb-lesson-sheet";
    const grab = document.createElement("button");
    grab.type = "button";
    grab.className = "lmb-lesson-grab";
    grab.setAttribute("aria-label", t("ui.lessons.engine.buildStage.collapseTheDialogue"));
    grab.addEventListener("click", () => sheet.classList.toggle("collapsed"));
    sheetBody = document.createElement("div");
    sheetBody.className = "lmb-lesson-sheet-body";
    sheet.append(grab, sheetBody);
    stage.append(head, railEl, demoWrap, sheet);
    host.appendChild(stage);
    resizeObs?.disconnect();
    resizeObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    resizeObs.observe(demoWrap);
    demoInner.addEventListener("scroll", () => scheduleAnchor(anchorFor(currentStep()), false), { passive: true });
  }
  function renderRail() {
    if (!railEl || !active)
      return;
    railEl.replaceChildren();
    if (active.mode === "exam") {
      const label = document.createElement("span");
      label.className = "lmb-lesson-headlabel";
      label.textContent = active.phase === "steps" ? t("ui.lessons.engine.renderRail.questionOf", { examIdx1: active.examIdx + 1, length: active.examSet.length }) : "";
      railEl.appendChild(label);
      return;
    }
    const nodes = active.main.length + (active.finale ? 1 : 0);
    for (let i = 0;i < nodes; i++) {
      const node = document.createElement("span");
      const isFinale = i >= active.main.length;
      const done = active.phase !== "steps" ? isFinale ? active.phase === "diploma" : true : i < active.sIdx;
      const current = active.phase === "steps" ? i === active.sIdx : active.phase === "finale" && isFinale;
      node.className = `lmb-rail-node${done ? " done" : ""}${current ? " current" : ""}`;
      const sec = isFinale ? active.finale : active.main[i];
      node.title = sec.title;
      railEl.appendChild(node);
    }
    if (headLabel) {
      if (active.phase === "steps") {
        const sec = active.main[active.sIdx];
        headLabel.textContent = sec ? `${roman(active.sIdx + 1)} · ${sec.title}` : "";
      } else if (active.phase === "finale") {
        headLabel.textContent = active.finale?.title ?? "";
      } else {
        headLabel.textContent = "";
      }
    }
  }
  function roman(n) {
    const table = [[10, "X"], [9, t("ui.lessons.engine.table.ix")], [5, "V"], [4, t("ui.lessons.engine.table.iv")], [1, "I"]];
    let out = "";
    let v = n;
    for (const [num, sym] of table) {
      while (v >= num) {
        out += sym;
        v -= num;
      }
    }
    return out;
  }
  function fixtureFor(step) {
    if (!active)
      return null;
    if (step.fixture && active.fixtureStep !== step) {
      const s = buildFixture(step.fixture.variant);
      step.fixture.patch?.(s);
      active.fixture = s;
      active.fixtureStep = step;
    }
    return active.fixture;
  }
  function makeSandboxSend(step) {
    return (m) => {
      if (!active)
        return;
      if (m.type === "codex_set_file_state") {
        const fx = active.fixture;
        if (fx) {
          const states = { ...fx.codexFileStates };
          if (m.state === "on")
            delete states[m.file];
          else
            states[m.file] = m.state;
          fx.codexFileStates = states;
          if (m.state !== "frozen")
            fx.codexStaleFiles = fx.codexStaleFiles.filter((f) => f !== m.file);
        }
        if (m.seq !== undefined)
          deliverCodexFileState(m.chatId, m.file, m.seq);
        if (step.kind === "do" && step.expect === "codex_set_file_state" && active.doPhase === "idle") {
          markDoDone(step);
        }
        scheduleDemoRerender(step);
        return;
      }
      if (step.kind === "do" && m.type === step.expect && active.doPhase === "idle") {
        runDoScript(step, m);
        return;
      }
      if (m.type === "codex_read") {
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0);
        scheduleDemoRerender(step);
        return;
      }
      if (m.type === "codex_write_file") {
        active.codexFiles = { ...active.codexFiles, [m.file]: m.content };
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0, m.file, m.seq);
        showToast("success", t("ui.lessons.engine.makeSandboxSend.memoriaSavedJson", { file: m.file }));
        scheduleDemoRerender(step);
        return;
      }
      if (m.type === "edit_preview" || m.type === "watch_stream" || m.type === "lesson_patch")
        return;
      shimmer();
    };
  }
  function runDoScript(step, m) {
    if (!active)
      return;
    if (m.type === "create_chapter") {
      const fx = active.fixture;
      if (!fx) {
        markDoDone(step);
        return;
      }
      active.doPhase = "running";
      fx.busy = [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: t("ui.lessons.engine.runDoScript.memoriaIsFilingAChapter1s"), startedAt: Date.now() }];
      scheduleDemoRerender(step);
      showToast("info", t("ui.lessons.engine.runDoScript.memoriaOpensAFreshPageForYou"));
      setTimeout(() => {
        if (!active || currentStep() !== step)
          return;
        const cur = active.fixture;
        if (cur) {
          cur.busy = [];
          applyFiledChapter(cur);
        }
        showToast("success", t("ui.lessons.engine.runDoScript.memoriaSlidTheChapterOntoYourShelf"));
        markDoDone(step);
        scheduleDemoRerender(step);
      }, 1400);
      return;
    }
    if (m.type === "codex_write_file") {
      active.codexFiles = { ...active.codexFiles, [m.file]: m.content };
      deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0, m.file, m.seq);
      showToast("success", t("ui.lessons.engine.runDoScript.memoriaSavedJson", { file: m.file }));
      markDoDone(step);
      scheduleDemoRerender(step);
      return;
    }
    markDoDone(step);
  }
  function markDoDone(step) {
    if (!active)
      return;
    active.doPhase = "done";
    renderSheet(step);
    if (step.doneAnchor)
      scheduleAnchor(step.doneAnchor);
  }
  function shimmer() {
    if (!demoWrap)
      return;
    demoWrap.classList.remove("lmb-shimmer");
    demoWrap.offsetWidth;
    demoWrap.classList.add("lmb-shimmer");
  }
  function makeSandboxCtx() {
    const base = deps.ctx;
    const baseUi = base["ui"] ?? {};
    const fake = {
      ...base,
      ui: {
        ...baseUi,
        showConfirm: async () => ({ confirmed: true }),
        showModal: (opts) => makeStageModal(opts?.title ?? "")
      }
    };
    return fake;
  }
  function makeStageModal(title) {
    const overlayEl = document.createElement("div");
    overlayEl.className = "lmb-lesson-modal";
    const card = document.createElement("div");
    card.className = "lmb-lesson-modal-card";
    const head = document.createElement("div");
    head.className = "lmb-seal-title";
    head.textContent = title;
    const root = document.createElement("div");
    card.append(head, root);
    overlayEl.appendChild(card);
    (stage ?? document.body).appendChild(overlayEl);
    let dismissCb = null;
    const dismiss = () => {
      overlayEl.remove();
      dismissCb?.();
    };
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl)
        dismiss();
    });
    return { root, dismiss, onDismiss: (cb) => {
      dismissCb = cb;
    } };
  }
  function renderDemoStrip(current) {
    if (!demoStrip)
      return;
    demoStrip.replaceChildren();
    if (!current) {
      demoStrip.style.display = "none";
      return;
    }
    demoStrip.style.display = "";
    for (const t of APP_TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `lmb-demo-tab${t.key === current ? " active" : ""}`;
      lessonMark(btn, `tab.${t.key}`);
      const icon = document.createElement("span");
      icon.className = "lmb-demo-tab-icon";
      icon.innerHTML = t.icon;
      const label = document.createElement("span");
      label.className = "lmb-demo-tab-label";
      label.textContent = t.label;
      btn.append(icon, label);
      btn.addEventListener("click", () => {
        if (!active)
          return;
        const step = currentStep();
        if (!step)
          return;
        active.navTab = t.key;
        renderDemoFor(step);
        scheduleAnchor(anchorFor(step), false);
      });
      demoStrip.appendChild(btn);
    }
  }
  function renderDemoFor(step) {
    if (!demoInner || !active)
      return;
    const tab = active.navTab ?? step.tab ?? active.demoTab;
    if (!tab)
      return;
    active.demoTab = tab;
    renderDemoStrip(tab);
    const real = step.real === true;
    const state = real ? deps.getState() : fixtureFor(step);
    if (!state) {
      demoInner.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "lmb-empty";
      empty.textContent = real ? t("ui.lessons.engine.renderDemoFor.noChatIsOpenRightNowSkip") : "";
      demoInner.appendChild(empty);
      return;
    }
    if (active.prepFor !== step) {
      step.prep?.();
      active.prepFor = step;
    }
    const send = real ? (m) => {
      deps.send(m);
      if (step.kind === "do" && m.type === step.expect && active.doPhase !== "done")
        markDoDone(step);
    } : makeSandboxSend(step);
    const ctx = real ? deps.ctx : makeSandboxCtx();
    demoInner.replaceChildren();
    const pane = document.createElement("div");
    pane.className = "lmb-root lmb-lesson-demo-root";
    demoInner.appendChild(pane);
    paneObs?.disconnect();
    paneObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    paneObs.observe(pane);
    switch (tab) {
      case "home":
        renderHomeTab(pane, state, ctx, send);
        break;
      case "books":
        renderBooksTab(pane, state, ctx, send);
        break;
      case "codex":
        renderCodexTab(pane, state, ctx, send);
        break;
      case "tuning":
        renderTuningTab(pane, state, ctx, send);
        break;
      case "stuff":
        renderAboutTab(pane, state, send);
        break;
    }
    demoInner.removeAttribute("inert");
    demoWrap?.classList.toggle("lmb-demo-funnel", step.kind === "nav" && active.doPhase === "idle");
  }
  function scheduleDemoRerender(step) {
    requestAnimationFrame(() => {
      if (!active || currentStep() !== step)
        return;
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      if (step.kind === "nav")
        checkNavArrival(step, true);
    });
  }
  function renderCover(subtitle) {
    if (!demoInner || !active)
      return;
    demoInner.replaceChildren();
    demoInner.removeAttribute("inert");
    demoWrap?.classList.remove("lmb-demo-funnel");
    renderDemoStrip(null);
    hideSpotlight();
    const cover = document.createElement("div");
    cover.className = "lmb-lesson-cover";
    cover.appendChild(memoriaSprite(96));
    const title = document.createElement("div");
    title.className = "lmb-lesson-cover-title";
    title.textContent = active.course.title;
    const orn = document.createElement("div");
    orn.className = "lmb-lesson-cover-orn";
    orn.textContent = t("ui.lessons.engine.renderCover.value");
    cover.append(title, orn);
    const secTitle = subtitle ?? (active.mode === "lesson" && active.phase === "steps" ? active.main[active.sIdx]?.title : undefined);
    if (secTitle) {
      const sec = document.createElement("div");
      sec.className = "lmb-lesson-cover-sec";
      sec.textContent = secTitle;
      cover.appendChild(sec);
    }
    demoInner.appendChild(cover);
  }
  function demoIsShowing() {
    return !!demoInner?.querySelector(".lmb-lesson-demo-root, .lmb-lesson-diagram");
  }
  function scheduleAnchor(anchor, scroll = true) {
    cancelAnimationFrame(anchorRaf);
    anchorRaf = requestAnimationFrame(() => positionSpotlight(anchor, scroll));
  }
  function hideSpotlight() {
    for (const p of overlay)
      p.style.display = "none";
    if (ring)
      ring.style.display = "none";
    if (hintRing)
      hintRing.style.display = "none";
    if (spotTag)
      spotTag.style.display = "none";
  }
  function positionSpotlight(anchor, scroll) {
    if (!demoWrap || !demoInner)
      return;
    if (!anchor) {
      hideSpotlight();
      return;
    }
    const target = demoWrap.querySelector(`[data-lesson="${anchor}"]`);
    if (!target) {
      hideSpotlight();
      return;
    }
    const focusMoved = anchor !== lastSpotAnchor;
    lastSpotAnchor = anchor;
    if ((scroll || focusMoved) && demoInner.contains(target)) {
      const cRect = demoInner.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      if (tRect.height > cRect.height * 0.75) {
        demoInner.scrollTop += tRect.top - cRect.top - 10;
      } else {
        demoInner.scrollTop += tRect.top + tRect.height / 2 - (cRect.top + cRect.height / 2);
      }
    }
    const c = demoWrap.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const pad = 5;
    const top = Math.max(0, r.top - c.top - pad);
    const left = Math.max(0, r.left - c.left - pad);
    const right = Math.min(c.width, r.right - c.left + pad);
    const bottom = Math.min(c.height, r.bottom - c.top + pad);
    const [pT, pL, pR, pB] = overlay;
    Object.assign(pT.style, { display: "", top: "0", left: "0", right: "0", height: `${top}px` });
    Object.assign(pB.style, { display: "", top: `${bottom}px`, left: "0", right: "0", bottom: "0", height: "auto" });
    Object.assign(pL.style, { display: "", top: `${top}px`, left: "0", width: `${left}px`, height: `${bottom - top}px` });
    Object.assign(pR.style, { display: "", top: `${top}px`, left: `${right}px`, right: "0", width: "auto", height: `${bottom - top}px` });
    if (ring) {
      Object.assign(ring.style, {
        display: "",
        top: `${top}px`,
        left: `${left}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`
      });
    }
    if (hintRing) {
      const hint = currentStep()?.hintAnchor;
      const hintEl = hint ? demoWrap.querySelector(`[data-lesson="${hint}"]`) : null;
      if (!hintEl) {
        hintRing.style.display = "none";
      } else {
        const h = hintEl.getBoundingClientRect();
        const hT = Math.max(0, h.top - c.top - 3);
        const hL = Math.max(0, h.left - c.left - 3);
        const hR = Math.min(c.width, h.right - c.left + 3);
        const hB = Math.min(c.height, h.bottom - c.top + 3);
        Object.assign(hintRing.style, {
          display: "",
          top: `${hT}px`,
          left: `${hL}px`,
          width: `${hR - hL}px`,
          height: `${hB - hT}px`
        });
      }
    }
    if (spotTag) {
      const step = currentStep();
      const chip = step?.kind === "quiz" ? step.chip : step?.kind === "nav" && active?.doPhase === "idle" ? "tap" : undefined;
      if (chip) {
        spotTag.textContent = t("ui.lessons.engine.positionSpotlight.value", { chip });
        spotTag.style.display = "";
        const tagTop = top - 27;
        spotTag.style.top = tagTop < 4 ? `${bottom + 7}px` : `${tagTop}px`;
        spotTag.style.left = `${Math.max(4, left)}px`;
      } else {
        spotTag.style.display = "none";
      }
    }
  }
  function renderStep() {
    if (!active || !stage)
      return;
    renderRail();
    if (active.phase === "register") {
      renderCover(t("ui.lessons.engine.renderStep.signTheRegister"));
      if (sheetBody) {
        renderRegister(sheetBody, active.signedName ?? "", onSigned);
      }
      return;
    }
    if (active.phase === "diploma") {
      hideSpotlight();
      renderDemoStrip(null);
      if (demoInner)
        demoInner.replaceChildren();
      renderDiplomaPhase();
      return;
    }
    const step = currentStep();
    if (!step) {
      advance();
      return;
    }
    if (!stepApplies(step)) {
      advance();
      return;
    }
    active.doPhase = "idle";
    active.navTab = null;
    demoWrap?.classList.remove("lmb-demo-funnel");
    if (step.kind === "nav") {
      if (!step.tab && !active.demoTab)
        active.demoTab = lastTabBefore() ?? "home";
      renderDemoFor(step);
      renderSheet(step);
      scheduleAnchor(anchorFor(step));
      checkNavArrival(step, false);
      return;
    }
    if (step.tab) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
    } else if (step.diagram) {
      if (demoInner) {
        renderDiagram(demoInner, step.diagram);
        demoInner.setAttribute("inert", "");
        renderDemoStrip(null);
      }
      hideSpotlight();
    } else if (demoIsShowing()) {
      scheduleAnchor(step.anchor);
    } else {
      renderCover();
    }
    renderSheet(step);
  }
  function renderSheet(step) {
    if (!sheetBody || !active)
      return;
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const content = document.createElement("div");
    content.className = "lmb-lesson-content";
    row.appendChild(content);
    sheetBody.appendChild(row);
    if (step.kind === "quiz") {
      renderQuiz(content, step);
      return;
    }
    const done = active.doPhase === "done";
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = step.kind === "do" && done && step.done ? step.done : step.kind === "nav" && done ? step.done ?? t("ui.lessons.engine.renderSheet.rightWhereWeNeedToBe") : step.text;
    text.setAttribute("aria-live", "polite");
    content.appendChild(text);
    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";
    nav.appendChild(makeButton(t("ui.lessons.engine.renderSheet.back"), back, { small: true, disabled: atStart() || active.mode === "exam" }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.appendChild(spacer);
    if ((step.kind === "do" || step.kind === "nav") && !done) {
      if (step.optional && active.doPhase === "idle") {
        nav.appendChild(makeButton(t("ui.lessons.engine.renderSheet.skip"), advance, { small: true }));
      }
      const hint = document.createElement("span");
      hint.className = "lmb-lesson-waiting";
      hint.textContent = active.doPhase === "running" ? t("ui.lessons.engine.renderSheet.working") : t("ui.lessons.engine.renderSheet.yourMove");
      nav.appendChild(hint);
    } else {
      nav.appendChild(makeButton(t("ui.lessons.engine.renderSheet.next"), advance, { small: true, primary: true }));
    }
    content.appendChild(nav);
  }
  function renderQuiz(content, q) {
    if (!active)
      return;
    const already = active.mode === "lesson" && active.answers[q.id];
    const stem = document.createElement("div");
    stem.className = "lmb-lesson-text";
    stem.textContent = q.text;
    content.appendChild(stem);
    if (q.exhibit) {
      const ex = document.createElement("div");
      ex.className = `lmb-lesson-exhibit ${q.exhibitTone ?? "info"}`;
      ex.textContent = q.exhibit;
      content.appendChild(ex);
    }
    const verdict = document.createElement("div");
    verdict.className = "lmb-lesson-verdict";
    verdict.setAttribute("aria-live", "polite");
    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";
    if (already) {
      const note = document.createElement("div");
      note.className = "lmb-lesson-why";
      note.textContent = already === "gold" ? t("ui.lessons.engine.renderQuiz.alreadyStampedGoldFromTheExamOr") : t("ui.lessons.engine.renderQuiz.answeredOnAnEarlierPass");
      content.appendChild(note);
      nav.appendChild(makeButton(t("ui.lessons.engine.renderQuiz.back"), back, { small: true, disabled: atStart() || active.mode === "exam" }));
      const spacer = document.createElement("span");
      spacer.className = "lmb-spacer";
      nav.appendChild(spacer);
      nav.appendChild(makeButton(t("ui.lessons.engine.renderQuiz.next"), advance, { small: true, primary: true }));
      content.appendChild(nav);
      return;
    }
    const group = document.createElement("div");
    group.className = "lmb-lesson-options";
    group.setAttribute("role", "radiogroup");
    const options = shuffled(q);
    let locked = false;
    const btns = [];
    options.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-lesson-option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.textContent = o.text;
      btn.addEventListener("click", () => {
        if (locked)
          return;
        locked = true;
        btn.setAttribute("aria-checked", "true");
        const answer = o.correct ? "gold" : "silver";
        recordAnswer(q, answer);
        for (const b of btns) {
          b.disabled = true;
          const wasCorrect = options[btns.indexOf(b)].correct;
          if (wasCorrect)
            b.classList.add("correct");
        }
        if (!o.correct)
          btn.classList.add("wrong");
        verdict.textContent = o.correct ? t("ui.lessons.engine.renderQuiz.filed") : t("ui.lessons.engine.renderQuiz.notQuite");
        verdict.classList.add(o.correct ? "ok" : "miss");
        const why = document.createElement("div");
        why.className = "lmb-lesson-why";
        why.textContent = q.why;
        content.insertBefore(why, nav);
        skipLink.remove();
        nav.appendChild(makeButton(t("ui.lessons.engine.renderQuiz.continue"), advance, { small: true, primary: true }));
      });
      btns.push(btn);
      group.appendChild(btn);
    });
    content.appendChild(group);
    content.appendChild(verdict);
    const skipLink = document.createElement("button");
    skipLink.type = "button";
    skipLink.className = "lmb-lesson-skip";
    skipLink.textContent = t("ui.lessons.engine.renderQuiz.skipMarkForRevisit");
    skipLink.addEventListener("click", () => {
      if (locked)
        return;
      locked = true;
      recordAnswer(q, "skip");
      advance();
    });
    nav.appendChild(makeButton(t("ui.lessons.engine.renderQuiz.back"), back, { small: true, disabled: atStart() || active.mode === "exam" }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.append(spacer, skipLink);
    content.appendChild(nav);
    if (q.anchor || q.tab) {
      const peek = document.createElement("button");
      peek.type = "button";
      peek.className = "lmb-lesson-peek";
      peek.textContent = t("ui.lessons.engine.renderQuiz.holdToPeekAtThePane");
      const sheet = sheetBody?.parentElement;
      const down = () => sheet?.classList.add("peeking");
      const up = () => sheet?.classList.remove("peeking");
      peek.addEventListener("pointerdown", down);
      peek.addEventListener("pointerup", up);
      peek.addEventListener("pointercancel", up);
      peek.addEventListener("pointerleave", up);
      content.appendChild(peek);
    }
  }
  function recordAnswer(q, answer) {
    if (!active)
      return;
    active.answers[q.id] = answer;
    schedulePatch();
  }
  function atStart() {
    if (!active)
      return true;
    if (active.mode === "exam")
      return active.examIdx === 0;
    if (active.phase === "finale")
      return active.fIdx === 0;
    return active.sIdx === 0 && active.tIdx === 0;
  }
  function stepApplies(step) {
    if (!step)
      return false;
    if (step.onlyFreshInstall && !(deps.getState()?.lessons?.freshInstall ?? false))
      return false;
    return true;
  }
  function lastTabBefore() {
    if (!active)
      return null;
    if (active.phase === "finale") {
      const steps = active.finale?.steps ?? [];
      for (let t = Math.min(active.fIdx, steps.length - 1);t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab)
          return tab;
      }
      return null;
    }
    for (let s = active.sIdx;s >= 0; s--) {
      const steps = active.main[s]?.steps ?? [];
      const from = s === active.sIdx ? Math.min(active.tIdx, steps.length - 1) : steps.length - 1;
      for (let t = from;t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab)
          return tab;
      }
    }
    return null;
  }
  function back() {
    if (!active || atStart())
      return;
    if (active.mode === "exam")
      return;
    for (let guard = 0;guard < 50; guard++) {
      if (atStart())
        break;
      if (active.phase === "finale") {
        active.fIdx = Math.max(0, active.fIdx - 1);
      } else if (active.tIdx > 0) {
        active.tIdx--;
      } else {
        active.sIdx--;
        active.tIdx = Math.max(0, (active.main[active.sIdx]?.steps.length ?? 1) - 1);
      }
      if (stepApplies(currentStep()))
        break;
    }
    renderStep();
  }
  function advance() {
    if (!active)
      return;
    if (active.mode === "exam") {
      active.examIdx++;
      if (active.examIdx >= active.examSet.length) {
        finishExam();
        return;
      }
      renderStep();
      return;
    }
    if (active.phase === "finale") {
      active.fIdx++;
      if (!active.finale || active.fIdx >= active.finale.steps.length) {
        active.phase = "diploma";
      }
      renderStep();
      return;
    }
    const section = active.main[active.sIdx];
    if (!section) {
      enterRegister();
      return;
    }
    active.tIdx++;
    if (active.tIdx >= section.steps.length) {
      active.sIdx++;
      active.tIdx = 0;
      if (active.sIdx >= active.main.length) {
        enterRegister();
        return;
      }
    }
    schedulePatch();
    renderStep();
  }
  function enterRegister() {
    if (!active)
      return;
    flushPatch();
    active.phase = "register";
    renderStep();
  }
  function onSigned(name) {
    if (!active)
      return;
    active.signedName = name;
    if (active.mode === "lesson") {
      const scored = scoredQuestions(active.course);
      active.wrong = scored.filter((s) => {
        const a = active.answers[s.id];
        return a !== undefined && a !== "gold";
      }).length;
      active.total = scored.length;
    }
    active.grade = active.mode === "exam" ? active.wrong === 0 ? "gilded" : "silver" : lessonGradeForWrong(active.wrong);
    active.completedAt = Date.now();
    deps.send({
      type: "lesson_complete",
      course: active.key,
      wrong: active.wrong,
      total: active.total,
      grade: active.grade,
      signedName: active.signedName,
      answers: active.answers
    });
    deps.applyLessons(active.key, {
      status: "done",
      grade: active.grade,
      lastWrong: active.wrong,
      lastTotal: active.total,
      signedName: active.signedName,
      completedAt: active.completedAt,
      answers: { ...active.answers }
    });
    active.phase = active.finale ? "finale" : "diploma";
    active.fIdx = 0;
    renderStep();
  }
  function finishExam() {
    if (!active)
      return;
    const wrong = active.examSet.filter((q) => active.answers[q.id] !== "gold").length;
    if (wrong <= EXAM_PASS_MAX_WRONG) {
      active.wrong = wrong;
      active.total = active.examSet.length;
      active.mode = "lesson";
      active.phase = "register";
      active.grade = wrong === 0 ? "gilded" : "silver";
      active.completedAt = Date.now();
      deps.send({
        type: "lesson_complete",
        course: active.key,
        wrong,
        total: active.total,
        grade: active.grade,
        signedName: null,
        answers: active.answers
      });
      deps.applyLessons(active.key, {
        status: "done",
        grade: active.grade,
        lastWrong: wrong,
        lastTotal: active.total,
        completedAt: active.completedAt,
        answers: { ...active.answers }
      });
      renderStepExamPass();
      return;
    }
    const gold = {};
    for (const q of active.examSet) {
      if (active.answers[q.id] === "gold")
        gold[q.id] = "gold";
    }
    const key = active.key;
    const failPatch = { status: "in_progress", section: 0, step: 0, answers: gold };
    deps.send({ type: "lesson_patch", course: key, patch: failPatch });
    deps.applyLessons(key, failPatch);
    const correct = active.examSet.length - wrong;
    active.mode = "lesson";
    active.answers = gold;
    active.sIdx = 0;
    active.tIdx = 0;
    active.phase = "steps";
    renderStep();
    showToast("info", t("ui.lessons.engine.finishExam.ofThePassedTopicsStayStampedWhile", { correct, length: active.examSet.length }));
  }
  function renderStepExamPass() {
    if (!active || !sheetBody)
      return;
    renderRail();
    renderCover(t("ui.lessons.engine.renderStepExamPass.signTheRegister"));
    renderRegister(sheetBody, active.signedName ?? "", (name) => {
      if (!active)
        return;
      active.signedName = name;
      deps.send({ type: "lesson_patch", course: active.key, patch: { signedName: name } });
      deps.applyLessons(active.key, { signedName: name });
      active.phase = active.finale ? "finale" : "diploma";
      active.fIdx = 0;
      renderStep();
    });
  }
  function renderDiplomaPhase() {
    if (!active || !sheetBody)
      return;
    const saved = deps.getState()?.lessons?.[active.key];
    const data = {
      courseTitle: active.course.title,
      name: (active.viewOnly ? saved?.signedName : active.signedName) ?? saved?.signedName ?? t("ui.lessons.engine.data.reader"),
      grade: active.viewOnly ? saved?.grade ?? active.grade : active.grade,
      wrong: active.viewOnly ? saved?.lastWrong ?? active.wrong : active.wrong,
      total: active.viewOnly ? saved?.lastTotal ?? active.total : active.total,
      completedAt: active.viewOnly ? saved?.completedAt ?? active.completedAt : active.completedAt
    };
    const actions = [];
    if (!active.viewOnly && active.key === "books") {
      actions.push({ label: t("ui.lessons.engine.renderDiplomaPhase.enterTheArchive"), onClick: exit, primary: true });
    } else if (!active.viewOnly) {
      actions.push({ label: t("ui.lessons.engine.renderDiplomaPhase.openTheCodex"), onClick: exit, primary: true });
    } else {
      actions.push({ label: t("ui.lessons.engine.renderDiplomaPhase.close"), onClick: exit, primary: true });
    }
    if (demoInner) {
      demoInner.replaceChildren();
      demoInner.removeAttribute("inert");
      renderDiploma(demoInner, data, actions);
    }
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = active.viewOnly ? t("ui.lessons.engine.renderDiplomaPhase.yourDiplomaAsFiledInTheAcademy") : t("ui.lessons.engine.renderDiplomaPhase.signedStampedAndShelvedCongratulationsNyaa");
    row.appendChild(text);
    sheetBody.appendChild(row);
  }
  return { isActive, start, mount, onHostState, exit };
}

// src/ui/app.ts
var FONT_LINK_ID = "lmb-deco-fonts";
function ensureDecoFonts() {
  if (document.getElementById(FONT_LINK_ID))
    return;
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Marcellus&family=Josefin+Sans:ital,wght@0,400;0,600;1,400&display=swap";
  document.head.append(preconnect, link);
}
function setup(ctx) {
  let context = { view: "startup" };
  const diagnostics = createUiDiagnostics({ send: (message) => ctx.sendToBackend(message), context: () => context });
  setUiDiagnostics(diagnostics);
  const unobserve = observeUiDiagnostics(diagnostics, import.meta.url);
  diagnostics.capabilities();
  try {
    const cleanup = setupApp(ctx, diagnostics, (next) => {
      context = next;
    });
    return () => {
      try {
        cleanup();
      } catch (error) {
        diagnostics.record("error", { code: uiErrorCode(error) });
        throw error;
      } finally {
        unobserve();
        diagnostics.dispose();
        setUiDiagnostics(null);
      }
    };
  } catch (error) {
    diagnostics.record("error", { code: uiErrorCode(error) });
    unobserve();
    diagnostics.dispose();
    setUiDiagnostics(null);
    throw error;
  }
}
function setupApp(ctx, diagnostics, setContext) {
  ensureDecoFonts();
  ctx.dom.addStyle(STYLES);
  const tab = ctx.ui.registerDrawerTab({
    id: "lumi_books_tab",
    title: t("ui.app.tab.lumiBooks"),
    shortName: t("ui.app.tab.books"),
    description: t("ui.app.tab.memoriaFilesYourChatIntoChaptersAnd"),
    keywords: ["lumibooks", t("ui.app.tab.lumiBooks2"), "memoria", "memory", "chapters", "arcs", "summary", "codex"],
    headerTitle: t("ui.app.tab.lumiBooks"),
    iconSvg: ICON_SVG
  });
  const root = document.createElement("div");
  root.className = "lmb-root";
  tab.root.appendChild(root);
  const strip = document.createElement("div");
  strip.className = "lmb-tabstrip";
  root.appendChild(strip);
  const loadNotice = document.createElement("div");
  loadNotice.className = "lmb-load-notice";
  loadNotice.setAttribute("role", "status");
  root.appendChild(loadNotice);
  const transferHost = document.createElement("div");
  transferHost.hidden = true;
  root.appendChild(transferHost);
  const content = document.createElement("div");
  content.className = "lmb-tab-content";
  root.appendChild(content);
  let activeTab = "home";
  let lastState = null;
  let renderPending = false;
  let disposed = false;
  let loadTimer;
  let handshakeRetries = 0;
  const tabButtons = new Map;
  const send = (msg) => {
    if (msg.type === "save_settings" && typeof msg.patch.localLogsDisabled === "boolean")
      diagnostics.setEnabled(!msg.patch.localLogsDisabled);
    if (msg.type === "diagnostics_clear")
      diagnostics.clear();
    else if (msg.type === "diagnostics_export")
      diagnostics.flush();
    else
      diagnostics.record("send", { op: msg.type });
    if (msg.type === "summary_export" || msg.type === "summary_import") {
      transferPanel.deliver({ id: "local", chatId: msg.chatId, stage: "working", text: msg.type === "summary_export" ? t("ui.app.send.preparingSummaryExport") : t("ui.app.send.checkingSummaryCoverage") });
    }
    try {
      ctx.sendToBackend(msg);
    } catch (error) {
      diagnostics.record("error", { op: msg.type, code: uiErrorCode(error) });
      throw error;
    }
  };
  const transferPanel = createSummaryTransferPanel(transferHost, send);
  const onLocalTransfer = (event) => transferPanel.deliver(event.detail);
  document.addEventListener("lmb-summary-transfer", onLocalTransfer);
  const clearLoadTimer = () => {
    clearTimeout(loadTimer);
    loadTimer = undefined;
  };
  const showLoadNotice = (text, loading = false) => {
    loadNotice.replaceChildren();
    loadNotice.hidden = !text;
    if (!text)
      return;
    if (loading) {
      const spinner = document.createElement("span");
      spinner.className = "lmb-spinner";
      spinner.setAttribute("aria-hidden", "true");
      loadNotice.appendChild(spinner);
    }
    loadNotice.append(document.createTextNode(text));
    if (!loading)
      loadNotice.appendChild(makeButton(t("ui.app.showLoadNotice.retry"), () => requestState("refresh")));
  };
  const requestState = (type) => {
    if (disposed)
      return;
    clearLoadTimer();
    if (!lastState)
      showLoadNotice(t("ui.app.requestState.loadingLumiBooks"), true);
    loadTimer = setTimeout(() => {
      if (disposed || lastState)
        return;
      diagnostics.record("timeout", { code: "state", op: type });
      if (handshakeRetries++ < 2)
        requestState("ready");
      else
        showLoadNotice(t("ui.app.requestState.lumiBooksHasnTRespondedYouCanRetry"));
    }, 5000);
    try {
      send({ type, chatId: null });
    } catch (err) {
      clearLoadTimer();
      showLoadNotice(t("ui.app.requestState.couldNotLoadLumiBooks", { string: String(err) }));
    }
  };
  const engine = createLessonEngine({
    ctx,
    send,
    getState: () => lastState,
    onModeChange: () => {
      refreshTabStyles();
      doRender();
    },
    applyLessons: (course, patch) => {
      if (!lastState)
        return;
      const cur = lastState.lessons[course];
      lastState = {
        ...lastState,
        lessons: {
          ...lastState.lessons,
          [course]: {
            ...cur,
            ...patch,
            answers: patch.answers ? { ...cur.answers, ...patch.answers } : cur.answers
          }
        }
      };
    }
  });
  const viewMode = () => {
    if (engine.isActive())
      return "lesson";
    if (lastState && lastState.lessons && lastState.lessons.books.status !== "done" && !lastState.lessons.booksSealSkipped) {
      return "sealed";
    }
    return "tabs";
  };
  const refreshTabStyles = () => {
    for (const [key, btn] of tabButtons) {
      btn.classList.toggle("active", key === activeTab);
    }
    strip.style.display = engine.isActive() ? "none" : "";
  };
  for (const t of APP_TABS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-tab";
    const icon = document.createElement("span");
    icon.className = "lmb-tab-icon";
    icon.innerHTML = t.icon;
    const label = document.createElement("span");
    label.className = "lmb-tab-label";
    label.textContent = t.label;
    btn.append(icon, label);
    btn.addEventListener("click", () => {
      activeTab = t.key;
      setContext({ chatId: lastState?.activeChatId, view: activeTab });
      diagnostics.record("view");
      refreshTabStyles();
      doRender();
      scrollPaneTop(content);
    });
    strip.appendChild(btn);
    tabButtons.set(t.key, btn);
  }
  const hasFocusedEditableChild = () => {
    const active = document.activeElement;
    if (!active || !content.contains(active))
      return false;
    const tag = active.tagName;
    if (tag === "TEXTAREA")
      return true;
    if (tag !== "INPUT")
      return false;
    const type = (active.type || "text").toLowerCase();
    return type === "text" || type === "number" || type === "search" || type === "email" || type === "url" || type === "tel" || type === "password";
  };
  const renderTabInto = (host) => {
    if (!lastState)
      return;
    if (activeTab === "home")
      renderHomeTab(host, lastState, ctx, send);
    else if (activeTab === "books")
      renderBooksTab(host, lastState, ctx, send);
    else if (activeTab === "codex")
      renderCodexTab(host, lastState, ctx, send);
    else if (activeTab === "tuning")
      renderTuningTab(host, lastState, ctx, send);
    else
      renderAboutTab(host, lastState, send);
  };
  let lastRenderedTab = null;
  const renderContent = () => {
    if (!lastState) {
      content.replaceChildren();
      lastRenderedTab = null;
      return;
    }
    const mode = viewMode();
    if (mode === "lesson") {
      lastRenderedTab = null;
      clearSealBusy();
      engine.mount(content);
      return;
    }
    if (mode === "sealed") {
      lastRenderedTab = null;
      content.replaceChildren();
      const wrap = document.createElement("div");
      wrap.className = "lmb-seal-wrap";
      const under = document.createElement("div");
      under.className = "lmb-seal-under";
      under.setAttribute("inert", "");
      renderTabInto(under);
      wrap.appendChild(under);
      renderSealPanel(wrap, lastState, send);
      content.appendChild(wrap);
      return;
    }
    clearSealBusy();
    const renderInner = () => renderTabInto(content);
    if (lastRenderedTab === activeTab) {
      preserveScroll(content, renderInner);
    } else {
      renderInner();
    }
    lastRenderedTab = activeTab;
  };
  const doRender = () => {
    setContext({ chatId: lastState?.activeChatId, view: engine.isActive() ? "lesson" : activeTab });
    try {
      renderContent();
      diagnostics.record("render", { code: "ok" });
    } catch (err) {
      diagnostics.record("error", { code: uiErrorCode(err), op: "state" });
      console.error("[LumiBooks] render failed", err);
      content.replaceChildren();
      lastRenderedTab = null;
      showLoadNotice(t("ui.app.doRender.lumiBooksCouldnTDisplayThisViewRetry"));
    }
  };
  const renderActive = () => {
    if (viewMode() === "lesson") {
      engine.onHostState();
      return;
    }
    if (hasFocusedEditableChild()) {
      renderPending = true;
      return;
    }
    renderPending = false;
    doRender();
  };
  content.addEventListener("focusout", () => {
    if (!renderPending)
      return;
    if (viewMode() === "lesson")
      return;
    setTimeout(() => {
      if (hasFocusedEditableChild())
        return;
      renderPending = false;
      doRender();
    }, 0);
  });
  refreshTabStyles();
  const unsub = ctx.onBackendMessage((raw) => {
    const msg = raw;
    try {
      if (msg.type === "state") {
        diagnostics.setEnabled(!msg.state.settings.localLogsDisabled);
        setContext({ chatId: msg.state.activeChatId, view: activeTab });
      }
      diagnostics.record("receive", {
        op: msg.type,
        code: msg.type === "state_error" || msg.type === "error" || msg.type === "codex_file_state_saved" && msg.error || msg.type === "summary_transfer_status" && msg.status.stage === "error" ? "failed" : undefined
      });
      switch (msg.type) {
        case "regex_scripts_page":
          deliverRegexScriptsPage(msg);
          break;
        case "prompt_breakdown":
          deliverPromptBreakdown(msg);
          break;
        case "state":
          clearLoadTimer();
          handshakeRetries = 0;
          showLoadNotice("");
          if (lastState && lastState.activeChatId !== msg.state.activeChatId)
            closeCodexCatchupModal();
          lastState = msg.state;
          transferPanel.setChat(lastState.activeChatId);
          renderActive();
          break;
        case "state_loading":
          clearLoadTimer();
          if (!lastState) {
            showLoadNotice(t("ui.app.unsub.loadingLumiBooks"), true);
            loadTimer = setTimeout(() => {
              diagnostics.record("timeout", { code: "state" });
              showLoadNotice(t("ui.app.unsub.thisChatIsTakingLongerToLoad"));
            }, 20000);
          }
          break;
        case "state_error":
          clearLoadTimer();
          showLoadNotice(msg.text);
          break;
        case "toast":
          if (msg.tone === "error")
            console.error(`[LumiBooks] ${msg.text}`);
          else if (msg.tone === "warn")
            console.warn(`[LumiBooks] ${msg.text}`);
          else
            console.info(`[LumiBooks] ${msg.tone}: ${msg.text}`);
          showToast(msg.tone, msg.text);
          break;
        case "busy":
          if (lastState) {
            const prev = lastState.busy;
            const next = msg.entries;
            lastState = { ...lastState, busy: next };
            const finishedCodexChats = new Set;
            for (const b of prev) {
              if (b.kind !== "codex")
                continue;
              if (!next.some((n) => n.kind === "codex" && n.chatId === b.chatId)) {
                finishedCodexChats.add(b.chatId);
              }
            }
            for (const chatId of finishedCodexChats) {
              if (codexWantsRefresh(chatId))
                send({ type: "codex_read", chatId });
            }
            const mode = viewMode();
            if (mode === "lesson") {
              engine.onHostState();
              break;
            }
            if (mode === "sealed") {
              updateSealBusy(lastState);
              break;
            }
            const sameShape = prev.length === next.length && prev.every((b, i) => b.kind === next[i].kind && b.chatId === next[i].chatId);
            if (activeTab === "home") {
              if (sameShape && tryUpdateBusyLabelsInPlace(next))
                break;
              if (hasFocusedEditableChild())
                renderPending = true;
              else
                renderHomeTab(content, lastState, ctx, send);
            } else if (activeTab === "codex" && !sameShape) {
              if (hasFocusedEditableChild())
                renderPending = true;
              else
                renderCodexTab(content, lastState, ctx, send);
            }
          }
          break;
        case "error":
          console.warn(`[LumiBooks] error: ${msg.text}`);
          break;
        case "dry_run_result":
          showDryRunModal(msg.kind, msg.messages, msg.diagnostics);
          break;
        case "codex_files":
          deliverCodexFiles(msg.chatId, msg.files, msg.revision, msg.savedFile, msg.savedSeq);
          if (viewMode() === "tabs" && activeTab === "codex" && lastState)
            renderActive();
          else if (viewMode() === "lesson")
            engine.onHostState();
          break;
        case "codex_file_state_saved": {
          const confirmed = deliverCodexFileState(msg.chatId, msg.file, msg.seq, msg.error);
          if (confirmed !== null && lastState?.activeChatId === msg.chatId) {
            lastState = { ...lastState, codexFileStates: { ...lastState.codexFileStates, [msg.file]: confirmed } };
            if (activeTab === "codex")
              renderActive();
          }
          break;
        }
        case "stream_text":
          deliverStreamText(msg);
          break;
        case "summary_transfer_status":
          transferPanel.deliver(msg.status);
          break;
        case "summary_export_data":
        case "diagnostics_export_data":
        case "codex_backup_data":
          downloadCodexBackup(msg.filename, msg.content);
          break;
        case "codex_tools_hint":
          if (lastState && !lastState.settings.suppressToolCallingPrompt) {
            showCodexToolsHintModal(lastState.activeProfile.id, send);
          }
          break;
      }
    } catch (error) {
      diagnostics.record("error", { op: msg.type, code: uiErrorCode(error) });
      throw error;
    }
  });
  const onRevealEntry = (e) => {
    if (viewMode() !== "tabs")
      return;
    const entryId = e.detail?.entryId;
    if (!entryId || !lastState)
      return;
    focusShelfEntry(entryId);
    activeTab = "books";
    refreshTabStyles();
    doRender();
    scrollPaneTop(content);
  };
  document.addEventListener("lmb-reveal-entry", onRevealEntry);
  const onLessonRequest = (e) => {
    if (engine.isActive())
      return;
    const detail = e.detail;
    if (!detail || detail.course !== "books" && detail.course !== "codex")
      return;
    engine.start(detail.course, { mode: detail.mode ?? "lesson", section: detail.section, fresh: detail.fresh });
  };
  document.addEventListener("lmb-lesson-request", onLessonRequest);
  const unsubActivate = tab.onActivate(() => requestState("refresh"));
  requestState("ready");
  return () => {
    disposed = true;
    resetRegexPicker();
    resetHomeTabLocal();
    clearLoadTimer();
    try {
      if (engine.isActive())
        engine.exit();
    } catch (_) {}
    try {
      unsub();
    } catch (_) {}
    try {
      unsubActivate?.();
    } catch (_) {}
    try {
      document.removeEventListener("lmb-reveal-entry", onRevealEntry);
    } catch (_) {}
    try {
      document.removeEventListener("lmb-lesson-request", onLessonRequest);
    } catch (_) {}
    document.removeEventListener("lmb-summary-transfer", onLocalTransfer);
    try {
      tab.destroy?.();
    } catch (_) {}
  };
}
export {
  setup
};
