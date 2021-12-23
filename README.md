# 개요
2021년도 건국대학교 컴퓨터공학부 졸업 프로젝트
건국대학교 SW경진대회 장려상 수상작 'lets take a walk'의 learningserver repo

## 개발 환경
node(express)
서버 포트 3001
메인서버 및 학습서버 URL은 config/config.js 생성
파이어베이스 연동은 config/에 파일 생성
--> 위 두 파일에 의존성 존재

## 프로그램 시작코드
- npm test: 메인 서버 및 학습서버가 로컬 주소로 시작
- npm start: 메인 서버 및 학습서버가 실제 구현 환경에서 시작

## 역할
1) 객체인식모델 학습
2) 메인서버와 연동
3) 파이어베이스(이미지 다운로드 및 신규 모델 업로드) 연동

### 1) 객체인식모델 학습
#### LearningModel/
해당 폴더 내의 makeTFlite.py를 실행하면서 학습이 시작됨.(시연용 py)
학습된 결과를 modules/upload.js 에서 업로드.

### 2) 메인서버와 연동
#### modules/request.js, download_data.js 일부
메인서버와의 상호작용을 request로 구현하였고, 메인서버에서의 데이터를 다운받는다.
건물 객체 정보를 learningModel/label/.txt로 저장한다.

### 3) 파이어베이스 연동
#### modules/download_data.js 일부, upload.js
건물 객체 이미지를 다운로드받고, 완성된 모델을 업로드한다.
