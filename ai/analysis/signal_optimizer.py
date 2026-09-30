from pathlib import Path
import csv

# ==========================================
# PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

TRAFFIC_DATA_CSV = BASE_DIR / "output" / "traffic_data.csv"
DIRECTION_DATA_CSV = BASE_DIR / "output" / "direction_data.csv"
AMBULANCE_DATA_CSV = BASE_DIR / "output" / "ambulance_data.csv"
OUTPUT_CSV = BASE_DIR / "output" / "signal_optimization.csv"


# ==========================================
# SIGNAL SETTINGS
# ==========================================

MAX_GREEN = 60
MIN_GREEN = 10

YELLOW_TIME = 5
ALL_RED_TIME = 2


# ==========================================
# CHECK FILES
# ==========================================

if not TRAFFIC_DATA_CSV.exists():
    raise FileNotFoundError(
        f"Traffic data not found:\n{TRAFFIC_DATA_CSV}"
    )

if not DIRECTION_DATA_CSV.exists():
    raise FileNotFoundError(
        f"Direction data not found:\n{DIRECTION_DATA_CSV}"
    )

if not AMBULANCE_DATA_CSV.exists():
    raise FileNotFoundError(
        f"Ambulance data not found:\n{AMBULANCE_DATA_CSV}"
    )


# ==========================================
# READ TRAFFIC DATA
# ==========================================

print("Loading traffic data...")

with open(
    TRAFFIC_DATA_CSV,
    "r",
    newline="",
    encoding="utf-8"
) as file:

    reader = csv.DictReader(file)
    traffic_rows = list(reader)


if not traffic_rows:
    raise RuntimeError(
        "traffic_data.csv is empty."
    )


# ==========================================
# READ DIRECTION DATA
# ==========================================

print("Loading direction data...")

with open(
    DIRECTION_DATA_CSV,
    "r",
    newline="",
    encoding="utf-8"
) as file:

    reader = csv.DictReader(file)
    direction_rows = list(reader)


if not direction_rows:
    raise RuntimeError(
        "direction_data.csv is empty."
    )


# ==========================================
# READ AMBULANCE DATA
# ==========================================

print("Loading ambulance data...")

with open(
    AMBULANCE_DATA_CSV,
    "r",
    newline="",
    encoding="utf-8"
) as file:

    reader = csv.DictReader(file)
    ambulance_rows = list(reader)


if not ambulance_rows:
    raise RuntimeError(
        "ambulance_data.csv is empty."
    )


# ==========================================
# TRAFFIC DATA
# ==========================================

latest_traffic = traffic_rows[-1]

try:

    total_unique = int(
        float(latest_traffic["unique_total"])
    )

except:

    total_unique = 0


# ==========================================
# PEAK SIMULTANEOUS VEHICLES
# ==========================================

peak_simultaneous = 0

for row in traffic_rows:

    try:

        current = int(
            float(row["current_vehicles"])
        )

    except:

        current = 0

    if current > peak_simultaneous:

        peak_simultaneous = current


# ==========================================
# DIRECTION DATA
# ==========================================

left_vehicles = 0
right_vehicles = 0
straight_vehicles = 0


for row in direction_rows:

    direction = row["direction"].strip().upper()

    try:

        count = int(
            float(row["vehicle_count"])
        )

    except:

        count = 0

    if direction == "LEFT":

        left_vehicles = count

    elif direction == "RIGHT":

        right_vehicles = count

    elif direction == "STRAIGHT":

        straight_vehicles = count


# ==========================================
# DISPLAY DIRECTION DATA
# ==========================================

print()
print("Direction data loaded:")
print(f"LEFT     : {left_vehicles}")
print(f"RIGHT    : {right_vehicles}")
print(f"STRAIGHT : {straight_vehicles}")


# ==========================================
# READ AMBULANCE RESULT
# ==========================================

ambulance_detected = False
ambulance_direction = "NONE"


for row in ambulance_rows:

    detected = row["ambulance_detected"].strip().upper()
    direction = row["direction"].strip().upper()

    if detected == "YES":

        ambulance_detected = True

        if direction in ["LEFT", "RIGHT", "STRAIGHT"]:

            ambulance_direction = direction


# ==========================================
# TRAFFIC LEVEL
# ==========================================

if peak_simultaneous <= 8:

    traffic_level = "LOW"

elif peak_simultaneous <= 20:

    traffic_level = "MEDIUM"

else:

    traffic_level = "HIGH"


# ==========================================
# TOTAL MOVEMENTS
# ==========================================

direction_total = (
    left_vehicles
    + right_vehicles
    + straight_vehicles
)


# ==========================================
# GREEN TIME CALCULATION
# ==========================================

def calculate_green_time(
    vehicle_count,
    total_vehicles
):

    if total_vehicles == 0:

        return 0

    green_time = round(
        (vehicle_count / total_vehicles)
        * MAX_GREEN
    )

    if vehicle_count > 0:

        green_time = max(
            MIN_GREEN,
            green_time
        )

    green_time = min(
        MAX_GREEN,
        green_time
    )

    return green_time


left_green = calculate_green_time(
    left_vehicles,
    direction_total
)

right_green = calculate_green_time(
    right_vehicles,
    direction_total
)

straight_green = calculate_green_time(
    straight_vehicles,
    direction_total
)


# ==========================================
# NORMAL PRIORITY DIRECTION
# ==========================================

directions = {

    "LEFT": left_vehicles,
    "RIGHT": right_vehicles,
    "STRAIGHT": straight_vehicles

}


normal_priority_direction = max(
    directions,
    key=directions.get
)

normal_priority_vehicles = directions[
    normal_priority_direction
]


if normal_priority_vehicles == 0:

    normal_priority_direction = "NONE"


# ==========================================
# EMERGENCY OVERRIDE
# ==========================================

if ambulance_detected:

    priority_direction = ambulance_direction

    priority_vehicles = 0

    if priority_direction == "LEFT":

        emergency_green = MAX_GREEN

    elif priority_direction == "RIGHT":

        emergency_green = MAX_GREEN

    elif priority_direction == "STRAIGHT":

        emergency_green = MAX_GREEN

    else:

        priority_direction = "NONE"
        emergency_green = 0

    if priority_direction != "NONE":

        recommendation = (
            f"AMBULANCE EMERGENCY detected. "
            f"Give immediate priority to {priority_direction} traffic. "
            f"Recommended emergency green time: "
            f"{emergency_green} seconds."
        )

    else:

        recommendation = (
            "Ambulance detected, but direction could not be determined."
        )

else:

    priority_direction = normal_priority_direction
    priority_vehicles = normal_priority_vehicles

    if direction_total == 0:

        recommendation = (
            "No completed vehicle movements detected. "
            "Use default signal timing."
        )

    else:

        if priority_direction == "LEFT":

            selected_green = left_green

        elif priority_direction == "RIGHT":

            selected_green = right_green

        elif priority_direction == "STRAIGHT":

            selected_green = straight_green

        else:

            selected_green = 0

        recommendation = (
            f"Prioritize {priority_direction} traffic. "
            f"Recommended green time: "
            f"{selected_green} seconds."
        )


# ==========================================
# SAVE OPTIMIZATION RESULT
# ==========================================

OUTPUT_CSV.parent.mkdir(
    parents=True,
    exist_ok=True
)


with open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "traffic_level",
        "total_unique_vehicles",
        "peak_simultaneous",
        "left_vehicles",
        "right_vehicles",
        "straight_vehicles",
        "left_green",
        "right_green",
        "straight_green",
        "ambulance_detected",
        "ambulance_direction",
        "priority_direction",
        "priority_vehicles",
        "yellow_time",
        "all_red_time",
        "recommendation"
    ])

    writer.writerow([
        traffic_level,
        total_unique,
        peak_simultaneous,
        left_vehicles,
        right_vehicles,
        straight_vehicles,
        left_green,
        right_green,
        straight_green,
        "YES" if ambulance_detected else "NO",
        ambulance_direction,
        priority_direction,
        priority_vehicles,
        YELLOW_TIME,
        ALL_RED_TIME,
        recommendation
    ])


# ==========================================
# FINAL OUTPUT
# ==========================================

print()
print("======================================")
print("TRAFFIC SIGNAL OPTIMIZATION")
print("======================================")

print(
    f"Total unique vehicles : {total_unique}"
)

print(
    f"Peak simultaneous     : {peak_simultaneous}"
)

print(
    f"Traffic level         : {traffic_level}"
)

print("--------------------------------------")

print(
    f"Left vehicles         : {left_vehicles}"
)

print(
    f"Right vehicles        : {right_vehicles}"
)

print(
    f"Straight vehicles     : {straight_vehicles}"
)

print("--------------------------------------")

print(
    f"Left GREEN            : {left_green} sec"
)

print(
    f"Right GREEN           : {right_green} sec"
)

print(
    f"Straight GREEN        : {straight_green} sec"
)

print("--------------------------------------")

print(
    f"Ambulance detected    : "
    f"{'YES' if ambulance_detected else 'NO'}"
)

print(
    f"Ambulance direction   : {ambulance_direction}"
)

print("--------------------------------------")

print(
    f"Priority direction    : {priority_direction}"
)

print(
    f"Priority vehicles     : {priority_vehicles}"
)

print("--------------------------------------")

print(
    f"Yellow time           : {YELLOW_TIME} sec"
)

print(
    f"All-red time          : {ALL_RED_TIME} sec"
)

print("--------------------------------------")

print(
    f"Recommendation        : {recommendation}"
)

print("--------------------------------------")

print(
    f"Output CSV            : {OUTPUT_CSV}"
)

print("======================================")

print()
print(
    "Signal optimization completed successfully."
)