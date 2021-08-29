const express = require('express');
const request = require('request');
const app = express();

const port = 3001;
const serverURL = 'http://ec2-3-35-14-61.ap-northeast-2.compute.amazonaws.com:3000';

app.get('/', (req, res) =>{
    res.send('hello');
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