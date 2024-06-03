import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
//import { createUser, loginUser } from './joi.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/sign-up', async (req, res, next) => {
    try {
      const { name, email, password, passwordConfirm, phoneNumber, role} = req.body;
  
      await createUser.validateAsync(req.body);
  
      const isExistUser = await prisma.user.findFirst({
        where: {
          email,
        },
      });
  
      if (isExistUser) {
        return res.status(400).json({
          status: 400,
          message: '이미 가입된 사용자입니다.',
        });
      }
  
      if (password != passwordConfirm) {
        return res.status(400).json({
          status: 400,
          message: '입력 한 두 비밀번호가 일치하지 않습니다.',
        });
      }
  
      const hashPassword = await bcrypt.hash(password, 10);
  
      const [User, UserInfo] = await prisma.$transaction(
        async (tx) => {
            const user = await tx.User.create({
                date: {
                    name,
                    email,
                    password: hashPassword,
                    phoneNumber,
                    role,
                },
            });

            const userInfo = await tx.UserInfo.create({
                data: {

                }
            })
        });
  
      const responseUser = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
  
      return res.status(201).json({
        status: 201,
        message: '회원가입에 성공했습니다.',
        data: responseUser,
      });
    } catch (error) {
      next(error);
    }
  });
  
  export default router;