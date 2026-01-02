import * as db from '../models/db.js';

export const uploadPost = async (req, res) => {
    const { caption } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "At least one image is required" });
    }

    let client;
    try {
        // Get a client from the pool
        client = await db.pool.connect();
        await client.query('BEGIN');

        // Insert post and get the ID
        const postRes = await client.query(
            'INSERT INTO posts (caption) VALUES ($1) RETURNING id',
            [caption || null]
        );
        
        const postId = postRes.rows[0].id;
        console.log('Created post with ID:', postId); // Debug log

        // Insert all images
        const imageInsertPromises = files.map(file => {
            return client.query(
                'INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)',
                [postId, `/uploads/${file.filename}`]
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
        // Get posts with their images
        const result = await db.query(`
            SELECT 
                p.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', pi.id,
                            'image_url', pi.image_url
                        )
                    ) FILTER (WHERE pi.id IS NOT NULL),
                    '[]'
                ) as images,
                COUNT(pi.id) as image_count
            FROM posts p
            LEFT JOIN post_images pi ON p.id = pi.post_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Retrieve posts error:', err);
        res.status(500).json({ error: "Failed to retrieve posts", details: err.message });
    }
};