import { NextResponse } from 'next/server';
import { getK8sClient } from '@/lib/k8s-config';

export async function DELETE(request: Request) {
  try {
    const { namespace } = await request.json();
    const { coreV1Api } = getK8sClient();

    console.log(`Deleting namespace: ${namespace}`);

    // Delete the namespace, which will cascade and remove all resources inside.
    await coreV1Api.deleteNamespace({
        name: namespace,
        body: {} // V1DeleteOptions; an empty object is acceptable if you don't have additional options
      });
      

    return NextResponse.json({ success: true, message: `Namespace ${namespace} and all its resources have been deleted.` });
  } catch (error: any) {
    console.error('Error deleting namespace:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete namespace' },
      { status: 500 }
    );
  }
}
