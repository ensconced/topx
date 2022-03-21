declare function makePipeline(): Pipeline;
export default makePipeline;
export type PipelineNode<State> = {
  name: string;
  state: State;
  commit: (newState: State) => void;
  update: () => void;
};
export type PipelineGraph = Map<PipelineNode<any>, PipelineNode<any>[]>;
export interface Pipeline {
  node<State, UpstreamState extends unknown[]>(
    name: string,
    updater?: (...upstreamState: UpstreamState) => void
  ): PipelineNode<State>;
  setDependencies(dependencyGraph: PipelineGraph): void;
}
