import * as topx from "./api";
import { Pipeline } from "./api.d";

describe("pipeline", () => {
  let pipeline: Pipeline;
  beforeEach(() => {
    pipeline = topx.pipeline();
  });
  it("propagates updates along a simple chain", () => {
    const a = pipeline.node("a");
    const b = pipeline.node<number, [number]>("b", (aState) => aState + 1);
    const spy = jest.fn();
    const c = pipeline.node("c", spy);
    const dependencies = new Map();
    dependencies.set(a, []);
    dependencies.set(b, [a]);
    dependencies.set(c, [b]);
    pipeline.setDependencies(dependencies);
    a.commit(10);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(11);
  });

  it("propagates updates along a diamond-shaped graph", () => {
    const a = pipeline.node("a");
    const b = pipeline.node<number, [number]>("b", (aState) => aState + 1);
    const c = pipeline.node<number, [number]>("c", (aState) => aState + 2);
    const spy = jest.fn();
    const d = pipeline.node("d", spy);
    const dependencies = new Map();
    dependencies.set(a, []);
    dependencies.set(b, [a]);
    dependencies.set(c, [a]);
    dependencies.set(d, [b, c]);
    pipeline.setDependencies(dependencies);
    a.commit(10);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(11, 12);
  });

  it("throws an error if there is a dependency cycle", () => {
    const a = pipeline.node<number, [number]>("a", (bState) => bState + 1);
    const b = pipeline.node<number, [number]>("b", (cState) => cState + 2);
    const c = pipeline.node<number, [number]>("c", (aState) => aState + 3);
    const dependencies = new Map();
    dependencies.set(a, [b]);
    dependencies.set(b, [c]);
    dependencies.set(c, [a]);
    expect(() => {
      pipeline.setDependencies(dependencies);
    }).toThrow(
      "Dependency cycle detected in the data pipeline: a -> b -> c -> a"
    );
  });
});
