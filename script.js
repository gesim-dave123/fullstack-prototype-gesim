const getStarted = document.getElementById("get-started-btn");
const signUpBtn = document.getElementById("signUp-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const profileBtn = document.getElementById("profile-btn");

const firstName = document.getElementById("first-name").value;
const lastName = document.getElementById("last-name").value;
const emailInput = document.getElementById("register-email").value;
const passwordInput = document.getElementById("register-password").value;


document.addEventListener("DOMContentLoaded", () => {
  function setAuthenticated(isAuth, isAdmin = false) {
    document.body.classList.toggle("authenticated", isAuth);
    document.body.classList.toggle("not-authenticated", !isAuth);
    document.body.classList.toggle("is-admin", isAdmin);
  }

  function showPage(id) {
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  if (!document.querySelector(".page.active")) {
    const home =
      document.getElementById("home-section") ||
      document.querySelector(".page");
    if (home) home.classList.add("active");
  }

  if (getStarted) {
    getStarted.addEventListener("click", (e) => {
      e.preventDefault();
      showPage("register-section");
    });
  }

  window.setAuthenticated = setAuthenticated;
  window.showPage = showPage;
  window.login = () => setAuthenticated(true, false);
  window.logout = () => setAuthenticated(false, false);
  window.setAdmin = () => setAuthenticated(true, true);

  const loginForm = document.querySelector(".login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      setAuthenticated(true, false);
      alert("Demo: logged in — body classes updated.");
    });
  }
});
