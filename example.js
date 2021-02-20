const topx = require("./api");

const pipeline = topx.pipeline();

const a = pipeline.node();
const b = pipeline.node((aState) => {
  return aState + 2;
});

const dependencies = new Map();
dependencies.set(a, []);
dependencies.set(b, [a]);

pipeline.setDependencies(dependencies);

a.commit(1);
console.log(a.state);
console.log(b.state);
