(function bootFamilyNetwork() {
  "use strict";

  var CURRENT_USER_ID = "you";
  var CURRENT_USER_NAME = "You";
  var STORAGE_KEY = "private-family-network-prototype-v10";

  var people = [
    {
      id: "parent-1",
      name: "Parent",
      firstName: "Parent",
      middleNames: "",
      lastName: "",
      birthYear: null,
      deathYear: null,
      gender: "male",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 520,
      y: 230,
      placeholder: true,
      roleHint: "Your parent",
      partnerPrompt: "Add husband, wife or partner"
    },
    {
      id: "parent-2",
      name: "Parent",
      firstName: "Parent",
      middleNames: "",
      lastName: "",
      birthYear: null,
      deathYear: null,
      gender: "female",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 720,
      y: 230,
      placeholder: true,
      roleHint: "Your parent",
      partnerPrompt: "Add husband, wife or partner"
    },
    {
      id: "you",
      name: "You",
      firstName: "You",
      middleNames: "",
      lastName: "",
      birthYear: null,
      deathYear: null,
      gender: "unknown",
      claimedBy: "you",
      x: 550,
      y: 530,
      placeholder: true,
      roleHint: "This is you",
      partnerPrompt: "Add husband, wife or partner"
    },
    {
      id: "sibling",
      name: "Sibling",
      firstName: "Sibling",
      middleNames: "",
      lastName: "",
      birthYear: null,
      deathYear: null,
      gender: "unknown",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 750,
      y: 530,
      placeholder: true,
      roleHint: "Your sibling",
      partnerPrompt: "Add husband, wife or partner"
    }
  ];

  var relationships = [
    partner("parent-1", "parent-2", "partner"),
    parent("parent-1", "you", "biological_parent"),
    parent("parent-2", "you", "biological_parent"),
    parent("parent-1", "sibling", "biological_parent"),
    parent("parent-2", "sibling", "biological_parent")
  ];

  var profileFields = [
    field("you", "Next step", "About", "Add your name, then add or rename your parents and siblings.", "family", "you")
  ];

  var suggestions = [];

  var accessRequests = [
    {
      id: "access-1",
      name: "A family member",
      email: "relative@example.com",
      message: "I can help fill in older relatives.",
      status: "pending",
      createdAt: "Yesterday 18:04"
    }
  ];

  var invitations = [];
  var deletionRecords = [];
  var claimRequests = [];
  var activity = [
    activityItem("you", "started a private family tree", "Today 09:00")
  ];

  var state = {
    selectedPersonId: CURRENT_USER_ID,
    relationshipA: "sibling",
    relationshipB: CURRENT_USER_ID,
    zoom: 0.92,
    panX: 0,
    panY: 0,
    collapsedBranches: false,
    highlightPath: [],
    highlightPeople: new Set(),
    pendingSuggestFieldId: null,
    theme: "gallery",
    accent: "#70717c"
  };

  var lastUndo = null;
  var toastTimer = null;
  var TREE_NODE_HALF = 92;

  var els = {
    approvedApp: document.getElementById("approvedApp"),
    privateGate: document.getElementById("privateGate"),
    mapShell: document.getElementById("mapShell"),
    mapViewport: document.getElementById("mapViewport"),
    relationshipLines: document.getElementById("relationshipLines"),
    nodeLayer: document.getElementById("nodeLayer"),
    profilePanel: document.getElementById("profilePanel"),
    globalSearch: document.getElementById("globalSearch"),
    searchResults: document.getElementById("searchResults"),
    zoomLevel: document.getElementById("zoomLevel"),
    connectionsPanel: document.getElementById("connectionsPanel"),
    personASelect: document.getElementById("personASelect"),
    personBSelect: document.getElementById("personBSelect"),
    relationshipResult: document.getElementById("relationshipResult"),
    exploreContent: document.getElementById("exploreContent"),
    activityList: document.getElementById("activityList"),
    removedList: document.getElementById("removedList"),
    addInfoDialog: document.getElementById("addInfoDialog"),
    addInfoForm: document.getElementById("addInfoForm"),
    promptGrid: document.getElementById("promptGrid"),
    suggestDialog: document.getElementById("suggestDialog"),
    suggestForm: document.getElementById("suggestForm"),
    suggestCurrent: document.getElementById("suggestCurrent"),
    relativeDialog: document.getElementById("relativeDialog"),
    relativeForm: document.getElementById("relativeForm"),
    duplicateResults: document.getElementById("duplicateResults"),
    accessDialog: document.getElementById("accessDialog"),
    accessRequests: document.getElementById("accessRequests"),
    inviteForm: document.getElementById("inviteForm"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),
    tooltipBubble: document.getElementById("tooltipBubble"),
    undoButton: document.getElementById("undoButton"),
    themeSelect: document.getElementById("themeSelect"),
    demoCoach: document.getElementById("demoCoach"),
    demoStepCount: document.getElementById("demoStepCount"),
    demoTitle: document.getElementById("demoTitle"),
    demoText: document.getElementById("demoText"),
    demoNextButton: document.getElementById("demoNextButton"),
    demoEndButton: document.getElementById("demoEndButton")
  };

  var promptCategories = [
    ["Photo", "Memory photo"],
    ["Life event", "Life event"],
    ["Work", "Occupation"],
    ["Education", "Education"],
    ["Place", "Places lived"],
    ["Interest", "Interest"],
    ["Instrument", "Instrument"],
    ["Sport", "Sport"],
    ["Story", "Story"],
    ["Achievement", "Achievement"],
    ["Other", "Detail"]
  ];

  var demoIndex = -1;
  var demoSteps = [
    {
      selector: "#youButton",
      title: "Start with You",
      text: "This is the safe starting point. Add your own name first, then work up to parents.",
      prepare: function prepareYou() {
        closeFloatingSurfaces();
        state.selectedPersonId = CURRENT_USER_ID;
        state.collapsedBranches = false;
        highlightImmediateFamily(CURRENT_USER_ID);
        centerOnPerson(CURRENT_USER_ID);
        renderProfile();
      }
    },
    {
      selector: "#globalSearch",
      title: "Find anyone quickly",
      text: "Search stays simple. It only looks at people and details this family member is allowed to see.",
      prepare: function prepareSearch() {
        closeFloatingSurfaces();
        els.globalSearch.value = "";
      }
    },
    {
      selector: "#profilePanel",
      title: "Fill in one person",
      text: "Tap any blank portrait. The side panel tells you what to add without showing a giant form.",
      prepare: function prepareProfile() {
        selectPerson(CURRENT_USER_ID, true);
      }
    },
    {
      selector: "[data-open-add-info]",
      title: "Add one small thing",
      text: "A name, date, place, photo or story is enough. Nobody has to complete a profile.",
      prepare: function prepareAdd() {
        selectPerson(CURRENT_USER_ID, true);
      }
    },
    {
      selector: "#connectionsButton",
      title: "Check the family line",
      text: "This shows how two people connect, using the same parent and partner lines shown in the tree.",
      prepare: function prepareConnections() {
        els.connectionsPanel.classList.remove("connections-panel-collapsed");
        state.relationshipA = "sibling";
        state.relationshipB = CURRENT_USER_ID;
        state.collapsedBranches = false;
        renderAll();
      }
    },
    {
      selector: "#privateLandingButton",
      title: "Why Locked view exists",
      text: "This shows the locked page seen before approval. It proves the family tree is private by default.",
      prepare: function preparePrivateView() {
        closeFloatingSurfaces();
        els.privateGate.hidden = true;
        els.approvedApp.hidden = false;
      }
    }
  ];

  function parent(from, to, type) {
    return relationship(from, to, type);
  }

  function partner(from, to, type) {
    return relationship(from, to, type);
  }

  function relationship(from, to, type) {
    var item = {
      id: "rel-" + from + "-" + to + "-" + type,
      from: from,
      to: to,
      type: type,
      status: "active",
      createdBy: "seed",
      createdAt: "Seed",
      versions: []
    };
    item.versions.push({
      at: "Seed",
      actorId: "seed",
      previous: null,
      next: { from: from, to: to, type: type, status: "active" }
    });
    return item;
  }

  function field(personId, label, category, value, visibility, ownerId, sensitive) {
    return {
      id: "field-" + personId + "-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      personId: personId,
      label: label,
      category: category,
      value: value,
      visibility: visibility,
      ownerId: ownerId,
      addedBy: ownerId,
      createdAt: "Seed",
      updatedBy: ownerId,
      updatedAt: "Seed",
      sensitive: Boolean(sensitive),
      deletedAt: null,
      revisions: [
        {
          at: "Seed",
          actorId: ownerId,
          previous: null,
          next: value
        }
      ]
    };
  }

  function findFieldId(personId, label) {
    var found = profileFields.find(function findMatch(item) {
      return item.personId === personId && item.label === label;
    });
    return found ? found.id : null;
  }

  function activityItem(actorId, action, createdAt) {
    return {
      id: "activity-" + Math.random().toString(16).slice(2),
      actorId: actorId,
      action: action,
      createdAt: createdAt || readableNow()
    };
  }

  function readableNow() {
    return "Today " + new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
  }

  function byId(id) {
    return people.find(function findPerson(person) {
      return person.id === id;
    });
  }

  function visiblePeople() {
    return people.filter(function isVisible(person) {
      if (person.status === "deleted") return false;
      if (!state.collapsedBranches) return true;
      if (state.highlightPeople.has(person.id)) return true;
      var collapsedIds = new Set(["peter", "nina", "sarah", "ravi", "mia", "maya"]);
      return !collapsedIds.has(person.id);
    });
  }

  function activeRelationships() {
    return relationships.filter(function keep(relationship) {
      return relationship.status !== "deleted";
    });
  }

  function graph() {
    return window.RelationshipEngine.createGraph(people, activeRelationships());
  }

  function isLiving(person) {
    return person && !person.deathYear;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function photoPosition(person) {
    if (!person || person.placeholder) return "";
    var index = person.photo || 0;
    var column = index % 4;
    var row = Math.floor(index / 4);
    return column * 33.333 + "% " + row * 33.333 + "%";
  }

  function portraitMarkup(person, sizeClass) {
    var classes = ["portrait"];
    if (sizeClass) classes.push(sizeClass);
    if (person.placeholder || person.photo == null) {
      classes.push("ghost");
      return "<span class=\"" + classes.join(" ") + "\" aria-hidden=\"true\"></span>";
    }
    return "<span class=\"" + classes.join(" ") + "\" aria-hidden=\"true\" style=\"background-position:" + photoPosition(person) + "\"></span>";
  }

  function years(person) {
    if (!person.birthYear && !person.deathYear) return "";
    if (person.birthYear && person.deathYear) return person.birthYear + "-" + person.deathYear;
    if (person.birthYear) return "b. " + person.birthYear;
    return "d. " + person.deathYear;
  }

  function primaryName(person) {
    if (!person) return "Unknown person";
    var first = String(person.firstName || "").trim();
    var last = String(person.lastName || "").trim();
    var primary = [first, last].filter(Boolean).join(" ").trim();
    return primary || person.name || "Unknown person";
  }

  function fullName(person) {
    if (!person) return "Unknown person";
    var first = String(person.firstName || "").trim();
    var middle = String(person.middleNames || "").trim();
    var last = String(person.lastName || "").trim();
    var full = [first, middle, last].filter(Boolean).join(" ").trim();
    return full || primaryName(person);
  }

  function seedNameParts(person) {
    if (!person || person.firstName || person.lastName || person.middleNames || !person.name) return;
    var parts = person.name.split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    person.firstName = parts[0] || "";
    person.lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    person.middleNames = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  }

  function personName(id) {
    var person = byId(id);
    return person ? primaryName(person) : "Unknown person";
  }

  function possessive(name) {
    return name.endsWith("s") ? name + "'" : name + "'s";
  }

  function snapshot() {
    return JSON.parse(JSON.stringify({
      people: people,
      relationships: relationships,
      profileFields: profileFields,
      suggestions: suggestions,
      accessRequests: accessRequests,
      invitations: invitations,
      deletionRecords: deletionRecords,
      claimRequests: claimRequests,
      activity: activity,
      selectedPersonId: state.selectedPersonId
    }));
  }

  function restore(data) {
    people = data.people;
    relationships = data.relationships;
    profileFields = data.profileFields;
    suggestions = data.suggestions;
    accessRequests = data.accessRequests;
    invitations = data.invitations;
    deletionRecords = data.deletionRecords;
    claimRequests = data.claimRequests;
    activity = data.activity;
    state.selectedPersonId = data.selectedPersonId || CURRENT_USER_ID;
    state.highlightPath = [];
    state.highlightPeople = new Set();
    persist();
    renderAll();
  }

  function withUndo(message, mutate) {
    lastUndo = snapshot();
    mutate();
    persist();
    renderAll();
    showToast(message || "Saved");
  }

  function showToast(message) {
    els.toastMessage.textContent = message + " · Undo";
    els.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function hideLater() {
      els.toast.hidden = true;
    }, 5200);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        people: people,
        relationships: relationships,
        profileFields: profileFields,
        suggestions: suggestions,
        accessRequests: accessRequests,
        invitations: invitations,
        deletionRecords: deletionRecords,
        claimRequests: claimRequests,
        activity: activity,
        state: {
          selectedPersonId: state.selectedPersonId,
          theme: state.theme,
          accent: state.accent
        }
      }));
    } catch (error) {
      console.warn("Unable to save local prototype state.", error);
    }
  }

  function loadSavedState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1) return;
      people = saved.people || people;
      relationships = saved.relationships || relationships;
      profileFields = saved.profileFields || profileFields;
      suggestions = saved.suggestions || suggestions;
      accessRequests = saved.accessRequests || accessRequests;
      invitations = saved.invitations || invitations;
      deletionRecords = saved.deletionRecords || deletionRecords;
      claimRequests = saved.claimRequests || claimRequests;
      activity = saved.activity || activity;
      if (saved.state) {
        state.selectedPersonId = saved.state.selectedPersonId || state.selectedPersonId;
        state.theme = saved.state.theme || state.theme;
        state.accent = saved.state.accent || state.accent;
      }
    } catch (error) {
      console.warn("Unable to load local prototype state.", error);
    }
  }

  function addActivity(actorId, action) {
    activity.unshift(activityItem(actorId, action, readableNow()));
    activity = activity.slice(0, 18);
  }

  function applyTheme() {
    document.body.dataset.theme = state.theme;
    document.documentElement.style.setProperty("--accent", state.accent);
    els.themeSelect.value = state.theme;
  }

  function renderAll() {
    applyTheme();
    renderSelectors();
    renderMap();
    renderProfile();
    renderRelationshipExplorer();
    renderExplore();
    renderHistory();
    renderAccessRequests();
    applyNativeTooltips(document);
  }

  function renderSelectors() {
    var active = people.filter(function keep(person) {
      return person.status !== "deleted";
    });
    var options = active
      .map(function option(person) {
        return "<option value=\"" + escapeHTML(person.id) + "\">" + escapeHTML(primaryName(person)) + "</option>";
      })
      .join("");
    els.personASelect.innerHTML = options;
    els.personBSelect.innerHTML = options;
    els.personASelect.value = state.relationshipA;
    els.personBSelect.value = state.relationshipB;
  }

  function renderMap() {
    var peopleToRender = visiblePeople();
    var visibleIds = new Set(peopleToRender.map(function toId(person) { return person.id; }));
    var pathPairs = pathPairSet(state.highlightPath);

    els.mapShell.classList.toggle("is-overview", state.zoom < 0.52);
    els.zoomLevel.value = Math.round(state.zoom * 100) + "%";
    els.mapViewport.style.transform = "translate(" + state.panX + "px, " + state.panY + "px) scale(" + state.zoom + ")";

    renderTreeLines(visibleIds, pathPairs);

    els.nodeLayer.innerHTML = peopleToRender.map(function node(person) {
      var classes = ["person-node", genderClass(person)];
      if (person.id === state.selectedPersonId) classes.push("selected");
      if (person.id === CURRENT_USER_ID) classes.push("you");
      if (state.highlightPeople.size && !state.highlightPeople.has(person.id)) classes.push("muted");
      if (state.highlightPeople.has(person.id)) classes.push("highlight");
      return [
        "<button type=\"button\" class=\"" + classes.join(" ") + "\"",
        " data-person-id=\"" + escapeHTML(person.id) + "\"",
        " aria-label=\"Open " + escapeHTML(primaryName(person)) + "\"",
        " style=\"left:" + person.x + "px;top:" + person.y + "px\">",
        portraitMarkup(person),
        "<span class=\"node-name\">" + escapeHTML(primaryName(person)) + "</span>",
        "<span class=\"node-years\">" + escapeHTML(person.roleHint || years(person) || "Tap to fill in") + "</span>",
        person.partnerPrompt ? "<span class=\"node-suggestion\">" + escapeHTML(person.partnerPrompt) + "</span>" : "",
        person.id === CURRENT_USER_ID ? "<span class=\"node-tag\">You</span>" : "",
        "</button>"
      ].join("");
    }).join("");

  }

  function renderTreeLines(visibleIds, pathPairs) {
    els.relationshipLines.innerHTML = "";
    var partnerRelationships = activeRelationships().filter(function isPartner(relationshipItem) {
      return relationshipItem.type.indexOf("partner") !== -1 || relationshipItem.type.indexOf("spouse") !== -1;
    });
    var parentRelationships = activeRelationships().filter(function isParent(relationshipItem) {
      return relationshipItem.type.indexOf("parent") !== -1 || relationshipItem.type === "guardian";
    });

    partnerRelationships.forEach(function drawPartner(relationshipItem) {
      if (!visibleIds.has(relationshipItem.from) || !visibleIds.has(relationshipItem.to)) return;
      var from = byId(relationshipItem.from);
      var to = byId(relationshipItem.to);
      if (!from || !to) return;
      var fromX = from.x < to.x ? from.x + TREE_NODE_HALF : from.x - TREE_NODE_HALF;
      var toX = from.x < to.x ? to.x - TREE_NODE_HALF : to.x + TREE_NODE_HALF;
      drawPath("M" + fromX + " " + from.y + " H" + toX, relationshipItem, pathPairs, true);
    });

    parentRelationships.forEach(function drawParent(relationshipItem) {
      if (!visibleIds.has(relationshipItem.from) || !visibleIds.has(relationshipItem.to)) return;
      var from = byId(relationshipItem.from);
      var to = byId(relationshipItem.to);
      if (!from || !to) return;
      var midY = Math.round((from.y + to.y) / 2);
      drawPath(
        "M" + from.x + " " + (from.y + TREE_NODE_HALF) + " V" + midY + " H" + to.x + " V" + (to.y - TREE_NODE_HALF),
        relationshipItem,
        pathPairs,
        false
      );
    });
  }

  function drawPath(d, relationshipItem, pathPairs, isPartner) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    var className = "relationship-line";
    if (isPartner) className += " partner";
    var highlighted = pathPairs.has(pairKey(relationshipItem.from, relationshipItem.to)) ||
      (!state.highlightPath.length && state.highlightPeople.has(relationshipItem.from) && state.highlightPeople.has(relationshipItem.to));
    if (state.highlightPeople.size && !highlighted) className += " muted";
    if (highlighted) className += " highlight";
    path.setAttribute("class", className);
    els.relationshipLines.appendChild(path);
  }

  function pairKey(a, b) {
    return [a, b].sort().join(":");
  }

  function pathPairSet(path) {
    var pairs = new Set();
    for (var index = 0; index < path.length - 1; index += 1) {
      pairs.add(pairKey(path[index], path[index + 1]));
    }
    return pairs;
  }

  function canViewField(fieldItem) {
    if (!fieldItem || fieldItem.deletedAt) return false;
    if (fieldItem.visibility === "only_me") return fieldItem.ownerId === CURRENT_USER_ID;
    if (fieldItem.visibility === "connections") {
      return fieldItem.personId === CURRENT_USER_ID || isCloseConnection(fieldItem.personId);
    }
    return true;
  }

  function canSearchField(fieldItem) {
    return canViewField(fieldItem) && !fieldItem.sensitive && fieldItem.visibility !== "only_me";
  }

  function isCloseConnection(personId) {
    var path = window.RelationshipEngine.shortestPath(CURRENT_USER_ID, personId, graph());
    return path.length > 0 && path.length <= 5;
  }

  function renderProfile() {
    var person = byId(state.selectedPersonId) || byId(CURRENT_USER_ID);
    state.selectedPersonId = person.id;
    els.profilePanel.classList.remove("gender-male", "gender-female", "gender-neutral");
    els.profilePanel.classList.add(genderClass(person));
    var relation = person.id === CURRENT_USER_ID
      ? { sentence: "This is you.", label: "You" }
      : window.RelationshipEngine.describeRelationship(person.id, CURRENT_USER_ID, people, activeRelationships());
    var pendingForOwner = suggestions.filter(function pending(item) {
      return item.status === "pending" && item.personId === person.id && person.claimedBy === CURRENT_USER_ID;
    });

    els.profilePanel.innerHTML = [
      "<div class=\"profile-hero " + genderClass(person) + (person.placeholder || person.photo == null ? " missing" : "") + "\">",
      person.placeholder || person.photo == null
        ? "<div class=\"profile-photo ghost-profile\" aria-hidden=\"true\"></div>"
        : "<div class=\"profile-photo\" style=\"background-position:" + photoPosition(person) + "\"></div>",
      "<div class=\"profile-title\">",
      "<p>" + escapeHTML(person.roleHint || years(person) || relation.label) + "</p>",
      "<h2>" + escapeHTML(primaryName(person)) + "</h2>",
      "<p>" + escapeHTML(relation.sentence) + "</p>",
      "</div>",
      "</div>",
      "<div class=\"profile-body\">",
      profileNotice(person),
      ownerSuggestions(pendingForOwner),
      "<div class=\"profile-actions\">",
      "<button class=\"button primary\" type=\"button\" data-open-add-info data-tooltip=\"Start with one easy detail: name, photo, place or story.\">Fill in details</button>",
      "<button class=\"button\" type=\"button\" data-open-relative data-tooltip=\"Add a parent, sibling, child, husband, wife or partner.\">Add relative</button>",
      "<button class=\"button\" type=\"button\" data-open-relative data-default-connection=\"partner\" data-tooltip=\"Add this person's husband, wife or partner.\">Add partner</button>",
      person.claimedBy ? "" : "<button class=\"button\" type=\"button\" data-claim-profile data-tooltip=\"Request to link your account to this existing person record.\">This is me</button>",
      person.id !== CURRENT_USER_ID ? "<button class=\"button\" type=\"button\" data-soft-delete data-tooltip=\"Soft remove this profile so an admin can restore it later.\">Remove profile</button>" : "",
      "</div>",
      namesSection(person),
      familySection(person),
      fieldsSection(person),
      memoriesSection(person),
      "</div>"
    ].join("");
  }

  function profileNotice(person) {
    if (person.id === CURRENT_USER_ID) {
      return "<div class=\"claim-box\"><strong>Your starting point</strong><span>Fill in your own name first, then work upward to parents and older relatives.</span></div>";
    }
    if (person.claimedBy) {
      return "<div class=\"claim-box\"><strong>Claimed profile</strong><span>This person controls their own details.</span></div>";
    }
    var steward = person.stewardId ? personName(person.stewardId) : "an admin";
    return "<div class=\"claim-box\"><strong>Blank person</strong><span>Add what you know now. " + escapeHTML(steward) + " can look after it until this person joins.</span></div>";
  }

  function ownerSuggestions(items) {
    if (!items.length) return "";
    return items.map(function renderSuggestion(item) {
      var actor = personName(item.actorId);
      var current = item.targetFieldId ? profileFields.find(function find(target) {
        return target.id === item.targetFieldId;
      }) : null;
      return [
        "<div class=\"suggestion-box\">",
        "<strong>" + escapeHTML(actor) + " suggested a change</strong>",
        current ? "<p class=\"muted\">Current: " + escapeHTML(current.value) + "</p>" : "",
        "<p>Suggested: " + escapeHTML(item.proposedValue) + "</p>",
        item.message ? "<p class=\"muted\">" + escapeHTML(item.message) + "</p>" : "",
        "<div class=\"card-actions\">",
        "<button class=\"button compact primary\" type=\"button\" data-accept-suggestion=\"" + escapeHTML(item.id) + "\">Accept</button>",
        "<button class=\"button compact\" type=\"button\" data-edit-accept-suggestion=\"" + escapeHTML(item.id) + "\">Edit &amp; accept</button>",
        "<button class=\"button compact\" type=\"button\" data-dismiss-suggestion=\"" + escapeHTML(item.id) + "\">Dismiss</button>",
        "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function namesSection(person) {
    var middle = String(person.middleNames || "").trim();
    var full = fullName(person);
    if (!middle && full === primaryName(person)) return "";
    return [
      "<section class=\"section-block names-section\">",
      "<h3>Names</h3>",
      "<div class=\"field-list\">",
      middle ? [
        "<article class=\"field-row name-field-row\">",
        "<div>",
        "<strong>Middle names</strong>",
        "<p>" + escapeHTML(middle) + "</p>",
        "</div>",
        "</article>"
      ].join("") : "",
      full !== primaryName(person) ? [
        "<article class=\"field-row name-field-row\">",
        "<div>",
        "<strong>Full name</strong>",
        "<p>" + escapeHTML(full) + "</p>",
        "</div>",
        "</article>"
      ].join("") : "",
      "</div>",
      "</section>"
    ].join("");
  }

  function fieldsSection(person) {
    var grouped = {};
    profileFields.filter(function keep(fieldItem) {
      return fieldItem.personId === person.id && canViewField(fieldItem);
    }).forEach(function group(fieldItem) {
      if (!grouped[fieldItem.category]) grouped[fieldItem.category] = [];
      grouped[fieldItem.category].push(fieldItem);
    });

    var order = ["About", "Family", "Life", "Interests", "Memories", "Additional"];
    var sections = order.concat(Object.keys(grouped).filter(function extra(category) {
      return order.indexOf(category) === -1;
    })).filter(function has(category, index, list) {
      return list.indexOf(category) === index && grouped[category] && grouped[category].length;
    });

    if (!sections.length) {
      return "<section class=\"section-block\"><h3>About</h3><p class=\"muted\">No shared details yet.</p></section>";
    }

    return sections.map(function section(category) {
      return [
        "<section class=\"section-block\">",
        "<h3>" + escapeHTML(category) + "</h3>",
        "<div class=\"field-list\">",
        grouped[category].map(function renderField(fieldItem) {
          var ownerCanEdit = fieldItem.ownerId === CURRENT_USER_ID;
          var visibility = fieldItem.visibility.replace("_", " ");
          return [
            "<article class=\"field-row\">",
            "<div>",
            "<strong>" + escapeHTML(fieldItem.label) + "</strong>",
            "<p>" + escapeHTML(fieldItem.value) + "</p>",
            "<small>Added by " + escapeHTML(personName(fieldItem.addedBy)) + " · " + escapeHTML(visibility) + "</small>",
            "</div>",
            "<div class=\"field-actions\">",
            ownerCanEdit
              ? "<button class=\"button compact\" type=\"button\" data-edit-field=\"" + escapeHTML(fieldItem.id) + "\">Edit</button>"
              : "<button class=\"button compact\" type=\"button\" data-suggest-field=\"" + escapeHTML(fieldItem.id) + "\">Suggest</button>",
            ownerCanEdit ? "<button class=\"button compact\" type=\"button\" data-remove-field=\"" + escapeHTML(fieldItem.id) + "\">Remove</button>" : "",
            "</div>",
            "</article>"
          ].join("");
        }).join(""),
        "</div>",
        "</section>"
      ].join("");
    }).join("");
  }

  function familySection(person) {
    var currentGraph = graph();
    var parents = (currentGraph.parentsByChild.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean);
    var partners = (currentGraph.partnersByPerson.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean);
    var children = (currentGraph.childrenByParent.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean);
    var siblings = people.filter(function findSibling(candidate) {
      return candidate.id !== person.id && candidate.status !== "deleted" && siblingInfo(person.id, candidate.id, currentGraph);
    });
    var groups = [
      ["Parents", parents],
      ["Partners", partners],
      ["Children", children],
      ["Siblings", siblings]
    ].filter(function hasMembers(group) {
      return group[1].length;
    });

    if (!groups.length) return "";

    return groups.map(function renderGroup(group) {
      return [
        "<section class=\"section-block\">",
        "<h3>" + escapeHTML(group[0]) + "</h3>",
        "<div class=\"family-list\">",
        group[1].map(miniPerson).join(""),
        "</div>",
        "</section>"
      ].join("");
    }).join("");
  }

  function siblingInfo(personAId, personBId, currentGraph) {
    var aParents = currentGraph.parentsByChild.get(personAId) || [];
    var bParents = currentGraph.parentsByChild.get(personBId) || [];
    var bParentIds = new Set(bParents.map(function toId(parentRef) { return parentRef.id; }));
    var shared = aParents.filter(function findShared(parentRef) {
      return bParentIds.has(parentRef.id);
    });
    return shared.length > 0;
  }

  function miniPerson(person) {
    return [
      "<button type=\"button\" class=\"mini-person\" data-person-id=\"" + escapeHTML(person.id) + "\">",
      portraitMarkup(person, "small"),
      "<span>" + escapeHTML(primaryName(person)) + "</span>",
      "</button>"
    ].join("");
  }

  function memoriesSection(person) {
    if (person.placeholder || person.photo == null) {
      return [
        "<section class=\"section-block\">",
        "<h3>Photo</h3>",
        "<div class=\"notice-box\"><strong>No photo yet</strong><span>This person stays as a soft blank portrait until someone adds a real family photograph.</span></div>",
        "</section>"
      ].join("");
    }
    var captions = [
      "Summer album",
      "Tagged family photo",
      "Shared memory"
    ];
    var items = captions.slice(0, person.id === CURRENT_USER_ID ? 3 : 2).map(function render(caption, index) {
      return [
        "<article class=\"memory-card\">",
        "<img src=\"assets/family-gallery.png\" alt=\"" + escapeHTML(caption + " for " + primaryName(person)) + "\">",
        "<p>" + escapeHTML(caption) + "</p>",
        "</article>"
      ].join("");
    });
    return [
      "<section class=\"section-block\">",
      "<h3>Memories</h3>",
      "<div class=\"memory-grid\">",
      items.join(""),
      "</div>",
      "</section>"
    ].join("");
  }

  function renderRelationshipExplorer() {
    var result = window.RelationshipEngine.describeRelationship(
      state.relationshipA,
      state.relationshipB,
      people,
      activeRelationships()
    );
    var path = result.path || [];
    state.highlightPath = path;
    state.highlightPeople = new Set(path);
    els.relationshipResult.innerHTML = [
      "<strong>" + escapeHTML(result.sentence) + "</strong>",
      "<p class=\"muted\">" + escapeHTML(result.explanation) + "</p>",
      path.length ? "<div class=\"path-list\">" + path.map(function renderPath(id) {
        return "<span>" + escapeHTML(personName(id)) + "</span>";
      }).join("") + "</div>" : "",
      result.confidence === "ambiguous" || result.confidence === "multiple-common-ancestors"
        ? "<p class=\"muted\">Multiple or ambiguous paths may exist.</p>"
        : ""
    ].join("");
  }

  function renderExplore() {
    els.exploreContent.innerHTML = [
      "<div class=\"start-steps\">",
      "<div><strong>1</strong><span>Tap You and add your real name.</span></div>",
      "<div><strong>2</strong><span>Tap each Parent and fill in what you know.</span></div>",
      "<div><strong>3</strong><span>Add husband, wife, partner, siblings or older relatives one at a time.</span></div>",
      "</div>",
      "<div class=\"notice-box\"><strong>Built for family memory</strong><span>Older relatives can add names, dates, stories and photos without needing to understand a database.</span></div>"
    ].join("");
  }

  function aggregateProfileFields() {
    var allowedLabels = new Set([
      "Places lived",
      "Occupation",
      "Instrument",
      "Football team",
      "Education",
      "Languages",
      "Sport"
    ]);
    var counts = new Map();
    profileFields.forEach(function count(fieldItem) {
      if (!allowedLabels.has(fieldItem.label)) return;
      if (!canSearchField(fieldItem)) return;
      fieldItem.value.split(/,| and /).map(function trim(value) {
        return value.trim();
      }).filter(Boolean).forEach(function add(value) {
        var key = value.toLowerCase();
        var existing = counts.get(key) || { value: value, count: 0 };
        existing.count += 1;
        counts.set(key, existing);
      });
    });
    return Array.from(counts.values())
      .filter(function applyMinimumGroupSize(item) {
        return item.count >= 2;
      })
      .sort(function byCount(a, b) {
        return b.count - a.count || a.value.localeCompare(b.value);
      });
  }

  function renderHistory() {
    els.activityList.innerHTML = [
      "<li><strong>Nothing gets lost</strong><span>Edits can be undone and removed people can be restored.</span><time>Built in from the start</time></li>",
      "<li><strong>Private by default</strong><span>Only approved family members can see the tree.</span><time>Before anyone joins</time></li>"
    ].join("");

    els.removedList.innerHTML = deletionRecords.filter(function pending(record) {
      return !record.restoredAt;
    }).map(function renderRemoved(record) {
      return [
        "<article class=\"removed-card\">",
        "<strong>" + escapeHTML(record.entityName) + "</strong>",
        "<small>Removed by " + escapeHTML(personName(record.actorId)) + " · " + escapeHTML(record.deletedAt) + "</small>",
        "<button class=\"button compact\" type=\"button\" data-restore=\"" + escapeHTML(record.id) + "\">Restore</button>",
        "</article>"
      ].join("");
    }).join("") || "<p class=\"muted\">Nothing has been removed.</p>";
  }

  function renderAccessRequests() {
    var pending = accessRequests.filter(function keep(request) {
      return request.status === "pending";
    });
    var pendingClaims = claimRequests.filter(function keep(claim) {
      return claim.status === "pending";
    });
    els.accessRequests.innerHTML = [
      pending.map(function renderRequest(request) {
        return [
          "<article class=\"request-card\">",
          "<strong>" + escapeHTML(request.name) + "</strong>",
          "<p class=\"muted\">" + escapeHTML(request.message || "No message") + "</p>",
          "<small>" + escapeHTML(request.email) + " · " + escapeHTML(request.createdAt) + "</small>",
          "<div class=\"card-actions\">",
          "<button class=\"button compact primary\" type=\"button\" data-approve-access=\"" + escapeHTML(request.id) + "\">Approve</button>",
          "<button class=\"button compact\" type=\"button\" data-decline-access=\"" + escapeHTML(request.id) + "\">Decline</button>",
          "</div>",
          "</article>"
        ].join("");
      }).join(""),
      pendingClaims.map(function renderClaim(claim) {
        return [
          "<article class=\"request-card\">",
          "<strong>Profile claim</strong>",
          "<p class=\"muted\">" + escapeHTML(personName(claim.personId)) + " requested by " + escapeHTML(claim.name) + ".</p>",
          "<small>" + escapeHTML(claim.createdAt) + "</small>",
          "<div class=\"card-actions\">",
          "<button class=\"button compact primary\" type=\"button\" data-approve-claim=\"" + escapeHTML(claim.id) + "\">Approve</button>",
          "<button class=\"button compact\" type=\"button\" data-decline-claim=\"" + escapeHTML(claim.id) + "\">Decline</button>",
          "</div>",
          "</article>"
        ].join("");
      }).join("")
    ].join("") || "<p class=\"muted\">No pending requests.</p>";
  }

  function performSearch(query) {
    var value = query.trim().toLowerCase();
    if (!value) {
      els.searchResults.hidden = true;
      els.searchResults.innerHTML = "";
      return;
    }

    var results = people.filter(function match(person) {
      if (person.status === "deleted") return false;
      if (fullName(person).toLowerCase().includes(value) || primaryName(person).toLowerCase().includes(value)) return true;
      return profileFields.some(function matchField(fieldItem) {
        return fieldItem.personId === person.id &&
          canSearchField(fieldItem) &&
          fieldItem.value.toLowerCase().includes(value);
      });
    }).slice(0, 8);

    els.searchResults.hidden = false;
    els.searchResults.innerHTML = results.length ? results.map(function result(person) {
      var context = searchableContext(person, value);
      return [
        "<button class=\"search-result\" type=\"button\" data-person-id=\"" + escapeHTML(person.id) + "\">",
        portraitMarkup(person, "small"),
        "<span><strong>" + escapeHTML(primaryName(person)) + "</strong><span>" + escapeHTML(context) + "</span></span>",
        "</button>"
      ].join("");
    }).join("") : "<p class=\"muted\">No visible matches.</p>";
  }

  function searchableContext(person, query) {
    var match = profileFields.find(function findMatch(fieldItem) {
      return fieldItem.personId === person.id &&
        canSearchField(fieldItem) &&
        fieldItem.value.toLowerCase().includes(query);
    });
    if (match) return match.label + ": " + match.value;
    if (String(person.middleNames || "").trim()) return "Middle names: " + person.middleNames;
    return years(person) || "Family member";
  }

  function centerOnPerson(personId) {
    var person = byId(personId);
    if (!person) return;
    var rect = els.mapShell.getBoundingClientRect();
    state.panX = rect.width / 2 - person.x * state.zoom;
    state.panY = rect.height / 2 - person.y * state.zoom;
    renderMap();
  }

  function fitFamilyOverview() {
    var active = visiblePeople();
    if (!active.length) return;
    var rect = els.mapShell.getBoundingClientRect();
    var leftReserve = rect.width < 740 ? 96 : 154;
    var rightReserve = rect.width < 740 ? 22 : 42;
    var topReserve = 58;
    var bottomReserve = 58;
    var nodePadX = rect.width < 740 ? 106 : 124;
    var nodePadY = rect.width < 740 ? 90 : 98;
    var minX = Math.min.apply(null, active.map(function min(person) { return person.x - nodePadX; }));
    var maxX = Math.max.apply(null, active.map(function max(person) { return person.x + nodePadX; }));
    var minY = Math.min.apply(null, active.map(function min(person) { return person.y - nodePadY; }));
    var maxY = Math.max.apply(null, active.map(function max(person) { return person.y + nodePadY; }));
    var worldWidth = Math.max(1, maxX - minX);
    var worldHeight = Math.max(1, maxY - minY);
    var availableWidth = Math.max(240, rect.width - leftReserve - rightReserve);
    var availableHeight = Math.max(260, rect.height - topReserve - bottomReserve);
    state.zoom = Math.max(0.58, Math.min(0.92, availableWidth / worldWidth, availableHeight / worldHeight));
    state.panX = leftReserve + (availableWidth - worldWidth * state.zoom) / 2 - minX * state.zoom;
    state.panY = topReserve + (availableHeight - worldHeight * state.zoom) / 2 - minY * state.zoom;
    renderMap();
  }

  function selectPerson(personId, shouldCenter) {
    if (!byId(personId)) return;
    state.selectedPersonId = personId;
    if (shouldCenter) centerOnPerson(personId);
    renderMap();
    renderProfile();
    els.searchResults.hidden = true;
  }

  function highlightImmediateFamily(personId) {
    var currentGraph = graph();
    var ids = new Set([personId]);
    (currentGraph.parentsByChild.get(personId) || []).forEach(function add(parentRef) { ids.add(parentRef.id); });
    (currentGraph.childrenByParent.get(personId) || []).forEach(function add(childRef) { ids.add(childRef.id); });
    (currentGraph.partnersByPerson.get(personId) || []).forEach(function add(partnerRef) { ids.add(partnerRef.id); });
    people.forEach(function addSibling(candidate) {
      if (candidate.id !== personId && siblingInfo(personId, candidate.id, currentGraph)) ids.add(candidate.id);
    });
    state.highlightPath = [];
    state.highlightPeople = ids;
    renderMap();
  }

  function setZoom(nextZoom, originX, originY) {
    var previousZoom = state.zoom;
    var bounded = Math.max(0.45, Math.min(1.6, nextZoom));
    if (bounded === previousZoom) return;
    var rect = els.mapShell.getBoundingClientRect();
    var pointX = originX == null ? rect.width / 2 : originX;
    var pointY = originY == null ? rect.height / 2 : originY;
    var worldX = (pointX - state.panX) / previousZoom;
    var worldY = (pointY - state.panY) / previousZoom;
    state.zoom = bounded;
    state.panX = pointX - worldX * bounded;
    state.panY = pointY - worldY * bounded;
    renderMap();
  }

  function openAddInfoDialog() {
    var person = byId(state.selectedPersonId);
    var categorySelect = els.addInfoForm.elements.category;
    categorySelect.innerHTML = promptCategories.map(function option(item) {
      return "<option value=\"" + escapeHTML(item[0]) + "\">" + escapeHTML(item[0]) + "</option>";
    }).join("");
    els.promptGrid.innerHTML = promptCategories.slice(0, 8).map(function button(item) {
      return "<button type=\"button\" data-prompt-category=\"" + escapeHTML(item[0]) + "\" data-prompt-label=\"" + escapeHTML(item[1]) + "\">" + escapeHTML(item[1]) + "</button>";
    }).join("");
    els.addInfoForm.reset();
    if (person) {
      seedNameParts(person);
      els.addInfoForm.elements.firstName.value = person.firstName || "";
      els.addInfoForm.elements.middleNames.value = person.middleNames || "";
      els.addInfoForm.elements.lastName.value = person.lastName || "";
      els.addInfoForm.elements.birthYear.value = person.birthYear || "";
      els.addInfoForm.elements.gender.value = person.gender || "unknown";
    }
    els.addInfoDialog.showModal();
  }

  function submitAddInfo(event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      els.addInfoDialog.close();
      return;
    }
    var form = new FormData(els.addInfoForm);
    var person = byId(state.selectedPersonId);
    var firstName = String(form.get("firstName") || "").trim();
    var middleNames = String(form.get("middleNames") || "").trim();
    var lastName = String(form.get("lastName") || "").trim();
    var birthYear = Number(form.get("birthYear")) || null;
    var gender = String(form.get("gender") || "unknown");
    var label = String(form.get("label") || "").trim();
    var value = String(form.get("value") || "").trim();
    var category = normalCategory(String(form.get("category") || "Additional"));
    var visibility = String(form.get("visibility") || "family");
    var hasBasics = person && Boolean(
      firstName !== String(person.firstName || "").trim() ||
      middleNames !== String(person.middleNames || "").trim() ||
      lastName !== String(person.lastName || "").trim() ||
      birthYear !== (person.birthYear || null) ||
      gender !== (person.gender || "unknown")
    );
    var hasDetail = Boolean(label && value);
    if (!person || (!hasBasics && !hasDetail)) return;
    els.addInfoDialog.close();

    withUndo("Saved", function addInfo() {
      if (hasBasics) {
        person.firstName = firstName;
        person.middleNames = middleNames;
        person.lastName = lastName;
        person.birthYear = birthYear;
        person.gender = gender;
        person.name = primaryName(person);
        if (firstName || lastName) person.placeholder = false;
        addActivity(CURRENT_USER_ID, "updated basics for " + primaryName(person));
      }

      if (!hasDetail) return;

      if (person.claimedBy && person.claimedBy !== CURRENT_USER_ID && isLiving(person)) {
        suggestions.push({
          id: newId("suggestion"),
          personId: person.id,
          targetFieldId: null,
          label: label,
          proposedValue: value,
          message: "Suggested as a new " + label + " contribution.",
          actorId: CURRENT_USER_ID,
          status: "pending",
          createdAt: readableNow(),
          visibility: visibility,
          category: category
        });
        addActivity(CURRENT_USER_ID, "suggested new information for " + primaryName(person));
        return;
      }

      profileFields.push({
        id: newId("field"),
        personId: person.id,
        label: label,
        category: category,
        value: value,
        visibility: visibility,
        ownerId: person.claimedBy || CURRENT_USER_ID,
        addedBy: CURRENT_USER_ID,
        createdAt: readableNow(),
        updatedBy: CURRENT_USER_ID,
        updatedAt: readableNow(),
        sensitive: visibility === "only_me",
        deletedAt: null,
        revisions: [{
          at: readableNow(),
          actorId: CURRENT_USER_ID,
          previous: null,
          next: value
        }]
      });
      addActivity(CURRENT_USER_ID, "added " + label.toLowerCase() + " for " + primaryName(person));
    });
  }

  function normalCategory(category) {
    if (category === "Work" || category === "Education" || category === "Life event" || category === "Achievement") return "Life";
    if (category === "Instrument" || category === "Sport" || category === "Interest") return "Interests";
    if (category === "Story" || category === "Photo") return "Memories";
    if (category === "Place") return "About";
    return "Additional";
  }

  function openSuggestDialog(fieldId) {
    var target = profileFields.find(function findField(item) {
      return item.id === fieldId;
    });
    if (!target) return;
    state.pendingSuggestFieldId = fieldId;
    els.suggestCurrent.textContent = "Current " + target.label + ": " + target.value;
    els.suggestForm.reset();
    els.suggestDialog.showModal();
  }

  function submitSuggestion(event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      els.suggestDialog.close();
      return;
    }
    var target = profileFields.find(function findField(item) {
      return item.id === state.pendingSuggestFieldId;
    });
    var value = String(new FormData(els.suggestForm).get("value") || "").trim();
    var message = String(new FormData(els.suggestForm).get("message") || "").trim();
    if (!target || !value) return;
    els.suggestDialog.close();
    withUndo("Suggestion sent", function addSuggestion() {
      suggestions.push({
        id: newId("suggestion"),
        personId: target.personId,
        targetFieldId: target.id,
        label: target.label,
        proposedValue: value,
        message: message,
        actorId: CURRENT_USER_ID,
        status: "pending",
        createdAt: readableNow()
      });
      addActivity(CURRENT_USER_ID, "suggested a correction to " + possessive(personName(target.personId)) + " " + target.label.toLowerCase());
    });
  }

  function acceptSuggestion(id, editedValue) {
    var suggestion = suggestions.find(function findSuggestion(item) {
      return item.id === id;
    });
    if (!suggestion) return;
    withUndo("Accepted", function accept() {
      var value = editedValue || suggestion.proposedValue;
      if (suggestion.targetFieldId) {
        var target = profileFields.find(function findField(item) {
          return item.id === suggestion.targetFieldId;
        });
        if (target) {
          target.revisions.push({
            at: readableNow(),
            actorId: CURRENT_USER_ID,
            previous: target.value,
            next: value
          });
          target.value = value;
          target.updatedBy = CURRENT_USER_ID;
          target.updatedAt = readableNow();
        }
      } else {
        profileFields.push({
          id: newId("field"),
          personId: suggestion.personId,
          label: suggestion.label,
          category: suggestion.category || "Additional",
          value: value,
          visibility: suggestion.visibility || "family",
          ownerId: CURRENT_USER_ID,
          addedBy: suggestion.actorId,
          createdAt: readableNow(),
          updatedBy: CURRENT_USER_ID,
          updatedAt: readableNow(),
          sensitive: false,
          deletedAt: null,
          revisions: [{
            at: readableNow(),
            actorId: CURRENT_USER_ID,
            previous: null,
            next: value
          }]
        });
      }
      suggestion.status = "accepted";
      suggestion.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "accepted " + possessive(personName(suggestion.actorId)) + " suggestion");
    });
  }

  function dismissSuggestion(id) {
    withUndo("Dismissed", function dismiss() {
      var suggestion = suggestions.find(function findSuggestion(item) {
        return item.id === id;
      });
      if (!suggestion) return;
      suggestion.status = "dismissed";
      suggestion.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "dismissed a suggested correction");
    });
  }

  function editField(fieldId) {
    var target = profileFields.find(function findField(item) {
      return item.id === fieldId;
    });
    if (!target) return;
    var value = window.prompt("Edit " + target.label, target.value);
    if (value == null || !value.trim()) return;
    withUndo("Saved", function edit() {
      target.revisions.push({
        at: readableNow(),
        actorId: CURRENT_USER_ID,
        previous: target.value,
        next: value.trim()
      });
      target.value = value.trim();
      target.updatedBy = CURRENT_USER_ID;
      target.updatedAt = readableNow();
      addActivity(CURRENT_USER_ID, "updated " + possessive(personName(target.personId)) + " " + target.label.toLowerCase());
    });
  }

  function removeField(fieldId) {
    withUndo("Removed", function remove() {
      var target = profileFields.find(function findField(item) {
        return item.id === fieldId;
      });
      if (!target) return;
      target.deletedAt = readableNow();
      deletionRecords.push({
        id: newId("delete"),
        entityType: "profile_field",
        entityId: target.id,
        entityName: target.label + " for " + personName(target.personId),
        actorId: CURRENT_USER_ID,
        deletedAt: readableNow(),
        previousState: JSON.parse(JSON.stringify(target))
      });
      addActivity(CURRENT_USER_ID, "removed " + possessive(personName(target.personId)) + " " + target.label.toLowerCase());
    });
  }

  function softDeleteSelectedPerson() {
    var person = byId(state.selectedPersonId);
    if (!person || person.id === CURRENT_USER_ID) return;
    var confirmed = window.confirm("Remove " + primaryName(person) + " from the visible family tree?");
    if (!confirmed) return;
    withUndo("Removed", function removePerson() {
      person.status = "deleted";
      person.deletedAt = readableNow();
      deletionRecords.push({
        id: newId("delete"),
        entityType: "person",
        entityId: person.id,
        entityName: primaryName(person),
        actorId: CURRENT_USER_ID,
        deletedAt: readableNow(),
        previousState: JSON.parse(JSON.stringify(person))
      });
      state.selectedPersonId = CURRENT_USER_ID;
      addActivity(CURRENT_USER_ID, "removed " + primaryName(person));
    });
  }

  function restoreDeleted(recordId) {
    withUndo("Restored", function restoreRecord() {
      var record = deletionRecords.find(function findRecord(item) {
        return item.id === recordId;
      });
      if (!record || record.restoredAt) return;
      if (record.entityType === "person") {
        var person = byId(record.entityId);
        if (person) {
          person.status = "active";
          person.deletedAt = null;
        }
      }
      if (record.entityType === "profile_field") {
        var target = profileFields.find(function findField(item) {
          return item.id === record.entityId;
        });
        if (target) target.deletedAt = null;
      }
      record.restoredAt = readableNow();
      record.restoredBy = CURRENT_USER_ID;
      addActivity(CURRENT_USER_ID, "restored " + record.entityName);
    });
  }

  function openRelativeDialog(defaultConnection) {
    els.relativeForm.reset();
    if (defaultConnection) {
      els.relativeForm.elements.connection.value = defaultConnection;
    }
    els.duplicateResults.hidden = true;
    els.duplicateResults.innerHTML = "";
    els.relativeDialog.showModal();
  }

  function submitRelative(event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      els.relativeDialog.close();
      return;
    }
    var form = new FormData(els.relativeForm);
    var name = String(form.get("name") || "").trim();
    var birthYear = Number(form.get("birthYear")) || null;
    var gender = String(form.get("gender") || "unknown");
    var connection = String(form.get("connection") || "child");
    if (!name) return;
    els.relativeDialog.close();

    withUndo("Person added", function addPerson() {
      var base = byId(state.selectedPersonId) || byId(CURRENT_USER_ID);
      var id = newId("person");
      var nameParts = splitNameParts(name);
      people.push({
        id: id,
        name: [nameParts.firstName, nameParts.lastName].filter(Boolean).join(" ") || name,
        firstName: nameParts.firstName,
        middleNames: nameParts.middleNames,
        lastName: nameParts.lastName,
        birthYear: birthYear,
        deathYear: null,
        gender: gender,
        claimedBy: null,
        stewardId: CURRENT_USER_ID,
        x: base.x + (connection === "partner" ? 260 : connection === "sibling" ? 260 : 0),
        y: base.y + (connection === "child" ? 300 : connection === "parent" ? -300 : 0),
        placeholder: true,
        roleHint: connectionLabel(connection),
        partnerPrompt: "Add husband, wife or partner"
      });
      connectPeople(id, base.id, connection);
      addActivity(CURRENT_USER_ID, "added " + name);
      state.selectedPersonId = id;
    });
  }

  function connectExistingPerson(existingId) {
    var base = byId(state.selectedPersonId);
    var connection = String(new FormData(els.relativeForm).get("connection") || "child");
    if (!base || !byId(existingId)) return;
    els.relativeDialog.close();
    withUndo("Connected", function connectExisting() {
      connectPeople(existingId, base.id, connection);
      addActivity(CURRENT_USER_ID, "connected " + personName(existingId) + " to " + primaryName(base));
      state.selectedPersonId = existingId;
    });
  }

  function connectPeople(subjectId, baseId, connection) {
    if (connection === "child") relationships.push(relationship(baseId, subjectId, "biological_parent"));
    if (connection === "parent") relationships.push(relationship(subjectId, baseId, "biological_parent"));
    if (connection === "partner") relationships.push(relationship(subjectId, baseId, "partner"));
    if (connection === "sibling") {
      var parents = graph().parentsByChild.get(baseId) || [];
      if (parents.length) {
        parents.forEach(function connectParent(parentRef) {
          relationships.push(relationship(parentRef.id, subjectId, parentRef.type || "biological_parent"));
        });
      } else {
        relationships.push(relationship(subjectId, baseId, "sibling"));
      }
    }
  }

  function connectionLabel(connection) {
    if (connection === "child") return "Child";
    if (connection === "parent") return "Parent";
    if (connection === "partner") return "Partner";
    if (connection === "sibling") return "Sibling";
    return "Family member";
  }

  function genderClass(person) {
    if (!person) return "gender-neutral";
    if (person.gender === "male") return "gender-male";
    if (person.gender === "female") return "gender-female";
    return "gender-neutral";
  }

  function splitNameParts(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || "",
      middleNames: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
      lastName: parts.length > 1 ? parts[parts.length - 1] : ""
    };
  }

  function renderDuplicateMatches() {
    var form = new FormData(els.relativeForm);
    var name = String(form.get("name") || "").trim();
    var birthYear = Number(form.get("birthYear")) || null;
    var matches = findDuplicates(name, birthYear);
    if (!matches.length) {
      els.duplicateResults.hidden = true;
      els.duplicateResults.innerHTML = "";
      return;
    }
    els.duplicateResults.hidden = false;
    els.duplicateResults.innerHTML = [
      "<strong>Could this already be " + escapeHTML(name || "this person") + "?</strong>",
      matches.map(function renderMatch(match) {
        return [
          "<article class=\"duplicate-card\">",
          "<div><strong>" + escapeHTML(primaryName(match.person)) + "</strong><p class=\"muted\">" + escapeHTML(years(match.person)) + "</p></div>",
          "<div class=\"card-actions\">",
          "<button class=\"button compact\" type=\"button\" data-view-duplicate=\"" + escapeHTML(match.person.id) + "\">View profile</button>",
          "<button class=\"button compact primary\" type=\"button\" data-connect-duplicate=\"" + escapeHTML(match.person.id) + "\">Connect existing</button>",
          "</div>",
          "</article>"
        ].join("");
      }).join("")
    ].join("");
  }

  function findDuplicates(name, birthYear) {
    if (!name) return [];
    var normalized = normalizeName(name);
    var parts = normalized.split(" ").filter(Boolean);
    return people.filter(function match(person) {
      if (person.status === "deleted") return false;
      var personNameValue = normalizeName(fullName(person));
      var personParts = personNameValue.split(" ").filter(Boolean);
      var exact = personNameValue === normalized;
      var sharedParts = parts.filter(function count(part) {
        return personNameValue.includes(part);
      }).length;
      var firstNameMatch = parts[0] && personParts[0] === parts[0];
      var yearClose = birthYear && person.birthYear && Math.abs(person.birthYear - birthYear) <= 3;
      return exact || (sharedParts >= 2 && (!birthYear || yearClose)) || (firstNameMatch && yearClose);
    }).map(function score(person) {
      return { person: person };
    }).slice(0, 3);
  }

  function normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
  }

  function requestProfileClaim() {
    var person = byId(state.selectedPersonId);
    if (!person || person.claimedBy) return;
    withUndo("Claim request sent", function claim() {
      claimRequests.push({
        id: newId("claim"),
        personId: person.id,
        requesterPersonId: CURRENT_USER_ID,
        name: CURRENT_USER_NAME,
        status: "pending",
        createdAt: readableNow()
      });
      addActivity(CURRENT_USER_ID, "requested to claim " + primaryName(person));
    });
  }

  function approveAccess(id) {
    withUndo("Approved", function approve() {
      var request = accessRequests.find(function findRequest(item) {
        return item.id === id;
      });
      if (!request) return;
      request.status = "approved";
      request.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "approved access for " + request.name);
    });
  }

  function declineAccess(id) {
    withUndo("Declined", function decline() {
      var request = accessRequests.find(function findRequest(item) {
        return item.id === id;
      });
      if (!request) return;
      request.status = "declined";
      request.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "declined an access request");
    });
  }

  function approveClaim(id) {
    withUndo("Claim approved", function approve() {
      var claim = claimRequests.find(function findClaim(item) {
        return item.id === id;
      });
      if (!claim) return;
      var person = byId(claim.personId);
      if (person) person.claimedBy = claim.requesterPersonId;
      claim.status = "approved";
      claim.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "approved a profile claim for " + personName(claim.personId));
    });
  }

  function declineClaim(id) {
    withUndo("Claim declined", function decline() {
      var claim = claimRequests.find(function findClaim(item) {
        return item.id === id;
      });
      if (!claim) return;
      claim.status = "declined";
      claim.resolvedAt = readableNow();
      addActivity(CURRENT_USER_ID, "declined a profile claim");
    });
  }

  function submitInvite(event) {
    event.preventDefault();
    var form = new FormData(els.inviteForm);
    var email = String(form.get("email") || "").trim();
    var role = String(form.get("role") || "member");
    if (!email) return;
    withUndo("Invitation saved", function invite() {
      invitations.push({
        id: newId("invite"),
        email: email,
        role: role,
        status: "sent",
        invitedBy: CURRENT_USER_ID,
        createdAt: readableNow()
      });
      addActivity(CURRENT_USER_ID, "invited " + email + " as " + role);
      els.inviteForm.reset();
    });
  }

  function submitGateRequest(event) {
    event.preventDefault();
    var form = new FormData(event.currentTarget);
    var name = String(form.get("name") || "").trim();
    var email = String(form.get("email") || "").trim();
    var message = String(form.get("message") || "").trim();
    if (!name || !email) return;
    accessRequests.push({
      id: newId("access"),
      name: name,
      email: email,
      message: message,
      status: "pending",
      createdAt: readableNow()
    });
    addActivity(CURRENT_USER_ID, name + " requested access");
    persist();
    event.currentTarget.reset();
    window.alert("Access request sent.");
  }

  function newId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return prefix + "-" + window.crypto.randomUUID();
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function closeFloatingSurfaces() {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = "";
    if (els.addInfoDialog.open) els.addInfoDialog.close();
    if (els.suggestDialog.open) els.suggestDialog.close();
    if (els.relativeDialog.open) els.relativeDialog.close();
    if (els.accessDialog.open) els.accessDialog.close();
  }

  function clearDemoHighlight() {
    document.querySelectorAll(".demo-highlight").forEach(function removeHighlight(element) {
      element.classList.remove("demo-highlight");
    });
  }

  function startDemo() {
    els.privateGate.hidden = true;
    els.approvedApp.hidden = false;
    demoIndex = 0;
    showDemoStep();
  }

  function showDemoStep() {
    clearDemoHighlight();
    if (demoIndex < 0 || demoIndex >= demoSteps.length) {
      endDemo();
      return;
    }

    var step = demoSteps[demoIndex];
    step.prepare();
    els.demoStepCount.textContent = "Step " + (demoIndex + 1) + " of " + demoSteps.length;
    els.demoTitle.textContent = step.title;
    els.demoText.textContent = step.text;
    els.demoNextButton.textContent = demoIndex === demoSteps.length - 1 ? "Finish" : "Next";
    els.demoCoach.hidden = false;

    window.requestAnimationFrame(function highlightStep() {
      var target = document.querySelector(step.selector);
      if (!target) return;
      target.classList.add("demo-highlight");
      target.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth"
      });
    });
  }

  function nextDemoStep() {
    if (demoIndex >= demoSteps.length - 1) {
      endDemo();
      return;
    }
    demoIndex += 1;
    showDemoStep();
  }

  function endDemo() {
    demoIndex = -1;
    clearDemoHighlight();
    els.demoCoach.hidden = true;
  }

  function showTooltip(target) {
    var message = target && target.getAttribute("data-tooltip");
    if (!message) return;
    els.tooltipBubble.textContent = message;
    els.tooltipBubble.hidden = false;

    var rect = target.getBoundingClientRect();
    var bubbleRect = els.tooltipBubble.getBoundingClientRect();
    var left = Math.min(
      window.innerWidth - bubbleRect.width - 12,
      Math.max(12, rect.left)
    );
    var top = rect.bottom + 9;
    if (top + bubbleRect.height > window.innerHeight - 12) {
      top = rect.top - bubbleRect.height - 9;
    }
    els.tooltipBubble.style.left = left + "px";
    els.tooltipBubble.style.top = Math.max(12, top) + "px";
  }

  function hideTooltip() {
    els.tooltipBubble.hidden = true;
  }

  function applyNativeTooltips(root) {
    root.querySelectorAll("[data-tooltip]").forEach(function addNativeTooltip(element) {
      if (!element.getAttribute("title")) {
        element.setAttribute("title", element.getAttribute("data-tooltip"));
      }
    });
  }

  function bindTooltips() {
    applyNativeTooltips(document);
    document.addEventListener("pointerover", function showPointerTooltip(event) {
      var target = event.target.closest("[data-tooltip]");
      if (!target) return;
      showTooltip(target);
    });
    document.addEventListener("pointerout", function hidePointerTooltip(event) {
      var target = event.target.closest("[data-tooltip]");
      if (!target) return;
      var nextTarget = event.relatedTarget && event.relatedTarget.closest
        ? event.relatedTarget.closest("[data-tooltip]")
        : null;
      if (nextTarget === target) return;
      hideTooltip();
    });
    document.addEventListener("focusin", function showFocusTooltip(event) {
      var target = event.target.closest("[data-tooltip]");
      if (target) showTooltip(target);
    });
    document.addEventListener("focusout", function hideFocusTooltip(event) {
      if (event.target.closest("[data-tooltip]")) hideTooltip();
    });
    window.addEventListener("scroll", hideTooltip, { passive: true });
    window.addEventListener("resize", hideTooltip);
  }

  function bindEvents() {
    document.getElementById("demoButton").addEventListener("click", startDemo);
    els.demoNextButton.addEventListener("click", nextDemoStep);
    els.demoEndButton.addEventListener("click", endDemo);

    document.getElementById("youButton").addEventListener("click", function goYou() {
      endDemo();
      state.selectedPersonId = CURRENT_USER_ID;
      state.collapsedBranches = false;
      highlightImmediateFamily(CURRENT_USER_ID);
      centerOnPerson(CURRENT_USER_ID);
      renderProfile();
    });

    document.getElementById("connectionsButton").addEventListener("click", function showConnections() {
      endDemo();
      els.connectionsPanel.classList.remove("connections-panel-collapsed");
      state.relationshipA = "sibling";
      state.relationshipB = CURRENT_USER_ID;
      state.collapsedBranches = false;
      renderAll();
      fitFamilyOverview();
    });

    document.getElementById("closeConnectionsButton").addEventListener("click", function closeConnections() {
      els.connectionsPanel.classList.add("connections-panel-collapsed");
      state.highlightPath = [];
      state.highlightPeople = new Set();
      renderMap();
    });

    document.getElementById("zoomInButton").addEventListener("click", function zoomIn() {
      setZoom(state.zoom + 0.12);
    });
    document.getElementById("zoomOutButton").addEventListener("click", function zoomOut() {
      setZoom(state.zoom - 0.12);
    });
    document.getElementById("recenterButton").addEventListener("click", function recenter() {
      centerOnPerson(state.selectedPersonId);
    });
    document.getElementById("branchButton").addEventListener("click", function addRelativeFromTree() {
      openRelativeDialog();
    });

    els.globalSearch.addEventListener("input", function onSearch(event) {
      performSearch(event.target.value);
    });

    els.personASelect.addEventListener("change", function changeA(event) {
      state.relationshipA = event.target.value;
      renderRelationshipExplorer();
      renderMap();
    });
    els.personBSelect.addEventListener("change", function changeB(event) {
      state.relationshipB = event.target.value;
      renderRelationshipExplorer();
      renderMap();
    });

    els.themeSelect.addEventListener("change", function changeTheme(event) {
      state.theme = event.target.value;
      persist();
      applyTheme();
    });

    document.querySelectorAll("[data-accent]").forEach(function bindSwatch(button) {
      button.addEventListener("click", function setAccent() {
        state.accent = button.dataset.accent;
        persist();
        applyTheme();
      });
    });

    document.getElementById("privateLandingButton").addEventListener("click", function showGate() {
      endDemo();
      els.approvedApp.hidden = true;
      els.privateGate.hidden = false;
    });
    document.getElementById("approvedPreviewButton").addEventListener("click", function showApproved() {
      els.privateGate.hidden = true;
      els.approvedApp.hidden = false;
    });
    document.getElementById("accessButton").addEventListener("click", function showAccess() {
      endDemo();
      els.accessDialog.showModal();
    });
    document.getElementById("closeAccessButton").addEventListener("click", function closeAccess() {
      els.accessDialog.close();
    });

    document.getElementById("removedButton").addEventListener("click", function toggleRemoved() {
      els.removedList.hidden = !els.removedList.hidden;
    });

    els.addInfoForm.addEventListener("submit", submitAddInfo);
    els.suggestForm.addEventListener("submit", submitSuggestion);
    els.relativeForm.addEventListener("submit", submitRelative);
    els.relativeForm.addEventListener("input", renderDuplicateMatches);
    els.inviteForm.addEventListener("submit", submitInvite);
    document.getElementById("accessRequestForm").addEventListener("submit", submitGateRequest);

    els.undoButton.addEventListener("click", function undo() {
      if (!lastUndo) return;
      restore(lastUndo);
      lastUndo = null;
      els.toast.hidden = true;
    });

    document.addEventListener("click", handleDocumentClick);
    bindTooltips();
    bindMapGestures();
    bindKeyboardNavigation();
  }

  function handleDocumentClick(event) {
    var personButton = event.target.closest("[data-person-id]");
    if (personButton) {
      selectPerson(personButton.dataset.personId, true);
      return;
    }

    var expand = event.target.closest("[data-expand-branch]");
    if (expand) {
      state.collapsedBranches = false;
      renderMap();
      return;
    }

    if (event.target.closest("[data-open-add-info]")) openAddInfoDialog();
    var relativeButton = event.target.closest("[data-open-relative]");
    if (relativeButton) openRelativeDialog(relativeButton.dataset.defaultConnection);
    if (event.target.closest("[data-claim-profile]")) requestProfileClaim();
    if (event.target.closest("[data-soft-delete]")) softDeleteSelectedPerson();

    var prompt = event.target.closest("[data-prompt-category]");
    if (prompt) {
      els.addInfoForm.elements.category.value = prompt.dataset.promptCategory;
      els.addInfoForm.elements.label.value = prompt.dataset.promptLabel;
      els.addInfoForm.querySelector("[name='value']").focus();
    }

    var suggest = event.target.closest("[data-suggest-field]");
    if (suggest) openSuggestDialog(suggest.dataset.suggestField);

    var edit = event.target.closest("[data-edit-field]");
    if (edit) editField(edit.dataset.editField);

    var remove = event.target.closest("[data-remove-field]");
    if (remove) removeField(remove.dataset.removeField);

    var accept = event.target.closest("[data-accept-suggestion]");
    if (accept) acceptSuggestion(accept.dataset.acceptSuggestion);

    var editAccept = event.target.closest("[data-edit-accept-suggestion]");
    if (editAccept) {
      var suggestion = suggestions.find(function findSuggestion(item) {
        return item.id === editAccept.dataset.editAcceptSuggestion;
      });
      if (suggestion) {
        var editedValue = window.prompt("Edit before accepting", suggestion.proposedValue);
        if (editedValue && editedValue.trim()) acceptSuggestion(suggestion.id, editedValue.trim());
      }
    }

    var dismiss = event.target.closest("[data-dismiss-suggestion]");
    if (dismiss) dismissSuggestion(dismiss.dataset.dismissSuggestion);

    var viewDuplicate = event.target.closest("[data-view-duplicate]");
    if (viewDuplicate) {
      els.relativeDialog.close();
      selectPerson(viewDuplicate.dataset.viewDuplicate, true);
    }

    var connectDuplicate = event.target.closest("[data-connect-duplicate]");
    if (connectDuplicate) connectExistingPerson(connectDuplicate.dataset.connectDuplicate);

    var approve = event.target.closest("[data-approve-access]");
    if (approve) approveAccess(approve.dataset.approveAccess);

    var decline = event.target.closest("[data-decline-access]");
    if (decline) declineAccess(decline.dataset.declineAccess);

    var approveClaimButton = event.target.closest("[data-approve-claim]");
    if (approveClaimButton) approveClaim(approveClaimButton.dataset.approveClaim);

    var declineClaimButton = event.target.closest("[data-decline-claim]");
    if (declineClaimButton) declineClaim(declineClaimButton.dataset.declineClaim);

    var restoreButton = event.target.closest("[data-restore]");
    if (restoreButton) restoreDeleted(restoreButton.dataset.restore);
  }

  function bindMapGestures() {
    var drag = null;
    els.mapShell.addEventListener("pointerdown", function startDrag(event) {
      if (event.target.closest("button")) return;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        panX: state.panX,
        panY: state.panY
      };
      els.mapShell.classList.add("is-dragging");
      els.mapShell.setPointerCapture(event.pointerId);
    });

    els.mapShell.addEventListener("pointermove", function moveDrag(event) {
      if (!drag) return;
      state.panX = drag.panX + event.clientX - drag.startX;
      state.panY = drag.panY + event.clientY - drag.startY;
      renderMap();
    });

    els.mapShell.addEventListener("pointerup", function endDrag() {
      drag = null;
      els.mapShell.classList.remove("is-dragging");
    });

    els.mapShell.addEventListener("wheel", function wheelZoom(event) {
      event.preventDefault();
      var rect = els.mapShell.getBoundingClientRect();
      var direction = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom(state.zoom + direction, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
  }

  function bindKeyboardNavigation() {
    els.mapShell.addEventListener("keydown", function moveWithKeys(event) {
      var amount = event.shiftKey ? 80 : 32;
      if (event.key === "ArrowLeft") state.panX += amount;
      else if (event.key === "ArrowRight") state.panX -= amount;
      else if (event.key === "ArrowUp") state.panY += amount;
      else if (event.key === "ArrowDown") state.panY -= amount;
      else return;
      event.preventDefault();
      renderMap();
    });
  }

  function initialCenter() {
    window.requestAnimationFrame(function center() {
      fitFamilyOverview();
      highlightImmediateFamily(CURRENT_USER_ID);
    });
  }

  loadSavedState();
  bindEvents();
  renderAll();
  initialCenter();
})();
