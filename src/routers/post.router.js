import express from "express";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { postTIL } from "../middlewares/joi.js";
import {
  requireListRoles,
  requireDetailRoles,
} from "../middlewares/require-roles.middleware.js";
import { VISIBILITY } from "../constants/til.constant.js";

const router = express.Router();

// 게시물 생성 API /til
router.post("/", requireAccessToken, async (req, res, next) => {
  try {
    const { title, content, category, visibility } = req.body;
    const { userId } = req.user;

    if (!title || !content || !category || !visibility) {
      return res
        .status(400)
        .json({ status: 400, errorMessage: "모든 필드를 입력해 주세요." });
    }
    await postTIL.validateAsync(req.body);

    const post = await prisma.TIL.create({
      data: {
        title,
        UserId: +userId,
        content,
        category,
        visibility,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "게시글 등록에 성공했습니다.",
      data: post,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: 500, errorMessage: "게시글 등록에 실패했습니다." });
  }
});

// 게시글 목록 조회 API /til
router.get("/", requireListRoles, async (req, res, next) => {
  try {
    // 기본적으로 visibility가 PUBLIC인건 포함.
    let whereCondition = {
      OR: [{ visibility: VISIBILITY.PUBLIC }],
    };

    // 유저 정보가 있다면 MEMBER인지 MANAGER인지에 따라
    //어떤 TIL visibility까지 접근가능한지
    if (req.user) {
      const { role } = req.user;
      const userId = req.user.userId;

      if (role === "MEMBER") {
        whereCondition.OR.push({ UserId: +userId });
      } else if (role === "MANAGER") {
        whereCondition.OR.push(
          { visibility: VISIBILITY.MANAGER },
          { UserId: +userId }
        );
      }
    }

    const sort = req.query.sort || "desc";

    const posts = await prisma.TIL.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: sort,
      },
      include: {
        LikeLog: true,
        User: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });

    const response = posts.map((post) => ({
      tilId: post.tilId,
      userId: post.userId,
      userName: post.User.name,
      title: post.title,
      content: post.content,
      category: post.category,
      visibility: post.visibility,
      likeNumber: post.LikeLog.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: "게시글 목록 조회에 성공했습니다.",
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

// Follower 게시글 목록 조회 API /til/follower
router.get("/follower", requireAccessToken, async (req, res, next) => {
  try {
    const { userId } = req.user;

    //내가 팔로우 중인 사람 리스트 불러오기
    const followees = await prisma.Follow.findMany({
      where: { FollowerId: +userId },
      select: { FolloweeId: true },
    });

    const followeeIds = followees.map((f) => f.FolloweeId);

    let tils = [];
    // followeeIds를 돌면서 TIL테이블을 돌아서 TILs를 가져온다.
    for (const followeeId of followeeIds) {
      const til = await prisma.TIL.findMany({
        where: { visibility: "FOLLOWER", UserId: +followeeId },
        include: {
          User: {
            select: {
              userId: true,
              name: true,
            },
          },
          LikeLog: true,
          Comment: true,
        },
      });
      tils = tils.concat(til);
    }

    if (!tils) {
      return res.status(400).json({
        status: 400,
        message: "게시글이 존재하지 않습니다.",
      });
    }

    const response = tils.map((til) => ({
      tilId: til.tilId,
      userId: til.userId,
      userName: til.User.name,
      title: til.title,
      content: til.content,
      category: til.category,
      visibility: til.visibility,
      likeNumber: til.LikeLog.length,
      comments: til.Comment,
      createdAt: til.createdAt,
      updatedAt: til.updatedAt,
    }));

    res.status(200).json({
      status: 200,
      message: "Follower의 게시글 목록 조회에 성공했습니다.",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
});

// 게시물 수정 API /til/:id
router.put("/:til_id", requireAccessToken, async (req, res, next) => {
  try {
    const tilId = req.params.til_id;
    const { userId } = req.user;
    const { title, content, category, visibility } = req.body;

    if (!title || !content || !category || !visibility) {
      return res
        .status(400)
        .json({ status: 400, errorMessage: "모든 필드를 입력해 주세요." });
    }

    // 접근가능한 userId, 입력받은 tilId랑 일치하는 TIL이 있는지 체크
    const isExistTIL = await prisma.TIL.findFirst({
      where: { tilId: +tilId, UserId: +userId },
    });

    if (!isExistTIL) {
      return res.status(404).json({
        errorMessage: "게시글이 존재하지 않거나 접근 권한이 없습니다.",
      });
    }

    const post = await prisma.TIL.update({
      where: { tilId: +tilId, UserId: +userId },
      data: {
        title,
        content,
        category,
        visibility,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "게시글 수정에 성공했습니다.",
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

// 게시물 삭제 API /til/:id
router.delete("/:til_id", requireAccessToken, async (req, res, next) => {
  try {
    const tilId = req.params.til_id;
    const { userId } = req.user;

    // 접근가능한 userId, 입력받은 tilId랑 일치하는 TIL이 있는지 체크
    const isExistTIL = await prisma.TIL.findFirst({
      where: { tilId: parseInt(tilId), UserId: +userId },
    });

    if (!isExistTIL) {
      return res.status(404).json({
        errorMessage: "게시글이 존재하지 않거나 접근 권한이 없습니다.",
      });
    }

    await prisma.TIL.delete({
      where: { tilId: parseInt(tilId), UserId: +userId },
    });
    return res
      .status(200)
      .json({ status: 200, message: "게시글 삭제에 성공했습니다." });
  } catch (error) {
    next(error);
  }
});

// 게시글 상세조회 API /til/:id
router.get(
  "/:til_id",
  requireAccessToken,
  requireDetailRoles,
  async (req, res, next) => {
    const params = req.params;
    const tilId = parseInt(params.til_id);
    console.log(tilId);
    try {
      const post = await prisma.TIL.findUnique({
        where: { tilId: +tilId },
        include: {
          User: {
            select: {
              userId: true,
              name: true,
            },
          },
          LikeLog: true,
          Comment: true,
        },
      });

      if (!post) {
        return res.status(400).json({
          status: 400,
          message: "게시글이 존재하지 않습니다.",
        });
      }

      res.status(200).json({
        status: 200,
        message: "게시글 상세 조회에 성공했습니다.",
        data: {
          id: post.id,
          userId: post.User.id,
          userName: post.User.name,
          title: post.title,
          content: post.content,
          category: post.category,
          visibility: post.visibility,
          likeNumber: post.LikeLog.length,
          comments: post.Comment,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  }
);

export default router;
