/*
  Requirement: Populate the "Weekly Course Breakdown" list page.

  Instructions:
  1. Link this file to `list.html` using:
     <script src="list.js" defer></script>

  2. In `list.html`, add an `id="week-list-section"` to the
     <section> element that will contain the weekly articles.

  3. Implement the TODOs below.
*/

// --- Element Selections ---
// TODO: Select the section for the week list ('#week-list-section').
const listSection = document.querySelector('#week-list-section');

// (Required modification) API endpoint instead of local JSON files
const API_URL = 'api/index.php';

// --- Functions ---

/**
 * TODO: Implement the createWeekArticle function.
 * It takes one week object {id, title, startDate, description}.
 * It should return an <article> element matching the structure in `list.html`.
 * - The "View Details & Discussion" link's `href` MUST be set to `details.html?id=${id}`.
 * (This is how the detail page will know which week to load).
 */
function createWeekArticle(week) {
  // ... your implementation here ...
  const article = document.createElement('article');
  const h2 = document.createElement('h2');
  h2.textContent = week.title;
  article.appendChild(h2);
  const pDate = document.createElement('p');
  pDate.classList.add('date');
  pDate.textContent = `Starts on: ${week.startDate}`;
  article.appendChild(pDate);
  const pDesc = document.createElement('p');
  pDesc.textContent = week.description;
  article.appendChild(pDesc);
  const aLink = document.createElement('a');
  aLink.href = `details.html?id=${week.id}`;
  aLink.textContent = 'View Details & Discussion';
  article.appendChild(aLink);
  return article;
}

/**
 * TODO: Implement the loadWeeks function.
 * This function needs to be 'async'.
 * It should:
 * 1. Use `fetch()` to get data from 'weeks.json'.
 * 2. Parse the JSON response into an array.
 * 3. Clear any existing content from `listSection`.
 * 4. Loop through the weeks array. For each week:
 * - Call `createWeekArticle()`.
 * - Append the returned <article> element to `listSection`.
 */
async function loadWeeks() {
  // ... your implementation here ...
  try {
    const response = await fetch(`${API_URL}?resource=weeks`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    const weeks = result.data;

    listSection.innerHTML = '';
    weeks.forEach(week => {
      const article = createWeekArticle(week);
      listSection.appendChild(article);
    });
  } catch (error) {
    console.error('Error loading weeks data:', error);
  }
}

// --- Initial Page Load ---
// Call the function to populate the page.
loadWeeks();
