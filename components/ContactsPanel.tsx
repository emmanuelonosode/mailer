"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import type { Contact } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";
import HargroveSync from "@/components/HargroveSync";

interface ContactsPanelProps {
  contacts: Contact[];
  onContactsChange: (c: Contact[]) => void;
  optOuts: string[];
}

const EMPTY = { name: "", email: "", phone: "", tags: [] as string[], notes: "", company: "", city: "", state: "" };

function tagColor(tag: string) {
  const map: Record<string, string> = {
    "Buyer": "bg-blue-500/20 text-blue-300",
    "Renter": "bg-purple-500/20 text-purple-300",
    "Investor": "bg-amber-500/20 text-amber-300",
    "Lead": "bg-green-500/20 text-green-300",
    "Past Client": "bg-gray-500/20 text-gray-300",
    "Bounced": "bg-red-500/20 text-red-300",
  };
  return map[tag] ?? "bg-white/10 text-white/50";
}

type EditState = typeof EMPTY & { _id?: string; unsubscribed?: boolean };

export default function ContactsPanel({ contacts, onContactsChange, optOuts }: ContactsPanelProps) {
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showHargroveSync, setShowHargroveSync] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) onContactsChange(await res.json());
  }, [onContactsChange]);

  const filtered = contacts.filter((c) => {
    const id = (c as Contact & { _id?: string })._id ?? (c as Contact).id ?? "";
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search);
    const isUnsub = c.unsubscribed || optOuts.includes(c.email.toLowerCase()) || c.tags?.includes("Unsubscribed");
    const matchTag =
      filterTag === "All" ||
      (filterTag === "Unsubscribed" ? isUnsub : c.tags?.includes(filterTag));
    void id;
    return matchSearch && matchTag;
  });

  function openNew() {
    setEditing({ ...EMPTY });
    setIsNew(true);
  }

  function openEdit(c: Contact & { _id?: string }) {
    setEditing({
      _id: c._id ?? c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      tags: [...(c.tags ?? [])],
      notes: c.notes ?? "",
      company: (c as Contact & { company?: string }).company ?? "",
      city: (c as Contact & { city?: string }).city ?? "",
      state: (c as Contact & { state?: string }).state ?? "",
      unsubscribed: c.unsubscribed,
    });
    setIsNew(false);
  }

  async function saveEditing() {
    if (!editing) return;
    if (!editing.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)) return;
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.error ?? "Failed to add contact.", false);
          return;
        }
      } else {
        const res = await fetch(`/api/contacts/${editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        });
        if (!res.ok) {
          showToast("Failed to update contact.", false);
          return;
        }
      }
      setEditing(null);
      setIsNew(false);
      await refreshContacts();
      showToast(isNew ? "Contact added." : "Contact updated.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    if ((editing as EditState | null)?._id === id) setEditing(null);
    await refreshContacts();
    showToast("Contact deleted.");
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      async complete(results) {
        const fields = results.meta.fields ?? [];
        const emailCol = fields.find((h) => /^email$/i.test(h)) ?? fields.find((h) => /email/i.test(h));
        const nameCol = fields.find((h) => /^(name|full.?name)$/i.test(h)) ?? fields.find((h) => /name/i.test(h));
        const phoneCol = fields.find((h) => /phone/i.test(h));
        const tagsCol = fields.find((h) => /tags?/i.test(h));
        const companyCol = fields.find((h) => /company|org/i.test(h));
        const cityCol = fields.find((h) => /^city$/i.test(h));
        const stateCol = fields.find((h) => /^state$/i.test(h));

        if (!emailCol) { setImporting(false); showToast("CSV must have an Email column.", false); return; }

        const imported = results.data
          .map((row) => ({
            email: (row[emailCol] ?? "").trim().toLowerCase(),
            name: nameCol ? (row[nameCol] ?? "").trim() : "",
            phone: phoneCol ? (row[phoneCol] ?? "").trim() : undefined,
            tags: tagsCol ? (row[tagsCol] ?? "").split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [],
            company: companyCol ? (row[companyCol] ?? "").trim() : undefined,
            city: cityCol ? (row[cityCol] ?? "").trim() : undefined,
            state: stateCol ? (row[stateCol] ?? "").trim() : undefined,
          }))
          .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));

        if (imported.length === 0) { setImporting(false); showToast("No valid emails found in CSV.", false); return; }

        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imported),
        });
        setImporting(false);
        if (res.ok) {
          const { created, failed } = await res.json();
          await refreshContacts();
          showToast(`Imported ${created} contact${created !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}.`);
        } else {
          showToast("Import failed.", false);
        }
      },
    });
  }

  function exportCsv() {
    const rows = [["Name", "Email", "Phone", "Company", "Tags", "City", "State", "Notes", "Added"]];
    contacts.forEach((c: Contact & { company?: string; city?: string; state?: string }) => {
      rows.push([
        c.name, c.email, c.phone ?? "", c.company ?? "",
        (c.tags ?? []).join("; "), c.city ?? "", c.state ?? "",
        c.notes ?? "", (c.createdAt ?? "").slice(0, 10),
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `hasker-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const tagCounts: Record<string, number> = { All: contacts.length, Unsubscribed: 0 };
  contacts.forEach((c) => {
    if (c.unsubscribed || optOuts.includes(c.email.toLowerCase()) || c.tags?.includes("Unsubscribed"))
      tagCounts["Unsubscribed"] = (tagCounts["Unsubscribed"] ?? 0) + 1;
    (c.tags ?? []).forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
  });

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[#0a1929]">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-semibold tracking-tight">Contact Book</h1>
            <p className="text-white/35 text-xs mt-0.5">{contacts.length} contacts · {tagCounts["Unsubscribed"] ?? 0} unsubscribed · saved to MongoDB</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHargroveSync((v) => !v)}
              className={["flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors", showHargroveSync ? "bg-blue-500/20 border-blue-500/30 text-blue-300" : "border-white/12 text-white/50 hover:text-white hover:border-white/25"].join(" ")}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              Hargrove CRM
            </button>
            <button
              onClick={() => csvRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/12 text-white/50 hover:text-white hover:border-white/25 text-xs transition-colors disabled:opacity-50"
            >
              {importing ? "Importing…" : "Import CSV"}
            </button>
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
            <button onClick={exportCsv} disabled={contacts.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/12 text-white/50 hover:text-white hover:border-white/25 text-xs transition-colors disabled:opacity-30">
              Export CSV
            </button>
            <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent/85 transition-colors">
              + Add Contact
            </button>
          </div>
        </div>

        {/* Hargrove CRM Sync panel */}
        {showHargroveSync && (
          <div className="mb-4">
            <HargroveSync onSync={refreshContacts} />
          </div>
        )}

        {/* Search + Tag filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-accent/50" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {["All", ...CONTACT_TAGS, "Unsubscribed"].map((tag) => (
              <button key={tag} onClick={() => setFilterTag(tag)} className={["text-[10px] px-2.5 py-1 rounded-full border transition-colors", filterTag === tag ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white hover:border-white/25"].join(" ")}>
                {tag} {tagCounts[tag] !== undefined ? `(${tagCounts[tag]})` : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/25">
            <p className="text-sm">{contacts.length === 0 ? "No contacts yet — import a CSV or add one." : "No contacts match."}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0a1929] z-10">
              <tr className="border-b border-white/8">
                {["Name", "Email", "Phone", "Tags", "Added", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold tracking-widest uppercase text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const cext = c as Contact & { _id?: string; company?: string; city?: string };
                const rowId = cext._id ?? c.id;
                const isUnsub = c.unsubscribed || optOuts.includes(c.email.toLowerCase()) || c.tags?.includes("Unsubscribed");
                return (
                  <tr key={rowId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3 text-white/80 font-medium">{c.name || <span className="text-white/25 italic">—</span>}</td>
                    <td className="px-6 py-3 font-mono text-white/60">
                      {c.email}
                      {isUnsub && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold uppercase">Unsub</span>}
                    </td>
                    <td className="px-6 py-3 text-white/40">{c.phone || <span className="text-white/20">—</span>}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((t) => <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-full ${tagColor(t)}`}>{t}</span>)}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-white/30">{(c.createdAt ?? "").slice(0, 10)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(cext)} className="text-white/25 hover:text-white transition-colors" title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {deleteConfirm === rowId ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => deleteContact(rowId)} className="text-[10px] text-red-400 hover:text-red-300">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-white/30 hover:text-white">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirm(rowId)} className="text-white/25 hover:text-red-400 transition-colors" title="Delete">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Add Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-navy border border-white/10 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <p className="text-white font-semibold text-sm">{isNew ? "Add Contact" : "Edit Contact"}</p>
              <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Full Name</label>
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="field-input" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="field-input" placeholder="555-123-4567" />
                </div>
              </div>
              <div>
                <label className="field-label">Email *</label>
                <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="field-input" placeholder="jane@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Company</label>
                  <input value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} className="field-input" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="field-label">City</label>
                  <input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="field-input" placeholder="Houston" />
                </div>
              </div>
              <div>
                <label className="field-label">Tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {CONTACT_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const has = editing.tags.includes(t);
                        setEditing({ ...editing, tags: has ? editing.tags.filter((x) => x !== t) : [...editing.tags, t] });
                      }}
                      className={["text-[10px] px-2.5 py-1 rounded-full border transition-colors", editing.tags.includes(t) ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white"].join(" ")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">Notes</label>
                <textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="field-input resize-none" rows={2} placeholder="Any notes about this contact…" />
              </div>
              {!isNew && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.unsubscribed} onChange={(e) => setEditing({ ...editing, unsubscribed: e.target.checked })} className="accent-accent" />
                  <span className="text-xs text-white/50">Mark as unsubscribed</span>
                </label>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={saveEditing}
                disabled={saving || !editing.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)}
                className="px-5 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving…" : isNew ? "Add Contact" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={["fixed bottom-6 right-6 px-4 py-3 rounded-xl text-xs font-medium shadow-xl z-[100]", toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"].join(" ")}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
