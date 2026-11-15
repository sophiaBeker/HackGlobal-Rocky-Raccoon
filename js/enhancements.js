/*
 * Safety Quest — accessibility enhancements
 *
 * This file handles presentation-only enhancements.
 * Lesson rendering, quiz answers, scoring, and progress
 * are handled by lesson-experience.js.
 */
(() => {
    "use strict";
  
    // The larger-text control now lives in the home page Accessibility Tools
    // section (largeTextToggle). Do not inject a duplicate into the top bar.

    const style = document.createElement("style");
  
    style.textContent = `
      body.large-text {
        font-size: 18px;
      }
  
      body.large-text .sub,
      body.large-text .lesson-panel p,
      body.large-text .quiz-option,
      body.large-text .chat-msg {
        font-size: 16px;
      }
  
      body.large-text .lesson-panel h2,
      body.large-text .lesson-panel h3 {
        font-size: 1.2em;
      }
  
      body.large-text button {
        font-size: 14px;
      }
    `;
  
    document.head.appendChild(style);
  
    console.log("Safety Quest accessibility enhancements loaded.");
  })();
