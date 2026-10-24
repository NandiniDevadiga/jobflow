const PDFDocument = require('pdfkit');

/**
 * Generate a clean, 1-page ATS-compliant PDF Resume using PDFKit
 * Returns a Buffer
 */
function createTailoredPdfResume({ profile, job, tailored }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 32, bottom: 32, left: 36, right: 36 },
        bufferPages: true,
        info: {
          Title: `Nandini Devadiga - ${job?.title || 'Data Analyst'} Resume`,
          Author: 'Nandini Devadiga',
          Subject: `Tailored Resume for ${job?.company || 'Data Analyst Role'}`
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const p = profile?.personal || {};
      const company = job?.company || 'Enterprise';
      const role = job?.title || 'Data Analyst';

      // Colors
      const primaryColor = '#0f172a'; // Deep slate navy
      const accentColor = '#1d4ed8';  // Classic professional blue
      const textColor = '#334155';    // Dark slate gray
      const subColor = '#475569';     // Medium gray

      // 1. Header (Centered)
      doc.fillColor(primaryColor)
         .fontSize(19)
         .font('Helvetica-Bold')
         .text((p.fullName || 'NANDINI DEVADIGA').toUpperCase(), { align: 'center', characterSpacing: 0.5 });

      doc.moveDown(0.2);
      doc.fillColor(accentColor)
         .fontSize(10.5)
         .font('Helvetica-Bold')
         .text(`${role}  |  MSc Data Science & AI`, { align: 'center' });

      doc.moveDown(0.2);
      doc.fillColor(subColor)
         .fontSize(9)
         .font('Helvetica')
         .text(`${p.location || 'Mumbai, India'}   •   +91 9372568518   •   ${p.email || 'nandiniddd16@gmail.com'}`, { align: 'center' });

      doc.fillColor(accentColor)
         .fontSize(8.5)
         .font('Helvetica')
         .text(`LinkedIn: linkedin.com/in/nandini-deepa   •   GitHub: github.com/NandiniDevadiga`, { align: 'center' });

      doc.moveDown(0.5);

      // Helper for Section Titles
      function renderSectionHeading(title) {
        doc.moveDown(0.3);
        doc.fillColor(primaryColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(title.toUpperCase(), { characterSpacing: 0.5 });
        
        // Underline bar
        const y = doc.y + 1;
        doc.strokeColor('#cbd5e1')
           .lineWidth(0.8)
           .moveTo(36, y)
           .lineTo(559, y)
           .stroke();
        doc.moveDown(0.4);
      }

      // 2. Professional Summary
      renderSectionHeading('Professional Summary');
      const summaryText = tailored?.professionalSummary || 
        `Results-driven Data Analyst with an MSc in Data Science & Artificial Intelligence (Middlesex University Dubai) and hands-on production experience at Vastu Housing Finance and HDFC AMC. Specialized in end-to-end Power BI dashboard engineering, custom DAX metrics, automated SQL workflows, and predictive modeling in Python, tailored specifically for high-impact analytical decision support at ${company}.`;

      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica')
         .text(summaryText, { align: 'justify', lineGap: 1.5 });

      // 3. Core Competencies
      renderSectionHeading('Core Technical Competencies');
      const skillsList = (tailored?.topKeywordsToInclude && tailored.topKeywordsToInclude.length > 0)
        ? tailored.topKeywordsToInclude.join(', ')
        : 'Power BI, DAX, SQL, Python (Pandas/NumPy), Star Schema, KPI Dashboards, KNIME, Advanced Excel, Tableau';

      doc.fillColor(textColor).fontSize(8.5).font('Helvetica', { lineGap: 1.5 });
      doc.font('Helvetica-Bold').text('Targeted Skills: ', { continued: true })
         .font('Helvetica').text(skillsList);
      doc.font('Helvetica-Bold').text('BI & Analytics: ', { continued: true })
         .font('Helvetica').text('Power BI, DAX Measures, Power Query, Star Schema Data Modeling, KPI Dashboards, Tableau, Excel');
      doc.font('Helvetica-Bold').text('Languages & Tools: ', { continued: true })
         .font('Helvetica').text('Python (Pandas, NumPy, scikit-learn), SQL (PostgreSQL, MySQL), KNIME Platform, ETL Automation, R');

      // 4. Professional Experience
      renderSectionHeading('Professional Experience');

      // Job 1: Vastu Housing Finance
      doc.fillColor(primaryColor)
         .fontSize(9.5)
         .font('Helvetica-Bold')
         .text('Vastu Housing Finance', { continued: true })
         .font('Helvetica')
         .fillColor(subColor)
         .text(' — Data Analyst', { continued: true });
      doc.fillColor(subColor)
         .fontSize(8.5)
         .text('June 2025 – Present | Mumbai, India', { align: 'right' });

      const bullets1 = tailored?.tailoredBullets || [
        'Designed and deployed centralized Power BI executive dashboards utilizing Star Schema architecture, dynamic slicers, and 10+ custom DAX measures for KPI performance tracking.',
        'Automated SQL data transformation workflows and ETL pipelines in KNIME, eliminating manual spreadsheet overhead and accelerating reporting turnaround by 40%.',
        'Executed exploratory data analysis and predictive modeling using Python (Pandas, NumPy, scikit-learn), extracting actionable trends from complex multi-source datasets.'
      ];

      doc.moveDown(0.2);
      bullets1.forEach(bullet => {
        doc.fillColor(textColor)
           .fontSize(8.5)
           .font('Helvetica')
           .text(`•  ${bullet}`, { indent: 10, lineGap: 1 });
      });

      doc.moveDown(0.4);

      // Job 2: HDFC AMC
      doc.fillColor(primaryColor)
         .fontSize(9.5)
         .font('Helvetica-Bold')
         .text('HDFC Asset Management Company (HDFC AMC)', { continued: true })
         .font('Helvetica')
         .fillColor(subColor)
         .text(' — Data Science Intern', { continued: true });
      doc.fillColor(subColor)
         .fontSize(8.5)
         .text('Internship | Mumbai, India', { align: 'right' });

      doc.moveDown(0.2);
      const hdfcBullets = [
        'Conducted exploratory trend analysis and predictive modeling on financial expense datasets using Python and SQL to uncover cost-saving opportunities.',
        'Engineered automated multi-year expense variance reporting templates and Power BI visualization suites for operational tracking.'
      ];
      hdfcBullets.forEach(bullet => {
        doc.fillColor(textColor)
           .fontSize(8.5)
           .font('Helvetica')
           .text(`•  ${bullet}`, { indent: 10, lineGap: 1 });
      });

      // 5. Education
      renderSectionHeading('Education');

      doc.fillColor(primaryColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Master of Science in Data Science & Artificial Intelligence', { continued: true });
      doc.fillColor(subColor)
         .fontSize(8.5)
         .font('Helvetica')
         .text('Middlesex University Dubai', { align: 'right' });

      doc.fillColor(subColor)
         .fontSize(8)
         .font('Helvetica-Oblique')
         .text('Degree Completed (Awaiting Certificate)  •  Focus: Advanced Machine Learning, Big Data Analytics, Neural Networks');

      doc.moveDown(0.3);

      doc.fillColor(primaryColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Bachelor of Technology in Electronics & Telecommunication', { continued: true });
      doc.fillColor(subColor)
         .fontSize(8.5)
         .font('Helvetica')
         .text('CGPA: 8.86 / 10', { align: 'right' });

      doc.fillColor(subColor)
         .fontSize(8)
         .font('Helvetica')
         .text('Thakur College of Engineering & Technology (TCET), Mumbai');

      // 6. Certifications
      renderSectionHeading('Key Certifications');
      doc.fillColor(textColor)
         .fontSize(8.5)
         .font('Helvetica')
         .text('•  IBM Data Science Professional Certificate (Coursera, 2025)   •   Power BI Specialization (Coursera, 2024)', { lineGap: 1 });
      doc.text('•  The Complete Data Analyst Bootcamp (Udemy)   •   Data Science & Analytics Certification (NASSCOM)');

      // Finalize PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  createTailoredPdfResume
};
