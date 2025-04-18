const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/db');

// Get all variants with product title
router.get('/', async (req, res) => {
  try {
    const variants = await query(`
      SELECT pv.*, p.prodTitle 
      FROM ProductVariants pv
      JOIN Product p ON pv.prodID = p.prodID
    `);
    res.json(variants);
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get variants by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const variants = await query(
      'SELECT * FROM ProductVariants WHERE prodID = ?',
      [productId]
    );
    
    if (variants.length === 0) {
      return res.status(404).json({ message: 'No variants found for this product.' });
    }

    res.json(variants);
  } catch (error) {
    console.error('Error fetching variants for product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single variant by varID
router.get('/:id', async (req, res) => {
  try {
    const variant = await query('SELECT * FROM ProductVariants WHERE varID = ?', [req.params.id]);
    if (variant.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant[0]);
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new variant
router.post('/', async (req, res) => {
  let connection;
  try {
    const { varSKU, varBCode, prodID, varPrice } = req.body;

    if (!varSKU || !prodID) {
      return res.status(400).json({
        message: 'Variant SKU and product ID are required',
        details: { varSKU, prodID }
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO ProductVariants (varSKU, varBCode, prodID, varPrice) VALUES (?, ?, ?, ?)',
      [varSKU, varBCode, prodID, varPrice || 83.54]
    );

    const variantId = result.insertId;

    await connection.execute(
      'INSERT INTO Inventory (invQty, InvLowStockThreshold, varID) VALUES (?, ?, ?)',
      [0, 5, variantId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Variant created successfully',
      variantId: variantId,
      variant: {
        varID: variantId,
        varSKU,
        varBCode,
        prodID,
        varPrice: varPrice || 83.54
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating variant:', error);
    res.status(500).json({ message: 'Failed to create variant', error: error.message, code: error.code });
  } finally {
    if (connection) connection.release();
  }
});

// Update an existing variant
router.put('/:id', async (req, res) => {
  try {
    const { varSKU, varBCode, prodID, varPrice } = req.body;

    if (!varSKU) {
      return res.status(400).json({ message: 'Variant SKU is required' });
    }

    const variant = await query('SELECT * FROM ProductVariants WHERE varID = ?', [req.params.id]);
    if (variant.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    await query(
      'UPDATE ProductVariants SET varSKU = ?, varBCode = ?, prodID = ?, varPrice = ? WHERE varID = ?',
      [varSKU, varBCode, prodID, varPrice || 83.54, req.params.id]
    );

    res.json({ message: 'Variant updated successfully' });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a variant
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const variant = await query('SELECT * FROM ProductVariants WHERE varID = ?', [req.params.id]);
    if (variant.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute('DELETE FROM Inventory WHERE varID = ?', [req.params.id]);
    await connection.execute('DELETE FROM VariantAttributesValues WHERE varID = ?', [req.params.id]);
    await connection.execute('DELETE FROM ProductVariants WHERE varID = ?', [req.params.id]);

    await connection.commit();
    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
