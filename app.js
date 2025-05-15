const firebaseConfig = {
  apiKey: "AIzaSyBmGUwMrocACdo3eelRAvTMFWLD8Bc9SAo",
  authDomain: "sekl-8ceef.firebaseapp.com",
  databaseURL: "https://sekl-8ceef-default-rtdb.firebaseio.com",
  projectId: "sekl-8ceef",
  storageBucket: "sekl-8ceef.appspot.com",
  messagingSenderId: "805869746836",
  appId: "1:805869746836:web:be1900eae9d5b7c6f2d281"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const bikeCount = 25;
const timers = {};

const container = document.getElementById('bikesContainer');

for (let i = 1; i <= bikeCount; i++) {
  const div = document.createElement('div');
  div.className = 'bike-container';
  div.innerHTML = `
    <h3>العجلة رقم ${i}</h3>
    <label>اسم المستأجر:</label>
    <input id="person${i}" placeholder="ادخل اسم المستأجر" />
    <label>اسم العجلة:</label>
    <input id="bike${i}" placeholder="ادخل اسم العجلة" />
    <label>وقت بداية الإيجار (ساعة:دقيقة):</label>
    <input id="startTime${i}" type="time" />
    <label>مدة الإيجار (بالدقائق):</label>
    <input type="number" id="duration${i}" min="1" placeholder="ادخل مدة الإيجار" />
    <button onclick="startRent(${i})">ابدأ الإيجار</button>
    <div class="countdown" id="countdown${i}">الوقت المتبقي: -</div>
  `;
  container.appendChild(div);
}

function startRent(i) {
  const name = document.getElementById(`person${i}`).value.trim();
  const bike = document.getElementById(`bike${i}`).value.trim();
  const startTimeInput = document.getElementById(`startTime${i}`).value;
  const mins = parseInt(document.getElementById(`duration${i}`).value);

  if (!name || !bike || !startTimeInput || isNaN(mins) || mins <= 0) {
    alert("من فضلك املأ جميع الخانات بشكل صحيح");
    return;
  }

  // الحصول على وقت البداية اليوم بالتوقيت المحلي بناءً على input type=time
  const now = new Date();
  const [hour, minute] = startTimeInput.split(':').map(Number);

  // ضبط بداية الوقت على نفس تاريخ اليوم مع الوقت المدخل
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

  // حساب وقت النهاية بإضافة مدة الإيجار (بالدقائق)
  const end = new Date(start.getTime() + mins * 60 * 1000);

  // تخزين الوقت كبداية ونهاية بالميلي ثانية
  database.ref("bikes/" + i).set({
    person: name,
    bikeName: bike,
    startTime: start.getTime(),
    endTime: end.getTime()
  });
}

function updateCountdown(i, endTime, person, bikeName) {
  const countdownEl = document.getElementById(`countdown${i}`);

  if(timers[i]) clearInterval(timers[i]);

  function tick() {
    const now = Date.now();
    let diff = Math.floor((endTime - now) / 1000);

    if(diff <= 0) {
      countdownEl.textContent = `انتهى وقت إيجار العجلة "${bikeName}" للمستأجر "${person}"!`;
      document.getElementById('alarm').play();
      clearInterval(timers[i]);
      return;
    }

    const mins = Math.floor(diff / 60);
    const secs = diff % 60;

    // حساب الوقت المتوقع لانتهاء الإيجار بتنسيق ساعة:دقيقة
    const endDate = new Date(endTime);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    countdownEl.textContent = `الوقت المتبقي: ${mins} دقيقة و ${secs} ثانية | ينتهي الساعة: ${endHours}:${endMinutes}`;
  }

  tick();
  timers[i] = setInterval(tick, 1000);
}

database.ref("bikes").on('value', snapshot => {
  const bikesData = snapshot.val() || {};

  for(let i = 1; i <= bikeCount; i++) {
    if(bikesData[i]) {
      const { person, bikeName, endTime, startTime } = bikesData[i];

      document.getElementById(`person${i}`).value = person;
      document.getElementById(`bike${i}`).value = bikeName;
      
      // تحويل الوقت لبداية الإيجار input type=time
      if(startTime) {
        const st = new Date(startTime);
        const sh = st.getHours().toString().padStart(2, '0');
        const sm = st.getMinutes().toString().padStart(2, '0');
        document.getElementById(`startTime${i}`).value = `${sh}:${sm}`;
      }

      updateCountdown(i, endTime, person, bikeName);
    } else {
      document.getElementById(`person${i}`).value = '';
      document.getElementById(`bike${i}`).value = '';
      document.getElementById(`startTime${i}`).value = '';
      document.getElementById(`duration${i}`).value = '';
      document.getElementById(`countdown${i}`).textContent = '-';

      if(timers[i]) {
        clearInterval(timers[i]);
        timers[i] = null;
      }
    }
  }
});
