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
router.patch("/", requireAccessToken, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, phoneNumber, description, profileImage, trackNumber } =
      req.body;
    const dataToUpdate = {};

    await updateUser.validateAsync(req.body);

    if (name) dataToUpdate.name = name;
    if (phoneNumber) dataToUpdate.phoneNumber = phoneNumber;

    if (description || profileImage || trackNumber) {
      dataToUpdate.UserInfo = {};
      dataToUpdate.UserInfo.update = {};
      if (trackNumber) dataToUpdate.UserInfo.update.trackNumber = trackNumber;
      if (description) dataToUpdate.UserInfo.update.description = description;
      if (profileImage)
        dataToUpdate.UserInfo.update.profileImage = profileImage;
    }

    console.log("\n\n\n", dataToUpdate, "\n\n\n");
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({
        status: 400,
        message: "수정할 내용이 없습니다.",
      });
    }

    console.log("수정할 데이터:", dataToUpdate); // 수정된 부분

    const updatedUser = await prisma.User.update({
      where: { userId: +userId },
      data: dataToUpdate,
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
        description: updatedUser.UserInfo?.description,
        profileImage: updatedUser.UserInfo?.profileImage,
        trackNumber: updatedUser.UserInfo?.trackNumber,
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
