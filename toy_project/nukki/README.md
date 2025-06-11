# 누키 (Nukki) - 이미지 배경 제거 API

간단한 이미지 배경 제거 API 서버입니다. Flask와 rembg 라이브러리를 사용하여 만들어진 작은 프로젝트입니다.

## 이 프로젝트는...

개인적인 학습 목적으로 만든 간단한 배경 제거 API입니다. 완성도가 높지 않을 수 있으니 참고용으로만 봐주세요.

## 실행 예시

**데모 영상**: [https://pub-e396b742f1ae46678c7a5692530400d7.r2.dev/nukki.mp4](https://pub-e396b742f1ae46678c7a5692530400d7.r2.dev/nukki.mp4)

## 프로젝트 구조

```
nukki/
├── code/                    # API 서버 코드
│   ├── app.py              # Flask API 서버
│   ├── test.py             # API 테스트 스크립트
│   ├── requirements.txt    # Python 의존성
│   ├── Dockerfile          # Docker 설정
│   ├── .env.example        # 환경변수 예시
│   └── README.md           # 상세 사용법
└── README.md               # 이 파일
```

## 간단 실행법

1. **코드 디렉토리로 이동**
   ```bash
   cd code
   ```

2. **환경변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 API_TOKEN을 설정해주세요
   ```

3. **의존성 설치**
   ```bash
   pip install -r requirements.txt
   ```

4. **서버 실행**
   ```bash
   python app.py
   ```

## 사용 방법

자세한 사용법은 [`code/README.md`](code/README.md)를 참고해주세요.


## 기능

- 이미지 업로드 시 배경 제거
- 토큰 기반 인증
- Docker 지원
- 비동기 테스트 스크립트 포함
---
