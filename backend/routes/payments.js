const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect, sensitiveRateLimit } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const initiatePaymentSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  upi_id: Joi.string().optional()
});

const verifyPaymentSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  transaction_ref: Joi.string().required(),
  upi_ref_id: Joi.string().optional(),
  amount: Joi.number().positive().precision(2).required()
});

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'qr-codes');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Helper function to generate UPI deep link
const generateUPIDeepLink = (payeeUPI, payeeName, amount, transactionNote, merchantCode = null) => {
  const params = new URLSearchParams({
    pa: payeeUPI, // Payee Address (UPI ID)
    pn: payeeName, // Payee Name
    am: amount.toString(), // Amount
    tn: transactionNote, // Transaction Note
    cu: 'INR' // Currency
  });

  if (merchantCode) {
    params.append('mc', merchantCode);
  }

  return `upi://pay?${params.toString()}`;
};

// Helper function to generate QR code
const generateQRCode = async (data, filename) => {
  const uploadsDir = await ensureUploadsDir();
  const qrPath = path.join(uploadsDir, filename);
  
  const options = {
    width: parseInt(process.env.QR_CODE_SIZE) || 200,
    margin: parseInt(process.env.QR_CODE_MARGIN) || 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };

  await QRCode.toFile(qrPath, data, options);
  return `/uploads/qr-codes/${filename}`;
};

// @desc    Initiate UPI payment for order
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = asyncHandler(async (req, res) => {
  const { error, value } = initiatePaymentSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { order_id, amount, upi_id } = value;

  // Get order details
  const { rows: orderRows } = await db.execute(`
    SELECT o.*, c.name as canteen_name
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    WHERE o.order_id = ? AND o.user_id = ?
  `, [order_id, req.user.user_id]);

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Verify order details
  if (order.payment_status === 'paid') {
    throw new AppError('Order is already paid', 400);
  }

  if (order.order_status === 'cancelled') {
    throw new AppError('Cannot pay for cancelled order', 400);
  }

  // Verify amount matches order total
  if (Math.abs(amount - parseFloat(order.total_amount)) > 0.01) {
    throw new AppError('Amount does not match order total', 400);
  }

  // Payment configuration from environment
  const merchantUPI = process.env.UPI_MERCHANT_ID || 'merchant@upi';
  const merchantName = process.env.UPI_MERCHANT_NAME || 'Canteen Management System';
  const merchantCode = process.env.UPI_MERCHANT_CODE || null;

  // Generate payment ID
  const paymentId = uuidv4();
  const transactionNote = `Order ${order_id.slice(-8)} - ${order.canteen_name}`;

  // Generate UPI deep link
  const upiLink = generateUPIDeepLink(
    merchantUPI,
    merchantName,
    amount,
    transactionNote,
    merchantCode
  );

  // Generate QR code
  const qrFilename = `payment-${paymentId}.png`;
  const qrCodeUrl = await generateQRCode(upiLink, qrFilename);

  // Create payment record
  await db.execute(`
    INSERT INTO payments (
      payment_id, order_id, user_id, amount, payment_mode, payment_status, created_at
    ) VALUES (?, ?, ?, ?, 'upi', 'initiated', NOW())
  `, [paymentId, order_id, req.user.user_id, amount]);

  // Log payment initiation
  logger.logPayment({
    paymentId,
    orderId: order_id,
    amount,
    status: 'initiated',
    paymentMode: 'upi'
  });

  logger.logUserActivity(req.user.user_id, 'PAYMENT_INITIATED', {
    payment_id: paymentId,
    order_id,
    amount
  });

  res.status(201).json({
    success: true,
    message: 'Payment initiated successfully',
    data: {
      payment_id: paymentId,
      order_id,
      amount,
      upi_link: upiLink,
      qr_code_url: qrCodeUrl,
      merchant_upi: merchantUPI,
      merchant_name: merchantName,
      transaction_note: transactionNote,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      instructions: {
        scan_qr: "Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.)",
        manual_payment: `Send ₹${amount} to UPI ID: ${merchantUPI}`,
        reference: `Use reference: ${transactionNote}`
      }
    }
  });
});

// @desc    Verify UPI payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { error, value } = verifyPaymentSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { order_id, transaction_ref, upi_ref_id, amount } = value;

  // Get payment record
  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE order_id = ? AND payment_status = "initiated" ORDER BY created_at DESC LIMIT 1',
    [order_id]
  );

  if (paymentRows.length === 0) {
    throw new AppError('Payment record not found or already processed', 404);
  }

  const payment = paymentRows[0];

  // Verify amount
  if (Math.abs(amount - parseFloat(payment.amount)) > 0.01) {
    throw new AppError('Amount mismatch', 400);
  }

  // Get order details
  const { rows: orderRows } = await db.execute(
    'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
    [order_id, req.user.user_id]
  );

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  try {
    // In a real implementation, you would verify the transaction with UPI gateway
    // For demo purposes, we'll accept the transaction reference and mark as successful
    
    // Note: In production, integrate with actual UPI gateway for verification
    // This might involve calling gateway APIs or webhook verification
    
    const gatewayResponse = {
      status: 'success',
      transaction_id: transaction_ref,
      upi_ref_id: upi_ref_id,
      amount: amount,
      verified_at: new Date().toISOString(),
      gateway: 'demo' // Replace with actual gateway name
    };

    await db.transaction([
      // Update payment status
      {
        query: `
          UPDATE payments 
          SET payment_status = 'success', transaction_ref = ?, upi_ref_id = ?, 
              gateway_response = ?, updated_at = NOW() 
          WHERE payment_id = ?
        `,
        params: [transaction_ref, upi_ref_id, JSON.stringify(gatewayResponse), payment.payment_id]
      },
      // Update order payment status
      {
        query: 'UPDATE orders SET payment_status = "paid", transaction_id = ?, updated_at = NOW() WHERE order_id = ?',
        params: [transaction_ref, order_id]
      }
    ]);

    // Log successful payment
    logger.logPayment({
      paymentId: payment.payment_id,
      orderId: order_id,
      amount,
      status: 'success',
      paymentMode: 'upi',
      transactionRef: transaction_ref
    });

    logger.logUserActivity(req.user.user_id, 'PAYMENT_VERIFIED', {
      payment_id: payment.payment_id,
      order_id,
      transaction_ref,
      amount
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment_id: payment.payment_id,
        order_id,
        transaction_ref,
        amount,
        status: 'success',
        verified_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Payment verification failed:', error);
    
    // Mark payment as failed
    await db.execute(
      'UPDATE payments SET payment_status = "failed", updated_at = NOW() WHERE payment_id = ?',
      [payment.payment_id]
    );

    throw new AppError('Payment verification failed. Please try again.', 500);
  }
});

// @desc    Get payment status
// @route   GET /api/payments/:paymentId/status
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const { rows } = await db.execute(`
    SELECT p.*, o.user_id, o.total_amount
    FROM payments p
    JOIN orders o ON p.order_id = o.order_id
    WHERE p.payment_id = ?
  `, [paymentId]);

  if (rows.length === 0) {
    throw new AppError('Payment not found', 404);
  }

  const payment = rows[0];

  // Check if user owns this payment
  if (payment.user_id !== req.user.user_id && !['admin', 'canteen_staff'].includes(req.user.role)) {
    throw new AppError('Not authorized to view this payment', 403);
  }

  res.json({
    success: true,
    data: {
      payment: {
        payment_id: payment.payment_id,
        order_id: payment.order_id,
        amount: payment.amount,
        payment_mode: payment.payment_mode,
        payment_status: payment.payment_status,
        transaction_ref: payment.transaction_ref,
        upi_ref_id: payment.upi_ref_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }
    }
  });
});

// @desc    Get payment history for user
// @route   GET /api/payments
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, status } = req.query;

  let query = `
    SELECT 
      p.payment_id,
      p.order_id,
      p.amount,
      p.payment_mode,
      p.payment_status,
      p.transaction_ref,
      p.created_at,
      c.name as canteen_name
    FROM payments p
    JOIN orders o ON p.order_id = o.order_id
    JOIN canteens c ON o.canteen_id = c.canteen_id
    WHERE o.user_id = ?
  `;
  
  const params = [req.user.user_id];

  if (status) {
    query += ' AND p.payment_status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      payments: rows
    }
  });
});

// @desc    Manual payment verification (Admin only)
// @route   PATCH /api/payments/:paymentId/verify-manual
// @access  Private (Admin)
const manualPaymentVerification = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { verified, notes } = req.body;

  if (typeof verified !== 'boolean') {
    throw new AppError('Verification status is required', 400);
  }

  // Get payment details
  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE payment_id = ?',
    [paymentId]
  );

  if (paymentRows.length === 0) {
    throw new AppError('Payment not found', 404);
  }

  const payment = paymentRows[0];

  if (payment.payment_status === 'success') {
    throw new AppError('Payment is already verified', 400);
  }

  const newStatus = verified ? 'success' : 'failed';

  try {
    await db.transaction([
      // Update payment status
      {
        query: 'UPDATE payments SET payment_status = ?, updated_at = NOW() WHERE payment_id = ?',
        params: [newStatus, paymentId]
      },
      // Update order if payment is successful
      ...(verified ? [{
        query: 'UPDATE orders SET payment_status = "paid", updated_at = NOW() WHERE order_id = ?',
        params: [payment.order_id]
      }] : [])
    ]);

    logger.logUserActivity(req.user.user_id, 'MANUAL_PAYMENT_VERIFICATION', {
      payment_id: paymentId,
      order_id: payment.order_id,
      verified,
      notes
    });

    res.json({
      success: true,
      message: `Payment ${verified ? 'verified' : 'marked as failed'} successfully`,
      data: {
        payment_id: paymentId,
        status: newStatus
      }
    });

  } catch (error) {
    logger.error('Manual payment verification failed:', error);
    throw new AppError('Failed to update payment status', 500);
  }
});

// Routes with rate limiting for sensitive operations
router.use(protect); // All payment routes require authentication

router.post('/initiate', sensitiveRateLimit(5 * 60 * 1000, 10), initiatePayment);
router.post('/verify', sensitiveRateLimit(5 * 60 * 1000, 10), verifyPayment);
router.get('/', getPaymentHistory);
router.get('/:paymentId/status', getPaymentStatus);

// Admin only routes
router.patch('/:paymentId/verify-manual', 
  require('../middleware/authMiddleware').authorize('admin'),
  manualPaymentVerification
);

module.exports = router;