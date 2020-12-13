import fs from 'fs'
import {CliOptions} from '../index'
import chalk from 'chalk';
import path from 'path';
import {render} from '../utils/template'

export const createProject = (options:CliOptions)=>{
    if (fs.existsSync(options.tartgetPath)) {
        console.log(chalk.red(`Folder ${options.tartgetPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(options.tartgetPath);

    return true;
}


export const createDirectoryContents = (templatePath: string, projectName: string, currentDir: string) => {
    const SKIP_FILES = ['node_modules', '.template.json'];
    const filesToCreate = fs.readdirSync(templatePath);
    filesToCreate.forEach(file => {
        const origFilePath = path.join(templatePath, file);

        const stats = fs.statSync(origFilePath);

        if (SKIP_FILES.indexOf(file) > -1) return;

        if (stats.isFile()) {
            let contents = fs.readFileSync(origFilePath, 'utf8');
            contents = render(contents, { projectName: projectName });
            const writePath = path.join(currentDir, projectName, file);
            fs.writeFileSync(writePath, contents, 'utf8');
        } else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(currentDir, projectName, file));
            createDirectoryContents(path.join(templatePath, file), path.join(projectName, file), currentDir);
        }
    });
}