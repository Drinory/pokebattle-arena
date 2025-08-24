Purpose

Demonstrate your ability to rapidly bootstrap, structure, and polish a production-grade web application while leveraging AI-assisted workflows.

1. Time Constraints & Expectations

Time Constraints

Please time-box your effort to a maximum of 8 hours. You can spread this time over a few days to fit your schedule. Our goal is to see your approach and how you prioritize within a typical workday, not to receive a perfect, feature-complete product. Focus on the core requirements, documenting your process, and showing us how you approach a project with AI assistance.

What Matters Most

Clarity of thought, code quality and architecture, pragmatic decisions, and polished UX—not raw volume of features.

Compensation

Submit an invoice to your People department contact for CAD$500 at the end of the process to compensate you for your time spent on this project.

Communication

Prior to the start of this project, you'll be invited to a Slack channel by our team. You can use this channel to ask any clarifying questions before starting work and to collaborate with us as you're working on the project. Don't be shy! This opportunity is for all of us to experience what it might be like to work together.

Tip 1: Treat this like a real project sprint: plan first, keep notes of trade-offs, and leave crisp commit messages.
Tip 2: Show us you know the "right" way. This is a simulation. For example, in a production project, you'd use environment variables for secrets. For this exercise, you can hardcode them to save time, but leave a comment (e.g., HACK/FIXME) explaining the trade-off. What you choose to shortcut, and how you communicate it, is part of the evaluation. 

2. Core Requirements

2.1 Framework & Deploy

You'll be invited to a Next.js 15 repository that's set up with the basics and integrated with Vercel. On push, your code will be deployed automatically.

2.2 Auth Gate

Protect all routes with HTTP Basic auth without relying on a full auth provider.

2.3 UI Kit

Use shadcn/ui. Stick to their idiomatic patterns for theming and accessibility.

2.4 Remote API Integration

Pick one public API from the list in §4 (or suggest another). Show at least 2 endpoints + client-side pagination or filtering. Handle loading, error, and empty states elegantly.

2.5 AI-Assisted Workflow

Utilize Cursor's export functionality to provide 3-5 of your most relevant sessions as Markdown files. If you're not using Cursor, please provide equivalent chat sessions from that product.

2.6 DX Polish

Linting (ESLint + Prettier), type-safe front-to-back, and a concise README.

2.7 Interactive Canvas Visualization

Using the data fetched from the API, create an interactive visualization using the HTML <canvas> element. This could be a simple chart, a creative data representation, or a mini-game. The goal is to showcase your expertise with the Canvas API, including performant rendering loops, handling user interactions (e.g., mouse-over effects, clicks), and responsive design. The visualization should be integrated as a React component, complete with its own loading and error states.

3. Deliverables

GitHub repo with conventional commits.

Public URL to the deployed app (provide basic-auth credentials).

README.md covering:

Quick start instructions (local & prod)

Architecture decisions & folder structure

API service contract (types, endpoints)

docs/solution-walkthrough.md your narrative (see §5).

3-5 session logs as outlined in 2.5 above. You can commit these to the GitHub repository for simplicity.

4. Suggested Public APIs

API

Why It's Interesting

PokéAPI
https://pokeapi.co/
Rich character stats and sprites, perfect for creating a dynamic stat visualizer, battle simulator, or type-based particle effects on a canvas.

TVmaze API
https://www.tvmaze.com/api
Episodic and scheduling data, ideal for building an interactive timeline, a character relationship map, or a dynamic programming guide.

Open Library API
https://openlibrary.org/developers/api
Vast dataset of literary works, great for generating a virtual bookshelf, an interactive author timeline, or a genre constellation map.

Open Trivia Database API
https://opentdb.com/api_config.php
Structured quiz content, perfect for building a custom-rendered trivia game, complete with interactive UI and animations on canvas.

Deck of Cards API
https://www.deckofcardsapi.com
Simple, stateful card game logic, perfect for building an interactive card table, shuffling animations, or a physics-based card simulation.

Feel free to propose another public API if you believe it better showcases your skills.

5. Walk-through Narrative (include in docs/solution-walkthrough.md)

Decomposition → Recomposition - Break down the problem, list milestones, then explain how you weaved features back together.

API Exploration - How did you map the remote schema to your domain layer? Any surprises?

Canvas Implementation - Explain your approach to the canvas visualization. What were the key challenges? How did you structure the rendering and interaction logic?

AI Prompts - Which tasks did you offload to the AI, what was the outcome, and how did you validate generated code?

Trade-offs & Next Steps - What would you refactor or add with more time? Why did you skip certain edges?

6. Evaluation Rubric

Category | Weight | What We Look For
--- | --- | ---
AI-Assisted Workflow | 30% | Appropriate use of AI, clear log, human validation, no blind copy-paste. Show us your thought process for leveraging AI effectively.
Canvas Implementation & Interactivity | 30% | Effective use of the Canvas API, performant rendering, responsive design, and meaningful user interaction. Clean separation of canvas logic from component logic.
Architecture & Code Quality | 20% | Typed boundaries, clean separation, readability, sensible abstractions, well-structured React components.
UI/UX Polish & State | 10% | Accessible, mobile-friendly, consistent component usage, pleasant loading/error states for both API data and the canvas element.
Documentation & Dev X | 10% | Pithy docs, runnable project, commit hygiene.

7. Submission

We will discuss a delivery date for this project over Slack or Email once you have reviewed this project specification and signed the contact. By the agreed upon date, we will need:

All of your code committed to the provided GitHub repository and deployed in a functioning state to the provided Vercel endpoint

The credentials you created that gives us access to your deployed application on the Vercel endpoint

We'll schedule a 45-minute follow-up call to deep-dive into your approach and answer questions.

Good luck & have fun! We value iterative thinking over perfection. Show us how you think, not just what you ship.
