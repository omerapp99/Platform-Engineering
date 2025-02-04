// app/components/k8s-dashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface PodInfo {
  name: string;
  status: string;
  endpoint: string;
}

const MetricCard = ({ title, value, unit }: { title: string; value: number | string; unit?: string }) => (
  <div className="bg-slate-800 rounded-lg p-4 min-w-[200px]">
    <div className="text-slate-400 text-sm mb-2">{title}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-white">{value}</span>
      {unit && <span className="text-slate-400">{unit}</span>}
    </div>
  </div>
);

const NamespacesList = ({ namespaces, currentNamespace, onSelect }: { 
  namespaces: string[], 
  currentNamespace: string, 
  onSelect: (ns: string) => void 
}) => (
  <Card className="bg-slate-800 border-slate-700">
    <CardHeader>
      <CardTitle className="text-white">Namespaces</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {namespaces.map((ns) => (
          <Button
            key={ns}
            variant={ns === currentNamespace ? "default" : "ghost"}
            className={`w-full justify-start ${
              ns === currentNamespace 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => onSelect(ns)}
          >
            {ns}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const K8sDashboard = () => {
  const [formData, setFormData] = useState({
    imageName: '',
    namespace: '',
    ports: ''
  });
  
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [podDescription, setPodDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add error timeout function
  const setErrorWithTimeout = (message: string) => {
    setError(message);
    setTimeout(() => {
      setError('');
    }, 5000);
  };
  
  const setEndPointWithTimeout = (message: string) => {
    setEndpoint(message);
    setTimeout(() => {
      setEndpoint('');
    }, 5000);
  };

  const fetchNamespaces = async () => {
    try {
      const response = await fetch('/api/namespaces');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNamespaces(data);
    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to fetch namespaces');
    }
  };

  const handleNamespaceSelect = (namespace: string) => {
    setFormData(prev => ({ ...prev, namespace }));
    setPodDescription('');
    fetchPods();
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  const fetchPods = async () => {
    setError('');
    if (!formData.namespace) {
      setErrorWithTimeout('Please enter a namespace');
      return;
    }
  
    try {
      const response = await fetch(`/api/pods/${formData.namespace}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchNamespaces();
      setPods(data);
    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to fetch pods');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchNamespaces();
      setEndPointWithTimeout(data.endpoint);
      fetchPods();
    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to create deployment');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true); // Start loading
    try {
      const response = await fetch(`/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ namespace: formData.namespace }),
      });
  
      if (!response.ok) throw new Error('Failed to delete namespace');
      setPodDescription('');
      setPods([]);

    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to delete namespace');
    } finally {
      fetchNamespaces();
      setIsDeleting(false); // Stop loading
    }
  };
  

  const describePod = async (podName: string) => {
    setError('');
    try {
      const response = await fetch(`/api/pods/${formData.namespace}/${podName}/describe`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setPodDescription(data.description);
      setSelectedPod(podName);
    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to describe pod');
    }
  };
  
  const deletePod = async (podName: string) => {
    setIsDeleting(true); // Start loading
    try {
      const response = await fetch(`/api/pods/${formData.namespace}/${podName}/delete`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete pod');
      setPodDescription('');
      fetchPods();
    } catch (err) {
      setErrorWithTimeout((err as Error).message || 'Failed to delete pod');
    } finally {
      setIsDeleting(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Platform Engineering Cockpit</h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={fetchPods}
              className="text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Sidebar with Namespaces */}
          <div className="col-span-1">
            <NamespacesList 
              namespaces={namespaces}
              currentNamespace={formData.namespace}
              onSelect={handleNamespaceSelect}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-4 space-y-6">
            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <MetricCard 
                title="Total Pods" 
                value={pods.length} 
                unit="pods"
              />
              <MetricCard 
                title="Running Pods" 
                value={pods.filter(pod => pod.status === 'Running').length} 
                unit="active"
              />
              <MetricCard 
                title="Namespaces" 
                value={namespaces.length}
                unit="total"
              />
              <MetricCard 
                title="Deployment Rate" 
                value="2.2" 
                unit="per day"
              />
            </div>

            {/* Deployment Form and Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">New Deployment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Image Name</label>
                      <Input
                        name="imageName"
                        placeholder="e.g., nginx:latest"
                        value={formData.imageName}
                        onChange={handleInputChange}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Namespace</label>
                      <Input
                        name="namespace"
                        placeholder="e.g., production"
                        value={formData.namespace}
                        onChange={handleInputChange}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Ports Configuration</label>
                      <Input
                        name="ports"
                        placeholder="containerPort:nodePort, e.g., 8080:30000"
                        value={formData.ports}
                        onChange={handleInputChange}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Deploy
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`bg-red-600 hover:bg-red-700 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Namespace'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={fetchPods}
                        className="text-slate-300 border-slate-700 hover:bg-slate-800"
                      >
                        Refresh Pods
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Cards */}
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-900">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {endpoint && (
                  <Alert className="bg-blue-900/50 border-blue-900">
                    <AlertDescription>
                      <span className="text-slate-300">Application Endpoint:</span>{' '}
                      <a href={endpoint} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {endpoint}
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Pods Table */}
            {pods.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Pods in Namespace: <span className="text-blue-400">{formData.namespace}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Pod Name</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Endpoint</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pods.map((pod) => (
                        <TableRow key={pod.name} className="border-slate-700">
                          <TableCell className="text-white font-mono">{pod.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pod.status === 'Running' 
                                ? 'bg-green-900/50 text-green-400' 
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {pod.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {pod.endpoint ? (
                              <a 
                                href={pod.endpoint} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                {pod.endpoint}
                              </a>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => describePod(pod.name)}
                                className="text-slate-300 border-slate-700 hover:bg-slate-700"
                                size="sm"
                              >
                                Describe
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => deletePod(pod.name)}
                                size="sm"
                                className="bg-red-900 hover:bg-red-800"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Pod Description */}
            {selectedPod && podDescription && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Pod Description: {selectedPod}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-slate-300 font-mono text-sm">
                    {podDescription}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default K8sDashboard;