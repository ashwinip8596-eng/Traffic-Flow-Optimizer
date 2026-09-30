import cv2
import csv
import os
from ultralytics import YOLO

# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "models", "ambulance.pt")
INPUT_VIDEO = os.path.join(BASE_DIR, "videos", "traffic.mp4")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "output", "ambulance_traffic.mp4")
OUTPUT_CSV = os.path.join(BASE_DIR, "output", "ambulance_data.csv")

# ============================================================
# LOAD MODEL
# ============================================================

print("Loading ambulance detection model...")

model = YOLO(MODEL_PATH)

print("Model loaded successfully.")

# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(INPUT_VIDEO)

if not cap.isOpened():
    print("ERROR: Could not open input video.")
    exit()

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

duration = total_frames / fps if fps > 0 else 0

print()
print("======================================")
print("AMBULANCE DETECTION")
print("======================================")
print(f"Resolution : {width} x {height}")
print(f"FPS        : {fps:.2f}")
print(f"Frames     : {total_frames}")
print(f"Duration   : {duration:.2f}s")
print(f"Input      : {INPUT_VIDEO}")
print(f"Output     : {OUTPUT_VIDEO}")
print("======================================")

# ============================================================
# OUTPUT VIDEO
# ============================================================

os.makedirs(os.path.dirname(OUTPUT_VIDEO), exist_ok=True)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)

# ============================================================
# CSV FILE
# ============================================================

csv_file = open(OUTPUT_CSV, "w", newline="")

csv_writer = csv.writer(csv_file)

csv_writer.writerow([
    "frame",
    "ambulance_detected",
    "ambulance_count",
    "direction",
    "priority"
])

# ============================================================
# AMBULANCE TRACKING VARIABLES
# ============================================================

first_center = None
last_center = None

first_detection_frame = None
last_detection_frame = None

ambulance_detected_ever = False

# Minimum movement required to classify direction
MOVEMENT_THRESHOLD = 10

# ============================================================
# PROCESS VIDEO
# ============================================================

frame_number = 0

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # --------------------------------------------------------
    # YOLO TRACKING
    # --------------------------------------------------------

    results = model.track(
        frame,
        persist=True,
        conf=0.40,
        verbose=False
    )

    ambulance_count = 0

    current_direction = "NONE"

    current_center = None

    # --------------------------------------------------------
    # PROCESS DETECTIONS
    # --------------------------------------------------------

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(box.cls[0])

            class_name = model.names[class_id]

            # Only process ambulance
            if class_name.lower() != "ambulance":
                continue

            ambulance_count += 1

            ambulance_detected_ever = True

            # ------------------------------------------------
            # BOUNDING BOX
            # ------------------------------------------------

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Center of ambulance
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            current_center = (center_x, center_y)

            # ------------------------------------------------
            # STORE FIRST AND LAST POSITION
            # ------------------------------------------------

            if first_center is None:

                first_center = current_center
                first_detection_frame = frame_number

            last_center = current_center
            last_detection_frame = frame_number

            # ------------------------------------------------
            # DRAW BOUNDING BOX
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                3
            )

            # ------------------------------------------------
            # DRAW CENTER
            # ------------------------------------------------

            cv2.circle(
                frame,
                (center_x, center_y),
                7,
                (0, 0, 255),
                -1
            )

            # ------------------------------------------------
            # LABEL
            # ------------------------------------------------

            cv2.putText(
                frame,
                "AMBULANCE",
                (x1, max(y1 - 10, 30)),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

    # ========================================================
    # CALCULATE CURRENT DIRECTION
    # ========================================================

    if (
        first_center is not None
        and last_center is not None
        and first_center != last_center
    ):

        dx = last_center[0] - first_center[0]
        dy = last_center[1] - first_center[1]

        # ----------------------------------------------------
        # Horizontal movement is dominant
        # ----------------------------------------------------

        if abs(dx) > abs(dy):

            if abs(dx) >= MOVEMENT_THRESHOLD:

                if dx < 0:
                    current_direction = "LEFT"

                else:
                    current_direction = "RIGHT"

        # ----------------------------------------------------
        # Vertical movement
        # ----------------------------------------------------

        else:

            if abs(dy) >= MOVEMENT_THRESHOLD:

                current_direction = "STRAIGHT"

    # ========================================================
    # PRIORITY
    # ========================================================

    if ambulance_count > 0:

        priority = "EMERGENCY"

    else:

        priority = "NORMAL"

    # ========================================================
    # DISPLAY STATUS
    # ========================================================

    status_text = (
        f"Ambulance: {ambulance_count} | "
        f"Priority: {priority}"
    )

    cv2.putText(
        frame,
        status_text,
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        (0, 255, 255),
        3
    )

    if current_direction != "NONE":

        direction_text = f"Direction: {current_direction}"

        cv2.putText(
            frame,
            direction_text,
            (30, 95),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.1,
            (0, 255, 255),
            3
        )

    # ========================================================
    # SAVE CSV
    # ========================================================

    csv_writer.writerow([
        frame_number,
        "YES" if ambulance_count > 0 else "NO",
        ambulance_count,
        current_direction,
        priority
    ])

    # ========================================================
    # WRITE VIDEO
    # ========================================================

    out.write(frame)

    # ========================================================
    # CONSOLE PROGRESS
    # ========================================================

    if frame_number % 30 == 0:

        print(
            f"Frame {frame_number:4d} | "
            f"Ambulance: {ambulance_count} | "
            f"Direction: {current_direction} | "
            f"Priority: {priority}"
        )

# ============================================================
# CLOSE FILES
# ============================================================

cap.release()
out.release()
csv_file.close()

# ============================================================
# FINAL DIRECTION
# ============================================================

final_direction = "NONE"

if first_center is not None and last_center is not None:

    total_dx = last_center[0] - first_center[0]
    total_dy = last_center[1] - first_center[1]

    # --------------------------------------------------------
    # Horizontal movement
    # --------------------------------------------------------

    if abs(total_dx) > abs(total_dy):

        if abs(total_dx) >= MOVEMENT_THRESHOLD:

            if total_dx < 0:
                final_direction = "LEFT"

            else:
                final_direction = "RIGHT"

    # --------------------------------------------------------
    # Vertical movement
    # --------------------------------------------------------

    else:

        if abs(total_dy) >= MOVEMENT_THRESHOLD:

            final_direction = "STRAIGHT"

# ============================================================
# FINAL RESULT
# ============================================================

print()
print("======================================")
print("AMBULANCE DETECTION COMPLETED")
print("======================================")

if ambulance_detected_ever:

    print("Ambulance detected : YES")
    print(f"Ambulance direction: {final_direction}")
    print("Priority            : EMERGENCY")

else:

    print("Ambulance detected : NO")
    print("Ambulance direction: NONE")
    print("Priority            : NORMAL")

print("--------------------------------------")
print(f"First position     : {first_center}")
print(f"Last position      : {last_center}")
print(f"CSV                : {OUTPUT_CSV}")
print(f"VIDEO              : {OUTPUT_VIDEO}")
print("======================================")