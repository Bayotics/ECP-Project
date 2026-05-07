"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/context/MembershipContext";

type DocCategory = "my-documents" | "organizational" | "all";

interface Doc {
  id: string;
  name: string;
  label: string;
  category: "my-documents" | "organizational";
  uploadedAt: string;
  simulatedSize: string;
  fileType: "pdf" | "docx" | "xlsx" | "img";
}

// Static org documents every member can access
const ORG_DOCS: Doc[] = [
  { id: "org-1", name: "ECP_Constitution_2024.pdf",             label: "ECP Constitution",              category: "organizational", uploadedAt: "2024-01-01", simulatedSize: "2.4 MB",  fileType: "pdf"  },
  { id: "org-2", name: "Annual_Report_2023.pdf",                label: "Annual Report 2023",            category: "organizational", uploadedAt: "2024-02-15", simulatedSize: "5.1 MB",  fileType: "pdf"  },
  { id: "org-3", name: "Meeting_Minutes_Q4_2024.pdf",           label: "Meeting Minutes Q4 2024",       category: "organizational", uploadedAt: "2025-01-10", simulatedSize: "0.8 MB",  fileType: "pdf"  },
  { id: "org-4", name: "Member_Handbook_v3.pdf",                label: "Member Handbook v3",            category: "organizational", uploadedAt: "2024-08-01", simulatedSize: "1.2 MB",  fileType: "pdf"  },
  { id: "org-5", name: "ECP_Newsletter_Q1_2025.pdf",            label: "Newsletter Q1 2025",            category: "organizational", uploadedAt: "2025-04-05", simulatedSize: "3.3 MB",  fileType: "pdf"  },
  { id: "org-6", name: "Lagos_Chapter_Budget_2025.xlsx",        label: "Lagos Chapter Budget 2025",     category: "organizational", uploadedAt: "2025-01-20", simulatedSize: "0.4 MB",  fileType: "xlsx" },
  { id: "org-7", name: "Volunteer_Framework.docx",              label: "Volunteer Framework",           category: "organizational", uploadedAt: "2024-06-12", simulatedSize: "0.9 MB",  fileType: "docx" },
];

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  xlsx: "📊",
  img: "🖼️",
};

const FILE_COLORS: Record<string, string> = {
  pdf:  "bg-red-50 text-red-600",
  docx: "bg-blue-50 text-blue-600",
  xlsx: "bg-green-50 text-green-600",
  img:  "bg-purple-50 text-purple-600",
};

function DownloadButton({ docId }: { docId: string }) {
  const [state, setState] = useState<"idle" | "progress" | "done">("idle");
  const [progress, setProgress] = useState(0);

  function handleDownload() {
    setState("progress");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setState("done");
          setTimeout(() => { setState("idle"); setProgress(0); }, 2500);
          return 100;
        }
        return p + Math.random() * 18 + 8;
      });
    }, 120);
  }

  void docId; // used as key if needed

  if (state === "done") {
    return (
      <span className="text-xs font-medium text-(--color-green-600) flex items-center gap-1">
        ✓ Downloaded
      </span>
    );
  }

  if (state === "progress") {
    return (
      <div className="flex items-center gap-2 min-w-24">
        <div className="flex-1 h-1.5 bg-(--color-neutral-200) rounded-full overflow-hidden">
          <div
            className="h-full bg-(--color-green-500) rounded-full transition-all duration-150"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-xs text-(--color-neutral-400)">{Math.min(Math.round(progress), 100)}%</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 rounded-lg border border-(--color-neutral-300) px-3 py-1.5 text-xs font-medium text-(--color-neutral-600) hover:bg-(--color-neutral-50) hover:border-(--color-green-400) hover:text-(--color-green-600) transition"
    >
      ↓ Download
    </button>
  );
}

export default function DocumentsPage() {
  const { currentUser } = useAuth();
  const { getByEmail, getByUserId } = useMembership();

  const application = currentUser
    ? (getByEmail(currentUser.email) ?? getByUserId(currentUser.id))
    : null;

  const myDocs: Doc[] = (application?.documents ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    label: d.label,
    category: "my-documents" as const,
    uploadedAt: d.uploadedAt,
    simulatedSize: d.simulatedSize ?? "—",
    fileType: d.name.endsWith(".pdf") ? "pdf"
      : d.name.endsWith(".doc") || d.name.endsWith(".docx") ? "docx"
      : d.name.endsWith(".xls") || d.name.endsWith(".xlsx") ? "xlsx"
      : "img",
  }));

  const allDocs = [...myDocs, ...ORG_DOCS];

  const [category, setCategory] = useState<DocCategory>("all");
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allDocs
      .filter((d) => category === "all" || d.category === category)
      .filter((d) => !q || d.label.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
      .filter((d) => !fileTypeFilter || d.fileType === fileTypeFilter);
  }, [allDocs, category, search, fileTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = {
    all: allDocs.length,
    "my-documents": myDocs.length,
    organizational: ORG_DOCS.length,
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-500">Documents Center</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">Access your personal documents and organization resources</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "my-documents", "organizational"] as DocCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition flex items-center gap-2 ${
              category === cat
                ? "bg-(--color-green-600) text-white"
                : "bg-white border border-(--color-neutral-200) text-(--color-neutral-600) hover:border-(--color-green-300)"
            }`}
          >
            {cat === "my-documents" ? "My Documents" : cat === "organizational" ? "Organization" : "All Documents"}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${category === cat ? "bg-white/20 text-white" : "bg-(--color-neutral-100) text-(--color-neutral-500)"}`}>
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="bg-white rounded-xl border border-(--color-neutral-200) p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-(--color-neutral-300) px-3.5 py-2 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
        />
        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="rounded-lg border border-(--color-neutral-300) px-3.5 py-2 text-sm outline-none focus:border-(--color-green-500) transition"
        >
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="docx">Word (DOCX)</option>
          <option value="xlsx">Excel (XLSX)</option>
        </select>
        {(search || fileTypeFilter) && (
          <button
            onClick={() => { setSearch(""); setFileTypeFilter(""); }}
            className="rounded-lg border border-(--color-neutral-200) px-3.5 py-2 text-sm text-(--color-neutral-500) hover:bg-(--color-neutral-50) transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-(--color-neutral-400)">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-medium">No documents found</p>
          {category === "my-documents" && myDocs.length === 0 && (
            <p className="text-sm mt-1">Documents from your membership application will appear here</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-(--color-neutral-200) divide-y divide-(--color-neutral-100)">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-(--color-neutral-50) transition group">
              {/* Icon */}
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg ${FILE_COLORS[doc.fileType]}`}>
                {FILE_ICONS[doc.fileType]}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-500 truncate">{doc.label}</p>
                <p className="text-xs text-(--color-neutral-400) mt-0.5 truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium uppercase px-1.5 py-0.5 rounded ${FILE_COLORS[doc.fileType]}`}>
                    {doc.fileType}
                  </span>
                  <span className="text-xs text-(--color-neutral-400)">{doc.simulatedSize}</span>
                  <span className="text-xs text-(--color-neutral-400)">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {doc.category === "my-documents" && (
                    <span className="text-xs text-(--color-green-600) font-medium">My Doc</span>
                  )}
                </div>
              </div>
              {/* Download */}
              <div className="flex-shrink-0">
                <DownloadButton docId={doc.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
