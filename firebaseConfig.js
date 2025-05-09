// firebaseConfig.js

import { getAnalytics } from "firebase/analytics";
import { getApp, getApps, initializeApp } from 'firebase/app'; // Thêm getApp, getApps để khởi tạo an toàn
import { getDatabase } from "firebase/database"; // <--- THÊM DÒNG NÀY

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7MjFYvvRpMCWE2Cv7cyMUxP6OyqMenRI",
  authDomain: "quanlychitieu-4a1a8.firebaseapp.com",
  // QUAN TRỌNG: Thêm databaseURL nếu chưa có và bạn đang dùng Realtime Database
  databaseURL: "https://quanlychitieu-4a1a8-default-rtdb.asia-southeast1.firebasedatabase.app/", // <--- KIỂM TRA VÀ THÊM DÒNG NÀY (lấy từ Firebase console)
  projectId: "quanlychitieu-4a1a8",
  storageBucket: "quanlychitieu-4a1a8.appspot.com", // Kiểm tra lại giá trị này trên Firebase Console cho chắc chắn
  messagingSenderId: "260847840317",
  appId: "1:260847840317:web:e62a28829c1f3e29f9ce54",
  measurementId: "G-EL54MCJXDN"
};

// Initialize Firebase App một cách an toàn
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const analytics = getAnalytics(app);
const database = getDatabase(app); // <--- KHỞI TẠO DATABASE SERVICE

// Export những gì bạn cần
export { analytics, app, database }; // <--- EXPORT 'database'

