document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const imageInput = document.getElementById('image');
  const formData = new FormData();
  formData.append('image', imageInput.files[0]);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const extractedData = await response.json();
    displayResults(extractedData);
  } catch (error) {
    console.error('Error:', error);
  }
});

function displayResults(extractedData) {
  const resultsTable = document.getElementById('results-table');
  const resultsTbody = document.getElementById('results-tbody');

  // Clear previous results
  resultsTbody.innerHTML = '';

  // Populate the table with extracted data
  for (const data of extractedData) {
    const row = document.createElement('tr');
    const fieldCell = document.createElement('td');
    const valueCell = document.createElement('td');

    fieldCell.textContent = data.type;
    valueCell.textContent = data.value_detection;

    row.appendChild(fieldCell);
    row.appendChild(valueCell);
    resultsTbody.appendChild(row);
  }

  // Show the table
  resultsTable.style.display = 'table';
}
