// app/api/pods/[namespace]/[podName]/describe/route.ts

import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';
import { V1Pod, V1Container, V1ContainerPort } from '@kubernetes/client-node';

export async function GET(
  _request: Request,
  context: { params: { namespace: string; podName: string } }
) {
  try {
    const { params } = await context;
    const { coreV1Api } = getK8sClient();
    
    const pod: V1Pod = await coreV1Api.readNamespacedPod({
      name: params.podName,
      namespace: params.namespace,
    });

    // Format pod information
    const description = `Name:         ${pod.metadata?.name}
Namespace:    ${pod.metadata?.namespace}
Priority:     ${pod.spec?.priority || 'N/A'}
Node:         ${pod.spec?.nodeName || 'N/A'}
Start Time:   ${pod.status?.startTime || 'N/A'}
Labels:       ${Object.entries(pod.metadata?.labels || {})
  .map(([key, value]) => `${key}=${value}`)
  .join(', ') || 'N/A'}
Status:       ${pod.status?.phase || 'Unknown'}
IP:           ${pod.status?.podIP || 'N/A'}
Containers:   ${pod.spec?.containers.map((container: V1Container) => `
  ${container.name}:
    Image:    ${container.image}
    Ports:    ${container.ports?.map((port: V1ContainerPort) => `${port.containerPort}/${port.protocol}`).join(', ') || 'N/A'}
    State:    ${Object.keys(pod.status?.containerStatuses?.find(cs => cs.name === container.name)?.state || {}).join(', ') || 'Unknown'}`
).join('\n') || 'N/A'}
Events:       Use 'kubectl describe pod ${pod.metadata?.name}' for events.`;

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error describing pod:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to describe pod' },
      { status: 500 }
    );
  }
}