const SHEET_URL = "https://script.google.com/macros/s/AKfycbxvua5PVud-r2VIw0u52Lo7wB7nQUPCW9UBsrnJx61BufpsepMnUHmiAdM8Ja4oXfme/exec";
let questions = [];
let usedQuestions = [];
let currentQuestion = null;
let timeLeft = 30;
let timerInterval;
let giftValues = [];
let resultTimeout;
let usedSpecialGift = false;

// Audio effects
const sounds = {
    tick: new Audio("tick.mp3"),
    clap: new Audio("clap.mp3"),
    bigClap: new Audio("big-clap.mp3"),
    ohNo: new Audio("oh-no.mp3"),
    suspense: new Audio("suspense.mp3"),
    fireworks: new Audio("fireworks.mp3")
};

// Màu sắc của đáp án
const answerColors = ['#FFB6C1', '#98FB98', '#87CEFA', '#DDA0DD'];

async function fetchData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Không thể tải dữ liệu!");
        const data = await response.json();

        if (data.length >= 3) {  // Kiểm tra có đủ dữ liệu
            questions = data.slice(2);
            const values = data[1].slice(6, 12).map(value => isNaN(value) ? value : Number(value));
            const probabilities = data[2].slice(6, 12).map(p => isNaN(p) ? 0 : Number(p));

            giftValues = generateGiftPool(values, probabilities);
        } else {
            throw new Error("Dữ liệu không đủ!");
        }
        startQuiz();
    } catch (error) {
        document.getElementById("question").innerHTML = `<span style="color:red;">Lỗi tải câu hỏi!</span>`;
        alert(`Lỗi: ${error.message}`);
    }
}

// Tạo danh sách quà dựa trên tỷ lệ
function generateGiftPool(values, probabilities) {
    let pool = [];
    for (let i = 0; i < values.length; i++) {
        let count = Math.round(probabilities[i]); // Lấy số lượng tương ứng với %
        for (let j = 0; j < count; j++) {
            pool.push(values[i]);
        }
    }
    return pool;
}

function startQuiz() {
    clearTimeout(resultTimeout);
    clearInterval(timerInterval);
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("gift-container").style.display = "none";

    const availableQuestions = questions.filter(q => !usedQuestions.includes(q[0]));
    if (availableQuestions.length === 0) {
        usedQuestions = [];
        return startQuiz();
    }

    currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.push(currentQuestion[0]);

    document.getElementById("question").innerHTML = currentQuestion[0];

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    document.getElementById("result-message").textContent = "";
    document.getElementById("continue").style.display = "none";

    ["A", "B", "C", "D"].forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.textContent = `${opt}: ${currentQuestion[i + 1]}`;
        btn.style.backgroundColor = answerColors[i];
        btn.onclick = () => selectAnswer(opt, btn);
        optionsDiv.appendChild(btn);
    });

    document.getElementById("restart").style.display = "none";
    document.getElementById("next").style.display = "none";

    startTimer(30);
}

function startTimer(seconds) {
    timeLeft = seconds;
    document.getElementById("timer").textContent = `Thời gian: ${timeLeft}s`;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = `Thời gian: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lockQuestion();
        }
    }, 1000);
}

function lockQuestion() {
    document.querySelectorAll("#options button").forEach(btn => btn.disabled = true);
    document.getElementById("result-message").innerHTML = `<span style="color:orange;">⏳ Hết giờ! Bạn đã bỏ lỡ câu hỏi!</span>`;
    document.getElementById("restart").style.display = "inline";
}

function selectAnswer(selected, selectedButton) {
    clearInterval(timerInterval);
    
    document.querySelectorAll("#options button").forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
    });
    selectedButton.style.opacity = "1";

    document.getElementById("result-message").textContent = "Đang kiểm tra...";

    setTimeout(() => checkAnswer(selected), 2000);
}

function checkAnswer(selected) {
    const correctAnswer = currentQuestion[5]?.trim().toUpperCase();
    const selectedAnswer = selected.trim().toUpperCase();
    const resultMessage = document.getElementById("result-message");

    if (selectedAnswer === correctAnswer) {
        sounds.bigClap.play();
        resultMessage.innerHTML = `<span style="color:green;">🎉 Đúng rồi!</span>`;
        showFireworks();
        setTimeout(showGiftScreen, 2000);
    } else {
        sounds.ohNo.play();
        resultMessage.innerHTML = `<span style="color:red;">😢 Thật tiếc quá! Đáp án đúng là ${correctAnswer}</span>`;
        setTimeout(() => document.getElementById("continue").style.display = "inline", 2000);
    }
}

function showFireworks() {
    const container = document.getElementById("quiz-container");
    container.style.animation = "fireworks 3s";
    setTimeout(() => container.style.animation = "", 3000);
}

function showGiftScreen() {
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("gift-container").style.display = "block";

    const giftsDiv = document.getElementById("gifts");
    giftsDiv.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const giftBox = document.createElement("div");
        giftBox.className = "gift-box";
        giftBox.innerHTML = `<img src="gift.png" alt="Hộp quà">`;
        giftBox.onclick = () => openGift(giftBox);
        giftsDiv.appendChild(giftBox);
    }
}

function openGift(selectedGiftBox) {
    sounds.suspense.play();

    document.querySelectorAll(".gift-box").forEach(box => box.style.opacity = "2.5");
    selectedGiftBox.style.opacity = "1";
    selectedGiftBox.classList.add("shake");

    setTimeout(() => {
        selectedGiftBox.classList.remove("shake");

        // Chọn quà theo danh sách đã tạo từ tỷ lệ %
        const giftValue = giftValues[Math.floor(Math.random() * giftValues.length)];
        selectedGiftBox.innerHTML = `<p>${giftValue.toLocaleString()} VNĐ</p>`;
        sounds.fireworks.play();
    }, 1000);
}

document.getElementById("continue").onclick = startQuiz;
document.getElementById("backToQuiz").onclick = () => {
    document.getElementById("gift-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    startQuiz();
};

fetchData();
