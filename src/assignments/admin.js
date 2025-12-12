// --- Global Data Store ---
let assignments = [];
let editMode = false;
let editId = null;

// --- Element Selections ---
const assignmentForm = document.querySelector('#assignment-form');
const assignmentsTableBody = document.querySelector('#assignments-tbody');
const titleInput = document.querySelector('#assignment-title');
const descInput = document.querySelector('#assignment-description');
const dueDateInput = document.querySelector('#assignment-due-date');
const filesInput = document.querySelector('#assignment-files');
const submitBtn = document.querySelector('#add-assignment');



// --- Functions ---
function createAssignmentRow(assignment) {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.textContent = assignment.title;
    tr.appendChild(tdTitle);

    const tdDue = document.createElement('td');
    tdDue.textContent = assignment.due_date;
    tr.appendChild(tdDue);

    const tdActions = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.dataset.id = assignment.id;
    tdActions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = assignment.id;
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdActions);
    return tr;
}

function renderTable() {
    assignmentsTableBody.innerHTML = '';
    assignments.forEach(assignment => {
        assignmentsTableBody.appendChild(createAssignmentRow(assignment));
    });
}

async function handleAddAssignment(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const due_date = dueDateInput.value;
    const files = filesInput.value.split('\n').map(f => f.trim()).filter(f => f);

    if (editMode && editId) {
        // --- EDIT MODE ---
        const res = await fetch(`api/index.php?resource=assignments`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, title, description, due_date, files })
        });
        const result = await res.json();
        if (!result.success) {
            alert(result.message || 'Error updating assignment');
            return;
        }
        // Update local array
        const index = assignments.findIndex(a => a.id == editId);
        if (index > -1) {
            assignments[index] = { id: editId, title, description, due_date, files };
        }
        editMode = false;
        editId = null;
        submitBtn.textContent = 'Add Assignment';
    } else {
        // --- ADD NEW ---
        const res = await fetch('api/index.php?resource=assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, due_date, files })
        });
        const newAssignment = await res.json();
        if (!newAssignment.success) {
            alert(newAssignment.message || 'Error adding assignment');
            return;
        }
        assignments.push(newAssignment.data);
    }

    renderTable();
    assignmentForm.reset();
}

async function handleTableClick(event) {
    const id = event.target.dataset.id;

    if (event.target.classList.contains('delete-btn')) {
        const res = await fetch(`api/index.php?resource=assignments&id=${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            assignments = assignments.filter(a => a.id != id);
            renderTable();
        } else {
            alert(result.message || 'Error deleting assignment');
        }
    } else if (event.target.classList.contains('edit-btn')) {
        // --- FILL FORM FOR EDIT ---
        const assignment = assignments.find(a => a.id == id);
        if (!assignment) return;

        titleInput.value = assignment.title;
        descInput.value = assignment.description;
        dueDateInput.value = assignment.due_date;
        filesInput.value = assignment.files.join('\n');

        editMode = true;
        editId = id;
        submitBtn.textContent = 'Update Assignment';
        titleInput.focus();
    }
}

async function loadAndInitialize() {
    const res = await fetch('api/index.php?resource=assignments');
    const data = await res.json();
    if (data.success) assignments = data.data;
    renderTable();

    assignmentForm.addEventListener('submit', handleAddAssignment);
    assignmentsTableBody.addEventListener('click', handleTableClick);
}

loadAndInitialize();
