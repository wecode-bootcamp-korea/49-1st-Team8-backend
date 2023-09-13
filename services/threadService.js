const { DataSource } = require('typeorm')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

const myDataSource = new DataSource({
    type : process.env.DB_TYPE,
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    username : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
})

myDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!_threadService")
    })

const readThreads = async (req, res) => {
    try {
        //스레드 받아오기
        const getThread = await myDataSource.query(`
        SELECT
        users.nickname,
        users.profile_image AS profileImage,
        threads.id AS postId,
        threads.content,
        threads.created_at AS createdAt,
        threads.updated_at AS updatedAt
        FROM threads
        INNER JOIN users ON threads.user_id = users.id
        ORDER BY threads.created_at DESC;
        `)

        console.log("success");
        //결과 출력
        return res.status(200).json({
            getThread
        })
    } catch (error) {
        console.log(error)
    }
}

const createThreads = async(req, res) => {
    try {

        //토큰 받음
        const token = req.headers.authorization;

        //토큰 없을 때
        if(!token) {
            const error = new Error("TOKEN_ERROR")
            error.statusCode = 400
            error.code = "TOKEN_ERROR"
            throw error
        }

        //토큰 검증
        const {id} = jwt.verify(token, process.env.TYPEORM_JWT);

        //스레드 내용
        const { content } = req.body;

        //스레드 내용이 없을 때
        if(content.length === 0) {
            const error = new Error("CONTENT_TOO_SHORT")
            error.statusCode = 400
            error.code = "CONTENT_TOO_SHORT"
            throw error
        }

        //사용자 닉네임 가져오기 - 굳이 필요 없을 듯
        //스레드 저장
        const newPost = await myDataSource.query(`
        INSERT INTO threads (
            user_id,
            content
        ) VALUES (
            '${id}',
            '${content}'
        );
        `)

        console.log("new Post ID : ", newPost.id)
        console.log("new Post Content : ", newPost.content)

        //스레드 내용 출력
        return res.status(200).json({
            "code" : "writingSuccess"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            "error" : error
        });
    }
}

module.exports = {
    readThreads,
    createThreads
}