const usersRequest = new Request("https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users");
const tasksRequest = new Request("https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks");
let users = null;
let tasks = null;

function shiftWeek(numberOfWeeks) {
  let currentDay, dt;
  for (let i = 1; i <= 7; i++) {
    currentDay = document.getElementById("day"+i);
    dt = new Date(currentDay.dataset.date);
    dt.setDate(dt.getDate()+7*numberOfWeeks);
    currentDay.textContent = dt.toDateString();
    currentDay.dataset.date = dt.toLocaleDateString("en-US");
    document.querySelectorAll(".day[data-day='"+i+"'] .task").forEach(task => {
      if (task.dataset.date !== currentDay.dataset.date) {
        task.setAttribute("hidden", "");
      } else {
        task.removeAttribute("hidden");
      }
    });
  }
  currentWeek += numberOfWeeks;
}

const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");

backBtn.addEventListener("click", shiftWeek.bind(null, -1));
forwardBtn.addEventListener("click", shiftWeek.bind(null, 1));

let dt = new Date();
let currentWeek = 0;
const dayOffset = (dt.getDay() + 6) % 7;
dt.setDate(dt.getDate()-dayOffset);
for (let i = 1; i <= 7; i++) {
  const currentDay = document.getElementById("day"+i);
  currentDay.textContent = dt.toDateString();
  currentDay.dataset.date = dt.toLocaleDateString("en-US");
  dt.setDate(dt.getDate()+1);
}

function renderUsers() {
  const calendar = document.getElementById("calendar");
  for (const user of users) {
    const divToAdd = document.createElement("div");
    divToAdd.classList.add("assignee");
    divToAdd.dataset.userId = user.id;
    divToAdd.textContent = user.surname + " " + user.firstName;
    divToAdd.addEventListener("drop", drop_handler);
    divToAdd.addEventListener("dragover", dragover_handler);
    calendar.appendChild(divToAdd);
    for (let i = 0; i < 7; i++) {
      const divToAdd = document.createElement("div");
      divToAdd.classList.add("day");
      divToAdd.dataset.userId = user.id;
      divToAdd.dataset.day = i + 1;
      divToAdd.addEventListener("drop", drop_handler);
      divToAdd.addEventListener("dragover", dragover_handler);
      calendar.appendChild(divToAdd);
    }
  }
}

function renderTasks() {
  const backlogPane = document.getElementById("backlogPane");
  for (const task of tasks) {
    const executorId = Number(task.executor);
    const executorObj = users.find(el => el.id === executorId);
    renderTask(task, (executorId !== NaN && executorObj !== undefined));
  }
}

function renderTask(task, inCalendar = false) {
  const taskDiv = document.createElement("div");
  taskDiv.dataset.taskId = task.id;
  const taskSubject = document.createElement("p");
  taskSubject.textContent = task.subject;
  taskDiv.dataset.subject = task.subject;
  taskDiv.appendChild(taskSubject);
  taskDiv.classList.add("task");
  taskDiv.draggable = "true";
  taskDiv.addEventListener("dragstart", dragstart_handler);
  const startDate = new Date(task.planStartDate);
  const endDate = new Date(task.planEndDate);
  if (inCalendar === true) {
    const calendar = document.getElementById("calendar");
    for (let dt = startDate; dt <= endDate; dt.setDate(dt.getDate()+1)) {
      const dayOfWeek = ((dt.getDay() + 6) % 7) + 1;
      const calendarCell = calendar.querySelector(".day[data-user-id='" +
                           task.executor + "'][data-day='" + dayOfWeek +"']");
      const taskDivClone = taskDiv.cloneNode(true);
      taskDivClone.addEventListener("dragstart", dragstart_handler);
      taskDivClone.dataset.date = dt.toLocaleDateString("en-US");
      calendarCell.appendChild(taskDivClone);
      if (taskDivClone.dataset.date !== document.getElementById("day"+dayOfWeek).dataset.date) {
        taskDivClone.setAttribute("hidden", "");
      }
    }
    taskDiv.remove();
  } else {
    const taskDateRange = document.createElement("p")
    taskDateRange.textContent = task.planStartDate + " - " + task.planEndDate;
    taskDiv.appendChild(taskDateRange);
    backlogPane.appendChild(taskDiv);
  }
}

/* Drag & Drop handlers */
function dragstart_handler(ev) {
  ev.dataTransfer.setData("text", ev.target.dataset.taskId);
  ev.dataTransfer.effectAllowed = "move";
}

function dragover_handler(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = "move";
}

function drop_handler(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const task = tasks.find(el => el.id === data);
  task.executor = this.dataset.userId;
  const dateDiff = ((new Date(task.planEndDate)) - (new Date(task.planStartDate)).getTime())/86400000;
  const weekday = this.dataset.day;
  if (weekday) {
    const dtStr = document.getElementById("day"+weekday).dataset.date;
    task.planStartDate = dtStr;
    const dtObj = new Date(dtStr);
    dtObj.setDate(dtObj.getDate()+dateDiff);
    task.planEndDate = dtObj.toLocaleDateString("en-US");
  }
  document.querySelectorAll(".task[data-task-id='"+data+"']").forEach(el => {el.remove()});
  renderTask(task, true);
}

fetch(usersRequest)
  .then(response => response.json())
  .then(data => {
    users = data;
    renderUsers();
  })
  .catch(console.error);

fetch(tasksRequest)
  .then(response => response.json())
  .then(data => {
    tasks = data;
    console.log(tasks);
    renderTasks();
  })
  .catch(console.error);
