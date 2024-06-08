import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { requireDetailRoles } from "../middlewares/require-roles.middleware.js";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { startOfWeek, endOfWeek } from "date-fns";

const router = express.Router();

// 좋아요 생성
router.post(
  "/:til_id/like",
  requireAccessToken,
  requireDetailRoles,
  async (req, res, next) => {
    const { userId } = req.user;
    const tilId = parseInt(req.params.til_id, 10);

    try {
      const til = await prisma.TIL.findUnique({
        where: { tilId: tilId },
        include: { User: true },
      });

      if (!til) {
        return res
          .status(404)
          .json({ status: 404, errorMessage: "게시글이 존재하지 않습니다." });
      }

      if (til.UserId === userId) {
        return res
          .status(400)
          .json({ status: 400, errorMessage: "본인 게시글에는 좋아요 할 수 없습니다." });
      }

      const existingLike = await prisma.likeLog.findFirst({
        where: { TilId: tilId, UserId: userId },
      });

      if (existingLike) {
        return res.status(400).json({ status: 400, errorMessage: "이미 좋아요한 게시물입니다." });
      }

      const newLike = await prisma.likeLog.create({
        data: { TilId: tilId, UserId: userId },
      });

      const likeCount = await prisma.likeLog.count({
        where: { TilId: tilId },
      });

      res.status(201).json({
        status: 201,
        message: "좋아요 등록에 성공했습니다.",
        data: {
          id: newLike.logId,
          userId: newLike.UserId,
          likeNumber: likeCount,
          createdAt: newLike.createdAt,
          updatedAt: newLike.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 좋아요 삭제
router.delete("/:til_id/like", requireAccessToken, async (req, res, next) => {
  const { userId } = req.user;
  const tilId = parseInt(req.params.til_id, 10);

  try {
    const like = await prisma.likeLog.findFirst({
      where: { TilId: tilId, UserId: userId },
    });

    if (!like) {
      return res.status(404).json({ status: 404, errorMessage: "좋아요를 찾을 수 없습니다." });
    }

    await prisma.likeLog.delete({
      where: { logId: like.logId },
    });

    const likeCount = await prisma.likeLog.count({
      where: { TilId: tilId },
    });

    res.status(200).json({
      status: 200,
      message: "좋아요 삭제에 성공했습니다.",
      data: {
        id: like.logId,
        userId: like.UserId,
        likeNumber: likeCount,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
});

// 좋아요 집계
router.get("/:til_id/aggregate", requireAccessToken, async (req, res, next) => {
  const tilId = parseInt(req.params.til_id, 10);

  try {
    const til = await prisma.TIL.findUnique({
      where: { tilId: tilId },
      select: {
        tilId: true,
        UserId: true,
        _count: {
          select: { LikeLog: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!til) {
      return res
        .status(404)
        .json({ status: 404, errorMessage: "게시글이 존재하지 않습니다." });
    }

    res.status(200).json({
      status: 200,
      message: "좋아요 집계에 성공했습니다.",
      data: {
        id: til.tilId,
        userId: til.UserId,
        likeNumber: til._count.LikeLog,
        createdAt: til.createdAt,
        updatedAt: til.updatedAt,
      }
    });
  } catch (error) {
    next(error);
  }
});

// 이번 주 좋아요가 가장 많은 게시글 조회
router.get("/top-like", requireAccessToken, async (req, res, next) => {
  const { userId } = req.user;
  const startOfWeekDate = startOfWeek(new Date());
  const endOfWeekDate = endOfWeek(new Date());

  try {
    const topLikedPost = await prisma.TIL.findFirst({
      where: {
        createdAt: {
          gte: startOfWeekDate,
          lte: endOfWeekDate,
        },
      },
      orderBy: {
        LikeLog: {
          _count: 'desc',
        },
      },
      include: {
        User: true,
        _count: {
          select: { LikeLog: true },
        },
      },
    });

    if (!topLikedPost) {
      return res.status(404).json({ status: 404, message: "이번 주 좋아요가 가장 많은 게시글이 없습니다." });
    }

    res.status(200).json({
      status: 200,
      message: "이번 주 좋아요가 가장 많은 TIL 입니다.",
      data: {
        작성자: topLikedPost.User.name,
        제목: topLikedPost.title,
        내용: topLikedPost.content,
        작성일자: topLikedPost.createdAt,
        좋아요: topLikedPost._count.LikeLog,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

