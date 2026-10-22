// @bun
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

\u2550\u2550\u2550 round {rounds} \u2550\u2550\u2550
`,
          fullRewriteKChars: "full rewrite, {toFixed}k chars",
          codexWriteJson: `
\u27A4 codex_write {f}.json ({label})`,
          codexDone: `
\u2726 codex_done{note}`,
          codexSkip: `
\u25CB codex_skip {choice, select, yes {{join}} other {(no files)}}`,
          unknownTool: `
\u2717 unknown tool {name}`,
          theCodexAgentReturnedAnEmptyResponse: "The Codex agent returned an empty response",
          noJsonObjectFoundInTheReply: `
\u2717 no JSON found in the reply. Retrying...`,
          memoriaCouldnTFinishTheCodexUpdate: "The model wasn't able to follow instructions :(.{keptSuffix}",
          theCodexAgentNarratedInsteadOfCalling: "The Codex agent didn't call tools. Does your connection support tool calls?",
          theCodexAgentRepliedWithoutAParsable: "The Codex agent returned faulty JSON",
          memoriaCouldnTFinishTheCodexUpdate2: "The model stopped before writing {join}.{keptSuffix}",
          keptStillReferencedByUnchangedJson: `
\u2933 Kept {ref}: still referenced by unchanged {file}.json`,
          value: `
\u2933 {r}`,
          rejected: `
\u2717 rejected{choice, select, yes { {file}.json} other {}}: {errors0}`,
          integrity: `
\u2717 integrity: {e}`,
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
        memoriaStirsTheInkpotNyaa: "Creating chapter\u2026",
        memoriaIsShelvingThisSceneHushA: "Creating chapter\u2026",
        memoriaFlicksHerTailAndStartsWriting: "Creating chapter\u2026",
        memoriaOpensAFreshPageForYou: "Creating chapter\u2026",
        memoriaPadsOffToCompressThisIn: "Creating chapter\u2026"
      },
      retryPhrases: {
        memoriaTrippedOnAQuillTryingAgain: "Retrying\u2026",
        memoriaSInkSmudgedOneMoreTry: "Retrying\u2026",
        memoriaReshufflesTheIndexCardsRetrying: "Retrying\u2026"
      },
      successPhrases: {
        memoriaSlidTheChapterOntoYourShelf: "Chapter created",
        memoriaFiledItNeatlyBetweenTheOthers: "Chapter created",
        memoriaStampedTheSpineAllYours: "Chapter created",
        memoriaPurrsThePageIsDone: "Chapter created",
        memoriaTapsTheChapterIntoPlace: "Chapter created"
      },
      arcFirePhrases: {
        memoriaGathersTheChaptersForAnArc: "Creating arc\u2026",
        memoriaIsBindingSeveralChaptersTogether: "Creating arc\u2026"
      },
      arcSuccessPhrases: {
        memoriaBoundTheArcAndPressedIt: "Arc created",
        memoriaStitchedTheSpineOfANew: "Arc created"
      },
      volumeFirePhrases: {
        memoriaIsPressingAWholeVolumeTogether: "Creating volume\u2026"
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
        noSources: "No {name} summaries to consolidate",
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
        higherSources: "Source {name} summaries: {count}",
        higherSourceTokens: "Source summaries: {bodyTokens} tokens (model tokenizer)",
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
        fetchingRawChatMessages: "Fetching raw chat messages\u2026",
        lumiBooksSummaries: "LumiBooks summaries - {slice}"
      },
      hashes: {
        hashingRawMessages: "Hashing raw messages\u2026 {done} / {length}"
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
        readingSummaries: "Reading summaries\u2026",
        preparingSummaryExport: "Preparing summary export\u2026",
        readingRawChatMessages: "Reading raw chat messages\u2026",
        summaryExportReady: "Summary export ready",
        enterAWholeMessageNumberFrom0: "Enter a whole message number from 0 to {length}.",
        importedSummaries: "Imported summaries",
        automaticMatchingWasIncompleteOrAmbiguousUp: "Matching was incomplete or ambiguous. Which message should coverage end at?",
        theContentOfThisChatIsDifferent: "This chat differs from the imported summary''s source. Try matching messages?",
        someOfTheseMessagesAlreadyHaveSummaries: "Some messages already have summaries. Release them in Books before importing.",
        theChatChangedWhilePreparingTheImport: "Chat changed during import. Which message should coverage end at?",
        savingImportedSummaries: "Saving imported summaries\u2026",
        importedSummaries2: "Imported {length} summaries{choice, select, yes { covering {size} messages} other { as root memories}}"
      },
      manual: {
        upUntilWhichMessageShouldTheseSummaries: "Which message should coverage end at?"
      },
      computed: {
        comparingRawMessages: "Comparing raw messages\u2026 {done} / {length}"
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
      searchProgress: "Searching scripts\u2026 {scanned, number} of {total, number} checked",
      search: "Search regex names\u2026",
      noMatches: "No matching regex scripts.",
      previous: "Previous",
      next: "Next",
      page: "Page",
      refresh: "Refresh",
      loading: "Loading regex scripts\u2026",
      failed: "Could not load this page. Select Refresh to retry.",
      range: "{first}\u2013{last} of {total} scripts",
      selected: "{count} selected across all pages"
    },
    activationControl: {
      activationControl: {
        constant: "Constant",
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
        preparingSummaryExport: "Preparing summary export\u2026",
        checkingSummaryCoverage: "Checking summary coverage\u2026"
      },
      showLoadNotice: {
        retry: "Retry"
      },
      requestState: {
        loadingLumiBooks: "Loading LumiBooks\u2026",
        lumiBooksHasnTRespondedYouCanRetry: "LumiBooks hasn''t responded. Retry loading.",
        couldNotLoadLumiBooks: "Couldn''t load LumiBooks: {string}"
      },
      doRender: {
        lumiBooksCouldnTDisplayThisViewRetry: "Couldn''t display this view. Retry to reload."
      },
      unsub: {
        loadingLumiBooks: "Loading LumiBooks\u2026",
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
        value: "\xD7",
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
          thisIsAPracticeChatIMade: "This is a practice chat I made just for teaching you \uD83D\uDE3E. These highlighted buttons are my quick actions.",
          thisPracticeStoryHasPlentyOfOld: "This practice story has plenty of old messages ready to compact into summaries. Press the File chapter button and watch what happens.",
          boomTheStoryIsNowMoreCompact: "BOOM\uD83D\uDCA3. The story is now more compact, the new summary chapter is on my shelf, and this colored bar changed shape, because those messages now exist as a summary.",
          importantThereSAutomationTooNowYou: `IMPORTANT. There''s automation too! Now you may ask the very important question of: when do I summarize on my own?? And I''ll graciously answer that very important question! That depends on exactly about TWO 2\uFE0F\u20E3 settings. Consider: Uncompressed messages are large, but hold detailed info so we don''t want to compress them right away right? Therefore, first setting is what I call the "lag", 65 by default. This represents the number of most recent messages we leave uncompressed always! \uD83D\uDDFF`,
          theSecondSettingIsTheWindowWe: `The second setting is the "window" \uD83E\uDE9F. We don''t want to summarize every single message individually, instead we probably want toi summarize like, 18, into one chapter! Turns out 18 is the default, what a coincidence! Once 18 old messages have piled up behind your lag, these two "pills" both say "ready", and I begin summarizing a chapter!`,
          theDefaultValuesAreMadeFor200k: "The default values are made for 200k context chats. Adjust the lag and window to your liking, depending on your context, and your message size. But I do reccomend keeping context at 200k. Unless you''re living in 2028 when LLMs are long context GODS (presumably).",
          fileAllFilesChaptersUntilTheLag: '"File all" files chapters until the lag is reached. Bind arc takes my oldest chapters and compresses them into one smaller summary called an arc. When work is waiting to be done, a little pill appears here telling you how much.',
          everythingIFileIsStoredInA: "Everything I file is stored in a lorebook created just for this chat, named after it. It appears the first time a chapter is filed.",
          normallyYouNeverNeedTheseButtonsWith: "Normally you never need these buttons with automation on, I do all of this myself after each message. If a button looks dead, the small text under it says why, usually that I''m busy or you switched me off >:(",
          "70OldMessagesLag65Window18": "70 old messages \xB7 lag 65 \xB7 window 18",
          thesePillsSayLagReadyButWindow: "These pills say lag ready but window building, and I''m not filing. Why not?",
          theLagHasNotFilledUpYet: "The lag has not filled up yet",
          theChatHasNoLorebookYet: "The chat has no lorebook yet",
          "70MessagesMinusThe65ProtectedBy": "70 messages minus the 65 protected by the lag leaves only 5, and a chapter needs 18",
          aChapterCanOnlyBeFiledAfter: "A chapter can only be filed after an arc exists",
          theWindowOnlyCountsMessagesOlderThan: "The window only counts messages older than the lag. 70 minus 65 is 5, short of 18. This is also when I''d notify you that your story needs more messages if you click file~",
          theDesk: "The desk",
          thisColoredBarIsTheSpineA: "This colored bar is the spine, a map of your whole chat. Each block is a stretch of story, sized by how much prompt it costs. The pale block at the front is the Codex, that''s my second course (it''s really cool).",
          clickAnyColoredBlockAndILl: "Click any colored block and I''ll jump you straight to that chapter or arc on my shelf \uD83D\uDC30. Handy when you want to check what I wrote about a scene.",
          theListUnderItShowsTheSame: "The list under it shows the same picture in numbers: what my volumes, arcs, and chapters cost, plus the recent messages I haven''t touched yet.",
          theseTilesAreTheQuickSummaryFiled: "These tiles are the quick summary. Filed is how much of the chat I''ve compacted. Tail is the recent part I haven''t. Shelf counts everything I''ve made. The Codex tile belongs to my second course \uD83E\uDD77.",
          thePromptPanelShowsThePromptBreakdown: "The Prompt panel shows the prompt breakdown your last generation sent, split into groups. Simulate... simulates your next prompt (what a surprise). And if the prompt goes past 90% of the model''s limit, I warn you here. Bad things happen if you go past 100%... trust me \uD83E\uDD1E",
          iWroteTooMuchThePreviousStep: "I wrote too much the previous step, so I''m continuing here. If you''re approaching 100%, turn down the lag! Anyways. While I write, a row like this appears. If you''re a creep \uD83D\uDC7E, watch lets you read my raw output live, thoughts included.",
          ifIFailEvenAfterRetryingThis: "If I fail even after retrying, this red box shows an error. Please read it.",
          arc154Msgs08kTokens: "ARC 1 \xB7 54 msgs \u2192 0.8k tokens",
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
          theCodexTileEvenThoughYouDon: "The Codex tile, even though you don''t know what it is yet \uD83E\uDD25",
          theUncompressedTailIsUsuallyTheFat: "The uncompressed tail is usually the fat part of the prompt. If it doesn''t fit your context, lower the lag so I file closer to the present.",
          theShelf: "The Shelf",
          everythingIFileEndsUpOnMy: "Everything I file ends up on my Shelf. Let''s visit it. Tap the Books tab.",
          myShelf: "My shelf.",
          witnessMyShelfEverythingIVeFiled: "Witness my Shelf \uD83D\uDE08. Everything I''ve filed for this chat lives here, sorted into volumes, arcs, and chapters.",
          entriesOpenWithAClickTapThe: "Entries open with a click. Tap the chapter called The Captain Asks Questions.",
          thereSTheWholeRecord: "There''s the whole record.",
          youLlSeeItsSizeBeforeAnd: "You''ll see its size before and after compacting, my little note, and four buttons. Edit rewrites the text. Regenerate throws the summary away and writes it again from the same messages. Release turns it into a normal lorebook entry that I stop managing. Delete removes it. Boring stuff \uD83D\uDCA4",
          fadedEntriesMeansAnArcOrVolume: "Faded entries means an arc or volume replaced them, like how chapters replace messages. Delete the arc and its chapters unhide again.",
          importantTheGhostTagMarksAChapter: "\uD83D\uDEA9IMPORTANT\uD83D\uDEA9 The GHOST tag marks a chapter I prepared early for Codex, but I don''t actually inject it or use it in the summaries yet until it passes the lag. My Codex course explains those. If you ask about this on Discord I will kill you.",
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
          value: "\uD83D\uDC0C",
          composeManualControl: "Compose, manual control",
          anywayManualControlsNext: "Anyway. Manual controls next!",
          ready: "Ready?",
          theComposeTabIsManualModeFilter: "The Compose tab is manual mode. Filter or search these messages, tick the boxes, and shift-click (or long-press on a phone) to grab a whole range. A \u2713 means already filed, a \u2298 means excluded.",
          compressFilesWhatYouSelectedIntoA: "Compress files what you selected into a chapter. Wow no way!",
          excludeProtectsMessagesFromMeCompletelyPerfect: "Exclude protects messages from me completely. Perfect for OOC notes or instructions that must stay word-for-word.",
          furtherDownYouCanPickChaptersTo: "Further down you can pick chapters to bind into an arc, and arcs to press into a volume. Volumes are the strongest compression. If you need more, you probably don''t.",
          whenIsExcludeTheRightToolInstead: "When is Exclude the right tool, instead of Delete?",
          whenAMessageMustStayInThe: "When a message must stay in the prompt word-for-word and never be summarized",
          whenYouWantAMessageGoneFrom: "When you want a message gone from the chat",
          whenAChapterCameOutBadly: "When a chapter came out badly",
          whenYouWishToDeceiveYourEnemy: "When you wish to deceive your enemy, and therefore, must deceive yourself \uD83D\uDC09",
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
          windowTokens18: "Window \xB7 tokens \xB7 18",
          youSwitchTheWindowUnitFromMessages: "You switch the window unit from messages to tokens, but leave the value at 18. What did you just ask me for?",
          chaptersOfAbout18MessagesSameAs: "Chapters of about 18 messages, same as before",
          idk: "Idk",
          youAskedMeToConvert18Messages: "You asked me to convert 18 messages into tokens",
          chaptersWillAutomaticallyFileAfterOnly18: "Chapters will automatically file after only ~18 tokens of story, about one sentence each. Uh oh. ",
          theUnitChangesWhatTheNumberMeans: "The unit changes what the number means. Tokens are little word-pieces, one message is hundreds of them, so token windows want values in the thousands",
          lag10Messages: "Lag \xB7 10 messages",
          youLowerTheLagFrom65Down: "You lower the lag from 65 down to 10. What changes?",
          iStartSummarizingMuchCloserToThe: "I start summarizing much closer to the present, only your 10 newest messages stay untouched",
          chaptersGetBigger: "Chapters get bigger",
          nothingUntilTheWindowAlsoChanges: "Nothing until the window also changes",
          iGoBackAndReSummarizeOld: "I go back and re-summarize old chapters",
          aSmallLagSavesMoreSpaceBut: "A small lag saves more space but summarizes your recent scenes sooner. Keep it just big enough for quality writing without hallucination.",
          window40TargetPercent4: "Window \xB7 40 \xB7 Target percent \xB7 4",
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
          wellDoneMousepadHasLetMeKnow: "Well done! Mousepad has let me know, that they want to tell me to tell you that they are very proud of you for getting through this \uD83C\uDFC6. Sign and take your diploma! The shorter Codex course is waiting whenever you''re curious :)"
        }
      },
      contentCodex: {
        courseCodex: {
          theArchivistSCodex: "The Archivist''s Codex",
          whyAStoryBible: "Why a story bible",
          summaryChaptersAreAGoodOutlineBut: "Summary chapters are a good outline. But if you compress a story enough you''ll start losing information, like secrets, location details, and specific object info. This means that somehow, we must separately track the important parts of the story as we compress it.",
          beholdTheKnowledgeCodexLetSWalk: "BEHOLD the Knowledge Codex \uD83D\uDE0E. Let''s walk though a practice one for a little murder mystery to help you understand it. Tap the Codex tab up top.",
          thereItIs: "There it is.",
          eightRecordsMakeTheCodexCharactersLocations: "Eight records make the Codex: characters, locations, things, relations, a timeline, story threads, world rules, and secrets. A small agent reads your new messages on a schedule and updates it all \uD83D\uDCAA. Each record becomes a lorebook entry. Timeline and threads stay constant; the others use Keywords by default. In Tuning \u2192 Settings \u2192 Codex, choose Always or Vector + keywords for different recall. Vector recall needs embeddings set up in Lumiverse.",
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
          dashedMeansNotInjectedButStillUpdated: "Dashed means not injected but still updated. A second click freezes updates completely, a third turns it back on. Try clicking it more if you want.\uD83D\uDDB1\uFE0F\uD83D\uDDB1\uFE0F\uD83D\uDDB1\uFE0F\uD83D\uDDB1\uFE0F",
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
          thePeoplePlacesAndThings: "The people, places, and things! \uD83C\uDF0E",
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
          codexLag65: "Codex lag \xB7 65",
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
          thatSAllGoForthAndMake: "That''s all, go forth and make some awesome stories!\u2728"
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
          oldMessagesPileUp: "old messages pile up\u2026",
          ch1: "CH 1",
          theOldestFoldIntoAChapterIn: "\u2026the oldest fold into a chapter, in place\u2026",
          ch2: "CH 2",
          thenTheNextWindowFolds: "\u2026then the next window folds\u2026",
          arc1: "ARC 1",
          andChaptersBindIntoASingleArc: "\u2026and chapters bind into a single arc."
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
          eliasMaraLovesHerHidesIt: "Elias \u2192 Mara: loves her, hides it",
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
          ofGoldStamps: "{gold} of {total} gold stamps \xB7 {toLocaleDateString}",
          saveAsImage: "Save as image",
          prefersReducedMotionReduce: "(prefers-reduced-motion: reduce)"
        },
        makeConfetti: {
          value: "\u25C6"
        },
        downloadDiploma: {
          lUMIBOO: "L U M I B O O K S   A C A D E M Y",
          certifiesThat: "certifies that",
          hasReadTheStacksAndUnderstoodThem: "has read the stacks and understood them",
          ofGoldStamps: "{gold} of {total} gold stamps \xB7 {toLocaleDateString}",
          memoriaLibrarian: "\u2014 Memoria, Librarian"
        }
      },
      engine: {
        buildStage: {
          exam: "{title} \xB7 Exam",
          value: "\u2715",
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
          value: "\u25C6 \u25C7 \u25C6"
        },
        positionSpotlight: {
          value: "\u25C6 {chip}"
        },
        renderStep: {
          signTheRegister: "Sign the register"
        },
        renderSheet: {
          rightWhereWeNeedToBe: "Right where we need to be.",
          back: "Back",
          skip: "Skip",
          yourMove: "your move\u2026",
          next: "Next",
          working: "working\u2026"
        },
        renderQuiz: {
          alreadyStampedGoldFromTheExamOr: "Already stamped gold, from the exam or an earlier pass.",
          answeredOnAnEarlierPass: "Answered on an earlier pass.",
          back: "Back",
          next: "Next",
          filed: "Filed! \u25C6",
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
          value: "\u25C6 \u25C7 \u25C6 \u25C7 \u25C6 \u25C7 \u25C6 \u25C7"
        },
        renderSealPanel: {
          lessonsFromMemoria: "Lessons from Memoria",
          welcomeTutorial: "Welcome Tutorial",
          hiUserIMTeachingATutorial: "Hi user! I''m teaching a tutorial on LumiBooks, you''ll have to attend (\u02F6\u1D54 \u1D55 \u1D54\u02F6)",
          resumeTheLesson: "Resume the Lesson",
          takeLessonFromMemoria: "Take Lesson from Memoria",
          sitTheExam: "Sit the Exam",
          tenQuestionsFromTheCourse9Of: "Ten questions from the course. 9 of 10 graduates you.",
          skipForNow: "Skip for now",
          progressSavedAtSection: "Progress saved at section {sec}."
        },
        renderGrumpySkip: {
          hmphFine: "Hmph. Fine.",
          skipIfYouMustButYouHad: "Skip if you must. But you had better not go asking my creator for help before taking my course (\xAC`\u2038\xB4\xAC) A reminder will wait for you on Home.",
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
          skipIfYouMustTheCodexUnlocks: "Skip if you must (\xAC`\u2038\xB4\xAC) The Codex unlocks, but the agent stays off until you enable it in Tuning. A reminder will wait for you on Home.",
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
        value: "\xD7",
        close: "Close",
        automationIsOnSoFastAndUltra: "With automation on, fast modes update chapters and arcs first.",
        fastAndUltraFastNeedTheCodex: "Fast modes need a Codex context at least as large as the story model''s.",
        value2: "\u26A0 {booksWarning}",
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
        value: "\xD7",
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
        higherTier: "Dry run: {name}",
        value: "\xD7",
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
        summaryTransferInProgress: "Summary transfer in progress\u2026",
        continueSummaryImportExport: "Continue summary import/export",
        summaryImportExport: "Summary import / export",
        attemptMatching: "Attempt Matching",
        letMeSpecify: "Let me specify",
        upUntilWhichMessageShouldTheseSummaries: "Which message should coverage end at?",
        thisChatHasMessagesCountFrom1: "This chat has {messageCount0} messages. Use 0 to import as inherited memories. Otherwise, summaries merge into an entry covering messages 1\u2013N, keeping their text.",
        importSummaries: "Import summaries",
        dismiss: "Dismiss",
        cancelImport: "Cancel import",
        hide: "Hide"
      },
      choose: {
        processingSummaryImport: "Processing summary import\u2026"
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
          value: "{i1}. {title}{choice, select, yes { \u25C7} other { \u25C6}}",
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
          t: "{range} \xB7 {contentTokens}t"
        },
        tokenStr: {
          tokens: "{formatTokens}\u2192{contentTokens} tokens",
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
          pickUncompressedMessagesAndFileThemInto: "Select messages to summarize. \u2713 marks messages already filed.",
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
          value2: "\u2713",
          excludedNeverHiddenReplacedOrSummarized: "Excluded - never hidden, replaced, or summarized",
          value3: "\u2298",
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
          readingSummaryFile: "Reading summary file\u2026",
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
          memoriaIsFetchingTheCodexFiles: "Loading Codex\u2026"
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
          injectedUpdated: "injected \xB7 updated",
          notInjectedStillUpdated: "not injected \xB7 still updated",
          frozenNoUpdates: "frozen \xB7 no updates"
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
          clickARecordCardToCycleIt: "Click a card to cycle: injected \u2192 not injected \u2192 frozen. Records remain editable.",
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
          clickToCycle: "{tileStateLabelSt}{choice, select, yes { \xB7 missed updates while frozen} other {}}{choice2, select, yes { \xB7 waiting for the catch-up pass} other {}} - click to cycle",
          tokens: "{choice, select, yes {~} other {}}{formatTokens} tokens",
          stale: " \xB7 stale",
          needsCatchUp: " \xB7 needs catch-up",
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
          state: "{locked, select, yes {\uD83D\uDD12} other {\uD83D\uDD13}} {injected, select, yes {injected} other {not injected}} \xB7 {locked, select, yes {frozen} other {updated}}"
        },
        renderEntities: {
          clickANameToOpenItsSheet: "Click a name to edit.",
          of: "{title} \xB7 {length} of {length2}",
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
          locked: "\uD83D\uDD12 locked",
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
          pairAB: "pair (a \u2192 b)",
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
          value: "\u2192"
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
          planted: "\u25C6 planted: {p}",
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
          value: "\u2715",
          closeTheLiveView: "Close the live view",
          waitingForTheFirstTokensFromThe: "Waiting for model output\u2026"
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
          tokens: "{label} \xB7 {tokens} tokens",
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
          readingTheLastFire: "Loading last prompt\u2026",
          memoriaIsAskingTheHostForThe: "Loading prompt breakdown\u2026",
          couldnTReadTheHostPrompt: "Couldn''t read the host prompt",
          noPromptDataYet: "No prompt data yet",
          tokens: "{label} \xB7 {tokens} tokens",
          freeSpaceTokens: "Free space \xB7 {formatTokens} tokens",
          promptVsContextWindow: "Prompt vs context window",
          promptTotal: "Prompt total",
          tokens2: "{totalTokens} tokens",
          contextNearlyFull: "context nearly full",
          value: "{tokens} \xB7 {pct}%",
          freeSpace: "Free space",
          value2: "{formatTokens} \xB7 {pct}%"
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
          msgs: "msgs {from1}\u2013{to1} \xB7 "
        },
        renderSpine: {
          tokens: "{where}{kind} \xB7 ~{tokens} tokens{choice, select, yes { (click to open)} other {}}"
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
          volArcChap: "vol \xB7 arc \xB7 chap",
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
          codexTakeALesson: "\uD83D\uDD12 Codex \xB7 take a lesson",
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
          rename: "Rename profile",
          duplicate: "Duplicate profile",
          copyName: "{name} copy",
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
          summaries: "Summaries",
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
          summaryPrompt: "{name} prompt",
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
          personaIsTheSystemPromptHeaderShort: "Persona sets the instruction header. Short-comment rules fill '{{memoria_short_comment_rules}}'.",
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
          presetScope: "Preset selection is saved per profile. Editing a preset changes it for every profile using it; duplicate it for a separate version.",
          theMissionBlockAtTheTopOf: "Instructions at the start of the Codex prompt. Saved with the templates below in the selected preset. Preview assembled prompts with Dry run.",
          newBlankPrompt: "New blank prompt",
          duplicateToNew: "Duplicate to new",
          duplicateToEdit: "Duplicate to edit",
          dryRun: "Dry run",
          assembleTheNextCodexRunSComplete: "Preview resolved messages and their roles. No model call.",
          assembleThisPresetSPromptWithAll: "Preview this preset''s resolved prompt. No model call.",
          delete: "Delete",
          promptBuiltInDuplicateToEdit: "Prompt (built-in, duplicate to edit)"
        },
        opts: {
          useVolume: "Use Volume preset (adapted to this tier)",
          builtIn: "Built-in: {displayName}",
          custom: "Custom: {displayName}"
        },
        sendAs: {
          label: "Send as:",
          system: "System",
          assistant: "Assistant",
          user: "User",
          help: "Role for this category's instructions. Source material is sent as User. Saved per profile."
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
      compactTokenChange: "{before}t\u2192{after}t"
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

- **Entities, world topics, and secrets** use the three-way **Codex recall** control in Tuning \u2192 Settings \u2192 Codex: **Always**, **Keywords** (the default), or **Vector + keywords**. The agent writes a \`keywords\` list alongside each record (names, aliases, and participants match automatically). Vector mode also retrieves records by meaning through Lumiverse''s lorebook search.
- **Timeline and threads** are constant entries as keyword matching doesn''t make as much sense here.

Vector recall requires a tested embedding connection and lorebook vectorization enabled in Lumiverse. Existing records are queued for indexing when you switch modes; new and edited records follow the same setting. Until indexing finishes, or when retrieval is unavailable or there is no visible recent text for a query, keyword matching remains available. Disabled records and files stay excluded. Lumiverse controls retrieval limits and the embedding provider; Codex files remain the source of truth.

Chapter and higher-tier summaries have a separate **Summary recall** control in Tuning \u2192 Settings \u2192 Books \u2192 Everywhere. Its default is **Constant**. Selecting memories never changes which messages are filed or hidden. In the same section, turn off **Lorebook names follow chat names** before manually renaming either managed lorebook in Lumiverse.

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
function isCodexTemplateKey(v) {
  return typeof v === "string" && CODEX_TEMPLATE_KEYS.includes(v);
}
var BY_KEY = new Map(CODEX_TEMPLATES.map((t) => [t.key, t]));
function codexTemplateText(key, overrides) {
  const o = overrides[key];
  if (typeof o === "string" && o.trim())
    return o;
  return BY_KEY.get(key).defaultText;
}

// src/activation.ts
function normalizeActivationMode(value, fallback) {
  return value === "always" || value === "keywords" || value === "vector" ? value : fallback;
}
function activationFlags(mode, pinned = false) {
  return { constant: pinned || mode === "always", vectorized: !pinned && mode === "vector" };
}

// src/shared.ts
var EXTENSION_ID = "lumi_books";
var EXTENSION_KEY = "lumibooks";
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
var WORLD_BOOK_NAME_PREFIX = "LumiBooks";
var CODEX_ENTRY_EXTENSION_KEY = "lumibooks_codex";
var STORAGE_VERSION = 7;
var SETTINGS_PATH = "settings.json";
var CHAT_STATE_DIR = "chats";
var TIER_KINDS = ["chapter", "arc", "volume", "series", "saga", "library", "universe"];
var MODEL_TIER_NAMES = ["Chapter", "Arc", "Volume", "Series", "Saga", "Library", "Universe"];
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
function normalizeHigherTiers(raw) {
  const out = defaultHigherTiers();
  const values = raw && typeof raw === "object" ? raw : {};
  for (const tier of HIGHER_TIERS) {
    const v = values[tier];
    if (!v || typeof v !== "object")
      continue;
    out[tier] = {
      enabled: v.enabled === true,
      unit: v.unit === "tokens" ? "tokens" : "entries",
      batch: clampInt(v.batch, v.unit === "tokens" ? 100 : 2, v.unit === "tokens" ? 1e6 : 100, out[tier].batch),
      lag: clampInt(v.lag, 0, v.unit === "tokens" ? 1e6 : 100, out[tier].lag),
      targetUnit: v.targetUnit === "tokens" ? "tokens" : "percent",
      targetPercent: clampInt(v.targetPercent, 5, 95, 25),
      targetTokens: clampInt(v.targetTokens, 50, 1e6, 3000)
    };
  }
  return out;
}
function tierHeader(tier, number, sources, turns) {
  const sourceName = MODEL_TIER_NAMES[tier - 2]?.toLowerCase() ?? "message";
  const sourceLabel = sources === 1 || sourceName === "series" ? sourceName : sourceName === "library" ? "libraries" : `${sourceName}s`;
  return `${MODEL_TIER_NAMES[tier - 1]} ${ordinal(number)} (${sources} ${sourceLabel}, ${turns} turns)`;
}
var EXTRA_PRESET_CATEGORIES = ["series", "saga", "library", "universe"];
var PRESET_CATEGORIES = [...TIER_KINDS, "codex"];
function promptRoleFor(profile, category) {
  return profile.promptRoles[category] ?? "system";
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
    higherTierPresetKeys: {},
    promptRoles: {},
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
function diskVersionFor(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return typeof v.version === "number" ? v.version : 1;
}
function normalizeSettings(raw) {
  const fallback = DEFAULT_SETTINGS;
  const v = raw && typeof raw === "object" ? raw : {};
  const profilesRaw = Array.isArray(v.profiles) ? v.profiles : fallback.profiles;
  const profiles = profilesRaw.map((p) => normalizeProfile(p)).filter((p) => !!p);
  if (profiles.length === 0)
    profiles.push(makeDefaultProfile("default", t("shared.normalizeSettings.default")));
  const activeProfileId = typeof v.activeProfileId === "string" && profiles.some((p) => p.id === v.activeProfileId) ? v.activeProfileId : profiles[0].id;
  const customPresets = Array.isArray(v.customPresets) ? v.customPresets.map(normalizeCustomPreset).filter((p) => !!p) : [];
  return {
    version: STORAGE_VERSION,
    enabled: typeof v.enabled === "boolean" ? v.enabled : fallback.enabled,
    profiles,
    activeProfileId,
    customPresets,
    debugLog: typeof v.debugLog === "boolean" ? v.debugLog : fallback.debugLog,
    localLogsDisabled: typeof v.localLogsDisabled === "boolean" ? v.localLogsDisabled : fallback.localLogsDisabled,
    summaryActivationMode: normalizeActivationMode(v.summaryActivationMode, v.forceConstantEntries === false ? "keywords" : "always"),
    followChatNames: v.followChatNames !== false,
    showAutomationToasts: typeof v.showAutomationToasts === "boolean" ? v.showAutomationToasts : fallback.showAutomationToasts,
    suppressToolCallingPrompt: typeof v.suppressToolCallingPrompt === "boolean" ? v.suppressToolCallingPrompt : fallback.suppressToolCallingPrompt
  };
}
function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  const id = typeof v.id === "string" && v.id.trim() ? v.id : null;
  if (!id)
    return null;
  const base = makeDefaultProfile(id, typeof v.name === "string" && v.name.trim() ? v.name : t("shared.base.untitled"));
  return {
    ...base,
    lagUnit: v.lagUnit === "tokens" ? "tokens" : "messages",
    lagValue: clampInt(v.lagValue, 0, v.lagUnit === "tokens" ? 1e6 : 1e5, base.lagValue),
    windowUnit: v.windowUnit === "tokens" ? "tokens" : "messages",
    windowValue: clampInt(v.windowValue, 1, v.windowUnit === "tokens" ? 1e6 : 1e5, base.windowValue),
    chapterTargetUnit: v.chapterTargetUnit === "tokens" ? "tokens" : "percent",
    chapterTargetPercent: clampInt(v.chapterTargetPercent, 2, 90, base.chapterTargetPercent),
    chapterTargetTokens: clampInt(v.chapterTargetTokens, 50, 1e6, base.chapterTargetTokens),
    arcTargetUnit: v.arcTargetUnit === "tokens" ? "tokens" : "percent",
    arcTargetPercent: clampInt(v.arcTargetPercent, 5, 95, base.arcTargetPercent),
    arcTargetTokens: clampInt(v.arcTargetTokens, 50, 1e6, base.arcTargetTokens),
    volumeTargetUnit: v.volumeTargetUnit === "tokens" ? "tokens" : "percent",
    volumeTargetPercent: clampInt(v.volumeTargetPercent, 5, 95, base.volumeTargetPercent),
    volumeTargetTokens: clampInt(v.volumeTargetTokens, 50, 1e6, base.volumeTargetTokens),
    arcTrigger: v.arcTrigger === "tokens" || v.arcTrigger === "manual" ? v.arcTrigger : "chapters",
    arcAfterChapters: clampInt(v.arcAfterChapters, 2, 100, base.arcAfterChapters),
    arcAfterTokens: clampInt(v.arcAfterTokens, 500, 200000, base.arcAfterTokens),
    arcLagChapters: clampInt(v.arcLagChapters, 0, 100, base.arcLagChapters),
    arcLagTokens: clampInt(v.arcLagTokens, 0, 200000, base.arcLagTokens),
    chapterPresetKey: typeof v.chapterPresetKey === "string" && v.chapterPresetKey.trim() ? v.chapterPresetKey : base.chapterPresetKey,
    arcPresetKey: typeof v.arcPresetKey === "string" && v.arcPresetKey.trim() ? v.arcPresetKey : base.arcPresetKey,
    volumePresetKey: typeof v.volumePresetKey === "string" && v.volumePresetKey.trim() ? v.volumePresetKey : base.volumePresetKey,
    higherTierPresetKeys: Object.fromEntries(EXTRA_PRESET_CATEGORIES.flatMap((category) => {
      const key = v.higherTierPresetKeys?.[category];
      return typeof key === "string" && key.trim() ? [[category, key]] : [];
    })),
    promptRoles: Object.fromEntries(PRESET_CATEGORIES.flatMap((category) => {
      const role = v.promptRoles?.[category];
      return role === "system" || role === "assistant" || role === "user" ? [[category, role]] : [];
    })),
    previousMemoriesCount: clampInt(v.previousMemoriesCount, 0, 20, base.previousMemoriesCount),
    regexOutgoingScriptIds: Array.isArray(v.regexOutgoingScriptIds) ? v.regexOutgoingScriptIds.filter((x) => typeof x === "string") : base.regexOutgoingScriptIds,
    regexIncomingScriptIds: Array.isArray(v.regexIncomingScriptIds) ? v.regexIncomingScriptIds.filter((x) => typeof x === "string") : base.regexIncomingScriptIds,
    connectionId: typeof v.connectionId === "string" && v.connectionId.trim() ? v.connectionId : null,
    samplers: normalizeSamplers(v.samplers),
    autoCreate: typeof v.autoCreate === "boolean" ? v.autoCreate : base.autoCreate,
    autoCreateChapter: typeof v.autoCreateChapter === "boolean" ? v.autoCreateChapter : base.autoCreateChapter,
    higherTiers: normalizeHigherTiers(v.higherTiers),
    autoCreateArc: typeof v.autoCreateArc === "boolean" ? v.autoCreateArc : base.autoCreateArc,
    hideCoveredMessages: typeof v.hideCoveredMessages === "boolean" ? v.hideCoveredMessages : base.hideCoveredMessages,
    showMemoryPreviews: typeof v.showMemoryPreviews === "boolean" ? v.showMemoryPreviews : base.showMemoryPreviews,
    retryCount: clampInt(v.retryCount, 0, 10, base.retryCount),
    shortCommentRulesOverride: typeof v.shortCommentRulesOverride === "string" && v.shortCommentRulesOverride.trim() !== "" ? v.shortCommentRulesOverride : null,
    memoriaPersonaOverride: typeof v.memoriaPersonaOverride === "string" && v.memoriaPersonaOverride.trim() !== "" ? v.memoriaPersonaOverride : null,
    ttftTimeoutSecs: clampInt(v.ttftTimeoutSecs, 10, 600, base.ttftTimeoutSecs),
    codexEnabled: typeof v.codexEnabled === "boolean" ? v.codexEnabled : base.codexEnabled,
    codexManualOnly: typeof v.codexManualOnly === "boolean" ? v.codexManualOnly : base.codexManualOnly,
    codexLagUnit: v.codexLagUnit === "tokens" ? "tokens" : "messages",
    codexLagValue: clampInt(v.codexLagValue, 0, v.codexLagUnit === "tokens" ? 1e6 : 1e5, base.codexLagValue),
    codexWindowUnit: v.codexWindowUnit === "tokens" ? "tokens" : "messages",
    codexWindowValue: clampInt(v.codexWindowValue, 1, v.codexWindowUnit === "tokens" ? 1e6 : 1e5, base.codexWindowValue),
    codexTokenBreakpoint: clampInt(v.codexTokenBreakpoint, 1000, 1e6, base.codexTokenBreakpoint),
    codexLoreLimitUnit: v.codexLoreLimitUnit === "tokens" ? "tokens" : "percent",
    codexLoreLimitPercent: clampInt(v.codexLoreLimitPercent, 1, 100, base.codexLoreLimitPercent),
    codexLoreLimitTokens: clampInt(v.codexLoreLimitTokens, 0, 1e6, base.codexLoreLimitTokens),
    codexStorySoFarCount: clampInt(v.codexStorySoFarCount, 0, 50, base.codexStorySoFarCount),
    codexActivationMode: normalizeActivationMode(v.codexActivationMode, v.codexForceConstant === true ? "always" : "keywords"),
    codexInjectionPosition: v.codexInjectionPosition === "depth" || v.codexInjectionPosition === "after_history" ? v.codexInjectionPosition : "lorebook",
    codexInjectionDepth: clampInt(v.codexInjectionDepth, 0, 1e4, base.codexInjectionDepth),
    codexRelationsTable: typeof v.codexRelationsTable === "boolean" ? v.codexRelationsTable : base.codexRelationsTable,
    codexThorough: typeof v.codexThorough === "boolean" ? v.codexThorough : base.codexThorough,
    codexConnectionId: typeof v.codexConnectionId === "string" && v.codexConnectionId.trim() ? v.codexConnectionId : null,
    codexExtraContext: typeof v.codexExtraContext === "boolean" ? v.codexExtraContext : base.codexExtraContext,
    codexSamplers: normalizeSamplers(v.codexSamplers),
    codexUseTools: typeof v.codexUseTools === "boolean" ? v.codexUseTools : base.codexUseTools,
    codexWriteMode: v.codexWriteMode === "sequential" ? "sequential" : "batch",
    codexPresetKey: typeof v.codexPresetKey === "string" && v.codexPresetKey.trim() ? v.codexPresetKey : base.codexPresetKey
  };
}
function normalizeCodexTemplates(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return;
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (isCodexTemplateKey(k) && typeof v === "string" && v.trim())
      out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
function normalizeSamplers(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    temperature: numOrNull(v.temperature, 0, 2),
    top_p: numOrNull(v.top_p, 0, 1),
    top_k: numOrNull(v.top_k, 0, 1000),
    max_tokens: numOrNull(v.max_tokens, 1, 1e6),
    max_input_tokens: numOrNull(v.max_input_tokens, 256, 4000000),
    frequency_penalty: numOrNull(v.frequency_penalty, -2, 2),
    presence_penalty: numOrNull(v.presence_penalty, -2, 2)
  };
}
function normalizeCustomPreset(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.key !== "string" || !v.key.trim())
    return null;
  if (typeof v.prompt !== "string" || !v.prompt.trim())
    return null;
  const category = PRESET_CATEGORIES.includes(v.category) ? v.category : "chapter";
  const templates = category === "codex" ? normalizeCodexTemplates(v.templates) : undefined;
  return {
    key: v.key,
    displayName: typeof v.displayName === "string" && v.displayName.trim() ? v.displayName : v.key,
    prompt: v.prompt,
    category,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    ...templates ? { templates } : {}
  };
}
function normalizeEntryMeta(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  const tier = Number.isInteger(v.tier) && Number(v.tier) >= 1 && Number(v.tier) <= 7 ? v.tier : null;
  if (!tier)
    return null;
  if (typeof v.chatId !== "string" || !v.chatId.trim())
    return null;
  const msgIds = Array.isArray(v.msgIds) ? v.msgIds.filter((x) => typeof x === "string") : [];
  return {
    tier,
    chatId: v.chatId,
    msgIds,
    sourceChapterEntryIds: Array.isArray(v.sourceChapterEntryIds) ? v.sourceChapterEntryIds.filter((x) => typeof x === "string") : undefined,
    firstMsgIdx: typeof v.firstMsgIdx === "number" ? v.firstMsgIdx : undefined,
    lastMsgIdx: typeof v.lastMsgIdx === "number" ? v.lastMsgIdx : undefined,
    tokenCountInput: typeof v.tokenCountInput === "number" ? v.tokenCountInput : 0,
    tokenCountOutput: typeof v.tokenCountOutput === "number" ? v.tokenCountOutput : 0,
    model: typeof v.model === "string" ? v.model : "",
    connectionId: typeof v.connectionId === "string" ? v.connectionId : "",
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    supersededByEntryId: typeof v.supersededByEntryId === "string" && v.supersededByEntryId.trim() ? v.supersededByEntryId : null,
    title: typeof v.title === "string" ? v.title : undefined,
    shortComment: typeof v.shortComment === "string" ? v.shortComment : undefined,
    presetKey: typeof v.presetKey === "string" ? v.presetKey : undefined,
    sceneNumber: typeof v.sceneNumber === "number" && Number.isFinite(v.sceneNumber) && v.sceneNumber > 0 ? Math.floor(v.sceneNumber) : undefined,
    rawOutput: typeof v.rawOutput === "string" ? v.rawOutput : undefined,
    isRoot: v.isRoot === true ? true : undefined,
    rootOrigin: typeof v.rootOrigin === "string" && v.rootOrigin.trim() ? v.rootOrigin : undefined,
    ghost: v.ghost === true ? true : undefined,
    msgSigs: Array.isArray(v.msgSigs) ? v.msgSigs.filter((x) => typeof x === "string") : undefined
  };
}
function clampInt(v, min, max, fallback) {
  if (typeof v !== "number" || !Number.isFinite(v))
    return fallback;
  const n = Math.round(v);
  if (n < min)
    return min;
  if (n > max)
    return max;
  return n;
}
function numOrNull(v, min, max) {
  if (v === null || v === undefined)
    return null;
  if (typeof v !== "number" || !Number.isFinite(v))
    return null;
  if (v < min || v > max)
    return null;
  return v;
}
function approximateTokensFromChars(chars) {
  return Math.ceil(chars / 4);
}
function ordinal(n) {
  if (!Number.isFinite(n) || n < 1)
    return String(n);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13)
    return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
function buildChapterHeader(sceneNumber, turnCount) {
  return `${ordinal(sceneNumber)} Summary Chapter Containing ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}
function buildArcHeader(sceneNumber, chapterCount, turnCount) {
  return `${ordinal(sceneNumber)} Summary ARC Containing ${chapterCount} Prior Chapter${chapterCount === 1 ? "" : "s"} and ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}
function bookNameFor(chatName, chatId) {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return `${WORLD_BOOK_NAME_PREFIX} - ${suffix}`;
}
function codexBookNameFor(chatName, chatId) {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return t("shared.codexBookNameFor.codexDoNotEdit", { worldBookNamePrefix: WORLD_BOOK_NAME_PREFIX, suffix });
}
var LESSONS_PATH = "lessons.json";
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
function makeDefaultLessons(freshInstall) {
  return { version: 1, freshInstall, booksSealSkipped: false, codexSealSkipped: false, books: emptyLessonCourse(), codex: emptyLessonCourse() };
}
function unlockedLessons() {
  const done = () => ({ ...emptyLessonCourse(), status: "done" });
  return { version: 1, freshInstall: false, booksSealSkipped: false, codexSealSkipped: false, books: done(), codex: done() };
}
function codexLessonGated(lessons) {
  return lessons.codex.status !== "done" && !lessons.codexSealSkipped;
}
var LESSON_GRADE_LABEL = {
  gilded: t("shared.lessonGradeLabel.gilded"),
  silver: t("shared.lessonGradeLabel.silver"),
  bronze: t("shared.lessonGradeLabel.bronze"),
  apprentice: t("shared.lessonGradeLabel.apprentice")
};
function normalizeLessonAnswers(raw) {
  const out = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (v === "gold" || v === "silver" || v === "skip")
        out[k] = v;
    }
  }
  return out;
}
function normalizeLessonCourse(raw) {
  const base = emptyLessonCourse();
  if (!raw || typeof raw !== "object")
    return base;
  const v = raw;
  const status = v.status === "done" || v.status === "in_progress" ? v.status : "todo";
  const grade = v.grade === "gilded" || v.grade === "silver" || v.grade === "bronze" || v.grade === "apprentice" ? v.grade : null;
  return {
    status,
    section: clampInt(v.section, 0, 100, 0),
    step: clampInt(v.step, 0, 1000, 0),
    answers: normalizeLessonAnswers(v.answers),
    attempts: clampInt(v.attempts, 0, 1e4, 0),
    bestWrong: typeof v.bestWrong === "number" && Number.isFinite(v.bestWrong) ? v.bestWrong : null,
    lastWrong: typeof v.lastWrong === "number" && Number.isFinite(v.lastWrong) ? v.lastWrong : null,
    lastTotal: typeof v.lastTotal === "number" && Number.isFinite(v.lastTotal) && v.lastTotal > 0 ? Math.round(v.lastTotal) : null,
    grade,
    startedAt: typeof v.startedAt === "number" ? v.startedAt : null,
    completedAt: typeof v.completedAt === "number" ? v.completedAt : null,
    signedName: typeof v.signedName === "string" && v.signedName.trim() ? v.signedName.trim().slice(0, 60) : null
  };
}
function normalizeLessons(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    freshInstall: v.freshInstall === true,
    booksSealSkipped: v.booksSealSkipped === true,
    codexSealSkipped: v.codexSealSkipped === true,
    books: normalizeLessonCourse(v.books),
    codex: normalizeLessonCourse(v.codex)
  };
}

// src/backend/runtime.ts
var lastFrontendUserId = null;
var CHAT_USER_MAP_CAP = 2000;
var chatUserIds = new Map;
function setLastFrontendUserId(userId) {
  lastFrontendUserId = userId;
}
function rememberChatUser(chatId, userId) {
  if (!chatId || !userId)
    return;
  if (chatUserIds.has(chatId)) {
    chatUserIds.delete(chatId);
  } else if (chatUserIds.size >= CHAT_USER_MAP_CAP) {
    const oldestKey = chatUserIds.keys().next().value;
    if (oldestKey !== undefined)
      chatUserIds.delete(oldestKey);
  }
  chatUserIds.set(chatId, userId);
}
function resolveUserId(chatId) {
  if (chatId) {
    const mapped = chatUserIds.get(chatId);
    if (mapped)
      return mapped;
  }
  return null;
}
function getBootstrapUserId() {
  return lastFrontendUserId;
}
function send(payload, userId) {
  spindle.sendToFrontend(payload, userId);
}
function readChatIdFromMessage(msg) {
  if (!("chatId" in msg))
    return null;
  const value = msg.chatId;
  return typeof value === "string" && value.trim() ? value : null;
}
async function ensureUserFolders(userId) {
  await Promise.all([
    spindle.userStorage.mkdir(CHAT_STATE_DIR, userId).catch(() => {})
  ]);
}
function debug(userId, ...parts) {
  spindle.log.info(t("backend.runtime.debug.lmb", { slice: userId.slice(0, 6), join: parts.map(stringifyPart).join(" ") }));
}
function info(message) {
  spindle.log.info(`[lmb] ${message}`);
}
function warn(message) {
  spindle.log.warn(`[lmb] ${message}`);
}
function error(message) {
  spindle.log.error(`[lmb] ${message}`);
}
function stringifyPart(p) {
  if (p === null || p === undefined)
    return String(p);
  if (typeof p === "string")
    return p;
  if (typeof p === "number" || typeof p === "boolean")
    return String(p);
  try {
    return JSON.stringify(p);
  } catch {
    return String(p);
  }
}
function describeError(err) {
  if (err instanceof Error)
    return err.message;
  if (typeof err === "string")
    return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// src/backend/storage.ts
var warnedNewerForUser = new Set;
var writeLocks = new Map;
var SETTINGS_CACHE_TTL_MS = 2000;
var settingsCache = new Map;
function cacheSettings(userId, data) {
  settingsCache.set(userId, { at: Date.now(), data });
}
function withSettingsLock(userId, fn) {
  const prev = writeLocks.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(userId, next.catch(() => {}));
  return next;
}
var migrationInflight = new Map;
function migrateSettings(userId, raw, fromVersion) {
  const running = migrationInflight.get(userId);
  if (running)
    return running;
  const p = (async () => {
    const migratedPresets = [];
    const flipped = {
      ...raw,
      profiles: (Array.isArray(raw.profiles) ? raw.profiles : []).map((prof) => {
        const next = { ...prof };
        if (fromVersion < 4) {
          next.codexThorough = true;
          next.codexExtraContext = true;
        }
        if (fromVersion < 5 && (next.codexWindowUnit === "messages" || next.codexWindowUnit === undefined) && next.codexWindowValue === 30) {
          next.codexWindowValue = 20;
        }
        if (fromVersion < 6) {
          next.codexUseTools = false;
        }
        if (fromVersion < 7) {
          const legacy = next["codexDirectivesOverride"];
          if (typeof legacy === "string" && legacy.trim()) {
            const key = `codex_migrated_${typeof next.id === "string" ? next.id : migratedPresets.length}`;
            migratedPresets.push({
              key,
              displayName: t("backend.storage.flipped.directives", { hasName: typeof next.name === "string" && next.name.trim() ? "yes" : "no", name: typeof next.name === "string" ? next.name : "" }),
              prompt: legacy,
              category: "codex",
              createdAt: Date.now()
            });
            next.codexPresetKey = key;
          }
          delete next["codexDirectivesOverride"];
        }
        return next;
      }),
      customPresets: [...Array.isArray(raw.customPresets) ? raw.customPresets : [], ...migratedPresets]
    };
    const normalized = normalizeSettings(flipped);
    try {
      await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
      warn(`settings migrated v${fromVersion} -> v${STORAGE_VERSION}`);
    } catch (err) {
      warn(`settings v${STORAGE_VERSION} migration write failed, will retry: ${describeError(err)}`);
    }
    cacheSettings(userId, normalized);
    return normalized;
  })().finally(() => migrationInflight.delete(userId));
  migrationInflight.set(userId, p);
  return p;
}
async function loadSettings(userId) {
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.at < SETTINGS_CACHE_TTL_MS)
    return cached.data;
  return withSettingsLock(userId, () => loadSettingsUnlocked(userId));
}
async function loadSettingsUnlocked(userId) {
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.at < SETTINGS_CACHE_TTL_MS)
    return cached.data;
  const exists = await spindle.userStorage.exists(SETTINGS_PATH, userId);
  let raw = null;
  if (exists) {
    const text = await spindle.userStorage.read(SETTINGS_PATH, userId);
    try {
      raw = JSON.parse(text);
    } catch (err) {
      warn(`settings.json is corrupt, using defaults until the next save: ${describeError(err)}`);
      raw = null;
    }
  }
  const diskVersion = diskVersionFor(raw);
  if (diskVersion > STORAGE_VERSION && !warnedNewerForUser.has(userId)) {
    warnedNewerForUser.add(userId);
    warn(`settings on disk are v${diskVersion}, this build understands v${STORAGE_VERSION}`);
  }
  if (raw && diskVersion < STORAGE_VERSION) {
    return migrateSettings(userId, raw, diskVersion);
  }
  const normalized = normalizeSettings(raw);
  cacheSettings(userId, normalized);
  return normalized;
}
async function patchSettings(userId, patch) {
  return withSettingsLock(userId, async () => {
    const current = await loadSettingsUnlocked(userId);
    const next = { ...current, ...patch };
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}
async function mutateSettings(userId, fn) {
  return withSettingsLock(userId, async () => {
    const current = await loadSettingsUnlocked(userId);
    const next = await fn(current);
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}

// src/backend/summary-commit.ts
var commitChain = new Map;
function withCommitMutex(userId, chatId, fn) {
  const key = JSON.stringify([userId, chatId]);
  const previous = commitChain.get(key) ?? Promise.resolve();
  const result = previous.then(fn, fn);
  const guarded = result.catch(() => {
    return;
  });
  commitChain.set(key, guarded);
  guarded.then(() => {
    if (commitChain.get(key) === guarded)
      commitChain.delete(key);
  });
  return result;
}

// src/backend/world-book.ts
var PAGE_LIMIT = 200;
var BOOK_INDEX_CACHE_TTL_MS = 4000;
var bookAnomalyCb = null;
function registerBookAnomalyCallback(cb) {
  bookAnomalyCb = cb;
}
var CHAT_BOOK_CACHE_CAP = 1000;
var chatBookCache = new Map;
var ensureInflight = new Map;
function setBookCache(key, value) {
  if (chatBookCache.has(key))
    chatBookCache.delete(key);
  chatBookCache.set(key, value);
  while (chatBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = chatBookCache.keys().next().value;
    if (oldest === undefined)
      break;
    chatBookCache.delete(oldest);
  }
}
function cacheKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
async function listAllBooks(userId) {
  const out = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.list({ limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0)
      break;
    offset += page.data.length;
  }
  return out;
}
async function listAllEntries(bookId, userId) {
  const out = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.entries.list(bookId, { limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0)
      break;
    offset += page.data.length;
  }
  return out;
}
async function findBookForChat(chatId, userId) {
  const cached = chatBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now())
    return cached.bookId;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const fromMeta = chat?.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const claimed = fromMeta && typeof fromMeta["lumibooks_book_id"] === "string" ? fromMeta["lumibooks_book_id"] : null;
  if (claimed) {
    const exists = await spindle.world_books.get(claimed, userId).catch(() => null);
    if (exists) {
      const bookMeta = exists.metadata && typeof exists.metadata === "object" ? exists.metadata : null;
      const bookChatId = bookMeta ? bookMeta["lumibooks_chat_id"] : undefined;
      if (bookChatId === chatId) {
        setBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
        return claimed;
      }
    }
  }
  const books = await listAllBooks(userId);
  for (const book of books) {
    const meta = book.metadata;
    if (meta && meta["lumibooks_chat_id"] === chatId) {
      setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}
async function ensureBookForChat(chatId, userId) {
  const key = cacheKey(userId, chatId);
  const inflight = ensureInflight.get(key);
  if (inflight)
    return inflight;
  const p = doEnsureBookForChat(chatId, userId).finally(() => {
    ensureInflight.delete(key);
  });
  ensureInflight.set(key, p);
  return p;
}
async function doEnsureBookForChat(chatId, userId) {
  const existingId = await findBookForChat(chatId, userId);
  if (existingId) {
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindBookToChat(chatId, existing.id, userId);
      return existing;
    }
  }
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error(t("backend.worldBook.doEnsureBookForChat.chatNotFoundForUser", { chatId }));
  const claim = chat.metadata && typeof chat.metadata === "object" ? chat.metadata["lumibooks_book_id"] : undefined;
  const recovery = await recoverBookForChat(chatId, userId);
  if (recovery) {
    const existing = await spindle.world_books.get(recovery.bookId, userId);
    if (existing) {
      const meta = existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {};
      if (meta["lumibooks_chat_id"] !== chatId) {
        await spindle.world_books.update(existing.id, { metadata: { ...meta, lumibooks_chat_id: chatId } }, userId);
      }
      await bindBookToChat(chatId, existing.id, userId);
      setBookCache(cacheKey(userId, chatId), { bookId: existing.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      error(`book recovery: re-linked book ${existing.id} for chat ${chatId.slice(0, 8)} ` + `(${recovery.count} LumiBooks entries; normal lookup MISSED it; chat claim=${typeof claim === "string" ? claim : "none"}; ` + `${recovery.candidates} candidate book(s); userId=${userId.slice(0, 6)})`);
      bookAnomalyCb?.(userId, "warn", recovery.candidates > 1 ? t("backend.worldBook.doEnsureBookForChat.memoriaReLinkedThisChatSNotebook", { candidates: recovery.candidates }) : t("backend.worldBook.doEnsureBookForChat.memoriaReLinkedThisChatSNotebook2"));
      return existing;
    }
  }
  if (typeof claim === "string" && claim.trim()) {
    error(`book mismatch: chat ${chatId.slice(0, 8)} claims book ${claim} but it could not be resolved OR recovered; ` + `creating a NEW book. userId=${userId.slice(0, 6)}`);
    bookAnomalyCb?.(userId, "error", t("backend.worldBook.doEnsureBookForChat.memoriaCouldnTFindThisChatS"));
  }
  const book = await spindle.world_books.create({
    name: bookNameFor(chat.name, chatId),
    description: t("backend.worldBook.book.memoriaSShelfForThisChatChapters"),
    metadata: {
      lumibooks_chat_id: chatId,
      lumibooks_created_at: Date.now()
    }
  }, userId);
  await bindBookToChat(chatId, book.id, userId);
  setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  return book;
}
async function recoverBookForChat(chatId, userId) {
  const books = await listAllBooks(userId);
  const matches = [];
  for (const book of books) {
    const meta = book.metadata;
    if (meta && meta[CODEX_BOOK_META_KEY])
      continue;
    const bookChatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
    if (bookChatId && bookChatId !== chatId)
      continue;
    const looksLikeLmb = (book.name || "").startsWith(WORLD_BOOK_NAME_PREFIX) || !!(meta && (meta["lumibooks_chat_id"] || meta["lumibooks_created_at"] || meta["lumibooks_forked_from"]));
    if (!looksLikeLmb)
      continue;
    const entries = await listAllEntries(book.id, userId).catch(() => []);
    let count = 0;
    for (const entry of entries) {
      const ext = entry.extensions || {};
      const m = normalizeEntryMeta(ext[EXTENSION_KEY]);
      if (m && m.chatId === chatId)
        count++;
    }
    if (count > 0)
      matches.push({ id: book.id, count });
  }
  if (matches.length === 0)
    return null;
  matches.sort((a, b) => b.count - a.count);
  return { bookId: matches[0].id, count: matches[0].count, candidates: matches.length };
}
var chatMetaChain = new Map;
function withChatMetaLock(userId, chatId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = chatMetaChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  chatMetaChain.set(key, guarded);
  guarded.then(() => {
    if (chatMetaChain.get(key) === guarded)
      chatMetaChain.delete(key);
  });
  return tail;
}
function bindBookToChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId);
    if (!chat)
      throw new Error(t("backend.worldBook.bindBookToChat.theChatIsNoLongerAvailableIts"));
    const metadata = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
    const existing = Array.isArray(metadata["chat_world_book_ids"]) ? metadata["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = metadata["lumibooks_book_id"] === bookId;
    if (alreadyBound && alreadyClaimed)
      return;
    const nextChatBookIds = alreadyBound ? existing : [...existing, bookId];
    await spindle.chats.update(chatId, {
      metadata: {
        ...metadata,
        chat_world_book_ids: nextChatBookIds,
        lumibooks_book_id: bookId
      }
    }, userId);
  });
}
async function getChatAttachedBookIds(chatId, userId) {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || !Array.isArray(md["chat_world_book_ids"]))
    return [];
  return md["chat_world_book_ids"].filter((x) => typeof x === "string");
}
async function reassertChatBinding(chatId, userId) {
  await reassertCodexBinding(chatId, userId).catch(() => {});
  const bookId = await findBookForChat(chatId, userId).catch(() => null);
  if (!bookId)
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat)
    return false;
  await syncManagedBookNames(chatId, chat.name ?? null, bookId, userId).catch((err) => warn(`book name sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`));
  const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
  const attached = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
  if (attached.includes(bookId) && md["lumibooks_book_id"] === bookId)
    return false;
  await bindBookToChat(chatId, bookId, userId);
  return true;
}
var nameSyncAt = new Map;
var NAME_SYNC_TTL_MS = 60000;
async function syncManagedBookNames(chatId, chatName, shelfBookId, userId) {
  await syncManagedBookName(chatId, shelfBookId, bookNameFor(chatName, chatId), userId);
  const codexBookId = await findCodexBookForChat(chatId, userId).catch(() => null);
  if (codexBookId)
    await syncManagedBookName(chatId, codexBookId, codexBookNameFor(chatName, chatId), userId);
}
async function syncManagedBookName(chatId, bookId, name, userId) {
  const key = `${cacheKey(userId, chatId)}::${bookId}`;
  if (!(await loadSettings(userId)).followChatNames) {
    nameSyncAt.delete(key);
    return;
  }
  const last = nameSyncAt.get(key);
  if (last && Date.now() - last < NAME_SYNC_TTL_MS)
    return;
  if (nameSyncAt.size > 500)
    nameSyncAt.clear();
  nameSyncAt.set(key, Date.now());
  const book = await spindle.world_books.get(bookId, userId);
  if (book && (book.name || "") !== name)
    await spindle.world_books.update(bookId, { name }, userId);
}
var ENTRIES_CACHE_TTL_MS = 4000;
var ENTRIES_CACHE_CAP = 300;
var entriesCache = new Map;
async function listLmbEntries(chatId, userId, fresh = false) {
  const key = cacheKey(userId, chatId);
  const cached = entriesCache.get(key);
  if (!fresh && cached && Date.now() - cached.at < ENTRIES_CACHE_TTL_MS)
    return cached.data;
  const bookId = await findBookForChat(chatId, userId);
  if (!bookId)
    return [];
  const raw = await listAllEntries(bookId, userId);
  const out = [];
  for (const entry of raw) {
    const ext = entry.extensions || {};
    const meta = normalizeEntryMeta(ext[EXTENSION_KEY]);
    if (!meta)
      continue;
    if (meta.chatId !== chatId)
      continue;
    out.push({ raw: entry, meta });
  }
  if (entriesCache.has(key))
    entriesCache.delete(key);
  entriesCache.set(key, { at: Date.now(), data: out });
  while (entriesCache.size > ENTRIES_CACHE_CAP) {
    const oldest = entriesCache.keys().next().value;
    if (oldest === undefined)
      break;
    entriesCache.delete(oldest);
  }
  return out;
}
async function createChapterEntry(bookId, meta, content, comment, userId, keys = [], disabled = false, replacement) {
  const payload = {
    content,
    comment,
    disabled,
    ...activationFlags((await loadSettings(userId)).summaryActivationMode),
    key: keys,
    keysecondary: [],
    extensions: {
      ...replacement?.raw.extensions ?? {},
      [EXTENSION_KEY]: meta
    }
  };
  return replacement ? spindle.world_books.entries.update(replacement.raw.id, payload, userId) : spindle.world_books.entries.create(bookId, payload, userId);
}
async function applySummaryActivation(userId) {
  const books = await listAllBooks(userId);
  let updated = 0;
  let failed = 0;
  for (const book of books) {
    const meta = book.metadata;
    if (!meta || typeof meta["lumibooks_chat_id"] !== "string")
      continue;
    const chatId = meta["lumibooks_chat_id"];
    await withCommitMutex(userId, chatId, async () => {
      const flags = activationFlags((await loadSettings(userId)).summaryActivationMode);
      const entries = await listAllEntries(book.id, userId);
      for (const entry of entries) {
        const ext = entry.extensions || {};
        if (!ext[EXTENSION_KEY])
          continue;
        if (entry.constant === flags.constant && (entry.vectorized ?? false) === flags.vectorized)
          continue;
        try {
          await spindle.world_books.entries.update(entry.id, flags, userId);
          updated++;
        } catch {
          failed++;
        }
      }
    }).catch(() => {
      failed++;
    });
    invalidateBookCache(userId, chatId);
  }
  return { updated, failed };
}
async function updateEntry(entryId, patch, userId) {
  return spindle.world_books.entries.update(entryId, patch, userId);
}
async function deleteEntry(entryId, userId) {
  await spindle.world_books.entries.delete(entryId, userId);
}
async function setEntryDisabled(entryId, disabled, userId) {
  return spindle.world_books.entries.update(entryId, { disabled }, userId);
}
async function promoteGhostEntry(entry, userId) {
  const nextMeta = { ...entry.meta, ghost: undefined, msgSigs: undefined };
  const ext = entry.raw.extensions || {};
  return spindle.world_books.entries.update(entry.raw.id, { disabled: false, extensions: { ...ext, [EXTENSION_KEY]: nextMeta } }, userId);
}
async function releaseEntry(entry, userId) {
  const ext = entry.raw.extensions || {};
  const nextExt = { ...ext };
  delete nextExt[EXTENSION_KEY];
  const currentComment = entry.raw.comment || "";
  const nextComment = currentComment.startsWith("[orphaned]") ? currentComment : `[orphaned] ${currentComment}`.trim();
  return spindle.world_books.entries.update(entry.raw.id, { extensions: nextExt, comment: nextComment }, userId);
}
async function patchEntryMeta(entry, metaPatch, userId) {
  const next = { ...entry.meta, ...metaPatch };
  const ext = entry.raw.extensions || {};
  return spindle.world_books.entries.update(entry.raw.id, {
    extensions: { ...ext, [EXTENSION_KEY]: next }
  }, userId);
}
function invalidateBookCache(userId, chatId) {
  chatBookCache.delete(cacheKey(userId, chatId));
  entriesCache.delete(cacheKey(userId, chatId));
  codexBookCache.delete(cacheKey(userId, chatId));
}
function findCachedChatIdForBook(userId, bookId) {
  const prefix = `${userId}::`;
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      return key.slice(prefix.length);
  }
  return null;
}
async function findChatIdForBook(userId, bookId) {
  const cached = findCachedChatIdForBook(userId, bookId);
  if (cached)
    return cached;
  const book = await spindle.world_books.get(bookId, userId).catch(() => null);
  if (!book)
    return null;
  const meta = book.metadata && typeof book.metadata === "object" ? book.metadata : null;
  const claimed = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
  return claimed;
}
function invalidateAllBookCacheEntriesForBook(userId, bookId) {
  const prefix = `${userId}::`;
  const toDelete = [];
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      toDelete.push(key);
  }
  for (const k of toDelete) {
    chatBookCache.delete(k);
    entriesCache.delete(k);
  }
  const codexToDelete = [];
  for (const [key, value] of codexBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      codexToDelete.push(key);
  }
  for (const k of codexToDelete)
    codexBookCache.delete(k);
}
var CODEX_BOOK_META_KEY = "lumibooks_codex_chat_id";
var CODEX_BOOK_CLAIM_KEY = "lumibooks_codex_book_id";
var codexBookCache = new Map;
var codexEnsureInflight = new Map;
function setCodexBookCache(key, value) {
  if (codexBookCache.has(key))
    codexBookCache.delete(key);
  codexBookCache.set(key, value);
  while (codexBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = codexBookCache.keys().next().value;
    if (oldest === undefined)
      break;
    codexBookCache.delete(oldest);
  }
}
function codexBookTaggedFor(book, chatId) {
  return codexBookChatTag(book) === chatId;
}
function codexBookChatTag(book) {
  const meta = book.metadata && typeof book.metadata === "object" ? book.metadata : null;
  const tag = meta ? meta[CODEX_BOOK_META_KEY] : null;
  return typeof tag === "string" && tag ? tag : null;
}
async function findCodexBookForChat(chatId, userId) {
  const cached = codexBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now())
    return cached.bookId;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat?.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const claimed = md && typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? md[CODEX_BOOK_CLAIM_KEY] : null;
  if (claimed) {
    const book = await spindle.world_books.get(claimed, userId).catch(() => null);
    if (book && codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return claimed;
    }
  }
  const books = await listAllBooks(userId);
  for (const book of books) {
    if (codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}
function bindCodexBookToChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId);
    if (!chat)
      throw new Error(t("backend.worldBook.bindCodexBookToChat.theChatIsNoLongerAvailableIts"));
    const metadata = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
    const md = metadata;
    const existing = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    await syncManagedBookName(chatId, bookId, codexBookNameFor(chat.name ?? null, chatId), userId).catch((err) => warn(`Codex book name sync failed: ${describeError(err)}`));
    if (alreadyBound && alreadyClaimed)
      return;
    await spindle.chats.update(chatId, {
      metadata: {
        ...md,
        chat_world_book_ids: alreadyBound ? existing : [...existing, bookId],
        [CODEX_BOOK_CLAIM_KEY]: bookId
      }
    }, userId);
  });
}
async function ensureCodexBookForChat(chatId, userId) {
  const key = cacheKey(userId, chatId);
  const inflight = codexEnsureInflight.get(key);
  if (inflight)
    return inflight;
  const p = doEnsureCodexBookForChat(chatId, userId).finally(() => {
    codexEnsureInflight.delete(key);
  });
  codexEnsureInflight.set(key, p);
  return p;
}
async function doEnsureCodexBookForChat(chatId, userId) {
  const existingId = await findCodexBookForChat(chatId, userId);
  if (existingId) {
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindCodexBookToChat(chatId, existing.id, userId);
      return existing;
    }
  }
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error(t("backend.worldBook.doEnsureCodexBookForChat.chatNotFoundForUser", { chatId }));
  const book = await spindle.world_books.create({
    name: codexBookNameFor(chat.name, chatId),
    description: t("backend.worldBook.book.managedByLumiBooksThisBookMirrorsThe"),
    metadata: {
      [CODEX_BOOK_META_KEY]: chatId,
      lumibooks_created_at: Date.now()
    }
  }, userId);
  setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  await bindCodexBookToChat(chatId, book.id, userId);
  return book;
}
function unbindBookFromChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId);
    if (!chat)
      return;
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    const existing = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const filtered = existing.filter((id) => id !== bookId);
    const claimHeld = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    if (filtered.length === existing.length && !claimHeld)
      return;
    md["chat_world_book_ids"] = filtered;
    if (claimHeld)
      delete md[CODEX_BOOK_CLAIM_KEY];
    await spindle.chats.update(chatId, { metadata: md }, userId);
  });
}
async function reassertCodexBinding(chatId, userId) {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat)
    return false;
  const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
  const claimed = typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? md[CODEX_BOOK_CLAIM_KEY] : null;
  if (!claimed)
    return false;
  const attached = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
  if (attached.includes(claimed))
    return false;
  const book = await spindle.world_books.get(claimed, userId).catch(() => null);
  if (!book || !codexBookTaggedFor(book, chatId))
    return false;
  await bindCodexBookToChat(chatId, claimed, userId);
  return true;
}
var ROOT_CANDIDATES_TTL_MS = 8000;
var rootCandidatesCache = new Map;
function invalidateRootCandidates(userId) {
  rootCandidatesCache.delete(userId);
}
async function listRootCandidates(userId) {
  const cached = rootCandidatesCache.get(userId);
  if (cached && Date.now() - cached.at < ROOT_CANDIDATES_TTL_MS)
    return cached.data;
  const books = await listAllBooks(userId).catch(() => []);
  const out = [];
  for (const book of books) {
    const meta = book.metadata;
    const chatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
    if (!chatId)
      continue;
    const entries = await listAllEntries(book.id, userId).catch(() => []);
    let entryCount = 0;
    for (const e of entries) {
      const ext = e.extensions || {};
      if (ext[EXTENSION_KEY] && !e.disabled)
        entryCount++;
    }
    if (entryCount === 0)
      continue;
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    out.push({ chatId, chatName: chat?.name?.trim() || chatId.slice(0, 8), bookId: book.id, entryCount });
  }
  rootCandidatesCache.set(userId, { at: Date.now(), data: out });
  return out;
}

// src/backend/coverage.ts
function withLiveMessageRanges(entries, messages) {
  const indexes = new Map(messages.map((m) => [m.id, m.index_in_chat]));
  return entries.map((entry) => {
    if (entry.meta.isRoot)
      return entry;
    let first = Infinity, last = -Infinity;
    for (const id of entry.meta.msgIds) {
      const index = indexes.get(id);
      if (index === undefined)
        continue;
      first = Math.min(first, index);
      last = Math.max(last, index);
    }
    if (!Number.isFinite(first))
      return entry;
    return { ...entry, meta: { ...entry.meta, firstMsgIdx: first, lastMsgIdx: last } };
  });
}
async function buildCoverage(chatId, userId, preloadedEntries, includeGhosts = false, selectedEntryIds) {
  const allEntries = preloadedEntries ?? await listLmbEntries(chatId, userId);
  const entries = allEntries.filter((e) => (!selectedEntryIds || selectedEntryIds.has(e.raw.id)) && (!e.raw.disabled || includeGhosts && e.meta.ghost === true));
  const chapters = entries.filter((e) => e.meta.tier === 1);
  const arcs = entries.filter((e) => e.meta.tier === 2);
  const volumes = entries.filter((e) => e.meta.tier === 3);
  const byId = new Map(allEntries.map((e) => [e.raw.id, e]));
  const superseded = new Set;
  const visitSources = (entry, seen, fn) => {
    for (const id of entry.meta.sourceChapterEntryIds ?? []) {
      if (seen.has(id))
        continue;
      seen.add(id);
      const source = byId.get(id);
      if (!source || source.meta.tier >= entry.meta.tier)
        continue;
      fn(source);
      visitSources(source, seen, fn);
    }
  };
  for (const entry of entries)
    visitSources(entry, new Set([entry.raw.id]), (source) => superseded.add(source.raw.id));
  const activeEntries = entries.filter((e) => !superseded.has(e.raw.id)).sort((a, b) => b.meta.tier - a.meta.tier);
  const coveredBy = new Map;
  for (const entry of activeEntries) {
    const cover = (source) => {
      for (const id of source.meta.msgIds)
        if (!coveredBy.has(id))
          coveredBy.set(id, entry.raw.id);
    };
    cover(entry);
    visitSources(entry, new Set([entry.raw.id]), cover);
  }
  return { coveredBy, activeEntries, volumes, arcs, chapters };
}
function isExcluded(m) {
  const md = m.metadata;
  return !!(md && md["lmb_excluded"] === true);
}
function isEligibleForCount(m, _profile) {
  if (isExcluded(m))
    return false;
  const role = m.role;
  if (role === "system" || m.is_system)
    return false;
  return true;
}
function countEligible(messages, profile) {
  let n = 0;
  for (const m of messages)
    if (isEligibleForCount(m, profile))
      n++;
  return n;
}
function sumEligibleTokens(messages, profile) {
  let n = 0;
  for (const m of messages) {
    if (!isEligibleForCount(m, profile))
      continue;
    n += approximateTokensFromChars((m.content || "").length);
  }
  return n;
}
function sizeEligible(messages, unit, profile) {
  return unit === "tokens" ? sumEligibleTokens(messages, profile) : countEligible(messages, profile);
}
function computeCoverageStats(messages, coverage, profile) {
  const totalMessages = messages.length;
  let coveredMessages = 0;
  let approxUncoveredTokens = 0;
  for (const m of messages) {
    if (coverage.coveredBy.has(m.id)) {
      coveredMessages++;
    } else {
      approxUncoveredTokens += approximateTokensFromChars((m.content || "").length);
    }
  }
  const uncoveredMessages = totalMessages - coveredMessages;
  const lagSatisfied = sizeEligible(messages, profile.lagUnit, profile) >= profile.lagValue;
  const windowAvailable = selectUncoveredChapterWindow(messages, coverage, profile).length > 0;
  return {
    totalMessages,
    coveredMessages,
    uncoveredMessages,
    approxUncoveredTokens,
    lagSatisfied,
    windowAvailable
  };
}
function countCompressibleEligible(messages, coverage, profile) {
  const compressible = trimLagFromTail(messages, profile).filter((m) => !coverage.coveredBy.has(m.id));
  return sizeEligible(compressible, profile.windowUnit, profile);
}
function trimLagFromTail(uncoveredTail, profile) {
  if (uncoveredTail.length === 0)
    return [];
  if (profile.lagValue <= 0)
    return uncoveredTail.slice();
  if (profile.lagUnit === "messages") {
    let counted = 0;
    let cutoffIdx = uncoveredTail.length;
    for (let i = uncoveredTail.length - 1;i >= 0; i--) {
      if (isEligibleForCount(uncoveredTail[i], profile)) {
        counted++;
        if (counted >= profile.lagValue) {
          cutoffIdx = i;
          break;
        }
      }
    }
    if (counted < profile.lagValue)
      return [];
    return uncoveredTail.slice(0, cutoffIdx);
  }
  let lagged = 0;
  let cutoffIdx = 0;
  for (let i = uncoveredTail.length - 1;i >= 0; i--) {
    if (isEligibleForCount(uncoveredTail[i], profile)) {
      lagged += approximateTokensFromChars((uncoveredTail[i].content || "").length);
    }
    cutoffIdx = i;
    if (lagged >= profile.lagValue)
      break;
  }
  if (lagged < profile.lagValue)
    return [];
  return uncoveredTail.slice(0, cutoffIdx);
}
function selectUncoveredChapterWindow(messages, coverage, effProfile, allowPartial = false) {
  const kept = trimLagFromTail(messages, effProfile);
  const closesRun = (m) => coverage.coveredBy.has(m.id) || isExcluded(m);
  let i = 0;
  while (i < kept.length) {
    while (i < kept.length && closesRun(kept[i]))
      i++;
    if (i >= kept.length)
      return [];
    const run = [];
    let bounded = false;
    while (i < kept.length) {
      const m = kept[i];
      if (closesRun(m)) {
        bounded = true;
        break;
      }
      run.push(m);
      i++;
    }
    if (i === kept.length && messages[i] && closesRun(messages[i]))
      bounded = true;
    const runSize = sizeEligible(run, effProfile.windowUnit, effProfile);
    if (!allowPartial && !bounded && runSize < effProfile.windowValue)
      return [];
    if (runSize === 0)
      continue;
    const window = selectNextChapterWindow(run, { ...effProfile, lagValue: 0 });
    if (window.length > 0)
      return window;
  }
  return [];
}
function sumApproxTokens(messages) {
  let total = 0;
  for (const m of messages)
    total += approximateTokensFromChars((m.content || "").length);
  return total;
}
function liveEndPosition(msgIds, storedLastMsgIdx, posById) {
  let end = -1;
  for (const id of msgIds) {
    const p = posById.get(id);
    if (typeof p === "number" && p > end)
      end = p;
  }
  if (end !== -1)
    return end;
  return typeof storedLastMsgIdx === "number" ? storedLastMsgIdx : Number.MAX_SAFE_INTEGER;
}
function selectNextChapterWindow(uncoveredTail, profile) {
  const compressible = trimLagFromTail(uncoveredTail, profile);
  if (compressible.length === 0)
    return [];
  if (profile.windowUnit === "messages") {
    const out = [];
    let counted = 0;
    for (const m of compressible) {
      if (isExcluded(m)) {
        if (out.length > 0)
          break;
        continue;
      }
      out.push(m);
      if (isEligibleForCount(m, profile)) {
        counted++;
        if (counted >= profile.windowValue)
          break;
      }
    }
    return out;
  }
  return takeUntilTokens(compressible, profile.windowValue, profile);
}
function takeUntilTokens(messages, maxTokens, profile) {
  const out = [];
  let acc = 0;
  for (const m of messages) {
    if (isExcluded(m)) {
      if (out.length > 0)
        break;
      continue;
    }
    out.push(m);
    if (isEligibleForCount(m, profile)) {
      acc += approximateTokensFromChars((m.content || "").length);
    }
    if (acc >= maxTokens)
      break;
  }
  return out;
}
async function syncHiddenForCoveredMessages(chatId, messages, coverage, userId, desiredHidden) {
  const toFlip = [];
  for (const m of messages) {
    if (isExcluded(m))
      continue;
    const isCovered = coverage.coveredBy.has(m.id);
    if (!isCovered)
      continue;
    const currentlyHidden = !!(m.extra && m.extra.hidden);
    if (desiredHidden && !currentlyHidden)
      toFlip.push(m.id);
    else if (!desiredHidden && currentlyHidden)
      toFlip.push(m.id);
  }
  await setHidden(chatId, toFlip, desiredHidden);
}
async function setHidden(chatId, ids, hidden) {
  const failures = [];
  const CHUNK = 500;
  for (let i = 0;i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    try {
      await spindle.chat.setMessagesHidden(chatId, slice, hidden);
    } catch {
      for (const id of slice) {
        try {
          await spindle.chat.setMessageHidden(chatId, id, hidden);
        } catch (err) {
          failures.push(err);
        }
      }
    }
  }
  if (failures.length)
    throw new AggregateError(failures, t("backend.coverage.setHidden.couldNotUpdateVisibilityForMessagesRun", { length: failures.length }));
}
function pickOrphanedHiddenIds(messages, coverage) {
  const out = [];
  for (const m of messages) {
    if (isExcluded(m))
      continue;
    const currentlyHidden = !!(m.extra && m.extra.hidden);
    if (!currentlyHidden)
      continue;
    if (coverage.coveredBy.has(m.id))
      continue;
    out.push(m.id);
  }
  return out;
}
async function unhideCoveredMessages(chatId, msgIds, userId) {
  await setHidden(chatId, msgIds, false);
}
async function resyncVisibility(chatId, userId, desiredHiddenForCovered) {
  return withCommitMutex(userId, chatId, async () => {
    const messages = await spindle.chat.getMessages(chatId);
    const entries = await listLmbEntries(chatId, userId, true);
    const coverage = await buildCoverage(chatId, userId, entries);
    const orphanedHidden = pickOrphanedHiddenIds(messages, coverage);
    let hiddenBefore = 0;
    let unhiddenAfter = 0;
    if (orphanedHidden.length > 0) {
      await unhideCoveredMessages(chatId, orphanedHidden, userId);
      unhiddenAfter = orphanedHidden.length;
    }
    for (const m of messages) {
      if (isExcluded(m))
        continue;
      if (!coverage.coveredBy.has(m.id))
        continue;
      const currentlyHidden = !!(m.extra && m.extra.hidden);
      if (currentlyHidden !== desiredHiddenForCovered)
        hiddenBefore++;
    }
    if (hiddenBefore > 0) {
      await syncHiddenForCoveredMessages(chatId, messages, coverage, userId, desiredHiddenForCovered);
    }
    return { unhidden: unhiddenAfter + (desiredHiddenForCovered ? 0 : hiddenBefore), hidden: desiredHiddenForCovered ? hiddenBefore : 0 };
  });
}
function selectedChapterRuns(messages, ids) {
  const selected = new Set(ids);
  const runs = [];
  let current = [];
  for (const message of messages) {
    if (isExcluded(message)) {
      if (current.length)
        runs.push(current);
      current = [];
    } else if (selected.has(message.id))
      current.push(message.id);
  }
  if (current.length)
    runs.push(current);
  return runs;
}

// src/backend/shelf-actions.ts
async function editSummaryEntry(chatId, entryId, patch, userId) {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    if (!entries.some((entry) => entry.raw.id === entryId))
      throw new Error(t("backend.shelfActions.editSummaryEntry.thisSummaryIsNoLongerAvailableTo"));
    await updateEntry(entryId, patch, userId);
    invalidateBookCache(userId, chatId);
  });
}
async function clearSummaryShelf(chatId, userId) {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    const failures = [];
    let removed = 0;
    for (const entry of entries) {
      try {
        await deleteEntry(entry.raw.id, userId);
        removed++;
      } catch (err) {
        failures.push(err);
      }
    }
    invalidateBookCache(userId, chatId);
    if (failures.length)
      throw new AggregateError(failures, t("backend.shelfActions.clearSummaryShelf.removedSummariesButCouldNotBeDeleted", { removed, length: failures.length }));
    return removed;
  });
}
async function removeSummaryEntry(chatId, entryId, userId, release = false) {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    const entry = entries.find((e) => e.raw.id === entryId);
    if (!entry)
      return null;
    if (release && entry.meta.ghost)
      throw new Error(t("backend.shelfActions.removeSummaryEntry.aGhostChapterMustBeShelvedBefore"));
    const before = await buildCoverage(chatId, userId, entries);
    const parents = entries.filter((e) => e.meta.tier > entry.meta.tier && e.meta.sourceChapterEntryIds?.includes(entryId));
    try {
      for (const parent of parents) {
        const patch = {
          sourceChapterEntryIds: [...new Set([...parent.meta.sourceChapterEntryIds ?? [], ...entry.meta.sourceChapterEntryIds ?? []])],
          msgIds: [...new Set([...parent.meta.msgIds, ...entry.meta.msgIds])]
        };
        await patchEntryMeta(parent, patch, userId);
        parent.meta = { ...parent.meta, ...patch };
      }
      if (release)
        await releaseEntry(entry, userId);
      else
        await deleteEntry(entryId, userId);
      for (const parent of parents) {
        await patchEntryMeta(parent, { sourceChapterEntryIds: parent.meta.sourceChapterEntryIds.filter((id) => id !== entryId) }, userId).catch((err) => warn(`removed summary reference cleanup failed: ${describeError(err)}`));
      }
      for (const source of entries) {
        if (source.meta.supersededByEntryId !== entryId)
          continue;
        const parent = parents.find((p) => !p.raw.disabled);
        await patchEntryMeta(source, { supersededByEntryId: parent?.raw.id ?? null }, userId).catch((err) => warn(`removed summary backlink cleanup failed: ${describeError(err)}`));
      }
    } finally {
      invalidateBookCache(userId, chatId);
    }
    const after = await buildCoverage(chatId, userId);
    const uncovered = [...before.coveredBy.keys()].filter((id) => !after.coveredBy.has(id));
    await unhideCoveredMessages(chatId, uncovered, userId);
    return entry;
  });
}

// src/prompt-breakdown.ts
function normalizeBreakdown(raw, chatHistoryTokens = 0) {
  const entries = Array.isArray(raw["entries"]) ? raw["entries"] : null;
  if (!entries)
    return null;
  const clean = [];
  for (const e of entries) {
    if (!e || typeof e !== "object")
      continue;
    const tokens = typeof e["tokens"] === "number" ? e["tokens"] : 0;
    clean.push({
      name: typeof e["name"] === "string" ? e["name"] : "?",
      type: typeof e["type"] === "string" ? e["type"] : "utility",
      tokens,
      extensionName: typeof e["extensionName"] === "string" ? e["extensionName"] : undefined
    });
  }
  if (chatHistoryTokens > 0 && !clean.some((e) => e.type === "chat_history")) {
    clean.unshift({ name: t("promptBreakdown.assembledTranscript"), type: "chat_history", tokens: chatHistoryTokens, synthetic: true });
  }
  const summed = clean.reduce((a, e) => a + e.tokens, 0);
  return {
    entries: clean,
    totalTokens: typeof raw["totalTokens"] === "number" ? raw["totalTokens"] : summed,
    maxContext: typeof raw["maxContext"] === "number" ? raw["maxContext"] : 0,
    model: typeof raw["model"] === "string" ? raw["model"] : undefined,
    presetName: typeof raw["presetName"] === "string" ? raw["presetName"] : undefined
  };
}

// src/backend/prompt-breakdown.ts
async function loadPromptBreakdown(request, userId) {
  const generate = spindle.generate;
  if (typeof generate.getBreakdown !== "function") {
    throw new Error(t("backend.promptBreakdown.loadPromptBreakdown.thePromptPanelRequiresALumiverseUpdate"));
  }
  if (request.mode === "auto") {
    for (const messageId of request.messageIds.slice(-15).reverse()) {
      const saved = await generate.getBreakdown(messageId, userId);
      if (!saved)
        continue;
      const d = normalizeBreakdown(saved, typeof saved.chatHistoryTokens === "number" ? saved.chatHistoryTokens : 0);
      if (d)
        return { d, source: "fire" };
    }
  }
  const preview = await generate.dryRun({ chatId: request.chatId }, userId);
  const d = normalizeBreakdown({
    entries: preview.tokenCount?.breakdown ?? [],
    totalTokens: preview.tokenCount?.total_tokens,
    maxContext: preview.contextClipStats?.maxContext ?? 0,
    model: preview.model
  }, preview.chatHistoryTokens ?? 0);
  if (!d || d.entries.length === 0)
    throw new Error(t("backend.promptBreakdown.loadPromptBreakdown.dryRunReturnedNoBreakdown"));
  return { d, source: "dry" };
}

// src/backend/book-copy.ts
async function copyLmbEntries(targetBookId, sourceEntries, userId, transform) {
  const createdIds = [];
  try {
    return await copyEntries(targetBookId, sourceEntries, userId, transform, createdIds);
  } catch (err) {
    for (const id of createdIds.reverse()) {
      try {
        await spindle.world_books.entries.delete(id, userId);
      } catch (cleanupError) {
        warn(`copy rollback could not delete an entry: ${describeError(cleanupError)}`);
        try {
          await spindle.world_books.entries.update(id, { disabled: true }, userId);
        } catch (disableError) {
          warn(`copy rollback could not disable an entry: ${describeError(disableError)}`);
        }
      }
    }
    throw err;
  }
}
async function copyEntries(targetBookId, sourceEntries, userId, transform, createdIds) {
  const idMap = new Map;
  const clonedMeta = new Map;
  const ctx = { idMap, clonedMeta };
  const chapters = sourceEntries.filter((e) => e.meta.tier === 1);
  const groups = [2, 3, 4, 5, 6, 7].map((tier) => sourceEntries.filter((e) => e.meta.tier === tier));
  for (const ch of chapters) {
    const o = transform(ch, ctx);
    if (!o)
      continue;
    const meta = {
      ...ch.meta,
      msgIds: o.msgIds,
      firstMsgIdx: o.firstMsgIdx,
      lastMsgIdx: o.lastMsgIdx,
      supersededByEntryId: null,
      ...o.extra
    };
    const created = await createClone(targetBookId, ch.raw, meta, userId, o.comment);
    createdIds.push(created.id);
    idMap.set(ch.raw.id, created.id);
    clonedMeta.set(ch.raw.id, meta);
  }
  for (const group of groups) {
    for (const entry of group) {
      const o = transform(entry, ctx);
      if (!o)
        continue;
      const sourceChapterEntryIds = (entry.meta.sourceChapterEntryIds ?? []).map((oldId) => idMap.get(oldId)).filter((x) => typeof x === "string");
      const meta = {
        ...entry.meta,
        msgIds: o.msgIds,
        sourceChapterEntryIds,
        firstMsgIdx: o.firstMsgIdx,
        lastMsgIdx: o.lastMsgIdx,
        supersededByEntryId: null,
        ...o.extra
      };
      const created = await createClone(targetBookId, entry.raw, meta, userId, o.comment);
      createdIds.push(created.id);
      idMap.set(entry.raw.id, created.id);
      clonedMeta.set(entry.raw.id, meta);
    }
  }
  for (const src of sourceEntries) {
    const newId = idMap.get(src.raw.id);
    if (!newId)
      continue;
    const oldSuperId = src.meta.supersededByEntryId;
    if (!oldSuperId)
      continue;
    const newSuperId = idMap.get(oldSuperId);
    if (!newSuperId)
      continue;
    const baseMeta = clonedMeta.get(src.raw.id);
    if (!baseMeta)
      continue;
    const ext = src.raw.extensions || {};
    try {
      await spindle.world_books.entries.update(newId, { extensions: { ...ext, [EXTENSION_KEY]: { ...baseMeta, supersededByEntryId: newSuperId } } }, userId);
    } catch (err) {
      warn(`copyLmbEntries: failed to re-point entry ${newId.slice(0, 8)}: ${describeError(err)}`);
    }
  }
  return idMap;
}
async function createClone(bookId, source, meta, userId, commentOverride) {
  const ext = source.extensions || {};
  return spindle.world_books.entries.create(bookId, {
    content: source.content,
    comment: commentOverride ?? source.comment,
    disabled: source.disabled,
    ...activationFlags((await loadSettings(userId)).summaryActivationMode),
    key: source.key ?? [],
    keysecondary: source.keysecondary ?? [],
    extensions: { ...ext, [EXTENSION_KEY]: meta }
  }, userId);
}

// src/backend/codex/schema.ts
function isCodexFileKey(v) {
  return typeof v === "string" && CODEX_FILE_KEYS.includes(v);
}
var ENTITY_REF_RE = /^(char|loc|thing):[a-z0-9_]+$/;
function isEntityRef(v) {
  return typeof v === "string" && ENTITY_REF_RE.test(v);
}
function looksLikeEntityRef(v) {
  return /^(char|loc|thing):/.test(v);
}
var FILE_NAMESPACE = {
  characters: "char",
  locations: "loc",
  things: "thing"
};
var LOCKED_FIELD_MASK = "Locked, do not edit";
function emptyCodexFile(key) {
  switch (key) {
    case "characters":
    case "locations":
    case "things":
      return { entities: [] };
    case "relations":
      return { relations: [] };
    case "timeline":
      return { events: [] };
    case "threads":
      return { threads: [], seeds: [] };
    case "world":
      return { entries: [] };
    case "knowledge":
      return { items: [] };
  }
}
function emptyBundle() {
  return {
    characters: { entities: [] },
    locations: { entities: [] },
    things: { entities: [] },
    relations: { relations: [] },
    timeline: { events: [] },
    threads: { threads: [], seeds: [] },
    world: { entries: [] },
    knowledge: { items: [] }
  };
}
function bundleIsEmpty(bundle) {
  return bundle.characters.entities.length === 0 && bundle.locations.entities.length === 0 && bundle.things.entities.length === 0 && bundle.relations.relations.length === 0 && bundle.timeline.events.length === 0 && bundle.threads.threads.length === 0 && bundle.threads.seeds.length === 0 && bundle.world.entries.length === 0 && bundle.knowledge.items.length === 0;
}
var KEYWORD_LIMIT = 12;
var KEYWORD_MAX_WORDS = 2;
var KEYWORD_MAX_CHARS = 40;
function keywordArray(ctx, v, path, reserved) {
  const raw = strArray(ctx, v, path);
  if (!raw)
    return;
  const skip = new Set(reserved.map((r) => r.toLowerCase()));
  const seen = new Set;
  const out = [];
  let dropped = 0;
  for (const k of raw) {
    const key = k.toLowerCase();
    const tooLong = k.length > KEYWORD_MAX_CHARS || k.split(/\s+/).length > KEYWORD_MAX_WORDS;
    if (tooLong || seen.has(key) || skip.has(key) || out.length >= KEYWORD_LIMIT) {
      dropped++;
      continue;
    }
    seen.add(key);
    out.push(k);
  }
  if (dropped > 0) {
    ctx.notes.push(t("backend.codex.schema.keywordArray.keptOfDroppedTheRestAsDuplicates", { path, length: out.length, length2: raw.length, keywordMaxWords: KEYWORD_MAX_WORDS, keywordLimit: KEYWORD_LIMIT }));
  }
  return out.length ? out : undefined;
}
function fail(errors) {
  return { ok: false, errors };
}
function str(ctx, v, path, required) {
  if (v === undefined || v === null || v === "") {
    if (required)
      ctx.errors.push(t("backend.codex.schema.str.requiredNonEmptyString", { path }));
    return;
  }
  if (typeof v !== "string") {
    ctx.errors.push(t("backend.codex.schema.str.expectedAString", { path }));
    return;
  }
  const t2 = v.trim();
  if (!t2 && required) {
    ctx.errors.push(t("backend.codex.schema.str.requiredNonEmptyString", { path }));
    return;
  }
  return t2 || undefined;
}
function strArray(ctx, v, path) {
  if (v === undefined || v === null)
    return;
  if (!Array.isArray(v)) {
    ctx.errors.push(t("backend.codex.schema.strArray.expectedAnArrayOfStrings", { path }));
    return;
  }
  const out = [];
  v.forEach((x, i) => {
    if (typeof x !== "string")
      ctx.errors.push(t("backend.codex.schema.strArray.expectedAString", { path, i }));
    else if (x.trim())
      out.push(x.trim());
  });
  return out.length ? out : undefined;
}
function objArray(ctx, v, path) {
  if (v === undefined || v === null)
    return [];
  if (!Array.isArray(v)) {
    ctx.errors.push(t("backend.codex.schema.objArray.expectedAnArray", { path }));
    return [];
  }
  const out = [];
  v.forEach((x, i) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) {
      ctx.errors.push(t("backend.codex.schema.objArray.expectedAnObject", { path, i }));
    } else {
      out.push(x);
    }
  });
  return out;
}
function asRecord(ctx, raw, path) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    ctx.errors.push(t("backend.codex.schema.asRecord.expectedAJsonObject", { path }));
    return null;
  }
  return raw;
}
var CANONICAL_MIXED_CASE = new Set(["lockedFields", "noInject"]);
function keepExtras(ctx, target, source, known, path, strict) {
  for (const [k, v] of Object.entries(source)) {
    const lower = k.toLowerCase();
    if (known.some((f) => f === lower)) {
      if (k !== lower && strict && !CANONICAL_MIXED_CASE.has(k))
        ctx.errors.push(t("backend.codex.schema.keepExtras.useLowercase", { path, k, lower }));
      continue;
    }
    if (k === "__proto__")
      continue;
    if (typeof v === "string") {
      if (v.trim())
        target[k] = v.trim();
    } else if (typeof v === "number" && Number.isFinite(v)) {
      target[k] = v;
    } else if (typeof v === "boolean") {
      target[k] = v ? "true" : "false";
    } else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      const arr = v.map((x) => x.trim()).filter(Boolean);
      if (arr.length)
        target[k] = arr;
    } else if (v !== null && v !== undefined && strict) {
      ctx.errors.push(t("backend.codex.schema.keepExtras.extraFieldsMustBePrimitiveStringNumber", { path, k }));
    }
  }
}
var ENTITY_KNOWN_FIELDS = [
  "id",
  "name",
  "aliases",
  "kind",
  "role",
  "appearance",
  "description",
  "traits",
  "goals",
  "significance",
  "status",
  "ties",
  "notes",
  "keywords",
  "locked",
  "lockedfields",
  "noinject",
  "rid"
];
function ridOf(ctx, v, path) {
  if (v === undefined || v === null)
    return;
  if (typeof v !== "string" || !v.trim()) {
    ctx.errors.push(t("backend.codex.schema.ridOf.ridExpectedAShortString", { path }));
    return;
  }
  return v.trim().slice(0, 24);
}
function validateEntityFile(key, raw, opts) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, key);
  if (!root)
    return fail(ctx.errors);
  const ns = FILE_NAMESPACE[key];
  const seen = new Set;
  const entities = [];
  for (const [i, e] of objArray(ctx, root["entities"], "entities").entries()) {
    const path = `entities[${i}]`;
    const id = str(ctx, e["id"], `${path}.id`, true);
    const name = str(ctx, e["name"], `${path}.name`, true);
    if (!id || !name)
      continue;
    if (!ENTITY_REF_RE.test(id)) {
      ctx.errors.push(t("backend.codex.schema.validateEntityFile.idMustMatch", { path, id, ns }));
      continue;
    }
    if (!id.startsWith(`${ns}:`)) {
      ctx.errors.push(t("backend.codex.schema.validateEntityFile.idBelongsInAnotherFileIdsHere", { path, id, ns }));
      continue;
    }
    if (seen.has(id)) {
      ctx.errors.push(t("backend.codex.schema.validateEntityFile.idDuplicateId", { path, id }));
      continue;
    }
    seen.add(id);
    const out = { id, name };
    const aliases = strArray(ctx, e["aliases"], `${path}.aliases`);
    if (aliases)
      out.aliases = aliases;
    for (const f of ["kind", "role", "appearance", "description", "significance", "notes"]) {
      const v = str(ctx, e[f], `${path}.${f}`, false);
      if (v)
        out[f] = v;
    }
    if (e["locked"] === true || e["locked"] === "true")
      out.locked = true;
    const noInject = e["noInject"] ?? e["noinject"];
    if (noInject === true || noInject === "true")
      out.noInject = true;
    const lockedFields = strArray(ctx, e["lockedFields"] ?? e["lockedfields"], `${path}.lockedFields`);
    if (lockedFields) {
      const cleaned = [...new Set(lockedFields.filter((f) => f !== "id" && f !== "name"))];
      if (cleaned.length)
        out.lockedFields = cleaned;
    }
    if (opts.strictExtras === true && e["status"] !== undefined && e["status"] !== null && e["status"] !== "") {
      ctx.errors.push(t("backend.codex.schema.validateEntityFile.statusThisFieldWasRemovedKeepDurable", { path }));
    }
    for (const f of ["traits", "goals"]) {
      const v = strArray(ctx, e[f], `${path}.${f}`);
      if (v)
        out[f] = v;
    }
    const kw = keywordArray(ctx, e["keywords"], `${path}.keywords`, [name, ...out.aliases ?? []]);
    if (kw)
      out.keywords = kw;
    const ties = strArray(ctx, e["ties"], `${path}.ties`);
    if (ties) {
      if (opts.relationsTable && !out.locked) {
        ctx.errors.push(t("backend.codex.schema.validateEntityFile.tiesTheRelationsTableIsEnabledMove", { path }));
      } else {
        out.ties = ties;
      }
    }
    keepExtras(ctx, out, e, ENTITY_KNOWN_FIELDS, path, opts.strictExtras === true);
    entities.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { entities }, notes: ctx.notes };
}
function validateRelationsFile(raw, opts) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, "relations");
  if (!root)
    return fail(ctx.errors);
  const rawLen = Array.isArray(root["relations"]) ? root["relations"].length : 0;
  if (!opts.relationsTable && rawLen > 0) {
    return fail([t("backend.codex.schema.validateRelationsFile.relationsTheRelationsTableIsDisabledFor")]);
  }
  const rows = objArray(ctx, root["relations"], "relations");
  const relations = [];
  for (const [i, r] of rows.entries()) {
    const path = `relations[${i}]`;
    const type = r["type"];
    const rid = ridOf(ctx, r["rid"], path);
    if (type === "pair") {
      const a = str(ctx, r["a"], `${path}.a`, true);
      const b = str(ctx, r["b"], `${path}.b`, true);
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      if (!a || !b || !kind || !state)
        continue;
      if (!isEntityRef(a))
        ctx.errors.push(t("backend.codex.schema.validateRelationsFile.aIsNotAValidEntityRef", { path, a }));
      if (!isEntityRef(b))
        ctx.errors.push(t("backend.codex.schema.validateRelationsFile.bIsNotAValidEntityRef", { path, b }));
      if (a === b)
        ctx.errors.push(t("backend.codex.schema.validateRelationsFile.aAndBAreTheSameEntity", { path }));
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({ type: "pair", ...rid ? { rid } : {}, a, b, kind, state, ...history ? { history } : {} });
    } else if (type === "group") {
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      const members = [...new Set(strArray(ctx, r["members"], `${path}.members`) ?? [])];
      if (!kind || !state)
        continue;
      if (members.length < 2)
        ctx.errors.push(t("backend.codex.schema.validateRelationsFile.membersAGroupNeedsAtLeast2", { path }));
      for (const m of members) {
        if (!isEntityRef(m))
          ctx.errors.push(t("backend.codex.schema.validateRelationsFile.membersIsNotAValidEntityRef", { path, m }));
      }
      let roles;
      const rawRoles = r["roles"];
      if (rawRoles !== undefined && rawRoles !== null) {
        const rec = asRecord(ctx, rawRoles, `${path}.roles`);
        if (rec) {
          roles = {};
          for (const [k, v] of Object.entries(rec)) {
            if (!isEntityRef(k))
              ctx.errors.push(t("backend.codex.schema.validateRelationsFile.rolesKeyIsNotAValidEntity", { path, k }));
            else if (typeof v !== "string" || !v.trim())
              ctx.errors.push(t("backend.codex.schema.validateRelationsFile.rolesExpectedAStringRole", { path, k }));
            else
              roles[k] = v.trim();
          }
          if (Object.keys(roles).length === 0)
            roles = undefined;
        }
      }
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({
        type: "group",
        ...rid ? { rid } : {},
        kind,
        members,
        state,
        ...roles ? { roles } : {},
        ...history ? { history } : {}
      });
    } else {
      ctx.errors.push(t("backend.codex.schema.validateRelationsFile.typeExpectedPairOrGroup", { path }));
    }
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { relations }, notes: ctx.notes };
}
function validateTimelineFile(raw) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, "timeline");
  if (!root)
    return fail(ctx.errors);
  const events = [];
  for (const [i, e] of objArray(ctx, root["events"], "events").entries()) {
    const path = `events[${i}]`;
    const when = str(ctx, e["when"], `${path}.when`, true);
    const event = str(ctx, e["event"], `${path}.event`, true);
    const rid = ridOf(ctx, e["rid"], path);
    if (!when || !event)
      continue;
    const out = { ...rid ? { rid } : {}, when, event };
    const participants = strArray(ctx, e["participants"], `${path}.participants`);
    if (participants)
      out.participants = participants;
    const where = str(ctx, e["where"], `${path}.where`, false);
    if (where)
      out.where = where;
    const causes = str(ctx, e["causes"], `${path}.causes`, false);
    if (causes)
      out.causes = causes;
    events.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { events }, notes: ctx.notes };
}
function validateThreadsFile(raw) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, "threads");
  if (!root)
    return fail(ctx.errors);
  const threads = [];
  for (const [i, t2] of objArray(ctx, root["threads"], "threads").entries()) {
    const path = `threads[${i}]`;
    const name = str(ctx, t2["name"], `${path}.name`, true);
    const summary = str(ctx, t2["summary"], `${path}.summary`, true);
    const status = t2["status"];
    const rid = ridOf(ctx, t2["rid"], path);
    if (!name || !summary)
      continue;
    if (status !== "open" && status !== "stalled" && status !== "resolved" && status !== "abandoned") {
      ctx.errors.push(t("backend.codex.schema.validateThreadsFile.statusExpectedOpenStalledResolvedAbandoned", { path }));
      continue;
    }
    const out = { ...rid ? { rid } : {}, name, status, summary };
    const latest = str(ctx, t2["latest"], `${path}.latest`, false);
    if (latest)
      out.latest = latest;
    const planted = strArray(ctx, t2["planted"], `${path}.planted`);
    if (planted)
      out.planted = planted;
    threads.push(out);
  }
  const seeds = strArray(ctx, root["seeds"], "seeds") ?? [];
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { threads, seeds }, notes: ctx.notes };
}
function validateWorldFile(raw) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, "world");
  if (!root)
    return fail(ctx.errors);
  const entries = [];
  for (const [i, e] of objArray(ctx, root["entries"], "entries").entries()) {
    const path = `entries[${i}]`;
    const topic = str(ctx, e["topic"], `${path}.topic`, true);
    const facts = strArray(ctx, e["facts"], `${path}.facts`) ?? [];
    const rid = ridOf(ctx, e["rid"], path);
    if (!topic)
      continue;
    if (facts.length === 0) {
      ctx.errors.push(t("backend.codex.schema.validateWorldFile.factsAtLeastOneFactRequiredDrop", { path }));
      continue;
    }
    const keywords = keywordArray(ctx, e["keywords"], `${path}.keywords`, [topic]);
    entries.push({ ...rid ? { rid } : {}, topic, facts, ...keywords ? { keywords } : {} });
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { entries }, notes: ctx.notes };
}
function validateKnowledgeFile(raw) {
  const ctx = { errors: [], notes: [] };
  const root = asRecord(ctx, raw, "knowledge");
  if (!root)
    return fail(ctx.errors);
  const items = [];
  const seen = new Map;
  for (const [i, k] of objArray(ctx, root["items"], "items").entries()) {
    const path = `items[${i}]`;
    const fact = str(ctx, k["fact"], `${path}.fact`, true);
    const rid = ridOf(ctx, k["rid"], path);
    if (!fact)
      continue;
    const out = { ...rid ? { rid } : {}, fact };
    const knownBy = strArray(ctx, k["knownBy"], `${path}.knownBy`);
    if (knownBy)
      out.knownBy = knownBy;
    const hiddenFrom = strArray(ctx, k["hiddenFrom"], `${path}.hiddenFrom`);
    if (hiddenFrom)
      out.hiddenFrom = hiddenFrom;
    const rawBeliefs = k["falseBeliefs"];
    if (rawBeliefs !== undefined && rawBeliefs !== null) {
      const beliefs = [];
      for (const [j, b] of objArray(ctx, rawBeliefs, `${path}.falseBeliefs`).entries()) {
        const who = str(ctx, b["who"], `${path}.falseBeliefs[${j}].who`, true);
        const believes = str(ctx, b["believes"], `${path}.falseBeliefs[${j}].believes`, true);
        if (who && believes)
          beliefs.push({ who, believes });
      }
      if (beliefs.length)
        out.falseBeliefs = beliefs;
    }
    const note = str(ctx, k["note"], `${path}.note`, false);
    if (note)
      out.note = note;
    const keywords = keywordArray(ctx, k["keywords"], `${path}.keywords`, []);
    if (keywords)
      out.keywords = keywords;
    if (out.knownBy && out.hiddenFrom) {
      const known = new Set(out.knownBy.map((s) => s.toLowerCase()));
      const both = out.hiddenFrom.filter((s) => known.has(s.toLowerCase()));
      if (both.length) {
        ctx.errors.push(t("backend.codex.schema.validateKnowledgeFile.appearsInBothKnownByAndHiddenFromWrite", { path, join: both.join(", ") }));
        continue;
      }
    }
    if (!out.knownBy && !out.hiddenFrom && !out.falseBeliefs) {
      ctx.errors.push(t("backend.codex.schema.validateKnowledgeFile.needsAtLeastOneOfKnownByHiddenFrom", { path }));
      continue;
    }
    const signature = JSON.stringify({
      fact: out.fact,
      knownBy: [...out.knownBy ?? []].sort(),
      hiddenFrom: [...out.hiddenFrom ?? []].sort(),
      falseBeliefs: (out.falseBeliefs ?? []).map((belief) => JSON.stringify(belief)).sort(),
      note: out.note,
      keywords: [...out.keywords ?? []].sort()
    });
    const duplicate = seen.get(signature);
    if (duplicate) {
      if (!duplicate.rid && out.rid)
        duplicate.rid = out.rid;
      ctx.notes.push(t("backend.codex.schema.validateKnowledgeFile.omittedDuplicateKnowledgeItem", { path }));
      continue;
    }
    seen.set(signature, out);
    items.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { items }, notes: ctx.notes };
}
function validateCodexFile(key, raw, opts) {
  switch (key) {
    case "characters":
    case "locations":
    case "things":
      return validateEntityFile(key, raw, opts);
    case "relations":
      return validateRelationsFile(raw, opts);
    case "timeline":
      return validateTimelineFile(raw);
    case "threads":
      return validateThreadsFile(raw);
    case "world":
      return validateWorldFile(raw);
    case "knowledge":
      return validateKnowledgeFile(raw);
  }
}
function collectEntityIds(bundle) {
  const ids = new Set;
  for (const file of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of file.entities)
      ids.add(e.id);
  }
  return ids;
}
function collectDangling(bundle) {
  const ids = collectEntityIds(bundle);
  const out = [];
  const check = (ref, path, file) => {
    if (looksLikeEntityRef(ref) && !ids.has(ref))
      out.push({ ref, path, file });
  };
  bundle.relations.relations.forEach((r, i) => {
    if (r.type === "pair") {
      check(r.a, `relations[${i}].a`, "relations");
      check(r.b, `relations[${i}].b`, "relations");
    } else {
      r.members.forEach((m) => check(m, `relations[${i}].members`, "relations"));
      for (const k of Object.keys(r.roles ?? {}))
        check(k, `relations[${i}].roles`, "relations");
    }
  });
  bundle.knowledge.items.forEach((k, i) => {
    (k.knownBy ?? []).forEach((w) => check(w, `knowledge items[${i}].knownBy`, "knowledge"));
    (k.hiddenFrom ?? []).forEach((w) => check(w, `knowledge items[${i}].hiddenFrom`, "knowledge"));
    (k.falseBeliefs ?? []).forEach((b, j) => check(b.who, `knowledge items[${i}].falseBeliefs[${j}].who`, "knowledge"));
  });
  bundle.timeline.events.forEach((e, i) => {
    (e.participants ?? []).forEach((p) => check(p, `timeline events[${i}].participants`, "timeline"));
    if (e.where)
      check(e.where, `timeline events[${i}].where`, "timeline");
  });
  return out;
}
function formatDangling(d) {
  return d.file === "relations" ? t("backend.codex.schema.formatDangling.isNotDefinedInAnyEntityFile", { path: d.path, ref: d.ref }) : t("backend.codex.schema.formatDangling.isNotDefinedInAnyEntityFile2", { path: d.path, ref: d.ref });
}
function checkIntegrity(bundle) {
  return collectDangling(bundle).map(formatDangling);
}
function newDangling(bundle, tolerate) {
  const used = new Map;
  const out = [];
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    const budget = tolerate.get(key) ?? 0;
    const spent = used.get(key) ?? 0;
    used.set(key, spent + 1);
    if (spent < budget)
      continue;
    out.push(d);
  }
  return out;
}
function danglingKey(d) {
  return `${d.file}::${d.ref}`;
}
function formatDanglingRef(d) {
  return formatDangling(d);
}
function newDanglingErrors(bundle, tolerate) {
  return newDangling(bundle, tolerate).map(formatDangling);
}
function repairDanglingRefs(bundle, files) {
  const ids = collectEntityIds(bundle);
  const fixed = [];
  const fix = (ref, path) => {
    if (!looksLikeEntityRef(ref) || ids.has(ref))
      return ref;
    const plain = ref.slice(ref.indexOf(":") + 1).replace(/_/g, " ").trim();
    if (!plain)
      return ref;
    fixed.push(t("backend.codex.schema.fix.wasNotAKnownEntityRecordedAs", { path, ref, plain }));
    return plain;
  };
  if (files.has("knowledge")) {
    bundle.knowledge.items.forEach((k, i) => {
      if (k.knownBy)
        k.knownBy = k.knownBy.map((w) => fix(w, `knowledge items[${i}].knownBy`));
      if (k.hiddenFrom)
        k.hiddenFrom = k.hiddenFrom.map((w) => fix(w, `knowledge items[${i}].hiddenFrom`));
      (k.falseBeliefs ?? []).forEach((b, j) => {
        b.who = fix(b.who, `knowledge items[${i}].falseBeliefs[${j}].who`);
      });
    });
  }
  if (files.has("timeline")) {
    bundle.timeline.events.forEach((e, i) => {
      if (e.participants)
        e.participants = e.participants.map((p) => fix(p, `timeline events[${i}].participants`));
      if (e.where)
        e.where = fix(e.where, `timeline events[${i}].where`);
    });
  }
  return fixed;
}
function newDanglingFiles(bundle, tolerate) {
  return new Set(newDangling(bundle, tolerate).map((d) => d.file));
}
function danglingRefCounts(bundle) {
  const m = new Map;
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}
var FILE_ROW_KEY = {
  characters: { field: "entities", key: "id" },
  locations: { field: "entities", key: "id" },
  things: { field: "entities", key: "id" },
  relations: { field: "relations", key: "rid" },
  timeline: { field: "events", key: "rid" },
  threads: { field: "threads", key: "rid" },
  world: { field: "entries", key: "rid" },
  knowledge: { field: "items", key: "rid" }
};
function fileRows(value, key) {
  const arr = value[FILE_ROW_KEY[key].field];
  return Array.isArray(arr) ? arr : [];
}
function assignMissingRids(key, value) {
  if (FILE_ROW_KEY[key].key !== "rid")
    return;
  const rows = fileRows(value, key);
  let max = 0;
  const seen = new Set;
  for (const row of rows) {
    const rid = typeof row["rid"] === "string" ? row["rid"] : "";
    if (!rid || seen.has(rid)) {
      delete row["rid"];
      continue;
    }
    seen.add(rid);
    const m = /^r(\d+)$/.exec(rid);
    if (m)
      max = Math.max(max, parseInt(m[1], 10));
  }
  for (const row of rows) {
    if (typeof row["rid"] === "string" && row["rid"])
      continue;
    let next = `r${++max}`;
    while (seen.has(next))
      next = `r${++max}`;
    row["rid"] = next;
    seen.add(next);
  }
}

// src/backend/codex/store.ts
var CODEX_DIR = "codex";
var SIG_CAP = 500;
function emptyCursor() {
  return {
    version: 1,
    lastMsgId: null,
    consumedSigs: [],
    fileStates: {},
    frozenAtRuns: {},
    refreshPending: [],
    prefixMsgId: null,
    pendingReconcile: false,
    reconcileUntilMsgId: null,
    relationsTableMode: null,
    rootOrigin: null,
    lastRunAt: null,
    lastRunStats: null,
    runs: 0,
    updatedAt: 0
  };
}
function normalizeRunStats(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.rounds !== "number" || typeof v.model !== "string")
    return null;
  return {
    rounds: v.rounds,
    promptTokens: typeof v.promptTokens === "number" ? v.promptTokens : 0,
    completionTokens: typeof v.completionTokens === "number" ? v.completionTokens : 0,
    model: v.model,
    ...typeof v.note === "string" && v.note.trim() ? { note: v.note.trim() } : {}
  };
}
function dir(chatId) {
  return `${CODEX_DIR}/${chatId}`;
}
function filePath(chatId, key) {
  return `${dir(chatId)}/${key}.json`;
}
function cursorPath(chatId) {
  return `${dir(chatId)}/cursor.json`;
}
function msgSig(role, content) {
  let h = 2166136261;
  const s = `${role}\x00${content}`;
  for (let i = 0;i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
async function loadCursor(chatId, userId) {
  const read = await readJsonFileRaw(cursorPath(chatId), userId);
  if (read.state === "unreadable") {
    throw new Error(t("backend.codex.store.loadCursor.theCodexCursorIsUnreadable", { error: read.error }));
  }
  const raw = read.state === "ok" ? read.value : null;
  if (!raw || typeof raw !== "object")
    return emptyCursor();
  return normalizeCursor(raw);
}
function normalizeCursor(raw) {
  const base = emptyCursor();
  const fileStates = {};
  if (raw.fileStates && typeof raw.fileStates === "object") {
    for (const [k, v] of Object.entries(raw.fileStates)) {
      if (v === "on" || v === "noInject" || v === "frozen")
        fileStates[k] = v;
    }
  }
  const frozenAtRuns = {};
  if (raw.frozenAtRuns && typeof raw.frozenAtRuns === "object") {
    for (const [k, v] of Object.entries(raw.frozenAtRuns)) {
      if (typeof v === "number" && Number.isFinite(v))
        frozenAtRuns[k] = v;
    }
  }
  return {
    version: 1,
    lastMsgId: typeof raw.lastMsgId === "string" && raw.lastMsgId ? raw.lastMsgId : null,
    consumedSigs: Array.isArray(raw.consumedSigs) ? raw.consumedSigs.filter((x) => !!x && typeof x === "object" && typeof x.id === "string" && typeof x.sig === "string") : base.consumedSigs,
    fileStates,
    frozenAtRuns,
    refreshPending: Array.isArray(raw.refreshPending) ? [...new Set(raw.refreshPending.filter((x) => typeof x === "string" && CODEX_FILE_KEYS.includes(x)))] : [],
    prefixMsgId: typeof raw.prefixMsgId === "string" && raw.prefixMsgId ? raw.prefixMsgId : null,
    pendingReconcile: raw.pendingReconcile === true,
    reconcileUntilMsgId: typeof raw.reconcileUntilMsgId === "string" && raw.reconcileUntilMsgId ? raw.reconcileUntilMsgId : null,
    relationsTableMode: typeof raw.relationsTableMode === "boolean" ? raw.relationsTableMode : null,
    rootOrigin: typeof raw.rootOrigin === "string" && raw.rootOrigin ? raw.rootOrigin : null,
    lastRunAt: typeof raw.lastRunAt === "number" ? raw.lastRunAt : null,
    lastRunStats: normalizeRunStats(raw.lastRunStats),
    runs: typeof raw.runs === "number" && Number.isFinite(raw.runs) ? raw.runs : 0,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0
  };
}
async function saveCursor(chatId, cursor, userId) {
  const overflow = cursor.consumedSigs.length - SIG_CAP;
  const prefixMsgId = overflow > 0 ? cursor.consumedSigs[overflow - 1].id : cursor.prefixMsgId;
  const trimmed = {
    ...cursor,
    prefixMsgId,
    consumedSigs: cursor.consumedSigs.slice(-SIG_CAP),
    updatedAt: Date.now()
  };
  await spindle.userStorage.setJson(cursorPath(chatId), trimmed, { indent: 0, userId });
}
async function readJsonFileRaw(path, userId) {
  let exists;
  try {
    exists = await spindle.userStorage.exists(path, userId);
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
  if (!exists)
    return { state: "absent" };
  try {
    const text = await spindle.userStorage.read(path, userId);
    return { state: "ok", value: JSON.parse(text) };
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
}
function readCodexFileRaw(chatId, key, userId) {
  return readJsonFileRaw(filePath(chatId, key), userId);
}
async function loadCodex(chatId, userId, opts) {
  const bundle = emptyBundle();
  const problems = [];
  await Promise.all(CODEX_FILE_KEYS.map(async (key) => {
    const read = await readCodexFileRaw(chatId, key, userId);
    if (read.state === "absent")
      return;
    if (read.state === "unreadable") {
      problems.push({ file: key, errors: [t("backend.codex.store.loadCodex.unreadableOnDisk", { error: read.error })] });
      warn(`codex: ${key}.json for ${chatId.slice(0, 8)} is unreadable: ${read.error}`);
      return;
    }
    const result = validateCodexFile(key, read.value, opts);
    if (result.ok) {
      assignMissingRids(key, result.value);
      bundle[key] = result.value;
    } else {
      problems.push({ file: key, errors: result.errors });
      warn(`codex: ${key}.json for ${chatId.slice(0, 8)} failed validation, treating as empty: ${result.errors.slice(0, 3).join("; ")}`);
    }
  }));
  return { bundle, problems };
}
async function saveCodexFile(chatId, key, value, userId) {
  await spindle.userStorage.setJson(filePath(chatId, key), value, { indent: 1, userId });
}
async function codexExists(chatId, userId) {
  return spindle.userStorage.exists(cursorPath(chatId), userId).catch(() => false);
}
async function codexPresence(chatId, userId) {
  const exists = await spindle.userStorage.exists(cursorPath(chatId), userId);
  return exists ? "present" : "absent";
}
async function codexHasAnyDataFile(chatId, userId) {
  for (const key of CODEX_FILE_KEYS) {
    if (await spindle.userStorage.exists(filePath(chatId, key), userId))
      return true;
  }
  return false;
}
var cursorChain = new Map;
function withCursorLock(chatId, userId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = cursorChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  cursorChain.set(key, guarded);
  guarded.then(() => {
    if (cursorChain.get(key) === guarded)
      cursorChain.delete(key);
  });
  return tail;
}
async function deleteCodex(chatId, userId) {
  const failed = [];
  for (const key of CODEX_FILE_KEYS) {
    let exists;
    try {
      exists = await spindle.userStorage.exists(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: exists() failed for ${key}.json of ${chatId.slice(0, 8)}: ${describeError(err)}`);
      continue;
    }
    if (!exists)
      continue;
    try {
      await spindle.userStorage.delete(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: failed to delete ${key}.json for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    }
  }
  if (failed.length === 0) {
    await spindle.userStorage.delete(cursorPath(chatId), userId).catch((err) => {
      warn(`codex: failed to delete cursor for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    });
  }
  return failed;
}
async function copyCodexToEmptyChat(fromChatId, toChatId, userId, commitCursor) {
  const files = [];
  for (const key of CODEX_FILE_KEYS) {
    const read = await readCodexFileRaw(fromChatId, key, userId);
    if (read.state === "unreadable")
      throw new Error(t("backend.codex.store.copyCodexToEmptyChat.jsonIsUnreadableOnTheSourceChat", { key, error: read.error }));
    if (read.state === "ok")
      files.push({ key, value: read.value });
  }
  if (!files.length)
    return false;
  const attempted = [];
  try {
    for (const { key, value } of files) {
      attempted.push(key);
      await spindle.userStorage.setJson(filePath(toChatId, key), value, { indent: 1, userId });
    }
    await commitCursor();
    return true;
  } catch (err) {
    for (const key of attempted.reverse()) {
      try {
        await spindle.userStorage.delete(filePath(toChatId, key), userId);
      } catch (rollbackError) {
        warn(`Codex copy rollback failed for ${toChatId}/${key}: ${describeError(rollbackError)}`);
      }
    }
    throw err;
  }
}
async function inheritCodex(fromChatId, toChatId, userId, remapId, reconcileUntilId) {
  if (await codexPresence(fromChatId, userId) !== "present")
    return false;
  return withCursorLock(toChatId, userId, async () => {
    if (await codexHasAnyDataFile(toChatId, userId))
      return false;
    let preFreeze = null;
    if (await codexPresence(toChatId, userId) === "present") {
      const target = await loadCursor(toChatId, userId);
      const untouched = target.runs === 0 && target.consumedSigs.length === 0 && target.lastMsgId === null;
      if (!untouched)
        return false;
      preFreeze = target;
    }
    const cursor = await loadCursor(fromChatId, userId);
    const sigs = [];
    for (const rec of cursor.consumedSigs) {
      const mapped = remapId(rec.id);
      if (!mapped)
        break;
      sigs.push({ id: mapped, sig: rec.sig });
    }
    const mappedLast = cursor.lastMsgId ? remapId(cursor.lastMsgId) : null;
    const mappedPrefix = cursor.prefixMsgId ? remapId(cursor.prefixMsgId) : null;
    const prefixEnd = sigs.length ? sigs[sigs.length - 1].id : mappedPrefix;
    const next = {
      ...cursor,
      consumedSigs: sigs,
      lastMsgId: sigs.length < cursor.consumedSigs.length ? prefixEnd : mappedLast ?? prefixEnd,
      prefixMsgId: mappedPrefix,
      pendingReconcile: true,
      reconcileUntilMsgId: reconcileUntilId,
      ...preFreeze ? {
        fileStates: { ...cursor.fileStates, ...preFreeze.fileStates },
        frozenAtRuns: { ...cursor.frozenAtRuns, ...preFreeze.frozenAtRuns }
      } : {}
    };
    return copyCodexToEmptyChat(fromChatId, toChatId, userId, () => saveCursor(toChatId, next, userId));
  });
}
async function adoptCodexFrom(fromChatId, toChatId, userId) {
  if (fromChatId === toChatId)
    return "same_chat";
  if (await codexPresence(fromChatId, userId) !== "present")
    return "no_source";
  return withCursorLock(toChatId, userId, async () => {
    if (await codexHasAnyDataFile(toChatId, userId))
      return "has_own";
    const source = await loadCursor(fromChatId, userId);
    const next = {
      ...emptyCursor(),
      fileStates: { ...source.fileStates },
      relationsTableMode: source.relationsTableMode,
      rootOrigin: fromChatId,
      updatedAt: Date.now()
    };
    const copied = await copyCodexToEmptyChat(fromChatId, toChatId, userId, () => saveCursor(toChatId, next, userId));
    return copied ? "ok" : "no_source";
  });
}
async function setCodexOrphaned(chatId, userId, orphaned) {
  const path = `${dir(chatId)}/orphaned.json`;
  const exists = await spindle.userStorage.exists(path, userId);
  if (orphaned && !exists)
    await spindle.userStorage.setJson(path, { version: 1 }, { indent: 0, userId });
  else if (!orphaned && exists)
    await spindle.userStorage.delete(path, userId);
}
async function listCodexChatIds(userId, includeOrphaned = false) {
  const paths = await spindle.userStorage.list(CODEX_DIR, userId).catch(() => []);
  const ids = new Set;
  const orphaned = new Set;
  for (const raw of paths) {
    const p = raw.replace(/\\/g, "/");
    const rest = p.startsWith(`${CODEX_DIR}/`) ? p.slice(CODEX_DIR.length + 1) : p;
    const chatId = rest.split("/")[0];
    if (chatId && chatId !== rest)
      ids.add(chatId);
    if (rest === `${chatId}/orphaned.json`)
      orphaned.add(chatId);
  }
  return [...ids].filter((id) => includeOrphaned || !orphaned.has(id));
}
async function readCodexFilesRaw(chatId, userId) {
  const out = {};
  await Promise.all(CODEX_FILE_KEYS.map(async (key) => {
    const read = await readCodexFileRaw(chatId, key, userId);
    if (read.state === "unreadable") {
      warn(`codex: read ${key}.json failed: ${read.error}`);
      out[key] = t("backend.codex.store.readCodexFilesRaw.unreadableJsonTheFileExistsButCannot", { key, error: read.error });
      return;
    }
    out[key] = JSON.stringify(read.state === "ok" ? read.value : emptyCodexFile(key), null, 2);
  }));
  return out;
}
async function clearCodexStaleFlags(chatId, userId) {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    cursor.refreshPending = [];
    for (const file of CODEX_FILE_KEYS) {
      if (cursor.fileStates[file] === "frozen")
        cursor.frozenAtRuns[file] = cursor.runs;
      else
        delete cursor.frozenAtRuns[file];
    }
    await saveCursor(chatId, cursor, userId);
  });
}

// src/prompts/fill.ts
function fillPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars) ? String(vars[k]) : m);
}
// spindle.json
var spindle_default = {
  identifier: "lumi_books",
  version: "1.1.3",
  name: "LumiBooks",
  author: "AMousePad",
  github: "https://github.com/AMousePad/LumiBooks",
  homepage: "https://github.com/AMousePad/LumiBooks",
  description: "Memoria the librarian compresses old chat into chapters and arcs, splicing them back into your prompt where the messages used to be.",
  permissions: [
    "world_books",
    "chats",
    "chat_mutation",
    "interceptor",
    "generation",
    "memories",
    "characters",
    "regex_scripts"
  ],
  entry_backend: "dist/backend.js",
  entry_frontend: "dist/frontend.js",
  interceptorTimeoutMs: 300000,
  minimum_lumiverse_version: "1.2.5"
};

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

// src/backend/diagnostics.ts
var DIAGNOSTICS_PATH = "diagnostics.json";
var DIAGNOSTICS_MAX_BYTES = 1e7;
var MAX_EVENT_BYTES = 512 * 1024;
var MAX_ROWS = 4096;
var MAX_PENDING = 64;
var encoder = new TextEncoder;
var EVENTS = ["operation", "request", "selection", "context", "retry", "failure", "preview", "commit", "fork", "snapshot", "injection", "codex", "action", "message", "ghost", "frontend"];
var MODES = ["automatic", "manual", "selected", "regenerate", "ghost", "chapter", "arc", "volume", "series", "saga", "library", "universe", "codex"];
var OUTCOMES = ["started", "finished", "success", "failed", "skipped", "created", "removed", "pending"];
var REASONS = ["busy", "empty", "no_window", "generation", "storage", "coverage_changed", "unknown", "cancelled", "excluded", "missing", "adoption", "snapshot_unavailable", "timeout", "invalid_output", "context_limit", "connection", "protocol", "stale"];
var NUMBER_KEYS = ["tier", "attempt", "durationMs", "total", "covered", "uncovered", "excluded", "eligible", "hidden", "selected", "requested", "missing", "entries", "previous", "first", "last", "input", "output", "sourceCount", "changed", "rounds", "promptTokens", "completionTokens", "indexGaps", "duplicateIndexes", "gaps", "overlaps", "rangeMismatches", "missingSources", "lag", "window", "previousCount", "retryCount", "regexOutgoing", "regexIncoming", "arcBatch", "arcLag", "inputCharacters", "outputCharacters", "maxInputTokens", "maxOutputTokens", "temperature", "targetPercent", "targetTokens"];
var FLAGS = ["automation", "ghost", "regeneration", "previews", "hideCovered", "extraContext", "lagTokens", "windowTokens", "active", "root", "disabled", "vector", "constant"];
var ACTIONS = ["save_settings", "save_profile", "save_samplers", "set_active_profile", "create_chapter", "create_chapter_range", "create_all_chapters", "create_arc", "create_arc_from", "create_all_arcs", "create_higher_from", "create_higher_auto", "create_volume_from", "retry_last_failure", "delete_entry", "release_entry", "regenerate_entry", "update_entry", "resync_hidden", "resync_visibility", "abort_busy", "accept_preview", "discard_preview", "edit_preview", "rebase_root", "rebuild_root", "detach_root", "set_message_excluded", "summary_import", "summary_import_resolve", "codex_update_now", "codex_reset", "codex_rebuild", "codex_tidy"];
var queues = new Map;
var pendingTotal = 0;
var healthByUser = new Map;
function health(userId) {
  let value = healthByUser.get(userId);
  if (!value) {
    if (healthByUser.size >= 100)
      healthByUser.delete(healthByUser.keys().next().value);
    value = { queueDrops: 0, writeFailures: 0 };
    healthByUser.set(userId, value);
  }
  return value;
}
function serial(userId, task) {
  const next = (queues.get(userId) ?? Promise.resolve()).then(task, task);
  queues.set(userId, next);
  next.finally(() => {
    if (queues.get(userId) === next)
      queues.delete(userId);
  }).catch(() => {});
  return next;
}
function number(value) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER ? value : undefined;
}
function bool(value) {
  return typeof value === "boolean" ? value : undefined;
}
function choice(value, choices) {
  return choices.includes(value) ? value : undefined;
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function size(value) {
  return encoder.encode(JSON.stringify(value)).length;
}
function project(raw, stored) {
  const v = object(raw);
  const event = choice(v.event, EVENTS);
  const ref = (id) => typeof id === "string" && id.length > 0 && id.length <= 1024 && (!stored || /^r_[a-f0-9]{32}$/.test(id)) ? id : undefined;
  const chatId = ref(v.chatId);
  if (!event || !chatId)
    return null;
  const ui = event === "frontend" ? projectUiDiagnostic(v.ui) : undefined;
  if (event === "frontend" && !ui)
    return null;
  const numbers = {}, flags = {};
  for (const key of NUMBER_KEYS) {
    const n = number(object(v.numbers)[key]);
    if (n !== undefined)
      numbers[key] = n;
  }
  for (const key of FLAGS) {
    const b = bool(object(v.flags)[key]);
    if (b !== undefined)
      flags[key] = b;
  }
  let budget = MAX_ROWS, truncated = v.truncated === true;
  const take = (value) => {
    if (!Array.isArray(value))
      return [];
    const rows = value.slice(0, Math.max(0, budget));
    budget -= rows.length;
    if (rows.length < value.length)
      truncated = true;
    return rows;
  };
  const messages = take(v.messages).flatMap((raw) => {
    const m = object(raw), id = ref(m.id), index = number(m.index);
    return id && index !== undefined ? [{ id, index, position: number(m.position), coveredBy: ref(m.coveredBy), excluded: bool(m.excluded), hidden: bool(m.hidden), selected: bool(m.selected), eligible: bool(m.eligible), empty: bool(m.empty) }] : [];
  });
  const entries = take(v.entries).flatMap((raw) => {
    const e = object(raw), id = ref(e.id), tier = number(e.tier);
    if (!id || tier === undefined)
      return [];
    return [{
      id,
      tier,
      first: number(e.first),
      last: number(e.last),
      scene: number(e.scene),
      active: bool(e.active),
      root: bool(e.root),
      ghost: bool(e.ghost),
      disabled: bool(e.disabled),
      sourceCount: number(e.sourceCount),
      sourceEntryCount: number(e.sourceEntryCount),
      messages: take(e.messages).flatMap((id) => ref(id) ? [ref(id)] : []),
      sources: take(e.sources).flatMap((id) => ref(id) ? [ref(id)] : [])
    }];
  });
  return {
    event,
    chatId,
    relatedChatId: ref(v.relatedChatId),
    entryId: ref(v.entryId),
    replacesEntryId: ref(v.replacesEntryId),
    mode: choice(v.mode, MODES),
    outcome: choice(v.outcome, OUTCOMES),
    reason: choice(v.reason, REASONS),
    action: choice(v.action, [...ACTIONS, ...UI_OPERATIONS]),
    ui: ui ?? undefined,
    messageScope: choice(v.messageScope, ["all", "uncovered_and_selected", "selected", "assembled"]),
    numbers: event === "frontend" ? undefined : numbers,
    flags: event === "frontend" ? undefined : flags,
    messages: event === "frontend" ? undefined : messages,
    entries: event === "frontend" ? undefined : entries,
    seq: number(v.seq) ?? 0,
    at: number(v.at) ?? 0,
    truncated
  };
}
function empty() {
  return { schema: 1, salt: crypto.randomUUID().replaceAll("-", ""), next: 1, dropped: 0, events: [] };
}
async function read(userId, storage = spindle.userStorage) {
  const raw = object(await storage.getJson(DIAGNOSTICS_PATH, { fallback: null, userId }));
  if (raw.schema !== 1 || typeof raw.salt !== "string" || !/^[a-f0-9]{32}$/.test(raw.salt))
    return empty();
  const rows = Array.isArray(raw.events) ? raw.events : [];
  const store = {
    schema: 1,
    salt: raw.salt,
    next: Math.max(1, number(raw.next) ?? 1),
    dropped: Math.max(0, number(raw.dropped) ?? 0),
    events: rows.flatMap((row) => {
      const e = project(row, true);
      return e ? [e] : [];
    })
  };
  for (const event of store.events)
    store.next = Math.max(store.next, event.seq + 1);
  bound(store, userId);
  return store;
}
function report(store, userId) {
  return {
    format: "lumibooks-diagnostics",
    schema: 1,
    version: spindle_default.version,
    exportedAt: Date.now(),
    indexBase: 0,
    maxBytes: DIAGNOSTICS_MAX_BYTES,
    droppedEvents: store.dropped,
    queueDropsThisSession: health(userId).queueDrops,
    writeFailuresThisSession: health(userId).writeFailures,
    privacy: "Includes timestamps, counts, indexes, structural relationships and salted pseudonyms. Excludes chat/summary text, prompts, reasoning, names, raw IDs, content hashes, credentials and raw errors.",
    frontend: "ui.count aggregates repeats between ui.first/last (epoch ms); caps bits: 1 secure context, 2 randomUUID, 4 getRandomValues; line/column refer to the frontend bundle; overflow counts events dropped from the bounded browser queue.",
    events: store.events
  };
}
function bound(store, userId) {
  const sizes = store.events.map((event) => size(event) + 1);
  let bytes = sizes.reduce((sum, n) => sum + n, 0), removed = 0;
  while (removed < sizes.length) {
    const emptyStore = { ...store, events: [] };
    const overhead = Math.max(size(emptyStore), size(report(emptyStore, userId)));
    if (bytes - 1 + overhead <= DIAGNOSTICS_MAX_BYTES)
      break;
    bytes -= sizes[removed++];
    store.dropped++;
  }
  if (removed)
    store.events = store.events.slice(removed);
}
async function anonymize(event, salt) {
  const refs = new Map;
  const ref = (id) => {
    if (id === undefined)
      return Promise.resolve(undefined);
    if (!refs.has(id))
      refs.set(id, crypto.subtle.digest("SHA-256", encoder.encode(`${salt}\x00${id}`)).then((hash) => "r_" + [...new Uint8Array(hash).slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("")));
    return refs.get(id);
  };
  const [chatId, relatedChatId, entryId, replacesEntryId, messages, entries] = await Promise.all([
    ref(event.chatId),
    ref(event.relatedChatId),
    ref(event.entryId),
    ref(event.replacesEntryId),
    Promise.all((event.messages ?? []).map(async (m) => ({ ...m, id: await ref(m.id), coveredBy: await ref(m.coveredBy) }))),
    Promise.all((event.entries ?? []).map(async (e) => ({ ...e, id: await ref(e.id), messages: await Promise.all((e.messages ?? []).map(async (id) => await ref(id))), sources: await Promise.all((e.sources ?? []).map(async (id) => await ref(id))) })))
  ]);
  return {
    ...event,
    chatId,
    relatedChatId,
    entryId,
    replacesEntryId,
    messages: event.event === "frontend" ? undefined : messages,
    entries: event.event === "frontend" ? undefined : entries
  };
}
function recordDiagnostic(userId, input) {
  return recordDiagnostics(userId, [input]);
}
function recordDiagnostics(userId, inputs) {
  try {
    if (pendingTotal >= MAX_PENDING) {
      health(userId).queueDrops++;
      return Promise.resolve();
    }
    const events = inputs.slice(0, UI_BATCH_LIMIT).flatMap((input) => {
      const event = project(input, false);
      if (!event)
        return [];
      event.at = Date.now();
      return [event];
    });
    if (!events.length)
      return Promise.resolve();
    const storage = spindle.userStorage;
    pendingTotal++;
    return serial(userId, async () => {
      if ((await loadSettings(userId)).localLogsDisabled)
        return;
      const store = await read(userId, storage);
      for (const event of events) {
        const safe = await anonymize(event, store.salt);
        safe.seq = store.next++;
        if (size(safe) > MAX_EVENT_BYTES) {
          safe.messages = [];
          safe.entries = [];
          safe.truncated = true;
        }
        store.events.push(safe);
      }
      bound(store, userId);
      if ((await loadSettings(userId)).localLogsDisabled)
        return;
      await storage.setJson(DIAGNOSTICS_PATH, store, { userId, indent: 0 });
    }).catch(() => {
      health(userId).writeFailures++;
    }).finally(() => {
      pendingTotal--;
    });
  } catch {
    health(userId).writeFailures++;
    return Promise.resolve();
  }
}
function recordUiDiagnostics(userId, raw) {
  if (!Array.isArray(raw))
    return Promise.resolve();
  const rows = raw.slice(0, UI_BATCH_LIMIT).flatMap((row) => {
    const ui = projectUiDiagnostic(row);
    if (!ui)
      return [];
    const chatId = typeof row.chatId === "string" && row.chatId.length > 0 && row.chatId.length <= 1024 ? row.chatId : "frontend";
    return [{ event: "frontend", chatId, ui }];
  });
  return recordDiagnostics(userId, rows);
}
async function exportDiagnostics(userId) {
  return serial(userId, async () => {
    const store = await read(userId);
    return JSON.stringify(report(store, userId));
  });
}
async function clearDiagnostics(userId) {
  await serial(userId, async () => {
    await spindle.userStorage.setJson(DIAGNOSTICS_PATH, empty(), { userId, indent: 0 });
    healthByUser.delete(userId);
  });
}
function diagnosticErrorReason(error) {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "AbortError":
    case "AbortedSummarizerError":
      return "cancelled";
    case "TimeoutError":
      return "timeout";
    case "CodexContextError":
      return "context_limit";
    case "CodexValidationError":
      return "invalid_output";
    case "ToolProtocolError":
      return "protocol";
    case "FatalSummarizerError":
      return "connection";
    default:
      return "unknown";
  }
}
function recordFrontendAction(userId, message, outcome) {
  const action = choice(message.type, [...ACTIONS, ...UI_OPERATIONS]);
  if (!action)
    return;
  recordDiagnostic(userId, {
    event: "action",
    chatId: "chatId" in message && message.chatId ? message.chatId : "frontend",
    action,
    outcome,
    entryId: "entryId" in message ? message.entryId : undefined,
    relatedChatId: "sourceChatId" in message ? message.sourceChatId : undefined,
    numbers: { requested: "messageIds" in message ? message.messageIds.length : undefined }
  });
}
function diagnosticEntries(entries, activeIds, includeSources = true) {
  return entries.map((e) => ({
    id: e.raw.id,
    tier: e.meta.tier,
    first: e.meta.firstMsgIdx,
    last: e.meta.lastMsgIdx,
    scene: e.meta.sceneNumber,
    active: activeIds?.has(e.raw.id),
    root: !!e.meta.isRoot,
    ghost: !!e.meta.ghost,
    disabled: !!e.raw.disabled,
    sourceCount: e.meta.msgIds.length,
    sourceEntryCount: e.meta.sourceChapterEntryIds?.length ?? 0,
    messages: includeSources ? e.meta.msgIds : undefined,
    sources: includeSources ? e.meta.sourceChapterEntryIds : undefined
  }));
}
function recordSelection(userId, chatId, profile, messages, coverage, selected, mode, replacesEntryId) {
  const selectedIds = new Set(selected.map((m) => m.id));
  const indexes = new Set;
  let indexGaps = 0, duplicateIndexes = 0, gaps = 0, inGap = false;
  for (let i = 0;i < messages.length; i++) {
    const m = messages[i];
    if (indexes.has(m.index_in_chat))
      duplicateIndexes++;
    indexes.add(m.index_in_chat);
    indexGaps += Math.max(0, m.index_in_chat - (i ? messages[i - 1].index_in_chat : -1) - 1);
    const uncovered = !coverage.coveredBy.has(m.id) && isEligibleForCount(m, profile);
    if (uncovered && !inGap)
      gaps++;
    inGap = uncovered;
  }
  recordDiagnostic(userId, {
    event: "selection",
    chatId,
    mode,
    replacesEntryId,
    messageScope: "uncovered_and_selected",
    outcome: selected.length ? "success" : "skipped",
    reason: selected.length ? undefined : "no_window",
    numbers: {
      total: messages.length,
      covered: messages.filter((m) => coverage.coveredBy.has(m.id)).length,
      selected: selected.length,
      indexGaps,
      duplicateIndexes,
      gaps,
      lag: profile.lagValue,
      window: profile.windowValue,
      previousCount: profile.previousMemoriesCount,
      retryCount: profile.retryCount,
      regexOutgoing: profile.regexOutgoingScriptIds.length,
      regexIncoming: profile.regexIncomingScriptIds.length,
      arcBatch: profile.arcAfterChapters,
      arcLag: profile.arcLagChapters
    },
    flags: { lagTokens: profile.lagUnit === "tokens", windowTokens: profile.windowUnit === "tokens", previews: profile.showMemoryPreviews, hideCovered: profile.hideCoveredMessages, extraContext: profile.codexEnabled && profile.codexExtraContext },
    messages: messages.flatMap((m, position) => coverage.coveredBy.has(m.id) && !selectedIds.has(m.id) ? [] : [{ id: m.id, index: m.index_in_chat, position, coveredBy: coverage.coveredBy.get(m.id), excluded: isExcluded(m), hidden: m.extra?.hidden === true, eligible: isEligibleForCount(m, profile), selected: selectedIds.has(m.id), empty: !(m.content || "").trim() }])
  });
}
async function captureDiagnosticSnapshot(userId, chatId) {
  try {
    if ((await loadSettings(userId)).localLogsDisabled)
      return;
    if (!await spindle.chats.get(chatId, userId))
      throw new Error("Snapshot chat unavailable");
    const [messages, entries] = await Promise.all([spindle.chat.getMessages(chatId), listLmbEntries(chatId, userId)]);
    const coverage = await buildCoverage(chatId, userId, entries, true);
    const indexes = new Map(messages.map((m) => [m.id, m.index_in_chat]));
    const owners = new Map;
    let missingSources = 0, rangeMismatches = 0;
    for (const e of entries) {
      if (e.meta.isRoot)
        continue;
      const live = e.meta.msgIds.flatMap((id) => indexes.has(id) ? [indexes.get(id)] : []);
      missingSources += e.meta.msgIds.length - live.length;
      if (live.length && (Math.min(...live) !== e.meta.firstMsgIdx || Math.max(...live) !== e.meta.lastMsgIdx))
        rangeMismatches++;
      if (coverage.activeEntries.includes(e))
        for (const id of e.meta.msgIds)
          owners.set(id, (owners.get(id) ?? 0) + 1);
    }
    await recordDiagnostic(userId, {
      event: "snapshot",
      chatId,
      outcome: "success",
      messageScope: "all",
      numbers: { total: messages.length, entries: entries.length, missingSources, rangeMismatches, overlaps: [...owners.values()].filter((n) => n > 1).length },
      messages: messages.map((m, position) => ({ id: m.id, index: m.index_in_chat, position, coveredBy: coverage.coveredBy.get(m.id), excluded: isExcluded(m), hidden: m.extra?.hidden === true })),
      entries: diagnosticEntries(entries, new Set(coverage.activeEntries.map((e) => e.raw.id)))
    });
  } catch {
    await recordDiagnostic(userId, { event: "snapshot", chatId, outcome: "failed", reason: "snapshot_unavailable" });
  }
}

// src/prompts/categories.ts
var KEY_FIELDS = { chapter: "chapterPresetKey", arc: "arcPresetKey", volume: "volumePresetKey", codex: "codexPresetKey" };
function isExtraCategory(category) {
  return EXTRA_PRESET_CATEGORIES.includes(category);
}
function presetKeyFor(profile, category) {
  return isExtraCategory(category) ? profile.higherTierPresetKeys[category] ?? "" : profile[KEY_FIELDS[category]];
}
function presetKeyPatch(category, key) {
  return isExtraCategory(category) ? { higherTierPresetKeys: { [category]: key } } : { [KEY_FIELDS[category]]: key };
}
function higherTierPreset(text, tier) {
  return text.replace(/\b(volumes?|arcs?)\b/gi, (word) => {
    const source = word.toLowerCase().startsWith("arc");
    const name = MODEL_TIER_NAMES[tier - (source ? 2 : 1)];
    const plural = word.toLowerCase().endsWith("s");
    const replacement = name + (plural && name !== "Series" ? name === "Library" ? "" : "s" : "");
    const result = plural && name === "Library" ? "Libraries" : replacement;
    return word === word.toUpperCase() ? result.toUpperCase() : result;
  });
}
function builtInPresetsFor(pools, category) {
  if (!isExtraCategory(category))
    return pools[`${category}Presets`];
  const index = TIER_KINDS.indexOf(category);
  return [{
    key: `${category}_default`,
    displayName: TIER_NAMES[index],
    prompt: higherTierPreset(pools.volumePresets[0].prompt, index + 1)
  }];
}
function resolvePresetText(profile, customs, pools, category) {
  const key = presetKeyFor(profile, category);
  if (isExtraCategory(category) && !key) {
    return higherTierPreset(resolvePresetText(profile, customs, pools, "volume"), TIER_KINDS.indexOf(category) + 1);
  }
  const custom = customs.find((p) => p.key === key && p.category === category);
  if (custom)
    return custom.prompt;
  const builtIns = builtInPresetsFor(pools, category);
  return (builtIns.find((p) => p.key === key) ?? builtIns[0])?.prompt ?? "";
}

// src/backend/regex.ts
var TTL_MS = 5000;
var PAGE_LIMIT2 = 50;
var CACHE_LIMIT = 500;
var cachedScripts = new Map;
var SEARCH_TTL_MS = 60000;
var SEARCH_PAGE_LIMIT = 200;
var searchIndexes = new Map;
async function listRegexScriptsPage(userId, requestedOffset, query = "", onProgress, refresh = false) {
  const offset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0 ? Math.floor(requestedOffset / PAGE_LIMIT2) * PAGE_LIMIT2 : 0;
  const needle = typeof query === "string" ? query.trim().toLowerCase() : "";
  if (refresh)
    invalidateRegexCache(userId);
  if (needle) {
    const rows = await searchIndex(userId, onProgress);
    const matches = rows.filter((row) => row.name.toLowerCase().includes(needle));
    return { scripts: matches.slice(offset, offset + PAGE_LIMIT2), total: matches.length, offset, limit: PAGE_LIMIT2 };
  }
  const page = await spindle.regex_scripts.list({ userId, limit: PAGE_LIMIT2, offset });
  return { scripts: page.data.map(({ id, name }) => ({ id, name })), total: page.total, offset, limit: PAGE_LIMIT2 };
}
async function searchIndex(userId, onProgress) {
  let index = searchIndexes.get(userId);
  if (!index || index.at && Date.now() - index.at >= SEARCH_TTL_MS) {
    index = { rows: [], at: 0, invalidated: false, progress: { scanned: 0, total: 0 }, listeners: new Set, ready: Promise.resolve() };
    const current = index;
    searchIndexes.delete(userId);
    searchIndexes.set(userId, current);
    while (searchIndexes.size > 8)
      searchIndexes.delete(searchIndexes.keys().next().value);
    current.ready = (async () => {
      let offset = 0;
      try {
        while (true) {
          const page = await spindle.regex_scripts.list({ userId, limit: SEARCH_PAGE_LIMIT, offset });
          if (current.invalidated)
            throw new Error(t("backend.regex.searchChanged"));
          current.rows.push(...page.data.map(({ id, name }) => ({ id, name })));
          offset += page.data.length;
          current.progress = { scanned: offset, total: page.total };
          for (const listener of current.listeners) {
            try {
              listener(current.progress);
            } catch {}
          }
          if (offset >= page.total || page.data.length === 0)
            break;
        }
        current.at = Date.now();
      } catch (err) {
        if (searchIndexes.get(userId) === current)
          searchIndexes.delete(userId);
        throw err;
      }
    })();
  }
  if (onProgress)
    index.listeners.add(onProgress);
  try {
    if (onProgress && index.progress.scanned) {
      try {
        onProgress(index.progress);
      } catch {}
    }
    await index.ready;
    if (index.invalidated)
      throw new Error(t("backend.regex.searchChanged"));
    return index.rows;
  } finally {
    if (onProgress)
      index.listeners.delete(onProgress);
  }
}
function invalidateRegexCache(userId) {
  if (!userId) {
    cachedScripts.clear();
    for (const index of searchIndexes.values())
      index.invalidated = true;
    searchIndexes.clear();
  } else {
    for (const [key, value] of cachedScripts)
      if (value.userId === userId)
        cachedScripts.delete(key);
    const index = searchIndexes.get(userId);
    if (index)
      index.invalidated = true;
    searchIndexes.delete(userId);
  }
}
async function getScript(userId, id) {
  const key = JSON.stringify([userId, id]);
  const cached = cachedScripts.get(key);
  if (cached && Date.now() - cached.at < TTL_MS)
    return cached.script;
  const script = await spindle.regex_scripts.get(id, userId);
  cachedScripts.delete(key);
  cachedScripts.set(key, { userId, at: Date.now(), script });
  while (cachedScripts.size > CACHE_LIMIT)
    cachedScripts.delete(cachedScripts.keys().next().value);
  return script;
}
async function applySelectedRegex(text, scriptIds, userId) {
  if (!scriptIds.length)
    return text;
  let out = text;
  for (const id of scriptIds) {
    const script = await getScript(userId, id);
    if (!script)
      continue;
    out = runScript(out, script);
  }
  return out;
}
var REGEX_INPUT_MAX_CHARS = 500000;
function runScript(input, script) {
  const pattern = script.find_regex;
  const replace = script.replace_string ?? "";
  if (!pattern)
    return input;
  if (input.length > REGEX_INPUT_MAX_CHARS) {
    warn(`regex script ${script.id} skipped: input too long (${input.length} chars)`);
    return input;
  }
  try {
    const flags = script.flags && script.flags.length > 0 ? script.flags : "g";
    const re = new RegExp(pattern, flags);
    return input.replace(re, replace);
  } catch (err) {
    warn(`regex script ${script.id} failed: ${describeError(err)}`);
    return input;
  }
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
Focus on **cause \u2192 intention \u2192 reaction \u2192 consequence** chains for clarity and compression.

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
- Focus on cause \u2192 intention \u2192 reaction \u2192 consequence chains.
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
- Focus on cause \u2192 effect logic
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
- Focus on cause \u2192 effect logic and permanent consequences\r
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
var BUILTIN_PRESET_POOLS = {
  chapterPresets: BUILTIN_CHAPTER_PRESETS,
  arcPresets: BUILTIN_ARC_PRESETS,
  volumePresets: BUILTIN_VOLUME_PRESETS,
  codexPresets: BUILTIN_CODEX_PRESETS
};
function parseStmbPresetExport(raw, category) {
  const out = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return out;
  const overrides = raw.overrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
    return out;
  for (const [k, v] of Object.entries(overrides)) {
    if (!v || typeof v !== "object")
      continue;
    const node = v;
    if (typeof node.prompt !== "string" || !node.prompt.trim())
      continue;
    const key = sanitizeKey(`${category}_${k}`);
    const displayName = typeof node.displayName === "string" && node.displayName.trim() ? node.displayName : k;
    out.push({ key, displayName, prompt: node.prompt });
  }
  return out;
}
function sanitizeKey(raw) {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
  if (cleaned)
    return cleaned;
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// src/prompts/memoria/short-comment-rules.txt
var short_comment_rules_default = 'A single playful nyandere remark in Memoria voice about the scene you just summarized. It must start with a word beginning with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". It must also include another word that starts with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud.';

// src/prompts/memoria/persona.txt
var persona_default = "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform. You quietly keep this user's story shelved and organized. When you write a JSON memory, you obey the schema strictly and never break it, but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed.";

// src/backend/memoria.ts
var DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = short_comment_rules_default;
var FIRE_PHRASES = [
  t("backend.memoria.firePhrases.memoriaStirsTheInkpotNyaa"),
  t("backend.memoria.firePhrases.memoriaIsShelvingThisSceneHushA"),
  t("backend.memoria.firePhrases.memoriaFlicksHerTailAndStartsWriting"),
  t("backend.memoria.firePhrases.memoriaOpensAFreshPageForYou"),
  t("backend.memoria.firePhrases.memoriaPadsOffToCompressThisIn")
];
var RETRY_PHRASES = [
  t("backend.memoria.retryPhrases.memoriaTrippedOnAQuillTryingAgain"),
  t("backend.memoria.retryPhrases.memoriaSInkSmudgedOneMoreTry"),
  t("backend.memoria.retryPhrases.memoriaReshufflesTheIndexCardsRetrying")
];
var SUCCESS_PHRASES = [
  t("backend.memoria.successPhrases.memoriaSlidTheChapterOntoYourShelf"),
  t("backend.memoria.successPhrases.memoriaFiledItNeatlyBetweenTheOthers"),
  t("backend.memoria.successPhrases.memoriaStampedTheSpineAllYours"),
  t("backend.memoria.successPhrases.memoriaPurrsThePageIsDone"),
  t("backend.memoria.successPhrases.memoriaTapsTheChapterIntoPlace")
];
var ARC_FIRE_PHRASES = [
  t("backend.memoria.arcFirePhrases.memoriaGathersTheChaptersForAnArc"),
  t("backend.memoria.arcFirePhrases.memoriaIsBindingSeveralChaptersTogether")
];
var ARC_SUCCESS_PHRASES = [
  t("backend.memoria.arcSuccessPhrases.memoriaBoundTheArcAndPressedIt"),
  t("backend.memoria.arcSuccessPhrases.memoriaStitchedTheSpineOfANew")
];
var VOLUME_FIRE_PHRASES = [
  t("backend.memoria.volumeFirePhrases.memoriaIsPressingAWholeVolumeTogether")
];
var VOLUME_SUCCESS_PHRASES = [
  t("backend.memoria.volumeSuccessPhrases.memoriaEmbossedTheSpineOfANew")
];
function pickPhrase(kind) {
  const pool = kind === "fire" ? FIRE_PHRASES : kind === "retry" ? RETRY_PHRASES : kind === "success" ? SUCCESS_PHRASES : kind === "arc_fire" ? ARC_FIRE_PHRASES : kind === "arc_success" ? ARC_SUCCESS_PHRASES : kind === "volume_fire" ? VOLUME_FIRE_PHRASES : VOLUME_SUCCESS_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)] ?? t("backend.memoria.pickPhrase.memoriaNyaa");
}
var MEMORIA_PERSONA_LINE = persona_default;

// src/backend/summarizer.ts
var CONNECTION_CACHE_TTL_MS = 5000;
var connectionCache = new Map;
async function listConnections(userId) {
  const cached = connectionCache.get(userId);
  if (cached && cached.expiresAt > Date.now())
    return cached.connections;
  const fresh = await spindle.connections.list(userId).catch((err) => {
    warn(`failed to list connections: ${describeError(err)}`);
    return [];
  });
  connectionCache.set(userId, { connections: fresh, expiresAt: Date.now() + CONNECTION_CACHE_TTL_MS });
  return fresh;
}
function invalidateConnectionsCache(userId) {
  connectionCache.delete(userId);
}
async function resolveConnection(profile, userId) {
  const list = await listConnections(userId);
  if (list.length === 0)
    return null;
  let picked = null;
  if (profile.connectionId) {
    picked = list.find((c) => c.id === profile.connectionId) ?? null;
  }
  if (!picked)
    picked = list.find((c) => c.is_default) ?? null;
  if (!picked)
    picked = list[0] ?? null;
  if (!picked)
    return null;
  const modelStr = typeof picked.model === "string" ? picked.model : "";
  if (!modelStr.trim()) {
    throw new FatalSummarizerError(t("backend.summarizer.resolveConnection.connectionHasNoModelSetPickOne", { id: picked.name || picked.id }));
  }
  return picked;
}

class FatalSummarizerError extends Error {
  constructor(message) {
    super(message);
    this.name = "FatalSummarizerError";
  }
}
function findPresetText(profile, customPresets, category) {
  return resolvePresetText(profile, customPresets, BUILTIN_PRESET_POOLS, category);
}
function renderTranscript(messages, includeIndex = true, indexOffset = 0) {
  const lines = [];
  messages.forEach((m, idx) => {
    const role = m.role === "user" ? "USER" : m.role === "assistant" ? "ASSISTANT" : "SYSTEM";
    const content = (m.content || "").trim();
    if (!content)
      return;
    const head = includeIndex ? `<<${role} #${idx + 1 + indexOffset}>>` : `<<${role}>>`;
    lines.push(`${head}
${content}`);
  });
  return lines.join(`

`);
}
function applyTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = vars[k];
    return v === undefined ? m : String(v);
  });
}
function buildMessages(opts) {
  const shortCommentRules = opts.shortCommentRulesOverride && opts.shortCommentRulesOverride.trim() ? opts.shortCommentRulesOverride : DEFAULT_SHORT_COMMENT_RULES_TEMPLATE;
  const personaLine = opts.personaOverride && opts.personaOverride.trim() ? opts.personaOverride : MEMORIA_PERSONA_LINE;
  const targetWords = Math.max(1, Math.round(opts.targetTokens / 1.4));
  const system = [
    personaLine,
    "",
    applyTemplate(opts.systemPromptTemplate, {
      target_tokens: opts.targetTokens,
      target_words: targetWords,
      target_percent: opts.targetPercent,
      memoria_short_comment_rules: shortCommentRules,
      memoria_opener: opts.opener
    })
  ].join(`
`);
  const user = [opts.previousMemoriesBlock, opts.bodyHeading, opts.body].filter(Boolean).join(`

`);
  return { system, user };
}
function buildSamplerParameters(profile) {
  const out = {};
  const s = profile.samplers;
  out["temperature"] = s.temperature ?? SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null)
    out["top_p"] = s.top_p;
  if (s.top_k !== null)
    out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null)
    out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null)
    out["presence_penalty"] = s.presence_penalty;
  return out;
}
function buildCodexSamplerParameters(profile) {
  const out = {};
  const s = profile.codexSamplers;
  out["temperature"] = s.temperature ?? CODEX_SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? CODEX_SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null)
    out["top_p"] = s.top_p;
  if (s.top_k !== null)
    out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null)
    out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null)
    out["presence_penalty"] = s.presence_penalty;
  return out;
}

class AbortedSummarizerError extends Error {
  constructor() {
    super(t("backend.summarizer.messages.abortedByUser"));
    this.name = "AbortedSummarizerError";
  }
}
async function consumeGenerationStream(makeStream, options) {
  if (options.externalSignal.aborted)
    throw new AbortedSummarizerError;
  const controller = new AbortController;
  let firstTokenSeen = false;
  let ttftFired = false;
  let deadlineFired = false;
  let externalAborted = options.externalSignal.aborted;
  const onExternalAbort = () => {
    externalAborted = true;
    controller.abort();
  };
  if (externalAborted)
    controller.abort();
  else
    options.externalSignal.addEventListener("abort", onExternalAbort);
  const ttftTimer = options.firstTokenTimeoutMs !== null ? setTimeout(() => {
    if (!firstTokenSeen) {
      ttftFired = true;
      controller.abort();
    }
  }, options.firstTokenTimeoutMs) : null;
  const deadlineTimer = options.overallDeadlineMs !== null ? setTimeout(() => {
    deadlineFired = true;
    controller.abort();
  }, options.overallDeadlineMs) : null;
  const base = options.progressBase ?? { chars: 0, thinking: 0 };
  let aggregated = "";
  let thinkingChars = 0;
  let usage;
  const assertRunning = () => {
    if (externalAborted)
      throw new AbortedSummarizerError;
    if (ttftFired && options.firstTokenTimeoutMs !== null) {
      throw new Error(t("backend.summarizer.assertRunning.noTokenWithinSTheProviderMay", { firstTokenTimeoutMs1000: Math.round(options.firstTokenTimeoutMs / 1000) }));
    }
    if (deadlineFired && options.overallDeadlineMs !== null) {
      throw new Error(t("backend.summarizer.assertRunning.theResponseDidNotFinishWithinS", { overallDeadlineMs1000: Math.round(options.overallDeadlineMs / 1000) }));
    }
  };
  try {
    for await (const chunk of makeStream(controller.signal)) {
      assertRunning();
      if (chunk.type === "token" || chunk.type === "reasoning") {
        if (!firstTokenSeen) {
          firstTokenSeen = true;
          if (ttftTimer)
            clearTimeout(ttftTimer);
        }
        if (chunk.type === "token") {
          aggregated += chunk.token;
          options.onDelta?.("text", chunk.token);
        } else {
          thinkingChars += chunk.token.length;
          options.onDelta?.("thinking", chunk.token);
        }
        options.onProgress?.(base.chars + aggregated.length, base.thinking + thinkingChars);
        continue;
      }
      if (chunk.type === "done") {
        if (chunk.content)
          aggregated = chunk.content;
        usage = chunk.usage;
        let toolChars = 0;
        for (const tc of chunk.tool_calls ?? []) {
          try {
            toolChars += JSON.stringify(tc.args ?? {}).length;
          } catch {}
        }
        base.chars += aggregated.length + toolChars;
        base.thinking += thinkingChars;
        options.onProgress?.(base.chars, base.thinking);
        return { content: aggregated, toolCalls: chunk.tool_calls ?? [], usage };
      }
    }
    assertRunning();
    if (options.salvagePartial && aggregated.trim()) {
      return { content: aggregated, toolCalls: [], usage };
    }
    throw new Error(t("backend.summarizer.consumeGenerationStream.theStreamEndedBeforeCompleting"));
  } catch (err) {
    assertRunning();
    throw err;
  } finally {
    if (ttftTimer)
      clearTimeout(ttftTimer);
    if (deadlineTimer)
      clearTimeout(deadlineTimer);
    options.externalSignal.removeEventListener("abort", onExternalAbort);
  }
}
async function runStreamingGeneration(conn, messages, profile, userId, options) {
  const result = await consumeGenerationStream((signal) => spindle.generate.rawStream(buildGenerateRequest(conn, messages, profile, userId, signal)), {
    externalSignal: options.externalSignal,
    onProgress: options.onProgress,
    onDelta: options.onDelta,
    firstTokenTimeoutMs: Math.max(1, profile.ttftTimeoutSecs) * 1000,
    overallDeadlineMs: null,
    salvagePartial: true
  });
  return { content: result.content, usage: result.usage };
}
function buildGenerateRequest(conn, messages, profile, userId, signal) {
  const baseParams = buildSamplerParameters(profile);
  const effectiveModel = (conn.model ?? "").trim();
  const parameters = { ...baseParams };
  if (effectiveModel)
    parameters["model"] = effectiveModel;
  return {
    type: "raw",
    messages,
    connection_id: conn.id,
    ...effectiveModel ? { model: effectiveModel } : {},
    ...Object.keys(parameters).length > 0 ? { parameters } : {},
    userId,
    signal
  };
}
async function countTextTokens(text, model, userId) {
  if (!text)
    return 0;
  try {
    const result = await spindle.tokens.countText(text, { model, userId });
    return result.total_tokens;
  } catch (err) {
    warn(`tokens.countText fallback: ${describeError(err)}`);
    return Math.ceil(text.length / 4);
  }
}
async function resolveTargets(unit, percent, tokens, inputText, model, userId) {
  const inputTokens = await countTextTokens(inputText, model, userId);
  if (unit === "tokens") {
    const targetTokens = Math.max(1, Math.floor(tokens));
    const targetPercent = inputTokens > 0 ? Math.max(1, Math.round(targetTokens / inputTokens * 100)) : 0;
    return { targetTokens, targetPercent, inputTokens };
  }
  const targetTokens = Math.max(1, Math.floor(inputTokens * percent / 100));
  return { targetTokens, targetPercent: percent, inputTokens };
}
function buildPreviousMemoriesBlock(previous) {
  if (previous.length === 0)
    return "";
  const lines = ["<<PREVIOUS MEMORIES (for context, do not rewrite)>>"];
  previous.forEach((p) => {
    lines.push(p.raw.content);
  });
  return lines.join(`

`);
}
async function resolveSystemMacros(text, chatId, userId) {
  if (!text.includes("{{"))
    return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    return result.text;
  } catch (err) {
    warn(`macros.resolve failed, sending unresolved system: ${describeError(err)}`);
    return text;
  }
}
async function resolveMacrosWithDiagnostics(text, chatId, userId, diagnostics) {
  if (!text.includes("{{"))
    return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    for (const d of result.diagnostics) {
      diagnostics.push({ message: t("backend.summarizer.resolveMacrosWithDiagnostics.macroOffsetLength", { message: d.message, offset: d.offset, length: d.length }) });
    }
    return result.text;
  } catch (err) {
    diagnostics.push({ message: t("backend.summarizer.resolveMacrosWithDiagnostics.macrosResolveFailed", { describeError: describeError(err) }) });
    return text;
  }
}
async function assembleChapterPrompt(profile, customPresets, chatId, messages, previousMemories, userId, opener) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.assembleChapterPrompt.noConnectionAvailableForMemoria"));
  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText)
    throw new Error(t("backend.summarizer.assembleChapterPrompt.chapterPresetMissing"));
  const transcript = renderTranscript(messages, true);
  if (!transcript.trim())
    throw new Error(t("backend.summarizer.assembleChapterPrompt.emptyTranscript"));
  const { targetTokens, targetPercent, inputTokens: transcriptTokens } = await resolveTargets(profile.chapterTargetUnit, profile.chapterTargetPercent, profile.chapterTargetTokens, transcript, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: t("backend.summarizer.diagnostics.connection", { name: conn.name, provider: conn.provider, model: conn.model }) },
    { message: t("backend.summarizer.diagnostics.windowMessageS", { length: messages.length }) },
    { message: t("backend.summarizer.diagnostics.transcriptTokensModelTokenizer", { transcriptTokens }) },
    { message: t("backend.summarizer.diagnostics.targetTokens", { targetTokens, choice: profile.chapterTargetUnit === "tokens" ? "yes" : "no", chapterTargetUnitTokens: profile.chapterTargetUnit === "tokens" ? targetPercent : "", chapterTargetPercent: !(profile.chapterTargetUnit === "tokens") ? profile.chapterTargetPercent : "" }) },
    { message: t("backend.summarizer.diagnostics.targetWordsShownToModel", { value: Math.max(1, Math.round(targetTokens / 1.4)) }) },
    { message: t("backend.summarizer.diagnostics.previousMemoriesIncluded", { length: previousMemories.length }) },
    { message: t("backend.summarizer.diagnostics.opener", { opener }) },
    { message: t("backend.summarizer.diagnostics.presetKey", { chapterPresetKey: profile.chapterPresetKey }) },
    { message: t("backend.summarizer.diagnostics.samplerParametersBeingSentOnTheWire", { stringify: JSON.stringify(samplerParams) }) }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: t("backend.summarizer.assembleChapterPrompt.outgoingRegexAppliedScriptS", { length: profile.regexOutgoingScriptIds.length }) });
  }
  return {
    messages: [
      { role: promptRoleFor(profile, "chapter"), content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function assembleArcPrompt(profile, customPresets, chatId, chapters, userId, opener) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.assembleArcPrompt.noConnectionAvailableForMemoria"));
  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText)
    throw new Error(t("backend.summarizer.assembleArcPrompt.arcPresetMissing"));
  const body = chapters.map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>
${c.raw.content}`).join(`

`);
  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(profile.arcTargetUnit, profile.arcTargetPercent, profile.arcTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: t("backend.summarizer.diagnostics.connection", { name: conn.name, provider: conn.provider, model: conn.model }) },
    { message: t("backend.summarizer.diagnostics.sourceChapters", { length: chapters.length }) },
    { message: t("backend.summarizer.diagnostics.concatenatedChapterBodyTokensModelTokenizer", { bodyTokens }) },
    { message: t("backend.summarizer.diagnostics.targetTokens2", { targetTokens, choice: profile.arcTargetUnit === "tokens" ? "yes" : "no", arcTargetUnitTokens: profile.arcTargetUnit === "tokens" ? targetPercent : "", arcTargetPercent: !(profile.arcTargetUnit === "tokens") ? profile.arcTargetPercent : "" }) },
    { message: t("backend.summarizer.diagnostics.targetWordsShownToModel", { value: Math.max(1, Math.round(targetTokens / 1.4)) }) },
    { message: t("backend.summarizer.diagnostics.opener", { opener }) },
    { message: t("backend.summarizer.diagnostics.presetKey2", { arcPresetKey: profile.arcPresetKey }) },
    { message: t("backend.summarizer.diagnostics.samplerParametersBeingSentOnTheWire", { stringify: JSON.stringify(samplerParams) }) }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: t("backend.summarizer.assembleArcPrompt.outgoingRegexAppliedScriptS", { length: profile.regexOutgoingScriptIds.length }) });
  }
  return {
    messages: [
      { role: promptRoleFor(profile, "arc"), content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function assembleVolumePrompt(profile, customPresets, chatId, arcs, userId, opener, tier = 3) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.assembleVolumePrompt.noConnectionAvailableForMemoria"));
  const category = TIER_KINDS[tier - 1];
  const presetText = findPresetText(profile, customPresets, category);
  if (!presetText)
    throw new Error(t("backend.summarizer.assembleVolumePrompt.volumePresetMissing"));
  const body = arcs.map((a, idx) => `<<${MODEL_TIER_NAMES[tier - 2].toUpperCase()} ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>
${a.raw.content}`).join(`

`);
  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(profile.volumeTargetUnit, profile.volumeTargetPercent, profile.volumeTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<${MODEL_TIER_NAMES[tier - 2].toUpperCase()} SUMMARIES TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: t("backend.summarizer.diagnostics.connection", { name: conn.name, provider: conn.provider, model: conn.model }) },
    { message: tier === 3 ? t("backend.summarizer.diagnostics.sourceArcs", { length: arcs.length }) : t("backend.summarizer.diagnostics.higherSources", { name: MODEL_TIER_NAMES[tier - 2], count: arcs.length }) },
    { message: tier === 3 ? t("backend.summarizer.diagnostics.concatenatedArcBodyTokensModelTokenizer", { bodyTokens }) : t("backend.summarizer.diagnostics.higherSourceTokens", { bodyTokens }) },
    { message: t("backend.summarizer.diagnostics.targetTokens3", { targetTokens, choice: profile.volumeTargetUnit === "tokens" ? "yes" : "no", volumeTargetUnitTokens: profile.volumeTargetUnit === "tokens" ? targetPercent : "", volumeTargetPercent: !(profile.volumeTargetUnit === "tokens") ? profile.volumeTargetPercent : "" }) },
    { message: t("backend.summarizer.diagnostics.targetWordsShownToModel", { value: Math.max(1, Math.round(targetTokens / 1.4)) }) },
    { message: t("backend.summarizer.diagnostics.opener", { opener }) },
    { message: t("backend.summarizer.diagnostics.presetKey3", { volumePresetKey: presetKeyFor(profile, category) || profile.volumePresetKey }) },
    { message: t("backend.summarizer.diagnostics.samplerParametersBeingSentOnTheWire", { stringify: JSON.stringify(samplerParams) }) }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: t("backend.summarizer.assembleVolumePrompt.outgoingRegexAppliedScriptS", { length: profile.regexOutgoingScriptIds.length }) });
  }
  return {
    messages: [
      { role: promptRoleFor(profile, category), content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function summarizeVolume(profile, customPresets, chatId, arcs, userId, opener, streamOptions, tier = 3) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.summarizeVolume.noConnectionAvailableForMemoria"));
  const category = TIER_KINDS[tier - 1];
  const presetText = findPresetText(profile, customPresets, category);
  if (!presetText)
    throw new Error(t("backend.summarizer.summarizeVolume.volumePresetMissing"));
  const body = arcs.map((a, idx) => `<<${MODEL_TIER_NAMES[tier - 2].toUpperCase()} ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>
${a.raw.content}`).join(`

`);
  const { targetTokens, targetPercent } = await resolveTargets(profile.volumeTargetUnit, profile.volumeTargetPercent, profile.volumeTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<${MODEL_TIER_NAMES[tier - 2].toUpperCase()} SUMMARIES TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: promptRoleFor(profile, category), content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  recordDiagnostic(userId, { event: "request", chatId, mode: TIER_KINDS[tier - 1], outcome: "started", numbers: {
    inputCharacters: built.user.length,
    outputCharacters: outgoingUser.length,
    changed: outgoingUser === built.user ? 0 : 1,
    targetTokens,
    targetPercent,
    regexOutgoing: profile.regexOutgoingScriptIds.length,
    regexIncoming: profile.regexIncomingScriptIds.length,
    maxInputTokens: profile.samplers.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens,
    maxOutputTokens: profile.samplers.max_tokens ?? SAMPLER_DEFAULTS.max_tokens,
    temperature: profile.samplers.temperature ?? SAMPLER_DEFAULTS.temperature
  } });
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error(t("backend.summarizer.summarizeVolume.emptyModelOutput"));
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error(t("backend.summarizer.summarizeVolume.theVolumeSummaryCameBackEmpty"));
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: presetKeyFor(profile, category) || profile.volumePresetKey
  };
}
async function summarizeChapter(profile, customPresets, chatId, messages, previousMemories, userId, opener, streamOptions) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.summarizeChapter.noConnectionAvailableForMemoria"));
  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText)
    throw new Error(t("backend.summarizer.summarizeChapter.chapterPresetMissing"));
  const transcript = renderTranscript(messages, true);
  if (!transcript.trim())
    throw new Error(t("backend.summarizer.summarizeChapter.emptyTranscript"));
  const { targetTokens, targetPercent } = await resolveTargets(profile.chapterTargetUnit, profile.chapterTargetPercent, profile.chapterTargetTokens, transcript, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: promptRoleFor(profile, "chapter"), content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  recordDiagnostic(userId, { event: "request", chatId, mode: "chapter", outcome: "started", numbers: {
    inputCharacters: built.user.length,
    outputCharacters: outgoingUser.length,
    changed: outgoingUser === built.user ? 0 : 1,
    targetTokens,
    targetPercent,
    regexOutgoing: profile.regexOutgoingScriptIds.length,
    regexIncoming: profile.regexIncomingScriptIds.length,
    maxInputTokens: profile.samplers.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens,
    maxOutputTokens: profile.samplers.max_tokens ?? SAMPLER_DEFAULTS.max_tokens,
    temperature: profile.samplers.temperature ?? SAMPLER_DEFAULTS.temperature
  } });
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error(t("backend.summarizer.summarizeChapter.emptyModelOutput"));
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error(t("backend.summarizer.summarizeChapter.theSummaryCameBackEmpty"));
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.chapterPresetKey
  };
}
async function summarizeArc(profile, customPresets, chatId, chapters, userId, opener, streamOptions) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.summarizer.summarizeArc.noConnectionAvailableForMemoria"));
  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText)
    throw new Error(t("backend.summarizer.summarizeArc.arcPresetMissing"));
  const body = chapters.map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>
${c.raw.content}`).join(`

`);
  const { targetTokens, targetPercent } = await resolveTargets(profile.arcTargetUnit, profile.arcTargetPercent, profile.arcTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: promptRoleFor(profile, "arc"), content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  recordDiagnostic(userId, { event: "request", chatId, mode: "arc", outcome: "started", numbers: {
    inputCharacters: built.user.length,
    outputCharacters: outgoingUser.length,
    changed: outgoingUser === built.user ? 0 : 1,
    targetTokens,
    targetPercent,
    regexOutgoing: profile.regexOutgoingScriptIds.length,
    regexIncoming: profile.regexIncomingScriptIds.length,
    maxInputTokens: profile.samplers.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens,
    maxOutputTokens: profile.samplers.max_tokens ?? SAMPLER_DEFAULTS.max_tokens,
    temperature: profile.samplers.temperature ?? SAMPLER_DEFAULTS.temperature
  } });
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error(t("backend.summarizer.summarizeArc.emptyModelOutput"));
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error(t("backend.summarizer.summarizeArc.theArcSummaryCameBackEmpty"));
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.arcPresetKey
  };
}
function parseSummaryJson(raw) {
  const cleaned = stripThinkBlocks(raw);
  const normalized = normalizeText(cleaned);
  const candidates = collectJsonCandidates(normalized);
  let sawParseableObject = false;
  for (const cand of candidates) {
    const obj = tryParseJsonObject(cand);
    if (!obj)
      continue;
    sawParseableObject = true;
    const title = typeof obj["title"] === "string" ? obj["title"] : "";
    const opener = typeof obj["opener"] === "string" ? obj["opener"] : "";
    const contentRaw = obj["content"] ?? obj["summary"] ?? obj["memory_content"];
    if (typeof contentRaw !== "string")
      continue;
    const kw = obj["keywords"];
    const keywords = Array.isArray(kw) ? kw.filter((x) => typeof x === "string") : [];
    const sc = typeof obj["short_comment"] === "string" ? obj["short_comment"] : "";
    return { title, opener, content: contentRaw, keywords, shortComment: sc };
  }
  if (sawParseableObject) {
    throw new Error(t("backend.summarizer.parseSummaryJson.theModelSJsonHadNoContent"));
  }
  throw new Error(t("backend.summarizer.parseSummaryJson.theModelDidnTReturnValidJson"));
}
function parseLooseJsonObjects(raw) {
  const normalized = normalizeText(stripThinkBlocks(raw));
  const out = [];
  for (const cand of collectJsonCandidates(normalized)) {
    const obj = tryParseJsonObject(cand);
    if (obj)
      out.push(obj);
  }
  return out;
}
function stripThinkBlocks(raw) {
  let out = raw.replace(/<(?:think(?:ing)?|reasoning)>[\s\S]*?<\/(?:think(?:ing)?|reasoning)>/gi, "");
  out = out.replace(/^[\s\S]*<\/(?:think(?:ing)?|reasoning)>/i, "");
  out = out.replace(/<(?:think(?:ing)?|reasoning)>/gi, "");
  return out;
}
function normalizeText(s) {
  return s.replace(/\r\n/g, `
`).replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\u2060]/g, "").trim();
}
function collectJsonCandidates(s) {
  const out = [];
  for (const block of extractFencedBlocks(s))
    out.push(block);
  out.push(s);
  out.push(...extractBalancedJsonSpans(s));
  const seen = new Set;
  const uniq = [];
  for (const c of out) {
    if (!c)
      continue;
    if (seen.has(c))
      continue;
    seen.add(c);
    uniq.push(c);
  }
  return uniq;
}
function extractFencedBlocks(s) {
  const re = /```([\w-]*)\s*([\s\S]*?)```/g;
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    out.push((m[2] || "").trim());
  }
  return out;
}
var MAX_JSON_SCAN_STARTS = 24;
function extractBalancedJsonSpans(s) {
  const out = [];
  let pos = 0;
  let starts = 0;
  while (pos < s.length && starts < MAX_JSON_SCAN_STARTS) {
    const rel = s.slice(pos).search(/[{[]/);
    if (rel === -1)
      break;
    const startIdx = pos + rel;
    starts++;
    const open = s[startIdx];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let i = startIdx;i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) {
          esc = false;
        } else if (ch === "\\") {
          esc = true;
        } else if (ch === '"') {
          inStr = false;
        }
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === open)
        depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      pos = startIdx + 1;
      continue;
    }
    out.push(s.slice(startIdx, end + 1).trim());
    pos = end + 1;
  }
  return out;
}
function tryParseJsonObject(cand) {
  const strict = tryJsonParse(cand);
  if (strict)
    return strict;
  return tryJsonParse(repairJson(cand));
}
function tryJsonParse(cand) {
  try {
    const v = JSON.parse(cand);
    if (!v || typeof v !== "object" || Array.isArray(v))
      return null;
    return v;
  } catch {
    return null;
  }
}
function repairJson(s) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0;i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      out += ch;
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      out += ch;
      continue;
    }
    if (ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== `
`)
        i++;
      if (i < s.length)
        out += s[i];
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/"))
        i++;
      i += 1;
      continue;
    }
    if (ch === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j]))
        j++;
      if (s[j] === "}" || s[j] === "]")
        continue;
    }
    out += ch;
  }
  return out;
}

// src/backend/codex/prompt.ts
function tpl(ctx, key) {
  return codexTemplateText(key, ctx.overrides);
}
function makeCodexPromptCtx(profile, customPresets, frozenFiles) {
  const preset = customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  return {
    activeFiles: new Set(CODEX_FILE_KEYS.filter((k) => !frozenFiles.has(k))),
    relationsTable: profile.codexRelationsTable,
    useTools: profile.codexUseTools,
    sequential: profile.codexWriteMode === "sequential",
    directives: findPresetText(profile, customPresets, "codex"),
    overrides: preset?.templates ?? {}
  };
}
var ENTITY_FILE_KEYS = ["characters", "locations", "things"];
function activeEntityFiles(ctx) {
  return ENTITY_FILE_KEYS.filter((k) => ctx.activeFiles.has(k));
}
function schemaBlock(ctx) {
  const parts = ["File schemas (JSON):"];
  const entityFiles = activeEntityFiles(ctx);
  if (entityFiles.length > 0) {
    const entityTpl = ctx.relationsTable ? tpl(ctx, "schema_entities_table") : tpl(ctx, "schema_entities_inline");
    parts.push(fillPrompt(entityTpl, { ENTITY_FILES: entityFiles.map((k) => `${k}.json`).join(" / ") }));
  }
  if (ctx.relationsTable && ctx.activeFiles.has("relations"))
    parts.push(tpl(ctx, "schema_relations"));
  if (ctx.activeFiles.has("timeline"))
    parts.push(tpl(ctx, "schema_timeline"));
  if (ctx.activeFiles.has("threads"))
    parts.push(tpl(ctx, "schema_threads"));
  if (ctx.activeFiles.has("world"))
    parts.push(tpl(ctx, "schema_world"));
  if (ctx.activeFiles.has("knowledge"))
    parts.push(tpl(ctx, "schema_knowledge"));
  const keyworded = entityFiles.length > 0 || ctx.activeFiles.has("world") || ctx.activeFiles.has("knowledge");
  if (keyworded)
    parts.push(tpl(ctx, "schema_keywords"));
  return parts.join(`

`);
}
function protocolBlock(ctx) {
  const patchRules = tpl(ctx, "protocol_patch_rules");
  const key = ctx.useTools ? ctx.sequential ? "protocol_tools_sequential" : "protocol_tools" : ctx.sequential ? "protocol_json_sequential" : "protocol_json";
  return fillPrompt(tpl(ctx, key), { PATCH_RULES: patchRules });
}
function buildCodexSystemPrompt(ctx) {
  return [ctx.directives, "", schemaBlock(ctx), "", protocolBlock(ctx)].join(`
`);
}
function maskLockedFields(e) {
  const lf = e.lockedFields;
  if (!lf || lf.length === 0)
    return e;
  const out = { ...e };
  delete out.lockedFields;
  for (const f of lf) {
    if (f === "id" || f === "name")
      continue;
    out[f] = Array.isArray(out[f]) ? [LOCKED_FIELD_MASK] : LOCKED_FIELD_MASK;
  }
  return out;
}
function agentFileJson(bundle, key) {
  if (key === "threads") {
    return JSON.stringify({
      threads: bundle.threads.threads.filter((t) => t.status !== "resolved"),
      seeds: bundle.threads.seeds
    });
  }
  if (key === "characters" || key === "locations" || key === "things") {
    const file = bundle[key];
    return JSON.stringify({ entities: file.entities.map(maskLockedFields) });
  }
  return JSON.stringify(bundle[key]);
}
function lockedEntityIds(bundle, ctx) {
  const out = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of bundle[key].entities) {
      if (e.locked === true)
        out.push(e.id);
    }
  }
  return out;
}
function lockedFieldEntityIds(bundle, ctx) {
  const out = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of bundle[key].entities) {
      if (Array.isArray(e.lockedFields) && e.lockedFields.length > 0)
        out.push(e.id);
    }
  }
  return out;
}
function specialNotes(bundle, notes, ctx) {
  const special = [];
  if (notes.reconcile)
    special.push(tpl(ctx, "note_reconcile"));
  if (notes.migrateToTable)
    special.push(tpl(ctx, "note_migrate_table"));
  if (notes.migrateToInline)
    special.push(tpl(ctx, "note_migrate_inline"));
  if (notes.loadProblems.length) {
    special.push(fillPrompt(tpl(ctx, "note_repair"), { FILES: notes.loadProblems.join(", ") }));
  }
  const locked = lockedEntityIds(bundle, ctx);
  if (locked.length) {
    special.push(fillPrompt(tpl(ctx, "note_locked"), { IDS: locked.join(", ") }));
  }
  const lockedFields = lockedFieldEntityIds(bundle, ctx);
  if (lockedFields.length) {
    special.push(fillPrompt(tpl(ctx, "note_locked_fields"), { IDS: lockedFields.join(", ") }));
  }
  return special.length ? special.join(`

`) : null;
}
function currentCodexParts(bundle, ctx) {
  const parts = ["<<CURRENT CODEX>>"];
  for (const key of CODEX_FILE_KEYS) {
    if (!ctx.activeFiles.has(key))
      continue;
    parts.push(`--- ${key}.json ---
${agentFileJson(bundle, key)}`);
  }
  return parts;
}
function buildCodexUserMessage(ctx, bundle, chunk, chunkLabel, chunkFirstIndex, notes, lore, storySoFar) {
  const parts = [];
  parts.push(tpl(ctx, "note_partial_story"));
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  if (storySoFar) {
    parts.push(`<<STORY SO FAR (chapter summaries, context only - this span is already recorded in the codex)>>
${storySoFar}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<NEW STORY TURNS (${chunkLabel}) - the new material to encode>>`);
  parts.push(renderTranscript(chunk, true, chunkFirstIndex));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexSummaryCatchupMessage(ctx, bundle, blocks, chunkLabel, notes) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_fast"), { CHUNK_LABEL: chunkLabel }));
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<STORY (${chunkLabel}, compressed)>>`);
  parts.push(blocks.join(`

`));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexUltraMessage(ctx, bundle, books, tailTranscript, chunkLabel, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const shape = books.length && tailTranscript ? "The story arrives as its filed summaries, oldest first, followed by the raw newest turns." : books.length ? "The story arrives as its filed summaries, oldest first." : "The story arrives as raw turns.";
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_ultra"), { CHUNK_LABEL: chunkLabel, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexReconcileMessage(ctx, bundle, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const shape = books.length && tailTranscript ? "as its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "as its filed summaries, oldest first" : "as raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_reconcile"), { STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(ctx.useTools ? `Sweep now. Send corrections as set/drop patches (or full content for a heavy rewrite)${ctx.sequential ? ", one file per response" : ""}, name every file that still holds in codex_skip, then call codex_done.` : `Sweep now. Respond with a JSON object: corrections in "writes"${ctx.sequential ? ", one file per reply" : ""}, every file that still holds in "skip", and "done": true once all of them are accounted for.`);
  return parts.join(`

`);
}
function buildCodexRefreshMessage(ctx, bundle, targets, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript ? "its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "its filed summaries, oldest first" : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_refresh"), {
    TARGET_FILES: list,
    IT_THEY: targets.length === 1 ? "it" : "they",
    LAG_PHRASE: targets.length === 1 ? "it lags" : "they lag",
    STORY_SHAPE: shape
  }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools ? `Rewrite the target files now${ctx.sequential ? ", one per response" : ""}, then call codex_done.` : `Rewrite the target files now, each as full "content" in "writes"${ctx.sequential ? ", one per reply" : ""}, and set "done": true.`);
  return parts.join(`

`);
}
function buildCodexRebuildMessage(ctx, bundle, targets, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript ? "its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "its filed summaries, oldest first" : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_rebuild"), { TARGET_FILES: list, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools ? `Rewrite the target files now${ctx.sequential ? ", one per response" : ""}, then call codex_done.` : `Rewrite the target files now, each as full "content" in "writes"${ctx.sequential ? ", one per reply" : ""}, and set "done": true.`);
  return parts.join(`

`);
}
var TIDY_FILE_GUIDANCE = {
  timeline: "Group events on the same date, or adjacent dates in the same episode, into cohesive chronological chunks. Use the existing when field for the date or date range. Connect actions to outcomes instead of retaining many tiny event rows. Keep important dates, turning points, causal order, participants, and lasting consequences explicit within each chunk; do not merge unrelated periods or invent dates.",
  relations: "Consolidate redundant relationship rows for the same pair or group into a concise account of the current relationship and the changes that still explain it. Preserve distinct relationship kinds, direction, obligations, tensions, and unresolved consequences. Remove superseded descriptions and repeated interaction details. Do not merge unrelated relationships or erase meaningful differences between members.",
  threads: "Reassess each thread and seed for present relevance. Merge overlapping storylines and duplicate setups into cohesive threads. Keep active goals, unresolved stakes, and planted details that still plausibly await payoff. Remove obsolete, redundant, trivial, or completed material with no remaining consequence; do not keep a thread merely because it was once marked open. Age or lack of a recent mention alone does not prove irrelevance, and compaction must not invent a resolution.",
  knowledge: "Reassess secrets and false beliefs for plot relevance. Delete obsolete secrets, inconsequential private details, and overly specific facts that no longer affect choices, stakes, or future scenes. Consolidate related secrets only when their knownBy, hiddenFrom, and falseBeliefs distinctions remain accurate. Preserve consequential hidden information and misunderstandings. Never imply that a character learned a fact just to make merging easier.",
  world: "Group related lore and facts by topic into cohesive entries. Merge duplicate rules, descriptions, and background details. Keep current canon, enduring constraints, and facts future scenes can use; remove superseded or inconsequential minutiae. Preserve meaningful exceptions and avoid merging unrelated topics into a single undifferentiated record."
};
function buildCodexTidyMessage(ctx, bundle, targets, budget) {
  const parts = [];
  parts.push(tpl(ctx, "pass_tidy"));
  if (budget)
    parts.push(`COMPACTION BUDGET: The target files currently render to ${budget.current} tokens. Rewrite them to a combined size of at most ${budget.modelTarget} tokens of rendered story-bible prose (not JSON syntax or thinking). This includes a 10% margin below the user's ${budget.limit}-token limit. ${budget.callsLeft} model calls remain. If a previous attempt is still too large, compress further now; do not skip merely because you already tidied it. Preserve locked content and plot-relevant facts. Return all target files together and finish in this response.`);
  const locked = lockedEntityIds(bundle, ctx);
  if (locked.length) {
    parts.push(fillPrompt(tpl(ctx, "note_locked"), { IDS: locked.join(", ") }));
  }
  const lockedFields = lockedFieldEntityIds(bundle, ctx);
  if (lockedFields.length) {
    parts.push(fillPrompt(tpl(ctx, "note_locked_fields"), { IDS: lockedFields.join(", ") }));
  }
  parts.push(`TARGET FILES: ${targets.map((t) => `${t}.json`).join(", ")}. Do not write any other file.`);
  for (const file of targets) {
    const guidance = TIDY_FILE_GUIDANCE[file];
    if (guidance)
      parts.push(`COMPACTION FOR ${file}.json: ${guidance}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(ctx.useTools ? `Rewrite the target files now${ctx.sequential ? ", one per response" : ""}. Write only files you actually improved, skip the rest, then call codex_done.` : `Rewrite the target files now${ctx.sequential ? ", one per reply" : ""}. Put only files you actually improved in "writes", the rest in "skip", and set "done": true.`);
  return parts.join(`

`);
}
function verifyNudge(ctx) {
  return tpl(ctx, "pass_verify") + " " + (ctx.useTools ? "Resend corrections if you find anything, then call codex_done. Every file is already accounted for, so codex_done alone ends the pass." : 'Respond with a JSON object: corrections in "writes" if you find anything (else an empty "writes"), and "done": true. Every file is already accounted for, so no "skip" is needed.');
}
function entityLine(e) {
  const bits = [];
  const skip = new Set(["id", "name", "aliases", "ties", "notes", "keywords", "locked", "lockedfields"]);
  if (e.aliases?.length)
    bits.push(`aka ${e.aliases.join(", ")}`);
  for (const [k, v] of Object.entries(e)) {
    if (skip.has(k.toLowerCase()) || v === undefined)
      continue;
    if (Array.isArray(v))
      bits.push(`${k}: ${v.join(", ")}`);
    else
      bits.push(`${k}: ${String(v)}`);
  }
  if (e.notes)
    bits.push(String(e.notes));
  return `- ${e.name} (${e.id})${bits.length ? ` | ${bits.join(" | ")}` : ""}`;
}
var ENTITY_REF_HEAD = /^(?:char|loc|thing):(.+)$/;
function resolveRefName(names, ref) {
  const n = names.get(ref);
  if (n)
    return n;
  const m = ENTITY_REF_HEAD.exec(ref);
  return m ? m[1].replace(/_/g, " ") : ref;
}
function relationLine(r, names) {
  const nameOf = (ref) => resolveRefName(names, ref);
  if (r.type === "pair") {
    const hist = r.history?.length ? ` (${r.history.join("; ")})` : "";
    return `- ${nameOf(r.a)} -> ${nameOf(r.b)} [${r.kind}]: ${r.state}${hist}`;
  }
  const members = r.members.map((m) => {
    const role = r.roles?.[m];
    return role ? `${nameOf(m)} (${role})` : nameOf(m);
  });
  const extras = Object.entries(r.roles ?? {}).filter(([ref]) => !r.members.includes(ref)).map(([ref, role]) => `${role}: ${nameOf(ref)}`);
  const hist = r.history?.length ? ` (${r.history.join("; ")})` : "";
  return `- [${r.kind}] ${members.join(", ")}${extras.length ? ` (${extras.join(", ")})` : ""}: ${r.state}${hist}`;
}
var ENTITY_FILE_LABEL = {
  characters: "Character",
  locations: "Location",
  things: "Thing"
};
function relationInvolves(r, id) {
  if (r.type === "pair")
    return r.a === id || r.b === id;
  return r.members.includes(id) || Object.prototype.hasOwnProperty.call(r.roles ?? {}, id);
}
function uniqKeys(parts) {
  const seen = new Set;
  const out = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t)
      continue;
    const k = t.toLowerCase();
    if (seen.has(k))
      continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}
function fnvHex(s) {
  let h = 2166136261;
  for (let i = 0;i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function recordKey(prefix, raw, taken) {
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  const base = slug || `h${fnvHex(raw)}`;
  let key = `${prefix}:${base}`;
  let n = 2;
  while (taken.has(key))
    key = `${prefix}:${base}_${n++}`;
  taken.add(key);
  return key;
}
function renderCodexRecords(bundle, opts) {
  const names = new Map;
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities)
      names.set(e.id, e.name);
  }
  const out = [];
  const taken = new Set;
  const foldedRelations = new Set;
  for (const fileKey of ["characters", "locations", "things"]) {
    const label = ENTITY_FILE_LABEL[fileKey];
    for (const e of bundle[fileKey].entities) {
      const lines = [entityLine(e)];
      for (const t of e.ties ?? [])
        lines.push(`  * ${t}`);
      if (opts.includeRelations && !opts.disabledFiles?.has(fileKey) && !e.noInject) {
        bundle.relations.relations.forEach((r, i) => {
          if (!relationInvolves(r, e.id))
            return;
          foldedRelations.add(i);
          lines.push(relationLine(r, names));
        });
      }
      out.push({
        record: recordKey("ent", e.id, taken),
        file: fileKey,
        comment: `[Codex] ${label}: ${e.name}`,
        content: `[Story Bible - ${label}: ${e.name}]
${lines.join(`
`)}`,
        keys: uniqKeys([e.name, ...e.aliases ?? [], ...e.keywords ?? []]),
        constant: false,
        disabled: e.noInject === true
      });
    }
  }
  if (opts.includeRelations) {
    const orphans = bundle.relations.relations.filter((_, i) => !foldedRelations.has(i));
    if (orphans.length > 0) {
      const endpointNames = orphans.flatMap((r) => r.type === "pair" ? [r.a, r.b] : [...r.members, ...Object.keys(r.roles ?? {})]).flatMap((ref) => {
        const entity = [bundle.characters, bundle.locations, bundle.things].flatMap((f) => f.entities).find((e) => e.id === ref);
        return entity ? [entity.name, ...entity.aliases ?? [], ...entity.keywords ?? []] : [resolveRefName(names, ref)];
      });
      out.push({
        record: "rel:unlinked",
        file: "relations",
        comment: "[Codex] Relations (unlinked)",
        content: `[Story Bible - Relations]
${orphans.map((r) => relationLine(r, names)).join(`
`)}`,
        keys: uniqKeys(endpointNames),
        constant: false,
        disabled: false
      });
      taken.add("rel:unlinked");
    }
  }
  for (const w of bundle.world.entries) {
    out.push({
      record: recordKey("world", w.topic, taken),
      file: "world",
      comment: `[Codex] World: ${w.topic}`,
      content: `[Story Bible - World rules: ${w.topic}]
- ${w.topic}: ${w.facts.join(" | ")}`,
      keys: uniqKeys([w.topic, ...w.keywords ?? []]),
      constant: false,
      disabled: false
    });
  }
  for (const k of bundle.knowledge.items) {
    const bits = [];
    if (k.knownBy?.length)
      bits.push(`known by ${k.knownBy.map((r) => resolveRefName(names, r)).join(", ")}`);
    if (k.hiddenFrom?.length)
      bits.push(`hidden from ${k.hiddenFrom.map((r) => resolveRefName(names, r)).join(", ")}`);
    for (const b of k.falseBeliefs ?? []) {
      bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
    }
    if (k.note)
      bits.push(k.note);
    const participants = [
      ...k.knownBy ?? [],
      ...k.hiddenFrom ?? [],
      ...(k.falseBeliefs ?? []).map((b) => b.who)
    ].filter((r) => ENTITY_REF_HEAD.test(r)).map((r) => resolveRefName(names, r));
    out.push({
      record: recordKey("know", k.fact, taken),
      file: "knowledge",
      comment: `[Codex] Secret: ${k.fact.slice(0, 60)}`,
      content: `[Story Bible - Who knows what]
- ${k.fact}${bits.length ? ` (${bits.join("; ")})` : ""}`,
      keys: uniqKeys([...participants, ...k.keywords ?? []]),
      constant: false,
      disabled: false
    });
  }
  const sections = renderCodexFileSections(bundle);
  if (sections.timeline) {
    out.push({
      record: "timeline",
      file: "timeline",
      comment: "[Codex] Timeline",
      content: `[Story Bible - current story state]
${sections.timeline}`,
      keys: [],
      constant: true,
      disabled: false
    });
  }
  if (sections.threads) {
    out.push({
      record: "threads",
      file: "threads",
      comment: "[Codex] Threads",
      content: `[Story Bible - current story state]
${sections.threads}`,
      keys: [],
      constant: true,
      disabled: false
    });
  }
  return out;
}
function renderCodexForInjection(bundle) {
  const rendered = renderCodexFileSections(bundle);
  const sections = [];
  for (const key of CODEX_FILE_KEYS) {
    const s = rendered[key];
    if (s)
      sections.push(s);
  }
  if (sections.length === 0)
    return "";
  return ["KNOWLEDGE CODEX (current story state, authoritative)", ...sections].join(`

`);
}
function renderCodexFileSections(bundle) {
  const names = new Map;
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities)
      names.set(e.id, e.name);
  }
  const out = {};
  const entitySection = (key, title, entities) => {
    if (!entities.length) {
      out[key] = "";
      return;
    }
    const lines = [`== ${title} ==`];
    for (const e of entities) {
      lines.push(entityLine(e));
      for (const t of e.ties ?? [])
        lines.push(`  * ${t}`);
    }
    out[key] = lines.join(`
`);
  };
  entitySection("characters", "Characters", bundle.characters.entities);
  entitySection("locations", "Locations", bundle.locations.entities);
  entitySection("things", "Things", bundle.things.entities);
  out.relations = bundle.relations.relations.length ? ["== Relations =="].concat(bundle.relations.relations.map((r) => relationLine(r, names))).join(`
`) : "";
  if (bundle.timeline.events.length) {
    const lines = ["== Timeline =="];
    for (const e of bundle.timeline.events) {
      const who = e.participants?.length ? ` [${e.participants.map((p) => resolveRefName(names, p)).join(", ")}]` : "";
      const where = e.where ? ` @ ${resolveRefName(names, e.where)}` : "";
      const causes = e.causes ? ` -> ${e.causes}` : "";
      lines.push(`- ${e.when}: ${e.event}${who}${where}${causes}`);
    }
    out.timeline = lines.join(`
`);
  } else {
    out.timeline = "";
  }
  const liveThreads = bundle.threads.threads.filter((t) => t.status !== "resolved");
  if (liveThreads.length || bundle.threads.seeds.length) {
    const lines = ["== Threads =="];
    for (const t of liveThreads) {
      const latest = t.latest ? ` | latest: ${t.latest}` : "";
      lines.push(`- ${t.name} (${t.status}): ${t.summary}${latest}`);
      for (const p of t.planted ?? [])
        lines.push(`  * planted: ${p}`);
    }
    for (const s of bundle.threads.seeds)
      lines.push(`- planted: ${s}`);
    out.threads = lines.join(`
`);
  } else {
    out.threads = "";
  }
  if (bundle.world.entries.length) {
    const lines = ["== World =="];
    for (const w of bundle.world.entries) {
      lines.push(`- ${w.topic}: ${w.facts.join(" | ")}`);
    }
    out.world = lines.join(`
`);
  } else {
    out.world = "";
  }
  if (bundle.knowledge.items.length) {
    const lines = ["== Who knows what =="];
    const nameList = (refs) => (refs ?? []).map((r) => resolveRefName(names, r)).join(", ");
    for (const k of bundle.knowledge.items) {
      const bits = [];
      if (k.knownBy?.length)
        bits.push(`known by ${nameList(k.knownBy)}`);
      if (k.hiddenFrom?.length)
        bits.push(`hidden from ${nameList(k.hiddenFrom)}`);
      for (const b of k.falseBeliefs ?? []) {
        bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
      }
      if (k.note)
        bits.push(k.note);
      lines.push(`- ${k.fact} (${bits.join("; ")})`);
    }
    out.knowledge = lines.join(`
`);
  } else {
    out.knowledge = "";
  }
  return out;
}
function frozenCodexFiles(states) {
  return new Set(CODEX_FILE_KEYS.filter((key) => states[key] === "frozen"));
}

// src/backend/codex/sync.ts
function readEntryMeta(entry) {
  const ext = entry.extensions || {};
  const raw = ext[CODEX_ENTRY_EXTENSION_KEY];
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.chatId !== "string" || !v.chatId)
    return null;
  if (typeof v.record !== "string" || !v.record)
    return null;
  const file = typeof v.file === "string" && CODEX_FILE_KEYS.includes(v.file) ? v.file : null;
  if (!file)
    return null;
  return { chatId: v.chatId, record: v.record, file };
}
var syncChain = new Map;
function withSyncLock(userId, chatId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = syncChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  syncChain.set(key, guarded);
  guarded.then(() => {
    if (syncChain.get(key) === guarded)
      syncChain.delete(key);
  });
  return tail;
}
function sameKeys(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
var DELETE_ATTEMPTS = 6;
var DELETE_RETRY_BASE_MS = 1000;
var DELETE_RETRY_BUDGET_MS = 300000;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function deleteSyncedEntry(entryId, userId, deadline) {
  for (let attempt = 1;; attempt++) {
    try {
      await spindle.world_books.entries.delete(entryId, userId);
      return;
    } catch (err) {
      const backoff = DELETE_RETRY_BASE_MS * 2 ** (attempt - 1);
      if (attempt >= DELETE_ATTEMPTS || Date.now() + backoff >= deadline)
        throw err;
      warn(`codex sync: delete of ${entryId} failed (attempt ${attempt}), retrying: ${describeError(err)}`);
      await sleep(backoff);
    }
  }
}
async function listSyncedEntries(bookId, chatId, userId) {
  const all = await listAllEntries(bookId, userId);
  const out = [];
  for (const entry of all) {
    const meta = readEntryMeta(entry);
    if (meta && meta.chatId === chatId)
      out.push({ raw: entry, meta });
  }
  return out;
}
function syncCodexEntries(chatId, userId, relationsTableFallback = true) {
  return withSyncLock(userId, chatId, () => doSync(chatId, userId, relationsTableFallback));
}
async function doSync(chatId, userId, relationsTableFallback) {
  if (await codexPresence(chatId, userId) === "absent") {
    await doWipe(chatId, userId);
    return;
  }
  const settings = await loadSettings(userId);
  const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
  const cursor = await loadCursor(chatId, userId);
  const diskMode = cursor.relationsTableMode ?? relationsTableFallback;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  if (problems.length > 0) {
    throw new Error(t("backend.codex.sync.doSync.codexSyncSkippedUnreadableOrInvalidFile", { length: problems.length, join: problems.map((p) => `${p.file}.json`).join(", ") }));
  }
  const relState = cursor.fileStates["relations"];
  const desired = renderCodexRecords(bundle, {
    includeRelations: relState !== "noInject" && relState !== "frozen",
    disabledFiles: new Set(Object.entries(cursor.fileStates).filter(([, st]) => st === "noInject" || st === "frozen").map(([key]) => key))
  });
  const disabledFor = (file) => {
    const st = cursor.fileStates[file];
    return st === "noInject" || st === "frozen";
  };
  let bookId;
  if (desired.length > 0) {
    bookId = (await ensureCodexBookForChat(chatId, userId)).id;
  } else {
    const found = await findCodexBookForChat(chatId, userId);
    if (!found)
      return;
    bookId = found;
  }
  const existing = await listSyncedEntries(bookId, chatId, userId);
  const byRecord = new Map;
  const deleteDeadline = Date.now() + DELETE_RETRY_BUDGET_MS;
  let failedDeletes = 0;
  for (const e of existing) {
    const dup = byRecord.get(e.meta.record);
    if (!dup) {
      byRecord.set(e.meta.record, e);
      continue;
    }
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete duplicate entry ${e.raw.id}: ${describeError(err)}`);
    });
  }
  const seen = new Set;
  for (const rec of desired) {
    seen.add(rec.record);
    const disabled = disabledFor(rec.file) || rec.disabled;
    const placement = codexEntryPlacement(profile, rec.constant);
    const meta = { chatId, record: rec.record, file: rec.file };
    const cur = byRecord.get(rec.record);
    if (!cur) {
      try {
        await spindle.world_books.entries.create(bookId, {
          content: rec.content,
          comment: rec.comment,
          disabled,
          ...placement,
          key: rec.keys,
          keysecondary: [],
          extensions: { [CODEX_ENTRY_EXTENSION_KEY]: meta }
        }, userId);
      } catch (err) {
        warn(`codex sync: failed to create entry for ${rec.record}: ${describeError(err)}`);
        throw err;
      }
      continue;
    }
    const changed = cur.raw.content !== rec.content || (cur.raw.comment || "") !== rec.comment || cur.raw.constant !== placement.constant || (cur.raw.vectorized ?? false) !== placement.vectorized || cur.raw.position !== placement.position || cur.raw.depth !== placement.depth || cur.raw.role !== placement.role || cur.raw.disabled !== disabled || !sameKeys(cur.raw.key ?? [], rec.keys) || cur.meta.file !== rec.file;
    if (!changed)
      continue;
    const ext = cur.raw.extensions || {};
    try {
      await spindle.world_books.entries.update(cur.raw.id, {
        content: rec.content,
        comment: rec.comment,
        disabled,
        ...placement,
        key: rec.keys,
        extensions: { ...ext, [CODEX_ENTRY_EXTENSION_KEY]: meta }
      }, userId);
    } catch (err) {
      warn(`codex sync: failed to update entry for ${rec.record}: ${describeError(err)}`);
      throw err;
    }
  }
  for (const [record, e] of byRecord) {
    if (seen.has(record))
      continue;
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete stale entry ${e.raw.id} (${record}): ${describeError(err)}`);
    });
  }
  if (failedDeletes > 0) {
    throw new Error(t("backend.codex.sync.doSync.outdatedCodexEntrCouldNotBeRemoved", { failedDeletes }));
  }
  recordDiagnostic(userId, {
    event: "codex",
    chatId,
    outcome: "success",
    numbers: { entries: desired.length },
    flags: { vector: profile.codexActivationMode === "vector", constant: profile.codexActivationMode === "always" }
  });
}
function wipeCodexEntries(chatId, userId) {
  return withSyncLock(userId, chatId, () => doWipe(chatId, userId));
}
async function doWipe(chatId, userId) {
  const bookId = await findCodexBookForChat(chatId, userId);
  if (!bookId)
    return;
  const existing = await listSyncedEntries(bookId, chatId, userId);
  const deleteDeadline = Date.now() + DELETE_RETRY_BUDGET_MS;
  let failed = 0;
  for (const e of existing) {
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failed++;
      warn(`codex wipe: failed to delete entry ${e.raw.id}: ${describeError(err)}`);
    });
  }
  if (failed > 0) {
    throw new Error(t("backend.codex.sync.doWipe.failedToDeleteCodexEntrTheyMay", { failed }));
  }
}
function codexEntryPlacement(profile, constant) {
  return {
    ...activationFlags(profile.codexActivationMode, constant),
    position: profile.codexInjectionPosition === "lorebook" ? 0 : 4,
    depth: profile.codexInjectionPosition === "depth" ? profile.codexInjectionDepth : 0,
    role: "system"
  };
}
async function syncCodexProfiles(userId) {
  const failures = [];
  for (const chatId of await listCodexChatIds(userId, true)) {
    try {
      await withSyncLock(userId, chatId, async () => {
        const retire = async () => {
          await setCodexOrphaned(chatId, userId, true);
          invalidateBookCache(userId, chatId);
          recordDiagnostic(userId, { event: "codex", chatId, outcome: "skipped", reason: "missing" });
        };
        if (await spindle.chats.get(chatId, userId) === null) {
          await retire();
          return;
        }
        await setCodexOrphaned(chatId, userId, false);
        try {
          await doSync(chatId, userId, true);
        } catch (err) {
          const missing = await spindle.chats.get(chatId, userId).then((chat) => chat === null, () => false);
          if (!missing)
            throw err;
          await retire();
        }
      });
    } catch (err) {
      const error = describeError(err);
      failures.push({ chatId, error });
      warn(`Codex profile sync failed for ${chatId}: ${error}`);
    }
  }
  return failures;
}

// src/backend/binding.ts
function summaryBindingRule(profile, tier) {
  if (tier === 2)
    return {
      unit: profile.arcTrigger === "chapters" ? "entries" : profile.arcTrigger,
      batch: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
      lag: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters
    };
  return profile.higherTiers[tier];
}
function summaryRuns(entries, tier) {
  const ordered = entries.filter((e) => !e.meta.ghost && !e.raw.disabled).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const runs = [];
  let current = [];
  for (const entry of ordered) {
    if (entry.meta.tier === tier)
      current.push(entry);
    else if (current.length) {
      runs.push({ entries: current, closed: entry.meta.tier > tier });
      current = [];
    }
  }
  if (current.length)
    runs.push({ entries: current, closed: false });
  return runs;
}

class SummaryTimelineError extends Error {
  constructor() {
    super(t("backend.binding.messages.selectConsecutiveSummariesWithoutCrossingAnotherSummary"));
    this.name = "SummaryTimelineError";
  }
}
function assertContiguousBinding(entries, selected) {
  if (!selected.length)
    throw new SummaryTimelineError;
  const ids = new Set(selected.map((e) => e.raw.id));
  for (const run of summaryRuns(entries, selected[0].meta.tier)) {
    const positions = run.entries.flatMap((e, i) => ids.has(e.raw.id) ? [i] : []);
    if (positions.length === selected.length && positions.at(-1) - positions[0] + 1 === selected.length)
      return;
  }
  throw new SummaryTimelineError;
}
function selectBindingBatch(entries, tier, rule, closedOnly = false) {
  if (rule.unit === "manual" && !closedOnly)
    return [];
  const runs = summaryRuns(entries, tier);
  const ordered = runs.flatMap((run) => run.entries);
  const size = (e) => rule.unit === "tokens" ? approximateTokensFromChars(e.raw.content.length) : 1;
  let cutoff = ordered.length, reserved = 0;
  while (cutoff > 0 && reserved < rule.lag)
    reserved += size(ordered[--cutoff]);
  const eligible = new Set(ordered.slice(0, cutoff).map((e) => e.raw.id));
  for (const run of runs) {
    if (closedOnly && !run.closed)
      continue;
    const selected = [];
    let count = 0;
    for (const entry of run.entries) {
      if (!run.closed && !eligible.has(entry.raw.id))
        break;
      selected.push(entry);
      count += size(entry);
      if (count >= Math.max(1, rule.batch))
        return selected;
    }
    if (run.closed)
      return selected;
  }
  return [];
}
function countBindingBacklog(entries, tier, rule) {
  let remaining = entries, count = 0;
  for (;; ) {
    const batch = selectBindingBatch(remaining, tier, rule);
    if (!batch.length)
      return count;
    const used = new Set(batch.map((e) => e.raw.id));
    remaining = remaining.filter((e) => !used.has(e.raw.id));
    count++;
  }
}

// src/backend/hooks.ts
var CHAPTER_KEY = `${EXTENSION_ID}.latest_chapter`;
var ARC_KEY = `${EXTENSION_ID}.latest_arc`;
var VOLUME_KEY = `${EXTENSION_ID}.latest_volume`;
var CODEX_UPDATED_KEY = `${EXTENSION_ID}.codex_updated`;
var codexEndpoint = (chatId) => `${EXTENSION_ID}.codex.${chatId}`;
var registered = false;
function registerHookEndpoints() {
  if (registered)
    return;
  registered = true;
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(ARC_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(VOLUME_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, null, { requires: [] });
  } catch (err) {
    warn(`rpcPool unavailable: ${describeError(err)}`);
  }
}
function publishCodexSnapshot(chatId, snapshot, rendered) {
  try {
    spindle.rpcPool?.sync?.(codexEndpoint(chatId), snapshot, { requires: [] });
    spindle.rpcPool?.sync?.(`${codexEndpoint(chatId)}.rendered`, rendered, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex snapshot: ${describeError(err)}`);
  }
}
function publishCodexUpdated(event) {
  try {
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, { ...event, updatedAt: Date.now() }, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex_updated: ${describeError(err)}`);
  }
}
function publishCodexWiped(chatId, userId) {
  publishCodexSnapshot(chatId, null, null);
  publishCodexUpdated({ chatId, userId, changedFiles: [...CODEX_FILE_KEYS], reason: "wipe" });
}
function publishChapterCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish chapter_created: ${describeError(err)}`);
  }
}
function publishArcCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(ARC_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish arc_created: ${describeError(err)}`);
  }
}
function publishVolumeCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(VOLUME_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish volume_created: ${describeError(err)}`);
  }
}

// src/backend/lessons.ts
var cache = new Map;
var inflight = new Map;
var writeLocks2 = new Map;
var failOpenUsers = new Set;
var anomalyCb = null;
function registerLessonsAnomalyCallback(cb) {
  anomalyCb = cb;
}
function withLessonsLock(userId, fn) {
  const prev = writeLocks2.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks2.set(userId, next.catch(() => {}));
  return next;
}
async function ensureLessons(userId) {
  const cached = cache.get(userId);
  if (cached)
    return cached;
  const running = inflight.get(userId);
  if (running)
    return running;
  const p = (async () => {
    const state = await loadFromDisk(userId);
    cache.set(userId, state);
    return state;
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, p);
  return p;
}
async function loadFromDisk(userId) {
  let exists;
  try {
    exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
  } catch (err) {
    error(`lessons: exists() failed, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, t("backend.lessons.loadFromDisk.memoriaCouldnTReadHerLessonRegister", { describeError: describeError(err) }));
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
  if (!exists) {
    const fresh = await isFreshInstall(userId);
    const state = makeDefaultLessons(fresh);
    failOpenUsers.delete(userId);
    await spindle.userStorage.setJson(LESSONS_PATH, state, { indent: 0, userId }).catch((err) => warn(`lessons: initial save failed: ${describeError(err)}`));
    await applyGateFlags(userId, fresh).catch((err) => warn(`lessons: gate flag init failed: ${describeError(err)}`));
    return state;
  }
  try {
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    failOpenUsers.delete(userId);
    return normalizeLessons(JSON.parse(raw));
  } catch (err) {
    error(`lessons: file unreadable, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, t("backend.lessons.loadFromDisk.memoriaCouldnTReadHerLessonRegister", { describeError: describeError(err) }));
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
}
async function isFreshInstall(userId) {
  try {
    return !await spindle.userStorage.exists(SETTINGS_PATH, userId);
  } catch {
    return false;
  }
}
async function applyGateFlags(userId, freshInstall) {
  await mutateSettings(userId, (cur) => ({
    ...cur,
    profiles: cur.profiles.map((p) => ({
      ...p,
      codexEnabled: false,
      ...freshInstall ? { autoCreate: false } : {}
    }))
  }));
}
async function tryReadRealLessons(userId) {
  try {
    const exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
    if (!exists)
      return null;
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    return normalizeLessons(JSON.parse(raw));
  } catch {
    return null;
  }
}
async function mutateLessons(userId, fn) {
  return withLessonsLock(userId, async () => {
    let cur = await ensureLessons(userId);
    if (failOpenUsers.has(userId)) {
      const real = await tryReadRealLessons(userId);
      if (real) {
        failOpenUsers.delete(userId);
        cur = real;
      }
    }
    const next = fn(cur);
    if (failOpenUsers.has(userId)) {
      cache.set(userId, next);
      warn(`lessons: register still unreadable for ${userId.slice(0, 6)}, keeping the change in memory only`);
      anomalyCb?.(userId, t("backend.lessons.mutateLessons.memoriaCouldnTReadHerLessonRegister"));
      return next;
    }
    await spindle.userStorage.setJson(LESSONS_PATH, next, { indent: 0, userId });
    cache.set(userId, next);
    return next;
  });
}
function patchLessonCourse(userId, course, patch) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    return {
      ...cur,
      [course]: {
        ...prev,
        ...patch,
        answers: patch.answers ? { ...prev.answers, ...patch.answers } : prev.answers
      }
    };
  });
}
function completeLessonCourse(userId, course, wrong, total, grade, signedName, answers) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    const bestWrong = prev.bestWrong === null ? wrong : Math.min(prev.bestWrong, wrong);
    return {
      ...cur,
      [course]: {
        ...prev,
        status: "done",
        answers: answers ? { ...prev.answers, ...answers } : prev.answers,
        attempts: prev.attempts + 1,
        lastWrong: wrong,
        lastTotal: total > 0 ? total : null,
        bestWrong,
        grade,
        completedAt: Date.now(),
        signedName: signedName?.trim() ? signedName.trim().slice(0, 60) : prev.signedName,
        startedAt: prev.startedAt ?? Date.now()
      }
    };
  });
}
function resetLessonCourse(userId, course, mode, section, answerIds) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    const wasDone = prev.status === "done" || prev.completedAt !== null && prev.grade !== null;
    const status = wasDone ? "done" : "in_progress";
    let next;
    if (mode === "course") {
      next = {
        ...prev,
        status,
        section: 0,
        step: 0,
        answers: {},
        lastWrong: wasDone ? prev.lastWrong : null,
        startedAt: Date.now()
      };
    } else {
      const answers = { ...prev.answers };
      for (const id of answerIds ?? [])
        delete answers[id];
      next = {
        ...prev,
        status,
        section: typeof section === "number" && section >= 0 ? section : prev.section,
        step: 0,
        answers
      };
    }
    return { ...cur, [course]: next };
  });
}
function skipCourseSeal(userId, course) {
  return mutateLessons(userId, (cur) => {
    if (course === "codex" ? cur.codexSealSkipped : cur.booksSealSkipped)
      return cur;
    return course === "codex" ? { ...cur, codexSealSkipped: true } : { ...cur, booksSealSkipped: true };
  });
}
function effectiveProfile(profile, lessons) {
  if (!codexLessonGated(lessons))
    return profile;
  if (!profile.codexEnabled)
    return profile;
  return { ...profile, codexEnabled: false };
}
function codexGated(lessons) {
  return codexLessonGated(lessons);
}

// src/backend/pipeline.ts
var inflight2 = new Map;
var busyByUser = new Map;
var aborters = new Map;
var progressLastPush = new Map;
var progressState = new Map;
var heartbeatTimer = null;
var HEARTBEAT_INTERVAL_MS = 1000;
var failureByChat = new Map;
var previewsByChat = new Map;
var previewSources = new WeakMap;
var replacementSources = new WeakMap;
var changedSources = () => new Error(t("backend.pipeline.changedSources.summarySourcesChangedDiscardThisResultAnd"));
var messageSource = (m) => msgSig(m.role, m.content || "");
var entrySource = (e) => msgSig("summary", JSON.stringify([e.raw.content, e.meta.tier, e.meta.msgIds, e.meta.sourceChapterEntryIds, e.meta.isRoot]));
var replacementSource = (e) => msgSig("replacement", JSON.stringify([entrySource(e), e.raw.comment, e.raw.key]));
async function captureReplacement(chatId, userId, entryId, sourceIds) {
  if (!entryId)
    return;
  const entry = (await listLmbEntries(chatId, userId, true)).find((e) => e.raw.id === entryId);
  if (!entry)
    throw changedSources();
  const expected = new Set(entry.meta.tier === 1 ? entry.meta.msgIds : entry.meta.sourceChapterEntryIds ?? []);
  if (expected.size !== new Set(sourceIds).size || sourceIds.some((id) => !expected.has(id)))
    throw changedSources();
  return replacementSource(entry);
}
function copyReplacement(from, to) {
  const source = replacementSources.get(from);
  if (source)
    replacementSources.set(to, source);
}
async function assertReplacementActive(entries, replacesEntryId, chatId, userId, result) {
  if (!replacesEntryId)
    return;
  const coverage = await buildCoverage(chatId, userId, entries);
  const target = coverage.activeEntries.find((e) => e.raw.id === replacesEntryId);
  if (!target || replacementSources.get(result) !== replacementSource(target))
    throw changedSources();
}
var committingDrafts = new Set;
var PROGRESS_PUSH_INTERVAL_MS = 250;
var freedGhostNumbers = new Map;
var FREED_NUMBERS_CAP = 20;
var FREED_MAP_CAP = 200;
function recordFreedGhostNumber(userId, chatId, msgIds, sceneNumber) {
  const key = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key) ?? [];
  freedGhostNumbers.delete(key);
  list.push({ ids: new Set(msgIds), sceneNumber });
  freedGhostNumbers.set(key, list.slice(-FREED_NUMBERS_CAP));
  capMap(freedGhostNumbers, FREED_MAP_CAP);
}
function takeFreedGhostNumber(userId, chatId, windowIds) {
  const key = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key);
  if (!list)
    return null;
  const idx = list.findIndex((f) => {
    for (const id of windowIds)
      if (f.ids.has(id))
        return true;
    return false;
  });
  if (idx === -1)
    return null;
  const n = list[idx].sceneNumber;
  list.splice(idx, 1);
  if (list.length === 0)
    freedGhostNumbers.delete(key);
  return n;
}
var FAILURE_MAP_CAP = 500;
var PREVIEW_MAP_CAP = 500;
function capMap(map, cap) {
  while (map.size > cap) {
    const oldest = map.keys().next().value;
    if (oldest === undefined)
      break;
    map.delete(oldest);
  }
}
function busyKey(userId, chatId, kind) {
  return `${userId}::${chatId}::${kind}`;
}
function chatKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
var cb = null;
function registerPipelineCallbacks(c) {
  function delivery(name, send) {
    return (...args) => {
      try {
        send(...args);
      } catch (err) {
        warn(`${name} delivery failed: ${describeError(err)}`);
      }
    };
  }
  cb = {
    onBusyChange: delivery(t("backend.pipeline.registerPipelineCallbacks.busyStatus"), c.onBusyChange.bind(c)),
    onToast: delivery("toast", c.onToast.bind(c)),
    onStateChange: delivery("state", c.onStateChange.bind(c)),
    onStreamText: delivery(t("backend.pipeline.registerPipelineCallbacks.streamViewer"), c.onStreamText.bind(c))
  };
}
function pushStreamText(userId, chatId, kind, snap) {
  cb?.onStreamText(userId, chatId, kind, snap);
}
function setBusy(userId, chatId, kind, label) {
  const key = busyKey(userId, chatId, kind);
  if (inflight2.has(key)) {
    recordDiagnostic(userId, { event: "operation", chatId, mode: kind, outcome: "skipped", reason: "busy" });
    return false;
  }
  recordDiagnostic(userId, { event: "operation", chatId, mode: kind, outcome: "started" });
  const entry = { kind, chatId, label, startedAt: Date.now() };
  inflight2.set(key, entry);
  aborters.set(key, new AbortController);
  progressState.set(key, { kind, chars: 0, thinkingChars: 0, userId, chatId });
  streamBufs.delete(key);
  streamLastPush.delete(key);
  capMap(streamBufs, STREAM_MAP_CAP);
  while (streamWatchers.size > STREAM_MAP_CAP) {
    const oldest = streamWatchers.values().next().value;
    if (oldest === undefined)
      break;
    streamWatchers.delete(oldest);
  }
  const list = busyByUser.get(userId) ?? [];
  list.push(entry);
  busyByUser.set(userId, list);
  cb?.onBusyChange(userId, list.slice());
  ensureHeartbeat();
  return true;
}
function clearBusy(userId, chatId, kind) {
  const key = busyKey(userId, chatId, kind);
  recordDiagnostic(userId, { event: "operation", chatId, mode: kind, outcome: "finished", numbers: { durationMs: Date.now() - (inflight2.get(key)?.startedAt ?? Date.now()) } });
  inflight2.delete(key);
  aborters.delete(key);
  progressLastPush.delete(key);
  progressState.delete(key);
  if (streamWatchers.has(key)) {
    const buf = streamBufs.get(key);
    if (buf)
      pushStreamText(userId, chatId, kind, { content: buf.content, thinking: buf.thinking, running: false });
  }
  streamLastPush.delete(key);
  const fresh = [];
  for (const k of inflight2.keys()) {
    if (!k.startsWith(`${userId}::`))
      continue;
    const found = inflight2.get(k);
    if (found)
      fresh.push(found);
  }
  busyByUser.set(userId, fresh);
  cb?.onBusyChange(userId, fresh.slice());
}
function registerAborter(userId, chatId, kind, controller) {
  const key = busyKey(userId, chatId, kind);
  if (aborters.get(key)?.signal.aborted)
    controller.abort();
  aborters.set(key, controller);
}
function abortBusy(userId, chatId, kind) {
  const controller = aborters.get(busyKey(userId, chatId, kind));
  if (!controller)
    return false;
  controller.abort();
  return true;
}
function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)
    return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m${rem.toString().padStart(2, "0")}s`;
}
var BUSY_PHRASES = {
  chapter: { idle: t("backend.pipeline.busyPhrases.memoriaIsFilingAChapter"), writing: t("backend.pipeline.busyPhrases.memoriaIsWritingAChapter") },
  arc: { idle: t("backend.pipeline.busyPhrases.memoriaIsBindingAnArc"), writing: t("backend.pipeline.busyPhrases.memoriaIsBindingAnArc") },
  volume: { idle: t("backend.pipeline.busyPhrases.memoriaIsPressingAVolume"), writing: t("backend.pipeline.busyPhrases.memoriaIsPressingAVolume") },
  series: { idle: t("backend.pipeline.busyPhrases.memoriaIsBindingASeries"), writing: t("backend.pipeline.busyPhrases.memoriaIsBindingASeries") },
  saga: { idle: t("backend.pipeline.busyPhrases.memoriaIsBindingASaga"), writing: t("backend.pipeline.busyPhrases.memoriaIsBindingASaga") },
  library: { idle: t("backend.pipeline.busyPhrases.memoriaIsBindingALibrary"), writing: t("backend.pipeline.busyPhrases.memoriaIsBindingALibrary") },
  universe: { idle: t("backend.pipeline.busyPhrases.memoriaIsBindingAUniverse"), writing: t("backend.pipeline.busyPhrases.memoriaIsBindingAUniverse") },
  codex: { idle: t("backend.pipeline.busyPhrases.memoriaIsUpdatingTheCodex"), writing: t("backend.pipeline.busyPhrases.memoriaIsUpdatingTheCodex") }
};
function formatBusyLabel(state, elapsedMs) {
  const { idle, writing } = BUSY_PHRASES[state.kind];
  const tokens = approximateTokensFromChars(state.chars);
  const thinkTokens = approximateTokensFromChars(state.thinkingChars);
  const t2 = formatElapsed(elapsedMs);
  if (tokens === 0 && thinkTokens === 0)
    return `${idle} (${t2})`;
  if (tokens === 0 && thinkTokens > 0)
    return t("backend.pipeline.formatBusyLabel.memoriaIsThinkingT", { thinkTokens, t: t2 });
  if (thinkTokens > 0)
    return t("backend.pipeline.formatBusyLabel.tWrittenTThought", { writing, tokens, thinkTokens, t: t2 });
  return `${writing} (~${tokens}t, ${t2})`;
}
function ensureHeartbeat() {
  if (heartbeatTimer)
    return;
  heartbeatTimer = setInterval(() => {
    if (progressState.size === 0) {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      return;
    }
    const touched = new Set;
    for (const [key, ps] of progressState) {
      const entry = inflight2.get(key);
      if (!entry)
        continue;
      const elapsed = Date.now() - entry.startedAt;
      entry.label = formatBusyLabel(ps, elapsed);
      touched.add(ps.userId);
    }
    for (const userId of touched) {
      const list = busyByUser.get(userId) ?? [];
      cb?.onBusyChange(userId, list.slice());
    }
  }, HEARTBEAT_INTERVAL_MS);
}
var streamBufs = new Map;
var streamWatchers = new Set;
var streamLastPush = new Map;
var STREAM_PUSH_INTERVAL_MS = 350;
var STREAM_MAP_CAP = 50;
var STREAM_BUF_CAP = 200000;
function capStreamPart(s) {
  if (s.length <= STREAM_BUF_CAP)
    return s;
  return t("backend.pipeline.capStreamPart.earlierOutputTrimmed", { slice: s.slice(-STREAM_BUF_CAP) });
}
function appendStreamText(userId, chatId, kind, deltaKind, delta) {
  const key = busyKey(userId, chatId, kind);
  if (!inflight2.has(key))
    return;
  const buf = streamBufs.get(key) ?? { content: "", thinking: "" };
  if (deltaKind === "text")
    buf.content = capStreamPart(buf.content + delta);
  else
    buf.thinking = capStreamPart(buf.thinking + delta);
  streamBufs.set(key, buf);
  if (!streamWatchers.has(key))
    return;
  const now = Date.now();
  if (now - (streamLastPush.get(key) ?? 0) < STREAM_PUSH_INTERVAL_MS)
    return;
  streamLastPush.set(key, now);
  pushStreamText(userId, chatId, kind, { content: buf.content, thinking: buf.thinking, running: true });
}
function setStreamWatcher(userId, chatId, kind, on) {
  const key = busyKey(userId, chatId, kind);
  if (!on) {
    streamWatchers.delete(key);
    return;
  }
  streamWatchers.add(key);
  const buf = streamBufs.get(key);
  pushStreamText(userId, chatId, kind, {
    content: buf?.content ?? "",
    thinking: buf?.thinking ?? "",
    running: inflight2.has(key)
  });
}
function updateProgressNumbers(userId, chatId, kind, chars, thinkingChars) {
  const key = busyKey(userId, chatId, kind);
  const ps = progressState.get(key);
  if (!ps)
    return;
  ps.chars = chars;
  ps.thinkingChars = thinkingChars;
  const entry = inflight2.get(key);
  if (!entry)
    return;
  const now = Date.now();
  const last = progressLastPush.get(key) ?? 0;
  if (now - last < PROGRESS_PUSH_INTERVAL_MS)
    return;
  progressLastPush.set(key, now);
  entry.label = formatBusyLabel(ps, now - entry.startedAt);
  const list = busyByUser.get(userId) ?? [];
  cb?.onBusyChange(userId, list.slice());
}
function getBusy(userId) {
  return (busyByUser.get(userId) ?? []).slice();
}
function getLastFailure(userId, chatId) {
  return failureByChat.get(chatKey(userId, chatId)) ?? null;
}
function clearLastFailure(userId, chatId) {
  failureByChat.delete(chatKey(userId, chatId));
}
function getPendingPreviews(userId, chatId) {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).slice();
}
function findPendingPreview(userId, chatId, draftId) {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).find((p) => p.draftId === draftId) ?? null;
}
function dropPendingPreview(userId, chatId, draftId) {
  recordDiagnostic(userId, { event: "preview", chatId, entryId: draftId, outcome: "removed" });
  const list = previewsByChat.get(chatKey(userId, chatId)) ?? [];
  previewsByChat.set(chatKey(userId, chatId), list.filter((p) => p.draftId !== draftId));
}
function patchPendingPreview(userId, chatId, draftId, patch) {
  const key = chatKey(userId, chatId);
  const list = previewsByChat.get(key) ?? [];
  const idx = list.findIndex((p) => p.draftId === draftId);
  if (idx === -1)
    return;
  const old = list[idx];
  list[idx] = {
    ...old,
    title: patch.title !== undefined ? patch.title : old.title,
    content: patch.content !== undefined ? patch.content : old.content
  };
  const sources = previewSources.get(old);
  if (sources)
    previewSources.set(list[idx], sources);
  copyReplacement(old, list[idx]);
  previewsByChat.set(key, list);
}
function pushPreview(userId, chatId, preview) {
  recordDiagnostic(userId, { event: "preview", chatId, entryId: preview.draftId, replacesEntryId: preview.replacesEntryId, mode: preview.kind, outcome: "created", numbers: { sourceCount: preview.sourceMessageIds.length, first: preview.firstMsgIdx, last: preview.lastMsgIdx } });
  const key = chatKey(userId, chatId);
  const existing = previewsByChat.get(key);
  if (existing) {
    previewsByChat.delete(key);
    existing.push(preview);
    previewsByChat.set(key, existing);
  } else {
    previewsByChat.set(key, [preview]);
  }
  capMap(previewsByChat, PREVIEW_MAP_CAP);
}
async function runWithRetry(attempts, fn, onRetry) {
  let lastErr = null;
  const tries = Math.max(1, attempts);
  for (let i = 0;i < tries; i++) {
    try {
      const v = await fn();
      return { ok: true, value: v };
    } catch (err) {
      lastErr = err;
      if (err instanceof FatalSummarizerError || err instanceof AbortedSummarizerError) {
        return { ok: false, err, retries: i };
      }
      if (i < tries - 1)
        onRetry(i + 1, err);
    }
  }
  return { ok: false, err: lastErr, retries: tries - 1 };
}
function recordFailure(userId, chatId, kind, retries, err, selection) {
  recordDiagnostic(userId, { event: "failure", chatId, mode: kind, outcome: "failed", reason: diagnosticErrorReason(err), numbers: { attempt: retries }, replacesEntryId: selection?.replacesEntryId });
  const key = chatKey(userId, chatId);
  if (failureByChat.has(key))
    failureByChat.delete(key);
  failureByChat.set(key, {
    kind,
    message: describeError(err),
    retriedTimes: retries,
    at: Date.now(),
    ...selection
  });
  capMap(failureByChat, FAILURE_MAP_CAP);
}
function nyaaToast(userId, kind, automation) {
  if (!cb)
    return;
  const tone = kind === "retry" ? "warn" : kind === "success" || kind === "arc_success" || kind === "volume_success" ? "success" : "info";
  cb.onToast(userId, tone, pickPhrase(kind), automation);
}
function shortErrorText(err) {
  const raw = describeError(err).replace(/\s+/g, " ").trim();
  const firstSentence = raw.split(/(?<=[.!?])\s/, 1)[0] || raw;
  const cleaned = firstSentence.replace(/;/g, ",");
  return cleaned.length > 160 ? `${cleaned.slice(0, 159)}\u2026` : cleaned;
}
function failToast(userId, kind, err) {
  const noun = kind === "arc" ? t("backend.pipeline.noun.bindTheArc") : kind === "volume" ? t("backend.pipeline.noun.pressTheVolume") : t("backend.pipeline.noun.fileTheChapter");
  cb?.onToast(userId, "error", t("backend.pipeline.failToast.memoriaCouldnT", { noun, shortErrorText: shortErrorText(err) }));
}
function extraContextActive(profile) {
  return profile.codexEnabled && profile.codexExtraContext;
}
async function createChapterAuto(chatId, profile, settings, userId, automation = false, ghost = false, manual = false) {
  if (!setBusy(userId, chatId, "chapter", t("backend.pipeline.createChapterAuto.memoriaIsFilingAChapter")))
    return null;
  try {
    await requireForkShelf(chatId, userId);
    if (ghost) {
      const live = await loadSettings(userId);
      const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
      if (!liveProfile || !extraContextActive(liveProfile))
        return null;
    }
    const messages = await spindle.chat.getMessages(chatId);
    if (!messages || messages.length === 0)
      return null;
    const effProfile = ghost ? { ...profile, lagUnit: profile.codexLagUnit, lagValue: profile.codexLagValue } : profile;
    const includeGhosts = ghost || extraContextActive(profile);
    const coverage = await buildCoverage(chatId, userId, undefined, includeGhosts);
    const window = selectUncoveredChapterWindow(messages, coverage, effProfile, manual && !ghost);
    recordSelection(userId, chatId, effProfile, messages, coverage, window, ghost ? "ghost" : manual ? "manual" : "automatic");
    if (window.length === 0)
      return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { automation, ghost });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}
async function createChapterFromRange(chatId, messageIds, profile, settings, userId, opts = {}) {
  if (!setBusy(userId, chatId, "chapter", t("backend.pipeline.createChapterFromRange.memoriaIsFilingAChapter")))
    return null;
  try {
    await requireForkShelf(chatId, userId);
    const messages = await spindle.chat.getMessages(chatId);
    const set = new Set(messageIds);
    const liveIds = new Set(messages.map((m) => m.id));
    const window = messages.filter((m) => set.has(m.id) && !isExcluded(m));
    if (window.length !== set.size)
      throw changedSources();
    const coverage = await buildCoverage(chatId, userId, undefined, extraContextActive(profile));
    recordSelection(userId, chatId, profile, messages, coverage, window, opts.replacesEntryId ? "regenerate" : "selected", opts.replacesEntryId);
    recordDiagnostic(userId, { event: "action", chatId, mode: opts.replacesEntryId ? "regenerate" : "selected", numbers: { requested: messageIds.length, selected: window.length, missing: messageIds.filter((id) => !liveIds.has(id)).length } });
    if (window.length === 0)
      return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { replacesEntryId: opts.replacesEntryId });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}
function selectPreviousChapters(coverage, messages, window, count, replacesEntryId) {
  if (count <= 0)
    return [];
  const positions = new Map(messages.map((m, i) => [m.id, i]));
  const first = positions.get(window[0].id);
  const end = (e) => e.meta.isRoot ? e.meta.lastMsgIdx ?? -1 : liveEndPosition(e.meta.msgIds, undefined, positions);
  return coverage.activeEntries.filter((e) => e.meta.tier === 1 && e.raw.id !== replacesEntryId && end(e) < first).sort((a, b) => end(a) - end(b)).slice(-count);
}
async function runChapter(chatId, profile, settings, userId, allMessages, window, opts = {}) {
  const { replacesEntryId } = opts;
  const replacement = await captureReplacement(chatId, userId, replacesEntryId, window.map((m) => m.id));
  const automation = opts.automation === true;
  const ghost = opts.ghost === true;
  const retrySelection = ghost ? undefined : { sourceMessageIds: window.map((m) => m.id), replacesEntryId };
  nyaaToast(userId, "fire", automation);
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, ghost || extraContextActive(profile));
  const previousMemories = selectPreviousChapters(coverage, allMessages, window, profile.previousMemoriesCount, replacesEntryId);
  recordDiagnostic(userId, {
    event: "context",
    chatId,
    replacesEntryId,
    mode: "chapter",
    flags: { automation, ghost, regeneration: !!replacesEntryId },
    messageScope: "selected",
    numbers: { previous: previousMemories.length, selected: window.length },
    messages: window.map((m) => ({ id: m.id, index: m.index_in_chat })),
    entries: diagnosticEntries(previousMemories)
  });
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, "chapter", controller);
    try {
      return await summarizeChapter(profile, settings.customPresets, chatId, window, previousMemories, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "chapter", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "chapter", kind, delta)
      });
    } finally {
      aborters.delete(busyKey(userId, chatId, "chapter"));
    }
  }, (n, err) => {
    recordDiagnostic(userId, { event: "retry", chatId, mode: "chapter", outcome: "failed", reason: diagnosticErrorReason(err), numbers: { attempt: n } });
    warn(`chapter attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", t("backend.pipeline.runChapter.memoriaSetsThePenDown"));
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "chapter", outcome.retries, outcome.err, retrySelection);
    failToast(userId, "chapter", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  if (replacement)
    replacementSources.set(result, replacement);
  const firstIdx = window[0].index_in_chat;
  const lastIdx = window[window.length - 1].index_in_chat;
  if (profile.showMemoryPreviews && !ghost) {
    const draft = makePreview("chapter", chatId, window, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitChapter(chatId, profile, userId, window, result, firstIdx, lastIdx, allMessages, false, replacesEntryId, ghost);
    nyaaToast(userId, "success", automation);
    return entryId;
  } catch (err) {
    warn(`commitChapter failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "chapter", 0, err, retrySelection);
    failToast(userId, "chapter", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitChapter(chatId, profile, userId, window, result, firstIdx, lastIdx, allMessages, fromPreview, replacesEntryId, ghost = false) {
  return withCommitMutex(userId, chatId, async () => {
    if (ghost) {
      const live = await loadSettings(userId);
      const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
      if (!liveProfile || !extraContextActive(liveProfile)) {
        throw new Error(t("backend.pipeline.commitChapter.extraContextModeWasTurnedOffWhile"));
      }
    }
    const liveMessages = await spindle.chat.getMessages(chatId);
    const liveById = new Map(liveMessages.map((m) => [m.id, m]));
    if (window.some((m) => {
      const live = liveById.get(m.id);
      return !live || isExcluded(live) || messageSource(live) !== messageSource(m);
    }))
      throw changedSources();
    window = window.map((m) => liveById.get(m.id));
    allMessages = liveMessages;
    firstIdx = window[0].index_in_chat;
    lastIdx = window[window.length - 1].index_in_chat;
    const freshEntries = await listLmbEntries(chatId, userId, true);
    await assertReplacementActive(freshEntries, replacesEntryId, chatId, userId, result);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage, ghost || extraContextActive(profile));
    const validWindow = window.filter((m) => !freshCoverage.coveredBy.has(m.id));
    if (validWindow.length === 0) {
      const ghostById = new Map(freshEntries.map((e) => [e.raw.id, e.meta.ghost === true]));
      const allGhost = window.every((m) => ghostById.get(freshCoverage.coveredBy.get(m.id) ?? "") === true);
      throw new Error(allGhost ? t("backend.pipeline.commitChapter.thoseMessagesAreAlreadyStagedAsA") : t("backend.pipeline.commitChapter.allMessagesInThisWindowWereJust"));
    }
    if (validWindow.length < window.length) {
      recordDiagnostic(userId, { event: "commit", chatId, mode: "chapter", outcome: "pending", reason: "coverage_changed", numbers: { requested: window.length, selected: validWindow.length } });
      throw changedSources();
    }
    const book = await ensureBookForChat(chatId, userId);
    const replacedEntry = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    let sceneNumber;
    let freedTaken = null;
    if (typeof replacedEntry?.meta.sceneNumber === "number") {
      sceneNumber = replacedEntry.meta.sceneNumber;
    } else {
      freedTaken = ghost ? takeFreedGhostNumber(userId, chatId, new Set(window.map((m) => m.id))) : null;
      sceneNumber = freedTaken ?? await nextSceneNumber(chatId, 1, userId);
    }
    const title = fromPreview ? result.title?.trim() || t("backend.pipeline.title.chapterMsgs", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 }) : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const msgIds = window.map((m) => m.id);
    const meta = {
      tier: 1,
      chatId,
      msgIds,
      firstMsgIdx: firstIdx >= 0 ? firstIdx : undefined,
      lastMsgIdx: lastIdx >= 0 ? lastIdx : undefined,
      tokenCountInput: window.reduce((acc, m) => acc + approximateTokensFromChars((m.content || "").length), 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...ghost ? { ghost: true, msgSigs: window.map((m) => msgSig(m.role, m.content || "")) } : {}
    };
    const baseComment = meta.title ?? t("backend.pipeline.baseComment.chapterMsgs", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 });
    const comment = `#${sceneNumber} - ${baseComment}`;
    const settings = await loadSettings(userId);
    const opener = buildChapterHeader(sceneNumber, msgIds.length);
    const finalContent = `${opener}

${result.content}`;
    let entry;
    try {
      entry = await createChapterEntry(book.id, meta, finalContent, comment, userId, result.keywords ?? [], ghost, replacedEntry);
    } catch (err) {
      if (freedTaken !== null)
        recordFreedGhostNumber(userId, chatId, msgIds, freedTaken);
      throw err;
    }
    recordDiagnostic(userId, { event: "commit", chatId, entryId: entry.id, replacesEntryId, outcome: "success", entries: diagnosticEntries([{ raw: entry, meta }]) });
    invalidateBookCache(userId, chatId);
    if (profile.hideCoveredMessages && !ghost) {
      try {
        await syncHiddenForCoveredMessages(chatId, allMessages, {
          coveredBy: new Map(window.map((m) => [m.id, entry.id])),
          activeEntries: [],
          volumes: [],
          arcs: [],
          chapters: []
        }, userId, true);
      } catch (err) {
        warn(`setMessagesHidden failed: ${describeError(err)}`);
      }
    }
    if (!ghost) {
      publishChapterCreated(userId, {
        chatId,
        chapterEntryId: entry.id,
        bookId: book.id,
        sourceMessageIds: meta.msgIds,
        summaryText: finalContent,
        model: result.model,
        title: meta.title
      });
    }
    cb?.onStateChange(userId, chatId);
    return entry.id;
  });
}
async function listTimelineEntries(chatId, userId, fresh = false) {
  const [entries, messages] = await Promise.all([
    listLmbEntries(chatId, userId, fresh),
    spindle.chat.getMessages(chatId)
  ]);
  return withLiveMessageRanges(entries, messages);
}
async function createArcFromChapters(chatId, chapterEntryIds, profile, settings, userId, opts = {}) {
  if (!setBusy(userId, chatId, "arc", t("backend.pipeline.createArcFromChapters.memoriaIsBindingAnArc")))
    return null;
  try {
    const entries = await listTimelineEntries(chatId, userId, true);
    const entriesForSelection = opts.replacesEntryId ? entries.filter((e) => e.raw.id !== opts.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(chapterEntryIds);
    const chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && wanted.has(e.raw.id)).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (chapters.length !== wanted.size)
      throw changedSources();
    if (chapters.length === 0)
      return null;
    assertContiguousBinding(coverage.activeEntries, chapters);
    return await runArc(chatId, profile, settings, userId, chapters, opts);
  } finally {
    clearBusy(userId, chatId, "arc");
  }
}
async function runArc(chatId, profile, settings, userId, selected, opts = {}) {
  const { replacesEntryId } = opts;
  const replacement = await captureReplacement(chatId, userId, replacesEntryId, selected.map((e) => e.raw.id));
  const automation = opts.automation === true;
  nyaaToast(userId, "arc_fire", automation);
  recordDiagnostic(userId, { event: "context", chatId, mode: "arc", replacesEntryId, flags: { automation, regeneration: !!replacesEntryId }, numbers: { selected: selected.length }, entries: diagnosticEntries(selected) });
  const totalTurns = selected.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, "arc", controller);
    try {
      return await summarizeArc(profile, settings.customPresets, chatId, selected, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "arc", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "arc", kind, delta)
      });
    } finally {
      aborters.delete(busyKey(userId, chatId, "arc"));
    }
  }, (n, err) => {
    recordDiagnostic(userId, { event: "retry", chatId, mode: "arc", outcome: "failed", reason: diagnosticErrorReason(err), numbers: { attempt: n } });
    warn(`arc attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", t("backend.pipeline.runArc.memoriaSetsThePenDown"));
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "arc", outcome.retries, outcome.err, { sourceEntryIds: selected.map((e) => e.raw.id), replacesEntryId });
    failToast(userId, "arc", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  if (replacement)
    replacementSources.set(result, replacement);
  const firstIdxs = selected.map((c) => c.meta.firstMsgIdx).filter((n) => typeof n === "number");
  const lastIdxs = selected.map((c) => c.meta.lastMsgIdx).filter((n) => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview("arc", selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitArc(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, automation);
    nyaaToast(userId, "arc_success", automation);
    return entryId;
  } catch (err) {
    warn(`commitArc failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "arc", 0, err, { sourceEntryIds: selected.map((e) => e.raw.id), replacesEntryId });
    failToast(userId, "arc", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitArc(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, automation = false) {
  return withCommitMutex(userId, chatId, async () => {
    const freshEntries = await listTimelineEntries(chatId, userId, true);
    await assertReplacementActive(freshEntries, replacesEntryId, chatId, userId, result);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
    const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === 1).map((e) => e.raw.id));
    const filtered = selected.filter((c) => stillActive.has(c.raw.id));
    if (filtered.length === 0) {
      throw new Error(t("backend.pipeline.commitArc.allSourceChaptersWereAlreadyBoundBy"));
    }
    if (filtered.length < selected.length) {
      throw changedSources();
    }
    const freshById = new Map(freshEntries.map((e) => [e.raw.id, e]));
    if (selected.some((e) => entrySource(e) !== entrySource(freshById.get(e.raw.id))))
      throw changedSources();
    selected = selected.map((e) => freshById.get(e.raw.id));
    const liveFirst = selected.flatMap((e) => e.meta.firstMsgIdx === undefined ? [] : [e.meta.firstMsgIdx]);
    const liveLast = selected.flatMap((e) => e.meta.lastMsgIdx === undefined ? [] : [e.meta.lastMsgIdx]);
    firstIdx = liveFirst.length ? Math.min(...liveFirst) : 0;
    lastIdx = liveLast.length ? Math.max(...liveLast) : firstIdx;
    assertContiguousBinding(freshCoverage.activeEntries, selected);
    const book = await ensureBookForChat(chatId, userId);
    const replacedArc = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    const sceneNumber = typeof replacedArc?.meta.sceneNumber === "number" ? replacedArc.meta.sceneNumber : await nextSceneNumber(chatId, 2, userId);
    const msgIds = selected.flatMap((c) => c.meta.msgIds);
    const sourceChapterEntryIds = selected.map((c) => c.raw.id);
    const isRootArc = selected.length > 0 && selected.every((c) => c.meta.isRoot);
    const rootOrigin = isRootArc ? selected.find((c) => c.meta.rootOrigin)?.meta.rootOrigin : undefined;
    if (!isRootArc && selected.some((c) => c.meta.isRoot)) {
      const own = selected.filter((c) => !c.meta.isRoot);
      const fs = own.map((c) => c.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const ls = own.map((c) => c.meta.lastMsgIdx).filter((n) => typeof n === "number");
      if (fs.length)
        firstIdx = Math.min(...fs);
      else if (firstIdx < 0)
        firstIdx = 0;
      if (ls.length)
        lastIdx = Math.max(...ls);
      else if (lastIdx < firstIdx)
        lastIdx = firstIdx;
    }
    const arcTitle = isRootArc ? result.title?.trim() || t("backend.pipeline.arcTitle.inheritedArc") : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const meta = {
      tier: 2,
      chatId,
      msgIds,
      sourceChapterEntryIds,
      firstMsgIdx: firstIdx,
      lastMsgIdx: lastIdx,
      tokenCountInput: selected.reduce((a, c) => a + c.meta.tokenCountOutput, 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title: arcTitle,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...isRootArc ? { isRoot: true, rootOrigin } : {}
    };
    const baseComment = meta.title ?? t("backend.pipeline.baseComment.arcMsgs", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 });
    const comment = t("backend.pipeline.comment.arc", { choice: isRootArc ? "yes" : "no", sceneNumber, baseComment });
    const arcOpener = buildArcHeader(sceneNumber, sourceChapterEntryIds.length, msgIds.length);
    const finalArcContent = `${arcOpener}

${result.content}`;
    const arcEntry = await createChapterEntry(book.id, meta, finalArcContent, comment, userId, result.keywords ?? [], false, replacedArc);
    const failedSupersedes = [];
    for (const ch of selected) {
      try {
        await patchEntryMeta(ch, { supersededByEntryId: arcEntry.id }, userId);
      } catch (err) {
        failedSupersedes.push(ch.raw.id);
        warn(`failed to mark chapter ${ch.raw.id} superseded by arc ${arcEntry.id}: ${describeError(err)}`);
      }
    }
    if (failedSupersedes.length > 0) {
      cb?.onToast(userId, "warn", t("backend.pipeline.commitArc.theArcSavedButChapterCouldnT", { length: failedSupersedes.length }), automation);
    }
    recordDiagnostic(userId, { event: "commit", chatId, entryId: arcEntry.id, replacesEntryId, outcome: "success", entries: diagnosticEntries([{ raw: arcEntry, meta }]) });
    invalidateBookCache(userId, chatId);
    publishArcCreated(userId, {
      chatId,
      arcEntryId: arcEntry.id,
      bookId: book.id,
      sourceChapterEntryIds: selected.map((c) => c.raw.id),
      sourceMessageIds: msgIds,
      summaryText: finalArcContent,
      model: result.model,
      title: meta.title
    });
    cb?.onStateChange(userId, chatId);
    return arcEntry.id;
  });
}
function createVolumeFromArcs(chatId, ids, profile, settings, userId, opts = {}) {
  return createHigherFromEntries(3, chatId, ids, profile, settings, userId, opts);
}
async function createHigherFromEntries(tier, chatId, arcEntryIds, profile, settings, userId, opts = {}) {
  const kind = TIER_KINDS[tier - 1];
  if (!setBusy(userId, chatId, kind, t("backend.pipeline.createHigherFromEntries.memoriaIsBindingA", { kind })))
    return null;
  try {
    const entries = await listTimelineEntries(chatId, userId, true);
    const entriesForSelection = opts.replacesEntryId ? entries.filter((e) => e.raw.id !== opts.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(arcEntryIds);
    const arcs = coverage.activeEntries.filter((e) => e.meta.tier === tier - 1 && wanted.has(e.raw.id)).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (arcs.length !== wanted.size)
      throw changedSources();
    if (arcs.length === 0)
      return null;
    assertContiguousBinding(coverage.activeEntries, arcs);
    return await runVolume(chatId, profile, settings, userId, arcs, opts.replacesEntryId, tier, opts.automation);
  } finally {
    clearBusy(userId, chatId, kind);
  }
}
async function runVolume(chatId, profile, settings, userId, selected, replacesEntryId, tier = 3, automation = false) {
  const replacement = await captureReplacement(chatId, userId, replacesEntryId, selected.map((e) => e.raw.id));
  const kind = TIER_KINDS[tier - 1];
  const config = profile.higherTiers[tier];
  if (tier > 3)
    profile = { ...profile, volumeTargetUnit: config.targetUnit, volumeTargetPercent: config.targetPercent, volumeTargetTokens: config.targetTokens };
  nyaaToast(userId, "volume_fire", automation);
  recordDiagnostic(userId, { event: "context", chatId, mode: TIER_KINDS[tier - 1], replacesEntryId, flags: { automation, regeneration: !!replacesEntryId }, numbers: { selected: selected.length }, entries: diagnosticEntries(selected) });
  const totalTurns = selected.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, tier, userId);
  const opener = tierHeader(tier, provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, kind, controller);
    try {
      return await summarizeVolume(profile, settings.customPresets, chatId, selected, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, kind, chars, thinking),
        onDelta: (deltaKind, delta) => appendStreamText(userId, chatId, kind, deltaKind, delta)
      }, tier);
    } finally {
      aborters.delete(busyKey(userId, chatId, kind));
    }
  }, (n, err) => {
    recordDiagnostic(userId, { event: "retry", chatId, mode: TIER_KINDS[tier - 1], outcome: "failed", reason: diagnosticErrorReason(err), numbers: { attempt: n } });
    warn(`volume attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", false);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", t("backend.pipeline.runVolume.memoriaSetsThePenDown"));
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, kind, outcome.retries, outcome.err, { sourceEntryIds: selected.map((e) => e.raw.id), replacesEntryId });
    failToast(userId, kind, outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  if (replacement)
    replacementSources.set(result, replacement);
  const firstIdxs = selected.map((a) => a.meta.firstMsgIdx).filter((n) => typeof n === "number");
  const lastIdxs = selected.map((a) => a.meta.lastMsgIdx).filter((n) => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview(kind, selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitVolume(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, tier);
    nyaaToast(userId, "volume_success", false);
    return entryId;
  } catch (err) {
    warn(`commitVolume failed: ${describeError(err)}`);
    recordFailure(userId, chatId, kind, 0, err, { sourceEntryIds: selected.map((e) => e.raw.id), replacesEntryId });
    failToast(userId, kind, err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitVolume(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, tier = 3) {
  return withCommitMutex(userId, chatId, async () => {
    const freshEntries = await listTimelineEntries(chatId, userId, true);
    await assertReplacementActive(freshEntries, replacesEntryId, chatId, userId, result);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
    const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === tier - 1).map((e) => e.raw.id));
    const filtered = selected.filter((a) => stillActive.has(a.raw.id));
    if (filtered.length === 0) {
      throw new Error(t("backend.pipeline.commitVolume.allSourceArcsWereAlreadyBoundBy"));
    }
    if (filtered.length < selected.length) {
      throw changedSources();
    }
    const freshById = new Map(freshEntries.map((e) => [e.raw.id, e]));
    if (selected.some((e) => entrySource(e) !== entrySource(freshById.get(e.raw.id))))
      throw changedSources();
    selected = selected.map((e) => freshById.get(e.raw.id));
    const liveFirst = selected.flatMap((e) => e.meta.firstMsgIdx === undefined ? [] : [e.meta.firstMsgIdx]);
    const liveLast = selected.flatMap((e) => e.meta.lastMsgIdx === undefined ? [] : [e.meta.lastMsgIdx]);
    firstIdx = liveFirst.length ? Math.min(...liveFirst) : 0;
    lastIdx = liveLast.length ? Math.max(...liveLast) : firstIdx;
    const book = await ensureBookForChat(chatId, userId);
    assertContiguousBinding(freshCoverage.activeEntries, selected);
    const replacedVolume = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    const sceneNumber = typeof replacedVolume?.meta.sceneNumber === "number" ? replacedVolume.meta.sceneNumber : await nextSceneNumber(chatId, tier, userId);
    const msgIds = selected.flatMap((a) => a.meta.msgIds);
    const sourceArcEntryIds = selected.map((a) => a.raw.id);
    const isRootVolume = selected.length > 0 && selected.every((a) => a.meta.isRoot);
    const rootOrigin = isRootVolume ? selected.find((a) => a.meta.rootOrigin)?.meta.rootOrigin : undefined;
    if (!isRootVolume && selected.some((a) => a.meta.isRoot)) {
      const own = selected.filter((a) => !a.meta.isRoot);
      const fs = own.map((a) => a.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const ls = own.map((a) => a.meta.lastMsgIdx).filter((n) => typeof n === "number");
      if (fs.length)
        firstIdx = Math.min(...fs);
      else if (firstIdx < 0)
        firstIdx = 0;
      if (ls.length)
        lastIdx = Math.max(...ls);
      else if (lastIdx < firstIdx)
        lastIdx = firstIdx;
    }
    const volumeTitle = isRootVolume ? result.title?.trim() || t("backend.pipeline.volumeTitle.inheritedVolume") : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const meta = {
      tier,
      chatId,
      msgIds,
      sourceChapterEntryIds: sourceArcEntryIds,
      firstMsgIdx: firstIdx,
      lastMsgIdx: lastIdx,
      tokenCountInput: selected.reduce((a, e) => a + approximateTokensFromChars(e.raw.content.length), 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title: volumeTitle,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...isRootVolume ? { isRoot: true, rootOrigin } : {}
    };
    const baseComment = meta.title ?? t("backend.pipeline.baseComment.volumeMsgs", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 });
    const comment = `${isRootVolume ? "[Root] " : ""}${TIER_NAMES[tier - 1]} #${sceneNumber} - ${baseComment}`;
    const volumeOpener = tierHeader(tier, sceneNumber, sourceArcEntryIds.length, msgIds.length);
    const finalVolumeContent = `${volumeOpener}

${result.content}`;
    const volumeEntry = await createChapterEntry(book.id, meta, finalVolumeContent, comment, userId, result.keywords ?? [], false, replacedVolume);
    const failedSupersedes = [];
    for (const arc of selected) {
      try {
        await patchEntryMeta(arc, { supersededByEntryId: volumeEntry.id }, userId);
      } catch (err) {
        failedSupersedes.push(arc.raw.id);
        warn(`failed to mark arc ${arc.raw.id} superseded by volume ${volumeEntry.id}: ${describeError(err)}`);
      }
    }
    if (failedSupersedes.length > 0) {
      cb?.onToast(userId, "warn", t("backend.pipeline.commitVolume.theVolumeSavedButArcCouldnT", { length: failedSupersedes.length }));
    }
    recordDiagnostic(userId, { event: "commit", chatId, entryId: volumeEntry.id, replacesEntryId, outcome: "success", entries: diagnosticEntries([{ raw: volumeEntry, meta }]) });
    invalidateBookCache(userId, chatId);
    if (tier === 3)
      publishVolumeCreated(userId, {
        chatId,
        volumeEntryId: volumeEntry.id,
        bookId: book.id,
        sourceArcEntryIds,
        sourceMessageIds: msgIds,
        summaryText: finalVolumeContent,
        model: result.model,
        title: meta.title
      });
    cb?.onStateChange(userId, chatId);
    return volumeEntry.id;
  });
}
async function acceptPreview(chatId, draftId, profile, userId) {
  const preview = findPendingPreview(userId, chatId, draftId);
  if (!preview)
    return null;
  const guardKey = `${userId}::${chatId}::${draftId}`;
  if (committingDrafts.has(guardKey))
    return null;
  committingDrafts.add(guardKey);
  try {
    if (preview.kind === "chapter") {
      const messages = await spindle.chat.getMessages(chatId);
      const acceptEntries = preview.replacesEntryId ? (await listLmbEntries(chatId, userId, true)).filter((e) => e.raw.id !== preview.replacesEntryId) : await listLmbEntries(chatId, userId, true);
      const coverage = await buildCoverage(chatId, userId, acceptEntries, extraContextActive(profile));
      const intent = new Set(preview.sourceMessageIds);
      const window = messages.filter((m) => intent.has(m.id) && !coverage.coveredBy.has(m.id) && !isExcluded(m));
      const sources = previewSources.get(preview);
      if (window.length !== preview.sourceMessageIds.length || !sources || window.some((m, i) => m.id !== preview.sourceMessageIds[i] || messageSource(m) !== sources[i])) {
        cb?.onToast(userId, "warn", changedSources().message);
        cb?.onStateChange(userId, chatId);
        return null;
      }
      const firstIdx = window[0].index_in_chat;
      const lastIdx = window[window.length - 1].index_in_chat;
      const fakeResult = {
        rawOutput: preview.content,
        title: preview.title,
        opener: "",
        content: preview.content,
        keywords: preview.keywords ?? [],
        shortComment: preview.shortComment,
        usagePromptTokens: preview.tokenCountInput,
        usageCompletionTokens: preview.tokenCountOutput,
        model: preview.model,
        connectionId: preview.connectionId,
        presetKey: preview.presetKey
      };
      copyReplacement(preview, fakeResult);
      try {
        const entryId = await commitChapter(chatId, profile, userId, window, fakeResult, firstIdx, lastIdx, messages, true, preview.replacesEntryId);
        dropPendingPreview(userId, chatId, draftId);
        nyaaToast(userId, "success", false);
        cb?.onStateChange(userId, chatId);
        return entryId;
      } catch (err) {
        recordFailure(userId, chatId, "chapter", 0, err, { sourceMessageIds: preview.sourceMessageIds, replacesEntryId: preview.replacesEntryId });
        failToast(userId, "chapter", err);
        cb?.onStateChange(userId, chatId);
        return null;
      }
    }
    const targetTier = TIER_KINDS.indexOf(preview.kind) + 1;
    const isVolume = targetTier >= 3;
    const entries = await listTimelineEntries(chatId, userId, true);
    const groupSelectionEntries = preview.replacesEntryId ? entries.filter((e) => e.raw.id !== preview.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, groupSelectionEntries);
    const wanted = new Set(preview.sourceChapterEntryIds ?? []);
    const sourceTier = targetTier - 1;
    const activeById = new Map(coverage.activeEntries.filter((e) => e.meta.tier === sourceTier).map((e) => [e.raw.id, e]));
    const selected = [...wanted].flatMap((id) => activeById.has(id) ? [activeById.get(id)] : []);
    const sources = previewSources.get(preview);
    if (selected.length !== wanted.size || !sources || selected.some((e, i) => entrySource(e) !== sources[i])) {
      cb?.onToast(userId, "warn", changedSources().message);
      cb?.onStateChange(userId, chatId);
      return null;
    }
    const fakeResult = {
      rawOutput: preview.content,
      title: preview.title,
      opener: "",
      content: preview.content,
      keywords: preview.keywords ?? [],
      shortComment: preview.shortComment,
      usagePromptTokens: preview.tokenCountInput,
      usageCompletionTokens: preview.tokenCountOutput,
      model: preview.model,
      connectionId: preview.connectionId,
      presetKey: preview.presetKey
    };
    copyReplacement(preview, fakeResult);
    try {
      const entryId = isVolume ? await commitVolume(chatId, userId, selected, fakeResult, preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId, targetTier) : await commitArc(chatId, userId, selected, fakeResult, preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId);
      dropPendingPreview(userId, chatId, draftId);
      clearLastFailure(userId, chatId);
      nyaaToast(userId, isVolume ? "volume_success" : "arc_success", false);
      cb?.onStateChange(userId, chatId);
      return entryId;
    } catch (err) {
      recordFailure(userId, chatId, preview.kind, 0, err, {
        sourceEntryIds: selected.map((e) => e.raw.id),
        replacesEntryId: preview.replacesEntryId
      });
      failToast(userId, preview.kind, err);
      cb?.onStateChange(userId, chatId);
      return null;
    }
  } finally {
    committingDrafts.delete(guardKey);
  }
}
var CHAPTER_BACKLOG_CAP = 500;
async function drainChapterBacklog(chatId, profile, settings, userId, automation = false, ghost = false) {
  let made = 0;
  for (let i = 0;i < CHAPTER_BACKLOG_CAP; i++) {
    const created = await createChapterAuto(chatId, profile, settings, userId, automation, ghost).catch((err) => {
      warn(`${ghost ? "ghost " : ""}createChapterAuto failed: ${describeError(err)}`);
      return null;
    });
    if (!created)
      break;
    made++;
  }
  return made;
}
function drainGhostBacklog(chatId, profile, settings, userId, automation = false) {
  return drainChapterBacklog(chatId, profile, settings, userId, automation, true);
}
async function dryRunChapter(chatId, profile, settings, userId) {
  const messages = await spindle.chat.getMessages(chatId);
  if (!messages || messages.length === 0)
    throw new Error(t("backend.pipeline.dryRunChapter.chatHasNoMessages"));
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, extraContextActive(profile));
  const window = selectUncoveredChapterWindow(messages, coverage, profile, true);
  if (window.length === 0) {
    throw new Error(t("backend.pipeline.dryRunChapter.noWindowAvailableLowerTheLagOr"));
  }
  const previousMemories = selectPreviousChapters(coverage, messages, window, profile.previousMemoriesCount);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);
  return assembleChapterPrompt(profile, settings.customPresets, chatId, window, previousMemories, userId, opener);
}
async function dryRunArc(chatId, profile, settings, userId) {
  const entries = await listTimelineEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const chapters = summaryRuns(coverage.activeEntries, 1)[0]?.entries ?? [];
  if (chapters.length === 0)
    throw new Error(t("backend.pipeline.dryRunArc.noChaptersToBindYet"));
  const totalTurns = chapters.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, chapters.length, totalTurns);
  return assembleArcPrompt(profile, settings.customPresets, chatId, chapters, userId, opener);
}
async function dryRunVolume(chatId, profile, settings, userId, tier = 3) {
  const entries = await listTimelineEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const arcs = summaryRuns(coverage.activeEntries, tier - 1)[0]?.entries ?? [];
  if (arcs.length === 0)
    throw new Error(tier === 3 ? t("backend.pipeline.dryRunVolume.noArcsToPressYet") : t("backend.pipeline.dryRunVolume.noSources", { name: TIER_NAMES[tier - 2] }));
  const totalTurns = arcs.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, tier, userId);
  const opener = tierHeader(tier, provisionalSceneNumber, arcs.length, totalTurns);
  if (tier > 3) {
    const config = profile.higherTiers[tier];
    profile = { ...profile, volumeTargetUnit: config.targetUnit, volumeTargetPercent: config.targetPercent, volumeTargetTokens: config.targetTokens };
  }
  return assembleVolumePrompt(profile, settings.customPresets, chatId, arcs, userId, opener, tier);
}
async function drainArcBacklog(chatId, profile, settings, userId, automation = false) {
  return drainSummaryBacklog(2, chatId, profile, settings, userId, automation);
}
async function sweepStaleGhosts(chatId, userId) {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    const ghosts = entries.filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled);
    if (ghosts.length === 0)
      return 0;
    const messages = await spindle.chat.getMessages(chatId);
    const byId = new Map(messages.map((m) => [m.id, m]));
    let dropped = 0;
    for (const g of ghosts) {
      if (!ghostSourcesChanged(g, byId))
        continue;
      try {
        await deleteEntry(g.raw.id, userId);
        recordDiagnostic(userId, { event: "ghost", chatId, entryId: g.raw.id, outcome: "removed", reason: "stale" });
        if (typeof g.meta.sceneNumber === "number") {
          recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
        }
        dropped++;
      } catch (err) {
        warn(`ghost sweep: failed to delete stale ghost ${g.raw.id}: ${describeError(err)}`);
      }
    }
    if (dropped > 0) {
      invalidateBookCache(userId, chatId);
      cb?.onStateChange(userId, chatId);
    }
    return dropped;
  });
}
function ghostSourcesChanged(ghost, messages) {
  const sigs = ghost.meta.msgSigs;
  const haveSigs = sigs?.length === ghost.meta.msgIds.length;
  return ghost.meta.msgIds.some((id, i) => {
    const message = messages.get(id);
    return !message || isExcluded(message) || haveSigs && messageSource(message) !== sigs[i];
  });
}
async function promoteGhostChapters(chatId, profile, userId, automation = false) {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    const ghosts = entries.filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (ghosts.length === 0)
      return 0;
    const messages = await spindle.chat.getMessages(chatId);
    const byId = new Map(messages.map((m) => [m.id, m]));
    const realCoverage = await buildCoverage(chatId, userId, entries);
    const posById = new Map(messages.map((m, i) => [m.id, i]));
    const pastLagBoundary = trimLagFromTail(messages, profile).length;
    const promoted = [];
    let zombies = 0;
    for (const g of ghosts) {
      if (g.meta.msgIds.length === 0)
        continue;
      const stale = ghostSourcesChanged(g, byId);
      if (stale || g.meta.msgIds.some((id) => realCoverage.coveredBy.has(id))) {
        try {
          await deleteEntry(g.raw.id, userId);
          recordDiagnostic(userId, { event: "ghost", chatId, entryId: g.raw.id, outcome: "removed", reason: stale ? "stale" : "coverage_changed" });
          if (typeof g.meta.sceneNumber === "number") {
            recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
          }
          zombies++;
        } catch (err) {
          warn(`ghost promotion: failed to delete invalid ghost ${g.raw.id}: ${describeError(err)}`);
        }
        continue;
      }
      const pastLag = g.meta.msgIds.every((id) => {
        const p = posById.get(id);
        return typeof p === "number" && p < pastLagBoundary;
      });
      if (!pastLag)
        continue;
      try {
        await promoteGhostEntry(g, userId);
        for (const id of g.meta.msgIds)
          realCoverage.coveredBy.set(id, g.raw.id);
        recordDiagnostic(userId, { event: "ghost", chatId, entryId: g.raw.id, outcome: "success", numbers: { lag: profile.lagValue, sourceCount: g.meta.msgIds.length } });
        promoted.push(g);
      } catch (err) {
        warn(`ghost promotion failed for ${g.raw.id}: ${describeError(err)}`);
      }
    }
    if (zombies > 0) {
      invalidateBookCache(userId, chatId);
      if (promoted.length === 0)
        cb?.onStateChange(userId, chatId);
    }
    if (promoted.length === 0)
      return 0;
    invalidateBookCache(userId, chatId);
    if (profile.hideCoveredMessages) {
      const coveredBy = new Map;
      for (const g of promoted) {
        for (const id of g.meta.msgIds)
          coveredBy.set(id, g.raw.id);
      }
      await syncHiddenForCoveredMessages(chatId, messages, { coveredBy, activeEntries: [], volumes: [], arcs: [], chapters: [] }, userId, true).catch((err) => warn(`ghost promotion hide failed: ${describeError(err)}`));
    }
    for (const g of promoted) {
      publishChapterCreated(userId, {
        chatId,
        chapterEntryId: g.raw.id,
        bookId: g.raw.world_book_id,
        sourceMessageIds: g.meta.msgIds,
        summaryText: g.raw.content || "",
        model: g.meta.model,
        title: g.meta.title
      });
    }
    cb?.onToast(userId, "success", t("backend.pipeline.promoteGhostChapters.memoriaShelvedGhostChapter", { length: promoted.length }), automation);
    cb?.onStateChange(userId, chatId);
    return promoted.length;
  });
}
async function cleanupGhostsAfterModeOff(chatId, profile, userId) {
  const entries = await listLmbEntries(chatId, userId);
  if (!entries.some((e) => e.meta.tier === 1 && e.meta.ghost === true))
    return;
  await sweepStaleGhosts(chatId, userId).catch((err) => warn(`mode-off ghost sweep failed: ${describeError(err)}`));
  await promoteGhostChapters(chatId, profile, userId, true).catch((err) => warn(`mode-off ghost promotion failed: ${describeError(err)}`));
  await withCommitMutex(userId, chatId, async () => {
    const remaining = (await listLmbEntries(chatId, userId)).filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled);
    for (const g of remaining) {
      await deleteEntry(g.raw.id, userId).catch((err) => warn(`mode-off ghost cleanup failed for ${g.raw.id}: ${describeError(err)}`));
    }
    if (remaining.length > 0) {
      invalidateBookCache(userId, chatId);
      cb?.onStateChange(userId, chatId);
    }
  });
}
async function maybeRunPipeline(chatId, profile, settings, userId) {
  if (extraContextActive(profile)) {
    await sweepStaleGhosts(chatId, userId).catch((err) => warn(`ghost sweep failed: ${describeError(err)}`));
    await promoteGhostChapters(chatId, profile, userId, true).catch((err) => warn(`ghost promotion failed: ${describeError(err)}`));
  } else {
    await cleanupGhostsAfterModeOff(chatId, profile, userId).catch((err) => warn(`ghost cleanup failed: ${describeError(err)}`));
  }
  if (!profile.autoCreate)
    return;
  await ensureForkAdoption(chatId, userId).catch(() => {});
  if (await forkShelfPending(chatId, userId).catch(() => false))
    return;
  if (profile.autoCreateChapter) {
    if (extraContextActive(profile)) {
      await drainGhostBacklog(chatId, profile, settings, userId, true);
    } else {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
    }
  }
  await maybeRunArcCheck(chatId, profile, settings, userId, true);
}
async function maybeRunArcCheck(chatId, profile, settings, userId, automation = false) {
  if (!profile.autoCreate)
    return;
  if (profile.autoCreateArc && profile.arcTrigger !== "manual") {
    await drainArcBacklog(chatId, profile, settings, userId, automation);
  }
  for (const tier of HIGHER_TIERS) {
    if (profile.higherTiers[tier].enabled)
      await drainHigherBacklog(tier, chatId, profile, settings, userId, automation);
  }
}
async function nextSceneNumber(chatId, tier, userId) {
  const entries = await listLmbEntries(chatId, userId).catch(() => []);
  let max = 0;
  for (const e of entries) {
    if (e.meta.tier !== tier)
      continue;
    if (e.meta.isRoot)
      continue;
    const n = e.meta.sceneNumber;
    if (typeof n === "number" && n > max)
      max = n;
  }
  return max + 1;
}
function deriveTitle(result, firstMsg, lastMsg) {
  if (result.title && result.title.trim())
    return t("backend.pipeline.deriveTitle.msgs", { trim: result.title.trim(), firstMsg, lastMsg });
  const firstLine = (result.content.split(/\n+/, 1)[0] || "").trim();
  const firstSentence = firstLine.split(/(?<=[.!?])\s/, 1)[0] || firstLine;
  const trimmed = firstSentence.slice(0, 60).trim();
  if (trimmed)
    return t("backend.pipeline.deriveTitle.msgs2", { trimmed, choice: trimmed.length === 60 ? "yes" : "no", firstMsg, lastMsg });
  return t("backend.pipeline.deriveTitle.compressedMsgs", { firstMsg, lastMsg });
}
function makePreview(kind, chatId, window, result, firstIdx, lastIdx, replacesEntryId) {
  const preview = {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || t("backend.pipeline.preview.chapterMsgs", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 }),
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: window.map((m) => m.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId
  };
  previewSources.set(preview, window.map(messageSource));
  copyReplacement(result, preview);
  return preview;
}
function makeGroupPreview(kind, selected, result, firstIdx, lastIdx, replacesEntryId) {
  const preview = {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || t("backend.pipeline.preview.msgs", { indexOf: TIER_NAMES[TIER_KINDS.indexOf(kind)], firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 }),
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: selected.flatMap((c) => c.meta.msgIds),
    sourceChapterEntryIds: selected.map((c) => c.raw.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId
  };
  previewSources.set(preview, selected.map(entrySource));
  copyReplacement(result, preview);
  return preview;
}
async function drainHigherBacklog(tier, chatId, profile, settings, userId, automation = false) {
  return drainSummaryBacklog(tier, chatId, profile, settings, userId, automation);
}
async function createSummaryAuto(tier, chatId, profile, settings, userId, automation, closedOnly = false) {
  if (getPendingPreviews(userId, chatId).some((p) => p.kind === TIER_KINDS[tier - 1]))
    return null;
  const coverage = await buildCoverage(chatId, userId, await listTimelineEntries(chatId, userId));
  const sourceTier = tier - 1;
  const batch = selectBindingBatch(coverage.activeEntries, sourceTier, summaryBindingRule(profile, tier), closedOnly);
  if (!batch.length)
    return null;
  const ids = batch.map((e) => e.raw.id);
  return tier === 2 ? createArcFromChapters(chatId, ids, profile, settings, userId, { automation }) : createHigherFromEntries(tier, chatId, ids, profile, settings, userId, { automation });
}
async function drainSummaryBacklog(tier, chatId, profile, settings, userId, automation, closedOnly = false) {
  let made = 0;
  for (let i = 0;i < 100; i++) {
    const created = await createSummaryAuto(tier, chatId, profile, settings, userId, automation, closedOnly);
    if (!created)
      break;
    made++;
  }
  return made;
}
async function repairSummaryTimeline(chatId, profile, settings, userId) {
  let made = 0;
  for (const tier of [2, ...HIGHER_TIERS]) {
    const before = getLastFailure(userId, chatId);
    made += await drainSummaryBacklog(tier, chatId, profile, settings, userId, true, true);
    const failure = getLastFailure(userId, chatId);
    if (failure && failure !== before)
      break;
  }
  return made;
}
var summaryResumes = new Map;
function resumeSummaryBinding(chatId, userId) {
  const key = `${userId}::${chatId}`;
  const running = summaryResumes.get(key);
  if (running)
    return running;
  const run = (async () => {
    const settings = await loadSettings(userId);
    if (!settings.enabled)
      return;
    const rawProfile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    if (!rawProfile)
      return;
    const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
    await ensureForkAdoption(chatId, userId);
    if (await forkShelfPending(chatId, userId))
      return;
    if (getBusy(userId).some((entry) => entry.chatId === chatId))
      return;
    const before = getLastFailure(userId, chatId);
    await repairSummaryTimeline(chatId, profile, settings, userId);
    const failure = getLastFailure(userId, chatId);
    if (failure && failure !== before)
      return;
    await maybeRunArcCheck(chatId, profile, settings, userId, true);
  })().finally(() => summaryResumes.delete(key));
  summaryResumes.set(key, run);
  return run;
}

// src/backend/fork.ts
var FORK_ADOPTED_FLAG = "lumibooks_fork_adopted";
var CODEX_ADOPTED_FLAG = "lumibooks_codex_fork_adopted";
var MAX_ANCESTRY_HOPS = 100;
var checked = new Set;
var inflight3 = new Map;
var retryAt = new Map;
var RETRY_BACKOFF_MS = 30000;
var forkAnomalyCb = null;
function registerForkAnomalyCallback(cb) {
  forkAnomalyCb = cb;
}
function key(userId, chatId) {
  return `${userId}::${chatId}`;
}
async function inheritedMessageIds(ancestorId, forkId, userId) {
  let currentId = forkId;
  let currentMessages = await spindle.chat.getMessages(currentId);
  let mapped = new Map(currentMessages.map((m) => [m.id, m.id]));
  const seen = new Set;
  while (currentId !== ancestorId) {
    if (seen.has(currentId) || seen.size >= MAX_ANCESTRY_HOPS)
      throw new Error(t("backend.fork.inheritedMessageIds.forkAncestryCouldNotBeResolved"));
    seen.add(currentId);
    const chat = await spindle.chats.get(currentId, userId);
    const metadata = chat?.metadata;
    const parentId = metadata?.["branched_from"];
    const branchAt = metadata?.["branch_at_message"];
    if (typeof parentId !== "string")
      throw new Error(t("backend.fork.inheritedMessageIds.forkAncestryIsIncomplete"));
    const parentMessages = await spindle.chat.getMessages(parentId);
    const boundary = parentMessages.find((m) => m.id === branchAt)?.index_in_chat;
    if (boundary === undefined)
      return new Map;
    const parentByIndex = new Map(parentMessages.map((m) => [m.index_in_chat, m]));
    const next = new Map;
    for (const message of currentMessages) {
      if (message.index_in_chat > boundary)
        continue;
      const targetId = mapped.get(message.id);
      const source = parentByIndex.get(message.index_in_chat);
      if (targetId && source && source.role === message.role && source.content === message.content)
        next.set(source.id, targetId);
    }
    mapped = next;
    currentId = parentId;
    currentMessages = parentMessages;
  }
  return mapped;
}
async function ensureForkAdoption(chatId, userId) {
  const k = key(userId, chatId);
  if (checked.has(k))
    return;
  const nextTry = retryAt.get(k);
  if (nextTry && Date.now() < nextTry)
    return;
  const existing = inflight3.get(k);
  if (existing)
    return existing;
  const p = (async () => {
    try {
      const settled = await doForkAdoption(chatId, userId);
      if (settled) {
        if (checked.size > 5000)
          checked.clear();
        checked.add(k);
        retryAt.delete(k);
      } else {
        if (retryAt.size > 1000)
          retryAt.clear();
        retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      }
    } catch (err) {
      if (retryAt.size > 1000)
        retryAt.clear();
      retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      recordDiagnostic(userId, { event: "fork", chatId, outcome: "failed", reason: "adoption" });
      warn(`fork adoption failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    } finally {
      inflight3.delete(k);
    }
  })();
  inflight3.set(k, p);
  return p;
}
async function forkShelfPending(chatId, userId) {
  if (checked.has(key(userId, chatId)))
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || typeof md["branched_from"] !== "string")
    return false;
  const flag = md[FORK_ADOPTED_FLAG];
  if (flag === chatId)
    return false;
  if (flag === true) {
    return await findBookForChat(chatId, userId).catch(() => null) === null;
  }
  return true;
}
async function requireForkShelf(chatId, userId) {
  await ensureForkAdoption(chatId, userId);
  if (await forkShelfPending(chatId, userId))
    throw new Error(t("backend.fork.requireForkShelf.forkInheritanceIsStillPendingRetryAfter"));
}
async function forkCodexPending(chatId, userId) {
  if (checked.has(key(userId, chatId)))
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || typeof md["branched_from"] !== "string")
    return false;
  const flag = md[CODEX_ADOPTED_FLAG];
  if (flag === chatId)
    return false;
  if (flag === true) {
    return await codexPresence(chatId, userId).catch(() => "absent") !== "present";
  }
  return true;
}
async function doForkAdoption(forkChatId, userId) {
  const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
  if (!chat)
    return false;
  const meta = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const branchedFrom = meta && typeof meta["branched_from"] === "string" ? meta["branched_from"] : null;
  if (!branchedFrom)
    return true;
  recordDiagnostic(userId, { event: "fork", chatId: forkChatId, relatedChatId: branchedFrom, outcome: "started", reason: "adoption" });
  let shelfSettled = true;
  if (meta?.[FORK_ADOPTED_FLAG] !== forkChatId) {
    const owned = await findBookForChat(forkChatId, userId).catch(() => null);
    if (!owned) {
      const ancestor = await findAncestorBook(branchedFrom, userId);
      if (ancestor === "fault") {
        shelfSettled = false;
      } else if (ancestor) {
        try {
          await cloneShelfForFork(forkChatId, chat.name ?? null, ancestor.chatId, userId);
        } catch (err) {
          shelfSettled = false;
          warn(`fork shelf adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
          forkAnomalyCb?.(userId, t("backend.fork.doForkAdoption.memoriaCouldnTCarryTheShelfInto", { shortErrorText: shortErrorText(err) }));
        }
      } else {
        await markShelfAdopted(forkChatId, userId).catch(() => {});
      }
    } else {
      await markShelfAdopted(forkChatId, userId).catch(() => {});
    }
  }
  const codexSettled = await adoptForkCodex(forkChatId, branchedFrom, userId);
  recordDiagnostic(userId, { event: "fork", chatId: forkChatId, relatedChatId: branchedFrom, outcome: shelfSettled && codexSettled ? "success" : "pending", reason: "adoption" });
  return shelfSettled && codexSettled;
}
async function adoptForkCodex(forkChatId, branchedFrom, userId) {
  try {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return false;
    const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
    const flag = md?.[CODEX_ADOPTED_FLAG];
    if (flag === forkChatId)
      return true;
    if (flag === true && await codexPresence(forkChatId, userId) === "present") {
      await markCodexAdopted(forkChatId, userId);
      return true;
    }
    const attached = Array.isArray(md?.["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    for (const bookId of attached) {
      const book = await spindle.world_books.get(bookId, userId);
      if (!book)
        continue;
      const tag = codexBookChatTag(book);
      if (tag && tag !== forkChatId) {
        await unbindBookFromChat(forkChatId, bookId, userId);
      }
    }
    let ancestorChatId = null;
    {
      const seen = new Set;
      let cur = branchedFrom;
      let hops = 0;
      while (cur && hops < MAX_ANCESTRY_HOPS) {
        const cid = cur;
        if (seen.has(cid))
          break;
        seen.add(cid);
        hops++;
        if (await codexPresence(cid, userId) === "present") {
          ancestorChatId = cid;
          break;
        }
        const ancChat = await spindle.chats.get(cid, userId).catch(() => null);
        const ancMeta = ancChat && ancChat.metadata && typeof ancChat.metadata === "object" ? ancChat.metadata : null;
        cur = ancMeta && typeof ancMeta["branched_from"] === "string" ? ancMeta["branched_from"] : null;
      }
    }
    if (!ancestorChatId) {
      await markCodexAdopted(forkChatId, userId);
      return true;
    }
    if (getBusy(userId).some((b) => b.kind === "codex" && (b.chatId === ancestorChatId || b.chatId === forkChatId))) {
      return false;
    }
    const [forkMsgs, inheritedIds] = await Promise.all([
      spindle.chat.getMessages(forkChatId),
      inheritedMessageIds(ancestorChatId, forkChatId, userId)
    ]);
    const remapToFork = (ancestorMsgId) => inheritedIds.get(ancestorMsgId) ?? null;
    let forkTip = null;
    let tipIdx = -1;
    for (const m of forkMsgs) {
      if (m.index_in_chat > tipIdx) {
        tipIdx = m.index_in_chat;
        forkTip = m.id;
      }
    }
    const inherited = await inheritCodex(ancestorChatId, forkChatId, userId, remapToFork, forkTip);
    await syncCodexEntries(forkChatId, userId);
    if (inherited) {
      info(`fork adoption: inherited codex from ${ancestorChatId.slice(0, 8)} into ${forkChatId.slice(0, 8)}`);
    }
    await markCodexAdopted(forkChatId, userId);
    return true;
  } catch (err) {
    warn(`fork codex adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
    forkAnomalyCb?.(userId, t("backend.fork.adoptForkCodex.memoriaCouldnTCarryTheCodexInto", { shortErrorText: shortErrorText(err) }));
    return false;
  }
}
async function markShelfAdopted(forkChatId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return;
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    if (md[FORK_ADOPTED_FLAG] === forkChatId)
      return;
    md[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}
async function markCodexAdopted(forkChatId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      throw new Error(t("backend.fork.markCodexAdopted.forkChatVanishedWhileRecordingCodexAdoption"));
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    if (md[CODEX_ADOPTED_FLAG] === forkChatId)
      return;
    md[CODEX_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}
async function findAncestorBook(startChatId, userId) {
  const seen = new Set;
  let cur = startChatId;
  let hops = 0;
  while (cur && hops < MAX_ANCESTRY_HOPS) {
    const chatId = cur;
    if (seen.has(chatId))
      break;
    seen.add(chatId);
    hops++;
    let bookId;
    try {
      bookId = await findBookForChat(chatId, userId);
    } catch {
      return "fault";
    }
    if (bookId)
      return { chatId, bookId };
    let chat;
    try {
      chat = await spindle.chats.get(chatId, userId);
    } catch {
      return "fault";
    }
    const meta = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
    cur = meta && typeof meta["branched_from"] === "string" ? meta["branched_from"] : null;
  }
  return null;
}
async function cloneShelfForFork(forkChatId, forkChatName, parentChatId, userId) {
  const parentEntries = await listLmbEntries(parentChatId, userId);
  const [forkMsgs, inheritedIds] = await Promise.all([
    spindle.chat.getMessages(forkChatId),
    inheritedMessageIds(parentChatId, forkChatId, userId)
  ]);
  const forkIdxById = new Map(forkMsgs.map((m) => [m.id, m.index_in_chat]));
  const remap = (msgIds) => {
    const ids = [];
    let first = Number.POSITIVE_INFINITY;
    let last = -1;
    for (const id of msgIds) {
      const forkId = inheritedIds.get(id);
      if (forkId === undefined)
        continue;
      const idx = forkIdxById.get(forkId);
      if (idx === undefined)
        continue;
      ids.push(forkId);
      if (idx < first)
        first = idx;
      if (idx > last)
        last = idx;
    }
    return {
      ids,
      first: first === Number.POSITIVE_INFINITY ? undefined : first,
      last: last === -1 ? undefined : last
    };
  };
  const forkTransform = (entry, ctx) => {
    if (entry.meta.ghost) {
      recordDiagnostic(userId, { event: "fork", chatId: forkChatId, relatedChatId: parentChatId, entryId: entry.raw.id, mode: "ghost", outcome: "skipped" });
      return null;
    }
    if (entry.meta.isRoot) {
      return {
        msgIds: entry.meta.msgIds.slice(),
        firstMsgIdx: entry.meta.firstMsgIdx,
        lastMsgIdx: entry.meta.lastMsgIdx,
        extra: { chatId: forkChatId }
      };
    }
    const { ids, first, last } = remap(entry.meta.msgIds);
    if (ids.length !== entry.meta.msgIds.length) {
      recordDiagnostic(userId, { event: "fork", chatId: forkChatId, relatedChatId: parentChatId, entryId: entry.raw.id, outcome: "skipped", reason: "missing", numbers: { sourceCount: entry.meta.msgIds.length, selected: ids.length } });
      return null;
    }
    if (entry.meta.tier === 1) {
      if (ids.length === 0)
        return null;
      return { msgIds: ids, firstMsgIdx: first, lastMsgIdx: last, extra: { chatId: forkChatId } };
    }
    const survived = (entry.meta.sourceChapterEntryIds ?? []).map((oldId) => ctx.idMap.get(oldId)).filter((x) => typeof x === "string");
    if (survived.length !== (entry.meta.sourceChapterEntryIds ?? []).length)
      return null;
    if (ids.length === 0 && survived.length === 0)
      return null;
    let firstIdx = first;
    let lastIdx = last;
    if (firstIdx === undefined || lastIdx === undefined) {
      for (const oldId of entry.meta.sourceChapterEntryIds ?? []) {
        const cm = ctx.clonedMeta.get(oldId);
        if (!cm)
          continue;
        if (cm.firstMsgIdx !== undefined)
          firstIdx = firstIdx === undefined ? cm.firstMsgIdx : Math.min(firstIdx, cm.firstMsgIdx);
        if (cm.lastMsgIdx !== undefined)
          lastIdx = lastIdx === undefined ? cm.lastMsgIdx : Math.max(lastIdx, cm.lastMsgIdx);
      }
    }
    return { msgIds: ids, firstMsgIdx: firstIdx, lastMsgIdx: lastIdx, extra: { chatId: forkChatId } };
  };
  const newBook = await spindle.world_books.create({
    name: bookNameFor(forkChatName, forkChatId),
    description: t("backend.fork.newBook.memoriaSShelfForThisChatChapters"),
    metadata: {
      lumibooks_chat_id: forkChatId,
      lumibooks_created_at: Date.now(),
      lumibooks_forked_from: parentChatId
    }
  }, userId);
  let cloned = 0;
  try {
    const idMap = await copyLmbEntries(newBook.id, parentEntries, userId, forkTransform);
    cloned = idMap.size;
    recordDiagnostic(userId, {
      event: "fork",
      chatId: forkChatId,
      relatedChatId: parentChatId,
      outcome: "success",
      numbers: { sourceCount: parentEntries.length, selected: cloned },
      messages: forkMsgs.map((m, position) => ({ id: m.id, index: m.index_in_chat, position })),
      entries: parentEntries.flatMap((e) => {
        const id = idMap.get(e.raw.id);
        return id ? [{ id, tier: e.meta.tier, sources: [e.raw.id], sourceEntryCount: 1, sourceCount: e.meta.msgIds.length }] : [];
      })
    });
    await rebindForkShelf(forkChatId, newBook.id, userId);
  } catch (err) {
    await spindle.world_books.delete(newBook.id, userId).catch(() => {});
    throw err;
  }
  invalidateBookCache(userId, forkChatId);
  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    await resyncVisibility(forkChatId, userId, desiredHidden);
  } catch (err) {
    warn(`fork adoption: visibility resync failed: ${describeError(err)}`);
  }
  info(`adopted fork ${forkChatId.slice(0, 8)} from ${parentChatId.slice(0, 8)} (${cloned} entries cloned)`);
}
async function rebindForkShelf(forkChatId, newBookId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return;
    const metadata = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    const inheritedBookId = typeof metadata["lumibooks_book_id"] === "string" ? metadata["lumibooks_book_id"] : null;
    const existing = Array.isArray(metadata["chat_world_book_ids"]) ? metadata["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const nextBookIds = existing.filter((id) => id !== inheritedBookId && id !== newBookId);
    nextBookIds.push(newBookId);
    metadata["chat_world_book_ids"] = nextBookIds;
    metadata["lumibooks_book_id"] = newBookId;
    metadata[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata }, userId);
  });
}

// src/backend/summary-matching.ts
var encoder2 = new TextEncoder;
async function sha256(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder2.encode(text)));
  return Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}
async function hashRawMessages(messages, progress) {
  const hashes = [];
  for (let offset = 0;offset < messages.length; offset += 64) {
    hashes.push(...await Promise.all(messages.slice(offset, offset + 64).map((m) => sha256(JSON.stringify([m.role, m.content])))));
    progress?.(hashes.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return hashes;
}
async function makeFingerprint(messages) {
  return { version: 1, algorithm: "sha256-role-content-v1", contentHash: await sha256(JSON.stringify(messages)), messages };
}
async function parseFingerprint(raw) {
  if (raw === undefined)
    return null;
  const v = raw;
  if (!v || v.version !== 1 || v.algorithm !== "sha256-role-content-v1" || !Array.isArray(v.messages) || v.messages.length > 1e6 || !/^[a-f0-9]{64}$/.test(v.contentHash))
    throw new Error(t("backend.summaryMatching.parseFingerprint.invalidSummaryMessageFingerprint"));
  let previous = -1;
  for (const m of v.messages) {
    if (!m || !Number.isSafeInteger(m.index) || m.index <= previous || !/^[a-f0-9]{64}$/.test(m.hash))
      throw new Error(t("backend.summaryMatching.parseFingerprint.invalidSummaryMessageFingerprint"));
    previous = m.index;
  }
  if ((await makeFingerprint(v.messages)).contentHash !== v.contentHash)
    throw new Error(t("backend.summaryMatching.parseFingerprint.theSummaryMessageFingerprintIsDamaged"));
  return v;
}
function exactMessageMatch(source, hashes) {
  return source.messages.every((m) => hashes[m.index] === m.hash) ? source.messages.map((m) => m.index) : null;
}
function automaticMessageMatch(source, hashes) {
  const first = [], last = [];
  let cursor = 0;
  for (const m of source.messages) {
    while (cursor < hashes.length && hashes[cursor] !== m.hash)
      cursor++;
    if (cursor === hashes.length)
      return null;
    first.push(cursor++);
  }
  cursor = hashes.length - 1;
  for (let i = source.messages.length - 1;i >= 0; i--) {
    while (cursor >= 0 && hashes[cursor] !== source.messages[i].hash)
      cursor--;
    if (cursor < 0)
      return null;
    last[i] = cursor--;
  }
  return first.every((at, i) => at === last[i]) ? first : null;
}

// src/backend/summary-backup.ts
var EXPORT_KEY = "lumibooks_summary";
function summaryLorebook(entries, name, fingerprint, coverage) {
  return {
    name,
    description: t("backend.summaryBackup.summaryLorebook.lumiBooksSummariesImportThroughBooksToRestore"),
    ...fingerprint ? { extensions: { [EXPORT_KEY]: fingerprint } } : {},
    entries: Object.fromEntries(entries.filter((e) => !e.meta.ghost).map((e, i) => [i, {
      uid: i,
      key: e.raw.key ?? [],
      keysecondary: [],
      content: e.raw.content,
      comment: e.raw.comment || e.meta.title || t("backend.summaryBackup.summaryLorebook.summary", { i1: i + 1 }),
      constant: true,
      disable: false,
      position: 0,
      order: i,
      displayIndex: i,
      extensions: { [EXPORT_KEY]: { tier: e.meta.tier, ...coverage ? { messageIndices: coverage.get(e.raw.id) ?? [] } : {} } }
    }]))
  };
}
async function exportSummaryLorebook(chatId, userId, progress) {
  const coverage = await buildCoverage(chatId, userId);
  const entries = coverage.activeEntries.slice().sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (!entries.length)
    throw new Error(t("backend.summaryBackup.exportSummaryLorebook.thereAreNoActiveSummariesToExport"));
  progress?.(t("backend.summaryBackup.exportSummaryLorebook.fetchingRawChatMessages"));
  const messages = await spindle.chat.getMessages(chatId);
  const positions = new Map(messages.map((m, i) => [m.id, i]));
  const byEntry = new Map;
  for (const e of entries) {
    const ids = new Set(e.meta.msgIds);
    if ([...ids].some((id) => !positions.has(id)))
      continue;
    byEntry.set(e.raw.id, [...ids].flatMap((id) => positions.has(id) ? [positions.get(id)] : []).sort((a, b) => a - b));
  }
  for (const [messageId, entryId] of coverage.coveredBy) {
    const at = positions.get(messageId), indices = byEntry.get(entryId);
    if (at !== undefined && indices)
      indices.push(at);
  }
  for (const [id, indices] of byEntry)
    byEntry.set(id, [...new Set(indices)].sort((a, b) => a - b));
  const indices = [...new Set([...byEntry.values()].flat())].sort((a, b) => a - b);
  const hashes = await hashRawMessages(indices.map((i) => messages[i]), (done) => progress?.(t("backend.summaryBackup.hashes.hashingRawMessages", { done, length: indices.length })));
  const fingerprint = await makeFingerprint(indices.map((index, i) => ({ index, hash: hashes[i] })));
  return summaryLorebook(entries, t("backend.summaryBackup.exportSummaryLorebook.lumiBooksSummaries", { slice: chatId.slice(0, 8) }), fingerprint, byEntry);
}
function parseSummaryLorebook(raw) {
  if (!raw || typeof raw !== "object")
    throw new Error(t("backend.summaryBackup.parseSummaryLorebook.chooseALorebookJsonFileWithEntries"));
  const entries = raw.entries;
  if (!entries || typeof entries !== "object")
    throw new Error(t("backend.summaryBackup.parseSummaryLorebook.theLorebookHasNoEntries"));
  const rows = Array.isArray(entries) ? entries : Object.values(entries);
  if (rows.length > 1e4)
    throw new Error(t("backend.summaryBackup.parseSummaryLorebook.theLorebookHasMoreThan10000"));
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== "object")
      throw new Error(t("backend.summaryBackup.parseSummaryLorebook.invalidLorebookEntry"));
    const v = row;
    if (v.disable === true || v.disabled === true || v.enabled === false)
      continue;
    if (typeof v.content !== "string")
      throw new Error(t("backend.summaryBackup.parseSummaryLorebook.everyLorebookEntryNeedsTextContent"));
    if (!v.content.trim())
      continue;
    const tier = v.extensions?.[EXPORT_KEY]?.tier;
    const messageIndices = v.extensions?.[EXPORT_KEY]?.messageIndices;
    if (messageIndices !== undefined && (!Array.isArray(messageIndices) || messageIndices.length > 1e6 || messageIndices.some((n) => !Number.isSafeInteger(n) || n < 0)))
      throw new Error(t("backend.summaryBackup.parseSummaryLorebook.invalidSummaryCoverageIndices"));
    const keys = v.key ?? v.keys;
    out.push({
      content: v.content,
      comment: typeof v.comment === "string" ? v.comment : typeof v.name === "string" ? v.name : t("backend.summaryBackup.parseSummaryLorebook.importedSummary"),
      keys: Array.isArray(keys) ? keys.filter((k) => typeof k === "string") : [],
      tier: Number.isInteger(tier) && tier >= 1 && tier <= 7 ? tier : 1,
      ...messageIndices !== undefined ? { messageIndices: [...new Set(messageIndices)].sort((a, b) => a - b) } : {}
    });
  }
  if (!out.length)
    throw new Error(t("backend.summaryBackup.parseSummaryLorebook.theLorebookHasNoEnabledSummaries"));
  return out;
}
async function readSummaryImport(raw) {
  const rows = parseSummaryLorebook(raw);
  const fingerprint = await parseFingerprint(raw.extensions?.[EXPORT_KEY]);
  if (fingerprint) {
    const indices = new Set(fingerprint.messages.map((m) => m.index));
    for (const row of rows) {
      if (!row.messageIndices || row.messageIndices.some((i) => !indices.has(i)))
        throw new Error(t("backend.summaryBackup.readSummaryImport.theSummaryCoverageDoesNotMatchIts"));
    }
    const used = new Set(rows.flatMap((r) => r.messageIndices));
    return { rows, fingerprint: await makeFingerprint(fingerprint.messages.filter((m) => used.has(m.index))) };
  }
  return { rows, fingerprint };
}
async function saveImportedSummaries(chatId, userId, rows, links) {
  await requireForkShelf(chatId, userId);
  return withCommitMutex(userId, chatId, () => commitImportedSummaries(chatId, userId, rows, links));
}
async function commitImportedSummaries(chatId, userId, rows, links) {
  if (links) {
    const messages = links.messages;
    if (links.indices.length !== rows.length || links.indices.some((indices) => indices.some((i) => !Number.isInteger(i) || !messages[i])))
      throw new Error(t("backend.summaryBackup.commitImportedSummaries.invalidDestinationCoverage"));
    const claimed = new Set;
    for (const indices of links.indices) {
      for (const index of new Set(indices)) {
        const id = messages[index].id;
        if (claimed.has(id))
          throw new Error(t("backend.summaryBackup.commitImportedSummaries.thisImportContainsOverlappingSummaryCoverageResolve"));
        claimed.add(id);
      }
    }
  }
  const existing = await listLmbEntries(chatId, userId, true);
  if (links?.indices.some((indices) => indices.length)) {
    const coverage = await buildCoverage(chatId, userId, existing, true);
    const current = new Map((await spindle.chat.getMessages(chatId)).map((m) => [m.id, m]));
    for (const index of new Set(links.indices.flat())) {
      const source = links.messages[index], live = current.get(source.id);
      if (coverage.coveredBy.has(source.id))
        throw new Error(t("backend.summaryBackup.commitImportedSummaries.someOfTheseMessagesAlreadyHaveSummaries"));
      if (!live || live.role !== source.role || live.content !== source.content)
        throw new Error(t("backend.summaryBackup.commitImportedSummaries.theChatChangedWhilePreparingTheImport"));
    }
    links = { ...links, messages: links.messages.map((m) => current.get(m.id) ?? m) };
  }
  const before = Math.min(0, ...existing.filter((e) => e.meta.isRoot).map((e) => e.meta.firstMsgIdx ?? 0));
  const book = await ensureBookForChat(chatId, userId);
  const created = [];
  try {
    for (const [i, row] of rows.entries()) {
      const at = before - rows.length + i;
      const indices = links?.indices[i] ?? [];
      const isRoot = indices.length === 0;
      const comment = isRoot ? row.comment.startsWith("[Root]") ? row.comment : `[Root] ${row.comment}` : row.comment.replace(/^\[Root\]\s*/, "");
      const entry = await createChapterEntry(book.id, {
        tier: row.tier,
        chatId,
        msgIds: indices.map((index) => links.messages[index].id),
        sourceChapterEntryIds: [],
        isRoot,
        firstMsgIdx: isRoot ? at : links.messages[indices[0]].index_in_chat,
        lastMsgIdx: isRoot ? at : links.messages[indices.at(-1)].index_in_chat,
        tokenCountInput: 0,
        tokenCountOutput: approximateTokensFromChars(row.content.length),
        model: "",
        connectionId: "",
        createdAt: Date.now(),
        title: row.comment
      }, row.content, comment, userId, row.keys);
      created.push(entry.id);
    }
  } catch (err) {
    const rollback = await Promise.allSettled(created.map((id) => deleteEntry(id, userId)));
    if (rollback.some((r) => r.status === "rejected"))
      throw new Error(t("backend.summaryBackup.commitImportedSummaries.importFailedAndSomeImportedSummariesCould"), { cause: err });
    throw err;
  } finally {
    invalidateBookCache(userId, chatId);
  }
  return created.length;
}

// src/backend/summary-transfer.ts
var transfers = new Map;
var key2 = (userId, chatId) => JSON.stringify([userId, chatId]);
function getSummaryTransfer(userId, chatId) {
  return transfers.get(key2(userId, chatId))?.status ?? null;
}
function update(userId, transfer, stage, text, extra = {}) {
  transfer.status = { ...transfer.status, ...extra, stage, text };
  try {
    send({ type: "summary_transfer_status", status: transfer.status }, userId);
  } catch (err) {
    warn(`summary transfer progress delivery failed: ${describeError(err)}`);
  }
}
async function runSummaryTransfer(userId, chatId, request) {
  const k = key2(userId, chatId);
  let transfer = transfers.get(k);
  if (request.type === "resolve") {
    if (!transfer || transfer.status.id !== request.id)
      throw new Error(t("backend.summaryTransfer.runSummaryTransfer.thisImportIsNoLongerAvailableChoose"));
    if (transfer.running)
      return false;
    if (request.choice === "cancel") {
      transfers.delete(k);
      send({ type: "summary_transfer_status", status: { ...transfer.status, stage: "cancelled", text: t("backend.summaryTransfer.runSummaryTransfer.importCancelled") } }, userId);
      return false;
    }
    if (!transfer.rows)
      return false;
  } else {
    if (transfer?.running || transfer?.rows) {
      send({ type: "summary_transfer_status", status: transfer.status }, userId);
      return false;
    }
    transfer = { status: { id: crypto.randomUUID(), chatId, stage: "working", text: t("backend.summaryTransfer.runSummaryTransfer.readingSummaries") }, running: false };
    if (transfers.size >= 200) {
      for (const [oldKey, old] of transfers) {
        if (!old.running && !old.rows)
          transfers.delete(oldKey);
        if (transfers.size < 200)
          break;
      }
    }
    transfers.set(k, transfer);
  }
  const t2 = transfer;
  t2.running = true;
  let lastProgress = 0;
  const progress = (text) => {
    if (Date.now() - lastProgress < 150)
      return;
    lastProgress = Date.now();
    update(userId, t2, "working", text);
  };
  update(userId, t2, "working", request.type === "export" ? t("backend.summaryTransfer.runSummaryTransfer.preparingSummaryExport") : t("backend.summaryTransfer.runSummaryTransfer.readingRawChatMessages"));
  try {
    if (request.type === "export") {
      const data = await exportSummaryLorebook(chatId, userId, progress);
      send({ type: "summary_export_data", chatId, filename: `lumibooks-summaries-${chatId.slice(0, 8)}.json`, content: JSON.stringify(data, null, 2) }, userId);
      update(userId, t2, "done", t("backend.summaryTransfer.runSummaryTransfer.summaryExportReady"));
      return false;
    }
    if (request.type === "import") {
      const parsed = await readSummaryImport(request.raw);
      t2.rows = parsed.rows;
      t2.fingerprint = parsed.fingerprint;
    }
    const rows = t2.rows;
    const messages = await spindle.chat.getMessages(chatId);
    const source = t2.fingerprint;
    t2.status = { ...t2.status, messageCount: messages.length, sourceCount: source?.messages.length ?? 0 };
    const manual = (text) => {
      update(userId, t2, "manual", text ?? t("backend.summaryTransfer.manual.upUntilWhichMessageShouldTheseSummaries"), { manualPromptOnly: text === undefined });
      return false;
    };
    if (request.type === "resolve" && request.choice === "specify")
      return manual();
    let indices = rows.map(() => []);
    let importedRows = rows;
    if (request.type === "resolve" && request.choice === "manual") {
      if (!Number.isSafeInteger(request.through) || request.through < 0 || request.through > messages.length)
        return manual(t("backend.summaryTransfer.runSummaryTransfer.enterAWholeMessageNumberFrom0", { length: messages.length }));
      if (request.through > 0) {
        importedRows = [{
          content: rows.map((r) => r.content).join(`

`),
          comment: rows.length === 1 ? rows[0].comment : t("backend.summaryTransfer.runSummaryTransfer.importedSummaries"),
          keys: [...new Set(rows.flatMap((r) => r.keys))],
          tier: Math.max(...rows.map((r) => r.tier))
        }];
        indices = [Array.from({ length: request.through }, (_, i) => i)];
      }
    } else if (source?.messages.length) {
      if (messages.length < source.messages.length)
        return manual();
      const relocate = request.type === "resolve" && request.choice === "match";
      const selected = relocate ? messages : source.messages.flatMap((m) => messages[m.index] ? [messages[m.index]] : []);
      const computed = await hashRawMessages(selected, (done) => progress(t("backend.summaryTransfer.computed.comparingRawMessages", { done, length: selected.length })));
      const hashes = relocate ? computed : new Array(messages.length);
      if (!relocate && computed.length === source.messages.length)
        source.messages.forEach((m, i) => {
          hashes[m.index] = computed[i];
        });
      const matched = exactMessageMatch(source, hashes) ?? (relocate ? automaticMessageMatch(source, hashes) : null);
      if (!matched) {
        if (request.type === "resolve" && request.choice === "match")
          return manual(t("backend.summaryTransfer.runSummaryTransfer.automaticMatchingWasIncompleteOrAmbiguousUp"));
        update(userId, t2, "mismatch", t("backend.summaryTransfer.runSummaryTransfer.theContentOfThisChatIsDifferent"));
        return false;
      }
      const mapping = new Map(source.messages.map((m, i) => [m.index, matched[i]]));
      indices = rows.map((r) => (r.messageIndices ?? []).map((i) => mapping.get(i)));
    }
    const linkedIds = new Set(indices.flat().map((i) => messages[i].id));
    if (linkedIds.size) {
      const coverage = await buildCoverage(chatId, userId);
      if ([...linkedIds].some((id) => coverage.coveredBy.has(id)))
        throw new Error(t("backend.summaryTransfer.runSummaryTransfer.someOfTheseMessagesAlreadyHaveSummaries"));
      const current = await spindle.chat.getMessages(chatId);
      for (const at of new Set(indices.flat())) {
        const before = messages[at], now = current[at];
        if (!now || now.id !== before.id || now.role !== before.role || now.content !== before.content) {
          t2.status.messageCount = current.length;
          return manual(t("backend.summaryTransfer.runSummaryTransfer.theChatChangedWhilePreparingTheImport"));
        }
      }
    }
    update(userId, t2, "working", t("backend.summaryTransfer.runSummaryTransfer.savingImportedSummaries"));
    await saveImportedSummaries(chatId, userId, importedRows, { messages, indices });
    t2.rows = undefined;
    t2.fingerprint = undefined;
    update(userId, t2, "done", t("backend.summaryTransfer.runSummaryTransfer.importedSummaries2", { length: rows.length, choice: linkedIds.size ? "yes" : "no", size: linkedIds.size ? linkedIds.size : "" }));
    return true;
  } catch (err) {
    update(userId, t2, "error", describeError(err));
    return false;
  } finally {
    t2.running = false;
  }
}

// src/backend/injection.ts
var injectionAnomalyCb = null;
function registerInjectionAnomalyCallback(cb) {
  injectionAnomalyCb = cb;
}
function isAssembledHistory(lm) {
  return lm["__isChatHistory"] === true;
}
function sourceMessageId(lm) {
  const v = lm["sourceMessageId"];
  return typeof v === "string" && v ? v : undefined;
}
function sourceIndexInChat(lm) {
  const v = lm["sourceIndexInChat"];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function sourceMessageMetadata(lm) {
  const record = lm;
  if (!Object.prototype.hasOwnProperty.call(record, "sourceMessageMetadata"))
    return;
  const value = record["sourceMessageMetadata"];
  return value && typeof value === "object" ? value : {};
}
function orderEntries(coverage, msgIdToIdx) {
  const ordered = [];
  for (const entry of coverage.activeEntries) {
    let firstIdx = Number.POSITIVE_INFINITY;
    let lastIdx = -1;
    for (const msgId of entry.meta.msgIds) {
      const idx = msgIdToIdx.get(msgId);
      if (typeof idx !== "number")
        continue;
      if (idx < firstIdx)
        firstIdx = idx;
      if (idx > lastIdx)
        lastIdx = idx;
    }
    const haveIdx = firstIdx !== Number.POSITIVE_INFINITY;
    const resolvedFirst = haveIdx ? firstIdx : typeof entry.meta.firstMsgIdx === "number" ? entry.meta.firstMsgIdx : 0;
    const resolvedLast = haveIdx ? lastIdx : typeof entry.meta.lastMsgIdx === "number" ? entry.meta.lastMsgIdx : resolvedFirst;
    const tierName = TIER_NAMES[entry.meta.tier - 1];
    const label = entry.raw.comment || (haveIdx ? t("backend.injection.label.msgs", { tierName, firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1 }) : tierName);
    ordered.push({ entry, label, firstIdx: resolvedFirst, lastIdx: resolvedLast, emitted: false });
  }
  ordered.sort((a, b) => a.firstIdx - b.firstIdx);
  return ordered;
}
var LEGACY_ACTIVATION_WAIT_MS = 240000;
var legacyActivationInflight = new Map;
async function getLegacyActivated(chatId, userId) {
  const key = `${userId}:${chatId}`;
  let pending = legacyActivationInflight.get(key);
  if (!pending) {
    const raw = spindle.world_books.getActivated(chatId, userId).catch(() => null);
    pending = new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (legacyActivationInflight.get(key) === pending) {
          legacyActivationInflight.delete(key);
        }
        resolve(null);
      }, LEGACY_ACTIVATION_WAIT_MS);
      raw.then((value) => {
        clearTimeout(timer);
        resolve(value);
        if (legacyActivationInflight.get(key) === pending) {
          legacyActivationInflight.delete(key);
        }
      });
    });
    legacyActivationInflight.set(key, pending);
  }
  return await pending;
}
async function buildInjection(chatId, llmMessages, userId, context = { worldInfoActivationCapture: false }) {
  let activated = null;
  let attachedBookIds = null;
  let allEntries;
  if (context.capturedWorldInfo === undefined && !context.worldInfoActivationCapture) {
    [activated, allEntries, attachedBookIds] = await Promise.all([
      getLegacyActivated(chatId, userId),
      listLmbEntries(chatId, userId),
      getChatAttachedBookIds(chatId, userId).catch(() => null)
    ]);
  } else {
    allEntries = await listLmbEntries(chatId, userId);
  }
  if (allEntries.length === 0)
    return null;
  let entriesForCoverage;
  if (context.capturedWorldInfo !== undefined) {
    const capturedIds = new Set(context.capturedWorldInfo.map((entry) => entry.id));
    entriesForCoverage = allEntries.filter((entry) => capturedIds.has(entry.raw.id));
  } else if (context.worldInfoActivationCapture) {
    entriesForCoverage = allEntries.filter((entry) => !entry.raw.disabled);
  } else {
    const ourBookId = allEntries[0].raw.world_book_id;
    const activatedIds = activated ? new Set(activated.map((a) => a.id)) : null;
    const anyOursActivated = !!activatedIds && allEntries.some((e) => activatedIds.has(e.raw.id));
    const hostScanningOurBook = anyOursActivated || !!attachedBookIds && attachedBookIds.includes(ourBookId);
    entriesForCoverage = activatedIds && hostScanningOurBook ? allEntries.filter((e) => activatedIds.has(e.raw.id)) : allEntries.filter((e) => !e.raw.disabled);
  }
  const coverage = await buildCoverage(chatId, userId, allEntries, false, new Set(entriesForCoverage.map((entry) => entry.raw.id)));
  recordDiagnostic(userId, { event: "injection", chatId, outcome: coverage.activeEntries.length ? "started" : "skipped", numbers: { input: llmMessages.length, entries: coverage.activeEntries.length }, entries: diagnosticEntries(coverage.activeEntries, undefined, false) });
  if (coverage.activeEntries.length === 0)
    return null;
  const historyMsgs = llmMessages.filter(isAssembledHistory);
  let chatSnapshot;
  if (historyMsgs.length === 0) {
    let chatMessages = null;
    try {
      chatMessages = await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed while verifying an empty history, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, t("backend.injection.buildInjection.memoriaCouldnTReadTheChatAnd"));
      return null;
    }
    const hasVisibleMessage = !!chatMessages?.some((m) => !(m.extra && m.extra.hidden));
    if (hasVisibleMessage) {
      error(`injection: no "__isChatHistory" messages on ${llmMessages.length} assembled message(s) despite ` + `visible chat messages. Possible causes: the host clipped history to fit max context, another ` + `extension reshaped the prompt first, or the active preset has no chat-history block. Skipping injection.`);
      injectionAnomalyCb?.(userId, t("backend.injection.buildInjection.memoriaCouldnTFindTheChatHistory"));
      return null;
    }
    chatSnapshot = chatMessages;
  }
  const plan = [];
  let missingIdx = false;
  for (const m of historyMsgs) {
    const id = sourceMessageId(m);
    if (id === undefined) {
      error(`injection: a "__isChatHistory" message is missing sourceMessageId. Host identity contract ` + `looks inconsistent, skipping injection.`);
      return null;
    }
    const idx = sourceIndexInChat(m);
    if (idx === undefined)
      missingIdx = true;
    plan.push({
      id,
      idx,
      covered: coverage.coveredBy.has(id),
      metadata: sourceMessageMetadata(m)
    });
  }
  let msgIdToIdx;
  const needsMetadata = plan.some((item) => item.covered && item.metadata === undefined);
  const assembledIds = new Set(plan.map((item) => item.id));
  const needsSourceIndexes = coverage.activeEntries.some((entry) => !entry.meta.isRoot && entry.meta.msgIds.some((id) => !assembledIds.has(id)));
  if (chatSnapshot || missingIdx || needsMetadata || needsSourceIndexes) {
    let chatMessages;
    try {
      chatMessages = chatSnapshot ?? await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed on the slow path, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, t("backend.injection.buildInjection.memoriaCouldnTReadTheChatAnd"));
      return null;
    }
    msgIdToIdx = new Map(chatMessages.map((m) => [m.id, m.index_in_chat]));
    const byId = new Map(chatMessages.map((m) => [m.id, m]));
    for (const p of plan) {
      const idx = msgIdToIdx.get(p.id);
      if (idx === undefined) {
        error(`injection: sourceMessageId "${p.id}" is not in the chat, skipping injection.`);
        return null;
      }
      p.idx = idx;
      if (p.covered) {
        p.metadata = byId.get(p.id)?.metadata ?? {};
      }
    }
  } else {
    msgIdToIdx = new Map(plan.map((p) => [p.id, p.idx]));
  }
  for (const item of plan) {
    if (item.covered && item.metadata?.["lmb_excluded"] === true) {
      item.covered = false;
    }
  }
  const ordered = orderEntries(coverage, msgIdToIdx);
  if (ordered.length === 0)
    return null;
  const out = [];
  const injectedLabels = new Map;
  const flushAt = (index, beforePos) => {
    const block = [];
    for (const o of ordered) {
      if (o.emitted || o.lastIdx >= beforePos)
        continue;
      o.emitted = true;
      const msg = { role: "assistant", content: formatEntryForInjection(o.entry) };
      injectedLabels.set(msg, o.label);
      block.push(msg);
    }
    if (block.length)
      out.splice(index, 0, ...block);
  };
  let hp = 0;
  let histEnd = -1;
  for (const lm of llmMessages) {
    if (!isAssembledHistory(lm)) {
      out.push(lm);
      continue;
    }
    const p = plan[hp++];
    flushAt(out.length, p.idx);
    if (!p.covered)
      out.push(lm);
    histEnd = out.length;
  }
  let fallbackPos = 0;
  while (fallbackPos < out.length && out[fallbackPos].role === "system")
    fallbackPos++;
  flushAt(histEnd < 0 ? fallbackPos : histEnd, Number.POSITIVE_INFINITY);
  if (injectedLabels.size === 0)
    return null;
  const breakdown = [];
  for (let i = 0;i < out.length; i++) {
    const label = injectedLabels.get(out[i]);
    if (label !== undefined)
      breakdown.push({ messageIndex: i, name: label });
  }
  recordDiagnostic(userId, {
    event: "injection",
    chatId,
    outcome: "success",
    messageScope: "assembled",
    numbers: { input: llmMessages.length, output: out.length, selected: breakdown.length, covered: plan.filter((p) => p.covered).length },
    messages: plan.map((p) => ({ id: p.id, index: p.idx, coveredBy: coverage.coveredBy.get(p.id), excluded: p.metadata?.lmb_excluded === true }))
  });
  return { messages: out, breakdown };
}
function formatEntryForInjection(entry) {
  return entry.raw.content;
}

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

// src/backend/codex/tokens.ts
async function countCodexText(text, userId) {
  if (!text)
    return { tokens: 0, approximate: false };
  try {
    const result = await spindle.tokens.countText(text, { modelSource: "main", userId });
    if (!Number.isFinite(result.total_tokens) || result.total_tokens < 0)
      throw new Error(t("backend.codex.tokens.countCodexText.invalidTokenCount"));
    return { tokens: result.total_tokens, approximate: result.approximate };
  } catch {
    return { tokens: approximateTokensFromChars(text.length), approximate: true };
  }
}
async function measureCodexTokens(bundle, userId, fileStates = {}, forceConstant = false) {
  const sections = renderCodexFileSections(bundle);
  const counts = { files: {}, constant: 0, approximate: false };
  for (const key of CODEX_FILE_KEYS) {
    const count = await countCodexText(sections[key], userId);
    counts.files[key] = count.tokens;
    counts.approximate ||= count.approximate;
  }
  const disabledFiles = new Set(CODEX_FILE_KEYS.filter((k) => fileStates[k] === "noInject" || fileStates[k] === "frozen"));
  const records = renderCodexRecords(bundle, { includeRelations: !disabledFiles.has("relations"), disabledFiles });
  for (const record of records) {
    if (disabledFiles.has(record.file) || record.disabled || !(forceConstant || record.constant))
      continue;
    const count = await countCodexText(record.content, userId);
    counts.constant += count.tokens;
    counts.approximate ||= count.approximate;
  }
  return counts;
}

// src/backend/codex/agent.ts
class ToolProtocolError extends Error {
  constructor(message) {
    super(message);
    this.name = "ToolProtocolError";
  }
}

class CodexValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CodexValidationError";
  }
}

class CodexContextError extends Error {
  constructor(promptTokens, maxInputTokens) {
    super(t("backend.codex.agent.messages.theAssembledCodexPromptIsKTokens", { round: Math.round(promptTokens / 1000), round2: Math.round(maxInputTokens / 1000) }));
    this.name = "CodexContextError";
  }
}
function codexMaxInputTokens(profile) {
  return profile.codexSamplers.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
}
var CACHE_EPHEMERAL = { type: "ephemeral" };
var INTEGRITY_ROUNDS = 3;
var COVERAGE_NUDGES = 3;
function codexTools(activeFiles, sequential) {
  const tools = [
    {
      name: "codex_write",
      description: sequential ? "Edit one codex file. Default is a patch: set adds or replaces complete rows by key, drop deletes by key, untouched rows survive without being resent. content replaces the whole file and is only for ground-up rewrites. One file per call. If writing every remaining file at once would be a strain, write one and you will be asked for the next." : "Edit one codex file. Default is a patch: set adds or replaces complete rows by key, drop deletes by key, untouched rows survive without being resent. content replaces the whole file and is only for ground-up rewrites. Call once per changed file, and put every call for this update in a single response.",
      parameters: {
        type: "object",
        properties: {
          file: { type: "string", enum: [...activeFiles] },
          set: {
            type: "array",
            items: { type: "object" },
            description: "Only new or changed rows, each complete on its own. Keep the existing entity id or rid when updating; omit rid only for a new record. Omit unchanged rows even if the story mentions them again."
          },
          drop: {
            type: "array",
            items: { type: "string" },
            description: "Entity ids or rids of rows to delete."
          },
          seeds: {
            type: "array",
            items: { type: "string" },
            description: "threads.json only: the complete replacement seeds list."
          },
          content: {
            type: "object",
            description: "The complete new file content, replacing everything. Only for a ground-up rewrite; never combined with set or drop."
          }
        },
        required: ["file"]
      }
    },
    {
      name: "codex_done",
      description: "Declare the codex current. Only honored once every file has been written or skipped.",
      parameters: {
        type: "object",
        properties: {
          note: { type: "string", description: "One short line on what changed." }
        },
        required: []
      }
    }
  ];
  tools.push({
    name: "codex_skip",
    description: "Mark unchanged files complete while preserving their contents. Skip a file even if the story mentions it again, when it needs no additions, corrections, or removals. You may skip all files and call codex_done without writing anything.",
    parameters: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string", enum: [...activeFiles] }, description: "The files that need no change." },
        reason: { type: "string", description: "One short line on why nothing changed." }
      },
      required: ["files"]
    }
  });
  return tools;
}
async function resolveCodexConnection(profile, userId) {
  if (profile.codexConnectionId) {
    const list = await listConnections(userId);
    const picked = list.find((c) => c.id === profile.codexConnectionId) ?? null;
    if (picked) {
      const model = typeof picked.model === "string" ? picked.model : "";
      if (!model.trim()) {
        throw new FatalSummarizerError(t("backend.codex.agent.resolveCodexConnection.codexConnectionHasNoModelSetPick", { id: picked.name || picked.id }));
      }
      return picked;
    }
    warn(`codex: connection ${profile.codexConnectionId} not found, falling back to the profile connection`);
  }
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError(t("backend.codex.agent.resolveCodexConnection.noConnectionAvailableForTheCodex"));
  return conn;
}
async function runQuietRound(conn, messages, profile, userId, tools, externalSignal, onProgress, onDelta, progressBase) {
  const model = (conn.model ?? "").trim();
  const parameters = { ...buildCodexSamplerParameters(profile) };
  if (model)
    parameters["model"] = model;
  const result = await consumeGenerationStream((signal) => spindle.generate.quietStream({
    type: "quiet",
    messages,
    connection_id: conn.id,
    parameters,
    ...tools ? { tools } : {},
    userId,
    signal
  }), {
    externalSignal,
    onProgress,
    onDelta,
    firstTokenTimeoutMs: null,
    overallDeadlineMs: null,
    salvagePartial: false,
    progressBase
  });
  return {
    content: result.content,
    toolCalls: result.toolCalls,
    usagePrompt: result.usage?.prompt_tokens ?? 0,
    usageCompletion: result.usage?.completion_tokens ?? 0
  };
}
function assistantTurn(content, toolCalls) {
  const parts = [];
  if (content.trim())
    parts.push({ type: "text", text: content });
  for (const call of toolCalls) {
    parts.push({ type: "tool_use", id: call.call_id, name: call.name, input: call.args });
  }
  return { role: "assistant", content: parts };
}
function parseJsonModeCalls(raw) {
  const objs = parseLooseJsonObjects(raw);
  const envelopes = objs.filter((o) => Array.isArray(o["writes"]) || Array.isArray(o["skip"]) || o["done"] === true);
  const obj = envelopes.length ? envelopes[envelopes.length - 1] : objs[0] ?? null;
  if (!obj)
    return [];
  const calls = [];
  const writes = Array.isArray(obj["writes"]) ? obj["writes"] : [];
  writes.forEach((w, i) => {
    const args = w && typeof w === "object" && !Array.isArray(w) ? w : {};
    calls.push({ call_id: `json_w${i}`, name: "codex_write", args });
  });
  const skip = Array.isArray(obj["skip"]) ? obj["skip"] : [];
  if (skip.length) {
    calls.push({ call_id: "json_skip", name: "codex_skip", args: { files: skip } });
  }
  if (obj["done"] === true) {
    const args = typeof obj["note"] === "string" ? { note: obj["note"] } : {};
    calls.push({ call_id: "json_done", name: "codex_done", args });
  }
  return calls;
}
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
function isMaskEcho(v) {
  return v === LOCKED_FIELD_MASK || Array.isArray(v) && v.length === 1 && v[0] === LOCKED_FIELD_MASK;
}
function restoreLockedFields(file, value, current) {
  if (file !== "characters" && file !== "locations" && file !== "things")
    return [];
  const curById = new Map;
  for (const row of fileRows(current, file)) {
    if (typeof row["id"] === "string")
      curById.set(row["id"], row);
  }
  const touched = [];
  for (const row of fileRows(value, file)) {
    const id = typeof row["id"] === "string" ? row["id"] : "";
    const orig = curById.get(id);
    const lf = orig && Array.isArray(orig["lockedFields"]) ? orig["lockedFields"].filter((f) => typeof f === "string" && f !== "id" && f !== "name") : [];
    if (lf.length === 0) {
      delete row["lockedFields"];
      continue;
    }
    let changed = false;
    for (const f of lf) {
      const wrote = row[f];
      const want = orig[f];
      if (wrote !== undefined && !isMaskEcho(wrote) && JSON.stringify(wrote) !== JSON.stringify(want))
        changed = true;
      if (want === undefined)
        delete row[f];
      else
        row[f] = clone(want);
    }
    row["lockedFields"] = [...lf];
    if (changed)
      touched.push(id);
  }
  return touched;
}
function restoreNoInject(file, value, current) {
  if (file !== "characters" && file !== "locations" && file !== "things")
    return;
  const curById = new Map;
  for (const row of fileRows(current, file)) {
    if (typeof row["id"] === "string")
      curById.set(row["id"], row);
  }
  for (const row of fileRows(value, file)) {
    const orig = curById.get(typeof row["id"] === "string" ? row["id"] : "");
    if (orig?.["noInject"] === true)
      row["noInject"] = true;
    else
      delete row["noInject"];
  }
}
function stageWrite(file, args, current, validateOpts, timelineAppendOnly) {
  const errors = [];
  const lockedKept = [];
  const lockedFieldsKept = [];
  const dropMisses = [];
  const archivedKept = [];
  const keyField = FILE_ROW_KEY[file].key;
  const arg = (k) => {
    const v = args[k];
    return v === null ? undefined : v;
  };
  const rawContent = arg("content");
  const rawSet = arg("set");
  const rawDrop = arg("drop");
  const rawSeeds = arg("seeds");
  const hasPatch = rawSet !== undefined || rawDrop !== undefined || rawSeeds !== undefined;
  const lockedRows = new Map;
  if (keyField === "id") {
    for (const row of fileRows(current, file)) {
      if (row["locked"] === true && typeof row["id"] === "string")
        lockedRows.set(row["id"], row);
    }
  }
  const hiddenResolved = file === "threads" ? current.threads.filter((t) => t.status === "resolved") : [];
  if (rawContent !== undefined) {
    if (hasPatch) {
      return { errors: ["content replaces the whole file - never combine it with set, drop, or seeds"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    }
    let content = rawContent;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return { errors: ["content: string was not valid JSON, pass the object directly"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
      }
    }
    const result = validateCodexFile(file, content, validateOpts);
    if (!result.ok)
      return { errors: result.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    const value = result.value;
    if (lockedRows.size > 0) {
      const rows = fileRows(value, file);
      for (const [id, orig] of lockedRows) {
        const idx = rows.findIndex((r) => r["id"] === id);
        if (idx >= 0) {
          if (JSON.stringify(rows[idx]) !== JSON.stringify(orig))
            lockedKept.push(id);
          rows[idx] = clone(orig);
        } else {
          lockedKept.push(id);
          rows.push(clone(orig));
        }
      }
    }
    if (keyField === "id") {
      for (const row of fileRows(value, file)) {
        if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? "")))
          delete row["locked"];
      }
    }
    if (file === "threads" && hiddenResolved.length > 0) {
      const t = value;
      const hiddenRids = new Set(hiddenResolved.map((h) => h.rid).filter(Boolean));
      for (const row of t.threads) {
        if (row.rid && hiddenRids.has(row.rid))
          archivedKept.push(row.rid);
      }
      t.threads = t.threads.filter((row) => !(row.rid && hiddenRids.has(row.rid)));
      t.threads.push(...hiddenResolved.map((h) => clone(h)));
    }
    lockedFieldsKept.push(...restoreLockedFields(file, value, current));
    restoreNoInject(file, value, current);
    assignMissingRids(file, value);
    return { value, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept, notes: result.notes };
  }
  if (!hasPatch) {
    return { errors: ["empty write: provide set, drop, seeds, or content"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  }
  if (rawSeeds !== undefined && file !== "threads") {
    errors.push("seeds: only threads.json has a seeds list");
  }
  const setRows = [];
  if (rawSet !== undefined) {
    if (!Array.isArray(rawSet))
      errors.push("set: expected an array of rows");
    else
      rawSet.forEach((r, i) => {
        let row = r;
        if (typeof row === "string") {
          try {
            row = JSON.parse(row);
          } catch {}
        }
        if (!row || typeof row !== "object" || Array.isArray(row))
          errors.push(`set[${i}]: expected a row object`);
        else
          setRows.push(row);
      });
  }
  const dropKeys = [];
  if (rawDrop !== undefined) {
    if (!Array.isArray(rawDrop))
      errors.push("drop: expected an array of keys");
    else
      rawDrop.forEach((k, i) => {
        if (typeof k !== "string" || !k.trim())
          errors.push(`drop[${i}]: expected a key string`);
        else
          dropKeys.push(k.trim());
      });
  }
  let seeds = null;
  if (rawSeeds !== undefined && file === "threads") {
    if (!Array.isArray(rawSeeds) || rawSeeds.some((s) => typeof s !== "string")) {
      errors.push("seeds: expected an array of strings");
    } else {
      seeds = rawSeeds.map((s) => s.trim()).filter(Boolean);
    }
  }
  if (setRows.length === 0 && dropKeys.length === 0 && seeds === null && errors.length === 0) {
    errors.push("empty write: set and drop held nothing - provide rows, keys, seeds, or content");
  }
  if (errors.length)
    return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  let rows = fileRows(current, file).map((r) => clone(r));
  if (file === "threads")
    rows = rows.filter((r) => r["status"] !== "resolved");
  const isArchivedRid = (key) => file === "threads" && hiddenResolved.some((h) => h.rid === key);
  for (const key of dropKeys) {
    if (lockedRows.has(key)) {
      lockedKept.push(key);
      continue;
    }
    if (isArchivedRid(key)) {
      archivedKept.push(key);
      continue;
    }
    if (file === "timeline" && timelineAppendOnly) {
      errors.push(`drop "${key}": the timeline is append-only - events are only removed in reconcile or tidy passes`);
      continue;
    }
    const idx = rows.findIndex((r) => r[keyField] === key);
    if (idx === -1) {
      dropMisses.push(key);
      continue;
    }
    rows.splice(idx, 1);
  }
  setRows.forEach((row, i) => {
    const key = row[keyField];
    if (typeof key === "string" && key) {
      if (lockedRows.has(key)) {
        lockedKept.push(key);
        return;
      }
      const idx = rows.findIndex((r) => r[keyField] === key);
      if (idx >= 0) {
        rows[idx] = row;
        return;
      }
      if (keyField === "rid") {
        if (isArchivedRid(key)) {
          archivedKept.push(key);
          return;
        }
        errors.push(`set[${i}]: rid "${key}" does not exist in ${file}.json - omit rid to add a new row`);
        return;
      }
      rows.push(row);
      return;
    }
    if (keyField === "id") {
      errors.push(`set[${i}]: missing "id"`);
      return;
    }
    rows.push(row);
  });
  if (errors.length)
    return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  const candidate = { [FILE_ROW_KEY[file].field]: rows };
  if (file === "threads") {
    candidate["seeds"] = seeds ?? current.seeds;
  }
  const result = validateCodexFile(file, candidate, validateOpts);
  if (!result.ok)
    return { errors: result.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  const value = result.value;
  if (keyField === "id") {
    for (const row of fileRows(value, file)) {
      if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? "")))
        delete row["locked"];
    }
  }
  if (file === "threads" && hiddenResolved.length > 0) {
    value.threads.push(...hiddenResolved.map((h) => clone(h)));
  }
  lockedFieldsKept.push(...restoreLockedFields(file, value, current));
  restoreNoInject(file, value, current);
  assignMissingRids(file, value);
  return { value, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept, notes: result.notes };
}
async function runCodexAgent(opts) {
  const started = Date.now();
  recordDiagnostic(opts.userId, {
    event: "codex",
    chatId: opts.chatId,
    outcome: "started",
    messageScope: "selected",
    numbers: { selected: opts.chunk.length },
    messages: opts.chunk.map((m) => ({ id: m.id, index: m.index_in_chat }))
  });
  try {
    const result = await runCodexAgentInner(opts);
    recordDiagnostic(opts.userId, { event: "codex", chatId: opts.chatId, outcome: "success", numbers: { durationMs: Date.now() - started, rounds: result.rounds, changed: result.changedFiles.length, promptTokens: result.usagePromptTokens, completionTokens: result.usageCompletionTokens } });
    return result;
  } catch (err) {
    recordDiagnostic(opts.userId, { event: "codex", chatId: opts.chatId, outcome: "failed", reason: diagnosticErrorReason(err), numbers: { durationMs: Date.now() - started } });
    throw err;
  }
}
async function runCodexAgentInner(opts) {
  const { profile, userId, chatId, promptCtx } = opts;
  const conn = await resolveCodexConnection(profile, userId);
  const useTools = promptCtx.useTools;
  const sequential = promptCtx.sequential;
  const skipPhrase = useTools ? "call codex_skip" : 'name them in "skip"';
  const donePhrase = useTools ? "Then call codex_done." : 'Set "done": true once everything is accounted for.';
  const coverage = new Set((opts.coverageFiles ?? [...promptCtx.activeFiles]).filter((k) => promptCtx.activeFiles.has(k)));
  const maxRounds = Math.min(coverage.size + COVERAGE_NUDGES + (profile.codexThorough ? 4 : 3), opts.callBudget?.remaining ?? Infinity);
  const writable = new Set(opts.writableFiles ?? promptCtx.activeFiles);
  const tools = useTools ? codexTools([...promptCtx.activeFiles].filter((k) => writable.has(k)), sequential) : null;
  const system = await resolveSystemMacros(buildCodexSystemPrompt(promptCtx), chatId, userId);
  const userText = opts.userTextOverride ?? buildCodexUserMessage(promptCtx, opts.bundle, opts.chunk, opts.chunkLabel, opts.chunkFirstIndex, opts.notes, opts.lore, opts.storySoFar);
  const maxInput = codexMaxInputTokens(profile);
  const promptTokens = approximateTokensFromChars(system.length + userText.length);
  if (promptTokens > maxInput)
    throw new CodexContextError(promptTokens, maxInput);
  const frozen = new Set(CODEX_FILE_KEYS.filter((k) => !promptCtx.activeFiles.has(k) || !writable.has(k)));
  const conv = [
    { role: promptRoleFor(profile, "codex"), content: [{ type: "text", text: system, cache_control: { ...CACHE_EPHEMERAL } }] },
    { role: "user", content: [{ type: "text", text: userText, cache_control: { ...CACHE_EPHEMERAL } }] }
  ];
  const working = structuredClone(opts.bundle);
  const changed = new Set;
  const validateOpts = { relationsTable: profile.codexRelationsTable, strictExtras: true };
  const progressBase = opts.progressBase ?? { chars: 0, thinking: 0 };
  const baselineDangling = danglingRefCounts(opts.bundle);
  let usagePrompt = 0;
  let usageCompletion = 0;
  let doneNote = null;
  let verifyRequested = false;
  let unresolvedErrors = false;
  const rejectedFiles = new Set;
  let rounds = 0;
  const remaining = new Set(coverage);
  let jsonRetryUsed = false;
  let coverageNudges = 0;
  let lastNudgeRemaining = Number.POSITIVE_INFINITY;
  const danglingSeen = new Set;
  let prevDanglingCount = Number.POSITIVE_INFINITY;
  let integrityRounds = 0;
  const persistClean = async () => {
    const broken = newDanglingFiles(working, baselineDangling);
    const clean = [...changed].filter((k) => !rejectedFiles.has(k) && !broken.has(k));
    const projected = { ...opts.bundle };
    for (const key of clean)
      projected[key] = working[key];
    if (newDangling(projected, baselineDangling).length > 0)
      return [];
    const saved = [];
    for (const key of clean) {
      try {
        await saveCodexFile(chatId, key, working[key], userId);
        saved.push(key);
      } catch (err) {
        warn(`codex: failed to persist ${key}.json from a failed run: ${describeError(err)}`);
      }
    }
    return saved;
  };
  const keptSuffix = (saved) => saved.length ? t("backend.codex.agent.keptSuffix.memoriaKeptTheRecordSheFinishedAnd", { length: saved.length }) : "";
  while (rounds < maxRounds) {
    if (opts.externalSignal.aborted)
      throw new AbortedSummarizerError;
    rounds++;
    if (rounds > 1)
      opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.round", { rounds }));
    if (opts.callBudget) {
      opts.callBudget.remaining--;
      opts.callBudget.used++;
    }
    const round = await runQuietRound(conn, conv, profile, userId, tools, opts.externalSignal, opts.onProgress, opts.onDelta, progressBase);
    usagePrompt += round.usagePrompt;
    usageCompletion += round.usageCompletion;
    const calls = useTools ? round.toolCalls : parseJsonModeCalls(round.content);
    for (const call of calls) {
      if (call.name === "codex_write") {
        const f = typeof call.args["file"] === "string" ? call.args["file"] : "?";
        let label;
        if (call.args["content"] !== undefined) {
          let size = 0;
          try {
            size = JSON.stringify(call.args["content"] ?? "").length;
          } catch {}
          label = t("backend.codex.agent.runCodexAgentInner.fullRewriteKChars", { toFixed: (size / 1000).toFixed(1) });
        } else {
          const bits = [];
          const setN = Array.isArray(call.args["set"]) ? call.args["set"].length : 0;
          const dropN = Array.isArray(call.args["drop"]) ? call.args["drop"].length : 0;
          if (setN)
            bits.push(t("backend.codex.agent.stream.set", { count: setN }));
          if (dropN)
            bits.push(t("backend.codex.agent.stream.drop", { count: dropN }));
          if (call.args["seeds"] !== undefined)
            bits.push(t("backend.codex.agent.stream.seeds"));
          label = bits.join(", ") || t("backend.codex.agent.stream.empty");
        }
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.codexWriteJson", { f, label }));
      } else if (call.name === "codex_done") {
        const note = typeof call.args["note"] === "string" && call.args["note"].trim() ? ` \u2014 ${call.args["note"].trim()}` : "";
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.codexDone", { note }));
      } else if (call.name === "codex_skip") {
        const files = Array.isArray(call.args["files"]) ? call.args["files"].filter((f) => typeof f === "string") : [];
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.codexSkip", { choice: files.length ? "yes" : "no", join: files.length ? files.map((f) => `${f}.json`).join(", ") : "" }));
      } else {
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.unknownTool", { name: call.name }));
      }
    }
    if (calls.length === 0) {
      if (rounds === 1 && !round.content.trim()) {
        throw new Error(t("backend.codex.agent.runCodexAgentInner.theCodexAgentReturnedAnEmptyResponse"));
      }
      if (!useTools && !jsonRetryUsed && rounds < maxRounds && round.content.trim()) {
        jsonRetryUsed = true;
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.noJsonObjectFoundInTheReply"));
        conv.push({ role: "assistant", content: round.content });
        conv.push({
          role: "user",
          content: "No JSON object could be parsed from that reply. Send the update again as exactly ONE JSON object" + ' with "writes" and "done", and nothing outside it except an optional <think> block.' + " Do not wrap it in prose and do not truncate it."
        });
        continue;
      }
      if (unresolvedErrors) {
        const saved = await persistClean();
        throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate", { keptSuffix: keptSuffix(saved) }));
      }
      if (changed.size === 0) {
        if (useTools) {
          throw new ToolProtocolError(t("backend.codex.agent.runCodexAgentInner.theCodexAgentNarratedInsteadOfCalling"));
        }
        throw new Error(t("backend.codex.agent.runCodexAgentInner.theCodexAgentRepliedWithoutAParsable"));
      }
      if (remaining.size > 0) {
        if (remaining.size < lastNudgeRemaining)
          coverageNudges = 0;
        if (coverageNudges < COVERAGE_NUDGES && rounds < maxRounds) {
          coverageNudges++;
          lastNudgeRemaining = remaining.size;
          const said = round.content.trim() || "(no reply)";
          conv.push(useTools ? assistantTurn(said, []) : { role: "assistant", content: said });
          conv.push({
            role: "user",
            content: `Still to account for: ${[...remaining].map((k) => `${k}.json`).join(", ")}.` + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.` + ` ${donePhrase}`
          });
          continue;
        }
        const saved = await persistClean();
        throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate2", { join: [...remaining].join(", "), keptSuffix: keptSuffix(saved) }));
      }
      break;
    }
    conv.push(useTools ? assistantTurn(round.content, calls) : { role: "assistant", content: round.content });
    const outcomes = [];
    const doneCalls = [];
    for (const call of calls) {
      if (call.name === "codex_done") {
        doneCalls.push(call);
        continue;
      }
      if (call.name === "codex_skip") {
        const raw = call.args["files"];
        const files = (Array.isArray(raw) ? raw : [raw]).filter((f) => isCodexFileKey(f) && !frozen.has(f));
        if (files.length === 0) {
          outcomes.push({ callId: call.call_id, file: null, errors: [`files: expected one or more of ${[...remaining].join(", ")}`] });
          continue;
        }
        const cleared = files.filter((f) => remaining.delete(f));
        outcomes.push({ callId: call.call_id, file: null, errors: [], skipCleared: cleared });
        continue;
      }
      if (call.name !== "codex_write") {
        outcomes.push({ callId: call.call_id, file: null, errors: [`Unknown tool "${call.name}", only codex_write, codex_skip and codex_done exist - resend the payload through codex_write`] });
        continue;
      }
      const fileRaw = call.args["file"];
      if (!isCodexFileKey(fileRaw)) {
        outcomes.push({ callId: call.call_id, file: null, errors: [`file: expected one of ${CODEX_FILE_KEYS.join(", ")} - resend this write under the right file`] });
        continue;
      }
      if (frozen.has(fileRaw)) {
        remaining.delete(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: [], skipped: true });
        continue;
      }
      const staged = stageWrite(fileRaw, call.args, working[fileRaw], validateOpts, opts.timelineAppendOnly === true);
      if (!staged.value) {
        rejectedFiles.add(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: staged.errors });
        continue;
      }
      working[fileRaw] = staged.value;
      changed.add(fileRaw);
      remaining.delete(fileRaw);
      rejectedFiles.delete(fileRaw);
      outcomes.push({
        callId: call.call_id,
        file: fileRaw,
        errors: [],
        ...staged.lockedKept.length ? { lockedKept: staged.lockedKept } : {},
        ...staged.lockedFieldsKept.length ? { lockedFieldsKept: staged.lockedFieldsKept } : {},
        ...staged.dropMisses.length ? { dropMisses: staged.dropMisses } : {},
        ...staged.archivedKept.length ? { archivedKept: staged.archivedKept } : {},
        ...staged.notes?.length ? { trimmed: staged.notes } : {}
      });
    }
    let sawDone = false;
    for (const call of doneCalls) {
      if (rejectedFiles.size > 0) {
        outcomes.push({
          callId: call.call_id,
          file: null,
          errors: [`Corrections still outstanding for: ${[...rejectedFiles].join(", ")}. Resend them before codex_done.`]
        });
        continue;
      }
      if (remaining.size > 0) {
        outcomes.push({
          callId: call.call_id,
          file: null,
          errors: [
            `Not yet. These files have not been written or skipped: ${[...remaining].map((k) => `${k}.json`).join(", ")}.` + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.`
          ]
        });
        continue;
      }
      sawDone = true;
      const note = call.args["note"];
      if (typeof note === "string" && note.trim())
        doneNote = note.trim();
      outcomes.push({ callId: call.call_id, file: null, errors: [] });
    }
    for (const d of newDangling(working, baselineDangling)) {
      if (changed.has(d.file))
        continue;
      for (const key of ["characters", "locations", "things"]) {
        if (!changed.has(key))
          continue;
        const original = opts.bundle[key].entities.find((e) => e.id === d.ref);
        if (original && !working[key].entities.some((e) => e.id === d.ref)) {
          working[key].entities.push(structuredClone(original));
          opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.keptStillReferencedByUnchangedJson", { ref: d.ref, file: d.file }));
        }
      }
    }
    let dangling = remaining.size === 0 ? newDangling(working, baselineDangling) : [];
    if (dangling.length > 0) {
      integrityRounds++;
      const stalled = dangling.length >= prevDanglingCount;
      const outOfRoad = integrityRounds >= INTEGRITY_ROUNDS || rounds >= maxRounds - 1;
      if (stalled || outOfRoad) {
        const stubborn = dangling.filter((d) => danglingSeen.has(danglingKey(d)));
        if (stubborn.length > 0) {
          const fixed = repairDanglingRefs(working, new Set(stubborn.map((d) => d.file).filter((file) => changed.has(file))));
          for (const r of fixed)
            opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.value", { r }));
          if (fixed.length > 0)
            dangling = newDangling(working, baselineDangling);
        }
      }
      prevDanglingCount = dangling.length;
      for (const d of dangling)
        danglingSeen.add(danglingKey(d));
    }
    const integrityErrors = dangling.map(formatDanglingRef);
    for (const o of outcomes) {
      if (o.errors.length)
        opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.rejected", { choice: o.file ? "yes" : "no", file: o.file ? o.file : "", errors0: o.errors[0] }));
    }
    for (const e of integrityErrors)
      opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.integrity", { e }));
    const hadErrors = outcomes.some((o) => o.errors.length > 0) || integrityErrors.length > 0;
    unresolvedErrors = hadErrors || rejectedFiles.size > 0;
    const lockedNote = (o) => {
      const bits = [];
      if (o.lockedKept?.length)
        bits.push(`locked, left untouched: ${o.lockedKept.join(", ")} - do not resend them`);
      if (o.lockedFieldsKept?.length)
        bits.push(`locked fields restored to the user's values on: ${o.lockedFieldsKept.join(", ")}`);
      if (o.dropMisses?.length)
        bits.push(`already absent, drop was a no-op: ${o.dropMisses.join(", ")}`);
      if (o.archivedKept?.length)
        bits.push(`resolved and archived, left alone: ${o.archivedKept.join(", ")} - never resend them`);
      if (o.trimmed?.length)
        bits.push(`${o.trimmed.join("; ")} - send only the few strongest keywords next time`);
      return bits.length ? ` (${bits.join("; ")})` : "";
    };
    const okNote = (o) => {
      if (o.skipCleared) {
        return o.skipCleared.length ? `noted, left unchanged: ${o.skipCleared.map((k) => `${k}.json`).join(", ")}` : "already accounted for";
      }
      if (o.skipped)
        return `skipped, ${o.file}.json is frozen by the user - do not resend it`;
      return o.file ? `ok, staged${lockedNote(o)}` : "ok";
    };
    const resultParts = outcomes.map((o) => ({
      type: "tool_result",
      tool_use_id: o.callId,
      content: o.errors.length ? `REJECTED, nothing from this write was staged - resend it corrected in full:
${o.errors.join(`
`)}` : okNote(o),
      ...o.errors.length ? { is_error: true } : {}
    }));
    const feedbackLines = outcomes.map((o) => o.errors.length ? `REJECTED ${o.file ? `${o.file}.json` : "write"}, nothing from it was staged - resend it corrected in full:
${o.errors.join(`
`)}` : o.file || o.skipCleared ? `${o.file ? `${o.file}.json ` : ""}${okNote(o)}` : "done acknowledged.");
    const pushFeedback = (extra) => {
      if (useTools) {
        if (extra)
          resultParts.push({ type: "text", text: extra });
        conv.push({ role: "user", content: resultParts });
      } else {
        conv.push({ role: "user", content: [...feedbackLines, extra].filter(Boolean).join(`

`) });
      }
    };
    if (!hadErrors) {
      const wantVerify = profile.codexThorough && sawDone && changed.size > 0 && !verifyRequested && !opts.skipVerify;
      if (sawDone && !wantVerify) {
        if (useTools)
          conv.push({ role: "user", content: resultParts });
        break;
      }
      if (wantVerify) {
        verifyRequested = true;
        pushFeedback(verifyNudge(promptCtx));
        continue;
      }
      if (remaining.size > 0) {
        pushFeedback(`Still to account for: ${[...remaining].map((k) => `${k}.json`).join(", ")}.` + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.` + ` ${donePhrase}`);
        continue;
      }
      const roundStaged = outcomes.some((o) => o.file !== null && !o.skipped && o.errors.length === 0);
      pushFeedback(roundStaged ? useTools ? "Writes staged. Call codex_done, or send corrected files if anything is left." : 'Writes staged. Respond with a JSON object: any corrected files in "writes", and "done": true to finish.' : useTools ? "Nothing was staged this round. Call codex_done, or send writes for unfrozen files." : 'Nothing was staged this round. Respond with a JSON object: writes for unfrozen files if needed, and "done": true.');
      continue;
    }
    const fixup = [];
    if (integrityErrors.length) {
      fixup.push(`Cross-file integrity errors:
${integrityErrors.join(`
`)}`);
    }
    fixup.push(useTools ? "Resend ONLY the rejected or offending files, corrected. Then call codex_done." : 'Respond with a JSON object containing ONLY the rejected or offending files, corrected, in "writes". Set "done": true once everything is fixed.');
    pushFeedback(fixup.join(`

`));
    if (rounds >= maxRounds) {
      const left = outcomes.flatMap((o) => o.errors).concat(integrityErrors);
      const saved = await persistClean();
      throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate3", { rounds, join: left.slice(0, 3).join(", "), keptSuffix: keptSuffix(saved) }));
    }
  }
  if (rejectedFiles.size > 0) {
    const saved = await persistClean();
    throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate4", { join: [...rejectedFiles].join(", "), keptSuffix: keptSuffix(saved) }));
  }
  if (remaining.size > 0) {
    const saved = await persistClean();
    throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate5", { join: [...remaining].join(", "), keptSuffix: keptSuffix(saved) }));
  }
  const repaired = repairDanglingRefs(working, new Set(changed));
  for (const r of repaired)
    opts.onDelta?.("text", t("backend.codex.agent.runCodexAgentInner.value", { r }));
  const finalIntegrity = newDanglingErrors(working, baselineDangling);
  if (finalIntegrity.length) {
    const saved = await persistClean();
    throw new CodexValidationError(t("backend.codex.agent.runCodexAgentInner.memoriaCouldnTFinishTheCodexUpdate6", { join: finalIntegrity.slice(0, 3).join(", "), keptSuffix: keptSuffix(saved) }));
  }
  if (opts.notes.migrateToTable) {
    const leftover = ["characters", "locations", "things"].filter((k) => working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0));
    if (leftover.length) {
      throw new Error(t("backend.codex.agent.runCodexAgentInner.tableMigrationLeftTiesOnTheRun", { join: leftover.map((k) => `${k}.json`).join(", ") }));
    }
  }
  if (opts.notes.migrateToInline && opts.bundle.relations.relations.length > 0) {
    const foldedTies = ["characters", "locations", "things"].some((k) => working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0));
    const lockedIds = new Set(["characters", "locations", "things"].flatMap((k) => working[k].entities.filter((e) => e.locked === true).map((e) => e.id)));
    const foldable = opts.bundle.relations.relations.some((r) => (r.type === "pair" ? [r.a, r.b] : r.members).some((m) => !lockedIds.has(m)));
    if (!foldedTies && foldable) {
      throw new Error(t("backend.codex.agent.runCodexAgentInner.inlineMigrationProducedNoTiesFromThe"));
    }
  }
  for (const key of changed) {
    try {
      await saveCodexFile(chatId, key, working[key], userId);
    } catch (err) {
      throw new Error(t("backend.codex.agent.runCodexAgentInner.failedToSaveJson", { key, describeError: describeError(err) }));
    }
  }
  return {
    changedFiles: [...changed],
    rounds,
    model: conn.model,
    usagePromptTokens: usagePrompt,
    usageCompletionTokens: usageCompletion,
    doneNote
  };
}

// src/backend/codex/backup.ts
var CODEX_BACKUP_KIND = "lumibooks.codex.backup";
var CODEX_BACKUP_VERSION = 1;
async function buildCodexBackup(chatId, userId) {
  const [files, cursor] = await Promise.all([
    readCodexFilesRaw(chatId, userId),
    loadCursor(chatId, userId)
  ]);
  return {
    kind: CODEX_BACKUP_KIND,
    version: CODEX_BACKUP_VERSION,
    chatId,
    savedAt: Date.now(),
    files,
    fileStates: cursor.fileStates,
    relationsTableMode: cursor.relationsTableMode,
    cursor
  };
}
function parseCodexBackup(raw, fallbackRelationsTable) {
  if (!raw || typeof raw !== "object")
    return { error: t("backend.codex.backup.parseCodexBackup.thatFileIsNotACodexBackup") };
  const v = raw;
  if (v.kind !== CODEX_BACKUP_KIND)
    return { error: t("backend.codex.backup.parseCodexBackup.thatFileIsNotACodexBackup") };
  if (typeof v.version !== "number" || v.version > CODEX_BACKUP_VERSION) {
    return { error: t("backend.codex.backup.parseCodexBackup.thisBackupWasWrittenByANewer", { version: String(v.version) }) };
  }
  if (!v.files || typeof v.files !== "object")
    return { error: t("backend.codex.backup.parseCodexBackup.theBackupHasNoCodexFilesIn") };
  const relationsTableMode = typeof v.relationsTableMode === "boolean" ? v.relationsTableMode : null;
  const relationsTable = relationsTableMode ?? fallbackRelationsTable;
  const values = [];
  for (const key of CODEX_FILE_KEYS) {
    const rawText = v.files[key];
    if (typeof rawText !== "string")
      continue;
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return { error: t("backend.codex.backup.parseCodexBackup.jsonInTheBackupIsNotValid", { key }) };
    }
    const result = validateCodexFile(key, parsed, { relationsTable });
    if (!result.ok)
      return { error: t("backend.codex.backup.parseCodexBackup.jsonInTheBackupIsInvalid", { key, errors0: result.errors[0] }) };
    values.push({ key, value: result.value });
  }
  if (values.length === 0)
    return { error: t("backend.codex.backup.parseCodexBackup.theBackupHasNoCodexFilesIn") };
  const fileStates = {};
  const rawStates = v.fileStates && typeof v.fileStates === "object" ? v.fileStates : {};
  for (const [key, state] of Object.entries(rawStates)) {
    if (!isCodexFileKey(key))
      continue;
    if (state === "on" || state === "noInject" || state === "frozen")
      fileStates[key] = state;
  }
  return {
    values,
    fileStates,
    relationsTableMode,
    chatId: typeof v.chatId === "string" ? v.chatId : undefined,
    cursor: v.cursor && typeof v.cursor === "object" ? normalizeCursor(v.cursor) : undefined
  };
}
var UNDO_DIR = "codex-undo";
function undoPath(chatId) {
  return `${UNDO_DIR}/${chatId}.json`;
}
async function snapshotCodexForUndo(chatId, userId, reason) {
  try {
    const backup = await buildCodexBackup(chatId, userId);
    const cursor = await loadCursor(chatId, userId).catch(() => null);
    const snap = { ...backup, reason, ...cursor ? { cursor } : {} };
    await spindle.userStorage.setJson(undoPath(chatId), snap, { indent: 0, userId });
  } catch (err) {
    warn(`codex undo snapshot failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
  }
}
async function readCodexUndo(chatId, userId) {
  try {
    if (!await spindle.userStorage.exists(undoPath(chatId), userId))
      return null;
    const raw = await spindle.userStorage.getJson(undoPath(chatId), { userId });
    if (!raw || typeof raw !== "object")
      return null;
    const v = raw;
    if (v.kind !== CODEX_BACKUP_KIND)
      return null;
    return v;
  } catch (err) {
    warn(`codex undo read failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    return null;
  }
}
async function codexUndoInfo(chatId, userId) {
  const snap = await readCodexUndo(chatId, userId);
  if (!snap)
    return null;
  return { savedAt: snap.savedAt, reason: typeof snap.reason === "string" ? snap.reason : "update" };
}
async function clearCodexUndo(chatId, userId) {
  await spindle.userStorage.delete(undoPath(chatId), userId).catch(() => {});
}
async function applyCodexBackup(chatId, userId, parsed, restoreCursor) {
  for (const { key, value } of parsed.values) {
    await saveCodexFile(chatId, key, value, userId);
  }
  await withCursorLock(chatId, userId, async () => {
    const saved = restoreCursor ?? (parsed.chatId === chatId ? parsed.cursor : undefined);
    const cur = saved ? structuredClone(saved) : await loadCursor(chatId, userId);
    cur.fileStates = parsed.fileStates;
    if (parsed.relationsTableMode !== null)
      cur.relationsTableMode = parsed.relationsTableMode;
    cur.updatedAt = Date.now();
    await saveCursor(chatId, cur, userId);
  });
}

// src/backend/codex/index.ts
function reportCodexFailure(userId, chatId, verb, err) {
  if (err instanceof CodexContextError || err instanceof CodexValidationError) {
    cb2?.onToast(userId, "error", err.message);
    return;
  }
  cb2?.onToast(userId, "error", t("backend.codex.index.reportCodexFailure.memoriaCouldnTTheCodex", { verb, shortErrorText: shortErrorText(err) }));
  if (err instanceof ToolProtocolError)
    cb2?.onToolsHint?.(userId, chatId);
}
function effectiveLoreLimitTokens(profile) {
  if (profile.codexLoreLimitUnit === "tokens")
    return profile.codexLoreLimitTokens;
  return Math.max(1, Math.floor(codexMaxInputTokens(profile) * profile.codexLoreLimitPercent / 100));
}
var cb2 = null;
function registerCodexCallbacks(c) {
  cb2 = c;
}
function nonEmpty(m) {
  return !!(m.content || "").trim();
}
function sizeOf(messages, unit) {
  return unit === "messages" ? messages.length : sumApproxTokens(messages);
}
function trimLag(tail, unit, lagValue) {
  if (lagValue <= 0)
    return tail.slice();
  if (unit === "messages") {
    return lagValue >= tail.length ? [] : tail.slice(0, tail.length - lagValue);
  }
  let reserved = 0;
  let cutoff = tail.length;
  for (let i = tail.length - 1;i >= 0; i--) {
    reserved += approximateTokensFromChars((tail[i].content || "").length);
    cutoff = i;
    if (reserved >= lagValue)
      break;
  }
  if (reserved < lagValue)
    return [];
  return tail.slice(0, cutoff);
}
function takeWindow(compressible, unit, windowValue, tokenBreakpoint) {
  const budget = unit === "messages" ? Math.max(1000, tokenBreakpoint) : windowValue;
  const maxCount = unit === "messages" ? Math.max(1, windowValue) : compressible.length;
  const out = [];
  let acc = 0;
  for (const m of compressible) {
    out.push(m);
    if (out.length >= maxCount)
      break;
    acc += approximateTokensFromChars((m.content || "").length);
    if (acc >= budget)
      break;
  }
  return out;
}
function windowReached(compressible, profile) {
  if (sizeOf(compressible, profile.codexWindowUnit) >= profile.codexWindowValue)
    return true;
  if (profile.codexWindowUnit === "messages" && sumApproxTokens(compressible) >= Math.max(1000, profile.codexTokenBreakpoint))
    return true;
  return false;
}
async function syncEntriesGuarded(chatId, userId, relationsTableFallback) {
  try {
    await syncCodexEntries(chatId, userId, relationsTableFallback);
  } catch (err) {
    warn(`codex entry sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb2?.onToast(userId, "error", t("backend.codex.index.syncEntriesGuarded.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
  }
}
var entriesEnsured = new Set;
var ENTRIES_ENSURED_CAP = 5000;
async function ensureCodexEntriesSynced(chatId, userId, profile) {
  if (!profile.codexEnabled)
    return;
  const key = `${userId}::${chatId}`;
  if (entriesEnsured.has(key))
    return;
  if (entriesEnsured.size >= ENTRIES_ENSURED_CAP)
    entriesEnsured.clear();
  entriesEnsured.add(key);
  try {
    await syncCodexEntries(chatId, userId, profile.codexRelationsTable);
  } catch (err) {
    entriesEnsured.delete(key);
    warn(`codex entry ensure-sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb2?.onToast(userId, "error", t("backend.codex.index.ensureCodexEntriesSynced.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
  }
}
async function planRun(chatId, userId, lagUnit, lagValue) {
  const messages = await spindle.chat.getMessages(chatId);
  const cursor = await loadCursor(chatId, userId);
  const byId = new Map(messages.map((m) => [m.id, m]));
  const posById = new Map(messages.map((m, i) => [m.id, i]));
  const consumedBeforeRewind = cursor.consumedSigs;
  let reconcile = cursor.pendingReconcile;
  let divergedAt = -1;
  for (let i = 0;i < cursor.consumedSigs.length; i++) {
    const rec = cursor.consumedSigs[i];
    const live = byId.get(rec.id);
    if (!live || msgSig(live.role, live.content || "") !== rec.sig) {
      divergedAt = i;
      break;
    }
  }
  const posOf = (id) => id ? posById.get(id) ?? -1 : -1;
  if (divergedAt >= 0) {
    let boundaryId = cursor.lastMsgId;
    if (boundaryId && !byId.has(boundaryId)) {
      boundaryId = null;
      for (let j = cursor.consumedSigs.length - 1;j >= 0; j--) {
        const id = cursor.consumedSigs[j].id;
        if (byId.has(id)) {
          boundaryId = id;
          break;
        }
      }
      if (!boundaryId && messages.length > 0) {
        boundaryId = messages[messages.length - 1].id;
      }
    }
    if (boundaryId && posOf(boundaryId) > posOf(cursor.reconcileUntilMsgId)) {
      cursor.reconcileUntilMsgId = boundaryId;
    }
    cursor.consumedSigs = cursor.consumedSigs.slice(0, divergedAt);
    cursor.lastMsgId = cursor.consumedSigs.length ? cursor.consumedSigs[cursor.consumedSigs.length - 1].id : cursor.prefixMsgId;
    cursor.pendingReconcile = true;
    reconcile = true;
  }
  if (cursor.pendingReconcile && cursor.reconcileUntilMsgId && !byId.has(cursor.reconcileUntilMsgId)) {
    cursor.reconcileUntilMsgId = messages.length ? messages[messages.length - 1].id : null;
  }
  let startPos = 0;
  if (cursor.lastMsgId) {
    const idx = posById.get(cursor.lastMsgId);
    if (idx !== undefined) {
      startPos = idx + 1;
    } else {
      let resume = -1;
      for (const rec of consumedBeforeRewind) {
        const p = posById.get(rec.id);
        if (p !== undefined) {
          resume = p;
          break;
        }
      }
      startPos = resume >= 0 ? resume : 0;
    }
  }
  const tail = messages.slice(startPos).filter(nonEmpty);
  const compressible = trimLag(tail, lagUnit, lagValue);
  return { messages, cursor, startPos, compressible, reconcile, rewound: divergedAt >= 0 };
}
async function activatedLoreText(chatId, userId, limitTokens) {
  const activated = await spindle.world_books.getActivated(chatId, userId).catch(() => null);
  if (!activated || activated.length === 0)
    return null;
  const ourBookId = await findBookForChat(chatId, userId).catch(() => null);
  const bookIds = new Set;
  for (const a of activated) {
    if (a.bookId && a.bookId !== ourBookId)
      bookIds.add(a.bookId);
  }
  if (bookIds.size === 0)
    return null;
  const entryById = new Map;
  for (const bookId of bookIds) {
    for (const entry of await listAllEntries(bookId, userId).catch(() => [])) {
      entryById.set(entry.id, entry);
    }
  }
  const capChars = limitTokens > 0 ? limitTokens * 4 : Number.POSITIVE_INFINITY;
  const parts = [];
  let used = 0;
  let skipped = false;
  for (const a of activated) {
    if (!a.bookId || a.bookId === ourBookId)
      continue;
    const entry = entryById.get(a.id);
    if (!entry)
      continue;
    const ext = entry.extensions || {};
    if (ext[EXTENSION_KEY])
      continue;
    if (ext[CODEX_ENTRY_EXTENSION_KEY])
      continue;
    const content = (entry.content || "").trim();
    if (!content)
      continue;
    const label = (entry.comment || "").trim();
    const block = label ? `[${label}]
${content}` : content;
    if (used + block.length > capChars) {
      skipped = true;
      continue;
    }
    parts.push(block);
    used += block.length;
  }
  if (skipped)
    parts.push(LORE_OMITTED_MARKER);
  if (parts.length === 0)
    return null;
  return parts.join(`

`);
}
var LORE_OMITTED_MARKER = "[...more lore omitted for size...]";
async function storySoFarText(chatId, userId, profile, chunkFirstIdx, posById) {
  if (!profile.codexExtraContext || profile.codexStorySoFarCount <= 0)
    return null;
  const entries = await listLmbEntries(chatId, userId).catch(() => []);
  const prior = entries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot && liveEndPosition(e.meta.msgIds, e.meta.lastMsgIdx, posById) < chunkFirstIdx).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0)).slice(-profile.codexStorySoFarCount);
  if (prior.length === 0)
    return null;
  return prior.map((c) => c.raw.content || "").filter(Boolean).join(`

`);
}
async function getCodexStatus(chatId, userId, profile) {
  const exists = await codexPresence(chatId, userId) === "present";
  if (!profile.codexEnabled && !exists)
    return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  try {
    const plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
    let backlogPasses = 0;
    let rest = plan.compressible;
    while (rest.length > 0 && backlogPasses < 99) {
      const w = takeWindow(rest, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      if (w.length === 0)
        break;
      rest = rest.slice(w.length);
      backlogPasses++;
    }
    return { exists, backlog: plan.compressible.length, lastRunAt: plan.cursor.lastRunAt, backlogPasses };
  } catch (err) {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  }
}
function previewTail(messages, profile) {
  if (profile.codexWindowUnit === "messages")
    return messages.slice(-Math.max(1, profile.codexWindowValue));
  const out = [];
  let acc = 0;
  for (let i = messages.length - 1;i >= 0; i--) {
    out.unshift(messages[i]);
    acc += approximateTokensFromChars((messages[i].content || "").length);
    if (acc >= profile.codexWindowValue)
      break;
  }
  return out;
}
async function dryRunCodex(chatId, profile, settings, userId) {
  const conn = await resolveCodexConnection(profile, userId);
  const diagnostics = [];
  let plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
  let chunk;
  if (plan.compressible.length > 0) {
    chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
    if (!windowReached(plan.compressible, profile)) {
      diagnostics.push({ message: t("backend.codex.index.dryRunCodex.theWindowHasNotFilledYetAutomation") });
    }
  } else {
    const eager = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (eager.compressible.length > 0) {
      plan = eager;
      chunk = takeWindow(eager.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      diagnostics.push({ message: t("backend.codex.index.dryRunCodex.theLagReserveStillHoldsTheseTurns") });
    } else {
      const eligible = plan.messages.filter(nonEmpty);
      if (eligible.length === 0)
        throw new Error(t("backend.codex.index.dryRunCodex.chatHasNoMessages"));
      chunk = previewTail(eligible, profile);
      diagnostics.push({ message: t("backend.codex.index.dryRunCodex.theCodexHasReadEverythingSoThis") });
    }
  }
  if (chunk.length === 0)
    throw new Error(t("backend.codex.index.dryRunCodex.noConsumableWindowSendAMessageAnd"));
  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = frozenCodexFiles(plan.cursor.fileStates);
  if (frozenFiles.size === CODEX_FILE_KEYS.length) {
    throw new Error(t("backend.codex.index.dryRunCodex.everyCodexRecordIsFrozenUnfreezeOne"));
  }
  const notes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`)
  };
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const firstIdx = posById.get(chunk[0].id) ?? 0;
  const lastIdx = posById.get(chunk[chunk.length - 1].id) ?? firstIdx;
  const chunkLabel = t("backend.codex.index.chunkLabel.messagesOf", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1, length: plan.messages.length });
  const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
  const storySoFar = await storySoFarText(chatId, userId, profile, firstIdx, posById);
  const system = await resolveMacrosWithDiagnostics(buildCodexSystemPrompt(promptCtx), chatId, userId, diagnostics);
  const user = buildCodexUserMessage(promptCtx, bundle, plan.messages.slice(firstIdx, lastIdx + 1), chunkLabel, firstIdx, notes, lore, storySoFar);
  const preset = settings.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey);
  const overrideCount = preset?.templates ? Object.keys(preset.templates).length : 0;
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.connection", { name: conn.name, provider: conn.provider, model: conn.model }) });
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.transport", { choice: promptCtx.useTools ? "yes" : "no" }) });
  diagnostics.push({
    message: t("backend.codex.index.dryRunCodex.updateDeliveryAndEveryRecordMustBe", { choice: promptCtx.sequential ? "yes" : "no", length: [...promptCtx.activeFiles].length })
  });
  diagnostics.push({
    message: t("backend.codex.index.dryRunCodex.preset", { choice: preset ? "yes" : "no", displayName: preset ? preset.displayName : "", choice2: overrideCount ? "yes" : "no", value: overrideCount ? overrideCount : "", value2: overrideCount ? overrideCount : 0 })
  });
  diagnostics.push({
    message: t("backend.codex.index.dryRunCodex.relationsMode", { choice: profile.codexRelationsTable ? "yes" : "no", choice2: notes.migrateToTable || notes.migrateToInline ? "yes" : "no" })
  });
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.activeFiles", { join: [...promptCtx.activeFiles].join(", ") }) });
  if (frozenFiles.size)
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.frozenOmittedFromThePromptEntirely", { join: [...frozenFiles].join(", ") }) });
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.chunkMessage", { chunkLabel, length: chunk.length }) });
  if (plan.reconcile)
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.reconcilePendingTheStoryWasEditedBehind") });
  if (notes.loadProblems.length)
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.unreadableFilesShownEmpty", { join: notes.loadProblems.join(", ") }) });
  const lockedEntities = [];
  const fieldLocked = [];
  for (const key of ["characters", "locations", "things"]) {
    for (const e of bundle[key].entities) {
      if (e.locked === true)
        lockedEntities.push(e.id);
      if (Array.isArray(e.lockedFields) && e.lockedFields.length)
        fieldLocked.push(e.id);
    }
  }
  if (lockedEntities.length || fieldLocked.length) {
    diagnostics.push({
      message: t("backend.codex.index.dryRunCodex.locksLockedEntitWithLockedFieldsMasked", { length: lockedEntities.length, length2: fieldLocked.length })
    });
  }
  if (storySoFar)
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.storySoFarContextTokens", { length: approximateTokensFromChars(storySoFar.length) }) });
  if (lore)
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.activatedLoreReferenceTokens", { length: approximateTokensFromChars(lore.length) }) });
  if (lore?.includes(LORE_OMITTED_MARKER)) {
    diagnostics.push({
      message: t("backend.codex.index.dryRunCodex.activatedLoreExceededTheLoreLimitTokens", { effectiveLoreLimitTokens: effectiveLoreLimitTokens(profile) })
    });
  }
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.thoroughMode", { choice: profile.codexThorough ? "yes" : "no" }) });
  diagnostics.push({
    message: t("backend.codex.index.dryRunCodex.promptSizeTokensSystemTokensUserCodex", { length: approximateTokensFromChars(system.length), length2: approximateTokensFromChars(user.length), codexMaxInputTokens: codexMaxInputTokens(profile) })
  });
  const promptTokens = approximateTokensFromChars(system.length + user.length);
  if (promptTokens > codexMaxInputTokens(profile)) {
    diagnostics.push({ message: t("backend.codex.index.dryRunCodex.wouldFail", { message: new CodexContextError(promptTokens, codexMaxInputTokens(profile)).message }) });
  }
  diagnostics.push({ message: t("backend.codex.index.dryRunCodex.samplerParametersBeingSentOnTheWire", { stringify: JSON.stringify(buildCodexSamplerParameters(profile)) }) });
  return {
    messages: [
      { role: promptRoleFor(profile, "codex"), content: system },
      { role: "user", content: user }
    ],
    diagnostics
  };
}
async function runChunk(chatId, userId, profile, plan, chunk, automation, externalSignal, progress, buildUserText, wantLore = false) {
  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = frozenCodexFiles(plan.cursor.fileStates);
  const notes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`)
  };
  const settings = await loadSettings(userId);
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);
  if (notes.migrateToTable || notes.migrateToInline) {
    const blocked = ["characters", "locations", "things", "relations"].filter((k) => frozenFiles.has(k));
    if (blocked.length) {
      throw new Error(t("backend.codex.index.runChunk.theRelationsFormatChangedUnfreezeSoMemoria", { join: blocked.map((k) => `${k}.json`).join(", ") }));
    }
  }
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const firstIdx = posById.get(chunk[0].id) ?? -1;
  const lastIdx = posById.get(chunk[chunk.length - 1].id) ?? -1;
  const chunkLabel = t("backend.codex.index.chunkLabel.messagesOf", { firstIdx1: firstIdx + 1, lastIdx1: lastIdx + 1, length: plan.messages.length });
  const lore = !buildUserText || wantLore ? await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile)) : null;
  const storySoFar = buildUserText ? null : await storySoFarText(chatId, userId, profile, firstIdx, posById);
  appendStreamText(userId, chatId, "codex", "text", `${progress.chars > 0 ? `

` : ""}\u2501\u2501\u2501 ${chunkLabel} \u2501\u2501\u2501
`);
  const result = await runCodexAgent({
    chatId,
    userId,
    profile,
    promptCtx,
    bundle,
    chunk: plan.messages.slice(firstIdx, lastIdx + 1),
    chunkLabel,
    chunkFirstIndex: firstIdx,
    notes,
    lore,
    storySoFar,
    timelineAppendOnly: !notes.reconcile,
    ...buildUserText ? { userTextOverride: buildUserText(promptCtx, bundle, notes, chunkLabel, lore) } : {},
    progressBase: progress,
    externalSignal,
    onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
    onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
  });
  if (notes.migrateToInline) {
    const lockedIds = new Set(["characters", "locations", "things"].flatMap((k) => bundle[k].entities.filter((e) => e.locked === true).map((e) => e.id)));
    const stuck = bundle.relations.relations.filter((r) => (r.type === "pair" ? [r.a, r.b] : r.members).every((m) => lockedIds.has(m))).length;
    if (stuck > 0) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.runChunk.relationBetweenLockedEntriesCouldNotBe", { stuck }));
    }
    await saveCodexFile(chatId, "relations", { relations: [] }, userId).catch((err) => warn(`codex: failed to clear relations.json after inline migration: ${describeError(err)}`));
  }
  for (let i = plan.startPos;i <= lastIdx; i++) {
    const m = plan.messages[i];
    plan.cursor.consumedSigs.push({ id: m.id, sig: msgSig(m.role, m.content || "") });
  }
  plan.cursor.lastMsgId = plan.messages[lastIdx].id;
  const reconcileUntilPos = plan.cursor.reconcileUntilMsgId ? plan.messages.findIndex((m) => m.id === plan.cursor.reconcileUntilMsgId) : -1;
  if (!plan.cursor.reconcileUntilMsgId || reconcileUntilPos !== -1 && lastIdx >= reconcileUntilPos) {
    plan.cursor.pendingReconcile = false;
    plan.cursor.reconcileUntilMsgId = null;
  }
  invalidateCodexInjectionCache(chatId);
  await withCursorLock(chatId, userId, async () => {
    const liveCursor = await loadCursor(chatId, userId).catch((err) => {
      warn(`codex: live cursor re-read failed before save: ${describeError(err)}`);
      return null;
    });
    if (liveCursor) {
      plan.cursor.fileStates = liveCursor.fileStates;
      plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
    }
    plan.cursor.relationsTableMode = profile.codexRelationsTable;
    plan.cursor.lastRunAt = Date.now();
    plan.cursor.lastRunStats = {
      rounds: result.rounds,
      promptTokens: result.usagePromptTokens,
      completionTokens: result.usageCompletionTokens,
      model: result.model,
      ...result.doneNote ? { note: result.doneNote } : {}
    };
    plan.cursor.runs += 1;
    await saveCursor(chatId, plan.cursor, userId);
  });
  await publishCodexPool(chatId, userId, profile, result.changedFiles, "run");
  await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
  if (result.changedFiles.length > 0) {
    cb2?.onToast(userId, "success", t("backend.codex.index.runChunk.memoriaUpdatedTheCodexFile", { length: result.changedFiles.length }), automation);
  }
  cb2?.onStateChange(userId, chatId);
}
async function drain(chatId, userId, profile, lagValue, requireWindow, automation) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.drain.memoriaIsUpdatingTheCodex")))
    return null;
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    let runs = 0;
    const progress = { chars: 0, thinking: 0 };
    const DRAIN_PASS_CAP = 500;
    let prevStartPos = -1;
    for (let pass = 0;pass < DRAIN_PASS_CAP; pass++) {
      if (controller.signal.aborted)
        throw new AbortedSummarizerError;
      const plan = await planRun(chatId, userId, profile.codexLagUnit, lagValue);
      if (plan.compressible.length === 0)
        break;
      if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
        break;
      if (requireWindow && !windowReached(plan.compressible, profile))
        break;
      if (plan.rewound) {
        prevStartPos = plan.startPos - 1;
      } else if (plan.startPos <= prevStartPos) {
        warn(`codex drain stalled at message ${plan.startPos + 1} for ${chatId.slice(0, 8)} after ${runs} pass${runs === 1 ? "" : "es"}, stopping`);
        break;
      }
      prevStartPos = plan.startPos;
      const chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      await runChunk(chatId, userId, profile, plan, chunk, automation, controller.signal, progress);
      runs++;
    }
    return runs;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
async function maybeRunCodex(chatId, profile, settings, userId) {
  if (!settings.enabled || !profile.codexEnabled)
    return;
  if (await forkCodexPending(chatId, userId).catch(() => false))
    return;
  await ensureCodexEntriesSynced(chatId, userId, profile);
  if (profile.codexManualOnly)
    return;
  try {
    await snapshotCodexForUndo(chatId, userId, t("backend.codex.index.maybeRunCodex.automaticUpdate"));
    await drain(chatId, userId, profile, profile.codexLagValue, true, true);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", t("backend.codex.index.maybeRunCodex.memoriaClosesTheCodexForNow"));
      return;
    }
    warn(`codex auto run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
  }
}
var CONTEXT_ERROR_RE = /context[ _](?:window|length|size|limit)|maximum context|prompt is too long|too many tokens|max(?:imum)? (?:input )?tokens|token limit|input is too (?:long|large)/i;
async function runCodexNow(chatId, profile, userId, mode = "slow", settings = null) {
  if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === chatId)) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.runCodexNow.memoriaIsAlreadyUpdatingTheCodex"));
    return;
  }
  if (await forkCodexPending(chatId, userId).catch(() => false)) {
    cb2?.onToast(userId, "info", t("backend.codex.index.runCodexNow.memoriaIsStillCarryingTheCodexInto"));
    return;
  }
  await ensureCodexEntriesSynced(chatId, userId, profile);
  try {
    const runs = mode === "slow" ? await drain(chatId, userId, profile, 0, false, false) : await catchupCodex(chatId, profile, settings, userId, mode);
    if (runs === 0) {
      const cursor = await loadCursor(chatId, userId).catch(() => null);
      if (cursor && CODEX_FILE_KEYS.every((k) => cursor.fileStates[k] === "frozen")) {
        cb2?.onToast(userId, "info", t("backend.codex.index.runCodexNow.everyCodexRecordIsFrozenUnfreezeOne"));
        return;
      }
      const swept = await maybeReconcileSweep(chatId, profile, userId);
      if (!swept)
        cb2?.onToast(userId, "info", t("backend.codex.index.runCodexNow.theCodexIsAlreadyCaughtUp"));
    }
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", t("backend.codex.index.runCodexNow.memoriaClosesTheCodexForNow"));
      return;
    }
    warn(`codex manual run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
    if (mode !== "slow" && !(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.runCodexNow.fastCatchUpNeedsTheCodexModel"));
    }
  }
}
var CATCHUP_PASS_CAP = 200;
function liveSpan(e, posById) {
  let start = Number.MAX_SAFE_INTEGER;
  let end = -1;
  for (const id of e.meta.msgIds) {
    const p = posById.get(id);
    if (p === undefined)
      continue;
    if (p < start)
      start = p;
    if (p > end)
      end = p;
  }
  return { start, end };
}
function entryBlock(e) {
  const head = (e.raw.comment || "").trim();
  const text = (e.raw.content || "").trim();
  return head ? `[${head}]
${text}` : text;
}
function nextSummaryBatch(plan, chapters, profile) {
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const spans = chapters.map((e) => ({ e, ...liveSpan(e, posById) })).filter((s) => s.end >= plan.startPos && s.start !== Number.MAX_SAFE_INTEGER).sort((a, b) => a.start - b.start || a.end - b.end);
  if (spans.length === 0)
    return null;
  const budget = Math.max(4000, profile.codexTokenBreakpoint);
  const blocks = [];
  let used = 0;
  let pos = plan.startPos;
  let endIdx = -1;
  for (const s of spans) {
    if (s.end < pos)
      continue;
    if (s.start > pos) {
      let gapEnd = s.start - 1;
      if (blocks.length === 0) {
        let acc = 0;
        for (let i = pos;i < s.start; i++) {
          acc += approximateTokensFromChars((plan.messages[i].content || "").length);
          if (acc >= budget && i < s.start - 1) {
            gapEnd = i;
            break;
          }
        }
      }
      const gapText = renderTranscript(plan.messages.slice(pos, gapEnd + 1), true, pos);
      if (gapText.trim()) {
        const gapTokens = approximateTokensFromChars(gapText.length);
        if (blocks.length > 0 && used + gapTokens > budget)
          break;
        blocks.push(`RAW TURNS (no chapter covers messages ${pos + 1}-${gapEnd + 1} of ${plan.messages.length}):
${gapText}`);
        used += gapTokens;
      }
      pos = gapEnd + 1;
      endIdx = Math.max(endIdx, gapEnd);
      if (gapEnd < s.start - 1)
        break;
      if (used >= budget)
        break;
    }
    const block = entryBlock(s.e);
    const tokens = approximateTokensFromChars(block.length);
    if (blocks.length > 0 && used + tokens > budget)
      break;
    blocks.push(block);
    used += tokens;
    pos = Math.max(pos, s.end + 1);
    endIdx = Math.max(endIdx, s.end);
    if (used >= budget)
      break;
  }
  if (endIdx < plan.startPos || blocks.length === 0)
    return null;
  return { endIdx, blocks };
}
async function activeStoryContext(chatId, userId, messages) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, true);
  const posById = new Map(messages.map((m, i) => [m.id, i]));
  const items = coverage.activeEntries.map((e) => {
    const s = liveSpan(e, posById);
    return { pos: s.start !== Number.MAX_SAFE_INTEGER ? s.start : e.meta.firstMsgIdx ?? 0, text: entryBlock(e) };
  }).filter((b) => b.text);
  let lastCovered = -1;
  for (let i = 0;i < messages.length; i++) {
    if (coverage.coveredBy.has(messages[i].id))
      lastCovered = i;
  }
  const tailStart = lastCovered + 1;
  let runStart = -1;
  let runHasContent = false;
  const flushRun = (endIdx) => {
    if (runStart !== -1 && runHasContent) {
      const text = renderTranscript(messages.slice(runStart, endIdx + 1), true, runStart);
      if (text.trim()) {
        items.push({ pos: runStart, text: `RAW TURNS (no summary covers messages ${runStart + 1}-${endIdx + 1}):
${text}` });
      }
    }
    runStart = -1;
    runHasContent = false;
  };
  for (let i = 0;i < tailStart; i++) {
    const m = messages[i];
    if (coverage.coveredBy.has(m.id)) {
      flushRun(i - 1);
      continue;
    }
    if (runStart === -1)
      runStart = i;
    if ((m.content || "").trim() && !isExcluded(m))
      runHasContent = true;
  }
  flushRun(tailStart - 1);
  const books = items.sort((a, b) => a.pos - b.pos).map((b) => b.text);
  const tailText = tailStart < messages.length ? renderTranscript(messages.slice(tailStart), true, tailStart) : "";
  return { books, tailTranscript: tailText.trim() ? tailText : null };
}
async function catchupCodex(chatId, profile, settings, userId, mode) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.catchupCodex.memoriaIsCatchingUpTheCodex", { choice: mode === "ultra" ? "yes" : "no" }))) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.catchupCodex.memoriaIsAlreadyWorkingOnTheCodex"));
    return null;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    controller.signal.addEventListener("abort", () => {
      abortBusy(userId, chatId, "chapter");
      abortBusy(userId, chatId, "arc");
    }, { once: true });
    const shelfPending = await forkShelfPending(chatId, userId).catch(() => false);
    if (settings && profile.autoCreate && !profile.showMemoryPreviews && !shelfPending) {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
      await maybeRunArcCheck(chatId, profile, settings, userId, true);
    }
    if (controller.signal.aborted)
      throw new AbortedSummarizerError;
    const progress = { chars: 0, thinking: 0 };
    let runs = 0;
    if (mode === "fast") {
      const entries = await listLmbEntries(chatId, userId);
      const coverage = await buildCoverage(chatId, userId, entries, true);
      let prevStart = -1;
      for (let pass = 0;pass < CATCHUP_PASS_CAP; pass++) {
        if (controller.signal.aborted)
          throw new AbortedSummarizerError;
        const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
        if (plan.compressible.length === 0)
          break;
        if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
          break;
        if (!plan.rewound && plan.startPos <= prevStart) {
          warn(`codex fast catch-up stalled at message ${plan.startPos + 1} for ${chatId.slice(0, 8)}, stopping`);
          break;
        }
        prevStart = plan.startPos;
        const batch = nextSummaryBatch(plan, coverage.chapters, profile);
        if (!batch)
          break;
        await runChunk(chatId, userId, profile, plan, plan.messages.slice(plan.startPos, batch.endIdx + 1), false, controller.signal, progress, (ctx, bundle, notes, label) => buildCodexSummaryCatchupMessage(ctx, bundle, batch.blocks, label, notes));
        runs++;
      }
    }
    const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (plan.compressible.length === 0)
      return runs;
    if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
      return runs;
    if (mode === "ultra") {
      const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
      await runChunk(chatId, userId, profile, plan, plan.messages.slice(plan.startPos), false, controller.signal, progress, (ctx, bundle, notes, label, lore) => buildCodexUltraMessage(ctx, bundle, books, tailTranscript, label, notes, lore), true);
    } else {
      await runChunk(chatId, userId, profile, plan, plan.compressible, false, controller.signal, progress);
    }
    return runs + 1;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
async function maybeReconcileSweep(chatId, profile, userId) {
  const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
  if (plan.compressible.length > 0 || !plan.reconcile)
    return false;
  if (await codexPresence(chatId, userId) !== "present")
    return false;
  if (plan.cursor.relationsTableMode !== null && plan.cursor.relationsTableMode !== profile.codexRelationsTable)
    return false;
  if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
    return false;
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.maybeReconcileSweep.memoriaIsReconcilingTheCodexWithThe")))
    return false;
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const diskMode = plan.cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const frozen = frozenCodexFiles(plan.cursor.fileStates);
    const notes = {
      reconcile: true,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const sweepSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, sweepSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexReconcileMessage(promptCtx, bundle, books, tailTranscript, notes, lore),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const liveCursor = await loadCursor(chatId, userId).catch((err) => {
        warn(`codex: live cursor re-read failed before sweep save: ${describeError(err)}`);
        return null;
      });
      if (liveCursor) {
        plan.cursor.fileStates = liveCursor.fileStates;
        plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
        plan.cursor.refreshPending = liveCursor.refreshPending;
      }
      plan.cursor.pendingReconcile = false;
      plan.cursor.reconcileUntilMsgId = null;
      plan.cursor.lastRunAt = Date.now();
      plan.cursor.lastRunStats = {
        rounds: result.rounds,
        promptTokens: result.usagePromptTokens,
        completionTokens: result.usageCompletionTokens,
        model: result.model,
        ...result.doneNote ? { note: result.doneNote } : {}
      };
      plan.cursor.runs += 1;
      await saveCursor(chatId, plan.cursor, userId);
    });
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "run");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", result.changedFiles.length > 0 ? t("backend.codex.index.maybeReconcileSweep.memoriaReconciledTheCodexWithTheEdited", { length: result.changedFiles.length }) : t("backend.codex.index.maybeReconcileSweep.memoriaCheckedTheCodexAgainstTheEdited"));
    cb2?.onStateChange(userId, chatId);
    return true;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
var INJECTION_CACHE_TTL_MS = 60000;
var INJECTION_CACHE_CAP = 200;
var injectionTextCache = new Map;
var fileTokensCache = new Map;
var tokenCountEpochs = new Map;
function invalidateCodexTokenCounts(userId) {
  tokenCountEpochs.set(userId, (tokenCountEpochs.get(userId) ?? 0) + 1);
  for (const [chatId, cached] of fileTokensCache) {
    if (cached.userId === userId)
      fileTokensCache.delete(chatId);
  }
}
var codexRevisions = new Map;
function getCodexRevision(chatId) {
  return codexRevisions.get(chatId) ?? 0;
}
function invalidateCodexInjectionCache(chatId, contentChanged = true) {
  if (chatId) {
    injectionTextCache.delete(chatId);
    fileTokensCache.delete(chatId);
    if (contentChanged)
      codexRevisions.set(chatId, (codexRevisions.get(chatId) ?? 0) + 1);
    while (codexRevisions.size > INJECTION_CACHE_CAP) {
      const oldest = codexRevisions.keys().next().value;
      if (oldest === undefined || oldest === chatId)
        break;
      codexRevisions.delete(oldest);
    }
  } else {
    injectionTextCache.clear();
    fileTokensCache.clear();
  }
}
async function getCodexTokenCounts(chatId, userId, profile) {
  const epoch = tokenCountEpochs.get(userId) ?? 0;
  const cached = fileTokensCache.get(chatId);
  if (cached && cached.userId === userId && cached.forceConstant === (profile.codexActivationMode === "always") && Date.now() - cached.at < INJECTION_CACHE_TTL_MS)
    return cached.counts;
  let counts = { files: {}, constant: 0, approximate: false };
  if (await codexPresence(chatId, userId) === "present") {
    const cursor = await loadCursor(chatId, userId);
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: cursor.relationsTableMode ?? profile.codexRelationsTable });
    counts = await measureCodexTokens(bundle, userId, cursor.fileStates, profile.codexActivationMode === "always");
    counts.approximate ||= problems.length > 0;
  }
  if (epoch === (tokenCountEpochs.get(userId) ?? 0)) {
    fileTokensCache.set(chatId, { at: Date.now(), userId, forceConstant: profile.codexActivationMode === "always", counts });
  }
  while (fileTokensCache.size > INJECTION_CACHE_CAP) {
    const oldest = fileTokensCache.keys().next().value;
    if (oldest === undefined)
      break;
    fileTokensCache.delete(oldest);
  }
  return counts;
}
async function buildCodexInjectionText(chatId, userId, profile) {
  if (!profile.codexEnabled)
    return null;
  const cached = injectionTextCache.get(chatId);
  if (cached && Date.now() - cached.at < INJECTION_CACHE_TTL_MS)
    return cached.text;
  let exists;
  try {
    exists = await codexPresence(chatId, userId) === "present";
  } catch (err) {
    warn(`codex injection text skipped, storage fault: ${describeError(err)}`);
    return null;
  }
  let text = null;
  if (exists) {
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    for (const key of CODEX_FILE_KEYS) {
      const st = cursor.fileStates[key];
      if (st === "noInject" || st === "frozen") {
        bundle[key] = emptyCodexFile(key);
      }
    }
    text = bundleIsEmpty(bundle) ? null : renderCodexForInjection(bundle) || null;
  }
  if (injectionTextCache.has(chatId))
    injectionTextCache.delete(chatId);
  injectionTextCache.set(chatId, { at: Date.now(), text });
  while (injectionTextCache.size > INJECTION_CACHE_CAP) {
    const oldest = injectionTextCache.keys().next().value;
    if (oldest === undefined)
      break;
    injectionTextCache.delete(oldest);
  }
  return text;
}
async function publishCodexPool(chatId, userId, profile, changedFiles, reason) {
  try {
    let presence;
    try {
      presence = await codexPresence(chatId, userId);
    } catch (err) {
      warn(`codex pool publish skipped, storage fault: ${describeError(err)}`);
      return;
    }
    if (presence === "absent") {
      publishCodexWiped(chatId, userId);
      return;
    }
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const rendered = await buildCodexInjectionText(chatId, userId, profile);
    publishCodexSnapshot(chatId, {
      chatId,
      userId,
      files: bundle,
      fileStates: cursor.fileStates,
      runs: cursor.runs,
      updatedAt: Date.now()
    }, rendered);
    publishCodexUpdated({ chatId, userId, changedFiles, reason });
  } catch (err) {
    warn(`codex pool publish failed: ${describeError(err)}`);
  }
}
async function getCodexPanelState(chatId, userId) {
  const exists = await codexExists(chatId, userId);
  if (!exists)
    return { fileStates: {}, staleFiles: [], refreshPending: [] };
  const cursor = await loadCursor(chatId, userId);
  const staleFiles = [];
  for (const [file, st] of Object.entries(cursor.fileStates)) {
    if (st !== "frozen")
      continue;
    const at = cursor.frozenAtRuns[file];
    if (typeof at === "number" && cursor.runs > at)
      staleFiles.push(file);
  }
  return { fileStates: cursor.fileStates, staleFiles, refreshPending: cursor.refreshPending };
}
async function setCodexFileState(chatId, userId, file, state, relationsTableFallback) {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    const prevState = cursor.fileStates[file] ?? "on";
    if (state === "on")
      delete cursor.fileStates[file];
    else
      cursor.fileStates[file] = state;
    if (state === "frozen") {
      cursor.frozenAtRuns[file] = cursor.runs;
      cursor.refreshPending = cursor.refreshPending.filter((f) => f !== file);
    } else {
      const at = cursor.frozenAtRuns[file];
      if (prevState === "frozen" && typeof at === "number" && cursor.runs > at && !cursor.refreshPending.includes(file)) {
        cursor.refreshPending.push(file);
      }
      delete cursor.frozenAtRuns[file];
    }
    await saveCursor(chatId, cursor, userId);
  });
  invalidateCodexInjectionCache(chatId, false);
  await syncEntriesGuarded(chatId, userId, relationsTableFallback);
}
async function rebuildCodex(chatId, profile, userId, mode = "slow", settings = null) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.rebuildCodex.memoriaIsClearingTheCodexForA"))) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.rebuildCodex.memoriaIsAlreadyWorkingOnTheCodex"));
    return;
  }
  try {
    let cursorFault = null;
    let frozenKeys = new Set;
    await withCursorLock(chatId, userId, async () => {
      let prev;
      try {
        prev = await loadCursor(chatId, userId);
      } catch (err) {
        cursorFault = err;
        return;
      }
      frozenKeys = new Set(CODEX_FILE_KEYS.filter((k) => prev.fileStates[k] === "frozen"));
      const fresh = emptyCursor();
      fresh.fileStates = prev.fileStates;
      for (const k of frozenKeys)
        fresh.frozenAtRuns[k] = 0;
      if (frozenKeys.size > 0)
        fresh.relationsTableMode = prev.relationsTableMode;
      await saveCursor(chatId, fresh, userId);
    });
    if (cursorFault !== null) {
      cb2?.onToast(userId, "error", t("backend.codex.index.rebuildCodex.memoriaCouldnTReadTheCodexCursor", { shortErrorText: shortErrorText(cursorFault) }));
      return;
    }
    const failed = [];
    for (const key of CODEX_FILE_KEYS) {
      if (frozenKeys.has(key))
        continue;
      await saveCodexFile(chatId, key, emptyCodexFile(key), userId).catch(() => failed.push(key));
    }
    invalidateCodexInjectionCache(chatId);
    if (failed.length > 0) {
      cb2?.onToast(userId, "error", t("backend.codex.index.rebuildCodex.memoriaCouldnTClearCodexFileRun", { length: failed.length }));
      return;
    }
    publishCodexWiped(chatId, userId);
    await wipeCodexEntries(chatId, userId).catch((err) => {
      warn(`codex rebuild: entry wipe failed: ${describeError(err)}`);
      cb2?.onToast(userId, "error", t("backend.codex.index.rebuildCodex.memoriaCouldnTClearTheCodexLorebook", { shortErrorText: shortErrorText(err) }));
    });
  } finally {
    clearBusy(userId, chatId, "codex");
  }
  await runCodexNow(chatId, profile, userId, mode, settings);
}
async function runCodexTidy(chatId, profile, userId, only, target) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.runCodexTidy.memoriaIsTidyingTheCodex"))) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.runCodexTidy.memoriaIsAlreadyWorkingOnTheCodex"));
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  const callBudget = { remaining: 6, used: 0 };
  let started = false;
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.runCodexTidy.theRelationsFormatChangedRunUpdateNow"));
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    let { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const frozenFiles = frozenCodexFiles(cursor.fileStates);
    const broken = new Set(problems.map((p) => p.file));
    const targets = [...new Set(only ?? CODEX_FILE_KEYS)].filter((k) => !frozenFiles.has(k) && !broken.has(k) && !fileIsEmpty(bundle, k));
    if (!targets.length) {
      cb2?.onToast(userId, "info", t("backend.codex.index.runCodexTidy.nothingToTidyThoseRecordsAreEmpty"));
      return;
    }
    const measure = async () => {
      const sections = renderCodexFileSections(bundle);
      let tokens = 0;
      let approximate = false;
      for (const key of targets) {
        const count = await countCodexText(sections[key], userId);
        tokens += count.tokens;
        approximate ||= count.approximate;
      }
      return { tokens, approximate };
    };
    let current = await measure();
    const { limit, modelTarget } = resolveTidyTarget(current.tokens, target);
    if (current.tokens <= limit) {
      cb2?.onToast(userId, "info", t("backend.codex.index.runCodexTidy.theSelectedRecordsAlreadyFitTokensLimit", { limit }));
      return;
    }
    await snapshotCodexForUndo(chatId, userId, "tidy");
    started = true;
    const tidySettings = await loadSettings(userId);
    const promptCtx = { ...makeCodexPromptCtx(profile, tidySettings.customPresets, frozenFiles), sequential: false };
    const progressBase = { chars: 0, thinking: 0 };
    while (current.tokens > limit && callBudget.remaining > 0) {
      if (controller.signal.aborted)
        throw new AbortedSummarizerError;
      appendStreamText(userId, chatId, "codex", "text", t("backend.codex.index.runCodexTidy.tidyTokensLimitModelTargetCallsLeft", { tokens: current.tokens, limit, modelTarget, remaining: callBudget.remaining }));
      const result = await runCodexAgent({
        chatId,
        userId,
        profile,
        promptCtx,
        bundle,
        chunk: [],
        chunkLabel: "",
        chunkFirstIndex: 0,
        notes: { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] },
        lore: null,
        storySoFar: null,
        userTextOverride: buildCodexTidyMessage(promptCtx, bundle, targets, { current: current.tokens, modelTarget, limit, callsLeft: callBudget.remaining }),
        coverageFiles: targets,
        writableFiles: targets,
        skipVerify: true,
        callBudget,
        progressBase,
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
      });
      const reloaded = await loadCodex(chatId, userId, { relationsTable: diskMode });
      const reloadProblems = reloaded.problems.filter((p) => targets.includes(p.file));
      if (reloadProblems.length) {
        const details = reloadProblems.map((p) => {
          const reason = p.errors[0].replace(/\s+/g, " ").trim();
          return `${p.file}.json: ${reason.length > 240 ? `${reason.slice(0, 239)}\u2026` : reason}`;
        }).join("; ");
        throw new CodexValidationError(t("backend.codex.index.runCodexTidy.aCodexFileCouldNotBeRead", { details }));
      }
      bundle = reloaded.bundle;
      current = await measure();
      invalidateCodexInjectionCache(chatId);
      if (result.changedFiles.length) {
        await publishCodexPool(chatId, userId, profile, result.changedFiles, "tidy");
        await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
      }
      cb2?.onStateChange(userId, chatId);
    }
    const size = `${current.approximate ? "~" : ""}${current.tokens}`;
    cb2?.onToast(userId, current.tokens <= limit ? "success" : "warn", current.tokens <= limit ? t("backend.codex.index.runCodexTidy.codexTidiedToTokensLimitInModel", { size, limit, used: callBudget.used }) : t("backend.codex.index.runCodexTidy.stoppedAfterModelCallsTokensStillAbove", { used: callBudget.used, size, limit }));
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", t("backend.codex.index.runCodexTidy.tidyingStoppedCompletedEditsAreKeptUndo"));
      return;
    }
    warn(`codex tidy failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "tidy", err);
  } finally {
    if (started) {
      invalidateCodexInjectionCache(chatId);
      await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable).catch((err) => warn(`tidy sync: ${describeError(err)}`));
      cb2?.onStateChange(userId, chatId);
    }
    clearBusy(userId, chatId, "codex");
  }
}
async function refreshCodexFiles(chatId, profile, userId) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.refreshCodexFiles.memoriaIsCatchingUpReEnabledRecords"))) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.refreshCodexFiles.memoriaIsAlreadyWorkingOnTheCodex"));
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.refreshCodexFiles.theRelationsFormatChangedRunUpdateNow"));
      return;
    }
    const frozen = frozenCodexFiles(cursor.fileStates);
    const targets = cursor.refreshPending.filter((f) => isCodexFileKey(f) && !frozen.has(f));
    if (targets.length === 0) {
      cb2?.onToast(userId, "info", t("backend.codex.index.refreshCodexFiles.noReEnabledRecordsAreWaitingFor"));
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const refreshSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, refreshSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRefreshMessage(promptCtx, bundle, targets, books, tailTranscript, notes, lore),
      coverageFiles: targets,
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const live = await loadCursor(chatId, userId);
      live.refreshPending = live.refreshPending.filter((f) => !targets.includes(f));
      await saveCursor(chatId, live, userId);
    });
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", t("backend.codex.index.refreshCodexFiles.memoriaCaughtUpRecord", { length: targets.length }));
    cb2?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", t("backend.codex.index.refreshCodexFiles.memoriaSetsTheCatchUpAside"));
      return;
    }
    warn(`codex refresh failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "refresh", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.refreshCodexFiles.theCatchUpPassNeedsTheCodex"));
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
function fileIsEmpty(bundle, key) {
  const v = bundle[key];
  return Object.values(v).every((arr) => !Array.isArray(arr) || arr.length === 0);
}
function blankTargets(bundle, targets) {
  const out = { ...bundle };
  for (const t of targets) {
    if (t === "characters" || t === "locations" || t === "things") {
      out[t] = {
        entities: bundle[t].entities.filter((e) => e.locked === true || Array.isArray(e.lockedFields) && e.lockedFields.length > 0)
      };
    } else {
      out[t] = emptyCodexFile(t);
    }
  }
  return out;
}
async function rebuildCodexFiles(chatId, profile, userId, only) {
  if (!setBusy(userId, chatId, "codex", t("backend.codex.index.rebuildCodexFiles.memoriaIsRebuildingCodexRecords"))) {
    cb2?.onToast(userId, "warn", t("backend.codex.index.rebuildCodexFiles.memoriaIsAlreadyWorkingOnTheCodex"));
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.rebuildCodexFiles.theRelationsFormatChangedRunUpdateNow"));
      return;
    }
    const frozen = frozenCodexFiles(cursor.fileStates);
    const targets = only.filter((k) => !frozen.has(k));
    if (targets.length === 0) {
      cb2?.onToast(userId, "info", t("backend.codex.index.rebuildCodexFiles.thoseRecordsAreFrozenUnfreezeThemFirst"));
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const rebuildSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, rebuildSettings.customPresets, frozen);
    const promptBundle = blankTargets(bundle, targets);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRebuildMessage(promptCtx, promptBundle, targets, books, tailTranscript, notes, lore),
      coverageFiles: targets,
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", t("backend.codex.index.rebuildCodexFiles.memoriaRebuiltRecordFromTheStory", { length: targets.length }));
    cb2?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", t("backend.codex.index.rebuildCodexFiles.memoriaSetsTheRebuildAside"));
      return;
    }
    warn(`codex record rebuild failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "rebuild", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", t("backend.codex.index.rebuildCodexFiles.theRebuildPassNeedsTheCodexModel"));
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

// src/backend/rebase.ts
var inFlight = new Set;
function lockKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
function ownEntries(entries) {
  return entries.filter((e) => !e.meta.isRoot);
}
function computeNegativeOrder(entries) {
  const sorted = [...entries].sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const n = sorted.length;
  const order = new Map;
  sorted.forEach((e, i) => order.set(e.raw.id, -(n - i)));
  return order;
}
async function retireEntries(entries, userId, chatId) {
  const failures = [];
  for (const entry of entries) {
    try {
      await deleteEntry(entry.raw.id, userId);
    } catch (err) {
      warn(`root cleanup could not delete an entry: ${describeError(err)}`);
      try {
        await setEntryDisabled(entry.raw.id, true, userId);
      } catch (disableError) {
        failures.push(disableError);
      }
    }
  }
  invalidateBookCache(userId, chatId);
  invalidateRootCandidates(userId);
  if (failures.length)
    throw new AggregateError(failures, t("backend.rebase.retireEntries.someOldSummariesCouldNotBeRemoved"));
}
async function seedRoot(targetChatId, sourceChatId, sourceEntries, existingRoots, userId) {
  const book = await ensureBookForChat(targetChatId, userId);
  const negIdx = computeNegativeOrder(sourceEntries);
  const transform = (entry) => {
    const idx = negIdx.get(entry.raw.id);
    const baseComment = entry.raw.comment || "";
    return {
      msgIds: entry.meta.msgIds.slice(),
      firstMsgIdx: idx,
      lastMsgIdx: idx,
      extra: { chatId: targetChatId, isRoot: true, rootOrigin: sourceChatId },
      comment: baseComment.startsWith("[Root]") ? baseComment : `[Root] ${baseComment}`.trim()
    };
  };
  const idMap = await copyLmbEntries(book.id, sourceEntries, userId, transform);
  await retireEntries(existingRoots, userId, targetChatId);
  info(`rebased ${targetChatId.slice(0, 8)} onto root from ${sourceChatId.slice(0, 8)} (${idMap.size} entries)`);
  return { count: idMap.size, newIds: new Set(idMap.values()) };
}
async function rebaseRoot(targetChatId, sourceChatId, userId) {
  if (sourceChatId === targetChatId)
    return { ok: false, reason: "same_chat" };
  const key = lockKey(userId, targetChatId);
  if (inFlight.has(key))
    return { ok: false, reason: "busy" };
  inFlight.add(key);
  try {
    return await withCommitMutex(userId, targetChatId, async () => {
      const targetEntries = await listLmbEntries(targetChatId, userId, true);
      if (ownEntries(targetEntries).some((e) => !e.raw.disabled))
        return { ok: false, reason: "has_own" };
      const sourceEntries = (await listLmbEntries(sourceChatId, userId, true)).filter((e) => !e.raw.disabled);
      if (sourceEntries.length === 0)
        return { ok: false, reason: "empty_source" };
      const existingRoots = targetEntries.filter((e) => e.meta.isRoot);
      const { count } = await seedRoot(targetChatId, sourceChatId, sourceEntries, existingRoots, userId);
      return { ok: true, count };
    });
  } finally {
    inFlight.delete(key);
  }
}
async function rebuildRoot(targetChatId, sourceChatId, userId) {
  if (sourceChatId === targetChatId)
    return { ok: false, reason: "same_chat" };
  const key = lockKey(userId, targetChatId);
  if (inFlight.has(key))
    return { ok: false, reason: "busy" };
  inFlight.add(key);
  try {
    return await withCommitMutex(userId, targetChatId, async () => {
      const sourceEntries = (await listLmbEntries(sourceChatId, userId, true)).filter((e) => !e.raw.disabled);
      if (sourceEntries.length === 0)
        return { ok: false, reason: "empty_source" };
      const { count, newIds } = await seedRoot(targetChatId, sourceChatId, sourceEntries, [], userId);
      const after = await listLmbEntries(targetChatId, userId, true);
      await retireEntries(after.filter((e) => !newIds.has(e.raw.id)), userId, targetChatId);
      return { ok: true, count };
    });
  } finally {
    inFlight.delete(key);
  }
}
async function detachRoot(targetChatId, userId) {
  return withCommitMutex(userId, targetChatId, async () => {
    const entries = await listLmbEntries(targetChatId, userId, true);
    const roots = entries.filter((e) => e.meta.isRoot);
    await retireEntries(roots, userId, targetChatId);
    return roots.length;
  });
}

// src/backend/state.ts
var CODEX_SOURCES_TTL_MS = 8000;
var codexSourcesCache = new Map;
async function listCodexSources(chatId, userId) {
  const cached = codexSourcesCache.get(userId);
  const all = cached && Date.now() - cached.at < CODEX_SOURCES_TTL_MS ? cached.data : await (async () => {
    const ids = await listCodexChatIds(userId);
    const out = [];
    for (const id of ids) {
      const chat = await spindle.chats.get(id, userId).catch(() => null);
      if (!chat)
        continue;
      out.push({ chatId: id, chatName: chat.name?.trim() || id.slice(0, 8), entryCount: 0 });
    }
    out.sort((a, b) => a.chatName.localeCompare(b.chatName));
    if (codexSourcesCache.size > 200)
      codexSourcesCache.clear();
    codexSourcesCache.set(userId, { at: Date.now(), data: out });
    return out;
  })();
  return all.filter((s) => s.chatId !== chatId);
}
async function buildState(userId, requestedChatId) {
  const settings = await loadSettings(userId);
  const activeProfile = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? settings.profiles[0];
  const lessons = await ensureLessons(userId);
  const codexProfile = effectiveProfile(activeProfile, lessons);
  let chat;
  if (requestedChatId) {
    chat = await spindle.chats.get(requestedChatId, userId).catch(() => null);
  } else {
    chat = await spindle.chats.getActive(userId).catch(() => null);
  }
  const [connectionsRaw, rootCandidatesRaw] = await Promise.all([
    listConnections(userId),
    listRootCandidates(userId).catch(() => [])
  ]);
  const connections = connectionsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    model: c.model,
    isDefault: c.is_default,
    hasApiKey: c.has_api_key
  }));
  const allRootCandidates = rootCandidatesRaw.map((c) => ({
    chatId: c.chatId,
    chatName: c.chatName,
    entryCount: c.entryCount
  }));
  const resolved = await resolveConnection(activeProfile, userId).catch(() => null);
  const baseState = {
    activeChatId: null,
    activeChatName: null,
    activeCharacterId: null,
    activeCharacterName: null,
    settings,
    activeProfile,
    chapters: [],
    arcs: [],
    volumes: [],
    higherBooks: [],
    bookId: null,
    bookName: null,
    connections,
    resolvedSidecarConnectionId: resolved?.id ?? null,
    coverage: {
      totalMessages: 0,
      coveredMessages: 0,
      uncoveredMessages: 0,
      approxUncoveredTokens: 0,
      lagSatisfied: false,
      windowAvailable: false
    },
    busy: getBusy(userId),
    lastFailure: null,
    messages: [],
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: settings.customPresets,
    pendingPreviews: [],
    backlogChapters: 0,
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: allRootCandidates,
    codexExists: false,
    codexBacklog: 0,
    codexBacklogPasses: 0,
    codexLastRunAt: null,
    codexUndoAt: null,
    codexUndoReason: null,
    codexSources: [],
    codexRootOrigin: null,
    codexRootOriginName: null,
    codexInjectedTokens: 0,
    codexFileStates: {},
    codexStaleFiles: [],
    codexRefreshPending: [],
    codexFileTokens: {},
    codexTokensApproximate: true,
    codexRevision: 0,
    lessons
  };
  if (!chat)
    return baseState;
  if (settings.enabled) {
    await ensureForkAdoption(chat.id, userId).catch(() => {});
    await reassertChatBinding(chat.id, userId).catch(() => {});
  }
  const bookId = await findBookForChat(chat.id, userId);
  const bookName = bookId !== null ? (await spindle.world_books.get(bookId, userId).catch(() => null))?.name ?? null : null;
  let messages = [];
  try {
    messages = await spindle.chat.getMessages(chat.id);
  } catch (err) {
    warn(`failed to read messages for chat ${chat.id.slice(0, 8)}: ${describeError(err)}`);
  }
  const entries = withLiveMessageRanges(await listLmbEntries(chat.id, userId).catch(() => []), messages);
  const coverage = await buildCoverage(chat.id, userId, entries);
  const stats = computeCoverageStats(messages, coverage, activeProfile);
  const backlogCoverage = extraContextActive(activeProfile) ? await buildCoverage(chat.id, userId, entries, true) : coverage;
  const compressibleSize = countCompressibleEligible(messages, backlogCoverage, activeProfile);
  const windowDenom = Math.max(1, activeProfile.windowValue);
  const backlogChapters = Math.max(0, Math.floor(compressibleSize / windowDenom));
  const backlogArcs = countBindingBacklog(coverage.activeEntries, 1, summaryBindingRule(activeProfile, 2));
  const activeIds = new Set(coverage.activeEntries.map((e) => e.raw.id));
  const chapters = [];
  const arcs = [];
  const volumes = [];
  const higherBooks = [];
  for (const e of entries) {
    const view = {
      entryId: e.raw.id,
      bookId: e.raw.world_book_id,
      comment: e.raw.comment || "",
      content: e.raw.content || "",
      meta: e.meta,
      active: activeIds.has(e.raw.id),
      contentTokens: approximateTokensFromChars((e.raw.content || "").length),
      contentChars: (e.raw.content || "").length,
      sourceTokensInput: e.meta.tokenCountInput || 0,
      isRoot: !!e.meta.isRoot,
      isGhost: e.meta.ghost === true
    };
    if (e.meta.tier > 3) {
      higherBooks.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else if (e.meta.tier === 3) {
      volumes.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else if (e.meta.tier === 2) {
      arcs.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else {
      chapters.push(view);
    }
  }
  chapters.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  arcs.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  volumes.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const messageStubs = messages.map((m) => {
    const covered = coverage.coveredBy.get(m.id) ?? null;
    const hidden = !!(m.extra && m.extra.hidden);
    const excluded = !!(m.metadata?.["lmb_excluded"] === true);
    const preview = (m.content || "").slice(0, 220).replace(/\s+/g, " ").trim();
    const charCount = (m.content || "").length;
    return {
      id: m.id,
      role: m.role,
      preview,
      charCount,
      approxTokens: approximateTokensFromChars(charCount),
      hidden,
      covered: !!covered,
      coveredByEntryId: covered,
      indexInChat: m.index_in_chat,
      excluded
    };
  });
  let characterName = null;
  if (chat.character_id) {
    try {
      const character = await spindle.characters.get(chat.character_id, userId);
      characterName = character?.name ?? null;
    } catch (_) {}
  }
  const codexStatus = await getCodexStatus(chat.id, userId, codexProfile).catch((err) => {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  });
  const codexPanel = await getCodexPanelState(chat.id, userId).catch(() => ({ fileStates: {}, staleFiles: [], refreshPending: [] }));
  const undo = await codexUndoInfo(chat.id, userId).catch(() => null);
  const codexSources = codexStatus.exists ? [] : await listCodexSources(chat.id, userId).catch(() => []);
  const codexCursor = codexStatus.exists ? await loadCursor(chat.id, userId).catch(() => null) : null;
  const codexRootOrigin = codexCursor?.rootOrigin ?? null;
  const codexRootOriginName = codexRootOrigin ? (await spindle.chats.get(codexRootOrigin, userId).catch(() => null))?.name?.trim() || codexRootOrigin.slice(0, 8) : null;
  const codexCounts = await getCodexTokenCounts(chat.id, userId, codexProfile).catch(() => ({ files: {}, constant: 0, approximate: true }));
  const codexFileTokens = codexCounts.files;
  const codexInjectedTokens = settings.enabled && codexProfile.codexEnabled ? codexCounts.constant : 0;
  const rootEntries = entries.filter((e) => e.meta.isRoot);
  const rootOrigin = rootEntries.find((e) => e.meta.rootOrigin)?.meta.rootOrigin ?? null;
  const rootOriginName = rootOrigin ? allRootCandidates.find((c) => c.chatId === rootOrigin)?.chatName ?? rootOrigin.slice(0, 8) : null;
  return {
    ...baseState,
    activeChatId: chat.id,
    activeChatName: chat.name,
    activeCharacterId: chat.character_id,
    activeCharacterName: characterName,
    chapters,
    arcs,
    volumes,
    higherBooks,
    bookId,
    bookName,
    coverage: stats,
    lastFailure: getLastFailure(userId, chat.id),
    messages: messageStubs,
    pendingPreviews: getPendingPreviews(userId, chat.id),
    backlogChapters,
    backlogArcs,
    rootOrigin,
    rootOriginName,
    rootEntryCount: rootEntries.length,
    availableRoots: allRootCandidates.filter((c) => c.chatId !== chat.id),
    codexExists: codexStatus.exists,
    codexBacklog: codexStatus.backlog,
    codexBacklogPasses: codexStatus.backlogPasses,
    codexLastRunAt: codexStatus.lastRunAt,
    codexUndoAt: undo?.savedAt ?? null,
    codexUndoReason: undo?.reason ?? null,
    codexSources,
    codexRootOrigin,
    codexRootOriginName,
    codexInjectedTokens,
    codexFileStates: codexPanel.fileStates,
    codexStaleFiles: codexPanel.staleFiles,
    codexRefreshPending: codexPanel.refreshPending,
    codexFileTokens,
    codexTokensApproximate: codexCounts.approximate,
    codexRevision: getCodexRevision(chat.id)
  };
}

// src/backend/index.ts
async function notify(userId, tone, text, automation = false) {
  try {
    if (automation && tone !== "error") {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings && !settings.showAutomationToasts)
        return;
    }
    if (tone === "error")
      error(`toast(error): ${text}`);
    send({ type: "toast", tone, text }, userId);
  } catch (err) {
    warn(`toast delivery failed: ${describeError(err)}`);
  }
}
var PUSH_DEBOUNCE_MS = 30;
var pushTimers = new Map;
var pendingPushChatIds = new Map;
var pendingPushResolvers = new Map;
async function doPushState(userId, chatId) {
  try {
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId)
        return;
    }
    const state = await buildState(userId, chatId);
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId)
        return;
    }
    send({ type: "state", state }, userId);
    if (state.activeChatId) {
      const status = getSummaryTransfer(userId, state.activeChatId);
      if (status)
        send({ type: "summary_transfer_status", status }, userId);
    }
  } catch (err) {
    error(`pushState failed: ${describeError(err)}`);
    send({ type: "state_error", text: t("backend.index.doPushState.lumiBooksStateRefreshFailed", { describeError: describeError(err) }) }, userId);
  }
}
function pushState(userId, chatId) {
  pendingPushChatIds.set(userId, chatId ?? null);
  const prev = pushTimers.get(userId);
  if (prev)
    clearTimeout(prev);
  return new Promise((resolve) => {
    const resolvers = pendingPushResolvers.get(userId) ?? [];
    resolvers.push(resolve);
    pendingPushResolvers.set(userId, resolvers);
    const timer = setTimeout(() => {
      pushTimers.delete(userId);
      const finalChatId = pendingPushChatIds.get(userId) ?? null;
      pendingPushChatIds.delete(userId);
      const waiting = pendingPushResolvers.get(userId) ?? [];
      pendingPushResolvers.delete(userId);
      doPushState(userId, finalChatId).finally(() => {
        for (const r of waiting) {
          try {
            r();
          } catch (_) {}
        }
      });
    }, PUSH_DEBOUNCE_MS);
    pushTimers.set(userId, timer);
  });
}
async function resumeActiveSummaryBinding(userId, chatId) {
  const chat = chatId ? await spindle.chats.get(chatId, userId) : await spindle.chats.getActive(userId);
  if (chat)
    await resumeSummaryBinding(chat.id, userId);
}
registerPipelineCallbacks({
  onBusyChange(userId, entries) {
    send({ type: "busy", entries }, userId);
  },
  onToast(userId, tone, text, automation) {
    notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    pushState(userId, chatId);
  },
  onStreamText(userId, chatId, kind, snap) {
    send({ type: "stream_text", chatId, kind, content: snap.content, thinking: snap.thinking, running: snap.running }, userId);
  }
});
registerCodexCallbacks({
  onToast(userId, tone, text, automation) {
    notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    pushState(userId, chatId);
  },
  onToolsHint(userId, chatId) {
    (async () => {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings?.suppressToolCallingPrompt)
        return;
      send({ type: "codex_tools_hint", chatId }, userId);
    })();
  }
});
var CODEX_GATE_TIMEOUT_MS = 9000;
spindle.registerWorldInfoInterceptor(async (ctx) => {
  const lmbIds = [];
  const disabledIds = [];
  const codexIds = [];
  for (const entry of ctx.entries) {
    const ext = entry.extensions;
    if (!ext)
      continue;
    if (ext[EXTENSION_KEY]) {
      lmbIds.push(entry.id);
      disabledIds.push(entry.id);
    } else if (ext[CODEX_ENTRY_EXTENSION_KEY])
      codexIds.push(entry.id);
  }
  if (codexIds.length > 0) {
    const userId = ctx.userId ?? resolveUserId(ctx.chatId);
    if (userId) {
      let gateTimer;
      const gate = (async () => {
        const settings = await loadSettings(userId);
        const rawProfile = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null;
        const profile = rawProfile ? effectiveProfile(rawProfile, await ensureLessons(userId)) : null;
        return !settings.enabled || !profile || !profile.codexEnabled;
      })();
      gate.catch(() => {});
      const deadline = new Promise((resolve) => {
        gateTimer = setTimeout(() => resolve("timeout"), CODEX_GATE_TIMEOUT_MS);
      });
      try {
        const off = await Promise.race([gate, deadline]);
        if (off === "timeout") {
          warn("world-info codex gate timed out, leaving codex entries active this turn");
        } else if (off) {
          disabledIds.push(...codexIds);
        }
      } catch (err) {
        warn(`world-info codex gate failed, leaving codex entries active: ${describeError(err)}`);
      } finally {
        if (gateTimer)
          clearTimeout(gateTimer);
      }
    }
  }
  if (disabledIds.length === 0)
    return;
  const contracts = spindle.contracts;
  return {
    disabled: disabledIds,
    ...lmbIds.length > 0 && (contracts?.["worldInfoActivationCapture"] ?? 0) >= 1 ? { captured: lmbIds } : {}
  };
}, 90);
spindle.registerInterceptor(async (messages, context) => {
  try {
    const interceptorContext = context && typeof context === "object" ? context : null;
    const chatId = interceptorContext && typeof interceptorContext["chatId"] === "string" ? interceptorContext["chatId"] : null;
    if (!chatId)
      return messages;
    const capturedValue = interceptorContext?.["capturedWorldInfo"];
    const capturedWorldInfo = Array.isArray(capturedValue) ? capturedValue.flatMap((value) => value && typeof value === "object" && typeof value.id === "string" ? [{ id: value.id }] : []) : undefined;
    const contracts = spindle.contracts;
    const worldInfoActivationCapture = (contracts?.["worldInfoActivationCapture"] ?? 0) >= 1;
    let userId = resolveUserId(chatId);
    if (!userId) {
      const bootstrap = getBootstrapUserId();
      if (bootstrap) {
        const chat = await spindle.chats.get(chatId, bootstrap).catch(() => null);
        if (chat) {
          rememberChatUser(chatId, bootstrap);
          userId = bootstrap;
        }
      }
    }
    if (!userId)
      return messages;
    const settings = await loadSettings(userId);
    if (!settings.enabled)
      return messages;
    const result = await buildInjection(chatId, messages, userId, {
      capturedWorldInfo,
      worldInfoActivationCapture
    });
    if (!result)
      return messages;
    return { messages: result.messages, breakdown: result.breakdown };
  } catch (err) {
    warn(`interceptor failed: ${describeError(err)}`);
    return messages;
  }
}, 90);
spindle.on("MESSAGE_SENT", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
  recordDiagnostic(userId, { event: "message", chatId: p.chatId, entryId: p.messageId, outcome: "created" });
});
spindle.on("GENERATION_ENDED", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId || p.error)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
  await ensureUserFolders(userId).catch(() => {});
  const settings = await loadSettings(userId).catch(() => null);
  if (!settings?.enabled)
    return;
  const rawProfile = settings.profiles.find((x) => x.id === settings.activeProfileId);
  if (!rawProfile)
    return;
  const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
  await reassertChatBinding(p.chatId, userId).catch(() => {});
  await maybeRunPipeline(p.chatId, profile, settings, userId).catch((err) => {
    warn(`pipeline failed: ${describeError(err)}`);
  });
  await maybeRunCodex(p.chatId, profile, settings, userId).catch((err) => {
    warn(`codex run failed: ${describeError(err)}`);
  });
});
spindle.on("CHAT_SWITCHED", async (payload, hostUserId) => {
  const p = payload;
  const userId = hostUserId ?? resolveUserId(p?.chatId ?? null);
  if (!userId)
    return;
  if (p?.chatId)
    rememberChatUser(p.chatId, userId);
  invalidateConnectionsCache(userId);
  await pushState(userId, p?.chatId ?? null);
  await resumeActiveSummaryBinding(userId, p?.chatId).catch((err) => notify(userId, "error", t("backend.index.messages.summaryRepairFailed", { describeError: describeError(err) })));
  await pushState(userId, p?.chatId ?? null);
});
spindle.on("MESSAGE_DELETED", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
  recordDiagnostic(userId, { event: "message", chatId: p.chatId, entryId: p.messageId, outcome: "removed" });
  invalidateBookCache(userId, p.chatId);
  await pushState(userId, p.chatId);
});
spindle.on("WORLD_BOOK_ENTRY_DELETED", async (payload, hostUserId) => {
  if (!hostUserId)
    return;
  const p = payload;
  if (!p?.worldBookId)
    return;
  await handleExternalEntryDeletion(hostUserId, p.worldBookId, false);
});
spindle.on("WORLD_BOOK_DELETED", async (payload, hostUserId) => {
  if (!hostUserId)
    return;
  const p = payload;
  if (!p?.id)
    return;
  await handleExternalEntryDeletion(hostUserId, p.id, true);
});
spindle.on("REGEX_SCRIPT_CHANGED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateRegexCache(hostUserId);
});
spindle.on("REGEX_SCRIPT_DELETED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateRegexCache(hostUserId);
});
spindle.on("CONNECTION_PROFILE_LOADED", (_payload, hostUserId) => {
  if (hostUserId) {
    invalidateConnectionsCache(hostUserId);
    invalidateCodexTokenCounts(hostUserId);
  }
});
spindle.on("MAIN_API_CHANGED", (_payload, hostUserId) => {
  if (hostUserId) {
    invalidateConnectionsCache(hostUserId);
    invalidateCodexTokenCounts(hostUserId);
  }
});
async function handleExternalEntryDeletion(userId, bookId, isBookDeletion) {
  const chatId = isBookDeletion ? findCachedChatIdForBook(userId, bookId) : await findChatIdForBook(userId, bookId).catch(() => null);
  if (!chatId)
    return;
  if (isBookDeletion)
    invalidateAllBookCacheEntriesForBook(userId, bookId);
  else
    invalidateBookCache(userId, chatId);
  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    const { unhidden } = await resyncVisibility(chatId, userId, desiredHidden);
    if (unhidden > 0) {
      await notify(userId, "info", t("backend.index.handleExternalEntryDeletion.memoriaUnhidMessageAfterAnExternalLorebook", { unhidden }));
    }
  } catch (err) {
    warn(`external deletion resync failed: ${describeError(err)}`);
  }
  await pushState(userId, chatId);
}
async function wipeBooksEntries(chatId, userId) {
  try {
    return await clearSummaryShelf(chatId, userId);
  } finally {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    await resyncVisibility(chatId, userId, profile ? profile.hideCoveredMessages : true);
  }
}
async function cleanupGhostsIfModeOff(userId, chatId, context) {
  const after = await loadSettings(userId);
  const activeProfile = after.profiles.find((p) => p.id === after.activeProfileId);
  if (!activeProfile || extraContextActive(activeProfile))
    return;
  await cleanupGhostsAfterModeOff(chatId, activeProfile, userId).catch((err) => warn(`${context} ghost cleanup failed: ${describeError(err)}`));
}
async function collectActiveChapterIds(chatId, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  return summaryRuns(coverage.activeEntries, 1)[0]?.entries.map((e) => e.raw.id) ?? [];
}
async function retryLastFailure(chatId, userId, profile, settings) {
  const last = getLastFailure(userId, chatId);
  if (last?.kind === "chapter" && last.sourceMessageIds) {
    await createChapterFromRange(chatId, last.sourceMessageIds, profile, settings, userId, { replacesEntryId: last.replacesEntryId });
    await maybeRunArcCheck(chatId, profile, settings, userId);
    return;
  }
  if (last && TIER_KINDS.indexOf(last.kind) >= 2) {
    const tier = TIER_KINDS.indexOf(last.kind) + 1;
    const coverage = await buildCoverage(chatId, userId);
    const ids = last.sourceEntryIds ?? summaryRuns(coverage.activeEntries, tier - 1)[0]?.entries.map((e) => e.raw.id) ?? [];
    if (ids.length)
      await createHigherFromEntries(tier, chatId, ids, profile, settings, userId, { replacesEntryId: last.replacesEntryId });
    return;
  }
  if (last?.kind === "arc") {
    const ids = last.sourceEntryIds ?? await collectActiveChapterIds(chatId, userId);
    if (ids.length === 0) {
      clearLastFailure(userId, chatId);
      const msg = t("backend.index.msg.memoriaHasNoChaptersLeftToRetry");
      await notify(userId, "warn", msg);
      return;
    }
    await createArcFromChapters(chatId, ids, profile, settings, userId, { replacesEntryId: last.replacesEntryId });
    return;
  }
  if (extraContextActive(profile)) {
    const made = await drainGhostBacklog(chatId, profile, settings, userId);
    if (made === 0) {
      await notify(userId, "info", t("backend.index.retryLastFailure.nothingToRetryYetMemoriaWillCatch"));
    }
  } else {
    await createChapterAuto(chatId, profile, settings, userId);
  }
  await maybeRunArcCheck(chatId, profile, settings, userId);
}
async function syncProfileSettings(userId) {
  try {
    const failures = await syncCodexProfiles(userId);
    if (failures.length)
      await notify(userId, "warn", t("backend.index.syncProfileSettings.profileSavedButCodexInjectionSettingsCould", { length: failures.length, join: failures.slice(0, 3).map((f) => f.chatId).join(", ") }));
  } catch (err) {
    warn(`Codex profile sync failed: ${describeError(err)}`);
    await notify(userId, "warn", t("backend.index.syncProfileSettings.profileSavedButCodexInjectionSettingsCould2", { describeError: describeError(err) }));
  }
}
spindle.onFrontendMessage(async (raw, userId) => {
  setLastFrontendUserId(userId);
  const msg = raw;
  if (msg.type === "ui_diagnostics") {
    await recordUiDiagnostics(userId, msg.rows);
    return;
  }
  rememberChatUser(readChatIdFromMessage(msg), userId);
  try {
    await ensureUserFolders(userId);
    recordFrontendAction(userId, msg, "started");
    switch (msg.type) {
      case "regex_scripts_page": {
        try {
          const page = await listRegexScriptsPage(userId, msg.offset, msg.query, (progress) => send({ type: "regex_scripts_page", requestId: msg.requestId, progress }, userId), msg.refresh);
          send({ type: "regex_scripts_page", requestId: msg.requestId, page }, userId);
        } catch (err) {
          send({ type: "regex_scripts_page", requestId: msg.requestId, error: describeError(err) }, userId);
        }
        break;
      }
      case "prompt_breakdown":
        send({ type: "prompt_breakdown", requestId: msg.requestId, chatId: msg.chatId, result: await loadPromptBreakdown(msg, userId) }, userId);
        break;
      case "diagnostics_export": {
        if (msg.chatId)
          await captureDiagnosticSnapshot(userId, msg.chatId);
        const content = await exportDiagnostics(userId);
        send({ type: "diagnostics_export_data", filename: "lumibooks-diagnostics.json", content }, userId);
        break;
      }
      case "diagnostics_clear":
        await clearDiagnostics(userId);
        await notify(userId, "success", t("backend.index.messages.savedDiagnosticsCleared"));
        break;
      case "ready":
      case "refresh":
        send({ type: "state_loading" }, userId);
        await pushState(userId, msg.chatId);
        await resumeActiveSummaryBinding(userId, msg.chatId);
        await pushState(userId, msg.chatId);
        break;
      case "save_settings":
        await patchSettings(userId, msg.patch);
        if ("profiles" in msg.patch || "activeProfileId" in msg.patch)
          await syncProfileSettings(userId);
        if ("summaryActivationMode" in msg.patch) {
          const { failed } = await applySummaryActivation(userId);
          if (failed)
            await notify(userId, "warn", t("backend.index.messages.recallSettingSavedEntryOrBookUpdates", { failed }));
        }
        await pushState(userId, msg.chatId);
        break;
      case "save_profile": {
        const incoming = msg.profile;
        const id = typeof incoming?.id === "string" && incoming.id.trim() ? incoming.id : null;
        if (!id) {
          send({ type: "error", text: t("backend.index.messages.invalidProfilePayload") }, userId);
          break;
        }
        let prevHide = null;
        let nextHide = null;
        let prevExtra = null;
        let nextExtra = null;
        let activeBefore = null;
        let missing = false;
        await mutateSettings(userId, (cur) => {
          activeBefore = cur.activeProfileId;
          const existing = cur.profiles.find((p) => p.id === id);
          if (!existing) {
            missing = true;
            return cur;
          }
          const merged = normalizeProfile({
            ...existing,
            ...incoming,
            id,
            promptRoles: Object.keys(incoming.promptRoles ?? {}).length ? { ...existing.promptRoles, ...incoming.promptRoles } : incoming.promptRoles ?? existing.promptRoles,
            higherTierPresetKeys: Object.keys(incoming.higherTierPresetKeys ?? {}).length ? { ...existing.higherTierPresetKeys, ...incoming.higherTierPresetKeys } : incoming.higherTierPresetKeys ?? existing.higherTierPresetKeys
          });
          if (!merged)
            return cur;
          prevHide = existing.hideCoveredMessages;
          nextHide = merged.hideCoveredMessages;
          prevExtra = extraContextActive(existing);
          nextExtra = extraContextActive(merged);
          return { ...cur, profiles: cur.profiles.map((p) => p.id === id ? merged : p) };
        });
        if (missing) {
          warn(`save_profile dropped: no profile with id "${id}"`);
          send({ type: "error", text: t("backend.index.messages.profileNoLongerExists", { id }) }, userId);
          break;
        }
        if (prevHide !== null && nextHide !== null && prevHide !== nextHide && id === activeBefore && msg.chatId) {
          try {
            const messages = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, nextHide);
          } catch (err) {
            warn(`hideCoveredMessages re-sync failed: ${describeError(err)}`);
          }
        }
        if (id === activeBefore && ["codexActivationMode", "codexInjectionPosition", "codexInjectionDepth"].some((key) => (key in incoming))) {
          await syncProfileSettings(userId);
        }
        if (prevExtra === true && nextExtra === false && id === activeBefore && msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "mode-off");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "save_samplers": {
        await mutateSettings(userId, (cur) => {
          const idx = cur.profiles.findIndex((p) => p.id === msg.profileId);
          if (idx === -1)
            return cur;
          const current = cur.profiles[idx];
          const profiles = cur.profiles.slice();
          if (msg.target === "codex") {
            profiles[idx] = { ...current, codexSamplers: { ...current.codexSamplers, ...msg.samplers } };
          } else {
            profiles[idx] = { ...current, samplers: { ...current.samplers, ...msg.samplers } };
          }
          return { ...cur, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_profile": {
        let missing = false;
        await mutateSettings(userId, (cur) => {
          const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          const name = (msg.name || t("backend.index.next.newProfile")).slice(0, 60);
          const source = msg.copyFromId ? cur.profiles.find((p) => p.id === msg.copyFromId) : makeDefaultProfile(id, name);
          if (!source) {
            missing = true;
            return cur;
          }
          const next = { ...structuredClone(source), id, name };
          return { ...cur, profiles: [...cur.profiles, next], activeProfileId: id };
        });
        if (missing) {
          send({ type: "error", text: t("backend.index.messages.profileNoLongerExists", { id: msg.copyFromId }) }, userId);
          break;
        }
        await syncProfileSettings(userId);
        if (msg.chatId)
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-create");
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_profile": {
        let warned = false;
        await mutateSettings(userId, (cur) => {
          if (cur.profiles.length <= 1) {
            warned = true;
            return cur;
          }
          const profiles = cur.profiles.filter((p) => p.id !== msg.profileId);
          const activeProfileId = cur.activeProfileId === msg.profileId ? profiles[0].id : cur.activeProfileId;
          return { ...cur, profiles, activeProfileId };
        });
        if (warned) {
          await notify(userId, "warn", t("backend.index.messages.memoriaKeepsAtLeastOneProfile"));
        }
        await syncProfileSettings(userId);
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-delete");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "set_active_profile": {
        await mutateSettings(userId, (cur) => {
          if (!cur.profiles.some((p) => p.id === msg.profileId))
            return cur;
          return { ...cur, activeProfileId: msg.profileId };
        });
        await syncProfileSettings(userId);
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-switch");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_chapter": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile)
          break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyFilingAChapter"));
          break;
        }
        const chapterMessages = await spindle.chat.getMessages(msg.chatId);
        const chapterCoverage = await buildCoverage(msg.chatId, userId, undefined, extraContextActive(profile));
        const chapterStats = computeCoverageStats(chapterMessages, chapterCoverage, profile);
        if (!chapterStats.lagSatisfied || countCompressibleEligible(chapterMessages, chapterCoverage, profile) === 0) {
          await notify(userId, "info", t("backend.index.messages.yourStoryNeedsMoreMessagesForMe"));
          break;
        }
        await createChapterAuto(msg.chatId, profile, cur, userId, false, false, true);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_chapter_range": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyFilingAChapter"));
          break;
        }
        const rangeMessages = await spindle.chat.getMessages(msg.chatId);
        const runs = selectedChapterRuns(rangeMessages, msg.messageIds);
        for (const run of runs) {
          await createChapterFromRange(msg.chatId, run, profile, cur, userId);
        }
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_all_chapters": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyFilingAChapter"));
          break;
        }
        await drainChapterBacklog(msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyBindingAnArc"));
          break;
        }
        const ids = await collectActiveChapterIds(msg.chatId, userId);
        await createArcFromChapters(msg.chatId, ids, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_arc_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyBindingAnArc"));
          break;
        }
        await createArcFromChapters(msg.chatId, msg.chapterEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_all_arcs": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyBindingAnArc"));
          break;
        }
        await drainArcBacklog(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_higher_from":
      case "create_higher_auto": {
        if (!HIGHER_TIERS.includes(msg.tier))
          break;
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (msg.type === "create_higher_from")
          await createHigherFromEntries(msg.tier, msg.chatId, msg.entryIds, profile, cur, userId);
        else
          await drainHigherBacklog(msg.tier, msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_volume_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "volume" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyPressingAVolume"));
          break;
        }
        await createVolumeFromArcs(msg.chatId, msg.arcEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "retry_last_failure": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile)
          break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        await retryLastFailure(msg.chatId, userId, profile, cur);
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_entry":
      case "release_entry": {
        const release = msg.type === "release_entry";
        const entry = await removeSummaryEntry(msg.chatId, msg.entryId, userId, release);
        if (!entry) {
          await notify(userId, "warn", t("backend.index.messages.memoriaCanTFindThatEntry"));
          break;
        }
        if (entry.meta.ghost && typeof entry.meta.sceneNumber === "number") {
          recordFreedGhostNumber(userId, msg.chatId, entry.meta.msgIds, entry.meta.sceneNumber);
        }
        if (release)
          await notify(userId, "success", t("backend.index.messages.memoriaReleasedTheEntryToYourLorebook"));
        await pushState(userId, msg.chatId);
        break;
      }
      case "regenerate_entry": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (!entry) {
          await notify(userId, "warn", t("backend.index.messages.memoriaCanTFindThatEntryTo"));
          break;
        }
        const tier = entry.meta.tier;
        const busyKind = TIER_KINDS[tier - 1];
        if (getBusy(userId).some((b) => b.kind === busyKind && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsAlreadyBusyWithA", { busyKind }));
          break;
        }
        if (entry.meta.isRoot && tier === 1) {
          await notify(userId, "warn", t("backend.index.messages.memoriaCanTRegenerateInheritedChapters"));
          break;
        }
        if (entry.meta.ghost) {
          await notify(userId, "warn", t("backend.index.messages.memoriaCanTRegenerateAGhostChapter"));
          break;
        }
        const isArc = tier === 2;
        const isVolume = tier >= 3;
        const msgIds = entry.meta.msgIds.slice();
        const sourceIds = Array.isArray(entry.meta.sourceChapterEntryIds) ? entry.meta.sourceChapterEntryIds.slice() : [];
        if (isVolume && sourceIds.length === 0) {
          await notify(userId, "warn", t("backend.index.messages.memoriaHasNoArcSourcesToRegenerate"));
          break;
        }
        if (isArc && sourceIds.length === 0) {
          await notify(userId, "warn", t("backend.index.messages.memoriaHasNoChapterSourcesToRegenerate"));
          break;
        }
        if (!isArc && !isVolume && msgIds.length === 0) {
          await notify(userId, "warn", t("backend.index.messages.memoriaHasNoMessagesToRegenerateThis"));
          break;
        }
        if (!isArc && !isVolume) {
          const otherEntries = entries.filter((e) => e.raw.id !== msg.entryId);
          const otherCoverage = await buildCoverage(msg.chatId, userId, otherEntries);
          const blockingIds = entry.meta.msgIds.filter((id) => otherCoverage.coveredBy.has(id));
          if (blockingIds.length > 0) {
            const blockerEntryId = otherCoverage.coveredBy.get(blockingIds[0]);
            const blocker = otherEntries.find((e) => e.raw.id === blockerEntryId);
            const blockerLabel = blocker?.meta.tier === 3 ? t("backend.index.blockerLabel.aVolume") : blocker?.meta.tier === 2 ? t("backend.index.blockerLabel.anArc") : t("backend.index.blockerLabel.anotherEntry");
            await notify(userId, "warn", t("backend.index.messages.theseMessagesAreBoundIntoReleaseOr", { blockerLabel }));
            break;
          }
        }
        if (isVolume) {
          await createHigherFromEntries(tier, msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else if (isArc) {
          await createArcFromChapters(msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else {
          await createChapterFromRange(msg.chatId, msgIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "update_entry": {
        await editSummaryEntry(msg.chatId, msg.entryId, msg.patch, userId);
        invalidateBookCache(userId, msg.chatId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "resync_hidden": {
        const messages = await spindle.chat.getMessages(msg.chatId);
        const coverage = await buildCoverage(msg.chatId, userId);
        await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, true);
        await pushState(userId, msg.chatId);
        break;
      }
      case "dry_run_chapter": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunChapter(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "chapter", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_chapter failed: ${text}`);
          await notify(userId, "error", t("backend.index.messages.dryRunFailed", { text }));
        }
        break;
      }
      case "dry_run_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunArc(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "arc", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_arc failed: ${text}`);
          await notify(userId, "error", t("backend.index.messages.dryRunFailed", { text }));
        }
        break;
      }
      case "dry_run_volume": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const tier = msg.tier ?? 3;
          if (!HIGHER_TIERS.includes(tier))
            throw new Error("Invalid summary tier");
          const result = await dryRunVolume(msg.chatId, profile, cur, userId, tier);
          send({ type: "dry_run_result", kind: TIER_KINDS[tier - 1], messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_volume failed: ${text}`);
          await notify(userId, "error", t("backend.index.messages.dryRunFailed", { text }));
        }
        break;
      }
      case "dry_run_codex": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunCodex(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "codex", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_codex failed: ${text}`);
          await notify(userId, "error", t("backend.index.messages.dryRunFailed", { text }));
        }
        break;
      }
      case "abort_busy": {
        const aborted = abortBusy(userId, msg.chatId, msg.kind);
        if (!aborted) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsNotInTheMiddleOf"));
        }
        break;
      }
      case "watch_stream": {
        setStreamWatcher(userId, msg.chatId, msg.kind, msg.on);
        break;
      }
      case "set_summary_activation": {
        await patchSettings(userId, { summaryActivationMode: msg.mode });
        const { updated, failed } = await applySummaryActivation(userId);
        await notify(userId, failed ? "warn" : "info", failed ? t("backend.index.messages.recallSettingSavedEntryOrBookUpdates", { failed }) : t("backend.index.messages.summaryRecallSavedEntriesUpdated", { updated }));
        await pushState(userId, msg.chatId);
        break;
      }
      case "resync_visibility": {
        const settings = await loadSettings(userId);
        const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
        const desiredHidden = profile ? profile.hideCoveredMessages : true;
        const { unhidden, hidden } = await resyncVisibility(msg.chatId, userId, desiredHidden);
        const total = unhidden + hidden;
        const text = total === 0 ? t("backend.index.text.memoriaSShelfIsAlreadyAlignedNya") : t("backend.index.text.memoriaResyncedMessageHiddenUnhidden", { total, hidden, unhidden });
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }
      case "summary_export": {
        await runSummaryTransfer(userId, msg.chatId, { type: "export" });
        break;
      }
      case "summary_import":
      case "summary_import_resolve": {
        if (msg.type === "summary_import_resolve" && msg.choice === "cancel") {
          await runSummaryTransfer(userId, msg.chatId, { type: "resolve", id: msg.id, choice: msg.choice });
          break;
        }
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          send({ type: "summary_transfer_status", status: { id: msg.type === "summary_import_resolve" ? msg.id : "busy", chatId: msg.chatId, stage: "error", text: t("backend.index.messages.waitForTheCurrentTaskToFinish") } }, userId);
          break;
        }
        if (!setBusy(userId, msg.chatId, "chapter", t("backend.index.messages.importingSummaries")))
          break;
        try {
          const imported = await runSummaryTransfer(userId, msg.chatId, msg.type === "summary_import" ? { type: "import", raw: msg.raw } : { type: "resolve", id: msg.id, choice: msg.choice, through: msg.through });
          if (imported) {
            const settings = await loadSettings(userId);
            const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
            if (profile?.hideCoveredMessages)
              await resyncVisibility(msg.chatId, userId, true);
          }
        } finally {
          clearBusy(userId, msg.chatId, "chapter");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "ensure_book": {
        await ensureBookForChat(msg.chatId, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "import_preset": {
        const parsed = parseStmbPresetExport(msg.raw, msg.category);
        if (parsed.length === 0) {
          await notify(userId, "warn", t("backend.index.messages.memoriaFoundNoUsablePresetsInThat"));
          break;
        }
        await mutateSettings(userId, (cur) => {
          const merged = [...cur.customPresets];
          for (const p of parsed) {
            const existing = merged.findIndex((c) => c.key === p.key && c.category === msg.category);
            const record = { ...p, category: msg.category, createdAt: Date.now() };
            if (existing >= 0)
              merged[existing] = record;
            else
              merged.push(record);
          }
          return { ...cur, customPresets: merged };
        });
        await notify(userId, "success", t("backend.index.messages.memoriaImportedPreset", { length: parsed.length }));
        await pushState(userId, msg.chatId);
        break;
      }
      case "save_custom_preset": {
        const next = normalizeCustomPreset(msg.preset);
        if (!next) {
          send({ type: "error", text: t("backend.index.messages.invalidPresetPayload") }, userId);
          break;
        }
        await mutateSettings(userId, (cur) => {
          const idx = cur.customPresets.findIndex((p) => p.key === next.key && p.category === next.category);
          const list = cur.customPresets.slice();
          if (idx >= 0)
            list[idx] = next;
          else
            list.push(next);
          return { ...cur, customPresets: list };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_custom_preset": {
        const fallbackChapter = "summary";
        const fallbackArc = "arc_default";
        const fallbackVolume = "volume_default";
        const fallbackCodex = "codex_default";
        await mutateSettings(userId, (cur) => {
          const list = cur.customPresets.filter((p) => !(p.key === msg.key && p.category === msg.category));
          const profiles = cur.profiles.map((p) => {
            if (msg.category === "chapter" && p.chapterPresetKey === msg.key) {
              return { ...p, chapterPresetKey: fallbackChapter };
            }
            if (msg.category === "arc" && p.arcPresetKey === msg.key) {
              return { ...p, arcPresetKey: fallbackArc };
            }
            if (msg.category === "volume" && p.volumePresetKey === msg.key) {
              return { ...p, volumePresetKey: fallbackVolume };
            }
            if (msg.category === "codex" && p.codexPresetKey === msg.key) {
              return { ...p, codexPresetKey: fallbackCodex };
            }
            if (isExtraCategory(msg.category) && presetKeyFor(p, msg.category) === msg.key) {
              return { ...p, higherTierPresetKeys: { ...p.higherTierPresetKeys, ...presetKeyPatch(msg.category, "").higherTierPresetKeys } };
            }
            return p;
          });
          return { ...cur, customPresets: list, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "accept_preview": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        const accepted = await acceptPreview(msg.chatId, msg.draftId, profile, userId);
        if (accepted && cur.enabled)
          await resumeSummaryBinding(msg.chatId, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "discard_preview": {
        dropPendingPreview(userId, msg.chatId, msg.draftId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "edit_preview": {
        patchPendingPreview(userId, msg.chatId, msg.draftId, msg.patch);
        break;
      }
      case "rebase_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsBusyWaitForHerTo"));
          break;
        }
        const result = await rebaseRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "has_own" ? t("backend.index.text.thisChatAlreadyHasMemoriesUseRebuild") : result.reason === "empty_source" ? t("backend.index.text.thatChatHasNoMemoriesToInherit") : result.reason === "busy" ? t("backend.index.text.memoriaIsAlreadyRebasingThisChat") : t("backend.index.text.memoriaCanTRebaseAChatOnto");
          await notify(userId, "warn", text);
        } else {
          await notify(userId, "success", t("backend.index.messages.memoriaSeededInheritedMemorBeforeTheGreeting", { count: result.count }));
          await resumeSummaryBinding(msg.chatId, userId);
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "rebuild_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsBusyWaitForHerTo"));
          break;
        }
        const result = await rebuildRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "empty_source" ? t("backend.index.text.thatChatHasNoMemoriesToInherit") : result.reason === "busy" ? t("backend.index.text.memoriaIsAlreadyRebuildingThisChat") : t("backend.index.text.memoriaCanTRebuildAChatOnto");
          await notify(userId, "warn", text);
          await pushState(userId, msg.chatId);
          break;
        }
        await notify(userId, "success", t("backend.index.messages.memoriaRebuiltOntoInheritedMemorAndIs", { count: result.count }));
        await pushState(userId, msg.chatId);
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (profile) {
          await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild re-summarize failed: ${describeError(err)}`));
          await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
          await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch((err) => warn(`rebuild visibility resync failed: ${describeError(err)}`));
          await pushState(userId, msg.chatId);
        }
        break;
      }
      case "set_message_excluded": {
        const ids = Array.isArray(msg.messageIds) ? msg.messageIds.filter((x) => typeof x === "string") : [];
        if (ids.length === 0)
          break;
        const messages = await spindle.chat.getMessages(msg.chatId);
        const byId = new Map(messages.map((m) => [m.id, m]));
        const coveredNow = msg.excluded ? (await buildCoverage(msg.chatId, userId)).coveredBy : null;
        const hideToUnhide = [];
        for (const id of ids) {
          const m = byId.get(id);
          if (!m)
            continue;
          const cur = m.metadata;
          const next = cur && typeof cur === "object" ? { ...cur } : {};
          if (msg.excluded) {
            next["lmb_excluded"] = true;
            const hidden = !!(m.extra && m.extra.hidden);
            if (hidden && coveredNow?.has(id))
              hideToUnhide.push(id);
          } else {
            delete next["lmb_excluded"];
          }
          await spindle.chat.updateMessage(msg.chatId, id, { metadata: next, skipChunkRebuild: true }).catch((err) => {
            warn(`set_message_excluded: updateMessage failed for ${id}: ${describeError(err)}`);
          });
        }
        if (hideToUnhide.length > 0) {
          await unhideCoveredMessages(msg.chatId, hideToUnhide, userId).catch(() => {});
        }
        if (!msg.excluded) {
          const cur = await loadSettings(userId);
          const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
          if (profile?.hideCoveredMessages) {
            const fresh = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            const idSet = new Set(ids);
            const reincluded = fresh.filter((m) => idSet.has(m.id) && coverage.coveredBy.has(m.id));
            if (reincluded.length > 0) {
              await syncHiddenForCoveredMessages(msg.chatId, reincluded, coverage, userId, true).catch(() => {});
            }
          }
        }
        await notify(userId, "info", msg.excluded ? t("backend.index.messages.memoriaWillLeaveMessageUntouched", { length: ids.length }) : t("backend.index.messages.memoriaWillCompressMessageAgain", { length: ids.length }));
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_update_now": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaTeachesTheCodexBeforeSheOpens"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", t("backend.index.messages.enableTheCodexInTuningFirst"));
          break;
        }
        await snapshotCodexForUndo(msg.chatId, userId, "update");
        await runCodexNow(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_clear_stale": {
        if (!setBusy(userId, msg.chatId, "codex", t("backend.index.messages.acceptingCurrentCodexRecords")))
          break;
        try {
          await snapshotCodexForUndo(msg.chatId, userId, t("backend.index.messages.clearStaleTags"));
          await clearCodexStaleFlags(msg.chatId, userId);
        } finally {
          clearBusy(userId, msg.chatId, "codex");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_read": {
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, revision: getCodexRevision(msg.chatId) }, userId);
        break;
      }
      case "codex_backup": {
        const backup = await buildCodexBackup(msg.chatId, userId);
        const stamp = new Date(backup.savedAt).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        send({
          type: "codex_backup_data",
          chatId: msg.chatId,
          filename: `lumibooks-codex-${msg.chatId.slice(0, 8)}-${stamp}.json`,
          content: JSON.stringify(backup, null, 2)
        }, userId);
        break;
      }
      case "codex_restore": {
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexRestoreAgain"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        const profileMode = profile ? profile.codexRelationsTable : true;
        const cursor = await loadCursor(msg.chatId, userId);
        const parsedBackup = parseCodexBackup(msg.raw, cursor.relationsTableMode ?? profileMode);
        if ("error" in parsedBackup) {
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTRestoreThatBackup", { error: parsedBackup.error }));
          break;
        }
        await applyCodexBackup(msg.chatId, userId, parsedBackup);
        invalidateCodexInjectionCache(msg.chatId);
        const restoredFiles = parsedBackup.values.map((v) => v.key);
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, restoredFiles, "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, parsedBackup.relationsTableMode ?? profileMode);
        } catch (err) {
          warn(`codex_restore entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
        }
        await notify(userId, "success", t("backend.index.messages.memoriaRestoredCodexFile", { length: restoredFiles.length }));
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_adopt": {
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexAbortThat"));
          break;
        }
        const outcome = await adoptCodexFrom(msg.sourceChatId, msg.chatId, userId).catch((err) => {
          warn(`codex adopt failed: ${describeError(err)}`);
          return err instanceof Error ? err : new Error(String(err));
        });
        if (outcome instanceof Error) {
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTCarryThatCodexOver", { shortErrorText: shortErrorText(outcome) }));
          break;
        }
        if (outcome !== "ok") {
          const text = outcome === "has_own" ? t("backend.index.text.thisChatAlreadyHasACodexWipe") : outcome === "no_source" ? t("backend.index.text.thatChatHasNoCodexToCarry") : t("backend.index.text.memoriaCanTCarryACodexOnto");
          await notify(userId, "warn", text);
          break;
        }
        invalidateCodexInjectionCache(msg.chatId);
        const adoptSettings = await loadSettings(userId);
        const adoptProfile = adoptSettings.profiles.find((p) => p.id === adoptSettings.activeProfileId);
        if (adoptProfile)
          await publishCodexPool(msg.chatId, userId, adoptProfile, [...CODEX_FILE_KEYS], "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, adoptProfile?.codexRelationsTable);
        } catch (err) {
          warn(`codex_adopt entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
        }
        await notify(userId, "success", t("backend.index.messages.memoriaCarriedTheCodexOverSheWill"));
        const adopted = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: adopted, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_undo": {
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexAbortThat"));
          break;
        }
        const snap = await readCodexUndo(msg.chatId, userId);
        if (!snap) {
          await notify(userId, "warn", t("backend.index.messages.memoriaHasNoCodexSnapshotToUndo"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        const profileMode = profile ? profile.codexRelationsTable : true;
        const parsedSnap = parseCodexBackup(snap, profileMode);
        if ("error" in parsedSnap) {
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTUndo", { error: parsedSnap.error }));
          break;
        }
        await applyCodexBackup(msg.chatId, userId, parsedSnap, snap.cursor);
        invalidateCodexInjectionCache(msg.chatId);
        await clearCodexUndo(msg.chatId, userId);
        const undoneFiles = parsedSnap.values.map((v) => v.key);
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, undoneFiles, "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, parsedSnap.relationsTableMode ?? profileMode);
        } catch (err) {
          warn(`codex_undo entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
        }
        await notify(userId, "success", t("backend.index.messages.memoriaRolledTheCodexBack"));
        const undoneRaw = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: undoneRaw, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_write_file": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: t("backend.index.messages.unknownCodexFile", { file: msg.file }) }, userId);
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexSaveAgain"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        const profileMode = profile ? profile.codexRelationsTable : true;
        const cursor = await loadCursor(msg.chatId, userId);
        const relationsTable = cursor.relationsTableMode ?? profileMode;
        let parsed;
        try {
          parsed = JSON.parse(msg.content);
        } catch (err) {
          await notify(userId, "error", t("backend.index.messages.thatIsNotValidJson", { describeError: describeError(err) }));
          break;
        }
        const result = validateCodexFile(msg.file, parsed, { relationsTable });
        if (!result.ok) {
          const extra = result.errors.length > 1 ? t("backend.index.extra.more", { length1: result.errors.length - 1 }) : "";
          await notify(userId, "error", t("backend.index.messages.validationFailed", { errors0: result.errors[0], extra }));
          break;
        }
        await saveCodexFile(msg.chatId, msg.file, result.value, userId);
        invalidateCodexInjectionCache(msg.chatId);
        await withCursorLock(msg.chatId, userId, async () => {
          const cur = await loadCursor(msg.chatId, userId);
          if (cur.relationsTableMode === null) {
            cur.relationsTableMode = relationsTable;
            await saveCursor(msg.chatId, cur, userId);
          }
        });
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, [msg.file], "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, relationsTable);
        } catch (err) {
          warn(`codex_write_file entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", t("backend.index.messages.memoriaCouldnTSyncTheCodexTo", { shortErrorText: shortErrorText(err) }));
        }
        const { bundle, problems } = await loadCodex(msg.chatId, userId, { relationsTable });
        if (problems.length > 0) {
          const names = problems.map((p) => `${p.file}.json`).join(", ");
          await notify(userId, "warn", t("backend.index.messages.savedButCouldNotBeReadSo", { names }));
        } else {
          const dangling = checkIntegrity(bundle);
          if (dangling.length > 0) {
            await notify(userId, "warn", t("backend.index.messages.savedWithDanglingReferenceToFixIn", { length: dangling.length }));
          } else {
            await notify(userId, "success", t("backend.index.messages.memoriaSavedJson", { file: msg.file }));
          }
        }
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, savedFile: msg.file, savedSeq: msg.seq, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_reset": {
        if (!setBusy(userId, msg.chatId, "codex", t("backend.index.messages.memoriaIsClearingTheCodex"))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexAbortThat"));
          break;
        }
        try {
          await snapshotCodexForUndo(msg.chatId, userId, "wipe");
          const failed = await deleteCodex(msg.chatId, userId);
          invalidateCodexInjectionCache(msg.chatId);
          if (failed.length > 0) {
            await notify(userId, "error", t("backend.index.messages.memoriaCouldnTClearCodexFileTry", { length: failed.length }));
          } else {
            publishCodexWiped(msg.chatId, userId);
            let entriesCleared = true;
            try {
              await wipeCodexEntries(msg.chatId, userId);
            } catch (err) {
              entriesCleared = false;
              warn(`codex_reset entry wipe failed: ${describeError(err)}`);
              await notify(userId, "error", t("backend.index.messages.memoriaCouldnTClearTheCodexLorebook", { shortErrorText: shortErrorText(err) }));
            }
            if (entriesCleared) {
              await notify(userId, "info", t("backend.index.messages.memoriaClearedTheCodexForThisChat"));
            }
          }
        } finally {
          clearBusy(userId, msg.chatId, "codex");
        }
        const wiped = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: wiped, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_rebuild": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaTeachesTheCodexBeforeSheOpens"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", t("backend.index.messages.enableTheCodexInTuningFirst"));
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsUpdatingTheCodexAbortThat"));
          break;
        }
        await snapshotCodexForUndo(msg.chatId, userId, "rebuild");
        await rebuildCodex(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        const rebuilt = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuilt, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_tidy": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaTeachesTheCodexBeforeSheOpens"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", t("backend.index.messages.enableTheCodexInTuningFirst"));
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : undefined;
        await runCodexTidy(msg.chatId, profile, userId, files && files.length ? files : undefined, msg.target);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_rebuild_files": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaTeachesTheCodexBeforeSheOpens"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", t("backend.index.messages.enableTheCodexInTuningFirst"));
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : [];
        if (files.length === 0)
          break;
        await snapshotCodexForUndo(msg.chatId, userId, t("backend.index.messages.rebuildFiles"));
        await rebuildCodexFiles(msg.chatId, profile, userId, files);
        const rebuiltFiles = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuiltFiles, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_refresh": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", t("backend.index.messages.memoriaTeachesTheCodexBeforeSheOpens"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", t("backend.index.messages.enableTheCodexInTuningFirst"));
          break;
        }
        await snapshotCodexForUndo(msg.chatId, userId, "catch-up");
        await refreshCodexFiles(msg.chatId, profile, userId);
        const refreshed = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: refreshed, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_set_file_state": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: t("backend.index.messages.unknownCodexFile", { file: msg.file }) }, userId);
          break;
        }
        let profile = null;
        try {
          const cur = await loadSettings(userId);
          profile = cur.profiles.find((p) => p.id === cur.activeProfileId) ?? null;
          await setCodexFileState(msg.chatId, userId, msg.file, msg.state, profile?.codexRelationsTable);
        } catch (err) {
          if (msg.seq !== undefined)
            send({ type: "codex_file_state_saved", chatId: msg.chatId, file: msg.file, state: msg.state, seq: msg.seq, error: describeError(err) }, userId);
          throw err;
        }
        if (msg.seq !== undefined)
          send({ type: "codex_file_state_saved", chatId: msg.chatId, file: msg.file, state: msg.state, seq: msg.seq }, userId);
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, [msg.file], "states");
        await pushState(userId, msg.chatId);
        break;
      }
      case "wipe_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsBusyWaitForHerTo"));
          break;
        }
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, removed > 0 ? "success" : "info", removed > 0 ? t("backend.index.messages.memoriaClearedEntrFromTheShelf", { removed }) : t("backend.index.messages.theShelfIsAlreadyEmpty"));
        await pushState(userId, msg.chatId);
        break;
      }
      case "rebuild_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", t("backend.index.messages.memoriaIsBusyWaitForHerTo"));
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, "info", t("backend.index.messages.memoriaClearedEntrAndIsReSummarizing", { removed }));
        await pushState(userId, msg.chatId);
        await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild books re-summarize failed: ${describeError(err)}`));
        await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
        await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch(() => {});
        await pushState(userId, msg.chatId);
        break;
      }
      case "detach_root": {
        const removed = await detachRoot(msg.chatId, userId);
        const text = removed === 0 ? t("backend.index.text.thisChatHasNoInheritedMemoriesTo") : t("backend.index.text.memoriaDetachedInheritedMemor", { removed });
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_patch": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        await patchLessonCourse(userId, msg.course, msg.patch ?? {});
        break;
      }
      case "lesson_complete": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        const grade = msg.grade === "gilded" || msg.grade === "silver" || msg.grade === "bronze" || msg.grade === "apprentice" ? msg.grade : "apprentice";
        const wrong = typeof msg.wrong === "number" && Number.isFinite(msg.wrong) ? Math.max(0, Math.round(msg.wrong)) : 0;
        const total = typeof msg.total === "number" && Number.isFinite(msg.total) ? Math.max(0, Math.round(msg.total)) : 0;
        await completeLessonCourse(userId, msg.course, wrong, total, grade, msg.signedName ?? null, msg.answers);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_reset": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        await resetLessonCourse(userId, msg.course, msg.mode === "section" ? "section" : "course", msg.section, msg.answerIds);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_seal_skip": {
        await skipCourseSeal(userId, msg.course === "codex" ? "codex" : "books");
        await pushState(userId, msg.chatId);
        break;
      }
      default:
        debug(userId, `unknown frontend msg type`, msg.type);
    }
    recordFrontendAction(userId, msg, "finished");
  } catch (err) {
    recordFrontendAction(userId, msg, "failed");
    const description = describeError(err);
    if (msg.type === "prompt_breakdown") {
      send({ type: "prompt_breakdown", requestId: msg.requestId, chatId: msg.chatId, error: description }, userId);
      return;
    }
    error(`frontend handler failed: ${description}`);
    if (msg.type === "summary_import" || msg.type === "summary_export" || msg.type === "summary_import_resolve") {
      send({ type: "summary_transfer_status", status: { id: getSummaryTransfer(userId, msg.chatId)?.id ?? "local", chatId: msg.chatId, stage: "error", text: description } }, userId);
    }
    send({ type: msg.type === "ready" || msg.type === "refresh" ? "state_error" : "error", text: description }, userId);
  }
});
registerBookAnomalyCallback((userId, tone, text) => {
  notify(userId, tone, text);
});
registerInjectionAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerLessonsAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerForkAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerHookEndpoints();
info("LumiBooks loaded.");
