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

OUTPUT_VIDEO = BASE_DIR / "output" / "direction_traffic.mp4"

OUTPUT_CSV = BASE_DIR / "output" / "direction_data.csv"

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

# Minimum movement required before classifying direction
MIN_MOVEMENT = 40


# ============================================================
# CHECK INPUT FILES
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

print("Model loaded successfully.")


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
print("VEHICLE DIRECTION ANALYSIS")
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
print(
    f"Input      : {VIDEO_PATH}"
)
print(
    f"Output     : {OUTPUT_VIDEO}"
)
print("======================================")
print()


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_VIDEO.parent.mkdir(
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
    str(OUTPUT_VIDEO),
    fourcc,
    fps,
    (width, height)
)

if not out.isOpened():

    raise RuntimeError(
        f"Could not create output video:\n{OUTPUT_VIDEO}"
    )


# ============================================================
# TRACK INFORMATION
# ============================================================

tracks = defaultdict(
    lambda: {

        "first_x": None,

        "first_y": None,

        "last_x": None,

        "last_y": None,

        "movement": None,

        "counted": False
    }
)


# ============================================================
# DIRECTION ID SETS
# ============================================================

left_ids = set()

right_ids = set()

straight_ids = set()


# ============================================================
# VEHICLE TYPE ID SETS
# ============================================================

left_vehicle_types = defaultdict(set)

right_vehicle_types = defaultdict(set)

straight_vehicle_types = defaultdict(set)


# ============================================================
# MOVEMENT CLASSIFICATION
# ============================================================

def calculate_movement(track):

    if track["first_x"] is None:
        return None

    if track["first_y"] is None:
        return None

    if track["last_x"] is None:
        return None

    if track["last_y"] is None:
        return None


    # Change in position

    dx = (
        track["last_x"]
        - track["first_x"]
    )

    dy = (
        track["last_y"]
        - track["first_y"]
    )


    distance_x = abs(dx)

    distance_y = abs(dy)


    # --------------------------------------------------------
    # Ignore vehicles that have barely moved
    # --------------------------------------------------------

    if (

        distance_x < MIN_MOVEMENT

        and

        distance_y < MIN_MOVEMENT

    ):

        return None


    # --------------------------------------------------------
    # Mostly horizontal movement
    # --------------------------------------------------------

    if distance_x > distance_y:

        if dx > 0:

            return "RIGHT"

        else:

            return "LEFT"


    # --------------------------------------------------------
    # Mostly vertical movement
    # --------------------------------------------------------

    else:

        return "STRAIGHT"


# ============================================================
# FRAME NUMBER
# ============================================================

frame_number = 0


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
    # DRAW YOLO DETECTIONS
    # ========================================================

    annotated = result.plot()


    # ========================================================
    # PROCESS TRACKED VEHICLES
    # ========================================================

    if (

        result.boxes is not None

        and

        result.boxes.id is not None

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


        # ====================================================
        # PROCESS EACH VEHICLE
        # ====================================================

        for box, track_id, class_id in zip(

            boxes,

            track_ids,

            class_ids

        ):


            # ------------------------------------------------
            # VEHICLE TYPE
            # ------------------------------------------------

            vehicle_type = (

                VEHICLE_CLASSES.get(
                    class_id
                )
            )


            if vehicle_type is None:

                continue


            # ------------------------------------------------
            # BOUNDING BOX
            # ------------------------------------------------

            x1, y1, x2, y2 = box


            # ------------------------------------------------
            # CENTER POINT
            # ------------------------------------------------

            center_x = int(
                (x1 + x2) / 2
            )

            center_y = int(
                (y1 + y2) / 2
            )


            # ------------------------------------------------
            # GET TRACK
            # ------------------------------------------------

            track = tracks[
                track_id
            ]


            # ------------------------------------------------
            # SAVE FIRST POSITION
            # ------------------------------------------------

            if track["first_x"] is None:

                track["first_x"] = center_x

                track["first_y"] = center_y


            # ------------------------------------------------
            # UPDATE LAST POSITION
            # ------------------------------------------------

            track["last_x"] = center_x

            track["last_y"] = center_y


            # ------------------------------------------------
            # CALCULATE MOVEMENT
            # ------------------------------------------------

            movement = calculate_movement(
                track
            )


            if movement is not None:

                track["movement"] = movement


            # ------------------------------------------------
            # COUNT MOVEMENT ONLY ONCE
            # ------------------------------------------------

            if (

                track["movement"] is not None

                and

                not track["counted"]

            ):


                if track["movement"] == "LEFT":

                    left_ids.add(
                        track_id
                    )

                    left_vehicle_types[
                        vehicle_type
                    ].add(
                        track_id
                    )


                elif track["movement"] == "RIGHT":

                    right_ids.add(
                        track_id
                    )

                    right_vehicle_types[
                        vehicle_type
                    ].add(
                        track_id
                    )


                elif track["movement"] == "STRAIGHT":

                    straight_ids.add(
                        track_id
                    )

                    straight_vehicle_types[
                        vehicle_type
                    ].add(
                        track_id
                    )


                track["counted"] = True


            # ------------------------------------------------
            # MOVEMENT TEXT
            # ------------------------------------------------

            if track["movement"] is not None:

                movement_text = (
                    track["movement"]
                )

            else:

                movement_text = "MOVING"


            # ------------------------------------------------
            # DISPLAY VEHICLE ID
            # ------------------------------------------------

            cv2.putText(

                annotated,

                (
                    f"ID {track_id} "
                    f"{vehicle_type.upper()} "
                    f"{movement_text}"
                ),

                (
                    center_x + 10,
                    center_y
                ),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.60,

                (255, 255, 255),

                2
            )


            # ------------------------------------------------
            # CENTER POINT
            # ------------------------------------------------

            cv2.circle(

                annotated,

                (
                    center_x,
                    center_y
                ),

                6,

                (0, 255, 255),

                -1
            )


    # ========================================================
    # CURRENT DIRECTION COUNTS
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


    total_movements = (

        left_count

        +

        right_count

        +

        straight_count
    )


    # ========================================================
    # SUMMARY PANEL
    # ========================================================

    cv2.rectangle(

        annotated,

        (25, 25),

        (560, 240),

        (0, 0, 0),

        -1
    )


    cv2.putText(

        annotated,

        f"LEFT: {left_count}",

        (45, 70),

        cv2.FONT_HERSHEY_SIMPLEX,

        1.0,

        (255, 255, 255),

        3
    )


    cv2.putText(

        annotated,

        f"RIGHT: {right_count}",

        (45, 115),

        cv2.FONT_HERSHEY_SIMPLEX,

        1.0,

        (255, 255, 255),

        3
    )


    cv2.putText(

        annotated,

        f"STRAIGHT: {straight_count}",

        (45, 160),

        cv2.FONT_HERSHEY_SIMPLEX,

        1.0,

        (255, 255, 255),

        3
    )


    cv2.putText(

        annotated,

        f"TOTAL MOVEMENTS: {total_movements}",

        (45, 205),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.85,

        (255, 255, 255),

        2
    )


    # ========================================================
    # SAVE FRAME TO VIDEO
    # ========================================================

    out.write(
        annotated
    )


    # ========================================================
    # DISPLAY RESIZED VIDEO
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

        "Vehicle Direction Analysis",

        display_frame
    )


    # ========================================================
    # TERMINAL PROGRESS
    # ========================================================

    if frame_number % 30 == 0:

        print(

            f"Frame {frame_number:5d} | "

            f"LEFT: {left_count:3d} | "

            f"RIGHT: {right_count:3d} | "

            f"STRAIGHT: {straight_count:3d}"
        )


    # ========================================================
    # PRESS Q TO STOP
    # ========================================================

    if (

        cv2.waitKey(1)

        & 0xFF

        == ord("q")

    ):

        break


# ============================================================
# RELEASE RESOURCES
# ============================================================

cap.release()

out.release()

cv2.destroyAllWindows()


# ============================================================
# FINAL COUNTS
# ============================================================

left_count = len(
    left_ids
)

right_count = len(
    right_ids
)

straight_count = len(
    straight_ids
)

total_movements = (

    left_count

    +

    right_count

    +

    straight_count
)


# ============================================================
# SAVE DIRECTION CSV
# ============================================================

with open(

    OUTPUT_CSV,

    "w",

    newline="",

    encoding="utf-8"

) as csv_file:


    writer = csv.writer(
        csv_file
    )


    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    writer.writerow([

        "direction",

        "vehicle_count"
    ])


    # --------------------------------------------------------
    # Direction data
    # --------------------------------------------------------

    writer.writerow([

        "LEFT",

        left_count
    ])


    writer.writerow([

        "RIGHT",

        right_count
    ])


    writer.writerow([

        "STRAIGHT",

        straight_count
    ])


# ============================================================
# FINAL RESULT
# ============================================================

print()
print("======================================")
print("DIRECTION ANALYSIS COMPLETED")
print("======================================")

print(
    f"LEFT vehicles     : {left_count}"
)

print(
    f"RIGHT vehicles    : {right_count}"
)

print(
    f"STRAIGHT vehicles : {straight_count}"
)

print(
    f"TOTAL movements   : {total_movements}"
)

print("--------------------------------------")

print(
    f"Direction CSV     : {OUTPUT_CSV}"
)

print(
    f"Direction video   : {OUTPUT_VIDEO}"
)

print("======================================")

