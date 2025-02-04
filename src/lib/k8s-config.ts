import * as k8s from '@kubernetes/client-node';

interface K8sClient {
  coreV1Api: k8s.CoreV1Api;
  appsV1Api: k8s.AppsV1Api;
  networkingV1Api: k8s.NetworkingV1Api;
  rbacApi: k8s.RbacAuthorizationV1Api;
}

export function getK8sClient(): K8sClient {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  
  return {
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),
    appsV1Api: kc.makeApiClient(k8s.AppsV1Api),
    networkingV1Api: kc.makeApiClient(k8s.NetworkingV1Api),
    rbacApi: kc.makeApiClient(k8s.RbacAuthorizationV1Api)
  };
}