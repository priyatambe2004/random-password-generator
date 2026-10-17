/* ---------- Character sets ---------- */
const CHARSETS = {
  upper:   "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower:   "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?"
};
const LOOK_ALIKE = /[O0oIl1|]/g; // characters that are easy to mix up

/* ---------- Secure randomness ----------
   Math.random() is fast but NOT cryptographically secure: it is a predictable
   pseudo-random generator, so someone who sees enough outputs can work out
   what comes next. For passwords we use crypto.getRandomValues(), which gets
   its randomness from the operating system. */
function secureRandomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max; // avoids "modulo bias"
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit); // throw away values that would favour small numbers
  return buffer[0] % max;
}

function randomChar(characters) {
  return characters[secureRandomInt(characters.length)];
}

// Fisher-Yates shuffle, so the guaranteed characters are not always at the start
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ---------- Building the pool and the password ---------- */
// Returns the list of selected character sets (after removing look-alikes if asked)
function getSelectedSets(options) {
  const sets = [];
  for (const key of ["upper", "lower", "numbers", "symbols"]) {
    if (!options[key]) continue;
    let chars = CHARSETS[key];
    if (options.avoidSimilar) chars = chars.replace(LOOK_ALIKE, "");
    sets.push(chars);
  }
  return sets;
}

// Returns a password string, or null when no option is selected
function generatePassword(length, options) {
  const sets = getSelectedSets(options);
  if (sets.length === 0) return null;                 // empty selection

  const pool = sets.join("");                         // the combined character pool
  const chars = sets.map(randomChar);                 // at least one from every chosen type
  while (chars.length < length) chars.push(randomChar(pool));
  return shuffle(chars).join("");
}

// Entropy in bits = length x log2(pool size). Higher means harder to guess.
function calcEntropy(length, options) {
  const poolSize = getSelectedSets(options).join("").length;
  return poolSize === 0 ? 0 : length * Math.log2(poolSize);
}

function getStrength(bits) {
  if (bits < 40) return { level: 1, label: "Very weak" };
  if (bits < 60) return { level: 2, label: "Weak" };
  if (bits < 80) return { level: 3, label: "Good" };
  if (bits < 100) return { level: 4, label: "Strong" };
  return { level: 5, label: "Very strong" };
}

/* ---------- Page elements ---------- */
const $ = (id) => document.getElementById(id);
const slider = $("length-slider"), numberInput = $("length-number");
const passwordEl = $("password"), messageEl = $("message"), toastEl = $("toast");
const copyBtn = $("copy"), visibilityBtn = $("toggle-visibility");

let currentPassword = "";
let hidden = false;
let toastTimer;

function readOptions() {
  return {
    upper: $("opt-upper").checked,
    lower: $("opt-lower").checked,
    numbers: $("opt-numbers").checked,
    symbols: $("opt-symbols").checked,
    avoidSimilar: $("opt-similar").checked
  };
}

/* ---------- Showing results ---------- */
function showPassword() {
  passwordEl.classList.remove("placeholder");
  passwordEl.textContent = hidden ? "•".repeat(currentPassword.length) : currentPassword;
}

function updateStrength(length, options) {
  const bits = currentPassword ? calcEntropy(length, options) : 0;
  if (!currentPassword) {
    $("strength-label").textContent = "–";
    $("meter").dataset.level = "0";
    $("entropy").textContent = "";
    return;
  }
  const strength = getStrength(bits);
  $("strength-label").textContent = strength.label;
  $("meter").dataset.level = strength.level;
  $("entropy").textContent = `About ${Math.round(bits)} bits of randomness`;
}

function generate() {
  const length = Number(slider.value);
  const options = readOptions();
  const password = generatePassword(length, options);
  messageEl.textContent = "";

  if (password === null) {   // handle the "nothing selected" case
    currentPassword = "";
    passwordEl.textContent = "Choose at least one character type";
    passwordEl.classList.add("placeholder");
    messageEl.textContent = "Select at least one option to generate a password.";
    copyBtn.disabled = true;
  } else {
    currentPassword = password;
    copyBtn.disabled = false;
    showPassword();
  }
  updateStrength(length, options);
}

/* ---------- Length controls (slider and number box stay in sync) ---------- */
function updateSliderFill() {
  const min = Number(slider.min), max = Number(slider.max);
  slider.style.setProperty("--fill", ((slider.value - min) / (max - min)) * 100 + "%");
}

slider.addEventListener("input", () => {
  numberInput.value = slider.value;
  updateSliderFill();
  generate();
});

numberInput.addEventListener("input", () => {
  const value = Number(numberInput.value);
  if (Number.isInteger(value) && value >= 4 && value <= 64) {
    slider.value = value;
    updateSliderFill();
    generate();
  }
});

// When the person leaves the box, fix values that are too small, too large or empty
numberInput.addEventListener("change", () => {
  let value = Math.round(Number(numberInput.value)) || 16;
  value = Math.min(64, Math.max(4, value));
  numberInput.value = value;
  slider.value = value;
  updateSliderFill();
  generate();
});

/* ---------- Other events ---------- */
document.querySelectorAll(".check input").forEach((box) => box.addEventListener("change", generate));
$("generate").addEventListener("click", generate);

visibilityBtn.addEventListener("click", () => {
  hidden = !hidden;
  visibilityBtn.setAttribute("aria-pressed", String(hidden));
  visibilityBtn.setAttribute("aria-label", hidden ? "Show password" : "Hide password");
  visibilityBtn.textContent = hidden ? "👁️" : "🙈";
  if (currentPassword) showPassword();
});

/* ---------- Copy to clipboard ---------- */
function showToast(message) {
  toastEl.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.textContent = ""), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea"); // fallback for older browsers
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

copyBtn.addEventListener("click", async () => {
  if (!currentPassword) return;
  showToast((await copyText(currentPassword)) ? "Password copied!" : "Could not copy. Please select it manually.");
});

/* ---------- Start ---------- */
updateSliderFill();
generate();
