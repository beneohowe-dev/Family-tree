(function attachRelationshipEngine(root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RelationshipEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createEngine() {
  var PARENT_TYPES = new Set([
    "biological_parent",
    "adoptive_parent",
    "step_parent",
    "foster_parent",
    "guardian"
  ]);

  var PARTNER_TYPES = new Set([
    "spouse",
    "partner",
    "former_spouse",
    "former_partner"
  ]);

  var STRUCTURAL_TYPES = new Set([
    "biological_parent",
    "adoptive_parent",
    "step_parent",
    "foster_parent",
    "guardian",
    "spouse",
    "partner",
    "former_spouse",
    "former_partner",
    "sibling",
    "direct_cousin",
    "direct_aunt_uncle",
    "direct_grandparent",
    "direct_grandchild",
    "direct_family_link"
  ]);

  var DIRECT_TYPES = new Set([
    "direct_cousin",
    "direct_aunt_uncle",
    "direct_grandparent",
    "direct_grandchild",
    "direct_family_link"
  ]);

  function activeRelationships(relationships) {
    return relationships.filter(function keepActive(relationship) {
      return relationship.status !== "deleted" && STRUCTURAL_TYPES.has(relationship.type);
    });
  }

  function createGraph(people, relationships) {
    var byId = new Map();
    var parentsByChild = new Map();
    var childrenByParent = new Map();
    var partnersByPerson = new Map();
    var directRelationsByPerson = new Map();
    var explicitSiblings = new Map();
    var adjacency = new Map();

    people.forEach(function indexPerson(person) {
      byId.set(person.id, person);
      parentsByChild.set(person.id, []);
      childrenByParent.set(person.id, []);
      partnersByPerson.set(person.id, []);
      directRelationsByPerson.set(person.id, []);
      explicitSiblings.set(person.id, []);
      adjacency.set(person.id, []);
    });

    activeRelationships(relationships).forEach(function indexRelationship(relationship) {
      var from = relationship.from;
      var to = relationship.to;
      if (!byId.has(from) || !byId.has(to)) return;

      if (PARENT_TYPES.has(relationship.type)) {
        parentsByChild.get(to).push({
          id: from,
          relationshipId: relationship.id,
          type: relationship.type
        });
        childrenByParent.get(from).push({
          id: to,
          relationshipId: relationship.id,
          type: relationship.type
        });
        adjacency.get(from).push({
          id: to,
          relationshipId: relationship.id,
          direction: "child",
          type: relationship.type
        });
        adjacency.get(to).push({
          id: from,
          relationshipId: relationship.id,
          direction: "parent",
          type: relationship.type
        });
      }

      if (PARTNER_TYPES.has(relationship.type)) {
        partnersByPerson.get(from).push({
          id: to,
          relationshipId: relationship.id,
          type: relationship.type
        });
        partnersByPerson.get(to).push({
          id: from,
          relationshipId: relationship.id,
          type: relationship.type
        });
        adjacency.get(from).push({
          id: to,
          relationshipId: relationship.id,
          direction: "partner",
          type: relationship.type
        });
        adjacency.get(to).push({
          id: from,
          relationshipId: relationship.id,
          direction: "partner",
          type: relationship.type
        });
      }

      if (relationship.type === "sibling") {
        explicitSiblings.get(from).push({
          id: to,
          relationshipId: relationship.id,
          type: relationship.type
        });
        explicitSiblings.get(to).push({
          id: from,
          relationshipId: relationship.id,
          type: relationship.type
        });
        adjacency.get(from).push({
          id: to,
          relationshipId: relationship.id,
          direction: "sibling",
          type: relationship.type
        });
        adjacency.get(to).push({
          id: from,
          relationshipId: relationship.id,
          direction: "sibling",
          type: relationship.type
        });
      }

      if (DIRECT_TYPES.has(relationship.type)) {
        directRelationsByPerson.get(from).push({
          id: to,
          relationshipId: relationship.id,
          type: relationship.type,
          direction: "from"
        });
        directRelationsByPerson.get(to).push({
          id: from,
          relationshipId: relationship.id,
          type: relationship.type,
          direction: "to"
        });
        adjacency.get(from).push({
          id: to,
          relationshipId: relationship.id,
          direction: relationship.type,
          type: relationship.type
        });
        adjacency.get(to).push({
          id: from,
          relationshipId: relationship.id,
          direction: relationship.type,
          type: relationship.type
        });
      }
    });

    return {
      byId: byId,
      parentsByChild: parentsByChild,
      childrenByParent: childrenByParent,
      partnersByPerson: partnersByPerson,
      directRelationsByPerson: directRelationsByPerson,
      explicitSiblings: explicitSiblings,
      adjacency: adjacency
    };
  }

  function getName(graph, id) {
    var person = graph.byId.get(id);
    return person ? person.name : "Unknown person";
  }

  function possessive(name) {
    return name.endsWith("s") ? name + "'" : name + "'s";
  }

  function gendered(person, feminine, masculine, neutral) {
    if (!person) return neutral;
    if (person.gender === "female") return feminine;
    if (person.gender === "male") return masculine;
    return neutral;
  }

  function ordinal(number) {
    var words = [
      "",
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
      "seventh",
      "eighth",
      "ninth",
      "tenth"
    ];
    return words[number] || number + "th";
  }

  function greatPrefix(count) {
    if (count <= 0) return "";
    if (count === 1) return "great-";
    return Array(count).fill("great").join("-") + "-";
  }

  function ancestorTerm(distance, ancestor) {
    if (distance === 1) return gendered(ancestor, "mother", "father", "parent");
    if (distance === 2) {
      return gendered(ancestor, "grandmother", "grandfather", "grandparent");
    }
    return greatPrefix(distance - 2) + gendered(ancestor, "grandmother", "grandfather", "grandparent");
  }

  function descendantTerm(distance, descendant) {
    if (distance === 1) return gendered(descendant, "daughter", "son", "child");
    if (distance === 2) {
      return gendered(descendant, "granddaughter", "grandson", "grandchild");
    }
    return greatPrefix(distance - 2) + gendered(descendant, "granddaughter", "grandson", "grandchild");
  }

  function avuncularTerm(generationGap, person) {
    var base = gendered(person, "aunt", "uncle", "aunt/uncle");
    if (generationGap === 1) return base;
    return greatPrefix(generationGap - 1) + base;
  }

  function niblingTerm(generationGap, person) {
    var base = gendered(person, "niece", "nephew", "niece/nephew");
    if (generationGap === 1) return base;
    return greatPrefix(generationGap - 1) + base;
  }

  function cousinTerm(distanceA, distanceB) {
    var degree = Math.min(distanceA, distanceB) - 1;
    var removed = Math.abs(distanceA - distanceB);
    var term = ordinal(degree) + " cousin";
    if (removed === 1) return term + " once removed";
    if (removed > 1) return term + " " + removed + " times removed";
    return term;
  }

  function hasStepOrAdoptive(path, graph) {
    var relationshipIds = new Set();
    for (var i = 0; i < path.length - 1; i += 1) {
      var current = path[i];
      var next = path[i + 1];
      var edges = graph.adjacency.get(current) || [];
      var edge = edges.find(function findEdge(candidate) {
        return candidate.id === next;
      });
      if (edge) relationshipIds.add(edge.relationshipId + ":" + edge.type);
    }
    var types = Array.from(relationshipIds).map(function toType(value) {
      return value.split(":")[1];
    });
    if (types.some(function isStep(type) { return type === "step_parent"; })) return "step";
    if (types.some(function isAdoptive(type) { return type === "adoptive_parent"; })) return "adoptive";
    if (types.some(function isFoster(type) { return type === "foster_parent"; })) return "foster";
    return "";
  }

  function findAncestors(startId, graph) {
    var ancestors = new Map();
    var queue = [{
      id: startId,
      depth: 0,
      path: [startId]
    }];
    var visited = new Set([startId]);

    while (queue.length) {
      var current = queue.shift();
      ancestors.set(current.id, current);
      var parents = graph.parentsByChild.get(current.id) || [];
      parents.forEach(function visitParent(parent) {
        if (visited.has(parent.id)) return;
        visited.add(parent.id);
        queue.push({
          id: parent.id,
          depth: current.depth + 1,
          path: current.path.concat(parent.id)
        });
      });
    }

    return ancestors;
  }

  function sharedParents(personAId, personBId, graph) {
    var aParents = graph.parentsByChild.get(personAId) || [];
    var bParents = graph.parentsByChild.get(personBId) || [];
    var bParentIds = new Set(bParents.map(function toId(parent) { return parent.id; }));
    return aParents.filter(function shared(parent) {
      return bParentIds.has(parent.id);
    });
  }

  function siblingInfo(personAId, personBId, graph) {
    var explicit = (graph.explicitSiblings.get(personAId) || []).some(function isMatch(sibling) {
      return sibling.id === personBId;
    });
    var shared = sharedParents(personAId, personBId, graph);
    if (!explicit && shared.length === 0) return null;
    var aParentCount = (graph.parentsByChild.get(personAId) || []).length;
    var bParentCount = (graph.parentsByChild.get(personBId) || []).length;
    var half = shared.length === 1 && (aParentCount > 1 || bParentCount > 1);
    return {
      half: half,
      sharedParentIds: shared.map(function toId(parent) { return parent.id; })
    };
  }

  function shortestPath(personAId, personBId, graph) {
    if (personAId === personBId) return [personAId];
    var queue = [{ id: personAId, path: [personAId] }];
    var visited = new Set([personAId]);

    while (queue.length) {
      var current = queue.shift();
      var edges = graph.adjacency.get(current.id) || [];
      for (var i = 0; i < edges.length; i += 1) {
        var next = edges[i].id;
        if (visited.has(next)) continue;
        var path = current.path.concat(next);
        if (next === personBId) return path;
        visited.add(next);
        queue.push({ id: next, path: path });
      }
    }

    return [];
  }

  function isParentType(type) {
    return PARENT_TYPES.has(type);
  }

  function isPartnerType(type) {
    return PARTNER_TYPES.has(type);
  }

  function sortByBirthThenName(a, b) {
    var birthA = birthSortValue(a);
    var birthB = birthSortValue(b);
    if (birthA !== birthB) return birthA - birthB;
    return String(a.name || a.id).localeCompare(String(b.name || b.id));
  }

  function birthSortValue(person) {
    if (!person) return Number.POSITIVE_INFINITY;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(person.birthDate || ""))) {
      return Number(String(person.birthDate).replace(/-/g, ""));
    }
    var year = Number(person.birthYear);
    return Number.isFinite(year) && year > 0 ? year * 10000 : Number.POSITIVE_INFINITY;
  }

  function relationshipLevelDelta(relationship, currentId) {
    if (isParentType(relationship.type)) {
      if (relationship.from === currentId) return { id: relationship.to, delta: 1 };
      if (relationship.to === currentId) return { id: relationship.from, delta: -1 };
    }
    if (isPartnerType(relationship.type) || relationship.type === "sibling" || relationship.type === "direct_cousin" || relationship.type === "direct_family_link") {
      if (relationship.from === currentId) return { id: relationship.to, delta: 0 };
      if (relationship.to === currentId) return { id: relationship.from, delta: 0 };
    }
    if (relationship.type === "direct_aunt_uncle") {
      if (relationship.from === currentId) return { id: relationship.to, delta: 1 };
      if (relationship.to === currentId) return { id: relationship.from, delta: -1 };
    }
    if (relationship.type === "direct_grandparent") {
      if (relationship.from === currentId) return { id: relationship.to, delta: 2 };
      if (relationship.to === currentId) return { id: relationship.from, delta: -2 };
    }
    if (relationship.type === "direct_grandchild") {
      if (relationship.from === currentId) return { id: relationship.to, delta: -2 };
      if (relationship.to === currentId) return { id: relationship.from, delta: 2 };
    }
    return null;
  }

  function personLevelMap(people, relationships, rootId) {
    var ids = new Set(people.map(function toId(person) { return person.id; }));
    var active = activeRelationships(relationships).filter(function hasPeople(relationship) {
      return ids.has(relationship.from) && ids.has(relationship.to);
    });
    var levels = new Map();
    var warnings = [];
    var root = ids.has(rootId) ? rootId : (people[0] && people[0].id);
    if (!root) return { levels: levels, warnings: warnings };
    var queue = [root];
    levels.set(root, 0);

    while (queue.length) {
      var current = queue.shift();
      var currentLevel = levels.get(current);
      active.forEach(function visit(relationship) {
        if (relationship.from !== current && relationship.to !== current) return;
        var next = relationshipLevelDelta(relationship, current);
        if (!next || !ids.has(next.id)) return;
        var wanted = currentLevel + next.delta;
        if (!levels.has(next.id)) {
          levels.set(next.id, wanted);
          queue.push(next.id);
        } else if (levels.get(next.id) !== wanted && isParentType(relationship.type)) {
          warnings.push({
            type: "generation_conflict",
            relationshipId: relationship.id,
            personId: next.id
          });
        }
      });
    }

    people.forEach(function assignDisconnected(person) {
      if (!levels.has(person.id)) levels.set(person.id, 0);
    });

    var changed = true;
    var guard = 0;
    while (changed && guard < 10) {
      changed = false;
      guard += 1;
      active.forEach(function alignPartners(relationship) {
        if (!isPartnerType(relationship.type)) return;
        var fromLevel = levels.get(relationship.from);
        var toLevel = levels.get(relationship.to);
        if (fromLevel == null || toLevel == null || fromLevel === toLevel) return;
        var aligned = Math.min(fromLevel, toLevel);
        if (levels.get(relationship.from) !== aligned) {
          levels.set(relationship.from, aligned);
          changed = true;
        }
        if (levels.get(relationship.to) !== aligned) {
          levels.set(relationship.to, aligned);
          changed = true;
        }
      });
    }

    return { levels: levels, warnings: warnings };
  }

  function disjointSet(items) {
    var parent = new Map();
    items.forEach(function init(item) { parent.set(item, item); });
    function find(item) {
      var current = parent.get(item);
      if (current !== item) {
        current = find(current);
        parent.set(item, current);
      }
      return current;
    }
    function union(a, b) {
      var rootA = find(a);
      var rootB = find(b);
      if (rootA !== rootB) parent.set(rootB, rootA);
    }
    return { find: find, union: union };
  }

  function familyGroups(people, relationships) {
    var ids = new Set(people.map(function toId(person) { return person.id; }));
    var groups = new Map();
    activeRelationships(relationships).forEach(function collect(relationship) {
      if (!isParentType(relationship.type) || !ids.has(relationship.from) || !ids.has(relationship.to)) return;
      var childId = relationship.to;
      var parents = activeRelationships(relationships).filter(function parentForChild(candidate) {
        return isParentType(candidate.type) && candidate.to === childId && ids.has(candidate.from);
      }).map(function toParent(candidate) {
        return candidate.from;
      }).sort();
      var key = parents.length ? parents.join(":") : relationship.from;
      if (!groups.has(key)) groups.set(key, { key: key, parentIds: parents, childIds: [] });
      if (groups.get(key).childIds.indexOf(childId) === -1) groups.get(key).childIds.push(childId);
    });
    return Array.from(groups.values());
  }

  function layoutFamilyTree(people, relationships, options) {
    var settings = options || {};
    var activePeople = people.filter(function visible(person) {
      return person && person.status !== "deleted";
    });
    var byId = new Map(activePeople.map(function pair(person) {
      return [person.id, person];
    }));
    var nodeWidth = settings.nodeWidth || 168;
    var nodeHeight = settings.nodeHeight || 248;
    var partnerGap = settings.partnerGap || 34;
    var unitGap = settings.unitGap || 116;
    var rowGap = settings.rowGap || 310;
    var originX = settings.originX || 1800;
    var originY = settings.originY || 1240;
    var levelInfo = personLevelMap(activePeople, relationships, settings.rootId);
    var levels = levelInfo.levels;
    var active = activeRelationships(relationships);
    var ids = new Set(activePeople.map(function toId(person) { return person.id; }));
    var groups = familyGroups(activePeople, relationships);
    var graph = createGraph(activePeople, relationships);
    var rowIds = new Map();
    var unitsByRoot = new Map();
    var unitByPerson = new Map();
    var positioned = new Map();
    var warnings = levelInfo.warnings.slice();

    activePeople.forEach(function rowPerson(person) {
      var level = levels.get(person.id) || 0;
      if (!rowIds.has(level)) rowIds.set(level, []);
      rowIds.get(level).push(person.id);
    });

    rowIds.forEach(function buildUnits(idsInRow, level) {
      var dsu = disjointSet(idsInRow);
      active.forEach(function joinPartners(relationship) {
        if (!isPartnerType(relationship.type)) return;
        if (idsInRow.indexOf(relationship.from) === -1 || idsInRow.indexOf(relationship.to) === -1) return;
        dsu.union(relationship.from, relationship.to);
      });
      var units = new Map();
      idsInRow.forEach(function addToUnit(id) {
        var root = dsu.find(id);
        if (!units.has(root)) {
          units.set(root, {
            id: level + ":" + root,
            level: level,
            personIds: [],
            width: 0,
            desiredX: null
          });
        }
        units.get(root).personIds.push(id);
      });
      units.forEach(function finishUnit(unit) {
        unit.personIds = unit.personIds.map(function toPerson(id) {
          return byId.get(id);
        }).filter(Boolean).sort(sortByBirthThenName).map(function toId(person) {
          return person.id;
        });
        unit.width = unit.personIds.length * nodeWidth + Math.max(0, unit.personIds.length - 1) * partnerGap;
        unitsByRoot.set(unit.id, unit);
        unit.personIds.forEach(function indexPerson(id) {
          unitByPerson.set(id, unit);
        });
      });
    });

    function knownPosition(id) {
      return positioned.get(id);
    }

    function desiredForUnit(unit) {
      if (unit.personIds.indexOf(settings.rootId) !== -1) return originX;
      var related = [];
      unit.personIds.forEach(function collect(personId) {
        (graph.parentsByChild.get(personId) || []).forEach(function add(parent) {
          var point = knownPosition(parent.id);
          if (point) related.push(point.x);
        });
        (graph.childrenByParent.get(personId) || []).forEach(function add(child) {
          var point = knownPosition(child.id);
          if (point) related.push(point.x);
        });
      });
      if (related.length) {
        return related.reduce(function sum(total, value) { return total + value; }, 0) / related.length;
      }
      var previous = unit.personIds.map(function previousX(id) {
        return byId.get(id) && Number.isFinite(byId.get(id).x) ? byId.get(id).x : null;
      }).filter(function valid(value) { return value != null; });
      if (previous.length) {
        return previous.reduce(function sum(total, value) { return total + value; }, 0) / previous.length;
      }
      return originX;
    }

    function placeRow(units, level) {
      units.forEach(function score(unit) {
        unit.desiredX = desiredForUnit(unit);
      });
      units.sort(function sortUnits(a, b) {
        if (a.desiredX !== b.desiredX) return a.desiredX - b.desiredX;
        var firstA = byId.get(a.personIds[0]);
        var firstB = byId.get(b.personIds[0]);
        return sortByBirthThenName(firstA, firstB);
      });
      var cursor = null;
      units.forEach(function assignUnit(unit) {
        var left = unit.desiredX - unit.width / 2;
        if (cursor == null) cursor = left;
        left = Math.max(left, cursor);
        unit.left = left;
        unit.center = left + unit.width / 2;
        cursor = left + unit.width + unitGap;
      });
      var anchorUnit = units.find(function hasRoot(unit) {
        return unit.personIds.indexOf(settings.rootId) !== -1;
      });
      var shift = 0;
      if (anchorUnit) {
        shift = originX - anchorUnit.center;
      } else if (units.length && !units.some(function hasRelated(unit) { return unit.personIds.some(function hasKnown(personId) {
        return (graph.parentsByChild.get(personId) || []).some(function parentKnown(parent) { return knownPosition(parent.id); }) ||
          (graph.childrenByParent.get(personId) || []).some(function childKnown(child) { return knownPosition(child.id); });
      }); })) {
        var minLeft = Math.min.apply(null, units.map(function left(unit) { return unit.left; }));
        var maxRight = Math.max.apply(null, units.map(function right(unit) { return unit.left + unit.width; }));
        shift = originX - (minLeft + maxRight) / 2;
      }
      units.forEach(function positionUnit(unit) {
        var left = unit.left + shift;
        unit.personIds.forEach(function positionPerson(personId, index) {
          positioned.set(personId, {
            x: Math.round(left + nodeWidth / 2 + index * (nodeWidth + partnerGap)),
            y: Math.round(originY + level * rowGap),
            generation: level
          });
        });
      });
    }

    var generationLevels = Array.from(rowIds.keys()).sort(function numeric(a, b) { return a - b; });
    generationLevels.forEach(function layoutLevel(level) {
      var units = Array.from(unitsByRoot.values()).filter(function sameLevel(unit) {
        return unit.level === level;
      });
      placeRow(units, level);
    });

    groups.forEach(function sortChildren(group) {
      group.childIds = group.childIds.map(function toPerson(id) {
        return byId.get(id);
      }).filter(Boolean).sort(sortByBirthThenName).map(function toId(person) {
        return person.id;
      });
    });

    return {
      positions: positioned,
      generations: levels,
      familyGroups: groups,
      warnings: warnings,
      bounds: layoutBounds(positioned, nodeWidth, nodeHeight)
    };
  }

  function layoutBounds(positions, nodeWidth, nodeHeight) {
    var points = Array.from(positions.values());
    if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    var halfW = nodeWidth / 2;
    var halfH = nodeHeight / 2;
    var minX = Math.min.apply(null, points.map(function min(point) { return point.x - halfW; }));
    var maxX = Math.max.apply(null, points.map(function max(point) { return point.x + halfW; }));
    var minY = Math.min.apply(null, points.map(function min(point) { return point.y - halfH; }));
    var maxY = Math.max.apply(null, points.map(function max(point) { return point.y + halfH; }));
    return {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function closestCommonAncestors(personAId, personBId, graph) {
    var ancestorsA = findAncestors(personAId, graph);
    var ancestorsB = findAncestors(personBId, graph);
    var matches = [];

    ancestorsA.forEach(function collect(aInfo, ancestorId) {
      var bInfo = ancestorsB.get(ancestorId);
      if (!bInfo) return;
      matches.push({
        id: ancestorId,
        distanceA: aInfo.depth,
        distanceB: bInfo.depth,
        pathA: aInfo.path,
        pathB: bInfo.path
      });
    });

    if (!matches.length) return [];

    matches.sort(function byCloseness(first, second) {
      var firstTotal = first.distanceA + first.distanceB;
      var secondTotal = second.distanceA + second.distanceB;
      if (firstTotal !== secondTotal) return firstTotal - secondTotal;
      return Math.max(first.distanceA, first.distanceB) - Math.max(second.distanceA, second.distanceB);
    });

    var best = matches[0];
    return matches.filter(function sameDistance(match) {
      return match.distanceA === best.distanceA && match.distanceB === best.distanceB;
    });
  }

  function namesFor(ids, graph) {
    return ids.map(function toName(id) { return getName(graph, id); }).join(" and ");
  }

  function buildCommonAncestorPath(match) {
    var left = match.pathA;
    var right = match.pathB.slice(0, -1).reverse();
    return left.concat(right);
  }

  function describePartnerType(type, person) {
    if (type === "spouse") return gendered(person, "wife", "husband", "spouse");
    if (type === "former_spouse") return "former spouse";
    if (type === "former_partner") return "former partner";
    return "partner";
  }

  function directPartner(personAId, personBId, graph) {
    var partner = (graph.partnersByPerson.get(personAId) || []).find(function findPartner(candidate) {
      return candidate.id === personBId;
    });
    if (!partner) return null;
    var aName = getName(graph, personAId);
    var bName = getName(graph, personBId);
    var bPerson = graph.byId.get(personBId);
    return {
      type: "partner",
      label: describePartnerType(partner.type, bPerson),
      sentence: bName + " is " + possessive(aName) + " " + describePartnerType(partner.type, bPerson) + ".",
      explanation: "This connection is recorded as " + partner.type.replace(/_/g, " ") + ".",
      path: [personAId, personBId],
      relationshipIds: [partner.relationshipId],
      confidence: "recorded"
    };
  }

  function directRelationshipLabel(relation, person) {
    if (relation.type === "direct_cousin") return "cousin";
    if (relation.type === "direct_family_link") return "relative";
    if (relation.type === "direct_aunt_uncle") {
      return relation.direction === "from"
        ? gendered(person, "aunt", "uncle", "aunt/uncle")
        : gendered(person, "niece", "nephew", "niece/nephew");
    }
    if (relation.type === "direct_grandparent") {
      return relation.direction === "from"
        ? gendered(person, "grandmother", "grandfather", "grandparent")
        : gendered(person, "granddaughter", "grandson", "grandchild");
    }
    if (relation.type === "direct_grandchild") {
      return relation.direction === "from"
        ? gendered(person, "granddaughter", "grandson", "grandchild")
        : gendered(person, "grandmother", "grandfather", "grandparent");
    }
    return "relative";
  }

  function directRecordedRelationship(personAId, personBId, graph) {
    var relation = (graph.directRelationsByPerson.get(personAId) || []).find(function findDirect(candidate) {
      return candidate.id === personBId;
    });
    if (!relation) return null;
    var aName = getName(graph, personAId);
    var bName = getName(graph, personBId);
    var aPerson = graph.byId.get(personAId);
    var label = directRelationshipLabel(relation, aPerson);
    return {
      type: relation.type.replace(/^direct_/, ""),
      label: label,
      sentence: aName + " is " + possessive(bName) + " " + label + ".",
      explanation: "This connection was added directly as a family role.",
      path: [personAId, personBId],
      relationshipIds: [relation.relationshipId],
      confidence: "recorded"
    };
  }

  function inLawRelationship(personAId, personBId, graph) {
    var aName = getName(graph, personAId);
    var bName = getName(graph, personBId);
    var bPerson = graph.byId.get(personBId);
    var aPartners = graph.partnersByPerson.get(personAId) || [];

    for (var i = 0; i < aPartners.length; i += 1) {
      var partner = aPartners[i];
      var sibling = siblingInfo(partner.id, personBId, graph);
      if (sibling) {
        return {
          type: "in_law",
          label: gendered(bPerson, "sister-in-law", "brother-in-law", "sibling-in-law"),
          sentence: bName + " is " + possessive(aName) + " " + gendered(bPerson, "sister-in-law", "brother-in-law", "sibling-in-law") + ".",
          explanation: bName + " is a sibling of " + possessive(aName) + " partner.",
          path: [personAId, partner.id].concat(shortestPath(partner.id, personBId, graph).slice(1)),
          relationshipIds: [],
          confidence: "derived"
        };
      }
    }

    var aSiblings = Array.from(graph.byId.keys()).filter(function possibleSibling(id) {
      return siblingInfo(personAId, id, graph);
    });

    for (var j = 0; j < aSiblings.length; j += 1) {
      var siblingId = aSiblings[j];
      var siblingPartners = graph.partnersByPerson.get(siblingId) || [];
      var match = siblingPartners.find(function findMatch(partner) {
        return partner.id === personBId;
      });
      if (match) {
        return {
          type: "in_law",
          label: gendered(bPerson, "sister-in-law", "brother-in-law", "sibling-in-law"),
          sentence: bName + " is " + possessive(aName) + " " + gendered(bPerson, "sister-in-law", "brother-in-law", "sibling-in-law") + ".",
          explanation: bName + " is partnered with " + possessive(aName) + " sibling.",
          path: [personAId].concat(shortestPath(personAId, siblingId, graph).slice(1), [personBId]),
          relationshipIds: [],
          confidence: "derived"
        };
      }
    }

    return null;
  }

  function describeViaAncestors(personAId, personBId, graph) {
    var aName = getName(graph, personAId);
    var bName = getName(graph, personBId);
    var aPerson = graph.byId.get(personAId);
    var bPerson = graph.byId.get(personBId);
    var matches = closestCommonAncestors(personAId, personBId, graph);
    if (!matches.length) return null;

    var best = matches[0];
    var ancestorNames = namesFor(matches.map(function toId(match) { return match.id; }), graph);
    var path = buildCommonAncestorPath(best);
    var modifier = hasStepOrAdoptive(path, graph);

    if (personAId === personBId) {
      return {
        type: "self",
        label: "same person",
        sentence: aName + " and " + bName + " are the same person.",
        explanation: "This is the selected profile.",
        path: [personAId],
        confidence: "recorded"
      };
    }

    if (best.distanceA === 0) {
      var descendant = descendantTerm(best.distanceB, bPerson);
      return {
        type: "ancestor",
        label: ancestorTerm(best.distanceB, aPerson),
        sentence: aName + " is " + possessive(bName) + " " + ancestorTerm(best.distanceB, aPerson) + ".",
        explanation: bName + " descends from " + aName + " across " + best.distanceB + " generation" + (best.distanceB === 1 ? "" : "s") + ".",
        inverse: bName + " is " + possessive(aName) + " " + descendant + ".",
        path: path,
        confidence: modifier || "derived"
      };
    }

    if (best.distanceB === 0) {
      return {
        type: "descendant",
        label: descendantTerm(best.distanceA, aPerson),
        sentence: aName + " is " + possessive(bName) + " " + descendantTerm(best.distanceA, aPerson) + ".",
        explanation: aName + " descends from " + bName + " across " + best.distanceA + " generation" + (best.distanceA === 1 ? "" : "s") + ".",
        path: path,
        confidence: modifier || "derived"
      };
    }

    if (best.distanceA === 1 && best.distanceB === 1) {
      var sibling = siblingInfo(personAId, personBId, graph);
      var label = sibling && sibling.half ? "half-sibling" : "sibling";
      return {
        type: label,
        label: label,
        sentence: aName + " and " + bName + " are " + label + "s.",
        explanation: "They share " + ancestorNames + ".",
        path: path,
        confidence: modifier || "derived"
      };
    }

    if (best.distanceA === 1 && best.distanceB > 1) {
      var aAvuncular = avuncularTerm(best.distanceB - 1, aPerson);
      return {
        type: "aunt_uncle",
        label: aAvuncular,
        sentence: aName + " is " + possessive(bName) + " " + aAvuncular + ".",
        explanation: aName + " and " + possessive(bName) + " ancestor " + ancestorNames + " are recorded as parent and child.",
        path: path,
        confidence: modifier || "derived"
      };
    }

    if (best.distanceB === 1 && best.distanceA > 1) {
      var aNibling = niblingTerm(best.distanceA - 1, aPerson);
      return {
        type: "niece_nephew",
        label: aNibling,
        sentence: aName + " is " + possessive(bName) + " " + aNibling + ".",
        explanation: bName + " and " + possessive(aName) + " ancestor " + ancestorNames + " are recorded as parent and child.",
        path: path,
        confidence: modifier || "derived"
      };
    }

    var cousin = cousinTerm(best.distanceA, best.distanceB);
    return {
      type: "cousin",
      label: cousin,
      sentence: aName + " is " + possessive(bName) + " " + cousin + ".",
      explanation: "They share " + ancestorTerm(best.distanceA, graph.byId.get(best.id)).replace(/mother|father/, "parent") + "s, " + ancestorNames + ".",
      path: path,
      confidence: modifier || (matches.length > 2 ? "multiple-common-ancestors" : "derived")
    };
  }

  function describeRelationship(personAId, personBId, people, relationships) {
    var graph = createGraph(people, relationships);

    if (!graph.byId.has(personAId) || !graph.byId.has(personBId)) {
      return {
        type: "unknown",
        label: "unknown",
        sentence: "One or both people are not available.",
        explanation: "The relationship could not be calculated from the permitted graph.",
        path: [],
        confidence: "unknown"
      };
    }

    if (personAId === personBId) {
      return {
        type: "self",
        label: "same person",
        sentence: getName(graph, personAId) + " and " + getName(graph, personBId) + " are the same person.",
        explanation: "This is the selected profile.",
        path: [personAId],
        confidence: "recorded"
      };
    }

    var partner = directPartner(personAId, personBId, graph);
    if (partner) return partner;

    var direct = directRecordedRelationship(personAId, personBId, graph);
    if (direct) return direct;

    var inLaw = inLawRelationship(personAId, personBId, graph);
    if (inLaw) return inLaw;

    var viaAncestors = describeViaAncestors(personAId, personBId, graph);
    if (viaAncestors) return viaAncestors;

    var path = shortestPath(personAId, personBId, graph);
    if (path.length) {
      return {
        type: "connected",
        label: "family connection",
        sentence: getName(graph, personAId) + " and " + getName(graph, personBId) + " are connected in this family space.",
        explanation: "The path exists, but the relationship is not expressible with the current terminology rules.",
        path: path,
        confidence: "ambiguous"
      };
    }

    return {
      type: "unconnected",
      label: "not connected",
      sentence: getName(graph, personAId) + " and " + getName(graph, personBId) + " are not connected in the visible family graph.",
      explanation: "A private or missing relationship may exist, but it is not available to this viewer.",
      path: [],
      confidence: "unknown"
    };
  }

  function isAncestorOf(ancestorId, descendantId, graph) {
    var queue = [ancestorId];
    var visited = new Set([ancestorId]);
    while (queue.length) {
      var current = queue.shift();
      var children = graph.childrenByParent.get(current) || [];
      for (var index = 0; index < children.length; index += 1) {
        var childId = children[index].id;
        if (childId === descendantId) return true;
        if (visited.has(childId)) continue;
        visited.add(childId);
        queue.push(childId);
      }
    }
    return false;
  }

  function validateRelationshipAddition(people, relationships, candidate) {
    var graph = createGraph(people, relationships);
    if (!candidate || !candidate.from || !candidate.to || !candidate.type) {
      return { valid: false, message: "Choose two people and a relationship first." };
    }
    if (!graph.byId.has(candidate.from) || !graph.byId.has(candidate.to)) {
      return { valid: false, message: "One of these people is no longer in the visible tree." };
    }
    if (candidate.from === candidate.to) {
      return { valid: false, message: "Someone cannot be related to themselves in that way." };
    }
    var duplicate = activeRelationships(relationships).some(function same(existing) {
      if (existing.type !== candidate.type) return false;
      if (existing.from === candidate.from && existing.to === candidate.to) return true;
      return (isPartnerType(existing.type) || existing.type === "sibling" || existing.type === "direct_cousin" || existing.type === "direct_family_link") &&
        existing.from === candidate.to &&
        existing.to === candidate.from;
    });
    if (duplicate) {
      return { valid: false, message: "That family connection already exists." };
    }
    if (isParentType(candidate.type)) {
      if (isAncestorOf(candidate.to, candidate.from, graph)) {
        return { valid: false, message: "That would create a loop in the family tree." };
      }
      var reverseParent = activeRelationships(relationships).some(function reverse(existing) {
        return isParentType(existing.type) && existing.from === candidate.to && existing.to === candidate.from;
      });
      if (reverseParent) {
        return { valid: false, message: "Two people cannot be each other's parent and child." };
      }
    }
    return { valid: true, message: "" };
  }

  return {
    createGraph: createGraph,
    describeRelationship: describeRelationship,
    findAncestors: findAncestors,
    shortestPath: shortestPath,
    closestCommonAncestors: closestCommonAncestors,
    layoutFamilyTree: layoutFamilyTree,
    validateRelationshipAddition: validateRelationshipAddition
  };
});
