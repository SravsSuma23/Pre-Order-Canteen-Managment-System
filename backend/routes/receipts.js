const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Ensure receipts directory exists
const ensureReceiptsDir = async () => {
  const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
  try {
    await fs.access(receiptsDir);
  } catch (error) {
    await fs.mkdir(receiptsDir, { recursive: true });
  }
  return receiptsDir;
};

// Generate HTML receipt template
const generateHTMLReceipt = (orderData) => {
  const {
    order,
    items,
    payment,
    canteen,
    user
  } = orderData;

  const companyName = process.env.COMPANY_NAME || 'Canteen Management System';
  const companyAddress = process.env.COMPANY_ADDRESS || 'Your Institution Address';
  const companyPhone = process.env.COMPANY_PHONE || '+91-80-12345678';
  const companyEmail = process.env.COMPANY_EMAIL || 'contact@yourinstitution.edu';
  const logoUrl = process.env.RECEIPT_LOGO_URL || '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - Order ${order.order_id.slice(-8)}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            
            .receipt-container {
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .receipt-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .company-info h1 {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .company-info p {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            
            .receipt-body {
                padding: 30px;
            }
            
            .order-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eee;
            }
            
            .order-info, .customer-info {
                flex: 1;
            }
            
            .order-info h3, .customer-info h3 {
                color: #667eea;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .label {
                font-weight: bold;
                color: #555;
            }
            
            .value {
                color: #333;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-paid {
                background: #d4edda;
                color: #155724;
            }
            
            .status-pending {
                background: #fff3cd;
                color: #856404;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .items-table th {
                background: #f8f9fa;
                padding: 15px 10px;
                text-align: left;
                font-weight: bold;
                color: #555;
                border-bottom: 2px solid #dee2e6;
            }
            
            .items-table td {
                padding: 12px 10px;
                border-bottom: 1px solid #dee2e6;
            }
            
            .items-table tr:last-child td {
                border-bottom: none;
            }
            
            .veg-badge, .non-veg-badge {
                width: 12px;
                height: 12px;
                border: 2px solid;
                border-radius: 2px;
                display: inline-block;
                margin-right: 8px;
            }
            
            .veg-badge {
                border-color: #28a745;
                background: #28a745;
            }
            
            .non-veg-badge {
                border-color: #dc3545;
                background: #dc3545;
            }
            
            .item-name {
                font-weight: 500;
                display: flex;
                align-items: center;
            }
            
            .totals-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .total-row.final {
                font-size: 18px;
                font-weight: bold;
                color: #667eea;
                border-top: 2px solid #dee2e6;
                padding-top: 15px;
                margin-top: 15px;
            }
            
            .pickup-info {
                background: #e7f3ff;
                border: 1px solid #b3d9ff;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            
            .pickup-info h3 {
                color: #0066cc;
                margin-bottom: 10px;
            }
            
            .pickup-time {
                font-size: 18px;
                font-weight: bold;
                color: #0066cc;
                margin: 10px 0;
            }
            
            .instructions {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            
            .instructions h4 {
                color: #856404;
                margin-bottom: 10px;
            }
            
            .qr-section {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .receipt-footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                color: #666;
                font-size: 12px;
            }
            
            @media print {
                body {
                    background: white;
                    margin: 0;
                    padding: 0;
                }
                
                .receipt-container {
                    box-shadow: none;
                    border-radius: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="receipt-header">
                ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" style="max-width: 60px; max-height: 60px;"></div>` : ''}
                <div class="company-info">
                    <h1>${companyName}</h1>
                    <p>${companyAddress}</p>
                    <p>📞 ${companyPhone} | 📧 ${companyEmail}</p>
                </div>
            </div>
            
            <div class="receipt-body">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order Details</h3>
                        <div class="info-row">
                            <span class="label">Order ID:</span>
                            <span class="value">${order.order_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Date & Time:</span>
                            <span class="value">${new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Canteen:</span>
                            <span class="value">${canteen.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Location:</span>
                            <span class="value">${canteen.location}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Payment Status:</span>
                            <span class="value">
                                <span class="status-badge ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">
                                    ${order.payment_status}
                                </span>
                            </span>
                        </div>
                    </div>
                    
                    <div class="customer-info">
                        <h3>Customer Details</h3>
                        <div class="info-row">
                            <span class="label">Name:</span>
                            <span class="value">${user.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Phone:</span>
                            <span class="value">${user.phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value">${user.email}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Role:</span>
                            <span class="value">${user.role}</span>
                        </div>
                        ${payment && payment.transaction_ref ? `
                        <div class="info-row">
                            <span class="label">Transaction ID:</span>
                            <span class="value">${payment.transaction_ref}</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>
                                    <div class="item-name">
                                        <span class="${item.vegetarian ? 'veg-badge' : 'non-veg-badge'}"></span>
                                        ${item.item_name}
                                    </div>
                                </td>
                                <td>${item.quantity}</td>
                                <td>₹${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>₹${parseFloat(item.total_price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals-section">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>₹${parseFloat(order.subtotal_amount).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (${((parseFloat(order.tax_amount) / parseFloat(order.subtotal_amount)) * 100).toFixed(1)}%):</span>
                        <span>₹${parseFloat(order.tax_amount).toFixed(2)}</span>
                    </div>
                    <div class="total-row final">
                        <span>Total Amount:</span>
                        <span>₹${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="pickup-info">
                    <h3>🍽️ Pickup Information</h3>
                    <div class="pickup-time">${new Date(order.pickup_time).toLocaleString()}</div>
                    <p>Please arrive at the scheduled time to collect your order</p>
                    <p><strong>Show this receipt at the canteen counter</strong></p>
                </div>
                
                ${order.special_instructions ? `
                <div class="instructions">
                    <h4>📝 Special Instructions</h4>
                    <p>${order.special_instructions}</p>
                </div>` : ''}
                
                <div class="qr-section">
                    <h4>Order QR Code</h4>
                    <p style="font-size: 12px; margin-top: 10px;">
                        Order ID: ${order.order_id}<br>
                        Generated on: ${new Date().toLocaleString()}
                    </p>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>Thank you for your order! 🙏</p>
                <p>For any queries, please contact: ${companyPhone}</p>
                <p style="margin-top: 10px;">This is a computer-generated receipt.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// @desc    Generate and download receipt (HTML)
// @route   GET /api/receipts/:orderId/html
// @access  Private
const getHTMLReceipt = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Get order details with all related data
  const { rows: orderRows } = await db.execute(`
    SELECT 
      o.*,
      c.name as canteen_name,
      c.location as canteen_location,
      c.contact as canteen_contact,
      u.name as user_name,
      u.phone as user_phone,
      u.email as user_email,
      u.role as user_role
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Check authorization
  if (!['admin', 'canteen_staff'].includes(req.user.role) && order.user_id !== req.user.user_id) {
    throw new AppError('Not authorized to view this receipt', 403);
  }

  // Check if order is paid
  if (order.payment_status !== 'paid') {
    throw new AppError('Receipt can only be generated for paid orders', 400);
  }

  // Get order items
  const { rows: itemRows } = await db.execute(`
    SELECT 
      oi.*,
      m.is_veg
    FROM order_items oi
    LEFT JOIN menu_items m ON oi.item_id = m.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `, [orderId]);

  // Get payment details
  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE order_id = ? AND payment_status = "success" ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  // Prepare data for template
  const receiptData = {
    order: order,
    items: itemRows.map(item => ({
      ...item,
      vegetarian: Boolean(item.is_veg)
    })),
    payment: paymentRows.length > 0 ? paymentRows[0] : null,
    canteen: {
      name: order.canteen_name,
      location: order.canteen_location,
      contact: order.canteen_contact
    },
    user: {
      name: order.user_name,
      phone: order.user_phone,
      email: order.user_email,
      role: order.user_role
    }
  };

  // Generate HTML receipt
  const htmlReceipt = generateHTMLReceipt(receiptData);

  logger.logUserActivity(req.user.user_id, 'RECEIPT_GENERATED', {
    order_id: orderId,
    format: 'html'
  });

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `inline; filename="receipt-${orderId}.html"`);
  res.send(htmlReceipt);
});

// @desc    Generate and download receipt (PDF)
// @route   GET /api/receipts/:orderId/pdf
// @access  Private
const getPDFReceipt = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Get order details (same as HTML receipt)
  const { rows: orderRows } = await db.execute(`
    SELECT 
      o.*,
      c.name as canteen_name,
      c.location as canteen_location,
      c.contact as canteen_contact,
      u.name as user_name,
      u.phone as user_phone,
      u.email as user_email,
      u.role as user_role
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Check authorization
  if (!['admin', 'canteen_staff'].includes(req.user.role) && order.user_id !== req.user.user_id) {
    throw new AppError('Not authorized to view this receipt', 403);
  }

  // Check if order is paid
  if (order.payment_status !== 'paid') {
    throw new AppError('Receipt can only be generated for paid orders', 400);
  }

  // Get order items and payment details (same as HTML)
  const { rows: itemRows } = await db.execute(`
    SELECT 
      oi.*,
      m.is_veg
    FROM order_items oi
    LEFT JOIN menu_items m ON oi.item_id = m.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `, [orderId]);

  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE order_id = ? AND payment_status = "success" ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  const receiptData = {
    order: order,
    items: itemRows.map(item => ({
      ...item,
      vegetarian: Boolean(item.is_veg)
    })),
    payment: paymentRows.length > 0 ? paymentRows[0] : null,
    canteen: {
      name: order.canteen_name,
      location: order.canteen_location,
      contact: order.canteen_contact
    },
    user: {
      name: order.user_name,
      phone: order.user_phone,
      email: order.user_email,
      role: order.user_role
    }
  };

  try {
    // Generate HTML first
    const htmlReceipt = generateHTMLReceipt(receiptData);

    // Launch puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });

    const page = await browser.newPage();
    await page.setContent(htmlReceipt, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    logger.logUserActivity(req.user.user_id, 'RECEIPT_GENERATED', {
      order_id: orderId,
      format: 'pdf'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${orderId.slice(-8)}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error('PDF generation failed:', error);
    throw new AppError('Failed to generate PDF receipt. Please try again.', 500);
  }
});

// @desc    Get receipt details (JSON format)
// @route   GET /api/receipts/:orderId
// @access  Private
const getReceiptData = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Same logic as above but return JSON
  const { rows: orderRows } = await db.execute(`
    SELECT 
      o.*,
      c.name as canteen_name,
      c.location as canteen_location,
      c.contact as canteen_contact,
      u.name as user_name,
      u.phone as user_phone,
      u.email as user_email,
      u.role as user_role
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  if (!['admin', 'canteen_staff'].includes(req.user.role) && order.user_id !== req.user.user_id) {
    throw new AppError('Not authorized to view this receipt', 403);
  }

  if (order.payment_status !== 'paid') {
    throw new AppError('Receipt can only be generated for paid orders', 400);
  }

  const { rows: itemRows } = await db.execute(`
    SELECT 
      oi.*,
      m.is_veg
    FROM order_items oi
    LEFT JOIN menu_items m ON oi.item_id = m.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `, [orderId]);

  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE order_id = ? AND payment_status = "success" ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  res.json({
    success: true,
    data: {
      receipt: {
        order: order,
        items: itemRows.map(item => ({
          ...item,
          vegetarian: Boolean(item.is_veg)
        })),
        payment: paymentRows.length > 0 ? paymentRows[0] : null,
        canteen: {
          name: order.canteen_name,
          location: order.canteen_location,
          contact: order.canteen_contact
        },
        user: {
          name: order.user_name,
          phone: order.user_phone,
          email: order.user_email,
          role: order.user_role
        },
        generated_at: new Date().toISOString()
      }
    }
  });
});

// Routes
router.use(protect);

router.get('/:orderId', getReceiptData);
router.get('/:orderId/html', getHTMLReceipt);
router.get('/:orderId/pdf', getPDFReceipt);

module.exports = router;