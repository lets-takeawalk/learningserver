const request = require('request');
var setdatas = require('./download_data');

module.exports = () =>{
    return {
        atstart_request:function(mainServerURL){ // 메인서버로 리퀘스트 생성 ---- (1) 임시학습모델버전을 생성, 최초에 한번만 사용됨.
            request.post(mainServerURL+'/learningServer/createTempModel_ver', function(err, response, body){
                console.log(JSON.parse(body).code+" from creatTempModel_ver, start learning sequence");
            });
        },
        getimgs_request:function(mainServerURL, onLearning, STORAGEBUCKET, bucket){// 메인서버로 리퀘스트 생성 ---- (1) 필요한 데이터를 얻어와야함.
            request(mainServerURL+'/learningServer/imgdata', async function(err, response, body){
                var tmp = await JSON.parse(body).buildingInfo;
                setdatas().mkInfoJson(tmp); // buildingInfo를 json으로 만듦. 사실 필요없
                setdatas().imags(tmp, STORAGEBUCKET, bucket);// 학습대상 파일의 스토리지 저장 URL로 로컬 환경에 다운로드 받는 함수
                setdatas().appendLabels(tmp);// 라벨 폴더에 한글 라벨과 영어 라벨을 추가하는 함수

                for(var i= 0;i<tmp.length;i++)
                    onLearning.push(tmp[i].id);
                console.log('learning target building object IDs : '+onLearning);
            });
        },
        afterLearning_request:function(mainServerURL, version){// 학습이 끝났음을 알림 ---- (3), 추가로 학습할 데이터가 있는지 확인 메인서버에 요청.
            let option ={
                url: mainServerURL+'/learningServer/isNewImg',
                method: 'POST',
                body:{// 최신 버전 정보를 담는다.
                    modelVersion: version
                },
                json:true
            };
            request.post(option,function(err, response, body){
                if(body.code===201){
                    console.log(body.code+' from isNewImg, there is not any data. stop learning');
                    console.log("=============end=============")
                }else if(body.code ===200)
                    console.log(body.code+' from inNewImg, there is new data.');
            });
        }
    }
}