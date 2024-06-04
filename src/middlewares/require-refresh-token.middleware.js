import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import { REFRESH_TOKEN_SECRET_KEY } from "../constants/env.constant.js";

export default async function (req, res, next) {
  try {
    const refreshtoken = req.headers.authorization;

    if (!refreshtoken) {
      return res.status(401).json({
        status: 401,
        message: "인증 정보가 없습니다.",
      });
    }

    const [tokenType, token] = refreshtoken.split(" ");

    if (tokenType !== "Bearer") {
      return res.status(401).json({
        status: 401,
        message: "지원하지 않는 인증 방식입니다.",
      });
    }

    const decodedToken = jwt.verify(token, REFRESH_TOKEN_SECRET_KEY);
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

    const tokens = await prisma.RefreshToken.findFirst({
      where: { UserId: +userId },
    });

    if (!tokens || !(await bcrypt.compare(token, tokens.refreshToken))) {
      return res.status(401).json({
        status: 401,
        message: "폐기된 인증 정보입니다.",
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
