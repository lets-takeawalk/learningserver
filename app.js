const express = require('express');
const spawn = require('child_process').spawn; // 자식 프로세스 생성

var upload_weight = require('./modules/upload');
var requests = require('./modules/requests');
var setdatas = require('./modules/download_data');
setdatas().setDir_stat();

const app = express();
const config = require('./config/config');

let mainServerURL = '';
let learningServerURL = '';
const port =3001;
if(process.env.NODE_ENV==='dev'){
    mainServerURL = config.dev.mainserverURL;
    learningServerURL = config.dev.learningserverURL;
}else if(process.env.NODE_ENV==='prod'){
    mainServerURL = config.production.mainserverURL;
    learningServerURL = config.production.learningserverURL;
}

// firebase storage접근용
const admin = require('firebase-admin'); 
const serviceAccount = require('./config/takewalk-9d36a-firebase-adminsdk-yiw3h-213f00f246.json');
const STORAGEBUCKET = config.STORAGEBUCKET;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGEBUCKET// firebase storage 버켓 위치
});
const bucket = admin.storage().bucket();

// 초기 구동 상황: 메인서버에서 학습서버로 모델 학습을 시킴.
// - 메인서버의 addObject/imgInfo에서 학습서버로 모델 학습 시작 트리거 실행
// - 메인서버에서 학습서버로 학습 시작 리퀘스트를 보냄
// - 학습서버에서 메인서버에 관련 데이터를 요구 (-> main/learingsever/imgdata) ---- (1)
// - 학습서버에서 받은 정보를 바탕으로 학습시작 ---- (2)
// - 학습이 끝난 뒤에 메인 서버에 학습 종료를 알림(mainserver/isNewimg) ---- (3)
// - mainserver/learningserver/isNewImg에서 새로운 학습 대상이 존재할 경우 다시 아래 API(get.'/')호출(데이터 전송 ㄴㄴ)

// 학습대상 건물 id를 저장하는 배열
var onLearning = [];

app.get('/startLearning', (req, res) =>{
    console.log("============start============")
    // 메인서버로 리퀘스트 생성 ---- (1) 임시학습모델버전을 생성, 최초에 한번만 사용됨.
    requests().atstart_request(mainServerURL);

    // 메인서버로 리퀘스트 생성 ---- (1) 필요한 데이터를 얻어와야함.
    requests().getimgs_request(mainServerURL, onLearning, STORAGEBUCKET, bucket);

    // 학습 시작 ---- (2)
    res.json({
        code: 200,
        content: 'server start running'
    })

    // 모델 학습 구문 (필요 파라메터는 학습서버2메인서버의 리퀘스트를 통해 얻어온다.)
    const result = spawn('python', ['./LearningModel/makeTFlite.py'],);
    result.stdout.on('data', async function(result){ 
        // 어떤 빌딩 객체의 학습이 끝났는지 로그 
        console.log(result.toString());
        console.log('학습 종료 building id : '+onLearning);
        onLearning = [];

        // 학습이 끝난 가중치 파일과 라벨을 스토리지에 업로드
        var version = await upload_weight().uploade_tfliteAndLabels(bucket);

        // 학습이 끝났음을 알림 ---- (3), 추가로 학습할 데이터가 있는지 확인 메인서버에 요청.
        requests().afterLearning_request(mainServerURL, version);
    });
    result.stderr.on('data', function(data) { console.log(data.toString()); });

});

app.get('/', (req, res) =>{
    res.send('learning Server ON!!');
});

// 서버 구동
app.listen(port,() => {
    console.log(`Server listening at `+learningServerURL+", connected mainserver is "+mainServerURL);
});
