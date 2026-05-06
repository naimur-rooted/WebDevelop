const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();;
  if (email ==="" || password ==="") {
    alert("plese insert email & password!");
    e.preventDefault();
  } else {
    alert("login successful");
    window.location.href = "./index.html";
  }
});