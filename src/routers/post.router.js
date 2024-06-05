import express from "express";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { postTIL } from "../middlewares/joi.js";

const router = express.Router();

// 게시물 생성 API /til
router.post("/", requireAccessToken, async (req, res, next) => {
  try {
    const { title, content, category, visibility } = req.body;
    const { userId } = req.user;

    // 필수 정보가 입력되었는지 확인
    if (!title || !content || !category || !visibility) {
      return res.status(400).json({ status: 400, message: "제목, 내용, 카테고리, 공개 범위를 모두 입력해 주세요." });
    }

    // Joi 검증
    const { error } = postTIL.validate(req.body);
    if (error) {
      return res.status(400).json({ status: 400, message: error.details[0].message });
    }

    const post = await prisma.TIL.create({
      data: {
        title,
        UserId: +userId,
        content,
        category,
        visibility,
      },
    });

    return res.status(201).json({ status: 201, message: "게시글 등록에 성공했습니다.", data: post });
  } catch (error) {
    res.status(500).json({ status: 500, message: "게시글 등록에 실패했습니다." });
  }
});

// 게시글 목록 조회 API /til
router.get("/", requireAccessToken, async (req, res, next) => {
  try {
    const sort = req.query.sort || "desc";
    const sortBy = req.query.sortBy || "createdAt"; 

    const orderBy = sortBy === "likes" ? { LikeLog: { _count: sort } } : { createdAt: sort };

    const posts = await prisma.TIL.findMany({
      orderBy: orderBy,
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
      id: post.id,
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

// 게시물 수정 API /til/:id
router.put("/:til_id", requireAccessToken, async (req, res, next) => {
  try {
    const tilId = req.params.til_id;
    const { userId } = req.user;
    const { title, content, category, visibility } = req.body;

    // 필수 정보가 입력되었는지 확인
    if (!title || !content || !category || !visibility) {
      return res.status(400).json({ status: 400, message: "수정할 정보를 입력해 주세요." });
    }

    // Joi 검증
    const { error } = postTIL.validate(req.body);
    if (error) {
      return res.status(400).json({ status: 400, message: error.details[0].message });
    }

    const post = await prisma.TIL.update({
      where: { tilId: +tilId, UserId: +userId },
      data: { title, content, category, visibility },
    });

    return res.status(200).json({ status: 200, message: "게시글 수정에 성공했습니다.", data: post });
  } catch (error) {
    if (error.message === "인증 정보가 없습니다." || error.message === "인증 정보가 유효하지 않습니다." || error.message === "인증 정보가 만료되었습니다.") {
      return res.status(401).json({ status: 401, message: error.message });
    }
    next(error);
  }
});

// 게시물 삭제 API /til/:id
router.delete("/:til_id", requireAccessToken, async (req, res, next) => {
  const tilId = req.params.til_id;

  try {
    const post = await prisma.TIL.findUnique({ where: { tilId: parseInt(tilId) } });
    
    if (!post) {
      return res.status(400).json({ status: 400, message: "게시글이 존재하지 않습니다." });
    }

    await prisma.TIL.delete({ where: { tilId: parseInt(tilId) } });
    return res.status(200).json({ status: 200, message: "게시글 삭제에 성공했습니다." });
  } catch (error) {
    next(error);
  }
});

// 게시글 상세조회 API /til/:id
router.get("/:id", requireAccessToken, async (req, res, next) => {
  const tilId = parseInt(req.params.id);
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
});

export default router;
