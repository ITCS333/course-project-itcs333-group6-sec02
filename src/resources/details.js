

// --- Global Data ---
let currentResourceId = null;
let currentComments = [];

// --- Element Selections ---
const resourceTitle = document.getElementById('resource-title');
const resourceDescription = document.getElementById('resource-description');
const resourceLink = document.getElementById('resource-link');
const commentList = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const newComment = document.getElementById('new-comment');

// --- Functions ---
function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  resourceTitle.textContent = resource.title || 'No title';
  resourceDescription.textContent = resource.description || '';
  resourceLink.href = resource.link || '#';
}

function createCommentArticle(comment) {
  const article = document.createElement('article');
  const p = document.createElement('p');
  p.textContent = comment.text || '';
  const footer = document.createElement('footer');
  footer.textContent = comment.author || 'Anonymous';
  article.appendChild(p);
  article.appendChild(footer);
  return article;
}

function renderComments() {
  commentList.innerHTML = '';
  currentComments.forEach(comment => {
    const articleEl = createCommentArticle(comment);
    commentList.appendChild(articleEl);
  });
}

async function handleAddComment(event) {
  event.preventDefault();
  const text = newComment.value.trim();
  if (!text) return;

  const payload = {
    resource_id: currentResourceId,
    author: 'Student',
    text
  };

  try {
    const response = await fetch(`api/index.php?action=comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.success) {
      currentComments.push(payload);
      renderComments();
      newComment.value = '';
    } else {
      alert('Failed to add comment');
    }
  } catch (err) {
    console.error(err);
    alert('Error adding comment');
  }
}

// Initialize the page
async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  if (!currentResourceId) {
    resourceTitle.textContent = 'Resource not found';
    return;
  }

  try {
    // Fetch resource details
    const [resourceRes, commentsRes] = await Promise.all([
      fetch(`api/index.php?id=${currentResourceId}`),
      fetch(`api/index.php?action=comments&resource_id=${currentResourceId}`)
    ]);

    const resourceData = await resourceRes.json();
    const commentsData = await commentsRes.json();

    if (resourceData.success) renderResourceDetails(resourceData.data);
    else resourceTitle.textContent = 'Resource not found';

    currentComments = commentsData.success ? commentsData.data : [];
    renderComments();

    if (commentForm) commentForm.addEventListener('submit', handleAddComment);

  } catch (err) {
    console.error(err);
    resourceTitle.textContent = 'Failed to load resource';
  }
}

// --- Load ---
initializePage();
