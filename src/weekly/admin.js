/*
  Requirement: Make the "Manage Weekly Breakdown" page interactive.

  Instructions:
  1. Link this file to `admin.html` using:
     <script src="admin.js" defer></script>
  
  2. In `admin.html`, add an `id="weeks-tbody"` to the <tbody> element
     inside your `weeks-table`.
  
  3. Implement the TODOs below.
*/

// --- Global Data Store ---
// This will hold the weekly data loaded from the JSON file.
let weeks = [];

// --- Element Selections ---
// TODO: Select the week form ('#week-form').
const weekForm = document.querySelector('#week-form');

// TODO: Select the weeks table body ('#weeks-tbody').
const weeksTableBody = document.querySelector('#weeks-tbody');

// (Required modification) API endpoint instead of local JSON files
const API_URL = 'api/index.php';

// --- Functions ---

/**
 * TODO: Implement the createWeekRow function.
 * It takes one week object {id, title, description}.
 * It should return a <tr> element with the following <td>s:
 * 1. A <td> for the `title`.
 * 2. A <td> for the `description`.
 * 3. A <td> containing two buttons:
 * - An "Edit" button with class "edit-btn" and `data-id="${id}"`.
 * - A "Delete" button with class "delete-btn" and `data-id="${id}"`.
 */
function createWeekRow(week) {
  // ... your implementation here ...
  const tr = document.createElement('tr');
  const titleTd = document.createElement('td');
  titleTd.textContent = week.title;
  tr.appendChild(titleTd);

  const descTd = document.createElement('td');
  descTd.textContent = week.description;
  tr.appendChild(descTd);

  const actionsTd = document.createElement('td');
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.classList.add('edit-btn');
  editBtn.dataset.id = week.id;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.dataset.id = week.id;

  actionsTd.appendChild(editBtn);
  actionsTd.appendChild(deleteBtn);

  tr.appendChild(actionsTd);

  return tr;
}

/**
 * TODO: Implement the renderTable function.
 * It should:
 * 1. Clear the `weeksTableBody`.
 * 2. Loop through the global `weeks` array.
 * 3. For each week, call `createWeekRow()`, and
 * append the resulting <tr> to `weeksTableBody`.
 */
function renderTable() {
  // ... your implementation here ...
  weeksTableBody.innerHTML = '';
  weeks.forEach(week => {
    const row = createWeekRow(week);
    weeksTableBody.appendChild(row);
  });
}

/**
 * TODO: Implement the handleAddWeek function.
 * This is the event handler for the form's 'submit' event.
 * It should:
 * 1. Prevent the form's default submission.
 * 2. Get the values from the title, start date, and description inputs.
 * 3. Get the value from the 'week-links' textarea. Split this value
 * by newlines (`\n`) to create an array of link strings.
 * 4. Create a new week object with a unique ID (e.g., `id: \`week_${Date.now()}\``).
 * 5. Add this new week object to the global `weeks` array (in-memory only).
 * 6. Call `renderTable()` to refresh the list.
 * 7. Reset the form.
 */
async function handleAddWeek(event) {
  // ... your implementation here ...
  event.preventDefault();

  const titleInput = document.querySelector('#week-title');
  const dateInput = document.querySelector('#week-start-date');
  const descInput = document.querySelector('#week-description');
  const linksInput = document.querySelector('#week-links');

  const title = titleInput.value.trim();
  const startDate = dateInput.value;
  const description = descInput.value.trim();
  const linksRaw = linksInput.value.trim();

  let links = [];
  if (linksRaw !== '') {
    links = linksRaw.split('\n').map(line => line.trim()).filter(line => line !== '');
  }

  if (!title) {
    alert('Please enter a week title.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}?resource=weeks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        start_date: startDate,
        description: description,
        links: links
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP error ${response.status}`);
    }

    weeks.push(result.data);
    renderTable();
    weekForm.reset();
  } catch (error) {
    console.error('Error adding week:', error);
    alert('Failed to add week. Check console for details.');
  }
}

/**
 * TODO: Implement the handleTableClick function.
 * This is an event listener on the `weeksTableBody` (for delegation).
 * It should:
 * 1. Check if the clicked element (`event.target`) has the class "delete-btn".
 * 2. If it does, get the `data-id` attribute from the button.
 * 3. Update the global `weeks` array by filtering out the week
 * with the matching ID (in-memory only).
 * 4. Call `renderTable()` to refresh the list.
 */
async function handleTableClick(event) {
  // ... your implementation here ...
  const target = event.target;

  if (target.classList.contains('delete-btn')) {
    const idToDelete = target.dataset.id;

    try {
      const response = await fetch(
        `${API_URL}?resource=weeks&week_id=${encodeURIComponent(idToDelete)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error ${response.status}`);
      }

      weeks = weeks.filter(week => String(week.id) !== String(idToDelete));
      renderTable();
    } catch (error) {
      console.error('Error deleting week:', error);
      alert('Failed to delete week. Check console for details.');
    }
  }
}

/**
 * TODO: Implement the loadAndInitialize function.
 * This function needs to be 'async'.
 * It should:
 * 1. Use `fetch()` to get data from 'weeks.json'.
 * 2. Parse the JSON response and store the result in the global `weeks` array.
 * 3. Call `renderTable()` to populate the table for the first time.
 * 4. Add the 'submit' event listener to `weekForm` (calls `handleAddWeek`).
 * 5. Add the 'click' event listener to `weeksTableBody` (calls `handleTableClick`).
 */
async function loadAndInitialize() {
  // ... your implementation here ...
  try {
    const response = await fetch(`${API_URL}?resource=weeks`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP error ${response.status}`);
    }

    weeks = result.data;
    renderTable();

    weekForm.addEventListener('submit', handleAddWeek);
    weeksTableBody.addEventListener('click', handleTableClick);
  } catch (error) {
    console.error('Error loading weeks data:', error);
  }
}

// --- Initial Page Load ---
// Call the main async function to start the application.
loadAndInitialize();
