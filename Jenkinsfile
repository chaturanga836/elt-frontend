pipeline {
    agent { label 'docker' }

    stages {
        stage('Test') {
            steps {
                sh '''
                    npm ci --legacy-peer-deps
                    npm run lint
                    npm run build
                '''
            }
            environment {
                NEXT_PUBLIC_BUILD_ID = 'ci'
                NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1'
                NEXT_PUBLIC_KC_URL = 'http://localhost:8081'
                NEXT_PUBLIC_KC_REALM = 'workspace-realm'
                NEXT_PUBLIC_KC_CLIENT_ID = 'workspace-web'
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
                sh 'curl -sf http://127.0.0.1:3000'
            }
        }
    }
}
