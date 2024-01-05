/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */


module.exports = (app) => {

    // Let's track minor errors, to see if we need to trigger it again
    var errors = {};
    require('dotenv').config();


    // Lets get already built in octokit
    /**
     * @description Gets the octokit object
     * @param {object} context - Object, given by context in```"issues.opened", async (context) => {```
     * @returns {octokit}
     */
    function getOctokit(context) {
        return context.octokit;
    }

    // Lets simplify getting the repo_owner, repo_name, and iss_number
    //                    repository owner, repository name, and issue number
    /**
     * @description Simplifies getting the details required for octokit
     * @param {object} context - Object, given by context in```"issues.opened", async (context) => {```
     * @returns {object} {repo_owner, repo_name, iss_number, action, context_sender_name} <- Strings inside an object
     */
    function getInfo(context) {
        const action = context.payload.action; // What happened?
        const context_sender_name = context.payload.sender.login; // Who
        const repo_name = context.payload.repository.name; // Repository name
        const repo_owner = context.payload.repository.owner.login; //  Repository owner name
        var iss_number = ""; // What issue, if any.
        try {
            iss_number = context.payload.issue.number;
        } catch(err) {}

        return {repo_owner: repo_owner, repo_name: repo_name, iss_number: iss_number, action: action, context_sender_name: context_sender_name};
    }

    // Lets create a color object so you can easily use it.
    // Number or String are OK
    // Found via https://www.spycolor.com/ under decimal value (your gonna have to scroll)
    const colors = {
        "red": "16711680",
        "yellow":"14177041",
        "green":"65280",
        "cyan":"65535",
        "turquoise": "3394764"
    }

    // Let's write a default function to manage discord webhooks, aka write params and fetch
    /**
     * Posts the webhook to the defined IF there is a webhook supplied.
     * @param {object} context - The context object from the request/trigger.
     * @param {[objects]} embeds - Extra embeds. [{"name":"title", "value":"desc", "inline":boolean}, ...]
     * @return Object {passed, reason}
     */
    async function post_webhook(context, embeds) {
        const {action, repo_name, context_sender_name} = getInfo(context);
        const repository_name = repo_name;
        const who = context_sender_name;
        const what = action; 
        if(discord_hook) {

            embeds = embeds ?? "";

            var title;
            var color; // MUST BE color decimal.
            if (what == "deleted") {
                title = "Deletion";
                color = colors['red'];
            } else if (what == "created") {
                title = "Created";
                color = colors['green'];
            } else {
                title = "Update";
                color = colors['turquoise'];
            }

            if (!repository_name) return {"passed":false, "reason":"Missing repository name!"};
            if (!what) return {"passed":false, "reason":"Missing what happened! eg delete, created, removed"};


            var params = {
                username: "Personal Github Bot",
                avatar_url: "",
                //content: "Some message you want to send",
                embeds: [
                    {
                        //"title": "Update on Github",
                        "color": color,
                        "fields": [
                            {
                                "name": title,
                                "value": `${who} ${what} a repository (${repository_name}).`,
                                "inline": true
                            },
                            ...embeds
                        ]
                    }
                ]
            }
            var res = await fetch(discord_hook, {
                method: "POST",
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(params)
            })
            var int = res.status;
            var code = res.status;
            int = int - 200; // Lazy - Check within 200 range.
            if (int >= 0 && int < 100) {
                return {"passed":true, "reason":""}; 
            } else {
                return {"passed":false, "reason":`Returned error code ${code}`};
            };
        } else {
            // If we have already had a webhook error.
            if(errors.webhook) return {"passed":false, "reason":""};

            // Otherwise
            errors.webook = true;
            return {"passed":false, "reason":"No discord webhook? | Will not re-error"}
        }
        //return {"passed":"false", "response":"This message means there is a leakage somewhere!!"}
    }

    // Info: Easily be replaced with for loops and arrays. users = [{}, {}];
    // for (userObj in user) {if(user['assign-allow']) userObj.checked = true;};

    const user = {
        "name": "Arch881010",
        "nick": "Arch",
        "assign-allow": true
    }

    // Check to give info and just give a info'd shortned situation.
    if (user['assign-allow'] == true) user.checked = true;

    // Are we missing the nick? Lets use their username instead.
    if (user['nick']) {} else {
        user['nick'] = user['name']
    }

    // Is eggs enabled?
    var if_egg;
    var env_egg = process.env['ENABLE_EGGS']
    if (env_egg == "y" || env_egg == "yes" || env_egg == true) {
        if_egg = true;
    } else {
        if_egg = false;
    }
    const egg_enabled = if_egg;

    // Do we have a discord webhook?
    var discord_hook = process.env['DISCORD_WEBHOOK'] ?? "";
    
    function capitalize(word) {
        const lower = word.toLowerCase();
        return word.charAt(0).toUpperCase() + lower.slice(1);
    }

    // Debug: Bot launch.
    app.log.debug("Bot loaded properly.");

    // Issues

    // When an issue is opened..
    app.on("issues.opened", async (context) => {
        
        // Get the objects/names of owner + name;
        const {repo_owner, repo_name, iss_number} = getInfo(context);

        // Get octokit
        const octokit = getOctokit(context);

        // Easter eggs
        var egg_comment;
        var body = context.payload.issue.body;
        if ((body.toLowerCase()).includes('poke') && (context.payload.repository.name == process.env['REPO'])) {
            egg_comment = context.issue({
                body: `Ow! Why'd you poke me? I'm locking this out of anger!`,
            });
        }

        //Set default text.
        var extra = "!";
        // Did <user> allow/consent to be added to new automated issues?
        // Also, lets not add the user on egg ones, it's clutter and takes longer to run.
        if (user.checked && !egg_comment) {
            await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/assignees', {
                owner: repo_owner,
                repo: repo_name,
                issue_number: iss_number,
                assignees: [user.name],
            });
            extra = ", and Arch has been automatically assigned!"
        }

        // Create comment
        const issueComment = context.issue({
            body: `Thank you for creating this issue${extra}`,
        });

        // Post comment and return.
        if (egg_comment && egg_enabled == true) {
            app.log.debug("Oh ho ho! This contained an easter egg!")
            await octokit.issues.createComment(egg_comment);
            return await octokit.request('PUT /repos/{owner}/{repo}/issues/{issue_number}/lock', {
                owner: repo_owner,
                repo: repo_name,
                issue_number: iss_number,
                lock_reason: 'resolved',
            });
        } else {
            return await octokit.issues.createComment(issueComment);
        }
    });

    app.on("issues.reopened", async (context) => {
        // Do action
    });

    // When an issue is closed...
    app.on("issues.closed", async (context) => {

        // Get Octokit
        const octokit = getOctokit(context);

        // Create a new comment.
        const ownerClosed = context.issue({
            body: "I guess this issue has been solved and closed by Arch, locking!"
        });

        // See if it's locked. 
        const locked = await context.payload.locked;

        // It's locked. We can't comment.
        // TODO: Failed before and attempted to reply on a locked issue, needs work. May be fixed after await.
        if (locked) return;

        // Get the objects/names of owner + name;
        const {repo_owner, repo_name, iss_number} = getInfo(context);


        // Check if its by the owner (Arch); if yes, do <...> otherwise do nothing
        if (context.payload.repository.owner.login == "Arch881010") {

            // Post comment
            await octokit.issues.createComment(ownerClosed);
            //return await context.github.issue.lock(context.issue());

            // Post lock request.
            await octokit.request('PUT /repos/{owner}/{repo}/issues/{issue_number}/lock', {
                owner: repo_owner,
                repo: repo_name,
                issue_number: iss_number,
                lock_reason: 'resolved',
            });
        };
        return;
        //app.log.info(context);
    });

    // Repository actions

    // When a repository is created...
    app.on("repository.created", async (context) => {
        
        // Optional, but for debugging. (await post_webhook(context); REQUIRED)
        var {passed, reason} = await post_webhook(context);

        // If the check suceeded, aka posted successfully
        if (passed) return;
        // Otherwise
        if (reason) return app.log.error(reason);
        return;
    });

    // When a repository is deleted...
    app.on("repository.deleted", async (context) => {

        // Optional, but for debugging. (await post_webhook(context); REQUIRED)
        var {passed, reason} = await post_webhook(context);

        // If the check suceeded, aka posted successfully
        if (passed) return;
        // Otherwise
        if (reason) return app.log.error(reason);
        return;
    })

    // For more information on building apps:
    // https://probot.github.io/docs/

    // To get your app running against GitHub, see:
    // https://probot.github.io/docs/development/
};