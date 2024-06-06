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
  // .messages({
  //   "string.base": "이름은 한글만 사용 가능합니다.",
  //   "string.empty": "이름을 입력해주세요.",
  //   "string.pattern.base": "이름은 한글만 사용 가능합니다.",
  // }),
  phoneNumber: Joi.string().pattern(/^(010-\d{3,4}-\d{4})$/),
  // .messages({
  //   "string.base": "전화번호 형식이 올바르지 않습니다.",
  //   "string.empty": "전화번호를 입력해주세요.",
  //   "string.pattern.base": "전화번호 형식이 올바르지 않습니다.",
  // }),
  description: Joi.string().max(500),
  // .messages({
  //   "string.base": "자기소개는 최대 500자까지 입력할 수 있습니다.",
  //   "string.empty": "자기소개를 입력해주세요.",
  //   "string.max": "자기소개는 500자까지 입력할 수 있습니다.",
  // }),
  profileImage: Joi.string().max(500),
  // .messages({
  //   "string.base": "프로필 이미지 URL은 최대 500자까지 입력할 수 있습니다.",
  //   "string.empty": "프로필 이미지 URL을 입력해주세요.",
  //   "string.max": "프로필 이미지 URL은 최대 500자까지 입력할 수 있습니다.",
  // }),
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
  // .messages({
  //   "any.only": "정렬 방식은 'asc' 또는 'desc'여야 합니다.",
  // }),
});

// // 좋아요 관련 유효성 검사
// export const likeSchema = Joi.object({
//   til_id: Joi.string().required(),
// });
