# Nadi Voting Day

Everything is in this one folder:

- `index.html` – the whole page (welcome screen, day picker, results, Iraq clock, English/Arabic)
- `votes.mjs` – the Netlify Function that saves and reads votes (Netlify Blobs)
- `netlify.toml` – tells Netlify to publish this folder and use `votes.mjs` as the function
- `package.json` – the one dependency (`@netlify/blobs`)

Only the names listed in `MEMBERS` at the top of `votes.mjs` can sign in (the list lives on the server, not in the page). Typing **Julian** shows the Results tab. Each person can pick as many days as they like.

## Deploy

Use GitHub or the Netlify CLI (Netlify Drop drag-and-drop does not install the dependency).

GitHub: put this folder in a repo → Netlify → Add new site → Import an existing project → Deploy
(leave the build command empty, publish directory `.`).

CLI, from inside this folder:
```
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

To change who sees the results, edit `OWNER` in `votes.mjs`. To add or remove people, edit `MEMBERS` in the same file.
