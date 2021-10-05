const express = require('express');
const request = require('request');
const spawn = require('child_process').spawn; // 자식 프로세스 생성
const app = express();
running = false;

const port = 3001;
// 개발과 배포 URL이 다름.
const serverURL = 'http://ec2-3-35-14-61.ap-northeast-2.compute.amazonaws.com:3000';
const testserverURL = 'http://localhost:3000'

// 초기 구동 상황: 메인서버에서 학습서버로 모델 학습을 시킴.
// - 메인서버의 addObject/imgInfo에서 학습서버로 모델 학습 시작 트리거 실행
// - 메인서버에서 학습서버로 학습 시작 리퀘스트를 보냄
// - 학습서버에서 메인서버에 관련 데이터를 요구 (-> main/learingsever/imgdata) ---- (1)
// - 학습서버에서 받은 정보를 바탕으로 학습시작 ---- (2)
// - 학습이 끝난 뒤에 메인 서버에 학습 종료를 알림(mainserver/isNewimg) ---- (3)
// - mainserver/learningserver/isNewImg에서 새로운 학습 대상이 존재할 경우 다시 아래 API(get.'/')호출(데이터 전송 ㄴㄴ)

var onLearning = [];

app.get('/startLearning', async (req, res) =>{
    // 메인서버로 리퀘스트 생성 ---- (1) 임시학습모델버전을 생성, 최초에 한번만 사용됨.
    console.log("============start============")
    request.post(testserverURL+'/learningServer/createTempModel_ver', function(err, response, body){
        console.log(JSON.parse(body).code+" from creatTempModel_ver, start learning sequence");
    });
    // 메인서버로 리퀘스트 생성 ---- (1) 필요한 데이터를 얻어와야함.
    request(testserverURL+'/learningServer/imgdata',function(err, response, body){
        var tmp = JSON.parse(body).buildingInfo;
        for(var i= 0;i<tmp.length;i++)
            onLearning.push(tmp[i].id);
        console.log('learning target building object IDs : '+onLearning);
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
            // 어떤 빌딩 객체의 학습이 끝났는지 로그
            console.log(result.toString()); 
            console.log('학습 종료 building id : '+onLearning);
            onLearning = [];

            // 학습이 끝났음을 알림 ---- (3), 추가로 학습할 데이터가 있는지 확인 메인서버에 요청.
            let option ={
                url: testserverURL+'/learningServer/isNewImg',
                method: 'POST',
                body:{// result에 새로운 모델이 저장된 URL이 나온다. 그것을 아래에 넣어줌.
                    modelURL: 'https://medium.com/harrythegreat/node-js%EC%97%90%EC%84%9C-request-js-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0-28744c52f68d'
                },
                json:true
            };
            request.post(option,function(err, response, body){
                if(body.code===201){
                    console.log(body.code+' from isNewImg, there is not any data. stop learning');
                    console.log("=============end=============")
                }else if(body.code ===200){
                    console.log(body.code+' from inNewImg, there is new data.');
                }
                running = false;
            });
        });
        result.stderr.on('data', function(data) { console.log(data.toString()); });
    }
});

// 서버 구동
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
