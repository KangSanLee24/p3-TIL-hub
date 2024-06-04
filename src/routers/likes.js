const express = require('express');
const router = express.Router();
const prisma = require('../prisma-client');

// 좋아요 생성
router.post('/til/:til_id', async (req, res) => {
  const { postId, userId } = req.body;

  try {
    const like = await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    res.status(201).json(like);
  } catch (error) {
    res.status(400).json({ error: '좋아요 생성에 실패했습니다.' });
  }
});

// 좋아요 삭제
router.delete('/til/:til_id', async (req, res) => {
  const likeId = parseInt(req.params.id);

  try {
    await prisma.like.delete({
      where: { id: likeId },
    });

    res.status(200).json({ message: '좋아요 삭제에 성공했습니다.' });
  } catch (error) {
    res.status(404).json({ error: '좋아요를 찾을 수 없습니다.' });
  }
});

module.exports = router;