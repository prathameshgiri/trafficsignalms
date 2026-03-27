# 🚦 Smart Traffic Signal Control System

Welcome to the **Smart Traffic Signal Control System**, an advanced, AI-powered traffic management platform designed to optimize urban mobility, reduce congestion, and provide real-time monitoring of city intersections.

---

## 🌟 Introduction

Urban traffic congestion is a growing problem that wastes time, fuel, and increases pollution. The **Smart Traffic Signal Control System** tackles this issue by transitioning from static, time-based traffic lights to dynamic, data-driven signal control.

This project utilizes a robust technology stack including **HTML5, CSS3, JavaScript** for the responsive frontend, **Node.js (Express.js)** for the backend server, and a specialized **Python** module for Artificial Intelligence predictions. Key traffic data is seamlessly stored and managed using a highly optimized JSON-based file storage structure.

Our goal is simple: **Zero congestion cities through intelligent, real-time traffic management.**

---

## ✨ Features

- **🌐 Dual Portal System:** Separate, secure interfaces for Users and Administrators.
- **📊 Real-Time Dashboard:** Live tracking of total vehicles, average speeds, and traffic density across all city zones.
- **🗺️ Live Traffic Congestion Map:** A beautifully rendered city traffic network showing real-time bottlenecks and statuses.
- **🧠 AI-Powered Predictions:** Machine learning algorithms suggest optimal signal durations based on current traffic density (Low, Medium, High).
- **🚦 Dynamic Signal Control:** Complete administrative control over lane statuses and signal timings.
- **📝 Full CRUD Operations:** Admins can seamlessly Add, Edit, and Delete intersection records in real-time.
- **📥 Data Export:** One-click CSV export functionality for all recorded traffic data.
- **🎨 Modern UI/UX:** A stunning, glassmorphism-inspired interface with responsive design and built-in Dark Mode support.

---

## 📂 Folder Structure

```text
📦 Smart Traffic Signal Control System
 ┣ 📂 admin               # Admin Panel Frontend (Port 3001)
 ┃ ┣ 📜 index.html        # Admin Dashboard View
 ┃ ┣ 📜 style.css         # Admin Styles (Glassmorphism + Dark Mode)
 ┃ ┗ 📜 script.js         # Admin Logic (Charts, CRUD, Signal Override)
 ┣ 📂 python-ai           # AI Optimization Module (Port 5000)
 ┃ ┣ 📜 main.py           # Flask Server & Prediction API
 ┃ ┗ 📜 requirements.txt  # Python Dependencies
 ┣ 📂 server              # Backend Node.js Server
 ┃ ┣ 📂 data              # JSON Database Storage
 ┃ ┃ ┣ 📜 config.json     # System Configurations
 ┃ ┃ ┣ 📜 messages.json   # Contact Form Submissions
 ┃ ┃ ┣ 📜 sessions.json   # Secure Auth Tokens
 ┃ ┃ ┣ 📜 signals.json    # Current Signal State
 ┃ ┃ ┣ 📜 trafficData.json# Traffic Records
 ┃ ┃ ┗ 📜 users.json      # Admin Credentials
 ┃ ┣ 📂 routes            # Express API Routes
 ┃ ┃ ┣ 📜 auth.js         # Login/Logout logic
 ┃ ┃ ┣ 📜 config.js       # System settings API
 ┃ ┃ ┣ 📜 messages.js     # Contact feed API
 ┃ ┃ ┣ 📜 signals.js      # Traffic Light API
 ┃ ┃ ┗ 📜 traffic.js      # Traffic CRUD API
 ┃ ┗ 📜 app.js            # Main Express Server
 ┣ 📂 user                # User Panel Frontend (Port 3000)
 ┃ ┣ 📜 index.html        # User Dashboard View
 ┃ ┣ 📜 style.css         # User Styles
 ┃ ┗ 📜 script.js         # User Logic (Live Map, Fetch logic)
 ┣ 📜 package.json        # Node.js Dependencies
 ┗ 📜 README.md           # Project Documentation
```

---

## 🛠️ Installation / Setup

Follow these steps to set up the project on your local machine:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the project directory:**
   ```bash
   cd "Smart Traffic Signal Control System"
   ```

3. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

4. **Install Python AI Dependencies:**
   Ensure you have Python installed, then run:
   ```bash
   cd python-ai
   pip install flask flask-cors
   cd ..
   ```

---

## 🚀 How to Run

To get the full system operational, you need to start both the main Node.js server and the Python AI module.

**1. Start the Main Backend Server (Runs both panels & APIs):**
Open a terminal in the root directory and run:
```bash
npm start
```
*This will automatically launch:*
- **User Panel:** `http://localhost:3000`
- **Admin Panel:** `http://localhost:3001`

**2. Start the AI Background Service:**
Open a *second* terminal, navigate to the `python-ai` folder, and run:
```bash
cd python-ai
python main.py
```
*This starts the AI server on `http://localhost:5000`.*

---

## 💻 How to Use

### 🧑‍💻 User Workflow
1. Navigate to `http://localhost:3000`.
2. View the **Live Traffic Dashboard** and scroll down to explore the **City Traffic Network Map**.
3. Check the **Real-Time Signal Status** block to see active intersection lights.
4. Interact with the **AI Traffic Prediction** module to test how the system recommends signal changes.
5. Submit feedback via the **Contact Form**.

### 🔐 Admin Workflow
1. Navigate to `http://localhost:3001`.
2. Log in using the default credentials:
   - **Username:** `admin` (or `divya`)
   - **Password:** `admin123` (or `divya123`)
3. View the **System Dashboard** for interactive charts (Pie & Horizontal Bar).
4. Go to **Live Monitor** to directly Add, Edit, or Delete underlying traffic records (Full CRUD).
5. Switch to **Signal Control Panel** to manually override current active colors and toggle lanes.
6. Access **Settings** to adjust maintenance mode, thresholds, and auto-refresh intervals.

---

## ⚙️ Technologies Used

### Frontend
- **HTML5** (Semantics, Layout)
- **Vanilla CSS3** (Glassmorphism, Flexbox/Grid, Dark Mode)
- **JavaScript (ES6+)** (Vanilla DOM manipulation, Fetch API, HTML5 Canvas)

### Backend
- **Node.js** (Runtime Environment)
- **Express.js** (Web Framework, RESTful APIs, Static File Serving)

### AI Module
- **Python** (Core Scripting)
- **Flask** (Micro API Server)

### Database
- **Custom JSON File System** (using Node.js `fs` module to simulate a full Database)

---

## 🔮 Future Enhancements

- [ ] **Real-world Camera Integration:** Process live CCTV feeds using Computer Vision (OpenCV) to replace simulated traffic counts.
- [ ] **Emergency Vehicle Routing:** Automatic green-light corridors for ambulances and fire engines.
- [ ] **Mobile App Port:** Create native Android/iOS versions of the user dashboard using React Native.
- [ ] **Database Migration:** Upgrade the JSON storage to MongoDB or PostgreSQL for enterprise-scale deployments.

---

## 👨‍💻 Developer Details

- **Name:** Prathamesh Giri
- **Website:** [https://prathameshgiri.in/](https://prathameshgiri.in/)
- **Projects Showcase:** [http://build.prathameshgiri.in/](http://build.prathameshgiri.in/)
- **Email:** contact@prathameshgiri.in
- **Phone:** 8010901226

---

## 🎓 Developed For

- **Divya Shinde**
- **Purpose:** Final Year College Project / Smart City Solutions Initiative

---

## 📄 License

This software is developed exclusively for educational purposes and internal evaluation. All rights reserved by the developer.

---

## 🙏 Acknowledgement

Special thanks to the open-source community, comprehensive documentation platforms (MDN Web Docs, Node.js docs), and my project guides for their continuous support and inspiration throughout this development cycle.

---
*Built with ❤️ for smarter, safer cities.*
