/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */


module.exports = (app) => {
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
     * @returns {object} {repo_owner, repo_name, iss_number} <- Strings inside an object
     */
    function getInfo(context) {
        const repo_owner = context.payload.repository.owner.login;
        const repo_name = context.payload.repository.name;
        const iss_number = context.payload.issue.number;
        return {repo_owner: repo_owner, repo_name: repo_name, iss_number: iss_number};
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


    // Debug: Bot launch.
    app.log.debug("Bot loaded properly.");

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
        if (user.checked) {
            await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/assignees', {
                owner: repo_owner,
                repo: repo_name,
                issue_number: iss_number,
                assignees: [
                    user.name
                ],
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
        if (context.payload.sender.login == "Arch881010") {

            // Post comment
            await octokit.issues.createComment(ownerClosed)
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
    })

    // For more information on building apps:
    // https://probot.github.io/docs/

    // To get your app running against GitHub, see:
    // https://probot.github.io/docs/development/
};