import stream_1 from 'stream';
import events from 'events';
import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
import require$$0 from 'crypto';
import url from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';
import require$$0$1 from 'domain';
import require$$1$2 from 'string_decoder';
import util_1 from 'util';
import querystring$1 from 'querystring';
import zlib from 'zlib';
import require$$0$2 from 'buffer';
import child_process_1, { spawn } from 'child_process';
import tty from 'tty';
import dgram from 'dgram';

/* eslint-disable no-underscore-dangle */



const { EventEmitter: EventEmitter$d } = events;

class PersistentFile extends EventEmitter$d {
  constructor({ filepath, newFilename, originalFilename, mimetype, hashAlgorithm }) {
    super();

    this.lastModifiedDate = null;
    Object.assign(this, { filepath, newFilename, originalFilename, mimetype, hashAlgorithm });

    this.size = 0;
    this._writeStream = null;

    if (typeof this.hashAlgorithm === 'string') {
      this.hash = require$$0.createHash(this.hashAlgorithm);
    } else {
      this.hash = null;
    }
  }

  open() {
    this._writeStream = new fs.WriteStream(this.filepath);
    this._writeStream.on('error', (err) => {
      this.emit('error', err);
    });
  }

  toJSON() {
    const json = {
      size: this.size,
      filepath: this.filepath,
      newFilename: this.newFilename,
      mimetype: this.mimetype,
      mtime: this.lastModifiedDate,
      length: this.length,
      originalFilename: this.originalFilename,
    };
    if (this.hash && this.hash !== '') {
      json.hash = this.hash;
    }
    return json;
  }

  toString() {
    return `PersistentFile: ${this.newFilename}, Original: ${this.originalFilename}, Path: ${this.filepath}`;
  }

  write(buffer, cb) {
    if (this.hash) {
      this.hash.update(buffer);
    }

    if (this._writeStream.closed) {
      cb();
      return;
    }

    this._writeStream.write(buffer, () => {
      this.lastModifiedDate = new Date();
      this.size += buffer.length;
      this.emit('progress', this.size);
      cb();
    });
  }

  end(cb) {
    if (this.hash) {
      this.hash = this.hash.digest('hex');
    }
    this._writeStream.end(() => {
      this.emit('end');
      cb();
    });
  }

  destroy() {
    this._writeStream.destroy();
    fs.unlink(this.filepath, () => {});
  }
}

var PersistentFile_1 = PersistentFile;

/* eslint-disable no-underscore-dangle */


const { EventEmitter: EventEmitter$c } = events;

class VolatileFile extends EventEmitter$c {
  constructor({ filepath, newFilename, originalFilename, mimetype, hashAlgorithm, createFileWriteStream }) {
    super();

    this.lastModifiedDate = null;
    Object.assign(this, { filepath, newFilename, originalFilename, mimetype, hashAlgorithm, createFileWriteStream });

    this.size = 0;
    this._writeStream = null;

    if (typeof this.hashAlgorithm === 'string') {
      this.hash = require$$0.createHash(this.hashAlgorithm);
    } else {
      this.hash = null;
    }
  }

  open() {
    this._writeStream = this.createFileWriteStream(this);
    this._writeStream.on('error', (err) => {
      this.emit('error', err);
    });
  }

  destroy() {
    this._writeStream.destroy();
  }

  toJSON() {
    const json = {
      size: this.size,
      newFilename: this.newFilename,
      length: this.length,
      originalFilename: this.originalFilename,
      mimetype: this.mimetype,
    };
    if (this.hash && this.hash !== '') {
      json.hash = this.hash;
    }
    return json;
  }

  toString() {
    return `VolatileFile: ${this.originalFilename}`;
  }

  write(buffer, cb) {
    if (this.hash) {
      this.hash.update(buffer);
    }

    if (this._writeStream.closed || this._writeStream.destroyed) {
      cb();
      return;
    }

    this._writeStream.write(buffer, () => {
      this.size += buffer.length;
      this.emit('progress', this.size);
      cb();
    });
  }

  end(cb) {
    if (this.hash) {
      this.hash = this.hash.digest('hex');
    }
    this._writeStream.end(() => {
      this.emit('end');
      cb();
    });
  }
}

var VolatileFile_1 = VolatileFile;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

function commonjsRequire (target) {
	throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
}

var IDX=256, HEX=[];
while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);

function index$1 (len) {
	len = len || 16;
	var str='', num=0;
	return function () {
		if (!str || num === 256) {
			str=''; num=(1+len)/2 | 0;
			while (num--) str += HEX[256 * Math.random() | 0];
			str = str.substring(num=0, len-2);
		}
		return str + HEX[num++];
	};
}

var dist$f = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': index$1
});

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
var wrappy_1 = wrappy;
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k];
  });

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb = args[args.length-1];
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k];
      });
    }
    return ret
  }
}

var once_1 = wrappy_1(once);
var strict = wrappy_1(onceStrict);

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  });

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  });
});

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  f.called = false;
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  var name = fn.name || 'Function wrapped with `once`';
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f
}
once_1.strict = strict;

var domain; // The domain module is executed on demand
var hasSetImmediate = typeof setImmediate === "function";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including network IO events in Node.js.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
var raw = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Avoids a function call
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory excaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

rawAsap.requestFlush = requestFlush;
function requestFlush() {
    // Ensure flushing is not bound to any domain.
    // It is not sufficient to exit the domain, because domains exist on a stack.
    // To execute code outside of any domain, the following dance is necessary.
    var parentDomain = process.domain;
    if (parentDomain) {
        if (!domain) {
            // Lazy execute the domain module.
            // Only employed if the user elects to use domains.
            domain = require$$0$1;
        }
        domain.active = process.domain = null;
    }

    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
    // cannot handle recursion.
    // `requestFlush` will only be called recursively from `asap.js`, to resume
    // flushing after an error is thrown into a domain.
    // Conveniently, `setImmediate` was introduced in the same version
    // `process.nextTick` started throwing recursion errors.
    if (flushing && hasSetImmediate) {
        setImmediate(flush);
    } else {
        process.nextTick(flush);
    }

    if (parentDomain) {
        domain.active = process.domain = parentDomain;
    }
}

var freeTasks = [];

/**
 * Calls a task as soon as possible after returning, in its own event, with
 * priority over IO events. An exception thrown in a task can be handled by
 * `process.on("uncaughtException") or `domain.on("error")`, but will otherwise
 * crash the process. If the error is handled, all subsequent tasks will
 * resume.
 *
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
var asap_1 = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawTask.domain = process.domain;
    raw(rawTask);
}

function RawTask() {
    this.task = null;
    this.domain = null;
}

RawTask.prototype.call = function () {
    if (this.domain) {
        this.domain.enter();
    }
    var threw = true;
    try {
        this.task.call();
        threw = false;
        // If the task throws an exception (presumably) Node.js restores the
        // domain stack for the next event.
        if (this.domain) {
            this.domain.exit();
        }
    } finally {
        // We use try/finally and a threw flag to avoid messing up stack traces
        // when we catch and release errors.
        if (threw) {
            // In Node.js, uncaught exceptions are considered fatal errors.
            // Re-throw them to interrupt flushing!
            // Ensure that flushing continues if an uncaught exception is
            // suppressed listening process.on("uncaughtException") or
            // domain.on("error").
            raw.requestFlush();
        }
        // If the task threw an error, we do not want to exit the domain here.
        // Exiting the domain would prevent the domain from catching the error.
        this.task = null;
        this.domain = null;
        freeTasks.push(this);
    }
};

var dezalgo_1 = wrappy_1(dezalgo);



function dezalgo (cb) {
  var sync = true;
  asap_1(function () {
    sync = false;
  });

  return function zalgoSafe() {
    var args = arguments;
    var me = this;
    if (sync)
      asap_1(function() {
        cb.apply(me, args);
      });
    else
      cb.apply(me, args);
  }
}

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

var origSymbol = typeof Symbol !== 'undefined' && Symbol;


var hasSymbols$1 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return shams();
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr$1 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$1.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var functionBind = Function.prototype.bind || implementation;

var src$2 = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$1;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError$1 = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError$1();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = hasSymbols$1();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined$1,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined$1,
	'%Symbol%': hasSymbols ? Symbol : undefined$1,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError$1,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto = getProto(getProto(e));
	INTRINSICS['%Error.prototype%'] = errorProto;
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};



var $concat$1 = functionBind.call(Function.call, Array.prototype.concat);
var $spliceApply = functionBind.call(Function.apply, Array.prototype.splice);
var $replace$1 = functionBind.call(Function.call, String.prototype.replace);
var $strSlice = functionBind.call(Function.call, String.prototype.slice);
var $exec = functionBind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$1(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$1(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (src$2(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (src$2(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$1('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$1('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$1('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat$1([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (src$2(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$1('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$1;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = src$2(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var callBind = createCommonjsModule(function (module) {




var $apply = getIntrinsic('%Function.prototype.apply%');
var $call = getIntrinsic('%Function.prototype.call%');
var $reflectApply = getIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

var $gOPD = getIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = getIntrinsic('%Object.defineProperty%', true);
var $max = getIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(functionBind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(functionBind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}
});

var $indexOf = callBind(getIntrinsic('String.prototype.indexOf'));

var callBound = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = getIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

var util_inspect = util_1.inspect;

var utilInspect = util_inspect;

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}


var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$3(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$3(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$3(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has$3(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has$3(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray$3(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$3(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp$1(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray$3(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp$1(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray$3(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp$1(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$3(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray$3(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$3(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$3(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

var inspect = objectInspect;

var $TypeError = getIntrinsic('%TypeError%');
var $WeakMap = getIntrinsic('%WeakMap%', true);
var $Map = getIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

var sideChannel = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

var formats = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

var has$2 = Object.prototype.hasOwnProperty;
var isArray$2 = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray$2(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray$2(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has$2.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray$2(target) && !isArray$2(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray$2(target) && isArray$2(source)) {
        source.forEach(function (item, i) {
            if (has$2.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has$2.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        /* eslint operator-linebreak: [2, "before"] */
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray$2(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

var utils$1 = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

var has$1 = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray$1 = Array.isArray;
var push$1 = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push$1.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults$1 = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils$1.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var sentinel = {};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    commaRoundTrip,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel$1
) {
    var obj = object;

    var tmpSc = sideChannel$1;
    var step = 0;
    var findFlag = false;
    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
        // Where object last appeared in the ref tree
        var pos = tmpSc.get(object);
        step += 1;
        if (typeof pos !== 'undefined') {
            if (pos === step) {
                throw new RangeError('Cyclic object value');
            } else {
                findFlag = true; // Break while
            }
        }
        if (typeof tmpSc.get(sentinel) === 'undefined') {
            step = 0;
        }
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
        obj = utils$1.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults$1.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils$1.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults$1.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults$1.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
        // we need to join elements in
        if (encodeValuesOnly && encoder) {
            obj = utils$1.maybeMap(obj, encoder);
        }
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
    } else if (isArray$1(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    var adjustedPrefix = commaRoundTrip && isArray$1(obj) && obj.length === 1 ? prefix + '[]' : prefix;

    for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray$1(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
            : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel$1.set(object, step);
        var valueSideChannel = sideChannel();
        valueSideChannel.set(sentinel, sideChannel$1);
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            strictNullHandling,
            skipNulls,
            generateArrayPrefix === 'comma' && encodeValuesOnly && isArray$1(obj) ? null : encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults$1;
    }

    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults$1.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has$1.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults$1.filter;
    if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults$1.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults$1.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults$1.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults$1.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults$1.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults$1.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults$1.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
    };
};

var stringify_1 = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray$1(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
    if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
    }
    var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel$1 = sideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel$1
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils$1.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils$1.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils$1.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else if (cleanRoot !== '__proto__') {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils$1.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

var parse$4 = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils$1.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils$1.compact(obj);
};

var lib = {
    formats: formats,
    parse: parse$4,
    stringify: stringify_1
};

/* eslint-disable no-underscore-dangle */

const { Transform: Transform$2 } = stream_1;

class DummyParser extends Transform$2 {
  constructor(incomingForm, options = {}) {
    super();
    this.globalOptions = { ...options };
    this.incomingForm = incomingForm;
  }

  _flush(callback) {
    this.incomingForm.ended = true;
    this.incomingForm._maybeEnd();
    callback();
  }
}

var Dummy = DummyParser;

/* eslint-disable no-plusplus */
const missingPlugin = 1000;
const pluginFunction = 1001;
const aborted = 1002;
const noParser = 1003;
const uninitializedParser = 1004;
const filenameNotString = 1005;
const maxFieldsSizeExceeded = 1006;
const maxFieldsExceeded = 1007;
const smallerThanMinFileSize = 1008;
const biggerThanMaxFileSize = 1009;
const noEmptyFiles = 1010;
const missingContentType = 1011;
const malformedMultipart = 1012;
const missingMultipartBoundary = 1013;
const unknownTransferEncoding = 1014;

const FormidableError$2 = class extends Error {
  constructor(message, internalCode, httpCode = 500) {
    super(message);
    this.code = internalCode;
    this.httpCode = httpCode;
  }
};

var FormidableError_1 = {
  missingPlugin,
  pluginFunction,
  aborted,
  noParser,
  uninitializedParser,
  filenameNotString,
  maxFieldsSizeExceeded,
  maxFieldsExceeded,
  smallerThanMinFileSize,
  biggerThanMaxFileSize,
  noEmptyFiles,
  missingContentType,
  malformedMultipart,
  missingMultipartBoundary,
  unknownTransferEncoding,

  FormidableError: FormidableError$2,
};

/* eslint-disable no-fallthrough */

var Multipart = createCommonjsModule(function (module, exports) {

const { Transform } = stream_1;


const { FormidableError } = FormidableError_1;

let s = 0;
const STATE = {
  PARSER_UNINITIALIZED: s++,
  START: s++,
  START_BOUNDARY: s++,
  HEADER_FIELD_START: s++,
  HEADER_FIELD: s++,
  HEADER_VALUE_START: s++,
  HEADER_VALUE: s++,
  HEADER_VALUE_ALMOST_DONE: s++,
  HEADERS_ALMOST_DONE: s++,
  PART_DATA_START: s++,
  PART_DATA: s++,
  PART_END: s++,
  END: s++,
};

let f = 1;
const FBOUNDARY = { PART_BOUNDARY: f, LAST_BOUNDARY: (f *= 2) };

const LF = 10;
const CR = 13;
const SPACE = 32;
const HYPHEN = 45;
const COLON = 58;
const A = 97;
const Z = 122;

function lower(c) {
  return c | 0x20;
}

exports.STATES = {};

Object.keys(STATE).forEach((stateName) => {
  exports.STATES[stateName] = STATE[stateName];
});

class MultipartParser extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true });
    this.boundary = null;
    this.boundaryChars = null;
    this.lookbehind = null;
    this.bufferLength = 0;
    this.state = STATE.PARSER_UNINITIALIZED;

    this.globalOptions = { ...options };
    this.index = null;
    this.flags = 0;
  }

  _flush(done) {
    if (
      (this.state === STATE.HEADER_FIELD_START && this.index === 0) ||
      (this.state === STATE.PART_DATA && this.index === this.boundary.length)
    ) {
      this._handleCallback('partEnd');
      this._handleCallback('end');
      done();
    } else if (this.state !== STATE.END) {
      done(
        new FormidableError(
          `MultipartParser.end(): stream ended unexpectedly: ${this.explain()}`,
          FormidableError_1.malformedMultipart,
          400,
        ),
      );
    }
  }

  initWithBoundary(str) {
    this.boundary = Buffer.from(`\r\n--${str}`);
    this.lookbehind = Buffer.alloc(this.boundary.length + 8);
    this.state = STATE.START;
    this.boundaryChars = {};

    for (let i = 0; i < this.boundary.length; i++) {
      this.boundaryChars[this.boundary[i]] = true;
    }
  }

  // eslint-disable-next-line max-params
  _handleCallback(name, buf, start, end) {
    if (start !== undefined && start === end) {
      return;
    }
    this.push({ name, buffer: buf, start, end });
  }

  // eslint-disable-next-line max-statements
  _transform(buffer, _, done) {
    let i = 0;
    let prevIndex = this.index;
    let { index, state, flags } = this;
    const { lookbehind, boundary, boundaryChars } = this;
    const boundaryLength = boundary.length;
    const boundaryEnd = boundaryLength - 1;
    this.bufferLength = buffer.length;
    let c = null;
    let cl = null;

    const setMark = (name, idx) => {
      this[`${name}Mark`] = typeof idx === 'number' ? idx : i;
    };

    const clearMarkSymbol = (name) => {
      delete this[`${name}Mark`];
    };

    const dataCallback = (name, shouldClear) => {
      const markSymbol = `${name}Mark`;
      if (!(markSymbol in this)) {
        return;
      }

      if (!shouldClear) {
        this._handleCallback(name, buffer, this[markSymbol], buffer.length);
        setMark(name, 0);
      } else {
        this._handleCallback(name, buffer, this[markSymbol], i);
        clearMarkSymbol(name);
      }
    };

    for (i = 0; i < this.bufferLength; i++) {
      c = buffer[i];
      switch (state) {
        case STATE.PARSER_UNINITIALIZED:
          return i;
        case STATE.START:
          index = 0;
          state = STATE.START_BOUNDARY;
        case STATE.START_BOUNDARY:
          if (index === boundary.length - 2) {
            if (c === HYPHEN) {
              flags |= FBOUNDARY.LAST_BOUNDARY;
            } else if (c !== CR) {
              return i;
            }
            index++;
            break;
          } else if (index - 1 === boundary.length - 2) {
            if (flags & FBOUNDARY.LAST_BOUNDARY && c === HYPHEN) {
              this._handleCallback('end');
              state = STATE.END;
              flags = 0;
            } else if (!(flags & FBOUNDARY.LAST_BOUNDARY) && c === LF) {
              index = 0;
              this._handleCallback('partBegin');
              state = STATE.HEADER_FIELD_START;
            } else {
              return i;
            }
            break;
          }

          if (c !== boundary[index + 2]) {
            index = -2;
          }
          if (c === boundary[index + 2]) {
            index++;
          }
          break;
        case STATE.HEADER_FIELD_START:
          state = STATE.HEADER_FIELD;
          setMark('headerField');
          index = 0;
        case STATE.HEADER_FIELD:
          if (c === CR) {
            clearMarkSymbol('headerField');
            state = STATE.HEADERS_ALMOST_DONE;
            break;
          }

          index++;
          if (c === HYPHEN) {
            break;
          }

          if (c === COLON) {
            if (index === 1) {
              // empty header field
              return i;
            }
            dataCallback('headerField', true);
            state = STATE.HEADER_VALUE_START;
            break;
          }

          cl = lower(c);
          if (cl < A || cl > Z) {
            return i;
          }
          break;
        case STATE.HEADER_VALUE_START:
          if (c === SPACE) {
            break;
          }

          setMark('headerValue');
          state = STATE.HEADER_VALUE;
        case STATE.HEADER_VALUE:
          if (c === CR) {
            dataCallback('headerValue', true);
            this._handleCallback('headerEnd');
            state = STATE.HEADER_VALUE_ALMOST_DONE;
          }
          break;
        case STATE.HEADER_VALUE_ALMOST_DONE:
          if (c !== LF) {
            return i;
          }
          state = STATE.HEADER_FIELD_START;
          break;
        case STATE.HEADERS_ALMOST_DONE:
          if (c !== LF) {
            return i;
          }

          this._handleCallback('headersEnd');
          state = STATE.PART_DATA_START;
          break;
        case STATE.PART_DATA_START:
          state = STATE.PART_DATA;
          setMark('partData');
        case STATE.PART_DATA:
          prevIndex = index;

          if (index === 0) {
            // boyer-moore derrived algorithm to safely skip non-boundary data
            i += boundaryEnd;
            while (i < this.bufferLength && !(buffer[i] in boundaryChars)) {
              i += boundaryLength;
            }
            i -= boundaryEnd;
            c = buffer[i];
          }

          if (index < boundary.length) {
            if (boundary[index] === c) {
              if (index === 0) {
                dataCallback('partData', true);
              }
              index++;
            } else {
              index = 0;
            }
          } else if (index === boundary.length) {
            index++;
            if (c === CR) {
              // CR = part boundary
              flags |= FBOUNDARY.PART_BOUNDARY;
            } else if (c === HYPHEN) {
              // HYPHEN = end boundary
              flags |= FBOUNDARY.LAST_BOUNDARY;
            } else {
              index = 0;
            }
          } else if (index - 1 === boundary.length) {
            if (flags & FBOUNDARY.PART_BOUNDARY) {
              index = 0;
              if (c === LF) {
                // unset the PART_BOUNDARY flag
                flags &= ~FBOUNDARY.PART_BOUNDARY;
                this._handleCallback('partEnd');
                this._handleCallback('partBegin');
                state = STATE.HEADER_FIELD_START;
                break;
              }
            } else if (flags & FBOUNDARY.LAST_BOUNDARY) {
              if (c === HYPHEN) {
                this._handleCallback('partEnd');
                this._handleCallback('end');
                state = STATE.END;
                flags = 0;
              } else {
                index = 0;
              }
            } else {
              index = 0;
            }
          }

          if (index > 0) {
            // when matching a possible boundary, keep a lookbehind reference
            // in case it turns out to be a false lead
            lookbehind[index - 1] = c;
          } else if (prevIndex > 0) {
            // if our boundary turned out to be rubbish, the captured lookbehind
            // belongs to partData
            this._handleCallback('partData', lookbehind, 0, prevIndex);
            prevIndex = 0;
            setMark('partData');

            // reconsider the current character even so it interrupted the sequence
            // it could be the beginning of a new sequence
            i--;
          }

          break;
        case STATE.END:
          break;
        default:
          return i;
      }
    }

    dataCallback('headerField');
    dataCallback('headerValue');
    dataCallback('partData');

    this.index = index;
    this.state = state;
    this.flags = flags;

    done();
    return this.bufferLength;
  }

  explain() {
    return `state = ${MultipartParser.stateToString(this.state)}`;
  }
}

// eslint-disable-next-line consistent-return
MultipartParser.stateToString = (stateNumber) => {
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const stateName in STATE) {
    const number = STATE[stateName];
    if (number === stateNumber) return stateName;
  }
};

module.exports = Object.assign(MultipartParser, { STATES: exports.STATES });
});

var hexoid = /*@__PURE__*/getAugmentedNamespace(dist$f);

/* eslint-disable class-methods-use-this */






const { EventEmitter: EventEmitter$b } = events;
const { StringDecoder } = require$$1$2;


const toHexoId = hexoid(25);
const DEFAULT_OPTIONS = {
  maxFields: 1000,
  maxFieldsSize: 20 * 1024 * 1024,
  maxFileSize: 200 * 1024 * 1024,
  minFileSize: 1,
  allowEmptyFiles: true,
  keepExtensions: false,
  encoding: 'utf-8',
  hashAlgorithm: false,
  uploadDir: os.tmpdir(),
  multiples: false,
  enabledPlugins: ['octetstream', 'querystring', 'multipart', 'json'],
  fileWriteStreamHandler: null,
  defaultInvalidName: 'invalid-name',
  filter: function () {
    return true;
  },
};







const { FormidableError: FormidableError$1 } = FormidableError_1;

function hasOwnProp(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

class IncomingForm extends EventEmitter$b {
  constructor(options = {}) {
    super();

    this.options = { ...DEFAULT_OPTIONS, ...options };

    const dir = path.resolve(
      this.options.uploadDir || this.options.uploaddir || os.tmpdir(),
    );

    this.uploaddir = dir;
    this.uploadDir = dir;

    // initialize with null
    [
      'error',
      'headers',
      'type',
      'bytesExpected',
      'bytesReceived',
      '_parser',
    ].forEach((key) => {
      this[key] = null;
    });

    this._setUpRename();

    this._flushing = 0;
    this._fieldsSize = 0;
    this._fileSize = 0;
    this._plugins = [];
    this.openedFiles = [];

    this.options.enabledPlugins = []
      .concat(this.options.enabledPlugins)
      .filter(Boolean);

    if (this.options.enabledPlugins.length === 0) {
      throw new FormidableError$1(
        'expect at least 1 enabled builtin plugin, see options.enabledPlugins',
        FormidableError_1.missingPlugin,
      );
    }

    this.options.enabledPlugins.forEach((pluginName) => {
      const plgName = pluginName.toLowerCase();
      // eslint-disable-next-line import/no-dynamic-require, global-require
      this.use(commonjsRequire(path.join(__dirname, 'plugins', `${plgName}.js`)));
    });

    this._setUpMaxFields();
  }

  use(plugin) {
    if (typeof plugin !== 'function') {
      throw new FormidableError$1(
        '.use: expect `plugin` to be a function',
        FormidableError_1.pluginFunction,
      );
    }
    this._plugins.push(plugin.bind(this));
    return this;
  }

  parse(req, cb) {
    this.pause = () => {
      try {
        req.pause();
      } catch (err) {
        // the stream was destroyed
        if (!this.ended) {
          // before it was completed, crash & burn
          this._error(err);
        }
        return false;
      }
      return true;
    };

    this.resume = () => {
      try {
        req.resume();
      } catch (err) {
        // the stream was destroyed
        if (!this.ended) {
          // before it was completed, crash & burn
          this._error(err);
        }
        return false;
      }

      return true;
    };

    // Setup callback first, so we don't miss anything from data events emitted immediately.
    if (cb) {
      const callback = once_1(dezalgo_1(cb));
      const fields = {};
      let mockFields = '';
      const files = {};

      this.on('field', (name, value) => {
        if (
          this.options.multiples &&
          (this.type === 'multipart' || this.type === 'urlencoded')
        ) {
          const mObj = { [name]: value };
          mockFields = mockFields
            ? `${mockFields}&${lib.stringify(mObj)}`
            : `${lib.stringify(mObj)}`;
        } else {
          fields[name] = value;
        }
      });
      this.on('file', (name, file) => {
        // TODO: too much nesting
        if (this.options.multiples) {
          if (hasOwnProp(files, name)) {
            if (!Array.isArray(files[name])) {
              files[name] = [files[name]];
            }
            files[name].push(file);
          } else {
            files[name] = file;
          }
        } else {
          files[name] = file;
        }
      });
      this.on('error', (err) => {
        callback(err, fields, files);
      });
      this.on('end', () => {
        if (this.options.multiples) {
          Object.assign(fields, lib.parse(mockFields));
        }
        callback(null, fields, files);
      });
    }

    // Parse headers and setup the parser, ready to start listening for data.
    this.writeHeaders(req.headers);

    // Start listening for data.
    req
      .on('error', (err) => {
        this._error(err);
      })
      .on('aborted', () => {
        this.emit('aborted');
        this._error(new FormidableError$1('Request aborted', FormidableError_1.aborted));
      })
      .on('data', (buffer) => {
        try {
          this.write(buffer);
        } catch (err) {
          this._error(err);
        }
      })
      .on('end', () => {
        if (this.error) {
          return;
        }
        if (this._parser) {
          this._parser.end();
        }
        this._maybeEnd();
      });

    return this;
  }

  writeHeaders(headers) {
    this.headers = headers;
    this._parseContentLength();
    this._parseContentType();

    if (!this._parser) {
      this._error(
        new FormidableError$1(
          'no parser found',
          FormidableError_1.noParser,
          415, // Unsupported Media Type
        ),
      );
      return;
    }

    this._parser.once('error', (error) => {
      this._error(error);
    });
  }

  write(buffer) {
    if (this.error) {
      return null;
    }
    if (!this._parser) {
      this._error(
        new FormidableError$1('uninitialized parser', FormidableError_1.uninitializedParser),
      );
      return null;
    }

    this.bytesReceived += buffer.length;
    this.emit('progress', this.bytesReceived, this.bytesExpected);

    this._parser.write(buffer);

    return this.bytesReceived;
  }

  pause() {
    // this does nothing, unless overwritten in IncomingForm.parse
    return false;
  }

  resume() {
    // this does nothing, unless overwritten in IncomingForm.parse
    return false;
  }

  onPart(part) {
    // this method can be overwritten by the user
    this._handlePart(part);
  }

  _handlePart(part) {
    if (part.originalFilename && typeof part.originalFilename !== 'string') {
      this._error(
        new FormidableError$1(
          `the part.originalFilename should be string when it exists`,
          FormidableError_1.filenameNotString,
        ),
      );
      return;
    }

    // This MUST check exactly for undefined. You can not change it to !part.originalFilename.

    // todo: uncomment when switch tests to Jest
    // console.log(part);

    // ? NOTE(@tunnckocore): no it can be any falsey value, it most probably depends on what's returned
    // from somewhere else. Where recently I changed the return statements
    // and such thing because code style
    // ? NOTE(@tunnckocore): or even better, if there is no mimetype, then it's for sure a field
    // ? NOTE(@tunnckocore): originalFilename is an empty string when a field?
    if (!part.mimetype) {
      let value = '';
      const decoder = new StringDecoder(
        part.transferEncoding || this.options.encoding,
      );

      part.on('data', (buffer) => {
        this._fieldsSize += buffer.length;
        if (this._fieldsSize > this.options.maxFieldsSize) {
          this._error(
            new FormidableError$1(
              `options.maxFieldsSize (${this.options.maxFieldsSize} bytes) exceeded, received ${this._fieldsSize} bytes of field data`,
              FormidableError_1.maxFieldsSizeExceeded,
              413, // Payload Too Large
            ),
          );
          return;
        }
        value += decoder.write(buffer);
      });

      part.on('end', () => {
        this.emit('field', part.name, value);
      });
      return;
    }

    if (!this.options.filter(part)) {
      return;
    }

    this._flushing += 1;

    const newFilename = this._getNewName(part);
    const filepath = this._joinDirectoryName(newFilename);
    const file = this._newFile({
      newFilename,
      filepath,
      originalFilename: part.originalFilename,
      mimetype: part.mimetype,
    });
    file.on('error', (err) => {
      this._error(err);
    });
    this.emit('fileBegin', part.name, file);

    file.open();
    this.openedFiles.push(file);

    part.on('data', (buffer) => {
      this._fileSize += buffer.length;
      if (this._fileSize < this.options.minFileSize) {
        this._error(
          new FormidableError$1(
            `options.minFileSize (${this.options.minFileSize} bytes) inferior, received ${this._fileSize} bytes of file data`,
            FormidableError_1.smallerThanMinFileSize,
            400,
          ),
        );
        return;
      }
      if (this._fileSize > this.options.maxFileSize) {
        this._error(
          new FormidableError$1(
            `options.maxFileSize (${this.options.maxFileSize} bytes) exceeded, received ${this._fileSize} bytes of file data`,
            FormidableError_1.biggerThanMaxFileSize,
            413,
          ),
        );
        return;
      }
      if (buffer.length === 0) {
        return;
      }
      this.pause();
      file.write(buffer, () => {
        this.resume();
      });
    });

    part.on('end', () => {
      if (!this.options.allowEmptyFiles && this._fileSize === 0) {
        this._error(
          new FormidableError$1(
            `options.allowEmptyFiles is false, file size should be greather than 0`,
            FormidableError_1.noEmptyFiles,
            400,
          ),
        );
        return;
      }

      file.end(() => {
        this._flushing -= 1;
        this.emit('file', part.name, file);
        this._maybeEnd();
      });
    });
  }

  // eslint-disable-next-line max-statements
  _parseContentType() {
    if (this.bytesExpected === 0) {
      this._parser = new Dummy(this, this.options);
      return;
    }

    if (!this.headers['content-type']) {
      this._error(
        new FormidableError$1(
          'bad content-type header, no content-type',
          FormidableError_1.missingContentType,
          400,
        ),
      );
      return;
    }

    const results = [];
    new Dummy(this, this.options);

    // eslint-disable-next-line no-plusplus
    for (let idx = 0; idx < this._plugins.length; idx++) {
      const plugin = this._plugins[idx];

      let pluginReturn = null;

      try {
        pluginReturn = plugin(this, this.options) || this;
      } catch (err) {
        // directly throw from the `form.parse` method;
        // there is no other better way, except a handle through options
        const error = new FormidableError$1(
          `plugin on index ${idx} failed with: ${err.message}`,
          FormidableError_1.pluginFailed,
          500,
        );
        error.idx = idx;
        throw error;
      }

      Object.assign(this, pluginReturn);

      // todo: use Set/Map and pass plugin name instead of the `idx` index
      this.emit('plugin', idx, pluginReturn);
      results.push(pluginReturn);
    }

    this.emit('pluginsResults', results);

    // NOTE: probably not needed, because we check options.enabledPlugins in the constructor
    // if (results.length === 0 /* && results.length !== this._plugins.length */) {
    //   this._error(
    //     new Error(
    //       `bad content-type header, unknown content-type: ${this.headers['content-type']}`,
    //     ),
    //   );
    // }
  }

  _error(err, eventName = 'error') {
    // if (!err && this.error) {
    //   this.emit('error', this.error);
    //   return;
    // }
    if (this.error || this.ended) {
      return;
    }

    this.error = err;
    this.emit(eventName, err);

    if (Array.isArray(this.openedFiles)) {
      this.openedFiles.forEach((file) => {
        file.destroy();
      });
    }
  }

  _parseContentLength() {
    this.bytesReceived = 0;
    if (this.headers['content-length']) {
      this.bytesExpected = parseInt(this.headers['content-length'], 10);
    } else if (this.headers['transfer-encoding'] === undefined) {
      this.bytesExpected = 0;
    }

    if (this.bytesExpected !== null) {
      this.emit('progress', this.bytesReceived, this.bytesExpected);
    }
  }

  _newParser() {
    return new Multipart(this.options);
  }

  _newFile({ filepath, originalFilename, mimetype, newFilename }) {
    return this.options.fileWriteStreamHandler
      ? new VolatileFile_1({
          newFilename,
          filepath,
          originalFilename,
          mimetype,
          createFileWriteStream: this.options.fileWriteStreamHandler,
          hashAlgorithm: this.options.hashAlgorithm,
        })
      : new PersistentFile_1({
          newFilename,
          filepath,
          originalFilename,
          mimetype,
          hashAlgorithm: this.options.hashAlgorithm,
        });
  }

  _getFileName(headerValue) {
    // matches either a quoted-string or a token (RFC 2616 section 19.5.1)
    const m = headerValue.match(
      /\bfilename=("(.*?)"|([^()<>{}[\]@,;:"?=\s/\t]+))($|;\s)/i,
    );
    if (!m) return null;

    const match = m[2] || m[3] || '';
    let originalFilename = match.substr(match.lastIndexOf('\\') + 1);
    originalFilename = originalFilename.replace(/%22/g, '"');
    originalFilename = originalFilename.replace(/&#([\d]{4});/g, (_, code) =>
      String.fromCharCode(code),
    );

    return originalFilename;
  }

  _getExtension(str) {
    if (!str) {
      return '';
    }

    const basename = path.basename(str);
    const firstDot = basename.indexOf('.');
    const lastDot = basename.lastIndexOf('.');
    const extname = path.extname(basename).replace(/(\.[a-z0-9]+).*/i, '$1');

    if (firstDot === lastDot) {
      return extname;
    }

    return basename.slice(firstDot, lastDot) + extname;
  }



  _joinDirectoryName(name) {
    const newPath = path.join(this.uploadDir, name);

    // prevent directory traversal attacks
    if (!newPath.startsWith(this.uploadDir)) {
      return path.join(this.uploadDir, this.options.defaultInvalidName);
    }

    return newPath;
  }

  _setUpRename() {
    const hasRename = typeof this.options.filename === 'function';
    if (hasRename) {
      this._getNewName = (part) => {
        let ext = '';
        let name = this.options.defaultInvalidName;
        if (part.originalFilename) {
          // can be null
          ({ ext, name } = path.parse(part.originalFilename));
          if (this.options.keepExtensions !== true) {
            ext = '';
          }
        }
        return this.options.filename.call(this, name, ext, part, this);
      };
    } else {
      this._getNewName = (part) => {
        const name = toHexoId();

        if (part && this.options.keepExtensions) {
          const originalFilename = typeof part === 'string' ? part : part.originalFilename;
          return `${name}${this._getExtension(originalFilename)}`;
        }
    
        return name;
      };
    }
  }

  _setUpMaxFields() {
    if (this.options.maxFields !== 0) {
      let fieldsCount = 0;
      this.on('field', () => {
        fieldsCount += 1;
        if (fieldsCount > this.options.maxFields) {
          this._error(
            new FormidableError$1(
              `options.maxFields (${this.options.maxFields}) exceeded`,
              FormidableError_1.maxFieldsExceeded,
              413,
            ),
          );
        }
      });
    }
  }

  _maybeEnd() {
    // console.log('ended', this.ended);
    // console.log('_flushing', this._flushing);
    // console.log('error', this.error);
    if (!this.ended || this._flushing || this.error) {
      return;
    }

    this.emit('end');
  }
}

IncomingForm.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
var Formidable = IncomingForm;

const { PassThrough } = stream_1;

class OctetStreamParser extends PassThrough {
  constructor(options = {}) {
    super();
    this.globalOptions = { ...options };
  }
}

var OctetStream = OctetStreamParser;

/* eslint-disable no-underscore-dangle */



// the `options` is also available through the `options` / `formidable.options`
var octetstream = function plugin(formidable, options) {
  // the `this` context is always formidable, as the first argument of a plugin
  // but this allows us to customize/test each plugin

  /* istanbul ignore next */
  const self = this || formidable;

  if (/octet-stream/i.test(self.headers['content-type'])) {
    init$2.call(self, self, options);
  }

  return self;
};

// Note that it's a good practice (but it's up to you) to use the `this.options` instead
// of the passed `options` (second) param, because when you decide
// to test the plugin you can pass custom `this` context to it (and so `this.options`)
function init$2(_self, _opts) {
  this.type = 'octet-stream';
  const originalFilename = this.headers['x-file-name'];
  const mimetype = this.headers['content-type'];

  const thisPart = {
    originalFilename,
    mimetype,
  };
  const newFilename = this._getNewName(thisPart);
  const filepath = this._joinDirectoryName(newFilename);
  const file = this._newFile({
    newFilename,
    filepath,
    originalFilename,
    mimetype,
  });

  this.emit('fileBegin', originalFilename, file);
  file.open();
  this.openedFiles.push(file);
  this._flushing += 1;

  this._parser = new OctetStream(this.options);

  // Keep track of writes that haven't finished so we don't emit the file before it's done being written
  let outstandingWrites = 0;

  this._parser.on('data', (buffer) => {
    this.pause();
    outstandingWrites += 1;

    file.write(buffer, () => {
      outstandingWrites -= 1;
      this.resume();

      if (this.ended) {
        this._parser.emit('doneWritingFile');
      }
    });
  });

  this._parser.on('end', () => {
    this._flushing -= 1;
    this.ended = true;

    const done = () => {
      file.end(() => {
        this.emit('file', 'file', file);
        this._maybeEnd();
      });
    };

    if (outstandingWrites === 0) {
      done();
    } else {
      this._parser.once('doneWritingFile', done);
    }
  });

  return this;
}

/* eslint-disable no-underscore-dangle */

const { Transform: Transform$1 } = stream_1;


// This is a buffering parser, not quite as nice as the multipart one.
// If I find time I'll rewrite this to be fully streaming as well
class QuerystringParser extends Transform$1 {
  constructor(options = {}) {
    super({ readableObjectMode: true });
    this.globalOptions = { ...options };
    this.buffer = '';
    this.bufferLength = 0;
  }

  _transform(buffer, encoding, callback) {
    this.buffer += buffer.toString('ascii');
    this.bufferLength = this.buffer.length;
    callback();
  }

  _flush(callback) {
    const fields = querystring$1.parse(this.buffer, '&', '=');
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in fields) {
      this.push({
        key,
        value: fields[key],
      });
    }
    this.buffer = '';
    callback();
  }
}

var Querystring = QuerystringParser;

/* eslint-disable no-underscore-dangle */



// the `options` is also available through the `this.options` / `formidable.options`
var querystring = function plugin(formidable, options) {
  // the `this` context is always formidable, as the first argument of a plugin
  // but this allows us to customize/test each plugin

  /* istanbul ignore next */
  const self = this || formidable;

  if (/urlencoded/i.test(self.headers['content-type'])) {
    init$1.call(self, self, options);
  }

  return self;
};

// Note that it's a good practice (but it's up to you) to use the `this.options` instead
// of the passed `options` (second) param, because when you decide
// to test the plugin you can pass custom `this` context to it (and so `this.options`)
function init$1(_self, _opts) {
  this.type = 'urlencoded';

  const parser = new Querystring(this.options);

  parser.on('data', ({ key, value }) => {
    this.emit('field', key, value);
  });

  parser.once('end', () => {
    this.ended = true;
    this._maybeEnd();
  });

  this._parser = parser;

  return this;
}

/* eslint-disable no-underscore-dangle */

const { Stream } = stream_1;



const { FormidableError } = FormidableError_1;

// the `options` is also available through the `options` / `formidable.options`
var multipart = function plugin(formidable, options) {
  // the `this` context is always formidable, as the first argument of a plugin
  // but this allows us to customize/test each plugin

  /* istanbul ignore next */
  const self = this || formidable;

  // NOTE: we (currently) support both multipart/form-data and multipart/related
  const multipart = /multipart/i.test(self.headers['content-type']);

  if (multipart) {
    const m = self.headers['content-type'].match(
      /boundary=(?:"([^"]+)"|([^;]+))/i,
    );
    if (m) {
      const initMultipart = createInitMultipart(m[1] || m[2]);
      initMultipart.call(self, self, options); // lgtm [js/superfluous-trailing-arguments]
    } else {
      const err = new FormidableError(
        'bad content-type header, no multipart boundary',
        FormidableError_1.missingMultipartBoundary,
        400,
      );
      self._error(err);
    }
  }
};

// Note that it's a good practice (but it's up to you) to use the `this.options` instead
// of the passed `options` (second) param, because when you decide
// to test the plugin you can pass custom `this` context to it (and so `this.options`)
function createInitMultipart(boundary) {
  return function initMultipart() {
    this.type = 'multipart';

    const parser = new Multipart(this.options);
    let headerField;
    let headerValue;
    let part;

    parser.initWithBoundary(boundary);

    // eslint-disable-next-line max-statements, consistent-return
    parser.on('data', ({ name, buffer, start, end }) => {
      if (name === 'partBegin') {
        part = new Stream();
        part.readable = true;
        part.headers = {};
        part.name = null;
        part.originalFilename = null;
        part.mimetype = null;

        part.transferEncoding = this.options.encoding;
        part.transferBuffer = '';

        headerField = '';
        headerValue = '';
      } else if (name === 'headerField') {
        headerField += buffer.toString(this.options.encoding, start, end);
      } else if (name === 'headerValue') {
        headerValue += buffer.toString(this.options.encoding, start, end);
      } else if (name === 'headerEnd') {
        headerField = headerField.toLowerCase();
        part.headers[headerField] = headerValue;

        // matches either a quoted-string or a token (RFC 2616 section 19.5.1)
        const m = headerValue.match(
          // eslint-disable-next-line no-useless-escape
          /\bname=("([^"]*)"|([^\(\)<>@,;:\\"\/\[\]\?=\{\}\s\t/]+))/i,
        );
        if (headerField === 'content-disposition') {
          if (m) {
            part.name = m[2] || m[3] || '';
          }

          part.originalFilename = this._getFileName(headerValue);
        } else if (headerField === 'content-type') {
          part.mimetype = headerValue;
        } else if (headerField === 'content-transfer-encoding') {
          part.transferEncoding = headerValue.toLowerCase();
        }

        headerField = '';
        headerValue = '';
      } else if (name === 'headersEnd') {
        switch (part.transferEncoding) {
          case 'binary':
          case '7bit':
          case '8bit':
          case 'utf-8': {
            const dataPropagation = (ctx) => {
              if (ctx.name === 'partData') {
                part.emit('data', ctx.buffer.slice(ctx.start, ctx.end));
              }
            };
            const dataStopPropagation = (ctx) => {
              if (ctx.name === 'partEnd') {
                part.emit('end');
                parser.off('data', dataPropagation);
                parser.off('data', dataStopPropagation);
              }
            };
            parser.on('data', dataPropagation);
            parser.on('data', dataStopPropagation);
            break;
          }
          case 'base64': {
            const dataPropagation = (ctx) => {
              if (ctx.name === 'partData') {
                part.transferBuffer += ctx.buffer
                  .slice(ctx.start, ctx.end)
                  .toString('ascii');

                /*
                  four bytes (chars) in base64 converts to three bytes in binary
                  encoding. So we should always work with a number of bytes that
                  can be divided by 4, it will result in a number of buytes that
                  can be divided vy 3.
                  */
                const offset = parseInt(part.transferBuffer.length / 4, 10) * 4;
                part.emit(
                  'data',
                  Buffer.from(
                    part.transferBuffer.substring(0, offset),
                    'base64',
                  ),
                );
                part.transferBuffer = part.transferBuffer.substring(offset);
              }
            };
            const dataStopPropagation = (ctx) => {
              if (ctx.name === 'partEnd') {
                part.emit('data', Buffer.from(part.transferBuffer, 'base64'));
                part.emit('end');
                parser.off('data', dataPropagation);
                parser.off('data', dataStopPropagation);
              }
            };
            parser.on('data', dataPropagation);
            parser.on('data', dataStopPropagation);
            break;
          }
          default:
            return this._error(
              new FormidableError(
                'unknown transfer-encoding',
                FormidableError_1.unknownTransferEncoding,
                501,
              ),
            );
        }

        this.onPart(part);
      } else if (name === 'end') {
        this.ended = true;
        this._maybeEnd();
      }
    });

    this._parser = parser;
  };
}

/* eslint-disable no-underscore-dangle */

const { Transform } = stream_1;

class JSONParser extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true });
    this.chunks = [];
    this.globalOptions = { ...options };
  }

  _transform(chunk, encoding, callback) {
    this.chunks.push(String(chunk)); // todo consider using a string decoder
    callback();
  }

  _flush(callback) {
    try {
      const fields = JSON.parse(this.chunks.join(''));
      Object.keys(fields).forEach((key) => {
        const value = fields[key];
        this.push({ key, value });
      });
    } catch (e) {
      callback(e);
      return;
    }
    this.chunks = null;
    callback();
  }
}

var _JSON = JSONParser;

/* eslint-disable no-underscore-dangle */



// the `options` is also available through the `this.options` / `formidable.options`
var json = function plugin(formidable, options) {
  // the `this` context is always formidable, as the first argument of a plugin
  // but this allows us to customize/test each plugin

  /* istanbul ignore next */
  const self = this || formidable;

  if (/json/i.test(self.headers['content-type'])) {
    init.call(self, self, options);
  }
};

// Note that it's a good practice (but it's up to you) to use the `this.options` instead
// of the passed `options` (second) param, because when you decide
// to test the plugin you can pass custom `this` context to it (and so `this.options`)
function init(_self, _opts) {
  this.type = 'json';

  const parser = new _JSON(this.options);

  parser.on('data', ({ key, value }) => {
    this.emit('field', key, value);
  });

  parser.once('end', () => {
    this.ended = true;
    this._maybeEnd();
  });

  this._parser = parser;
}

var plugins = createCommonjsModule(function (module, exports) {






Object.assign(exports, {
  octetstream,
  querystring,
  multipart,
  json,
});
});

var parsers = createCommonjsModule(function (module, exports) {







Object.assign(exports, {
  JSONParser: _JSON,
  DummyParser: Dummy,
  MultipartParser: Multipart,
  OctetStreamParser: OctetStream,
  OctetstreamParser: OctetStream,
  QueryStringParser: Querystring,
  QuerystringParser: Querystring,
});
});

// make it available without requiring the `new` keyword
// if you want it access `const formidable.IncomingForm` as v1
const formidable$1 = (...args) => new Formidable(...args);

var src$1 = Object.assign(formidable$1, {
  errors: FormidableError_1,
  File: PersistentFile_1,
  PersistentFile: PersistentFile_1,
  VolatileFile: VolatileFile_1,
  Formidable,
  formidable: formidable$1,

  // alias
  IncomingForm: Formidable,

  // parsers
  ...parsers,
  parsers,

  // misc
  defaultOptions: Formidable.DEFAULT_OPTIONS,
  enabledPlugins: Formidable.DEFAULT_OPTIONS.enabledPlugins,

  // plugins
  plugins: {
    ...plugins,
  },
});

var constants = {
  BINARY_TYPES: ['nodebuffer', 'arraybuffer', 'fragments'],
  EMPTY_BUFFER: Buffer.alloc(0),
  GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
  kForOnEventAttribute: Symbol('kIsForOnEventAttribute'),
  kListener: Symbol('kListener'),
  kStatusCode: Symbol('status-code'),
  kWebSocket: Symbol('websocket'),
  NOOP: () => {}
};

var bufferUtil = createCommonjsModule(function (module) {

const { EMPTY_BUFFER } = constants;

const FastBuffer = Buffer[Symbol.species];

/**
 * Merges an array of buffers into a new buffer.
 *
 * @param {Buffer[]} list The array of buffers to concat
 * @param {Number} totalLength The total length of buffers in the list
 * @return {Buffer} The resulting buffer
 * @public
 */
function concat(list, totalLength) {
  if (list.length === 0) return EMPTY_BUFFER;
  if (list.length === 1) return list[0];

  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;

  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    target.set(buf, offset);
    offset += buf.length;
  }

  if (offset < totalLength) {
    return new FastBuffer(target.buffer, target.byteOffset, offset);
  }

  return target;
}

/**
 * Masks a buffer using the given mask.
 *
 * @param {Buffer} source The buffer to mask
 * @param {Buffer} mask The mask to use
 * @param {Buffer} output The buffer where to store the result
 * @param {Number} offset The offset at which to start writing
 * @param {Number} length The number of bytes to mask.
 * @public
 */
function _mask(source, mask, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
}

/**
 * Unmasks a buffer using the given mask.
 *
 * @param {Buffer} buffer The buffer to unmask
 * @param {Buffer} mask The mask to use
 * @public
 */
function _unmask(buffer, mask) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask[i & 3];
  }
}

/**
 * Converts a buffer to an `ArrayBuffer`.
 *
 * @param {Buffer} buf The buffer to convert
 * @return {ArrayBuffer} Converted buffer
 * @public
 */
function toArrayBuffer(buf) {
  if (buf.length === buf.buffer.byteLength) {
    return buf.buffer;
  }

  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}

/**
 * Converts `data` to a `Buffer`.
 *
 * @param {*} data The data to convert
 * @return {Buffer} The buffer
 * @throws {TypeError}
 * @public
 */
function toBuffer(data) {
  toBuffer.readOnly = true;

  if (Buffer.isBuffer(data)) return data;

  let buf;

  if (data instanceof ArrayBuffer) {
    buf = new FastBuffer(data);
  } else if (ArrayBuffer.isView(data)) {
    buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
  } else {
    buf = Buffer.from(data);
    toBuffer.readOnly = false;
  }

  return buf;
}

module.exports = {
  concat,
  mask: _mask,
  toArrayBuffer,
  toBuffer,
  unmask: _unmask
};

/* istanbul ignore else  */
if (!process.env.WS_NO_BUFFER_UTIL) {
  try {
    const bufferUtil = require('bufferutil');

    module.exports.mask = function (source, mask, output, offset, length) {
      if (length < 48) _mask(source, mask, output, offset, length);
      else bufferUtil.mask(source, mask, output, offset, length);
    };

    module.exports.unmask = function (buffer, mask) {
      if (buffer.length < 32) _unmask(buffer, mask);
      else bufferUtil.unmask(buffer, mask);
    };
  } catch (e) {
    // Continue regardless of the error.
  }
}
});

const kDone = Symbol('kDone');
const kRun = Symbol('kRun');

/**
 * A very simple job queue with adjustable concurrency. Adapted from
 * https://github.com/STRML/async-limiter
 */
class Limiter {
  /**
   * Creates a new `Limiter`.
   *
   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
   *     to run concurrently
   */
  constructor(concurrency) {
    this[kDone] = () => {
      this.pending--;
      this[kRun]();
    };
    this.concurrency = concurrency || Infinity;
    this.jobs = [];
    this.pending = 0;
  }

  /**
   * Adds a job to the queue.
   *
   * @param {Function} job The job to run
   * @public
   */
  add(job) {
    this.jobs.push(job);
    this[kRun]();
  }

  /**
   * Removes a job from the queue and runs it if possible.
   *
   * @private
   */
  [kRun]() {
    if (this.pending === this.concurrency) return;

    if (this.jobs.length) {
      const job = this.jobs.shift();

      this.pending++;
      job(this[kDone]);
    }
  }
}

var limiter = Limiter;

const { kStatusCode: kStatusCode$2 } = constants;

const FastBuffer$1 = Buffer[Symbol.species];
const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
const kPerMessageDeflate = Symbol('permessage-deflate');
const kTotalLength = Symbol('total-length');
const kCallback = Symbol('callback');
const kBuffers = Symbol('buffers');
const kError$1 = Symbol('error');

//
// We limit zlib concurrency, which prevents severe memory fragmentation
// as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
// and https://github.com/websockets/ws/issues/1202
//
// Intentionally global; it's the global thread pool that's an issue.
//
let zlibLimiter;

/**
 * permessage-deflate implementation.
 */
class PerMessageDeflate {
  /**
   * Creates a PerMessageDeflate instance.
   *
   * @param {Object} [options] Configuration options
   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
   *     for, or request, a custom client window size
   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
   *     acknowledge disabling of client context takeover
   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
   *     calls to zlib
   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
   *     use of a custom server window size
   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
   *     disabling of server context takeover
   * @param {Number} [options.threshold=1024] Size (in bytes) below which
   *     messages should not be compressed if context takeover is disabled
   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
   *     deflate
   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
   *     inflate
   * @param {Boolean} [isServer=false] Create the instance in either server or
   *     client mode
   * @param {Number} [maxPayload=0] The maximum allowed message length
   */
  constructor(options, isServer, maxPayload) {
    this._maxPayload = maxPayload | 0;
    this._options = options || {};
    this._threshold =
      this._options.threshold !== undefined ? this._options.threshold : 1024;
    this._isServer = !!isServer;
    this._deflate = null;
    this._inflate = null;

    this.params = null;

    if (!zlibLimiter) {
      const concurrency =
        this._options.concurrencyLimit !== undefined
          ? this._options.concurrencyLimit
          : 10;
      zlibLimiter = new limiter(concurrency);
    }
  }

  /**
   * @type {String}
   */
  static get extensionName() {
    return 'permessage-deflate';
  }

  /**
   * Create an extension negotiation offer.
   *
   * @return {Object} Extension parameters
   * @public
   */
  offer() {
    const params = {};

    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }

    return params;
  }

  /**
   * Accept an extension negotiation offer/response.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Object} Accepted configuration
   * @public
   */
  accept(configurations) {
    configurations = this.normalizeParams(configurations);

    this.params = this._isServer
      ? this.acceptAsServer(configurations)
      : this.acceptAsClient(configurations);

    return this.params;
  }

  /**
   * Releases all resources used by the extension.
   *
   * @public
   */
  cleanup() {
    if (this._inflate) {
      this._inflate.close();
      this._inflate = null;
    }

    if (this._deflate) {
      const callback = this._deflate[kCallback];

      this._deflate.close();
      this._deflate = null;

      if (callback) {
        callback(
          new Error(
            'The deflate stream was closed while data was being processed'
          )
        );
      }
    }
  }

  /**
   *  Accept an extension negotiation offer.
   *
   * @param {Array} offers The extension negotiation offers
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsServer(offers) {
    const opts = this._options;
    const accepted = offers.find((params) => {
      if (
        (opts.serverNoContextTakeover === false &&
          params.server_no_context_takeover) ||
        (params.server_max_window_bits &&
          (opts.serverMaxWindowBits === false ||
            (typeof opts.serverMaxWindowBits === 'number' &&
              opts.serverMaxWindowBits > params.server_max_window_bits))) ||
        (typeof opts.clientMaxWindowBits === 'number' &&
          !params.client_max_window_bits)
      ) {
        return false;
      }

      return true;
    });

    if (!accepted) {
      throw new Error('None of the extension offers can be accepted');
    }

    if (opts.serverNoContextTakeover) {
      accepted.server_no_context_takeover = true;
    }
    if (opts.clientNoContextTakeover) {
      accepted.client_no_context_takeover = true;
    }
    if (typeof opts.serverMaxWindowBits === 'number') {
      accepted.server_max_window_bits = opts.serverMaxWindowBits;
    }
    if (typeof opts.clientMaxWindowBits === 'number') {
      accepted.client_max_window_bits = opts.clientMaxWindowBits;
    } else if (
      accepted.client_max_window_bits === true ||
      opts.clientMaxWindowBits === false
    ) {
      delete accepted.client_max_window_bits;
    }

    return accepted;
  }

  /**
   * Accept the extension negotiation response.
   *
   * @param {Array} response The extension negotiation response
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsClient(response) {
    const params = response[0];

    if (
      this._options.clientNoContextTakeover === false &&
      params.client_no_context_takeover
    ) {
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    }

    if (!params.client_max_window_bits) {
      if (typeof this._options.clientMaxWindowBits === 'number') {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      }
    } else if (
      this._options.clientMaxWindowBits === false ||
      (typeof this._options.clientMaxWindowBits === 'number' &&
        params.client_max_window_bits > this._options.clientMaxWindowBits)
    ) {
      throw new Error(
        'Unexpected or invalid parameter "client_max_window_bits"'
      );
    }

    return params;
  }

  /**
   * Normalize parameters.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Array} The offers/response with normalized parameters
   * @private
   */
  normalizeParams(configurations) {
    configurations.forEach((params) => {
      Object.keys(params).forEach((key) => {
        let value = params[key];

        if (value.length > 1) {
          throw new Error(`Parameter "${key}" must have only a single value`);
        }

        value = value[0];

        if (key === 'client_max_window_bits') {
          if (value !== true) {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (!this._isServer) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else if (key === 'server_max_window_bits') {
          const num = +value;
          if (!Number.isInteger(num) || num < 8 || num > 15) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
          value = num;
        } else if (
          key === 'client_no_context_takeover' ||
          key === 'server_no_context_takeover'
        ) {
          if (value !== true) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else {
          throw new Error(`Unknown parameter "${key}"`);
        }

        params[key] = value;
      });
    });

    return configurations;
  }

  /**
   * Decompress data. Concurrency limited.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._decompress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }

  /**
   * Compress data. Concurrency limited.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  compress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._compress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }

  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _decompress(data, fin, callback) {
    const endpoint = this._isServer ? 'client' : 'server';

    if (!this._inflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits =
        typeof this.params[key] !== 'number'
          ? zlib.Z_DEFAULT_WINDOWBITS
          : this.params[key];

      this._inflate = zlib.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits
      });
      this._inflate[kPerMessageDeflate] = this;
      this._inflate[kTotalLength] = 0;
      this._inflate[kBuffers] = [];
      this._inflate.on('error', inflateOnError);
      this._inflate.on('data', inflateOnData);
    }

    this._inflate[kCallback] = callback;

    this._inflate.write(data);
    if (fin) this._inflate.write(TRAILER);

    this._inflate.flush(() => {
      const err = this._inflate[kError$1];

      if (err) {
        this._inflate.close();
        this._inflate = null;
        callback(err);
        return;
      }

      const data = bufferUtil.concat(
        this._inflate[kBuffers],
        this._inflate[kTotalLength]
      );

      if (this._inflate._readableState.endEmitted) {
        this._inflate.close();
        this._inflate = null;
      } else {
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];

        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.reset();
        }
      }

      callback(null, data);
    });
  }

  /**
   * Compress data.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _compress(data, fin, callback) {
    const endpoint = this._isServer ? 'server' : 'client';

    if (!this._deflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits =
        typeof this.params[key] !== 'number'
          ? zlib.Z_DEFAULT_WINDOWBITS
          : this.params[key];

      this._deflate = zlib.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits
      });

      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];

      this._deflate.on('data', deflateOnData);
    }

    this._deflate[kCallback] = callback;

    this._deflate.write(data);
    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
      if (!this._deflate) {
        //
        // The deflate stream was closed while data was being processed.
        //
        return;
      }

      let data = bufferUtil.concat(
        this._deflate[kBuffers],
        this._deflate[kTotalLength]
      );

      if (fin) {
        data = new FastBuffer$1(data.buffer, data.byteOffset, data.length - 4);
      }

      //
      // Ensure that the callback will not be called again in
      // `PerMessageDeflate#cleanup()`.
      //
      this._deflate[kCallback] = null;

      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];

      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
        this._deflate.reset();
      }

      callback(null, data);
    });
  }
}

var permessageDeflate = PerMessageDeflate;

/**
 * The listener of the `zlib.DeflateRaw` stream `'data'` event.
 *
 * @param {Buffer} chunk A chunk of data
 * @private
 */
function deflateOnData(chunk) {
  this[kBuffers].push(chunk);
  this[kTotalLength] += chunk.length;
}

/**
 * The listener of the `zlib.InflateRaw` stream `'data'` event.
 *
 * @param {Buffer} chunk A chunk of data
 * @private
 */
function inflateOnData(chunk) {
  this[kTotalLength] += chunk.length;

  if (
    this[kPerMessageDeflate]._maxPayload < 1 ||
    this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload
  ) {
    this[kBuffers].push(chunk);
    return;
  }

  this[kError$1] = new RangeError('Max payload size exceeded');
  this[kError$1].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH';
  this[kError$1][kStatusCode$2] = 1009;
  this.removeListener('data', inflateOnData);
  this.reset();
}

/**
 * The listener of the `zlib.InflateRaw` stream `'error'` event.
 *
 * @param {Error} err The emitted error
 * @private
 */
function inflateOnError(err) {
  //
  // There is no need to call `Zlib#close()` as the handle is automatically
  // closed when an error is emitted.
  //
  this[kPerMessageDeflate]._inflate = null;
  err[kStatusCode$2] = 1007;
  this[kCallback](err);
}

var validation = createCommonjsModule(function (module) {

const { isUtf8 } = require$$0$2;

//
// Allowed token characters:
//
// '!', '#', '$', '%', '&', ''', '*', '+', '-',
// '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
//
// tokenChars[32] === 0 // ' '
// tokenChars[33] === 1 // '!'
// tokenChars[34] === 0 // '"'
// ...
//
// prettier-ignore
const tokenChars = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
  0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, // 32 - 47
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, // 80 - 95
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0 // 112 - 127
];

/**
 * Checks if a status code is allowed in a close frame.
 *
 * @param {Number} code The status code
 * @return {Boolean} `true` if the status code is valid, else `false`
 * @public
 */
function isValidStatusCode(code) {
  return (
    (code >= 1000 &&
      code <= 1014 &&
      code !== 1004 &&
      code !== 1005 &&
      code !== 1006) ||
    (code >= 3000 && code <= 4999)
  );
}

/**
 * Checks if a given buffer contains only correct UTF-8.
 * Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
 * Markus Kuhn.
 *
 * @param {Buffer} buf The buffer to check
 * @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
 * @public
 */
function _isValidUTF8(buf) {
  const len = buf.length;
  let i = 0;

  while (i < len) {
    if ((buf[i] & 0x80) === 0) {
      // 0xxxxxxx
      i++;
    } else if ((buf[i] & 0xe0) === 0xc0) {
      // 110xxxxx 10xxxxxx
      if (
        i + 1 === len ||
        (buf[i + 1] & 0xc0) !== 0x80 ||
        (buf[i] & 0xfe) === 0xc0 // Overlong
      ) {
        return false;
      }

      i += 2;
    } else if ((buf[i] & 0xf0) === 0xe0) {
      // 1110xxxx 10xxxxxx 10xxxxxx
      if (
        i + 2 >= len ||
        (buf[i + 1] & 0xc0) !== 0x80 ||
        (buf[i + 2] & 0xc0) !== 0x80 ||
        (buf[i] === 0xe0 && (buf[i + 1] & 0xe0) === 0x80) || // Overlong
        (buf[i] === 0xed && (buf[i + 1] & 0xe0) === 0xa0) // Surrogate (U+D800 - U+DFFF)
      ) {
        return false;
      }

      i += 3;
    } else if ((buf[i] & 0xf8) === 0xf0) {
      // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      if (
        i + 3 >= len ||
        (buf[i + 1] & 0xc0) !== 0x80 ||
        (buf[i + 2] & 0xc0) !== 0x80 ||
        (buf[i + 3] & 0xc0) !== 0x80 ||
        (buf[i] === 0xf0 && (buf[i + 1] & 0xf0) === 0x80) || // Overlong
        (buf[i] === 0xf4 && buf[i + 1] > 0x8f) ||
        buf[i] > 0xf4 // > U+10FFFF
      ) {
        return false;
      }

      i += 4;
    } else {
      return false;
    }
  }

  return true;
}

module.exports = {
  isValidStatusCode,
  isValidUTF8: _isValidUTF8,
  tokenChars
};

if (isUtf8) {
  module.exports.isValidUTF8 = function (buf) {
    return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
  };
} /* istanbul ignore else  */ else if (!process.env.WS_NO_UTF_8_VALIDATE) {
  try {
    const isValidUTF8 = require('utf-8-validate');

    module.exports.isValidUTF8 = function (buf) {
      return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
    };
  } catch (e) {
    // Continue regardless of the error.
  }
}
});

const { Writable } = stream_1;


const {
  BINARY_TYPES: BINARY_TYPES$1,
  EMPTY_BUFFER: EMPTY_BUFFER$2,
  kStatusCode: kStatusCode$1,
  kWebSocket: kWebSocket$2
} = constants;
const { concat, toArrayBuffer, unmask } = bufferUtil;
const { isValidStatusCode: isValidStatusCode$1, isValidUTF8 } = validation;

const FastBuffer = Buffer[Symbol.species];
const GET_INFO = 0;
const GET_PAYLOAD_LENGTH_16 = 1;
const GET_PAYLOAD_LENGTH_64 = 2;
const GET_MASK = 3;
const GET_DATA = 4;
const INFLATING = 5;

/**
 * HyBi Receiver implementation.
 *
 * @extends Writable
 */
class Receiver extends Writable {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} [options] Options object
   * @param {String} [options.binaryType=nodebuffer] The type for binary data
   * @param {Object} [options.extensions] An object containing the negotiated
   *     extensions
   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
   *     client or server mode
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   */
  constructor(options = {}) {
    super();

    this._binaryType = options.binaryType || BINARY_TYPES$1[0];
    this._extensions = options.extensions || {};
    this._isServer = !!options.isServer;
    this._maxPayload = options.maxPayload | 0;
    this._skipUTF8Validation = !!options.skipUTF8Validation;
    this[kWebSocket$2] = undefined;

    this._bufferedBytes = 0;
    this._buffers = [];

    this._compressed = false;
    this._payloadLength = 0;
    this._mask = undefined;
    this._fragmented = 0;
    this._masked = false;
    this._fin = false;
    this._opcode = 0;

    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragments = [];

    this._state = GET_INFO;
    this._loop = false;
  }

  /**
   * Implements `Writable.prototype._write()`.
   *
   * @param {Buffer} chunk The chunk of data to write
   * @param {String} encoding The character encoding of `chunk`
   * @param {Function} cb Callback
   * @private
   */
  _write(chunk, encoding, cb) {
    if (this._opcode === 0x08 && this._state == GET_INFO) return cb();

    this._bufferedBytes += chunk.length;
    this._buffers.push(chunk);
    this.startLoop(cb);
  }

  /**
   * Consumes `n` bytes from the buffered data.
   *
   * @param {Number} n The number of bytes to consume
   * @return {Buffer} The consumed bytes
   * @private
   */
  consume(n) {
    this._bufferedBytes -= n;

    if (n === this._buffers[0].length) return this._buffers.shift();

    if (n < this._buffers[0].length) {
      const buf = this._buffers[0];
      this._buffers[0] = new FastBuffer(
        buf.buffer,
        buf.byteOffset + n,
        buf.length - n
      );

      return new FastBuffer(buf.buffer, buf.byteOffset, n);
    }

    const dst = Buffer.allocUnsafe(n);

    do {
      const buf = this._buffers[0];
      const offset = dst.length - n;

      if (n >= buf.length) {
        dst.set(this._buffers.shift(), offset);
      } else {
        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
        this._buffers[0] = new FastBuffer(
          buf.buffer,
          buf.byteOffset + n,
          buf.length - n
        );
      }

      n -= buf.length;
    } while (n > 0);

    return dst;
  }

  /**
   * Starts the parsing loop.
   *
   * @param {Function} cb Callback
   * @private
   */
  startLoop(cb) {
    let err;
    this._loop = true;

    do {
      switch (this._state) {
        case GET_INFO:
          err = this.getInfo();
          break;
        case GET_PAYLOAD_LENGTH_16:
          err = this.getPayloadLength16();
          break;
        case GET_PAYLOAD_LENGTH_64:
          err = this.getPayloadLength64();
          break;
        case GET_MASK:
          this.getMask();
          break;
        case GET_DATA:
          err = this.getData(cb);
          break;
        default:
          // `INFLATING`
          this._loop = false;
          return;
      }
    } while (this._loop);

    cb(err);
  }

  /**
   * Reads the first two bytes of a frame.
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getInfo() {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }

    const buf = this.consume(2);

    if ((buf[0] & 0x30) !== 0x00) {
      this._loop = false;
      return error(
        RangeError,
        'RSV2 and RSV3 must be clear',
        true,
        1002,
        'WS_ERR_UNEXPECTED_RSV_2_3'
      );
    }

    const compressed = (buf[0] & 0x40) === 0x40;

    if (compressed && !this._extensions[permessageDeflate.extensionName]) {
      this._loop = false;
      return error(
        RangeError,
        'RSV1 must be clear',
        true,
        1002,
        'WS_ERR_UNEXPECTED_RSV_1'
      );
    }

    this._fin = (buf[0] & 0x80) === 0x80;
    this._opcode = buf[0] & 0x0f;
    this._payloadLength = buf[1] & 0x7f;

    if (this._opcode === 0x00) {
      if (compressed) {
        this._loop = false;
        return error(
          RangeError,
          'RSV1 must be clear',
          true,
          1002,
          'WS_ERR_UNEXPECTED_RSV_1'
        );
      }

      if (!this._fragmented) {
        this._loop = false;
        return error(
          RangeError,
          'invalid opcode 0',
          true,
          1002,
          'WS_ERR_INVALID_OPCODE'
        );
      }

      this._opcode = this._fragmented;
    } else if (this._opcode === 0x01 || this._opcode === 0x02) {
      if (this._fragmented) {
        this._loop = false;
        return error(
          RangeError,
          `invalid opcode ${this._opcode}`,
          true,
          1002,
          'WS_ERR_INVALID_OPCODE'
        );
      }

      this._compressed = compressed;
    } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
      if (!this._fin) {
        this._loop = false;
        return error(
          RangeError,
          'FIN must be set',
          true,
          1002,
          'WS_ERR_EXPECTED_FIN'
        );
      }

      if (compressed) {
        this._loop = false;
        return error(
          RangeError,
          'RSV1 must be clear',
          true,
          1002,
          'WS_ERR_UNEXPECTED_RSV_1'
        );
      }

      if (
        this._payloadLength > 0x7d ||
        (this._opcode === 0x08 && this._payloadLength === 1)
      ) {
        this._loop = false;
        return error(
          RangeError,
          `invalid payload length ${this._payloadLength}`,
          true,
          1002,
          'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH'
        );
      }
    } else {
      this._loop = false;
      return error(
        RangeError,
        `invalid opcode ${this._opcode}`,
        true,
        1002,
        'WS_ERR_INVALID_OPCODE'
      );
    }

    if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
    this._masked = (buf[1] & 0x80) === 0x80;

    if (this._isServer) {
      if (!this._masked) {
        this._loop = false;
        return error(
          RangeError,
          'MASK must be set',
          true,
          1002,
          'WS_ERR_EXPECTED_MASK'
        );
      }
    } else if (this._masked) {
      this._loop = false;
      return error(
        RangeError,
        'MASK must be clear',
        true,
        1002,
        'WS_ERR_UNEXPECTED_MASK'
      );
    }

    if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
    else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
    else return this.haveLength();
  }

  /**
   * Gets extended payload length (7+16).
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getPayloadLength16() {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }

    this._payloadLength = this.consume(2).readUInt16BE(0);
    return this.haveLength();
  }

  /**
   * Gets extended payload length (7+64).
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getPayloadLength64() {
    if (this._bufferedBytes < 8) {
      this._loop = false;
      return;
    }

    const buf = this.consume(8);
    const num = buf.readUInt32BE(0);

    //
    // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
    // if payload length is greater than this number.
    //
    if (num > Math.pow(2, 53 - 32) - 1) {
      this._loop = false;
      return error(
        RangeError,
        'Unsupported WebSocket frame: payload length > 2^53 - 1',
        false,
        1009,
        'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH'
      );
    }

    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
    return this.haveLength();
  }

  /**
   * Payload length has been read.
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  haveLength() {
    if (this._payloadLength && this._opcode < 0x08) {
      this._totalPayloadLength += this._payloadLength;
      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
        this._loop = false;
        return error(
          RangeError,
          'Max payload size exceeded',
          false,
          1009,
          'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
        );
      }
    }

    if (this._masked) this._state = GET_MASK;
    else this._state = GET_DATA;
  }

  /**
   * Reads mask bytes.
   *
   * @private
   */
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = false;
      return;
    }

    this._mask = this.consume(4);
    this._state = GET_DATA;
  }

  /**
   * Reads data bytes.
   *
   * @param {Function} cb Callback
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  getData(cb) {
    let data = EMPTY_BUFFER$2;

    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = false;
        return;
      }

      data = this.consume(this._payloadLength);

      if (
        this._masked &&
        (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0
      ) {
        unmask(data, this._mask);
      }
    }

    if (this._opcode > 0x07) return this.controlMessage(data);

    if (this._compressed) {
      this._state = INFLATING;
      this.decompress(data, cb);
      return;
    }

    if (data.length) {
      //
      // This message is not compressed so its length is the sum of the payload
      // length of all fragments.
      //
      this._messageLength = this._totalPayloadLength;
      this._fragments.push(data);
    }

    return this.dataMessage();
  }

  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @param {Function} cb Callback
   * @private
   */
  decompress(data, cb) {
    const perMessageDeflate = this._extensions[permessageDeflate.extensionName];

    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
      if (err) return cb(err);

      if (buf.length) {
        this._messageLength += buf.length;
        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
          return cb(
            error(
              RangeError,
              'Max payload size exceeded',
              false,
              1009,
              'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
            )
          );
        }

        this._fragments.push(buf);
      }

      const er = this.dataMessage();
      if (er) return cb(er);

      this.startLoop(cb);
    });
  }

  /**
   * Handles a data message.
   *
   * @return {(Error|undefined)} A possible error
   * @private
   */
  dataMessage() {
    if (this._fin) {
      const messageLength = this._messageLength;
      const fragments = this._fragments;

      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragmented = 0;
      this._fragments = [];

      if (this._opcode === 2) {
        let data;

        if (this._binaryType === 'nodebuffer') {
          data = concat(fragments, messageLength);
        } else if (this._binaryType === 'arraybuffer') {
          data = toArrayBuffer(concat(fragments, messageLength));
        } else {
          data = fragments;
        }

        this.emit('message', data, true);
      } else {
        const buf = concat(fragments, messageLength);

        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
          this._loop = false;
          return error(
            Error,
            'invalid UTF-8 sequence',
            true,
            1007,
            'WS_ERR_INVALID_UTF8'
          );
        }

        this.emit('message', buf, false);
      }
    }

    this._state = GET_INFO;
  }

  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  controlMessage(data) {
    if (this._opcode === 0x08) {
      this._loop = false;

      if (data.length === 0) {
        this.emit('conclude', 1005, EMPTY_BUFFER$2);
        this.end();
      } else {
        const code = data.readUInt16BE(0);

        if (!isValidStatusCode$1(code)) {
          return error(
            RangeError,
            `invalid status code ${code}`,
            true,
            1002,
            'WS_ERR_INVALID_CLOSE_CODE'
          );
        }

        const buf = new FastBuffer(
          data.buffer,
          data.byteOffset + 2,
          data.length - 2
        );

        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
          return error(
            Error,
            'invalid UTF-8 sequence',
            true,
            1007,
            'WS_ERR_INVALID_UTF8'
          );
        }

        this.emit('conclude', code, buf);
        this.end();
      }
    } else if (this._opcode === 0x09) {
      this.emit('ping', data);
    } else {
      this.emit('pong', data);
    }

    this._state = GET_INFO;
  }
}

var receiver = Receiver;

/**
 * Builds an error object.
 *
 * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
 * @param {String} message The error message
 * @param {Boolean} prefix Specifies whether or not to add a default prefix to
 *     `message`
 * @param {Number} statusCode The status code
 * @param {String} errorCode The exposed error code
 * @return {(Error|RangeError)} The error
 * @private
 */
function error(ErrorCtor, message, prefix, statusCode, errorCode) {
  const err = new ErrorCtor(
    prefix ? `Invalid WebSocket frame: ${message}` : message
  );

  Error.captureStackTrace(err, error);
  err.code = errorCode;
  err[kStatusCode$1] = statusCode;
  return err;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^net|tls$" }] */



const { randomFillSync } = require$$0;


const { EMPTY_BUFFER: EMPTY_BUFFER$1 } = constants;
const { isValidStatusCode } = validation;
const { mask: applyMask, toBuffer: toBuffer$1 } = bufferUtil;

const kByteLength = Symbol('kByteLength');
const maskBuffer = Buffer.alloc(4);

/**
 * HyBi Sender implementation.
 */
class Sender {
  /**
   * Creates a Sender instance.
   *
   * @param {(net.Socket|tls.Socket)} socket The connection socket
   * @param {Object} [extensions] An object containing the negotiated extensions
   * @param {Function} [generateMask] The function used to generate the masking
   *     key
   */
  constructor(socket, extensions, generateMask) {
    this._extensions = extensions || {};

    if (generateMask) {
      this._generateMask = generateMask;
      this._maskBuffer = Buffer.alloc(4);
    }

    this._socket = socket;

    this._firstFragment = true;
    this._compress = false;

    this._bufferedBytes = 0;
    this._deflating = false;
    this._queue = [];
  }

  /**
   * Frames a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {(Buffer|String)} data The data to frame
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @return {(Buffer|String)[]} The framed data
   * @public
   */
  static frame(data, options) {
    let mask;
    let merge = false;
    let offset = 2;
    let skipMasking = false;

    if (options.mask) {
      mask = options.maskBuffer || maskBuffer;

      if (options.generateMask) {
        options.generateMask(mask);
      } else {
        randomFillSync(mask, 0, 4);
      }

      skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
      offset = 6;
    }

    let dataLength;

    if (typeof data === 'string') {
      if (
        (!options.mask || skipMasking) &&
        options[kByteLength] !== undefined
      ) {
        dataLength = options[kByteLength];
      } else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
    } else {
      dataLength = data.length;
      merge = options.mask && options.readOnly && !skipMasking;
    }

    let payloadLength = dataLength;

    if (dataLength >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (dataLength > 125) {
      offset += 2;
      payloadLength = 126;
    }

    const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);

    target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
    if (options.rsv1) target[0] |= 0x40;

    target[1] = payloadLength;

    if (payloadLength === 126) {
      target.writeUInt16BE(dataLength, 2);
    } else if (payloadLength === 127) {
      target[2] = target[3] = 0;
      target.writeUIntBE(dataLength, 4, 6);
    }

    if (!options.mask) return [target, data];

    target[1] |= 0x80;
    target[offset - 4] = mask[0];
    target[offset - 3] = mask[1];
    target[offset - 2] = mask[2];
    target[offset - 1] = mask[3];

    if (skipMasking) return [target, data];

    if (merge) {
      applyMask(data, mask, target, offset, dataLength);
      return [target];
    }

    applyMask(data, mask, data, 0, dataLength);
    return [target, data];
  }

  /**
   * Sends a close message to the other peer.
   *
   * @param {Number} [code] The status code component of the body
   * @param {(String|Buffer)} [data] The message component of the body
   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
   * @param {Function} [cb] Callback
   * @public
   */
  close(code, data, mask, cb) {
    let buf;

    if (code === undefined) {
      buf = EMPTY_BUFFER$1;
    } else if (typeof code !== 'number' || !isValidStatusCode(code)) {
      throw new TypeError('First argument must be a valid error code number');
    } else if (data === undefined || !data.length) {
      buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(code, 0);
    } else {
      const length = Buffer.byteLength(data);

      if (length > 123) {
        throw new RangeError('The message must not be greater than 123 bytes');
      }

      buf = Buffer.allocUnsafe(2 + length);
      buf.writeUInt16BE(code, 0);

      if (typeof data === 'string') {
        buf.write(data, 2);
      } else {
        buf.set(data, 2);
      }
    }

    const options = {
      [kByteLength]: buf.length,
      fin: true,
      generateMask: this._generateMask,
      mask,
      maskBuffer: this._maskBuffer,
      opcode: 0x08,
      readOnly: false,
      rsv1: false
    };

    if (this._deflating) {
      this.enqueue([this.dispatch, buf, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(buf, options), cb);
    }
  }

  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  ping(data, mask, cb) {
    let byteLength;
    let readOnly;

    if (typeof data === 'string') {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }

    if (byteLength > 125) {
      throw new RangeError('The data size must not be greater than 125 bytes');
    }

    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask,
      maskBuffer: this._maskBuffer,
      opcode: 0x09,
      readOnly,
      rsv1: false
    };

    if (this._deflating) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }

  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  pong(data, mask, cb) {
    let byteLength;
    let readOnly;

    if (typeof data === 'string') {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }

    if (byteLength > 125) {
      throw new RangeError('The data size must not be greater than 125 bytes');
    }

    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask,
      maskBuffer: this._maskBuffer,
      opcode: 0x0a,
      readOnly,
      rsv1: false
    };

    if (this._deflating) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }

  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
   *     or text
   * @param {Boolean} [options.compress=false] Specifies whether or not to
   *     compress `data`
   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Function} [cb] Callback
   * @public
   */
  send(data, options, cb) {
    const perMessageDeflate = this._extensions[permessageDeflate.extensionName];
    let opcode = options.binary ? 2 : 1;
    let rsv1 = options.compress;

    let byteLength;
    let readOnly;

    if (typeof data === 'string') {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }

    if (this._firstFragment) {
      this._firstFragment = false;
      if (
        rsv1 &&
        perMessageDeflate &&
        perMessageDeflate.params[
          perMessageDeflate._isServer
            ? 'server_no_context_takeover'
            : 'client_no_context_takeover'
        ]
      ) {
        rsv1 = byteLength >= perMessageDeflate._threshold;
      }
      this._compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }

    if (options.fin) this._firstFragment = true;

    if (perMessageDeflate) {
      const opts = {
        [kByteLength]: byteLength,
        fin: options.fin,
        generateMask: this._generateMask,
        mask: options.mask,
        maskBuffer: this._maskBuffer,
        opcode,
        readOnly,
        rsv1
      };

      if (this._deflating) {
        this.enqueue([this.dispatch, data, this._compress, opts, cb]);
      } else {
        this.dispatch(data, this._compress, opts, cb);
      }
    } else {
      this.sendFrame(
        Sender.frame(data, {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1: false
        }),
        cb
      );
    }
  }

  /**
   * Dispatches a message.
   *
   * @param {(Buffer|String)} data The message to send
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     `data`
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  dispatch(data, compress, options, cb) {
    if (!compress) {
      this.sendFrame(Sender.frame(data, options), cb);
      return;
    }

    const perMessageDeflate = this._extensions[permessageDeflate.extensionName];

    this._bufferedBytes += options[kByteLength];
    this._deflating = true;
    perMessageDeflate.compress(data, options.fin, (_, buf) => {
      if (this._socket.destroyed) {
        const err = new Error(
          'The socket was closed while data was being compressed'
        );

        if (typeof cb === 'function') cb(err);

        for (let i = 0; i < this._queue.length; i++) {
          const params = this._queue[i];
          const callback = params[params.length - 1];

          if (typeof callback === 'function') callback(err);
        }

        return;
      }

      this._bufferedBytes -= options[kByteLength];
      this._deflating = false;
      options.readOnly = false;
      this.sendFrame(Sender.frame(buf, options), cb);
      this.dequeue();
    });
  }

  /**
   * Executes queued send operations.
   *
   * @private
   */
  dequeue() {
    while (!this._deflating && this._queue.length) {
      const params = this._queue.shift();

      this._bufferedBytes -= params[3][kByteLength];
      Reflect.apply(params[0], this, params.slice(1));
    }
  }

  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue(params) {
    this._bufferedBytes += params[3][kByteLength];
    this._queue.push(params);
  }

  /**
   * Sends a frame.
   *
   * @param {Buffer[]} list The frame to send
   * @param {Function} [cb] Callback
   * @private
   */
  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
}

var sender = Sender;

const { kForOnEventAttribute: kForOnEventAttribute$1, kListener: kListener$1 } = constants;

const kCode = Symbol('kCode');
const kData = Symbol('kData');
const kError = Symbol('kError');
const kMessage = Symbol('kMessage');
const kReason = Symbol('kReason');
const kTarget = Symbol('kTarget');
const kType = Symbol('kType');
const kWasClean = Symbol('kWasClean');

/**
 * Class representing an event.
 */
class Event {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @throws {TypeError} If the `type` argument is not specified
   */
  constructor(type) {
    this[kTarget] = null;
    this[kType] = type;
  }

  /**
   * @type {*}
   */
  get target() {
    return this[kTarget];
  }

  /**
   * @type {String}
   */
  get type() {
    return this[kType];
  }
}

Object.defineProperty(Event.prototype, 'target', { enumerable: true });
Object.defineProperty(Event.prototype, 'type', { enumerable: true });

/**
 * Class representing a close event.
 *
 * @extends Event
 */
class CloseEvent extends Event {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {Number} [options.code=0] The status code explaining why the
   *     connection was closed
   * @param {String} [options.reason=''] A human-readable string explaining why
   *     the connection was closed
   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
   *     connection was cleanly closed
   */
  constructor(type, options = {}) {
    super(type);

    this[kCode] = options.code === undefined ? 0 : options.code;
    this[kReason] = options.reason === undefined ? '' : options.reason;
    this[kWasClean] = options.wasClean === undefined ? false : options.wasClean;
  }

  /**
   * @type {Number}
   */
  get code() {
    return this[kCode];
  }

  /**
   * @type {String}
   */
  get reason() {
    return this[kReason];
  }

  /**
   * @type {Boolean}
   */
  get wasClean() {
    return this[kWasClean];
  }
}

Object.defineProperty(CloseEvent.prototype, 'code', { enumerable: true });
Object.defineProperty(CloseEvent.prototype, 'reason', { enumerable: true });
Object.defineProperty(CloseEvent.prototype, 'wasClean', { enumerable: true });

/**
 * Class representing an error event.
 *
 * @extends Event
 */
class ErrorEvent extends Event {
  /**
   * Create a new `ErrorEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.error=null] The error that generated this event
   * @param {String} [options.message=''] The error message
   */
  constructor(type, options = {}) {
    super(type);

    this[kError] = options.error === undefined ? null : options.error;
    this[kMessage] = options.message === undefined ? '' : options.message;
  }

  /**
   * @type {*}
   */
  get error() {
    return this[kError];
  }

  /**
   * @type {String}
   */
  get message() {
    return this[kMessage];
  }
}

Object.defineProperty(ErrorEvent.prototype, 'error', { enumerable: true });
Object.defineProperty(ErrorEvent.prototype, 'message', { enumerable: true });

/**
 * Class representing a message event.
 *
 * @extends Event
 */
class MessageEvent extends Event {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.data=null] The message content
   */
  constructor(type, options = {}) {
    super(type);

    this[kData] = options.data === undefined ? null : options.data;
  }

  /**
   * @type {*}
   */
  get data() {
    return this[kData];
  }
}

Object.defineProperty(MessageEvent.prototype, 'data', { enumerable: true });

/**
 * This provides methods for emulating the `EventTarget` interface. It's not
 * meant to be used directly.
 *
 * @mixin
 */
const EventTarget = {
  /**
   * Register an event listener.
   *
   * @param {String} type A string representing the event type to listen for
   * @param {(Function|Object)} handler The listener to add
   * @param {Object} [options] An options object specifies characteristics about
   *     the event listener
   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
   *     listener should be invoked at most once after being added. If `true`,
   *     the listener would be automatically removed when invoked.
   * @public
   */
  addEventListener(type, handler, options = {}) {
    for (const listener of this.listeners(type)) {
      if (
        !options[kForOnEventAttribute$1] &&
        listener[kListener$1] === handler &&
        !listener[kForOnEventAttribute$1]
      ) {
        return;
      }
    }

    let wrapper;

    if (type === 'message') {
      wrapper = function onMessage(data, isBinary) {
        const event = new MessageEvent('message', {
          data: isBinary ? data : data.toString()
        });

        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === 'close') {
      wrapper = function onClose(code, message) {
        const event = new CloseEvent('close', {
          code,
          reason: message.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });

        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === 'error') {
      wrapper = function onError(error) {
        const event = new ErrorEvent('error', {
          error,
          message: error.message
        });

        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === 'open') {
      wrapper = function onOpen() {
        const event = new Event('open');

        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else {
      return;
    }

    wrapper[kForOnEventAttribute$1] = !!options[kForOnEventAttribute$1];
    wrapper[kListener$1] = handler;

    if (options.once) {
      this.once(type, wrapper);
    } else {
      this.on(type, wrapper);
    }
  },

  /**
   * Remove an event listener.
   *
   * @param {String} type A string representing the event type to remove
   * @param {(Function|Object)} handler The listener to remove
   * @public
   */
  removeEventListener(type, handler) {
    for (const listener of this.listeners(type)) {
      if (listener[kListener$1] === handler && !listener[kForOnEventAttribute$1]) {
        this.removeListener(type, listener);
        break;
      }
    }
  }
};

var eventTarget = {
  CloseEvent,
  ErrorEvent,
  Event,
  EventTarget,
  MessageEvent
};

/**
 * Call an event listener
 *
 * @param {(Function|Object)} listener The listener to call
 * @param {*} thisArg The value to use as `this`` when calling the listener
 * @param {Event} event The event to pass to the listener
 * @private
 */
function callListener(listener, thisArg, event) {
  if (typeof listener === 'object' && listener.handleEvent) {
    listener.handleEvent.call(listener, event);
  } else {
    listener.call(thisArg, event);
  }
}

const { tokenChars: tokenChars$1 } = validation;

/**
 * Adds an offer to the map of extension offers or a parameter to the map of
 * parameters.
 *
 * @param {Object} dest The map of extension offers or parameters
 * @param {String} name The extension or parameter name
 * @param {(Object|Boolean|String)} elem The extension parameters or the
 *     parameter value
 * @private
 */
function push(dest, name, elem) {
  if (dest[name] === undefined) dest[name] = [elem];
  else dest[name].push(elem);
}

/**
 * Parses the `Sec-WebSocket-Extensions` header into an object.
 *
 * @param {String} header The field value of the header
 * @return {Object} The parsed object
 * @public
 */
function parse$3(header) {
  const offers = Object.create(null);
  let params = Object.create(null);
  let mustUnescape = false;
  let isEscaping = false;
  let inQuotes = false;
  let extensionName;
  let paramName;
  let start = -1;
  let code = -1;
  let end = -1;
  let i = 0;

  for (; i < header.length; i++) {
    code = header.charCodeAt(i);

    if (extensionName === undefined) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (
        i !== 0 &&
        (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
      ) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 0x3b /* ';' */ || code === 0x2c /* ',' */) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }

        if (end === -1) end = i;
        const name = header.slice(start, end);
        if (code === 0x2c) {
          push(offers, name, params);
          params = Object.create(null);
        } else {
          extensionName = name;
        }

        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else if (paramName === undefined) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 0x20 || code === 0x09) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 0x3b || code === 0x2c) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }

        if (end === -1) end = i;
        push(params, header.slice(start, end), true);
        if (code === 0x2c) {
          push(offers, extensionName, params);
          params = Object.create(null);
          extensionName = undefined;
        }

        start = end = -1;
      } else if (code === 0x3d /* '=' */ && start !== -1 && end === -1) {
        paramName = header.slice(start, i);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else {
      //
      // The value of a quoted-string after unescaping must conform to the
      // token ABNF, so only token characters are valid.
      // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
      //
      if (isEscaping) {
        if (tokenChars$1[code] !== 1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (start === -1) start = i;
        else if (!mustUnescape) mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) {
        if (tokenChars$1[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 0x22 /* '"' */ && start !== -1) {
          inQuotes = false;
          end = i;
        } else if (code === 0x5c /* '\' */) {
          isEscaping = true;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
        inQuotes = true;
      } else if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
        if (end === -1) end = i;
      } else if (code === 0x3b || code === 0x2c) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }

        if (end === -1) end = i;
        let value = header.slice(start, end);
        if (mustUnescape) {
          value = value.replace(/\\/g, '');
          mustUnescape = false;
        }
        push(params, paramName, value);
        if (code === 0x2c) {
          push(offers, extensionName, params);
          params = Object.create(null);
          extensionName = undefined;
        }

        paramName = undefined;
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
  }

  if (start === -1 || inQuotes || code === 0x20 || code === 0x09) {
    throw new SyntaxError('Unexpected end of input');
  }

  if (end === -1) end = i;
  const token = header.slice(start, end);
  if (extensionName === undefined) {
    push(offers, token, params);
  } else {
    if (paramName === undefined) {
      push(params, token, true);
    } else if (mustUnescape) {
      push(params, paramName, token.replace(/\\/g, ''));
    } else {
      push(params, paramName, token);
    }
    push(offers, extensionName, params);
  }

  return offers;
}

/**
 * Builds the `Sec-WebSocket-Extensions` header field value.
 *
 * @param {Object} extensions The map of extensions and parameters to format
 * @return {String} A string representing the given object
 * @public
 */
function format$1(extensions) {
  return Object.keys(extensions)
    .map((extension) => {
      let configurations = extensions[extension];
      if (!Array.isArray(configurations)) configurations = [configurations];
      return configurations
        .map((params) => {
          return [extension]
            .concat(
              Object.keys(params).map((k) => {
                let values = params[k];
                if (!Array.isArray(values)) values = [values];
                return values
                  .map((v) => (v === true ? k : `${k}=${v}`))
                  .join('; ');
              })
            )
            .join('; ');
        })
        .join(', ');
    })
    .join(', ');
}

var extension = { format: format$1, parse: parse$3 };

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Readable$" }] */






const { randomBytes, createHash: createHash$1 } = require$$0;
const { URL } = url;




const {
  BINARY_TYPES,
  EMPTY_BUFFER,
  GUID: GUID$1,
  kForOnEventAttribute,
  kListener,
  kStatusCode,
  kWebSocket: kWebSocket$1,
  NOOP
} = constants;
const {
  EventTarget: { addEventListener, removeEventListener }
} = eventTarget;
const { format, parse: parse$2 } = extension;
const { toBuffer } = bufferUtil;

const closeTimeout = 30 * 1000;
const kAborted = Symbol('kAborted');
const protocolVersions = [8, 13];
const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;

/**
 * Class representing a WebSocket.
 *
 * @extends EventEmitter
 */
class WebSocket extends events {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|URL)} address The URL to which to connect
   * @param {(String|String[])} [protocols] The subprotocols
   * @param {Object} [options] Connection options
   */
  constructor(address, protocols, options) {
    super();

    this._binaryType = BINARY_TYPES[0];
    this._closeCode = 1006;
    this._closeFrameReceived = false;
    this._closeFrameSent = false;
    this._closeMessage = EMPTY_BUFFER;
    this._closeTimer = null;
    this._extensions = {};
    this._paused = false;
    this._protocol = '';
    this._readyState = WebSocket.CONNECTING;
    this._receiver = null;
    this._sender = null;
    this._socket = null;

    if (address !== null) {
      this._bufferedAmount = 0;
      this._isServer = false;
      this._redirects = 0;

      if (protocols === undefined) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        if (typeof protocols === 'object' && protocols !== null) {
          options = protocols;
          protocols = [];
        } else {
          protocols = [protocols];
        }
      }

      initAsClient(this, address, protocols, options);
    } else {
      this._isServer = true;
    }
  }

  /**
   * This deviates from the WHATWG interface since ws doesn't support the
   * required default "blob" type (instead we define a custom "nodebuffer"
   * type).
   *
   * @type {String}
   */
  get binaryType() {
    return this._binaryType;
  }

  set binaryType(type) {
    if (!BINARY_TYPES.includes(type)) return;

    this._binaryType = type;

    //
    // Allow to change `binaryType` on the fly.
    //
    if (this._receiver) this._receiver._binaryType = type;
  }

  /**
   * @type {Number}
   */
  get bufferedAmount() {
    if (!this._socket) return this._bufferedAmount;

    return this._socket._writableState.length + this._sender._bufferedBytes;
  }

  /**
   * @type {String}
   */
  get extensions() {
    return Object.keys(this._extensions).join();
  }

  /**
   * @type {Boolean}
   */
  get isPaused() {
    return this._paused;
  }

  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onclose() {
    return null;
  }

  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onerror() {
    return null;
  }

  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onopen() {
    return null;
  }

  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onmessage() {
    return null;
  }

  /**
   * @type {String}
   */
  get protocol() {
    return this._protocol;
  }

  /**
   * @type {Number}
   */
  get readyState() {
    return this._readyState;
  }

  /**
   * @type {String}
   */
  get url() {
    return this._url;
  }

  /**
   * Set up the socket and the internal resources.
   *
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Object} options Options object
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Number} [options.maxPayload=0] The maximum allowed message size
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @private
   */
  setSocket(socket, head, options) {
    const receiver$1 = new receiver({
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxPayload: options.maxPayload,
      skipUTF8Validation: options.skipUTF8Validation
    });

    this._sender = new sender(socket, this._extensions, options.generateMask);
    this._receiver = receiver$1;
    this._socket = socket;

    receiver$1[kWebSocket$1] = this;
    socket[kWebSocket$1] = this;

    receiver$1.on('conclude', receiverOnConclude);
    receiver$1.on('drain', receiverOnDrain);
    receiver$1.on('error', receiverOnError);
    receiver$1.on('message', receiverOnMessage);
    receiver$1.on('ping', receiverOnPing);
    receiver$1.on('pong', receiverOnPong);

    socket.setTimeout(0);
    socket.setNoDelay();

    if (head.length > 0) socket.unshift(head);

    socket.on('close', socketOnClose);
    socket.on('data', socketOnData);
    socket.on('end', socketOnEnd);
    socket.on('error', socketOnError$1);

    this._readyState = WebSocket.OPEN;
    this.emit('open');
  }

  /**
   * Emit the `'close'` event.
   *
   * @private
   */
  emitClose() {
    if (!this._socket) {
      this._readyState = WebSocket.CLOSED;
      this.emit('close', this._closeCode, this._closeMessage);
      return;
    }

    if (this._extensions[permessageDeflate.extensionName]) {
      this._extensions[permessageDeflate.extensionName].cleanup();
    }

    this._receiver.removeAllListeners();
    this._readyState = WebSocket.CLOSED;
    this.emit('close', this._closeCode, this._closeMessage);
  }

  /**
   * Start a closing handshake.
   *
   *          +----------+   +-----------+   +----------+
   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
   *    |     +----------+   +-----------+   +----------+     |
   *          +----------+   +-----------+         |
   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
   *          +----------+   +-----------+   |
   *    |           |                        |   +---+        |
   *                +------------------------+-->|fin| - - - -
   *    |         +---+                      |   +---+
   *     - - - - -|fin|<---------------------+
   *              +---+
   *
   * @param {Number} [code] Status code explaining why the connection is closing
   * @param {(String|Buffer)} [data] The reason why the connection is
   *     closing
   * @public
   */
  close(code, data) {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = 'WebSocket was closed before the connection was established';
      abortHandshake$1(this, this._req, msg);
      return;
    }

    if (this.readyState === WebSocket.CLOSING) {
      if (
        this._closeFrameSent &&
        (this._closeFrameReceived || this._receiver._writableState.errorEmitted)
      ) {
        this._socket.end();
      }

      return;
    }

    this._readyState = WebSocket.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      //
      // This error is handled by the `'error'` listener on the socket. We only
      // want to know if the close frame has been sent here.
      //
      if (err) return;

      this._closeFrameSent = true;

      if (
        this._closeFrameReceived ||
        this._receiver._writableState.errorEmitted
      ) {
        this._socket.end();
      }
    });

    //
    // Specify a timeout for the closing handshake to complete.
    //
    this._closeTimer = setTimeout(
      this._socket.destroy.bind(this._socket),
      closeTimeout
    );
  }

  /**
   * Pause the socket.
   *
   * @public
   */
  pause() {
    if (
      this.readyState === WebSocket.CONNECTING ||
      this.readyState === WebSocket.CLOSED
    ) {
      return;
    }

    this._paused = true;
    this._socket.pause();
  }

  /**
   * Send a ping.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the ping is sent
   * @public
   */
  ping(data, mask, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
    }

    if (typeof data === 'function') {
      cb = data;
      data = mask = undefined;
    } else if (typeof mask === 'function') {
      cb = mask;
      mask = undefined;
    }

    if (typeof data === 'number') data = data.toString();

    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }

    if (mask === undefined) mask = !this._isServer;
    this._sender.ping(data || EMPTY_BUFFER, mask, cb);
  }

  /**
   * Send a pong.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the pong is sent
   * @public
   */
  pong(data, mask, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
    }

    if (typeof data === 'function') {
      cb = data;
      data = mask = undefined;
    } else if (typeof mask === 'function') {
      cb = mask;
      mask = undefined;
    }

    if (typeof data === 'number') data = data.toString();

    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }

    if (mask === undefined) mask = !this._isServer;
    this._sender.pong(data || EMPTY_BUFFER, mask, cb);
  }

  /**
   * Resume the socket.
   *
   * @public
   */
  resume() {
    if (
      this.readyState === WebSocket.CONNECTING ||
      this.readyState === WebSocket.CLOSED
    ) {
      return;
    }

    this._paused = false;
    if (!this._receiver._writableState.needDrain) this._socket.resume();
  }

  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} [options] Options object
   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
   *     text
   * @param {Boolean} [options.compress] Specifies whether or not to compress
   *     `data`
   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when data is written out
   * @public
   */
  send(data, options, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
    }

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    if (typeof data === 'number') data = data.toString();

    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }

    const opts = {
      binary: typeof data !== 'string',
      mask: !this._isServer,
      compress: true,
      fin: true,
      ...options
    };

    if (!this._extensions[permessageDeflate.extensionName]) {
      opts.compress = false;
    }

    this._sender.send(data || EMPTY_BUFFER, opts, cb);
  }

  /**
   * Forcibly close the connection.
   *
   * @public
   */
  terminate() {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = 'WebSocket was closed before the connection was established';
      abortHandshake$1(this, this._req, msg);
      return;
    }

    if (this._socket) {
      this._readyState = WebSocket.CLOSING;
      this._socket.destroy();
    }
  }
}

/**
 * @constant {Number} CONNECTING
 * @memberof WebSocket
 */
Object.defineProperty(WebSocket, 'CONNECTING', {
  enumerable: true,
  value: readyStates.indexOf('CONNECTING')
});

/**
 * @constant {Number} CONNECTING
 * @memberof WebSocket.prototype
 */
Object.defineProperty(WebSocket.prototype, 'CONNECTING', {
  enumerable: true,
  value: readyStates.indexOf('CONNECTING')
});

/**
 * @constant {Number} OPEN
 * @memberof WebSocket
 */
Object.defineProperty(WebSocket, 'OPEN', {
  enumerable: true,
  value: readyStates.indexOf('OPEN')
});

/**
 * @constant {Number} OPEN
 * @memberof WebSocket.prototype
 */
Object.defineProperty(WebSocket.prototype, 'OPEN', {
  enumerable: true,
  value: readyStates.indexOf('OPEN')
});

/**
 * @constant {Number} CLOSING
 * @memberof WebSocket
 */
Object.defineProperty(WebSocket, 'CLOSING', {
  enumerable: true,
  value: readyStates.indexOf('CLOSING')
});

/**
 * @constant {Number} CLOSING
 * @memberof WebSocket.prototype
 */
Object.defineProperty(WebSocket.prototype, 'CLOSING', {
  enumerable: true,
  value: readyStates.indexOf('CLOSING')
});

/**
 * @constant {Number} CLOSED
 * @memberof WebSocket
 */
Object.defineProperty(WebSocket, 'CLOSED', {
  enumerable: true,
  value: readyStates.indexOf('CLOSED')
});

/**
 * @constant {Number} CLOSED
 * @memberof WebSocket.prototype
 */
Object.defineProperty(WebSocket.prototype, 'CLOSED', {
  enumerable: true,
  value: readyStates.indexOf('CLOSED')
});

[
  'binaryType',
  'bufferedAmount',
  'extensions',
  'isPaused',
  'protocol',
  'readyState',
  'url'
].forEach((property) => {
  Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
});

//
// Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
// See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
//
['open', 'error', 'close', 'message'].forEach((method) => {
  Object.defineProperty(WebSocket.prototype, `on${method}`, {
    enumerable: true,
    get() {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) return listener[kListener];
      }

      return null;
    },
    set(handler) {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) {
          this.removeListener(method, listener);
          break;
        }
      }

      if (typeof handler !== 'function') return;

      this.addEventListener(method, handler, {
        [kForOnEventAttribute]: true
      });
    }
  });
});

WebSocket.prototype.addEventListener = addEventListener;
WebSocket.prototype.removeEventListener = removeEventListener;

var websocket = WebSocket;

/**
 * Initialize a WebSocket client.
 *
 * @param {WebSocket} websocket The client to initialize
 * @param {(String|URL)} address The URL to which to connect
 * @param {Array} protocols The subprotocols
 * @param {Object} [options] Connection options
 * @param {Boolean} [options.followRedirects=false] Whether or not to follow
 *     redirects
 * @param {Function} [options.generateMask] The function used to generate the
 *     masking key
 * @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
 *     handshake request
 * @param {Number} [options.maxPayload=104857600] The maximum allowed message
 *     size
 * @param {Number} [options.maxRedirects=10] The maximum number of redirects
 *     allowed
 * @param {String} [options.origin] Value of the `Origin` or
 *     `Sec-WebSocket-Origin` header
 * @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
 *     permessage-deflate
 * @param {Number} [options.protocolVersion=13] Value of the
 *     `Sec-WebSocket-Version` header
 * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
 *     not to skip UTF-8 validation for text and close messages
 * @private
 */
function initAsClient(websocket, address, protocols, options) {
  const opts = {
    protocolVersion: protocolVersions[1],
    maxPayload: 100 * 1024 * 1024,
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,
    createConnection: undefined,
    socketPath: undefined,
    hostname: undefined,
    protocol: undefined,
    timeout: undefined,
    method: 'GET',
    host: undefined,
    path: undefined,
    port: undefined
  };

  if (!protocolVersions.includes(opts.protocolVersion)) {
    throw new RangeError(
      `Unsupported protocol version: ${opts.protocolVersion} ` +
        `(supported versions: ${protocolVersions.join(', ')})`
    );
  }

  let parsedUrl;

  if (address instanceof URL) {
    parsedUrl = address;
    websocket._url = address.href;
  } else {
    try {
      parsedUrl = new URL(address);
    } catch (e) {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }

    websocket._url = address;
  }

  const isSecure = parsedUrl.protocol === 'wss:';
  const isIpcUrl = parsedUrl.protocol === 'ws+unix:';
  let invalidUrlMessage;

  if (parsedUrl.protocol !== 'ws:' && !isSecure && !isIpcUrl) {
    invalidUrlMessage =
      'The URL\'s protocol must be one of "ws:", "wss:", or "ws+unix:"';
  } else if (isIpcUrl && !parsedUrl.pathname) {
    invalidUrlMessage = "The URL's pathname is empty";
  } else if (parsedUrl.hash) {
    invalidUrlMessage = 'The URL contains a fragment identifier';
  }

  if (invalidUrlMessage) {
    const err = new SyntaxError(invalidUrlMessage);

    if (websocket._redirects === 0) {
      throw err;
    } else {
      emitErrorAndClose(websocket, err);
      return;
    }
  }

  const defaultPort = isSecure ? 443 : 80;
  const key = randomBytes(16).toString('base64');
  const request = isSecure ? https.request : http.request;
  const protocolSet = new Set();
  let perMessageDeflate;

  opts.createConnection = isSecure ? tlsConnect : netConnect;
  opts.defaultPort = opts.defaultPort || defaultPort;
  opts.port = parsedUrl.port || defaultPort;
  opts.host = parsedUrl.hostname.startsWith('[')
    ? parsedUrl.hostname.slice(1, -1)
    : parsedUrl.hostname;
  opts.headers = {
    ...opts.headers,
    'Sec-WebSocket-Version': opts.protocolVersion,
    'Sec-WebSocket-Key': key,
    Connection: 'Upgrade',
    Upgrade: 'websocket'
  };
  opts.path = parsedUrl.pathname + parsedUrl.search;
  opts.timeout = opts.handshakeTimeout;

  if (opts.perMessageDeflate) {
    perMessageDeflate = new permessageDeflate(
      opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
      false,
      opts.maxPayload
    );
    opts.headers['Sec-WebSocket-Extensions'] = format({
      [permessageDeflate.extensionName]: perMessageDeflate.offer()
    });
  }
  if (protocols.length) {
    for (const protocol of protocols) {
      if (
        typeof protocol !== 'string' ||
        !subprotocolRegex.test(protocol) ||
        protocolSet.has(protocol)
      ) {
        throw new SyntaxError(
          'An invalid or duplicated subprotocol was specified'
        );
      }

      protocolSet.add(protocol);
    }

    opts.headers['Sec-WebSocket-Protocol'] = protocols.join(',');
  }
  if (opts.origin) {
    if (opts.protocolVersion < 13) {
      opts.headers['Sec-WebSocket-Origin'] = opts.origin;
    } else {
      opts.headers.Origin = opts.origin;
    }
  }
  if (parsedUrl.username || parsedUrl.password) {
    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
  }

  if (isIpcUrl) {
    const parts = opts.path.split(':');

    opts.socketPath = parts[0];
    opts.path = parts[1];
  }

  let req;

  if (opts.followRedirects) {
    if (websocket._redirects === 0) {
      websocket._originalIpc = isIpcUrl;
      websocket._originalSecure = isSecure;
      websocket._originalHostOrSocketPath = isIpcUrl
        ? opts.socketPath
        : parsedUrl.host;

      const headers = options && options.headers;

      //
      // Shallow copy the user provided options so that headers can be changed
      // without mutating the original object.
      //
      options = { ...options, headers: {} };

      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          options.headers[key.toLowerCase()] = value;
        }
      }
    } else if (websocket.listenerCount('redirect') === 0) {
      const isSameHost = isIpcUrl
        ? websocket._originalIpc
          ? opts.socketPath === websocket._originalHostOrSocketPath
          : false
        : websocket._originalIpc
        ? false
        : parsedUrl.host === websocket._originalHostOrSocketPath;

      if (!isSameHost || (websocket._originalSecure && !isSecure)) {
        //
        // Match curl 7.77.0 behavior and drop the following headers. These
        // headers are also dropped when following a redirect to a subdomain.
        //
        delete opts.headers.authorization;
        delete opts.headers.cookie;

        if (!isSameHost) delete opts.headers.host;

        opts.auth = undefined;
      }
    }

    //
    // Match curl 7.77.0 behavior and make the first `Authorization` header win.
    // If the `Authorization` header is set, then there is nothing to do as it
    // will take precedence.
    //
    if (opts.auth && !options.headers.authorization) {
      options.headers.authorization =
        'Basic ' + Buffer.from(opts.auth).toString('base64');
    }

    req = websocket._req = request(opts);

    if (websocket._redirects) {
      //
      // Unlike what is done for the `'upgrade'` event, no early exit is
      // triggered here if the user calls `websocket.close()` or
      // `websocket.terminate()` from a listener of the `'redirect'` event. This
      // is because the user can also call `request.destroy()` with an error
      // before calling `websocket.close()` or `websocket.terminate()` and this
      // would result in an error being emitted on the `request` object with no
      // `'error'` event listeners attached.
      //
      websocket.emit('redirect', websocket.url, req);
    }
  } else {
    req = websocket._req = request(opts);
  }

  if (opts.timeout) {
    req.on('timeout', () => {
      abortHandshake$1(websocket, req, 'Opening handshake has timed out');
    });
  }

  req.on('error', (err) => {
    if (req === null || req[kAborted]) return;

    req = websocket._req = null;
    emitErrorAndClose(websocket, err);
  });

  req.on('response', (res) => {
    const location = res.headers.location;
    const statusCode = res.statusCode;

    if (
      location &&
      opts.followRedirects &&
      statusCode >= 300 &&
      statusCode < 400
    ) {
      if (++websocket._redirects > opts.maxRedirects) {
        abortHandshake$1(websocket, req, 'Maximum redirects exceeded');
        return;
      }

      req.abort();

      let addr;

      try {
        addr = new URL(location, address);
      } catch (e) {
        const err = new SyntaxError(`Invalid URL: ${location}`);
        emitErrorAndClose(websocket, err);
        return;
      }

      initAsClient(websocket, addr, protocols, options);
    } else if (!websocket.emit('unexpected-response', req, res)) {
      abortHandshake$1(
        websocket,
        req,
        `Unexpected server response: ${res.statusCode}`
      );
    }
  });

  req.on('upgrade', (res, socket, head) => {
    websocket.emit('upgrade', res);

    //
    // The user may have closed the connection from a listener of the
    // `'upgrade'` event.
    //
    if (websocket.readyState !== WebSocket.CONNECTING) return;

    req = websocket._req = null;

    if (res.headers.upgrade.toLowerCase() !== 'websocket') {
      abortHandshake$1(websocket, socket, 'Invalid Upgrade header');
      return;
    }

    const digest = createHash$1('sha1')
      .update(key + GUID$1)
      .digest('base64');

    if (res.headers['sec-websocket-accept'] !== digest) {
      abortHandshake$1(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
      return;
    }

    const serverProt = res.headers['sec-websocket-protocol'];
    let protError;

    if (serverProt !== undefined) {
      if (!protocolSet.size) {
        protError = 'Server sent a subprotocol but none was requested';
      } else if (!protocolSet.has(serverProt)) {
        protError = 'Server sent an invalid subprotocol';
      }
    } else if (protocolSet.size) {
      protError = 'Server sent no subprotocol';
    }

    if (protError) {
      abortHandshake$1(websocket, socket, protError);
      return;
    }

    if (serverProt) websocket._protocol = serverProt;

    const secWebSocketExtensions = res.headers['sec-websocket-extensions'];

    if (secWebSocketExtensions !== undefined) {
      if (!perMessageDeflate) {
        const message =
          'Server sent a Sec-WebSocket-Extensions header but no extension ' +
          'was requested';
        abortHandshake$1(websocket, socket, message);
        return;
      }

      let extensions;

      try {
        extensions = parse$2(secWebSocketExtensions);
      } catch (err) {
        const message = 'Invalid Sec-WebSocket-Extensions header';
        abortHandshake$1(websocket, socket, message);
        return;
      }

      const extensionNames = Object.keys(extensions);

      if (
        extensionNames.length !== 1 ||
        extensionNames[0] !== permessageDeflate.extensionName
      ) {
        const message = 'Server indicated an extension that was not requested';
        abortHandshake$1(websocket, socket, message);
        return;
      }

      try {
        perMessageDeflate.accept(extensions[permessageDeflate.extensionName]);
      } catch (err) {
        const message = 'Invalid Sec-WebSocket-Extensions header';
        abortHandshake$1(websocket, socket, message);
        return;
      }

      websocket._extensions[permessageDeflate.extensionName] =
        perMessageDeflate;
    }

    websocket.setSocket(socket, head, {
      generateMask: opts.generateMask,
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation
    });
  });

  if (opts.finishRequest) {
    opts.finishRequest(req, websocket);
  } else {
    req.end();
  }
}

/**
 * Emit the `'error'` and `'close'` events.
 *
 * @param {WebSocket} websocket The WebSocket instance
 * @param {Error} The error to emit
 * @private
 */
function emitErrorAndClose(websocket, err) {
  websocket._readyState = WebSocket.CLOSING;
  websocket.emit('error', err);
  websocket.emitClose();
}

/**
 * Create a `net.Socket` and initiate a connection.
 *
 * @param {Object} options Connection options
 * @return {net.Socket} The newly created socket used to start the connection
 * @private
 */
function netConnect(options) {
  options.path = options.socketPath;
  return net.connect(options);
}

/**
 * Create a `tls.TLSSocket` and initiate a connection.
 *
 * @param {Object} options Connection options
 * @return {tls.TLSSocket} The newly created socket used to start the connection
 * @private
 */
function tlsConnect(options) {
  options.path = undefined;

  if (!options.servername && options.servername !== '') {
    options.servername = net.isIP(options.host) ? '' : options.host;
  }

  return tls.connect(options);
}

/**
 * Abort the handshake and emit an error.
 *
 * @param {WebSocket} websocket The WebSocket instance
 * @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
 *     abort or the socket to destroy
 * @param {String} message The error message
 * @private
 */
function abortHandshake$1(websocket, stream, message) {
  websocket._readyState = WebSocket.CLOSING;

  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake$1);

  if (stream.setHeader) {
    stream[kAborted] = true;
    stream.abort();

    if (stream.socket && !stream.socket.destroyed) {
      //
      // On Node.js >= 14.3.0 `request.abort()` does not destroy the socket if
      // called after the request completed. See
      // https://github.com/websockets/ws/issues/1869.
      //
      stream.socket.destroy();
    }

    process.nextTick(emitErrorAndClose, websocket, err);
  } else {
    stream.destroy(err);
    stream.once('error', websocket.emit.bind(websocket, 'error'));
    stream.once('close', websocket.emitClose.bind(websocket));
  }
}

/**
 * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
 * when the `readyState` attribute is `CLOSING` or `CLOSED`.
 *
 * @param {WebSocket} websocket The WebSocket instance
 * @param {*} [data] The data to send
 * @param {Function} [cb] Callback
 * @private
 */
function sendAfterClose(websocket, data, cb) {
  if (data) {
    const length = toBuffer(data).length;

    //
    // The `_bufferedAmount` property is used only when the peer is a client and
    // the opening handshake fails. Under these circumstances, in fact, the
    // `setSocket()` method is not called, so the `_socket` and `_sender`
    // properties are set to `null`.
    //
    if (websocket._socket) websocket._sender._bufferedBytes += length;
    else websocket._bufferedAmount += length;
  }

  if (cb) {
    const err = new Error(
      `WebSocket is not open: readyState ${websocket.readyState} ` +
        `(${readyStates[websocket.readyState]})`
    );
    process.nextTick(cb, err);
  }
}

/**
 * The listener of the `Receiver` `'conclude'` event.
 *
 * @param {Number} code The status code
 * @param {Buffer} reason The reason for closing
 * @private
 */
function receiverOnConclude(code, reason) {
  const websocket = this[kWebSocket$1];

  websocket._closeFrameReceived = true;
  websocket._closeMessage = reason;
  websocket._closeCode = code;

  if (websocket._socket[kWebSocket$1] === undefined) return;

  websocket._socket.removeListener('data', socketOnData);
  process.nextTick(resume, websocket._socket);

  if (code === 1005) websocket.close();
  else websocket.close(code, reason);
}

/**
 * The listener of the `Receiver` `'drain'` event.
 *
 * @private
 */
function receiverOnDrain() {
  const websocket = this[kWebSocket$1];

  if (!websocket.isPaused) websocket._socket.resume();
}

/**
 * The listener of the `Receiver` `'error'` event.
 *
 * @param {(RangeError|Error)} err The emitted error
 * @private
 */
function receiverOnError(err) {
  const websocket = this[kWebSocket$1];

  if (websocket._socket[kWebSocket$1] !== undefined) {
    websocket._socket.removeListener('data', socketOnData);

    //
    // On Node.js < 14.0.0 the `'error'` event is emitted synchronously. See
    // https://github.com/websockets/ws/issues/1940.
    //
    process.nextTick(resume, websocket._socket);

    websocket.close(err[kStatusCode]);
  }

  websocket.emit('error', err);
}

/**
 * The listener of the `Receiver` `'finish'` event.
 *
 * @private
 */
function receiverOnFinish() {
  this[kWebSocket$1].emitClose();
}

/**
 * The listener of the `Receiver` `'message'` event.
 *
 * @param {Buffer|ArrayBuffer|Buffer[])} data The message
 * @param {Boolean} isBinary Specifies whether the message is binary or not
 * @private
 */
function receiverOnMessage(data, isBinary) {
  this[kWebSocket$1].emit('message', data, isBinary);
}

/**
 * The listener of the `Receiver` `'ping'` event.
 *
 * @param {Buffer} data The data included in the ping frame
 * @private
 */
function receiverOnPing(data) {
  const websocket = this[kWebSocket$1];

  websocket.pong(data, !websocket._isServer, NOOP);
  websocket.emit('ping', data);
}

/**
 * The listener of the `Receiver` `'pong'` event.
 *
 * @param {Buffer} data The data included in the pong frame
 * @private
 */
function receiverOnPong(data) {
  this[kWebSocket$1].emit('pong', data);
}

/**
 * Resume a readable stream
 *
 * @param {Readable} stream The readable stream
 * @private
 */
function resume(stream) {
  stream.resume();
}

/**
 * The listener of the `net.Socket` `'close'` event.
 *
 * @private
 */
function socketOnClose() {
  const websocket = this[kWebSocket$1];

  this.removeListener('close', socketOnClose);
  this.removeListener('data', socketOnData);
  this.removeListener('end', socketOnEnd);

  websocket._readyState = WebSocket.CLOSING;

  let chunk;

  //
  // The close frame might not have been received or the `'end'` event emitted,
  // for example, if the socket was destroyed due to an error. Ensure that the
  // `receiver` stream is closed after writing any remaining buffered data to
  // it. If the readable side of the socket is in flowing mode then there is no
  // buffered data as everything has been already written and `readable.read()`
  // will return `null`. If instead, the socket is paused, any possible buffered
  // data will be read as a single chunk.
  //
  if (
    !this._readableState.endEmitted &&
    !websocket._closeFrameReceived &&
    !websocket._receiver._writableState.errorEmitted &&
    (chunk = websocket._socket.read()) !== null
  ) {
    websocket._receiver.write(chunk);
  }

  websocket._receiver.end();

  this[kWebSocket$1] = undefined;

  clearTimeout(websocket._closeTimer);

  if (
    websocket._receiver._writableState.finished ||
    websocket._receiver._writableState.errorEmitted
  ) {
    websocket.emitClose();
  } else {
    websocket._receiver.on('error', receiverOnFinish);
    websocket._receiver.on('finish', receiverOnFinish);
  }
}

/**
 * The listener of the `net.Socket` `'data'` event.
 *
 * @param {Buffer} chunk A chunk of data
 * @private
 */
function socketOnData(chunk) {
  if (!this[kWebSocket$1]._receiver.write(chunk)) {
    this.pause();
  }
}

/**
 * The listener of the `net.Socket` `'end'` event.
 *
 * @private
 */
function socketOnEnd() {
  const websocket = this[kWebSocket$1];

  websocket._readyState = WebSocket.CLOSING;
  websocket._receiver.end();
  this.end();
}

/**
 * The listener of the `net.Socket` `'error'` event.
 *
 * @private
 */
function socketOnError$1() {
  const websocket = this[kWebSocket$1];

  this.removeListener('error', socketOnError$1);
  this.on('error', NOOP);

  if (websocket) {
    websocket._readyState = WebSocket.CLOSING;
    this.destroy();
  }
}

const { tokenChars } = validation;

/**
 * Parses the `Sec-WebSocket-Protocol` header into a set of subprotocol names.
 *
 * @param {String} header The field value of the header
 * @return {Set} The subprotocol names
 * @public
 */
function parse$1(header) {
  const protocols = new Set();
  let start = -1;
  let end = -1;
  let i = 0;

  for (i; i < header.length; i++) {
    const code = header.charCodeAt(i);

    if (end === -1 && tokenChars[code] === 1) {
      if (start === -1) start = i;
    } else if (
      i !== 0 &&
      (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
    ) {
      if (end === -1 && start !== -1) end = i;
    } else if (code === 0x2c /* ',' */) {
      if (start === -1) {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }

      if (end === -1) end = i;

      const protocol = header.slice(start, end);

      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }

      protocols.add(protocol);
      start = end = -1;
    } else {
      throw new SyntaxError(`Unexpected character at index ${i}`);
    }
  }

  if (start === -1 || end !== -1) {
    throw new SyntaxError('Unexpected end of input');
  }

  const protocol = header.slice(start, i);

  if (protocols.has(protocol)) {
    throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
  }

  protocols.add(protocol);
  return protocols;
}

var subprotocol = { parse: parse$1 };

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^net|tls|https$" }] */






const { createHash } = require$$0;





const { GUID, kWebSocket } = constants;

const keyRegex = /^[+/0-9A-Za-z]{22}==$/;

const RUNNING = 0;
const CLOSING = 1;
const CLOSED = 2;

/**
 * Class representing a WebSocket server.
 *
 * @extends EventEmitter
 */
class WebSocketServer extends events {
  /**
   * Create a `WebSocketServer` instance.
   *
   * @param {Object} options Configuration options
   * @param {Number} [options.backlog=511] The maximum length of the queue of
   *     pending connections
   * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
   *     track clients
   * @param {Function} [options.handleProtocols] A hook to handle protocols
   * @param {String} [options.host] The hostname where to bind the server
   * @param {Number} [options.maxPayload=104857600] The maximum allowed message
   *     size
   * @param {Boolean} [options.noServer=false] Enable no server mode
   * @param {String} [options.path] Accept only connections matching this path
   * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
   *     permessage-deflate
   * @param {Number} [options.port] The port where to bind the server
   * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
   *     server to use
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @param {Function} [options.verifyClient] A hook to reject connections
   * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
   *     class to use. It must be the `WebSocket` class or class that extends it
   * @param {Function} [callback] A listener for the `listening` event
   */
  constructor(options, callback) {
    super();

    options = {
      maxPayload: 100 * 1024 * 1024,
      skipUTF8Validation: false,
      perMessageDeflate: false,
      handleProtocols: null,
      clientTracking: true,
      verifyClient: null,
      noServer: false,
      backlog: null, // use default (511 as implemented in net.js)
      server: null,
      host: null,
      path: null,
      port: null,
      WebSocket: websocket,
      ...options
    };

    if (
      (options.port == null && !options.server && !options.noServer) ||
      (options.port != null && (options.server || options.noServer)) ||
      (options.server && options.noServer)
    ) {
      throw new TypeError(
        'One and only one of the "port", "server", or "noServer" options ' +
          'must be specified'
      );
    }

    if (options.port != null) {
      this._server = http.createServer((req, res) => {
        const body = http.STATUS_CODES[426];

        res.writeHead(426, {
          'Content-Length': body.length,
          'Content-Type': 'text/plain'
        });
        res.end(body);
      });
      this._server.listen(
        options.port,
        options.host,
        options.backlog,
        callback
      );
    } else if (options.server) {
      this._server = options.server;
    }

    if (this._server) {
      const emitConnection = this.emit.bind(this, 'connection');

      this._removeListeners = addListeners(this._server, {
        listening: this.emit.bind(this, 'listening'),
        error: this.emit.bind(this, 'error'),
        upgrade: (req, socket, head) => {
          this.handleUpgrade(req, socket, head, emitConnection);
        }
      });
    }

    if (options.perMessageDeflate === true) options.perMessageDeflate = {};
    if (options.clientTracking) {
      this.clients = new Set();
      this._shouldEmitClose = false;
    }

    this.options = options;
    this._state = RUNNING;
  }

  /**
   * Returns the bound address, the address family name, and port of the server
   * as reported by the operating system if listening on an IP socket.
   * If the server is listening on a pipe or UNIX domain socket, the name is
   * returned as a string.
   *
   * @return {(Object|String|null)} The address of the server
   * @public
   */
  address() {
    if (this.options.noServer) {
      throw new Error('The server is operating in "noServer" mode');
    }

    if (!this._server) return null;
    return this._server.address();
  }

  /**
   * Stop the server from accepting new connections and emit the `'close'` event
   * when all existing connections are closed.
   *
   * @param {Function} [cb] A one-time listener for the `'close'` event
   * @public
   */
  close(cb) {
    if (this._state === CLOSED) {
      if (cb) {
        this.once('close', () => {
          cb(new Error('The server is not running'));
        });
      }

      process.nextTick(emitClose, this);
      return;
    }

    if (cb) this.once('close', cb);

    if (this._state === CLOSING) return;
    this._state = CLOSING;

    if (this.options.noServer || this.options.server) {
      if (this._server) {
        this._removeListeners();
        this._removeListeners = this._server = null;
      }

      if (this.clients) {
        if (!this.clients.size) {
          process.nextTick(emitClose, this);
        } else {
          this._shouldEmitClose = true;
        }
      } else {
        process.nextTick(emitClose, this);
      }
    } else {
      const server = this._server;

      this._removeListeners();
      this._removeListeners = this._server = null;

      //
      // The HTTP/S server was created internally. Close it, and rely on its
      // `'close'` event.
      //
      server.close(() => {
        emitClose(this);
      });
    }
  }

  /**
   * See if a given request should be handled by this server instance.
   *
   * @param {http.IncomingMessage} req Request object to inspect
   * @return {Boolean} `true` if the request is valid, else `false`
   * @public
   */
  shouldHandle(req) {
    if (this.options.path) {
      const index = req.url.indexOf('?');
      const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

      if (pathname !== this.options.path) return false;
    }

    return true;
  }

  /**
   * Handle a HTTP Upgrade request.
   *
   * @param {http.IncomingMessage} req The request object
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @public
   */
  handleUpgrade(req, socket, head, cb) {
    socket.on('error', socketOnError);

    const key = req.headers['sec-websocket-key'];
    const version = +req.headers['sec-websocket-version'];

    if (req.method !== 'GET') {
      const message = 'Invalid HTTP method';
      abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
      return;
    }

    if (req.headers.upgrade.toLowerCase() !== 'websocket') {
      const message = 'Invalid Upgrade header';
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
      return;
    }

    if (!key || !keyRegex.test(key)) {
      const message = 'Missing or invalid Sec-WebSocket-Key header';
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
      return;
    }

    if (version !== 8 && version !== 13) {
      const message = 'Missing or invalid Sec-WebSocket-Version header';
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
      return;
    }

    if (!this.shouldHandle(req)) {
      abortHandshake(socket, 400);
      return;
    }

    const secWebSocketProtocol = req.headers['sec-websocket-protocol'];
    let protocols = new Set();

    if (secWebSocketProtocol !== undefined) {
      try {
        protocols = subprotocol.parse(secWebSocketProtocol);
      } catch (err) {
        const message = 'Invalid Sec-WebSocket-Protocol header';
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
    }

    const secWebSocketExtensions = req.headers['sec-websocket-extensions'];
    const extensions = {};

    if (
      this.options.perMessageDeflate &&
      secWebSocketExtensions !== undefined
    ) {
      const perMessageDeflate = new permessageDeflate(
        this.options.perMessageDeflate,
        true,
        this.options.maxPayload
      );

      try {
        const offers = extension.parse(secWebSocketExtensions);

        if (offers[permessageDeflate.extensionName]) {
          perMessageDeflate.accept(offers[permessageDeflate.extensionName]);
          extensions[permessageDeflate.extensionName] = perMessageDeflate;
        }
      } catch (err) {
        const message =
          'Invalid or unacceptable Sec-WebSocket-Extensions header';
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
    }

    //
    // Optionally call external client verification handler.
    //
    if (this.options.verifyClient) {
      const info = {
        origin:
          req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
        secure: !!(req.socket.authorized || req.socket.encrypted),
        req
      };

      if (this.options.verifyClient.length === 2) {
        this.options.verifyClient(info, (verified, code, message, headers) => {
          if (!verified) {
            return abortHandshake(socket, code || 401, message, headers);
          }

          this.completeUpgrade(
            extensions,
            key,
            protocols,
            req,
            socket,
            head,
            cb
          );
        });
        return;
      }

      if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
    }

    this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
  }

  /**
   * Upgrade the connection to WebSocket.
   *
   * @param {Object} extensions The accepted extensions
   * @param {String} key The value of the `Sec-WebSocket-Key` header
   * @param {Set} protocols The subprotocols
   * @param {http.IncomingMessage} req The request object
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @throws {Error} If called more than once with the same socket
   * @private
   */
  completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
    //
    // Destroy the socket if the client has already sent a FIN packet.
    //
    if (!socket.readable || !socket.writable) return socket.destroy();

    if (socket[kWebSocket]) {
      throw new Error(
        'server.handleUpgrade() was called more than once with the same ' +
          'socket, possibly due to a misconfiguration'
      );
    }

    if (this._state > RUNNING) return abortHandshake(socket, 503);

    const digest = createHash('sha1')
      .update(key + GUID)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${digest}`
    ];

    const ws = new this.options.WebSocket(null);

    if (protocols.size) {
      //
      // Optionally call external protocol selection handler.
      //
      const protocol = this.options.handleProtocols
        ? this.options.handleProtocols(protocols, req)
        : protocols.values().next().value;

      if (protocol) {
        headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
        ws._protocol = protocol;
      }
    }

    if (extensions[permessageDeflate.extensionName]) {
      const params = extensions[permessageDeflate.extensionName].params;
      const value = extension.format({
        [permessageDeflate.extensionName]: [params]
      });
      headers.push(`Sec-WebSocket-Extensions: ${value}`);
      ws._extensions = extensions;
    }

    //
    // Allow external modification/inspection of handshake headers.
    //
    this.emit('headers', headers, req);

    socket.write(headers.concat('\r\n').join('\r\n'));
    socket.removeListener('error', socketOnError);

    ws.setSocket(socket, head, {
      maxPayload: this.options.maxPayload,
      skipUTF8Validation: this.options.skipUTF8Validation
    });

    if (this.clients) {
      this.clients.add(ws);
      ws.on('close', () => {
        this.clients.delete(ws);

        if (this._shouldEmitClose && !this.clients.size) {
          process.nextTick(emitClose, this);
        }
      });
    }

    cb(ws, req);
  }
}

var websocketServer = WebSocketServer;

/**
 * Add event listeners on an `EventEmitter` using a map of <event, listener>
 * pairs.
 *
 * @param {EventEmitter} server The event emitter
 * @param {Object.<String, Function>} map The listeners to add
 * @return {Function} A function that will remove the added listeners when
 *     called
 * @private
 */
function addListeners(server, map) {
  for (const event of Object.keys(map)) server.on(event, map[event]);

  return function removeListeners() {
    for (const event of Object.keys(map)) {
      server.removeListener(event, map[event]);
    }
  };
}

/**
 * Emit a `'close'` event on an `EventEmitter`.
 *
 * @param {EventEmitter} server The event emitter
 * @private
 */
function emitClose(server) {
  server._state = CLOSED;
  server.emit('close');
}

/**
 * Handle socket errors.
 *
 * @private
 */
function socketOnError() {
  this.destroy();
}

/**
 * Close the connection when preconditions are not fulfilled.
 *
 * @param {(net.Socket|tls.Socket)} socket The socket of the upgrade request
 * @param {Number} code The HTTP response status code
 * @param {String} [message] The HTTP response body
 * @param {Object} [headers] Additional HTTP response headers
 * @private
 */
function abortHandshake(socket, code, message, headers) {
  //
  // The socket is writable unless the user destroyed or ended it before calling
  // `server.handleUpgrade()` or in the `verifyClient` function, which is a user
  // error. Handling this does not make much sense as the worst that can happen
  // is that some of the data written by the user might be discarded due to the
  // call to `socket.end()` below, which triggers an `'error'` event that in
  // turn causes the socket to be destroyed.
  //
  message = message || http.STATUS_CODES[code];
  headers = {
    Connection: 'close',
    'Content-Type': 'text/html',
    'Content-Length': Buffer.byteLength(message),
    ...headers
  };

  socket.once('finish', socket.destroy);

  socket.end(
    `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
      Object.keys(headers)
        .map((h) => `${h}: ${headers[h]}`)
        .join('\r\n') +
      '\r\n\r\n' +
      message
  );
}

/**
 * Emit a `'wsClientError'` event on a `WebSocketServer` if there is at least
 * one listener for it, otherwise call `abortHandshake()`.
 *
 * @param {WebSocketServer} server The WebSocket server
 * @param {http.IncomingMessage} req The request object
 * @param {(net.Socket|tls.Socket)} socket The socket of the upgrade request
 * @param {Number} code The HTTP response status code
 * @param {String} message The HTTP response body
 * @private
 */
function abortHandshakeOrEmitwsClientError(server, req, socket, code, message) {
  if (server.listenerCount('wsClientError')) {
    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);

    server.emit('wsClientError', err, socket, req);
  } else {
    abortHandshake(socket, code, message);
  }
}

/**
 * Copyright (c) 2015, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

/**
 * Adds Bit Operations to Buffer
 */
const addBufferBitOp = function() {

    /**
     * Add set one bit in a Buffer prototype.
     *
     * @param {boolean} value, new state of bit.
     * @param {number} bit, The bit offset.
     * @param {number} offset, the byte offset.
     */
    Buffer.prototype.writeBit = function(value, bit, offset) {
        const byteOffset = parseInt(bit / 8 + offset);
        const bitOffset = bit % 8;
        const bitMask = 0x1 << bitOffset;

        // get byte from buffer
        let byte = this.readUInt8(byteOffset);

        // set bit on / off
        if (value) {
            byte |= bitMask;
        } else {
            byte &= ~bitMask;
        }

        // set byte to buffer
        this.writeUInt8(byte, byteOffset);
    };

    /**
     * Add get one bit in a Buffer prototype.
     *
     * @param {boolean} bit, The bit offset.
     * @param {number} offset, the byte offset.
     *
     * @return {boolean} the state of the bit.
     */
    Buffer.prototype.readBit = function(bit, offset) {
        const byteOffset = parseInt(bit / 8 + offset);
        const bitOffset = bit % 8;
        const bitMask = 0x1 << bitOffset;

        // get byte from buffer
        const byte = this.readUInt8(byteOffset);

        // check bit state
        return (byte & bitMask) === bitMask;
    };
};

/**
 * Buffer Bit operations.
 *
 * @type {addBufferBitOp}
 */
var buffer_bit = addBufferBitOp;

var dist$e = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteLengthParser = void 0;

/**
 * Emit data every number of bytes
 *
 * A transform stream that emits data as a buffer after a specific number of bytes are received. Runs in O(n) time.
 */
class ByteLengthParser extends stream_1.Transform {
    constructor(options) {
        super(options);
        if (typeof options.length !== 'number') {
            throw new TypeError('"length" is not a number');
        }
        if (options.length < 1) {
            throw new TypeError('"length" is not greater than 0');
        }
        this.length = options.length;
        this.position = 0;
        this.buffer = Buffer.alloc(this.length);
    }
    _transform(chunk, _encoding, cb) {
        let cursor = 0;
        while (cursor < chunk.length) {
            this.buffer[this.position] = chunk[cursor];
            cursor++;
            this.position++;
            if (this.position === this.length) {
                this.push(this.buffer);
                this.buffer = Buffer.alloc(this.length);
                this.position = 0;
            }
        }
        cb();
    }
    _flush(cb) {
        this.push(this.buffer.slice(0, this.position));
        this.buffer = Buffer.alloc(this.length);
        cb();
    }
}
exports.ByteLengthParser = ByteLengthParser;
});

var dist$d = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCTalkParser = void 0;

/**
 * Parse the CCTalk protocol
 * @extends Transform
 *
 * A transform stream that emits CCTalk packets as they are received.
 */
class CCTalkParser extends stream_1.Transform {
    constructor(maxDelayBetweenBytesMs = 50) {
        super();
        this.array = [];
        this.cursor = 0;
        this.lastByteFetchTime = 0;
        this.maxDelayBetweenBytesMs = maxDelayBetweenBytesMs;
    }
    _transform(buffer, encoding, cb) {
        if (this.maxDelayBetweenBytesMs > 0) {
            const now = Date.now();
            if (now - this.lastByteFetchTime > this.maxDelayBetweenBytesMs) {
                this.array = [];
                this.cursor = 0;
            }
            this.lastByteFetchTime = now;
        }
        this.cursor += buffer.length;
        // TODO: Better Faster es7 no supported by node 4
        // ES7 allows directly push [...buffer]
        // this.array = this.array.concat(Array.from(buffer)) //Slower ?!?
        Array.from(buffer).map(byte => this.array.push(byte));
        while (this.cursor > 1 && this.cursor >= this.array[1] + 5) {
            // full frame accumulated
            // copy command from the array
            const FullMsgLength = this.array[1] + 5;
            const frame = Buffer.from(this.array.slice(0, FullMsgLength));
            // Preserve Extra Data
            this.array = this.array.slice(frame.length, this.array.length);
            this.cursor -= FullMsgLength;
            this.push(frame);
        }
        cb();
    }
}
exports.CCTalkParser = CCTalkParser;
});

var dist$c = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelimiterParser = void 0;

/**
 * A transform stream that emits data each time a byte sequence is received.
 * @extends Transform
 *
 * To use the `Delimiter` parser, provide a delimiter as a string, buffer, or array of bytes. Runs in O(n) time.
 */
class DelimiterParser extends stream_1.Transform {
    constructor({ delimiter, includeDelimiter = false, ...options }) {
        super(options);
        if (delimiter === undefined) {
            throw new TypeError('"delimiter" is not a bufferable object');
        }
        if (delimiter.length === 0) {
            throw new TypeError('"delimiter" has a 0 or undefined length');
        }
        this.includeDelimiter = includeDelimiter;
        this.delimiter = Buffer.from(delimiter);
        this.buffer = Buffer.alloc(0);
    }
    _transform(chunk, encoding, cb) {
        let data = Buffer.concat([this.buffer, chunk]);
        let position;
        while ((position = data.indexOf(this.delimiter)) !== -1) {
            this.push(data.slice(0, position + (this.includeDelimiter ? this.delimiter.length : 0)));
            data = data.slice(position + this.delimiter.length);
        }
        this.buffer = data;
        cb();
    }
    _flush(cb) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        cb();
    }
}
exports.DelimiterParser = DelimiterParser;
});

var dist$b = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterByteTimeoutParser = void 0;

/**
 * A transform stream that buffers data and emits it after not receiving any bytes for the specified amount of time or hitting a max buffer size.
 */
class InterByteTimeoutParser extends stream_1.Transform {
    constructor({ maxBufferSize = 65536, interval, ...transformOptions }) {
        super(transformOptions);
        if (!interval) {
            throw new TypeError('"interval" is required');
        }
        if (typeof interval !== 'number' || Number.isNaN(interval)) {
            throw new TypeError('"interval" is not a number');
        }
        if (interval < 1) {
            throw new TypeError('"interval" is not greater than 0');
        }
        if (typeof maxBufferSize !== 'number' || Number.isNaN(maxBufferSize)) {
            throw new TypeError('"maxBufferSize" is not a number');
        }
        if (maxBufferSize < 1) {
            throw new TypeError('"maxBufferSize" is not greater than 0');
        }
        this.maxBufferSize = maxBufferSize;
        this.currentPacket = [];
        this.interval = interval;
    }
    _transform(chunk, encoding, cb) {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
        for (let offset = 0; offset < chunk.length; offset++) {
            this.currentPacket.push(chunk[offset]);
            if (this.currentPacket.length >= this.maxBufferSize) {
                this.emitPacket();
            }
        }
        this.intervalID = setTimeout(this.emitPacket.bind(this), this.interval);
        cb();
    }
    emitPacket() {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
        if (this.currentPacket.length > 0) {
            this.push(Buffer.from(this.currentPacket));
        }
        this.currentPacket = [];
    }
    _flush(cb) {
        this.emitPacket();
        cb();
    }
}
exports.InterByteTimeoutParser = InterByteTimeoutParser;
});

var dist$a = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLengthParser = void 0;

/**
 * A transform stream that decodes packets with a delimiter and length of payload
 * specified within the data stream.
 * @extends Transform
 * @summary Decodes packets of the general form:
 *       [delimiter][len][payload0] ... [payload0 + len]
 *
 * The length field can be up to 4 bytes and can be at any offset within the packet
 *       [delimiter][header0][header1][len0][len1[payload0] ... [payload0 + len]
 *
 * The offset and number of bytes of the length field need to be provided in options
 * if not 1 byte immediately following the delimiter.
 */
class PacketLengthParser extends stream_1.Transform {
    constructor(options = {}) {
        super(options);
        const { delimiter = 0xaa, packetOverhead = 2, lengthBytes = 1, lengthOffset = 1, maxLen = 0xff } = options;
        this.opts = {
            delimiter,
            packetOverhead,
            lengthBytes,
            lengthOffset,
            maxLen,
        };
        this.buffer = Buffer.alloc(0);
        this.start = false;
    }
    _transform(chunk, encoding, cb) {
        for (let ndx = 0; ndx < chunk.length; ndx++) {
            const byte = chunk[ndx];
            if (byte === this.opts.delimiter) {
                this.start = true;
            }
            if (true === this.start) {
                this.buffer = Buffer.concat([this.buffer, Buffer.from([byte])]);
                if (this.buffer.length >= this.opts.lengthOffset + this.opts.lengthBytes) {
                    const len = this.buffer.readUIntLE(this.opts.lengthOffset, this.opts.lengthBytes);
                    if (this.buffer.length == len + this.opts.packetOverhead || len > this.opts.maxLen) {
                        this.push(this.buffer);
                        this.buffer = Buffer.alloc(0);
                        this.start = false;
                    }
                }
            }
        }
        cb();
    }
    _flush(cb) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        cb();
    }
}
exports.PacketLengthParser = PacketLengthParser;
});

var dist$9 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadlineParser = void 0;

/**
 *  A transform stream that emits data after a newline delimiter is received.
 * @summary To use the `Readline` parser, provide a delimiter (defaults to `\n`). Data is emitted as string controllable by the `encoding` option (defaults to `utf8`).
 */
class ReadlineParser extends dist$c.DelimiterParser {
    constructor(options) {
        const opts = {
            delimiter: Buffer.from('\n', 'utf8'),
            encoding: 'utf8',
            ...options,
        };
        if (typeof opts.delimiter === 'string') {
            opts.delimiter = Buffer.from(opts.delimiter, opts.encoding);
        }
        super(opts);
    }
}
exports.ReadlineParser = ReadlineParser;
});

var dist$8 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadyParser = void 0;

/**
 * A transform stream that waits for a sequence of "ready" bytes before emitting a ready event and emitting data events
 *
 * To use the `Ready` parser provide a byte start sequence. After the bytes have been received a ready event is fired and data events are passed through.
 */
class ReadyParser extends stream_1.Transform {
    constructor({ delimiter, ...options }) {
        if (delimiter === undefined) {
            throw new TypeError('"delimiter" is not a bufferable object');
        }
        if (delimiter.length === 0) {
            throw new TypeError('"delimiter" has a 0 or undefined length');
        }
        super(options);
        this.delimiter = Buffer.from(delimiter);
        this.readOffset = 0;
        this.ready = false;
    }
    _transform(chunk, encoding, cb) {
        if (this.ready) {
            this.push(chunk);
            return cb();
        }
        const delimiter = this.delimiter;
        let chunkOffset = 0;
        while (this.readOffset < delimiter.length && chunkOffset < chunk.length) {
            if (delimiter[this.readOffset] === chunk[chunkOffset]) {
                this.readOffset++;
            }
            else {
                this.readOffset = 0;
            }
            chunkOffset++;
        }
        if (this.readOffset === delimiter.length) {
            this.ready = true;
            this.emit('ready');
            const chunkRest = chunk.slice(chunkOffset);
            if (chunkRest.length > 0) {
                this.push(chunkRest);
            }
        }
        cb();
    }
}
exports.ReadyParser = ReadyParser;
});

var dist$7 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexParser = void 0;

/**
 * A transform stream that uses a regular expression to split the incoming text upon.
 *
 * To use the `Regex` parser provide a regular expression to split the incoming text upon. Data is emitted as string controllable by the `encoding` option (defaults to `utf8`).
 */
class RegexParser extends stream_1.Transform {
    constructor({ regex, ...options }) {
        const opts = {
            encoding: 'utf8',
            ...options,
        };
        if (regex === undefined) {
            throw new TypeError('"options.regex" must be a regular expression pattern or object');
        }
        if (!(regex instanceof RegExp)) {
            regex = new RegExp(regex.toString());
        }
        super(opts);
        this.regex = regex;
        this.data = '';
    }
    _transform(chunk, encoding, cb) {
        const data = this.data + chunk;
        const parts = data.split(this.regex);
        this.data = parts.pop() || '';
        parts.forEach(part => {
            this.push(part);
        });
        cb();
    }
    _flush(cb) {
        this.push(this.data);
        this.data = '';
        cb();
    }
}
exports.RegexParser = RegexParser;
});

var decoder = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlipDecoder = void 0;

/**
 * A transform stream that decodes slip encoded data.
 * @extends Transform
 *
 * Runs in O(n) time, stripping out slip encoding and emitting decoded data. Optionally custom slip escape and delimiters can be provided.
 */
class SlipDecoder extends stream_1.Transform {
    constructor(options = {}) {
        super(options);
        const { START, ESC = 0xdb, END = 0xc0, ESC_START, ESC_END = 0xdc, ESC_ESC = 0xdd } = options;
        this.opts = {
            START,
            ESC,
            END,
            ESC_START,
            ESC_END,
            ESC_ESC,
        };
        this.buffer = Buffer.alloc(0);
        this.escape = false;
        this.start = false;
    }
    _transform(chunk, encoding, cb) {
        for (let ndx = 0; ndx < chunk.length; ndx++) {
            let byte = chunk[ndx];
            if (byte === this.opts.START) {
                this.start = true;
                continue;
            }
            else if (undefined == this.opts.START) {
                this.start = true;
            }
            if (this.escape) {
                if (byte === this.opts.ESC_START && this.opts.START) {
                    byte = this.opts.START;
                }
                else if (byte === this.opts.ESC_ESC) {
                    byte = this.opts.ESC;
                }
                else if (byte === this.opts.ESC_END) {
                    byte = this.opts.END;
                }
                else {
                    this.escape = false;
                    this.push(this.buffer);
                    this.buffer = Buffer.alloc(0);
                }
            }
            else {
                if (byte === this.opts.ESC) {
                    this.escape = true;
                    continue;
                }
                if (byte === this.opts.END) {
                    this.push(this.buffer);
                    this.buffer = Buffer.alloc(0);
                    this.escape = false;
                    this.start = false;
                    continue;
                }
            }
            this.escape = false;
            if (this.start) {
                this.buffer = Buffer.concat([this.buffer, Buffer.from([byte])]);
            }
        }
        cb();
    }
    _flush(cb) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        cb();
    }
}
exports.SlipDecoder = SlipDecoder;
});

var encoder = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlipEncoder = void 0;

/**
 * A transform stream that emits SLIP-encoded data for each incoming packet.
 *
 * Runs in O(n) time, adding a 0xC0 character at the end of each
 * received packet and escaping characters, according to RFC 1055.
 */
class SlipEncoder extends stream_1.Transform {
    constructor(options = {}) {
        super(options);
        const { START, ESC = 0xdb, END = 0xc0, ESC_START, ESC_END = 0xdc, ESC_ESC = 0xdd, bluetoothQuirk = false } = options;
        this.opts = {
            START,
            ESC,
            END,
            ESC_START,
            ESC_END,
            ESC_ESC,
            bluetoothQuirk,
        };
    }
    _transform(chunk, encoding, cb) {
        const chunkLength = chunk.length;
        if (this.opts.bluetoothQuirk && chunkLength === 0) {
            // Edge case: push no data. Bluetooth-quirky SLIP parsers don't like
            // lots of 0xC0s together.
            return cb();
        }
        // Allocate memory for the worst-case scenario: all bytes are escaped,
        // plus start and end separators.
        const encoded = Buffer.alloc(chunkLength * 2 + 2);
        let j = 0;
        if (this.opts.bluetoothQuirk == true) {
            encoded[j++] = this.opts.END;
        }
        if (this.opts.START !== undefined) {
            encoded[j++] = this.opts.START;
        }
        for (let i = 0; i < chunkLength; i++) {
            let byte = chunk[i];
            if (byte === this.opts.START && this.opts.ESC_START) {
                encoded[j++] = this.opts.ESC;
                byte = this.opts.ESC_START;
            }
            else if (byte === this.opts.END) {
                encoded[j++] = this.opts.ESC;
                byte = this.opts.ESC_END;
            }
            else if (byte === this.opts.ESC) {
                encoded[j++] = this.opts.ESC;
                byte = this.opts.ESC_ESC;
            }
            encoded[j++] = byte;
        }
        encoded[j++] = this.opts.END;
        cb(null, encoded.slice(0, j));
    }
}
exports.SlipEncoder = SlipEncoder;
});

var dist$6 = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(decoder, exports);
__exportStar(encoder, exports);
});

var utils = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHeaderBufferToObj = exports.HEADER_LENGTH = void 0;
exports.HEADER_LENGTH = 6;
/**
 * For numbers less than 255, will ensure that their string representation is at least 8 characters long.
 */
const toOctetStr = (num) => {
    let str = Number(num).toString(2);
    while (str.length < 8) {
        str = `0${str}`;
    }
    return str;
};
/**
 * Converts a Buffer of any length to an Object representation of a Space Packet header, provided
 * the received data is in the correct format.
 * @param buf - The buffer containing the Space Packet Header Data
 */
const convertHeaderBufferToObj = (buf) => {
    const headerStr = Array.from(buf.slice(0, exports.HEADER_LENGTH)).reduce((accum, curr) => `${accum}${toOctetStr(curr)}`, '');
    const isVersion1 = headerStr.slice(0, 3) === '000';
    const versionNumber = isVersion1 ? 1 : 'UNKNOWN_VERSION';
    const type = Number(headerStr[3]);
    const secondaryHeader = Number(headerStr[4]);
    const apid = parseInt(headerStr.slice(5, 16), 2);
    const sequenceFlags = parseInt(headerStr.slice(16, 18), 2);
    const packetName = parseInt(headerStr.slice(18, 32), 2);
    const dataLength = parseInt(headerStr.slice(-16), 2) + 1;
    return {
        versionNumber,
        identification: {
            apid,
            secondaryHeader,
            type,
        },
        sequenceControl: {
            packetName,
            sequenceFlags,
        },
        dataLength,
    };
};
exports.convertHeaderBufferToObj = convertHeaderBufferToObj;
});

var dist$5 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpacePacketParser = void 0;


/**
 * A Transform stream that accepts a stream of octet data and converts it into an object
 * representation of a CCSDS Space Packet. See https://public.ccsds.org/Pubs/133x0b2e1.pdf for a
 * description of the Space Packet format.
 */
class SpacePacketParser extends stream_1.Transform {
    /**
     * A Transform stream that accepts a stream of octet data and emits object representations of
     * CCSDS Space Packets once a packet has been completely received.
     * @param {Object} [options] Configuration options for the stream
     * @param {Number} options.timeCodeFieldLength The length of the time code field within the data
     * @param {Number} options.ancillaryDataFieldLength The length of the ancillary data field within the data
     */
    constructor(options = {}) {
        super({ ...options, objectMode: true });
        // Set the constants for this Space Packet Connection; these will help us parse incoming data
        // fields:
        this.timeCodeFieldLength = options.timeCodeFieldLength || 0;
        this.ancillaryDataFieldLength = options.ancillaryDataFieldLength || 0;
        this.dataSlice = this.timeCodeFieldLength + this.ancillaryDataFieldLength;
        // These are stateful based on the current packet being received:
        this.dataBuffer = Buffer.alloc(0);
        this.headerBuffer = Buffer.alloc(0);
        this.dataLength = 0;
        this.expectingHeader = true;
    }
    /**
     * Bundle the header, secondary header if present, and the data into a JavaScript object to emit.
     * If more data has been received past the current packet, begin the process of parsing the next
     * packet(s).
     */
    pushCompletedPacket() {
        if (!this.header) {
            throw new Error('Missing header');
        }
        const timeCode = Buffer.from(this.dataBuffer.slice(0, this.timeCodeFieldLength));
        const ancillaryData = Buffer.from(this.dataBuffer.slice(this.timeCodeFieldLength, this.timeCodeFieldLength + this.ancillaryDataFieldLength));
        const data = Buffer.from(this.dataBuffer.slice(this.dataSlice, this.dataLength));
        const completedPacket = {
            header: { ...this.header },
            data: data.toString(),
        };
        if (timeCode.length > 0 || ancillaryData.length > 0) {
            completedPacket.secondaryHeader = {};
            if (timeCode.length) {
                completedPacket.secondaryHeader.timeCode = timeCode.toString();
            }
            if (ancillaryData.length) {
                completedPacket.secondaryHeader.ancillaryData = ancillaryData.toString();
            }
        }
        this.push(completedPacket);
        // If there is an overflow (i.e. we have more data than the packet we just pushed) begin parsing
        // the next packet.
        const nextChunk = Buffer.from(this.dataBuffer.slice(this.dataLength));
        if (nextChunk.length >= utils.HEADER_LENGTH) {
            this.extractHeader(nextChunk);
        }
        else {
            this.headerBuffer = nextChunk;
            this.dataBuffer = Buffer.alloc(0);
            this.expectingHeader = true;
            this.dataLength = 0;
            this.header = undefined;
        }
    }
    /**
     * Build the Stream's headerBuffer property from the received Buffer chunk; extract data from it
     * if it's complete. If there's more to the chunk than just the header, initiate handling the
     * packet data.
     * @param chunk -  Build the Stream's headerBuffer property from
     */
    extractHeader(chunk) {
        const headerAsBuffer = Buffer.concat([this.headerBuffer, chunk]);
        const startOfDataBuffer = headerAsBuffer.slice(utils.HEADER_LENGTH);
        if (headerAsBuffer.length >= utils.HEADER_LENGTH) {
            this.header = (0, utils.convertHeaderBufferToObj)(headerAsBuffer);
            this.dataLength = this.header.dataLength;
            this.headerBuffer = Buffer.alloc(0);
            this.expectingHeader = false;
        }
        else {
            this.headerBuffer = headerAsBuffer;
        }
        if (startOfDataBuffer.length > 0) {
            this.dataBuffer = Buffer.from(startOfDataBuffer);
            if (this.dataBuffer.length >= this.dataLength) {
                this.pushCompletedPacket();
            }
        }
    }
    _transform(chunk, encoding, cb) {
        if (this.expectingHeader) {
            this.extractHeader(chunk);
        }
        else {
            this.dataBuffer = Buffer.concat([this.dataBuffer, chunk]);
            if (this.dataBuffer.length >= this.dataLength) {
                this.pushCompletedPacket();
            }
        }
        cb();
    }
    _flush(cb) {
        const remaining = Buffer.concat([this.headerBuffer, this.dataBuffer]);
        const remainingArray = Array.from(remaining);
        this.push(remainingArray);
        cb();
    }
}
exports.SpacePacketParser = SpacePacketParser;
});

/**
 * Helpers.
 */
var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = ms;
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

var common = setup;

/* eslint-env browser */

var browser$1 = createCommonjsModule(function (module, exports) {
/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = common(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};
});

var hasFlag = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

/**
 * Module dependencies.
 */

var node = createCommonjsModule(function (module, exports) {
/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util_1.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = supportsColor_1;

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util_1.format(...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = common(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util_1.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util_1.inspect(v, this.inspectOpts);
};
});

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

var src = createCommonjsModule(function (module) {
if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = browser$1;
} else {
	module.exports = node;
}
});

var dist$4 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialPortStream = exports.DisconnectedError = void 0;

const debug_1 = __importDefault(src);
const debug = (0, debug_1.default)('serialport/stream');
class DisconnectedError extends Error {
    constructor(message) {
        super(message);
        this.disconnected = true;
    }
}
exports.DisconnectedError = DisconnectedError;
const defaultSetFlags = {
    brk: false,
    cts: false,
    dtr: true,
    rts: true,
};
function allocNewReadPool(poolSize) {
    const pool = Buffer.allocUnsafe(poolSize);
    pool.used = 0;
    return pool;
}
class SerialPortStream extends stream_1.Duplex {
    /**
     * Create a new serial port object for the `path`. In the case of invalid arguments or invalid options, when constructing a new SerialPort it will throw an error. The port will open automatically by default, which is the equivalent of calling `port.open(openCallback)` in the next tick. You can disable this by setting the option `autoOpen` to `false`.
     * @emits open
     * @emits data
     * @emits close
     * @emits error
     */
    constructor(options, openCallback) {
        const settings = {
            autoOpen: true,
            endOnClose: false,
            highWaterMark: 64 * 1024,
            ...options,
        };
        super({
            highWaterMark: settings.highWaterMark,
        });
        if (!settings.binding) {
            throw new TypeError('"Bindings" is invalid pass it as `options.binding`');
        }
        if (!settings.path) {
            throw new TypeError(`"path" is not defined: ${settings.path}`);
        }
        if (typeof settings.baudRate !== 'number') {
            throw new TypeError(`"baudRate" must be a number: ${settings.baudRate}`);
        }
        this.settings = settings;
        this.opening = false;
        this.closing = false;
        this._pool = allocNewReadPool(this.settings.highWaterMark);
        this._kMinPoolSpace = 128;
        if (this.settings.autoOpen) {
            this.open(openCallback);
        }
    }
    get path() {
        return this.settings.path;
    }
    get baudRate() {
        return this.settings.baudRate;
    }
    get isOpen() {
        var _a, _b;
        return ((_b = (_a = this.port) === null || _a === void 0 ? void 0 : _a.isOpen) !== null && _b !== void 0 ? _b : false) && !this.closing;
    }
    _error(error, callback) {
        if (callback) {
            callback.call(this, error);
        }
        else {
            this.emit('error', error);
        }
    }
    _asyncError(error, callback) {
        process.nextTick(() => this._error(error, callback));
    }
    /**
     * Opens a connection to the given serial port.
     * @param {ErrorCallback=} openCallback - Called after a connection is opened. If this is not provided and an error occurs, it will be emitted on the port's `error` event.
     * @emits open
     */
    open(openCallback) {
        if (this.isOpen) {
            return this._asyncError(new Error('Port is already open'), openCallback);
        }
        if (this.opening) {
            return this._asyncError(new Error('Port is opening'), openCallback);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { highWaterMark, binding, autoOpen, endOnClose, ...openOptions } = this.settings;
        this.opening = true;
        debug('opening', `path: ${this.path}`);
        this.settings.binding.open(openOptions).then(port => {
            debug('opened', `path: ${this.path}`);
            this.port = port;
            this.opening = false;
            this.emit('open');
            if (openCallback) {
                openCallback.call(this, null);
            }
        }, err => {
            this.opening = false;
            debug('Binding #open had an error', err);
            this._error(err, openCallback);
        });
    }
    /**
     * Changes the baud rate for an open port. Emits an error or calls the callback if the baud rate isn't supported.
     * @param {object=} options Only supports `baudRate`.
     * @param {number=} [options.baudRate] The baud rate of the port to be opened. This should match one of the commonly available baud rates, such as 110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, or 115200. Custom rates are supported best effort per platform. The device connected to the serial port is not guaranteed to support the requested baud rate, even if the port itself supports that baud rate.
     * @param {ErrorCallback=} [callback] Called once the port's baud rate changes. If `.update` is called without a callback, and there is an error, an error event is emitted.
     * @returns {undefined}
     */
    update(options, callback) {
        if (!this.isOpen || !this.port) {
            debug('update attempted, but port is not open');
            return this._asyncError(new Error('Port is not open'), callback);
        }
        debug('update', `baudRate: ${options.baudRate}`);
        this.port.update(options).then(() => {
            debug('binding.update', 'finished');
            this.settings.baudRate = options.baudRate;
            if (callback) {
                callback.call(this, null);
            }
        }, err => {
            debug('binding.update', 'error', err);
            return this._error(err, callback);
        });
    }
    write(data, encoding, callback) {
        if (Array.isArray(data)) {
            data = Buffer.from(data);
        }
        if (typeof encoding === 'function') {
            return super.write(data, encoding);
        }
        return super.write(data, encoding, callback);
    }
    _write(data, encoding, callback) {
        if (!this.isOpen || !this.port) {
            this.once('open', () => {
                this._write(data, encoding, callback);
            });
            return;
        }
        debug('_write', `${data.length} bytes of data`);
        this.port.write(data).then(() => {
            debug('binding.write', 'write finished');
            callback(null);
        }, err => {
            debug('binding.write', 'error', err);
            if (!err.canceled) {
                this._disconnected(err);
            }
            callback(err);
        });
    }
    _writev(data, callback) {
        debug('_writev', `${data.length} chunks of data`);
        const dataV = data.map(write => write.chunk);
        this._write(Buffer.concat(dataV), undefined, callback);
    }
    _read(bytesToRead) {
        if (!this.isOpen || !this.port) {
            debug('_read', 'queueing _read for after open');
            this.once('open', () => {
                this._read(bytesToRead);
            });
            return;
        }
        if (!this._pool || this._pool.length - this._pool.used < this._kMinPoolSpace) {
            debug('_read', 'discarding the read buffer pool because it is below kMinPoolSpace');
            this._pool = allocNewReadPool(this.settings.highWaterMark);
        }
        // Grab another reference to the pool in the case that while we're
        // in the thread pool another read() finishes up the pool, and
        // allocates a new one.
        const pool = this._pool;
        // Read the smaller of rest of the pool or however many bytes we want
        const toRead = Math.min(pool.length - pool.used, bytesToRead);
        const start = pool.used;
        // the actual read.
        debug('_read', `reading`, { start, toRead });
        this.port.read(pool, start, toRead).then(({ bytesRead }) => {
            debug('binding.read', `finished`, { bytesRead });
            // zero bytes means read means we've hit EOF? Maybe this should be an error
            if (bytesRead === 0) {
                debug('binding.read', 'Zero bytes read closing readable stream');
                this.push(null);
                return;
            }
            pool.used += bytesRead;
            this.push(pool.slice(start, start + bytesRead));
        }, err => {
            debug('binding.read', `error`, err);
            if (!err.canceled) {
                this._disconnected(err);
            }
            this._read(bytesToRead); // prime to read more once we're reconnected
        });
    }
    _disconnected(err) {
        if (!this.isOpen) {
            debug('disconnected aborted because already closed', err);
            return;
        }
        debug('disconnected', err);
        this.close(undefined, new DisconnectedError(err.message));
    }
    /**
     * Closes an open connection.
     *
     * If there are in progress writes when the port is closed the writes will error.
     * @param {ErrorCallback} callback Called once a connection is closed.
     * @param {Error} disconnectError used internally to propagate a disconnect error
     */
    close(callback, disconnectError = null) {
        if (!this.isOpen || !this.port) {
            debug('close attempted, but port is not open');
            return this._asyncError(new Error('Port is not open'), callback);
        }
        this.closing = true;
        debug('#close');
        this.port.close().then(() => {
            this.closing = false;
            debug('binding.close', 'finished');
            this.emit('close', disconnectError);
            if (this.settings.endOnClose) {
                this.emit('end');
            }
            if (callback) {
                callback.call(this, disconnectError);
            }
        }, err => {
            this.closing = false;
            debug('binding.close', 'had an error', err);
            return this._error(err, callback);
        });
    }
    /**
     * Set control flags on an open port. Uses [`SetCommMask`](https://msdn.microsoft.com/en-us/library/windows/desktop/aa363257(v=vs.85).aspx) for Windows and [`ioctl`](http://linux.die.net/man/4/tty_ioctl) for OS X and Linux.
     *
     * All options are operating system default when the port is opened. Every flag is set on each call to the provided or default values. If options isn't provided default options is used.
     */
    set(options, callback) {
        if (!this.isOpen || !this.port) {
            debug('set attempted, but port is not open');
            return this._asyncError(new Error('Port is not open'), callback);
        }
        const settings = { ...defaultSetFlags, ...options };
        debug('#set', settings);
        this.port.set(settings).then(() => {
            debug('binding.set', 'finished');
            if (callback) {
                callback.call(this, null);
            }
        }, err => {
            debug('binding.set', 'had an error', err);
            return this._error(err, callback);
        });
    }
    /**
     * Returns the control flags (CTS, DSR, DCD) on the open port.
     * Uses [`GetCommModemStatus`](https://msdn.microsoft.com/en-us/library/windows/desktop/aa363258(v=vs.85).aspx) for Windows and [`ioctl`](http://linux.die.net/man/4/tty_ioctl) for mac and linux.
     */
    get(callback) {
        if (!this.isOpen || !this.port) {
            debug('get attempted, but port is not open');
            return this._asyncError(new Error('Port is not open'), callback);
        }
        debug('#get');
        this.port.get().then(status => {
            debug('binding.get', 'finished');
            callback.call(this, null, status);
        }, err => {
            debug('binding.get', 'had an error', err);
            return this._error(err, callback);
        });
    }
    /**
     * Flush discards data received but not read, and written but not transmitted by the operating system. For more technical details, see [`tcflush(fd, TCIOFLUSH)`](http://linux.die.net/man/3/tcflush) for Mac/Linux and [`FlushFileBuffers`](http://msdn.microsoft.com/en-us/library/windows/desktop/aa364439) for Windows.
     */
    flush(callback) {
        if (!this.isOpen || !this.port) {
            debug('flush attempted, but port is not open');
            return this._asyncError(new Error('Port is not open'), callback);
        }
        debug('#flush');
        this.port.flush().then(() => {
            debug('binding.flush', 'finished');
            if (callback) {
                callback.call(this, null);
            }
        }, err => {
            debug('binding.flush', 'had an error', err);
            return this._error(err, callback);
        });
    }
    /**
     * Waits until all output data is transmitted to the serial port. After any pending write has completed it calls [`tcdrain()`](http://linux.die.net/man/3/tcdrain) or [FlushFileBuffers()](https://msdn.microsoft.com/en-us/library/windows/desktop/aa364439(v=vs.85).aspx) to ensure it has been written to the device.
    * @example
    Write the `data` and wait until it has finished transmitting to the target serial port before calling the callback. This will queue until the port is open and writes are finished.
  
    ```js
    function writeAndDrain (data, callback) {
      port.write(data);
      port.drain(callback);
    }
    ```
    */
    drain(callback) {
        debug('drain');
        if (!this.isOpen || !this.port) {
            debug('drain queuing on port open');
            this.once('open', () => {
                this.drain(callback);
            });
            return;
        }
        this.port.drain().then(() => {
            debug('binding.drain', 'finished');
            if (callback) {
                callback.call(this, null);
            }
        }, err => {
            debug('binding.drain', 'had an error', err);
            return this._error(err, callback);
        });
    }
}
exports.SerialPortStream = SerialPortStream;
/**
 * The `error` event's callback is called with an error object whenever there is an error.
 * @event error
 */
/**
 * The `open` event's callback is called with no arguments when the port is opened and ready for writing. This happens if you have the constructor open immediately (which opens in the next tick) or if you open the port manually with `open()`. See [Useage/Opening a Port](#opening-a-port) for more information.
 * @event open
 */
/**
 * Request a number of bytes from the SerialPort. The `read()` method pulls some data out of the internal buffer and returns it. If no data is available to be read, null is returned. By default, the data is returned as a `Buffer` object unless an encoding has been specified using the `.setEncoding()` method.
 * @method SerialPort.prototype.read
 * @param {number=} size Specify how many bytes of data to return, if available
 * @returns {(string|Buffer|null)} The data from internal buffers
 */
/**
 * Listening for the `data` event puts the port in flowing mode. Data is emitted as soon as it's received. Data is a `Buffer` object with a varying amount of data in it. The `readLine` parser converts the data into string lines. See the [parsers](https://serialport.io/docs/api-parsers-overview) section for more information on parsers, and the [Node.js stream documentation](https://nodejs.org/api/stream.html#stream_event_data) for more information on the data event.
 * @event data
 */
/**
 * The `close` event's callback is called with no arguments when the port is closed. In the case of a disconnect it will be called with a Disconnect Error object (`err.disconnected == true`). In the event of a close error (unlikely), an error event is triggered.
 * @event close
 */
/**
 * The `pause()` method causes a stream in flowing mode to stop emitting 'data' events, switching out of flowing mode. Any data that becomes available remains in the internal buffer.
 * @method SerialPort.prototype.pause
 * @see resume
 * @returns `this`
 */
/**
 * The `resume()` method causes an explicitly paused, `Readable` stream to resume emitting 'data' events, switching the stream into flowing mode.
 * @method SerialPort.prototype.resume
 * @see pause
 * @returns `this`
 */
});

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var debugFactory__default = /*#__PURE__*/_interopDefaultLegacy(src);

const debug$1 = debugFactory__default["default"]('serialport/binding-mock');
let ports = {};
let serialNumber = 0;
function resolveNextTick() {
    return new Promise(resolve => process.nextTick(() => resolve()));
}
class CanceledError extends Error {
    constructor(message) {
        super(message);
        this.canceled = true;
    }
}
const MockBinding = {
    reset() {
        ports = {};
        serialNumber = 0;
    },
    // Create a mock port
    createPort(path, options = {}) {
        serialNumber++;
        const optWithDefaults = Object.assign({ echo: false, record: false, manufacturer: 'The J5 Robotics Company', vendorId: undefined, productId: undefined, maxReadSize: 1024 }, options);
        ports[path] = {
            data: Buffer.alloc(0),
            echo: optWithDefaults.echo,
            record: optWithDefaults.record,
            readyData: optWithDefaults.readyData,
            maxReadSize: optWithDefaults.maxReadSize,
            info: {
                path,
                manufacturer: optWithDefaults.manufacturer,
                serialNumber: `${serialNumber}`,
                pnpId: undefined,
                locationId: undefined,
                vendorId: optWithDefaults.vendorId,
                productId: optWithDefaults.productId,
            },
        };
        debug$1(serialNumber, 'created port', JSON.stringify({ path, opt: options }));
    },
    async list() {
        debug$1(null, 'list');
        return Object.values(ports).map(port => port.info);
    },
    async open(options) {
        var _a;
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        if (!options.path) {
            throw new TypeError('"path" is not a valid port');
        }
        if (!options.baudRate) {
            throw new TypeError('"baudRate" is not a valid baudRate');
        }
        const openOptions = Object.assign({ dataBits: 8, lock: true, stopBits: 1, parity: 'none', rtscts: false, xon: false, xoff: false, xany: false, hupcl: true }, options);
        const { path } = openOptions;
        debug$1(null, `open: opening path ${path}`);
        const port = ports[path];
        await resolveNextTick();
        if (!port) {
            throw new Error(`Port does not exist - please call MockBinding.createPort('${path}') first`);
        }
        const serialNumber = port.info.serialNumber;
        if ((_a = port.openOpt) === null || _a === void 0 ? void 0 : _a.lock) {
            debug$1(serialNumber, 'open: Port is locked cannot open');
            throw new Error('Port is locked cannot open');
        }
        debug$1(serialNumber, `open: opened path ${path}`);
        port.openOpt = Object.assign({}, openOptions);
        return new MockPortBinding(port, openOptions);
    },
};
/**
 * Mock bindings for pretend serialport access
 */
class MockPortBinding {
    constructor(port, openOptions) {
        this.port = port;
        this.openOptions = openOptions;
        this.pendingRead = null;
        this.isOpen = true;
        this.lastWrite = null;
        this.recording = Buffer.alloc(0);
        this.writeOperation = null; // in flight promise or null
        this.serialNumber = port.info.serialNumber;
        if (port.readyData) {
            const data = port.readyData;
            process.nextTick(() => {
                if (this.isOpen) {
                    debug$1(this.serialNumber, 'emitting ready data');
                    this.emitData(data);
                }
            });
        }
    }
    // Emit data on a mock port
    emitData(data) {
        if (!this.isOpen || !this.port) {
            throw new Error('Port must be open to pretend to receive data');
        }
        const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data);
        debug$1(this.serialNumber, 'emitting data - pending read:', Boolean(this.pendingRead));
        this.port.data = Buffer.concat([this.port.data, bufferData]);
        if (this.pendingRead) {
            process.nextTick(this.pendingRead);
            this.pendingRead = null;
        }
    }
    async close() {
        debug$1(this.serialNumber, 'close');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        const port = this.port;
        if (!port) {
            throw new Error('already closed');
        }
        port.openOpt = undefined;
        // reset data on close
        port.data = Buffer.alloc(0);
        debug$1(this.serialNumber, 'port is closed');
        this.serialNumber = undefined;
        this.isOpen = false;
        if (this.pendingRead) {
            this.pendingRead(new CanceledError('port is closed'));
        }
    }
    async read(buffer, offset, length) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new TypeError(`"offset" is not an integer got "${isNaN(offset) ? 'NaN' : typeof offset}"`);
        }
        if (typeof length !== 'number' || isNaN(length)) {
            throw new TypeError(`"length" is not an integer got "${isNaN(length) ? 'NaN' : typeof length}"`);
        }
        if (buffer.length < offset + length) {
            throw new Error('buffer is too small');
        }
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        debug$1(this.serialNumber, 'read', length, 'bytes');
        await resolveNextTick();
        if (!this.isOpen || !this.port) {
            throw new CanceledError('Read canceled');
        }
        if (this.port.data.length <= 0) {
            return new Promise((resolve, reject) => {
                this.pendingRead = err => {
                    if (err) {
                        return reject(err);
                    }
                    this.read(buffer, offset, length).then(resolve, reject);
                };
            });
        }
        const lengthToRead = this.port.maxReadSize > length ? length : this.port.maxReadSize;
        const data = this.port.data.slice(0, lengthToRead);
        const bytesRead = data.copy(buffer, offset);
        this.port.data = this.port.data.slice(lengthToRead);
        debug$1(this.serialNumber, 'read', bytesRead, 'bytes');
        return { bytesRead, buffer };
    }
    async write(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        if (!this.isOpen || !this.port) {
            debug$1('write', 'error port is not open');
            throw new Error('Port is not open');
        }
        debug$1(this.serialNumber, 'write', buffer.length, 'bytes');
        if (this.writeOperation) {
            throw new Error('Overlapping writes are not supported and should be queued by the serialport object');
        }
        this.writeOperation = (async () => {
            await resolveNextTick();
            if (!this.isOpen || !this.port) {
                throw new Error('Write canceled');
            }
            const data = (this.lastWrite = Buffer.from(buffer)); // copy
            if (this.port.record) {
                this.recording = Buffer.concat([this.recording, data]);
            }
            if (this.port.echo) {
                process.nextTick(() => {
                    if (this.isOpen) {
                        this.emitData(data);
                    }
                });
            }
            this.writeOperation = null;
            debug$1(this.serialNumber, 'writing finished');
        })();
        return this.writeOperation;
    }
    async update(options) {
        if (typeof options !== 'object') {
            throw TypeError('"options" is not an object');
        }
        if (typeof options.baudRate !== 'number') {
            throw new TypeError('"options.baudRate" is not a number');
        }
        debug$1(this.serialNumber, 'update');
        if (!this.isOpen || !this.port) {
            throw new Error('Port is not open');
        }
        await resolveNextTick();
        if (this.port.openOpt) {
            this.port.openOpt.baudRate = options.baudRate;
        }
    }
    async set(options) {
        if (typeof options !== 'object') {
            throw new TypeError('"options" is not an object');
        }
        debug$1(this.serialNumber, 'set');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await resolveNextTick();
    }
    async get() {
        debug$1(this.serialNumber, 'get');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await resolveNextTick();
        return {
            cts: true,
            dsr: false,
            dcd: false,
        };
    }
    async getBaudRate() {
        var _a;
        debug$1(this.serialNumber, 'getBaudRate');
        if (!this.isOpen || !this.port) {
            throw new Error('Port is not open');
        }
        await resolveNextTick();
        if (!((_a = this.port.openOpt) === null || _a === void 0 ? void 0 : _a.baudRate)) {
            throw new Error('Internal Error');
        }
        return {
            baudRate: this.port.openOpt.baudRate,
        };
    }
    async flush() {
        debug$1(this.serialNumber, 'flush');
        if (!this.isOpen || !this.port) {
            throw new Error('Port is not open');
        }
        await resolveNextTick();
        this.port.data = Buffer.alloc(0);
    }
    async drain() {
        debug$1(this.serialNumber, 'drain');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await this.writeOperation;
        await resolveNextTick();
    }
}

var CanceledError_1 = CanceledError;
var MockBinding_1 = MockBinding;
var MockPortBinding_1 = MockPortBinding;

var dist$3 = /*#__PURE__*/Object.defineProperty({
	CanceledError: CanceledError_1,
	MockBinding: MockBinding_1,
	MockPortBinding: MockPortBinding_1
}, '__esModule', {value: true});

var serialportMock = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialPortMock = void 0;


class SerialPortMock extends dist$4.SerialPortStream {
    constructor(options, openCallback) {
        const opts = {
            binding: dist$3.MockBinding,
            ...options,
        };
        super(opts, openCallback);
    }
}
exports.SerialPortMock = SerialPortMock;
SerialPortMock.list = dist$3.MockBinding.list;
SerialPortMock.binding = dist$3.MockBinding;
});

// Workaround to fix webpack's build warnings: 'the request of a dependency is an expression'
var runtimeRequire = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : commonjsRequire; // eslint-disable-line

var vars = (process.config && process.config.variables) || {};
var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
var abi = process.versions.modules; // TODO: support old node where this is undef
var runtime = isElectron() ? 'electron' : (isNwjs() ? 'node-webkit' : 'node');

var arch = process.env.npm_config_arch || os.arch();
var platform = process.env.npm_config_platform || os.platform();
var libc = process.env.LIBC || (isAlpine(platform) ? 'musl' : 'glibc');
var armv = process.env.ARM_VERSION || (arch === 'arm64' ? '8' : vars.arm_version) || '';
var uv = (process.versions.uv || '').split('.')[0];

var nodeGypBuild$1 = load;

function load (dir) {
  return runtimeRequire(load.resolve(dir))
}

load.resolve = load.path = function (dir) {
  dir = path.resolve(dir || '.');

  try {
    var name = runtimeRequire(path.join(dir, 'package.json')).name.toUpperCase().replace(/-/g, '_');
    if (process.env[name + '_PREBUILD']) dir = process.env[name + '_PREBUILD'];
  } catch (err) {}

  if (!prebuildsOnly) {
    var release = getFirst(path.join(dir, 'build/Release'), matchBuild);
    if (release) return release

    var debug = getFirst(path.join(dir, 'build/Debug'), matchBuild);
    if (debug) return debug
  }

  var prebuild = resolve(dir);
  if (prebuild) return prebuild

  var nearby = resolve(path.dirname(process.execPath));
  if (nearby) return nearby

  var target = [
    'platform=' + platform,
    'arch=' + arch,
    'runtime=' + runtime,
    'abi=' + abi,
    'uv=' + uv,
    armv ? 'armv=' + armv : '',
    'libc=' + libc,
    'node=' + process.versions.node,
    process.versions.electron ? 'electron=' + process.versions.electron : '',
    typeof __webpack_require__ === 'function' ? 'webpack=true' : '' // eslint-disable-line
  ].filter(Boolean).join(' ');

  throw new Error('No native build was found for ' + target + '\n    loaded from: ' + dir + '\n')

  function resolve (dir) {
    // Find matching "prebuilds/<platform>-<arch>" directory
    var tuples = readdirSync(path.join(dir, 'prebuilds')).map(parseTuple);
    var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
    if (!tuple) return

    // Find most specific flavor first
    var prebuilds = path.join(dir, 'prebuilds', tuple.name);
    var parsed = readdirSync(prebuilds).map(parseTags);
    var candidates = parsed.filter(matchTags(runtime, abi));
    var winner = candidates.sort(compareTags(runtime))[0];
    if (winner) return path.join(prebuilds, winner.file)
  }
};

function readdirSync (dir) {
  try {
    return fs.readdirSync(dir)
  } catch (err) {
    return []
  }
}

function getFirst (dir, filter) {
  var files = readdirSync(dir).filter(filter);
  return files[0] && path.join(dir, files[0])
}

function matchBuild (name) {
  return /\.node$/.test(name)
}

function parseTuple (name) {
  // Example: darwin-x64+arm64
  var arr = name.split('-');
  if (arr.length !== 2) return

  var platform = arr[0];
  var architectures = arr[1].split('+');

  if (!platform) return
  if (!architectures.length) return
  if (!architectures.every(Boolean)) return

  return { name, platform, architectures }
}

function matchTuple (platform, arch) {
  return function (tuple) {
    if (tuple == null) return false
    if (tuple.platform !== platform) return false
    return tuple.architectures.includes(arch)
  }
}

function compareTuples (a, b) {
  // Prefer single-arch prebuilds over multi-arch
  return a.architectures.length - b.architectures.length
}

function parseTags (file) {
  var arr = file.split('.');
  var extension = arr.pop();
  var tags = { file: file, specificity: 0 };

  if (extension !== 'node') return

  for (var i = 0; i < arr.length; i++) {
    var tag = arr[i];

    if (tag === 'node' || tag === 'electron' || tag === 'node-webkit') {
      tags.runtime = tag;
    } else if (tag === 'napi') {
      tags.napi = true;
    } else if (tag.slice(0, 3) === 'abi') {
      tags.abi = tag.slice(3);
    } else if (tag.slice(0, 2) === 'uv') {
      tags.uv = tag.slice(2);
    } else if (tag.slice(0, 4) === 'armv') {
      tags.armv = tag.slice(4);
    } else if (tag === 'glibc' || tag === 'musl') {
      tags.libc = tag;
    } else {
      continue
    }

    tags.specificity++;
  }

  return tags
}

function matchTags (runtime, abi) {
  return function (tags) {
    if (tags == null) return false
    if (tags.runtime !== runtime && !runtimeAgnostic(tags)) return false
    if (tags.abi !== abi && !tags.napi) return false
    if (tags.uv && tags.uv !== uv) return false
    if (tags.armv && tags.armv !== armv) return false
    if (tags.libc && tags.libc !== libc) return false

    return true
  }
}

function runtimeAgnostic (tags) {
  return tags.runtime === 'node' && tags.napi
}

function compareTags (runtime) {
  // Precedence: non-agnostic runtime, abi over napi, then by specificity.
  return function (a, b) {
    if (a.runtime !== b.runtime) {
      return a.runtime === runtime ? -1 : 1
    } else if (a.abi !== b.abi) {
      return a.abi ? -1 : 1
    } else if (a.specificity !== b.specificity) {
      return a.specificity > b.specificity ? -1 : 1
    } else {
      return 0
    }
  }
}

function isNwjs () {
  return !!(process.versions && process.versions.nw)
}

function isElectron () {
  if (process.versions && process.versions.electron) return true
  if (process.env.ELECTRON_RUN_AS_NODE) return true
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer'
}

function isAlpine (platform) {
  return platform === 'linux' && fs.existsSync('/etc/alpine-release')
}

// Exposed for unit tests
// TODO: move to lib
load.parseTags = parseTags;
load.matchTags = matchTags;
load.compareTags = compareTags;
load.parseTuple = parseTuple;
load.matchTuple = matchTuple;
load.compareTuples = compareTuples;

var nodeGypBuild = createCommonjsModule(function (module) {
if (typeof process.addon === 'function') { // if the platform supports native resolving prefer that
  module.exports = process.addon.bind(process);
} else { // else use the runtime version here
  module.exports = nodeGypBuild$1;
}
});

var loadBindings = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncWrite = exports.asyncRead = exports.asyncUpdate = exports.asyncSet = exports.asyncOpen = exports.asyncList = exports.asyncGetBaudRate = exports.asyncGet = exports.asyncFlush = exports.asyncDrain = exports.asyncClose = void 0;
const node_gyp_build_1 = __importDefault(nodeGypBuild);


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const binding = (0, node_gyp_build_1.default)((0, path.join)(__dirname, '../'));
exports.asyncClose = binding.close ? (0, util_1.promisify)(binding.close) : async () => { throw new Error('"binding.close" Method not implemented'); };
exports.asyncDrain = binding.drain ? (0, util_1.promisify)(binding.drain) : async () => { throw new Error('"binding.drain" Method not implemented'); };
exports.asyncFlush = binding.flush ? (0, util_1.promisify)(binding.flush) : async () => { throw new Error('"binding.flush" Method not implemented'); };
exports.asyncGet = binding.get ? (0, util_1.promisify)(binding.get) : async () => { throw new Error('"binding.get" Method not implemented'); };
exports.asyncGetBaudRate = binding.getBaudRate ? (0, util_1.promisify)(binding.getBaudRate) : async () => { throw new Error('"binding.getBaudRate" Method not implemented'); };
exports.asyncList = binding.list ? (0, util_1.promisify)(binding.list) : async () => { throw new Error('"binding.list" Method not implemented'); };
exports.asyncOpen = binding.open ? (0, util_1.promisify)(binding.open) : async () => { throw new Error('"binding.open" Method not implemented'); };
exports.asyncSet = binding.set ? (0, util_1.promisify)(binding.set) : async () => { throw new Error('"binding.set" Method not implemented'); };
exports.asyncUpdate = binding.update ? (0, util_1.promisify)(binding.update) : async () => { throw new Error('"binding.update" Method not implemented'); };
exports.asyncRead = binding.read ? (0, util_1.promisify)(binding.read) : async () => { throw new Error('"binding.read" Method not implemented'); };
exports.asyncWrite = binding.read ? (0, util_1.promisify)(binding.write) : async () => { throw new Error('"binding.write" Method not implemented'); };
});

var errors = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindingsError = void 0;
class BindingsError extends Error {
    constructor(message, { canceled = false } = {}) {
        super(message);
        this.canceled = canceled;
    }
}
exports.BindingsError = BindingsError;
});

var poller = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poller = exports.EVENTS = void 0;
const debug_1 = __importDefault(src);


const node_gyp_build_1 = __importDefault(nodeGypBuild);

const { Poller: PollerBindings } = (0, node_gyp_build_1.default)((0, path.join)(__dirname, '../'));
const logger = (0, debug_1.default)('serialport/bindings-cpp/poller');
exports.EVENTS = {
    UV_READABLE: 0b0001,
    UV_WRITABLE: 0b0010,
    UV_DISCONNECT: 0b0100,
};
function handleEvent(error, eventFlag) {
    if (error) {
        logger('error', error);
        this.emit('readable', error);
        this.emit('writable', error);
        this.emit('disconnect', error);
        return;
    }
    if (eventFlag & exports.EVENTS.UV_READABLE) {
        logger('received "readable"');
        this.emit('readable', null);
    }
    if (eventFlag & exports.EVENTS.UV_WRITABLE) {
        logger('received "writable"');
        this.emit('writable', null);
    }
    if (eventFlag & exports.EVENTS.UV_DISCONNECT) {
        logger('received "disconnect"');
        this.emit('disconnect', null);
    }
}
/**
 * Polls unix systems for readable or writable states of a file or serialport
 */
class Poller extends events.EventEmitter {
    constructor(fd, FDPoller = PollerBindings) {
        logger('Creating poller');
        super();
        this.poller = new FDPoller(fd, handleEvent.bind(this));
    }
    /**
     * Wait for the next event to occur
     * @param {string} event ('readable'|'writable'|'disconnect')
     * @returns {Poller} returns itself
     */
    once(event, callback) {
        switch (event) {
            case 'readable':
                this.poll(exports.EVENTS.UV_READABLE);
                break;
            case 'writable':
                this.poll(exports.EVENTS.UV_WRITABLE);
                break;
            case 'disconnect':
                this.poll(exports.EVENTS.UV_DISCONNECT);
                break;
        }
        return super.once(event, callback);
    }
    /**
     * Ask the bindings to listen for an event, it is recommend to use `.once()` for easy use
     * @param {EVENTS} eventFlag polls for an event or group of events based upon a flag.
     */
    poll(eventFlag = 0) {
        if (eventFlag & exports.EVENTS.UV_READABLE) {
            logger('Polling for "readable"');
        }
        if (eventFlag & exports.EVENTS.UV_WRITABLE) {
            logger('Polling for "writable"');
        }
        if (eventFlag & exports.EVENTS.UV_DISCONNECT) {
            logger('Polling for "disconnect"');
        }
        this.poller.poll(eventFlag);
    }
    /**
     * Stop listening for events and cancel all outstanding listening with an error
     */
    stop() {
        logger('Stopping poller');
        this.poller.stop();
        this.emitCanceled();
    }
    destroy() {
        logger('Destroying poller');
        this.poller.destroy();
        this.emitCanceled();
    }
    emitCanceled() {
        const err = new errors.BindingsError('Canceled', { canceled: true });
        this.emit('readable', err);
        this.emit('writable', err);
        this.emit('disconnect', err);
    }
}
exports.Poller = Poller;
});

var unixRead_1 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unixRead = void 0;



const debug_1 = __importDefault(src);
const logger = (0, debug_1.default)('serialport/bindings-cpp/unixRead');
const readAsync = (0, util_1.promisify)(fs.read);
const readable = (binding) => {
    return new Promise((resolve, reject) => {
        if (!binding.poller) {
            throw new Error('No poller on bindings');
        }
        binding.poller.once('readable', err => (err ? reject(err) : resolve()));
    });
};
const unixRead = async ({ binding, buffer, offset, length, fsReadAsync = readAsync, }) => {
    logger('Starting read');
    if (!binding.isOpen || !binding.fd) {
        throw new errors.BindingsError('Port is not open', { canceled: true });
    }
    try {
        const { bytesRead } = await fsReadAsync(binding.fd, buffer, offset, length, null);
        if (bytesRead === 0) {
            return (0, exports.unixRead)({ binding, buffer, offset, length, fsReadAsync });
        }
        logger('Finished read', bytesRead, 'bytes');
        return { bytesRead, buffer };
    }
    catch (err) {
        logger('read error', err);
        if (err.code === 'EAGAIN' || err.code === 'EWOULDBLOCK' || err.code === 'EINTR') {
            if (!binding.isOpen) {
                throw new errors.BindingsError('Port is not open', { canceled: true });
            }
            logger('waiting for readable because of code:', err.code);
            await readable(binding);
            return (0, exports.unixRead)({ binding, buffer, offset, length, fsReadAsync });
        }
        const disconnectError = err.code === 'EBADF' || // Bad file number means we got closed
            err.code === 'ENXIO' || // No such device or address probably usb disconnect
            err.code === 'UNKNOWN' ||
            err.errno === -1; // generic error
        if (disconnectError) {
            err.disconnect = true;
            logger('disconnecting', err);
        }
        throw err;
    }
};
exports.unixRead = unixRead;
});

var unixWrite_1 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unixWrite = void 0;

const debug_1 = __importDefault(src);

const logger = (0, debug_1.default)('serialport/bindings-cpp/unixWrite');
const writeAsync = (0, util_1.promisify)(fs.write);
const writable = (binding) => {
    return new Promise((resolve, reject) => {
        binding.poller.once('writable', err => (err ? reject(err) : resolve()));
    });
};
const unixWrite = async ({ binding, buffer, offset = 0, fsWriteAsync = writeAsync }) => {
    const bytesToWrite = buffer.length - offset;
    logger('Starting write', buffer.length, 'bytes offset', offset, 'bytesToWrite', bytesToWrite);
    if (!binding.isOpen || !binding.fd) {
        throw new Error('Port is not open');
    }
    try {
        const { bytesWritten } = await fsWriteAsync(binding.fd, buffer, offset, bytesToWrite);
        logger('write returned: wrote', bytesWritten, 'bytes');
        if (bytesWritten + offset < buffer.length) {
            if (!binding.isOpen) {
                throw new Error('Port is not open');
            }
            return (0, exports.unixWrite)({ binding, buffer, offset: bytesWritten + offset, fsWriteAsync });
        }
        logger('Finished writing', bytesWritten + offset, 'bytes');
    }
    catch (err) {
        logger('write errored', err);
        if (err.code === 'EAGAIN' || err.code === 'EWOULDBLOCK' || err.code === 'EINTR') {
            if (!binding.isOpen) {
                throw new Error('Port is not open');
            }
            logger('waiting for writable because of code:', err.code);
            await writable(binding);
            return (0, exports.unixWrite)({ binding, buffer, offset, fsWriteAsync });
        }
        const disconnectError = err.code === 'EBADF' || // Bad file number means we got closed
            err.code === 'ENXIO' || // No such device or address probably usb disconnect
            err.code === 'UNKNOWN' ||
            err.errno === -1; // generic error
        if (disconnectError) {
            err.disconnect = true;
            logger('disconnecting', err);
        }
        logger('error', err);
        throw err;
    }
};
exports.unixWrite = unixWrite;
});

var darwin = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DarwinPortBinding = exports.DarwinBinding = void 0;
const debug_1 = __importDefault(src);




const debug = (0, debug_1.default)('serialport/bindings-cpp');
exports.DarwinBinding = {
    list() {
        debug('list');
        return (0, loadBindings.asyncList)();
    },
    async open(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        if (!options.path) {
            throw new TypeError('"path" is not a valid port');
        }
        if (!options.baudRate) {
            throw new TypeError('"baudRate" is not a valid baudRate');
        }
        debug('open');
        const openOptions = Object.assign({ vmin: 1, vtime: 0, dataBits: 8, lock: true, stopBits: 1, parity: 'none', rtscts: false, xon: false, xoff: false, xany: false, hupcl: true }, options);
        const fd = await (0, loadBindings.asyncOpen)(openOptions.path, openOptions);
        return new DarwinPortBinding(fd, openOptions);
    },
};
/**
 * The Darwin binding layer for OSX
 */
class DarwinPortBinding {
    constructor(fd, options) {
        this.fd = fd;
        this.openOptions = options;
        this.poller = new poller.Poller(fd);
        this.writeOperation = null;
    }
    get isOpen() {
        return this.fd !== null;
    }
    async close() {
        debug('close');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        const fd = this.fd;
        this.poller.stop();
        this.poller.destroy();
        this.fd = null;
        await (0, loadBindings.asyncClose)(fd);
    }
    async read(buffer, offset, length) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new TypeError(`"offset" is not an integer got "${isNaN(offset) ? 'NaN' : typeof offset}"`);
        }
        if (typeof length !== 'number' || isNaN(length)) {
            throw new TypeError(`"length" is not an integer got "${isNaN(length) ? 'NaN' : typeof length}"`);
        }
        debug('read');
        if (buffer.length < offset + length) {
            throw new Error('buffer is too small');
        }
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, unixRead_1.unixRead)({ binding: this, buffer, offset, length });
    }
    async write(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        debug('write', buffer.length, 'bytes');
        if (!this.isOpen) {
            debug('write', 'error port is not open');
            throw new Error('Port is not open');
        }
        this.writeOperation = (async () => {
            if (buffer.length === 0) {
                return;
            }
            await (0, unixWrite_1.unixWrite)({ binding: this, buffer });
            this.writeOperation = null;
        })();
        return this.writeOperation;
    }
    async update(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw TypeError('"options" is not an object');
        }
        if (typeof options.baudRate !== 'number') {
            throw new TypeError('"options.baudRate" is not a number');
        }
        debug('update');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncUpdate)(this.fd, options);
    }
    async set(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        debug('set', options);
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncSet)(this.fd, options);
    }
    async get() {
        debug('get');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, loadBindings.asyncGet)(this.fd);
    }
    async getBaudRate() {
        debug('getBaudRate');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        throw new Error('getBaudRate is not implemented on darwin');
    }
    async flush() {
        debug('flush');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncFlush)(this.fd);
    }
    async drain() {
        debug('drain');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await this.writeOperation;
        await (0, loadBindings.asyncDrain)(this.fd);
    }
}
exports.DarwinPortBinding = DarwinPortBinding;
});

var linuxList_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.linuxList = void 0;


// get only serial port names
function checkPathOfDevice(path) {
    return /(tty(S|WCH|ACM|USB|AMA|MFD|O|XRUSB)|rfcomm)/.test(path) && path;
}
function propName(name) {
    return {
        DEVNAME: 'path',
        ID_VENDOR_ENC: 'manufacturer',
        ID_SERIAL_SHORT: 'serialNumber',
        ID_VENDOR_ID: 'vendorId',
        ID_MODEL_ID: 'productId',
        DEVLINKS: 'pnpId',
    }[name.toUpperCase()];
}
function decodeHexEscape(str) {
    return str.replace(/\\x([a-fA-F0-9]{2})/g, (a, b) => {
        return String.fromCharCode(parseInt(b, 16));
    });
}
function propVal(name, val) {
    if (name === 'pnpId') {
        const match = val.match(/\/by-id\/([^\s]+)/);
        return (match === null || match === void 0 ? void 0 : match[1]) || undefined;
    }
    if (name === 'manufacturer') {
        return decodeHexEscape(val);
    }
    if (/^0x/.test(val)) {
        return val.substr(2);
    }
    return val;
}
function linuxList(spawnCmd = child_process_1.spawn) {
    const ports = [];
    const udevadm = spawnCmd('udevadm', ['info', '-e']);
    const lines = udevadm.stdout.pipe(new dist$9.ReadlineParser());
    let skipPort = false;
    let port = {
        path: '',
        manufacturer: undefined,
        serialNumber: undefined,
        pnpId: undefined,
        locationId: undefined,
        vendorId: undefined,
        productId: undefined,
    };
    lines.on('data', (line) => {
        const lineType = line.slice(0, 1);
        const data = line.slice(3);
        // new port entry
        if (lineType === 'P') {
            port = {
                path: '',
                manufacturer: undefined,
                serialNumber: undefined,
                pnpId: undefined,
                locationId: undefined,
                vendorId: undefined,
                productId: undefined,
            };
            skipPort = false;
            return;
        }
        if (skipPort) {
            return;
        }
        // Check dev name and save port if it matches flag to skip the rest of the data if not
        if (lineType === 'N') {
            if (checkPathOfDevice(data)) {
                ports.push(port);
            }
            else {
                skipPort = true;
            }
            return;
        }
        // parse data about each port
        if (lineType === 'E') {
            const keyValue = data.match(/^(.+)=(.*)/);
            if (!keyValue) {
                return;
            }
            const key = propName(keyValue[1]);
            if (!key) {
                return;
            }
            port[key] = propVal(key, keyValue[2]);
        }
    });
    return new Promise((resolve, reject) => {
        udevadm.on('close', (code) => {
            if (code) {
                reject(new Error(`Error listing ports udevadm exited with error code: ${code}`));
            }
        });
        udevadm.on('error', reject);
        lines.on('error', reject);
        lines.on('finish', () => resolve(ports));
    });
}
exports.linuxList = linuxList;
});

var linux = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinuxPortBinding = exports.LinuxBinding = void 0;
const debug_1 = __importDefault(src);





const debug = (0, debug_1.default)('serialport/bindings-cpp');
exports.LinuxBinding = {
    list() {
        debug('list');
        return (0, linuxList_1.linuxList)();
    },
    async open(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        if (!options.path) {
            throw new TypeError('"path" is not a valid port');
        }
        if (!options.baudRate) {
            throw new TypeError('"baudRate" is not a valid baudRate');
        }
        debug('open');
        const openOptions = Object.assign({ vmin: 1, vtime: 0, dataBits: 8, lock: true, stopBits: 1, parity: 'none', rtscts: false, xon: false, xoff: false, xany: false, hupcl: true }, options);
        const fd = await (0, loadBindings.asyncOpen)(openOptions.path, openOptions);
        this.fd = fd;
        return new LinuxPortBinding(fd, openOptions);
    },
};
/**
 * The linux binding layer
 */
class LinuxPortBinding {
    constructor(fd, openOptions) {
        this.fd = fd;
        this.openOptions = openOptions;
        this.poller = new poller.Poller(fd);
        this.writeOperation = null;
    }
    get isOpen() {
        return this.fd !== null;
    }
    async close() {
        debug('close');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        const fd = this.fd;
        this.poller.stop();
        this.poller.destroy();
        this.fd = null;
        await (0, loadBindings.asyncClose)(fd);
    }
    async read(buffer, offset, length) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new TypeError(`"offset" is not an integer got "${isNaN(offset) ? 'NaN' : typeof offset}"`);
        }
        if (typeof length !== 'number' || isNaN(length)) {
            throw new TypeError(`"length" is not an integer got "${isNaN(length) ? 'NaN' : typeof length}"`);
        }
        debug('read');
        if (buffer.length < offset + length) {
            throw new Error('buffer is too small');
        }
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, unixRead_1.unixRead)({ binding: this, buffer, offset, length });
    }
    async write(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        debug('write', buffer.length, 'bytes');
        if (!this.isOpen) {
            debug('write', 'error port is not open');
            throw new Error('Port is not open');
        }
        this.writeOperation = (async () => {
            if (buffer.length === 0) {
                return;
            }
            await (0, unixWrite_1.unixWrite)({ binding: this, buffer });
            this.writeOperation = null;
        })();
        return this.writeOperation;
    }
    async update(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw TypeError('"options" is not an object');
        }
        if (typeof options.baudRate !== 'number') {
            throw new TypeError('"options.baudRate" is not a number');
        }
        debug('update');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncUpdate)(this.fd, options);
    }
    async set(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        debug('set');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncSet)(this.fd, options);
    }
    async get() {
        debug('get');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, loadBindings.asyncGet)(this.fd);
    }
    async getBaudRate() {
        debug('getBaudRate');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, loadBindings.asyncGetBaudRate)(this.fd);
    }
    async flush() {
        debug('flush');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncFlush)(this.fd);
    }
    async drain() {
        debug('drain');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await this.writeOperation;
        await (0, loadBindings.asyncDrain)(this.fd);
    }
}
exports.LinuxPortBinding = LinuxPortBinding;
});

var win32SnParser = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialNumParser = void 0;
const PARSERS = [/USB\\(?:.+)\\(.+)/, /FTDIBUS\\(?:.+)\+(.+?)A?\\.+/];
const serialNumParser = (pnpId) => {
    if (!pnpId) {
        return null;
    }
    for (const parser of PARSERS) {
        const sn = pnpId.match(parser);
        if (sn) {
            return sn[1];
        }
    }
    return null;
};
exports.serialNumParser = serialNumParser;
});

var bindings_cpp_1 = dist$1;

var win32 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsPortBinding = exports.WindowsBinding = void 0;
const debug_1 = __importDefault(src);



const debug = (0, debug_1.default)('serialport/bindings-cpp');
exports.WindowsBinding = {
    async list() {
        const ports = await (0, loadBindings.asyncList)();
        // Grab the serial number from the pnp id
        return ports.map(port => {
            if (port.pnpId && !port.serialNumber) {
                const serialNumber = (0, win32SnParser.serialNumParser)(port.pnpId);
                if (serialNumber) {
                    return Object.assign(Object.assign({}, port), { serialNumber });
                }
            }
            return port;
        });
    },
    async open(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        if (!options.path) {
            throw new TypeError('"path" is not a valid port');
        }
        if (!options.baudRate) {
            throw new TypeError('"baudRate" is not a valid baudRate');
        }
        debug('open');
        const openOptions = Object.assign({ dataBits: 8, lock: true, stopBits: 1, parity: 'none', rtscts: false, rtsMode: 'handshake', xon: false, xoff: false, xany: false, hupcl: true }, options);
        const fd = await (0, loadBindings.asyncOpen)(openOptions.path, openOptions);
        return new WindowsPortBinding(fd, openOptions);
    },
};
/**
 * The Windows binding layer
 */
class WindowsPortBinding {
    constructor(fd, options) {
        this.fd = fd;
        this.openOptions = options;
        this.writeOperation = null;
    }
    get isOpen() {
        return this.fd !== null;
    }
    async close() {
        debug('close');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        const fd = this.fd;
        this.fd = null;
        await (0, loadBindings.asyncClose)(fd);
    }
    async read(buffer, offset, length) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new TypeError(`"offset" is not an integer got "${isNaN(offset) ? 'NaN' : typeof offset}"`);
        }
        if (typeof length !== 'number' || isNaN(length)) {
            throw new TypeError(`"length" is not an integer got "${isNaN(length) ? 'NaN' : typeof length}"`);
        }
        debug('read');
        if (buffer.length < offset + length) {
            throw new Error('buffer is too small');
        }
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        try {
            const bytesRead = await (0, loadBindings.asyncRead)(this.fd, buffer, offset, length);
            return { bytesRead, buffer };
        }
        catch (err) {
            if (!this.isOpen) {
                throw new bindings_cpp_1.BindingsError(err.message, { canceled: true });
            }
            throw err;
        }
    }
    async write(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('"buffer" is not a Buffer');
        }
        debug('write', buffer.length, 'bytes');
        if (!this.isOpen) {
            debug('write', 'error port is not open');
            throw new Error('Port is not open');
        }
        this.writeOperation = (async () => {
            if (buffer.length === 0) {
                return;
            }
            await (0, loadBindings.asyncWrite)(this.fd, buffer);
            this.writeOperation = null;
        })();
        return this.writeOperation;
    }
    async update(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw TypeError('"options" is not an object');
        }
        if (typeof options.baudRate !== 'number') {
            throw new TypeError('"options.baudRate" is not a number');
        }
        debug('update');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncUpdate)(this.fd, options);
    }
    async set(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('"options" is not an object');
        }
        debug('set', options);
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncSet)(this.fd, options);
    }
    async get() {
        debug('get');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, loadBindings.asyncGet)(this.fd);
    }
    async getBaudRate() {
        debug('getBaudRate');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        return (0, loadBindings.asyncGetBaudRate)(this.fd);
    }
    async flush() {
        debug('flush');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await (0, loadBindings.asyncFlush)(this.fd);
    }
    async drain() {
        debug('drain');
        if (!this.isOpen) {
            throw new Error('Port is not open');
        }
        await this.writeOperation;
        await (0, loadBindings.asyncDrain)(this.fd);
    }
}
exports.WindowsPortBinding = WindowsPortBinding;
});

var dist$2 = /*#__PURE__*/Object.freeze({
  __proto__: null
});

var require$$1$1 = /*@__PURE__*/getAugmentedNamespace(dist$2);

var dist$1 = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoDetect = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const debug_1 = __importDefault(src);



const debug = (0, debug_1.default)('serialport/bindings-cpp');
__exportStar(require$$1$1, exports);
__exportStar(darwin, exports);
__exportStar(linux, exports);
__exportStar(win32, exports);
__exportStar(errors, exports);
/**
 * This is an auto detected binding for your current platform
 */
function autoDetect() {
    switch (process.platform) {
        case 'win32':
            debug('loading WindowsBinding');
            return win32.WindowsBinding;
        case 'darwin':
            debug('loading DarwinBinding');
            return darwin.DarwinBinding;
        default:
            debug('loading LinuxBinding');
            return linux.LinuxBinding;
    }
}
exports.autoDetect = autoDetect;
});

var serialport = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialPort = void 0;


const DetectedBinding = (0, bindings_cpp_1.autoDetect)();
class SerialPort extends dist$4.SerialPortStream {
    constructor(options, openCallback) {
        const opts = {
            binding: DetectedBinding,
            ...options,
        };
        super(opts, openCallback);
    }
}
exports.SerialPort = SerialPort;
SerialPort.list = DetectedBinding.list;
SerialPort.binding = DetectedBinding;
});

var dist = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(dist$e, exports);
__exportStar(dist$d, exports);
__exportStar(dist$c, exports);
__exportStar(dist$b, exports);
__exportStar(dist$a, exports);
__exportStar(dist$9, exports);
__exportStar(dist$8, exports);
__exportStar(dist$7, exports);
__exportStar(dist$6, exports);
__exportStar(dist$5, exports);
__exportStar(serialportMock, exports);
__exportStar(serialport, exports);
});

/**
 * Calculates the buffers CRC16.
 *
 * @param {Buffer} buffer the data buffer.
 * @return {number} the calculated CRC16.
 */
var crc16 = function crc16(buffer) {
    let crc = 0xFFFF;
    let odd;

    for (let i = 0; i < buffer.length; i++) {
        crc = crc ^ buffer[i];

        for (let j = 0; j < 8; j++) {
            odd = crc & 0x0001;
            crc = crc >> 1;
            if (odd) {
                crc = crc ^ 0xA001;
            }
        }
    }

    return crc;
};

const EventEmitter$a = events.EventEmitter || events;

const modbusSerialDebug$a = src("modbus-serial");



/* TODO: const should be set once, maybe */
const MODBUS_PORT$3 = 502; // modbus port
const MAX_TRANSACTIONS$2 = 256; // maximum transaction to wait for
const MIN_DATA_LENGTH$7 = 6;
const MIN_MBAP_LENGTH$2 = 6;
const CRC_LENGTH$3 = 2;

class TcpPort extends EventEmitter$a {
    /**
     * Simulate a modbus-RTU port using modbus-TCP connection.
     *
     * @param ip
     * @param options
     *   options.port: Nonstandard Modbus port (default is 502).
     *   options.localAddress: Local IP address to bind to, default is any.
     *   options.family: 4 = IPv4-only, 6 = IPv6-only, 0 = either (default).
     * @constructor
     */
    constructor(ip, options) {
        super();
        const modbus = this;
        this.openFlag = false;
        this.callback = null;
        this._transactionIdWrite = 1;
        this._externalSocket = null;

        if(typeof ip === "object") {
            options = ip;
        }

        if (typeof(options) === "undefined") options = {};

        this.connectOptions = {
            host: ip || options.ip,
            port: options.port || MODBUS_PORT$3,
            localAddress: options.localAddress,
            family: options.family
        };

        if(options.socket) {
            if(options.socket instanceof net.Socket) {
                this._externalSocket = options.socket;
                this.openFlag = this._externalSocket.readyState === "opening" || this._externalSocket.readyState === "open";
            } else {
                throw new Error("invalid socket provided");
            }
        }

        // handle callback - call a callback function only once, for the first event
        // it will triger
        const handleCallback = function(had_error) {
            if (modbus.callback) {
                modbus.callback(had_error);
                modbus.callback = null;
            }
        };

        // init a socket
        this._client = this._externalSocket || new net.Socket();

        if (options.timeout) this._client.setTimeout(options.timeout);
        this._client.on("data", function(data) {
            let buffer;
            let crc;
            let length;

            // data recived
            modbusSerialDebug$a({ action: "receive tcp port strings", data: data });

            // check data length
            while (data.length > MIN_MBAP_LENGTH$2) {
                // parse tcp header length
                length = data.readUInt16BE(4);

                // cut 6 bytes of mbap and copy pdu
                buffer = Buffer.alloc(length + CRC_LENGTH$3);
                data.copy(buffer, 0, MIN_MBAP_LENGTH$2);

                // add crc to message
                crc = crc16(buffer.slice(0, -CRC_LENGTH$3));
                buffer.writeUInt16LE(crc, buffer.length - CRC_LENGTH$3);

                // update transaction id and emit data
                modbus._transactionIdRead = data.readUInt16BE(0);
                modbus.emit("data", buffer);

                // debug
                modbusSerialDebug$a({ action: "parsed tcp port", buffer: buffer, transactionId: modbus._transactionIdRead });

                // reset data
                data = data.slice(length + MIN_MBAP_LENGTH$2);
            }
        });

        this._client.on("connect", function() {
            modbus.openFlag = true;
            modbusSerialDebug$a("TCP port: signal connect");
            handleCallback();
        });

        this._client.on("close", function(had_error) {
            modbus.openFlag = false;
            modbusSerialDebug$a("TCP port: signal close: " + had_error);
            handleCallback(had_error);

            modbus.emit("close");
            modbus.removeAllListeners();
        });

        this._client.on("error", function(had_error) {
            modbus.openFlag = false;
            modbusSerialDebug$a("TCP port: signal error: " + had_error);
            handleCallback(had_error);
        });

        this._client.on("timeout", function() {
            // modbus.openFlag is left in its current state as it reflects two types of timeouts,
            // i.e. 'false' for "TCP connection timeout" and 'true' for "Modbus response timeout"
            // (this allows to continue Modbus request re-tries without reconnecting TCP).
            modbusSerialDebug$a("TCP port: TimedOut");
            handleCallback(new Error("TCP Connection Timed Out"));
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this.openFlag;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        if(this._externalSocket === null) {
            this.callback = callback;
            this._client.connect(this.connectOptions);
        } else if(this.openFlag) {
            modbusSerialDebug$a("TCP port: external socket is opened");
            callback(); // go ahead to setup existing socket
        } else {
            callback(new Error("TCP port: external socket is not opened"));
        }
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this.callback = callback;
        // DON'T pass callback to `end()` here, it will be handled by client.on('close') handler
        this._client.end();
    }

    /**
     * Simulate successful destroy port.
     *
     * @param callback
     */
    destroy(callback) {
        this.callback = callback;
        if (!this._client.destroyed) {
            this._client.destroy();
        }
    }

    /**
     * Send data to a modbus-tcp slave.
     *
     * @param data
     */
    write(data) {
        if(data.length < MIN_DATA_LENGTH$7) {
            modbusSerialDebug$a("expected length of data is to small - minimum is " + MIN_DATA_LENGTH$7);
            return;
        }

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // remove crc and add mbap
        const buffer = Buffer.alloc(data.length + MIN_MBAP_LENGTH$2 - CRC_LENGTH$3);
        buffer.writeUInt16BE(this._transactionIdWrite, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(data.length - CRC_LENGTH$3, 4);
        data.copy(buffer, MIN_MBAP_LENGTH$2);

        modbusSerialDebug$a({
            action: "send tcp port",
            data: data,
            buffer: buffer,
            unitid: this._id,
            functionCode: this._cmd,
            transactionsId: this._transactionIdWrite
        });

        // send buffer to slave
        this._client.write(buffer);

        // set next transaction id
        this._transactionIdWrite = (this._transactionIdWrite + 1) % MAX_TRANSACTIONS$2;
    }
}

/**
 * TCP port for Modbus.
 *
 * @type {TcpPort}
 */
var tcpport = TcpPort;

const EventEmitter$9 = events.EventEmitter || events;

const modbusSerialDebug$9 = src("modbus-serial");



/* TODO: const should be set once, maybe */
const EXCEPTION_LENGTH$2 = 3;
const MIN_DATA_LENGTH$6 = 6;
const MIN_MBAP_LENGTH$1 = 6;
const MAX_TRANSACTIONS$1 = 64; // maximum transaction to wait for
const MAX_BUFFER_LENGTH$1 = 256;
const CRC_LENGTH$2 = 2;

const MODBUS_PORT$2 = 502;

class TcpRTUBufferedPort extends EventEmitter$9 {
    /**
     * Simulate a modbus-RTU port using TCP connection
     * @module TcpRTUBufferedPort
     *
     * @param {string} ip - ip address
     * @param {object} options - all options as JSON object
     *   options.port: Nonstandard Modbus port (default is 502).
     *   options.localAddress: Local IP address to bind to, default is any.
     *   options.family: 4 = IPv4-only, 6 = IPv6-only, 0 = either (default).
     * @constructor
     */
    constructor(ip, options) {
        super();

        const modbus = this;
        modbus.openFlag = false;
        modbus.callback = null;
        modbus._transactionIdWrite = 1;
        this._externalSocket = null;

        // options
        if(typeof ip === "object") {
            options = ip;
        }
        if (typeof options === "undefined") options = {};
        modbus.connectOptions = {
            host: ip || options.ip,
            port: options.port || MODBUS_PORT$2,
            localAddress: options.localAddress,
            family: options.family || 0
        };

        if(options.socket) {
            if(options.socket instanceof net.Socket) {
                this._externalSocket = options.socket;
                this.openFlag = this._externalSocket.readyState === "opening" || this._externalSocket.readyState === "open";
            } else {
                throw new Error("invalid socket provided");
            }
        }

        // internal buffer
        modbus._buffer = Buffer.alloc(0);

        // handle callback - call a callback function only once, for the first event
        // it will triger
        const handleCallback = function(had_error) {
            if (modbus.callback) {
                modbus.callback(had_error);
                modbus.callback = null;
            }
        };

        // create a socket
        modbus._client = this._externalSocket || new net.Socket();
        if (options.timeout) this._client.setTimeout(options.timeout);

        // register the port data event
        modbus._client.on("data", function onData(data) {
            // add data to buffer
            modbus._buffer = Buffer.concat([modbus._buffer, data]);

            modbusSerialDebug$9({
                action: "receive tcp rtu buffered port",
                data: data,
                buffer: modbus._buffer
            });

            // check if buffer include a complete modbus answer
            let bufferLength = modbus._buffer.length;

            // check data length
            if (bufferLength < MIN_MBAP_LENGTH$1) return;

            // check buffer size for MAX_BUFFER_SIZE
            if (bufferLength > MAX_BUFFER_LENGTH$1) {
                modbus._buffer = modbus._buffer.slice(-MAX_BUFFER_LENGTH$1);
                bufferLength = MAX_BUFFER_LENGTH$1;
            }

            // check data length
            if (bufferLength < MIN_MBAP_LENGTH$1 + EXCEPTION_LENGTH$2) return;

            // loop and check length-sized buffer chunks
            const maxOffset = bufferLength - MIN_MBAP_LENGTH$1;
            for (let i = 0; i <= maxOffset; i++) {
                modbus._transactionIdRead = modbus._buffer.readUInt16BE(i);
                const protocolID = modbus._buffer.readUInt16BE(i + 2);
                const msgLength = modbus._buffer.readUInt16BE(i + 4);
                const cmd = modbus._buffer[i + 7];

                modbusSerialDebug$9({
                    protocolID: protocolID,
                    msgLength: msgLength,
                    bufferLength: bufferLength,
                    cmd: cmd
                });

                if (
                    protocolID === 0 &&
                    cmd !== 0 &&
                    msgLength >= EXCEPTION_LENGTH$2 &&
                    i + MIN_MBAP_LENGTH$1 + msgLength <= bufferLength
                ) {
                    // add crc and emit
                    modbus._emitData(i + MIN_MBAP_LENGTH$1, msgLength);
                    return;
                }
            }
        });

        this._client.on("connect", function() {
            modbus.openFlag = true;
            handleCallback();
        });

        this._client.on("close", function(had_error) {
            modbus.openFlag = false;
            handleCallback(had_error);
            modbus.emit("close");
        });

        this._client.on("error", function(had_error) {
            modbus.openFlag = false;
            handleCallback(had_error);
        });

        this._client.on("timeout", function() {
            // modbus.openFlag is left in its current state as it reflects two types of timeouts,
            // i.e. 'false' for "TCP connection timeout" and 'true' for "Modbus response timeout"
            // (this allows to continue Modbus request re-tries without reconnecting TCP).
            modbusSerialDebug$9("TcpRTUBufferedPort port: TimedOut");
            handleCallback(new Error("TcpRTUBufferedPort Connection Timed Out"));
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this.openFlag;
    }

    /**
     * Emit the received response, cut the buffer and reset the internal vars.
     *
     * @param {number} start the start index of the response within the buffer
     * @param {number} length the length of the response
     * @private
     */
    _emitData(start, length) {
        const modbus = this;
        const data = modbus._buffer.slice(start, start + length);

        // cut the buffer
        modbus._buffer = modbus._buffer.slice(start + length);

        if (data.length > 0) {
            const buffer = Buffer.alloc(data.length + CRC_LENGTH$2);
            data.copy(buffer, 0);

            // add crc
            const crc = crc16(buffer.slice(0, -CRC_LENGTH$2));
            buffer.writeUInt16LE(crc, buffer.length - CRC_LENGTH$2);

            modbus.emit("data", buffer);

            // debug
            modbusSerialDebug$9({
                action: "parsed tcp buffered port",
                buffer: buffer,
                transactionId: modbus._transactionIdRead
            });
        } else {
            modbusSerialDebug$9({ action: "emit data to short", data: data });
        }
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        if(this._externalSocket === null) {
            this.callback = callback;
            this._client.connect(this.connectOptions);
        } else if(this.openFlag) {
            modbusSerialDebug$9("TcpRTUBuffered port: external socket is opened");
            callback(); // go ahead to setup existing socket
        } else {
            callback(new Error("TcpRTUBuffered port: external socket is not opened"));
        }
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this.callback = callback;
        this._client.end(callback);

        this.removeAllListeners();
    }

    /**
     * Simulate successful destroy port.
     *
     * @param callback
     */
    destroy(callback) {
        this.callback = callback;
        if (!this._client.destroyed) {
            this._client.destroy();
        }
    }

    /**
     * Send data to a modbus slave via telnet server.
     *
     * @param {Buffer} data
     */
    write(data) {
        if (data.length < MIN_DATA_LENGTH$6) {
            modbusSerialDebug$9(
                "expected length of data is to small - minimum is " +
                    MIN_DATA_LENGTH$6
            );
            return;
        }

        // remove crc and add mbap
        const buffer = Buffer.alloc(data.length + MIN_MBAP_LENGTH$1 - CRC_LENGTH$2);
        buffer.writeUInt16BE(this._transactionIdWrite, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(data.length - CRC_LENGTH$2, 4);
        data.copy(buffer, MIN_MBAP_LENGTH$1);

        modbusSerialDebug$9({
            action: "send tcp rtu buffered port",
            data: data,
            buffer: buffer,
            transactionsId: this._transactionIdWrite
        });

        // get next transaction id
        this._transactionIdWrite =
            (this._transactionIdWrite + 1) % MAX_TRANSACTIONS$1;

        // send buffer to slave
        this._client.write(buffer);
    }
}

/**
 * TCP RTU bufferd port for Modbus.
 *
 * @type {TcpRTUBufferedPort}
 */
var tcprtubufferedport = TcpRTUBufferedPort;

const EventEmitter$8 = events.EventEmitter || events;

const modbusSerialDebug$8 = src("modbus-serial");

/* TODO: const should be set once, maybe */
const EXCEPTION_LENGTH$1 = 5;
const MIN_DATA_LENGTH$5 = 6;

const TELNET_PORT = 2217;

class TelnetPort extends EventEmitter$8 {
    /**
     * Simulate a modbus-RTU port using Telent connection.
     *
     * @param ip
     * @param options
     * @constructor
     */
    constructor(ip, options) {
        super();

        const self = this;
        this.ip = ip;
        this.openFlag = false;
        this.callback = null;
        this._externalSocket = null;

        // options
        if(typeof ip === "object") {
            options = ip;
            this.ip = options.ip;
        }
        if (typeof options === "undefined") options = {};
        this.port = options.port || TELNET_PORT; // telnet server port

        // internal buffer
        this._buffer = Buffer.alloc(0);
        this._id = 0;
        this._cmd = 0;
        this._length = 0;

        // handle callback - call a callback function only once, for the first event
        // it will triger
        const handleCallback = function(had_error) {
            if (self.callback) {
                self.callback(had_error);
                self.callback = null;
            }
        };

        if(options.socket) {
            if(options.socket instanceof net.Socket) {
                this._externalSocket = options.socket;
                this.openFlag = this._externalSocket.readyState === "opening" || this._externalSocket.readyState === "open";
            } else {
                throw new Error("invalid socket provided");
            }
        }

        // create a socket
        this._client = this._externalSocket || new net.Socket();
        if (options.timeout) this._client.setTimeout(options.timeout);

        // register the port data event
        this._client.on("data", function onData(data) {
            // add data to buffer
            self._buffer = Buffer.concat([self._buffer, data]);

            // check if buffer include a complete modbus answer
            const expectedLength = self._length;
            const bufferLength = self._buffer.length;
            modbusSerialDebug$8(
                "on data expected length:" +
                    expectedLength +
                    " buffer length:" +
                    bufferLength
            );

            modbusSerialDebug$8({
                action: "receive tcp telnet port",
                data: data,
                buffer: self._buffer
            });
            modbusSerialDebug$8(
                JSON.stringify({
                    action: "receive tcp telnet port strings",
                    data: data,
                    buffer: self._buffer
                })
            );

            // check data length
            if (expectedLength < 6 || bufferLength < EXCEPTION_LENGTH$1) return;

            // loop and check length-sized buffer chunks
            const maxOffset = bufferLength - EXCEPTION_LENGTH$1;
            for (let i = 0; i <= maxOffset; i++) {
                const unitId = self._buffer[i];
                const functionCode = self._buffer[i + 1];

                if (unitId !== self._id) continue;

                if (
                    functionCode === self._cmd &&
                    i + expectedLength <= bufferLength
                ) {
                    self._emitData(i, expectedLength);
                    return;
                }
                if (
                    functionCode === (0x80 | self._cmd) &&
                    i + EXCEPTION_LENGTH$1 <= bufferLength
                ) {
                    self._emitData(i, EXCEPTION_LENGTH$1);
                    return;
                }

                // frame header matches, but still missing bytes pending
                if (functionCode === (0x7f & self._cmd)) break;
            }
        });

        this._client.on("connect", function() {
            self.openFlag = true;
            handleCallback();
        });

        this._client.on("close", function(had_error) {
            self.openFlag = false;
            handleCallback(had_error);
            self.emit("close");
        });

        this._client.on("error", function(had_error) {
            self.openFlag = false;
            handleCallback(had_error);
        });

        this._client.on("timeout", function() {
            // modbus.openFlag is left in its current state as it reflects two types of timeouts,
            // i.e. 'false' for "TCP connection timeout" and 'true' for "Modbus response timeout"
            // (this allows to continue Modbus request re-tries without reconnecting TCP).
            modbusSerialDebug$8("TelnetPort port: TimedOut");
            handleCallback(new Error("TelnetPort Connection Timed Out."));
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this.openFlag;
    }

    /**
     * Emit the received response, cut the buffer and reset the internal vars.
     *
     * @param {number} start the start index of the response within the buffer
     * @param {number} length the length of the response
     * @private
     */
    _emitData(start, length) {
        this.emit("data", this._buffer.slice(start, start + length));
        this._buffer = this._buffer.slice(start + length);

        // reset internal vars
        this._id = 0;
        this._cmd = 0;
        this._length = 0;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        if(this._externalSocket === null) {
            this.callback = callback;
            this._client.connect(this.port, this.ip);
        } else if(this.openFlag) {
            modbusSerialDebug$8("telnet port: external socket is opened");
            callback(); // go ahead to setup existing socket
        } else {
            callback(new Error("telnet port: external socket is not opened"));
        }
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this.callback = callback;
        this._client.end();
        this.removeAllListeners();
    }

    /**
     * Simulate successful destroy port.
     *
     * @param callback
     */
    destroy(callback) {
        this.callback = callback;
        if (!this._client.destroyed) {
            this._client.destroy();
        }
    }

    /**
     * Send data to a modbus slave via telnet server.
     *
     * @param {Buffer} data
     */
    write(data) {
        if (data.length < MIN_DATA_LENGTH$5) {
            modbusSerialDebug$8(
                "expected length of data is to small - minimum is " +
                    MIN_DATA_LENGTH$5
            );
            return;
        }

        let length = null;

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // calculate expected answer length
        switch (this._cmd) {
            case 1:
            case 2:
                length = data.readUInt16BE(4);
                this._length = 3 + parseInt((length - 1) / 8 + 1) + 2;
                break;
            case 3:
            case 4:
                length = data.readUInt16BE(4);
                this._length = 3 + 2 * length + 2;
                break;
            case 5:
            case 6:
            case 15:
            case 16:
                this._length = 6 + 2;
                break;
            default:
                // raise and error ?
                this._length = 0;
                break;
        }

        // send buffer to slave
        this._client.write(data);

        modbusSerialDebug$8({
            action: "send tcp telnet port",
            data: data,
            unitid: this._id,
            functionCode: this._cmd
        });

        modbusSerialDebug$8(
            JSON.stringify({
                action: "send tcp telnet port strings",
                data: data,
                unitid: this._id,
                functionCode: this._cmd
            })
        );
    }
}

/**
 * Telnet port for Modbus.
 *
 * @type {TelnetPort}
 */
var telnetport = TelnetPort;

const EventEmitter$7 = events.EventEmitter || events;

const modbusSerialDebug$7 = src("modbus-serial");



/* TODO: const should be set once, maybe */
const MIN_DATA_LENGTH$4 = 6;

const C701_PORT = 0x7002;

/**
 * Check if a buffer chunk can be a Modbus answer or modbus exception.
 *
 * @param {UdpPort} modbus
 * @param {Buffer} buf the buffer to check.
 * @return {boolean} if the buffer can be an answer
 * @private
 */
function _checkData$1(modbus, buf) {
    // check buffer size
    if (buf.length !== modbus._length && buf.length !== 5) return false;

    // calculate crc16
    const crcIn = buf.readUInt16LE(buf.length - 2);

    // check buffer unit-id, command and crc
    return (buf[0] === modbus._id &&
        (0x7f & buf[1]) === modbus._cmd &&
        crcIn === crc16(buf.slice(0, -2)));
}

class UdpPort extends EventEmitter$7 {
    /**
     * Simulate a modbus-RTU port using C701 UDP-to-Serial bridge.
     *
     * @param ip
     * @param options
     * @constructor
     */
    constructor(ip, options) {
        super();

        const modbus = this;
        this.ip = ip;
        this.openFlag = false;

        // options
        if (typeof(options) === "undefined") options = {};
        this.port = options.port || C701_PORT; // C701 port

        // create a socket
        this._client = dgram.createSocket("udp4");

        // wait for answer
        this._client.on("message", function(data) {
            let buffer = null;

            // check expected length
            if (modbus.length < 6) return;

            // check message length
            if (data.length < (116 + 5)) return;

            // check the C701 packet magic
            if (data.readUInt16LE(2) !== 602) return;

            // check for modbus valid answer
            // get the serial data from the C701 packet
            buffer = data.slice(data.length - modbus._length);

            modbusSerialDebug$7({ action: "receive c701 upd port", data: data, buffer: buffer });
            modbusSerialDebug$7(JSON.stringify({ action: "receive c701 upd port strings", data: data, buffer: buffer }));

            // check the serial data
            if (_checkData$1(modbus, buffer)) {
                modbusSerialDebug$7({ action: "emit data serial rtu buffered port", buffer: buffer });
                modbusSerialDebug$7(JSON.stringify({ action: "emit data serial rtu buffered port strings", buffer: buffer }));

                modbus.emit("data", buffer);
            } else {
                // check for modbus exception
                // get the serial data from the C701 packet
                buffer = data.slice(data.length - 5);

                // check the serial data
                if (_checkData$1(modbus, buffer)) {
                    modbusSerialDebug$7({ action: "emit data serial rtu buffered port", buffer: buffer });
                    modbusSerialDebug$7(JSON.stringify({
                        action: "emit data serial rtu buffered port strings",
                        buffer: buffer
                    }));

                    modbus.emit("data", buffer);
                }
            }
        });

        this._client.on("listening", function() {
            modbus.openFlag = true;
        });

        this._client.on("close", function() {
            modbus.openFlag = false;
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this.openFlag;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    // eslint-disable-next-line class-methods-use-this
    open(callback) {
        if (callback)
            callback(null);
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this._client.close();
        if (callback)
            callback(null);
    }

    /**
     * Send data to a modbus-tcp slave.
     *
     * @param data
     */
    write(data) {
        if(data.length < MIN_DATA_LENGTH$4) {
            modbusSerialDebug$7("expected length of data is to small - minimum is " + MIN_DATA_LENGTH$4);
            return;
        }

        let length = null;

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // calculate expected answer length
        switch (this._cmd) {
            case 1:
            case 2:
                length = data.readUInt16BE(4);
                this._length = 3 + parseInt((length - 1) / 8 + 1) + 2;
                break;
            case 3:
            case 4:
                length = data.readUInt16BE(4);
                this._length = 3 + 2 * length + 2;
                break;
            case 5:
            case 6:
            case 15:
            case 16:
                this._length = 6 + 2;
                break;
            default:
                // raise and error ?
                this._length = 0;
                break;
        }

        // build C701 header
        const buffer = Buffer.alloc(data.length + 116);
        buffer.fill(0);
        buffer.writeUInt16LE(600, 2);           // C701 magic for serial bridge
        buffer.writeUInt16LE(0, 36);            // C701 RS485 connector (0..2)
        buffer.writeUInt16LE(this._length, 38); // expected serial answer length
        buffer.writeUInt16LE(1, 102);           // C7011 RS481 hub (1..2)
        buffer.writeUInt16LE(data.length, 104); // serial data length

        // add serial line data
        data.copy(buffer, 116);

        // send buffer to C701 UDP to serial bridge
        this._client.send(buffer, 0, buffer.length, this.port, this.ip);

        modbusSerialDebug$7({
            action: "send c701 upd port",
            data: data,
            buffer: buffer,
            unitid: this._id,
            functionCode: this._cmd
        });

        modbusSerialDebug$7(JSON.stringify({
            action: "send c701 upd port strings",
            data: data,
            buffer: buffer,
            unitid: this._id,
            functionCode: this._cmd
        }));
    }
}

/**
 * UDP port for Modbus.
 *
 * @type {UdpPort}
 */
var c701port = UdpPort;

const EventEmitter$6 = events.EventEmitter || events;

const modbusSerialDebug$6 = src("modbus-serial");



/* TODO: const should be set once, maybe */
const MODBUS_PORT$1 = 502; // modbus port
const MAX_TRANSACTIONS = 256; // maximum transaction to wait for
const MIN_DATA_LENGTH$3 = 6;
const MIN_MBAP_LENGTH = 6;
const CRC_LENGTH$1 = 2;

class ModbusUdpPort extends EventEmitter$6 {
    /**
     * Simulate a modbus-RTU port using modbus-udp.
     *
     * @param ip
     * @param options
     * @constructor
     */
    constructor(ip, options) {
        super();

        const modbus = this;
        this.ip = ip;
        this.openFlag = false;
        this._transactionIdWrite = 1;
        this.port = options.port || MODBUS_PORT$1;

        // options
        if (typeof(options) === "undefined") options = {};

        // create a socket
        this._client = dgram.createSocket("udp4");

        // Bind to the same port as we're sending to
        this._client.bind();

        // wait for answer
        const self = this;
        this._client.on("message", function(data, rinfo) {
            let buffer;
            let crc;
            let length;

            // Filter stuff not intended for us
            if(rinfo.address !== self.ip || rinfo.port !== self.port)
            {
                return;
            }

            // data received
            modbusSerialDebug$6({ action: "receive udp port strings", data: data });

            // check data length
            while (data.length > MIN_MBAP_LENGTH) {
                // parse udp header length
                length = data.readUInt16BE(4);

                // cut 6 bytes of mbap and copy pdu
                buffer = Buffer.alloc(length + CRC_LENGTH$1);
                data.copy(buffer, 0, MIN_MBAP_LENGTH);

                // add crc to message
                crc = crc16(buffer.slice(0, -CRC_LENGTH$1));
                buffer.writeUInt16LE(crc, buffer.length - CRC_LENGTH$1);

                // update transaction id and emit data
                modbus._transactionIdRead = data.readUInt16BE(0);
                modbus.emit("data", buffer);

                // debug
                modbusSerialDebug$6({ action: "parsed udp port", buffer: buffer, transactionId: modbus._transactionIdRead });

                // reset data
                data = data.slice(length + MIN_MBAP_LENGTH);
            }
        });

        this._client.on("listening", function() {
            modbus.openFlag = true;
        });

        this._client.on("close", function() {
            modbus.openFlag = false;
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this.openFlag;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    // eslint-disable-next-line class-methods-use-this
    open(callback) {
        if (callback)
            callback(null);
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this._client.close();
        if (callback)
            callback(null);
    }

    /**
     * Send data to a modbus-udp slave.
     *
     * @param data
     */
    write(data) {
        if(data.length < MIN_DATA_LENGTH$3) {
            modbusSerialDebug$6("expected length of data is too small - minimum is " + MIN_DATA_LENGTH$3);
            return;
        }

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // remove crc and add mbap
        const buffer = Buffer.alloc(data.length + MIN_MBAP_LENGTH - CRC_LENGTH$1);
        buffer.writeUInt16BE(this._transactionIdWrite, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(data.length - CRC_LENGTH$1, 4);
        data.copy(buffer, MIN_MBAP_LENGTH);


        modbusSerialDebug$6({
            action: "send modbus udp port",
            data: data,
            buffer: buffer,
            unitid: this._id,
            functionCode: this._cmd
        });

        // send buffer via udp
        this._client.send(buffer, 0, buffer.length, this.port, this.ip);

        // set next transaction id
        this._transactionIdWrite = (this._transactionIdWrite + 1) % MAX_TRANSACTIONS;

    }
}

/**
 * UDP port for Modbus.
 *
 * @type {ModbusUdpPort}
 */
var udpport = ModbusUdpPort;

const EventEmitter$5 = events.EventEmitter || events;
const SerialPort$2 = dist.SerialPort;
const modbusSerialDebug$5 = src("modbus-serial");

/* TODO: const should be set once, maybe */
const EXCEPTION_LENGTH = 5;
const MIN_DATA_LENGTH$2 = 6;
const MIN_WRITE_DATA_LENGTH = 4;
const MAX_BUFFER_LENGTH = 256;
const CRC_LENGTH = 2;
const READ_DEVICE_IDENTIFICATION_FUNCTION_CODE = 43;
const REPORT_SERVER_ID_FUNCTION_CODE = 17;
const LENGTH_UNKNOWN = "unknown";
const BITS_TO_NUM_OF_OBJECTS = 7;

// Helper function -> Bool
// BIT | TYPE
// 8 | OBJECTID
// 9 | length of OBJECTID
// 10 -> n | the object
// 10 + n + 1 | new object id
const calculateFC43Length = function(buffer, numObjects, i, bufferLength) {
    const result = { hasAllData: true };
    let currentByte = 8 + i; // current byte starts at object id.
    if (numObjects > 0) {
        for (let j = 0; j < numObjects; j++) {
            if (bufferLength < currentByte) {
                result.hasAllData = false;
                break;
            }
            const objLength = buffer[currentByte + 1];
            if (!objLength) {
                result.hasAllData = false;
                break;
            }
            currentByte += 2 + objLength;
        }
    }
    if (currentByte + CRC_LENGTH > bufferLength) {
        // still waiting on the CRC!
        result.hasAllData = false;
    }
    if (result.hasAllData) {
        result.bufLength = currentByte + CRC_LENGTH;
    }
    return result;
};

class RTUBufferedPort extends EventEmitter$5 {
    /**
     * Simulate a modbus-RTU port using buffered serial connection.
     *
     * @param path
     * @param options
     * @constructor
     */
    constructor(path, options) {
        super();

        const self = this;

        // options
        if (typeof(options) === "undefined") options = {};

        // disable auto open, as we handle the open
        options.autoOpen = false;

        // internal buffer
        this._buffer = Buffer.alloc(0);
        this._id = 0;
        this._cmd = 0;
        this._length = 0;

        // create the SerialPort
        this._client = new SerialPort$2(Object.assign({}, { path }, options));

        // attach an error listner on the SerialPort object
        this._client.on("error", function(error) {
            self.emit("error", error);
        });

        // register the port data event
        this._client.on("data", function onData(data) {
            // add data to buffer
            self._buffer = Buffer.concat([self._buffer, data]);

            modbusSerialDebug$5({ action: "receive serial rtu buffered port", data: data, buffer: self._buffer });

            // check if buffer include a complete modbus answer
            const expectedLength = self._length;
            let bufferLength = self._buffer.length;


            // check data length
            if (expectedLength !== LENGTH_UNKNOWN &&
                expectedLength < MIN_DATA_LENGTH$2 ||
                bufferLength < EXCEPTION_LENGTH
            ) { return; }

            // check buffer size for MAX_BUFFER_SIZE
            if (bufferLength > MAX_BUFFER_LENGTH) {
                self._buffer = self._buffer.slice(-MAX_BUFFER_LENGTH);
                bufferLength = MAX_BUFFER_LENGTH;
            }

            // loop and check length-sized buffer chunks
            const maxOffset = bufferLength - EXCEPTION_LENGTH;

            for (let i = 0; i <= maxOffset; i++) {
                const unitId = self._buffer[i];
                const functionCode = self._buffer[i + 1];

                if (unitId !== self._id) continue;

                if (functionCode === self._cmd && functionCode === READ_DEVICE_IDENTIFICATION_FUNCTION_CODE) {
                    if (bufferLength <= BITS_TO_NUM_OF_OBJECTS + i) {
                        return;
                    }
                    const numObjects = self._buffer[7 + i];
                    const result = calculateFC43Length(self._buffer, numObjects, i, bufferLength);
                    if (result.hasAllData) {
                        self._emitData(i, result.bufLength);
                        return;
                    }
                } else if (functionCode === self._cmd && functionCode === REPORT_SERVER_ID_FUNCTION_CODE) {
                    const contentLength = self._buffer[i + 2];
                    self._emitData(i, contentLength + 5); // length + serverID + status + contentLength + CRC
                    return;
                } else {
                    if (functionCode === self._cmd && i + expectedLength <= bufferLength) {
                        self._emitData(i, expectedLength);
                        return;
                    }
                    if (functionCode === (0x80 | self._cmd) && i + EXCEPTION_LENGTH <= bufferLength) {
                        self._emitData(i, EXCEPTION_LENGTH);
                        return;
                    }
                }

                // frame header matches, but still missing bytes pending
                if (functionCode === (0x7f & self._cmd)) break;
            }
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this._client.isOpen;
    }

    /**
     * Emit the received response, cut the buffer and reset the internal vars.
     *
     * @param {number} start The start index of the response within the buffer.
     * @param {number} length The length of the response.
     * @private
     */
    _emitData(start, length) {
        const buffer = this._buffer.slice(start, start + length);
        modbusSerialDebug$5({ action: "emit data serial rtu buffered port", buffer: buffer });
        this.emit("data", buffer);
        this._buffer = this._buffer.slice(start + length);
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        this._client.open(callback);
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this._client.close(callback);
        this.removeAllListeners("data");
    }

    /**
     * Send data to a modbus slave.
     *
     * @param {Buffer} data
     */
    write(data) {
        if(data.length < MIN_WRITE_DATA_LENGTH) {
            modbusSerialDebug$5("expected length of data is to small - minimum is " + MIN_WRITE_DATA_LENGTH);
            return;
        }

        let length = null;

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // calculate expected answer length
        switch (this._cmd) {
            case 1:
            case 2:
                length = data.readUInt16BE(4);
                this._length = 3 + parseInt((length - 1) / 8 + 1) + 2;
                break;
            case 3:
            case 4:
                length = data.readUInt16BE(4);
                this._length = 3 + 2 * length + 2;
                break;
            case 5:
            case 6:
            case 15:
            case 16:
                this._length = 6 + 2;
                break;
            case 17:
                // response is device specific
                this._length = LENGTH_UNKNOWN;
                break;
            case 43:
                // this function is super special
                // you know the format of the code response
                // and you need to continuously check that all of the data has arrived before emitting
                // see onData for more info.
                this._length = LENGTH_UNKNOWN;
                break;
            default:
                // raise and error ?
                this._length = 0;
                break;
        }

        // send buffer to slave
        this._client.write(data);

        modbusSerialDebug$5({
            action: "send serial rtu buffered",
            data: data,
            unitid: this._id,
            functionCode: this._cmd,
            length: this._length
        });
    }
}

/**
 * RTU buffered port for Modbus.
 *
 * @type {RTUBufferedPort}
 */
var rtubufferedport = RTUBufferedPort;

/**
 * Calculates the buffers LRC.
 *
 * @param {Buffer} buffer the data buffer.
 * @return {number} the calculated LRC.
 */
var lrc = function lrc(buffer) {
    let lrc = 0;
    for (let i = 0; i < buffer.length; i++) {
        lrc += buffer[i] & 0xFF;
    }

    return ((lrc ^ 0xFF) + 1) & 0xFF;
};

/* eslint-disable no-ternary */


const EventEmitter$4 = events.EventEmitter || events;
const SerialPort$1 = dist.SerialPort;
const modbusSerialDebug$4 = src("modbus-serial");




/* TODO: const should be set once, maybe */
const MIN_DATA_LENGTH$1 = 6;

/**
 * Ascii encode a 'request' buffer and return it. This includes removing
 * the CRC bytes and replacing them with an LRC.
 *
 * @param {Buffer} buf the data buffer to encode.
 * @return {Buffer} the ascii encoded buffer
 * @private
 */
function _asciiEncodeRequestBuffer(buf) {

    // replace the 2 byte crc16 with a single byte lrc
    buf.writeUInt8(lrc(buf.slice(0, -2)), buf.length - 2);

    // create a new buffer of the correct size
    const bufAscii = Buffer.alloc(buf.length * 2 + 1); // 1 byte start delimit + x2 data as ascii encoded + 2 lrc + 2 end delimit

    // create the ascii payload

    // start with the single start delimiter
    bufAscii.write(":", 0);
    // encode the data, with the new single byte lrc
    bufAscii.write(buf.toString("hex", 0, buf.length - 1).toUpperCase(), 1);
    // end with the two end delimiters
    bufAscii.write("\r", bufAscii.length - 2);
    bufAscii.write("\n", bufAscii.length - 1);

    return bufAscii;
}

/**
 * Ascii decode a 'response' buffer and return it.
 *
 * @param {Buffer} bufAscii the ascii data buffer to decode.
 * @return {Buffer} the decoded buffer, or null if decode error
 * @private
 */
function _asciiDecodeResponseBuffer(bufAscii) {

    // create a new buffer of the correct size (based on ascii encoded buffer length)
    const bufDecoded = Buffer.alloc((bufAscii.length - 1) / 2);

    // decode into new buffer (removing delimiters at start and end)
    for (let i = 0; i < (bufAscii.length - 3) / 2; i++) {
        bufDecoded.write(String.fromCharCode(bufAscii.readUInt8(i * 2 + 1), bufAscii.readUInt8(i * 2 + 2)), i, 1, "hex");
    }

    // check the lrc is true
    const lrcIn = bufDecoded.readUInt8(bufDecoded.length - 2);
    if(lrc(bufDecoded.slice(0, -2)) !== lrcIn) {
        // return null if lrc error
        const calcLrc = lrc(bufDecoded.slice(0, -2));

        modbusSerialDebug$4({ action: "LRC error", LRC: lrcIn.toString(16), calcLRC: calcLrc.toString(16) });
        return null;
    }

    // replace the 1 byte lrc with a two byte crc16
    bufDecoded.writeUInt16LE(crc16(bufDecoded.slice(0, -2)), bufDecoded.length - 2);

    return bufDecoded;
}

/**
 * check if a buffer chunk can be a modbus answer
 * or modbus exception
 *
 * @param {AsciiPort} modbus
 * @param {Buffer} buf the buffer to check.
 * @return {boolean} if the buffer can be an answer
 * @private
 */
function _checkData(modbus, buf) {
    // check buffer size
    if (buf.length !== modbus._length && buf.length !== 5) {
        modbusSerialDebug$4({ action: "length error", recive: buf.length, expected: modbus._length });

        return false;
    }

    // check buffer unit-id and command
    return (buf[0] === modbus._id &&
        (0x7f & buf[1]) === modbus._cmd);
}

class AsciiPort extends EventEmitter$4 {
    /**
     * Simulate a modbus-ascii port using serial connection.
     *
     * @param path
     * @param options
     * @constructor
     */
    constructor(path, options) {
        super();

        const modbus = this;

        // options
        options = options || {};

        // select char for start of slave frame (usually :)
        this._startOfSlaveFrameChar =
            (options.startOfSlaveFrameChar === undefined)
                ? 0x3A
                : options.startOfSlaveFrameChar;

        // disable auto open, as we handle the open
        options.autoOpen = false;

        // internal buffer
        this._buffer = Buffer.from("");
        this._id = 0;
        this._cmd = 0;
        this._length = 0;

        // create the SerialPort
        this._client = new SerialPort$1(Object.assign({}, { path }, options));

        // register the port data event
        this._client.on("data", function(data) {

            // add new data to buffer
            modbus._buffer = Buffer.concat([modbus._buffer, data]);

            modbusSerialDebug$4({ action: "receive serial ascii port", data: data, buffer: modbus._buffer });
            modbusSerialDebug$4(JSON.stringify({ action: "receive serial ascii port strings", data: data, buffer: modbus._buffer }));

            // check buffer for start delimiter
            const sdIndex = modbus._buffer.indexOf(modbus._startOfSlaveFrameChar);
            if(sdIndex === -1) {
                // if not there, reset the buffer and return
                modbus._buffer = Buffer.from("");
                return;
            }
            // if there is data before the start delimiter, remove it
            if(sdIndex > 0) {
                modbus._buffer = modbus._buffer.slice(sdIndex);
            }
            // do we have the complete message (i.e. are the end delimiters there)
            if(modbus._buffer.includes("\r\n", 1, "ascii") === true) {
                // check there is no excess data after end delimiters
                const edIndex = modbus._buffer.indexOf(0x0A); // ascii for '\n'
                if(edIndex !== modbus._buffer.length - 1) {
                    // if there is, remove it
                    modbus._buffer = modbus._buffer.slice(0, edIndex + 1);
                }

                // we have what looks like a complete ascii encoded response message, so decode
                const _data = _asciiDecodeResponseBuffer(modbus._buffer);
                modbusSerialDebug$4({ action: "got EOM", data: _data, buffer: modbus._buffer });
                if(_data !== null) {

                    // check if this is the data we are waiting for
                    if (_checkData(modbus, _data)) {
                        modbusSerialDebug$4({ action: "emit data serial ascii port", data: data, buffer: modbus._buffer });
                        modbusSerialDebug$4(JSON.stringify({ action: "emit data serial ascii port strings", data: data, buffer: modbus._buffer }));
                        // emit a data signal
                        modbus.emit("data", _data);
                    }
                }
                // reset the buffer now its been used
                modbus._buffer = Buffer.from("");
            }
        });
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return this._client.isOpen;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        this._client.open(callback);
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        this._client.close(callback);
        this.removeAllListeners();
    }

    /**
     * Send data to a modbus slave.
     *
     * @param data
     */
    write(data) {
        if(data.length < MIN_DATA_LENGTH$1) {
            modbusSerialDebug$4("expected length of data is to small - minimum is " + MIN_DATA_LENGTH$1);
            return;
        }

        let length = null;

        // remember current unit and command
        this._id = data[0];
        this._cmd = data[1];

        // calculate expected answer length (this is checked after ascii decoding)
        switch (this._cmd) {
            case 1:
            case 2:
                length = data.readUInt16BE(4);
                this._length = 3 + parseInt((length - 1) / 8 + 1) + 2;
                break;
            case 3:
            case 4:
                length = data.readUInt16BE(4);
                this._length = 3 + 2 * length + 2;
                break;
            case 5:
            case 6:
            case 15:
            case 16:
                this._length = 6 + 2;
                break;
            default:
                // raise and error ?
                modbusSerialDebug$4({ action: "unknown command", id: this._id.toString(16), command: this._cmd.toString(16) });
                this._length = 0;
                break;
        }

        // ascii encode buffer
        const _encodedData = _asciiEncodeRequestBuffer(data);

        // send buffer to slave
        this._client.write(_encodedData);

        modbusSerialDebug$4({
            action: "send serial ascii port",
            data: _encodedData,
            unitid: this._id,
            functionCode: this._cmd
        });

        modbusSerialDebug$4(JSON.stringify({
            action: "send serial ascii port",
            data: _encodedData,
            unitid: this._id,
            functionCode: this._cmd
        }));
    }
}

/**
 * ASCII port for Modbus.
 *
 * @type {AsciiPort}
 */
var asciiport = AsciiPort;

/* globals navigator */

const { EventEmitter: EventEmitter$3 } = events;
const debug = src("modbus-serial");

/**
 * Bluetooth Low Energy port for Modbus.
 */
class BlePort extends EventEmitter$3 {
    constructor(options) {
        super();

        if (typeof(options) === "undefined") options = {};

        this._bluetooth = options.bluetooth || navigator.bluetooth;
        this._txServiceUuid = options.txService;
        this._txCharacteristicUuid = options.txCharacteristic;
        this._rxServiceUuid = options.rxService;
        this._rxCharacteristicUuid = options.rxCharacteristic;

        this._boundHandleDisconnection = this._handleDisconnection.bind(this);
        this._boundHandleCharacteristicValueChanged = this._handleCharacteristicValueChanged.bind(this);
    }

    get isOpen() {
        return Boolean(this._device) && this._device.gatt.connected;
    }

    async open(callback) {
        let error;
        try {
            const options = {
                filters: [{ services: [this._txServiceUuid] }],
                optionalServices: [this._txServiceUuid, this._rxServiceUuid]
            };
            debug({ action: "requesting BLE device", options });
            this._device = await this._bluetooth.requestDevice(options);
            debug({ action: "BLE device connected", name: this._device.name, id: this._device.id });

            this._device.addEventListener("gattserverdisconnected", this._boundHandleDisconnection);

            debug({ action: "Connecting to GATT server" });
            this._server = await this._device.gatt.connect();
            debug({ action: "GATT server connected" });

            debug({ action: "Getting TX service", uuid: this._txServiceUuid });
            this._txService = await this._server.getPrimaryService(this._txServiceUuid);
            debug({ action: "TX service found" });

            debug({ action: "Getting TX characteristic", uuid: this._txCharacteristicUuid });
            this._txCharacteristic = await this._txService.getCharacteristic(this._txCharacteristicUuid);
            debug({ action: "TX characteristic found" });

            debug({ action: "Getting RX service", uuid: this._rxServiceUuid });
            this._rxService = await this._server.getPrimaryService(this._rxServiceUuid);
            debug({ action: "RX service found" });

            debug({ action: "Getting RX characteristic", uuid: this._rxCharacteristicUuid });
            this._rxCharacteristic = await this._rxService.getCharacteristic(this._rxCharacteristicUuid);
            debug({ action: "RX characteristic found" });

            debug({ action: "Starting RX notifications" });
            await this._rxCharacteristic.startNotifications();
            debug({ action: "RX notifications started" });

            this._rxCharacteristic.addEventListener("characteristicvaluechanged", this._boundHandleCharacteristicValueChanged);
        } catch (_error) {
            error = _error;
        }

        if (callback) {
            callback(error);
        }
    }

    async close(callback) {
        let error;
        try {
            if (this._rxCharacteristic) {
                debug({ action: "Stopping RX notifications" });
                await this._rxCharacteristic.stopNotifications();
                debug({ action: "RX notifications stopped" });

                this._rxCharacteristic.removeEventListener("characteristicvaluechanged", this._boundHandleCharacteristicValueChanged);
            }

            if (this._device) {
                debug({ action: "Disconnecting from GATT server" });

                this._device.removeEventListener("gattserverdisconnected", this._boundHandleDisconnection);

                if (this._device.gatt.connected) {
                    this._device.gatt.disconnect();
                    debug({ action: "GATT server disconnected" });
                } else {
                    debug({ action: "GATT server is already disconnected" });
                }
            }
        } catch (_error) {
            error = _error;
        }

        if (callback) {
            callback(error);
        }
    }

    /**
     * Writes raw data to the TX characteristic.
     * @param {Buffer} data
     * @returns {Promise}
     */
    async write(data) {
        debug({ action: "Writing to TX characteristic", data });
        await this._txCharacteristic.writeValue(BlePort._bufferToArrayBuffer(data));
    }

    _handleDisconnection() {
        debug({ action: "GATT server disconnected" });
        this.emit("close");
    }

    /**
     * Handles a received GATT value change event.
     * @param event
     * @private
     */
    _handleCharacteristicValueChanged(event) {
        const dataView = event.target.value;
        const buffer = Buffer.from(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        debug({ action: "RX characteristic changed", buffer });
        this.emit("data", buffer);
    }

    /**
     * Converts a Node.js `Buffer` to an `ArrayBuffer`.
     * @param {Buffer} buffer
     * @returns {ArrayBuffer}
     * @private
     */
    static _bufferToArrayBuffer(buffer) {
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
}

var bleport = BlePort;

/**
 * Copyright (c) 2015, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

const MIN_MODBUSRTU_FRAMESZ = 5;

/**
 * Adds connection shorthand API to a Modbus objext
 *
 * @param {ModbusRTU} Modbus the ModbusRTU object.
 */
const addConnctionAPI = function(Modbus) {
    const cl = Modbus.prototype;

    const open = function(obj, next) {
        /* the function check for a callback
         * if we have a callback, use it
         * o/w build a promise.
         */
        if (next) {
            // if we have a callback, use the callback
            obj.open(next);
        } else {
            // o/w use  a promise
            return new Promise(function(resolve, reject) {
                function cb(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }

                obj.open(cb);
            });
        }
    };

    /**
     * Connect to a communication port, using SerialPort.
     *
     * @param {string} path the path to the Serial Port - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectRTU = function(path, options, next) {
        if (options) {
            this._enron = options.enron;
            this._enronTables = options.enronTables;
        }

        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // disable auto open, as we handle the open
        options.autoOpen = false;
        // set vmin to smallest modbus packet size
        options.platformOptions = { vmin: MIN_MODBUSRTU_FRAMESZ, vtime: 0 };

        // create the SerialPort
        const SerialPort = dist.SerialPort;
        this._port = new SerialPort(Object.assign({}, { path }, options));

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using TcpPort.
     *
     * @param {string} ip the ip of the TCP Port - required.
     * @param {Object} options - the TCP port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectTCP = function(ip, options, next) {
        if (options) {
            this._enron = options.enron;
            this._enronTables = options.enronTables;
        }

        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the TcpPort
        const TcpPort = tcpport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TcpPort(ip, options);

        // open and call next
        return open(this, next);
    };

    /**
     * Setup a communication port with existing socket, using TcpPort.
     *
     * @param {string} socket the instance of the net.Socket - required.
     * @param {Object} options - the TCP port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.linkTCP = function(socket, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        options.socket = socket;

        // create the TcpPort
        const TcpPort = tcpport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TcpPort(options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using TcpRTUBufferedPort.
     *
     * @param {string} ip the ip of the TCP Port - required.
     * @param {Object} options - the serial tcp port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectTcpRTUBuffered = function(ip, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        const TcpRTUBufferedPort = tcprtubufferedport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TcpRTUBufferedPort(ip, options);

        // open and call next
        return open(this, next);
    };
    cl.linkTcpRTUBuffered = function(socket, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        options.socket = socket;

        // create the TcpPort
        const TcpRTUBufferedPort = tcprtubufferedport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TcpRTUBufferedPort(options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using TelnetPort.
     *
     * @param {string} ip the ip of the TelnetPort - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectTelnet = function(ip, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the TcpPort
        const TelnetPort = telnetport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TelnetPort(ip, options);

        // open and call next
        return open(this, next);
    };
    cl.linkTelnet = function(socket, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        options.socket = socket;

        // create the TcpPort
        const TelnetPort = telnetport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new TelnetPort(options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using C701 UDP-to-Serial bridge.
     *
     * @param {string} ip the ip of the TelnetPort - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectC701 = function(ip, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the TcpPort
        const C701Port = c701port;
        this._port = new C701Port(ip, options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using modbus-udp.
     *
     * @param {string} ip the ip of the UDP Port - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectUDP = function(ip, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the UdpPort
        const UdpPort = udpport;
        this._port = new UdpPort(ip, options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using Bufferd Serial port.
     *
     * @param {string} path the path to the Serial Port - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectRTUBuffered = function(path, options, next) {
        if (options) {
            this._enron = options.enron;
            this._enronTables = options.enronTables;
        }

        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the SerialPort
        const SerialPort = rtubufferedport;
        this._port = new SerialPort(path, options);

        // set vmin to smallest modbus packet size
        options.platformOptions = { vmin: MIN_MODBUSRTU_FRAMESZ, vtime: 0 };

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to a communication port, using ASCII Serial port.
     *
     * @param {string} path the path to the Serial Port - required.
     * @param {Object} options - the serial port options - optional.
     * @param {Function} next the function to call next.
     */
    cl.connectAsciiSerial = function(path, options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the ASCII SerialPort
        const SerialPortAscii = asciiport;
        this._port = new SerialPortAscii(path, options);

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to existing client socket.
     *
     * @param {socket} socket the socket to connect to - required.
     * @param {Function} next the function to call next.
     */
    cl.connectRTUSocket = function(socket, next) {
        const thisModbus = this;
        this._port = socket;
        this._port.open = function(callback) {
            // existing socket is already connected
            thisModbus._port.isOpen = true;
            callback();
        };

        // open and call next
        return open(this, next);
    };

    /**
     * Connect to existing client socket.
     *
     * @param {socket} socket the socket to connect to - required.
     * @param {Function} next the function to call next.
     */
    cl.connectBle = function(options, next) {
        // check if we have options
        if (typeof next === "undefined" && typeof options === "function") {
            next = options;
            options = {};
        }

        // check if we have options
        if (typeof options === "undefined") {
            options = {};
        }

        // create the TcpPort
        const BlePort = bleport;
        if (this._timeout) {
            options.timeout = this._timeout;
        }
        this._port = new BlePort(options);

        // open and call next
        return open(this, next);
    };
};

/**
 * Connection API Modbus.
 *
 * @type {addConnctionAPI}
 */
var connection = addConnctionAPI;

/**
 * Copyright (c) 2015, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

/**
 * Take a modbus serial function and convert it to use promises.
 *
 * @param {Function} f the function to convert
 * @return a function that calls function "f" and return a promise.
 * @private
 */
const _convert = function(f) {
    const converted = function(address, arg, next) {
        const client = this;
        const id = this._unitID;

        /* the function check for a callback
         * if we have a callback, use it
         * o/w build a promise.
         */
        if (next) {
            // if we have a callback, use the callback
            f.bind(client)(id, address, arg, next);
        } else {
            // o/w use  a promise
            const promise = new Promise(function(resolve, reject) {
                function cb(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                }

                f.bind(client)(id, address, arg, cb);
            });

            return promise;
        }
    };

    return converted;
};

/**
 * Adds promise API to a Modbus object.
 *
 * @param {ModbusRTU} Modbus the ModbusRTU object.
 */
const addPromiseAPI = function(Modbus) {

    const cl = Modbus.prototype;

    // set/get unitID
    cl.setID = function(id) {this._unitID = Number(id);};
    cl.getID = function() {return this._unitID;};

    // set/get timeout
    cl.setTimeout = function(timeout) {this._timeout = timeout;};
    cl.getTimeout = function() {return this._timeout;};

    // convert functions to return promises
    cl.readCoils = _convert(cl.writeFC1);
    cl.readDiscreteInputs = _convert(cl.writeFC2);
    cl.readHoldingRegisters = _convert(cl.writeFC3);
    cl.readRegistersEnron = _convert(cl.writeFC3);
    cl.readInputRegisters = _convert(cl.writeFC4);
    cl.writeCoil = _convert(cl.writeFC5);
    cl.writeRegister = _convert(cl.writeFC6);
    cl.writeRegisterEnron = _convert(cl.writeFC6);
    cl.writeCoils = _convert(cl.writeFC15);
    cl.writeRegisters = _convert(cl.writeFC16);
    cl.reportServerID = _convert(cl.writeFC17);
    cl.readFileRecords = _convert(cl.writeFC20);
    cl.readDeviceIdentification = _convert(cl.writeFC43);
};

/**
 * Promise API Modbus library.
 *
 * @type {addPromiseAPI}
 */
var promise = addPromiseAPI;

function getByteLength(type) {
    switch (String(type).toLowerCase()) {
        case "int16":
        case "uint16":
            return 2;
        case "int32":
        case "uint32":
        case "float":
            return 4;
        default:
            throw new Error("Unsupported type");
    }
}

function send({ fc, unit, address, arg }) {

    this._port.setID(unit);

    switch (fc) {
        case 1:  return this._port.readCoils(address, arg);
        case 2:  return this._port.readDiscreteInputs(address, arg);
        case 3:  return this._port.readHoldingRegisters(address, arg);
        case 4:  return this._port.readInputRegisters(address, arg);

        case 5:  return this._port.writeCoil(address, arg);
        case 6:  return this._port.writeRegister(address, arg);
        case 15: return this._port.writeCoils(address, arg);
        case 16: return this._port.writeRegisters(address, arg);
    }

    return Promise.reject(new Error("Unknown fc code"));
}

const Worker = function(port, options) {
    if (typeof(options) === "undefined") options = {};

    this.maxConcurrentRequests = 1;

    this.debug = false;

    this._port = port;

    this._queue = [];

    this._scheduled = [];

    this._running = new Map();

    this._nextId = 0;

    this.setOptions(options);
};

Worker.prototype.setOptions = function({ maxConcurrentRequests, debug }) {
    if(maxConcurrentRequests > 0) {
        this.maxConcurrentRequests = maxConcurrentRequests;
    }

    if(debug !== undefined) {
        this.debug = Boolean(debug);
    }
};
Worker.prototype.log = function(...args) {
    if(this.debug === true) {
        args.unshift(new Date());
        console.log(...args);
    }
};
Worker.prototype.emit = function(name, data) {
    this._port.emit(name, data);
};
Worker.prototype.bufferize = function(data, type) {

    if(Array.isArray(data) === false) {
        data = [data];
    }

    const quantity = data.length;
    const byteLength = getByteLength(type);
    const size = quantity * byteLength;
    const buffer = Buffer.alloc(size);

    for(let i = 0; i < quantity; i++) {
        if(type === "int16") {
            buffer.writeInt16BE(data[i], i * byteLength);
        } else if(type === "uint16") {
            buffer.writeUInt16BE(data[i], i * byteLength);
        } else if(type === "int32") {
            buffer.writeInt32BE(data[i], i * byteLength);
        } else if(type === "uint32") {
            buffer.writeUInt32BE(data[i], i * byteLength);
        } else if(type === "float") {
            buffer.writeFloatBE(data[i], i * byteLength);
        }
    }

    return buffer;
};
Worker.prototype.unbufferize = function(buffer, type) {
    const byteLength = getByteLength(type);
    const quantity = buffer.length / byteLength;
    const data = [];

    for(let i = 0; i < quantity; i++) {
        if(type === "int16") {
            data.push(buffer.readInt16BE(i * byteLength));
        } else if(type === "uint16") {
            data.push(buffer.readUInt16BE(i * byteLength));
        } else if(type === "int32") {
            data.push(buffer.readInt32BE(i * byteLength));
        } else if(type === "uint32") {
            data.push(buffer.readUInt32BE(i * byteLength));
        } else if(type === "float") {
            data.push(buffer.readFloatBE(i * byteLength));
        }
    }

    return data;
};

Worker.prototype.nextId = function() {
    this._nextId = this._nextId + 1;

    if(this._nextId > 9999) {
        this._nextId = 1;
    }

    return this._nextId;
};
Worker.prototype.send = function({ fc, unit, address, value, quantity, arg, type }) {
    const promise = new Promise((resolve, reject) => {

        arg = arg || quantity || value;

        if(fc === 1 || fc === 2) {
            arg = arg || 1;
        }

        if(fc === 3 || fc === 4) {
            type = type || "int16";
            arg = (arg || 1) * getByteLength(type) / 2;
        }

        if(fc === 6 || fc === 16) {
            type = type || "int16";
            arg = this.bufferize(arg, type);
            if(fc === 6 && arg.length > 2) {
                fc = 16;
            }
        }

        if(fc === 5 && arg instanceof Array && arg.length > 1) {
            fc = 15;
        }

        const id = this.nextId();

        this.log("queue push", `#${id}`, fc, unit, address, arg, type);
        this._queue.push({ id, fc, unit, address, arg, type, resolve, reject });
    });

    this.process();

    return promise;
};
Worker.prototype.process = function() {
    if(this._port.isOpen === false) {
        this._queue = [];
        this._scheduled = [];
        this._running = new Map();
        this._nextId = 0;
        return;
    }

    setTimeout(() => this.run(), 1);
};
Worker.prototype.run = function() {
    if(this._running.size >= this.maxConcurrentRequests) {
        return;
    }

    let request = this._queue.shift();

    if(!request) {
        request = this._scheduled.shift();
    }

    if(!request) {
        return; // Well Done
    }

    if(typeof request.checkBeforeQueuing === "function") {
        if(request.checkBeforeQueuing() === false) {
            return this.process(); // Skip current request and go on
        }
    }

    this._running.set(request.id, request);

    this.log("send", JSON.stringify(request));

    this.emit("request", { request });

    send.apply(this, [request])
        .then((response) => {
            let data = [];

            if(request.fc === 1 || request.fc === 2) {
                for(let i = 0; i < request.arg; i++) {
                    data.push(Boolean(response.data[i]));
                }
            } else if(request.fc === 3 || request.fc === 4) {
                data = this.unbufferize(response.buffer, request.type);
            } else if(request.arg instanceof Array) {
                data = request.arg;
            } else if(request.arg instanceof Buffer && request.type) {
                data = this.unbufferize(request.arg, request.type);
            } else {
                data.push(request.arg);
            }

            this._running.delete(request.id);

            this.emit("response", { request, response: data });

            request.resolve(data);

            this.process();
        })
        .catch((error) => {
            this._running.delete(request.id);

            error.request = request;

            this.emit("failed", error);

            request.reject(error);

            this.process();
        });

    this.process();
};

Worker.prototype._poll_send = function(result, { i, fc, unit, address, arg, items, length, type }, { skipErrors }) {
    const promise = new Promise((res, rej) => {
        const id = this.nextId();

        this.log("scheduled push", "poll #" + result.id, "req #" + i, "#" + id, fc, length, type);

        const resolve = function(response) {
            const data = items.map((address, index) => ({ address, value: response[index] }));
            result._req += 1;
            result.done += 1;
            result.data = [...result.data, ...data];
            res(data);
        };

        const reject = function(error) {
            result._req += 1;
            result.error = error;
            rej(error);
        };

        const checkBeforeQueuing = function() {
            return result.error === null || skipErrors === true;
        };

        this._scheduled.push({ id, i, fc, unit, address, arg, items, length, type, result, checkBeforeQueuing, resolve, reject });
    });

    this.process();

    return promise;
};

Worker.prototype.poll = function({ unit, map, onProgress, maxChunkSize, skipErrors, defaultType }) {
    maxChunkSize = maxChunkSize || 32;
    skipErrors = Boolean(skipErrors);
    defaultType = defaultType || "int16";

    if(unit < 1 || unit > 250 || isNaN(unit) || unit === undefined) {
        throw new Error("invalid unit");
    }

    this.log("poll", `unit=${unit}`, "map size=" + Object.keys(map).length, `maxChunkSize=${maxChunkSize}`, `skipErrors=${skipErrors}`);

    const result = {
        id: this.nextId(),
        unit,
        total: 0,
        done: 0,
        data: [],
        error: null,
        dt: Date.now(),
        _req: 0
    };

    const registers = [];
    map.forEach(({ fc, address, type }) => {
        fc = parseInt(fc);

        if(fc === 3 || fc === 4) {
            type = type || defaultType;
        } else if(fc === 1 || fc === 2) {
            type = "bool";
        } else {
            throw new Error("unsupported fc");
        }

        if(address instanceof Array) {
            address.forEach((item) => {
                registers.push({ fc, address: parseInt(item), type: type || null });
            });
        } else {
            address = parseInt(address);
            registers.push({ fc, address, type: type || null });
        }
    });

    registers.sort((a, b) => {
        if(a.fc === b.fc) {
            return a.address - b.address;
        }

        return a.fc - b.fc;
    });

    const requests = registers.reduce(function(chunks, register, i, arr) {
        let chunk = 0;

        if(chunks.length) {
            chunk = chunks.length - 1;
        }

        if(i > 0) {
            const lastRegister = arr[i - 1];

            if(lastRegister.fc !== register.fc) {
                chunk += 1;
            } else if(lastRegister.type !== register.type) {
                chunk += 1;
            } else if([3, 4].indexOf(register.fc) >= 0 && register.address - lastRegister.address !== getByteLength(register.type) / 2) {
                chunk += 1;
            } else if(chunks[chunk].items.length >= maxChunkSize) {
                chunk += 1;
            }
        }

        if(chunks[chunk] === undefined) {
            chunks[chunk] = {
                fc: register.fc,
                items: [],
                length: 0,
                type: register.type
            };
        }

        chunks[chunk].items.push(register.address);

        if ([3, 4].indexOf(register.fc) >= 0) {
            chunks[chunk].length += getByteLength(register.type) / 2;
        } else {
            chunks[chunk].length += 1;
        }

        return chunks;
    }, []);

    result.total = requests.length;

    return new Promise(((resolve) => {
        const check = function() {
            if(result._req === result.total) {
                result.dt = Date.now() - result.dt;
                resolve(result);
            } else if(result.error && skipErrors !== true) {
                result.dt = Date.now() - result.dt;
                resolve(result);
            }
        };

        for(let i = 0; i < requests.length; i++) {
            const { fc, items, length, type } = requests[i];

            this._poll_send(result, { i, unit, fc, address: parseInt(items[0]), items, arg: length, length, type }, {
                skipErrors
            })
                .then((data) => {
                    if(typeof onProgress === "function") {
                        onProgress(result.done / result.total, data);
                    }
                    check();
                })
                .catch(() => check());
        }
    }));
};

var worker$1 = Worker;

var worker = function(Modbus) {
    const cl = Modbus.prototype;


    cl.setWorkerOptions = function(options) {
        if (this._worker) {
            this._worker.setOptions(options);
        } else {
            this._worker = new worker$1(this, options);
        }
    };

    cl.send = function(request) {
        if(!this._worker) {
            this._worker = new worker$1(this);
        }

        return this._worker.send(request);
    };

    cl.poll = function(options) {
        if(!this._worker) {
            this._worker = new worker$1(this);
        }

        return this._worker.poll(options);
    };

};

/* eslint-disable class-methods-use-this */

const EventEmitter$2 = events.EventEmitter || events;
const modbusSerialDebug$3 = src("modbus-serial");

/* Add bit operation functions to Buffer
 */
buffer_bit();


const MIN_DATA_LENGTH = 7;

class TestPort extends EventEmitter$2 {
    /**
     * Simulate a serial port with 4 modbus-rtu slaves connected.
     *
     * 1 - a modbus slave working correctly
     * 2 - a modbus slave that answer short replays
     * 3 - a modbus slave that answer with bad crc
     * 4 - a modbus slave that answer with bad unit number
     * 5 - a modbus slave that answer with an exception
     * 6 - a modbus slave that times out (does not answer)
     */
    constructor() {
        super();

        // simulate 11 input registers
        this._registers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        // simulate 11 holding registers
        this._holding_registers = [0, 0, 0, 0, 0, 0, 0, 0, 0xa12b, 0xffff, 0xb21a];

        // simulate 16 coils / digital inputs
        this._coils = 0x0000; // TODO 0xa12b, 1010 0001 0010 1011
    }

    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    get isOpen() {
        return true;
    }

    /**
     * Simulate successful port open.
     *
     * @param callback
     */
    open(callback) {
        if (callback)
            callback(null);
    }

    /**
     * Simulate successful close port.
     *
     * @param callback
     */
    close(callback) {
        if (callback)
            callback(null);
    }

    /**
     * Simulate successful/failure port requests and replays.
     *
     * @param {Buffer} data
     */
    write(data) {
        let buffer = null;
        let length = null;
        let address = null;
        let value = null;
        let state = null;
        let i = null;

        if(data.length < MIN_DATA_LENGTH) {
            modbusSerialDebug$3("expected length of data is to small - minimum is " + MIN_DATA_LENGTH);
            return;
        }

        const unitNumber = data[0];
        const functionCode = data[1];
        let crc = data[data.length - 2] + data[data.length - 1] * 0x100;
        // if crc is bad, ignore message
        if (crc !== crc16(data.slice(0, -2))) {
            return;
        }

        // function code 1 and 2
        if (functionCode === 1 || functionCode === 2) {
            address = data.readUInt16BE(2);
            length = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== 8) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(3 + parseInt((length - 1) / 8 + 1) + 2);
            buffer.writeUInt8(parseInt((length - 1) / 8 + 1), 2);

            // read coils
            buffer.writeUInt16LE(this._coils >> address, 3);
        }

        // function code 3
        if (functionCode === 3) {
            address = data.readUInt16BE(2);
            length = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== 8) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(3 + length * 2 + 2);
            buffer.writeUInt8(length * 2, 2);

            // read registers
            for (i = 0; i < length; i++) {
                buffer.writeUInt16BE(this._holding_registers[address + i], 3 + i * 2);
            }
        }

        // function code 4
        if (functionCode === 4) {
            address = data.readUInt16BE(2);
            length = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== 8) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(3 + length * 2 + 2);
            buffer.writeUInt8(length * 2, 2);

            // read registers
            for (i = 0; i < length; i++) {
                buffer.writeUInt16BE(this._registers[address + i], 3 + i * 2);
            }
        }

        // function code 5
        if (functionCode === 5) {
            address = data.readUInt16BE(2);
            state = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== 8) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(8);
            buffer.writeUInt16BE(address, 2);
            buffer.writeUInt16BE(state, 4);

            // write coil
            if (state === 0xff00) {
                this._coils |= (1 << address);
            } else {
                this._coils &= ~(1 << address);
            }
        }

        // function code 6
        if (functionCode === 6) {
            address = data.readUInt16BE(2);
            value = data.readUInt16BE(4);
            // if length is bad, ignore message
            if (data.length !== (6 + 2)) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(8);
            buffer.writeUInt16BE(address, 2);
            buffer.writeUInt16BE(value, 4);

            this._holding_registers[address] = value;
        }

        // function code 15
        if (functionCode === 15) {
            address = data.readUInt16BE(2);
            length = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== 7 + Math.ceil(length / 8) + 2) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(8);
            buffer.writeUInt16BE(address, 2);
            buffer.writeUInt16BE(length, 4);

            // write coils
            for (i = 0; i < length; i++) {
                state = data.readBit(i, 7);

                if (state) {
                    this._coils |= (1 << (address + i));
                } else {
                    this._coils &= ~(1 << (address + i));
                }
            }
        }

        // function code 16
        if (functionCode === 16) {
            address = data.readUInt16BE(2);
            length = data.readUInt16BE(4);

            // if length is bad, ignore message
            if (data.length !== (7 + length * 2 + 2)) {
                return;
            }

            // build answer
            buffer = Buffer.alloc(8);
            buffer.writeUInt16BE(address, 2);
            buffer.writeUInt16BE(length, 4);

            // write registers
            for (i = 0; i < length; i++) {
                this._holding_registers[address + i] = data.readUInt16BE(7 + i * 2);
            }
        }

        if (functionCode === 43) {
            const productCode = "MyProductCode1234";
            buffer = Buffer.alloc(12 + productCode.length);
            buffer.writeUInt8(16, 2); // MEI Type
            buffer.writeUInt8(data.readInt8(3), 3); // read device ID code
            buffer.writeUInt8(0x01, 4); // conformity level
            buffer.writeUInt8(0, 5); // number of follows left
            buffer.writeUInt8(0, 6); // next object ID
            buffer.writeUInt8(1, 7); // number of objects
            buffer.writeUInt8(data.readInt8(4), 8);
            buffer.writeUInt8(productCode.length, 9);
            buffer.write(productCode, 10, productCode.length, "ascii");
        }

        // send data back
        if (buffer) {
            // add unit number and function code
            buffer.writeUInt8(unitNumber, 0);
            buffer.writeUInt8(functionCode, 1);

            // corrupt the answer
            switch (unitNumber) {
                case 1:
                    // unit 1: answers correctly
                    break;
                case 2:
                    // unit 2: answers short data
                    buffer = buffer.slice(0, buffer.length - 5);
                    break;
                case 4:
                    // unit 4: answers with bad unit number
                    buffer[0] = unitNumber + 2;
                    break;
                case 5:
                    // unit 5: answers with exception
                    buffer.writeUInt8(functionCode + 128, 1);
                    buffer.writeUInt8(4, 2);
                    buffer = buffer.slice(0, 5);
                    break;
                case 6:
                    // unit 6: does not answer
                    return;
            }

            // add crc
            crc = crc16(buffer.slice(0, -2));
            buffer.writeUInt16LE(crc, buffer.length - 2);

            // unit 3: answers with bad crc
            if (unitNumber === 3) {
                buffer.writeUInt16LE(crc + 1, buffer.length - 2);
            }

            this.emit("data", buffer);

            modbusSerialDebug$3({
                action: "send test port",
                data: data,
                buffer: buffer,
                unitid: unitNumber,
                functionCode: functionCode
            });

            modbusSerialDebug$3(JSON.stringify({
                action: "send test port strings",
                data: data,
                buffer: buffer,
                unitid: unitNumber,
                functionCode: functionCode
            }));
        }
    }
}

/**
 * Test port for Modbus.
 *
 * @type {TestPort}
 */
var testport = TestPort;

var name = "modbus-serial";
var version = "8.0.11";
var description = "A pure JavaScript implemetation of MODBUS-RTU (Serial and TCP) for NodeJS.";
var main = "index.js";
var scripts = {
	test: "mocha --recursive"
};
var repository = {
	type: "git",
	url: "git+https://github.com/yaacov/node-modbus-serial.git"
};
var keywords = [
	"modbus",
	"rtu",
	"serial",
	"port",
	"com",
	"arduino"
];
var author = "Yaacov Zamir <kobi.zamir@gmail.com>";
var license = "ISC";
var bugs = {
	url: "https://github.com/yaacov/node-modbus-serial/issues"
};
var homepage = "https://github.com/yaacov/node-modbus-serial#readme";
var devDependencies = {
	chai: "^4.2.0",
	"chai-as-promised": "^7.1.1",
	eslint: "^8.12.0",
	gulp: "^4.0.2",
	"gulp-clean": "^0.4.0",
	"gulp-jsdoc3": "^2.0.0",
	mocha: "^6.2.1",
	"mocha-eslint": "^7.0.0",
	mockery: "^2.1.0",
	pump: "^3.0.0",
	sinon: "^7.5.0",
	"web-bluetooth-mock": "^1.0.2",
	webbluetooth: "^2.1.0"
};
var dependencies = {
	debug: "^4.1.1",
	serialport: "^10.4.0"
};
var require$$1 = {
	name: name,
	version: version,
	description: description,
	main: main,
	scripts: scripts,
	repository: repository,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	devDependencies: devDependencies,
	dependencies: dependencies
};

/* eslint-disable no-var */
/**
 * Copyright (c) 2017, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

const modbusSerialDebug$2 = src("modbus-serial");

/**
 * Check the length of request Buffer for length of 8.
 *
 * @param requestBuffer - request Buffer from client
 * @returns {boolean} - if error it is true, otherwise false
 * @private
 */
function _errorRequestBufferLength(requestBuffer) {

    if (requestBuffer.length !== 8) {
        modbusSerialDebug$2("request Buffer length " + requestBuffer.length + " is wrong - has to be == 8");
        return true;
    }

    return false; // length is okay - no error
}

/**
 * Check the length of request Buffer for length of 8.
 *
 * @param requestBuffer - request Buffer from client
 * @returns {boolean} - if error it is true, otherwise false
 * @private
 */
function _errorRequestBufferLengthEnron(requestBuffer) {

    if (requestBuffer.length !== 10) {
        modbusSerialDebug$2("request (Enron) Buffer length " + requestBuffer.length + " is wrong - has to be == 10");
        return true;
    }

    return false; // length is okay - no error
}

/**
 * Handle the callback invocation for Promises or synchronous values
 *
 * @param promiseOrValue - the Promise to be resolved or value to be returned
 * @param cb - the callback to be invoked
 * @returns undefined
 * @private
 */
function _handlePromiseOrValue(promiseOrValue, cb) {
    if (promiseOrValue && promiseOrValue.then && typeof promiseOrValue.then === "function") {
        promiseOrValue
            .then(function(value) {
                cb(null, value);
            })
            .catch(function(err) {
                cb(err);
            });
    }  else {
        cb(null, promiseOrValue);
    }
}


/**
 * Function to handle FC1 or FC2 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReadCoilsOrInputDiscretes(requestBuffer, vector, unitID, callback, fc) {
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const dataBytes = parseInt((length - 1) / 8 + 1);
    const responseBuffer = Buffer.alloc(3 + dataBytes + 2);
    try {
        responseBuffer.writeUInt8(dataBytes, 2);
    }
    catch (err) {
        callback(err);
        return;
    }

    const isGetCoil = (fc === 1 && vector.getCoil);
    const isGetDiscreteInpupt = (fc === 2 && vector.getDiscreteInput);

    // read coils
    if (isGetCoil || isGetDiscreteInpupt) {
        let callbackInvoked = false;
        let cbCount = 0;
        const buildCb = function(i) {
            return function(err, value) {
                if (err) {
                    if (!callbackInvoked) {
                        callbackInvoked = true;
                        callback(err);
                    }

                    return;
                }

                cbCount = cbCount + 1;

                responseBuffer.writeBit(value, i % 8, 3 + parseInt(i / 8));

                if (cbCount === length && !callbackInvoked) {
                    modbusSerialDebug$2({ action: "FC" + fc + " response", responseBuffer: responseBuffer });

                    callbackInvoked = true;
                    callback(null, responseBuffer);
                }
            };
        };

        if (length === 0)
            callback({
                modbusErrorCode: 0x02, // Illegal address
                msg: "Invalid length"
            });

        let i = 0;
        let cb = null;
        let promiseOrValue = null;

        if (isGetCoil && vector.getCoil.length === 3) {
            for (i = 0; i < length; i++) {
                cb = buildCb(i);
                try {
                    vector.getCoil(address + i, unitID, cb);
                }
                catch(err) {
                    cb(err);
                }
            }
        }
        else if (isGetDiscreteInpupt && vector.getDiscreteInput.length === 3) {
            for (i = 0; i < length; i++) {
                cb = buildCb(i);
                try {
                    vector.getDiscreteInput(address + i, unitID, cb);
                }
                catch(err) {
                    cb(err);
                }
            }
        }
        else if (isGetCoil) {
            for (i = 0; i < length; i++) {
                cb = buildCb(i);
                try {
                    promiseOrValue = vector.getCoil(address + i, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
                catch(err) {
                    cb(err);
                }
            }
        }
        else if (isGetDiscreteInpupt) {
            for (i = 0; i < length; i++) {
                cb = buildCb(i);
                try {
                    promiseOrValue = vector.getDiscreteInput(address + i, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
                catch(err) {
                    cb(err);
                }
            }
        }
    }
}

/**
 * Function to handle FC3 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReadMultipleRegisters(requestBuffer, vector, unitID, callback) {
    const valueSize = 2;
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(3 + (length * valueSize) + 2);
    try {
        responseBuffer.writeUInt8(length * valueSize, 2);
    }
    catch (err) {
        callback(err);
        return;
    }

    let callbackInvoked = false;
    let cbCount = 0;
    const buildCb = function(i) {
        return function(err, value) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            cbCount = cbCount + 1;

            responseBuffer.writeUInt16BE(value, 3 + (i * valueSize));

            if (cbCount === length && !callbackInvoked) {
                modbusSerialDebug$2({ action: "FC3 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };
    };

    if (length === 0)
        callback({
            modbusErrorCode: 0x02, // Illegal address
            msg: "Invalid length"
        });

    // read registers
    function tryAndHandlePromiseOrValue(i, values) {
        const cb = buildCb(i);
        try {
            const promiseOrValue = values[i];
            _handlePromiseOrValue(promiseOrValue, cb);
        }
        catch (err) {
            cb(err);
        }
    }

    if (vector.getMultipleHoldingRegisters && length > 1) {

        if (vector.getMultipleHoldingRegisters.length === 4) {
            vector.getMultipleHoldingRegisters(address, length, unitID, function(err, values) {
                if (!err && values.length !== length) {
                    const error = new Error("Requested address length and response length do not match");
                    callback(error);
                } else if (err) {
                    const cb = buildCb(i);
                    try {
                        cb(err); // no need to use value array if there is an error
                    }
                    catch (ex) {
                        cb(ex);
                    }
                }
                else {
                    for (var i = 0; i < length; i++) {
                        const cb = buildCb(i);
                        try {
                            cb(err, values[i]);
                        }
                        catch (ex) {
                            cb(ex);
                        }
                    }
                }
            });
        } else {
            const values = vector.getMultipleHoldingRegisters(address, length, unitID);
            if (values.length === length) {
                for (i = 0; i < length; i++) {
                    tryAndHandlePromiseOrValue(i, values);
                }
            } else {
                const error = new Error("Requested address length and response length do not match");
                callback(error);
            }
        }

    }
    else if (vector.getHoldingRegister) {
        for (var i = 0; i < length; i++) {
            const cb = buildCb(i);
            try {
                if (vector.getHoldingRegister.length === 3) {
                    vector.getHoldingRegister(address + i, unitID, cb);
                } else {
                    const promiseOrValue = vector.getHoldingRegister(address + i, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
            }
            catch (err) {
                cb(err);
            }
        }
    }
}

/**
 * Function to handle FC3 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param enronTables - The enron tables definition
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReadMultipleRegistersEnron(requestBuffer, vector, unitID, enronTables, callback) {
    const valueSize = 4;
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    // Fall back to 16 bit for short integer variables
    if (address >= enronTables.shortRange[0] && address <= enronTables.shortRange[1]) {
        return _handleReadMultipleRegisters(requestBuffer, vector, unitID, callback);
    }

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(3 + (length * valueSize) + 2);
    try {
        responseBuffer.writeUInt8(length * valueSize, 2);
    }
    catch (err) {
        callback(err);
        return;
    }

    let callbackInvoked = false;
    let cbCount = 0;
    const buildCb = function(i) {
        return function(err, value) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            cbCount = cbCount + 1;

            responseBuffer.writeUInt32BE(value, 3 + (i * valueSize));

            if (cbCount === length && !callbackInvoked) {
                modbusSerialDebug$2({ action: "FC3 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };
    };

    if (length === 0)
        callback({
            modbusErrorCode: 0x02, // Illegal address
            msg: "Invalid length"
        });

    // read registers
    function tryAndHandlePromiseOrValue(i, values) {
        const cb = buildCb(i);
        try {
            const promiseOrValue = values[i];
            _handlePromiseOrValue(promiseOrValue, cb);
        }
        catch (err) {
            cb(err);
        }
    }

    if (vector.getMultipleHoldingRegisters && length > 1) {

        if (vector.getMultipleHoldingRegisters.length === 4) {
            vector.getMultipleHoldingRegisters(address, length, unitID, function(err, values) {
                if (!err && values.length !== length) {
                    const error = new Error("Requested address length and response length do not match");
                    callback(error);
                } else if (err) {
                    const cb = buildCb(i);
                    try {
                        cb(err); // no need to use value array if there is an error
                    }
                    catch (ex) {
                        cb(ex);
                    }
                }
                else {
                    for (var i = 0; i < length; i++) {
                        const cb = buildCb(i);
                        try {
                            cb(err, values[i]);
                        }
                        catch (ex) {
                            cb(ex);
                        }
                    }
                }
            });
        } else {
            const values = vector.getMultipleHoldingRegisters(address, length, unitID);
            if (values.length === length) {
                for (i = 0; i < length; i++) {
                    tryAndHandlePromiseOrValue(i, values);
                }
            } else {
                const error = new Error("Requested address length and response length do not match");
                callback(error);
            }
        }

    }
    else if (vector.getHoldingRegister) {
        for (var i = 0; i < length; i++) {
            const cb = buildCb(i);
            try {
                if (vector.getHoldingRegister.length === 3) {
                    vector.getHoldingRegister(address + i, unitID, cb);
                } else {
                    const promiseOrValue = vector.getHoldingRegister(address + i, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
            }
            catch (err) {
                cb(err);
            }
        }
    }
}

/**
 * Function to handle FC4 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReadInputRegisters(requestBuffer, vector, unitID, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(3 + length * 2 + 2);
    try {
        responseBuffer.writeUInt8(length * 2, 2);
    }
    catch (err) {
        callback(err);
        return;
    }

    let callbackInvoked = false;
    let cbCount = 0;
    const buildCb = function(i) {
        return function(err, value) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            cbCount = cbCount + 1;

            responseBuffer.writeUInt16BE(value, 3 + i * 2);

            if (cbCount === length && !callbackInvoked) {
                modbusSerialDebug$2({ action: "FC4 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };
    };

    if (length === 0)
        callback({
            modbusErrorCode: 0x02, // Illegal address
            msg: "Invalid length"
        });

    function tryAndHandlePromiseOrValues(i, values) {
        const cb = buildCb(i);
        try {
            const promiseOrValue = values[i];
            _handlePromiseOrValue(promiseOrValue, cb);
        }
        catch (err) {
            cb(err);
        }
    }

    if (vector.getMultipleInputRegisters && length > 1) {

        if (vector.getMultipleInputRegisters.length === 4) {
            vector.getMultipleInputRegisters(address, length, unitID, function(err, values) {
                if (!err && values.length !== length) {
                    const error = new Error("Requested address length and response length do not match");
                    callback(error);
                } else {
                    for (let i = 0; i < length; i++) {
                        const cb = buildCb(i);
                        try {
                            cb(err, values[i]);
                        }
                        catch (ex) {
                            cb(ex);
                        }
                    }
                }
            });
        } else {
            const values = vector.getMultipleInputRegisters(address, length, unitID);
            if (values.length === length) {
                for (var i = 0; i < length; i++) {
                    tryAndHandlePromiseOrValues(i, values);
                }
            } else {
                const error = new Error("Requested address length and response length do not match");
                callback(error);
            }
        }

    }
    else if (vector.getInputRegister) {

        for (i = 0; i < length; i++) {
            const cb = buildCb(i);
            try {
                if (vector.getInputRegister.length === 3) {
                    vector.getInputRegister(address + i, unitID, cb);
                }
                else {
                    const promiseOrValue = vector.getInputRegister(address + i, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
            }
            catch (ex) {
                cb(ex);
            }
        }
    }
}

/**
 * Function to handle FC5 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleWriteCoil(requestBuffer, vector, unitID, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const state = requestBuffer.readUInt16BE(4);

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(8);
    responseBuffer.writeUInt16BE(address, 2);
    responseBuffer.writeUInt16BE(state, 4);

    if (vector.setCoil) {
        let callbackInvoked = false;
        const cb = function(err) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            if (!callbackInvoked) {
                modbusSerialDebug$2({ action: "FC5 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };

        try {
            if (vector.setCoil.length === 4) {
                vector.setCoil(address, state === 0xff00, unitID, cb);
            }
            else {
                const promiseOrValue = vector.setCoil(address, state === 0xff00, unitID);
                _handlePromiseOrValue(promiseOrValue, cb);
            }
        }
        catch(err) {
            cb(err);
        }
    }
}

/**
 * Function to handle FC6 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleWriteSingleRegister(requestBuffer, vector, unitID, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const value = requestBuffer.readUInt16BE(4);

    if (_errorRequestBufferLength(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(8);
    responseBuffer.writeUInt16BE(address, 2);
    responseBuffer.writeUInt16BE(value, 4);

    if (vector.setRegister) {
        let callbackInvoked = false;
        const cb = function(err) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            if (!callbackInvoked) {
                modbusSerialDebug$2({ action: "FC6 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };

        try {
            if (vector.setRegister.length === 4) {
                vector.setRegister(address, value, unitID, cb);
            }
            else {
                const promiseOrValue = vector.setRegister(address, value, unitID);
                _handlePromiseOrValue(promiseOrValue, cb);
            }
        } catch(err) {
            cb(err);
        }
    }
}

/**
 * Function to handle FC6 (Enron) request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param enronTables - The enron tables definition
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleWriteSingleRegisterEnron(requestBuffer, vector, unitID, enronTables, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const value = requestBuffer.readUInt32BE(4);

    // Fall back to 16 bit for short integer variables
    if (address >= enronTables.shortRange[0] && address <= enronTables.shortRange[1]) {
        return _handleWriteSingleRegister(requestBuffer, vector, unitID, callback);
    }

    if (_errorRequestBufferLengthEnron(requestBuffer)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(10);
    responseBuffer.writeUInt16BE(address, 2);
    responseBuffer.writeUInt32BE(value, 4);

    if (vector.setRegister) {
        let callbackInvoked = false;
        const cb = function(err) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            if (!callbackInvoked) {
                modbusSerialDebug$2({ action: "FC6 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };

        try {
            if (vector.setRegister.length === 4) {
                vector.setRegister(address, value, unitID, cb);
            }
            else {
                const promiseOrValue = vector.setRegister(address, value, unitID);
                _handlePromiseOrValue(promiseOrValue, cb);
            }
        } catch(err) {
            cb(err);
        }
    }
}

/**
 * Function to handle FC15 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleForceMultipleCoils(requestBuffer, vector, unitID, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    // if length is bad, ignore message
    if (requestBuffer.length !== 7 + Math.ceil(length / 8) + 2) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(8);
    responseBuffer.writeUInt16BE(address, 2);
    responseBuffer.writeUInt16BE(length, 4);

    let callbackInvoked = false;
    let cbCount = 0;
    const buildCb = function(/* i - not used at the moment */) {
        return function(err) {
            if (err) {
                if (!callbackInvoked) {
                    callbackInvoked = true;
                    callback(err);
                }

                return;
            }

            cbCount = cbCount + 1;

            if (cbCount === length && !callbackInvoked) {
                modbusSerialDebug$2({ action: "FC15 response", responseBuffer: responseBuffer });

                callbackInvoked = true;
                callback(null, responseBuffer);
            }
        };
    };

    if (length === 0)
        callback({
            modbusErrorCode: 0x02, // Illegal address
            msg: "Invalid length"
        });

    if (vector.setCoilArray) {
        const state = [];

        for (i = 0; i < length; i++) {
            cb = buildCb();
            state.push(requestBuffer.readBit(i, 7));
            _handlePromiseOrValue(promiseOrValue, cb);
        }

        try {
            if (vector.setCoilArray.length === 4) {
                vector.setCoilArray(address, state, unitID, cb);
            }
            else {
                vector.setCoilArray(address, state, unitID);
            }
        }
        catch(err) {
            cb(err);
        }
    } else if (vector.setCoil) {
        let state;

        for (var i = 0; i < length; i++) {
            var cb = buildCb();
            state = requestBuffer.readBit(i, 7);

            try {
                if (vector.setCoil.length === 4) {
                    vector.setCoil(address + i, state !== false, unitID, cb);
                }
                else {
                    var promiseOrValue = vector.setCoil(address + i, state !== false, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
            }
            catch(err) {
                cb(err);
            }
        }
    }
}
/**
 * Function to handle FC16 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleWriteMultipleRegisters(requestBuffer, vector, unitID, callback) {
    const address = requestBuffer.readUInt16BE(2);
    const length = requestBuffer.readUInt16BE(4);

    // if length is bad, ignore message
    if (requestBuffer.length !== (7 + length * 2 + 2)) {
        return;
    }

    // build answer
    const responseBuffer = Buffer.alloc(8);
    responseBuffer.writeUInt16BE(address, 2);
    responseBuffer.writeUInt16BE(length, 4);

    // write registers
    let callbackInvoked = false;
    const cb = function(err) {
        if (err) {
            if (!callbackInvoked) {
                callbackInvoked = true;
                callback(err);
            }

            return;
        }

        if (!callbackInvoked) {
            modbusSerialDebug$2({ action: "FC16 response", responseBuffer: responseBuffer });

            callbackInvoked = true;
            callback(null, responseBuffer);
        }
    };

    if (length === 0)
        callback({
            modbusErrorCode: 0x02, // Illegal address
            msg: "Invalid length"
        });
    if (vector.setRegisterArray) {
        value = [];

        try {
            for (i = 0; i < length; i++) {
                value.push(requestBuffer.readUInt16BE(7 + i * 2));
            }

            if (vector.setRegisterArray.length === 4) {
                vector.setRegisterArray(address, value, unitID, cb);
            }
            else {
                var promiseOrValue = vector.setRegisterArray(address, value, unitID);
                _handlePromiseOrValue(promiseOrValue, cb);
            }
        }
        catch (err) {
            cb(err);
        }
    } else if (vector.setRegister) {
        var value;

        for (var i = 0; i < length; i++) {
            try {
                value = requestBuffer.readUInt16BE(7 + i * 2);

                if (vector.setRegister.length === 4) {
                    vector.setRegister(address + i, value, unitID, cb);
                }
                else {
                    const promiseOrValue = vector.setRegister(address + i, value, unitID);
                    _handlePromiseOrValue(promiseOrValue, cb);
                }
            }
            catch(err) {
                cb(err);
            }
        }
    }
}

/**
 * Function to handle FC17 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReportServerID(requestBuffer, vector, unitID, callback) {
    if(!vector.reportServerID) {
        callback({ modbusErrorCode: 0x01 });
        return;
    }

    // build answer
    const promiseOrValue = vector.reportServerID(unitID);
    _handlePromiseOrValue(promiseOrValue, function(err, value) {
        if(err) {
            callback(err);
            return;
        }
        if (!value) {
            callback({ modbusErrorCode: 0x01, msg: "Report Server ID not supported by device" });
            return;
        }
        if (!value.id || !value.running) {
            callback({ modbusErrorCode: 0x04, msg: "Invalid content provided for Report Server ID: " + JSON.stringify(value) });
            return;
        }
        const id = value.id;
        const running = value.running;
        const additionalData = value.additionalData;
        let contentLength = 2; // serverID + Running
        if (additionalData) {
            contentLength += additionalData.length;
        }
        const totalLength = 3 + contentLength + 2; // UnitID + FC + Byte-Count + Content-Length + CRC

        let i = 2;
        const responseBuffer = Buffer.alloc(totalLength);
        i = responseBuffer.writeUInt8(contentLength, i);
        i = responseBuffer.writeUInt8(id, i);
        if (running === true) {
            i = responseBuffer.writeUInt8(0xFF, i);
        } else {
            i += 1;
        }
        if (additionalData) {
            additionalData.copy(responseBuffer, i);
        }
        callback(null, responseBuffer);
    });
}

/**
 * Function to handle FC43 request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleMEI(requestBuffer, vector, unitID, callback) {
    const MEIType = requestBuffer[2];
    switch(parseInt(MEIType)) {
        case 14:
            _handleReadDeviceIdentification(requestBuffer, vector, unitID, callback);
            break;
        default:
            callback({ modbusErrorCode: 0x01 }); // illegal MEI type
    }
}

/**
 * Function to handle FC43/14 MEI request.
 *
 * @param requestBuffer - request Buffer from client
 * @param vector - vector of functions for read and write
 * @param unitID - Id of the requesting unit
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @returns undefined
 * @private
 */
function _handleReadDeviceIdentification(requestBuffer, vector, unitID, callback) {
    const PDULenMax = 253;
    const MEI14HeaderLen = 6;
    const stringLengthMax = PDULenMax - MEI14HeaderLen - 2;

    if(!vector.readDeviceIdentification) {
        callback({ modbusErrorCode: 0x01 });
        return;
    }

    const readDeviceIDCode = requestBuffer.readUInt8(3);
    let objectID = requestBuffer.readUInt8(4);

    // Basic request parameters checks
    switch(readDeviceIDCode) {
        case 0x01:
            if(objectID > 0x02 || (objectID > 0x06 && objectID < 0x80))
                objectID = 0x00;
            break;

        case 0x02:
            if(objectID >= 0x80 || (objectID > 0x06 && objectID < 0x80))
                objectID = 0x00;
            break;

        case 0x03:
            if(objectID > 0x06 && objectID < 0x80)
                objectID = 0x00;
            break;

        case 0x04:
            if(objectID > 0x06 && objectID < 0x80) {
                callback({ modbusErrorCode: 0x02 });
                return;
            }
            break;

        default:
            callback({ modbusErrorCode: 0x03 });
            return;
    }

    // Filling mandatory basic device identification objects
    const objects = {
        0x00: "undefined",
        0x01: "undefined",
        0x02: "undefined"
    };

    const pkg = require$$1;
    if(pkg) {
        objects[0x00] = pkg.author;
        objects[0x01] = pkg.name;
        objects[0x02] = pkg.version;
    }

    const promiseOrValue = vector.readDeviceIdentification(unitID);
    _handlePromiseOrValue(promiseOrValue, function(err, value) {
        if(err) {
            callback(err);
            return;
        }

        const userObjects = value;

        for(const o of Object.keys(userObjects)) {
            const i = parseInt(o);
            if(!isNaN(i) && i >= 0 && i <= 255)
                objects[i] = userObjects[o];
        }

        // Checking the existence of the requested objectID
        if(!objects[objectID]) {
            if(readDeviceIDCode === 0x04) {
                callback({ modbusErrorCode: 0x02 });
                return;
            }

            objectID = 0x00;
        }

        const ids = [];
        let totalLength = 2 + MEI14HeaderLen + 2; // UnitID + FC + MEI14Header + CRC
        let lastID = 0;
        let conformityLevel = 0x81;

        const supportedIDs = Object.keys(objects);

        // Filtering of objects and Conformity level determination
        for(var id of supportedIDs) {
            id = parseInt(id);

            if(isNaN(id))
                continue;

            // Enforcing valid object IDs from the user
            if(id < 0x00 || (id > 0x06 && id < 0x80) || id > 0xFF) {
                callback({ modbusErrorCode: 0x04, msg: "Invalid Object ID provided for Read Device Identification: " + id });
            }

            if(id > 0x02)
                conformityLevel = 0x82;
            if(id > 0x80)
                conformityLevel = 0x83;

            // Starting from requested object ID
            if(objectID > id)
                continue;

            // Enforcing maximum string length
            if(objects[id].length > stringLengthMax) {
                callback({ modbusErrorCode: 0x04,
                    msg: "Read Device Identification string size can be maximum " +
                                stringLengthMax });
            }

            if(lastID !== 0)
                continue;

            if(objects[id].length + 2 > PDULenMax - totalLength) {
                if(lastID === 0)
                    lastID = id;
            }
            else {
                totalLength += objects[id].length + 2;
                ids.push(id);

                // Requested a single object
                if(readDeviceIDCode === 0x04)
                    break;
            }
        }

        ids.sort((a, b) => parseInt(a) - parseInt(b));
        const responseBuffer = Buffer.alloc(totalLength);

        let i = 2;
        i = responseBuffer.writeUInt8(14, i);                                   // MEI type
        i = responseBuffer.writeUInt8(readDeviceIDCode, i);
        i = responseBuffer.writeUInt8(conformityLevel, i);
        if(lastID === 0)                                                        // More follows
            i = responseBuffer.writeUInt8(0x00, i);
        else
            i = responseBuffer.writeUInt8(0xFF, i);

        i = responseBuffer.writeUInt8(lastID, i);                               // Next Object Id
        i = responseBuffer.writeUInt8(ids.length, i);                           // Number of objects

        for(id of ids) {
            i = responseBuffer.writeUInt8(id, i);                               // Object id
            i = responseBuffer.writeUInt8(objects[id].length, i);               // Object length
            i += responseBuffer.write(objects[id], i, objects[id].length);      // Object value
        }

        callback(null, responseBuffer);
    });
}

/**
 * Exports
 */
var servertcp_handler = {
    readCoilsOrInputDiscretes: _handleReadCoilsOrInputDiscretes,
    readMultipleRegisters: _handleReadMultipleRegisters,
    readMultipleRegistersEnron: _handleReadMultipleRegistersEnron,
    readInputRegisters: _handleReadInputRegisters,
    writeCoil: _handleWriteCoil,
    writeSingleRegister: _handleWriteSingleRegister,
    writeSingleRegisterEnron: _handleWriteSingleRegisterEnron,
    forceMultipleCoils: _handleForceMultipleCoils,
    writeMultipleRegisters: _handleWriteMultipleRegisters,
    reportServerID: _handleReportServerID,
    handleMEI: _handleMEI
};

/**
 * Copyright (c) 2017, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

const EventEmitter$1 = events.EventEmitter || events;

const modbusSerialDebug$1 = src("modbus-serial");

const HOST = "127.0.0.1";
const UNIT_ID$1 = 255; // listen to all adresses
const MODBUS_PORT = 502;

// Not really its official length, but we parse UnitID as part of PDU
const MBAP_LEN = 6;

/* Get Handlers
 */


/* Add bit operation functions to Buffer
 */
buffer_bit();


/**
 * Helper function for sending debug objects.
 *
 * @param {string} text - text of message, an error or an action
 * @param {int} unitID - Id of the requesting unit
 * @param {int} functionCode - a modbus function code.
 * @param {Buffer} requestBuffer - request Buffer from client
 * @returns undefined
 * @private
 */
function _serverDebug$1(text, unitID, functionCode, responseBuffer) {
    // If no responseBuffer, then assume this is an error
    // o/w assume an action
    if (typeof responseBuffer === "undefined") {
        modbusSerialDebug$1({
            error: text,
            unitID: unitID,
            functionCode: functionCode
        });

    } else {
        modbusSerialDebug$1({
            action: text,
            unitID: unitID,
            functionCode: functionCode,
            responseBuffer: responseBuffer.toString("hex")
        });
    }
}

/**
 * Helper function for creating callback functions.
 *
 * @param {int} unitID - Id of the requesting unit
 * @param {int} functionCode - a modbus function code
 * @param {function} sockWriter - write buffer (or error) to tcp socket
 * @returns {function} - a callback function
 * @private
 */
function _callbackFactory$1(unitID, functionCode, sockWriter) {
    return function cb(err, responseBuffer) {
        // If we have an error.
        if (err) {
            let errorCode = 0x04; // slave device failure
            if (!isNaN(err.modbusErrorCode)) {
                errorCode = err.modbusErrorCode;
            }

            // Set an error response
            functionCode = parseInt(functionCode) | 0x80;
            responseBuffer = Buffer.alloc(3 + 2);
            responseBuffer.writeUInt8(errorCode, 2);

            _serverDebug$1("error processing response", unitID, functionCode);
        }

        // If we do not have a responseBuffer
        if (!responseBuffer) {
            _serverDebug$1("no response buffer", unitID, functionCode);
            return sockWriter(null, responseBuffer);
        }

        // add unit number and function code
        responseBuffer.writeUInt8(unitID, 0);
        responseBuffer.writeUInt8(functionCode, 1);

        // Add crc
        const crc = crc16(responseBuffer.slice(0, -2));
        responseBuffer.writeUInt16LE(crc, responseBuffer.length - 2);

        // Call callback function
        _serverDebug$1("server response", unitID, functionCode, responseBuffer);
        return sockWriter(null, responseBuffer);
    };
}

/**
 * Parse a ModbusRTU buffer and return an answer buffer.
 *
 * @param {Buffer} requestBuffer - request Buffer from client
 * @param {object} vector - vector of functions for read and write
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @param {int} serverUnitID - the server's unitID
 * @param {function} sockWriter - write buffer (or error) to tcp socket
 * @param {object} options - the options object
 * @returns undefined
 * @private
 */
function _parseModbusBuffer$1(requestBuffer, vector, serverUnitID, sockWriter, options) {
    // Check requestBuffer length
    if (!requestBuffer || requestBuffer.length < MBAP_LEN) {
        modbusSerialDebug$1("wrong size of request Buffer " + requestBuffer.length);
        return;
    }

    const unitID = requestBuffer[0];
    let functionCode = requestBuffer[1];
    const crc = requestBuffer[requestBuffer.length - 2] + requestBuffer[requestBuffer.length - 1] * 0x100;

    // if crc is bad, ignore message
    if (crc !== crc16(requestBuffer.slice(0, -2))) {
        modbusSerialDebug$1("wrong CRC of request Buffer");
        return;
    }

    // if crc is bad, ignore message
    if (serverUnitID !== 255 && serverUnitID !== unitID) {
        modbusSerialDebug$1("wrong unitID");
        return;
    }

    modbusSerialDebug$1("request for function code " + functionCode);
    const cb = _callbackFactory$1(unitID, functionCode, sockWriter);

    switch (parseInt(functionCode)) {
        case 1:
        case 2:
            servertcp_handler.readCoilsOrInputDiscretes(requestBuffer, vector, unitID, cb, functionCode);
            break;
        case 3:
            if (options.enron) {
                servertcp_handler.readMultipleRegistersEnron(requestBuffer, vector, unitID, options.enronTables, cb);
            } else {
                servertcp_handler.readMultipleRegisters(requestBuffer, vector, unitID, cb);
            }
            break;
        case 4:
            servertcp_handler.readInputRegisters(requestBuffer, vector, unitID, cb);
            break;
        case 5:
            servertcp_handler.writeCoil(requestBuffer, vector, unitID, cb);
            break;
        case 6:
            if (options.enron) {
                servertcp_handler.writeSingleRegisterEnron(requestBuffer, vector, unitID, options.enronTables, cb);
            } else {
                servertcp_handler.writeSingleRegister(requestBuffer, vector, unitID, cb);
            }
            break;
        case 15:
            servertcp_handler.forceMultipleCoils(requestBuffer, vector, unitID, cb);
            break;
        case 16:
            servertcp_handler.writeMultipleRegisters(requestBuffer, vector, unitID, cb);
            break;
        case 43:
            servertcp_handler.handleMEI(requestBuffer, vector, unitID, cb);
            break;
        default: {
            const errorCode = 0x01; // illegal function

            // set an error response
            functionCode = parseInt(functionCode) | 0x80;
            const responseBuffer = Buffer.alloc(3 + 2);
            responseBuffer.writeUInt8(errorCode, 2);

            modbusSerialDebug$1({
                error: "Illegal function",
                functionCode: functionCode
            });

            cb({ modbusErrorCode: errorCode }, responseBuffer);
        }
    }
}

class ServerTCP extends EventEmitter$1 {
    /**
     * Class making ModbusTCP server.
     *
     * @param vector - vector of server functions (see examples/server.js)
     * @param options - server options (host (IP), port, debug (true/false), unitID, enron? (true/false), enronTables? (object))
     * @constructor
     */
    constructor(vector, options) {
        super();

        const modbus = this;
        options = options || {};

        // create a tcp server
        modbus._server = net.createServer();
        modbus._server.listen({
            port: options.port || MODBUS_PORT,
            host: options.host || HOST
        }, function() {
            modbus.emit("initialized");
        });

        // create a server unit id
        const serverUnitID = options.unitID || UNIT_ID$1;

        // remember open sockets
        modbus.socks = new Map();

        modbus._server.on("connection", function(sock) {
            let recvBuffer = Buffer.from([]);
            modbus.socks.set(sock, 0);

            modbusSerialDebug$1({
                action: "connected",
                address: sock.address(),
                remoteAddress: sock.remoteAddress,
                localPort: sock.localPort
            });

            sock.once("close", function() {
                modbusSerialDebug$1({
                    action: "closed"
                });
                modbus.socks.delete(sock);
            });

            sock.on("data", function(data) {
                modbusSerialDebug$1({ action: "socket data", data: data });
                recvBuffer = Buffer.concat([recvBuffer, data], recvBuffer.length + data.length);

                while(recvBuffer.length > MBAP_LEN) {
                    const transactionsId = recvBuffer.readUInt16BE(0);
                    const pduLen = recvBuffer.readUInt16BE(4);

                    // Check the presence of the full request (MBAP + PDU)
                    if(recvBuffer.length - MBAP_LEN < pduLen)
                        break;

                    // remove mbap and add crc16
                    const requestBuffer = Buffer.alloc(pduLen + 2);
                    recvBuffer.copy(requestBuffer, 0, MBAP_LEN, MBAP_LEN + pduLen);

                    // Move receive buffer on
                    recvBuffer = recvBuffer.slice(MBAP_LEN + pduLen);

                    const crc = crc16(requestBuffer.slice(0, -2));
                    requestBuffer.writeUInt16LE(crc, requestBuffer.length - 2);

                    modbusSerialDebug$1({ action: "receive", data: requestBuffer, requestBufferLength: requestBuffer.length });
                    modbusSerialDebug$1(JSON.stringify({ action: "receive", data: requestBuffer }));

                    const sockWriter = function(err, responseBuffer) {
                        if (err) {
                            modbus.emit("error", err);
                            return;
                        }

                        // send data back
                        if (responseBuffer) {
                            // remove crc and add mbap
                            const outTcp = Buffer.alloc(responseBuffer.length + 6 - 2);
                            outTcp.writeUInt16BE(transactionsId, 0);
                            outTcp.writeUInt16BE(0, 2);
                            outTcp.writeUInt16BE(responseBuffer.length - 2, 4);
                            responseBuffer.copy(outTcp, 6);

                            modbusSerialDebug$1({ action: "send", data: responseBuffer });
                            modbusSerialDebug$1(JSON.stringify({ action: "send string", data: responseBuffer }));

                            // write to port
                            sock.write(outTcp);
                        }
                    };

                    // parse the modbusRTU buffer
                    setTimeout(
                        _parseModbusBuffer$1.bind(this,
                            requestBuffer,
                            vector,
                            serverUnitID,
                            sockWriter,
                            options
                        ),
                        0
                    );
                }
            });

            sock.on("error", function(err) {
                modbusSerialDebug$1(JSON.stringify({ action: "socket error", data: err }));

                modbus.emit("socketError", err);
            });
        });
    }

    /**
    * Delegate the close server method to backend.
    *
    * @param callback
    */
    close(callback) {
        const modbus = this;

        // close the net port if exist
        if (modbus._server) {
            modbus._server.removeAllListeners("data");
            modbus._server.close(callback);

            modbus.socks.forEach(function(e, sock) {
                sock.destroy();
            });

            modbusSerialDebug$1({ action: "close server" });
        } else {
            modbusSerialDebug$1({ action: "close server", warning: "server already closed" });
        }
    }
}

/**
 * ServerTCP interface export.
 * @type {ServerTCP}
 */
var servertcp = ServerTCP;

class ServerSerialPipeHandler extends stream_1.Transform {
    constructor({ maxBufferSize = 65536, interval, transformOptions }) {
        super(transformOptions);
        if (!interval) {
            throw new TypeError("\"interval\" is required");
        }
        if (typeof interval !== "number" || Number.isNaN(interval)) {
            throw new TypeError("\"interval\" is not a number");
        }
        if (interval < 1) {
            throw new TypeError("\"interval\" is not greater than 0");
        }
        if (typeof maxBufferSize !== "number" || Number.isNaN(maxBufferSize)) {
            throw new TypeError("\"maxBufferSize\" is not a number");
        }
        if (maxBufferSize < 1) {
            throw new TypeError("\"maxBufferSize\" is not greater than 0");
        }
        this.maxBufferSize = maxBufferSize;
        this.currentPacket = Buffer.from([]);
        this.interval = interval;
    }

    _transform(chunk, encoding, cb) {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }

        let offset = 0;
        while ((this.currentPacket.length + chunk.length) >= this.maxBufferSize) {
            this.currentPacket = Buffer.concat([this.currentPacket, chunk.slice(offset, this.maxBufferSize - this.currentPacket.length)]);
            offset = offset + this.maxBufferSize;
            chunk = chunk.slice(offset);
            this.emitPacket();
        }
        this.currentPacket = Buffer.concat([this.currentPacket, chunk]);
        this.intervalID = setTimeout(this.emitPacket.bind(this), this.interval);
        cb();
    }
    emitPacket() {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
        if (this.currentPacket.length > 0) {
            this.push(this.currentPacket);
        }
        this.currentPacket = Buffer.from([]);
    }
    _flush(cb) {
        this.emitPacket();
        cb();
    }
}

var serverserial_pipe_handler = ServerSerialPipeHandler;

/**
 * Copyright (c) 2017, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

const EventEmitter = events.EventEmitter || events;
const modbusSerialDebug = src("modbus-serial");
const { SerialPort } = dist;


const PORT = "/dev/tty";
const BAUDRATE = 9600;

const UNIT_ID = 255; // listen to all adresses

const ADDR_LEN = 1;

/* Get Handlers
 */


/* Add bit operation functions to Buffer
 */
buffer_bit();


/**
 * Helper function for sending debug objects.
 *
 * @param {string} text - text of message, an error or an action
 * @param {int} unitID - Id of the requesting unit
 * @param {int} functionCode - a modbus function code.
 * @param {Buffer} requestBuffer - request Buffer from client
 * @returns undefined
 * @private
 */
function _serverDebug(text, unitID, functionCode, responseBuffer) {
    // If no responseBuffer, then assume this is an error
    // o/w assume an action
    if (typeof responseBuffer === "undefined") {
        modbusSerialDebug({
            error: text,
            unitID: unitID,
            functionCode: functionCode
        });

    } else {
        modbusSerialDebug({
            action: text,
            unitID: unitID,
            functionCode: functionCode,
            responseBuffer: responseBuffer.toString("hex")
        });
    }
}

/**
 * Helper function for creating callback functions.
 *
 * @param {int} unitID - Id of the requesting unit
 * @param {int} functionCode - a modbus function code
 * @param {function} sockWriter - write buffer (or error) to tcp socket
 * @returns {function} - a callback function
 * @private
 */
function _callbackFactory(unitID, functionCode, sockWriter) {
    return function cb(err, responseBuffer) {
        // If we have an error.
        if (err) {
            let errorCode = 0x04; // slave device failure
            if (!isNaN(err.modbusErrorCode)) {
                errorCode = err.modbusErrorCode;
            }

            // Set an error response
            functionCode = parseInt(functionCode) | 0x80;
            responseBuffer = Buffer.alloc(3 + 2);
            responseBuffer.writeUInt8(errorCode, 2);

            _serverDebug("error processing response", unitID, functionCode);
        }

        // If we do not have a responseBuffer
        if (!responseBuffer) {
            _serverDebug("no response buffer", unitID, functionCode);
            return sockWriter(null, responseBuffer);
        }

        // add unit number and function code
        responseBuffer.writeUInt8(unitID, 0);
        responseBuffer.writeUInt8(functionCode, 1);

        // Add crc
        const crc = crc16(responseBuffer.slice(0, -2));
        responseBuffer.writeUInt16LE(crc, responseBuffer.length - 2);

        // Call callback function
        _serverDebug("server response", unitID, functionCode, responseBuffer);
        return sockWriter(null, responseBuffer);
    };
}

/**
 * Parse a ModbusRTU buffer and return an answer buffer.
 *
 * @param {Buffer} requestBuffer - request Buffer from client
 * @param {object} vector - vector of functions for read and write
 * @param {function} callback - callback to be invoked passing {Buffer} response
 * @param {object} options - the options object
 * @returns undefined
 * @private
 */
function _parseModbusBuffer(requestBuffer, vector, serverUnitID, sockWriter, options) {
    // Check requestBuffer length
    if (!requestBuffer || requestBuffer.length < ADDR_LEN) {
        modbusSerialDebug("wrong size of request Buffer " + requestBuffer.length);
        return;
    }

    const unitID = requestBuffer[0];
    let functionCode = requestBuffer[1];
    const crc = requestBuffer[requestBuffer.length - 2] + requestBuffer[requestBuffer.length - 1] * 0x100;

    // if crc is bad, ignore message
    if (crc !== crc16(requestBuffer.slice(0, -2))) {
        modbusSerialDebug("wrong CRC of request Buffer");
        return;
    }

    // if crc is bad, ignore message
    if (serverUnitID !== 255 && serverUnitID !== unitID) {
        modbusSerialDebug("wrong unitID");
        return;
    }

    modbusSerialDebug("request for function code " + functionCode);
    const cb = _callbackFactory(unitID, functionCode, sockWriter);

    switch (parseInt(functionCode)) {
        case 1:
        case 2:
            servertcp_handler.readCoilsOrInputDiscretes(requestBuffer, vector, unitID, cb, functionCode);
            break;
        case 3:
            if (options && options.enron) {
                servertcp_handler.readMultipleRegistersEnron(requestBuffer, vector, unitID, options.enronTables, cb);
            } else {
                servertcp_handler.readMultipleRegisters(requestBuffer, vector, unitID, cb);
            }
            break;
        case 4:
            servertcp_handler.readInputRegisters(requestBuffer, vector, unitID, cb);
            break;
        case 5:
            servertcp_handler.writeCoil(requestBuffer, vector, unitID, cb);
            break;
        case 6:
            if (options && options.enron) {
                servertcp_handler.writeSingleRegisterEnron(requestBuffer, vector, unitID, options.enronTables, cb);
            } else {
                servertcp_handler.writeSingleRegister(requestBuffer, vector, unitID, cb);
            }
            break;
        case 15:
            servertcp_handler.forceMultipleCoils(requestBuffer, vector, unitID, cb);
            break;
        case 16:
            servertcp_handler.writeMultipleRegisters(requestBuffer, vector, unitID, cb);
            break;
        case 17:
            servertcp_handler.reportServerID(requestBuffer, vector, unitID, cb);
            break;
        case 43:
            servertcp_handler.handleMEI(requestBuffer, vector, unitID, cb);
            break;
        default: {
            const errorCode = 0x01; // illegal function

            // set an error response
            functionCode = parseInt(functionCode) | 0x80;
            const responseBuffer = Buffer.alloc(3 + 2);
            responseBuffer.writeUInt8(errorCode, 2);

            modbusSerialDebug({
                error: "Illegal function",
                functionCode: functionCode
            });

            cb({ modbusErrorCode: errorCode }, responseBuffer);
        }
    }
}

class ServerSerial extends EventEmitter {
    /**
     * Class making ModbusRTU server.
     *
     * @param vector - vector of server functions (see examples/server.js)
     * @param options - server options (host (IP), port, debug (true/false), unitID, enron? (true/false), enronTables? (object))
     * @param serialportOptions - additional parameters for serialport options
     * @constructor
     */
    constructor(vector, options, serialportOptions) {
        super();

        const modbus = this;
        options = options || {};

        const optionsWithBinding = {
            path: options.path || options.port || PORT,
            baudRate: options.baudRate || options.baudrate || BAUDRATE,
            debug: options.debug || false,
            unitID: options.unitID || 255
        };

        const optionsWithSerialPortTimeoutParser = {
            maxBufferSize: options.maxBufferSize || 65536,
            interval: options.interval || 30
        };

        if (options.binding) optionsWithBinding.binding = options.binding;

        // Assign extra parameters in serialport
        const optionsWithBindingandSerialport = Object.assign({}, serialportOptions, optionsWithBinding);

        // create a serial server
        modbus._serverPath = new SerialPort(optionsWithBindingandSerialport);

        // create a serial server with a timeout parser
        modbus._server = modbus._serverPath.pipe(new serverserial_pipe_handler(optionsWithSerialPortTimeoutParser));

        // Open errors will be emitted as an error event
        modbus._server.on("error", function(err) {
            console.log("Error: ", err.message);
        });

        // create a server unit id
        const serverUnitID = options.unitID || UNIT_ID;

        // remember open sockets
        modbus.socks = new Map();

        modbus._server.on("open", function() {
            modbus.socks.set(modbus._server, 0);

            modbusSerialDebug({
                action: "connected"
                // address: sock.address(),
                // remoteAddress: sock.remoteAddress,
                // localPort: sock.localPort
            });

            modbus._server.on("close", function() {
                modbusSerialDebug({
                    action: "closed"
                });
                modbus.socks.delete(modbus._server);
            });

        });

        modbus._server.on("data", function(data) {
            let recvBuffer = Buffer.from([]);

            modbusSerialDebug({ action: "socket data", data: data });
            recvBuffer = Buffer.concat([recvBuffer, data], recvBuffer.length + data.length);

            while (recvBuffer.length > ADDR_LEN) {
                const requestBuffer = Buffer.alloc(recvBuffer.length);
                recvBuffer.copy(requestBuffer, 0, 0, recvBuffer.length);

                // Move receive buffer on
                recvBuffer = recvBuffer.slice(recvBuffer.length);

                const crc = crc16(requestBuffer.slice(0, -2));
                requestBuffer.writeUInt16LE(crc, requestBuffer.length - 2);

                modbusSerialDebug({ action: "receive", data: requestBuffer, requestBufferLength: requestBuffer.length });
                modbusSerialDebug(JSON.stringify({ action: "receive", data: requestBuffer }));

                const sockWriter = function(err, responseBuffer) {
                    if (err) {
                        console.error(err, responseBuffer);
                        modbus.emit("error", err);
                        return;
                    }

                    // send data back
                    if (responseBuffer) {
                        modbusSerialDebug({ action: "send", data: responseBuffer });
                        modbusSerialDebug(JSON.stringify({ action: "send string", data: responseBuffer }));

                        // write to port
                        (options.portResponse || modbus._serverPath).write(responseBuffer);
                    }
                };

                // parse the modbusRTU buffer
                setTimeout(
                    _parseModbusBuffer.bind(this,
                        requestBuffer,
                        vector,
                        serverUnitID,
                        sockWriter,
                        options
                    ),
                    0
                );
            }
        });

        modbus._server.on("error", function(err) {
            modbusSerialDebug(JSON.stringify({ action: "socket error", data: err }));

            modbus.emit("socketError", err);
        });

    }

    getPort() {
        return this._serverPath;
    }

    /**
    * Delegate the close server method to backend.
    *
    * @param callback
    */
    close(callback) {
        const modbus = this;

        // close the net port if exist
        if (modbus._server) {
            modbus._server.removeAllListeners("data");
            modbus._serverPath.close(callback);

            modbus.socks.forEach(function(e, sock) {
                sock.destroy();
            });

            modbusSerialDebug({ action: "close server" });
        } else {
            modbusSerialDebug({ action: "close server", warning: "server already closed" });
        }
    }
}

/**
 * ServerSerial interface export.
 * @type {ServerSerial}
 */
var serverserial = ServerSerial;

var modbusSerial = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2015-2017, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

/* Add bit operation functions to Buffer
 */
buffer_bit();
const { SerialPort } = dist;

const modbusSerialDebug = src("modbus-serial");


const EventEmitter = events.EventEmitter || events;

const PORT_NOT_OPEN_MESSAGE = "Port Not Open";
const PORT_NOT_OPEN_ERRNO = "ECONNREFUSED";

const BAD_ADDRESS_MESSAGE = "Bad Client Address";
const BAD_ADDRESS_ERRNO = "ECONNREFUSED";

const TRANSACTION_TIMED_OUT_MESSAGE = "Timed out";
const TRANSACTION_TIMED_OUT_ERRNO = "ETIMEDOUT";

const modbusErrorMessages = [
    "Unknown error",
    "Illegal function (device does not support this read/write function)",
    "Illegal data address (register not supported by device)",
    "Illegal data value (value cannot be written to this register)",
    "Slave device failure (device reports internal error)",
    "Acknowledge (requested data will be available later)",
    "Slave device busy (retry request again later)"
];

const PortNotOpenError = function() {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = PORT_NOT_OPEN_MESSAGE;
    this.errno = PORT_NOT_OPEN_ERRNO;
};

const BadAddressError = function() {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = BAD_ADDRESS_MESSAGE;
    this.errno = BAD_ADDRESS_ERRNO;
};

const TransactionTimedOutError = function() {
    this.name = this.constructor.name;
    this.message = TRANSACTION_TIMED_OUT_MESSAGE;
    this.errno = TRANSACTION_TIMED_OUT_ERRNO;
};

const SerialPortError = function() {
    this.name = this.constructor.name;
    this.message = null;
    this.errno = "ECONNREFUSED";
};

/**
 * @fileoverview ModbusRTU module, exports the ModbusRTU class.
 * this class makes ModbusRTU calls fun and easy.
 *
 * Modbus is a serial communications protocol, first used in 1979.
 * Modbus is simple and robust, openly published, royalty-free and
 * easy to deploy and maintain.
 */

/**
 * Parse the data for a Modbus -
 * Read Coils (FC=02, 01)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC2(data, next) {
    const length = data.readUInt8(2);
    const contents = [];

    for (let i = 0; i < length; i++) {
        let reg = data[i + 3];

        for (let j = 0; j < 8; j++) {
            contents.push((reg & 1) === 1);
            reg = reg >> 1;
        }
    }

    if (next)
        next(null, { "data": contents, "buffer": data.slice(3, 3 + length) });
}

/**
 * Parse the data for a Modbus -
 * Read Input Registers (FC=04, 03)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC3or4(data, next) {
    const length = data.readUInt8(2);
    const contents = [];

    for (let i = 0; i < length; i += 2) {
        const reg = data.readUInt16BE(i + 3);
        contents.push(reg);
    }

    if (next)
        next(null, { "data": contents, "buffer": data.slice(3, 3 + length) });
}

/**
 * Parse the data for a Modbus (Enron) -
 * Read Registers (FC=04, 03)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC3or4Enron(data, next) {
    const length = data.readUInt8(2);
    const contents = [];

    for (let i = 0; i < length; i += 4) {
        const reg = data.readUInt32BE(i + 3);
        contents.push(reg);
    }

    if (next)
        next(null, { "data": contents, "buffer": data.slice(3, 3 + length) });
}

/**
 * Parse the data for a Modbus -
 * Force Single Coil (FC=05)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC5(data, next) {
    const dataAddress = data.readUInt16BE(2);
    const state = data.readUInt16BE(4);

    if (next)
        next(null, { "address": dataAddress, "state": (state === 0xff00) });
}

/**
 * Parse the data for a Modbus -
 * Preset Single Registers (FC=06)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC6(data, next) {
    const dataAddress = data.readUInt16BE(2);
    const value = data.readUInt16BE(4);

    if (next)
        next(null, { "address": dataAddress, "value": value });
}

/**
 * Parse the data for a Modbus (Enron) -
 * Preset Single Registers (FC=06)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC6Enron(data, next) {
    const dataAddress = data.readUInt16BE(2);
    const value = data.readUInt32BE(4);

    if (next)
        next(null, { "address": dataAddress, "value": value });
}

/**
 * Parse the data for a Modbus -
 * Preset Multiple Registers (FC=15, 16)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC16(data, next) {
    const dataAddress = data.readUInt16BE(2);
    const length = data.readUInt16BE(4);

    if (next)
        next(null, { "address": dataAddress, "length": length });
}

/**
 * Parse the data for a Modbus -
 * Report server ID (FC=17)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC17(data, next) {
    const length = parseInt(data.readUInt8(2));
    const serverId = parseInt(data.readUInt8(3));
    const running = data.readUInt8(4) === 0xFF;
    let additionalData;
    if (length > 2) {
        additionalData = Buffer.alloc(length - 2);
        // copy additional data
        data.copy(additionalData, 0, 5, data.length - 2);
    } else {
        additionalData = Buffer.alloc(0);
    }

    if (next)
        next(null, { serverId: serverId, running: running, additionalData: additionalData });
}

/**
 * Parse  the data fro Modbus -
 * Read File Records
 *
 * @param {Buffer4} buffer
 * @param {Function} next
 */
function _readFC20(data,  next) {
    const fileRespLength = parseInt(data.readUInt8(2));
    const result = [];
    for (let i = 5; i < fileRespLength + 5; i++) {
        const reg = data.readUInt8(i);
        result.push(reg);
    }
    if(next)
        next(null, { "data": result, "length": fileRespLength });
}

/**
 * Parse the data for a Modbus -
 * Read Device Identification (FC=43)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Modbus} modbus the client in case we need to read more device information
 * @param {Function} next the function to call next.
 */
function _readFC43(data, modbus, next) {
    const address = parseInt(data.readUInt8(0));
    const readDeviceIdCode = parseInt(data.readUInt8(3));
    const conformityLevel = parseInt(data.readUInt8(4));
    const moreFollows = parseInt(data.readUInt8(5));
    const nextObjectId = parseInt(data.readUInt8(6));
    const numOfObjects = parseInt(data.readUInt8(7));

    let startAt = 8;
    const result = {};
    for (let i = 0; i < numOfObjects; i++) {
        const objectId = parseInt(data.readUInt8(startAt));
        const objectLength = parseInt(data.readUInt8(startAt + 1));
        const startOfData = startAt + 2;
        result[objectId] = data.toString("ascii", startOfData, startOfData + objectLength);
        startAt = startOfData + objectLength;
    }

    // is it saying to follow and did you previously get data
    // if you did not previously get data go ahead and halt to prevent an infinite loop
    if (moreFollows && numOfObjects) {
        const cb = function(err, data) {
            data.data = Object.assign(data.data, result);
            return next(err, data);
        };
        modbus.writeFC43(address, readDeviceIdCode, nextObjectId, cb);
    } else if (next) {
        next(null, { data: result, conformityLevel });
    }
}

/**
 * Wrapper method for writing to a port with timeout. <code><b>[this]</b></code> has the context of ModbusRTU
 * @param {Buffer} buffer The data to send
 * @private
 */
function _writeBufferToPort(buffer, transactionId) {
    const transaction = this._transactions[transactionId];

    if (transaction) {
        transaction._timeoutFired = false;
        transaction._timeoutHandle = _startTimeout(this._timeout, transaction);

        // If in debug mode, stash a copy of the request payload
        if (this._debugEnabled) {
            transaction.request = Uint8Array.prototype.slice.call(buffer);
            transaction.responses = [];
        }
    }

    this._port.write(buffer);
}

/**
 * Starts the timeout timer with the given duration.
 * If the timeout ends before it was cancelled, it will call the callback with an error.
 * @param {number} duration the timeout duration in milliseconds.
 * @param {Function} next the function to call next.
 * @return {number} The handle of the timeout
 * @private
 */
function _startTimeout(duration, transaction) {
    if (!duration) {
        return undefined;
    }
    return setTimeout(function() {
        transaction._timeoutFired = true;
        if (transaction.next) {
            const err = new TransactionTimedOutError();
            if (transaction.request && transaction.responses) {
                err.modbusRequest = transaction.request;
                err.modbusResponses = transaction.responses;
            }
            transaction.next(err);
        }
    }, duration);
}

/**
 * Cancel the given timeout.
 *
 * @param {number} timeoutHandle The handle of the timeout
 * @private
 */
function _cancelTimeout(timeoutHandle) {
    clearTimeout(timeoutHandle);
}

/**
 * Handle incoming data from the Modbus port.
 *
 * @param {Buffer} data The data received
 * @private
 */
function _onReceive(data) {
    const modbus = this;
    let error;

    // set locale helpers variables
    const transaction = modbus._transactions[modbus._port._transactionIdRead];

    // the _transactionIdRead can be missing, ignore wrong transaction it's
    if (!transaction) {
        return;
    }

    if (transaction.responses) {
        /* Stash what we received */
        transaction.responses.push(Uint8Array.prototype.slice.call(data));
    }

    /* What do we do next? */
    const next = function(err, res) {
        if (transaction.next) {
            /* Include request/response data if enabled */
            if (transaction.request && transaction.responses) {
                if (err) {
                    err.modbusRequest = transaction.request;
                    err.modbusResponses = transaction.responses;
                }

                if (res) {
                    res.request = transaction.request;
                    res.responses = transaction.responses;
                }
            }

            /* Pass the data on */
            return transaction.next(err, res);
        }
    };

    /* cancel the timeout */
    _cancelTimeout(transaction._timeoutHandle);
    transaction._timeoutHandle = undefined;

    /* check if the timeout fired */
    if (transaction._timeoutFired === true) {
        // we have already called back with an error, so don't generate a new callback
        return;
    }

    /* check incoming data
     */

    /* check minimal length
     */
    if (!transaction.lengthUnknown && data.length < 5) {
        error = "Data length error, expected " +
            transaction.nextLength + " got " + data.length;
        next(new Error(error));
        return;
    }

    /* check message CRC
     * if CRC is bad raise an error
     */
    const crcIn = data.readUInt16LE(data.length - 2);
    if (crcIn !== crc16(data.slice(0, -2))) {
        error = "CRC error";
        next(new Error(error));
        return;
    }

    // if crc is OK, read address and function code
    const address = data.readUInt8(0);
    const code = data.readUInt8(1);

    /* check for modbus exception
     */
    if (data.length >= 5 &&
        code === (0x80 | transaction.nextCode)) {
        const errorCode = data.readUInt8(2);
        if (transaction.next) {
            error = new Error("Modbus exception " + errorCode + ": " + (modbusErrorMessages[errorCode] || "Unknown error"));
            error.modbusCode = errorCode;
            next(error);
        }
        return;
    }

    /* check enron options are valid
     */
    if (modbus._enron) {
        const example = {
            enronTables: {
                booleanRange: [1001, 1999],
                shortRange: [3001, 3999],
                longRange: [5001, 5999],
                floatRange: [7001, 7999]
            }
        };

        if (typeof modbus._enronTables === "undefined" ||
                modbus._enronTables.shortRange.length !== 2 ||
                modbus._enronTables.shortRange[0] >= modbus._enronTables.shortRange[1]) {
            next(new Error("Enron table definition missing from options. Example: " + JSON.stringify(example)));
            return;
        }
    }

    /* check message length
     * if we do not expect this data
     * raise an error
     */
    if (!transaction.lengthUnknown && data.length !== transaction.nextLength) {
        error = "Data length error, expected " +
            transaction.nextLength + " got " + data.length;
        next(new Error(error));
        return;
    }

    /* check message address
     * if we do not expect this message
     * raise an error
     */
    if (address !== transaction.nextAddress) {
        error = "Unexpected data error, expected " +
              "address " + transaction.nextAddress + " got " + address;
        if (transaction.next)
            next(new Error(error));
        return;
    }

    /* check message code
     * if we do not expect this message
     * raise an error
     */
    if (code !== transaction.nextCode) {
        error = "Unexpected data error, expected " +
            "code " + transaction.nextCode + " got " + code;
        if (transaction.next)
            next(new Error(error));
        return;
    }

    /* parse incoming data
     */

    switch (code) {
        case 1:
        case 2:
            // Read Coil Status (FC=01)
            // Read Input Status (FC=02)
            _readFC2(data, next);
            break;
        case 3:
        case 4:
            // Read Input Registers (FC=04)
            // Read Holding Registers (FC=03)
            if (modbus._enron && !(transaction.nextDataAddress >= modbus._enronTables.shortRange[0] && transaction.nextDataAddress <= modbus._enronTables.shortRange[1])) {
                _readFC3or4Enron(data, next);
            } else {
                _readFC3or4(data, next);
            }
            break;
        case 5:
            // Force Single Coil
            _readFC5(data, next);
            break;
        case 6:
            // Preset Single Register
            if (modbus._enron && !(transaction.nextDataAddress >= modbus._enronTables.shortRange[0] && transaction.nextDataAddress <= modbus._enronTables.shortRange[1])) {
                _readFC6Enron(data, next);
            } else {
                _readFC6(data, next);
            }
            break;
        case 15:
        case 16:
            // Force Multiple Coils
            // Preset Multiple Registers
            _readFC16(data, next);
            break;
        case 17:
            _readFC17(data, next);
            break;
        case 20:
            _readFC20(data, transaction.next);
            break;
        case 43:
            // read device identification
            _readFC43(data, modbus, next);
    }
}

/**
 * Handle SerialPort errors.
 *
 * @param {Error} error The error received
 * @private
 */
function _onError(e) {
    const err = new SerialPortError();
    err.message = e.message;
    err.stack = e.stack;
    this.emit("error", err);
}

class ModbusRTU extends EventEmitter {
    /**
     * Class making ModbusRTU calls fun and easy.
     *
     * @param {SerialPort} port the serial port to use.
     */
    constructor(port) {
        super();

        // the serial port to use
        this._port = port;

        // state variables
        this._transactions = {};
        this._timeout = null; // timeout in msec before unanswered request throws timeout error
        this._unitID = 1;

        // Flag to indicate whether debug mode (pass-through of raw
        // request/response) is enabled.
        this._debugEnabled = false;

        this._onReceive = _onReceive.bind(this);
        this._onError = _onError.bind(this);
    }

    /**
     * Open the serial port and register Modbus parsers
     *
     * @param {Function} callback the function to call next on open success
     *      of failure.
     */
    open(callback) {
        const modbus = this;

        // open the serial port
        modbus._port.open(function(error) {
            if (error) {
                modbusSerialDebug({ action: "port open error", error: error });
                /* On serial port open error call next function */
                if (callback)
                    callback(error);
            } else {
                /* init ports transaction id and counter */
                modbus._port._transactionIdRead = 1;
                modbus._port._transactionIdWrite = 1;

                /* On serial port success
                 * (re-)register the modbus parser functions
                 */
                modbus._port.removeListener("data", modbus._onReceive);
                modbus._port.on("data", modbus._onReceive);

                /* On serial port error
                 * (re-)register the error listener function
                 */
                modbus._port.removeListener("error", modbus._onError);
                modbus._port.on("error", modbus._onError);

                /* Hook the close event so we can relay it to our callers. */
                modbus._port.once("close", modbus.emit.bind(modbus, "close"));

                /* On serial port open OK call next function with no error */
                if (callback)
                    callback(error);
            }
        });
    }

    get isDebugEnabled() {
        return this._debugEnabled;
    }

    set isDebugEnabled(enable) {
        enable = Boolean(enable);
        this._debugEnabled = enable;
    }

    get isOpen() {
        if (this._port) {
            return this._port.isOpen;
        }

        return false;
    }

    /**
     * Close the serial port
     *
     * @param {Function} callback the function to call next on close success
     *      or failure.
     */
    close(callback) {
        // close the serial port if exist
        if (this._port) {
            this._port.removeAllListeners("data");
            this._port.close(callback);
        } else {
            // nothing needed to be done
            callback();
        }
    }

    /**
     * Destroy the serial port
     *
     * @param {Function} callback the function to call next on close success
     *      or failure.
     */
    destroy(callback) {
        // close the serial port if exist and it has a destroy function
        if (this._port && this._port.destroy) {
            this._port.removeAllListeners("data");
            this._port.destroy(callback);
        } else {
            // nothing needed to be done
            callback();
        }
    }

    /**
     * Write a Modbus "Read Coil Status" (FC=01) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first coil.
     * @param {number} length the total number of coils requested.
     * @param {Function} next the function to call next.
     */
    writeFC1(address, dataAddress, length, next) {
        this.writeFC2(address, dataAddress, length, next, 1);
    }

    /**
     * Write a Modbus "Read Input Status" (FC=02) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first digital input.
     * @param {number} length the total number of digital inputs requested.
     * @param {Function} next the function to call next.
     */
    writeFC2(address, dataAddress, length, next, code) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        // function code defaults to 2
        code = code || 2;

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            nextLength: 3 + parseInt((length - 1) / 8 + 1) + 2,
            next: next
        };

        const codeLength = 6;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);
        buf.writeUInt16BE(length, 4);

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Read Holding Registers" (FC=03) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first register.
     * @param {number} length the total number of registers requested.
     * @param {Function} next the function to call next.
     */
    writeFC3(address, dataAddress, length, next) {
        this.writeFC4(address, dataAddress, length, next, 3);
    }

    /**
     * Write a Modbus "Read Input Registers" (FC=04) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first register.
     * @param {number} length the total number of registers requested.
     * @param {Function} next the function to call next.
     */
    writeFC4(address, dataAddress, length, next, code) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        // function code defaults to 4
        code = code || 4;

        let valueSize = 2;
        if (this._enron && !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])) {
            valueSize = 4;
        }

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextDataAddress: dataAddress,
            nextCode: code,
            nextLength: 3 + (valueSize * length) + 2,
            next: next
        };

        const codeLength = 6;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);
        buf.writeUInt16BE(length, 4);

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Force Single Coil" (FC=05) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the coil.
     * @param {number} state the boolean state to write to the coil (true / false).
     * @param {Function} next the function to call next.
     */
    writeFC5(address, dataAddress, state, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        const code = 5;

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            nextLength: 8,
            next: next
        };

        const codeLength = 6;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);

        if (state) {
            buf.writeUInt16BE(0xff00, 4);
        } else {
            buf.writeUInt16BE(0x0000, 4);
        }

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Preset Single Register " (FC=6) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the register.
     * @param {number} value the value to write to the register.
     * @param {Function} next the function to call next.
     */
    writeFC6(address, dataAddress, value, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        const code = 6;

        let valueSize = 8;
        if (this._enron && !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])) {
            valueSize = 10;
        }

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextDataAddress: dataAddress,
            nextCode: code,
            nextLength: valueSize,
            next: next
        };

        let codeLength = 6; // 1B deviceAddress + 1B functionCode + 2B dataAddress + (2B value | 4B value (enron))
        if (this._enron && !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])) {
            codeLength = 8;
        }

        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);

        if (Buffer.isBuffer(value)) {
            value.copy(buf, 4);
        } else if (this._enron && !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])) {
            buf.writeUInt32BE(value, 4);
        } else {
            buf.writeUInt16BE(value, 4);
        }

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Force Multiple Coils" (FC=15) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first coil.
     * @param {Array} array the array of boolean states to write to coils.
     * @param {Function} next the function to call next.
     */
    writeFC15(address, dataAddress, array, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        const code = 15;
        let i = 0;

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            nextLength: 8,
            next: next
        };

        const dataBytes = Math.ceil(array.length / 8);
        const codeLength = 7 + dataBytes;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);
        buf.writeUInt16BE(array.length, 4);
        buf.writeUInt8(dataBytes, 6);

        // clear the data bytes before writing bits data
        for (i = 0; i < dataBytes; i++) {
            buf.writeUInt8(0, 7 + i);
        }

        for (i = 0; i < array.length; i++) {
            // buffer bits are already all zero (0)
            // only set the ones set to one (1)
            if (array[i]) {
                buf.writeBit(1, i, 7);
            }
        }

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Preset Multiple Registers" (FC=16) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first register.
     * @param {Array} array the array of values to write to registers.
     * @param {Function} next the function to call next.
     */
    writeFC16(address, dataAddress, array, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        // sanity check
        if (typeof address === "undefined" || typeof dataAddress === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }

        const code = 16;

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            nextLength: 8,
            next: next
        };

        let dataLength = array.length;
        if (Buffer.isBuffer(array)) {
            // if array is a buffer it has double length
            dataLength = array.length / 2;
        }

        const codeLength = 7 + 2 * dataLength;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt16BE(dataAddress, 2);
        buf.writeUInt16BE(dataLength, 4);
        buf.writeUInt8(dataLength * 2, 6);

        // copy content of array to buf
        if (Buffer.isBuffer(array)) {
            array.copy(buf, 7);
        } else {
            for (let i = 0; i < dataLength; i++) {
                buf.writeUInt16BE(array[i], 7 + 2 * i);
            }
        }

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Report Server ID" (FC=17) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {Function} next the function to call next.
     */
    writeFC17(address, da, l, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        const code = 17;

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            lengthUnknown: true,
            next: next
        };

        const codeLength = 2;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);

        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);

        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }


    /**
     * Write  mODBUS "Read Device Identification" (FC=20) to serial port
     * @param {number} address the slave unit address.
     * @param {Function} next;
     */
    writeFC20(address, fileNumber, recordNumber, next) {
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }
        // sanity check
        if (typeof address === "undefined") {
            if (next) next(new BadAddressError());
            return;
        }
        // function code defaults to 20
        const code = 20;
        const codeLength = 10;
        const byteCount = 7;
        const chunck = 100;

        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            lengthUnknown: true,
            next: next
        };
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes
        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt8(byteCount, 2);
        buf.writeUInt8(6, 3); // ReferenceType
        buf.writeUInt16BE(fileNumber, 4);
        buf.writeUInt16BE(recordNumber, 6);
        buf.writeUInt8(chunck, 9);
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }

    /**
     * Write a Modbus "Read Device Identification" (FC=43) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} deviceIdCode the read device access code.
     * @param {number} objectId the array of values to write to registers.
     * @param {Function} next the function to call next.
     */
    writeFC43(address, deviceIdCode, objectId, next) {
        // check port is actually open before attempting write
        if (this.isOpen !== true) {
            if (next) next(new PortNotOpenError());
            return;
        }

        const code = 0x2B; // 43

        // set state variables
        this._transactions[this._port._transactionIdWrite] = {
            nextAddress: address,
            nextCode: code,
            lengthUnknown: true,
            next: next
        };
        const codeLength = 5;
        const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes
        buf.writeUInt8(address, 0);
        buf.writeUInt8(code, 1);
        buf.writeUInt8(0x0E, 2); // 16 MEI Type
        buf.writeUInt8(deviceIdCode, 3);
        buf.writeUInt8(objectId, 4);
        // add crc bytes to buffer
        buf.writeUInt16LE(crc16(buf.slice(0, -2)), codeLength);
        // write buffer to serial port
        _writeBufferToPort.call(this, buf, this._port._transactionIdWrite);
    }
}

// add the connection shorthand API
connection(ModbusRTU);

// add the promise API
promise(ModbusRTU);

// add worker API
worker(ModbusRTU);

// exports
module.exports = ModbusRTU;

module.exports.getPorts = function getPorts() {
    return SerialPort.list();
};

module.exports.TestPort = testport;
try {
    module.exports.RTUBufferedPort = rtubufferedport;
} catch (err) { }
module.exports.TcpPort = tcpport;
module.exports.TcpRTUBufferedPort = tcprtubufferedport;
module.exports.TelnetPort = telnetport;
module.exports.C701Port = c701port;

module.exports.ServerTCP = servertcp;
module.exports.ServerSerial = serverserial;
module.exports.default = module.exports;
});

const formidable = src$1;
//import {readChunkSync} from 'read-chunk' //https://www.npmjs.com/package/read-chunk
function readChunkSync(filePath, {length, startPosition}) {
    console.log("top of readChunkSync with filePath: " + filePath +
                " length: " + length + " startPosition: " + startPosition);
    console.log("Buffer: " + Buffer);
    let buffer = Buffer.alloc(length);
    console.log("got buffer: " + buffer);
    console.log("got fs.openSync: " + fs.openSync);
    const fileDescriptor = fs.openSync(filePath, 'r');
    console.log("got fileDescriptor: " + fileDescriptor);
    try {
        const bytesRead = fs.readSync(fileDescriptor, buffer, {
            length,
            position: startPosition,
        });

        if (bytesRead < length) {
            buffer = buffer.slice(0, bytesRead);
        }

        return buffer;
    } finally {
        fs.closeSync(fileDescriptor);
    }
}



//dde4 replaced the below requires with the above imports
/*
var http = require('http'); 
var url = require('url'); //url parsing
var formidable = require('formidable');
var fs = require('fs'); //file system
var net = require('net'); //network
const ws = require('ws'); //websocket
const path = require('path'); //parse path / file / extension
const { spawn } = require('child_process'); //see top of file
*/
// https://github.com/websockets/ws 
//install with:
//npm install --save ws 
//on Dexter, if httpd.js is going to be in the /srv/samba/share/ folder, 
//install ws there but then run it from root. e.g. 
//cd /srv/samba/share/ 
//npm install --save ws 
//cd /
//node /srv/samba/share/httpd.js 

//var mime = require('mime'); //translate extensions into mime types
//skip that,it's stupidly big
var mimeTypes = {
  "css":  "text/css",
  "html": "text/html",
  "gif":  "image/gif",
  "jpeg": "image/jpeg",
  "jpg":  "image/jpeg",
  "js":   "text/javascript",
  "mjs":  "text/javascript", //new for dde4 https://github.com/google/WebFundamentals/issues/7549
  "mp3":  "audio/mpeg",
  "mp4":  "video/mp4",
  "png":  "image/png",
  "ico":  "image/x-icon",
  "svg":  "image/svg+xml",
  "txt":  "text/plain"
  };

//Code that runs in node_server AND job_engine for get_page

function compute_share_folder(){
    if(running_on_dexter()) {
        return SHARE_FOLDER_ON_DEXTER
    }
    else {
        return path.join(process.cwd()) //dde4, ie the folder that httpd.mjs is in.
    }
}

function compute_www_folder(){ //contains httpd.mjs, index.html for the dexter apps titles
    return SHARE_FOLDER + "/www"
}

function compute_dde_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
    if(running_on_dexter()) {
        return  WWW_FOLDER + "/dde"  //'/root/Documents/dde'
    }
    else {
        return path.join(process.cwd(), 'dde')
    }
}

function compute_dde_install_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
   return DDE_FOLDER + "/build"
}

function compute_cal_data_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
    return SHARE_FOLDER + "/cal_data"
}

function compute_dde_apps_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
    if(running_on_dexter()) { return SHARE_FOLDER + '/dde_apps' }
    else {
        return os.homedir()  //example: "/Users/Fry"
               + "/Documents/dde_apps"
    }
}

const SHARE_FOLDER_ON_DEXTER = "/srv/samba/share";
function running_on_dexter() { //dde4 added
    return fs.existsSync(SHARE_FOLDER_ON_DEXTER)
}                                                       // folder on dexter   contains                                                        folder on Mac dev
const SHARE_FOLDER       = compute_share_folder();       //  /srv/samba/share               //contains dde_apps, www, dde3_je,
const WWW_FOLDER         = compute_www_folder();         //  /srv/samba/share/www           //contains dde, httpd.mjs, index.html(tiles), jobs.html(3 & 4)   dde4, contains dde httpd.mjs, index.html(tiles)jobs.html(3 & 4)
const DDE_FOLDER         = compute_dde_folder();         //  /srv/samba/share/www/dde       //contains build/, index.html(dde),              dde  contains build, index.html(dde),
const DDE_INSTALL_FOLDER = compute_dde_install_folder(); //  /srv/samba/share/www/dde/build //contains bundle.mjs, bundle_je.mjs                         dde/build contains bundle.mjs bundle_je.mjs
const CAL_DATA_FOLDER    = compute_cal_data_folder();    //  /srv/samba/share/cal_data      //will contain Defaults.make_ins
const DDE_APPS_FOLDER    = compute_dde_apps_folder();    //  /srv/samba/share/dde_apps or homedir/Documents/dde_apps                           homedir/Documents/dde_apps

console.log("SHARE_FOLDER:        " + SHARE_FOLDER +
          "\nDDE_FOLDER:          " + DDE_FOLDER   +
          "\nWWW_FOLDER:          " + WWW_FOLDER   +
          "\nDDE_INSTALL_FOLDER:  " + DDE_INSTALL_FOLDER +
          "\nCAL_DATA_FOLDER      " + CAL_DATA_FOLDER +
          "\nDDE_APPS_FOLDER:     " + DDE_APPS_FOLDER);

function make_full_path(path){ //dde4 added
    if(path.startsWith("/")) ; //keep path as is
    else if (path === "dde_apps") {
        path = DDE_APPS_FOLDER;  //does not contain final slash
    }
    else if (path.startsWith("dde_apps/")){
        path = path.substring(9); //strip off "dde_apps/"
        path = DDE_APPS_FOLDER + "/" + path;
    }
    else if(path.startsWith("dde/")) {
        path = DDE_FOLDER + "/" + path.substring(4); //cut off the "dde/" prefix or else we'll get two dde folders in the resulting path
    }
    else {
        path = SHARE_FOLDER + "/" + path;
    }
    return path
}
//end of Code that runs in node_server AND job_engine for get_page


//const { spawn } = require('child_process'); //see top of file
 /*
var job_name_to_process = {};
function get_job_name_to_process(job_name) {
     console.log("get_job_name_to_process passed: " + job_name)
     if(job_name_to_process.keep_alive) { //if there is such a process, then keep_alive is true
     	return job_name_to_process.keep_alive;
     }
     else {
        return job_name_to_process[job_name];
     }
}
function set_job_name_to_process(job_name, process) { job_name_to_process[job_name] = process }
function remove_job_name_to_process(job_name) { delete job_name_to_process[job_name] }

function kill_all_job_processes(){
    for (let key of Object.keys(job_name_to_process)){
        let proc = job_name_to_process[key]
        proc.kill()
        remove_job_name_to_process(key)
    }
}
*/
var job_process = null;

function kill_job_process(browser_socket){
    if(job_process) {
        job_process.kill();
        job_process = null;
        out_to_browser_out_pane(browser_socket, "_______Job Process Ended________", "red");
    }
    //else {} job_process should already be dead. Don't print the "Job Process Ended" message twice
    //color_job_process_button(browser_socket)
}

//was make_or_kill_job_process
function make_job_process(browser_socket) {
    console.log("top of make_job_process with job_process: " + job_process);
    if (!job_process){
        console.log("in make_job_process, spawning a new process");
        let node_arg_for_debug = (debug_value ? " --inspect-brk " : "");
        let cmd_line = 'node --experimental-fetch' + node_arg_for_debug;
        let cmd_args =   ["bundleje.mjs start_je_process"];
        let cmd_options = {cwd: DDE_INSTALL_FOLDER, shell: true, stdio: ['ipc']};
        console.log("spawn\n    cmd_line: " + cmd_line + "\n    cmd_args: " + cmd_args + "\n    cmd_options: " + JSON.stringify(cmd_options) ); //+ " &") //ampersand runs node as a background process
        console.log("in make_job_process setting job_process to result of spawn call");
        job_process = spawn(cmd_line,
                            cmd_args,
                            cmd_options);
        //color_job_process_button(browser_socket)
        console.log("just spawned job_process: " + job_process + " pid: " + job_process.pid);
        console.log("job_process type: " + job_process.constructor.name);

        job_process.on('spawn', function() {
            console.log("make_job_process spawned successfully");
        });

        //https://stackoverflow.com/questions/34208614/how-to-catch-an-enoent-with-nodejs-child-process-spawn
        job_process.on('error', function(err) {
            console.log("make_job_process failed to spawn a new job process: " + err);
        });

        job_process.on('message', function(data_obj) {
            let data_str = JSON.stringify(data_obj);
            if (browser_socket.readyState != websocket.OPEN) {
                  console.log("in server job_process on message readyState NOT open passed data_obj: " + JSON.stringify(data_obj));
                 /*kill_job_process(browser_socket);
                 let data_obj = {
                    kind: "job_process_button",
                    button_tooltip: "There is no job process.",
                    button_color: rgb(200, 200, 200)
                }
                browser_socket.send(data_str);
                browser_socket.send(JSON.stringify(data_obj))
                  */
            }
            else if (data_obj.kind == "out_call") {
                browser_socket.send(data_str);
            }
            else if(data_obj.kind == "get_dde_version") {
                console.log("make_job_process on message get_dde_version sending to browser: " + data_str);
                browser_socket.send(data_str);
                if(!keep_alive_value) { kill_job_process(browser_socket); }
            }
            else if(data_obj.kind == "eval_result") {
                browser_socket.send(data_obj.val_html);
                if(!keep_alive_value) { kill_job_process(browser_socket); }
            }
            else if(data_obj.kind == "all_jobs_finished"){
                if(!keep_alive_value) { kill_job_process(browser_socket); }
            }
            else if(data_obj.kind == "show_job_button") {
                console.log("make_job_process on message got show_job_button, sending " + JSON.stringify(data_obj));
                browser_socket.send(data_str);
            }
            else {
                browser_socket.send(data_str);
            }
        });
        job_process.stderr.on('data', function(data) {
            let data_str = data.toString();
            console.log("in node_server after spawn, got error: " + data_str);
            if(data_str.includes("ExperimentalWarning:"));
            else if(data_str.includes("Waiting for the debugger to disconnect")) ;
            else if(data_str.includes("Debugger attached")) ;
            else if(data_str.includes("Debugger listening on")) ;
            else {
                console.log("\n\nserver make_job_process got stderr with data: " + data_str);
                //remove_job_name_to_process(job_name) //just because there is an error, that don't mean the job closed.
                //server_response.write("Job." + job_name + " errored with: " + data)
                console.log('\n\nAbout to stringify 2\n');
                let lit_obj = {
                    kind: "job_process_button",
                    button_tooltip: "Server errored with: " + data_str,
                    button_color: "red"
                };
                if (browser_socket.readyState != websocket.OPEN) {
                    job_process.kill(); //job_process.exit(0)
                    return;
                } //maybe should be kill()?
                browser_socket.send(data_str); //redundant but the below might not be working
                browser_socket.send("<for_server>" + JSON.stringify(lit_obj) + "</for_server>\n");
                //server_response.end()
                //job_process.kill() //*probably* the right thing to do in most cases.
                //remove_job_name_to_process(job_name);
                //BUT even with Node v 18, it sends to stderr:
                // " ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time"
                //so we don't want to kill the process just for that.
            }
        });
        job_process.on('close', function(code) {
            console.log("\n\nServer closed the process.");
            if((code !== 0) && (code !== null) && browser_socket.readyState === websocket.OPEN){
                console.log('\n\nAbout to stringify 3\n');
                let lit_obj = {
                    kind: "job_process_button",
                    button_tooltip: "Errored with server close error code: " + code,
                    button_color: "red"
                };
                browser_socket.send("<for_server>" + JSON.stringify(lit_obj) + "</for_server>\n");
            }
            //server_response.end()
        });
        //www.geeksforgeeks.org/node-js-process-exit-event/  ie this method is called
        //when job_process.exit() is called.
        job_process.on('exit', function(code) { //do I really need to handle this?
                setTimeout(function() {
                    console.log("\n\nServer on exit the process.");
                    kill_job_process(browser_socket);
                    },
                    3000);
        }
        );
        out_to_browser_out_pane(browser_socket, "_______Job Process Started________", "green");
    }
    else {
        console.log("in make_job_process, job_process already exists.");
    }
}
//arg looks like "myjob.js", "myjob.dde", "myjob"
function extract_job_name(job_name_with_extension){
    if(job_name_with_extension.endsWith(".dde")) {
        return job_name_with_extension.substring(0, job_name_with_extension.length - 4)
    }
    else if (job_name_with_extension.endsWith(".js")) {
        return job_name_with_extension.substring(0, job_name_with_extension.length - 3)
    }
    else { return job_name_with_extension}
}


//https://www.npmjs.com/package/ws
console.log("now making wss");
const wss = new websocketServer({port: 3001});    //server: http_server });
console.log("done making wss: " + wss);


/*
function color_job_process_button(browser_socket) {
    console.log("top of color_job_process_button with job_process: " + job_process)
    let lit_obj = { kind: "job_process_button"}
    if (job_process) {
            lit_obj.button_tooltip = "Job process started."
            lit_obj.button_color = "rgb(136, 255, 136)"
    }
    else {
        lit_obj.button_tooltip = "There is no job process."
        lit_obj.button_color = "rgb(200, 200, 200)"
    }
    let data_str = JSON.stringify(lit_obj)
    //browser_socket.send(data_str) //redundant but the below might not be working
    browser_socket.send("<for_server>" + data_str + "</for_server>\n");
}*/

function serve_init_jobs(q, req, res){
    //console.log("top of serve_init_jobs in server")
    fs.readdir(DDE_APPS_FOLDER,
        function(err, items){
            console.log('serve_init_jobs callback writing labels for job buttons');
            let items_str = JSON.stringify(items);
            //console.log("serve_init_jobs writing: " + items_str)
            res.write(items_str);
            res.end();
        });
}

function serve_job_button_click(browser_socket, mess_obj){
    console.log("top of serve_job_button_click with job_process: " + job_process);
    let app_file = mess_obj.job_name_with_extension; //includes ".js" suffix 
    //out("\n\nserve_job_button_click for:" + app_file);
    console.log("\nserve_job_button_click mess_obj:\n" + JSON.stringify(mess_obj));
    let app_type = path.extname(app_file);
    console.log("app_type: " + app_type);
    if (-1!=[".dde",".js"].indexOf(app_type)) { app_type = ".dde"; }//if this is a job engine job
    if (!app_file.startsWith("/")) ; //q.search.substr(1)
    //out("serve_job_button_click with jobfile: " + jobfile)
    let job_name = extract_job_name(app_file); //console.log("job_name: " + job_name + "taken from file name")
    console.log("job_name: " + job_name);
    console.log("job_process defined?: "   + globalThis.job_process);
    if(!job_process) {
        make_job_process(browser_socket);
    }
    else {
        console.log("in serve_job_button_click already got a process");
    }
    if (".dde" == app_type) { //job engine job
      //code = "Job." + job_name + ".server_job_button_click()"
      //e.g. `web_socket.send(JSON.stringify({"job_name_with_extension": "dexter_message_interface.dde", "ws_message": "goodbye" }))`
        if (mess_obj.ws_message ) { // {"job_name_with_extension": jobname.dde, "ws_message": data}
          //code = 'Job.'+job_name+'.user_data.ws_message = "' + mess_obj.ws_message  + '"'
          `Job.`+job_name+`.user_data.ws_message = '` + JSON.stringify(mess_obj.ws_message)  + `'\n`;
          }
        else if (mess_obj.code) {
          mess_obj.code + "\n";
        }
        else ;
    }
    else { // something else, probably bash
   //     code = mess_obj.ws_message  + "\n";\
        shouldnt("In serve_job_button_click with non-job app_type: " + app_type);
   }
    //console.log("serve_job_button_click writing to job: " + job_name + " stdin: " + code);
    //https://stackoverflow.com/questions/13230370/nodejs-child-process-write-to-stdin-from-an-already-initialised-process
    console.log("in serve_job_button_click with job_process: " + job_process);
    //job_process.stdin.setEncoding('utf-8');
    //job_process.stdin.write(code);
    //job_process.stdin.end();
    mess_obj.keep_live_value = keep_alive_value;
    console.log("sending to job_process: " + JSON.stringify(mess_obj));
    job_process.send(mess_obj);
}

function serve_get_dde_version(browser_socket, mess_obj){
    console.log("top of serve_get_dde_version");
    if(!job_process) {
        make_job_process(browser_socket);
    }
    else {
        console.log("in serve_get_dde_version already got a process");
    }
    mess_obj.keep_live_value = keep_alive_value;
    job_process.send(mess_obj);
}

//handles hitting ENTER in the cmd_input type in
function serve_eval_button_click(browser_socket, message){
    console.log("top of serve_eval_button_click with message: " + message);
    let mess_obj = JSON.parse(message);
    out_to_browser_out_pane(browser_socket, "Evaling: " + mess_obj.code);
    if(!job_process) {
        make_job_process(browser_socket);
    }
    console.log("in serve_eval_button_click sending to job_process: " + message);
    //job_process.stdin.setEncoding('utf-8');
    //job_process.stdin.write(message);
    mess_obj.keep_live_value = keep_alive_value;
    job_process.send(mess_obj);
    /*if(!mess_obj.keep_alive_value){
        setTimeout(function(){ kill_job_process(browser_socket) },
            3000)
    }*/
}

var keep_alive_value = false;
function serve_keep_alive_click(browser_socket, mess_obj){
    keep_alive_value = mess_obj.keep_alive_value;
    if(!keep_alive_value && job_process){
        kill_job_process(browser_socket);
    }
}

var debug_value = false;
function serve_debug_click(browser_socket, mess_obj){
    debug_value = mess_obj.debug_value;
}


//see bottom of je_and_browser_code.js: submit_window for
//the properties of mess_obj
function serve_show_window_call_callback(browser_socket, mess_obj){
    let callback_arg = mess_obj.callback_arg;
    let job_name = callback_arg.job_name;
    console.log("in serve_show_window_call_callback setting local job_process that was: " + job_process);
    let job_process = get_job_name_to_process(job_name);
    console.log("\n\nserve_show_window_call_callback got job_name: " + job_name + " and its process: " + job_process);
    console.log('\n\nAbout to stringify 4\n');
    let code = mess_obj.callback_fn_name + "(" +
               JSON.stringify(callback_arg) + ")";
    //code = mess_obj.callback_fn_name + '({"is_submit": false})' //out('short str')" //just for testing
    console.log("serve_show_window_call_callback made code: " + code);
    job_process.stdin.setEncoding('utf-8');
    job_process.stdin.write(code + "\n"); //need the newline so that stdio.js readline will be called
}

//not used for dde getting file content from the server.
//use a path of /edit?edit=/foo/bar.js instead and that
//bypasses serve_file.

function serve_file(q, req, res){
    let filename = q.pathname;
    let cur_dir = process.cwd();
    console.log("top of serve_file filename: " + filename + " cur_dir: " + cur_dir);
    if(running_on_dexter()) {
        let maybe_slash = (q.pathname.startsWith("/") ? "" : "/");
        filename = WWW_FOLDER + maybe_slash + q.pathname;  //this is in orig dexter file, but replaced for  dde4 with server laptop by the below clause
    }
    //dde4 works except for editing a file
    else { //dde4 not running on dexter
        filename = q.pathname;
        let maybe_slash = (q.pathname.startsWith("/") ? "" : "/");
        //console.log("serve_file got cur_dir: " + cur_dir)
        //filename = cur_dir + maybe_slash +  q.pathname
        filename = SHARE_FOLDER + maybe_slash + q.pathname;
    }
    /*else { //dde4 not running on dexter
        filename = q.pathname
        console.log("serve_file passed pathname: " + filename)
        if(filename.startsWith("/")) {
            let cur_dir = process.cwd()
            console.log("serve_file got cur_dir: " + cur_dir)
            filename = cur_dir +  filename
        }
        else { //filename does NOT start with slash
            filename = "/" + filename
        }
    }*/
    console.log("serve_file passed pathname: " + q.pathname +
              "\n                   cur_dir: " + cur_dir +
              "\n          serving filename: " + filename);

    //console.log("serving " + filename) //dde4 changed the 2nd arg to filename
    fs.readFile(filename, function(err, data) {
        if (err) { console.log(filename, "not found");
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found")
        }  
        res.setHeader('Access-Control-Allow-Origin', '*');
        let mimeType = mimeTypes[ q.pathname.split(".").pop() ] || "application/octet-stream";
        console.log("              Content-Type:", mimeType);
        res.setHeader("Content-Type", mimeType);
        res.writeHead(200);
        res.write(data);
        return res.end()
    });
}

function isBinary(byte) { //must use numbers, not strings to compare. ' ' is 32
  if (byte >= 32 && byte < 128) {return false} //between space and ~
  if ([13, 10, 9].includes(byte)) { return false } //or text ctrl chars
  return true
}

//primarily for debugging the http.createServer callback when using the Job Engine UI
//the args after "res" are the args to an "out" call that gets made in jobs.html.
//BUT calling this errors so don't use as is.
//res_or_ws can be either a Request object or a WebSocket, a la browser_socket
function out_to_browser_out_pane(browser_socket, val, color="black", temp=false, code=false){
    console.log("out_to_browser_out_pane passed type: " + browser_socket.constructor.name);
    let data_obj = {
        kind: "out_call",
        val:   val,
        color: color,
        temp:  temp,
        code:  code
    };
    let data_str = JSON.stringify(data_obj);
    if (browser_socket.constructor.name === "ServerResponse") { //I use lex far "res" for this. Shoujld be class ServerResponse but that isn't defined
        browser_socket.write(data_str);
    }
    else if(browser_socket instanceof websocket){
        browser_socket.send(data_str);
    }
    else {
        console.log("out_to_browser_out_pane got invalid first arg: " + browser_socket);
    }
}

//standard web server on port 80 to serve files
var http_server = http.createServer(async function (req, res) {
  //see https://nodejs.org/api/http.html#http_class_http_incomingmessage 
  //for the format of q.
  //console.log("web server got request: " + req.url )
  var q = url.parse(req.url, true);
  let [main_url, query_string] = ("" + req.url).split("?"); //url.parse(req.url,true).search fails
  let top_web_server_mess = "\nweb server passed url: " + req.url +
                            "\n             pathname: " + q.pathname +
                            "\n                query: " + query_string;
  console.log(top_web_server_mess); //can't call out_to_browser_out_pane pane here because
    //as soon as you do that, ther underlying server code doesn't allow setting headers.
  if (q.pathname === "/") {
      q.pathname = "index.html";
  }
  if (q.pathname === "/init_jobs") {
      serve_init_jobs(q, req, res);
  }
  //get path info
  else if (q.pathname === "/edit" && q.query.info ) { //added dde4
      let path = q.query.info;
      console.log("Getting info for orig path: " + path);
      path = make_full_path(path);
      console.log("Getting info for full path: " + path);
      let str_to_write;
      if(fs.existsSync(path)) {
          let stat = fs.statSync(path);
          let kind;
          if     (stat.isFile())            { kind = "file"; }
          else if(stat.isDirectory())       { kind = "folder"; }
          else if(stat.isSocket())          { kind = "socket"; }
          else if(stat.isFIFO())            { kind = "fifo"; }
          else if(stat.isCharacterDevice()) { kind = "character_device"; }
          else                              { kind = "other"; }
          stat.kind        = kind;
          stat.full_path   = path;
          let permissions  = (stat.mode & parseInt('777', 8)).toString(8);
          stat.permissions = permissions;
          str_to_write     = JSON.stringify(stat);
      }
      else { str_to_write = "null";} //path is non-existant
      console.log("info: " + str_to_write);
      res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
      res.write(str_to_write);
      res.end();
  }

  //get directory listing
  else if (q.pathname === "/edit" && q.query.list ) { 
    let listpath = q.query.list;
    //if(!listpath.endsWith("/")) {//fixed in DDEFile/get_folder //dde4 at least on Mac, listpath initially does not end in slash which breaks the below concat of listpath + items[i].name
    //    listpath = listpath + "/"
    //}
    //console.log("File list:"+listpath)
    listpath = make_full_path(listpath);
    fs.readdir(listpath, {withFileTypes: true}, 
      function(err, items){ //console.log("file:" + JSON.stringify(items))
        if(err) { console.log("error in http.createServer: " + err.message); } //dde4 added for insurance
        else    { console.log("http.createServer got item count of: " + items.length); }
        let dir = [];
        if (q.query.list != "/") { //not at root
          let now = new Date();
          dir.push({name: "..", size: "", type: "dir", date: now.getTime()});
          }
        for (let i = 0; i < items.length; i++) { //dde4 added "let "  //console.log("file:", JSON.stringify(items[i]))
           //console.log("getting stats for i: " + i + " item: " + items[i] + " name: " + items[i].name)
          let file_maybe = items[i];
          if (file_maybe.isFile()) {
            let file_name = file_maybe.name;
            let size = "unknown";
            let permissions = "unknown";
            let stats = {size: "unknown"}; //dde4 not used so delete this line and move "let" to 3 lines below
            let date = 0; //dde4 necessary for catch clause of date
            try { //console.log("file:", listpath + items[i].name)
              stats = fs.statSync(listpath + file_name);
              size = stats["size"];
              date = stats["mtimeMs"];
              //if(!date) { date = 0 } //dde4 added to fix bug when no mtimeMs
              permissions = (stats.mode & parseInt('777', 8)).toString(8);
            } catch (e) {console.log("couldn't stat "+ file_name +":"+e); }
            dir.push({name: file_name, size: size, type: "file", permissions: permissions, date: date});
          } //size is used to see if the file is too big to edit.
          else if (file_maybe.isDirectory()) {
            dir.push({name:file_maybe.name, size: "", type: "dir"});
            } //directories are not currently supported. 
        }
        console.log('\n\nAbout to stringify 5\n');
        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
        let dir_listing_str = JSON.stringify(dir);
        res.write(dir_listing_str);
        res.end();
      });
    }
    //use url/edit?edit=/foo.bar.js" to GET contents of a file
    //use url/edit?download=/foo.bar.js" to store the file
    //on the user's disc.
    ///foo.bar.js is the location of the file on the server.
    //If browser is set up to auto downlaod to the downloads filer,
    //it will otherwise browser can be set to ask the user
    //where the file should go. The Filename including full path,
    // comes back with the data from the server.
    //and the browser may chose to prepend "downloads" folder and
    //save just the downloads/filename.txt there.
   //used by read_file_async
  else if (q.pathname === "/edit" && q.query.edit || q.query.download) { 
    let filename = q.query.edit || q.query.download;
    console.log("serving for edit filename: " + filename);
    filename = make_full_path(filename); //dde4
    console.log("serving for edit full path filename: " + filename);
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found "+err)
        }
        fs.statSync(filename);
        for (let i = 0; i < data.length; i++) { 
            if (10==data[i]) ;
            if ( isBinary(data[i]) ) { //console.log("binary data:" + data[i] + " at:" + i + " line:" + line)
                res.setHeader("Content-Type", "application/octet-stream");
                break
                }
            }
        if (q.query.download) {
            res.setHeader("Content-Disposition", "attachment; filename=\"" + path.basename(filename) + "\"");
        }
        console.log("in server edit?edit with: " + filename + " about to allow CORS.");
        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
        res.writeHead(200);
        //console.log("server writing out data: " + data)
        res.write(data);
        return res.end()
      });
    }
    //used by read_file_part
    else if (q.pathname === "/edit" && q.query.read_part){ //dde4
      let filename = q.query.read_part;
      console.log("serving for read_part filename: " + filename);
      filename   = make_full_path(filename);
      let start  = parseInt(q.query.start);
      let length = parseInt(q.query.length);
      if(start < 0) { //read length bytes from the end of the file
          let stats = fs.statSync(filename);
          let fileSizeInBytes = stats.size;
          start = fileSizeInBytes - length + start + 1; //compute new start when reading from end
      }
      console.log("read_file_part full_path: " + filename + " start: " + start + " length: " + length);
      try {
          console.log("got readChunckSync: " + readChunkSync);
          let data = readChunkSync(filename, {length: length, startPosition: start});
          console.log("After readChunkSync with data: " + data);
          let line = 0;
          for (let i = 0; i < data.length; i++) {
              if (10==data[i]) line++;
              if ( isBinary(data[i]) ) { //console.log("binary data:" + data[i] + " at:" + i + " line:" + line)
                  res.setHeader("Content-Type", "application/octet-stream");
                  break
              }
          }
          res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
          res.writeHead(200);
          //console.log("server writing out data: " + data)
          res.write(data);
          return res.end()
      }
      catch(err) {
          res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
          res.writeHead(404, {'Content-Type': 'text/html'});
          return res.end("404 Not Found "+ err)
      }
    }
    /*else if(q.pathname === "/get_page") {
        let url = q.query.path
        let response = await fetch(url)
        if(response.ok) {
            let content = await file_info_response.text()
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(200)
            //console.log("server writing out data: " + data)
            res.write(data)
            return res.end()
        }
        else {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 " + url + " Not Found: " + err)
        }
    }*/
      //see https://nodejs.org/api/http.html#httpgeturl-options-callback
      //be very careful "res" is the respoonse that goes back to the browser.
      // "get_res" is the response that comes back from the http.get
    else if(q.pathname === "/get_page") {
      let the_url = q.query.path;
      console.log("in get_page clause with the_url: " + the_url);
      if (the_url.startsWith("https:")) {
          let options = {headers: {"User-Agent": req.headers['user-agent']}};
          https.get(url, options, (get_res) => {
                  let rawData = '';
                  get_res.on('data', (chunk) => {
                      rawData += chunk;
                  });
                  get_res.on('end', () => {
                      //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                      if((get_res.statusCode >= 300) &&
                         (get_res.statusCode <  400) &&
                          get_res.headers.location) { //an indirection
                         setTimeout(
                             function() {
                                 https.get(get_res.headers.location, options, function() {
                                     console.log("needs work");
                                 });
                             }, 10);
                      }
                      else {
                          res.writeHead(get_res.statusCode);
                          //console.log("server writing out data: " + data)
                          res.write(rawData);
                          return res.end()
                      }
                  });
                  get_res.on("error", (err) => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                     res.writeHead(get_res.statusCode);
                     return res.end()
                 });
          });
      }
      else { //presume starts with http:
          console.log("in get_page, http clause");
          let options = {headers: {"User-Agent": req.headers['user-agent']}};
          http.get(the_url, options,
              (get_res) => {
              let rawData = '';
              get_res.on('data', (chunk) => {
                  rawData += chunk;
              });
              get_res.on('end', () => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                  res.writeHead(get_res.statusCode);
                  //console.log("server writing out data: " + data)
                  res.write(rawData);
                  return res.end()
              });
              get_res.on("error", (err) => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                  res.writeHead(get_res.statusCode);
                  return res.end()
              });
          });
      }
      //from https://nodejs.org/api/https.html#httpsgeturl-options-callback

    }

    else if (q.pathname === "/edit" && req.method == 'DELETE' ) { //console.log("edit delete:"+JSON.stringify(req.headers))
      const form = formidable({ multiples: true });
      form.parse(req, (err, fields, files) => { //console.log(JSON.stringify({ fields, files }, null, 2) +'\n'+ err)
        let path = make_full_path(fields.path); //dde4
        console.log("delete:" + path + "!");
        try {
            fs.unlinkSync(path);
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(200);
            return res.end('ok');
        } catch(e) {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(400);
            return res.end(e)
        }
      });
      return
      }
      //use POST for updating the content of an existing file
      //below the first causeofan||(or)is for formindable v 1.2.2  and the 2nd is for formidable v "^2.0.1"
      //used by write_file_async and append_to_file
     else if (q.pathname === "/edit" && req.method == 'POST' ) { //console.log("edit post headers:",req.headers)
        const form = formidable({ multiples: false });
        form.once('error', console.error);
        const DEFAULT_PERMISSIONS = parseInt('644', 8);
        var stats = {mode: DEFAULT_PERMISSIONS};
        form.on('file', function (filename, file) {  //console.log("edit post file:",file)
            //console.log("filename: " + filename + " file: " + JSON.stringify(file))
            let topathfile = (file.name || file.originalFilename); // dde4 we need the "let"
            topathfile = make_full_path(topathfile);
            try {
                console.log("copy", (file.path || file.filepath),
                    "to", topathfile);
                stats = fs.statSync(topathfile);
                //console.log(("had permissions:" + (stats.mode & parseInt('777', 8)).toString(8)))
            } catch {
            } //no biggy if that didn't work
            //if the folder doesn't exist, we want to auto-create it.
            let topath = topathfile.split('/').slice(0, -1).join('/') + '/'; //dde4 needs "let"
            try {
                console.log(`make folder:${topath}.`);
                fs.mkdirSync(topath, {recursive: true});
            } catch (err) {
                console.log(`Can't make folder:${topath}.`, err);
                res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                res.writeHead(400);
                return res.end(`Can't make folder ${topath}:`, err)
            }
            if (q.query.append) {
                // open destination file for appending
                let write_stream = fs.createWriteStream(topathfile, {flags: 'a'});
                // open source file for reading
                let read_stream = fs.createReadStream((file.path || file.filepath));

                write_stream.on('close', function() {
                    fs.unlink((file.path || file.filepath), function (err) {
                        if (err) console.log((file.path || file.filepath), 'not cleaned up', err);
                    });
                    res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                    res.end('ok');
                    console.log("done writing");
                });

                read_stream.pipe(write_stream);
                //fs.appendFile((file.path || file.filepath), topathfile)
            }
            else {
                fs.copyFile((file.path || file.filepath),  //or  file.filepath
                  topathfile, function (err) {
                    let new_mode = undefined;
                    if (err) {
                        console.log("copy failed:", err);
                        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                        res.writeHead(400);
                        return res.end("Failed")
                    } else {
                        fs.chmodSync(topathfile, stats.mode);
                        try { //sync ok because we will recheck the actual file
                            let new_stats = fs.statSync(topathfile);
                            new_mode = new_stats.mode;
                            //console.log(("has permissions:" + (new_mode & parseInt('777', 8)).toString(8)))
                        } catch {
                        } //if it fails, new_mode will still be undefined
                        if (stats.mode != new_mode) { //console.log("permssions wrong")
                            //res.writeHead(400) //no point?
                            return res.end("Permissions error")
                        }
                        fs.unlink((file.path || file.filepath), function (err) {
                            if (err) console.log((file.path || file.filepath), 'not cleaned up', err);
                        });
                        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                        res.end('ok');
                    }
                }); //done w/ copyFile
            }
          });
        form.parse(req);
        return
        //res.end('ok');
      // });
      }
      //use for creating a new file
      else if (q.pathname === "/edit" && req.method == 'PUT' ) { console.log('edit put');
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => { //console.log('fields:', fields);
          let pathfile = fields.path;
          let newpath = pathfile.split('/').slice(0,-1).join('/')+'/';
          try { console.log(`make folder:${newpath}.`);
            fs.mkdirSync(newpath, {recursive:true});
          } catch(err) {
              console.log(`Can't make folder:${newpath}.`, err);
              res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
              res.writeHead(400);
              return res.end(`Can't make folder ${newpath}:`, err)
          }
          if (pathfile.slice(-1)!="/") { //if it wasn't just an empty folder
              fs.writeFile(pathfile, "", function (err) { console.log('create' + pathfile);
                if (err) {
                  console.log("failed", err);
                  res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                  res.writeHead(400);
                  return res.end("Failed:" + err)
                  }
               }); 
             }
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.end('ok'); //console.log('done');
          });
        }
      //else if(q.pathname === "/job_button_click") {
  //	  serve_job_button_click(q, req, res)
  //}
  //else if(q.pathname === "/show_window_button_click") {
  //	  serve_show_window_button_click(q, req, res)
  //} 
  else {
  	  serve_file(q, req, res);
  }
});

http_server.listen(80);
console.log("listening on port 80");

/* orig james N code
function jobs(q, res){
 console.log("serving job list")
    fs.readdir("/srv/samba/share/dde_apps/", function(err, items) {
      if (err) {
        console.log("ERROR:"+err)
        res.writeHead(500, {'Content-Type': 'text/html'})
        return res.end("500 Error")
        }
      res.writeHead(200, {'Content-Type': 'text'})
      for (var i=0; i<items.length; i++) {
        res.write(items[i]+"\n")
        }
      return res.end()
      })
    return
}
*/


// ModBus client server
//const ModbusRTU = require("modbus-serial"); //see above
var modbus_reg = [];

function modbus_startjob(job_name) {
	console.log("top of modbus_startjob passed job_name" + job_name);
	let jobfile = DDE_APPS_FOLDER + job_name + ".dde";
    console.log("modbus_startjob setting local job_process to result of get_job_name_to_process");
	let job_process = get_job_name_to_process(job_name);
	if(!job_process){
	    console.log("in modbus_startjob spawning " + jobfile);
	    //https://nodejs.org/api/child_process.html
	    //https://blog.cloudboost.io/node-js-child-process-spawn-178eaaf8e1f9
	    //a jobfile than ends in "/keep_alive" is handled specially in core/index.js
	    job_process = spawn('node',
		["core define_and_start_job " + jobfile],   
		{cwd: DDE_INSTALL_FOLDER, shell: true}
		);
	    set_job_name_to_process(job_name, job_process);
	    console.log("Spawned " + DDE_APPS_FOLDER + job_name + ".dde as process id " + job_process);
	    job_process.stdout.on('data', function(data) {
		console.log("\n\n" + job_name + ">'" + data + "'\n");
		let data_str = data.toString();
		if (data_str.substr(0,7) == "modbus:") { //expecting 'modbus: 4, 123' or something like that
		    [addr, value] = data_str.substr(7).split(",").map(x => parseInt(x) || 0);
		    modbus_reg[addr] = value;
		//TODO: Change this to something that allows multiple values to be set in one out.
		    }
		});
	 
	    job_process.stderr.on('data', function(data) {
	  	console.log("\n\n" + job_name + "!>'" + data + "'\n");
		//remove_job_name_to_process(job_name) //error doesn't mean end.
		});
	    job_process.on('close', function(code) {
		console.log("\n\nJob: " + job_name + ".dde closed with code: " + code);
		//if(code !== 0){  } //who do we tell if a job crashed?
		remove_job_name_to_process(job_name);
		});
	    }
	else {
	    console.log("\n" + job_name + " already running as process " + job_process);
	    } //finished with !job_process
	}

var vector = {
    //TODO: Figure out what to return as inputs.
    // Possible: Values from a file? 
    // e.g. modbus.json has an array where jobs can store data to be read out here.
    // maybe that is the modbus_reg array as a json file?
    getInputRegister: function(addr) { //doesn't get triggered by QModMaster for some reason.
	//This does work mbpoll -1 -p 8502 -r 2 -t 3 192.168.0.142 
        console.log("read input", addr);
        return addr; //just sample data
        },
    getMultipleInputRegisters: function(startAddr, length) {
        console.log("read inputs from", startAddr, "for", length); 
        var values = [];
        for (var i = startAddr; i < length; i++) {
            values[i] = startAddr + i; //just sample return data
            }
        return values;
        },
    getHoldingRegister: function(addr) {
        let value = modbus_reg[addr] || 0;
        console.log("read register", addr, "is", value);
        return value 
        },
    getMultipleHoldingRegisters: function(startAddr, length) {
        console.log("read registers from", startAddr, "for", length); 
        let values = [];
        for (var i = 0; i < length; i++) {
            values[i] = modbus_reg[i] || 0;
            }
        return values
        },
    setRegister: function(addr, value) { 
        console.log("set register", addr, "to", value); 
        modbus_reg[addr] = value;
        return
        },
    getCoil: function(addr) { //return 0 or 1 only.
        let value = ((addr % 2) === 0); //just sample return data
        console.log("read coil", addr, "is", value);
        return value 
        //TODO Return the status of the job modbuscoil<addr>.dde
        // e.g. 1 if it's running, 0 if it's not.
        },
    setCoil: function(addr, value) { //gets true or false as a value.
        console.log("set coil", addr, " ", value);
	if (value) { modbus_startjob("modbus" + addr); }
	else { console.log("stop"); }
        //TODO Start or kill job modbuscoil<addr>.dde depending on <value>
        // Maybe pass in with modbus_reg as a user_data? or they can access the file?
        return; 
        },
    readDeviceIdentification: function(addr) {
        return {
            0x00: "HaddingtonDynamics",
            0x01: "Dexter",
            0x02: "1.1",
            0x05: "HDI",
            0x97: "MyExtendedObject1",
            0xAB: "MyExtendedObject2"
        };
    }
};

// set the server to answer for modbus requests
console.log("ModbusTCP listening on modbus://0.0.0.0:8502");
var serverTCP = new modbusSerial.ServerTCP(vector, { host: "0.0.0.0", port: 8502, debug: true, unitID: 1 });

serverTCP.on("initialized", function() {
    console.log("initialized");
});

serverTCP.on("socketError", function(err) {
    console.error(err);
    serverTCP.close(closed);
});

function closed() {
    console.log("server closed");
}


// Web Socket Proxy to DexRun raw socket
wss.on('connection', function(the_ws, req) {
  console.log("\n\nwss got connection: " + the_ws);
  console.log("\nwss SAME AS the_ws : " + (wss === the_ws));
  console.log("got req class: " + req.constructor.name); // IncomingMessage
  let browser_socket = the_ws; //the_socket used when stdout from job engine comes to the web server process
  the_ws.on('message', function(message) {
    console.log('\n\nwss server on message received: %s', message);
    let mess_obj;
    try { mess_obj = JSON.parse(message);}
    catch(err) { console.log("bad message: " + err); return; }
    console.log("\nwss server on message received kind: " + mess_obj.kind);
    if(mess_obj.kind === "get_dde_version"){
        serve_get_dde_version(browser_socket, mess_obj);
    }
    else if(mess_obj.kind === "debug_click") {
        serve_debug_click(browser_socket, mess_obj);
    }
    else if(mess_obj.kind === "keep_alive_click") {
        serve_keep_alive_click(browser_socket, mess_obj);
    }
    else if(mess_obj.kind === "job_button_click") {
    	serve_job_button_click(browser_socket, mess_obj);
    }
    else if(mess_obj.kind === "show_window_call_callback"){
        serve_show_window_call_callback(browser_socket, mess_obj);
    }
    else if (mess_obj.kind === "eval"){
        serve_eval_button_click(browser_socket, message);
    }
    else {
      console.log("\n\nwss server received message kind: " + mess_obj.kind);
      serve_job_button_click(browser_socket, mess_obj);
    }
  });
  the_ws.send('websocket connected.\n');
});



//websocket server that connects to Dexter
//socket server to accept websockets from the browser on port 3000
//and forward them out to DexRun as a raw socket
var browser = new websocketServer({ port:3000 });
var bs; 
var dexter = new net.Socket();
//don't open the socket yet, because Dexter only allows 1 socket connection
dexter.connected = false; //track socket status (doesn't ws do this?)

browser.on('connection', function connection(socket, req) {
  console.log(process.hrtime()[1], " browser connected ", req.connection.Server);
  bs = socket;
  socket.on('message', function (data) {
    console.log(process.hrtime()[1], " browser says ", data.toString());
    //Now as a client, open a raw socket to DexRun on localhost
    if (!dexter.connected && !dexter.connecting) { 
      dexter.connect(50000, "127.0.0.1"); 
      console.log("dexter connect");
      dexter.on("connect", function () { 
        dexter.connected = true; 
        console.log("dexter connected");
        dexter.write(data.toString());
        } );
      dexter.on("data", function (data){
        //console.log(process.hrtime()[1], " dexter says ", data)
        //for(let i = 0; i<8*4; i+=4) {console.log(i, data[i])}
        console.log(process.hrtime()[1], " dexter says ","#"+data[1*4]+" op:"+String.fromCharCode(data[4*4]) + " len: " + data.length);
        if (data[5*4]) {console.log("error:"+data[5*4]);}
        if (bs) {
            bs.send(data,{ binary: true });
            console.log(process.hrtime()[1], " sent to browser ");
            }
        });
      dexter.on("close", function () { 
        dexter.connected = false; 
        console.log("dexter disconnect");
        dexter.removeAllListeners(); 
        //or multiple connect/data/close events next time
        } );
      dexter.on("end", function (error) { 
        dexter.connected = false; 
        console.log("dexter ended");
        //dexter.removeAllListeners() 
        if (error) {
            console.log(error);
            }
        dexter.end();
        dexter.destroy();
        //or multiple connect/data/close events next time
        } );
      dexter.on("error", function () {
        dexter.connected = false; 
        console.log("dexter error");
        if (bs) { bs.send(null,{ binary: true }); }
        dexter.removeAllListeners(); 
        dexter.destroy();
        } );
      } //TODO: Should this be an else? When re-connecting, messages are sent twice.
    else {//already connected.
      dexter.write(data.toString());
      }
    });
  socket.on('close', function (data) {
    console.log(process.hrtime()[1], " browser disconnected ");
    bs = null;
    //dexter.close() //not defined.
    dexter.end();
    });
  });
//# sourceMappingURL=bundle_server.mjs.map
