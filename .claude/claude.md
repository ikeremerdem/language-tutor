## Design Workflow
- For any UI design work, always use the Stitch MCP to generate screens first
- Store the design system in .stitch/DESIGN.md
- Use the stitch-design skill workflow for all new screens

## Important Rule for Coding
I want you to work as a coding agent at the moment, I do not want you to manage my github repo. I will do it myself. 
- Do not create git branches automatically, always work on the branch you are in. 
- Do not commit to git, create PRs unless you are explicitly told so. 

## General Rules
- Always update the documentation when there is a change that needs to be documented (readme.md, requirements.md)
- If you add a new feature, go to the roadmap.md file. If the feature is in the roadmap part, remove it from there. Add this new feature to the Release Notes, first the date, then the feature list. Keep the release notes concise and targeted to end users of the app. 
- Even if a feature you added or did a bug fix is not in the roadmap, add it to the release notes. For bug fixes, start it with "BUG FIX:"
- This is an MVP, not a full production application. Therefore, do not be shy to change API signatures, when I ask for a terminology change on the UI, keep the code consistent with the concepts on the UI. 
- Make sure that the screens are mobile friendly, when you add or change something.
