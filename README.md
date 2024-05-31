# p3.TIL_hub


yarn add express dotenv bcrypt jsonwebtoken prisma nodemon @prisma/client cookie-parser


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



## 📂 프로젝트 구조 - 수정 예정

```markdown
PP3RESUME-HUB
├── prisma
│   ├── schema.prisma
│   └── migrations
├── src
│   ├── constants
|   |   ├── auth.constant.js
|   |   ├── env.constant.js
|   |   ├── resume.constant.js
|   |   └── user.constant.js
│   ├── middlewares
|   |   ├── authentication.middleware.js
|   |   ├── authorization.middleware.js
|   |   ├── error-handling.middleware.js
|   |   ├── log.middleware.js
|   |   └── validators
|   |       ├── listResumes.validator.js
|   |       ├── postResume.validator.js
|   |       ├── signup.validator.js
|   |       ├── singin.validator.js
|   |       └── updateResume.validator.js
│   ├── routers
│   │   ├── resumes.router.js
│   │   └── users.router.js
│   ├── utils
|   |   └── prisma.index.js
│   └── app.js
├── .env
├── .gitignore
├── .prettierrc.json
├── package.json
├── yarn.lock
└── README.md
```

## 🛠 개발 환경

- Node.js v20.12.1
- Yarn 1.0.0
- Express 4.19.2
- MySQL TLSv1.2,TLSv1.3
- Prisma 5.14.0
- Joi 17.13.1