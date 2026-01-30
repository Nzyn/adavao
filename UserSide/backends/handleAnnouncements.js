const db = require('./db');

/**
 * Get all announcements (public, no auth required)
 * Returns latest announcements first
 */
async function getAnnouncements(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [rows] = await db.query(
            `SELECT 
                a.id,
                a.title,
                a.content,
                a.attachments,
                a.created_at,
                a.updated_at,
                u.firstname AS author_firstname,
                u.lastname AS author_lastname
             FROM announcements a
             LEFT JOIN user_admin u ON a.user_id = u.id
             ORDER BY a.created_at DESC
             LIMIT $1`,
            [limit]
        );

        // Format the response
        const announcements = rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : [],
            author: row.author_firstname ? `${row.author_firstname} ${row.author_lastname || ''}`.trim() : 'Admin',
            created_at: row.created_at,
            // Format date for display
            date: formatDate(row.created_at)
        }));

        return res.json({
            success: true,
            data: announcements,
            count: announcements.length
        });

    } catch (error) {
        console.error('Error fetching announcements:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements',
            error: error.message
        });
    }
}

/**
 * Get a single announcement by ID
 */
async function getAnnouncementById(req, res) {
    try {
        const { id } = req.params;
        
        const [rows] = await db.query(
            `SELECT 
                a.id,
                a.title,
                a.content,
                a.attachments,
                a.created_at,
                a.updated_at,
                u.firstname AS author_firstname,
                u.lastname AS author_lastname
             FROM announcements a
             LEFT JOIN user_admin u ON a.user_id = u.id
             WHERE a.id = $1`,
            [id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        const row = rows[0];
        const announcement = {
            id: row.id,
            title: row.title,
            content: row.content,
            attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : [],
            author: row.author_firstname ? `${row.author_firstname} ${row.author_lastname || ''}`.trim() : 'Admin',
            created_at: row.created_at,
            date: formatDate(row.created_at)
        };

        return res.json({
            success: true,
            data: announcement
        });

    } catch (error) {
        console.error('Error fetching announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch announcement',
            error: error.message
        });
    }
}

/**
 * Helper function to format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

module.exports = {
    getAnnouncements,
    getAnnouncementById
};
