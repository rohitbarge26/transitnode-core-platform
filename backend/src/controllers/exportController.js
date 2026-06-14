const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
const exceljs = require('exceljs');

exports.exportFinancialData = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;
    
    // Date Filtering Logic
    let query = {};
    if (startDate || endDate) {
      query['metadata.createdAt'] = {};
      if (startDate) query['metadata.createdAt'].$gte = new Date(startDate);
      if (endDate) query['metadata.createdAt'].$lte = new Date(endDate);
    } else {
      // Default to last 30 days if no dates provided
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query['metadata.createdAt'] = { $gte: thirtyDaysAgo };
    }

    const shipments = await ShipmentLedger.find(query);

    if (format === 'xml') {
      // Build Tally XML
      let xmlBody = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>TransitNode ERP</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
`;

      for (const shipment of shipments) {
        const dateStr = new Date(shipment.metadata.createdAt).toISOString().split('T')[0].replace(/-/g, '');
        const amt = shipment.accounting?.grandTotal || 0;
        const subtotal = shipment.accounting?.subtotal || 0;
        const gst = shipment.accounting?.tax?.gstAmount || 0;
        const partyName = shipment.logistics?.sender?.name || 'Cash Customer';

        xmlBody += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${dateStr}</DATE>
            <NARRATION>Freight Sale - Tracking: ${shipment.trackingNumber}</NARRATION>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${partyName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amt}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Freight Income</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${subtotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gst / 2}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gst / 2}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>\n`;
      }

      xmlBody += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="tally_export.xml"');
      return res.status(200).send(xmlBody);

    } else if (format === 'excel') {
      // Build Excel Spreadsheet using exceljs
      const workbook = new exceljs.Workbook();
      workbook.creator = 'TransitNode ERP';
      workbook.lastModifiedBy = 'TransitNode ERP';
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet('Freight Sales Register');

      // Define columns
      sheet.columns = [
        { header: 'Voucher Date', key: 'date', width: 15 },
        { header: 'Invoice/Tracking Number', key: 'tracking', width: 25 },
        { header: 'Party Ledger Name', key: 'party', width: 30 },
        { header: 'Base Freight Revenue', key: 'base', width: 20 },
        { header: 'CGST Amount', key: 'cgst', width: 15 },
        { header: 'SGST Amount', key: 'sgst', width: 15 },
        { header: 'Total Bill Value', key: 'total', width: 20 },
        { header: 'Tax Type', key: 'taxType', width: 15 }
      ];

      // Style header row
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF64748B' } // Slate-500
      };

      // Add data rows
      shipments.forEach(shipment => {
        const amt = shipment.accounting?.grandTotal || 0;
        const subtotal = shipment.accounting?.subtotal || 0;
        const gst = shipment.accounting?.tax?.gstAmount || 0;
        const partyName = shipment.logistics?.sender?.name || 'Cash Customer';
        const rcm = shipment.accounting?.tax?.rcmApplied ? 'RCM' : 'Forward';

        const row = sheet.addRow({
          date: new Date(shipment.metadata.createdAt).toLocaleDateString(),
          tracking: shipment.trackingNumber,
          party: partyName,
          base: subtotal,
          cgst: gst / 2,
          sgst: gst / 2,
          total: amt,
          taxType: rcm
        });

        // Align numbers right, text left
        row.getCell('base').alignment = { horizontal: 'right' };
        row.getCell('cgst').alignment = { horizontal: 'right' };
        row.getCell('sgst').alignment = { horizontal: 'right' };
        row.getCell('total').alignment = { horizontal: 'right' };

        // Number formatting (0.00)
        row.getCell('base').numFmt = '0.00';
        row.getCell('cgst').numFmt = '0.00';
        row.getCell('sgst').numFmt = '0.00';
        row.getCell('total').numFmt = '0.00';
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="freight_sales_register.xlsx"');

      await workbook.xlsx.write(res);
      res.end();

    } else {
      return res.status(400).json({ success: false, message: 'Invalid format requested. Use format=xml or format=excel' });
    }

  } catch (error) {
    console.error('Error generating export:', error);
    res.status(500).json({ success: false, message: 'Server Error generating export', error: error.message });
  }
};
