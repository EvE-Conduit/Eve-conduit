"""A window for seat_import: pick a SeAT dump, choose users, preview, import. Built into the Windows .exe."""

from __future__ import annotations

import os
import queue
import sys
import threading
import traceback
import tkinter as tk
from datetime import datetime
from tkinter import filedialog, messagebox, ttk
from tkinter.scrolledtext import ScrolledText

import seat_import as core

TITLE = "EvE Conduit - SeAT import"


def checkbox(ticked: bool, size: int = 14) -> tk.PhotoImage:
    """A drawn tick box: the box characters are missing from some fonts."""
    img = tk.PhotoImage(width=size, height=size)
    edge = "#2b5797" if ticked else "#7a7a7a"
    img.put(edge, to=(0, 0, size, size))
    img.put("#2b5797" if ticked else "#ffffff", to=(1, 1, size - 1, size - 1))
    if ticked:
        for x, y in ((3, 6), (4, 7), (5, 8), (6, 7), (7, 6), (8, 5), (9, 4), (10, 3)):
            img.put("#ffffff", to=(x, y, x + 1, y + 3))
    return img


class App:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.events: queue.Queue = queue.Queue()
        self.busy = False
        self.http = core.urllib.request.urlopen
        self.conduit = None
        self.info: dict = {}
        self.users: list[core.User] = []
        self.squads: list[core.Squad] = []
        self.selected: set[int] = set()
        self.shown: list[core.User] = []

        root.title(f"{TITLE} {core.VERSION}")
        self.on, self.off = checkbox(True), checkbox(False)
        root.minsize(860, 640)
        pad = {"padx": 8, "pady": 4}

        source = ttk.LabelFrame(root, text="1. SeAT database dump")
        source.pack(fill="x", **pad)
        self.dump = tk.StringVar()
        ttk.Entry(source, textvariable=self.dump).pack(side="left", fill="x", expand=True, padx=6, pady=6)
        ttk.Button(source, text="Browse...", command=self.browse).pack(side="left", padx=6)

        target = ttk.LabelFrame(root, text="2. EvE Conduit")
        target.pack(fill="x", **pad)
        target.columnconfigure(1, weight=1)
        self.url = tk.StringVar()
        self.key = tk.StringVar()
        ttk.Label(target, text="Address (as you open it)").grid(row=0, column=0, sticky="w", padx=6, pady=3)
        ttk.Entry(target, textvariable=self.url).grid(row=0, column=1, sticky="ew", padx=6)
        ttk.Label(target, text="API key (import:seat)").grid(row=1, column=0, sticky="w", padx=6, pady=3)
        ttk.Entry(target, textvariable=self.key, show="•").grid(row=1, column=1, sticky="ew", padx=6)
        self.tokens = tk.BooleanVar(value=True)
        self.inactive = tk.BooleanVar(value=False)
        self.auto_squads = tk.BooleanVar(value=False)
        self.same_app = tk.BooleanVar(value=False)
        opts = ttk.Frame(target)
        opts.grid(row=2, column=0, columnspan=2, sticky="w", padx=2, pady=3)
        ttk.Checkbutton(opts, text="Copy SSO tokens", variable=self.tokens, command=self.refresh).pack(side="left", padx=4)
        ttk.Checkbutton(opts, text="Include users disabled in SeAT", variable=self.inactive,
                        command=self.refilter).pack(side="left", padx=4)
        ttk.Checkbutton(opts, text="Import automatic squads", variable=self.auto_squads).pack(side="left", padx=4)
        self.same_app_box = ttk.Checkbutton(target, variable=self.same_app, command=self.refresh,
                                            text="SeAT uses the same EVE application as Conduit")
        self.same_app_box.grid(row=3, column=0, columnspan=2, sticky="w", padx=6, pady=3)
        self.load_button = ttk.Button(target, text="Load", command=self.load)
        self.load_button.grid(row=0, column=2, rowspan=2, padx=6)

        people = ttk.LabelFrame(root, text="3. Users to import")
        people.pack(fill="both", expand=True, **pad)
        bar = ttk.Frame(people)
        bar.pack(fill="x", padx=6, pady=4)
        ttk.Label(bar, text="Search").pack(side="left")
        self.search = tk.StringVar()
        self.search.trace_add("write", lambda *_: self.refilter())
        ttk.Entry(bar, textvariable=self.search, width=30).pack(side="left", padx=6)
        ttk.Button(bar, text="Select all shown", command=lambda: self.mark(True)).pack(side="left", padx=2)
        ttk.Button(bar, text="Clear shown", command=lambda: self.mark(False)).pack(side="left", padx=2)
        self.count = ttk.Label(bar, text="")
        self.count.pack(side="right")
        frame = ttk.Frame(people)
        frame.pack(fill="both", expand=True, padx=6, pady=(0, 6))
        self.tree = ttk.Treeview(frame, columns=("user", "chars", "note"), show="tree headings", selectmode="none")
        self.tree.column("#0", width=40, stretch=False)
        for col, text, width, stretch in (("user", "User (SeAT main)", 260, True),
                                          ("chars", "Characters", 400, True), ("note", "", 130, False)):
            self.tree.heading(col, text=text, anchor="w")
            self.tree.column(col, width=width, stretch=stretch, anchor="w")
        self.tree.tag_configure("on", background="#dce8f7")
        scroll = ttk.Scrollbar(frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side="left", fill="both", expand=True)
        scroll.pack(side="left", fill="y")
        self.tree.bind("<Button-1>", self.toggle)
        self.tree.bind("<space>", self.toggle)

        run = ttk.LabelFrame(root, text="4. Import")
        run.pack(fill="both", **pad)
        buttons = ttk.Frame(run)
        buttons.pack(fill="x", padx=6, pady=4)
        self.preview_button = ttk.Button(buttons, text="Preview", command=self.preview)
        self.preview_button.pack(side="left")
        self.import_button = ttk.Button(buttons, text="Import", command=self.do_import)
        self.import_button.pack(side="left", padx=6)
        self.history_button = ttk.Button(buttons, text="Import character data", command=self.do_history)
        self.history_button.pack(side="left")
        self.progress = ttk.Progressbar(buttons, mode="determinate")
        self.progress.pack(side="left", fill="x", expand=True, padx=6)
        self.log = ScrolledText(run, height=9, state="disabled", wrap="word", font="TkDefaultFont")
        self.log.pack(fill="both", expand=True, padx=6, pady=(0, 6))

        self.say("Make a dump of SeAT's database, create an API key with the import:seat scope in Conduit "
                 "(Administration -> API, with the SeAT import API switched on), then Load.")
        self.refresh()
        root.after(100, self.pump)

    # --- plumbing ---------------------------------------------------------------------------------------------

    def say(self, text: str):
        self.log.configure(state="normal")
        self.log.insert("end", text + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def work(self, job, done):
        """Run ``job`` off the UI thread; ``done(result)`` runs back on it."""
        self.busy = True
        self.progress.configure(mode="indeterminate")
        self.progress.start(12)
        self.refresh()
        say = lambda text: self.events.put(("say", text))  # noqa: E731

        def target():
            try:
                self.events.put(("done", done, job(say)))
            except core.ImportError_ as exc:
                self.events.put(("error", str(exc)))
            except Exception as exc:  # anything unexpected still ends the job cleanly, with where it happened
                where = traceback.extract_tb(exc.__traceback__)[-1]
                self.events.put(("error", f"{type(exc).__name__}: {exc} ({os.path.basename(where.filename)} "
                                          f"line {where.lineno}, version {core.VERSION})"))
        threading.Thread(target=target, daemon=True).start()

    def pump(self):
        try:
            while True:
                event = self.events.get_nowait()
                if event[0] == "say":
                    self.say(event[1])
                    continue
                self.busy = False
                self.progress.stop()
                self.progress.configure(mode="determinate", value=0)
                if event[0] == "done":
                    event[1](event[2])
                else:
                    self.say(event[1])
                    messagebox.showerror(TITLE, event[1])
                self.refresh()
        except queue.Empty:
            pass
        self.root.after(100, self.pump)

    def refresh(self):
        idle = "disabled" if self.busy else "normal"
        self.load_button.configure(state=idle)
        ready = not self.busy and self.conduit is not None and bool(self.selected)
        self.preview_button.configure(state="normal" if ready else "disabled")
        tokens_ok = not self.tokens.get() or self.same_app.get()
        self.import_button.configure(state="normal" if ready and tokens_ok else "disabled")
        self.history_button.configure(state="normal" if ready else "disabled")
        if self.info:
            self.same_app_box.configure(
                text=f"SeAT uses the same EVE application as Conduit (client id {self.info['client_id']})")
        self.same_app_box.configure(state="normal" if self.tokens.get() else "disabled")
        self.count.configure(text=f"{len(self.selected)} selected of {len(self.visible())}")

    # --- choosing ---------------------------------------------------------------------------------------------

    def browse(self):
        path = filedialog.askopenfilename(title="SeAT database dump",
                                          filetypes=[("SQL dump", "*.sql"), ("All files", "*.*")])
        if path:
            self.dump.set(path)

    def visible(self) -> list[core.User]:
        return [u for u in self.users if u.active or self.inactive.get()]

    def refilter(self):
        text = self.search.get().strip()
        allowed = self.visible()
        ids = {u.seat_id for u in allowed}
        self.selected &= ids
        self.shown = [u for u in allowed if not text or u.matches(text)]
        self.tree.delete(*self.tree.get_children())
        for u in self.shown:
            names = ", ".join(c.name for c in u.characters)
            note = "" if u.active else "disabled in SeAT"
            self.tree.insert("", "end", iid=str(u.seat_id), values=(u.name, f"{len(u.characters)}: {names}", note))
            self.paint(u.seat_id)
        self.refresh()

    def toggle(self, event):
        if event.type == tk.EventType.ButtonPress:
            if self.tree.identify_region(event.x, event.y) == "heading":
                return
            row = self.tree.identify_row(event.y)
        else:
            row = self.tree.focus()
        if not row:
            return
        seat_id = int(row)
        self.selected ^= {seat_id}
        self.paint(seat_id)
        self.tree.focus(row)
        self.refresh()

    def paint(self, seat_id: int):
        on = seat_id in self.selected
        self.tree.item(str(seat_id), image=self.on if on else self.off, tags=("on",) if on else ())

    def mark(self, on: bool):
        for u in self.shown:
            (self.selected.add if on else self.selected.discard)(u.seat_id)
            self.paint(u.seat_id)
        self.refresh()

    def chosen(self) -> list[core.User]:
        return [u for u in self.users if u.seat_id in self.selected]

    # --- steps ------------------------------------------------------------------------------------------------

    def load(self):
        path, url, key = self.dump.get().strip(), self.url.get().strip(), self.key.get()
        if not path:
            messagebox.showinfo(TITLE, "Choose the SeAT dump first.")
            return
        if not url:
            messagebox.showinfo(TITLE, "Enter Conduit's address, e.g. https://auth.example.com.")
            return
        allow_http = False
        if url.startswith("http://") and not _is_local(url):
            if not messagebox.askyesno(TITLE, "This address is plain http://, so the API key and the SSO tokens "
                                              "travel unencrypted. Fine on your own network for a test install; "
                                              "not across the internet.\n\nContinue?", icon="warning"):
                return
            allow_http = True

        def job(say):
            say(f"Reading {os.path.basename(path)}...")
            users, squads = core.read_dump(path, with_tokens=True)
            say(f"  {len(users)} users with characters, {sum(len(u.characters) for u in users)} characters, "
                f"{len(squads)} squads.")
            say(f"Connecting to {url}...")
            conduit, info = core.connect(url, key, allow_http=allow_http, http=self.http)
            say(f"  Conduit {info['version']}, {info['users']} users so far, EVE client id {info['client_id']}.")
            return users, squads, conduit, info

        def done(result):
            self.users, self.squads, self.conduit, self.info = result
            self.selected.clear()
            self.refilter()
            if not self.info["sso_configured"]:
                self.say("Conduit has no EVE application set up yet; only an import without tokens can work.")
            self.say("Tick the users to import (search, then 'Select all shown' for many at once), then Preview.")
        self.work(job, done)

    def preview(self):
        chosen = self.chosen()
        tokens = self.tokens.get()

        def job(say):
            say(f"Previewing {len(chosen)} users (no tokens are sent for this)...")
            return core.preview_lines(core.preview_users(self.conduit, chosen), tokens)

        self.work(job, lambda lines: [self.say(line) for line in lines])

    def do_import(self):
        chosen = self.chosen()
        tokens = self.tokens.get()
        if tokens:
            problem = core.client_id_problem(self.info, "")
            if problem:
                messagebox.showerror(TITLE, problem)
                return
        chars = sum(len(u.characters) for u in chosen)
        what = "with their SSO tokens" if tokens else "without tokens (members log in again once)"
        if not messagebox.askyesno(TITLE, f"Import {len(chosen)} users and {chars} characters {what}?"):
            return
        dump, url, auto = self.dump.get().strip(), self.url.get().strip(), self.auto_squads.get()

        def job(say):
            say(f"Importing {len(chosen)} users...")
            results = core.import_users(self.conduit, chosen, tokens, say)
            report = {"started": datetime.now().isoformat(timespec="seconds"), "conduit": url,
                      "tokens_copied": tokens, "users": results, "squads": [], "tokens": None}
            say("Squads...")
            report["squads"] = core.import_squads(self.conduit, self.squads, chosen, auto, say)
            if tokens:
                report["tokens"] = core.verify(self.conduit, chosen, results, say)
            name = f"seat-import-report-{datetime.now():%Y%m%d-%H%M%S}.json"
            return core.write_report(os.path.join(os.path.dirname(os.path.abspath(dump)), name), report)

        def done(report_path):
            self.say(f"Done. Report (no tokens in it): {report_path}")
            self.say("Next, 'Import character data' brings over their wallets, mail, skills, assets and the rest "
                     "(it needs a full dump of SeAT's database). Delete the dump when you're finished.")
        self.work(job, done)

    def do_history(self):
        chosen = self.chosen()
        ids = [c.id for u in chosen for c in u.characters]
        if not messagebox.askyesno(
                TITLE, f"Bring over everything SeAT has for the {len(ids)} characters of the {len(chosen)} ticked "
                       "users: wallet history, mail, killmails, contracts, skills, assets and the rest?\n\n"
                       "Import their accounts first. This needs a full dump of SeAT's database; the tables Conduit "
                       "needs are sent to it compressed, which can take a while for a big dump.\n\n"
                       "Running it again later is safe: nothing is added twice."):
            return
        dump = self.dump.get().strip()

        def job(say):
            return core.upload_history(self.conduit, dump, say, ids)

        def done(summary):
            for line in core.history_lines(summary):
                self.say(line)
            self.offer_delete(dump)
        self.work(job, done)

    def offer_delete(self, dump: str):
        if not os.path.exists(dump):
            return
        if messagebox.askyesno(TITLE, "Import finished.\n\nDelete the SeAT dump now? It holds working logins for "
                                      "every character in it.\n\nKeep it only if you still need to import more "
                                      "users or character data from it.", icon="warning"):
            try:
                os.remove(dump)
                self.say(f"Deleted {dump}.")
            except OSError as exc:
                self.say(f"Could not delete {dump}: {exc.strerror}")
        else:
            self.say(f"Remember to delete {dump} when you're finished.")


def _is_local(url: str) -> bool:
    from urllib.parse import urlsplit

    return urlsplit(url).hostname in ("localhost", "127.0.0.1", "::1")


def main():
    if sys.platform == "win32":
        try:  # sharp text on high-DPI screens
            import ctypes

            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
