/**
 * WorkBoard Worker View Module
 * Handles read-only worker view functionality
 */

/**
 * Format date from ISO (YYYY-MM-DD) to DD/MM/YYYY
 */
function formatDateDisplay(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format currency as LKR
 */
function formatCurrencyDisplay(amount) {
    return `LKR ${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Load workers into dropdown
 */
async function loadWorkers() {
    const select = document.getElementById('workerSelect');
    const workers = await getAllWorkers();
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select a worker --</option>';
    
    workers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = `${worker.name} (${worker.id})`;
        select.appendChild(option);
    });
}

/**
 * Display worker data
 */
async function displayWorkerData(workerId) {
    const worker = await getWorker(workerId);
    if (!worker) {
        hideAllSections();
        return;
    }

    // Show worker profile
    document.getElementById('workerName').textContent = worker.name;
    document.getElementById('workerId').textContent = worker.id;
    document.getElementById('workerRole').textContent = worker.jobRole;
    document.getElementById('workerProfile').classList.remove('d-none');

    // Get work and payment records
    const [workRecords, paymentRecords, totalEarned, totalPaid] = await Promise.all([
        getWorkRecordsByWorker(workerId),
        getPaymentsByWorker(workerId),
        calculateTotalEarned(workerId),
        calculateTotalPaid(workerId)
    ]);
    const balance = totalEarned - totalPaid;

    // Display balance summary
    document.getElementById('totalEarned').textContent = formatCurrencyDisplay(totalEarned);
    document.getElementById('totalPaid').textContent = formatCurrencyDisplay(totalPaid);
    document.getElementById('balance').textContent = formatCurrencyDisplay(balance);
    document.getElementById('balanceCard').classList.remove('d-none');

    // Display work history
    const workBody = document.getElementById('workHistoryBody');
    workBody.innerHTML = '';
    
    if (workRecords.length > 0) {
        workRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateDisplay(record.date)}</td>
                <td>${record.workType}</td>
                <td class="text-end text-currency">${formatCurrencyDisplay(record.earnedAmount)}</td>
            `;
            workBody.appendChild(row);
        });
        document.getElementById('workHistorySection').classList.remove('d-none');
    } else {
        document.getElementById('workHistorySection').classList.add('d-none');
    }

    // Display payment history
    const paymentBody = document.getElementById('paymentHistoryBody');
    paymentBody.innerHTML = '';
    
    if (paymentRecords.length > 0) {
        paymentRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateDisplay(record.date)}</td>
                <td>${record.paymentType}</td>
                <td class="text-end text-currency">${formatCurrencyDisplay(record.amount)}</td>
                <td>${record.note || '-'}</td>
            `;
            paymentBody.appendChild(row);
        });
        document.getElementById('paymentHistorySection').classList.remove('d-none');
    } else {
        document.getElementById('paymentHistorySection').classList.add('d-none');
    }

    // Hide empty state
    document.getElementById('emptyState').classList.add('d-none');
}

/**
 * Hide all sections
 */
function hideAllSections() {
    document.getElementById('workerProfile').classList.add('d-none');
    document.getElementById('balanceCard').classList.add('d-none');
    document.getElementById('workHistorySection').classList.add('d-none');
    document.getElementById('paymentHistorySection').classList.add('d-none');
    document.getElementById('emptyState').classList.remove('d-none');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadWorkers();

    // Handle worker selection change
    document.getElementById('workerSelect').addEventListener('change', async function() {
        const workerId = this.value;
        if (workerId) {
            await displayWorkerData(workerId);
        } else {
            hideAllSections();
        }
    });
});


