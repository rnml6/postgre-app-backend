import * as db from '../models/db.js'; 

export const uploadMessage = async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: "Content is required" });
    }
    
    try {
        const result = await db.query(
            'INSERT INTO messages (content) VALUES ($1) RETURNING *',
            [content]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Upload message error:', err);
        res.status(500).json({ error: "Failed to upload message", details: err.message });
    }
};

export const getAllMessages = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM messages ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Retrieve messages error:', err);
        res.status(500).json({ error: "Failed to retrieve messages", details: err.message });
    }
};