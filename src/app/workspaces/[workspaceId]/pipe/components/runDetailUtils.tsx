import React from 'react';
import { Tag } from 'antd';
import {
    SyncOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';

export const RUN_STATUS_INITIALIZING = 1;
export const RUN_STATUS_SUCCESS = 2;
export const RUN_STATUS_FAILED = 3;

export function canViewRunDetail(status: number): boolean {
    return status === RUN_STATUS_SUCCESS || status === RUN_STATUS_FAILED;
}

export function statusTag(statusValue: number) {
    if (statusValue === RUN_STATUS_INITIALIZING) {
        return <Tag icon={<SyncOutlined spin />} color="processing">Initializing</Tag>;
    }
    if (statusValue === RUN_STATUS_SUCCESS) {
        return <Tag icon={<CheckCircleOutlined />} color="success">Success</Tag>;
    }
    return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
}

export function formatJsonBlock(value: unknown) {
    if (value === null || value === undefined) {
        return '—';
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}
