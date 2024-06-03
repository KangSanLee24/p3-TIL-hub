import Joi from 'joi';

export const createUser = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
  passwordConfirm: Joi.string().required().min(6),
  phoneNumber: Joi.string().required().pattern(/^(010-\d{3,4}-\d{4})$/)
});

export const loginUser = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
  });