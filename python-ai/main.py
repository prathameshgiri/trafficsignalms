from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# ─── Traffic Prediction Logic ─────────────────────────────────────────────────
RULES = {
    "high": {
        "action": "increase_green_time",
        "duration": 60,
        "message": "High traffic detected. Extending green signal to reduce congestion.",
        "priority": "urgent"
    },
    "medium": {
        "action": "balanced_timing",
        "duration": 40,
        "message": "Moderate traffic. Maintaining balanced signal timing.",
        "priority": "normal"
    },
    "low": {
        "action": "reduce_wait_time",
        "duration": 20,
        "message": "Low traffic detected. Reducing wait time for efficiency.",
        "priority": "low"
    }
}

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "service": "Smart Traffic AI Module",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/predict", "/health"]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "SmartTraffic-AI"})

@app.route('/predict', methods=['POST'])
def predict():
    """
    Input:  { "traffic_density": "high" | "medium" | "low" }
    Output: { "action": ..., "duration": ..., "message": ..., "confidence": ... }
    """
    data = request.get_json(silent=True) or {}
    density = str(data.get("traffic_density", "")).strip().lower()

    if density not in RULES:
        return jsonify({
            "success": False,
            "error": "Invalid traffic_density. Must be 'high', 'medium', or 'low'."
        }), 400

    rule = RULES[density]
    # Add slight variance to duration to simulate real AI behaviour
    variance = random.randint(-3, 3)
    result = {
        "success": True,
        "traffic_density": density,
        "action": rule["action"],
        "duration": rule["duration"] + variance,
        "message": rule["message"],
        "priority": rule["priority"],
        "confidence": round(random.uniform(0.87, 0.98), 2),
        "model": "SmartTraffic-RuleAI-v1"
    }
    return jsonify(result)

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict for multiple intersections at once."""
    data = request.get_json(silent=True) or {}
    intersections = data.get("intersections", [])
    results = []
    for item in intersections:
        density = str(item.get("traffic_density", "")).strip().lower()
        if density in RULES:
            rule = RULES[density]
            results.append({
                "intersection": item.get("intersection", "Unknown"),
                "traffic_density": density,
                "action": rule["action"],
                "duration": rule["duration"] + random.randint(-3, 3),
                "confidence": round(random.uniform(0.87, 0.98), 2)
            })
    return jsonify({"success": True, "predictions": results})

if __name__ == '__main__':
    print("\033[92m✅ SmartTraffic AI API running → http://localhost:5000\033[0m")
    app.run(host='0.0.0.0', port=5000, debug=False)
