# TO-DO LIST (Task2)

This is a small offline-capable To-Do List web app built with plain HTML/CSS/JavaScript.

**Features**

- Add tasks with an optional due date/time.
- Tasks are grouped by due date (Today, Tomorrow, specific days, Unscheduled).
- Each date group shows a count of uncompleted tasks and a chevron toggle to collapse/expand the group.
- Mark tasks as Completed / Pending.
- Delete tasks.
- Offline persistence via `localStorage` and Export/Import via `tasks.json`.
- Responsive, clean UI with visual indicators for overdue tasks.

**How to run (recommended)**

Serve the project folder locally (so the app works reliably in the browser):

```powershell
# from the project folder
python -m http.server 8000
# then open http://localhost:8000/main.html in Chrome/Edge
```

Or open `main.html` directly in your browser (some features like folder auto-save were removed for cross-browser compatibility).

**Usage**

- Enter a task in the input and optionally pick a due date/time, then click `Add` or press Enter.
- Use the yellow `Pending`/green `Completed` pill to toggle task status.
- Use the small blue badge next to each date to see how many tasks remain uncompleted for that date.
- Use `Export` to download `tasks.json` and `Import` to load from a file.

**Files of interest**

- `main.html` — UI markup
- `main.css` — styles
- `main.js` — app logic (tasks stored in `localStorage`)

**Screenshot / Output**

Below is an embedded snapshot placeholder (if you want a real screenshot, replace `output.png` with a real image file in the repo):


![Output](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=)


**Notes & Next steps**

- The app persists to browser storage. For true filesystem auto-save you can wrap the app in Electron/Tauri or re-enable File System Access APIs (Chrome/Edge) if you serve via `localhost`.
- If you want the `output.png` replaced by a real screenshot, save a screenshot as `output.png` in this folder and it will be used by GitHub or other renderers.

---

If you'd like, I can:
- Add a real screenshot file `output.png` to the repo (capture the UI and save it), or
- Create a short demo GIF, or
- Add a `README` section about development/architecture.

Tell me what you'd prefer next.
