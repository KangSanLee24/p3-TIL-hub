import Joi from 'joi';

// Joi 스키마 정의
const postSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  visibility: Joi.string().valid('public', 'private').required(),
});

// validatePost 함수 정의
export const validatePost = (req, res, next) => {
  const { error } = postSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};
