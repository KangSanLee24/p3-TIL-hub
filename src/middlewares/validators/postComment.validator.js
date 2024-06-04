import Joi from "joi";

export const postCommentValidator = async (req, res, next) => {
  try {
    const joiSchema = Joi.object({
      content: Joi.string().required().messages({
        "string.base": "댓글은 문자열이여야 합니다.",
        "string.empty": "댓글을 입력해 주세요.",
      }),
    });

    await joiSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
