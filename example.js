const topx = require("./api");

const pipeline = topx.pipeline();

const a = pipeline.node();
const b = pipeline.node((aState) => {
  return aState + 2;
});
const c = pipeline.node((aState, bState) => {
  console.log("c state only gets updated once!");
  return (aState + bState) * 2;
});

const dependencies = new Map();
dependencies.set(a, []);
dependencies.set(b, [a]);
dependencies.set(c, [a, b]);

pipeline.setDependencies(dependencies);

a.commit(1);
console.log(a.state);
console.log(b.state);
console.log(c.state);
