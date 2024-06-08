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
    const { userId } = req.user; // 사용자의 ID를 가져옴
    const tilId = parseInt(req.params.til_id, 10); // 요청된 til_id를 정수로 변환

    try {
      const til = await prisma.TIL.findUnique({
        where: { tilId: tilId },
        include: { User: true }, // 게시글 작성자 정보를 포함하여 조회
      });

      if (!til) {
        // 게시글이 존재하지 않는 경우
        return res
          .status(404)
          .json({ status: 404, errorMessage: "게시글이 존재하지 않습니다." });
      }

      if (til.UserId === userId) {
        // 사용자가 자신의 게시글에 좋아요를 하려고 하는 경우
        return res
          .status(400)
          .json({ status: 400, errorMessage: "본인 게시글에는 좋아요 할 수 없습니다." });
      }

      const existingLike = await prisma.likeLog.findFirst({
        where: { TilId: tilId, UserId: userId }, // 이미 좋아요한 기록이 있는지 확인
      });

      if (existingLike) {
        // 이미 좋아요한 게시물인 경우
        return res.status(400).json({ status: 400, errorMessage: "이미 좋아요한 게시물입니다." });
      }

      const newLike = await prisma.likeLog.create({
        data: { TilId: tilId, UserId: userId }, // 좋아요 생성
      });

      const likeCount = await prisma.likeLog.count({
        where: { TilId: tilId }, // 현재 게시물의 좋아요 수를 조회
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
  const { userId } = req.user; // 사용자의 ID를 가져옴
  const tilId = parseInt(req.params.til_id, 10); // 요청된 til_id를 정수로 변환

  try {
    const like = await prisma.likeLog.findFirst({
      where: { TilId: tilId, UserId: userId }, // 좋아요 기록을 조회
    });

    if (!like) {
      // 좋아요 기록이 없는 경우
      return res.status(404).json({ status: 404, errorMessage: "좋아요를 찾을 수 없습니다." });
    }

    await prisma.likeLog.delete({
      where: { logId: like.logId }, // 좋아요 기록 삭제
    });

    const likeCount = await prisma.likeLog.count({
      where: { TilId: tilId }, // 현재 게시물의 좋아요 수를 조회
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
  const tilId = parseInt(req.params.til_id, 10); // 요청된 til_id를 정수로 변환

  try {
    const til = await prisma.TIL.findUnique({
      where: { tilId: tilId },
      select: {
        tilId: true,
        UserId: true,
        _count: {
          select: { LikeLog: true }, // 좋아요 수를 포함하여 조회
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!til) {
      // 게시글이 존재하지 않는 경우
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
  const { userId } = req.user; // 사용자의 ID를 가져옴
  const startOfWeekDate = startOfWeek(new Date()); // 이번 주 시작 날짜를 계산
  const endOfWeekDate = endOfWeek(new Date()); // 이번 주 종료 날짜를 계산

  try {
    const topLikedPost = await prisma.TIL.findFirst({
      where: {
        createdAt: {
          gte: startOfWeekDate,
          lte: endOfWeekDate, // 이번 주에 작성된 게시물만 조회
        },
      },
      orderBy: {
        LikeLog: {
          _count: 'desc', // 좋아요 수 기준으로 내림차순 정렬
        },
      },
      include: {
        User: true, // 작성자 정보를 포함하여 조회
        _count: {
          select: { LikeLog: true }, // 좋아요 수를 포함하여 조회
        },
      },
    });

    if (!topLikedPost) {
      // 이번 주 좋아요가 가장 많은 게시물이 없는 경우
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
