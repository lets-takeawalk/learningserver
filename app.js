const express = require('express');
const request = require('request');
const spawn = require('child_process').spawn; // 자식 프로세스 생성
const app = express();
running = false;

const port = 3001;
const serverURL = 'http://ec2-3-35-14-61.ap-northeast-2.compute.amazonaws.com:3000';

// 초기 구동 상황: 메인서버에서 학습서버로 모델 학습을 시킴.
// - 메인서버의 addObject/imgInfo에서 학습서버로 모델 학습 시작 트리거 실행(미구현)
// - 메인서버에서 학습서버로 학습 시작 리퀘스트를 보냄
// - 학습서버에서 메인서버에 관련 데이터를 요구 (-> main/learingsever/imgdata) ---- (1)
// - 학습서버에서 받은 정보를 바탕으로 학습시작 ---- (2)
// - 학습이 끝난 뒤에 메인 서버에 학습 종료를 알림(mainserver/isNewimg) ---- (3)
// - mainserver/learningserver/isNewImg에서 새로운 학습 대상이 존재할 경우 다시 아래 API(get.'/')호출(데이터 전송 ㄴㄴ)


app.get('/', (req, res) =>{
    // 메인서버로 리퀘스트 생성 ---- (1) 필요한 데이터를 얻어와야함.
    request(serverURL+'/learningServer/imgdata',function(err, response, body){
        console.log(JSON.parse(body));
    });

    // 학습 시작 ---- (2)
    // "0,1,2 ...", "1000"
    // python파일 이름 augmentation.py
    if (running) 
        res.json({
            code: 201,
            content : 'server is on running'
        });
    else{
        res.json({
            code: 200,
            content: 'server start running'
        })
        running = true

        // 모델 학습 구문 (필요 파라메터는 학습서버2메인서버의 리퀘스트를 통해 얻어온다.)
        const result = spawn('python', ['./augmentation/test.py','test1','test2']);
        result.stdout.on('data', function(result){ 
            console.log(result.toString()); 
            // 학습이 끝났음을 알림 ---- (3)
            request(serverURL+'/learningServer/isNewImg',function(err, response, body){
                console.log(JSON.parse(body));
            });
            running = false
        });
        console.log('정덕수');
        result.stderr.on('data', function(data) { console.log(data.toString()); });
    }
});

app.get('/r', (req, res) =>{
    request(serverURL+'/learningServer/isNewImg',function(err, response, body){
        res.send(response);
    });
});

// 서버 구동
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})