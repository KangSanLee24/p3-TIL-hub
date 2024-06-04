import { prisma } from "../utils/prisma/index.js";

export const requireRoles = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const params = req.params;
    const tilId = params.til_id;

    const user = await prisma.User.findFirst({
      where: { userId: +userId },
      select: { role: true },
    });

    const til = await prisma.TIL.findFirst({
      where: { tilId: +tilId },
      select: { UserId: true, visibility: true },
    });

    const follower = await prisma.Follow.findMany({
      where: { FollowerId: til.userId },
      select: { FollowerId: true },
    });

    //private
    if (til.visibility === "PRIVATE") {
      if (til.userId != +userId) {
        return res.status(403).json({
          status: 403,
          message: "접근 권한이 없습니다.",
        });
      }
      req.params = params;
      return next();
    }

    //manager
    if (til.visibility === "MANAGER") {
      if (til.userId != +userId) {
        if (user.role != "MANAGER") {
          return res.status(403).json({
            status: 403,
            message: "접근 권한이 없습니다.",
          });
        }
      }
      req.params = params;
      return next();
    }

    //follower
    const followerIds = follower.map((f) => f.FollowerId);

    if (til.visibility === "FOLLOWER") {
      if (!followerIds.includes(+userId)) {
        if (user.role != "MANAGER") {
          return res.status(403).json({
            status: 403,
            message: "접근 권한이 없습니다.",
          });
        }
      }
      req.params = params;
      return next();
    }
    req.params = params;
    next();
  } catch (error) {
    next(error);
  }
};
