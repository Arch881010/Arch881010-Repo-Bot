# Arch881010-Repo-Bot

A github bot in JS using probot to launch.  
See package.json and it's run scripts.

## Impotant Info

Please review .env.example before doing anything!

```env
# Put your bot repo here
REPO=

# Put your user here/owner of the repo
REPO_OWNER=

# Boolean here ([true, y, yes]/[false, n, no])
ENABLE_EGGS=false

# Add a discord webhook here, optional.
DISCORD_WEBHOOK=
```

These lines should make it into .env manually, after setting up the bot, in order to actually make it easier on yourself to pre-configure it ahead of time. (And if you want easter eggs to exist, otherwise it might throw a few errors depending on what happens)
npm test is not fully supported currently! Please either assist me or wait as I figure out how the template is properly gonna do this.
