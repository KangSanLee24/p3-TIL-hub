import Joi from "joi";

export const createUser = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
  passwordConfirm: Joi.string().required().min(6),
  phoneNumber: Joi.string().pattern(/^(010-\d{3,4}-\d{4})$/),
});

export const loginUser = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
});

export const updateUser = Joi.object({
  name: Joi.string()
    .required()
    .regex(/^[가-힣]+$/)
    .messages({
      "string.base": "이름은 한글만 사용 가능합니다.",
      "string.empty": "이름을 입력해주세요.",
      "string.pattern.base": "이름은 한글만 사용 가능합니다.",
    }),
  phoneNumber: Joi.string()
    .required()
    .pattern(/^(010-\d{3,4}-\d{4})$/)
    .messages({
      "string.base": "전화번호 형식이 올바르지 않습니다.",
      "string.empty": "전화번호를 입력해주세요.",
      "string.pattern.base": "전화번호 형식이 올바르지 않습니다.",
    }),
  description: Joi.string().max(500).required().messages({
    "string.base": "자기소개는 최대 500자까지 입력할 수 있습니다.",
    "string.empty": "자기소개를 입력해주세요.",
    "string.max": "자기소개는 500자까지 입력할 수 있습니다.",
  }),
  profileImage: Joi.string().max(500).required().messages({
    "string.base": "프로필 이미지 URL은 최대 500자까지 입력할 수 있습니다.",
    "string.empty": "프로필 이미지 URL을 입력해주세요.",
    "string.max": "프로필 이미지 URL은 최대 500자까지 입력할 수 있습니다.",
  }),
});

export const postTIL = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  visibility: Joi.string()
    .valid("PUBLIC", "FOLLOWER", "MANAGER", "PRIVATE")
    .required(),
});
