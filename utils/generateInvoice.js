import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = (order) => {
  const invoiceDir = path.join("invoices");
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

  const fileName = `INV-${order._id}.pdf`;
  const filePath = path.join(invoiceDir, fileName);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    layout: "portrait",
  });

  doc.pipe(fs.createWriteStream(filePath));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 15;

  /* ================= HEADER ================= */
  // Decorative top line
  doc
    .strokeColor("#b03a2e")
    .lineWidth(2)
    .moveTo(margin, 60)
    .lineTo(pageWidth - margin, 60)
    .stroke();

  // Title
  doc
    .fontSize(24)
    .fillColor("#b03a2e")
    .font("Helvetica-Bold")
    .text("MAHAKAL BHAKTI BAZZAR", margin, 70, {
      align: "left",
      lineGap: 5,
    });

  // Subtitle
  doc
    .fontSize(11)
    .fillColor("#7f8c8d")
    .font("Helvetica")
    .text("Authentic Temple Prashad | Ujjain (MP)", margin, 95);

  // Invoice details box (top-right)
  const invoiceBoxY = 70;
  const invoiceBoxWidth = 200;
  const invoiceBoxHeight = 60;
  doc
    .fillColor("white")
    .strokeColor("#bdc3c7")
    .lineWidth(0.5)
    .roundedRect(
      pageWidth - margin - invoiceBoxWidth,
      invoiceBoxY,
      invoiceBoxWidth,
      invoiceBoxHeight,
      3
    )
    .fillAndStroke();

  doc
    .fontSize(9)
    .fillColor("#2c3e50")
    .font("Helvetica-Bold")
    .text(
      `Invoice No: INV-${order._id}`,
      pageWidth - margin - invoiceBoxWidth + 10,
      invoiceBoxY + 10
    );

  doc
    .fontSize(9)
    .fillColor("#34495e")
    .font("Helvetica")
    .text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
      pageWidth - margin - invoiceBoxWidth + 10,
      invoiceBoxY + 25
    )
    .text(
      `Status: PAID`,
      pageWidth - margin - invoiceBoxWidth + 10,
      invoiceBoxY + 40
    );

  // Section separator
  doc.y = 150;
  doc
    .strokeColor("#ecf0f1")
    .lineWidth(1)
    .moveTo(margin, doc.y)
    .lineTo(pageWidth - margin, doc.y)
    .stroke();

  /* ================= CUSTOMER ================= */
  doc.y += 10;
  doc
    .fontSize(13)
    .fillColor("#2c3e50")
    .font("Helvetica-Bold")
    .text("BILL TO", margin, doc.y);

  // Underline for section
  doc
    .strokeColor("#b03a2e")
    .lineWidth(1)
    .moveTo(margin, doc.y + lineHeight / 2)
    .lineTo(margin + 100, doc.y + lineHeight / 2)
    .stroke();

  doc.y += lineHeight + 5;

  // Customer details in a light box
  const customerBoxHeight = 80;
  doc
    .fillColor("white")
    .strokeColor("#ecf0f1")
    .lineWidth(1)
    .roundedRect(margin, doc.y, contentWidth / 2, customerBoxHeight, 2)
    .stroke();

  doc
    .fontSize(10)
    .fillColor("#34495e")
    .font("Helvetica")
    .text(order.address.fullName, margin + 10, doc.y + 10)
    .text(order.address.houseNumber, margin + 10, doc.y + 25)
    .text(
      `${order.address.townCity}, ${order.address.state} - ${order.address.pincode}`,
      margin + 10,
      doc.y + 40
    )
    .text(`Phone: ${order.address.phone}`, margin + 10, doc.y + 55);

  doc.y += customerBoxHeight + 20;

  /* ================= TABLE ================= */
  // Table borders
  const tableTop = doc.y;
  const tableHeight = Math.max(100, order.products.length * 25); // Dynamic height
  const colWidths = { item: 250, qty: 60, price: 80, total: 100 };
  const colStarts = {
    item: margin,
    qty: margin + colWidths.item,
    price: margin + colWidths.item + colWidths.qty,
    total: margin + colWidths.item + colWidths.qty + colWidths.price,
  };

  // Outer table border
  doc
    .strokeColor("#bdc3c7")
    .lineWidth(1)
    .roundedRect(margin, tableTop, contentWidth, tableHeight, 3)
    .stroke();

  // Headers
  doc
    .fontSize(11)
    .fillColor("#2c3e50")
    .font("Helvetica-Bold")
    .text("Item", colStarts.item + 5, tableTop + 10)
    .text("Qty", colStarts.qty + 5, tableTop + 10)
    .text("Price", colStarts.price + 5, tableTop + 10)
    .text("Total", colStarts.total + 5, tableTop + 10);

  // Header underline
  doc
    .strokeColor("#b03a2e")
    .lineWidth(1.5)
    .moveTo(margin, tableTop + 25)
    .lineTo(pageWidth - margin, tableTop + 25)
    .stroke();

  // Column separators (vertical lines)
  Object.values(colStarts).forEach((startX, index) => {
    if (index < Object.keys(colStarts).length) {
      doc
        .strokeColor("#ecf0f1")
        .lineWidth(0.5)
        .moveTo(
          startX + colWidths[Object.keys(colStarts)[index]],
          tableTop + 25
        )
        .lineTo(
          startX + colWidths[Object.keys(colStarts)[index]],
          tableTop + tableHeight
        )
        .stroke();
    }
  });

  doc.font("Helvetica");

  /* ================= PRODUCTS ================= */
  let rowY = tableTop + 35;
  let subtotal = 0;

  order.products.forEach((item) => {
    const total = item.quantity * item.price;
    subtotal += total;

    doc
      .fontSize(10)
      .fillColor("#34495e")
      .text(
        item.name.substring(0, 40) + (item.name.length > 40 ? "..." : ""),
        colStarts.item + 5,
        rowY
      ) // Truncate long names
      .text(item.quantity.toString(), colStarts.qty + 5, rowY, {
        width: colWidths.qty,
      })
      .text(`₹${item.price.toFixed(2)}`, colStarts.price + 5, rowY, {
        width: colWidths.price,
        align: "right",
      })
      .text(`₹${total.toFixed(2)}`, colStarts.total + 5, rowY, {
        width: colWidths.total,
        align: "right",
      });

    // Row separator
    doc
      .strokeColor("#ecf0f1")
      .lineWidth(0.5)
      .moveTo(margin, rowY + lineHeight)
      .lineTo(pageWidth - margin, rowY + lineHeight)
      .stroke();

    rowY += lineHeight + 5;
  });

  // Ensure table closes properly
  doc
    .strokeColor("#bdc3c7")
    .lineWidth(1)
    .moveTo(margin, rowY)
    .lineTo(pageWidth - margin, rowY)
    .stroke();

  doc.y = rowY + 30;

  /* ================= TOTALS ================= */
  // Totals box (right-aligned)
  const totalsBoxWidth = 200;
  const totalsBoxY = doc.y;
  const totalsBoxHeight = 70;
  doc
    .fillColor("white")
    .strokeColor("#bdc3c7")
    .lineWidth(1)
    .roundedRect(
      pageWidth - margin - totalsBoxWidth,
      totalsBoxY,
      totalsBoxWidth,
      totalsBoxHeight,
      3
    )
    .stroke();

  doc
    .fontSize(10)
    .fillColor("#34495e")
    .font("Helvetica")
    .text(
      `Subtotal:`,
      pageWidth - margin - totalsBoxWidth + 10,
      totalsBoxY + 10
    )
    .text(`₹${subtotal.toFixed(2)}`, pageWidth - margin - 30, totalsBoxY + 10, {
      align: "right",
    });

  doc
    .text(
      "Shipping:",
      pageWidth - margin - totalsBoxWidth + 10,
      totalsBoxY + 25
    )
    .text("₹0.00", pageWidth - margin - 30, totalsBoxY + 25, {
      align: "right",
    });

  // Grand total with highlight
  doc
    .fontSize(12)
    .fillColor("#1e8449")
    .font("Helvetica-Bold")
    .text(
      "Grand Total:",
      pageWidth - margin - totalsBoxWidth + 10,
      totalsBoxY + 45
    )
    .text(`₹${subtotal.toFixed(2)}`, pageWidth - margin - 30, totalsBoxY + 45, {
      align: "right",
    });

  doc.fillColor("#34495e").font("Helvetica");

  doc.y = totalsBoxY + totalsBoxHeight + 40;

  /* ================= FOOTER ================= */
  // Decorative bottom line
  doc
    .strokeColor("#b03a2e")
    .lineWidth(2)
    .moveTo(margin, doc.y)
    .lineTo(pageWidth - margin, doc.y)
    .stroke();

  doc.y += 20;

  doc
    .fontSize(10)
    .fillColor("#7f8c8d")
    .font("Helvetica")
    .text(
      "🙏 Thank you for ordering sacred prashad from Mahakal Bhakti Bazzar.\nThis is a system-generated invoice. For queries, contact us at support@mahakalbhaktibazzar.com.",
      margin,
      doc.y,
      { align: "center", width: contentWidth, lineGap: 5 }
    );

  // Ensure page ends properly
  doc.end();
  return filePath;
};
