/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/*
  "undiscovered", "discovered", and "finished" correspond to "white", "gray" and
  "black" respectively in the terminology sometimes used (e.g. in CLRS) to
  describe depth-first search,
*/
var NodePhase;
(function (NodePhase) {
    NodePhase[NodePhase["undiscovered"] = 0] = "undiscovered";
    NodePhase[NodePhase["discovered"] = 1] = "discovered";
    NodePhase[NodePhase["finished"] = 2] = "finished";
})(NodePhase || (NodePhase = {}));
function topologicalOrdering(graph) {
    function discover(node) {
        var nodeInfo = nodes.get(node);
        if (!nodeInfo)
            throw new Error("could not find node info");
        nodes.set(node, __assign(__assign({}, nodeInfo), { discoveryTime: tick++, phase: NodePhase.discovered }));
    }
    function finish(node) {
        var nodeInfo = nodes.get(node);
        if (!nodeInfo)
            throw new Error("could not find node");
        nodes.set(node, __assign(__assign({}, nodeInfo), { finishTime: tick++, phase: NodePhase.finished }));
    }
    function depthFirstSearch(node, ancestorIds) {
        discover(node);
        var children = graph.get(node);
        if (!children)
            throw new Error("could not find children of node");
        children.forEach(function (childNode) {
            var childNodeInfo = nodes.get(childNode);
            if (!childNodeInfo)
                throw new Error("could not find node");
            if (childNodeInfo.phase === NodePhase.undiscovered) {
                depthFirstSearch(childNode, ancestorIds.concat(node));
            }
            else if (childNodeInfo.phase === NodePhase.discovered) {
                // We have found a cycle in our dependency graph. This is not allowed
                // because it means we can't find a topological ordering, and could
                // cause infinite loops.
                var cycleIds = ancestorIds
                    .slice(ancestorIds.indexOf(childNode))
                    .concat([node, childNode])
                    .map(function (node) { return node.name; })
                    // reverse because we want to report in terms of the original graph, rather than the transposed graph
                    .reverse();
                throw new Error("Dependency cycle detected in the data pipeline: " + cycleIds.join(" -> "));
            }
        });
        finish(node);
    }
    var tick = 0;
    var nodes = new Map();
    // need to convert from looking at dependencies of each node, to looking at upstream state for each node
    graph.forEach(function (_, node) {
        nodes.set(node, {
            phase: NodePhase.undiscovered,
            discoveryTime: 0,
            finishTime: 0
        });
    });
    nodes.forEach(function (_nodeInfo, node) {
        depthFirstSearch(node, []);
    });
    return __spread(nodes).sort(function (_a, _b) {
        var _c = __read(_a, 2), nodeInfoA = _c[1];
        var _d = __read(_b, 2), nodeInfoB = _d[1];
        return nodeInfoA.finishTime - nodeInfoB.finishTime;
    })
        .map(function (_a) {
        var _b = __read(_a, 1), node = _b[0];
        return node;
    });
}

function transpose(directedGraph) {
    var result = new Map();
    directedGraph.forEach(function (targets, source) {
        if (!result.has(source)) {
            result.set(source, []);
        }
        targets.forEach(function (target) {
            if (!result.has(target)) {
                result.set(target, []);
            }
            var arr = result.get(target);
            arr.push(source);
        });
    });
    return result;
}

function makePipeline() {
    var dependencyMatrix;
    var topologicalOrdering$1;
    var graph;
    function orderedDependents(source) {
        var allReachableNodes = new Set();
        // TODO - is it worth re-using the dfs function here?
        function addChildren(parent) {
            var children = graph.get(parent);
            if (!children)
                throw new Error("node missing from graph");
            children.forEach(function (child) {
                if (!allReachableNodes.has(child)) {
                    allReachableNodes.add(child);
                    addChildren(child);
                }
            });
        }
        addChildren(source);
        return topologicalOrdering$1.filter(function (node) { return allReachableNodes.has(node); });
    }
    function node(name, updater) {
        var resultNode = { name: name };
        function commit(newState) {
            this.state = newState;
            orderedDependents(this).forEach(function (dep) { return dep.update(); });
        }
        function update() {
            if (updater) {
                var upstreamNodes = dependencyMatrix.get(this);
                if (!upstreamNodes)
                    throw new Error("could not find upstream nodes");
                this.state = updater.apply(void 0, __spread(upstreamNodes.map(function (dep) { return dep.state; })));
            }
        }
        resultNode.commit = commit.bind(resultNode);
        resultNode.update = update.bind(resultNode);
        return resultNode;
    }
    return {
        node: node,
        setDependencies: function (dependencies) {
            dependencyMatrix = dependencies;
            graph = transpose(dependencies);
            topologicalOrdering$1 = topologicalOrdering(graph);
        }
    };
}

export default makePipeline;
