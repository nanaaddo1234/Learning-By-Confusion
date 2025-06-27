from flask import Flask, request, jsonify
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
import numpy as np
from PIL import Image
import scipy.signal
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes


@app.route("/")
def home():
    return "Backend is running"

@app.route("/api/submit", methods=["POST"])
def receive_data():
    images = request.files.getlist("images")
    tuning_values = request.form.getlist("tuning_values")
    
    # Convert to float
    T_vals = np.array([float(t) for t in tuning_values])

    # Convert image data to flattened arrays
    X = []
    for img_file in images:
        img = Image.open(img_file).convert("L").resize((28, 28))
        X.append(np.array(img).flatten())
    X = np.array(X)

    Tc_candidates = np.linspace(min(T_vals), max(T_vals), 30)
    accuracies = []

    for Tc in Tc_candidates:
        y = np.array([0 if T < Tc else 1 for T in T_vals])
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
        clf = MLPClassifier(hidden_layer_sizes=(64,), max_iter=500, random_state=0)
        clf.fit(X_train, y_train)
        acc = clf.score(X_test, y_test)
        accuracies.append(acc)

    # Detect W shape and estimate center
    shape_info = detect_w_shape(Tc_candidates, accuracies)

    return jsonify({
        "Tc_candidates": Tc_candidates.tolist(),
        "accuracies": accuracies,
        "shape_analysis": shape_info
    })

def detect_w_shape(Tc_candidates, accuracies):
    Tc_arr = np.array(Tc_candidates)
    acc_arr = np.array(accuracies)

    # Invert the accuracy curve to detect valleys
    inverted = -acc_arr
    peaks, _ = scipy.signal.find_peaks(inverted, distance=2)

    if len(peaks) < 1:
        return {"center_guess": None, "num_valleys": 0}

    if len(peaks) >= 2:
        # Pick the two deepest valleys and return their midpoint
        sorted_peaks = sorted(peaks, key=lambda i: acc_arr[i])
        idx1, idx2 = sorted(sorted_peaks[:2])  # lowest two, sorted left to right
        Tc_center = (Tc_arr[idx1] + Tc_arr[idx2]) / 2
    else:
        # Fallback: just take the single lowest dip
        idx = peaks[0]
        Tc_center = Tc_arr[idx]

    return {
        "center_guess": float(Tc_center),
        "num_valleys": int(len(peaks))
    }


if __name__ == "__main__":
    app.run(debug=True)
