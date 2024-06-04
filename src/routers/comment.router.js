import express from "express";
import { prisma } from "../utils/prisma/index.js";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { postCommentValidator } from "../middlewares/validators/postComment.validator.js";
import { listResumesValidator } from "../middlewares/validators/listComment.validator.js";

const router = express.Router();

/** 댓글 작성 API  **/
router.post(
  "/:til_id/comment",
  requireAccessToken,
  postCommentValidator,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const tilId = req.params.til_id;
      const { content } = req.body;

      // til이 존재하는지.
      const til = await prisma.TIL.findFirst({
        where: {
          tilId: +tilId,
        },
      });
      if (!til)
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });

      // Comment테이블에 댓글 생성.
      const comment = await prisma.Comment.create({
        data: {
          TilId: +tilId,
          UserId: +userId,
          content: content,
        },
      });

      return res.status(201).json({ data: comment });
    } catch (error) {
      next(error);
    }
  }
);

/** 댓글 조회 API **/
router.get(
  "/:til_id/comment",
  requireAccessToken,
  listResumesValidator,
  async (req, res, next) => {
    try {
      const tilId = req.params.til_id;
      const sortOrder =
        req.query.sort?.toLowerCase() === "asc" ? "asc" : "desc";

      const til = await prisma.TIL.findFirst({
        where: {
          tilId: +tilId,
        },
      });
      if (!til)
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });

      const comments = await prisma.comment.findMany({
        where: {
          TilId: +tilId,
        },
        orderBy: {
          createdAt: sortOrder,
        },
      });

      return res.status(200).json({ data: comments });
    } catch (error) {
      next(error);
    }
  }
);

/** 댓글 수정 API **/
router.patch(
  "/:til_id/comment/:comment_id",
  requireAccessToken,
  postCommentValidator,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const tilId = req.params.til_id;
      const commentId = req.params.comment_id;
      const { content } = req.body;

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

      let til = await prisma.comment.update({
        where: { id: +commentId, TilId: +tilId, User: +userId },
        data: { content: content },
      });

      return res.status(200).json({
        status: 201,
        message: "댓글 수정에 성공했습니다.",
        data: til,
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
      });
      if (!isExistTIL || !isExistComment)
        return res
          .status(404)
          .json({ errorMessage: "존재하지 않는 정보입니다." });

      await prisma.comment.delete({
        where: { id: +commentId, TilId: +tilId, UserId: +userId },
      });
      return res.status(201).json({
        status: 201,
        message: "댓글 삭제에 성공했습니다.",
        data: isExistComment.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
