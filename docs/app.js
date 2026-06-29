// SPDX-License-Identifier: MPL-2.0

const steps = [
  {
    kind: "Prediction",
    question: "Both ports are green. Does that prove a ping will succeed?",
    context:
      "Commit to a model before the result appears. A prediction makes later surprise useful.",
    choices: [
      {
        label: "Yes. Green means the machines are connected.",
        correct: false,
        feedback:
          "The lights establish a physical link, not IP identity or a valid route. This is a useful misconception because the next observation can challenge it."
      },
      {
        label: "Not necessarily. Link state and IP reachability are different claims.",
        correct: true,
        feedback:
          "Good boundary: Layer 1 evidence does not silently become proof of Layer 3 reachability."
      }
    ]
  },
  {
    kind: "Observation",
    question: "The interfaces report LOWER_UP, but neither has an IPv4 address. The ping fails. What has the evidence established?",
    context:
      "Observation records system state before interpretation. The command output is an artifact, not the explanation.",
    choices: [
      {
        label: "The cable must be broken because ping failed.",
        correct: false,
        feedback:
          "That contradicts the observed link state. Ping failure alone cannot tell us which layer failed."
      },
      {
        label: "The link is alive, but network-layer identity is still missing.",
        correct: true,
        feedback:
          "Exactly. The trace preserves both what is present and what remains unproven."
      }
    ]
  },
  {
    kind: "Explanation",
    question: "Why can a healthy physical connection coexist with a failed ping?",
    context:
      "An explanation should connect the observed states causally, not repeat the output.",
    choices: [
      {
        label: "Because the machines need usable addresses and a path in addition to the link.",
        correct: true,
        feedback:
          "This explanation separates the conditions and states why the outcome follows."
      },
      {
        label: "Because networking is unpredictable until the command works.",
        correct: false,
        feedback:
          "That describes frustration, not causality. The evidence already identifies a specific missing condition."
      }
    ]
  },
  {
    kind: "Transfer",
    question: "A new pair has link-up and IPv4 addresses, but incompatible subnets and no router. What should you inspect next?",
    context:
      "Transfer changes the surface details. Repeating the original command sequence is no longer enough.",
    choices: [
      {
        label: "Replace the cable first.",
        correct: false,
        feedback:
          "The new case already establishes link state. Returning to the cable ignores the changed evidence."
      },
      {
        label: "Compare the address prefixes and route tables.",
        correct: true,
        feedback:
          "The layered model survived the changed case. That is stronger evidence than one correct ping."
      }
    ]
  }
];

const stageLabel = document.querySelector("#stage-label");
const stageKind = document.querySelector("#stage-kind");
const question = document.querySelector("#question");
const context = document.querySelector("#context");
const choices = document.querySelector("#choices");
const feedback = document.querySelector("#feedback");
const nextButton = document.querySelector("#next-button");
const progressBar = document.querySelector("#progress-bar");
const traceSection = document.querySelector("#trace-section");
const traceOutput = document.querySelector("#trace-output");

let stepIndex = 0;
const trace = [];

function renderStep() {
  const step = steps[stepIndex];
  stageLabel.textContent = `Stage ${stepIndex + 1} of ${steps.length}`;
  stageKind.textContent = step.kind;
  question.textContent = step.question;
  context.textContent = step.context;
  progressBar.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
  choices.replaceChildren();
  feedback.hidden = true;
  feedback.removeAttribute("data-result");
  nextButton.hidden = true;

  for (const choice of step.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = choice.label;
    button.addEventListener("click", () => selectChoice(button, choice));
    choices.append(button);
  }
}

function selectChoice(button, choice) {
  for (const candidate of choices.querySelectorAll(".choice")) {
    candidate.disabled = true;
  }

  button.classList.add("selected");
  feedback.textContent = choice.feedback;
  feedback.dataset.result = choice.correct ? "pass" : "revise";
  feedback.hidden = false;
  nextButton.textContent =
    stepIndex === steps.length - 1 ? "View the evidence trace" : "Continue the trace";
  nextButton.hidden = false;

  trace[stepIndex] = {
    kind: steps[stepIndex].kind.toLowerCase(),
    response: choice.label,
    status: choice.correct ? "pass" : "review"
  };
}

function completeTrace() {
  traceOutput.textContent = JSON.stringify(
    {
      protocolVersion: "0.1.0",
      learningClaim:
        "Distinguishes physical link state from IP reachability.",
      evidence: trace,
      summary: {
        status: trace.every((entry) => entry.status === "pass")
          ? "pass"
          : "review",
        note: "A review result preserves uncertainty; it is not silently promoted."
      }
    },
    null,
    2
  );

  traceSection.hidden = false;
  traceSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

nextButton.addEventListener("click", () => {
  if (stepIndex === steps.length - 1) {
    completeTrace();
    return;
  }

  stepIndex += 1;
  renderStep();
});

renderStep();
