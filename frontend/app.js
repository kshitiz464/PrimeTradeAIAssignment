const API_BASE = "/api/v1";

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem("access_token");
}

function setToken(token) {
    localStorage.setItem("access_token", token);
}

function clearToken() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
}

function showMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `message ${isError ? "error" : "success"}`;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
}

function showView(viewId) {
    document.getElementById("auth-view").style.display = "none";
    document.getElementById("dashboard-view").style.display = "none";
    document.getElementById(viewId).style.display = viewId === "auth-view" ? "flex" : "block";
}

function switchTab(tab) {
    document.getElementById("login-form").style.display = tab === "login" ? "block" : "none";
    document.getElementById("register-form").style.display = tab === "register" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
        btn.classList.toggle("active", (tab === "login" && i === 0) || (tab === "register" && i === 1));
    });
}

// ─── AUTHENTICATED FETCH WRAPPER ──────────────────────────────────────

async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
    });

    // Token expired or invalid
    if (response.status === 401) {
        clearToken();
        showView("auth-view");
        return null;
    }

    // 204 No Content — don't try to parse JSON
    if (response.status === 204) {
        return { ok: true };
    }

    const data = await response.json();

    if (!response.ok) {
        const message = Array.isArray(data.detail)
            ? data.detail.map(e => e.msg).join(", ")
            : (data.detail || "Something went wrong");
        throw new Error(message);
    }

    return data;
}

// ─── AUTH HANDLERS ────────────────────────────────────────────────────

async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showMessage("auth-message", "Please fill in all fields", true);
        return;
    }

    try {
        // Login uses form data (not JSON) — OAuth2 standard
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Login failed");
        }

        setToken(data.access_token);
        localStorage.setItem("user_email", email);
        await initDashboard();

    } catch (err) {
        showMessage("auth-message", err.message, true);
    }
}

async function handleRegister() {
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!email || !password) {
        showMessage("auth-message", "Please fill in all fields", true);
        return;
    }

    try {
        await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        showMessage("auth-message", "Account created! Please log in.", false);
        switchTab("login");

    } catch (err) {
        showMessage("auth-message", err.message, true);
    }
}

function handleLogout() {
    clearToken();
    showView("auth-view");
}

// ─── DASHBOARD ────────────────────────────────────────────────────────

async function initDashboard() {
    showView("dashboard-view");
    const email = localStorage.getItem("user_email") || "User";
    document.getElementById("user-email").textContent = email;
    await loadTasks();
}

// ─── TASK HANDLERS ────────────────────────────────────────────────────

async function loadTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "<p class='loading'>Loading tasks...</p>";

    try {
        const tasks = await apiFetch("/tasks/");
        if (!tasks) return;

        if (tasks.length === 0) {
            taskList.innerHTML = "<p class='empty'>No tasks yet. Create your first one above!</p>";
            return;
        }

        taskList.innerHTML = tasks.map(renderTask).join("");

    } catch (err) {
        taskList.innerHTML = `<p class='error-text'>Failed to load tasks: ${err.message}</p>`;
    }
}

function renderTask(task) {
    const statusClass = {
        pending: "status-pending",
        in_progress: "status-progress",
        completed: "status-done"
    }[task.status] || "status-pending";

    const statusLabel = task.status.replace("_", " ");

    return `
        <div class="task-card" id="task-${task.id}">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ""}
            <div class="task-actions">
                <button class="btn btn-small btn-outline" onclick="openEditModal('${task.id}', '${escapeHtml(task.title)}', '${escapeHtml(task.description || "")}', '${task.status}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="handleDeleteTask('${task.id}')">Delete</button>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

async function handleCreateTask() {
    const title = document.getElementById("task-title").value.trim();
    const description = document.getElementById("task-description").value.trim();
    const status = document.getElementById("task-status").value;

    if (!title) {
        showMessage("task-message", "Title is required", true);
        return;
    }

    try {
        await apiFetch("/tasks/", {
            method: "POST",
            body: JSON.stringify({ title, description: description || null, status })
        });

        document.getElementById("task-title").value = "";
        document.getElementById("task-description").value = "";
        document.getElementById("task-status").value = "pending";

        showMessage("task-message", "Task created!", false);
        await loadTasks();

    } catch (err) {
        showMessage("task-message", err.message, true);
    }
}

function openEditModal(id, title, description, status) {
    document.getElementById("edit-task-id").value = id;
    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = description;
    document.getElementById("edit-status").value = status;
    document.getElementById("edit-modal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

async function handleUpdateTask() {
    const id = document.getElementById("edit-task-id").value;
    const title = document.getElementById("edit-title").value.trim();
    const description = document.getElementById("edit-description").value.trim();
    const status = document.getElementById("edit-status").value;

    if (!title) {
        alert("Title cannot be empty");
        return;
    }

    try {
        await apiFetch(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify({ title, description: description || null, status })
        });

        closeEditModal();
        await loadTasks();

    } catch (err) {
        alert(`Update failed: ${err.message}`);
    }
}

async function handleDeleteTask(id) {
    if (!confirm("Delete this task?")) return;

    try {
        await apiFetch(`/tasks/${id}`, { method: "DELETE" });
        await loadTasks();
    } catch (err) {
        alert(`Delete failed: ${err.message}`);
    }
}

// ─── ON PAGE LOAD ─────────────────────────────────────────────────────

window.addEventListener("load", () => {
    if (getToken()) {
        initDashboard();
    } else {
        showView("auth-view");
    }
});