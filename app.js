const http = require('http')
const express = require('express')
const cors = require('cors')
const userService = require('./src/services/userService.js')
const threadService = require('./src/services/threadService.js')
const dotenv = require('dotenv')

dotenv.config()

//app.js에서 express 함수 사용
const app = express()

//프론트랑 연결하기 위해 필요
app.use(cors());

//express 서버를 json 형식으로 사용
app.use(express.json())


const linkServer = async(req, res) => {
    try{
    return res.status(200).json({"message" : "Welcome to Jeongjin's Server!"})
    } catch (error) {
        console.log(error)
    }
}

//url 입력 안한 기본 서버
app.get('/', linkServer)

//회원가입 API
app.post("/users/signup", userService.userSignup)

//로그인 API
app.post("/users/login", userService.userLogin)

/* -------------------게시글 시작------------------------ */

//게시글 조회
app.get('/posts/read', threadService.readThreads)

// //게시글 작성
app.post('/posts/create', threadService.createThreads)

//서버 시작에 필요
const server = http.createServer(app)

const start = async() => {
    try {
        server.listen(process.env.SERVER_PORT, () => console.log(`Server is listening on 8000`))
    } catch (error) {
        console.log(error)
    }
}

start()