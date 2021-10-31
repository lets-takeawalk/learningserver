const express = require('express');
const request = require('request');
const spawn = require('child_process').spawn; // 자식 프로세스 생성

// firebase storage접근용
const admin = require('firebase-admin'); 
const serviceAccount = require('.config/takewalk-9d36a-firebase-adminsdk-yiw3h-213f00f246.json');
const STORAGEBUCKET = 'takewalk-9d36a.appspot.com';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGEBUCKET// firebase storage 버켓 위치
});
const bucket = admin.storage().bucket();

const app = express();
const config = require('./config/config');
running = false;

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

// 초기 구동 상황: 메인서버에서 학습서버로 모델 학습을 시킴.
// - 메인서버의 addObject/imgInfo에서 학습서버로 모델 학습 시작 트리거 실행
// - 메인서버에서 학습서버로 학습 시작 리퀘스트를 보냄
// - 학습서버에서 메인서버에 관련 데이터를 요구 (-> main/learingsever/imgdata) ---- (1)
// - 학습서버에서 받은 정보를 바탕으로 학습시작 ---- (2)
// - 학습이 끝난 뒤에 메인 서버에 학습 종료를 알림(mainserver/isNewimg) ---- (3)
// - mainserver/learningserver/isNewImg에서 새로운 학습 대상이 존재할 경우 다시 아래 API(get.'/')호출(데이터 전송 ㄴㄴ)

// 메인서버에서 넘어온 buildingInfo데이터를 json파일로 저장하는 함수
// 굳이파일을 만들지 않아도 됨 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function mkInfoJson(info){
    var fs = require('fs');
    fs.writeFileSync('./LearningModel/buildingInfo.json',JSON.stringify(info),(err)=>{
        if(err === null)
            console.log('buildingInfo.json 파일 생성');
        else
            console.log('buildingInfo.json 파일 생성 에러');
    });
}

// 학습대상 파일의 스토리지 저장 URL로 로컬 환경에 다운로드 받는 함수
function download_imgs(info){
    json_par = JSON.parse(info);
    var fs = require('fs');
    for (var i in json_par){
        var dir = './LearningModel/image/'+json_par[i].id // './LearningModel/image/0'
        if(!fs.existsSync(dir))// 폴더 생성
            fs.mkdirSync(dir);

        for (var j in json_par[i].imgInfos){
            file_name = json_par[i].imgInfos[j].imgURL.split(STORAGEBUCKET+'/o/')[1].split('?')[0]

            // 이미지 다운
            var file = bucket.file(file_name);
            file.download({destination: dir +'/'+ file_name});
            // 좌표 txt파일 생성
            fs.writeFileSync(dir+'/'+file_name.substr(0,file_name.length - 3)+'txt', json_par[i].id+' '+json_par[i].imgInfos[j].x_t+' '+json_par[i].imgInfos[j].y_t+' '+json_par[i].imgInfos[j].x_b+' '+json_par[i].imgInfos[j].y_b);
        }
    }
};

// 라벨 폴더에 한글 라벨과 영어 라벨을 추가하는 함수 -> 기존 라벨에 추가로 부착되는 것 !! 주의 !!
function appendLabels(info){
    json_par = JSON.parse(info);
    var fs = require('fs');
    for(var i in json_par){
        fs.appendFileSync('./LearningModel/label/kor.txt',json_par[i].buildingNameKor+'\n');
        fs.appendFileSync('./LearningModel/label/eng.txt',json_par[i].buildingNameEng+'\n');
    }
};

// tflite파일과 label파일을 스토리지에 업로드하는 함수.
async function uploade_tfliteAndLabels(){
    var fs = require('fs');
    var files = fs.readdirSync('./LearningModel/tflite_result');
    var file = files.sort()[files.length - 1];
    await bucket.upload('./LearningModel/tflite_result/'+file,{destination:'weight/'+'yolov4-tiny-416.tflite'});
    await bucket.upload('./LearningModel/label/kor.txt',{destination:'labels/'+'label.txt'});
    await bucket.upload('./LearningModel/label/eng.txt',{destination:'labels/'+'coco.txt'});
};

// 학습대상 건물 id를 저장하는 배열
var onLearning = [];

app.get('/startLearning', async (req, res) =>{
    // 메인서버로 리퀘스트 생성 ---- (1) 임시학습모델버전을 생성, 최초에 한번만 사용됨.
    console.log("============start============")
    request.post(mainServerURL+'/learningServer/createTempModel_ver', function(err, response, body){
        console.log(JSON.parse(body).code+" from creatTempModel_ver, start learning sequence");
    });
    // 메인서버로 리퀘스트 생성 ---- (1) 필요한 데이터를 얻어와야함.
    request(mainServerURL+'/learningServer/imgdata', async function(err, response, body){
        var tmp = JSON.parse(body).buildingInfo;
        mkInfoJson(tmp);
        download_imgs(tmp); // ----------------------------------------------------- 이거 작동 확인!!!!!!!!!!!!!!!!!!!!
        appendLabels(tmo); // ----------------------------------------------------- 이거 작동 확인!!!!!!!!!!!!!!!!!!!!

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
        const result = spawn('python', ['./LearningModel/makeTFlite.py','test1','test2']);
        result.stdout.on('data', function(result){ 
            // 어떤 빌딩 객체의 학습이 끝났는지 로그
            console.log(result.toString()); 
            console.log('학습 종료 building id : '+onLearning);
            onLearning = [];

            // 학습이 끝난 가중치 파일과 라벨을 스토리지에 업로드 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            uploade_tfliteAndLabels();
            
            // 학습이 끝났음을 알림 ---- (3), 추가로 학습할 데이터가 있는지 확인 메인서버에 요청.
            let option ={
                url: mainServerURL+'/learningServer/isNewImg',
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

app.get('/', (req, res) =>{
    res.send('learning Server ON!!');
});

// 서버 구동
app.listen(port,() => {
    console.log(`Server listening at `+learningServerURL+", connected mainserver is "+mainServerURL);
});
