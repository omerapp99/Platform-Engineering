# k8s-dashboard

## Overview
The k8s-dashboard is a web-based Kubernetes user interface. It allows developers to deploy their Docker images for testing in namespaces.

## Features
- Namespace management
- Resource monitoring
- Log viewing
- Deployment management

## Prerequisites
- Kubernetes cluster
- kubectl configured to communicate with your cluster

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/omerapp99/Platform-Engineering
    cd k8s-dashboard
    ```
2. Install dependencies:
    ```bash
    npm install
    ```

## Usage
1. Start the development server:
    ```bash
    npm run dev
    ```
2. Open your web browser and navigate to:
    ```
    http://localhost:3000
    ```

## How to Use
1. **Namespaces**: Select a namespace from the sidebar to view and manage resources within that namespace. To create a new namespace, write its name in the namespace input field and deploy a new image.
2. **Deployments**: Use the "New Deployment" form to deploy a Docker image. Enter the image name, namespace, and ports configuration, then click "Deploy".
3. **Pods**: View the list of pods in the selected namespace. You can describe or delete individual pods using the actions provided.
4. **Metrics**: Monitor the total number of pods, running pods, namespaces, and deployment rate from the metrics section.
5. **Refresh**: Use the "Refresh" button to update the list of pods and namespaces.