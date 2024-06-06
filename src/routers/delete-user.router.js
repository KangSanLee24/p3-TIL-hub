import { prisma } from "../utils/prisma/index.js";

//유효기간 3분 지나면 데이터 삭제
export default async function deleteExpiredUsers() {
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

  const findUser = await prisma.User.findMany({
    where: {
        createdAt: {
            lt: threeMinutesAgo,
        },
        isEmailValid: false,
    },
    select: {userId: true,
             name : true},
  });

  for (const user of findUser) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userInfo.deleteMany({
          where: { userId: user.userId },
        });

        await tx.user.deleteMany({
          where: { userId: user.userId },
        });
      });

      console.log(`${user.name} 유저 이메일 인증 유효기간 만료로 삭제`);
    } catch (error) {
      console.error(`Error deleting user ${user.name}:`, error);
    }
  }
};
