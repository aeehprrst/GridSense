"""
Test OpenWeatherMap API Key + Print all weather attributes
Run this file to check if your key is active
"""
import urllib.request
import json

API_KEY = "654c2edd5d1b1ed3d37151e92e698c34"
CITY    = "Chennai"

print("=" * 55)
print(f"  Testing OpenWeatherMap API Key")
print(f"  City: {CITY}")
print("=" * 55)

url = f"https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={API_KEY}&units=metric"

try:
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())

    print("\n  [OK] API KEY IS ACTIVE!\n")
    print(f"  City           : {data['name']}, {data['sys']['country']}")
    print(f"  Temperature    : {data['main']['temp']} C")
    print(f"  Feels Like     : {data['main']['feels_like']} C")
    print(f"  Temp Min       : {data['main']['temp_min']} C")
    print(f"  Temp Max       : {data['main']['temp_max']} C")
    print(f"  Humidity       : {data['main']['humidity']} %")
    print(f"  Pressure       : {data['main']['pressure']} mbar")
    print(f"  Wind Speed     : {data['wind']['speed']} m/s")
    print(f"  Wind Direction : {data['wind']['deg']} degrees")
    print(f"  Cloud Cover    : {data['clouds']['all']} %")
    print(f"  Visibility     : {data.get('visibility', 'N/A')} m")
    print(f"  Condition      : {data['weather'][0]['description']}")

    temp     = data["main"]["temp"]
    humidity = data["main"]["humidity"]
    wind     = data["wind"]["speed"]
    pressure = data["main"]["pressure"]

    brush_stress   = round((temp/45 * 0.5) + (humidity/100 * 0.5), 3)
    cooling_factor = round(1 - (wind / 20), 3)
    power_derating = round(480 - 1.97*temp - 0.16*humidity, 1)

    print("\n  --- DERIVED POWER PLANT ATTRIBUTES ---")
    print(f"  Brush Stress Score : {brush_stress}  ({'HIGH RISK' if brush_stress > 0.6 else 'NORMAL'})")
    print(f"  Cooling Factor     : {cooling_factor}")
    print(f"  Power Derating     : {power_derating} MW expected output")

    # Save to JSON for dashboard to use
    output = {
        "api_status"    : "active",
        "city"          : data["name"],
        "temperature"   : temp,
        "feels_like"    : data["main"]["feels_like"],
        "temp_min"      : data["main"]["temp_min"],
        "temp_max"      : data["main"]["temp_max"],
        "humidity"      : humidity,
        "pressure"      : pressure,
        "wind_speed"    : wind,
        "wind_deg"      : data["wind"]["deg"],
        "cloud_cover"   : data["clouds"]["all"],
        "visibility"    : data.get("visibility", 0),
        "condition"     : data["weather"][0]["description"],
        "brush_stress"  : brush_stress,
        "cooling_factor": cooling_factor,
        "power_derating": power_derating,
        "high_risk"     : brush_stress > 0.6,
    }
    with open("data/live_weather.json", "w") as f:
        json.dump(output, f, indent=2)
    print("\n  [SAVE] Saved to data/live_weather.json")

except urllib.error.HTTPError as e:
    code = e.code
    body = e.read().decode()
    print(f"\n  [WAITING] HTTP {code} - Key not yet active")
    print(f"  This is NORMAL for new OpenWeatherMap accounts.")
    print(f"  Activation takes 10 to 120 minutes after signup.")
    print(f"\n  What to do right now:")
    print(f"  1. Wait 30-60 minutes")
    print(f"  2. Run: python test_weather_api.py")
    print(f"  3. When you see [OK] - run: python data_publisher.py -> choose [2]")
    print(f"\n  In the meantime run Mode 1 (Dataset Replay):")
    print(f"  python data_publisher.py  -> press Enter for auto-select")

except Exception as e:
    print(f"\n  [ERR] {e}")
