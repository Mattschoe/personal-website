---
title: Building Agentic Scrum for Novo Nordisk
date: 2026-06-08
summary: An agentic system taking over some of the accountabilities of SM and PO in Scrum
caption: An agentic system taking over some of the accountabilities of SM and PO in Scrum
status: Active
year: 2026 - present
stack:
  - Python
  - Langgraph
  - NextJS
  - Podman
links: 
  repo: https://github.com/agentic-scrum/agentic-scrum
hero: /images/projects/agentic_scrum.webp
heroAlt: The landing page of the Agentic Scrum Project. It's a web-app that matches the similar style of AI-websites like Claude, Gemini, Deepseek and ChatGPT. 
---
In the 4th semester at ITU I teamed up with some of the best people studying Software Development
and had the opportunity to collaborate with Novo Nordisk to build something truly great. 
Introducing: Automated Scrum, where the Product Owner and Scrum Master have been enhanced with 
agentic workflows.

# The Project vision
> Scrum is hard to implement, and at Novo we suck at it. It is inefficient, misunderstood and wasteful. 
> Can we somehow make the framework easier and more efficient to use with AI?

It was with these words that our Product Owner from Novo Nordisk joined my team for a semester to 
build the goal of ***Agentic Scrum***: A system where the framework of Scrum was accelerated with 
AI workflows. The goal? Building something that took some of the annoyances out of Scrum and replaced 
it with pure efficiency. The idea is simple: let's build a system where the AI has context about 
everything Scrum related: the sprints, the refinement, the reviews, retros, artifacts, commitments, 
Definition of Done, Backlogs, and so on. 

# What we built
So with a lot of ideas and a vision of something great, the team and I set out to build. 
Before I share what we ended up with, I think it's important to have a small disclaimer.

**Disclaimer:** When talking about what we built, what accountabilities of the Scrum Master
and Product Owner we might be able to replace with this system, it is important to understand
that Scrum theory here is following the theory laid out by and executed by Novo Nordisk. This means
that the 3 roles sometimes have accountabilities that are not quite actual accountabilities per
Scrum Theory, but have been decided internally in *some* Novo teams that that is the person
who should do such things. 

So what did we actually end up with? At its core Agentic Scrum is a multi-agent system. The system
consists of a *Product Owner* agent and a *Scrum Master* agent that each carry 
their own personality and their own accountabilities. The most interesting thing we built, however,
is that they can actually talk to each other. When a decision needs input from both roles, the two agents 
negotiate back and forth until they land on an outcome, the same way a real PO and SM would. 
Underneath the two agents, they have been filled with useful and important tools for them 
to execute their role, accountabilities and be overall helpful in the team. These are tools such 
as: 

- **GitHub:** The agents can create issues, assign them to the right developer, 
and keep the board in order. The PO mainly uses this for driving their accountability
of an effective product backlog, while the SM uses it for facilitating Scrum and ensuring stability.
- **Outlook:** The agents can handle the calendar and email side of things for the team. 
They can even book meetings and send out the communication that would usually eat up a 
Scrum Master's day.
- **Excalidraw:** The PO and SM can draw diagrams on the fly, so when you need a quick visual of 
a workflow or an architecture, you just ask for it.
- **Web-fetching:** For pulling in outside context, anything from a documentation page to 
a YouTube transcript.

All of this is built in Python on top of [Langgraph](https://www.langchain.com/langgraph), 
which is what lets these agents reason, call their tools, and loop until the job is actually done.

What makes the whole thing work is context. The system isn't a generic chatbot; it lives 
inside your project. It knows your sprints, your backlog, your Definition of Done, and even who 
is on your team through a developer registry that maps people to their GitHub accounts. During 
setup it ingests intake forms and builds personas from them, so the agents understand the shape 
of your specific team rather than some textbook version of Scrum.

And because a tool is only as good as it is easy to reach, we made sure Agentic Scrum meets Novo
where you already work. There is a web app built in NextJS that mirrors the clean chat style 
you know from Claude or ChatGPT, with voice support on top so you can talk to it instead of 
typing (this is what you see in the image above). 
And for Novo Nordisk's teams that already live inside Microsoft Teams, the system plugs straight into 
their chat, with the PO and SM showing up as their own separate bots. So now teams at Novo can 
drop a question into a Teams channel and watch the two of them respond, negotiate, and get to 
work without ever leaving the conversation.

# What's next for Agentic Scrum?
With the project handed off to Novo Nordisk, it is now in their hands to extend the project.
I already know that the primary goal of the project will be: Closing the loop. Essentially
we have created a system that replaces two of the 3 roles in Scrum, so why not also the third?
(the Developer). It will be exciting to return to this project later on and see where the outcome
will land.

# How it was perceived academically
Showcasing the product amongst our peers and to our professors was a huge success. At ITU this course
includes a competition resulting in a *Quality Award* for the highest performing team, with a prize 
pool of 15,000 DKK.

With big smiles and a lot of product pitching, the team and I brought home that award. It was an 
absolute honor to receive the award sponsored by Saxo Bank, and the only thing next was to also 
perform well grade-wise at the exam of this course, which of course ended in me bringing home a 12. 

15k and a grade of 12 richer, it has been a wonderful journey to build this product. I have learned
a ton about agentic systems, building larger systems in Python and an excellent understanding of 
Langgraph (which I can't recommend enough!).



**Overall** this project has been a huge success, and while we might have delivered something hardcore
Scrum fans would roll their eyes out at, this system is a giant upgrade to project management 
for software-heavy projects. While this product has focused on replacing accountabilities of Scrum, 
I truly think the real value lies in the ability for the system to live in the context of your project.