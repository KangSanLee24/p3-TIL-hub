import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { createUser, loginUser } from "../middlewares/joi.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET_KEY } from "../constants/env.constant.js";
import { REFRESH_TOKEN_SECRET_KEY } from "../constants/env.constant.js";
import refreshMiddleware from "../middlewares/require-refresh-token.middleware.js";
import { transporter } from "../constants/mail.constant.js";
import { SERVER_PORT, SERVER_IP } from "../constants/env.constant.js";

const router = express.Router();

//회원가입 /auth/sign-up
router.post("/sign-up", async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, phoneNumber } = req.body;

    //joi 유효성 검사(middlewares/joi.js파일)
    await createUser.validateAsync(req.body);

    const isExistUser = await prisma.User.findFirst({
      where: {
        email,
      },
    });

    if (isExistUser) {
      return res.status(400).json({
        status: 400,
        message: "이미 가입된 사용자입니다.",
      });
    }

    if (password != passwordConfirm) {
      return res.status(400).json({
        status: 400,
        message: "입력 한 두 비밀번호가 일치하지 않습니다.",
      });
    }

    //비밀번호 해싱
    const hashPassword = await bcrypt.hash(password, 10);

    //트랙잭션( 유저 테이블과 유저인포 테이블에 같이 데이터를 넣고 데이터 일관성을 지키기 위해 트랜잭션 수행)
    const [createdUser, createdUserInfo] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.User.create({
          data: {
            name,
            email,
            password: hashPassword,
            phoneNumber,
          },
        });

        const userInfo = await tx.UserInfo.create({
          data: {
            userId: user.userId,
          },
        });

        return [user, userInfo];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    //url 선언
    const url = `http://${SERVER_IP}:${SERVER_PORT}/auth/verify-email?email=${email}`;

    //nodemailer 패키지 사용해서 메일 전공. action에 선언한 url을 넣어줘서 클릭시 url이 작동되도록(인섬니아에서 url호출하는것과 비슷한 원리)
    // mail.comstant.js 환경변수 만들어줘야함
    await transporter.sendMail({
      from: "tilhub@naver.com",
      to: email,
      subject: "[tilhub] 회원가입 인증 메일입니다.",
      html: `<form action="${url}" method="POST">
      <h2 style="margin: 20px 0">[tilhub] 이메일 인증 버튼을 클릭해 주세요.</h2>
      <p> 인증 유효시간은 3분 입니다. 3분 안에 버튼을 클릭해 주세요! <p>
      <button style=" background-color: #c0c0c0; color:#000000; width: 80px; height:40px; border-radius: 20px; border: none;">이메일 인증</button>
    </form>`,
    });

    return res.status(201).json({
      status: 201,
      message: "인증 이메일을 전송했습니다. 인증 후 회원가입이 완료됩니다.",
    });
  } catch (error) {
    next(error);
  }
});

//이메일 인증  위에서 action에서 호출된 url에서 작동하는 라우터
router.post("/verify-email", async (req, res, next) => {
  try {
    const { email } = req.query;

    await prisma.User.update({
      where: { email: email },
      data: {
        isEmailValid: true,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "회원가입에 성공했습니다.",
    });
  } catch (error) {
    const { email } = req.query;

    //트랙잭션 마찬가지로 데이터 일관성을 위해 트랜잭션으로 삭제.
    //fk가 존재할 시 pk 삭제 불가. (ex. 유저 인포테이블에 데이터가 있는데 유저 테이블에 데이터 삭제 불가)
    await prisma.$transaction(
      async (tx) => {
        const user = await tx.User.findFirst({
          where: { email: email },
        });

        await tx.UserInfo.delete({
          where: {
            userId: user.userId,
          },
        });

        await tx.User.delete({
          where: { email: email },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
    next(error);
  }
});

//로그인 /auth/sign-in
router.post("/sign-in", async (req, res, next) => {
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
        message: "존재하지 않는 사용자 입니다.",
      });
    }

    // 이메일 인증을 하지 않고 로그인을 시도하면 에러 메세지 출력
    if (user.isEmailValid === false) {
      return res.status(400).json({
        status: 400,
        message: "이메일 인증을 완료해 주세요.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 401,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    //토큰 생성
    //로그인 시 엑세스토큰, 리프레시 토큰 발급. 리프레시 토큰은 로그아웃시 사용됨. 엑세스 토큰은 유효시간 지나면 저절로 만료
    const accesstoken = jwt.sign(
      { userId: user.userId },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "12h" }
    );

    const refreshtoken = jwt.sign(
      { userId: user.userId },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "7d" }
    );

    //헤더에 토큰 저장
    res.setHeader("accesstoken", `Bearer ${accesstoken}`);
    res.setHeader("refreshtoken", `Bearer ${refreshtoken}`);

    const hashRefreshToken = await bcrypt.hash(refreshtoken, 10);

    const existingToken = await prisma.RefreshToken.findFirst({
      where: {
        UserId: user.userId,
      },
    });

    //만약 리프레시 토큰이 존재하면 로그인시 리프레시 토큰을 생성하는게 아니라 재발급함.
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
        message: "로그인에 성공했습니다.",
        accesstoken,
        refreshtoken,
      });
    }

    //리프레시 토큰 생성
    await prisma.RefreshToken.create({
      data: {
        UserId: user.userId,
        refreshToken: hashRefreshToken,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "로그인에 성공했습니다.",
      accesstoken,
      refreshtoken,
    });
  } catch (error) {
    next(error);
  }
});

//로그아웃 /auth/sign-out
router.post("/sign-out", refreshMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    //저장된 리프레시 토큰 삭제
    await prisma.RefreshToken.delete({
      where: { UserId: +userId },
    });

    return res.status(200).json({
      status: 200,
      message: "로그아웃에 성공했습니다.",
      data: {
        id: userId,
      },
    });
  } catch (error) {
    next(error);
  }
});

//token 재발급 /auth/token
//엑세스 토큰을 재발급 하기 위해 리프레시 토큰을 이용해서 재발금.
router.post("/token", refreshMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const accesstoken = jwt.sign({ userId: userId }, ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: "12h",
    });

    const refreshtoken = jwt.sign(
      { userId: userId },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.setHeader("accesstoken", `Bearer ${accesstoken}`);
    res.setHeader("refreshtoken", `Bearer ${refreshtoken}`);

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
      message: "토큰 재발급에 성공했습니다.",
      accesstoken,
      refreshtoken,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
