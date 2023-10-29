import OpenAI from "openai";

export async function requestFix(
  issues,
  openaiApiKey,
  fileContents,
  ruleDetails,
) {
  try {
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Define the prompt for the ChatGPT request
    const prompt = [
      `You are an expert software engineer fixing issues reported by SonarCloud.`,
      `Fix the following issue report by refactoring the provided code.`,
      `Provide the complete file including all changes in the response.`,
      `Provide no description of the changes.`,
      `Ensure the behavior of the code is not changed.`,
    ];

    if (issues.length === 1) {
      prompt.push(`The issue occurs on line ${issues[0].line}`);
    } else {
      const lines = issues.map((issue) => issue.line);
      prompt.push(`The issue occurs on lines ${lines.join(", ")}.`);
    }

    const content =
      prompt.join(" ") +
      `\nIssue details: ${ruleDetails.mdDesc}` +
      `\n\n${fileContents}`;

    // Send a request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content }],
      model: "gpt-4",
      temperature: 0,
    });

    // Check for a successful response
    if (completion?.choices && completion.choices[0]) {
      return completion.choices[0].message.content.trim() + "\n";
    } else {
      console.log(JSON.stringify(completion, null, 2));

      throw new Error("No patch received");
    }
  } catch (error) {
    throw new Error("Error requesting fix", { cause: error });
  }
}
