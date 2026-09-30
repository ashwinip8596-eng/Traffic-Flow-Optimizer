from pathlib import Path
import cv2
from ultralytics import YOLO

AI_DIR = Path(__file__).resolve().parent.parent
VIDEO_PATH = AI_DIR / "videos" / "traffic.mp4"

model = YOLO("yolo11s.pt")

cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    print("ERROR: Cannot open video")
    exit()

frame_number = 0
best_detections = 0
best_frame = 0

print("Starting detection test...")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # Test every 30th frame
    if frame_number % 30 != 0:
        continue

    results = model(
        frame,
        conf=0.10,
        imgsz=1280,
        verbose=False
    )

    detections = len(results[0].boxes)

    print(
        f"Frame {frame_number}: "
        f"{detections} detections"
    )

    if detections > best_detections:
        best_detections = detections
        best_frame = frame_number

cap.release()

print("\n==============================")
print("DETECTION TEST")
print("==============================")
print(f"Best detections : {best_detections}")
print(f"Best frame      : {best_frame}")
print("==============================")