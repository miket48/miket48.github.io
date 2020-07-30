const apiAddress = "https://vacweekapi.gdza.xyz/";
var socket;

let fullPath = [];
let pen;
let penColor = "#cf060a"; 
let canvas = document.getElementById("Drawing");
let ctx = canvas.getContext("2d");
let roundTimer = null;
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
            submitGuess();
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
    
    var list = [];
    var prevTime = null;
    var prevActivePlayer = null;

    //Callback for when the gamestate changes
    socket.on("gamestate", function(data) {
        console.log(data);

        //setting the room id
        document.getElementById("serverID").innerHTML = "<h3 class='shadowheading2'>Server ID: "+ data.gameId +'</h3>';

        //setting the list of players
        clearPlayers();
        
        for(i = 0; i < data.players.length; i++) {
            var controller =' (*)';
            if(data.players[i].controller!='') {
                controller = ' (Ready)'
            }

            if (data.gameStarted) {
                controller = '';
                document.getElementById('startgame').disabled = true;
            }
                
            if((data.currentPlayer != null || data.currentPlayer != undefined) && data.currentPlayer.playerUID === data.players[i].playerUID){
                document.getElementById("players").innerHTML += data.players[i].playerUID+' - ' + data.players[i].points + controller + ' (active)&#13;&#10;';
            }else{
                document.getElementById("players").innerHTML += data.players[i].playerUID+ ' - ' + data.players[i].points + controller + '&#13;&#10;';
            }
        }

        if (data.turnStartTime != prevTime) {
            //Start new timer
            prevTime = data.turnStartTime;
            startTimer();

            document.getElementById("guesses").innerHTML += "&#13;&#10;====ROUND " + data.roundNumber + " (" + data.currentPlayer.playerUID + ")====&#13;&#10;";
        }

        if(list[list.length-1] !== (data.lastGuess.playerUID + ": " + data.lastGuess.guessMade) && data.lastGuess.playerUID != ''){
            document.getElementById("guesses").innerHTML += ""+data.lastGuess.playerUID + ": " + data.lastGuess.guessMade + (data.lastGuess.correct? " (correct)": "") + '&#13;&#10;';
            list.push(data.lastGuess.playerUID + ": " + data.lastGuess.guessMade);
            var box = document.getElementById('guesses');
            box.scrollTop = box.scrollHeight;
        }

        if ((data.currentPlayer != null || data.currentPlayer != undefined) && data.currentPlayer.playerUID === localStorage.getItem("userId")) {
            document.getElementById('guessSubmit').disabled = true;
            document.getElementById('guessSubmitBtn').disabled = true;
        }else {
            document.getElementById('guessSubmit').disabled = false;
            document.getElementById('guessSubmitBtn').disabled = false;
        }

        if ((data.currentPlayer != null || data.currentPlayer != undefined) && data.currentPlayer.playerUID !== prevActivePlayer) {
            clearUI();
            prevActivePlayer = data.currentPlayer.playerUID;
        }

        if (data.gameEnded) {
            document.getElementById('startgame').disabled = false;
            clearInterval(roundTimer);
            document.getElementById('guessSubmit').disabled = true;
            document.getElementById('guessSubmitBtn').disabled = true;

            document.getElementById("guesses").innerHTML = "YOUR GAME HAS ENDED CLICK ON START GAME TO START AGAIN.";
        }

        if (data.roundNumber == 0) {
            document.getElementById("lobbyRound").innerHTML = "<h3 class='shadowheading2'>Not started</h3>";
        } else {
            document.getElementById("lobbyRound").innerHTML = "<h3 class='shadowheading2'>Round: " + data.roundNumber + "</h3>";
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

//Used to clear the UI when a new turn is started
function clearUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fullPath = [];
    clearInterval(roundTimer);
    updateTimer(0);
}

function startTimer(){
    let timeLeft = 60
    roundTimer = setInterval(() => {
        timeLeft--;

        if(timeLeft <= 0){
            clearInterval(roundTimer);
            document.getElementById('guessSubmit').disabled = true;
            document.getElementById('guessSubmitBtn').disabled = true;
        }
        updateTimer(timeLeft);
        
    }, 1000);
}

function startGame() {    
    clearUI();
    clearPlayers();
    socket.emit("startnewround");
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
    var guess_answer = guess.value;

    if(guess.value == ''){
        return;
    }
    guess.value = '';
    

    socket.emit("guess", {"guess":guess_answer});
}


function receiveData(data_in){

    // let data_out = [dist[0], dist[1], pen, penColour, clear, undo];
    console.log(data_in)
    let dist = [data_in[0], data_in[1]];
    pen = data_in[2];
    penColor = data_in[3];
    if (data_in[4]){
        console.log("clearing canvas");
        eraseCanvas();
    }
    else if (data_in[5]){
        console.log("undoing last stroke");
        undoLastStroke();
    }

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
     ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        // if (fullPath[0] = -9999){
        //     console.log("-9999 in pen");
        // }else{
        //     console.log("not breaky time");
        // }
    }
    
    // console.log(pen);
    // console.log(fullPath);
    
    //Clear Canvas and Set Pen Size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;
    
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