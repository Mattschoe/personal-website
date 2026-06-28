---
title: LLM-powered Grammar Checker as a GitHub Action
date: 2026-06-15
summary: Over my 4th semester I found myself continuously using Git and GitHub for writing my reports. While it was great being back in control of my tools, I found myself constantly copying and pasting my work to have AI review it. Here's how I solved it using GitHub Workflows. 
caption: Manually remembering to have an LLM reviewer go through your documentation and work can be tedious, here's how I found a way to automate the task.
status: Active
hero: /images/projects/grammer_checker_hero.webp
year: 2026 - present
stack:
  - Python
links:
  repo: https://github.com/marketplace/actions/grammar-check
---
Over my 4th semester I found myself continuously using Git and GitHub for writing my reports and documentation. 
While it was great being back in control of my tools, I found myself constantly copying and pasting 
my work to have AI review it. Claude Code certainly made it easier to quickly pop open an
additional terminal and have it do review while I kept working, I still found myself multiple times 
forgetting to review sections of reports for grammar errors and bad prose. So on a Monday morning 3 days 
before an essay deadline I found myself procrastinating writing about philosophy and instead built this tool.

**First of all** what was the point of this tool for me? Well, I wanted something where I didn't have
to remember to have the LLM check my work. For me I needed an automation step, where I could have a 
plain helper work in the background and support me in my weaknesses. So since all my 
work was already living through GitHub I thought I might as well just design a GitHub Action around how
I worked.

So that's what I did. By declaring a simple workflow like this one:
```yaml
name: Grammar Check
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  grammar:
    runs-on: ubuntu-latest
    steps:
      - uses: Mattschoe/grammar-check@v1
        with:
          provider: claude
          api-key: ${{ secrets.LLM_API_KEY }}
          file-extensions: tex,md
```
you would now get something like this:
![example Pull-Request of grammar checker](/images/projects/grammar_checker_example_pr.webp) 
Which you could easily just merge into main. Even better, if you didn't agree with the changes you can just
write a comment into the PR and the workflow will run again, taking your feedback into consideration and
fixing the errors. The system is extendable so that you can improve the system prompt if you would like to,
such as: "avoid em-dashes", you can also change the provider. So if you didn't want to use the Claude SDK Agent 
credits for this, well then it also works for Deepseek (which is incredibly cheap), and support for ChatGPT is
coming! Model size can also be customized to your liking, I recommend the cheap ones, no real reason to run 
Opus on your minor spelling mistakes.

Do remember that this tool is purely for prose and grammar. It focuses on how the sentences *flow* 
but nothing about the actual contents of the work. And how would it? Your arguments, discussions 
and documentation all require context of what you are doing and why. 

It should be said that this workflow, nor any other LLM based prose/grammar help, isn't a replacement for
checking your work yourself. I didn't use it as such and you would gain nothing from you doing so, because
then it isn't your work, it's the LLM's. What you should use such a tool for is perspective. Writing an essay,
report or documentation is hard, it's easy for you to bask in the glory of whatever you wrote while no one else
understands anything you have written. This tool is here to help, I purposely built this as a workflow
that creates PR with changes and not just pushes the changes, you should not treat it as a fixer, you
should treat it as a perspective. There is real value in seeing an opinion on how to write something
(even if it's from a LLM) and deciding **not** to go down that route. At university we don't always
have fellow students at our fingertips to help us give perspective on our work, and that is why I made this
tool.