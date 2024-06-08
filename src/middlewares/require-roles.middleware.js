import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { ACCESS_TOKEN_SECRET_KEY } from "../constants/env.constant.js";
// 게시글 목록조회 API의 미들웨어 : accesstoken이 없으면 패스, 있으면 유효한지 체크하고 req.user=user.
export const requireListRoles = async function (req, res, next) {
  const accesstoken = req.headers.authorization;

  if (!accesstoken) {
    //accesstoken이 없으면 다음 미들웨어로 넘어감
    return next();
  }
  try {
    // 여기부터는 require-access-token.middleware.js의 16줄이후랑 동일
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

    req.user = user; // req.user에 User테이블의 컬럼들 다 들어간다.
    next();
  } catch (error) {
    // 여기도 error-handler.middleware.js로 보내도된다.
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
// 게시글 상세조회 API의 미들웨어: 특정 TIL에 접근 권한이 있는 지 확인
export const requireDetailRoles = async (req, res, next) => {
  try {
    const { userId } = req.user; // requireAccessToken를 통과한 인증받은 사용자 정보
    const params = req.params;
    const tilId = params.til_id; // const tilId = req.params.til_id;
    // const { til_id } = req.params;로 하고 tilId 대신 til_id라 해도됨. 하지만 카멜케이스때문에 위와 같이 작성

    // 71~81줄은 사실 필요 없다. requireAccessToken 미들웨어에서 이미 확인했기 때문
    const user = await prisma.User.findFirst({
      where: { userId: +userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "존재하지 않는 사용자 입니다.",
      });
    }
    // path parameter로 받은 til_id로 검색했을 떄 TIL있는지 확인
    const til = await prisma.TIL.findFirst({
      where: { tilId: +tilId },
      select: { UserId: true, visibility: true },
    });

    if (!til) {
      return res.status(404).json({
        status: 401,
        message: "게시글이 존재하지 않습니다.",
      });
    }
    // 게시글을 작성한 유저의 팔로워 목록을 조회해서 folloewer에 저장.
    // RESTful: followers
    const follower = await prisma.Follow.findMany({
      where: { FollowerId: til.UserId },
      select: { FollowerId: true },
    });
    // 배열형태로 변환해서 저장
    const followerIds = follower.map((f) => f.FollowerId);

    // 접근 권한 거부 함수, 이런 것도 캡슐화 하면 더 좋았을듯
    const accessDenied = () =>
      res.status(403).json({
        status: 403,
        message: "접근 권한이 없습니다.",
      });

    // 게시글이 PRIVATE면 게시글 작성자만 접근가능
    if (til.visibility === "PRIVATE") {
      if (til.UserId != +userId) {
        return accessDenied();
      }
    } else if (til.visibility === "MANAGER") {
      // 게시글이 MANAGER이면
      // 게시글 작성자 본인과 접속한 사람이 MANAGER일때 접근 가능
      if (til.UserId != +userId && user.role != "MANAGER") {
        return accessDenied();
      }
    } else if (til.visibility === "FOLLOWER") {
      // 게시글이 FOLLOWER이면
      // 게시글 작성자 본인과 접속한 사람이 게시글 작성자가 팔로우하는 사람이거나 역할이 MANAGER일때 접근 가능
      if (!followerIds.includes(+userId) && user.role != "MANAGER") {
        return accessDenied();
      }
    }
    // req.params 그대로 유지한다.
    req.params = params;
    next();
  } catch (error) {
    next(error);
  }
};

// 접속한 사람이 게시글 작성자가 팔로우하는 사람이여야 볼 수 있는 조건보다
// 접속한 사람이 게시글 작성자를 팔로우 하는 사람이 볼 수 있어야한다.
/**     
    const followers = await prisma.Follow.findMany({
      where: { FolloweeId: til.UserId }, 
      select: { FollowerId: true },
    });
*/
// 만약 게시글의 visibility에 "F4F" "맞팔"을 추가한다면,
/** 126줄부터 추가하면 되지 않을까?
else if(til.visibility ==="F4F") {
  const followingByUser = await prisma.Follow.findFirst({
    where:{ FollowerId:+userId, FolloweeId:til.UserId},
  });
  const followingByAuthor = await prisma.Follow.findFirst({
    where:{FollowerId: til.User, FolloweeId:+userId},
  });
  
  if(!followingByUser || !followingByAuthor) {
    return accessDenied();
  }
}
**/
