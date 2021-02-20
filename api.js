class Node {
  constructor(updater) {
    this.updater = updater;
  }
  update(...upstreamState) {
    this.state = updater(...upstreamState);
  }
  commit() {
    // update all dependents, in topological order
  }
}

function pipeline() {
  let dependencyMatrix;
  let topologicalOrdering;

  function orderedDependents() {}
  function getUpstreamState() {}

  function node(updater) {
    let state;
    const resultNode = {};
    function commit(newState) {
      state = newState;
      orderedDependents(this).forEach((dep) => dep.update());
    }
    function update() {
      state = updater(getUpstreamState(this));
    }
    resultNode.commit = commit.bind(resultNode);
    resultNode.update = update.bind(resultNode);
  }

  return {
    node,
    setDependencies(dependencies) {
      topologicalOrdering = computeTopologicalOrdering(dependencies);
    },
  };
}

module.exports = { pipeline };
