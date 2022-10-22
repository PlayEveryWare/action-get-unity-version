import * as core from '@actions/core'
import * as glob from 'glob'
import * as fs from 'fs'

async function run(): Promise<void> {

  core.saveState('isPost', true)

  try {
    // Verify inputs
    const projectPath = core.getInput('path')
    if (!projectPath) {
      throw new Error('No path supplied to the action')
    }

    const paths = glob.sync(`${projectPath}/**/ProjectSettings/ProjectVersion.txt`) || []
    if (paths.length != 1) {
      throw new Error(`Found ${paths.length} matches for ProjectVersion.txt. Need exactly 1`)
    }

    const data = fs.readFileSync(paths[0]).toString()
    const lines = data.split('\n')

    const versionRegExp = new RegExp('^m_EditorVersion: (.*)$')
    for (const line of lines) {
      const match = versionRegExp.exec(line)
      if (match) {
        core.setOutput('version', match[1])
        return
      }
    }

    throw new Error(`Failed to find m_EditorVersion line in ${paths[0]}`)

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
