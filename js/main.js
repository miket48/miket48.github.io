const apiAddress = "https://vacweekapi.gdza.xyz/";

function init(){
    if(!localStorage.getItem('token')){
        $('#myModal').modal('show');
        document.getElementById('createRoom').disabled = true;
    }else{
        replaceLogin();
        document.getElementById('createRoom').disabled = false;
    }
}

function createRoom(){    
    localStorage.setItem('isHost', true);
    window.location.href = './html/lobby.html'    
}

function joinRoom(){

    var room_id = $("#joinRoom").val();
    localStorage.setItem("roomId", room_id);
    localStorage.setItem('isHost', false);
    window.location.href = './html/lobby.html'
}

function connectDevice(){
    
    var room_id = $("#connectDevice").val();
    localStorage.setItem("roomId", room_id);

    window.location.href = './html/controller.html'
}

function onJoinRoomText() {
    var text = $("#joinRoom").val();
    if(localStorage.getItem('token'))
        $("#joinRoomBtn").attr("disabled", (text === ""));
}

function onConnectDeviceText() {
    var text = $("#connectDevice").val();
    if(localStorage.getItem('token'))
        $("#connectDeviceBtn").attr("disabled", (text === ""));
}

function navBar() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }

function openLogin(){
    $('#signupSection').collapse('hide');
    document.getElementById('emailLogin').value = '';
    document.getElementById('passwordLogin').value = '';
}

function openSignup(){
    $('#loginSection').collapse('hide');
    document.getElementById('emailSignup').value = '';
    document.getElementById('usernameSignup').value = '';
    document.getElementById('passwordSignup').value = '';
    document.getElementById('confirmPasswordSignup').value = '';
}

function login(){
    var email = document.getElementById('emailLogin').value.trim();
    var password = document.getElementById('passwordLogin').value.trim();

    login2(email, password);
}

function login2(email, password) {
    var data = JSON.stringify( {username: email, password: password} );

    //Send data to socket
    $.post({
        traditional: true,
        url: apiAddress + 'auth',
        contentType: 'application/json',
        data: data,
        dataType: 'json',
        success: function(data) { loginCallback(data); }
    } );

    localStorage.setItem('userId', email);
}

function loginCallback(data) {
    console.log(data);

    var token = data.jwt;

    if (token === undefined || token === null) {

        var server_err_msg = data.error;
        
        if (server_err_msg !== undefined && server_err_msg !== null) {
            alert(server_err_msg);
        } else {
            alert("The server did not respond.");
        }

        return;
    }

    localStorage.setItem('token', token);
    document.getElementById('createRoom').disabled = false;

    if(document.getElementById('joinRoom').value.trim() != ''){
        document.getElementById('joinRoomBtn').disabled = false;
    }
    if(document.getElementById('connectDevice').value.trim() != ''){
        document.getElementById('connectDeviceBtn').disabled = false;
    }

    $('#myModal').modal('hide');
    replaceLogin();
}

function signup(){
    var email = document.getElementById('emailSignup').value.trim();
    var username = document.getElementById('usernameSignup').value.trim();
    var password = document.getElementById('passwordSignup').value.trim();
    var confirm = document.getElementById('confirmPasswordSignup').value.trim();

    if(password !== confirm){
        alert('Passwords dont match!');
        document.getElementById('passwordSignup').value = '';
        document.getElementById('confirmPasswordSignup').value ='';
        return;
    }

    var data = JSON.stringify( {
        username: email,
        password: password,
        name: username
    });

    //Send data to socket
    $.post({
        traditional: true,
        url: apiAddress + 'register',
        contentType: 'application/json',
        data: data,
        dataType: 'json',
        success: function(data) { registerCallback(data); }
    } );
}

function registerCallback(data) {
    
    var success = data.success;

    if(success){

        var email = document.getElementById('emailSignup').value.trim();
        var password = document.getElementById('passwordSignup').value.trim();

        login2(email, password);

    }else{

        var error = data.error;

        if (error !== undefined && error !== null) {
            alert(error);
        } else {
            alert('Something went wrong in signup, please try again');
        }
    }
}

function replaceLogin(){
    var p = document.getElementById('right');
    p.innerHTML='<a style="float: right;" href="" id=""onclick="logout()">Logout</a>';
    var elem = document.getElementById('loginSignup');

    //Fix error here
    //elem.parentNode.removeChild(elem);
}

function replaceLogout(){
    var p = document.getElementById('right');
    p.innerHTML='<a style="float: right;" href="" id="loginSignup" data-toggle="modal" data-target="#myModal" >Login/Signup</a>';
    var elem = document.getElementById('logout');
    elem.parentNode.removeChild(elem);
}

function logout(){
    localStorage.removeItem('token');
    document.getElementById('createRoom').disabled = true;
    document.getElementById('joinRoom').disabled = true;
}