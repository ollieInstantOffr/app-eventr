/**
 * The Art. 28(3) DPA text, kept in one place so the page and the downloadable
 * PDF can never drift apart. Every clause the article requires is present:
 * instructions, confidentiality, security, sub-processors, rights assistance,
 * breach notice, audits, transfers, deletion.
 */
export type DpaClause = { id: string; title: string; paragraphs: string[]; bullets?: string[] };

export const DPA_CLAUSES: DpaClause[] = [
  {
    id: "parties",
    title: "Parties and roles",
    paragraphs: [
      "The Controller decides which personal data is collected from guests and for what purpose. The Processor provides the Eventr software and processes guest data only to deliver it. Each party complies with the GDPR obligations that apply to its role.",
      "The Controller confirms it has a lawful basis for the raffle and for collecting each field it enables.",
    ],
  },
  {
    id: "subject-matter",
    title: "Subject matter and duration",
    paragraphs: [
      "Processing covers the collection, storage, display (including masked display on the live screen), random selection, export and deletion of guest entries.",
      "It lasts as long as the Controller has an account, plus the deletion period in clause 11. Details are in Annex A.",
    ],
  },
  {
    id: "instructions",
    title: "Processing on documented instructions",
    paragraphs: [
      "The Processor processes guest data only on the Controller's documented instructions. The instructions are: the Terms, this agreement, and the settings the Controller chooses in the product — form fields, retention period, masking, consent text and how guest requests are handled.",
      "The Processor will inform the Controller if it believes an instruction infringes data protection law, and will not use guest data for its own purposes: no marketing, no profiling, no combining across Controllers.",
    ],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    paragraphs: [
      "Only Processor staff who need access to operate or support the service may access guest data. All are bound by confidentiality and receive data protection training.",
    ],
  },
  {
    id: "security",
    title: "Security (Art. 32)",
    paragraphs: [
      "The Processor implements and maintains appropriate technical and organisational measures, including:",
    ],
    bullets: [
      "Encryption in transit (TLS 1.2+) and at rest.",
      "Passwordless sign-in with short-lived, single-use magic links; role-based access for team members and kiosk devices.",
      "Logical separation of each Controller's data; audit logs of access, exports and draws.",
      "Automatic deletion according to the Controller's retention setting; backups purged within 35 days.",
      "Vulnerability management, least-privilege infrastructure access, and tested restore procedures.",
    ],
  },
  {
    id: "sub-processors",
    title: "Sub-processors",
    paragraphs: [
      "The Processor does not use any sub-processors: all guest data is processed on systems operated by the Processor itself, including email delivery of magic links.",
      "Should the Processor wish to engage a sub-processor in future, it will give the Controller at least 30 days' notice by email; the Controller may object on reasonable data-protection grounds, and the Processor will impose the same data protection obligations on any sub-processor in writing and remain fully responsible for it.",
    ],
  },
  {
    id: "rights",
    title: "Assistance with data subject rights",
    paragraphs: [
      "Guests can request access, export or deletion directly from their confirmation page; requests are routed to the Controller in Settings → Privacy & data and can be auto-fulfilled.",
      "If a guest contacts the Processor directly, the Processor forwards the request to the Controller within 5 business days and does not respond on the Controller's behalf except to redirect.",
    ],
  },
  {
    id: "breach",
    title: "Personal data breach",
    paragraphs: [
      "The Processor notifies the Controller without undue delay and in any case within 72 hours of becoming aware of a personal data breach affecting guest data, with the information the Controller needs for its own notification duties: the nature of the breach, the categories and approximate numbers affected, the likely consequences, and the measures taken.",
      "The Controller is responsible for notifying its supervisory authority and affected guests.",
    ],
  },
  {
    id: "audits",
    title: "Audits and information",
    paragraphs: [
      "On request, no more than once per year unless required by an authority or following a breach, the Processor provides the information reasonably necessary to demonstrate compliance — security documentation and the Art. 30 processing record generated in the product.",
      "Where this is insufficient, the Controller may conduct or mandate an audit at its own cost, with 30 days' notice, during business hours and without disrupting the service.",
    ],
  },
  {
    id: "transfers",
    title: "International transfers",
    paragraphs: [
      "The Processor does not transfer guest data outside the EU/EEA. Any future transfer would take place only under an appropriate safeguard, such as the EU Standard Contractual Clauses or an adequacy decision, after notice to the Controller.",
    ],
  },
  {
    id: "deletion",
    title: "Deletion and return",
    paragraphs: [
      "Guest entries are deleted automatically at the end of the retention period chosen per event. At any time the Controller may export all guest data (CSV/JSON) and delete events or the whole organisation.",
      "On account closure the Processor deletes all guest data within 30 days, except where retention is required by law, and confirms deletion on request.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    paragraphs: [
      "Each party is liable for damage caused by processing that infringes the GDPR to the extent set out in Art. 82. Between the parties, the limitation of liability in the Terms of Service applies to this agreement.",
    ],
  },
  {
    id: "annex-a",
    title: "Annex A · Processing",
    paragraphs: [
      "Subject matter: running prize draws at events on behalf of the Controller.",
      "Duration: for as long as the Controller has an account, plus the deletion period in clause 11.",
      "Nature and purpose: collection, storage, duplicate detection, masked display, random selection, notification of winners, export and deletion.",
      "Categories of data subject: guests who enter a raffle; members of the Controller's own team.",
      "Categories of personal data: the fields the Controller enables on the entry form — typically name and email, optionally phone, company and custom questions — plus the consent text, version and timestamp, and for winners a claim code and delivery status.",
      "Special category data: none. The Controller must not enable fields that collect it.",
    ],
  },
];
