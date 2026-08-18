export interface TopologyNode<TType extends string = string> {
  id: string;
  type: TType;
}

export interface TopologyEdge<TRelation extends string = string> {
  source: string;
  target: string;
  type?: TRelation;
}

export interface APITopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

