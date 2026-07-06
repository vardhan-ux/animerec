# animerec

A simple website that recommends anime, manga, and manhwa — search titles, filter by genre, and see top-ranked lists. Data comes live from the [Jikan API](https://jikan.moe) (an unofficial MyAnimeList API), so there's no database to manage for this first version.

## Files
- `index.html` — page structure
- `style.css` — "Hanko seal" red/cream theme
- `script.js` — fetches data from Jikan and handles search/filter/tabs

## Run it locally (optional, before deploying)
Just open `index.html` in a browser — no build step, no install needed. (Some browsers restrict `fetch` on files opened directly via `file://`; if data doesn't load, run a quick local server instead: `python3 -m http.server` in this folder, then visit `http://localhost:8000`.)

## Deploy with GitHub Pages
See the step-by-step instructions in the chat where this was built — short version:

1. Create a new GitHub repo called `animerec`.
2. Push these three files (`index.html`, `style.css`, `script.js`) to the `main` branch.
3. In the repo, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root)**.
4. Wait ~1 minute, then your live link will be:
   `https://YOUR-USERNAME.github.io/animerec/`

## Notes / limitations of this first version
- Jikan has a rate limit (roughly 3 requests/second, 60/minute). If you click around very fast, results may briefly fail to load — this is expected and not a bug in your code.
- Manhwa/manhua are covered by Jikan's `/manga` endpoint (MyAnimeList tags them by type), so the "Manga / Manhwa" tab covers both.
- There's no "recommended watch order" or "similar titles" feature yet — that's a good next step once this base is live.
