import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createUser, loginUser } from './joi.js';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET_KEY } from '../constants/env.constant.js';
import { REFRESH_TOKEN_SECRET_KEY } from '../constants/env.constant.js';
import refreshMiddleware from '../middlewares/require-refresh-token.middleware.js';

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

  //로그인 /auth/sign-in
  router.post('/sign-in', async (req, res, next) => {
    try {
      const { email, password } = req.body;
  
      //joi 유효성 검사
      await loginUser.validateAsync(req.body);
  
      const user = await prisma.User.findFirst({
        where: { email },
      });
  
      if (!user) {
        return res.status(401).json({
          status: 401,
          message: '존재하지 않는 사용자 입니다.',
        });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          status: 401,
          message: '비밀번호가 일치하지 않습니다.',
        });
      }
  
      //토큰 생성
      const accesstoken = jwt.sign(
        { userId: user.userId },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: '12h' }
      );
  
      const refreshtoken = jwt.sign(
        { userId: user.userId },
        REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: '7d' }
      );
  
      res.setHeader('accesstoken', `Bearer ${accesstoken}`);
      res.setHeader('refreshtoken', `Bearer ${refreshtoken}`);
  
      const hashRefreshToken = await bcrypt.hash(refreshtoken, 10);
  
      const existingToken = await prisma.RefreshToken.findFirst({
        where: {
          UserId: user.userId,
        },
      });
  
      if (existingToken) {
        await prisma.RefreshToken.update({
          where: {
            UserId: user.userId,
          },
          data: {
            refreshToken: hashRefreshToken,
          },
        });
  
        return res.status(200).json({
          status: 200,
          message: '로그인에 성공했습니다.',
          accesstoken,
          refreshtoken,
        });
      }
  
      await prisma.RefreshToken.create({
        data: {
          UserId: user.userId,
          refreshToken: hashRefreshToken,
        },
      });
  
      return res.status(200).json({
        status: 200,
        message: '로그인에 성공했습니다.',
        accesstoken,
        refreshtoken,
      });
    } catch (error) {
      next(error);
    }
  });

  //로그아웃 /auth/sign-out
  router.post('/sign-out', refreshMiddleware, async (req, res, next) => {
    const { userId } = req.user;
  
    await prisma.RefreshToken.delete({
      where: { UserId: +userId },
    });
  
    return res.status(200).json({
      status: 200,
      message: '로그아웃에 성공했습니다.',
      data: {
        id: userId,
      },
    });
  });

  //token 재발급 /auth/token
  router.post('/token', refreshMiddleware, async (req, res, next) => {
    const { userId } = req.user;
  
    const accesstoken = jwt.sign(
      { userId: userId },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
  
    const refreshtoken = jwt.sign(
      { userId: userId },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );
  
    res.setHeader('accesstoken', `Bearer ${accesstoken}`);
    res.setHeader('refreshtoken', `Bearer ${refreshtoken}`);
  
    const hashRefreshToken = await bcrypt.hash(refreshtoken, 10);
  
    await prisma.RefreshToken.update({
      where: {
        UserId: +userId,
      },
      data: {
        refreshToken: hashRefreshToken,
      },
    });
  
    return res.status(200).json({
      status: 200,
      message: '토큰 재발급에 성공했습니다.',
      accesstoken,
      refreshtoken,
    });
  });
  
  export default router;