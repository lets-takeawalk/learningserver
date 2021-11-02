const fs =require('fs');
module.exports = () =>{
    return{
        uploade_tfliteAndLabels: async function(bucket){
            // tflite파일과 label파일을 스토리지에 업로드하는 함수.
            var files = fs.readdirSync('./LearningModel/tflite_result');
            var file = files.sort()[files.length - 1];
            await bucket.upload('./LearningModel/tflite_result/'+file,{destination:'weight/'+'yolov4-tiny-416.tflite'});
            await bucket.upload('./LearningModel/label/kor.txt',{destination:'labels/'+'label.txt'});
            await bucket.upload('./LearningModel/label/eng.txt',{destination:'labels/'+'coco.txt'});
            return file; // 최신버전정보를 리턴
        }
    }
}