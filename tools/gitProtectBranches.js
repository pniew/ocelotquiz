#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const scriptName = 'Protected Branches';
const protectedBranches = ['master', 'release'];

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
const head = fs.readFileSync(pathToHead(repositoryRoot)).toString();
const branchNameMatch = head.match(/^ref: refs\/heads\/(.*)/);
if (!branchNameMatch) {
    process.exit();
}

const branchName = branchNameMatch[1];
if (!branchName) {
    process.exit();
}

if (protectedBranches.forEach(protected => {
    if (protected === branchName) {
        console.error(`Commits to ${protected} branch are disabled. Use Pull Requests.`);
        process.exit(1);
    }
}));
