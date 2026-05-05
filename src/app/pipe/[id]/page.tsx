'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { PipelineService } from '@/services/pipe.service';


const CONNECTIONS_DATA = [
  { id: 1, name: 'Weather API', desc: 'Fetch rain data', color: '#1890ff', key: 'weather' },
  { id: 2, name: 'Binance', desc: 'Get BTC rates', color: '#fadb14', key: 'crypto' },
  { id: 3, name: 'Postgres DB', desc: 'Local database', color: '#3e63dd', key: 'postgres' },
  { id: 4, name: 'Trino/Hudi', desc: 'Data lakehouse', color: '#e67e22', key: 'trino' },
];

export default function Home() {

  const params = useParams();
  const id = params.id;
  const { setPipeline, setId } = usePipelineStore();

  const calculateLayout = (tasks: any[]) => {
    console.info("Calculating layout for tasks:", tasks);
    const nodePositions: Record<string, { x: number, y: number }> = {};
    const SPACING_X = 250;
    const SPACING_Y = 100;

    // 1. Helper to find the depth of a node
    const getDepth = (taskKey: string, currentTasks: any[], visited = new Set()): number => {
      const task = currentTasks.find(t => t.task_key === taskKey);
      if (!task || !task.depends_on || task.depends_on.length === 0) return 0;

      // Prevent infinite loops just in case
      if (visited.has(taskKey)) return 0;
      visited.add(taskKey);

      const depths = task.depends_on.map((parentKey: string) =>
        getDepth(parentKey, currentTasks, visited)
      );
      return Math.max(...depths) + 1;
    };

    // 2. Assign positions based on depth
    const layerCounts: Record<number, number> = {};

    return tasks.map((task) => {
      const depth = getDepth(task.task_key, tasks);

      // Track how many nodes are in this horizontal layer to stack them vertically
      if (!layerCounts[depth]) layerCounts[depth] = 0;
      const verticalIndex = layerCounts[depth];
      layerCounts[depth]++;

      return {
        ...task,
        x: depth * SPACING_X,
        y: verticalIndex * SPACING_Y + 150 // 150 is a starting offset
      };
    });
  };

  useEffect(() => {
    const hydrateCanvas = async () => {
      if (!id || id === 'new') return;

      try {
        const response = await PipelineService.getPipeline(id as string);
        const { pipeline, tasks } = response;
        console.info("Fetched pipeline tasks:", tasks);
        const tasksWithLayout = calculateLayout(tasks);
        console.info("Tasks after layout calculation:", tasksWithLayout);
        // 1. Reconstruct Nodes
        const initialNodes = tasksWithLayout.map((task: any) => {
          // Find the visual config based on the connection_id from the DB
          const visualConfig = CONNECTIONS_DATA.find(c => c.id === task.connection_id);

          return {
            id: task.task_key,
            type: 'task', // Make sure this matches the key in your nodeTypes object
            position: { x: task.x, y: task.y },
            data: {
              label: task.task_key,
              connectionId: task.connection_id,
              config: visualConfig, // This feeds the 'selected' state in TaskNode
              code: task.logic?.transform_code || "# Write your logic here",
              // Pass the store's update function so the node can save changes
              onConfigChange: (nodeId: string, newItem: any) => {
                // This should call your Zustand updateNodeData method
                usePipelineStore.getState().updateNodeData(nodeId, {
                  connectionId: newItem.id,
                  config: newItem
                });
              }
            },
          };
        });

        // 2. Reconstruct Edges from depends_on
        const initialEdges: any[] = [];
        tasks.forEach((task: any) => {
          if (task.depends_on && task.depends_on.length > 0) {
            task.depends_on.forEach((parentKey: string) => {
              initialEdges.push({
                id: `e-${parentKey}-${task.task_key}`,
                source: parentKey,
                target: task.task_key,
                type: 'code',
                animated: true,
              });
            });
          }
        });
        const pipe_id = pipeline.id;
        const uuid = pipeline.pipeline_uuid
        // 3. Update Store
        setPipeline(pipe_id, uuid,initialNodes, initialEdges, pipeline.name);
        setId(pipe_id);

      } catch (error) {
        console.error("Hydration Error:", error);
      }
    };

    hydrateCanvas();
  }, [id, setPipeline]);

  return (
    <React.Fragment>

      <PipelineCanvas />
    </React.Fragment>);
}