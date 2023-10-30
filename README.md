# SonarGPT
Tool for fixing SonarCloud issues using OpenAI GPT model completions.

## Install
Global install is preferable, but it can be installed in a specific repository if desired. Only a handful of dependencies are required.

```
npm install --global @firehammer/sonargpt
```

## Usage

Change into a checkout of your repository and run the tool.

```
sonargpt --sonarcloud-org <org> --sonarcloud-token <token> --openai-api-key <key>
```

