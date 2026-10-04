# Decap CMS Setup Guide — Glorious Restoration Embassy

## What You Get After This Setup
- A dashboard at yoursite.org/admin
- Log in with your email (no GitHub needed for editors)
- Add sermons, events, gallery photos, and announcements through forms
- Site updates automatically within ~2 minutes of saving

---

## STEP 1 — Copy These Files Into Your Project

Copy all files from this package into your project root.
Folder structure after copying:

```
your-project/
├── public/
│   └── admin/
│       ├── index.html      ← NEW
│       └── config.yml      ← NEW
├── app/
│   ├── layout.tsx          ← REPLACE existing file
│   ├── sermons/page.tsx    ← REPLACE existing file
│   └── events/page.tsx     ← REPLACE existing file
├── lib/
│   └── content.ts          ← NEW
├── content/                ← NEW empty folder (CMS writes here)
│   ├── sermons/
│   ├── events/
│   ├── gallery/
│   ├── announcements/
│   └── settings/
└── netlify.toml            ← NEW
```

---

## STEP 2 — Create Empty Content Folders in GitHub

Go to your GitHub repo.
Create these empty folders by adding a .gitkeep file in each:

- content/sermons/.gitkeep
- content/events/.gitkeep
- content/gallery/.gitkeep
- content/announcements/.gitkeep
- content/settings/.gitkeep

HOW TO CREATE A FILE IN GITHUB:
1. Go to your repo on github.com
2. Click "Add file" → "Create new file"
3. Type: content/sermons/.gitkeep
4. Click "Commit changes"
5. Repeat for each folder

---

## STEP 3 — Push Everything to GitHub

Commit and push all the new files to your main branch.
Netlify will automatically try to rebuild — that is expected.

---

## STEP 4 — Enable Netlify Identity

1. Go to app.netlify.com
2. Open your site
3. Click "Site configuration" → "Identity"
4. Click "Enable Identity"
5. Under "Registration", choose "Invite only"
   (This means only people you invite can log in)
6. Under "Services" → "Git Gateway", click "Enable Git Gateway"
   (This is what allows the CMS to save files to GitHub)

---

## STEP 5 — Invite Yourself as Admin

1. Still in Netlify → Identity
2. Click "Invite users"
3. Enter your email address
4. Check your email and click the confirmation link
5. Set a password when prompted

---

## STEP 6 — Log Into Your CMS

1. Go to: yoursite.netlify.app/admin
   (or yoursite.org/admin once your domain is connected)
2. Log in with your email and password from Step 5
3. You should see the CMS dashboard with:
   - Sermons
   - Events
   - Gallery Photos
   - Announcements
   - Site Settings

---

## HOW TO ADD A SERMON

1. Go to /admin → click "Sermons" → click "New Sermon"
2. Fill in:
   - Sermon Title: "Walking in Faith"
   - Speaker: "Bishop David Omari"
   - Date: pick the Sunday
   - Summary: one or two sentences
   - YouTube Video ID: the part after ?v= in the YouTube URL
     Example: youtube.com/watch?v=ABC123XYZ → ID is ABC123XYZ
3. Click "Publish" → site updates in ~2 minutes

---

## HOW TO ADD A GALLERY PHOTO

1. Go to /admin → click "Gallery Photos" → click "New Photo"
2. Fill in a title/caption
3. Click the image box and upload your photo
4. Click "Publish"

---

## HOW TO ADD AN ANNOUNCEMENT

1. Go to /admin → click "Announcements" → click "New Announcement"
2. Write the title and message
3. Make sure "Active" is turned ON
4. Click "Publish"
5. To hide it later, edit it and toggle "Active" OFF

---

## TROUBLESHOOTING

Problem: "No backend found" when logging in
Fix: Make sure Git Gateway is enabled in Netlify → Identity → Services

Problem: Images not showing after upload
Fix: Check that media_folder in config.yml matches public/gallery

Problem: CMS saves but site doesn't update
Fix: Check Netlify deploy logs — the build may have an error

Problem: Can't log in at /admin
Fix: Check you clicked the invite link in your email and set a password

---

## UPDATING config.yml IN THE FUTURE

If you want to add a new field (e.g. a "Sermon Series" field):
1. Go to public/admin/config.yml in GitHub
2. Click the pencil icon to edit
3. Add your field following the same pattern
4. Commit — the CMS will show the new field immediately
