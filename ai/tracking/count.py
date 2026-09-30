from pathlib import Path
import cv2
from ultralytics import YOLO


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

VIDEO_PATH = BASE_DIR / "videos" / "traffic.mp4"
MODEL_PATH = BASE_DIR / "yolo11s.pt"
OUTPUT_PATH = BASE_DIR / "output" / "counted_traffic.mp4"


# ============================================================
# VEHICLE CLASSES
# ============================================================

VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}


# ============================================================
# SETTINGS
# ============================================================

CONFIDENCE = 0.15
IMAGE_SIZE = 1280


# ============================================================
# CHECK FILES
# ============================================================

if not VIDEO_PATH.exists():
    raise FileNotFoundError(
        f"Traffic video not found:\n{VIDEO_PATH}"
    )

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"YOLO model not found:\n{MODEL_PATH}"
    )


# ============================================================
# LOAD YOLO MODEL
# ============================================================

print("Loading YOLO11s model...")

model = YOLO(
    str(MODEL_PATH)
)

print("YOLO11s model loaded successfully.")


# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(
    str(VIDEO_PATH)
)

if not cap.isOpened():
    raise RuntimeError(
        f"Could not open video:\n{VIDEO_PATH}"
    )


# ============================================================
# VIDEO INFORMATION
# ============================================================

width = int(
    cap.get(cv2.CAP_PROP_FRAME_WIDTH)
)

height = int(
    cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
)

fps = cap.get(
    cv2.CAP_PROP_FPS
)

if fps <= 0:
    fps = 30.0

total_frames = int(
    cap.get(cv2.CAP_PROP_FRAME_COUNT)
)


print()
print("======================================")
print("VEHICLE COUNTING")
print("======================================")
print(f"Resolution : {width} x {height}")
print(f"FPS        : {fps:.2f}")
print(f"Frames     : {total_frames}")
print(f"Input      : {VIDEO_PATH}")
print(f"Output     : {OUTPUT_PATH}")
print("======================================")
print()


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# OUTPUT VIDEO
# ============================================================

fourcc = cv2.VideoWriter_fourcc(
    *"mp4v"
)

out = cv2.VideoWriter(
    str(OUTPUT_PATH),
    fourcc,
    fps,
    (width, height)
)

if not out.isOpened():
    raise RuntimeError(
        f"Could not create output video:\n{OUTPUT_PATH}"
    )


# ============================================================
# UNIQUE VEHICLE IDs
# ============================================================

unique_ids = {
    "car": set(),
    "motorcycle": set(),
    "bus": set(),
    "truck": set()
}


# ============================================================
# FRAME NUMBER
# ============================================================

frame_number = 0


# ============================================================
# DISPLAY WINDOW
# ============================================================

WINDOW_NAME = "Vehicle Counting"

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)

cv2.resizeWindow(
    WINDOW_NAME,
    1200,
    675
)


# ============================================================
# PROCESS VIDEO
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1


    # ========================================================
    # YOLO + BYTE TRACK
    # ========================================================

    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        classes=list(VEHICLE_CLASSES.keys()),
        conf=CONFIDENCE,
        imgsz=IMAGE_SIZE,
        verbose=False
    )

    result = results[0]


    # ========================================================
    # CURRENT VEHICLE COUNTS
    # ========================================================

    current_counts = {
        "car": 0,
        "motorcycle": 0,
        "bus": 0,
        "truck": 0
    }


    # ========================================================
    # PROCESS TRACKED VEHICLES
    # ========================================================

    if (
        result.boxes is not None
        and result.boxes.id is not None
    ):

        track_ids = (
            result.boxes.id
            .int()
            .cpu()
            .tolist()
        )

        class_ids = (
            result.boxes.cls
            .int()
            .cpu()
            .tolist()
        )


        # ----------------------------------------------------
        # COUNT CURRENT VEHICLES + UNIQUE VEHICLES
        # ----------------------------------------------------

        for track_id, class_id in zip(
            track_ids,
            class_ids
        ):

            vehicle_type = VEHICLE_CLASSES.get(
                class_id
            )

            if vehicle_type is None:
                continue


            # Current frame count
            current_counts[
                vehicle_type
            ] += 1


            # Unique vehicle ID
            unique_ids[
                vehicle_type
            ].add(track_id)


    # ========================================================
    # UNIQUE COUNTS
    # ========================================================

    unique_cars = len(
        unique_ids["car"]
    )

    unique_motorcycles = len(
        unique_ids["motorcycle"]
    )

    unique_buses = len(
        unique_ids["bus"]
    )

    unique_trucks = len(
        unique_ids["truck"]
    )


    unique_total = (
        unique_cars
        + unique_motorcycles
        + unique_buses
        + unique_trucks
    )


    # ========================================================
    # CURRENT TOTAL
    # ========================================================

    current_total = sum(
        current_counts.values()
    )


    # ========================================================
    # DRAW YOLO + TRACKING INFORMATION
    # ========================================================

    annotated = result.plot()


    # ========================================================
    # DISPLAY INFORMATION
    # ========================================================

    cv2.putText(
        annotated,
        f"Current Vehicles: {current_total}",
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Unique Vehicles: {unique_total}",
        (30, 90),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Cars: {current_counts['car']}",
        (30, 130),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Motorcycles: {current_counts['motorcycle']}",
        (30, 170),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Buses: {current_counts['bus']}",
        (30, 210),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Trucks: {current_counts['truck']}",
        (30, 250),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated,
        f"Frame: {frame_number}",
        (30, 290),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )


    # ========================================================
    # SAVE ORIGINAL RESOLUTION
    # ========================================================

    out.write(
        annotated
    )


    # ========================================================
    # DISPLAY RESIZED VIDEO
    # ========================================================

    display_width = 1200

    display_height = int(
        height
        * display_width
        / width
    )

    display_frame = cv2.resize(
        annotated,
        (
            display_width,
            display_height
        ),
        interpolation=cv2.INTER_AREA
    )

    cv2.imshow(
        WINDOW_NAME,
        display_frame
    )


    # ========================================================
    # TERMINAL PROGRESS
    # ========================================================

    if frame_number % 30 == 0:

        print(
            f"Frame {frame_number:4d} | "
            f"Current: {current_total:2d} | "
            f"Unique: {unique_total:3d}"
        )


    # ========================================================
    # PRESS Q TO STOP
    # ========================================================

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        print("\nStopped by user.")
        break


# ============================================================
# RELEASE RESOURCES
# ============================================================

cap.release()
out.release()
cv2.destroyAllWindows()


# ============================================================
# FINAL RESULT
# ============================================================

print()
print("======================================")
print("FINAL VEHICLE COUNT")
print("======================================")

print(
    f"Unique Cars        : {unique_cars}"
)

print(
    f"Unique Motorcycles : {unique_motorcycles}"
)

print(
    f"Unique Buses       : {unique_buses}"
)

print(
    f"Unique Trucks      : {unique_trucks}"
)

print("--------------------------------------")

print(
    f"TOTAL UNIQUE       : {unique_total}"
)

print("--------------------------------------")

print(
    f"Output Video       : {OUTPUT_PATH}"
)

print("======================================")

print()
print(
    "Vehicle counting completed successfully."
)