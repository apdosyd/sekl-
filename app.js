// إعدادات Firebase
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
  const mins = parseInt(document.getElementById(`duration${i}`).value);

  if (!name || !bike || isNaN(mins) || mins <= 0) {
    alert("من فضلك املأ جميع الخانات بشكل صحيح");
    return;
  }

  const start = Date.now();
  const end = start + mins * 60 * 1000;

  database.ref("bikes/" + i).set({
    person: name,
    bikeName: bike,
    startTime: start,
    endTime: end
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
    countdownEl.textContent = `الوقت المتبقي: ${mins} دقيقة و ${secs} ثانية`;
  }

  tick();
  timers[i] = setInterval(tick, 1000);
}

database.ref("bikes").on('value', snapshot => {
  const bikesData = snapshot.val() || {};

  for(let i = 1; i <= bikeCount; i++) {
    if(bikesData[i]) {
      const { person, bikeName, endTime } = bikesData[i];

      document.getElementById(`person${i}`).value = person;
      document.getElementById(`bike${i}`).value = bikeName;

      updateCountdown(i, endTime, person, bikeName);
    } else {
      document.getElementById(`person${i}`).value = '';
      document.getElementById(`bike${i}`).value = '';
      document.getElementById(`duration${i}`).value = '';
      document.getElementById(`countdown${i}`).textContent = '-';

      if(timers[i]) {
        clearInterval(timers[i]);
        timers[i] = null;
      }
    }
  }
});