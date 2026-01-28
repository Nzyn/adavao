const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Save user's push notification token
 */
router.post('/push-token', async (req, res) => {
    try {
        const { user_id, push_token } = req.body;

        if (!user_id || !push_token) {
            return res.status(400).json({
                success: false,
                message: 'User ID and push token are required'
            });
        }

        // Update user's push token
        const query = `
      UPDATE users_public 
      SET push_token = $1, 
          updated_at = NOW() 
      WHERE id = $2
    `;

        await db.query(query, [push_token, user_id]);

        console.log(`✅ Push token saved for user ${user_id}`);

        res.json({
            success: true,
            message: 'Push token saved successfully'
        });

    } catch (error) {
        console.error('Error saving push token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save push token',
            error: error.message
        });
    }
});

/**
 * Toggle user's on-duty status (for patrol officers)
 */
router.post('/duty-status', async (req, res) => {
    try {
        const { user_id, is_on_duty } = req.body;

        if (!user_id || typeof is_on_duty !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'User ID and duty status are required'
            });
        }

        const query = `
      UPDATE users_public 
      SET is_on_duty = $1, 
          updated_at = NOW() 
      WHERE id = $2 AND user_role = 'patrol_officer'
            RETURNING id, firstname, lastname, is_on_duty
    `;

        const result = await db.query(query, [is_on_duty, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patrol officer not found'
            });
        }

        console.log(`✅ Duty status updated for officer ${user_id}: ${is_on_duty ? 'ON' : 'OFF'} duty`);

        res.json({
            success: true,
            message: 'Duty status updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating duty status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update duty status',
            error: error.message
        });
    }
});

module.exports = router;
