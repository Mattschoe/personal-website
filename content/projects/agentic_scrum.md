---
title: Building Agentic Scrum for Novo Nordisk
date: 2026-06-08
summary: An agentic system taking over some of the accountabilities of SM and PO in Scrum
caption: An agentic system taking over some of the accountabilities of SM and PO in Scrum
status: Active
year: 2026 - present
role: Systems Developer
stack:
  - Python
  - Langgraph
  - NextJS
  - Podman
links: 
  repo: https://github.com/agentic-scrum/agentic-scrum
hero: /images/projects/agentic_scrum.png
heroAlt: The landing page of the Agentic Scrum Project. It's a web-app that matches the similiar style of AI-websites like Claude, Gemini, Deepseek and ChatGPT. 
---
In the 4th semester at ITU i teamed up with some of the best people studying Software Development
and had the opportunity to collaborate with Novo Nordisk to build something truly great. 
Introducing: Automated Scrum, where the Product Owner and Scrum Master has been enhanced with 
agentic workflows
# The Project vision
> Scrum is hard to implement, and at Novo we suck at it. It is inefficient, misunderstood and wasteful. 
> Can we somehow make the framework easier and more efficient to use with AI?

It was with these words that our Product Owner from Novo Nordisk joined my team for a semester to 
build the goal of ***Agentic Scrum***: A system where the framework of Scrum was accelerated with 
AI workflows. The goal? Building something that took some of the annoyances out of Scrum and replaced 
it with pure efficiency. The idea is simple, lets build a system where the AI has context about 
everything Scrum related: The sprints, the refinement, the reviews, retros, artefacts, commitments, 
Definition of Done, Backlogs, and so on. 

# What we build
So with a lot of ideas and a vision of something great, the team and I set out to build. 
Before i share what we ented up with, i think its important to have a small disclaimer.

**Disclaimer:** When talking about what we build, what accountabilities of the Scrum Master
and Product Owner we might be able to replace with this system, it is important to understand
that Scrum theory here is following the theory layed by and executed by Novo Nordisk. This means
that the 3 roles sometimes have accountabilities that are not quite actual accountabilities per
Scrum Theory, but has been decided internally in *some* Novo teams that that is the person
who should do such things. 

So what did we actually end up with? At its core Agentic Scrum is a multi-agent system. 
Instead of one giant AI trying to do everything at once, we built an orchestrator that sits 
in front and routes your request to the right specialist. Think of it as a manager that knows 
exactly which of its team members to hand a given task to.

Underneath that orchestrator live a handful of specialized agents, each with their own tools 
and their own job to do:

- A **GitHub agent** that owns issues, projects and the backlog. It creates issues, assigns 
them to the right developer, and keeps the board in order.
- An **Outlook agent** that handles the calendar and email side of things, booking meetings 
and sending out the communication that usually eats up a Scrum Master's day.
- An **Excalidraw agent** that draws diagrams on the fly, so when you need a quick visual of 
a workflow or an architecture, you just ask for it.
- A **web-fetch agent** for pulling in outside context, anything from a documentation page to 
a YouTube transcript.

All of this is built in Python on top of Langgraph, which is what lets these agents reason, 
call their tools, and loop until the job is actually done.

But the part i'm most proud of is the two Scrum roles themselves. We didn't just build one 
generic assistant, we built a **Product Owner agent and a Scrum Master agent** that each carry 
their own personality and their own accountabilities. And here is the fun part: they can 
actually talk to each other. When a decision needs input from both roles, the two agents 
negotiate back and forth until they land on an outcome, the same way a real PO and SM would 
hash something out in a meeting.

What makes the whole thing click is context. The system isn't a generic chatbot, it lives 
inside your project. It knows your sprints, your backlog, your Definition of Done, and even who 
is on your team through a developer registry that maps people to their GitHub accounts. During 
setup it ingests intake forms and builds personas from them, so the agents understand the shape 
of your specific team rather than some textbook version of Scrum.

And because a tool is only as good as it is easy to reach, we made sure Agentic Scrum meets you 
where you already work. There is a web app built in NextJS that mirrors the clean chat style 
you know from Claude or ChatGPT, with voice support on top so you can talk to it instead of 
typing. And for teams that already live inside Microsoft Teams, the system plugs straight into 
your chat, with the PO and SM showing up as their own separate bots. So you can drop a question 
into a Teams channel and watch the two of them respond, negotiate, and get to work without ever 
leaving the conversation.



# What's next for Agentic Scrum?
With the project handed off to Novo Nordisk, it is now in their hands to extend the project.
I know already know that the primary goal of the project will be: Closing the loop. Essentially
we have created a system that replaces two of the 3 roles in Scrum, why not just also the third?
(the Developer). It will be exciting to return to this project later on, and see where the outcome
will land.

# How it was perceived academically
Showcasing the product amongst our peers and to our professors was a huge success. At ITU this course
includes a competition resulting in a *Quality Award* for the highest performing team, with a price 
pool of 15.000DKK.

With big smiles and a lot of product pitching the team and I brought home that award. It was an 
absolute honor to receive the award sponsored by Saxo Bank and the only thing next was to also 
perform well grade-wise at the exam of this course. Which of course ended in me bringing home a 12. 

15k and a grade of 12 richer, it has been a wonderful journey to build this product. I have learned
a ton about agentic systems, building larger systems in python and a excellent understanding of 
Langgraph (which i can't recommend enough!).



**Overall** this project has been a huge success, and while me might have delivered something hardcore
Scrum fans would roll their eyes out at, this system is a giant upgrade to project management 
for software-heavy projects. While this product has focused on replacing accountabilities of Scrum, 
I truely think the real value lays in the ability for the system to live in the context of your project.
