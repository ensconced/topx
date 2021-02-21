/*
  "undiscovered", "discovered", and "finished" correspond to "white", "gray" and
  "black" respectively in the terminology sometimes used (e.g. in CLRS) to
  describe depth-first search,
*/

function topologicalOrdering(graph) {
  function discover(node) {
    const nodeInfo = nodes.get(node);
    nodes.set(node, {
      ...nodeInfo,
      discoveryTime: tick++,
      phase: "discovered",
    });
  }
  function finish(node) {
    nodes.set(node, {
      ...nodes.get(node),
      finishTime: tick++,
      phase: "finished",
    });
  }
  function depthFirstSearch(node, ancestorIds) {
    discover(node);
    const children = graph.get(node);
    children.forEach((childNode) => {
      const childNodeInfo = nodes.get(childNode);
      if (childNodeInfo.phase === "undiscovered") {
        depthFirstSearch(childNode, ancestorIds.concat(node));
      } else if (childNodeInfo.phase === "discovered") {
        // We have found a cycle in our dependency graph. This is not allowed
        // because it means we can't find a topological ordering, and could
        // cause infinite loops.
        const cycleIds = ancestorIds
          .slice(ancestorIds.indexOf(childNode))
          .concat([node, childNode])
          .map((node) => node.name)
          // reverse because we want to report in terms of the original graph, rather than the transposed graph
          .reverse();
        throw new Error(
          `Dependency cycle detected in the data pipeline: ${cycleIds.join(
            " -> "
          )}`
        );
      }
    });
    finish(node);
  }
  let tick = 0;
  const nodes = new Map();
  // need to convert from looking at dependencies of each node, to looking at upstream state for each node
  graph.forEach((_, node) => {
    nodes.set(node, {
      phase: "undiscovered",
      discoveryTime: 0,
      finishTime: 0,
    });
  });
  nodes.forEach((_nodeInfo, node) => {
    depthFirstSearch(node, []);
  });
  return [...nodes]
    .sort(
      ([, nodeInfoA], [, nodeInfoB]) =>
        nodeInfoA.finishTime - nodeInfoB.finishTime
    )
    .map(([node]) => node);
}

export default topologicalOrdering;
