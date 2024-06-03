import Joi from "joi";

export const listResumesValidator = async (req, res, next) => {
  try {
    const joiSchema = Joi.object({
      sort: Joi.string().optional().valid("asc", "desc").messages({
        "any.only": "정렬 방식은 'asc' 또는 'desc'여야 합니다.",
      }),
    });

    await joiSchema.validateAsync(req.query);
    next();
  } catch (error) {
    next(error);
  }
};
