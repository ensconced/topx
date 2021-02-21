import { PipelineGraph } from "./types";

function transpose(directedGraph: PipelineGraph): PipelineGraph {
  const result = new Map();
  directedGraph.forEach((targets, source) => {
    if (!result.has(source)) {
      result.set(source, []);
    }
    targets.forEach((target) => {
      if (!result.has(target)) {
        result.set(target, []);
      }
      const arr = result.get(target);
      arr.push(source);
    });
  });
  return result;
}

export default transpose;
