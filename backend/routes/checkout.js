const express = require('express');
const router = express.Router();
const { Order } = require('../models');

router.post('/api/checkout', async (req, res) => {
  const { userID, items, totalAmount, name, email, phone, address } = req.body;

  if (!userID || !items || items.length === 0 || !totalAmount || !name || !email || !phone || !address) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    const order = await Order.create({
      userId: userID,
      items: items,
      totalAmount: totalAmount,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address,
      status: 'pending',
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Error placing order' });
  }
});

module.exports = router;
