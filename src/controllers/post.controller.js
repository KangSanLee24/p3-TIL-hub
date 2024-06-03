import { query } from '../services/db.service.js';

export const createPost = async (req, res) => {
  const { title, content, category, visibility } = req.body;
  const userId = req.user.id;

  if (!title || !content || !category || !visibility) {
    return res.status(400).json({ status: 400, errorMessage: '모든 필드를 입력해 주세요.' });
  }

  const sql = 'INSERT INTO posts (userId, title, content, category, visibility, likeNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [userId, title, content, category, visibility, 0, new Date(), new Date()];

  try {
    const result = await query(sql, values);
    res.status(201).json({
      status: 201,
      message: '게시글 등록에 성공했습니다.',
      data: { id: result.insertId, userId, title, content, category, visibility, likeNumber: 0, createdAt: new Date(), updatedAt: new Date() }
    });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 등록에 실패했습니다.' });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, visibility } = req.body;

  if (!title && !content && !category && !visibility) {
    return res.status(400).json({ status: 400, errorMessage: '수정할 정보를 입력해 주세요.' });
  }

  const updates = [];
  const values = [];
  if (title) updates.push('title = ?'), values.push(title);
  if (content) updates.push('content = ?'), values.push(content);
  if (category) updates.push('category = ?'), values.push(category);
  if (visibility) updates.push('visibility = ?'), values.push(visibility);
  values.push(new Date(), id);

  const sql = `UPDATE posts SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`;

  try {
    await query(sql, values);
    res.status(200).json({ status: 200, message: '게시글 수정에 성공했습니다.' });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 수정에 실패했습니다.' });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM posts WHERE id = ?';

  try {
    await query(sql, [id]);
    res.status(200).json({ status: 200, message: '게시글 삭제에 성공했습니다.' });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 삭제에 실패했습니다.' });
  }
};
