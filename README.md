# Card transaction processor (interview project)

This repository is a **full-stack** sample implementation of a simplified **card transaction processor**: users sign in, submit or upload transactions, and view **reports** (volume by card brand, by day, etc.) plus **rejected** rows. The system persists data in **PostgreSQL**, applies **card-number validation** and parsing rules in a dedicated **Java domain module**, and serves a **React + TypeScript** SPA that consumes a **JWT-secured** Spring Boot API.

**Start here if you are reviewing or running the solution:**

| Doc | Contents |
| --- | --- |
| **[client/README.md](./client/README.md)** | Frontend stack, `npm` workflow, `VITE_*` env, `src/` folder map, auth/API overview, troubleshooting. |
| **[server/README.md](./server/README.md)** | Maven modules, Java/Spring versions, database bootstrap, `application.yml` env vars, API overview, Postman, troubleshooting. |
| **[server/scripts/README.md](./server/scripts/README.md)** | Idempotent **`db_setup.sh` / `.ps1`**, SQL pipeline, seeded users/roles, schema design notes. |

**Typical local run (after Postgres is available):**

1. Initialize the database: from `server/`, run `./scripts/db_setup.sh` (or the Windows script — see server scripts README).
2. Start the API: from `server/`, `mvn -pl processor-api spring-boot:run` (default **http://localhost:9091**).
3. Start the UI: from `client/`, copy `.env.example` to `.env.local`, `npm install`, `npm run dev` (**http://localhost:5173**). Ensure `VITE_API_BASE_URL` matches the API (e.g. `http://localhost:9091/api`).

---

## Repository layout

```
.
├── client/          # Vite + React 18 + TypeScript SPA
├── server/          # Maven: processor-core (domain) + processor-api (Spring Boot)
├── data/            # Sample / larger transaction files (per interview brief)
└── test/            # Smaller fixture files for development (per interview brief)
```

---

## Interview brief (original instructions)

The sections below are the **original take-home instructions** for this exercise (requirements, submission process, and expectations).

---

Thank you for taking the time to complete our interview code project. We realize that there are many ways to conduct the "technical part" of the interview process from L33T code tests to whiteboards, and each has its own respective pros / cons. We intentionally chose the take-home project approach because we believe it gives you the best chance to demonstrate your skills and knowledge in a "normal environment" - i.e. your computer, keyboard, and IDE.

This short exercise is designed to give us a sense of how you approach full stack development. We’re looking for clarity of thought, communication, and code organization — not perfection or a complete product.

Please treat this as something you’d spend **3-5 hours** on. If anything is unclear or you'd make a different decision in a real-world scenario, feel free to call that out.

We encourage you to have fun with the project, while producing a solution that you believe accurately represents how you would bring your skillset to the team.

We have attempted to make this repo as clear as possible, but if you have any questions, we encourage you to reach out.

---

## 📟 Overview

You’ll build a small system that mimics a simplified credit card transaction processor. Your submission should include:

- A **web-based user interface**
  - including a **reporting view** to summarize processed data
- A **server component** with appropriate business logic
- **Data persistence** (in-memory, file-based, or database - your choice)

---

## 🧹 Requirements

You can implement this however you like, as long as the following functionality is covered:

### 1. User Interface

- A minimal web interface for interacting with the system
- Includes a way to view and/or submit transaction data
- Can be built using any approach / tech stack you prefer

### 2. Logic

- You need to accept transaction records
  - These records will come from the provided files
  - The files in the test directory are smaller and meant to ease development
  - The files in the data directory are larger and mean to be the "real transactions"
- Each record includes a card number, timestamp, and amount
- Each directory contains 3 files that need to be processed to capture all transactions
- Card type is determined by the leading character of the card as follows:
  - Amex (3)
  - Visa (4)
  - MasterCard (5)
  - Discover (6)
- Invalid or unrecognized card numbers should be rejected

### 3. Persistence

- Transactions must be stored and retrievable after creation
- Choose any persistence mechanism

### 4. Reporting

- Provide summaries of total processed volume:
  - By Card
  - By Card Type
  - By Day (based on timestamp)
- Provide a list of "rejected" transactions

---

## ✅ What We’re Looking For

- Clear, maintainable code
- A working implementation of the core requirements
- Reasonable structure and organization
- Good judgment in scoping and tradeoffs

Bonus points (not required) for:

- Tests
- Clear commit history
- Clean and responsive UI

## 🧠 Final Thoughts and Hints

- In this scenario, you are the initial architect creating the first pass at this project. You can consider our review the same as a Senior level engineer coming on to the project. Make sure that when we "pick up" the repo, it is clear how to stand up the project, run the solution, and potentially contribute code
- Since you are tackling this specific project, our expectation is that you are at a senior engineer level. While we 100% want your code to represent your preferred style, there are some things we consider "basic" that should be in your submission. These include ideas like the following list. This list is not exhaustive, it is meant to point in a direction:
  - Clear, consistent, readable code
  - Proper use of your selected stack
    - for example, if you choose C#, we would expect to see IOC/DI appropriately implemented
  - DRY
  - Low cyclomatic complexity
  - Low Coupling / High Cohesion
  - Clear thought and patterns for maintainability and expansion
    - This scenario is obviously simplified from reality, that said, you should consider future requests like other transaction types, different file formats, etc. - this will at minimum, be a topic in the conversation
- While it should be obvious, this scenario involves "money". This means numerical accuracy is required and at least minimal security should be considered in your submission (we aren't going to "hack your solution", but there shouldn't be open API endpoints either).
- We do NOT expect you to be a designer, we do expect you to consider your user and make the experience intuitive and easy to use

---

## 📦 Submitting

- Fork this repository and push your implementation to your fork
- Submit a pr to this repository when you are ready for us to review your code
  - We will close the PR then review the code on your fork
- Include / Update `README.md` to explain:
  - How to run your code
  - Any decisions or tradeoffs you made
  - Any assumptions or known limitations
