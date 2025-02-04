// app/api/pods/[namespace]/[podName]/delete/route.ts

import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';

export async function DELETE(
  _request: Request,
  context: { params: { namespace: string; podName: string } }
) {
  try {
    const { params } = await Promise.resolve(context);
    const { coreV1Api, appsV1Api } = getK8sClient();

    // Get the pod to find its owner references
    const pod = await coreV1Api.readNamespacedPod({
      name: params.podName,
      namespace: params.namespace,
    });

    // Find the deployment name from pod labels
    const appLabel = pod.metadata?.labels?.app;
    if (!appLabel) {
      throw new Error('Could not find deployment label on pod');
    }

    // Delete the deployment
    await appsV1Api.deleteNamespacedDeployment({
      name: appLabel,
      namespace: params.namespace,
    });

    // Find and delete the associated service
    const services = await coreV1Api.listNamespacedService({
      namespace: params.namespace,
      labelSelector: `deployment=${appLabel}`,
    });

    // Delete any services with matching labels
    for (const service of services.items) {
      if (service.metadata?.name) {
        await coreV1Api.deleteNamespacedService({
          name: service.metadata.name,
          namespace: params.namespace,
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully deleted deployment and associated resources`
    });
  } catch (error: any) {
    console.error('Error deleting resources:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete resources'
      },
      { status: 500 }
    );
  }
}