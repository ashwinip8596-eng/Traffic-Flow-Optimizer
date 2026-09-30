from ultralytics import YOLO
import cv2
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

VIDEO_PATH = Path("videos/traffic.mp4")
OUTPUT_PATH = Path("output/density_traffic.mp4")

# Use the better YOLO11s model
MODEL_PATH = "yolo11s.pt"


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
# LOAD MODEL
# ============================================================

model = YOLO(MODEL_PATH)


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
print("TRAFFIC DENSITY ANALYSIS")
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
# FULL-SCREEN / RESIZABLE DISPLAY
# ============================================================

WINDOW_NAME = "Traffic Density Analysis"

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)

# Preview size only.
# Original video is NOT resized for processing.
cv2.resizeWindow(
    WINDOW_NAME,
    1280,
    720
)


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
    # COUNT VEHICLES IN CURRENT FRAME
    # --------------------------------------------------------

    vehicle_count = 0

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


        vehicle_count = (
            car_count
            + motorcycle_count
            + bus_count
            + truck_count
        )


    # --------------------------------------------------------
    # DETERMINE TRAFFIC DENSITY
    # --------------------------------------------------------

    if vehicle_count <= 8:

        density = "LOW"

    elif vehicle_count <= 20:

        density = "MEDIUM"

    else:

        density = "HIGH"


    # --------------------------------------------------------
    # DRAW YOLO BOXES
    # --------------------------------------------------------

    annotated_frame = result.plot()


    # --------------------------------------------------------
    # DISPLAY INFORMATION
    # --------------------------------------------------------

    cv2.putText(
        annotated_frame,
        f"Vehicles: {vehicle_count}",
        (40, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.4,
        (255, 255, 255),
        4
    )

    cv2.putText(
        annotated_frame,
        f"Traffic Density: {density}",
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
    # SAVE FULL-RESOLUTION FRAME
    # --------------------------------------------------------

    out.write(annotated_frame)


    # --------------------------------------------------------
    # DISPLAY FULL VIDEO FITTED TO WINDOW
    # --------------------------------------------------------

    # Calculate scale while maintaining 16:9 aspect ratio
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
    # KEY CONTROLS
    # --------------------------------------------------------

    key = cv2.waitKey(1) & 0xFF

    # Press Q to stop
    if key == ord("q"):
        break


# ============================================================
# RELEASE
# ============================================================

cap.release()
out.release()
cv2.destroyAllWindows()


# ============================================================
# FINAL MESSAGE
# ============================================================

print("\n======================================")
print("TRAFFIC DENSITY ANALYSIS COMPLETED")
print("======================================")
print(f"Output saved : {OUTPUT_PATH}")
print("======================================")