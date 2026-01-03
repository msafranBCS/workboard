/**
 * WorkBoard Admin Dashboard Module
 * Handles all admin dashboard functionality
 */

// Format date from ISO to DD/MM/YYYY
function formatDateForDisplay(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format currency
function formatCurrencyForDisplay(amount) {
    return `LKR ${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Convert date from YYYY-MM-DD to DD/MM/YYYY
function convertDateToDisplay(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

// Convert date from DD/MM/YYYY to YYYY-MM-DD
function convertDateToISO(dateString) {
    if (!dateString) return '';
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return dateString;
}

// Open date picker
function openDatePicker(datePickerId, textInputId) {
    const datePicker = document.getElementById(datePickerId);
    const textInput = document.getElementById(textInputId);
    
    if (!datePicker || !textInput) return;
    
    // If text input has a value, convert it to ISO format and set it in date picker
    if (textInput.value) {
        const isoDate = convertDateToISO(textInput.value);
        if (isoDate) {
            datePicker.value = isoDate;
        }
    } else {
        // Set today's date as default
        const today = new Date();
        const isoDate = today.toISOString().split('T')[0];
        datePicker.value = isoDate;
    }
    
    // Try to show picker (works in modern browsers)
    if (datePicker.showPicker) {
        datePicker.showPicker().catch(() => {
            // Fallback if showPicker fails
            datePicker.focus();
            datePicker.click();
        });
    } else {
        // Fallback for older browsers
        datePicker.focus();
        datePicker.click();
    }
}

// Initialize date picker
function initDatePicker(datePickerId, textInputId) {
    const datePicker = document.getElementById(datePickerId);
    const textInput = document.getElementById(textInputId);
    
    if (!datePicker || !textInput) return;
    
    // When date picker changes, update text input
    datePicker.addEventListener('change', function() {
        if (this.value) {
            textInput.value = convertDateToDisplay(this.value);
        }
    });
    
    // When user types in text input, try to sync with date picker
    textInput.addEventListener('input', function() {
        const isoDate = convertDateToISO(this.value);
        if (isoDate && datePicker.value !== isoDate) {
            datePicker.value = isoDate;
        }
    });
    
    // When text input loses focus, validate and format
    textInput.addEventListener('blur', function() {
        const isoDate = convertDateToISO(this.value);
        if (isoDate) {
            // Format it properly
            this.value = convertDateToDisplay(isoDate);
            datePicker.value = isoDate;
        }
    });
    
    // Set today's date as default if empty
    if (!textInput.value) {
        const today = new Date();
        const isoDate = today.toISOString().split('T')[0];
        datePicker.value = isoDate;
        textInput.value = convertDateToDisplay(isoDate);
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Load workers into select dropdowns
async function loadWorkerSelects() {
    const selects = ['workWorkerId', 'paymentWorkerId', 'exportWorkerSelect'];
    const workers = await getAllWorkers();
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Keep first option, clear rest
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        workers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = `${worker.name} (${worker.id})`;
            select.appendChild(option);
        });
    });
}

// Render workers table
async function renderWorkersTable() {
    const tbody = document.getElementById('workersTableBody');
    const workers = await getAllWorkers();
    
    tbody.innerHTML = '';
    
    if (workers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No workers found. Add your first worker above.</td></tr>';
        return;
    }
    
    workers.forEach(worker => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${worker.id}</td>
            <td>${worker.name}</td>
            <td>${worker.jobRole}</td>
            <td class="text-end table-actions">
                <button class="btn btn-sm btn-primary" onclick="editWorker('${worker.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteWorkerConfirm('${worker.id}', '${worker.name.replace(/'/g, "\\'")}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render workers accordion for View All Data
async function renderWorkersAccordion() {
    const container = document.getElementById('workersAccordion');
    const workers = await getAllWorkers();
    
    container.innerHTML = '';
    
    if (workers.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">No workers found. Add workers in the Workers tab.</div>';
        return;
    }
    
    // Process workers in parallel
    const workerPromises = workers.map(async (worker) => {
        const [workRecords, paymentRecords, totalEarned, totalPaid] = await Promise.all([
            getWorkRecordsByWorker(worker.id),
            getPaymentsByWorker(worker.id),
            calculateTotalEarned(worker.id),
            calculateTotalPaid(worker.id)
        ]);
        const balance = totalEarned - totalPaid;
        
        const accordionItem = document.createElement('div');
        accordionItem.className = 'worker-accordion-item';
        accordionItem.id = `worker-accordion-${worker.id}`;
        
        const header = document.createElement('div');
        header.className = 'worker-accordion-header';
        header.onclick = function() {
            toggleWorkerAccordion(worker.id);
        };
        
        header.innerHTML = `
            <div>
                <h6>${worker.name}</h6>
                <div class="worker-accordion-summary">
                    ID: ${worker.id} | ${worker.jobRole} | 
                    Total Earned: ${formatCurrencyForDisplay(totalEarned)} | 
                    Balance: ${formatCurrencyForDisplay(balance)}
                </div>
            </div>
            <svg class="worker-accordion-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        `;
        
        const content = document.createElement('div');
        content.className = 'worker-accordion-content';
        content.id = `worker-content-${worker.id}`;
        
        // Work Records Table
        let workRecordsHtml = '<div class="mb-4"><h6 class="mb-3">Work History</h6>';
        if (workRecords.length > 0) {
            workRecordsHtml += `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Work Type</th>
                                <th class="text-end">Earned Amount</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            workRecords.forEach(record => {
                workRecordsHtml += `
                    <tr>
                        <td>${formatDateForDisplay(record.date)}</td>
                        <td>${record.workType}</td>
                        <td class="text-end text-currency">${formatCurrencyForDisplay(record.earnedAmount)}</td>
                        <td class="text-end table-actions">
                            <button class="btn btn-sm btn-primary" onclick="editWorkRecord('${record.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteWorkRecordConfirm('${record.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            workRecordsHtml += '</tbody></table></div>';
        } else {
            workRecordsHtml += '<p class="text-muted">No work records found.</p>';
        }
        workRecordsHtml += '</div>';
        
        // Payment Records Table
        let paymentRecordsHtml = '<div><h6 class="mb-3">Payment History</h6>';
        if (paymentRecords.length > 0) {
            paymentRecordsHtml += `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Payment Type</th>
                                <th class="text-end">Amount</th>
                                <th>Note</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            paymentRecords.forEach(record => {
                paymentRecordsHtml += `
                    <tr>
                        <td>${formatDateForDisplay(record.date)}</td>
                        <td>${record.paymentType}</td>
                        <td class="text-end text-currency">${formatCurrencyForDisplay(record.amount)}</td>
                        <td>${record.note || '-'}</td>
                        <td class="text-end table-actions">
                            <button class="btn btn-sm btn-primary" onclick="editPaymentRecord('${record.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deletePaymentRecordConfirm('${record.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            paymentRecordsHtml += '</tbody></table></div>';
        } else {
            paymentRecordsHtml += '<p class="text-muted">No payment records found.</p>';
        }
        paymentRecordsHtml += '</div>';
        
        content.innerHTML = workRecordsHtml + paymentRecordsHtml;
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        
        return accordionItem;
    });
    
    const accordionItems = await Promise.all(workerPromises);
    
    // Append all accordion items
    accordionItems.forEach(item => {
        container.appendChild(item);
    });
}

// Toggle worker accordion
function toggleWorkerAccordion(workerId) {
    const header = document.querySelector(`#worker-accordion-${workerId} .worker-accordion-header`);
    const content = document.getElementById(`worker-content-${workerId}`);
    
    if (!header || !content) return;
    
    const isActive = header.classList.contains('active');
    
    // Close all other accordions
    document.querySelectorAll('.worker-accordion-header').forEach(h => {
        h.classList.remove('active');
    });
    document.querySelectorAll('.worker-accordion-content').forEach(c => {
        c.classList.remove('show');
    });
    
    // Toggle current accordion
    if (!isActive) {
        header.classList.add('active');
        content.classList.add('show');
    }
}

// Edit worker
async function editWorker(workerId) {
    const worker = await getWorker(workerId);
    if (!worker) return;
    
    document.getElementById('editWorkerId').value = workerId;
    document.getElementById('editWorkerIdInput').value = worker.id;
    document.getElementById('editWorkerName').value = worker.name;
    document.getElementById('editWorkerJobRole').value = worker.jobRole;
    
    const modal = new bootstrap.Modal(document.getElementById('editWorkerModal'));
    modal.show();
}

// Save worker edit
async function saveWorkerEdit() {
    const oldId = document.getElementById('editWorkerId').value;
    const newId = document.getElementById('editWorkerIdInput').value.trim();
    const name = document.getElementById('editWorkerName').value.trim();
    const jobRole = document.getElementById('editWorkerJobRole').value.trim();
    
    const result = await updateWorker(oldId, {
        id: newId,
        name: name,
        jobRole: jobRole
    });
    
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById('editWorkerModal')).hide();
        showAlert(result.message, 'success');
        await renderWorkersTable();
        await loadWorkerSelects();
        await renderWorkersAccordion();
    } else {
        showAlert(result.message, 'danger');
    }
}

// Delete worker confirm
async function deleteWorkerConfirm(workerId, workerName) {
    if (confirm(`Are you sure you want to delete worker "${workerName}"? This will also delete all related work and payment records.`)) {
        const result = await deleteWorker(workerId);
        if (result.success) {
            showAlert(result.message, 'success');
            await renderWorkersTable();
            await loadWorkerSelects();
            await renderWorkersAccordion();
        } else {
            showAlert(result.message, 'danger');
        }
    }
}

// Edit work record
async function editWorkRecord(recordId) {
    const record = await getWorkRecord(recordId);
    if (!record) return;
    
    document.getElementById('editWorkRecordId').value = recordId;
    const displayDate = formatDateForDisplay(record.date);
    document.getElementById('editWorkDate').value = displayDate;
    // Set date picker value
    const isoDate = convertDateToISO(displayDate);
    document.getElementById('editWorkDatePicker').value = isoDate;
    document.getElementById('editWorkType').value = record.workType;
    document.getElementById('editWorkAmount').value = record.earnedAmount;
    
    const modal = new bootstrap.Modal(document.getElementById('editWorkModal'));
    modal.show();
}

// Save work edit
async function saveWorkEdit() {
    const recordId = document.getElementById('editWorkRecordId').value;
    const date = document.getElementById('editWorkDate').value;
    const workType = document.getElementById('editWorkType').value.trim();
    const amount = document.getElementById('editWorkAmount').value;
    
    const result = await updateWorkRecord(recordId, {
        date: date,
        workType: workType,
        earnedAmount: amount
    });
    
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById('editWorkModal')).hide();
        showAlert(result.message, 'success');
        await renderWorkersAccordion();
    } else {
        showAlert(result.message, 'danger');
    }
}

// Delete work record confirm
async function deleteWorkRecordConfirm(recordId) {
    if (confirm('Are you sure you want to delete this work record?')) {
        const result = await deleteWorkRecord(recordId);
        if (result.success) {
            showAlert(result.message, 'success');
            await renderWorkersAccordion();
        } else {
            showAlert(result.message, 'danger');
        }
    }
}

// Edit payment record
async function editPaymentRecord(recordId) {
    const record = await getPayment(recordId);
    if (!record) return;
    
    document.getElementById('editPaymentRecordId').value = recordId;
    const displayDate = formatDateForDisplay(record.date);
    document.getElementById('editPaymentDate').value = displayDate;
    // Set date picker value
    const isoDate = convertDateToISO(displayDate);
    document.getElementById('editPaymentDatePicker').value = isoDate;
    document.getElementById('editPaymentType').value = record.paymentType;
    document.getElementById('editPaymentAmount').value = record.amount;
    document.getElementById('editPaymentNote').value = record.note || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editPaymentModal'));
    modal.show();
}

// Save payment edit
async function savePaymentEdit() {
    const recordId = document.getElementById('editPaymentRecordId').value;
    const date = document.getElementById('editPaymentDate').value;
    const paymentType = document.getElementById('editPaymentType').value;
    const amount = document.getElementById('editPaymentAmount').value;
    const note = document.getElementById('editPaymentNote').value.trim();
    
    const result = await updatePayment(recordId, {
        date: date,
        paymentType: paymentType,
        amount: amount,
        note: note
    });
    
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById('editPaymentModal')).hide();
        showAlert(result.message, 'success');
        await renderWorkersAccordion();
    } else {
        showAlert(result.message, 'danger');
    }
}

// Delete payment record confirm
async function deletePaymentRecordConfirm(recordId) {
    if (confirm('Are you sure you want to delete this payment record?')) {
        const result = await deletePayment(recordId);
        if (result.success) {
            showAlert(result.message, 'success');
            await renderWorkersAccordion();
        } else {
            showAlert(result.message, 'danger');
        }
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!requireAuth()) {
        return;
    }
    
    // Initialize data
    await initStorage();
    
    // Load initial data
    await loadWorkerSelects();
    await renderWorkersTable();
    await renderWorkersAccordion();
    
    // Add Worker Form
    document.getElementById('addWorkerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('workerId').value.trim();
        const name = document.getElementById('workerName').value.trim();
        const jobRole = document.getElementById('workerJobRole').value.trim();
        
        const result = await addWorker(id, name, jobRole);
        if (result.success) {
            showAlert(result.message, 'success');
            this.reset();
            await renderWorkersTable();
            await loadWorkerSelects();
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    // Initialize date pickers
    initDatePicker('workDatePicker', 'workDate');
    initDatePicker('paymentDatePicker', 'paymentDate');
    initDatePicker('editWorkDatePicker', 'editWorkDate');
    initDatePicker('editPaymentDatePicker', 'editPaymentDate');
    
    // Add Work Form
    document.getElementById('addWorkForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const workerId = document.getElementById('workWorkerId').value;
        const date = document.getElementById('workDate').value;
        const workType = document.getElementById('workType').value.trim();
        const amount = document.getElementById('workAmount').value;
        
        const result = await addWorkRecord(workerId, date, workType, amount);
        if (result.success) {
            showAlert(result.message, 'success');
            this.reset();
            // Reset date picker
            const today = new Date();
            const isoDate = today.toISOString().split('T')[0];
            document.getElementById('workDatePicker').value = isoDate;
            document.getElementById('workDate').value = convertDateToDisplay(isoDate);
            await renderWorkersAccordion();
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    // Add Payment Form
    document.getElementById('addPaymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const workerId = document.getElementById('paymentWorkerId').value;
        const date = document.getElementById('paymentDate').value;
        const paymentType = document.getElementById('paymentType').value;
        const amount = document.getElementById('paymentAmount').value;
        const note = document.getElementById('paymentNote').value.trim();
        
        const result = await addPayment(workerId, date, amount, paymentType, note);
        if (result.success) {
            showAlert(result.message, 'success');
            this.reset();
            // Reset date picker
            const today = new Date();
            const isoDate = today.toISOString().split('T')[0];
            document.getElementById('paymentDatePicker').value = isoDate;
            document.getElementById('paymentDate').value = convertDateToDisplay(isoDate);
            await renderWorkersAccordion();
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    // Export Worker PDF
    document.getElementById('exportWorkerSelect').addEventListener('change', function() {
        document.getElementById('exportWorkerBtn').disabled = !this.value;
    });
    
    document.getElementById('exportWorkerBtn').addEventListener('click', async function() {
        const workerId = document.getElementById('exportWorkerSelect').value;
        if (workerId) {
            await generateWorkerPDF(workerId);
        }
    });
    
    // Export All Workers PDF
    document.getElementById('exportAllBtn').addEventListener('click', async function() {
        await generateAllWorkersPDF();
    });
    
    // Refresh data when switching tabs
    const tabButtons = document.querySelectorAll('#adminTabs button[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', async function(e) {
            const targetId = e.target.getAttribute('data-bs-target');
            if (targetId === '#view-all') {
                await renderWorkersAccordion();
            } else if (targetId === '#workers') {
                await renderWorkersTable();
            } else if (targetId === '#add-work' || targetId === '#add-payment' || targetId === '#export') {
                await loadWorkerSelects();
            }
        });
    });
});

