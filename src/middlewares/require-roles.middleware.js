import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { ACCESS_TOKEN_SECRET_KEY } from "../constants/env.constant.js";

export const requireListRoles = async function (req, res, next) {
  const accesstoken = req.headers.authorization;

  if (!accesstoken) {
    //accesstoken이 없으면 다음 미들웨어로 넘어감
    return next();
  }
  try {
    const [tokenType, token] = accesstoken.split(" ");

    if (tokenType !== "Bearer") {
      return res.status(401).json({
        status: 401,
        message: "지원하지 않는 인증 방식입니다.",
      });
    }

    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
    const userId = decodedToken.userId;

    const user = await prisma.User.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "인증 정보와 일치하는 사용자가 없습니다.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    let errorMessage;

    switch (error.name) {
      case "TokenExpiredError":
        errorMessage = "인증 정보가 만료되었습니다.";
        break;
      case "JsonWebTokenError":
        errorMessage = "인증 정보가 유효하지 않습니다.";
        break;
      default:
        return res.status(500).json({
          status: 500,
          message: "예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.",
        });
    }

    return res.status(401).json({
      status: 401,
      message: errorMessage,
    });
  }
};

export const requireDetailRoles = async (req, res, next) => {
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

    const followerIds = follower.map((f) => f.FollowerId);

    const accessDenied = () =>
      res.status(403).json({
        status: 403,
        message: "접근 권한이 없습니다.",
      });

    //private
    if (til.visibility === "PRIVATE") {
      if (til.userId != +userId) {
        return accessDenied();
      }
    } else if (til.visibility === "MANAGER") {
      //manager
      if (til.userId != +userId && user.role != "MANAGER") {
        return accessDenied();
      }
    } else if (til.visibility === "FOLLOWER") {
      //follower
      if (!followerIds.includes(+userId) && user.role != "MANAGER") {
        return accessDenied();
      }
    }

    req.params = params;
    next();
  } catch (error) {
    next(error);
  }
};
