// CodeMirror Lint addon to use ESLint, copyright (c) by Angelo ZERR and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on eslint.js from https://github.com/eslint/eslint
//CodeMirror =  //require("codemirror")

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

  var defaultConfig = {
    "globals": { //cfry added this whole section
        "ab":         false,
        "append_in_ui":       false,
        "beep":       false,
        "beeps":      false,
        "Brain":      false,
        "class":      false, //I still get a warning for class as a "reserved word"
        "close_window":       false,
        "console":    false, //permit using "console" without warning, but don't permit the setting of it.
        "Dexter":     false,
        "dex":        false,
        "Duration":   false,
        "editor":     false,
        //"function*:   false,   doesn't work in getting rid of warning.
        "get_in_ui":  false,
        "get_page":   false,
        "get_page_async": false,
        "Human":      false,
        "Job":        false,
        "out":        false,
        "rde":        false,
        "remove_in_ui":  false,
        "replace_in_ui": false,
        "Robot":          false,
        "setTimeout":     false,
        "set_in_ui":      false,
        "Serial":         false,
        "show_window":    false,
        "Sim":            false,
        "svg_svg":        false,
        "svg_circle":     false,
        "svg_ellipse":    false,
        "svg_html":       false,
        "svg_polygon":    false,
        "svg_polyline":   false,
        "svg_line":       false,
        "svg_rect":       false,
        "svg_text":       false,
        "TestSuite":      false
    },
     "parserOptions": {
         "ecmaVersion": 6,
         "ecmaFeatures": {
             "forOf": true, //cfry added forOf to not warn when "for ... of"
             //"backtick": true //cfry this doesn't work. I get errors when using backtick. apparently no feature to allow backticks
             "class": true
         }
    },
    "env": {
        "browser": true, //cfry default is false,
        "es6":     true, //cfry default was not to have this line here
        "node":    false,
        "amd":     false,
        "mocha":   false,
        "jasmine": false
    },
    "rules": { //0 = "off" or "turn the rule off", 1 = warn, 2 = on
        "no-alert": 2,
        "no-array-constructor": 2,
        "no-bitwise": 0,
        "no-caller": 2,
        "no-catch-shadow": 2,
        "no-comma-dangle": 2,
        "no-cond-assign": 2,
        "no-console": 0,  //cfry default is 2, but that causes warnings when using it.
        "no-constant-condition": 2,
        "no-control-regex": 2,
        "no-debugger": 0, //cfry default is 2,
        "no-delete-var": 2,
        "no-div-regex": 0,
        "no-dupe-keys": 2,
        "no-else-return": 0,
        "no-empty": 2,
        "no-empty-class": 2,
        "no-empty-label": 2,
        "no-eq-null": 0,
        "no-eval": 2,
        "no-ex-assign": 2,
        "no-extend-native": 2,
        "no-extra-bind": 2,
        "no-extra-boolean-cast": 2,
        "no-extra-parens": 0,
        "no-extra-semi": 2,
        "no-extra-strict": 2,
        "no-fallthrough": 2,
        "no-floating-decimal": 0,
        "no-func-assign": 2,
        "no-implied-eval": 2,
        "no-inline-comments": 0,
        "no-inner-declarations": [2, "functions"],
        "no-invalid-regexp": 2,
        "no-irregular-whitespace": 2,
        "no-iterator": 2,
        "no-label-var": 2,
        "no-labels": 2,
        "no-lone-blocks": 2,
        "no-lonely-if": 0,
        "no-loop-func": 2,
        "no-mixed-requires": [0, false],
        "no-mixed-spaces-and-tabs": [0, false], //was 2
        "no-multi-spaces": 2,
        "no-multi-str": 2,
        "no-multiple-empty-lines": [0, {"max": 2}],
        "no-native-reassign": 2,
        "no-negated-in-lhs": 2,
        "no-nested-ternary": 0,
        "no-new": 0, //cfry   default is 2, neaming that "new foo()" causes warning whereas bar = new foo() does not.
                  //cfry set to 0 because "new Job()" is good code in DDE because new Job("j2") gives a name to the job
                  // and makes Job.j2  work in returing the new instance.
        "no-new-func": 2,
        "no-new-object": 2,
        "no-new-require": 0,
        "no-new-wrappers": 2,
        "no-obj-calls": 2,
        "no-octal": 2,
        "no-octal-escape": 2,
        "no-path-concat": 0,
        "no-plusplus": 0,
        "no-process-env": 0,
        "no-process-exit": 2,
        "no-proto": 2,
        "no-redeclare": 2,
        "no-regex-spaces": 2,
        "no-reserved-keys": 0,
        "no-restricted-modules": 0,
        "no-return-assign": 2,
        "no-script-url": 2,
        "no-self-compare": 0,
        "no-sequences": 2,
        "no-shadow": 2,
        "no-shadow-restricted-names": 2,
        "no-space-before-semi": 2,
        "no-spaced-func": 2,
        "no-sparse-arrays": 2,
        "no-sync": 0,
        "no-ternary": 0,
        "no-trailing-spaces": 0, //cfry  default 2
        "no-undef": 2,
        "no-undef-init": 2,
        "no-undefined": 0,
        "no-underscore-dangle": 2,
        "no-unreachable": 2,
        "no-unused-expressions": 2,
        "no-unused-vars": [2, {"vars": "all", "args": "after-used"}],
        "no-use-before-define": 2,
        "no-void": 0,
        "no-var": 0,
        "no-warning-comments": [0, { "terms": ["todo", "fixme", "xxx"], "location": "start" }],
        "no-with": 2,
        "no-wrap-func": 2,
        "block-scoped-var": 0,
        "brace-style": [0, "1tbs"],
        "camelcase": 0, //cfry default of 2 requires fn names to be camel cased. yuck
        "comma-spacing": 2,
        "comma-style": 0,
        "complexity": [0, 11],
        "consistent-return": 2,
        "consistent-this": [0, "that"],
        "curly": [2, "all"],
        "default-case": 0,
        "dot-notation": [2, { "allowKeywords": true }],
        "eol-last": 0, //cfry default of 2 requires a newline at end of file. 0 allows there to be no newline.
        "eqeqeq": 2,
        "func-names": 0,
        "func-style": [0, "declaration"],
        "generator-star": 0,
        "global-strict": [2, "never"],
        "guard-for-in": 0,
        "handle-callback-err": 0,
        "key-spacing": [2, { "beforeColon": false, "afterColon": true }],
        "max-depth": [0, 4],
        "max-len": [0, 80, 4],
        "max-nested-callbacks": [0, 2],
        "max-params": [0, 3],
        "max-statements": [0, 10],
        "new-cap": 2,
        "new-parens": 2,
        "one-var": 0,
        "operator-assignment": [0, "always"],
        "padded-blocks": 0,
        "quote-props": 0,
        "quotes": 0, //[2, "backtick"], //cfry  using 0 (not the default) allows surrounding strings with both double and single quotes but not backtick
        "radix": 0,
        "semi": 0, //cfry default was: 2.  using 0 turn offs warning for no semicolons.
        "sort-vars": 0,
        "space-after-function-name": [0, "never"],
        "space-after-keywords": [0, "always"],
        "space-before-blocks": [0, "always"],
        "space-in-brackets": [0, "never"],
        "space-in-parens": [0, "never"],
        "space-infix-ops": 2,
        "space-return-throw-case": 2,
        "space-unary-ops": [2, { "words": true, "nonwords": false }],
        "spaced-line-comment": [0, "always"],
        "strict": 0, //default 2, cfry changed to 0 because if I have "forOf": true as above to not warn on forOf, then if strict: 2, every line in programis underlined in red.
                     // https://jslinterrors.com/missing-use-strict-statement
        "use-isnan": 2,
        "valid-jsdoc": 0,
        "valid-typeof": 2,
        "vars-on-top": 0,
        "wrap-iife": 0,
        "wrap-regex": 0,
        "yoda": [2, "never"]
    }
  }
  
  function validator(text, options) {
	var result = [], config = defaultConfig;
	var errors = eslint.verify(text, config);
	for (var i = 0; i < errors.length; i++) {
	  var error = errors[i];
	  result.push({message: error.message,
		           severity: getSeverity(error),
		           from: getPos(error, true),
	               to: getPos(error, false)});	
	}
	return result;	  
  }

  CodeMirror.registerHelper("lint", "javascript", validator);

  function getPos(error, from) {
    var line = error.line-1, ch = from ? error.column : error.column+1;
    if (error.node && error.node.loc) {
      line = from ? error.node.loc.start.line -1 : error.node.loc.end.line -1;
      ch = from ? error.node.loc.start.column : error.node.loc.end.column;
    }
    return CodeMirror.Pos(line, ch);
  }
  
  function getSeverity(error) {
	switch(error.severity) {
	  case 1:
	    return "warning";
	  case 2:
		return "error";	    
	  default:
		return "error";
	}    
  }
  
});
