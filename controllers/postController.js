import * as db from '../models/db.js';

export const uploadPost = async (req, res) => {
    const { caption } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "At least one image is required" });
    }

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        const postRes = await client.query(
            'INSERT INTO posts (caption) VALUES ($1) RETURNING id',
            [caption || null]
        );
        
        const postId = postRes.rows[0].id;
        
        // Get your server URL (use environment variable in production)
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
        
        const imageInsertPromises = files.map(file => {
            // Store full URL instead of just the path
            const fullImageUrl = `${serverUrl}/uploads/${file.filename}`;
            return client.query(
                'INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)',
                [postId, fullImageUrl]
            );
        });

        await Promise.all(imageInsertPromises);
        await client.query('COMMIT');

        res.status(201).json({ success: true, postId });
    } catch (err) {
        console.error('Upload post error:', err);
        if (client) {
            await client.query('ROLLBACK');
        }
        res.status(500).json({ error: "Server error", details: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const getAllPosts = async (req, res) => {
    try {
        // If you want to ensure all images have full URLs
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
        
        const result = await db.query(`
            SELECT 
                p.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', pi.id,
                            'image_url', 
                            CASE 
                                WHEN pi.image_url LIKE 'http%' THEN pi.image_url
                                ELSE CONCAT($1, pi.image_url)
                            END
                        )
                    ) FILTER (WHERE pi.id IS NOT NULL),
                    '[]'
                ) as images,
                COUNT(pi.id) as image_count
            FROM posts p
            LEFT JOIN post_images pi ON p.id = pi.post_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [serverUrl]);

        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Retrieve posts error:', err);
        res.status(500).json({ error: "Failed to retrieve posts", details: err.message });
    }
};