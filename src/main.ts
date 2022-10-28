import * as core from '@actions/core'
import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'

function findProjectVersion(): string {
    const projectVersion = core.getInput('project-version')
    if (projectVersion) {
      return projectVersion
    }

    // Verify inputs
    const projectPath = core.getInput('path')
    if (!projectPath) {
      throw new Error('No path or project-version supplied to the action')
    }

    const paths = glob.sync(`${projectPath}/**/ProjectSettings/ProjectVersion.txt`) || []
    if (paths.length != 1) {
      for (const path of paths) {
        core.error(path);
      }
      throw new Error(`Found ${paths.length} matches for ProjectVersion.txt. Need exactly 1`)
    }

    return paths[0]
}

async function run(): Promise<void> {

  core.saveState('isPost', true)

  try {
    const projectVersion = findProjectVersion();

    const data = fs.readFileSync(projectVersion).toString()
    const lines = data.split('\n')

    const versionRegExp = new RegExp('^m_EditorVersion: (.*)$')
    for (const line of lines) {
      const match = versionRegExp.exec(line)
      if (match) {
        core.setOutput('version', match[1])

        const versionPath = path.dirname(fs.realpathSync(projectVersion))
        const projectPath = fs.realpathSync(path.join(versionPath, ".."))
        core.setOutput('project-path', projectPath)
        return
      }
    }

    throw new Error(`Failed to find m_EditorVersion line in ${projectVersion}`)

  } catch (err: any) {
    if (err instanceof Error) {
      const error = err as Error
      core.setFailed(error.message)
    } else {
      throw(err)
    }
  }
}

run()
