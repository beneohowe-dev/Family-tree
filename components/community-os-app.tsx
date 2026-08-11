"use client";

import {
  Bookmark,
  ExternalLink,
  FileText,
  Handshake,
  Link2,
  Mail,
  Phone,
  Pin,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Star,
  Upload,
  UserPlus,
  Users,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  buildLinkedInImportCandidates,
  extractLinkedInConnectionsCsvFromZip,
  type LinkedInImportCandidate,
  type LinkedInImportMode
} from "../lib/linkedin-import";

type Timing = "Now" | "Soon" | "Build first" | "Hold" | "Do not approach";
type Warmth = "Hot" | "Warm" | "Known" | "Light" | "Cold" | "Unknown";
type Allocation = "Unallocated" | "Motion" | "Foundation" | "Product" | "Commercial" | "PR / Media" | "Ambassador" | "Later";
type ContactType = "email" | "mobile" | "website" | "social" | "intro";

interface ContactMethod {
  id: string;
  type: ContactType;
  label: string;
  value: string;
  href: string;
}

interface RelationshipNotes {
  approach: string;
  benefitToThem: string;
  benefitToMotion: string;
  caution: string;
}

interface CommunityPerson {
  id: string;
  name: string;
  role: string;
  organisation: string;
  location: string;
  why: string;
  score: number;
  warmth: Warmth;
  timing: Timing;
  allocation: Allocation;
  pinned: boolean;
  saved: boolean;
  contactMethods: ContactMethod[];
  notes: RelationshipNotes;
  updatedAt: string;
}

const STORAGE_KEY = "motion-community-os-v3-empty-starter";

const timingOptions: Timing[] = ["Now", "Soon", "Build first", "Hold", "Do not approach"];
const warmthOptions: Warmth[] = ["Hot", "Warm", "Known", "Light", "Cold", "Unknown"];
const allocationOptions: Allocation[] = [
  "Unallocated",
  "Motion",
  "Foundation",
  "Product",
  "Commercial",
  "PR / Media",
  "Ambassador",
  "Later"
];

const contactTypeLabels: Record<ContactType, string> = {
  email: "Email",
  mobile: "Mobile",
  website: "Website",
  social: "Social",
  intro: "Intro"
};

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normaliseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function contactHref(type: ContactType, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (type === "email") return `mailto:${trimmed}`;
  if (type === "mobile") return `tel:${trimmed.replace(/[^\d+]/g, "")}`;
  if (type === "website" || type === "social") return normaliseUrl(trimmed);
  if (type === "intro" && trimmed.includes("@")) return `mailto:${trimmed}`;
  return normaliseUrl(trimmed);
}

function contactIcon(type: ContactType): LucideIcon {
  if (type === "email") return Mail;
  if (type === "mobile") return Phone;
  if (type === "intro") return Handshake;
  return Link2;
}

function timingTone(timing: Timing) {
  if (timing === "Now") return "good";
  if (timing === "Soon" || timing === "Build first") return "watch";
  if (timing === "Do not approach") return "danger";
  return "neutral";
}

function emptyNotes(): RelationshipNotes {
  return {
    approach: "",
    benefitToThem: "",
    benefitToMotion: "",
    caution: ""
  };
}

function createPersonFromForm(form: HTMLFormElement): CommunityPerson {
  const data = new FormData(form);
  const contactType = String(data.get("contactType") || "email") as ContactType;
  const contactValue = String(data.get("contactValue") || "").trim();
  const contactMethods: ContactMethod[] = contactValue
    ? [
        {
          id: uid("contact"),
          type: contactType,
          label: contactTypeLabels[contactType],
          value: contactValue,
          href: contactHref(contactType, contactValue)
        }
      ]
    : [];

  return {
    id: uid("person"),
    name: String(data.get("name") || "").trim(),
    role: String(data.get("role") || "").trim(),
    organisation: String(data.get("organisation") || "").trim(),
    location: String(data.get("location") || "").trim(),
    why: String(data.get("why") || "").trim(),
    score: Number(data.get("score") || 50),
    warmth: "Unknown",
    timing: "Hold",
    allocation: String(data.get("allocation") || "Unallocated") as Allocation,
    pinned: false,
    saved: true,
    contactMethods,
    notes: emptyNotes(),
    updatedAt: new Date().toISOString()
  };
}

function createPersonFromLinkedInCandidate(candidate: LinkedInImportCandidate): CommunityPerson {
  const contactMethods: ContactMethod[] = [];
  const now = new Date().toISOString();

  if (candidate.profileUrl) {
    contactMethods.push({
      id: uid("contact"),
      type: "social",
      label: "LinkedIn",
      value: candidate.profileUrl,
      href: contactHref("social", candidate.profileUrl)
    });
  }

  if (candidate.email) {
    contactMethods.push({
      id: uid("contact"),
      type: "email",
      label: "Email",
      value: candidate.email,
      href: contactHref("email", candidate.email)
    });
  }

  return {
    id: uid("linkedin-person"),
    name: candidate.fullName,
    role: candidate.position,
    organisation: candidate.company,
    location: "",
    why: candidate.connectedOn ? `${candidate.why} Connected on LinkedIn: ${candidate.connectedOn}.` : candidate.why,
    score: candidate.score,
    warmth: "Light",
    timing: candidate.timing,
    allocation: candidate.allocation,
    pinned: false,
    saved: true,
    contactMethods,
    notes: {
      approach: "Review the shared context first. Use a specific, low-pressure ask.",
      benefitToThem: "",
      benefitToMotion: "",
      caution: "Imported from LinkedIn. First-degree connection only; confirm relevance before outreach."
    },
    updatedAt: now
  };
}

function normaliseDedupeKey(value: string) {
  return value.trim().toLowerCase();
}

function personDedupeKeys(person: CommunityPerson) {
  return [
    `${person.name}|${person.organisation}`,
    ...person.contactMethods.flatMap((contact) => [contact.href, contact.value])
  ]
    .map(normaliseDedupeKey)
    .filter(Boolean);
}

function candidateDedupeKeys(candidate: LinkedInImportCandidate) {
  return [candidate.sourceKey, candidate.profileUrl, candidate.email, `${candidate.fullName}|${candidate.company}`]
    .map(normaliseDedupeKey)
    .filter(Boolean);
}

function removeDuplicateCandidates(candidates: LinkedInImportCandidate[], people: CommunityPerson[]) {
  const seen = new Set(people.flatMap(personDedupeKeys));
  const unique: LinkedInImportCandidate[] = [];
  let skippedDuplicates = 0;

  for (const candidate of candidates) {
    const keys = candidateDedupeKeys(candidate);
    if (keys.some((key) => seen.has(key))) {
      skippedDuplicates += 1;
      continue;
    }
    keys.forEach((key) => seen.add(key));
    unique.push(candidate);
  }

  return { candidates: unique, skippedDuplicates };
}

function StarterCard() {
  return (
    <section className="hero-band simple-hero">
      <div>
        <p className="eyebrow">Start empty</p>
        <h1>Motion Community OS</h1>
        <p>
          Add one person at a time. Decide why they matter, when to approach, how to reach them, and what Motion can
          genuinely offer.
        </p>
      </div>
      <div className="hero-brand-card" aria-label="Motion and Motion Foundation identity">
        <img src="/brand/motion-logo-white.png" alt="Motion" />
        <span />
        <img src="/brand/motion-foundation-logo-black.png" alt="Motion Foundation" />
      </div>
    </section>
  );
}

function LinkedInImportPanel({
  people,
  onImport
}: {
  people: CommunityPerson[];
  onImport: (candidates: LinkedInImportCandidate[]) => void;
}) {
  const [mode, setMode] = useState<LinkedInImportMode>("likely");
  const [status, setStatus] = useState<{
    tone: "neutral" | "good" | "danger";
    message: string;
    detail?: string;
  }>({
    tone: "neutral",
    message: "ZIP or Connections.csv"
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      setStatus({ tone: "neutral", message: "Reading LinkedIn export..." });
      const lowerName = file.name.toLowerCase();
      const csv = lowerName.endsWith(".zip") ? await extractLinkedInConnectionsCsvFromZip(file) : await file.text();
      const result = buildLinkedInImportCandidates(csv, mode);
      const deduped = removeDuplicateCandidates(result.candidates, people);

      onImport(deduped.candidates);
      setStatus({
        tone: "good",
        message: `Imported ${deduped.candidates.length} for review`,
        detail: `${result.totalRows} rows read. ${result.skippedLowFit} low-fit rows held back. ${deduped.skippedDuplicates} duplicates skipped.`
      });
    } catch (error) {
      setStatus({
        tone: "danger",
        message: "Import did not run",
        detail: error instanceof Error ? error.message : "Try uploading Connections.csv from the LinkedIn export."
      });
    }
  }

  return (
    <section className="linkedin-import panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">LinkedIn import</p>
          <h2>Review connections</h2>
        </div>
        <FileText size={20} aria-hidden="true" />
      </div>
      <div className="import-controls">
        <label>
          Scope
          <select value={mode} onChange={(event) => setMode(event.target.value as LinkedInImportMode)}>
            <option value="likely">Likely relevant</option>
            <option value="all">All connections</option>
          </select>
        </label>
        <label className="file-button">
          <Upload size={16} aria-hidden="true" />
          Upload export
          <input className="file-input" type="file" accept=".zip,.csv,text/csv,application/zip" onChange={handleFileChange} />
        </label>
      </div>
      <p className={classNames("import-status", status.tone)}>
        <span>{status.message}</span>
        {status.detail && <small>{status.detail}</small>}
      </p>
    </section>
  );
}

function AddPersonForm({ onAdd }: { onAdd: (person: CommunityPerson) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const person = createPersonFromForm(form);
    if (!person.name) return;
    onAdd(person);
    form.reset();
  }

  return (
    <form className="quick-add panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Add person</p>
          <h2>Capture the useful basics</h2>
        </div>
        <UserPlus size={20} aria-hidden="true" />
      </div>
      <div className="form-grid">
        <label>
          Name
          <input name="name" placeholder="Full name" required />
        </label>
        <label>
          Role
          <input name="role" placeholder="Athlete, adviser, buyer..." />
        </label>
        <label>
          Organisation
          <input name="organisation" placeholder="Company, charity, club" />
        </label>
        <label>
          Location
          <input name="location" placeholder="UK, London, Australia..." />
        </label>
        <label>
          Allocate
          <select name="allocation" defaultValue="Unallocated">
            {allocationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Score
          <input name="score" type="number" min="0" max="100" defaultValue="50" />
        </label>
        <label>
          Contact type
          <select name="contactType" defaultValue="email">
            {Object.entries(contactTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contact
          <input name="contactValue" placeholder="email, mobile, URL, profile" />
        </label>
      </div>
      <label className="wide-label">
        Why they might matter
        <textarea name="why" rows={3} placeholder="What could they contribute to Motion or the Foundation?" />
      </label>
      <button className="command-button primary" type="submit">
        <Plus size={16} aria-hidden="true" />
        Add person
      </button>
    </form>
  );
}

function EmptyState() {
  return (
    <article className="empty-panel panel">
      <Users size={28} aria-hidden="true" />
      <h2>No people yet</h2>
      <p>
        This should start blank. Add only real people you want to think about, then pin or allocate the useful ones.
      </p>
    </article>
  );
}

function PersonCard({
  person,
  selected,
  onSelect,
  onTogglePin,
  onToggleSaved
}: {
  person: CommunityPerson;
  selected: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSaved: (id: string) => void;
}) {
  return (
    <article className={classNames("starter-person-card", selected && "selected")}>
      <button className="person-open" type="button" onClick={() => onSelect(person.id)}>
        <span className="avatar" aria-hidden="true">
          {initials(person.name)}
        </span>
        <span>
          <strong>{person.name}</strong>
          <small>
            {[person.role, person.organisation, person.location].filter(Boolean).join(" / ") || "No role yet"}
          </small>
        </span>
        <b>{person.score}</b>
      </button>
      <div className="card-controls">
        <span className={classNames("pill", timingTone(person.timing))}>{person.timing}</span>
        <span className="pill neutral">{person.allocation}</span>
        <button type="button" onClick={() => onTogglePin(person.id)} aria-label={person.pinned ? "Unpin person" : "Pin person"}>
          <Pin size={15} aria-hidden="true" />
          {person.pinned ? "Pinned" : "Pin"}
        </button>
        <button type="button" onClick={() => onToggleSaved(person.id)} aria-label={person.saved ? "Unsave person" : "Save person"}>
          <Bookmark size={15} aria-hidden="true" />
          {person.saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}

function PeopleList({
  people,
  selectedId,
  onSelect,
  onTogglePin,
  onToggleSaved
}: {
  people: CommunityPerson[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSaved: (id: string) => void;
}) {
  if (!people.length) return <EmptyState />;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">People</p>
          <h2>{people.length} saved</h2>
        </div>
        <Star size={20} aria-hidden="true" />
      </div>
      <div className="person-list">
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            selected={person.id === selectedId}
            onSelect={onSelect}
            onTogglePin={onTogglePin}
            onToggleSaved={onToggleSaved}
          />
        ))}
      </div>
    </section>
  );
}

function ContactRoutes({
  person,
  onAddContact,
  onRemoveContact
}: {
  person: CommunityPerson;
  onAddContact: (personId: string, contact: ContactMethod) => void;
  onRemoveContact: (personId: string, contactId: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("type") || "email") as ContactType;
    const value = String(data.get("value") || "").trim();
    if (!value) return;
    onAddContact(person.id, {
      id: uid("contact"),
      type,
      label: contactTypeLabels[type],
      value,
      href: contactHref(type, value)
    });
    form.reset();
  }

  return (
    <section className="detail-section">
      <h3>Contact Links</h3>
      <div className="contact-grid">
        {person.contactMethods.map((method) => {
          const Icon = contactIcon(method.type);
          return (
            <div className="contact-row" key={method.id}>
              <a className="contact-action primary-contact" href={method.href} target={method.href.startsWith("http") ? "_blank" : undefined} rel={method.href.startsWith("http") ? "noreferrer" : undefined}>
                <Icon size={15} aria-hidden="true" />
                <span>
                  <strong>{method.label}</strong>
                  <small>{method.value}</small>
                </span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <button type="button" onClick={() => onRemoveContact(person.id, method.id)} aria-label="Remove contact">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {!person.contactMethods.length && <p className="muted-note">No contact links yet.</p>}
      </div>
      <form className="inline-contact-form" onSubmit={handleSubmit}>
        <select name="type" defaultValue="email" aria-label="Contact type">
          {Object.entries(contactTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input name="value" placeholder="Add email, mobile or URL" aria-label="Contact value" />
        <button type="submit" aria-label="Add contact">
          <Plus size={15} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function DetailPanel({
  person,
  onUpdate,
  onAddContact,
  onRemoveContact,
  onTogglePin,
  onToggleSaved,
  onDelete
}: {
  person?: CommunityPerson;
  onUpdate: (id: string, patch: Partial<CommunityPerson>) => void;
  onAddContact: (personId: string, contact: ContactMethod) => void;
  onRemoveContact: (personId: string, contactId: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!person) {
    return (
      <aside className="detail-panel empty-detail">
        <ShieldCheck size={26} aria-hidden="true" />
        <h2>Nothing selected</h2>
        <p>Add a person, then use this panel for contact links, allocation, notes and approach timing.</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel" aria-label="Selected person">
      <div className="detail-head">
        <span className="avatar large" aria-hidden="true">
          {initials(person.name)}
        </span>
        <div>
          <p className="eyebrow">Selected person</p>
          <h2>{person.name}</h2>
          <p>{[person.role, person.organisation].filter(Boolean).join(" / ") || "No role yet"}</p>
        </div>
      </div>

      <div className="detail-actions">
        <button className={classNames("command-button", person.pinned && "primary")} type="button" onClick={() => onTogglePin(person.id)}>
          <Pin size={16} aria-hidden="true" />
          {person.pinned ? "Pinned" : "Pin"}
        </button>
        <button className={classNames("command-button", person.saved && "primary")} type="button" onClick={() => onToggleSaved(person.id)}>
          <Save size={16} aria-hidden="true" />
          {person.saved ? "Saved" : "Save"}
        </button>
        <button className="command-button danger-button" type="button" onClick={() => onDelete(person.id)}>
          <X size={16} aria-hidden="true" />
          Remove
        </button>
      </div>

      <section className="detail-section">
        <h3>Score And Timing</h3>
        <div className="field-stack">
          <label>
            Overall usefulness
            <input
              type="range"
              min="0"
              max="100"
              value={person.score}
              onChange={(event) => onUpdate(person.id, { score: Number(event.target.value) })}
            />
            <strong>{person.score}</strong>
          </label>
          <label>
            When
            <select value={person.timing} onChange={(event) => onUpdate(person.id, { timing: event.target.value as Timing })}>
              {timingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Warmth
            <select value={person.warmth} onChange={(event) => onUpdate(person.id, { warmth: event.target.value as Warmth })}>
              {warmthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Allocate
            <select value={person.allocation} onChange={(event) => onUpdate(person.id, { allocation: event.target.value as Allocation })}>
              {allocationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <ContactRoutes person={person} onAddContact={onAddContact} onRemoveContact={onRemoveContact} />

      <section className="detail-section">
        <h3>Approach Notes</h3>
        <div className="notes-grid">
          <label>
            Opening angle
            <textarea
              value={person.notes.approach}
              onChange={(event) => onUpdate(person.id, { notes: { ...person.notes, approach: event.target.value } })}
              placeholder="Ask for advice on product fit, not an ambassador ask..."
              rows={3}
            />
          </label>
          <label>
            Benefit to them
            <textarea
              value={person.notes.benefitToThem}
              onChange={(event) => onUpdate(person.id, { notes: { ...person.notes, benefitToThem: event.target.value } })}
              placeholder="Paid session, platform, useful intro, real support..."
              rows={3}
            />
          </label>
          <label>
            Benefit to Motion / Foundation
            <textarea
              value={person.notes.benefitToMotion}
              onChange={(event) => onUpdate(person.id, { notes: { ...person.notes, benefitToMotion: event.target.value } })}
              placeholder="Product insight, charity route, retail intro..."
              rows={3}
            />
          </label>
          <label>
            Do not say / risk
            <textarea
              value={person.notes.caution}
              onChange={(event) => onUpdate(person.id, { notes: { ...person.notes, caution: event.target.value } })}
              placeholder="Avoid tokenistic language, cold pitch, assumptions..."
              rows={3}
            />
          </label>
        </div>
      </section>
    </aside>
  );
}

export function CommunityOsApp() {
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as CommunityPerson[];
      setPeople(parsed);
      setSelectedId(parsed[0]?.id);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }, [loaded, people]);

  const selectedPerson = people.find((person) => person.id === selectedId);
  const filteredPeople = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people
      .filter((person) => !showPinnedOnly || person.pinned)
      .filter((person) => {
        if (!needle) return true;
        return [person.name, person.role, person.organisation, person.location, person.why, person.allocation]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.score - a.score || a.name.localeCompare(b.name));
  }, [people, query, showPinnedOnly]);

  const pinnedCount = people.filter((person) => person.pinned).length;
  const savedCount = people.filter((person) => person.saved).length;

  function addPerson(person: CommunityPerson) {
    setPeople((current) => [person, ...current]);
    setSelectedId(person.id);
  }

  function importLinkedInCandidates(candidates: LinkedInImportCandidate[]) {
    const importedPeople = candidates.map(createPersonFromLinkedInCandidate);
    if (!importedPeople.length) return;

    setPeople((current) => [...importedPeople, ...current]);
    setSelectedId(importedPeople[0].id);
  }

  function updatePerson(id: string, patch: Partial<CommunityPerson>) {
    setPeople((current) =>
      current.map((person) => (person.id === id ? { ...person, ...patch, updatedAt: new Date().toISOString() } : person))
    );
  }

  function togglePin(id: string) {
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, pinned: !person.pinned } : person)));
  }

  function toggleSaved(id: string) {
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, saved: !person.saved } : person)));
  }

  function addContact(personId: string, contact: ContactMethod) {
    setPeople((current) =>
      current.map((person) =>
        person.id === personId ? { ...person, contactMethods: [...person.contactMethods, contact], updatedAt: new Date().toISOString() } : person
      )
    );
  }

  function removeContact(personId: string, contactId: string) {
    setPeople((current) =>
      current.map((person) =>
        person.id === personId
          ? {
              ...person,
              contactMethods: person.contactMethods.filter((contact) => contact.id !== contactId),
              updatedAt: new Date().toISOString()
            }
          : person
      )
    );
  }

  function deletePerson(id: string) {
    setPeople((current) => {
      const next = current.filter((person) => person.id !== id);
      setSelectedId((selected) => (selected === id ? next[0]?.id : selected));
      return next;
    });
  }

  return (
    <div className="os-frame slim-frame">
      <aside className="sidebar" aria-label="Motion Community OS navigation">
        <div className="brand-block">
          <span className="motion-mark">
            <img src="/brand/motion-logo-white.png" alt="Motion" />
          </span>
          <div>
            <p className="eyebrow">Private starter</p>
            <strong>Community OS</strong>
          </div>
        </div>
        <div className="simple-counts">
          <span>
            <b>{people.length}</b>
            people
          </span>
          <span>
            <b>{pinnedCount}</b>
            pinned
          </span>
          <span>
            <b>{savedCount}</b>
            saved
          </span>
        </div>
        <div className="side-note">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Start blank. Add real contacts only. No automated outreach.</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="top-strip">
          <div className="brand-lockup" aria-label="Motion and Motion Foundation">
            <img src="/brand/motion-logo-black.png" alt="Motion" />
            <span />
            <img src="/brand/motion-foundation-logo-black.png" alt="Motion Foundation" />
          </div>
          <div className="top-strip-focus">
            <p className="eyebrow">Relationship shortlist</p>
            <h2>{selectedPerson ? selectedPerson.name : "Empty workspace"}</h2>
          </div>
          <div className="top-actions">
            <span className="pill good">Local save</span>
            <span className="pill neutral">Empty</span>
          </div>
        </header>

        <div className="view-stack">
          <StarterCard />
          <LinkedInImportPanel people={people} onImport={importLinkedInCandidates} />
          <AddPersonForm onAdd={addPerson} />

          <section className="search-band" aria-label="Find saved people">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a saved person" type="search" />
            </label>
            <button className={classNames("command-button", showPinnedOnly && "primary")} type="button" onClick={() => setShowPinnedOnly(!showPinnedOnly)}>
              <Pin size={16} aria-hidden="true" />
              {showPinnedOnly ? "Showing pinned" : "Pinned only"}
            </button>
          </section>

          <PeopleList
            people={filteredPeople}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onTogglePin={togglePin}
            onToggleSaved={toggleSaved}
          />
        </div>
      </main>

      <DetailPanel
        person={selectedPerson}
        onUpdate={updatePerson}
        onAddContact={addContact}
        onRemoveContact={removeContact}
        onTogglePin={togglePin}
        onToggleSaved={toggleSaved}
        onDelete={deletePerson}
      />
    </div>
  );
}
