from pathlib import Path
import cv2
from ultralytics import YOLO

# Get the AI folder
AI_DIR = Path(__file__).resolve().parent.parent

# File paths
VIDEO_PATH = AI_DIR / "videos" / "traffic.mp4"
OUTPUT_PATH = AI_DIR / "output" / "detected_traffic.mp4"

# Load YOLO model
model = YOLO("yolo11s.pt")

# Check video
if not VIDEO_PATH.exists():
    raise FileNotFoundError(f"Video not found: {VIDEO_PATH}")

# Open video
cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    raise RuntimeError(f"Could not open video: {VIDEO_PATH}")

# Video information
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    fps = 30

# Create output folder
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Create video writer
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(
    str(OUTPUT_PATH),
    fourcc,
    fps,
    (width, height)
)

print("Starting YOLO vehicle detection...")
print(f"Input : {VIDEO_PATH}")
print(f"Output: {OUTPUT_PATH}")

# Process video
while True:
    ret, frame = cap.read()

    if not ret:
        break

    # YOLO detection
    results = model(
    frame,
    classes=[2, 3, 5, 7],
    verbose=False
)

    # Draw detections
    annotated_frame = results[0].plot()

    # Save frame
    out.write(annotated_frame)

# Release resources
cap.release()
out.release()

print("\nDetection completed successfully!")
print(f"Output saved to: {OUTPUT_PATH}")