const assert = require("node:assert/strict");
const {
  describeRelationship,
  shortestPath,
  createGraph
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

test("shortest path still exposes ambiguous graph connectivity", () => {
  const graph = createGraph(people, relationships);
  assert.deepEqual(shortestPath("ben", "sarah", graph), ["ben", "emma", "margaret", "arthur", "william", "peter", "sarah"]);
});
