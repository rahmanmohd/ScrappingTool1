let scrapedData = [];

document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const statsSection = document.getElementById('statsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    // Event listeners
    scrapeBtn.addEventListener('click', startScraping);
    clearBtn.addEventListener('click', clearResults);
    exportJsonBtn.addEventListener('click', () => exportData('json'));
    exportCsvBtn.addEventListener('click', () => exportData('csv'));
    exportExcelBtn.addEventListener('click', () => exportData('excel'));

    function startScraping() {
        const urls = urlInput.value.trim().split('\n').filter(url => url.trim() !== '');
        
        if (urls.length === 0) {
            alert('Please enter at least one URL');
            return;
        }

        // Show loading, hide results
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        statsSection.classList.add('hidden');
        scrapeBtn.disabled = true;

        // Make API call
        fetch('/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls: urls })
        })
        .then(response => response.json())
        .then(data => {
            scrapedData = data.results;
            displayResults(scrapedData);
            updateStats(scrapedData);
            
            // Hide loading, show results
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            statsSection.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while scraping. Please try again.');
            loadingSection.classList.add('hidden');
        })
        .finally(() => {
            scrapeBtn.disabled = false;
        });
    }

    function displayResults(results) {
        resultsContainer.innerHTML = '';
        
        results.forEach((result, index) => {
            const resultCard = createResultCard(result, index);
            resultsContainer.appendChild(resultCard);
        });
    }

    function createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'border border-gray-200 rounded-lg p-4 card-hover';
        
        const statusClass = result.status === 'success' ? 'text-green-600' : 'text-red-600';
        const statusIcon = result.status === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-800">${result.company_name}</h3>
                <span class="${statusClass}">
                    <i class="${statusIcon} mr-1"></i>
                    ${result.status}
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600 mb-1"><strong>Website:</strong></p>
                    <a href="${result.website_url}" target="_blank" class="text-blue-600 hover:underline text-sm break-all">
                        ${result.website_url}
                    </a>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600 mb-1"><strong>Emails:</strong></p>
                    <p class="text-sm">${result.emails.length > 0 ? result.emails.join(', ') : 'None found'}</p>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600 mb-1"><strong>Phone Numbers:</strong></p>
                    <p class="text-sm">${result.phones.length > 0 ? result.phones.join(', ') : 'None found'}</p>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600 mb-1"><strong>Social Links:</strong></p>
                    <div class="text-sm">
                        ${result.social_links.length > 0 ? 
                            result.social_links.map(link => `<a href="${link}" target="_blank" class="text-blue-600 hover:underline block">${link}</a>`).join('') 
                            : 'None found'
                        }
                    </div>
                </div>
            </div>
            
            ${result.description !== 'N/A' ? `
                <div class="mt-3">
                    <p class="text-sm text-gray-600 mb-1"><strong>Description:</strong></p>
                    <p class="text-sm text-gray-700">${result.description}</p>
                </div>
            ` : ''}
            
            ${result.status === 'error' && result.error ? `
                <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p class="text-sm text-red-700"><strong>Error:</strong> ${result.error}</p>
                </div>
            ` : ''}
        `;
        
        return card;
    }

    function updateStats(results) {
        const total = results.length;
        const successful = results.filter(r => r.status === 'success').length;
        const errors = total - successful;
        
        document.getElementById('totalScraped').textContent = total;
        document.getElementById('successCount').textContent = successful;
        document.getElementById('errorCount').textContent = errors;
    }

    function clearResults() {
        urlInput.value = '';
        resultsSection.classList.add('hidden');
        statsSection.classList.add('hidden');
        scrapedData = [];
    }

    function exportData(format) {
        if (scrapedData.length === 0) {
            alert('No data to export');
            return;
        }

        fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                results: scrapedData, 
                format: format 
            })
        })
        .then(response => {
            if (format === 'csv') {
                return response.text();
            } else if (format === 'excel') {
                return response.blob();
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (format === 'json') {
                downloadJSON(data, 'scraped_data.json');
            } else if (format === 'csv') {
                downloadCSV(data, 'scraped_data.csv');
            } else if (format === 'excel') {
                downloadExcel(data, 'scraped_data.xlsx');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while exporting data.');
        });
    }

    function downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function downloadCSV(data, filename) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
});


    function downloadExcel(data, filename) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }


