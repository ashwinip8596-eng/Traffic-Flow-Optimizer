from pathlib import Path
import cv2
import csv
from collections import defaultdict
from ultralytics import YOLO


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

VIDEO_PATH = BASE_DIR / "videos" / "traffic.mp4"

OUTPUT_VIDEO = (
    BASE_DIR
    / "output"
    / "traffic_data.mp4"
)

OUTPUT_CSV = (
    BASE_DIR
    / "output"
    / "traffic_data.csv"
)

MODEL_PATH = BASE_DIR / "yolo11s.pt"


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

LOW_LIMIT = 8
MEDIUM_LIMIT = 20


# ============================================================
# CHECK FILES
# ============================================================

if not VIDEO_PATH.exists():

    raise FileNotFoundError(
        f"Video not found:\n{VIDEO_PATH}"
    )


if not MODEL_PATH.exists():

    raise FileNotFoundError(
        f"YOLO model not found:\n{MODEL_PATH}"
    )


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading YOLO11s model...")

model = YOLO(
    str(MODEL_PATH)
)

print("Model loaded.")


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
    cap.get(
        cv2.CAP_PROP_FRAME_WIDTH
    )
)

height = int(
    cap.get(
        cv2.CAP_PROP_FRAME_HEIGHT
    )
)

fps = cap.get(
    cv2.CAP_PROP_FPS
)

if fps <= 0:

    fps = 30.0


total_frames = int(
    cap.get(
        cv2.CAP_PROP_FRAME_COUNT
    )
)


print()
print("======================================")
print("TRAFFIC DATA ANALYSIS")
print("======================================")
print(
    f"Resolution : {width} x {height}"
)
print(
    f"FPS        : {fps:.2f}"
)
print(
    f"Frames     : {total_frames}"
)
print(
    f"Duration   : {total_frames / fps:.2f}s"
)
print("======================================")


# ============================================================
# OUTPUT DIRECTORY
# ============================================================

OUTPUT_VIDEO.parent.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# VIDEO WRITER
# ============================================================

fourcc = cv2.VideoWriter_fourcc(
    *"mp4v"
)

out = cv2.VideoWriter(
    str(OUTPUT_VIDEO),
    fourcc,
    fps,
    (width, height)
)


# ============================================================
# CSV
# ============================================================

csv_file = open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
)

csv_writer = csv.writer(
    csv_file
)


csv_writer.writerow([

    "timestamp",
    "frame",

    "cars",
    "motorcycles",
    "buses",
    "trucks",

    "current_vehicles",

    "unique_cars",
    "unique_motorcycles",
    "unique_buses",
    "unique_trucks",
    "unique_total",

    "left",
    "right",
    "straight",

    "density",
    "congestion"
])


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
# DIRECTION TRACKING
# ============================================================

vehicle_tracks = defaultdict(
    lambda: {

        "entry_zone": None,

        "counted": False
    }
)


left_ids = set()

right_ids = set()

straight_ids = set()


# ============================================================
# ZONE FUNCTION
# ============================================================

def get_zone(x, y):

    x_ratio = x / width

    y_ratio = y / height


    if x_ratio < 0.10:

        return "LEFT"


    if x_ratio > 0.90:

        return "RIGHT"


    if y_ratio < 0.12:

        return "TOP"


    if y_ratio > 0.88:

        return "BOTTOM"


    return None


# ============================================================
# MOVEMENT MAP
# ============================================================

MOVEMENTS = {

    ("TOP", "BOTTOM"): "STRAIGHT",
    ("TOP", "LEFT"): "LEFT",
    ("TOP", "RIGHT"): "RIGHT",

    ("BOTTOM", "TOP"): "STRAIGHT",
    ("BOTTOM", "RIGHT"): "LEFT",
    ("BOTTOM", "LEFT"): "RIGHT",

    ("LEFT", "RIGHT"): "STRAIGHT",
    ("LEFT", "TOP"): "RIGHT",
    ("LEFT", "BOTTOM"): "LEFT",

    ("RIGHT", "LEFT"): "STRAIGHT",
    ("RIGHT", "BOTTOM"): "RIGHT",
    ("RIGHT", "TOP"): "LEFT"
}


# ============================================================
# STATISTICS
# ============================================================

frame_number = 0

max_simultaneous = 0

low_frames = 0

medium_frames = 0

high_frames = 0


# ============================================================
# WINDOW
# ============================================================

WINDOW_NAME = (
    "Traffic Data Analysis"
)

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)

cv2.resizeWindow(
    WINDOW_NAME,
    1280,
    720
)


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    ret, frame = cap.read()


    if not ret:

        break


    frame_number += 1


    # ========================================================
    # YOLO TRACKING
    # ========================================================

    results = model.track(

        frame,

        persist=True,

        tracker="bytetrack.yaml",

        classes=list(
            VEHICLE_CLASSES.keys()
        ),

        conf=CONFIDENCE,

        imgsz=IMAGE_SIZE,

        verbose=False
    )


    result = results[0]


    # ========================================================
    # CURRENT COUNTS
    # ========================================================

    current_counts = {

        "car": 0,

        "motorcycle": 0,

        "bus": 0,

        "truck": 0
    }


    # ========================================================
    # PROCESS VEHICLES
    # ========================================================

    if (
        result.boxes is not None
        and result.boxes.id is not None
    ):


        boxes = (
            result.boxes.xyxy
            .cpu()
            .tolist()
        )


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


        for box, track_id, class_id in zip(

            boxes,

            track_ids,

            class_ids
        ):


            vehicle_type = (
                VEHICLE_CLASSES.get(
                    class_id
                )
            )


            if vehicle_type is None:

                continue


            # ------------------------------------------------
            # CURRENT COUNT
            # ------------------------------------------------

            current_counts[
                vehicle_type
            ] += 1


            # ------------------------------------------------
            # UNIQUE COUNT
            # ------------------------------------------------

            unique_ids[
                vehicle_type
            ].add(track_id)


            # ------------------------------------------------
            # CENTER
            # ------------------------------------------------

            x1, y1, x2, y2 = box


            center_x = int(
                (x1 + x2) / 2
            )


            center_y = int(
                (y1 + y2) / 2
            )


            # ------------------------------------------------
            # ZONE
            # ------------------------------------------------

            zone = get_zone(

                center_x,

                center_y
            )


            track = vehicle_tracks[
                track_id
            ]


            # ------------------------------------------------
            # ENTRY
            # ------------------------------------------------

            if (

                track["entry_zone"]
                is None

                and zone is not None

            ):

                track[
                    "entry_zone"
                ] = zone


            # ------------------------------------------------
            # EXIT / MOVEMENT
            # ------------------------------------------------

            if (

                track["entry_zone"]
                is not None

                and zone is not None

                and zone
                != track["entry_zone"]

                and not track["counted"]

            ):


                entry = (
                    track["entry_zone"]
                )


                movement = MOVEMENTS.get(

                    (
                        entry,
                        zone
                    )
                )


                if movement == "LEFT":

                    left_ids.add(
                        track_id
                    )

                    track[
                        "counted"
                    ] = True


                elif movement == "RIGHT":

                    right_ids.add(
                        track_id
                    )

                    track[
                        "counted"
                    ] = True


                elif movement == "STRAIGHT":

                    straight_ids.add(
                        track_id
                    )

                    track[
                        "counted"
                    ] = True


    # ========================================================
    # CURRENT TOTAL
    # ========================================================

    current_total = sum(
        current_counts.values()
    )


    # ========================================================
    # UNIQUE TOTAL
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
    # DIRECTION TOTALS
    # ========================================================

    left_count = len(
        left_ids
    )

    right_count = len(
        right_ids
    )

    straight_count = len(
        straight_ids
    )


    # ========================================================
    # MAX SIMULTANEOUS
    # ========================================================

    max_simultaneous = max(

        max_simultaneous,

        current_total
    )


    # ========================================================
    # DENSITY
    # ========================================================

    if current_total <= LOW_LIMIT:

        density = "LOW"

    elif current_total <= MEDIUM_LIMIT:

        density = "MEDIUM"

    else:

        density = "HIGH"


    # ========================================================
    # CONGESTION
    # ========================================================

    if current_total <= LOW_LIMIT:

        congestion = "LOW"

        low_frames += 1

    elif current_total <= MEDIUM_LIMIT:

        congestion = "MEDIUM"

        medium_frames += 1

    else:

        congestion = "HIGH"

        high_frames += 1


    # ========================================================
    # TIMESTAMP
    # ========================================================

    elapsed = (
        frame_number / fps
    )


    minutes = int(
        elapsed // 60
    )


    seconds = int(
        elapsed % 60
    )


    timestamp = (

        f"{minutes:02d}:"
        f"{seconds:02d}"
    )


    # ========================================================
    # SAVE CSV
    # ========================================================

    csv_writer.writerow([

        timestamp,

        frame_number,

        current_counts["car"],

        current_counts["motorcycle"],

        current_counts["bus"],

        current_counts["truck"],

        current_total,

        unique_cars,

        unique_motorcycles,

        unique_buses,

        unique_trucks,

        unique_total,

        left_count,

        right_count,

        straight_count,

        density,

        congestion
    ])


    # ========================================================
    # DRAW DETECTIONS
    # ========================================================

    annotated = result.plot()


    # ========================================================
    # DISPLAY
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

        f"LEFT: {left_count}",

        (30, 135),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        (255, 255, 255),

        2
    )


    cv2.putText(

        annotated,

        f"RIGHT: {right_count}",

        (30, 175),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        (255, 255, 255),

        2
    )


    cv2.putText(

        annotated,

        f"STRAIGHT: {straight_count}",

        (30, 215),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        (255, 255, 255),

        2
    )


    cv2.putText(

        annotated,

        f"Density: {density}",

        (30, 260),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        (255, 255, 255),

        2
    )


    cv2.putText(

        annotated,

        f"Congestion: {congestion}",

        (30, 300),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        (255, 255, 255),

        2
    )


    # ========================================================
    # SAVE
    # ========================================================

    out.write(
        annotated
    )


    # ========================================================
    # DISPLAY
    # ========================================================

    display_width = 1280

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
    # TERMINAL
    # ========================================================

    if frame_number % 30 == 0:

        print(

            f"Frame {frame_number:5d} | "

            f"Current: {current_total:2d} | "

            f"Unique: {unique_total:3d} | "

            f"L: {left_count:3d} | "

            f"R: {right_count:3d} | "

            f"S: {straight_count:3d} | "

            f"{density}"
        )


    # ========================================================
    # Q TO STOP
    # ========================================================

    if (

        cv2.waitKey(1)
        & 0xFF
        == ord("q")

    ):

        break


# ============================================================
# RELEASE
# ============================================================

cap.release()

out.release()

csv_file.close()

cv2.destroyAllWindows()


# ============================================================
# FINAL
# ============================================================

print()
print("======================================")
print("FINAL TRAFFIC DATA")
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

print(
    f"MAX SIMULTANEOUS   : {max_simultaneous}"
)

print("--------------------------------------")

print(
    f"LEFT movements     : {left_count}"
)

print(
    f"RIGHT movements    : {right_count}"
)

print(
    f"STRAIGHT movements : {straight_count}"
)

print("--------------------------------------")

print(
    f"CSV   : {OUTPUT_CSV}"
)

print(
    f"VIDEO : {OUTPUT_VIDEO}"
)

print("======================================")