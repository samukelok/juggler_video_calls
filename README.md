# 🎪 Juggler Video Calls

**A Privacy-First, Unlimited-Time Video Calling Platform**  
[🌐 Live Site  →  juggler.bluenroll.co.za](https://juggler.bluenroll.co.za)

> An open-source alternative to Zoom/Google Meet that doesn’t spy on you — and never cuts your call short.

---

## 🚀 Why Juggler?

**Juggler** is a self-hosted video calling platform designed for **privacy, simplicity, and unlimited use**. Built with minimal dependencies and deployed via PHP, it allows **you to host private video calls** without requiring accounts, tracking, or time limits.

🟣 **No Registration**  
🟣 **Unlimited Call Durations**  
🟣 **End-to-End Privacy**  
🟣 **Free & Open Source**

---

## 🧠 Features

✅ 1-click room creation  
✅ Unique room URLs for easy sharing  
✅ Peer-to-peer video communication  
✅ Lightweight, fast-loading UI  
✅ Works on desktop & mobile  
✅ Server-controlled with `.htaccess` and PHP  
✅ No third-party analytics, trackers, or ads

---

## 📁 Project Structure

| File                | Purpose                                  |
|---------------------|-------------------------------------------|
| `index.php`         | Main landing page and room entry         |
| `call.php`          | Handles video call room logic            |
| `.htaccess`         | URL rewrites and security headers        |
| `LICENSE`           | MIT License for free use & modification |
| `README.md`         | This file                                |

---

## 🔌 Real-Time Engine: juggler_ws

Juggler relies on a custom Node.js WebSocket server called [`juggler_ws`](https://github.com/samukelok/juggler_ws) to manage real-time signaling between peers.

### Features of juggler_ws:

- Lightweight WebSocket signaling server
- Built with Node.js and `ws`
- Handles room creation, joining, and peer messaging
- Designed for scalability and low latency

### Setup Instructions:

1. Clone the repository:

   ```bash
   git clone https://github.com/samukelok/juggler_ws.git
   cd juggler_ws

2. Install dependencies:

   ```bash
   npm install

3. Start the server:

  ```bash
  node server.js

4. Ensure your PHP front-end connects to this WebSocket server for signaling.

For more details, visit the [`juggler_ws repository`](https://github.com/samukelok/juggler_ws).

## ⚙️ Setup (Self-hosting)

1. Clone the repo:

  ```bash
  git clone https://github.com/YOUR_USERNAME/juggler_video_calls.git
  cd juggler_video_calls

2. Deploy on any LAMP server or hosting service that supports PHP.

3. Make sure .htaccess is enabled for clean URLs.

4. Open your browser and visit your deployed site.

## 🛡️ Security & Privacy

- Calls are routed peer-to-peer whenever possible.  
- No personal data is collected.  
- No cookies, no trackers.  

> You're in control. Always.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use it commercially, privately, or as a base for your own tools.

---

## ❤️ Contribute

We’re open to improvements! Feel free to:

- Submit issues or pull requests  
- Improve UI or add internationalization  
- Add integrations (e.g., scheduling, email invites)

---

## 👤 Created by

**[@samukelok](https://github.com/samukelok)**  
Built for developers, educators, and privacy lovers.



