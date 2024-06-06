import express from "express";
import { prisma } from "../utils/prisma/index.js";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
const router = express.Router();

// 코멘트 좋아요 생성 API
router.post("/:id/like", requireAccessToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // 사용자가 좋아요를 누른 적이 있는지 확인
    const existingLike = await prisma.CommentLike.findFirst({
      where: {
        CommentId: parseInt(id),
        UserId: userId,
      },
    });

    if (existingLike) {
      return res
        .status(400)
        .json({ error: "이미 코멘트에 좋아요를 눌렀습니다." });
    }
    // 코멘트 작성자와 현재 사용자 확인
    const comment = await prisma.Comment.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        UserId: true,
      },
    });

    if (parseInt(comment.UserId) === parseInt(userId)) {
      return res
        .status(400)
        .json({ error: "자신의 코멘트에는 좋아요를 누를 수 없습니다." });
    }

    // 데이터 선택
    const like = await prisma.CommentLike.create({
      data: {
        CommentId: parseInt(id),
        UserId: userId,
      },
      include: {
        Comment: {
          select: {
            content: true,
            createdAt: true,
          },
        },
        User: {
          select: {
            name: true,
          },
        },
      },
    });

    // 데이터 출력
    res.status(201).json({
      status: 200,
      message: "댓글좋아요를 성공했습니다.",
      tilId: like.Comment.TilId,
      Comment: like.Comment.content,
      UserId: like.User.name,
    });
  } catch (error) {
    next(error);
  }
});

// 코멘트 좋아요 삭제 API
router.delete("/:id/like", requireAccessToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // 사용자가 좋아요를 누른 적이 있는지 확인
    const existingLike = await prisma.CommentLike.findFirst({
      where: {
        CommentId: parseInt(id),
        UserId: userId,
      },
    });

    if (!existingLike) {
      return res
        .status(400)
        .json({ error: "코멘트에 좋아요를 누르지 않았습니다." });
    }

    await prisma.CommentLike.delete({
      where: {
        logId: existingLike.logId,
      },
    });

    // 데이터 출력
    res.status(200).json({
      status: 200,
      message: "댓글좋아요를 삭제했습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
