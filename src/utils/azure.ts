import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";
import GitApi from "azure-devops-node-api/GitApi";
import { BuildDefinition, BuildRepository } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { TeamProject } from "azure-devops-node-api/interfaces/CoreInterfaces";
import GitInterfaces, { GitRepository } from "azure-devops-node-api/interfaces/GitInterfaces";

export const azureLogin = (organization: string, token: string): WebApi => {
    const orgUrl = `https://dev.azure.com/${organization}`;
    console.log(token);

    const authHandler = getPersonalAccessTokenHandler(token, true);
    let connection = new WebApi(orgUrl, authHandler);
    return connection;
}

export const createRepo = async (connection: WebApi, project: string, repoName: string): Promise<GitRepository> => {
    const gitApiObject: GitApi.IGitApi = await connection.getGitApi();

    const createOptions: GitInterfaces.GitRepositoryCreateOptions = <GitInterfaces.GitRepositoryCreateOptions>{ name: repoName };
    const newRepo: GitInterfaces.GitRepository = await gitApiObject.createRepository(createOptions, project);

    return newRepo
}

export const getRepo = async (connection: WebApi, project: TeamProject, repoName: string): Promise<GitRepository> => {
    const gitApiObject: GitApi.IGitApi = await connection.getGitApi();

    const repos: GitInterfaces.GitRepository[] = await gitApiObject.getRepositories(project.name);


    let returnRepo: GitRepository = {}
    repos.forEach((repo) => {
        if (repo.name === repoName) {
            returnRepo = repo
        }
    })
    if (returnRepo == {}) {
        throw new Error(`No repository was found for this project with name: ${repoName}`);
    }
    return returnRepo
}

export const getProject = async (connection: WebApi, projectName: string): Promise<TeamProject> => {
    const coreApiObject = await connection.getCoreApi();

    const project = await coreApiObject.getProject(projectName);

    return project
}

export const createPipeline = async (connection: WebApi, repo: GitRepository, project: TeamProject): Promise<BuildDefinition> => {
    const buildApiObject = await connection.getBuildApi();

    const buildRepo: BuildRepository = repo;
    buildRepo.type = 'TfsGit'
    buildRepo.properties = {
        cloneUrl: `https://resser.visualstudio.com/resser-web-os/_git/${repo.name}`,
        defaultBranch: "refs/heads/master",
        fullName: repo.name || "",
        isFork: "False",
        reportBuildStatus: "true",
        safeRepository: repo.id || ""
    }

    const pipeline: BuildDefinition = <BuildDefinition>{};
    pipeline.name = repo.name;
    pipeline.repository = buildRepo;
    pipeline.project = project;
    pipeline.queue = {
        id: 744,
        name: 'Hosted Ubuntu 1604',
        url: 'https://resser.visualstudio.com/_apis/build/Queues/744',
        pool: { id: 6, name: 'Hosted Ubuntu 1604', isHosted: true }
    };
    pipeline.type = 2;
    pipeline.triggers = [{
        // @ts-ignore
        batchChanges: false,
        branchFilters: [
        ],
        maxConcurrentBuildsPerBranch: 1,
        pathFilters: [
        ],
        settingsSourceType: 2,
        triggerType: 2
    }]
    // @ts-ignore
    pipeline.process = { yamlFilename: '.azure-pipelines.yml', type: 2 }

    const createdDef: BuildDefinition = await buildApiObject.createDefinition(pipeline, "resser-web-os");

    return createdDef
}