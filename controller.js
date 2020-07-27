const sensor = new AbsoluteOrientationSensor({frequency: 60});
sensor.addEventListener("reading", (e) => handleSensor(e));
sensor.start();


let initPos;
let dist;
let calibrate = true;

document.body.addEventListener("click", () => {calibrate = true})

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
  draw(dist);
}   


function draw(dist_data){
  console.log(dist_data);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let x = dist_data[0] + window.innerWidth/2;
  let y = dist_data[1] + window.innerHeight/2;
  console.log(x);
  console.log(y);
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = "#f44336";
  ctx.fill();
  ctx.closePath();
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