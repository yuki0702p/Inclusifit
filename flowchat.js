"use strict";
(function ($) {
  var isSpeakEnabled = false;
  var speakQueue = []; // Queue to store messages and options to be spoken
  $.fn.flowchat = function (options) {
    var settings = $.extend(
      {
        delay: 1500,
        startButtonId: "#btn-submit",
        autoStart: true,
        startMessageId: 1,
        dataJSON: null,
      },
      options
    );
    var container = $(this); //<button id='toggleSpeakButton'>Toggle Speak</button>
    var toggleSpeakButton = $(
      "<button id='toggleSpeakButton' style='font-size:15px'><i class='fa fa-microphone'></i>Read Aloud</button>"
    );

    container.append(toggleSpeakButton);
    toggleSpeakButton.on("click", function () {
      isSpeakEnabled = !isSpeakEnabled;
      speakFromQueue(); // Check if speak is enabled after toggling and speak from the queue
    });
    $(document).on("click", settings.startButtonId, function () {
      startChat(
        container,
        settings.dataJSON,
        settings.startMessageId,
        settings.delay
      );
      // speakFromQueue();
    });
  };
  function startChat(container, data, startId, delay) {
    container.html("<div class='footer-chat'>Chatbot</div>");
    var chatWindow = $("<ul class='chat-window'></ul>");
    container.append(chatWindow);
    var message = findMessageInJsonById(data, startId);
    generateMessageHTML(container, data, message, delay);
  }
  function speakText(text, callback) {
    if (isSpeakEnabled && window.speechSynthesis) {
      var synth = window.speechSynthesis;
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = function () {
        callback(); // Continue with the next action after the current utterance ends
      };
      synth.speak(utterance);
    } else {
      console.log("Speak text is disabled or SpeechSynthesis not supported");
      callback(); // Continue with the next action
    }
  }
  function speakFromQueue() {
    if (isSpeakEnabled && speakQueue.length > 0) {
      // Speak all items in the queue
      while (speakQueue.length > 0) {
        var queueItem = speakQueue.shift();
        speakText(queueItem.text, queueItem.callback);
      }
    }
  }
  function addToQueue(text, callback) {
    if (isSpeakEnabled) {
      speakQueue.push({ text: text, callback: callback });
      if (speakQueue.length === 1) {
        speakFromQueue(); // If the queue was empty, start speaking immediately
      }
    } else {
      callback(); // Continue with the next action
    }
  }
  function selectOption($this, container, data, delay) {
    $this.parent().hide();
    var userReplyText = $this.html();
    var $userReply = $(
      '<li class="user"><div class="text">' + userReplyText + "</div></li>"
    );
    container.children(".chat-window").append($userReply);
    // Read the selected option
    addToQueue("You selected " + userReplyText, function () {
      // Move to the next message
      var nextMessageId = $this.attr("data-nextId");
      var nextMessage = findMessageInJsonById(data, nextMessageId);
      generateMessageHTML(container, data, nextMessage, delay);
    });
  }
  function speakOptions(options, callback) {
    if (isSpeakEnabled) {
      addToQueue(options, callback);
    } else {
      callback(); // Continue with the next action
    }
  }

  function speakOptionsPrompt(callback) {
    var prompt = "Please select one of the following options:";
    addToQueue(prompt, callback);
  }
  function addOptions(container, data, delay, m) {
    var $optionsContainer = $('<li class="options"></li>');
    var $optionsList = $("<ul></ul>");
    var optionText = null;
    var optionMessageId = null;
    var optionsText = "";
    for (var i = 1; i < 12; i++) {
      optionText = m["option" + i];
      optionMessageId = m["option" + i + "_nextMessageId"];
      if (optionText != "" && optionText != undefined && optionText != null) {
        var $optionElem = $(
          "<li data-nextId=" + optionMessageId + ">" + optionText + "</li>"
        );
        $optionElem.click(function () {
          selectOption($(this), container, data, delay);
        });
        $optionsList.append($optionElem);
        optionsText += optionText + ", ";
      }
    }
    $optionsContainer.append($optionsList);
    speakOptions(optionsText, function () {
      container.children(".chat-window").append($optionsContainer);
    });
    return $optionsContainer;
  }
  function generateMessageHTML(container, messages, m, delay) {
    if (m.imageUrl != "") {
      var $template = $(
        '<li class="bot"><div class="item">' +
          '<img src="' +
          m.imageUrl +
          '">' +
          "</div></li>"
      );
    } else if (m.text != "") {
      var $template = $(
        '<li class="bot"><div class="text">' + m.text + "</div></li>"
      );

      addToQueue(m.text, function () {
        container.children(".chat-window").append($template);

        // Check if the message type is a question
        if (m.messageType == "Question") {
          // Speak the prompt before speaking the options
          speakOptionsPrompt(function () {
            // Always display options after the prompt
            container
              .children(".chat-window")
              .append(addOptions(container, messages, delay, m));
            container
              .children(".chat-window")
              .scrollTop($(".chat-window").prop("scrollHeight"));
          });
        } else {
          // Continue with the next action
          container
            .children(".chat-window")
            .scrollTop($(".chat-window").prop("scrollHeight"));
          if (m.nextMessageId != "") {
            var nextMessage = findMessageInJsonById(messages, m.nextMessageId);
            setTimeout(function () {
              generateMessageHTML(container, messages, nextMessage, delay);
            }, delay);
          }
        }
      });
    } else {
      var $template = $("");
    }

    toggleLoader("show", container);
    container
      .children(".chat-window")
      .scrollTop($(".chat-window").prop("scrollHeight"));

    setTimeout(function () {
      toggleLoader("hide", container);
    }, delay);
  }
  function toggleLoader(status, container) {
    if (status == "show") {
      container
        .children(".chat-window")
        .append(
          "<li class='typing-indicator'><span></span><span></span><span></span></li>"
        );
    } else {
      container.find(".typing-indicator").remove();
    }
  }

  function findMessageInJsonById(data, id) {
    var messages = data;
    for (var i = 0; messages.length > i; i++) {
      if (messages[i].id == id) {
        return messages[i];
      }
    }
  }
})(jQuery);
