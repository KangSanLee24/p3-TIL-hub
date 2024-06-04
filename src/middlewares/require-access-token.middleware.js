import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { ACCESS_TOKEN_SECRET_KEY } from "../constants/env.constant.js";

export async function getUserFromToken(token) {
  const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
  const userId = decodedToken.userId;

  const user = await prisma.User.findFirst({
    where: { userId: +userId },
  });

  if (!user) {
    throw new Error("인증 정보와 일치하는 사용자가 없습니다.");
  }

  return user;
}

export default async function (req, res, next) {
  try {
    const accesstoken = req.headers.authorization;

    if (!accesstoken) {
      return res.status(401).json({
        status: 401,
        message: "인증 정보가 없습니다.",
      });
    }

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

    // const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
    // const userId = decodedToken.userId;

    // const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
    // const userId = decodedToken.userId;

    // const user = await prisma.User.findFirst({
    //   where: { userId: +userId },
    //   include: {
    //     UserInfo: true,
    //   },
    //   // 내정보 조회시 비밀번호 예외처리
    //   omit: { password: true, isDeleted: true },
    // });

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
}
