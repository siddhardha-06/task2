
let tasks = [];

function renderTasks() {
    const task_list = document.getElementById("tasklist");
    task_list.innerHTML = "";
    // Group tasks by due date (YYYY-MM-DD). Tasks without dueDate go to 'unscheduled'.
    const groups = new Map();
    tasks.forEach((t, idx) => {
        const key = t.dueDate ? (new Date(t.dueDate)).toISOString().slice(0,10) : 'unscheduled';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({task: t, index: idx});
    });

    // compute uncompleted counts per group
    const uncompletedCount = new Map();
    groups.forEach((list, key) => {
        const cnt = list.reduce((s, it) => s + (it.task && it.task.completed ? 0 : 1), 0);
        uncompletedCount.set(key, cnt);
    });

    // sort keys: put groups with zero uncompleted tasks at the end; otherwise date ascending, with 'unscheduled' last
    const keys = Array.from(groups.keys()).sort((a,b) => {
        const ca = uncompletedCount.get(a) || 0;
        const cb = uncompletedCount.get(b) || 0;
        if (ca === 0 && cb !== 0) return 1; // a after b
        if (cb === 0 && ca !== 0) return -1; // a before b
        if (a === 'unscheduled') return 1;
        if (b === 'unscheduled') return -1;
        return new Date(a) - new Date(b);
    });

    function formatDateHeader(isoDate) {
        if (isoDate === 'unscheduled') return 'Unscheduled';
        const d = new Date(isoDate + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        function isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
        if (isSameDay(d, today)) return 'Today';
        if (isSameDay(d, tomorrow)) return 'Tomorrow';
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    keys.forEach(key => {
        const list = groups.get(key);
        // date header with toggle
        const headerLi = document.createElement('li');
        headerLi.className = 'date-header';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'date-header-left';

        const title = document.createElement('span');
        title.textContent = formatDateHeader(key);

        // chevron toggle button (will be placed at right side)
        const input = document.createElement('button');
        input.className = 'chev';
        const expanded = !getCollapsedState(key);
        input.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        // broader V shape using inline SVG for consistent rendering
        input.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 8 L12 18 L20 8" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (!expanded) input.classList.add('collapsed');

        headerLeft.appendChild(title);
        headerLi.appendChild(headerLeft);
        // right-side container for count and toggle so they stay together
        const headerRight = document.createElement('div');
        headerRight.className = 'date-header-right';
        const countBadge = document.createElement('span');
        countBadge.className = 'group-count';
        const cnt = uncompletedCount.get(key) || 0;
        countBadge.textContent = String(cnt);
        if (cnt === 0) countBadge.classList.add('muted');
        headerRight.appendChild(countBadge);
        headerRight.appendChild(input);
        headerLi.appendChild(headerRight);

        task_list.appendChild(headerLi);

        // group container
        const groupUl = document.createElement('ul');
        groupUl.className = 'group-list';
        if (!expanded) groupUl.style.display = 'none';

        // sort items in this group by time (earliest first). For unscheduled, keep original order.
        if (key !== 'unscheduled') {
            list.sort((a,b) => new Date(a.task.dueDate) - new Date(b.task.dueDate));
        }

        list.forEach(({task, index}) => {
            const li = document.createElement('li');
            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.flexDirection = 'row';
            left.style.alignItems = 'center';
            left.style.gap = '12px';

            const meta = document.createElement('small');
            meta.className = 'task-meta';
            try {
                meta.textContent = '';
                meta.classList.remove('overdue');
                if (task.dueDate) {
                    const due = new Date(task.dueDate);
                    // show time only
                    meta.textContent = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                    meta.title = due.toString();
                    if (due.getTime() < Date.now()) meta.classList.add('overdue');
                }
            } catch (e) {
                meta.textContent = '';
            }

            const span = document.createElement('span');
            span.className = 'task-text';
            span.textContent = task.text;

            left.appendChild(meta);
            left.appendChild(span);

            const actions = document.createElement('div');
            actions.className = 'task-actions';

            // status button (Pending / Completed)
            const statusBtn = document.createElement('button');
            statusBtn.className = 'status-btn';
            statusBtn.textContent = task.completed ? 'Completed' : 'Pending';
            if (task.completed) {
                li.classList.add('completed');
                statusBtn.classList.add('completed');
            }
            statusBtn.onclick = () => {
                const idxToToggle = tasks.findIndex(x => x.createdAt === task.createdAt && x.text === task.text && (x.dueDate||null) === (task.dueDate||null));
                if (idxToToggle !== -1) {
                    tasks[idxToToggle].completed = !tasks[idxToToggle].completed;
                    saveToLocalStorage();
                    renderTasks();
                }
            };

            const del = document.createElement('button');
            del.textContent = 'Delete';
            // find current index in tasks array (task objects may have shifted), so remove by matching createdAt+text
            del.onclick = () => {
                const idxToRemove = tasks.findIndex(x => x.createdAt === task.createdAt && x.text === task.text && (x.dueDate||null) === (task.dueDate||null));
                if (idxToRemove !== -1) removeTask(idxToRemove);
            };
            actions.appendChild(statusBtn);
            actions.appendChild(del);

            li.appendChild(left);
            li.appendChild(actions);
            groupUl.appendChild(li);
        });

        task_list.appendChild(groupUl);

        // toggle behavior and persist state
        input.addEventListener('click', () => {
            const isCollapsed = input.classList.toggle('collapsed');
            input.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
            groupUl.style.display = isCollapsed ? 'none' : '';
            setCollapsedState(key, isCollapsed);
        });
    });
}

function sortTasks() {
    tasks.sort((a, b) => {
        // both have dueDate -> earliest first
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        // a has dueDate -> a first
        if (a.dueDate && !b.dueDate) return -1;
        // b has dueDate -> b first
        if (!a.dueDate && b.dueDate) return 1;
        // neither has dueDate -> newest first by createdAt
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

// collapsed state persistence
function getCollapsedStateMap(){
    try{
        const raw = localStorage.getItem('collapsedGroups');
        return raw ? JSON.parse(raw) : {};
    } catch(e){ return {}; }
}

function setCollapsedStateMap(map){
    try{ localStorage.setItem('collapsedGroups', JSON.stringify(map)); }catch(e){}
}

function getCollapsedState(key){
    const map = getCollapsedStateMap();
    return !!map[key];
}

function setCollapsedState(key, value){
    const map = getCollapsedStateMap();
    map[key] = !!value;
    setCollapsedStateMap(map);
}

function removeTask(index) {
    tasks.splice(index, 1);
    renderTasks();
    saveToLocalStorage();
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadFromLocalStorage() {
    const raw = localStorage.getItem('tasks');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // support legacy array of strings or new array of objects
            if (Array.isArray(parsed)) {
                tasks = parsed.map(item => {
                    if (typeof item === 'string') return { text: item, createdAt: new Date().toISOString(), dueDate: null, completed: false };
                    if (item && item.text) return { text: item.text, createdAt: item.createdAt || new Date().toISOString(), dueDate: item.dueDate || null, completed: !!item.completed };
                    return null;
                }).filter(Boolean);
            } else {
                tasks = [];
            }
            sortTasks();
        } catch (e) {
            tasks = [];
        }
    }
    renderTasks();
}

function add_task(){
    const inp = document.getElementById("newtask");
    if (!inp.value) return;
    const dueInput = document.getElementById('duedate');
    const dueVal = dueInput && dueInput.value ? new Date(dueInput.value).toISOString() : null;
    const taskObj = { text: inp.value, createdAt: new Date().toISOString(), dueDate: dueVal, completed: false };
    tasks.push(taskObj);
    inp.value = "";
    if (dueInput) dueInput.value = '';
    sortTasks();
    renderTasks();
    saveToLocalStorage();
}

function loadFromLocalFileFallback() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (Array.isArray(parsed)) {
                    tasks = parsed.map(item => {
                        if (typeof item === 'string') return { text: item, createdAt: new Date().toISOString(), dueDate: null, completed: false };
                        if (item && item.text) return { text: item.text, createdAt: item.createdAt || new Date().toISOString(), dueDate: item.dueDate || null, completed: !!item.completed };
                        return null;
                    }).filter(Boolean);
                } else {
                    alert('Imported JSON should be an array of tasks.');
                    return;
                }
                sortTasks();
                renderTasks();
                saveToLocalStorage();
                alert('Loaded tasks from file.');
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    const inp = document.getElementById('newtask');
    if (inp) {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                add_task();
            }
        });
    }
});

// expose functions for onclick attributes
window.add_task = add_task;
// Note: File System Access API (save/load to folder) removed for cross-browser compatibility.

// Export tasks as a downloadable JSON file (cross-browser)
function exportTasks() {
    try {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed: ' + err.message);
    }
}

// Import tasks from a JSON file (cross-browser)
function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!Array.isArray(parsed)) {
                    alert('Imported file should contain a JSON array of tasks.');
                    return;
                }
                // normalize imported items to task objects if needed
                if (Array.isArray(parsed)) {
                    tasks = parsed.map(item => {
                        if (typeof item === 'string') return { text: item, createdAt: new Date().toISOString(), dueDate: null, completed: false };
                        if (item && item.text) return { text: item.text, createdAt: item.createdAt || new Date().toISOString(), dueDate: item.dueDate || null, completed: !!item.completed };
                        return null;
                    }).filter(Boolean);
                } else {
                    tasks = [];
                }
                sortTasks();
                renderTasks();
                saveToLocalStorage();
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

window.exportTasks = exportTasks;
window.importTasks = importTasks;