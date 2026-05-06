const registrationBtn = document.getElementById("registration-btn");
registrationBtn.addEventListener('click', function(e){
    e.preventDefault()
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    if(name==="" || email==="" || password===""|| confirmPassword===""){
        alert("please insert the value!")
        e.preventDefault()
    }
    else{
        alert("registration successful!")
        window.location.href=('./login.html');
    } 
})

const loginBtn = document.getElementById("login-button");

loginBtn.addEventListener('click', function(e){
    window.location.href=('./login.html');
})