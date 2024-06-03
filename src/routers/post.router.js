import express from 'express';
import Joi from 'joi';
import { createPost, updatePost, deletePost } from '../controllers/post.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Joi 스키마를 사용하여 유효성 검사 규칙 정의
const postSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  visibility: Joi.string().valid('PUBLIC', 'PRIVATE', 'FRIENDS').required()
});

// 게시물 생성 요청의 유효성 검사 미들웨어
const validateCreatePost = (req, res, next) => {
  const { error, value } = postSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

// 게시물 수정 요청의 유효성 검사 미들웨어
const validateUpdatePost = (req, res, next) => {
  // 여기서도 유효성 검사를 추가할 수 있습니다.
  next();
};

// 게시물 삭제 요청의 유효성 검사 미들웨어
const validateDeletePost = (req, res, next) => {
  // 여기서도 유효성 검사를 추가할 수 있습니다.
  next();
};

// 게시물 생성 라우트에 유효성 검사 미들웨어 적용
router.post('/', authenticateJWT, validateCreatePost, createPost);

// 게시물 수정 라우트에 유효성 검사 미들웨어 적용
router.put('/:id', authenticateJWT, validateUpdatePost, updatePost);

// 게시물 삭제 라우트에 유효성 검사 미들웨어 적용
router.delete('/:id', authenticateJWT, validateDeletePost, deletePost);

export default router;
