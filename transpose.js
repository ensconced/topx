function transpose(directedGraph) {
  const result = new Map();
  directedGraph.forEach((targets, source) => {
    if (!result.has(source)) {
      result.set(source, []);
    }
    targets.forEach((target) => {
      const arr = result.get(target);
      arr.push(source);
    });
  });
  return result;
}

module.exports = transpose;
