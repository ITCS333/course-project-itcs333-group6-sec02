

const listSection = document.getElementById('resource-list-section');

// Create a single resource article
function createResourceArticle(resource) {
  const article = document.createElement('article');

  const heading = document.createElement('h3');
  heading.textContent = resource.title || '';
  article.appendChild(heading);

  const desc = document.createElement('p');
  desc.textContent = resource.description || '';
  article.appendChild(desc);

  const link = document.createElement('a');
  link.href = `details.html?id=${resource.id}`;
  link.textContent = 'View Resource & Discussion';
  article.appendChild(link);

  return article;
}

// Load all resources from API
async function loadResources() {
  if (!listSection) return;

  listSection.innerHTML = 'Loading resources...';

  try {
    const response = await fetch('api/index.php');
    const data = await response.json();

    listSection.innerHTML = '';

    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(resource => {
        const articleEl = createResourceArticle(resource);
        listSection.appendChild(articleEl);
      });
    } else {
      listSection.innerHTML = '<p>No resources found.</p>';
    }
  } catch (err) {
    console.error('Error loading resources:', err);
    listSection.innerHTML = '<p>Failed to load resources.</p>';
  }
}

// Initial page load
loadResources();
