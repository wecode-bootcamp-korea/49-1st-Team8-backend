const { DataSource } = require("typeorm");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

const myDataSource = new DataSource({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!_threadService");
});

const readThreads = async (req, res) => {
  try {
    //스레드 받아오기
    const getThread = await myDataSource.query(`
      SELECT
      users.nickname,
      users.profile_image AS profileImage,
      users.id AS userId,
      threads.id AS postId,
      threads.content,
      threads.created_at AS createdAt,
      threads.updated_at AS updatedAt
      FROM threads
      INNER JOIN users ON threads.user_id = users.id
      ORDER BY threads.created_at DESC;
      `);

    const token = req.get("authorization");
    console.log("token", token, typeof(token));
    let userId;

    if (token && token != "null") {
      console.log("token o");
      const { id } = jwt.verify(token, process.env.TYPEORM_JWT);
      // id에 맞는 회원이 db에 있는지 확인
      userId = id;

      await getThread.forEach((thread) => {
        console.log(thread.userId, userId);
        thread.isMyData = thread.userId === userId;
      });
    }

    await getThread.forEach((thread) => {
      console.log("accessX")
      thread.isAccessToken = Boolean(userId);
      console.log("a")
      thread.createdAt = thread.createdAt
        .toISOString()
        .slice(2, 10)
        .replaceAll("-", ".");
    });

    console.log("success");
    //결과 출력
    return res.status(200).json({
      getThread,
    });
  } catch (error) {
    console.log(error);
  }
};

const createThreads = async (req, res) => {
  try {
    //토큰 받음
    const token = req.headers.authorization;

    //토큰 없을 때
    if (!token) {
      const error = new Error("TOKEN_ERROR");
      error.statusCode = 400;
      error.code = "TOKEN_ERROR";
      throw error;
    }

    //토큰 검증
    const { id } = jwt.verify(token, process.env.TYPEORM_JWT);

    console.log(id);

    //스레드 내용
    const { content } = req.body;

    //스레드 내용이 없을 때
    if (content.length === 0) {
      const error = new Error("CONTENT_TOO_SHORT");
      error.statusCode = 400;
      error.code = "CONTENT_TOO_SHORT";
      throw error;
    }

    //스레드 저장
    const newPost = await myDataSource.query(`
        INSERT INTO threads (
            user_id,
            content
        ) VALUES (
            '${id}',
            '${content}'
        );
        `);

    console.log("new Post ID : ", newPost.id);
    console.log("new Post Content : ", newPost.content);

    //스레드 내용 출력
    return res.status(200).json({
      code: "writingSuccess",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

// 쓰레드 삭제하기
const deleteThreads = async (req, res) => {
  try {
    const token = req.headers.authorization;
    console.log(req.headers)
    console.log("delete", token);

    if (!token) {
      const error = new Error("NO_TOKEN");
      error.statusCode = 401;
      error.code = "NO_TOKEN";

      throw error;
    }

    const { id } = jwt.verify(token, process.env.TYPEORM_JWT);

    const foundUser = await myDataSource.query(`
      SELECT * FROM users WHERE id = '${id}'
      `);

    if (!foundUser) {
      const error = new Error("USER_NOT_FOUNDED");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUNDED";
      throw error;
    }

    const deleteExpectedThreadId = req.params.id;

    const [writer] = await myDataSource.query(
      `SELECT user_id FROM threads WHERE id = '${deleteExpectedThreadId}'`
    );

    const writerId = writer.user_id;

    if (id !== writerId) {
      const error = new Error("NOT_AUTHORIZED");
      error.statusCode = 404;
      error.code = "NOT_AUTHORIZED";
      throw error;
    }

    await myDataSource.query(
      `DELETE FROM threads WHERE id = '${deleteExpectedThreadId}';`
    );

    return res.status(200).json("threadDeleted");
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

// 쓰레드 수정하기
const updateThreads = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      const error = new Error("NO_TOKEN");
      error.statusCode = 401;
      error.code = "NO_TOKEN";
      throw error;
    }

    const { id } = jwt.verify(token, process.env.TYPEORM_JWT);
    const foundUser = await myDataSource.query(`
        SELECT * FROM users WHERE id = '${id}'`);
    if (!foundUser) {
      const error = new Error("USER_NOT_FOUNDED");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUNDED";
      throw error;
    }
    const update = req.body;
    const threadId = update.postId;
    const updateContent = update.content;
    console.log(threadId);
    const [writer] = await myDataSource.query(
      `SELECT user_id FROM threads WHERE id = '${threadId}'`
    );

    const writerId = writer.user_id;
    console.log(writerId, id);
    if (id !== writerId) {
      const error = new Error("NOT_AUTHORIZED");
      error.statusCode = 404;
      error.code = "NOT_AUTHORIZED";
      throw error;
    }

    if (updateContent.length === 0){
    const error = new Error("CONTENT_TOO_SHORT");
    error.statusCode = 404;
    error.code = "CONTENT_TOO_SHORT";
    throw error;
  }
  console.log("수정" ,updateContent);
    await myDataSource.query(
      `UPDATE threads SET content = '${updateContent}' WHERE id = '${threadId}'`
    );

    console.log(updateContent);
    return res.status(201).json({ code: "writingSuccess" });
  } catch (error) {
    console.log(error);
    res.status(400).json({message: error.code});
  }
};

//수정 할 게시글 받아오기
const sendWrittenPost = async (req, res) => {
  try {
    // 유저아이디랑 포스트아이디의 유저아이디 틀리면 던져

    const token = req.headers.authorization;
    const threadsId = req.params.id;

    if (!token) {
      const error = new Error("NO_TOKEN");
      error.statusCode = 401;
      throw error;
    }
    const { id } = jwt.verify(token, process.env.TYPEORM_JWT);
    const foundUser = await myDataSource.query(`
          SELECT * FROM users WHERE id = '${id}'`);
    if (!foundUser) {
      const error = new Error("USER_NOT_FOUND");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    const [thread] = await myDataSource.query(
      `SELECT
          users.id,
          users.nickname,
          threads.content
        FROM threads
        INNER JOIN users
        ON users.id = threads.user_id
        WHERE threads.id = '${threadsId}'
        AND threads.user_id = '${id}'`
    );

    if (!thread) {
      const error = new Error("NOT_YOUR_POST");
      error.statusCode = 404;
      error.code = "NOT_YOUR_POST";
      throw error;
    }

    console.log(threadsId);

    return res.status(201).json({ ...thread });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

//수정 할 게시글 받아오기
const threadDetails = async (req, res) => {
  try {
    // 유저아이디랑 포스트아이디의 유저아이디 틀리면 던져

    const token = req.headers.authorization;
    const threadsId = req.params.id;

    if (!token) {
      const error = new Error("NO_TOKEN");
      error.statusCode = 401;
      error.code = "NO_TOKEN";
      throw error;
    }
    const { id } = jwt.verify(token, process.env.TYPEORM_JWT);
    const foundUser = await myDataSource.query(`
          SELECT * FROM users WHERE id = '${id}'`);
    if (!foundUser) {
      const error = new Error("USER_NOT_FOUND");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    const [thread] = await myDataSource.query(
      `SELECT
          users.id,
          users.nickname,
          threads.content
        FROM threads
        INNER JOIN users
        ON users.id = threads.user_id
        WHERE threads.id = '${threadsId}'
        AND threads.user_id = '${id}'`
    );

    if (!thread) {
      const error = new Error("NOT_YOUR_POST");
      error.statusCode = 404;
      error.code = "NOT_YOUR_POST";
      throw error;
    }

    if (!threadsId) {
      const error = new Error("CONTENT_NOT_FOUND");
      error.statusCode = 404;
      error.code = "CONTENT_NOT_FOUND";
      throw error;
    }

    console.log(threadsId);

    return res.status(201).json({ ...thread });

  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

module.exports = {
  readThreads,
  createThreads,
  deleteThreads,
  updateThreads,
  sendWrittenPost,
  threadDetails
};
