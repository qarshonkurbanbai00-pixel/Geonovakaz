"""Geodesic helpers — distances, bearings, bounding boxes."""
import math

try:
    from geopy.distance import geodesic  # preferred: WGS-84 accurate
except ImportError:  # pragma: no cover
    geodesic = None


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    """Great-circle distance in km (geopy geodesic with haversine fallback)."""
    if geodesic is not None:
        return round(geodesic((a_lat, a_lon), (b_lat, b_lon)).km, 1)
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = math.radians(b_lat - a_lat), math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(h)), 1)


def bearing_deg(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    """Initial compass bearing from A to B, degrees 0..360."""
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dl = math.radians(b_lon - a_lon)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return round((math.degrees(math.atan2(x, y)) + 360) % 360, 1)


DIRECTIONS_KZ = ["солтүстікке", "солтүстік-шығысқа", "шығысқа", "оңтүстік-шығысқа",
                 "оңтүстікке", "оңтүстік-батысқа", "батысқа", "солтүстік-батысқа"]


def direction_kz(bearing: float) -> str:
    return DIRECTIONS_KZ[int((bearing + 22.5) // 45) % 8]


def bbox_for_points(points, pad: float = 1.5):
    """[[lat,lon],...] -> padded [[south,west],[north,east]] for flyToBounds."""
    lats = [p[0] for p in points]
    lons = [p[1] for p in points]
    return [[min(lats) - pad, min(lons) - pad], [max(lats) + pad, max(lons) + pad]]
