#!/usr/bin/env node

import yargs from "yargs";
import * as git from "./app/git.js";
import * as sonar from "./app/sonar.js";
import * as openai from "./app/openai.js";
import process from "node:process";
import { hideBin } from "yargs/helpers";

import { promises as fs } from "fs";

const argv = yargs(hideBin(process.argv))
  .options({
    "sonarcloud-org": {
      type: "string",
      required: true,
      description: "SonarCloud Organization",
      default: process.env.SONARCLOUD_ORG,
    },
    "sonarcloud-token": {
      type: "string",
      required: true,
      description: "SonarCloud Token",
      default: process.env.SONARCLOUD_TOKEN,
    },
    "openai-api-key": {
      type: "string",
      required: true,
      description: "OpenAI API Key",
      default: process.env.OPENAI_API_KEY,
    },
    "dry-run": {
      type: "string",
      description:
        "Show the issues found to be fixed without actually calling ChatGPT or fixing the issues.",
      default: false,
    },
  })
  .help().argv;

const sonarOrg = argv["sonarcloud-org"];
const sonarToken = argv["sonarcloud-token"];
const openaiApiKey = argv["openai-api-key"];
const dryRun = argv["dry-run"];

try {
  const repoUrl = await git.getGitRepoUrl();
  const sonarProject = await sonar.findProject(sonarOrg, sonarToken, repoUrl);

  const sonarIssues = await sonar.getIssues(
    sonarOrg,
    sonarToken,
    sonarProject.key,
  );

  const issuesByFile = sonarIssues.reduce(toGroupsBy(issueFilePath), new Map());
  const issuesByFileByRule = new Map(
    Array.from(issuesByFile.entries()).map(([key, val]) => [
      key,
      val.reduce(toGroupsBy(issueRule), new Map()),
    ]),
  );

  for (const [filePath, issuesByRule] of issuesByFileByRule.entries()) {
    try {
      if (await git.isFileModified(filePath)) {
        console.log("skipping:", filePath);
      } else {
        for (const [rule, issues] of issuesByRule) {
          console.log("fixing:", rule, " in ", filePath);

          // Read the file contents
          const fileContents = await fs.readFile(filePath, "utf-8");

          // Get details of rule
          const ruleDetails = await sonar.getRuleDetails(
            sonarOrg,
            sonarToken,
            rule,
          );

          if (!dryRun) {
            const updatedFileContents = await openai.requestFix(
              issues,
              openaiApiKey,
              fileContents,
              ruleDetails,
            );

            await fs.writeFile(filePath, updatedFileContents, "utf-8");
          }
        }
      }
    } catch (error) {
      console.log("Unable to fix issue", filePath, error);
    }
  }
} catch (error) {
  console.error(error);
}

function toGroupsBy(selector) {
  return function groupReducer(groups, element) {
    const name = selector(element);
    const values = groups.get(name) ?? (groups.set(name, []), groups.get(name));
    values.push(element);
    return groups;
  };
}

function issueFilePath(issue) {
  return issue.component.split(":", 2)[1];
}

function issueRule(issue) {
  return issue.rule;
}
