const { DataSource } = require('typeorm')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

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
        console.log("Data Source has been initialized!_userService")
    })

const userSignup = async(req, res) => {
    try {
        //user 정보를 frontend로부터 받음.
        const me = req.body;
        
        //console.log로 유저 정보 확인.
        console.log("ME : ", me);

        //DATABASE 정보 저장
        const {nickname, password, email } = me;

        //이메일 정규화 -> 졸라 복잡함 맞는건지 모름
        let regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        if(regex.test(email) == false){
            const error = new Error("DISABLE_EMAIL");
            error.statusCode = 400;
            error.code = "DISABLE_EMAIL"
            throw error
        }


        //email, name, password가 다 입력되지 않은 경우
        if(nickname === undefined || password === undefined || email === undefined){
            const error = new Error("KEY_ERROR")
            error.statusCode = 400
            error.code = "KEY_ERROR"
            throw error
        }

        //비밀번호가 너무 짧을 때
        if(password.length < 10){
            const error = new Error("INVALID_PASSWORD")
            error.statusCode = 400
            error.code = "INVALID_PASSWORD"
            throw error
        }

        //이메일 중복 가입

        //1. 유저가 입력한 이메일이 이미 우리 DB에 있는지 확인
        const existingData = await myDataSource.query(`
         SELECT id, email FROM users WHERE email = '${email}'
        `)

        console.log("user : " , existingData)
        //2. 있으면, 즉 중복이면 아래 if문 실행
        if(existingData.length != 0){
            const error = new Error("alreadyEmail")
            error.statusCode = 400
            error.code = "alreadyEmail"
            throw error
        }

        //비밀번호에 특수문자 없을 때
        const specialKey = /[~!@#$%^&*()_+|{}]/; //특수문자
        if(specialKey.test(password) == false) {
            const error = new Error("passwordNeedSpecial")
            error.statusCode = 400
            error.code = "passwordNeedSpecial"
            throw error
        }

        //비밀번호 암호화
        const saltRounds = 10;
        const hashedPw = await bcrypt.hash(password, saltRounds);

        const userData = await myDataSource.query(`
        INSERT INTO users (
            nickname, 
            password, 
            email
            ) VALUES (
                '${nickname}',
                '${hashedPw}',
                '${email}'
            )
        `)

        console.log("New User : ", userData);

        //FRONT 전달
        return res.status(201).json({
            "code" : "signUpSuccess"
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
}

const userLogin = async(req, res) => {
    try {
        const { email, password } = req.body;
        
        //Email을 가진 사람 있는지 확인
        const userEmail = await myDataSource.query(`
        SELECT id, email, password FROM users WHERE email = '${email}'
       `)

        //Email pw KEY_ERROR 확인
        if(email === undefined || password === undefined){
            const error = new Error("KEY_ERROR")
            error.statusCode = 400
            error.code = "KEY_ERROR"
            throw error
        }

        //if 유저 이메일이 없으면 -> 없는 유저라고 출력
        if(userEmail.length === 0){
            const error = new Error("emptyEmail")
            error.statusCode = 400
            error.code = "emptyEmail"
            throw error
        }
        //없으면 -> 정상 진행

        //찐 비번이랑 암호화 해서 DB에 있는 비번 비교
        const hashPw = await bcrypt.compare(password, userEmail[0].password);

        //if flase라면 -> 없는 비번이라고 출력
        if(!hashPw){
            const error = new Error("passwordError")
            error.statusCode = 400
            error.code = "passwordError"
            throw error
        }
        //같으면 -> 정상 진행

        //payload로 전달할 내용인 해당 유저의 id값
        const userId = userEmail[0].id;

        //payload를 id값으로, .env에 있는 secret key 가져옴
        const token = jwt.sign({"id" : userId }, process.env.TYPEORM_JWT)
        // const token = jwt.sign({id : 'id'}, 'password')

        //로그인 성공 및 토큰 발급 정상인지 확인
        return res.status(200).json({
            "code" : "어렵다",
            "accessToken" : token
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
}

module.exports = {
    "userSignup" : userSignup,
    "userLogin" : userLogin
}