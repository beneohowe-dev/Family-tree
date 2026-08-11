# Import Contract

## Local Files Found During Build

No Motion Scout files, LinkedIn CSV files, CSV files, or spreadsheet exports were found in `/Users/benhowe/Documents/Foundation` during this build.

The importer is therefore designed as a staging contract, not a fake import.

## Expected LinkedIn Connections CSV Fields

LinkedIn exports vary by locale and year. The importer should detect fields case-insensitively and preserve the raw row.

Common fields:

- First Name
- Last Name
- URL
- Email Address
- Company
- Position
- Connected On

Additional exports may include:

- messages
- recommendations
- positions
- profile URLs added manually
- Sales Navigator discoveries reviewed manually

## Expected Motion Scout Export Fields

The Motion Scout import should accept a reviewed CSV or JSON export with any of:

- profile URL
- full name
- current role
- company or organisation
- country, region, city
- existing Motion classification
- Foundation classification
- relationship notes
- message counts
- previous shortlist decisions
- evidence URLs
- source confidence

## Import Rules

1. Store every file in `import_files`.
2. Store every raw row in `import_rows`.
3. Resolve entities using name, employer, role, geography, social URLs, biography, and linked websites.
4. Do not match accounts on name alone.
5. Never overwrite manually curated intelligence silently.
6. Write field-level changes to `audit_log`.
7. Create uncertain matches as `POSSIBLE_DUPLICATE_REVIEW`.
8. Mark new people as Discovered -> Review Required.
9. Recalculate relationship warmth only from relationship evidence and manual notes.
10. Keep sensitive-data status separate from outreach eligibility.

## Example Staging Outcome

- New LinkedIn connection with name only: create review candidate.
- Name plus same profile URL: update existing profile.
- Name plus employer plus city: possible duplicate review.
- Manual note conflict: preserve existing note and create reviewer diff.
- Message export with unanswered outbound message: do not increase warmth to warm.
