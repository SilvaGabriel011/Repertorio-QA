// Declarative pipeline — mirrors the GitHub Actions gates so the portfolio runs
// the same quality strategy on either CI. Ordered simplest → most complex:
// a cheap gate that fails vetoes the expensive ones after it.
pipeline {
  agent any

  tools {
    nodejs 'node-22' // NodeJS plugin tool; adjust the name to your Jenkins config
  }

  options {
    timestamps()
    ansiColor('xterm')
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    CI = 'true'
    JUNIT_DIR = 'test-results/junit'
  }

  stages {
    stage('Install') {
      steps {
        sh 'node --version && npm --version'
        sh 'npm ci'
        sh 'npx playwright install --with-deps chromium'
        sh 'mkdir -p $JUNIT_DIR'
      }
    }

    stage('Gate 1 — Static, Unit, Integration, Contract') {
      steps {
        sh 'npm run typecheck'
        sh 'JUNIT_OUTPUT=$JUNIT_DIR/vitest.xml npx vitest run'
      }
    }

    stage('Gate 2 — Smoke') {
      steps {
        sh 'npm run test:smoke'
      }
    }

    stage('Gate 2 — Functional (api, security, a11y, regression, e2e)') {
      steps {
        sh 'npx playwright test --project=api --project=security --project=a11y --project=regression --project=e2e'
      }
    }

    stage('Gate 3 — BDD (Cucumber)') {
      steps {
        sh 'npm run test:bdd -- --format json:test-results/cucumber.json'
      }
    }

    stage('Gate 4 — Load baseline (k6)') {
      steps {
        sh 'npx tsx src/api/server.ts & echo $! > .sut.pid'
        sh 'timeout 30 bash -c "until curl -sf http://localhost:3000/health; do sleep 1; done"'
        sh 'k6 run --summary-export=test-results/k6-summary.json tests/load/baseline.js'
      }
      post {
        always {
          sh 'kill $(cat .sut.pid) || true'
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'test-results/junit/*.xml'
      archiveArtifacts artifacts: 'playwright-report/**, test-results/**, reports/**', allowEmptyArchive: true
      // With the Cucumber Reports plugin installed:
      // cucumber fileIncludePattern: 'test-results/cucumber.json'
    }
    failure {
      echo 'Pipeline failed — the first red gate is the diagnosis; later gates were skipped by design.'
    }
  }
}
