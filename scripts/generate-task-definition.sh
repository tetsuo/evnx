#!/bin/sh

cat > evnx-task-definition.json <<EOF
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
      "name": "evnx",
      "environment": [],
      "links": [],
      "image": "$AWS_REGISTRY_URL/evnx:site-release",
      "command": [],
      "cpu": 1
    }
]
EOF
