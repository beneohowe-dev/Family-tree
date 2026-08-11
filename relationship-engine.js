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
    "sibling"
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
    var explicitSiblings = new Map();
    var adjacency = new Map();

    people.forEach(function indexPerson(person) {
      byId.set(person.id, person);
      parentsByChild.set(person.id, []);
      childrenByParent.set(person.id, []);
      partnersByPerson.set(person.id, []);
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
    });

    return {
      byId: byId,
      parentsByChild: parentsByChild,
      childrenByParent: childrenByParent,
      partnersByPerson: partnersByPerson,
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

  return {
    createGraph: createGraph,
    describeRelationship: describeRelationship,
    findAncestors: findAncestors,
    shortestPath: shortestPath,
    closestCommonAncestors: closestCommonAncestors
  };
});
