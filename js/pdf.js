/**
 * WorkBoard PDF Generation Module
 * Uses jsPDF library to generate PDF reports
 */

/**
 * Format date from ISO (YYYY-MM-DD) to DD/MM/YYYY
 */
function formatDate(isoDate) {
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
function formatCurrency(amount) {
    return `LKR ${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Generate PDF for a single worker
 */
async function generateWorkerPDF(workerId) {
    const worker = await getWorker(workerId);
    if (!worker) {
        alert('Worker not found');
        return;
    }

    const [workRecords, paymentRecords, totalEarned, totalPaid] = await Promise.all([
        getWorkRecordsByWorker(workerId),
        getPaymentsByWorker(workerId),
        calculateTotalEarned(workerId),
        calculateTotalPaid(workerId)
    ]);
    const balance = totalEarned - totalPaid;

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Colors
    const headerColor = [37, 99, 235]; // #2563eb
    const borderColor = [229, 231, 235]; // #e5e7eb

    let yPos = 20;

    // Header
    doc.setFillColor(...headerColor);
    doc.rect(10, yPos, 190, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Worker Report', 15, yPos + 10);

    yPos += 25;

    // Worker Profile
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Worker Profile', 15, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Worker ID: ${worker.id}`, 15, yPos);
    yPos += 6;
    doc.text(`Name: ${worker.name}`, 15, yPos);
    yPos += 6;
    doc.text(`Job Role: ${worker.jobRole}`, 15, yPos);
    yPos += 10;

    // Work History Table
    if (workRecords.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Work History', 15, yPos);
        yPos += 8;

        // Table header
        doc.setFillColor(...headerColor);
        doc.rect(15, yPos, 175, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Date', 18, yPos + 5.5);
        doc.text('Work Type', 55, yPos + 5.5);
        doc.text('Earned Amount', 140, yPos + 5.5);

        yPos += 8;
        doc.setTextColor(0, 0, 0);

        // Table rows
        workRecords.forEach((record, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            doc.setDrawColor(...borderColor);
            doc.setLineWidth(0.1);
            doc.line(15, yPos, 190, yPos);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(record.date), 18, yPos + 5);
            doc.text(record.workType, 55, yPos + 5);
            doc.text(formatCurrency(record.earnedAmount), 140, yPos + 5);

            yPos += 7;
        });

        doc.setDrawColor(...borderColor);
        doc.line(15, yPos, 190, yPos);
        yPos += 10;
    }

    // Payment History Table
    if (paymentRecords.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Payment History', 15, yPos);
        yPos += 8;

        // Table header
        doc.setFillColor(...headerColor);
        doc.rect(15, yPos, 175, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Date', 18, yPos + 5.5);
        doc.text('Type', 55, yPos + 5.5);
        doc.text('Amount', 100, yPos + 5.5);
        doc.text('Note', 140, yPos + 5.5);

        yPos += 8;
        doc.setTextColor(0, 0, 0);

        // Table rows
        paymentRecords.forEach((record) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            doc.setDrawColor(...borderColor);
            doc.setLineWidth(0.1);
            doc.line(15, yPos, 190, yPos);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(record.date), 18, yPos + 5);
            doc.text(record.paymentType, 55, yPos + 5);
            doc.text(formatCurrency(record.amount), 100, yPos + 5);
            doc.text(record.note || '-', 140, yPos + 5);

            yPos += 7;
        });

        doc.setDrawColor(...borderColor);
        doc.line(15, yPos, 190, yPos);
        yPos += 10;
    }

    // Summary
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary', 15, yPos);
    yPos += 8;

    doc.setFillColor(245, 247, 250);
    doc.rect(15, yPos, 175, 25, 'F');
    doc.setDrawColor(...borderColor);
    doc.rect(15, yPos, 175, 25, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Earned: ${formatCurrency(totalEarned)}`, 20, yPos + 8);
    doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 20, yPos + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance: ${formatCurrency(balance)}`, 20, yPos + 22);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        doc.text(`Generated on ${formatDate(new Date().toISOString().split('T')[0])}`, 15, 285);
    }

    // Save PDF
    doc.save(`Worker_${worker.id}_${worker.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate PDF for all workers
 */
async function generateAllWorkersPDF() {
    const workers = await getAllWorkers();
    if (workers.length === 0) {
        alert('No workers found');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Colors
    const headerColor = [37, 99, 235]; // #2563eb
    const borderColor = [229, 231, 235]; // #e5e7eb

    let yPos = 20;
    let isFirstPage = true;

    // Fetch all worker data in parallel
    const workerDataPromises = workers.map(async (worker) => {
        const [workRecords, paymentRecords, totalEarned, totalPaid] = await Promise.all([
            getWorkRecordsByWorker(worker.id),
            getPaymentsByWorker(worker.id),
            calculateTotalEarned(worker.id),
            calculateTotalPaid(worker.id)
        ]);
        return { worker, workRecords, paymentRecords, totalEarned, totalPaid, balance: totalEarned - totalPaid };
    });
    
    const workerDataArray = await Promise.all(workerDataPromises);

    workerDataArray.forEach(({ worker, workRecords, paymentRecords, totalEarned, totalPaid, balance }, workerIndex) => {
        if (!isFirstPage || yPos > 250) {
            doc.addPage();
            yPos = 20;
            isFirstPage = false;
        }

        // Worker Header
        doc.setFillColor(...headerColor);
        doc.rect(10, yPos, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${worker.name} (ID: ${worker.id})`, 15, yPos + 6.5);
        yPos += 15;

        // Worker Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Job Role: ${worker.jobRole}`, 15, yPos);
        yPos += 7;

        // Summary Box
        doc.setFillColor(245, 247, 250);
        doc.rect(15, yPos, 175, 15, 'F');
        doc.setDrawColor(...borderColor);
        doc.rect(15, yPos, 175, 15, 'S');
        doc.setFontSize(9);
        doc.text(`Total Earned: ${formatCurrency(totalEarned)}`, 20, yPos + 6);
        doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 20, yPos + 11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Balance: ${formatCurrency(balance)}`, 110, yPos + 8.5);
        yPos += 20;

        // Work Records Summary
        if (workRecords.length > 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Work Records: ${workRecords.length}`, 15, yPos);
            yPos += 6;
        }

        // Payment Records Summary
        if (paymentRecords.length > 0) {
            doc.text(`Payment Records: ${paymentRecords.length}`, 15, yPos);
            yPos += 6;
        }

        yPos += 5;

        // Separator line
        if (workerIndex < workerDataArray.length - 1) {
            doc.setDrawColor(...borderColor);
            doc.setLineWidth(0.5);
            doc.line(10, yPos, 200, yPos);
            yPos += 10;
        }
    });

    // Overall Summary Page
    doc.addPage();
    yPos = 20;

    doc.setFillColor(...headerColor);
    doc.rect(10, yPos, 190, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary', 15, yPos + 10);
    yPos += 25;

    // Summary Table
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(...headerColor);
    doc.rect(15, yPos, 175, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Worker ID', 18, yPos + 5.5);
    doc.text('Name', 55, yPos + 5.5);
    doc.text('Total Earned', 110, yPos + 5.5);
    doc.text('Total Paid', 150, yPos + 5.5);
    doc.text('Balance', 175, yPos + 5.5);

    yPos += 8;
    doc.setTextColor(0, 0, 0);

    let grandTotalEarned = 0;
    let grandTotalPaid = 0;

    workerDataArray.forEach(({ worker, totalEarned, totalPaid, balance }) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
            // Redraw header
            doc.setFillColor(...headerColor);
            doc.rect(15, yPos, 175, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Worker ID', 18, yPos + 5.5);
            doc.text('Name', 55, yPos + 5.5);
            doc.text('Total Earned', 110, yPos + 5.5);
            doc.text('Total Paid', 150, yPos + 5.5);
            doc.text('Balance', 175, yPos + 5.5);
            yPos += 8;
            doc.setTextColor(0, 0, 0);
        }

        grandTotalEarned += totalEarned;
        grandTotalPaid += totalPaid;

        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.1);
        doc.line(15, yPos, 190, yPos);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(worker.id, 18, yPos + 5);
        doc.text(worker.name, 55, yPos + 5);
        doc.text(formatCurrency(totalEarned), 110, yPos + 5);
        doc.text(formatCurrency(totalPaid), 150, yPos + 5);
        doc.setFont('helvetica', balance >= 0 ? 'normal' : 'bold');
        doc.setTextColor(balance >= 0 ? 0 : 220, balance >= 0 ? 0 : 38, balance >= 0 ? 0 : 127);
        doc.text(formatCurrency(balance), 175, yPos + 5);
        doc.setTextColor(0, 0, 0);

        yPos += 7;
    });

    doc.setDrawColor(...borderColor);
    doc.line(15, yPos, 190, yPos);
    yPos += 5;

    // Grand Total
    doc.setFillColor(245, 247, 250);
    doc.rect(15, yPos, 175, 12, 'F');
    doc.setDrawColor(...borderColor);
    doc.rect(15, yPos, 175, 12, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Grand Total', 18, yPos + 5);
    doc.text(formatCurrency(grandTotalEarned), 110, yPos + 5);
    doc.text(formatCurrency(grandTotalPaid), 150, yPos + 5);
    doc.text(formatCurrency(grandTotalEarned - grandTotalPaid), 175, yPos + 5);
    doc.text('Grand Balance', 18, yPos + 10);
    doc.text(formatCurrency(grandTotalEarned - grandTotalPaid), 175, yPos + 10);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        doc.text(`Generated on ${formatDate(new Date().toISOString().split('T')[0])}`, 15, 285);
    }

    // Save PDF
    doc.save(`All_Workers_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}


