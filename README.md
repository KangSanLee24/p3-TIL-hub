# p3.TIL_hub

## 🏁 목표

"Express.js, MySQL을 활용해 TIL 뉴스피드 서비스 백엔드 서버 만들기"


## 📚 프로젝트 완료 시 할 수 있는 것

1. **API 명세서를 작성**하여 프론트엔드 개발자와 원활히 협업
2. **ERD를 작성**하여 RDB(MySQL)를 이용한 데이터 모델링
3. **MySQL, Prisma**를 이용해 데이터베이스를 설계하고 활용
4. **JWT, Middleware**를 활용해 인증과 인가 기능 구현
5. **Transaction**의 동작 방식과 활용처를 알고 직접 구현


## 📂 프로젝트 구조 

```markdown
PP3RESUME-HUB
├── assets
│   └── erd.JPG
├── prisma
│   ├── schema.prisma
│   └── migrations
├── src
│   ├── constants
|   |   ├── auth.constant.js
|   |   ├── env.constant.js
|   |   ├── http-status.constant.js
|   |   ├── message.constant.js
|   |   ├── til.constant.js
|   |   └── user.constant.js
│   ├── middlewares
|   |   ├── error-handler.middleware.js
|   |   ├── joi.js
|   |   ├── require-access-token.middleware.js
|   |   ├── require-refresh-token.middleware.js
|   |   └── require-roles.middleware.js
│   ├── routers
│   │   ├── auth.router.js
│   │   ├── comment-like.router.js
│   │   ├── comment.router.js
│   │   ├── follow.router.js
│   │   ├── likes.js
│   │   ├── post.router.js
│   │   └── user.router.js
│   ├── utils/prisma
|   |   └── index.js
│   └── app.js
├── .env
├── .gitignore
├── .prettierrc.json
├── package.json
├── yarn.lock
└── README.md
```

## 🚀 설치 및 실행 방법

### 1. 프로젝트 클론

```
git clone https://github.com/KangSanLee24/PersonalProject3.git
cd p3.TIL_hub
```

### 2. 의존성 설치
```
yarn
```
### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가합니다:

```env
SERVER_PORT=3015
DATABASE_URL="your-database-url"
ACCESS_TOKEN_SECRET_KEY='your_secret_key'
REFRESH_TOKEN_SECRET_KEY='your_secret_key2'
```

### 4. 데이터베이스 마이그레이션

```
npx prisma migrate dev --name init
```

### 5. 서버 실행

```
yarn start 
```


## 📋 API 명세서

[뉴스피드 프로젝트 API 명세서](https://www.notion.so/teamsparta/TIL-0652345e84e94005abf59f2ac845fb88)

## 📑 ERD (Entity Relationship Diagram)

![ERD](./assets/ERD.JPG)

## 🔒 인증 및 인가

- **JWT**를 사용하여 인증 및 인가를 처리합니다.
- **Middleware**를 활용하여 인증 및 역할 기반 인가를 구현합니다.

## 🌐 배포

- **CentOS 9에 Express / PM2**를 이용하여 웹 서비스를 베포합니다.
- **http://til-hub.duckdns.org:3001**

## 🛠 개발 환경

- Node.js v20.12.1
- Yarn 1.22.22
- Express 4.19.2
- MySQL TLSv1.2,TLSv1.3
- Prisma 5.15.0
- Joi 17.13.1
- Dotenv 16.4.5
- Nodemon 3.1.2

## 📬 문의

- 문의는 Issues로 남겨주세요.

---------------------------

### commit 규칙

| 작업 타입   | 작업내용                       |
| ----------- | ------------------------------ |
| ✨ update   | 해당 파일에 새로운 기능이 생김 |
| 🎉 add      | 없던 파일을 생성함, 초기 세팅  |
| 🐛 bugfix   | 버그 수정                      |
| ♻️ refactor | 코드 리팩토링                  |
| 🩹 fix      | 코드 수정                      |
| 🚚 move     | 파일 옮김/정리                 |
| 🔥 del      | 기능/파일을 삭제               |
| 🍻 test     | 테스트 코드를 작성             |
| 💄 style    | CSS 스타일 변경                |
| 🙈 gitfix   | .gitignore 수정                |
| 🔨 function | function.js 변경(기능추가 등)  |


```
ex)
🩹 fix :파일명.뭐고침
```