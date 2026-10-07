# GCG Game Plan website: setup checklist

Do one part at a time. Each part ends with a stop point, so you can pause there.
Menu names are from memory and may look slightly different. If one does not match, send a screenshot.

## Part 1. Create the database (about 10 minutes)

- [ ] Go to supabase.com and sign up.
- [ ] Choose **New project**. Name it `GCG Game Plan`.
- [ ] Pick the region nearest you (a European one is probably closest to Ghana).
- [ ] Set a database password and save it somewhere safe. You will not need it often, but you cannot recover it.
- [ ] Wait until the project says it is ready.

Stop point: you can see your project dashboard.

## Part 2. Turn off email confirmation for the pilot (about 2 minutes)

- [ ] Open **Authentication**, then the **Email** sign-in settings.
- [ ] Switch **Confirm email** off.

Why: free projects limit how many sign-up emails they send. Without confirmation, people can sign up and go straight in.

Stop point: the setting shows as off.

## Part 3. Create the tables and the access rules (about 5 minutes)

- [ ] Open **SQL Editor**, then **New query**.
- [ ] Open the file `web/schema.sql` in this repo, copy everything, and paste it into the query.
- [ ] Press **Run**. It should say it finished without errors. If it shows an error, copy the error text and send it to me.

Stop point: **Table Editor** now lists a table called `docs` and one called `profiles`.

## Part 4. Send me two values (about 3 minutes)

- [ ] Open **Project Settings**, then **API**.
- [ ] Copy the **Project URL**.
- [ ] Copy the **anon public** key.
- [ ] Send both to me.

Never send the `service_role` key, and never put it in any file. It can read and change everything.

Stop point: you have sent me the URL and the anon key. I build the site and send you one file, `index.html`.

## Part 5. Put the site online (about 15 minutes)

Use Netlify or Cloudflare Pages. Both are free. Netlify is simpler:

- [ ] Sign up at netlify.com.
- [ ] Create a new site by uploading a folder (drag and drop). Put my `index.html` in a new empty folder and drag that folder in.
- [ ] Open the address Netlify gives you.

Stop point: you see the sign-in screen for GCG Game Plan.

## Part 6. Make yourself admin (about 5 minutes)

- [ ] On the live site, tap "Create an account" and sign up with your email.
- [ ] In Supabase, open **SQL Editor** and run this, with your email:

```
update public.profiles set role = 'admin' where email = 'you@example.com';
```

- [ ] Refresh the site. You should see the Team view.

Stop point: you can open the Team view.

## Part 7. Test before you invite anyone

- [ ] Ask one person to sign up on the site and answer the questions.
- [ ] After they save, check that their profile shows in your Team view.
- [ ] Assign them one task. Check that it shows on their Today, and that they can tick it off.

If all three work, invite the rest of the crew.

## Keep safe

- The Supabase password.
- The Supabase project URL.
- This repo.
- Free Supabase projects pause after a week of no use, and there are no automatic backups. Open the site at least weekly, and ask me to add an export button before you rely on it.
