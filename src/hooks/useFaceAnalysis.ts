import { FaceDetection } from "@mediapipe/face_detection";

let faceDetectedFrames = 0;
let centeredFrames = 0;
let stableFrames = 0;
let totalFrames = 0;

export const analyzeFrame = async (image: HTMLCanvasElement) => {
  const faceDetection = new FaceDetection({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
  });

  faceDetection.setOptions({
    model: "short",
    minDetectionConfidence: 0.5,
  });

  faceDetection.onResults((results) => {
    totalFrames++;

    if (results.detections.length > 0) {
      faceDetectedFrames++;

      const box = results.detections[0].boundingBox;

      const centerX = box.xCenter;
      const centerY = box.yCenter;

      if (
        centerX > 0.4 &&
        centerX < 0.6 &&
        centerY > 0.3 &&
        centerY < 0.7
      ) {
        centeredFrames++;
      }

      stableFrames++;
    }
  });

  await faceDetection.send({ image });
};
