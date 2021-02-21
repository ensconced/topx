export type PipelineNode<State> = {
  name: string;
  state: State;
  commit: (newState: State) => void;
  update: () => void;
};
export type PipelineGraph = Map<PipelineNode<unknown>, PipelineNode<unknown>[]>;
export interface Pipeline {
  node<State, UpstreamState extends unknown[]>(
    name: string,
    updater?: (...upstreamState: UpstreamState) => void
  ): PipelineNode<State>;
  setDependencies(dependencyGraph: PipelineGraph): void;
}
