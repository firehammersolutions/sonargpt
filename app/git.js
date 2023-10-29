import simpleGit from "simple-git";

const git = simpleGit();

export async function getGitRepoUrl() {
  try {
    // Getting the list of remotes
    const remotes = await git.getRemotes(true);

    // Finding a remote named 'origin' or just taking the first remote if 'origin' is not found
    const remote = remotes.find((r) => r.name === "origin") || remotes[0];

    if (remote && remote.refs && remote.refs.fetch) {
      // Getting the fetch URL of the remote
      return remote.refs.fetch;
    } else {
      throw new Error("No remote repository found");
    }
  } catch (error) {
    throw new Error("Error fetching git repository URL", { cause: error });
  }
}

export async function getCurrentBranch() {
  return await git.revparse(["--abbrev-ref", "HEAD"]);
}

export async function isFileModified(filePath) {
  try {
    const git = simpleGit();
    const status = await git.status();
    const modifiedFiles = status.modified;

    return modifiedFiles.includes(filePath);
  } catch (error) {
    throw new Error("Error checking file modification status", {
      cause: error,
    });
  }
}
