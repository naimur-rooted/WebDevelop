const loginBtn = document.getElementById("h-login-btn");

loginBtn.addEventListener("click", function (e) {
  e.preventDefault();
  window.location.href = "./login.html";
});

const registrationBtn = document.getElementById("h-registration-btn");

registrationBtn.addEventListener("click", function (e) {
  e.preventDefault();
  window.location.href = "./registration.html";
});

function displayProducts(productsArray) {
  const container = document.getElementById("products-container");
  container.innerHTML = "";
  productsArray.forEach((product) => {
    const cardDiv = document.createElement("div");

    cardDiv.className = "card bg-base-100 w-90 shadow-sm";

    cardDiv.innerHTML = `
        <figure>
        <img 
            src="${product.imageURL}" 
            alt="${product.productName}" 
            onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Default+Shoe+Image';"
        />
                </figure>
                <div class="card-body">
                    <h2 class="card-title">${product.productName}</h2>
                    <p>${product.Description}</p>
                     <p class="font-semibold text-2xl">${product.price}</p>

                    <div class="card-actions justify-between items-center">
                    <button class="btn btn-xs cart-btn">
                    <i class="fa-solid fa-cart-plus"></i>Add to Cart
                  </button>
                        <button class="btn btn-primary buy-btn">Buy Now</button>
                    </div>
                </div>
    `;

    container.appendChild(cardDiv);
  });
}

const allShoes = document.getElementById("all-shoes");

allShoes.addEventListener("click", function (e) {
  e.preventDefault();

  fetch("./data.json")
    .then((res) => res.json())
    .then((data) => displayProducts(data))
    .catch((error) => console.error("Error loading products:", error));
});

function displayProductss(productsArray) {
  const container = document.getElementById("products-containerr");
  container.innerHTML = "";
  productsArray.forEach((product) => {
    const cardDiv = document.createElement("div");

    cardDiv.className = "card bg-base-100 w-90 shadow-sm";

    cardDiv.innerHTML = `
        <figure>
        <img 
            src="${product.imageURL}" 
            alt="${product.productName}" 
            onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Default+Shoe+Image';"
        />
                </figure>
                <div class="card-body">
                    <h2 class="card-title">${product.productName}</h2>
                    <p>${product.Description}</p>
                    <p class="font-semibold text-2xl">${product.price}</p>

                    <div class="card-actions justify-between items-center">
                    <button class="btn btn-xs cart-btn">
                    <i class="fa-solid fa-cart-plus"></i>Add to Cart
                    </button>
                        <button class="btn btn-primary buy-btn">Buy Now</button>
                    </div>
                </div>
    `;

    container.appendChild(cardDiv);
  });
}

const allBags = document.getElementById("all-bags");

allBags.addEventListener("click", function (e) {
  e.preventDefault();

  fetch("./bag.json")
    .then((res) => res.json())
    .then((data) => displayProductss(data))
    .catch((error) => console.error("Error loading products:", error));
});

 
document.body.addEventListener("click", function (e) {
  // Check if the clicked element (or its closest parent) is a button with the class 'cart-btn'
  const clickedButton = e.target.closest(".cart-btn");

  if (clickedButton) {
    increaseCartCount();
    increaseCartCountt();
  }
});
function increaseCartCount() {
  const oldCart = document.getElementById("total-cart").innerText;
  const oldd = parseInt(oldCart);
  const neWvalue = oldd + 1;
  document.getElementById("total-cart").innerText = neWvalue;
}
function increaseCartCountt() {
  const oldCart = document.getElementById("total-cartt").innerText;
  const oldd = parseInt(oldCart);
  const neWvalue = oldd + 1;
  document.getElementById("total-cartt").innerText = neWvalue;
}



const buyButtons = document.querySelectorAll(".buy-btn");

buyButtons.forEach(button => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = "./orderpage.html";
  });
});



