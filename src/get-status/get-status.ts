import * as core from '@actions/core'
import {ActionInput, ActionOutput} from '../types'
import {context} from '@actions/github'
import {fetchChecks} from '../fetch-checks'

export async function getStatus({
  ref,
  token,
  ignore = []
}: ActionInput): Promise<ActionOutput> {
  const checks = await fetchChecks({ref, token})
  const checkRuns = checks?.check_runs

  if (!checkRuns) {
    core.info(`Check Runs could not be fetched`)
    return {
      allChecksCompleted: false,
      allChecksPassed: false
    }
  }

  const ignoredCheckRunNames = ['get-status', context.job, ...ignore]

  core.info(`Number of check runs: ${checkRuns.length}`)
  core.debug(`Current Job: ${context.job}`)
  core.info(`Ignored checks: ${ignoredCheckRunNames.join(', ')}`)
  core.debug(`Check Runs: ${JSON.stringify(checkRuns)}`)
  core.debug(`Context: ${JSON.stringify(context)}`)

  const previousCheckRuns = checkRuns.filter(
      checkRun => {
          core.debug(`Filter Check Run: ${checkRun.name} ${ignoredCheckRunNames.includes(checkRun.name)}`);
          return !ignoredCheckRunNames.includes(checkRun.name)
      }
  )

  const hasNoOtherCheckRuns =
    !previousCheckRuns || previousCheckRuns.length === 0

  if (hasNoOtherCheckRuns) {
    return {
      allChecksCompleted: true,
      allChecksPassed: true
    }
  }

    const allChecksCompleted = previousCheckRuns.every(checkRun => {
        core.debug(`Check Run Completed: ${checkRun.status}, ${checkRun.name}`);
        return checkRun.status === 'completed'
  })

    const allChecksPassed = previousCheckRuns.every(checkRun => {
        core.debug(`Check Run Passes: ${checkRun.conclusion}, ${checkRun.name}`);
    return (
      checkRun.conclusion === 'success' ||
      checkRun.conclusion === 'neutral' ||
      checkRun.conclusion === 'skipped'
    )
  })

  return {
    allChecksCompleted: allChecksCompleted || false,
    allChecksPassed: allChecksPassed || false
  }
}
