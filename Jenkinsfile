pipeline {
    agent any

    environment {
        DEPLOY_HOST = '13.200.160.10'
        NEXT_PUBLIC_API_URL = 'https://13.200.160.10/api/v1'
        NEXT_PUBLIC_KC_URL = 'https://13.200.160.10'
        NEXT_PUBLIC_KC_REALM = 'workspace-realm'
        NEXT_PUBLIC_KC_CLIENT_ID = 'workspace-web'
        DOCKER_BUILDKIT = '0'
    }

    stages {
        stage('Test') {
            steps {
                sh 'bash jenkins/run-tests.sh'
            }
        }

        stage('Prepare Environment') {
            when {
                expression {
                    def b = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    return b.contains('master')
                }
            }
            steps {
                sh 'bash jenkins/prepare-env.sh'
            }
        }

        stage('Deploy') {
            when {
                expression {
                    def b = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    return b.contains('master')
                }
            }
            steps {
                sh 'bash deploy.sh'
            }
        }

        stage('Health') {
            when {
                expression {
                    def b = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    return b.contains('master')
                }
            }
            steps {
                sh '''
                    set -e
                    echo "=== Frontend health ==="
                    sleep 5
                    for i in $(seq 1 24); do
                      if curl -kfs "https://${DEPLOY_HOST}/"; then
                        echo "Frontend OK"
                        exit 0
                      fi
                      if [ "$i" -eq 24 ]; then exit 1; fi
                      sleep 5
                    done
                '''
            }
        }
    }

    post {
        always {
            sh 'bash jenkins/docker-prune.sh || true'
        }
        failure {
            sh 'docker logs etl-frontend --tail 120 || docker logs etl-frontend-container --tail 120 || true'
            sh 'docker logs elt-frontend-proxy --tail 80 || true'
        }
    }
}
