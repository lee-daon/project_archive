import pLimit from "p-limit";
import { getFromQueue } from "../../common/utils/redisClient.js";
import { QUEUE_NAMES, API_SETTINGS } from "../../common/config/settings.js";
import { downloadAndHostImage } from "./imageService.js";
import {
  updateMainImageUrl,
  updateDescriptionImageUrl,
  updateOptionImageUrl,
} from "./updateImageUrl.js";

const CONCURRENCY = API_SETTINGS.CONCURRENCY_LIMITS.IMAGE_DOWNLOAD_WORKER; // flow.md 기반 동시 처리 제한
const QUEUE_NAME = QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE;
const limit = pLimit(CONCURRENCY);

/**
 * 큐에서 받은 개별 이미지 작업을 처리합니다.
 * @param {object} task - 이미지 처리 작업 정보
 */
async function processImage(task) {
  const { imageurl, imageType } = task;

  if (!imageurl) {
    console.warn("URL이 없는 작업을 건너뜁니다:", task);
    return;
  }

  try {
    const newUrl = await downloadAndHostImage(imageurl);
    if (!newUrl) {
      console.error("이미지 호스팅 실패, URL 업데이트 안함.", {
        imageUrl: imageurl,
        task,
      });
      return;
    }

    switch (imageType) {
      case "main":
        await updateMainImageUrl({ ...task, newUrl });
        break;
      case "description":
        await updateDescriptionImageUrl({ ...task, newUrl });
        break;
      case "option":
        await updateOptionImageUrl({ ...task, newUrl });
        break;
      default:
        console.warn(`알 수 없는 이미지 타입: ${imageType}`, { task });
        return;
    }
    console.log("이미지 호스팅 완료", newUrl);
  } catch (error) {
    console.error("작업 처리 중 오류 발생:", {
      imageUrl: imageurl,
      task,
      error,
    });
  }
}

/**
 * 워커 메인 함수
 */
async function startWorker() {
  console.log(`이미지 다운로더 워커 시작. 동시성: ${CONCURRENCY}`);
  console.log(`대기 중인 큐: ${QUEUE_NAME}`);

  while (true) {
    try {
      const task = await getFromQueue(QUEUE_NAME, 0);
      if (task) {
        limit(() => processImage(task));
      }
    } catch (error) {
      console.error("Redis 큐 읽기 오류:", error);
      // 잠시 대기 후 재시도
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

startWorker();
