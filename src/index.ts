#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path'
import * as inquirer from 'inquirer';
import * as template from './utils/template';
import * as shell from 'shelljs';
import * as azdev from "azure-devops-node-api";
import * as GitApi from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { azureLogin, createPipeline, createRepo, getProject, getRepo } from './utils/azure'
import { createDirectoryContents, createProject } from './utils/files'
import ascii from 'ascii-art'
// @ts-ignore
import clear from 'console-clear'
import * as ba from "azure-devops-node-api/BuildApi";
import * as bi from "azure-devops-node-api/interfaces/BuildInterfaces";

export interface CliOptions {
    projectName: string;
    templateName: string;
    templatePath: string;
    tartgetPath: string;
    currentDir: string;
}

// (async () => {
//     let orgUrl = "https://dev.azure.com/resser";

//     let token: string = "vfaot5okulqoc2xmnkpcses2hvjxvxmefdsmra64636exqw5if6q"; // e.g "cbdeb34vzyuk5l4gxc4qfczn3lko3avfkfqyb47etahq6axpcqha"; 

//     let authHandler = azdev.getPersonalAccessTokenHandler(token, true);
//     let connection = new azdev.WebApi(orgUrl, authHandler);



//     const gitApiObject: GitApi.IGitApi = await connection.getGitApi();
//  const repos: GitInterfaces.GitRepository = await gitApiObject.getRepositoryWithParent("pp", true,"resser-web-os");
//  const repos2: GitInterfaces.GitRepository = await gitApiObject.getRepositoryWithParent("caca", true,"resser-web-os");
 
 
//  console.log(JSON.stringify(repos));
//  console.log(JSON.stringify(repos2));
 
//     // console.log("There are", repos.length, "repositories in this project");

//     // repos.forEach((repo)=>{
//     //     console.log(repo.name);
        
//     // })
//     // console.log(JSON.stringify(repos[5]));



    
//     //         let vstsBuild: ba.IBuildApi = await connection.getBuildApi();

//     //  let defs: bi.DefinitionReference[] = await vstsBuild.getDefinitions("resser-web-os");
        
//     //     console.log(`You have ${defs.length} build definition(s)`);


//     //     let lastDef: bi.BuildDefinition;
//     //     let popo: bi.DefinitionReference[]=[]
//     //     for (let i: number = 0; i < defs.length; i++) {
//     //         let defRef: bi.DefinitionReference = defs[i];

//     //         let def: bi.BuildDefinition = await vstsBuild.getDefinition("resser-web-os", defRef.id || 0);
//     //         lastDef = def;
//     //         let rep: bi.BuildRepository = def.repository || {};
//     //         popo.push(def)

//     //         console.log(`${defRef.name} (${defRef.id}) repo ${rep.type}`);
//     //     }
//     //     console.log(JSON.stringify(popo[4]));
//     //     console.log(JSON.stringify(popo[5]));
        
//     // // let gitApiObject: GitApi.IGitApi = await connection.getGitApi();
//     // const project = await getProject(connection, "resser-web-os")
//     // const repo = await getRepo(connection, project, "testing")

//     // console.log(repo);
//     // let rep: bi.BuildRepository = repo;
//     // rep.type = 'TfsGit'


//     // let newDef: bi.BuildDefinition = <bi.BuildDefinition>{};
//     // newDef.name = "nombre supser vergas"
//     // newDef.repository = rep;
//     // newDef.project = project;
//     // newDef.queue = {
//     //     id: 744,
//     //     name: 'Hosted Ubuntu 1604',
//     //     url: 'https://resser.visualstudio.com/_apis/build/Queues/744',
//     //     pool: { id: 6, name: 'Hosted Ubuntu 1604', isHosted: true }
//     // };
//     // newDef.type = 2;
//     // // @ts-ignore
//     // newDef.process = { yamlFilename: '.azure-pipelines.yml', type: 2 }

//     // const buildApiObject = await connection.getBuildApi();
//     // let createdDef: bi.BuildDefinition = await buildApiObject.createDefinition(newDef, "resser-web-os");

// })()


(async () => {
    // @ts-ignore
    clear()

    const CURR_DIR = process.cwd()
    const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
    const QUESTIONS: inquirer.QuestionCollection = [
        {
            name: 'template',
            type: 'list',
            message: 'Choose template?',
            choices: CHOICES
        },
        {
            name: 'name',
            type: 'input',
            message: 'Please input a new project name:'
        },
        {
            name: 'azureSetup',
            type: 'confirm',
            message: 'Do you want to setup Azure Devops repos?',
        },
    ];
    const AZUREQUESTIONS: inquirer.QuestionCollection = [
        {
            name: 'token',
            type: 'input',
            message: 'Azure devops Personal Access Token (PAT)',
        },
    ];
    const PROJECT = "resser-web-os"

    const answers = await inquirer.prompt(QUESTIONS);
    const template = answers['template'];
    const name = answers['name'];
    const azureSetup = answers['azureSetup'];
    const templatePath = path.join(__dirname, 'templates', template);
    const tartgetPath = path.join(CURR_DIR, name);

    const options: CliOptions = {
        projectName: name,
        templateName: template,
        templatePath,
        tartgetPath,
        currentDir: CURR_DIR
    }

    if (azureSetup) {
        const answersAzure = await inquirer.prompt(AZUREQUESTIONS)
        const token = answersAzure["token"]

        if (!createProject(options)) {
            return;
        }
        createDirectoryContents(templatePath, name, CURR_DIR);
        shell.cd(options.tartgetPath);

        const connection = azureLogin('resser', token)
        const project = await getProject(connection,PROJECT)
        const repo = await createRepo(connection, PROJECT, name)

        shell.exec("git init")
        shell.exec("git add .")
        shell.exec(`git commit -m "initial-commit"`)
        shell.exec(`git push https://create-component-library:${token}@resser.visualstudio.com/${PROJECT}/_git/${name} HEAD:master`)

        const pipeline = await createPipeline(connection,repo,project);
    } else {

        if (!createProject(options)) {
            return;
        }
        createDirectoryContents(templatePath, name, CURR_DIR);
        shell.cd(options.tartgetPath);

        shell.exec("git init")
        shell.exec("git add .")
        shell.exec(`git commit -m "initial-commit"`)
    }
})()