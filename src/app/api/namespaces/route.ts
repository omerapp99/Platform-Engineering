// app/api/namespaces/route.ts
import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';

export async function GET() {
  try {
    const { coreV1Api } = getK8sClient();
    
    const response = await coreV1Api.listNamespace();
    const namespaces = response.items.map(ns => ns.metadata?.name || '');
    
    return NextResponse.json(namespaces.filter(Boolean));
  } catch (error: any) {
    console.error('Error fetching namespaces:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch namespaces' },
      { status: 500 }
    );
  }
}