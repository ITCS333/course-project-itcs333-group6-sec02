const listSection = document.querySelector('#assignment-list-section');

function createAssignmentArticle(assignment) {
    const article = document.createElement('article');

    const h2 = document.createElement('h2');
    h2.textContent = assignment.title;
    article.appendChild(h2);

    const pDue = document.createElement('p');
    pDue.textContent = 'Due: ' + assignment.due_date;
    article.appendChild(pDue);

    const pDesc = document.createElement('p');
    pDesc.textContent = assignment.description;
    article.appendChild(pDesc);

    const link = document.createElement('a');
    link.href = details.html?id=${assignment.id};
    link.textContent = 'View Details & Discussion';
    article.appendChild(link);

    return article;
}

async function loadAssignments() {
    const res = await fetch('api/index.php?resource=assignments');
    const data = await res.json();
    if (!data.success) return;

    listSection.innerHTML = '';
    data.data.forEach(assignment => listSection.appendChild(createAssignmentArticle(assignment)));
}

loadAssignments();
