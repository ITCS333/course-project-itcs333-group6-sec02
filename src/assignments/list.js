// --- Element Selections ---
const listSection = document.getElementById('assignment-list-section'); 

// --- Functions ---
function createAssignmentArticle(assignment) {
    const article = document.createElement('article');
    const h2 = document.createElement('h2');
    h2.textContent = assignment.title || '';
    article.appendChild(h2);

    const pDue = document.createElement('p');
    pDue.textContent = 'Due: ' + (assignment.due_date || '');
    article.appendChild(pDue);

    const pDesc = document.createElement('p');
    pDesc.textContent = assignment.description || '';
    article.appendChild(pDesc);

    const link = document.createElement('a');
    link.href = `details.html?id=${assignment.id}`;
    link.textContent = 'View Details & Discussion';
    article.appendChild(link);

    return article;
}

async function loadAssignments() {
    if (!listSection) return;
    listSection.innerHTML = 'Loading assignments...';

    try {
        const res = await fetch('api/index.php?resource=assignments');
        const data = await res.json();
        listSection.innerHTML = '';

        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(a => listSection.appendChild(createAssignmentArticle(a)));
        } else {
            listSection.innerHTML = '<p>No assignments found.</p>';
        }
    } catch (err) {
        console.error(err);
        listSection.innerHTML = '<p>Failed to load assignments.</p>';
    }
}

// --- Initial Page Load ---
loadAssignments();
