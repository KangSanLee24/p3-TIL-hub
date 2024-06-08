import express from "express";
import { prisma } from "../utils/prisma/index.js";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { postComment, listComment } from "../middlewares/joi.js";
import { requireDetailRoles } from "../middlewares/require-roles.middleware.js";

const router = express.Router();

/** 댓글 작성 API  **/
router.post(
  "/:til_id/comment",
  requireAccessToken, // accesstoken이 있는 지 확인
  requireDetailRoles, // 특정 TIL에 접근 권한이 있는 지 확인
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const tilId = req.params.til_id;
      const { content } = req.body;

      //joi 유효성 검사
      await postComment.validateAsync(req.body);

      // til이 존재하는지.
      const til = await prisma.TIL.findFirst({
        where: {
          tilId: +tilId,
        },
      });
      if (!til)
        return res
          .status(404)
          .json({ status: 404, errorMessage: "게시글이 존재하지 않습니다." });

      // Comment테이블에 댓글 생성.
      const comment = await prisma.Comment.create({
        data: {
          TilId: +tilId,
          UserId: +userId,
          content: content,
        },
        include: {
          User: {
            select: {
              name: true,
            },
          },
        },
      });

      return res.status(201).json({
        status: 201,
        message: "댓글 등록에 성공했습니다.",
        data: {
          id: comment.id,
          tilId: comment.tilId,
          userName: comment.User.name,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 댓글 조회 API **/
router.get(
  "/:til_id/comment",
  requireAccessToken,
  requireDetailRoles,
  async (req, res, next) => {
    try {
      const tilId = req.params.til_id;

      await listComment.validateAsync(req.query);

      const sort = req.query.sort || "desc";
      let orderBy;

      if (sort === "asc" || sort === "desc") {
        // asc나 desc로 입력했을때,
        orderBy = { createdAt: sort };
      } else if (sort === "likes") {
        // sort:likes로 입력했을때는 좋아요 많은 순서
        orderBy = { LikeLog: { _count: "desc" } };
      } else {
        // 기본적으로(입력안하면) 내림차순(최신순)
        orderBy = { createdAt: "desc" };
      }

      const til = await prisma.TIL.findFirst({
        where: {
          tilId: +tilId,
        },
      });
      if (!til)
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });

      const comments = await prisma.Comment.findMany({
        where: {
          TilId: +tilId,
        },
        orderBy: orderBy,
        include: {
          User: {
            select: {
              name: true,
            },
          },
        },
      });
      // 이쁘게 가공
      const response = comments.map((comment) => ({
        id: comment.id,
        tilId: comment.TilId,
        userName: comment.User.name,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }));
      return res.status(200).json({
        status: 200,
        message: "댓글 목록 조회에 성공했습니다.",
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 댓글 수정 API **/
router.patch(
  "/:til_id/comment/:comment_id",
  requireAccessToken,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const tilId = req.params.til_id;
      const commentId = req.params.comment_id;
      const { content } = req.body;

      //joi 유효성 검사
      await postComment.validateAsync(req.body);

      const isExistPost = await prisma.TIL.findFirst({
        where: { tilId: +tilId },
      });
      const isExistComment = await prisma.Comment.findFirst({
        where: { id: +commentId, TilId: +tilId },
      });
      if (!isExistPost || !isExistComment)
        return res
          .status(404)
          .json({ errorMessage: "존재하지 않는 정보입니다." });

      let comment = await prisma.comment.update({
        where: { id: +commentId, TilId: +tilId, UserId: +userId },
        data: { content: content },
        include: {
          User: {
            select: {
              name: true,
            },
          },
        },
      });

      return res.status(200).json({
        status: 201,
        message: "댓글 수정에 성공했습니다.",
        data: {
          id: comment.id,
          tilId: comment.TilId,
          userName: comment.User.name,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 댓글 삭제 API **/
router.delete(
  "/:til_id/comment/:comment_id",
  requireAccessToken,
  requireDetailRoles,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const tilId = req.params.til_id;
      const commentId = req.params.comment_id;

      const isExistTIL = await prisma.TIL.findFirst({
        where: { tilId: +tilId },
      });
      const isExistComment = await prisma.Comment.findFirst({
        where: { id: +commentId, TilId: +tilId },
        include: {
          User: {
            select: {
              name: true,
            },
          },
        },
      });
      if (!isExistTIL || !isExistComment)
        return res
          .status(404)
          .json({ status: 404, errorMessage: "존재하지 않는 정보입니다." });

      await prisma.comment.delete({
        where: { id: +commentId, TilId: +tilId, UserId: +userId },
      });
      return res.status(201).json({
        status: 201,
        message: "댓글 삭제에 성공했습니다.",
        data: {
          id: isExistComment.id,
          tilId: isExistComment.TilId,
          userName: isExistComment.User.name,
          content: isExistComment.content,
          createdAt: isExistComment.createdAt,
          updatedAt: isExistComment.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
