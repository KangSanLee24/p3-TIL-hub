import express from "express";
import { prisma } from "../utils/prisma/index.js";
import accessMiddleware from "../middlewares/require-access-token.middleware.js";

const router = express.Router();

//구독 생성 /follow/:user_id
router.post("/:user_id", accessMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const params = req.params;
    const followeeId = params.user_id;

    const isExistUser = await prisma.User.findFirst({
      where: { userId: +followeeId },
    });

    if (!isExistUser) {
      return res.status(400).json({
        status: 400,
        message: "해당 ID를 가진 사용자가 존재하지 않습니다.",
      });
    }

    const findFollower = await prisma.Follow.findFirst({
      where: { FollowerId: userId, FolloweeId: +followeeId },
    });

    if (findFollower) {
      return res.status(400).json({
        status: 400,
        message: "이미 구독한 사용자 입니다.",
      });
    }

    //구독 테이블 디비 생성
    const follower = await prisma.Follow.create({
      data: {
        FollowerId: userId,
        FolloweeId: +followeeId,
      },
      include: {
        Follower: {
          select: {
            name: true,
          },
        },
        Followee: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 201,
      message: "구독 신청에 성공했습니다.",
      data: {
        followerName: follower.Follower.name,
        followeeName: follower.Followee.name,
        createdAt: follower.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

//구독 삭제 /follow/:user_id
router.delete("/:user_id", accessMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const params = req.params;
    const followeeId = params.user_id;

    const isExistUser = await prisma.User.findFirst({
      where: { userId: +followeeId },
    });

    if (!isExistUser) {
      return res.status(400).json({
        status: 400,
        message: "해당 ID를 가진 사용자가 존재하지 않습니다.",
      });
    }

    const findFollower = await prisma.Follow.findFirst({
      where: {
        FollowerId: userId,
        FolloweeId: +followeeId,
      },
      select: { id: true },
    });

    if (!findFollower) {
      return res.status(400).json({
        status: 400,
        message: "팔로우 중이 아닙니다.",
      });
    };

    await prisma.Follow.delete({
      where: { id: findFollower.id}
    });

    // const responseFollower = await prisma.Follow.findFirst({
    //   where: {
    //     FollowerId: userId,
    //     FolloweeId: +followeeId,
    //   },
    //   include: {
    //     Follower: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //     Followee: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // });

    return res.status(200).json({
      status: 200,
      message: "구독 취소에 성공했습니다.",
      data: findFollower,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
