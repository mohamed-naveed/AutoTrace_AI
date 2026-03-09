# ─────────────────────────────────────────────────────────────
#  AutoTrace AI — Business Logic Helpers
#  Region: India  |  Currency: INR (₹)
# ─────────────────────────────────────────────────────────────

# Pan-India FTTP market historical baseline (₹ per km)
INDIA_HISTORICAL_AVG_PER_KM = 1_20_000.0   # ₹1,20,000/km (national average)

# ── All Indian States & Union Territories ────────────────────
INDIA_STATES = [
    # States
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    # Union Territories
    "Andaman & Nicobar Islands", "Chandigarh",
    "Dadra & Nagar Haveli", "Daman & Diu",
    "Delhi", "Jammu & Kashmir", "Ladakh",
    "Lakshadweep", "Puducherry",
]

# ── Indian market default rates (INR) ────────────────────────
INDIA_DEFAULT_RATES = {
    "cable_rate":               45.0,    # ₹/m  (SM fiber)
    "pole_rate":              3000.0,    # ₹/pole
    "duct_rate":               500.0,    # ₹/duct section
    "joint_box_rate":         1500.0,    # ₹/joint box
    "labor_rate_per_day":     1200.0,    # ₹/day
    "equipment_rate_per_day":    0.0,
}


def convert_to_meters(distance_km: float) -> float:
    """Rule 1: Distance_m = Distance_km × 1000"""
    return distance_km * 1000.0


def get_productivity(build_type: str) -> float:
    """Rule 6: m/day based on build type"""
    return {"overhead": 500.0, "underground": 250.0}.get(build_type.lower(), 500.0)


def get_complexity_multiplier(complexity: str) -> float:
    """Rule 8"""
    return {"low": 1.0, "medium": 1.2, "high": 1.5}.get(complexity.lower(), 1.0)


def get_area_multiplier(area: str) -> float:
    """Rule 9 — applies uniformly across India"""
    return {"urban": 1.0, "semi-urban": 1.1, "rural": 1.2}.get(area.lower(), 1.0)
