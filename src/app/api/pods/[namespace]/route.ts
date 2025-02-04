// app/api/pods/[namespace]/route.ts
import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';

export async function GET(
  request: Request,
  context: { params: { namespace: string } }
) {
  try {
    const { params } = context;
    const { coreV1Api } = getK8sClient();
    
    // Get all pods in the namespace
    const podsResponse = await coreV1Api.listNamespacedPod({ 
      namespace: params.namespace 
    });

    // Get all services in the namespace
    const servicesResponse = await coreV1Api.listNamespacedService({ 
      namespace: params.namespace 
    });

    // Get node info for the endpoint URL
    const nodesResponse = await coreV1Api.listNode();
    const nodeIP = nodesResponse.items[0]?.status?.addresses?.find(
      addr => addr.type === 'InternalIP'
    )?.address;

    // Create a map of app label -> service for quick lookups
    const serviceMap = new Map();
    servicesResponse.items.forEach(service => {
      if (service.spec?.selector?.app) {
        serviceMap.set(service.spec.selector.app, service);
      }
    });

    // Map pods with their endpoints
    const pods = podsResponse.items.map(pod => {
      let endpoint = '';
      
      // Find matching service based on app label
      const appLabel = pod.metadata?.labels?.app;
      if (appLabel && nodeIP) {
        const service = serviceMap.get(appLabel);
        if (service?.spec?.ports?.[0]?.nodePort) {
          endpoint = `http://${nodeIP}:${service.spec.ports[0].nodePort}`;
        }
      }

      return {
        name: pod.metadata?.name || '',
        status: pod.status?.phase || 'Unknown',
        endpoint,
      };
    });
    
    return NextResponse.json(pods);
  } catch (error: any) {
    console.error('Error fetching pods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pods' },
      { status: 500 }
    );
  }
}