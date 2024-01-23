var speechRecognition = window.webkitSpeechRecognition;

var recognition = new speechRecognition();

var textbox = $("#user-input");

var instructions = $("#instructions");

var content = "";

recognition.continuous = true;

// recognition is started

recognition.onstart = function () {
  instructions.text("Voice Recognition is On");
};

recognition.onspeechend = function () {
  instructions.text("No Activity");
};

recognition.onerror = function () {
  instruction.text("Try Again");
};

recognition.onresult = function (event) {
  var current = event.resultIndex;

  var transcript = event.results[current][0].transcript;

  content += transcript;

  textbox.val(content);
};

$("#start-btn").click(function (event) {
  recognition.start();
  //   recognition.stop();
});
$("#stop-btn").click(function (event) {
  //   recognition.start();
  recognition.stop();
});

textbox.on("input", function () {
  content = $(this).val();
});

const API_KEY = "VF.DM.659b955a3d7e360007e7298e.wQAYPmep6Y4JgtLm"; // it should look like this: VF.DM.XXXXXXX.XXXXXX... keep this a secret!

const interact = (request) =>
  // call the voiceflow api with the user's name & request, get back a response
  fetch(`https://general-runtime.voiceflow.com/state/user/TEST_USER/interact`, {
    method: "POST",
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request }),
  })
    .then((res) => res.json())
    .then((trace) => {
      console.log("API RESPONSE BODY:", trace);
      trace.forEach((trace) => {
        if (trace.type === "speak" || trace.type === "text") {
          $("#root").append(`<li>${trace.payload.message}</li>`);
        } else if (trace.type === "end") {
          $("#root").append(`<li><b>The End!</b></li>`);
        }
      });
    });

// Call an Interaction Method to advance the conversation based on `userInput`.
interact({ type: "launch" });

// Click handler - This advances the conversation session
async function handleSend() {
  // Get the user's response to the VF App's dialogue
  content = "";
  const userInput = $("#user-input").val();
  $("#root").append(`<li> > ${userInput}</li>`);
  // clear the input field
  $("#user-input").val("");

  // Call an Interaction Method to advance the conversation based on `userInput`.
  interact({ type: "text", payload: userInput.toLowerCase() });
}

// Register the click handler on a button
$("#send").on("click", handleSend);
