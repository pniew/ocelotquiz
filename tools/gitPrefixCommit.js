#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptName = 'prefix-commit-message';

const pathToHead = folder => path.resolve(path.join(folder, '.git', 'HEAD'));
const pathToParentFolder = folder => path.resolve(path.join(folder, '..'));
const isRepositoryRoot = folder => fs.existsSync(pathToHead(folder));

let repositoryRoot = __dirname;
while (!isRepositoryRoot(repositoryRoot) && fs.existsSync(repositoryRoot)) {
    repositoryRoot = pathToParentFolder(repositoryRoot);
}

if (!fs.existsSync(repositoryRoot)) {
    console.error(`${scriptName} was unable to find the root of the Git repository.`);
    process.exit(1);
}

const output = childProcess.execSync('git rev-list --all --count');
if (!output) {
    process.exit(1);
}

const number = parseInt(output.toString());

const huskyGitParams = process.env.HUSKY_GIT_PARAMS;
if (!huskyGitParams) {
    console.error(`${scriptName} expects Git parameters to be accessible via HUSKY_GIT_PARAMS.`);
    process.exit(1);
}

const commitMessageFile = huskyGitParams.split(' ')[0];
if (!commitMessageFile) {
    console.error(`${scriptName} requires HUSKY_GIT_PARAMS to contain the name of the file containing the commit log message.`);
    process.exit(1);
}

const pathToCommitMessageFile = path.resolve(path.join(repositoryRoot, commitMessageFile));

const content = fs.readFileSync(pathToCommitMessageFile);
const prefix = `O-${number + 1}: `;

if (content.indexOf(prefix) === -1) {
    fs.writeFileSync(pathToCommitMessageFile, prefix + content);
}
