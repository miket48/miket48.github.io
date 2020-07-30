const apiAddress = "https://vacweekapi.gdza.xyz/";
var socket;

let fullPath = [];
let pen;
let penColor = "#cf060a"; 
let canvas = document.getElementById("Drawing");
let ctx = canvas.getContext("2d");

function init(){
    
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    initServerConnection();

    //attach listener to guess enter event
    var guess = document.getElementById("guessSubmit");
    guess.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            guess.value = guess.value.trim();
            if(guess.value !== ''){
                document.getElementById('guesses').innerHTML += '&#13;&#10;'+guess.value;
            }
            guess.value = '';
        }
    });
}

function initServerConnection() {
    socket = io.connect(apiAddress, {
        query: `token=${localStorage.getItem('token')}`
    });

    var isHost = localStorage.getItem('isHost');

    if (isHost === "true") { //Is the host
        ng();

    } else { //Is not the host
        var room_id = localStorage.getItem('roomId');
        document.getElementById('startgame').disabled = true;
        jg(room_id);
    }


    clearGuesses();

    //Callback functions for socket communication
    
    list = [];
    
    //Callback for when the gamestate changes
    socket.on("gamestate", function(data) {
        console.log(data);

        //setting the room id
        document.getElementById("serverID").innerHTML = '<h3>'+ data.gameId +'</h3>';

        //setting the list of players
        clearPlayers();

        for(i = 0; i < data.players.length; i++) {
            if(data.players[i].active){
                document.getElementById("players").innerHTML += data.players[i].playerUID+ ' - ' + data.players[i].points + ' (active)' + '&#13;&#10;';
            }else{
                document.getElementById("players").innerHTML += data.players[i].playerUID+ ' - ' + data.players[i].points + '&#13;&#10;';
            }
        }
        if(list[list.length-1] !==  data.lastGuess.playerUID + ": " + data.lastGuess.guessMade){
            document.getElementById("guesses").innerHTML += data.lastGuess.playerUID + ": " + data.lastGuess.guessMade + '&#13;&#10;';
            list.push(data.lastGuess.playerUID + ": " + data.lastGuess.guessMade);
        }
    });

    //Callback for when there is drawdata
    socket.on("drawdata", function(data) {
        receiveData(data);
    });

    socket.on("error", function(err) {
        console.log("Error from server: " + err);
    });
}

function startGame() {
    socket.emit("startnewround");
    alert("starting round");
}

function ng() {
    socket.emit('newgame');
  }
  
function jg(gameid) {
  socket.emit('joingame', {gameid:gameid, devicetype:"client"});
}

function clearGuesses(){
    document.getElementById("guesses").innerHTML = 'Guesses Are Here:&#13;&#10;';
}

function clearPlayers(){
    document.getElementById('players').innerHTML = 'Players:&#13;&#10;';
}

function updateTimer(time){
    document.getElementById('timer').innerHTML = time;
}
function navBar() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }
function submitGuess(){
    var guess = document.getElementById("guessSubmit");
    guess.value = guess.value.trim();
    if(guess.value !== ''){
        document.getElementById('guesses').innerHTML += '&#13;&#10;'+guess.value;
    }
    guess.value = '';

    var guess_answer = guess.value.trim();

    socket.emit("guess", {guess_answer});
}


function receiveData(data_in){

    // let data_out = [dist[0], dist[1], pen, penColour];
    let dist = [data_in[0], data_in[1]];
    pen = data_in[2];
    penColor = data_in[3];

    if(pen == true){
        draw(dist);
    }else{
        laser(dist);
    }
}


function laser(dist_data){

    if(fullPath.length != 0)
    {
       draw(dist_data);
    }else{
     ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  
    let x = dist_data[0] + canvas.width/2;
    let y = dist_data[1] + canvas.height/2;
  
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, 2 * Math.PI);
    ctx.fillStyle = penColor;
    ctx.fill();
    ctx.closePath(); 

  }
  
function draw(dist_data){
    //Add new Coordinates to path only if current action is to draw
    //Else it is laser() calling draw and therefore the new coordinates should not be added to the draw path
    if(pen)
    {
      fullPath.push( [dist_data[0], dist_data[1], penColor] );
    }
    
    console.log(pen);
    console.log(fullPath);
    
    //Clear Canvas and Set Pen Size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    
    //Flag for start new Path  ( Pen Lift Indicator -> [-9999, -9999] )
    let breakPath = false;
  
    //Start Drawing Path
    ctx.beginPath();
    let x = fullPath[0][0] + canvas.width/2;
    let y = fullPath[0][1] + canvas.height/2;
    ctx.moveTo(x, y);
  
    for(var i =1  ; i < fullPath.length; i++){
        //Test for Pen Lifted
        if(fullPath[i][0] != -9999 && fullPath[i][1] != -9999) 
        {
            //Setup pen Color for the specific line
            ctx.strokeStyle = fullPath[i][2];

            if(breakPath)
            {
                //Pen was Lifted -> Start of new Path
                ctx.beginPath();
                let x = fullPath[i][0] + canvas.width/2;
                let y = fullPath[i][1] + canvas.height/2;
                ctx.moveTo(x, y);
            }else{
                //Pen not Lifted -> Continue current path
                x = fullPath[i][0] + canvas.width/2;
                y = fullPath[i][1] + canvas.height/2;
                ctx.lineTo(x, y);
            }

            //reset breakPath
            breakPath= false;
    
        }else{
            //Pen Lifted -> Set Flag & Close current Path
            breakPath = true;
            ctx.stroke();
            ctx.closePath();
        }
       
    }
    
    //Only if last action wasn't a pen penlift -> Close path
    //If last action was penlift -> Path already closed in for loop
    if(!breakPath)
    {
       ctx.stroke();
       ctx.closePath(); 
    }
}

function undoLastStroke(){
    // start at the end of the fullPath array
    // move back and delete until either the next -9999 or the first element
    if (fullPath.length > 0){
        // Last element in the fullPath array will always be -9999
        fullPath.pop();
        // Carry on popping until the next -9999
        while (fullPath.length > 0 && fullPath[fullPath.length-1][0] != -9999){
            fullPath.pop();
        }
    }
}
    
function eraseCanvas(){
    fullPath = [];
}