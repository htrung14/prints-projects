"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialPrinterEmail: string;
  printerEnvFallback: string | null;
  initialAdminEmails: string[];
  envAdminEmails: string[];
  currentSessionEmail: string;
};

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function SettingsForm({
  initialPrinterEmail,
  printerEnvFallback,
  initialAdminEmails,
  envAdminEmails,
  currentSessionEmail,
}: Props) {
  const router = useRouter();
  const [isPrinterPending, startPrinterTransition] = useTransition();
  const [isAdminsPending, startAdminsTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [printerValue, setPrinterValue] = useState(initialPrinterEmail);
  const [adminList, setAdminList] = useState<string[]>(initialAdminEmails);
  const [newAdmin, setNewAdmin] = useState("");
  const [printerMsg, setPrinterMsg] = useState<Msg>(null);
  const [adminsMsg, setAdminsMsg] = useState<Msg>(null);

  // --- Printer email ------------------------------------------------------
  const isPrinterDirty = printerValue.trim() !== initialPrinterEmail.trim();
  const printerEffective =
    printerValue.trim() || printerEnvFallback || "(not set — no printer email will be sent)";
  const savedPrinterAddress = initialPrinterEmail.trim() || printerEnvFallback || "";
  const canSendTest = savedPrinterAddress.length > 0;

  async function savePrinter() {
    setPrinterMsg(null);
    startPrinterTransition(async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ print_shop_email: printerValue.trim() || null }),
      });
      if (!res.ok) {
        const text = await res.text();
        setPrinterMsg({ kind: "err", text: text || `Save failed: ${res.status}` });
        return;
      }
      setPrinterMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }

  async function sendTest() {
    setPrinterMsg(null);
    startTestTransition(async () => {
      const res = await fetch("/api/admin/settings/test-email", { method: "POST" });
      let body: { ok?: boolean; to?: string; error?: string } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        // Non-JSON response — fall through to status-based error.
      }
      if (!res.ok) {
        setPrinterMsg({
          kind: "err",
          text: body.error || `Test email failed: ${res.status}`,
        });
        return;
      }
      setPrinterMsg({
        kind: "ok",
        text: `Test email sent to ${body.to ?? savedPrinterAddress}.`,
      });
    });
  }

  // --- Admin emails -------------------------------------------------------
  const envSet = new Set(envAdminEmails.map((e) => e.toLowerCase()));
  const normalizedList = adminList.map((e) => e.toLowerCase());
  const isAdminsDirty =
    normalizedList.length !== initialAdminEmails.length ||
    normalizedList.some((e, i) => e !== initialAdminEmails[i]);

  function addEmail() {
    const candidate = newAdmin.trim().toLowerCase();
    setAdminsMsg(null);
    if (!candidate) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      setAdminsMsg({ kind: "err", text: "Not a valid email." });
      return;
    }
    if (adminList.map((e) => e.toLowerCase()).includes(candidate)) {
      setAdminsMsg({ kind: "err", text: "Already in the list." });
      return;
    }
    setAdminList([...adminList, candidate]);
    setNewAdmin("");
  }

  function removeEmail(email: string) {
    setAdminsMsg(null);
    setAdminList(adminList.filter((e) => e.toLowerCase() !== email.toLowerCase()));
  }

  async function saveAdmins() {
    setAdminsMsg(null);
    startAdminsTransition(async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_emails: adminList }),
      });
      let body: { error?: string } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        // ignore
      }
      if (!res.ok) {
        setAdminsMsg({ kind: "err", text: body.error || `Save failed: ${res.status}` });
        return;
      }
      setAdminsMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }

  return (
    <>
      {/* --- Printer email ------------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Printer email</h2>
        <p className="text-sm text-ink-faint">
          Where the weekly batch email goes. Change takes effect immediately for the next
          &ldquo;Send batch to printer&rdquo; action.
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-faint">Email address</span>
          <input
            type="email"
            value={printerValue}
            onChange={(e) => setPrinterValue(e.target.value)}
            placeholder="michael@loupedigital.com"
            disabled={isPrinterPending}
            className="border-b border-ink-line bg-transparent py-2 text-ink-strong outline-none focus:border-ink-strong disabled:opacity-50"
          />
        </label>

        <p className="text-xs text-ink-faint">
          Effective: <span className="text-ink">{printerEffective}</span>
          {!printerValue.trim() && printerEnvFallback && (
            <>
              <br />
              <span>Using env fallback; save an empty string to force env.</span>
            </>
          )}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPrinterPending || !isPrinterDirty}
              onClick={savePrinter}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinterPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={isTesting || !canSendTest}
              onClick={sendTest}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTesting ? "Sending…" : "Send test email"}
            </button>
          </div>
          <p className="text-xs text-ink-faint">
            Sends to the saved address; save first if you changed it.
          </p>
        </div>

        {printerMsg && (
          <p
            className="text-sm"
            style={{
              color: printerMsg.kind === "err" ? "rgba(160,0,0,0.85)" : "rgba(0,100,0,0.85)",
            }}
          >
            {printerMsg.text}
          </p>
        )}
      </section>

      {/* --- Admin access ------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Admin access</h2>
        <p className="text-sm text-ink-faint">
          Email addresses allowed into <code>/admin</code>. Env-configured admins are always in the
          list and cannot be removed here — edit <code>ADMIN_EMAILS</code> in Vercel for those.
          Entries saved here take effect immediately.
        </p>

        {envAdminEmails.length > 0 ? (
          <div className="flex flex-col gap-2 rounded border border-ink-line p-3">
            <span className="text-xs uppercase tracking-wider text-ink-faint">From env</span>
            <ul className="flex flex-col gap-1 text-sm">
              {envAdminEmails.map((e) => (
                <li key={e} className="flex items-center justify-between gap-3">
                  <span className="text-ink-strong">{e}</span>
                  <span className="text-xs text-ink-faint">locked (env)</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 rounded border border-ink-line p-3">
          <span className="text-xs uppercase tracking-wider text-ink-faint">
            Added via this page
          </span>
          {adminList.length === 0 ? (
            <p className="text-sm text-ink-faint">None yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {adminList.map((e) => {
                const isEnv = envSet.has(e.toLowerCase());
                const isSelf = e.toLowerCase() === currentSessionEmail.toLowerCase();
                return (
                  <li key={e} className="flex items-center justify-between gap-3">
                    <span className="text-ink-strong">
                      {e}
                      {isSelf ? <span className="ml-2 text-xs text-ink-faint">(you)</span> : null}
                      {isEnv ? (
                        <span className="ml-2 text-xs text-ink-faint">(also in env)</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEmail(e)}
                      disabled={isAdminsPending}
                      className="text-xs underline underline-offset-4 text-ink-faint hover:text-ink disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1">
            <span className="text-xs text-ink-faint">Add email</span>
            <input
              type="email"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder="teammate@example.com"
              disabled={isAdminsPending}
              className="border-b border-ink-line bg-transparent py-2 text-ink-strong outline-none focus:border-ink-strong disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={addEmail}
            disabled={isAdminsPending || newAdmin.trim().length === 0}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isAdminsPending || !isAdminsDirty}
            onClick={saveAdmins}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdminsPending ? "Saving…" : "Save admin list"}
          </button>
          <p className="text-xs text-ink-faint">
            New admins still need to sign in via /admin/sign-in to get a session.
          </p>
        </div>

        {adminsMsg && (
          <p
            className="text-sm"
            style={{
              color: adminsMsg.kind === "err" ? "rgba(160,0,0,0.85)" : "rgba(0,100,0,0.85)",
            }}
          >
            {adminsMsg.text}
          </p>
        )}
      </section>
    </>
  );
}
