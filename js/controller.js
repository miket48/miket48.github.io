// const { start } = require("repl");

const apiAddress = "https://vacweekapi.gdza.xyz/";

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 30;
const ALERT_THRESHOLD = 10;

const COLOR_CODES = {
  info: {
    color: "green"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

const TIME_LIMIT = 60;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
//let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

const sensor = new AbsoluteOrientationSensor({frequency: 60});
sensor.addEventListener("reading", (e) => handleSensor(e));
let calibrate = true;
let stopDraw = false;
let pen = false;
let isClear = false;
let isUndo = false;
let viewLaser = false;
let initPos;
let dist;
let colourPen;
let chooseTimer = null;
var socket;
function init(){
    
    initServerConnection();
     //('#colorpicker').farbtastic('#color'); ;
     //console.log(  $('#colorpicker').farbtastic('#color'));
     colourPen = document.getElementById("color").value ;

    
    //  $('.btn-primary').css('btn-primary', "hover");
    //  $('.btn-primary').css('btn-primary', "active");
    //  $('.btn-primary').css('btn-primary', "visited");
    //  $('.bg-color').css('background-color', colourPen.toRGBA().toString());
    //  document.getElementById("color-button").style.backgroundColor = colourPen+ " !important";

    console.log(colourPen);
   
    choice[0] = "apple";
    choice[1] = "pear";
    choice[2] = "fig";
    // disable();
}

function initServerConnection() {
    socket = io.connect(apiAddress, {
        query: `token=${localStorage.getItem('token')}`
    });

    var room_id = localStorage.getItem('roomId');
    jg(room_id);

    //Callback functions for socket communication
    socket.on("wordoptions", function(data) {
        console.log(data);
        startFullRound(data.options);
    });

    socket.on("gamestate", function(data) {
        console.log(data);

        if (!data.isWordSet && (data.currentPlayer != null || data.currentPlayer != undefined) && data.currentPlayer.playerUID === localStorage.getItem("userId")) {
            console.log("IT IS MY TURN");
            enable();
            socket.emit("getwordoptions");
            //startFullRound(["myword1", "myword2", "myword3"]);
        }
    });
}


function jg(gameid) {
    socket.emit('joingame', {gameid:gameid, devicetype:"controller"});
  }


function onTimesUp() {
  disable();
  sensor.stop();
}

function startTimer() {
    var timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;
    document.getElementById("base-timer-label").innerHTML = formatTime(
      timeLeft
    );
    setCircleDasharray();
    setRemainingPathColor(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      onTimesUp();
    }
  }, 1000);
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function setRemainingPathColor(timeLeft) {
  const { alert, warning, info } = COLOR_CODES;
  if (timeLeft <= alert.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(warning.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(alert.color);
  } else if (timeLeft <= warning.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(warning.color);
  } else{
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(info.color);
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}

function disable() {
  document.getElementById("disableOverlay").style.display = "block";
}

function enable() {
  document.getElementById("disableOverlay").style.display = "none";
}

function openChoose() {
  document.getElementById("chooseOverlay").style.display = "block";
}

function closeChoose() {
  document.getElementById("chooseOverlay").style.display = "none";
}

function navBar() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

function choseOption(id){
  clearInterval(chooseTimer);
  document.getElementById('chosenWord').innerHTML = document.getElementById(id).innerHTML;

  var chosenWord = document.getElementById('chosenWord').innerHTML;
  alert("chosenword: " + chosenWord);

  socket.emit("makechoice", {"choice":chosenWord});

  closeChoose();
  startDrawing();
}

function leaveGame(){
  window.location.href = './../index.html';
}

function logout(){
  localStorage.removeItem('token');
  leaveGame();
}

function startFullRound(choice){
  enable();
  startChosing(choice);
}

function startDrawing(){
  //start timer, on timer end, disable buttons and whatever
  startTimer();
  sensor.start();
}

function handleSensor(e){  
  let quaternion = e.target.quaternion;
  let angles = toEuler(quaternion);

  if(calibrate){
    initPos = angles;
    calibrate = false;
    console.log("recalibrated")
  }
  
  dist = angles.map((angle, i) => calcDist(angle, initPos[i]));
  // console.log(dist);
  // array will be made of [x, y, isPen, colour, clear, undo]
  let penColour = document.getElementById("color").value; 
  let data_out = [dist[0], dist[1], pen, penColour, false, false];
  if (isClear){
    data_out[4] = true;
    isClear = false;
  }
  else if (isUndo){
    data_out[5] = true;
    isUndo = false;
  }
  if (stopDraw){
    data_out[0] = -9999;
    data_out[1] = -9999;
    data_out[2] = true;
    stopDraw = false;
    
  }
  console.log(data_out);
  //send to_send
  socket.emit("drawdata", data_out);
}

function toEuler(q) {
  let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
  let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
  let roll = Math.atan2(sinr_cosp, cosr_cosp);

  let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
  let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
  let yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [yaw, roll];
}


function calcDist(angle, initAngle) {
  angle = (angle - initAngle) * (180 / Math.PI);
  angle = angle < 0 ? angle + 360 : angle;
  angle = angle > 180 ? angle - 360 : angle;

  // the 'number' value is the virtual distance from the phone to the canvas
  // can also be viewed as the sensitivity
  let dist = Math.round(-400 * Math.tan(angle * (Math.PI / 180)));
  return dist;
}


function startChosing(choice){
  //create overlay, fill buttons, start timer, randomly chose after time, then close overlay
  openChoose();
  document.getElementById('choice-1').innerHTML = choice[0];
  document.getElementById('choice-2').innerHTML = choice[1];
  document.getElementById('choice-3').innerHTML = choice[2];
  var choosingTime = 10;
  chooseTimer = setInterval(function(){
    choosingTime--;
    document.getElementById('chooseTimer').innerHTML =choosingTime;
    if(choosingTime==0){
      var random = Math.floor(Math.random() * 3)+1;
      if(random == '1'){
        choseOption("choice-1");
      }else if(random == '2'){
        choseOption("choice-2");
      }else{
        choseOption("choice-3");
      }
    }
    
  },1000);
}

//The clear button
function canvasClear(){
  isClear = true;
}

function flipCalibrate(){
  calibrate = true;
}


function undoDraw(){
  isUndo = true;
}