from pathlib import Path
import cv2
from ultralytics import YOLO

# Get the AI project folder
AI_DIR = Path(__file__).resolve().parent.parent

# File paths
VIDEO_PATH = AI_DIR / "videos" / "traffic.mp4"
OUTPUT_PATH = AI_DIR / "output" / "vehicles_only.mp4"

# Vehicle classes in COCO
# 2 = car
# 3 = motorcycle
# 5 = bus
# 7 = truck
VEHICLE_CLASSES = [2, 3, 5, 7]

# Load YOLO model
model = YOLO("yolo11s.pt")

# Create output folder
OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

# Open video
cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    raise RuntimeError(
        f"Could not open traffic video: {VIDEO_PATH}"
    )

# Video properties
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    fps = 30

# Output video
fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    str(OUTPUT_PATH),
    fourcc,
    fps,
    (width, height)
)

print("Vehicle-only detection started...")
print(f"Input : {VIDEO_PATH}")
print(f"Output: {OUTPUT_PATH}")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # Detect only vehicles
    results = model(
        frame,
        classes=VEHICLE_CLASSES,
        verbose=False
    )

    # Draw boxes and labels
    annotated_frame = results[0].plot()

    # Save frame
    out.write(annotated_frame)

cap.release()
out.release()

print("\nVehicle-only detection completed!")
print(f"Output saved to: {OUTPUT_PATH}")