import express from "express";
import { prisma } from "../utils/prisma/index.js";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
// import { likeSchema } from "../middlewares/joi.js";

const router = express.Router();

// 좋아요 생성
router.post("/:til_id/like", requireAccessToken, async (req, res, next) => {
  const { userId } = req.user;
  const tilId = parseInt(req.params.til_id, 10);

  // Joi 검증
  // const { error } = likeSchema.validate({ til_id: req.params.til_id });
  // if (error) {
  //   return res.status(400).json({ errorMessage: error.details[0].message });
  // }

  try {
    const til = await prisma.TIL.findUnique({
      where: { tilId: tilId },
      include: { user: true },
    });

    if (!til) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    if (til.UserId === userId) {
      return res
        .status(400)
        .json({ error: "자신의 게시글에는 좋아요를 누를 수 없습니다." });
    }

    const existingLike = await prisma.likeLog.findFirst({
      where: { TilId: tilId, UserId: userId },
    });

    if (existingLike) {
      return res.status(400).json({ error: "이미 좋아요한 게시물입니다." });
    }

    const newLike = await prisma.likeLog.create({
      data: { TilId: tilId, UserId: userId },
    });

    res
      .status(201)
      .json({ message: "좋아요 생성에 성공했습니다.", like: newLike });
  } catch (error) {
    next(error);
  }
});

// 좋아요 삭제
router.delete("/:til_id/like", requireAccessToken, async (req, res, next) => {
  const { userId } = req.user;
  const tilId = parseInt(req.params.til_id, 10);

  // Joi 검증
  // const { error } = likeSchema.validate({ til_id: req.params.til_id });
  // if (error) {
  //   return res.status(400).json({ errorMessage: error.details[0].message });
  // }

  try {
    const like = await prisma.likeLog.findFirst({
      where: { TilId: tilId, UserId: userId },
    });

    if (!like) {
      return res.status(404).json({ error: "좋아요를 찾을 수 없습니다." });
    }

    await prisma.likeLog.delete({
      where: { logId: like.logId },
    });

    res.status(200).json({ message: "좋아요 삭제에 성공했습니다." });
  } catch (error) {
    next(error);
  }
});

// 좋아요 집계
router.get("/:til_id/aggregate", requireAccessToken, async (req, res, next) => {
  const tilId = parseInt(req.params.til_id, 10);

  // // Joi 검증
  // const { error } = likeSchema.validate({ til_id: req.params.til_id });
  // if (error) {
  //   return res.status(400).json({ errorMessage: error.details[0].message });
  // }

  try {
    const til = await prisma.tIL.findUnique({
      where: { tilId: tilId },
      select: {
        tilId: true,
        title: true,
        _count: {
          select: { LikeLog: true },
        },
      },
    });

    if (!til) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    res.status(200).json({
      tilId: til.tilId,
      title: til.title,
      likeCount: til._count.LikeLog,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
