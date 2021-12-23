const fs =require('fs');
module.exports = () =>{
    return{
        setDir_stat: function(){
            // 초기 디렉토리 환경 설정 함수
            if(!fs.existsSync('./LearningModel/image/'))
                fs.mkdirSync('./LearningModel/image/');
            if(!fs.existsSync('./LearningModel/label/')){
                fs.mkdirSync('./LearningModel/label/');
                fs.writeFileSync('./LearningModel/label/kor.txt','');
                fs.writeFileSync('./LearningModel/label/eng.txt','');
            }
            if(!fs.existsSync('./LearningModel/tflite_result/'))
                fs.mkdirSync('./LearningModel/tflite_result/');

        },
        mkInfoJson: function(info){
            // 메인서버에서 넘어온 buildingInfo데이터를 json파일로 저장하는 함수
            fs.writeFileSync('./LearningModel/buildingInfo.json',JSON.stringify(info),(err)=>{
                if(err === null)
                    console.log('buildingInfo.json 파일 생성');
                else
                    console.log('buildingInfo.json 파일 생성 에러');
            });
        },
        imags: function(info, STORAGEBUCKET, bucket){
            // 학습대상 파일의 스토리지 저장 URL로 로컬 환경에 다운로드 받는 함수
            json_par = info;
            
            for (var i in json_par){
                var dir = './LearningModel/image/'+ String(parseInt(json_par[i].id)-1) // './LearningModel/image/0'
                if(!fs.existsSync(dir))// 폴더 생성
                    try {
                        fs.mkdirSync(dir);    
                    } catch (error) {
                        console.log(error);
                    }
                    
        
                for (var j in json_par[i].imgInfos){
                    if (typeof(json_par[i].imgInfos[j].imgURL) !== 'undefined' && json_par[i].imgInfos[j].imgURL)
                        file_name = json_par[i].imgInfos[j].imgURL.split(STORAGEBUCKET+'/o/')[1].split('?')[0]
        
                    // 이미지 다운
                    var file = bucket.file(file_name);
                    file.download({destination: dir +'/'+ file_name});
                    // 좌표 txt파일 생성
                    fs.writeFileSync(dir+'/'+file_name.substr(0,file_name.length - 3)+'txt', json_par[i].id+' '+json_par[i].imgInfos[j].x_t+' '+json_par[i].imgInfos[j].y_t+' '+json_par[i].imgInfos[j].x_b+' '+json_par[i].imgInfos[j].y_b);
                }
            }
        },
        appendLabels:function(info){
            // 라벨 폴더에 한글 라벨과 영어 라벨을 추가하는 함수 -> 기존 라벨에 추가로 부착되는 것 !! 주의 !!
            // 알고리즘 //
            // 기본 전제, 메인서버에서 넘어오는 buildingInfo id는 sort되어있다.
            // 중간에 id가 생략된 건물이 존재할 수 있다. 라벨 파일에 건물 명이 순서대로 존재해야한다.
            // buildingInfo의 영어이름과 한글이름은 생략될 수 없다.
            //
            // 이때, 작은 id부터 순서대로 기존 이름에 삽입하면, 전체 건물 라벨의 sort는 유지된다.
            json_par = info;
    
            var kornamearr = fs.readFileSync('./LearningModel/label/kor.txt').toString().split('\n');
            var engnamearr = fs.readFileSync('./LearningModel/label/eng.txt').toString().split('\n');
            var len = kornamearr.length;
            for(var i in json_par){
                if (len < json_par[i].id) {
                    fs.appendFileSync('./LearningModel/label/kor.txt',json_par[i].buildingNameKor+'\n');
                    fs.appendFileSync('./LearningModel/label/eng.txt',json_par[i].buildingNameEng+'\n');
                }else{
                    var khead = kornamearr.slice(0,json_par[i].id-1);
                    var ktail = kornamearr.slice(json_par[i].id-1,len);
                    var ktmp = [...khead, json_par[i].buildingNameKor, ...ktail];
                    var ehead = engnamearr.slice(0,json_par[i].id-1);
                    var etail = engnamearr.slice(json_par[i].id-1, len);
                    var etmp = [...ehead, json_par[i].buildingNameEng, ...etail];
                    fs.writeFileSync('./LearningModel/label/kor.txt','');
                    fs.writeFileSync('./LearningModel/label/eng.txt','');
                    for( var j=0;j<ktmp.length - 1 ;j++){
                        fs.appendFileSync('./LearningModel/label/kor.txt',ktmp[j]+'\n');
                        fs.appendFileSync('./LearningModel/label/eng.txt',etmp[j]+'\n');
                    } 
                    kornamearr=ktmp;
                    engnamearr=etmp;
                    len += 1;
                }
            }
        }
    }
}