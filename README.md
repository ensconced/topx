# topx

_A small and simple reactive state-management library._

Think of your program as a data-transformation pipeline.

Each stage of the pipeline is called a node.

A node is like a self-contained cell of data.

The state of each node might be dependent on the state of any number of other nodes.

The result is a directed acyclic graph of dependencies between nodes.

With topx, you declare this dependency graph up-front.

This means that after the state of one node changes, topx can automatically propagate
that change throughout the dependency-graph as necessary.

topx avoids problems

An attempt to create a dependency cycle will be detected, and will throw an error.

A simple example:

```typescript
// node "a" has no dependencies
const a = pipeline.node("a");

// The state of node "b" is derived from the state of node "a".
// We pass an updater function which defines how the state of "b"
// is derived from the state of "a".
const b = pipeline.node("b", (aState) => aState + 1);

// node "c" has a dependency on "b", so when "b" updates,
// the updater function for "c" will update. This updater function
// doesn't return anything, so "c" doesn't have any state of its own,
// it just has some side effects (in this case, writing to the console).
const c = pipeline.node("c", (bState) => {
  console.log(`node c recieved state: ${bState}`);
});

// create the dependency graph
const dependencies = new Map();

// "a" has no dependencies
dependencies.set(a, []);
// "b" depends on "a"
dependencies.set(b, [a]);
// "c" depends on "b"
dependencies.set(c, [b]);
pipeline.setDependencies(dependencies);

// now update the state of "a"
a.commit(10);
// (Console output) "node c recieved state: 11"
console.log(b.state); //
```

<!-- Believe it or not, the name topx was not inspired by mobx (I wasn't really aware
of mobx when I first wrote this.) However, the principles are very similar -
topological ordering. It's like a very small, very simple version of mobx,
without the magic (it doesn't do automatic property-tracing so you have to be a
bit more explicit about the dependencies of each data cell)

your program transforms data from one form into another -->
