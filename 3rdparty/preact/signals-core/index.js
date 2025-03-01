Object.defineProperty(exports, "__esModule", { value: true });
exports.Signal = exports.batch = exports.effect = exports.computed = exports.signal = void 0;
function cycleDetected() {
    throw new Error("Cycle detected");
}
var RUNNING = 1 << 0;
var NOTIFIED = 1 << 1;
var OUTDATED = 1 << 2;
var DISPOSED = 1 << 3;
var HAS_ERROR = 1 << 4;
var IS_EFFECT = 1 << 5;
var AUTO_DISPOSE = 1 << 6;
var AUTO_SUBSCRIBE = 1 << 7;
var NODE_FREE = 1 << 0;
var NODE_SUBSCRIBED = 1 << 1;
function startBatch() {
    batchDepth++;
}
function endBatch() {
    if (batchDepth > 1) {
        batchDepth--;
        return;
    }
    var error;
    var hasError = false;
    while (batchedEffect !== undefined) {
        var effect_1 = batchedEffect;
        batchedEffect = undefined;
        batchIteration++;
        while (effect_1 !== undefined) {
            var next = effect_1._nextBatchedEffect;
            effect_1._nextBatchedEffect = undefined;
            effect_1._flags &= ~NOTIFIED;
            if (!(effect_1._flags & DISPOSED) && effect_1._flags & OUTDATED) {
                try {
                    effect_1._callback();
                }
                catch (err) {
                    if (!hasError) {
                        error = err;
                        hasError = true;
                    }
                }
            }
            effect_1 = next;
        }
    }
    batchIteration = 0;
    batchDepth--;
    if (hasError) {
        throw error;
    }
}
function batch(callback) {
    if (batchDepth > 0) {
        return callback();
    }
    startBatch();
    try {
        return callback();
    }
    finally {
        endBatch();
    }
}
exports.batch = batch;
var evalContext = undefined;
var batchedEffect = undefined;
var batchDepth = 0;
var batchIteration = 0;
var globalVersion = 0;
function addDependency(signal) {
    if (evalContext === undefined) {
        return undefined;
    }
    var node = signal._node;
    if (node === undefined || node._target !== evalContext) {
        node = {
            _flags: 0,
            _version: 0,
            _source: signal,
            _prevSource: undefined,
            _nextSource: evalContext._sources,
            _target: evalContext,
            _prevTarget: undefined,
            _nextTarget: undefined,
            _rollbackNode: node,
        };
        evalContext._sources = node;
        signal._node = node;
        if (evalContext._flags & AUTO_SUBSCRIBE) {
            signal._subscribe(node);
        }
        return node;
    }
    else if (node._flags & NODE_FREE) {
        node._flags &= ~NODE_FREE;
        var head = evalContext._sources;
        if (node !== head) {
            var prev = node._prevSource;
            var next = node._nextSource;
            if (prev !== undefined) {
                prev._nextSource = next;
            }
            if (next !== undefined) {
                next._prevSource = prev;
            }
            if (head !== undefined) {
                head._prevSource = node;
            }
            node._prevSource = undefined;
            node._nextSource = head;
            evalContext._sources = node;
        }
        return node;
    }
    return undefined;
}
function Signal(value) {
    this._value = value;
    this._version = 0;
    this._node = undefined;
    this._targets = undefined;
}
exports.Signal = Signal;
Signal.prototype._refresh = function () {
    return true;
};
Signal.prototype._subscribe = function (node) {
    if (!(node._flags & NODE_SUBSCRIBED)) {
        node._flags |= NODE_SUBSCRIBED;
        node._nextTarget = this._targets;
        if (this._targets !== undefined) {
            this._targets._prevTarget = node;
        }
        this._targets = node;
    }
};
Signal.prototype._unsubscribe = function (node) {
    if (node._flags & NODE_SUBSCRIBED) {
        node._flags &= ~NODE_SUBSCRIBED;
        var prev = node._prevTarget;
        var next = node._nextTarget;
        if (prev !== undefined) {
            prev._nextTarget = next;
            node._prevTarget = undefined;
        }
        if (next !== undefined) {
            next._prevTarget = prev;
            node._nextTarget = undefined;
        }
        if (node === this._targets) {
            this._targets = next;
        }
    }
};
Signal.prototype.subscribe = function (fn) {
    var _this = this;
    return effect(function () { return fn(_this.value); });
};
Signal.prototype.valueOf = function () {
    return this.value;
};
Signal.prototype.toString = function () {
    return this.value + "";
};
Signal.prototype.peek = function () {
    return this._value;
};
Object.defineProperty(Signal.prototype, "value", {
    get: function () {
        var node = addDependency(this);
        if (node !== undefined) {
            node._version = this._version;
        }
        return this._value;
    },
    set: function (value) {
        if (value !== this._value) {
            if (batchIteration > 100) {
                cycleDetected();
            }
            this._value = value;
            this._version++;
            globalVersion++;
            startBatch();
            try {
                for (var node = this._targets; node !== undefined; node = node._nextTarget) {
                    node._target._notify();
                }
            }
            finally {
                endBatch();
            }
        }
    },
});
function signal(value) {
    return new Signal(value);
}
exports.signal = signal;
function prepareSources(target) {
    for (var node = target._sources; node !== undefined; node = node._nextSource) {
        var rollbackNode = node._source._node;
        if (rollbackNode !== undefined) {
            node._rollbackNode = rollbackNode;
        }
        node._source._node = node;
        node._flags |= NODE_FREE;
    }
}
function cleanupSources(target) {
    var node = target._sources;
    var sources = undefined;
    while (node !== undefined) {
        var next = node._nextSource;
        if (node._flags & NODE_FREE) {
            node._source._unsubscribe(node);
            node._nextSource = undefined;
        }
        else {
            if (sources !== undefined) {
                sources._prevSource = node;
            }
            node._prevSource = undefined;
            node._nextSource = sources;
            sources = node;
        }
        node._source._node = node._rollbackNode;
        if (node._rollbackNode !== undefined) {
            node._rollbackNode = undefined;
        }
        node = next;
    }
    target._sources = sources;
}
function cleanupContext(context) {
    var hasError = false;
    var error;
    var nested = context._effects;
    if (nested !== undefined) {
        context._effects = undefined;
        while (nested !== undefined) {
            try {
                nested._dispose();
            }
            catch (err) {
                hasError = true;
                error = err;
            }
            nested = nested._nextNestedEffect;
        }
    }
    if (context._flags & IS_EFFECT) {
        var cleanup = context._cleanup;
        context._cleanup = undefined;
        if (typeof cleanup === "function") {
            startBatch();
            var prevContext = evalContext;
            evalContext = undefined;
            try {
                cleanup();
            }
            catch (err) {
                hasError = true;
                error = err;
                context._flags &= ~RUNNING;
            }
            evalContext = prevContext;
            endBatch();
        }
    }
    if (hasError) {
        throw error;
    }
}
function Computed(compute) {
    Signal.call(this, undefined);
    this._compute = compute;
    this._sources = undefined;
    this._effects = undefined;
    this._globalVersion = globalVersion - 1;
    this._flags = OUTDATED;
}
Computed.prototype = new Signal();
Computed.prototype._refresh = function () {
    this._flags &= ~NOTIFIED;
    if (this._flags & RUNNING) {
        return false;
    }
    if (this._targets !== undefined && !(this._flags & OUTDATED)) {
        return true;
    }
    this._flags &= ~OUTDATED;
    if (this._globalVersion === globalVersion) {
        return true;
    }
    this._globalVersion = globalVersion;
    var prevContext = evalContext;
    try {
        this._flags |= RUNNING;
        if (this._version > 0) {
            var node = this._sources;
            while (node !== undefined) {
                if (!node._source._refresh() ||
                    node._source._version !== node._version) {
                    break;
                }
                node = node._nextSource;
            }
            if (node === undefined) {
                return true;
            }
        }
        prepareSources(this);
        cleanupContext(this);
        evalContext = this;
        var value = this._compute();
        if (this._flags & HAS_ERROR ||
            this._value !== value ||
            this._version === 0) {
            this._value = value;
            this._flags &= ~HAS_ERROR;
            this._version++;
        }
    }
    catch (err) {
        this._value = err;
        this._flags |= HAS_ERROR;
        this._version++;
    }
    finally {
        evalContext = prevContext;
        cleanupSources(this);
        this._flags &= ~RUNNING;
    }
    return true;
};
Computed.prototype._subscribe = function (node) {
    if (this._targets === undefined) {
        this._flags |= OUTDATED | AUTO_SUBSCRIBE;
        for (var node_1 = this._sources; node_1 !== undefined; node_1 = node_1._nextSource) {
            node_1._source._subscribe(node_1);
        }
    }
    Signal.prototype._subscribe.call(this, node);
};
Computed.prototype._unsubscribe = function (node) {
    Signal.prototype._unsubscribe.call(this, node);
    if (this._targets === undefined) {
        this._flags &= ~AUTO_SUBSCRIBE;
        for (var node_2 = this._sources; node_2 !== undefined; node_2 = node_2._nextSource) {
            node_2._source._unsubscribe(node_2);
        }
    }
};
Computed.prototype._notify = function () {
    if (!(this._flags & NOTIFIED)) {
        this._flags |= OUTDATED | NOTIFIED;
        for (var node = this._targets; node !== undefined; node = node._nextTarget) {
            node._target._notify();
        }
    }
};
Computed.prototype.peek = function () {
    if (!this._refresh()) {
        cycleDetected();
    }
    if (this._flags & HAS_ERROR) {
        throw this._value;
    }
    return this._value;
};
Object.defineProperty(Computed.prototype, "value", {
    get: function () {
        if (this._flags & RUNNING) {
            cycleDetected();
        }
        var node = addDependency(this);
        this._refresh();
        if (node !== undefined) {
            node._version = this._version;
        }
        if (this._flags & HAS_ERROR) {
            throw this._value;
        }
        return this._value;
    },
});
function computed(compute) {
    return new Computed(compute);
}
exports.computed = computed;
function disposeEffect(effect) {
    for (var node = effect._sources; node !== undefined; node = node._nextSource) {
        node._source._unsubscribe(node);
    }
    effect._sources = undefined;
    cleanupContext(effect);
}
function endEffect(prevContext) {
    if (evalContext !== this) {
        throw new Error("Out-of-order effect");
    }
    cleanupSources(this);
    evalContext = prevContext;
    this._flags &= ~RUNNING;
    if (this._flags & DISPOSED) {
        disposeEffect(this);
    }
    endBatch();
}
function Effect(compute, flags) {
    this._compute = compute;
    this._cleanup = undefined;
    this._sources = undefined;
    this._effects = undefined;
    this._nextNestedEffect = undefined;
    this._nextBatchedEffect = undefined;
    this._flags = IS_EFFECT | OUTDATED | flags;
    if (flags & AUTO_DISPOSE && evalContext !== undefined) {
        this._nextNestedEffect = evalContext._effects;
        evalContext._effects = this;
    }
}
Effect.prototype._callback = function () {
    var finish = this._start();
    try {
        if (!(this._flags & DISPOSED)) {
            this._cleanup = this._compute();
        }
    }
    finally {
        finish();
    }
};
Effect.prototype._start = function () {
    if (this._flags & RUNNING) {
        cycleDetected();
    }
    this._flags |= RUNNING;
    this._flags &= ~DISPOSED;
    prepareSources(this);
    cleanupContext(this);
    startBatch();
    this._flags &= ~OUTDATED;
    var prevContext = evalContext;
    evalContext = this;
    return endEffect.bind(this, prevContext);
};
Effect.prototype._notify = function () {
    if (!(this._flags & NOTIFIED)) {
        this._flags |= NOTIFIED | OUTDATED;
        this._nextBatchedEffect = batchedEffect;
        batchedEffect = this;
    }
};
Effect.prototype._dispose = function () {
    this._flags |= DISPOSED;
    if (!(this._flags & RUNNING)) {
        disposeEffect(this);
    }
};
function effect(compute) {
    var effect = new Effect(compute, AUTO_DISPOSE | AUTO_SUBSCRIBE);
    effect._callback();
    return effect._dispose.bind(effect);
}
exports.effect = effect;
