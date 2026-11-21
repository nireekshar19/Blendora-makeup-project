
/* BLENDORA - SKIN TONE QUIZ */

document.addEventListener("DOMContentLoaded", function() {

    const quizForm = document.getElementById("quizForm");

    if (!quizForm) return;

    quizForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const answers = {};

        const formData = new FormData(quizForm);

        for (const [key, value] of formData.entries()) {
            answers[key] = value;
        }

        if (Object.keys(answers).length === 0) {
            alert("Please answer the quiz questions.");
            return;
        }

        localStorage.setItem(
            "blendoraQuizAnswers",
            JSON.stringify(answers)
        );

        window.location.href = "results.html";

    });

});


// Read saved quiz answers
function getQuizAnswers() {

    try {
        return JSON.parse(
            localStorage.getItem("blendoraQuizAnswers") || "{}"
        );
    } catch (error) {
        return {};
    }
}


// Basic preliminary shade suggestion
function getSuggestedShade(tone) {

    const suggestions = {
        fair: "Fair",
        light: "Light",
        medium: "Medium",
        tan: "Tan",
        deep: "Deep"
    };

    const selectedTone = String(tone || "").toLowerCase();

    return suggestions[selectedTone] || "Medium";
}


// Display quiz result
function displayQuizResult() {

    const answers = getQuizAnswers();

    const resultElement = document.getElementById("shadeResult");

    if (!resultElement) return;

    const tone =
        answers.skinTone ||
        answers.skin_tone ||
        answers.tone;

    if (!tone) {
        resultElement.textContent =
            "Please complete the skin tone quiz first.";
        return;
    }

    resultElement.textContent =
        "Your preliminary shade category: " +
        getSuggestedShade(tone);
}

document.addEventListener("DOMContentLoaded", displayQuizResult);
