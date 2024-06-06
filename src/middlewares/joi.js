import Joi from "joi";
import { VISIBILITY } from "../constants/til.constant.js";

// 사용자 생성 유효성 검사
export const createUser = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
  passwordConfirm: Joi.string().required().min(6),
  phoneNumber: Joi.string()
    .required()
    .pattern(/^(010-\d{3,4}-\d{4})$/),
});

// 사용자 로그인 유효성 검사
export const loginUser = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
});

// 사용자 업데이트 유효성 검사
export const updateUser = Joi.object({
  name: Joi.string().regex(/^[가-힣]+$/),
  phoneNumber: Joi.string().pattern(/^(010-\d{3,4}-\d{4})$/),
  description: Joi.string().max(500),
  profileImage: Joi.string().max(500),
  trackNumber: Joi.string(),
});

// 게시물 생성 및 수정 유효성 검사
export const postTIL = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  visibility: Joi.string()
    .valid(...Object.values(VISIBILITY))
    .required(),
});

// 댓글 작성 및 수정 유효성 검사
export const postComment = Joi.object({
  content: Joi.string().required(),
});

// 댓글 정렬 유효성 검사
export const listComment = Joi.object({
  sort: Joi.string().optional().valid("asc", "desc", "likes"),
});
