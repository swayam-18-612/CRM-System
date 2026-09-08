const modal = document.getElementById("customerModal");
const customerStorageKey = "corecrm-customers-v2";

function getCustomers() {
    return JSON.parse(localStorage.getItem(customerStorageKey) || "[]");
}

function saveCustomers(customers) {
    localStorage.setItem(customerStorageKey, JSON.stringify(customers));
}

function renderCustomers() {
    const tableBody = document.getElementById("customerTableBody");
    if (!tableBody) return;

    const customers = getCustomers();
    tableBody.innerHTML = customers.length ? customers.map(customer => `
        <tr>
            <td><div class="customer"><div class="customer-avatar ${customer.avatar}">${customer.initials}</div><div><strong>${customer.name}</strong><small>${customer.email}</small></div></div></td>
            <td>${customer.company}</td>
            <td><span class="badge active-status">${customer.status}</span></td>
            <td>${customer.value}</td>
            <td>${customer.contact}</td>
            <td><button class="delete-btn" data-customer-email="${customer.email}" aria-label="Delete ${customer.name}">Delete</button></td>
        </tr>`).join("") : `<tr><td colspan="6" class="empty-state">No customers yet. Add your first customer to get started.</td></tr>`;

    const countLabel = document.querySelector(".table-footer > span");
    if (countLabel) countLabel.textContent = customers.length ? `Showing 1 to ${customers.length} of ${customers.length} customers` : "Showing 0 to 0 of 0 customers";

    const activeCount = customers.filter(customer => customer.status === "Active").length;
    const pendingCount = customers.filter(customer => customer.status === "Pending").length;
    document.querySelector("[data-customer-stat='all']").textContent = customers.length;
    document.querySelector("[data-customer-stat='active']").textContent = activeCount;
    document.querySelector("[data-customer-stat='pending']").textContent = pendingCount;
    document.querySelector("[data-customer-stat='vip']").textContent = 0;
}

function deleteCustomer(email) {
    const customers = getCustomers().filter(customer => customer.email !== email);
    saveCustomers(customers);
    renderCustomers();
}

function exportCustomers() {
    const customers = getCustomers();
    const headers = ["Name", "Email", "Company", "Status", "Deal Value", "Last Contact"];
    const rows = customers.map(customer => [customer.name, customer.email, customer.company, customer.status, customer.value, customer.contact]);
    const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "customers.csv";
    link.click();
    URL.revokeObjectURL(link.href);
}

function openModal() {
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    if (modal) modal.style.display = "none";
}

window.addEventListener("click", function(event) {
    if (modal && event.target === modal) {
        closeModal();
    }

    const deleteButton = event.target.closest("[data-customer-email]");
    if (deleteButton) {
        deleteCustomer(deleteButton.dataset.customerEmail);
    }
});

function addCustomer(event) {

    event.preventDefault();

    const form = event.target;
    const name = document.getElementById("customerName").value.trim();
    const email = form.querySelector("input[type='email']").value.trim().toLowerCase();
    const company = form.querySelector("input[name='company']").value.trim();
    const dealValue = form.querySelector("#customerValue").value.trim();
    const customers = getCustomers();

    const alreadyExists = customers.some(customer =>
        customer.email.toLowerCase() === email || customer.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
        alert("A customer with this name or email already exists.");
        return;
    }

    const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
    customers.unshift({ name, email, company, status: "Active", value: dealValue ? `₹${dealValue}` : "₹0", contact: "Just now", initials, avatar: "a1" });
    saveCustomers(customers);
    renderCustomers();

    alert(name + " has been added successfully!");

    event.target.reset();

    closeModal();
}

renderCustomers();

const recordPageConfigs = {
    leads: {
        title: "Leads",
        description: "Qualify new prospects and move promising conversations forward.",
        recordLabel: "Lead",
        storageKey: "corecrm-leads",
        fields: [["name", "Lead name", "text"], ["email", "Email", "email"], ["company", "Company", "text"], ["source", "Source", "text"], ["score", "Score", "number"], ["owner", "Owner", "text"], ["status", "Status", "text"]]
    },
    opportunities: {
        title: "Opportunities",
        description: "Manage active deals from first proposal to final close.",
        recordLabel: "Opportunity",
        storageKey: "corecrm-opportunities",
        fields: [["name", "Opportunity name", "text"], ["company", "Company", "text"], ["stage", "Stage", "text"], ["value", "Deal value", "text"], ["owner", "Owner", "text"], ["lastContact", "Last contact", "text"]]
    },
    tasks: {
        title: "Tasks",
        description: "Stay on top of follow-ups, meetings, and team commitments.",
        recordLabel: "Task",
        storageKey: "corecrm-tasks",
        fields: [["title", "Task", "text"], ["details", "Details", "text"], ["priority", "Priority", "text"], ["owner", "Owner", "text"], ["due", "Due date", "text"]]
    },
    help: {
        title: "Help & Support",
        description: "Track the support requests you create for the CoreCRM team.",
        recordLabel: "Support Ticket",
        storageKey: "corecrm-support-tickets",
        fields: [["subject", "Subject", "text"], ["details", "Details", "text"], ["category", "Category", "text"], ["status", "Status", "text"]]
    }
};

function currentRecordPage() {
    const fileName = window.location.pathname.split("/").pop().toLowerCase();
    return fileName.replace(".html", "");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[character]));
}

function recordValues(config) {
    return JSON.parse(localStorage.getItem(config.storageKey) || "[]");
}

function saveRecordValues(config, records) {
    localStorage.setItem(config.storageKey, JSON.stringify(records));
}

function renderRecordPage(config) {
    const records = recordValues(config);
    const body = document.getElementById("recordTableBody");
    if (!body) return;

    body.innerHTML = records.length ? records.map((record, index) => `
        <tr>${config.fields.map((field, fieldIndex) => fieldIndex === 0
            ? `<td><div class="customer"><div class="customer-avatar a1">${escapeHtml(String(record[field[0]]).slice(0, 2).toUpperCase())}</div><div><strong>${escapeHtml(record[field[0]])}</strong>${record.email && !config.fields.some(item => item[0] === "email") ? `<small>${escapeHtml(record.email)}</small>` : ""}</div></div></td>`
            : `<td>${escapeHtml(record[field[0]])}</td>`).join("")}<td><button class="delete-btn" data-record-index="${index}" aria-label="Delete ${escapeHtml(record[config.fields[0][0]])}">Delete</button></td></tr>`).join("")
        : `<tr><td colspan="${config.fields.length + 1}" class="empty-state">No ${config.recordLabel.toLowerCase()}s yet. Add your first ${config.recordLabel.toLowerCase()} to get started.</td></tr>`;

    document.getElementById("recordCount").textContent = records.length;
    document.getElementById("recordCountDuplicate").textContent = records.length;
    document.getElementById("recordFooter").textContent = records.length ? `Showing 1 to ${records.length} of ${records.length} ${config.recordLabel.toLowerCase()}s` : `Showing 0 to 0 of 0 ${config.recordLabel.toLowerCase()}s`;
}

function setupRecordPage(config) {
    const content = document.querySelector(".content");
    if (!content) return;

    setTimeout(() => document.title = `${config.title} | CoreCRM`, 0);
    content.innerHTML = `<div class="page-heading"><div><h1>${config.title}</h1><p>${config.description}</p></div><button class="primary-btn" id="openRecordModal">+ Add ${config.recordLabel}</button></div>
        <div class="stats compact-stats"><div class="stat-card"><div class="stat-icon blue">＋</div><div><p>My ${config.recordLabel}s</p><h2 id="recordCount">0</h2><span class="positive">Your records</span></div></div><div class="stat-card"><div class="stat-icon green">✓</div><div><p>Active</p><h2>0</h2><span class="positive">Your records</span></div></div><div class="stat-card"><div class="stat-icon orange">◷</div><div><p>Pending</p><h2>0</h2><span class="negative">Your records</span></div></div><div class="stat-card"><div class="stat-icon purple">★</div><div><p>Total records</p><h2 id="recordCountDuplicate">0</h2><span class="positive">Your records</span></div></div></div>
        <div class="panel customers-panel"><div class="toolbar"><div class="filter-tabs"><button class="filter-tab active">All ${config.recordLabel}s</button></div><div class="toolbar-actions"><button class="outline-btn" id="exportRecords">Export</button></div></div><div class="table-container"><table><thead><tr>${config.fields.map(field => `<th>${field[1]}</th>`).join("")}<th>Action</th></tr></thead><tbody id="recordTableBody"></tbody></table></div><div class="table-footer"><span id="recordFooter">Showing 0 to 0 of 0 ${config.recordLabel.toLowerCase()}s</span></div></div>
        <div class="modal-overlay" id="recordModal"><div class="modal"><div class="modal-header"><h2>Add ${config.recordLabel}</h2><button type="button" id="closeRecordModal">×</button></div><form id="recordForm">${config.fields.map(field => `<label>${field[1]}</label><input name="${field[0]}" type="${field[2]}" required>`).join("")}<div class="modal-actions"><button type="button" class="outline-btn" id="cancelRecord">Cancel</button><button class="primary-btn">Add ${config.recordLabel}</button></div></form></div></div>`;

    const modalElement = document.getElementById("recordModal");
    const closeModalElement = () => modalElement.style.display = "none";
    document.getElementById("openRecordModal").onclick = () => modalElement.style.display = "flex";
    document.getElementById("closeRecordModal").onclick = closeModalElement;
    document.getElementById("cancelRecord").onclick = closeModalElement;
    modalElement.onclick = event => { if (event.target === modalElement) closeModalElement(); };
    document.getElementById("recordForm").onsubmit = event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const record = Object.fromEntries(config.fields.map(field => [field[0], formData.get(field[0]).trim()]));
        const records = recordValues(config);
        records.unshift(record);
        saveRecordValues(config, records);
        event.target.reset();
        closeModalElement();
        renderRecordPage(config);
    };
    document.getElementById("exportRecords").onclick = () => {
        const records = recordValues(config);
        const csv = [config.fields.map(field => field[1]), ...records.map(record => config.fields.map(field => record[field[0]]))]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        link.download = `${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    document.getElementById("recordTableBody").onclick = event => {
        const button = event.target.closest("[data-record-index]");
        if (!button) return;
        const records = recordValues(config);
        records.splice(Number(button.dataset.recordIndex), 1);
        saveRecordValues(config, records);
        renderRecordPage(config);
    };
    renderRecordPage(config);
}

function setupNonCustomerPage() {
    const config = recordPageConfigs[currentRecordPage()];
    if (config) setupRecordPage(config);
}

function setupReportsPage() {
    const generateButton = document.getElementById("generateReport");
    const exportButton = document.getElementById("exportReport");
    const reportPanel = document.getElementById("generatedReport");
    const reportBody = document.getElementById("generatedReportBody");
    const reportSummary = document.getElementById("generatedReportSummary");
    const periodSelect = document.getElementById("reportPeriod");
    if (!generateButton || !exportButton || !reportPanel || !reportBody || !reportSummary || !periodSelect) return;

    let generatedRows = [];
    const renderGeneratedRows = () => {
        reportBody.innerHTML = generatedRows.length
            ? generatedRows.map((row, index) => `<tr>${row.map(value => `<td>${value}</td>`).join("")}<td><button class="delete-btn" data-report-index="${index}" aria-label="Delete ${row[0]}">Delete</button></td></tr>`).join("")
            : `<tr><td colspan="4" class="empty-state">No report entries remain.</td></tr>`;
    };

    const generateSampleReport = () => {
        const period = periodSelect.value;
        generatedRows = [
            ["Total Revenue", "₹24.8L", "+18.4%"],
            ["Won Deals", "84", "+14.1%"],
            ["Conversion Rate", "34.6%", "+5.8%"],
            ["Average Sales Cycle", "21 days", "+1.6%"]
        ];
        renderGeneratedRows();
        reportSummary.textContent = `${period} performance summary generated from the current dashboard data.`;
        reportPanel.hidden = false;
    };

    const downloadGeneratedReport = () => {
        if (!generatedRows.length) return;
        const period = periodSelect.value;
        const csv = [["Metric", "Value", "Change"], ...generatedRows]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const link = document.createElement("a");
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = `corecrm-report-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    generateButton.addEventListener("click", () => {
        generateSampleReport();
        downloadGeneratedReport();
    });

    reportBody.addEventListener("click", event => {
        const deleteButton = event.target.closest("[data-report-index]");
        if (!deleteButton) return;
        generatedRows.splice(Number(deleteButton.dataset.reportIndex), 1);
        renderGeneratedRows();
    });

    exportButton.addEventListener("click", () => {
        if (!generatedRows.length) generateSampleReport();
        downloadGeneratedReport();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setupNonCustomerPage();
        setupReportsPage();
    });
} else {
    setupNonCustomerPage();
    setupReportsPage();
}

const authStorageKey = "corecrm-users";

function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem(authStorageKey) || "[]");
}

function showAuthMessage(elementId, message, isSuccess = false) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;
    messageElement.textContent = message;
    messageElement.classList.toggle("success", isSuccess);
}

function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const name = form.querySelector("#registerName").value.trim();
    const email = form.querySelector("#registerEmail").value.trim().toLowerCase();
    const password = form.querySelector("#registerPassword").value;
    const confirmPassword = form.querySelector("#confirmPassword").value;
    const users = getRegisteredUsers();

    if (password !== confirmPassword) {
        showAuthMessage("registerMessage", "Passwords do not match.");
        return;
    }

    if (users.some(user => user.email === email)) {
        showAuthMessage("registerMessage", "An account with this email already exists.");
        return;
    }

    users.push({ name, email, password });
    localStorage.setItem(authStorageKey, JSON.stringify(users));
    showAuthMessage("registerMessage", "Account created. Redirecting to login...", true);
    form.reset();
    setTimeout(() => window.location.href = "Login.html", 500);
}

function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.querySelector("#loginEmail").value.trim().toLowerCase();
    const password = form.querySelector("#loginPassword").value;
    const user = getRegisteredUsers().find(candidate => candidate.email === email && candidate.password === password);

    if (!user) {
        showAuthMessage("loginMessage", "Incorrect email or password.");
        return;
    }

    localStorage.setItem("corecrm-current-user", JSON.stringify({ name: user.name, email: user.email }));
    window.location.href = "dashboard.html";
}