export type LinkedInImportMode = "likely" | "all";

export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  fullName: string;
  profileUrl: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
}

export interface LinkedInImportCandidate extends LinkedInConnection {
  sourceKey: string;
  score: number;
  timing: "Soon" | "Build first" | "Hold";
  allocation: "Unallocated" | "Motion" | "Foundation" | "Product" | "Commercial" | "PR / Media" | "Ambassador" | "Later";
  why: string;
  matchedSignals: string[];
}

export interface LinkedInImportResult {
  totalRows: number;
  candidates: LinkedInImportCandidate[];
  skippedLowFit: number;
}

interface SignalGroup {
  allocation: LinkedInImportCandidate["allocation"];
  label: string;
  points: number;
  terms: string[];
}

const signalGroups: SignalGroup[] = [
  {
    allocation: "Foundation",
    label: "Foundation or community relevance",
    points: 30,
    terms: [
      "accessibility",
      "accessible",
      "adaptive",
      "charity",
      "dei",
      "disability",
      "diversity",
      "foundation",
      "inclusion",
      "inclusive",
      "independent living",
      "mobility",
      "neurodiver",
      "paralymp",
      "rehab",
      "social impact",
      "spinal",
      "wheelchair"
    ]
  },
  {
    allocation: "Ambassador",
    label: "Ambassador or public voice",
    points: 24,
    terms: ["advocate", "athlete", "author", "broadcaster", "campaigner", "creator", "influencer", "keynote", "podcast", "presenter", "speaker"]
  },
  {
    allocation: "Product",
    label: "Product or design relevance",
    points: 22,
    terms: ["activewear", "apparel", "designer", "fashion", "industrial design", "materials", "product", "research", "sourcing", "user research"]
  },
  {
    allocation: "Commercial",
    label: "Commercial route",
    points: 18,
    terms: ["brand", "buying", "commercial", "distribution", "growth", "marketing", "partnership", "retail", "sales", "sponsor", "strategy"]
  },
  {
    allocation: "PR / Media",
    label: "PR or media route",
    points: 18,
    terms: ["communications", "content", "editor", "film", "journalist", "media", "photographer", "producer", "public relations", "video"]
  }
];

export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((cell) => cell.trim()));
}

export function parseLinkedInConnections(csv: string): LinkedInConnection[] {
  const rows = parseCsvRows(csv);
  const headerIndex = rows.findIndex((row) => {
    const headers = row.map(normaliseHeader);
    return headers.includes("first name") && headers.includes("last name") && headers.includes("url");
  });

  if (headerIndex < 0) {
    throw new Error("Could not find the LinkedIn Connections.csv header.");
  }

  const headers = rows[headerIndex].map(normaliseHeader);
  const dataRows = rows.slice(headerIndex + 1);

  return dataRows
    .map((row) => {
      const firstName = cell(row, headers, "first name");
      const lastName = cell(row, headers, "last name");
      const fullName = cleanText([firstName, lastName].filter(Boolean).join(" "));

      return {
        firstName,
        lastName,
        fullName,
        profileUrl: cell(row, headers, "url"),
        email: cell(row, headers, "email address"),
        company: cell(row, headers, "company"),
        position: cell(row, headers, "position"),
        connectedOn: cell(row, headers, "connected on")
      };
    })
    .filter((connection) => connection.fullName);
}

export function buildLinkedInImportCandidates(csv: string, mode: LinkedInImportMode = "likely"): LinkedInImportResult {
  const connections = parseLinkedInConnections(csv);
  const scored = connections.map(scoreConnection).sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName));
  const candidates = mode === "all" ? scored : scored.filter((candidate) => candidate.score >= 55);

  return {
    totalRows: connections.length,
    candidates,
    skippedLowFit: scored.length - candidates.length
  };
}

export async function extractLinkedInConnectionsCsvFromZip(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new TextDecoder();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  let cursor = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileNameStart = cursor + 46;
    const fileName = decoder.decode(bytes.slice(fileNameStart, fileNameStart + fileNameLength));

    if (fileName.replace(/^.*\//, "") === "Connections.csv") {
      return decodeZipEntry(bytes, localHeaderOffset, compressedSize, compressionMethod);
    }

    cursor = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  throw new Error("Could not find Connections.csv in that LinkedIn export.");
}

function scoreConnection(connection: LinkedInConnection): LinkedInImportCandidate {
  const text = `${connection.position} ${connection.company}`.toLowerCase();
  const signals: string[] = [];
  let score = 42;
  let strongest: { allocation: LinkedInImportCandidate["allocation"]; hits: number; points: number } = {
    allocation: "Unallocated",
    hits: 0,
    points: 0
  };

  for (const group of signalGroups) {
    const hits = group.terms.filter((term) => text.includes(term));
    if (!hits.length) continue;

    const points = Math.min(group.points, 10 + hits.length * 5);
    score += points;
    signals.push(group.label);

    if (hits.length > strongest.hits || (hits.length === strongest.hits && points > strongest.points)) {
      strongest = { allocation: group.allocation, hits: hits.length, points };
    }
  }

  score = Math.min(95, score);

  return {
    ...connection,
    sourceKey: (connection.profileUrl || `${connection.fullName}|${connection.company}`).toLowerCase(),
    score,
    timing: score >= 72 ? "Soon" : score >= 55 ? "Build first" : "Hold",
    allocation: strongest.allocation,
    why: signals.length
      ? `LinkedIn import: ${signals.join(", ")}. Review before approaching.`
      : "LinkedIn import. Review fit before saving.",
    matchedSignals: signals
  };
}

function normaliseHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function cell(row: string[], headers: string[], header: string) {
  const index = headers.indexOf(header);
  return cleanText(index >= 0 ? row[index] || "" : "");
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findEndOfCentralDirectory(view: DataView) {
  const minOffset = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("That zip file could not be read. Try uploading Connections.csv instead.");
}

async function decodeZipEntry(bytes: Uint8Array, localHeaderOffset: number, compressedSize: number, compressionMethod: number) {
  const decoder = new TextDecoder();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
    throw new Error("That zip file could not be read. Try uploading Connections.csv instead.");
  }

  const fileNameLength = view.getUint16(localHeaderOffset + 26, true);
  const extraLength = view.getUint16(localHeaderOffset + 28, true);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) {
    return decoder.decode(compressed);
  }

  if (compressionMethod !== 8) {
    throw new Error("That zip compression is not supported. Extract Connections.csv and upload that file instead.");
  }

  if (!globalThis.DecompressionStream) {
    throw new Error("Zip import is not available in this browser. Extract Connections.csv and upload that file instead.");
  }

  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return decoder.decode(await new Response(stream).arrayBuffer());
}
