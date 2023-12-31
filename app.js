// 사용되는 라이브러리들
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
const helmet = require("helmet");
const hpp = require("hpp");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);

dotenv.config(); // 현재 디렉토리의 .env 파일을 자동으로 인식하여 환경변수를 세팅(process.env.COOKIE_SECRET)
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
});
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const { sequelize } = require("./models");
const passportConfig = require("./passport");
const logger = require("./logger");

const app = express();
passportConfig();
// 8001번 포트 사용, 넌적스(html에서 반복문 등을 사용할 수 있음)통해서 랜더링
app.set("port", process.env.PORT || 8001);
app.enable("trust proxy");
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});
sequelize
  .sync({ force: false }) // true로 설정하면 테이블 날아감
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

// app.use(morgan("dev")); // 로깅하는거(배포할 때는 dev -> combined)
if (process.env.NODE_ENV === "production") {
  app.enable("trust proxy");
  app.use(morgan("combined"));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}

app.use(express.static(path.join(__dirname, "public"))); // public 자유롭게 접근 허용되어 있음, (__dirname은 app.js(현재파일)의 위치이므로 nodebird이고 여기서 public 폴더를 static으로)
app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }),
};
if (process.env.NODE_ENV === "production") {
  sessionOption.proxy = true;
}

app.use(session(sessionOption));
// passport는 반드시 session 밑에 두어야함
app.use(passport.initialize());
app.use(passport.session());

//
app.use("/", pageRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

// 없는 페이지에 접속하면 에러
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  logger.info("hello");
  logger.error(error.message);
  next(error); // 미들웨어끼리는 next룰 써야함, next(error)는 에러처리 미들웨어로 감
});

// 애러처리 미들웨어는 네 개의 매개변수 양식 고정
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {}; // 배포 모드에서 에러를 숨김
  res.status(err.status || 500);
  res.render("error"); // views 폴더의 error가 화면으로 전송(위의 넌적스에서 views폴더의 .html을 설정해둠)
});

module.exports = app;
