import type { EntityKind, Organisation, Person, Relationship } from "./types";

export type EntityRef = `${EntityKind}:${string}`;

export interface GraphNode {
  ref: EntityRef;
  label: string;
  kind: EntityKind;
}

function ref(kind: EntityKind, id: string): EntityRef {
  return `${kind}:${id}`;
}

export function getEntityLabel(refValue: EntityRef, people: Person[], organisations: Organisation[]): string {
  const [kind, id] = refValue.split(":") as [EntityKind, string];
  if (kind === "person") return people.find((person) => person.id === id)?.fullName || id;
  if (kind === "organisation") return organisations.find((organisation) => organisation.id === id)?.name || id;
  return id;
}

export function buildGraphNodes(people: Person[], organisations: Organisation[]): GraphNode[] {
  return [
    ...people.map((person) => ({ ref: ref("person", person.id), label: person.fullName, kind: "person" as const })),
    ...organisations.map((organisation) => ({
      ref: ref("organisation", organisation.id),
      label: organisation.name,
      kind: "organisation" as const
    }))
  ];
}

export function shortestRelationshipPath(
  from: EntityRef,
  to: EntityRef,
  relationships: Relationship[]
): EntityRef[] {
  if (from === to) return [from];

  const adjacency = new Map<EntityRef, EntityRef[]>();

  relationships.forEach((relationship) => {
    const a = ref(relationship.fromKind, relationship.fromId);
    const b = ref(relationship.toKind, relationship.toId);
    adjacency.set(a, [...(adjacency.get(a) || []), b]);
    adjacency.set(b, [...(adjacency.get(b) || []), a]);
  });

  const queue: EntityRef[][] = [[from]];
  const visited = new Set<EntityRef>([from]);

  while (queue.length) {
    const path = queue.shift();
    if (!path) break;
    const current = path[path.length - 1];

    for (const next of adjacency.get(current) || []) {
      if (visited.has(next)) continue;
      const nextPath = [...path, next];
      if (next === to) return nextPath;
      visited.add(next);
      queue.push(nextPath);
    }
  }

  return [];
}

export function describeRelationshipPath(
  path: EntityRef[],
  relationships: Relationship[],
  people: Person[],
  organisations: Organisation[]
): string[] {
  if (path.length <= 1) return path.map((item) => getEntityLabel(item, people, organisations));

  return path.map((item, index) => {
    const label = getEntityLabel(item, people, organisations);
    if (index === 0) return label;
    const previous = path[index - 1];
    const relationship = relationships.find((candidate) => {
      const a = ref(candidate.fromKind, candidate.fromId);
      const b = ref(candidate.toKind, candidate.toId);
      return (a === previous && b === item) || (a === item && b === previous);
    });
    return relationship ? `${relationship.type}: ${label}` : label;
  });
}
