# Learning-By-Confusion
# 🔍 Phase Transition Detector (MLP Classifier + Image Upload)

This project is a full-stack web application for detecting **phase transitions** in physical systems using image data and associated tuning parameters. The backend uses a machine learning approach known as **"learning by confusion"** to identify the critical point (Tc) by analyzing classification accuracy across candidate values.

It supports submitting multiple system configuration images (not limited to spin systems) along with their tuning values, processes the data with a neural network classifier, and detects the likely phase transition point based on patterns in the accuracy curve.

---

## 🚀 Features

- Upload multiple system configuration images
- Submit corresponding tuning parameter values
- Automatically fits a neural network to detect changes across tuning values
- Estimates critical point (Tc) based on W-shaped accuracy curve
- JSON response with accuracy curve and estimated Tc
- Frontend interface (HTML/JS/CSS) for submitting and visualizing data

---

## 🧱 Tech Stack

**Frontend**
- HTML, CSS, JavaScript

**Backend**
- Python 3.x
- Flask
- scikit-learn
- numpy
- scipy
- Pillow (PIL)

---
