const displayTime = document.querySelector(".display-time");
// Time
function showTime() {
  let time = new Date();
  displayTime.innerText = time.toLocaleTimeString("en-US", { hour12: false });
  setTimeout(showTime, 1000);
}

showTime();

// Date
function updateDate() {
  let today = new Date();

  // return number
  let dayName = today.getDay();

  const dayWeek = [
    "Today is Sunday",
    "Today is Monday",
    "Today is Tuesday",
    "Today is Wednesday",
    "Today is Thursday",
    "Today is Friday",
    "Today is Saturday",
  ];
  // value -> ID of the html element
  const IDCollection = ["day"];
  // return value array with number as a index
  const val = [dayWeek[dayName]];
  for (let i = 0; i < IDCollection.length; i++) {
    document.getElementById(IDCollection[i]).firstChild.nodeValue = val[i];
  }
}

updateDate();
