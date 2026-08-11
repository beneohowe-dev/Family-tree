const assert = require("node:assert/strict");
const {
  describeRelationship,
  shortestPath,
  createGraph,
  layoutFamilyTree,
  validateRelationshipAddition
} = require("../relationship-engine");

const people = [
  { id: "arthur", name: "Arthur Howe", gender: "male" },
  { id: "elsie", name: "Elsie Howe", gender: "female" },
  { id: "margaret", name: "Margaret Howe", gender: "female" },
  { id: "william", name: "William Howe", gender: "male" },
  { id: "david", name: "David Howe", gender: "male" },
  { id: "emma", name: "Emma Hart", gender: "female" },
  { id: "james", name: "James Hart", gender: "male" },
  { id: "tom", name: "Tom Reed", gender: "male" },
  { id: "ben", name: "Ben Howe", gender: "male" },
  { id: "sam", name: "Sam Reed", gender: "male" },
  { id: "peter", name: "Peter Howe", gender: "male" },
  { id: "nina", name: "Nina Jones", gender: "female" },
  { id: "sarah", name: "Sarah Jones", gender: "female" },
  { id: "ravi", name: "Ravi Jones", gender: "male" },
  { id: "alex", name: "Alex Stone", gender: "unknown" },
  { id: "jordan", name: "Jordan Stone", gender: "unknown" },
  { id: "taylor", name: "Taylor Stone", gender: "female" }
];

const relationships = [
  rel("arthur", "margaret", "biological_parent"),
  rel("elsie", "margaret", "biological_parent"),
  rel("arthur", "william", "biological_parent"),
  rel("elsie", "william", "biological_parent"),
  rel("david", "emma", "biological_parent"),
  rel("margaret", "emma", "biological_parent"),
  rel("james", "ben", "biological_parent"),
  rel("emma", "ben", "biological_parent"),
  rel("tom", "sam", "biological_parent"),
  rel("emma", "sam", "biological_parent"),
  rel("william", "peter", "biological_parent"),
  rel("nina", "sarah", "biological_parent"),
  rel("peter", "sarah", "biological_parent"),
  rel("sarah", "ravi", "spouse"),
  rel("alex", "jordan", "spouse"),
  rel("jordan", "taylor", "sibling")
];

function rel(from, to, type) {
  return {
    id: `${from}-${to}-${type}`,
    from,
    to,
    type,
    status: "active"
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("second cousins are generated from shared great-grandparents", () => {
  const result = describeRelationship("sarah", "ben", people, relationships);
  assert.equal(result.label, "second cousin");
  assert.equal(result.sentence, "Sarah Jones is Ben Howe's second cousin.");
  assert.deepEqual(result.path, ["sarah", "peter", "william", "arthur", "margaret", "emma", "ben"]);
});

test("removed cousins are described without pretending they are aunts or uncles", () => {
  const result = describeRelationship("emma", "sarah", people, relationships);
  assert.equal(result.label, "first cousin once removed");
});

test("ancestors use generation-aware terms", () => {
  const result = describeRelationship("arthur", "ben", people, relationships);
  assert.equal(result.label, "great-grandfather");
  assert.equal(result.sentence, "Arthur Howe is Ben Howe's great-grandfather.");
});

test("one shared parent creates a half-sibling relationship", () => {
  const result = describeRelationship("sam", "ben", people, relationships);
  assert.equal(result.label, "half-sibling");
});

test("spouse relationships are read as recorded structural data", () => {
  const result = describeRelationship("sarah", "ravi", people, relationships);
  assert.equal(result.label, "husband");
  assert.equal(result.confidence, "recorded");
});

test("sibling-in-law is detected through a partner sibling path", () => {
  const result = describeRelationship("alex", "taylor", people, relationships);
  assert.equal(result.label, "sister-in-law");
  assert.deepEqual(result.path, ["alex", "jordan", "taylor"]);
});

test("direct family roles are described from recorded labels", () => {
  const result = describeRelationship("alex", "ben", people, relationships.concat([
    rel("alex", "ben", "direct_cousin")
  ]));
  assert.equal(result.label, "cousin");
  assert.equal(result.sentence, "Alex Stone is Ben Howe's cousin.");
  assert.equal(result.confidence, "recorded");
  assert.deepEqual(result.path, ["alex", "ben"]);
});

test("layout keeps generations separate regardless of birth year", () => {
  const samplePeople = [
    { id: "parent", name: "Young Parent", birthYear: 1995 },
    { id: "child", name: "Older Child", birthYear: 1983 }
  ];
  const sampleRelationships = [rel("parent", "child", "biological_parent")];
  const layout = layoutFamilyTree(samplePeople, sampleRelationships, {
    rootId: "child",
    nodeWidth: 168,
    nodeHeight: 248,
    originX: 1000,
    originY: 1000,
    rowGap: 330
  });
  assert.equal(layout.generations.get("parent"), -1);
  assert.equal(layout.generations.get("child"), 0);
  assert.ok(layout.positions.get("parent").y < layout.positions.get("child").y);
});

test("layout reserves enough horizontal space for siblings", () => {
  const siblingPeople = [
    { id: "p1", name: "Parent One" },
    { id: "p2", name: "Parent Two" },
    { id: "c1", name: "Child One", birthYear: 1980 },
    { id: "c2", name: "Child Two", birthYear: 1981 },
    { id: "c3", name: "Child Three", birthYear: 1982 },
    { id: "c4", name: "Child Four", birthYear: 1983 }
  ];
  const siblingRelationships = [
    rel("p1", "p2", "partner"),
    rel("p1", "c1", "biological_parent"),
    rel("p2", "c1", "biological_parent"),
    rel("p1", "c2", "biological_parent"),
    rel("p2", "c2", "biological_parent"),
    rel("p1", "c3", "biological_parent"),
    rel("p2", "c3", "biological_parent"),
    rel("p1", "c4", "biological_parent"),
    rel("p2", "c4", "biological_parent")
  ];
  const layout = layoutFamilyTree(siblingPeople, siblingRelationships, { rootId: "c1", nodeWidth: 168, nodeHeight: 248 });
  const childXs = ["c1", "c2", "c3", "c4"].map((id) => layout.positions.get(id).x).sort((a, b) => a - b);
  for (let index = 1; index < childXs.length; index += 1) {
    assert.ok(childXs[index] - childXs[index - 1] >= 168);
  }
});

test("layout handles remarriage children in the child generation", () => {
  const remarriagePeople = [
    { id: "john", name: "John" },
    { id: "sarah", name: "Sarah" },
    { id: "emma", name: "Emma" },
    { id: "peter", name: "Peter" },
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
    { id: "d", name: "D" },
    { id: "e", name: "E" }
  ];
  const remarriageRelationships = [
    rel("john", "sarah", "former_spouse"),
    rel("john", "emma", "spouse"),
    rel("sarah", "peter", "spouse"),
    rel("john", "a", "biological_parent"),
    rel("sarah", "a", "biological_parent"),
    rel("john", "b", "biological_parent"),
    rel("sarah", "b", "biological_parent"),
    rel("john", "c", "biological_parent"),
    rel("emma", "c", "biological_parent"),
    rel("sarah", "d", "biological_parent"),
    rel("peter", "d", "biological_parent"),
    rel("sarah", "e", "biological_parent"),
    rel("peter", "e", "biological_parent")
  ];
  const layout = layoutFamilyTree(remarriagePeople, remarriageRelationships, { rootId: "a", nodeWidth: 168, nodeHeight: 248 });
  ["a", "b", "c", "d", "e"].forEach((id) => {
    assert.equal(layout.generations.get(id), 0);
  });
  assert.ok(layout.familyGroups.length >= 3);
});

test("relationship validation blocks circular parentage and duplicates", () => {
  const validationPeople = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" }
  ];
  const validationRelationships = [
    rel("a", "b", "biological_parent"),
    rel("b", "c", "biological_parent")
  ];
  assert.equal(validateRelationshipAddition(validationPeople, validationRelationships, {
    from: "c",
    to: "a",
    type: "biological_parent"
  }).valid, false);
  assert.equal(validateRelationshipAddition(validationPeople, validationRelationships, {
    from: "a",
    to: "b",
    type: "biological_parent"
  }).valid, false);
});

test("shortest path still exposes ambiguous graph connectivity", () => {
  const graph = createGraph(people, relationships);
  assert.deepEqual(shortestPath("ben", "sarah", graph), ["ben", "emma", "margaret", "arthur", "william", "peter", "sarah"]);
});
