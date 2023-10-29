import axios from "axios";
import * as git from "./git.js";
import { Buffer } from "node:buffer";

export async function findProject(sonarcloudOrg, sonarcloudToken, gitRepoUrl) {
  try {
    // Assume the gitRepoUrl has a format like: https://github.com/org/repo.git
    const repoName = gitRepoUrl.split("/").slice(-1)[0].replace(".git", "");

    // Construct the URL for the SonarCloud API endpoint
    const url = new URL("https://sonarcloud.io/api/projects/search");

    const params = new URLSearchParams({
      organization: sonarcloudOrg,
      q: repoName,
    });

    url.search = params.toString();

    // Send a GET request to the SonarCloud API
    const response = await axios.get(url, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(sonarcloudToken + ":").toString("base64"),
      },
    });

    // Check if the project was found
    if (response?.data?.components.length > 0) {
      return response.data.components[0]; // Return the first project that matches the repository URL
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    throw new Error("Error fetching project", { cause: error });
  }
}

export async function getIssues(organization, token, projectKey) {
  try {
    // Get the current branch
    const branch = await git.getCurrentBranch();

    // Construct the URL for the SonarCloud API endpoint
    const url = new URL("https://sonarcloud.io/api/issues/search");

    const params = new URLSearchParams({
      componentKeys: projectKey,
      branch,
      resolved: "false",
    });

    url.search = params.toString();

    // Send a GET request to the SonarCloud API
    const response = await axios.get(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${token}:`).toString("base64"),
      },
    });

    if (response.data && response.data.issues) {
      return response.data.issues;
    } else {
      throw new Error("No issues found");
    }
  } catch (error) {
    throw new Error("Error fetching issues", { cause: error });
  }
}

export async function getRuleDetails(organization, token, key) {
  try {
    // Construct the URL for the SonarCloud API endpoint
    const url = new URL("https://sonarcloud.io/api/rules/show");
    const params = new URLSearchParams({ key, organization });

    url.search = params.toString();

    // Send a GET request to the SonarCloud API
    const response = await axios.get(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${token}:`).toString("base64"),
      },
    });

    if (response.data && response.data.rule) {
      return response.data.rule;
    } else {
      throw new Error("No rule found");
    }
  } catch (error) {
    throw new Error("Error fetching rule", { cause: error });
  }
}
