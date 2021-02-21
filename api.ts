import computeTopologicalOrdering from "./topological-ordering";
import transpose from "./transpose";
import { Pipeline, PipelineGraph, PipelineNode } from "./api.d";

export function pipeline(): Pipeline {
  let dependencyMatrix: PipelineGraph;
  let topologicalOrdering: PipelineNode<unknown>[];
  let graph: PipelineGraph;

  function orderedDependents<SourceState>(source: PipelineNode<SourceState>) {
    const allReachableNodes = new Set();
    // TODO - is it worth re-using the dfs function here?
    function addChildren<ParentState>(parent: PipelineNode<ParentState>) {
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

  function node<State>(
    name: string,
    updater?: (...upstreamState: unknown[]) => State
  ) {
    const resultNode = ({
      name,
    } as unknown) as PipelineNode<State>; // TODO - lose this gross assertion...
    function commit(this: PipelineNode<State>, newState: State) {
      this.state = newState;
      orderedDependents(this).forEach((dep) => dep.update());
    }
    function update(this: PipelineNode<State>) {
      if (updater) {
        const upstreamNodes = dependencyMatrix.get(this);
        if (!upstreamNodes) throw new Error("could not find upstream nodes");
        this.state = updater(...upstreamNodes.map((dep) => dep.state));
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
