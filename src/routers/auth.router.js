import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createUser, loginUser } from './joi.js';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET_KEY } from '../constants/env.constant.js';
import { REFRESH_TOKEN_SECRET_KEY } from '../constants/env.constant.js';

const router = express.Router();

//회원가입 /auth/sign-up
router.post('/sign-up', async (req, res, next) => {
    try {
      const { name, email, password, passwordConfirm, phoneNumber} = req.body;
  
      //joi 유효성 검사
      await createUser.validateAsync(req.body);
  
      const isExistUser = await prisma.User.findFirst({
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
  
      //비밀번호 해싱
      const hashPassword = await bcrypt.hash(password, 10);
  
      //트랙잭션
      const [createdUser, createdUserInfo] = await prisma.$transaction(
        async (tx) => {
            const user = await tx.User.create({
                data: {
                    name,
                    email,
                    password: hashPassword,
                    phoneNumber
                },
            });

            const userInfo = await tx.UserInfo.create({
                data: {
                    userId : user.userId,
                },
            });

            return [user, userInfo];
        }
        ,
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        });
  
      const responseUser = {
        userId: createdUser.userId,
        name: createdUser.name,
        email: createdUser.email,
        phoneNumber: createdUser.phoneNumber,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
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