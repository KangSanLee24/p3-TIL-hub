import express from "express";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { updateUser } from "../middlewares/joi.js";

const router = express.Router();

// 내 정보 조회/user
router.get("/", requireAccessToken, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        UserInfo: {
          select: {
            description: true,
            profileImage: true,
            level: true,
            trackNumber: true,
          },
        },
      },
    });
    const { name, email, phoneNumber, role, createdAt, updatedAt } = user;
    const { description, profileImage, level, trackNumber } = user.UserInfo;
    return res.status(200).json({
      status: 200,
      message: "내 정보 조회에 성공했습니다.",
      data: {
        userId,
        name,
        email,
        phoneNumber,
        role,
        createdAt,
        updatedAt,
        description,
        profileImage,
        level,
        trackNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 내 정보 수정/user
router.put("/", requireAccessToken, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, phoneNumber, description, profileImage } = req.body;
    await updateUser.validateAsync(req.body);
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        name,
        phoneNumber,
        UserInfo: {
          update: {
            description,
            profileImage,
          },
        },
      },
      include: {
        UserInfo: true,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "내 정보 수정에 성공했습니다.",
      data: {
        userId,
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        description: updatedUser.UserInfo.description,
        profileImage: updatedUser.UserInfo.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 다른 유저 조회/user/:id
router.get("/:id", requireAccessToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        UserInfo: {
          select: {
            description: true,
            profileImage: true,
            level: true,
            trackNumber: true,
          },
        },
      },
    });
    const { name, email, phoneNumber, role, createdAt, updatedAt } = user;
    const { description, profileImage, level, trackNumber } = user.UserInfo;

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "사용자 정보 조회에 성공했습니다.",
      data: {
        userId,
        name,
        email,
        phoneNumber,
        role,
        createdAt,
        updatedAt,
        description,
        profileImage,
        level,
        trackNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
