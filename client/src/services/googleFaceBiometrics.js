/**
 * Google MediaPipe AI Face Recognition & Biometric Landmarking Service
 * 
 * Replaces manual matrix pixel grids with Google's official, free, open-source 
 * MediaPipe Face Landmarker AI model running in-browser via WebAssembly / WebGL.
 */

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance = null;
let isInitializing = false;
let initPromise = null;

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * Initialize Google MediaPipe Face Landmarker instance (singleton)
 */
export async function getGoogleFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[Google Face AI] Loading MediaPipe Vision Wasm runtime...');
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);

      console.log('[Google Face AI] Initializing Face Landmarker with official model...');
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      console.log('[Google Face AI] MediaPipe Face Landmarker initialized successfully.');
      return faceLandmarkerInstance;
    } catch (err) {
      console.warn('[Google Face AI] GPU initialization failed or CDN blocked, attempting CPU fallback:', err);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: 'CPU'
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.4
        });
        return faceLandmarkerInstance;
      } catch (cpuErr) {
        console.error('[Google Face AI] Could not load MediaPipe models:', cpuErr);
        initPromise = null;
        return null;
      }
    }
  })();

  return initPromise;
}

/**
 * Key Google MediaPipe Face Landmark Indices (from canonical 478-point topology)
 */
export const GOOGLE_LANDMARKS = {
  NOSE_TIP: 1,
  NOSE_BOTTOM: 2,
  NOSE_BRIDGE: 168,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  LEFT_IRIS_CENTER: 468,
  RIGHT_IRIS_CENTER: 473,
  MOUTH_LEFT_CORNER: 61,
  MOUTH_RIGHT_CORNER: 291,
  MOUTH_TOP_LIP: 0,
  MOUTH_BOTTOM_LIP: 17,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454
};

/**
 * Compute invariant 128-dimensional biometric descriptor vector from 
 * Google MediaPipe 478 3D facial landmarks.
 */
export function extractGoogleBiometricVector(landmarks, blendshapes = null) {
  if (!landmarks || landmarks.length < 400) {
    return null;
  }

  // 1. Anchor centers: Left and Right Iris / Eye centers
  const leftEye = landmarks[GOOGLE_LANDMARKS.LEFT_IRIS_CENTER] || landmarks[GOOGLE_LANDMARKS.LEFT_EYE_INNER];
  const rightEye = landmarks[GOOGLE_LANDMARKS.RIGHT_IRIS_CENTER] || landmarks[GOOGLE_LANDMARKS.RIGHT_EYE_INNER];
  const nose = landmarks[GOOGLE_LANDMARKS.NOSE_TIP] || landmarks[4];

  // Inter-ocular distance (scale baseline)
  const eyeDx = rightEye.x - leftEye.x;
  const eyeDy = rightEye.y - leftEye.y;
  const eyeDz = (rightEye.z || 0) - (leftEye.z || 0);
  const interOcularDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy + eyeDz * eyeDz) || 0.1;

  // Origin point: midpoint between eyes
  const originX = (leftEye.x + rightEye.x) / 2;
  const originY = (leftEye.y + rightEye.y) / 2;
  const originZ = ((leftEye.z || 0) + (rightEye.z || 0)) / 2;

  // 2. Select 32 key facial anatomical landmark points
  const keyIndices = [
    1, 2, 4, 10, 17, 33, 61, 78, 105, 107, 133, 145, 152, 159, 168, 197,
    234, 263, 291, 308, 336, 338, 362, 374, 386, 454, 468, 473, 19, 94, 324, 411
  ];

  const descriptor = [];

  // A. Normalized 3D Coordinates relative to eye-center origin (32 points * 2 [x, y] = 64 dimensions)
  for (const idx of keyIndices) {
    const pt = landmarks[idx] || landmarks[0];
    const relX = (pt.x - originX) / interOcularDist;
    const relY = (pt.y - originY) / interOcularDist;
    descriptor.push(relX, relY);
  }

  // Helper Euclidean distance normalized by interOcularDist
  const dist = (i1, i2) => {
    const p1 = landmarks[i1] || landmarks[0];
    const p2 = landmarks[i2] || landmarks[0];
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz) / interOcularDist;
  };

  // B. 32 Geometrically Invariant Topological Distance Ratios (32 dimensions)
  const distancePairs = [
    [1, 152],   // Nose to Chin
    [10, 1],    // Forehead to Nose
    [10, 152],  // Forehead to Chin (Total facial height)
    [33, 133],  // Left eye width
    [263, 362], // Right eye width
    [159, 145], // Left eye aperture height
    [386, 374], // Right eye aperture height
    [61, 291],  // Mouth width
    [0, 17],    // Mouth height
    [1, 61],    // Nose to left mouth corner
    [1, 291],   // Nose to right mouth corner
    [152, 61],  // Chin to left mouth corner
    [152, 291], // Chin to right mouth corner
    [234, 454], // Cheekbone span (bizygomatic width)
    [168, 1],   // Bridge to tip of nose
    [105, 107], // Left eyebrow width
    [336, 338], // Right eyebrow width
    [107, 336], // Inter-eyebrow gap
    [33, 61],   // Left eye to left mouth
    [263, 291], // Right eye to right mouth
    [468, 1],   // Left pupil to nose
    [473, 1],   // Right pupil to nose
    [468, 152], // Left pupil to chin
    [473, 152], // Right pupil to chin
    [78, 308],  // Lip inner corner width
    [94, 324],  // Mid-cheek distance
    [19, 152],  // Philtrum to chin
    [4, 168],   // Subnasale to glabella
    [10, 468],  // Forehead to left pupil
    [10, 473],  // Forehead to right pupil
    [234, 152], // Left jaw to chin
    [454, 152]  // Right jaw to chin
  ];

  for (const [a, b] of distancePairs) {
    descriptor.push(dist(a, b));
  }

  // C. 32 Normalized Facial Structural Features & Blendshape Coefficients (32 dimensions)
  // Total dimensions: 64 + 32 + 32 = 128
  const eyeAspectLeft = (dist(159, 145) + 0.001) / (dist(33, 133) + 0.001);
  const eyeAspectRight = (dist(386, 374) + 0.001) / (dist(263, 362) + 0.001);
  const faceAspect = dist(10, 152) / (dist(234, 454) + 0.001);
  const noseMouthRatio = dist(1, 0) / (dist(0, 17) + 0.001);
  const jawTaperRatio = dist(234, 454) / (dist(61, 291) + 0.001);

  descriptor.push(
    eyeAspectLeft, eyeAspectRight, faceAspect, noseMouthRatio, jawTaperRatio,
    dist(1, 10) / (dist(1, 152) + 0.001),
    dist(468, 473) / (dist(234, 454) + 0.001),
    dist(61, 291) / (dist(468, 473) + 0.001)
  );

  // If MediaPipe blendshapes available (52 standard facial expressions)
  if (blendshapes && Array.isArray(blendshapes.categories)) {
    const catMap = {};
    for (const c of blendshapes.categories) {
      catMap[c.categoryName] = c.score || 0;
    }
    const bsNames = [
      'eyeBlinkLeft', 'eyeBlinkRight', 'jawOpen', 'mouthSmileLeft', 'mouthSmileRight',
      'browDownLeft', 'browDownRight', 'browInnerUp', 'eyeSquintLeft', 'eyeSquintRight',
      'mouthPucker', 'mouthStretchLeft', 'mouthStretchRight', 'noseSneerLeft', 'noseSneerRight',
      'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'mouthFunnel', 'mouthClose',
      'browOuterUpLeft', 'browOuterUpRight', 'eyeWideLeft', 'eyeWideRight'
    ];
    for (const name of bsNames) {
      descriptor.push(catMap[name] || 0);
    }
  } else {
    // Fill remaining dimensions with additional normalized geometric angles/ratios
    for (let i = 0; i < 24; i++) {
      const idxA = keyIndices[i % keyIndices.length];
      const idxB = keyIndices[(i + 5) % keyIndices.length];
      descriptor.push(dist(idxA, idxB));
    }
  }

  // Ensure exactly 128 dimensions
  const final128 = descriptor.slice(0, 128);
  while (final128.length < 128) final128.push(0);

  // L2 Unit-Sphere Normalization
  let sumSq = 0;
  for (const v of final128) sumSq += v * v;
  const norm = Math.sqrt(sumSq) || 1;
  return final128.map(v => Number((v / norm).toFixed(6)));
}

/**
 * Draw Google MediaPipe Face Mesh on 2D Canvas
 */
export function drawGoogleFaceMesh(ctx, landmarks, width, height) {
  if (!ctx || !landmarks || landmarks.length === 0) return;

  ctx.save();

  // Draw face contour connections
  const contourIndices = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
  ];

  ctx.beginPath();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < contourIndices.length; i++) {
    const pt = landmarks[contourIndices[i]];
    if (!pt) continue;
    const x = pt.x * width;
    const y = pt.y * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw eye reticles
  const drawLoop = (indices, color) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < indices.length; i++) {
      const pt = landmarks[indices[i]];
      if (!pt) continue;
      const x = pt.x * width;
      const y = pt.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };

  // Left Eye Loop
  drawLoop([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], '#10b981');
  // Right Eye Loop
  drawLoop([263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466], '#10b981');

  // Draw Lips Outer Loop
  drawLoop([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185], '#00f0ff88');

  // Draw pupil points
  const leftPupil = landmarks[GOOGLE_LANDMARKS.LEFT_IRIS_CENTER];
  const rightPupil = landmarks[GOOGLE_LANDMARKS.RIGHT_IRIS_CENTER];
  if (leftPupil) {
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(leftPupil.x * width, leftPupil.y * height, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
  if (rightPupil) {
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(rightPupil.x * width, rightPupil.y * height, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}
