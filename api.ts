import computeTopologicalOrdering from "./topological-ordering";
import transpose from "./transpose";

export function pipeline() {
  let dependencyMatrix;
  let topologicalOrdering;
  let graph;

  function orderedDependents(source) {
    const allReachableNodes = new Set();
    // todo - is it worth re-using the dfs function here?
    function addChildren(parent) {
      const children = graph.get(parent);
      children.forEach((child) => {
        if (!allReachableNodes.has(child)) {
          allReachableNodes.add(child);
          addChildren(child);
        }
      });
    }
    addChildren(source);
    return topologicalOrdering.filter((node) => allReachableNodes.has(node));
  }

  function node(name: string, updater?) {
    const resultNode = { name };
    function commit(newState) {
      this.state = newState;
      orderedDependents(this).forEach((dep) => dep.update());
    }
    function update() {
      this.state = updater(
        ...dependencyMatrix.get(this).map((dep) => dep.state)
      );
    }
    resultNode.commit = commit.bind(resultNode);
    resultNode.update = update.bind(resultNode);
    return resultNode;
  }

  return {
    node,
    setDependencies(dependencies) {
      dependencyMatrix = dependencies;
      graph = transpose(dependencies);
      topologicalOrdering = computeTopologicalOrdering(graph);
    },
  };
}
