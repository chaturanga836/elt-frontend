pipeline {
    agent any

    environment {
        DEPLOY_HOST = '13.200.160.10'
        NEXT_PUBLIC_API_URL = 'http://13.200.160.10:8000/api/v1'
        NEXT_PUBLIC_KC_URL = 'http://13.200.160.10:8081'
        NEXT_PUBLIC_KC_REALM = 'workspace-realm'
        NEXT_PUBLIC_KC_CLIENT_ID = 'workspace-web'
        DOCKER_BUILDKIT = '0'
    }

    stages {
        stage('Test') {
            steps {
                sh '''
                    npm ci --legacy-peer-deps
                    npm run lint
                    NEXT_PUBLIC_BUILD_ID=ci \
                    NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
                    NEXT_PUBLIC_KC_URL="${NEXT_PUBLIC_KC_URL}" \
                    NEXT_PUBLIC_KC_REALM="${NEXT_PUBLIC_KC_REALM}" \
                    NEXT_PUBLIC_KC_CLIENT_ID="${NEXT_PUBLIC_KC_CLIENT_ID}" \
                    npm run build
                '''
            }
        }

        stage('Prepare Environment') {
            when { branch 'master' }
            steps {
                sh 'bash jenkins/prepare-env.sh'
            }
        }

        stage('Deploy') {
            when { branch 'master' }
            steps {
                sh 'bash deploy.sh'
            }
        }

        stage('Health') {
            when { branch 'master' }
            steps {
                sh '''
                    set -e
                    echo "=== Frontend health ==="
                    sleep 5
                    for i in $(seq 1 24); do
                      if curl -sf "http://${DEPLOY_HOST}:3000"; then
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
        }
    }
}
