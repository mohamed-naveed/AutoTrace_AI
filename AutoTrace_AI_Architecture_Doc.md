# AutoTrace AI: Comprehensive System Documentation

## 1. Executive Summary & Vision
**AutoTrace AI** is an advanced predictive simulation and estimation platform designed to solve the "Visibility Gap" in complex project management, particularly in construction and infrastructure (e.g., FTTP fiber deployments). 

Traditional tools rely on static spreadsheets that fail to account for real-time market shifts (like inflation) or the geographical logistics of a build. AutoTrace AI solves this by introducing an **AI-driven, 12-Agent Pipeline** that generates a resilient, dynamic "Cost DNA" for every project. It allows managers to predict outcomes, run "What-If" scenarios, and interactively map their projects.

---

## 2. Technology Stack
The platform is built on a scalable, modern, and decoupled enterprise architecture.

### Frontend (Client Tier)
*   **Framework:** React.js powered by Vite for fast, seamless user interactions.
*   **Styling:** Tailwind CSS for a premium, responsive, and highly customizable UI.
*   **Mapping:** Interactive geospatial integrations mapping physical real-world data to the dashboard.
*   **Networking:** Asynchronous REST API communication over secure HTTPS.

### Backend (Logic Tier)
*   **Framework:** High-performance Python backend (FastAPI), chosen for its asynchronous capabilities and standard API validation.
*   **AI Models:** Predictive Machine Learning models (Linear Regression) for data forecasting, and Natural Language Generation (LLMs) for creating human-readable insights.
*   **Geospatial:** Open Source Routing Machine (OSRM) integration for precise distance and routing calculations.

### Database (Data Tier)
*   **Storage:** Scalable NoSQL Database (MongoDB).
*   **Rationale:** "Cost DNA" is a deeply nested, continually evolving data structure. A schema-less NoSQL document store provides superior flexibility over strict relational databases, ensuring rapid iteration and flawless data storage for complex estimations.

---

## 3. The 12 AI Agent Pipeline

AutoTrace AI's logic is fundamentally decoupled into 12 distinct intelligence "Agents." When a simulation is run, data passes sequentially through this pipeline, with each agent responsible for a specific domain of the estimation process.

1.  **Input Agent:** Acts as the gateway. It sanitizes, normalizes, and validates the raw user inputs (like base distances, coordinates, and project type) before allowing them into the pipeline.
2.  **Project Mode Agent:** Determines the environmental context of the build (e.g., Underground vs. Aerial) and sets foundational parameters that subsequent agents must follow.
3.  **Material Agent:** Calculates the exact quantities and base costs of physical materials required, dynamically adjusting based on distance and build mode.
4.  **Labor Agent:** Computes workforce requirements, calculating the number of hours, shifts, and base wages needed to install the materials.
5.  **Overhead Agent:** Calculates necessary indirect costs, including permitting, equipment rentals, environmental checks, and admin fees.
6.  **Aggregation Agent:** Acts as the central accountant. It gathers the outputs from Material, Labor, and Overhead, mathematically summing them into a structured sub-total representation.
7.  **Rule Engine Agent:** Applies dynamic business logic and localized overrides (e.g., regional tax rates, custom client markups) to the aggregated costs.
8.  **AI Prediction Agent:** The predictive core. It utilizes a trained Machine Learning model against historical industry data to forecast potential cost overruns, timeline delays, and generate a dynamic "Probability of Success" score.
9.  **Validation Agent:** The safety net. It strictly checks the final calculation against hard business constraints (e.g., preventing margins from dropping below a required threshold). If a constraint is violated, it flags the estimate.
10. **DNA Agent:** The architect. It takes all prior mathematical outputs and assembles them into the final, highly structured, immutable "Cost DNA" object representing the entirety of the project.
11. **Explanation Agent:** The translator. It takes the mathematical Cost DNA and feeds it to an LLM to generate human-readable, paragraph-based insights, clearly explaining the "why" behind the numbers.
12. **Replay Agent:** The simulator. Used exclusively during "What-If" scenarios. It takes an existing Cost DNA, merges it with new user-driven overrides (like high inflation rates), and re-runs the entire pipeline to output comparative data.

---

## 4. Map Integration & Multiple Routes

Cost estimation is blind without geographical context. AutoTrace AI integrates powerful mapping features directly into the core calculation logic.

*   **Interactive Twinning:** Users start by dropping pins on an interactive map interface. This captures exact Latitude/Longitude coordinates for the project's start and end points.
*   **Geospatial Routing:** Instead of drawing straight, unrealistic lines, the backend sends these coordinates to a specialized routing mechanism to calculate authentic driving and path distances.
*   **Multiple Route Polling:** The system can evaluate multiple physical routes (e.g., highlighting different roads to reach the same destination) to calculate realistic logistics, material transport costs, and geographical risk factors, anchoring the project to physical reality rather than abstract math.

---

## 5. Core Operational Actions

Beyond simply storing data, the platform empowers users through dynamic, data-driven actions:

### The "Reply" (Replay) Action: What-If Sandbox
This is the core simulation tool. A project manager uses dashboard sliders (e.g., simulating +15% Labor Inflation or a change in build type). The frontend triggers the **Replay Agent**, which takes the established Cost DNA, applies these extreme overrides, and pushes the data back through the pipeline. The dashboard then displays the original cost versus the "Replayed" cost side-by-side on a Sensitivity Analysis Chart, allowing for instant risk assessment and presentation.

### The Explanation Action
Raw technical data is often confusing to non-technical stakeholders. When a project is saved and opened, the **Explanation Agent** analyzes the final Cost DNA. It writes an executive summary in natural language. For example, rather than just outputting raw labor costs, it states: *"Labor costs are projected at $50k, heavily influenced by the underground build type which requires specialized, time-intensive trenching hours."*

### The AI Insight Action
While the Explanation Action focuses on *what happened*, the AI Insight Action (driven by the **AI Prediction Agent**) focuses on *what will happen*. It compares the current project data to historical datasets. If the system notes that underground builds in the current region historically face 3-week permit delays, it applies an explicit "Risk Factor" multiplier to the final estimate and lowers the "Probability of Success" dial, giving project managers critical foresight before any resources are spent.

---

## 6. Autonomous Data Resilience (Backend Fallback)

To ensure enterprise-grade stability, the system features sophisticated self-healing mechanisms. 
In complex data systems, data corruption is a severe risk. If a project record in the database becomes corrupted or is missing expected keys, the repository layer contains a "fallback" logic block. It automatically attempts to reconstruct the project's foundational metadata on the fly. This prevents the entire simulation platform from crashing due to a single data error, ensuring a seamless user experience and flawless data integrity during critical, high-pressure planning sessions.
