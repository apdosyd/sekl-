import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBmGUwMrocACdo3eelRAvTMFWLD8Bc9SAo",
  authDomain: "sekl-8ceef.firebaseapp.com",
  databaseURL: "https://sekl-8ceef-default-rtdb.firebaseio.com",
  projectId: "sekl-8ceef",
  storageBucket: "sekl-8ceef.appspot.com",
  messagingSenderId: "805869746836",
  appId: "1:805869746836:web:be1900eae9d5b7c6f2d281"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const bikesContainer = document.getElementById("bikesContainer");
const alarmSound = document.getElementById("alarmSound");
const bikeCount = 25;
let timers = [];

function renderBike(index) {
  const div = document.createElement("div");
  div.className = "bike-container";
  div.innerHTML = `
    <h3>العجلة رقم ${index}</h3>
    <input id="name${index}" placeholder="اسم المستأجر" />
    <input id="bike${index}" placeholder="اسم العجلة" />
    <input id="mins${index}" type="number" placeholder="مدة الإيجار (بالدقائق)" />
    <button id="start${index}">ابدأ الإيجار</button>
    <div class="end-time" id="end${index}">ينتهي في: -</div>
    <div class="countdown" id="count${index}">الوقت المتبقي: -</div>
  `;
  bikesContainer.appendChild(div);

  document.getElementById(`start${index}`).addEventListener("click", () => {
    const name = document.getElementById(`name${index}`).value.trim();
    const bike = document.getElementById(`bike${index}`).value.trim();
    const mins = parseInt(document.getElementById(`mins${index}`).value);
    if (!name || !bike || isNaN(mins) || mins <= 0) {
      alert("أدخل بيانات صحيحة");
      return;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + mins * 60000);
    const data = {
      name,
      bike,
      duration: mins,
      start: now.toISOString(),
      end: endTime.toISOString()
    };

    set(ref(db, "bikes/bike" + index), data);
  });
}

function updateUI(index, data) {
  const endDiv = document.getElementById(`end${index}`);
  const countDiv = document.getElementById(`count${index}`);
  if (!data) {
    endDiv.textContent = "ينتهي في: -";
    countDiv.textContent = "الوقت المتبقي: -";
    return;
  }

  const endTime = new Date(data.end);
  const interval = setInterval(() => {
    const now = new Date();
    const diff = endTime - now;
    if (diff <= 0) {
      clearInterval(interval);
      countDiv.textContent = `انتهى وقت العجلة ${data.bike} للمستأجر ${data.name}`;
      alarmSound.play();
    } else {
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      countDiv.textContent = `الوقت المتبقي: ${mins} دقيقة و ${secs} ثانية`;
      endDiv.textContent = `ينتهي في: ${endTime.toLocaleTimeString("ar-EG")}`;
    }
  }, 1000);
  timers[index] = interval;
}

// إنشاء واجهة وبدء المراقبة
for (let i = 1; i <= bikeCount; i++) {
  renderBike(i);
  const bikeRef = ref(db, "bikes/bike" + i);
  onValue(bikeRef, (snapshot) => {
    if (timers[i]) clearInterval(timers[i]);
    updateUI(i, snapshot.val());
  });
}
