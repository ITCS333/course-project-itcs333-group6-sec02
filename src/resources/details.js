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
  article.appendChild(p);

  const footer = document.createElement('footer');
  // Show author and timestamp if available
  footer.textContent = comment.author 
    ? `${comment.author} - ${new Date(comment.created_at).toLocaleString()}`
    : 'Anonymous';
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
    text // Do NOT send author; server will assign it
  };

  try {
    const response = await fetch(`api/index.php?action=comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.success) {
      // Re-fetch comments from server to get accurate author and timestamp
      await loadComments();
      newComment.value = '';
    } else {
      alert(data.message || 'Failed to add comment');
    }
  } catch (err) {
    console.error(err);
    alert('Error adding comment');
  }
}

async function loadComments() {
  try {
    const commentsRes = await fetch(`api/index.php?action=comments&resource_id=${currentResourceId}`);
    const commentsData = await commentsRes.json();
    currentComments = commentsData.success ? commentsData.data : [];
    renderComments();
  } catch (err) {
    console.error(err);
    commentList.innerHTML = '<p>Failed to load comments.</p>';
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
    const resourceRes = await fetch(`api/index.php?id=${currentResourceId}`);
    const resourceData = await resourceRes.json();
    if (resourceData.success) renderResourceDetails(resourceData.data);
    else resourceTitle.textContent = 'Resource not found';

    // Load comments
    await loadComments();

    if (commentForm) commentForm.addEventListener('submit', handleAddComment);
  } catch (err) {
    console.error(err);
    resourceTitle.textContent = 'Failed to load resource';
  }
}

// --- Load ---
initializePage();
