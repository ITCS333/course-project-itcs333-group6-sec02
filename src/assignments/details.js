let currentAssignmentId = null;
let currentComments = [];

const assignmentTitle = document.querySelector('#assignment-title');
const assignmentDueDate = document.querySelector('#assignment-due-date');
const assignmentDescription = document.querySelector('#assignment-description');
const assignmentFilesList = document.querySelector('#assignment-files-list');
const commentList = document.querySelector('#comment-list');
const commentForm = document.querySelector('#comment-form');
const newCommentText = document.querySelector('#new-comment-text');

function getAssignmentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function renderAssignmentDetails(assignment) {
    assignmentTitle.textContent = assignment.title;
    assignmentDueDate.textContent = 'Due: ' + assignment.due_date;
    assignmentDescription.textContent = assignment.description;

    assignmentFilesList.innerHTML = '';
    assignment.files.forEach(file => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = file;
        a.textContent = file;
        a.target = '_blank';
        li.appendChild(a);
        assignmentFilesList.appendChild(li);
    });
}

function createCommentArticle(comment) {
    const article = document.createElement('article');
    const p = document.createElement('p');
    p.textContent = comment.text;
    const footer = document.createElement('footer');
    footer.textContent = 'Posted by: ' + comment.author;
    article.appendChild(p);
    article.appendChild(footer);
    return article;
}

function renderComments() {
    commentList.innerHTML = '';
    currentComments.forEach(c => commentList.appendChild(createCommentArticle(c)));
}

async function handleAddComment(event) {
    event.preventDefault();
    const text = newCommentText.value.trim();
    if (!text) return;

    const res = await fetch(`api/index.php?resource=assignments&action=comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: currentAssignmentId, text, author: 'Student' })
    });

    const result = await res.json();
    if (!result.success) {
        alert(result.message || 'Error adding comment');
        return;
    }

    currentComments = result.data;
    renderComments();
    newCommentText.value = '';
}

async function initializePage() {
    currentAssignmentId = getAssignmentIdFromURL();
    if (!currentAssignmentId) {
        alert('No assignment ID specified.');
        return;
    }

    const [assignmentRes, commentsRes] = await Promise.all([
        fetch(`api/index.php?resource=assignments&id=${currentAssignmentId}`),
        fetch(`api/index.php?resource=assignments&action=comments&assignment_id=${currentAssignmentId}`)
    ]);

    const assignmentData = await assignmentRes.json();
    const commentsData = await commentsRes.json();

    if (!assignmentData.success) {
        alert(assignmentData.message || 'Assignment not found');
        return;
    }

    currentComments = commentsData.data || [];
    renderAssignmentDetails(assignmentData.data);
    renderComments();

    commentForm.addEventListener('submit', handleAddComment);
}

initializePage();
