/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */


module.exports = (app) => {
  require('dotenv').config();

  function getOctokit(context) {
      return context.octokit;
  }

  //Info: Easily be replaced with for loops and arrays. users = [{}, {}];
  // for (userObj in user) {if(user['assign-allow']) userObj.checked = true;};

  const user = {
      "name": "Arch881010",
      "assign-allow": true
  }

  // Check to give info and just give a info'd shortned situation.
  if (user['assign-allow'] == true) user.checked = true;

  // Debug: Bot launch.
  app.log.debug("Bot loaded properly.");

  // When an issue is opened..
  app.on("issues.opened", async (context) => {
      const {
          owner,
          name
      } = context.payload.repository;

      // Sort out names, get the issue number.
      const repo_owner = owner.login
      const repo_name = name;
      const iss_number = context.payload.issue.number;

      // Get octokit
      const octokit = getOctokit(context);

      //app.log.debug(context.payload)


      // Easter eggs
      var egg_comment;
      var body = context.payload.issue.body;
      if ((body.toLowerCase()).includes('poke') && (context.payload.repository.name == process.env['REPO'])) {
          egg_comment = context.issue({
              body: `Ow! Why'd you poke me? I'm locking this out of anger!`,
          });
      }
      /*
      var data = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: repo_owner,
        repo: repo_name,
        issue_number: iss_number,
      });
      */

      //Set default text.
      var extra = "!";
      // Do we want to auto assign <person> to the issue
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
      if (egg_comment) {
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

  });

  // When an issue is closed...
  app.on("issues.closed", async (context) => {

      // Get Octokit
      const octokit = getOctokit(context);

      // Create a new comment.
      const ownerClosed = await context.issue({
          body: "I guess this issue has been solved and closed by Arch, locking!"
      });

      // See if it's locked. 
      const locked = await context.payload.locked;

      // It's locked. We can't comment.
      if (locked) return;

      // Get the objects/names of owner + name;
      const {
          owner,
          name
      } = context.payload.repository;

      // Sort out names, get the issue number.
      const repo_owner = owner.login
      const repo_name = name;
      const iss_number = context.payload.issue.number;

      //app.log.info(context);

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