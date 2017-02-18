#!/bin/sh

cat > evanup-task-definition.json <<EOF
[
    {
      "volumesFrom": [],
      "memory": 300,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80,
          "protocol": "tcp"
        },
        {
          "hostPort": 443,
          "containerPort": 443,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "entryPoint": [],
      "mountPoints": [],
      "name": "evanup",
      "environment": [],
      "links": [],
      "image": "$AWS_REGISTRY_URL/evanup:site-release",
      "command": [],
      "cpu": 1
    }
]
EOF
