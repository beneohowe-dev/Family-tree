(function bootFamilyNetwork() {
  "use strict";

  var CURRENT_USER_ID = "you";
  var CURRENT_USER_NAME = "You";
  var STORAGE_KEY = "private-family-network-prototype-v14";
  var DAILY_SNAPSHOT_KEY = "private-family-network-daily-saves-v1";

  var people = [
    {
      id: "parent-1",
      name: "Parent",
      firstName: "Parent",
      middleNames: "",
      lastName: "",
      birthDate: "",
      birthYear: null,
      birthPlace: "",
      deathYear: null,
      photoData: "",
      gender: "male",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 520,
      y: 430,
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
      birthDate: "",
      birthYear: null,
      birthPlace: "",
      deathYear: null,
      photoData: "",
      gender: "female",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 720,
      y: 430,
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
      birthDate: "",
      birthYear: null,
      birthPlace: "",
      deathYear: null,
      photoData: "",
      gender: "unknown",
      claimedBy: "you",
      x: 550,
      y: 650,
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
      birthDate: "",
      birthYear: null,
      birthPlace: "",
      deathYear: null,
      photoData: "",
      gender: "unknown",
      claimedBy: null,
      stewardId: CURRENT_USER_ID,
      x: 750,
      y: 650,
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

  var profileFields = [];

  var suggestions = [];

  var accessRequests = [];

  var invitations = [];
  var deletionRecords = [];
  var claimRequests = [];
  var activity = [
    activityItem("you", "started a family tree", "Today 09:00")
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
    editMode: false,
    showDates: false,
    moreOpen: false,
    theme: "gallery",
    accent: "#70717c"
  };

  var lastUndo = null;
  var toastTimer = null;
  var photoDraft = emptyPhotoDraft();
  var lastLayout = null;
  var suppressNextPersonClick = false;
  var TREE_WORLD_WIDTH = 3600;
  var TREE_WORLD_HEIGHT = 2400;
  var TREE_NODE_WIDTH = 168;
  var TREE_NODE_HEIGHT = 248;
  var TREE_NODE_HALF_X = TREE_NODE_WIDTH / 2;
  var TREE_NODE_HALF_Y = TREE_NODE_HEIGHT / 2;
  var TIMELINE_START_YEAR = 1900;
  var TIMELINE_END_YEAR = 2026;
  var TIMELINE_TOP_Y = 360;
  var TIMELINE_BOTTOM_Y = 2050;
  var TIMELINE_AXIS_X = 118;
  var TIMELINE_TICKS = [1900, 1930, 1960, 1990, 2026];

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
    lowerGrid: document.getElementById("lowerGrid"),
    activityList: document.getElementById("activityList"),
    removedList: document.getElementById("removedList"),
    dailySaveList: document.getElementById("dailySaveList"),
    addInfoDialog: document.getElementById("addInfoDialog"),
    addInfoForm: document.getElementById("addInfoForm"),
    profilePhotoInput: document.getElementById("profilePhotoInput"),
    photoCropper: document.getElementById("photoCropper"),
    photoPreviewCanvas: document.getElementById("photoPreviewCanvas"),
    photoZoom: document.getElementById("photoZoom"),
    photoX: document.getElementById("photoX"),
    photoY: document.getElementById("photoY"),
    photoRemoveButton: document.getElementById("photoRemoveButton"),
    suggestDialog: document.getElementById("suggestDialog"),
    suggestForm: document.getElementById("suggestForm"),
    suggestCurrent: document.getElementById("suggestCurrent"),
    relativeDialog: document.getElementById("relativeDialog"),
    relativeForm: document.getElementById("relativeForm"),
    duplicateResults: document.getElementById("duplicateResults"),
    relativeConnectionLabel: document.getElementById("relativeConnectionLabel"),
    accessDialog: document.getElementById("accessDialog"),
    accessRequests: document.getElementById("accessRequests"),
    inviteForm: document.getElementById("inviteForm"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),
    tooltipBubble: document.getElementById("tooltipBubble"),
    undoButton: document.getElementById("undoButton"),
    saveButton: document.getElementById("saveButton"),
    shareButton: document.getElementById("shareButton"),
    saveStatus: document.getElementById("saveStatus"),
    editModeButton: document.getElementById("editModeButton"),
    moreButton: document.getElementById("moreButton"),
    fitTreeButton: document.getElementById("fitTreeButton"),
    datesToggleButton: document.getElementById("datesToggleButton"),
    themeSelect: document.getElementById("themeSelect"),
    demoCoach: document.getElementById("demoCoach"),
    demoStepCount: document.getElementById("demoStepCount"),
    demoTitle: document.getElementById("demoTitle"),
    demoText: document.getElementById("demoText"),
    demoNextButton: document.getElementById("demoNextButton"),
    demoEndButton: document.getElementById("demoEndButton")
  };

  var demoIndex = -1;
  var demoSteps = [
    {
      selector: "[data-person-id=\"you\"]",
      title: "Start with You",
      text: "This is the safe starting point. Add your own name first, then work up to parents.",
      prepare: function prepareYou() {
        closeFloatingSurfaces();
        state.editMode = false;
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
      text: "Search stays simple. It looks at names, places and dates in this family tree.",
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
        state.editMode = false;
        selectPerson(CURRENT_USER_ID, true);
      }
    },
    {
      selector: "#editModeButton",
      title: "Turn on editing",
      text: "Browsing stays clean. Tap Edit tree only when you want to add people, details or photos.",
      prepare: function prepareEditMode() {
        closeFloatingSurfaces();
        state.editMode = false;
        renderAll();
      }
    },
    {
      selector: "[data-open-add-info]",
      title: "Fill in basics",
      text: "Add first and last name, birth details, birthplace, gender and a photo when you have one.",
      prepare: function prepareAdd() {
        state.editMode = true;
        selectPerson(CURRENT_USER_ID, true);
      }
    },
    {
      selector: "#branchButton",
      title: "Add family roles",
      text: "Choose who the new person is: parent, sibling, child, cousin, partner or another family role.",
      prepare: function prepareRelative() {
        closeFloatingSurfaces();
        state.editMode = true;
        selectPerson(CURRENT_USER_ID, true);
      }
    },
    {
      selector: "#shareButton",
      title: "Share with family",
      text: "Share link copies this view so another family member can open it and help fill in the basics.",
      prepare: function prepareShare() {
        closeFloatingSurfaces();
        if (els.privateGate) els.privateGate.hidden = true;
        els.approvedApp.hidden = false;
        state.moreOpen = true;
        renderAll();
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
      selector: "#dailySaveList",
      title: "Go back by day",
      text: "The tree keeps a simple daily save on this device, so you can restore an earlier day if needed.",
      prepare: function prepareDailySaves() {
        closeFloatingSurfaces();
        if (els.privateGate) els.privateGate.hidden = true;
        els.approvedApp.hidden = false;
        state.moreOpen = true;
        renderAll();
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

  function isParentRelationshipType(type) {
    return [
      "biological_parent",
      "adoptive_parent",
      "step_parent",
      "foster_parent",
      "guardian"
    ].indexOf(type) !== -1;
  }

  function isPartnerRelationshipType(type) {
    return [
      "spouse",
      "partner",
      "former_spouse",
      "former_partner"
    ].indexOf(type) !== -1;
  }

  function isDirectRelationshipType(type) {
    return [
      "sibling",
      "direct_cousin",
      "direct_aunt_uncle",
      "direct_grandparent",
      "direct_grandchild",
      "direct_family_link"
    ].indexOf(type) !== -1;
  }

  function graph() {
    return window.RelationshipEngine.createGraph(people, activeRelationships());
  }

  function isLiving(person) {
    return person && !person.deathYear;
  }

  function emptyPhotoDraft() {
    return {
      dataUrl: "",
      image: null,
      changed: false,
      remove: false,
      zoom: 1,
      x: 0,
      y: 0,
      croppedDataUrl: ""
    };
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safePhotoDataUrl(value) {
    var text = String(value || "");
    return /^data:image\/(png|jpe?g|webp);base64,/i.test(text) ? text : "";
  }

  function personPhotoData(person) {
    return safePhotoDataUrl(person && person.photoData);
  }

  function hasPersonPhoto(person) {
    return Boolean(personPhotoData(person) || (person && !person.placeholder && person.photo != null));
  }

  function profilePhotoMarkup(person) {
    var dataUrl = personPhotoData(person);
    if (dataUrl) {
      return "<div class=\"profile-photo\" style=\"background-image:url('" + escapeHTML(dataUrl) + "');background-position:center;background-size:cover\"></div>";
    }
    if (person.placeholder || person.photo == null) {
      return "<div class=\"profile-photo ghost-profile\" aria-hidden=\"true\"></div>";
    }
    return "<div class=\"profile-photo\" style=\"background-position:" + photoPosition(person) + "\"></div>";
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
    var dataUrl = personPhotoData(person);
    if (dataUrl) {
      return "<span class=\"" + classes.join(" ") + "\" aria-hidden=\"true\" style=\"background-image:url('" + escapeHTML(dataUrl) + "');background-position:center;background-size:cover\"></span>";
    }
    if (person.placeholder || person.photo == null) {
      classes.push("ghost");
      return "<span class=\"" + classes.join(" ") + "\" aria-hidden=\"true\"></span>";
    }
    return "<span class=\"" + classes.join(" ") + "\" aria-hidden=\"true\" style=\"background-position:" + photoPosition(person) + "\"></span>";
  }

  function normalizeDateInput(value) {
    var text = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }

  function yearFromDate(value) {
    var date = normalizeDateInput(value);
    return date ? Number(date.slice(0, 4)) : null;
  }

  function birthYearValue(person) {
    return person ? (person.birthYear || yearFromDate(person.birthDate)) : null;
  }

  function timelineYForYear(year) {
    var numericYear = Math.max(TIMELINE_START_YEAR, Math.min(TIMELINE_END_YEAR, Number(year) || TIMELINE_END_YEAR));
    var progress = (numericYear - TIMELINE_START_YEAR) / (TIMELINE_END_YEAR - TIMELINE_START_YEAR);
    return TIMELINE_TOP_Y + progress * (TIMELINE_BOTTOM_Y - TIMELINE_TOP_Y);
  }

  function timelineYForPerson(person, fallbackY) {
    var year = birthYearValue(person);
    return year ? timelineYForYear(year) : fallbackY;
  }

  function birthSortValue(person) {
    if (!person) return Number.POSITIVE_INFINITY;
    var birthDate = normalizeDateInput(person.birthDate);
    if (birthDate) return Number(birthDate.replace(/-/g, ""));
    var year = birthYearValue(person);
    return year ? year * 10000 : Number.POSITIVE_INFINITY;
  }

  function knownBirth(person) {
    return Number.isFinite(birthSortValue(person));
  }

  function sortOldestFirst(items) {
    return items.slice().sort(function compareBirthOrder(a, b) {
      var birthA = birthSortValue(a);
      var birthB = birthSortValue(b);
      if (birthA !== birthB) return birthA - birthB;
      if (knownBirth(a) !== knownBirth(b)) return knownBirth(a) ? -1 : 1;
      var xA = Number.isFinite(a && a.x) ? a.x : 0;
      var xB = Number.isFinite(b && b.x) ? b.x : 0;
      if (xA !== xB) return xA - xB;
      return primaryName(a).localeCompare(primaryName(b));
    });
  }

  function formatBirthDate(value) {
    var date = normalizeDateInput(value);
    if (!date) return "";
    var parts = date.split("-").map(Number);
    return new Intl.DateTimeFormat([], {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  function birthSummary(person) {
    if (!person) return "";
    if (person.birthDate) return formatBirthDate(person.birthDate);
    var year = birthYearValue(person);
    return year ? "c. " + year : "";
  }

  function years(person) {
    var birthYear = birthYearValue(person);
    if (!birthYear && !person.deathYear) return "";
    if (birthYear && person.deathYear) return birthYear + " - " + person.deathYear;
    if (birthYear) return birthYear + " -";
    return "? - " + person.deathYear;
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

  function dateKey(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function dailySaveLabel(dateString) {
    var parts = String(dateString || "").split("-");
    if (parts.length !== 3) return dateString || "Saved day";
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Intl.DateTimeFormat([], {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function readDailySnapshots() {
    try {
      var saved = JSON.parse(localStorage.getItem(DAILY_SNAPSHOT_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.warn("Unable to load daily saves.", error);
      return [];
    }
  }

  function writeDailySnapshots(items) {
    try {
      localStorage.setItem(DAILY_SNAPSHOT_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Unable to save daily restore point.", error);
    }
  }

  function rememberDailySnapshot() {
    var today = dateKey(new Date());
    var items = readDailySnapshots().filter(function valid(item) {
      return item && item.date && item.data;
    });
    var existing = items.find(function sameDay(item) {
      return item.date === today;
    });
    var entry = {
      date: today,
      label: dailySaveLabel(today),
      updatedAt: readableNow(),
      data: snapshot()
    };
    if (existing) {
      existing.label = entry.label;
      existing.updatedAt = entry.updatedAt;
      existing.data = entry.data;
    } else {
      items.push(entry);
    }
    items.sort(function newestFirst(a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
    writeDailySnapshots(items.slice(0, 14));
  }

  function restoreDailySnapshot(date) {
    var target = readDailySnapshots().find(function findSnapshot(item) {
      return item.date === date;
    });
    if (!target || !target.data) return;
    var confirmed = window.confirm("Restore the family tree from " + dailySaveLabel(date) + "?");
    if (!confirmed) return;
    lastUndo = snapshot();
    restore(target.data);
    showToast("Restored daily save", true);
  }

  function restore(data) {
    people = data.people || people;
    relationships = data.relationships || relationships;
    profileFields = data.profileFields || [];
    suggestions = data.suggestions || [];
    accessRequests = data.accessRequests || [];
    invitations = data.invitations || [];
    deletionRecords = data.deletionRecords || [];
    claimRequests = data.claimRequests || [];
    activity = data.activity || [];
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
    showToast(message || "Saved", true);
  }

  function showToast(message, canUndo) {
    var hasUndo = canUndo !== false && Boolean(lastUndo);
    els.toastMessage.textContent = hasUndo ? message + " · Undo" : message;
    els.undoButton.hidden = !hasUndo;
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
          accent: state.accent,
          showDates: state.showDates
        }
      }));
      rememberDailySnapshot();
      updateSaveStatus("Saved on this device");
    } catch (error) {
      console.warn("Unable to save local prototype state.", error);
      updateSaveStatus("Could not save");
    }
  }

  function updateSaveStatus(message) {
    if (!els.saveStatus) return;
    els.saveStatus.textContent = message;
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
        state.showDates = Boolean(saved.state.showDates);
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
    document.body.classList.toggle("is-editing-tree", state.editMode);
    document.body.classList.toggle("is-more-open", state.moreOpen);
    if (els.lowerGrid) {
      els.lowerGrid.hidden = !state.moreOpen && els.connectionsPanel.classList.contains("connections-panel-collapsed");
    }
    if (els.editModeButton) {
      els.editModeButton.textContent = state.editMode ? "Done editing" : "Edit tree";
      els.editModeButton.setAttribute("aria-pressed", String(state.editMode));
    }
    if (els.datesToggleButton) {
      els.datesToggleButton.setAttribute("aria-pressed", String(state.showDates));
      els.datesToggleButton.classList.toggle("active", state.showDates);
    }
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
    applyGenealogyLayout();
    var peopleToRender = visiblePeople();
    var visibleIds = new Set(peopleToRender.map(function toId(person) { return person.id; }));
    var pathPairs = pathPairSet(state.highlightPath);

    document.body.classList.toggle("show-dates", state.showDates);
    els.mapShell.classList.toggle("is-overview", state.zoom < 0.52);
    els.zoomLevel.value = Math.round(state.zoom * 100) + "%";
    clampPan();
    els.mapViewport.style.transform = "translate(" + state.panX + "px, " + state.panY + "px) scale(" + state.zoom + ")";

    renderTreeLines(visibleIds, pathPairs, peopleToRender, lastLayout);

    var nodeHtml = peopleToRender.map(function node(person) {
      var classes = ["person-node", genderClass(person)];
      classes.push(frameClass(person));
      if (person.id === state.selectedPersonId) classes.push("selected");
      if (person.id === CURRENT_USER_ID) classes.push("you");
      if (state.highlightPeople.size && !state.highlightPeople.has(person.id)) classes.push("muted");
      if (state.highlightPeople.has(person.id)) classes.push("highlight");
      return [
        "<button type=\"button\" class=\"" + classes.join(" ") + "\"",
        " data-person-id=\"" + escapeHTML(person.id) + "\"",
        state.editMode ? " data-photo-drop-person-id=\"" + escapeHTML(person.id) + "\"" : "",
        " aria-label=\"Open " + escapeHTML(primaryName(person)) + "\"",
        " style=\"left:" + person.x + "px;top:" + person.y + "px\">",
        portraitMarkup(person),
        "<span class=\"node-name\">" + escapeHTML(primaryName(person)) + "</span>",
        "<span class=\"node-years\">" + escapeHTML(years(person) || "Unknown") + "</span>",
        person.id === CURRENT_USER_ID ? "<span class=\"node-tag\" aria-label=\"You\"></span>" : "",
        "</button>"
      ].join("");
    }).join("");
    els.nodeLayer.innerHTML = nodeHtml + renderEditHandles();

  }

  function renderEditHandles() {
    if (!state.editMode) return "";
    var person = byId(state.selectedPersonId);
    if (!person || person.status === "deleted") return "";
    var actions = [
      { key: "parent", label: "+ Parent", tooltip: "Add this person's mother, father or parent above them.", x: 0, y: -TREE_NODE_HALF_Y - 56 },
      { key: "sibling", label: "+ Sibling", tooltip: "Add a brother or sister on the same generation line.", x: -TREE_NODE_HALF_X - 78, y: 0 },
      { key: "partner", label: "+ Partner", tooltip: "Add a husband, wife or partner beside this person.", x: TREE_NODE_HALF_X + 78, y: 0 },
      { key: "child", label: "+ Child", tooltip: "Add this person's child below them.", x: 0, y: TREE_NODE_HALF_Y + 56 }
    ];
    return [
      "<div class=\"edit-handle-layer\" style=\"left:" + person.x + "px;top:" + person.y + "px\">",
      actions.map(function renderAction(action) {
        return [
          "<button class=\"edit-handle " + escapeHTML(action.key) + "\" type=\"button\"",
          " data-open-relative data-default-connection=\"" + escapeHTML(action.key) + "\"",
          " data-tooltip=\"" + escapeHTML(action.tooltip) + "\"",
          " style=\"left:" + action.x + "px;top:" + action.y + "px\">",
          escapeHTML(action.label),
          "</button>"
        ].join("");
      }).join(""),
      "</div>"
    ].join("");
  }

  function applyGenealogyLayout() {
    lastLayout = window.RelationshipEngine.layoutFamilyTree(people, activeRelationships(), {
      rootId: CURRENT_USER_ID,
      nodeWidth: TREE_NODE_WIDTH,
      nodeHeight: TREE_NODE_HEIGHT,
      originX: TREE_WORLD_WIDTH / 2,
      originY: TREE_WORLD_HEIGHT / 2 + 130,
      rowGap: 330,
      partnerGap: 34,
      unitGap: 128
    });
    people.forEach(function applyPosition(person) {
      var point = lastLayout.positions.get(person.id);
      if (!point) return;
      person.x = point.x;
      person.y = point.y;
      person.generation = point.generation;
    });
  }

  function layoutRow(items, centerX, y, gap) {
    if (!items.length) return;
    var startX = centerX - ((items.length - 1) * gap) / 2;
    items.forEach(function place(person, index) {
      person.x = Math.round(startX + index * gap);
      person.y = Math.round(y);
    });
  }

  function average(values) {
    var numbers = values.filter(function valid(value) {
      return Number.isFinite(value);
    });
    if (!numbers.length) return 0;
    return numbers.reduce(function sum(total, value) {
      return total + value;
    }, 0) / numbers.length;
  }

  function renderTreeLines(visibleIds, pathPairs, peopleToRender, layout) {
    els.relationshipLines.innerHTML = "";
    renderTimelineGuides(peopleToRender);
    var partnerRelationships = activeRelationships().filter(function isPartner(relationshipItem) {
      return isPartnerRelationshipType(relationshipItem.type);
    });
    var parentRelationships = activeRelationships().filter(function isParent(relationshipItem) {
      return isParentRelationshipType(relationshipItem.type);
    });
    var directRelationships = activeRelationships().filter(function isDirect(relationshipItem) {
      return isDirectRelationshipType(relationshipItem.type) && !isParentRelationshipType(relationshipItem.type) && !isPartnerRelationshipType(relationshipItem.type);
    });

    partnerRelationships.forEach(function drawPartner(relationshipItem) {
      if (!visibleIds.has(relationshipItem.from) || !visibleIds.has(relationshipItem.to)) return;
      var from = byId(relationshipItem.from);
      var to = byId(relationshipItem.to);
      if (!from || !to) return;
      var fromX = from.x < to.x ? from.x + TREE_NODE_HALF_X : from.x - TREE_NODE_HALF_X;
      var toX = from.x < to.x ? to.x - TREE_NODE_HALF_X : to.x + TREE_NODE_HALF_X;
      var midX = Math.round((fromX + toX) / 2);
      drawPath("M" + fromX + " " + from.y + " H" + midX + " V" + to.y + " H" + toX, relationshipItem, pathPairs, true);
    });

    (layout && layout.familyGroups ? layout.familyGroups : []).forEach(function drawFamilyGroup(group) {
      var parents = group.parentIds.map(byId).filter(function visibleParent(person) {
        return person && visibleIds.has(person.id);
      });
      var children = group.childIds.map(byId).filter(function visibleChild(person) {
        return person && visibleIds.has(person.id);
      });
      if (!parents.length || !children.length) return;
      var parentCenterX = Math.round(average(parents.map(function xOf(person) { return person.x; })));
      var parentLineY = Math.round(average(parents.map(function yOf(person) { return person.y; })));
      var parentBottomY = Math.max.apply(null, parents.map(function bottom(person) {
        return person.y + TREE_NODE_HALF_Y;
      }));
      var childTopY = Math.min.apply(null, children.map(function top(person) {
        return person.y - TREE_NODE_HALF_Y;
      }));
      var branchY = Math.round(parentBottomY + Math.max(60, (childTopY - parentBottomY) * 0.42));
      var minChildX = Math.min.apply(null, children.map(function xOf(person) { return person.x; }));
      var maxChildX = Math.max.apply(null, children.map(function xOf(person) { return person.x; }));
      var familyPath = "M" + parentCenterX + " " + parentLineY + " V" + branchY;
      if (children.length > 1) {
        familyPath += " M" + minChildX + " " + branchY + " H" + maxChildX;
      }
      children.forEach(function childLine(child) {
        familyPath += " M" + child.x + " " + branchY + " V" + (child.y - TREE_NODE_HALF_Y);
      });
      drawPath(familyPath, { from: parents[0].id, to: children[0].id }, pathPairs, false, "family");
    });

    directRelationships.forEach(function drawDirect(relationshipItem) {
      if (!visibleIds.has(relationshipItem.from) || !visibleIds.has(relationshipItem.to)) return;
      var from = byId(relationshipItem.from);
      var to = byId(relationshipItem.to);
      if (!from || !to) return;
      var fromX = from.x < to.x ? from.x + TREE_NODE_HALF_X : from.x - TREE_NODE_HALF_X;
      var toX = from.x < to.x ? to.x - TREE_NODE_HALF_X : to.x + TREE_NODE_HALF_X;
      var midX = Math.round((fromX + toX) / 2);
      drawPath("M" + fromX + " " + from.y + " H" + midX + " V" + to.y + " H" + toX, relationshipItem, pathPairs, false, "direct");
    });
  }

  function renderTimelineGuides(peopleToRender) {
    if (!state.showDates) return;
    var axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", TIMELINE_AXIS_X);
    axis.setAttribute("x2", TIMELINE_AXIS_X);
    axis.setAttribute("y1", TIMELINE_TOP_Y - 32);
    axis.setAttribute("y2", TIMELINE_BOTTOM_Y + 18);
    axis.setAttribute("class", "timeline-guide-axis");
    els.relationshipLines.appendChild(axis);

    TIMELINE_TICKS.forEach(function drawTick(year) {
      var y = Math.round(timelineYForYear(year));
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", TIMELINE_AXIS_X);
      line.setAttribute("x2", TREE_WORLD_WIDTH - 120);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("class", "timeline-guide-line");
      els.relationshipLines.appendChild(line);

      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", TIMELINE_AXIS_X);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 5);
      dot.setAttribute("class", "timeline-guide-dot");
      els.relationshipLines.appendChild(dot);

      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", TIMELINE_AXIS_X - 16);
      label.setAttribute("y", y + 5);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("class", "timeline-guide-label");
      label.textContent = year;
      els.relationshipLines.appendChild(label);
    });

    void peopleToRender;
  }

  function drawPath(d, relationshipItem, pathPairs, isPartner, extraClass) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    var className = "relationship-line";
    if (isPartner) className += " partner";
    if (extraClass) className += " " + extraClass;
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
    var editActions = state.editMode ? [
      "<div class=\"profile-actions\">",
      "<button class=\"button primary\" type=\"button\" data-open-add-info data-tooltip=\"Add or change the basics: name, birth details, gender and photo.\">Fill in details</button>",
      "<button class=\"button\" type=\"button\" data-open-relative data-tooltip=\"Add a parent, sibling, child, cousin, partner or another family member.\">Add relative</button>",
      "<button class=\"button\" type=\"button\" data-open-relative data-default-connection=\"partner\" data-tooltip=\"Add this person's husband, wife or partner.\">Add partner</button>",
      person.id !== CURRENT_USER_ID ? "<button class=\"button\" type=\"button\" data-soft-delete data-tooltip=\"Remove this profile from the tree. You can restore it later.\">Remove profile</button>" : "",
      "</div>"
    ].join("") : "";

    els.profilePanel.innerHTML = [
      "<div class=\"profile-hero " + (state.editMode ? "photo-drop-target " : "") + genderClass(person) + (hasPersonPhoto(person) ? "" : " missing") + "\"" + (state.editMode ? " data-photo-drop-person-id=\"" + escapeHTML(person.id) + "\"" : "") + ">",
      profilePhotoMarkup(person),
      "<div class=\"profile-title\">",
      "<p>" + escapeHTML(person.roleHint || years(person) || relation.label) + "</p>",
      "<h2>" + escapeHTML(primaryName(person)) + "</h2>",
      "<p>" + escapeHTML(relation.sentence) + "</p>",
      "</div>",
      state.editMode ? "<span class=\"profile-photo-hint\">Drop photo</span>" : "",
      "</div>",
      "<div class=\"profile-body\">",
      profileNotice(person),
      editActions,
      namesSection(person),
      birthSection(person),
      familySection(person),
      "</div>"
    ].join("");
    bindProfileActionButtons();
  }

  function bindProfileActionButtons() {
    var addInfoButton = els.profilePanel.querySelector("[data-open-add-info]");
    if (addInfoButton) {
      addInfoButton.addEventListener("click", function openInfo(event) {
        event.preventDefault();
        event.stopPropagation();
        openAddInfoDialog();
      });
    }

    els.profilePanel.querySelectorAll("[data-open-relative]").forEach(function bindRelative(button) {
      button.addEventListener("click", function openRelative(event) {
        event.preventDefault();
        event.stopPropagation();
        openRelativeDialog(button.dataset.defaultConnection);
      });
    });

    var deleteButton = els.profilePanel.querySelector("[data-soft-delete]");
    if (deleteButton) {
      deleteButton.addEventListener("click", function deleteProfile(event) {
        event.preventDefault();
        event.stopPropagation();
        softDeleteSelectedPerson();
      });
    }
  }

  function profileNotice(person) {
    if (!state.editMode) return "";
    if (person.id === CURRENT_USER_ID) {
      return "<div class=\"claim-box\"><strong>Your starting point</strong><span>Fill in your own name first, then work upward to parents and older relatives.</span></div>";
    }
    return "<div class=\"claim-box\"><strong>Open to fill in</strong><span>Anyone with this page can add simple details or drop in a family photo.</span></div>";
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

  function birthSection(person) {
    var born = birthSummary(person);
    var place = String(person.birthPlace || "").trim();
    if (!born && !place) return "";
    return [
      "<section class=\"section-block birth-section\">",
      "<h3>Birth</h3>",
      "<div class=\"field-list\">",
      born ? [
        "<article class=\"field-row birth-field-row\">",
        "<div>",
        "<strong>" + (person.birthDate ? "Date of birth" : "Birth year") + "</strong>",
        "<p>" + escapeHTML(born) + "</p>",
        "</div>",
        "</article>"
      ].join("") : "",
      place ? [
        "<article class=\"field-row birth-field-row\">",
        "<div>",
        "<strong>Place of birth</strong>",
        "<p>" + escapeHTML(place) + "</p>",
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
    var parents = sortOldestFirst((currentGraph.parentsByChild.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean));
    var partners = sortOldestFirst((currentGraph.partnersByPerson.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean));
    var children = sortOldestFirst((currentGraph.childrenByParent.get(person.id) || []).map(function toPerson(item) {
      return byId(item.id);
    }).filter(Boolean));
    var siblings = sortOldestFirst(people.filter(function findSibling(candidate) {
      return candidate.id !== person.id && candidate.status !== "deleted" && siblingInfo(person.id, candidate.id, currentGraph);
    }));
    var cousins = directFamilyPeople(person.id, "direct_cousin");
    var auntUncles = directFamilyPeople(person.id, "direct_aunt_uncle").filter(function fromOtherSide(item) {
      return item.relationship.from === item.person.id;
    }).map(function toPerson(item) { return item.person; });
    var niecesNephews = directFamilyPeople(person.id, "direct_aunt_uncle").filter(function fromThisSide(item) {
      return item.relationship.to === item.person.id;
    }).map(function toPerson(item) { return item.person; });
    var grandparents = directFamilyPeople(person.id, "direct_grandparent").filter(function fromOtherSide(item) {
      return item.relationship.from === item.person.id;
    }).map(function toPerson(item) { return item.person; }).concat(
      directFamilyPeople(person.id, "direct_grandchild").filter(function fromThisSide(item) {
        return item.relationship.to === item.person.id;
      }).map(function toPerson(item) { return item.person; })
    );
    var grandchildren = directFamilyPeople(person.id, "direct_grandparent").filter(function fromThisSide(item) {
      return item.relationship.to === item.person.id;
    }).map(function toPerson(item) { return item.person; }).concat(
      directFamilyPeople(person.id, "direct_grandchild").filter(function fromOtherSide(item) {
        return item.relationship.from === item.person.id;
      }).map(function toPerson(item) { return item.person; })
    );
    var otherFamily = directFamilyPeople(person.id, "direct_family_link").map(function toPerson(item) {
      return item.person;
    });
    var groups = [
      ["Parents", parents],
      ["Grandparents", sortOldestFirst(grandparents)],
      ["Partners", partners],
      ["Children", children],
      ["Grandchildren", sortOldestFirst(grandchildren)],
      ["Siblings", siblings],
      ["Aunts and uncles", sortOldestFirst(auntUncles)],
      ["Nieces and nephews", sortOldestFirst(niecesNephews)],
      ["Cousins", sortOldestFirst(cousins.map(function toPerson(item) { return item.person; }))],
      ["Other family", sortOldestFirst(otherFamily)]
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
    var explicit = (currentGraph.explicitSiblings.get(personAId) || []).some(function isMatch(sibling) {
      return sibling.id === personBId;
    });
    var aParents = currentGraph.parentsByChild.get(personAId) || [];
    var bParents = currentGraph.parentsByChild.get(personBId) || [];
    var bParentIds = new Set(bParents.map(function toId(parentRef) { return parentRef.id; }));
    var shared = aParents.filter(function findShared(parentRef) {
      return bParentIds.has(parentRef.id);
    });
    return explicit || shared.length > 0;
  }

  function directFamilyPeople(personId, type) {
    return activeRelationships().filter(function keep(relationshipItem) {
      return relationshipItem.type === type && (relationshipItem.from === personId || relationshipItem.to === personId);
    }).map(function toOther(relationshipItem) {
      var otherId = relationshipItem.from === personId ? relationshipItem.to : relationshipItem.from;
      return {
        relationship: relationshipItem,
        person: byId(otherId)
      };
    }).filter(function visible(item) {
      return item.person && item.person.status !== "deleted";
    });
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
    if (!hasPersonPhoto(person)) {
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
    var imageSrc = personPhotoData(person) || "assets/family-gallery.png";
    var items = captions.slice(0, person.id === CURRENT_USER_ID ? 3 : 2).map(function render(caption, index) {
      return [
        "<article class=\"memory-card\">",
        "<img src=\"" + escapeHTML(imageSrc) + "\" alt=\"" + escapeHTML(caption + " for " + primaryName(person)) + "\">",
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
    if (!els.exploreContent) return;
    els.exploreContent.innerHTML = [
      "<div class=\"start-steps\">",
      "<div><strong>1</strong><span>Tap You and add your real name.</span></div>",
      "<div><strong>2</strong><span>Add birth date, birthplace or a photo if you know it.</span></div>",
      "<div><strong>3</strong><span>Tap each Parent, then add partners, siblings and older relatives one at a time.</span></div>",
      "<div><strong>4</strong><span>Save, then share a link with someone who knows more.</span></div>",
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
      "<li><strong>Auto-saves daily</strong><span>One restore point is kept for each day you use this tree on this device.</span><time>Simple safety net</time></li>",
      "<li><strong>Anyone can help</strong><span>Share the page with family and let them add names, dates, places and photos.</span><time>Simple shared page</time></li>"
    ].join("");

    if (els.dailySaveList) {
      var snapshots = readDailySnapshots();
      els.dailySaveList.innerHTML = snapshots.length ? snapshots.map(function renderSnapshot(item) {
        return [
          "<article class=\"daily-save-card\">",
          "<div>",
          "<strong>" + escapeHTML(item.label || dailySaveLabel(item.date)) + "</strong>",
          "<small>Updated " + escapeHTML(item.updatedAt || "today") + "</small>",
          "</div>",
          "<button class=\"button compact\" type=\"button\" data-restore-snapshot=\"" + escapeHTML(item.date) + "\">Restore</button>",
          "</article>"
        ].join("");
      }).join("") : "<p class=\"muted\">A daily save will appear after your first edit.</p>";
    }

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
    if (!els.accessRequests) return;
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
      if (String(person.birthPlace || "").toLowerCase().includes(value)) return true;
      if (birthSummary(person).toLowerCase().includes(value) || years(person).toLowerCase().includes(value)) return true;
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
    if (String(person.birthPlace || "").toLowerCase().includes(query)) return "Born in " + person.birthPlace;
    if (birthSummary(person).toLowerCase().includes(query) || years(person).toLowerCase().includes(query)) return "Born " + birthSummary(person);
    if (String(person.middleNames || "").trim()) return "Middle names: " + person.middleNames;
    return years(person) || "Family member";
  }

  function centerOnPerson(personId) {
    var person = byId(personId);
    if (!person) return;
    var rect = els.mapShell.getBoundingClientRect();
    state.zoom = Math.max(state.zoom, rect.width < 740 ? 0.62 : 0.72);
    state.panX = rect.width / 2 - person.x * state.zoom;
    state.panY = rect.height / 2 - person.y * state.zoom;
    renderMap();
  }

  function fitFamilyOverview() {
    var active = visiblePeople();
    if (!active.length) return;
    var rect = els.mapShell.getBoundingClientRect();
    var leftReserve = rect.width < 740 ? 28 : 42;
    var rightReserve = rect.width < 740 ? 28 : 42;
    var topReserve = rect.width < 740 ? 42 : 52;
    var bottomReserve = rect.width < 740 ? 42 : 52;
    var nodePadX = TREE_NODE_HALF_X + 28;
    var nodePadY = TREE_NODE_HALF_Y + 28;
    var minX = Math.min.apply(null, active.map(function min(person) { return person.x - nodePadX; }));
    var maxX = Math.max.apply(null, active.map(function max(person) { return person.x + nodePadX; }));
    var minY = Math.min.apply(null, active.map(function min(person) { return person.y - nodePadY; }));
    var maxY = Math.max.apply(null, active.map(function max(person) { return person.y + nodePadY; }));
    var worldWidth = Math.max(1, maxX - minX);
    var worldHeight = Math.max(1, maxY - minY);
    var availableWidth = Math.max(240, rect.width - leftReserve - rightReserve);
    var availableHeight = Math.max(260, rect.height - topReserve - bottomReserve);
    state.zoom = Math.max(0.25, Math.min(1.1, availableWidth / worldWidth, availableHeight / worldHeight));
    state.panX = leftReserve + (availableWidth - worldWidth * state.zoom) / 2 - minX * state.zoom;
    state.panY = topReserve + (availableHeight - worldHeight * state.zoom) / 2 - minY * state.zoom;
    renderMap();
  }

  function clampPan() {
    var active = visiblePeople();
    if (!active.length) return;
    var rect = els.mapShell.getBoundingClientRect();
    var pad = rect.width < 740 ? 160 : 260;
    var minX = Math.min.apply(null, active.map(function min(person) { return person.x - TREE_NODE_HALF_X; })) - pad;
    var maxX = Math.max.apply(null, active.map(function max(person) { return person.x + TREE_NODE_HALF_X; })) + pad;
    var minY = Math.min.apply(null, active.map(function min(person) { return person.y - TREE_NODE_HALF_Y; })) - pad;
    var maxY = Math.max.apply(null, active.map(function max(person) { return person.y + TREE_NODE_HALF_Y; })) + pad;
    var minPanX = rect.width - maxX * state.zoom;
    var maxPanX = -minX * state.zoom;
    var minPanY = rect.height - maxY * state.zoom;
    var maxPanY = -minY * state.zoom;
    if (minPanX > maxPanX) {
      state.panX = (minPanX + maxPanX) / 2;
    } else {
      state.panX = Math.max(minPanX, Math.min(maxPanX, state.panX));
    }
    if (minPanY > maxPanY) {
      state.panY = (minPanY + maxPanY) / 2;
    } else {
      state.panY = Math.max(minPanY, Math.min(maxPanY, state.panY));
    }
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
    var bounded = Math.max(0.25, Math.min(1.8, nextZoom));
    if (bounded === previousZoom) return;
    var rect = els.mapShell.getBoundingClientRect();
    var pointX = originX == null ? rect.width / 2 : originX;
    var pointY = originY == null ? rect.height / 2 : originY;
    var worldX = (pointX - state.panX) / previousZoom;
    var worldY = (pointY - state.panY) / previousZoom;
    state.zoom = bounded;
    state.panX = pointX - worldX * bounded;
    state.panY = pointY - worldY * bounded;
    clampPan();
    renderMap();
  }

  function resetPhotoDraft(person) {
    photoDraft = emptyPhotoDraft();
    photoDraft.dataUrl = personPhotoData(person);
    photoDraft.remove = false;
    if (els.profilePhotoInput) els.profilePhotoInput.value = "";
    if (photoDraft.dataUrl) {
      loadPhotoDraftImage(photoDraft.dataUrl).catch(function failPhotoPreview(error) {
        console.warn("Unable to preview saved photo.", error);
        photoDraft = emptyPhotoDraft();
        renderPhotoDraftPreview();
      });
    } else {
      renderPhotoDraftPreview();
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function read(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function loaded() {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function failed() {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise(function load(resolve, reject) {
      var image = new Image();
      image.onload = function loaded() {
        resolve(image);
      };
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  async function loadPhotoDraftImage(dataUrl) {
    photoDraft.image = await loadImage(dataUrl);
    renderPhotoDraftPreview();
  }

  async function handlePhotoFileChange(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type || file.type.indexOf("image/") !== 0) {
      window.alert("Please choose an image file.");
      return;
    }
    try {
      photoDraft = emptyPhotoDraft();
      photoDraft.dataUrl = await readFileAsDataUrl(file);
      photoDraft.changed = true;
      await loadPhotoDraftImage(photoDraft.dataUrl);
    } catch (error) {
      console.warn("Unable to read photo.", error);
      window.alert("This photo could not be opened.");
    }
  }

  function updatePhotoDraftFromControls() {
    photoDraft.zoom = Number(els.photoZoom.value) || 1;
    photoDraft.x = Number(els.photoX.value) || 0;
    photoDraft.y = Number(els.photoY.value) || 0;
    photoDraft.changed = Boolean(photoDraft.dataUrl);
    renderPhotoDraftPreview();
  }

  function removePhotoDraft() {
    photoDraft = emptyPhotoDraft();
    photoDraft.changed = true;
    photoDraft.remove = true;
    if (els.profilePhotoInput) els.profilePhotoInput.value = "";
    renderPhotoDraftPreview();
  }

  function renderPhotoDraftPreview() {
    if (!els.photoCropper || !els.photoPreviewCanvas) return;
    var hasDraftPhoto = Boolean(photoDraft.dataUrl && photoDraft.image);
    els.photoCropper.hidden = !hasDraftPhoto;
    if (els.photoZoom) els.photoZoom.value = String(photoDraft.zoom);
    if (els.photoX) els.photoX.value = String(photoDraft.x);
    if (els.photoY) els.photoY.value = String(photoDraft.y);
    if (!hasDraftPhoto) return;
    drawPhotoCrop(els.photoPreviewCanvas, photoDraft.image);
  }

  function drawPhotoCrop(canvas, image) {
    var size = canvas.width || 640;
    var context = canvas.getContext("2d");
    var zoom = Math.max(1, Math.min(2.6, Number(photoDraft.zoom) || 1));
    var scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
    var width = image.naturalWidth * scale;
    var height = image.naturalHeight * scale;
    var x = (size - width) / 2 + (Number(photoDraft.x) || 0) * size / 100;
    var y = (size - height) / 2 + (Number(photoDraft.y) || 0) * size / 100;
    context.fillStyle = "#f1f4f8";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, x, y, width, height);
    photoDraft.croppedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  }

  async function preparePhotoUpdate() {
    if (!photoDraft.changed) return { changed: false };
    if (photoDraft.remove) return { changed: true, remove: true, dataUrl: "" };
    if (!photoDraft.dataUrl) return { changed: false };
    if (!photoDraft.image) {
      photoDraft.image = await loadImage(photoDraft.dataUrl);
    }
    if (!photoDraft.croppedDataUrl && els.photoPreviewCanvas) {
      drawPhotoCrop(els.photoPreviewCanvas, photoDraft.image);
    }
    return {
      changed: true,
      remove: false,
      dataUrl: photoDraft.croppedDataUrl || photoDraft.dataUrl
    };
  }

  function squarePhotoDataUrl(image) {
    var size = 640;
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
    var sourceX = ((image.naturalWidth || image.width) - sourceSize) / 2;
    var sourceY = ((image.naturalHeight || image.height) - sourceSize) / 2;
    canvas.width = size;
    canvas.height = size;
    context.fillStyle = "#f1f4f8";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.84);
  }

  function imageFileFromDrop(event) {
    var files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
    return files.find(function findImage(file) {
      return file && file.type && file.type.indexOf("image/") === 0;
    });
  }

  function clearPhotoDropTargets() {
    document.querySelectorAll(".is-photo-dragging").forEach(function clear(element) {
      element.classList.remove("is-photo-dragging");
    });
  }

  async function applyDroppedPhoto(personId, file) {
    var person = byId(personId);
    if (!person || !file) return;
    try {
      var dataUrl = await readFileAsDataUrl(file);
      var image = await loadImage(dataUrl);
      var croppedDataUrl = squarePhotoDataUrl(image);
      withUndo("Photo added", function addDroppedPhoto() {
        person.photoData = croppedDataUrl;
        person.photo = null;
        person.placeholder = false;
        state.selectedPersonId = person.id;
        addActivity(CURRENT_USER_ID, "added a photo for " + primaryName(person));
      });
    } catch (error) {
      console.warn("Unable to drop photo.", error);
      window.alert("This photo could not be opened.");
    }
  }

  function openAddInfoDialog() {
    var person = byId(state.selectedPersonId);
    els.addInfoForm.reset();
    if (person) {
      seedNameParts(person);
      els.addInfoForm.elements.firstName.value = person.firstName || "";
      els.addInfoForm.elements.middleNames.value = person.middleNames || "";
      els.addInfoForm.elements.lastName.value = person.lastName || "";
      els.addInfoForm.elements.birthDate.value = normalizeDateInput(person.birthDate);
      els.addInfoForm.elements.birthYear.value = person.birthYear || "";
      els.addInfoForm.elements.birthPlace.value = person.birthPlace || "";
      els.addInfoForm.elements.gender.value = person.gender || "unknown";
    }
    resetPhotoDraft(person);
    els.addInfoDialog.showModal();
  }

  async function submitAddInfo(event) {
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
    var birthDate = normalizeDateInput(form.get("birthDate"));
    var birthYear = birthDate ? yearFromDate(birthDate) : Number(form.get("birthYear")) || null;
    var birthPlace = String(form.get("birthPlace") || "").trim();
    var gender = String(form.get("gender") || "unknown");
    var photoUpdate = await preparePhotoUpdate();
    var hasBasics = person && Boolean(
      firstName !== String(person.firstName || "").trim() ||
      middleNames !== String(person.middleNames || "").trim() ||
      lastName !== String(person.lastName || "").trim() ||
      birthDate !== normalizeDateInput(person.birthDate) ||
      birthYear !== (person.birthYear || null) ||
      birthPlace !== String(person.birthPlace || "").trim() ||
      gender !== (person.gender || "unknown")
    );
    var hasPhotoUpdate = person && photoUpdate.changed;
    if (!person || (!hasBasics && !hasPhotoUpdate)) return;
    els.addInfoDialog.close();

    withUndo("Saved", function addInfo() {
      if (hasBasics) {
        person.firstName = firstName;
        person.middleNames = middleNames;
        person.lastName = lastName;
        person.birthDate = birthDate;
        person.birthYear = birthYear;
        person.birthPlace = birthPlace;
        person.gender = gender;
        person.name = primaryName(person);
        if (firstName || lastName) person.placeholder = false;
        addActivity(CURRENT_USER_ID, "updated basics for " + primaryName(person));
      }

      if (hasPhotoUpdate) {
        if (photoUpdate.remove) {
          person.photoData = "";
          person.photo = null;
        } else {
          person.photoData = photoUpdate.dataUrl;
          person.photo = null;
          person.placeholder = false;
        }
        addActivity(CURRENT_USER_ID, "updated photo for " + primaryName(person));
      }
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
    if (!els.suggestDialog || !els.suggestForm || !els.suggestCurrent) return;
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
    if (!els.suggestDialog || !els.suggestForm) return;
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
    var base = byId(state.selectedPersonId) || byId(CURRENT_USER_ID);
    els.relativeForm.reset();
    if (defaultConnection) {
      els.relativeForm.elements.connection.value = defaultConnection;
    }
    if (els.relativeConnectionLabel) {
      els.relativeConnectionLabel.textContent = "Who are they to " + primaryName(base) + "?";
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
    var firstName = String(form.get("firstName") || "").trim();
    var middleNames = String(form.get("middleNames") || "").trim();
    var lastName = String(form.get("lastName") || "").trim();
    var name = [firstName, lastName].filter(Boolean).join(" ") || firstName || middleNames;
    var birthDate = normalizeDateInput(form.get("birthDate"));
    var birthYear = birthDate ? yearFromDate(birthDate) : Number(form.get("birthYear")) || null;
    var birthPlace = String(form.get("birthPlace") || "").trim();
    var gender = String(form.get("gender") || "unknown");
    var connection = String(form.get("connection") || "child");
    var base = byId(state.selectedPersonId) || byId(CURRENT_USER_ID);
    var coParentId = chooseCoParentForChild(base, connection);
    if (coParentId === false) return;
    if (!confirmSiblingParents(base, connection)) return;
    if (!firstName) return;
    els.relativeDialog.close();

    withUndo("Person added", function addPerson() {
      var id = newId("person");
      people.push({
        id: id,
        name: name,
        firstName: firstName,
        middleNames: middleNames,
        lastName: lastName,
        birthDate: birthDate,
        birthYear: birthYear,
        birthPlace: birthPlace,
        deathYear: null,
        photoData: "",
        gender: gender,
        claimedBy: null,
        stewardId: CURRENT_USER_ID,
        x: base.x + (connection === "partner" || connection === "sibling" || connection === "cousin" || connection === "aunt_uncle" || connection === "family_link" ? 260 : 0),
        y: base.y + (connection === "child" || connection === "grandchild" ? 300 : connection === "parent" || connection === "grandparent" ? -300 : 0),
        placeholder: true,
        roleHint: connectionLabel(connection),
        partnerPrompt: "Add husband, wife or partner"
      });
      if (!connectPeople(id, base.id, connection, { coParentId: coParentId })) {
        people = people.filter(function removeFailed(person) {
          return person.id !== id;
        });
        return;
      }
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
      if (!connectPeople(existingId, base.id, connection, {})) return;
      addActivity(CURRENT_USER_ID, "connected " + personName(existingId) + " to " + primaryName(base));
      state.selectedPersonId = existingId;
    });
  }

  function chooseCoParentForChild(base, connection) {
    if (!base || connection !== "child") return null;
    var partners = (graph().partnersByPerson.get(base.id) || []).map(function toPerson(partnerRef) {
      return byId(partnerRef.id);
    }).filter(Boolean);
    if (!partners.length) return null;
    if (partners.length === 1) return partners[0].id;
    var options = partners.map(function option(person, index) {
      return (index + 1) + ". " + primaryName(person);
    }).concat((partners.length + 1) + ". Unknown / other parent");
    var answer = window.prompt("Child with which partner?\n" + options.join("\n"), "1");
    if (answer == null) return false;
    var choice = Number(answer);
    if (!Number.isFinite(choice) || choice < 1 || choice > partners.length + 1) {
      window.alert("Choose one of the listed numbers.");
      return false;
    }
    return choice <= partners.length ? partners[choice - 1].id : null;
  }

  function confirmSiblingParents(base, connection) {
    if (!base || connection !== "sibling") return true;
    var parents = graph().parentsByChild.get(base.id) || [];
    if (parents.length < 2) return true;
    var names = parents.map(function toName(parentRef) {
      return personName(parentRef.id);
    }).join(" and ");
    return window.confirm("Should this sibling share both known parents with " + primaryName(base) + "?\n\nKnown parents: " + names);
  }

  function connectPeople(subjectId, baseId, connection, options) {
    var settings = options || {};
    var planned = [];
    if (connection === "child") {
      planned.push({ from: baseId, to: subjectId, type: "biological_parent" });
      if (settings.coParentId) planned.push({ from: settings.coParentId, to: subjectId, type: "biological_parent" });
    }
    if (connection === "parent") planned.push({ from: subjectId, to: baseId, type: "biological_parent" });
    if (connection === "partner") planned.push({ from: subjectId, to: baseId, type: "partner" });
    if (connection === "cousin") planned.push({ from: subjectId, to: baseId, type: "direct_cousin" });
    if (connection === "aunt_uncle") planned.push({ from: subjectId, to: baseId, type: "direct_aunt_uncle" });
    if (connection === "grandparent") planned.push({ from: subjectId, to: baseId, type: "direct_grandparent" });
    if (connection === "grandchild") planned.push({ from: subjectId, to: baseId, type: "direct_grandchild" });
    if (connection === "family_link") planned.push({ from: subjectId, to: baseId, type: "direct_family_link" });
    if (connection === "sibling") {
      var parents = graph().parentsByChild.get(baseId) || [];
      if (parents.length) {
        parents.forEach(function connectParent(parentRef) {
          planned.push({ from: parentRef.id, to: subjectId, type: parentRef.type || "biological_parent" });
        });
      } else {
        planned.push({ from: subjectId, to: baseId, type: "sibling" });
      }
    }
    return pushRelationshipPlan(planned);
  }

  function pushRelationshipPlan(planned) {
    var staged = relationships.slice();
    for (var index = 0; index < planned.length; index += 1) {
      var candidate = planned[index];
      var validation = window.RelationshipEngine.validateRelationshipAddition(people, staged, candidate);
      if (!validation.valid) {
        window.alert(validation.message);
        return false;
      }
      var item = relationship(candidate.from, candidate.to, candidate.type);
      staged.push(item);
      relationships.push(item);
    }
    return true;
  }

  function connectionLabel(connection) {
    if (connection === "child") return "Child";
    if (connection === "parent") return "Parent";
    if (connection === "partner") return "Partner";
    if (connection === "sibling") return "Sibling";
    if (connection === "cousin") return "Cousin";
    if (connection === "aunt_uncle") return "Aunt or uncle";
    if (connection === "grandparent") return "Grandparent";
    if (connection === "grandchild") return "Grandchild";
    if (connection === "family_link") return "Family";
    return "Family member";
  }

  function genderClass(person) {
    if (!person) return "gender-neutral";
    if (person.gender === "male") return "gender-male";
    if (person.gender === "female") return "gender-female";
    return "gender-neutral";
  }

  function frameClass(person) {
    var finishes = ["frame-walnut", "frame-oak", "frame-brass", "frame-ivory", "frame-charcoal"];
    var text = String(person && person.id || "");
    var score = text.split("").reduce(function sum(total, character) {
      return total + character.charCodeAt(0);
    }, 0);
    return finishes[score % finishes.length];
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
    var name = [
      String(form.get("firstName") || "").trim(),
      String(form.get("lastName") || "").trim()
    ].filter(Boolean).join(" ");
    var birthDate = normalizeDateInput(form.get("birthDate"));
    var birthYear = birthDate ? yearFromDate(birthDate) : Number(form.get("birthYear")) || null;
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
      var personYear = birthYearValue(person);
      var yearClose = birthYear && personYear && Math.abs(personYear - birthYear) <= 3;
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
    if (!els.inviteForm) return;
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

  function saveNow() {
    persist();
    showToast("Saved on this device", false);
  }

  function buildShareLink() {
    var url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("person", state.selectedPersonId || CURRENT_USER_ID);
    return url.toString();
  }

  async function shareCurrentView() {
    var url = buildShareLink();
    var shareText = "Open this Family Tree profile and help fill in names, dates, places or photos.";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Family Tree",
          text: shareText,
          url: url
        });
        showToast("Share link ready", false);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    copyShareLink(url);
  }

  function copyShareLink(url) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function copied() {
        showToast("Share link copied", false);
      }).catch(function fallbackCopy() {
        promptForShareLink(url);
      });
      return;
    }
    promptForShareLink(url);
  }

  function promptForShareLink(url) {
    window.prompt("Copy this share link", url);
    showToast("Share link ready to copy", false);
  }

  function applyIncomingShareLink() {
    var params = new URLSearchParams(window.location.search);
    var personId = params.get("person");
    if (personId && byId(personId)) {
      state.selectedPersonId = personId;
      state.relationshipA = personId;
    }
  }

  function newId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return prefix + "-" + window.crypto.randomUUID();
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function closeFloatingSurfaces() {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = "";
    if (els.addInfoDialog.open) els.addInfoDialog.close();
    if (els.suggestDialog && els.suggestDialog.open) els.suggestDialog.close();
    if (els.relativeDialog.open) els.relativeDialog.close();
    if (els.accessDialog && els.accessDialog.open) els.accessDialog.close();
  }

  function clearDemoHighlight() {
    document.querySelectorAll(".demo-highlight").forEach(function removeHighlight(element) {
      element.classList.remove("demo-highlight");
    });
  }

  function startDemo() {
    if (els.privateGate) els.privateGate.hidden = true;
    els.approvedApp.hidden = false;
    state.moreOpen = false;
    state.editMode = false;
    renderAll();
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

  function photoDropTarget(event) {
    return event.target && event.target.closest
      ? event.target.closest("[data-photo-drop-person-id]")
      : null;
  }

  function handlePhotoDragOver(event) {
    var target = photoDropTarget(event);
    if (!target || !event.dataTransfer || !Array.from(event.dataTransfer.types || []).includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    clearPhotoDropTargets();
    target.classList.add("is-photo-dragging");
  }

  function handlePhotoDragLeave(event) {
    var target = photoDropTarget(event);
    if (!target) return;
    if (event.relatedTarget && target.contains(event.relatedTarget)) return;
    target.classList.remove("is-photo-dragging");
  }

  async function handlePhotoDrop(event) {
    var target = photoDropTarget(event);
    if (!target) return;
    event.preventDefault();
    clearPhotoDropTargets();
    var file = imageFileFromDrop(event);
    if (!file) {
      window.alert("Drop an image file onto the profile.");
      return;
    }
    await applyDroppedPhoto(target.dataset.photoDropPersonId, file);
  }

  function bindEvents() {
    document.getElementById("demoButton").addEventListener("click", startDemo);
    els.demoNextButton.addEventListener("click", nextDemoStep);
    els.demoEndButton.addEventListener("click", endDemo);
    els.saveButton.addEventListener("click", saveNow);
    els.shareButton.addEventListener("click", shareCurrentView);

    els.editModeButton.addEventListener("click", function toggleEditMode() {
      endDemo();
      state.editMode = !state.editMode;
      renderAll();
    });

    els.moreButton.addEventListener("click", function toggleMore() {
      state.moreOpen = !state.moreOpen;
      renderAll();
    });

    els.fitTreeButton.addEventListener("click", function fitTree() {
      fitFamilyOverview();
    });

    els.datesToggleButton.addEventListener("click", function toggleDates() {
      state.showDates = !state.showDates;
      persist();
      renderMap();
      renderAll();
    });

    document.getElementById("recenterButton").addEventListener("click", function goMe() {
      endDemo();
      state.selectedPersonId = CURRENT_USER_ID;
      state.collapsedBranches = false;
      highlightImmediateFamily(CURRENT_USER_ID);
      centerOnPerson(CURRENT_USER_ID);
      renderProfile();
    });

    document.getElementById("connectionsButton").addEventListener("click", function showConnections() {
      endDemo();
      state.moreOpen = true;
      if (els.lowerGrid) els.lowerGrid.hidden = false;
      els.connectionsPanel.classList.remove("connections-panel-collapsed");
      state.relationshipA = "sibling";
      state.relationshipB = CURRENT_USER_ID;
      state.collapsedBranches = false;
      renderAll();
      fitFamilyOverview();
    });

    document.getElementById("closeConnectionsButton").addEventListener("click", function closeConnections() {
      els.connectionsPanel.classList.add("connections-panel-collapsed");
      if (els.lowerGrid && !state.moreOpen) els.lowerGrid.hidden = true;
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

    var privateLandingButton = document.getElementById("privateLandingButton");
    if (privateLandingButton) {
      privateLandingButton.addEventListener("click", function showGate() {
        endDemo();
        els.approvedApp.hidden = true;
        if (els.privateGate) els.privateGate.hidden = false;
      });
    }
    var approvedPreviewButton = document.getElementById("approvedPreviewButton");
    if (approvedPreviewButton) {
      approvedPreviewButton.addEventListener("click", function showApproved() {
        if (els.privateGate) els.privateGate.hidden = true;
        els.approvedApp.hidden = false;
      });
    }
    var accessButton = document.getElementById("accessButton");
    if (accessButton) {
      accessButton.addEventListener("click", function showAccess() {
        endDemo();
        if (els.accessDialog) els.accessDialog.showModal();
      });
    }
    var closeAccessButton = document.getElementById("closeAccessButton");
    if (closeAccessButton) {
      closeAccessButton.addEventListener("click", function closeAccess() {
        if (els.accessDialog) els.accessDialog.close();
      });
    }

    document.getElementById("removedButton").addEventListener("click", function toggleRemoved() {
      els.removedList.hidden = !els.removedList.hidden;
    });

    document.querySelectorAll("dialog button[value='cancel']").forEach(function bindDialogClose(button) {
      button.addEventListener("click", function closeDialog(event) {
        var dialog = button.closest("dialog");
        if (!dialog || !dialog.open) return;
        event.preventDefault();
        dialog.close();
      });
    });

    els.addInfoForm.addEventListener("submit", submitAddInfo);
    els.profilePhotoInput.addEventListener("change", handlePhotoFileChange);
    els.photoZoom.addEventListener("input", updatePhotoDraftFromControls);
    els.photoX.addEventListener("input", updatePhotoDraftFromControls);
    els.photoY.addEventListener("input", updatePhotoDraftFromControls);
    els.photoRemoveButton.addEventListener("click", removePhotoDraft);
    if (els.suggestForm) els.suggestForm.addEventListener("submit", submitSuggestion);
    els.relativeForm.addEventListener("submit", submitRelative);
    els.relativeForm.addEventListener("input", renderDuplicateMatches);
    if (els.inviteForm) els.inviteForm.addEventListener("submit", submitInvite);
    var accessRequestForm = document.getElementById("accessRequestForm");
    if (accessRequestForm) accessRequestForm.addEventListener("submit", submitGateRequest);

    els.undoButton.addEventListener("click", function undo() {
      if (!lastUndo) return;
      restore(lastUndo);
      lastUndo = null;
      els.toast.hidden = true;
    });

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("dragover", handlePhotoDragOver);
    document.addEventListener("dragleave", handlePhotoDragLeave);
    document.addEventListener("drop", handlePhotoDrop);
    bindTooltips();
    bindMapGestures();
    bindKeyboardNavigation();
  }

  function handleDocumentClick(event) {
    if (suppressNextPersonClick) {
      suppressNextPersonClick = false;
      event.preventDefault();
      return;
    }
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

    var restoreSnapshotButton = event.target.closest("[data-restore-snapshot]");
    if (restoreSnapshotButton) restoreDailySnapshot(restoreSnapshotButton.dataset.restoreSnapshot);
  }

  function bindMapGestures() {
    var drag = null;
    els.mapShell.addEventListener("pointerdown", function startDrag(event) {
      if (event.target.closest("button")) return;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        panX: state.panX,
        panY: state.panY,
        moved: false
      };
      els.mapShell.classList.add("is-dragging");
      els.mapShell.setPointerCapture(event.pointerId);
    });

    els.mapShell.addEventListener("pointermove", function moveDrag(event) {
      if (!drag) return;
      state.panX = drag.panX + event.clientX - drag.startX;
      state.panY = drag.panY + event.clientY - drag.startY;
      drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 8;
      clampPan();
      renderMap();
    });

    els.mapShell.addEventListener("pointerup", function endDrag() {
      if (drag && drag.moved) {
        suppressNextPersonClick = true;
        window.setTimeout(function clearSuppression() {
          suppressNextPersonClick = false;
        }, 0);
      }
      drag = null;
      els.mapShell.classList.remove("is-dragging");
    });

    els.mapShell.addEventListener("wheel", function wheelPan(event) {
      event.preventDefault();
      var maxDelta = 90;
      var deltaX = Math.max(-maxDelta, Math.min(maxDelta, event.deltaX || 0));
      var deltaY = Math.max(-maxDelta, Math.min(maxDelta, event.deltaY || 0));
      if (event.shiftKey && !deltaX) {
        state.panX -= deltaY;
      } else {
        state.panX -= deltaX;
        state.panY -= deltaY;
      }
      clampPan();
      renderMap();
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
  applyIncomingShareLink();
  rememberDailySnapshot();
  bindEvents();
  renderAll();
  initialCenter();
})();
