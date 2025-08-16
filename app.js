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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function getLocalTime() {
  return new Date();
}

function formatTime12(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function updateCurrentTime() {
  const now = getLocalTime();
  document.getElementById('currentTime').textContent = `الوقت الحالي: ${formatTime12(now)}`;
}
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

const bikeCount = 50;
const timers = {};
const container = document.getElementById('bikesContainer');

// إنشاء واجهة العجل
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
    <button onclick="startRent(${i})" id="startBtn${i}">ابدأ الإيجار</button>
    <button onclick="stopRent(${i})" id="stopBtn${i}" style="background-color: #dc3545; margin-top: 5px;">إيقاف الإيجار</button>
    <div class="countdown" id="countdown${i}">الوقت المتبقي: -</div>
  `;
  container.appendChild(div);
}

// بدء الإيجار
function startRent(i) {
  const name = document.getElementById(`person${i}`).value.trim();
  const bike = document.getElementById(`bike${i}`).value.trim();
  const mins = parseInt(document.getElementById(`duration${i}`).value);

  if (!name || !bike || isNaN(mins) || mins <= 0) {
    alert("من فضلك املأ جميع الخانات بشكل صحيح");
    return;
  }

  const start = getLocalTime();
  const end = new Date(start.getTime() + mins * 60 * 1000);

  database.ref("bikes/" + i).set({
    person: name,
    bikeName: bike,
    startTime: start.getTime(),
    endTime: end.getTime()
  }).then(() => {
    console.log(`✅ تم بدء الإيجار للعجلة رقم ${i} (${bike}) بواسطة ${name}`);
  }).catch(err => {
    console.error("❌ خطأ أثناء الحفظ في Firebase:", err);
  });
}

// إيقاف الإيجار
function stopRent(i) {
  database.ref("bikes/" + i).remove()
    .then(() => {
      console.log(`🛑 تم إيقاف الإيجار للعجلة رقم ${i}`);
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الحذف من Firebase:", err);
    });
}

// تحديث العد التنازلي
function updateCountdown(i, endTime, person, bikeName) {
  const countdownEl = document.getElementById(`countdown${i}`);
  if (timers[i]) clearInterval(timers[i]);

  function tick() {
    const now = getLocalTime().getTime();
    let diff = Math.floor((endTime - now) / 1000);
    const returnTime = formatTime12(new Date(endTime));

    if (diff <= 0) {
      countdownEl.innerHTML = `
        انتهى وقت إيجار "<strong>${bikeName}</strong>" لـ "<strong>${person}</strong>"!<br>
        وقت الانتهاء: <strong>${returnTime}</strong>
      `;
      document.getElementById('alarm').play();
      clearInterval(timers[i]);
      enableInputs(i);
      return;
    }

    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    countdownEl.innerHTML = `
      الوقت المتبقي: <strong>${mins}</strong> دقيقة و <strong>${secs}</strong> ثانية<br>
      يرجع الساعة: <strong>${returnTime}</strong>
    `;
  }

  tick();
  timers[i] = setInterval(tick, 1000);
}

// تمكين الحقول
function enableInputs(i) {
  document.getElementById(`person${i}`).disabled = false;
  document.getElementById(`bike${i}`).disabled = false;
  document.getElementById(`duration${i}`).disabled = false;
  document.getElementById(`startBtn${i}`).disabled = false;
}

// تعطيل الحقول
function disableInputs(i) {
  document.getElementById(`person${i}`).disabled = true;
  document.getElementById(`bike${i}`).disabled = true;
  document.getElementById(`duration${i}`).disabled = true;
  document.getElementById(`startBtn${i}`).disabled = true;
}

// متابعة البيانات من Firebase
database.ref("bikes").on('value', snapshot => {
  const bikesData = snapshot.val() || {};
  console.log("📥 تحديث من Firebase:", bikesData);

  for (let i = 1; i <= bikeCount; i++) {
    if (bikesData[i]) {
      const { person, bikeName, endTime } = bikesData[i];
      document.getElementById(`person${i}`).value = person;
      document.getElementById(`bike${i}`).value = bikeName;
      disableInputs(i);
      updateCountdown(i, endTime, person, bikeName);
    } else {
      document.getElementById(`person${i}`).value = '';
      document.getElementById(`bike${i}`).value = '';
      document.getElementById(`duration${i}`).value = '';
      enableInputs(i);
      document.getElementById(`countdown${i}`).textContent = 'الوقت المتبقي: -';
      if (timers[i]) {
        clearInterval(timers[i]);
        timers[i] = null;
      }
    }
  }
});
