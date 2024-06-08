import express from "express";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { postTIL, listComment } from "../middlewares/joi.js";
import {
  requireListRoles,
  requireDetailRoles,
} from "../middlewares/require-roles.middleware.js";
import { VISIBILITY } from "../constants/til.constant.js";

const router = express.Router();

// 게시물 생성 API /til
router.post("/", requireAccessToken, async (req, res, next) => {
  try {
    const { title, content, category, visibility } = req.body; // request.body의 데이터 중 key값이 title, content, category, visibility인 value를 저장.
    const { userId } = req.user; // requireAccessToken 미들웨어에서 저장한 request.user의데이터 중 key값이 userId인 value를 저장.

    // 필수 정보가 입력되었는지 확인
    if (!title || !content || !category || !visibility) {
      // "!"는 논리연산자 NOT, "||" 논리연산자 OR이다. !title ... 중 하나라도 1이면 if문에 걸린다. = title ... 중 하나라도 0이면 if문에 걸린다.
      return res.status(400).json({
        status: 400,
        message: "제목, 내용, 카테고리, 공개 범위를 모두 입력해 주세요.",
      });
    }
    // Joi 검증
    // 아래와 같은 방식(코드 내에서 직접 검사)과 미들웨어를 사용한 방식이 있다.
    await postTIL.validateAsync(req.body); // 요약해서 설명하면 코드 내에서 직접 검사하는 방법은 간결하고 직관적이지만, 중복 코드가 생길 수 있고 재사용성이 떨어질 수 있다.
    // 미들웨어를 사용한 방식은 재사용성과 모듈화가 뛰어나지만, 요청의 흐름이 복잡해지고 설정이 번거롭다.

    const post = await prisma.TIL.create({
      data: {
        title,
        UserId: +userId, // +userId, parseInt(userId) 다 같은 의미.
        content,
        category,
        visibility,
      },
    });

    // 생성된 게시물의 좋아요 수 조회
    const likeCount = await prisma.LikeLog.count({
      // LikeLog테이블에 where조건에 맞는 데이터 개수를 카운트하겠다.
      where: { TilId: post.tilId }, //post는 TIL테이블에 지금 막 생성한 게시글. post의 tilId를 통해 LikeLog테이블에서 정보를 검색.
    });

    return res.status(201).json({
      status: 201,
      message: "게시글 등록에 성공했습니다.",
      data: {
        id: post.id,
        tilId: post.tilId,
        userId: post.UserId,
        title: post.title,
        content: post.content,
        category: post.category,
        visibility: post.visibility,
        likeNumber: likeCount, // RESTful: likeCount, prisma의 count는 기본적으로 정수형 타입을 보내서 여기선 +나 parseInt가 필요없다.
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 게시글 목록 조회 API /til
router.get("/", requireListRoles, async (req, res, next) => {
  try {
    // 기본적으로 visibility가 PUBLIC인건 포함.
    let whereCondition = {
      // 검색을 할때 where : { id : +userId}와 같은 형태를 미리 만들어 놓은 변수.
      OR: [{ visibility: VISIBILITY.PUBLIC }],
    };

    // 유저 정보가 있다면 MEMBER인지 MANAGER인지에 따라 어떤 TIL visibility까지 접근가능한지
    // requireListRoles 미들웨어는 인증이 없으면 그냥 통과해서 req.user값이 없다.
    if (req.user) {
      const { role } = req.user; // 구조 분해 할당 방식이라 한다.
      const userId = req.user.userId; // 직접 접근 방식이라 한다.
      // 직접 접근 방식은 간단하고 명확하나, 여러 속성을 한 번에 추출(?)할 때는 구조 분해 할당 방식이 낫다.

      // requireListRoles 미들웨어를 accesstoken있어서 req.user에 userId와 role이 있을때,
      if (role === "MEMBER") {
        whereCondition.OR.push({ UserId: +userId }); //
      } else if (role === "MANAGER") {
        whereCondition.OR.push(
          { visibility: VISIBILITY.MANAGER },
          { UserId: +userId }
        );
      }
    }
    // Joi 검증 req.query로 query parameters에 체크
    await listComment.validateAsync(req.query);

    const sort = req.query.sort || "desc";
    let orderBy; // sort에 적힌 문자열 아래 조건문에 따라 저장.

    if (sort === "asc" || sort === "desc") {
      // asc나 desc로 입력했을때,
      orderBy = { createdAt: sort };
    } else if (sort === "likes") {
      // sort:likes로 입력했을때는 좋아요 많은 순서
      orderBy = { LikeLog: { _count: "desc" } };
    } else {
      // 기본적으로(입력안하면) 내림차순(최신순)
      orderBy = { createdAt: "desc" };
    }

    const posts = await prisma.TIL.findMany({
      where: whereCondition,
      orderBy: orderBy,
      include: {
        LikeLog: true, // select: { logId: true}로 설정해서 필요한 값만 가져오는게 더 좋았을 듯하다.
        User: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });
    // 객체 형태로 저장된 posts를 map돌려서 변수 response에 저장.
    const response = posts.map((post) => ({
      tilId: post.tilId,
      userId: post.userId,
      userName: post.User.name,
      title: post.title,
      content: post.content,
      category: post.category,
      visibility: post.visibility,
      likeNumber: post.LikeLog.length, // RESTful: likeCount
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: "게시글 목록 조회에 성공했습니다.",
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

// Follower 게시글 목록 조회 API /til/follower
router.get("/follower", requireAccessToken, async (req, res, next) => {
  try {
    const { userId } = req.user;

    //내가 팔로우 중인 사람 리스트 불러오기 => 좀 더 직관적인 변수명의 필요성을 느낌.
    const followees = await prisma.Follow.findMany({
      where: { FollowerId: +userId },
      select: { FolloweeId: true }, // 팔로우중인 사람 Id
    });

    const followeeIds = followees.map((f) => f.FolloweeId);
    // RESTful: tils를 followerTils로 하고, til을 followerTil로 하는게 좋았다
    let tils = [];
    // followeeIds를 돌면서 TIL테이블을 돌아서 TILs를 가져온다. for문으로 개별 쿼리 실행하고 있다. 비효율, 불필요하다.
    for (const followeeId of followeeIds) {
      const til = await prisma.TIL.findMany({
        where: { visibility: "FOLLOWER", UserId: +followeeId }, // 팔로우 중인 사람이 쓴 게시글이 FOLLOWER visibility를 가진 글만 가져옴.
        // 사실 visibility: "FOLLOWER"만 없거나 "PUBLIC"으로 바꾸면 당근마켓 모아보기 될듯
        include: {
          User: {
            select: {
              userId: true,
              name: true,
            },
          },
          LikeLog: true,
          Comment: true,
        },
      });
      tils = tils.concat(til);
    }

    if (!tils) {
      return res.status(400).json({
        status: 400,
        message: "게시글이 존재하지 않습니다.",
      });
    }

    const response = tils.map((til) => ({
      tilId: til.tilId,
      userId: til.userId,
      userName: til.User.name,
      title: til.title,
      content: til.content,
      category: til.category,
      visibility: til.visibility,
      likeNumber: til.LikeLog.length, // RESTful: likeCount
      comments: til.Comment,
      createdAt: til.createdAt,
      updatedAt: til.updatedAt,
    }));

    res.status(200).json({
      status: 200,
      message: "Follower의 게시글 목록 조회에 성공했습니다.",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
});

// 게시물 수정 API /til/:id
router.put("/:til_id", requireAccessToken, async (req, res, next) => {
  try {
    const tilId = req.params.til_id;
    const { userId } = req.user;
    const { title, content, category, visibility } = req.body;

    // 필수 정보가 입력되었는지 확인
    if (!title || !content || !category || !visibility) {
      return res
        .status(400)
        .json({ status: 400, message: "수정할 정보를 모두 입력해 주세요." });
    }

    // Joi 검증
    await postTIL.validateAsync(req.body);

    // 접근가능한 userId, 입력받은 tilId랑 일치하는 TIL이 있는지 체크
    const isExistTIL = await prisma.TIL.findFirst({
      where: { tilId: +tilId, UserId: +userId },
    });

    if (!isExistTIL) {
      return res.status(404).json({
        errorMessage: "게시글이 존재하지 않거나 접근 권한이 없습니다.",
      });
    }

    // 게시글 업데이트
    const updatedPost = await prisma.TIL.update({
      where: { tilId: +tilId, UserId: +userId },
      data: { title, content, category, visibility },
    });

    // 업데이트된 게시글의 좋아요 수 조회
    const likeCount = await prisma.LikeLog.count({
      where: { TilId: updatedPost.tilId },
    });
    // // 아래와 같이 한꺼번에 할 수 있었다.
    // // 게시글 업데이트와 게시글 좋아요 수 포함 조회
    // const updatedPost = await prisma.TILupdate({
    //   where: { tilId: +tilId, UserId: +userId },
    //   data: { title, content, category, visibility },
    //   include: {
    //     LikeLog: {
    //       select: {
    //         logId: true,
    //       },
    //     },
    //   },
    // });
    //
    // const likeCount = updatedPost.LikeLog.length;

    // 응답
    return res.status(200).json({
      status: 200,
      message: "게시글 수정에 성공했습니다.",
      data: {
        tilId: updatedPost.tilId,
        userId: updatedPost.UserId,
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
        visibility: updatedPost.visibility,
        likeNumber: likeCount, // RESTful: likeCount: likeCount,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 게시물 삭제 API /til/:id
router.delete("/:til_id", requireAccessToken, async (req, res, next) => {
  try {
    const tilId = req.params.til_id;
    const { userId } = req.user;

    // 접근가능한 userId, 입력받은 tilId랑 일치하는 TIL이 있는지 체크
    const isExistTIL = await prisma.TIL.findFirst({
      where: { tilId: parseInt(tilId), UserId: +userId },
    });

    if (!isExistTIL) {
      return res.status(404).json({
        errorMessage: "게시글이 존재하지 않거나 접근 권한이 없습니다.",
      });
    }

    // 삭제된 게시물의 정보를 가져오기 위해 삭제 전에 저장
    const deletedPost = await prisma.TIL.findUnique({
      where: { tilId: parseInt(tilId) },
      select: { tilId: true, title: true },
    });

    await prisma.TIL.delete({
      where: { tilId: parseInt(tilId), UserId: +userId },
    });

    return res.status(201).json({
      status: 201,
      message: "게시글 삭제에 성공했습니다.",
      data: deletedPost,
    });
  } catch (error) {
    next(error);
  }
});

// 게시글 상세조회 API /til/:id
router.get(
  "/:til_id",
  requireAccessToken,
  requireDetailRoles,
  async (req, res, next) => {
    const params = req.params;
    const tilId = parseInt(params.til_id);

    try {
      const post = await prisma.TIL.findUnique({
        where: { tilId: +tilId },
        include: {
          User: {
            select: {
              userId: true,
              name: true,
            },
          },
          LikeLog: true,
          Comment: {
            include: {
              User: {
                select: {
                  name: true,
                },
              },
              _count: {
                select: { CommentLike: true }, //CommentLike 테이블에서 개수 포함
              },
            },
            orderBy: {
              CommentLike: { _count: "desc" }, // 좋아요 개수 순으로 정렬
            },
            take: 3, // 베댓 3개만 가져옴
          },
        },
      });

      if (!post) {
        return res.status(400).json({
          status: 400,
          message: "게시글이 존재하지 않습니다.",
        });
      }

      res.status(200).json({
        status: 200,
        message: "게시글 상세 조회에 성공했습니다.",
        data: {
          id: post.id,
          userId: post.User.id, // userId: post.User.userId, 로 바꿔야 나올듯?
          userName: post.User.name,
          title: post.title,
          content: post.content,
          category: post.category,
          visibility: post.visibility,
          likeNumber: post.LikeLog.length, // RESTful: likeCount
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          comments: post.Comment.map((comment) => ({
            userName: comment.User.name,
            content: comment.content,
            likeNumber: comment._count.CommentLike, // RESTful: likeCount
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
