# Random Password Generator

A secure random password generator built with **HTML5, CSS3, and JavaScript**.
This project is part of my Web Development Internship at **Veda Technology** (Task 17).


## 📌 About the Project

Users choose a password length and the types of characters to include. The password is generated instantly and can be copied with one click. Everything runs in the browser, and no password is ever saved or sent anywhere.

## 🎯 Objective

To practice checkboxes, string building, and randomization logic.

## ✨ Features

- Length slider and number input, kept in sync (4 to 64 characters)
- Checkboxes for uppercase, lowercase, numbers, and symbols
- Password updates instantly when any option changes
- Guarantees at least one character from every selected type
- Option to avoid look-alike characters (`O 0 l 1 I`)
- Copy-to-clipboard button with a confirmation message
- Show / hide password button
- Strength meter based on entropy (bits of randomness)
- Handles the case where no option is selected
- Responsive layout (side by side on desktop, stacked on mobile)

## 🧠 How It Works

**1. Build a character pool from the selected options**

```js
const sets = getSelectedSets(options);   // only the ticked types
const pool = sets.join("");              // one combined pool
```

**2. Pick one character from each selected type, then fill the rest from the pool**

```js
const chars = sets.map(randomChar);
while (chars.length < length) chars.push(randomChar(pool));
```

**3. Shuffle** so the guaranteed characters are not always at the start (Fisher-Yates shuffle).

**4. Handle an empty selection** by returning `null` and showing a message instead of a password.

### Why not `Math.random()`?

`Math.random()` is a predictable pseudo-random generator, so it is **not cryptographically secure**. This project uses `crypto.getRandomValues()`, which takes its randomness from the operating system. It also uses rejection sampling to avoid modulo bias, so every character has an equal chance of being picked.

### Strength meter

Entropy in bits = `length × log2(pool size)`

| Entropy | Strength |
|---|---|
| Below 40 bits | Very weak |
| 40 – 59 bits | Weak |
| 60 – 79 bits | Good |
| 80 – 99 bits | Strong |
| 100 bits or more | Very strong |

## 🛠️ Technologies Used

- HTML5 (range input, checkboxes, `<output>`, `<fieldset>`)
- CSS3 (Grid, Flexbox, custom checkboxes and slider)
- JavaScript (DOM, events, string building, Web Crypto API, Clipboard API)

## 📚 What I Learned

- Building a character pool dynamically from checkbox choices
- Why `Math.random()` is not safe for passwords
- Using `crypto.getRandomValues()` and avoiding modulo bias
- Shuffling an array with Fisher-Yates
- Syncing a slider and a number input
- Handling edge cases such as an empty selection
- Copying text with the Clipboard API

## 📁 Project Structure

```
password-generator/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 🚀 How to Run

1. Download or clone this repository.
2. Open the folder.
3. Double-click `index.html` to open it in your browser.

## 🔒 Privacy

Passwords are created in your browser. Nothing is stored or sent to any server.

## 👩‍💻 Author

**Priya Vijay Tambe**
