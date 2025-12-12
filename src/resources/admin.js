// --- Block non-admin users immediately ---
(async function checkAdmin() {
  try {
    const resp = await fetch('api/index.php?action=check_admin');
    const data = await resp.json();
    if (!data.success || !data.is_admin) {
      alert('Unauthorized: You cannot access this page.');
      window.location.href = '../..'; // redirect non-admin users
      return;
    }
  } catch (err) {
    console.error(err);
    alert('Error checking admin permissions.');
    window.location.href = '../..';
    return;
  }
})();

// --- Global Data Store ---
let resources = [];

// --- Element Selections ---
const resourceForm = document.getElementById('resource-form');
const resourcesTableBody = document.getElementById('resources-tbody');

// --- Functions ---
function createResourceRow(resource) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${resource.title ?? ''}</td>
    <td>${resource.description ?? ''}</td>
    <td>
      <button type="button" class="edit-btn" data-id="${resource.id}">Edit</button>
      <button type="button" class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;
  return tr;
}

function renderTable() {
  if(!resourcesTableBody)return;
  resourcesTableBody.innerHTML='';
  resources.forEach(r=>resourcesTableBody.appendChild(createResourceRow(r)));
}

async function loadResources() {
  try {
    const resp = await fetch('api/index.php');
    const data = await resp.json();
    resources = data.success && Array.isArray(data.data) ? data.data : [];
    renderTable();
  } catch(err){console.error(err);resources=[];renderTable();}
}

async function handleAddResource(e){
  e.preventDefault();
  const title=document.getElementById('resource-title').value.trim();
  const desc=document.getElementById('resource-description').value.trim();
  const link=document.getElementById('resource-link').value.trim();
  if(!title||!link){alert('Please fill in required fields.');return;}
  const editingId=resourceForm.dataset.editingId;
  const method=editingId?'PUT':'POST';
  const body={title,description:desc,link};
  if(editingId)body.id=editingId;

  try{
    const resp=await fetch('api/index.php',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await resp.json();
    if(result.success){await loadResources();resourceForm.reset();resourceForm.removeAttribute('data-editing-id');}
    else alert(result.message||'Error.');
  }catch(err){console.error(err);alert('Network error.');}
}

async function handleTableClick(e){
  const target=e.target;
  const id=target.dataset.id;
  if(!id)return;

  if(target.classList.contains('delete-btn')){
    if(!confirm('Delete this resource?'))return;
    try{
      const resp=await fetch(`api/index.php?id=${id}`,{method:'DELETE'});
      const result=await resp.json();
      if(result.success) await loadResources();
      else alert(result.message||'Failed to delete.');
    }catch(err){console.error(err);alert('Network error.');}
  }

  if(target.classList.contains('edit-btn')){
    const resource=resources.find(r=>String(r.id)===String(id));
    if(resource){
      document.getElementById('resource-title').value=resource.title||'';
      document.getElementById('resource-description').value=resource.description||'';
      document.getElementById('resource-link').value=resource.link||'';
      resourceForm.dataset.editingId=id;
    }
  }
}

// --- Event Listeners ---
resourceForm?.addEventListener('submit',handleAddResource);
resourcesTableBody?.addEventListener('click',handleTableClick);

// --- Initial Load ---
loadResources();
