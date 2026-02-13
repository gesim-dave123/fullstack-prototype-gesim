let currentUser = null; //A global variable: `let currentUser = null;`
const STORAGE_KEY = "ipt_demi_v1"; //A constant: `const STORAGE_KEY = "app_data";`

window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: [],
};

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      seedDatabase();
      return;
    }

    const parsed = JSON.parse(raw);

    // Basic validation
    if (!parsed.accounts || !parsed.departments) {
      seedDatabase();
      return;
    }

    window.db = parsed;
  } catch (error) {
    console.error("Storage corrupted. Resetting database.");
    seedDatabase();
  }
}


// Toast notification function
function showToast(message, type = "error") {
  // Remove existing toast if any
  const existingToast = document.querySelector(".toast-message");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;

  // Add to body
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

async function hashPassword(password) {
  // 1. Convert the string to a byte array (Uint8Array)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // 2. Hash the data using SHA-256
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);

  // 3. Convert the ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

function navigateTo(hash) {
  // A function `navigateTo(hash)` that updates
  window.location.hash = hash;
}

function handleRouting() {
  //A function `handleRouting()` that:
  const hash = window.location.hash || "#/";
  const route = hash.replace("#", "");

  const protectedRoutes = [
    "/profile",
    "/requests",
    "/departments",
    "/employees",
    "/accounts",
  ];
  const adminRoutes = ["/accounts", "/departments", "/employees"];

  const isAuth = !!currentUser;
  const isAdmin = currentUser?.role === "Admin";

  if (
    (protectedRoutes.includes(route) || adminRoutes.includes(route)) &&
    !isAuth
  ) {
    return navigateTo("#/login");
  }

  // Redirect logic: If authenticated but not admin tries to access admin routes
  if (adminRoutes.includes(route) && !isAdmin) {
    return navigateTo("#/");
  }

  // --- UI Update Logic ---

  // Hide all pages first
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Map routes to their Section IDs
  const pageMap = {
    "/": "home-section",
    "/login": "login-section",
    "/register": "register-section",
    "/profile": "profile-section",
    "/accounts": "accounts-section",
    "/departments": "departments-section",
    "/employees": "employees-section",
    "/requests": "requests-section",
    "/verify-email": "verify-email-section",
  };

  const targetId = pageMap[route] || "home-section";
  const targetPage = document.getElementById(targetId);

  if (targetPage) {
    targetPage.classList.add("active");
  }
}

async function handleRegistration(event) {
  event.preventDefault();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!firstName || !lastName || !email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    console.log("Invalid email format:", email);
    return;
  }

  // Password validation
  if (password.length <= 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  // Check if email already exists
  const existingEmail = window.db.accounts.find((u) => u.email === email);
  if (existingEmail) {
    showToast("Email already registered. Please login.", "error");
    return;
  }

  const hashedPassword = await hashPassword(password);
  console.log("Hashed password:", hashedPassword);
  // Create new user object
  const newUser = {
    firstName,
    lastName,
    email,
    hashedPassword,
    verified: false, // default
    role: email === "admin@example.com" ? "Admin" : "Employee",
  };

  window.db.accounts.push(newUser);
  saveToStorage();
  localStorage.setItem("unverified_email", email);

  console.log("New user registered:", newUser);
  showToast("Registration successful! Please verify your email.", "success");

  // Clear form
  document.getElementById("first-name").value = "";
  document.getElementById("last-name").value = "";
  document.getElementById("register-email").value = "";
  document.getElementById("register-password").value = "";

  // Navigate to verify email page
  setTimeout(() => {
    navigateTo("#/verify-email");
  }, 1500);
}

function verifyEmail(event) {
  event.preventDefault();

  const email = localStorage.getItem("unverified_email"); // Finds the email in the local storage

  const user = window.db.accounts.find((u) => u.email === email); // find a user whose email is the same as athe unverified one

  if (!user) {
    showToast("No unverified email found. Please register again.", "error");
    return;
  }

  user.verified = true;
  localStorage.removeItem("unverified_email");
  localStorage.setItem("verified_email", email);
  showToast("Verifying your email!.", "info");

  setTimeout(() => {
    document.getElementById("verify-alert").classList.remove("d-none");
    document.getElementById("login-alert").classList.remove("d-none");
    showToast("Successfully verified your email!.", "success");
  }, 1500);
}

function setAuthState(isAuthenticated, user = null) {
  const navUnauthenticated = document.getElementById("nav-unauthenticated");
  const navAuthenticated = document.getElementById("nav-authenticated");

  if (isAuthenticated && user) {
    currentUser = user;

    localStorage.setItem("auth_token", user.email);
    localStorage.setItem("currentUser", JSON.stringify(user));

    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");

    // Update navbar
    if (navUnauthenticated) navUnauthenticated.classList.add("d-none");
    if (navAuthenticated) navAuthenticated.classList.remove("d-none");

    if (user.role === "Admin") {
      document.body.classList.add("is-admin");
    }
  } else {
    currentUser = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("currentUser");

    document.body.classList.remove("authenticated", "is-admin");
    document.body.classList.add("not-authenticated");

    // Update navbar
    if (navUnauthenticated) navUnauthenticated.classList.remove("d-none");
    if (navAuthenticated) navAuthenticated.classList.add("d-none");
  }
}

// Handle Logout
function handleLogout(event) {
  event.preventDefault();
  localStorage.clear();
  setAuthState(false);
  showToast("You have been logged out", "success");
  setTimeout(() => {
    navigateTo("#/");
  }, 1000);
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }
  const user = window.db.accounts.find((u) => u.email === email && u.verified);

  if (!user) {
    showToast("User not found. Please register.", "error");
    return;
  }
  const passwordHash = await hashPassword(password);

  if (user.hashedPassword !== passwordHash) {
    showToast("Incorrect password", "error");
    console.log(
      "Password mismatch for user:",
      user.hashedPassword,
      passwordHash,
    );
    return;
  }

  // Set current user
  currentUser = user;
  localStorage.setItem("auth_token", user.email); // Simulating JWT token storage

  setAuthState(true, user);

  showToast(`Welcome back, ${user.firstName}!`, "success");

  // Update UI for authenticated state
  document.body.classList.remove("not-authenticated");
  document.body.classList.add("authenticated");

  if (user.role === "Admin") {
    document.body.classList.add("is-admin");
  }

  setTimeout(() => {
    setAuthState(true, user);
    navigateTo("#/profile");
  }, 1000);
}

window.addEventListener("hashchange", handleRouting);

document.addEventListener("DOMContentLoaded", async() => {

  await loadFromStorage();
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    setAuthState(true, currentUser);
  }

  // Set default hash if empty
  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  // Run routing
  handleRouting();
  localStorage.clear();

  // Setup Get Started button
  const getStartedBtn = document.getElementById("get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      navigateTo("#/register");
    });
  }

  // Setup Logout button

});
