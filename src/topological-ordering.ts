import { PipelineGraph, PipelineNode } from "./types";

/*
  "undiscovered", "discovered", and "finished" correspond to "white", "gray" and
  "black" respectively in the terminology sometimes used (e.g. in CLRS) to
  describe depth-first search,
*/

enum NodePhase {
  undiscovered,
  discovered,
  finished,
}

interface TopoNode {
  phase: NodePhase;
  discoveryTime: number;
  finishTime: number;
}

function topologicalOrdering(graph: PipelineGraph): PipelineNode<unknown>[] {
  function discover(node: PipelineNode<unknown>) {
    const nodeInfo = nodes.get(node);
    if (!nodeInfo) throw new Error("could not find node info");
    nodes.set(node, {
      ...nodeInfo,
      discoveryTime: tick++,
      phase: NodePhase.discovered,
    });
  }
  function finish(node: PipelineNode<unknown>) {
    const nodeInfo = nodes.get(node);
    if (!nodeInfo) throw new Error("could not find node");
    nodes.set(node, {
      ...nodeInfo,
      finishTime: tick++,
      phase: NodePhase.finished,
    });
  }
  function depthFirstSearch(
    node: PipelineNode<unknown>,
    ancestorIds: PipelineNode<unknown>[]
  ) {
    discover(node);
    const children = graph.get(node);
    if (!children) throw new Error("could not find children of node");
    children.forEach((childNode) => {
      const childNodeInfo = nodes.get(childNode);
      if (!childNodeInfo) throw new Error("could not find node");
      if (childNodeInfo.phase === NodePhase.undiscovered) {
        depthFirstSearch(childNode, ancestorIds.concat(node));
      } else if (childNodeInfo.phase === NodePhase.discovered) {
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
  const nodes = new Map<PipelineNode<unknown>, TopoNode>();
  // need to convert from looking at dependencies of each node, to looking at upstream state for each node
  graph.forEach((_, node) => {
    nodes.set(node, {
      phase: NodePhase.undiscovered,
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
