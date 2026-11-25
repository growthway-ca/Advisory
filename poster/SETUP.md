# Connect Instagram (about 20 minutes, once per account)

The poster uses Meta's official Instagram API with Facebook Login, the route that allows both posting and comp-account
research. You'll end up with a **Page access token** for each account; you paste it into Supabase's own secret form, never
into a chat.

## 1. Check each Instagram account (2 minutes)

For **growthway.ca** and **housingdata**:
1. Instagram app → profile → ☰ → **Account type and tools** → make sure it's a **Business** or **Creator** (professional) account.
2. Profile → **Edit profile** → **Page** → connect it to the matching Facebook Page (create one if needed). The API only works
   for Instagram accounts linked to a Facebook Page you manage.

## 2. Create the Meta app (5 minutes, once)

1. Go to **developers.facebook.com** → **My Apps** → **Create app**.
2. Use case: **Other** → app type: **Business** → name it **Growthway Poster** → create.
3. In the app's dashboard, **Add product** → **Instagram** → choose **API setup with Facebook login**.

You don't need app review to post to accounts you manage yourself while the app is in development mode; if Meta asks for it
later, tell Claude and we'll handle it.

## 3. Get a long-lived Page token (10 minutes, per account)

1. Open the **Graph API Explorer**: developers.facebook.com/tools/explorer
2. Top right: **Meta App** = Growthway Poster. **User or Page** = **Get User Access Token**.
3. Add these permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`,
   `pages_read_engagement`, `business_management`. Click **Generate Access Token** and approve the Growthway (and housingdata)
   Pages and Instagram accounts in the pop-up.
4. Make it long-lived: open the **Access Token Debugger** (developers.facebook.com/tools/debug/accesstoken), paste the token,
   click **Debug**, then **Extend Access Token** at the bottom. Copy the new token.
5. Back in the Explorer, paste that long-lived token into the **Access Token** box and run this GET:
   `me/accounts?fields=name,access_token,instagram_business_account`
6. In the result, find the Page linked to the Instagram account and copy its **access_token**. A Page token made from a
   long-lived user token doesn't expire (unless you change your Facebook password or remove the app).

## 4. Give it to the poster

Tell Claude "token ready for Growthway" (or housingdata). Claude opens Supabase's secret form for `IG_TOKEN_GROWTHWAY` /
`IG_TOKEN_HOUSINGDATA`; paste the Page token there. The Accounts tab in the dashboard turns to **connected** after the first
run.

## If something goes wrong

- *"has no linked Instagram professional account"*: step 1.2 isn't done, or you copied the user token instead of the Page token.
- *Permission errors on posting*: if your Page is owned by a Meta Business account, add `ads_management` and `ads_read` in
  step 3.3 and repeat.
- *Token stopped working*: repeat step 3 and paste the new Page token.
