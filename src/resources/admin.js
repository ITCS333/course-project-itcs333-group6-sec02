
// --- Global Data Store ---
let resources = [];

// --- Element Selections ---
const resourceForm = document.getElementById('resource-form');
const resourcesTableBody = document.getElementById('resources-tbody');

// --- Functions ---

/**
 * Create a <tr> element for a resource
 */
function createResourceRow(resource) {
  const tr = document.createElement('tr');

  const tdTitle = document.createElement('td');
  tdTitle.textContent = resource.title ?? '';
  tr.appendChild(tdTitle);

  const tdDesc = document.createElement('td');
  tdDesc.textContent = resource.description ?? '';
  tr.appendChild(tdDesc);

  const tdActions = document.createElement('td');

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.type = 'button';
  editBtn.dataset.id = resource.id;
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.type = 'button';
  deleteBtn.dataset.id = resource.id;
  deleteBtn.textContent = 'Delete';

  tdActions.appendChild(editBtn);
  tdActions.appendChild(document.createTextNode(' '));
  tdActions.appendChild(deleteBtn);

  tr.appendChild(tdActions);
  return tr;
}

/**
 * Render all resources into table
 */
function renderTable() {
  if (!resourcesTableBody) return;
  resourcesTableBody.innerHTML = '';
  resources.forEach(resource => {
    resourcesTableBody.appendChild(createResourceRow(resource));
  });
}

/**
 * Load resources from backend API
 */
async function loadResourcesFromAPI() {
  try {
    const resp = await fetch('api/index.php');
    const data = await resp.json();
    if (data.success && Array.isArray(data.data)) {
      resources = data.data;
    } else {
      resources = [];
      console.warn('Failed to load resources', data);
    }
    renderTable();
  } catch (err) {
    console.error('Error fetching resources:', err);
    resources = [];
    renderTable();
  }
}

/**
 * Handle Add / Edit Resource form submit
 */
async function handleAddResource(event) {
  event.preventDefault();

  const title = document.getElementById('resource-title').value.trim();
  const description = document.getElementById('resource-description').value.trim();
  const link = document.getElementById('resource-link').value.trim();

  if (!title || !link) {
    alert('Please fill in the required fields.');
    return;
  }

  const editingId = resourceForm.dataset.editingId;

  if (editingId) {
    // --- EDIT ---
    try {
      const resp = await fetch('api/index.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, title, description, link })
      });
      const result = await resp.json();
      if (result.success) {
        await loadResourcesFromAPI();
      } else {
        alert(result.message || 'Failed to update resource on server.');
      }
    } catch (err) {
      console.error('PUT error:', err);
      alert('Network error while updating resource.');
    } finally {
      resourceForm.removeAttribute('data-editing-id');
      resourceForm.reset();
    }
  } else {
    // --- ADD ---
    try {
      const resp = await fetch('api/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, link })
      });
      const result = await resp.json();
      if (result.success && result.id) {
        await loadResourcesFromAPI(); // refresh table from server
        resourceForm.reset();
      } else {
        alert(result.message || 'Failed to add resource.');
      }
    } catch (err) {
      console.error('POST error:', err);
      alert('Network error while adding resource.');
    }
  }
}

/**
 * Handle table click events (Edit / Delete)
 */
async function handleTableClick(event) {
  const target = event.target;

  // --- DELETE ---
  if (target.classList.contains('delete-btn')) {
    const id = target.dataset.id;
    if (!id) return;
    if (!confirm('Delete this resource?')) return;

    try {
      const resp = await fetch(`api/index.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const result = await resp.json();
      if (result.success) {
        await loadResourcesFromAPI();
      } else {
        alert(result.message || 'Failed to delete resource.');
        await loadResourcesFromAPI();
      }
    } catch (err) {
      console.error('DELETE error:', err);
      alert('Network error while deleting resource.');
      await loadResourcesFromAPI();
    }
  }

  // --- EDIT ---
  if (target.classList.contains('edit-btn')) {
    const id = target.dataset.id;
    if (!id) return;

    // Find resource locally
    const resource = resources.find(r => String(r.id) === String(id));
    if (resource) {
      document.getElementById('resource-title').value = resource.title || '';
      document.getElementById('resource-description').value = resource.description || '';
      document.getElementById('resource-link').value = resource.link || '';
      resourceForm.dataset.editingId = id;
    } else {
      // If not found locally, fetch single resource
      try {
        const resp = await fetch(`api/index.php?id=${encodeURIComponent(id)}`);
        const r = await resp.json();
        if (r.success && r.data) {
          document.getElementById('resource-title').value = r.data.title || '';
          document.getElementById('resource-description').value = r.data.description || '';
          document.getElementById('resource-link').value = r.data.link || '';
          resourceForm.dataset.editingId = id;
        } else {
          alert('Cannot load resource for editing.');
        }
      } catch (err) {
        console.error('Error fetching resource for edit:', err);
        alert('Cannot load resource for editing.');
      }
    }
  }
}

/**
 * Initialize event listeners
 */
function attachListeners() {
  if (resourceForm) resourceForm.addEventListener('submit', handleAddResource);
  if (resourcesTableBody) resourcesTableBody.addEventListener('click', handleTableClick);
}

// --- Initial Load ---
async function init() {
  attachListeners();
  await loadResourcesFromAPI();
}

init();
