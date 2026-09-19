import { tokenize } from "./src/tokenizer.js";
import { parseProgram } from "./src/parser.js";
import { Interpreter } from "./src/interpreter.js";
import { createRuntime } from "./src/runtime.js";

const syntaxCells = [
  {
    title: "1. Variables and output",
    explanation: "Use dhoro to create a named value, then dekhaw to print it.",
    code: `dhoro name = "Rafi"\ndhoro score = 42\ndekhaw(name)\ndekhaw(score)`,
    result: "Rafi\n42",
    fact: "Fun fact: a variable is like a labeled box — its name lets you reuse the value later.",
  },
  {
    title: "2. Numbers, strings, booleans, and null",
    explanation: "Numbers can calculate, + joins strings, sotti/mitha are booleans, and khali means no value.",
    code: `dhoro total = 7 * 6\ndhoro message = "Total: " + total\ndekhaw(message)\ndekhaw(sotti)\ndekhaw(khali)`,
    result: "Total: 42\ntrue\nnull",
    fact: "Fun fact: ^ means power, so 2 ^ 3 produces 8.",
  },
  {
    title: "3. Decisions with Bhai / Nahole",
    explanation: "Run one block when a condition is true; otherwise use Nahole.",
    code: `dhoro age = 18\nBhai (age >= 18) {\n  dekhaw("You can vote")\n} Nahole {\n  dekhaw("Not yet")\n}`,
    result: "You can vote",
    fact: "Fun fact: conditions always become either true or false.",
  },
  {
    title: "4. While loops with jotokhun",
    explanation: "Repeat while the condition stays true. Update the counter inside the loop.",
    code: `dhoro i = 1\njotokhun (i <= 3) {\n  dekhaw(i)\n  i = i + 1\n}`,
    result: "1\n2\n3",
    fact: "Fun fact: a loop needs a path to stop, or it will run forever.",
  },
  {
    title: "5. Counting with hobe",
    explanation: "A hobe loop has setup; condition; update. The semicolons split those three parts.",
    code: `hobe (dhoro i = 0; i < 3; i = i + 1) {\n  dekhaw("Step " + i)\n}`,
    result: "Step 0\nStep 1\nStep 2",
    fact: "Fun fact: this is useful when you know roughly how many times to repeat.",
  },
  {
    title: "6. Functions and ferot",
    explanation: "Define reusable work with kaj. ferot sends the final value back to the caller.",
    code: `kaj square(number) {\n  ferot number * number\n}\n\ndhoro answer = square(9)\ndekhaw(answer)`,
    result: "81",
    fact: "Fun fact: function parameters are local names for the values passed in.",
  },
  {
    title: "7. Break and continue",
    explanation: "chol skips to the next loop turn. tham leaves the loop immediately.",
    code: `hobe (dhoro i = 1; i <= 6; i = i + 1) {\n  Bhai (i == 3) { chol }\n  Bhai (i == 6) { tham }\n  dekhaw(i)\n}`,
    result: "1\n2\n4\n5",
    fact: "Fun fact: use these sparingly—clear loop conditions are easier to understand.",
  },
  {
    title: "8. Arrays and built-ins",
    explanation: "Create an array with [ ]. length counts items; push adds one and pop removes the last one.",
    code: `dhoro foods = ["rice", "fish"]\npush(foods, "mango")\ndekhaw(length(foods))\ndekhaw(pop(foods))\ndekhaw(length(foods))`,
    result: "3\nmango\n2",
    fact: "Fun fact: push changes the original array, so its length grows.",
  },
  {
    title: "9. Comments and logic",
    explanation: "Use // for a one-line note. Combine conditions with &&, ||, and !.",
    code: `// Is this score a pass?\ndhoro score = 75\ndhoro attended = sotti\nBhai (score >= 60 && attended) {\n  dekhaw("Pass")\n}`,
    result: "Pass",
    fact: "Fun fact: comments are for people reading the code; the program ignores them.",
  },
  {
    title: "10. Read user input",
    explanation: "Use neo() to capture a value from the user. input() remains available as an alias. Numbers become numbers; other text stays a string.",
    code: `dhoro number = neo("Enter a number: ")
dhoro name = input("Enter a name: ")
dekhaw(number + 1)
dekhaw(name)`,
    result: "43\nneo",
    fact: "Fun fact: a variable like neo can store either a numeric value or a string depending on what the user types.",
    inputs: { "Enter a number: ": "42", "Enter a name: ": "neo" },
  },
  {
    title: "11. Nested loops",
    explanation: "Put one loop inside another to build a small grid of values.",
    code: `hobe (dhoro row = 1; row <= 2; row = row + 1) {
  hobe (dhoro col = 1; col <= 3; col = col + 1) {
    dekhaw(row * col)
  }
}`,
    result: "1\n2\n3\n2\n4\n6",
    fact: "Fun fact: the inner loop completes once for every turn of the outer loop.",
  },
  {
    title: "12. Reusable greetings",
    explanation: "Functions can combine text and return a new message.",
    code: `kaj greet(name) {
  ferot "Hello, " + name
}

dekhaw(greet("Bhai"))`,
    result: "Hello, Bhai",
    fact: "Fun fact: returning a value lets you use a function call anywhere an expression is accepted.",
  },
  {
    title: "13. Array workflow",
    explanation: "Use push, pop, and length together to manage a simple collection.",
    code: `dhoro queue = []
push(queue, "first")
push(queue, "second")
dekhaw(length(queue))
dekhaw(pop(queue))
dekhaw(length(queue))`,
    result: "2\nsecond\n1",
    fact: "Fun fact: pop removes the last item and returns it, so it can be printed immediately.",
  },
  {
    title: "14. Math helpers",
    explanation: "Built-in math helpers make common calculations readable.",
    code: `dekhaw(abs(-9))
dekhaw(sqrt(81))
dekhaw(min(4, 7))
dekhaw(max(4, 7))`,
    result: "9\n9\n4\n7",
    fact: "Fun fact: every built-in is callable like a normal Bhai Bhai function.",
  },
];

const problems = [
  {
    title: "Problem 1: Sum from 1 to n",
    prompt: "Find the total of 1 + 2 + 3 + 4 + 5.",
    code: `dhoro n = 5\ndhoro total = 0\nhobe (dhoro i = 1; i <= n; i = i + 1) {\n  total = total + i\n}\ndekhaw(total)`,
    result: "15",
    fact: "Fun fact: the mathematical shortcut is n × (n + 1) / 2.",
  },
  {
    title: "Problem 2: Factorial",
    prompt: "Multiply every number from 1 through 5.",
    code: `kaj factorial(n) {\n  Bhai (n <= 1) {\n    ferot 1\n  }\n  ferot n * factorial(n - 1)\n}\n\ndekhaw(factorial(5))`,
    result: "120",
    fact: "Fun fact: this is recursion—the function calls itself with a smaller problem.",
  },
  {
    title: "Problem 3: Largest of two numbers",
    prompt: "Choose the bigger number without using a built-in max function.",
    code: `dhoro a = 17\ndhoro b = 29\nBhai (a > b) {\n  dekhaw(a)\n} Nahole {\n  dekhaw(b)\n}`,
    result: "29",
    fact: "Fun fact: equality goes to the Nahole branch here, but either value would be correct when they match.",
  },
  {
    title: "Problem 4: Even or odd",
    prompt: "Use remainder (%) to see whether 14 divides evenly by 2.",
    code: `dhoro number = 14\nBhai (number % 2 == 0) {\n  dekhaw("even")\n} Nahole {\n  dekhaw("odd")\n}`,
    result: "even",
    fact: "Fun fact: any even integer has remainder 0 when divided by 2.",
  },
  {
    title: "Problem 5: Add only even numbers",
    prompt: "Add the even values from 1 through 10.",
    code: `dhoro total = 0\nhobe (dhoro i = 1; i <= 10; i = i + 1) {\n  Bhai (i % 2 == 0) {\n    total = total + i\n  }\n}\ndekhaw(total)`,
    result: "30",
    fact: "Fun fact: the even numbers from 1 to 10 are 2, 4, 6, 8, and 10.",
  },
  {
    title: "Problem 6: Make a power function",
    prompt: "Calculate 3 to the power of 4 by repeated multiplication.",
    code: `kaj power(base, exponent) {\n  dhoro answer = 1\n  hobe (dhoro i = 0; i < exponent; i = i + 1) {\n    answer = answer * base\n  }\n  ferot answer\n}\n\ndekhaw(power(3, 4))`,
    result: "81",
    fact: "Fun fact: this loop-based solution also explains what the ^ operator does.",
  },
  {
    title: "Problem 7: FizzBuzz mini version",
    prompt: "For numbers 1 through 5, print fizz for multiples of 3.",
    code: `hobe (dhoro i = 1; i <= 5; i = i + 1) {\n  Bhai (i % 3 == 0) {\n    dekhaw("fizz")\n  } Nahole {\n    dekhaw(i)\n  }\n}`,
    result: "1\n2\nfizz\n4\n5",
    fact: "Fun fact: FizzBuzz is a famous interview exercise because it combines loops and conditions.",
  },
  {
    title: "Problem 8: Countdown",
    prompt: "Count backward from 5 and stop at 1.",
    code: `dhoro i = 5\njotokhun (i > 0) {\n  dekhaw(i)\n  i = i - 1\n}\ndekhaw("Launch!")`,
    result: "5\n4\n3\n2\n1\nLaunch!",
    fact: "Fun fact: changing i by -1 makes this a countdown instead of a count up.",
  },
];

function createCell(item, type) {
  const card = document.createElement("article");
  card.className = `cell ${type}`;

  const heading = document.createElement("h3");
  heading.textContent = item.title;
  const text = document.createElement("p");
  text.className = "explanation";
  text.textContent = item.explanation || item.prompt;
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = item.code;
  pre.append(code);
  const actions = document.createElement("div");
  actions.className = "cell-actions";
  const run = document.createElement("button");
  run.className = "button small run-example";
  run.textContent = "Run example";
  const liveOutput = document.createElement("pre");
  liveOutput.className = "live-output";
  liveOutput.textContent = "Ready to run";
  run.addEventListener("click", async () => {
    run.disabled = true;
    run.textContent = "Running...";
    liveOutput.className = "live-output running";
    liveOutput.textContent = "Running example...";
    const output = [];
    try {
      const runtime = createRuntime({
        onOutput: (value) => output.push(value),
        isStopRequested: () => false,
        readInput: (prompt) => item.inputs?.[prompt] ?? "",
      });
      await new Interpreter({ runtime }).execute(parseProgram(tokenize(item.code)));
      liveOutput.className = "live-output success";
      liveOutput.textContent = output.join("").trimEnd() || "(no output)";
      run.textContent = "Run again";
    } catch (error) {
      liveOutput.className = "live-output error";
      liveOutput.textContent = error?.message || String(error);
      run.textContent = "Try again";
    } finally {
      run.disabled = false;
    }
  });
  const copy = document.createElement("button");
  copy.className = "button small";
  copy.textContent = "Copy code";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(item.code);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Select code to copy";
    }
    setTimeout(() => { copy.textContent = "Copy code"; }, 1300);
  });
  const open = document.createElement("a");
  open.className = "button small primary";
  open.href = "./index.html";
  open.textContent = "Open in IDE";
  open.addEventListener("click", () => {
    sessionStorage.setItem("bhai-bhai:guide-source", item.code);
  });
  actions.append(run, copy, open);
  const output = document.createElement("div");
  output.className = "result";
  const label = document.createElement("span");
  label.textContent = "Expected result";
  const result = document.createElement("pre");
  result.textContent = item.result;
  output.append(label, result);
  const fact = document.createElement("p");
  fact.className = "fact";
  fact.textContent = item.fact;
  card.append(heading, text, pre, actions, liveOutput, output, fact);
  return card;
}

syntaxCells.forEach((item) => document.querySelector("#syntax-cells").append(createCell(item, "syntax")));
problems.forEach((item) => document.querySelector("#problem-cells").append(createCell(item, "problem")));
