import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';
import * as k8s from '@kubernetes/client-node';

interface Port {
  containerPort: number;
  nodePort: number;
  protocol: 'TCP' | 'UDP';
}

function sanitizeImageName(imageName: string): string {
  // Remove tag if present
  const nameWithoutTag = imageName.split(':')[0];
  
  // Remove registry/organization path if present
  const parts = nameWithoutTag.split('/');
  const baseName = parts[parts.length - 1];
  
  // Replace any invalid characters with '-'
  return baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export async function POST(request: Request) {
  try {
    const { imageName, namespace, ports } = await request.json();
    const { coreV1Api, appsV1Api } = getK8sClient();

    // Create namespace if it doesn't exist
    const namespaceBody = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace
      }
    };

    try {
      await coreV1Api.createNamespace({
        body: namespaceBody
      });
      console.log(`Created namespace ${namespace}`);
    } catch (error: any) {
      // If namespace already exists (409 Conflict), continue
      // Otherwise, throw the error
      console.log(`Using existing namespace ${namespace}`);
    }

    // Parse ports from the input string "containerPort:nodePort,..."
    const portsList: Port[] = ports.split(',').map((portPair: string) => {
      const [containerPort, nodePort] = portPair.trim().split(':');
      return {
        containerPort: parseInt(containerPort),
        nodePort: parseInt(nodePort),
        protocol: 'TCP',
      };
    });

    // Generate names based on image name
    const timestamp = Date.now();
    const baseImageName = sanitizeImageName(imageName);
    const deploymentName = `${baseImageName}-${timestamp}`;
    const serviceName = `${baseImageName}-svc-${timestamp}`;

    // Create deployment
    const deployment: k8s.V1Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: deploymentName,
        namespace: namespace,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: deploymentName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: deploymentName,
            },
          },
          spec: {
            containers: [
              {
                name: 'platform-app',
                image: imageName,
                ports: portsList.map(({ containerPort, protocol }) => ({
                  containerPort,
                  protocol,
                })),
              },
            ],
          },
        },
      },
    };

    await appsV1Api.createNamespacedDeployment({
      namespace: namespace,
      body: deployment,
    });
    console.log('Created deployment');

    // Create service with specified nodePorts
    const service: k8s.V1Service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: serviceName,
        namespace: namespace,
        labels: {
          deployment: deploymentName,
        },
      },
      spec: {
        type: 'NodePort',
        ports: portsList.map((port) => ({
          port: port.containerPort,
          targetPort: port.containerPort,
          nodePort: port.nodePort,
          protocol: port.protocol,
        })),
        selector: {
          app: deploymentName,
        },
      },
    };

    const createdService = await coreV1Api.createNamespacedService({
      namespace: namespace,
      body: service,
    });
    console.log('Created service');

    // Fetch the node IP
    let endpoint = '';
    if (createdService.spec?.ports?.[0]?.nodePort) {
      const nodes = await coreV1Api.listNode();
      const nodeIP = nodes?.items?.[0]?.status?.addresses?.find(
        (address) => address.type === 'InternalIP'
      )?.address;

      if (nodeIP) {
        const nodePort = portsList[0].nodePort;
        endpoint = `http://${nodeIP}:${nodePort}`;
      }
    }

    return NextResponse.json({
      endpoint: endpoint || 'Pending... Please check status after a few moments',
    });
  } catch (error: any) {
    console.error('Error creating resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resources' },
      { status: 500 }
    );
  }
}