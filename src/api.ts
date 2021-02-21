import computeTopologicalOrdering from "./topological-ordering";
import transpose from "./transpose";
import { Pipeline, PipelineGraph, PipelineNode } from "./types";

export default function makePipeline(): Pipeline {
  let dependencyMatrix: PipelineGraph;
  let topologicalOrdering: PipelineNode<unknown>[];
  let graph: PipelineGraph;

  function orderedDependents(source: PipelineNode<any>) {
    const allReachableNodes = new Set();
    // TODO - is it worth re-using the dfs function here?
    function addChildren(parent: PipelineNode<any>) {
      const children = graph.get(parent);
      if (!children) throw new Error("node missing from graph");
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

  function node<State, UpstreamState extends unknown[]>(
    name: string,
    updater?: (...upstreamState: UpstreamState) => void
  ) {
    const resultNode = { name } as PipelineNode<State>;
    function commit(this: PipelineNode<State>, newState: State) {
      this.state = newState;
      orderedDependents(this).forEach((dep) => dep.update());
    }
    function update(this: PipelineNode<any>) {
      if (updater) {
        const upstreamNodes = dependencyMatrix.get(this);
        if (!upstreamNodes) throw new Error("could not find upstream nodes");
        this.state = updater(
          ...(upstreamNodes.map((dep) => dep.state) as UpstreamState)
        );
      }
    }
    resultNode.commit = commit.bind(resultNode);
    resultNode.update = update.bind(resultNode);
    return resultNode;
  }

  return {
    node,
    setDependencies(dependencies: PipelineGraph) {
      dependencyMatrix = dependencies;
      graph = transpose(dependencies);
      topologicalOrdering = computeTopologicalOrdering(graph);
    },
  };
}
