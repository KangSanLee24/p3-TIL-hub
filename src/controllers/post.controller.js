import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPost = async (req, res) => {
  const { title, content, category, visibility } = req.body;
  const userId = req.user.id;

  if (!title || !content || !category || !visibility) {
    return res.status(400).json({ status: 400, errorMessage: '모든 필드를 입력해 주세요.' });
  }

  try {
    const post = await prisma.til.create({
      data: {
        title,
        content,
        category,
        visibility,
        userId,
      },
    });

    res.status(201).json({
      status: 201,
      message: '게시글 등록에 성공했습니다.',
      data: post,
    });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 등록에 실패했습니다.' });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, visibility } = req.body;

  try {
    const post = await prisma.til.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        category,
        visibility,
      },
    });

    res.status(200).json({
      status: 200,
      message: '게시글 수정에 성공했습니다.',
      data: post,
    });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 수정에 실패했습니다.' });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.til.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ status: 200, message: '게시글 삭제에 성공했습니다.' });
  } catch (error) {
    res.status(500).json({ status: 500, errorMessage: '게시글 삭제에 실패했습니다.' });
  }
};
