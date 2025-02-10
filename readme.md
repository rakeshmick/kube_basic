# Project Setup and Deployment Guide

This guide provides step-by-step instructions on how to set up and deploy a full-stack application with a React frontend, an Express backend, and a Redis database using Docker and Kubernetes.

Created the main repo using npm init -y

create a folder name 'packages'

Our my-app and backend will exist inside the packages folder

cd to packages and using create-react-app

### Create the React App:

create my app using command

npm create-react-app my-app

I had and error with ajv not installed in the my-app React all so , I additionally installeed

npm install ajv --save-dev in my-app

Since it is a monorepo
Configure package.json for Workspaces: Update the package.json to include workspaces:
in the root folder package.json

added :

```
{
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
}
```

First to set up redis in local to make the app works fine wiht the backend:

Ensure Redis is Installed: If Redis is not installed, you can install it using Homebrew on macOS:

Start the Redis Server

Check if Redis is running

### Create the Express API:

Setup the Express Server: Create index.js in packages/backend

and Update frontend to Fetch Data from backend: Update App.js in packages/frontend/src:

## Prerequisites

- Docker
- Kubernetes (e.g., Docker Desktop with Kubernetes enabled)
- kubectl
- Node.js and npm

## Project Structure

## Step 1: Set Up the Backend

### 1.1 Create the Backend Code

Create the backend code in `packages/backend/index.js` (or `index.ts` if using TypeScript):

```javascript
const express = require("express");
const cors = require("cors");
const { createClient } = require("redis");

const app = express();
const port = 3001;

const client = createClient({
  url: "redis://redis-service:6379",
});

client.on("error", (err) => console.error("Redis Client Error", err));

app.use(cors());
app.use(express.json());

app.get("/user", async (req, res) => {
  const user = await client.get("user");
  res.json(JSON.parse(user || "{}"));
});

app.post("/user", async (req, res) => {
  const user = req.body;
  await client.set("user", JSON.stringify(user));
  res.status(201).send("User saved");
});

client.connect().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
```

### 1.2 Create the Backend Dockerfile

Create the Dockerfile in `packages/backend/Dockerfile`:

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . ./

EXPOSE 3001

CMD ["npm", "start"]
```

## Step 2: Set Up the Frontend

### 2.1 Create the Frontend Code

Create the frontend code in `packages/frontend/src/App.tsx`:

```typescript
import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

interface User {
  address: string;
  name: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:30001/user")
      .then((response) => response.json())
      .then((data) => setUser(data))
      .catch((error) => console.error("Error fetching user data:", error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>User Information</h1>
        {user ? (
          <div>
            <p>Address: {user.address}</p>
            <p>Name: {user.name}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
```

### 2.2 Create the Frontend Dockerfile

Create the Dockerfile in `packages/frontend/Dockerfile`:

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . ./

RUN REACT_APP_API_URL=http://backend-service:3001 npm run build

EXPOSE 3000

CMD ["npx", "serve", "-s", "build"]
```

## Step 3: Set Up Redis with Kubernetes

### 3.1 Create the Redis Deployment and Service

Create the Redis deployment and service in `k8s/redis-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:latest
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
    - protocol: TCP
      port: 6379
      targetPort: 6379
  type: ClusterIP
```

### 3.2 Create the Backend Deployment and Service

Create the backend deployment and service in `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: <your-dockerhub-username>/my-backend-image:latest
          ports:
            - containerPort: 3001
          imagePullPolicy: IfNotPresent
          env:
            - name: REDIS_URL
              value: "redis://redis-service:6379"
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 3001
      targetPort: 3001
      nodePort: 30001
  type: NodePort
```

### 3.3 Create the Frontend Deployment and Service

Create the frontend deployment and service in `k8s/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: <your-dockerhub-username>/my-app:latest
          ports:
            - containerPort: 3000
          imagePullPolicy: IfNotPresent
          env:
            - name: REACT_APP_API_URL
              value: "http://backend-service:3001"
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
      nodePort: 30080
  type: NodePort
```

### Step 5: Build and Push Docker Images

5.1 Build and Push the Backend Image

## Navigate to the backend directory

cd /Users/rakeshprabhakaran/dev/js/tscicd/packages/backend

## Build the Docker image

docker build -t <your-dockerhub-username>/my-backend-image:latest .

## Push the image to Docker Hub

docker push <your-dockerhub-username>/my-backend-image:latest

### 5.2 Build and Push the Frontend Image

## Navigate to the frontend directory

cd /Users/rakeshprabhakaran/dev/js/tscicd/packages/my-app

## Build the Docker image

docker build -t <your-dockerhub-username>/my-app:latest .

## Tag your docker image in local regiosrty

docker tag my-app:latest my-app:latest

## Push the image to Docker Hub

docker push <your-dockerhub-username>/my-app:latest

### Starting services in K8

kubectl apply -f /tscicd/k8s/redis-deployment.yaml
kubectl apply -f /tscicd/k8s/backend-deployment.yaml
kubectl apply -f /tscicd/k8s/my-app.yaml

to see the pods
kubctl get pods

to see service :
kubectl get service

You will see the ports in which the endpoints are exposed:

```
kubernetes        ClusterIP   <ip>       <none>        443/TCP          5d19h
my-app            NodePort   <ip>        <none>        80:30080/TCP     16m

```
