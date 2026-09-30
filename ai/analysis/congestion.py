from ultralytics import YOLO
import cv2
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

VIDEO_PATH = Path("videos/traffic.mp4")
OUTPUT_PATH = Path("output/congestion_traffic.mp4")
MODEL_PATH = Path("yolo11s.pt")


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
# CONGESTION THRESHOLDS
# ============================================================
# These are starting values.
# We can tune them after seeing your actual video.

LOW_LIMIT = 8
MEDIUM_LIMIT = 20


# ============================================================
# LOAD YOLO MODEL
# ============================================================

model = YOLO(str(MODEL_PATH))


# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    raise RuntimeError(
        f"Could not open video: {VIDEO_PATH}"
    )


# ============================================================
# VIDEO INFORMATION
# ============================================================

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    fps = 30


print("======================================")
print("TRAFFIC CONGESTION ANALYSIS")
print("======================================")
print(f"Input video : {VIDEO_PATH}")
print(f"Resolution  : {width} x {height}")
print(f"FPS         : {fps}")
print("======================================")


# ============================================================
# OUTPUT VIDEO
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    str(OUTPUT_PATH),
    fourcc,
    fps,
    (width, height)
)


# ============================================================
# DISPLAY WINDOW
# ============================================================

WINDOW_NAME = "Traffic Congestion Analysis"

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)

# This changes ONLY the preview size.
# The original video remains 3840 x 2160.
cv2.resizeWindow(
    WINDOW_NAME,
    1280,
    720
)


# ============================================================
# VARIABLES
# ============================================================

frame_number = 0
max_vehicles = 0

low_frames = 0
medium_frames = 0
high_frames = 0


# ============================================================
# PROCESS VIDEO
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1


    # --------------------------------------------------------
    # YOLO DETECTION
    # --------------------------------------------------------

    results = model.predict(
        frame,
        classes=list(VEHICLE_CLASSES.keys()),
        conf=0.20,
        imgsz=1280,
        verbose=False
    )

    result = results[0]


    # --------------------------------------------------------
    # COUNT VEHICLES
    # --------------------------------------------------------

    car_count = 0
    motorcycle_count = 0
    bus_count = 0
    truck_count = 0


    if result.boxes is not None:

        class_ids = (
            result.boxes.cls
            .int()
            .cpu()
            .tolist()
        )

        for class_id in class_ids:

            if class_id == 2:
                car_count += 1

            elif class_id == 3:
                motorcycle_count += 1

            elif class_id == 5:
                bus_count += 1

            elif class_id == 7:
                truck_count += 1


    total_vehicles = (
        car_count
        + motorcycle_count
        + bus_count
        + truck_count
    )


    # --------------------------------------------------------
    # FIND MAXIMUM
    # --------------------------------------------------------

    if total_vehicles > max_vehicles:
        max_vehicles = total_vehicles


    # --------------------------------------------------------
    # CONGESTION LEVEL
    # --------------------------------------------------------

    if total_vehicles <= LOW_LIMIT:

        congestion = "LOW"
        low_frames += 1

    elif total_vehicles <= MEDIUM_LIMIT:

        congestion = "MEDIUM"
        medium_frames += 1

    else:

        congestion = "HIGH"
        high_frames += 1


    # --------------------------------------------------------
    # DRAW YOLO DETECTION BOXES
    # --------------------------------------------------------

    annotated_frame = result.plot()


    # --------------------------------------------------------
    # DISPLAY TRAFFIC INFORMATION
    # --------------------------------------------------------

    cv2.putText(
        annotated_frame,
        f"Total Vehicles: {total_vehicles}",
        (40, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.4,
        (255, 255, 255),
        4
    )

    cv2.putText(
        annotated_frame,
        f"Congestion: {congestion}",
        (40, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.4,
        (255, 255, 255),
        4
    )

    cv2.putText(
        annotated_frame,
        f"Cars: {car_count}",
        (40, 175),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Motorcycles: {motorcycle_count}",
        (40, 215),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Buses: {bus_count}",
        (40, 255),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Trucks: {truck_count}",
        (40, 295),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Frame: {frame_number}",
        (40, 340),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )


    # --------------------------------------------------------
    # SAVE ORIGINAL FULL-RESOLUTION FRAME
    # --------------------------------------------------------

    out.write(annotated_frame)


    # --------------------------------------------------------
    # FULL-FRAME PREVIEW
    # --------------------------------------------------------
    # The frame is resized ONLY for displaying on your screen.
    # It keeps the original 16:9 aspect ratio.

    display_width = 1280

    display_height = int(
        height * display_width / width
    )

    display_frame = cv2.resize(
        annotated_frame,
        (display_width, display_height),
        interpolation=cv2.INTER_AREA
    )

    cv2.imshow(
        WINDOW_NAME,
        display_frame
    )


    # --------------------------------------------------------
    # TERMINAL PROGRESS
    # --------------------------------------------------------

    if frame_number % 30 == 0:

        print(
            f"Frame {frame_number:4d} | "
            f"Vehicles: {total_vehicles:2d} | "
            f"Congestion: {congestion}"
        )


    # --------------------------------------------------------
    # PRESS Q TO STOP
    # --------------------------------------------------------

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break


# ============================================================
# RELEASE
# ============================================================

cap.release()
out.release()
cv2.destroyAllWindows()


# ============================================================
# FINAL RESULT
# ============================================================

print("\n======================================")
print("CONGESTION ANALYSIS COMPLETED")
print("======================================")

print(
    f"Maximum vehicles in one frame : "
    f"{max_vehicles}"
)

print(
    f"LOW congestion frames          : "
    f"{low_frames}"
)

print(
    f"MEDIUM congestion frames       : "
    f"{medium_frames}"
)

print(
    f"HIGH congestion frames        : "
    f"{high_frames}"
)

print("--------------------------------------")

print(
    f"Output saved : {OUTPUT_PATH}"
)

print("======================================")