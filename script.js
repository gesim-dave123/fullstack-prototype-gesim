let currentUser = null;
const STORAGE_KEY = "ipt_demo_v1";

window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: [],
};

function saveToStorage() {
  //save the current state of the database to the local storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}
async function seedDatabase() {
  //seed the database with default data if local storage is empty or corrupted
  const adminPassword = await hashPassword("Password123!");

  window.db = {
    accounts: [
      {
        firstName: "System",
        lastName: "Admin",
        email: "admin@example.com",
        hashedPassword: adminPassword,
        verified: true,
        role: "Admin",
      },
    ],
    departments: [
      {
        id: 1,
        name: "Engineering",
        description: "Handles system development",
      },
      {
        id: 2,
        name: "HR",
        description: "Handles employee relations",
      },
    ],
    employees: [],
    requests: [],
  };
  saveToStorage();
}

async function loadFromStorage() {
  //load the database state from local storage, with error handling for corruption
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      await seedDatabase();
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
  //  A function `showToast(message, type)` that creates a toast notification with the given message and type (e.g., "success", "error", "info") and automatically disappears after 3 seconds.
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
  // A function `hashPassword(password)` that takes a plaintext password and returns a hashed version using the SHA-256 algorithm.
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
    showToast("Please login to access this page.", "error");
    return navigateTo("#/login");
  }

  // Redirect logic: If authenticated but not admin tries to access admin routes
  if (adminRoutes.includes(route) && !isAdmin) {
    showToast("Access denied. Admins only.", "error");
    return navigateTo("#/profile");
  }
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

  if (route === "/profile" && isAuth) {
    renderProfile();
  }
  if (route === "/accounts" && isAdmin) {
    renderAccounts();
  }
  if (route === "/departments" && isAdmin) {
    renderDepartments();
  }
  if (route === "/employees" && isAdmin) {
    renderEmployees();
  }
  if (route === "/requests" && isAuth) {
    renderRequests();
  }
}

async function handleRegistration(event) {
  // A function `handleRegistration(event)` that handles the registration form submission, including validation, password hashing, and storing the new user in the database.
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
    role: email,
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
  // A function `verifyEmail(event)` that simulates email verification by checking the unverified email in local storage, updating the user's verified status in the database, and providing appropriate feedback to the user.
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
    document.getElementById("verify-btn").classList.add("disabled");
    document.getElementById("login-alert").classList.remove("d-none");
    showToast("Successfully verified your email!.", "success");
  }, 1500);
}

function setAuthState(isAuthenticated, user = null) {
  // A function `setAuthState(isAuthenticated, user)` that updates the application's state based on whether the user is authenticated or not, including storing the JWT token in local storage, updating the UI (e.g., showing/hiding navbar links), and handling admin-specific UI changes.
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
  // A function `handleLogout(event)` that clears the authentication state, removes the JWT token from local storage, updates the UI to reflect the logged-out state, and redirects the user to the home or login page.
  event.preventDefault();
  // localStorage.clear();
  localStorage.removeItem("auth_token");
  localStorage.removeItem("currentUser");
  setAuthState(false);
  showToast("You have been logged out", "success");
  navigateTo("#/");
}

// Handle Login
async function handleLogin(event) {
  // A function `handleLogin(event)` that handles the login form submission, including validating the user's credentials against the stored accounts in the database, checking if the email is verified, hashing the entered password and comparing it with the stored hashed password, and setting the authentication state if successful.
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

function renderProfile() {
  // A function `renderProfile()` that displays the current user's profile information on the profile page, including their name, email, and role. It should also provide an option to edit the profile (except for email) and save changes to the database.
  currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    showToast("No user data found. Please login again.", "error");
    navigateTo("#/login");
    return;
  }
  // console.log("Rendering profile for user:", currentUser);
  const userName = currentUser.firstName + " " + currentUser.lastName;
  document.getElementById("profile-name").value = userName;
  document.getElementById("profile-role").value = currentUser.role;
}
function addAccountModal() {
  // A function `addAccountModal()` that opens the account form modal in "add" mode, resetting all fields and setting the appropriate button actions for saving a new account.
  // Reset form fields
  document.getElementById("account-firstname").value = "";
  document.getElementById("account-lastname").value = "";
  document.getElementById("account-email").value = "";
  document.getElementById("account-password").value = "";
  document.getElementById("account-role").value = "User";
  document.getElementById("account-verified").checked = false;

  // Enable all fields
  document.getElementById("account-password").disabled = false;
  document.getElementById("account-email").disabled = false;
  document.getElementById("account-role").disabled = false;
  document.getElementById("account-verified").disabled = false;

  // Reset button to add mode
  document.getElementById("save-account-btn").onclick = addAccount;

  // Show form
  document.getElementById("account-form").classList.remove("d-none");
}
function closeAccountForm() {
  document.getElementById("account-form").classList.add("d-none");
}

function openAddDepartmentForm() {
  // Reset form fields
  document.getElementById("department-form").classList.remove("d-none");
}

function closeDepartmentForm() {
  document.getElementById("department-form").classList.add("d-none");
  document.getElementById("department-name").value = "";
  document.getElementById("department-description").value = "";
}

async function addDepartment(event) {
  event.preventDefault();
  const name = document.getElementById("department-name").value.trim();
  const description = document
    .getElementById("department-description")
    .value.trim();

  if (!name || !description) {
    showToast("Please fill in all fields", "error");
    return;
  }
  const newDepartment = {
    name,
    description,
  };
  window.db.departments.push(newDepartment);
  saveToStorage();
  showToast("Department added successfully!", "success");
  document.getElementById("department-form").classList.add("d-none");
  renderDepartments();
  closeDepartmentForm();
}

async function editDepartment(index) {
  const department = window.db.departments[index];
  if (!department) {
    showToast("Department not found", "error");
    return;
  }

  // Store the index for save/delete operations
  window.currentEditDepartmentIndex = index;

  document.getElementById("department-name").value = department.name;
  document.getElementById("department-description").value =
    department.description;
  document.getElementById("department-form").classList.remove("d-none");
  document.getElementById("edit-department-btn").classList.remove("d-none");
  document.getElementById("add-department-btn").classList.add("d-none");
}

async function saveDepartment(event) {
  event.preventDefault();
  const index = window.currentEditDepartmentIndex;

  if (index === undefined) {
    showToast("Department not found", "error");
    return;
  }

  const name = document.getElementById("department-name").value.trim();
  const description = document
    .getElementById("department-description")
    .value.trim();

  if (!name || !description) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const editedDepartment = {
    ...window.db.departments[index],
    name,
    description,
  };

  window.db.departments[index] = editedDepartment;
  saveToStorage();
  showToast("Department updated successfully!", "success");
  document.getElementById("department-form").classList.add("d-none");
  renderDepartments();
  closeDepartmentForm();
}

async function deleteDepartment(event, index) {
  event.preventDefault();

  const department = window.db.departments[index];
  if (!department) {
    showToast("Department not found", "error");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete the "${department.name}" department?`,
    )
  ) {
    window.db.departments.splice(index, 1);
    saveToStorage();
    showToast("Department deleted successfully!", "success");
    document.getElementById("department-form").classList.add("d-none");
    renderDepartments();
    closeDepartmentForm();
  }
}
async function addAccount(event) {
  event.preventDefault();
  const firstName = document.getElementById("account-firstname").value.trim();
  const lastName = document.getElementById("account-lastname").value.trim();
  const email = document.getElementById("account-email").value.trim();
  const password = document.getElementById("account-password").value.trim();
  const role = document.getElementById("account-role").value;

  if (!firstName || !lastName || !email || !password || !role) {
    showToast("Please fill in all fields", "error");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }
  if (password.length <= 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }
  const existingEmail = window.db.accounts.find((u) => u.email === email);
  if (existingEmail) {
    showToast(
      "Email already registered. Please use a different email.",
      "error",
    );
    return;
  }
  const hashedPassword = await hashPassword(password);

  const newAccount = {
    firstName,
    lastName,
    email,
    hashedPassword,
    verified: true, // Admin-created accounts are auto-verified
    role,
  };
  window.db.accounts.push(newAccount);
  saveToStorage();
  showToast("Account created successfully!", "success");
  document.getElementById("account-form").classList.add("d-none");
  renderAccounts();

  closeAccountForm();
}

async function saveAccount(event, index) {
  event.preventDefault();
  const firstName = document.getElementById("account-firstname").value.trim();
  const lastName = document.getElementById("account-lastname").value.trim();
  const email = document.getElementById("account-email").value.trim();
  const role = document.getElementById("account-role").value;
  const verified = document.getElementById("account-verified").checked;

  if (!firstName || !lastName || !email || !role) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  const account = window.db.accounts[index];
  const oldEmail = account.email;

  if (email !== oldEmail) {
    const existingEmail = window.db.accounts.find((u) => u.email === email);
    if (existingEmail) {
      showToast(
        "Email already registered. Please use a different email.",
        "error",
      );
      return;
    }
  }

  const editedAccount = {
    ...account,
    firstName,
    lastName,
    email,
    verified,
    role,
  };

  window.db.accounts[index] = editedAccount;
  saveToStorage();
  showToast("Account updated successfully!", "success");
  document.getElementById("account-form").classList.add("d-none");
  renderAccounts();
  closeAccountForm();
}

async function resetPassword(event, index) {
  event.preventDefault();
  const account = window.db.accounts[index];
  if (!account) {
    showToast("Account not found", "error");
    return;
  }
  const newPassword = prompt("Enter new password for " + account.email);
  if (!newPassword) {
    showToast("Password reset cancelled", "info");
    return;
  }
  if (newPassword.length <= 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }
  const hashedPassword = await hashPassword(newPassword);
  account.hashedPassword = hashedPassword;

  saveToStorage();
  showToast("Password reset successfully!", "success");
}

async function deleteAccount(event, index) {
  event.preventDefault();
  const accountIndex = index !== undefined ? index : window.currentEditIndex;

  if (accountIndex === undefined) {
    showToast("Account not found", "error");
    return;
  }
  if (window.db.accounts[accountIndex].email === currentUser.email) {
    showToast("You cannot delete your own account", "error");
    return;
  }

  if (confirm("Are you sure you want to delete this account?")) {
    window.db.accounts.splice(accountIndex, 1);
    saveToStorage();
    showToast("Account deleted successfully!", "success");
    document.getElementById("account-form").classList.add("d-none");
    renderAccounts();
    closeAccountForm();
  }
}

async function editAccount(index) {
  addAccountModal();

  // Store the index for delete function to use
  window.currentEditIndex = index;

  const account = window.db.accounts[index];
  if (!account) {
    showToast("Account not found", "error");
    return;
  }
  const oldEmail = account.email;
  document.getElementById("account-firstname").value = account.firstName;
  document.getElementById("account-lastname").value = account.lastName;
  document.getElementById("account-email").value = account.email;
  document.getElementById("account-role").value = account.role;
  document.getElementById("account-password").value = ".........";
  document.getElementById("account-password").disabled = true;
  document.getElementById("account-verified").checked = account.verified;
  document.getElementById("save-account-btn").onclick = () =>
    saveAccount(event, index);

  if (account.email === currentUser.email) {
    document.getElementById("account-email").disabled = true;
    document.getElementById("account-role").disabled = true;
    document.getElementById("account-verified").disabled = true;
    document.getElementById("delete-account-btn").disabled = true;
  } else {
    document.getElementById("account-email").disabled = false;
    document.getElementById("account-role").disabled = false;
    document.getElementById("account-verified").disabled = false;
    document.getElementById("delete-account-btn").disabled = false;
  }
}
function renderAccounts() {
  const accountsTableBody = document.getElementById("accounts-table-body");
  accountsTableBody.innerHTML = "";
  window.db.accounts.forEach((account, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${account.firstName + " " + account.lastName}</td>
      <td>${account.email}</td>
      <td>${account.role}</td>
      <td>${account.verified ? "Yes" : "No"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-account-btn" data-index="${index}" onclick="editAccount(${index})">Edit</button>
        <button class="btn btn-sm btn-outline-warning reset-password-btn" data-index="${index}" onclick="resetPassword(event, ${index})">Reset Password</button>
        <button class="btn btn-sm btn-outline-danger delete-account-btn" data-index="${index}" onclick="deleteAccount(event, ${index})">Delete</button>
      </td>
    `;
    accountsTableBody.appendChild(row);
  });
}
function renderDepartments() {
  const departmentsTableBody = document.getElementById(
    "departments-table-body",
  );
  departmentsTableBody.innerHTML = "";
  window.db.departments.forEach((department, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${department.name}</td>
      <td>${department.description}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-department-btn" data-index="${index}" onclick="editDepartment(${index})">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-department-btn" data-index="${index}" onclick="deleteDepartment(event, ${index})">Delete</button>
      </td>
    `;
    departmentsTableBody.appendChild(row);
  });
}
// Helper function to populate User Email dropdown
function renderAccountsList() {
  const emailSelect = document.getElementById("employee-email");
  emailSelect.innerHTML = '<option value="">-- Select User --</option>';

  window.db.accounts.forEach((account) => {
    if (account.role === "User") {
      const option = document.createElement("option");
      option.value = account.email;
      option.textContent = `${account.firstName} ${account.lastName} (${account.email})`;
      emailSelect.appendChild(option);
    }
  });
}

// Helper function to populate Department dropdown
function renderDepartmentsList() {
  const deptSelect = document.getElementById("employee-department");
  deptSelect.innerHTML = '<option value="">-- Select Department --</option>';

  window.db.departments.forEach((dept, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = dept.name;
    deptSelect.appendChild(option);
  });
}

function renderEmployees() {
  const employeesTableBody = document.getElementById("employees-table-body");
  employeesTableBody.innerHTML = "";

  if (window.db.employees.length === 0) {
    employeesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No employees.
        </td>
      </tr>
    `;
    return;
  }

  window.db.employees.forEach((employee, index) => {
    const userEmail = employee.userEmail || "N/A";
    const deptName =
      employee.departmentIndex !== undefined
        ? window.db.departments[employee.departmentIndex]?.name || "N/A"
        : "N/A";
    const hireDate = employee.hireDate || "N/A";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${employee.id}</td>
      <td>${userEmail}</td>
      <td>${employee.position}</td>
      <td>${deptName}</td>
      <td>${hireDate}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-employee-btn" data-index="${index}" onclick="editEmployee(${index})">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-employee-btn" data-index="${index}" onclick="deleteEmployee(event, ${index})">Delete</button>
      </td>
    `;
    employeesTableBody.appendChild(row);
  });
}

function openAddEmployeeForm() {
  // Reset form fields
  document.getElementById("employee-id").value = "";
  document.getElementById("employee-email").value = "";
  document.getElementById("employee-position").value = "";
  document.getElementById("employee-department").value = "";
  document.getElementById("employee-hire-date").value = "";

  // Reset button to add mode
  document.getElementById("save-employee-btn").onclick = addEmployee;
  document.getElementById("save-employee-btn").textContent = "Save";
  document.getElementById("delete-employee-btn").classList.add("d-none");

  // Populate dropdowns
  renderAccountsList();
  renderDepartmentsList();

  // Show form
  document.getElementById("employee-form").classList.remove("d-none");
}

function closeEmployeeForm() {
  document.getElementById("employee-form").classList.add("d-none");
}

async function addEmployee(event) {
  event.preventDefault();

  const id = document.getElementById("employee-id").value.trim();
  const userEmail = document.getElementById("employee-email").value.trim();
  const position = document.getElementById("employee-position").value.trim();
  const departmentIndex = document.getElementById("employee-department").value;
  const hireDate = document.getElementById("employee-hire-date").value;

  if (!id || !userEmail || !position || departmentIndex === "" || !hireDate) {
    showToast("Please fill in all fields", "error");
    return;
  }

  // Validate that user email exists
  const userExists = window.db.accounts.find((acc) => acc.email === userEmail);
  if (!userExists) {
    showToast("User email does not exist in the system", "error");
    return;
  }

  // Check if employee ID already exists
  const existingId = window.db.employees.find((emp) => emp.id === id);
  if (existingId) {
    showToast(
      "Employee ID already exists. Please use a different ID.",
      "error",
    );
    return;
  }

  const newEmployee = {
    id,
    userEmail,
    position,
    departmentIndex: parseInt(departmentIndex),
    hireDate,
  };

  window.db.employees.push(newEmployee);
  saveToStorage();
  showToast("Employee created successfully!", "success");

  closeEmployeeForm();
  renderEmployees();
}

async function editEmployee(index) {
  const employee = window.db.employees[index];
  if (!employee) {
    showToast("Employee not found", "error");
    return;
  }

  // Store the index for save/delete operations
  window.currentEditEmployeeIndex = index;

  document.getElementById("employee-id").value = employee.id;
  document.getElementById("employee-email").value = employee.userEmail;
  document.getElementById("employee-position").value = employee.position;
  document.getElementById("employee-department").value =
    employee.departmentIndex;
  document.getElementById("employee-hire-date").value = employee.hireDate;

  // Populate dropdowns
  renderAccountsList();
  renderDepartmentsList();

  // Switch button to edit mode
  document.getElementById("save-employee-btn").onclick = () =>
    saveEmployee(event);
  document.getElementById("save-employee-btn").textContent = "Update";
  document.getElementById("delete-employee-btn").classList.remove("d-none");

  // Show form
  document.getElementById("employee-form").classList.remove("d-none");
}

async function saveEmployee(event) {
  event.preventDefault();

  const index = window.currentEditEmployeeIndex;
  if (index === undefined) {
    showToast("Employee not found", "error");
    return;
  }

  const userEmail = document.getElementById("employee-email").value.trim();
  const position = document.getElementById("employee-position").value.trim();
  const departmentIndex = document.getElementById("employee-department").value;
  const hireDate = document.getElementById("employee-hire-date").value;

  if (!userEmail || !position || departmentIndex === "" || !hireDate) {
    showToast("Please fill in all fields", "error");
    return;
  }

  // Validate that user email exists
  const userExists = window.db.accounts.find((acc) => acc.email === userEmail);
  if (!userExists) {
    showToast("User email does not exist in the system", "error");
    return;
  }

  const employee = window.db.employees[index];
  const editedEmployee = {
    ...employee,
    userEmail,
    position,
    departmentIndex: parseInt(departmentIndex),
    hireDate,
  };

  window.db.employees[index] = editedEmployee;
  saveToStorage();
  showToast("Employee updated successfully!", "success");

  closeEmployeeForm();
  renderEmployees();
}

async function deleteEmployee(event, index) {
  event.preventDefault();

  const employeeIndex =
    index !== undefined ? index : window.currentEditEmployeeIndex;

  if (employeeIndex === undefined) {
    showToast("Employee not found", "error");
    return;
  }

  const employee = window.db.employees[employeeIndex];
  if (!employee) {
    showToast("Employee not found", "error");
    return;
  }

  if (confirm(`Are you sure you want to delete employee "${employee.id}"?`)) {
    window.db.employees.splice(employeeIndex, 1);
    saveToStorage();
    showToast("Employee deleted successfully!", "success");

    closeEmployeeForm();
    renderEmployees();
  }
}

// ===== REQUESTS MANAGEMENT =====
function getStatusBadge(status) {
  const badges = {
    Pending: '<span class="badge bg-warning">Pending</span>',
    Approved: '<span class="badge bg-success">Approved</span>',
    Rejected: '<span class="badge bg-danger">Rejected</span>',
  };
  return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

function renderRequests() {
  const requestsTableBody = document.getElementById("requests-table-body");
  requestsTableBody.innerHTML = "";

  // Check if user is admin - show all requests, otherwise show only their requests
  const isAdmin = currentUser && currentUser.role === "Admin";
  const requestsToDisplay = isAdmin
    ? window.db.requests
    : window.db.requests.filter(
        (req) => req.employeeEmail === currentUser.email,
      );

  if (requestsToDisplay.length === 0) {
    const colspan = isAdmin ? 6 : 5;
    requestsTableBody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="text-center text-muted">
          No requests yet.
        </td>
      </tr>
    `;
    return;
  }

  requestsToDisplay.forEach((request) => {
    // Find the original index in the full requests array
    const originalIndex = window.db.requests.indexOf(request);

    const itemsList = request.items
      .map((item) => item.name + " (" + item.qty + ")")
      .join(", ");

    const row = document.createElement("tr");

    let actionsHTML = "";
    if (isAdmin) {
      // Admin can update status or delete
      actionsHTML = `
        <button class="btn btn-sm btn-outline-success update-request-btn" onclick="updateRequestStatus(event, ${originalIndex}, 'Approved')">
          <i class="bi bi-check-circle"></i> Approve
        </button>
        <button class="btn btn-sm btn-outline-danger update-request-btn ms-2" onclick="updateRequestStatus(event, ${originalIndex}, 'Rejected')">
          <i class="bi bi-x-circle"></i> Reject
        </button>
      `;
    } else {
      actionsHTML = `
        <button class="btn btn-sm btn-outline-danger delete-request-btn" onclick="deleteRequest(event, ${originalIndex})">Delete</button>
      `;
    }

    if (isAdmin) {
      row.innerHTML = `
        <td>${request.date}</td>
        <td>${request.type}</td>
        <td>${itemsList}</td>
        <td>${getStatusBadge(request.status)}</td>
        <td>${request.employeeEmail}</td>
        <td>${actionsHTML}</td>
      `;
    } else {
      row.innerHTML = `
        <td>${request.date}</td>
        <td>${request.type}</td>
        <td>${itemsList}</td>
        <td>${getStatusBadge(request.status)}</td>
        <td>${actionsHTML}</td>
      `;
    }
    requestsTableBody.appendChild(row);
  });
}

function addRequestItem() {
  const container = document.getElementById("itemsContainer");
  const itemCount = container.querySelectorAll(".item-row").length;

  const newRow = document.createElement("div");
  newRow.className = "row g-2 mb-2 align-items-center item-row";
  newRow.innerHTML = `
    <div class="col">
      <input type="text" class="form-control item-name" placeholder="Item name" required>
    </div>
    <div class="col-3">
      <input type="number" class="form-control item-qty" value="1" min="1" required>
    </div>
    <div class="col-auto">
      <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn" onclick="removeRequestItem(this)">×</button>
    </div>
  `;

  container.appendChild(newRow);
}

function removeRequestItem(button) {
  const container = document.getElementById("itemsContainer");
  const itemRows = container.querySelectorAll(".item-row");

  // Don't allow removing the last item
  if (itemRows.length > 1) {
    button.closest(".item-row").remove();
  } else {
    showToast("You must have at least one item", "error");
  }
}

async function submitRequest(event) {
  event.preventDefault();

  const type = document.getElementById("request-type").value;

  if (!type) {
    showToast("Please select a request type", "error");
    return;
  }

  // Collect items
  const items = [];
  document.querySelectorAll(".item-row").forEach((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = parseInt(row.querySelector(".item-qty").value);

    if (name && qty > 0) {
      items.push({ name, qty });
    }
  });

  // Validate at least one item
  if (items.length === 0) {
    showToast("Please add at least one item to your request", "error");
    return;
  }

  // Create new request
  const today = new Date().toISOString().split("T")[0];
  const newRequest = {
    type,
    items,
    status: "Pending",
    date: today,
    employeeEmail: currentUser.email,
  };

  window.db.requests.push(newRequest);
  saveToStorage();
  showToast("Request submitted successfully!", "success");

  // Close modal and reset form
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("requestModal"),
  );
  if (modal) {
    modal.hide();
  }
  document.getElementById("request-form").reset();

  // Reset items to single row
  const container = document.getElementById("itemsContainer");
  container.innerHTML = `
    <div class="row g-2 mb-2 align-items-center item-row">
      <div class="col">
        <input type="text" class="form-control item-name" placeholder="Item name" required>
      </div>
      <div class="col-3">
        <input type="number" class="form-control item-qty" value="1" min="1" required>
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-sm btn-outline-success add-item-btn" onclick="addRequestItem()">+</button>
      </div>
    </div>
  `;

  renderRequests();
}

async function deleteRequest(event, index) {
  event.preventDefault();

  const request = window.db.requests[index];
  if (!request) {
    showToast("Request not found", "error");
    return;
  }

  if (
    confirm(
      "Are you sure you want to delete this " + request.type + " request?",
    )
  ) {
    window.db.requests.splice(index, 1);
    saveToStorage();
    showToast("Request deleted successfully!", "success");
    renderRequests();
  }
}

async function updateRequestStatus(event, index, newStatus) {
  event.preventDefault();

  const request = window.db.requests[index];
  if (!request) {
    showToast("Request not found", "error");
    return;
  }

  const statusText = newStatus === "Approved" ? "approved" : "rejected";
  if (
    confirm(
      `Are you sure you want to ${statusText} this ${request.type} request?`,
    )
  ) {
    request.status = newStatus;
    saveToStorage();
    showToast(`Request ${statusText} successfully!`, "success");
    renderRequests();
  }
}

window.addEventListener("hashchange", handleRouting);

document.addEventListener("DOMContentLoaded", async () => {
  
  await loadFromStorage();
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    setAuthState(true, currentUser);
  }

  handleRouting();
});
